'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  { shell } = require('./helpers/production-shell.cjs');
for (const language of ['en', 'es']) {
  const { scope: s, elements: e, storage } = shell(language),
    g = s.Prototype.game,
    t = (a, b) => (language === 'en' ? a : b),
    click = (prefix) => {
      const b = e.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
      assert(b, prefix);
      assert(!b.disabled);
      b.click();
    };
  for (const id of ['rest', 'minor']) {
    const site = g.zone().npcs.find((n) => n.id === id);
    Object.assign(g.hero, site.servicePoint);
    g.hero.hp = 1;
    g.s.party[0].hp = 1;
    const hp = g.hero.hp,
      partyHp = g.s.party[0].hp,
      cooldown = g.s.restCooldown;
    e.get('touch-interact-button').click();
    assert.equal(e.get('modal-title').textContent, site.name);
    assert(e.get('modal-description').textContent.split(/\s+/).length < 45);
    assert(e.get('modal-description').textContent.includes('90'));
    assert.equal(g.hero.hp, hp);
    assert.equal(g.s.party[0].hp, partyHp);
    assert.equal(g.s.restCooldown, cooldown);
    e.get('close-button').click();
    assert(!g.s.discovered['vale:refuge-help:' + id]);
    e.get('touch-interact-button').click();
    click(t('Got it', 'Entendido'));
    assert(e.get('modal').hidden);
    assert.equal(g.s.restCooldown, cooldown);
    assert.equal(g.hero.hp, hp);
    assert(g.s.discovered['vale:refuge-help:' + id]);
    assert(JSON.parse(storage.get('azeroth-v4-normal')).discovered['vale:refuge-help:' + id]);
    assert(C.restore(g.snapshot()).s.discovered['vale:refuge-help:' + id]);
    if (id === 'rest') {
      e.get('touch-interact-button').click();
      assert.equal(g.hero.hp, g.hero.maxHp);
      assert.equal(g.s.party[0].hp, g.s.party[0].maxHp);
      assert.equal(g.s.restCooldown, 90);
    } else {
      // Reopen the first-use guide while the town's shared recovery is cooling down.
      delete g.s.discovered['vale:refuge-help:' + id];
      e.get('touch-interact-button').click();
      assert(e.get('modal-actions').children[0].disabled);
      e.get('modal-actions').children[0].click();
      assert.equal(g.hero.hp, hp);
      e.get('close-button').click();
      g.s.restCooldown = 0;
      const enemy = g.zone().enemies[0];
      Object.assign(enemy, { x: g.hero.x + 50, y: g.hero.y, aggro: true });
      e.get('touch-interact-button').click();
      assert(e.get('modal-actions').children[0].disabled);
      e.get('close-button').click();
      enemy.aggro = false;
      e.get('touch-interact-button').click();
      click(t('Rest now', 'Descansar ahora'));
      assert(e.get('modal').hidden);
      assert.equal(g.hero.hp, g.hero.maxHp);
      assert.equal(g.s.restCooldown, 90);
      assert(g.s.discovered['vale:refuge-help:' + id]);
    }
  }
}
console.log(
  'PASS English/Spanish first-use guides at both refuges: concise, Back/Got it spend no cooldown, separate saved knowledge, explicit Rest, shared cooldown and combat gates',
);
