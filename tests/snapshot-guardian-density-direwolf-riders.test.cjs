'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Visuals = require('../src/prototype/visuals.js');

// A population review, not a substitute for the final campaign/gameplay audit.
const targets = [
  ['supply-vale', 8, 0],
  ['supply-march', 8, 0],
  ['supply-highlands', 7, 6],
  ['supply-crown', 11, 0],
];
for (const [id, expected, riders] of targets) {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.enter(id);
  const zone = game.zone(),
    posts = zone.enemies.filter((e) => e.roomGuard).sort((a, b) => game.idOrder(a, b)),
    captains = posts.filter((e) => e.roomCaptain),
    ordinary = posts.filter((e) => !e.roomCaptain);
  assert.equal(posts.length, expected, id + ' has the authored population');
  assert.equal(captains.length, 1, id + ' retains exactly one native captain');
  assert.equal(ordinary.length, expected - 1);
  assert(ordinary.every((e) => e.gold === 0 && e.xp === 0),
    id + ' has no repeatable guardian XP/crowns');
  assert(ordinary.some((e) => e.ranged && e.forcedRole === 'ranged'),
    id + ' has a working ranged line');
  assert(ordinary.some((e) => !e.ranged && e.forcedRole === 'melee'),
    id + ' has working melee screening');
  if (id === 'supply-vale' || id === 'supply-march') {
    const captain = captains[0];
    const rangedGuards = ordinary.filter((e) => e.ranged && e.forcedRole === 'ranged');
    assert.equal(rangedGuards.length, 3, id + ' has exactly three independent ranged healers');
    const commandGuards = rangedGuards.filter((e) =>
      ['Greenwood command lookout', 'Greenwood rear lookout',
        'Marsh command lookout', 'Marsh rear lookout'].includes(e.name));
    assert.equal(commandGuards.length, 2, id + ' keeps two newly authored command guards');
    for (const guard of commandGuards) {
      assert(Math.hypot(guard.x - captain.x, guard.y - captain.y) <= 350,
        id + ' command healer is physically within treatment range');
      assert(game.line(guard, captain), id + ' command healer has line of sight');
    }
  }
  assert.equal(posts.filter((e) => e.mountedCrownRider).length, riders);
  for (const e of posts) {
    assert(!game.blocked(e.home.x, e.home.y, id, 12),
      id + ' guard has a real clear home ' + e.name);
    assert(game.route(game.hero, e.home).length > 0, id + ' guarded post is reachable');
  }
  for (const point of zone.npcs.filter((n) => n.kind === 'bundle'))
    assert(game.route(game.hero, point).length > 0,
      id + ' old Treasury cache is still reachable');

  // Emulate an older v4 room with only four guard IDs and one killed sentry.
  const original = posts.slice(0, 4),
    dead = original[0],
    save = game.snapshot();
  const keep = new Set(original.map((e) => e.id));
  save.zones[id].enemies = save.zones[id].enemies.filter((e) => !e.roomGuard || keep.has(e.id));
  const fallen = save.zones[id].enemies.find((e) => e.id === dead.id);
  fallen.hp = 0;
  fallen.deathPaid = true;
  for (const e of save.zones[id].enemies) delete e.mountedCrownRider;
  const reloaded = Campaign.restore(save);
  reloaded.enter(id);
  const after = reloaded.zone().enemies.filter((e) => e.roomGuard);
  assert.equal(after.length, expected, id + ' adds missing slots to existing v4 room');
  assert(after.some((e) => e.id === dead.id && e.hp === 0),
    id + ' never revives a previously defeated guardian');
  assert(original.every((e) => after.some((f) => f.id === e.id)),
    id + ' retains original guard/captain identities');
  assert(after.filter((e) => !e.roomCaptain).every((e) => e.gold === 0 && e.xp === 0));
  const ids = after.map((e) => e.id).sort();
  reloaded.zone();
  assert.deepEqual(reloaded.zone().enemies.filter((e) => e.roomGuard)
    .map((e) => e.id).sort(), ids, id + ' no duplicate spawn on repeated reads');
}

