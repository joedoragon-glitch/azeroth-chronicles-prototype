'use strict';

// Focused original Campaign Reversal regression. Legacy two-warning fixtures
// intentionally use a temporary in-memory Strategist identity; later cases
// enable lawful Developer-only admission for lifecycle/restore checks.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

function scene(family) {
  const g = new C('developer', 'paladin', () => 0.9);
  g.enter(family);
  g.s.mercyTime = 0;
  const z = g.zone();
  z.enemies = [];
  const index = family === 'mine' ? 0 : 1;
  // Search a small deterministic space in the REAL generated dungeon. No
  // fabricated terrain, collision bypass, synthetic warning, or renderer hitbox.
  for (let x = 280; x <= 1160; x += 110)
    for (let y = 260; y <= 1130; y += 110) {
      const origin = { x, y };
      const target = { x: x + 220, y };
      const onWarning = family === 'mine'
        ? { ...target }
        : { x: x + 150, y: y + 85 };
      const buddy = { x: onWarning.x + 9, y: onWarning.y + 5 };
      if ([origin, target, onWarning, buddy].some((p) =>
        g.blocked(p.x, p.y, family, 15))) continue;
      if (!g.line(origin, onWarning) || !g.line(origin, target)) continue;
      const boss = g.bossEnemy(g.boss(family), 'normal', origin);
      const warning = g.buildBossAttack(boss, index, target, false).first;
      g.prepareGroundAttack(boss, warning);
      if (!g.strategistReversalCovers(warning, onWarning) ||
          !g.strategistReversalCovers(warning, buddy)) continue;
      z.enemies = [boss];
      Object.assign(g.hero, onWarning, {
        class: 'strategist', hp: 2000, maxHp: 2000, immune: 0, keeperHeld: null,
      });
      const soldier = g.s.party.find((p) => p.type === 'soldier');
      assert(soldier, 'starter party remains present');
      Object.assign(soldier, buddy, { hp: 2000, maxHp: 2000, active: true, immune: 0 });
      for (const ally of g.s.party.filter((p) => p !== soldier))
        ally.active = false;
      boss.telegraph = warning;
      boss.aggro = true;
      assert.equal(warning.index, index);
      return { g, boss, warning, soldier };
    }
  throw Error('No open actual ' + family + ' dungeon positions with authentic warned impact');
}

for (const family of ['mine', 'archive']) {
  const { g, boss, warning, soldier } = scene(family);
  const hp = g.hero.hp, allyHp = soldier.hp, bossHp = boss.hp;
  assert(warning.timer > 0 && warning.total >= warning.timer);
  assert.equal(g.attemptStrategistReversal('not-the-source'), false);
  assert.equal(g.attemptStrategistReversal(boss.id), true,
    family + ': deliberate entry into actual native warning accepts one response');
  assert.equal(g.attemptStrategistReversal(boss.id), false,
    'duplicate command does not requeue or multiply the reversal');
  warning.timer = 0; // Real updateEnemies calls resolveAttack at this deadline.
  g.resolveAttack(boss);
  assert.equal(g.hero.hp, hp, 'successful reversal protects hero from all source effects');
  assert.equal(soldier.hp, allyHp, 'successful reversal protects companion in that same area');
  assert(boss.hp < bossHp, 'enemy is injured by its own redirected attack');
  assert(g.effects.some((e) => e.type === 'strategistReversal'),
    'native reversal effect receipt is emitted');
  assert(!warning.strategistReversal, 'receipt consumed on release');

  // An identical unreversed native warning still harms BOTH occupants.
  const baseline = scene(family);
  baseline.warning.timer = 0;
  baseline.g.resolveAttack(baseline.boss);
  assert(baseline.g.hero.hp < hp, family + ': ordinary warning still hurts the hero');
  assert(baseline.soldier.hp < allyHp,
    family + ': ordinary warning still hurts companions');

  // Presence, timing and class selection really gate the technique.
  const outside = scene(family);
  Object.assign(outside.g.hero, { x: outside.boss.x - 120, y: outside.boss.y - 120 });
  assert.equal(outside.g.attemptStrategistReversal(outside.boss.id), false,
    'standing outside native warned footprint cannot negate it');
  const late = scene(family);
  late.warning.timer = 0;
  assert.equal(late.g.attemptStrategistReversal(late.boss.id), false,
    'late command cannot retroactively cancel damage');
  const invalidClass = scene(family);
  invalidClass.g.hero.class = 'paladin';
  assert.equal(invalidClass.g.attemptStrategistReversal(invalidClass.boss.id), false,
    'original hero classes cannot use the fifth-class technique');
  const incapacitated = scene(family);
  incapacitated.g.hero.hp = 0;
  assert.equal(incapacitated.g.attemptStrategistReversal(incapacitated.boss.id), false,
    'fallen hero cannot reverse pending warnings');

  const distinct = scene(family);
  assert.equal(distinct.g.attemptStrategistReversal(distinct.boss.id), true);
  const previous = distinct.warning;
  // The next warning is a fresh genuine attack instance, even from the same boss.
  const next = distinct.g.buildBossAttack(distinct.boss,
    family === 'mine' ? 0 : 1,
    { x: distinct.g.hero.x, y: distinct.g.hero.y }, false).first;
  distinct.g.prepareGroundAttack(distinct.boss, next);
  distinct.boss.telegraph = next;
  assert.notEqual(next, previous);
  assert(!next.strategistReversal,
    'reversal does not passively shield subsequent warnings from the same enemy');
  assert.equal(distinct.g.attemptStrategistReversal(distinct.boss.id),
    distinct.g.strategistReversalCovers(next, distinct.g.hero),
    'a second authentic warning needs its own independently timed response');
  console.log('PASS Strategist ' + family +
    ' single-warning reversal, party protection, rebound and rejection gates');
}

