/* Companion roster, orders, formations, combat skills and Ranger support. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    class Party {
      companionAttackDamage(u) {
        return u.damage + this.hero.level * 2 + this.companionInheritedDamageBonus();
      }
      companionSecondSkillUnlocked() {
        return (this.s.companionCombatTraining || 1) >= 2;
      }
      companionSecondSkillTargets(u, target) {
        const def = R.companionSkills?.second?.[u.type];
        if (!def || !target) return [];
        const angle = Math.atan2(target.y - u.y, target.x - u.x),
          from = { x: u.x, y: u.y },
          delta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)),
          end = {
            x: u.x + Math.cos(angle) * (def.range || 0),
            y: u.y + Math.sin(angle) * (def.range || 0),
          };
        return this.zone()
          .enemies.filter(
            (e) =>
              e.hp > 0 &&
              !e.neutral &&
              this.line(u, e) &&
              (def.shape === 'cone'
                ? dist(e, u) <= def.range &&
                  Math.abs(delta(Math.atan2(e.y - u.y, e.x - u.x), angle)) <= def.halfAngle
                : def.shape === 'line'
                  ? (() => {
                      const along = (e.x - u.x) * Math.cos(angle) + (e.y - u.y) * Math.sin(angle);
                      return (
                        along >= 0 &&
                        along <= def.range &&
                        this.distanceToSegment(e, from, end) <= def.halfWidth
                      );
                    })()
                  : false),
          )
          .sort((a, b) => this.idOrder(a, b));
      }
      companionUseFirstSkill(u, target) {
        const cfg = R.companionSkills?.first,
          def = cfg?.[u.type];
        if (!cfg || !def || !target || (u.skill1Cd || 0) > 0) return false;
        const base = this.companionAttackDamage(u);
        if (u.type === 'soldier') {
          if (dist(u, target) > 80 || !this.line(u, target)) return false;
          if (!this.damage(target, base * cfg.multiplier, u.id)) return false;
          u.skill1Cd = cfg.cooldown;
          u.skillGlobalCd = R.companionSkills.globalCooldown || 1.5;
          u.cd = Math.max(u.cd, 0.4);
          this.event('melee', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: 'sword',
            x: target.x,
            y: target.y,
            target: target.id,
            special: 'power-strike',
          });
          this.event('swing', {
            actor: 'companion',
            role: 'soldier',
            source: u.id,
            weapon: 'sword',
            x: u.x,
            y: u.y,
            targetX: target.x,
            targetY: target.y,
            combo: 3,
            companionSkill: 'power-strike',
          });
          this.event('companionSkill', {
            source: u.id,
            unitType: u.type,
            skill: 'power-strike',
            targetId: target.id,
          });
          return true;
        }
        if (dist(u, target) > 320 || !this.line(u, target)) return false;
        u.skill1Cd = cfg.cooldown;
        u.skillGlobalCd = R.companionSkills.globalCooldown || 1.5;
        u.cd = Math.max(u.cd, 0.4);
        const shot = Math.max(1, dist(u, target));
        for (let j = 0; j < 3; j++)
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (target.x - u.x) / shot,
            dy: (target.y - u.y) / shot,
            target: target.id,
            damage: base,
            source: u.id,
            speed: 520,
            delay: j * 0.08,
            style: 'arrow',
            rapid: true,
            companionSkill: 'triple-shot',
          });
        this.event('projectileLaunch', {
          actor: 'companion',
          role: 'archer',
          source: u.id,
          style: 'arrow',
          count: 3,
          special: 'triple-shot',
          x: u.x,
          y: u.y,
          target: target.id,
        });
        this.event('companionSkill', {
          source: u.id,
          unitType: u.type,
          skill: 'triple-shot',
          targetId: target.id,
        });
        return true;
      }
      companionUseSecondSkill(u, target, targets = this.companionSecondSkillTargets(u, target)) {
        const cfg = R.companionSkills?.second,
          def = cfg?.[u.type];
        if (
          !this.companionSecondSkillUnlocked() ||
          !cfg ||
          !def ||
          !target ||
          (u.skill2Cd || 0) > 0 ||
          !targets.length
        )
          return false;
        const base = this.companionAttackDamage(u),
          damage = base * def.multiplier,
          angle = Math.atan2(target.y - u.y, target.x - u.x);
        let hits = 0;
        for (const e of targets) if (this.damage(e, damage, u.id)) hits++;
        if (!hits) return false;
        u.skill2Cd = cfg.cooldown;
        u.skillGlobalCd = R.companionSkills.globalCooldown || 1.5;
        u.cd = Math.max(u.cd, 0.5);
        this.event(
          u.type === 'soldier' ? 'melee' : 'spell',
          u.type === 'soldier'
            ? {
                actor: 'companion',
                role: 'soldier',
                source: u.id,
                weapon: 'sword',
                x: target.x,
                y: target.y,
                target: target.id,
                special: 'holy-cleave',
              }
            : {
                actor: 'companion',
                role: 'archer',
                class: 'ranger',
                source: u.id,
                x: u.x,
                y: u.y,
                special: 'piercing-volley',
              },
        );
        this.event('chargedArea', {
          slot: 2,
          class: u.type === 'soldier' ? 'paladin' : 'ranger',
          companion: true,
          actor: 'companion',
          role: u.type,
          source: u.id,
          targetId: target.id,
          effect: def.effect,
          shape: def.shape,
          x: target.x,
          y: target.y,
          fromX: u.x,
          fromY: u.y,
          angle,
          radius: 0,
          range: def.range || 0,
          halfAngle: def.halfAngle || 0,
          halfWidth: def.halfWidth || 0,
          hits,
        });
        this.event('companionSkill', {
          source: u.id,
          unitType: u.type,
          skill: u.type === 'soldier' ? 'holy-cleave' : 'piercing-volley',
          targetId: target.id,
          hits,
        });
        return true;
      }
      companionTrySkill(u, target) {
        if (!target || (u.skillGlobalCd || 0) > 0) return false;
        const secondReady = this.companionSecondSkillUnlocked() && (u.skill2Cd || 0) <= 0,
          secondTargets = secondReady ? this.companionSecondSkillTargets(u, target) : [];
        if (
          secondReady &&
          (secondTargets.length >= 2 || (u.skill1Cd || 0) > 0) &&
          this.companionUseSecondSkill(u, target, secondTargets)
        )
          return true;
        if ((u.skill1Cd || 0) <= 0 && this.companionUseFirstSkill(u, target)) return true;
        if (secondReady && this.companionUseSecondSkill(u, target, secondTargets)) return true;
        return false;
      }
      unit(type, x, y) {
        const base = { soldier: [120, 12, '⚔️'], archer: [105, 15, '🏹'] }[type];
        if (!base) throw Error('Unknown companion type');
        const maxHp = this.companionMaxHp(type);
        return {
          id: 'ally-' + this.s.nextId++,
          type,
          x,
          y,
          hp: maxHp,
          maxHp,
          damage: base[1],
          icon: base[2],
          cd: 0,
          skill1Cd: 0,
          skill2Cd: 0,
          skillGlobalCd: 0,
          healCd: 0,
          manaCd: 0,
          survivalCd: 0,
          immune: 0,
          supportEffects: [],
          order: null,
          carry: 0,
          active: true,
        };
      }
      queuedCompanions() {
        return Object.values(this.s.zones).reduce(
          (n, z) => n + z.buildings.filter((b) => b.queue > 0).length,
          0,
        );
      }
      activeParty() {
        return this.s.party.filter((u) => u.active !== false);
      }
      activeLivingParty() {
        return this.s.party.filter((u) => u.active !== false && u.hp > 0);
      }
      barracksFieldCap(b) {
        return b?.full ? this.expeditionPartyCap() : Math.min(3, this.expeditionPartyCap());
      }
      rosterCount() {
        return this.s.party.length;
      }
      depositSite(u) {
        const z = this.isDungeon() ? this.s.zones[this.definition().id] : this.zone(),
          i = this.regionIndex(),
          sites = [
            ...(z?.npcs.filter((n) => n.kind === 'rest') || []),
            ...(this.isDungeon()
              ? []
              : z?.buildings.filter((b) => b.progress >= 4 && b.full) || []),
            { x: D.towns[i][0], y: D.towns[i][1] },
          ];
        return sites.sort((a, b) => dist(a, u) - dist(b, u))[0];
      }
      availableRangers(type) {
        const key = type === 'health' ? 'healCd' : 'manaCd';
        return this.activeLivingParty().filter((u) => u.type === 'archer' && (u[key] || 0) <= 0);
      }
      supportEffectActive(type) {
        return [this.hero, ...this.activeLivingParty()].some((u) =>
          (u.supportEffects || []).some((e) => e.type === type),
        );
      }
      hasSupportEffect(u, type) {
        return (u.supportEffects || []).some((e) => e.type === type);
      }
      addSupportEffect(u, type, amount) {
        if (!u.supportEffects) u.supportEffects = [];
        u.supportEffects.push({ type, remaining: amount, seconds: R.rangerSupport.duration });
      }
      rangerSupport(type, manual = true, targetOverride = null) {
        if (
          !['health', 'mana'].includes(type) ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver
        )
          return false;
        const rangers = this.availableRangers(type),
          key = type === 'health' ? 'healCd' : 'manaCd';
        if (!rangers.length) {
          if (manual) {
            const active = this.activeLivingParty().filter((u) => u.type === 'archer');
            if (!active.length)
              this.say(
                'No active Ranger is available to use ' +
                  (type === 'health' ? 'Heal.' : 'Mana Recovery.'),
              );
            else
              this.say(
                (type === 'health' ? 'Heal' : 'Mana Recovery') +
                  ' is cooling down · ' +
                  Math.ceil(Math.min(...active.map((u) => u[key] || 0))) +
                  's.',
              );
          }
          return false;
        }
        if (type === 'health') {
          const injured = [this.hero, ...this.activeLivingParty()].filter(
            (u) => u.hp > 0 && u.hp < u.maxHp && !this.hasSupportEffect(u, 'health'),
          );
          if (!injured.length) {
            if (manual) this.say('The active party is already fully covered or at full health.');
            return false;
          }
          const target =
              targetOverride && injured.includes(targetOverride)
                ? targetOverride
                : injured.includes(this.hero)
                  ? this.hero
                  : injured.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0],
            ranger = rangers[0],
            amount = this.rangerSupportAmount(type);
          ranger[key] = R.rangerSupport.cooldown;
          this.addSupportEffect(target, type, amount);
          this.say(
            'Ranger casts Heal on ' +
              (target === this.hero
                ? 'the hero'
                : target.type === 'archer'
                  ? 'a Ranger'
                  : 'a Soldier') +
              ' · restoring ' +
              amount +
              ' HP over five seconds.',
          );
          this.event('heal', {
            x: target.x,
            y: target.y,
            fromX: ranger.x,
            fromY: ranger.y,
            resource: 'health',
            target: target === this.hero ? 'hero' : target.id,
          });
          return true;
        }
        if (this.hero.mp >= this.hero.maxMp || this.hasSupportEffect(this.hero, 'mana')) {
          if (manual)
            this.say(
              this.hero.mp >= this.hero.maxMp
                ? 'Hero mana is already full.'
                : 'Mana Recovery is already restoring the hero.',
            );
          return false;
        }
        const ranger = rangers[0],
          amount = this.rangerSupportAmount(type);
        ranger[key] = R.rangerSupport.cooldown;
        this.addSupportEffect(this.hero, type, amount);
        this.say(
          'Ranger casts Mana Recovery · hero restoring ' + amount + ' MP over five seconds.',
        );
        this.event('heal', {
          x: this.hero.x,
          y: this.hero.y,
          fromX: ranger.x,
          fromY: ranger.y,
          resource: 'mana',
          target: 'hero',
        });
        return true;
      }
      potion(type) {
        return this.rangerSupport(type, true);
      }
      updateRangerSupport(dt) {
        for (const u of [this.hero, ...this.s.party]) {
          if (!Array.isArray(u.supportEffects)) u.supportEffects = [];
          const next = [];
          for (const e of u.supportEffects) {
            if (u.hp <= 0) continue;
            const field = e.type === 'health' ? 'hp' : 'mp',
              max = e.type === 'health' ? 'maxHp' : 'maxMp';
            if (field === 'mp' && u !== this.hero) continue;
            if (u[field] >= u[max]) continue;
            const step = Math.min(dt, e.seconds),
              amount = (e.remaining * step) / e.seconds;
            u[field] = Math.min(u[max], u[field] + amount);
            e.remaining = Math.max(0, e.remaining - amount);
            e.seconds = Math.max(0, e.seconds - step);
            if (e.seconds > 0 && e.remaining > 0 && u[field] < u[max]) next.push(e);
          }
          u.supportEffects = next;
        }
      }
      autoRangerSupport() {
        const h = this.hero;
        if (h.hp <= 0 || this.s.challenge.pending || this.s.challenge.gameOver) return;
        const engaged = this.manaCombatActive(),
          healThreshold = engaged ? R.rangerSupport.healThreshold : 1,
          manaThreshold = engaged ? R.rangerSupport.manaThreshold : 1;
        for (const ranger of this.availableRangers('health').slice()) {
          const candidates = [h, ...this.activeLivingParty()].filter(
            (u) =>
              u.hp > 0 &&
              u.hp < u.maxHp &&
              u.hp <= u.maxHp * healThreshold &&
              !this.hasSupportEffect(u, 'health'),
          );
          if (!candidates.length) break;
          const target = candidates.includes(h)
            ? h
            : candidates.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (!this.rangerSupport('health', false, target)) break;
        }
        if (h.mp < h.maxMp && h.mp <= h.maxMp * manaThreshold && !this.hasSupportEffect(h, 'mana'))
          this.rangerSupport('mana', false);
      }
      recruit(type) {
        const price = this.recruitPrice(type);
        if ((this.s.expeditionRank || 1) < 2) {
          this.say(
            'Recruitment unlocks at Expedition 2. Rescue Mira and train the Expedition Skill.',
          );
          return false;
        }
        if (!price) return false;
        if (this.rosterCount() >= 3) {
          this.say('Town recruitment limit reached. Build a barracks to recruit more companions.');
          return false;
        }
        if (!this.spend(price)) return false;
        const p = this.safe(this.hero.x + 50, this.hero.y + 50),
          u = this.unit(type, p.x, p.y);
        u.active = this.activeParty().length < this.expeditionPartyCap();
        this.s.party.push(u);
        return true;
      }
      recover() {
        const dead = this.s.party.find((u) => u.hp <= 0);
        if (!dead || !this.spend(this.companionRecoveryCost())) return false;
        const id = dead.id,
          active = dead.active !== false,
          u = this.unit(dead.type, this.hero.x + 40, this.hero.y);
        Object.assign(dead, u, { id, active });
        return true;
      }
      treatCompanions() {
        const wounded = this.s.party.filter((u) => u.hp > 0 && u.hp < u.maxHp);
        if (!wounded.length) return false;
        if (this.refugeThreat()) {
          this.say(
            'Cannot treat companions while nearby enemies are engaged. Retreat and end the fight first.',
          );
          return false;
        }
        if (!this.spend(this.companionTreatmentCost())) return false;
        for (const u of wounded) {
          u.hp = u.maxHp;
          this.event('heal', { x: u.x, y: u.y, resource: 'health', target: u.id });
        }
        this.say(
          'Living companions treated at the barracks. Fallen companions still require recovery.',
        );
        return true;
      }
      availableLabor() {
        return this.activeLivingParty().filter(
          (u) => ['soldier', 'archer'].includes(u.type) && !u.order,
        );
      }
      restCompanion(id) {
        const u = this.s.party.find((u) => u.id === id && u.active !== false);
        if (!u || this.refugeThreat()) return false;
        u.active = false;
        u.order = null;
        u.path = [];
        return true;
      }
      activateCompanion(id, barracksId) {
        const u = this.s.party.find((u) => u.id === id && u.active === false),
          b = this.zone().buildings.find((b) => b.id === barracksId && b.progress >= 4);
        if (
          !u ||
          !b ||
          u.hp <= 0 ||
          this.refugeThreat() ||
          this.activeParty().length >= this.barracksFieldCap(b)
        )
          return false;
        u.active = true;
        Object.assign(u, this.safe(b.x + 45, b.y + 45));
        u.order = null;
        return true;
      }
      dismissCompanion(id) {
        const i = this.s.party.findIndex((u) => u.id === id && u.active === false);
        if (i < 0) return false;
        this.s.party.splice(i, 1);
        return true;
      }
      squadDefaultDoctrine() {
        return this.hero.class === 'paladin' ? 'focus' : 'guard';
      }
      squadThreats() {
        return this.zone().enemies.filter(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            !e.returning &&
            e.aggro &&
            dist(e, this.hero) < (e.type === 'boss' || e.summon ? 720 : 540),
        );
      }
      squadContext() {
        const threats = this.squadThreats(),
          bossEnemy =
            threats
              .filter((e) => e.type === 'boss')
              .sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0] || null;
        return { engaged: threats.length > 0, boss: !!bossEnemy, bossEnemy, threats };
      }
      syncSquadDoctrine() {
        const context = this.squadContext(),
          phase = context.engaged ? (context.boss ? 'boss' : 'field') : null;
        if (!phase) {
          if (this.s.squadEngagement) {
            this.s.squadEngagement = null;
            this.s.squadBoss = false;
            this.s.squadDoctrine = this.squadDefaultDoctrine();
            this.s.heroTarget = null;
          }
          return context;
        }
        if (this.s.squadEngagement !== phase) {
          // Keep an explicit doctrine choice for the whole continuous encounter,
          // even if an adds-only phase briefly loses sight of its boss.
          const enteringCombat = !this.s.squadEngagement;
          this.s.squadEngagement = phase;
          this.s.squadBoss = context.boss;
          if (enteringCombat) this.s.squadDoctrine = this.squadDefaultDoctrine();
        }
        return context;
      }
      toggleSquadDoctrine() {
        if ((this.s.expeditionRank || 1) < 3) return false;
        const context = this.syncSquadDoctrine();
        if (!context.engaged) return false;
        this.s.squadDoctrine = this.s.squadDoctrine === 'focus' ? 'guard' : 'focus';
        this.event('squadDoctrine', { mode: this.s.squadDoctrine, boss: context.boss });
        return true;
      }
      squadDoctrineLabel() {
        const context = this.syncSquadDoctrine();
        return {
          active: context.engaged,
          boss: context.boss,
          mode: this.s.squadDoctrine,
          label: context.boss
            ? this.s.squadDoctrine === 'focus'
              ? 'BOSS'
              : 'ADDS'
            : this.s.squadDoctrine === 'focus'
              ? 'TARGET'
              : 'THREATS',
        };
      }
      recallParty() {
        this.s.recallActive = true;
        this.hero.order = null;
        for (const u of this.activeLivingParty()) {
          u.order = null;
          u.path = [];
          u.routeAge = 0;
        }
        this.say('Squad recalled. Companions are regrouping on the hero.');
        this.event('squadRecall');
        return true;
      }
      partyFormationOffset(u, living = this.activeLivingParty()) {
        const rangedHero = this.hero.class === 'mage' || this.hero.class === 'ranger',
          same = living.filter((v) => v.type === u.type && !v.order),
          index = Math.max(
            0,
            same.findIndex((v) => v.id === u.id),
          );
        const ranged = {
            archer: [
              [-34, -24],
              [34, -24],
              [0, -52],
              [-62, -45],
              [62, -45],
              [0, -78],
            ],
            soldier: [
              [0, 95],
              [-90, 45],
              [90, 45],
              [-110, -25],
              [110, -25],
              [0, -105],
            ],
          },
          melee = {
            soldier: [
              [-42, -20],
              [42, -20],
              [0, -55],
              [-68, -50],
              [68, -50],
              [0, 35],
            ],
            archer: [
              [-65, -115],
              [65, -115],
              [0, -145],
              [-105, -145],
              [105, -145],
              [0, -175],
            ],
          },
          slots = (rangedHero ? ranged : melee)[u.type] || [[0, -100]];
        return slots[index % slots.length];
      }
      partyFollowPoint(u, living = this.activeLivingParty()) {
        const [side, forward] = this.partyFormationOffset(u, living),
          heading = this.formationHeading || { x: 0, y: 1 },
          n = Math.hypot(heading.x, heading.y) || 1,
          fx = heading.x / n,
          fy = heading.y / n,
          rx = -fy,
          ry = fx,
          p = {
            x: this.hero.x + fx * forward + rx * side,
            y: this.hero.y + fy * forward + ry * side,
          };
        try {
          return this.blocked(p.x, p.y) ? this.safe(this.hero.x, this.hero.y) : p;
        } catch (_) {
          return this.hero;
        }
      }
      followPartyMember(u, living, dt) {
        const d = dist(u, this.hero),
          speed =
            this.companionMoveSpeed(d > 650 ? 500 : d > 350 ? 390 : d > 200 ? 315 : 255) *
            (u.slow > 0 ? 0.65 : 1);
        return this.follow(u, this.partyFollowPoint(u, living), speed, dt, 45);
      }
      soldierScreenTarget(u, targets, living, claimed) {
        const protectedUnits = [
            this.hero,
            ...living.filter((v) => v.type === 'archer' && !v.order),
          ],
          pressure = (e) => Math.min(...protectedUnits.map((p) => dist(e, p))),
          band = (e) => (pressure(e) < 150 ? 0 : pressure(e) < 280 ? 1 : 2);
        return (
          targets
            .filter((e) => dist(u, e) < 620)
            .sort(
              (a, b) =>
                band(a) - band(b) ||
                (claimed.has(a.id) ? 1 : 0) - (claimed.has(b.id) ? 1 : 0) ||
                pressure(a) - pressure(b) ||
                dist(a, u) - dist(b, u),
            )[0] || null
        );
      }
      archerCombatPoint(u, e, living) {
        const anchor = this.partyFollowPoint(u, living),
          preferred = 250,
          anchorRange = dist(anchor, e);
        if (anchorRange <= 280 && this.line(anchor, e)) return anchor;
        const dx = anchor.x - e.x,
          dy = anchor.y - e.y,
          n = Math.hypot(dx, dy) || 1,
          p = { x: e.x + (dx / n) * preferred, y: e.y + (dy / n) * preferred };
        try {
          return this.blocked(p.x, p.y) ? this.safe(p.x, p.y) : p;
        } catch (_) {
          return anchor;
        }
      }
      archerFallbackPoint(u, e, living) {
        const anchor = this.partyFollowPoint(u, living),
          d = dist(anchor, e);
        if (d >= 190) return anchor;
        const dx = anchor.x - e.x,
          dy = anchor.y - e.y,
          n = Math.hypot(dx, dy) || 1,
          p = { x: anchor.x + (dx / n) * (190 - d + 55), y: anchor.y + (dy / n) * (190 - d + 55) };
        try {
          return this.blocked(p.x, p.y) ? anchor : p;
        } catch (_) {
          return anchor;
        }
      }
      updateParty(dt) {
        const z = this.zone(),
          living = this.activeLivingParty(),
          context = this.syncSquadDoctrine(),
          claimed = new Set();
        // Target intent is transient: active selection, not proximity or party size.
        this._tacticalPartyTargets = new Map();
        for (const u of living)
          if (
            context.engaged &&
            u.type === 'soldier' &&
            u.hp <= u.maxHp * 0.5 &&
            (u.survivalCd || 0) <= 0
          ) {
            u.survivalCd = 14;
            u.immune = Math.max(u.immune || 0, 2.5);
            this.event('spell', { x: u.x, y: u.y, target: u.id, kind: 'soldierGuard' });
          }
        if (this.s.recallActive && living.every((u) => dist(u, this.hero) < 165))
          this.s.recallActive = false;
        const crowdTarget = (u, targets) =>
          targets
            .filter((e) => dist(u, e) < 620)
            .sort(
              (a, b) =>
                (claimed.has(a.id) ? 1 : 0) - (claimed.has(b.id) ? 1 : 0) ||
                dist(a, this.hero) - dist(b, this.hero) ||
                dist(a, u) - dist(b, u),
            )[0] || null;
        for (const u of living) {
          u.slow = Math.max(0, (u.slow || 0) - dt);
          u.cd = Math.max(0, u.cd - dt);
          u.skill1Cd = Math.max(0, (u.skill1Cd || 0) - dt);
          u.skill2Cd = Math.max(0, (u.skill2Cd || 0) - dt);
          u.skillGlobalCd = Math.max(0, (u.skillGlobalCd || 0) - dt);
          if (u.order?.type === 'build') {
            const b = z.buildings.find((b) => b.id === u.order.id);
            if (b && b.progress < 4) {
              if (dist(u, b) > 85)
                this.follow(u, b, this.companionMoveSpeed(230) * (u.slow > 0 ? 0.65 : 1), dt, 70);
              else {
                b.progress = Math.min(4, b.progress + dt);
                if (b.progress >= 4) {
                  u.order = null;
                  this.say('Barracks construction complete.');
                  this.event('construction', { id: b.id });
                  this.checkQuests();
                }
              }
            } else u.order = null;
            continue;
          }
          if (u.order?.type === 'upgrade') {
            const b = z.buildings.find((b) => b.id === u.order.id);
            if (b && b.progress >= 4 && !b.full && b.upgradePaid) {
              if (dist(u, b) > 85)
                this.follow(u, b, this.companionMoveSpeed(230) * (u.slow > 0 ? 0.65 : 1), dt, 70);
              else {
                b.upgradeProgress = Math.min(4, (b.upgradeProgress || 0) + dt);
                if (b.upgradeProgress >= 4) {
                  b.full = true;
                  b.upgradeProgress = 4;
                  u.order = null;
                  this.say('Full barracks ready.');
                  this.event('barracksUpgrade', { id: b.id });
                }
              }
            } else u.order = null;
            continue;
          }
          if (u.order?.type === 'gather') {
            const n = z.nodes.find((n) => n.id === u.order.id);
            if (n && n.amount > 0 && (!n.mini || this.peace || this.miniCleared(n.mini))) {
              if (dist(u, n) > 60)
                this.follow(u, n, this.companionMoveSpeed(230) * (u.slow > 0 ? 0.65 : 1), dt);
              else {
                const amount = Math.min(n.amount, 12 * dt);
                n.amount = Math.max(0, n.amount - amount);
                u.carry += amount;
                this.s.gathered[this.definition().id] =
                  (this.s.gathered[this.definition().id] || 0) + amount;
              }
              if (u.carry >= 35 || n.amount <= 0)
                u.order = { type: 'deposit', id: n.id, group: n.resourceGroup };
            } else u.order = { type: 'deposit', id: u.order.id, group: u.order.group };
            continue;
          }
          if (u.order?.type === 'deposit') {
            const deposit = this.depositSite(u);
            if (dist(u, deposit) > 130)
              this.follow(u, deposit, this.companionMoveSpeed(230) * (u.slow > 0 ? 0.65 : 1), dt);
            else {
              const payout = this.resourceDepositReward(u.carry);
              this.grant(payout, 0);
              u.carry = Math.max(0, u.carry - payout);
              const current = z.nodes.find(
                  (n) => n.id === u.order.id && n.amount > 0 && this.tributeKnown(n),
                ),
                next =
                  current ||
                  z.nodes.find(
                    (n) =>
                      u.order.group &&
                      n.resourceGroup === u.order.group &&
                      n.amount > 0 &&
                      this.tributeKnown(n),
                  );
              u.order = next ? { type: 'gather', id: next.id, group: next.resourceGroup } : null;
            }
            continue;
          }
          if (u.order) u.order = null;
          if (this.peace || this.s.recallActive) {
            this.followPartyMember(u, living, dt);
            continue;
          }
          let e = null;
          if (context.engaged) {
            if (context.boss) {
              if (this.s.squadDoctrine === 'focus') e = context.bossEnemy;
              else {
                // ADDS: completely ignore boss damage while living adds need
                // clearing, then attack the boss until fresh adds appear.
                // Include this boss's summons even before they approach the hero;
                // also screen unrelated active attackers pressuring the party.
                // An explicit BOSS order above always overrides this policy.
                const adds = [
                  ...new Map(
                    [
                      ...context.threats.filter((x) => x.type !== 'boss'),
                      ...z.enemies.filter(
                        (x) =>
                          x.hp > 0 &&
                          x.summon &&
                          x.owner === context.bossEnemy.id &&
                          !x.neutral &&
                          !x.returning,
                      ),
                    ].map((x) => [x.id, x]),
                  ).values(),
                ];
                if (adds.length) {
                  e =
                    (u.type === 'soldier'
                      ? this.soldierScreenTarget(u, adds, living, claimed)
                      : crowdTarget(u, adds)) ||
                    adds
                      .slice()
                      .sort(
                        (a, b) =>
                          (claimed.has(a.id) ? 1 : 0) - (claimed.has(b.id) ? 1 : 0) ||
                          dist(a, this.hero) - dist(b, this.hero) ||
                          dist(a, u) - dist(b, u),
                      )[0];
                } else e = context.bossEnemy;
              }
            } else if (this.s.squadDoctrine === 'focus') {
              e =
                context.threats.find((x) => x.id === this.s.heroTarget) ||
                context.threats
                  .slice()
                  .sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0] ||
                null;
            } else
              e =
                u.type === 'soldier'
                  ? this.soldierScreenTarget(u, context.threats, living, claimed)
                  : crowdTarget(u, context.threats);
          }
          if (!e) {
            this.followPartyMember(u, living, dt);
            continue;
          }
          claimed.add(e.id);
          this._tacticalPartyTargets.set(u.id, e.id);
          if (u.type === 'archer') {
            const d = dist(u, e),
              visible = this.line(u, e),
              anchor = this.partyFollowPoint(u, living);
            if (d < 150) {
              this.follow(
                u,
                this.archerFallbackPoint(u, e, living),
                this.companionMoveSpeed(270) * (u.slow > 0 ? 0.65 : 1),
                dt,
                35,
              );
              continue;
            }
            if (d > 280 || !visible) {
              this.follow(
                u,
                this.archerCombatPoint(u, e, living),
                this.companionMoveSpeed(260) * (u.slow > 0 ? 0.65 : 1),
                dt,
                35,
              );
              continue;
            }
            if (dist(u, anchor) > 70 && dist(anchor, e) <= 280 && this.line(anchor, e)) {
              this.follow(
                u,
                anchor,
                this.companionMoveSpeed(245) * (u.slow > 0 ? 0.65 : 1),
                dt,
                35,
              );
              continue;
            }
            if (this.companionTrySkill(u, e)) continue;
            if (u.cd <= 0) {
              u.cd = 0.85;
              const shot = Math.max(1, d);
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: u.x,
                y: u.y,
                dx: (e.x - u.x) / shot,
                dy: (e.y - u.y) / shot,
                target: e.id,
                damage: this.companionAttackDamage(u),
                source: u.id,
                speed: 450,
                style: 'arrow',
              });
              this.event('projectileLaunch', {
                actor: 'companion',
                role: 'archer',
                source: u.id,
                style: 'arrow',
                x: u.x,
                y: u.y,
                target: e.id,
              });
            }
            continue;
          }
          if (this.line(u, e) && dist(u, e) <= 185 && this.companionTrySkill(u, e)) continue;
          if (dist(u, e) > 65 || !this.line(u, e))
            this.follow(
              u,
              e,
              this.companionMoveSpeed(250) * (u.slow > 0 ? 0.65 : 1),
              dt,
              this.line(u, e) ? 55 : 0,
            );
          else if (u.cd <= 0) {
            u.cd = 0.85;
            if (this.damage(e, this.companionAttackDamage(u), u.id))
              this.event('melee', {
                actor: 'companion',
                role: 'soldier',
                source: u.id,
                weapon: 'sword',
                x: e.x,
                y: e.y,
                target: e.id,
              });
          }
        }
        const finishRecruit = (b) => {
          if (b.queue > 0) {
            b.queue = Math.max(0, b.queue - dt);
            if (b.queue === 0) {
              const p = this.safe(b.x + 50, b.y + 50),
                type = ['soldier', 'archer'].includes(b.queueType) ? b.queueType : 'soldier',
                u = this.unit(type, p.x, p.y);
              u.active = this.activeParty().length < this.barracksFieldCap(b);
              this.s.party.push(u);
              b.queueType = null;
            }
          }
        };
        for (const b of z.buildings) finishRecruit(b);
      }
    }
    for (const name of Object.getOwnPropertyNames(Party.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Party.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeParty = api;
})(typeof window !== 'undefined' ? window : globalThis);
