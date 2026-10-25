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
      petRecruitmentReason(family, barracksId) {
        const b = this.zone().buildings.find(
          (x) => x.id === barracksId && x.kind === 'barracks' && x.progress >= 4,
        );
        if (!b) return 'Recruiting a pet requires a completed local Barracks.';
        if (!this.petDefinition(family)) return 'This pet is not available in the collection.';
        if (!this.petUnlocked(family))
          return 'Defeat TRUE ' + this.boss(family).name + ' to unlock this pet.';
        if (this.refugeThreat())
          return 'Cannot recruit a pet while nearby enemies are engaged. Retreat and end the fight first.';
        if (this.s.party.some((u) => u.type === 'pet' && u.petFamily === family))
          return 'This pet already belongs to your company. Add it from reserve or recover it if fallen.';
        if (this.rosterCount() + this.queuedCompanions() >= 200)
          return 'Company limit reached: 200 companions, including reserves and queued recruits.';
        return '';
      }
      recruitPet(family, barracksId) {
        const reason = this.petRecruitmentReason(family, barracksId);
        if (reason) {
          this.say(reason);
          return false;
        }
        const b = this.zone().buildings.find((b) => b.id === barracksId);
        const p = this.safe(b.x + 45, b.y + 45);
        const u = this.unit('pet', p.x, p.y, family);
        u.active = this.activeParty().length < this.barracksFieldCap(b);
        this.s.party.push(u);
        this.say(u.name + (u.active ? ' joins your group.' : ' waits in reserve.'));
        return true;
      }
      petSkillSummary(family, slot, detailed = false) {
        const def = this.petSkillDefinition({ petFamily: family }, slot);
        if (!def) return '';
        const shape = def.shape === 'target' ? 'single target' : def.shape;
        const geometry = shape + ' · ' + def.range + ' reach';
        const detail = !detailed
          ? ''
          : (def.shape === 'circle'
              ? ' · ' + def.radius + '-radius splash around the aimed enemy'
              : def.shape === 'cone'
                ? ' · ' +
                  Math.round((def.halfAngle * 360) / Math.PI) +
                  '° fan from the pet toward the aimed enemy'
                : def.shape === 'line'
                  ? ' · ' + def.halfWidth * 2 + '-wide strip from the pet through the aimed enemy'
                  : ' · hits the aimed enemy only') +
            ' · clear line required; aim stays locked during the second skill’s 0.65s interruptible hold';
        return (
          geometry +
          (def.shape === 'target' && this.petDefinition(family).role === 'ranged'
            ? ' · dodgeable shot; effects require contact'
            : '') +
          ' · ' +
          def.multiplier +
          '× companion attack' +
          (def.woundedBonus
            ? ' · +' +
              Math.round(def.woundedBonus * 100) +
              '% damage against targets at or below ' +
              Math.round(def.woundedThreshold * 100) +
              '% HP'
            : '') +
          ' · up to ' +
          (def.cap || 1) +
          ' target(s) · ' +
          (slot === 1
            ? R.balance.companions.petFirstCooldown
            : R.balance.companions.petSecondCooldown) +
          's recovery' +
          (def.slow ? ' · Slow ' + def.slow + 's' : '') +
          (def.heal ? ' · self-heal ' + Math.round(def.heal * 100) + '% HP' : '') +
          (def.allyHeal
            ? ' · heals one wounded ally within ' +
              def.healRange +
              ' for ' +
              Math.round(def.allyHeal * 100) +
              '% of the pet’s maximum HP; clear line required'
            : '') +
          (def.ward
            ? ' · self-ward ' + Math.round(def.ward * 100) + '% for ' + def.duration + 's'
            : '') +
          detail +
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
          target.neutral ||
          target.returning ||
          !this.tacticalDirectTargetable(target) ||
          dist(u, target) > def.range ||
          !this.line(u, target)
        )
          return [];
        const dx = target.x - u.x,
          dy = target.y - u.y,
          angle = Math.atan2(dy, dx);
        const end = { x: u.x + Math.cos(angle) * def.range, y: u.y + Math.sin(angle) * def.range };
        const candidates = this.zone().enemies.filter((e) => {
          if (e.hp <= 0 || e.neutral || e.returning || !this.line(u, e)) return false;
          if (def.shape === 'target') return e === target && this.tacticalDirectTargetable(e);
          if (def.shape === 'circle') return dist(e, target) <= def.radius;
          if (def.shape === 'cone')
            return (
              dist(u, e) <= def.range &&
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
        if (this.companionSurvivalMode(u) && !this.companionSafeContribution(u, target, slot))
          return false;
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
        const projectile = this.petDefinition(u).role === 'ranged' && def.shape === 'target';
        let hits = 0;
        if (projectile) {
          const distance = Math.max(1, dist(u, target));
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (target.x - u.x) / distance,
            dy: (target.y - u.y) / distance,
            target: target.id,
            source: u.id,
            style: 'pet',
            petFamily: u.petFamily,
            damage: this.companionAttackDamage(u) * def.multiplier,
            speed: R.balance.friendlyProjectiles.skillSpeed,
            slow: def.slow || 0,
            petSkillSlot: slot,
            // Preserve the actual release point for an impact flash after the pet moves.
            launchX: u.x,
            launchY: u.y,
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
        } else {
          for (const e of targets) {
            if (u.hp <= 0) break;
            const woundedBonus =
              def.woundedBonus && e.hp / e.maxHp <= def.woundedThreshold ? 1 + def.woundedBonus : 1;
            if (
              !this.damage(e, this.companionAttackDamage(u) * def.multiplier * woundedBonus, u.id, {
                area: def.shape !== 'target',
              })
            )
              continue;
            hits++;
            if (def.slow) this.applySlow(e, def.slow);
          }
        }
        if (!projectile && !hits) return false;
        u[key] =
          slot === 1
            ? R.balance.companions.petFirstCooldown
            : R.balance.companions.petSecondCooldown;
        u.skillGlobalCd = R.companionSkills.globalCooldown;
        u.cd = Math.max(u.cd, 0.5);
        this.petSkillEvent(u, target, slot, 0, 'release');
        if (!projectile) this.petSkillContact(u, target, slot, hits);
        return true;
      }
      petSkillContact(u, target, slot, hits = 1, launchPoint = null) {
        const def = this.petSkillDefinition(u, slot);
        if (!def || u.hp <= 0 || u.active === false) return false;
        if (u.hp > 0 && def.heal) {
          u.hp = Math.min(u.maxHp, u.hp + u.maxHp * def.heal);
          this.event('heal', { x: u.x, y: u.y, target: u.id, resource: 'health' });
        }
        if (def.allyHeal) {
          const ally = [this.hero, ...this.activeLivingParty()]
            .filter(
              (a) =>
                a !== u &&
                a.hp > 0 &&
                a.hp < a.maxHp &&
                dist(u, a) <= def.healRange &&
                this.line(u, a),
            )
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (ally) {
            // One ally per contact, based on the pet's HP rather than the
            // recipient's pool; large hero HP cannot inflate the heal.
            ally.hp = Math.min(ally.maxHp, ally.hp + u.maxHp * def.allyHeal);
            this.event('heal', {
              x: ally.x,
              y: ally.y,
              fromX: u.x,
              fromY: u.y,
              target: ally === this.hero ? 'hero' : ally.id,
              resource: 'health',
            });
          }
        }
        if (u.hp > 0 && def.ward) {
          // Self-only, strongest ward wins; never stacks with Paladin protection.
          if ((u.wardUntil || 0) <= this.s.time || (u.wardReduction || 0) <= def.ward) {
            u.wardUntil = this.s.time + def.duration;
            u.wardReduction = def.ward;
          }
        }
        this.petSkillEvent(u, target, slot, hits, 'impact', launchPoint);
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
      petSkillEvent(u, target, slot, hits, stage, launchPoint = null) {
        const def = this.petSkillDefinition(u, slot);
        const pet = this.petDefinition(u);
        this.event('petSkill', {
          stage,
          source: u.id,
          petFamily: u.petFamily,
          skill: def.name,
          x: target.x,
          y: target.y,
          fromX: launchPoint?.x ?? u.x,
          fromY: launchPoint?.y ?? u.y,
          // Real ranged pet shots have already flown on their own collider.
          // Never draw a second full-range line from the pet at impact time.
          physicalProjectile: !!launchPoint,
          color: pet.color,
          shape: def.shape,
          radius: def.radius || 0,
          range: def.range,
          halfWidth: def.halfWidth || 0,
          halfAngle: def.halfAngle || 0,
          slot,
          hits,
        });
      }
      petCombatPoint(u, target, living, reach) {
        const cfg = R.balance.companions,
          anchor = this.partyFollowPoint(u, living),
          anchorRange = dist(anchor, target),
          preferred = Math.min(cfg.petPreferredRange, reach - 2 * cfg.petFollowStop);
        // The destination plus follow's stopping tolerance must remain inside reach.
        if (
          anchorRange >= cfg.petRetreatRange + cfg.petFollowStop &&
          anchorRange <= reach - cfg.petFollowStop &&
          this.line(anchor, target)
        )
          return anchor;
        // If the enemy occupies the formation anchor, retreat along the pet's
        // own side; a coincident anchor cannot supply a direction vector.
        const direction =
            anchorRange > 0 ? anchor : dist(u, target) > 0 ? u : { x: target.x + 1, y: target.y },
          dx = direction.x - target.x,
          dy = direction.y - target.y,
          angle = Math.atan2(dy, dx);
        // A destination on our side of a wall may be in range but have no firing
        // line. Choose a legal point around the aim; navigation owns the route.
        for (const turn of [0, 1, -1, 2, -2, 3, -3, 4]) {
          const a = angle + (turn * Math.PI) / 4,
            p = { x: target.x + Math.cos(a) * preferred, y: target.y + Math.sin(a) * preferred };
          if (
            !this.blocked(p.x, p.y) &&
            this.line(p, target) &&
            this.companionSupportDistance(u, p) <= R.companionJudgment.maxAdvanceFromHero
          )
            return p;
        }
        // Confined rooms may have no comfortable firing band. Approach rather
        // than parking forever; legal close-range attacks are still allowed.
        return this.safe(target.x, target.y);
      }
      // While Recall holds, a nearby pet may counterattack without chasing
      // or casting an active skill. Keep pet art/audio distinct from troops.
      petDefensiveCounter(u, target) {
        if (this.companionSurvivalMode(u) && !this.companionSafeContribution(u, target, 0))
          return false;
        const def = this.petDefinition(u);
        if (!def || !target || target.hp <= 0 || u.hp <= 0 || u.active === false || (u.cd || 0) > 0)
          return false;
        const ranged = def.role === 'ranged';
        const distance = dist(u, target);
        if (distance > (ranged ? R.balance.companions.petBasicRange : 70) || !this.line(u, target))
          return false;
        u.cd = R.balance.companions.petBasicInterval / this.companionRallyAttackSpeed(u);
        if (ranged) {
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (target.x - u.x) / Math.max(1, distance),
            dy: (target.y - u.y) / Math.max(1, distance),
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
        return true;
      }
      updatePetCombat(u, target, living, dt) {
        const def = this.petDefinition(u);
        if (!def) {
          this.followPartyMember(u, living, dt);
          return;
        }
        const ranged = def.role === 'ranged',
          cfg = R.balance.companions,
          d = dist(u, target),
          visible = this.line(u, target);
        // Like Soldiers, melee pets can start a legal skill before closing to
        // basic-attack distance. Each skill still owns its range/line checks.
        if (!ranged && visible && this.companionTrySkill(u, target)) return;
        const speed =
          this.companionRallyMoveSpeed(u, 255) *
          this.slowMovementFactor(u) *
          this.mireBogMovementFactor(u) *
          this.ashMovementFactor(u);
        if (ranged && d < cfg.petRetreatRange) {
          const reach = Math.min(cfg.petBasicRange, def.first.range, def.second.range);
          this.follow(
            u,
            this.petCombatPoint(u, target, living, reach),
            speed,
            dt,
            cfg.petFollowStop,
          );
        } else if (
          d > (ranged ? Math.min(cfg.petBasicRange, def.first.range, def.second.range) : 70) ||
          !visible
        ) {
          // Pet-specific destination; shared navigation still owns collision and movement.
          this.follow(
            u,
            ranged
              ? this.petCombatPoint(
                  u,
                  target,
                  living,
                  Math.min(cfg.petBasicRange, def.first.range, def.second.range),
                )
              : target,
            speed,
            dt,
            ranged ? cfg.petFollowStop : visible ? 55 : 0,
          );
        }
        // A shorter second skill must not suppress an otherwise usable first/basic.
        const attackDistance = dist(u, target);
        if (attackDistance > (ranged ? cfg.petBasicRange : 70) || !this.line(u, target)) return;
        if (this.companionTrySkill(u, target)) return;
        if (u.cd > 0) return;
        u.cd = R.balance.companions.petBasicInterval / this.companionRallyAttackSpeed(u);
        if (ranged) {
          this.s.projectiles.push({
            id: 'projectile-' + this.s.nextId++,
            x: u.x,
            y: u.y,
            dx: (target.x - u.x) / Math.max(1, attackDistance),
            dy: (target.y - u.y) / Math.max(1, attackDistance),
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
