/* Stage 2: opt-in direct-owner party receipts. Not registered in the game script graph.
   The caller invokes release() at the real action commitment, before consequences,
   and passes the immutable receipt to ALL delayed/area/projectile descendants. */
(function (root) {
  'use strict';

  function createSession(Critical, Levels, options = {}) {
    if (!Critical || !Levels || typeof Critical.createResolver !== 'function' ||
        typeof Levels.createTuning !== 'function')
      throw Error('Native critical release requires both contract modules');
    if (options.enabled !== true)
      return Object.freeze({
        enabled: false,
        release() { return null; },
        enhance(_receipt, amount) { return amount; },
      });
    const resolver = Critical.createResolver({ enabled: true, stream: options.stream });
    const tuning = options.tuning || Levels.createTuning();
    function release(game, key, source) {
      const definition = Levels.ACTIONS[key];
      if (!definition || definition.group === 'world')
        throw Error('Unknown native party critical action: ' + key);
      if (!game?.s || typeof source !== 'string' || !source)
        throw Error('Native critical action requires campaign and performer');
      const group = definition.group;
      // A separate action identity is constructed ONCE at the release owner.
      // Never invoke this from projectile impact, Cross pulse, HoT tick or update.
      const sample = resolver.release({
        action: {}, key, domain: 'party', released: true,
        bonuses: { partyBonus: game.criticalPartyBonus?.(source) || 0 },
      });
      const intensity = tuning.effectFor(key, group, game.s.mode || 'normal');
      return Object.freeze({
        ...sample, source, group, intensity: intensity.level,
        effect: sample.critical ? intensity : null,
      });
    }
    return Object.freeze({
      enabled: true,
      release,
      enhance(receipt, amount, lever, bounds) {
        return Levels.enhanceExisting(receipt, amount, lever, bounds);
      },
      criticalLevels() { return tuning.snapshot(); },
      setCriticalLevel(group, level, mode) { return tuning.setLevel(group, level, mode); },
    });
  }

  // An explicit development/feature-gate attachment; never installed on a
  // normal Campaign implicitly. Both domains persist independent RNG state
  // in the existing v4 snapshot and never borrow Campaign.random().
  function attachCampaign(game, Critical, Levels, World, options = {}) {
    if (options.enabled !== true) return null;
    if (!game?.s || !Critical?.seededStream || !World?.createSession)
      throw Error('Critical campaign attachment needs live Campaign and contracts');
    if (game._criticalPartyNative?.enabled || game._criticalWorldNative?.enabled)
      throw Error('Critical sessions already attached');
    const seeds = game.s.criticalStreams || {
      party: options.partySeed ?? 0x3c6ef372,
      world: options.worldSeed ?? 0xa54ff53a,
    };
    // Validate through the same isolated stream constructor used for rolls.
    const party = Critical.seededStream(seeds.party);
    const world = Critical.seededStream(seeds.world);
    game.s.criticalStreams = { party: party.snapshot(), world: world.snapshot() };
    function persistent(domain, stream) {
      return {
        next() {
          const value = stream.next();
          game.s.criticalStreams[domain] = stream.snapshot();
          return value;
        },
      };
    }
    const partySession = createSession(Critical, Levels, {
      enabled: true, stream: persistent('party', party),
    });
    const worldSession = World.createSession(Critical, Levels, {
      enabled: true, stream: persistent('world', world),
    });
    game._criticalPartyNative = partySession;
    game._criticalWorldNative = worldSession;
    return Object.freeze({ party: partySession, world: worldSession });
  }
  const API = Object.freeze({ createSession, attachCampaign });
  if (typeof module !== 'undefined') module.exports = API;
  else root.PrototypeCriticalPartyNative = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
