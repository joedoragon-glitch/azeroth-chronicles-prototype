'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');
const fresh = () => new C('normal', 'paladin', () => 0.9);

function harness(g) {
  const calls = [];
  let last = null;
  const m = Menus.create({
    getGame: () => g,
    getLanguage: () => 'en',
    onSpecialistIntroduction: () => calls.push('save'),
    Campaign: C, D: C.data,
    action: (label, fn, description = '', disabled = false) =>
      ({ label, fn, description, disabled }),
    openMenu: (name, description, actions) => { last = { name, description, actions }; },
    closeMenu: () => {},
    showMap: () => {},
    finaleMenu: () => {},
  });
  return { m, calls, last: () => last };
}

{
  const g = fresh();
  const { m, last } = harness(g);
  for (const region of C.data.regions) {
    g.enter(region.id);
    m.quests(true, () => {}, false, true);
    const entries = last().actions.filter(a => typeof a?.label === 'string' &&
      a.label.endsWith(' · ACTIVE') && a.label !== 'Completed quests · ACTIVE');
    const regional = C.data.quests.filter(q => q[0] === region.id &&
      q[1] !== 'Ready for the Dark Lord' &&
      !['Defeat Thornfang; free Mira','Defeat Lifebinder; free Borin',
         'Defeat Mirejaw; free Sela','Defeat Drowned Keeper; free Neri',
         'Defeat Ridge Tyrant; free Orin','Defeat Stone Colossus; free Dara',
         'Defeat Ashen Warlord; free Lyss','Defeat Abyss Dragon; free Eren',
         'Defeat Ash Sentinel; free Tovan','Defeat Cindermaw; free Vera'].includes(q[2]));
    for (const q of regional) {
      const item = entries.find(a => a.label.startsWith(q[1] + ' · '));
      assert(item, 'side quest remains visible: ' + q[1]);
      assert(item.description.includes('\n'), 'lore appears before objective: ' + q[1]);
      assert(item.description.includes('crowns /'), 'original reward remains visible: ' + q[1]);
    }
  }
  for (const place of ['crypt','archive','mine','abyss','citadel',
                        'supply-vale','supply-march','supply-highlands','supply-crown',
                        'side-vale-cellars','side-march-watchhouse','side-highlands-signal',
                        'side-frontier-shrine','side-crown-foundry']) {
    const text = m.siteBriefing(place);
    assert(typeof text === 'string' && text.length > 25, place + ' has lore');
    assert(!/Leaving resets|Clear the guards before collecting/i.test(text));
  }
}

{
  const g = fresh();
  g.s.keys.thorn = true;
  assert(g.rescue('thorn'));
  g.enter('vale');
  const npc = g.zone().npcs.find(n => n.id === 'service-thorn');
  assert(npc, 'first rescued instructor is a real town NPC');
  const h = harness(g);
  h.m.teacher({ family: 'thorn', name: 'Mira', kind: 'teacher' });
  assert.equal(h.calls.length, 0, 'remote/barracks proxy does not use first conversation');
  h.m.teacher(npc);
  assert.match(h.last().description, /feet would give out/);
  assert.equal(h.calls.length, 1, 'real first conversation saved once');
  h.m.teacher(npc);
  assert.equal(h.last().description, 'Choose your training.');
  assert.equal(h.calls.length, 1);
  const restored = C.restore(g.snapshot());
  assert(restored.s.discovered['specialist:introduction:thorn'], 'introduction survives v4 round-trip');
}

{
  const g = fresh();
  const boss = g.boss('thorn');
  g.enter('vale');
  let e = g.zone().enemies.find(x => x.family === 'thorn' && x.type === 'boss' && x.hp > 0);
  // First-time Vale onboarding deliberately delays Thornfang until level 2.
  // Test the actual return contract without bypassing that start-game gate.
  if (!e) {
    e = g.bossEnemy(boss, 'normal', g.fieldCenter(0));
    g.zone().enemies.push(e);
  }
  assert(e);
  const baseline = g.bossEnemy(boss, 'normal', e.home);
  g.s.fieldBossKills.thorn = 1;
  e.hp = 0;
  e.respawn = 0.01;
  g.tick(0.1);
  assert.equal(e.form, 'normal');
  assert.equal(e.rematchTier, 1);
  assert.equal(e.level, baseline.level + 1);
  assert.equal(e.baseHp, baseline.baseHp);
  assert.equal(e.baseDamage, baseline.baseDamage);
  g.s.party = [];
  g.line = () => true;
  assert(g.startAttack(e, { x: e.x + 65, y: e.y }, 0));
  assert.equal(e.telegraph.timer, 0.72, 'first rematch shrinks the 0.8s arc warning by ten percent');
  assert.equal(g.bossEnemy(boss, 'true', e.home).rematchTier, undefined,
    'TRUE form has no rematch tier');
}

{
  const g = fresh();
  g.enter('supply-vale');
  const zone = g.zone();
  const captain = zone.enemies.find(e => e.roomCaptain);
  assert(captain, 'named captain exists');
  const originalLevel = captain.level;
  const recovery = g.treasuryRecoveryState('vale');
  assert.equal(recovery.captainVictories, 0);
  captain.hp = 0;
  g.treasuryCaptainDefeated(captain);
  assert.equal(recovery.captainVictories, 1);
  // The native 120-second return is not skipped; move outside the
  // authored 700-unit safety clearance before checking the timer.
  Object.assign(g.hero, { x: 0, y: 0 });
  g.s.time = recovery.respawnAt + 1;
  g.syncTreasuryRecovery(zone);
  const first = zone.enemies.find(e => e.roomCaptain);
  assert(first && first.hp > 0, 'named captain returned');
  assert.equal(first.level, originalLevel + 1);
  assert.equal(first.rematchTier, 1);
  assert(first.gold > 0 && first.xp > 0, 'repeated captain can pay crowns and XP');
  const expected = g.enemyReward(first);
  assert(expected.gold > 0 && expected.xp > 0);
  const restored = C.restore(g.snapshot());
  const after = restored.s.zones['supply-vale'].enemies.find(e => e.roomCaptain);
  assert.equal(after.level, originalLevel + 1, 'save preserves captain level');
  restored.enter('supply-vale');
  assert.equal(restored.zone().enemies.find(e => e.roomCaptain).level, originalLevel + 1,
    'population reconciliation does not stack rematch levels');
}

{
  for (const b of C.data.bosses.filter(x => x.captive)) {
    const g = fresh();
    g.s.keys[b.id] = true;
    assert(g.rescue(b.id), b.id + ' can be freed');
    g.enter(b.region);
    const npc = g.zone().npcs.find(n => n.id === 'service-' + b.id);
    assert(npc, b.id + ' has real town service');
    const h = harness(g);
    const interact = npc.kind === 'teacher' ? h.m.teacher :
      npc.kind === 'smith' ? h.m.smith : h.m.supplier;
    interact({ family: b.id, kind: npc.kind, name: b.captive });
    assert.equal(h.calls.length, 0, b.id + ' remote service cannot consume intro');
    interact(npc);
    assert(h.last().description.length > 55, b.id + ' has a substantial personal account');
    assert.equal(h.calls.length, 1, b.id + ' first visit saves one mark');
    interact(npc);
    assert.equal(h.calls.length, 1, b.id + ' repeat visits do not repeat introduction');
    assert(C.restore(g.snapshot()).s.discovered['specialist:introduction:' + b.id],
      b.id + ' one-time mark survives the save contract');
  }
}

console.log('PASS lore-led quests, first conversations, entrance economy, boss and captain rematches');
