/* Campaign presentation only. Rendering never owns simulation or saved state. */
(function (root) {
  'use strict';
  function create({
    canvas,
    ctx,
    getGame,
    platform,
    chargePresentation,
    isPaused,
    Campaign,
    PrototypeVisuals,
    PrototypeCombatVisuals,
    PrototypeSprites,
    PrototypeMaterials,
    now = () => performance.now(),
  }) {
    let game = getGame(),
      visualFx = [],
      origin = null;
    const stats = { tileCandidates: 0, tilesDrawn: 0, entitiesConsidered: 0, entitiesDrawn: 0 };
    function iso(x, y) {
      return { x: (x - y) * 0.76, y: (x + y) * 0.27 };
    }
    function offset() {
      if (origin) return origin;
      const p = iso(getGame().hero.x, getGame().hero.y),
        anchor = platform.cameraAnchor(canvas.width, canvas.height);
      return { x: anchor.x - p.x, y: anchor.y - p.y };
    }
    function screen(e) {
      const p = iso(e.x, e.y),
        o = offset();
      return { x: p.x + o.x, y: p.y + o.y };
    }
    function world(x, y) {
      const o = offset(),
        xx = x - o.x,
        yy = y - o.y;
      return { x: (xx / 0.76 + yy / 0.27) / 2, y: (yy / 0.27 - xx / 0.76) / 2 };
    }
    function worldLabelVisible(e) {
      if (e.renderKind === 'enemy') return e.type === 'boss' || !!e.aggro;
      if (e.renderKind === 'npc' || e.renderKind === 'building')
        return Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= 220;
      return true;
    }
    function tileBounds(size) {
      const corners = [
        world(-160, -100),
        world(canvas.width + 160, -100),
        world(-160, canvas.height + 100),
        world(canvas.width + 160, canvas.height + 100),
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
      for (const key of Object.keys(stats)) stats[key] = 0;
      origin = offset();
      PrototypeSprites?.beginFrame?.();
      PrototypeMaterials?.beginFrame?.();
      try {
        render();
      } finally {
        PrototypeSprites?.endFrame?.();
        PrototypeMaterials?.endFrame?.();
        origin = null;
      }
    }
    function visualPhase(e) {
      let h = 2166136261 >>> 0;
      for (const ch of String(e.id || e.name || e.species || e.family || e.type || 'azeroth')) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
      }
      return (h % 628) / 100;
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
    function sprite(e, p) {
      const q = visualPosition(e, p),
        rescued = !!game.s.rescued[e.family];
      if (PrototypeSprites && PrototypeSprites.draw(ctx, e, q, game.regionIndex(), rescued)) return;
      PrototypeVisuals.draw(ctx, e, q, game.regionIndex(), rescued);
    }
    function spriteHeight(e) {
      const fallback = PrototypeVisuals.height(e),
        rescued = !!game.s.rescued[e.family];
      return PrototypeSprites
        ? PrototypeSprites.height(e, game.regionIndex(), rescued, fallback)
        : fallback;
    }
    function entityShadow(e, p) {
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
      const type = e.renderKind,
        important =
          type === 'hero' || e.type === 'boss' || e.captain || e.roomCaptain || e.kind === 'quests';
      if (!['hero', 'ally', 'enemy', 'npc', 'node'].includes(type)) return;
      ctx.strokeStyle =
        type === 'hero'
          ? '#f5d992bb'
          : type === 'ally'
            ? '#a7d3a77d'
            : type === 'enemy'
              ? e.neutral
                ? '#b9d8b177'
                : e.type === 'boss'
                  ? '#ec8b76aa'
                  : '#b8786870'
              : e.kind === 'quests'
                ? '#f5d18cbb'
                : '#d5ca9b66';
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
        ctx.globalAlpha = 0.16 + pulse * 0.09;
        ctx.fillStyle = '#f4d376';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 8, 34 + pulse * 6, 12 + pulse * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#f8dfa0';
        ctx.lineWidth = 1.5;
        for (const r of [30 + pulse * 5, 39 + pulse * 4]) {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 8, r, r * 0.3, 0, 0, Math.PI * 2);
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
      }
      ctx.fillStyle = '#0c1a19dd';
      ctx.fillRect(left - 2, y - 2, w + 4, 8);
      ctx.fillStyle = '#5a645b';
      ctx.fillRect(left, y, w, 4);
      ctx.fillStyle = e.renderKind === 'enemy' ? '#e87966' : '#91d59c';
      ctx.fillRect(left, y, w * Math.max(0, Math.min(1, e.hp / e.maxHp)), 4);
      ctx.fillStyle = '#ffffff77';
      ctx.fillRect(left, y, w * Math.max(0, Math.min(1, e.hp / e.maxHp)), 1);
    }
    function projectileVector(p) {
      const dx = Number.isFinite(p.dx) ? p.dx : 1,
        dy = Number.isFinite(p.dy) ? p.dy : 0,
        q = screen(p),
        tail = screen({ x: p.x - dx * 24, y: p.y - dy * 24 }),
        vx = q.x - tail.x,
        vy = q.y - tail.y,
        len = Math.hypot(vx, vy) || 1;
      return { q, ux: vx / len, uy: vy / len, px: -vy / len, py: vx / len };
    }
    function drawProjectile(p) {
      const { q, ux, uy, px, py } = projectileVector(p),
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
        const o = screen({ x: p.originX ?? p.x, y: p.originY ?? p.y });
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
          ctx.strokeStyle = '#eef0c4';
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(q.x - ux * 28 + px * 7, q.y - uy * 28 + py * 7);
          ctx.quadraticCurveTo(
            q.x - ux * 12 - px * 3,
            q.y - uy * 12 - py * 3,
            q.x - ux * 2,
            q.y - uy * 2,
          );
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
    function queueVisualFx(events) {
      visualFx = PrototypeCombatVisuals.queue(events, game, visualFx);
    }
    function updateVisualFx(dt) {
      for (const f of visualFx) f.life -= dt;
      visualFx = visualFx.filter((f) => f.life > 0);
    }
    function drawVisualFx() {
      for (const f of visualFx) {
        const a = Math.max(0, f.life / f.max),
          p = screen(f),
          grow = 1 - a;
        ctx.save();
        ctx.globalAlpha = a;
        if (f.type === 'ability') {
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
        } else if (f.type === 'heal') {
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
          if (f.shape === 'circle') {
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
      }
      const guard = (q, r, cls = 'paladin') => {
        ctx.save();
        const pulse = 0.65 + Math.sin(now() / 160) * 0.15;
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
          const an = now() / 550 + j * 2.09;
          ctx.fillStyle = mana ? '#b8ddff' : '#c1efc6';
          ctx.beginPath();
          ctx.arc(q.x + Math.cos(an) * r * 0.6, q.y - 7 + Math.sin(an) * 5, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      const h = game.hero,
        p = screen(h);
      if (h.immune > 0) guard(p, 29, h.class);
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
      for (const effect of h.supportEffects || []) support(p, effect, 25);
      for (const u of game.activeLivingParty()) {
        const q = screen(u);
        if (u.immune > 0) guard(q, 24);
        for (const effect of u.supportEffects || []) support(q, effect, 22);
      }
    }

    function render() {
      ctx.fillStyle = '#0c1913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const z = game.zone(),
        room = !!game.supplyRoom(),
        dungeon = game.isDungeon(),
        size = game.zoneSize(),
        i = game.regionIndex(),
        authoredFloor =
          Campaign.dungeonIds.includes(game.zoneId) || game.zoneId === 'supply-highlands';
      ctx.save();
      if (authoredFloor) {
        PrototypeVisuals.dungeonFloorPath(ctx, screen, game.zoneId, size);
        ctx.clip();
      }
      const bounds = tileBounds(size);
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
          PrototypeVisuals.floor(
            ctx,
            p,
            x,
            y,
            i,
            room,
            room ? game.zoneId : dungeon ? game.zoneId : '',
            blocked,
            PrototypeMaterials,
          );
        }
      ctx.restore();
      if (authoredFloor) PrototypeVisuals.dungeonArchitecture(ctx, screen, game.zoneId, size);
      if (!game.isDungeon()) PrototypeVisuals.terrain(ctx, screen, i, size, PrototypeMaterials);
      PrototypeVisuals.roads(ctx, z.roads || [], screen, i, PrototypeMaterials);
      if (!game.isDungeon()) PrototypeVisuals.bridges(ctx, screen, i, PrototypeMaterials);
      PrototypeCombatVisuals.ground(ctx, screen, game, 'fill', now() / 1000);
      const boardCue = null,
        captainCue = game.zoneId === 'vale' && game.s.party.length <= 2;
      const entities = [];
      function add(list, renderKind) {
        for (const e of list) {
          stats.entitiesConsidered++;
          if (renderKind === 'enemy' && e.hp <= 0) continue;
          const p = screen(e);
          if (p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100)
            continue;
          entities.push({ ...e, renderKind, spriteIdentity: e });
        }
      }
      add(z.props, 'prop');
      add(game.visibleNPCs(), 'npc');
      add(game.visibleResourceNodes(), 'node');
      add(z.buildings, 'building');
      add(z.enemies, 'enemy');
      add(game.activeLivingParty(), 'ally');
      add([game.hero], 'hero');
      if (z.escort) add([{ ...z.escort, icon: '🧑‍🌾', name: 'Supply escort' }], 'ally');
      entities.sort((a, b) => a.x + a.y - b.x - b.y);
      stats.entitiesDrawn = entities.length;

      for (const e of entities) {
        const p = screen(e);
        if (p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100)
          continue;
        if (!e.interactionOnly) {
          groundMarker(e, p);
          entityShadow(e, p);
          entityAura(e, p);
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
        if (!e.interactionOnly) sprite(e, p);
        if (['enemy', 'ally', 'hero'].includes(e.renderKind)) {
          const visibleCombat = e.renderKind !== 'enemy' || worldLabelVisible(e);
          if (visibleCombat && !e.neutral) healthPlate(e, p);
          if (visibleCombat) {
            const isTrueBoss = e.renderKind === 'enemy' && e.type === 'boss' && e.form === 'true',
              isCaptain = e.renderKind === 'enemy' && (e.captain || e.roomCaptain);
            ctx.font = isTrueBoss
              ? 'bold 12px system-ui'
              : e.type === 'boss' || isCaptain
                ? 'bold 11px system-ui'
                : '10px system-ui';
            ctx.fillStyle = isTrueBoss
              ? '#ffe08a'
              : isCaptain
                ? '#f0d79b'
                : e.renderKind === 'enemy'
                  ? '#f8cebd'
                  : '#dcebcf';
            ctx.shadowColor = '#091510';
            ctx.shadowBlur = isTrueBoss ? 5 : isCaptain ? 4 : 3;
            const label =
              e.renderKind === 'enemy'
                ? isTrueBoss
                  ? 'TRUE · ' + e.name.replace(/\s+TRUE$/, '') + ' · Lv ' + e.level
                  : e.name + ' · Lv ' + e.level
                : e.renderKind === 'ally'
                  ? e.type || e.name
                  : '';
            ctx.fillText(label, p.x, p.y - spriteHeight(e) - 7);
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
          const label = worldLabelVisible(e),
            name =
              e.kind === 'mini'
                ? e.name +
                  (game.peace
                    ? ' · Peaceful'
                    : game.miniCleared(e.mini)
                      ? ' · Cleared'
                      : ' · Guardians')
                : e.name;
          if (label) {
            ctx.font = 'bold 11px system-ui';
            ctx.fillStyle = '#ffe4a2';
            ctx.shadowColor = '#07140e';
            ctx.shadowBlur = 4;
            const width =
              e.presentation === 'workstation'
                ? Math.min(ctx.measureText(name).width, canvas.width - 24)
                : 0;
            const labelX = width
              ? Math.max(width / 2 + 12, Math.min(canvas.width - width / 2 - 12, p.x))
              : p.x;
            ctx.fillText(name, labelX, p.y - spriteHeight(e) - 4, width || undefined);
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
          ctx.fillText(
            e.name || (/^barracks/.test(e.id || '') ? 'Barracks' : 'Building'),
            p.x,
            p.y - spriteHeight(e) - 4,
          );
          ctx.shadowBlur = 0;
        }
        if (e.renderKind === 'node') {
          ctx.font = '10px system-ui';
          ctx.fillStyle = '#f5e7b8';
          ctx.fillText('Dark Lord Tribute', p.x, p.y - 25);
        }
      }
      for (const l of game.s.loot.filter((l) => l.zone === game.zoneId)) {
        const p = screen(l);
        ctx.fillStyle = '#4e3823';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 5, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dcad54';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 3, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f7dfa0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 3, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff0bb';
        ctx.fillRect(p.x - 3, p.y - 8, 2, 2);
      }
      const ambientLights = [
        ...game
          .visibleNPCs()
          .filter((n) => ['rest', 'supplier', 'recruiter', 'quests', 'fountain'].includes(n.kind)),
        ...z.buildings.filter((b) => b.progress >= 4),
        ...z.props.filter((p) =>
          [
            'torch',
            'warm-brazier',
            'ember-pit',
            'fumarole',
            'house',
            'workshop',
            'market',
          ].includes(p.structure),
        ),
      ]
        .map(screen)
        .filter(
          (p) => p.x > -120 && p.x < canvas.width + 120 && p.y > -120 && p.y < canvas.height + 120,
        );
      PrototypeVisuals.atmosphere(ctx, canvas, i, {
        night: game.night(),
        peace: game.peace,
        dungeon,
        room,
        hero: screen(game.hero),
        lights: ambientLights,
      });
      // Critical outlines and transient effects retain contrast through the night grade.
      PrototypeCombatVisuals.ground(ctx, screen, game, 'cue', now() / 1000);
      for (const p of game.s.projectiles) drawProjectile(p);
      drawVisualFx();
      if (isPaused()) {
        ctx.fillStyle = '#0006';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 25px system-ui';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width * 0.65, canvas.height * 0.45);
      }
    }
    return {
      draw,
      world,
      screen,
      tileBounds,
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
      metrics: () => ({ ...stats }),
    };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
