'use strict';
// A late Pixi promise after guarded Canvas fallback must never revive an old
// context, attach its canvas, overwrite a newer scene or erase failure evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/prototype/pixi-experimental.js'), 'utf8');

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
function fixture({ delayLibrary = false, initGate = null, fetchGate = null, assetGate = null } = {}) {
  const observed = {
    scripts: [], apps: [], scenes: [], inserted: [], requested: [], registered: [],
    errors: [], fetchCount: 0,
  };
  const gl = {
    getExtension: () => null, getParameter: () => 4096,
    MAX_TEXTURE_SIZE: 1, MAX_RENDERBUFFER_SIZE: 2, RENDERER: 3, VENDOR: 4,
  };
  const PIXI = {
    PrepareSystem: {},
    extensions: { add() {} },
    Assets: {
      load(src) {
        observed.requested.push(src);
        return assetGate ? assetGate.promise : Promise.resolve({ source: {} });
      },
    },
    Application: class {
      constructor() {
        this.renderer = null;
        this.destroyCount = 0;
        this.canvas = {
          style: {}, getContext: () => gl, setAttribute() {}, addEventListener() {},
          remove() { this.removed = true; },
        };
        observed.apps.push(this);
      }
      async init() {
        if (initGate) await initGate.promise;
        this.renderer = { prepare: { upload: async () => true } };
      }
      destroy() {
        this.destroyCount++;
      }
    },
  };
  const game = { s: { mode: 'arena' }, zoneId: 'vale', hero: { x: 0, y: 0 } };
  const root = {
    console, Promise, Date, performance: { now: () => 0 },
    document: {
      hidden: false,
      createElement: (tag) => {
        assert.equal(tag, 'script', 'no actual WebGL or raster canvas is needed for a cancelled boot');
        return { style: {} };
      },
      head: { append(script) { observed.scripts.push(script); } },
    },
    fetch: (url) => {
      observed.fetchCount++;
      assert.equal(url, './assets/sprites/manifest.json');
      return fetchGate ? fetchGate.promise : Promise.resolve({
        ok: true,
        json: async () => ({ sprites: { 'hero:ranger': { src: './assets/sprites/hero.png' } } }),
      });
    },
    PrototypeSprites: { timeMs: () => 0 },
    PrototypeRenderer: { create: () => ({}) },
    AzerothNativeWebGLCore: {},
    AzerothGpuSpriteAdapter: { create: () => ({}) },
    AzerothPixiSceneBridge: {
      create() {
        const scene = {
          destroyed: false,
          registerTexture(src) { observed.registered.push(src); },
          destroy() { this.destroyed = true; },
        };
        observed.scenes.push(scene);
        return scene;
      },
    },
  };
  if (!delayLibrary) root.PIXI = PIXI;
  vm.createContext(root);
  vm.runInContext(source, root, { filename: 'pixi-experimental.js' });
  const renderer = root.PrototypePixiExperimental.create({
    worldCanvas: {
      width: 320,
      parentNode: { insertBefore(node) { observed.inserted.push(node); } },
    },
    viewport: { width: 320, height: 240 },
    platform: { cameraZoom: 1 },
    getGame: () => game,
    canvasRenderer: { setSilhouetteFrames() {} },
    getRendererOptions: () => ({}),
    onFailure: (error) => observed.errors.push(error),
  });
  return { root, PIXI, game, renderer, observed };
}
(async () => {
  {
    const f = fixture({ delayLibrary: true });
    const pending = f.renderer.prepare();
    await flush();
    assert.equal(f.observed.scripts.length, 1);
    f.renderer.release();
    f.root.PIXI = f.PIXI;
    f.observed.scripts[0].onload();
    assert.equal(await pending, false);
    assert.equal(f.observed.apps.length, 0,
      'late library loading cannot allocate a GPU context after Canvas fallback');
    assert.equal(f.observed.inserted.length, 0);
  }
  {
    const gate = deferred(), f = fixture({ initGate: gate });
    const pending = f.renderer.prepare();
    await flush();
    assert.equal(f.observed.apps.length, 1, 'real Pixi application initialization is pending');
    f.renderer.release();
    gate.resolve();
    assert.equal(await pending, false);
    assert.equal(f.observed.apps[0].destroyCount, 1,
      'a late app.init completion cleans up only its detached application');
    assert.equal(f.observed.inserted.length, 0);
    assert.equal(f.observed.scenes.length, 0);
  }
  {
    const gate = deferred(), f = fixture({ fetchGate: gate });
    const pending = f.renderer.prepare();
    await flush();
    assert.equal(f.observed.fetchCount, 1);
    f.renderer.release();
    gate.resolve({
      ok: true,
      json: async () => ({ sprites: { 'hero:ranger': { src: './assets/sprites/hero.png' } } }),
    });
    assert.equal(await pending, false);
    assert.equal(f.observed.requested.length, 0,
      'a stale manifest response must not launch new texture requests');
    assert.equal(f.observed.registered.length, 0);
    assert.equal(f.observed.errors.length, 0);
  }
  {
    const gate = deferred(), f = fixture({ assetGate: gate });
    const pending = f.renderer.prepare();
    await flush();
    assert.equal(f.observed.requested.length, 1);
    f.renderer.release();
    gate.resolve({ source: {} });
    assert.equal(await pending, false);
    assert.equal(f.observed.registered.length, 0,
      'late texture decode must not register art into a released scene');
    assert.equal(f.observed.errors.length, 0);
  }
  {
    // A rejected obsolete request must neither change the error record nor
    // destroy the SECOND application that is now attempting recovery.
    const first = deferred(), second = deferred();
    const f = fixture({});
    let calls = 0;
    f.root.fetch = () => (++calls === 1 ? first.promise : second.promise);
    const old = f.renderer.prepare();
    await flush();
    assert.equal(calls, 1);
    f.renderer.release();
    const newer = f.renderer.prepare();
    await flush();
    assert.equal(calls, 2);
    first.reject(Error('late failure from obsolete request'));
    assert.equal(await old, false);
    assert.equal(f.observed.apps.length, 2);
    assert.equal(f.observed.apps[1].destroyCount, 0,
      'obsolete rejection must leave current recovery app intact');
    assert.equal(f.observed.apps[0].destroyCount, 1,
      'previously released initialization must not be destroyed a second time');
    assert.equal(f.observed.errors.length, 0);
    second.reject(Error('synthetic current failure'));
    assert.equal(await newer, false);
    assert.equal(f.observed.apps[1].destroyCount, 1,
      'current attempt still owns and cleans up its genuine failure');
  }
  console.log('PASS late Pixi script/init/manifest/texture completion and stale exception isolation');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
