'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const boss = Campaign.data.bosses.find((b) => b.id === 'mine');
const ridge = Campaign.data.bosses.find((b) => b.id === 'ridge');
const R = Campaign.rules;
const fresh = () => new Campaign('normal', 'paladin', () => 0.9);

assert.equal(boss.kind, 'dungeon');
assert.equal(boss.region, 'highlands');
assert.equal(boss.name, 'Stone Colossus');
assert.equal(boss.captive, 'Dara the Highland Smith');
assert.match(boss.role, /Garun the Firstborn.*Bastion/);
for (const fact of [
  'Ogre Bastion',
  'heartstone',
  'golden eyes',
  'Dark Lord',
  'council',
  'connected roads',
  'settlement relocations',
  'monster peoples',
  'Ridge Tyrant',
  'Dara',
  'artistic commissions',
  'compulsory safety',
])
  assert(boss.history.includes(fact), 'biography covers ' + fact);
assert.doesNotMatch(boss.history, /ancient guardian|exposed by.*workings/i);
assert.equal(ridge.role, "The Dark Lord's Master of Coin");
assert.equal(boss.hp, 3200);
assert.equal(boss.damage, 42);
assert.equal(boss.gold, 300);
assert.equal(boss.xp, 375);
assert.equal(boss.attacks.length, 5);
assert.deepEqual(
  boss.attacks.map((line) => line.split(':')[0]),
  ['Punching Shear', 'Progressive Collapse', 'Dynamic Compaction', 'Pile Driving', 'Mass Underpinning'],
);
assert.equal(R.tacticalFoundation.rogueMoves.bosses.mine.name, 'Garun’s Lateral Load Transfer');
assert.equal(R.tacticalFoundation.rogueSignatures.bosses.mine.name, 'Garun’s Passive Earth Pressure');
assert.deepEqual(
  R.attacks.mine.map((a) => [a.kind, a.warning, a.recovery]),
  [
    ['circle', 1.6, 2.5],
    ['circle', 1.7, 1.5],
    ['ring', 1.6, 1.6],
    ['line', 1.7, 3],
    ['summon', 1.8, 1.5],
  ],
);
assert.equal(R.attacks.mine[0].opening, 2.5);
assert.equal(R.attacks.mine[3].opening, 3);
assert.equal(R.attacks.mine[3].charge, true);
assert.equal(R.attacks.mine[4].species, 'ogre');
assert.equal(R.tacticalFoundation.rogueSignatures.bosses.mine.effect, 'sweep');
console.log('PASS Colossus identity leaves Ridge authority, attack slots and vulnerability windows intact');

const c = fresh();
assert(c.enter('mine'));
const mineLore = R.dungeonLore.mine;
assert.match(mineLore, /Garun the Firstborn/);
assert(c.messages.includes(mineLore), 'mine-entry clue is visible to the player');
assert(c.s.discovered['highlands:dungeon-lore:mine'], 'lore is recorded without a schema bump');
const z = c.zone();
assert.equal(z.dungeonVersion, 3);
assert.equal(z.enemies.filter((e) => e.guard).length, 18);
assert.equal(c.traps().length, 18);
assert(z.props.some((p) => p.structure === 'mine-old-markings'));
assert(z.props.some((p) => p.structure === 'ore-sorting-bay'));
const normal = z.enemies.find((e) => e.type === 'boss' && e.family === 'mine');
assert(normal && normal.form === 'normal');
const dara = z.npcs.find((n) => n.family === 'mine' && n.kind === 'cage');
assert(dara);
assert.equal(dara.workstation, 'equipment-repair');
assert.match(dara.context, /pays for repairs/);
assert.match(dara.context, /not leave the Mine/);
c.hero.x = dara.x;
c.hero.y = dara.y;
assert.equal(c.interact(dara), false, 'narrative change must not unlock the captive');
assert(c.messages.some((m) => m.includes('pays for repairs')));
assert(!c.s.rescued.mine);
assert(!c.s.keys.mine);
const messages = [];
const say = c.say.bind(c);
c.say = (line) => {
  messages.push(line);
  say(line);
};
c.enter('highlands');
c.enter('mine');
assert(!messages.includes(mineLore), 'entry clue should not repeat after discovery');
const old = Campaign.restore(c.snapshot());
assert(old.s.discovered['highlands:dungeon-lore:mine']);
assert(!old.s.rescued.mine);
assert.equal(old.s.keys.mine, undefined);
assert.equal(old.zone().npcs.find((n) => n.family === 'mine').workstation, 'equipment-repair');
assert.equal(old.zone().enemies.filter((e) => e.guard).length, 18);
console.log('PASS player-visible Mine and Dara clues, locked rescue, old-save-compatible first discovery');

for (const phase of ['adventure', 'awakening']) {
  const game = fresh();
  game.s.normal.mine = true;
  game.s.phase = phase;
  if (phase === 'awakening') {
    game.s.awakeningLevel = 21;
    game.s.normal.darklord = true;
    game.s.true.darklord = true;
  }
  game.s.pending.mine = { kind: 'dungeon', count: 1 };
  assert(game.enter('mine'));
  const trueBoss = game.zone().enemies.find((e) => e.family === 'mine' && e.form === 'true');
  assert(trueBoss, phase + ' TRUE Colossus exists under unchanged family');
  assert.equal(trueBoss.family, 'mine');
  game.summonBossAdds(trueBoss, game.trueSummonPlan(trueBoss), game.bossSummonCap(trueBoss));
  const adds = game.zone().enemies.filter((e) => e.owner === trueBoss.id && e.summon);
  assert.equal(adds.length, 6);
  assert(adds.every((e) => e.species === 'ogre'));
  const restored = Campaign.restore(game.snapshot());
  assert(restored.zone().enemies.some((e) => e.family === 'mine' && e.form === 'true'));
}
console.log('PASS early TRUE and Awakening Colossus retain six Ogre warband and save family');

