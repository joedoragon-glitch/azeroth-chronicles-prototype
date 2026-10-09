/* Restrained material/action VFX. Reads authoritative combat shapes; never resolves a hit. */
(function (root) {
  'use strict';
  const V = root.PrototypeEnemyVfx || require('./enemy-vfx.js'),
    FX = root.PrototypeCombatVisuals || require('./combat-visuals.js');
  const boss = Object.freeze({
    thorn: [
      ['claw', 'fur'],
      ['landing', 'fur'],
      ['roots', 'root'],
      ['call', 'fur'],
    ],
    crypt: [
      ['cleave', 'bone'],
      ['volley', 'bone'],
      ['call', 'bone'],
      ['seal', 'spectral'],
    ],
    mire: [
      ['bite', 'mire'],
      ['rush', 'mire'],
      ['pool', 'mire'],
      ['call', 'mire'],
    ],
    archive: [
      ['sweep', 'water'],
      ['channel', 'water'],
      ['pool', 'water'],
      ['call', 'spectral'],
    ],
    ridge: [
      ['slam', 'steel'],
      ['fall', 'stone'],
      ['rush', 'stone'],
      ['call', 'steel'],
    ],
    mine: [
      ['slam', 'stone'],
      ['fall', 'stone'],
      ['rupture', 'stone'],
      ['rush', 'stone'],
      ['call', 'stone'],
    ],
    warlord: [
      ['cleave', 'steel'],
      ['bombard', 'ember'],
      ['command', 'steel'],
      ['rush', 'steel'],
    ],
    abyss: [
      ['breath', 'ember'],
      ['pressure', 'ash'],
      ['landing', 'stone'],
      ['call', 'ember'],
    ],
    citadel: [
      ['slam', 'steel'],
      ['channel', 'ash'],
      ['advance', 'steel'],
      ['furnace', 'ember'],
      ['command', 'steel'],
    ],
    cindermaw: [
      ['claw', 'ember'],
      ['rush', 'ash'],
      ['pool', 'ember'],
      ['call', 'ember'],
    ],
    darklord: [
      ['cleave', 'shadow'],
      ['bombard', 'shadow'],
      ['command', 'steel'],
      ['sweep', 'shadow'],
    ],
  });
  const captains = Object.freeze({
    'supply-vale': [
      ['rush', 'fur'],
      ['roots', 'root'],
      ['fan', 'dust'],
    ],
    'supply-march': [
      ['rush', 'mire'],
      ['fan', 'mire'],
      ['pool', 'mire'],
    ],
    'supply-highlands': [
      ['rush', 'stone'],
      ['fall', 'stone'],
      ['claw', 'fur'],
    ],
    'supply-crown': [
      ['bombard', 'ember'],
      ['rush', 'ash'],
      ['fan', 'ash'],
      ['call', 'ember'],
    ],
    'frontier-overseer': [
      ['cleave', 'steel'],
      ['bombard', 'ember'],
      ['rush', 'steel'],
    ],
  });
  const phases = Object.freeze({
    'supply-vale': ['scramble', 'dust'],
    'supply-march': ['molt', 'mire'],
    'supply-highlands': ['howl', 'fur'],
    'supply-crown': ['carapace', 'ash'],
    'frontier-overseer': ['command', 'steel'],
  });
  const captainBasics = Object.freeze({
    'supply-vale': ['cleave', 'fur'],
    'supply-march': ['bite', 'mire'],
    'supply-highlands': ['claw', 'fur'],
    'supply-crown': ['claw', 'ember'],
    'frontier-overseer': ['cleave', 'steel'],
  });
  const basicActions = Object.freeze({
    wolf: 'bite',
    goblin: 'cleave',
    skeleton: 'cleave',
    reedbeast: 'bite',
    mireling: 'bite',
    ogre: 'slam',
    orc: 'cleave',
    archer: 'sweep',
    crownguard: 'cleave',
    ashbeast: 'claw',
    wraith: 'claw',
    stalker: 'claw',
  });
  const species = Object.freeze({
    wolf: 'fur',
    goblin: 'dust',
    skeleton: 'bone',
    reedbeast: 'mire',
    mireling: 'mire',
    ogre: 'stone',
    orc: 'steel',
    archer: 'steel',
    crownguard: 'steel',
    ashbeast: 'ember',
    wraith: 'spectral',
    stalker: 'shadow',
  });
  const palette = Object.freeze({
    fur: ['#c8b58e', '#645b49'],
    bone: ['#e0d7b8', '#736d60'],
    root: ['#a8b877', '#596247'],
    mire: ['#9dab72', '#485c4d'],
    water: ['#b6dcdb', '#4c8e98'],
    stone: ['#cfbb98', '#736756'],
    steel: ['#d8d3bb', '#687677'],
    ember: ['#efb16e', '#884d3d'],
    ash: ['#b2aba0', '#625c57'],
    shadow: ['#b9a6c3', '#61526b'],
    spectral: ['#c4c8df', '#767394'],
    dust: ['#c7b187', '#77694e'],
  });
  const familyMaterial = Object.fromEntries(Object.entries(boss).map(([k, a]) => [k, a[0][1]]));
  function recipe(identity, a = {}, source = {}) {
    if (!identity) return null;
    const parts = identity.id.split('/');
    let pair;
    if (parts[0] === 'boss')
      pair = parts[2] === 'basic' ? boss[parts[1]]?.[0] : boss[parts[1]]?.[Number(parts[2])];
    else if (parts[0] === 'captain')
      pair =
        parts[2] === 'phase'
          ? phases[parts[1]]
          : parts[2] === 'basic'
            ? captainBasics[parts[1]]
            : captains[parts[1]]?.[Number(parts[2])];
    else if (parts[0] === 'night')
      pair = [parts[2] === 'drain' ? 'drain' : 'landing', species[parts[1]]];
    else if (parts[0] === 'projectile')
      pair = [
        'projectile',
        {
          arrow: 'bone',
          axe: 'steel',
          stone: 'stone',
          spit: 'mire',
          cinder: 'ember',
          spectral: 'spectral',
        }[parts[2]] || species[parts[1]],
      ];
    else if (parts[0] === 'rogue') {
      const material =
        parts[1] === 'boss'
          ? familyMaterial[parts[2]]
          : parts[1] === 'captain'
            ? captains[parts[2]]?.[0]?.[1]
            : species[parts[3]];
      const action =
        { scatter: 'howl', sweep: 'sweep', bind: 'roots', pivot: 'pivot', rally: 'command' }[
          a.effect
        ] ||
        { snare: 'bind', shove: 'shove', dash: 'pivot', withdraw: 'withdraw' }[a.style] ||
        'shove';
      pair = [action, material];
    } else if (parts[0] === 'enemy')
      pair = [parts[2] === 'frenzy' ? 'frenzy' : basicActions[parts[1]], species[parts[1]]];
    if (!pair?.[0] || !palette[pair[1]]) return null;
    // Individual species keep their actual material even when sharing a tactical action.
    return Object.freeze({
      action: pair[0],
      material: pair[1],
      colors: palette[pair[1]],
      trueForm: identity.variant === 'true',
      signature: !!a.rogueSignature,
      role: identity.role,
      ...(source.profile ? { profile: source.profile } : {}),
    });
  }
  let manifest = { version: 1, effects: {} },
    manifestSerial = 0;
  const disabled = new Set();
  function installManifest(m) {
    manifestSerial++;
    const valid = !V.validateManifest(m).length;
    manifest = valid ? m : { version: 1, effects: {} };
    return valid;
  }
  async function loadManifest() {
    const serial = ++manifestSerial;
    try {
      const res = await fetch('./assets/vfx/manifest.json');
      if (!res.ok) {
        if (serial === manifestSerial) installManifest({ version: 1, effects: {} });
        return false;
      }
      const m = await res.json();
      return serial === manifestSerial && installManifest(m);
    } catch {
      if (serial === manifestSerial) installManifest({ version: 1, effects: {} });
      return false;
    }
  }
  function stageAsset(ctx, screen, f, stage, elapsed) {
    const entry = manifest.effects?.[f.identity?.id];
    const asset =
      (f.identity?.variant === 'true' && entry?.variants?.true?.[stage]) || entry?.stages?.[stage];
    const sprites = root.PrototypeSprites;
    if (!V.validAsset(asset) || !sprites?.definition) return false;
    const definition = sprites.definition(asset.spriteKey);
    if (!definition || (asset.clip && !definition.clips?.[asset.clip])) return false;
    return sprites.drawStage(ctx, asset.spriteKey, screen(f), {
      clip: asset.clip,
      elapsedMs: elapsed * 1000,
      scale: asset.scale || 1,
    });
  }
  function localVisible(ctx, screen, f, stage) {
    const transform = ctx.getTransform?.(),
      sx = Math.abs(transform?.a || 1),
      sy = Math.abs(transform?.d || sx),
      width = (ctx.canvas?.width || 900) / sx,
      height = (ctx.canvas?.height || 600) / sy,
      entry = manifest.effects?.[f.identity?.id],
      asset =
        (f.identity?.variant === 'true' && entry?.variants?.true?.[stage]) ||
        entry?.stages?.[stage],
      definition = V.validAsset(asset) && root.PrototypeSprites?.definition?.(asset.spriteKey),
      scale = (asset?.scale || 1) * (definition?.scale || 1),
      margin = Math.max(
        96,
        (definition?.displayWidth || 0) * scale,
        (definition?.displayHeight || 0) * scale,
      ),
      p = screen(f);
    return (
      p.x + margin >= 0 && p.x - margin <= width && p.y + margin >= 0 && p.y - margin <= height
    );
  }
  function enabled(game, identity, stage) {
    return game.enemyVfxEnabled !== false && !disabled.has(identity.id + ':' + stage);
  }
  function rollback(id, stage, value = true) {
    const key = id + ':' + stage;
    value ? disabled.add(key) : disabled.delete(key);
  }
  function active(game) {
    return (
      typeof game.enemyVfxEpoch === 'function' &&
      game.enemyVfxEnabled !== false &&
      game.hero.hp > 0 &&
      !game.s.challenge?.pending &&
      !game.s.challenge?.gameOver
    );
  }
  function valid(game, f) {
    return (
      f.zone === game.zoneId &&
      f.epoch === (game.enemyVfxEpoch?.() || 0) &&
      game.hero.hp > 0 &&
      !game.s.challenge?.pending &&
      !game.s.challenge?.gameOver &&
      game.zone().enemies.some((e) => e.id === f.source && e.hp > 0 && !e.returning)
    );
  }
  const deliveries = new WeakMap();
  function queue(events, game, current) {
    const epoch = game.enemyVfxEpoch?.() || 0;
    let delivered = deliveries.get(game);
    if (!delivered || delivered.epoch !== epoch) {
      delivered = { epoch, ids: new Set() };
      deliveries.set(game, delivered);
    }
    const next = current.filter((f) => f.type !== 'enemyVfx' || valid(game, f)),
      ids = new Set(next.filter((f) => f.type === 'enemyVfx').map((f) => f.eventId));
    for (const f of events)
      if (
        f.type === 'enemyVfx' &&
        f.stage !== 'windup' &&
        valid(game, f) &&
        !ids.has(f.eventId) &&
        !delivered.ids.has(f.eventId) &&
        game.s.time - f.at <= f.duration &&
        recipe(f.identity, f.geometry, f) &&
        enabled(game, f.identity, f.stage)
      ) {
        // Ground footprint is already the payoff: victim accents remain tiny and subordinate.
        next.push({
          ...f,
          life: f.duration,
          max: f.duration,
          priority: f.identity.tier === 'boss' || f.identity.tier === 'captain' ? 5 : 3,
        });
        ids.add(f.eventId);
        delivered.ids.add(f.eventId);
        while (delivered.ids.size > 512) delivered.ids.delete(delivered.ids.values().next().value);
      }
    return next;
  }
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function line(ctx, screen, points, color, width = 1.6) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach((p, j) => {
      const q = screen(p);
      j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    });
    ctx.stroke();
  }
  function curve(ctx, screen, a, b, c, color, width = 1.6) {
    const p = screen(a),
      q = screen(b),
      r = screen(c);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(q.x, q.y, r.x, r.y);
    ctx.stroke();
  }
  function ellipse(ctx, screen, point, rx, ry, color, width = 1.5) {
    const p = screen(point);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  function chip(ctx, screen, p, size, colors, height = 0) {
    const q = screen(p);
    ctx.fillStyle = colors[1];
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(q.x - size, q.y - height);
    ctx.lineTo(q.x - size * 0.35, q.y - size * 0.8 - height);
    ctx.lineTo(q.x + size, q.y - size * 0.3 - height);
    ctx.lineTo(q.x + size * 0.65, q.y + size * 0.5 - height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  function offset(p, r, angle) {
    return { x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r };
  }
  function arc(ctx, screen, p, r, angle, half, color, width = 2) {
    line(
      ctx,
      screen,
      Array.from({ length: 13 }, (_, j) => offset(p, r, angle - half + (j * half) / 6)),
      color,
      width,
    );
  }
  function dust(ctx, screen, p, r, progress, colors, n = 4) {
    for (let j = 0; j < n; j++) {
      const q = offset(p, r * (0.3 + progress * 0.5), j * 2.4);
      ellipse(ctx, screen, q, 4 + progress * 5, 2 + progress, colors[j % 2], 1.4);
    }
  }
  function surface(ctx, screen, p, r, rec, progress, n = 5, angle = 0) {
    const [light, dark] = rec.colors,
      mat = rec.material;
    for (let j = 0; j < n; j++) {
      const t = j * 2.399,
        q = offset(p, r * (0.22 + (j % 3) * 0.2), t);
      if (mat === 'stone' || mat === 'steel' || mat === 'bone') {
        if (rec.action === 'fall' || rec.action === 'bombard')
          chip(ctx, screen, q, 4 + (j % 2) * 2, rec.colors, (1 - progress) * 18);
        else
          line(
            ctx,
            screen,
            [q, offset(q, 8 + progress * 10, t + 0.45), offset(q, 15 + progress * 17, t + 0.2)],
            j % 2 ? light : dark,
            1.8,
          );
      } else if (mat === 'root') {
        curve(
          ctx,
          screen,
          offset(q, 16, t + Math.PI),
          offset(q, 11, t + 0.8),
          offset(q, 17 + progress * 12, t),
          dark,
          3.2,
        );
        curve(
          ctx,
          screen,
          offset(q, 16, t + Math.PI),
          offset(q, 11, t + 0.8),
          offset(q, 17 + progress * 12, t),
          light,
          1.2,
        );
        line(ctx, screen, [q, offset(q, 10, t + 1.1)], light, 1.3);
      } else if (mat === 'water' || mat === 'mire') {
        if (mat === 'water') arc(ctx, screen, q, 9 + progress * 17, angle + j, 0.65, light, 1.6);
        else {
          ellipse(ctx, screen, q, 7 + progress * 7, 2 + progress * 2, dark, 2.6);
          ellipse(ctx, screen, q, 5 + progress * 5, 1.7, light, 1.2);
        }
      } else if (mat === 'ember') {
        const a = screen(q);
        ctx.fillStyle = j % 2 ? dark : light;
        ctx.beginPath();
        ctx.moveTo(a.x - 3, a.y + 1);
        ctx.quadraticCurveTo(
          a.x - 5,
          a.y - 5,
          a.x + (j % 2 ? 3 : -2),
          a.y - 9 - (1 - progress) * 9,
        );
        ctx.quadraticCurveTo(a.x + 5, a.y - 3, a.x + 3, a.y + 1);
        ctx.fill();
      } else if (mat === 'shadow' || mat === 'spectral') {
        curve(ctx, screen, offset(q, 14, t), offset(q, 7, t + 0.8), offset(q, 2, t), dark, 3.5);
        curve(ctx, screen, offset(q, 13, t), offset(q, 7, t + 0.8), q, light, 1.5);
      } else dust(ctx, screen, q, 6, progress, rec.colors, 1);
    }
  }
  function clipShapes(ctx, screen, shapes) {
    ctx.beginPath();
    for (const points of shapes) {
      points.forEach((q, j) => {
        const p = screen(q);
        j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      });
      ctx.closePath();
    }
    ctx.clip();
  }
  function footprint(ctx, screen, f, game, progress, density) {
    const a = f.geometry,
      rec = recipe(f.identity, a, f),
      fx = FX;
    if (!rec || !fx) return;
    if (a.kind === 'summon' || a.kind === 'volley' || a.kind === 'ring') return;
    const patches = game.attackPatches(a),
      shapes = fx.warningShapes(a, patches);
    ctx.save();
    clipShapes(ctx, screen, shapes);
    ctx.globalAlpha = 0.65 * (f.life / f.max);
    if (a.kind === 'cone' || a.kind === 'sector') {
      const center = { x: a.x, y: a.y },
        half = a.kind === 'sector' ? 0.65 : 1.1;
      if (['cleave', 'claw', 'bite', 'sweep'].includes(rec.action)) {
        for (let j = 0; j < (rec.action === 'claw' ? 3 : 2); j++)
          arc(
            ctx,
            screen,
            center,
            a.radius * (0.4 + progress * 0.36 + j * 0.07),
            a.angle,
            half * 0.76,
            rec.colors[j % 2],
            j ? 1.5 : 3,
          );
      } else {
        for (let j = 0; j < density; j++) {
          const p = offset(
            center,
            a.radius * (0.2 + progress * 0.55),
            a.angle + ((j - (density - 1) / 2) * half) / density,
          );
          surface(ctx, screen, p, 18, rec, progress, 2, a.angle);
        }
      }
    } else if (a.kind === 'line') {
      for (const o of a.count === 2 ? [-85, 85] : [0]) {
        const side = { x: -Math.sin(a.angle) * o, y: Math.cos(a.angle) * o },
          from = { x: a.fromX + side.x, y: a.fromY + side.y },
          to = { x: a.x + side.x, y: a.y + side.y };
        for (let j = 0; j < density; j++) {
          const t = (j + 0.5) / density,
            p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
          surface(ctx, screen, p, 18, rec, progress, 2, a.angle);
        }
        if (rec.action === 'channel')
          curve(
            ctx,
            screen,
            from,
            { x: (from.x + to.x) / 2 + Math.sin(progress * 2) * 10, y: (from.y + to.y) / 2 - 10 },
            to,
            rec.colors[0],
            2,
          );
      }
    } else
      for (const p of patches) {
        if (['slam', 'landing', 'bombard'].includes(rec.action)) {
          arc(ctx, screen, p, p.radius * (0.25 + progress * 0.4), 0.6, 2.5, rec.colors[1], 3);
          arc(ctx, screen, p, p.radius * (0.28 + progress * 0.4), 0.6, 2.4, rec.colors[0], 1.3);
        }
        if (rec.action === 'landing' && rec.material === 'fur')
          for (let j = 0; j < 3; j++)
            line(
              ctx,
              screen,
              [offset(p, p.radius * 0.15, j * 0.22 + 2), offset(p, p.radius * 0.6, j * 0.22 + 2)],
              rec.colors[0],
              2,
            );
        else surface(ctx, screen, p, p.radius, rec, progress, density, a.angle);
      }
    ctx.restore();
  }
  function local(ctx, screen, f, rec, progress, stage) {
    const [light, dark] = rec.colors,
      p = { x: f.x, y: f.y },
      actorStage = stage === 'phase' || stage === 'windup' || stage === 'release';
    const q = screen(p);
    ctx.save();
    ctx.globalAlpha = stage === 'windup' ? 0.55 : 0.75 * (f.life / f.max || 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stage === 'spawn') {
      surface(ctx, screen, p, 24, { ...rec, action: 'fall' }, progress, 3);
      ellipse(ctx, screen, p, 12 + progress * 5, 4, light, 1.3);
    } else if (stage === 'phase' && rec.action === 'carapace') {
      // Two settling shell plates, leaving the face and central body visible.
      for (const side of [-1, 1]) {
        ctx.strokeStyle = dark;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(q.x + side * (23 + (1 - progress) * 7), q.y - 12);
        ctx.lineTo(q.x + side * (31 + (1 - progress) * 8), q.y - 26);
        ctx.lineTo(q.x + side * 22, q.y - 45);
        ctx.stroke();
        ctx.strokeStyle = light;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      dust(ctx, screen, p, 24, progress, rec.colors, 3);
    } else if (stage === 'phase' && rec.action === 'molt') {
      for (const side of [-1, 1])
        curve(
          ctx,
          screen,
          { x: p.x + side * 14, y: p.y },
          { x: p.x + side * (25 + progress * 12), y: p.y - 6 },
          { x: p.x + side * (32 + progress * 16), y: p.y + 7 },
          light,
          2.2,
        );
      dust(ctx, screen, p, 24, progress, rec.colors, 3);
    } else if (['howl', 'call', 'command', 'frenzy'].includes(rec.action) || stage === 'phase') {
      if (rec.action === 'howl' || (rec.action === 'call' && rec.material === 'fur'))
        for (let j = 0; j < 2; j++) {
          ctx.strokeStyle = j ? light : dark;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(q.x, q.y - 36, 10 + progress * 14 + j * 6, -2.7, -0.45);
          ctx.stroke();
        }
      else if (rec.action === 'command' || rec.action === 'frenzy') {
        for (const side of [-1, 1]) {
          ctx.strokeStyle = light;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(q.x + side * 14, q.y - 34);
          ctx.lineTo(q.x + side * 23, q.y - 41 - progress * 5);
          ctx.lineTo(q.x + side * 20, q.y - 48 - progress * 5);
          ctx.stroke();
        }
      } else surface(ctx, screen, p, 25, rec, progress, 4);
    } else if (rec.action === 'drain') {
      for (let j = 0; j < 3; j++) {
        const from = offset(p, 28 - progress * 18, j * 2.1);
        curve(ctx, screen, from, offset(p, 18, j * 2.1 + 0.5), offset(p, 5, j * 2.1), light, 1.8);
      }
    } else if (
      actorStage &&
      ['claw', 'cleave', 'bite', 'sweep', 'volley', 'breath', 'fan'].includes(rec.action)
    ) {
      const angle = f.geometry?.angle || 0;
      if (stage === 'windup') {
        for (const side of [-1, 1])
          line(
            ctx,
            screen,
            [offset(p, 14, angle + side * 0.7), offset(p, 23, angle + side * 0.5)],
            light,
            1.8,
          );
      } else if (rec.action === 'volley')
        for (const delta of [-0.22, 0, 0.22])
          line(ctx, screen, [offset(p, 8, angle + delta), offset(p, 28, angle + delta)], light, 2);
      else arc(ctx, screen, p, 25 + progress * 15, angle, 0.7, light, 2.6);
    } else if (rec.action === 'bind' || rec.action === 'roots') {
      surface(
        ctx,
        screen,
        p,
        26,
        rec.material === 'dust'
          ? rec
          : { ...rec, material: rec.material === 'water' ? 'water' : 'root' },
        progress,
        3,
      );
    } else if (
      rec.action === 'shove' ||
      rec.action === 'pivot' ||
      rec.action === 'withdraw' ||
      rec.action === 'rush' ||
      rec.action === 'advance'
    ) {
      const angle = (f.geometry?.angle || 0) + (rec.action === 'withdraw' ? Math.PI : 0);
      for (const side of [-1, 1])
        line(
          ctx,
          screen,
          [offset(p, 8, angle + side * 0.7), offset(p, 22 + progress * 10, angle + side * 0.4)],
          light,
          2,
        );
      if (rec.material === 'dust' || rec.material === 'ash' || rec.material === 'fur')
        dust(ctx, screen, p, 18, progress, rec.colors, 3);
    } else surface(ctx, screen, p, actorStage ? 22 : 14, rec, progress, actorStage ? 3 : 2);
    if (rec.trueForm && stage === 'release') {
      line(
        ctx,
        screen,
        [
          { x: p.x - 5, y: p.y + 7 },
          { x: p.x, y: p.y + 10 },
          { x: p.x + 5, y: p.y + 7 },
        ],
        '#dcc58b',
        1.4,
      );
    }
    ctx.restore();
  }
  function ground(ctx, screen, game, effects) {
    if (!active(game)) return;
    if (
      !effects.some((f) => f.type === 'enemyVfx' && f.stage === 'impact' && !f.target) &&
      !game.s.hazards.length &&
      !game.zone().enemies.some((e) => e.motion)
    )
      return;
    ctx.save();
    // Keep material action visible through night grading without painting over bodies.
    const transform = ctx.getTransform?.(),
      scaleToCanvas = transform?.a || 1,
      viewWidth = (ctx.canvas?.width || 900) / scaleToCanvas,
      viewHeight = (ctx.canvas?.height || 600) / scaleToCanvas;
    for (const u of [game.hero, ...game.s.party, ...game.zone().enemies])
      if (u.hp > 0 && u.active !== false) {
        const p = screen(u),
          scale = u.visualScale || 1;
        if (
          p.x + 18 * scale < 0 ||
          p.x - 18 * scale > viewWidth ||
          p.y + 7 * scale < 0 ||
          p.y - 57 * scale > viewHeight
        )
          continue;
        ctx.beginPath();
        ctx.rect(-10000, -10000, 20000, 20000);
        ctx.moveTo(p.x + 18 * scale, p.y - 25 * scale);
        ctx.ellipse(p.x, p.y - 25 * scale, 18 * scale, 32 * scale, 0, 0, Math.PI * 2);
        // Intersect exclusions: overlapping squad silhouettes must stay protected.
        ctx.clip('evenodd');
      }
    const density =
      game.zone().enemies.filter((e) => e.hp > 0 && (e.telegraph || e.motion)).length > 5 ? 3 : 5;
    for (const f of effects)
      if (
        f.type === 'enemyVfx' &&
        valid(game, f) &&
        f.stage === 'impact' &&
        !f.target &&
        enabled(game, f.identity, 'impact')
      ) {
        if (!stageAsset(ctx, screen, f, 'impact', f.max - f.life))
          footprint(ctx, screen, f, game, 1 - f.life / f.max, density);
      }
    for (const h of game.s.hazards) {
      const m = game.enemyVfxHazard?.(h);
      if (
        !m ||
        m.epoch !== game.enemyVfxEpoch() ||
        !game.zone().enemies.includes(m.e) ||
        m.e.hp <= 0 ||
        m.e.returning ||
        !enabled(game, m.identity, h.kind === 'ring' ? 'travel' : 'linger')
      )
        continue;
      const rec = recipe(m.identity, m.a, m.e);
      if (!rec) continue;
      ctx.save();
      ctx.globalAlpha = h.kind === 'ring' ? 0.75 : 0.45;
      const stage = h.kind === 'ring' ? 'travel' : 'linger';
      if (!stageAsset(ctx, screen, { ...h, identity: m.identity }, stage, h.age || 0)) {
        if (h.kind === 'ring') {
          const n = density * 2;
          for (let j = 0; j < n; j++) {
            const p = offset(h, h.radius, (j * Math.PI * 2) / n);
            if (rec.action === 'rupture')
              chip(ctx, screen, p, 5 + (j % 2), rec.colors, 5 + Math.sin(h.age * 5 + j) * 3);
            else
              arc(ctx, screen, p, 10, Math.atan2(p.y - h.y, p.x - h.x), 0.65, rec.colors[0], 1.6);
          }
        } else {
          ctx.save();
          FX.circlePath(ctx, screen, h, h.radius);
          ctx.clip();
          surface(ctx, screen, h, h.radius, rec, clamp((h.age || 0) * 0.6, 0, 1), density);
          ctx.restore();
        }
      }
      ctx.restore();
    }
    for (const e of game.zone().enemies)
      if (e.hp > 0 && !e.returning && e.motion) {
        const a = e.motion,
          id = V.describe(e, a);
        if (!id || !enabled(game, id, 'travel')) continue;
        const f = { x: e.x, y: e.y, geometry: a, identity: id, life: 1, max: 1 };
        const m = game.enemyVfxMotion?.(a);
        if (m && m.epoch !== game.enemyVfxEpoch()) continue;
        if (!stageAsset(ctx, screen, f, 'travel', Math.max(0, (m?.initialLife ?? a.life) - a.life)))
          local(ctx, screen, f, { ...recipe(id, a, e), action: 'rush' }, 0.5, 'travel');
      }
    ctx.restore();
  }
  function actors(ctx, screen, game, effects) {
    if (!active(game)) return;
    for (const e of game.zone().enemies)
      if (e.hp > 0 && !e.returning && e.telegraph) {
        const a = e.telegraph,
          id = V.describe(e, a),
          rec = recipe(id, a, e);
        if (!rec || !enabled(game, id, 'windup')) continue;
        const progress = clamp(1 - a.timer / Math.max(0.01, a.total), 0, 1),
          f = { x: e.x, y: e.y, identity: id, geometry: a, life: 1, max: 1 };
        if (!localVisible(ctx, screen, f, 'windup')) continue;
        if (!stageAsset(ctx, screen, f, 'windup', Math.max(0, a.total - a.timer)))
          local(ctx, screen, f, rec, progress, 'windup');
      }
    for (const f of effects)
      if (
        f.type === 'enemyVfx' &&
        valid(game, f) &&
        !(f.stage === 'impact' && !f.target) &&
        enabled(game, f.identity, f.stage)
      ) {
        if (!localVisible(ctx, screen, f, f.stage)) continue;
        const rec = recipe(f.identity, f.geometry, f);
        if (!rec) continue;
        ctx.save();
        ctx.globalAlpha = f.life / f.max;
        if (!stageAsset(ctx, screen, f, f.stage, f.max - f.life))
          local(ctx, screen, f, rec, 1 - f.life / f.max, f.stage);
        ctx.restore();
      }
  }
  function projectile(ctx, screen, p, game) {
    if (p.source !== 'enemy' || p.delay > 0 || game.enemyVfxEnabled === false) return false;
    const m = game.enemyVfxProjectile?.(p),
      e = m?.e || game.zone().enemies.find((e) => e.id === p.sourceId),
      id = m?.identity || V.projectile(e, p),
      rec = recipe(id, m?.a || p, e || {});
    if (!rec || !enabled(game, id, 'travel')) return false;
    const f = { ...p, identity: id };
    if (stageAsset(ctx, screen, f, 'travel', Math.max(0, (m?.initialLife ?? p.life) - p.life)))
      return true;
    const q = screen(p),
      tail = screen({ x: p.x - (p.dx || 0) * 20, y: p.y - (p.dy || 0) * 20 }),
      angle = Math.atan2(q.y - tail.y, q.x - tail.x);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(angle);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rec.colors[0];
    ctx.fillStyle = rec.colors[1];
    if (rec.material === 'bone' && m?.a.kind === 'volley') {
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(7, -2);
      ctx.lineTo(9, -4);
      ctx.lineTo(12, -2);
      ctx.lineTo(11, 2);
      ctx.lineTo(8, 3);
      ctx.lineTo(-8, 2);
      ctx.lineTo(-11, 4);
      ctx.lineTo(-13, 1);
      ctx.lineTo(-12, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.style === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(4, -3);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 3);
      ctx.moveTo(-8, 0);
      ctx.lineTo(-12, -3);
      ctx.moveTo(-8, 0);
      ctx.lineTo(-12, 3);
      ctx.stroke();
    } else if (p.style === 'axe') {
      ctx.rotate(p.life * 8);
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1, -5);
      ctx.quadraticCurveTo(11, -6, 11, 4);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.style === 'stone') {
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(3, -5);
      ctx.lineTo(7, 0);
      ctx.lineTo(2, 4);
      ctx.lineTo(-6, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.style === 'spit') {
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.quadraticCurveTo(1, -6, 6, -2);
      ctx.quadraticCurveTo(10, 3, 3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rec.colors[0];
      ctx.fillRect(-13, -1, 3, 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(-13, -3);
      ctx.quadraticCurveTo(-3, 1, 5, -4);
      ctx.quadraticCurveTo(11, 0, 5, 4);
      ctx.quadraticCurveTo(-3, 2, -13, 3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return true;
  }
  const api = {
    recipe,
    boss,
    captains,
    phases,
    palette,
    queue,
    valid,
    ground,
    actors,
    projectile,
    installManifest,
    loadManifest,
    rollback,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeEnemyVfxArt = api;
  if (typeof document !== 'undefined') loadManifest();
})(typeof window !== 'undefined' ? window : globalThis);
