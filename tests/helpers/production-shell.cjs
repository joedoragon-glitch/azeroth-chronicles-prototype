'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  C = require('../../src/prototype/engine');
function shell(language, heroClass = 'paladin', options = {}) {
  const elements = new Map(),
    events = {},
    storage = options.storage || new Map();
  let nextFrame;
  const ctx = new Proxy({}, { get: (o, k) => o[k] || (() => {}) });
  function el() {
    const classes = new Set(), attributes = new Map();
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
      focus() {},
      append(...x) {
        this.children.push(...x);
      },
      replaceChildren(...x) {
        this.children = x;
      },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      getAttribute(name) { return attributes.get(name) ?? null; },
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
  if (!storage.has('azeroth-v4-normal'))
    storage.set('azeroth-v4-normal', JSON.stringify(initial.snapshot()));
  storage.set('azeroth-display-language-v1', language);
  const scope = {
    Campaign: C,
    console,
    performance: { now: () => 0 },
    innerWidth: 393,
    innerHeight: 852,
    Sprint: { enabled: false, press() {}, release() {}, tick: () => 1 },
    localStorage: { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    location: { protocol: 'file:', hostname: '' },
    navigator: {},
    document: {
      documentElement: {},
      hidden: false,
      body: el(),
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, el());
        return elements.get(id);
      },
      createElement: el,
      addEventListener() {},
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
    PrototypeRules: 'rules',
  }))
    scope[name] = require('../../src/prototype/' + file);
  scope.PrototypeVisuals = { draw() {}, roads() {}, height: () => 40 };
  scope.window = scope;
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(require.resolve('../../src/prototype/app'), 'utf8'), scope);
  scope.Prototype.renderer.draw = () => {};
  return { scope, elements, storage, events, frame: (now) => nextFrame(now) };
}

module.exports = { shell };
