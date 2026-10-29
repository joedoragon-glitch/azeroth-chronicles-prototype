'use strict';
const assert = require('node:assert/strict'),
  { shell } = require('./helpers/production-shell.cjs'),
  Campaign = require('../src/prototype/engine');
// Current Rogue gameplay is test-injected on this baseline; never change production class choice.
const hadRogue = Object.hasOwn(Campaign.classes, 'rogue');
if (!hadRogue) {
  Campaign.classes.rogue = { ...Campaign.rules.rogueHeroFoundation.stats, icon: 'bell' };
  Campaign.talentProfiles.rogue = { ...Campaign.rules.rogueHeroFoundation.talents };
}
let cases = 0;
for (const language of ['en', 'es'])
  for (const [heroClass, listedNames] of Object.entries({
    paladin: ['Sword Combo', 'Sundering Strike'],
    mage: ['Arcane Combo', 'Frost Bolt'],
    ranger: ['Bow Combo', 'Pinning Shot'],
    rogue: ['Ding and Sting', 'Lead Feet'],
  })) {
    const { scope: s, elements: e } = shell(language, heroClass),
      g = s.Prototype.game;
    // The Rogue's working repertoire names can change independently of trainer mechanics.
    const names = heroClass === 'rogue'
      ? [1, 2].map((slot) => require('../src/prototype/skill-reference').card(g, slot).name)
      : listedNames;
    const t = (en, es) => (language === 'en' ? en : es);
    const click = (prefix) => {
      const b = e.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
      assert(b, prefix + ' in ' + e.get('modal-title').textContent);
      assert(!b.disabled);
      b.click();
    };
    const back = () => e.get('close-button').click();
    const brief = () =>
      assert(e.get('modal-description').textContent.trim().split(/\s+/).length <= 30);
    g.s.keys.thorn = true;
    assert(g.rescue('thorn'));
    const mira = g.zone().npcs.find((n) => n.kind === 'teacher' && n.family === 'thorn');
    assert(mira);
    Object.assign(g.hero, { x: mira.x, y: mira.y });
    g.hero.gold = 0;
    e.get('touch-interact-button').click();
    assert.equal(e.get('modal-title').textContent, mira.name);
    brief();
    assert.equal(e.get('modal-actions').children.length, 5);
    click(t('Hero skills', 'Habilidades del héroe'));
    brief();
    for (const name of names)
      assert(e.get('modal-actions').children.some((b) => b.textContent.includes(name)),
        'Expected ' + name + ' for ' + heroClass + ' / ' + g.hero.class +
        '; actual: ' + e.get('modal-actions').children.map((b) => b.textContent).join(' | '));
    const before = g.snapshot();
    e.get('modal-actions').children[1].click();
    assert(e.get('modal-actions').children[0].disabled, 'training remains blocked without funds');
    e.get('modal-actions').children[0].click();
    assert.deepEqual(g.snapshot(), before);
    back();
    back();
    click(t('Expedition training', 'Entrenamiento de Expedición'));
    brief();
    click(t('Train Expedition Skill', 'Entrenar Expedición'));
    assert.equal(g.s.expeditionRank, 2);
    assert.equal(g.hero.gold, 0);
    brief();
    assert(e.get('modal-description').textContent.includes('Sela'));
    assert(e.get('modal-actions').children[0].disabled);
    back();
    g.hero.gold = 1000;
    click(t('Hero skills', 'Habilidades del héroe'));
    let gold = g.hero.gold,
      cost = g.skillTrainingCost(2, 0);
    click(t('Learn ', 'Aprender ') + names[1]);
    assert.equal(g.hero.gold, gold);
    click(t('Learn ', 'Aprender ') + names[1]);
    assert.equal(g.hero.skills[1], 1);
    assert.equal(g.hero.gold, gold - cost);
    for (const slot of [1, 2]) {
      gold = g.hero.gold;
      cost = g.skillTrainingCost(slot, 1);
      click(t('Train ', 'Entrenar ') + names[slot - 1]);
      assert.equal(g.hero.gold, gold);
      click(t('Train ', 'Entrenar ') + names[slot - 1]);
      assert.equal(g.hero.skills[slot - 1], 2);
      assert.equal(g.hero.gold, gold - cost);
    }
    brief();
    const capped = e.get('modal-actions').children;
    assert(capped.every((b) => b.disabled));
    assert(capped.every((b) => !/crowns|coronas/.test(b.textContent)));
    assert(capped.every((b) => b.textContent.includes(t('Finished here', 'Terminado aquí'))));
    const maxGold = g.hero.gold;
    capped[0].click();
    assert.equal(g.hero.gold, maxGold);
    back();
    click(t('Higher ranks', 'Rangos superiores'));
    brief();
    assert(e.get('modal-description').textContent.includes('Sela'));
    assert(e.get('modal-description').textContent.includes('Flooded Marches'));
    back();
    click(t('Companion training', 'Entrenamiento de compañeros'));
    brief();
    const training = g.expeditionSupportCost('sharedTraining');
    gold = g.hero.gold;
    click(t('Learn Shared Training', 'Aprender Shared Training'));
    assert.equal(g.expeditionSupportRank('sharedTraining'), 1);
    assert.equal(g.hero.gold, gold - training);
    assert(e.get('modal-actions').children[0].disabled);
    back();
    click(t('Open skill journal', 'Abrir diario de habilidades'));
    brief();
    back();
    assert.equal(e.get('modal-title').textContent, mira.name);
    cases++;
  }
if (!hadRogue) {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
console.log(
  'PASS ' +
    cases +
    ' actual English/Spanish Paladin/Mage/Ranger/Rogue instructor flows: clear branches/Back, funds, native hero learning/upgrades and capped labels, free Expedition/next instructor, support charges and journal',
);
