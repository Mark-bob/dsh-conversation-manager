/**
 * Host half of the Conversation Cleaner bundle.
 *
 * It owns three authenticated Fetch routes on the Host Connection channel:
 *
 *   /api/conversation-cleaner
 *     GET  -> every stored conversation with title, path, size, archive state
 *             and delete eligibility (a parent of other sessions is blocked).
 *     POST -> { ids: SessionId[] }, removing each conversation's stored log
 *             directory plus its projection-cache row. A conversation still held
 *             by a live Agent is stopped (archived with stopActivity) first.
 *
 *   /api/conversation-cleaner-archive
 *     POST -> { action: 'archive' | 'unarchive', ids: SessionId[] } through the
 *             durable workspace registry that the sidebar itself reads.
 *
 *   /api/conversation-cleaner-attachments
 *     GET  -> an attachment scan: which stored attachment objects no stored
 *             conversation refers to any more, split by a safety age threshold.
 *     POST -> { action: 'delete', ids: string[] }, re-scanning first and removing
 *             only objects that are still unreferenced and old enough.
 *
 * The destructive file work lives in `createCleaner`, which takes its
 * dependencies as arguments so the same code can be exercised without a Host.
 */
import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

/** Stored Session ids are `session-<uuid>`. Anything else is refused outright. */
const SESSION_ID = /^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A directory only counts as a Session directory when it holds a log generation. */
const SESSION_LOG_FILE = /^session\.v\d+\.jsonl(\.zstd)?$/i

/** Attachment objects are content-addressed under `attachments/v1/objects/<2>/<hash>`. */
const ATTACHMENT_HASH = /^[0-9a-f]{64}$/i
const ATTACHMENT_BUCKET = /^[0-9a-f]{2}$/i

/** A freshly written object may belong to an upload not yet committed to a log. */
const ATTACHMENT_MIN_AGE_MS = 24 * 60 * 60 * 1000

const ROUTE_PATH = '/api/conversation-cleaner'
const ARCHIVE_ROUTE_PATH = '/api/conversation-cleaner-archive'
const PIN_ROUTE_PATH = '/api/conversation-cleaner-pin'
const ATTACHMENT_ROUTE_PATH = '/api/conversation-cleaner-attachments'
const MAX_IDS_PER_REQUEST = 200

export const inject = ['connection', 'sessionPersistence']

/** The Harness home whose `sessions/` tree this process writes. */
function defaultHome() {
  const fromEnv = process.env.DSH_HOME
  return fromEnv && fromEnv.trim() !== '' ? fromEnv : path.join(homedir(), '.dsh')
}

function failure(id, code, detail) {
  return detail === undefined ? { id, ok: false, code } : { id, ok: false, code, detail }
}

/**
 * Build the cleaner over one Harness home.
 *
 * @param {object} options
 * @param {string} options.home              Harness home directory.
 * @param {{ list(): Promise<unknown[]>, stat(id: string): Promise<unknown> }} options.persistence
 *        `ctx.sessionPersistence` (or a test double).
 * @param {(id: string) => boolean} [options.isLive]
 *        Returns true while the Session is held by an Agent or the Session store.
 * @param {string} [options.sessionsRoot]    Override for the `sessions/` tree.
 * @param {string} [options.projectionRoot]  Override for the projection-cache rows.
 */