// Overlapping warnings remain independent. One correct counter protects the
// whole team from the first release, NOT from the second caster's release.
{
  const { g, boss, warning, soldier } = scene('mine');
  const hp = g.hero.hp, soldierHp = soldier.hp;
  const another = g.bossEnemy(g.boss('mine'), 'normal', { x: boss.x, y: boss.y });
  another.id = 'independent-stacked-warning-source';
  another.aggro = true;
  another.telegraph = g.buildBossAttack(another, 0, g.hero, false).first;
  g.prepareGroundAttack(another, another.telegraph);
  assert(g.strategistReversalCovers(another.telegraph, g.hero));
  assert(g.strategistReversalCovers(another.telegraph, soldier));
  g.zone().enemies.push(another);
  assert.equal(g.attemptStrategistReversal(boss.id), true);
  assert(!another.telegraph.strategistReversal,
    'the other caster owns a completely separate pending attack receipt');
  warning.timer = 0;
  g.resolveAttack(boss);
  assert.equal(g.hero.hp, hp);
  assert.equal(soldier.hp, soldierHp);
  // Preserve the independent warning's damage observation: current native
  // companion Skill Block can independently avoid an area skill. Force its
  // legitimate nonblocking RNG outcome; do not bypass combat or change source.
  g.rollSkillBlock = () => 0.999999;
  another.telegraph.timer = 0;
  g.resolveAttack(another);
  assert(g.hero.hp < hp, 'uncountered overlapping warning still hurts hero');
  assert(soldier.hp < soldierHp, 'uncountered overlapping warning still hurts companion');
  console.log('PASS two overlapping warning sources keep independent harm');
}

// Combat training may strengthen the reflected consequence without reducing
// the full-party protection earned by an accurate response at low rank.
{
  const damageAtRank = (rank) => {
    const { g, boss, warning, soldier } = scene('mine');
    g.hero.skills[0] = rank; // Temporary class-rank proxy; not instructor integration.
    const initial = boss.hp, hp = g.hero.hp, soldierHp = soldier.hp;
    assert(g.attemptStrategistReversal(boss.id));
    warning.timer = 0;
    g.resolveAttack(boss);
    assert.equal(g.hero.hp, hp);
    assert.equal(soldier.hp, soldierHp);
    return initial - boss.hp;
  };
  assert(damageAtRank(5) > damageAtRank(1),
    'later combat mastery increases rebound force without bleed-through damage');
  console.log('PASS training proxy scales reflected force while protection stays exact');
}

