'use strict';
// Exhaust the Archive's finite templates, including procedurally populated
// references; fail on any unaccounted-for English prose, not merely labels.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const C = require(
  path.join(
    process.env.ARCHIVE_MECHANICS_ROOT || path.resolve(__dirname, '..'),
    'src/prototype/engine.js',
  ),
);
const A = require('../src/prototype/archive.js');
C.enableRoguePlaytest();
const approved = require('../src/prototype/narration.js').approved;
const { shell } = require('./helpers/production-shell.cjs');
// Inspect the real matcher without adding a debug API to the shipped game.
const moduleObject = { exports: {} };
vm.runInNewContext(
  fs
    .readFileSync(require.resolve('../src/prototype/archive.js'), 'utf8')
    .replace('const api = {', 'const api = { namedCatalog,'),
  {
    module: moduleObject,
    require: (p) => require(path.resolve(__dirname, '../src/prototype', p)),
  },
);
const gapsFor = (text, names) => {
  const { pattern } = moduleObject.exports.namedCatalog(names);
  return text
    .replace(pattern, '\0')
    .split('\0')
    .filter((fragment) => /[A-Za-z]{2}/.test(fragment));
};
const numbers = (text) => text.match(/\d+(?:\.\d+)?/g) || [];
let checked = 0;
const untranslated = new Set();
for (const heroClass of ['paladin', 'mage', 'ranger', 'rogue']) {
  const g = new C('normal', heroClass, () => 0.93);
  for (const boss of C.data.bosses) {
    g.enter(boss.id);
    g.s.true[boss.id] = true;
  }
  for (const region of C.data.regions) g.enter(region.id);
  for (const room of [...C.rules.supplyRooms, ...C.rules.sideDungeons]) g.enter(room.id);
  // All unlocked pet states have identical technical templates, but distinct
  // on-screen labels; exercise active, resting and fallen roster states too.
  for (const [i, boss] of C.data.bosses.entries()) {
    if (i < 3) {
      const u = g.unit('pet', g.hero.x, g.hero.y, boss.id);
      u.active = i === 0;
      if (i === 2) u.hp = 0;
      g.s.party.push(u);
    }
  }
  for (const mana of [false, true])
    for (const rank of [0, 5]) {
      g.hero.skills = Array(8).fill(rank);
      const rules = { ...C.rules, resourceMode: { ...C.rules.resourceMode, manaEnabled: mana } };
      for (const evidence of [false, true]) {
        g.s.keeperEvidence = evidence;
        g.s.throneClaimed = evidence;
        const before = JSON.stringify(g.snapshot());
        const names = A.translationNames(g, { D: C.data, R: rules });
        const sections = A.sections(g, { D: C.data, R: rules });
        assert.equal(sections.length, evidence ? 9 : 8);
        for (const s of sections)
          for (const text of [s.title, s.intro, ...s.topics.flat()]) {
            const es = A.translateArchive(text, names);
            for (const gap of gapsFor(text, names)) untranslated.add(gap);
            assert.deepEqual(numbers(es), numbers(text), 'Exact numeric tokens and order: ' + text);
            for (const pair of Object.values(approved))
              if (text.includes(pair.en))
                assert(es.includes(pair.es), 'Embedded author-final passage is exact');
            assert(!/[\uE000\uE001]|\\uE00[01]/.test(es), 'No leaked protection markers');
            checked++;
          }
        assert.equal(JSON.stringify(g.snapshot()), before, 'All reference queries are read-only');
      }
    }
}
assert.deepEqual([...untranslated], [], 'Untranslated Archive technical fragments (all combinations)');
const nightHelp = A.conditionTopics(C.rules).find((topic) => topic[0] === 'Monsters after dark');
assert.equal(A.translateArchive(nightHelp[0]), 'Monstruos después del anochecer');
assert(A.translateArchive(nightHelp[1]).includes('Los monstruos encantados legítimamente'),
  'the new short reference is naturally translated into Spanish');
const nightFiguresEs = A.translateArchive(nightHelp[2]);
assert(nightFiguresEs.includes('Los monstruos encantados y las mascotas de jefes activos'),
  'Keeper night figures localize owned monster eligibility');
assert(!/Nighttime monster|Skill Block|Resting monsters/.test(nightFiguresEs),
  'new detailed night reference contains no leaked English technical prose');
