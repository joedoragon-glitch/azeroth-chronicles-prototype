'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const A = require('../src/prototype/narration.js').approved;
const { shell } = require('./helpers/production-shell.cjs');
const make = () => new Campaign('normal', 'paladin', () => 0.9);
const onlyNotice = (game, expected, label) => {
  assert.equal(game.notices.filter((n) => n.text === expected).length, 1, label + ' notices once');
  assert(game.notices.some((n) => n.text === expected && n.kind === 'narration' ||
    n.text === expected && n.kind === 'milestone'), label + ' displays through the quiet notice queue');
  assert(game.storyReadings().some((n) => n.text === expected), label + ' has full earned story');
};
for (const [zone, approvedId] of [['crypt', 'D01'], ['mine', 'D02'],
  ['abyss', 'D03'], ['citadel', 'D04_entrance']]) {
  const g = make();
  assert(g.enter(zone), zone + ' first entry');
  onlyNotice(g, A[approvedId].en, zone);
  g.enter('vale');
  g.enter(zone);
  assert.equal(g.notices.filter((n) => n.text === A[approvedId].en).length, 1,
    zone + ' never repeats once discovered');
  const restored = Campaign.restore(g.snapshot(), () => 0.9);
  assert(restored.storyReadings().some((n) => n.text === A[approvedId].en),
    zone + ' full text survives reload');
  assert(!g.notices.some((n) => n.text === A.D04.en), 'Private quarters never leak at entrance');
}
for (const [zone, approvedId] of [
  ['side-vale-cellars', 'I01'], ['side-march-watchhouse', 'I02'],
  ['side-highlands-signal', 'I03'], ['side-frontier-shrine', 'I04'],
  ['side-crown-foundry', 'I05'],
]) {
  const g = make();
  assert(g.enter(zone), zone + ' first entry');
  onlyNotice(g, A[approvedId].en, zone);
  const count = g.notices.length;
  g.enter('vale');
  g.enter(zone);
  assert.equal(g.notices.length, count, zone + ' must not repeat its narration');
  assert(Campaign.restore(g.snapshot(), () => 0.9).storyReadings()
    .some((n) => n.text === A[approvedId].en), zone + ' old-save reconstruction');
}
for (const [region, site, approvedId] of [
  ['vale', 'goblin-camp', 'L01'], ['march', 'mire-nests', 'L02'],
  ['highlands', 'ogre-hearth', 'L03'],
]) {
  const g = make();
  assert(g.enter(region), region);
  const n = g.zone().npcs.find((candidate) => candidate.id === site);
  assert(n, site + ' real landmark present');
  g.hero.x = n.x; g.hero.y = n.y;
  assert(g.interact(n), site + ' native interaction');
  onlyNotice(g, A[approvedId].en, site);
  g.interact(n);
  assert.equal(g.notices.filter((x) => x.text === A[approvedId].en).length, 1,
    site + ' interaction does not duplicate its discovery');
  const restored = Campaign.restore(g.snapshot(), () => 0.9);
  assert(restored.storyReadings().some((x) => x.text === A[approvedId].en),
    site + ' can be revisited via Announcements after reload');
}
const end = make();
assert(!end.storyReadings().some((n) => n.text === A.M01.en), 'Throne secret stays gated');
end.enter('crown');
end.s.true.darklord = true;
end.zone().enemies.forEach((e) => { e.hp = 0; });
const throne = end.zone().npcs.find((n) => n.id === 'dark-crown-throne');
assert(throne, 'Actual throne exists');
end.hero.x = throne.x; end.hero.y = throne.y;
assert(end.interact(throne), 'Claim the throne through the native interaction');
onlyNotice(end, A.M01.en, 'M01 throne');
end.interact(throne);
assert.equal(end.notices.filter((n) => n.text === A.M01.en).length, 1, 'Throne one-time delivery');
assert(!end.storyReadings().some((n) => n.text === A.M02.en), 'Final rest not yet unlocked');
const throneRestored = Campaign.restore(end.snapshot(), () => 0.9);
assert(throneRestored.storyReadings().some((n) => n.text === A.M01.en), 'Restored throne secret stays earned');
end.s.phase = 'peace';
const refuge = end.zone().npcs.find((n) => n.kind === 'rest');
assert(refuge, 'Final rest refuge exists');
end.hero.x = refuge.x; end.hero.y = refuge.y;
assert(end.completeFinalRest('refuge', refuge), 'Final rest occurs only at the refuge');
onlyNotice(end, A.M02.en, 'M02 final rest');
assert(!end.completeFinalRest('refuge', refuge), 'Final rest is once only');
assert(Campaign.restore(end.snapshot(), () => 0.9).storyReadings()
  .some((n) => n.text === A.M02.en), 'Final-rest text survives v4 reload');

// Real Announcements traversal from a restored earned-story save, in both languages.
const earned = make();
earned.s.discovered['vale:dungeon-lore:crypt'] = true;
earned.s.discovered['vale:side-lore:side-vale-cellars'] = true;
earned.s.discovered['vale:goblin-camp'] = true;
earned.s.throneClaimed = true;
earned.s.finalRestCompleted = true;
for (const language of ['en', 'es']) {
  const storage = new Map([['azeroth-v4-normal', JSON.stringify(earned.snapshot())]]);
  const { scope, elements } = shell(language, 'paladin', { storage });
  const click = (prefix) => {
    const target = elements.get('modal-actions').children
      .find((button) => button.textContent.startsWith(prefix));
    assert(target, 'Missing ' + prefix + ' in ' + elements.get('modal-title').textContent);
    target.click();
  };
  elements.get('menu-button').click();
  click(language === 'es' ? 'Diario de misiones' : 'Quest journal');
  click(language === 'es' ? 'Anuncios' : 'Announcements');
  for (const id of ['D01', 'I01', 'L01', 'M01', 'M02']) {
    const phrase = language === 'es' ? A[id].es : A[id].en;
    const target = elements.get('modal-actions').children.find((item) =>
      item.textContent.includes(phrase.slice(0, 28)));
    assert(target, id + ' has author-approved ' + language + ' index preview');
    target.click();
    assert.equal(elements.get('modal-description').textContent, phrase,
      id + ' full ' + language + ' journal entry matches master verbatim');
    elements.get('close-button').click();
  }
}
console.log('PASS native N1 delivery/once-only, discovered-story reload, EN/ES journal entry and exact copy');
