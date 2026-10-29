/* Campaign presentation only. Rendering never owns simulation or saved state. */
(function (root) {
  'use strict';
  // Crowns are portrait-stamped coinage from Ironroot, not generic gold discs.
  // This is intentionally paint-only: older loot objects still use the
  // historical 'gold' amount key, pickup radius, rewards and save schema.
  function drawCrownLoot(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y - 3);
    // Ground shadow and silvery minted face. A full coin is readable even
    // against dark Crown terrain, and no new sprite manifest is required.
    ctx.fillStyle = '#34363c99';
    ctx.beginPath();
    ctx.ellipse(0, 9, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#687982';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd6d8';
    ctx.beginPath();
    ctx.arc(0, -0.4, 8.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ecf1ee';
    ctx.lineWidth = 1;
    ctx.stroke();
    // The ruler's right-facing head and identifiable nose, chin and shoulder.
    // The same portrait grammar is used on Stonecross's striking-die tray.
    ctx.fillStyle = '#586d77';
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(2, -5);
    ctx.lineTo(4, -2);
    ctx.lineTo(7, 0);
    ctx.lineTo(4, 1);
    ctx.lineTo(3, 4);
    ctx.lineTo(1, 5);
    ctx.lineTo(-3, 4);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-7, 5);
    ctx.lineTo(-4, 2);
    ctx.closePath();
    ctx.fill();
    // The ruler's own tall pointed helm and broad three-tipped crown,
    // miniaturized from the actual Dark Lord silhouette, not generic royalty.
    ctx.fillStyle = '#596274';
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(-4, -6);
    ctx.lineTo(0, -8);
    ctx.lineTo(4, -5);
    ctx.lineTo(5, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4e646e';
    ctx.beginPath();
    ctx.moveTo(-5.5, -4);
    ctx.lineTo(-8, -8.6);
    ctx.lineTo(-3, -6.2);
    ctx.lineTo(0, -9.5);
    ctx.lineTo(3, -6.2);
    ctx.lineTo(7.8, -8.6);
    ctx.lineTo(5.8, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e3e9e7';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(3, -4);
    ctx.stroke();
    ctx.fillStyle = '#e3e9e7';
    ctx.fillRect(1, -2, 1.2, 1.2);
    ctx.restore();
  }

  // Paint-only TRUE radiance. The hollow corona sits behind the body; its
  // transparent centre leaves silhouettes, floors and attack warnings legible.
  function drawTrueAura(ctx, e, p, height, time, reduced = false) {
    const phase = reduced ? 0 : time * 0.36,
      breath = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.3),
      h = Math.max(54, Math.min(130, height)),
      w = Math.max(34, h * 0.44),
      cy = p.y - h * 0.42;
    ctx.save();
    ctx.translate(p.x, cy);
    ctx.scale(w, h * 0.68);
    const glow = ctx.createRadialGradient(0, 0, 0.18, 0, 0, 1.35);
    glow.addColorStop(0, '#ffe8a600');
    glow.addColorStop(0.36, '#ffe8a600');
    glow.addColorStop(0.53, '#f3c66318');
    glow.addColorStop(0.69, '#ffe3a023');
    glow.addColorStop(0.83, '#d9993612');
    glow.addColorStop(1, '#d9993600');
    ctx.globalAlpha = 0.72 + breath * 0.18;
    ctx.fillStyle = glow;
    ctx.fillRect(-1.35, -1.35, 2.7, 2.7);
    ctx.restore();
    ctx.save();
    ctx.lineCap = 'round';
    const thread = ctx.createLinearGradient(0, p.y + 8, 0, p.y - h * 1.08);
    thread.addColorStop(0, '#edb85100');
    thread.addColorStop(0.22, '#edb85138');
    thread.addColorStop(0.62, '#ffe8a75c');
    thread.addColorStop(1, '#fff2cf00');
    ctx.strokeStyle = thread;
    ctx.lineWidth = 1.1;
    for (let j = 0; j < 4; j++) {
      const side = j % 2 ? 1 : -1,
        sway = Math.sin(phase + j * 1.7) * 5,
        spread = w * (0.72 + Math.floor(j / 2) * 0.2);
      ctx.beginPath();
      ctx.moveTo(p.x + side * spread, p.y + 5);
      ctx.bezierCurveTo(
        p.x + side * (spread + 9) + sway,
        p.y - h * 0.3,
        p.x + side * (spread - 8) - sway,
        p.y - h * 0.68,
        p.x + side * spread * 0.62,
        p.y - h * (0.89 + j * 0.045),
      );
      ctx.stroke();
    }
    // Open, feather-light arcs rather than a solid golden landing disc.
    for (let j = 0; j < 3; j++) {
      ctx.strokeStyle = j === 1 ? '#fff0bd55' : '#e7b95635';
      ctx.lineWidth = j === 1 ? 1 : 1.8;
      const angle = phase + j * 2.1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 8, w + 5 + j * 3, 11 + j * 2, 0, angle, angle + 1.35);
      ctx.stroke();
    }
    // A few slow rising motes frame the body, with no random or saved state.
    for (let j = 0; j < 8; j++) {
      const life = reduced ? (j + 0.5) / 8 : (time * 0.13 + j * 0.127) % 1,
        side = j % 2 ? 1 : -1,
        x = p.x + side * w * (0.75 + Math.sin(j * 2.4 + phase) * 0.15),
        y = p.y + 2 - life * h * 1.12;
      ctx.globalAlpha = Math.sin(life * Math.PI) * 0.62;
      ctx.fillStyle = j % 3 ? '#f5d887' : '#fff2c9';
      ctx.beginPath();
      ctx.ellipse(x, y, 0.8, 1.7, side * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Veyrith's real world-coordinate movements deserve readable banking
  // streaks, not fake airborne hitboxes or an invented altitude simulation.
  // Cues are tied exclusively to active, existing flightPath/aerial motion.
  function drawAbyssFlightCues(ctx, e, p, project) {
    if (
      e?.renderKind !== 'enemy' ||
      e.family !== 'abyss' ||
      e.type !== 'boss' ||
      e.hp <= 0 ||
      !e.motion ||
      (!e.motion.flightPath?.length && !e.motion.aerial)
    )
      return false;
    const waypoint = e.motion.flightPath?.[0] || e.motion.target;
    if (!waypoint) return false;
    const to = project(waypoint);
    const dx = to.x - p.x,
      dy = to.y - p.y,
      length = Math.hypot(dx, dy);
    if (length < 4) return false;
    const ux = dx / length,
      uy = dy / length,
      sx = -uy,
      sy = ux;
    ctx.save();
    ctx.strokeStyle = '#cfb8ec';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.78;
    for (const wing of [-1, 1]) {
      // A paired slant and drag line conveys a real changing bank.
      const baseX = p.x + sx * wing * 17 - ux * 8,
        baseY = p.y + sy * wing * 17 - 37 - uy * 8;
      ctx.beginPath();
      ctx.moveTo(baseX + sx * wing * 5, baseY - 9);
      ctx.lineTo(baseX - ux * 14, baseY - uy * 14);
      ctx.lineTo(baseX - ux * 36 - sx * wing * 8, baseY - uy * 36 + 6);
      ctx.stroke();
    }
    // Short local speedline follows the actor, never the future impact spot.
    ctx.strokeStyle = '#a3c6e6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x - ux * 14, p.y - 23 - uy * 14);
    ctx.lineTo(p.x - ux * 40, p.y - 23 - uy * 40);
    ctx.stroke();
    ctx.restore();
    return true;
  }

  // Projected isometric horizontal direction: a world-space target can lie
  // northwest yet appear screen-right. Only turn the painted body; no gameplay
  // facing, attack geometry or saved campaign field is introduced.
  function bodyFacingSide(from, toward, previous = 1) {
    if (!from || !toward || !Number.isFinite(toward.x) || !Number.isFinite(toward.y))
      return previous;
    const dx = toward.x - from.x - (toward.y - from.y);
    return Math.abs(dx) < 8 ? previous : dx < 0 ? -1 : 1;
  }

  // Large foreground forms can cover actors under the existing depth sort.
  // Keep this list deliberately conservative: small clutter must not trigger UI.
  // Only explicitly decorative, nonblocking, small clutter is eligible for
  // tighter culling. World objects and gameplay eligibility remain untouched.
  function optimizationClutter(e) {
    return !!(
      e &&
      e.decorative === true &&
      !e.r &&
      !['sapling', 'pine-sapling'].includes(e.structure) &&
      !e.roadBlocker &&
      !e.sceneRole &&
      /(?:^|[-_])(?:grass|wildflowers|flowers|reeds?|mushrooms?|pebbles?|fern|shrub|bush|sapling)(?:$|[-_])/i.test(
        String(e.structure || ''),
      )
    );
  }
  function majorOccluder(e) {
    if (!e || e.interactionOnly) return false;
    if (e.renderKind === 'building') return true;
    if (e.renderKind === 'npc')
      return ['rest', 'supplier', 'recruiter', 'mini', 'dungeon', 'exit'].includes(e.kind);
    if (e.renderKind !== 'prop') return false;
    const structure = String(e.structure || '');
    if (['sapling', 'pine-sapling', 'regrowth-birch', 'regrowth-willow'].includes(structure))
      return true;
    // Ground decals and genuinely low clutter never conceal an actor. Use the
    // actual object alpha in drawOcclusionOutlines for the final cover check.
    if (
      /(?:^|[-_])(?:sapling|stump|shrub|grass|flowers|petals|furrows|rune|road|path|floor|ash|poppies|puddle)(?:[-_]|$)/i.test(
        structure,
      )
    )
      return false;
    return (
      /(?:^|[-_])(?:house|cottage|workshop|smithy|hut|lodge|hall|tower|watchhouse|watchpost|keep|fort|fortress|gatehouse|barracks|chapel|tent|tree|mangrove|wall|stonewall|stockade|palisade|rock|boulder|cliff|pillar|statue|shrine|roost|hatchery|forge|furnace|kiln|kennel|gate|arch|ruin|shelf|wardrobe|large|canopy|wagon|cart|stall|screen|supply-stack|weapon-rack)(?:[-_]|$)/i.test(
        structure,
      ) ||
      (Number(e.r) >= 16 && !/(?:^|[-_])(?:barrel|crate|post|log)(?:[-_]|$)/.test(structure)) ||
      (['🌲', '🌳', '🪨'].includes(e.icon) && Number(e.r) >= 14)
    );
  }

  // The sorted draw order remains authoritative: an obstacle only hides an actor
  // when it is actually painted after that actor.
  function nightLightKind(structure) {
    if (structure === 'active-signal-beacon') return 'work-fire';
    const domestic =
      /(?:^|[-_])(?:house|cottage|workshop|boathouse|smithy|forgehouse|watchhouse|hut|lodge|longhouse|dwelling)(?:$|[-_])/i;
    const fires =
      /(?:^|[-_])(?:cookfire|fireplace|campfire|hearth|brazier|ember-pit|forge|field-kitchen|torch|furnace)(?:$|[-_])/i;
    const lanterns = /(?:^|[-_])(?:lantern|grave-lamp)(?:$|[-_])/i;
    const thermal =
      /^(?:geothermal-heat-intake|crown-glass-kiln|crown-ceramic-kiln|heat-distribution-post|heated-drying-shed|heated-washhouse|thermal-flue)$/;
    return domestic.test(structure)
      ? 'window'
      : lanterns.test(structure)
        ? 'lantern'
        : thermal.test(structure)
          ? 'work-fire'
          : fires.test(structure)
            ? /forge|field-kitchen/.test(structure)
              ? 'work-fire'
              : 'fire'
            : null;
  }

  function occlusionPairs(entities, project, height) {
    const pairs = [],
      actors = [],
      obstacles = [];
    // These inputs are immutable for this draw. Index only genuine cover once;
    // no retained cache can outlive a camera, sprite-manifest or scene change.
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (
        ['hero', 'ally', 'enemy'].includes(entity.renderKind) &&
        !entity.interactionOnly &&
        !(entity.renderKind === 'enemy' && (entity.hp <= 0 || entity.neutral))
      )
        actors.push({ entity, index: i });
      else if (majorOccluder(entity))
        obstacles.push({ entity, index: i, position: null, height: undefined });
    }
    let first = 0;
    for (const { entity: actor, index } of actors) {
      const p = project(actor),
        front = [];
      while (first < obstacles.length && obstacles[first].index <= index) first++;
      for (let j = first; j < obstacles.length; j++) {
        const obstacle = obstacles[j],
          entity = obstacle.entity;
        if (entity.x + entity.y <= actor.x + actor.y) continue;
        const q = obstacle.position || (obstacle.position = project(entity)),
          dy = q.y - p.y;
        // Broad phase only. The actual artwork's alpha is intersected below,
        // preventing a contour from appearing across empty sprite padding.
        if (obstacle.height === undefined) obstacle.height = height(entity);
        // Broad phase must accommodate tall/wide artwork and overlapping cover,
        // rather than an invariant 155px strip that misses large structures.
        const reach = Math.max(155, obstacle.height * 1.3, Number(entity.r || 0) * 2 + 55);
        if (
          dy < -Math.max(35, obstacle.height * 0.3) ||
          dy > Math.max(120, obstacle.height + 75) ||
          Math.abs(q.x - p.x) > reach
        )
          continue;
        front.push({ entity, position: q });
        if (front.length === 16) break;
      }
      if (front.length) pairs.push({ actor, position: p, front });
    }
    // The party takes priority on busy screens; the effect is intentionally bounded.
    return pairs
      .sort(
        (a, b) =>
          (a.actor.renderKind === 'hero' ? 0 : a.actor.renderKind === 'ally' ? 1 : 2) -
          (b.actor.renderKind === 'hero' ? 0 : b.actor.renderKind === 'ally' ? 1 : 2),
      )
      .slice(0, 24);
  }


  // Constructed ONLY when the developer explicitly enables effect recording.
  // Regular players have no recorder, sampling loops, timers or report storage.
  function createEffectDiagnostics() {
    const limit = 512;
    const rows = new Map();
    const tracked = new WeakMap();
    const receipts = Object.create(null);
    const decisions = { eligibleDraws: 0, fpsLimited: 0, adaptiveSkipped: 0 };
    const stateDraws = { projectiles: 0, telegraphs: 0, motions: 0, hazards: 0, charges: 0 };
    const frames = [], callbacks = [];
    let drawNumber = 0, eventsSeen = 0, excessIdentityRecords = 0, sceneResets = 0;
    function key(f) {
      if (f.type === 'enemyVfx')
        return (f.skillId || f.identity?.id || 'enemy/unknown') + ':' + (f.stage || 'unknown');
      if (f.type === 'heroSkill')
        return 'hero/' + (f.class || '?') + '/' + (f.slot || '?') + '/' +
          (f.charged ? 'charged' : 'normal') + ':' + (f.stage || 'cast');
      if (f.type === 'petSkill')
        return 'pet/' + (f.petFamily || '?') + '/' + (f.slot || '?') + ':' +
          (f.stage || 'release');
      if (f.companion) return 'companion/' + (f.role || '?') + ':' + f.type;
      return f.type + (f.actor ? ':' + f.actor : '') + (f.slot ? ':' + f.slot : '');
    }
    function entry(f) {
      const id = key(f);
      let row = rows.get(id);
      if (!row) {
        if (rows.size >= limit) {
          excessIdentityRecords++;
          row = rows.get('[additional-identities]');
          if (!row) {
            row = { id: '[additional-identities]', queued: 0, overflowDropped: 0,
              filtered: 0, expiredWithoutDraw: 0, painted: 0, drawnFrames: 0 };
            rows.set(row.id, row);
          }
        } else {
          row = { id, queued: 0, overflowDropped: 0, filtered: 0,
            expiredWithoutDraw: 0, painted: 0, drawnFrames: 0 };
          rows.set(id, row);
        }
      }
      return row;
    }
    function finish(f, reason) {
      const meta = tracked.get(f);
      if (!meta || meta.retired) return;
      meta.retired = true;
      if (reason === 'overflow') meta.row.overflowDropped++;
      else if (reason === 'filtered') meta.row.filtered++;
      else if (reason === 'expiry' && !meta.drawn) meta.row.expiredWithoutDraw++;
    }
    return {
      receipts(events) {
        // Only known feedback events; not the entire general gameplay log.
        const types = ['heroSkillCast', 'heroHawk', 'heroSkillArea', 'heroProjectileFlight',
          'enemyVfx', 'petSkill', 'companionSkill', 'projectileLaunch',
          'projectileImpact', 'chargedArea', 'chargedImpact', 'chargeInterrupted',
          'hit', 'hurt', 'heal', 'spell', 'swing', 'basicComboFinisher'];
        for (const e of events) {
          if (!types.includes(e.type)) continue;
          eventsSeen++;
          const label = e.type === 'enemyVfx' && e.audioOnly ? 'enemyVfx:audioOnly' : e.type;
          receipts[label] = (receipts[label] || 0) + 1;
        }
      },
      candidates(next, previous) {
        const prior = new Set(previous);
        for (const f of next) {
          if (prior.has(f)) continue;
          const row = entry(f);
          row.queued++;
          tracked.set(f, { row, drawn: false, retired: false });
        }
      },
      overflow(f) { finish(f, 'overflow'); },
      filtered(previous, next) {
        const retained = new Set(next);
        for (const f of previous) if (!retained.has(f)) finish(f, 'filtered');
      },
      expiry(f) { finish(f, 'expiry'); },
      painted(f) {
        const meta = tracked.get(f);
        if (!meta || meta.retired) return;
        meta.row.drawnFrames++;
        if (!meta.drawn) {
          meta.drawn = true;
          meta.row.painted++;
        }
      },
      draw(game) {
        drawNumber++;
        const enemies = game.zone().enemies;
        const sample = {
          frame: drawNumber,
          gameTime: Math.round(game.s.time * 100) / 100,
          projectiles: game.s.projectiles.length,
          telegraphs: enemies.filter((e) => e.hp > 0 && !!e.telegraph).length,
          motions: enemies.filter((e) => e.hp > 0 && !!e.motion).length,
          hazards: game.s.hazards.length,
          charges: Number(!!game.heroChargeState?.()) + (game._companionCharges?.size || 0),
        };
        for (const field of Object.keys(stateDraws)) stateDraws[field] += sample[field];
        frames.push(sample);
        if (frames.length > 120) frames.shift();
      },
      decision(eligible, skipped) {
        if (!eligible) decisions.fpsLimited++;
        else if (skipped) decisions.adaptiveSkipped++;
        else decisions.eligibleDraws++;
      },
      callback(row, activeEffects = 0) {
        if (!row || !Number.isFinite(row.frameWorkMs)) return;
        const rounded = (value) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
        callbacks.push({
          gameTime: rounded(row.gameTime),
          intervalMs: rounded(row.intervalMs),
          frameWorkMs: rounded(row.frameWorkMs),
          simulationMs: rounded(row.simulationMs),
          renderMs: rounded(row.renderMs),
          effectQueueSize: activeEffects,
          drawn: !!row.drawn,
          simulating: !!row.simulating,
          recovering: !!row.recovering,
          fpsLimited: !!row.fpsLimited,
          adaptiveSkipped: !!row.adaptiveSkipped,
        });
        if (callbacks.length > 120) callbacks.shift();
      },
      sceneReset(current) {
        sceneResets++;
        for (const f of current) finish(f, 'filtered');
      },
      report(recording) {
        return {
          version: 1, recording,
          scope: 'Developer Mode opt-in, in-memory, no campaign-save changes',
          proof: 'Painter calls; not nontransparent pixels or player visibility',
          interpretation: 'Direct-state counts are not independently queued effects',
          limits: { identities: limit, recentDrawFrames: 120, recentCallbacks: 120 },
          drawFrames: drawNumber, eventsSeen,
          receipts: { ...receipts }, drawDecisions: { ...decisions },
          directStateAtDraw: { ...stateDraws },
          recentDrawFrames: frames.slice(), recentCallbacks: callbacks.slice(),
          sceneResets, excessIdentityRecords,
          identities: [...rows.values()].map((row) => ({ ...row })),
        };
      },
    };
  }

  function create({
    canvas: viewport,
    ctx,
    getGame,
    platform,
    chargePresentation,
    queuedChargePresentation = () => [],
    isPaused,
    getGuideRoute = () => null,
    Campaign,
    PrototypeVisuals,
    PrototypeCombatVisuals,
    PrototypeEnemyVfxArt = root.PrototypeEnemyVfxArt ||
      (typeof require === 'function' ? require('./enemy-vfx-art.js') : null),
    PrototypeSprites,
    PrototypeMaterials,
    renderLayer = 'full',
    staticTerrainTimeSeconds = null,
    PrototypeGroundCache = root.PrototypeGroundCache ||
      (typeof require === 'function' ? require('./ground-cache.js') : null),
    now = () => performance.now(),
  }) {
    // Draw in unzoomed presentation units, preserving one transform for the
    // world, artwork and effects. Public coordinates remain CSS pixels.
    const zoom = () => platform.cameraZoom || 1;
    const canvas = {
      get width() {
        return viewport.width / zoom();
      },
      get height() {
        return viewport.height / zoom();
      },
    };
    let game = getGame(),
      visualFx = [],
      // A separate tiny queue: critical cues must not evict 40 existing combat
      // effects or disappear unseen during normal renderer frame skipping.
      criticalCues = [],
      origin = null;
    // Skipped first paint is allowed, but off-screen markers have a hard deadline.
    const criticalCueMaxAgeMs = 1800;
    let effectRecorder = null;
    let retainedEffectRecorder = null;
    const heroArt =
      root.PrototypeHeroPresentation ||
      (typeof require === 'function' ? require('./hero-presentation.js') : null);
    const motionPreference = root.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reducedMotion = () => !!motionPreference?.matches;
    const groundCache = PrototypeGroundCache ? new PrototypeGroundCache() : null;
    let cacheGround = true,
      optimized = false;
    const phaseSamples = [];
    let drawCount = 0,
      phaseSample = null,
      phaseAt = 0;
    function finishPhase(name) {
      if (!phaseSample) return;
      const stamp = now();
      phaseSample[name] = Math.max(0, stamp - phaseAt);
      phaseAt = stamp;
    }
    function phaseReport() {
      const quantile = (values, p) => {
        const list = values.slice().sort((a, b) => a - b);
        return Number((list[Math.floor((list.length - 1) * p)] || 0).toFixed(2));
      };
      const labels = ['floor', 'terrain', 'entities', 'effects'];
      return {
        sampledFrames: phaseSamples.length,
        sampleEvery: 12,
        // Sampled renderer phases, not exclusive CPU attribution or simulation time.
        ...Object.fromEntries(
          labels.map((label) => {
            const values = phaseSamples.map((row) => row[label]);
            return [label, { p95Ms: quantile(values, 0.95), p99Ms: quantile(values, 0.99) }];
          }),
        ),
      };
    }
    const stats = {
      tileCandidates: 0,
      tilesDrawn: 0,
      entitiesConsidered: 0,
      entitiesDrawn: 0,
      floorTilesPainted: 0,
      outlineMasks: 0,
      outlineMaskPixels: 0,
    };
    function iso(x, y) {
      return { x: (x - y) * 0.76, y: (x + y) * 0.27 };
    }
    function offset() {
      if (origin) return origin;
      const p = iso(getGame().hero.x, getGame().hero.y),
        anchor = platform.cameraAnchor(viewport.width, viewport.height),
        scale = zoom();
      return { x: anchor.x / scale - p.x, y: anchor.y / scale - p.y };
    }
    function screen(e) {
      const p = iso(e.x, e.y),
        o = offset();
      return { x: p.x + o.x, y: p.y + o.y };
    }
    function localWorld(x, y) {
      const o = offset(),
        xx = x - o.x,
        yy = y - o.y;
      return { x: (xx / 0.76 + yy / 0.27) / 2, y: (yy / 0.27 - xx / 0.76) / 2 };
    }
    // The same small, identity-only nameplate policy covers Canvas and Pixi.
    // A Charmed creature keeps its own species/name, with a readable music cue.
    function companionWorldLabel(e) {
      return (e.charmOrigin ? '♫ ' : '') + game.companionDisplayName(e);
    }
    function charmedCompanion(e) {
      return e.renderKind === 'ally' && !!e.charmOrigin;
    }
    // Named conventional companions retain their established treatment.
    // Captured monsters reuse compact enemy-style text, not the large panel.
    function namedCompanion(e) {
      return e.renderKind === 'ally' && !!e.customName && !charmedCompanion(e);
    }
    function worldLabelWidth(name, e) {
      return Math.min(
        canvas.width - 20,
        Math.max(62, name.length * (namedCompanion(e) ? 8.1 : 6.7) +
          (namedCompanion(e) ? 18 : 10)),
      );
    }
    function drawNamedCompanionLabel(name, slot) {
      ctx.save();
      ctx.fillStyle = '#15271edb';
      ctx.fillRect(slot.x - slot.width / 2 - 3, slot.y - 16, slot.width + 6, 20);
      ctx.font = 'bold 12px system-ui';
      ctx.fillStyle = '#fff0b6';
      ctx.shadowColor = '#04130b';
      ctx.shadowBlur = 4;
      ctx.fillText(name, slot.x, slot.y, slot.width);
      ctx.restore();
    }
    function worldLabelVisible(e) {
      if (e.renderKind === 'enemy') return e.type === 'boss' || !!e.aggro;
      if (e.renderKind === 'npc' || e.renderKind === 'building')
        return Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= 220;
      return true;
    }
    function tileBounds(size, width = canvas.width, height = canvas.height, o = offset()) {
      const local = (x, y) => ({
        x: ((x - o.x) / 0.76 + (y - o.y) / 0.27) / 2,
        y: ((y - o.y) / 0.27 - (x - o.x) / 0.76) / 2,
      });
      const corners = [
        local(-160, -100),
        local(width + 160, -100),
        local(-160, height + 100),
        local(width + 160, height + 100),
      ];
      return {
        x1: Math.max(0, Math.ceil(Math.min(...corners.map((p) => p.x)) / 80) * 80),
        x2: Math.min(size - 1, Math.floor(Math.max(...corners.map((p) => p.x)) / 80) * 80),
        y1: Math.max(0, Math.ceil(Math.min(...corners.map((p) => p.y)) / 80) * 80),
        y2: Math.min(size - 1, Math.floor(Math.max(...corners.map((p) => p.y)) / 80) * 80),
      };
    }
    function draw() {
      game = getGame();
      if (effectRecorder && renderLayer !== 'background') effectRecorder.draw(game);
      phaseSample = ++drawCount % 12 === 0 ? {} : null;
      phaseAt = phaseSample ? now() : 0;
      for (const key of Object.keys(stats)) stats[key] = 0;
      origin = offset();
      PrototypeSprites?.beginFrame?.();
      PrototypeMaterials?.beginFrame?.();
      ctx.save();
      try {
        ctx.scale(zoom(), zoom());
        render();
      } finally {
        ctx.restore();
        if (phaseSample?.effects !== undefined) {
          phaseSamples.push(phaseSample);
          if (phaseSamples.length > 64) phaseSamples.shift();
        }
        phaseSample = null;
        PrototypeSprites?.endFrame?.();
        PrototypeMaterials?.endFrame?.();
        origin = null;
      }
    }
    const phaseMemory = new WeakMap();
    function visualPhase(e) {
      const owner = e.spriteIdentity || e;
      const key = String(e.id || e.name || e.species || e.family || e.type || 'azeroth');
      const previous = phaseMemory.get(owner);
      if (previous?.key === key) return previous.phase;
      let h = 2166136261 >>> 0;
      for (const ch of key) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
      }
      const phase = (h % 628) / 100;
      phaseMemory.set(owner, { key, phase });
      return phase;
    }
    function visualPosition(e, p) {
      const actor =
        e.renderKind === 'hero' ||
        e.renderKind === 'ally' ||
        e.renderKind === 'enemy' ||
        (e.renderKind === 'npc' &&
          ![
            'rest',
            'supplier',
            'recruiter',
            'quests',
            'transport',
            'dungeon',
            'exit',
            'cage',
            'fountain',
            'mini',
            'landmark',
            'bundle',
          ].includes(e.kind));
      if (!actor) return p;
      const t = (PrototypeSprites?.timeMs?.() ?? now()) / 1000,
        phase = visualPhase(e),
        busy =
          (e.renderKind === 'enemy' && (e.aggro || e.telegraph)) ||
          (e.renderKind === 'hero' && game.manaCombatActive()),
        amp = e.type === 'boss' ? 1.6 : e.captain || e.roomCaptain ? 1.15 : busy ? 0.85 : 0.6;
      return {
        x: p.x + Math.sin(t * 0.75 + phase) * 0.35,
        y: p.y + Math.sin(t * (busy ? 5.2 : 2.4) + phase) * amp,
      };
    }
    // Original live actors, not per-frame render copies, own ephemeral facing.
    // Attack intent outranks footsteps, so Mirelings never fire through their
    // tails. Idle social/wilderness actors retain their last visible heading.
    const actorFacingMemory = new WeakMap();
    function paintedFacing(e) {
      // Neri turns toward actual bookcases while restoring pages; the other
      // NPCs keep their existing neutral presentation and combat AI is untouched.
      if (e.renderKind === 'npc' && e.presentation === 'archive-restorer')
        return e.bookRestoring && e.bookFacing === -1 ? -1 : 1;
      if (!['hero', 'ally', 'enemy'].includes(e.renderKind)) return 1;
      const owner = e.spriteIdentity || e,
        old = actorFacingMemory.get(owner) || { x: e.x, y: e.y, side: 1 };
      const moved = Math.hypot(e.x - old.x, e.y - old.y) > 0.7;
      let target = null;
      if (e.renderKind === 'hero') {
        target =
          game.selectedHeroTarget?.() ||
          (e.order?.type === 'attack'
            ? game.zone().enemies.find((u) => u.id === e.order.id && u.hp > 0)
            : null);
      } else if (e.renderKind === 'ally') {
        const id = e.order?.type === 'attack' ? e.order.id : game._tacticalPartyTargets?.get(e.id);
        target = id ? game.zone().enemies.find((u) => u.id === id && u.hp > 0) : null;
      } else if (e.hp > 0 && !e.returning) {
        const id = e.telegraph?.targetId || e.rangedAim?.targetId;
        if (id === 'hero') target = game.hero;
        else if (id) target = game.s.party.find((u) => u.id === id && u.hp > 0);
        if (!target && e.rangedAim) target = e.rangedAim;
        if (!target && e.aggro) {
          const combatants = [game.hero, ...game.s.party].filter((u) => u.hp > 0);
          target = combatants.sort(
            (a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y),
          )[0];
        }
      }
      if (!target && e.motion?.target) target = e.motion.target;
      if (!target && e.path?.length) target = e.path[0];
      if (!target && moved) target = { x: e.x + (e.x - old.x) * 4, y: e.y + (e.y - old.y) * 4 };
      const side = bodyFacingSide(e, target, old.side);
      actorFacingMemory.set(owner, { x: e.x, y: e.y, side });
      return side;
    }
    function sprite(e, p, target = ctx, bodyOnly = false) {
      const q = visualPosition(e, p),
        rescued = !!game.s.rescued[e.family];
      const facing = paintedFacing(e);
      // Mirror about the foot anchor, never about the canvas origin. This
      // works for registered images and procedural body drawings alike, while
      // keeping labels, cast bars, hitboxes, shadows and VFX untransformed.
      if (facing < 0) {
        target.save();
        target.translate(2 * q.x, 0);
        target.scale(-1, 1);
      }
      try {
        if (
          PrototypeSprites &&
          PrototypeSprites.draw(
            target,
            e,
            q,
            game.regionIndex(),
            rescued,
            bodyOnly ? { silhouette: true } : undefined,
          )
        ) {
          PrototypeVisuals.frontierTreeShoots?.(target, e, q, game.regionIndex(), true);
          return;
        }
        PrototypeVisuals.draw(target, e, q, game.regionIndex(), rescued);
      } finally {
        if (facing < 0) target.restore();
      }
    }
    function spriteHeight(e) {
      const fallback =
          e.kind === 'keeper' ? 140 : e.kind === 'archive-record' ? 45 : PrototypeVisuals.height(e),
        rescued = !!game.s.rescued[e.family];
      return PrototypeSprites
        ? PrototypeSprites.height(e, game.regionIndex(), rescued, fallback)
        : fallback;
    }
    // A thin contour *only inside the pixels of the foreground obstacle*.
    // Four reused transparent canvases avoid readback, bright halos, filled
    // ghosts and per-actor allocations. No change to hitboxes or AI visibility.
    const outlineLayers = new Map();
    let compactOutlines = true;
    function outlineSize(e) {
      if (!compactOutlines || e.type === 'boss' || e.captain || e.roomCaptain) return 384;
      const ordinary =
        e.renderKind === 'hero' ||
        (e.renderKind === 'ally' && ['soldier', 'archer'].includes(e.type)) ||
        (e.renderKind === 'enemy' &&
          [
            'goblin',
            'archer',
            'skeleton',
            'rogue',
            'crownguard',
            'orc',
            'ogre',
            'ashbeast',
            'mireling',
            'wolf',
            'kobold',
            'ghoul',
          ].includes(e.species));
      if (!ordinary || e.mountedCrownRider || (e.visualScale || 1) > 1.25) return 384;
      const entry = PrototypeSprites?.definitionFor?.(
        e,
        game.regionIndex(),
        !!game.s.rescued[e.family],
      )?.entry;
      // Registered artwork can replace a familiar identity with a larger body.
      // Unknown/large actors retain the original full mask, including all bosses.
      if (entry) {
        const scale = (entry.scale || 1) * (e.visualScale || 1);
        const dw = entry.displayWidth * scale,
          dh = entry.displayHeight * scale;
        if (!dw || !dh) return 384;
        const anchors = [[entry.anchorX ?? 0.5, entry.anchorY ?? 0.88]];
        for (const clip of Object.values(entry.clips || {}))
          for (const frame of clip.frames || [])
            anchors.push([frame.pivot[0] / frame.rect[2], frame.pivot[1] / frame.rect[3]]);
        if (
          anchors.some(
            ([x, y]) =>
              dw * Math.max(x, 1 - x) + 8 > 128 || dh * y + 8 > 192 || dh * (1 - y) + 8 > 64,
          )
        )
          return 384;
      }
      return 256;
    }
    function drawOcclusionOutlines(entities) {
      const pairs = occlusionPairs(entities, screen, spriteHeight);
      if (!pairs.length || typeof document === 'undefined') return;
      for (const pair of pairs) {
        const size = outlineSize(pair.actor);
        if (!outlineLayers.has(size)) {
          const layers = [];
          for (let i = 0; i < 4; i++) {
            const surface = document.createElement('canvas');
            surface.width = surface.height = size;
            const brush = surface.getContext('2d');
            if (!brush) return;
            layers.push({ surface, brush });
          }
          outlineLayers.set(size, layers);
        }
        const layers = outlineLayers.get(size);
        const [actorLayer, tintLayer, edgeLayer, coverLayer] = layers,
          centerX = size / 2,
          footY = size === 384 ? 260 : 192,
          ring =
            optimized && compactOutlines
              ? [
                  [-1, 0],
                  [1, 0],
                  [0, -1],
                  [0, 1],
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ]
              : [
                  [-1.35, 0],
                  [1.35, 0],
                  [0, -1.35],
                  [0, 1.35],
                  [-0.95, -0.95],
                  [0.95, -0.95],
                  [-0.95, 0.95],
                  [0.95, 0.95],
                ];
        stats.outlineMasks++;
        stats.outlineMaskPixels += size * size;
        for (const layer of layers) {
          layer.brush.globalCompositeOperation = 'source-over';
          layer.brush.globalAlpha = 1;
          layer.brush.clearRect(0, 0, size, size);
        }
        sprite(pair.actor, { x: centerX, y: footY }, actorLayer.brush, true);

        // Color the real actor alpha, not a rectangle or an ellipse.
        const tint = tintLayer.brush;
        tint.drawImage(actorLayer.surface, 0, 0);
        tint.globalCompositeOperation = 'source-in';
        tint.fillStyle = pair.actor.renderKind === 'enemy' ? '#d3a69e' : '#b8cfc2';
        tint.fillRect(0, 0, size, size);
        tint.globalCompositeOperation = 'source-over';

        const edge = edgeLayer.brush;
        for (const [dx, dy] of ring) edge.drawImage(tintLayer.surface, dx, dy);
        edge.globalCompositeOperation = 'destination-out';
        edge.drawImage(actorLayer.surface, 0, 0);
        edge.globalCompositeOperation = 'source-over';

        // Union the actual foreground artwork. The contour is erased wherever
        // the actor is visible rather than showing a permanent character glow.
        const cover = coverLayer.brush;
        for (const obstacle of pair.front)
          sprite(
            obstacle.entity,
            {
              x: centerX + obstacle.position.x - pair.position.x,
              y: footY + obstacle.position.y - pair.position.y,
            },
            cover,
            true,
          );
        edge.globalCompositeOperation = 'destination-in';
        edge.drawImage(coverLayer.surface, 0, 0);
        edge.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.globalAlpha = 0.46;
        ctx.drawImage(
          edgeLayer.surface,
          Math.round(pair.position.x - centerX),
          Math.round(pair.position.y - footY),
        );
        ctx.restore();
      }
    }
    // Shared Canvas/Pixi presentation geometry. A GPU actor uses these same
    // accepted feet/ground sizes rather than estimating shadows from sprites.
    function groundPresentation(e) {
      let rx = 18,
        ry = 5.5;
      if (e.type === 'boss') {
        rx = 31;
        ry = 9;
      } else if (e.captain || e.roomCaptain) {
        rx = 25;
        ry = 7;
      } else if (e.renderKind === 'building') {
        rx = 33;
        ry = 9;
      } else if (e.renderKind === 'prop') {
        rx = e.structure === 'house' || e.structure === 'workshop' ? 31 : 22;
        ry = e.structure === 'house' || e.structure === 'workshop' ? 8 : 6;
      } else if (e.kind === 'transport') {
        rx = 30;
        ry = 8;
      }
      const scale = (PrototypeVisuals.featureScale?.(e) || 1) > 1 ? e.visualScale || 1 : 1;
      rx *= scale;
      ry *= scale;
      const type = e.renderKind,
        important = type === 'hero' || e.type === 'boss' ||
          e.captain || e.roomCaptain || e.kind === 'quests';
      const marker = ['hero', 'ally', 'enemy', 'npc', 'node'].includes(type)
        ? {
            color: type === 'hero' ? '#f5d992bb'
              : type === 'ally' ? '#a7d3a77d'
              : type === 'enemy'
                ? e.neutral ? '#b9d8b177' : e.type === 'boss' ? '#ec8b76aa' : '#b8786870'
                : e.kind === 'quests' ? '#f5d18cbb' : '#d5ca9b66',
            important,
          } : null;
      return {rx, ry, marker};
    }
    function entityShadow(e, p) {
      const {rx, ry} = groundPresentation(e);
      ctx.save();
      ctx.fillStyle = '#05100c38';
      ctx.beginPath();
      ctx.ellipse(p.x + 4, p.y + 13, rx * 1.18, ry * 1.35, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#02090666';
      ctx.beginPath();
      ctx.ellipse(p.x + 1, p.y + 11, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    function groundMarker(e, p) {
      const {marker} = groundPresentation(e);
      if (!marker) return;
      const {important} = marker;
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = important ? 2 : 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 9, important ? 28 : 21, important ? 11 : 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (important) {
        ctx.strokeStyle = '#f3e2bb44';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 9, 34, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    function entityAura(e, p) {
      if (e.renderKind !== 'enemy' || (!['true', 'ringleader'].includes(e.form) && !e.frenzy))
        return;
      const t = now() / 1000,
        pulse = 0.5 + 0.5 * Math.sin(t * 3.1 + visualPhase(e));
      ctx.save();
      if (e.form === 'true') {
        if (e.type === 'boss') drawTrueAura(ctx, e, p, spriteHeight(e), t, reducedMotion());
        else {
          ctx.strokeStyle = '#f8dfa059';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 8, 26, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = e.frenzy ? 0.65 : 0.4;
        ctx.strokeStyle = e.frenzy ? '#ef8b63' : '#d8b66f';
        ctx.lineWidth = e.frenzy ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 8, 25 + pulse * 5, 8 + pulse * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (e.frenzy)
          for (let j = 0; j < 3; j++) {
            const a = t * 2 + j * 2.09;
            ctx.fillStyle = '#ffb075';
            ctx.beginPath();
            ctx.arc(p.x + Math.cos(a) * 25, p.y - 12 + Math.sin(a) * 9, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
      }
      ctx.restore();
    }
    function healthPlate(e, p) {
      const y = p.y - spriteHeight(e),
        w = e.type === 'boss' ? 54 : e.captain || e.roomCaptain ? 50 : 42,
        left = p.x - w / 2;
      if (e.renderKind === 'hero') {
        const cast = chargePresentation();
        if (cast) {
          const cy = y - 9;
          ctx.fillStyle = '#07100ddd';
          ctx.fillRect(left - 2, cy - 2, w + 4, 7);
          ctx.fillStyle = '#36413b';
          ctx.fillRect(left, cy, w, 3);
          ctx.fillStyle = cast.color;
          ctx.fillRect(left, cy, w * cast.progress, 3);
          ctx.fillStyle = '#ffffffaa';
          ctx.fillRect(left, cy, w * cast.progress, 1);
          if (cast.ready) {
            ctx.strokeStyle = cast.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(left - 0.5, cy - 0.5, w + 1, 4);
          }
        }
      } else if (e.renderKind === 'ally') {
        const preparing = game._companionCharges?.get(e.id);
        if (preparing) {
          if (e.type === 'pet') {
            const target = game.zone().enemies.find((u) => u.id === preparing.targetId),
              def = game.petSkillDefinition(e, 2);
            if (target && def) {
              ctx.save();
              ctx.globalAlpha = 0.35;
              PrototypeEnemyVfxArt?.petSkill?.(
                ctx,
                screen,
                {
                  ...def,
                  petFamily: e.petFamily,
                  slot: 2,
                  stage: 'windup',
                  x: target.x,
                  y: target.y,
                  fromX: e.x,
                  fromY: e.y,
                  life: 1 - game.partyChargeProgress(e),
                  max: 1,
                },
                { reduced: reducedMotion(), optimized },
              );
              drawPetSkillGeometry({
                ...def,
                x: target.x,
                y: target.y,
                fromX: e.x,
                fromY: e.y,
                color: game.petDefinition(e).color,
                slot: 2,
              });
              ctx.restore();
            }
          }
          const fraction = Math.max(0, Math.min(1, game.partyChargeProgress(preparing.unit)));
          const cy = y - 9;
          ctx.fillStyle = '#07100ddd';
          ctx.fillRect(left - 2, cy - 2, w + 4, 7);
          ctx.fillStyle = '#36413b';
          ctx.fillRect(left, cy, w, 3);
          ctx.fillStyle =
            e.type === 'pet'
              ? game.petDefinition(e)?.color || '#b9d6bd'
              : e.type === 'archer'
                ? '#cfe59a'
                : '#f6d77a';
          ctx.fillRect(left, cy, w * fraction, 3);
          ctx.fillStyle = '#ffffffaa';
          ctx.fillRect(left, cy, w * fraction, 1);
        }
      }
      if (e.renderKind === 'enemy' && game.enemyFort(e)) {
        ctx.save();
        ctx.translate(left - 10, y + 1);
        ctx.fillStyle = '#9dbfcb';
        ctx.strokeStyle = '#e6eddc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4, -5);
        ctx.lineTo(4, -5);
        ctx.lineTo(4, 0);
        ctx.quadraticCurveTo(3, 4, 0, 6);
        ctx.quadraticCurveTo(-3, 4, -4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#0c1a19dd';
      ctx.fillRect(left - 2, y - 2, w + 4, 8);
      ctx.fillStyle = '#5a645b';
      ctx.fillRect(left, y, w, 4);
      ctx.fillStyle = e.renderKind === 'enemy' ? '#e87966' : '#91d59c';
      ctx.fillRect(left, y, w * Math.max(0, Math.min(1, e.hp / e.maxHp)), 4);
      ctx.fillStyle = '#ffffff77';
      ctx.fillRect(left, y, w * Math.max(0, Math.min(1, e.hp / e.maxHp)), 1);
      if (e.veraEquipment) {
        ctx.fillStyle = '#3c3025dd';
        ctx.fillRect(left, y + 7, w, 3);
        ctx.fillStyle = '#e0b96e';
        ctx.fillRect(
          left,
          y + 7,
          w * Math.max(0, Math.min(1, e.veraEquipment.remaining / e.veraEquipment.max)),
          3,
        );
      }
    }
    function projectileVector(p, project = screen) {
      const dx = Number.isFinite(p.dx) ? p.dx : 1,
        dy = Number.isFinite(p.dy) ? p.dy : 0,
        q = project(p),
        tail = project({ x: p.x - dx * 24, y: p.y - dy * 24 }),
        vx = q.x - tail.x,
        vy = q.y - tail.y,
        len = Math.hypot(vx, vy) || 1;
      return { q, ux: vx / len, uy: vy / len, px: -vy / len, py: vx / len };
    }
    function drawProjectile(p) {
      // A delay reaching zero is not yet a bow release. The simulation first
      // moves pending Ranger/Archer colliders to their live release origins.
      if (p.delay > 0 || p.rangerDelayedLaunch || p.companionDelayedLaunch) return;
      const lift = game.fortProjectileLift(p);
      if (lift > 0) {
        const q = screen(p);
        ctx.save();
        ctx.fillStyle = '#07100e66';
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, 4, 1.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const project = p.rangedArc
        ? (point) => {
            const q = screen(point);
            return { ...q, y: q.y - game.fortProjectileLift({ ...p, x: point.x, y: point.y }) };
          }
        : screen;
      drawProjectileBody(p, project);
    }
    function drawProjectileBody(p, project) {
      if (heroArt?.projectile(ctx, project, p, game.hero.class, reducedMotion(), game.hero)) return;
      if (p.style !== 'cargo' && PrototypeEnemyVfxArt?.projectile(ctx, project, p, game)) return;
      const { q, ux, uy, px, py } = projectileVector(p, project),
        style = p.style || 'magic',
        combo = p.combo || 0;
      ctx.save();
      if (p.charged && !p.rapid && style !== 'beam') {
        ctx.translate(q.x, q.y);
        ctx.scale(1.6, 1.6);
        ctx.translate(-q.x, -q.y);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (style === 'pet') {
        ctx.fillStyle = game.petDefinition(p.petFamily)?.color || '#bdd5d1';
        ctx.beginPath();
        ctx.ellipse(q.x, q.y, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e6eece';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(q.x - ux * 10, q.y - uy * 10);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (style === 'cargo') {
        ctx.translate(q.x, q.y);
        ctx.rotate(Math.atan2(uy, ux));
        ctx.fillStyle = '#5e4e40';
        ctx.fillRect(-23, -13, 46, 26);
        ctx.fillStyle = '#98846b';
        ctx.fillRect(-19, -17, 38, 10);
        ctx.fillStyle = '#443a35';
        for (const x of [-14, 14]) {
          ctx.beginPath();
          ctx.arc(x, 14, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#c3b097';
        ctx.strokeRect(-23, -13, 46, 26);
        ctx.restore();
        return;
      }
      if (p.effect === 'frost') {
        ctx.strokeStyle = '#b5edf3';
        ctx.lineWidth = 1.5;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 13 + px * side * 5, q.y - uy * 13 + py * side * 5);
          ctx.lineTo(q.x - ux * 4, q.y - uy * 4);
          ctx.stroke();
        }
        ctx.fillStyle = '#e5fbff';
        ctx.beginPath();
        ctx.moveTo(q.x + ux * 7, q.y + uy * 7);
        ctx.lineTo(q.x + px * 5, q.y + py * 5);
        ctx.lineTo(q.x - ux * 6, q.y - uy * 6);
        ctx.lineTo(q.x - px * 5, q.y - py * 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      }
      if (p.effect === 'piercing-shot') {
        ctx.strokeStyle = '#e4efb2';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(q.x - ux * 42, q.y - uy * 42);
        ctx.lineTo(q.x - ux * 5, q.y - uy * 5);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (style === 'beam') {
        const o = project({ x: p.originX ?? p.x, y: p.originY ?? p.y });
        ctx.strokeStyle = '#9fd8ff';
        ctx.globalAlpha = 0.22;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = '#bceaff';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#f4fbff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.fillStyle = '#d9f4ff';
        ctx.beginPath();
        ctx.arc(q.x, q.y, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'holy') {
        ctx.strokeStyle = '#f6d77a';
        ctx.fillStyle = '#fff2b0';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(q.x - ux * 24, q.y - uy * 24);
        ctx.lineTo(q.x + ux * 5, q.y + uy * 5);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(q.x + ux * 10, q.y + uy * 10);
        ctx.lineTo(q.x + px * 7, q.y + py * 7);
        ctx.lineTo(q.x - ux * 5, q.y - uy * 5);
        ctx.lineTo(q.x - px * 7, q.y - py * 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (style === 'arrow') {
        if (combo === 2) {
          // Projectiles fly independently after release. A curved tail looked
          // like a bent arrow chasing the moving Ranger/Archer's hand.
          ctx.strokeStyle = '#eef0c4';
          ctx.globalAlpha = 0.32;
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 30 + px * 4, q.y - uy * 30 + py * 4);
          ctx.lineTo(q.x - ux * 9 + px * 4, q.y - uy * 9 + py * 4);
          ctx.stroke();
        } else if (combo === 3) {
          ctx.strokeStyle = '#f5e6b2';
          ctx.globalAlpha = 0.38;
          ctx.lineWidth = 2;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(q.x - ux * 31 + px * 5 * side, q.y - uy * 31 + py * 5 * side);
            ctx.lineTo(q.x - ux * 5 + px * 2 * side, q.y - uy * 5 + py * 2 * side);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = combo === 3 ? '#f0d9a6' : '#d8c69a';
        ctx.fillStyle = combo === 3 ? '#fff2c7' : '#e8e1c6';
        ctx.lineWidth = combo === 3 ? 2.6 : 2;
        ctx.beginPath();
        ctx.moveTo(q.x - ux * (combo === 3 ? 29 : 24), q.y - uy * (combo === 3 ? 29 : 24));
        ctx.lineTo(q.x + ux * 4, q.y + uy * 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(q.x + ux * (combo === 3 ? 9 : 7), q.y + uy * (combo === 3 ? 9 : 7));
        ctx.lineTo(
          q.x - ux * 2 + px * (combo === 3 ? 5 : 4),
          q.y - uy * 2 + py * (combo === 3 ? 5 : 4),
        );
        ctx.lineTo(
          q.x - ux * 2 - px * (combo === 3 ? 5 : 4),
          q.y - uy * 2 - py * (combo === 3 ? 5 : 4),
        );
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#9b6f4f';
        ctx.lineWidth = 1.5;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 19, q.y - uy * 19);
          ctx.lineTo(q.x - ux * 14 + px * 4 * side, q.y - uy * 14 + py * 4 * side);
          ctx.stroke();
        }
      } else if (style === 'axe') {
        ctx.translate(q.x, q.y);
        ctx.rotate(now() / 90);
        ctx.strokeStyle = '#77563b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(9, 0);
        ctx.stroke();
        ctx.fillStyle = '#c9c5b6';
        ctx.beginPath();
        ctx.moveTo(4, -7);
        ctx.quadraticCurveTo(13, 0, 4, 7);
        ctx.lineTo(0, 4);
        ctx.lineTo(0, -4);
        ctx.closePath();
        ctx.fill();
      } else if (style === 'stone') {
        ctx.fillStyle = '#a9916f';
        ctx.strokeStyle = '#655a4d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(q.x - 6, q.y - 2);
        ctx.lineTo(q.x - 2, q.y - 6);
        ctx.lineTo(q.x + 5, q.y - 4);
        ctx.lineTo(q.x + 7, q.y + 2);
        ctx.lineTo(q.x + 1, q.y + 6);
        ctx.lineTo(q.x - 5, q.y + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#d1b98e';
        for (const d of [13, 21]) {
          ctx.beginPath();
          ctx.arc(q.x - ux * d, q.y - uy * d, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (style === 'spit') {
        ctx.translate(q.x, q.y);
        ctx.rotate(Math.atan2(uy, ux));
        ctx.fillStyle = '#9dcc7d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(-10, 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-16, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'cinder') {
        ctx.fillStyle = '#e97542';
        ctx.beginPath();
        ctx.moveTo(q.x + ux * 7, q.y + uy * 7);
        ctx.lineTo(q.x - ux * 13 + px * 5, q.y - uy * 13 + py * 5);
        ctx.lineTo(q.x - ux * 8, q.y - uy * 8);
        ctx.lineTo(q.x - ux * 13 - px * 5, q.y - uy * 13 - py * 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd17a';
        ctx.beginPath();
        ctx.arc(q.x, q.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'spectral') {
        ctx.strokeStyle = '#b6b8ff';
        ctx.fillStyle = '#8d90d9';
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(q.x - ux * 20, q.y - uy * 20);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(q.x + ux * 7, q.y + uy * 7);
        ctx.lineTo(q.x + px * 5, q.y + py * 5);
        ctx.lineTo(q.x - ux * 6, q.y - uy * 6);
        ctx.lineTo(q.x - px * 5, q.y - py * 5);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = '#9fd8ff';
        ctx.fillStyle = '#c7ecff';
        if (combo === 2) {
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 24 + px * 7, q.y - uy * 24 + py * 7);
          ctx.quadraticCurveTo(
            q.x - ux * 10 - px * 8,
            q.y - uy * 10 - py * 8,
            q.x + ux * 2,
            q.y + uy * 2,
          );
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 20 - px * 5, q.y - uy * 20 - py * 5);
          ctx.quadraticCurveTo(q.x - ux * 8 + px * 6, q.y - uy * 8 + py * 6, q.x, q.y);
          ctx.stroke();
        } else if (combo === 3) {
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 30, q.y - uy * 30);
          ctx.lineTo(q.x + ux * 2, q.y + uy * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 1.5;
          for (const side of [-1, 0, 1]) {
            ctx.beginPath();
            ctx.moveTo(
              q.x - ux * (15 + side * 3) + px * side * 6,
              q.y - uy * (15 + side * 3) + py * side * 6,
            );
            ctx.lineTo(
              q.x - ux * (5 + side * 2) + px * side * 2,
              q.y - uy * (5 + side * 2) + py * side * 2,
            );
            ctx.stroke();
          }
        } else {
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 18, q.y - uy * 18);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(q.x + ux * (combo === 3 ? 9 : 7), q.y + uy * (combo === 3 ? 9 : 7));
        ctx.lineTo(q.x + px * (combo === 2 ? 6 : 4), q.y + py * (combo === 2 ? 6 : 4));
        ctx.lineTo(q.x - ux * (combo === 3 ? 7 : 6), q.y - uy * (combo === 3 ? 7 : 6));
        ctx.lineTo(q.x - px * (combo === 2 ? 6 : 4), q.y - py * (combo === 2 ? 6 : 4));
        ctx.closePath();
        ctx.fill();
        if (combo === 3) {
          ctx.strokeStyle = '#edf8ff';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    let visualScene = { game, zone: game.zoneId, deaths: game.s.statistics.deaths };
    function queueVisualFx(events) {
      if (
        visualScene.game !== game ||
        visualScene.zone !== game.zoneId ||
        visualScene.deaths !== game.s.statistics.deaths
      ) {
        effectRecorder?.sceneReset(visualFx);
        visualFx = [];
        criticalCues = [];
        visualScene = { game, zone: game.zoneId, deaths: game.s.statistics.deaths };
      }
      if (effectRecorder && game.s.mode !== 'developer') effectRecorder = null;
      effectRecorder?.receipts(events);
      const previous = visualFx;
      visualFx = PrototypeCombatVisuals.queue(events, game, visualFx, effectRecorder);
      effectRecorder?.filtered(previous, visualFx);
      for (const event of events) {
        if (event.type !== 'criticalExecutionRelease' ||
            !event.source || event.zone !== game.zoneId ||
            event.deaths !== game.s.statistics.deaths) continue;
        // At most ten simultaneous actor cues; retain newest commitments.
        // In-flight source IDs follow the actor instead of locking a cast point.
        criticalCues = criticalCues.filter((c) => c.source !== event.source);
        criticalCues.push({
          source: event.source, life: 0.7, drawn: false,
          expiresAt: now() + criticalCueMaxAgeMs,
        });
        if (criticalCues.length > 10) criticalCues.shift();
      }
    }
    // One bounded first-paint opportunity for an essential hero cue that would
    // otherwise die between scheduled draws. This NEVER requests a new draw,
    // changes the 40-effect budget, or prolongs an already-painted cue.
    // Deliberately silent cast stages (projectiles/other effects own the art)
    // are excluded rather than holding invisible work in the transient queue.
    function firstPaintEssential(f) {
      if (f.type !== 'heroSkill') return false;
      if (f.stage === 'cast')
        return f.charged ||
          (f.class === 'paladin' && [1, 2, 6].includes(f.slot)) ||
          (['mage', 'ranger'].includes(f.class) && [3, 4].includes(f.slot));
      return ['area', 'impact', 'chain', 'cancel', 'displace', 'skill1-cross'].includes(f.stage);
    }
    const firstPaintGraceSeconds = 0.12;
    const firstPaintMinimumLife = 0.075;
    function updateVisualFx(dt) {
      for (const f of visualFx) {
        if (f._firstPaintOvertime !== undefined) {
          // The drawn cue receives no post-paint extension. Time spent waiting
          // for a permitted draw is bounded by simulated time, even at 20 FPS.
          f._firstPaintOvertime += dt;
          f.life = !f._firstPaintPresented && f._firstPaintOvertime < firstPaintGraceSeconds
            ? Math.min(f.max, firstPaintMinimumLife)
            : 0;
        } else if (
          dt > 0 && f.life - dt <= 0 && !f._firstPaintPresented &&
          firstPaintEssential(f) && dt - f.life < firstPaintGraceSeconds
        ) {
          f._firstPaintOvertime = Math.max(0, dt - f.life);
          f.life = Math.min(f.max, firstPaintMinimumLife);
        } else f.life -= dt;
        if (effectRecorder && f.life <= 0) effectRecorder.expiry(f);
      }
      visualFx = visualFx.filter((f) => f.life > 0);
      // A cue remains pending until it has actually been painted once.
      // This does not force rendering or add a recurring simulation timer.
      for (const cue of criticalCues)
        if (cue.drawn) cue.life -= Math.max(0, dt);
      const timestamp = now();
      criticalCues = criticalCues.filter(
        (c) => c.life > 0 && timestamp < c.expiresAt,
      );
    }
    function drawCriticalCues() {
      if (!criticalCues.length) return;
      // Also expire on paint after an idle/paused simulation.
      const timestamp = now();
      criticalCues = criticalCues.filter(
        (c) => c.life > 0 && timestamp < c.expiresAt,
      );
      if (!criticalCues.length) return;
      const enemies = game.zone().enemies;
      const party = game.s.party;
      ctx.save();
      ctx.textAlign = 'center';
      for (const cue of criticalCues) {
        const actor = cue.source === 'hero' ? game.hero
          : party.find((u) => u.id === cue.source) ||
            enemies.find((u) => u.id === cue.source);
        if (!actor || actor.hp <= 0 || actor.active === false) {
          cue.life = 0;
          continue;
        }
        const pos = screen(actor);
        if (pos.x < -28 || pos.x > canvas.width + 28 ||
            pos.y < -80 || pos.y > canvas.height + 80) continue;
        const x = Math.max(16, Math.min(canvas.width - 16, pos.x)),
          y = Math.max(30, Math.min(canvas.height - 30,
            pos.y - spriteHeight(actor) - 33));
        ctx.globalAlpha = Math.min(1, cue.life / 0.25);
        ctx.fillStyle = '#172b2a';
        ctx.strokeStyle = '#fff2b1';
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 6.5);
        ctx.lineTo(x + 5, y - 6.5);
        ctx.lineTo(x + 5, y + 4);
        ctx.lineTo(x, y + 8);
        ctx.lineTo(x - 5, y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff4bb';
        ctx.font = 'bold 10.5px system-ui';
        ctx.fillText('!', x, y + 3.5);
        cue.drawn = true;
      }
      ctx.restore();
      criticalCues = criticalCues.filter((c) => c.life > 0);
    }
    function drawPetSkillGeometry(f) {
      const from = { x: f.fromX, y: f.fromY },
        angle = Math.atan2(f.y - from.y, f.x - from.x),
        point = (distance, a = angle) => ({
          x: from.x + Math.cos(a) * distance,
          y: from.y + Math.sin(a) * distance,
        }),
        path = (points, close = true) => {
          ctx.beginPath();
          points.forEach((v, i) => {
            const p = screen(v);
            if (i) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
          });
          if (close) ctx.closePath();
          ctx.stroke();
        };
      ctx.strokeStyle = f.color || '#b9d6bd';
      ctx.lineWidth = f.slot === 2 ? 2 : 1.5;
      if (f.shape === 'circle') {
        path(
          Array.from({ length: 24 }, (_, i) => ({
            x: f.x + Math.cos((i * Math.PI) / 12) * f.radius,
            y: f.y + Math.sin((i * Math.PI) / 12) * f.radius,
          })),
        );
      } else if (f.shape === 'cone') {
        path([
          from,
          ...Array.from({ length: 17 }, (_, i) =>
            point(f.range, angle - f.halfAngle + (i * f.halfAngle) / 8),
          ),
        ]);
      } else if (f.shape === 'line') {
        const end = point(f.range),
          sx = -Math.sin(angle) * f.halfWidth,
          sy = Math.cos(angle) * f.halfWidth;
        path([
          { x: from.x + sx, y: from.y + sy },
          { x: end.x + sx, y: end.y + sy },
          { x: end.x - sx, y: end.y - sy },
          { x: from.x - sx, y: from.y - sy },
        ]);
      } else {
        path([from, { x: f.x, y: f.y }], false);
        const p = screen(f);
        ctx.beginPath();
        ctx.arc(p.x, p.y - 8, f.slot === 2 ? 7 : 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    function drawVisualFx() {
      for (const f of visualFx) {
        const a = Math.max(0, f.life / f.max),
          p = screen(f),
          grow = reducedMotion() ? 0.5 : 1 - a;
        if (f.type === 'enemyVfx') continue;
        if (
          f.type === 'basicComboFinisher' &&
          heroArt?.basicFinisher(ctx, screen, f, { reduced: reducedMotion(), optimized })
        ) {
          effectRecorder?.painted(f);
          continue;
        }
        if (f.type === 'heroSkill') {
          let presented = f;
          if (f.stage === 'skill1-wide-beam') {
            // Charged Mage Skill 1 uses the live, wall-clipped gameplay
            // corridor even while the caster repositions. The launch receipt
            // only owns duration and styling, never independent geometry.
            const beam = game._heroSkillEffects?.find(
              (effect) =>
                effect.kind === 'wide-beam' &&
                effect.zone === game.zoneId &&
                effect.deaths === game.s.statistics.deaths,
            );
            if (!beam) continue;
            presented = {
              ...f,
              x: beam.from.x,
              y: beam.from.y,
              endX: beam.endX,
              endY: beam.endY,
              halfWidth: beam.halfWidth,
              simulatedFront: true,
            };
          }
          heroArt?.draw(ctx, screen, presented, {
            reduced: reducedMotion(),
            optimized,
            width: canvas.width,
            height: canvas.height,
          });
          // A painter call is not pixel certification. This flag solely limits
          // first-paint grace; the developer recorder retains its own semantics.
          f._firstPaintPresented = true;
          effectRecorder?.painted(f);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = a;
        if (f.type === 'charmHeritage') {
          // Every visible contour uses the EXACT committed gameplay geometry.
          // Only one bounded 0.6s afterimage; no independent search or damage.
          const source = screen({ x: f.fromX, y: f.fromY }),
            hue = f.species === 'wraith' ? '#bbb6ff' :
              f.species === 'stalker' ? '#a88fe5' :
              f.species === 'ashbeast' ? '#ffad72' :
              ['reedbeast', 'mireling', 'goblin'].includes(f.species)
                ? '#a9d6a1' : '#e5d0a7',
            heading = Math.atan2(f.y - f.fromY, f.x - f.fromX);
          ctx.strokeStyle = hue;
          ctx.fillStyle = hue;
          ctx.lineWidth = f.critical ? 3 : 2;
          ctx.lineCap = 'round';
          if (f.shape === 'circle') {
            const radius = Math.abs(screen({ x: f.x + f.radius, y: f.y }).x - p.x);
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(2, radius * (0.85 + grow * 0.15)),
              0, Math.PI * 2);
            ctx.stroke();
          } else if (f.shape === 'cone') {
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            for (let j = 0; j <= 12; j++) {
              const angle = heading - f.halfAngle + j * f.halfAngle / 6,
                edge = screen({ x: f.fromX + Math.cos(angle) * f.range,
                  y: f.fromY + Math.sin(angle) * f.range });
              ctx.lineTo(edge.x, edge.y);
            }
            ctx.closePath();
            ctx.stroke();
          } else if (f.shape === 'line') {
            const end = { x: f.fromX + Math.cos(heading) * f.range,
              y: f.fromY + Math.sin(heading) * f.range },
              offset = { x: -Math.sin(heading) * f.halfWidth,
                y: Math.cos(heading) * f.halfWidth },
              corners = [
                { x: f.fromX + offset.x, y: f.fromY + offset.y },
                { x: end.x + offset.x, y: end.y + offset.y },
                { x: end.x - offset.x, y: end.y - offset.y },
                { x: f.fromX - offset.x, y: f.fromY - offset.y },
              ].map(screen);
            ctx.beginPath();
            corners.forEach((q, j) => j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
            ctx.closePath();
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(p.x, p.y, f.kind === 'native' ? 12 : 9, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 + grow * 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (f.type === 'petSkill') {
          if (f.stage !== 'release' && !f.physicalProjectile) drawPetSkillGeometry(f);
          PrototypeEnemyVfxArt?.petSkill?.(ctx, screen, f, { reduced: reducedMotion(), optimized });
        } else if (f.type === 'ability') {
          PrototypeCombatVisuals.ability(ctx, screen, f);
        } else if (f.type === 'contact') {
          PrototypeCombatVisuals.contact(ctx, screen, f);
        } else if (f.type === 'impact') {
          const flash = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
          flash.addColorStop(0, 'rgba(255,247,205,.75)');
          flash.addColorStop(1, 'rgba(255,247,205,0)');
          ctx.fillStyle = flash;
          ctx.fillRect(p.x - 16, p.y - 16, 32, 32);
          ctx.strokeStyle = '#fff0b6';
          ctx.lineWidth = 2;
          for (let j = 0; j < 6; j++) {
            const an = (j * Math.PI) / 3 + 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x + Math.cos(an) * 4, p.y + Math.sin(an) * 4);
            ctx.lineTo(p.x + Math.cos(an) * (13 + grow * 5), p.y + Math.sin(an) * (13 + grow * 5));
            ctx.stroke();
          }
        } else if (f.type === 'hurt') {
          ctx.strokeStyle = '#f08b78';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 + grow * 12, -0.2, Math.PI * 1.35);
          ctx.stroke();
          ctx.globalAlpha = a * 0.65;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p.x - 8 - grow * 5, p.y - 9);
          ctx.lineTo(p.x + 9 + grow * 4, p.y + 6);
          ctx.stroke();
        } else if (f.type === 'chargeInterrupted') {
          PrototypeCombatVisuals.chargeInterrupted?.(ctx, screen, f);
        } else if (f.type === 'heal') {
          if (f.actor === 'enemy' && f.resource !== 'mana') {
            const recipient = game
              .zone()
              .enemies.find((u) => u.id === f.target && game.enemyHealingActor?.(u));
            if (recipient) {
              const caster = game.zone().enemies.find((u) => u.id === f.source);
              PrototypeCombatVisuals.enemySupportHeal?.(ctx, screen, {
                ...f,
                x: recipient.x,
                y: recipient.y,
                fromX: caster?.x ?? f.fromX,
                fromY: caster?.y ?? f.fromY,
              });
            }
          } else {
            const mana = f.resource === 'mana',
              c = mana ? '#9fcfff' : '#a9e7b0';
            ctx.strokeStyle = c;
            ctx.fillStyle = c;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 7, 20 + grow * 13, 8 + grow * 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = a * 0.45;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 7, 13 + grow * 8, 5 + grow * 2, 0, 0, Math.PI * 2);
            ctx.stroke();
            for (let j = 0; j < 5; j++) {
              const angle = j * 1.26 + grow * 2.2,
                x = p.x + Math.cos(angle) * (8 + j * 2),
                y = p.y - 8 - grow * (12 + j * 3) + Math.sin(angle) * 3;
              ctx.globalAlpha = a * 0.75;
              ctx.beginPath();
              ctx.arc(x, y, mana ? 1.8 : 2.1, 0, Math.PI * 2);
              ctx.fill();
              if (!mana && j < 3) {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 3, y);
                ctx.lineTo(x + 3, y);
                ctx.moveTo(x, y - 3);
                ctx.lineTo(x, y + 3);
                ctx.stroke();
              }
            }
          }
        } else if (f.type === 'swing') {
          const t = screen({ x: f.targetX ?? f.x + 1, y: f.targetY ?? f.y }),
            dx = t.x - p.x,
            dy = t.y - p.y,
            len = Math.hypot(dx, dy) || 1,
            ux = dx / len,
            uy = dy / len,
            px = -uy,
            py = ux,
            combo = f.combo || 0;
          ctx.strokeStyle = '#f8e4a3';
          ctx.lineCap = 'round';
          if (f.dash && Number.isFinite(f.fromX) && Number.isFinite(f.fromY)) {
            const from = screen({ x: f.fromX, y: f.fromY }),
              travelX = p.x - from.x,
              travelY = p.y - from.y,
              travelLength = Math.hypot(travelX, travelY) || 1,
              sideX = -travelY / travelLength,
              sideY = travelX / travelLength;
            ctx.lineWidth = 7;
            ctx.globalAlpha = a * 0.28;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.globalAlpha = a * 0.85;
            ctx.lineWidth = 2;
            for (const side of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(from.x + sideX * side * 7, from.y + sideY * side * 7);
              ctx.lineTo(p.x + sideX * side * 7, p.y + sideY * side * 7);
              ctx.stroke();
            }
          }
          if (combo === 1 || combo === 2) {
            const side = combo === 1 ? 1 : -1,
              start = { x: p.x + px * 22 * side, y: p.y + py * 22 * side },
              end = { x: t.x - px * 24 * side, y: t.y - py * 24 * side },
              mid = { x: (p.x + t.x) / 2 + px * 30 * side, y: (p.y + t.y) / 2 + py * 30 * side };
            ctx.lineWidth = 5;
            ctx.globalAlpha = a * 0.9;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
            ctx.stroke();
            ctx.globalAlpha = a * 0.35;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
            ctx.stroke();
          } else if (combo === 3) {
            ctx.globalAlpha = a;
            ctx.lineWidth = 5.5;
            for (const side of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(p.x + px * 27 * side - ux * 4, p.y + py * 27 * side - uy * 4);
              ctx.lineTo(t.x - px * 25 * side + ux * 5, t.y - py * 25 * side + uy * 5);
              ctx.stroke();
            }
            ctx.globalAlpha = a * 0.55;
            ctx.fillStyle = '#fff1b8';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 5 + grow * 6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const ang = Math.atan2(dy, dx);
            ctx.lineWidth = 3.4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 31, ang - 0.9, ang + 0.55);
            ctx.stroke();
            ctx.globalAlpha = a * 0.35;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 35, ang - 0.75, ang + 0.42);
            ctx.stroke();
          }
        } else if (f.type === 'basicComboFinisher') {
          const from = screen({ x: f.fromX, y: f.fromY }),
            color = f.class === 'mage' ? '#9fd8ff' : f.class === 'ranger' ? '#e3efaa' : '#ffe39a';
          ctx.strokeStyle = color;
          ctx.fillStyle = color + '24';
          ctx.lineCap = 'round';
          if (f.class === 'ranger') {
            ctx.lineWidth = 2.6;
            for (const off of [-0.32, 0, 0.32]) {
              const an = f.angle + off,
                q = screen({
                  x: f.fromX + Math.cos(an) * f.range,
                  y: f.fromY + Math.sin(an) * f.range,
                });
              ctx.globalAlpha = a * (off === 0 ? 1 : 0.7);
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(q.x, q.y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(q.x, q.y);
              ctx.lineTo(q.x - Math.cos(an - 0.45) * 9, q.y - Math.sin(an - 0.45) * 9);
              ctx.moveTo(q.x, q.y);
              ctx.lineTo(q.x - Math.cos(an + 0.45) * 9, q.y - Math.sin(an + 0.45) * 9);
              ctx.stroke();
            }
          } else {
            ctx.lineWidth = f.class === 'paladin' ? 5 : 3;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            for (let j = 0; j <= 12; j++) {
              const an = f.angle - f.halfAngle + j * ((f.halfAngle * 2) / 12),
                q = screen({
                  x: f.fromX + Math.cos(an) * f.range,
                  y: f.fromY + Math.sin(an) * f.range,
                });
              ctx.lineTo(q.x, q.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            if (f.class === 'mage') {
              ctx.globalAlpha = a * 0.7;
              for (const mul of [0.45, 0.72, 1]) {
                ctx.beginPath();
                for (let j = 0; j <= 10; j++) {
                  const an = f.angle - f.halfAngle + j * ((f.halfAngle * 2) / 10),
                    q = screen({
                      x: f.fromX + Math.cos(an) * f.range * mul,
                      y: f.fromY + Math.sin(an) * f.range * mul,
                    });
                  j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
                }
                ctx.stroke();
              }
            } else {
              ctx.globalAlpha = a * 0.8;
              for (const side of [-1, 1]) {
                const an = f.angle + side * 0.24,
                  q = screen({
                    x: f.fromX + Math.cos(an) * f.range * 0.95,
                    y: f.fromY + Math.sin(an) * f.range * 0.95,
                  });
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(q.x, q.y);
                ctx.stroke();
              }
            }
          }
        } else if (f.type === 'chargedArea') {
          const color =
              f.class === 'mage' ? '#9fd8ff' : f.class === 'ranger' ? '#cfe59a' : '#f6d77a',
            from = screen({ x: f.fromX, y: f.fromY });
          ctx.strokeStyle = color;
          ctx.fillStyle = color + '28';
          ctx.lineWidth = 3;
          if (f.projectileVolley) {
            // Actual Archer shafts travel independently; show only a bow-release arc.
            ctx.globalAlpha = a * 0.55;
            ctx.beginPath();
            ctx.arc(from.x, from.y - 15, 10, -0.9, 1.1);
            ctx.stroke();
          } else if (f.shape === 'circle') {
            PrototypeCombatVisuals.circlePath(ctx, screen, f, f.radius);
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = a * 0.7;
            for (let j = 0; j < 8; j++) {
              const an = (j * Math.PI) / 4,
                q = screen({
                  x: f.x + Math.cos(an) * f.radius * 0.78,
                  y: f.y + Math.sin(an) * f.radius * 0.78,
                });
              ctx.beginPath();
              ctx.moveTo(q.x, q.y);
              ctx.lineTo(q.x + Math.cos(an) * 8, q.y - 10 + Math.sin(an) * 3);
              ctx.stroke();
              if (f.effect === 'frost-burst') {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(q.x - 4, q.y);
                ctx.lineTo(q.x, q.y - 15 - grow * 5);
                ctx.lineTo(q.x + 4, q.y);
                ctx.closePath();
                ctx.fill();
              }
            }
          } else if (f.shape === 'cone') {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            for (let j = 0; j <= 14; j++) {
              const an = f.angle - f.halfAngle + j * ((f.halfAngle * 2) / 14),
                q = screen({
                  x: f.fromX + Math.cos(an) * f.range,
                  y: f.fromY + Math.sin(an) * f.range,
                });
              ctx.lineTo(q.x, q.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = a * 0.65;
            for (const mul of [0.55, 0.82]) {
              ctx.beginPath();
              for (let j = 0; j <= 12; j++) {
                const an = f.angle - f.halfAngle + j * ((f.halfAngle * 2) / 12),
                  q = screen({
                    x: f.fromX + Math.cos(an) * f.range * mul,
                    y: f.fromY + Math.sin(an) * f.range * mul,
                  });
                j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
              }
              ctx.stroke();
            }
          } else if (f.shape === 'line') {
            const side = {
                x: Math.cos(f.angle + Math.PI / 2) * f.halfWidth,
                y: Math.sin(f.angle + Math.PI / 2) * f.halfWidth,
              },
              end = {
                x: f.fromX + Math.cos(f.angle) * f.range,
                y: f.fromY + Math.sin(f.angle) * f.range,
              };
            PrototypeCombatVisuals.polygon(
              ctx,
              screen,
              PrototypeCombatVisuals.capsulePoints({ x: f.fromX, y: f.fromY }, end, f.halfWidth),
            );
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = a * 0.75;
            for (const offset of [-0.55, 0, 0.55]) {
              const laneSide = { x: side.x * offset, y: side.y * offset },
                q1 = screen({ x: f.fromX + laneSide.x, y: f.fromY + laneSide.y }),
                q2 = screen({ x: end.x + laneSide.x, y: end.y + laneSide.y });
              ctx.beginPath();
              ctx.moveTo(q1.x, q1.y);
              ctx.lineTo(q2.x, q2.y);
              ctx.stroke();
            }
          }
        } else if (f.type === 'chargedImpact') {
          const color =
            f.class === 'mage' ? '#b9e6ff' : f.class === 'ranger' ? '#e8efb7' : '#ffe49a';
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 2.5;
          for (let j = 0; j < 8; j++) {
            const an = (j * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(p.x + Math.cos(an) * 5, p.y + Math.sin(an) * 5);
            ctx.lineTo(
              p.x + Math.cos(an) * (14 + grow * 12),
              p.y + Math.sin(an) * (14 + grow * 12),
            );
            ctx.stroke();
          }
          ctx.globalAlpha = a * 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10 + grow * 15, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        effectRecorder?.painted(f);
      }
      const guard = (q, r, cls = 'paladin') => {
        ctx.save();
        const pulse = 0.65 + (reducedMotion() ? 0 : Math.sin(now() / 160)) * 0.15;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = cls === 'mage' ? '#b3dfff' : '#f6dda0';
        ctx.fillStyle = cls === 'mage' ? '#b3dfff18' : '#f6dda018';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y + 5, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(q.x + side * r * 0.75, q.y - 12);
          ctx.lineTo(q.x + side * r, q.y + 3);
          ctx.lineTo(q.x + side * r * 0.65, q.y + 12);
          ctx.stroke();
        }
        ctx.restore();
      };
      const support = (q, e, r) => {
        ctx.save();
        const mana = e.type === 'mana';
        ctx.strokeStyle = mana ? '#82bfff99' : '#8bd99aaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(q.x, q.y + 8, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.45;
        for (let j = 0; j < 3; j++) {
          const an = (reducedMotion() ? 0 : now() / 550) + j * 2.09;
          ctx.fillStyle = mana ? '#b8ddff' : '#c1efc6';
          ctx.beginPath();
          ctx.arc(q.x + Math.cos(an) * r * 0.6, q.y - 7 + Math.sin(an) * 5, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      const h = game.hero,
        p = screen(h);
      const ward = (unit, point, radius) => {
        if ((unit.wardUntil || 0) <= game.s.time) return;
        ctx.save();
        ctx.strokeStyle = '#f5df9ecc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(point.x, point.y - 8, radius, radius * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      };
      if (h.immune > 0) guard(p, 29, h.class);
      ward(h, p, 32);
      if (h.class === 'paladin' && (h.shieldStance || 0) > 0) {
        // Raised-shield silhouette cue, rendered over either the original
        // procedural hero or its canon-faithful static sprite.
        ctx.save();
        ctx.strokeStyle = '#beddfb';
        ctx.fillStyle = '#477bb4bb';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.x - 24, p.y - 32);
        ctx.lineTo(p.x - 40, p.y - 26);
        ctx.lineTo(p.x - 39, p.y - 6);
        ctx.lineTo(p.x - 26, p.y + 1);
        ctx.lineTo(p.x - 17, p.y - 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (
        h.silenceField &&
        h.silenceField.zone === game.zoneId &&
        h.silenceField.until > game.s.time
      ) {
        const q = screen(h.silenceField);
        ctx.save();
        ctx.strokeStyle = '#bd9befaa';
        ctx.fillStyle = '#9d72d013';
        ctx.lineWidth = 2;
        PrototypeCombatVisuals.circlePath(ctx, screen, h.silenceField, h.silenceField.radius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      if (h.haste > 0) {
        ctx.save();
        ctx.strokeStyle = '#d9f2ff99';
        ctx.lineWidth = 1.5;
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath();
          ctx.moveTo(p.x - 24, p.y + j * 7);
          ctx.lineTo(p.x - 38, p.y + j * 7 + 3);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (const effect of h.supportEffects || []) {
        if (effect.type === 'mana' && !Campaign.rules.resourceMode.manaEnabled) continue;
        support(p, effect, 25);
      }
      for (const u of game.activeLivingParty()) {
        const q = screen(u);
        if (u.immune > 0) guard(q, 24);
        ward(u, q, 27);
        if (u.rangerRallyZone === game.zoneId && (u.rangerRallyUntil || 0) > game.s.time) {
          ctx.save();
          ctx.strokeStyle = '#b9e7a8bb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(q.x, q.y + 7, 26, 10, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        for (const effect of u.supportEffects || []) support(q, effect, 22);
      }
    }

    function drawNavigationRoute() {
      const route = getGuideRoute();
      if (!route?.length) return;
      ctx.save();
      ctx.strokeStyle = '#98e2c9';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.75;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      const start = screen(game.hero);
      ctx.moveTo(start.x, start.y);
      for (const point of route.slice(0, 80)) {
        const next = screen(point);
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();
      const end = screen(route.at(-1));
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // A few ink-like brackets, not ground circles. Charge hints appear only
    // while the player is holding an aimed skill; simulation owns the ranges.
    function targetGuidance() {
      const cast = chargePresentation(),
        aimed =
          cast &&
          ([1, 2, 6, 7].includes(cast.slot) ||
            (cast.slot === 4 && game.hero.class !== 'ranger') ||
            (cast.slot === 8 && game.hero.class !== 'paladin')),
        selected = game.selectedHeroTarget();
      if (cast?.slot === 3) {
        const p = screen(game.hero);
        ctx.save();
        ctx.strokeStyle = cast.state === 'no-heal' ? '#bcaba0' : cast.color;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (game.hero.class === 'ranger') {
          ctx.moveTo(p.x - 5, p.y - 34);
          ctx.lineTo(p.x + 5, p.y - 34);
          ctx.moveTo(p.x, p.y - 39);
          ctx.lineTo(p.x, p.y - 29);
        } else {
          ctx.arc(p.x, p.y - 23, 12, 0, Math.PI * 2);
          ctx.moveTo(p.x - 7, p.y - 23);
          ctx.lineTo(p.x + 7, p.y - 23);
        }
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (!selected && !aimed) return;
      const target = aimed
        ? game.zone().enemies.find((e) => e.id === cast.targetId && e.hp > 0 && !e.neutral)
        : selected;
      if (!target) return;
      const p = screen(target),
        range = aimed ? game.heroSkillRange(cast.slot, true) : 0,
        distance = Math.hypot(target.x - game.hero.x, target.y - game.hero.y),
        clear = game.line(game.hero, target),
        inRange = !aimed || distance <= range,
        color = aimed ? (!clear ? '#dc867e' : inRange ? '#f4d894' : '#e2b67b') : '#f4d894',
        valid = !aimed || (inRange && clear);
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (aimed) {
        const h = screen(game.hero);
        ctx.strokeStyle = color;
        ctx.globalAlpha = valid ? 0.38 : 0.26;
        ctx.lineWidth = 1.3;
        ctx.setLineDash?.([3, 6]);
        ctx.beginPath();
        ctx.moveTo(h.x, h.y - 13);
        ctx.lineTo(p.x, p.y - 16);
        ctx.stroke();
        ctx.setLineDash?.([]);
        // Short corner ticks suggest other reachable targets without a reticle
        // or an overdrawn field of radius circles.
        for (const e of game
          .zone()
          .enemies.filter(
            (e) =>
              e.id !== target.id &&
              e.hp > 0 &&
              !e.neutral &&
              !e.returning &&
              Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= range &&
              game.line(game.hero, e),
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - game.hero.x, a.y - game.hero.y) -
              Math.hypot(b.x - game.hero.x, b.y - game.hero.y),
          )
          .slice(0, 3)) {
          const q = screen(e);
          if (q.x < 12 || q.x > canvas.width - 12 || q.y < 12 || q.y > canvas.height - 12) continue;
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.moveTo(q.x - 17, q.y - 13);
          ctx.lineTo(q.x - 12, q.y - 16);
          ctx.moveTo(q.x + 17, q.y - 13);
          ctx.lineTo(q.x + 12, q.y - 16);
          ctx.stroke();
        }
      }
      const halfWidth = target.type === 'boss' ? 34 : target.captain ? 28 : 22,
        top = p.y - (target.type === 'boss' ? 43 : 32),
        bottom = p.y - 3,
        corner = 7;
      ctx.globalAlpha = 0.88;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#07140e';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        const px = p.x + side * halfWidth;
        ctx.moveTo(px, top + corner);
        ctx.lineTo(px, top);
        ctx.lineTo(px - side * corner, top);
        ctx.moveTo(px, bottom - corner);
        ctx.lineTo(px, bottom);
        ctx.lineTo(px - side * corner, bottom);
      }
      ctx.stroke();
      if (selected?.id === target.id && game.manualHeroTargetLocked) {
        ctx.globalAlpha = 0.85;
        ctx.shadowBlur = 2;
        ctx.font = 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f4d894';
        ctx.fillText('LOCK', p.x, top - 7);
      }
      if (aimed) {
        const label = !clear
          ? 'BLOCKED'
          : !inRange
            ? 'MOVE CLOSER'
            : cast.state === 'need-mp'
              ? 'NEED MP'
              : cast.state === 'waiting'
                ? 'WAIT'
                : cast.ready
                  ? 'RELEASE'
                  : 'CHARGING';
        ctx.globalAlpha = 0.95;
        ctx.font = 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(label, p.x, bottom + 18);
      }
      ctx.restore();
    }

    // Shared Canvas/Pixi art preparation: preserve authored sizes, transport
    // appearance and safe feature scaling without modifying campaign entities.
    function presentEntity(e, renderKind) {
      const vessel =
        renderKind === 'npc' && e.harbor && e.kind === 'transport'
          ? Campaign.rules?.harbors?.[game.zoneId]?.vessel
          : null;
      const presentation = vessel ? { ...e, ...vessel } : e;
      const visual = {
        ...presentation,
        renderKind,
        ...(renderKind === 'hero' && game.s.throneClaimed ? { crowned: true } : {}),
        ...(Campaign.rules?.ambientLife?.[e.structure || e.id]
          ? { ambientTime: (PrototypeSprites?.timeMs?.() ?? now()) / 1000 }
          : {}),
      };
      const registered = PrototypeSprites?.definitionFor?.(
        visual, game.regionIndex(), !!game.s.rescued[e.family],
      );
      if ((PrototypeVisuals.featureScale?.(visual) || 1) > 1)
        visual.visualScale = PrototypeVisuals.assetSafeScale(visual, registered?.entry);
      return { ...visual, spriteIdentity: e };
    }
    // Pixi paints sprites while Canvas retains readable in-world names and
    // interaction symbols. Use the same asset-safe height and zoom contract.
    function drawPixiNameplates() {
      const zone = game.zone(), records = [];
      const add = (list, kind) => {
        for (const entity of list || []) {
          if (entity.interactionOnly || (kind === 'enemy' && entity.hp <= 0)) continue;
          const e = presentEntity(entity, kind);
          if (e.presentation === 'scout-tracks' || !worldLabelVisible(e)) continue;
          const p = screen(e);
          if (p.x < -40 || p.x > canvas.width + 40 || p.y < -100 || p.y > canvas.height + 100)
            continue;
          const name = kind === 'npc'
            ? e.presentation === 'mobile-captive' ? 'Mira · captive'
              : e.presentation === 'mobile-forge' ? 'Vera · captive field engineer'
              : e.name || ''
            : kind === 'ally' ? companionWorldLabel(e)
              : kind === 'building' ? e.name || 'Barracks'
              : kind === 'node' ? 'Dark Lord Tribute' : e.name || '';
          records.push({ e, kind, p, name });
        }
      };
      add(game.visibleNPCs(), 'npc');
      add(game.visibleResourceNodes(), 'node');
      add(zone.buildings, 'building');
      add(zone.enemies, 'enemy');
      add(game.activeLivingParty(), 'ally');
      const priority = (r) => r.kind === 'npc' ? 0
        : r.kind === 'enemy' && (r.e.type === 'boss' || r.e.captain || r.e.roomCaptain) ? 1
          : r.kind === 'ally' && namedCompanion(r.e) ? 1.5
            : r.kind === 'ally' ? 2 : r.kind === 'enemy' ? 3
            : r.kind === 'building' ? 4 : 5;
      const claimed = [];
      ctx.save();
      ctx.textAlign = 'center';
      for (const { e, kind, p, name } of records.sort((a, b) => priority(a)-priority(b))) {
        const width = worldLabelWidth(name, e);
        const baseY = kind === 'node' ? p.y-25 : p.y-spriteHeight(e)-5;
        let slot = null;
        if (name && charmedCompanion(e)) {
          // The nickname follows its creature exactly. Never search alternate
          // offsets as nearby fighters move, since that makes labels jump.
          const x = Math.max(width / 2 + 6, Math.min(canvas.width - width / 2 - 6, p.x));
          if (baseY >= 18 && baseY <= canvas.height - 8) {
            slot = { x, y: baseY, width };
            claimed.push({
              l: x - width / 2 - 3, r: x + width / 2 + 3,
              t: baseY - 17, b: baseY + 3,
            });
          }
        } else if (name) for (const dy of [0,-20,-40,-60,-80,20,40,60,-100]) {
          for (const dx of [0,-42,42,-84,84]) {
            const x = Math.max(width/2+6,Math.min(canvas.width-width/2-6,p.x+dx)),
              y = baseY+dy, box = { l:x-width/2-3,r:x+width/2+3,t:y-17,b:y+3 };
            if (y<18 || y>canvas.height-8 ||
                claimed.some(q => box.l<q.r && box.r>q.l && box.t<q.b && box.b>q.t)) continue;
            slot={x,y,width};claimed.push(box);break;
          }
          if (slot) break;
        }
        if (slot) {
          ctx.shadowColor = '#07140e';
          ctx.shadowBlur = kind === 'enemy' ? 3 : 4;
          if (kind === 'npc') {
            ctx.font='bold 11px system-ui';ctx.fillStyle='#ffe4a2';
            ctx.fillText(name,slot.x,slot.y,slot.width);
          } else if (kind === 'building') {
            ctx.font='bold 10px system-ui';ctx.fillStyle='#e8ddb8';
            ctx.fillText(name,slot.x,slot.y,slot.width);
          } else if (kind === 'node') {
            ctx.font='10px system-ui';ctx.fillStyle='#f5e7b8';
            ctx.fillText(name,slot.x,slot.y,slot.width);
          } else if (kind === 'ally') {
            if (namedCompanion(e)) drawNamedCompanionLabel(name, slot);
            else {
              ctx.font = charmedCompanion(e) ? 'bold 10px system-ui' : '10px system-ui';
              ctx.fillStyle = charmedCompanion(e) ? '#99efcf' : '#dcebcf';
              ctx.fillText(name, slot.x, slot.y, slot.width);
            }
          } else if (kind === 'enemy') {
            ctx.font=e.type==='boss'?'bold 11px system-ui':'10px system-ui';
            ctx.fillStyle=e.type==='boss'?'#ead58c':'#f8cebd';
            ctx.fillText(name+' · Lv '+e.level,slot.x,slot.y,slot.width);
          }
          ctx.shadowBlur=0;
        }
        // The Millhaven captain's recruitment prompt was previously missing.
        if (kind === 'npc' && e.kind === 'recruiter' && game.zoneId === 'vale' &&
            game.s.party.length <= 2) {
          ctx.fillStyle='#f9ce72';
          ctx.beginPath();ctx.arc(p.x,p.y-80,16,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle='#fff1b4';ctx.lineWidth=2;ctx.stroke();
          ctx.fillStyle='#19291e';ctx.font='bold 23px system-ui';
          ctx.fillText('!',p.x,p.y-72);
        }
      }
      ctx.restore();
    }
    function drawArenaBoundary() {
      if (game.s.mode !== 'arena') return;
      // The arena has a black low-spec floor; its playable perimeter must
      // remain visible in either Canvas or the transparent Pixi cue layer.
      // These four edges exactly match Navigation.blocked's 40px inset.
      const far = game.zoneSize() - 40,
        corners = [
          { x: 40, y: 40 }, { x: far, y: 40 },
          { x: far, y: far }, { x: 40, y: far },
        ].map(screen);
      ctx.save();
      ctx.strokeStyle = '#9dc9df';
      ctx.lineWidth = 3;
      ctx.setLineDash?.([13, 9]);
      ctx.beginPath();
      for (const [i, corner] of corners.entries()) {
        if (i === 0) ctx.moveTo(corner.x, corner.y);
        else ctx.lineTo(corner.x, corner.y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash?.([]);
      for (const corner of corners) {
        ctx.fillStyle = '#d3eaf3';
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // Shared, paint-only pause cue; renderer mode never owns pause state.
    function drawPausePresentation() {
      if (!isPaused()) return;
      ctx.save();
      ctx.fillStyle = '#0006';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 25px system-ui';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', canvas.width * 0.65, canvas.height * 0.45);
      ctx.restore();
    }
    function render() {
      // Bounded by this one permitted draw. Never cache mutable attack shapes
      // between simulation steps or change warning/damage geometry.
      const warningFrameShapes = new Map();
      if (renderLayer === 'overlay') {
        // On the experimental PixiJS path, keep essential native combat cues
        // above the independent GPU world instead of hiding player warnings.
        // The full normal Canvas path below is unchanged.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawArenaBoundary();
        const z = game.zone();
        PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000, warningFrameShapes);
        PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time, warningFrameShapes);
        PrototypeEnemyVfxArt?.ground(ctx, screen, game, visualFx, effectRecorder);
        for (const e of [
          ...z.enemies.filter((u) => u.hp > 0),
          ...game.activeLivingParty(),
          game.hero,
        ]) {
          if (e !== game.hero && e.hp <= 0) continue;
          if (e !== game.hero && e.neutral) continue;
          const p = screen(e);
          if (p.x > -120 && p.x < canvas.width + 120 && p.y > -120 && p.y < canvas.height + 120)
            healthPlate(e, p);
        }
        drawPixiNameplates();
        PrototypeEnemyVfxArt?.actors(ctx, screen, game, visualFx, effectRecorder);
        for (const projectile of game.s.projectiles) drawProjectile(projectile);
        drawVisualFx();
        heroArt?.statuses(ctx, screen, game, canvas.width, canvas.height);
        heroArt?.charge(ctx, screen, game.hero, chargePresentation(), reducedMotion());
        heroArt?.queued(ctx, screen, game.hero, queuedChargePresentation());
        PrototypeCombatVisuals.enemySupportStatus?.(ctx, screen, game);
        PrototypeCombatVisuals.actorCues?.(ctx, screen, game, spriteHeight);
        drawCriticalCues();
        targetGuidance();
        drawNavigationRoute();
        drawPausePresentation();
        finishPhase('effects');
        return;
      }
      ctx.fillStyle = game.s.mode === 'arena' ? '#000000' : '#0c1913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const z = game.zone(),
        room = !!game.supplyRoom(),
        dungeon = game.isDungeon(),
        size = game.zoneSize(),
        i = game.regionIndex(),
        authoredFloor =
          Campaign.dungeonIds.includes(game.zoneId) ||
          !!Campaign.rules?.treasuryArchitecture?.[game.zoneId];
      if (game.s.mode !== 'arena') {
      ctx.save();
      if (authoredFloor) {
        PrototypeVisuals.dungeonFloorPath(ctx, screen, game.zoneId, size);
        ctx.clip();
      } else if (!dungeon && !room && ['highlands', 'frontier', 'crown'].includes(game.zoneId)) {
        // Edge tiles straddle their anchors. Clip them to the same map boundary
        // as the channel, so a final half-tile cannot cap its open mouth.
        ctx.beginPath();
        for (const [j, q] of [
          { x: 0, y: 0 },
          { x: size, y: 0 },
          { x: size, y: size },
          { x: 0, y: size },
        ].entries()) {
          const p = screen(q);
          if (j) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.clip();
      }
      const bounds = tileBounds(size);
      const paintFloor = (target, o, width, height) => {
        const b = tileBounds(size, width, height, o);
        for (let x = b.x1; x <= b.x2; x += 80)
          for (let y = b.y1; y <= b.y2; y += 80) {
            const p = iso(x, y);
            p.x += o.x;
            p.y += o.y;
            if (p.x < -160 || p.x > width + 160 || p.y < -100 || p.y > height + 100) continue;
            PrototypeVisuals.floor(
              target,
              p,
              x,
              y,
              i,
              false,
              '',
              false,
              optimized ? null : PrototypeMaterials,
            );
            stats.floorTilesPainted++;
          }
      };
      let reused = false;
      if (cacheGround && !dungeon && !room && groundCache) {
        const key = 'terrain:ground:' + ['vale', 'march', 'highlands', 'frontier', 'crown'][i];
        reused = groundCache.draw(ctx, {
          width: canvas.width,
          height: canvas.height,
          origin,
          scene: z,
          revision: optimized
            ? 'optimization-procedural-v1'
            : PrototypeMaterials?.surfaceRevision?.(key) || 'procedural',
          paint: paintFloor,
        });
      } else groundCache?.clear();
      for (let x = bounds.x1; x <= bounds.x2; x += 80)
        for (let y = bounds.y1; y <= bounds.y2; y += 80) {
          stats.tileCandidates++;
          const p = screen({ x, y });
          if (p.x < -160 || p.x > canvas.width + 160 || p.y < -100 || p.y > canvas.height + 100)
            continue;
          const blocked =
            dungeon &&
            !authoredFloor &&
            game.blocked(x + 40, y + 40, game.zoneId, 0) &&
            !z.props.some((q) => Math.hypot(x + 40 - q.x, y + 40 - q.y) < q.r);
          stats.tilesDrawn++;
          if (reused) continue;
          stats.floorTilesPainted++;
          PrototypeVisuals.floor(
            ctx,
            p,
            x,
            y,
            i,
            room,
            room ? game.zoneId : dungeon ? game.zoneId : '',
            blocked,
            optimized ? null : PrototypeMaterials,
          );
        }
      ctx.restore();
      finishPhase('floor');
      if (authoredFloor) PrototypeVisuals.dungeonArchitecture(ctx, screen, game.zoneId, size);
      // Optional #294 viewport integration is disabled: exact art parity was
      // restored, but paired controls did not establish a reliable speed gain.
      if (!game.isDungeon())
        PrototypeVisuals.terrain(
          ctx,
          screen,
          i,
          size,
          optimized ? null : PrototypeMaterials,
          i === 2 ? { width: canvas.width, height: canvas.height } : null,
          z.crownInheritedDecks || [],
          staticTerrainTimeSeconds,
        );
      PrototypeVisuals.roads(ctx, z.roads || [], screen, i, optimized ? null : PrototypeMaterials);
      PrototypeVisuals.footpaths(ctx, z.footpaths || [], screen, z.roads || [], i);
      if (!game.isDungeon())
        PrototypeVisuals.bridges(ctx, screen, i, optimized ? null : PrototypeMaterials);
      } else {
        // No tile iteration, terrain sprites, road rasterization or scenery compositing.
        groundCache?.clear();
        finishPhase('floor');
      }
      drawArenaBoundary();
      // Moving combat warnings cannot be frozen into the PixiJS cached terrain.
      // Their real, current state is drawn by the transparent 2D cue overlay.
      if (renderLayer !== 'background') {
        PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000, warningFrameShapes);
        PrototypeCombatVisuals.ground(ctx, screen, game, 'underlay-cue', game.s.time, warningFrameShapes);
      }
      finishPhase('terrain');
      if (renderLayer === 'background') return;
      const boardCue = null,
        captainCue = game.zoneId === 'vale' && game.s.party.length <= 2;
      const entities = [];
      function add(list, renderKind) {
        for (const e of list) {
          stats.entitiesConsidered++;
          if (renderKind === 'enemy' && e.hp <= 0) continue;
          // Keep culling cheap; resolve and scale sprite artwork only for
          // visible entities, just as the original Canvas renderer did.
          const vessel =
              renderKind === 'npc' && e.harbor && e.kind === 'transport'
                ? Campaign.rules?.harbors?.[game.zoneId]?.vessel
                : null,
            p = screen(vessel ? { ...e, ...vessel } : e),
            margin = e.harbor ? Math.max(180, 240 * zoom()) : 180;
          if (
            p.x < -margin ||
            p.x > canvas.width + margin ||
            p.y < -margin ||
            p.y > canvas.height + margin
          )
            continue;
          // Keep the normal draw eligibility for actors, blockers, resources,
          // buildings and all other interactive or identity-bearing objects.
          if (
            optimized &&
            renderKind === 'prop' &&
            optimizationClutter(e) &&
            (p.x < -20 || p.x > canvas.width + 20 || p.y < -40 || p.y > canvas.height + 30)
          )
            continue;
          entities.push(presentEntity(e, renderKind));
        }
      }
      add(z.props, 'prop');
      // Authored civic terrain has one fixed, depth-sorted body; no saved duplicate prop.
      if (game.s.mode !== 'arena' && !game.isDungeon() && !game.supplyRoom?.(game.zoneId) && !game.sideDungeon?.(game.zoneId))
        add(
          (Campaign.rules.terrain[game.regionIndex()] || [])
            .filter((p) => ['fountain', 'grain-silo', 'orrery'].includes(p.kind))
            .map((p) => ({
              id:
                p.kind === 'orrery'
                  ? 'crown-orrery'
                  : p.kind === 'grain-silo'
                    ? 'frontier-grain-silo'
                    : 'frontier-civic-fountain',
              x: p.x,
              y: p.y,
              r: p.r,
              structure:
                p.kind === 'orrery'
                  ? 'crown-orrery'
                  : p.kind === 'grain-silo'
                    ? 'frontier-grain-silo'
                    : 'frontier-civic-fountain',
              decorative: true,
            })),
          'prop',
        );
      add(game.visibleNPCs(), 'npc');
      add(game.visibleResourceNodes(), 'node');
      if (game.s.mode !== 'arena') add(z.buildings, 'building');
      add(z.enemies, 'enemy');
      add(game.activeLivingParty(), 'ally');
      add([game.hero], 'hero');
      if (z.escort) add([{ ...z.escort, icon: '🧑‍🌾', name: 'Supply escort' }], 'ally');
      entities.sort((a, b) => a.x + a.y - b.x - b.y);
      stats.entitiesDrawn = entities.length;
      // Reserve nameplates once in screen space, with interactable NPCs and
      // bosses first. Entity draw/depth order must not decide which nearby
      // title wins when two names would occupy the same pixels.
      const labelSlots = new Map();
      const claimedLabels = [];
      const labelText = (e) => {
        if (e.renderKind === 'npc')
          return e.presentation === 'mobile-captive'
            ? 'Mira · captive'
            : e.presentation === 'mobile-forge'
              ? 'Vera · captive field engineer'
              : e.name || '';
        if (e.renderKind === 'building') return e.name || 'Barracks';
        if (e.renderKind === 'node') return 'Dark Lord Tribute';
        if (e.renderKind === 'enemy') return e.name || '';
        if (e.renderKind === 'ally') return companionWorldLabel(e);
        return '';
      };
      const labelPriority = (e) =>
        e.renderKind === 'npc'
          ? 0
          : e.renderKind === 'enemy' && e.type === 'boss'
            ? 1
            : e.renderKind === 'enemy' && (e.captain || e.roomCaptain)
              ? 1.5
              : e.renderKind === 'ally' && namedCompanion(e)
                ? 1.75
                : e.renderKind === 'ally'
                  ? 2
                  : e.renderKind === 'enemy'
                  ? 3
                  : e.renderKind === 'building'
                    ? 4
                    : 5;
      for (const e of entities.slice().sort((a, b) => labelPriority(a) - labelPriority(b))) {
        if (
          !['npc', 'enemy', 'ally', 'building', 'node'].includes(e.renderKind) ||
          e.presentation === 'scout-tracks' ||
          !worldLabelVisible(e)
        )
          continue;
        const name = labelText(e);
        if (!name) continue;
        const anchor = screen(e);
        if (
          anchor.x < -40 ||
          anchor.x > canvas.width + 40 ||
          anchor.y < -100 ||
          anchor.y > canvas.height + 100
        )
          continue;
        const w = worldLabelWidth(name, e);
        const h = namedCompanion(e) ? 20 : 17;
        const baseY = e.renderKind === 'node' ? anchor.y - 25 : anchor.y - spriteHeight(e) - 5;
        let slot = null;
        if (charmedCompanion(e)) {
          // A Charmed nickname stays above the actor, even in a crowd.
          // Other nameplates may yield to it; it never changes lanes.
          const x = Math.max(w / 2 + 6, Math.min(canvas.width - w / 2 - 6, anchor.x));
          if (baseY >= 18 && baseY <= canvas.height - 8) {
            slot = { x, y: baseY, width: w };
            claimedLabels.push({
              l: x - w / 2 - 3, r: x + w / 2 + 3,
              t: baseY - h, b: baseY + 3,
            });
          }
        } else for (const dy of [0, -20, -40, -60, -80, 20, 40, 60, -100]) {
          for (const dx of [0, -42, 42, -84, 84]) {
            const x = Math.max(w / 2 + 6, Math.min(canvas.width - w / 2 - 6, anchor.x + dx));
            const y = baseY + dy;
            if (y < 18 || y > canvas.height - 8) continue;
            const box = { l: x - w / 2 - 3, r: x + w / 2 + 3, t: y - h, b: y + 3 };
            if (claimedLabels.some((q) => box.l < q.r && box.r > q.l && box.t < q.b && box.b > q.t))
              continue;
            slot = { x, y, width: w };
            claimedLabels.push(box);
            break;
          }
          if (slot) break;
        }
        if (slot) labelSlots.set(e, slot);
      }

      // Tracks are flat ground decals. Draw them before every standing object,
      // without the NPC shadow, selection ring, aura or idle motion treatment.
      for (const e of entities) if (e.presentation === 'scout-tracks') sprite(e, screen(e));
      for (const e of entities) {
        if (e.presentation === 'scout-tracks') continue;
        const p = screen(e);
        if (p.x < -180 || p.x > canvas.width + 180 || p.y < -180 || p.y > canvas.height + 180)
          continue;
        if (!e.interactionOnly) {
          if (
            e.renderKind === 'npc' &&
            e.kind === 'bundle' &&
            (game.supplyRoom() || e.treasuryRecovery) &&
            !game.bundleCollected(e)
          ) {
            ctx.save();
            ctx.strokeStyle = '#e7d59aa8';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 2, 18, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - 43);
            ctx.lineTo(p.x + 4, p.y - 38);
            ctx.lineTo(p.x, p.y - 33);
            ctx.lineTo(p.x - 4, p.y - 38);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          }
          if (e.kind !== 'critical-codex') {
            groundMarker(e, p);
            entityShadow(e, p);
            entityAura(e, p);
          }
          drawAbyssFlightCues(ctx, e, p, screen);
        }
        ctx.font = (e.renderKind === 'prop' ? 34 : 30) + 'px system-ui';
        ctx.textAlign = 'center';
        if (e.renderKind === 'enemy' && e.pursuitBurst > 0) {
          ctx.strokeStyle = '#e9d3a8b0';
          ctx.lineWidth = 2;
          for (const dy of [-1, 6, 13]) {
            ctx.beginPath();
            ctx.moveTo(p.x - 32, p.y + dy);
            ctx.lineTo(p.x - 22, p.y + dy - 3);
            ctx.stroke();
          }
        }
        if (!e.interactionOnly)
          sprite(
            e.kind === 'archive-record'
              ? {
                  ...e,
                  renderKind: 'prop',
                  structure: 'scroll-stack',
                  decorative: true,
                  sceneRole: 'dry-stacks',
                }
              : e.kind === 'keeper'
                ? { ...e, renderKind: 'enemy', type: 'boss', family: 'archive', form: 'normal' }
                : e,
            p,
          );
        if (e.renderKind === 'enemy' && e.family === 'ridge' && e.ledgerOpen) {
          // The Ledger of Losses remains visibly carried throughout the fight.
          ctx.save();
          ctx.fillStyle = '#49312c';
          ctx.strokeStyle = '#dcba80';
          ctx.lineWidth = 2;
          ctx.fillRect(p.x + 16, p.y - 53, 23, 28);
          ctx.strokeRect(p.x + 16, p.y - 53, 23, 28);
          ctx.strokeStyle = '#be9674';
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            ctx.moveTo(p.x + 21, p.y - 46 + 7 * k);
            ctx.lineTo(p.x + 34, p.y - 46 + 7 * k);
            ctx.stroke();
          }
          ctx.restore();
        }
        if (
          ['hero', 'ally'].includes(e.renderKind) &&
          z.enemies.some(
            (b) =>
              b.family === 'ridge' &&
              b.hp > 0 &&
              b.ledgerMarkUntil > game.s.time &&
              b.ledgerMarkedId === (e.renderKind === 'hero' ? 'hero' : e.id),
          )
        ) {
          ctx.save();
          ctx.strokeStyle = '#ebc479';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 3, 23, 10, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (e.renderKind === 'npc' && e.kind === 'keeper') {
          // A roomy iron cage, drawn around the visible captive, not a tiny icon.
          ctx.strokeStyle = '#d4bea0';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(p.x - 55, p.y - 112, 110, 144);
          for (let x = -44; x <= 44; x += 22) {
            ctx.beginPath();
            ctx.moveTo(p.x + x, p.y - 112);
            ctx.lineTo(p.x + x, p.y + 32);
            ctx.stroke();
          }
        }
        if (['enemy', 'ally', 'hero'].includes(e.renderKind)) {
          const visibleCombat = e.renderKind !== 'enemy' || worldLabelVisible(e);
          if (visibleCombat && !e.neutral) healthPlate(e, p);
          if (visibleCombat) {
            const isTrueBoss = e.renderKind === 'enemy' && e.type === 'boss' && e.form === 'true',
              isCaptain = e.renderKind === 'enemy' && (e.captain || e.roomCaptain);
            ctx.font = charmedCompanion(e)
              ? 'bold 10px system-ui'
              : isTrueBoss
                ? 'bold 12px system-ui'
              : e.type === 'boss' || isCaptain
                ? 'bold 11px system-ui'
                : '10px system-ui';
            ctx.fillStyle = charmedCompanion(e)
              ? '#99efcf'
              : isTrueBoss
                ? '#ffe08a'
              : e.type === 'boss'
                ? '#ead58c'
                : isCaptain
                  ? '#d9b981'
                  : e.form === 'ringleader'
                    ? '#d7bd9b'
                    : e.renderKind === 'enemy'
                      ? '#f8cebd'
                      : '#dcebcf';
            ctx.shadowColor = '#091510';
            ctx.shadowBlur = isTrueBoss ? 5 : isCaptain ? 4 : 3;
            const label =
              e.renderKind === 'enemy'
                ? isTrueBoss
                  ? (e.family === 'crypt'
                      ? 'Lifebinder TRUE'
                      : 'TRUE · ' + e.name.replace(/^TRUE\s+|\s+TRUE$/g, '')) +
                    ' · Lv ' +
                    e.level
                  : (e.estateAttendant
                      ? (e.trueSummon ? 'TRUE ' : '') +
                        'Attendant' +
                        (e.trueSummonRole === 'captain' ? ' Ringleader' : '')
                      : e.name) +
                    ' · Lv ' +
                    e.level
                : e.renderKind === 'ally'
                  ? companionWorldLabel(e)
                  : '';
            const slot = labelSlots.get(e);
            if (slot && namedCompanion(e)) {
              drawNamedCompanionLabel(label, slot);
            } else if (slot) {
              if (e.renderKind === 'enemy' && (e.type === 'boss' || isCaptain)) {
                ctx.fillStyle = e.type === 'boss' ? '#302915c9' : '#382b20b8';
                ctx.fillRect(slot.x - slot.width / 2 - 3, slot.y - 12, slot.width + 6, 16);
                ctx.fillStyle = e.type === 'boss' ? '#ead58c' : '#d9b981';
              }
              ctx.fillText(label, slot.x, slot.y, slot.width);
            }
            if (isTrueBoss) {
              const w = ctx.measureText('TRUE').width + 12,
                y = p.y - spriteHeight(e) - 25;
              ctx.fillStyle = '#3a2d12dd';
              ctx.fillRect(p.x - w / 2, y - 11, w, 15);
              ctx.strokeStyle = '#ffe08a';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(p.x - w / 2, y - 11, w, 15);
              ctx.fillStyle = '#fff1b4';
              ctx.font = 'bold 9px system-ui';
              ctx.fillText('TRUE', p.x, y);
            }
            ctx.shadowBlur = 0;
          }
        }
        if (e.renderKind === 'npc') {
          const label = !e.thornFootprint && worldLabelVisible(e),
            name =
              e.kind === 'mini'
                ? e.name +
                  (game.peace
                    ? ' · Peaceful'
                    : game.miniCleared(e.mini)
                      ? ' · Cleared'
                      : ' · Guardians')
                : e.presentation === 'mobile-forge'
                  ? e.veraRepairUntil > game.s.time
                    ? 'Vera · repairing defenses'
                    : 'Vera · captive field engineer'
                  : e.presentation === 'mobile-captive'
                    ? 'Mira · captive'
                    : e.name;
          if (label) {
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#ffe4a2';
            ctx.shadowColor = '#07140e';
            ctx.shadowBlur = 4;
            const width =
              e.presentation === 'workstation' ||
              e.presentation === 'mobile-captive' ||
              e.presentation === 'mobile-forge' ||
              e.kind === 'keeper' ||
              e.kind === 'archive-record'
                ? Math.min(ctx.measureText(name).width, canvas.width - 24)
                : 0;
            const labelX = width
              ? Math.max(width / 2 + 12, Math.min(canvas.width - width / 2 - 12, p.x))
              : p.x;
            const slot = labelSlots.get(e);
            if (slot) ctx.fillText(name, slot.x, slot.y, Math.min(slot.width, width || slot.width));
            ctx.shadowBlur = 0;
          }
          const cue =
            e.kind === 'quests' ? boardCue : e.kind === 'recruiter' && captainCue ? '!' : null;
          if (cue) {
            ctx.fillStyle = cue === '?' ? '#9fe4ad' : '#f9ce72';
            ctx.beginPath();
            ctx.arc(p.x, p.y - 80, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff1b4';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#19291e';
            ctx.font = 'bold 23px system-ui';
            ctx.fillText(cue, p.x, p.y - 72);
          }
        }
        if (e.renderKind === 'building' && worldLabelVisible(e)) {
          ctx.font = 'bold 10px system-ui';
          ctx.fillStyle = '#e8ddb8';
          ctx.shadowColor = '#07140e';
          ctx.shadowBlur = 3;
          const slot = labelSlots.get(e);
          if (slot)
            ctx.fillText(
              e.name || (/^barracks/.test(e.id || '') ? 'Barracks' : 'Building'),
              slot.x,
              slot.y,
              slot.width,
            );
          ctx.shadowBlur = 0;
        }
        if (e.renderKind === 'node') {
          ctx.font = '10px system-ui';
          ctx.fillStyle = '#f5e7b8';
          const slot = labelSlots.get(e);
          if (slot) ctx.fillText('Dark Lord Tribute', slot.x, slot.y, slot.width);
        }
      }
      for (const l of game.s.loot.filter((l) => l.zone === game.zoneId))
        drawCrownLoot(ctx, screen(l));
      finishPhase('entities');
      // Regional night life is not a blanket of torches. Real homes carry
      // occupied window light, services have sheltered lanterns, and existing
      // fires/forges illuminate their own work. All sources are presentational:
      // no generated actors, blockers, saved flags or combat visibility changes.
      const nightNow = game.night(),
        daylight = !dungeon && !room ? game.daylightPhase?.() : null;
      const nightSources = !(daylight ? daylight.darkness > 0 : nightNow)
        ? []
        : [
            ...z.props.flatMap((prop) => {
              const structure = String(prop.structure || '');
              const kind = nightLightKind(structure);
              return kind
                ? [
                    {
                      ...screen(prop),
                      kind,
                      id: prop.id,
                      ...(structure === 'roadside-lantern' ? { fixture: 'post' } : {}),
                    },
                  ]
                : [];
            }),
            ...z.buildings
              .filter((b) => b.progress >= 4)
              .map((b) => ({ ...screen(b), kind: 'window', id: b.id })),
            ...game
              .visibleNPCs()
              .filter(
                (n) =>
                  [
                    'rest',
                    'supplier',
                    'recruiter',
                    'quests',
                    'fountain',
                    'transport',
                    'smith',
                    'teacher',
                    'alchemist',
                  ].includes(n.kind) && !n.interactionOnly,
              )
              .map((n) => ({ ...screen(n), kind: 'lantern', id: n.id })),
          ]
            .filter(
              (p) =>
                p.x > -140 && p.x < canvas.width + 140 && p.y > -160 && p.y < canvas.height + 140,
            )
            .sort((a, b) => {
              const da = (a.x - canvas.width / 2) ** 2 + (a.y - canvas.height / 2) ** 2;
              const db = (b.x - canvas.width / 2) ** 2 + (b.y - canvas.height / 2) ** 2;
              return da - db || String(a.id).localeCompare(String(b.id));
            })
            .slice(0, 44);
      // Use the carried glass's actual painted position, including facing,
      // captain scale and idle bob; do not invent a second service lantern.
      const carriedLanterns = entities
        .filter(
          (e) =>
            e.renderKind === 'enemy' && e.species === 'wraith' && e.type !== 'boss' && e.hp > 0,
        )
        .map((e) => {
          const p = visualPosition(e, screen(e)),
            scale = e.captain || e.roomCaptain ? e.visualScale || 1.18 : 1;
          return {
            x: p.x + paintedFacing(e) * 22.5 * scale,
            y: p.y + 1.5 * scale,
            kind: 'carried-lantern',
            id: e.id,
          };
        })
        .sort(
          (a, b) =>
            Math.hypot(a.x - canvas.width / 2, a.y - canvas.height / 2) -
              Math.hypot(b.x - canvas.width / 2, b.y - canvas.height / 2) ||
            String(a.id).localeCompare(String(b.id)),
        )
        .slice(0, 8);
      PrototypeVisuals.atmosphere(ctx, canvas, i, {
        night: nightNow,
        daylight,
        peace: game.peace,
        dungeon,
        room,
        optimized,
        hero: screen(game.hero),
        lights: [...carriedLanterns, ...nightSources],
      });
      // Choking Ash is intentionally visible and remains fixed where cast.
      for (const e of z.enemies)
        if (
          e.type === 'boss' &&
          e.family === 'warlord' &&
          e.aggro &&
          e.hp > 0 &&
          e.ashCloud &&
          e.ashCloud.expires > game.s.time
        ) {
          const center = screen(e.ashCloud);
          const edge = screen({ x: e.ashCloud.x + 180, y: e.ashCloud.y });
          const span = Math.max(35, Math.abs(edge.x - center.x));
          ctx.save();
          ctx.fillStyle = '#786d64a0';
          ctx.strokeStyle = '#d4bba088';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(center.x, center.y, span, span * 0.48, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      PrototypeEnemyVfxArt?.ground(ctx, screen, game, visualFx, effectRecorder);
      drawOcclusionOutlines(entities);
      // Critical outlines and transient effects retain contrast through the night grade.
      PrototypeEnemyVfxArt?.actors(ctx, screen, game, visualFx, effectRecorder);
      for (const p of game.s.projectiles) drawProjectile(p);
      drawVisualFx();
      heroArt?.statuses(ctx, screen, game, canvas.width, canvas.height);
      heroArt?.charge(ctx, screen, game.hero, chargePresentation(), reducedMotion());
      heroArt?.queued(ctx, screen, game.hero, queuedChargePresentation());
      PrototypeCombatVisuals.enemySupportStatus?.(ctx, screen, game);
      PrototypeCombatVisuals.actorCues?.(ctx, screen, game, spriteHeight);
      drawCriticalCues();
      targetGuidance();
      drawNavigationRoute();
      drawPausePresentation();
      finishPhase('effects');
    }
    return {
      draw,
      // No diagnostic object is constructed outside an explicit developer opt-in.
      setEffectDiagnostics(enabled) {
        if (enabled && getGame().s.mode === 'developer') {
          retainedEffectRecorder ||= createEffectDiagnostics();
          effectRecorder = retainedEffectRecorder;
        } else effectRecorder = null;
        return !!effectRecorder;
      },
      resetEffectDiagnostics() {
        effectRecorder = null;
        retainedEffectRecorder = null;
      },
      effectDiagnosticsReport: () => retainedEffectRecorder
        ? retainedEffectRecorder.report(!!effectRecorder)
        : { version: 1, recording: false, captured: false, identities: [] },
      noteEffectDrawDecision(eligible, skipped) {
        effectRecorder?.decision(eligible, skipped);
      },
      noteEffectFrame(row) {
        effectRecorder?.callback(row, visualFx.length);
      },
      presentEntity,
      facingFor: (visual) => {
        game = getGame();
        return paintedFacing(visual);
      },
      groundPresentation,
      // Presentation-only layer split for the opt-in PixiJS experiment.
      setRenderLayer: (layer) => {
        if (layer !== 'full' && layer !== 'overlay' && layer !== 'background')
          throw Error('Unknown Canvas paint layer');
        renderLayer = layer;
      },
      world: (x, y) => localWorld(x / zoom(), y / zoom()),
      screen: (e) => {
        const p = screen(e),
          scale = zoom();
        return { x: p.x * scale, y: p.y * scale };
      },
      tileBounds,
      // Development A/B control; both paths use identical art and gameplay.
      setOutlineCompaction: (enabled) => {
        compactOutlines = !!enabled;
      },
      setGroundReuse: (enabled) => {
        cacheGround = !!enabled;
        groundCache?.clear();
      },
      setOptimizationMode: (enabled) => {
        if (optimized === !!enabled) return;
        optimized = !!enabled;
        phaseSamples.length = 0;
        drawCount = 0;
        groundCache?.clear();
      },
      labelVisible: (e) => {
        game = getGame();
        return worldLabelVisible(e);
      },
      queue: (events) => {
        game = getGame();
        queueVisualFx(events);
        PrototypeSprites?.noteEvents?.(events);
      },
      update: updateVisualFx,
      metrics: () => ({
        ...stats,
        cameraZoom: zoom(),
        optimizationMode: optimized ? 'on' : 'off',
        transientEffects: visualFx.length,
        criticalCues: criticalCues.length,
        enemyVfxEffects: visualFx.filter((f) => f.type === 'enemyVfx').length,
        groundCache: groundCache?.status() || null,
        outlineBuffers: {
          surfaces: outlineLayers.size * 4,
          bytes: [...outlineLayers.keys()].reduce((sum, size) => sum + size * size * 4 * 4, 0),
        },
        phases: phaseReport(),
      }),
    };
  }
  const api = {
    create,
    createEffectDiagnostics,
    nightLightKind,
    bodyFacingSide,
    drawAbyssFlightCues,
    drawCrownLoot,
    drawTrueAura,
    majorOccluder,
    occlusionPairs,
    optimizationClutter,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
