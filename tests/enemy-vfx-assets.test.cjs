'use strict';
const assert = require('node:assert/strict'),
  vm = require('node:vm'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const pending = [],
    scope = {
      Image: class {
        set src(s) {
          this.url = s;
          pending.push(this);
        }
      },
      matchMedia: () => ({ matches: false }),
    };
  vm.createContext(scope);
  for (const name of ['sprite-format', 'sprites'])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '../src/prototype/' + name + '.js'), 'utf8'),
      scope,
    );
  const S = scope.PrototypeSprites,
    F = scope.PrototypeSpriteFormat,
    key = 'vfx:stone-rupture',
    resource = { src: './assets/sprites/vfx-test.png', width: 4, height: 4 },
    entry = {
      ...resource,
      displayWidth: 16,
      displayHeight: 16,
      anchorX: 0.5,
      anchorY: 0.5,
      clips: {
        impact: {
          loop: false,
          frames: [
            { ...resource, rect: [0, 0, 2, 2], pivot: [1, 1], durationMs: 100 },
            { ...resource, rect: [2, 2, 2, 2], pivot: [1, 1], durationMs: 100 },
          ],
        },
      },
    };
  assert(S.installManifest({ version: 2, sprites: { [key]: entry } }));
  const calls = [],
    ctx = {
      save() {},
      restore() {},
      drawImage(...a) {
        calls.push(a);
      },
    };
  assert(
    !S.drawStage(ctx, key, { x: 20, y: 20 }, { clip: 'impact', elapsedMs: 120 }),
    'lazy pending decode yields procedural fallback',
  );
  assert.equal(pending.length, 1);
  pending[0].naturalWidth = pending[0].naturalHeight = 4;
  pending[0].onload();
  for (let j = 0; j < 5; j++) await Promise.resolve();
  assert(S.drawStage(ctx, key, { x: 20, y: 20 }, { clip: 'impact', elapsedMs: 120 }));
  assert.deepEqual(calls[0].slice(1, 5), [2, 2, 2, 2]);
  assert.deepEqual(calls[0].slice(5), [12, 12, 16, 16]);
  assert(!S.drawStage(ctx, key, { x: 20, y: 20 }, { clip: 'unapproved' }));
  assert(!S.drawStage(ctx, 'hero:paladin', { x: 0, y: 0 }));
  assert(
    F.sources({ version: 2, sprites: { [key]: entry } }).includes(resource.src),
    'one packaging/offline source enumeration',
  );
  assert.equal(S.status().loaded, 1);
  assert(S.status().decodedBytes <= S.status().maxDecodedBytes);
  assert(S.installManifest({ version: 2, sprites: {} }));
  assert(
    !S.drawStage(ctx, key, { x: 0, y: 0 }, { clip: 'impact' }),
    'removal rolls back immediately',
  );
  console.log(
    'PASS optional VFX stage atlas: shared lazy cache, exact clip/pivot, missing/loading/removal fallback and offline enumeration',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
