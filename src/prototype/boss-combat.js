/* Boss attack selection, sequences, geometry, summons and attack resolution. Shared with captain/night attacks where the existing rules reuse these primitives. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class BossCombat {
      clearEncounterState(e, units = [this.hero, ...this.s.party]) {
        for (const u of units) {
          if (u.keeperHeld === e.id) delete u.keeperHeld;
          if (e.deathRoll?.victim === (u === units[0] ? 'hero' : u.id)) delete u.deathRollHeld;
        }
        e.telegraph = null;
        e.sequence = [];
        e.motion = null;
        e.rangedAim = null;
        for (const key of [
          'thornFightAnchor',
          'hookedVictim',
          'deathRoll',
          'ashCloud',
          'ashNextAt',
          'ledgerOpen',
          'ledgerMarkedId',
          'ledgerMarkUntil',
          'ledgerNextAt',
          'mireLowestHpRatio',
          'sabotageCd',
          'anastylosis',
          'anastylosisCd',
          'quotaTarget',
          'strainHardeningStacks',
          'strainHardeningUntil',
          'emergencyStabilizationUsed',
          'emergencyStabilizationUntil',
        ])
          delete e[key];
        if (e.quotaOvertime !== undefined) e.quotaOvertime = 0;
        if (e.type === 'boss') {
          e.trueEntourageSpawned = false;
          e.trueHalfSummonWave = false;
        }
        if (e.captain || e.roomCaptain) {
          e.captainPhase = false;
          e.captainPhaseMove = 1;
          e.captainAttackRate = 1;
          e.captainGuard = 0;
          e.captainReflect = 0;
          e.captainPursuit = 0;
          e.captainOvertimeCd = 0;
          e.captainOpeningSummon = false;
        }
      }
      cancelEncounter(e) {
        this.clearEncounterState(e);
        this.s.projectiles = this.s.projectiles.filter((p) => p.sourceId !== e.id);
        this.s.hazards = this.s.hazards.filter((h) => h.source !== e.id && h.sourceId !== e.id);
        for (const u of this.zone().enemies)
          if (u.summon && u.owner === e.id) {
            u.hp = 0;
            u.aggro = false;
            this.clearEncounterState(u);
          }
        this.zone().enemies = this.zone().enemies.filter((u) => !(u.summon && u.owner === e.id));
      }
      clearEncounterUnits(units = [this.hero, ...this.s.party]) {
        for (const u of units)
          for (const key of [
            'keeperHeld',
            'deathRollHeld',
            'ashLastAt',
            'mireBogLastAt',
            'mireBogExposure',
          ])
            delete u[key];
      }

      rechargeOwnMud(dt) {
        if (this.peace || dt <= 0) return;
        for (const e of this.zone().enemies) {
          if (
            e.type !== 'boss' ||
            e.family !== 'mire' ||
            e.hp <= 0 ||
            !e.aggro ||
            e.returning ||
            e.neutral
          )
            continue;
          // Overlapping beds form one wet footprint, never multiple healing
          // streams. Clip the final interval to the longest live owned bed.
          let wetSeconds = 0;
          for (const h of this.s.hazards)
            if (
              h.family === 'mire' &&
              h.index === 2 &&
              h.kind === 'circle' &&
              h.sourceId === e.id &&
              h.life > 0 &&
              dist(e, h) < h.radius
            )
              wetSeconds = Math.max(wetSeconds, Math.min(dt, h.life));
          const rate = R.marchesPassives.groundwaterRecharge[e.form === 'true' ? 'true' : 'normal'];
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * rate * wetSeconds);
        }
      }

      recordMarchesDamage(e, actualDamage) {
        if (actualDamage <= 0 || e.hp <= 0) return;
        if (e.type === 'boss' && e.family === 'mire')
          e.mireLowestHpRatio = Math.min(e.mireLowestHpRatio ?? 1, e.hp / e.maxHp);
        if (e.roomCaptain && e.captainProfile === 'supply-march') {
          const p = R.marchesPassives.strainHardening,
            active = (e.strainHardeningUntil || 0) > this.s.time;
          e.strainHardeningStacks = Math.min(
            p.maxStacks,
            (active ? e.strainHardeningStacks || 0 : 0) + 1,
          );
          e.strainHardeningUntil = this.s.time + p.duration;
        }
        if (
          e.type === 'boss' &&
          e.family === 'archive' &&
          !e.emergencyStabilizationUsed &&
          e.hp <= e.maxHp * R.marchesPassives.emergencyStabilization.threshold
        ) {
          const p = R.marchesPassives.emergencyStabilization[e.form === 'true' ? 'true' : 'normal'];
          e.emergencyStabilizationUsed = true;
          e.emergencyStabilizationUntil = this.s.time + p.duration;
          this.say(e.name + ' uses Emergency Stabilization.');
          this.event('captainPhase', { profile: 'archive', name: 'Emergency Stabilization' });
        }
      }

      advanceQueuedAttack(e) {
        const a = e.sequence?.shift() || null;
        if (a?.tracking) {
          const target = this.combatTargets().find(
            (u) => (u === this.hero ? 'hero' : u.id) === a.targetId && u.hp > 0,
          );
          if (!target) {
            e.sequence = [];
            return null;
          }
          Object.assign(a, {
            x: target.x,
            y: target.y,
            fromX: e.x,
            fromY: e.y,
            angle: Math.atan2(target.y - e.y, target.x - e.x),
          });
        }
        return a;
      }
      ownedSummonMovementFactor(e) {
        if (!e.summon || e.species !== 'wolf') return 1;
        const owner = this.zone().enemies.find(
          (u) => u.id === e.owner && u.type === 'boss' && u.family === 'thorn' && u.hp > 0,
        );
        return owner
          ? R.greenwoodPassives.rapidDeployment[owner.form === 'true' ? 'true' : 'normal']
          : 1;
      }
      regularSlowDuration(e, a, seconds) {
        return (
          seconds *
          (e?.captainProfile === 'supply-vale' && a.captainSkill && !a.rogueMove
            ? R.greenwoodPassives.prolongedExposure[e.captainPhase ? 'phase' : 'normal']
            : 1)
        );
      }
      trueSummonPlan(e) {
        const authored = R.attacks[e.family]?.find((a) => a.kind === 'summon');
        return authored
          ? {
              species: authored.species,
              ranged: !!authored.ranged,
              attendant: !!authored.attendant,
            }
          : R.trueBossSummons.families[e.family];
      }
      bossOwnedSummons(e) {
        return this.zone().enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0);
      }
      bossSummonProfile(e) {
        const o = R.bossSummoning.overrides?.[e.family] || {};
        return {
          normalCap: o.normalCap || R.bossSummoning.normalCap,
          trueCap: o.trueCap || R.bossSummoning.trueCap,
          minions: o.minions || R.trueBossSummons.minions,
          captains: o.captains || R.trueBossSummons.captains,
        };
      }
      bossSummonCap(e) {
        const p = this.bossSummonProfile(e);
        return e.form === 'true' ? p.trueCap : p.normalCap;
      }
      summonName(species) {
        return species === 'wolf'
          ? 'Den pup'
          : species === 'skeleton'
            ? 'Summoned skeleton'
            : species === 'archer'
              ? 'Ridge archer'
              : species === 'mireling'
                ? 'Brood mireling'
                : species === 'crownguard'
                  ? 'Black guard'
                  : species === 'wraith'
                    ? 'Drowned echo'
                    : species === 'ogre'
                      ? 'Stonebound ogre'
                      : species === 'orc'
                        ? 'Warband orc'
                        : species === 'ashbeast'
                          ? 'Abyss hatchling'
                          : 'Summoned ' + species;
      }
      summonCombatProfile(s, plan) {
        s.ranged = !!plan.ranged;
        if (!s.ranged) return;
        const profile = R.rangedProfiles[s.species];
        if (profile) Object.assign(s, profile, { ranged: true });
        else if (['archer', 'crownguard', 'wraith'].includes(s.species)) {
          s.shotRange = 280;
          s.shotSpeed = 260;
          s.projectileStyle = s.species === 'wraith' ? 'spectral' : 'arrow';
        }
      }
      summonBossAdds(e, plan, cap) {
        if (!e || !plan || cap < 1) return 0;
        const z = this.zone(),
          sc = R.summonScaling[this.regionIndex()],
          baseHp =
            (this.s.phase === 'awakening' && this.isDungeon() ? 700 : 40 + e.level * 15) * sc.hp,
          baseDamage =
            (this.s.phase === 'awakening' && this.isDungeon() ? 30 : 5 + e.level) * sc.damage,
          spawnPoint = (slot) => {
            for (let n = 0; n < 24; n++) {
              const k = slot + n,
                a = (k * Math.PI) / 3,
                r = 125 + Math.floor(k / 6) * 55,
                candidate = this.safe(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
              if (
                dist(candidate, this.hero) < 75 ||
                z.enemies.some((u) => u.hp > 0 && u !== e && dist(candidate, u) < 38)
              )
                continue;
              return candidate;
            }
            return this.safe(e.x + 120, e.y + 120);
          };
        if (e.form !== 'true') {
          const owned = () => z.enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0),
            limit = Math.min(cap, this.bossSummonProfile(e).normalCap),
            nextCount = Math.min(limit, owned().length + (plan.attendant ? 3 : limit));
          let made = 0;
          for (let i = owned().length; i < nextCount; i++) {
            const p = spawnPoint(i),
              s = this.makeEnemy(
                {
                  species: plan.species,
                  name: plan.attendant ? 'Estate attendant' : this.summonName(plan.species),
                  icon: '👻',
                  level: e.level,
                  hp: Math.round(baseHp * (plan.normalHpScale || 1)),
                  damage: Math.round(baseDamage * (plan.normalDamageScale || 1)),
                  gold: 0,
                  xp: 0,
                },
                p,
              );
            s.summon = true;
            if (plan.attendant) {
              s.estateAttendant = true;
              s.visualScale = 0.78;
            }
            s.summonBalanceVersion = 1;
            s.owner = e.id;
            this.summonCombatProfile(s, plan);
            s.eliteNightBonus = { hp: e.maxHp / e.baseHp, damage: e.damage / e.baseDamage };
            s.maxHp = s.hp = s.baseHp * s.eliteNightBonus.hp;
            s.damage = s.baseDamage * s.eliteNightBonus.damage;
            z.enemies.push(s);
            made++;
            if (e.aggro) this.engage(s);
          }
          return made;
        }
        z.enemies = z.enemies.filter(
          (u) =>
            !(
              u.summon &&
              u.owner === e.id &&
              u.hp > 0 &&
              !['minion', 'captain'].includes(u.trueSummonRole)
            ),
        );
        const composition = this.bossSummonProfile(e),
          live = (role) =>
            z.enemies
              .filter((u) => u.summon && u.owner === e.id && u.hp > 0 && u.trueSummonRole === role)
              .sort((a, b) => this.idOrder(a, b));
        for (const u of live('minion').slice(composition.minions))
          z.enemies.splice(z.enemies.indexOf(u), 1);
        for (const u of live('captain').slice(composition.captains))
          z.enemies.splice(z.enemies.indexOf(u), 1);
        const owned = () => z.enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0);
        let made = 0;
        const spawnRole = (role) => {
          const p = spawnPoint(owned().length),
            captain = role === 'captain',
            hpScale = captain ? R.ringleaderScaling.hp : R.trueBossSummons.minionScaling.hp,
            damageScale = captain
              ? R.ringleaderScaling.damage
              : R.trueBossSummons.minionScaling.damage,
            hp = Math.round(baseHp * hpScale),
            damage = Math.round(baseDamage * damageScale),
            baseName = this.summonName(plan.species),
            s = this.makeEnemy(
              {
                species: plan.species,
                name: plan.attendant
                  ? captain
                    ? 'TRUE Estate attendant Ringleader'
                    : 'TRUE-bound Estate attendant'
                  : captain
                    ? 'TRUE ' + baseName + ' Ringleader'
                    : 'TRUE-bound ' + baseName,
                icon: '👻',
                form: captain ? 'ringleader' : 'normal',
                level: e.level,
                hp,
                damage,
                gold: 0,
                xp: 0,
              },
              p,
            );
          s.summon = true;
          s.summonBalanceVersion = 1;
          s.owner = e.id;
          this.summonCombatProfile(s, plan);
          s.trueSummon = true;
          if (plan.attendant) {
            s.estateAttendant = true;
            s.visualScale = captain ? 0.9 : 0.78;
          }
          s.trueSummonRole = role;
          s.pack = e.id + '-summons';
          if (captain) s.ringleaderHealthVersion = 3;
          s.eliteNightBonus = { hp: e.maxHp / e.baseHp, damage: e.damage / e.baseDamage };
          s.maxHp = s.hp = s.baseHp * s.eliteNightBonus.hp;
          s.damage = s.baseDamage * s.eliteNightBonus.damage;
          z.enemies.push(s);
          made++;
          if (e.aggro) this.engage(s);
          return true;
        };
        for (let i = live('minion').length; i < composition.minions; i++) spawnRole('minion');
        for (let i = live('captain').length; i < composition.captains; i++) spawnRole('captain');
        return made;
      }
      bossCenteredReach(e, plan) {
        const scale = R.bossCadence.areaRangeMultiplier;
        const kind = plan.kind === 'sector' && e.hp > e.maxHp * 0.5 ? 'cone' : plan.kind;
        if (kind === 'cone') return 165 * scale;
        if (kind === 'sector') return 280 * scale;
        // The moving ring's reach comes from speed × lifetime, not its
        // initially displayed radius (which is overwritten on every tick).
        if (kind === 'ring')
          return plan.slowOnly
            ? plan.waveSpeed * plan.waveLife
            : R.combatGeometry.ringSpeed * R.combatGeometry.ringLife * scale;
        return null;
      }
      bossAttackWeights(e, target = this.hero, allowRepeat = false) {
        const plans = R.attacks[e.family] || [],
          behavior = R.bossBehavior[e.family] || {},
          d = dist(e, target),
          low = e.hp <= e.maxHp * 0.5,
          alive = this.bossOwnedSummons(e).length,
          cap = this.bossSummonCap(e);
        return plans.map((plan, index) => {
          if (!allowRepeat && index === e.lastAttackIndex && plans.length > 1) return 0;
          if (e.family === 'darklord' && index === 3 && !low) return 0;
          const attackTarget = this.bossAttackTarget(e, target, index);
          const reach = this.bossCenteredReach(e, plan);
          // A special must have realistic coverage at the moment it is chosen.
          if (plan.kind !== 'summon' && dist(e, attackTarget) > R.bossCadence.specialRange)
            return 0;
          if (reach !== null && dist(e, attackTarget) > reach + 25) return 0;
          let w = 1;
          if (plan.selfDefense && ((e.anastylosis || 0) > 0 || (e.anastylosisCd || 0) > 0))
            return 0;
          if (plan.sabotage && (e.sabotageCd || 0) > 0) return 0;
          if (plan.kind === 'summon') {
            if (alive >= cap || (e.summonCd || 0) > 0) return 0;
            const missing = cap - alive;
            w = 2.4 + missing * 1.15;
            if (alive >= R.bossSummoning.pressureFloor) w *= 0.7;
          } else {
            if (d <= 170 && behavior.close?.includes(index)) w *= 2.4;
            if (d >= 230 && behavior.far?.includes(index)) w *= 2.2;
            if (d >= 330 && behavior.close?.includes(index)) w *= 0.55;
            if (d <= 110 && behavior.far?.includes(index)) w *= 0.7;
          }
          if (low && behavior.phasePreferred?.includes(index)) w *= 2.25;
          return w;
        });
      }
      chooseBossAttack(e, target = this.hero) {
        const plans = R.attacks[e.family] || [];
        for (const allowRepeat of [false, true]) {
          const weights = this.bossAttackWeights(e, target, allowRepeat),
            total = weights.reduce((n, w) => n + w, 0);
          if (total <= 0) continue;
          let roll = this.random() * total;
          for (let i = 0; i < weights.length; i++) {
            roll -= weights[i];
            if (roll <= 0 && weights[i] > 0) return i;
          }
        }
        // If every special is out of reach, resume closing distance.
        return -1;
      }
      bossAttackTarget(e, fallback, index) {
        const behavior = R.bossBehavior[e.family] || {},
          plan = R.attacks[e.family]?.[index];
        if (!plan || this.hero.hp <= 0 || !this.line(e, this.hero)) return fallback;
        const heroDistance = dist(e, this.hero),
          fallbackDistance = dist(e, fallback),
          reach = this.bossCenteredReach(e, plan);
        if (
          heroDistance > R.bossCadence.specialRange ||
          (reach !== null && heroDistance > reach + 25)
        )
          return fallback;
        // Authored hero-targeting remains authoritative. Targeted ground
        // marks can occasionally challenge a protected backline as well.
        const markBackline =
          plan.kind === 'circle' && fallbackDistance < 200 && heroDistance > fallbackDistance + 70;
        // The Keeper's chosen healer remains priority even for ground-targeted spells.
        if (
          e.family === 'archive' &&
          this.activeLivingParty().some((u) => u.type === 'archer' && u.hp > 0 && !u.keeperHeld)
        )
          return fallback;
        return behavior.heroTarget?.includes(index) || markBackline ? this.hero : fallback;
      }
      buildBossAttack(e, index, target, includeTrue = true) {
        const b = this.boss(e.family),
          plan = R.attacks[e.family][index],
          kind = plan.kind === 'sector' && e.hp > e.maxHp * 0.5 ? 'cone' : plan.kind,
          angle = Math.atan2(target.y - e.y, target.x - e.x),
          from = { x: e.x, y: e.y },
          center =
            plan.selfDefense || ['cone', 'ring', 'sector'].includes(kind)
              ? from
              : { x: target.x, y: target.y },
          a = {
            ...plan,
            family: e.family,
            index,
            name: b.attacks[index]?.split(':')[0] || 'Attack ' + (index + 1),
            timer: plan.warning,
            total: plan.warning,
            kind,
            ...center,
            fromX: e.x,
            fromY: e.y,
            angle,
            count: plan.count || 1,
            radius:
              (kind === 'cone'
                ? 165
                : kind === 'sector'
                  ? 280
                  : kind === 'ring'
                    ? 105
                    : index === 0
                      ? 90
                      : 115) * R.bossCadence.areaRangeMultiplier,
          },
          sequence = [];
        if (e.family === 'crypt' && index === 3) {
          // Snapshot all Groundwork pads on cast. No chasing a dodging player.
          const heroMark =
            dist(e, this.hero) <= R.bossCadence.specialRange && this.line(e, this.hero)
              ? { x: this.hero.x, y: this.hero.y }
              : { x: a.x, y: a.y };
          const closest = this.activeLivingParty()
            .filter((u) => u.hp > 0 && dist(e, u) <= R.bossCadence.specialRange)
            .sort((u, v) => dist(u, heroMark) - dist(v, heroMark))[0];
          const allyMark =
            closest && dist(closest, heroMark) >= 170
              ? { x: closest.x, y: closest.y }
              : { x: heroMark.x, y: heroMark.y + 172 };
          a.groundworkMarks = [
            heroMark,
            allyMark,
            { x: a.x - 185, y: a.y - 95 },
            { x: a.x + 185, y: a.y + 95 },
          ];
        }
        if (a.paired && e.family === 'crypt' && index === 3) {
          const pads = this.attackPatches(a);
          a.groundworkMarks = pads.slice(0, 2).map((p) => ({ x: p.x, y: p.y }));
          a.count = 2;
          sequence.push({
            ...a,
            groundworkMarks: pads.slice(2).map((p) => ({ x: p.x, y: p.y })),
            timer: a.pairWarning,
            total: a.pairWarning,
            name: a.name + ' — second pair',
          });
        }
        if (a.sequential && a.kind === 'circle') {
          const patches = this.attackPatches(a);
          Object.assign(a, patches[0], { count: 1 });
          for (const p of patches.slice(1)) sequence.push({ ...a, ...p, count: 1 });
        }
        if (a.combo)
          sequence.push({
            ...a,
            angle: angle + 0.7,
            timer: 0.8,
            total: 0.8,
            name: a.name + ' — second arc',
          });
        if (a.kind === 'sector') {
          a.angle = angle + Math.PI / 2;
          a.count = 1;
          for (let j = 1; j < 3; j++)
            sequence.push({
              ...a,
              angle: angle + (j % 2 ? -Math.PI / 2 : Math.PI / 2),
              timer: plan.warning,
              total: plan.warning,
            });
        }
        if (includeTrue && e.form === 'true') {
          if (e.family === 'crypt' && index === 1) a.staggered = true;
          if (e.family === 'archive' && index === 1)
            sequence.push({
              ...a,
              x: a.x + Math.cos(angle + Math.PI / 2) * 80,
              y: a.y + Math.sin(angle + Math.PI / 2) * 80,
              timer: plan.warning,
              total: plan.warning,
              name: 'Shifting water channels',
            });
          if (e.family === 'mine' && index === 1)
            sequence.push({
              ...a,
              x: a.x + 150,
              y: a.y + 50,
              count: 1,
              timer: plan.warning,
              total: plan.warning,
              name: 'Delayed rockfall',
            });
          if (e.family === 'abyss' && index === 0)
            sequence.push({
              ...a,
              kind: 'circle',
              x: target.x,
              y: target.y,
              landing: false,
              persistent: true,
              timer: plan.warning,
              total: plan.warning,
              name: 'Delayed flame patch',
              radius: 90 * R.bossCadence.areaRangeMultiplier,
            });
          if (e.family === 'citadel' && index === 2) a.opening = 2.5;
        }
        return { first: a, sequence };
      }
      bossComboSequence(e, index, target) {
        const behavior = R.bossBehavior[e.family] || {},
          ratio = e.hp / e.maxHp,
          combo = (behavior.combos || []).find(
            (x) =>
              x.from === index &&
              (x.phase === 'low' ? ratio <= 0.5 : x.phase === 'high' ? ratio > 0.5 : true) &&
              this.random() < x.chance,
          );
        if (!combo) return [];
        const plan = R.attacks[e.family][combo.to];
        if (
          plan.kind === 'summon' &&
          (this.bossOwnedSummons(e).length >= this.bossSummonCap(e) || (e.summonCd || 0) > 0)
        )
          return [];
        const comboTarget = this.bossAttackTarget(e, target, combo.to),
          reach = this.bossCenteredReach(e, plan);
        if (dist(e, comboTarget) > R.bossCadence.specialRange) return [];
        if (reach !== null && dist(e, comboTarget) > reach + 25) return [];
        const built = this.buildBossAttack(e, combo.to, comboTarget, true);
        return [built.first, ...built.sequence];
      }
      startBossRecovery(e) {
        const cfg = !R.resourceMode.manaEnabled && R.bossRecovery[e.family];
        if (
          !cfg ||
          e.type !== 'boss' ||
          e.hp <= 0 ||
          e.hp >= e.maxHp * R.bossRecovery.threshold ||
          (e.healCd || 0) > 0 ||
          e.telegraph ||
          e.motion
        )
          return false;
        e.healCd = cfg.cooldown;
        e.telegraph = {
          kind: 'circle',
          bossHeal: true,
          name: cfg.name,
          healFraction: cfg.healFraction,
          x: e.x,
          y: e.y,
          fromX: e.x,
          fromY: e.y,
          radius: 115,
          count: 1,
          timer: cfg.warning,
          total: cfg.warning,
          recovery: 1.8,
        };
        e.noProgress = 0;
        this.event('warning', { family: e.family, bossHeal: true });
        return true;
      }
      startAttack(e, target, indexOverride = null) {
        const plans = R.attacks[e.family] || [];
        if (!plans.length) return false;
        const selected = Number.isInteger(indexOverride)
            ? Math.max(0, Math.min(plans.length - 1, indexOverride))
            : this.chooseBossAttack(e, target),
          actualTarget = selected < 0 ? null : this.bossAttackTarget(e, target, selected);
        if (selected < 0) return false;
        if (e.family === 'archive' && selected === 0 && e.hookedVictim) {
          const held =
            e.hookedVictim === 'hero'
              ? this.hero
              : this.s.party.find((u) => u.id === e.hookedVictim);
          if (held) held.keeperHeld = null;
          e.hookedVictim = null;
        }
        if (e.family === 'archive' && plans[selected].sabotage) e.sabotageCd = 12;
        const built = this.buildBossAttack(e, selected, actualTarget, true);
        e.attackIndex = (e.attackIndex || 0) + 1;
        e.lastAttackIndex = selected;
        e.sequence = [...built.sequence, ...this.bossComboSequence(e, selected, actualTarget)];
        e.telegraph = built.first;
        this.event('warning', { family: e.family, index: selected });
        return true;
      }
      attackPatches(a) {
        if (a.pairMarks && a.captainProfile === 'supply-vale' && a.index === 4)
          return a.pairMarks.map((p) => ({ ...a, ...p, radius: a.radius }));
        if (a.family === 'crypt' && a.index === 3 && !a.captainSkill) {
          // A target-centered construction grid: four offset hazard pads,
          // leaving deliberate corridors rather than a solid damage carpet.
          const marks = a.groundworkMarks || [
            { x: a.x, y: a.y },
            { x: a.x, y: a.y + 172 },
            { x: a.x - 185, y: a.y - 95 },
            { x: a.x + 185, y: a.y + 95 },
          ];
          return marks
            .slice(0, a.count || 4)
            .map((mark) => ({ ...a, x: mark.x, y: mark.y, radius: 72 }));
        }
        if (
          a.family === 'warlord' &&
          a.count === 6 &&
          a.kind === 'circle' &&
          a.index === 1 &&
          !a.captainSkill
        ) {
          // Spread Warlord artillery around the target with dodgeable lanes.
          const offsets = [
            [-220, -100],
            [0, -100],
            [220, -100],
            [-220, 125],
            [0, 125],
            [220, 125],
          ];
          return offsets.map(([dx, dy]) => ({ ...a, x: a.x + dx, y: a.y + dy, radius: 72 }));
        }
        if (a.captainSpread) {
          // Separate footprints; no stacked damage and a gap between neighboring circles.
          const gap = a.radius * 2 + 24;
          const offsets =
            a.count === 4
              ? [
                  [0, 0],
                  [-1, -1],
                  [1, -1],
                  [0, 1.5],
                ]
              : [
                  [0, 0],
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ];
          return offsets.slice(0, a.count).map(([x, y]) => ({
            ...a,
            x: a.x + x * gap,
            y: a.y + y * gap,
            count: 1,
          }));
        }
        return Array.from({ length: a.count || 1 }, (_, i) => ({
          ...a,
          x: a.x + (i - ((a.count || 1) - 1) / 2) * 190,
          y: a.y + (i % 2) * 100,
          radius: a.captainRadiusMultiplier
            ? 75 * R.bossCadence.areaRangeMultiplier * a.captainRadiusMultiplier
            : a.count > 1
              ? 75 * R.bossCadence.areaRangeMultiplier
              : a.radius,
        }));
      }
      resolveAttack(e) {
        const a = e.telegraph;
        if (!a) return;
        if (a.selfDefense && e.family === 'crypt' && a.index === 5) {
          e.anastylosis = a.defenseDuration;
          e.anastylosisCd = a.defenseCooldown;
          return;
        }
        if (a.rogueMove) {
          this.tacticalResolveRogueMove(e, a);
          return;
        }
        if (a.bossHeal) {
          if (e.hp > 0) {
            const amount = Math.min(e.maxHp - e.hp, e.maxHp * a.healFraction);
            if (amount > 0) {
              e.hp += amount;
              this.event('heal', {
                x: e.x,
                y: e.y,
                resource: 'health',
                source: e.id,
                target: e.id,
                amount,
              });
            }
          }
          return;
        }
        if (a.nightSkill === 'drain') {
          const hero = this.hero,
            zone = this.zoneId,
            deaths = this.s.statistics.deaths;
          let hit = false;
          for (const u of this.combatTargets())
            if (dist(u, e) < a.radius && this.line(e, u)) {
              const landed = this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0, e.id);
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (landed) {
                this.applySlow(u, a.slowDuration || 0);
                hit = true;
              }
              if (
                this.hero !== hero ||
                this.zoneId !== zone ||
                this.s.challenge.pending ||
                this.s.challenge.gameOver
              )
                return;
            }
          // Legacy MP mode retains the Wraith's fixed heal; in cooldown mode
          // it siphons actual HP damage per victim instead of healing twice.
          if (hit && R.resourceMode.manaEnabled) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * a.heal);
          return;
        }
        if (a.nightSkill === 'pounce') {
          e.motion = { ...a, target: { x: a.x, y: a.y }, hit: [], speed: a.pounceSpeed, life: 2 };
          return;
        }
        if (a.cargo && e.family === 'ridge') {
          const d = Math.max(1, Math.hypot(a.x - e.x, a.y - e.y));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: e.x,
            y: e.y,
            dx: (a.x - e.x) / d,
            dy: (a.y - e.y) / d,
            speed: 260,
            life: 2,
            damage: e.damage * a.coefficient,
            source: 'enemy',
            sourceId: e.id,
            species: 'cargo',
            style: 'cargo',
          });
          return;
        }
        if (a.sabotage && e.family === 'archive') {
          // The Scholar punishes a visibly marked healer or hero, without direct damage.
          const victims = this.combatTargets().filter(
            (u) => u.hp > 0 && !u.keeperHeld && dist(u, a) < a.radius && this.line(e, u),
          );
          const victim =
            victims.find((u) => u.type === 'archer') || victims.find((u) => u === this.hero);
          if (victim) {
            if (victim.type === 'archer') victim.healCd = (victim.healCd || 0) + 3;
            else {
              const choices = victim.cd
                .map((time, i) => ({ time, i }))
                .filter((x) => this.hero.skills[x.i] > 0)
                .sort((x, y) => y.time - x.time);
              if (choices.length) victim.cd[choices[0].i] += 3;
            }
            this.event('warning', { family: 'archive', cooldownSabotageHit: true });
          }
          return;
        }
        if (a.kind === 'summon') {
          if (a.captainSkill && (e.captain || e.roomCaptain))
            this.summonCaptainAdds(
              e,
              this.captainProfile(e)?.summon || { species: a.species, cap: a.summonCap || 3 },
            );
          else {
            this.summonBossAdds(
              e,
              {
                species: a.species,
                ranged: !!a.ranged,
                normalHpScale: a.normalHpScale,
                normalDamageScale: a.normalDamageScale,
                attendant: !!a.attendant,
              },
              this.bossSummonCap(e),
            );
            e.summonCd =
              e.form === 'true' ? R.bossSummoning.trueCooldown : R.bossSummoning.normalCooldown;
          }
          return;
        }
        if (a.tracking && a.captainSkill && e.captainProfile === 'supply-vale' && a.index === 3) {
          if (
            !this.combatTargets().some(
              (u) => (u === this.hero ? 'hero' : u.id) === a.targetId && u.hp > 0,
            )
          ) {
            e.sequence = [];
            return;
          }
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: e.x,
            y: e.y,
            dx: Math.cos(a.angle),
            dy: Math.sin(a.angle),
            speed: a.shotSpeed,
            life: a.shotLife,
            damage: e.damage * a.coefficient,
            source: 'enemy',
            sourceId: e.id,
            species: e.species,
            style: 'stone',
          });
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            species: e.species,
            style: 'stone',
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (a.kind === 'volley') {
          const style = e.projectileStyle || 'arrow';
          for (const [i, delta] of [-0.22, 0, 0.22].entries())
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: e.x,
              y: e.y,
              dx: Math.cos(a.angle + delta),
              dy: Math.sin(a.angle + delta),
              speed: 260 * R.enemyProjectileMultiplier,
              life: 2.5 / R.enemyProjectileMultiplier,
              damage: e.damage,
              manaDrain: a.manaDrain || 0,
              source: 'enemy',
              sourceId: e.id,
              species: e.species,
              style,
              delay:
                e.family === 'crypt' && a.index === 1
                  ? i * (e.form === 'true' ? a.trueShotInterval : a.normalShotInterval)
                  : a.staggered
                    ? i * 0.35
                    : 0,
            });
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            species: e.species,
            family: e.family,
            boss: e.type === 'boss',
            style,
            count: 3,
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (a.kind === 'ring') {
          this.s.hazards.push({
            ...a,
            family: e.family,
            species: e.species,
            sourceId: e.id,
            x: e.x,
            y: e.y,
            life: a.slowOnly
              ? a.waveLife
              : R.combatGeometry.ringLife * R.bossCadence.areaRangeMultiplier,
            tick: 0,
            damage: a.slowOnly ? 0 : e.damage,
            radius: 0,
            age: 0,
            hit: [],
          });
          return;
        }
        if (a.charge || a.landing) {
          e.motion = {
            ...a,
            target: { x: a.x, y: a.y },
            hit: [],
            speed: a.advance ? 100 : 450,
            life: 5,
          };
          return;
        }
        this.resolveArea(e, a);
      }
      resolveArea(e, a) {
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths;
        const party = this.combatTargets(),
          patches = this.attackPatches(a),
          hits = (u) =>
            a.kind === 'line'
              ? a.count === 2
                ? [-85, 85].some(
                    (o) =>
                      this.distanceToSegment(
                        u,
                        {
                          x: a.fromX + Math.cos(a.angle + Math.PI / 2) * o,
                          y: a.fromY + Math.sin(a.angle + Math.PI / 2) * o,
                        },
                        {
                          x: a.x + Math.cos(a.angle + Math.PI / 2) * o,
                          y: a.y + Math.sin(a.angle + Math.PI / 2) * o,
                        },
                      ) < R.combatGeometry.dualLineHalfWidth,
                  )
                : this.distanceToSegment(u, { x: a.fromX, y: a.fromY }, a) <
                  R.combatGeometry.lineHalfWidth
              : ['cone', 'sector'].includes(a.kind)
                ? dist(u, a) < a.radius &&
                  (a.angleDegrees === 360 ||
                    Math.cos(Math.atan2(u.y - a.y, u.x - a.x) - a.angle) >
                      (a.angleDegrees
                        ? Math.cos((a.angleDegrees * Math.PI) / 360)
                        : a.kind === 'sector'
                          ? Math.cos(0.65)
                          : Math.cos(1.1)))
                : patches.some((p) => dist(u, p) < p.radius);
        const anchorVictim =
          e.type === 'boss' && e.family === 'archive' && a.index === 0
            ? party
                .filter((u) => u.hp > 0 && !u.keeperHeld && hits(u) && this.line(e, u))
                .sort((u, v) => Number(v.type === 'archer') - Number(u.type === 'archer'))[0]
            : null;
        const jawVictim =
          e.type === 'boss' && e.family === 'mire' && a.index === 0 && !e.deathRoll
            ? party.find(
                (u) => u.hp > 0 && !(u.immune > 0) && !this.peace && hits(u) && this.line(e, u),
              )
            : null;
        for (const u of party)
          if (hits(u) && this.line(e, u)) {
            // The grabbed victim's Jaw Snap damage is distributed into roll
            // ticks instead of being applied once now and a second time later.
            const landed =
              u === jawVictim
                ? true
                : this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0, e.id);
            if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
              return;
            if (landed && u === jawVictim) {
              // Exactly one jaw victim, then three evenly spaced roll impacts.
              e.deathRoll = {
                victim: u === this.hero ? 'hero' : u.id,
                // Calculate the original single-hit loss once. Each of the
                // three roll ticks is already mitigated; armor must not apply thrice.
                totalDamage: Math.max(
                  3,
                  e.damage * a.coefficient -
                    (u === this.hero
                      ? this.armor()
                      : ['soldier', 'archer'].includes(u.type)
                        ? this.companionArmor(u.type)
                        : 5 + this.hero.level * 0.5) *
                      0.35,
                ),
                life: 1.5,
                elapsed: 0,
                hits: 0,
              };
              u.deathRollHeld = true;
              this.say(e.name + ' commits to Vortex Shedding.');
              this.event('warning', { family: 'mire', deathRoll: true, name: 'Vortex Shedding' });
            }
            if (
              landed &&
              e.type === 'boss' &&
              e.family === 'crypt' &&
              a.index === 0 &&
              a.push > 0 &&
              u.hp > 0
            ) {
              const d = Math.max(1, dist(u, e));
              this.move(
                u,
                { x: u.x + ((u.x - e.x) * a.push) / d, y: u.y + ((u.y - e.y) * a.push) / d },
                a.push / 0.15,
                0.15,
              );
            }
            if (landed && e.family === 'ridge' && e.type === 'boss' && a.index === 1 && u.hp > 0) {
              const d = Math.max(1, dist(u, a));
              const dest = this.safe(u.x + ((u.x - a.x) * 75) / d, u.y + ((u.y - a.y) * 75) / d);
              if (this.clearSegment(u, dest)) {
                u.x = dest.x;
                u.y = dest.y;
              }
            }
            if (landed && u === anchorVictim && u.hp > 0) {
              const d = Math.max(1, dist(u, e));
              const where = this.safe(e.x + ((u.x - e.x) * 62) / d, e.y + ((u.y - e.y) * 62) / d);
              if (this.clearSegment(u, where)) {
                u.x = where.x;
                u.y = where.y;
              }
              u.keeperHeld = e.id;
              e.hookedVictim = u === this.hero ? 'hero' : u.id;
              this.event('warning', { family: 'archive', anchorCaptured: true });
            }
            if (landed && ['cone', 'sector'].includes(a.kind))
              this.event('melee', {
                actor: 'enemy',
                source: e.id,
                species: e.species,
                family: e.family,
                boss: e.type === 'boss',
                x: u.x,
                y: u.y,
                target: u === this.hero ? 'hero' : u.id,
              });
            if (landed && (a.slow || a.slowDuration))
              this.applySlow(u, this.regularSlowDuration(e, a, a.slowDuration || 4));
            if (party[0] !== this.hero || this.s.challenge.pending || this.s.challenge.gameOver)
              return;
          }
        if (a.persistent)
          for (const p of patches)
            this.s.hazards.push({
              ...p,
              family: e.family,
              species: e.species,
              sourceId: e.id,
              kind: 'circle',
              life: 4,
              tick: 1,
              damage: e.damage * 0.25,
            });
      }
      advanceMotion(e, dt) {
        const a = e.motion;
        if (!a) return;
        const hero = this.hero,
          zone = this.zoneId,
          deaths = this.s.statistics.deaths,
          before = { x: e.x, y: e.y };
        a.life -= dt;
        const moved = this.move(e, a.target, a.speed || a.pounceSpeed || 450, dt);
        if (a.charge)
          for (const u of this.combatTargets()) {
            const id = u === this.hero ? 'hero' : u.id;
            if (
              !a.hit.includes(id) &&
              this.distanceToSegment(u, before, e) < R.combatGeometry.chargeHalfWidth &&
              this.line(e, u)
            ) {
              a.hit.push(id);
              const landed = this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0, e.id);
              if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
                return;
              if (landed && e.family === 'ridge' && a.index === 2 && u.hp > 0) {
                const d = Math.max(1, dist(u, e));
                const dest = this.safe(u.x + ((u.x - e.x) * 85) / d, u.y + ((u.y - e.y) * 85) / d);
                if (this.clearSegment(u, dest)) {
                  u.x = dest.x;
                  u.y = dest.y;
                }
                this.applySlow(u, 2);
              }
              if (
                this.hero !== hero ||
                this.zoneId !== zone ||
                this.s.challenge.pending ||
                this.s.challenge.gameOver ||
                e.hp <= 0
              )
                return;
            }
          }
        // Axis fallback can report success for a zero-length clear segment.
        // A charge blocked by real geometry must end when it makes no progress.
        if (dist(e, a.target) < 1 || !moved || dist(before, e) < 0.000001 || a.life <= 0) {
          if (a.captainSkill && e.captainProfile === 'supply-vale' && a.index === 0)
            e.captainPursuit = 2.5;
          if (a.landing && dist(e, a.target) < 20) this.resolveArea(e, a);
          if (this.hero !== hero || this.zoneId !== zone || this.s.statistics.deaths !== deaths)
            return;
          e.motion = null;
          e.cd =
            a.recovery *
            (e.type === 'boss' ? R.bossCadence.specialRecoveryMultiplier : 1) *
            (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1);
          if (a.opening)
            e.open = e.form === 'true' && e.family === 'citadel' ? a.opening / 2 : a.opening;
          e.telegraph = this.advanceQueuedAttack(e);
          if (e.telegraph) this.event('warning', { family: e.family });
          else e.basicDue = e.type === 'boss' && e.attackIndex % R.bossCadence.skillsPerBasic === 0;
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(BossCombat.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(BossCombat.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeBossCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