export function createCleaner(options) {
  const home = path.resolve(options.home)
  const persistence = options.persistence
  const isLive = options.isLive ?? (() => false)
  const sessionsRoot = path.resolve(options.sessionsRoot ?? path.join(home, 'sessions'))
  const projectionRoot = path.resolve(
    options.projectionRoot ?? path.join(home, 'storages', 'session_projcache', 'sessions'),
  )

  /** Count child Sessions per parent so a parent with descendants is never removed. */
  function childCounts(headers) {
    const counts = new Map()
    for (const header of headers) {
      const parent = header?.parentSession
      if (typeof parent === 'string' && parent !== '') {
        counts.set(parent, (counts.get(parent) ?? 0) + 1)
      }
    }
    return counts
  }

  async function listSnapshots() {
    const snapshots = await persistence.list()
    const headers = snapshots.map((snapshot) => snapshot.header ?? {})
    return { snapshots, counts: childCounts(headers) }
  }

  async function listSessions() {
    const { snapshots, counts } = await listSnapshots()
    const sessions = snapshots.map((snapshot) => {
      const header = snapshot.header ?? {}
      const id = String(header.id ?? '')
      const live = isLive(id)
      const children = counts.get(id) ?? 0
      return {
        id,
        title: null,
        cwd: typeof header.cwd === 'string' ? header.cwd : null,
        createdAt: typeof header.createdAt === 'number' ? header.createdAt : null,
        sizeBytes: typeof snapshot.sizeBytes === 'number' ? snapshot.sizeBytes : null,
        eventCount: typeof snapshot.eventCount === 'number' ? snapshot.eventCount : null,
        formatStatus: snapshot.formatStatus ?? null,
        subagent: header.origin === 'subagent',
        parentSession: typeof header.parentSession === 'string' ? header.parentSession : null,
        live,
        childCount: children,
        // Being open in the GUI no longer blocks deletion: the Host stops a
        // running turn before removing the files, and only a parent that still
        // has descendants is genuinely unsafe to remove.
        deletable: children === 0,
      }
    })
    sessions.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    return { home, sessionsRoot, sessions }
  }

  /**
   * Locate the on-disk directory of one Session by scanning `<root>/<workspace>/<id>`.
   * Only a directory that matches the id and holds a Session log generation is
   * returned, and it must stay inside the sessions root.
   */
  async function findSessionDir(id) {
    let entries
    try {
      entries = await fs.readdir(sessionsRoot, { withFileTypes: true })
    } catch {
      return undefined
    }
    const rootPrefix = sessionsRoot + path.sep
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const candidate = path.resolve(sessionsRoot, entry.name, id)
      if (!candidate.startsWith(rootPrefix)) continue
      try {
        const info = await fs.stat(candidate)
        if (!info.isDirectory()) continue
        const files = await fs.readdir(candidate)
        if (files.some((file) => SESSION_LOG_FILE.test(file))) return candidate
      } catch {
        continue
      }
    }
    return undefined
  }

  async function removeProjectionRow(id) {
    try {
      await fs.rm(path.join(projectionRoot, `${id}.json`), { force: true })
    } catch {
      // A cached projection is derived state; a locked or absent row is not a failure.
    }
  }

  /**
   * Remove one conversation.
   *
   * @param {string} rawId
   * @param {{ counts?: Map<string, number>, locked?: Set<string> }} [context]
   *        precomputed child counts and the pinned (locked) session ids.
   */
  async function removeSession(rawId, context = {}) {
    const id = typeof rawId === 'string' ? rawId.trim() : ''
    if (!SESSION_ID.test(id)) return failure(id, 'bad-id')
    if (context.locked && context.locked.has(id)) return failure(id, 'session-pinned')

    let counts = context.counts
    if (!counts) {
      try {
        counts = (await listSnapshots()).counts
      } catch (error) {
        return failure(id, 'list-failed', String(error?.message ?? error))
      }
    }

    if ((counts.get(id) ?? 0) > 0) return failure(id, 'has-children', String(counts.get(id)))

    let snapshot
    try {
      snapshot = await persistence.stat(id)
    } catch (error) {
      return failure(id, 'stat-failed', String(error?.message ?? error))
    }
    if (!snapshot) return failure(id, 'not-found')

    const directory = await findSessionDir(id)
    if (!directory) return failure(id, 'files-missing', sessionsRoot)

    try {
      await fs.rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 })
    } catch (error) {
      return failure(id, 'delete-failed', String(error?.code ?? error?.message ?? error))
    }
    await removeProjectionRow(id)

    const bytes = typeof snapshot.sizeBytes === 'number' ? snapshot.sizeBytes : 0
    return { id, ok: true, bytes }
  }

  return { home, sessionsRoot, listSessions, removeSession, findSessionDir }
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

