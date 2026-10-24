/* Optional, read-only Archive reference. Figures come from live rules and Campaign queries. */
(function (root) {
  'use strict';
  // Archive prose belongs to the Keeper; shared encounter briefs are not dialogue.
  // Keeper history: verbatim EN manuscript passages; ES is paired in Narration.approved.
  const keeperHistories = {
    thorn:
      "Thornfang trained as a Crown wilderness scout in professional canine handling, recall, scent work and pack welfare. He patrols the approaches to the Dark Lord's winter estate. Mira has accompanied these patrols as a paid instructor, though her service came without the freedom to leave. When a fight breaks off, he leads his pack toward the den. His tracks remain visible along the woodland paths.",
    crypt:
      'The Lifebinder and I traveled with the Dark Lord long before these garrisons. His work combines mortuary science and thanatology with the conservation and reuse of buildings. His skeletons endure and remain aware; they are not living people restored to life. I refuse to confuse the two, particularly when I record their names and allegiances. The Lifebinder’s bindings sustain work on the still-unfinished winter estate; Borin was compelled to contribute to its construction.',
    mire: "My maps show the Marches' principal waterways. Mirejaw knows bends and shallow channels they do not. His mud slows pursuers and helps his wounds close. Reedport and Fisher Camp still fish outside his territory; not every boat answers to him.",
    archive:
      'I belonged to the Dark Lord’s traveling company before I settled in the Archive. These days I keep records, sit on the council and fish when my duties allow. I drowned long ago; that is how I came by my name. The flooding of these shelves is a later calamity, and its cause remains unknown to me. Neri knows what can be done to preserve the damaged books.',
    ridge:
      'Ridge Tyrant can produce a figure for almost anything he argues: wages, repaired roads, minted crowns, caravans delivered. His title is Master of Coin; in practice, he directs the Crown’s economy and finances. Paying the specialists pressed into service was his proposal. They receive wages even when they cannot refuse the assignment. His contracted archers protect payrolls and mineral shipments, sometimes far beyond Ironroot. I keep copies of his accounts. One advantage of figures is that you can check them.',
    mine: "I knew Garun the Firstborn as our Ogre Bastion. During one expedition he held a collapsing mountain gate long enough to save the company. Garun has designed roads, bridges and fortresses, but perhaps his most remarkable work was himself. He designed his own stone body, fitted around a luminous heartstone, with golden eyes, an angular shell and a separate diamond core. All his own work. He would still rather inspect a bridge than endure another council meeting about construction.\nAt Colossus Mine, Ogre wardens and Crown riders on armored direwolves guard the site; the riders' bunks and their mounts' kennels share the working quarters. Ridge Tyrant, his captain and the crews manage the Mine’s accounts, wages and daily production. Garun is well paid, though the Mine has expenses he must meet. He spends spare crowns on little machines, strange ornaments and architectural experiments. I confess I enjoy seeing what he brings back.\nThe Mine’s records show fair payment for Dara’s repairs and unusual commissions, alongside the limited movement she could negotiate and Garun’s power to deny her departure while captive. Garun trusts the Dark Lord and is comfortable here; the Mine is his workshop and refuge as much as his post. Should the throne stand empty, the roads, strongholds and labor under his control could make him powerful. I suspect he would try to keep people safe by directing their movement. Whether they would welcome such protection is another matter.",
    warlord:
      'The Ashen Warlord commands the Orc warbands occupying the Frontier. Reports arriving here describe repaired crossings, supplied checkpoints and caravans reaching Emberwatch again. His patrols inspect the roads, collect Crown taxes and enforce military orders in occupied settlements. Work is paid; specialists recruited by force cannot simply walk away from their posts. Cinder Warlord inspects those routes for him. The approaches to Abyss Bastion’s unfinished air works remain guarded. Trade has resumed under military supervision.',
    abyss:
      'I remember Veyrith carrying the Dark Lord during our travels: a purple dragon, proud, disciplined and loyal. I see no reason to think the years have made him less so. He defends the proposed royal air force fiercely, convinced that control of the sky can secure the peace below. The hatchery, harness stations and launch platform at Abyss Bastion are being prepared for that purpose. The platform is unfinished, and there is no completed fleet yet.',
    citadel:
      'Veyra guarded the coastal roads before joining our company. She trained Goblins, Ogres, Humans and other irregular troops to drill together, maintain their equipment and take pride in their uniforms. Even as marshal, she still trains Crown soldiers herself. She still practices cosmetology; in her view, something useful should also look right. Garun shares her interest in design. I have heard their conversations on workmanship and proportion at length. She is loyal to the Dark Lord and wary of politics. Yet if his throne stood empty, her officers and disciplined garrisons could put the provinces under her command. I doubt she would enjoy governing them; a military administration might nevertheless be the result.',
    cindermaw:
      'The Dark Lord appointed Cindermaw because he could organize Ash beasts and administer territory. Crownwatch, Ash Refuge, the Ruined Foundry, roads and supply lines fall under his ministry. These services provide food and shelter and employ paid workers. Some specialists serve by conscription, not choice. Cindermaw co-manages the Treasury with Dreadmaw, who guards its Inner Vault. The Treasury accounts record Vera’s wages as Master Smith and the restrictions imposed on her while captive. Those wages did not give her permission to leave.',
    darklord:
      'I traveled with the Dark Lord through victories that some towns celebrated and others mourned. There came a day when the last command from outside never received a successor. He made his own decisions then. Rival peoples began trading under his peace, and Crown roads now link more of the realm. Those roads also carry soldiers, tax revenues and specialists pressed into paid service.\nHe says, ‘Freedom has a price.’ I wrote that down. The accounts record wages for posts whose occupants cannot freely refuse the assignment.',
  };
  const keeperOffices = {
    'supply-crown':
      "Cindermaw's devoted disciple administers crops, livestock, meat, dairy, poultry, fisheries and their distribution across all five Crown provinces. He co-manages the whole Treasury with the Interior ministry and guards its Inner Vault. Ridge Tyrant oversees coin and accounts. I keep the records. The Lantern Wraiths have grown fond of Dreadmaw, and he returns their affection.",
    'supply-vale':
      "Scornfang is Thornfang's Goblin disciple and Greenwood's Superintendent of Reclamation. He oversees decommissioning, remediation, salvage and relocation for the estate works. His authority belongs to that local office. The materials he recovers find their way into the estate's construction accounts.",
    'supply-highlands':
      "Crag Tyrant is a horned humanoid mountain tyrant like his mentor, Ridge Tyrant. He guards the Treasury household, paid accounts, coin stores and its three separate caches. Crown riders on armored direwolves form his household security, with bunks, wolf bedding and saddle racks in their shared quarters. Wild Highland wolves keep their own dens. Crag regards steady wages and guarded shipments as sufficient reason for strict control. He answers to the Master of Coin; the mint and the province's government lie beyond his household duties.",
    'frontier-overseer':
      "Cinder Warlord inspects the Frontier on the Ashen Warlord's behalf. He visits roads, work details and occupied settlements, enforcing orders while markets and repair crews continue their work. His Mandatory Overtime can press up to seven nearby workers into a fight. Without workers present, there is no one for him to order forward.",
  };
  const keeperProvinces = {
    vale: 'My Greenwood records begin with Millhaven, Orchard Hamlet and the working mill, among farms and woodland roads. At the Forest Crypt, the Lifebinder—one of my old companions—oversees the Dark Lord’s unfinished winter residence. He works with skeletons who endure and remain aware, although they are not alive again. Every skeleton retains an identity; some still use their former names and loyalties.',
    highlands:
      "The Dark Lord seized Ironroot's silver-bearing and copper-bearing mountains long ago. Quarry Outpost retains its old name, though its workings now sort the ore sent to Stonecross. Silver and copper move separately under guard; the mint strikes crowns with the Dark Lord's portrait, and the Master of Coin records the wages and shipments. I compare incoming ore with the mint's output. Some residents welcome the reliable work. Others resent Crown ownership. Away from the roads, wolves hunt while Ogre households cook, work stone and gather at their hearths.",
    frontier:
      'Reports from the Ashen Frontier describe red poppies on disturbed earth and pale-trunk saplings rising among cooled ash and old blast scars. Gardens are returning beside damaged walls; the ravine and old battle sites remain scarred. Emberwatch and Burned Hamlet rebuild under the Warlord’s rule. The repaired crossings carry food and trade, while inspections and taxes remain enforced. Specialists pressed into Crown service receive wages, but cannot refuse their appointments. The Ruined Shrine barracks, the forts, the night Stalkers’ hold and the guarded route to Abyss Bastion remain parts of that occupation.',
    crown:
      "Crownwatch maintains homes, guarded transport and roads. The Citadel, Cindermaw's ministry and the barracks enforce Crown authority. Near the lava channels, heat exchangers and insulated flues carry volcanic warmth to glass and ceramic kilns, drying rooms, public baths and rooms used in winter. The Ruined Foundry and the fortress roads employ paid crews. At the Crystal Deposit, workers extract valuable crystals and prepare them for shipment. These are all part of the Crown's functioning economy. The records also list taxes and wages paid to specialists conscripted into posts they cannot refuse.",
  };
  // Shared short definitions feed the optional quick reference; the third field
  // is expanded only by the Keeper's existing "Show me the figures" path.
  function slowDuration(R, seconds) {
    return Math.round((seconds + (R.cooldownBalance.slowDurationBonusSeconds || 0)) * 100) / 100;
  }
  function petReference(game, family, slot, R) {
    const def = game.petSkillDefinition({ petFamily: family }, slot);
    const text = game.petSkillSummary(family, slot, true);
    return def?.slow
      ? text.replace(' · Slow ' + def.slow + 's', ' · Slow ' + slowDuration(R, def.slow) + 's')
      : text;
  }
  function conditionTopics(R) {
    const percent = (value) => Math.round(value * 10000) / 100,
      charge = R.chargedSkills,
      heal = R.enemySupportHealing,
      stackedSlow = Number.isFinite(R.cooldownBalance.slowStackPenalty);
    return [
      [
        'Fortified enemies and covering fire',
        'Enemies sheltered inside a defended fort take ' +
          percent(1 - R.balance.fortifications.incomingMultiplier) +
          '% less damage. Ranged garrisons gain ' +
          percent(R.balance.fortifications.rangeMultiplier - 1) +
          '% reach and fire over their own walls. The shield beside an enemy’s health bar marks fort protection; leaving the defended area ends it.',
        'Enemy ranged shots can arc over low fences, carts, supplies, logs and interior screens. Tall obstacles, cliffs, room boundaries and unrelated fort walls remain solid. Fort protection applies to ordinary troops, officers and bosses inside the area; explicit piercing attacks bypass it. Aiming warnings and dodgeable flight remain. Hero and companion shots still use their normal obstruction rules.',
      ],
      [
        'Slow',
        stackedSlow
          ? 'Move and recover skill cooldowns more slowly. Repeated Slow hits suppress recovery further and add lasting cooldown debt.'
          : 'Move and recover skill cooldowns more slowly, including skills used while already slowed.',
        (stackedSlow
          ? 'On the first Slow hit, heroes and companions recover cooldowns at '
          : 'Heroes and companions recover cooldowns at ') +
          percent(R.cooldownBalance.slowRecoveryMultiplier) +
          '% of normal speed; enemies, captains and bosses at ' +
          percent(R.cooldownBalance.enemySlowRecoveryMultiplier) +
          '%. Allied movement is normally 65%, or ' +
          percent(R.tacticalFoundation.rogueSlowMovementFactor) +
          '% under stronger Rogue snares; ordinary enemy pursuit is 50%. ' +
          (stackedSlow
            ? 'Each successful Slow hit adds ' +
              R.cooldownBalance.slowDurationBonusSeconds +
              's to its authored duration. The longest remaining duration wins, not the sum. ' +
              'Recovery speed is the first-hit rate / (1 + (stacks - 1) × stack penalty): ' +
              R.cooldownBalance.slowStackPenalty +
              ' for allies; ' +
              R.cooldownBalance.enemySlowStackPenalty +
              ' for enemies. ' +
              'Each hit also adds its full adjusted duration × ' +
              percent(R.cooldownBalance.slowDebtFraction) +
              '% to eligible recovering allied cooldowns, or ' +
              percent(R.cooldownBalance.enemySlowDebtFraction) +
              '% for enemies. Ready skills gain no debt. ' +
              'Stack strength clears when Slow expires; accumulated cooldown debt remains. ' +
              'Preparation, warnings and healing pulses are not delayed, and skills are never outright blocked by Slow.'
            : 'The longest remaining Slow wins. Recovery returns to normal when Slow ends. Slow does not lengthen charge preparation, warnings or healing pulses, and does not prevent skills.'),
      ],
      [
        'Silence',
        'Blocks special skills for enemies, you and companions inside the field; movement and ordinary attacks still work.',
        'The Mage’s Silence Field stays where cast for ' +
          R.heroTactics.mage.silence.duration +
          '–' +
          (R.heroTactics.mage.silence.duration + 4 * R.heroTactics.mage.silence.durationStep) +
          ' seconds by rank. It suppresses new specials, support-heal activation and unfinished companion charged releases. The warnings remain visible: enemy specials already being prepared wait rather than disappearing; projectiles, hazards, healing pulses and committed movement continue. It neither adds Slow nor freezes cooldown recovery. Leaving the field or its expiry ends Silence; damage immunity does not erase the field.',
      ],
      [
        'Interrupted charges',
        'HP damage can cancel an unfinished charged skill; brief retry recovery replaces its full cooldown.',
        'Heroes and companions prepare charged skills for ' +
          charge.holdSeconds +
          ' seconds. HP actually lost during preparation adds up: interruption needs at least ' +
          percent(charge.interrupt.hpFraction) +
          '% of maximum HP, with a minimum of ' +
          charge.interrupt.minimumHp +
          ' HP. Immunity and zero HP loss contribute nothing; lethal damage cancels an unreleased action. A failed preparation spends no full skill cooldown and has ' +
          charge.interrupt.recoverySeconds +
          ' seconds of charged retry recovery. Damage after completed preparation cannot retroactively interrupt it. The Mage’s Spell Interrupt instead cancels one current enemy warned or aimed attack, leaving later queued attacks intact.',
      ],
      [
        'Weaken and Fracture',
        'Weaken lowers an enemy’s damage; Fracture increases the damage it takes.',
        'Paladin weakening reduces the affected enemy’s outgoing damage for its actual duration. Mage Fracture is vulnerability, not Slow or Silence: the strongest active vulnerability applies once, helping hero and companion hits. Fracture never adds multiple percentages together. Charged Cataclysm gives a stronger but shorter burst window than the longer Skill 4 vulnerability.',
      ],
      [
        'Taunt',
        'Judgment draws ordinary enemy attacks toward the Paladin; scripted boss specials keep their targets.',
        'Judgment and Grand Judgment redirect ordinary target choice only while the Paladin is alive, reachable and visible. Boss attention is capped at 2.5 seconds. Taunt does not remove warnings, rewrite boss phases, or bypass terrain and arena limits.',
      ],
      [
        'Haste and Companion Rally',
        'Haste speeds your movement; Rally speeds nearby companions’ movement and ordinary attacks, not their specials.',
        'Ranger Skill 4 tap gives 25% hero movement haste. Its charged Companion Rally needs living nearby allies with line of sight; with none it spends no cooldown. Rally raises companion movement 15–19% and ordinary attack speed 8–12% by rank. It does not accelerate special preparation, special/healing cooldowns or grant a dash. Slow still reduces movement and recovery independently.',
      ],
      [
        'Shields, wards and immunity',
        'Shields and wards reduce damage; immunity blocks hits. Paladin protection is not invulnerability.',
        'Armor applies first. Paladin Shield Stance and a party ward use only the stronger reduction, never both multiplied. Stance stops Skill 1 and reduces other outgoing damage to 60%; its cooldown starts when lowered or expired. Soldier survival guard grants actual immunity while active. Immunity blocks damage and on-hit Slow, but not solid terrain, or the area-based Silence restriction. No class’s Skill 8 grants immunity.',
      ],
      [
        'Dust and displacement',
        'Goblin dust blocks direct targeting; area attacks still work. Shoves move you without a lasting stun.',
        'Dust cover protects the caster from selection and incoming targeted shots, not area damage. A shove obeys terrain collision. Thornfang’s forced scatter briefly overrides movement commands; ordinary shoves do not create a general stun. Ground warning shapes show the affected area, while their label follows the caster; a warning alone applies no damage or condition.',
      ],
      [
        'Healing in battle',
        'Healing restores living actors; it does not revive fallen companions. Some enemies can heal their allies too.',
        'Hero skill healing is separate from Ranger support over time. Eligible ranged enemies and selected captains/bosses treat injured living allies in an area, with eligible leaders included. Base enemy support restores ' +
          percent(heal.fraction) +
          '% of the recipient’s maximum HP over ' +
          heal.duration +
          ' seconds, with their strength varying by encounter, beginning at ' +
          percent(heal.threshold) +
          '% HP or less on a ' +
          heal.cooldown +
          's cooldown. Allies arriving to regroup can receive care at ' +
          percent(heal.regroupThreshold) +
          '% HP or less, even before the healer joins combat. Slow delays the next skill, not ongoing healing pulses. Siphon instead heals from HP actually taken; each leader’s own recovery techniques work separately.',
      ],
    ];
  }
  function sections(game, { D, R }) {
    const approvedNarrative = (
      typeof PrototypeNarration !== 'undefined' ? PrototypeNarration : require('./narration.js')
    ).approved;
    const number = (value) => Math.round(value * 100) / 100,
      percent = (value) => number(value * 100),
      mana = R.resourceMode?.manaEnabled !== false,
      allEnemies = Object.values(game.s.zones).flatMap((z) => z.enemies),
      profile = game.talentProfile(),
      support = R.rangerSupport,
      tactics = R.tacticalFoundation,
      burst = tactics.burstCompression,
      shelves = [];
    // Read-only passive reference derived from the combat rule table. This
    // augments existing entries; it creates no new Archive shelf or save key.
    const p = R.snapshotPassives,
      g = R.greenwoodPassives,
      m = R.marchesPassives,
      pc = (x) => percent(x) + '%',
      bossPassives = {
        thorn:
          'Rapid Deployment: Wolves move +' +
          pc(g.rapidDeployment.normal - 1) +
          ' (TRUE +' +
          pc(g.rapidDeployment.true - 1) +
          ').',
        crypt:
          'Structural Consolidation: reduction ' +
          pc(1 - g.structuralConsolidation.normal) +
          ' (TRUE ' +
          pc(1 - g.structuralConsolidation.true) +
          ').',
        mire:
          'Groundwater Recharge: heals ' +
          pc(m.groundwaterRecharge.normal) +
          ' max HP/s on own live mud (TRUE ' +
          pc(m.groundwaterRecharge.true) +
          ').',
        archive:
          'Emergency Stabilization: once below half HP, mitigation ' +
          pc(m.emergencyStabilization.normal.reduction) +
          ' for ' +
          m.emergencyStabilization.normal.duration +
          's (TRUE ' +
          pc(m.emergencyStabilization.true.reduction) +
          ' for ' +
          m.emergencyStabilization.true.duration +
          's).',
        ridge:
          'Contractual Protection: base mitigation ' +
          pc(p.ridge.baseline.normal) +
          ' + ' +
          pc(p.ridge.perArcher.normal) +
          ' per engaged summoned Archer within ' +
          p.ridge.radius +
          ' paces, max ' +
          p.ridge.maxArchers +
          ' (TRUE ' +
          pc(p.ridge.baseline.true) +
          ' + ' +
          pc(p.ridge.perArcher.true) +
          ' each).',
        mine:
          'Self-Assembly: core-closed mitigation ' +
          pc(p.mine.shellReduction.normal) +
          ' (TRUE ' +
          pc(p.mine.shellReduction.true) +
          '); core relock heals ' +
          pc(p.mine.repairFraction.normal) +
          ' max HP (TRUE ' +
          pc(p.mine.repairFraction.true) +
          '), ' +
          p.mine.repairCooldown +
          's cooldown.',
        warlord:
          'Chain of Command: base mitigation ' +
          pc(p.warlord.baseline.normal) +
          ' + ' +
          pc(p.warlord.perOrc.normal) +
          ' per engaged summoned Orc within ' +
          p.warlord.radius +
          ' paces, max ' +
          p.warlord.maxOrcs +
          '; those Orcs deal +' +
          pc(p.warlord.orcDamage.normal) +
          ' (TRUE ' +
          pc(p.warlord.baseline.true) +
          ' + ' +
          pc(p.warlord.perOrc.true) +
          ' per Orc, +' +
          pc(p.warlord.orcDamage.true) +
          ' Orc damage).',
        abyss:
          'Aerial Superiority: base mitigation ' +
          pc(p.abyss.baseline.normal) +
          '; after completed offensive flight ' +
          pc(p.abyss.reduction.normal) +
          ' for ' +
          p.abyss.duration +
          's (TRUE ' +
          pc(p.abyss.baseline.true) +
          ' / ' +
          pc(p.abyss.reduction.true) +
          ').',
        citadel:
          'Regimental Cohesion: base mitigation ' +
          pc(p.citadel.baseline.normal) +
          '; with active guarded Dress Ranks ' +
          pc(p.citadel.reduction.normal) +
          ' (TRUE ' +
          pc(p.citadel.baseline.true) +
          ' / ' +
          pc(p.citadel.reduction.true) +
          ').',
        cindermaw:
          'Emergency Provisioning: below ' +
          pc(p.cindermaw.threshold) +
          ' HP, self-regeneration ' +
          pc(p.cindermaw.soloRegen.normal) +
          ' max HP/s alone or ' +
          pc(p.cindermaw.bossRegen.normal) +
          '/s near Ash beasts, total cap ' +
          pc(p.cindermaw.bossHealCap.normal) +
          ' (TRUE ' +
          pc(p.cindermaw.soloRegen.true) +
          '/' +
          pc(p.cindermaw.bossRegen.true) +
          '/s, cap ' +
          pc(p.cindermaw.bossHealCap.true) +
          '); heals injured nearby Ash beasts.',
        darklord:
          "Veteran's Instinct: " +
          p.darklord.triggerHits +
          ' damaging hits within ' +
          p.darklord.window +
          's grant ' +
          pc(p.darklord.reduction.normal) +
          ' mitigation for ' +
          p.darklord.duration +
          's (TRUE ' +
          pc(p.darklord.reduction.true) +
          '); cooldown ' +
          p.darklord.cooldown +
          's. With living field companions, at least two distinct attackers must contribute.',
      },
      captainPassives = {
        'supply-vale':
          'Prolonged Exposure: regular Slow +' +
          pc(g.prolongedExposure.normal - 1) +
          ', phase +' +
          pc(g.prolongedExposure.phase - 1) +
          '.',
        'supply-march':
          'Strain Hardening: ' +
          pc(m.strainHardening.perHit) +
          ' mitigation per damaging hit, up to ' +
          pc(m.strainHardening.perHit * m.strainHardening.maxStacks) +
          ', refreshed for ' +
          m.strainHardening.duration +
          's.',
        'supply-highlands':
          'Hazard Pay: ' +
          pc(p.captains['supply-highlands'].baseline) +
          ' base protection plus ' +
          pc(p.captains['supply-highlands'].selfReduction) +
          ' with living nearby Treasury guards; guards deal +' +
          pc(p.captains['supply-highlands'].guardDamage) +
          '.',
        'frontier-overseer':
          'Escalating Enforcement: ' +
          pc(p.captains['frontier-overseer'].perHitReduction) +
          ' mitigation per real hit, max ' +
          pc(
            p.captains['frontier-overseer'].perHitReduction *
              p.captains['frontier-overseer'].maxStacks,
          ) +
          '; full stacks deal +' +
          pc(p.captains['frontier-overseer'].maxStackDamage) +
          '.',
        'supply-crown':
          'Broodward: ' +
          pc(R.roomCaptains['supply-crown'].summon.guardPerSummon) +
          ' protection per living broodling, max ' +
          pc(R.roomCaptains['supply-crown'].summon.guardCap) +
          '.',
      };
    shelves.push({
      title: 'Battle and protection',
      intro: 'Armor, openings and rogue tactics.',
      topics: [
        [
          'Steel, wounds and armor',
          'Armor takes the edge off a blow. Even a well-armored fighter can be wounded; immunity is what stops the hit entirely. Your companions rely on their own armor and any bonuses your training passes to them.',
          'Before shields and wards: max(3, incoming damage − armor × 0.35). Your armor: ' +
            number(game.armor()) +
            ', including equipment and reforges. Shield Stance and wards then use only the stronger reduction; immunity stops the hit.',
        ],
        [
          'Why a great volley loses force',
          'Landing every blow at once gives less damage than you might expect. Your company’s blows are counted together against each foe, so another attacker does not bypass the reduction. Save your strongest volley for an exposed opening.',
          'Hits share a rolling ' +
            burst.windowSeconds +
            '-second total for each target. Below the threshold, damage is unchanged. Above it: threshold + tail × ln(1 + (raw damage − threshold) / tail). Each hit deals the increase in that total.\n\n' +
            Object.entries(burst.tiers)
              .map(
                ([tier, p]) =>
                  ({
                    ordinary: 'Ordinary',
                    guardian: 'Guardian',
                    ringleader: 'Ringleader',
                    captain: 'Captain',
                    boss: 'Normal boss',
                    trueBoss: 'TRUE boss',
                  })[tier] +
                  ': threshold ' +
                  percent(p.knee) +
                  '% of maximum HP; tail ' +
                  percent(p.tail) +
                  '%.',
              )
              .join('\n') +
            '\n\nDuring an opening, both figures are multiplied by ' +
            burst.openingMultiplier +
            '.',
        ],
        [
          'Openings and stubborn defenders',
          'The Ash Sentinel’s closed-armor multiplier is 65%; the Stone Colossus’s exposed-core multiplier is 125%. These apply before other passive defenses and burst compression, so they are not final damage percentages. Some captains gain protection from their followers. Clear the warning, then strike during the opening.',
        ],
        [
          'Enemies under pressure',
          'A wounded or outmatched foe may use rogue tactics: withdraw toward allies, slow a pursuer, shove attackers away or rally defenders. Chase blindly and you may gather a larger fight. Ordinary foes still show their marked Rogue warning. Guardians, ringleaders, captains and bosses instead show a moving cast bar: use real cover, or break pursuit if they draw in more enemies. Goblin dust breaks direct targeting, but area attacks can still reach the goblin.',
          'Ordinary creatures, guardians and ringleaders can seek help below ' +
            percent(tactics.woundedThreshold) +
            '% HP. A foe at least ' +
            tactics.heroLevelDisadvantageMinimum +
            ' level below you can react to that disadvantage; otherwise ' +
            tactics.simultaneousPressureSources +
            ' living attackers must focus it. Nearby companions do not count unless they are actually attacking that foe. Enemies ' +
            tactics.outlevelProtection +
            ' or more levels above you do not use rogue tactics.\n\n' +
            'At your level, summoning bosses and captains need at most ' +
            tactics.summonSupportThreshold +
            ' living summoned ally, with the next summoning not yet ready. Thornfang, Ashen Warlord, Dark Lord and Dreadmaw can also act cunningly under that same summon condition.\n\n' +
            'A retreat seeks reachable allies within ' +
            tactics.awarenessRadius +
            ' paces; one ally is enough. Continued pursuit can lead to another local retreat and more allies. The foe takes half damage while preparing to withdraw, withdrawing or making a tactical escape; that protection ends when it settles or abandons the retreat.\n\n' +
            'Ringleaders, captains and bosses have distinct basic maneuvers and stronger situational tricks. Watch the cast progress while they move: these are choices, not an automatic pair of attacks. Some commanders rally living troops or refill nearby defeated guard posts; their usual summoned creatures remain separate.',
        ],
      ],
    });
    shelves.push({
      title: 'Conditions and recovery',
      intro: 'Choose an effect; ask for figures when you want the full rule.',
      topics: conditionTopics(R),
    });
    shelves.push({
      title: 'Experience and discipline',
      intro: 'Level gains and training.',
      topics: [
        [
          'Why old enemies teach little',
          'Fighting beneath your level brings less experience and fewer crowns. Ordinary creatures also give less experience than their listed value. If you want to grow, seek a stronger opponent.',
          'Ordinary enemies give ' +
            percent(R.progression.ordinaryXpMultiplier) +
            '% of listed XP. A level advantage of 0 / 1 / 2 / 3 / 4 or more leaves ' +
            R.progression.levelGapRewards.map(percent).join(' / ') +
            '% of XP and crowns. Crowns do not take the ordinary-XP reduction. Both rewards round down.\n\nNext level: ' +
            game.xpRequired() +
            ' XP (' +
            R.balance.growth.xpPerLevel +
            ' × current level).',
        ],
        [
          'The next lesson',
          'Each level gives you a discipline point and more health. Strength, vitality and movement training improve different parts of your fighting ability.' +
            (mana
              ? ' Mana training improves recovery, not the size of your reserves.'
              : ' Cooldown training shortens the wait between skills.'),
          'Per level: 1 discipline point and ' +
            R.balance.growth.hpPerLevel +
            ' maximum HP.\nYour ' +
            game.hero.class +
            ': strength +' +
            profile.power +
            ' power; vitality +' +
            profile.hp +
            ' HP; movement +' +
            profile.speed +
            ' speed per rank. Rank limits: ' +
            R.balance.disciplines.maxRanks.join(' / ') +
            '.' +
            (mana
              ? ''
              : '\nCooldown training: ' +
                percent(R.cooldownBalance.reductionPerTalentRank) +
                '% of the original wait per rank, up to ' +
                percent(
                  R.cooldownBalance.reductionPerTalentRank * R.balance.disciplines.maxRanks[1],
                ) +
                '% reduction.'),
        ],
      ],
    });
    // Optional Keeper reference: one short tap/charge distinction per skill.
    // The Adventure → Hero Skills menu is the primary quick reference.
    const skills = {
      paladin: {
        2: 'Tap Sundering Strike: hit and weaken one enemy. Charge Holy Cleave: weaken a frontal group.',
        3: 'Tap Shield Stance: guard for 8s; basic attacks stop and other damage drops. Tap again to lower. Charge Shield Bash: push nearby enemies.',
        4: 'Tap Judgment: a dodgeable holy shot strikes and taunts one foe. Charge Grand Judgment: hit and taunt a group. Boss specials keep their own targets.',
        5: 'Tap: holy area damage to 6 enemies. Charge Consecrated Wave: stronger holy damage and weaken up to 8.',
        6: 'Tap Vanguard Rush: approach and strike. Charge Vanguard Impact: rush, then push nearby enemies.',
        7: 'Tap: holy damage to 6 enemies. Charge Oath Strike: stronger holy damage and weaken up to 8.',
        8: 'Tap Sanctuary Oath: heal 15% and protect nearby allies with a 20% ward. Charge Last Bastion: heal 20%, grant 30% ward and weaken enemies. No immunity.',
      },
      mage: {
        2:
          'Tap Frost Bolt: damage and slow one foe for ' +
          slowDuration(R, 2) +
          '–' +
          slowDuration(R, 2 + 4 * 0.05) +
          's. Charge Frost Burst: slow nearby enemies for ' +
          slowDuration(R, R.chargedSkills.second.mage.slow) +
          '–' +
          slowDuration(R, R.chargedSkills.second.mage.slow + 4 * 0.25) +
          's.',
        3: 'Tap Spell Interrupt: a dodgeable bolt cancels one warned attack on contact. Charge Silence Field: block special skills for enemies, you and companions inside.',
        4: 'Tap Arcane Fracture: a dodgeable bolt damages and increases incoming damage to one foe. Charge Arcane Rupture: stronger vulnerability on a group; no stacking.',
        5: 'Tap Force Pulse: knock back up to 6 enemies. Charge Force Wave: stronger push on up to 8. Neither slows.',
        6: 'Tap: a slowing magic shot. Charge: stronger focused beam and longer slow.',
        7: 'Tap Arcane Chain: strike up to 3 foes. Charge Chainstorm: stronger chain against up to 5. No slow.',
        8: 'Tap Astral Detonation: targeted blast, up to 5 foes. Charge Arcane Cataclysm: stronger blast, up to 7, with brief 25–29% vulnerability. No immunity.',
      },
      ranger: {
        2: 'Tap Pinning Shot: two slowing arrows. Charge Pinning Volley: slow enemies along a line.',
        3: 'Tap: heal yourself. Charge: heal you and wounded living companions. Neither revives the fallen.',
        4: 'Tap Movement Haste: move 25% faster. Charge Companion Rally: nearby allies move 15–19% faster and use basic attacks 8–12% faster briefly.',
        5: 'Tap: hit up to 6 nearby enemies. Charge Arrow Rain: fire stronger slowing arrows at up to 8.',
        6: 'Tap Repelling Shot: push one enemy with an arrow. Charge Repelling Volley: three arrows and a stronger final push; no haste.',
        7: 'Tap Piercing Arrow: one guard-piercing strike. Charge: stronger piercing strike plus slow.',
        8: 'Tap Hunter’s Salvo: arrows at up to 3 foes. Charge Grand Hunt: two arrows each at up to 5. Extra arrow against a lone foe; no piercing.',
      },
    };
    shelves.push({
      title: 'Your skills',
      intro:
        'Quick effects here; select a skill, then ask for figures. Hero Skills is also in the Adventure menu.',
      topics: D.skills.map(([slot, title]) => {
        const rank = game.hero.skills[slot - 1] || 1,
          cooldown = (charged) =>
            game.skillCooldown
              ? game.skillCooldown(slot, charged)
              : R.balance.skills.cooldowns[slot],
          shape = R.chargedSkills.second[game.hero.class],
          milestones = Math.floor(rank / 2),
          labels = {
            paladin: {
              1: 'Sword Combo',
              2: 'Sundering Strike',
              3: 'Shield Stance / Shield Bash',
              4: 'Judgment',
              5: 'Holy Area / Consecrated Wave',
              6: 'Vanguard Rush',
              7: 'Holy Assault / Oath Strike',
              8: 'Sanctuary Oath / Last Bastion',
            },
            mage: {
              1: 'Arcane Combo',
              2: 'Frost Bolt',
              3: 'Spell Interrupt / Silence Field',
              4: 'Arcane Fracture',
              5: 'Force Pulse / Force Wave',
              6: 'Magic Shot',
              7: 'Arcane Chain / Chainstorm',
              8: 'Astral Detonation / Arcane Cataclysm',
            },
            ranger: {
              1: 'Bow Combo',
              2: 'Pinning Shot',
              3: 'Self-Heal / Party Heal',
              4: 'Movement Haste / Rally',
              5: 'Arrow Volley / Arrow Rain',
              6: 'Repelling Shot / Volley',
              7: 'Piercing Arrow',
              8: 'Hunter’s Salvo / Grand Hunt',
            },
          },
          effects = {
            1: 'Three normal strikes on the same foe build a finishing splash. Changing foes or waiting too long breaks the sequence; charging delivers a stronger strike.',
            2:
              'Charge this attack to spread it through a ' +
              shape.shape +
              (shape.slow ? ' and slow the foes it hits.' : '.'),
            ...skills[game.hero.class],
          };
        return [
          'Skill ' + slot + ' · ' + (labels[game.hero.class]?.[slot] || title),
          effects[slot],
          'Your ' +
            game.hero.class +
            ' · Rank ' +
            rank +
            (game.hero.skills[slot - 1] ? '' : ' (not learned)') +
            ': base recovery ' +
            number(cooldown(false)) +
            ' seconds' +
            (mana ? '; cost ' + game.skillManaCost(slot, rank, false) + ' MP' : '') +
            '.' +
            (slot === 1
              ? '\nCombo expires after ' +
                R.basicAttackCombo.resetSeconds +
                ' seconds. Charged total damage: ×' +
                R.chargedSkills.basicDamageMultiplier +
                ' before defenses.'
              : '') +
            (slot === 2
              ? '\nCharged ' +
                shape.shape +
                ': ' +
                (shape.range
                  ? 'reach ' + (shape.range + 5 * milestones)
                  : 'radius ' + (shape.radius + 5 * milestones)) +
                ' paces.' +
                (game.hero.class === 'mage' || game.hero.class === 'ranger'
                  ? ' Tap Slow: ' +
                    slowDuration(
                      R,
                      game.hero.class === 'mage'
                        ? 2 + milestones * 0.05
                        : R.heroTactics.ranger.pin.slow +
                            milestones * R.heroTactics.ranger.pin.slowStep,
                    ) +
                    ' seconds; charged Slow: ' +
                    slowDuration(
                      R,
                      game.hero.class === 'mage'
                        ? shape.slow + 0.25 * milestones
                        : R.heroTactics.ranger.volley.slow +
                            milestones * R.heroTactics.ranger.volley.slowStep,
                    ) +
                    ' seconds on a fresh hit.'
                  : '')
              : '') +
            (slot >= 1 && slot <= 8
              ? '\nCharged recovery: ' +
                number(cooldown(true)) +
                ' seconds' +
                (mana ? '; cost ' + game.skillManaCost(slot, rank, true) + ' MP, rounded up' : '') +
                '.'
              : ''),
        ];
      }),
    });
    shelves.push({
      title: 'Companions and field bases',
      intro: 'Shared bonuses, Ranger care and TRUE boss pets.',
      topics: [
        [
          'Veteran troop techniques',
          'At Expedition Rank 4, troop training deepens: Soldiers protect themselves after a successful Power Strike; Rangers cover a close retreat with Triple Shot.',
          'Power Strike grants a self-only ' +
            percent(R.companionSkills.veteran.soldierWard) +
            '% ward for ' +
            R.companionSkills.veteran.soldierWardSeconds +
            ' seconds; it never stacks with a stronger Paladin ward. Soldier emergency immunity remains 2.5 seconds at half health or less, with 14-second recovery. A Ranger may launch its ready Triple Shot before falling back from an enemy within ' +
            R.companionSkills.veteran.coveringRange +
            ' units; only the first arrow applies ' +
            slowDuration(R, R.companionSkills.veteran.coveringSlow) +
            ' seconds of Slow on a real hit. Normal cooldown, Silence, line of sight and terrain still apply. Ranger care and charged second attacks have their own recovery and interruption rules.',
        ],
        [
          'TRUE boss pets',
          'Each TRUE boss victory permanently unlocks a miniature companion in Barracks → Company → Boss pet collection. Each pet replaces a normal companion slot; pets do not summon. Little Treasurer alone can gather tribute and join resource expeditions; other pets do not perform labor.',
          'Recruitment is free, with one individual per boss. Resting and fallen pets remain in your company, retaining their health. Treat or recover them with the normal Barracks services; recruiting the same pet again cannot replace treatment. Pets inherit hero-level health, Companion Vitality and Expedition bonuses like troops. Ranged pets keep their distance when space permits and can attack while repositioning. Attacks need a clear line. Their first skill needs no further lessons. Learning your second hero skill from Mira in Millhaven also unlocks their charged second skill. Charge preparation, interruption, Slow and Silence affect them as they affect other companions. Pets share your company’s field limit.',
        ],
        ...game
          .petCollection()
          .filter((row) => row.state !== 'Locked')
          .map(({ boss, def, state }) => [
            def.name + ' · ' + state,
            'A miniature companion inspired by ' + boss.name + '.',
            def.first.name +
              ': ' +
              petReference(game, boss.id, 1, R) +
              '\n' +
              def.second.name +
              ': ' +
              petReference(game, boss.id, 2, R),
          ]),
        [
          'Shared lessons and equipment',
          'Shared Training passes your discipline bonuses to companions. Shared Strength passes other health and damage bonuses, plus armor and reforges. Each lesson passes more of its own bonuses as its rank rises.',
          Object.entries(R.expeditionSupportSkills)
            .map(
              ([id, def]) =>
                def.name +
                ': Rank ' +
                game.expeditionSupportRank(id) +
                '/' +
                def.maxRank +
                ' passes ' +
                percent(game.expeditionSupportRank(id) / def.maxRank) +
                '% of those bonuses.',
            )
            .join('\n') +
            '\nCompanion Vitality adds ' +
            percent(R.balance.companions.vitalityPerRank) +
            '% of base companion HP per rank.',
        ],
        [
          'A Ranger’s care',
          'A Ranger treats one wounded living member of the company at a time, with you first when you need it. Recall brings companions back to your side; Barracks recovery brings back the fallen.' +
            (mana ? ' Rangers can also restore your mana.' : ''),
          'Automatic healing in combat begins at ' +
            percent(support.healThreshold) +
            '% HP or less. Heal Rank ' +
            game.rangerSupportRank('health') +
            ': ' +
            support.healAmounts[game.rangerSupportRank('health') - 1] +
            ' HP over ' +
            support.duration +
            ' seconds; recovery ' +
            support.cooldown +
            ' seconds per Ranger. Outside combat, any wounded living ally can receive care. Manual care can treat any wounded living ally.' +
            (mana
              ? '\nMana recovery begins at ' +
                percent(support.manaThreshold) +
                '% MP or less. Rank ' +
                game.rangerSupportRank('mana') +
                ': ' +
                support.manaAmounts[game.rangerSupportRank('mana') - 1] +
                ' MP over ' +
                support.duration +
                ' seconds.'
              : ''),
        ],
      ],
    });
    shelves.push({
      title: 'The Crown and its institutions',
      intro:
        'My records of the ministries, my former companions and the people living under Crown Peace.',
      topics: [
        ['Cindermaw — Interior and Welfare', keeperHistories.cindermaw],
        ['Dreadmaw — Agriculture', keeperOffices['supply-crown']],
        ['Scornfang — Reclamation', keeperOffices['supply-vale']],
        ['Ridge Tyrant — Master of Coin', keeperHistories.ridge],
        ['Crag Tyrant — Treasury captain', keeperOffices['supply-highlands']],
        ['Ashen Warlord — Frontier governor', keeperHistories.warlord],
        ['Cinder Warlord — Frontier inspector', keeperOffices['frontier-overseer']],
        ['Garun — the old roads', keeperHistories.mine],
        ['Veyrith — the unfinished sky', keeperHistories.abyss],
        ['Veyra — the common drill', keeperHistories.citadel],
        ['Whose peace?', approvedNarrative.K05.en],
        ...(game.s.throneClaimed
          ? [['The last mark — remembered at the throne', approvedNarrative.Throne_Keeper.en]]
          : []),
        [
          'Companions from the Barracks',
          'The Lifebinder and I were recruited from the Barracks too. Our disciplines belonged to different companion classes from the Soldiers and Rangers who enlist there today. You have not yet studied those disciplines.',
        ],
        ['The Lantern Wraiths’ migration', approvedNarrative.K06.en],
      ],
    });
    shelves.push({
      title: 'Adversaries and their attacks',
      intro:
        'My accounts of the great adversaries, their attacks and the creatures you have encountered.',
      topics: [
        [
          'The TRUE adversaries',
          'Field tyrants can return as TRUE after two qualifying defeats; the Dark Lord after one. A dungeon guardian has a one-in-three chance to return early, decided once after its normal defeat. Awakening calls the remaining undefeated dungeon guardians in their late TRUE form. Expect a warband as well as a stronger foe.',
        ],
        ...D.bosses.map((boss) => {
          const observed = allEnemies.filter((e) => e.type === 'boss' && e.family === boss.id),
            plans = R.attacks[boss.id] || [],
            recovery = R.bossRecovery[boss.id],
            restorative = R.enemySupportHealing.bosses[boss.id];
          return [
            boss.name,
            boss.place +
              '. ' +
              (keeperHistories[boss.id] || '') +
              '\n\nPassive — ' +
              bossPassives[boss.id] +
              (restorative
                ? '\n\nSupport — ' + restorative + ': gradual healing of injured living allies.'
                : '') +
              '\n\nAttacks: ' +
              plans
                .map(
                  (a, i) =>
                    (boss.attacks[i]?.split(':')[0] || 'Attack ' + (i + 1)) +
                    (a.species
                      ? ' — calls ' +
                        (boss.id === 'archive' && a.species === 'wraith'
                          ? 'drowned echoes'
                          : {
                              wolf: 'wolves',
                              crownguard: 'Crown soldiers',
                              mireling: 'mirelings',
                              wraith: 'Wraiths',
                              archer: 'archers',
                              ogre: 'Ogre wardens',
                              orc: 'Orc guards',
                              ashbeast: 'Ash beasts',
                            }[a.species] || 'reinforcements')
                      : a.persistent
                        ? ' — leaves danger on the ground'
                        : a.slow
                          ? ' — slows its victims'
                          : ''),
                )
                .join('; ') +
              '.',
            'Normal daytime: Level ' +
              boss.level +
              ' · HP ' +
              boss.hp +
              ' · base damage ' +
              boss.damage +
              '.\n\n' +
              plans
                .map(
                  (a, i) =>
                    (boss.attacks[i]?.split(':')[0] || 'Attack ' + (i + 1)) +
                    ': ' +
                    ({
                      cone: 'frontal arc',
                      circle: 'circular area',
                      line: 'straight lane',
                      summon: 'reinforcements',
                      volley: 'projectile volley',
                      ring: 'expanding ring',
                      canister: 'scattered canisters',
                      formation: 'defensive formation',
                      'pattern-charge': 'linked charge lanes',
                      checkerboard: 'alternating marked ground',
                      sector: 'sweeping arc',
                    }[a.kind] || 'marked area') +
                    '; warning ' +
                    a.warning +
                    's; damage ×' +
                    a.coefficient +
                    (a.manaDrain && !mana && R.vitalitySiphon.bossFamilies.includes(boss.id)
                      ? '; draws back ' +
                        percent(R.vitalitySiphon.healFraction) +
                        '% of HP actually taken'
                      : a.manaDrain && mana
                        ? '; drains ' + percent(a.manaDrain) + '% of the hero’s maximum mana'
                        : '') +
                    '.',
                )
                .join('\n') +
              ((!mana || boss.id === 'darklord') && recovery
                ? '\n\n' +
                  recovery.name +
                  ': below ' +
                  percent(recovery.threshold || R.bossRecovery.threshold) +
                  '% HP, warning ' +
                  recovery.warning +
                  's; restores ' +
                  percent(recovery.healFraction) +
                  '% of maximum HP, up to missing health' +
                  (boss.id === 'darklord'
                    ? '; once per encounter. A hit from behind interrupts this recovery. Incoming damage multiplier while preparing: ' +
                      percent(recovery.damageMultiplier) +
                      '%.'
                    : '; recovery ' + recovery.cooldown + 's.')
                : '') +
              '\n\nSummon limit: ' +
              game.bossSummonCap({ family: boss.id, form: 'normal' }) +
              ' normal / ' +
              game.bossSummonCap({ family: boss.id, form: 'true' }) +
              ' TRUE.' +
              (observed.length
                ? '\n\nVisited encounters:\n' +
                  observed
                    .map(
                      (e) =>
                        e.form +
                        ' · Level ' +
                        e.level +
                        ' · HP ' +
                        number(e.maxHp) +
                        ' · damage ' +
                        number(e.damage),
                    )
                    .join('\n')
                : '\n\nNo visited encounter yet. These base figures change with night and TRUE form.'),
          ];
        }),
        [
          'Creatures encountered',
          'These figures belong to the creatures in places you have visited. Compare their level, maximum health and damage; guards, ringleaders and ranged creatures can differ.\n\n' +
            Object.entries(game.s.zones)
              .map(([id, z]) => {
                const unique = new Map();
                for (const e of z.enemies.filter(
                  (e) => e.type !== 'boss' && !e.summon && !e.neutral,
                )) {
                  const role =
                      e.roomCaptain || e.captain
                        ? 'captain'
                        : e.guard
                          ? 'guardian'
                          : e.form === 'ringleader'
                            ? 'ringleader'
                            : 'ordinary',
                    key = [
                      e.name,
                      e.species,
                      e.form,
                      role,
                      !!e.ranged,
                      e.level,
                      e.maxHp,
                      e.damage,
                    ].join(':');
                  if (!unique.has(key))
                    unique.set(
                      key,
                      e.name +
                        ' · ' +
                        role +
                        ' · ' +
                        e.form +
                        ' · ' +
                        (e.ranged ? 'ranged' : 'melee') +
                        '\nLevel ' +
                        e.level +
                        ' · HP ' +
                        number(e.maxHp) +
                        ' · damage ' +
                        number(e.damage) +
                        (role === 'captain' && captainPassives[e.captainProfile]
                          ? '\nPassive — ' + captainPassives[e.captainProfile]
                          : '') +
                        ((e.captain || e.roomCaptain) &&
                        R.enemySupportHealing.captains[e.captainProfile]
                          ? '\nSupport — ' + R.enemySupportHealing.captains[e.captainProfile]
                          : e.ranged && R.enemySupportHealing.species[e.species]
                            ? '\nSupport — ' + R.enemySupportHealing.species[e.species]
                            : ''),
                    );
                }
                const place =
                  D.regions.find((r) => r.id === id)?.name ||
                  D.bosses.find((b) => b.id === id)?.place ||
                  game.supplyRoom?.(id)?.name ||
                  game.sideDungeon?.(id)?.name ||
                  'Visited chamber';
                return unique.size ? place + '\n' + [...unique.values()].join('\n\n') : '';
              })
              .filter(Boolean)
              .join('\n\n'),
        ],
      ],
    });
    shelves.push({
      title: 'The provinces',
      intro: 'My notes on the five provinces.',
      topics: D.regions.map((region) => [
        region.name,
        region.id === 'march'
          ? approvedNarrative.R05.en +
            (game.s.keeperEvidence ? '\n\n' + approvedNarrative.R05_append.en : '')
          : keeperProvinces[region.id],
      ]),
    });
    if (game.s.keeperEvidence)
      shelves.push({
        title: 'The orders among the shelves',
        intro: 'My part in the capture.',
        topics: [['A prisoner for the Archive', approvedNarrative.P05.en]],
      });
    return shelves;
  }

  // A4: interface/reference localization, separate from the FINAL author-approved
  // narrative. Never translate or paraphrase the locked manuscript in this map.
  const spanishReference = Object.freeze({
    'A wounded or outmatched foe may use rogue tactics: withdraw toward allies, slow a pursuer, shove attackers away or rally defenders. Chase blindly and you may gather a larger fight. Ordinary foes still show their marked Rogue warning. Guardians, ringleaders, captains and bosses instead show a moving cast bar: use real cover, or break pursuit if they draw in more enemies. Goblin dust breaks direct targeting, but area attacks can still reach the goblin.':
      'Un enemigo herido o superado puede recurrir a tácticas de retirada: buscar aliados, ralentizar a quien lo persigue, empujar a sus atacantes o reunir defensores. Perseguirlo sin cuidado puede atraer a más enemigos. Los adversarios comunes conservan su aviso marcado de táctica rebelde; guardianes, cabecillas, capitanes y jefes muestran una barra de preparación mientras se mueven. Busca cobertura real o rompe la persecución si llaman refuerzos. El polvo goblin impide fijar un objetivo directamente, pero los ataques de área pueden alcanzarlo.',
    'The Lifebinder and I were recruited from the Barracks too. Our disciplines belonged to different companion classes from the Soldiers and Rangers who enlist there today. You have not yet studied those disciplines.':
      'El Vinculador de Vida y yo también fuimos reclutados en el cuartel. Nuestras disciplinas pertenecían a clases de compañeros distintas de las de los soldados y exploradores que se alistan hoy. Todavía no has estudiado esas disciplinas.',
    'Field tyrants can return as TRUE after two qualifying defeats; the Dark Lord after one. A dungeon guardian has a one-in-three chance to return early, decided once after its normal defeat. Awakening calls the remaining undefeated dungeon guardians in their late TRUE form. Expect a warband as well as a stronger foe.':
      'Los tiranos de campo pueden volver en forma TRUE tras dos derrotas que cumplan los requisitos; el Dark Lord, tras una. Un guardián de mazmorra tiene una probabilidad de una entre tres de regresar antes, decidida una sola vez tras su derrota normal. El Despertar convoca a los guardianes restantes que aún no han sido derrotados en su forma TRUE tardía. Prepárate tanto para una tropa enemiga como para un rival más poderoso.',
    'These figures belong to the creatures in places you have visited. Compare their level, maximum health and damage; guards, ringleaders and ranged creatures can differ.\n\n':
      'Estas cifras corresponden a criaturas de lugares que ya has visitado. Compara su nivel, salud máxima y daño: los guardianes, cabecillas y combatientes a distancia pueden diferir.\n\n',

    'The Keeper’s shelves': 'Los estantes del Guardián',
    'Battle and protection': 'Combate y protección',
    'Conditions and recovery': 'Estados y recuperación',
    'Experience and discipline': 'Experiencia y disciplina',
    'Your skills': 'Tus habilidades',
    'Companions and field bases': 'Compañeros y bases de campaña',
    'The Crown and its institutions': 'La Corona y sus instituciones',
    'Adversaries and their attacks': 'Adversarios y sus ataques',
    'The provinces': 'Las provincias',
    'The orders among the shelves': 'Las órdenes entre los estantes',
    'Armor, openings and rogue tactics.':
      'Armadura, oportunidades de ataque y tácticas de retirada.',
    'Choose an effect; ask for figures when you want the full rule.':
      'Elige un efecto y solicita las cifras cuando quieras consultar la regla completa.',
    'Level gains and training.': 'Subidas de nivel y entrenamiento.',
    'Quick effects here; select a skill, then ask for figures. Hero Skills is also in the Adventure menu.':
      'Aquí encontrarás los efectos resumidos. Elige una habilidad y solicita sus cifras. Las habilidades del héroe también están en el menú de aventura.',
    'Shared bonuses, Ranger care and TRUE boss pets.':
      'Bonificaciones compartidas, cuidados de los exploradores y mascotas de jefes TRUE.',
    'My records of the ministries, my former companions and the people living under Crown Peace.':
      'Mis registros sobre los ministerios, mis antiguos compañeros y quienes viven bajo la Paz de la Corona.',
    'My accounts of the great adversaries, their attacks and the creatures you have encountered.':
      'Mis relatos sobre los grandes adversarios, sus ataques y las criaturas que has encontrado.',
    'My notes on the five provinces.': 'Mis notas sobre las cinco provincias.',
    'My part in the capture.': 'Mi participación en la captura.',
    'The TRUE adversaries': 'Los adversarios TRUE',
    'Creatures encountered': 'Criaturas encontradas',
    'Field adversaries': 'Adversarios de campo',
    'Dungeon guardians': 'Guardianes de mazmorra',
    'Offices and governors': 'Cargos y gobernadores',
    'People and records': 'Personas y registros',
    'Show me the figures': 'Muéstrame las cifras',
    'Return to the answer': 'Volver a la respuesta',
    'Another question': 'Otra pregunta',
    'All shelves': 'Todos los estantes',
    'Fortified enemies and covering fire': 'Enemigos fortificados y fuego de cobertura',
    Slow: 'Ralentización',
    Silence: 'Silencio',
    'Interrupted charges': 'Cargas interrumpidas',
    'Weaken and Fracture': 'Debilitar y Fractura',
    Taunt: 'Provocación',
    'Haste and Companion Rally': 'Celeridad y arenga de compañeros',
    'Shields, wards and immunity': 'Escudos, protecciones e inmunidad',
    'Dust and displacement': 'Polvo y desplazamiento',
    'Healing in battle': 'Curación en combate',
    'Steel, wounds and armor': 'Acero, heridas y armadura',
    'Why a great volley loses force': 'Por qué una gran descarga pierde fuerza',
    'Openings and stubborn defenders': 'Oportunidades y defensores tenaces',
    'Enemies under pressure': 'Enemigos bajo presión',
    'Why old enemies teach little': 'Por qué los enemigos inferiores enseñan poco',
    'The next lesson': 'La siguiente lección',
    'Veteran troop techniques': 'Técnicas de tropas veteranas',
    'TRUE boss pets': 'Mascotas de jefes TRUE',
    'Shared lessons and equipment': 'Enseñanzas y equipo compartidos',
    'A Ranger’s care': 'Los cuidados de un explorador',
    'Cindermaw — Interior and Welfare': 'Cindermaw — Interior y Bienestar',
    'Dreadmaw — Agriculture': 'Dreadmaw — Agricultura',
    'Scornfang — Reclamation': 'Scornfang — Recuperación',
    'Ridge Tyrant — Master of Coin': 'Ridge Tyrant — Maestro de la Moneda',
    'Crag Tyrant — Treasury captain': 'Crag Tyrant — capitán del Tesoro',
    'Ashen Warlord — Frontier governor': 'Ashen Warlord — gobernador de la Frontera',
    'Cinder Warlord — Frontier inspector': 'Cinder Warlord — inspector de la Frontera',
    'Garun — the old roads': 'Garun — los caminos antiguos',
    'Veyrith — the unfinished sky': 'Veyrith — el cielo inacabado',
    'Veyra — the common drill': 'Veyra — el entrenamiento común',
    'Whose peace?': '¿La paz de quién?',
    'The last mark — remembered at the throne': 'La última marca — recordada ante el trono',
    'Companions from the Barracks': 'Compañeros del cuartel',
    'The Lantern Wraiths’ migration': 'La migración de los espectros de Lantern',
    'A prisoner for the Archive': 'Un prisionero para el Archivo',
    'The TRUE adversaries': 'Los adversarios TRUE',
    'Normal daytime': 'Normal de día',
    'No visited encounter yet. These base figures change with night and TRUE form.':
      'Aún no has visitado este encuentro. Estas cifras base cambian de noche y en forma TRUE.',
    'Visited encounters:': 'Encuentros visitados:',
    'A miniature companion inspired by ': 'Un compañero en miniatura inspirado en ',
    'Steel, wounds and armor': 'Acero, heridas y armadura',
    'The Ash Sentinel takes 65% damage while its armor is closed; the Stone Colossus takes 125% while its core is exposed. Some captains gain protection from their followers. Clear the warning, then strike during the opening.':
      'El Centinela de Ceniza recibe el 65 % del daño con su armadura cerrada; el Coloso de Piedra recibe el 125 % con el núcleo expuesto. Algunos capitanes reciben protección de sus seguidores. Esquiva la advertencia y golpea cuando se abra una oportunidad.',
    'Fighting beneath your level brings less experience and fewer crowns. Ordinary creatures also give less experience than their listed value. If you want to grow, seek a stronger opponent.':
      'Enfrentarte a enemigos de nivel inferior concede menos experiencia y coronas. Las criaturas comunes también otorgan menos experiencia que su valor indicado. Para progresar, busca rivales más fuertes.',
    'Each level gives you a discipline point and more health. Strength, vitality and movement training improve different parts of your fighting ability.':
      'Cada nivel concede un punto de disciplina y más salud. El entrenamiento de fuerza, vitalidad y movimiento mejora distintas capacidades de combate.',
    ' Mana training improves recovery, not the size of your reserves.':
      ' El entrenamiento de maná mejora la recuperación, no la capacidad de tus reservas.',
    ' Cooldown training shortens the wait between skills.':
      ' El entrenamiento de recuperación reduce la espera entre habilidades.',
    'Armor takes the edge off a blow. Even a well-armored fighter can be wounded; immunity is what stops the hit entirely. Your companions rely on their own armor and any bonuses your training passes to them.':
      'La armadura amortigua los golpes, pero incluso un combatiente bien protegido puede resultar herido. Solo la inmunidad bloquea completamente un impacto. Tus compañeros dependen de su propia armadura y de las bonificaciones que les transmite tu entrenamiento.',
    'Landing every blow at once gives less damage than you might expect. Your company’s blows are counted together against each foe, so another attacker does not bypass the reduction. Save your strongest volley for an exposed opening.':
      'Golpear todos a la vez puede causar menos daño del esperado. Los impactos de tu compañía se acumulan por enemigo, así que otro atacante no evita esa reducción. Reserva la descarga más fuerte para una oportunidad clara.',
    'Move and recover skill cooldowns more slowly, including skills used while already slowed.':
      'El movimiento y la recuperación de las habilidades se ralentizan, incluso si la habilidad se utiliza bajo ese efecto.',
    'Blocks special skills for enemies, you and companions inside the field; movement and ordinary attacks still work.':
      'Bloquea las habilidades especiales de enemigos, héroe y compañeros dentro del campo; el movimiento y los ataques normales siguen funcionando.',
    'HP damage can cancel an unfinished charged skill; brief retry recovery replaces its full cooldown.':
      'El daño a la salud puede interrumpir una habilidad cargada antes de completarse; una breve recuperación sustituye al tiempo completo de reutilización.',
    'Weaken lowers an enemy’s damage; Fracture increases the damage it takes.':
      'Debilitar reduce el daño que causa un enemigo; Fractura aumenta el daño que recibe.',
    'Judgment draws ordinary enemy attacks toward the Paladin; scripted boss specials keep their targets.':
      'Juicio atrae los ataques ordinarios hacia el paladín; las habilidades especiales de los jefes mantienen sus objetivos previstos.',
    'Haste speeds your movement; Rally speeds nearby companions’ movement and ordinary attacks, not their specials.':
      'Celeridad acelera tu movimiento; Arenga acelera el movimiento y los ataques normales de los compañeros cercanos, no sus habilidades especiales.',
    'Shields and wards reduce damage; immunity blocks hits. Paladin protection is not invulnerability.':
      'Los escudos y las protecciones reducen el daño; la inmunidad bloquea los impactos. La protección del paladín no es invulnerabilidad.',
    'Goblin dust blocks direct targeting; area attacks still work. Shoves move you without a lasting stun.':
      'El polvo goblin impide fijar el objetivo directamente, pero no bloquea ataques de área. Los empujones desplazan sin aturdir de forma duradera.',
    'Healing restores living actors; it does not revive fallen companions. Some enemies can heal their allies too.':
      'La curación recupera a quienes siguen vivos; no resucita a los compañeros caídos. Algunos enemigos también curan a sus aliados.',
    'At Expedition Rank 4, troop training deepens: Soldiers protect themselves after a successful Power Strike; Rangers cover a close retreat with Triple Shot.':
      'En el rango 4 de Expedición, las tropas mejoran sus técnicas: los soldados se protegen tras un Golpe de Poder acertado y los exploradores cubren una retirada cercana con Disparo Triple.',
    'Each TRUE boss victory permanently unlocks a miniature companion in Barracks → Company → Boss pet collection. Each pet replaces a normal companion slot; no pet summons or performs labor.':
      'Cada victoria contra un jefe TRUE desbloquea permanentemente un compañero en miniatura en Cuartel → Compañía → Colección de mascotas de jefes. Cada mascota ocupa una plaza normal y no invoca criaturas ni trabaja.',
    'Shared Training passes your discipline bonuses to companions. Shared Strength passes other health and damage bonuses, plus armor and reforges. Each lesson passes more of its own bonuses as its rank rises.':
      'Entrenamiento compartido transmite a los compañeros tus bonificaciones de disciplina. Fuerza compartida transmite otras bonificaciones de salud y daño, además de armadura y reforjas. Cada mejora aumenta la proporción transmitida.',
    'A Ranger treats one wounded living member of the company at a time, with you first when you need it. Recall brings companions back to your side; Barracks recovery brings back the fallen.':
      'Un explorador atiende a un integrante vivo y herido de la compañía por vez, dándote prioridad cuando lo necesitas. Reagrupar acerca a los compañeros; la recuperación del cuartel devuelve a los caídos.',
    ' Rangers can also restore your mana.': ' Los exploradores también pueden restaurar tu maná.',
  });
  // Fixed skill descriptions are technical help rather than author-final lore.
  // Their ranks, costs and cooldowns still come from the English live rule path.
  const spanishSkillSummaries = Object.freeze({
    'Three normal strikes on the same foe build a finishing splash. Changing foes or waiting too long breaks the sequence; charging delivers a stronger strike.':
      'Tres golpes normales contra el mismo enemigo preparan un remate de área. Cambiar de objetivo o esperar demasiado rompe la secuencia; cargar el ataque produce un golpe más fuerte.',
    'Tap Sundering Strike: hit and weaken one enemy. Charge Holy Cleave: weaken a frontal group.':
      'Toque: Golpe Hendidor daña y debilita a un enemigo. Carga: Tajo Sagrado debilita a un grupo frontal.',
    'Tap Shield Stance: guard for 8s; basic attacks stop and other damage drops. Tap again to lower. Charge Shield Bash: push nearby enemies.':
      'Toque: Postura de Escudo protege durante 8 s; detiene los ataques básicos y reduce el resto del daño infligido. Toca de nuevo para bajar el escudo. Carga: Golpe de Escudo empuja a enemigos cercanos.',
    'Tap Judgment: a dodgeable holy shot strikes and taunts one foe. Charge Grand Judgment: hit and taunt a group. Boss specials keep their own targets.':
      'Toque: Juicio lanza un disparo sagrado esquivable que hiere y provoca a un enemigo. Carga: Gran Juicio golpea y provoca a un grupo. Los ataques especiales de los jefes conservan sus objetivos.',
    'Tap: holy area damage to 6 enemies. Charge Consecrated Wave: stronger holy damage and weaken up to 8.':
      'Toque: daño sagrado de área a hasta 6 enemigos. Carga: Ola Consagrada causa más daño sagrado y debilita a un máximo de 8.',
    'Tap Vanguard Rush: approach and strike. Charge Vanguard Impact: rush, then push nearby enemies.':
      'Toque: Avance de Vanguardia se acerca y golpea. Carga: Impacto de Vanguardia se abalanza y luego empuja a enemigos próximos.',
    'Tap: holy damage to 6 enemies. Charge Oath Strike: stronger holy damage and weaken up to 8.':
      'Toque: daño sagrado a hasta 6 enemigos. Carga: Golpe del Juramento causa más daño sagrado y debilita a un máximo de 8.',
    'Tap Sanctuary Oath: heal 15% and protect nearby allies with a 20% ward. Charge Last Bastion: heal 20%, grant 30% ward and weaken enemies. No immunity.':
      'Toque: Juramento del Santuario cura un 15 % y protege a aliados próximos con una barrera del 20 %. Carga: Último Bastión cura un 20 %, concede una barrera del 30 % y debilita a enemigos. No concede inmunidad.',
    'Tap Frost Bolt: damage and slow one foe for 2–2.2s. Charge Frost Burst: slow nearby enemies for 3.2–4.2s.':
      'Toque: Proyectil de Escarcha daña y ralentiza a un enemigo durante 2–2.2 s. Carga: Explosión de Escarcha ralentiza a los enemigos próximos durante 3.2–4.2 s.',
    'Tap Spell Interrupt: a dodgeable bolt cancels one warned attack on contact. Charge Silence Field: block special skills for enemies, you and companions inside.':
      'Toque: Interrupción de Hechizo lanza un proyectil esquivable que cancela un ataque advertido si impacta. Carga: Campo de Silencio bloquea las habilidades especiales dentro de su área, tanto de enemigos como tuyas y de compañeros.',
    'Tap Arcane Fracture: a dodgeable bolt damages and increases incoming damage to one foe. Charge Arcane Rupture: stronger vulnerability on a group; no stacking.':
      'Toque: Fractura Arcana lanza un proyectil esquivable que daña y aumenta el daño recibido por un enemigo. Carga: Ruptura Arcana aplica una vulnerabilidad más fuerte a un grupo, sin acumulación.',
    'Tap Force Pulse: knock back up to 6 enemies. Charge Force Wave: stronger push on up to 8. Neither slows.':
      'Toque: Pulso de Fuerza empuja a un máximo de 6 enemigos. Carga: Ola de Fuerza empuja con más fuerza a un máximo de 8. Ninguna ralentiza.',
    'Tap: a slowing magic shot. Charge: stronger focused beam and longer slow.':
      'Toque: disparo mágico ralentizador. Carga: haz concentrado más potente y ralentización más duradera.',
    'Tap Arcane Chain: strike up to 3 foes. Charge Chainstorm: stronger chain against up to 5. No slow.':
      'Toque: Cadena Arcana alcanza hasta 3 enemigos. Carga: Tormenta de Cadenas causa más daño a un máximo de 5. No ralentiza.',
    'Tap Astral Detonation: targeted blast, up to 5 foes. Charge Arcane Cataclysm: stronger blast, up to 7, with brief 25–29% vulnerability. No immunity.':
      'Toque: Detonación Astral causa una explosión dirigida a hasta 5 enemigos. Carga: Cataclismo Arcano causa una explosión más fuerte a hasta 7 y una vulnerabilidad breve del 25–29 %. No concede inmunidad.',
    'Tap Pinning Shot: two slowing arrows. Charge Pinning Volley: slow enemies along a line.':
      'Toque: Disparo Fijador lanza dos flechas ralentizadoras. Carga: Descarga Fijadora ralentiza a los enemigos alineados.',
    'Tap: heal yourself. Charge: heal you and wounded living companions. Neither revives the fallen.':
      'Toque: te curas. Carga: te curas y curas a compañeros vivos heridos. Ninguna versión resucita a los caídos.',
    'Tap Movement Haste: move 25% faster. Charge Companion Rally: nearby allies move 15–19% faster and use basic attacks 8–12% faster briefly.':
      'Toque: Celeridad de Movimiento aumenta tu velocidad un 25 %. Carga: Arenga de Compañeros acelera brevemente el movimiento de aliados cercanos un 15–19 % y sus ataques básicos un 8–12 %.',
    'Tap: hit up to 6 nearby enemies. Charge Arrow Rain: fire stronger slowing arrows at up to 8.':
      'Toque: golpea hasta 6 enemigos cercanos. Carga: Lluvia de Flechas dispara proyectiles ralentizadores más fuertes contra hasta 8 enemigos.',
    'Tap Repelling Shot: push one enemy with an arrow. Charge Repelling Volley: three arrows and a stronger final push; no haste.':
      'Toque: Disparo Repelente empuja a un enemigo con una flecha. Carga: Descarga Repelente lanza tres flechas y termina con un empujón más fuerte; no concede celeridad.',
    'Tap Piercing Arrow: one guard-piercing strike. Charge: stronger piercing strike plus slow.':
      'Toque: Flecha Perforante realiza un ataque que atraviesa la guardia. Carga: golpe perforante más fuerte que también ralentiza.',
    'Tap Hunter’s Salvo: arrows at up to 3 foes. Charge Grand Hunt: two arrows each at up to 5. Extra arrow against a lone foe; no piercing.':
      'Toque: Salva del Cazador alcanza hasta 3 enemigos. Carga: Gran Cacería dispara dos flechas por enemigo contra hasta 5. Añade una flecha si hay un solo objetivo; no perfora.',
  });
  // Technical lines are generated from current rules. Preserve every numeric
  // token and formula while translating recurring labels and explanations.
  // Fixed explanatory fragments flank numbers derived at runtime. Translate
  // the clauses around those numbers; never copy a cached combat value.
  const technicalClauses = [
    [
      'Enemies sheltered inside a defended fort take ',
      'Los enemigos protegidos dentro de un fuerte defendido reciben un ',
    ],
    [
      '% less damage. Ranged garrisons gain ',
      '% menos de daño. Las guarniciones a distancia obtienen un ',
    ],
    [
      '% reach and fire over their own walls.',
      '% más de alcance y disparan por encima de sus propios muros.',
    ],
    [
      'The shield beside an enemy’s health bar marks fort protection; leaving the defended area ends it.',
      'El escudo junto a la barra de salud enemiga indica protección del fuerte; esta termina al salir de la zona defendida.',
    ],
    [
      'Enemy ranged shots can arc over low fences, carts, supplies, logs and interior screens.',
      'Los disparos a distancia del enemigo pueden superar cercas bajas, carros, provisiones, troncos y separadores interiores.',
    ],
    [
      'Tall obstacles, cliffs, room boundaries and unrelated fort walls remain solid.',
      'Los obstáculos altos, acantilados, límites de salas y muros de otros fuertes siguen bloqueando los disparos.',
    ],
    [
      'Fort protection applies to ordinary troops, officers and bosses inside the area; explicit piercing attacks bypass it.',
      'La protección del fuerte se aplica a tropas, oficiales y jefes dentro de la zona; los ataques perforantes indicados la atraviesan.',
    ],
    [
      'Aiming warnings and dodgeable flight remain.',
      'Permanecen las advertencias de apuntado y los proyectiles esquivables.',
    ],
    [
      'Hero and companion shots still use their normal obstruction rules.',
      'Los disparos del héroe y de sus compañeros siguen sus reglas normales de obstrucción.',
    ],
    [
      'Heroes and companions recover cooldowns at ',
      'Los héroes y compañeros recuperan sus reutilizaciones al ',
    ],
    [
      '% of normal speed; enemies, captains and bosses at ',
      '% de la velocidad normal; enemigos, capitanes y jefes al ',
    ],
    [
      '%. Allied movement is normally 65%, or ',
      '%. El movimiento aliado suele quedar al 65 %, o al ',
    ],
    [
      '% under stronger Rogue snares; ordinary enemy pursuit is 50%.',
      '% bajo las trampas de pícaro más fuertes; la persecución enemiga normal queda al 50 %.',
    ],
    ['The longest remaining Slow wins.', 'Prevalece la ralentización de mayor duración restante.'],
    [
      'Recovery returns to normal when Slow ends.',
      'La recuperación vuelve a la normalidad cuando termina la ralentización.',
    ],
    [
      'Slow does not lengthen charge preparation, warnings or healing pulses, and does not prevent skills.',
      'La ralentización no alarga la preparación de cargas, las advertencias ni los pulsos de curación, y no impide usar habilidades.',
    ],
    [
      'The Mage’s Silence Field stays where cast for ',
      'El Campo de Silencio del mago permanece donde se lanzó durante ',
    ],
    [
      ' seconds by rank. It suppresses new specials, support-heal activation and unfinished companion charged releases.',
      ' segundos según el rango. Suprime nuevas habilidades especiales, el inicio de curación de apoyo y las cargas inacabadas de compañeros.',
    ],
    [
      'The warnings remain visible: enemy specials already being prepared wait rather than disappearing;',
      'Las advertencias siguen visibles: los especiales enemigos que ya se preparaban esperan en lugar de desaparecer;',
    ],
    [
      'projectiles, hazards, healing pulses and committed movement continue.',
      'los proyectiles, peligros, pulsos de curación y movimientos ya iniciados continúan.',
    ],
    [
      'It neither adds Slow nor freezes cooldown recovery.',
      'No aplica ralentización ni detiene la recuperación de habilidades.',
    ],
    [
      'Leaving the field or its expiry ends Silence; damage immunity does not erase the field.',
      'El Silencio termina al salir del campo o cuando expira; la inmunidad al daño no elimina el campo.',
    ],
    [
      'Heroes and companions prepare charged skills for ',
      'Héroes y compañeros preparan habilidades cargadas durante ',
    ],
    [
      ' seconds. HP actually lost during preparation adds up: interruption needs at least ',
      ' segundos. El daño real a los PV durante la preparación se acumula: la interrupción exige al menos un ',
    ],
    ['% of maximum HP, with a minimum of ', '% de los PV máximos, con un mínimo de '],
    [
      ' HP. Immunity and zero HP loss contribute nothing; lethal damage cancels an unreleased action.',
      ' PV. La inmunidad y una pérdida nula de PV no contribuyen; el daño letal cancela una acción aún no ejecutada.',
    ],
    [
      'A failed preparation spends no full skill cooldown and has ',
      'Una preparación fallida no consume el tiempo completo de reutilización y tiene ',
    ],
    [' seconds of charged retry recovery.', ' segundos de recuperación antes de volver a cargar.'],
    [
      'Damage after completed preparation cannot retroactively interrupt it.',
      'El daño posterior a una preparación completa no puede interrumpirla retroactivamente.',
    ],
    [
      'The Mage’s Spell Interrupt instead cancels one current enemy warned or aimed attack, leaving later queued attacks intact.',
      'Interrupción de Hechizo del mago cancela, en cambio, un ataque enemigo advertido o apuntado, sin afectar a los posteriores en cola.',
    ],
    [
      'Paladin weakening reduces the affected enemy’s outgoing damage for its actual duration.',
      'Debilitar del paladín reduce el daño infligido por el enemigo durante su duración real.',
    ],
    [
      'Mage Fracture is vulnerability, not Slow or Silence:',
      'Fractura del mago es vulnerabilidad, no Ralentización ni Silencio:',
    ],
    [
      'the strongest active vulnerability applies once, helping hero and companion hits.',
      'la vulnerabilidad activa más fuerte se aplica una sola vez y mejora los golpes del héroe y sus compañeros.',
    ],
    [
      'Fracture never adds multiple percentages together.',
      'Fractura nunca suma varios porcentajes entre sí.',
    ],
    [
      'Judgment and Grand Judgment redirect ordinary target choice only while the Paladin is alive, reachable and visible.',
      'Juicio y Gran Juicio redirigen la elección de objetivos ordinarios solo mientras el paladín está vivo, es alcanzable y visible.',
    ],
    [
      'Boss attention is capped at 2.5 seconds.',
      'La atención de los jefes se limita a 2.5 segundos.',
    ],
    [
      'Taunt does not remove warnings, rewrite boss phases, or bypass terrain and arena limits.',
      'La provocación no elimina advertencias, altera las fases de los jefes ni ignora los límites del terreno o la arena.',
    ],
    [
      'Ranger Skill 4 tap gives 25% hero movement haste.',
      'El toque de la habilidad 4 del explorador concede un 25 % de celeridad de movimiento al héroe.',
    ],
    [
      'Its charged Companion Rally needs living nearby allies with line of sight; with none it spends no cooldown.',
      'La Arenga cargada necesita aliados vivos cercanos con línea de visión; sin ellos no consume reutilización.',
    ],
    [
      'Rally raises companion movement 15–19% and ordinary attack speed 8–12% by rank.',
      'Arenga aumenta el movimiento de los compañeros un 15–19 % y la velocidad de ataques ordinarios un 8–12 %, según el rango.',
    ],
    [
      'It does not accelerate special preparation, special/healing cooldowns or grant a dash.',
      'No acelera la preparación de especiales ni la recuperación de estos o de curación, ni concede una embestida.',
    ],
    [
      'Slow still reduces movement and recovery independently.',
      'La ralentización sigue reduciendo por separado el movimiento y la recuperación.',
    ],
    ['Armor applies first.', 'La armadura se aplica primero.'],
    [
      'Paladin Shield Stance and a party ward use only the stronger reduction, never both multiplied.',
      'Postura de Escudo del paladín y una barrera de grupo aplican solo la reducción más fuerte, nunca ambas multiplicadas.',
    ],
    [
      'Stance stops Skill 1 and reduces other outgoing damage to 60%; its cooldown starts when lowered or expired.',
      'La postura detiene la habilidad 1 y reduce al 60 % el resto del daño infligido; su reutilización empieza al bajar o terminar la postura.',
    ],
    [
      'Soldier survival guard grants actual immunity while active.',
      'La guardia de supervivencia del soldado concede inmunidad real mientras está activa.',
    ],
    [
      'Immunity blocks damage and on-hit Slow, but not solid terrain, or the area-based Silence restriction.',
      'La inmunidad bloquea daño y ralentización por impacto, pero no terreno sólido ni el Silencio de área.',
    ],
    ['No class’s Skill 8 grants immunity.', 'La habilidad 8 de ninguna clase concede inmunidad.'],
    [
      'Dust cover protects the caster from selection and incoming targeted shots, not area damage.',
      'La cobertura de polvo impide seleccionar al lanzador como objetivo y recibir disparos dirigidos, pero no daño de área.',
    ],
    ['A shove obeys terrain collision.', 'Un empujón respeta las colisiones del terreno.'],
    [
      'Thornfang’s forced scatter briefly overrides movement commands;',
      'La dispersión forzada de Thornfang anula brevemente las órdenes de movimiento;',
    ],
    [
      'ordinary shoves do not create a general stun.',
      'los empujones ordinarios no causan aturdimiento general.',
    ],
    [
      'Ground warning shapes show the affected area, while their label follows the caster;',
      'Las marcas de advertencia en el suelo muestran el área afectada y su etiqueta sigue al lanzador;',
    ],
    [
      'a warning alone applies no damage or condition.',
      'una advertencia por sí sola no causa daño ni estados.',
    ],
    [
      'Hero skill healing is separate from Ranger support over time.',
      'La curación por habilidades del héroe es independiente del apoyo gradual de exploradores.',
    ],
    [
      'Eligible ranged enemies and selected captains/bosses treat injured living allies in an area, with eligible leaders included.',
      'Los enemigos a distancia habilitados y ciertos capitanes o jefes curan a aliados vivos heridos dentro de un área, incluidos líderes que cumplen las condiciones.',
    ],
    ['Base enemy support restores ', 'El apoyo enemigo básico restaura un '],
    ['% of the recipient’s maximum HP over ', '% de los PV máximos del destinatario durante '],
    [
      ' seconds, with their strength varying by encounter, beginning at ',
      ' segundos, con potencia variable por encuentro, a partir de ',
    ],
    ['% HP or less on a ', '% de PV o menos, con una reutilización de '],
    [
      's cooldown. Allies arriving to regroup can receive care at ',
      ' s. Los aliados que llegan a reagruparse pueden recibir curación a ',
    ],
    [
      '% HP or less, even before the healer joins combat.',
      '% de PV o menos, incluso antes de que el sanador entre en combate.',
    ],
    [
      'Slow delays the next skill, not ongoing healing pulses.',
      'La ralentización retrasa la siguiente habilidad, no los pulsos de curación en curso.',
    ],
    [
      'Siphon instead heals from HP actually taken;',
      'Drenar cura según los PV realmente arrebatados;',
    ],
    [
      'each leader’s own recovery techniques work separately.',
      'las técnicas de recuperación de cada líder actúan por separado.',
    ],
    ['Ordinary enemies give ', 'Los enemigos comunes conceden el '],
    ['% of listed XP.', '% de la experiencia indicada.'],
    [
      'A level advantage of 0 / 1 / 2 / 3 / 4 or more leaves ',
      'Una ventaja de nivel de 0 / 1 / 2 / 3 / 4 o más deja un ',
    ],
    [
      '% of XP and crowns. Crowns do not take the ordinary-XP reduction.',
      '% de experiencia y coronas. Las coronas no reciben la reducción propia de XP de enemigos comunes.',
    ],
    ['Both rewards round down.', 'Ambas recompensas se redondean hacia abajo.'],
    ['Next level: ', 'Siguiente nivel: '],
    [' × current level).', ' × nivel actual).'],
    ['Per level: 1 discipline point and ', 'Por nivel: 1 punto de disciplina y '],
    [' maximum HP.', ' PV máximos.'],
    ['strength +', 'fuerza +'],
    ['power; vitality +', 'poder; vitalidad +'],
    [' HP; movement +', ' PV; movimiento +'],
    [' speed per rank. Rank limits: ', ' velocidad por rango. Límites de rango: '],
    ['Cooldown training: ', 'Entrenamiento de recuperación: '],
    [
      '% of the original wait per rank, up to ',
      '% de la espera original por rango, hasta una reducción del ',
    ],
    ['% reduction.', '%.'],
    ['Your armor: ', 'Tu armadura: '],
    ['including equipment and reforges.', 'incluidos equipo y reforjas.'],
    [
      'Shield Stance and wards then use only the stronger reduction;',
      'Postura de Escudo y barreras aplican solo la reducción más fuerte;',
    ],
    ['immunity stops the hit.', 'la inmunidad detiene el impacto.'],
    ['Hits share a rolling ', 'Los impactos comparten una ventana móvil de '],
    ['-second total for each target.', ' segundos por objetivo.'],
    ['Below the threshold, damage is unchanged.', 'Por debajo del umbral, el daño no cambia.'],
    [
      'Above it: threshold + tail × ln(1 + (raw damage − threshold) / tail).',
      'Por encima: umbral + cola × ln(1 + (daño bruto − umbral) / cola).',
    ],
    [
      'Each hit deals the increase in that total.',
      'Cada impacto inflige el incremento correspondiente de ese total.',
    ],
    [
      'During an opening, both figures are multiplied by ',
      'Durante una oportunidad, ambas cifras se multiplican por ',
    ],
    [
      'Ordinary creatures, guardians and ringleaders can seek help below ',
      'Criaturas comunes, guardianes y cabecillas pueden solicitar ayuda por debajo de ',
    ],
    ['A retreat seeks reachable allies within ', 'Una retirada busca aliados alcanzables en '],
    [
      'Continued pursuit can lead to another local retreat and more allies.',
      'Perseguirlos puede provocar otra retirada local y atraer más aliados.',
    ],
    [
      'The foe takes half damage while preparing to withdraw, withdrawing or making a tactical escape;',
      'El enemigo recibe la mitad del daño al prepararse para retirarse, retirarse o escapar tácticamente;',
    ],
    [
      'that protection ends when it settles or abandons the retreat.',
      'esa protección termina al detenerse o abandonar la retirada.',
    ],
  ];
  const technicalPhrases = [
    [' · ', ' · '],
    ['Skill ', 'Habilidad '],
    [' questions', ' preguntas'],
    ['Your ', 'Tu '],
    ['Normal daytime: Level ', 'Normal de día: nivel '],
    ['Level ', 'Nivel '],
    ['Rank ', 'Rango '],
    [' (not learned)', ' (sin aprender)'],
    ['HP', 'PV'],
    [' MP', ' PM'],
    ['damage', 'daño'],
    ['maximum health', 'salud máxima'],
    ['maximum HP', 'PV máximos'],
    ['max HP', 'PV máximos'],
    ['base damage', 'daño base'],
    ['recovery ', 'recuperación '],
    ['Charged recovery:', 'Recuperación cargada:'],
    ['Charge ', 'Carga '],
    ['Charged ', 'Cargado '],
    ['Tap ', 'Toque '],
    [' seconds', ' segundos'],
    [' second', ' segundo'],
    [' paces', ' pasos'],
    ['radius ', 'radio '],
    ['reach ', 'alcance '],
    ['cooldown', 'tiempo de reutilización'],
    ['warning ', 'advertencia '],
    ['Summon limit:', 'Límite de invocación:'],
    [' normal / ', ' normal / '],
    [' (TRUE ', ' (TRUE '],
    ['normal speed', 'velocidad normal'],
    [' below ', ' por debajo de '],
    [' above ', ' por encima de '],
    [' allies', ' aliados'],
    [' enemies', ' enemigos'],
    ['companion', 'compañero'],
    ['attack', 'ataque'],
    ['healing', 'curación'],
    ['Armor ', 'Armadura '],
    ['before defenses', 'antes de las defensas'],
    [' per rank', ' por rango'],
    ['No visited encounter yet.', 'Aún no has visitado este encuentro.'],
    [
      'These base figures change with night and TRUE form.',
      'Estas cifras base cambian de noche y en forma TRUE.',
    ],
    ['Visited encounters:', 'Encuentros visitados:'],
    ['Ordinary', 'Común'],
    ['Guardian', 'Guardián'],
    ['Ringleader', 'Cabecilla'],
    ['Captain', 'Capitán'],
    ['Normal boss', 'Jefe normal'],
    ['TRUE boss', 'Jefe TRUE'],
    ['Passive — ', 'Pasiva — '],
    ['Support — ', 'Apoyo — '],
    ['Attacks:', 'Ataques:'],
    ['Attack ', 'Ataque '],
    ['threshold ', 'umbral '],
    ['tail ', 'cola '],
    ['frontal arc', 'arco frontal'],
    ['circular area', 'área circular'],
    ['straight lane', 'línea recta'],
    ['reinforcements', 'refuerzos'],
    ['projectile volley', 'descarga de proyectiles'],
    ['expanding ring', 'anillo expansivo'],
    ['scattered canisters', 'recipientes dispersos'],
    ['defensive formation', 'formación defensiva'],
    ['linked charge lanes', 'carriles de carga enlazados'],
    ['alternating marked ground', 'suelo marcado alternado'],
    ['sweeping arc', 'arco de barrido'],
    ['marked area', 'área marcada'],
    ['slow', 'ralentizar'],
    ['immunity', 'inmunidad'],
    ['summons', 'invocaciones'],
    ['ranged', 'a distancia'],
    ['melee', 'cuerpo a cuerpo'],
    ['ordinary', 'común'],
    ['ringleader', 'cabecilla'],
    ['captain', 'capitán'],
    ['guardian', 'guardián'],
    ['damage ×', 'daño ×'],
    ['heals ', 'cura '],
    ['HP or less', 'PV o menos'],
    ['MP or less', 'PM o menos'],
    ['over ', 'durante '],
    ['per living', 'por cada '],
    ['at your level', 'a tu nivel'],
  ];
  const archiveTechnicalCopy = [
    ['Automatic healing in combat begins at ', 'La curación automática en combate comienza al '],
    [
      ' Manual care can treat any wounded living ally.',
      ' La curación manual puede atender a cualquier aliado vivo herido.',
    ],
    [
      'On the first Slow hit, heroes and companions recover cooldowns at ',
      'En el primer impacto de Ralentización, héroes y compañeros recuperan sus habilidades al ',
    ],
    ['Each successful Slow hit adds ', 'Cada impacto efectivo de Ralentización añade '],
    [
      's to its authored duration. The longest remaining duration wins, not the sum.',
      ' s a su duración prevista. Prevalece la mayor duración restante; no se suman.',
    ],
    [
      'Recovery speed is the first-hit rate / (1 + (stacks - 1) × stack penalty): ',
      'La velocidad de recuperación es la tasa del primer impacto / (1 + (acumulaciones - 1) × penalización por acumulación): ',
    ],
    [' for allies; ', ' para aliados; '],
    [' for enemies. ', ' para enemigos. '],
    [
      'Each hit also adds its full adjusted duration × ',
      'Cada impacto también añade toda su duración ajustada × ',
    ],
    [
      '% to eligible recovering allied cooldowns, or ',
      '% a los tiempos de reutilización aliados aplicables que aún se recuperan, o un ',
    ],
    [
      '% for enemies. Ready skills gain no debt.',
      '% para enemigos. Las habilidades ya listas no reciben deuda.',
    ],
    [
      'The Ash Sentinel’s closed-armor multiplier is 65%; the Stone Colossus’s exposed-core multiplier is 125%. These apply before other passive defenses and burst compression, so they are not final damage percentages. Some captains gain protection from their followers. Clear the warning, then strike during the opening.',
      'El multiplicador de armadura cerrada de Ash Sentinel es del 65 %; el del núcleo expuesto de Stone Colossus es del 125 %. Se aplican antes de otras defensas pasivas y de la compresión de daño acumulado, así que no representan porcentajes finales de daño. Algunos capitanes reciben protección de sus seguidores. Esquiva la advertencia y golpea durante la oportunidad.',
    ],
    [' per engaged summoned Archer within ', ' por arquero invocado en combate dentro de '],
    [' per engaged summoned Orc within ', ' por orco invocado en combate dentro de '],
    [' paces, max ', ' pasos, máximo '],
    ['; those Orcs deal +', '; esos orcos causan un +'],
    [
      's. With living field companions, at least two distinct attackers must contribute.',
      ' s. Con compañeros vivos en el campo, deben participar al menos dos atacantes distintos.',
    ],
    [
      'Tap Frost Bolt: damage and slow one foe for ',
      'Toque: Proyectil de Escarcha daña y ralentiza a un enemigo durante ',
    ],
    [
      's. Charge Frost Burst: slow nearby enemies for ',
      ' s. Carga: Explosión de Escarcha ralentiza a los enemigos próximos durante ',
    ],
    [': base recovery ', ': reutilización básica '],
    [' seconds. Charged total damage: ×', ' segundos. Daño cargado total: ×'],
    [' Tap Slow: ', ' Ralentización al toque: '],
    [' seconds; charged Slow: ', ' segundos; ralentización cargada: '],
    [' seconds on a fresh hit.', ' segundos en un impacto sin ralentización previa.'],
    [
      'Each TRUE boss victory permanently unlocks a miniature companion in Barracks → Company → Boss pet collection. Each pet replaces a normal companion slot; pets do not summon. Little Treasurer alone can gather tribute and join resource expeditions; other pets do not perform labor.',
      'Cada victoria contra un jefe TRUE desbloquea permanentemente un compañero en miniatura en Cuartel → Compañía → Colección de mascotas de jefes. Cada mascota ocupa una plaza normal y no invoca criaturas. Solo Little Treasurer puede recoger tributos y participar en expediciones de recursos; las demás mascotas no realizan trabajos.',
    ],
    [
      ' seconds of Slow on a real hit. Normal cooldown, Silence, line of sight and terrain still apply. Ranger care and charged second attacks have their own recovery and interruption rules.',
      ' segundos de Ralentización al impactar. Siguen vigentes la reutilización normal, Silencio, línea de visión y terreno. Los cuidados del explorador y los segundos ataques cargados tienen reglas propias de recuperación e interrupción.',
    ],
    ['In combat, healing begins at ', 'En combate, la curación comienza al '],
    [
      ' seconds per Ranger. Outside combat, any wounded living ally can receive care.',
      ' segundos por explorador. Fuera de combate se puede atender a cualquier aliado vivo herido.',
    ],
    ['% of maximum HP, up to missing health', '% de los PV máximos, hasta la salud que falta'],
    [
      '; once per encounter. A hit from behind interrupts this recovery. Incoming damage multiplier while preparing: ',
      '; una vez por encuentro. Un impacto por detrás interrumpe esta recuperación. Multiplicador del daño recibido durante la preparación: ',
    ],
    ['Charged circle', 'Carga circular'],
    ['Charged cone', 'Carga en cono'],
    ['Charged line', 'Carga en línea'],
    [' · up to 1 target(s)', ' · hasta 1 objetivo'],
    [
      'Move and recover skill cooldowns more slowly. Repeated Slow hits suppress recovery further and add lasting cooldown debt.',
      'El movimiento y la recuperación de habilidades se ralentizan. Los impactos repetidos de Ralentización reducen aún más la recuperación y añaden una deuda de reutilización que persiste.',
    ],
    [
      '% under stronger Rogue snares; ordinary enemy pursuit is 50%. Every Slow hit adds ',
      '% bajo las trampas de pícaro más fuertes; la persecución enemiga normal queda al 50 %. Cada impacto de Ralentización añade ',
    ],
    [
      's to its authored duration; Ringleader Rogue snares last 2.95s.',
      ' s a su duración prevista; las trampas de pícaro de los cabecillas duran 2.95 s.',
    ],
    [
      'The longest remaining duration wins, but overlapping hits increase recovery suppression and add debt to unfinished skill cooldowns.',
      'Prevalece la mayor duración restante, pero los impactos superpuestos reducen más la recuperación y añaden deuda a los tiempos de reutilización aún pendientes.',
    ],
    [
      'Stack strength clears when Slow expires; accumulated cooldown debt remains.',
      'La intensidad acumulada se borra cuando termina la Ralentización; la deuda de reutilización acumulada permanece.',
    ],
    [
      'Preparation, warnings and healing pulses are not delayed, and skills are never outright blocked by Slow.',
      'La preparación, las advertencias y los pulsos de curación no se retrasan, y la Ralentización nunca bloquea por completo las habilidades.',
    ],
    ['Active', 'Activo'],
    [', self-regeneration ', ', regeneración propia del '],
    [
      'Before shields and wards: max(3, incoming damage − armor × 0.35). ',
      'Antes de escudos y barreras: max(3, daño recibido − armadura × 0.35). ',
    ],
    ['% of maximum HP; tail ', '% de los PV máximos; cola '],
    [
      'Charged Cataclysm gives a stronger but shorter burst window than the longer Skill 4 vulnerability.',
      'Cataclismo cargado ofrece una oportunidad más intensa pero más breve que la vulnerabilidad prolongada de la habilidad 4.',
    ],
    ['% HP. A foe at least ', '% de PV. Un enemigo al menos '],
    [
      ' level below you can react to that disadvantage; otherwise ',
      ' nivel por debajo de ti puede reaccionar a esa desventaja; de lo contrario, ',
    ],
    [
      ' living attackers must focus it. Nearby companions do not count unless they are actually attacking that foe. Enemies ',
      ' atacantes vivos deben concentrarse en él. Los compañeros cercanos solo cuentan si realmente atacan a ese enemigo. Los enemigos ',
    ],
    [
      ' or more levels above you do not use rogue tactics.',
      ' o más niveles por encima de ti no usan tácticas de pícaro.',
    ],
    [
      'At your level, summoning bosses and captains need at most ',
      'A tu nivel, los jefes y capitanes invocadores necesitan como máximo ',
    ],
    [
      ' living summoned ally, with the next summoning not yet ready.',
      ' aliado invocado vivo, con la siguiente invocación aún en recuperación.',
    ],
    [
      ' and Dreadmaw can also act cunningly under that same summon condition.',
      ' y Dreadmaw también pueden actuar con astucia bajo esa misma condición de invocación.',
    ],
    [' paces; one ally is enough.', ' pasos; basta con un aliado.'],
    [
      'Ringleaders, captains and bosses have distinct basic maneuvers and stronger situational tricks. Watch the cast progress while they move: these are choices, not an automatic pair of attacks. Some commanders rally living troops or refill nearby defeated guard posts; their usual summoned creatures remain separate.',
      'Cabecillas, capitanes y jefes tienen maniobras básicas propias y recursos situacionales más potentes. Observa la preparación mientras se mueven: son decisiones, no una pareja automática de ataques. Algunos mandos reúnen tropas vivas o reponen puestos cercanos de guardias derrotados; sus criaturas invocadas habituales siguen siendo independientes.',
    ],
    ['Power Strike grants a self-only ', 'Golpe de Poder concede solo al soldado una barrera del '],
    ['% ward for ', '% durante '],
    [
      ' seconds; it never stacks with a stronger Paladin ward. Soldier emergency immunity remains 2.5 seconds at half health or less, with 14-second recovery. A Ranger may launch its ready Triple Shot before falling back from an enemy within ',
      ' segundos; nunca se acumula con una barrera más fuerte de paladín. La inmunidad de emergencia del soldado sigue durando 2.5 segundos con la mitad de salud o menos, con 14 segundos de recuperación. Un explorador puede usar Disparo Triple si está listo antes de retirarse de un enemigo situado a menos de ',
    ],
    [' units; only the first arrow applies ', ' unidades; solo la primera flecha aplica '],
    [
      ' second of Slow on a real hit. Normal cooldown, Silence, line of sight and terrain still apply. Ranger care and charged second attacks have their own recovery and interruption rules.',
      ' segundo de Ralentización al impactar. Siguen vigentes la reutilización normal, Silencio, línea de visión y terreno. Los cuidados del explorador y los segundos ataques cargados tienen reglas propias de recuperación e interrupción.',
    ],
    [
      'Recruitment is free, with one individual per boss. Resting and fallen pets remain in your company, retaining their health. Treat or recover them with the normal Barracks services; recruiting the same pet again cannot replace treatment. Pets inherit hero-level health, Companion Vitality and Expedition bonuses like troops. Ranged pets keep their distance when space permits and can attack while repositioning. Attacks need a clear line. Their first skill needs no further lessons. Learning your second hero skill from Mira in Millhaven also unlocks their charged second skill. Charge preparation, interruption, Slow and Silence affect them as they affect other companions. Pets share your company’s field limit.',
      'El reclutamiento es gratuito, con un individuo por jefe. Las mascotas en descanso o caídas siguen en tu compañía y conservan su salud. Trátalas o recupéralas mediante los servicios normales del cuartel; volver a reclutar la misma mascota no sustituye el tratamiento. Heredan salud según el nivel del héroe, Vitalidad de Compañeros y bonificaciones de Expedición, como las tropas. Las mascotas a distancia se separan del enemigo cuando hay espacio y pueden atacar mientras se recolocan. Sus ataques requieren una línea despejada. La primera habilidad no necesita más lecciones. Aprender tu segunda habilidad con Mira en Millhaven también desbloquea su segunda habilidad cargada. Preparación, interrupción, Ralentización y Silencio les afectan como a los demás compañeros. Comparten el límite de integrantes en el campo de tu compañía.',
    ],
    ['A miniature companion inspired by ', 'Un compañero en miniatura inspirado en '],
    ['Shared Training', 'Entrenamiento compartido'],
    ['Shared Strength', 'Fuerza compartida'],
    [' passes ', ' transmite un '],
    ['% of those bonuses.', '% de esas bonificaciones.'],
    ['Companion Vitality adds ', 'Vitalidad de Compañeros añade un '],
    ['% of base companion HP per rank.', '% de los PV básicos del compañero por rango.'],
    ['Healing begins at ', 'La curación comienza al '],
    ['% HP or less. Heal Rank ', '% de PV o menos. Rango de curación '],
    [' seconds per Ranger.', ' segundos por explorador.'],
    ['Mana recovery begins at ', 'La recuperación de maná comienza al '],
    ['% MP or less. Rank ', '% de PM o menos. Rango '],
    [' HP over ', ' PV durante '],
    [' MP over ', ' PM durante '],
    ['; cost ', '; coste '],
    [' MP, rounded up', ' PM, redondeado hacia arriba'],
    ['Combo expires after ', 'El combo caduca tras '],
    [' seconds. Charged damage: ×', ' segundos. Daño cargado: ×'],
    [' Slow lasts ', ' La Ralentización dura '],
    ['Sword Combo', 'Combo de Espada'],
    ['Sundering Strike', 'Golpe Hendidor'],
    ['Shield Stance / Shield Bash', 'Postura de Escudo / Golpe de Escudo'],
    ['Judgment', 'Juicio'],
    ['Holy Area / Consecrated Wave', 'Área Sagrada / Ola Consagrada'],
    ['Vanguard Rush', 'Avance de Vanguardia'],
    ['Holy Assault / Oath Strike', 'Asalto Sagrado / Golpe del Juramento'],
    ['Sanctuary Oath / Last Bastion', 'Juramento del Santuario / Último Bastión'],
    ['Arcane Combo', 'Combo Arcano'],
    ['Frost Bolt', 'Proyectil de Escarcha'],
    ['Spell Interrupt / Silence Field', 'Interrupción de Hechizo / Campo de Silencio'],
    ['Arcane Fracture', 'Fractura Arcana'],
    ['Force Pulse / Force Wave', 'Pulso de Fuerza / Ola de Fuerza'],
    ['Magic Shot', 'Disparo Mágico'],
    ['Arcane Chain / Chainstorm', 'Cadena Arcana / Tormenta de Cadenas'],
    ['Astral Detonation / Arcane Cataclysm', 'Detonación Astral / Cataclismo Arcano'],
    ['Bow Combo', 'Combo de Arco'],
    ['Pinning Shot', 'Disparo Inmovilizador'],
    ['Self-Heal / Party Heal', 'Curación Propia / Curación de Grupo'],
    ['Movement Haste / Rally', 'Celeridad de Movimiento / Arenga'],
    ['Arrow Volley / Arrow Rain', 'Descarga de Flechas / Lluvia de Flechas'],
    ['Repelling Shot / Volley', 'Disparo Repulsivo / Descarga'],
    ['Piercing Arrow', 'Flecha Perforante'],
    ['Hunter’s Salvo / Grand Hunt', 'Salva del Cazador / Gran Cacería'],
    ['Rapid Deployment: Wolves move +', 'Despliegue Rápido: los lobos se mueven un +'],
    ['Structural Consolidation: reduction ', 'Consolidación Estructural: reducción del '],
    ['Groundwater Recharge: heals ', 'Recarga Subterránea: cura un '],
    [' max HP/s on own live mud', ' de los PV máximos/s sobre su propio lodo activo'],
    [
      'Emergency Stabilization: once below half HP, mitigation ',
      'Estabilización de Emergencia: al bajar por primera vez de la mitad de PV, mitigación del ',
    ],
    ['Contractual Protection: base mitigation ', 'Protección Contractual: mitigación básica del '],
    [
      ' per living Archer under his command, max three',
      ' por arquero vivo bajo su mando, máximo tres',
    ],
    [' each).', ' cada uno).'],
    [
      'Self-Assembly: core-closed mitigation ',
      'Autoensamblaje: mitigación con el núcleo cerrado del ',
    ],
    ['); core relock heals ', '); volver a cerrar el núcleo cura un '],
    [' max HP (TRUE ', ' de los PV máximos (TRUE '],
    ['Chain of Command: base mitigation ', 'Cadena de Mando: mitigación básica del '],
    [
      ' per nearby Orc under his command; those Orcs deal +',
      ' por orco cercano bajo su mando; esos orcos causan un +',
    ],
    [' per Orc, +', ' por orco, +'],
    [' Orc damage).', ' de daño de orco).'],
    ['Aerial Superiority: base mitigation ', 'Superioridad Aérea: mitigación básica del '],
    ['; after completed offensive flight ', '; tras completar un vuelo ofensivo, '],
    ['Regimental Cohesion: base mitigation ', 'Cohesión del Regimiento: mitigación básica del '],
    ['; with active guarded Dress Ranks ', '; con formación protegida activa de Dress Ranks, '],
    ['Emergency Provisioning: below ', 'Aprovisionamiento de Emergencia: por debajo de '],
    [' HP, self-regeneration ', ' PV, regeneración propia del '],
    [' max HP/s alone or ', ' de los PV máximos/s en solitario o '],
    ['/s near Ash beasts, total cap ', '/s cerca de bestias de ceniza, límite total del '],
    ['/s, cap ', '/s, límite del '],
    ['); heals injured nearby Ash beasts.', '); cura a bestias de ceniza heridas cercanas.'],
    ["Veteran's Instinct: ", 'Instinto de Veterano: '],
    [' damaging hits within ', ' impactos dañinos en '],
    ['s grant ', ' s conceden una mitigación del '],
    [' mitigation for ', ' durante '],
    [' for ', ' durante '],
    ['); cooldown ', '); reutilización de '],
    ['s cooldown.', ' s de reutilización.'],
    ['Prolonged Exposure: regular Slow +', 'Exposición Prolongada: Ralentización regular +'],
    [', phase +', ', en fase +'],
    ['Strain Hardening: ', 'Endurecimiento por Esfuerzo: '],
    [' mitigation per damaging hit, up to ', ' de mitigación por impacto dañino, hasta '],
    [', refreshed for ', ', renovada durante '],
    ['Hazard Pay: ', 'Pago por Riesgo: '],
    [' base protection plus ', ' de protección básica más '],
    [
      ' with living nearby Treasury guards; guards deal +',
      ' con guardias del Tesoro vivos cercanos; los guardias causan un +',
    ],
    ['Escalating Enforcement: ', 'Imposición Creciente: '],
    [' mitigation per real hit, max ', ' de mitigación por impacto real, máximo '],
    ['; full stacks deal +', '; con todas las acumulaciones causa un +'],
    ['Broodward: ', 'Protección de la Prole: '],
    [' protection per living broodling, max ', ' de protección por cría viva, máximo '],
    [' — calls drowned echoes', ' — invoca ecos ahogados'],
    [' — calls wolves', ' — invoca lobos'],
    [' — calls mirelings', ' — invoca criaturas del lodazal'],
    [' — calls Wraiths', ' — invoca espectros'],
    [' — calls archers', ' — invoca arqueros'],
    [' — calls Crown soldiers', ' — invoca soldados de la Corona'],
    [' — calls Ogre wardens', ' — invoca guardianes ogros'],
    [' — calls Orc guards', ' — invoca guardias orcos'],
    [' — calls Ash beasts', ' — invoca bestias de ceniza'],
    [' — calls reinforcements', ' — llama refuerzos'],
    [' — leaves danger on the ground', ' — deja un peligro en el suelo'],
    [' — slows its victims', ' — ralentiza a sus víctimas'],
    [': gradual healing of injured living allies.', ': curación gradual de aliados vivos heridos.'],
    ['; draws back ', '; recupera un '],
    ['% of HP actually taken', '% de los PV realmente arrebatados'],
    ['; drains ', '; drena un '],
    ['% of the hero’s maximum mana', '% del maná máximo del héroe'],
    ['s; restores ', ' s; restaura un '],
    [
      '% of maximum HP, up to missing health; recovery ',
      '% de los PV máximos, hasta la salud que falta; reutilización de ',
    ],
    ['TRUE', 'TRUE'],
    ['normal', 'normal'],
    ['paladin', 'paladín'],
    ['mage', 'mago'],
    ['ranger', 'explorador'],
    ['Recruitable', 'Disponible para reclutar'],
    ['With you', 'Contigo'],
    ['Resting', 'En descanso'],
    ['Fallen', 'Caído'],
    ['single target', 'objetivo único'],
    ['circle', 'círculo'],
    ['cone', 'cono'],
    ['line', 'línea'],
    [' reach', ' de alcance'],
    ['× companion attack', '× ataque de compañero'],
    ['% damage against targets at or below ', '% de daño contra objetivos al '],
    ['% HP', '% de PV'],
    [' · up to ', ' · hasta '],
    [' target(s)', ' objetivos'],
    ['s recovery', ' s de recuperación'],
    [' · Slow ', ' · Ralentización '],
    [' · self-heal ', ' · curación propia del '],
    [' · self-ward ', ' · barrera propia del '],
    [' · heals one wounded ally within ', ' · cura a un aliado herido a menos de '],
    [
      '% of the pet’s maximum HP; clear line required',
      '% de los PV máximos de la mascota; requiere una línea despejada',
    ],
    ['-radius splash around the aimed enemy', ' de radio de área alrededor del enemigo elegido'],
    [
      '° fan from the pet toward the aimed enemy',
      '° de abanico desde la mascota hacia el enemigo elegido',
    ],
    [
      '-wide strip from the pet through the aimed enemy',
      ' de ancho de franja desde la mascota a través del enemigo elegido',
    ],
    [' · hits the aimed enemy only', ' · solo golpea al enemigo elegido'],
    [
      ' · dodgeable shot; effects require contact',
      ' · disparo esquivable; los efectos requieren contacto',
    ],
    [
      ' · clear line required; aim stays locked during the second skill’s 0.65s interruptible hold',
      ' · requiere una línea despejada; la puntería queda fijada durante los 0.65 s de preparación interrumpible de la segunda habilidad',
    ],
    ['Visited chamber', 'Sala visitada'],
    ['XP', 'XP'],
    [
      "Cindermaw's devoted disciple administers crops, livestock, meat, dairy, poultry, fisheries and their distribution across all five Crown provinces. He co-manages the whole Treasury with the Interior ministry and guards its Inner Vault. Ridge Tyrant oversees coin and accounts. I keep the records. The Lantern Wraiths have grown fond of Dreadmaw, and he returns their affection.",
      'El devoto discípulo de Cindermaw administra los cultivos, el ganado, la carne, los lácteos, las aves de corral, la pesca y su distribución en las cinco provincias de la Corona. Comparte la gestión de todo el Tesoro con el ministerio del Interior y protege su Cámara Interior. Ridge Tyrant supervisa las monedas y las cuentas. Yo conservo los registros. Los Lantern Wraiths le han tomado cariño a Dreadmaw, y él les corresponde.',
    ],
    [
      "Scornfang is Thornfang's Goblin disciple and Greenwood's Superintendent of Reclamation. He oversees decommissioning, remediation, salvage and relocation for the estate works. His authority belongs to that local office. The materials he recovers find their way into the estate's construction accounts.",
      'Scornfang es el discípulo goblin de Thornfang y el superintendente de Recuperación de Greenwood. Supervisa el desmantelamiento, la restauración del terreno, el rescate de materiales y los traslados para las obras de la residencia. Su autoridad pertenece a ese cargo local. Los materiales recuperados figuran en las cuentas de construcción de la residencia.',
    ],
    [
      "Crag Tyrant is a horned humanoid mountain tyrant like his mentor, Ridge Tyrant. He guards the Treasury household, paid accounts, coin stores and its three separate caches. Crown riders on armored direwolves form his household security, with bunks, wolf bedding and saddle racks in their shared quarters. Wild Highland wolves keep their own dens. Crag regards steady wages and guarded shipments as sufficient reason for strict control. He answers to the Master of Coin; the mint and the province's government lie beyond his household duties.",
      'Crag Tyrant es un tirano montañés humanoide con cuernos, como su mentor, Ridge Tyrant. Protege a los residentes del Tesoro, las cuentas pagadas, las reservas de monedas y sus tres depósitos separados. Jinetes de la Corona sobre lobos gigantes acorazados forman su guardia, con literas, lechos para lobos y soportes de monturas en los alojamientos compartidos. Los lobos salvajes de las Highlands mantienen sus propias guaridas. Crag considera los salarios estables y los cargamentos protegidos razones suficientes para imponer un control estricto. Responde ante el Maestro de la Moneda; la ceca y el gobierno provincial quedan fuera de sus funciones domésticas.',
    ],
    [
      "Cinder Warlord inspects the Frontier on the Ashen Warlord's behalf. He visits roads, work details and occupied settlements, enforcing orders while markets and repair crews continue their work. His Mandatory Overtime can press up to seven nearby workers into a fight. Without workers present, there is no one for him to order forward.",
      'Cinder Warlord inspecciona la Frontier en nombre de Ashen Warlord. Recorre caminos, grupos de trabajo y asentamientos ocupados, imponiendo órdenes mientras mercados y cuadrillas de reparación siguen trabajando. Mandatory Overtime puede obligar a hasta siete trabajadores cercanos a combatir. Sin trabajadores presentes, no tiene a quién ordenar avanzar.',
    ],
  ];
  function translateArchiveLabel(value) {
    if (typeof value !== 'string') return value;
    return Object.prototype.hasOwnProperty.call(spanishReference, value)
      ? spanishReference[value]
      : value;
  }
  // Match source text once. Never feed Spanish output back through an English
  // glossary, or partially translate an English sentence before matching it.
  // A healing amount is not a duration. Capture the live figures as one
  // clause so the generic duration word "for" cannot change their meaning.
  const petHealPattern =
    / · heals one wounded ally within (\d+(?:\.\d+)?) for (\d+(?:\.\d+)?)% of the pet’s maximum HP; clear line required/;
  let archiveTranslation;
  let namedTranslation;
  function namedCatalog(names) {
    const base = translationCatalog();
    if (!names.length) return base;
    const key = [...new Set(names)].filter(Boolean).sort().join('\0');
    if (namedTranslation?.key === key) return namedTranslation;
    const entries = new Map(base.entries);
    for (const name of key.split('\0')) entries.set(name, name);
    namedTranslation = { key, entries, pattern: translationPattern(entries) };
    return namedTranslation;
  }
  function translationPattern(entries) {
    const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keys = [...entries.keys()].sort((a, b) => b.length - a.length);
    return new RegExp(
      petHealPattern.source +
        '|' +
        keys
          .map(
            (key) =>
              (/^[A-Za-z]/.test(key) ? '(?<![A-Za-zÁ-ÿ])' : '') +
              escape(key) +
              (/[A-Za-z]$/.test(key) ? '(?![A-Za-zÁ-ÿ])' : ''),
          )
          .join('|'),
      'g',
    );
  }
  // Proper names are source identities, not technical sentence fragments.
  function translationNames(game, { D, R }) {
    return [
      ...D.bosses.flatMap((b) => [b.name, b.place, ...b.attacks.map((a) => a.split(':')[0])]),
      ...D.regions.map((r) => r.name),
      ...Object.values(R.petCompanions).flatMap((p) => [p.name, p.first.name, p.second.name]),
      ...Object.values(R.bossRecovery)
        .map((p) => p.name)
        .filter(Boolean),
      ...['species', 'captains', 'bosses'].flatMap((key) =>
        Object.values(R.enemySupportHealing[key]),
      ),
      ...Object.entries(game.s.zones)
        .flatMap(([id, z]) => [
          game.supplyRoom?.(id)?.name,
          game.sideDungeon?.(id)?.name,
          ...z.enemies.map((e) => e.name),
        ])
        .filter(Boolean),
    ];
  }
  function translationCatalog() {
    if (archiveTranslation) return archiveTranslation;
    const approved = (
      typeof PrototypeNarration !== 'undefined' ? PrototypeNarration : require('./narration.js')
    ).approved;
    const entries = new Map([
      ...technicalPhrases,
      ...technicalClauses,
      ...Object.entries(spanishReference),
      ...Object.entries(spanishSkillSummaries),
      ...archiveTechnicalCopy,
    ]);
    for (const pair of Object.values(approved)) {
      entries.set(pair.en, pair.es);
      entries.set(pair.es, pair.es);
    }
    archiveTranslation = { entries, pattern: translationPattern(entries) };
    return archiveTranslation;
  }
  function translateArchive(value, names = []) {
    if (typeof value !== 'string') return value;
    const { entries, pattern } = namedCatalog(names);
    return value.replace(pattern, (source) =>
      entries.has(source)
        ? entries.get(source)
        : source.replace(
            petHealPattern,
            ' · cura a un aliado herido dentro de $1 por una cantidad equivalente al $2% de los PV máximos de la mascota; requiere una línea despejada',
          ),
    );
  }
  const api = {
    translationNames,
    sections,
    conditionTopics,
    translateArchive,
    translateArchiveLabel,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeArchive = api;
})(typeof window !== 'undefined' ? window : globalThis);