// A successful counter cannot turn an unrelated healing / summon / charge
// warning into a free enemy-damage button. Original four classes remain inert.
const other = scene('mine');
other.boss.telegraph = other.g.buildBossAttack(other.boss, 4, other.g.hero, false).first;
other.g.prepareGroundAttack(other.boss, other.boss.telegraph);
assert.equal(other.g.attemptStrategistReversal(other.boss.id), false);
assert.equal(C.classes.strategist, undefined, 'no fifth-class admission');
assert.deepEqual(C.classFoundationFor('strategist')?.startingCompanions,
  ['soldier', 'archer'], 'dormant E0 foundation exists without public class admission');
assert.throws(() => new C('normal', 'strategist'), /Unknown mode or class/);
console.log('PASS unsupported special excluded; no playable fifth class introduced');


// The first half preserves the historical dormant proof. From here on, use
// the real opt-in Developer-only Strategist class, including its legitimate
// progression/talent profile and actual Cindermaw Tonic cleanup path.
assert.equal(C.classes.strategist, undefined);
assert.equal(C.enableStrategistDeveloperTest(), true);
function cinderScene(targetAlly = false) {
  // Same genuine Crown actor/position used by the original Ministry suite.
  // No fabricated warning, collision bypass, or synthetic Distraint effects.
  const g = new C('developer', 'strategist', () => 0.99);
  g.enter('crown');
  g.s.mercyTime = 0;
  const boss = g.bossEnemy(g.boss('cindermaw'), 'normal', { x: 2200, y: 1750 });
  g.zone().enemies = [boss];
  const heroPoint = g.safe(boss.x + 70, boss.y);
  assert(!g.blocked(heroPoint.x, heroPoint.y, g.zoneId, 12));
  Object.assign(g.hero, heroPoint, {
    class: 'strategist', hp: 2000, maxHp: 2000, immune: 0,
  });
  const soldier = g.s.party.find((p) => p.type === 'soldier');
  assert(soldier);
  Object.assign(soldier, { x: boss.x + 115, y: boss.y, hp: 2000,
    maxHp: 2000, active: true, immune: 0 });
  for (const companion of g.s.party) if (companion !== soldier) companion.active = false;
  boss.aggro = true;
  boss.cd = 1e6;
  const target = targetAlly ? soldier : g.hero;
  const built = g.buildBossAttack(boss, 1, target, false);
  assert(built.first && built.first.cinderMechanic === 'distraint');
  assert.equal(built.first.targetId, targetAlly ? soldier.id : 'hero');
  assert(built.first.timer > 0);
  boss.telegraph = built.first;
  boss.sequence = built.sequence;
  return { g, boss, warning: built.first, soldier };
}