async function readTitles(ctx, ids) {
  const titles = new Map()
  const query = ctx.get('sessionQuery')
  if (!query || typeof query.readTitleSnapshots !== 'function' || ids.length === 0) return titles
  try {
    const observations = await query.readTitleSnapshots(ids)
    for (const observation of observations ?? []) {
      if (observation?.status === 'fulfilled') {
        const title = observation.value?.title?.title
        if (typeof title === 'string' && title.trim() !== '') titles.set(observation.sessionId, title)
      }
    }
  } catch {
    // Titles are a display hint; the list stays usable without them.
  }
  return titles
}

/**
 * Archive and pin state live in the workspace registry's durable global sets.
 * That service exposes no reader, so its store file is read; an unreadable or
 * partially written file degrades to "no flags" instead of failing the list.
 */
async function readWorkspaceFlags(home) {
  try {
    const raw = await fs.readFile(path.join(home, 'storages', 'workspace.json'), 'utf8')
    const parsed = JSON.parse(raw)
    const global = parsed && typeof parsed === 'object' ? parsed.global : null
    return {
      archived: new Set(Array.isArray(global?.archivedSessionIds) ? global.archivedSessionIds : []),
      pinned: new Set(Array.isArray(global?.pinnedSessionIds) ? global.pinnedSessionIds : []),
    }
  } catch {
    return { archived: new Set(), pinned: new Set() }
  }
}

/**
 * Archive or unarchive one conversation through the durable workspace registry.
 *
 * Lock precedence: the pin is the lock. `archiveSession` drops a pin by design,
 * so letting archive through would silently unlock (and then expose) a pinned
 * conversation. A pinned id is therefore refused before the registry is touched;
 * only unarchive stays allowed.
 */
async function changeArchive(registry, action, rawId, locked) {
  const id = typeof rawId === 'string' ? rawId.trim() : ''
  if (!SESSION_ID.test(id)) return failure(id, 'bad-id')
  if (action === 'archive' && locked && locked.has(id)) return failure(id, 'session-pinned')
  try {
    if (action === 'archive') await registry.archiveSession(id, { stopActivity: true })
    else await registry.unarchiveSession(id)
    return { id, ok: true }
  } catch (error) {
    const code =
      error && error.name === 'WorkspaceActiveSessionError'
        ? 'session-active'
        : action === 'archive'
          ? 'archive-failed'
          : 'unarchive-failed'
    return failure(id, code, String((error && error.message) || error))
  }
}

async function handle(request, cleaner, ctx) {
  try {
    if (request.method === 'GET') {
      const listing = await cleaner.listSessions()
      const titles = await readTitles(ctx, listing.sessions.map((session) => session.id))
      const flags = await readWorkspaceFlags(cleaner.home)
      for (const session of listing.sessions) {
        session.title = titles.get(session.id) ?? null
        session.archived = flags.archived.has(session.id)
        session.pinned = flags.pinned.has(session.id)
        // A pinned conversation is locked: neither its logs nor the attachments it
        // refers to may be removed by this tool.
        if (session.pinned) session.deletable = false
      }
      return json({ ok: true, ...listing })
    }

    if (request.method === 'POST') {
      let body
      try {
        body = await request.json()
      } catch {
        return json({ ok: false, code: 'bad-request' }, 400)
      }
      // This route only deletes; an explicit non-delete action is refused rather
      // than silently treated as a deletion.
      if (body?.action !== undefined && body.action !== 'delete') {
        return json({ ok: false, code: 'bad-request' }, 400)
      }
      const ids = Array.isArray(body?.ids)
        ? body.ids.filter((id) => typeof id === 'string').slice(0, MAX_IDS_PER_REQUEST)
        : []
      if (ids.length === 0) return json({ ok: false, code: 'bad-request' }, 400)

      let counts
      try {
        counts = (await cleaner.listSessions()).sessions.reduce((map, session) => {
          if (session.parentSession) map.set(session.parentSession, (map.get(session.parentSession) ?? 0) + 1)
          return map
        }, new Map())
      } catch {
        counts = new Map()
      }

      const agents = ctx.get('agents')
      const registry = ctx.get('workspaceRegistry')
      const locked = (await readWorkspaceFlags(cleaner.home)).pinned
      const results = []
      for (const id of ids) {
        // Pinned conversations are locked: refuse before anything is archived,
        // stopped, or removed.
        if (locked.has(id)) {
          results.push(failure(id, 'session-pinned'))
          continue
        }
        // A conversation that is still held in memory (open or running) is stopped
        // first, so no running turn keeps appending into a log being removed.
        const agent = agents && typeof agents.get === 'function' ? agents.get(id) : undefined
        if (agent && registry) {
          try {
            await registry.archiveSession(id, { stopActivity: true })
          } catch {
            // Stopping is best effort; the removal below is still attempted.
          }
        }
        const outcome = await cleaner.removeSession(id, { counts, locked })
        if (outcome.ok && registry) {
          // The session is gone, so its archive and pin entries are cleared too.
          try {
            await registry.unarchiveSession(id)
          } catch {}
          try {
            await registry.unpinSession(id)
          } catch {}
        }
        results.push(outcome)
      }
      return json({ ok: true, results })
    }

    return json({ ok: false, code: 'method-not-allowed' }, 405)
  } catch (error) {
    return json({ ok: false, code: 'internal', message: String(error?.message ?? error) }, 500)
  }
}

