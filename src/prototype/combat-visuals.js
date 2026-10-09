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
  function warningShapes(a, patches) {
    if (a.kind === 'line' || a.kind === 'volley')
      return (a.kind === 'volley' ? [-0.22, 0, 0.22] : a.count === 2 ? [-85, 85] : [0]).map((o) => {
        const angle = a.angle + (a.kind === 'volley' ? o : 0),
          offset = a.kind === 'volley' ? 0 : o,
          side = { x: -Math.sin(angle), y: Math.cos(angle) },
          from = { x: a.fromX + side.x * offset, y: a.fromY + side.y * offset },
          to =
            a.kind === 'volley'
              ? { x: from.x + Math.cos(angle) * 650, y: from.y + Math.sin(angle) * 650 }
              : { x: a.x + side.x * offset, y: a.y + side.y * offset },
          width =
            a.kind === 'volley'
              ? 22
              : a.charge
                ? G.chargeHalfWidth
                : a.count === 2
                  ? G.dualLineHalfWidth
                  : G.lineHalfWidth;
        return capsulePoints(from, to, width);
      });
    if (a.kind === 'cone' || a.kind === 'sector')
      return [sectorPoints(a, a.radius, a.angle, a.kind === 'sector' ? 0.65 : 1.1)];
    if (a.kind === 'ring')
      return [circlePoints({ x: a.fromX, y: a.fromY }, G.ringSpeed * G.ringLife + G.ringHalfWidth)];
    return patches.map((p) => circlePoints(p, p.radius));
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
    return a.manaDrain
      ? 'spectral'
      : a.slow
        ? 'mire'
        : a.family === 'abyss' || a.family === 'cindermaw'
          ? 'ember'
          : a.family === 'mine' || a.family === 'ridge'
            ? 'stone'
            : 'ritual';
  }
  function ground(ctx, screen, game, pass = 'fill', time = 0) {
    const cue = pass === 'cue';
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
    for (const e of game.zone().enemies.filter((e) => e.telegraph)) {
      const a = e.telegraph,
        shapes = warningShapes(a, game.attackPatches(a));
      // Rogue warnings need an identity distinct from ordinary boss attacks:
      // cool outlines for basic disruption, brighter double-width for signature.
      ctx.strokeStyle = a.rogueSignature ? '#9cf1f0' : a.rogueMove ? '#8ecde6' : '#ffe09a';
      ctx.fillStyle = a.rogueSignature ? '#369ab33e' : a.rogueMove ? '#4b95c132' : '#dc644c30';
      ctx.lineWidth = a.rogueSignature ? 3.3 : 2.5;
      ctx.setLineDash(cue ? (a.rogueSignature ? [10, 4] : [8, 5]) : []);
      for (const points of shapes) {
        polygon(ctx, screen, points);
        cue ? ctx.stroke() : a.kind !== 'ring' && ctx.fill();
      }
      ctx.setLineDash([]);
      if (cue) {
        const p = screen(a);
        ctx.textAlign = 'center';
        if (a.rogueMove) {
          // Wrap the complete named move, rather than shrink an oversized
          // one-line label to unreadable phone text or clip it off-screen.
          const canvasWidth = ctx.canvas?.width || 900,
            maxWidth = Math.max(130, canvasWidth - 20);
          ctx.font = 'bold 11px system-ui';
          const lines = [''];
          for (const word of a.name.split(' ')) {
            const i = lines.length - 1,
              next = lines[i] ? lines[i] + ' ' + word : word;
            if (lines[i] && ctx.measureText(next).width + 20 > maxWidth) lines.push(word);
            else lines[i] = next;
          }
          const w = Math.min(maxWidth,
              Math.max(100, ...lines.map((line) => ctx.measureText(line).width + 20))),
            x = Math.max(w / 2 + 5, Math.min(canvasWidth - w / 2 - 5, p.x)),
            h = 17 + lines.length * 15,
            y = p.y - h - 12;
          ctx.fillStyle = '#192a36f2';
          ctx.fillRect(x - w / 2, y, w, h);
          ctx.strokeStyle = a.rogueSignature ? '#9cf1f0' : '#8ecde6';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x - w / 2, y, w, h);
          ctx.fillStyle = '#f2fbff';
          lines.forEach((line, j) => ctx.fillText(line, x, y + 13 + j * 15));
          ctx.font = 'bold 10px system-ui';
          ctx.fillStyle = '#9cf1f0';
          ctx.fillText(
            (a.rogueSignature ? 'SIGNATURE' : 'ROGUE') + ' · ' + a.timer.toFixed(1) + 's',
            x, y + h - 4,
          );
        } else {
          ctx.font = 'bold 12px system-ui';
          const label = a.name + ' · ' + a.timer.toFixed(1),
            w = ctx.measureText(label).width + 16;
          ctx.fillStyle = '#241d1af2';
          ctx.fillRect(p.x - w / 2, p.y - 31, w, 21);
          ctx.strokeStyle = '#f4c984';
          ctx.lineWidth = 1;
          ctx.strokeRect(p.x - w / 2, p.y - 31, w, 21);
          ctx.fillStyle = '#fff3c8';
          ctx.fillText(label, p.x, p.y - 16);
        }
      }
    }
    for (const a of game.s.hazards) {
      const kind = hazardKind(a),
        color =
          kind === 'spectral'
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
        ctx.fillStyle = '#e4683d35';
        if (cue) {
          ctx.strokeStyle = '#ffb783';
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
    ctx.restore();
  }
  function queue(events, game, current = []) {
    const next = current.filter((f) => f.life > 0),
      contacts = new Set(
        events.filter((e) => e.type === 'projectileImpact').map((e) => e.x + ':' + e.y),
      ),
      push = (e, type, duration, priority) =>
        next.push({ ...e, type, life: duration, max: duration, priority });
    for (const e of events) {
      if (e.type === 'hit' && Number.isFinite(e.x) && !contacts.has(e.x + ':' + e.y))
        push(e, 'impact', 0.2, 1);
      else if (e.type === 'projectileImpact' && Number.isFinite(e.x)) push(e, 'contact', 0.32, 1);
      else if (e.type === 'hurt' && Number.isFinite(e.x)) push(e, 'hurt', 0.25, 2);
      else if (e.type === 'heal') {
        const target =
          e.target === 'hero' ? game.hero : game.s.party.find((u) => u.id === e.target);
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
      else if (e.type === 'chargedArea') push(e, e.type, 0.7, 5);
      else if (e.type === 'chargedImpact') push(e, e.type, 0.3, 3);
    }
    // Bound transient work while retaining ability and recovery cues during crowds of small hits.
    while (next.length > 40) {
      let index = 0;
      for (let j = 1; j < next.length; j++)
        if ((next[j].priority || 1) < (next[index].priority || 1)) index = j;
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
    ground,
    queue,
    contact,
    ability,
    hazardKind,
  };
  if (typeof module !== 'undefined') module.exports = root.PrototypeCombatVisuals;
})(typeof window !== 'undefined' ? window : globalThis);
