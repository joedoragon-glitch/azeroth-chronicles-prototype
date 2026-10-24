'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const C = require(
  path.join(
    process.env.ARCHIVE_MECHANICS_ROOT || path.resolve(__dirname, '..'),
    'src/prototype/engine.js',
  ),
);
const A = require('../src/prototype/archive.js');
const Reading = require('../src/prototype/archive-reading.js');
const approved = require('../src/prototype/narration.js').approved;
const { shell } = require('./helpers/production-shell.cjs');
const flatten = (v) =>
  typeof v === 'string'
    ? v
    : [
        v.summary || '',
        ...v.sections.flatMap((b) => [
          b.title || '',
          b.text || '',
          ...(b.rows || []).flatMap((r) => [r.label, r.value]),
          ...(b.paragraphs || []),
          b.formula || '',
        ]),
        v.note || '',
      ].join(' ');
// Only visual separators/whitespace may move; wording, punctuation within
// sentences, all numeric tokens and every math operator must survive.
const copy = (s) => s.replace(/[\s:;·—]/g, '');
let checked = 0;
for (const cls of ['paladin', 'mage', 'ranger']) {
  const g = new C('normal', cls, () => 0.93);
  for (const boss of C.data.bosses) {
    g.enter(boss.id);
    g.s.true[boss.id] = true;
  }
  for (const r of [...C.data.regions, ...C.rules.supplyRooms, ...C.rules.sideDungeons])
    g.enter(r.id);
  g.s.keeperEvidence = true;
  g.s.throneClaimed = true;
  const before = JSON.stringify(g.snapshot()),
    names = A.translationNames(g, { D: C.data, R: C.rules });
  for (const language of ['en', 'es'])
    for (const shelf of A.sections(g, { D: C.data, R: C.rules }))
      for (const topic of shelf.topics)
        for (const figures of [false, true]) {
          const source = topic[figures ? 2 : 1];
          if (!source) continue;
          const localized = language === 'es' ? A.translateArchive(source, names) : source;
          const view = Reading.present({
            title: topic[0],
            text: localized,
            section: shelf.title,
            figures,
          });
          assert.equal(
            copy(flatten(view)),
            copy(localized),
            language + ': no rewritten/extra copy: ' + topic[0],
          );
          assert.deepEqual(
            flatten(view).match(/\d+(?:\.\d+)?/g),
            localized.match(/\d+(?:\.\d+)?/g),
            'Keep every value and its order: ' + topic[0],
          );
          for (const pair of Object.values(approved)) {
            const expected = pair[language];
            if (localized.includes(expected))
              assert(
                flatten(view).includes(expected),
                'Approved passage stays contiguous and exact',
              );
          }
          checked++;
        }
  assert.equal(JSON.stringify(g.snapshot()), before, 'Layout never mutates the campaign');
}
for (const pair of Object.values(approved))
  for (const language of ['en', 'es']) {
    assert.equal(
      Reading.present({
        title: 'Record',
        text: pair[language],
        section: 'The provinces',
        figures: false,
      }),
      pair[language],
    );
  }
// Use the actual host's metadata route: localization must happen before layout,
// and a summary must keep native Enter/Space instead of activating menu actions.
for (const language of ['en', 'es']) {
  const { scope, elements, events } = shell(language),
    host = scope.Prototype;
  const g = host.game,
    t = A.sections(g, { D: C.data, R: C.rules })[0].topics[0];
  let clicked = 0;
  host.openMenu(
    t[0],
    t[2],
    [
      {
        label: 'Return to the answer',
        action() {
          clicked++;
        },
      },
    ],
    host.closeMenu,
    { view: 'archive-reading', archiveSection: 'Battle and protection', archiveFigures: true },
  );
  const reader = elements.get('modal-description');
  const walk = (node) => [node, ...node.children.flatMap(walk)];
  const nodes = walk(reader),
    summary = nodes.find(
      (n) => n.textContent === (language === 'es' ? 'Cálculo exacto' : 'Exact calculation'),
    );
  assert(summary, 'Localized formula toggle exists');
  const domCopy = (node) =>
    node === summary ? '' : node.textContent + node.children.map(domCopy).join(' ');
  const source =
    language === 'es'
      ? A.translateArchive(t[2], A.translationNames(g, { D: C.data, R: C.rules }))
      : t[2];
  assert.equal(
    copy(domCopy(reader)),
    copy(source),
    'DOM preserves the full localized source exactly once',
  );
  summary.tagName = 'SUMMARY';
  summary.focus();
  for (const code of ['Enter', 'Space']) {
    let prevented = false;
    for (const fn of events.keydown)
      fn({
        code,
        preventDefault() {
          prevented = true;
        },
      });
    assert.equal(prevented, false, 'Native formula disclosure key remains available');
  }
  assert.equal(clicked, 0, 'Formula activation never clicks the selected menu action');
  assert(reader.classList.contains('archive-reference'));
  host.openMenu('Ordinary menu', 'Original description', [], host.closeMenu);
  assert(!reader.classList.contains('archive-reference'), 'Styling stays Archive-only');
}
console.log(
  'PASS Archive presentation: ' +
    checked +
    ' EN/ES views preserve exact audited wording/value order; approved prose, one-pass localization and native formula controls',
);