for (const pair of Object.values(approved)) {
  assert.equal(A.translateArchive(pair.en), pair.es);
  assert.equal(A.translateArchive(pair.es), pair.es);
  assert.equal(A.translateArchive(pair.en + '\n' + pair.en), pair.es + '\n' + pair.es);
}
assert.equal(
  A.translateArchive('leftovers and recovery'),
  'leftovers and recovery',
  'English fragments cannot match inside longer words',
);
assert.equal(
  A.translateArchive('Overwatch Ranger', ['Overwatch Ranger']),
  'Overwatch Ranger',
  'Procedural and authored names remain intact',
);
for (const lang of ['en', 'es']) {
  const { scope, elements, events } = shell(lang);
  const host = scope.Prototype;
  let activated = 0;
  host.openMenu(
    'The next lesson',
    'Long text',
    [
      {
        label: 'All shelves',
        action() {
          activated++;
        },
      },
    ],
    host.closeMenu,
    { view: 'archive-reading' },
  );
  const reader = elements.get('modal-description');
  reader.focus();
  for (const code of [
    'ArrowDown',
    'ArrowUp',
    'PageDown',
    'PageUp',
    'Home',
    'End',
    'Space',
    'Enter',
  ]) {
    let prevented = false;
    for (const listener of events.keydown)
      listener({
        code,
        preventDefault() {
          prevented = true;
        },
      });
    assert.equal(prevented, false, code + ' retains native reading behavior');
    assert.equal(activated, 0, 'Reading keys never invoke the selected action');
  }
  host.openMenu('Battle and protection', 'Topics', [], host.closeMenu, { view: 'archive-shelf' });
  assert.equal(reader.tabIndex, -1);
  assert.equal(reader.getAttribute('role'), null);
  assert.equal(
    reader.getAttribute('aria-label'),
    null,
    'Reading metadata cannot leak to other menus',
  );
}
// Main has moved independently (#429/#431). Translate its exact Slow copy
// already, without importing or reverting those mechanics on this stacked PR.
assert.equal(A.translateArchive('blockable shot; effects require contact'),
  'disparo bloqueable; los efectos requieren contacto',
  'pet Skill Block wording is localized without changing its mechanics');
const blockReference = A.conditionTopics(C.rules).find(([name]) => name === 'Skill Block');
assert.equal(A.translateArchiveLabel(blockReference[0]), 'Bloqueo de habilidades');
assert.equal(A.translateArchive(blockReference[1]),
  'Una habilidad puede alcanzar a su objetivo y aun así ser bloqueada. Un impacto bloqueado no causa daño ni aplica efectos ligados a ese impacto. Cada objetivo de un ataque de área puede bloquearlo por separado. Los impactos críticos de habilidades no se pueden bloquear.');
const blockSpanish = A.translateArchive(blockReference[2]);
assert(blockSpanish.includes('Los monstruos encantados legítimamente y las mascotas de jefes reciben esa misma bonificación nocturna'),
  'merged player reference acknowledges lawfully owned monsters at night');
assert(blockSpanish.includes('Los soldados y arqueros no la reciben'),
  'ordinary companions are specifically excluded from monster-night Block');
assert(A.translateArchive(blockReference[2]).includes('Tu personaje no tiene bloqueo general de habilidades'));
const variedBlock = A.conditionTopics({
  ...C.rules, skillBlock: { ...C.rules.skillBlock, enemySingle: 0.1775, nightEnemyBonus: 0.075 },
}).find(([name]) => name === 'Skill Block');
assert.deepEqual(numbers(A.translateArchive(variedBlock[2])), numbers(variedBlock[2]),
  'modified rules keep exact figure order in Spanish');
const currentSlow = require('./fixtures/archive-slow-main-20261024.json');
for (const text of currentSlow.topic) {
  assert.deepEqual(gapsFor(text, []), [], 'New main Slow copy has complete technical translation');
  assert.deepEqual(numbers(A.translateArchive(text)), numbers(text));
}
assert(
  A.translateArchive(currentSlow.topic[2]).includes(
    'la deuda de reutilización acumulada permanece',
  ),
  'The new main Slow translation retains lasting cooldown debt',
);

assert.equal(
  A.translateArchive(
    ' · heals one wounded ally within 333 for 12.75% of the pet’s maximum HP; clear line required',
  ),
  ' · cura a un aliado herido dentro de 333 por una cantidad equivalente al 12.75% de los PV máximos de la mascota; requiere una línea despejada',
  'Pet healing translates a live amount, not a duration',
);
console.log(
  'PASS Archive technical-copy coverage: ' +
    checked +
    ' fields, 4 classes, both resource modes, learned/unlearned ranks, evidence/throne gates, pets and keyboard reading',
);
