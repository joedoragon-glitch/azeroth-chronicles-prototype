'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
function fresh() {
  const pending = [],
    requests = [];
  const scope = {
    Image: class {
      set src(src) {
        this.url = src;
        requests.push(src);
        pending.push(this);
      }
    },
    matchMedia: () => ({ matches: false }),
  };
  vm.createContext(scope);
  for (const file of ['sprite-format', 'sprites'])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '../src/prototype/' + file + '.js'), 'utf8'),
      scope,
    );
  const settle = async (image, ok = true, width = 4, height = 4) => {
    image.naturalWidth = width;
    image.naturalHeight = height;
    if (ok) image.onload();
    else image.onerror();
    for (let i = 0; i < 4; i++) await Promise.resolve();
  };
  const drain = async () => {
    let limit = 1000;
    while (pending.length && limit--) await settle(pending.shift());
    assert(limit > 0);
  };
  return {
    sprites: scope.PrototypeSprites,
    format: scope.PrototypeSpriteFormat,
    scope,
    pending,
    requests,
    settle,
    drain,
  };
}
const entry = (name, extra = {}) => ({
  src: './assets/sprites/' + name + '.png',
  width: 4,
  height: 4,
  displayWidth: 4,
  displayHeight: 4,
  anchorX: 0.5,
  anchorY: 0.75,
  ...extra,
});
const manifest = (sprites) => ({ version: 3, sprites });
const hero = { renderKind: 'hero', class: 'paladin', x: 0, y: 0, hp: 100 };
function context() {
  const draws = [];
  return {
    draws,
    ctx: new Proxy(
      {},
      {
        get:
          (_, key) =>
          (...args) => {
            if (key === 'drawImage') draws.push(args);
          },
      },
    ),
  };
}
(async () => {
  {
    const f = fresh();
    assert.equal(f.sprites.status().maxDecodedBytes, 256 * 1024 * 1024);
    const catalog = Object.fromEntries(
      Array.from({ length: 80 }, (_, i) => [
        'prop:large-' + i + ':vale',
        entry('large-' + i, { width: 1024, height: 1024 }),
      ]),
    );
    assert(f.sprites.installManifest(manifest(catalog)));
    const warm = f.sprites.warm(Object.keys(catalog));
    let count = 0;
    while (f.pending.length) {
      await f.settle(f.pending.shift(), true, 1024, 1024);
      count++;
    }
    await warm;
    const status = f.sprites.status();
    assert.equal(count, 80);
    assert.equal(status.decodedBytes, 256 * 1024 * 1024);
    assert.equal(status.loaded, 64);
    assert.equal(status.evictions, 16);
    assert(status.peakReservedBytes <= 256 * 1024 * 1024);
    assert(status.peakConcurrent <= 2);
    assert(f.sprites.configure({ decodedBytes: 32 * 1024 * 1024 }));
    assert(f.sprites.status().decodedBytes <= 32 * 1024 * 1024);
    assert(f.sprites.configure({ decodedBytes: 256 * 1024 * 1024 }));
    f.sprites.installManifest(manifest({}));
    assert.equal(f.sprites.status().decodedBytes, 0);
    console.log(
      'PASS 256 MiB sprite residency, reservation bounds, LRU retirement and smaller-budget configuration',
    );
  }

  {
    const f = fresh(),
      c = context(),
      point = { x: 100, y: 200 };
    const legacy = entry('density-old', {
      width: 192,
      height: 192,
      displayWidth: 192,
      displayHeight: 192,
    });
    f.sprites.installManifest(manifest({ 'hero:paladin': legacy }));
    let warm = f.sprites.warm(['hero:paladin']);
    await f.settle(f.pending.shift(), true, 192, 192);
    await warm;
    assert(f.sprites.draw(c.ctx, hero, point));
    const destination = c.draws.at(-1).slice(1);
    assert.deepEqual(destination, [4, 56, 192, 192]);
    const dense = entry('density-new', {
      width: 576,
      height: 576,
      displayWidth: 192,
      displayHeight: 192,
      clips: {
        idle: {
          loop: true,
          frames: [
            {
              src: './assets/sprites/density-atlas.png',
              width: 580,
              height: 580,
              rect: [2, 2, 576, 576],
              pivot: [288, 432],
              durationMs: 100,
            },
          ],
        },
      },
    });
    f.sprites.installManifest(manifest({ 'hero:paladin': dense }));
    warm = f.sprites.warm(['hero:paladin']);
    await f.settle(f.pending.shift(), true, 576, 576);
    await warm;
    assert(f.sprites.draw(c.ctx, hero, point));
    assert.deepEqual(
      c.draws.at(-1).slice(1),
      destination,
      'dense static has identical grounding and display extent',
    );
    await f.settle(f.pending.shift(), true, 580, 580);
    assert(f.sprites.draw(c.ctx, hero, point));
    assert.deepEqual(
      c.draws.at(-1).slice(1),
      [2, 2, 576, 576, ...destination],
      'dense clip uses raster pivot with fixed logical grounding',
    );
    assert.equal(
      f.sprites.status().decodedBytes,
      (576 * 576 + 580 * 580) * 4,
      'memory uses actual raster pixels',
    );
    assert.equal(f.sprites.height(hero), 144, 'labels retain logical clearance');
    console.log(
      'PASS high-density static/clip grounding, legacy display equivalence and actual-pixel memory accounting',
    );
  }
  {
    const f = fresh(),
      digest = 'a'.repeat(64);
    f.sprites.installManifest(
      manifest({
        'hero:paladin': entry('one', { hash: digest }),
        'boss:thorn': entry('two', { hash: digest }),
      }),
    );
    const warm = f.sprites.warm(['hero:paladin', 'boss:thorn']);
    assert.equal(f.requests.length, 1, 'equal content at distinct paths shares one decode');
    await f.drain();
    await warm;
    let resolveFetch;
    f.scope.fetch = () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      });
    const pending = f.sprites.preload();
    f.sprites.installManifest(manifest({ 'hero:paladin': entry('current') }));
    resolveFetch({ ok: true, json: async () => manifest({ 'hero:paladin': entry('stale') }) });
    await pending;
    assert.equal(
      f.sprites.definitionFor(hero).entry.src,
      entry('current').src,
      'late manifest fetch cannot replace manually installed revision',
    );
    const bank = { variants: [entry('first', { id: 'a' }), entry('second', { id: 'b' })] };
    for (let seed = 0; seed < 40; seed++) {
      const original = f.sprites.variant({ seed }, bank).id;
      assert.equal(
        f.sprites.variant({ seed }, { variants: [...bank.variants].reverse() }).id,
        original,
      );
      assert.equal(
        f.sprites.variant(
          { seed },
          {
            variants: bank.variants.map((v) => ({
              ...v,
              src: v.src.replace('.png', '-edited.png'),
            })),
          },
        ).id,
        original,
      );
    }
    console.log(
      'PASS content identity, stale manifest lease and stable variant revision/reordering',
    );
  }
  {
    const f = fresh();
    const bank = entry('rock', {
      variants: [entry('moss', { id: 'moss' }), entry('bare', { id: 'bare' })],
      variantSelector: {
        kind: 'procedural-modulo',
        modulo: 4,
        slots: ['moss', 'bare', 'bare', 'bare'],
      },
    });
    f.format.entry(bank);
    // The production procedural renderer hashes identity, rather than e.seed.
    // Cover real world ID shapes, fallback fields and reordered/revised banks.
    const hash = (text) => {
      let value = 2166136261;
      for (const ch of text) value = Math.imul(value ^ ch.charCodeAt(0), 16777619);
      return value >>> 0;
    };
    for (const entity of [
      ...Array.from({ length: 1000 }, (_, i) => ({ id: 'aesthetic-nature-' + i, seed: i + 1 })),
      { name: 'Rock' },
      { species: 'stone' },
      { family: 'wild' },
      { kind: 'prop' },
      {},
    ]) {
      const seed = String(
        entity.id || entity.name || entity.species || entity.family || entity.kind || 'azeroth',
      );
      const expected = hash(seed) % 4 === 0 ? 'moss' : 'bare';
      assert.equal(f.sprites.variant(entity, bank).id, expected);
      assert.equal(
        f.sprites.variant(entity, {
          ...bank,
          variants: bank.variants
            .toReversed()
            .map((v) => ({ ...v, src: v.src.replace('.png', '-v2.png') })),
        }).id,
        expected,
      );
    }
    const grass = entry('grass', {
      variants: Array.from({ length: 5 }, (_, i) => entry('height-' + i, { id: 'height-' + i })),
      variantSelector: {
        kind: 'procedural-modulo',
        modulo: 5,
        slots: Array.from({ length: 5 }, (_, i) => 'height-' + i),
      },
    });
    for (let i = 0; i < 200; i++) {
      const id = 'aesthetic-nature-' + i;
      assert.equal(f.sprites.variant({ id }, grass).id, 'height-' + (hash(id) % 5));
    }
    for (const selector of [
      { kind: 'unknown', modulo: 4, slots: bank.variantSelector.slots },
      { kind: 'procedural-modulo', modulo: 0, slots: [] },
      { kind: 'procedural-modulo', modulo: 2, slots: ['moss'] },
      { kind: 'procedural-modulo', modulo: 1, slots: ['missing'] },
    ])
      assert.throws(() => f.format.entry({ ...bank, variantSelector: selector }), /selector/);
    assert.throws(() => f.format.entry({ ...bank, variants: undefined }), /selector/);
    console.log(
      'PASS exact procedural moss/height slots, identity fallback, replacement/reordering and invalid selector rejection',
    );
  }
  {
    const f = fresh(),
      c = context();
    f.sprites.installManifest(
      manifest({ 'hero:paladin': entry('old'), 'boss:thorn': entry('old') }),
    );
    assert.equal(f.requests.length, 0, 'install is lazy');
    const warm = f.sprites.warm(['hero:paladin', 'boss:thorn']);
    assert.equal(f.requests.length, 1, 'same content shares decoding');
    await f.drain();
    await warm;
    assert.equal(f.sprites.status().decodedBytes, 64);
    assert(f.sprites.draw(c.ctx, hero, { x: 10, y: 20 }));
    assert.equal(c.draws.at(-1)[0].url, entry('old').src);
    f.sprites.installManifest(manifest({ 'hero:paladin': entry('new') }));
    assert.equal(
      f.sprites.draw(c.ctx, hero, { x: 10, y: 20 }),
      false,
      'old image cannot draw after replacement',
    );
    await f.drain();
    assert(f.sprites.draw(c.ctx, hero, { x: 10, y: 20 }));
    assert.equal(c.draws.at(-1)[0].url, entry('new').src);
    f.sprites.installManifest(manifest({}));
    assert.equal(f.sprites.status().decodedBytes, 0);
    assert.equal(f.sprites.draw(c.ctx, hero, { x: 0, y: 0 }), false);
    console.log('PASS lazy/shared decoding, same-session replacement and removal');
  }
  {
    const f = fresh(),
      c = context();
    f.sprites.installManifest(manifest({ 'hero:paladin': entry('late-old') }));
    f.sprites.draw(c.ctx, hero, { x: 0, y: 0 });
    const old = f.pending.shift();
    f.sprites.installManifest(manifest({ 'hero:paladin': entry('late-new') }));
    f.sprites.draw(c.ctx, hero, { x: 0, y: 0 });
    await f.settle(f.pending.shift());
    await f.settle(old);
    assert(f.sprites.draw(c.ctx, hero, { x: 0, y: 0 }));
    assert.equal(c.draws.at(-1)[0].url, entry('late-new').src);
    assert.equal(f.sprites.status().staleLoads, 1);
    f.sprites.installManifest(manifest({ 'hero:paladin': entry('broken') }));
    f.sprites.draw(c.ctx, hero, { x: 0, y: 0 });
    await f.settle(f.pending.shift(), false);
    assert.equal(f.sprites.draw(c.ctx, hero, { x: 0, y: 0 }), false);
    assert.equal(f.sprites.status().failed, 1);
    assert.equal(
      f.sprites.installManifest(
        manifest({ 'hero:paladin': entry('unsafe', { src: 'https://other.test/a.png' }) }),
      ),
      false,
    );
    console.log('PASS late retired decode, failure fallback and invalid manifest rejection');
  }
  {
    const f = fresh();
    assert(f.sprites.configure({ decodedBytes: 128, concurrent: 2 }));
    const catalog = Object.fromEntries(
      Array.from({ length: 280 }, (_, i) => ['prop:item-' + i + ':vale', entry('item-' + i)]),
    );
    f.sprites.installManifest(manifest(catalog));
    const warm = f.sprites.warm(Object.keys(catalog));
    assert.equal(f.pending.length, 2);
    await f.drain();
    await warm;
    const status = f.sprites.status();
    assert(
      status.loaded <= 2 &&
        status.decodedBytes <= 128 &&
        status.peakReservedBytes <= 128 &&
        status.peakConcurrent <= 2 &&
        status.evictions > 0,
    );
    const key = Object.keys(catalog).at(-1),
      entity = { renderKind: 'prop', structure: key.split(':')[1] },
      c = context();
    f.sprites.beginFrame();
    assert(f.sprites.draw(c.ctx, entity, { x: 0, y: 0 }));
    const blocked = f.sprites.warm([Object.keys(catalog)[0]]);
    f.sprites.endFrame();
    await f.drain();
    await blocked;
    assert(f.sprites.draw(c.ctx, entity, { x: 0, y: 0 }), 'visible resource stays pinned');
    assert.equal(
      f.sprites.configure({ decodedBytes: 257 * 1024 * 1024 }),
      false,
      'cannot exceed the approved 256 MiB runtime cap',
    );
    console.log('PASS full 280-entry lazy registry, bounded concurrency/LRU and visible pinning');
  }
  {
    const f = fresh(),
      c = context(),
      actor = { ...hero };
    const page = { src: './assets/sprites/atlas.png', width: 8, height: 4 },
      frames = [0, 4].map((x) => ({ ...page, rect: [x, 0, 4, 4], pivot: [2, 3], durationMs: 80 }));
    const value = entry('static', {
      clips: {
        idle: { loop: true, frames },
        attack: { loop: false, frames },
        walk: { loop: true, frames },
      },
    });
    f.sprites.installManifest(manifest({ 'hero:paladin': value }));
    const warm = f.sprites.warm(['hero:paladin']);
    await f.drain();
    await warm;
    assert(f.sprites.draw(c.ctx, actor, { x: 10, y: 20 }), 'unloaded clip uses static fallback');
    await f.settle(f.pending.shift(), true, 8, 4);
    f.sprites.draw(c.ctx, actor, { x: 10, y: 20 });
    assert.deepEqual(c.draws.at(-1).slice(1), [0, 0, 4, 4, 8, 17, 4, 4]);
    f.sprites.advance(100);
    f.sprites.draw(c.ctx, actor, { x: 10, y: 20 });
    assert.equal(c.draws.at(-1)[1], 4);
    f.sprites.advance(100, true);
    f.sprites.draw(c.ctx, actor, { x: 10, y: 20 });
    assert.equal(c.draws.at(-1)[1], 4, 'pause freezes frame');
    f.sprites.advance(0, false);
    f.sprites.noteEvents([{ type: 'swing', actor: 'hero' }]);
    f.sprites.draw(c.ctx, actor, { x: 10, y: 20 });
    assert.equal(c.draws.at(-1)[1], 0, 'actual action event starts clip');
    f.sprites.advance(100);
    f.sprites.draw(c.ctx, actor, { x: 10, y: 20 });
    assert.equal(c.draws.at(-1)[1], 4);
    f.scope.matchMedia = () => ({ matches: true });
    f.sprites.draw(c.ctx, actor, { x: 10, y: 20 });
    assert.equal(c.draws.at(-1).length, 5, 'reduced motion uses static fallback');
    assert.equal(actor.hp, 100);
    assert.equal(actor.x, 0, 'rendering does not mutate gameplay');
    assert.equal(f.sprites.frameFor({ loop: false, frames }, 999).rect[0], 4);
    const malformed = entry('static', {
      clips: { idle: { loop: true, frames: [{ ...frames[0], rect: [7, 0, 4, 4] }] } },
    });
    assert(f.sprites.installManifest(manifest({ 'hero:paladin': malformed })));
    assert.equal(
      f.sprites.definitionFor(hero).entry.clips,
      undefined,
      'malformed optional clips retain safe static fallback',
    );
    const variants = entry('base', {
      variants: [entry('variant-a', { id: 'a' }), entry('variant-b', { id: 'b' })],
    });
    const choices = new Set(
      Array.from({ length: 20 }, (_, seed) => f.sprites.variant({ seed }, variants).src),
    );
    assert.equal(choices.size, 2);
    assert.equal(
      f.sprites.variant({ seed: 7 }, variants).src,
      f.sprites.variant({ seed: 7 }, variants).src,
    );
    console.log(
      'PASS atlas rectangles/pivots, looping, action timing, pause, reduced motion and stable nature variants',
    );
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
