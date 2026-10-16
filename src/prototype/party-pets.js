/* Shared boss-pet specialization of the existing companion framework. No enemy AI. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class PartyPets {
      petDefinition(unitOrFamily) {
        const family = typeof unitOrFamily === 'string' ? unitOrFamily : unitOrFamily?.petFamily;
        return D.bosses.some((b) => b.id === family) && Object.hasOwn(R.petCompanions, family)
          ? R.petCompanions[family]
          : null;
      }
      petUnlocked(family) {
        // Historical TRUE records are ownership. No second inventory can drift from them.
        return !!this.petDefinition(family) && this.s.true[family] === true;
      }
      petCollection() {
        return D.bosses.map((boss) => {
          const def = this.petDefinition(boss.id);
          const unit = this.s.party.find((u) => u.type === 'pet' && u.petFamily === boss.id);
          return {
            boss,
            def,
            unit,
            state: !this.petUnlocked(boss.id)
              ? 'Locked'
              : !unit
                ? 'Recruitable'
                : unit.hp <= 0
                  ? 'Fallen'
                  : unit.active === false
                    ? 'Resting'
                    : 'Active',
          };
        });
      }
      recruitPet(family, barracksId) {
        const b = this.zone().buildings.find(
          (x) => x.id === barracksId && x.kind === 'barracks' && x.progress >= 4,
        );
        if (
          !b ||
          !this.petUnlocked(family) ||
          this.refugeThreat() ||
          this.s.party.some((u) => u.type === 'pet' && u.petFamily === family) ||
          this.rosterCount() + this.queuedCompanions() >= 200
        )
          return false;
        const p = this.safe(b.x + 45, b.y + 45);
        const u = this.unit('pet', p.x, p.y, family);
        u.active = this.activeParty().length < this.barracksFieldCap(b);
        this.s.party.push(u);
        this.say(u.name + (u.active ? ' joins your group.' : ' waits in reserve.'));
        return true;
      }
      petSkillSummary(family, slot) {
        const def = this.petSkillDefinition({ petFamily: family }, slot);
        if (!def) return '';
        return (
          def.multiplier +
          '× companion attack · up to ' +
          (def.cap || 1) +
          ' target(s) · ' +
          (slot === 1
            ? R.balance.companions.petFirstCooldown
            : R.balance.companions.petSecondCooldown) +
          's recovery' +
          (def.slow ? ' · Slow ' + def.slow + 's' : '') +
          (def.heal ? ' · self-heal ' + Math.round(def.heal * 100) + '% HP' : '') +
          (def.ward
            ? ' · self-ward ' + Math.round(def.ward * 100) + '% for ' + def.duration + 's'
            : '') +
          '.'
        );
      }
      petSkillDefinition(u, slot) {
        const def = this.petDefinition(u);
        return def ? (slot === 1 ? def.first : slot === 2 ? def.second : null) : null;
      }
      petSkillTargets(u, target, slot) {
        const def = this.petSkillDefinition(u, slot);
        if (
          !def ||
          !target ||
          target.hp <= 0 ||
          dist(u, target) > def.range ||
          !this.line(u, target)
        )
          return [];
        const dx = target.x - u.x,
          dy = target.y - u.y,
          angle = Math.atan2(dy, dx);
        const end = { x: u.x + Math.cos(angle) * def.range, y: u.y + Math.sin(angle) * def.range };
        const candidates = this.zone().enemies.filter((e) => {
          if (
            e.hp <= 0 ||
            e.neutral ||
            e.returning ||
            !this.tacticalDirectTargetable(e) ||
            !this.line(u, e)
          )
            return false;
          if (def.shape === 'target') return e === target;
          if (def.shape === 'circle') return dist(e, target) <= def.radius;
          if (dist(u, e) > def.range) return false;
          if (def.shape === 'cone')
            return (
              Math.abs(
                Math.atan2(
                  Math.sin(Math.atan2(e.y - u.y, e.x - u.x) - angle),
                  Math.cos(Math.atan2(e.y - u.y, e.x - u.x) - angle),
                ),
              ) <= def.halfAngle
            );
          const along = (e.x - u.x) * Math.cos(angle) + (e.y - u.y) * Math.sin(angle);
          return (
            def.shape === 'line' &&
            along >= 0 &&
            along <= def.range &&
            this.distanceToSegment(e, u, end) <= def.halfWidth
          );
        });
        // Aim target first; deterministic cap prevents arena-wide boss damage.
        return candidates
          .sort((a, b) => (a === target ? -1 : b === target ? 1 : this.idOrder(a, b)))
          .slice(0, def.cap || 1);
      }
      usePetSkill(u, target, slot, targets = this.petSkillTargets(u, target, slot)) {
        const def = this.petSkillDefinition(u, slot),
          key = slot === 1 ? 'skill1Cd' : 'skill2Cd';
        if (
          !def ||
          !target ||
          (slot === 2 && !this.companionSecondSkillUnlocked()) ||
          u.hp <= 0 ||
          u.active === false ||
          this.mageSilenceActive(u) ||
          (u[key] || 0) > 0 ||
          !targets.length
        )
          return false;
        let hits = 0;
        for (const e of targets) {
          if (u.hp <= 0) break;
          if (
            !this.damage(e, this.companionAttackDamage(u) * def.multiplier, u.id, {
              area: def.shape !== 'target',
            })
          )
            continue;
          hits++;
          if (def.slow) this.applySlow(e, def.slow);
        }
        if (!hits) return false;
        u[key] =
          slot === 1
            ? R.balance.companions.petFirstCooldown
            : R.balance.companions.petSecondCooldown;
        u.skillGlobalCd = R.companionSkills.globalCooldown;
        u.cd = Math.max(u.cd, 0.5);
        if (u.hp > 0 && def.heal) {
          u.hp = Math.min(u.maxHp, u.hp + u.maxHp * def.heal);
          this.event('heal', { x: u.x, y: u.y, target: u.id, resource: 'health' });
        }
        if (u.hp > 0 && def.ward) {
          // Self-only, strongest ward wins; never stacks with Paladin protection.
          if ((u.wardUntil || 0) <= this.s.time || (u.wardReduction || 0) <= def.ward) {
            u.wardUntil = this.s.time + def.duration;
            u.wardReduction = def.ward;
          }
        }
        const pet = this.petDefinition(u);
        this.event('petSkill', {
          source: u.id,
          petFamily: u.petFamily,
          skill: def.name,
          x: target.x,
          y: target.y,
          fromX: u.x,
          fromY: u.y,
          color: pet.color,
          shape: def.shape,
          radius: def.radius || 25,
          slot,
          hits,
        });
        this.event('spell', {
          actor: 'companion',
          role: 'pet',
          source: u.id,
          x: u.x,
          y: u.y,
          special: 'pet-skill',
        });
        return true;
      }
      updatePetCombat(u, target, living, dt) {
        const def = this.petDefinition(u);
        if (!def) {
          this.followPartyMember(u, living, dt);
          return;
        }
        const ranged = def.role === 'ranged',
          d = dist(u, target),
          visible = this.line(u, target);
        const speed =
          this.companionRallyMoveSpeed(u, 255) *
          this.slowMovementFactor(u) *
          this.mireBogMovementFactor(u) *
          this.ashMovementFactor(u);
        if (ranged && d < 150) {
          this.follow(u, this.archerFallbackPoint(u, target, living), speed, dt, 35);
          return;
        }
        if (d > (ranged ? Math.min(280, def.first.range, def.second.range) : 70) || !visible) {
          // Reuse the navigation owner and existing ranged positioning policy.
          this.follow(
            u,
            ranged ? this.archerCombatPoint(u, target, living) : target,
            speed,
            dt,
            ranged ? 35 : visible ? 55 : 0,
          );
          return;
        }
        if (this.companionTrySkill(u, target)) return;
        if (u.cd > 0) return;
        u.cd = R.balance.companions.petBasicInterval / this.companionRallyAttackSpeed(u);
        if (ranged) {
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (target.x - u.x) / Math.max(1, d),
            dy: (target.y - u.y) / Math.max(1, d),
            target: target.id,
            damage: this.companionAttackDamage(u),
            source: u.id,
            speed: 450,
            style: 'pet',
            petFamily: u.petFamily,
          });
          this.event('projectileLaunch', {
            actor: 'companion',
            role: 'pet',
            source: u.id,
            style: 'magic',
            x: u.x,
            y: u.y,
            target: target.id,
          });
        } else if (this.damage(target, this.companionAttackDamage(u), u.id)) {
          this.event('melee', {
            actor: 'companion',
            role: 'pet',
            source: u.id,
            x: target.x,
            y: target.y,
            target: target.id,
          });
          this.event('petSkill', {
            source: u.id,
            petFamily: u.petFamily,
            skill: 'basic',
            x: target.x,
            y: target.y,
            fromX: u.x,
            fromY: u.y,
            color: def.color,
            shape: 'target',
            radius: 15,
            slot: 0,
            hits: 1,
          });
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(PartyPets.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(PartyPets.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypePartyPets = api;
})(typeof window !== 'undefined' ? window : globalThis);
