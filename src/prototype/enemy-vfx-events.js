/* Observation-only combat bridge. Metadata lives in WeakMaps, never campaign saves. */
(function (root) {
  'use strict';
  const V = root.PrototypeEnemyVfx || require('./enemy-vfx.js');
  const P = root.PrototypeEnemyPresentation || require('./enemy-presentation.js');
  const state = new WeakMap();
  const durations = Object.freeze({
    windup: 0,
    release: 0.38,
    impact: 0.42,
    spawn: 0.65,
    phase: 0.8,
  });
  const geometryFields = [
    'x',
    'y',
    'fromX',
    'fromY',
    'angle',
    'radius',
    'count',
    'charge',
    'landing',
    'advance',
    'persistent',
    'nightSkill',
    'rogueMove',
    'rogueSignature',
    'effect',
    'style',
    'kind',
  ];
  function store(game) {
    let s = state.get(game);
    if (!s) {
      s = {
        serial: 0,
        seen: new WeakMap(),
        projectiles: new WeakMap(),
        hazards: new WeakMap(),
        context: null,
      };
      state.set(game, s);
    }
    return s;
  }
  function geometry(a) {
    return Object.freeze(
      Object.fromEntries(
        geometryFields
          .filter((k) => ['string', 'boolean'].includes(typeof a[k]) || Number.isFinite(a[k]))
          .map((k) => [k, a[k]]),
      ),
    );
  }
  function emit(game, e, a, stage, point = null, identity = null) {
    if (game.enemyVfxEnabled === false || !e || e.hp <= 0) return null;
    const visual =
      identity ||
      (stage === 'phase'
        ? Object.freeze({
            id: 'captain/' + e.captainProfile + '/phase',
            tier: 'captain',
            role: e.ranged ? 'ranged' : 'melee',
            variant: 'normal',
            kind: a.kind,
            presentation: P.profile(e, a),
          })
        : V.describe(e, a));
    if (!visual) return null;
    const s = store(game),
      seen = s.seen.get(a) || new Set(),
      key = e.id + ':' + stage + ':' + (point?.target || '');
    if (seen.has(key)) return null;
    const x =
        point?.x ??
        (stage === 'release' || stage === 'windup' || stage === 'phase' ? e.x : (a.x ?? e.x)),
      y =
        point?.y ??
        (stage === 'release' || stage === 'windup' || stage === 'phase' ? e.y : (a.y ?? e.y));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const event = Object.freeze({
      type: 'enemyVfx',
      eventId: ++s.serial,
      zone: game.zoneId,
      at: game.s.time,
      source: e.id,
      sourceX: e.x,
      sourceY: e.y,
      family: e.family,
      species: e.species,
      profile: e.captainProfile,
      identity: visual,
      skillId: visual.id,
      actorId: e.id,
      actor: 'enemy',
      tier: visual.tier,
      role: visual.role,
      variant: visual.variant,
      style: a.style || e.projectileStyle,
      stage,
      contact: stage === 'impact' && !!(point?.target || point?.contact),
      dangerous:
        ['windup', 'release', 'travel', 'impact', 'linger'].includes(stage) &&
        a.kind !== 'summon' &&
        a.coefficient !== 0,
      geometry: geometry(a),
      x,
      y,
      target: point?.target,
      duration: durations[stage] || 0.38,
    });
    // Deliberately bypass event(): combat statistics and v4 snapshots stay identical.
    if (game.effects.filter((f) => f.type === 'enemyVfx').length >= 120) return null;
    seen.add(key);
    s.seen.set(a, seen);
    game.effects.push(event);
    return event;
  }
  function bindNew(game, e, a, beforeShots, beforeHazards) {
    if (game.enemyVfxEnabled === false) return;
    const s = store(game),
      identity = V.describe(e, a);
    for (const p of game.s.projectiles)
      if (!beforeShots.has(p) && p.sourceId === e.id) s.projectiles.set(p, { e, a, identity });
    for (const h of game.s.hazards) if (!beforeHazards.has(h)) s.hazards.set(h, { e, a, identity });
  }
  function install(Campaign) {
    const proto = Campaign.prototype;
    const wrap = (name, observe) => {
      const original = proto[name];
      if (typeof original === 'function')
        Object.defineProperty(proto, name, {
          configurable: true,
          writable: true,
          value: function (...args) {
            return observe.call(this, original, args);
          },
        });
    };
    // Decorate only the transient queue AFTER original event statistics are recorded.
    // Audio deduplication therefore cannot alter snapshots or gameplay diagnostics.
    wrap('event', function (original, [type, details = {}]) {
      const result = original.call(this, type, details),
        legacy = this.effects.at(-1);
      if (
        this.enemyVfxEnabled === false ||
        ![
          'warning',
          'captainPhase',
          'captainSummon',
          'melee',
          'projectileLaunch',
          'projectileImpact',
        ].includes(type)
      )
        return result;
      const s = store(this),
        context = s.context,
        e =
          context?.e ||
          this.zone().enemies.find(
            (u) =>
              (details.source && u.id === details.source) ||
              (type === 'warning' &&
                u.telegraph &&
                ((details.captain && u.captainProfile === details.captain) ||
                  (details.family &&
                    (u.family === details.family || u.species === details.family)) ||
                  (!details.family &&
                    !details.captain &&
                    !s.seen.get(u.telegraph)?.has(u.id + ':windup:')))),
          );
      if (!e) return result;
      const a = type === 'warning' ? e.telegraph : context?.a || e.telegraph;
      if (type === 'warning' && a) {
        const delivered = emit(this, e, a, 'windup');
        if (V.describe(e, a)?.presentation && (delivered || s.seen.get(a)?.has(e.id + ':windup:')))
          legacy.presentationHandled = true;
      } else if (['captainPhase', 'captainSummon'].includes(type) && context) {
        legacy.presentationHandled = true;
      } else if (type === 'melee' && context?.a) {
        legacy.presentationHandled = true;
      } else if (type === 'projectileLaunch' && details.actor === 'enemy') {
        if (context?.a) legacy.presentationHandled = true;
        else {
          const shots = this.s.projectiles.filter(
            (p) => p.sourceId === e.id && !s.projectiles.has(p),
          );
          for (const p of shots) {
            const plan = { kind: 'projectile', style: p.style },
              identity = V.projectile(e, p);
            s.projectiles.set(p, { e, a: plan, identity });
            if (emit(this, e, plan, 'release', null, identity)) legacy.presentationHandled = true;
          }
        }
      } else if (
        type === 'projectileImpact' &&
        details.actor === 'enemy' &&
        s.lastProjectileContact
      ) {
        const p = s.lastProjectileContact;
        if (p.sourceId === details.source && p.x === details.x && p.y === details.y)
          legacy.presentationHandled = true;
        s.lastProjectileContact = null;
      }
      return result;
    });
    for (const name of [
      'startAttack',
      'startCaptainAttack',
      'startNightSkill',
      'tacticalRogueMove',
    ])
      wrap(name, function (original, args) {
        const s = store(this),
          old = s.context;
        s.context = { e: args[0] };
        try {
          return original.apply(this, args);
        } finally {
          s.context = old;
        }
      });
    wrap('resolveAttack', function (original, [e]) {
      const a = e.telegraph;
      if (!a || this.enemyVfxEnabled === false || e.hp <= 0) return original.call(this, e);
      const s = store(this),
        old = s.context,
        shots = new Set(this.s.projectiles),
        hazards = new Set(this.s.hazards);
      emit(this, e, a, 'release');
      s.context = { e, a };
      try {
        return original.call(this, e);
      } finally {
        bindNew(this, e, a, shots, hazards);
        s.context = old;
      }
    });
    wrap('resolveArea', function (original, [e, a]) {
      const s = store(this),
        old = s.context,
        hazards = new Set(this.s.hazards);
      // A ground payoff belongs to the real resolved footprint, even on a miss.
      emit(this, e, a, 'impact');
      s.context = { e, a };
      try {
        return original.call(this, e, a);
      } finally {
        bindNew(this, e, a, new Set(this.s.projectiles), hazards);
        s.context = old;
      }
    });
    wrap('advanceMotion', function (original, [e, dt]) {
      const a = e.motion,
        s = store(this),
        old = s.context;
      if (a) s.context = { e, a };
      try {
        return original.call(this, e, dt);
      } finally {
        if (a && !e.motion && !a.landing) emit(this, e, a, 'impact', { x: e.x, y: e.y });
        s.context = old;
      }
    });
    wrap('hitParty', function (original, args) {
      const u = args[0],
        point = { x: u.x, y: u.y, target: u === this.hero ? 'hero' : u.id },
        s = store(this),
        context = s.context,
        zone = this.zoneId,
        hero = this.hero;
      const result = original.apply(this, args);
      if (result && context && this.zoneId === zone && this.hero === hero)
        emit(this, context.e, context.a, 'impact', point, context.identity);
      return result;
    });
    for (const method of ['summonBossAdds', 'summonCaptainAdds'])
      wrap(method, function (original, args) {
        const e = args[0],
          before = new Set(this.zone().enemies),
          result = original.apply(this, args);
        const phase = this.captainProfile?.(e)?.phase,
          plans = Campaign.rules.attacks[e.family] || [],
          slot = plans.findIndex((p) => p.kind === 'summon'),
          automatic = e.type === 'boss' && slot >= 0 ? { ...plans[slot], index: slot } : null,
          a = store(this).context?.a ||
            e.telegraph ||
            automatic || { kind: phase?.kind || 'summon' };
        const id =
          ((store(this).context?.a || e.telegraph || automatic) && V.describe(e, a)) ||
          (e.captainProfile
            ? {
                id: 'captain/' + e.captainProfile + '/phase',
                tier: 'captain',
                role: 'melee',
                variant: 'normal',
                kind: phase?.kind || 'summon',
                presentation: P.profile(e, { kind: phase?.kind || 'summon' }),
              }
            : null);
        for (const u of this.zone().enemies)
          if (!before.has(u) && u.owner === e.id)
            emit(this, e, a, 'spawn', { x: u.x, y: u.y, target: u.id }, id);
        return result;
      });
    for (const method of ['tacticalRogueFieldSupport', 'tacticalRogueCommanderSupport'])
      wrap(method, function (original, [e, a]) {
        const before = new Set(this.zone().enemies.filter((u) => u.hp > 0)),
          result = original.call(this, e, a);
        for (const u of this.zone().enemies)
          if (u.hp > 0 && !before.has(u))
            emit(this, e, a, 'spawn', { x: u.x, y: u.y, target: u.id });
        return result;
      });
    wrap('triggerCaptainPhase', function (original, [e]) {
      const s = store(this),
        old = s.context;
      s.context = { e };
      try {
        const result = original.call(this, e);
        if (result) emit(this, e, this.captainProfile(e).phase, 'phase');
        return result;
      } finally {
        s.context = old;
      }
    });
    wrap('updateEnemies', function (original, args) {
      const zone = this.zoneId,
        hero = this.hero,
        beforeShots = new Set(this.s.projectiles),
        frenzy = new Set(
          this.zone()
            .enemies.filter((e) => e.frenzy)
            .map((e) => e.id),
        );
      const result = original.apply(this, args);
      if (zone !== this.zoneId || hero !== this.hero) return result;
      const s = store(this);
      for (const e of this.zone().enemies) {
        if (e.telegraph) emit(this, e, e.telegraph, 'windup');
        if (e.frenzy && !frenzy.has(e.id))
          emit(this, e, { kind: 'frenzy' }, 'phase', null, {
            id: 'enemy/' + e.species + '/frenzy',
            tier: 'ringleader',
            role: e.ranged ? 'ranged' : 'melee',
            variant: 'normal',
            kind: 'frenzy',
            presentation: P.profile(e, { kind: 'frenzy' }),
          });
        for (const p of this.s.projectiles)
          if (!beforeShots.has(p) && p.sourceId === e.id && !s.projectiles.has(p)) {
            const a = { kind: 'projectile', style: p.style, x: p.x, y: p.y },
              identity = V.projectile(e, p);
            s.projectiles.set(p, { e, a, identity });
            emit(this, e, a, 'release', null, identity);
          }
      }
      return result;
    });
    proto.enemyVfxProjectile = function (p) {
      return store(this).projectiles.get(p) || null;
    };
    proto.enemyVfxHazard = function (h) {
      return store(this).hazards.get(h) || null;
    };
    proto.enemyVfxHazardImpact = function (h, u) {
      const m = this.enemyVfxHazard(h);
      if (m)
        emit(
          this,
          m.e,
          h,
          'impact',
          { x: u.x, y: u.y, target: u === this.hero ? 'hero' : u.id, contact: true },
          m.identity,
        );
    };
    proto.enemyVfxProjectileImpact = function (p, point) {
      const m = this.enemyVfxProjectile(p);
      if (m) {
        const f = emit(this, m.e, p, 'impact', { ...point, contact: true }, m.identity);
        if (f) store(this).lastProjectileContact = { sourceId: p.sourceId, x: point.x, y: point.y };
      }
    };
  }
  const api = Object.freeze({ install, geometry, emit });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeEnemyVfxEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
