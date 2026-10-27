'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  C = require('../../src/prototype/engine');
function shell(language, heroClass = 'paladin', options = {}) {
  const elements = new Map(),
    events = {},
    documentEvents = {},
    storage = options.storage || new Map();
  let nextFrame;
  const ctx = options.canvasContext || new Proxy({}, { get: (o, k) => o[k] || (() => {}) });
  function el() {
    const classes = new Set(),
      attributes = new Map();
    let content = '';
    return {
      firstChild: { textContent: '' },
      dataset: {},
      hidden: false,
      children: [],
      style: {},
      width: 393,
      height: 852,
      get textContent() {
        return content;
      },
      set textContent(value) {
        content = value;
        this.children = [];
      },
      classList: {
        add: (x) => classes.add(x),
        remove: (x) => classes.delete(x),
        contains: (x) => classes.has(x),
        toggle: (x, v) => (v ? classes.add(x) : classes.delete(x)),
      },
      getContext: () => ctx,
      prepend(...x) {
        this.children.unshift(...x);
      },
      focus() {
        scope.document.activeElement = this;
        this.onfocus?.();
      },
      append(...x) {
        this.children.push(...x);
      },
      replaceChildren(...x) {
        this.children = x;
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      getAttribute(name) {
        return attributes.get(name) ?? null;
      },
      querySelector: () => ({ textContent: '' }),
      scrollIntoView() {},
      click() {
        if (!this.disabled) this.onclick?.();
      },
      getBoundingClientRect: () => ({ left: 12, top: 670, width: 110, height: 110 }),
      setPointerCapture() {},
      addEventListener() {},
    };
  }
  const initial = new C('normal', heroClass, () => 0.5);
  if (options.seedSave !== false && !storage.has('azeroth-v4-normal'))
    storage.set('azeroth-v4-normal', JSON.stringify(initial.snapshot()));
  storage.set('azeroth-display-language-v1', language);
  const scope = {
    Campaign: C,
    console,
    performance: { now: options.now || (() => 0) },
    innerWidth: 393,
    innerHeight: 852,
    Sprint: { enabled: false, press() {}, release() {}, reset() {}, tick: () => 1 },
    localStorage: { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    location: options.location || { protocol: 'file:', hostname: '' },
    navigator: options.navigator || {},
    document: {
      documentElement: {},
      hidden: false,
      body: el(),
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, el());
        return elements.get(id);
      },
      createElement: el,
      addEventListener: (name, fn) => (documentEvents[name] ??= []).push(fn),
    },
    addEventListener: (name, fn) => (events[name] ??= []).push(fn),
    requestAnimationFrame(fn) {
      nextFrame = fn;
    },
    setTimeout() {},
    Blob,
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
    confirm: () => true,
  };
  for (const [name, file] of Object.entries({
    PrototypeHeroPresentation: 'hero-presentation',
    PrototypeMenus: 'menus',
    PrototypeBuild: 'build-info',
    PrototypeInput: 'input',
    PrototypePersistence: 'persistence',
    PrototypePlatform: 'platform',
    PrototypeRuntime: 'runtime',
    PrototypeRenderer: 'renderer',
    PrototypeCombatVisuals: 'combat-visuals',
    PrototypeAudio: 'audio',
    PrototypeNarration: 'narration',
    PrototypeArchive: 'archive',
    PrototypeArchiveReading: 'archive-reading',
    PrototypeRules: 'rules',
    // Match the four critical contracts loaded by production site-assets.
    PrototypeCriticalExecutions: 'critical-executions',
    PrototypeCriticalLevels: 'critical-levels',
    PrototypeCriticalPartyNative: 'critical-party-native',
    PrototypeCriticalWorldNative: 'critical-world-native',
  }))
    scope[name] = require('../../src/prototype/' + file);
  if (options.now) {
    // CommonJS runtime helpers otherwise use the host's performance clock.
    // A supplied clock keeps shell and measured draw stages on one timeline.
    const runtime = scope.PrototypeRuntime;
    scope.PrototypeRuntime = { ...runtime, create: () => runtime.create(options.now) };
  }
  if (options.groundCacheClass) {
    const original = scope.PrototypeRenderer;
    scope.PrototypeRenderer = {
      ...original,
      create: (settings) => original.create({
        ...settings,
        PrototypeGroundCache: options.groundCacheClass,
      }),
    };
  }
  scope.PrototypeVisuals = options.visuals || { draw() {}, roads() {}, height: () => 40 };
  scope.window = scope;
  if (options.idleCallbacks)
    scope.requestIdleCallback = (callback) => {
      options.idleCallbacks.push(callback);
      return options.idleCallbacks.length;
    };
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(require.resolve('../../src/prototype/app'), 'utf8'), scope);
  scope.Prototype.renderer.draw = () => {};
  // Existing presentation fixtures explicitly enter gameplay; the title
  // lifecycle tests opt out to check a true inactive cold launch.
  if (options.stayOnTitle !== true && options.seedSave !== false) {
    const gameFrame = nextFrame;
    elements.get('title-continue')?.click();
    nextFrame?.(0);
    nextFrame = gameFrame;
  }
  return { scope, elements, storage, events, documentEvents, frame: (now) => nextFrame(now) };
}

module.exports = { shell };
