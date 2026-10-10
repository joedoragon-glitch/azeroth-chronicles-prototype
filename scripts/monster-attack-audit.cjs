'use strict';

// Read-only v0.9 housekeeping report. This file never writes gameplay state,
// adds attacks, sets review verdicts, or replaces authoritative combat rules.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const VfxInventory = require('./enemy-vfx-inventory.cjs');

function copy(value) {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

function sourceMechanic(row, inspector) {
  const rules = Campaign.rules;
  const tactical = rules.tacticalFoundation;
  const parts = row.id.split('/');
  switch (row.group) {
    case 'boss': {
      const family = parts[1];
      const slot = Number(parts[2]);
      const authored = Campaign.data.bosses.find((b) => b.id === family);
      assert(authored && Number.isInteger(slot), row.id + ': missing boss');
      const plan = rules.attacks[family][slot];
      assert(plan, row.id + ': missing boss plan');
      return {
        source: 'rules.attacks.' + family + '[' + slot + ']',
        mechanic: copy(plan),
        authoredDescription: authored.attacks[slot],
        forms: ['normal', 'true'],
        runtimeModifiers: 'TRUE variations, sequences and effective range are resolved by buildBossAttack / bossCombat at runtime',
      };
    }
    case 'captain': {
      const key = parts[1];
      const slot = Number(parts[2]);
      const plan = rules.roomCaptains[key]?.attacks[slot];
      assert(plan, row.id + ': missing captain plan');
      return {
        source: 'rules.roomCaptains.' + key + '.attacks[' + slot + ']',
        mechanic: copy(plan),
      };
    }
    case 'captain-phase': {
      const key = parts[1];
      const phase = rules.roomCaptains[key]?.phase;
      assert(phase, row.id + ': missing captain phase');
      return {
        source: 'rules.roomCaptains.' + key + '.phase',
        mechanic: copy(phase),
        openingSummon: copy(rules.roomCaptains[key]?.summon || null),
      };
    }
    case 'night': {
      const species = parts[1];
      const config = rules.nightEnemyCombat[species];
      assert(config, row.id + ': missing night skill');
      return {
        source: 'rules.nightEnemyCombat.' + species,
        mechanic: copy(config),
        trigger: parts[2],
      };
    }
    case 'ranged': {
      const species = parts[1];
      const enemy = { type: 'mob', species, name: species, forcedRole: 'ranged' };
      inspector.configureEnemy(enemy, 0);
      assert.equal(enemy.projectileStyle, parts[2], row.id + ': projectile role mismatch');
      return {
        source: 'rules.rangedProfiles / configureEnemy(forcedRole=ranged)',
        mechanic: copy({
          style: enemy.projectileStyle,
          range: enemy.shotRange,
          speed: enemy.shotSpeed,
          slow: enemy.projectileSlow || 0,
          role: 'ranged',
        }),
      };
    }
    case 'rogue-basic': {
      const tier = parts[1];
      let profile;
      let source;
      if (tier === 'boss') {
        profile = tactical.rogueMoves.bosses[parts[2]];
        source = 'rules.tacticalFoundation.rogueMoves.bosses.' + parts[2];
      } else if (tier === 'captain') {
        profile = tactical.rogueMoves.captains[parts[2]];
        source = 'rules.tacticalFoundation.rogueMoves.captains.' + parts[2];
      } else {
        const role = parts[2];
        const species = parts[3];
        const moves = tactical.rogueMoves;
        profile =
          (role === 'ranged' &&
            ((tier === 'guardian' && moves.rangedGuardian) ||
              moves.ranged?.[species] ||
              moves.rangedFallback)) ||
          moves.species?.[species] ||
          moves[tier] ||
          moves.ordinary;
        source = 'rules.tacticalFoundation.rogueMoves (role/tier/species resolved at runtime)';
      }
      assert(profile, row.id + ': missing basic rogue maneuver');
      assert.equal(profile.name, row.name, row.id + ': rogue basic name mismatch');
      return { source, mechanic: copy(profile) };
    }
    case 'rogue-signature': {
      const tier = parts[1];
      let profile;
      let source;
      if (tier === 'boss' || tier === 'captain') {
        const key = tier === 'boss' ? 'bosses' : 'captains';
        profile = tactical.rogueSignatures[key][parts[2]];
        source = 'rules.tacticalFoundation.rogueSignatures.' + key + '.' + parts[2];
      } else {
        const role = parts[2];
        const species = parts[3];
        profile = tactical.rogueRingleaderSignatures[role]?.[species];
        source =
          'rules.tacticalFoundation.rogueRingleaderSignatures.' + role + '.' + species;
      }
      assert(profile, row.id + ': missing signature');
      assert.equal(profile.name, row.name, row.id + ': rogue signature name mismatch');
      return { source, mechanic: copy(profile) };
    }
    case 'basic-attack':
      return {
        source: 'engine.updateEnemies / shared melee resolution',
        mechanic: { action: 'melee contact', basis: 'species/captain/boss runtime combat statistics' },
      };
    case 'frenzy':
      return {
        source: 'rules.ringleaderScaling / engine.updateEnemies',
        mechanic: copy({
          threshold: rules.ringleaderScaling.frenzyThreshold,
          cooldownMultiplier: rules.ringleaderScaling.frenzyCooldown,
          aimMultiplier: rules.ringleaderScaling.frenzyAim,
        }),
      };
    default:
      throw Error('Unclassified existing VFX inventory group: ' + row.group);
  }
}

function report() {
  const existing = VfxInventory.audit();
  const inspector = new Campaign('normal', 'paladin', () => 0.5);
  const entries = existing.rows.map((row) => ({
    id: row.id,
    group: row.group,
    owner: row.owner,
    name: row.name,
    kind: row.kind,
    proposedStages: [...row.stages],
    presentation: copy(row.presentation),
    notes: row.notes || '',
    ...sourceMechanic(row, inspector),
    review: {
      mechanics: 'unreviewed',
      description: 'unreviewed',
      speciesAndLore: 'unreviewed',
      telegraphAndVisuals: 'unreviewed',
      lifecycle: 'unreviewed',
    },
  }));
  const traps = ['spikes', 'jet', 'seal'].map((kind) => ({
    id: 'trap/' + kind,
    group: 'environment-trap',
    owner: 'dungeon / side dungeon / outdoor mini-site',
    name: kind,
    kind: kind === 'jet' ? 'capsule' : 'circle',
    source: 'rules.dungeonTrapTuning / rules.sideDungeonTrapTuning / rules.outdoorMiniTrapTuning; engine.traps / trapContains / updateTraps',
    mechanic: {
      hit: 'once per active cycle per living hero/companion in geometric footprint',
      damage: 'a fraction of victim max HP derived from the active regional/context tuning',
      secondary: kind === 'seal' ? 'slow on baseline main; active PR #210 may revise' : 'none on baseline main; active PR #210 may revise',
      activation: 'warning, active and cycle times from live context tuning',
    },
    proposedStages: ['windup', 'impact'],
    review: {
      mechanics: 'unreviewed',
      description: 'unreviewed',
      speciesAndLore: 'not-applicable',
      telegraphAndVisuals: 'unreviewed',
      lifecycle: 'unreviewed',
    },
  }));
  const recoveries = Object.entries(Campaign.rules.bossRecovery)
    .filter(([, plan]) => !!plan && typeof plan === 'object' && typeof plan.name === 'string')
    .map(([family, plan]) => ({
      id: 'boss/' + family + '/recovery',
      group: 'boss-recovery',
      owner: Campaign.data.bosses.find((b) => b.id === family)?.name || family,
      name: plan.name,
      kind: 'self-heal',
      source: 'rules.bossRecovery.' + family + ' / boss-combat.startBossRecovery',
      mechanic: copy(plan),
      threshold: Campaign.rules.bossRecovery.threshold,
      proposedStages: ['windup', 'release'],
      review: {
        mechanics: 'unreviewed',
        description: 'unreviewed',
        speciesAndLore: 'unreviewed',
        telegraphAndVisuals: 'unreviewed',
        lifecycle: 'unreviewed',
      },
    }));
  const rows = [...entries, ...traps, ...recoveries];
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length, 'duplicate registry ID');
  const counts = Object.fromEntries(
    [...new Set(rows.map((row) => row.group))].map((group) => [
      group,
      rows.filter((row) => row.group === group).length,
    ]),
  );
  assert.equal(entries.length, existing.total, 'VFX roster must not lose an identity');
  assert.equal(traps.length, 3, 'all three trap kinds are included');
  return {
    schemaVersion: 1,
    purpose: 'v0.9 read-only audit inventory, not certification of correctness',
    authority: 'live Campaign data/rules and existing enemy VFX identity inventory',
    activeCombatMode: Campaign.rules.resourceMode.manaEnabled ? 'legacy-mana' : 'cooldown-only',
    counts,
    totalVisualIdentities: entries.length,
    additionalTrapKinds: traps.length,
    additionalRecoveryActions: recoveries.length,
    reviewPolicy: 'unreviewed until an independent mechanic, description, identity, VFX and lifecycle audit',
    rows,
  };
}

