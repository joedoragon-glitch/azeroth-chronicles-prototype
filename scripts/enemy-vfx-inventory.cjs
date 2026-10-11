'use strict';

// Read-only preproduction inventory. Do not duplicate or edit game rules here.
const Campaign = require('../src/prototype/engine.js');
const VFX = require('../src/prototype/enemy-vfx.js');
const P = require('../src/prototype/enemy-presentation.js');
const assert = require('node:assert/strict');

function expectedStages(plan) {
  if (plan.kind === 'summon') return ['windup', 'release', 'spawn'];
  if (plan.kind === 'volley') return ['windup', 'release', 'travel', 'impact'];
  if (plan.charge || plan.landing || (plan.kind === 'line' && plan.advance))
    return ['windup', 'release', 'travel', 'impact'];
  if (plan.kind === 'ring') return ['windup', 'release', 'travel'];
  return plan.persistent
    ? ['windup', 'release', 'impact', 'linger']
    : ['windup', 'release', 'impact'];
}

function collect() {
  const rows = [],
    known = new Set();
  function add(row) {
    assert(row.id, 'Visual key is required');
    assert(!known.has(row.id), 'Duplicate VFX key: ' + row.id);
    assert(
      row.stages.every((s) => VFX.STAGES.includes(s)),
      'Unknown stage: ' + row.id,
    );
    known.add(row.id);
    rows.push(Object.freeze(row));
  }

  for (const b of Campaign.data.bosses) {
    const plans = Campaign.rules.attacks[b.id];
    assert(
      Array.isArray(plans) && plans.length === b.attacks.length,
      b.id + ' rule/prose mismatch',
    );
    for (const [index, plan] of plans.entries()) {
      const normal = VFX.describe(
        { type: 'boss', family: b.id, form: 'normal' },
        {
          ...plan,
          index,
        },
      );
      const trueForm = VFX.describe(
        { type: 'boss', family: b.id, form: 'true' },
        {
          ...plan,
          index,
        },
      );
      assert.equal(normal.id, trueForm.id, b.id + ' TRUE shares stable attack ID');
      add({
        group: 'boss',
        owner: b.name,
        id: normal.id,
        presentation: normal.presentation,
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
        presentation: visual.presentation,
        name: plan.name,
        kind: plan.kind,
        stages: expectedStages(plan),
        notes: "Separate from the captain's second-phase presentation",
      });
    }
    if (captain.phase)
      add({
        group: 'captain-phase',
        owner: captain.name,
        id: 'captain/' + id + '/phase',
        presentation: P.profile({ captain: true, captainProfile: id }, captain.phase),
        name: captain.phase.name,
        kind: captain.phase.kind,
        stages: captain.summon?.opening ? ['phase', 'spawn'] : ['phase'],
        notes: 'Presentation attached at the existing phase trigger',
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
      presentation: visual.presentation,
      name: species === 'wraith' ? 'Soul Drain' : 'Shadow Pounce',
      kind: 'circle',
      stages:
        species === 'stalker'
          ? ['windup', 'release', 'travel', 'impact']
          : ['windup', 'release', 'impact'],
      notes: 'Night-exclusive authored skill',
    });
  }
  for (const [species, profile] of Object.entries(Campaign.rules.rangedProfiles)) {
    const visual = VFX.projectile({ species }, { style: profile.projectileStyle });
    add({
      group: 'ranged',
      owner: species,
      id: visual.id,
      presentation: visual.presentation,
      name: profile.variant,
      kind: 'projectile',
      stages: ['release', 'travel', 'impact'],
      notes: 'Projectile motion remains owned by combat simulation',
    });
  }
  // Forced ranged roles (including ringleaders and authored defenders) are
  // actual configureEnemy outputs, not just the seven optional ranged profiles.
  const inspector = new Campaign('normal', 'paladin', () => 0.5);
  const forcedRoster = [
    ...new Set([
      ...Campaign.data.species.flat().map((x) => x[0]),
      ...Object.keys(Campaign.rules.nightEnemyCombat),
    ]),
  ].sort();
  for (const species of forcedRoster) {
    const actor = { type: 'mob', species, name: species, forcedRole: 'ranged' };
    inspector.configureEnemy(actor, 0);
    const visual = VFX.projectile(actor, { style: actor.projectileStyle });
    if (!known.has(visual.id))
      add({
        group: 'ranged',
        owner: species,
        id: visual.id,
        presentation: visual.presentation,
        name: 'Authored ranged role',
        kind: 'projectile',
        stages: ['release', 'travel', 'impact'],
        notes: 'Actual forced/native ranged role; includes ringleaders and defenders',
      });
  }
  for (const b of Campaign.data.bosses)
    add({
      group: 'basic-attack',
      owner: b.name,
      id: 'boss/' + b.id + '/basic',
      name: 'Basic melee',
      kind: 'melee',
      stages: ['release', 'impact'],
      presentation: P.profile({ type: 'boss', family: b.id }, { kind: 'melee', basic: true }),
      notes: 'Normal/TRUE share contact presentation',
    });
  for (const [id, p] of Object.entries(Campaign.rules.roomCaptains))
    add({
      group: 'basic-attack',
      owner: p.name,
      id: 'captain/' + id + '/basic',
      name: 'Basic melee',
      kind: 'melee',
      stages: ['release', 'impact'],
      presentation: P.profile(
        { captain: true, captainProfile: id },
        { kind: 'melee', basic: true },
      ),
      notes: 'Existing captain contact',
    });
  for (const species of [
    ...new Set([
      ...Campaign.data.species.flat().map((e) => e[0]),
      ...Object.keys(Campaign.rules.nightEnemyCombat),
    ]),
  ].sort())
    add({
      group: 'basic-attack',
      owner: species,
      id: 'enemy/' + species + '/melee',
      name: 'Basic melee',
      kind: 'melee',
      stages: ['release', 'impact'],
      presentation: P.profile({ species }, { kind: 'melee', basic: true }),
      notes: 'Ordinary/guardian/ringleader share species material',
    });
  // Basic tactical maneuvers are inventoried independently of signatures.
  // Species and actual combat roles determine eligibility; shared mechanics
  // may later share artwork instead of forcing duplicate effect assets.
  const T = Campaign.rules.tacticalFoundation,
    roster = [
      ...new Set([
        ...Campaign.data.species.flat().map((entry) => entry[0]),
        ...Object.keys(Campaign.rules.nightEnemyCombat),
      ]),
    ].sort(),
    rangedRoster = new Set([
      ...Object.keys(Campaign.rules.rangedProfiles),
      'archer',
      'crownguard',
      'wraith',
    ]);
  for (const species of roster)
    for (const tier of ['ordinary', 'guardian', 'ringleader'])
      for (const role of ['melee', 'ranged']) {
        if (role === 'ranged' && tier !== 'ringleader' && !rangedRoster.has(species)) continue;
        const ranged = role === 'ranged',
          enemy = {
            species,
            form: tier === 'ringleader' ? 'ringleader' : 'normal',
            guard: tier === 'guardian',
            ranged,
          },
          basic = ranged
            ? (tier === 'guardian' && T.rogueMoves.rangedGuardian) ||
              T.rogueMoves.ranged?.[species] ||
              T.rogueMoves.rangedFallback ||
              T.rogueMoves.species?.[species] ||
              T.rogueMoves.ordinary
            : T.rogueMoves.species?.[species] || T.rogueMoves[tier] || T.rogueMoves.ordinary,
          visual = VFX.describe(enemy, {
            rogueMove: true,
            name: basic.name,
            style: basic.style || 'snare',
            kind: 'circle',
          });
        add({
          group: 'rogue-basic',
          owner: species + ' (' + role + ' ' + tier + ')',
          id: visual.id,
          presentation: visual.presentation,
          name: basic.name,
          kind: basic.style || 'disruption',
          stages: ['windup', 'release', 'impact'],
          notes: 'Role/tier basic; shared presentation assets are permitted',
        });
      }
  for (const [family, profile] of Object.entries(T.rogueMoves.bosses || {})) {
    const visual = VFX.describe(
      { type: 'boss', family },
      { rogueMove: true, name: profile.name, style: profile.style, kind: 'circle' },
    );
    add({
      group: 'rogue-basic',
      owner: family + ' (boss)',
      id: visual.id,
      presentation: visual.presentation,
      name: profile.name,
      kind: profile.style || 'disruption',
      stages: ['windup', 'release', 'impact'],
      notes: 'Boss rogue response, not part of normal boss attack rotation',
    });
  }
  for (const [captain, profile] of Object.entries(T.rogueMoves.captains || {})) {
    const visual = VFX.describe(
      { roomCaptain: true, captainProfile: captain },
      { rogueMove: true, name: profile.name, style: profile.style, kind: 'circle' },
    );
    add({
      group: 'rogue-basic',
      owner: captain + ' (captain)',
      id: visual.id,
      presentation: visual.presentation,
      name: profile.name,
      kind: profile.style || 'disruption',
      stages: ['windup', 'release', 'impact'],
      notes: 'Captain rogue response, separate from authored normal attacks',
    });
  }
  // The integrated PR #146 repertoire is live; inventory every authored signature.
  for (const [role, profiles] of Object.entries(T.rogueRingleaderSignatures || {}))
    for (const [species, profile] of Object.entries(profiles)) {
      const visual = VFX.describe(
        { form: 'ringleader', species, ranged: role === 'ranged' },
        {
          rogueMove: true,
          rogueSignature: true,
          name: profile.name,
          effect: profile.effect,
          kind: 'circle',
        },
      );
      add({
        group: 'rogue-signature',
        owner: species + ' (' + role + ' ringleader)',
        id: visual.id,
        presentation: visual.presentation,
        name: profile.name,
        kind: profile.effect,
        stages: ['windup', 'release', 'impact'],
        notes: 'Implemented rogue repertoire; preserve exact dodge geometry and cyan cues',
      });
    }
  for (const [kind, profiles] of Object.entries(T.rogueSignatures || {})) {
    assert(['bosses', 'captains'].includes(kind), 'Unexpected rogue signature group: ' + kind);
    for (const [id, profile] of Object.entries(profiles)) {
      const actor =
        kind === 'bosses'
          ? { type: 'boss', family: id }
          : { roomCaptain: true, captainProfile: id };
      const visual = VFX.describe(actor, {
        rogueMove: true,
        rogueSignature: true,
        effect: profile.effect,
        kind: 'circle',
      });
      add({
        group: 'rogue-signature',
        owner: id,
        id: visual.id,
        presentation: visual.presentation,
        name: profile.name,
        kind: profile.effect,
        stages: profile.reinforceSpecies
          ? ['windup', 'release', 'impact', 'spawn']
          : ['windup', 'release', 'impact'],
        notes: 'Merged rogue repertoire; never substitute boss rotation visuals',
      });
    }
  }

  for (const species of roster)
    add({
      group: 'frenzy',
      owner: species,
      id: 'enemy/' + species + '/frenzy',
      name: 'Frenzy',
      kind: 'frenzy',
      stages: ['phase'],
      presentation: P.profile({ species }, { kind: 'frenzy' }),
    });
  return rows;
}

