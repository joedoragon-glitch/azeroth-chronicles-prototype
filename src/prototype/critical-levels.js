/* Critical effect INTENSITY, not critical hit probability. Optional authoring layer.
   No auto-installation and no mutation of Campaign, renderers, or saves. */
(function (root) {
  'use strict';

  const GROUPS = Object.freeze(['hero', 'companion', 'world']);
  const MODES = Object.freeze(['normal', 'nightmare', 'developer']);
  const DEFAULT_LEVELS = Object.freeze({ hero: 1, companion: 1, world: 1 });
  // A lever changes only an existing action outcome; none changes hit geometry,
  // attack count, recovery, collision, AI, cooldown or immunity. These initial
  // authoring figures are candidates, NOT native gameplay balance evidence.
  const LEVERS = Object.freeze({
    damage: Object.freeze({ operation: 'multiply', values: Object.freeze([1.08, 1.20, 1.40]) }),
    healAmount: Object.freeze({ operation: 'multiply', values: Object.freeze([1.10, 1.25, 1.45]) }),
    slowDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.20, 0.50, 1.00]) }),
    weakenDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.20, 0.50, 1.00]) }),
    vulnerabilityDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.20, 0.50, 1.00]) }),
    tauntDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.20, 0.50, 1.00]) }),
    silenceDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.15, 0.35, 0.65]) }),
    hasteDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.30, 0.75, 1.40]) }),
    wardDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.30, 0.75, 1.40]) }),
    wardStrength: Object.freeze({ operation: 'addFraction', values: Object.freeze([0.015, 0.035, 0.060]) }),
    pushDistance: Object.freeze({ operation: 'multiply', values: Object.freeze([1.08, 1.18, 1.30]) }),
    retreatLockDuration: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.20, 0.50, 1.00]) }),
    cooldownDebt: Object.freeze({ operation: 'addSeconds', values: Object.freeze([0.20, 0.50, 0.90]) }),
    summonVitality: Object.freeze({ operation: 'multiply', values: Object.freeze([1.05, 1.15, 1.30]) }),
  });
  const registry = Object.create(null);
  function register(key, group, lever) {
    if (registry[key] || !GROUPS.includes(group) || !LEVERS[lever])
      throw Error('Invalid or duplicate critical-effect authoring key: ' + key);
    registry[key] = Object.freeze({ key, group, lever });
  }
  // Index is Skill 1...8, with tap then charged. Each is explicitly assigned
  // an existing consequence, not a universal double-damage fallback.
  const heroSkills = Object.freeze({
    paladin: [
      ['damage', 'damage'], ['weakenDuration', 'weakenDuration'],
      ['wardStrength', 'pushDistance'], ['tauntDuration', 'tauntDuration'],
      ['damage', 'weakenDuration'], ['damage', 'pushDistance'],
      ['damage', 'weakenDuration'], ['healAmount', 'wardDuration'],
    ],
    mage: [
      ['damage', 'damage'], ['slowDuration', 'slowDuration'],
      ['damage', 'silenceDuration'], ['vulnerabilityDuration', 'vulnerabilityDuration'],
      ['pushDistance', 'pushDistance'], ['slowDuration', 'slowDuration'],
      ['damage', 'damage'], ['damage', 'vulnerabilityDuration'],
    ],
    ranger: [
      ['damage', 'retreatLockDuration'], ['slowDuration', 'slowDuration'],
      ['healAmount', 'healAmount'], ['hasteDuration', 'hasteDuration'],
      ['damage', 'slowDuration'], ['pushDistance', 'pushDistance'],
      ['damage', 'slowDuration'], ['damage', 'damage'],
    ],
  });
  for (const [cls, skills] of Object.entries(heroSkills)) {
    register('hero/' + cls + '/auto', 'hero', 'damage');
    skills.forEach(([tap, charged], index) => {
      register('hero/' + cls + '/' + (index + 1) + '-tap', 'hero', tap);
      register('hero/' + cls + '/' + (index + 1) + '-charged', 'hero', charged);
    });
  }
  const troops = Object.freeze({
    soldier: Object.freeze({ basic: 'damage', first: 'damage', second: 'damage' }),
    archer: Object.freeze({ basic: 'damage', first: 'slowDuration', second: 'damage', heal: 'healAmount', mana: 'healAmount' }),
  });
  for (const [type, entries] of Object.entries(troops))
    for (const [slot, lever] of Object.entries(entries))
      register('troop/' + type + '/' + slot, 'companion', lever);

  // Pet basic + two first/second skills. Legacy pet families use the native ids.
  const pets = Object.freeze({
    thorn: ['damage', 'damage', 'slowDuration'],
    crypt: ['damage', 'healAmount', 'slowDuration'],
    mire: ['damage', 'slowDuration', 'damage'],
    archive: ['damage', 'damage', 'slowDuration'],
    ridge: ['damage', 'damage', 'damage'],
    mine: ['damage', 'wardDuration', 'slowDuration'],
    warlord: ['damage', 'damage', 'damage'],
    abyss: ['damage', 'damage', 'slowDuration'],
    citadel: ['damage', 'damage', 'slowDuration'],
    cindermaw: ['damage', 'damage', 'wardDuration'],
    darklord: ['damage', 'damage', 'damage'],
  });
  for (const [family, levers] of Object.entries(pets))
    ['basic', '1', '2'].forEach((slot, index) =>
      register('pet/' + family + '/' + slot, 'companion', levers[index]));

  // World keys are intentionally a Stage 3 integration problem. The global
  // world intensity dial exists now; unknown moves FAIL CLOSED (no effect).
  // Never silently give every monster a default damage multiplier.
  Object.freeze(registry);

  function validatedLevel(level) {
    if (!Number.isInteger(level) || level < 1 || level > 3)
      throw Error('Critical intensity must be integer Level 1, 2 or 3');
    return level;
  }
  function validatedGroup(group) {
    if (!GROUPS.includes(group)) throw Error('Unknown critical intensity group');
    return group;
  }
  function validatedMode(mode) {
    if (!MODES.includes(mode)) throw Error('Unknown critical intensity mode');
    return mode;
  }

  function createTuning(initial = {}) {
    const base = { ...DEFAULT_LEVELS };
    const modes = { nightmare: Object.create(null), developer: Object.create(null) };
    if (initial === null || typeof initial !== 'object' || Array.isArray(initial))
      throw Error('Invalid critical intensity configuration');
    for (const key of Object.keys(initial)) {
      if (GROUPS.includes(key)) base[key] = validatedLevel(initial[key]);
      else if (key === 'modes') {
        for (const [mode, entries] of Object.entries(initial.modes || {})) {
          if (mode === 'normal') throw Error('Normal uses base critical levels');
          validatedMode(mode);
          if (!entries || typeof entries !== 'object' || Array.isArray(entries))
            throw Error('Invalid mode critical levels');
          for (const [group, level] of Object.entries(entries)) {
            validatedGroup(group);
            modes[mode][group] = validatedLevel(level);
          }
        }
      } else throw Error('Unknown critical intensity configuration key');
    }
    function getLevel(group, mode = 'normal') {
      validatedGroup(group);
      validatedMode(mode);
      return mode !== 'normal' && modes[mode][group] !== undefined
        ? modes[mode][group] : base[group];
    }
    function setLevel(group, level, mode = 'normal') {
      validatedGroup(group);
      validatedMode(mode);
      validatedLevel(level);
      if (mode === 'normal') base[group] = level;
      else modes[mode][group] = level;
      return level;
    }
    function clearModeLevel(group, mode) {
      validatedGroup(group);
      validatedMode(mode);
      if (mode === 'normal') throw Error('Cannot clear normal base critical level');
      delete modes[mode][group];
    }
    function snapshot() {
      return Object.freeze({
        hero: base.hero, companion: base.companion, world: base.world,
        modes: Object.freeze({
          nightmare: Object.freeze({ ...modes.nightmare }),
          developer: Object.freeze({ ...modes.developer }),
        }),
      });
    }
    function effectFor(key, group, mode = 'normal') {
      validatedGroup(group);
      validatedMode(mode);
      const def = registry[key];
      if (!def) return null; // no generic fallback
      if (def.group !== group) throw Error('Critical intensity action/group mismatch');
      const level = getLevel(group, mode);
      const rule = LEVERS[def.lever];
      return Object.freeze({
        key, group, level, lever: def.lever, operation: rule.operation,
        value: rule.values[level - 1],
      });
    }
    return Object.freeze({ getLevel, setLevel, clearModeLevel, effectFor, snapshot });
  }

  function enhanceExisting(receipt, current, lever, bounds = {}) {
    if (!receipt?.critical || !receipt.effect) return current;
    const effect = receipt.effect;
    if (effect.lever !== lever) throw Error('Critical effect applied to wrong action consequence');
    if (!Number.isFinite(current) || current < 0) throw Error('Invalid existing action consequence');
    const proposed = effect.operation === 'multiply' ? current * effect.value : current + effect.value;
    if (!Number.isFinite(proposed)) throw Error('Critical enhancement overflow');
    const min = bounds.min === undefined ? 0 : bounds.min;
    const max = bounds.max === undefined ? Infinity : bounds.max;
    if (!Number.isFinite(min) || max < min || Number.isNaN(max))
      throw Error('Invalid critical consequence bounds');
    return Math.max(min, Math.min(max, proposed));
  }

  const API = Object.freeze({
    GROUPS, MODES, DEFAULT_LEVELS, LEVERS, ACTIONS: registry,
    createTuning, enhanceExisting,
  });
  if (typeof module !== 'undefined') module.exports = API;
  else root.PrototypeCriticalLevels = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
