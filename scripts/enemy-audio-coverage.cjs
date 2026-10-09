'use strict';
// One live VFX inventory; no independently maintained audio skill-name list.
const assert = require('node:assert/strict'),
  inventory = require('./enemy-vfx-inventory.cjs'),
  P = require('../src/prototype/enemy-presentation.js'),
  E = require('../src/prototype/audio-enemy.js');
function audit() {
  const live = inventory.audit(),
    rows = [];
  for (const r of live.rows) {
    assert(r.presentation, 'Missing shared presentation profile: ' + r.id);
    assert(E.textures[r.presentation.material], 'Missing audio material: ' + r.id);
    assert(E.personalities[r.presentation.personality], 'Missing audio personality: ' + r.id);
    if (r.presentation.accent)
      assert(E.motifs[r.presentation.accent], 'Missing important accent: ' + r.id);
    for (const variant of ['normal', 'true'])
      for (const stage of r.stages) {
        const event = {
          skillId: r.id,
          identity: { id: r.id, presentation: r.presentation },
          stage,
          variant,
          target: stage === 'spawn' ? 'actual-unit' : undefined,
          contact: stage === 'impact',
          dangerous: r.kind !== 'summon',
        };
        const d = P.route(event);
        assert(d, 'Unrouted skill/stage: ' + r.id + '/' + stage);
        assert(['shared', 'silent', 'unique'].includes(d.mode));
        rows.push({
          id: r.id,
          stage,
          variant,
          material: r.presentation.material,
          personality: r.presentation.personality,
          accent: r.presentation.accent,
          decision: d.mode,
          key: d.key || null,
          reason: d.reason,
        });
      }
  }
  return { identities: live.total, counts: live.counts, stageVariants: rows.length, rows };
}
function markdown(r) {
  return (
    '# Enemy audio/VFX coverage (generated from live rules)\n\nAll variants share the stable VFX ID. Travel/linger are deliberately silent; impact audio additionally requires real contact.\n\n| ID | Stage | Material / personality | Decision | Sound key | Accent |\n| --- | --- | --- | --- | --- | --- |\n' +
    r.rows
      .filter((x) => x.variant === 'normal')
      .map(
        (x) =>
          '| `' +
          x.id +
          '` | ' +
          x.stage +
          ' | ' +
          x.material +
          ' / ' +
          x.personality +
          ' | ' +
          x.decision +
          ' | ' +
          (x.key || '—') +
          ' | ' +
          (x.accent || '—') +
          ' |',
      )
      .join('\n') +
    '\n'
  );
}
if (require.main === module) {
  const r = audit();
  if (process.argv.includes('--markdown')) process.stdout.write(markdown(r));
  else if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  else
    console.log(
      'PASS enemy audio/VFX coverage:',
      r.identities,
      'identities,',
      r.stageVariants,
      'stage/variant decisions',
      r.counts,
    );
}
module.exports = { audit, markdown };
