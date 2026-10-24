// Throwaway verification for the Conversation Cleaner host half.
// Run with: node test-cleaner.mjs
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import {
  createCleaner,
  createHandler,
  createArchiveHandler,
  createPinHandler,
  createAttachmentHandler,
} from '../index.js'

const uuid = (n) => `session-00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const live = uuid(1)
const parent = uuid(2)
const child = uuid(3)
const orphan = uuid(4)

const home = await fs.mkdtemp(path.join(tmpdir(), 'cc-test-'))
const sessionsRoot = path.join(home, 'sessions')
const workspace = path.join(sessionsRoot, '--D-test--')
const projectionRoot = path.join(home, 'storages', 'session_projcache', 'sessions')
await fs.mkdir(workspace, { recursive: true })
await fs.mkdir(projectionRoot, { recursive: true })
await fs.writeFile(
  path.join(home, 'storages', 'workspace.json'),
  JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { archivedSessionIds: [child], pinnedSessionIds: [live] },
  }),
)

async function makeSession(id, bytes = 10) {
  const dir = path.join(workspace, id)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'session.v4.jsonl.zstd'), Buffer.alloc(bytes, 1))
  await fs.writeFile(path.join(projectionRoot, `${id}.json`), '{}')
  return dir
}

const dirs = {
  live: await makeSession(live, 11),
  parent: await makeSession(parent, 12),
  child: await makeSession(child, 13),
  orphan: await makeSession(orphan, 14),
}

const headers = new Map([
  [live, { id: live, createdAt: 4, cwd: 'D:\\test', isSeeded: false }],
  [parent, { id: parent, createdAt: 3, cwd: 'D:\\test', isSeeded: false }],
  [child, { id: child, createdAt: 2, cwd: 'D:\\test', isSeeded: false, parentSession: parent }],
  [orphan, { id: orphan, createdAt: 1, cwd: 'D:\\test', isSeeded: false }],
])

const sizes = new Map([
  [live, 11],
  [parent, 12],
  [child, 13],
  [orphan, 14],
])

const phantom = new Set()

const persistence = {
  async list() {
    return [...headers.values()].map((header) => ({
      header,
      sizeBytes: sizes.get(header.id),
      eventCount: 5,
      revision: 'r1',
    }))
  },
  async stat(id) {
    const header = headers.get(id)
    if (!header) return undefined
    if (!phantom.has(id)) {
      try {
        await fs.stat(path.join(workspace, id))
      } catch {
        return undefined
      }
    }
    return { header, sizeBytes: sizes.get(id), eventCount: 5, revision: 'r1' }
  },
}

const cleaner = createCleaner({
  home,
  persistence,
  isLive: (id) => id === live,
  sessionsRoot,
  projectionRoot,
})

// 1. Listing reports eligibility.
const listing = await cleaner.listSessions()
assert.equal(listing.sessions.length, 4)
const byId = new Map(listing.sessions.map((row) => [row.id, row]))
assert.equal(byId.get(live).deletable, true)
assert.equal(byId.get(live).live, true)
assert.equal(byId.get(parent).deletable, false)
assert.equal(byId.get(parent).childCount, 1)
assert.equal(byId.get(child).deletable, true)
assert.equal(byId.get(orphan).deletable, true)

// 2. Holding a session open no longer blocks removal at the file level.
const running = uuid(10)
headers.set(running, { id: running, createdAt: 0, cwd: 'D:\\test', isSeeded: false })
sizes.set(running, 15)
const runningDir = await makeSession(running, 15)
let result = await cleaner.removeSession(running)
assert.equal(result.ok, true)
await assert.rejects(fs.stat(runningDir))

// A locked (pinned) session is refused even when its files are otherwise removable.
result = await cleaner.removeSession(live, { locked: new Set([live]) })
assert.equal(result.code, 'session-pinned')
assert.equal((await fs.stat(dirs.live)).isDirectory(), true)

// 3. A parent with descendants is refused.
result = await cleaner.removeSession(parent)
assert.deepEqual({ ok: result.ok, code: result.code }, { ok: false, code: 'has-children' })
assert.equal((await fs.stat(dirs.parent)).isDirectory(), true)

// 4. Invalid and traversal ids never touch the filesystem.
result = await cleaner.removeSession('../../etc')
assert.equal(result.code, 'bad-id')
result = await cleaner.removeSession('session-00000000-0000-4000-8000-00000000000x')
assert.equal(result.code, 'bad-id')

// 5. A real deletion removes the log directory and the projection row.
result = await cleaner.removeSession(orphan)
assert.equal(result.ok, true)
assert.equal(result.bytes, 14)
await assert.rejects(fs.stat(dirs.orphan))
await assert.rejects(fs.stat(path.join(projectionRoot, `${orphan}.json`)))

// 6. A second deletion reports the log as gone instead of succeeding silently.
result = await cleaner.removeSession(orphan)
assert.equal(result.code, 'not-found')

// 7. A session whose stored log is not in the expected layout reports files-missing.
const relocated = uuid(5)
headers.set(relocated, { id: relocated, createdAt: 0, cwd: 'D:\\test', isSeeded: false })
sizes.set(relocated, 15)
phantom.add(relocated)
result = await cleaner.removeSession(relocated)
assert.equal(result.code, 'files-missing')

// 8. The Fetch-route handler answers with the wire contract the Client expects.
const handler = createHandler(cleaner, { get: () => undefined })
const archiveCalls = []
const unarchiveCalls = []
const unpinCalls = []
const pinCalls = []
const failingArchiveId = uuid(9)
const failingPinId = uuid(15)
const registry = {
  async archiveSession(id, options) {
    if (id === failingArchiveId) throw new Error('archive exploded')
    archiveCalls.push({ id, options })
  },
  async unarchiveSession(id) {
    unarchiveCalls.push({ id })
  },
  async pinSession(id) {
    if (id === failingPinId) throw new Error('pin exploded')
    pinCalls.push(id)
  },
  async unpinSession(id) {
    unpinCalls.push(id)
  },
}
const archiveHandler = createArchiveHandler(cleaner, {
  get: (name) => (name === 'workspaceRegistry' ? registry : undefined),
})
const archiveUrl = 'http://localhost/api/conversation-cleaner-archive'
const url = 'http://localhost/api/conversation-cleaner'

let response = await handler(new Request(url))
assert.equal(response.status, 200)
assert.equal(response.headers.get('cache-control'), 'no-store')
let payload = await response.json()
assert.equal(payload.ok, true)
assert.ok(Array.isArray(payload.sessions))
assert.equal(payload.sessions.find((row) => row.id === live).deletable, false)
assert.equal(payload.sessions.find((row) => row.id === live).pinned, true)
assert.equal(payload.sessions.find((row) => row.id === child).archived, true)

// A pinned conversation is locked: the delete route refuses before touching files.
response = await handler(
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids: [live] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].code, 'session-pinned')
assert.equal((await fs.stat(dirs.live)).isDirectory(), true)

// Archived state follows the durable workspace store between requests.
await fs.writeFile(
  path.join(home, 'storages', 'workspace.json'),
  JSON.stringify({ unit: { name: 'workspace', version: 2 }, global: { archivedSessionIds: [live], pinnedSessionIds: [] } }),
)
payload = await (await handler(new Request(url))).json()
assert.equal(payload.sessions.find((row) => row.id === live).archived, true)
assert.equal(payload.sessions.find((row) => row.id === child).archived, false)

// Archive and unarchive drive the workspace registry with activity stopping.
response = await archiveHandler(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'archive', ids: [live] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)
assert.deepEqual(archiveCalls[0], { id: live, options: { stopActivity: true } })

response = await archiveHandler(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'unarchive', ids: [live] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)
assert.deepEqual(unarchiveCalls[0], { id: live })

// The pin outranks archive: a pinned conversation is never archived (which would
// drop the pin), while unarchiving it stays available.
const pinnedId = uuid(12)
await fs.writeFile(
  path.join(home, 'storages', 'workspace.json'),
  JSON.stringify({ unit: { name: 'workspace', version: 2 }, global: { archivedSessionIds: [], pinnedSessionIds: [pinnedId] } }),
)
const archiveCountBefore = archiveCalls.length
response = await archiveHandler(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'archive', ids: [pinnedId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].code, 'session-pinned')
assert.equal(archiveCalls.length, archiveCountBefore, 'the registry is not asked to archive a pinned id')

response = await archiveHandler(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'unarchive', ids: [pinnedId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)

// 10. Pin/unpin: pinning is the lock, and an archived conversation must be
// restored before it can be pinned.
const pinUrl = 'http://localhost/api/conversation-cleaner-pin'
const archivedId = uuid(16)
const pinnableId = uuid(17)
await fs.writeFile(
  path.join(home, 'storages', 'workspace.json'),
  JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { archivedSessionIds: [archivedId], pinnedSessionIds: [] },
  }),
)
const pinHandler = createPinHandler(cleaner, {
  get: (name) => (name === 'workspaceRegistry' ? registry : undefined),
})
const pinHeaders = { 'content-type': 'application/json' }

response = await pinHandler(
  new Request(pinUrl, {
    method: 'POST',
    headers: pinHeaders,
    body: JSON.stringify({ action: 'pin', ids: [pinnableId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)
assert.ok(pinCalls.includes(pinnableId))

response = await pinHandler(
  new Request(pinUrl, {
    method: 'POST',
    headers: pinHeaders,
    body: JSON.stringify({ action: 'pin', ids: [archivedId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].code, 'session-archived')
assert.equal(pinCalls.includes(archivedId), false, 'an archived id never reaches the registry')

response = await pinHandler(
  new Request(pinUrl, {
    method: 'POST',
    headers: pinHeaders,
    body: JSON.stringify({ action: 'pin', ids: [failingPinId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].code, 'pin-failed')

response = await pinHandler(
  new Request(pinUrl, {
    method: 'POST',
    headers: pinHeaders,
    body: JSON.stringify({ action: 'unpin', ids: [pinnableId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)
assert.ok(unpinCalls.includes(pinnableId))

response = await pinHandler(
  new Request(pinUrl, {
    method: 'POST',
    headers: pinHeaders,
    body: JSON.stringify({ action: 'different', ids: [pinnableId] }),
  }),
)
assert.equal(response.status, 400)

response = await pinHandler(new Request(pinUrl))
assert.equal(response.status, 405)

const pinWithoutRegistry = createPinHandler(cleaner, { get: () => undefined })
response = await pinWithoutRegistry(
  new Request(pinUrl, {
    method: 'POST',
    headers: pinHeaders,
    body: JSON.stringify({ action: 'pin', ids: [pinnableId] }),
  }),
)
assert.equal(response.status, 503)
assert.equal((await response.json()).code, 'pin-unavailable')

// A registry failure stays a per-id failure, and unknown ids never reach it.
response = await archiveHandler(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'archive', ids: [failingArchiveId] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].code, 'archive-failed')

response = await archiveHandler(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'archive', ids: ['../../etc'] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].code, 'bad-id')

// A deployment without the workspace registry reports the capability gap.
const archiveWithoutRegistry = createArchiveHandler(cleaner, { get: () => undefined })
response = await archiveWithoutRegistry(
  new Request(archiveUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'unarchive', ids: [live] }),
  }),
)
assert.equal(response.status, 503)
payload = await response.json()
assert.equal(payload.code, 'archive-unavailable')

// The delete route refuses a non-delete action instead of deleting.
response = await handler(
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'archive', ids: [live] }),
  }),
)
assert.equal(response.status, 400)
assert.equal((await fs.stat(dirs.live)).isDirectory(), true)

// Deleting a conversation held by a live Agent stops it first, then removes the
// files and clears the archive/pin bookkeeping that pointed at them.
const handlerWithAgents = createHandler(cleaner, {
  get: (name) => {
    if (name === 'agents') return { get: (id) => (id === live ? { id } : undefined) }
    if (name === 'workspaceRegistry') return registry
    return undefined
  },
})
response = await handlerWithAgents(
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids: [live] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)
assert.ok(archiveCalls.some((call) => call.id === live && call.options.stopActivity === true))
assert.ok(unarchiveCalls.filter((call) => call.id === live).length >= 2)
assert.ok(unpinCalls.includes(live))
await assert.rejects(fs.stat(dirs.live))

response = await handler(
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids: [child] }),
  }),
)
payload = await response.json()
assert.equal(payload.results[0].ok, true)

response = await handler(
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'not json',
  }),
)
assert.equal(response.status, 400)

response = await handler(
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids: [] }),
  }),
)
assert.equal(response.status, 400)

response = await handler(new Request(url, { method: 'PUT' }))
assert.equal(response.status, 405)

// 9. Attachment cleanup: only old, unreferenced objects are removable.
const objectsRoot = path.join(home, 'attachments', 'v1', 'objects')
const referencedHash = 'a'.repeat(64)
const orphanOldHash = 'b'.repeat(64)
const orphanNewHash = 'c'.repeat(64)
const referencedOldHash = 'd'.repeat(64)
const pinnedRefHash = 'e'.repeat(64)
const pinnedSession = uuid(11)
const jsonHeaders = { 'content-type': 'application/json' }
const day = 24 * 60 * 60 * 1000

async function putObject(hash, ageMs) {
  const dir = path.join(objectsRoot, hash.slice(0, 2))
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, hash)
  await fs.writeFile(file, Buffer.alloc(7, 1))
  const when = new Date(Date.now() - ageMs)
  await fs.utimes(file, when, when)
  return file
}

const referencedFile = await putObject(referencedHash, 3 * day)
const orphanOldFile = await putObject(orphanOldHash, 3 * day)
const orphanNewFile = await putObject(orphanNewHash, 0)
const referencedOldFile = await putObject(referencedOldHash, 3 * day)
const pinnedRefFile = await putObject(pinnedRefHash, 3 * day)

// The pinned conversation is locked; the attachment only it uses must stay.
await fs.writeFile(
  path.join(home, 'storages', 'workspace.json'),
  JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { archivedSessionIds: [], pinnedSessionIds: [pinnedSession] },
  }),
)

const scanSessions = {
  async list() {
    return [{ header: { id: live } }, { header: { id: pinnedSession } }]
  },
}
const scanQuery = {
  async readSession(id) {
    if (id === pinnedSession) {
      return {
        session: {},
        events: [{ data: { message: { content: [{ type: 'image', attachment: { attachmentId: pinnedRefHash } }] } } }],
      }
    }
    return {
      session: {},
      events: [
        {
          data: {
            message: {
              content: [
                { type: 'image', attachment: { attachmentId: referencedHash } },
                { type: 'file', attachment: { attachmentId: referencedOldHash } },
              ],
            },
          },
        },
      ],
    }
  },
}
const attachmentHandler = createAttachmentHandler(cleaner, {
  get: (name) =>
    name === 'sessionPersistence' ? scanSessions : name === 'sessionQuery' ? scanQuery : undefined,
})
const attachUrl = 'http://localhost/api/conversation-cleaner-attachments'

let attachResponse = await attachmentHandler(new Request(attachUrl))
let attachPayload = await attachResponse.json()
assert.equal(attachPayload.complete, true)
assert.equal(attachPayload.sessions, 2)
assert.equal(attachPayload.pinnedSessions, 1)
assert.equal(attachPayload.locked, 1)
assert.equal(attachPayload.files, 5)
assert.equal(attachPayload.orphanCount, 2)
assert.equal(attachPayload.deletableCount, 1)
assert.equal(attachPayload.orphans.find((file) => file.id === orphanNewHash).deletable, false)
assert.equal(attachPayload.orphans.some((file) => file.id === pinnedRefHash), false)
assert.equal(attachPayload.lockedIds, undefined, 'the internal lock set is not serialized')

// A locked attachment stays even when a stale client asks for it.
attachResponse = await attachmentHandler(
  new Request(attachUrl, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ action: 'delete', ids: [pinnedRefHash] }),
  }),
)
attachPayload = await attachResponse.json()
assert.equal(attachPayload.deleted, 0)
assert.equal((await fs.stat(pinnedRefFile)).isFile(), true)

attachResponse = await attachmentHandler(
  new Request(attachUrl, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ action: 'delete', ids: [orphanOldHash, referencedHash, orphanNewHash] }),
  }),
)
attachPayload = await attachResponse.json()
assert.equal(attachPayload.deleted, 1)
await assert.rejects(fs.stat(orphanOldFile))
assert.equal((await fs.stat(referencedFile)).isFile(), true)
assert.equal((await fs.stat(referencedOldFile)).isFile(), true)
assert.equal((await fs.stat(orphanNewFile)).isFile(), true)
assert.equal((await fs.stat(pinnedRefFile)).isFile(), true)
await assert.rejects(fs.stat(path.join(objectsRoot, 'bb')))

attachResponse = await attachmentHandler(
  new Request(attachUrl, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ action: 'delete', ids: [] }) }),
)
assert.equal(attachResponse.status, 400)

// An unreadable conversation log makes the scan incomplete and blocks deletion.
const brokenScanHandler = createAttachmentHandler(cleaner, {
  get: (name) => {
    if (name === 'sessionPersistence') return scanSessions
    if (name === 'sessionQuery') {
      return {
        async readSession() {
          throw new Error('broken log')
        },
      }
    }
    return undefined
  },
})
attachResponse = await brokenScanHandler(new Request(attachUrl))
attachPayload = await attachResponse.json()
assert.equal(attachPayload.complete, false)
attachResponse = await brokenScanHandler(
  new Request(attachUrl, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ action: 'delete', ids: [orphanNewHash] }),
  }),
)
assert.equal(attachResponse.status, 409)
assert.equal((await fs.stat(orphanNewFile)).isFile(), true)

await fs.rm(home, { recursive: true, force: true })
console.log('conversation-cleaner host checks passed')


