/* Opt-in roster/progression foundation. Never installs methods on Campaign. */
(function (root) {
  'use strict';
  const sharedFields = ['gold', 'potions', 'tonicStock', 'weapon', 'armorTier', 'reforges'];
  function copy(value, seen = new Map()) {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    const result =
      value instanceof Map
        ? new Map()
        : value instanceof Set
          ? new Set()
          : Array.isArray(value)
            ? []
            : Object.create(Object.getPrototypeOf(value));
    seen.set(value, result);
    if (value instanceof Map)
      for (const [key, item] of value) result.set(copy(key, seen), copy(item, seen));
    else if (value instanceof Set) for (const item of value) result.add(copy(item, seen));
    else for (const key of Object.keys(value)) result[key] = copy(value[key], seen);
    return result;
  }
  function recommendCompanion(classes, random = Math.random) {
    if (
      !Array.isArray(classes) ||
      classes.length !== 2 ||
      classes.some((c) => !['paladin', 'mage', 'ranger'].includes(c))
    )
      throw Error('Two valid hero classes required');
    if (!classes.includes('paladin')) return 'soldier';
    if (classes.every((c) => c === 'paladin')) return 'archer';
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw Error('Invalid random value');
    return roll < 0.5 ? 'soldier' : 'archer';
  }
  function create({ Campaign, source, hostId = 'host' }) {
    if (!(source instanceof Campaign) || typeof hostId !== 'string' || !hostId.trim())
      throw Error('A campaign and host identity are required');
    // Copy live state rather than using the continuation-save serializer, which
    // deliberately drops projectiles/hazards and repairs enemy combat state.
    const campaign = copy(source),
      team = {};
    for (const key of sharedFields) team[key] = campaign.hero[key];
    const characters = new Map(),
      host = campaign.hero;
    let connectedGuest = null,
      closed = false;
    function bindShared(actor) {
      for (const key of sharedFields)
        Object.defineProperty(actor, key, {
          configurable: true,
          enumerable: true,
          get: () => team[key],
          set: (value) => {
            team[key] = value;
          },
        });
    }
    bindShared(host);
    characters.set(hostId, host);
    function ensureOpen() {
      if (closed) throw Error('Session foundation is closed');
    }
    function player(id) {
      if (id !== hostId && id !== connectedGuest) return null;
      return characters.get(id) || null;
    }
    function slots() {
      return {
        capacity: campaign.expeditionPartyCap(),
        occupied: campaign.activeParty().length + (connectedGuest ? 1 : 0),
        humanCompanions: connectedGuest ? 1 : 0,
      };
    }
    function join({ playerId, heroClass }) {
      ensureOpen();
      if (
        typeof playerId !== 'string' ||
        !playerId.trim() ||
        playerId === hostId ||
        !Object.hasOwn(Campaign.classes, heroClass)
      )
        return { ok: false, reason: 'invalid-player' };
      if (connectedGuest) return { ok: false, reason: 'guest-already-connected' };
      if (
        campaign.s.challenge.succession ||
        campaign.s.challenge.pending ||
        campaign.s.challenge.gameOver ||
        host.hp <= 0
      )
        return { ok: false, reason: 'campaign-unavailable' };
      if (slots().occupied >= slots().capacity)
        return { ok: false, reason: 'companion-slot-required' };
      let actor = characters.get(playerId);
      if (actor && actor.class !== heroClass)
        return { ok: false, reason: 'character-class-mismatch' };
      if (!actor) {
        actor = new Campaign(campaign.s.mode, heroClass, () => 0.5).hero;
        actor.id = 'cooperative-' + encodeURIComponent(playerId);
        bindShared(actor);
        characters.set(playerId, actor);
      }
      if (actor.hp <= 0) return { ok: false, reason: 'character-unavailable' };
      Object.assign(actor, campaign.safe(host.x + 40, host.y + 30));
      actor.order = null;
      actor.path = [];
      connectedGuest = playerId;
      return { ok: true, playerId };
    }
    function leave(playerId) {
      ensureOpen();
      if (playerId !== connectedGuest) return false;
      const actor = characters.get(playerId);
      actor.order = null;
      actor.path = [];
      connectedGuest = null;
      return true;
    }
    function restCompanion(playerId, companionId) {
      ensureOpen();
      return playerId === hostId && campaign.restCompanion(companionId);
    }
    function activateCompanion(playerId, companionId, barracksId) {
      ensureOpen();
      if (playerId !== hostId || slots().occupied >= slots().capacity) return false;
      return campaign.activateCompanion(companionId, barracksId);
    }
    function awardExperience(playerId, amount) {
      ensureOpen();
      const actor = player(playerId);
      if (
        !actor ||
        !Number.isSafeInteger(amount) ||
        amount < 0 ||
        amount > 1000000 ||
        !Number.isSafeInteger(actor.xp + amount)
      )
        return false;
      const context = Object.create(campaign);
      context.s = { ...campaign.s, hero: actor };
      // Guest levels must not resize/reheal the host's shared AI companions.
      context.syncCompanionLevelStats = () => {};
      context.event = (type, data) => campaign.event(type, { ...data, playerId });
      context.say = (...args) => campaign.say(...args);
      context.notice = (...args) => campaign.notice(...args);
      context.xp(amount);
      if (playerId === hostId) campaign.syncCompanionLevelStats();
      return true;
    }
    function spend(playerId, amount) {
      ensureOpen();
      return !!player(playerId) && campaign.spend(amount);
    }
    // This roster is intentionally not yet a two-actor combat simulator or v4
    // save. Fail explicitly instead of accidentally running one-hero rules.
    campaign.tick = () => {
      throw Error('Cooperative combat simulation is not implemented');
    };
    campaign.snapshot = () => {
      throw Error('Cooperative persistence is not implemented');
    };
    function finishSolo() {
      ensureOpen();
      if (connectedGuest) throw Error('Guest must leave before returning to single-player');
      for (const key of sharedFields)
        Object.defineProperty(host, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: copy(team[key]),
        });
      delete campaign.tick;
      delete campaign.snapshot;
      closed = true;
      return campaign;
    }
    return {
      campaign,
      team,
      join,
      leave,
      slots,
      restCompanion,
      activateCompanion,
      awardExperience,
      spend,
      finishSolo,
      get mode() {
        return connectedGuest ? 'cooperative' : 'single-player';
      },
      get hostId() {
        return hostId;
      },
      get guestId() {
        return connectedGuest;
      },
      character(playerId) {
        return copy(characters.get(playerId) || null);
      },
      connectedCharacter(playerId) {
        return copy(player(playerId));
      },
    };
  }
  const api = { create, recommendCompanion };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeCooperative = api;
})(typeof window !== 'undefined' ? window : globalThis);
