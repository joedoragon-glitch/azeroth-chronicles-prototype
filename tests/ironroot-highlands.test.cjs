'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const Visuals = require('../src/prototype/visuals');
const Sprites = require('../src/prototype/sprites');
const { createCanvas } = require('@napi-rs/canvas');
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}
const fresh = () => new C('normal', 'paladin', () => 0.9);
test('Ironroot production scenes leave homes, habitats, service spacing and roads intact', () => {
  const c = fresh();
  c.enter('highlands');
  const z = c.zone(),
    life = z.props.filter((p) => p.ironrootDistrict);
  for (const id of ['stonecross', 'quarry', 'caravan', 'roads', 'ogre-home'])
    assert(
      life.some((p) => p.ironrootDistrict === id),
      id + ' gets its functional scene',
    );
  for (const s of ['mint-workbench', 'highland-pay-station', 'ore-sorting-bay', 'ridge-supper'])
    assert(
      life.some((p) => p.structure === s),
      s + ' is visible',
    );
  assert(z.props.some((p) => p.structure === 'highland-stone-house'));
  assert(z.props.some((p) => p.structure === 'wolf-den'));
  assert(z.props.some((p) => p.structure === 'ridge-hearth'));
  assert(
    life.every((p) => p.decorative && p.r === 0),
    'new scenes do not change collision',
  );
  for (const p of life) {
    assert(z.npcs.every((n) => Math.hypot(n.x - p.x, n.y - p.y) >= 85));
    for (const road of z.roads)
      for (let i = 1; i < road.length; i++)
        assert(c.distanceToSegment(p, road[i - 1], road[i]) >= 65);
  }
  const original = JSON.stringify(life);
  delete z.ironrootLifeVersion;
  c.ironrootLivelihood(z);
  assert.equal(
    JSON.stringify(z.props.filter((p) => p.ironrootDistrict)),
    original,
    'repeated migration is deterministic',
  );
  for (const id of ['ore', 'bridge-north', 'ogre-hearth'])
    assert(c.siteDescription(z.npcs.find((n) => n.id === id)).includes(C.rules.ironrootLore[id]));
  c.enter('side-highlands-signal');
  assert(c.zone().props.some((p) => p.structure === 'game-table'));
  assert(c.zone().props.some((p) => p.structure === 'ridge-hearth'));
});
test('Treasury keeps the Wolf household captain, home comforts and exact cache identity during migration', () => {
  const c = fresh();
  c.enter('supply-highlands');
  const z = c.zone();
  assert.equal(z.treasuryVersion, 4);
  const crag = z.enemies.find((e) => e.roomCaptain);
  assert.equal(crag.species, 'wolf');
  assert.equal(crag.name, 'Crag Tyrant');
  assert.equal(z.enemies.filter((e) => e.roomGuard).length, 4);
  const props = new Set(z.props.map((p) => p.structure));
  for (const s of [
    'ridge-hearth',
    'ridge-supper',
    'ridge-bed',
    'ridge-game-corner',
    'ridge-study',
    'crag-rest',
    'boss-chest',
  ])
    assert(props.has(s));
  const exit = z.npcs.find((n) => n.kind === 'exit');
  for (const n of z.npcs.filter((n) => n.kind === 'bundle')) assert(c.route(exit, n).length);
  const dead = z.enemies.find((e) => e.roomGuard && !e.roomCaptain);
  dead.hp = 0;
  dead.deathPaid = true;
  c.s.discovered['highlands:bundle-2'] = true;
  const raw = c.snapshot();
  raw.zones[z.id].treasuryVersion = 3;
  const r = C.restore(raw);
  assert.equal(r.zone().enemies.find((e) => e.id === dead.id).hp, 0);
  assert(r.s.discovered['highlands:bundle-2']);
  assert(!r.s.discovered['highlands:bundle-0']);
  assert.deepEqual(
    r
      .visibleNPCs()
      .filter((n) => n.kind === 'bundle')
      .map((n) => n.index)
      .sort(),
    [0, 1],
  );
  assert.equal(r.zone().enemies.find((e) => e.roomCaptain).species, 'wolf');
});
test('Mine production, historic cuts and repair forge have trap-free connected routes', () => {
  const c = fresh();
  c.enter('mine');
  const z = c.zone(),
    a = C.rules.dungeonArchitecture.mine,
    traps = c.traps();
  assert.equal(z.dungeonVersion, 3);
  assert.equal(z.enemies.filter((e) => e.guard).length, 18);
  assert.equal(z.enemies.filter((e) => e.guard && e.ranged).length, 6);
  assert(
    z.enemies
      .filter((e) => e.guard && e.ranged)
      .every((e) => e.species === 'ogre' && e.projectileStyle === 'stone'),
    'ranged guardians retain their stone-throwing identity',
  );
  assert(z.enemies.filter((e) => e.guard).every((e) => e.gold === 0 && e.xp === 0));
  for (const id of [
    'receiving-haulage',
    'standard-workings',
    'old-workings',
    'repair-forge',
    'collapsed-shafts',
    'colossus-chamber',
  ])
    assert(a.walkable.some((w) => w.id === id));
  assert(c.blocked(750, 220, 'mine', 12), 'space beyond the authored tunnel is solid');
  const dara = z.npcs.find((n) => n.family === 'mine'),
    boss = z.enemies.find((e) => e.type === 'boss');
  assert.equal(dara.workstation, 'equipment-repair');
  assert.deepEqual(
    Sprites.candidateKeys({ ...dara, renderKind: 'npc' }, 2),
    [],
    'generic cage sprites cannot override the work area',
  );
  assert(!c.blocked(dara.x, dara.y, 'mine', 15));
  assert(z.enemies.every((e) => !c.blocked(e.home.x, e.home.y, 'mine', 12)));
  const blocked = c.blocked.bind(c);
  c.blocked = (x, y, id, r = 15, t) =>
    blocked(x, y, id, r, t) ||
    traps.some((p) =>
      c.trapContains(
        { ...p, radius: p.radius + r, length: p.length + 2 * r, halfWidth: p.halfWidth + r },
        { x, y },
      ),
    );
  const targets = [boss, dara, { x: 1200, y: 600 }, { x: 300, y: 850 }, { x: 650, y: 760 }];
  for (const target of targets)
    assert(
      c.route({ x: 160, y: 240 }, target).length,
      'trap-free route to ' + (target.name || JSON.stringify(target)),
    );
  c.blocked = blocked;
  for (const target of targets) {
    const actor = { x: 160, y: 240 };
    for (let n = 0; n < 1000 && Math.hypot(actor.x - target.x, actor.y - target.y) > 20; n++)
      c.follow(actor, target, 300, 0.1, 18);
    assert(
      Math.hypot(actor.x - target.x, actor.y - target.y) <= 20,
      'actual follow traverses the mine',
    );
  }
  Object.assign(c.hero, dara);
  assert(!c.interact(dara), 'forced work does not bypass the boss key');
  assert(!c.s.rescued.mine);
  assert(!c.s.rescued.ridge);
  c.s.keys.mine = true;
  assert(c.interact(dara));
  assert(c.s.rescued.mine);
  assert(!c.s.rescued.ridge);
  c.enter('highlands');
  assert(c.zone().npcs.some((n) => n.id === 'service-mine'));
  assert(!c.zone().npcs.some((n) => n.id === 'service-ridge'));
  assert(C.restore(c.snapshot()).s.rescued.mine);
});
test('Legacy Mine occupants migrate without changing money, deaths, damage, paid clears or rescues', () => {
  const c = fresh();
  c.enter('mine');
  const z = c.zone();
  const dead = z.enemies.find((e) => e.guard);
  dead.hp = 0;
  dead.deathPaid = true;
  const wound = z.enemies.find((e) => e.guard && e !== dead);
  wound.hp = wound.maxHp * 0.4;
  c.hero.gold = 777;
  Object.assign(c.hero, { x: 750, y: 220 });
  c.s.party = [c.unit('soldier', 740, 230)];
  const raw = c.snapshot();
  raw.zones.mine.dungeonVersion = 2;
  raw.zones.mine.enemies.find((e) => e.id === wound.id).hp = wound.maxHp * 0.4;
  delete raw.zones.mine.ironrootStagingVersion;
  raw.zones.mine.npcs.find((n) => n.kind === 'cage').x = 1200;
  raw.zones.mine.npcs.find((n) => n.kind === 'cage').y = 1270;
  const r = C.restore(raw);
  assert.equal(r.hero.gold, 777);
  assert(!r.blocked(r.hero.x, r.hero.y, 'mine', 12));
  assert(r.activeParty().every((u) => !r.blocked(u.x, u.y, 'mine', 12)));
  assert.equal(r.zone().enemies.find((e) => e.id === dead.id).hp, 0);
  assert.equal(r.zone().enemies.find((e) => e.id === wound.id).hp / wound.maxHp, 0.4);
  assert(!r.s.rescued.mine);
  const cleared = r.snapshot();
  cleared.normal.mine = true;
  cleared.keys.mine = true;
  cleared.paid['clear:mine'] = true;
  cleared.rescued.mine = true;
  const rescueQuest = r.questDefs().find((q) => q.kind === 'rescue' && q.target === 'mine');
  Object.assign(cleared.quests[rescueQuest.id], { done: true, paid: true });
  cleared.zones.mine.enemies = [];
  cleared.zones.mine.dungeonVersion = 2;
  const done = C.restore(cleared);
  assert.equal(done.zone().enemies.length, 0);
  assert(done.s.rescued.mine && done.s.paid['clear:mine']);
  assert.equal(done.hero.gold, 777);
});
test('TRUE Colossus and Ridge summons preserve their established species and caps', () => {
  const c = fresh();
  c.s.normal.mine = true;
  c.s.phase = 'awakening';
  c.s.awakeningLevel = 21;
  c.s.pending.mine = { kind: 'dungeon', count: 1 };
  c.enter('mine');
  const boss = c.zone().enemies.find((e) => e.type === 'boss' && e.form === 'true');
  assert(boss);
  assert(!c.blocked(boss.x, boss.y, 'mine', 15));
  c.summonBossAdds(boss, c.trueSummonPlan(boss), c.bossSummonCap(boss));
  const adds = c.zone().enemies.filter((e) => e.owner === boss.id && e.summon);
  assert.equal(adds.length, 6);
  assert(adds.every((e) => e.species === 'ogre' && !c.blocked(e.x, e.y, 'mine', 12)));
  assert.equal(adds.filter((e) => e.trueSummonRole === 'captain').length, 2);
  assert.equal(C.rules.trueBossSummons.families.ridge.species, 'archer');
  assert(C.data.bosses.find((b) => b.id === 'ridge').history.includes('Hired ridge archers'));
});
test('Ironroot procedural scenes and Dara render deterministically without changing game state', () => {
  const c = fresh();
  const canvas = createCanvas(180, 180),
    ctx = canvas.getContext('2d');
  const structures = [
    'highland-pay-station',
    'ore-sorting-bay',
    'mint-workbench',
    'caravan-loading-bay',
    'mine-supports',
    'mine-old-markings',
    'mine-collapse',
    'ridge-supper',
    'ridge-game-corner',
    'ridge-study',
    'ridge-bed',
    'crag-rest',
  ];
  const signatures = [];
  for (const structure of structures) {
    const entity = { id: 'test-' + structure, renderKind: 'prop', decorative: true, structure };
    ctx.clearRect(0, 0, 180, 180);
    Visuals.draw(ctx, entity, { x: 90, y: 90 }, 2);
    const first = canvas.toBuffer('image/png');
    ctx.clearRect(0, 0, 180, 180);
    Visuals.draw(ctx, entity, { x: 90, y: 90 }, 2);
    assert(first.equals(canvas.toBuffer('image/png')));
    signatures.push(first.toString('base64'));
  }
  assert.equal(new Set(signatures).size, structures.length);
  c.enter('mine');
  const saved = JSON.stringify(c.s),
    dara = c.zone().npcs.find((n) => n.kind === 'cage');
  for (const rescued of [false, true])
    Visuals.draw(ctx, { ...dara, renderKind: 'npc' }, { x: 90, y: 90 }, 2, rescued);
  assert.equal(JSON.stringify(c.s), saved);
});
console.log('PASS ' + passed + ' Ironroot implementation scenarios');