function markdown(audit) {
  const escape = (value) => String(value ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
  const lines = [
    '# v0.9 generated monster-attack audit registry',
    '',
    '> Read-only live-source inventory. No skill is certified correct merely by appearing here.',
    '> Counts are presentation IDs, not unique damage formulas. TRUE boss forms share authored IDs.',
    '',
    'Visual identities: **' + audit.totalVisualIdentities + '**; trap kinds: **' +
      audit.additionalTrapKinds + '**; configured recovery actions: **' +
      audit.additionalRecoveryActions + '**.',
    '',
    '| Group | Stable ID | Owner | Skill / action | Mechanics | Stages | Review |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of audit.rows) {
    const mechanics = row.mechanic || {};
    const kind = mechanics.effect || mechanics.style || mechanics.kind || row.kind;
    lines.push(
      '| ' +
        escape(row.group) +
        ' | `' +
        escape(row.id) +
        '` | ' +
        escape(row.owner) +
        ' | ' +
        escape(row.name) +
        ' | ' +
        escape(kind) +
        ' | ' +
        escape(row.proposedStages.join(', ')) +
        ' | ' +
        escape(row.review.mechanics) +
        ' |',
    );
  }
  lines.push('', 'Detailed mechanics, authored descriptions and all review dimensions are in the JSON export.', '');
  return lines.join('\n');
}

if (require.main === module) {
  const audit = report();
  if (process.argv.includes('--markdown')) process.stdout.write(markdown(audit));
  else if (process.argv.includes('--summary')) {
    console.log(
      'Monster attack read-only registry: ' +
        audit.totalVisualIdentities +
        ' VFX identities + ' +
        audit.additionalTrapKinds +
        ' trap kinds + ' +
        audit.additionalRecoveryActions +
        ' recovery actions',
    );
    console.log(audit.counts);
  } else process.stdout.write(JSON.stringify(audit, null, 2) + '\n');
}

module.exports = { report, markdown, sourceMechanic };
