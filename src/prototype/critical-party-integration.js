/* Stage 2 review-only party action integration. Never auto-installs. */
(function (root) {
  'use strict';
  const active = new WeakMap();
  const METHODS = [
    'event', 'cast', 'companionUseFirstSkill', 'resolveCompanionSecondSkill',
    'usePetSkill', 'rangerSupport', 'petDefensiveCounter', 'companionFight', 'updateParty',
  ];
  function install(Campaign, Critical, options = {}) {
    // With the feature disabled there are no prototype writes or RNG reads.
    if (options.enabled !== true) return Object.freeze({ installed: false });
    const proto = Campaign?.prototype;
    if (!proto || METHODS.some((name) => typeof proto[name] !== 'function'))
      throw Error('Critical party integration requires complete native action owners');
    if (active.has(proto)) throw Error('Critical party integration already installed');
    const Levels = options.levels ||
      (typeof require === 'function' ? require('./critical-levels.js') : root.PrototypeCriticalLevels);
    if (!Levels || typeof Levels.createTuning !== 'function')
      throw Error('Critical intensity authoring module missing');
    const tuning = options.tuning || Levels.createTuning();
    const resolver = Critical.createResolver({ enabled: true, stream: options.stream });
    const originals = Object.fromEntries(METHODS.map((name) => [name, proto[name]]));
    const current = new WeakMap();
    const MAX_OBSERVATIONS = 64;
    function state(game) {
      let s = current.get(game);
      if (!s) {
        s = { contexts: [], releases: [], sequence: 0 };
        current.set(game, s);
      }
      return s;
    }
    function record(game, key, source) {
      const original = resolver.release({ action: {}, key, domain: 'party', released: true });
      const group = key.startsWith('hero/') ? 'hero' : 'companion';
      const authored = tuning.effectFor(key, group, game.s?.mode || 'normal');
      if (!authored) throw Error('Critical action has no authored effect: ' + key);
      // Level is sampled at RELEASE: changing a developer dial cannot mutate
      // an already-released arrow/DoT or a delayed Radiant Cross pulse.
      const receipt = Object.freeze({
        ...original, group, intensity: authored.level,
        effect: original.critical ? authored : null,
      });
      const observation = Object.freeze({ ...receipt, source, sequence: ++state(game).sequence });
      const releases = state(game).releases;
      if (releases.length === MAX_OBSERVATIONS) releases.shift();
      releases.push(observation);
      return receipt;
    }
    function children(game, from, receipt) {
      if (!receipt || !Array.isArray(game.s?.projectiles)) return;
      // Projectiles and skill effects are transient and cleared by snapshot/zone travel.
      for (let i = from; i < game.s.projectiles.length; i++)
        game.s.projectiles[i].criticalExecution = receipt;
    }
    function releaseAfter(game, source, key, projectilesBefore, result) {
      if (result !== true) return result;
      const receipt = record(game, key, source);
      children(game, projectilesBefore, receipt);
      return result;
    }
    const wrappers = {};
    wrappers.event = function (type, data = {}) {
      const s = state(this), ctx = s.contexts[s.contexts.length - 1];
      // PR #439 emits heroSkillCast AFTER legal resource/cooldown commitment and
      // BEFORE immediate damage, projectiles or the delayed cross/hawk are built.
      if (ctx && ctx.kind === 'hero' && type === 'heroSkillCast' && !ctx.receipt) {
        const cls = data.class;
        if (cls === this.hero?.class && data.slot === ctx.slot &&
            Boolean(data.charged) === ctx.charged)
          ctx.receipt = record(this, 'hero/' + cls + '/' + (ctx.automatic ? 'auto' : ctx.slot + '-' + (ctx.charged ? 'charged' : 'tap')), 'hero');
      }
      return originals.event.call(this, type, data);
    };
    wrappers.cast = function (slot, targetId, charged = false, encounters = null, automatic = false) {
      const s = state(this), ctx = {
        kind: 'hero', slot, charged: Boolean(charged), automatic: Boolean(automatic), receipt: null,
        projectilesBefore: this.s?.projectiles?.length || 0,
        effectsBefore: this._heroSkillEffects?.length || 0,
      };
      s.contexts.push(ctx);
      try {
        const result = originals.cast.call(this, slot, targetId, charged, encounters, automatic);
        if (ctx.receipt) {
          children(this, ctx.projectilesBefore, ctx.receipt);
          for (let i = ctx.effectsBefore; i < (this._heroSkillEffects?.length || 0); i++)
            this._heroSkillEffects[i].criticalExecution = ctx.receipt;
        }
        return result;
      } finally {
        s.contexts.pop();
      }
    };
    wrappers.companionUseFirstSkill = function (unit, ...args) {
      const before = this.s.projectiles.length;
      const result = originals.companionUseFirstSkill.call(this, unit, ...args);
      // Pet path delegates to usePetSkill, which already owns its action.
      if (unit?.type === 'soldier' || unit?.type === 'archer')
        return releaseAfter(this, unit.id, 'troop/' + unit.type + '/first', before, result);
      return result;
    };
    wrappers.resolveCompanionSecondSkill = function (unit, ...args) {
      const before = this.s.projectiles.length;
      const result = originals.resolveCompanionSecondSkill.call(this, unit, ...args);
      if (unit?.type === 'soldier' || unit?.type === 'archer')
        return releaseAfter(this, unit.id, 'troop/' + unit.type + '/second', before, result);
      return result;
    };
    wrappers.usePetSkill = function (unit, target, slot, ...args) {
      const before = this.s.projectiles.length;
      const result = originals.usePetSkill.call(this, unit, target, slot, ...args);
      if (unit?.type === 'pet' && [1, 2].includes(slot))
        return releaseAfter(this, unit.id, 'pet/' + unit.petFamily + '/' + slot, before, result);
      return result;
    };
    wrappers.rangerSupport = function (type, ...args) {
      // The native rangerSupport cast selects the first eligible, unsilenced ranger.
      const ranger = this.availableRangers?.(type)?.find((u) => !this.mageSilenceActive(u));
      const before = this.s.projectiles.length;
      const result = originals.rangerSupport.call(this, type, ...args);
      if (ranger) return releaseAfter(this, ranger.id, 'troop/archer/' + (type === 'health' ? 'heal' : 'mana'), before, result);
      return result;
    };
    wrappers.petDefensiveCounter = function (unit, ...args) {
      const before = this.s.projectiles.length;
      const result = originals.petDefensiveCounter.call(this, unit, ...args);
      if (unit?.type === 'pet')
        return releaseAfter(this, unit.id, 'pet/' + unit.petFamily + '/basic', before, result);
      return result;
    };
    wrappers.companionFight = function (unit, ...args) {
      const s = state(this), since = s.sequence;
      const beforeCd = unit?.cd || 0, before = this.s.projectiles.length;
      const result = originals.companionFight.call(this, unit, ...args);
      const alreadyReleased = s.releases.some((o) => o.source === unit?.id && o.sequence > since);
      // Skill resolvers set their own cooldowns and receipts. Only a newly
      // committed ordinary basic with no intervening special gets this roll.
      if (unit && ['soldier', 'archer', 'pet'].includes(unit.type) &&
          beforeCd <= 0 && (unit.cd || 0) > 0 && !alreadyReleased) {
        const key = unit.type === 'pet' ? 'pet/' + unit.petFamily + '/basic' : 'troop/' + unit.type + '/basic';
        children(this, before, record(this, key, unit.id));
      }
      return result;
    };
    wrappers.updateParty = function (...args) {
      // Recall counters do not pass through companionFight. Detect only actual
      // combat events/projectile launches, not cooldown countdown or movement.
      const s = state(this), from = s.sequence;
      const shotFrom = this.s.projectiles.length, eventFrom = this.effects.length;
      const recall = Boolean(this.s.recallActive), beforeZone = this.zoneId;
      const result = originals.updateParty.call(this, ...args);
      if (!recall || !this.s.recallActive || beforeZone !== this.zoneId) return result;
      const newShots = this.s.projectiles.slice(shotFrom);
      const newMelees = this.effects.slice(eventFrom).filter(e => e.type === 'melee' && e.actor === 'companion');
      for (const u of this.s.party) {
        if (!['soldier', 'archer'].includes(u.type)) continue;
        if (s.releases.some(o => o.source === u.id && o.sequence > from)) continue;
        const shots = newShots.filter(p => p.source === u.id);
        const melee = newMelees.some(e => e.source === u.id);
        if (!shots.length && !melee) continue;
        const receipt = record(this, 'troop/' + u.type + '/basic', u.id);
        for (const shot of shots) shot.criticalExecution = receipt;
      }
      return result;
    };
    for (const method of METHODS) proto[method] = wrappers[method];
    const controller = Object.freeze({
      installed: true,
      releases(game) { return [...state(game).releases]; },
      criticalLevels() { return tuning.snapshot(); },
      setCriticalLevel(group, level, mode = 'normal') {
        return tuning.setLevel(group, level, mode);
      },
      uninstall() {
        for (const method of METHODS)
          if (proto[method] === wrappers[method]) proto[method] = originals[method];
        active.delete(proto);
      },
    });
    active.set(proto, controller);
    return controller;
  }
  const API = Object.freeze({ install });
  if (typeof module !== 'undefined') module.exports = API;
  else root.PrototypeCriticalPartyIntegration = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
