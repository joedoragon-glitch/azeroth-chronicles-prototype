/* Economy policies on the shared Campaign state. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R, dungeonIds }) {
    class Economy {
      skillTrainingCost(slot, rank = this.hero.skills[slot - 1]) {
        const def = D.skills.find((s) => s[0] === slot);
        return def ? (rank ? def[5] * rank : def[3]) : 0;
      }
      equipmentCost(slot, tier, reforge = false) {
        const price = R.balance.equipment.prices[slot][tier];
        return reforge ? Math.ceil(price / R.balance.economy.reforgePriceDivisor) : price;
      }
      recruitPrice(type) {
        return R.balance.companions.recruitPrices[type];
      }
      companionRecoveryCost() {
        return R.balance.companions.recoveryCost;
      }
      creditRecoveredTribute(amount) {
        const raw = Math.max(0, amount) + (this.s.tributeRemainder || 0),
          total = Math.abs(raw - Math.round(raw)) < 1e-7 ? Math.round(raw) : raw,
          payout = this.resourceDepositReward(total);
        this.s.tributeRemainder = Math.max(0, total - payout);
        if (payout) this.grant(payout, 0);
        return payout;
      }
      depositTributeCargo(units) {
        const carriers = units.filter((u) => Number.isFinite(u.carry) && u.carry > 0),
          payout = this.creditRecoveredTribute(carriers.reduce((sum, u) => sum + u.carry, 0));
        for (const u of carriers) u.carry = 0;
        return payout;
      }
      unloadCompanyTribute(npc) {
        if (
          npc?.kind !== 'supplier' ||
          !this.zone().npcs.includes(npc) ||
          Math.hypot(npc.x - this.hero.x, npc.y - this.hero.y) > 115
        )
          return null;
        const carriers = this.s.party.filter((u) => u.carry > 0),
          payout = this.depositTributeCargo(carriers);
        for (const u of carriers) {
          if (u.order?.type === 'deposit') {
            if (u.hp <= 0 || u.active === false) {
              u.order = null;
              this.clearGatheringIntent(u);
            } else this.resumeGathering(u);
          }
        }
        if (carriers.length) {
          const message = 'Tribute delivered · ' + payout + ' crowns';
          this.say(message + '. All company cargo unloaded.');
          this.notice(message, 4, 'Includes resting and fallen companions.', 'feedback');
        }
        return payout;
      }
      companionTreatmentCost() {
        return R.balance.companions.treatmentCost;
      }
      barracksUpgradeCost() {
        return R.balance.barracks.fullUpgradeCost;
      }
      preparationTonicCost() {
        return R.balance.economy.preparationTonicCost;
      }
      travelFare(regionIndex, direction = 1) {
        // The developer sandbox must not require farming or paying for travel.
        if (this.s.mode === 'developer') return 0;
        const edge = D.regions[regionIndex].id;
        return direction === 1 && !this.s.recovery[edge] ? D.regions[regionIndex].fare : 0;
      }
      payTravelFare(amount) {
        this.hero.gold -= amount;
      }
      passageWorkQuote(direction = 1) {
        if (this.isDungeon() || direction !== 1 || this.s.mode === 'developer') return null;
        const i = this.regionIndex(),
          region = D.regions[i];
        if (!D.regions[i + 1]) return null;
        const fare = this.travelFare(i, direction),
          bosses = D.bosses.filter((b) => b.region === region.id && b.captive);
        if (
          fare <= 0 ||
          this.hero.gold >= fare ||
          !bosses.length ||
          !bosses.every((b) => this.s.rescued[b.id])
        )
          return null;
        const payment = Math.max(0, this.hero.gold);
        return { fare, payment, work: fare - payment };
      }
      deathPenaltyFraction(zone = this.s.zone) {
        if (this.s.challenge?.succession) return 0;
        const region = D.regions[this.regionIndex(zone)]?.id;
        const buildings = this.s.zones[region]?.buildings || [];
        const completed = (b) => b.kind === 'barracks' && b.progress >= 4;
        const built = buildings.filter(completed);
        const config = R.balance.economy;
        if (built.some((b) => b.full)) return config.fullBarracksDeathPenaltyFraction;
        if (built.length) return config.basicBarracksDeathPenaltyFraction;
        return config.deathPenaltyFraction;
      }
      deathPenaltyAmount() {
        if (this.hero.gold <= 0) return 0;
        return Math.ceil(this.hero.gold * this.deathPenaltyFraction());
      }
      applyDeathPenalty() {
        const lost = Math.min(Math.max(0, this.hero.gold), this.deathPenaltyAmount());
        this.hero.gold = Math.max(0, this.hero.gold - lost);
        this.depositTreasuryDeathLoss(lost);
        return lost;
      }
      spend(amount) {
        if (this.s.mode === 'arena') return true; // Arena services and upgrades are free.
        if (!Number.isFinite(amount) || amount < 0 || this.hero.gold < amount) {
          this.say('Not enough crowns.');
          if (Number.isFinite(amount) && amount >= 0)
            this.event('actionFailed', { reason: 'crowns', needed: amount });
          return false;
        }
        this.hero.gold -= amount;
        return true;
      }
      barracksRecruitPrice(type) {
        return R.balance.companions.barracksRecruitPrices[type] || 0;
      }
      barracksBuildCost() {
        return this.hasAnyBarracks() ? R.balance.barracks.buildCost : 0;
      }
      grant(gold, xp) {
        this.hero.gold += gold;
        this.s.statistics.goldEarned += gold;
        this.xp(xp);
      }
      refundCrowns(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return false;
        this.hero.gold += amount;
        return true;
      }
      expeditionSupportCost(id) {
        const def = R.expeditionSupportSkills?.[id],
          next = this.expeditionSupportRank(id) + 1;
        return def?.costs?.[next] || 0;
      }
      companionVitalityCost() {
        return R.balance.companions.vitalityCost;
      }
      talentRespecCost() {
        return R.balance.disciplines.resetCost;
      }
      rangerSupportCost(type) {
        return type === 'health'
          ? R.rangerSupport.healUpgradeCost
          : R.rangerSupport.manaUpgradeCost;
      }
    }
    for (const name of Object.getOwnPropertyNames(Economy.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Economy.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeEconomy = api;
})(typeof window !== 'undefined' ? window : globalThis);
