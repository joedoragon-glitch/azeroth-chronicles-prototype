/* Visual-only enemy-skill identity and replacement contract. No combat state or drawing. */
(function (root) {
  'use strict';

  const STAGES = Object.freeze([
    'windup',
    'release',
    'travel',
    'impact',
    'linger',
    'spawn',
    'phase',
  ]);
  const STAGE_SET = new Set(STAGES);
  const safePart = (value) =>
    typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value) ? value : null;
  const plain = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const nonNegative = (value) => Number.isFinite(value) && value >= 0;

  function tierOf(enemy) {
    if (enemy.type === 'boss') return 'boss';
    if (enemy.captain || enemy.roomCaptain) return 'captain';
    if (enemy.form === 'ringleader') return 'ringleader';
    if (enemy.guard) return 'guardian';
    return 'ordinary';
  }

  // IDs are not labels: localization and changing a skill's display name must
  // never invalidate its visual assets. Indexes are the authored attack slots.
  // TRUE shares the base ID and optionally overrides stages in the manifest.
  function describe(enemy, attack) {
    if (!plain(enemy) || !plain(attack)) return null;
    const tier = tierOf(enemy),
      role = enemy.ranged ? 'ranged' : 'melee',
      family = safePart(enemy.family),
      species = safePart(enemy.species),
      captain = safePart(enemy.captainProfile),
      index = Number.isInteger(attack.index) && attack.index >= 0 ? attack.index : null;
    let id;
    if (attack.rogueMove) {
      const category =
        tier === 'boss'
          ? family && 'boss/' + family
          : tier === 'captain'
            ? captain && 'captain/' + captain
            : (species && tier + '/' + role + '/' + species) || null;
      if (!category) return null;
      id = 'rogue/' + category + '/' + (attack.rogueSignature ? 'signature' : 'basic');
    } else if (safePart(attack.nightSkill) && species) {
      id = 'night/' + species + '/' + attack.nightSkill;
    } else if (tier === 'boss' && family && index !== null) {
      id = 'boss/' + family + '/' + index;
    } else if (tier === 'captain' && captain && index !== null) {
      id = 'captain/' + captain + '/' + index;
    } else if (species && safePart(attack.kind)) {
      id = 'enemy/' + species + '/' + attack.kind;
    } else return null;
    return Object.freeze({
      id,
      tier,
      role,
      variant: tier === 'boss' && enemy.form === 'true' ? 'true' : 'normal',
      kind: safePart(attack.kind) || 'unknown',
      // Identity is intentionally independent of coordinates, range, damage,
      // warning timer, RNG, names, cooldowns, aggro, and save data.
    });
  }

  function projectile(enemy, shot) {
    if (!plain(shot)) return null;
    const species = safePart(shot.species) || (enemy && safePart(enemy.species));
    const style = safePart(shot.style);
    if (!species || !style) return null;
    return Object.freeze({
      id: 'projectile/' + species + '/' + style,
      tier: enemy ? tierOf(enemy) : 'ordinary',
      role: 'ranged',
      variant: enemy && enemy.type === 'boss' && enemy.form === 'true' ? 'true' : 'normal',
      kind: 'projectile',
    });
  }

  function validAsset(asset) {
    if (!plain(asset) || !['image', 'spritesheet'].includes(asset.type)) return false;
    if (
      typeof asset.src !== 'string' ||
      !/^assets\/vfx\/[a-zA-Z0-9/_-]+\.(png|webp)$/.test(asset.src) ||
      asset.src.includes('..') ||
      asset.src.length > 180
    )
      return false;
    if (
      asset.anchor !== undefined &&
      (!plain(asset.anchor) ||
        !nonNegative(asset.anchor.x) ||
        asset.anchor.x > 1 ||
        !nonNegative(asset.anchor.y) ||
        asset.anchor.y > 1)
    )
      return false;
    if (
      asset.scale !== undefined &&
      (!Number.isFinite(asset.scale) || asset.scale <= 0 || asset.scale > 4)
    )
      return false;
    if (asset.type === 'image') {
      return (
        asset.frames === undefined &&
        asset.fps === undefined &&
        asset.frameWidth === undefined &&
        asset.frameHeight === undefined
      );
    }
    return (
      Number.isInteger(asset.frames) &&
      asset.frames >= 2 &&
      asset.frames <= 48 &&
      Number.isFinite(asset.fps) &&
      asset.fps >= 1 &&
      asset.fps <= 30 &&
      Number.isInteger(asset.frameWidth) &&
      asset.frameWidth >= 1 &&
      asset.frameWidth <= 1024 &&
      Number.isInteger(asset.frameHeight) &&
      asset.frameHeight >= 1 &&
      asset.frameHeight <= 1024 &&
      (asset.loop === undefined || typeof asset.loop === 'boolean')
    );
  }

  function validateManifest(manifest) {
    const problems = [];
    if (!plain(manifest) || manifest.version !== 1 || !plain(manifest.effects))
      return ['Expected v1 VFX manifest with an effects object'];
    const checkStages = (stages, name) => {
      if (!plain(stages)) {
        problems.push(name + ': stages must be an object');
        return;
      }
      for (const [stage, asset] of Object.entries(stages)) {
        if (!STAGE_SET.has(stage)) problems.push(name + ': unknown stage ' + stage);
        else if (!validAsset(asset)) problems.push(name + ': invalid ' + stage + ' asset');
      }
    };
    for (const [id, entry] of Object.entries(manifest.effects)) {
      if (
        !/^(boss|captain|night|rogue|enemy|projectile)\/[a-z0-9/-]+$/.test(id) ||
        id.includes('//')
      )
        problems.push('Invalid VFX identity: ' + id);
      if (!plain(entry)) {
        problems.push(id + ': entry must be an object');
        continue;
      }
      checkStages(entry.stages === undefined ? {} : entry.stages, id);
      if (entry.variants !== undefined) {
        if (!plain(entry.variants)) problems.push(id + ': invalid variants');
        else
          for (const [variant, stages] of Object.entries(entry.variants)) {
            if (variant !== 'true') problems.push(id + ': unknown variant ' + variant);
            else checkStages(stages, id + ':true');
          }
      }
    }
    return problems;
  }

  // The caller continues drawing the existing procedural visual unless a
  // reviewed, valid asset exists for THIS exact stage. Partial replacements
  // never hide unconverted warnings, hit regions, or other effects.
  function select(manifest, identity, stage) {
    const fallback = Object.freeze({
      mode: 'procedural',
      id: identity?.id || null,
      stage,
    });
    if (!identity || !STAGE_SET.has(stage)) return fallback;
    if (validateManifest(manifest).length) return fallback;
    const entry = manifest.effects[identity.id];
    const chosen =
      (identity.variant === 'true' && entry?.variants?.true?.[stage]) ||
      entry?.stages?.[stage];
    if (!validAsset(chosen)) return fallback;
    return Object.freeze({ mode: chosen.type, id: identity.id, stage, asset: chosen });
  }

  const api = Object.freeze({
    STAGES,
    tierOf,
    describe,
    projectile,
    validAsset,
    validateManifest,
    select,
  });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeEnemyVfx = api;
})(typeof window !== 'undefined' ? window : globalThis);
