/* Regional recovery of actual death-penalty crowns; existing captain encounters. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R }) {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
      frames = new WeakMap();
    class Treasury {
      treasuryRecoverySite(region = this.definition().id) {
        return R.treasuryRecovery.sites.find((site) => site.region === region);
      }
      treasuryRecoveryState(region = this.definition().id) {
        this.s.treasuryRecovery ||= {};
        return (this.s.treasuryRecovery[region] ||= {
          crowns: 0,
          unlocked: false,
          respawnAt: 0,
        });
      }
      treasuryLostCrowns(region = this.definition().id) {
        return this.s.treasuryRecovery?.[region]?.crowns || 0;
      }
      depositTreasuryDeathLoss(amount) {
        if (!(amount > 0)) return;
        const region = this.definition().id,
          site = this.treasuryRecoverySite(region);
        if (!site) return;
        this.treasuryRecoveryState(region).crowns += amount;
        this.say(
          amount +
            ' lost crowns taken to ' +
            site.name +
            '. Recover them by defeating its captain.',
        );
      }
      treasuryCaptain(z, site) {
        return z.enemies.find(
          (e) => !e.summon && !e.developerSummon && e.captainProfile === site.profile,
        );
      }
      treasuryCaptainDefeated(e) {
        const site = this.treasuryRecoverySite();
        if (
          !site ||
          site.zone !== this.zoneId ||
          e.summon ||
          e.developerSummon ||
          e.captainProfile !== site.profile
        )
          return;
        const state = this.treasuryRecoveryState(site.region);
        state.unlocked = true;
        state.respawnAt = this.s.time + R.treasuryRecovery.respawnSeconds;
        if (site.region === 'frontier')
          state.cachePoint = this.treasuryRecoveryCachePoint(
            this.zone(),
            [e.x, e.y],
            'seized-crowns-frontier',
          ) || { x: e.x, y: e.y };
        const message = e.name + ' defeated · ' + state.crowns + ' crowns recoverable';
        this.say(message + '. Collect your seized crowns from the marked cache.');
        this.notice(
          message,
          6.5,
          state.crowns
            ? (site.region === 'frontier'
                ? 'Collect the seized-crowns cache dropped here. '
                : 'Collect the marked seized-crowns cache. ') +
                'Your regional balance resets only on collection.'
            : 'No death-penalty crowns are stored here yet.',
          'milestone',
        );
      }
      treasuryRespawnPoints(z, defenders) {
        const points = [];
        for (const e of defenders) {
          const radius = this.actorRadius(e),
            home = e.home || e;
          let found = null;
          for (const ring of [0, 40, 80, 120, 180]) {
            for (let j = 0; j < (ring ? 12 : 1); j++) {
              const angle = (j * Math.PI) / 6,
                p = { x: home.x + Math.cos(angle) * ring, y: home.y + Math.sin(angle) * ring };
              if (
                this.blocked(p.x, p.y, z.id, radius) ||
                [this.hero, ...this.activeLivingParty()].some(
                  (u) => dist(u, p) < radius + this.actorRadius(u) + 40,
                ) ||
                z.enemies.some(
                  (u) => u.hp > 0 && !u.neutral && dist(u, p) < radius + this.actorRadius(u) + 8,
                ) ||
                points.some((q) => dist(q, p) < radius + q.radius + 8)
              )
                continue;
              found = { ...p, radius };
              break;
            }
            if (found) break;
          }
          if (!found) return null;
          points.push(found);
        }
        return points;
      }
      treasuryRecoveryCachePoint(z, origin, id) {
        for (const radius of [0, 60, 100, 140])
          for (let j = 0; j < (radius ? 12 : 1); j++) {
            const angle = (j * Math.PI) / 6,
              candidate = {
                x: origin[0] + Math.cos(angle) * radius,
                y: origin[1] + Math.sin(angle) * radius,
              };
            if (
              this.blocked(candidate.x, candidate.y, z.id, 15) ||
              z.npcs.some((n) => n.id !== id && dist(n, candidate) < 60)
            )
              continue;
            return candidate;
          }
        return null;
      }
      respawnTreasuryDefenders(z, site, captain, state) {
        if (
          this.peace ||
          !state.respawnAt ||
          this.s.time < state.respawnAt ||
          dist(this.hero, captain.home || captain) < R.treasuryRecovery.respawnClearance ||
          z.enemies.some((e) => e.hp > 0 && e.aggro)
        )
          return;
        const defenders = z.enemies.filter(
            (e) =>
              !e.summon &&
              !e.developerSummon &&
              e.hp <= 0 &&
              (e === captain || (site.zone !== 'frontier' && e.roomGuard && !e.reinforcement)),
          ),
          points = this.treasuryRespawnPoints(z, defenders);
        if (!points) return;
        for (const [i, old] of defenders.entries()) {
          const fresh = this.makeEnemy(
            {
              species: old.species,
              name: old.name,
              icon: old.icon,
              level: old.level,
              hp: old.baseHp,
              damage: old.baseDamage,
              gold: 0,
              xp: 0,
            },
            points[i],
          );
          fresh.id = old.id;
          fresh.home = { x: points[i].x, y: points[i].y };
          for (const key of Object.keys(old))
            if (
              /Version$/.test(key) ||
              [
                'guard',
                'roomGuard',
                'roomCaptain',
                'fieldCaptain',
                'captain',
                'captainProfile',
                'captainMentor',
                'captainVisualIdol',
                'visualScale',
                'pack',
                'forcedRole',
                'ranged',
                'hybrid',
                'shotRange',
                'shotSpeed',
                'projectileStyle',
                'mountedCrownRider',
                'crownTroop',
                'crownAncestry',
              ].includes(key)
            )
              fresh[key] = old[key];
          fresh.specialCd = fresh.captain ? 1.25 : 0;
          fresh.treasuryReinforcement = true;
          z.enemies[z.enemies.indexOf(old)] = fresh;
          this.tacticalClearThreat(old);
          this.tacticalClearBurst(old);
          this.tacticalClearRogueRegroup(old);
        }
        state.unlocked = false;
        state.respawnAt = 0;
        z.enemies = z.enemies.filter((e) => !(e.summon && e.owner === captain.id));
      }
      syncTreasuryRecovery(z) {
        const site = R.treasuryRecovery.sites.find((site) => site.zone === z.id);
        if (!site) return;
        const state = this.treasuryRecoveryState(site.region),
          cached = frames.get(z);
        if (
          cached &&
          cached.until > this.s.time &&
          cached.crowns === state.crowns &&
          cached.unlocked === state.unlocked &&
          cached.respawnAt === state.respawnAt &&
          cached.cachePoint === state.cachePoint &&
          cached.enemies === z.enemies
        )
          return;
        const captain = this.treasuryCaptain(z, site);
        if (this.peace) state.unlocked = true;
        else if (captain?.hp <= 0) {
          // Existing v4 saves can already contain a defeated captain.
          if (!state.unlocked && !state.respawnAt) {
            state.unlocked = true;
            state.respawnAt = this.s.time + R.treasuryRecovery.respawnSeconds;
          }
          this.respawnTreasuryDefenders(z, site, captain, state);
        }
        const id = 'seized-crowns-' + site.region;
        let cache = z.npcs.find((n) => n.id === id);
        if (site.region === 'frontier' && state.cachePoint && cache)
          Object.assign(cache, state.cachePoint);
        if (
          !cache &&
          state.crowns > 0 &&
          (site.region !== 'frontier' || state.cachePoint || this.peace)
        ) {
          const p = state.cachePoint || this.treasuryRecoveryCachePoint(z, site.point, id);
          if (!p) return;
          cache = {
            id,
            kind: 'bundle',
            treasuryRecovery: true,
            region: site.region,
            x: p.x,
            y: p.y,
            icon: '📦',
          };
          z.npcs.push(cache);
        }
        if (cache) cache.name = 'Seized crowns · ' + state.crowns + ' to recover';
        frames.set(z, { until: this.s.time + 0.25, ...state, enemies: z.enemies });
      }
      collectTreasuryRecovery(npc) {
        const site = this.treasuryRecoverySite(),
          z = this.zone(),
          actual = z.npcs.find((n) => n.id === npc?.id && n.treasuryRecovery === true);
        if (
          !site ||
          site.zone !== this.zoneId ||
          !actual ||
          actual.region !== site.region ||
          dist(actual, this.hero) > 115
        )
          return false;
        const state = this.treasuryRecoveryState(site.region),
          captain = this.treasuryCaptain(z, site);
        if (!this.peace && (!state.unlocked || !captain || captain.hp > 0)) {
          this.say(
            'Defeat ' +
              (captain?.name || 'the regional captain') +
              ' before recovering your seized crowns.',
          );
          return false;
        }
        const amount = state.crowns;
        if (!amount) {
          this.say('No lost crowns remain in this regional Treasury.');
          return false;
        }
        if (!this.refundCrowns(amount)) return false;
        state.crowns = 0;
        this.event('treasuryRecovery', { region: site.region, gold: amount });
        const message = 'Recovered ' + amount + ' lost crowns';
        this.say(message + ". This region's Treasury recovery balance is now 0.");
        this.notice(
          message,
          6,
          'Regional recovery balance: 0 crowns. Future death losses accumulate here again.',
          'milestone',
        );
        return true;
      }
    }
    for (const name of Object.getOwnPropertyNames(Treasury.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Treasury.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeTreasury = api;
})(typeof window !== 'undefined' ? window : globalThis);