for (const mode of ['normal', 'nightmare']) {
  const game = new Campaign(mode, 'paladin', () => 0.9);
  game.enter('mine');
  const zone = game.zone(),
    natives = zone.enemies.filter((e) => e.guard && e.form === 'normal' && !e.reinforcement),
    riders = natives.filter((e) => e.mountedCrownRider);
  assert.equal(natives.length, 18, 'original Mine population retained');
  assert.equal(riders.length, 10, 'original Wolf guard slots become mounted Crown troops');
  assert(riders.every((e) => e.species === 'wolf' && e.gold === 0 && e.xp === 0),
    'mount retains direwolf combat species, level and zero farming rewards');
  assert(riders.some((e) => e.ranged) && riders.some((e) => !e.ranged),
    'Crown mounted archers and lance riders both exist');
  assert(natives.filter((e) => e.species === 'ogre').every((e) => !e.mountedCrownRider),
    'Garun retains original Ogre workers and security');
  const mount = riders.find((e) => !e.ranged);
  game.s.party = [];
  Object.assign(game.hero, { x: mount.x + 120, y: mount.y,
    hp: 10000, maxHp: 10000, level: mount.level + 1, immune: 0 });
  Object.assign(mount, { aggro: true, cd: 100, summonCd: 100 });
  assert(game.tacticalRogueMove(mount, game.hero), 'mounted rider can start real Rogue move');
  assert.equal(mount.telegraph.style, 'dash');
  assert(mount.telegraph.mobileRogueCast, 'rider uses the authorized mobile cast bar');
  const basic = Campaign.rules.tacticalFoundation.rogueMoves.species.wolf;
  assert.equal(
    mount.telegraph.radius,
    165 * Campaign.rules.balance.enemySpecialReachMultiplier,
    'mounted lance keeps the authored scaled mounted-Rogue dash reach',
  );
  assert.equal(mount.telegraph.coefficient, basic.coefficient,
    'direwolf dash keeps the original guardian damage coefficient');

  const saved = game.snapshot();
  const old = saved.zones.mine.enemies.find((e) => e.id === mount.id);
  delete old.mountedCrownRider;
  old.hp = 0; old.deathPaid = true;
  const recovered = Campaign.restore(saved);
  recovered.enter('mine');
  const same = recovered.zone().enemies.find((e) => e.id === mount.id);
  assert(same.mountedCrownRider && same.hp === 0,
    'older Mine saves upgrade the rider appearance without reviving dead wolves');
}
for (const kind of ['direwolf-kennel','rider-tack-rack','rider-bunk']) {
  assert(Campaign.rules.treasuryDecor['supply-highlands'].some((p) => p[2] === kind),
    'Ironroot Treasury includes shared human/wolf life: ' + kind);
  assert(Campaign.rules.dungeonDecor.mine.some((p) => p[2] === kind),
    'Garun Mine includes shared human/wolf life: ' + kind);
}
// Draw both rider silhouettes using the real procedural art function.
for (const ranged of [false, true]) {
  let fills = 0, strokes = 0;
  const canvas = {
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, bezierCurveTo() {}, quadraticCurveTo() {}, ellipse() {}, arc() {},
    fill() { fills++; }, stroke() { strokes++; },
  };
  Visuals.draw(canvas, { id: 'crown-rider', renderKind: 'enemy', type: 'mob',
    species: 'wolf', mountedCrownRider: true, ranged },
  { x: 80, y: 100 }, 2);
  assert(fills >= 18 && strokes >= 18, 'armored ' + (ranged ? 'archer' : 'lancer') +
    ' has actual detailed human/direwolf drawing');
  assert(Visuals.height({ mountedCrownRider: true, type: 'mob' }) === 99);
}
console.log('PASS four proportionate Treasuries, legacy no-revive, main Mine riders, roles, dash, mixed camps and art');
