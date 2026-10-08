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
        const edge = D.regions[regionIndex].id;
        return direction === 1 && !this.s.recovery[edge] ? D.regions[regionIndex].fare : 0;
      }
      payTravelFare(amount) {
        this.hero.gold -= amount;
      }
      deathPenaltyAmount() {
        return this.hero.gold > 0
          ? Math.ceil(this.hero.gold * R.balance.economy.deathPenaltyFraction)
          : 0;
      }
      applyDeathPenalty() {
        const lost = this.deathPenaltyAmount();
        this.hero.gold = Math.max(0, this.hero.gold - lost);
        return lost;
      }
      spend(amount) {
        if (!Number.isFinite(amount) || amount < 0 || this.hero.gold < amount) {
          this.say('Not enough crowns.');
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
