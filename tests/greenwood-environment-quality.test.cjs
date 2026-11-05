'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createCanvas } = require('@napi-rs/canvas');
const C = require('../src/prototype/engine.js');
const V = require('../src/prototype/visuals.js');
const { rng } = require('../tools/greenwood-layout/fixtures.cjs');
const g = new C('normal', 'paladin', rng(0x47564103));
const z = g.zone();
const shelters = z.props.filter((p) => p.greenwoodGoblinShelter);
assert.equal(shelters.length, 2);
assert(shelters.every((p) => p.structure === 'lean-to' && p.visualScale === 1.8));
const standard = z.props.find((p) => p.id === 'greenwood-thorn-homestead-standard');
assert(standard && standard.structure === 'crown-banner');
const lodge = z.props.find((p) => p.id === 'greenwood-thorn-homestead-lodge');
assert.equal(lodge.r, 40);
const shape = (zone) =>
  zone.props
    .filter((p) => p.greenwoodGoblinShelter || p.greenwoodWall || p.id.includes('thorn-homestead'))
    .map((p) => JSON.parse(JSON.stringify(p)));
const original = shape(z);
const yardIds = ['stronghold-treasury-yard-prop-2', 'stronghold-treasury-yard-prop-3'];
const yardBefore = yardIds.map((id) => {
  const p = z.props.find((x) => x.id === id);
  return [p.id, p.x, p.y];
});
assert.equal(z.greenwoodTreasuryYardLayoutVersion, 1, 'Treasury work yard migration is one-time');
const treasuryYardIds = ['stronghold-treasury-yard-prop-2', 'stronghold-treasury-yard-prop-3'];
for (const id of treasuryYardIds)
  assert.equal(z.props.filter((p) => p.id === id).length, 1,
    'Scornfang original yard object remains a singleton: ' + id);
const restBay = z.props.find((p) => p.greenwoodFacility === 'thorn-rest-bay');
assert(restBay?.roadBlocker && restBay?.r > 0, 'actual secondary shelter footprint preserved');
for (let i = 0; i < 2; i++) {
  const restored = C.restore(g.snapshot(), rng(0x47564103));
  assert.deepEqual(
    shape(restored.zone()),
    original,
    'restore must not repeatedly enlarge walls or duplicate shelters/standard',
  );
  assert.deepEqual(
    yardIds.map((id) => {
      const p = restored.zone().props.find((x) => x.id === id);
      return [p.id, p.x, p.y];
    }),
    yardBefore,
    'safe Treasury yard grouping must survive repeat v4 restore',
  );
}
// Exact perpendicular protection boundary, not only widely separated probes.
const defender = z.enemies.find((e) => e.stronghold === 'skeleton-watch');
assert(defender);
const originalPosition = { x: defender.x, y: defender.y };
Object.assign(defender, { x: 2670, y: 2060 - 159.99 });
assert(g.enemyFort(defender));
defender.y = 2060 - 160.01;
assert.equal(g.enemyFort(defender), null);
Object.assign(defender, originalPosition);
// Native hazard timing and native damage; do not stub the trap resolver.
const posts = z.ownerDefensiveTraps.filter((p) => p.owner === 'goblin-road-fort');
assert.equal(posts.length, 2);
const post = posts[0],
  tune = C.rules.outdoorMiniTrapTuning.vale;
const clockFor = (phase) =>
  (((phase - post.index * tune.offset) % tune.cycle) + tune.cycle) % tune.cycle;
