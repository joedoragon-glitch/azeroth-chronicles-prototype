'use strict';
// Stage 2 — real Campaign Ranger cast-time support and Soldier Guard activation.
// Does not enable these dormant critical modules in the published game.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Party = require('../src/prototype/party.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');

function arena() {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  for (const key of ['props', 'npcs', 'buildings', 'enemies']) g.zone()[key] = [];
  Object.assign(g.hero, {
    x: 500, y: 500, maxHp: 1000, hp: 300, maxMp: 900, mp: 300,
  });
  g.s.mercyTime = 0;
  const archer = g.unit('archer', 520, 500);
  const soldier = g.unit('soldier', 510, 500);
  soldier.hp = soldier.maxHp * 0.5;
  g.s.party = [archer, soldier];
  return { g, archer, soldier };
}
function attach(g, { roll = 0, level = 1 } = {}) {
  let samples = 0;
  const tuning = Levels.createTuning();
  tuning.setLevel('companion', level);
  const session = Native.createSession(Critical, Levels, {
    enabled: true, tuning, stream: { next() { samples++; return roll; } },
  });
  g._criticalPartyNative = session;
  return { count: () => samples, session };
}
function near(a, b, message) {
  assert(Math.abs(a - b) < 1e-6, message + ': ' + a + ' != ' + b);
}
assert.equal(Levels.ACTIONS['troop/archer/heal'].lever, 'healAmount');
assert.equal(Levels.ACTIONS['troop/archer/mana'].lever, 'healAmount');
assert.equal(Levels.ACTIONS['troop/soldier/guard'].lever, 'guardDuration');
assert.deepEqual(Levels.LEVERS.guardDuration.values, [0.15, 0.30, 0.50]);

