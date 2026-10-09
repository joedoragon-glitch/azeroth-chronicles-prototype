'use strict';

// Read-only preproduction inventory. Do not duplicate or edit game rules here.
const Campaign = require('../src/prototype/engine.js');
const VFX = require('../src/prototype/enemy-vfx.js');
const assert = require('node:assert/strict');

function expectedStages(plan) {
  if (plan.kind === 'summon') return ['windup', 'spawn'];
  if (plan.kind === 'volley') return ['windup', 'release', 'travel', 'impact'];
  if (plan.charge || plan.landing || plan.kind === 'line' && plan.advance)
    return ['windup', 'travel', 'impact'];
  if (plan.kind === 'ring') return ['windup', 'release', 'travel'];
  return plan.persistent
    ? ['windup', 'release', 'impact', 'linger']
    : ['windup', 'release', 'impact'];
}

function collect() {
  const rows = [], known = new Set();
  function add(row) {
    assert(row.id, 'Visual key is required');
    assert(!known.has(row.id), 'Duplicate VFX key: ' + row.id);
    assert(row.stages.every((s) => VFX.STAGES.includes(s)), 'Unknown stage: ' + row.id);
    known.add(row.id);
    rows.push(Object.freeze(row));
  }

  for (const b of Campaign.data.bosses) {
    const plans = Campaign.rules.attacks[b.id];
    assert(Array.isArray(plans) && plans.length === b.attacks.length, b.id + ' rule/prose mismatch');
    for (const [index, plan] of plans.entries()) {
      const normal = VFX.describe({ type: 'boss', family: b.id, form: 'normal' }, {
        ...plan, index,
      });
      const trueForm = VFX.describe({ type: 'boss', family: b.id, form: 'true' }, {
        ...plan, index,
      });
      assert.equal(normal.id, trueForm.id, b.id + ' TRUE shares stable attack ID');
      add({
        group: 'boss',
        owner: b.name,
        id: normal.id,
        name: b.attacks[index].split(':')[0],
        kind: plan.kind,
        stages: expectedStages(plan),
        notes: 'Normal and TRUE stages share an ID, with optional TRUE overrides',
      });
    }
  }
  for (const [id, captain] of Object.entries(Campaign.rules.roomCaptains)) {
    for (const [index, plan] of captain.attacks.entries()) {
      const visual = VFX.describe(
        { roomCaptain: true, captainProfile: id, species: 'orc' },
        { ...plan, index },
      );
      add({
        group: 'captain',
        owner: captain.name,
        id: visual.id,
        name: plan.name,
        kind: plan.kind,
        stages: expectedStages(plan),
        notes: 'Separate from the captain\'s second-phase presentation',
      });
    }
    if (captain.phase)
      add({
        group: 'captain-phase',
        owner: captain.name,
        id: 'captain/' + id + '/phase',
        name: captain.phase.name,
        kind: captain.phase.kind,
        stages: ['phase'],
        notes: 'Unwired phase event; future work must attach at the existing phase trigger',
      });
  }
  for (const [species] of Object.entries(Campaign.rules.nightEnemyCombat)) {
    const skill = species === 'wraith' ? 'drain' : species === 'stalker' ? 'pounce' : null;
    assert(skill, 'New night skill needs explicit visual inventory: ' + species);
    const visual = VFX.describe({ species }, { nightSkill: skill, kind: 'circle' });
    add({
      group: 'night',
      owner: species,
      id: visual.id,
      name: species === 'wraith' ? 'Soul Drain' : 'Shadow Pounce',
      kind: 'circle',
      stages: species === 'stalker' ? ['windup', 'travel', 'impact'] : ['windup', 'release', 'impact'],
      notes: 'Night-exclusive authored skill',
    });
  }
  for (const [species, profile] of Object.entries(Campaign.rules.rangedProfiles)) {
    const visual = VFX.projectile({ species }, { style: profile.projectileStyle });
    add({
      group: 'ranged',
      owner: species,
      id: visual.id,
      name: profile.variant,
      kind: 'projectile',
      stages: ['release', 'travel', 'impact'],
      notes: 'Projectile motion remains owned by combat simulation',
    });
  }
  // Dynamically adapt when PR #146 adds the expanded rogue signature registry.
  const T = Campaign.rules.tacticalFoundation;
  for (const [role, profiles] of Object.entries(T.rogueRingleaderSignatures || {}))
    for (const [species, profile] of Object.entries(profiles)) {
      const visual = VFX.describe(
        { form: 'ringleader', species, ranged: role === 'ranged' },
        { rogueMove: true, rogueSignature: true, name: profile.name, kind: 'circle' },
      );
      add({
        group: 'rogue-signature',
        owner: species + ' (' + role + ' ringleader)',
        id: visual.id,
        name: profile.name,
        kind: profile.effect,
        stages: ['windup', 'release', 'impact'],
        notes: 'Pending rogue repertoire; must keep exact dodge geometry and cyan cues',
      });
    }
  for (const [kind, profiles] of Object.entries(T.rogueSignatures || {})) {
    assert(['bosses', 'captains'].includes(kind), 'Unexpected rogue signature group: ' + kind);
    for (const [id, profile] of Object.entries(profiles)) {
      const actor = kind === 'bosses'
        ? { type: 'boss', family: id }
        : { roomCaptain: true, captainProfile: id };
      const visual = VFX.describe(actor, { rogueMove: true, rogueSignature: true, kind: 'circle' });
      add({
        group: 'rogue-signature',
        owner: id,
        id: visual.id,
        name: profile.name,
        kind: profile.effect,
        stages: ['windup', 'release', 'impact'],
        notes: 'Pending rogue repertoire; never substitute boss rotation visuals',
      });
    }
  }

  return rows;
}

function audit() {
  const rows = collect();
  const counts = Object.fromEntries(
    [...new Set(rows.map((r) => r.group))].map((g) => [g, rows.filter((r) => r.group === g).length]),
  );
  assert.equal(counts.boss, Campaign.data.bosses.reduce(
    (total, b) => total + Campaign.rules.attacks[b.id].length, 0,
  ));
  assert.equal(counts.captain, Object.values(Campaign.rules.roomCaptains).reduce(
    (total, c) => total + c.attacks.length, 0,
  ));
  assert.equal(counts['captain-phase'],
    Object.values(Campaign.rules.roomCaptains).filter((c) => c.phase).length);
  assert.equal(counts.night, Object.keys(Campaign.rules.nightEnemyCombat).length);
  assert.equal(counts.ranged, Object.keys(Campaign.rules.rangedProfiles).length);
  return { counts, total: rows.length, rows };
}

function markdown(report) {
  const lines = ['# Enemy VFX authored-skill inventory (generated, read-only)', '',
    'Generated from live rules and data; does **not** claim implementation of the visual stages.',
    'Stages below are proposed presentation slots, not gameplay timing or new mechanics.', '',
    '| Group | Visual ID | Current authored move | Effect kind | Future visual stages |',
    '| --- | --- | --- | --- | --- |'];
  for (const r of report.rows)
    lines.push(
      '| ' + r.group + ' | `' + r.id + '` | ' +
      r.owner.replace(/\|/g, '/') + ': ' + r.name.replace(/\|/g, '/') +
      ' | ' + r.kind + ' | ' + r.stages.join(', ') + ' |',
    );
  return lines.join('\n') + '\n';
}

if (require.main === module) {
  const report = audit();
  if (process.argv.includes('--markdown')) process.stdout.write(markdown(report));
  else if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else console.log('PASS enemy skill VFX inventory: ' + report.total + ' descriptors', report.counts);
}

module.exports = { expectedStages, collect, audit, markdown };