// A charge is not an excuse to exclude a warning: the actual warned straight
// lunge is countered at release BEFORE motion, contact and temporary buff strip.
{
  const { g, boss, warning } = cinderScene();
  g.hero.immune = 20;
  g.hero.tonic = true;
  g.hero.tonicBonus = 100;
  g.hero.maxHp += 100;
  g.hero.hp += 100;
  const hp = g.hero.hp, enemyHp = boss.hp;
  assert(g.strategistReversalSupported(boss, warning));
  assert(g.strategistReversalCovers(warning, g.hero));
  assert(g.attemptStrategistReversalCommand());
  assert.equal(g._strategistReversalFailure, null);
  assert.equal(g.attemptStrategistReversal(boss.id), false);
  assert.equal(g._strategistReversalFailure, 'duplicate');
  warning.timer = 0;
  g.resolveAttack(boss); // The native updateEnemies telegraph release destination.
  assert(!boss.motion, 'one reversal prevents Cindermaw motion creation');
  assert.equal(g.hero.hp, hp, 'no Distraint damage');
  assert.equal(g.hero.immune, 20, 'temporary immunity was not stripped');
  assert.equal(g.hero.tonic, true, 'Preparation Tonic was not stripped');
  assert(boss.hp < enemyHp, 'Distraint physical force rebounds onto the actual source');
  assert(g.effects.some((effect) => effect.type === 'strategistReversal'));
  console.log('PASS native Cindermaw Distraint Reversal protects live temporary defenses and HP');
}
{
  const { g, boss } = cinderScene();
  g.hero.immune = 20;
  g.hero.tonic = true;
  g.hero.tonicBonus = 100;
  g.hero.maxHp += 100;
  g.hero.hp += 100;
  const hp = g.hero.hp;
  const original = { x: boss.x, y: boss.y };
  g.resolveAttack(boss);
  assert.equal(boss.motion?.cinderMotion, 'distraint');
  boss.telegraph = null; // Native updateEnemies clears the released warning.
  g.advanceMotion(boss, 0.05);
  assert(Math.hypot(boss.x - original.x, boss.y - original.y) > 0);
  assert.equal(g.hero.immune, 0, 'unreversed contact still removes temporary immunity');
  assert.equal(g.hero.tonic, false, 'unreversed contact still removes Tonic');
  assert(g.hero.hp < hp, 'unreversed contact still harms the Ogre');
  console.log('PASS native uncountered Distraint retains movement, buff strip and damage');
}
{
  const { g, boss } = cinderScene(true);
  // Distraint is target-locked in its actual motion collision owner. The Ogre
  // cannot reverse an ally-only attack simply by standing in the drawn lane.
  assert(g.strategistReversalSupported(boss, boss.telegraph));
  assert.equal(g.attemptStrategistReversal(boss.id), false);
  assert.equal(g._strategistReversalFailure, 'outside');
}
for (const kind of ['late', 'outside', 'dead', 'blocked']) {
  const { g, boss, warning } = cinderScene();
  if (kind === 'late') warning.timer = 0;
  if (kind === 'outside') Object.assign(g.hero, g.safe(boss.x - 130, boss.y - 120));
  if (kind === 'dead') g.hero.hp = 0;
  if (kind === 'blocked') {
    // Real obstructing world prop across the straight-lunge path.
    g.zone().props.push({ x: boss.x + 35, y: boss.y, r: 18, solid: true, type: 'rock' });
  }
  assert.equal(g.attemptStrategistReversal(boss.id), false, kind);
  assert(!g.hero.cd?.some((cd) => cd > 1e5), 'no fabricated Reversal cooldown');
}
console.log('PASS Cindermaw failure gates: late/outside/dead/obstructed');

// Readable physical warning families use their NATIVE authored attack builder.
// This is an attack inventory acceptance check, not a synthetic geometry label
// pretending to prove a complete encounter. Special controls are also tested.
{
  const g = new C('developer', 'paladin', () => 0.99);
  g.enter('crown');
  g.s.mercyTime = 0;
  const groups = C.rules.attacks;
  let checked = 0, materialized = 0, nonAttacks = 0;
  for (const [family, plans] of Object.entries(groups)) {
    for (let index = 0; index < plans.length; index++) {
      const e = g.bossEnemy(g.boss(family), 'normal', { x: 2200, y: 1750 });
      g.zone().enemies = [e];
      const target = { x: 2330, y: 1750 };
      const built = g.buildBossAttack(e, index, target, false);
      const a = built?.first;
      // Only native builders that actually admit a warning can be asserted.
      // Some require real arena placements, delegates or regional conditions.
      if (!a) continue;
      materialized++;
      g.prepareGroundAttack(e, a);
      const nonAttack = a.kind === 'summon' || a.selfDefense ||
        a.kind === 'formation' || a.kind === 'checkerboard' ||
        a.anonymousCast || a.mobileRogueCast ||
        a.cinderMechanic === 'delegation';
      const eligible = g.strategistReversalSupported(e, a);
      assert.equal(eligible, !nonAttack,
        family + '/' + index + ' native warning ' + a.kind +
        ' must be classified by its actual source and release');
      if (nonAttack) nonAttacks++;
      checked++;
    }
  }
  assert(materialized >= 35, 'substantial real authored boss inventory exercised');
  assert(nonAttacks >= 8, 'actual utility/anonymous warning exclusions verified');
  console.log('PASS native boss authored-warning inventory ' + checked +
    ' admitted builders, ' + nonAttacks + ' nonattack/anonymous and ' +
    (checked - nonAttacks) + ' Reversal-capable');
}

