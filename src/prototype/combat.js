/* Shared combat targets, damage, mana drain, segment geometry, projectiles and hazards. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
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
              !ally.summon &&
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

      tacticalRogueEligibility(e, activeTargetCount = 0) {
        const config = R.tacticalFoundation;
        if (!e || !this.hero || this.hero.hp <= 0 || e.hp <= 0) return false;
        const difference = e.level - this.hero.level;
        if (difference >= config.outlevelProtection) return false;
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

      damage(e, amount, source = 'hero') {
        if (
          !e ||
          e.hp <= 0 ||
          e.neutral ||
          this.peace ||
          e.returning ||
          !Number.isFinite(amount) ||
          amount <= 0
        )
          return false;
        const origin =
          source === 'hero' ? this.hero : this.s.party.find((u) => u.id === source) || this.hero;
        if (
          !this.line(origin, e) ||
          dist(origin, e.home) > (e.type === 'boss' ? (this.isDungeon() ? 1800 : 700) : 500)
        )
          return false;
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
          const e = this.zone().enemies.find((e) => e.id === p.target && e.hp > 0 && !e.neutral);
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
