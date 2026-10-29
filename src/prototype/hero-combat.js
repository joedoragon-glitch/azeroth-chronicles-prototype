/* Hero profession skills and basic combos. Rules remain authoritative for all three classes. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    // Enemy-only charged hush is transient; never saved or inherited.
    const rogueEnemySilences = new WeakMap();
    const rogueEnemyWithers = new WeakMap();
    const rogueEnemyWeakens = new WeakMap();
    // At most two finite stationary performance circles per campaign.
    // Weakly owned, unsaved and automatically scoped to the active region.
    const rogueMusicStations = new WeakMap();
    // One weak, unsaved, per-actor station-visibility cache. On-demand reads
    // are cheap even when combat asks several times per frame for every ally.
    const rogueStationChecks = new WeakMap();
    const costs = R.balance.skills.costs,
      cooldowns = R.balance.skills.cooldowns;
    // Adding a hero to the class registry must not silently use Ranger shots,
    // area geometry, critical keys or cooldowns before that class is authored.
    // The fourth class intentionally remains blocked until its combat ships.
    const implementedHeroCombatClasses = new Set(['paladin', 'mage', 'ranger']);
    class HeroCombat {
      tacticMilestones(rank) {
        return Math.floor(Math.max(1, rank || 1) / 2);
      }
      // Opt-in action-specific critical enhancement; unchanged OFF mechanics.
      criticalHeroValue(receipt, original, lever, bounds) {
        return receipt?.critical
          ? this._criticalPartyNative.enhance(receipt, original, lever, bounds)
          : original;
      }
      mageSilenceActive(unit) {
        const field = this.hero.silenceField;
        return (
          !!field &&
          field.zone === this.zoneId &&
          field.until > this.s.time &&
          dist(unit, field) <= field.radius
        );
      }
      weakenEnemy(e, rank, criticalReceipt = null) {
        const cfg = R.heroTactics.paladin.weaken,
          steps = this.tacticMilestones(rank);
        const stillWeakened = (e.weakenUntil || 0) > this.s.time;
        e.weakenUntil = Math.max(
          stillWeakened ? e.weakenUntil : 0,
          this.s.time + this.criticalHeroValue(criticalReceipt, cfg.duration + steps * cfg.durationStep, 'weakenDuration'),
        );
        e.weakenFraction = Math.max(
          stillWeakened ? e.weakenFraction || 0 : 0,
          cfg.fraction + steps * cfg.step,
        );
      }
      fractureEnemy(e, fraction, duration) {
        // One strongest fracture applies at a time. A weaker repeat never downgrades it.
        if ((e.fractureUntil || 0) <= this.s.time || fraction >= (e.fractureFraction || 0)) {
          e.fractureFraction = fraction;
          e.fractureUntil = this.s.time + duration;
        }
      }
      shieldPush(e, push) {
        // Respect solid terrain and the original boss arena. Never teleport or
        // override a scripted charge already in motion.
        if (e.motion || this.attackResetProtected(e)) return false;
        const d = Math.max(1, dist(this.hero, e)),
          direction = { x: (e.x - this.hero.x) / d, y: (e.y - this.hero.y) / d };
        for (let fraction = 1; fraction >= 0.25; fraction -= 0.25) {
          const point = {
            x: e.x + direction.x * push * fraction,
            y: e.y + direction.y * push * fraction,
          };
          if (
            this.clearSegment(e, point, 12) &&
            this.tacticalRogueLeashAllows(
              e,
              { ...point, hp: e.hp },
              e.type === 'boss' ? (this.isDungeon() ? 1800 : 700) : 500,
            )
          ) {
            const from = { x: e.x, y: e.y };
            this.move(e, point, push * 5, 0.25);
            if (dist(from, e) > 0.5)
              this.event('heroDisplace', {
                actor: 'hero',
                class: this.hero.class,
                x: e.x,
                y: e.y,
                fromX: from.x,
                fromY: from.y,
                target: e.id,
              });
            return true;
          }
        }
        return false;
      }
      tacticalSkillTarget(range, warningOnly = false) {
        const selected = this.selectedHeroTarget();
        const valid = (e) =>
          e.hp > 0 &&
          !e.neutral &&
          !this.attackResetProtected(e) &&
          this.tacticalDirectTargetable(e) &&
          dist(e, this.hero) <= range &&
          this.line(this.hero, e) &&
          (!warningOnly || e.telegraph || e.rangedAim);
        const targets = this.zone()
          .enemies.filter(valid)
          .sort((a, b) => dist(a, this.hero) - dist(b, this.hero) || this.idOrder(a, b));
        return targets.find((e) => e.id === selected?.id) || targets[0] || null;
      }
      interruptEnemyAction(enemy, action, criticalReceipt = null) {
        const cfg = R.heroTactics.mage.interrupt;
        if (!enemy.telegraph && !enemy.rangedAim) return false;
        if (action && enemy.telegraph !== action && enemy.rangedAim !== action) return false;
        if (enemy.telegraph) {
          // Interrupt exactly the current warned action. An authored
          // multi-stage boss sequence retains its later, separately
          // warned attacks instead of silently losing the entire phase.
          const interrupted = enemy.telegraph;
          enemy.telegraph = this.advanceQueuedAttack(enemy);
          if (enemy.family === 'mine' && interrupted.index !== 1 && enemy.telegraph?.index === 1)
            this.prepareMineWorksPreview(enemy);
          if (enemy.telegraph) {
            this.event(
              'warning',
              enemy.telegraph.anonymousCast
                ? { family: enemy.family, anonymousCast: true }
                : { family: enemy.family },
            );
          } else {
            const recovery = this.criticalHeroValue(criticalReceipt, cfg.enemyRecovery, 'cooldownDebt');
            enemy.cd = Math.max(enemy.cd || 0, recovery);
            enemy.specialCd = Math.max(enemy.specialCd || 0, recovery);
          }
        } else if (enemy.rangedAim) {
          enemy.rangedAim = null;
          enemy.cd = Math.max(enemy.cd || 0, this.criticalHeroValue(criticalReceipt, cfg.enemyRecovery, 'cooldownDebt'));
        }
        return true;
      }
      launchTargetedHeroSkill(enemy, slot, damage, style, extra) {
        const hero = this.hero,
          distance = Math.max(1, dist(hero, enemy));
        this.engage(enemy);
        this.s.projectiles.push({
          id: 'projectile-' + this.s.nextId++,
          x: hero.x,
          y: hero.y,
          dx: (enemy.x - hero.x) / distance,
          dy: (enemy.y - hero.y) / distance,
          target: enemy.id,
          source: 'hero',
          slot,
          damage,
          style,
          speed: R.balance.friendlyProjectiles.skillSpeed,
          ...extra,
        });
        this.event('projectileLaunch', {
          actor: 'hero',
          class: hero.class,
          source: 'hero',
          slot,
          style,
          x: hero.x,
          y: hero.y,
          target: enemy.id,
        });
      }
      // Ranger ultimates distribute real arrows across a bounded number of
      // enemies rather than recreating the former shared immunity attack.
      launchHuntArrow(enemy, damage, charged = false, delay = 0, receipt = null, criticalReceipt = null) {
        const hero = this.hero,
          distance = Math.max(1, dist(hero, enemy));
        this.s.projectiles.push({
          id: 'projectile-' + this.s.nextId++,
          x: hero.x,
          y: hero.y,
          dx: (enemy.x - hero.x) / distance,
          dy: (enemy.y - hero.y) / distance,
          target: enemy.id,
          damage,
          source: 'hero',
          slot: 8,
          ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
          style: 'arrow',
          speed: 650,
          delay,
          charged,
          ...(delay > 0 ? { rangerDelayedLaunch: true } : {}),
          ...(receipt ? { encountersAtStart: receipt } : {}),
        });
        // A queued delayed Hunt arrow has not left the Ranger yet.
        // Record its launch only when updateProjectiles releases its collider.
        if (delay <= 0) this.event('projectileLaunch', {
          actor: 'hero',
          class: 'ranger',
          source: 'hero',
          slot: 8,
          style: 'arrow',
          charged,
          x: hero.x,
          y: hero.y,
          target: enemy.id,
        });
      }
      huntTargets(target, radius, count) {
        if (!target || target.hp <= 0) return [];
        return [
          target,
          ...this.zone()
            .enemies.filter(
              (enemy) =>
                enemy !== target &&
                enemy.hp > 0 &&
                !enemy.neutral &&
                !this.attackResetProtected(enemy) &&
                dist(enemy, target) <= radius &&
                this.line(this.hero, enemy),
            )
            .sort((a, b) => dist(a, target) - dist(b, target) || this.idOrder(a, b)),
        ].slice(0, count);
      }
      castMageChain(target, scale, steps, power, charged = false, receipt = null, criticalReceipt = null) {
        if (!target) return false;
        const cfg = charged ? R.classUltimates.mage.chargedChain : R.classUltimates.mage.chain;
        const radius = cfg.radius + (cfg.radiusStep || 0) * steps;
        const enemies = this.huntTargets(target, radius, cfg.targets);
        let hits = 0;
        const chain = [];
        enemies.forEach((enemy, index) => {
          const coefficient =
            index === 0
              ? cfg.primaryDamage
              : index === 1
                ? cfg.secondaryDamage
                : cfg.tertiaryDamage || cfg.extraDamage;
          if (
            this.damage(enemy, this.criticalHeroValue(criticalReceipt, power * coefficient * scale, 'damage'), 'hero', {
              area: true,
              ...(receipt ? { encountersAtStart: receipt } : {}),
            })
          ) {
            hits++;
            chain.push({ x: enemy.x, y: enemy.y, target: enemy.id });
          }
        });
        if (charged)
          this.event('chargedArea', {
            actor: 'hero',
            class: 'mage',
            slot: 7,
            effect: 'arcane-chainstorm',
            shape: 'circle',
            x: target.x,
            y: target.y,
            fromX: this.hero.x,
            fromY: this.hero.y,
            radius,
            hits,
            chain,
          });
        else
          this.event('spell', {
            actor: 'hero',
            class: 'mage',
            source: 'hero',
            slot: 7,
            x: target.x,
            y: target.y,
            radius,
            target: target.id,
            chain,
            fromX: this.hero.x,
            fromY: this.hero.y,
          });
        return true;
      }
      castHeroUltimate(target, scale, steps, power, charged = false, receipt = null, criticalReceipt = null) {
        const hero = this.hero;
        const cfg = R.classUltimates[hero.class][charged ? 'charged' : 'normal'];
        const radius = cfg.radius + (cfg.radiusStep || 0) * steps;
        let hits = 0;
        if (hero.class === 'ranger') {
          const foes = this.huntTargets(target, radius, cfg.targets);
          // The hunt stays a crowd skill. Against a truly isolated enemy it
          // gains only one extra non-piercing arrow, still less efficient
          // than Skill 7's specialized defense-piercing boss strike.
          const arrowsPerTarget = foes.length === 1 ? cfg.isolatedArrows : cfg.arrowsPerTarget || 1;
          foes.forEach((foe, index) => {
            for (let n = 0; n < arrowsPerTarget; n++) {
              this.launchHuntArrow(
                foe,
                this.criticalHeroValue(criticalReceipt, power * cfg.damagePerArrow * scale, 'damage'),
                charged,
                index * 0.04 + n * 0.1,
                receipt,
                criticalReceipt,
              );
              hits++;
            }
          });
        } else {
          // Cap instant hit count to keep massive packs dangerous. Always
          // prioritize the explicitly selected Mage target for primary damage.
          const center = hero.class === 'paladin' ? hero : target;
          const eligible = this.zone().enemies.filter(
            (e) =>
              e.hp > 0 &&
              !e.neutral &&
              !this.attackResetProtected(e) &&
              dist(e, center) <= radius &&
              this.line(hero, e),
          );
          const foes = (
            hero.class === 'mage'
              ? [
                  target,
                  ...eligible
                    .filter((e) => e !== target)
                    .sort((a, b) => dist(a, center) - dist(b, center) || this.idOrder(a, b)),
                ]
              : eligible.sort((a, b) => dist(a, hero) - dist(b, hero) || this.idOrder(a, b))
          ).slice(0, cfg.maxTargets);
          for (const foe of foes) {
            const coefficient =
              hero.class === 'paladin'
                ? cfg.damage
                : foe === target
                  ? cfg.primaryDamage
                  : cfg.splashDamage;
            if (
              !this.damage(foe, this.criticalHeroValue(hero.class === 'mage' && !charged ? criticalReceipt : null, power * coefficient * scale, 'damage'), 'hero', {
                area: true,
                ...(receipt ? { encountersAtStart: receipt } : {}),
              })
            )
              continue;
            if (hero.class === 'mage' && charged)
              this.fractureEnemy(
                foe,
                cfg.fracture + steps * cfg.fractureStep,
                this.criticalHeroValue(criticalReceipt, cfg.fractureDuration, 'vulnerabilityDuration'),
              );
            if (hero.class === 'paladin' && charged && cfg.weaken)
              this.weakenEnemy(foe, hero.skills[7]);
            hits++;
          }
          if (hero.class === 'paladin') {
            hero.hp = Math.min(hero.maxHp, hero.hp + this.criticalHeroValue(charged ? null : criticalReceipt, hero.maxHp * cfg.heal, 'healAmount'));
            const living = [
              hero,
              ...this.activeLivingParty().filter(
                (ally) => dist(ally, hero) <= radius && this.line(hero, ally),
              ),
            ];
            for (const ally of living) {
              const until = this.s.time + this.criticalHeroValue(charged ? criticalReceipt : null, cfg.wardDuration + cfg.wardStep * steps, 'wardDuration');
              const stillActive = (ally.wardUntil || 0) > this.s.time;
              ally.wardUntil = Math.max(ally.wardUntil || 0, until);
              ally.wardReduction = Math.max(
                stillActive ? ally.wardReduction || 0 : 0,
                cfg.wardReduction,
              );
            }
            this.event('heal', {
              skillPresentation: true,
              x: hero.x,
              y: hero.y,
              resource: 'health',
              target: 'hero',
            });
          }
        }
        const center = hero.class === 'paladin' ? hero : target;
        if (charged)
          this.event('chargedArea', {
            actor: 'hero',
            class: hero.class,
            slot: 8,
            effect:
              hero.class === 'paladin'
                ? 'last-bastion'
                : hero.class === 'mage'
                  ? 'arcane-cataclysm'
                  : 'grand-hunt',
            shape: 'circle',
            x: center.x,
            y: center.y,
            fromX: hero.x,
            fromY: hero.y,
            radius,
            hits,
          });
        else
          this.event('spell', {
            actor: 'hero',
            class: hero.class,
            source: 'hero',
            slot: 8,
            x: center.x,
            y: center.y,
            radius,
            target: target?.id,
          });
        return true;
      }
      castChargedAdvanced(slot, target, rank, scale, steps, power, encountersAtStart, criticalReceipt = null) {
        const cfg = R.advancedCharges?.[slot]?.[this.hero.class];
        if (!cfg) return false;
        const hero = this.hero;
        const start = { x: hero.x, y: hero.y };
        const radius = (cfg.radius || 0) + (cfg.radiusStep || 0) * steps;
        const eligible = (enemy, center = hero, range = radius) =>
          enemy.hp > 0 &&
          !enemy.neutral &&
          !this.attackResetProtected(enemy) &&
          dist(enemy, center) <= range &&
          this.line(hero, enemy);
        const foes = radius
          ? this.zone()
              .enemies.filter((enemy) => eligible(enemy))
              .sort(
                (a, b) =>
                  (slot === 7 && b === target ? 1 : 0) - (slot === 7 && a === target ? 1 : 0) ||
                  dist(a, hero) - dist(b, hero) ||
                  this.idOrder(a, b),
              )
              .slice(
                0,
                slot === 5
                  ? R.heroAreaTargetCaps[5].charged
                  : slot === 7 && hero.class === 'paladin'
                    ? R.heroAreaTargetCaps[7].paladinCharged
                    : Infinity,
              )
          : [];
        const deal = (enemy, amount, area = false, piercing = false) =>
          this.damage(enemy, amount, 'hero', {
            area,
            ...(piercing ? { piercing: true } : {}),
            ...(encountersAtStart ? { encountersAtStart } : {}),
          });
        const pulse = (effect, hits, x = hero.x, y = hero.y, r = radius) =>
          this.event('chargedArea', {
            slot,
            class: hero.class,
            actor: 'hero',
            source: 'hero',
            effect,
            shape: 'circle',
            x,
            y,
            radius: r,
            fromX: hero.x,
            fromY: hero.y,
            hits,
          });
        const launch = (enemy, damage, style, extra = {}) => {
          const d = Math.max(1, dist(hero, enemy));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: hero.x,
            y: hero.y,
            dx: (enemy.x - hero.x) / d,
            dy: (enemy.y - hero.y) / d,
            target: enemy.id,
            damage,
            source: 'hero',
            slot,
            speed: style === 'beam' ? 1000 : 620,
            style,
            charged: true,
            ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
            ...(style === 'beam' ? { originX: hero.x, originY: hero.y } : {}),
            ...(encountersAtStart ? { encountersAtStart } : {}),
            ...extra,
            ...(style === 'arrow' && extra.delay > 0 ? { rangerDelayedLaunch: true } : {}),
          });
          // Do not report a delayed arrow as launched at burst admission.
          if (!(style === 'arrow' && extra.delay > 0)) this.event('projectileLaunch', {
            actor: 'hero',
            class: hero.class,
            source: 'hero',
            slot,
            charged: true,
            style: style === 'beam' ? 'magic' : style,
            beam: style === 'beam',
            x: hero.x,
            y: hero.y,
            target: enemy.id,
          });
        };
        if (slot === 5) {
          let hits = 0;
          for (const enemy of foes) {
            if (hero.class === 'ranger') {
              launch(enemy, power * cfg.damage * scale, 'arrow', {
                area: true,
                slow: this.criticalHeroValue(criticalReceipt, cfg.slow + cfg.slowStep * steps, 'slowDuration'),
              });
              hits++;
            } else if (deal(enemy, power * cfg.damage * scale, true)) {
              if (hero.class === 'paladin' && cfg.weaken) this.weakenEnemy(enemy, rank, criticalReceipt);
              if (hero.class === 'mage' && enemy.hp > 0)
                this.shieldPush(enemy, this.criticalHeroValue(criticalReceipt, cfg.push + cfg.pushStep * steps, 'pushDistance'));
              hits++;
            }
          }
          pulse(
            hero.class === 'paladin'
              ? 'consecrated-wave'
              : hero.class === 'mage'
                ? 'winter-ring'
                : 'arrow-rain',
            hits,
          );
          return true;
        }
        if (slot === 6) {
          if (hero.class === 'paladin') {
            let hits = 0;
            for (const enemy of this.zone()
              .enemies.filter((e) => eligible(e, hero, cfg.radius + cfg.radiusStep * steps))
              .sort((a, b) => this.idOrder(a, b))) {
              if (deal(enemy, power * cfg.damage * scale, true)) {
                if (enemy.hp > 0) this.shieldPush(enemy, this.criticalHeroValue(criticalReceipt, cfg.push + cfg.pushStep * steps, 'pushDistance'));
                hits++;
              }
            }
            pulse('vanguard-impact', hits, start.x, start.y, cfg.radius + cfg.radiusStep * steps);
          } else if (hero.class === 'mage') {
            launch(target, power * cfg.damage * scale, 'beam', {
              slow: this.criticalHeroValue(criticalReceipt, cfg.slow + cfg.slowStep * steps, 'slowDuration'),
            });
            this.event('charged', {
              actor: 'hero',
              class: 'mage',
              slot,
              x: hero.x,
              y: hero.y,
              targetX: target.x,
              targetY: target.y,
            });
          } else {
            for (let j = 0; j < cfg.arrows; j++)
              launch(target, (power * cfg.damage * scale) / cfg.arrows, 'arrow', {
                delay: j * 0.08,
                rapid: true,
                chargedBurst: j === cfg.arrows - 1,
                push: j === cfg.arrows - 1
                  ? this.criticalHeroValue(criticalReceipt, cfg.push + cfg.pushStep * steps, 'pushDistance')
                  : 0,
              });
            this.event('charged', {
              actor: 'hero',
              class: 'ranger',
              slot,
              x: hero.x,
              y: hero.y,
              targetX: target.x,
              targetY: target.y,
            });
          }
          return true;
        }
        if (slot === 7) {
          if (hero.class === 'mage')
            return this.castMageChain(target, scale, steps, power, true, encountersAtStart, criticalReceipt);
          if (hero.class === 'ranger') {
            launch(target, power * cfg.damage * scale, 'arrow', {
              piercing: true,
              slow: this.criticalHeroValue(criticalReceipt, cfg.slow + cfg.slowStep * steps, 'slowDuration'),
            });
          } else {
            let hits = 0;
            for (const enemy of foes)
              if (deal(enemy, power * cfg.damage * scale, true)) {
                if (hero.class === 'paladin') this.weakenEnemy(enemy, rank, criticalReceipt);
                hits++;
              }
            pulse(hero.class === 'paladin' ? 'oath-strike' : 'sigil-storm', hits);
          }
          return true;
        }
        if (slot === 8)
          return this.castHeroUltimate(target, scale, steps, power, true, encountersAtStart, criticalReceipt);
        return false;
      }
      nextBasicCombo(targetId) {
        const cfg = R.basicAttackCombo || { steps: 3, resetSeconds: 4, multipliers: [1, 1.1, 1.2] };
        if (
          this.basicComboClass !== this.hero.class ||
          this.basicComboTargetId !== targetId ||
          this.s.time - this.basicComboAt > cfg.resetSeconds
        )
          this.basicComboStep = 0;
        this.basicComboClass = this.hero.class;
        this.basicComboTargetId = targetId;
        this.basicComboStep = (this.basicComboStep % cfg.steps) + 1;
        this.basicComboAt = this.s.time;
        return {
          step: this.basicComboStep,
          multiplier: cfg.multipliers?.[this.basicComboStep - 1] || 1,
        };
      }
      resetBasicCombo() {
        this.basicComboStep = 0;
        this.basicComboAt = -1e9;
        this.basicComboClass = this.hero.class;
        this.basicComboTargetId = null;
      }
      basicComboFinisher(
        target,
        from,
        baseDamage,
        source = 'hero',
        heroClass = this.hero.class,
        automatic = false,
      ) {
        const cfg = R.basicAttackCombo?.finisher,
          def = cfg?.[heroClass];
        if (!target || !def) return 0;
        const angle = Math.atan2(target.y - from.y, target.x - from.x),
          delta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
        let hits = 0;
        for (const e of this.zone()
          .enemies.filter(
            (e) =>
              e !== target &&
              (!automatic || !this.awaitsHeroAttack(e)) &&
              e.hp > 0 &&
              !e.neutral &&
              dist(e, from) <= def.range &&
              Math.abs(delta(Math.atan2(e.y - from.y, e.x - from.x), angle)) <= def.halfAngle &&
              this.line(from, e),
          )
          .sort((a, b) => this.idOrder(a, b))) {
          if (
            this.damage(e, baseDamage * (cfg.secondaryMultiplier || 0.55), source, { area: true })
          )
            hits++;
        }
        this.event('basicComboFinisher', {
          class: heroClass,
          effect: def.effect,
          shape: 'cone',
          x: target.x,
          y: target.y,
          fromX: from.x,
          fromY: from.y,
          angle,
          range: def.range,
          halfAngle: def.halfAngle,
          hits,
          targetId: target.id,
        });
        return hits;
      }
      // Legacy MP cost stays executable behind resourceMode for reversible restoration.
      skillManaCost(slot, rank = this.hero.skills[slot - 1] || 1, charged = false) {
        if (!R.resourceMode.manaEnabled) return 0;
        if (charged) {
          const fraction = R.chargedSkills?.manaFractions?.[slot];
          if (fraction) return Math.max(1, Math.ceil(this.hero.maxMp * fraction));
        }
        if (slot === 1) return 0;
        return Math.ceil(costs[slot] * (1 + R.manaBalance.rankCostGrowth * Math.max(0, rank - 1)));
      }
      skillCooldown(slot, charged = false) {
        // The Rogue's first charged performance has its own cooldown budget.
        if (slot === 1 && charged && this.hero.class === 'rogue')
          return 8 * (1 - this.heroCooldownReduction());
        const first = R.chargedSkills.first;
        const base =
          slot === 1
            ? charged
              ? first.chargedSeconds[this.hero.class]
              : first.normalSeconds
            : !R.resourceMode.manaEnabled && charged
              ? R.cooldownBalance.chargedSeconds[slot] || cooldowns[slot]
              : cooldowns[slot];
        return base * (1 - this.heroCooldownReduction());
      }
      basicSkillCooldown() {
        return R.chargedSkills.first.basicSeconds * (1 - this.heroCooldownReduction());
      }
      skillReady(slot, charged = false) {
        const i = slot - 1;
        return (this.hero.cd[i] || 0) <= 0 && (!charged || (this.hero.chargedCd?.[i] || 0) <= 0);
      }
      // Target selection is transient: no changes to campaign saves or difficulty.
      // A held Target locks the current foe even while dodging beyond selection range.
      selectedHeroTarget() {
        const id = this.manualHeroTargetId;
        if (!id) return null;
        const enemy =
          this.manualHeroTargetZone === this.zoneId
            ? this.zone().enemies.find((e) => e.id === id)
            : null;
        if (
          this.peace ||
          this.hero.hp <= 0 ||
          this.s.challenge?.pending ||
          this.s.challenge?.gameOver ||
          !enemy ||
          enemy.hp <= 0 ||
          enemy.neutral ||
          this.attackResetProtected(enemy) ||
          !this.tacticalDirectTargetable(enemy) ||
          (this.manualHeroTargetLocked
            ? dist(enemy, this.hero) > 1400 && !enemy.aggro
            : dist(enemy, this.hero) > 680)
        ) {
          this.manualHeroTargetId = null;
          this.manualHeroTargetLocked = false;
          this.manualHeroTargetZone = null;
          if (this.s.heroTarget === id) this.s.heroTarget = null;
          return null;
        }
        return enemy;
      }
      holdHeroTarget(visible = () => true, preferredId = null) {
        if (this.peace) return null;
        let enemy = this.selectedHeroTarget();
        // A long press holds the foe already being attacked, not necessarily
        // the nearest summon that appeared while the button was depressed.
        if (!enemy) {
          const id = preferredId || this.s.heroTarget;
          enemy = this.zone().enemies.find(
            (e) =>
              e.id === id &&
              e.hp > 0 &&
              !e.neutral &&
              !this.attackResetProtected(e) &&
              this.tacticalDirectTargetable(e) &&
              dist(e, this.hero) <= 680 &&
              this.line(this.hero, e) &&
              visible(e),
          );
        }
        if (!enemy) enemy = this.cycleHeroTarget(visible);
        if (!enemy) return null;
        this.manualHeroTargetId = enemy.id;
        this.manualHeroTargetZone = this.zoneId;
        this.manualHeroTargetLocked = true;
        this.s.heroTarget = enemy.id;
        return enemy;
      }
      cycleHeroTarget(visible = () => true) {
        if (this.peace) return null;
        const current = this.selectedHeroTarget();
        const enemies = this.zone()
          .enemies.filter(
            (e) =>
              e.hp > 0 &&
              !e.neutral &&
              !this.attackResetProtected(e) &&
              this.tacticalDirectTargetable(e) &&
              dist(e, this.hero) <= 680 &&
              this.line(this.hero, e) &&
              visible(e),
          )
          .sort((a, b) => dist(a, this.hero) - dist(b, this.hero) || this.idOrder(a, b));
        if (!enemies.length) {
          // A deliberate quick press releases a lock even offscreen, including
          // its legacy squad-focus target, so automatic combat can resume.
          if (this.s.heroTarget === this.manualHeroTargetId) this.s.heroTarget = null;
          this.manualHeroTargetId = null;
          this.manualHeroTargetLocked = false;
          this.manualHeroTargetZone = null;
          return null;
        }
        const index = enemies.findIndex((e) => e.id === current?.id);
        const target = enemies[(index + 1) % enemies.length];
        this.manualHeroTargetId = target.id;
        this.manualHeroTargetZone = this.zoneId;
        this.manualHeroTargetLocked = false; // A new manual choice releases an old lock.
        this.s.heroTarget = target.id;
        if (this.hero.order?.type === 'skill-approach' && this.hero.order.id !== target.id)
          this.hero.order = null;
        return target;
      }
      heroSkillRange(slot, charged = false) {
        if (this.hero.class === 'rogue')
          return slot === 1 ? this.rogueSkill1Config(charged).range :
            (R.roguePerformances[slot]?.[charged ? 'charged' : 'tap']?.range || 0);
        if (!implementedHeroCombatClasses.has(this.hero.class)) return 0;
        const second = charged && slot === 2 ? R.chargedSkills.second?.[this.hero.class] : null,
          steps = this.tacticMilestones(this.hero.skills[slot - 1]);
        if (slot === 1 && charged) {
          const cfg = R.chargedSkills.first;
          return this.hero.class === 'paladin'
            ? cfg.paladin.reach + cfg.paladin.reachStep * steps
            : this.hero.class === 'mage'
              ? cfg.mage.reach + cfg.mage.reachStep * steps
              : cfg.ranger.launchRange;
        }
        if (slot === 4 && this.hero.class === 'paladin')
          return charged
            ? R.heroTactics.paladin.grandJudgment.range
            : R.heroTactics.paladin.judgment.range;
        if (slot === 4 && this.hero.class === 'mage') return R.heroTactics.mage.fracture.range;
        return second
          ? second.range
            ? second.range + steps * 5
            : 480
          : this.hero.class === 'paladin' && slot < 3
            ? 120
            : slot === 1
              ? this.hero.class === 'mage'
                ? 400
                : 450
              : 480;
      }
      // Gameplay-only transient Skill 1 effects; not saved, not driven by art or sound.
      heroSkillEffectLive(f) {
        return (
          f.zone === this.zoneId &&
          f.deaths === this.s.statistics.deaths &&
          this.hero.hp > 0 &&
          !this.peace &&
          !this.s.challenge?.pending &&
          !this.s.challenge?.gameOver
        );
      }
      resolveHeroCrossPulse(f, pulse) {
        if (!this.heroSkillEffectLive(f)) return;
        const cfg = R.chargedSkills.first.paladin,
          angles = [f.angle, f.angle + Math.PI / 2, f.angle + Math.PI, f.angle + Math.PI * 1.5],
          // Four independent solid-terrain limits ensure the visible cross
          // never projects an arm through a wall beyond its legal collision.
          arms = angles.map((angle) => {
            const dx = Math.cos(angle),
              dy = Math.sin(angle);
            let legal = 0,
              previous = f.from;
            for (let step = 8; step <= f.reach + 8; step += 8) {
              const next = Math.min(f.reach, step),
                point = { x: f.from.x + dx * next, y: f.from.y + dy * next };
              if (!this.clearSegment(previous, point, 0)) break;
              legal = next;
              previous = point;
            }
            return { angle, length: legal, x: f.from.x + dx * legal, y: f.from.y + dy * legal };
          });
        const within = (e) =>
          arms.some((arm) => {
            const dx = e.x - f.from.x,
              dy = e.y - f.from.y,
              ca = Math.cos(arm.angle),
              sa = Math.sin(arm.angle),
              along = dx * ca + dy * sa,
              cross = Math.abs(dy * ca - dx * sa),
              radius = this.actorRadius(e);
            return (
              along >= -radius && along <= arm.length + radius && cross <= f.halfWidth + radius
            );
          });
        const candidates = this.zone().enemies.filter(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            !e.returning &&
            !this.attackResetProtected(e) &&
            within(e) &&
            this.line(f.from, e),
        );
        candidates.sort(
          (a, b) =>
            (a.id === f.targetId ? -1 : b.id === f.targetId ? 1 : 0) ||
            dist(f.from, a) - dist(f.from, b) ||
            this.idOrder(a, b),
        );
        let hits = 0;
        for (const e of candidates) {
          if (!f.admitted.includes(e.id)) {
            if (f.admitted.length >= cfg.maxTargets) continue;
            f.admitted.push(e.id);
          }
          if (
            this.damage(e, f.damage * cfg.damagePerPulse, 'hero', {
              area: true,
              encountersAtStart: f.encountersAtStart,
            })
          )
            hits++;
        }
        this.event('heroSkillArea', {
          actor: 'hero',
          class: 'paladin',
          slot: 1,
          effect: 'radiant-cross',
          x: f.from.x,
          y: f.from.y,
          angle: f.angle,
          reach: f.reach,
          halfWidth: f.halfWidth,
          arms: arms.map((arm) => ({ x: arm.x, y: arm.y })),
          pulse,
          hits,
        });
      }
      // Lock a far-world aiming point at release. The Mage stays mobile:
      // the near end follows the caster, changing the angle toward that point.
      // This is neither a homing beam nor a parallel sideways sweep.
      resolveWideArcaneBeam(f) {
        if (!this.heroSkillEffectLive(f)) return;
        const ux = Math.cos(f.angle),
          uy = Math.sin(f.angle),
          step = 8;
        let castLimit = f.reach,
          previous = f.from;
        for (let distance = step; distance <= f.reach + step; distance += step) {
          const along = Math.min(distance, f.reach),
            point = { x: f.from.x + ux * along, y: f.from.y + uy * along };
          if (!this.clearSegment(previous, point, 0)) {
            castLimit = Math.max(0, along - step);
            break;
          }
          previous = point;
        }
        const aim = {
          x: f.from.x + ux * castLimit,
          y: f.from.y + uy * castLimit,
        };
        const beam = {
          ...f,
          kind: 'wide-beam',
          aim,
          elapsed: 0,
          traveled: 0,
          hitIds: [],
          hits: 0,
          endX: f.from.x,
          endY: f.from.y,
          visibleLength: 0,
        };
        (this._heroSkillEffects ||= []).push(beam);
        this.event('heroSkillArea', {
          actor: 'hero',
          class: 'mage',
          slot: 1,
          effect: 'wide-arcane-beam',
          phase: 'launch',
          x: f.from.x,
          y: f.from.y,
          endX: aim.x,
          endY: aim.y,
          angle: f.angle,
          reach: f.reach,
          halfWidth: f.halfWidth,
          travelSeconds: Math.min(f.reach, dist(f.from, aim)) / 704,
          travelSpeed: 704,
          hits: 0,
        });
      }
      advanceHeroSkillEffects(dt) {
        if (!this._heroSkillEffects?.length) return;
        const cfg = R.chargedSkills.first.ranger;
        this._heroSkillEffects = this._heroSkillEffects.filter((f) => {
          if (!this.heroSkillEffectLive(f)) return false;
          if (f.kind === 'cross') {
            if (this.s.time < f.due) return true;
            this.resolveHeroCrossPulse(f, 1);
            return false;
          }
          if (f.kind === 'wide-beam') {
            // Live source, fixed WORLD-SPACE aim point. Sideways movement
            // changes the beam angle, not a translated parallel lane.
            // The normal range limit still applies if the Mage backs away.
            // A changed angle may contact additional foes, once each.
            f.elapsed = (f.elapsed || 0) + dt;
            const from = { x: this.hero.x, y: this.hero.y },
              gap = dist(from, f.aim),
              range = Math.min(f.reach, gap),
              ux = gap > 0 ? (f.aim.x - from.x) / gap : Math.cos(f.angle),
              uy = gap > 0 ? (f.aim.y - from.y) / gap : Math.sin(f.angle);
            // Fixed physical speed, independent of the current target distance.
            f.traveled = Math.min(f.reach, (f.traveled || 0) + 704 * dt);
            let visibleLength = 0,
              previous = from;
            // Reclip the CURRENT angled corridor to solid terrain. Never
            // let a cosmetic tether grant damage through a newly crossed wall.
            for (let step = 8; step < f.traveled + 8; step += 8) {
              const along = Math.min(step, f.traveled),
                point = { x: from.x + ux * along, y: from.y + uy * along };
              if (!this.clearSegment(previous, point, 0)) break;
              visibleLength = along;
              previous = point;
            }
            const end = {
              x: from.x + ux * visibleLength,
              y: from.y + uy * visibleLength,
            };
            // Both Canvas and Pixi overlays use this SAME simulation-owned
            // footprint, so rendering never invents additional damage reach.
            f.from = from;
            f.endX = end.x;
            f.endY = end.y;
            f.visibleLength = visibleLength;
            for (const e of this.zone().enemies) {
              if (
                f.hitIds.includes(e.id) ||
                e.hp <= 0 ||
                e.neutral ||
                e.returning ||
                this.attackResetProtected(e)
              )
                continue;
              const radius = this.actorRadius(e),
                forward = (e.x - from.x) * ux + (e.y - from.y) * uy;
              if (
                forward < 0 ||
                forward > visibleLength + radius ||
                this.distanceToSegment(e, from, end) > f.halfWidth + radius ||
                !this.line(from, e)
              )
                continue;
              f.hitIds.push(e.id);
              if (
                this.damage(e, f.damage * R.chargedSkills.first.mage.damage, 'hero', {
                  area: true,
                  encountersAtStart: f.encountersAtStart,
                })
              )
                f.hits++;
            }
            if (f.traveled + 0.001 < range && f.elapsed < 1.5) return true;
            this.event('heroSkillArea', {
              actor: 'hero',
              class: 'mage',
              slot: 1,
              effect: 'wide-arcane-beam',
              phase: 'complete',
              x: from.x,
              y: from.y,
              endX: end.x,
              endY: end.y,
              halfWidth: f.halfWidth,
              hits: f.hits,
            });
            return false;
          }
          if (f.kind !== 'hawk') return false;
          const target = this.zone().enemies.find((e) => e.id === f.targetId);
          if (
            !target ||
            target.hp <= 0 ||
            target.neutral ||
            target.returning ||
            this.attackResetProtected(target) ||
            !this.tacticalDirectTargetable(target)
          ) {
            this.event('heroHawk', {
              actor: 'hero',
              class: 'ranger',
              slot: 1,
              phase: 'expire',
              x: f.x,
              y: f.y,
              targetId: f.targetId,
            });
            return false;
          }
          const gap = dist(f, target),
            contact = cfg.hitRadius + this.actorRadius(target),
            available = Math.min(cfg.speed * dt, f.budget - f.traveled);
          f.elapsed += dt;
          if (gap > contact && available <= 0) {
            this.event('heroHawk', {
              actor: 'hero',
              class: 'ranger',
              slot: 1,
              phase: 'expire',
              x: f.x,
              y: f.y,
              targetId: f.targetId,
            });
            return false;
          }
          const travel = Math.min(Math.max(0, gap - contact), available);
          const next =
            gap > 0
              ? {
                  x: f.x + ((target.x - f.x) / gap) * travel,
                  y: f.y + ((target.y - f.y) / gap) * travel,
                }
              : { x: f.x, y: f.y };
          if (!this.clearSegment(f, next, 0)) {
            this.event('heroHawk', {
              actor: 'hero',
              class: 'ranger',
              slot: 1,
              phase: 'expire',
              x: f.x,
              y: f.y,
              targetId: f.targetId,
            });
            return false;
          }
          const old = { x: f.x, y: f.y };
          f.x = next.x;
          f.y = next.y;
          f.traveled += travel;
          this.event('heroHawk', {
            actor: 'hero',
            class: 'ranger',
            slot: 1,
            phase: 'flight',
            x: f.x,
            y: f.y,
            fromX: old.x,
            fromY: old.y,
            angle: Math.atan2(target.y - f.y, target.x - f.x),
            targetId: f.targetId,
          });
          // Projection can leave a sub-pixel rounding residue at exact contact.
          if (dist(f, target) <= contact + 1e-7) {
            // Check active retreat before damage mutates regroup and threat.
            const retreat = this.hawkRetreatKind(target);
            const landed = this.damage(target, f.damage * cfg.damage, 'hero', {
              encountersAtStart: f.encountersAtStart,
            });
            const interrupted =
              landed && retreat
                ? this.hawkInterruptRetreat(
                    target,
                    retreat,
                    cfg.retreatLock + this.tacticMilestones(f.rank) * cfg.retreatStep,
                  )
                : false;
            this.event('heroHawk', {
              actor: 'hero',
              class: 'ranger',
              slot: 1,
              phase: 'impact',
              x: target.x,
              y: target.y,
              targetId: target.id,
              landed,
              interrupted,
            });
            return false;
          }
          const alive = f.elapsed < cfg.lifetime && f.traveled < f.budget;
          if (!alive)
            this.event('heroHawk', {
              actor: 'hero',
              class: 'ranger',
              slot: 1,
              phase: 'expire',
              x: f.x,
              y: f.y,
              targetId: f.targetId,
            });
          return alive;
        });
      }
      // Independently authored releases: automatic combo, manual Skill 1
      // tap, and charged Skill 1 never share a critical action or Charm roll.
      // This is strictly opt-in until the native Rogue controller is released.
      rogueCriticalRelease(action) {
        return this.hero.class === 'rogue' && this._criticalPartyNative?.enabled
          ? this._criticalPartyNative.release(this, 'hero/rogue/' + action, 'hero')
          : null;
      }
      // These are owner-tunable first-play numbers, not permanent skill names.
      rogueStationProtection(unit) {
        if (this.hero.class !== 'rogue' || !unit || unit.hp <= 0) return null;
        const fields = rogueMusicStations.get(this);
        // No active stations means zero party membership or terrain work.
        if (!fields?.length ||
            (unit !== this.hero &&
              (unit.active === false || !this.s.party.includes(unit)))) return null;
        // Resolve the cheap geometric membership for Rogue and each companion
        // on demand. Entry, exit and exact expiry never await cache refresh.
        let inside = 0;
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i], dx = unit.x - field.x, dy = unit.y - field.y;
          if (field.zone === this.zoneId && field.until > this.s.time &&
              dx * dx + dy * dy <= field.radius * field.radius) inside |= 1 << i;
        }
        if (!inside) {
          // Leaving a circle drops cached visibility, so re-entry is checked
          // immediately rather than reusing a prior inside-the-field result.
          rogueStationChecks.delete(unit);
          return null;
        }
        const cached = rogueStationChecks.get(unit),
          moved = cached
            ? (unit.x - cached.x) ** 2 + (unit.y - cached.y) ** 2 : Infinity;
        // At most 2 fields, 4 Hz for an unmoving actor; walking farther than
        // 24 units triggers an earlier visibility refresh. No extra timer,
        // scan loop, or extra work for companions outside the stations.
        if (cached && cached.owner === this && cached.fields === fields &&
            cached.zone === this.zoneId && cached.inside === inside &&
            this.s.time >= cached.checkedAt && this.s.time < cached.refreshAt &&
            moved <= 24 * 24) return cached.effect;
        let selected = null;
        for (let i = 0; i < fields.length; i++) {
          if (!(inside & (1 << i)) || !this.line(fields[i], unit)) continue;
          selected = {
            // The two independent stations add while physically overlapping.
            // Fractions cannot exceed the complete (100%) prevention boundary.
            resistance: Math.min(1, (selected?.resistance || 0) + fields[i].resistance),
            ward: Math.min(1, (selected?.ward || 0) + fields[i].ward),
          };
        }
        rogueStationChecks.set(unit, {
          owner: this, fields, zone: this.zoneId, inside,
          checkedAt: this.s.time, refreshAt: this.s.time + 0.25,
          x: unit.x, y: unit.y, effect: selected,
        });
        return selected;
      }
      tickRogueStations() {
        const fields = rogueMusicStations.get(this);
        if (!fields?.length) return;
        if (this.hero.class !== 'rogue' || this.hero.hp <= 0 || this.peace) {
          rogueMusicStations.delete(this);
          return;
        }
        // Stable field-list identity makes party-wide sightline caching useful;
        // only create a new list when an old station actually expires.
        let live = fields;
        if (fields.some((field) =>
          field.zone !== this.zoneId || field.until <= this.s.time)) {
          live = fields.filter((field) =>
            field.zone === this.zoneId && field.until > this.s.time);
          if (!live.length) { rogueMusicStations.delete(this); return; }
          rogueMusicStations.set(this, live);
        }
        for (const field of live) {
          if (field.nextPulse > this.s.time) continue;
          field.nextPulse = this.s.time + 0.65;
          const contacts = this.zone().enemies.filter((e) =>
            e.hp > 0 && !e.neutral && !e.returning &&
            !this.attackResetProtected(e) &&
            this.tacticalDirectTargetable(e) &&
            dist(e, field) <= field.radius && this.line(field, e))
            .sort((a,b) => dist(a,field)-dist(b,field) || this.idOrder(a,b))
            .slice(0,field.cap);
          for (const e of contacts) {
            this.applySlow(e, field.slow);
            if (field.pulseDamage > 0)
              this.damage(e, (this.power() + 8) * field.pulseDamage, 'hero', { area: true });
          }
        }
      }
      rogueEnemyHealingFactor(e) {
        const state = rogueEnemyWithers.get(e);
        if (this.hero.class !== 'rogue' || state?.zone !== this.zoneId || e?.hp <= 0)
          return 1;
        const suppression = state.effects.reduce((sum, effect) =>
          sum + (effect.until > this.s.time ? effect.antiHeal : 0), 0);
        return 1 - Math.min(1, suppression);
      }
      tickRogueEnemyDot(e, dt) {
        const state = rogueEnemyWithers.get(e);
        if (this.hero.class !== 'rogue' || this.peace || e?.hp <= 0 ||
            state?.zone !== this.zoneId) return false;
        let landed = false;
        for (const effect of state.effects) {
          if (e.hp <= 0) break;
          if (effect.until <= this.s.time - dt || !(effect.remaining > 0)) continue;
          const live = Math.max(0.01, effect.until - (this.s.time - dt)),
            amount = Math.min(effect.remaining,
              effect.remaining * Math.min(dt, live) / live);
          if (!(amount > 0) || !this.damage(e, amount, 'hero', { area: true })) continue;
          effect.remaining -= amount;
          landed = true;
        }
        return landed;
      }
      rogueEnemyWeakenFraction(e) {
        const state = rogueEnemyWeakens.get(e);
        if (this.hero.class !== 'rogue' || state?.zone !== this.zoneId) return 0;
        return state.effects.reduce((sum, effect) =>
          sum + (effect.until > this.s.time ? effect.fraction : 0), 0);
      }
      rogueEnemySilenced(e) {
        const state = rogueEnemySilences.get(e);
        return this.hero.class === 'rogue' && e?.hp > 0 &&
          state?.zone === this.zoneId && state.until > this.s.time;
      }
      applyRogueEnemySilence(e, seconds) {
        const previous = rogueEnemySilences.get(e);
        const remaining = previous?.zone === this.zoneId
          ? Math.max(this.s.time, previous.until) : this.s.time;
        // Silence cannot be 'twice as silent': consecutive legal hush
        // performances append finite disable time without erasing each other.
        rogueEnemySilences.set(e, { zone: this.zoneId, until: remaining + seconds });
      }
      rogueSkill1Config(charged = false) {
        return charged
          ? { range: 290, radius: 290, cap: 4, damage: 1.8, allyDamage: 0.07, seconds: 5 }
          : { range: 225, radius: 225, cap: 2, damage: 1.3, allyDamage: 0.05, seconds: 4 };
      }
      // Starting manual song: small / widened hostile pulse mirrored to
      // living active allies in the same lawful area. Charms never come from
      // manual attacks. The names are revisable independently of these rules.
      castRogueSkill1(targetId = null, charged = false, encountersAtStart = null) {
        const h = this.hero, form = this.rogueSkill1Config(charged),
          rank = h.skills[0], selected = this.selectedHeroTarget(),
          id = targetId ?? selected?.id ?? this.s.heroTarget;
        if (h.class !== 'rogue' || this.peace || h.hp <= 0 || !rank ||
          this.s.challenge.pending || this.s.challenge.gameOver ||
          this.tacticalScatterState(h) || h.deathRollHeld || h.keeperHeld ||
          (charged && this.partyChargeRecovery(h) > 0) ||
          this.mageSilenceActive(h) || !this.skillReady(1, charged)) return false;
        const eligible = this.zone().enemies.filter((e) =>
          e.hp > 0 && !e.neutral && !e.returning &&
          !this.attackResetProtected(e) && this.tacticalDirectTargetable(e) &&
          dist(e, h) <= form.range && this.line(h, e),
        ),
          locked = !!selected || targetId !== null && targetId !== undefined,
          primary = eligible.find((e) => e.id === id) ||
            (locked ? null : eligible.sort((a, b) =>
              dist(a, h) - dist(b, h) || this.idOrder(a, b))[0]);
        if (!primary) return false; // no hostile, no free buff or cooldown
        // Acquisition already checked this same singer-centered radius and
        // line of sight. Recheck only if future rules separate range/radius.
        const enemies = eligible.filter((e) =>
          e === primary || form.radius === form.range ||
          (dist(e, h) <= form.radius && this.line(h, e)),
        ).sort((a, b) => a === primary ? -1 : b === primary ? 1 :
          dist(a, h) - dist(b, h) || this.idOrder(a, b)).slice(0, form.cap);
        const allies = this.activeLivingParty().filter((u) =>
          u.hp > 0 && u.active !== false &&
          dist(u, h) <= form.radius && this.line(h, u));
        this.releaseRecallForCombat();
        this.engage(primary);
        h.cd[0] = this.skillCooldown(1, false);
        if (charged) h.chargedCd[0] = this.skillCooldown(1, true);
        this.s.heroTarget = primary.id;
        const criticalReceipt = this.rogueCriticalRelease(charged ? '1-charged' : '1-tap'),
          amount = this.criticalHeroValue(criticalReceipt,
            (this.power() + 12) * form.damage * (1 + 0.15 * (rank - 1)), 'damage');
        let hits = 0;
        for (const e of enemies) {
          if (this.damage(e, amount, 'hero', {
            area: true, ...(charged && encountersAtStart ? { encountersAtStart } : {}),
          })) hits++;
        }
        // Normal and charged Refrains are independent performances, even
        // for the same actor. Both can combine with critical auto Cadence.
        // Instant songs snapshot legal recipients at cast release.
        for (const u of [h, ...allies])
          this.applyRogueSongBoon(u, 'refrain', {
            seconds: form.seconds, basicDamage: form.allyDamage,
          });
        this.event('rogueBellSkill1', {
          actor: 'hero', class: 'rogue', slot: 1,
          form: charged ? 'charged' : 'tap', audioCue: 'bell-jingle',
          instrument: R.rogueHeroFoundation.weapon.instrument,
          x: h.x, y: h.y, radius: form.radius,
          target: primary.id, hits, allyCount: allies.length,
        });
        return true;
      }

      // Phase 5: mirrored combat-only area songs. A single legal primary
      // anchors the performance; enemies and living allies are resolved in
      // the identical circle without coupling the two outcomes. No Charm.
      castRoguePerformance(slot, targetId = null, charged = false) {
        const h = this.hero, rank = h.skills[slot - 1],
          form = R.roguePerformances[slot]?.[charged ? 'charged' : 'tap'],
          selected = this.selectedHeroTarget(),
          id = targetId ?? selected?.id ?? this.s.heroTarget;
        if (!form || h.class !== 'rogue' || h.hp <= 0 || !rank || this.peace ||
          this.s.challenge.pending || this.s.challenge.gameOver ||
          this.tacticalScatterState(h) || h.deathRollHeld || h.keeperHeld ||
          (charged && this.partyChargeRecovery(h) > 0) ||
          this.mageSilenceActive(h) || !this.skillReady(slot, charged))
          return false;
        const candidates = this.zone().enemies.filter((e) =>
          e.hp > 0 && !e.neutral && !e.returning &&
          !this.attackResetProtected(e) && this.tacticalDirectTargetable(e) &&
          dist(e, h) <= form.range && this.line(h, e));
        const locked = !!selected || targetId !== null && targetId !== undefined,
          primary = candidates.find((e) => e.id === id) ||
            (locked ? null : candidates.sort((a, b) =>
              dist(a, h) - dist(b, h) || this.idOrder(a, b))[0]);
        if (!primary) return false;
        // One terrain sightline per candidate when the performer footprint
        // equals the legal acquisition range (all current song forms).
        const enemies = candidates.filter((e) =>
          e === primary || form.radius === form.range ||
          (dist(e, h) <= form.radius && this.line(h, e)))
          .sort((a, b) => a === primary ? -1 : b === primary ? 1 :
            dist(a, h) - dist(b, h) || this.idOrder(a, b))
          .slice(0, form.cap);
        const allies = this.activeLivingParty().filter((u) =>
          u.hp > 0 && u.active !== false &&
          dist(u, h) <= form.radius && this.line(h, u));
        this.releaseRecallForCombat();
        this.engage(primary);
        h.cd[slot - 1] = this.skillCooldown(slot, false);
        if (charged) h.chargedCd[slot - 1] = this.skillCooldown(slot, true);
        this.s.heroTarget = primary.id;
        // Exactly one frozen Party-stream receipt for this legal manual cast.
        // Only the authored lever changes; allied and hostile sides never
        // roll separately, and timed effects inherit the committed numbers.
        const criticalReceipt = this.rogueCriticalRelease(
          slot + (charged ? '-charged' : '-tap'));
        let effectForm = form;
        if (criticalReceipt?.critical) {
          const field = ({
            2: charged ? 'seconds' : 'slow',
            3: charged ? 'silence' : 'debt',
            4: 'healFraction',
            5: charged ? 'ward' : 'slow',
            6: charged ? 'seconds' : 'debt',
            7: charged ? 'weaken' : 'push',
            8: charged ? 'silence' : 'damage',
          })[slot];
          if (!field || !Object.prototype.hasOwnProperty.call(form, field))
            throw Error('Missing authored Rogue critical consequence');
          effectForm = {
            ...form,
            [field]: this.criticalHeroValue(
              criticalReceipt, form[field], criticalReceipt.effect.lever,
              field === 'ward' ? { max: 0.12 } : {}),
            ...(slot === 4 ? { criticalMending: true } : {}),
          };
        }
        if (slot === 5) {
          const current = (rogueMusicStations.get(this) || []).filter((f) =>
            f.zone === this.zoneId && f.until > this.s.time);
          current.push({
            zone: this.zoneId, x: h.x, y: h.y,
            radius: effectForm.radius, cap: effectForm.cap, slow: effectForm.slow,
            resistance: effectForm.slowResistance, ward: effectForm.ward,
            pulseDamage: effectForm.pulseDamage, until: this.s.time + effectForm.seconds,
            nextPulse: this.s.time,
          });
          rogueMusicStations.set(this, current.slice(-2));
        }
        for (const e of enemies) {
          if (slot === 2) this.applySlow(e, effectForm.slow);
          if (slot === 5) {
            // Station pulses are scheduled from its single placement owner;
            // never duplicate a pulse as a separate instant AoE result.
          }
          if (slot === 8) {
            const scale = 1 + 0.15 * (rank - 1);
            this.damage(e, (this.power() + 12) * effectForm.damage * scale, 'hero',
              { area: true });
            if (effectForm.silence && e.hp > 0 && e.type !== 'boss' &&
                !e.captain && !e.roomCaptain && !(e.immune > 0)) {
              this.applyRogueEnemySilence(e, effectForm.silence);
            }
          }
          if (slot === 4) {
            const prev = rogueEnemyWithers.get(e);
            const effects = prev?.zone === this.zoneId
              ? prev.effects.filter((v) => v.until > this.s.time) : [];
            effects.push({
              until: this.s.time + effectForm.seconds,
              remaining: Math.min(80, Math.max(3, e.maxHp * effectForm.dotFraction)),
              antiHeal: effectForm.antiHeal,
            });
            rogueEnemyWithers.set(e, { zone: this.zoneId, effects });
          }
          if (slot === 3) {
            // Interrupt only an actual native warning/aim, never invent a cast.
            const warning = e.telegraph || e.rangedAim;
            if (warning && this.interruptEnemyAction(e, warning)) {
              e.cd = Math.max(e.cd || 0, effectForm.debt);
              e.specialCd = Math.max(e.specialCd || 0, effectForm.debt);
            }
            // Hush blocks new eligible non-boss specials only; it never
            // erases protected boss phases or ordinary basic attacks.
            if (effectForm.silence && e.hp > 0 && e.type !== 'boss' &&
                !e.captain && !e.roomCaptain && !(e.immune > 0)) {
              this.applyRogueEnemySilence(e, effectForm.silence);
            }
          }
          if (slot === 7) {
            // Existing collision/legal-arena push; already executing a
            // scripted charge is never overridden.
            if (e.hp > 0) this.shieldPush(e, effectForm.push);
            const earlier = rogueEnemyWeakens.get(e);
            const effects = earlier?.zone === this.zoneId
              ? earlier.effects.filter((effect) => effect.until > this.s.time) : [];
            effects.push({
              until: this.s.time + effectForm.weaken,
              fraction: effectForm.weakenFraction,
            });
            rogueEnemyWeakens.set(e, { zone: this.zoneId, effects });
            // Keep the existing public/UI duration fields as a snapshot;
            // real combat reads the independently expiring entries.
            e.weakenUntil = Math.max(...effects.map((v) => v.until));
            e.weakenFraction = effects.reduce((sum, v) => sum + v.fraction, 0);
          }
          if (slot === 6) {
            // Only real, not-ready enemy cooldowns receive finite debt. No
            // fabricated timers or globally delayed boss phase transitions.
            for (const key of ['cd', 'specialCd', 'summonCd',
              'healCd', 'supportHealCd']) {
              if (Number.isFinite(e[key]) && e[key] > 0)
                e[key] = Math.min(1e6, e[key] + effectForm.debt);
            }
          }
        }
        const recipients = slot === 5 ? [] : [
          ...allies,
          h,
        ];
        for (const u of recipients)
          this.applyRogueSongBoon(u,
            slot === 2 ? 'quickstep' : slot === 3 ? 'steadyBeat' : slot === 4 ? 'mending' : slot === 7 ? 'firmFooting' : slot === 8 ? 'finale' : 'borrowedTime', effectForm);
        this.event('rogueBellPerformance', {
          actor: 'hero', class: 'rogue', slot,
          form: charged ? 'charged' : 'tap',
          audioCue: 'bell-jingle',
          instrument: R.rogueHeroFoundation.weapon.instrument,
          x: h.x, y: h.y, radius: form.radius,
          target: primary.id, enemies: enemies.length, allies: allies.length,
        });
        return true;
      }

      // The exact individual monster subtype is an authored species plus its
      // native melee/ranged variant. Player names and translations cannot own it.
      rogueCharmProfile(e) {
        // Wild Wraiths and Stalkers may be captured ONLY during their lawful
        // night encounter. A captured ally is a party member, not a night
        // spawn, and remains usable after sunrise.
        const nightSpecies = !!e?.nightOnly && this.night() &&
          (e.species === 'wraith' || e.species === 'stalker');
        if (
          this.hero.class !== 'rogue' ||
          !e || e.type !== 'mob' || e.form !== 'normal' || e.hp <= 0 ||
          e.neutral || e.returning || e.guard || e.roomGuard ||
          e.awakenedGuard || e.captain || e.roomCaptain || e.fieldCaptain ||
          e.summon || e.owner || e.reinforcement || (e.nightOnly && !nightSpecies) ||
          e.crownTroop || e.mountedCrownRider || e.veraEscort || e.family ||
          this.s.mode === 'arena' || this.s.mode === 'developer'
        ) return null;
        const authored = Campaign.data.species.flat().find((row) => row[0] === e.species) ||
          (nightSpecies ? [e.species, e.species === 'wraith' ? 'Lantern wraith' : 'Ash stalker'] : null);
        if (!authored) return null;
        const ranged = nightSpecies ? e.species === 'wraith' : e.ranged === true;
        // A runtime flag alone cannot invent an authored monster subtype.
        if (ranged && !R.rangedProfiles[e.species] &&
          !['archer', 'crownguard', ...(nightSpecies ? ['wraith'] : [])].includes(e.species)) return null;
        const role = ranged ? 'archer' : 'soldier',
          variant = ranged ? R.rangedProfiles[e.species]?.variant : null;
        return {
          typeId: 'enemy:' + e.species + ':' + (ranged ? 'ranged' : 'melee'),
          species: e.species,
          role,
          typeName: authored[1] + (variant ? ' ' + variant : ''),
          sourceEnemyId: e.id,
          sourceZone: this.zoneId,
        };
      }
      rogueCharmAttempt(primary, beforeHp, attackZone) {
        if (
          this.hero.class !== 'rogue' || this.hero.hp <= 0 || this.peace ||
          this.s.challenge.pending || this.s.challenge.gameOver ||
          this.zoneId !== attackZone || !primary ||
          !(beforeHp > primary.hp) || primary.hp <= 0 ||
          this.attackResetProtected(primary) || !this.tacticalDirectTargetable(primary)
        ) return false;
        const zone = this.zone(),
          index = zone.enemies.findIndex((e) => e === primary),
          profile = this.rogueCharmProfile(primary);
        if (
          index < 0 || !profile || this.s.party.length >= 200 ||
          this.s.party.some((u) => u.charmOrigin?.sourceEnemyId === primary.id) ||
          Object.values(this.s.charmCaptures || {}).some(
            (entry) => entry.sourceEnemyId === primary.id,
          ) ||
          Object.values(this.s.pending).some((p) => p.base?.id === primary.id) ||
          new Set(this.s.party.filter(
            (u) => u.charmOrigin?.typeId === profile.typeId,
          ).map((u) => u.id)).size >= this.expeditionPartyCap()
        ) return false;
        // A saved, independent stream: invalid attempts draw nothing, and Charm
        // never disturbs the existing combat/World/Party critical RNG streams.
        const state = Number.isInteger(this.s.rogueCharmRng)
          ? this.s.rogueCharmRng
          : (Math.imul(this.s.nextId, 747796405) + 2891336453) >>> 0;
        const next = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        this.s.rogueCharmRng = next;
        // Owner-approved fixed 12% per eligible, surviving primary hit.
        if (next / 4294967296 >= 0.12) return false;
        const u = this.unit(profile.role, primary.x, primary.y);
        // Every legitimate Charm is a fully healed, immediately named ally.
        // Naming is automatic in both active-group and reserve admissions.
        u.hp = u.maxHp;
        u.icon = primary.icon;
        u.name = profile.typeName;
        u.customName = this.nextRogueCharmNickname();
        u.charmOrigin = { ...profile };
        u.charmSupportCd = 0;
        const friendly = this.charmedCompanionProfile(u);
        u.damage = friendly.damage;
        u.maxHp = this.companionMaxHp(u);
        u.hp = u.maxHp;
        u.active = this.activeParty().length < this.expeditionPartyCap();
        // No kill() call: no XP, loot, quests, streaks or death rewards.
        // Retire every active target pointer/order before detaching the foe.
        // The existing dust-cover helper already centralizes this cleanup.
        this.tacticalDropDustTarget(primary);
        this.cancelEncounter(primary);
        this.clearEnemyUnderFire(primary);
        this.tacticalClearThreat(primary);
        this.tacticalClearBurst(primary);
        this.tacticalClearRogueRegroup(primary);
        this.s.projectiles = this.s.projectiles.filter(
          (p) => p.source !== primary.id && p.target !== primary.id && p.owner !== primary.id,
        );
        this.s.hazards = this.s.hazards.filter(
          (h) => h.source !== primary.id && h.owner !== primary.id,
        );
        zone.enemies.splice(index, 1);
        this.s.party.push(u);
        this.s.charmCaptures ??= {};
        this.s.charmCaptures[u.id] = { ...profile };
        if (this.s.heroTarget === primary.id) this.s.heroTarget = null;
        this.resetBasicCombo();
        this.event('rogueCharm', {
          actor: 'hero', companionId: u.id, sourceEnemyId: primary.id,
          typeId: profile.typeId, active: u.active, x: u.x, y: u.y,
        });
        this.say(u.customName + ' (' + profile.typeName + ') Charmed. ' +
          (u.active ? 'Joined the group.' : 'Group full; resting in reserve.'));
        return true;
      }
      // Rogue automatic basic: only the surviving primary may try Charm.
      castRogueBasic(targetId = null) {
        const cfg = R.rogueHeroFoundation.basic;
        if (
          this.hero.class !== 'rogue' || this.s.mode === 'developer' ||
          this.peace || this.hero.hp <= 0 || !this.hero.skills[0] ||
          (this.hero.basicCd || 0) > 0 ||
          this.s.challenge.pending || this.s.challenge.gameOver ||
          this.tacticalScatterState(this.hero) ||
          this.hero.deathRollHeld || this.hero.keeperHeld ||
          this.hero.order?.type === 'skill-approach'
        ) return false;
        const selected = this.selectedHeroTarget(),
          preferred = targetId ?? selected?.id ?? this.basicComboTargetId ?? this.s.heroTarget,
          eligible = this.zone().enemies.filter((e) =>
            e.hp > 0 && !e.neutral && !e.returning &&
            !this.awaitsHeroAttack(e) && !this.attackResetProtected(e) &&
            this.tacticalDirectTargetable(e) &&
            dist(e, this.hero) <= cfg.range && this.line(this.hero, e),
          ),
          locked = !!selected || (targetId !== null && targetId !== undefined),
          primary = eligible.find((e) => e.id === preferred) ||
            (locked ? null : eligible.sort((a, b) =>
              dist(a, this.hero) - dist(b, this.hero) || this.idOrder(a, b))[0]);
        if (!primary) return false;
        this.releaseRecallForCombat();
        this.engage(primary);
        const combo = this.nextBasicCombo(primary.id),
          rank = this.hero.skills[0],
          baseDamage = (this.power() + 12) * cfg.primaryMultiplier *
            (1 + 0.15 * (rank - 1)) * combo.multiplier *
            (1 + (this.rogueSongBoon(this.hero, 'refrain')?.basicDamage || 0) +
              (this.rogueSongBoon(this.hero, 'cadence')?.basicDamage || 0));
        this.hero.basicCd = this.basicSkillCooldown();
        const criticalReceipt = this.rogueCriticalRelease('auto'),
          enhancedBasic = this.criticalHeroValue(criticalReceipt, baseDamage, 'damage');
        const beforePrimaryHp = primary.hp,
          attackZone = this.zoneId,
          landed = this.damage(primary, enhancedBasic, 'hero', { automaticBasic: true });
        let splashHits = 0;
        if (landed) {
          const max = combo.step === 3 ? cfg.finisherSecondaryCap : cfg.secondaryCap,
            radius = combo.step === 3 ? cfg.finisherSplashRadius : cfg.splashRadius;
          const secondary = this.zone().enemies.filter((e) =>
            e !== primary && e.hp > 0 && !e.neutral && !e.returning &&
            !this.awaitsHeroAttack(e) && !this.attackResetProtected(e) &&
            this.tacticalDirectTargetable(e) &&
            dist(e, this.hero) <= radius && this.line(this.hero, e),
          ).sort((a, b) => dist(a, this.hero) - dist(b, this.hero) || this.idOrder(a, b));
          for (const e of secondary.slice(0, max))
            if (this.damage(e, enhancedBasic * cfg.splashMultiplier, 'hero', { area: true, automaticBasic: true }))
              splashHits++;
        }
        // Critical bell strikes briefly inspire the singer and companions in
        // the same physical circle. Only real landed criticals grant a boon;
        // no extra critical/Charm roll, long aura, or added attack damage.
        if (landed && criticalReceipt?.critical) {
          const radius = combo.step === 3 ? cfg.finisherSplashRadius : cfg.splashRadius;
          this.applyRogueSongBoon(this.hero, 'cadence', cfg.criticalCadence);
          for (const ally of this.activeLivingParty()) {
            if (dist(ally, this.hero) <= radius && this.line(this.hero, ally))
              this.applyRogueSongBoon(ally, 'cadence', cfg.criticalCadence);
          }
        }
        // Newly Charmed enemies cannot retroactively receive a cast-time boon.
        if (landed) this.rogueCharmAttempt(primary, beforePrimaryHp, attackZone);
        // Bell-jingle sound intent remains distinct from actual audio playback.
        this.event('rogueBellBasic', {
          actor: 'hero', class: 'rogue', slot: 1, automaticBasic: true,
          instrument: R.rogueHeroFoundation.weapon.instrument,
          audioCue: R.rogueHeroFoundation.weapon.basicCue,
          x: this.hero.x, y: this.hero.y,
          target: primary.id, targetX: primary.x, targetY: primary.y,
          combo: combo.step, landed: !!landed, splashHits,
          radius: combo.step === 3 ? cfg.finisherSplashRadius : cfg.splashRadius,
        });
        return true;
      }
      castMovementBasic() {
        // A released skill owns its approach. Passive covering fire must not
        // replace the queued charged/ordinary command with Skill 1.
        if (this.hero.order?.type === 'skill-approach') return false;
        return this.cast(1, null, false, null, true);
      }
      cast(slot, targetId, charged = false, encountersAtStart = null, automatic = false) {
        // The unlocked Rogue songs are staged under the same unregistered
        // class gate. Later performance families remain unavailable.
        if (this.hero.class === 'rogue') {
          if (slot === 1)
            return automatic && !charged ? this.castRogueBasic(targetId)
              : !automatic ? this.castRogueSkill1(targetId, !!charged, encountersAtStart)
              : false;
          return !automatic ? this.castRoguePerformance(slot, targetId, !!charged) : false;
        }
        if (!implementedHeroCombatClasses.has(this.hero.class)) return false;
        if (this.s.mode === 'developer' && slot === 1 && automatic) return false;
        const i = slot - 1,
          rank = this.hero.skills[i],
          isCharged = !!charged && slot >= 1 && slot <= 8;
        if (
          this.s.challenge.pending ||
          this.s.challenge.gameOver ||
          this.tacticalScatterState(this.hero) ||
          this.hero.deathRollHeld ||
          this.hero.keeperHeld
        )
          return false;
        // A second tap lowers the shield immediately. The cooldown starts
        // only when the stance ends, not when it begins.
        if (
          slot === 3 &&
          this.hero.class === 'paladin' &&
          !isCharged &&
          (this.hero.shieldStance || 0) > 0
        ) {
          this.hero.shieldStance = 0;
          this.hero.shieldRank = 0;
          this.hero.cd[2] = this.skillCooldown(3);
          this.event('spell', {
            actor: 'hero',
            class: 'paladin',
            slot: 3,
            effect: 'shield-lowered',
            x: this.hero.x,
            y: this.hero.y,
          });
          return true;
        }
        if (
          !rank ||
          (automatic && slot === 1
            ? (this.hero.basicCd || 0) > 0
            : !this.skillReady(slot, isCharged)) ||
          this.peace
        ) {
          if (!rank) this.say('This skill must be learned from a rescued instructor.');
          return false;
        }
        if (isCharged && this.partyChargeRecovery(this.hero) > 0) return false;
        if (this.mageSilenceActive(this.hero) && !automatic) return false;
        if (
          this.hero.class === 'paladin' &&
          (this.hero.shieldStance || 0) > 0 &&
          (slot === 1 || (slot === 3 && isCharged))
        )
          return false;
        const scale = 1 + 0.15 * (rank - 1),
          steps = this.tacticMilestones(rank),
          chargedSecond =
            isCharged && slot === 2 ? R.chargedSkills.second?.[this.hero.class] : null,
          range = this.heroSkillRange(slot, isCharged),
          selected = this.selectedHeroTarget(),
          targets = this.zone().enemies.filter(
            (e) =>
              e.hp > 0 &&
              !e.neutral &&
              (!automatic || !this.awaitsHeroAttack(e)) &&
              !this.attackResetProtected(e) &&
              this.tacticalDirectTargetable(e) &&
              dist(e, this.hero) <= range &&
              this.line(this.hero, e),
          ),
          preferredTargetId =
            targetId ??
            selected?.id ??
            (slot === 1 ? (this.basicComboTargetId ?? this.s.heroTarget) : null),
          requiresTarget =
            [1, 2, 6, 7].includes(slot) ||
            (slot === 8 && this.hero.class !== 'paladin') ||
            (slot === 4 && this.hero.class !== 'ranger'),
          // Preserve a valid distant selection, while a target made ineligible
          // by Blinding Dust still permits the established automatic fallback.
          lockedOut =
            requiresTarget &&
            (!!selected ||
              this.zone().enemies.some(
                (e) =>
                  e.id === targetId &&
                  e.hp > 0 &&
                  !e.neutral &&
                  !this.attackResetProtected(e) &&
                  this.tacticalDirectTargetable(e),
              )),
          target =
            targets.find((e) => e.id === preferredTargetId) ||
            (lockedOut
              ? null
              : targets.find((e) => slot === 1 && e.id === this.s.heroTarget) ||
                targets.sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0]);
        if (requiresTarget && !target) {
          // Covering fire during movement never authorizes pursuit, even when
          // an old selected/combo target remains valid beyond attack range.
          if (automatic) return false;
          // A manually targeted out-of-range skill cannot hijack an explicitly
          // selected map journey. No chase, mana use or cooldown; keep walking.
          // Outside navigation the original deliberate skill approach applies.
          if (this.hero.order?.type === 'move' && this.hero.order.navigation === true) return false;
          // A deliberate targeted skill is an approach-and-release order.
          // Never consume mana or cooldown merely because the selected enemy
          // is beyond reach; targeting itself still does not move the hero.
          const wanted = this.zone().enemies.find(
            (e) =>
              e.id === preferredTargetId &&
              e.hp > 0 &&
              !e.neutral &&
              !this.attackResetProtected(e) &&
              this.tacticalDirectTargetable(e),
          );
          if (
            wanted &&
            this.hero.mp >= this.skillManaCost(slot, rank, isCharged) &&
            this.route(this.hero, wanted).length
          ) {
            this.hero.order = {
              type: 'skill-approach',
              id: wanted.id,
              zone: this.zoneId,
              slot,
              charged: isCharged,
              encountersAtStart,
              stalled: 0,
            };
            return true;
          }
          return false;
        }
        // A rushing melee strike must be able to reach the foe without crossing terrain.
        const dashFrom =
          slot === 6 && this.hero.class === 'paladin' && dist(this.hero, target) > 120
            ? { x: this.hero.x, y: this.hero.y }
            : null;
        const dashTo = dashFrom
          ? {
              x: target.x - ((target.x - dashFrom.x) / dist(dashFrom, target)) * 100,
              y: target.y - ((target.y - dashFrom.y) / dist(dashFrom, target)) * 100,
            }
          : null;
        if (dashTo && !this.clearSegment(this.hero, dashTo)) return false;
        if (slot === 3 && this.hero.class === 'ranger') {
          const living = [this.hero, ...this.activeLivingParty()].filter((u) => u.hp > 0);
          if (isCharged) {
            if (living.every((u) => u.hp >= u.maxHp)) return false;
          } else if (this.hero.hp >= this.hero.maxHp) return false;
        }
        if (
          slot === 3 &&
          this.hero.class === 'mage' &&
          !isCharged &&
          !this.tacticalSkillTarget(
            R.heroTactics.mage.interrupt.range + steps * R.heroTactics.mage.interrupt.rangeStep,
            true,
          )
        )
          return false;
        // A companion-only rally needs an eligible recipient. Unlike tap
        // Haste, charged Ranger Skill 4 should never waste 20s in solo play.
        if (slot === 4 && this.hero.class === 'ranger' && isCharged) {
          const radius =
            R.heroTactics.ranger.rally.radius + steps * R.heroTactics.ranger.rally.radiusStep;
          if (
            !this.activeLivingParty().some(
              (ally) => dist(ally, this.hero) <= radius && this.line(this.hero, ally),
            )
          )
            return false;
        }
        const cost = this.skillManaCost(slot, rank, isCharged);
        if (this.hero.mp < cost) return false;
        this.hero.mp -= cost;
        // The hero may defend the retreat without cancelling an unfinished
        // Recall. Deliberate offense releases the defensive hold after arrival.
        const offensive =
          (requiresTarget && !!target) ||
          slot === 5 ||
          (slot === 8 && this.hero.class === 'paladin') ||
          (slot === 3 &&
            (this.hero.class === 'mage' || (this.hero.class === 'paladin' && isCharged)));
        // Passive covering fire is not a new squad engagement order.
        if (offensive && !automatic) this.releaseRecallForCombat();
        if (automatic && slot === 1) {
          this.hero.basicCd = this.basicSkillCooldown();
        } else if (slot === 3 && this.hero.class === 'paladin' && !isCharged) {
          this.hero.cd[i] = 0; // Shield Stance begins recovery when lowered.
        } else {
          // Charged starts both recoveries. Tap changes only normal readiness.
          this.hero.cd[i] = this.skillCooldown(slot, false);
          if (isCharged) this.hero.chargedCd[i] = this.skillCooldown(slot, true);
        }
        if (target && requiresTarget) this.s.heroTarget = selected?.id || target.id;
        if (dashTo) this.move(this.hero, dashTo, dist(this.hero, dashTo) + 1, 1);
        const power = this.power();
        // Native Stage 2 hook: only Skill 1 is wired at this checkpoint.
        // No hook exists in production until an explicit, tested session is
        // attached; queued/cancelled attempts return before this commitment.
        const criticalReceipt =
          slot >= 1 && slot <= 8 && this._criticalPartyNative
            ? this._criticalPartyNative.release(
                this,
                'hero/' + this.hero.class + '/' +
                  (automatic ? 'auto' : slot + (isCharged ? '-charged' : '-tap')),
                'hero',
              )
            : null;
        // Observation only: presentation never authorizes a cast or changes its resolver.
        this.event('heroSkillCast', {
          actor: 'hero',
          class: this.hero.class,
          slot,
          charged: isCharged,
          automaticBasic: automatic && slot === 1,
          x: this.hero.x,
          y: this.hero.y,
          fromX: dashFrom?.x ?? this.hero.x,
          fromY: dashFrom?.y ?? this.hero.y,
          target: target?.id,
          targetX: target?.x,
          targetY: target?.y,
          rank,
        });
        if (!isCharged && slot === 8) return this.castHeroUltimate(target, scale, steps, power, false, null, criticalReceipt);
        if (!isCharged && slot === 7 && this.hero.class === 'mage')
          return this.castMageChain(target, scale, steps, power, false, null, criticalReceipt);
        if (isCharged && slot >= 5 && slot <= 8)
          return this.castChargedAdvanced(
            slot,
            target,
            rank,
            scale,
            steps,
            power,
            encountersAtStart,
            criticalReceipt,
          );
        if (!isCharged && slot === 1 && !automatic) {
          const d = Math.max(1, dist(this.hero, target)),
            tapDamage = (power + 12) * scale * R.chargedSkills.basicDamageMultiplier,
            damage = criticalReceipt?.critical
              ? this._criticalPartyNative.enhance(criticalReceipt, tapDamage, 'damage')
              : tapDamage,
            dx = (target.x - this.hero.x) / d,
            dy = (target.y - this.hero.y) / d;
          this.engage(target);
          if (this.hero.class === 'mage') {
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: this.hero.x,
              y: this.hero.y,
              originX: this.hero.x,
              originY: this.hero.y,
              dx,
              dy,
              target: target.id,
              damage,
              source: 'hero',
              // Constant travel speed: a distant enemy never makes this projectile faster.
              speed: 1.32 * (280 / 0.75),
              launchHeading: Math.atan2(dy, dx),
              life: 1.5,
              travelBudget: 540,
              traveled: 0,
              mageSkill1Homing: true,
              beamWidthScale: 2,
              trailPoints: [{ x: this.hero.x, y: this.hero.y }],
              delay: 0,
              style: 'beam',
              slot,
              charged: false,
              ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              ...(encountersAtStart ? { encountersAtStart } : {}),
            });
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'mage',
              source: 'hero',
              style: 'magic',
              slot,
              charged: false,
              beam: true,
              x: this.hero.x,
              y: this.hero.y,
              target: target.id,
            });
          } else if (this.hero.class === 'ranger') {
            for (let j = 0; j < 3; j++)
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: this.hero.x,
                y: this.hero.y,
                dx,
                dy,
                target: target.id,
                damage: damage / 3,
                source: 'hero',
                speed: 620,
                delay: j * 0.08,
                ...(j > 0 ? { rangerDelayedLaunch: true } : {}),
                style: 'arrow',
                slot,
                charged: false,
                ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              ...(encountersAtStart ? { encountersAtStart } : {}),
                rapid: true,
                chargedBurst: false,
              });
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'ranger',
              source: 'hero',
              style: 'arrow',
              slot,
              charged: false,
              count: 3, // Legacy three-shot sound/presentation identity.
              releasedCount: 1,
              pendingCount: 2,
              rapid: true,
              x: this.hero.x,
              y: this.hero.y,
              target: target.id,
            });
          } else {
            this.s.projectiles.push({
              id: 'projectile-' + this.s.nextId++,
              x: this.hero.x,
              y: this.hero.y,
              dx,
              dy,
              target: target.id,
              damage,
              source: 'hero',
              speed: 550,
              delay: 0,
              style: 'holy',
              slot,
              charged: false,
              ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              ...(encountersAtStart ? { encountersAtStart } : {}),
            });
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'paladin',
              source: 'hero',
              style: 'holy',
              slot,
              charged: false,
              x: this.hero.x,
              y: this.hero.y,
              target: target.id,
            });
          }
          this.event('skill1Tap', {
            slot,
            class: this.hero.class,
            actor: 'hero',
            source: 'hero',
            x: this.hero.x,
            y: this.hero.y,
            targetX: target.x,
            targetY: target.y,
            targetId: target.id,
          });
          return true;
        }
        if (isCharged && slot === 1) {
          const from = { x: this.hero.x, y: this.hero.y },
            angle = Math.atan2(target.y - from.y, target.x - from.x),
            cfg = R.chargedSkills.first,
            snapshot = {
              class: this.hero.class,
              zone: this.zoneId,
              deaths: this.s.statistics.deaths,
              from,
              angle,
              targetId: target.id,
              damage: criticalReceipt?.critical
                ? this._criticalPartyNative.enhance(
                    criticalReceipt, (power + 12) * scale, 'damage',
                  )
                : (power + 12) * scale,
              ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              encountersAtStart,
            };
          this.engage(target);
          if (this.hero.class === 'paladin') {
            const cross = {
              ...snapshot,
              kind: 'cross',
              rank,
              reach: cfg.paladin.reach + steps * cfg.paladin.reachStep,
              halfWidth: cfg.paladin.halfWidth + steps * cfg.paladin.halfWidthStep,
              admitted: [],
              remaining: 1,
              due: this.s.time + cfg.paladin.pulseGap,
            };
            this.resolveHeroCrossPulse(cross, 0);
            (this._heroSkillEffects ||= []).push(cross);
          } else if (this.hero.class === 'mage') {
            this.resolveWideArcaneBeam({
              ...snapshot,
              rank,
              reach: cfg.mage.reach + steps * cfg.mage.reachStep,
              halfWidth: cfg.mage.halfWidth + steps * cfg.mage.halfWidthStep,
            });
          } else {
            (this._heroSkillEffects ||= []).push({
              ...snapshot,
              kind: 'hawk',
              x: from.x,
              y: from.y,
              elapsed: 0,
              traveled: 0,
              rank,
              budget: cfg.ranger.pathBudget + steps * cfg.ranger.pathStep,
            });
            this.event('heroHawk', {
              actor: 'hero',
              class: 'ranger',
              slot: 1,
              phase: 'launch',
              x: from.x,
              y: from.y,
              targetId: target.id,
            });
          }
          return true;
        }
        if (isCharged && slot === 2) {
          const base = chargedSecond || R.chargedSkills.second[this.hero.class],
            def = {
              ...base,
              range: base.range ? base.range + steps * 5 : 0,
              radius: base.radius ? base.radius + steps * 5 : 0,
              halfWidth: base.halfWidth ? base.halfWidth + steps * 2 : 0,
              slow: base.slow ? base.slow + steps * 0.25 : 0,
            },
            damage = power * (this.hero.class === 'ranger' ? 2.4 : 2.2) * scale,
            angle = Math.atan2(target.y - this.hero.y, target.x - this.hero.x),
            from = { x: this.hero.x, y: this.hero.y },
            end = {
              x: this.hero.x + Math.cos(angle) * (def.range || dist(this.hero, target)),
              y: this.hero.y + Math.sin(angle) * (def.range || dist(this.hero, target)),
            },
            angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)),
            inside = (e) =>
              def.shape === 'circle'
                ? dist(e, target) <= def.radius
                : def.shape === 'cone'
                  ? dist(e, this.hero) <= def.range &&
                    Math.abs(angleDelta(Math.atan2(e.y - this.hero.y, e.x - this.hero.x), angle)) <=
                      def.halfAngle
                  : def.shape === 'line'
                    ? this.distanceToSegment(e, from, end) <= def.halfWidth
                    : false;
          this.engage(target);
          if (this.hero.class === 'ranger') {
            // #464 physical Pinning Volley: preserve selection, original arrow
            // count and wall/contact checks. No critical status before impact.
            const foes = this.zone()
              .enemies.filter((e) => e.hp > 0 && !e.neutral && inside(e) && this.line(this.hero, e))
              .sort((a, b) => this.idOrder(a, b));
            for (const foe of foes) {
              const distance = Math.max(1, dist(from, foe));
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: from.x,
                y: from.y,
                dx: (foe.x - from.x) / distance,
                dy: (foe.y - from.y) / distance,
                target: foe.id,
                damage,
                source: 'hero',
                speed: 650,
                style: 'arrow',
                slot: 2,
                charged: true,
                area: true,
                slow: def.slow || 0,
                rangerVolleySlow: this.criticalHeroValue(
                  criticalReceipt,
                  R.heroTactics.ranger.volley.slow +
                    steps * R.heroTactics.ranger.volley.slowStep,
                  'slowDuration',
                ),
                ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
                ...(encountersAtStart ? { encountersAtStart } : {}),
              });
            }
            this.event('chargedArea', {
              slot, class: 'ranger', actor: 'hero', source: 'hero',
              effect: def.effect, shape: 'line', projectileVolley: true,
              x: from.x, y: from.y, fromX: from.x, fromY: from.y,
              angle, range: def.range || 0, halfWidth: def.halfWidth || 0,
              hits: 0, arrows: foes.length,
            });
            return true;
          }
          let hits = 0;
          for (const e of this.zone()
            .enemies.filter((e) => e.hp > 0 && !e.neutral && inside(e) && this.line(this.hero, e))
            .sort((a, b) => this.idOrder(a, b))) {
            if (this.damage(e, damage, 'hero', { area: true, encountersAtStart })) {
              hits++;
              if (def.slow)
                this.applySlow(e, this.criticalHeroValue(
                  this.hero.class === 'mage' ? criticalReceipt : null,
                  def.slow, 'slowDuration',
                ));
              if (this.hero.class === 'paladin') this.weakenEnemy(e, rank, criticalReceipt);
              if (this.hero.class === 'ranger')
                this.applySlow(
                  e,
                  this.criticalHeroValue(
                    criticalReceipt,
                    R.heroTactics.ranger.volley.slow + steps * R.heroTactics.ranger.volley.slowStep,
                    'slowDuration',
                  ),
                );
            }
          }
          this.event(this.hero.class === 'paladin' ? 'melee' : 'spell', {
            actor: 'hero',
            class: this.hero.class,
            source: 'hero',
            slot,
            charged: true,
            weapon: this.hero.class === 'paladin' ? 'sword' : undefined,
            x: target.x,
            y: target.y,
            target: target.id,
          });
          this.event('chargedArea', {
            slot,
            class: this.hero.class,
            actor: 'hero',
            source: 'hero',
            targetId: target.id,
            effect: def.effect,
            shape: def.shape,
            x: target.x,
            y: target.y,
            fromX: this.hero.x,
            fromY: this.hero.y,
            angle,
            radius: def.radius || 0,
            range: def.range || 0,
            halfAngle: def.halfAngle || 0,
            halfWidth: def.halfWidth || 0,
            hits,
          });
          return true;
        }
        if (slot === 3) {
          if (this.hero.class === 'paladin') {
            const cfg = R.heroTactics.paladin;
            if (isCharged) {
              const facing =
                  target || this.tacticalSkillTarget(cfg.bash.reach + steps * cfg.bash.reachStep),
                angle = facing
                  ? Math.atan2(facing.y - this.hero.y, facing.x - this.hero.x)
                  : Math.atan2(this.formationHeading?.y || 1, this.formationHeading?.x || 0),
                reach = cfg.bash.reach + steps * cfg.bash.reachStep,
                push = this.criticalHeroValue(
                  criticalReceipt, cfg.bash.push + steps * cfg.bash.pushStep, 'pushDistance',
                ),
                delta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
              let hits = 0;
              for (const enemy of this.zone()
                .enemies.filter(
                  (e) =>
                    e.hp > 0 &&
                    !e.neutral &&
                    !this.attackResetProtected(e) &&
                    dist(e, this.hero) <= reach &&
                    Math.abs(delta(Math.atan2(e.y - this.hero.y, e.x - this.hero.x), angle)) <=
                      cfg.bash.halfAngle &&
                    this.line(this.hero, e),
                )
                .sort((a, b) => this.idOrder(a, b))) {
                const elite = enemy.type === 'boss' || enemy.captain || enemy.roomCaptain;
                if (
                  this.damage(
                    enemy,
                    power * cfg.bash.damage * scale * (elite ? cfg.bash.eliteDamage : 1),
                    'hero',
                    { area: true, encountersAtStart },
                  )
                ) {
                  if (enemy.hp > 0) this.shieldPush(enemy, push);
                  hits++;
                }
              }
              this.event('chargedArea', {
                actor: 'hero',
                class: 'paladin',
                slot: 3,
                effect: 'shield-bash',
                shape: 'cone',
                x: this.hero.x,
                y: this.hero.y,
                fromX: this.hero.x,
                fromY: this.hero.y,
                angle,
                range: reach,
                halfAngle: cfg.bash.halfAngle,
                hits,
              });
            } else {
              this.hero.shieldStance = this.criticalHeroValue(
                criticalReceipt, cfg.shield.duration, 'wardDuration',
              );
              this.hero.shieldRank = rank;
              this.resetBasicCombo();
              this.event('spell', {
                actor: 'hero',
                class: 'paladin',
                slot: 3,
                effect: 'shield-raised',
                x: this.hero.x,
                y: this.hero.y,
              });
            }
          } else if (this.hero.class === 'mage') {
            if (isCharged) {
              const cfg = R.heroTactics.mage.silence;
              this.hero.silenceField = {
                x: this.hero.x,
                y: this.hero.y,
                zone: this.zoneId,
                radius: cfg.radius + steps * cfg.radiusStep,
                until: this.s.time + this.criticalHeroValue(
                  criticalReceipt, cfg.duration + steps * cfg.durationStep, 'silenceDuration',
                ),
              };
              this.event('chargedArea', {
                actor: 'hero',
                class: 'mage',
                slot: 3,
                effect: 'silence-field',
                shape: 'circle',
                x: this.hero.x,
                y: this.hero.y,
                fromX: this.hero.x,
                fromY: this.hero.y,
                radius: this.hero.silenceField.radius,
                hits: this.zone().enemies.filter((e) => e.hp > 0 && this.mageSilenceActive(e))
                  .length,
              });
            } else {
              const cfg = R.heroTactics.mage.interrupt,
                enemy = this.tacticalSkillTarget(cfg.range + steps * cfg.rangeStep, true);
              if (!enemy) return false;
              this.launchTargetedHeroSkill(enemy, 3, 0, 'magic', {
                effect: 'interrupt',
                interruptAction: enemy.telegraph || enemy.rangedAim,
                ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              });
            }
          } else {
            const amount = this.criticalHeroValue(
              criticalReceipt, (45 + power * 0.5) * scale, 'healAmount',
            );
            if (isCharged) {
              const targets = [this.hero, ...this.activeLivingParty()].filter(
                (u) => u.hp > 0 && u.hp < u.maxHp,
              );
              for (const u of targets) {
                u.hp = Math.min(u.maxHp, u.hp + amount);
                this.event('heal', {
                  skillPresentation: true,
                  x: u.x,
                  y: u.y,
                  resource: 'health',
                  target: u === this.hero ? 'hero' : u.id,
                });
              }
              this.event('chargedArea', {
                slot,
                class: this.hero.class,
                effect: R.chargedSkills.third.effect,
                shape: 'circle',
                x: this.hero.x,
                y: this.hero.y,
                fromX: this.hero.x,
                fromY: this.hero.y,
                angle: 0,
                radius: 240,
                range: 0,
                halfAngle: 0,
                halfWidth: 0,
                hits: targets.length,
              });
            } else {
              this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + amount);
              this.event('heal', {
                skillPresentation: true,
                x: this.hero.x,
                y: this.hero.y,
                resource: 'health',
                target: 'hero',
              });
            }
          }
        } else if (slot === 4) {
          if (this.hero.class === 'ranger') {
            if (isCharged) {
              const rally = R.heroTactics.ranger.rally,
                radius = rally.radius + rally.radiusStep * steps,
                until = this.s.time + this.criticalHeroValue(
                  criticalReceipt, rally.duration + rally.durationStep * steps, 'hasteDuration',
                ),
                movement = rally.movementBonus + rally.movementStep * steps,
                attackSpeed = rally.attackSpeedBonus + rally.attackSpeedStep * steps;
              let allies = 0;
              for (const ally of this.activeLivingParty()) {
                if (dist(ally, this.hero) > radius || !this.line(this.hero, ally)) continue;
                const previousActive =
                  ally.rangerRallyZone === this.zoneId &&
                  (ally.rangerRallyUntil || 0) > this.s.time;
                ally.rangerRallyUntil = Math.max(previousActive ? ally.rangerRallyUntil : 0, until);
                ally.rangerRallyZone = this.zoneId;
                ally.rangerRallyMovement = Math.max(
                  previousActive ? ally.rangerRallyMovement || 0 : 0,
                  movement,
                );
                ally.rangerRallyAttack = Math.max(
                  previousActive ? ally.rangerRallyAttack || 0 : 0,
                  attackSpeed,
                );
                allies++;
              }
              this.event('chargedArea', {
                actor: 'hero',
                class: 'ranger',
                slot: 4,
                effect: 'companion-rally',
                shape: 'circle',
                x: this.hero.x,
                y: this.hero.y,
                fromX: this.hero.x,
                fromY: this.hero.y,
                radius,
                hits: allies,
              });
            } else {
              this.hero.haste = Math.min(
                6, this.criticalHeroValue(criticalReceipt, 4 + 0.25 * (rank - 1), 'hasteDuration'),
              );
              this.event('spell', {
                actor: 'hero',
                class: 'ranger',
                slot: 4,
                x: this.hero.x,
                y: this.hero.y,
              });
            }
          } else if (this.hero.class === 'paladin') {
            const cfg = R.heroTactics.paladin,
              advanced = isCharged ? cfg.grandJudgment : cfg.judgment,
              radius = isCharged ? advanced.radius + steps * advanced.radiusStep : 0,
              targets = isCharged
                ? this.zone()
                    .enemies.filter(
                      (e) =>
                        e.hp > 0 &&
                        !e.neutral &&
                        dist(e, target) <= radius &&
                        this.line(this.hero, e),
                    )
                    .sort((a, b) => this.idOrder(a, b))
                : [target];
            let hits = 0;
            for (const enemy of targets) {
              const damage =
                (isCharged
                  ? enemy === target
                    ? advanced.primaryDamage
                    : advanced.splashDamage
                  : advanced.damage) *
                power *
                scale;
              if (!isCharged) {
                this.launchTargetedHeroSkill(enemy, 4, damage, 'holy', {
                  effect: 'judgment',
                  tauntDuration: this.criticalHeroValue(
                    criticalReceipt, advanced.taunt + steps * advanced.tauntStep, 'tauntDuration',
                  ),
                  ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
                });
                continue;
              }
              if (this.damage(enemy, damage, 'hero', { area: isCharged, encountersAtStart })) {
                // Captains and bosses keep their authored scripted specials;
                // boss basic-target provocation is deliberately short-lived.
                const tauntDuration =
                  enemy.type === 'boss'
                    ? Math.min(2.5, this.criticalHeroValue(
                        criticalReceipt, advanced.taunt + steps * advanced.tauntStep, 'tauntDuration',
                      ))
                    : this.criticalHeroValue(
                        criticalReceipt, advanced.taunt + steps * advanced.tauntStep, 'tauntDuration',
                      );
                enemy.tauntUntil = Math.max(enemy.tauntUntil || 0, this.s.time + tauntDuration);
                hits++;
              }
            }
            if (isCharged)
              this.event('chargedArea', {
                actor: 'hero',
                class: 'paladin',
                slot: 4,
                effect: 'grand-judgment',
                shape: 'circle',
                x: target.x,
                y: target.y,
                radius,
                hits,
                fromX: this.hero.x,
                fromY: this.hero.y,
                targetId: target.id,
              });
          } else {
            const cfg = R.heroTactics.mage,
              advanced = isCharged ? cfg.rupture : cfg.fracture,
              radius = isCharged ? advanced.radius + steps * advanced.radiusStep : 0,
              targets = isCharged
                ? this.zone()
                    .enemies.filter(
                      (e) =>
                        e.hp > 0 &&
                        !e.neutral &&
                        dist(e, target) <= radius &&
                        this.line(this.hero, e),
                    )
                    .sort((a, b) => this.idOrder(a, b))
                : [target];
            let hits = 0;
            for (const enemy of targets) {
              const damage =
                power *
                scale *
                (isCharged
                  ? enemy === target
                    ? advanced.primaryDamage
                    : advanced.splashDamage
                  : advanced.damage);
              if (!isCharged) {
                this.launchTargetedHeroSkill(enemy, 4, damage, 'magic', {
                  effect: 'arcane-fracture',
                  fractureFraction: advanced.fraction + steps * advanced.fractionStep,
                  fractureDuration: this.criticalHeroValue(
                    criticalReceipt, advanced.duration + steps * advanced.durationStep,
                    'vulnerabilityDuration',
                  ),
                  ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
                });
                continue;
              }
              if (this.damage(enemy, damage, 'hero', { area: isCharged, encountersAtStart })) {
                this.fractureEnemy(
                  enemy,
                  advanced.fraction + steps * advanced.fractionStep,
                  this.criticalHeroValue(
                    criticalReceipt, advanced.duration + steps * advanced.durationStep,
                    'vulnerabilityDuration',
                  ),
                );
                hits++;
              }
            }
            if (isCharged)
              this.event('chargedArea', {
                actor: 'hero',
                class: 'mage',
                slot: 4,
                effect: 'arcane-rupture',
                shape: 'circle',
                x: target.x,
                y: target.y,
                radius,
                hits,
                fromX: this.hero.x,
                fromY: this.hero.y,
                targetId: target.id,
              });
          }
        } else if (slot === 5 || (slot === 7 && this.hero.class === 'paladin')) {
          // Repeatable area attacks prioritize the chosen foe when relevant,
          // then the closest threats. Excess enemies remain dangerous.
          const contacts = [];
          const areaLimit =
            slot === 5 ? R.heroAreaTargetCaps[5].normal : R.heroAreaTargetCaps[7].paladinNormal;
          for (const e of this.zone()
            .enemies.filter(
              (e) =>
                e.hp > 0 &&
                !e.neutral &&
                !this.attackResetProtected(e) &&
                dist(e, this.hero) < (slot === 5 ? 350 : 500),
            )
            .sort(
              (a, b) =>
                (slot === 7 && b === target ? 1 : 0) - (slot === 7 && a === target ? 1 : 0) ||
                dist(a, this.hero) - dist(b, this.hero) ||
                this.idOrder(a, b),
            )
            .slice(0, areaLimit)) {
            if (this.hero.class === 'ranger' && slot === 5) {
              // #464 physical Arrow Volley. The immutable action receipt
              // follows each original arrow until actual legal contact.
              const d = Math.max(1, dist(this.hero, e));
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: this.hero.x,
                y: this.hero.y,
                dx: (e.x - this.hero.x) / d,
                dy: (e.y - this.hero.y) / d,
                target: e.id,
                damage: this.criticalHeroValue(
                  criticalReceipt, power * 2.3 * scale, 'damage',
                ),
                source: 'hero',
                speed: 650,
                style: 'arrow',
                slot: 5,
                area: true,
                ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
              });
              continue;
            }
            const landed = this.damage(e, this.criticalHeroValue(
              this.hero.class !== 'mage' ? criticalReceipt : null,
              (slot === 7 ? power * 6 : power * 2.3) * scale, 'damage',
            ), 'hero', {
              area: true,
            });
            if (landed) contacts.push({ x: e.x, y: e.y, target: e.id });
            if (landed && this.hero.class === 'mage' && slot === 5 && e.hp > 0)
              this.shieldPush(e, this.criticalHeroValue(criticalReceipt, 30 + steps * 3, 'pushDistance'));
          }
          this.event('spell', {
            actor: 'hero',
            class: this.hero.class,
            source: 'hero',
            slot,
            radius: slot === 5 ? 350 : 500,
            contacts,
            ...(this.hero.class === 'ranger' && slot === 5
              ? { projectileVolley: true } : {}),
            x: this.hero.x,
            y: this.hero.y,
          });
        } else {
          const baseDmg =
              (slot === 1
                ? power + 12
                : slot === 2
                  ? power * 2.2
                  : slot === 6
                    ? power * 1.8 + 20
                    : power * 10) * scale,
            comboState = slot === 1 ? this.nextBasicCombo(target.id) : null,
            combo = comboState?.step || 0,
            criticalBasicDamage =
              (slot === 1 ||
                (this.hero.class === 'paladin' && slot === 6) ||
                (this.hero.class === 'ranger' && slot === 7)) && criticalReceipt?.critical
                ? this._criticalPartyNative.enhance(criticalReceipt, baseDmg, 'damage')
                : baseDmg,
            dmg = criticalBasicDamage * (comboState?.multiplier || 1);
          if (this.hero.class === 'paladin') {
            const landed = this.damage(
              target,
              dmg,
              'hero',
              automatic ? { automaticBasic: true } : null,
            );
            if (landed) {
              if (slot === 2) this.weakenEnemy(target, rank, criticalReceipt);
              this.event('melee', {
                actor: 'hero',
                class: 'paladin',
                source: 'hero',
                weapon: 'sword',
                slot,
                x: target.x,
                y: target.y,
                target: target.id,
                combo,
              });
              if (slot === 1 && combo === 3)
                this.basicComboFinisher(
                  target,
                  { x: this.hero.x, y: this.hero.y },
                  criticalBasicDamage,
                  'hero',
                  'paladin',
                  automatic,
                );
            }
            this.event('swing', {
              actor: 'hero',
              class: 'paladin',
              source: 'hero',
              weapon: 'sword',
              slot,
              x: this.hero.x,
              y: this.hero.y,
              targetX: target.x,
              targetY: target.y,
              combo,
              ...(dashFrom ? { dash: true, fromX: dashFrom.x, fromY: dashFrom.y } : {}),
            });
          } else {
            this.engage(target);
            const count = this.hero.class === 'ranger' && slot === 2 ? 2 : 1;
            for (let j = 0; j < count; j++) {
              const d = Math.max(1, dist(this.hero, target));
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: this.hero.x,
                y: this.hero.y,
                dx: (target.x - this.hero.x) / d,
                dy: (target.y - this.hero.y) / d,
                target: target.id,
                damage: count === 2 ? power * 1.2 * scale : dmg,
                source: 'hero',
                speed: 550,
                delay: j * 0.12,
                ...(this.hero.class === 'ranger' && j > 0
                  ? { rangerDelayedLaunch: true }
                  : {}),
                style: this.hero.class === 'ranger' ? 'arrow' : 'magic',
                slot,
                ...(this.hero.class === 'ranger' && slot === 7 ? { piercing: true } : {}),
                ...(this.hero.class === 'ranger' && slot === 6
                  ? { push: this.criticalHeroValue(criticalReceipt, 45 + 5 * steps, 'pushDistance') }
                  : {}),
                effect:
                  this.hero.class === 'mage' && slot === 2
                    ? 'frost'
                    : this.hero.class === 'ranger' && slot === 7
                      ? 'piercing-shot'
                      : undefined,
                combo,
                ...(automatic ? { automaticBasic: true } : {}),
                ...(criticalReceipt ? { criticalExecution: criticalReceipt } : {}),
                slow:
                  this.hero.class === 'mage' && [2, 6].includes(slot)
                    ? slot === 2
                      ? this.criticalHeroValue(criticalReceipt, 2 + steps * 0.05, 'slowDuration')
                      : this.criticalHeroValue(criticalReceipt, 2, 'slowDuration')
                    : this.hero.class === 'ranger' && slot === 2
                      ? this.criticalHeroValue(
                          criticalReceipt,
                          R.heroTactics.ranger.pin.slow + steps * R.heroTactics.ranger.pin.slowStep,
                          'slowDuration',
                        )
                      : 0,
                ...(slot === 1 && combo === 3
                  ? {
                      basicComboFinisher: true,
                      finisherBaseDamage: criticalBasicDamage,
                      finisherFromX: this.hero.x,
                      finisherFromY: this.hero.y,
                      comboClass: this.hero.class,
                    }
                  : {}),
              });
            }
            this.event('projectileLaunch', {
              actor: 'hero',
              class: this.hero.class,
              source: 'hero',
              style: this.hero.class === 'ranger' ? 'arrow' : 'magic',
              slot,
              count,
              ...(this.hero.class === 'ranger' && count > 1
                ? { releasedCount: 1, pendingCount: count - 1 }
                : {}),
              combo,
              x: this.hero.x,
              y: this.hero.y,
              target: target.id,
            });
          }
        }
        return true;
      }
    }
    for (const name of Object.getOwnPropertyNames(HeroCombat.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(HeroCombat.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeHeroCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
