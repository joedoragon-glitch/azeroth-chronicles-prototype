'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
function near(g, e) {
  for (const r of [80, 140, 200])
    for (let j = 0; j < 24; j++) {
      const a = (j * Math.PI) / 12,
        p = { x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r };
      if (!g.blocked(p.x, p.y, g.zoneId, 15) && g.line(p, e)) {
        Object.assign(g.hero, p);
        return;
      }
    }
  throw Error('No clear attack origin');
}
function defeat(g, e) {
  near(g, e);
  e.hp = 1;
  g.s.mercyTime = 0;
  assert(g.damage(e, 10000, 'hero', { piercing: true }));
  assert.equal(e.hp, 0);
  assert(e.deathPaid);
  g.syncTreasuryRecovery(g.zone());
}
for (const mode of ['normal', 'nightmare'])
  for (const site of C.rules.treasuryRecovery.sites) {
    let g = new C(mode, 'mage', () => 0.73);
    g.enter(site.region);
    g.hero.gold = 100;
    g.die();
    assert.equal(g.treasuryLostCrowns(site.region), 20);
    assert.equal(g.hero.gold, 80);
    g.hero.gold = 200;
    g.die();
    assert.equal(g.treasuryLostCrowns(site.region), 60);
    assert.equal(g.hero.gold, 160);
    g = C.restore(g.snapshot(), () => 0.73);
    assert.equal(g.treasuryLostCrowns(site.region), 60);
    g.enter(site.zone);
    const z = g.zone(),
      captain = g.treasuryCaptain(z, site),
      cache = z.npcs.find((n) => n.treasuryRecovery);
    if (site.region === 'frontier') {
      assert(!cache, 'the roaming captain drops the first cache only when defeated');
      Object.assign(captain, g.safe(captain.home.x + 200, captain.home.y + 130));
    } else {
      assert(cache, site.zone + ' recovery cache exists');
      assert(
        !z.npcs.some((n) => n !== cache && Math.hypot(n.x - cache.x, n.y - cache.y) < 60),
        'recovery cache has its own interaction space',
      );
      Object.assign(g.hero, cache);
      assert.equal(g.interact(cache), false);
      assert.match(g.messages.at(-1), /Defeat/);
    }
    const deathPoint = { x: captain.x, y: captain.y };
    const originalSupplies = JSON.stringify(g.s.discovered);
    assert.equal(g.treasuryLostCrowns(site.region), 60);
    defeat(g, captain);
    if (site.region === 'frontier') {
      const drop = z.npcs.find((n) => n.treasuryRecovery);
      assert(drop);
      assert(
        Math.hypot(drop.x - deathPoint.x, drop.y - deathPoint.y) <= 140,
        'cache stays at the kill, rather than at the fixed post',
      );
      assert.deepEqual({ x: drop.x, y: drop.y }, g.treasuryRecoveryState('frontier').cachePoint);
    }
    assert(g.notices.some((n) => n.text === captain.name + ' defeated · 60 crowns recoverable'));
    assert.equal(g.treasuryLostCrowns(site.region), 60, 'victory alone never resets balance');
    // Leaving and reloading after victory must preserve collection permission and money.
    g = C.restore(g.snapshot(), () => 0.73);
    g.enter(site.region);
    g.enter(site.zone);
    const cache2 = g.zone().npcs.find((n) => n.treasuryRecovery);
    if (site.region === 'frontier')
      assert.deepEqual(
        { x: cache2.x, y: cache2.y },
        g.treasuryRecoveryState('frontier').cachePoint,
        'dropped position survives reload and reentry',
      );
    Object.assign(g.hero, cache2);
    const purse = g.hero.gold;
    assert(g.interact(cache2));
    assert.equal(g.hero.gold, purse + 60);
    assert.equal(g.treasuryLostCrowns(site.region), 0);
    assert(!g.visibleNPCs().some((n) => n.treasuryRecovery));
    assert.equal(
      JSON.stringify(g.s.discovered),
      originalSupplies,
      'recovery is independent of quest cache collection',
    );
    const paid = g.hero.gold;
    assert.equal(g.interact(cache2), false);
    assert.equal(g.hero.gold, paid, 'cannot collect twice');
    g = C.restore(g.snapshot(), () => 0.73);
    assert.equal(g.treasuryLostCrowns(site.region), 0, 'reload never recreates collected money');
    const state = g.treasuryRecoveryState(site.region);
    assert(state.respawnAt > 0);
    // The new garrison does not appear on top of the recovering player.
    const cap = g.treasuryCaptain(g.zone(), site);
    Object.assign(g.hero, cap.home);
    g.s.time = state.respawnAt + 1;
    g.syncTreasuryRecovery(g.zone());
    assert.equal(g.treasuryCaptain(g.zone(), site).hp, 0);
    for (const e of g.zone().enemies) e.aggro = false;
    Object.assign(g.hero, g.safe(100, 100));
    g.s.time += 1;
    g.syncTreasuryRecovery(g.zone());
    const returned = g.treasuryCaptain(g.zone(), site);
    assert(returned.hp > 0, 'captain returns for another recovery cycle');
    assert.equal(returned.id, cap.id);
    assert.equal(returned.gold, 0);
    assert.equal(returned.xp, 0);
    assert.equal(state.unlocked, false);
    assert(
      !g.blocked(returned.x, returned.y, g.zoneId, g.actorRadius(returned)),
      'return position fits actual body',
    );
    g.enter(site.region);
    g.hero.gold = 100;
    g.die();
    g.enter(site.zone);
    assert.equal(g.treasuryLostCrowns(site.region), 20);
    const again = g.zone().npcs.find((n) => n.treasuryRecovery);
    Object.assign(g.hero, again);
    assert.equal(g.interact(again), false, 'new living captain guards next losses');
    console.log('PASS', mode, site.region, 'death → captain → collect → save → respawn → new loss');
  }
{
  const g = new C('normal', 'mage', () => 0.73);
  g.enter('archive');
  g.hero.gold = 101;
  g.die();
  assert.equal(g.treasuryLostCrowns('march'), 21);
  assert.equal(
    g.treasuryLostCrowns('vale'),
    0,
    'interior deaths credit the parent region, not refuge',
  );
  g.enter('mine');
  g.hero.gold = 101;
  g.die();
  assert.equal(g.treasuryLostCrowns('highlands'), 21);
  assert.equal(g.treasuryLostCrowns('march'), 21, 'banks remain separate');
  g.enter('vale');
  g.hero.gold = 0.5;
  assert.equal(g.applyDeathPenalty(), 0.5);
  assert.equal(g.treasuryLostCrowns('vale'), 0.5, 'never deposit more than actually removed');
  g.hero.gold = 0;
  g.die();
  assert.equal(g.treasuryLostCrowns('vale'), 0.5);
}
{
  const g = new C('normal', 'mage', () => 0.73, { succession: true });
  g.hero.gold = 100;
  g.die();
  assert.equal(g.hero.gold, 100);
  assert.equal(g.treasuryLostCrowns('vale'), 0, 'Succession preserves its no-crown-loss rule');
}
{
  const g = new C('normal', 'mage', () => 0.73),
    legacy = g.snapshot();
  delete legacy.treasuryRecovery;
  const restored = C.restore(legacy, () => 0.73);
  assert.equal(
    restored.treasuryLostCrowns(),
    0,
    'older losses are not guessed from incomplete unregionalized events',
  );
  for (const value of [
    null,
    [],
    { unknown: { crowns: 5, unlocked: false, respawnAt: 0 } },
    { vale: { crowns: -1, unlocked: false, respawnAt: 0 } },
    { vale: { crowns: '50', unlocked: false, respawnAt: 0 } },
    { vale: { crowns: 0, unlocked: 1, respawnAt: 0 } },
    { vale: { crowns: 0, unlocked: false, respawnAt: -1 } },
  ]) {
    const bad = g.snapshot();
    bad.treasuryRecovery = value;
    assert.throws(() => C.restore(bad), /Treasury|save number/);
  }
}
{
  const g = new C('normal', 'mage', () => 0.73);
  g.hero.gold = 100;
  g.die();
  g.enter('supply-vale');
  const site = g.treasuryRecoverySite(),
    captain = g.treasuryCaptain(g.zone(), site);
  defeat(g, captain);
  const state = g.treasuryRecoveryState();
  // A real missing-garrison return restores defeated native guards as well.
  const guard = g.zone().enemies.find((e) => e.roomGuard && !e.roomCaptain && !e.reinforcement);
  guard.hp = 0;
  guard.deathPaid = true;
  for (const e of g.zone().enemies) e.aggro = false;
  g.s.time = state.respawnAt + 1;
  Object.assign(g.hero, g.safe(100, 100));
  g.syncTreasuryRecovery(g.zone());
  const revived = g.zone().enemies.find((e) => e.id === guard.id);
  assert(revived.hp > 0);
  assert.equal(revived.gold, 0);
  assert.equal(revived.xp, 0);
  // Collection never pays another region or changes supply quest rewards.
  assert.equal(
    g.collectTreasuryRecovery({
      id: 'seized-crowns-crown',
      treasuryRecovery: true,
      region: 'crown',
    }),
    false,
  );
  assert.equal(state.crowns, 20);
}
console.log(
  'PASS regional accounting, repeat-proof payout, captain/garrison lifecycle, eligibility feedback, old/malformed saves and Succession',
);