const workshop = fresh();
workshop.enter('mine');
const workshopZone = workshop.zone();
const collection = workshopZone.props.filter((p) =>
  ['geometric-gallery', 'kinetic-collection', 'art-object'].includes(p.sceneRole),
);
assert.equal(collection.length, 3, 'Garun owns three compact collectible displays');
assert(collection.every((p) => p.decorative && p.r === 0), 'gallery cannot change travel geometry');
const beforeGallery = workshop.snapshot();
beforeGallery.zones.mine.props = beforeGallery.zones.mine.props.filter(
  (p) => !['geometric-gallery', 'kinetic-collection', 'art-object'].includes(p.sceneRole),
);
const restoredGallery = Campaign.restore(beforeGallery);
assert.equal(
  restoredGallery.zone().props.filter((p) =>
    ['geometric-gallery', 'kinetic-collection', 'art-object'].includes(p.sceneRole),
  ).length,
  3,
  'old Mine saves receive the collection without resetting the dungeon version',
);
const inspecting = workshopZone.enemies.find((e) => e.family === 'mine' && e.type === 'boss');
const originalPosition = { x: inspecting.x, y: inspecting.y };
for (let t = 0; t < 900; t++) workshop.updateIdleWander(inspecting, 0.1);
assert(
  Math.hypot(inspecting.x - originalPosition.x, inspecting.y - originalPosition.y) > 3,
  'Garun visibly leaves his post to inspect valid Mine stations',
);
assert(!workshop.blocked(inspecting.x, inspecting.y, 'mine', 16));
assert.equal(inspecting.aggro, false);
inspecting.aggro = true;
const frozenPosition = { x: inspecting.x, y: inspecting.y };
workshop.updateIdleWander(inspecting, 0.1);
assert.deepEqual([inspecting.x, inspecting.y], [frozenPosition.x, frozenPosition.y]);
console.log('PASS historical Mine gallery and bounded nonaggressive inspection patrol');

const builder = fresh();
builder.enter('mine');
const builderZone = builder.zone();
const architect = builderZone.enemies.find((e) => e.family === 'mine' && e.type === 'boss');
const baselineExit = builder.route(builder.hero, builderZone.npcs.find((n) => n.kind === 'exit')).length > 0;
const baselineDara = builder.route(builder.hero, builderZone.npcs.find((n) => n.kind === 'cage')).length > 0;
let built = 0;
for (const [x, y] of [[1100, 1100], [1100, 920], [1180, 1220], [990, 1190]]) {
  built += builder.raiseMineWorks(architect, { x, y });
  if (built > 0) break;
}
assert(built > 0 && built <= 2, 'construction finds at least one safe, temporary support');
const supports = builderZone.props.filter((p) => p.garunTemporary);
assert.equal(supports.length, built);
assert(supports.every((p) => p.r === 24 && !p.decorative && builder.blocked(p.x, p.y, 'mine', 12)));
const mineExit = builderZone.npcs.find((n) => n.kind === 'exit');
const smith = builderZone.npcs.find((n) => n.family === 'mine' && n.kind === 'cage');
if (baselineExit) assert(builder.route(builder.hero, mineExit).length);
if (baselineDara) assert(builder.route(builder.hero, smith).length);
assert(!builder.snapshot().zones.mine.props.some((p) => p.garunTemporary));
const afterLoad = Campaign.restore(builder.snapshot());
assert(!afterLoad.zone().props.some((p) => p.garunTemporary));
builder.s.time += 10;
builder.tick(0.05);
assert(!builderZone.props.some((p) => p.garunTemporary), 'supports expire without becoming permanent walls');
assert.equal(builderZone.enemies.filter((e) => e.guard).length, 18);
console.log('PASS temporary support placement, collision, route access, save exclusion and expiry');

const works = fresh();
works.enter('mine');
const mineBoss = works.zone().enemies.find((e) => e.family === 'mine' && e.type === 'boss');
const gallery = works.zone().props.filter((p) =>
  ['geometric-gallery', 'kinetic-collection', 'art-object'].includes(p.sceneRole),
);
assert.equal(gallery.length, 3, 'Garun has three existing-art geometric collectibles');
assert(gallery.every((p) => p.decorative && p.r === 0));
works.updateIdleWander(mineBoss, 0.1);
assert(Number.isFinite(mineBoss.inspectionWait), 'boss begins a bounded inspection patrol');
const originalProps = works.zone().props.length;
const placed = works.raiseMineWorks(mineBoss, { x: mineBoss.x, y: mineBoss.y });
assert(placed >= 0 && placed <= 2, 'only two supports may be raised');
assert.equal(works.zone().props.length, originalProps + placed);
const structures = works.zone().props.filter((p) => p.garunTemporary);
assert(structures.every((p) => p.r === 24 && !p.decorative));
assert(!works.snapshot().zones.mine.props.some((p) => p.garunTemporary));
const reload = Campaign.restore(works.snapshot());
assert.equal(reload.zone().props.filter((p) => p.garunTemporary).length, 0);
assert.equal(reload.zone().props.filter((p) => p.sceneRole === 'art-object').length, 1);
works.s.time += 10;
works.tick(0.1);
assert.equal(works.zone().props.filter((p) => p.garunTemporary).length, 0);
works.raiseMineWorks(mineBoss, { x: mineBoss.x, y: mineBoss.y });
works.enter('highlands');
assert.equal(works.s.zones.mine.props.filter((p) => p.garunTemporary).length, 0);
console.log('PASS Garun inspection, gallery, temporary route-checked supports, expiry and save cleanup');