/**
 * Archive operations live on their own route: an older Host generation that only
 * knows the delete route can never mistake an archive request for a deletion.
 */
async function handleArchive(request, cleaner, ctx) {
  try {
    if (request.method !== 'POST') return json({ ok: false, code: 'method-not-allowed' }, 405)

    let body
    try {
      body = await request.json()
    } catch {
      return json({ ok: false, code: 'bad-request' }, 400)
    }
    const action = body?.action === 'archive' || body?.action === 'unarchive' ? body.action : null
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id) => typeof id === 'string').slice(0, MAX_IDS_PER_REQUEST)
      : []
    if (action === null || ids.length === 0) return json({ ok: false, code: 'bad-request' }, 400)

    const registry = ctx.get('workspaceRegistry')
    if (!registry) return json({ ok: false, code: 'archive-unavailable' }, 503)

    const locked = (await readWorkspaceFlags(cleaner.home)).pinned
    const results = []
    for (const id of ids) results.push(await changeArchive(registry, action, id, locked))
    return json({ ok: true, results })
  } catch (error) {
    return json({ ok: false, code: 'internal', message: String(error?.message ?? error) }, 500)
  }
}

/**
 * Pin operations get their own route for the same reason archive does: an older
 * Host generation must never reinterpret them. Pinning is also what turns a
 * conversation into a lock, so it must be an explicit, separate action.
 */
async function changePin(registry, action, rawId, flags) {
  const id = typeof rawId === 'string' ? rawId.trim() : ''
  if (!SESSION_ID.test(id)) return failure(id, 'bad-id')
  // Pinning and archival are mutually exclusive in the registry; report it plainly
  // instead of letting the registry reject with an opaque error.
  if (action === 'pin' && flags.archived.has(id)) return failure(id, 'session-archived')
  try {
    if (action === 'pin') await registry.pinSession(id)
    else await registry.unpinSession(id)
    return { id, ok: true }
  } catch (error) {
    return failure(id, action === 'pin' ? 'pin-failed' : 'unpin-failed', String((error && error.message) || error))
  }
}

async function handlePin(request, cleaner, ctx) {
  try {
    if (request.method !== 'POST') return json({ ok: false, code: 'method-not-allowed' }, 405)

    let body
    try {
      body = await request.json()
    } catch {
      return json({ ok: false, code: 'bad-request' }, 400)
    }
    const action = body?.action === 'pin' || body?.action === 'unpin' ? body.action : null
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id) => typeof id === 'string').slice(0, MAX_IDS_PER_REQUEST)
      : []
    if (action === null || ids.length === 0) return json({ ok: false, code: 'bad-request' }, 400)

    const registry = ctx.get('workspaceRegistry')
    if (!registry) return json({ ok: false, code: 'pin-unavailable' }, 503)

    const flags = await readWorkspaceFlags(cleaner.home)
    const results = []
    for (const id of ids) results.push(await changePin(registry, action, id, flags))
    return json({ ok: true, results })
  } catch (error) {
    return json({ ok: false, code: 'internal', message: String(error?.message ?? error) }, 500)
  }
}

