// Structural checks for the Client half: the bundle registers its three
// surfaces through the documented slot API and renders without a browser.
// Run with: node test/client.test.mjs  (from the bundle directory)
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

let spec = null
globalThis.window = { __ModuleLoader__: { load(next) { spec = next } } }

const reactStub = {
  Fragment: 'fragment',
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
  useMemo: (factory) => factory(),
  useCallback: (fn) => fn,
  useReducer: (_reducer, initial) => [initial, () => {}],
  useRef: () => ({ current: null }),
}

// eslint-disable-next-line no-eval
eval(source)

assert.equal(spec.id, '@local/dsh-conversation-cleaner', 'bundle id')

const plugin = spec.factory((request) => {
  if (request === 'react') return reactStub
  throw new Error('unexpected module request: ' + request)
})

const registrations = []
const registered = []
const fakeCtx = {
  locale: {
    register: (namespace, dicts) => {
      registrations.push(namespace)
      assert.ok(dicts.en && dicts.zh, 'both shipped locales are provided')
      assert.ok(dicts.en.navLabel && dicts.zh.navLabel, 'nav label is localized')
      assert.ok(dicts.en.archive && dicts.zh.unarchive, 'archive copy is localized')
      assert.ok(dicts.en.filterArchived && dicts.zh.archivedTag, 'archive filter copy is localized')
      assert.ok(dicts.en.attachTitle && dicts.zh.attachDesc, 'attachment cleanup copy is localized')
      assert.ok(dicts.en.cleanDone && dicts.zh.scanIncomplete, 'attachment cleanup states are localized')
      assert.ok(dicts.en.pinnedTag && dicts.zh.lockedNote, 'pinned lock copy is localized')
      assert.ok(dicts.en.pin && dicts.zh.unpin, 'pin/unpin copy is localized')
      assert.ok(dicts.en.pinnedNotice && dicts.zh.pinArchived, 'pin state copy is localized')
      assert.ok(dicts.en.attachLockedLabel && dicts.zh.attachLockedLabel, 'locked attachment copy is localized')
      assert.ok(dicts.en.attachMissingLabel && dicts.zh.attachMissingNote, 'missing attachment copy is localized')
    },
    bind: () => (key) => key,
    subscribe: () => () => {},
    getLocale: () => ({ active: 'zh' }),
  },
  slots: {
    inject: (slot, callback) => {
      const dispose = callback()
      return dispose
    },
    register: (options, component) => {
      registered.push({ slot: options.name, id: options.id || options.key, component })
      return () => {}
    },
  },
  get: () => undefined,
}

plugin.apply(fakeCtx)

assert.deepEqual(registrations, ['conversationCleaner'])
assert.deepEqual(registered.map((entry) => entry.slot), [
  'main',
  'sidebar.panellist',
  'settings.section',
  'sidebar.workspaces.session.row.action',
  'shell.overlay',
])
assert.equal(registered[0].id, 'conversation-cleaner', 'the main panel key matches the sidebar icon id')
assert.equal(registered[1].id, 'conversation-cleaner', 'the sidebar panel icon addresses that panel')

// Render-time smoke checks: each surface must compose without a browser.
for (const entry of registered) {
  const props = entry.slot === 'settings.section' ? { close: () => {} } : {}
  assert.doesNotThrow(() => entry.component(props), entry.slot + ' renders')
}

// The app page is the same component; the sidebar entry draws an icon.
const app = registered.find((entry) => entry.slot === 'main').component({})
assert.equal(app.type, 'div')
assert.equal(app.props.className, 'dsh-cm-app')
const icon = registered.find((entry) => entry.slot === 'sidebar.panellist').component({ size: 16, active: false })
assert.equal(icon.type, 'svg')
assert.equal(icon.props.width, 16)
assert.equal(icon.props.height, 16)

const rowAction = registered.find((entry) => entry.slot === 'sidebar.workspaces.session.row.action')
const row = rowAction.component({ sessionId: 'session-00000000-0000-4000-8000-000000000001', displayTitle: 'Test' })
assert.equal(row.type, 'button')
assert.equal(row.props['aria-label'], 'delete')
assert.equal(row.props.title, 'delete')
assert.ok(row.children[0], 'the row action draws an icon')

console.log('conversation-cleaner client checks passed')
