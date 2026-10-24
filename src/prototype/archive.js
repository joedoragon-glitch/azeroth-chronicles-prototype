/* Optional, read-only Archive reference. Figures come from live rules and Campaign queries. */
(function (root) {
  'use strict';
  // Archive prose belongs to the Keeper; shared encounter briefs are not dialogue.
  // Keeper history: verbatim EN manuscript passages; ES is paired in Narration.approved.
  const keeperHistories = {
    thorn: "Thornfang trained as a Crown wilderness scout in professional canine handling, recall, scent work and pack welfare. He patrols the approaches to the Dark Lord's winter estate. Mira has accompanied these patrols as a paid instructor, though her service came without the freedom to leave. When a fight breaks off, he leads his pack toward the den. His tracks remain visible along the woodland paths.",
    crypt: "The Lifebinder and I traveled with the Dark Lord long before these garrisons. His work combines mortuary science and thanatology with the conservation and reuse of buildings. His skeletons endure and remain aware; they are not living people restored to life. I refuse to confuse the two, particularly when I record their names and allegiances. The Lifebinder’s bindings sustain work on the still-unfinished winter estate; Borin was compelled to contribute to its construction.",
    mire: "My maps show the Marches' principal waterways. Mirejaw knows bends and shallow channels they do not. His mud slows pursuers and helps his wounds close. Reedport and Fisher Camp still fish outside his territory; not every boat answers to him.",
    archive: "I belonged to the Dark Lord’s traveling company before I settled in the Archive. These days I keep records, sit on the council and fish when my duties allow. I drowned long ago; that is how I came by my name. The flooding of these shelves is a later calamity, and its cause remains unknown to me. Neri knows what can be done to preserve the damaged books.",
    ridge: "Ridge Tyrant can produce a figure for almost anything he argues: wages, repaired roads, minted crowns, caravans delivered. His title is Master of Coin; in practice, he directs the Crown’s economy and finances. Paying the specialists pressed into service was his proposal. They receive wages even when they cannot refuse the assignment. His contracted archers protect payrolls and mineral shipments, sometimes far beyond Ironroot. I keep copies of his accounts. One advantage of figures is that you can check them.",
    mine: "I knew Garun the Firstborn as our Ogre Bastion. During one expedition he held a collapsing mountain gate long enough to save the company. Garun has designed roads, bridges and fortresses, but perhaps his most remarkable work was himself. He designed his own stone body, fitted around a luminous heartstone, with golden eyes, an angular shell and a separate diamond core. All his own work. He would still rather inspect a bridge than endure another council meeting about construction.\nAt Colossus Mine, Ogre wardens and Crown riders on armored direwolves guard the site; the riders' bunks and their mounts' kennels share the working quarters. Ridge Tyrant, his captain and the crews manage the Mine’s accounts, wages and daily production. Garun is well paid, though the Mine has expenses he must meet. He spends spare crowns on little machines, strange ornaments and architectural experiments. I confess I enjoy seeing what he brings back.\nThe Mine’s records show fair payment for Dara’s repairs and unusual commissions, alongside the limited movement she could negotiate and Garun’s power to deny her departure while captive. Garun trusts the Dark Lord and is comfortable here; the Mine is his workshop and refuge as much as his post. Should the throne stand empty, the roads, strongholds and labor under his control could make him powerful. I suspect he would try to keep people safe by directing their movement. Whether they would welcome such protection is another matter.",
    warlord: "The Ashen Warlord commands the Orc warbands occupying the Frontier. Reports arriving here describe repaired crossings, supplied checkpoints and caravans reaching Emberwatch again. His patrols inspect the roads, collect Crown taxes and enforce military orders in occupied settlements. Work is paid; specialists recruited by force cannot simply walk away from their posts. Cinder Warlord inspects those routes for him. The approaches to Abyss Bastion’s unfinished air works remain guarded. Trade has resumed under military supervision.",
    abyss: "I remember Veyrith carrying the Dark Lord during our travels: a purple dragon, proud, disciplined and loyal. I see no reason to think the years have made him less so. He defends the proposed royal air force fiercely, convinced that control of the sky can secure the peace below. The hatchery, harness stations and launch platform at Abyss Bastion are being prepared for that purpose. The platform is unfinished, and there is no completed fleet yet.",
    citadel: "Veyra guarded the coastal roads before joining our company. She trained Goblins, Ogres, Humans and other irregular troops to drill together, maintain their equipment and take pride in their uniforms. Even as marshal, she still trains Crown soldiers herself. She still practices cosmetology; in her view, something useful should also look right. Garun shares her interest in design. I have heard their conversations on workmanship and proportion at length. She is loyal to the Dark Lord and wary of politics. Yet if his throne stood empty, her officers and disciplined garrisons could put the provinces under her command. I doubt she would enjoy governing them; a military administration might nevertheless be the result.",
    cindermaw: "The Dark Lord appointed Cindermaw because he could organize Ash beasts and administer territory. Crownwatch, Ash Refuge, the Ruined Foundry, roads and supply lines fall under his ministry. These services provide food and shelter and employ paid workers. Some specialists serve by conscription, not choice. Cindermaw co-manages the Treasury with Dreadmaw, who guards its Inner Vault. The Treasury accounts record Vera’s wages as Master Smith and the restrictions imposed on her while captive. Those wages did not give her permission to leave.",
    darklord: "I traveled with the Dark Lord through victories that some towns celebrated and others mourned. There came a day when the last command from outside never received a successor. He made his own decisions then. Rival peoples began trading under his peace, and Crown roads now link more of the realm. Those roads also carry soldiers, tax revenues and specialists pressed into paid service.\nHe says, ‘Freedom has a price.’ I wrote that down. The accounts record wages for posts whose occupants cannot freely refuse the assignment.",
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
    vale: "My Greenwood records begin with Millhaven, Orchard Hamlet and the working mill, among farms and woodland roads. At the Forest Crypt, the Lifebinder—one of my old companions—oversees the Dark Lord’s unfinished winter residence. He works with skeletons who endure and remain aware, although they are not alive again. Every skeleton retains an identity; some still use their former names and loyalties.",
    highlands: "The Dark Lord seized Ironroot's silver-bearing and copper-bearing mountains long ago. Quarry Outpost retains its old name, though its workings now sort the ore sent to Stonecross. Silver and copper move separately under guard; the mint strikes crowns with the Dark Lord's portrait, and the Master of Coin records the wages and shipments. I compare incoming ore with the mint's output. Some residents welcome the reliable work. Others resent Crown ownership. Away from the roads, wolves hunt while Ogre households cook, work stone and gather at their hearths.",
    frontier: "Reports from the Ashen Frontier describe red poppies on disturbed earth and pale-trunk saplings rising among cooled ash and old blast scars. Gardens are returning beside damaged walls; the ravine and old battle sites remain scarred. Emberwatch and Burned Hamlet rebuild under the Warlord’s rule. The repaired crossings carry food and trade, while inspections and taxes remain enforced. Specialists pressed into Crown service receive wages, but cannot refuse their appointments. The Ruined Shrine barracks, the forts, the night Stalkers’ hold and the guarded route to Abyss Bastion remain parts of that occupation.",
    crown: "Crownwatch maintains homes, guarded transport and roads. The Citadel, Cindermaw's ministry and the barracks enforce Crown authority. Near the lava channels, heat exchangers and insulated flues carry volcanic warmth to glass and ceramic kilns, drying rooms, public baths and rooms used in winter. The Ruined Foundry and the fortress roads employ paid crews. At the Crystal Deposit, workers extract valuable crystals and prepare them for shipment. These are all part of the Crown's functioning economy. The records also list taxes and wages paid to specialists conscripted into posts they cannot refuse.",
  };
  // Shared short definitions feed the optional quick reference; the third field
  // is expanded only by the Keeper's existing "Show me the figures" path.
  function conditionTopics(R) {
    const percent = (value) => Math.round(value * 10000) / 100,
      charge = R.chargedSkills,
      heal = R.enemySupportHealing;
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
        'Move and recover skill cooldowns more slowly, including skills used while already slowed.',
        'Heroes and companions recover cooldowns at ' +
          percent(R.cooldownBalance.slowRecoveryMultiplier) +
          '% of normal speed; enemies, captains and bosses at ' +
          percent(R.cooldownBalance.enemySlowRecoveryMultiplier) +
          '%. Allied movement is normally 65%, or ' +
          percent(R.tacticalFoundation.rogueSlowMovementFactor) +
          '% under stronger Rogue snares; ordinary enemy pursuit is 50%. The longest remaining Slow wins. Recovery returns to normal when Slow ends. Slow does not lengthen charge preparation, warnings or healing pulses, and does not prevent skills.',
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
    const approvedNarrative =
      (typeof PrototypeNarration !== 'undefined'
        ? PrototypeNarration
        : require('./narration.js')).approved;
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
          ' per living Archer under his command, max three (TRUE ' +
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
          ' per nearby Orc under his command; those Orcs deal +' +
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
          's.',
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
          'The Ash Sentinel takes 65% damage while its armor is closed; the Stone Colossus takes 125% while its core is exposed. Some captains gain protection from their followers. Clear the warning, then strike during the opening.',
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
        2: 'Tap Frost Bolt: damage and slow one foe for 2–2.2s. Charge Frost Burst: slow nearby enemies for 3.2–4.2s.',
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
            ': recovery ' +
            number(cooldown(false)) +
            ' seconds' +
            (mana ? '; cost ' + game.skillManaCost(slot, rank, false) + ' MP' : '') +
            '.' +
            (slot === 1
              ? '\nCombo expires after ' +
                R.basicAttackCombo.resetSeconds +
                ' seconds. Charged damage: ×' +
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
                (shape.slow ? ' Slow lasts ' + (shape.slow + 0.25 * milestones) + ' seconds.' : '')
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
            ' seconds; it never stacks with a stronger Paladin ward. Soldier emergency immunity remains 2.5 seconds below half health, with 14-second recovery. A Ranger may launch its ready Triple Shot before falling back from an enemy within ' +
            R.companionSkills.veteran.coveringRange +
            ' units; only the first arrow applies ' +
            R.companionSkills.veteran.coveringSlow +
            ' second of Slow on a real hit. Normal cooldown, Silence, line of sight and terrain still apply. Ranger care and charged second attacks have their own recovery and interruption rules.',
        ],
        [
          'TRUE boss pets',
          'Each TRUE boss victory permanently unlocks a miniature companion in Barracks → Company → Boss pet collection. Each pet replaces a normal companion slot; no pet summons or performs labor.',
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
              game.petSkillSummary(boss.id, 1, true) +
              '\n' +
              def.second.name +
              ': ' +
              game.petSkillSummary(boss.id, 2, true),
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
          'Healing begins at ' +
            percent(support.healThreshold) +
            '% HP or less. Heal Rank ' +
            game.rangerSupportRank('health') +
            ': ' +
            support.healAmounts[game.rangerSupportRank('health') - 1] +
            ' HP over ' +
            support.duration +
            ' seconds; recovery ' +
            support.cooldown +
            ' seconds per Ranger.' +
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
        [
          'Garun — the old roads',
          keeperHistories.mine,
        ],
        [
          'Veyrith — the unfinished sky',
          keeperHistories.abyss,
        ],
        [
          'Veyra — the common drill',
          keeperHistories.citadel,
        ],
        [
          'Whose peace?',
          approvedNarrative.K05.en,
        ],
        ...(game.s.throneClaimed
          ? [
              [
                'The last mark — remembered at the throne',
                approvedNarrative.Throne_Keeper.en,
              ],
            ]
          : []),
        [
          'Companions from the Barracks',
          'The Lifebinder and I were recruited from the Barracks too. Our disciplines belonged to different companion classes from the Soldiers and Rangers who enlist there today. You have not yet studied those disciplines.',
        ],
        [
          'The Lantern Wraiths’ migration',
          approvedNarrative.K06.en,
        ],
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
              (!mana && recovery
                ? '\n\n' +
                  recovery.name +
                  ': below ' +
                  percent(R.bossRecovery.threshold) +
                  '% HP, warning ' +
                  recovery.warning +
                  's; restores ' +
                  percent(recovery.healFraction) +
                  '% of maximum HP, up to missing health; recovery ' +
                  recovery.cooldown +
                  's.'
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
        topics: [
          [
            'A prisoner for the Archive',
            approvedNarrative.P05.en,
          ],
        ],
      });
    return shelves;
  }

  // A4: interface/reference localization, separate from the FINAL author-approved
  // narrative. Never translate or paraphrase the locked manuscript in this map.
  const spanishReference = Object.freeze({
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
    'Armor, openings and rogue tactics.': 'Armadura, oportunidades de ataque y tácticas de retirada.',
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
    'Slow': 'Ralentización',
    'Silence': 'Silencio',
    'Interrupted charges': 'Cargas interrumpidas',
    'Weaken and Fracture': 'Debilitar y Fractura',
    'Taunt': 'Provocación',
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
    ' Rangers can also restore your mana.':
      ' Los exploradores también pueden restaurar tu maná.',
  });
  // Technical lines are generated from current rules. Preserve every numeric
  // token and formula while translating recurring labels and explanations.
  const technicalPhrases = [
    [' · ', ' · '],
    ['Skill ', 'Habilidad '],
    [' questions', ' preguntas'],
    ['Your ', 'Tu '], ['Normal daytime: Level ', 'Normal de día: nivel '],
    ['Level ', 'Nivel '], ['Rank ', 'Rango '], [' (not learned)', ' (sin aprender)'],
    ['HP', 'PV'], [' MP', ' PM'], ['damage', 'daño'], ['maximum health', 'salud máxima'],
    ['maximum HP', 'PV máximos'], ['max HP', 'PV máximos'],
    ['base damage', 'daño base'], ['recovery ', 'recuperación '],
    ['Charged recovery:', 'Recuperación cargada:'],
    ['Charge ', 'Carga '], ['Charged ', 'Cargado '],
    ['Tap ', 'Toque '], [' seconds', ' segundos'], [' second', ' segundo'],
    [' paces', ' pasos'], ['radius ', 'radio '], ['reach ', 'alcance '],
    ['cooldown', 'tiempo de reutilización'], ['warning ', 'advertencia '],
    ['Summon limit:', 'Límite de invocación:'], [' normal / ', ' normal / '],
    [' (TRUE ', ' (TRUE '], ['normal speed', 'velocidad normal'],
    [' below ', ' por debajo de '], [' above ', ' por encima de '],
    [' allies', ' aliados'], [' enemies', ' enemigos'], ['companion', 'compañero'],
    ['attack', 'ataque'], ['healing', 'curación'], ['Armor ', 'Armadura '],
    ['before defenses', 'antes de las defensas'], [' per rank', ' por rango'],
    ['No visited encounter yet.', 'Aún no has visitado este encuentro.'],
    ['These base figures change with night and TRUE form.',
      'Estas cifras base cambian de noche y en forma TRUE.'],
    ['Visited encounters:', 'Encuentros visitados:'],
    ['Ordinary', 'Común'], ['Guardian', 'Guardián'], ['Ringleader', 'Cabecilla'],
    ['Captain', 'Capitán'], ['Normal boss', 'Jefe normal'], ['TRUE boss', 'Jefe TRUE'],
    ['Passive — ', 'Pasiva — '], ['Support — ', 'Apoyo — '],
    ['Attacks:', 'Ataques:'], ['Attack ', 'Ataque '],
    ['threshold ', 'umbral '], ['tail ', 'cola '],
    ['frontal arc', 'arco frontal'], ['circular area', 'área circular'],
    ['straight lane', 'línea recta'], ['reinforcements', 'refuerzos'],
    ['projectile volley', 'descarga de proyectiles'], ['expanding ring', 'anillo expansivo'],
    ['scattered canisters', 'recipientes dispersos'],
    ['defensive formation', 'formación defensiva'], ['linked charge lanes', 'carriles de carga enlazados'],
    ['alternating marked ground', 'suelo marcado alternado'], ['sweeping arc', 'arco de barrido'],
    ['marked area', 'área marcada'], ['slow', 'ralentizar'], ['immunity', 'inmunidad'],
    ['summons', 'invocaciones'], ['ranged', 'a distancia'], ['melee', 'cuerpo a cuerpo'],
    ['ordinary', 'común'], ['ringleader', 'cabecilla'], ['captain', 'capitán'],
    ['guardian', 'guardián'], ['damage ×', 'daño ×'], ['heals ', 'cura '],
    ['HP or less', 'PV o menos'], ['MP or less', 'PM o menos'],
    ['over ', 'durante '], ['per living', 'por cada '], ['at your level', 'a tu nivel'],
  ];
  function translateArchive(value) {
    if (typeof value !== 'string') return value;
    if (Object.prototype.hasOwnProperty.call(spanishReference, value))
      return spanishReference[value];
    let result = value;
    // Whole paragraph translation first: keep approved author text untouched.
    // Technical interpolation comes afterward and cannot alter numeric inputs.
    for (const [english, spanish] of Object.entries(spanishReference)) {
      if (english.length > 55 && result.includes(english))
        result = result.replaceAll(english, spanish);
    }
    for (const [english, spanish] of technicalPhrases)
      if (english !== spanish) result = result.replaceAll(english, spanish);
    return result;
  }
  const api = { sections, conditionTopics, translateArchive };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeArchive = api;
})(typeof window !== 'undefined' ? window : globalThis);
