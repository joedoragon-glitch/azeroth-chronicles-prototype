'use strict';
// v0.9.2: original quest IDs, earned class onboarding, Board/Codex,
 // finite-tribute lesson and the safety fence for passive leader encounters.
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
C.enableRoguePlaytest();

function fresh(cls = 'paladin') {
  const g = new C('normal', cls, () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  g.zone().props = [];
  return g;
}
function firstBase(g) {
  g.s.recallActive = false;
  g.distanceToRoad = () => 400;
  g.blocked = () => false;
  assert(g.build(), 'native first Barracks placement');
  const building = g.zone().buildings.find((b) => b.kind === 'barracks');
  const worker = g.s.party.find((u) => u.order?.type === 'build');
  assert(building && worker);
  Object.assign(worker, { x: building.x, y: building.y });
  g.zone().enemies = [];
  g.updateParty(4.1);
  assert.equal(building.progress, 4);
  assert(g.s.quests['quest-barracks'].paid, 'original quest completed');
  return building;
}
for (const cls of ['paladin', 'mage', 'ranger', 'rogue']) {
  const g = fresh(cls);
  assert.equal(g.questDefs().length, 31, 'thirty original regional quests and tutorial intact');
  assert.equal(g.tutorialStage(), 'captain');
  assert(!g.s.quests['quest-tutorial-board'].active);
  g.briefCompanions();
  if (cls === 'rogue') {
    assert.equal(g.tutorialStage(), 'charm');
    assert.equal(g.s.party.length, 0);
    const foe = g.makeEnemy(
      { species: 'goblin', name: 'Lawful Charm encounter', level: 1,
        hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: g.hero.x + 55, y: g.hero.y },
    );
    foe.aggro = true;
    g.zone().enemies = [foe];
    g.s.rogueCharmRng = 12345;
    assert(g.cast(1, foe.id, false, null, true), 'real Rogue automatic basic');
    assert.equal(g.s.party.length, 1, 'genuine Charm acquisition');
    assert(g.isCharmedCompanion(g.s.party[0]), 'ledger-validated captured worker');
  }
  assert.equal(g.tutorialStage(), 'recall');
  assert(g.recallParty());
  assert(g.s.quests['quest-barracks'].recallPracticed);
  assert.equal(g.tutorialStage(), 'brief-barracks');
  g.briefBarracks();
  assert.equal(g.tutorialStage(), 'barracks');
  firstBase(g);
  assert.equal(g.tutorialStage(), 'complete');
  assert(g.s.quests['quest-tutorial-board'].active, 'Board chapter activates after first Barracks');
  assert(!g.s.quests['quest-tutorial-gather'].active, 'gathering is contextual, not forced');
  assert.equal(g.questDestination('quest-tutorial-board')?.kind, 'quests');
  const ledger = g.snapshot();
  const restored = C.restore(ledger, () => 0.9);
  assert(restored.s.quests['quest-barracks'].paid);
  assert(restored.s.quests['quest-tutorial-board'].active);
  assert.equal(restored.s.version, 4, 'no v4 schema replacement');
}
{
  const g = fresh();
  firstBase(g);
  const board = g.s.quests['quest-tutorial-board'];
  assert(g.recordBoardTutorialStep('boardOpened'));
  assert(g.recordBoardTutorialStep('storyViewed'));
  assert(g.recordBoardTutorialStep('sideViewed'));
  assert(g.recordBoardTutorialStep('mapOpened'));
  assert(g.recordBoardTutorialStep('navigationUsed'));
  assert(!board.paid, 'the optional cellar book has not been studied');
  assert.equal(g.questDestination('quest-tutorial-board')?.family, 'side-vale-cellars');
  const midway = C.restore(g.snapshot(), () => 0.9);
  assert(midway.s.quests['quest-tutorial-board'].navigationUsed, 'map event survives restore');
  g.enter('side-vale-cellars');
  const codex = g.zone().npcs.find((n) => n.kind === 'critical-codex');
  assert(codex, 'actual Old Orchard Cellars book');
  Object.assign(g.hero, { x: codex.x, y: codex.y });
  assert(g.interact(codex), 'actual native Codex study');
  assert(g.s.criticalCodices['side-vale-cellars']);
  assert(board.paid, 'board quest completes on earned book');
  assert(!g.recordBoardTutorialStep('boardOpened'), 'completed tutorials never replay');
  assert(C.restore(g.snapshot()).s.quests['quest-tutorial-board'].paid);
}
{
  const g = fresh();
  firstBase(g);
  g.s.expeditionRank = 2;
  assert(g.startGatheringTutorial(), 'first eligible Barracks use starts lesson');
  assert(!g.startGatheringTutorial(), 'reopening is not another tutorial');
  const p = g.s.quests['quest-tutorial-gather'];
  assert(p.active && !p.done);
  const source = g.visibleResourceNodes()[0];
  g.s.recallActive = false;
  assert(g.gather(source.id), 'authentic local dispatch');
  assert(p.gatherStarted && !p.gatherDeposited);
  const workers = g.s.party.filter((u) => u.order?.type === 'gather');
  assert(workers.length > 0);
  for (const worker of workers) Object.assign(worker, { x: source.x, y: source.y });
  for (let i = 0; i < 100 && !workers.some((u) => u.carry > 0); i++) g.updateParty(0.1);
  assert(workers.some((u) => u.carry > 0), 'workers collect finite tribute in the real party update');
  const mid = C.restore(g.snapshot());
  assert(mid.s.quests['quest-tutorial-gather'].gatherStarted, 'earned stage persists');
  const supplier = g.zone().npcs.find((n) => n.kind === 'supplier');
  Object.assign(g.hero, { x: supplier.x, y: supplier.y });
  const crowns = g.hero.gold;
  assert(g.unloadCompanyTribute(supplier) > 0, 'Town Supplies unloads actual cargo');
  assert(g.hero.gold > crowns);
  assert(p.paid && p.done, 'actual payment closes gather quest');
  assert(C.restore(g.snapshot()).s.quests['quest-tutorial-gather'].paid);
}
{
  const g = fresh();
  const old = g.snapshot();
  delete old.quests['quest-tutorial-board'];
  delete old.quests['quest-tutorial-gather'];
  assert.doesNotThrow(() => C.restore(old), 'pre-v0.9.2 v4 remains loadable');
  const loaded = C.restore(old);
  loaded.checkQuests();
  assert(loaded.s.quests['quest-tutorial-board']);
  assert(loaded.s.quests['quest-tutorial-gather']);
  const bad = loaded.snapshot();
  bad.quests['quest-tutorial-board'].boardOpened = 'not-a-boolean';
  assert.throws(() => C.validate(bad), /Invalid quest/);
}
for (const cls of ['paladin', 'mage', 'ranger', 'rogue']) {
  for (const kind of ['boss', 'captain']) {
    const g = fresh(cls);
    g.s.thornHeroInitiated = true;
    g.zone().enemies = [];
    Object.assign(g.hero, { x: 500, y: 500 });
    const foe = g.makeEnemy(
      { species: 'goblin', name: 'Leader', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
      { x: 550, y: 500 },
    );
    if (kind === 'boss') {
      foe.type = 'boss'; foe.family = 'thorn';
    } else {
      foe.captain = true; foe.captainProfile = 'supply-vale';
    }
    g.zone().enemies = [foe];
    assert(!g.castMovementBasic(), cls + ' passive opening skips ' + kind);
    assert(!foe.aggro && foe.hp === foe.maxHp, 'leader unaffected by automatic proximity');
    assert(g.cast(1, foe.id), cls + ' manual Skill 1 authorizes ' + kind + ' combat');
    assert(foe.aggro, 'explicit cast starts leader encounter');
    g.hero.basicCd = 0;
    assert(g.castMovementBasic(), cls + ' passive attacks resume after skill engagement');
  }
}
{
  // Building independently must never leave the tutorial stranded at the
  // Captain after construction is visibly underway.
  const g = fresh('mage');
  const q = g.s.quests['quest-barracks'];
  assert(!q.captainBriefed);
  g.distanceToRoad = () => 400;
  g.blocked = () => false;
  assert(g.build(), 'unbriefed but legal first Barracks can be placed');
  const b = g.zone().buildings.find((x) => x.kind === 'barracks');
  assert(b);
  assert.equal(g.tutorialStage(), 'construction');
  assert.equal(g.questDestination('quest-barracks')?.id, b.id,
    'active Barracks overrides the earlier Captain waypoint');
  const u = g.s.party.find((x) => x.order?.id === b.id);
  assert(u);
  Object.assign(u, { x: b.x, y: b.y });
  g.zone().enemies = [];
  g.updateParty(4.1);
  assert(q.paid, 'no mandatory Captain/Recall gate blocks a legitimate build');
  assert(C.restore(g.snapshot()).s.quests['quest-barracks'].paid);
}

console.log('PASS v0.9.2 company/rogue/Board/Codex/gather and boss/captain auto-attack native regressions');
