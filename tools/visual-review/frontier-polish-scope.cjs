const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert/strict'),
  crypto = require('crypto');
const root = require('path').resolve(__dirname, '../..'),
  C = require(root + '/src/prototype/engine.js'),
  V = require(root + '/src/prototype/visuals.js'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const context = { PrototypeRules: C.rules, require: () => C.rules };
vm.createContext(context);
vm.runInContext(
  require('./source-baselines.cjs')(
    process.env.FRONTIER_VISUAL_BASELINE || 'e6ea987aded7b441bdedf51e1fc29b38b1ed2f02',
  ),
  context,
);
const old = context.PrototypeVisuals;
function render(v, e, r) {
  const can = createCanvas(240, 240),
    ctx = can.getContext('2d');
  ctx.scale(1.5, 1.5);
  v.draw(ctx, e, { x: 80, y: 110 }, r);
  return crypto
    .createHash('sha256')
    .update(ctx.getImageData(0, 0, 240, 240).data)
    .digest('hex');
}
let same = 0,
  changed = 0;
const cases = new Map();
for (const [r, region] of C.data.regions.entries()) {
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter(region.id);
  for (const mob of c.zone().enemies) {
    const e = { ...mob, renderKind: 'enemy' },
      key = [
        r,
        e.species,
        e.family,
        e.ranged,
        e.guard,
        e.captainProfile,
        e.form,
        !!e.crownTroop,
      ].join(':');
    if (cases.has(key)) continue;
    cases.set(key, e);
    const before = JSON.stringify(e);
    const a = render(old, e, r),
      b = render(V, e, r);
    assert.equal(JSON.stringify(e), before, 'drawing mutates actor ' + key);
    assert.equal(old.height(e), V.height(e), key + ' height changed');
    const inScope =
      process.env.FRONTIER_VISUAL_TARGET === 'archers'
        ? e.species === 'archer' && r === 3
        : e.species === 'orc' || e.family === 'warlord' || (e.species === 'archer' && r === 3);
    if (inScope) {
      assert.notEqual(a, b, 'requested target unchanged ' + key);
      changed++;
    } else {
      assert.equal(a, b, 'unrelated appearance changed ' + key);
      same++;
    }
  }
}
console.log(
  'PASS',
  changed,
  'changed target contracts;',
  same,
  'unrelated body contracts pixel-identical; entity state and label heights unchanged.',
);
const out = process.argv[2] || root + '/test-results/frontier-polish-scope.json';
fs.mkdirSync(require('path').dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      changedTargetContracts: changed,
      unchangedBodyContracts: same,
      actorPurity: true,
      labelHeightPreserved: true,
    },
    null,
    2,
  ),
);
