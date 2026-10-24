window.__ModuleLoader__.load({
  id: '@local/dsh-conversation-cleaner',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const ENDPOINT = 'api/conversation-cleaner'
    const ARCHIVE_ENDPOINT = 'api/conversation-cleaner-archive'
    const PIN_ENDPOINT = 'api/conversation-cleaner-pin'
    const ATTACHMENT_ENDPOINT = 'api/conversation-cleaner-attachments'

    const DICTS = {
      en: {
        navLabel: 'Conversation Manager',
        intro:
          'Archive conversations to tuck them away, or delete their stored log files to free disk space. An archived conversation can be restored at any time.',
        refresh: 'Refresh',
        searching: 'Search titles, paths or ids',
        countSuffix: ' conversations',
        sizeLabel: 'on disk',
        delete: 'Delete conversation',
        dialogTitle: 'Delete this conversation?',
        dialogText:
          'Its stored log files and cached projections are removed, and a running turn is stopped first. This cannot be undone.',
        confirm: 'Delete permanently',
        cancel: 'Cancel',
        deleting: 'Deleting…',
        loading: 'Loading…',
        empty: 'No conversations found.',
        emptySearch: 'No conversation matches this search.',
        loadFailed: 'Could not read the conversation list.',
        deleteFailed: 'Deletion failed.',
        deletedNotice: 'Conversation deleted. The sidebar list may need a refresh.',
        live: 'In use',
        subagent: 'Subagent',
        blockedChildren: 'Has child conversations; delete those first.',
        notFound: 'The log files are already gone.',
        filesMissing: 'No log directory was found for this conversation.',
        badId: 'This conversation id is not valid.',
        busy: 'The log files are locked. Close the conversation and retry.',
        statFailed: 'The conversation could not be inspected.',
        listFailed: 'The stored conversations could not be listed.',
        unknownTitle: 'Untitled conversation',
        events: 'events',
        pinnedTag: 'Pinned · locked',
        lockedNote: 'Pinned conversations are locked: they cannot be deleted or archived.',
        pin: 'Pin',
        unpin: 'Unpin',
        pinnedNotice: 'Conversation pinned and locked.',
        unpinnedNotice: 'Conversation unpinned.',
        pinFailed: 'Pinning failed.',
        unpinFailed: 'Unpinning failed.',
        pinArchived: 'Archived conversations cannot be pinned; restore it first.',
        archive: 'Archive',
        unarchive: 'Restore',
        archivedTag: 'Archived',
        archivedNotice: 'Conversation archived and hidden from the sidebar.',
        unarchivedNotice: 'Conversation restored to the sidebar.',
        archiveFailed: 'Archive failed.',
        unarchiveFailed: 'Restore failed.',
        archiveSessionActive: 'The conversation is still running; stop it and retry.',
        archiveUnavailable: 'This deployment cannot archive conversations.',
        filterAll: 'All',
        filterActive: 'Not archived',
        filterArchived: 'Archived',
        archivedCountSuffix: ' archived',
        attachTitle: 'Attachment cleanup',
        attachDesc:
          'Attachments are stored once and shared by every conversation. A scan reads all stored conversations; only files no conversation refers to, older than 24 hours, can be removed. A pinned conversation is locked: it is never deleted and the attachments it refers to are protected. Other attachment folders are not touched.',
        scan: 'Scan attachments',
        scanning: 'Scanning conversations…',
        attachFilesLabel: 'files',
        attachOrphanLabel: 'unreferenced',
        attachDeletableLabel: 'removable',
        attachLockedLabel: 'attachments locked by pinned conversations',
        attachMissingLabel: 'referenced attachments missing',
        attachMissingNote:
          'Some conversations reference attachment files that no longer exist. They are not cleanup targets, but those conversations may fail to load images.',
        scanIncomplete:
          'Scan incomplete: at least one conversation log could not be read, so nothing will be deleted.',
        scanFailed: 'The attachment scan failed.',
        clean: 'Remove unreferenced',
        cleanConfirm: 'Remove these unused attachment files?',
        cleanDone: 'Attachment files removed:',
        cleanFailed: 'Attachment cleanup failed.',
        noOrphans: 'No removable attachments. Nothing to clean.',
        appTitle: 'Conversation Manager',
        filterPinned: 'Pinned',
        pinnedCountSuffix: ' pinned',
        rulesHint:
          'Pinned means locked: no deletion, no archiving. Attachment cleanup only removes unreferenced files older than 24 hours. Deletion cannot be undone.',
        entryTitle: 'Conversation Manager',
        entryDesc: 'Conversation and attachment cleanup now live in their own app page.',
        entryOpen: 'Open Conversation Manager',
        entryHint: 'If the button does nothing, use the Conversation Manager icon in the sidebar.',
      },
      zh: {
        navLabel: '对话管家',
        intro:
          '可以把对话归档收起，也可以删除日志文件释放磁盘空间。归档的对话随时可以取消归档。',
        refresh: '刷新',
        searching: '搜索标题、路径或 ID',
        countSuffix: ' 个对话',
        sizeLabel: '磁盘占用',
        delete: '删除对话',
        dialogTitle: '删除这个对话？',
        dialogText: '会移除该对话的日志文件与投影缓存；正在运行的任务会先被停止。删除后无法恢复。',
        confirm: '永久删除',
        cancel: '取消',
        deleting: '正在删除…',
        loading: '正在加载…',
        empty: '还没有已保存的对话。',
        emptySearch: '没有匹配这个搜索条件的对话。',
        loadFailed: '无法读取对话列表。',
        deleteFailed: '删除失败。',
        deletedNotice: '对话已删除，侧边栏列表可能需要刷新。',
        live: '正在使用',
        subagent: '子代理',
        blockedChildren: '包含子对话，请先删除子对话。',
        notFound: '日志文件已不存在。',
        filesMissing: '没有找到这个对话的日志目录。',
        badId: '对话 ID 无效。',
        busy: '日志文件被占用，请关闭该对话后重试。',
        statFailed: '无法检查该对话。',
        listFailed: '无法列出已保存的对话。',
        unknownTitle: '未命名对话',
        events: '条事件',
        pinnedTag: '已置顶 · 锁定',
        lockedNote: '已置顶的对话被锁定，不能删除，也不能归档。',
        pin: '置顶',
        unpin: '取消置顶',
        pinnedNotice: '对话已置顶并锁定。',
        unpinnedNotice: '已取消置顶。',
        pinFailed: '置顶失败。',
        unpinFailed: '取消置顶失败。',
        pinArchived: '已归档的对话不能置顶，请先取消归档。',
        archive: '归档',
        unarchive: '取消归档',
        archivedTag: '已归档',
        archivedNotice: '对话已归档，并从侧边栏隐藏。',
        unarchivedNotice: '已取消归档，对话回到侧边栏。',
        archiveFailed: '归档失败。',
        unarchiveFailed: '取消归档失败。',
        archiveSessionActive: '对话仍在运行，停止后再试。',
        archiveUnavailable: '当前部署不支持归档对话。',
        filterAll: '全部',
        filterActive: '未归档',
        filterArchived: '已归档',
        archivedCountSuffix: ' 已归档',
        attachTitle: '附件清理',
        attachDesc:
          '附件按内容只存一份、可被多个对话共享。扫描会读取所有已保存对话，只有“没有任何对话引用、且写入超过 24 小时”的文件才允许删除；置顶的对话视为锁定，不会被删除，它引用的附件也受保护。其他附件目录不会被触碰。',
        scan: '扫描附件',
        scanning: '正在扫描对话…',
        attachFilesLabel: '个文件',
        attachOrphanLabel: '个未被引用',
        attachDeletableLabel: '个可清理',
        attachLockedLabel: '个附件被置顶对话锁定',
        attachMissingLabel: '个引用缺失',
        attachMissingNote: '有对话引用了已不存在的附件文件；它们不参与清理，但相关对话的图片可能无法加载。',
        scanIncomplete: '扫描未完成：有对话日志读不出来，因此不会执行删除。',
        scanFailed: '附件扫描失败。',
        clean: '清理未引用文件',
        cleanConfirm: '删除这些未被使用的附件文件？',
        cleanDone: '已清理附件：',
        cleanFailed: '附件清理失败。',
        noOrphans: '没有可清理的附件。',
        appTitle: '对话管家',
        filterPinned: '已置顶',
        pinnedCountSuffix: ' 已置顶',
        rulesHint: '置顶即锁定：不能删除、不能归档。附件清理只删除超过 24 小时且无任何对话引用的文件。删除不可恢复。',
        entryTitle: '对话管家',
        entryDesc: '对话与附件清理已经独立成一个应用页，可从侧边栏图标进入。',
        entryOpen: '打开对话管家',
        entryHint: '如果按钮没有反应，请点侧边栏的「对话管家」图标。',
      },
    }

    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let value = bytes
      let index = 0
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024
        index += 1
      }
      const digits = value >= 100 || index === 0 ? 0 : 1
      return value.toFixed(digits) + ' ' + units[index]
    }

    function formatTime(ms, locale) {
      if (!Number.isFinite(ms)) return '—'
      try {
        return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(ms))
      } catch {
        return new Date(ms).toLocaleString()
      }
    }

    function folderName(cwd) {
      if (typeof cwd !== 'string' || cwd === '') return ''
      const parts = cwd.split(/[\\/]+/).filter(Boolean)
      return parts.length === 0 ? cwd : parts[parts.length - 1]
    }

    const CSS = `
      .dsh-cc-root { display: flex; flex-direction: column; gap: 14px; min-width: 0; color: var(--dsw-alias-label-primary); }
      .dsh-cc-intro { margin: 0; font-size: 13px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
      .dsh-cc-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .dsh-cc-summary { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .dsh-cc-summary strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .dsh-cc-spacer { flex: 1 1 auto; }
      .dsh-cc-button { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary); border-radius: 6px; padding: 5px 13px; font-size: 13px; line-height: 20px;
        cursor: pointer; font-family: inherit; white-space: nowrap; }
      .dsh-cc-button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
      .dsh-cc-button:disabled { opacity: .55; cursor: default; }
      .dsh-cc-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .dsh-cc-button--danger { color: var(--dsw-alias-state-error-primary); }
      .dsh-cc-button--danger:hover:not(:disabled) { border-color: var(--dsw-alias-state-error-primary);
        background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
      .dsh-cc-button--solid-danger { background: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-bg-base); }
      .dsh-cc-button--solid-danger:hover:not(:disabled) { opacity: .9; background: var(--dsw-alias-state-error-primary); }
      .dsh-cc-search { flex: 1 1 200px; min-width: 140px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); border-radius: 6px; padding: 5px 10px;
        font-size: 13px; line-height: 20px; font-family: inherit; }
      .dsh-cc-search::placeholder { color: var(--dsw-alias-label-secondary); }
      .dsh-cc-list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
        overflow: hidden; background: var(--dsw-alias-bg-layer-1); }
      .dsh-cc-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .dsh-cc-row:first-child { border-top: none; }
      .dsh-cc-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .dsh-cc-title { font-size: 14px; font-weight: 500; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-cc-meta { font-size: 12.5px; line-height: 1.5; color: var(--dsw-alias-label-secondary); overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap; }
      .dsh-cc-tag { display: inline-block; margin-left: 8px; padding: 0 6px; border-radius: 4px; font-size: 11px; line-height: 17px;
        border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); vertical-align: baseline; }
      .dsh-cc-tag--live { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
      .dsh-cc-tag--archived { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); }
      .dsh-cc-tag--pinned { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
      .dsh-cc-filters { display: flex; align-items: center; gap: 4px; }
      .dsh-cc-filter { appearance: none; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary);
        border-radius: 6px; padding: 4px 11px; font-size: 13px; line-height: 18px; cursor: pointer; font-family: inherit; }
      .dsh-cc-filter:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .dsh-cc-filter--active { border-color: var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .dsh-cc-filter:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .dsh-cc-row-side { flex: 0 0 auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; padding-top: 1px; max-width: 62%; }
      .dsh-cc-row-note { font-size: 11px; color: var(--dsw-alias-label-secondary); max-width: 180px; text-align: right; line-height: 1.5; }
      .dsh-cc-row-note--error { color: var(--dsw-alias-state-error-primary); }
      .dsh-cc-confirm { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
      .dsh-cc-confirm-text { font-size: 12px; color: var(--dsw-alias-label-secondary); max-width: 220px; text-align: right; }
      .dsh-cc-notice { display: flex; align-items: center; gap: 8px; font-size: 12px; border-radius: 8px; padding: 7px 10px;
        background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
      .dsh-cc-notice--error { color: var(--dsw-alias-state-error-primary); }
      .dsh-cc-empty { font-size: 14px; color: var(--dsw-alias-label-secondary); padding: 22px 16px; text-align: center; }
      .dsh-cc-loading { font-size: 14px; color: var(--dsw-alias-label-secondary); padding: 22px 16px; text-align: center; }
      .dsh-cc-panel { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 10px;
        border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
      .dsh-cc-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .dsh-cc-panel-title { font-size: 13px; font-weight: 600; }
      .dsh-cc-panel-desc { margin: 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
      .dsh-cc-panel-body { display: flex; flex-direction: column; gap: 8px; }
      .dsh-cc-panel-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .dsh-cc-panel-note { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .dsh-cc-backdrop { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
        padding: 24px; background: rgba(0, 0, 0, .38); pointer-events: auto; }
      .dsh-cc-dialog { width: min(380px, 100%); box-sizing: border-box; display: flex; flex-direction: column; gap: 12px;
        padding: 18px; border-radius: 12px; border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); }
      .dsh-cc-dialog-title { font-size: 15px; font-weight: 600; line-height: 1.4; }
      .dsh-cc-dialog-subject { font-size: 13px; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dsh-cc-dialog-text { font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); margin: 0; }
      .dsh-cc-dialog-error { font-size: 12px; line-height: 1.6; color: var(--dsw-alias-state-error-primary); margin: 0; }
      .dsh-cc-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
      .dsh-cc-toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); pointer-events: none;
        padding: 8px 14px; border-radius: 8px; font-size: 12px; border: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); }
      .dsh-cm-app { display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; width: 100%;
        height: 100%; max-height: 100%; min-height: 0; min-width: 0; padding: 24px 32px 28px;
        color: var(--dsw-alias-label-primary); }
      .dsh-cm-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; flex: 0 0 auto; }
      .dsh-cm-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
      .dsh-cm-mark { width: 38px; height: 38px; flex: 0 0 auto; border-radius: 10px; display: flex; align-items: center;
        justify-content: center; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-brand-primary); }
      .dsh-cm-brand-text { min-width: 0; }
      .dsh-cm-title { font-size: 18px; font-weight: 600; line-height: 1.3; }
      .dsh-cm-stats { margin-top: 3px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
      .dsh-cm-stats strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .dsh-cm-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .dsh-cm-search { width: 280px; flex: 1 1 240px; max-width: 360px; font-size: 13px; }
      .dsh-cm-body { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 340px;
        gap: 20px; align-items: stretch; }
      .dsh-cm-pane { display: flex; flex-direction: column; gap: 12px; min-width: 0; min-height: 0; }
      .dsh-cm-rail { display: flex; flex-direction: column; gap: 14px; min-width: 0; min-height: 0; overflow-y: auto;
        scrollbar-gutter: stable; }
      .dsh-cm-filterbar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 0 0 auto; }
      .dsh-cc-list.dsh-cm-list { flex: 1 1 auto; min-height: 0; max-height: calc(100vh - 260px); overflow-y: auto; scrollbar-gutter: stable; }
      .dsh-cm-hint { margin: 0; font-size: 12px; line-height: 1.7; color: var(--dsw-alias-label-secondary); }
      .dsh-cm-entry { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
      .dsh-cm-entry p { margin: 0; font-size: 13px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
      @media (max-width: 1080px) {
        .dsh-cm-body { grid-template-columns: minmax(0, 1fr); }
        .dsh-cm-rail { overflow-y: visible; }
        .dsh-cm-app { padding: 18px 18px 24px; }
        .dsh-cm-search { width: 100%; flex: 1 1 160px; max-width: none; }
      }
    `

    async function request(method, body, signal, endpoint = ENDPOINT) {
      const response = await fetch(endpoint, {
        method,
        credentials: 'same-origin',
        headers: body === undefined
          ? { accept: 'application/json' }
          : { accept: 'application/json', 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })
      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }
      if (!response.ok || !data || data.ok !== true) {
        const error = new Error((data && (data.message || data.code)) || 'HTTP ' + response.status)
        error.code = data && data.code
        throw error
      }
      return data
    }

    /** One deletion for both callers: the settings list and the sidebar row action. */
    async function removeConversation(id) {
      const data = await request('POST', { ids: [id] })
      const result = Array.isArray(data.results) ? data.results[0] : null
      if (!result || result.ok !== true) {
        return { ok: false, code: result && result.code, detail: result && result.detail }
      }
      return { ok: true, bytes: result.bytes }
    }

    /** Archive or restore one conversation; both actions ride the archive route. */
    async function setArchived(id, action) {
      const data = await request('POST', { action, ids: [id] }, undefined, ARCHIVE_ENDPOINT)
      const result = Array.isArray(data.results) ? data.results[0] : null
      if (!result || result.ok !== true) {
        return { ok: false, code: result && result.code, detail: result && result.detail }
      }
      return { ok: true }
    }

    /** Pin or unpin one conversation; the pin is also the lock. */
    async function setPinned(id, action) {
      const data = await request('POST', { action, ids: [id] }, undefined, PIN_ENDPOINT)
      const result = Array.isArray(data.results) ? data.results[0] : null
      if (!result || result.ok !== true) {
        return { ok: false, code: result && result.code, detail: result && result.detail }
      }
      return { ok: true }
    }

    // Small stores shared between the sidebar row action and the frame overlay.
    function createStore(initial) {
      let value = initial
      const listeners = new Set()
      return {
        get: () => value,
        set(next) {
          if (next === value) return
          value = next
          for (const listener of [...listeners]) listener()
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    }

    const deleteRequest = createStore(null)
    const toastNotice = createStore(null)

    function useStore(store) {
      const [value, setValue] = React.useState(store.get)
      React.useEffect(() => store.subscribe(() => setValue(store.get())), [store])
      return value
    }

    // The locale face lives on the plugin context; mounted surfaces subscribe so
    // copy follows a language switch without a remount.
    let localeFace = null
    let layout = null
    let t = (key) => key

    function useLocaleRevision() {
      const [, bump] = React.useReducer((value) => value + 1, 0)
      React.useEffect(() => {
        if (!localeFace) return undefined
        return localeFace.subscribe(() => bump())
      }, [])
    }

    function describeFailure(failure) {
      const code = failure && failure.code
      if (code === 'session-live') return t('live') + ' — ' + t('busy')
      if (code === 'session-pinned') return t('lockedNote')
      if (code === 'has-children') return t('blockedChildren')
      if (code === 'not-found') return t('notFound')
      if (code === 'files-missing') return t('filesMissing')
      if (code === 'bad-id') return t('badId')
      if (code === 'delete-failed') return t('busy')
      if (code === 'stat-failed') return t('statFailed')
      if (code === 'list-failed') return t('listFailed')
      if (code === 'session-active') return t('archiveSessionActive')
      if (code === 'archive-failed') return t('archiveFailed')
      if (code === 'unarchive-failed') return t('unarchiveFailed')
      if (code === 'archive-unavailable') return t('archiveUnavailable')
      if (code === 'session-archived') return t('pinArchived')
      if (code === 'pin-failed') return t('pinFailed')
      if (code === 'unpin-failed') return t('unpinFailed')
      if (code === 'pin-unavailable') return t('pinFailed')
      return t('deleteFailed')
    }

    function TrashIcon() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 16 16',
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', {
          d: 'M2.6 4.1h10.8M6.2 4.1V2.7h3.6v1.4M4.2 4.1l.6 9.1a1.1 1.1 0 0 0 1.1 1h4.2a1.1 1.1 0 0 0 1.1-1l.6-9.1M6.6 6.7v4.9M9.4 6.7v4.9',
        }),
      )
    }

    /** App + sidebar glyph: a chat bubble with a management list. */
    function ManagerIcon(props) {
      const size = props && Number.isFinite(props.size) ? props.size : 18
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 20 20',
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6A2.5 2.5 0 0 1 14.5 14H9.5l-4 3v-3H5.5A2.5 2.5 0 0 1 3 11.5z' }),
        h('path', { d: 'M6.8 7h6.4M6.8 10h4' }),
      )
    }

    /** One hover button at the end of a Session row; the strip keeps the click off the row. */
    function SessionDeleteAction(props) {
      useLocaleRevision()
      const [hover, setHover] = React.useState(false)
      const [focus, setFocus] = React.useState(false)
      const label = t('delete')
      const title = props && props.displayTitle ? props.displayTitle : ''
      return h(
        'button',
        {
          type: 'button',
          title: label,
          'aria-label': label,
          style: {
            appearance: 'none',
            border: 'none',
            background: hover ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
            color: hover ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-label-secondary)',
            width: '22px',
            height: '22px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            cursor: 'pointer',
            outline: focus ? '2px solid var(--dsw-alias-brand-primary)' : 'none',
            outlineOffset: '1px',
          },
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          onFocus: () => setFocus(true),
          onBlur: () => setFocus(false),
          onClick: () => deleteRequest.set({ sessionId: props.sessionId, title }),
        },
        h(TrashIcon),
      )
    }

    /** Frame-wide confirmation for the sidebar action, plus the success notice. */
    function OverlaySurface() {
      useLocaleRevision()
      const pending = useStore(deleteRequest)
      const notice = useStore(toastNotice)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const busyRef = React.useRef(false)
      const confirmRef = React.useRef(null)
      const previousFocus = React.useRef(null)
      const open = pending !== null

      busyRef.current = busy

      const close = React.useCallback(() => {
        if (busyRef.current) return
        deleteRequest.set(null)
      }, [])

      React.useEffect(() => {
        if (!open) return undefined
        setError(null)
        setBusy(false)
        previousFocus.current = document.activeElement
        const timer = setTimeout(() => {
          if (confirmRef.current) confirmRef.current.focus()
        }, 0)
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            close()
          }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => {
          clearTimeout(timer)
          document.removeEventListener('keydown', onKeyDown)
          const target = previousFocus.current
          if (target && typeof target.focus === 'function') target.focus()
        }
      }, [open, close])

      React.useEffect(() => {
        if (notice === null) return undefined
        const timer = setTimeout(() => toastNotice.set(null), 3000)
        return () => clearTimeout(timer)
      }, [notice])

      const confirm = async () => {
        if (!pending) return
        setBusy(true)
        setError(null)
        try {
          const outcome = await removeConversation(pending.sessionId)
          if (outcome.ok) {
            deleteRequest.set(null)
            toastNotice.set({ text: t('deletedNotice') })
          } else {
            setError(describeFailure(outcome))
          }
        } catch (failure) {
          setError(describeFailure({ code: failure && failure.code, message: failure && failure.message }))
        } finally {
          setBusy(false)
        }
      }

      return h(
        React.Fragment,
        null,
        h('style', { key: 'cc-overlay-style', dangerouslySetInnerHTML: { __html: CSS } }),
        notice !== null ? h('div', { className: 'dsh-cc-toast', role: 'status' }, notice.text) : null,
        open
          ? h(
              'div',
              { className: 'dsh-cc-backdrop', onClick: close },
              h(
                'div',
                {
                  className: 'dsh-cc-dialog',
                  role: 'dialog',
                  'aria-modal': 'true',
                  'aria-label': t('dialogTitle'),
                  onClick: (event) => event.stopPropagation(),
                },
                h('div', { className: 'dsh-cc-dialog-title' }, t('dialogTitle')),
                h('div', { className: 'dsh-cc-dialog-subject' }, pending.title || t('unknownTitle')),
                h('p', { className: 'dsh-cc-dialog-text' }, t('dialogText')),
                error !== null ? h('p', { className: 'dsh-cc-dialog-error' }, error) : null,
                h(
                  'div',
                  { className: 'dsh-cc-dialog-actions' },
                  h(
                    'button',
                    { type: 'button', className: 'dsh-cc-button', disabled: busy, onClick: close },
                    t('cancel'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      ref: confirmRef,
                      className: 'dsh-cc-button dsh-cc-button--solid-danger',
                      disabled: busy,
                      onClick: confirm,
                    },
                    busy ? t('deleting') : t('confirm'),
                  ),
                ),
              ),
            )
          : null,
      )
    }

    function AttachmentCleanup() {
      useLocaleRevision()
      const [scan, setScan] = React.useState(null)
      const [status, setStatus] = React.useState('idle')
      const [error, setError] = React.useState(null)
      const [cleaned, setCleaned] = React.useState(null)
      const [confirming, setConfirming] = React.useState(false)
      const busy = status === 'scanning' || status === 'cleaning'

      const runScan = React.useCallback(async () => {
        setStatus('scanning')
        setError(null)
        setConfirming(false)
        try {
          const data = await request('GET', undefined, undefined, ATTACHMENT_ENDPOINT)
          setScan(data)
          setStatus('done')
        } catch (failure) {
          setError(failure)
          setStatus('error')
        }
      }, [])

      const clean = React.useCallback(async () => {
        if (!scan) return
        const ids = (Array.isArray(scan.orphans) ? scan.orphans : [])
          .filter((file) => file.deletable)
          .map((file) => file.id)
        setStatus('cleaning')
        setError(null)
        setConfirming(false)
        try {
          const data = await request('POST', { action: 'delete', ids }, undefined, ATTACHMENT_ENDPOINT)
          setCleaned({ count: Number(data.deleted) || 0, bytes: Number(data.bytes) || 0 })
          setStatus('done')
          await runScan()
        } catch (failure) {
          setError(failure)
          setStatus('error')
        }
      }, [scan, runScan])

      const removable = scan && scan.complete ? scan.deletableCount : 0

      return h(
        'section',
        { className: 'dsh-cc-panel' },
        h(
          'div',
          { className: 'dsh-cc-panel-head' },
          h('div', { className: 'dsh-cc-panel-title' }, t('attachTitle')),
          h(
            'button',
            { type: 'button', className: 'dsh-cc-button', disabled: busy, onClick: runScan },
            status === 'scanning' ? t('scanning') : t('scan'),
          ),
        ),
        h('p', { className: 'dsh-cc-panel-desc' }, t('attachDesc')),
        error !== null
          ? h(
              'div',
              { className: 'dsh-cc-notice dsh-cc-notice--error' },
              error.code === 'scan-incomplete' ? t('scanIncomplete') : t('scanFailed'),
            )
          : null,
        cleaned !== null
          ? h(
              'div',
              { className: 'dsh-cc-notice' },
              t('cleanDone') + ' ' + cleaned.count + ' · ' + formatBytes(cleaned.bytes),
            )
          : null,
        scan !== null
          ? h(
              'div',
              { className: 'dsh-cc-panel-body' },
              h(
                'div',
                { className: 'dsh-cc-panel-note' },
                scan.files + ' ' + t('attachFilesLabel') + ' · ' + formatBytes(scan.totalBytes),
                ' · ',
                scan.orphanCount + ' ' + t('attachOrphanLabel') + ' (' + formatBytes(scan.orphanBytes) + ')',
                ' · ',
                scan.deletableCount + ' ' + t('attachDeletableLabel'),
                scan.locked > 0 ? ' · ' + scan.locked + ' ' + t('attachLockedLabel') : '',
                scan.missing > 0 ? ' · ' + scan.missing + ' ' + t('attachMissingLabel') : '',
              ),
              scan.complete ? null : h('div', { className: 'dsh-cc-panel-note' }, t('scanIncomplete')),
              scan.missing > 0 ? h('div', { className: 'dsh-cc-panel-note' }, t('attachMissingNote')) : null,
              removable > 0
                ? confirming
                  ? h(
                      'div',
                      { className: 'dsh-cc-panel-actions' },
                      h('span', { className: 'dsh-cc-confirm-text' }, t('cleanConfirm')),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-cc-button dsh-cc-button--solid-danger',
                          disabled: busy,
                          onClick: clean,
                        },
                        status === 'cleaning' ? t('scanning') : t('clean'),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-cc-button',
                          disabled: busy,
                          onClick: () => setConfirming(false),
                        },
                        t('cancel'),
                      ),
                    )
                  : h(
                      'div',
                      { className: 'dsh-cc-panel-actions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-cc-button dsh-cc-button--danger',
                          disabled: busy,
                          onClick: () => setConfirming(true),
                        },
                        t('clean') + ' (' + removable + ')',
                      ),
                    )
                : scan.complete
                  ? h('div', { className: 'dsh-cc-panel-note' }, t('noOrphans'))
                  : null,
            )
          : null,
      )
    }

    function ConversationCleanerPage() {
      useLocaleRevision()

      const [status, setStatus] = React.useState('loading')
      const [sessions, setSessions] = React.useState([])
      const [error, setError] = React.useState(null)
      const [query, setQuery] = React.useState('')
      const [filter, setFilter] = React.useState('all')
      const [confirmId, setConfirmId] = React.useState(null)
      const [busy, setBusy] = React.useState(null)
      const [rowError, setRowError] = React.useState(null)
      const [notice, setNotice] = React.useState(null)

      let locale = 'en'
      try {
        locale = localeFace ? localeFace.getLocale().active : 'en'
      } catch {
        locale = 'en'
      }

      const load = React.useCallback(async (signal) => {
        setStatus('loading')
        setError(null)
        try {
          const data = await request('GET', undefined, signal)
          setSessions(Array.isArray(data.sessions) ? data.sessions : [])
          setStatus('ready')
        } catch (failure) {
          if (failure && failure.name === 'AbortError') return
          setError(failure)
          setStatus('error')
        }
      }, [])

      React.useEffect(() => {
        const controller = new AbortController()
        load(controller.signal)
        return () => controller.abort()
      }, [load])

      const remove = React.useCallback(
        async (id) => {
          setBusy({ id, action: 'delete' })
          setRowError(null)
          setNotice(null)
          try {
            const outcome = await removeConversation(id)
            if (!outcome.ok) {
              setRowError({ id, code: outcome.code, detail: outcome.detail })
            } else {
              setNotice({ kind: 'ok', text: t('deletedNotice') })
              await load()
            }
          } catch (failure) {
            setRowError({ id, code: failure && failure.code, detail: failure && failure.message })
          } finally {
            setBusy(null)
            setConfirmId(null)
          }
        },
        [load],
      )

      const toggleArchive = React.useCallback(
        async (session) => {
          const action = session.archived ? 'unarchive' : 'archive'
          setBusy({ id: session.id, action })
          setRowError(null)
          setNotice(null)
          try {
            const outcome = await setArchived(session.id, action)
            if (!outcome.ok) {
              setRowError({ id: session.id, code: outcome.code, detail: outcome.detail })
            } else {
              setNotice({ kind: 'ok', text: t(action === 'archive' ? 'archivedNotice' : 'unarchivedNotice') })
              await load()
            }
          } catch (failure) {
            setRowError({
              id: session.id,
              code: (failure && failure.code) || (action === 'archive' ? 'archive-failed' : 'unarchive-failed'),
              detail: failure && failure.message,
            })
          } finally {
            setBusy(null)
            setConfirmId(null)
          }
        },
        [load],
      )

      const togglePin = React.useCallback(
        async (session) => {
          const action = session.pinned ? 'unpin' : 'pin'
          setBusy({ id: session.id, action })
          setRowError(null)
          setNotice(null)
          try {
            const outcome = await setPinned(session.id, action)
            if (!outcome.ok) {
              setRowError({ id: session.id, code: outcome.code, detail: outcome.detail })
            } else {
              setNotice({ kind: 'ok', text: t(action === 'pin' ? 'pinnedNotice' : 'unpinnedNotice') })
              await load()
            }
          } catch (failure) {
            setRowError({
              id: session.id,
              code: (failure && failure.code) || (action === 'pin' ? 'pin-failed' : 'unpin-failed'),
              detail: failure && failure.message,
            })
          } finally {
            setBusy(null)
            setConfirmId(null)
          }
        },
        [load],
      )

      const filtered = React.useMemo(() => {
        const needle = query.trim().toLowerCase()
        return sessions.filter((session) => {
          if (filter === 'archived' && !session.archived) return false
          if (filter === 'unarchived' && session.archived) return false
          if (filter === 'pinned' && !session.pinned) return false
          if (needle === '') return true
          const haystack = [session.title, session.cwd, session.id, folderName(session.cwd)]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(needle)
        })
      }, [sessions, query, filter])

      const totals = React.useMemo(() => {
        let bytes = 0
        let blocked = 0
        let archived = 0
        let pinned = 0
        for (const session of sessions) {
          if (Number.isFinite(session.sizeBytes)) bytes += session.sizeBytes
          if (!session.deletable) blocked += 1
          if (session.archived) archived += 1
          if (session.pinned) pinned += 1
        }
        return { count: sessions.length, bytes, blocked, archived, pinned }
      }, [sessions])

      const rowMeta = (session) => {
        const pieces = []
        const folder = folderName(session.cwd)
        if (folder) pieces.push(folder)
        pieces.push(formatTime(session.createdAt, locale))
        pieces.push(formatBytes(session.sizeBytes))
        if (Number.isFinite(session.eventCount) && session.eventCount > 0) {
          pieces.push(session.eventCount + ' ' + t('events'))
        }
        return pieces.join(' · ')
      }

      return h(
        'div',
        { className: 'dsh-cm-app' },
        h('style', { key: 'cc-style', dangerouslySetInnerHTML: { __html: CSS } }),
        h(
          'header',
          { className: 'dsh-cm-header' },
          h(
            'div',
            { className: 'dsh-cm-brand' },
            h('span', { className: 'dsh-cm-mark' }, h(ManagerIcon, { size: 20 })),
            h(
              'div',
              { className: 'dsh-cm-brand-text' },
              h('div', { className: 'dsh-cm-title' }, t('appTitle')),
              h(
                'div',
                { className: 'dsh-cm-stats' },
                h('strong', null, String(totals.count)),
                t('countSuffix'),
                ' · ',
                formatBytes(totals.bytes),
                totals.pinned > 0 ? ' · ' + totals.pinned + t('pinnedCountSuffix') : '',
                totals.archived > 0 ? ' · ' + totals.archived + t('archivedCountSuffix') : '',
              ),
            ),
          ),
          h(
            'div',
            { className: 'dsh-cm-actions' },
            h('input', {
              className: 'dsh-cc-search dsh-cm-search',
              value: query,
              placeholder: t('searching'),
              onChange: (event) => setQuery(event.target.value),
              spellCheck: false,
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-cc-button',
                onClick: () => load(),
                disabled: status === 'loading',
              },
              t('refresh'),
            ),
          ),
        ),
        notice !== null && notice.kind === 'ok' ? h('div', { className: 'dsh-cc-notice' }, notice.text) : null,
        error !== null
          ? h(
              'div',
              { className: 'dsh-cc-notice dsh-cc-notice--error' },
              t('loadFailed') + ' ' + String(error.message || ''),
            )
          : null,
        h(
          'div',
          { className: 'dsh-cm-body' },
          h(
            'section',
            { className: 'dsh-cm-pane' },
            h(
              'div',
              { className: 'dsh-cm-filterbar', role: 'group' },
              ['all', 'unarchived', 'archived', 'pinned'].map((key) =>
                h(
                  'button',
                  {
                    key,
                    type: 'button',
                    className: 'dsh-cc-filter' + (filter === key ? ' dsh-cc-filter--active' : ''),
                    'aria-pressed': filter === key,
                    onClick: () => setFilter(key),
                  },
                  key === 'all'
                    ? t('filterAll')
                    : key === 'unarchived'
                      ? t('filterActive')
                      : key === 'archived'
                        ? t('filterArchived')
                        : t('filterPinned'),
                ),
              ),
            ),
            h(
              'ul',
              { className: 'dsh-cc-list dsh-cm-list' },
          status === 'loading' && sessions.length === 0
            ? h('li', { className: 'dsh-cc-loading' }, t('loading'))
            : null,
          status !== 'loading' && filtered.length === 0
            ? h('li', { className: 'dsh-cc-empty' }, query.trim() === '' ? t('empty') : t('emptySearch'))
            : null,
          filtered.map((session) => {
            const title = session.title && session.title.trim() !== '' ? session.title : t('unknownTitle')
            const isBusy = busy !== null && busy.id === session.id
            const currentError = rowError && rowError.id === session.id ? rowError : null
            return h(
              'li',
              { className: 'dsh-cc-row', key: session.id },
              h(
                'div',
                { className: 'dsh-cc-row-main' },
                h(
                  'div',
                  { className: 'dsh-cc-title', title },
                  title,
                  session.archived
                    ? h('span', { className: 'dsh-cc-tag dsh-cc-tag--archived' }, t('archivedTag'))
                    : null,
                  session.pinned
                    ? h('span', { className: 'dsh-cc-tag dsh-cc-tag--pinned' }, t('pinnedTag'))
                    : null,
                  session.live ? h('span', { className: 'dsh-cc-tag dsh-cc-tag--live' }, t('live')) : null,
                  session.subagent ? h('span', { className: 'dsh-cc-tag' }, t('subagent')) : null,
                ),
                h('div', { className: 'dsh-cc-meta' }, rowMeta(session)),
              ),
              h(
                'div',
                { className: 'dsh-cc-row-side' },
                currentError !== null
                  ? h('span', { className: 'dsh-cc-row-note dsh-cc-row-note--error' }, describeFailure(currentError))
                  : null,
                !session.deletable && currentError === null
                  ? h(
                      'span',
                      { className: 'dsh-cc-row-note' },
                      session.pinned ? t('lockedNote') : session.live ? t('live') : t('blockedChildren'),
                    )
                  : null,
                // Pin is the lock: offered on ordinary rows, replaced by unpin on
                // pinned ones. An archived conversation must be restored first.
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-cc-button',
                    disabled: isBusy || (session.archived && !session.pinned),
                    title: session.archived && !session.pinned ? t('pinArchived') : undefined,
                    onClick: () => togglePin(session),
                  },
                  session.pinned ? t('unpin') : t('pin'),
                ),
                // The pin outranks archive: a pinned conversation cannot be archived,
                // while unarchiving an archived one is still allowed.
                !session.pinned || session.archived
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-cc-button',
                        disabled: isBusy,
                        onClick: () => toggleArchive(session),
                      },
                      session.archived ? t('unarchive') : t('archive'),
                    )
                  : null,
                session.deletable && confirmId !== session.id
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsh-cc-button dsh-cc-button--danger',
                        disabled: isBusy,
                        onClick: () => {
                          setRowError(null)
                          setNotice(null)
                          setConfirmId(session.id)
                        },
                      },
                      isBusy ? t('deleting') : t('delete'),
                    )
                  : null,
                confirmId === session.id
                  ? h(
                      'div',
                      { className: 'dsh-cc-confirm' },
                      h('span', { className: 'dsh-cc-confirm-text' }, t('dialogTitle')),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-cc-button dsh-cc-button--solid-danger',
                          disabled: isBusy,
                          onClick: () => remove(session.id),
                        },
                        isBusy ? t('deleting') : t('confirm'),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-cc-button',
                          disabled: isBusy,
                          onClick: () => setConfirmId(null),
                        },
                        t('cancel'),
                      ),
                    )
                  : null,
              ),
            )
          }),
            ),
          ),
          h(
            'aside',
            { className: 'dsh-cm-rail' },
            h(AttachmentCleanup),
            h('p', { className: 'dsh-cm-hint' }, t('rulesHint')),
          ),
        ),
      )
    }

    /**
     * Settings entry: the settings panel only points at the app page, so there is
     * exactly one place that owns the management UI.
     */
    function SettingsEntry(props) {
      useLocaleRevision()
      return h(
        'div',
        { className: 'dsh-cm-entry' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('p', null, t('entryDesc')),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-cc-button',
            onClick: () => {
              try {
                if (layout) layout.selectPanel('conversation-cleaner')
              } catch (error) {
                console.error('conversation-cleaner: panel selection failed', error)
              }
              try {
                if (props && typeof props.close === 'function') props.close()
              } catch {}
            },
          },
          t('entryOpen'),
        ),
        h('p', { className: 'dsh-cm-hint' }, t('entryHint')),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        localeFace = ctx.locale
        t = ctx.locale.bind('conversationCleaner')
        ctx.locale.register('conversationCleaner', DICTS)
        layout = ctx.get('layout') ?? null

        // The app page: its own main panel driven by the sidebar icon.
        try {
          ctx.slots.inject('main', () =>
            ctx.slots.register({ name: 'main', key: 'conversation-cleaner' }, ConversationCleanerPage),
          )
        } catch (error) {
          console.error('conversation-cleaner: main panel unavailable', error)
        }

        try {
          ctx.slots.inject('sidebar.panellist', () =>
            ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: 'conversation-cleaner',
                order: 5,
                label: () => t('appTitle'),
              },
              ManagerIcon,
            ),
          )
        } catch (error) {
          console.error('conversation-cleaner: sidebar entry unavailable', error)
        }

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'conversation-cleaner',
              order: 25,
              label: () => t('appTitle'),
            },
            SettingsEntry,
          ),
        )

        // Secondary surfaces stay optional: a slot this deployment does not
        // declare must never take the app page down with it.
        try {
          ctx.slots.inject('sidebar.workspaces.session.row.action', () =>
            ctx.slots.register(
              {
                name: 'sidebar.workspaces.session.row.action',
                id: 'conversation-cleaner',
                order: 300,
                label: () => t('delete'),
              },
              SessionDeleteAction,
            ),
          )
        } catch (error) {
          console.error('conversation-cleaner: session row action unavailable', error)
        }

        try {
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              { name: 'shell.overlay', id: 'conversation-cleaner', order: 900 },
              OverlaySurface,
            ),
          )
        } catch (error) {
          console.error('conversation-cleaner: overlay unavailable', error)
        }
      },
    }
  },
})


