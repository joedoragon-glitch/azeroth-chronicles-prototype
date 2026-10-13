'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const C = require('../src/prototype/engine');
const {
  approvedScenery,
  isAddedScenery,
  removeApprovedScenery,
} = require('../scripts/snapshot-scenery-comparison.cjs');
assert.equal(approvedScenery.length, 12);
const counts = { vale: 7, march: 3, frontier: 2 };
for (const region of Object.keys(counts)) {
  const specs = approvedScenery.filter(([zone]) => zone === region);
  assert.equal(specs.length, counts[region]);
  for (const [, id, structure, district, role] of specs) {
    const p = {
      id,
      structure,
      regionalDistrict: district,
      sceneRole: role,
      decorative: true,
      r: 0,
    };
    assert(isAddedScenery(p, region));
    for (const change of [
      { id: 'regional-handoff-999' },
      { structure: 'unapproved' },
      { regionalDistrict: 'other' },
      { sceneRole: 'unapproved' },
      { r: 1 },
      { decorative: false },
    ]) {
      const other = { ...p, ...change };
      assert.deepEqual(
        removeApprovedScenery([p, other], region),
        [other],
        'comparison must retain an unapproved prop: ' + JSON.stringify(change),
      );
    }
    assert.throws(() => removeApprovedScenery([p, { ...p }], region), /Duplicate/);
  }
}
let cases = 0;
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const seed of [0, 1, 2, 17, 101, 203, 997, 10007, 73129, 123456, 2147483647, 4294967295]) {
      let state = seed;
      const c = new C(
        mode,
        cls,
        () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296,
      );
      for (const region of Object.keys(counts)) c.enter(region);
      const old = c.snapshot();
      const existing = {};
      for (const region of Object.keys(counts)) {
        const z = old.zones[region];
        const additions = z.props.filter((p) => isAddedScenery(p, region));
        assert.equal(
          additions.length,
          counts[region],
          mode + '/' + cls + '/' + seed + '/' + region,
        );
        for (const p of additions) {
          assert(!c.blocked(p.x, p.y, region, 24));
          assert(
            !z.roads.some((road) =>
              road.some((b, j) => j && c.distanceToSegment(p, road[j - 1], b) < 60),
            ),
          );
        }
        z.props = removeApprovedScenery(z.props, region);
        existing[region] = JSON.parse(JSON.stringify(z.props));
        if (region === 'frontier') delete z.regionalHandoffVersion;
        else z.regionalHandoffVersion = 1;
        cases++;
      }
      const restored = C.restore(old),
        repeated = C.restore(restored.snapshot());
      for (const region of Object.keys(counts)) {
        const props = restored.s.zones[region].props;
        assert.deepEqual(props.slice(0, existing[region].length), existing[region]);
        assert.equal(props.filter((p) => isAddedScenery(p, region)).length, counts[region]);
        assert.deepEqual(repeated.s.zones[region].props, props);
      }
      assert.deepEqual(restored.s.quests, old.quests);
      assert.deepEqual(restored.s.rescued, old.rescued);
      assert.deepEqual(restored.s.keys, old.keys);
      assert.equal(restored.hero.gold, old.hero.gold);
    }
console.log(
  'PASS ' + cases + ' seeded scenery/old-save/idempotence checks across all classes and modes',
);

// Execute the actual serialized browser fixture, including repeated zone() calls.
// Its old broad category filter would silently delete the unrelated clone below.
const source = fs.readFileSync(
  path.join(__dirname, '../scripts/perf-ws2-renderer-performance.cjs'),
  'utf8',
);
const prepare = source.slice(
  source.indexOf('function prepare('),
  source.indexOf('function sampledDraw('),
);
const proof = source.slice(
  source.indexOf('async function proof()'),
  source.indexOf('function summarize('),
);
class Probe extends C {
  enter(...args) {
    const result = super.enter(...args);
    const z = this.s.zones.vale;
    if (z && !z.props.some((p) => p.id === 'regional-handoff-999'))
      z.props.push({
        id: 'regional-handoff-999',
        structure: 'fruit-tree',
        regionalDistrict: 'hamlet-orchard',
        r: 0,
        decorative: true,
      });
    return result;
  }
}
const ctx = { getImageData: () => ({ data: new Uint8Array([0, 0, 0, 0]) }) };
const sandbox = {
  Campaign: Probe,
  crypto: crypto.webcrypto,
  TextEncoder,
  document: { createElement: () => ({ getContext: () => ctx }) },
  PrototypeRenderer: {
    create: (opts) => ({ draw: () => opts.getGame().zone(), metrics: () => ({}) }),
  },
  PrototypeVisuals: {},
  PrototypeCombatVisuals: {},
  PrototypeEnemyVfxArt: {},
  PrototypeGroundCache: {},
  PrototypeSprites: { status: () => ({}) },
  PrototypeMaterials: { status: () => ({}) },
  window: {},
};
vm.createContext(sandbox);
vm.runInContext(prepare + proof, sandbox);
(async () => {
  for (const zone of [
    'vale',
    'march',
    'highlands',
    'frontier',
    'crown',
    'crypt',
    'archive',
    'mine',
    'abyss',
    'citadel',
    'crowd',
  ]) {
    sandbox.spec = { zone, width: 1280, height: 800, approvedScenery };
    vm.runInContext('prepare(spec)', sandbox);
    const game = sandbox.window.__perfWs2.game;
    assert(game.s.zones.vale.props.some((p) => p.id === 'regional-handoff-999'));
    assert(
      !Object.entries(game.s.zones).some(([id, z]) => z.props.some((p) => isAddedScenery(p, id))),
    );
    const first = await vm.runInContext('proof()', sandbox);
    for (let n = 0; n < 3; n++)
      assert.equal((await vm.runInContext('proof()', sandbox)).state, first.state);
    game.hero.gold++;
    assert.notEqual((await vm.runInContext('proof()', sandbox)).state, first.state);
  }
  console.log(
    'PASS actual painter setup/proof retains unrelated props, repeated draws and real gameplay changes',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
