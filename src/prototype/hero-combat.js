/* Hero profession skills and basic combos. Rules remain authoritative for all three classes. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const costs = R.balance.skills.costs,
      cooldowns = R.balance.skills.cooldowns;
    class HeroCombat {
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
      basicComboFinisher(target, from, baseDamage, source = 'hero', heroClass = this.hero.class) {
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
              e.hp > 0 &&
              !e.neutral &&
              dist(e, from) <= def.range &&
              Math.abs(delta(Math.atan2(e.y - from.y, e.x - from.x), angle)) <= def.halfAngle &&
              this.line(from, e),
          )
          .sort((a, b) => this.idOrder(a, b))) {
          if (this.damage(e, baseDamage * (cfg.secondaryMultiplier || 0.55), source, { area: true })) hits++;
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
      skillManaCost(slot, rank = this.hero.skills[slot - 1] || 1, charged = false) {
        if (charged) {
          const fraction = R.chargedSkills?.manaFractions?.[slot];
          if (fraction) return Math.max(1, Math.ceil(this.hero.maxMp * fraction));
        }
        if (slot === 1) return 0;
        return Math.ceil(costs[slot] * (1 + R.manaBalance.rankCostGrowth * Math.max(0, rank - 1)));
      }
      cast(slot, targetId, charged = false) {
        const i = slot - 1,
          rank = this.hero.skills[i],
          isCharged = !!charged && (slot === 1 || slot === 2 || slot === 3);
        if (this.s.challenge.pending || this.s.challenge.gameOver ||
            this.tacticalScatterState(this.hero)) return false;
        if (!rank || this.hero.cd[i] > 0 || this.peace) {
          if (!rank) this.say('This skill must be learned from a rescued instructor.');
          return false;
        }
        const scale = 1 + 0.15 * (rank - 1),
          chargedSecond =
            isCharged && slot === 2 ? R.chargedSkills.second?.[this.hero.class] : null,
          range = chargedSecond
            ? chargedSecond.range || 480
            : this.hero.class === 'paladin' && slot < 3
              ? 120
              : slot === 1
                ? this.hero.class === 'mage'
                  ? 400
                  : 450
                : 480,
          targets = this.zone().enemies.filter(
            (e) => e.hp > 0 && !e.neutral && this.tacticalDirectTargetable(e) && dist(e, this.hero) <= range && this.line(this.hero, e),
          ),
          preferredTargetId =
            targetId ?? (slot === 1 ? (this.basicComboTargetId ?? this.s.heroTarget) : null),
          target =
            targets.find((e) => e.id === preferredTargetId) ||
            targets.find((e) => slot === 1 && e.id === this.s.heroTarget) ||
            targets.sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0];
        if ([1, 2, 6, 7, 8].includes(slot) && !target) return false;
        if (slot === 3) {
          const living = [this.hero, ...this.activeLivingParty()].filter((u) => u.hp > 0);
          if (isCharged) {
            if (living.every((u) => u.hp >= u.maxHp)) return false;
          } else if (this.hero.hp >= this.hero.maxHp) return false;
        }
        const cost = this.skillManaCost(slot, rank, isCharged);
        if (this.hero.mp < cost) return false;
        this.hero.mp -= cost;
        this.hero.cd[i] = cooldowns[slot];
        if (target && [1, 2, 6, 7, 8].includes(slot)) this.s.heroTarget = target.id;
        const power = this.power();
        if (isCharged && slot === 1) {
          this.resetBasicCombo();
          const d = Math.max(1, dist(this.hero, target)),
            damage = (power + 12) * scale * R.chargedSkills.basicDamageMultiplier,
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
              speed: 1000,
              delay: 0,
              style: 'beam',
              charged: true,
            });
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'mage',
              source: 'hero',
              style: 'magic',
              slot,
              charged: true,
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
                style: 'arrow',
                charged: true,
                rapid: true,
                chargedBurst: j === 2,
              });
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'ranger',
              source: 'hero',
              style: 'arrow',
              slot,
              charged: true,
              count: 3,
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
              charged: true,
            });
            this.event('projectileLaunch', {
              actor: 'hero',
              class: 'paladin',
              source: 'hero',
              style: 'holy',
              slot,
              charged: true,
              x: this.hero.x,
              y: this.hero.y,
              target: target.id,
            });
          }
          this.event('charged', {
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
        if (isCharged && slot === 2) {
          const def = chargedSecond || R.chargedSkills.second[this.hero.class],
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
          let hits = 0;
          for (const e of this.zone()
            .enemies.filter((e) => e.hp > 0 && !e.neutral && inside(e) && this.line(this.hero, e))
            .sort((a, b) => this.idOrder(a, b))) {
            if (this.damage(e, damage, 'hero', { area: true })) {
              hits++;
              if (def.slow) e.slow = Math.max(e.slow || 0, def.slow);
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
          const amount = (45 + power * 0.5) * scale;
          if (isCharged) {
            const targets = [this.hero, ...this.activeLivingParty()].filter(
              (u) => u.hp > 0 && u.hp < u.maxHp,
            );
            for (const u of targets) {
              u.hp = Math.min(u.maxHp, u.hp + amount);
              this.event('heal', {
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
              x: this.hero.x,
              y: this.hero.y,
              resource: 'health',
              target: 'hero',
            });
          }
        } else if (slot === 4) {
          if (this.hero.class === 'ranger') this.hero.haste = Math.min(6, 4 + 0.25 * (rank - 1));
          else
            this.hero.immune = Math.min(
              4,
              (this.hero.class === 'paladin' ? 2.5 : 2) + 0.15 * (rank - 1),
            );
          this.event('spell', {
            actor: 'hero',
            class: this.hero.class,
            source: 'hero',
            slot,
            x: this.hero.x,
            y: this.hero.y,
          });
        } else if (slot === 5 || slot === 8 || (slot === 7 && this.hero.class !== 'ranger')) {
          for (const e of this.zone()
            .enemies.filter((e) => e.hp > 0 && dist(e, this.hero) < (slot === 5 ? 350 : 500))
            .sort((a, b) => this.idOrder(a, b))) {
            this.damage(
              e,
              (slot === 8
                ? power * 4 + 60
                : slot === 7
                  ? power * (this.hero.class === 'mage' ? 7 : 6)
                  : power * 2.3) * scale,
              'hero',
              { area: true },
            );
            if (this.hero.class === 'mage' && slot !== 8) e.slow = slot === 5 ? 5 : 6;
          }
          if (slot === 8) {
            this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.35 * scale);
            this.hero.immune = Math.min(4, 3 + 0.15 * (rank - 1));
          }
          this.event('spell', {
            actor: 'hero',
            class: this.hero.class,
            source: 'hero',
            slot,
            radius: slot === 5 ? 350 : 500,
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
            dmg = baseDmg * (comboState?.multiplier || 1);
          if (this.hero.class === 'paladin') {
            const landed = this.damage(target, dmg);
            if (landed) {
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
                  baseDmg,
                  'hero',
                  'paladin',
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
                style: this.hero.class === 'ranger' ? 'arrow' : 'magic',
                slot,
                effect:
                  this.hero.class === 'mage' && slot === 2
                    ? 'frost'
                    : this.hero.class === 'ranger' && slot === 7
                      ? 'piercing-shot'
                      : undefined,
                combo,
                slow:
                  this.hero.class === 'mage' && [2, 6].includes(slot) ? (slot === 2 ? 4 : 2) : 0,
                ...(slot === 1 && combo === 3
                  ? {
                      basicComboFinisher: true,
                      finisherBaseDamage: baseDmg,
                      finisherFromX: this.hero.x,
                      finisherFromY: this.hero.y,
                      comboClass: this.hero.class,
                    }
                  : {}),
              });
            }
            if (slot === 6 && this.hero.class === 'ranger')
              this.hero.haste = Math.max(this.hero.haste, 2 + 0.15 * (rank - 1));
            this.event('projectileLaunch', {
              actor: 'hero',
              class: this.hero.class,
              source: 'hero',
              style: this.hero.class === 'ranger' ? 'arrow' : 'magic',
              slot,
              count,
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
