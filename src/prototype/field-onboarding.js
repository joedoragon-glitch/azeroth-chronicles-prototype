/* Opening-field protection. Combat owners still resolve every admitted hit and reset. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class FieldOnboarding {
      syncThornArrival(z) {
        if (z.id !== 'vale') return;
        // Preserve established encounters on imported v4 campaigns. New runs
        // explicitly start false; only native evidence can grandfather old ones.
        if (this.s.thornHeroInitiated === undefined)
          this.s.thornHeroInitiated = !!(
            this.s.normal.thorn ||
            this.s.true.thorn ||
            this.s.keys.thorn ||
            this.s.rescued.thorn ||
            this.s.fieldBossKills?.thorn ||
            z.enemies.some((e) => e.family === 'thorn' && e.type === 'boss' && e.heroParticipated)
          );
        if (this.peace) return;
        if (
          this.hero.level < R.fieldOnboarding.spawnLevel &&
          !this.s.thornHeroInitiated &&
          !this.s.keys.thorn &&
          !this.s.rescued.thorn
        ) {
          const boss = z.enemies.find((e) => e.family === 'thorn' && e.type === 'boss' && e.hp > 0),
            captive = z.npcs.find((n) => n.id === 'cage-thorn');
          if (!z.thornArrival && boss && captive) {
            z.thornArrival = { boss, captive };
            z.enemies = z.enemies.filter((e) => e !== boss && !(e.summon && e.owner === boss.id));
            z.npcs = z.npcs.filter((n) => n !== captive);
          }
        } else if (z.thornArrival) {
          const { boss, captive } = z.thornArrival;
          if (!z.enemies.some((e) => e.id === boss.id)) z.enemies.push(boss);
          if (!this.s.rescued.thorn && !z.npcs.some((n) => n.id === captive.id))
            z.npcs.push(captive);
          delete z.thornArrival;
        }
      }
      openingThornOwner(e) {
        if (e?.type === 'boss' && e.family === 'thorn') return e;
        if (!e?.summon) return null;
        return (
          this.s.zones.vale?.enemies.find(
            (b) => b.id === e.owner && b.type === 'boss' && b.family === 'thorn',
          ) || null
        );
      }
      awaitsHeroAttack(e) {
        if (this.zoneId !== 'vale' || this.peace || !e || e.neutral || e.hp <= 0) return false;
        const thorn = this.openingThornOwner(e);
        if (thorn) return !this.s.thornHeroInitiated && (thorn === e || !e.introHeroProvoked);
        return !this.s.valeFieldAwakened && !e.introHeroProvoked;
      }
      admitOpeningHeroAttack(e) {
        if (!this.awaitsHeroAttack(e)) return;
        const thorn = this.openingThornOwner(e);
        if (thorn === e) {
          this.s.thornHeroInitiated = true;
          delete e.thornIntroRetreat;
          delete e.path;
        } else e.introHeroProvoked = true;
      }
      openingCompanionHit(e) {
        if (!this.awaitsHeroAttack(e)) return false;
        const thorn = this.openingThornOwner(e);
        if (thorn) {
          if (thorn.thornIntroRetreat !== undefined) return true;
          const party = [this.hero, ...this.activeLivingParty()],
            route = R.thornPatrol.route,
            choices = route
              .map(([x, y], leg) => ({
                x,
                y,
                leg,
                distance: Math.min(...party.map((u) => dist(u, { x, y }))),
              }))
              .filter(
                (p) =>
                  p.distance >= R.fieldOnboarding.withdrawClearance &&
                  !this.blocked(p.x, p.y),
              )
              // The original highest-priority reachable leg remains the
              // winner. Test the farthest safe choices first, instead of
              // synchronously routing to every eligible patrol destination.
              .sort((a, b) => b.distance - a.distance || a.leg - b.leg);
          const goal = choices.find((p) => this.route(thorn, p, { reachabilityOnly: true }).length);
          if (goal) {
            this.cancelEncounter(thorn);
            thorn.aggro = false;
            thorn.returning = 0;
            delete thorn.thornReturn;
            delete thorn.path;
            thorn.routeAge = 0;
            thorn.thornIntroRetreat = goal.leg;
            this.releasePatrolResume(thorn);
          }
        } else if (!e.returning) this.disengage(e, 0);
        return true;
      }
      updateOpeningRetreat(e, dt) {
        if (e.thornIntroRetreat === undefined) return false;
        if (!this.awaitsHeroAttack(e)) {
          delete e.thornIntroRetreat;
          delete e.path;
          return false;
        }
        const cfg = R.thornPatrol,
          leg = e.thornIntroRetreat,
          [x, y] = cfg.route[leg],
          captive = this.thornCaptive(),
          together =
            !captive || !this.thornCaptiveFollowing() || dist(captive, e) <= cfg.waitForCaptive;
        e.aggro = false;
        if (together) this.follow(e, { x, y }, cfg.speed, dt, cfg.arrival, 'thorn-retreat');
        if (dist(e, { x, y }) > cfg.arrival + 1e-7 || !together) return true;
        this.cancelEncounter(e);
        e.hp = e.maxHp;
        e.frozen = false;
        e.heroParticipated = false;
        e.mercyProvoked = false;
        e.noProgress = 0;
        e.thornLeg = (leg + cfg.direction + cfg.route.length) % cfg.route.length;
        e.thornPause = cfg.pause;
        delete e.thornIntroRetreat;
        delete e.path;
        return true;
      }
    }
    for (const name of Object.getOwnPropertyNames(FieldOnboarding.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(FieldOnboarding.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeFieldOnboarding = api;
})(typeof window !== 'undefined' ? window : globalThis);
