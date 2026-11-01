'use strict';
// Staged without execution at the director's request. This file is an
// integration acceptance scaffold, NOT a certification of any fix.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Renderer = require('../src/prototype/renderer.js');
const R = Campaign.rules;

function game() {
  const c = new Campaign('normal', 'paladin', () => 0.9);
  c.s.mercyTime = 0;
  c.line = () => true;
  return c;
}

function mob(c, species, x, y, options = {}) {
  const e = c.makeEnemy(
    { species, name: species + ' issue fixture', level: 1, hp: 5000,
      damage: 1, gold: 0, xp: 0 },
    { x, y },
  );
  Object.assign(e, options);
  c.zone().enemies.push(e);
  return e;
}

// #1: a locked or explicitly selected skill is a movement command after
// release, not an immediate failure or an early resource/cooldown expense.
{
  const c = game();
  const e = mob(c, 'goblin', 1100, 1000);
  Object.assign(c.hero, { x: 700, y: 1000 });
  c.route = () => [{ x: e.x, y: e.y }];
  const mp = c.hero.mp;
  assert(c.cast(1, e.id, true), 'out-of-range charged attack becomes pending approach');
  assert.equal(c.hero.order?.type, 'skill-approach');
  assert.equal(c.hero.mp, mp, 'approach costs no mana');
  assert.equal(c.hero.cd[0], 0, 'approach costs no skill cooldown');
  assert.notEqual(c.snapshot().hero.order?.type, 'skill-approach', 'do not persist combat approach');
  Object.assign(c.hero, { x: e.x - 95, y: e.y });
  c.tick(0.05);
  assert.equal(c.hero.order, null, 'in-range auto-release consumes the pending command');
  assert(c.hero.cd[0] > 0, 'skill spends its cooldown on actual execution');
}
// #2: Recall is a durable defensive command; formation proximity alone
// must not authorize a renewed offensive chase.
{
  const c = game();
  c.s.party = [c.unit('soldier', c.hero.x + 15, c.hero.y + 15)];
  c.recallParty();
  c.updateParty(0.05);
  assert.equal(c.s.recallActive, true, 'reaching formation never resets Recall');
  const e = mob(c, 'goblin', c.hero.x + 75, c.hero.y);
  assert(c.cast(1, e.id), 'manual Skill 1 remains available while Recall is active');
  assert.equal(c.s.recallActive, true,
    'explicit Skill 1 cannot override Recall; only the button or timeout can');
}
// Community + #311 intersection: Recall uses pet-specific stationary basics,
// not the Soldier fallback; no pet spell, charge or re-engagement is authorized.
for (const family of ['crypt', 'thorn']) {
  const c = game();
  c.zone().enemies = [];
  c.s.true[family] = true;
  const pet = c.unit('pet', c.hero.x + 12, c.hero.y, family);
  pet.active = true;
  pet.cd = 0;
  c.s.party = [pet];
  c.recallParty();
  const foe = mob(c, 'goblin', c.hero.x + 45, c.hero.y, { aggro: true, damage: 0 });
  const originalEvents = c.event;
  const events = [];
  c.event = function (kind, payload) {
    events.push({ kind, ...payload });
    return originalEvents.call(this, kind, payload);
  };
  c.updateParty(0.05);
  assert.equal(c.s.recallActive, true, 'pet defense does not re-engage');
  assert.equal(pet.order, null, 'pet does not chase from Recall');
  assert(pet.cd > 0, 'one basic defensive cooldown');
  if (family === 'crypt') {
    assert(c.s.projectiles.some((p) => p.source === pet.id &&
      p.style === 'pet' && p.petFamily === family), 'ranged pet retains pet projectile');
    assert(events.some((e) => e.kind === 'projectileLaunch' &&
      e.role === 'pet' && e.source === pet.id));
  } else {
    assert(events.some((e) => e.kind === 'melee' &&
      e.role === 'pet' && e.source === pet.id), 'melee pet retains pet identity');
  }
  assert(!events.some((e) => e.kind === 'heroSkillCast' ||
    (e.kind === 'petSkill' && e.slot > 0)), 'no offensive skill during Recall');
  assert(foe.hp > 0, 'pursuer is still a real combatant');
}
// #3: real dropped crowns and the mint share an explicit Dark Lord portrait;
// the existing pixel raster suite remains the authoritative native-size proof.
{
  const canvas = require('@napi-rs/canvas').createCanvas(70, 70);
  Renderer.drawCrownLoot(canvas.getContext('2d'), { x: 35, y: 35 });
  const pixels = canvas.getContext('2d').getImageData(25, 23, 20, 26).data;
  assert(pixels.some((n) => n > 0), 'coin has a painted face');
}
// #4: all hostiles share allegiance irrespective of pack or species.
{
  const c = game();
  c.zone().enemies = [];
  const healer = mob(c, 'goblin', 800, 800, { ranged: true, aggro: true, pack: 'alpha' });
  const ally = mob(c, 'wolf', 840, 800, { aggro: true, pack: 'beta' });
  ally.hp = ally.maxHp * 0.6;
  assert(c.enemySupportHeal(healer), 'mixed-species enemy support succeeds');
  assert(ally.supportHeal && healer.supportHealCd > 0);
}
// #5: lore details extend rather than replace the canon-based Treasury scenes.
{
  assert(R.treasuryDecor['supply-vale'].some((row) => row[4] === 'scornfang-reclamation-records'));
  assert(R.treasuryDecor['supply-crown'].some((row) => row[4] === 'dreadmaw-agriculture-processing'));
  assert.equal(R.supplyRooms.find((r) => r.id === 'supply-vale').count, 2);
}
// #6: substantial scenery in all regions can occlude actors; low plants cannot.
{
  for (const structure of ['mangrove', 'rock-cluster', 'fortress', 'hatchery', 'weapon-rack'])
    assert(Renderer.majorOccluder({ renderKind: 'prop', structure }), structure + ' is cover');
  assert(!Renderer.majorOccluder({ renderKind: 'prop', structure: 'grass' }));
}
// #7: any Treasury guard's engagement wakes its own commander, even if
// the guard and commander belong to different formation packs.
{
  const c = game();
  c.enter('supply-vale');
  const enemies = c.zone().enemies;
  const captain = enemies.find((e) => e.roomCaptain && e.hp > 0);
  const guard = enemies.find((e) => e.roomGuard && !e.roomCaptain && e.hp > 0);
  assert(captain && guard && guard.pack !== captain.pack);
  captain.aggro = guard.aggro = false;
  c.engage(guard);
  assert(captain.aggro, 'the captain responds to a threatened Treasury guard');
}
// #8: explicit Greenwood endurance request, but no blanket 50% increase to
// already formidable later captains. Per-skill geometry is independently tuned.
{
  assert.equal(R.roomCaptains['supply-vale'].enduranceHp, 390);
  assert.equal(R.roomCaptains['supply-vale'].attacks[1].radius, 120);
  assert.equal(R.roomCaptains['supply-crown'].enduranceHp, 5000);
  for (const id of ['supply-vale', 'supply-march', 'supply-highlands', 'supply-crown'])
    assert(R.roomCaptains[id].specialRange >= 490);
}
// Bosses with a lore-supported ordinary species counterpart receive their
// inherited basic too; unique creatures never receive a fabricated species ID.
assert.equal(R.tacticalFoundation.bossSpeciesRogue.mine, 'ogre');
assert.equal(R.tacticalFoundation.bossSpeciesRogue.crypt, 'skeleton');
assert.equal(R.tacticalFoundation.bossSpeciesRogue.abyss, undefined);
// #9: Scornfang can choose a Goblin basic trick *and* his own captain trick,
// without reclassifying a signature as a forced combo.
{
  const c = game();
  c.enter('supply-vale');
  const e = c.zone().enemies.find((u) => u.roomCaptain);
  Object.assign(c.hero, { x: e.x + 120, y: e.y });
  c.tacticalRogueOutnumbered = () => false;
  c.tacticalRogueRegroup = () => null;
  c.tacticalHighestThreatTarget = (_, fallback) => fallback;
  e.rogueBasicTurn = 0;
  e.telegraph = null;
  assert(c.tacticalRogueMove(e, c.hero));
  assert.equal(e.telegraph.name, 'Blinding Dust');
  e.telegraph = null;
  assert(c.tacticalRogueMove(e, c.hero));
  assert.equal(e.telegraph.name, 'Impoundment');
}
// #10: one shared special clock, periodic pursuit readiness, and
// population reads must not accidentally override an active timer.
{
  const c = game();
  c.enter('supply-vale');
  const e = c.zone().enemies.find((u) => u.roomCaptain);
  e.specialCd = 2.5;
  c.zone();
  assert.equal(e.specialCd, 2.5, 'reconciling a Treasury must not cap the live cooldown');
  assert(R.roomCaptains['supply-vale'].specialCooldown < 4.2);
  assert(R.roomCaptains['supply-march'].specialCooldown < 4.4);
}
console.log('PASS ten pre-snapshot source and gameplay issue probes');