const heroPosition = { x: g.hero.x, y: g.hero.y };
Object.assign(g.hero, { x: post.x, y: post.y, hp: 1000, maxHp: 1000, immune: 0 });
z.clock = clockFor(tune.warning / 2);
g.updateTraps(0.1);
assert.equal(g.hero.hp, 1000);
z.clock = clockFor(tune.warning + tune.active / 2);
g.updateTraps(0.1);
assert(g.hero.hp < 1000);
const hitHp = g.hero.hp;
g.updateTraps(0.1);
assert.equal(g.hero.hp, hitHp, 'once per native cycle');
Object.assign(g.hero, heroPosition);
const restored = C.restore(g.snapshot(), rng(0x47564103));
assert.deepEqual(restored.zone().ownerDefensiveTraps, z.ownerDefensiveTraps);
for (const enemy of z.enemies.filter((e) => e.stronghold === 'goblin-road-fort')) enemy.hp = 0;
assert(!g.traps().some((t) => t.index === post.index), 'garrison defeat ends its traps');
// Compare source-native art, including real shared lighting anchors. Not device proof.
const canvas = createCanvas(1100, 500),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#536b48';
ctx.fillRect(0, 0, 1100, 500);
V.draw(ctx, { ...lodge, renderKind: 'prop' }, { x: 190, y: 270 }, 0);
const treasury = z.npcs.find((p) => p.kind === 'dungeon' && /supply/.test(p.id));
assert(treasury, 'native Treasury entrance');
V.draw(ctx, { ...treasury, renderKind: 'npc' }, { x: 490, y: 270 }, 0);
V.draw(ctx, { ...shelters[0], renderKind: 'prop' }, { x: 790, y: 270 }, 0);
V.draw(ctx, { ...standard, renderKind: 'prop' }, { x: 990, y: 270 }, 0);
const lights = V.lightingFixtures(lodge, { x: 190, y: 270 }, 1, 0);
assert.equal(lights.length, 1);
assert.equal(lights[0].x, 230);
assert.equal(lights[0].y, 245);
fs.mkdirSync('test-artifacts/greenwood-environment', { recursive: true });
fs.writeFileSync(
  'test-artifacts/greenwood-environment/native-compounds.png',
  canvas.toBuffer('image/png'),
);

// Stage 2–4 source safeguards supplement the original native render and save
// smoke checks. No new world interaction or unreviewed sprite identity.
const landscapeSource = fs.readFileSync('src/prototype/greenwood-landscape.js', 'utf8');
const rendererSource = fs.readFileSync('src/prototype/renderer.js', 'utf8');
assert(landscapeSource.includes("const restRoof = ["), 'single-pitch resting shelter defined');
assert(landscapeSource.includes("z.greenwoodTreasuryYardLayoutVersion = 1"),
  'old v4 worlds can group the existing nonowned desk and barrel once');
assert(rendererSource.includes('e.greenwoodWall || flatGround || selfGrounded'),
  'native Canvas/Pixi common shadow contract suppresses duplicate farmyard ovals');
// Structural roof regression: test the projected geometry, not a screenshot
// baseline. Both planes must use the same ridge and parallel depth offset.
for (const path of [
  'src/prototype/visuals.js',
  'src/prototype/greenwood-landscape.js',
]) {
  const source = fs.readFileSync(path, 'utf8');
  const point = (name) => {
    const match = source.match(
      new RegExp('(?:const|,)\\s*' + name + '\\s*=\\s*\\[(-?\\d+),\\s*(-?\\d+)\\]'),
    );
    assert(match, 'roof vertex exists: ' + path + ' / ' + name);
    return [Number(match[1]), Number(match[2])];
  };
  const frontLeft = point('roofFrontLeft'),
    frontRidge = point('roofFrontRidge'),
    frontRight = point('roofFrontRight'),
    rearLeft = point('roofRearLeft'),
    rearRidge = point('roofRearRidge'),
    rearRight = point('roofRearRight');
  const delta = (a, b) => [b[0] - a[0], b[1] - a[1]];
  assert.deepEqual(delta(frontLeft, rearLeft), delta(frontRidge, rearRidge),
    path + ': left eave and ridge follow the same roof-depth axis');
  assert.deepEqual(delta(frontRight, rearRight), delta(frontRidge, rearRidge),
    path + ': right eave and ridge follow the same roof-depth axis');
  assert(frontRidge[0] > frontLeft[0] && frontRidge[0] < frontRight[0],
    path + ': ridge sits between the gable eaves');
  assert(frontRidge[1] < frontLeft[1] && frontRidge[1] < frontRight[1],
    path + ': roof slopes descend away from the ridge');
  assert(source.includes('[roofFrontLeft, roofFrontRidge, roofRearRidge, roofRearLeft]'),
    path + ': near slope uses the exact shared ridge');
  assert(source.includes('[roofFrontRidge, roofFrontRight, roofRearRight, roofRearRidge]'),
    path + ': far slope uses the exact shared ridge');
}
console.log(
  'PASS native compounds, roof topology, Crown standard, fixture anchor and repeat v4 restore',
);