// Native status-only strike prevents the actual debuff without inventing
// reflected damage from a warning that carries no HP damage.
{
  const { g, boss } = scene('archive');
  const a = g.buildBossAttack(boss, 4, g.hero, false).first;
  g.prepareGroundAttack(boss, a);
  boss.telegraph = a;
  Object.assign(g.hero, { x: a.x, y: a.y });
  assert.equal(g.strategistReversalSupported(boss, a), true);
  assert(g.attemptStrategistReversal(boss.id));
  const enemyHp = boss.hp;
  a.timer = 0;
  g.resolveAttack(boss);
  assert.equal(boss.hp, enemyHp);
  const counter = g.effects.filter((e) => e.type === 'strategistReversal').at(-1);
  assert.equal(counter?.damageAttempt, 0);
  console.log('PASS real status-only Archive sabotage does not invent reflected damage');
}

// A readied warning never creates permanent immunity or a saved serializable
// attack receipt, even when a subsequent warning/zone reset/death changes it.
{
  const { g, boss, warning } = scene('mine');
  assert(g.attemptStrategistReversal(boss.id));
  assert(!Object.hasOwn(warning, 'strategistReversal'),
    'one-use receipt is not attached to a serialized attack');
  assert(!JSON.stringify(g.s).includes('"strategistReversal":'),
    'receipt is not saved as a campaign field (event names may be recorded)');
  const newZone = g.zoneId;
  g.enter('archive');
  assert.notEqual(g.zoneId, newZone);
  assert.equal(g.strategistResolveReversal(boss, warning), false,
    'stale warning cannot execute after area change');
  const fresh = scene('mine');
  assert(fresh.g.attemptStrategistReversal(fresh.boss.id));
  fresh.g.hero.hp = 0;
  const enemyHp = fresh.boss.hp;
  fresh.warning.timer = 0;
  assert.equal(fresh.g.strategistResolveReversal(fresh.boss, fresh.warning), false);
  assert.equal(fresh.boss.hp, enemyHp);
  console.log('PASS one-use unsaved Reversal receipt clears across zone and hero death');
}

// Real developer-only admission can restore an unmodified snapshot, but a
// *pending Reversal* is never a durable action copied into a v4 campaign.
{
  assert.equal(typeof C.enableStrategistDeveloperTest, 'function');
  C.enableStrategistDeveloperTest();
  const g = new C('developer', 'strategist', () => 0.99);
  g.enter('mine');
  g.s.mercyTime = 0;
  const boss = g.bossEnemy(g.boss('mine'), 'normal', { x: 450, y: 450 });
  g.zone().enemies = [boss];
  const a = g.buildBossAttack(boss, 0, { x: 600, y: 450 }, false).first;
  g.prepareGroundAttack(boss, a);
  boss.telegraph = a;
  Object.assign(g.hero, { x: a.x, y: a.y, hp: 2000, maxHp: 2000 });
  assert(g.strategistReversalCovers(a, g.hero));
  assert(g.attemptStrategistReversal(boss.id));
  const snapshot = g.snapshot();
  assert(!JSON.stringify(snapshot).includes('"strategistReversal":'));
  const restored = C.restore(JSON.parse(JSON.stringify(snapshot)), () => 0.99);
  assert.equal(restored.hero.class, 'strategist');
  for (const e of restored.zone().enemies)
    assert(!e.telegraph?.strategistReversal);
  console.log('PASS original v4 Campaign developer snapshot/restore cannot replay Reversal');
}


