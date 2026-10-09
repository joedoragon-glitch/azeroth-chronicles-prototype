/* Boss attack selection, sequences, geometry, summons and attack resolution. Shared with captain/night attacks where the existing rules reuse these primitives. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class BossCombat {
      trueSummonPlan(e) {
        const authored = R.attacks[e.family]?.find((a) => a.kind === 'summon');
        return authored
          ? { species: authored.species, ranged: !!authored.ranged }
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
            limit = Math.min(cap, this.bossSummonProfile(e).normalCap);
          let made = 0;
          for (let i = owned().length; i < limit; i++) {
            const p = spawnPoint(i),
              s = this.makeEnemy(
                {
                  species: plan.species,
                  name: this.summonName(plan.species),
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
                name: captain ? 'TRUE ' + baseName + ' Ringleader' : 'TRUE-bound ' + baseName,
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
      bossAttackWeights(e, target = this.hero) {
        const plans = R.attacks[e.family] || [],
          behavior = R.bossBehavior[e.family] || {},
          d = dist(e, target),
          low = e.hp <= e.maxHp * 0.5,
          alive = this.bossOwnedSummons(e).length,
          cap = this.bossSummonCap(e);
        return plans.map((plan, index) => {
          if (index === e.lastAttackIndex && plans.length > 1) return 0;
          if (e.family === 'darklord' && index === 3 && !low) return 0;
          let w = 1;
          const closeRadius = (plan.kind === 'sector' ? 280 : plan.kind === 'ring' ? 105 : 165) * R.bossCadence.areaRangeMultiplier;
          // Do not spend a special on a centered attack that cannot reasonably reach.
          if (['cone', 'sector', 'ring'].includes(plan.kind) && d > closeRadius + 30) return 0;
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
        const plans = R.attacks[e.family] || [],
          weights = this.bossAttackWeights(e, target),
          total = weights.reduce((n, w) => n + w, 0);
        if (total > 0) {
          let roll = this.random() * total;
          for (let i = 0; i < weights.length; i++) {
            roll -= weights[i];
            if (roll <= 0 && weights[i] > 0) return i;
          }
        }
        const low = e.hp <= e.maxHp * 0.5;
        let fallback = plans.findIndex(
          (p, i) =>
            i !== e.lastAttackIndex &&
            p.kind !== 'summon' &&
            !(e.family === 'darklord' && i === 3 && !low),
        );
        if (fallback < 0) fallback = plans.findIndex((p, i) => i !== e.lastAttackIndex);
        return Math.max(0, fallback);
      }
      bossAttackTarget(e, fallback, index) {
        const behavior = R.bossBehavior[e.family] || {};
        if (this.hero.hp <= 0 || !this.line(e, this.hero)) return fallback;
        const plan = R.attacks[e.family]?.[index];
        // Long-reaching marks may pressure the backline even when Soldiers screen the boss.
        const reachesHero = dist(e, this.hero) <= R.bossCadence.targetFlexRange;
        return reachesHero && (behavior.heroTarget?.includes(index) || (plan?.kind === 'circle' && dist(e, fallback) < 200))
          ? this.hero
          : fallback;
      }
      buildBossAttack(e, index, target, includeTrue = true) {
        const b = this.boss(e.family),
          plan = R.attacks[e.family][index],
          kind = plan.kind === 'sector' && e.hp > e.maxHp * 0.5 ? 'cone' : plan.kind,
          angle = Math.atan2(target.y - e.y, target.x - e.x),
          from = { x: e.x, y: e.y },
          center = ['cone', 'ring', 'sector'].includes(kind) ? from : { x: target.x, y: target.y },
          a = {
            ...plan,
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
              R.bossCadence.areaRangeMultiplier * (kind === 'cone'
                ? 165
                : kind === 'sector'
                  ? 280
                  : kind === 'ring'
                    ? 105
                    : index === 0
                      ? 90
                      : 115),
          },
          sequence = [];
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
        const comboTarget = this.bossAttackTarget(e, this.hero, combo.to),
          built = this.buildBossAttack(e, combo.to, comboTarget, true);
        return [built.first, ...built.sequence];
      }
      startAttack(e, target, indexOverride = null) {
        const plans = R.attacks[e.family] || [];
        if (!plans.length) return false;
        const selected = Number.isInteger(indexOverride)
            ? Math.max(0, Math.min(plans.length - 1, indexOverride))
            : this.chooseBossAttack(e, target),
          actualTarget = this.bossAttackTarget(e, target, selected),
          built = this.buildBossAttack(e, selected, actualTarget, true);
        e.attackIndex = (e.attackIndex || 0) + 1;
        e.lastAttackIndex = selected;
        e.sequence = [...built.sequence, ...this.bossComboSequence(e, selected, actualTarget)];
        e.telegraph = built.first;
        this.event('warning', { family: e.family, index: selected });
        return true;
      }
      attackPatches(a) {
        return Array.from({ length: a.count || 1 }, (_, i) => ({
          ...a,
          x: a.x + (i - ((a.count || 1) - 1) / 2) * 190,
          y: a.y + (i % 2) * 100,
          radius: a.count > 1 ? 75 * R.bossCadence.areaRangeMultiplier : a.radius,
        }));
      }
      resolveAttack(e) {
        const a = e.telegraph;
        if (!a) return;
        if (a.nightSkill === 'drain') {
          const hero = this.hero,
            zone = this.zoneId;
          let hit = false;
          for (const u of this.combatTargets())
            if (dist(u, e) < a.radius && this.line(e, u)) {
              if (this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0)) {
                u.slow = Math.max(u.slow || 0, a.slowDuration || 0);
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
          if (hit) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * a.heal);
          return;
        }
        if (a.nightSkill === 'pounce') {
          e.motion = { ...a, target: { x: a.x, y: a.y }, hit: [], speed: a.pounceSpeed, life: 2 };
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
              },
              this.bossSummonCap(e),
            );
            e.summonCd =
              e.form === 'true' ? R.bossSummoning.trueCooldown : R.bossSummoning.normalCooldown;
          }
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
              delay: a.staggered ? i * 0.35 : 0,
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
            x: e.x,
            y: e.y,
            life: R.combatGeometry.ringLife,
            tick: 0,
            damage: e.damage,
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
                  Math.cos(Math.atan2(u.y - a.y, u.x - a.x) - a.angle) >
                    (a.kind === 'sector' ? Math.cos(0.65) : Math.cos(1.1))
                : patches.some((p) => dist(u, p) < p.radius);
        for (const u of party)
          if (hits(u) && this.line(e, u)) {
            if (
              this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0) &&
              ['cone', 'sector'].includes(a.kind)
            )
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
            if (a.slow || a.slowDuration) u.slow = Math.max(u.slow || 0, a.slowDuration || 4);
            if (party[0] !== this.hero || this.s.challenge.pending || this.s.challenge.gameOver)
              return;
          }
        if (a.persistent)
          for (const p of patches)
            this.s.hazards.push({
              ...p,
              family: e.family,
              species: e.species,
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
              this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0);
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
        if (dist(e, a.target) < 1 || !moved || a.life <= 0) {
          if (a.landing && dist(e, a.target) < 20) this.resolveArea(e, a);
          e.motion = null;
          e.cd =
            a.recovery *
            (e.type === 'boss' ? R.bossCadence.specialRecoveryMultiplier : 1) *
            (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1);
          if (a.opening)
            e.open = e.form === 'true' && e.family === 'citadel' ? a.opening / 2 : a.opening;
          e.telegraph = e.sequence?.shift() || null;
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
