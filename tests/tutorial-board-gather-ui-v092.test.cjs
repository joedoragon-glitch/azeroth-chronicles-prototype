'use strict';
// Complement the native chapter tests and the separate bilingual Board/map
// shell suite: this one proves payout, completed-history and Board-only credit.
// Construction approach is isolated, not an earned full player playthrough.
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');

for (const language of ['en', 'es']) {
  const { scope: s, elements: e } = shell(language);
  const g = s.Prototype.game;
  const t = (en, es) => language === 'en' ? en : es;
  const buttons = () => e.get('modal-actions').children.filter((b) => typeof b.onclick === 'function');
  const title = () => e.get('modal-title').textContent;
  const click = (text) => {
    const b = buttons().find((x) => x.textContent.startsWith(text));
    assert(b && !b.disabled, 'Missing/disabled ' + text + ' from ' + title());
    b.click();
  };
  const root = () => {
    s.Prototype.closeMenu();
    e.get('menu-button').click();
  };

  // Real native construction with isolated scene geometry: no fake paid flag.
  g.zone().enemies = [];
  g.zone().props = [];
  g.distanceToRoad = () => 400;
  g.blocked = () => false;
  assert(g.build());
  const base = g.zone().buildings.find((b) => b.kind === 'barracks');
  const worker = g.s.party.find((u) => u.order?.type === 'build');
  assert(base && worker);
  Object.assign(worker, { x: base.x, y: base.y });
  g.updateParty(4.1);
  assert(g.s.quests['quest-barracks'].paid && g.s.quests['quest-tutorial-board'].active);

  // Opening analogous Journal sections must NOT pretend the player learned
  // how to use the physical town Quest Board. The Board tutorial stays active.
  root();
  click(t('Quest journal', 'Diario de misiones'));
  click(t('A Teacher Taken', 'Una maestra cautiva'));
  assert(!g.s.quests['quest-tutorial-board'].storyViewed,
    'journal-only Main Story does not complete physical Board step');
  root();
  click(t('Quest journal', 'Diario de misiones'));
  click(t('Side Quests', 'Misiones secundarias'));
  assert(!g.s.quests['quest-tutorial-board'].sideViewed,
    'journal-only Side Quests does not complete physical Board step');

  // An earlier harvest counter records material picked up, not crowns paid.
  // In particular it must never falsely finish the first-use lesson.
  g.s.gathered.vale = 15;
  const harvestedSite = g.visibleResourceNodes()[0];
  assert(harvestedSite && harvestedSite.amount >= 15);
  harvestedSite.amount -= 15; // keep the existing finite regional pool consistent
  g.s.expeditionRank = 2;
  Object.assign(g.hero, { x: base.x, y: base.y });
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  click(t('Operations', 'Operaciones'));
  assert(!g.s.quests['quest-tutorial-gather'].active);
  click(t('Gather resources', 'Recoger recursos'));
  const p = g.s.quests['quest-tutorial-gather'];
  assert(p.active && p.gatherStarted && !p.gatherDeposited && !p.paid,
    'harvested counter cannot masquerade as a delivered payout');
  click(t('Choose a tribute source', 'Elegir una fuente de tributo'));
  const choice = buttons().find((b) => /Recover Dark Lord Tribute|Recuperar.*tributo/i.test(b.textContent));
  assert(choice && !choice.disabled, 'real finite gather choice');
  choice.click();
  const source = g.visibleResourceNodes()[0];
  assert(source);
  const labor = g.s.party.filter((u) => u.order?.type === 'gather');
  assert(labor.length);
  for (const u of labor) Object.assign(u, { x: source.x, y: source.y });
  for (let i = 0; i < 120 && !labor.some((u) => u.carry > 0); i++) g.updateParty(.1);
  assert(labor.some((u) => u.carry > 0), 'native labor generated cargo');
  assert(!p.gatherDeposited && !p.paid, 'cargo before deposit cannot pay lesson');

  const supplier = g.zone().npcs.find((n) => n.kind === 'supplier');
  assert(supplier);
  const before = g.hero.gold;
  Object.assign(g.hero, { x: supplier.x, y: supplier.y });
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  assert(g.hero.gold > before, 'real supplier transaction credits crowns');
  assert(p.paid && p.done, 'saved paid state follows legitimate deposit');
  assert(g.constructor.restore(g.snapshot()).s.quests['quest-tutorial-gather'].paid);

  root();
  click(t('Quest journal', 'Diario de misiones'));
  click(t('Completed quests', 'Misiones completadas'));
  assert(e.get('modal-actions').children.some((b) => b.textContent.startsWith(
    t('Your First Company', 'Tu primera compañía'))));
  assert(e.get('modal-actions').children.some((b) => b.textContent.startsWith(
    t('Recover Dark Lord Tribute', 'Recuperar el tributo del Señor Oscuro'))),
    'new paid chapter appears in completed quest history');
}
console.log('PASS bilingual Board-only credit, real cargo/deposit, old counter safety and completed history');