function audit() {
  const rows = collect();
  const counts = Object.fromEntries(
    [...new Set(rows.map((r) => r.group))].map((g) => [
      g,
      rows.filter((r) => r.group === g).length,
    ]),
  );
  assert.equal(
    counts.boss,
    Campaign.data.bosses.reduce((total, b) => total + Campaign.rules.attacks[b.id].length, 0),
  );
  assert.equal(
    counts.captain,
    Object.values(Campaign.rules.roomCaptains).reduce((total, c) => total + c.attacks.length, 0),
  );
  assert.equal(
    counts['captain-phase'],
    Object.values(Campaign.rules.roomCaptains).filter((c) => c.phase).length,
  );
  assert.equal(counts.night, Object.keys(Campaign.rules.nightEnemyCombat).length);
  const projectileIds = new Set(
    Object.entries(Campaign.rules.rangedProfiles).map(
      ([species, p]) => VFX.projectile({ species }, { style: p.projectileStyle }).id,
    ),
  );
  const inspector = new Campaign('normal', 'paladin', () => 0.5);
  for (const species of new Set([
    ...Campaign.data.species.flat().map((x) => x[0]),
    ...Object.keys(Campaign.rules.nightEnemyCombat),
  ])) {
    const e = { type: 'mob', species, name: species, forcedRole: 'ranged' };
    inspector.configureEnemy(e, 0);
    projectileIds.add(VFX.projectile(e, { style: e.projectileStyle }).id);
  }
  assert.equal(counts.ranged, projectileIds.size);
  return { counts, total: rows.length, rows };
}

function markdown(report) {
  const lines = [
    '# Enemy VFX authored-skill inventory (generated, read-only)',
    '',
    'Generated from live rules and data; does **not** claim implementation of the visual stages.',
    'Stages below are proposed presentation slots, not gameplay timing or new mechanics.',
    '',
    '| Group | Visual ID | Current authored move | Effect kind | Future visual stages |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const r of report.rows)
    lines.push(
      '| ' +
        r.group +
        ' | `' +
        r.id +
        '` | ' +
        r.owner.replace(/\|/g, '/') +
        ': ' +
        r.name.replace(/\|/g, '/') +
        ' | ' +
        r.kind +
        ' | ' +
        r.stages.join(', ') +
        ' |',
    );
  return lines.join('\n') + '\n';
}

if (require.main === module) {
  const report = audit();
  if (process.argv.includes('--markdown')) process.stdout.write(markdown(report));
  else if (process.argv.includes('--json'))
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else
    console.log('PASS enemy skill VFX inventory: ' + report.total + ' descriptors', report.counts);
}

module.exports = { expectedStages, collect, audit, markdown };
