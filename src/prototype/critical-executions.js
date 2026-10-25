/* Stage 1 dormant critical-execution contract. No combat owner imports this yet. */
(function (root) {
  'use strict';

  // Separate domains deliberately have separate immutable starting values.
  // Do not replace them with a shared mutable "all actors" setting.
  const BASE_CHANCE = Object.freeze({ party: 0.10, world: 0.10 });

  function boundedChance(chance) {
    if (!Number.isFinite(chance)) throw Error('Invalid critical chance');
    return Math.max(0, Math.min(1, chance));
  }

  function chanceFor(domain, bonuses = {}) {
    if (domain !== 'party' && domain !== 'world') throw Error('Unknown critical domain');
    const partyBonus = bonuses.partyBonus ?? 0;
    const worldModifier = bonuses.worldModifier ?? 0;
    if (!Number.isFinite(partyBonus) || !Number.isFinite(worldModifier))
      throw Error('Invalid critical bonus');
    // Only the domain's own modifier counts. No hero book bonus on monsters,
    // and no hypothetical world/night modifier on the party.
    return boundedChance(
      BASE_CHANCE[domain] + (domain === 'party' ? partyBonus : worldModifier),
    );
  }

  // Isolated reproducible source for test/integration. This module never
  // borrows Campaign.random: adding criticals must not shift world RNG rolls.
  // No save format or campaign seed is chosen here; Stage 5 owns persistence.
  function seededStream(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw Error('Invalid critical seed');
    let state = seed >>> 0;
    return Object.freeze({
      next() {
        state = (state + 0x6d2b79f5) >>> 0;
        let x = state;
        x = Math.imul(x ^ (x >>> 15), x | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      },
      snapshot() {
        return state;
      },
      restore(nextState) {
        if (!Number.isInteger(nextState) || nextState < 0 || nextState > 0xffffffff)
          throw Error('Invalid critical stream state');
        state = nextState >>> 0;
      },
    });
  }

  function createResolver({ enabled = false, stream = null } = {}) {
    if (typeof enabled !== 'boolean') throw Error('Invalid critical feature gate');
    if (enabled && (!stream || typeof stream.next !== 'function'))
      throw Error('Enabled critical resolver needs an isolated random stream');
    // Weak keys avoid retaining already-resolved actions; callers propagate the
    // returned receipt to missiles/ticks instead of calling release again.
    const resolved = new WeakMap();
    return Object.freeze({
      enabled,
      release({ action, key, domain, released = false, bonuses } = {}) {
        // The production integration has NO call site in Stage 1. The default
        // resolver does not inspect actors, allocate receipts, or consume RNG.
        if (!enabled || released !== true) return null;
        if (!action || typeof action !== 'object' || !key || typeof key !== 'string')
          throw Error('Critical release needs action identity and key');
        if (domain !== 'party' && domain !== 'world')
          throw Error('Critical release needs an explicit actor domain');
        const prior = resolved.get(action);
        if (prior) {
          if (prior.key !== key || prior.domain !== domain)
            throw Error('Action critical identity changed after release');
          return prior;
        }
        const chance = chanceFor(domain, bonuses);
        const roll = stream.next();
        if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
          throw Error('Invalid critical random sample');
        const receipt = Object.freeze({ key, domain, chance, critical: roll < chance });
        resolved.set(action, receipt);
        return receipt;
      },
    });
  }

  const CriticalExecutions = Object.freeze({ BASE_CHANCE, chanceFor, seededStream, createResolver });
  if (typeof module !== 'undefined') module.exports = CriticalExecutions;
  else root.PrototypeCriticalExecutions = CriticalExecutions;
})(typeof globalThis !== 'undefined' ? globalThis : this);
