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
      nameEquipment(family, slot, value) {
        const name = Campaign.normalizeCharacterName(value);
        if (
          !['weapon', 'armor'].includes(slot) ||
          !name ||
          !this.s.rescued[family] ||
          R.balance.equipment.tiers[family] === undefined
        )
          return false;
        this.hero[slot === 'weapon' ? 'customWeaponName' : 'customArmorName'] = name;
        return true;
      }
      talentProfile() {
        // Dormant authoring: no Rogue registry admission until Charm exists.
        return this.hero.class === 'rogue'
          ? R.rogueHeroFoundation.talents
          : talentProfiles[this.hero.class];
      }
      talentMaxRank(i) {
        return Number.isInteger(i) && i >= 0 && i < talentMaxRanks.length ? talentMaxRanks[i] : 0;
      }
      heroPassiveHpBonus() {
        return this.hero.class === 'paladin'
          ? R.balance.classPassives.paladin.hpPerLevel * this.hero.level
          : 0;
      }
      heroPassivePowerBonus() {
        return this.hero.class === 'mage'
          ? R.balance.classPassives.mage.powerPerLevel * this.hero.level
          : 0;
      }
      heroPassiveSpeedBonus() {
        return this.hero.class === 'ranger'
          ? R.balance.classPassives.ranger.speedPerLevel * this.hero.level
          : 0;
      }
      heroPassiveCooldownReduction() {
        return this.hero.class === 'ranger'
          ? R.balance.classPassives.ranger.cooldownReductionPerLevel * this.hero.level
          : 0;
      }
      heroMoveSpeed() {
        return (this.hero.speed + this.heroTalentSpeedBonus() + this.heroPassiveSpeedBonus()) *
          (1 + (this.rogueSongBoon?.(this.hero, 'quickstep')?.move || 0));
      }
      heroCooldownReduction() {
        const training =
          Math.min(5, this.hero.talents[1] || 0) *
          (R.resourceMode.manaEnabled ? 0 : R.cooldownBalance.reductionPerTalentRank);
        return Math.min(
          R.balance.classPassives.maxTotalCooldownReduction,
          training + this.heroPassiveCooldownReduction(),
        );
      }
      armorEffectivenessFor(target) {
        const base = R.balance.classPassives.defaultArmorEffectiveness;
        return target === this.hero && target.class === 'paladin'
          ? base + R.balance.classPassives.paladin.armorEffectivenessPerLevel * target.level
          : base;
      }
      heroNaturalMaxHp() {
        return (
          classes[this.hero.class].hp +
          R.balance.growth.hpPerLevel * (this.hero.level - 1) +
          this.heroPassiveHpBonus()
        );
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
        // Shared Strength inherits persistent bonuses, not a tonic the hero personally drank.
        const temporaryHp = this.hero.tonic ? this.hero.tonicBonus || 0 : 0;
        return Math.max(
          0,
          this.hero.maxHp - this.heroNaturalMaxHp() - this.heroTalentHpBonus() - temporaryHp,
        );
      }
      heroOtherDamageBonus() {
        return Math.max(
          0,
          this.power() -
            classes[this.hero.class].power -
            this.heroTalentDamageBonus() -
            this.heroPassivePowerBonus(),
        );
      }
      heroEquipmentArmorBonus() {
        return Math.max(0, this.armor() - this.hero.armor);
      }
      // Knowledge is claimed once per campaign, and every party actor reads
      // the currently earned bonus instead of copying permanent extra stats.
      criticalCodexCount() {
        return Object.keys(R.criticalCodices || {}).filter(
          (id) => this.s.criticalCodices?.[id] === true,
        ).length;
      }
      criticalPartyBonus(source = 'hero') {
        const balance = R.criticalCodexBalance;
        const earned = Math.min(balance.maxBookBonus,
          this.criticalCodexCount() * balance.perBook);
        if (source === 'hero') return earned +
          (this.hero.class === 'rogue' ? 0.02 * Math.max(1, this.hero.level || 1) : 0) +
          (this.rogueSongBoon?.(this.hero, 'finale')?.criticalChance || 0);
        if (!this.s.party.some((u) => u.id === source &&
            ['soldier', 'archer', 'pet'].includes(u.type))) return 0;
        const shared = earned * this.expeditionSupportFraction('sharedTraining');
        const unit = this.s.party.find((u) => u.id === source);
        // An in-range Rogue Finale can boost each actor's own future
        // critical probability, never the unrelated hero/world streams.
        return shared + (this.rogueSongBoon?.(unit, 'finale')?.criticalChance || 0);
      }
      criticalPartyChance(source = 'hero') {
        return Math.max(0, Math.min(1, 0.10 + this.criticalPartyBonus(source)));
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
      charmedCompanionProfile(unit) {
        if (!unit?.charmOrigin) return null;
        return (
          R.balance.companions.charmed[unit.charmOrigin.species]?.[
            unit.charmOrigin.role === 'archer' ? 'ranged' : 'melee'
          ] || null
        );
      }
      companionMaxHp(type, level = this.hero.level) {
        const profile = typeof type === 'object' ? this.charmedCompanionProfile(type) : null;
        const base =
          profile?.hp ?? R.balance.companions.hp[typeof type === 'object' ? type.type : type];
        if (!base) throw Error('Unknown companion type');
        const raw =
          base +
          R.balance.companions.hpPerLevel * Math.max(0, level - 1) +
          this.companionInheritedHpBonus();
        return Math.round(raw * (1 + this.companionVitalityFraction()));
      }
      companionArmor(type) {
        const profile = typeof type === 'object' ? this.charmedCompanionProfile(type) : null;
        const base =
          profile?.armor ?? R.balance.companions.armor[typeof type === 'object' ? type.type : type];
        if (base === undefined) throw Error('Unknown companion type');
        return base + this.companionInheritedArmorBonus();
      }
      syncCompanionLevelStats() {
        for (const u of this.s.party) {
          if (!['soldier', 'archer', 'pet'].includes(u.type)) continue;
          const profile = this.charmedCompanionProfile(u),
            next = this.companionMaxHp(u),
            gain = next - u.maxHp;
          if (profile) u.damage = profile.damage;
          u.maxHp = next;
          if (u.hp > 0 && gain !== 0) u.hp = clamp(u.hp + gain, 1, next);
        }
      }
      expeditionPartyCap(rank = this.s.expeditionRank || 1) {
        return Campaign.expeditionPartyCapFor(this.hero.class, rank);
      }
      expeditionInstructorCap(family) {
        return expeditionCeilings[family] || 0;
      }
      expeditionNextInstructor(rank = this.s.expeditionRank || 1) {
        return Object.keys(expeditionCeilings).find((id) => expeditionCeilings[id] > rank) || null;
      }
      expeditionUnlock(rank) {
        if (rank === 3) return 'Manual squad doctrine';
        if (rank < 2 || rank > 6) return '';
        // The conventional three classes retain exactly their existing copy.
        // New class-specific active capacity is derived from the same rule used
        // for save validation, not from a stale "active group 6" string.
        const detail =
          rank === 2
            ? this.hero.class === 'rogue'
              ? 'Resources'
              : 'Recruitment + resources'
            : rank === 4
              ? 'Full Barracks upgrade'
              : '';
        const capacity = 'active group ' + this.expeditionPartyCap(rank);
        return detail ? detail + ' · ' + capacity : capacity[0].toUpperCase() + capacity.slice(1);
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
              ? ' Companion training advanced: Soldiers learned Holy Cleave; Archers learned Piercing Volley; pets unlocked charged second skills.'
              : ''),
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
              : 'permanent bonus HP, damage and armor') +
            '.',
        );
        this.event('expeditionSupport', { id, rank: next, family });
        return true;
      }

      // All authentic active, living companions share earned adventure mastery.
      // One saved bounded counter per individual, with a separate receipt list
      // for guarded elite encounters that can temporarily replenish.
      awardCompanionMastery(points, guardianKey = null) {
        if (!Number.isInteger(points) || points < 1 ||
            ['arena', 'developer'].includes(this.s.mode)) return 0;
        const maximum = R.balance.companions.mastery.thresholds[2];
        let recipients = 0;
        for (const u of this.s.party) {
          if (!u || !['soldier', 'archer', 'pet'].includes(u.type) ||
              u.hp <= 0 || u.active === false ||
              (u.charmOrigin && !this.isCharmedCompanion(u)) ||
              (u.type === 'pet' && !this.petUnlocked(u.petFamily))) continue;
          const before = u.masteryPoints || 0;
          if (before >= maximum) continue;
          if (guardianKey !== null) {
            const seen = u.masteryGuardianKeys ||= [];
            if (seen.includes(guardianKey) || seen.length >= 256) continue;
            seen.push(guardianKey);
          }
          u.masteryPoints = Math.min(maximum, before + points);
          recipients++;
        }
        return recipients;
      }
      xpRequired(level = this.hero.level) {
        return R.balance.growth.xpPerLevel * level;
      }
      xp(amount) {
        this.hero.xp += amount;
        while (this.hero.xp >= this.xpRequired()) {
          this.hero.xp -= this.xpRequired();
          this.hero.level++;
          this.awardCompanionMastery(1);
          this.hero.maxHp +=
            R.balance.growth.hpPerLevel +
            (this.hero.class === 'paladin' ? R.balance.classPassives.paladin.hpPerLevel : 0);
          // Keep dormant MP capacity age-correct for a future reactivation.
          this.hero.maxMp += R.manaBalance.perLevel;
          this.hero.hp = this.hero.maxHp;
          if (R.resourceMode.manaEnabled) this.hero.mp = this.hero.maxMp;
          this.syncCompanionLevelStats();
          delete this.hero.potionEffect;
          this.hero.talentPoints++;
          this.event('level', { level: this.hero.level });
          // The existing level message names the innate growth; Character holds the numbers.
          const growthName = {
            paladin: 'Fortitude',
            ranger: 'Agility',
            mage: 'Arcane Power',
            rogue: 'Mischief',
          }[this.hero.class];
          this.say(
            'Level ' +
              this.hero.level +
              '! ' +
              growthName +
              ' improved. Training point available — press C or use Discipline Training.',
          );
          this.notice(
            'LEVEL ' + this.hero.level + ' · Training point available',
            5.5,
            '',
            'milestone',
            {
              requiresTalentPoints: true,
              heroClass: this.hero.class,
            },
          );
        }
        if (this.zoneId === 'vale' && this.s.zones.vale) this.syncThornArrival(this.s.zones.vale);
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
        if (
          (!R.resourceMode.manaEnabled && type === 'mana') ||
          family !== 'archive' ||
          !this.s.rescued.archive ||
          !['health', 'mana'].includes(type)
        )
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
        this.hero.weaponSelection = null; // A newly acquired tier uses automatic best-weapon selection.
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
        this.hero.weaponSelection = name;
        return true;
      }
      equipTierWeapon() {
        if (!this.hero.weapon) return false;
        this.hero.legacyEquipped = false;
        this.hero.weaponSelection = 'tier';
        return true;
      }
      restoreWeaponSelection() {
        const choice = this.hero.weaponSelection;
        if (choice === 'tier' && this.hero.weapon) {
          this.hero.legacyEquipped = false;
          return 'tier';
        }
        if (
          typeof choice === 'string' &&
          legacyWeapons[choice] &&
          this.s.legacyInventory?.includes(choice)
        ) {
          this.equipLegacy(choice);
          return 'legacy';
        }
        // Historical saves without an explicit choice retain the old best-weapon migration.
        return this.autoEquipBestWeapon();
      }
      power() {
        if (this.hero.legacyEquipped)
          return (
            this.hero.power +
            (this.hero.legacyWeaponPower || 0) +
            this.heroTalentDamageBonus() +
            this.heroPassivePowerBonus()
          );
        return (
          this.hero.power +
          (this.hero.weapon ? 0 : this.hero.legacyWeaponPower || 0) +
          R.balance.equipment.bonuses.weapon[this.hero.weapon] +
          (this.hero.reforges['weapon:' + this.hero.weapon]
            ? R.balance.equipment.reforgeBonus.weapon
            : 0) +
          this.heroTalentDamageBonus() +
          this.heroPassivePowerBonus()
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
    // One class-aware capacity source for active party, Barracks and v4 saves.
    // Rogue is deliberately not registered as playable yet.
    const activeSlotBonuses = Object.freeze({ rogue: 1 });
    Campaign.activeSlotBonuses = activeSlotBonuses;
    Campaign.expeditionPartyCapFor = (heroClass, rank) =>
      R.balance.companions.activeCaps[clamp(rank, 1, 6)] +
      (activeSlotBonuses[heroClass] || 0);
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