for (const level of [1, 2, 3]) {
  const a = arena(), b = arena();
  const counter = attach(b.g, {level});
  assert(a.g.rangerSupport('health', true, a.g.hero));
  assert(b.g.rangerSupport('health', true, b.g.hero));
  assert.equal(counter.count(), 1, 'Heal releases once at Level ' + level);
  const initial = a.g.hero.supportEffects[0], enhanced = b.g.hero.supportEffects[0];
  near(enhanced.remaining, initial.remaining * Levels.LEVERS.healAmount.values[level - 1],
    'native Heal bonus at Level ' + level);
  assert.equal(initial.seconds, 5);
  assert.equal(enhanced.seconds, 5, 'Heal duration unchanged');
  assert.equal(a.archer.healCd, b.archer.healCd, 'Heal recovery clock unchanged');
  assert.equal(a.archer.manaCd, b.archer.manaCd, 'other support clock unaffected');
  assert(!('criticalExecution' in enhanced), 'saveable HoT state contains no receipt');
  assert.equal(b.g.hero.hp, a.g.hero.hp, 'no extra initial healing');
  b.g.updateRangerSupport(2.5);
  a.g.updateRangerSupport(2.5);
  assert.equal(counter.count(), 1, 'HoT ticks do not consume another critical');
  assert(b.g.hero.hp > a.g.hero.hp, 'critical improves real HP recovery');
  assert.equal(b.g.snapshot().hero.supportEffects?.[0]?.type, 'health',
    'native save retains ordinary support effect shape');
}
// The critical outcome is probabilistic, not an unconditional support upgrade.
{
  const a = arena(), b = arena();
  const counter = attach(b.g, {roll: 0.99});
  assert(a.g.rangerSupport('health'));
  assert(b.g.rangerSupport('health'));
  assert.equal(counter.count(), 1);
  assert.equal(a.g.hero.supportEffects[0].remaining,
    b.g.hero.supportEffects[0].remaining, 'non-critical Heal is unchanged');
}
{
  const {g, archer} = arena(), counter = attach(g);
  g.hero.hp = g.hero.maxHp;
  g.s.party.find(u => u.type === 'soldier').hp = g.s.party.find(u => u.type === 'soldier').maxHp;
  assert.equal(g.rangerSupport('health', false), false, 'full health cancels support');
  assert.equal(counter.count(), 0);
  assert.equal(archer.healCd, 0);
  g.hero.hp = g.hero.maxHp - 200;
  archer.healCd = 2;
  assert(g.requestRangerHeal(), 'queued health support is not a cast');
  assert.equal(counter.count(), 0);
  archer.healCd = 0;
  assert(g.resolveQueuedRangerHeal(), 'queued request becomes a real release');
  assert.equal(counter.count(), 1);
  assert(g.hasSupportEffect(g.hero, 'health'));
  assert.equal(g.resolveQueuedRangerHeal(), false, 'queued request cannot double-cast');
  assert.equal(counter.count(), 1);
}
{
  const {g, archer} = arena(), counter = attach(g);
  archer.healCd = 0;
  g.hero.hp = 200;
  g.hero.supportEffects = [{type: 'health', remaining: 50, seconds: 5}];
  // Heal may legitimately select another wounded companion. To check the
  // duplicate/no-roll boundary, every other party recipient must be full.
  g.s.party.find(u => u.type === 'soldier').hp =
    g.s.party.find(u => u.type === 'soldier').maxHp;
  assert.equal(g.rangerSupport('health', false), false, 'all eligible recipients already covered');
  assert.equal(counter.count(), 0);
  g.hero.supportEffects = [];
  g.hero.hp = g.hero.maxHp;
  g.s.party[1].hp = g.s.party[1].maxHp;
  assert.equal(g.rangerSupport('health', false), false);
  assert.equal(counter.count(), 0);
  assert.equal(g.rangerSupport('mana', false), false,
    'the published manaEnabled=false contract prevents all MP support');
  assert.equal(counter.count(), 0, 'dormant mana never rolls or changes cooldown');
  assert.equal(archer.manaCd, 0);
}
// Exercise the REAL installed Party implementation under an isolated
// mana-enabled rules fixture without changing the production resource mode.
{
  class ManaEnabledCampaign extends Campaign {}
  Party.install(ManaEnabledCampaign, {
    D: Campaign.data,
    R: {...Campaign.rules, resourceMode: {...Campaign.rules.resourceMode, manaEnabled: true}},
  });
  const g = new ManaEnabledCampaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(g);
  const archer = g.unit('archer', 500, 500);
  g.s.party = [archer];
  g.hero.maxMp = 900; g.hero.mp = 200;
  const counter = attach(g, {level: 2});
  const expected = g.rangerSupportAmount('mana');
  assert(g.rangerSupport('mana', false));
  assert.equal(counter.count(), 1, 'enabled MP branch releases exactly once');
  near(g.hero.supportEffects[0].remaining,
    expected * Levels.LEVERS.healAmount.values[1], 'real native MP cast value');
  assert.equal(g.hero.supportEffects[0].seconds, 5, 'unchanged mana HoT lifetime');
  assert.equal(archer.manaCd, Campaign.rules.rangerSupport.cooldown);
  assert.equal(archer.healCd, 0, 'Mana does not charge Heal clock');
  g.updateRangerSupport(1);
  assert.equal(counter.count(), 1, 'mana tick never rerolls');
  assert(g.hero.mp > 200, 'enabled mana restores MP');
}
for (const level of [1, 2, 3]) {
  const a = arena(), b = arena();
  const enemy = b.g.makeEnemy(
    {species:'goblin', name:'Guard trigger', level:1, hp:10000, damage:0, xp:0, gold:0},
    {x: 590, y: 500},
  );
  const other = a.g.makeEnemy(
    {species:'goblin', name:'Guard trigger', level:1, hp:10000, damage:0, xp:0, gold:0},
    {x: 590, y: 500},
  );
  a.g.zone().enemies = [other]; b.g.zone().enemies = [enemy];
  // Isolate the reactive guard owner, not simultaneous Soldier/Archer attacks.
  a.g.s.party = [a.soldier];
  b.g.s.party = [b.soldier];
  for (const unit of [a.soldier, b.soldier]) {
    unit.cd = 999;
    unit.skillGlobalCd = 999;
    unit.skill1Cd = 999;
    unit.skill2Cd = 999;
  }
  a.g.engage(other); b.g.engage(enemy);
  const counter = attach(b.g, {level});
  a.g.updateParty(0.1);
  b.g.updateParty(0.1);
  assert.equal(counter.count(), 1, 'Guard activation rolls once at Level ' + level);
  const bonus = Levels.LEVERS.guardDuration.values[level - 1];
  near(b.soldier.immune, Math.min(3, a.soldier.immune + bonus),
    'native Guard capped protection, level ' + level);
  assert.equal(b.soldier.survivalCd, a.soldier.survivalCd,
    'critical never reduces original fourteen-second survival cooldown');
  b.g.updateParty(0.1);
  assert.equal(counter.count(), 1, 'Guard does not reroll while cooldown active');
  assert.equal(b.g.effects.filter(e => e.kind === 'soldierGuard').length, 1);
}
{
  const {g, soldier} = arena(), counter = attach(g);
  g.s.party = [soldier];
  soldier.cd = 999;
  soldier.skillGlobalCd = 999;
  soldier.skill1Cd = 999;
  soldier.skill2Cd = 999;
  g.updateParty(0.1);
  assert.equal(counter.count(), 0, 'out of combat Guard never fires');
  assert.equal(soldier.survivalCd, 0);
  soldier.hp = soldier.maxHp;
  const enemy = g.makeEnemy(
    {species:'goblin', name:'Guard gating', level:1, hp:10000, damage:0, xp:0, gold:0},
    {x: 590, y: 500},
  );
  g.zone().enemies = [enemy]; g.engage(enemy);
  g.updateParty(0.1);
  assert.equal(counter.count(), 0, 'healthy Soldier guard does not fire');
  soldier.hp = soldier.maxHp * 0.5;
  soldier.survivalCd = 5;
  g.updateParty(0.1);
  assert.equal(counter.count(), 0, 'cooldown prevents Guard activation');
  soldier.survivalCd = 0;
  soldier.hp = 0;
  g.updateParty(0.1);
  assert.equal(counter.count(), 0, 'dead Soldier guard never fires');
}
assert.equal(Campaign.prototype._criticalPartyNative, undefined);
console.log('PASS native Ranger Heal and isolated Mana (cast-time/ticks/queue/dormancy), 3-level Soldier Guard independent protection and gates');
