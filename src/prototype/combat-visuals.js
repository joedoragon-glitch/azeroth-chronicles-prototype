/* Procedural combat presentation. Geometry stays in world coordinates until projection. */
(function (root) {
  'use strict';
  const R = typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js'),
    G = R.combatGeometry;
  function polygon(ctx, screen, points) {
    ctx.beginPath();
    points.forEach((q, j) => {
      const p = screen(q);
      j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    });
    ctx.closePath();
  }
  function circlePoints(center, radius, steps = 48) {
    return Array.from({ length: steps }, (_, j) => {
      const a = (j * Math.PI * 2) / steps;
      return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
    });
  }
  function circlePath(ctx, screen, center, radius) {
    polygon(ctx, screen, circlePoints(center, Math.max(0, radius)));
  }
  function capsulePoints(from, to, radius) {
    const a = Math.atan2(to.y - from.y, to.x - from.x),
      points = [];
    for (let j = 0; j <= 16; j++) {
      const t = a - Math.PI / 2 + (j * Math.PI) / 16;
      points.push({ x: to.x + Math.cos(t) * radius, y: to.y + Math.sin(t) * radius });
    }
    for (let j = 0; j <= 16; j++) {
      const t = a + Math.PI / 2 + (j * Math.PI) / 16;
      points.push({ x: from.x + Math.cos(t) * radius, y: from.y + Math.sin(t) * radius });
    }
    return points;
  }
  function sectorPoints(center, radius, angle, halfAngle) {
    return [
      center,
      ...Array.from({ length: 33 }, (_, j) => {
        const a = angle - halfAngle + (j * halfAngle) / 16;
        return { x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius };
      }),
    ];
  }
  function visibleWarning(e) {
    return (
      e.telegraph &&
      !e.telegraph.anonymousCast &&
      (e.telegraph.total > 0 || !e.telegraph.captainSkill)
    );
  }
  function cordonPoints(a, filled = false) {
    const center = a,
      start = a.gapAngle + a.gapWidth / 2,
      span = Math.PI * 2 - a.gapWidth,
      outer = a.radius + a.width,
      inner = filled ? 0 : Math.max(0, a.radius - a.width),
      arc = (radius, reverse = false) =>
        Array.from({ length: 65 }, (_, j) => {
          const angle = start + span * (reverse ? 1 - j / 64 : j / 64);
          return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
        });
    return [...arc(outer), ...arc(inner, true)];
  }
  function warningShapes(a, patches) {
    if (a.kind === 'summon' || a.selfDefense) return [];
    if (a.arenaLines)
      return a.arenaLines.map((line) =>
        capsulePoints({ x: line.fromX, y: line.fromY }, line, line.halfWidth),
      );
    if (a.dreadMechanic === 'closure') return dreadClosureShapes(a);
    if (a.cinderMechanic === 'cordon' && Number.isFinite(a.gapAngle))
      return [cordonPoints({ ...a, radius: a.initialRadius })];
    if (a.kind === 'pattern-charge') {
      const points = [{ x: a.fromX, y: a.fromY }, ...(a.path || [])];
      return points.slice(1).map((to, i) => capsulePoints(points[i], to, G.chargeHalfWidth));
    }
    if (a.kind === 'canister') {
      const from = { x: a.fromX, y: a.fromY };
      return Array.from({ length: 9 }, (_, i) => {
        const angle = a.angle + (i - 4) * 0.115;
        return capsulePoints(
          from,
          { x: from.x + Math.cos(angle) * a.radius, y: from.y + Math.sin(angle) * a.radius },
          G.canisterHalfWidth,
        );
      });
    }
    if (a.kind === 'formation' || a.kind === 'checkerboard') return [];
    if (a.kind === 'line' || a.kind === 'volley')
      return (
        a.kind === 'volley'
          ? a.tracking
            ? [0]
            : [-0.22, 0, 0.22]
          : a.count === 2
            ? [-85, 85]
            : [0]
      ).map((o) => {
        const angle = a.angle + (a.kind === 'volley' ? o : 0),
          offset = a.kind === 'volley' ? 0 : o,
          side = { x: -Math.sin(angle), y: Math.cos(angle) },
          from = { x: a.fromX + side.x * offset, y: a.fromY + side.y * offset },
          to =
            a.kind === 'volley'
              ? {
                  x:
                    from.x +
                    Math.cos(angle) *
                      (a.tracking
                        ? a.shotSpeed * a.shotLife
                        : 650 * R.balance.enemySpecialReachMultiplier),
                  y:
                    from.y +
                    Math.sin(angle) *
                      (a.tracking
                        ? a.shotSpeed * a.shotLife
                        : 650 * R.balance.enemySpecialReachMultiplier),
                }
              : { x: a.x + side.x * offset, y: a.y + side.y * offset },
          width =
            a.kind === 'volley'
              ? 22
              : a.charge
                ? a.dreadMechanic === 'rush'
                  ? a.radius
                  : G.chargeHalfWidth
                : a.count === 2
                  ? G.dualLineHalfWidth
                  : G.lineHalfWidth;
        return capsulePoints(from, to, width);
      });
    if (a.kind === 'cone' || a.kind === 'sector') {
      if (a.angleDegrees === 360) return [circlePoints(a, a.radius)];
      const halfAngle = a.angleDegrees
        ? (a.angleDegrees * Math.PI) / 360
        : a.kind === 'sector'
          ? 0.65
          : 1.1;
      return [sectorPoints(a, a.radius, a.angle, halfAngle)];
    }
    if (a.kind === 'ring')
      return [
        circlePoints(
          { x: a.fromX, y: a.fromY },
          (a.slowOnly
            ? a.waveSpeed * a.waveLife
            : G.ringSpeed * G.ringLife * R.bossCadence.areaRangeMultiplier) + G.ringHalfWidth,
        ),
      ];
    return patches.map((p) => circlePoints(p, p.radius));
  }
  function dreadClosureShapes(a) {
    const gaps = [...a.gaps]
      .map((angle) => (angle + Math.PI * 2) % (Math.PI * 2))
      .sort((x, y) => x - y);
    return gaps.map((angle, index) => {
      const start = angle + a.gapWidth / 2,
        end =
          gaps[(index + 1) % gaps.length] +
          (index === gaps.length - 1 ? Math.PI * 2 : 0) -
          a.gapWidth / 2,
        arc = (radius, reverse) =>
          Array.from({ length: 49 }, (_, j) => {
            const t = start + (end - start) * (reverse ? 1 - j / 48 : j / 48);
            return { x: a.x + Math.cos(t) * radius, y: a.y + Math.sin(t) * radius };
          });
      return [...arc(a.radius + a.width, false), ...arc(Math.max(0, a.radius - a.width), true)];
    });
  }
  function strokeWorld(ctx, screen, a, b, color, width = 1) {
    const p = screen(a),
      q = screen(b);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  function hazardKind(a) {
    return a.slowOnly
      ? 'cold'
      : a.manaDrain
        ? 'spectral'
        : a.slow
          ? 'mire'
          : a.family === 'abyss' || a.family === 'cindermaw'
            ? 'ember'
            : a.family === 'mine' || a.family === 'ridge'
              ? 'stone'
              : 'ritual';
  }
  // Presentation-only status for Royal Taxation. The marked recipients
  // remain on the original combat roster, not a separate targeting list.
  // These are actor labels, never false ground-impact warnings.
  function royalTaxStatus(ctx, screen, game) {
    let drawn = 0;
    for (const lord of game
      .zone()
      .enemies.filter((e) => e.family === 'darklord' && e.type === 'boss' && e.hp > 0)) {
      const tax = lord.royalTaxation,
        active = tax && tax.expires > game.s.time && tax.marked?.length;
      if (active) {
        for (const unit of [game.hero, ...game.activeLivingParty()]) {
          const identity = unit === game.hero ? 'hero' : unit.id;
          if (unit.hp <= 0 || !tax.marked.includes(identity)) continue;
          const p = screen(unit);
          ctx.save();
          ctx.translate(p.x, p.y - 58);
          ctx.fillStyle = '#e0c0fa';
          ctx.strokeStyle = '#5b366b';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(7, -4);
          ctx.lineTo(0, 3);
          ctx.lineTo(-7, -4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.font = 'bold 9px system-ui';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f1d9ff';
          ctx.fillText('TAX', 0, -15);
          ctx.restore();
          drawn++;
        }
        const p = screen(lord);
        ctx.save();
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f1d9ff';
        ctx.fillText('ROYAL TAX · ' + Math.ceil(tax.expires - game.s.time) + 's', p.x, p.y - 82);
        ctx.restore();
      }
      if (lord.royalTaxShield > 0) {
        const p = screen(lord);
        ctx.save();
        ctx.strokeStyle = '#d6b7f2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 14, 30, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#f0d6ff';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('ROYAL SHIELD', p.x, p.y - 82);
        ctx.restore();
        drawn++;
      }
    }
    return drawn;
  }
  // Floating cast information is separate from floor warnings, so danger
  // geometry can sit beneath every actor/prop without burying the cast clock.
  function actorCues(ctx, screen, game, heightFor = null) {
    const cueHeight = (e) =>
      Math.max(
        e.type === 'boss' ? 105 : e.captain || e.roomCaptain ? 78 : 65,
        (heightFor?.(e) || 0) + (e.form === 'true' && e.type === 'boss' ? 46 : 26),
      );
    // Read the real presentation obstacle once per cue pass. Headless Canvas
    // callers have no DOM; their full viewport remains available.
    const hudRect = ctx.canvas?.ownerDocument?.getElementById?.('hud')?.getBoundingClientRect?.(),
      canvasRect = ctx.canvas?.getBoundingClientRect?.();
    ctx.save();
    for (const e of game
      .zone()
      .enemies.filter((e) => e.telegraph?.anonymousCast || e.telegraph?.mobileRogueCast)) {
      const a = e.telegraph,
        p = screen(e);
      const transform = ctx.getTransform?.(),
        scaleX = Math.abs(transform?.a || 1),
        scaleY = Math.abs(transform?.d || 1),
        left = (4 - (transform?.e || 0)) / scaleX,
        right = ((ctx.canvas?.width || 1280) - 4 - (transform?.e || 0)) / scaleX,
        top = (4 - (transform?.f || 0)) / scaleY,
        bottom = ((ctx.canvas?.height || 800) - 4 - (transform?.f || 0)) / scaleY;
      ctx.font = 'bold 11px system-ui';
      const label = a.anonymousCast ? 'Preparing…' : a.name,
        maxWidth = Math.max(24, Math.min(240, right - left)),
        textWidth = Math.min(ctx.measureText(label).width, maxWidth),
        halfWidth = Math.max(37, textWidth / 2);
      let center = Math.max(left + halfWidth, Math.min(right - halfWidth, p.x));
      const width = 70,
        height = 8;
      // Keep the complete label and progress border inside the backing canvas
      // even when tall artwork reaches above a landscape phone viewport.
      let y = Math.max(
        top + 44,
        Math.min(bottom - height - 2, p.y - (heightFor ? cueHeight(e) : 65)),
      );
      if (hudRect?.width && canvasRect?.width) {
        const ratioX = ctx.canvas.width / canvasRect.width,
          ratioY = ctx.canvas.height / canvasRect.height,
          hud = {
            left: ((hudRect.left - canvasRect.left) * ratioX - (transform?.e || 0)) / scaleX,
            right: ((hudRect.right - canvasRect.left) * ratioX - (transform?.e || 0)) / scaleX,
            top: ((hudRect.top - canvasRect.top) * ratioY - (transform?.f || 0)) / scaleY,
            bottom: ((hudRect.bottom - canvasRect.top) * ratioY - (transform?.f || 0)) / scaleY,
          };
        if (
          center - halfWidth < hud.right &&
          center + halfWidth > hud.left &&
          y - 17 < hud.bottom &&
          y + height + 2 > hud.top
        ) {
          if (right - hud.right >= halfWidth * 2 + 8)
            center = Math.max(center, hud.right + halfWidth + 8);
          else if (hud.left - left >= halfWidth * 2 + 8)
            center = Math.min(center, hud.left - halfWidth - 8);
          else y = Math.min(bottom - height - 2, Math.max(y, hud.bottom + 18));
        }
      }
      const x = center - width / 2,
        fill = Math.max(0, Math.min(1, 1 - a.timer / a.total));
      ctx.fillStyle = '#1b233080';
      ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
      ctx.fillStyle = '#e5b963';
      ctx.fillRect(x, y, width * fill, height);
      ctx.strokeStyle = '#f2d99b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, height);
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff1c7';
      const labelX = Math.max(left + textWidth / 2, Math.min(right - textWidth / 2, center));
      ctx.fillText(label, labelX, y - 5, maxWidth);
    }
    royalTaxStatus(ctx, screen, game);
    // Ledger of Losses deliberately obscures Ridge's ground footprints,
    // including separate rogue moves. It must NEVER obscure the cast itself:
    // attach a high-contrast progress bar to the actual boss, not the terrain.
    for (const e of game
      .zone()
      .enemies.filter(
        (e) =>
          e.family === 'ridge' &&
          e.ledgerOpen &&
          !e.telegraph?.mobileRogueCast &&
          visibleWarning(e) &&
          e.hp > 0,
      )) {
      const a = e.telegraph,
        p = screen(e),
        w = 84,
        y = p.y - (heightFor ? cueHeight(e) : 82),
        total = Math.max(0.001, a.total || a.timer || 1),
        ready = Math.max(0, Math.min(1, 1 - a.timer / total));
      ctx.fillStyle = '#18212980';
      ctx.fillRect(p.x - w / 2 - 3, y - 3, w + 6, 15);
      ctx.fillStyle = '#6e5c3f';
      ctx.fillRect(p.x - w / 2, y, w, 8);
      ctx.fillStyle = a.rogueMove ? '#a8d7e6' : '#f4d085';
      ctx.fillRect(p.x - w / 2, y, w * ready, 8);
      ctx.strokeStyle = '#f4e4b5';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - w / 2, y, w, 8);
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px system-ui';
      ctx.fillStyle = '#fff4d7';
      ctx.fillText('LEDGER CAST', p.x, y - 8);
    }
    for (const e of game
      .zone()
      .enemies.filter(
        (e) =>
          visibleWarning(e) &&
          !e.telegraph?.mobileRogueCast &&
          !(e.family === 'ridge' && e.ledgerOpen),
      )) {
      const a = e.telegraph;
      // The skill belongs to the caster, not the player's marked landing point.
      const p = screen(e);
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      const transform = ctx.getTransform?.(),
        scale = transform?.a || 1,
        viewWidth = (ctx.canvas?.width || 1280) / scale,
        viewHeight = (ctx.canvas?.height || 800) / scale,
        maxWidth = Math.max(60, Math.min(240, viewWidth - 16)),
        words = (
          a.name +
          (a.stages ? ' · ' + a.stage + '/' + a.stages : '') +
          (a.rogueMove ? '' : ' · ' + Math.max(0, a.timer).toFixed(1) + 's')
        ).split(' '),
        lines = [];
      let current = '';
      for (const word of words) {
        const next = current ? current + ' ' + word : word;
        if (current && ctx.measureText(next).width > maxWidth - 16) {
          lines.push(current);
          current = word;
        } else current = next;
      }
      if (current) lines.push(current);
      if (a.rogueMove)
        lines.push(
          (a.rogueSignature ? 'SIGNATURE' : 'ROGUE') +
            ' · ' +
            Math.max(0, a.timer).toFixed(1) +
            's',
        );
      const w = Math.min(maxWidth, Math.max(...lines.map((t) => ctx.measureText(t).width)) + 16),
        h = 8 + lines.length * 15,
        left = Math.max(4, Math.min(viewWidth - w - 4, p.x - w / 2)),
        top = Math.max(4, Math.min(viewHeight - h - 4, p.y - cueHeight(e) - h));
      ctx.fillStyle = a.rogueMove ? '#192a367a' : '#241d1a7a';
      ctx.fillRect(left, top, w, h);
      ctx.strokeStyle =
        a.kind === 'summon'
          ? '#a8bb9b'
          : a.rogueSignature
            ? '#9cf1f0'
            : a.rogueMove
              ? '#8ecde6'
              : '#f4c984';
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, w, h);
      ctx.fillStyle = a.rogueMove ? '#f2fbff' : '#fff3c8';
      lines.forEach((t, j) => ctx.fillText(t, left + w / 2, top + 16 + j * 15));
    }
    ctx.restore();
  }
  function ground(ctx, screen, game, pass = 'fill', time = 0) {
    const cue = pass === 'cue' || pass === 'underlay-cue';
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const t of game.traps()) {
      const active = t.phase >= t.warningTime && t.phase < t.warningTime + t.activeTime,
        warning = t.phase < t.warningTime,
        p = screen(t);
      const points =
        t.kind === 'jet'
          ? capsulePoints(
              { x: t.x - t.length / 2, y: t.y },
              { x: t.x + t.length / 2, y: t.y },
              t.halfWidth,
            )
          : circlePoints(t, t.radius);
      polygon(ctx, screen, points);
      ctx.lineWidth = active ? 2.7 : 1.7;
      ctx.strokeStyle = active ? '#ffb27c' : warning ? '#f5cc79' : '#979d8666';
      ctx.fillStyle = active ? '#e64c414d' : warning ? '#e8bd5f26' : '#777b6519';
      if (cue) {
        if (active || warning) {
          ctx.setLineDash(warning ? [5, 4] : []);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        ctx.fill();
        ctx.strokeStyle = active ? '#ffae71' : warning ? '#dfc07a' : '#92957a';
        ctx.fillStyle = ctx.strokeStyle;
        if (t.kind === 'spikes')
          for (const dx of [-12, 0, 12]) {
            ctx.beginPath();
            ctx.moveTo(p.x + dx - 4, p.y + 5);
            ctx.lineTo(p.x + dx, p.y - (active ? 18 : 5));
            ctx.lineTo(p.x + dx + 4, p.y + 5);
            ctx.fill();
          }
        else if (t.kind === 'seal') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 7);
          ctx.lineTo(p.x + 12, p.y);
          ctx.lineTo(p.x, p.y + 7);
          ctx.lineTo(p.x - 12, p.y);
          ctx.closePath();
          ctx.stroke();
        } else if (active)
          for (let j = 0; j < 7; j++) {
            const q = screen({ x: t.x - t.length * 0.4 + (j * t.length * 0.8) / 6, y: t.y });
            ctx.strokeStyle = j % 2 ? '#ffc987' : '#f59361';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(q.x, q.y);
            ctx.quadraticCurveTo(
              q.x + 5 * Math.sin(time * 9 + j),
              q.y - 12,
              q.x + Math.sin(time * 7 + j) * 8,
              q.y - 22 - (j % 3) * 4,
            );
            ctx.stroke();
          }
      }
    }
    // Garun's projected works are passable plans; completed supports block travel.
    // These cues follow the actual props, not an invented damage footprint.
    for (const prop of (game.zone().props || []).filter(
      (p) => p.garunPreview || p.garunTemporary,
    )) {
      const solid = !!prop.garunTemporary;
      circlePath(ctx, screen, prop, solid ? Math.max(24, prop.r || 0) : 28);
      ctx.strokeStyle = solid ? '#e8b77b' : '#8bd9e4';
      ctx.lineWidth = solid ? 3 : 1.8;
      ctx.setLineDash(solid ? [] : [5, 5]);
      if (!cue && solid) {
        ctx.fillStyle = '#b77d4d58';
        ctx.fill();
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (cue) {
        const p = screen(prop);
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = solid ? '#ffe4b5' : '#b8f5ff';
        ctx.fillText(solid ? 'BLOCKED' : 'PLANNED', p.x, p.y - 18);
      }
    }
    // The core's combat opening is a genuine e.open timer, so never show it
    // simply because Garun is charging or an unrelated effect is resolving.
    for (const boss of game
      .zone()
      .enemies.filter((e) => e.family === 'mine' && e.hp > 0 && e.open > 0)) {
      circlePath(ctx, screen, boss, 44);
      ctx.strokeStyle = '#aef0ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (cue) {
        const p = screen(boss);
        ctx.fillStyle = '#d9faff';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('CORE EXPOSED', p.x, p.y - 62);
      }
    }
    // Persistent board and real formation movement use the authoritative world positions.
    for (const boss of game
      .zone()
      .enemies.filter(
        (e) => e.family === 'citadel' && e.hp > 0 && e.board && game.sentinelBoardCells,
      ))
      for (const cell of game.sentinelBoardCells(boss)) {
        const h = cell.size / 2;
        polygon(ctx, screen, [
          { x: cell.x - h, y: cell.y - h },
          { x: cell.x + h, y: cell.y - h },
          { x: cell.x + h, y: cell.y + h },
          { x: cell.x - h, y: cell.y + h },
        ]);
        const warning = cell.selected && boss.board.phase === 'warn';
        const impact = cell.selected && boss.board.phase === 'rest';
        ctx.lineWidth = warning || impact ? 2.2 : 1.1;
        ctx.strokeStyle = warning ? '#fff1a7' : impact ? '#ff9267' : '#8794a766';
        ctx.fillStyle = warning ? '#df795655' : impact ? '#e84b3d88' : '#536b8917';
        if (!cue) ctx.fill();
        ctx.stroke();
      }
    if (cue)
      for (const guard of game
        .zone()
        .enemies.filter((e) => e.hp > 0 && e.dressPost && e.dressPost.expires > game.s.time)) {
        const from = screen(guard),
          to = screen(guard.dressPost);
        ctx.strokeStyle = '#b8d5eb';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        circlePath(ctx, screen, guard.dressPost, 15);
        ctx.stroke();
      }
    for (const e of game.zone().enemies.filter((e) => e.rangedAim)) {
      const p = screen(e),
        q = screen(e.rangedAim);
      if (cue) {
        ctx.strokeStyle = '#f0d092cc';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 15);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(q.x, q.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (const e of game
      .zone()
      .enemies.filter(
        (e) =>
          visibleWarning(e) &&
          !e.telegraph?.mobileRogueCast &&
          !(e.family === 'ridge' && e.ledgerOpen),
      )) {
      const a = e.telegraph;
      const shapes = warningShapes(a, game.attackPatches(a));
      // Rogue warnings need an identity distinct from ordinary boss attacks:
      // cool outlines for basic disruption, brighter double-width for signature.
      ctx.strokeStyle = a.bossHeal
        ? '#a9e7b0'
        : a.rogueSignature
          ? '#9cf1f0'
          : a.rogueMove
            ? '#8ecde6'
            : '#ffe09a';
      ctx.fillStyle = a.bossHeal
        ? '#4c9f6726'
        : a.rogueSignature
          ? '#369ab332'
          : a.rogueMove
            ? '#4b95c128'
            : '#dc644c26';
      ctx.lineWidth = a.rogueSignature ? 3.3 : 2.5;
      ctx.setLineDash(cue ? (a.rogueSignature ? [10, 4] : [8, 5]) : []);
      for (const points of shapes) {
        polygon(ctx, screen, points);
        cue ? ctx.stroke() : a.kind !== 'ring' && ctx.fill();
      }
      ctx.setLineDash([]);
      if (a.royalTerritory && a.kind === 'sector') {
        // Opposite geometry is safe from this sector strike, not from
        // all surrounding Crown soldiers or other attacks.
        const protectedShapes = warningShapes(
          { ...a, angle: a.protectedAngle },
          game.attackPatches(a),
        );
        for (const points of protectedShapes) {
          polygon(ctx, screen, points);
          ctx.fillStyle = '#4c9f6730';
          ctx.strokeStyle = '#a9e7b0';
          ctx.lineWidth = 2;
          cue ? ctx.stroke() : ctx.fill();
        }
        if (cue) {
          const spot = screen({
            x: e.x + Math.cos(a.protectedAngle) * Math.min(115, a.radius * 0.5),
            y: e.y + Math.sin(a.protectedAngle) * Math.min(115, a.radius * 0.5),
          });
          ctx.fillStyle = '#bdf4bc';
          ctx.font = 'bold 11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('PROTECTED SIDE', spot.x, spot.y);
        }
      }
      if (cue && a.tracking) {
        const p = screen(a);
        ctx.strokeStyle = '#f4c984';
        ctx.lineWidth = 2;
        // Below the target footprint, clear of the full attack caption above it.
        ctx.fillStyle = '#241d1af2';
        ctx.fillRect(p.x - 14, p.y + 12, 28, 22);
        ctx.strokeRect(p.x - 14, p.y + 12, 28, 22);
        ctx.fillStyle = '#fff3c8';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(String(a.shotNumber) + '/' + String(a.shots), p.x, p.y + 29);
      }
    }
    for (const e of game.zone().enemies) {
      if (e.hp > 0 && !e.returning) {
        const closure =
          e.dreadClosure || (e.telegraph?.dreadMechanic === 'closure' ? e.telegraph : null);
        if (closure) {
          for (const points of dreadClosureShapes(closure)) {
            polygon(ctx, screen, points);
            ctx.fillStyle = '#dd7e4650';
            ctx.strokeStyle = '#ffc28a';
            ctx.lineWidth = 2;
            cue ? ctx.stroke() : ctx.fill();
          }
          if (cue) {
            circlePath(ctx, screen, closure, closure.finalBlastRadius);
            ctx.setLineDash([3, 5]);
            ctx.strokeStyle = '#efb678';
            ctx.stroke();
            ctx.setLineDash([]);
            for (const angle of closure.gaps) {
              const end = {
                x: closure.x + Math.cos(angle) * (closure.initialRadius + closure.width + 15),
                y: closure.y + Math.sin(angle) * (closure.initialRadius + closure.width + 15),
              };
              strokeWorld(ctx, screen, closure, end, '#aef1d5', 2);
            }
          }
        }
        for (const vapor of e.dreadVapors || []) {
          polygon(
            ctx,
            screen,
            vapor.kind === 'cone'
              ? sectorPoints(vapor, vapor.radius, vapor.angle, (vapor.angleDegrees * Math.PI) / 360)
              : circlePoints(vapor, vapor.radius),
          );
          ctx.fillStyle = vapor.slow ? '#9eaf8050' : '#df965544';
          ctx.strokeStyle = vapor.slow ? '#c7d8a1' : '#f7c293';
          ctx.lineWidth = 1.5;
          cue ? ctx.stroke() : ctx.fill();
          if (cue) {
            const p = screen(vapor);
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff0d4';
            ctx.fillText(vapor.slow ? 'ENSILING VAPOR' : 'VENTING STEAM', p.x, p.y - 12);
          }
        }
        if (cue && e.dreadFeedUntil > game.s.time) {
          const p = screen(e);
          ctx.strokeStyle = '#e9bf6c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y - 20, 24, 28, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fbe7b8';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('FED BROOD', p.x, p.y + 18);
        }
      }
      const cordon = e.hp > 0 && !e.returning && e.cinderCordon;
      if (cordon) {
        polygon(ctx, screen, cordonPoints(cordon));
        ctx.strokeStyle = '#ffb783';
        ctx.fillStyle = '#e4683d58';
        ctx.lineWidth = 2;
        cue ? ctx.stroke() : ctx.fill();
        if (cue && cordon.warning) {
          const end = {
            x: cordon.x + Math.cos(cordon.nextGap) * (cordon.radius + cordon.width + 30),
            y: cordon.y + Math.sin(cordon.nextGap) * (cordon.radius + cordon.width + 30),
          };
          ctx.setLineDash([5, 4]);
          strokeWorld(ctx, screen, cordon, end, '#aef1d5', 3);
          ctx.setLineDash([]);
          const p = screen(end);
          const scale = ctx.getTransform?.().a || 1,
            width = (ctx.canvas?.width || 1280) / scale,
            height = (ctx.canvas?.height || 800) / scale,
            x = Math.max(56, Math.min(width - 56, p.x)),
            y = Math.max(20, Math.min(height - 12, p.y - 10));
          ctx.fillStyle = '#15271ff2';
          ctx.fillRect(x - 54, y - 14, 108, 20);
          ctx.fillStyle = '#aef1d5';
          ctx.textAlign = 'center';
          ctx.font = 'bold 11px system-ui';
          ctx.fillText('NEXT OPENING', x, y);
        }
        // The final inner blast is announced throughout the contraction.
        if (cue) {
          polygon(ctx, screen, cordonPoints({ ...cordon, radius: cordon.finalRadius }, true));
          ctx.setLineDash([3, 5]);
          ctx.strokeStyle = '#f5c48988';
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      if (e.hp > 0 && game.cinderProtection?.(e)) {
        const p = screen(e);
        ctx.strokeStyle = '#ace5c4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 23, 28, 33, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (cue) {
          ctx.fillStyle = '#d4f7df';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('PROTECTED', p.x, p.y + 18);
        }
      }
      if (cue && e.telegraph?.cinderMechanic === 'delegation')
        for (const delegate of e.telegraph.delegates || []) {
          circlePath(ctx, screen, delegate.point, 18);
          ctx.strokeStyle = '#a5d5ed';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      if (cue && e.hp > 0 && !e.returning) {
        const keeper =
            e.type === 'boss' &&
            e.family === 'archive' &&
            e.emergencyStabilizationUntil > game.s.time,
          direjaw =
            e.roomCaptain &&
            e.captainProfile === 'supply-march' &&
            e.strainHardeningUntil > game.s.time;
        if (keeper || direjaw) {
          const p = screen(e),
            reduction = keeper
              ? R.marchesPassives.emergencyStabilization[e.form === 'true' ? 'true' : 'normal']
                  .reduction
              : Math.min(
                  R.marchesPassives.strainHardening.maxStacks,
                  e.strainHardeningStacks || 0,
                ) * R.marchesPassives.strainHardening.perHit;
          ctx.strokeStyle = keeper ? '#97cee9' : '#d0b477';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y - 22, 27, 31, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#18252bf2';
          ctx.fillRect(p.x - 17, p.y + 12, 34, 20);
          ctx.fillStyle = keeper ? '#d6f3ff' : '#fff0c3';
          ctx.font = 'bold 11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(String(Math.round(reduction * 100)) + '%', p.x, p.y + 26);
        }
      }
      if (
        e.hp <= 0 ||
        e.returning ||
        !(
          e.anastylosis > 0 ||
          (e.telegraph?.selfDefense && !e.telegraph.cinderMechanic && !e.telegraph.dreadMechanic)
        )
      )
        continue;
      const p = screen(e),
        active = e.anastylosis > 0;
      ctx.strokeStyle = active ? '#b7ddd5' : '#9aafbf';
      ctx.fillStyle = active ? '#81b8ad' : '#7a8d9a';
      ctx.lineWidth = 1.5;
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI) / 3,
          x = p.x + Math.cos(angle) * 27,
          y = p.y - 25 + Math.sin(angle) * 12;
        ctx.fillRect(x - 4, y - 5, 8, 10);
        ctx.strokeRect(x - 4, y - 5, 8, 10);
      }
    }
    for (const a of game.s.hazards) {
      const kind = hazardKind(a),
        color =
          kind === 'cold'
            ? '#acebf0'
            : kind === 'spectral'
              ? '#bf94df'
              : kind === 'mire'
                ? '#b8bd77'
                : kind === 'ember'
                  ? '#ff9b61'
                  : kind === 'stone'
                    ? '#e0b587'
                    : '#ee9675';
      if (a.kind === 'ring') {
        polygon(ctx, screen, circlePoints(a, a.radius + G.ringHalfWidth));
        const inner = circlePoints(a, Math.max(0, a.radius - G.ringHalfWidth));
        inner.forEach((q, j) => {
          const p = screen(q);
          j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = a.slowOnly ? '#8adaef35' : '#e4683d35';
        if (cue) {
          ctx.strokeStyle = a.slowOnly ? '#bceeff' : '#ffb783';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else ctx.fill('evenodd');
      } else {
        circlePath(ctx, screen, a, a.radius);
        ctx.fillStyle = color + '38';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (cue) ctx.stroke();
        else {
          ctx.fill();
          for (let j = 0; j < 7; j++) {
            const angle = (j * Math.PI * 2) / 7 + time * 0.35,
              r = a.radius * (0.25 + (j % 3) * 0.22),
              q = screen({ x: a.x + Math.cos(angle) * r, y: a.y + Math.sin(angle) * r });
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            if (kind === 'ember') {
              ctx.beginPath();
              ctx.moveTo(q.x - 3, q.y + 2);
              ctx.quadraticCurveTo(q.x - 4, q.y - 7, q.x + Math.sin(time * 7 + j) * 2, q.y - 12);
              ctx.quadraticCurveTo(q.x + 6, q.y - 4, q.x + 3, q.y + 2);
              ctx.fill();
            } else if (kind === 'mire') {
              ctx.beginPath();
              ctx.ellipse(q.x, q.y, 4 + Math.sin(time * 2 + j), 1.8, 0, 0, Math.PI * 2);
              ctx.stroke();
            } else if (kind === 'spectral') {
              ctx.beginPath();
              ctx.arc(q.x, q.y - 4 - Math.sin(time * 2 + j) * 4, 1.8, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.moveTo(q.x - 4, q.y);
              ctx.lineTo(q.x, q.y - 4);
              ctx.lineTo(q.x + 5, q.y + 2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        }
      }
    }
    if (pass === 'cue') actorCues(ctx, screen, game);
    ctx.restore();
  }
  // Enemy support healing deliberately reuses the existing heal event rather
  // than inventing a damaging spell/VFX identity. Keep these materials rooted
  // in the actual creature and authored profession, never its display name.
  const enemyHealColors = Object.freeze({
    wolf: '#a5c8a1',
    goblin: '#cbbf8e',
    skeleton: '#d4d4c1',
    wraith: '#aea9dc',
    stalker: '#a79ad4',
    mireling: '#80c5b5',
    reedbeast: '#a4d2a8',
    archer: '#bfce9a',
    crownguard: '#d3d5b2',
    ashbeast: '#eca779',
    orc: '#cbb48c',
    ogre: '#cabb9d',
  });
  function enemyHealMaterial(f) {
    if (f.family === 'crypt') return 'bone';
    if (f.family === 'mire' || f.family === 'archive') return 'water';
    if (f.family === 'ridge' || f.captainProfile === 'supply-vale') return 'metal';
    if (f.family === 'abyss') return 'aerial';
    if (f.captainProfile === 'supply-march') return 'water';
    if (f.captainProfile === 'supply-crown') return 'growth';
    if (['skeleton'].includes(f.species)) return 'bone';
    if (['mireling', 'reedbeast'].includes(f.species)) return 'water';
    if (['wraith', 'stalker'].includes(f.species)) return 'spectral';
    if (['ashbeast'].includes(f.species)) return 'ember';
    if (['archer', 'crownguard', 'orc'].includes(f.species)) return 'military';
    if (['ogre', 'goblin'].includes(f.species)) return 'earth';
    return 'growth';
  }
  function enemyHealColor(f) {
    if (f.family === 'abyss') return '#b7a2df';
    if (f.family === 'ridge' || f.captainProfile === 'supply-vale') return '#e3c68e';
    if (f.family === 'archive') return '#a5c9dc';
    return enemyHealColors[f.species] || '#add9b3';
  }
  function enemySupportHeal(ctx, screen, f) {
    if (!Number.isFinite(f.x) || !Number.isFinite(f.y)) return;
    const remaining = Math.max(0, Math.min(1, f.life / Math.max(0.01, f.max || 0.55))),
      progress = 1 - remaining,
      p = screen(f),
      hue = enemyHealColor(f),
      material = enemyHealMaterial(f),
      strong = f.boss || f.captain || f.form === 'ringleader';
    ctx.save();
    ctx.strokeStyle = hue;
    ctx.fillStyle = hue;
    ctx.lineWidth = strong ? 2.8 : 2;
    ctx.globalAlpha = remaining * 0.75;
    // A fleeting, non-targeting link makes it immediately clear who healed
    // whom. This is informational, not an attack beam or projectile.
    if (Number.isFinite(f.fromX) && Number.isFinite(f.fromY)) {
      const from = screen({ x: f.fromX, y: f.fromY });
      if (Math.hypot(p.x - from.x, p.y - from.y) > 17) {
        ctx.setLineDash([5, 7]);
        ctx.lineDashOffset = -progress * 21;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y - 9);
        ctx.quadraticCurveTo((from.x + p.x) / 2, (from.y + p.y) / 2 - 29, p.x, p.y - 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.lineWidth = strong ? 2.8 : 2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 9, 18 + progress * 12, 7 + progress * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Readable at actual phone scale: five small material-specific marks rise
    // around the living recipient instead of a full-screen green explosion.
    for (let j = 0; j < 5; j++) {
      const angle = j * Math.PI * 0.4 + progress * 1.2,
        px = p.x + Math.cos(angle) * (10 + progress * 15),
        py = p.y - 7 - progress * (11 + (j % 3) * 6) + Math.sin(angle) * 5;
      ctx.beginPath();
      if (material === 'water') {
        ctx.ellipse(px, py, 2, 3.5, 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (material === 'bone' || material === 'metal') {
        ctx.moveTo(px - 3, py + 2);
        ctx.lineTo(px, py - 3);
        ctx.lineTo(px + 3, py + 2);
        ctx.stroke();
      } else if (material === 'ember' || material === 'aerial') {
        ctx.moveTo(px, py - 4);
        ctx.lineTo(px + 3, py);
        ctx.lineTo(px, py + 4);
        ctx.lineTo(px - 3, py);
        ctx.closePath();
        ctx.fill();
      } else if (material === 'military') {
        ctx.moveTo(px - 3, py - 2);
        ctx.lineTo(px, py + 2);
        ctx.lineTo(px + 3, py - 2);
        ctx.stroke();
      } else if (material === 'earth') {
        ctx.ellipse(px, py, 2.8, 2.4, angle, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.ellipse(px, py, 3.5, 2, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  function enemySupportStatus(ctx, screen, game) {
    const duration = R.enemySupportHealing?.duration || 5;
    if (game.peace) return;
    let visible = 0;
    for (const u of game.zone().enemies) {
      const support = u.supportHeal;
      if (
        !support ||
        !game.enemyHealingActor?.(u) ||
        u.hp <= 0 ||
        !u.aggro ||
        !Number.isFinite(support.seconds) ||
        support.seconds <= 0
      )
        continue;
      if (++visible > 32) break;
      const p = screen(u),
        source = game.zone().enemies.find((e) => e.id === support.source),
        hue = enemyHealColor(source || u),
        progress = Math.max(0, Math.min(1, 1 - support.seconds / duration));
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * (1 - progress);
      ctx.strokeStyle = hue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 9, 13, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 16, 7, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  function chargeInterrupted(ctx, screen, f) {
    const p = screen(f),
      fade = Math.max(0, f.life / f.max);
    ctx.save();
    ctx.globalAlpha = fade * 0.85;
    ctx.strokeStyle = '#efba91';
    ctx.lineWidth = 2;
    // Two broken arcs and a tiny crossed spark, never a covering rectangle.
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        p.x + side * (1 - fade) * 9,
        p.y - 20,
        10,
        side < 0 ? 1.9 : -1.2,
        side < 0 ? 4.3 : 1.2,
      );
      ctx.stroke();
    }
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe1c4';
    ctx.fillText('Interrupted', p.x, p.y - 37 - (1 - fade) * 5);
    ctx.restore();
  }
  function queue(events, game, current = [], observer = null) {
    const art =
      root.PrototypeEnemyVfxArt ||
      (typeof require === 'function' ? require('./enemy-vfx-art.js') : null);
    const next = art
        ? art.queue(
            events,
            game,
            current.filter((f) => f.life > 0),
          )
        : current.filter((f) => f.life > 0),
      contacts = new Set(
        events.filter((e) => e.type === 'projectileImpact').map((e) => e.x + ':' + e.y),
      ),
      push = (e, type, duration, priority) =>
        next.push({ ...e, type, life: duration, max: duration, priority });
    const heroArt =
      root.PrototypeHeroPresentation ||
      (typeof require === 'function' ? require('./hero-presentation.js') : null);
    heroArt?.queue(events, push);
    for (const e of events) {
      if (heroArt?.owns(e)) continue;
      if (e.type === 'hit' && Number.isFinite(e.x) && !contacts.has(e.x + ':' + e.y))
        push(e, 'impact', 0.2, 1);
      else if (
        e.type === 'projectileImpact' &&
        Number.isFinite(e.x) &&
        !events.some(
          (f) =>
            f.type === 'enemyVfx' &&
            f.stage === 'impact' &&
            f.target === e.target &&
            f.source === e.source,
        )
      )
        push(e, 'contact', 0.32, 1);
      else if (e.type === 'chargeInterrupted' && (!e.zone || e.zone === game.zoneId))
        push(e, 'chargeInterrupted', 0.45, 5);
      else if (e.type === 'hurt' && Number.isFinite(e.x)) push(e, 'hurt', 0.25, 2);
      else if (e.type === 'heal') {
        const target =
          e.actor === 'enemy'
            ? game.zone()?.enemies.find((u) => u.id === e.target && game.enemyHealingActor?.(u))
            : e.target === 'hero'
              ? game.hero
              : game.s.party.find((u) => u.id === e.target);
        // Hostile recovery never borrows the player's location when its
        // recipient has died, departed, or cannot be resolved.
        if (e.actor === 'enemy' && !target) continue;
        push(
          {
            ...e,
            resource: e.resource || 'health',
            x: target?.x ?? e.x ?? game.hero.x,
            y: target?.y ?? e.y ?? game.hero.y,
          },
          'heal',
          0.55,
          4,
        );
      } else if (e.type === 'spell' && [5, 7, 8].includes(e.slot) && Number.isFinite(e.radius))
        push(e, 'ability', e.slot === 8 ? 0.85 : 0.65, 5);
      else if (e.type === 'swing')
        push(e, 'swing', e.combo === 3 ? 0.32 : e.combo ? 0.25 : 0.18, 2);
      else if (e.type === 'basicComboFinisher') push(e, e.type, 0.45, 4);
      else if (e.type === 'petSkill')
        push(e, e.type, e.slot === 2 ? 0.85 : 0.65, e.slot === 2 ? 5 : 4);
      else if (e.type === 'chargedArea') push(e, e.type, 0.7, 5);
      else if (e.type === 'chargedImpact') push(e, e.type, 0.3, 3);
    }
    // Only an opted-in developer recorder scans candidates.
    observer?.candidates(next, current);
    // Bound transient work while retaining ability and recovery cues during crowds of small hits.
    while (next.length > 40) {
      let index = 0;
      for (let j = 1; j < next.length; j++)
        if ((next[j].priority || 1) < (next[index].priority || 1)) index = j;
      observer?.overflow(next[index]);
      next.splice(index, 1);
    }
    return next;
  }
  function contact(ctx, screen, f) {
    const p = screen(f),
      a = Math.max(0, f.life / f.max),
      grow = 1 - a,
      style = f.effect === 'frost' ? 'frost' : f.style || 'magic',
      colors = {
        arrow: '#d7c69f',
        axe: '#cbc9ae',
        stone: '#b7ac8f',
        spit: '#abd184',
        cinder: '#ffb16c',
        spectral: '#beabd9',
        magic: '#aedfff',
        beam: '#dcf5ff',
        holy: '#ffe29a',
        frost: '#b9edf1',
      },
      c = colors[style] || colors.magic;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineWidth = 1.8;
    for (let j = 0; j < 6; j++) {
      const an = (j * Math.PI) / 3 + 0.2,
        r = 6 + grow * 18,
        x = p.x + Math.cos(an) * r,
        y = p.y + Math.sin(an) * r * 0.65;
      if (style === 'spit') {
        ctx.beginPath();
        ctx.ellipse(x, y, 2.5 * (1 - grow * 0.5), 1.6, an, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'stone' || style === 'axe') {
        ctx.beginPath();
        ctx.moveTo(x - 3, y + 2);
        ctx.lineTo(x - 1, y - 3);
        ctx.lineTo(x + 4, y);
        ctx.closePath();
        ctx.fill();
      } else if (style === 'arrow') {
        if (j % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(x - 3, y - 2);
          ctx.lineTo(x + 3, y + 2);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(an) * 4, p.y + Math.sin(an) * 4);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (style === 'frost') {
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }
    }
    if (!['arrow', 'axe', 'stone', 'spit'].includes(style)) {
      ctx.globalAlpha = a * 0.45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + grow * 13, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function ability(ctx, screen, f) {
    const a = Math.max(0, f.life / f.max),
      grow = 1 - a,
      p = screen(f),
      cls = f.class,
      slot = f.slot,
      color =
        cls === 'paladin'
          ? '#ffe09b'
          : cls === 'ranger'
            ? '#dce9ad'
            : slot === 5
              ? '#b5e9f3'
              : '#d1b5f3';
    ctx.save();
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    // The outer footprint is stable; animation expands inside the actual affected area.
    circlePath(ctx, screen, f, f.radius);
    ctx.globalAlpha = a * 0.28;
    ctx.stroke();
    circlePath(ctx, screen, f, f.radius * (0.25 + grow * 0.7));
    ctx.fillStyle = color + '14';
    ctx.globalAlpha = a * 0.65;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    if (cls !== 'ranger') {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 50 + grow * 35);
      glow.addColorStop(0, color + '66');
      glow.addColorStop(1, color + '00');
      ctx.fillStyle = glow;
      ctx.globalAlpha = a * 0.55;
      ctx.fillRect(p.x - 90, p.y - 90, 180, 180);
      ctx.fillStyle = color;
    }
    for (let j = 0; j < (slot === 8 ? 12 : 8); j++) {
      const angle = (j * Math.PI * 2) / (slot === 8 ? 12 : 8),
        r = f.radius * (0.3 + grow * 0.6),
        q = screen({ x: f.x + Math.cos(angle) * r, y: f.y + Math.sin(angle) * r });
      ctx.globalAlpha = a * 0.8;
      if (cls === 'ranger') {
        const from = slot === 8 ? { x: q.x - 10, y: q.y - 35 * (1 - grow) } : p,
          dx = q.x - from.x,
          dy = q.y - from.y,
          len = Math.hypot(dx, dy) || 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - (dx / len) * 7 - (dy / len) * 3, q.y - (dy / len) * 7 + (dx / len) * 3);
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - (dx / len) * 7 + (dy / len) * 3, q.y - (dy / len) * 7 - (dx / len) * 3);
        ctx.stroke();
      } else if (cls === 'mage' && slot === 5) {
        const height = 22 + grow * 9;
        ctx.beginPath();
        ctx.moveTo(q.x - 6, q.y + 2);
        ctx.lineTo(q.x - 1, q.y - height);
        ctx.lineTo(q.x + 7, q.y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f0fcff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(q.x - 1, q.y - height);
        ctx.lineTo(q.x + 1, q.y + 1);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(q.x + side * 8, q.y + 3);
          ctx.lineTo(q.x + side * 11, q.y - 9);
          ctx.lineTo(q.x + side * 14, q.y + 3);
          ctx.stroke();
        }
      } else if (cls === 'mage') {
        ctx.beginPath();
        if (slot === 8) {
          ctx.moveTo(q.x - 4, q.y - 55);
          ctx.lineTo(q.x + 4, q.y - 38);
          ctx.lineTo(q.x - 5, q.y - 24);
          ctx.lineTo(q.x + 3, q.y - 12);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(q.x - 5, q.y - 24);
          ctx.lineTo(q.x - 14, q.y - 19);
          ctx.lineTo(q.x - 19, q.y - 9);
          ctx.stroke();
          ctx.lineWidth = 2;
        } else {
          ctx.moveTo(p.x + (q.x - p.x) * 0.3, p.y + (q.y - p.y) * 0.3);
          ctx.lineTo(q.x - 5, q.y - 10);
          ctx.lineTo(q.x + 3, q.y - 18);
          ctx.lineTo(q.x - 2, q.y - 31);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(q.x, q.y, 3 + grow * 5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        if (slot === 7) {
          ctx.beginPath();
          ctx.moveTo(q.x - 5, q.y);
          ctx.lineTo(q.x, q.y - 27);
          ctx.lineTo(q.x + 5, q.y);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(q.x - 7, q.y - 1);
          ctx.lineTo(q.x + 7, q.y - 1);
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(q.x, q.y + 7);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(q.x - 6, q.y - 10);
          ctx.lineTo(q.x + 6, q.y - 10);
          ctx.moveTo(q.x, q.y + 2);
          ctx.lineTo(q.x, q.y - (slot === 8 ? 43 : 22));
          ctx.stroke();
          if (slot === 8) {
            ctx.globalAlpha = a * 0.15;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(q.x, q.y);
            ctx.lineTo(q.x, q.y - 40);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.globalAlpha = a * 0.8;
          }
        }
      }
    }
    ctx.restore();
  }
  root.PrototypeCombatVisuals = {
    polygon,
    circlePoints,
    circlePath,
    capsulePoints,
    sectorPoints,
    warningShapes,
    royalTaxStatus,
    ground,
    actorCues,
    enemySupportHeal,
    enemySupportStatus,
    chargeInterrupted,
    queue,
    contact,
    ability,
    hazardKind,
  };
  if (typeof module !== 'undefined') module.exports = root.PrototypeCombatVisuals;
})(typeof window !== 'undefined' ? window : globalThis);
