/* Hero presentation catalog and Canvas art. No simulation writes, timers or assets. */
(function (root) {
  'use strict';
  const C =
    typeof module !== 'undefined' ? require('./combat-visuals.js') : root.PrototypeCombatVisuals;
  const palettes = {
    steel: ['#d4e3eb', '#7798b1'],
    holy: ['#f4d690', '#fff0be'],
    frost: ['#a7e2ed', '#e2fbff'],
    arcane: ['#ba9ee9', '#e3ceff'],
    force: ['#86d5db', '#ccf3f0'],
    arrow: ['#d5c29a', '#f0e4c8'],
    nature: ['#a9ce96', '#daebbd'],
    jingle: ['#d5a15d', '#fff0bd'],
    song: ['#a987c7', '#e7caee'],
  };
  // One row per slot, tap/charged pairs: name, silhouette, material.
  const catalog = {
    paladin: [
      [
        ['Radiant Strike', 'lance', 'holy'],
        ['Radiant Cross', 'holy-cross', 'holy'],
      ],
      [
        ['Sundering Strike', 'sunder', 'holy'],
        ['Holy Cleave', 'cleave', 'holy'],
      ],
      [
        ['Shield Stance', 'shield', 'steel'],
        ['Shield Bash', 'bash', 'steel'],
      ],
      [
        ['Judgment', 'judgment', 'holy'],
        ['Grand Judgment', 'judgment', 'holy'],
      ],
      [
        ['Holy Area', 'consecrate', 'holy'],
        ['Consecrated Wave', 'consecrate', 'holy'],
      ],
      [
        ['Vanguard Rush', 'rush', 'steel'],
        ['Vanguard Impact', 'bash', 'holy'],
      ],
      [
        ['Holy Assault', 'oath', 'holy'],
        ['Oath Strike', 'oath', 'holy'],
      ],
      [
        ['Sanctuary Oath', 'sanctuary', 'holy'],
        ['Last Bastion', 'bastion', 'holy'],
      ],
    ],
    mage: [
      [
        ['Arcane Beam', 'beam', 'arcane'],
        ['Wide Arcane Beam', 'wide-beam', 'arcane'],
      ],
      [
        ['Frost Bolt', 'ice', 'frost'],
        ['Frost Burst', 'ice', 'frost'],
      ],
      [
        ['Spell Interrupt', 'interrupt', 'arcane'],
        ['Silence Field', 'silence', 'arcane'],
      ],
      [
        ['Arcane Fracture', 'fracture', 'arcane'],
        ['Arcane Rupture', 'fracture', 'arcane'],
      ],
      [
        ['Force Pulse', 'force', 'force'],
        ['Force Wave', 'force', 'force'],
      ],
      [
        ['Magic Shot', 'bolt', 'arcane'],
        ['Focused Arcane Beam', 'beam', 'arcane'],
      ],
      [
        ['Arcane Chain', 'chain', 'arcane'],
        ['Arcane Chainstorm', 'chain', 'arcane'],
      ],
      [
        ['Astral Detonation', 'astral', 'arcane'],
        ['Arcane Cataclysm', 'cataclysm', 'arcane'],
      ],
    ],
    rogue: [
      [['Ding and Sting', 'jingle', 'jingle'], ['Raise a Racket', 'jingle', 'song']],
      [['Lead Feet', 'jingle', 'jingle'], ["Can't Dance", 'jingle', 'song']],
      [['Beat Breaker', 'jingle', 'jingle'], ['Shut the Band Up', 'jingle', 'song']],
      [['Sour Note', 'jingle', 'jingle'], ['Rotten Chorus', 'jingle', 'song']],
      [['Sticky Shuffle', 'jingle', 'jingle'], ['Briar Boogie', 'jingle', 'song']],
      [['Stolen Beat', 'jingle', 'jingle'], ['Time Out', 'jingle', 'song']],
      [['Wrong Foot', 'jingle', 'jingle'], ['Panic Party', 'jingle', 'song']],
      [['Bad Bell Day', 'jingle', 'jingle'], ['Last Laugh', 'jingle', 'song']],
    ],
    ranger: [
      [
        ['Rapid Arrows', 'arrow', 'arrow'],
        ['Hawk Interception', 'hawk', 'nature'],
      ],
      [
        ['Pinning Shot', 'pin', 'arrow'],
        ['Pinning Volley', 'pin', 'arrow'],
      ],
      [
        ['Self-Heal', 'restore', 'nature'],
        ['Party Heal', 'restore', 'nature'],
      ],
      [
        ['Movement Haste', 'haste', 'nature'],
        ['Companion Rally', 'rally', 'nature'],
      ],
      [
        ['Arrow Volley', 'volley', 'arrow'],
        ['Arrow Rain', 'volley', 'arrow'],
      ],
      [
        ['Repelling Shot', 'repel', 'arrow'],
        ['Repelling Volley', 'repel', 'arrow'],
      ],
      [
        ['Piercing Arrow', 'pierce', 'arrow'],
        ['Charged Piercing Arrow', 'pierce', 'arrow'],
      ],
      [
        ["Hunter's Salvo", 'hunt', 'arrow'],
        ['Grand Hunt', 'hunt', 'arrow'],
      ],
    ],
  };
  function profile(e) {
    // Automatic combo receipts are their own basic attack, not the promoted
    // normal Tap skill. Keep original sword/orb/bow silhouettes and foley.
    if ((e.slot || 1) === 1 && (e.automaticBasic || e.combo) && !e.charged) {
      const basics = {
        paladin: ['Sword Combo', 'slash', 'steel'],
        mage: ['Arcane Combo', 'orb', 'arcane'],
        ranger: ['Bow Combo', 'arrow', 'arrow'],
        rogue: ['Jingle Bell Combo', 'jingle', 'jingle'],
      };
      const row = basics[e.class];
      if (row) return { name: row[0], motif: row[1], material: row[2], colors: palettes[row[2]] };
    }
    const row = catalog[e.class]?.[(e.slot || 1) - 1]?.[e.charged ? 1 : 0];
    return row ? { name: row[0], motif: row[1], material: row[2], colors: palettes[row[2]] } : null;
  }
  function isHero(e) {
    return (
      e.actor === 'hero' ||
      e.source === 'hero' ||
      (e.type === 'chargedArea' && !e.companion && !!catalog[e.class])
    );
  }
  const legacyTypes = new Set([
    'spell',
    'melee',
    'swing',
    'projectileLaunch',
    'projectileImpact',
    'charged',
    'chargedArea',
    'chargedImpact',
  ]);
  function owns(e) {
    return (
      [
        'heroSkillCast',
        'heroProjectileFlight',
        'heroCharge',
        'heroDisplace',
        'heroSkillArea',
        'heroHawk',
        'hawkRetreatInterrupted',
        'skill1Tap',
      ].includes(e.type) ||
      (e.class === 'rogue' &&
        ['rogueBellBasic', 'rogueBellSkill1', 'rogueBellPerformance'].includes(e.type)) ||
      (isHero(e) && legacyTypes.has(e.type))
    );
  }
  function queue(events, push) {
    for (const original of events) {
      if (!owns(original)) continue;
      const e = {
          ...original,
          charged:
            original.charged ||
            (original.slot === 1 && ['heroSkillArea', 'heroHawk'].includes(original.type)) ||
            original.type === 'chargedArea' ||
            original.type === 'heroCharge' ||
            (original.class === 'rogue' && original.form === 'charged'),
        },
        p = profile(e);
      if (!p) continue;
      const emit = (stage, life, extra = {}) =>
        push({ ...e, ...extra, stage, ...p }, 'heroSkill', life, 4);
      if (e.class === 'rogue' && e.type === 'rogueBellBasic') {
        // Instant attack: real cast and landed primary contact only.
        emit('cast', 0.24);
        if (e.landed && Number.isFinite(e.targetX) && Number.isFinite(e.targetY))
          emit('impact', 0.3, { x: e.targetX, y: e.targetY, charged: e.combo === 3 });
      } else if (e.class === 'rogue' &&
        ['rogueBellSkill1', 'rogueBellPerformance'].includes(e.type)) {
        // One bounded circle per lawful release; no per-contact effects.
        emit('area', e.charged ? 0.54 : 0.38);
      } else if (e.type === 'heroSkillArea' && e.slot === 1) {
        // Completion documents real impacts but must not restart the visual.
        if (e.phase !== 'complete')
          emit(
            e.class === 'paladin' ? 'skill1-cross' : 'skill1-wide-beam',
            e.class === 'paladin' ? 0.36 : (e.travelSeconds || 0.625) + 0.08,
          );
      }
      else if (e.type === 'heroHawk' && e.slot === 1)
        emit('skill1-hawk-' + e.phase, e.phase === 'flight' ? 0.13 : 0.28);
      else if (e.type === 'hawkRetreatInterrupted') {
        // Contact already shows the interruption marker; avoid duplicate flashes.
      } else if (e.type === 'skill1Tap') {
        // Prior charged projectile now carries its own normal launch/contact.
      } else if (e.type === 'heroSkillCast') emit('cast', e.charged ? 0.3 : 0.22);
      else if (e.type === 'heroCharge' && e.stage === 'cancel') emit('cancel', 0.18);
      else if (e.type === 'heroDisplace') emit('displace', 0.22);
      else if (e.type === 'heroProjectileFlight') emit('launch', 0.12);
      else if (e.type === 'projectileImpact')
        emit('impact', e.landed === false ? 0.12 : e.charged ? 0.36 : 0.24);
      else if (e.type === 'melee') emit('impact', 0.25);
      else if (e.chain) emit('chain', 0.38 + e.chain.length * 0.04);
      else if (e.type === 'chargedArea' || e.type === 'spell') {
        if (e.effect === 'shield-lowered') emit('cancel', 0.18);
        else if (e.projectileVolley && e.class === 'ranger') {
          // Only the physical arrow objects may travel and announce contact.
          // Never display pre-hit or detached full-corridor decorative arrows.
          emit('cast', 0.16);
        } else emit(e.radius || e.shape ? 'area' : 'impact', e.slot === 8 ? 0.65 : 0.45);
      }
    }
  }
  function line(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  function glyph(ctx, x, y, motif, size = 10) {
    ctx.beginPath();
    if (['shield', 'bash', 'sanctuary', 'bastion'].includes(motif)) {
      ctx.moveTo(x - size * 0.7, y - size);
      ctx.lineTo(x + size * 0.7, y - size);
      ctx.lineTo(x + size * 0.6, y);
      ctx.lineTo(x, y + size * 0.8);
      ctx.lineTo(x - size * 0.6, y);
      ctx.closePath();
    } else if (motif === 'jingle') {
      // Round, slotted handheld jingle bell with its suspension eye and
      // internal rattle. Not a hanging/conical church or handbell silhouette.
      ctx.moveTo(x + size * 0.2, y - size * 0.7);
      ctx.arc(x, y - size * 0.7, size * 0.2, 0, Math.PI * 2);
      ctx.moveTo(x + size * 0.78, y + size * 0.12);
      ctx.arc(x, y + size * 0.12, size * 0.78, 0, Math.PI * 2);
      ctx.moveTo(x - size * 0.53, y - size * 0.02);
      ctx.quadraticCurveTo(x, y + size * 0.28, x + size * 0.53, y - size * 0.02);
      ctx.moveTo(x, y - size * 0.48);
      ctx.lineTo(x, y + size * 0.6);
      ctx.moveTo(x + size * 0.13, y + size * 0.57);
      ctx.arc(x, y + size * 0.57, size * 0.13, 0, Math.PI * 2);
    } else if (motif === 'holy-cross') {
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.moveTo(x - size * 0.38, y - size * 0.36);
      ctx.lineTo(x + size * 0.38, y + size * 0.36);
      ctx.moveTo(x - size * 0.38, y + size * 0.36);
      ctx.lineTo(x + size * 0.38, y - size * 0.36);
    } else if (motif === 'wide-beam') {
      ctx.moveTo(x - size * 0.9, y - size * 0.65);
      ctx.lineTo(x + size * 0.9, y - size * 0.32);
      ctx.moveTo(x - size * 0.9, y + size * 0.65);
      ctx.lineTo(x + size * 0.9, y + size * 0.32);
      ctx.moveTo(x - size * 0.9, y);
      ctx.lineTo(x + size * 0.9, y);
    } else if (motif === 'hawk') {
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size * 0.25, y - size * 0.12);
      ctx.lineTo(x - size * 0.65, y - size);
      ctx.lineTo(x - size * 0.37, y - size * 0.18);
      ctx.lineTo(x - size * 0.75, y);
      ctx.lineTo(x - size * 0.37, y + size * 0.18);
      ctx.lineTo(x - size * 0.65, y + size);
      ctx.lineTo(x + size * 0.25, y + size * 0.12);
      ctx.closePath();
    } else if (motif === 'restore') {
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
    } else if (['oath', 'judgment', 'lance'].includes(motif)) {
      ctx.moveTo(x, y - size * 1.4);
      ctx.lineTo(x + size * 0.22, y - size * 0.4);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.22, y - size * 0.4);
      ctx.closePath();
      ctx.moveTo(x - size * 0.6, y + size * 0.3);
      ctx.lineTo(x + size * 0.6, y + size * 0.3);
    } else if (['astral', 'cataclysm'].includes(motif)) {
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4,
          r = size * (j % 2 ? 0.35 : 1);
        j ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + r, y);
      }
      ctx.closePath();
      if (motif === 'cataclysm') {
        ctx.moveTo(x - size * 0.9, y - size * 0.9);
        ctx.lineTo(x + size * 0.9, y + size * 0.9);
      }
    } else if (motif === 'force') {
      for (const side of [-1, 1]) {
        ctx.moveTo(x + side * size * 0.3, y - size);
        ctx.lineTo(x + side * size, y);
        ctx.lineTo(x + side * size * 0.3, y + size);
      }
    } else if (['pin', 'pierce'].includes(motif)) {
      ctx.moveTo(x - size, y + size * 0.7);
      ctx.lineTo(x + size, y - size * 0.7);
      ctx.lineTo(x + size * 0.3, y - size * 0.6);
      ctx.moveTo(x + size, y - size * 0.7);
      ctx.lineTo(x + size * 0.6, y);
      if (motif === 'pin') {
        ctx.moveTo(x - size, y - size * 0.5);
        ctx.lineTo(x + size, y + size * 0.5);
      }
    } else if (motif === 'consecrate') {
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.moveTo(x - size * 0.5, y - size * 0.5);
      ctx.lineTo(x + size * 0.5, y + size * 0.5);
    } else if (['fracture', 'sunder'].includes(motif)) {
      ctx.moveTo(x - size * 0.6, y - size);
      ctx.lineTo(x + 1, y - 2);
      ctx.lineTo(x - 3, y + 2);
      ctx.lineTo(x + size * 0.6, y + size);
    } else if (motif === 'interrupt' || motif === 'silence') {
      ctx.arc(x, y, size, 0.3, 2.8);
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
    } else if (motif === 'ice') {
      for (let j = 0; j < 3; j++) {
        const a = (j * Math.PI) / 3,
          dx = Math.cos(a) * size,
          dy = Math.sin(a) * size;
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
      }
    } else if (['haste', 'rally', 'repel'].includes(motif)) {
      for (const dx of [-4, 4]) {
        ctx.moveTo(x + dx - 3, y + size * 0.5);
        ctx.lineTo(x + dx + 2, y);
        ctx.lineTo(x + dx - 3, y - size * 0.5);
      }
    } else {
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.6, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.6, y);
      ctx.closePath();
    }
    ctx.stroke();
  }
  function arrow(ctx, from, to, width = 1.8) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x),
      tail = { x: to.x - Math.cos(angle) * 17, y: to.y - Math.sin(angle) * 17 };
    ctx.lineWidth = width;
    line(ctx, tail, to);
    for (const side of [-1, 1])
      line(ctx, to, {
        x: to.x - Math.cos(angle + side * 0.5) * 6,
        y: to.y - Math.sin(angle + side * 0.5) * 6,
      });
    line(ctx, tail, {
      x: tail.x + Math.cos(angle + 2.5) * 5,
      y: tail.y + Math.sin(angle + 2.5) * 5,
    });
  }
  function ring(ctx, screen, center, radius) {
    C.circlePath(ctx, screen, center, radius);
    ctx.stroke();
  }
  function shards(ctx, p, progress, count, ice = false) {
    for (let j = 0; j < count; j++) {
      const angle = (j * Math.PI * 2) / count + 0.3,
        r = 7 + progress * 19,
        x = p.x + Math.cos(angle) * r,
        y = p.y + Math.sin(angle) * r * 0.6;
      if (ice) {
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x, y - 9);
        ctx.lineTo(x + 2, y + 2);
        ctx.closePath();
        ctx.stroke();
      } else line(ctx, { x, y }, { x: x + Math.cos(angle) * 5, y: y + Math.sin(angle) * 5 });
    }
  }
  // Alt B: Arcane Lance Helix. All curves are drawn with the same Canvas 2D
  // primitives used by the other hero VFX (including the Pixi Canvas overlay).
  // Never owns hit detection, saved state, random particles, or a new asset.
  function arcaneLanceHelix(ctx, points, width, phase, reduced, optimized, wide) {
    if (points.length < 2) return;
    const lengths = [0];
    for (let i = 1; i < points.length; i++)
      lengths.push(lengths[i - 1] + Math.hypot(
        points[i].x - points[i - 1].x, points[i].y - points[i - 1].y,
      ));
    const total = lengths[lengths.length - 1];
    if (!(total > 5) || !Number.isFinite(total)) return;
    const origin = points[0],
      amplitude = wide ? Math.max(3, Math.min(18, width * 0.55))
        : Math.max(2, Math.min(6, width * 0.65)),
      turns = Math.max(1, Math.min(3.25, total / (wide ? 145 : 125))),
      // Preserve the recognized double helix and runes in Optimization Mode.
      samples = reduced ? 0 : 18,
      diamonds = reduced ? 0 : (wide ? 4 : 3);
    // Samples move monotonically along the REAL rendered path. This retains
    // the ordinary homing bend and the charged beam's wall-clipped head.
    let segment = 1;
    const sample = (distance) => {
      while (segment < lengths.length - 1 && lengths[segment] < distance)
        segment++;
      const before = points[segment - 1], after = points[segment],
        length = Math.max(0.0001, lengths[segment] - lengths[segment - 1]),
        fraction = Math.max(0, Math.min(1, (distance - lengths[segment - 1]) / length));
      return {
        x: before.x + (after.x - before.x) * fraction,
        y: before.y + (after.y - before.y) * fraction,
        nx: -(after.y - before.y) / length,
        ny: (after.x - before.x) / length,
      };
    };
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (samples) {
      for (const side of [-1, 1]) {
        segment = 1;
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const t = i / samples,
            center = sample(t * total),
            // Opposing strands wind around the core; they cannot widen
            // the actual charged hit corridor.
            wave = side * Math.sin(t * turns * Math.PI * 2 + phase)
              * amplitude * Math.sin(Math.PI * t),
            x = center.x + center.nx * wave,
            y = center.y + center.ny * wave;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = side < 0 ? '#bb8af5' : '#e3b5ff';
        ctx.globalAlpha = wide ? 0.72 : 0.67;
        ctx.lineWidth = wide ? 1.65 : 1.3;
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#eed4ff';
    ctx.globalAlpha = 0.82;
    ctx.lineWidth = 1.1;
    for (let j = 0; j < diamonds; j++) {
      segment = 1;
      const t = (j + 0.7) / (diamonds + 0.5),
        center = sample(t * total),
        offset = (j % 2 ? -1 : 1) * amplitude * 0.7,
        x = center.x + center.nx * offset,
        y = center.y + center.ny * offset,
        r = wide ? 3.8 : 2.9;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.68, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.68, y);
      ctx.closePath();
      ctx.stroke();
    }
    // An open, bounded casting sigil follows the live Mage, never the old
    // projectile launch coordinate. Reduced motion keeps this static cue.
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#d9aaff';
    ctx.lineWidth = wide ? 1.5 : 1.2;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, wide ? 12 : 8, 0, Math.PI * 2);
    ctx.stroke();
    if (!reduced) {
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, wide ? 17 : 12, -0.75, Math.PI + 0.75);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Class Skill 1 physical spell geometry is supplied by simulation receipts,
  // not inferred from cosmetic particles or a separate targeting resolver.
  function skill1Signature(ctx, screen, f, reduced = false, optimized = false) {
    const age = f.max - f.life,
      fade = Math.min(1, f.life / Math.min(f.max, 0.17)),
      grow = reduced ? 1 : Math.min(1, age / 0.12);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (f.stage === 'skill1-cross') {
      const center = { x: f.x, y: f.y },
        reach = f.reach,
        half = f.halfWidth,
        a = f.angle,
        ca = Math.cos(a),
        sa = Math.sin(a),
        endpoints =
          Array.isArray(f.arms) && f.arms.length === 4
            ? f.arms.map((to) => [center, to])
            : [
                [
                  { x: center.x - ca * reach, y: center.y - sa * reach },
                  { x: center.x + ca * reach, y: center.y + sa * reach },
                ],
                [
                  { x: center.x + sa * reach, y: center.y - ca * reach },
                  { x: center.x - sa * reach, y: center.y + ca * reach },
                ],
              ];
      ctx.globalAlpha = fade * (f.pulse ? 0.55 : 0.43);
      ctx.fillStyle = '#dfb45b';
      for (const pair of endpoints) {
        const dx = pair[1].x - pair[0].x,
          dy = pair[1].y - pair[0].y,
          len = Math.max(1, Math.hypot(dx, dy)),
          nx = (-dy / len) * half,
          ny = (dx / len) * half;
        C.polygon(ctx, screen, [
          { x: pair[0].x + nx, y: pair[0].y + ny },
          { x: pair[1].x + nx, y: pair[1].y + ny },
          { x: pair[1].x - nx, y: pair[1].y - ny },
          { x: pair[0].x - nx, y: pair[0].y - ny },
        ]);
        ctx.fill();
      }
      ctx.globalAlpha = fade * 0.83;
      ctx.strokeStyle = '#fff1b8';
      for (const pair of endpoints) {
        const one = screen(pair[0]),
          two = screen(pair[1]);
        const thickness = Math.hypot(
          screen({ x: center.x + half * sa, y: center.y - half * ca }).x - screen(center).x,
          screen({ x: center.x + half * sa, y: center.y - half * ca }).y - screen(center).y,
        );
        ctx.lineWidth = Math.max(1.5, thickness * 0.19);
        line(ctx, one, two);
      }
      const p = screen(center);
      ctx.lineWidth = 2;
      glyph(ctx, p.x, p.y - 5, 'lance', reduced ? 8 : 12 + 4 * grow);
    } else if (f.stage === 'skill1-wide-beam') {
      const from = { x: f.x, y: f.y },
        // Render the same advancing front that simulation uses for contact.
        // Reduced motion removes decorative shimmer, never the travel delay.
        progress = Math.min(1, age / Math.max(0.01, f.travelSeconds || 0.625)),
        to = f.simulatedFront
          ? { x: f.endX, y: f.endY }
          : {
              x: f.x + (f.endX - f.x) * progress,
              y: f.y + (f.endY - f.y) * progress,
            },
        start = screen(from),
        end = screen(to),
        shift = {
          x: from.x - f.halfWidth * Math.sin(Math.atan2(to.y - from.y, to.x - from.x)),
          y: from.y + f.halfWidth * Math.cos(Math.atan2(to.y - from.y, to.x - from.x)),
        };
      // The low-opacity wash still marks the FULL gameplay hit corridor.
      // Concentrated light and two procedural helix strands replace the old
      // solid-looking violet slab without changing width, range or contacts.
      ctx.globalAlpha = fade * 0.16;
      ctx.fillStyle = '#9368db';
      const dx = to.x - from.x,
        dy = to.y - from.y,
        len = Math.max(1, Math.hypot(dx, dy)),
        nx = (-dy / len) * f.halfWidth,
        ny = (dx / len) * f.halfWidth;
      C.polygon(ctx, screen, [
        { x: from.x + nx, y: from.y + ny },
        { x: to.x + nx, y: to.y + ny },
        { x: to.x - nx, y: to.y - ny },
        { x: from.x - nx, y: from.y - ny },
      ]);
      ctx.fill();
      const visibleHalfWidth = Math.hypot(
        screen(shift).x - start.x, screen(shift).y - start.y,
      );
      ctx.globalAlpha = fade * 0.35;
      ctx.strokeStyle = '#a46de7';
      ctx.lineWidth = Math.max(5, Math.min(15, visibleHalfWidth * 0.27));
      line(ctx, start, end);
      ctx.globalAlpha = fade * 0.93;
      ctx.strokeStyle = '#ead0ff';
      ctx.lineWidth = Math.max(2.4, Math.min(5.5, visibleHalfWidth * 0.095));
      line(ctx, start, end);
      ctx.strokeStyle = '#fff7ff';
      ctx.lineWidth = 1.25;
      line(ctx, start, end);
      arcaneLanceHelix(
        ctx, [start, end], visibleHalfWidth, age * 8,
        reduced, optimized, true,
      );
    } else if (f.stage.startsWith('skill1-hawk-')) {
      const p = screen(f),
        a = f.angle || 0;
      ctx.translate(p.x, p.y - 12);
      ctx.rotate(a);
      ctx.globalAlpha = fade * (f.phase === 'expire' ? 0.25 : 0.9);
      ctx.strokeStyle = f.phase === 'impact' ? '#f2ecb0' : '#d9e4ac';
      ctx.fillStyle = '#b9d29f';
      ctx.lineWidth = reduced ? 1.8 : 2.5;
      if (f.phase === 'flight' && !reduced) {
        const q = screen({ x: f.fromX ?? f.x, y: f.fromY ?? f.y });
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(q.x - p.x, q.y - p.y);
        ctx.stroke();
      }
      // Original top-down angular raptor silhouette: head, swept wings,
      // feathers and tapered tail, oriented in the actual chase direction.
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(5, -3);
      ctx.quadraticCurveTo(-4, -17, -17, -18);
      ctx.lineTo(-9, -6);
      ctx.lineTo(-14, -2);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-14, 2);
      ctx.lineTo(-9, 6);
      ctx.lineTo(-17, 18);
      ctx.quadraticCurveTo(-4, 17, 5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (f.phase === 'impact') {
        ctx.strokeStyle = '#fff5bd';
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) line(ctx, { x: 0, y: 0 }, { x: 16, y: side * 13 });
        if (f.interrupted) {
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.stroke();
          line(ctx, { x: -7, y: 12 }, { x: 8, y: -12 });
        }
      }
    }
    ctx.restore();
  }
  function draw(
    ctx,
    screen,
    f,
    { reduced = false, optimized = false, width = 1280, height = 800 } = {},
  ) {
    if (f.stage?.startsWith('skill1-')) {
      skill1Signature(ctx, screen, f, reduced, optimized);
      return;
    }
    const p = screen(f),
      age = f.max - f.life,
      fade = Math.max(0, Math.min(1, f.life / 0.15)),
      t = reduced ? 0.55 : Math.min(1, age / f.max),
      [color, light] = f.colors || palettes.arcane,
      count = reduced ? 0 : optimized ? 3 : 6;
    // Bounded footprints can straddle the viewport even when their center is offscreen.
    if (p.x < -800 || p.x > width + 800 || p.y < -800 || p.y > height + 800) return;
    ctx.save();
    ctx.globalAlpha = fade * 0.85;
    ctx.strokeStyle = color;
    ctx.fillStyle = light;
    ctx.lineWidth = f.charged ? 2.3 : 1.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (f.stage === 'chain') {
      const points = [{ x: f.fromX, y: f.fromY }, ...f.chain];
      for (let i = 1; i < points.length; i++) {
        if (!reduced && age < (i - 1) * 0.045) continue;
        const a = screen(points[i - 1]),
          b = screen(points[i]);
        ctx.globalAlpha = fade * (i === points.length - 1 ? 0.85 : 0.65);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - 16);
        const dx = b.x - a.x,
          dy = b.y - a.y;
        for (let j = 1; j < 5; j++) {
          const offset = reduced ? 0 : j % 2 ? 4 : -4;
          ctx.lineTo(
            a.x + (dx * j) / 5 - (dy / Math.max(1, Math.hypot(dx, dy))) * offset,
            a.y - 16 + (dy * j) / 5 + (dx / Math.max(1, Math.hypot(dx, dy))) * offset,
          );
        }
        ctx.lineTo(b.x, b.y - 16);
        ctx.stroke();
        glyph(ctx, b.x, b.y - 16, 'orb', f.charged ? 8 : 5);
      }
    } else if (f.stage === 'cancel') {
      ctx.globalAlpha = fade * 0.45;
      glyph(ctx, p.x, p.y - 19, f.motif, reduced ? 8 : 10 - t * 5);
    } else if (f.stage === 'displace') {
      const from = screen({ x: f.fromX, y: f.fromY });
      ctx.globalAlpha = fade * 0.5;
      line(ctx, from, p);
      glyph(ctx, p.x, p.y - 10, 'repel', 7);
    } else if (f.stage === 'launch') {
      const physical = f.class === 'ranger';
      glyph(ctx, p.x, p.y - 15, physical ? 'repel' : f.motif, f.charged ? 8 : 5);
    } else if (f.stage === 'cast') {
      if (f.projectileVolley && f.class === 'ranger') {
        // A bow-release glint only. Real shafts are drawn by the projectile
        // renderer using the same coordinates as their collision segments.
        ctx.globalAlpha = fade * 0.55;
        glyph(ctx, p.x, p.y - 16, 'arrow', 8);
      } else if (f.class === 'rogue') {
        glyph(ctx, p.x, p.y - 24, 'jingle', 9);
        ctx.globalAlpha = fade * 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 17, 16 + 9 * t, -1.15, 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y - 17, 16 + 9 * t, Math.PI - 0.25, Math.PI + 1.15);
        ctx.stroke();
      } else if (f.class === 'paladin' && [1, 2, 6].includes(f.slot) && !(f.charged && f.slot === 1)) {
        const target = screen({ x: f.targetX ?? f.x + 50, y: f.targetY ?? f.y }),
          a = Math.atan2(target.y - p.y, target.x - p.x),
          swing = reduced ? 0 : (t - 0.5) * 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 16, f.charged ? 33 : 25, a - 0.8 + swing, a + 0.3 + swing);
        ctx.stroke();
        if (f.slot === 6 && !reduced) {
          const from = screen({ x: f.fromX, y: f.fromY });
          ctx.globalAlpha = fade * 0.4;
          line(ctx, from, p);
        }
      } else if ([3, 4].includes(f.slot) || f.charged) {
        glyph(ctx, p.x, p.y - 22, f.motif, f.charged ? 13 : 9);
      }
    } else if (f.stage === 'impact') {
      if (f.landed === false) {
        ctx.globalAlpha *= 0.35;
        glyph(ctx, p.x, p.y - 12, 'shield', 6);
      } else {
        glyph(ctx, p.x, p.y - 13, f.motif, (f.charged ? 14 : 10) * (0.85 + t * 0.3));
        shards(ctx, { x: p.x, y: p.y - 12 }, t, count, f.material === 'frost');
        if (f.motif === 'judgment') {
          line(ctx, { x: p.x, y: p.y - (f.charged ? 67 : 45) }, { x: p.x, y: p.y - 8 });
          line(ctx, { x: p.x - 9, y: p.y - 32 }, { x: p.x + 9, y: p.y - 32 });
        }
        if (f.motif === 'pierce') {
          const a = screen({
            x: f.x - (f.directionX || 1) * 25,
            y: f.y - (f.directionY || 0) * 25,
          });
          line(ctx, a, { x: p.x + (p.x - a.x) * 0.5, y: p.y + (p.y - a.y) * 0.5 });
        }
      }
    } else if (f.stage === 'area') {
      const radius = Math.max(0, f.radius || f.range || 0),
        origin = { x: f.fromX ?? f.x, y: f.fromY ?? f.y };
      ctx.globalAlpha = fade * 0.3;
      if (f.shape === 'cone') {
        C.polygon(ctx, screen, C.sectorPoints(origin, radius, f.angle, f.halfAngle));
        ctx.stroke();
        if (!reduced) {
          ctx.globalAlpha = fade * 0.65;
          C.polygon(
            ctx,
            screen,
            C.sectorPoints(origin, radius * (0.4 + t * 0.6), f.angle, f.halfAngle),
          );
          ctx.stroke();
        }
      } else if (f.shape === 'line') {
        const end = {
          x: origin.x + Math.cos(f.angle) * radius,
          y: origin.y + Math.sin(f.angle) * radius,
        };
        C.polygon(ctx, screen, C.capsulePoints(origin, end, f.halfWidth));
        ctx.stroke();
        for (const lane of [-0.6, 0, 0.6]) {
          const side = lane * f.halfWidth,
            a = screen({
              x: origin.x - Math.sin(f.angle) * side,
              y: origin.y + Math.cos(f.angle) * side,
            }),
            b = screen({
              x: end.x - Math.sin(f.angle) * side,
              y: end.y + Math.cos(f.angle) * side,
            });
          ctx.globalAlpha = fade * 0.85;
          const flight = reduced ? 0.65 : Math.min(1, t * 3);
          arrow(ctx, a, { x: a.x + (b.x - a.x) * flight, y: a.y + (b.y - a.y) * flight });
        }
      } else if (radius && !(f.class === 'ranger' && [5, 8].includes(f.slot))) {
        // Open rings, never opaque arena-sized fills or white screen flashes.
        ring(ctx, screen, f, radius);
        ctx.globalAlpha = fade * 0.62;
        const expansion = f.motif === 'silence' ? 1 : 0.22 + Math.min(1, t * 2) * 0.78;
        ring(ctx, screen, f, radius * expansion);
        if (f.charged && ['force', 'cataclysm', 'consecrate'].includes(f.motif)) {
          ctx.globalAlpha = fade * 0.28;
          ring(ctx, screen, f, radius * Math.max(0.15, expansion - 0.17));
        }
        for (let j = 0; j < (reduced ? 4 : count); j++) {
          const angle = (j * Math.PI * 2) / (reduced ? 4 : count),
            q = screen({
              x: f.x + Math.cos(angle) * radius * 0.8,
              y: f.y + Math.sin(angle) * radius * 0.8,
            });
          ctx.globalAlpha = fade * 0.65;
          glyph(ctx, q.x, q.y - 5, f.motif, f.charged ? 8 : 5);
        }
      }
      if (f.class === 'ranger' && f.slot === 5 && f.contacts) {
        // Existing tap damage is instant. These brief streaks visualize its actual
        // contacts and never become simulated projectiles or delay the damage.
        for (const hit of f.contacts.slice(0, 8)) {
          const q = screen(hit);
          ctx.globalAlpha = fade * 0.7;
          arrow(ctx, { x: p.x, y: p.y - 14 }, { x: q.x, y: q.y - 10 });
          glyph(ctx, q.x, q.y - 10, 'arrow', 5);
        }
      }
      if (
        [
          'judgment',
          'fracture',
          'astral',
          'cataclysm',
          'restore',
          'sanctuary',
          'bastion',
          'rally',
        ].includes(f.motif)
      ) {
        ctx.globalAlpha = fade * 0.8;
        glyph(ctx, p.x, p.y - 18, f.motif, f.slot === 8 ? 19 : 13);
        if (f.motif === 'judgment') line(ctx, { x: p.x, y: p.y - 75 }, { x: p.x, y: p.y - 10 });
      }
      if (f.material === 'frost') shards(ctx, p, t, count, true);
    }
    ctx.restore();
  }
  // The combo's contact cone uses the same arcane material as its flying orbs.
  // Paint within the actual hit sector; this never owns hit tests or damage.
  function basicFinisher(ctx, screen, f, { reduced = false, optimized = false } = {}) {
    if (f.class !== 'mage') return false;
    const origin = { x: f.fromX, y: f.fromY },
      from = screen(origin),
      [color, light] = palettes.arcane,
      age = Math.max(0, Math.min(1, 1 - f.life / f.max)),
      fade = Math.max(0, Math.min(1, f.life / 0.15)),
      front = reduced ? 0.8 : 0.3 + 0.7 * (1 - (1 - age) ** 2),
      point = (distance, angle) =>
        screen({
          x: origin.x + Math.cos(angle) * distance,
          y: origin.y + Math.sin(angle) * distance,
        }),
      tip = point(f.range, f.angle);
    ctx.save();
    C.polygon(ctx, screen, C.sectorPoints(origin, f.range, f.angle, f.halfAngle));
    ctx.clip();
    // A translucent violet fan, without the old opaque-looking blue perimeter.
    const wash = ctx.createLinearGradient(from.x, from.y, tip.x, tip.y);
    wash.addColorStop(0, '#9956db08');
    wash.addColorStop(0.38, '#9956db3d');
    wash.addColorStop(1, '#9956db00');
    ctx.globalAlpha = fade;
    ctx.fillStyle = wash;
    ctx.fill();
    const arc = (distance) => {
      ctx.beginPath();
      for (let j = 0; j <= 20; j++) {
        const q = point(distance, f.angle - f.halfAngle + (j / 20) * f.halfAngle * 2);
        j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = fade * 0.24;
    ctx.lineWidth = reduced ? 3 : 7;
    arc(f.range * front);
    ctx.strokeStyle = light;
    ctx.globalAlpha = fade * 0.8;
    ctx.lineWidth = 1.5;
    arc(f.range * front);
    // Bounded outward streaks and small arcane sparks give the hit movement.
    const count = reduced ? 0 : optimized ? 3 : 7;
    for (let j = 0; j < count; j++) {
      const angle = f.angle + ((j + 0.5) / count - 0.5) * f.halfAngle * 1.7,
        head = point(f.range * front * (0.76 + (j % 3) * 0.1), angle),
        tail = point(f.range * Math.max(0.12, front - 0.28), angle);
      ctx.globalAlpha = fade * 0.55;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      line(ctx, tail, head);
      ctx.strokeStyle = light;
      glyph(ctx, head.x, head.y, 'orb', j % 2 ? 2 : 3);
    }
    ctx.restore();
    return true;
  }
  // Physical Ranger arrows are rigid world-locked objects, not ribbons.
  // Auto-attack combos and each delayed normal Skill 1 shaft share this art.
  function rangerFlightArrow(ctx, q, angle, piercing = false, charged = false) {
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(angle);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#57462f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-21, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.strokeStyle = piercing ? '#e6edbe' : '#dacb9f';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-21, -0.35);
    ctx.lineTo(2, -0.35);
    ctx.stroke();
    ctx.fillStyle = piercing ? '#f2f4ce' : '#c3c5b2';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(0, -3.3);
    ctx.lineTo(1, 0);
    ctx.lineTo(0, 3.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b4b8a4';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-27, side * 3.1);
      ctx.lineTo(-23, side * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    if (charged) {
      ctx.strokeStyle = '#c4dda4';
      ctx.globalAlpha *= 0.55;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(3, -5);
      ctx.lineTo(5, -3);
      ctx.stroke();
    }
    ctx.restore();
  }
  function projectile(ctx, screen, p, heroClass, reduced = false, caster = null) {
    if (p.source !== 'hero') return false;
    // Crossing the delay threshold does not release a staggered arrow until
    // simulation places its actual collider at the moving Ranger's bow.
    if (p.delay > 0 || p.rangerDelayedLaunch) return true;
    const def = profile({ class: heroClass, slot: p.slot || 1, charged: p.charged });
    if (!def) return false;
    const q = screen(p),
      tail = screen({ x: p.x - p.dx * 28, y: p.y - p.dy * 28 }),
      angle = Math.atan2(q.y - tail.y, q.x - tail.x);
    ctx.save();
    ctx.strokeStyle = def.colors[0];
    ctx.fillStyle = def.colors[1];
    ctx.lineWidth = p.charged ? 2.2 : 1.5;
    if (heroClass === 'ranger' && p.style === 'arrow') {
      // This is the actual renderer for ALL physical Ranger arrows; the
      // generic renderer fallback never sees these basic/Skill 1 projectiles.
      rangerFlightArrow(ctx, q, angle, !!p.piercing, !!p.charged);
    } else if (heroClass === 'ranger') {
      arrow(ctx, tail, q, p.piercing ? 2.4 : 1.7);
    } else if (p.style === 'beam') {
      const start = {
          x: p.originX ?? p.x,
          y: p.originY ?? p.y,
        },
        attached = p.mageSkill1Homing && caster && caster.hp > 0,
        origin = attached ? caster : start,
        width = p.beamWidthScale || 1,
        path = p.mageSkill1Homing ? p.trailPoints || [] : [];
      // The spell's damaging head follows its physical homing flight, while
      // its luminous tail is visually tethered to the moving caster.
      // Old flight breadcrumbs bend proportionally toward the live origin;
      // the distant head stays fixed, so it never teleports with the hero.
      const beamPoints = [screen(origin)],
        stride = Math.max(1, Math.ceil(path.length / 18));
      for (let i = 1; i < path.length; i += stride) {
        const fraction = i / Math.max(1, path.length),
          pull = attached ? (1 - fraction) ** 2 : 0,
          point = path[i];
        beamPoints.push(screen({
          x: point.x + (origin.x - start.x) * pull,
          y: point.y + (origin.y - start.y) * pull,
        }));
      }
      beamPoints.push(q);
      const strokeBeam = () => {
        ctx.beginPath();
        ctx.moveTo(beamPoints[0].x, beamPoints[0].y);
        for (let i = 1; i < beamPoints.length; i++)
          ctx.lineTo(beamPoints[i].x, beamPoints[i].y);
        ctx.stroke();
      };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = (reduced ? 4 : 7) * width;
      strokeBeam();
      ctx.globalAlpha = 0.94;
      ctx.lineWidth = 2 * width;
      ctx.strokeStyle = '#ead0ff';
      strokeBeam();
      // Only Mage Skill 1 is caster-tethered; Skill 6 keeps its distinct art.
      if (p.mageSkill1Homing)
        arcaneLanceHelix(
          ctx, beamPoints, (reduced ? 4 : 7) * width * 0.55,
          (p.traveled || 0) * 0.03, reduced, false, false,
        );
      ctx.strokeStyle = '#fff7ff';
      ctx.lineWidth = 1.05;
      strokeBeam();
      glyph(ctx, q.x, q.y, 'orb', 5.2 * Math.sqrt(width));
    } else if (p.style === 'holy') {
      ctx.translate(q.x, q.y);
      ctx.rotate(angle);
      glyph(ctx, 0, 0, 'orb', 11);
      line(ctx, { x: -8, y: 0 }, { x: 10, y: 0 });
    } else if (p.effect === 'frost') {
      ctx.translate(q.x, q.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fill();
      if (!reduced) {
        ctx.globalAlpha = 0.5;
        line(ctx, { x: -13, y: -4 }, { x: -5, y: 0 });
        line(ctx, { x: -13, y: 4 }, { x: -5, y: 0 });
      }
    } else {
      glyph(ctx, q.x, q.y, p.slot === 6 ? 'fracture' : 'orb', p.combo === 3 ? 8 : 6);
      if (!reduced) {
        ctx.globalAlpha = 0.4;
        line(ctx, tail, q);
      }
    }
    ctx.restore();
    return true;
  }
  function charge(ctx, screen, hero, cast, reduced = false) {
    if (!cast || cast.waiting) return;
    const def = profile({ class: hero.class, slot: cast.slot, charged: true }),
      p = screen(hero);
    if (!def) return;
    const progress = cast.progress,
      valid = cast.state === 'charging' || cast.ready;
    ctx.save();
    ctx.strokeStyle = valid ? def.colors[0] : '#a39b91';
    ctx.lineWidth = cast.ready ? 2.5 : 1.5;
    ctx.globalAlpha = 0.8;
    // Fixed glyph and filling arc stay readable when motion is reduced.
    glyph(ctx, p.x + 23, p.y - 26, def.motif, 6 + progress * 2);
    ctx.beginPath();
    ctx.arc(p.x + 23, p.y - 26, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    if (!reduced && valid && !cast.ready) {
      for (let j = 0; j < 3; j++) {
        const a = (j * Math.PI * 2) / 3,
          r = 27 - progress * 12;
        line(
          ctx,
          { x: p.x + 23 + Math.cos(a) * r, y: p.y - 26 + Math.sin(a) * r },
          { x: p.x + 23 + Math.cos(a) * (r + 3), y: p.y - 26 + Math.sin(a) * (r + 3) },
        );
      }
    }
    if (cast.ready) {
      ctx.strokeStyle = def.colors[1];
      glyph(ctx, p.x + 23, p.y - 26, def.motif, 4);
    }
    ctx.restore();
  }
  function queued(ctx, screen, hero, requests) {
    if (!requests?.length) return;
    const p = screen(hero),
      columns = Math.min(8, requests.length),
      firstX = p.x - ((columns - 1) * 25) / 2;
    ctx.save();
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i],
        x = firstX + (i % columns) * 25,
        y = p.y + 15 + Math.floor(i / columns) * 19;
      ctx.fillStyle = request.ready ? request.color : '#14232de8';
      ctx.strokeStyle = request.color;
      ctx.lineWidth = request.charging ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = request.ready ? '#14232d' : request.color;
      ctx.fillText(request.slot + (request.charged ? 'C' : 'N'), x, y + 0.5);
    }
    ctx.restore();
  }
  function statuses(ctx, screen, game, width, height) {
    // Preserve the existing budgets: at most three markers per enemy and 24
    // enemies per draw. Reserve those slots for consequential active statuses
    // and the selected target / bosses rather than raw world-array order.
    const now = game.s.time;
    // The held Target button is tracked separately from the squad focus.
    // Read its current-zone id without calling selectedHeroTarget(), which
    // can mutate stale selection and must not run as a rendering side effect.
    const selectedId =
      (game.manualHeroTargetZone === game.zoneId && game.manualHeroTargetId) ||
      game.s.heroTarget || game.hero.order?.id || null;
    const chosen = [];
    const limit = 24;
    for (const e of game.zone().enemies) {
      if (e.hp <= 0 || e.returning) continue;
      const priority = e.id === selectedId ? 4 :
        e.type === 'boss' ? 3 : e.captain || e.roomCaptain ? 2 : 0;
      // Once the budget is full, normal enemies cannot replace another
      // normal enemy. Keep scanning cheaply for a late boss or hero target.
      if (chosen.length >= limit && !priority) continue;
      const p = screen(e);
      if (p.x < -35 || p.x > width + 35 || p.y < -70 || p.y > height + 35) continue;
      const marks = [];
      // Control effects must not be hidden behind older debuff glyphs.
      if (game.mageSilenceActive(e)) marks.push(['silence', palettes.arcane[0]]);
      if ((e.tauntUntil || 0) > now) marks.push(['judgment', palettes.holy[0]]);
      if (e.slow > 0) marks.push(['ice', palettes.frost[0]]);
      if ((e.fractureUntil || 0) > now) marks.push(['fracture', palettes.arcane[0]]);
      if ((e.weakenUntil || 0) > now) marks.push(['sunder', palettes.holy[0]]);
      if (!marks.length) continue;
      const item = { p, marks, priority };
      if (chosen.length < limit) {
        chosen.push(item);
      } else {
        let lowest = 0;
        for (let i = 1; i < chosen.length; i++)
          if (chosen[i].priority < chosen[lowest].priority) lowest = i;
        if (priority > chosen[lowest].priority) chosen[lowest] = item;
      }
    }
    ctx.save();
    ctx.lineWidth = 1.6;
    for (const { p, marks } of chosen) {
      const visible = marks.length > 3 ? 2 : marks.length;
      for (let i = 0; i < visible; i++) {
        const [motif, color] = marks[i],
          x = p.x + 25,
          y = p.y - 17 + i * 13;
        ctx.strokeStyle = '#17242b';
        ctx.lineWidth = 3.5;
        glyph(ctx, x, y, motif, 4);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        glyph(ctx, x, y, motif, 4);
      }
      if (marks.length > 3) {
        // One overflow marker replaces the third full-size glyph. No extra
        // icon slot, screen-wide aura or additional per-enemy drawing pass.
        const x = p.x + 25, y = p.y + 9;
        ctx.fillStyle = '#17242be8';
        ctx.fillRect(x - 8, y - 7, 16, 12);
        ctx.fillStyle = '#f4f6e5';
        ctx.font = 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+' + (marks.length - 2), x, y - 1);
      }
    }
    for (const ally of [game.hero, ...game.activeLivingParty()]) {
      const p = screen(ally);
      if ((ally.wardUntil || 0) > now) {
        ctx.strokeStyle = palettes.holy[0];
        glyph(ctx, p.x + 22, p.y - 24, 'shield', 6);
      }
      if (ally.rangerRallyZone === game.zoneId && ally.rangerRallyUntil > now) {
        ctx.strokeStyle = palettes.nature[0];
        glyph(ctx, p.x + 22, p.y - 10, 'rally', 6);
      }
      if (game.mageSilenceActive(ally)) {
        ctx.strokeStyle = palettes.arcane[0];
        glyph(ctx, p.x - 22, p.y - 20, 'silence', 5);
      }
    }
    ctx.restore();
  }
  const api = {
    catalog,
    profile,
    owns,
    queue,
    draw,
    basicFinisher,
    projectile,
    charge,
    queued,
    statuses,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeHeroPresentation = api;
})(typeof window !== 'undefined' ? window : globalThis);
