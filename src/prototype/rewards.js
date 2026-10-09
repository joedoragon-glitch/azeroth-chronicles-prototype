/* Rewards policies on the shared Campaign state. */
(function (root) {
  'use strict';
  const Narration =
    typeof PrototypeNarration !== 'undefined' ? PrototypeNarration : require('./narration.js');
  function install(Campaign, { D, R, dungeonIds }) {
    class Rewards {
      regionalEnemyRewards(regionIndex, kind = 'ordinary') {
        const r = D.regions[regionIndex],
          mean = (r.gold_range[0] + r.gold_range[1]) / 2;
        if (kind === 'fieldCaptain')
          return {
            gold: Math.round(mean * R.balance.rewards.fieldCaptainCrownsMultiplier),
            xp: Math.round(r.enemy_xp * R.balance.rewards.fieldCaptainXpMultiplier),
          };
        if (kind === 'roomGuard')
          return {
            gold: Math.max(1, Math.floor(mean * R.balance.rewards.roomGuardCrownsFraction)),
            xp: r.guard_xp,
          };
        return {
          gold: kind === 'night' ? r.gold_range[0] : Math.floor(mean),
          xp: kind === 'guard' ? r.guard_xp : r.enemy_xp,
        };
      }
      bossRewards(b, form) {
        if (form !== 'true') return { gold: b.gold, xp: b.xp };
        if (b.kind === 'dungeon' && this.s.phase !== 'adventure') {
          const i = dungeonIds.indexOf(b.id);
          return {
            gold: R.balance.rewards.awakenedBossCrowns[i],
            xp: R.balance.rewards.awakenedBossXp[i],
          };
        }
        return {
          gold: b.gold * R.balance.rewards.trueBossMultiplier,
          xp: b.xp * R.balance.rewards.trueBossMultiplier,
        };
      }
      ringleaderRewards(base) {
        return {
          gold: base.gold * R.balance.rewards.ringleaderMultiplier,
          xp: base.xp * R.balance.rewards.ringleaderMultiplier,
        };
      }
      dungeonClearReward(id) {
        return R.balance.rewards.dungeonClearCrowns[dungeonIds.indexOf(id)];
      }
      resourceDepositReward(carry) {
        return Math.floor(carry + 1e-7);
      }
      awardEnemyReward(e) {
        const r = this.enemyReward(e);
        if (r.gold > 0)
          this.s.loot.push({
            id: 'loot-' + this.s.nextId++,
            zone: this.s.zone,
            x: e.x,
            y: e.y,
            gold: r.gold,
          });
        this.xp(r.xp);
      }
      guardianRewards(z) {
        if (z.guardRewardsVersion === 2) return;
        z.guardRewardsVersion = 2;
        for (const e of z.enemies.filter((e) => e.guard)) {
          e.gold = 0;
          e.xp = 0;
        }
        for (const p of Object.values(this.s.pending))
          if (p.kind === 'mob' && p.zone === z.id && p.base.guard) {
            p.base.gold = 0;
            p.base.xp = 0;
          }
      }
      payQuest(q, p) {
        if (!q || !p?.done || p.paid || p.closedByPeace) return false;
        p.paid = true;
        p.active = false;
        if (q.kind === 'barracks')
          this.say('First Barracks established. You now have a field base for companion recovery.');
        else {
          this.grant(q.gold, q.xp);
          this.say(
            q.name + ' complete. Reward delivered: ' + q.gold + ' crowns and ' + q.xp + ' XP.',
          );
          // The paid flag already persists in v4 saves: no second narrative flag or replay.
          const index = Number(q.id.slice('quest-'.length));
          const payoff = Number.isInteger(index) ? Narration[index] : null;
          if (payoff && (payoff.kind === 'narration' || payoff.kind === 'milestone'))
            this.notice(payoff.text, payoff.kind === 'milestone' ? 5.5 : 6.8, '', payoff.kind);
        }
        this.event('questComplete', { id: q.id });
        this.event('quest', { id: q.id, automatic: true });
        return true;
      }
      reward(gold, xp, level) {
        const gap = Math.max(0, this.hero.level - level),
          m =
            R.progression.levelGapRewards[Math.min(gap, R.progression.levelGapRewards.length - 1)];
        return { gold: Math.floor(gold * m), xp: Math.floor(xp * m) };
      }
      enemyReward(e) {
        const ordinary =
          e.type === 'mob' && !e.guard && !e.captain && !e.roomCaptain && e.form === 'normal';
        return this.reward(
          e.gold,
          e.xp * (ordinary ? R.progression.ordinaryXpMultiplier : 1),
          e.level,
        );
      }
    }
    for (const name of Object.getOwnPropertyNames(Rewards.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Rewards.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRewards = api;
})(typeof window !== 'undefined' ? window : globalThis);