/** Walk any JSON value and collect every `attachmentId` string it carries. */
function collectAttachmentIds(value, into) {
  if (value === null || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (const item of value) collectAttachmentIds(item, into)
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'attachmentId' && typeof child === 'string' && child !== '') into.add(child)
    else collectAttachmentIds(child, into)
  }
}

/** Every stored attachment object, as `<objects>/<2 hex>/<64 hex>`. */
async function listAttachmentObjects(home) {
  const root = path.join(home, 'attachments', 'v1', 'objects')
  const buckets = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const bucket of buckets) {
    if (!bucket.isDirectory() || !ATTACHMENT_BUCKET.test(bucket.name)) continue
    const bucketPath = path.join(root, bucket.name)
    const names = await fs.readdir(bucketPath).catch(() => [])
    for (const name of names) {
      if (!ATTACHMENT_HASH.test(name)) continue
      const filePath = path.join(bucketPath, name)
      try {
        const info = await fs.lstat(filePath)
        if (!info.isFile()) continue
        files.push({ hash: name, path: filePath, bytes: info.size, mtimeMs: info.mtimeMs })
      } catch {
        continue
      }
    }
  }
  return { root, files }
}

function totalBytes(files) {
  return files.reduce((sum, file) => sum + (Number.isFinite(file.bytes) ? file.bytes : 0), 0)
}

/**
 * Compare the attachment store with the ids every stored conversation mentions.
 * Incomplete scans are reported and must never authorize a deletion.
 */
async function scanAttachments(ctx, home) {
  const persistence = ctx.get('sessionPersistence')
  const query = ctx.get('sessionQuery')
  const { root, files } = await listAttachmentObjects(home)
  const flags = await readWorkspaceFlags(home)
  const referenced = new Set()
  const lockedIds = new Set()
  const failed = []
  let pinnedSessions = 0
  let sessionIds = []

  try {
    sessionIds = (await persistence.list()).map((snapshot) => String(snapshot?.header?.id ?? ''))
  } catch (error) {
    failed.push({ id: '*', code: 'list-failed', message: String(error?.message ?? error) })
  }

  if (!query || typeof query.readSession !== 'function') {
    failed.push({ id: '*', code: 'query-unavailable' })
  } else {
    for (const id of sessionIds) {
      try {
        const snapshot = await query.readSession(id)
        const sessionRefs = new Set()
        collectAttachmentIds(snapshot?.events, sessionRefs)
        collectAttachmentIds(snapshot?.session, sessionRefs)
        for (const ref of sessionRefs) referenced.add(ref)
        // A pinned conversation is locked, and so is every attachment it mentions.
        if (flags.pinned.has(id)) {
          pinnedSessions += 1
          for (const ref of sessionRefs) lockedIds.add(ref)
        }
      } catch (error) {
        failed.push({ id, code: 'read-failed', message: String(error?.message ?? error) })
      }
    }
  }

  const now = Date.now()
  const orphans = files
    .filter((file) => !referenced.has(file.hash) && !lockedIds.has(file.hash))
    .map((file) => {
      const ageMs = Math.max(0, now - file.mtimeMs)
      return { id: file.hash, bytes: file.bytes, ageMs, deletable: ageMs >= ATTACHMENT_MIN_AGE_MS }
    })
  const deletable = orphans.filter((file) => file.deletable)

  return {
    root,
    complete: failed.length === 0,
    failed,
    minAgeMs: ATTACHMENT_MIN_AGE_MS,
    sessions: sessionIds.length,
    pinnedSessions,
    referenced: referenced.size,
    locked: lockedIds.size,
    lockedIds,
    files: files.length,
    totalBytes: totalBytes(files),
    orphanCount: orphans.length,
    orphanBytes: totalBytes(orphans),
    deletableCount: deletable.length,
    deletableBytes: totalBytes(deletable),
    orphans,
  }
}

