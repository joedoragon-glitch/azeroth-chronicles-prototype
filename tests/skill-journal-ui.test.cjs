'use strict';
const assert = require('node:assert/strict'),
  { shell } = require('./helpers/production-shell.cjs'),
  Ref = require('../src/prototype/skill-reference'),
  Campaign = require('../src/prototype/engine');
// Test-inject the Rogue in this legacy three-class baseline without changing gameplay.
const hadRogue = Object.hasOwn(Campaign.classes, 'rogue');
if (!hadRogue) {
  Campaign.classes.rogue = { ...Campaign.rules.rogueHeroFoundation.stats, icon: 'bell' };
  Campaign.talentProfiles.rogue = { ...Campaign.rules.rogueHeroFoundation.talents };
}
const text = (el) => [el.textContent, ...el.children.map(text)].join(' ');
for (const language of ['en', 'es'])
  for (const cls of ['paladin', 'mage', 'ranger', 'rogue']) {
    const { scope: s, elements: e, events } = shell(language, cls),
      g = s.Prototype.game,
      t = (a, b) => (language === 'en' ? a : b),
      back = () => e.get('close-button').click(),
      click = (prefix) => {
        const b = e.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
        assert(b, prefix);
        assert(!b.disabled);
        b.click();
      },
      journal = () => {
        s.Prototype.closeMenu();
        events.keydown.forEach((fn) =>
          fn({ code: 'KeyX', target: { tagName: 'BODY' }, preventDefault() {} }),
        );
      };
    g.hero.skills.fill(2);
    journal();
    const before = g.snapshot();
    assert.equal(e.get('modal-actions').children.length, 10);
    for (let slot = 1; slot <= 8; slot++) {
      click(t('Skill ', 'Habilidad ') + slot + ' ·');
      const host = e.get('modal-description'),
        sections = host.children.filter(
          (c) =>
            c.children[0]?.textContent === t('Tap', 'Normal') ||
            c.children[0]?.textContent === t('Charged', 'Cargada'),
        );
      assert(host.classList.contains('skill-reference'));
      assert.equal(sections.length, 2, 'each form has a separate readable section');
      for (const [i, form] of ['tap', 'charge'].entries()) {
        const rows = sections[i].children.at(-1).children,
          info = Ref.describe(g, slot)[form];
        assert.equal(rows.length, info.metrics.length * 2);
        assert.equal(rows[0].textContent, t('Cooldown', 'Recuperación'));
        assert.equal(rows[1].textContent, Ref.value(info.metrics[0]));
      }
      assert(!text(host).includes('–'), 'current values replace static rank ranges');
      click(t('Next rank', 'Siguiente rango'));
      assert.equal(e.get('modal-actions').children.length, 0, 'journal preview cannot buy skills');
      assert(
        text(host).includes(' → ') ||
          text(host).includes(t('No change at this rank.', 'Sin cambios en este rango.')),
      );
      back();
      click(t('Using skills', 'Usar habilidades'));
      assert(text(host).includes(t('before enemy defenses', 'antes de defensas')));
      back();
      back();
      assert(!host.classList.contains('skill-reference'), 'normal menus reset structured content');
      assert.equal(host.children.length, 0, 'old skill figures do not leak into other menus');
    }
    assert.deepEqual(g.snapshot(), before, 'all journal inspection and previews remain read-only');
    g.hero.skills.fill(8);
    journal();
    click(t('Skill ', 'Habilidad ') + '1 ·');
    assert.equal(
      e.get('modal-actions').children.length,
      1,
      'maximum rank has no next-rank preview',
    );
    g.hero.skills.fill(1);
    g.s.keys.thorn = true;
    assert(g.rescue('thorn'));
    const mira = g.zone().npcs.find((n) => n.kind === 'teacher' && n.family === 'thorn');
    Object.assign(g.hero, { x: mira.x, y: mira.y, gold: 0 });
    s.Prototype.closeMenu();
    e.get('touch-interact-button').click();
    click(t('Hero skills', 'Habilidades del héroe'));
    const name = Ref.card(g, 1).name;
    click(t('Train ', 'Entrenar ') + name);
    assert(e.get('modal-actions').children[0].disabled);
    const poor = g.snapshot();
    e.get('modal-actions').children[0].click();
    assert.deepEqual(g.snapshot(), poor);
    back();
    g.hero.gold = 1000;
    click(t('Train ', 'Entrenar ') + name);
    assert(text(e.get('modal-description')).includes(' → '));
    const cost = g.skillTrainingCost(1, 1);
    click(t('Train ', 'Entrenar ') + name);
    assert.equal(g.hero.skills[0], 2);
    assert.equal(g.hero.gold, 1000 - cost);
    journal();
    click(t('Skill ', 'Habilidad ') + '1 ·');
    assert(e.get('modal-description').textContent.startsWith(t('Rank 2', 'Rango 2')));
    assert(
      text(e.get('modal-description')).includes(Ref.value(Ref.describe(g, 1).tap.metrics[1])),
      'journal refreshes actual newly trained output',
    );
  }
if (!hadRogue) {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
console.log(
  'PASS 8 English/Spanish class journals: all 32 skills, structured current values, comparison/controls/Back, no reading mutations, maximum rank, funds gate, native confirmed upgrade and refreshed effects',
);
