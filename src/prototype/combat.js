/* Shared combat targets, damage, mana drain, segment geometry, projectiles and hazards. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const ROGUE_REGROUP_INCOMING_DAMAGE_MULTIPLIER = 0.5;
    class Combat {
      combatTargets() {
        const z = this.s.zones[this.s.zone];
        return [this.hero, ...this.activeLivingParty(), ...(z?.escort?.hp > 0 ? [z.escort] : [])];
      }

      // Passive combat observations only: no threat-based targeting or rogue actions in phase one.
      tacticalClearThreat(e = null) {
        if (!this._tacticalThreat) return;
        if (e) this._tacticalThreat.delete(e.id);
        else this._tacticalThreat.clear();
      }

      tacticalPruneThreat(e) {
        const ledger = this._tacticalThreat?.get(e?.id);
        if (!ledger) return null;
        const cutoff = (this.s.time || 0) - R.tacticalFoundation.threatWindowSeconds;
        for (const [source, hits] of ledger) {
          while (hits.length && hits[0].time < cutoff) hits.shift();
          if (!hits.length) ledger.delete(source);
        }
        if (!ledger.size) {
          this._tacticalThreat.delete(e.id);
          return null;
        }
        return ledger;
      }

      tacticalThreatSnapshot(e) {
        const ledger = this.tacticalPruneThreat(e);
        if (!ledger) return [];
        return [...ledger.entries()]
          .map(([source, hits]) => ({
            source,
            damage: hits.reduce((total, hit) => total + hit.damage, 0),
            lastHit: hits[hits.length - 1].time,
          }))
          .sort((a, b) => b.damage - a.damage || a.source.localeCompare(b.source));
      }

      tacticalRecordHit(e, source, damage) {
        if (!e || !Number.isFinite(damage) || damage <= 0) return;
        const actor =
          source === 'hero'
            ? 'hero'
            : this.s.party.find((unit) => unit.id === source && unit.hp > 0)?.id;
        if (!actor) return;
        if (!this._tacticalThreat) this._tacticalThreat = new Map();
        const ledger = this.tacticalPruneThreat(e) || new Map();
        const now = this.s.time || 0;
        const hits = ledger.get(actor) || [];
        const last = hits[hits.length - 1];
        if (last && last.time === now) last.damage += damage;
        else hits.push({ time: now, damage });
        // Keep the transient observation cache bounded even in extreme rapid-hit cases.
        if (hits.length > 128) hits.splice(0, hits.length - 128);
        ledger.set(actor, hits);
        this._tacticalThreat.set(e.id, ledger);
      }

      tacticalActiveTargetCount(e) {
        if (!e || !e.aggro || e.hp <= 0) return 0;
        const now = this.s.time || 0;
        const recent = this.tacticalThreatSnapshot(e);
        const attackingHero =
          this.hero.hp > 0 &&
          dist(this.hero, e) <= 520 &&
          this.line(this.hero, e) &&
          ((this.hero.order?.type === 'attack' && this.hero.order.id === e.id) ||
            (this.basicComboTargetId === e.id && now - this.basicComboAt <= 2.2) ||
            recent.some((entry) => entry.source === 'hero' && now - entry.lastHit <= 2.2));
        let count = attackingHero ? 1 : 0;
        for (const u of this.activeLivingParty()) {
          if (u.order || this.s.recallActive || dist(u, e) > 640) continue;
          if (this._tacticalPartyTargets?.get(u.id) === e.id) count++;
        }
        return count;
      }

      tacticalHighestThreatTarget(e, fallback = this.hero) {
        const candidates = this.combatTargets().filter(
          (u) => u.hp > 0 && dist(e, u) <= (e.type === 'boss' ? 500 : 360) && this.line(e, u),
        );
        const ledger = this.tacticalThreatSnapshot(e);
        for (const record of ledger) {
          const found = candidates.find((u) => (u === this.hero ? 'hero' : u.id) === record.source);
          if (found) return found;
        }
        return candidates.includes(fallback) ? fallback : candidates[0] || null;
      }

      tacticalDirectTargetable(e) {
        return !!e && (e.rogueDustCoverUntil || 0) <= (this.s.time || 0);
      }

      tacticalDropDustTarget(e) {
        if (!e?.id) return;
        // Direct target selection is invalid immediately, not merely at the
        // moment damage would land. Other foes remain auto-targetable.
        if (this.s.heroTarget === e.id) this.s.heroTarget = null;
        if (this.hero.order?.type === 'attack' && this.hero.order.id === e.id)
          this.hero.order = null;
        if (this.basicComboTargetId === e.id) this.resetBasicCombo();
        for (const u of this.s.party) {
          if (u.order?.type === 'attack' && u.order.id === e.id) u.order = null;
        }
        if (this._tacticalPartyTargets)
          for (const [id, targetId] of this._tacticalPartyTargets)
            if (targetId === e.id) this._tacticalPartyTargets.delete(id);
        // Already launched single-target shots are abandoned. Area effects
        // retain their own hit geometry and remain able to damage the goblin.
        this.s.projectiles = this.s.projectiles.filter(
          (p) => p.source === 'enemy' || p.target !== e.id,
        );
      }
      tacticalProtectionTier(e) {
        if (e?.type === 'boss') return e.form === 'true' ? 'trueBoss' : 'boss';
        if (e?.captain || e?.roomCaptain) return 'captain';
        if (e?.form === 'ringleader') return 'ringleader';
        if (e?.guard) return 'guardian';
        return 'ordinary';
      }

      tacticalRegroupCandidates(e) {
        if (!e || !this.zone()?.enemies) return [];
        const radius = R.tacticalFoundation.awarenessRadius;
        // Awareness crosses packs. Reachability, group compatibility and safe routing
        // are deliberately deferred until rogue movement is implemented.
        return this.zone()
          .enemies.filter(
            (ally) =>
              ally !== e &&
              ally.hp > 0 &&
              !ally.neutral &&
              !ally.returning &&
              !['travel', 'escape'].includes(this.tacticalRogueRegroup(ally)?.phase) &&
              dist(ally, e) <= radius,
          )
          .sort((a, b) => dist(a, e) - dist(b, e) || a.id.localeCompare(b.id));
      }

      tacticalRegroupGroups(e) {
        if (!e) return [];
        const groups = new Map();
        for (const ally of this.tacticalRegroupCandidates(e)) {
          const key = ally.pack || ally.id;
          if (!groups.has(key)) groups.set(key, { key, members: [], distance: Infinity });
          const group = groups.get(key);
          group.members.push(ally);
          group.distance = Math.min(group.distance, dist(e, ally));
        }
        // A group assessment, not a retreat destination or an order to engage.
        // Any one reachable ally can be sufficient. Favor close support first;
        // group size only breaks a proximity tie. Actual path viability is
        // checked when a specific regroup destination is requested.
        return [...groups.values()].sort(
          (a, b) =>
            a.distance - b.distance ||
            b.members.length - a.members.length ||
            a.key.localeCompare(b.key),
        );
      }

      tacticalPresentOpponents(e) {
        const radius = R.tacticalFoundation.presenceRadius;
        const party = this.activeLivingParty().filter(
          (u) => !u.order && !this.s.recallActive && dist(u, e) <= radius,
        );
        const heroHere = this.hero.hp > 0 && dist(this.hero, e) <= radius;
        return party.length + (heroHere ? 1 : 0);
      }

      tacticalLocalSupport(e) {
        return this.zone().enemies.filter(
          (ally) =>
            ally.hp > 0 &&
            !ally.neutral &&
            !ally.returning &&
            !['travel', 'escape'].includes(this.tacticalRogueRegroup(ally)?.phase) &&
            dist(ally, e) <= R.tacticalFoundation.supportRadius + 35,
        ).length;
      }

      tacticalRogueWounded(e) {
        // Bosses and captains retain their own phase/summon mechanics. Ordinary,
        // guardian and ringleader monsters can seek support when badly hurt.
        return !!(
          e &&
          e.hp > 0 &&
          e.maxHp > 0 &&
          e.type !== 'boss' &&
          !e.captain &&
          !e.roomCaptain &&
          (e.type === 'mob' || e.guard || e.form === 'ringleader') &&
          e.hp / e.maxHp < R.tacticalFoundation.woundedThreshold
        );
      }

      tacticalRogueEligibility(e, activeTargetCount = 0) {
        const config = R.tacticalFoundation;
        if (!e || !this.hero || e.hp <= 0 || this.peace) return false;
        if (this.tacticalPresentOpponents(e) === 0 && activeTargetCount === 0) return false;
        const difference = e.level - this.hero.level;
        if (difference >= config.outlevelProtection) return false;
        if (this.tacticalRogueWounded(e)) return true;
        if (difference <= -config.heroLevelDisadvantageMinimum) return true;

        const pressured = activeTargetCount >= config.simultaneousPressureSources;
        if (e.type !== 'boss' && !e.captain && !e.roomCaptain) return pressured;
        const summonProfile = e.type === 'boss' ? true : !!this.captainProfile(e)?.summon;
        if (!summonProfile || difference !== 0) return pressured;

        const living = this.zone().enemies.filter(
          (unit) => unit.summon && unit.owner === e.id && unit.hp > 0,
        ).length;
        const depleted = living <= config.summonSupportThreshold && (e.summonCd || 0) > 0;
        // Cunning status requires an explicit authored entry; no entries exist in phase one.
        const cunningKey = e.captainProfile || e.family;
        const cunning = config.cunningEnemies.includes(cunningKey);
        return depleted && (pressured || cunning);
      }

      drainMana(u, fraction) {
        if (u !== this.hero || !fraction || u.mp <= 0 || this.peace) return 0;
        const amount = Math.min(u.mp, Math.max(1, Math.round(u.maxMp * fraction)));
        u.mp = Math.max(0, u.mp - amount);
        if (amount > 0) this.event('manaDrain', { amount });
        return amount;
      }

      damage(e, amount, source = 'hero', options = null) {
        if (
          !e ||
          e.hp <= 0 ||
          e.neutral ||
          (!options?.area && !this.tacticalDirectTargetable(e)) ||
          this.peace ||
          e.returning ||
          !Number.isFinite(amount) ||
          amount <= 0
        )
          return false;
        const origin =
          source === 'hero' ? this.hero : this.s.party.find((u) => u.id === source) || this.hero;
        const normalDamageTerritory = e.type === 'boss' ? (this.isDungeon() ? 1800 : 700) : 500;
        // A valid tactical retreat moves the active encounter, not the permanent
        // spawn. Allow damage near the retreat corridor/anchor; otherwise a
        // regrouper beyond its original home leash would become invulnerable.
        const inCombatArea = this.tacticalRogueLeashAllows(
          e,
          origin,
          normalDamageTerritory,
        );
        if (!this.line(origin, e) || !inCombatArea) return false;
        e.mercyProvoked = true;
        this.engage(e, true);
        if (source === 'hero') e.heroParticipated = true;
        if (e.roomCaptain && e.captainGuard > 0) amount *= 0.7;
        if (e.roomCaptain) {
          const profile = this.captainProfile(e),
            summon = profile?.summon;
          if (summon?.guardPerSummon) {
            const living = this.captainOwnedSummons(e).length,
              guard = Math.min(summon.guardCap ?? 1, living * summon.guardPerSummon);
            amount *= 1 - guard;
          }
        }
        if (e.family === 'citadel' && e.open <= 0) amount *= 0.65;
        if (e.family === 'mine' && e.open > 0) amount *= 1.25;
        // All hero/companion damage sources use this same resolver. This
        // reduction is exclusive to active travel; it ends on arrival or abort.
        if (['thinking', 'travel', 'escape'].includes(this.tacticalRogueRegroup(e)?.phase))
          amount *= ROGUE_REGROUP_INCOMING_DAMAGE_MULTIPLIER;
        const actualDamage = Math.min(e.hp, amount);
        e.hp = Math.max(0, e.hp - amount);
        this.tacticalRecordHit(e, source, actualDamage);
        this.effects.push({ type: 'hit', x: e.x, y: e.y, amount });
        if (e.hp === 0) this.kill(e);
        return true;
      }
      hitParty(u, amount, manaDrain = 0) {
        if (this.peace || u.hp <= 0 || (u.immune || 0) > 0) return false;
        const armor =
          u === this.hero
            ? this.armor()
            : ['soldier', 'archer'].includes(u.type)
              ? this.companionArmor(u.type)
              : 5 + this.hero.level * 0.5;
        u.hp = Math.max(0, u.hp - Math.max(3, amount - armor * 0.35));
        if (u === this.hero && manaDrain > 0) this.drainMana(u, manaDrain);
        this.event('hurt', { x: u.x, y: u.y, target: u === this.hero ? 'hero' : u.id });
        if (u === this.hero && u.hp === 0) this.die();
        return true;
      }

      distanceToSegment(p, a, b) {
        const dx = b.x - a.x,
          dy = b.y - a.y,
          t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
      }
      updateProjectiles(dt) {
        const hero = this.hero;
        for (const p of [...this.s.projectiles]) {
          if (p.delay > 0) {
            p.delay -= dt;
            continue;
          }
          if (p.source === 'enemy') {
            p.life -= dt;
            const before = { x: p.x, y: p.y };
            p.x += p.dx * p.speed * dt;
            p.y += p.dy * p.speed * dt;
            if (!this.clearSegment(before, p, 0)) {
              this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
              continue;
            }
            const victim = this.combatTargets().find(
              (u) => this.distanceToSegment(u, before, p) < 22,
            );
            if (victim) {
              if (this.hitParty(victim, p.damage, p.manaDrain || 0) && p.slow)
                victim.slow = Math.max(victim.slow || 0, p.slow);
              this.event('projectileImpact', {
                actor: 'enemy',
                source: p.sourceId || 'enemy',
                species: p.species,
                style: p.style || 'arrow',
                x: victim.x,
                y: victim.y,
                target: victim === this.hero ? 'hero' : victim.id,
              });
              p.life = 0;
            }
            if (p.life <= 0 || !this.line(before, p) || this.peace)
              this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
            if (this.hero !== hero || this.s.challenge.pending || this.s.challenge.gameOver) return;
            continue;
          }
          const e = this.zone().enemies.find(
            (e) => e.id === p.target && e.hp > 0 && !e.neutral && this.tacticalDirectTargetable(e),
          );
          if (!e || this.peace) {
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
            continue;
          }
          const before = { x: p.x, y: p.y },
            d = dist(p, e),
            step = Math.min(p.speed * dt, d);
          p.dx = (e.x - p.x) / Math.max(1, d);
          p.dy = (e.y - p.y) / Math.max(1, d);
          p.x += p.dx * step;
          p.y += p.dy * step;
          if (!this.clearSegment(before, p, 0)) {
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
            continue;
          }
          if (d < step + 15) {
            const landed = this.damage(e, p.damage, p.source);
            if (landed && p.basicComboFinisher)
              this.basicComboFinisher(
                e,
                { x: p.finisherFromX, y: p.finisherFromY },
                p.finisherBaseDamage,
                p.source,
                p.comboClass || this.hero.class,
              );
            if (p.slow) e.slow = Math.max(e.slow || 0, p.slow);
            this.event('projectileImpact', {
              actor: p.source === 'hero' ? 'hero' : 'companion',
              class: p.source === 'hero' ? this.hero.class : undefined,
              role: p.source === 'hero' ? undefined : 'archer',
              source: p.source,
              style: p.style || 'arrow',
              effect: p.effect,
              slot: p.slot,
              x: e.x,
              y: e.y,
              target: e.id,
              charged: !!p.charged,
            });
            if (p.charged && (!p.rapid || p.chargedBurst))
              this.event('chargedImpact', {
                actor: 'hero',
                source: 'hero',
                x: e.x,
                y: e.y,
                class: this.hero.class,
              });
            this.s.projectiles.splice(this.s.projectiles.indexOf(p), 1);
          }
        }
        for (const a of [...this.s.hazards]) {
          a.life -= dt;
          a.tick -= dt;
          a.age = (a.age || 0) + dt;
          if (a.kind === 'ring') {
            a.radius = a.age * R.combatGeometry.ringSpeed;
            for (const u of this.combatTargets()) {
              const id = u === this.hero ? 'hero' : u.id;
              if (
                !a.hit.includes(id) &&
                Math.abs(dist(u, a) - a.radius) < R.combatGeometry.ringHalfWidth &&
                this.line(a, u)
              ) {
                a.hit.push(id);
                this.hitParty(u, a.damage, a.manaDrain || 0);
              }
            }
          } else if (a.tick <= 0) {
            a.tick = 1;
            for (const u of this.combatTargets())
              if (dist(u, a) < a.radius && this.line({ x: a.fromX ?? a.x, y: a.fromY ?? a.y }, u)) {
                this.hitParty(u, a.damage, a.manaDrain || 0);
                if (a.slow) u.slow = 3;
              }
          }
          if (a.life <= 0 || this.peace) this.s.hazards.splice(this.s.hazards.indexOf(a), 1);
          if (hero !== this.hero || this.s.challenge.pending || this.s.challenge.gameOver) return;
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(Combat.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Combat.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeCombat = api;
})(typeof window !== 'undefined' ? window : globalThis);
