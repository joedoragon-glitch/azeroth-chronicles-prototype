/* Hero growth, specialist curricula, equipment and companion inheritance. No browser state. */
(function (root) {
  'use strict';
  function install(
    Campaign,
    { D, R, classes, talentProfiles, talentMaxRanks, ceilings, expeditionCeilings, legacyWeapons },
  ) {
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class Progression {
      talentProfile() {
        return talentProfiles[this.hero.class];
      }
      talentMaxRank(i) {
        return Number.isInteger(i) && i >= 0 && i < talentMaxRanks.length ? talentMaxRanks[i] : 0;
      }
      heroNaturalMaxHp() {
        return classes[this.hero.class].hp + R.balance.growth.hpPerLevel * (this.hero.level - 1);
      }
      heroTalentHpBonus() {
        return (this.hero.talents?.[2] || 0) * this.talentProfile().hp;
      }
      heroTalentDamageBonus() {
        return (this.hero.talents?.[0] || 0) * this.talentProfile().power;
      }
      heroTalentSpeedBonus() {
        return (this.hero.talents?.[3] || 0) * this.talentProfile().speed;
      }
      heroOtherHpBonus() {
        return Math.max(0, this.hero.maxHp - this.heroNaturalMaxHp() - this.heroTalentHpBonus());
      }
      heroOtherDamageBonus() {
        return Math.max(
          0,
          this.power() - classes[this.hero.class].power - this.heroTalentDamageBonus(),
        );
      }
      heroEquipmentArmorBonus() {
        return Math.max(0, this.armor() - this.hero.armor);
      }
      expeditionSupportRank(id) {
        return this.s.expeditionSkills?.[id] || 0;
      }
      expeditionSupportFraction(id) {
        const def = R.expeditionSupportSkills?.[id];
        return def ? this.expeditionSupportRank(id) / def.maxRank : 0;
      }
      companionInheritedHpBonus() {
        return Math.round(
          this.heroTalentHpBonus() * this.expeditionSupportFraction('sharedTraining') +
            this.heroOtherHpBonus() * this.expeditionSupportFraction('sharedStrength'),
        );
      }
      companionInheritedDamageBonus() {
        return Math.round(
          this.heroTalentDamageBonus() * this.expeditionSupportFraction('sharedTraining') +
            this.heroOtherDamageBonus() * this.expeditionSupportFraction('sharedStrength'),
        );
      }
      companionInheritedSpeedBonus() {
        return this.heroTalentSpeedBonus() * this.expeditionSupportFraction('sharedTraining');
      }
      companionMoveSpeed(base) {
        return base + this.companionInheritedSpeedBonus();
      }
      companionInheritedArmorBonus() {
        return this.heroEquipmentArmorBonus() * this.expeditionSupportFraction('sharedStrength');
      }
      companionVitalityRank() {
        return this.s.companionVitalityRank || 0;
      }
      companionVitalityFraction() {
        return this.companionVitalityRank() * R.balance.companions.vitalityPerRank;
      }
      companionMaxHp(type, level = this.hero.level) {
        const base = R.balance.companions.hp[type];
        if (!base) throw Error('Unknown companion type');
        const raw =
          base +
          R.balance.companions.hpPerLevel * Math.max(0, level - 1) +
          this.companionInheritedHpBonus();
        return Math.round(raw * (1 + this.companionVitalityFraction()));
      }
      companionArmor(type) {
        const base = R.balance.companions.armor[type];
        if (base === undefined) throw Error('Unknown companion type');
        return base + this.companionInheritedArmorBonus();
      }
      syncCompanionLevelStats() {
        for (const u of this.s.party) {
          if (!['soldier', 'archer'].includes(u.type)) continue;
          const next = this.companionMaxHp(u.type),
            gain = next - u.maxHp;
          u.maxHp = next;
          if (u.hp > 0 && gain !== 0) u.hp = clamp(u.hp + gain, 1, next);
        }
      }
      expeditionPartyCap(rank = this.s.expeditionRank || 1) {
        return R.balance.companions.activeCaps[clamp(rank, 1, 6)];
      }
      expeditionInstructorCap(family) {
        return expeditionCeilings[family] || 0;
      }
      expeditionNextInstructor(rank = this.s.expeditionRank || 1) {
        return Object.keys(expeditionCeilings).find((id) => expeditionCeilings[id] > rank) || null;
      }
      expeditionUnlock(rank) {
        return (
          {
            2: 'Recruitment + resources · active group 3',
            3: 'Manual squad doctrine',
            4: 'Full Barracks upgrade · active group 4',
            5: 'Active group 5',
            6: 'Active group 6',
          }[rank] || ''
        );
      }
      expeditionTrainer() {
        return (
          Object.keys(expeditionCeilings)
            .filter(
              (id) => this.s.rescued[id] && expeditionCeilings[id] > (this.s.expeditionRank || 1),
            )
            .sort((a, b) => expeditionCeilings[a] - expeditionCeilings[b])[0] || null
        );
      }
      trainExpedition(family) {
        const cap = this.expeditionInstructorCap(family),
          rank = this.s.expeditionRank || 1;
        if (!this.s.rescued[family] || !cap || rank >= cap || rank >= 6) return false;
        this.s.expeditionRank = rank + 1;
        this.say(
          'Expedition Skill rank ' +
            this.s.expeditionRank +
            ' learned. ' +
            this.expeditionUnlock(this.s.expeditionRank) +
            '.',
        );
        this.notice(
          'EXPEDITION ' +
            this.s.expeditionRank +
            ' · ' +
            this.expeditionUnlock(this.s.expeditionRank),
          5.5,
        );
        this.event('expeditionRank', { rank: this.s.expeditionRank, family });
        return true;
      }
      teacherCatalog(family) {
        return R.teachers[family] || null;
      }
      skillRevealed(slot) {
        const def = D.skills.find((s) => s[0] === slot);
        return (
          !!def &&
          (slot === 1 ||
            !!this.hero.skills[slot - 1] ||
            !!this.s.rescued[def[4]] ||
            !!this.s.zones[this.boss(def[4]).region])
        );
      }
      learn(slot, family) {
        const def = D.skills.find((s) => s[0] === slot),
          index = slot - 1;
        if (
          !def ||
          this.hero.skills[index] ||
          def[4] !== family ||
          !this.teacherCatalog(family)?.learn.includes(slot) ||
          !this.s.rescued[family]
        ) {
          this.say('Learning requires the correct rescued teacher and an unlearned skill.');
          return false;
        }
        if (!this.spend(this.skillTrainingCost(slot, 0))) {
          this.say('Not enough crowns to learn ' + def[1] + '.');
          return false;
        }
        this.hero.skills[index] = 1;
        if (slot === 2) this.s.companionCombatTraining = 2;
        this.say(
          def[1] +
            ' learned · Rank 1.' +
            (slot === 2
              ? ' Companion training advanced: Soldiers learned Holy Cleave; Archers learned Piercing Volley.'
              : ''),
        );
        this.notice(
          def[1].toUpperCase() + ' · RANK 1' + (slot === 2 ? ' · COMPANION SKILLS UNLOCKED' : ''),
          5,
        );
        this.event('learning', { slot });
        return true;
      }
      upgrade(slot, family) {
        const def = D.skills.find((s) => s[0] === slot),
          rank = this.hero.skills[slot - 1],
          next = rank + 1;
        if (
          !def ||
          !rank ||
          !this.teacherCatalog(family)?.train.includes(slot) ||
          !this.s.rescued[family] ||
          next > (this.teacherCatalog(family)?.maxRank || 0)
        ) {
          this.say('The rescued teacher or learned skill cannot support that rank.');
          return false;
        }
        if (!this.spend(this.skillTrainingCost(slot, rank))) {
          this.say('Not enough crowns to upgrade ' + def[1] + ' to Rank ' + next + '.');
          return false;
        }
        this.hero.skills[slot - 1] = next;
        this.say(def[1] + ' upgraded · Rank ' + next + '.');
        this.notice(def[1].toUpperCase() + ' · RANK ' + next, 4.5);
        this.event('upgrade', { slot, rank: next });
        return true;
      }

      expeditionSupportTrainerCap(id, family) {
        return R.expeditionSupportSkills?.[id]?.trainers?.[family] || 0;
      }
      expeditionSupportBestTrainer(id) {
        const rank = this.expeditionSupportRank(id),
          def = R.expeditionSupportSkills?.[id];
        if (!def) return null;
        const capable = Object.entries(def.trainers || {})
          .filter(([family, cap]) => this.s.rescued[family] && cap > rank)
          .sort((a, b) => a[1] - b[1]);
        return capable.at(-1)?.[0] || null;
      }
      trainExpeditionSupport(id, family) {
        const def = R.expeditionSupportSkills?.[id],
          rank = this.expeditionSupportRank(id),
          next = rank + 1,
          cap = this.expeditionSupportTrainerCap(id, family);
        if (!def || !this.s.rescued[family] || !cap || next > cap || next > def.maxRank)
          return false;
        const cost = this.expeditionSupportCost(id);
        if (!this.spend(cost)) return false;
        this.s.expeditionSkills[id] = next;
        this.syncCompanionLevelStats();
        const pct = Math.round(this.expeditionSupportFraction(id) * 100);
        this.say(
          def.name +
            ' rank ' +
            next +
            ' learned · companions inherit ' +
            pct +
            '% of ' +
            (id === 'sharedTraining'
              ? 'applicable discipline-training HP, damage and movement speed'
              : 'bonus HP, damage and armor') +
            '.',
        );
        this.notice(def.name.toUpperCase() + ' ' + next + ' · ' + pct + '% inheritance', 5.5);
        this.event('expeditionSupport', { id, rank: next, family });
        return true;
      }

      xpRequired(level = this.hero.level) {
        return R.balance.growth.xpPerLevel * level;
      }
      xp(amount) {
        this.hero.xp += amount;
        while (this.hero.xp >= this.xpRequired()) {
          this.hero.xp -= this.xpRequired();
          this.hero.level++;
          this.hero.maxHp += R.balance.growth.hpPerLevel;
          this.hero.maxMp += R.manaBalance.perLevel;
          this.hero.hp = this.hero.maxHp;
          this.hero.mp = this.hero.maxMp;
          this.syncCompanionLevelStats();
          delete this.hero.potionEffect;
          this.hero.talentPoints++;
          this.event('level', { level: this.hero.level });
          this.say(
            'Level ' +
              this.hero.level +
              '! Training point available — press C or use Discipline Training.',
          );
          this.notice('LEVEL ' + this.hero.level + ' · Training point available', 5.5);
        }
      }

      trainCompanionVitality(family = 'archive') {
        if (family !== 'archive' || !this.s.rescued.archive) return false;
        const cost = this.companionVitalityCost();
        if (!this.spend(cost)) return false;
        this.s.companionVitalityRank = this.companionVitalityRank() + 1;
        this.syncCompanionLevelStats();
        const pct = this.companionVitalityRank() * 10;
        this.say(
          'Companion Vitality rank ' +
            this.companionVitalityRank() +
            ' learned · companion max HP +' +
            pct +
            '%.',
        );
        this.notice(
          'COMPANION VITALITY ' + this.companionVitalityRank() + ' · +' + pct + '% HP',
          5.5,
        );
        this.event('companionVitality', { rank: this.companionVitalityRank(), family });
        return true;
      }

      talentSpent() {
        return (this.hero.talents || []).reduce((n, v) => n + v, 0);
      }
      applyTalentReset() {
        const spent = this.talentSpent();
        if (!spent) return 0;
        const hpBonus = this.heroTalentHpBonus(),
          missing = Math.max(0, this.hero.maxHp - this.hero.hp),
          alive = this.hero.hp > 0;
        this.hero.maxHp = Math.max(1, this.hero.maxHp - hpBonus);
        this.hero.hp = alive ? Math.max(1, this.hero.maxHp - missing) : 0;
        this.hero.talents = [0, 0, 0, 0];
        this.hero.talentPoints += spent;
        this.syncCompanionLevelStats();
        return spent;
      }
      freeResetTalents() {
        if ((this.hero.freeTalentResets || 0) <= 0) return false;
        const spent = this.talentSpent();
        if (!spent) return false;
        this.hero.freeTalentResets--;
        this.applyTalentReset();
        this.say(
          'Discipline training reset for free · ' +
            spent +
            ' training point' +
            (spent === 1 ? '' : 's') +
            ' refunded · ' +
            this.hero.freeTalentResets +
            ' free reset' +
            (this.hero.freeTalentResets === 1 ? '' : 's') +
            ' left.',
        );
        this.notice('FREE TRAINING RESET · ' + this.hero.freeTalentResets + ' LEFT', 5.5);
        this.event('talentRespec', {
          points: spent,
          free: true,
          remaining: this.hero.freeTalentResets,
        });
        return true;
      }
      resetTalents(family = 'archive') {
        if (family !== 'archive' || !this.s.rescued.archive) return false;
        const spent = this.talentSpent();
        if (!spent || !this.spend(this.talentRespecCost())) return false;
        this.applyTalentReset();
        this.say(
          'Discipline training reset · ' +
            spent +
            ' training point' +
            (spent === 1 ? '' : 's') +
            ' refunded.',
        );
        this.notice(
          'TRAINING RESET · ' + spent + ' point' + (spent === 1 ? '' : 's') + ' refunded',
          5.5,
        );
        this.event('talentRespec', { points: spent, family, free: false });
        return true;
      }
      rangerSupportRank(type) {
        const key = type === 'health' ? 'heal' : 'mana';
        return this.s.rangerSupport?.[key] || 1;
      }
      rangerSupportAmount(type) {
        const rank = this.rangerSupportRank(type),
          values = type === 'health' ? R.rangerSupport.healAmounts : R.rangerSupport.manaAmounts;
        return values[Math.min(values.length, rank) - 1];
      }

      trainRangerSupport(type, family = 'archive') {
        if (family !== 'archive' || !this.s.rescued.archive || !['health', 'mana'].includes(type))
          return false;
        const key = type === 'health' ? 'heal' : 'mana',
          rank = this.rangerSupportRank(type);
        if (rank >= 2) {
          this.say(
            (type === 'health' ? 'Ranger Heal' : 'Ranger Mana Recovery') +
              ' is already at maximum training.',
          );
          return false;
        }
        const cost = this.rangerSupportCost(type);
        if (!this.spend(cost)) return false;
        this.s.rangerSupport[key] = 2;
        const amount = this.rangerSupportAmount(type);
        this.say(
          (type === 'health' ? 'Ranger Heal' : 'Ranger Mana Recovery') +
            ' upgraded · restores ' +
            amount +
            ' ' +
            (type === 'health' ? 'HP to the active party' : 'MP to the hero') +
            ' over five seconds.',
        );
        this.notice((type === 'health' ? 'RANGER HEAL' : 'MANA RECOVERY') + ' · RANK 2', 4.5);
        this.event('rangerSupportTraining', { type, rank: 2 });
        return true;
      }
      weaponTierBonus(tier = this.hero.weapon) {
        return (
          R.balance.equipment.bonuses.weapon[tier] +
          (this.hero.reforges['weapon:' + tier] ? R.balance.equipment.reforgeBonus.weapon : 0)
        );
      }
      bestLegacyWeapon() {
        let bestName = '',
          bestPower = 0;
        for (const name of this.s.legacyInventory || []) {
          const power = legacyWeapons[name] || 0;
          if (power > bestPower) {
            bestName = name;
            bestPower = power;
          }
        }
        return { name: bestName, power: bestPower };
      }
      autoEquipBestWeapon() {
        if (!Array.isArray(this.s.legacyInventory) && this.hero.legacyEquipped === undefined)
          return 'tier';
        const legacy = this.bestLegacyWeapon(),
          tierPower = this.weaponTierBonus();
        if (legacy.power > tierPower) {
          this.hero.legacyWeaponPower = legacy.power;
          this.hero.legacyWeaponName = legacy.name;
          this.hero.legacyEquipped = true;
        } else this.hero.legacyEquipped = false;
        return this.hero.legacyEquipped ? 'legacy' : 'tier';
      }
      gear(family, slot, reforge = false) {
        const tier = R.balance.equipment.tiers[family];
        if (!tier || !this.s.rescued[family] || !['weapon', 'armor'].includes(slot)) return false;
        const old = slot === 'weapon' ? this.hero.weapon : this.hero.armorTier,
          bonuses =
            slot === 'weapon'
              ? R.balance.equipment.bonuses.weapon
              : R.balance.equipment.bonuses.armor,
          reforgeBonus = R.balance.equipment.reforgeBonus[slot],
          key = slot + ':' + tier,
          label = slot === 'weapon' ? 'Weapon' : 'Armor';
        if (reforge) {
          if (old < tier) {
            this.say('Buy ' + label.toLowerCase() + ' tier ' + tier + ' before reforging it.');
            return false;
          }
          if (old > tier) {
            this.say(
              label +
                ' tier ' +
                tier +
                ' has been surpassed by tier ' +
                old +
                ' and can no longer be reforged here.',
            );
            return false;
          }
          if (this.hero.reforges[key]) {
            this.say(
              label +
                ' tier ' +
                tier +
                ' is already reforged. This smith has nothing more to add to it.',
            );
            return false;
          }
          if (!this.spend(this.equipmentCost(slot, tier, true))) {
            this.say('Not enough crowns to reforge ' + label.toLowerCase() + ' tier ' + tier + '.');
            return false;
          }
          this.hero.reforges[key] = true;
          this.say(
            label +
              ' tier ' +
              tier +
              ' reforged · +' +
              reforgeBonus +
              ' ' +
              (slot === 'weapon' ? 'power' : 'armor') +
              '.',
          );
          this.notice(label.toUpperCase() + ' TIER ' + tier + ' · REFORGED', 4.5);
        } else {
          if (old >= tier) {
            this.say(
              old === tier
                ? label + ' tier ' + tier + ' already owned. Tier purchases are one-time.'
                : label +
                    ' tier ' +
                    tier +
                    ' already surpassed by your tier ' +
                    old +
                    ' ' +
                    slot +
                    '.',
            );
            return false;
          }
          if (!this.spend(this.equipmentCost(slot, tier))) {
            this.say('Not enough crowns for ' + label.toLowerCase() + ' tier ' + tier + '.');
            return false;
          }
          this.hero[slot === 'weapon' ? 'weapon' : 'armorTier'] = tier;
          this.say(
            label +
              ' upgraded to tier ' +
              tier +
              ' · +' +
              bonuses[tier] +
              ' ' +
              (slot === 'weapon' ? 'power' : 'armor') +
              '.',
          );
          this.notice(label.toUpperCase() + ' · TIER ' + tier, 4.5);
        }
        if (slot === 'weapon') this.autoEquipBestWeapon();
        this.event('purchase', { slot, tier, reforge });
        return true;
      }
      equipLegacy(name) {
        if (!legacyWeapons[name] || !this.s.legacyInventory?.includes(name)) return false;
        this.hero.legacyWeaponPower = legacyWeapons[name];
        this.hero.legacyWeaponName = name;
        this.hero.legacyEquipped = true;
        return true;
      }
      power() {
        if (this.hero.legacyEquipped)
          return (
            this.hero.power + (this.hero.legacyWeaponPower || 0) + this.heroTalentDamageBonus()
          );
        return (
          this.hero.power +
          (this.hero.weapon ? 0 : this.hero.legacyWeaponPower || 0) +
          R.balance.equipment.bonuses.weapon[this.hero.weapon] +
          (this.hero.reforges['weapon:' + this.hero.weapon]
            ? R.balance.equipment.reforgeBonus.weapon
            : 0) +
          this.heroTalentDamageBonus()
        );
      }
      armor() {
        return (
          this.hero.armor +
          R.balance.equipment.bonuses.armor[this.hero.armorTier] +
          (this.hero.reforges['armor:' + this.hero.armorTier]
            ? R.balance.equipment.reforgeBonus.armor
            : 0)
        );
      }
      expectedMaxMp() {
        return classes[this.hero.class].mp + R.manaBalance.perLevel * (this.hero.level - 1);
      }
      normalizeManaProgression(force = false) {
        if (!force && this.s.manaBalanceVersion === 1) return;
        const oldMax = Math.max(1, this.hero.maxMp || classes[this.hero.class].mp),
          ratio = clamp((this.hero.mp || 0) / oldMax, 0, 1),
          next = this.expectedMaxMp();
        this.hero.maxMp = next;
        this.hero.mp = Math.min(next, next * ratio);
        this.s.manaBalanceVersion = 1;
      }
      manaCombatActive() {
        return (
          !this.peace &&
          this.zone().enemies.some(
            (e) => e.hp > 0 && !e.neutral && e.aggro && !e.returning && dist(e, this.hero) < 700,
          )
        );
      }
      manaRegenRate() {
        const cfg = R.manaBalance.regen,
          rank = this.hero.talents[1] || 0,
          mana = this.talentProfile().mana;
        return this.manaCombatActive()
          ? cfg.combat + rank * mana * 0.125
          : cfg.outOfCombat + rank * mana * 0.25;
      }
      talent(i) {
        const max = this.talentMaxRank(i);
        if (!max || !this.hero.talentPoints || this.hero.talents[i] >= max) return false;
        this.hero.talentPoints--;
        this.hero.talents[i]++;
        if (i === 2) {
          const gain = this.talentProfile().hp;
          this.hero.maxHp += gain;
          this.hero.hp += gain;
        }
        this.syncCompanionLevelStats();
        return true;
      }
    }
    for (const name of Object.getOwnPropertyNames(Progression.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Progression.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeProgression = api;
})(typeof window !== 'undefined' ? window : globalThis);
