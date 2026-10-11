/* Optional, read-only Archive reference. Figures come from live rules and Campaign queries. */
(function (root) {
  'use strict';
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
          'A wounded or outmatched foe may use rogue tactics: withdraw toward allies, slow a pursuer, shove attackers away or rally defenders. Chase blindly and you may gather a larger fight. Leave the marked attack area; if the retreat draws you into fresh enemies, break pursuit and regroup. Goblin dust breaks direct targeting, but area attacks can still reach the goblin.',
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
            'Ringleaders, captains and bosses have distinct basic maneuvers and stronger situational tricks. Watch the named warning: these are choices, not an automatic pair of attacks. Some commanders rally living troops or refill nearby defeated guard posts; their usual summoned creatures remain separate.',
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
        4: 'You become briefly immune to damage.',
        5: 'Holy power strikes nearby enemies.',
        6: 'A melee strike with a short recovery.',
        7: 'A stronger holy attack strikes nearby enemies.',
      },
      mage: {
        4: 'Your barrier grants brief immunity to damage.',
        5: 'A frost burst damages and slows nearby enemies.',
        6: 'A magic projectile briefly slows its target.',
        7: 'A stronger frost spell damages and slows nearby enemies.',
      },
      ranger: {
        4: 'A burst of speed helps you escape or reposition.',
        5: 'Arrows strike enemies around you.',
        6: 'A rapid shot also briefly hastens your movement.',
        7: 'A piercing arrow follows your chosen foe.',
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
          effects = {
            1: 'Three normal strikes on the same foe build a finishing splash. Changing foes or waiting too long breaks the sequence; charging delivers a stronger strike.',
            2:
              'Charge this attack to spread it through a ' +
              shape.shape +
              (shape.slow ? ' and slow the foes it hits.' : '.'),
            3: 'Tap to heal yourself; charge to heal wounded living companions too. Neither restores the fallen.',
            8: 'Strike nearby foes, restore some of your health and briefly become immune to damage.',
            ...skills[game.hero.class],
          };
        return [
          'Skill ' + slot + ' · ' + title,
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
                (shape.range ? 'reach ' + shape.range : 'radius ' + shape.radius) +
                ' paces.' +
                (shape.slow ? ' Slow lasts ' + shape.slow + ' seconds.' : '')
              : '') +
            (slot <= 3
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
              (boss.history || '') +
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