/** Delete the requested orphan objects; always re-scan first, never deleting a referenced file. */
async function deleteOrphanAttachments(ctx, home, requestedIds) {
  const scan = await scanAttachments(ctx, home)
  if (!scan.complete) {
    return { ok: false, code: 'scan-incomplete', failed: scan.failed }
  }

  const wanted = new Set(Array.isArray(requestedIds) ? requestedIds.filter((id) => typeof id === 'string') : [])
  if (wanted.size === 0) return { ok: false, code: 'bad-request' }
  const targets = scan.orphans.filter(
    (file) => file.deletable && wanted.has(file.id) && !scan.lockedIds.has(file.id),
  )

  let deleted = 0
  let bytes = 0
  const buckets = new Set()
  for (const target of targets) {
    if (!ATTACHMENT_HASH.test(target.id)) continue
    const filePath = path.join(scan.root, target.id.slice(0, 2), target.id)
    try {
      await fs.rm(filePath, { force: true })
      deleted += 1
      bytes += target.bytes
      buckets.add(target.id.slice(0, 2))
    } catch {
      // A locked or vanished object stays; the next scan reports it again.
    }
  }

  for (const bucket of buckets) {
    try {
      await fs.rmdir(path.join(scan.root, bucket))
    } catch {
      // Still holds referenced objects, or another writer raced in.
    }
  }

  return { ok: true, deleted, bytes, remaining: scan.orphanCount - deleted }
}

async function handleAttachments(request, cleaner, ctx) {
  try {
    if (request.method === 'GET') {
      const scan = await scanAttachments(ctx, cleaner.home)
      const { lockedIds, ...serializable } = scan
      return json({ ok: true, ...serializable })
    }

    if (request.method === 'POST') {
      let body
      try {
        body = await request.json()
      } catch {
        return json({ ok: false, code: 'bad-request' }, 400)
      }
      if (body?.action !== 'delete') return json({ ok: false, code: 'bad-request' }, 400)

      const outcome = await deleteOrphanAttachments(ctx, cleaner.home, body?.ids)
      if (outcome.ok) return json(outcome)
      return json(outcome, outcome.code === 'scan-incomplete' ? 409 : 400)
    }

    return json({ ok: false, code: 'method-not-allowed' }, 405)
  } catch (error) {
    return json({ ok: false, code: 'internal', message: String(error?.message ?? error) }, 500)
  }
}

/** Build the Fetch-route handler over one cleaner and Host context (exported for tests). */
export function createHandler(cleaner, ctx) {
  return (request) => handle(request, cleaner, ctx)
}

/** Build the archive/restore handler (exported for tests). */
export function createArchiveHandler(cleaner, ctx) {
  return (request) => handleArchive(request, cleaner, ctx)
}

/** Build the attachment scan/cleanup handler (exported for tests). */
export function createAttachmentHandler(cleaner, ctx) {
  return (request) => handleAttachments(request, cleaner, ctx)
}

/** Build the pin/unpin handler (exported for tests). */
export function createPinHandler(cleaner, ctx) {
  return (request) => handlePin(request, cleaner, ctx)
}

export function apply(ctx) {
  const cleaner = createCleaner({
    home: defaultHome(),
    persistence: ctx.sessionPersistence,
    isLive: (id) => {
      const agents = ctx.get('agents')
      if (agents && typeof agents.get === 'function' && agents.get(id)) return true
      const sessions = ctx.get('sessions')
      if (sessions && typeof sessions.get === 'function' && sessions.get(id)) return true
      return false
    },
  })

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_PATH,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: createHandler(cleaner, ctx),
      }),
    'conversation-cleaner: delete route',
  )

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ARCHIVE_ROUTE_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: createArchiveHandler(cleaner, ctx),
      }),
    'conversation-cleaner: archive route',
  )

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ATTACHMENT_ROUTE_PATH,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        fetch: createAttachmentHandler(cleaner, ctx),
      }),
    'conversation-cleaner: attachment route',
  )

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: PIN_ROUTE_PATH,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: createPinHandler(cleaner, ctx),
      }),
    'conversation-cleaner: pin route',
  )
}
