/* Boss attack selection, sequences, geometry, summons and attack resolution. Shared with captain/night attacks where the existing rules reuse these primitives. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const originalRogueMove = Campaign.prototype.tacticalResolveRogueMove;
    class BossCombat {
      abyssFlightLegs(e, target, sign = 1) {
        const dx = target.x - e.x,
          dy = target.y - e.y,
          len = Math.max(1, Math.hypot(dx, dy)),
          perp = { x: -dy / len, y: dx / len },
          first = this.safe(
            e.x + dx * 0.33 + perp.x * sign * 105,
            e.y + dy * 0.33 + perp.y * sign * 105,
          ),
          second = this.safe(
            e.x + dx * 0.67 - perp.x * sign * 105,
            e.y + dy * 0.67 - perp.y * sign * 105,
          ),
          last = this.safe(target.x, target.y);
        // Never cut through walls to achieve an attractive pattern.
        return this.clearSegment(e, first, 15) &&
          this.clearSegment(first, second, 15) &&
          this.clearSegment(second, last, 15)
          ? [first, second, last]
          : [last];
      }
      tacticalResolveRogueMove(e, move) {
        if (e.family !== 'abyss' || e.type !== 'boss') return originalRogueMove.call(this, e, move);
        if (!move.rogueSignature && move.style === 'dash') {
          const target =
            move.targetId === 'hero'
              ? this.hero
              : this.combatTargets().find((u) => u.id === move.targetId);
          if (!target || target.hp <= 0 || !this.line(e, target)) return;
          e.motion = {
            aerial: 'high-yo-yo',
            flightPath: this.abyssFlightLegs(e, move, 1),
            target: { x: move.x, y: move.y },
            hit: [],
            speed: 350,
            life: 5,
            rogueMove: true,
            rogueSignature: false,
            style: move.style,
            rogueAttack: move,
            recovery: move.recovery,
          };
          return;
        }
        if (move.rogueSignature && move.effect === 'scatter') {
          const origin = { x: e.x, y: e.y },
            side = this.safe(
              e.x + Math.cos(move.angle + Math.PI / 2) * 105,
              e.y + Math.sin(move.angle + Math.PI / 2) * 105,
            ),
            path =
              this.clearSegment(e, side, 15) && this.clearSegment(side, origin, 15)
                ? [side, origin]
                : [origin];
          e.motion = {
            aerial: 'wingover',
            flightPath: path,
            target: origin,
            hit: [],
            speed: 350,
            life: 4,
            rogueMove: true,
            rogueSignature: true,
            effect: move.effect,
            style: move.style,
            rogueAttack: move,
            recovery: move.recovery,
          };
          return;
        }
        return originalRogueMove.call(this, e, move);
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
      sentinelFormationOrders(e) {
        // Only select Dress Ranks when living soldiers can really take posts.
        // This is also the execution source, preventing AI/cast mismatches.
        const posts = [
          [-115, -70],
          [-115, 70],
          [115, -70],
          [115, 70],
        ];
        return this.zone()
          .enemies.filter(
            (u) =>
              u !== e && u.hp > 0 && u.species === 'crownguard' && !u.neutral && dist(u, e) < 390,
          )
          .sort((a, b) => dist(a, e) - dist(b, e))
          .slice(0, 4)
          .flatMap((unit, i) => {
            const [dx, dy] = posts[i];
            const post = this.safe(e.x + dx, e.y + dy);
            return dist(unit, post) <= 240 && this.clearSegment(unit, post) ? [{ unit, post }] : [];
          });
      }
      sentinelPatternPath(e) {
        const directions = [
          [1, 0],
          [1, 1],
          [-1, 1],
          [-1, -1],
          [1, -1],
        ];
        const origin = { x: e.x, y: e.y };
        for (const size of [150, 120, 90, 65]) {
          const path = directions.map(([x, y]) => ({
            x: origin.x + x * size,
            y: origin.y + y * size,
          }));
          if (
            path.every(
              (p, i) =>
                !this.blocked(p.x, p.y, this.zoneId, 23) &&
                this.clearSegment(i ? path[i - 1] : origin, p),
            )
          )
            return path;
        }
        return [];
      }
      sentinelBoardCells(e) {
        if (!e.board) return [];
        const pairs = [
          [0, 15],
          [3, 12],
          [5, 10],
          [6, 9],
          [1, 14],
          [4, 11],
          [2, 13],
          [7, 8],
        ];
        const active = pairs[e.board.beat % pairs.length];
        return Array.from({ length: 16 }, (_, i) => ({
          x: e.board.x + ((i % 4) - 1.5) * e.board.size,
          y: e.board.y + (Math.floor(i / 4) - 1.5) * e.board.size,
          size: e.board.size,
          selected: active.includes(i),
        }));
      }
      sentinelUpdateBoard(e, dt) {
        if (!e.board || e.hp <= 0 || !e.aggro || this.peace) return;
        const b = e.board;
        b.timer -= dt;
        if (b.timer > 0) return;
        if (b.phase === 'warn') {
          b.phase = 'rest';
          b.timer += 0.45;
          const hero = this.hero,
            zone = this.zoneId;
          for (const u of this.combatTargets()) {
            if (
              !this.sentinelBoardCells(e).some(
                (cell) =>
                  cell.selected &&
                  Math.abs(u.x - cell.x) <= cell.size / 2 &&
                  Math.abs(u.y - cell.y) <= cell.size / 2,
              )
            )
              continue;
            this.hitParty(u, e.damage, 0, e.id);
            if (
              this.hero !== hero ||
              this.zoneId !== zone ||
              this.s.challenge.pending ||
              this.s.challenge.gameOver
            )
              return;
          }
        } else {
          b.phase = 'warn';
          b.beat = (b.beat + 1) % 8;
          b.timer += 1.45;
        }
        b.timer = Math.max(0.05, b.timer);
      }
      bossCenteredReach(e, plan) {
        const scale = R.bossCadence.areaRangeMultiplier;
        const kind = plan.kind === 'sector' && e.hp > e.maxHp * 0.5 ? 'cone' : plan.kind;
        if (kind === 'cone') return 165 * scale;
        if (kind === 'sector') return 280 * scale;
        // The moving ring's reach comes from speed × lifetime, not its
        // initially displayed radius (which is overwritten on every tick).
        if (kind === 'ring') return R.combatGeometry.ringSpeed * R.combatGeometry.ringLife * scale;
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
          if (e.family === 'citadel' && index === 3 && e.board) return 0;
          if (e.family === 'citadel' && index === 1 && !this.sentinelFormationOrders(e).length)
            return 0;
          if (e.family === 'citadel' && index === 2 && !this.sentinelPatternPath(e).length)
            return 0;
          if (!allowRepeat && index === e.lastAttackIndex && plans.length > 1) return 0;
          if (e.family === 'darklord' && index === 3 && !low) return 0;
          const attackTarget = this.bossAttackTarget(e, target, index);
          const reach = this.bossCenteredReach(e, plan);
          // A special must have realistic coverage at the moment it is chosen.
          if (plan.kind !== 'summon' && dist(e, attackTarget) > R.bossCadence.specialRange)
            return 0;
          if (reach !== null && dist(e, attackTarget) > reach + 25) return 0;
          let w = 1;
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
        if (e.family === 'citadel' && !e.board && dist(e, target) <= R.bossCadence.specialRange)
          return 3;
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
        return behavior.heroTarget?.includes(index) || markBackline ? this.hero : fallback;
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
        if (e.family === 'mine' && index === 2 && a.doubleWave) {
          sequence.push({ ...a, timer: 0.7, total: 0.7, name: 'Dynamic Compaction — second wave' });
        }
        if (a.sequential && a.kind === 'circle') {
          const patches = this.attackPatches(a);
          Object.assign(a, patches[0], { count: 1 });
          for (const p of patches.slice(1)) sequence.push({ ...a, ...p, count: 1 });
        }
        if (e.family === 'abyss' && index === 2) {
          // Lazy Eight: opposite banks, each ending at its own separately warned impact.
          a.flightPath = this.abyssFlightLegs(e, a, 1);
          let previousLanding = a;
          sequence.forEach((stage, i) => {
            stage.flightPath = this.abyssFlightLegs(previousLanding, stage, i % 2 === 0 ? -1 : 1);
            previousLanding = stage;
          });
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
        if (e.family === 'citadel') {
          if (index === 0) {
            a.kind = 'canister';
            a.radius = 360;
          }
          if (index === 1) {
            a.kind = 'formation';
            a.radius = 230;
          }
          if (index === 2) {
            a.kind = 'pattern-charge';
            a.path = this.sentinelPatternPath(e);
            a.count = 1;
            if (a.path.length) Object.assign(a, a.path[a.path.length - 1]);
          }
          if (index === 3) {
            a.kind = 'checkerboard';
            a.x = e.home.x;
            a.y = e.home.y;
            a.count = 1;
          }
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
          // Progressive Collapse already sequences its three marked impacts in both forms.
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
          // A patterned charge is not the old armored-slam opening.
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
      abyssGoAroundPoint(e) {
        const hero = this.hero,
          away = Math.atan2(e.y - hero.y, e.x - hero.x);
        // Prefer a full retreat, then smaller side steps if the arena is tight.
        // Neither terrain nor blocked walls can become a false successful escape.
        for (const radius of [110, 80, 55])
          for (const offset of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
            const direction = away + offset,
              point = {
                x: e.x + Math.cos(direction) * radius,
                y: e.y + Math.sin(direction) * radius,
              };
            if (!this.blocked(point.x, point.y, this.zoneId, 15) && this.clearSegment(e, point, 15))
              return point;
          }
        return null;
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
        // Go-Around must have a real escape path before spending its heal cast.
        if (e.family === 'abyss' && !this.abyssGoAroundPoint(e)) return false;
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
        const built = this.buildBossAttack(e, selected, actualTarget, true);
        e.attackIndex = (e.attackIndex || 0) + 1;
        e.lastAttackIndex = selected;
        e.sequence = [...built.sequence, ...this.bossComboSequence(e, selected, actualTarget)];
        e.telegraph = built.first;
        if (e.family === 'mine' && selected === 1) this.prepareMineWorksPreview(e);
        this.event('warning', { family: e.family, index: selected });
        return true;
      }
      attackPatches(a) {
        if (a.index === 3 && a.count === 4 && a.name === 'Groundwork') {
          // A target-centered construction grid: four offset hazard pads,
          // leaving deliberate corridors rather than a solid damage carpet.
          const marks = a.groundworkMarks || [
            { x: a.x, y: a.y },
            { x: a.x, y: a.y + 172 },
            { x: a.x - 185, y: a.y - 95 },
            { x: a.x + 185, y: a.y + 95 },
          ];
          return marks.map((mark) => ({ ...a, x: mark.x, y: mark.y, radius: 72 }));
        }
        return Array.from({ length: a.count || 1 }, (_, i) => ({
          ...a,
          x: a.x + (i - ((a.count || 1) - 1) / 2) * 190,
          y: a.y + (i % 2) * 100,
          radius: a.count > 1 ? 75 * R.bossCadence.areaRangeMultiplier : a.radius,
        }));
      }
      prepareMineWorksPreview(e) {
        if (e.family !== 'mine' || e.telegraph?.index !== 1) return;
        // Predict from the last marked impact, not the first one. This also
        // works when Collapse is chained after a different engineering skill.
        const lastCollapse = (e.sequence || []).filter((a) => a.index === 1).at(-1);
        this.previewMineWorks(e, lastCollapse || e.telegraph);
      }
      previewMineWorks(e, attack) {
        if (e.family !== 'mine' || this.s.zone !== 'mine') return;
        const z = this.zone(),
          existing = z.props.filter((p) => p.garunTemporary),
          priorId = this.s.nextId;
        this.raiseMineWorks(e, attack);
        const planned = z.props.filter((p) => p.garunTemporary);
        this.s.nextId = priorId;
        z.props = z.props.filter((p) => !p.garunTemporary && !p.garunPreview);
        z.props.push(...existing);
        for (const [i, p] of planned.entries())
          z.props.push({
            id: 'garun-preview-' + e.id + '-' + i,
            x: p.x,
            y: p.y,
            r: 0,
            decorative: true,
            structure: 'mine-old-markings',
            dungeonDistrict: 'colossus-chamber',
            sceneRole: 'construction-warning',
            icon: '⚠️',
            garunPreview: true,
            expiresAt: this.s.time + 8,
          });
      }
      raiseMineWorks(e, attack, reservedSites = null) {
        if (e.family !== 'mine' || e.hp <= 0 || this.peace || this.s.zone !== 'mine') return 0;
        const z = this.zone();
        // A maximum of two pieces of temporary construction may obstruct the arena.
        z.props = z.props.filter((p) => !p.garunTemporary && !p.garunPreview);
        const captive = z.npcs.find((n) => n.family === 'mine' && n.kind === 'cage'),
          exit = z.npcs.find((n) => n.kind === 'exit'),
          targets = [this.hero, ...this.activeLivingParty(), e, captive, exit].filter(Boolean),
          initiallyWalkable = targets.filter((u) => !this.blocked(u.x, u.y, z.id, 12)),
          essentialRoutes = [
            ...(exit ? targets.filter((u) => u !== exit).map((u) => [u, exit]) : []),
            ...(captive ? [[this.hero, captive]] : []),
          ].filter(([from, to]) => this.route(from, to).length > 0),
          offsets = [
            [-160, -100],
            [160, -100],
            [-180, 110],
            [180, 110],
            [-80, 185],
            [80, 185],
          ],
          candidates =
            reservedSites === null
              ? offsets.map(([dx, dy]) => ({ x: attack.x + dx, y: attack.y + dy }))
              : reservedSites,
          newlyBuilt = [];
        // At impact, only the previously previewed positions may become solid.
        // Revalidate each one against moving occupants and routes; cancel an
        // unsafe site rather than secretly constructing somewhere else.
        for (const p of candidates) {
          if (newlyBuilt.length >= 2) break;
          if (
            this.blocked(p.x, p.y, z.id, 28) ||
            targets.some((u) => dist(u, p) < 110) ||
            this.traps().some((t) =>
              this.trapContains(
                {
                  ...t,
                  radius: (t.radius || 0) + 40,
                  length: (t.length || 0) + 80,
                  halfWidth: (t.halfWidth || 0) + 40,
                },
                p,
              ),
            )
          )
            continue;
          const prop = {
            id: 'garun-work-' + this.s.nextId++,
            x: p.x,
            y: p.y,
            r: 24,
            structure: 'mine-supports',
            icon: '🪨',
            garunTemporary: true,
            expiresAt: this.s.time + 9,
          };
          z.props.push(prop);
          if (
            initiallyWalkable.some((u) => this.blocked(u.x, u.y, z.id, 12)) ||
            essentialRoutes.some(([from, to]) => !this.route(from, to).length)
          ) {
            z.props.pop();
            continue;
          }
          newlyBuilt.push(prop);
        }
        return newlyBuilt.length;
      }
      resolveAttack(e) {
        const a = e.telegraph;
        if (!a) return;
        if (a.rogueMove) {
          this.tacticalResolveRogueMove(e, a);
          return;
        }
        if (a.bossHeal && e.family === 'abyss') {
          const point = this.abyssGoAroundPoint(e);
          // A blocked retreat can never grant free healing. The next recovery
          // opportunity retains the existing authored cooldown rules.
          if (!point) return;
          e.motion = {
            aerial: 'go-around',
            target: point,
            flightPath: [point],
            speed: 280,
            life: 2,
            hit: [],
            recovery: a.recovery,
            healFraction: a.healFraction,
          };
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
            zone = this.zoneId;
          let hit = false;
          for (const u of this.combatTargets())
            if (dist(u, e) < a.radius && this.line(e, u)) {
              if (this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0, e.id)) {
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
        if (e.family === 'citadel' && a.kind === 'checkerboard') {
          if (!e.board)
            e.board = { x: e.home.x, y: e.home.y, size: 112, beat: 0, phase: 'warn', timer: 1.45 };
          return;
        }
        if (e.family === 'citadel' && a.kind === 'formation') {
          const orders = this.sentinelFormationOrders(e);
          for (const { unit, post } of orders) {
            // Orders remain movement, never teleportation or invented guards.
            unit.dressPost = { ...post, owner: e.id, expires: this.s.time + 5 };
            unit.aggro = true;
          }
          e.dressUntil = orders.length ? this.s.time + 5 : 0;
          return;
        }
        if (e.family === 'citadel' && a.kind === 'canister') {
          for (let i = -4; i <= 4; i++) {
            const angle = a.angle + i * 0.115;
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: e.x,
              y: e.y,
              dx: Math.cos(angle),
              dy: Math.sin(angle),
              speed: 490,
              life: 0.72, // 490 paces/s × 0.72 s remains inside the 360-pace warning.
              damage: e.damage / 9, // At close range nine fragments cap at one raw boss hit.
              manaDrain: 0,
              source: 'enemy',
              sourceId: e.id,
              species: e.species,
              style: 'stone',
            });
          }
          this.event('projectileLaunch', {
            actor: 'enemy',
            source: e.id,
            family: e.family,
            species: e.species,
            boss: true,
            style: 'stone',
            count: 9,
            x: e.x,
            y: e.y,
          });
          return;
        }
        if (e.family === 'citadel' && a.kind === 'pattern-charge') {
          if (!a.path?.length) return;
          e.motion = {
            ...a,
            target: { ...a.path[0] },
            leg: 0,
            hit: [],
            speed: 600,
            life: 8,
            charge: true,
          };
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
            sourceId: e.id,
            x: e.x,
            y: e.y,
            life: R.combatGeometry.ringLife * R.bossCadence.areaRangeMultiplier,
            tick: 0,
            damage: e.damage,
            slowDuration: a.slowDuration || 0,
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
            flightPath: a.flightPath ? a.flightPath.map(({ x, y }) => ({ x, y })) : null,
            life: a.flightPath ? 7 : 5,
          };
          return;
        }
        this.resolveArea(e, a);
        if (
          e.family === 'mine' &&
          a.index === 1 &&
          !(e.sequence || []).some((t) => t.index === 1)
        ) {
          const reserved = this.zone()
            .props.filter((p) => p.garunPreview)
            .map((p) => ({ x: p.x, y: p.y }));
          this.raiseMineWorks(e, a, reserved);
        }
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
            const landed = this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0, e.id);
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
            if (landed && (a.slow || a.slowDuration)) this.applySlow(u, a.slowDuration || 4);
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
          before = { x: e.x, y: e.y };
        a.life -= dt;
        const leg = a.flightPath?.length ? a.flightPath[0] : a.target;
        const moved = this.move(e, leg, a.speed || a.pounceSpeed || 450, dt);
        if (a.flightPath?.length && dist(e, leg) < 10) a.flightPath.shift();
        if (a.charge)
          for (const u of this.combatTargets()) {
            const id = u === this.hero ? 'hero' : u.id;
            if (
              !a.hit.includes(id) &&
              this.distanceToSegment(u, before, e) < R.combatGeometry.chargeHalfWidth &&
              this.line(e, u)
            ) {
              a.hit.push(id);
              this.hitParty(u, e.damage * a.coefficient, a.manaDrain || 0, e.id);
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
        if (a.kind === 'pattern-charge' && dist(e, a.target) < 5 && a.leg + 1 < a.path.length) {
          a.leg++;
          a.target = { ...a.path[a.leg] };
          a.hit = [];
          return;
        }
        // Axis fallback can report success for a zero-length clear segment.
        // A charge blocked by real geometry must end when it makes no progress.
        if (
          (!a.flightPath?.length && dist(e, a.target) < (a.flightPath ? 10 : 1)) ||
          !moved ||
          dist(before, e) < 0.000001 ||
          a.life <= 0
        ) {
          if (a.aerial === 'high-yo-yo') {
            const move = a.rogueAttack,
              victim =
                move.targetId === 'hero'
                  ? this.hero
                  : this.combatTargets().find((u) => u.id === move.targetId);
            if (victim?.hp > 0 && dist(victim, move) <= move.radius && this.line(e, victim)) {
              const hit = this.hitParty(victim, e.damage * move.coefficient);
              if (hit && victim.hp > 0) this.applySlow(victim, move.slowSeconds || 0.95);
            }
          } else if (a.aerial === 'wingover') {
            originalRogueMove.call(this, e, a.rogueAttack);
          } else if (a.aerial === 'go-around' && e.hp > 0 && dist(e, a.target) < 10) {
            // Retreat must physically finish. A blocked/expired motion is not
            // a successful Go-Around, even when its windup was valid.
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
          if (a.landing && dist(e, a.target) < 20) this.resolveArea(e, a);
          e.motion = null;
          e.cd =
            a.recovery *
            (e.type === 'boss' ? R.bossCadence.specialRecoveryMultiplier : 1) *
            (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1);
          if (a.opening)
            e.open = e.form === 'true' && e.family === 'citadel' ? a.opening / 2 : a.opening;
          e.telegraph = e.sequence?.shift() || null;
          if (e.family === 'mine' && a.index !== 1 && e.telegraph?.index === 1)
            this.prepareMineWorksPreview(e);
          if (e.telegraph) this.event('warning', { family: e.family });
          else if (!a.rogueMove)
            e.basicDue = e.type === 'boss' && e.attackIndex % R.bossCadence.skillsPerBasic === 0;
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
