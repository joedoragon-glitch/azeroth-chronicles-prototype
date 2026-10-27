/* Read-only skill descriptions projected from native hero-combat formulas and rules.
   No casts, purchases, temporary hero mutation or saved presentation state. */
(function (root) {
  'use strict';
  const skillCards = {
    paladin: [
      [
        'Radiant Strike',
        'Automatic sword combo / holy projectile / Radiant Cross',
        'Fire one focused holy projectile',
        'Radiant Cross: two holy pulses along four arms',
      ],
      [
        'Sundering Strike',
        'Weaken / frontal cleave',
        'Hit one foe; weaken its damage',
        'Holy Cleave: weaken a frontal group',
      ],
      [
        'Shield Stance',
        'Defense / shield knockback',
        'Raise your shield to reduce incoming damage',
        'Shield Bash: strike and push a cone',
        'No Skill 1 while raised; other damage ×0.6. Tap to lower; cooldown starts on lowering.',
      ],
      [
        'Judgment',
        'Taunt / group taunt',
        'Dodgeable holy shot: hit + draw attention',
        'Grand Judgment: splash + group taunt',
        'Boss taunt affects basic attacks briefly; scripted specials remain.',
      ],
      [
        'Holy Area',
        'Area hit / weakening wave',
        'Damage nearby foes',
        'Consecrated Wave: wider damage and weaken',
      ],
      [
        'Vanguard Rush',
        'Approach / impact push',
        'Rush to a foe and strike',
        'Vanguard Impact: rush + short push wave',
      ],
      [
        'Holy Assault',
        'Area hit / stronger weaken',
        'Damage nearby foes',
        'Oath Strike: wider damage and weaken',
      ],
      [
        'Sanctuary Oath',
        'Party ward / Last Bastion',
        'Holy area damage, self-heal and nearby party ward',
        'Last Bastion: bigger blast, self-heal, party ward and weaken',
        'No immunity. Ward and Shield Stance use only the stronger reduction.',
      ],
    ],
    mage: [
      [
        'Arcane Beam',
        'Automatic magic combo / narrow beam / wide beam',
        'Fire one narrow Arcane Beam',
        'Wide Arcane Beam: hit every enemy along the broad line',
      ],
      [
        'Frost Bolt',
        'Single slow / frost burst',
        'Hit and slow one foe',
        'Frost Burst: damage and slow around the target',
      ],
      [
        'Spell Interrupt',
        'Interrupt / bilateral silence',
        'Dodgeable bolt: stop one warned/aimed attack on hit',
        'Silence Field: block nearby special skills',
        'Silence affects you and companions too; basic attacks still work.',
      ],
      [
        'Arcane Fracture',
        'Vulnerability / group rupture',
        'Dodgeable bolt: damage and vulnerability',
        'Arcane Rupture: area damage and vulnerability',
        'Fracture never stacks; the stronger effect applies.',
      ],
      [
        'Force Pulse',
        'Push / wider force wave',
        'Damage and push nearby foes',
        'Force Wave: wider damage and stronger push',
      ],
      [
        'Magic Shot',
        'Slowing shot / focused beam',
        'Magic projectile + brief slow',
        'Focused Beam: stronger shot + slow',
      ],
      [
        'Arcane Chain',
        'Chain / wider chainstorm',
        'Damage leaps between nearby foes',
        'Chainstorm: stronger, wider chain',
      ],
      [
        'Astral Detonation',
        'Area burst / brief fracture',
        'Blast around the target; primary hit strongest',
        'Arcane Cataclysm: bigger blast and brief vulnerability',
        'No healing or immunity. Fracture is nonstacking.',
      ],
    ],
    // Working prototype names until the owner revisits bell-staff lore.
    rogue: [
      ['Ding and Sting', 'Bell burst / companion basic-damage refrain',
       'A compact jingle-bell shock damages nearby foes and helps allies strike',
       'Raise a Racket: a wider bell shock, stronger nearby allied basic strikes',
       'Both prototype names are under owner revision; mechanics stay separate from labels.'],
    ],
    ranger: [
      [
        'Rapid Arrows',
        'Automatic bow combo / rapid arrows / hunting hawk',
        'Fire three rapid arrows at one foe',
        'Hawk Interception: pursue one foe and stop an active retreat',
      ],
      [
        'Pinning Shot',
        'Two slowing arrows / line',
        'Two arrows slow one foe',
        'Pinning Volley: line hit + slow',
      ],
      [
        'Self-Heal',
        'Personal / party healing',
        'Heal yourself',
        'Party Heal: you + wounded living allies',
        'Cannot revive fallen companions.',
      ],
      [
        'Movement Haste',
        'Personal speed / companion rally',
        'Move faster',
        'Companion Rally: nearby companions move and attack faster',
        'Nearby living allies only; no dash and no faster special skills.',
      ],
      [
        'Arrow Volley',
        'Area arrows / slowing rain',
        'Hit nearby foes',
        'Arrow Rain: wider hits and slow',
      ],
      [
        'Repelling Shot',
        'Single push / repelling volley',
        'Shoot one foe and push it back',
        'Repelling Volley: 3 arrows + stronger push',
      ],
      [
        'Piercing Arrow',
        'Pierce / slowing piercing burst',
        'A powerful arrow that pierces defense',
        'Stronger defense-piercing arrow and slow',
      ],
      [
        'Hunter’s Salvo',
        'Multi-target / grand hunt',
        'Fire arrows at several foes',
        'Grand Hunt: fire two arrows per foe',
        'When isolated, fire 2 normal or 3 charged arrows at one foe. No piercing.',
      ],
    ],
  };

  function card(game, slot) {
    // Repertoire labels are working descriptions, not owner-final names.
    const experimental = {
      2: ['Lead Feet', 'Slow / Quickstep',
        'Slow nearby hostiles and quicken companions in the same area',
        'Can\'t Dance: wider Slow and stronger allied movement/recovery',
        'Phase 5 prototype name; subject to owner review.'],
      5: ['Sticky Shuffle', 'Stationary music / allied inside-circle protection',
        'Place a brief bell station that Slows enemies and steadies allies inside',
        'Briar Boogie: a larger field with finite damaging pulses and a small allied ward',
        'Provisional station concept, not a physical trap. Maximum two fields.'],
      8: ['Bad Bell Day', 'Enemy blast / allied Finale',
        'Blast nearby foes while boosting allied critical opportunity and specials',
        'Last Laugh: bigger blast and a brief non-boss hush; stronger allied Finale',
        'One later Phase 6 Rogue critical receipt per committed performance.'],
      4: ['Sour Note', 'Enemy wither / allied Mending',
        'Afflict nearby foes with timed damage and reduced incoming healing; mend allies',
        'Rotten Chorus: stronger wither, small healing budget and heal-received boon',
        'One finite damage and healing budget; no revival or recursively boosted healing.'],
      3: ['Beat Breaker', 'Native cast interrupt / Steady Beat',
        'Break a lawful enemy warning and protect nearby allied charges from damage',
        'Shut the Band Up: wider interrupt, brief non-boss hush and longer protection',
        'No immunity to death, invalid casts, Recall or boss scripting.'],
      7: ['Wrong Foot', 'Push + Weaken / Firm Footing',
        'Displace nearby enemies and weaken their attacks; bolster allied strikes',
        'Panic Party: wider shove/Weaken and stronger allied damage',
        'First-play working title; gameplay values are provisional.'],
      6: ['Stolen Beat', 'Cooldown debt / Borrowed Time',
        'Delay eligible enemy skills and accelerate allied special recovery',
        'Time Out: larger debt pulse and stronger allied recharge',
        'Phase 5 prototype name; subject to owner review.'],
    };
    const row = game.hero.class === 'rogue' && slot !== 1
      ? (game.constructor.rules.roguePerformances[slot] ? experimental[slot] : null)
      : skillCards[game.hero.class]?.[slot - 1];
    return row
      ? { name: row[0], role: row[1], tap: row[2], charge: row[3], note: row[4] || '' }
      : null;
  }
  function describe(game, slot, rank = game.hero.skills[slot - 1]) {
    const c = card(game, slot);
    if (game.hero.class === 'rogue' && slot !== 1) {
      if (!c || !Number.isInteger(rank) || rank < 1 || rank > 8) return null;
      const R = game.constructor.rules,
        entries = R.roguePerformances[slot];
      const show = (charged) => {
        const x = entries[charged ? 'charged' : 'tap'],
          metrics = [
            { key: 'reach', label: 'Reach', value: x.range, unit: '' },
            { key: 'radius', label: 'Area radius', value: x.radius, unit: '' },
            { key: 'targets', label: 'Maximum hostile targets', value: x.cap, unit: '' },
            { key: 'duration', label: 'Companion boon', value: x.seconds, unit: 's' },
            { key: 'cooldown', label: 'Cooldown',
              value: game.skillCooldown(slot, charged), unit: 's' },
          ];
        if (slot === 2) metrics.push(
          { key: 'slow', label: 'Enemy Slow',
            value: x.slow + R.cooldownBalance.slowDurationBonusSeconds, unit: 's' },
          { key: 'move', label: 'Companion movement', value: x.move * 100, unit: '%' },
          { key: 'recovery', label: 'Companion cooldown recovery',
            value: x.recovery * 100, unit: '%' },
        );
        if (slot === 5) metrics.push(
          { key: 'slow', label: 'Enemy station pulse Slow', value: x.slow, unit: 's' },
          { key: 'resistance', label: 'Inside Slow penalty resistance', value: x.slowResistance * 100, unit: '%' },
          { key: 'ward', label: 'Inside received damage reduction', value: x.ward * 100, unit: '%' },
          { key: 'stations', label: 'Maximum active stations', value: 2, unit: '' },
        );
        if (slot === 8) metrics.push(
          { key: 'damage', label: 'Enemy damage coefficient', value: x.damage, unit: 'x' },
          { key: 'criticalChance', label: 'Companion critical chance', value: x.criticalChance * 100, unit: 'pp' },
          { key: 'specialDamage', label: 'Companion special damage', value: x.specialDamage * 100, unit: '%' },
          { key: 'silence', label: 'Eligible non-boss hush', value: x.silence || 0, unit: 's' },
        );
        if (slot === 4) metrics.push(
          { key: 'dot', label: 'Enemy wither budget', value: x.dotFraction * 100, unit: '% HP, capped' },
          { key: 'antiHeal', label: 'Enemy healing reduced', value: x.antiHeal * 100, unit: '%' },
          { key: 'heal', label: 'Companion heal budget', value: x.healFraction * 100, unit: '% max HP' },
          { key: 'incomingHealing', label: 'Other incoming heals increased', value: x.incomingHealing * 100, unit: '%' },
        );
        if (slot === 3) metrics.push(
          { key: 'interruptDebt', label: 'Interrupted enemy cooldown', value: x.debt, unit: 's' },
          { key: 'silence', label: 'Eligible non-boss hush', value: x.silence || 0, unit: 's' },
          { key: 'protection', label: 'Companion cast protection', value: x.seconds, unit: 's' },
        );
        if (slot === 7) metrics.push(
          { key: 'push', label: 'Enemy push', value: x.push, unit: '' },
          { key: 'weaken', label: 'Enemy Weaken', value: x.weaken, unit: 's' },
          { key: 'outgoing', label: 'Companion outgoing damage', value: x.outgoing * 100, unit: '%' },
        );
        if (slot === 6) metrics.push(
          { key: 'debt', label: 'Enemy cooldown debt', value: x.debt, unit: 's' },
          { key: 'specialRecovery', label: 'Companion special recovery',
            value: x.specialRecovery * 100, unit: '%' },
        );
        return { title: charged ? 'Charged' : 'Tap',
          effect: charged ? c.charge : c.tap, metrics };
      };
      return { ...c, rank, auto: null, tap: show(false), charge: show(true) };
    }
    if (!c || !Number.isInteger(rank) || rank < 1 || rank > 8) return null;
    const R = game.constructor.rules,
      cls = game.hero.class,
      power = game.power(),
      scale = 1 + 0.15 * (rank - 1),
      steps = game.tacticMilestones(rank),
      tactics = R.heroTactics[cls],
      advanced = R.advancedCharges[slot]?.[cls];
    if (cls === 'rogue' && slot !== 1) return null;
    const tap = { title: 'Tap', effect: c.tap, metrics: [] },
      charge = { title: 'Charged', effect: c.charge, metrics: [] };
    function add(form, key, label, value, unit = '') {
      // Slow's shared application owner adds this duration to every landed effect.
      if (key === 'slow') value += R.cooldownBalance.slowDurationBonusSeconds;
      form.metrics.push({ key, label, value, unit });
    }
    const damage = (f, coefficient, label = 'Base damage', key = 'damage') =>
      add(f, key, label, power * coefficient * scale);
    const radius = (f, cfg) =>
      add(f, 'radius', 'Radius', cfg.radius + (cfg.radiusStep || 0) * steps);
    function weaken(f) {
      const w = R.heroTactics.paladin.weaken;
      add(f, 'weaken', 'Enemy damage reduced', (w.fraction + w.step * steps) * 100, '%');
      add(f, 'weakenDuration', 'Weaken duration', w.duration + w.durationStep * steps, 's');
    }
    function fracture(f, cfg, ultimate = false) {
      add(
        f,
        'fracture',
        'Enemy damage taken',
        (ultimate
          ? cfg.fracture + cfg.fractureStep * steps
          : cfg.fraction + cfg.fractionStep * steps) * 100,
        '% bonus',
      );
      add(
        f,
        'fractureDuration',
        'Vulnerability duration',
        ultimate ? cfg.fractureDuration : cfg.duration + cfg.durationStep * steps,
        's',
      );
    }
    for (const [f, charged] of [
      [tap, false],
      [charge, true],
    ])
      add(f, 'cooldown', 'Cooldown', game.skillCooldown(slot, charged), 's');
    let auto = null;
    if (slot === 1 && cls === 'rogue') {
      const cfg = R.rogueHeroFoundation.basic,
        base = (power + 12) * scale * cfg.primaryMultiplier,
        tapCfg = game.rogueSkill1Config(false),
        chargeCfg = game.rogueSkill1Config(true);
      auto = {
        title: 'Automatic basics',
        effect: 'Jingle-bell fan: primary plus two nearby foes, with a five-contact third-hit combo finisher. Charm will affect surviving primary only.',
        metrics: [],
      };
      add(auto, 'basicInterval', 'Basic attack interval', game.basicSkillCooldown(), 's');
      add(auto, 'comboDamage', 'Primary combo damage',
        R.basicAttackCombo.multipliers.map((v) => base * v));
      add(auto, 'splashDamage', 'Secondary damage', base * cfg.splashMultiplier);
      add(auto, 'reach', 'Reach', cfg.range);
      for (const [form, x] of [[tap, tapCfg], [charge, chargeCfg]]) {
        add(form, 'damage', 'Damage per enemy', (power + 12) * scale * x.damage);
        add(form, 'reach', 'Reach', x.range);
        add(form, 'radius', 'Area radius', x.radius);
        add(form, 'targets', 'Maximum enemy hits', x.cap);
        add(form, 'allyBuff', 'Companion basic-hit bonus', x.allyDamage * 100, '%');
        add(form, 'allyDuration', 'Companion boon duration', x.seconds, 's');
      }
    } else if (slot === 1) {
      const base = (power + 12) * scale,
        first = R.chargedSkills.first;
      auto = {
        title: 'Automatic basics',
        effect:
          'Attacks independently while moving or standing. Three same-target hits build a finishing splash; Skill 1 Tap and Charged do not reset the combo.',
        metrics: [],
      };
      add(auto, 'basicInterval', 'Basic attack interval', game.basicSkillCooldown(), 's');
      add(
        auto,
        'comboDamage',
        'Combo damage',
        R.basicAttackCombo.multipliers.map((v) => base * v),
      );
      add(
        auto,
        'splashDamage',
        'Third-hit splash',
        base * R.basicAttackCombo.finisher.secondaryMultiplier,
      );
      add(auto, 'reach', 'Reach', game.heroSkillRange(1, false));
      if (cls === 'ranger') {
        add(tap, 'damage', 'Damage per arrow', base);
        add(tap, 'arrows', 'Arrows', 3);
      } else add(tap, 'damage', 'Base damage', base * R.chargedSkills.basicDamageMultiplier);
      add(tap, 'reach', 'Reach', game.heroSkillRange(1, false));
      if (cls === 'paladin') {
        const c = first.paladin;
        add(charge, 'damage', 'Damage per pulse', base * c.damagePerPulse);
        add(charge, 'pulses', 'Pulses', c.pulses);
        add(charge, 'reach', 'Reach', c.reach + c.reachStep * steps);
        add(charge, 'width', 'Width', 2 * (c.halfWidth + c.halfWidthStep * steps));
        add(charge, 'targets', 'Max targets', c.maxTargets);
      } else if (cls === 'mage') {
        const c = first.mage;
        add(charge, 'damage', 'Damage per enemy', base * c.damage);
        add(charge, 'reach', 'Reach', c.reach + c.reachStep * steps);
        add(charge, 'width', 'Width', 2 * (c.halfWidth + c.halfWidthStep * steps));
      } else {
        const c = first.ranger;
        add(charge, 'damage', 'Base damage', base * c.damage);
        add(charge, 'reach', 'Initial target range', c.launchRange);
        add(charge, 'flight', 'Maximum flight path', c.pathBudget + c.pathStep * steps);
        add(charge, 'flightLife', 'Flight lifetime', c.lifetime, 's');
        add(charge, 'retreatLock', 'Retreat lockout', c.retreatLock + c.retreatStep * steps, 's');
      }
    } else if (slot === 2) {
      damage(
        tap,
        cls === 'ranger' ? 1.2 : 2.2,
        cls === 'ranger' ? 'Damage per arrow' : 'Base damage',
      );
      damage(charge, cls === 'ranger' ? 2.4 : 2.2);
      if (cls === 'paladin') {
        weaken(tap);
        weaken(charge);
      } else if (cls === 'mage') {
        add(tap, 'slow', 'Slow duration', 2 + steps * 0.05, 's');
        add(charge, 'slow', 'Slow duration', R.chargedSkills.second.mage.slow + steps * 0.25, 's');
      } else {
        add(tap, 'arrows', 'Arrows', 2);
        add(tap, 'slow', 'Slow duration', tactics.pin.slow + steps * tactics.pin.slowStep, 's');
        add(
          charge,
          'slow',
          'Slow duration',
          tactics.volley.slow + steps * tactics.volley.slowStep,
          's',
        );
      }
      const cfg = R.chargedSkills.second[cls];
      if (cfg.range) add(charge, 'reach', 'Reach', cfg.range + steps * 5);
      if (cfg.radius) add(charge, 'radius', 'Radius', cfg.radius + steps * 5);
      if (cfg.halfWidth) add(charge, 'width', 'Width', (cfg.halfWidth + steps * 2) * 2);
    } else if (slot === 3) {
      if (cls === 'paladin') {
        add(
          tap,
          'protection',
          'Incoming damage reduced',
          (tactics.shield.reduction + steps * tactics.shield.reductionStep) * 100,
          '%',
        );
        add(tap, 'duration', 'Duration', tactics.shield.duration, 's');
        damage(charge, tactics.bash.damage);
        damage(
          charge,
          tactics.bash.damage * tactics.bash.eliteDamage,
          'Damage vs elites',
          'eliteDamage',
        );
        add(charge, 'reach', 'Reach', tactics.bash.reach + steps * tactics.bash.reachStep);
        add(charge, 'push', 'Push distance', tactics.bash.push + steps * tactics.bash.pushStep);
      } else if (cls === 'mage') {
        add(tap, 'reach', 'Reach', tactics.interrupt.range + steps * tactics.interrupt.rangeStep);
        radius(charge, tactics.silence);
        add(
          charge,
          'duration',
          'Silence duration',
          tactics.silence.duration + steps * tactics.silence.durationStep,
          's',
        );
      } else {
        for (const f of [tap, charge])
          add(
            f,
            'healing',
            f === tap ? 'Self-healing' : 'Healing per ally',
            (45 + power * 0.5) * scale,
            ' HP',
          );
      }
    } else if (slot === 4) {
      if (cls === 'ranger') {
        add(tap, 'movement', 'Movement speed', 25, '% bonus');
        add(tap, 'duration', 'Duration', Math.min(6, 4 + 0.25 * (rank - 1)), 's');
        const cfg = tactics.rally;
        add(
          charge,
          'movement',
          'Companion movement',
          (cfg.movementBonus + cfg.movementStep * steps) * 100,
          '% bonus',
        );
        add(
          charge,
          'attackSpeed',
          'Companion basic attack speed',
          (cfg.attackSpeedBonus + cfg.attackSpeedStep * steps) * 100,
          '% bonus',
        );
        add(charge, 'duration', 'Duration', cfg.duration + cfg.durationStep * steps, 's');
        radius(charge, cfg);
      } else {
        const a = cls === 'paladin' ? tactics.judgment : tactics.fracture,
          b = cls === 'paladin' ? tactics.grandJudgment : tactics.rupture;
        damage(tap, a.damage);
        damage(charge, b.primaryDamage, 'Primary damage');
        damage(charge, b.splashDamage, 'Other targets', 'splashDamage');
        radius(charge, b);
        if (cls === 'paladin') {
          add(tap, 'taunt', 'Taunt duration', a.taunt + steps * a.tauntStep, 's');
          add(charge, 'taunt', 'Taunt duration', b.taunt + steps * b.tauntStep, 's');
        } else {
          fracture(tap, a);
          fracture(charge, b);
        }
      }
    } else if (slot === 5 || (slot === 7 && cls === 'paladin')) {
      damage(tap, slot === 7 ? 6 : 2.3);
      damage(charge, advanced.damage);
      add(
        tap,
        'targets',
        'Max targets',
        slot === 5 ? R.heroAreaTargetCaps[5].normal : R.heroAreaTargetCaps[7].paladinNormal,
      );
      add(
        charge,
        'targets',
        'Max targets',
        slot === 5 ? R.heroAreaTargetCaps[5].charged : R.heroAreaTargetCaps[7].paladinCharged,
      );
      add(tap, 'radius', 'Radius', slot === 5 ? 350 : 500);
      radius(charge, advanced);
      if (cls === 'paladin') weaken(charge);
      if (cls === 'mage') {
        add(tap, 'push', 'Push distance', 30 + steps * 3);
        add(charge, 'push', 'Push distance', advanced.push + advanced.pushStep * steps);
      }
      if (cls === 'ranger')
        add(charge, 'slow', 'Slow duration', advanced.slow + advanced.slowStep * steps, 's');
    } else if (slot === 6) {
      add(tap, 'damage', 'Base damage', (power * 1.8 + 20) * scale);
      damage(
        charge,
        advanced.damage / (cls === 'ranger' ? advanced.arrows : 1),
        cls === 'ranger' ? 'Damage per arrow' : 'Base damage',
      );
      if (cls === 'paladin') {
        radius(charge, advanced);
        add(charge, 'push', 'Push distance', advanced.push + advanced.pushStep * steps);
      }
      if (cls === 'mage') {
        add(tap, 'slow', 'Slow duration', 2, 's');
        add(charge, 'slow', 'Slow duration', advanced.slow + advanced.slowStep * steps, 's');
      }
      if (cls === 'ranger') {
        add(tap, 'push', 'Push distance', 45 + steps * 5);
        add(charge, 'arrows', 'Arrows', advanced.arrows);
        add(charge, 'push', 'Final arrow push', advanced.push + advanced.pushStep * steps);
      }
    } else if (slot === 7) {
      if (cls === 'mage')
        for (const [f, cfg] of [
          [tap, R.classUltimates.mage.chain],
          [charge, R.classUltimates.mage.chargedChain],
        ]) {
          add(
            f,
            'damage',
            'Damage: first / second / later',
            [cfg.primaryDamage, cfg.secondaryDamage, cfg.tertiaryDamage || cfg.extraDamage].map(
              (v) => power * v * scale,
            ),
          );
          add(f, 'targets', 'Max targets', cfg.targets);
          radius(f, cfg);
        }
      else {
        damage(tap, 10);
        damage(charge, advanced.damage);
        add(charge, 'slow', 'Slow duration', advanced.slow + advanced.slowStep * steps, 's');
      }
    } else if (slot === 8) {
      for (const [f, cfg] of [
        [tap, R.classUltimates[cls].normal],
        [charge, R.classUltimates[cls].charged],
      ]) {
        radius(f, cfg);
        add(f, 'targets', 'Max targets', cfg.maxTargets || cfg.targets);
        if (cls === 'ranger') {
          damage(f, cfg.damagePerArrow, 'Damage per arrow');
          add(f, 'arrows', 'Arrows per target', cfg.arrowsPerTarget || 1);
          add(f, 'isolated', 'Arrows if one foe', cfg.isolatedArrows);
        } else if (cls === 'paladin') {
          damage(f, cfg.damage);
          add(f, 'healing', 'Self-heal', game.hero.maxHp * cfg.heal, ' HP');
          add(f, 'ward', 'Party damage reduced', cfg.wardReduction * 100, '%');
          add(f, 'wardDuration', 'Ward duration', cfg.wardDuration + cfg.wardStep * steps, 's');
          if (cfg.weaken) weaken(f);
        } else {
          damage(f, cfg.primaryDamage, 'Primary damage');
          damage(f, cfg.splashDamage, 'Other targets', 'splashDamage');
          if (cfg.fracture) fracture(f, cfg, true);
        }
      }
    }
    return { ...c, rank, auto, tap, charge };
  }
  function number(value) {
    return String(Math.round((value + Number.EPSILON) * 100) / 100);
  }
  function value(metric) {
    return (
      (Array.isArray(metric.value) ? metric.value.map(number).join(' / ') : number(metric.value)) +
      metric.unit
    );
  }
  function changes(game, slot, rank = game.hero.skills[slot - 1]) {
    if (rank < 1 || rank >= 8) return [];
    const before = describe(game, slot, rank),
      after = describe(game, slot, rank + 1);
    return (slot === 1 ? ['auto', 'tap', 'charge'] : ['tap', 'charge']).map((form) => ({
      title: before[form].title,
      rows: after[form].metrics.flatMap((m) => {
        const old = before[form].metrics.find((p) => p.key === m.key);
        return JSON.stringify(old.value) === JSON.stringify(m.value)
          ? []
          : [{ label: m.label, value: value(old) + ' → ' + value(m) }];
      }),
    }));
  }
  const api = { card, describe, changes, value };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeSkillReference = api;
})(typeof window !== 'undefined' ? window : globalThis);
