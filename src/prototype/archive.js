/* Optional, read-only Archive reference. Figures come from live rules and Campaign queries. */
(function (root) {
  'use strict';
  const darkLordHistory =
    "He once crossed the provinces with a close company of adventurers, leaving victories and grieving villages behind. One day no one told them where to go next. He forged a peace in which rival peoples could trade; now he keeps it through levies, garrisons and captive labor. 'Freedom has a price,' he says.";
  function sections(game, { D, R }) {
    const number = (value) => Math.round(value * 100) / 100,
      percent = (value) => number(value * 100),
      mana = R.resourceMode?.manaEnabled !== false,
      allEnemies = Object.values(game.s.zones).flatMap((z) => z.enemies),
      profile = game.talentProfile(),
      support = R.rangerSupport,
      tactics = R.tacticalFoundation,
      burst = tactics.burstCompression,
      shelves = [];
    shelves.push({
      title: 'Battle and protection',
      intro: 'Armor, openings and rogue tactics.',
      topics: [
        [
          'Steel, wounds and armor',
          'Armor takes the edge off a blow. Even a well-armored fighter can be wounded; immunity is what stops the hit entirely. Your companions rely on their own armor and any bonuses your training passes to them.',
          'Damage taken = max(3, incoming damage − armor × 0.35). Your armor: ' +
            number(game.armor()) +
            ', including equipment and reforges.',
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
            ' living owned summon and a summon still waiting to recover. Thornfang, Ashen Warlord, Dark Lord and Dreadmaw can also act cunningly under that same summon condition.\n\n' +
            'A retreat seeks reachable allies within ' +
            tactics.awarenessRadius +
            ' paces; one ally is enough. Continued pursuit can lead to another local retreat and more allies. The foe takes half damage while preparing to withdraw, withdrawing or making a tactical escape; that protection ends when it settles or abandons the retreat.\n\n' +
            'Ringleaders, captains and bosses have distinct basic maneuvers and stronger situational tricks. Watch the cast progress while they move: these are choices, not an automatic pair of attacks. Some commanders rally living troops or refill nearby defeated guard posts; their usual summoned creatures remain separate.',
        ],
      ],
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
    const skills = {
      paladin: {
        2: 'Sundering Strike: a sword attack weakens one foe; charged Holy Cleave weakens every enemy struck in a short frontal cone.',
        3: 'Shield Stance: raise your shield for up to 8 seconds, greatly reducing incoming damage. Basic Skill 1 is disabled and other attacks deal 60% damage. Tap again to lower the shield and start its cooldown. Charged Shield Bash damages and pushes a nearby frontal group; bosses and captains take half bash damage.',
        4: 'Judgment: strike and provoke an enemy to attack you. Charged Grand Judgment damages and taunts a group around the target.',
        5: 'Tap: a nearby holy area attack. Charge: Consecrated Wave reaches farther, hits harder, and weakens enemies for your defenders.',
        6: 'Tap: rush toward a visible foe and strike. Charge: Vanguard Impact rushes into a short holy shockwave, striking and pushing nearby enemies.',
        7: 'Tap: powerful holy area damage. Charge: Oath Strike extends the area and weakens enemies hit by its stronger strike.',
        8: 'Tap Sanctuary Oath: holy area damage (3× Power) within 320 units, self-heal 15% max HP, grant the hero and nearby living companions 20% incoming damage reduction for 3.5s (longer with skill rank). Charge Last Bastion: 5.5× Power holy area damage within 420+ units, self-heal 20%, weaken struck enemies, and grant a 30% party ward for 5s+. Neither version grants immunity.',
      },
      mage: {
        2: 'Frost Bolt slows one target; charged Frost Burst damages and slows enemies around the target.',
        3: 'Spell Interrupt: cancel one enemy attack while it is warned or being aimed. Charged Silence Field blocks special skills for enemies, the Mage and companions within the field, but allows movement and basic attacks.',
        4: 'Arcane Fracture: damage one enemy and increase all incoming hero and companion damage. Charged Arcane Rupture hits a group and applies a stronger, non-stacking vulnerability.',
        5: 'Tap Force Pulse: 2.3× Power area damage within 350 units and collision-safe knockback. Charge Force Wave: 3× Power damage within 370+ units and larger knockback. Neither version applies Slow.',
        6: 'Tap: a slowing magic projectile. Charge: a concentrated arcane beam deals more damage and lengthens Slow on one foe.',
        7: 'Tap Arcane Chain: strikes up to 3 targets around the selected enemy, dealing 6.5×/4.5×/3× Power in sequence. Charge Chainstorm: strikes up to 5 targets with 9×/6×/4× Power; no Slow or new status.',
        8: 'Tap Astral Detonation: targeted area explosion within 210 units of the enemy; primary target takes 6× Power and other enemies 3.5×. Charge Arcane Cataclysm: radius 260+; primary 9× and splash 5× Power, plus 12–16% damage vulnerability for 4.5s. Neither version heals or grants immunity.',
      },
      ranger: {
        2: 'Pinning Shot fires two arrows and briefly slows the target; charged Pinning Volley pierces a line of enemies and slows those struck.',
        3: 'Tap to heal yourself; charge to heal wounded living companions too. Neither restores the fallen.',
        4: 'Tap Movement Haste: hero moves 25% faster for 4–5.75s. Charge Companion Rally: nearby living active companions within 350–390 units gain 15–19% movement speed and 8–12% ordinary attack speed for 4–5s. No dash, invulnerability, or special cooldown acceleration.',
        5: 'Tap: arrows strike nearby enemies. Charge: Arrow Rain sends stronger arrows into a wider area and briefly slows each foe struck.',
        6: 'Tap Repelling Shot: ranged attack plus a 45–65-unit push on hit, without haste. Charge Repelling Volley: three rapid shots totaling 4.2× Power, with a final collision-safe push of 65–85 units. Neither changes movement or attack speed.',
        7: 'Tap: one targeted defense-piercing arrow. Charge: a stronger piercing shot also briefly slows its target.',
        8: 'Tap Hunters Salvo: fires one 5× Power arrow at each of up to 3 enemies close to the selected target (radius 260). Charge Grand Hunt: fires two 4× Power arrows each at up to 5 enemies in radius 320–360 (maximum two arrows per enemy). No invulnerability, healing, or haste in either form.',
      },
    };
    shelves.push({
      title: 'Your skills',
      intro: 'Effects first; current ranks and timing on request.',
      topics: D.skills.map(([slot, title]) => {
        const rank = game.hero.skills[slot - 1] || 1,
          cooldown = (charged) =>
            game.skillCooldown
              ? game.skillCooldown(slot, charged)
              : R.balance.skills.cooldowns[slot],
          shape = R.chargedSkills.second[game.hero.class],
          milestones = Math.floor(rank / 2),
          labels = {
            paladin: { 2: 'Sundering Strike', 3: 'Shield Stance / Shield Bash', 4: 'Judgment' },
            mage: { 2: 'Frost Bolt', 3: 'Spell Interrupt / Silence Field', 4: 'Arcane Fracture' },
            ranger: { 2: 'Pinning Shot', 3: 'Healing', 4: 'Movement Haste / Rally' },
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
                (shape.range ? 'reach ' + (shape.range + 5 * milestones) : 'radius ' + (shape.radius + 5 * milestones)) +
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
      intro: 'Shared bonuses and Ranger care.',
      topics: [
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
      intro: 'Ministries, former companions and the people living under Crown Peace.',
      topics: [
        ['Cindermaw — Interior and Welfare', D.bosses.find((b) => b.id === 'cindermaw').history],
        ['Dreadmaw — Agriculture', R.roomCaptains['supply-crown'].history],
        ['Scornfang — Reclamation', R.roomCaptains['supply-vale'].history],
        ['Ridge Tyrant — Master of Coin', D.bosses.find((b) => b.id === 'ridge').history],
        ['Crag Tyrant — Treasury captain', R.roomCaptains['supply-highlands'].history],
        ['Ashen Warlord — Frontier governor', D.bosses.find((b) => b.id === 'warlord').history],
        ['Cinder Warlord — Frontier inspector', R.roomCaptains['frontier-overseer'].history],
        [
          'Garun — the old roads',
          'Garun built roads and defensible settlements before he chose the fitted stone body around his heart. The bridges still carry food and trade between the provinces. Dara gets paid for repairs inside the Mine, but cannot leave.',
        ],
        [
          'Veyrith — the unfinished sky',
          'Veyrith carried the Dark Lord in the old days. Abyss Bastion now has harness stations and a training ground, but the royal air fleet is unfinished. Veyrith wants enough patrols overhead that no enemy can surprise the roads below.',
        ],
        [
          'Veyra — the common drill',
          'Veyra taught Goblins, Ogres and Crown soldiers to hold one line, obey the same commands and care for their equipment. She and Garun both take craft seriously. Her disciplined Citadel could command the realm if the throne stood empty.',
        ],
        [
          'Whose peace?',
          'Reedport fish can reach inland markets, and Ironroot miners receive regular crowns. Those same guarded roads move levies and captive workers. The trade works. The people who keep it working do not all get to choose.',
        ],
        ...(game.s.throneClaimed
          ? [
              [
                'The last mark — remembered at the throne',
                'The six-signature ledger in Greenwood and the Keeper’s record of the final external command pointed to one missing adventurer. At the defeated ruler’s throne the last of seven marks answered to you: you were the missing sixth companion of his former party. Your present Paladin, Mage or Ranger training does not overwrite that past, award a new class, or demand another dungeon victory.',
              ],
            ]
          : []),
        [
          'Companions from the Barracks',
          'Lifebinder and the Drowned Keeper were originally recruited from the Barracks, through the same institution that supplies today’s Soldiers and Rangers. They belonged to different companion classes the present hero has not discovered. Their history does not make them Soldiers or Rangers.',
        ],
        [
          'The Lantern Wraiths’ migration',
          'The Lantern Wraiths left Ironroot when mining and mint production became intolerable. They now study in the Keeper’s Archive and help him; he cautions them to mind their lanterns. They resent the flooding, whose cause remains unknown. Cindermaw and Dreadmaw have grown fond of the Wraiths, and the feeling is mutual. They socialize when their different duties permit.',
        ],
      ],
    });
    shelves.push({
      title: 'Adversaries and their attacks',
      intro: 'Boss histories, attacks and creature statistics.',
      topics: [
        [
          'The TRUE adversaries',
          'Field tyrants can return as TRUE after two qualifying defeats; the Dark Lord after one. A dungeon guardian has a one-in-three chance to return early, decided once after its normal defeat. Awakening calls the remaining undefeated dungeon guardians in their late TRUE form. Expect a warband as well as a stronger foe.',
        ],
        ...D.bosses.map((boss) => {
          const observed = allEnemies.filter((e) => e.type === 'boss' && e.family === boss.id),
            plans = R.attacks[boss.id] || [],
            recovery = R.bossRecovery[boss.id];
          return [
            boss.name,
            boss.place +
              '. ' +
              (boss.history || (boss.id === 'darklord' ? darkLordHistory : '')) +
              '\n\nAttacks: ' +
              plans
                .map(
                  (a, i) =>
                    (boss.attacks[i]?.split(':')[0] || 'Attack ' + (i + 1)) +
                    (a.species
                      ? ' — calls ' + a.species
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
                    a.kind +
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
                        number(e.damage),
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
      intro: 'The five provinces and their histories.',
      topics: D.regions.map((region) => [
        region.name,
        game.s.keeperEvidence
          ? region.exploration
          : region.exploration.replace(
              'and councillor who proposed capturing the specialists',
              'and councillor',
            ),
      ]),
    });
    if (game.s.keeperEvidence)
      shelves.push({
        title: 'The orders among the shelves',
        intro: 'His part in the capture.',
        topics: [
          [
            'A prisoner for the Archive',
            '“Yes. I proposed taking the specialists. When the lower shelves flooded, I traded another captive for Neri’s skill. You have read my seal. Keep these records dry, and I will put what I know to better use.”',
          ],
        ],
      });
    return shelves;
  }
  const api = { sections };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeArchive = api;
})(typeof window !== 'undefined' ? window : globalThis);