function dreadScene(index) {
  // Source-identical resident, real selector, two warned rush legs and
  // naturally generated ring gaps from the existing Dreadmaw native tests.
  const g = new C('developer', 'strategist', () => 0.99);
  g.enter('supply-crown');
  g.s.time = 30;
  g.s.mercyTime = 0;
  g.s.party = [];
  const e = g.zone().enemies.find((u) =>
    u.roomCaptain && u.captainProfile === 'supply-crown');
  assert(e, 'actual Dreadmaw resident exists');
  g.zone().enemies = [e];
  Object.assign(g.hero, g.safe(e.x + 80, e.y),
    { hp: 2000, maxHp: 2000, immune: 0 });
  g.engage(e, true, false);
  Object.assign(e, {
    aggro: true, cd: 1e6, specialCd: 0, lastCaptainAttack: -1,
    captainOpeningSummon: true, dreadClosure: null,
  });
  let selected = false;
  for (let n = 0; n < 100; n++) {
    g.random = () => n / 100;
    e.telegraph = null;
    e.sequence = [];
    e.lastCaptainAttack = -1;
    if (g.startCaptainAttack(e, g.hero) && e.telegraph?.index === index) {
      selected = true;
      break;
    }
  }
  assert(selected, 'native Dreadmaw selector can choose slot ' + index);
  return { g, e, a: e.telegraph };
}
{
  const { g, e, a } = dreadScene(1);
  assert.equal(a.dreadMechanic, 'rush');
  assert(a.charge && a.kind === 'line');
  assert.equal(e.sequence.length, 1, 'first and second rush legs own separate warnings');
  const mark = { x: (a.fromX + a.x) / 2, y: (a.fromY + a.y) / 2 };
  assert(!g.blocked(mark.x, mark.y, g.zoneId, 12));
  Object.assign(g.hero, mark);
  assert(g.strategistReversalSupported(e, a));
  assert(g.strategistReversalCovers(a, g.hero));
  assert(g.attemptStrategistReversal(e.id));
  a.timer = 0;
  g.resolveAttack(e);
  assert(!e.motion, 'actual Dreadmaw physical rush cannot start after Reversal');
  assert.equal(e.sequence.length, 1,
    'one counter never deletes a separately warned follow-up leg');
  assert.equal(g.advanceQueuedAttack(e).dreadLeg, 2);
  console.log('PASS Dreadmaw native Transhumance rush first release and independent second warning');
}
{
  const { g, e, a } = dreadScene(4);
  assert.equal(a.dreadMechanic, 'closure');
  assert.equal(a.gaps?.length, 2);
  const gap = a.gaps[0];
  const safeGap = {
    x: a.x + Math.cos(gap) * a.initialRadius,
    y: a.y + Math.sin(gap) * a.initialRadius,
  };
  assert.equal(g.strategistReversalCovers(a, safeGap), false,
    'real escape gap is not a threatened Reversal spot');
  let mark = null;
  for (let i = 0; i < 72; i++) {
    const angle = i * Math.PI / 36;
    const point = {
      x: a.x + Math.cos(angle) * a.initialRadius,
      y: a.y + Math.sin(angle) * a.initialRadius,
    };
    if (!g.blocked(point.x, point.y, g.zoneId, 12) &&
        g.strategistReversalCovers(a, point)) {
      mark = point;
      break;
    }
  }
  assert(mark, 'the real closure plan has a physically reachable warned arc');
  Object.assign(g.hero, mark);
  assert(g.attemptStrategistReversal(e.id));
  a.timer = 0;
  g.resolveAttack(e);
  assert(!e.dreadClosure,
    'Reversal prevents creation of the moving, damaging Dreadmaw closure');
  console.log('PASS Dreadmaw native two-gap closure and zero orphan persistent ring');
}


{
  // First-region playable acceptance: this is an original Greenwood boss
  // cone, not a Mine-only late-game demonstration or artificial attack.
  const g = new C('developer', 'strategist', () => 0.99);
  if (g.zoneId !== 'vale') g.enter('vale');
  g.s.mercyTime = 0;
  let selected = null;
  for (let x = 280; x < 1200 && !selected; x += 110)
    for (let y = 260; y < 1100 && !selected; y += 110) {
      const origin = { x, y };
      const mark = { x: x + 90, y };
      if ([origin, mark].some((p) => g.blocked(p.x, p.y, 'vale', 15)) ||
          !g.line(origin, mark)) continue;
      const e = g.bossEnemy(g.boss('thorn'), 'normal', origin);
      const a = g.buildBossAttack(e, 0, mark, false).first;
      g.prepareGroundAttack(e, a);
      if (!g.strategistReversalCovers(a, mark)) continue;
      selected = { e, a, mark };
    }
  assert(selected, 'open authentic Greenwood warning placement exists');
  const { e, a, mark } = selected;
  g.zone().enemies = [e];
  Object.assign(g.hero, mark, { hp: 2000, maxHp: 2000 });
  e.telegraph = a;
  e.aggro = true;
  assert(a.timer > 0 && g.strategistReversalSupported(e, a));
  const before = { hp: g.hero.hp, enemyHp: e.hp };
  assert(g.attemptStrategistReversalCommand());
  a.timer = 0;
  g.resolveAttack(e);
  assert.equal(g.hero.hp, before.hp);
  assert(e.hp < before.enemyHp);
  console.log('PASS first-region Greenwood Thornfang original warned cone Reversal');
}
