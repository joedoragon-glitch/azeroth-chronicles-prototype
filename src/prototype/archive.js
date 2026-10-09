/* Optional, read-only Archive reference. Numbers come from live rules and Campaign queries. */
(function (root) {
  'use strict';
  function sections(game, { D, R }) {
    const percent = (value) => Math.round(value * 100),
      number = (value) => Math.round(value * 100) / 100,
      mana = R.resourceMode?.manaEnabled !== false,
      allEnemies = Object.values(game.s.zones).flatMap((z) => z.enemies),
      gap = R.progression.levelGapRewards.map(percent),
      support = R.rangerSupport,
      profile = game.talentProfile(),
      shelves = [];
    shelves.push({
      title: 'Battle and protection',
      intro: 'Steel, spells and the value of an opening.',
      topics: [
        [
          'Steel, wounds and armor',
          'Armor softens a blow; it does not erase it. Against your party, a landed blow takes max(3, incoming damage − armor × 0.35). Immunity prevents the hit entirely. Your armor is ' +
            number(game.armor()) +
            '; equipment and reforges are already included. Companions use their own armor, with inherited bonuses only when trained.',
        ],
        [
          'Why a great volley loses force',
          (() => {
            const cfg = R.tacticalFoundation.burstCompression;
            return (
              'A formidable foe can weather a sudden barrage. Across ' +
              cfg.windowSeconds +
              ' seconds, all your company’s hits share one account for that target. Below its knee, damage is unchanged; above it, the account follows knee + tail × ln(1 + (raw − knee) / tail). Each hit receives only the rise in that account. An exposed opening multiplies the knee and tail by ' +
              cfg.openingMultiplier +
              '.\n\n' +
              Object.entries(cfg.tiers)
                .map(
                  ([tier, p]) =>
                    tier +
                    ': knee ' +
                    percent(p.knee) +
                    '% of maximum HP; tail ' +
                    percent(p.tail) +
                    '%.',
                )
                .join('\n')
            );
          })(),
        ],
        [
          'Choosing a foe',
          'A chosen target remains your choice, even when too far away. Move into reach and clear sight rather than expecting your spell to switch enemies. A held lock lasts through the encounter; death, retreat home or changing areas releases it. Dust can hide a foe from direct aim, while a well-placed area attack can still reach it.',
        ],
        [
          'Openings and stubborn defenders',
          'The Ash Sentinel takes 65% of ordinary damage while its armor is closed. The Stone Colossus takes 125% while its core is exposed. Some captains gain protection from their surviving followers. These defenses apply before the shared burst account. Watch the warning, leave its path, then answer during the opening.',
        ],
        [
          'Enemies under pressure',
          'A wounded or outnumbered enemy may retreat, break formation or attempt its own escape. Low health alone does not mean surrender. Keep your company together; a threatened commander may replenish nearby guards, and a scattered companion cannot help you at once.',
        ],
      ],
    });
    shelves.push({
      title: 'Experience and discipline',
      intro: 'What battles teach, and what training passes on.',
      topics: [
        [
          'Why old enemies teach little',
          'A lesson grows thin when you have mastered the foe. Ordinary enemies yield ' +
            percent(R.progression.ordinaryXpMultiplier) +
            '% of their listed experience; then your advantage of zero, one, two, three, or four-or-more levels leaves ' +
            gap.join(' / ') +
            '%. Crowns use the same level-gap reduction, but not the ordinary-experience reduction. Both are rounded down. Your next level costs ' +
            game.xpRequired() +
            ' experience: ' +
            R.balance.growth.xpPerLevel +
            ' × your current level.',
        ],
        [
          'The next lesson',
          'Every level grants a discipline point and ' +
            R.balance.growth.hpPerLevel +
            ' maximum HP. For your ' +
            game.hero.class +
            ', each strength lesson adds ' +
            profile.power +
            ' power, each vitality lesson adds ' +
            profile.hp +
            ' HP, and each movement lesson adds ' +
            profile.speed +
            ' speed. Training limits are ' +
            R.balance.disciplines.maxRanks.join(' / ') +
            ' ranks.' +
            (mana
              ? ' Mana training improves recovery; it does not enlarge the pool.'
              : ' Each cooldown lesson shortens the wait between skills by ' +
                percent(R.cooldownBalance.reductionPerTalentRank) +
                '% of the original wait, up to ' +
                percent(
                  R.cooldownBalance.reductionPerTalentRank * R.balance.disciplines.maxRanks[1],
                ) +
                '%.'),
        ],
        [
          'Quests without errands',
          'Explore, interact and free the captives; the rewards find you without a return to the board. Each regional quest pays once. Experience arrives immediately, and quest crowns go straight to your purse. Enemy crowns must still be collected from the ground. A regional survey needs any three of its marked places, never a memorized route.',
        ],
      ],
    });
    shelves.push({
      title: 'Your skills',
      intro: 'The powers you carry, measured for your present training.',
      topics: D.skills.map(([slot, title]) => {
        const rank = game.hero.skills[slot - 1] || 1,
          cooldown = (charged) =>
            game.skillCooldown
              ? game.skillCooldown(slot, charged)
              : R.balance.skills.cooldowns[slot],
          shape = R.chargedSkills.second[game.hero.class],
          effects = {
            1:
              'Three normal strikes on one foe build a finishing splash; changing foes or waiting ' +
              R.basicAttackCombo.resetSeconds +
              ' seconds breaks the sequence. A charged strike uses ' +
              R.chargedSkills.basicDamageMultiplier +
              ' times its ordinary power before defenses.',
            2:
              'The charged version spreads through a ' +
              shape.shape +
              '. ' +
              (shape.range
                ? 'Its reach is ' + shape.range + ' paces.'
                : 'Its radius is ' + shape.radius + ' paces.') +
              (shape.slow ? ' Frost also slows a struck foe for ' + shape.slow + ' seconds.' : ''),
            3: 'Tap to heal yourself; charge to heal wounded living companions too. Neither restores the fallen. Each receives at most its missing health.',
            4:
              game.hero.class === 'ranger'
                ? 'A burst of speed helps you leave danger.'
                : 'Brief protection lets you weather a dangerous moment.',
            5: 'Strike nearby foes with an area attack. The Mage’s frost can slow its victims.',
            6: 'A frequent focused attack; choose a reachable foe in clear sight.',
            7:
              game.hero.class === 'ranger'
                ? 'A powerful shot follows your chosen foe.'
                : 'An advanced attack reaches nearby enemies; frost and holy power behave differently.',
            8: 'The final lesson strikes nearby foes, restores some of your health and briefly protects you.',
          };
        return [
          'Skill ' + slot + ' · ' + title,
          'For your ' +
            game.hero.class +
            ', Rank ' +
            rank +
            (game.hero.skills[slot - 1] ? '' : ' (not learned)') +
            ': recovery ' +
            number(cooldown(false)) +
            ' seconds' +
            (mana ? '; cost ' + game.skillManaCost(slot, rank, false) + ' MP' : '; no mana cost') +
            '.\n\n' +
            effects[slot] +
            (slot <= 3
              ? '\n\nCharged recovery: ' +
                number(cooldown(true)) +
                ' seconds' +
                (mana
                  ? '; cost ' +
                    game.skillManaCost(slot, rank, true) +
                    ' MP, rounded up from your current reserves’ maximum'
                  : '; no mana cost') +
                '.'
              : ''),
        ];
      }),
    });
    shelves.push({
      title: 'Companions and field bases',
      intro: 'A company needs more than a strong captain.',
      topics: [
        [
          'Room in the company',
          'Expedition ranks allow ' +
            R.balance.companions.activeCaps.slice(1).join(' / ') +
            ' active companions. You presently have room for ' +
            game.expeditionPartyCap() +
            '. Instructors expand that capacity without charging for the Expedition lesson. A Barracks gives the company somewhere to recover.',
        ],
        [
          'Shared lessons and equipment',
          Object.entries(R.expeditionSupportSkills)
            .map(
              ([id, def]) =>
                def.name +
                ': Rank ' +
                game.expeditionSupportRank(id) +
                '/' +
                def.maxRank +
                ' passes on ' +
                percent(game.expeditionSupportRank(id) / def.maxRank) +
                '% of its applicable bonuses. ' +
                def.detail,
            )
            .join('\n\n') +
            '\n\nThe two lessons share different sources; they do not copy your whole character twice. Companion Vitality adds ' +
            percent(R.balance.companions.vitalityPerRank) +
            '% of base companion HP per rank.',
        ],
        [
          'A Ranger’s care',
          'A Ranger begins automatic care at ' +
            percent(support.healThreshold) +
            '% HP or less. Heal Rank ' +
            game.rangerSupportRank('health') +
            ' restores ' +
            support.healAmounts[game.rangerSupportRank('health') - 1] +
            ' HP over ' +
            support.duration +
            ' seconds to one living target, with the hero first in need. Its recovery is ' +
            support.cooldown +
            ' seconds per Ranger.' +
            (mana
              ? '\n\nMana Recovery begins at ' +
                percent(support.manaThreshold) +
                '% MP or less and restores ' +
                support.manaAmounts[game.rangerSupportRank('mana') - 1] +
                ' MP to the hero over ' +
                support.duration +
                ' seconds.'
              : '') +
            '\n\nRecall draws companions back; Barracks recovery is what returns the fallen.',
        ],
        [
          'Preparation before danger',
          'Neri sells a stored tonic for ' +
            game.preparationTonicCost() +
            ' crowns. Use it at a completed Basic or Full Barracks; if your shelf is empty, you may buy and use one there. It adds 10% maximum HP until rest or defeat, and another bottle cannot stack the blessing. Your stock: ' +
            game.preparationTonicStock() +
            '.',
        ],
      ],
    });
    shelves.push({
      title: 'Adversaries and their attacks',
      intro: 'Boss records, field observations and TRUE returns.',
      topics: [
        [
          'The TRUE adversaries',
          'Field tyrants can return as TRUE after two qualifying defeats; the Dark Lord after one. A dungeon guardian has a one-in-three early chance, rolled once after its normal defeat. Later, the Awakening calls those still undefeated in their late TRUE form. A return can bring a warband, not merely a larger adversary.',
        ],
        ...D.bosses.map((boss) => {
          const observed = allEnemies.filter((e) => e.type === 'boss' && e.family === boss.id),
            plans = R.attacks[boss.id] || [];
          return [
            boss.name,
            boss.place +
              ' · normal daylight record: Level ' +
              boss.level +
              ', ' +
              boss.hp +
              ' HP, base blow ' +
              boss.damage +
              '.\n\n' +
              plans
                .map(
                  (a, i) =>
                    (boss.attacks[i]?.split(':')[0] || 'Attack ' + (i + 1)) +
                    ': ' +
                    a.kind +
                    ', base warning ' +
                    a.warning +
                    's, damage ×' +
                    a.coefficient +
                    (a.species ? ', calls ' + a.species : '') +
                    (a.slow ? ', slows' : '') +
                    (a.persistent ? ', remains on the ground' : '') +
                    (a.manaDrain && !mana && R.vitalitySiphon.bossFamilies.includes(boss.id)
                      ? ', draws back ' +
                        percent(R.vitalitySiphon.healFraction) +
                        '% of HP actually taken'
                      : a.manaDrain && mana
                        ? ', drains ' +
                          percent(a.manaDrain) +
                          '% of the hero’s maximum mana on contact'
                        : '') +
                    '.',
                )
                .join('\n') +
              (!mana && R.bossRecovery[boss.id]
                ? '\n\n' +
                  R.bossRecovery[boss.id].name +
                  ': below ' +
                  percent(R.bossRecovery.threshold) +
                  '% HP, a ' +
                  R.bossRecovery[boss.id].warning +
                  '-second warning precedes recovery of ' +
                  percent(R.bossRecovery[boss.id].healFraction) +
                  '% of maximum HP, limited by missing health. Its own recovery is ' +
                  R.bossRecovery[boss.id].cooldown +
                  ' seconds; this is not life-steal.'
                : '') +
              '\n\nSummon limit: ' +
              game.bossSummonCap({ family: boss.id, form: 'normal' }) +
              ' normal / ' +
              game.bossSummonCap({ family: boss.id, form: 'true' }) +
              ' TRUE.' +
              (observed.length
                ? '\n\nYour visited encounter records: ' +
                  observed
                    .map(
                      (e) =>
                        e.form +
                        ' · Level ' +
                        e.level +
                        ', maximum HP ' +
                        number(e.maxHp) +
                        ', current blow ' +
                        number(e.damage),
                    )
                    .join('; ') +
                  '. Night and Awakening may change those figures.'
                : '\n\nYou have no visited encounter record yet; these are base values, before night or TRUE scaling.') +
              (boss.history ? '\n\n' + boss.history : ''),
          ];
        }),
        [
          'Creatures encountered',
          (() => {
            const known = allEnemies.filter((e) => e.type !== 'boss' && !e.summon),
              unique = new Map();
            for (const e of known) {
              const key =
                e.species + ':' + e.form + ':' + (e.ranged ? 'ranged' : 'melee') + ':' + !!e.guard;
              if (!unique.has(key)) unique.set(key, e);
            }
            return (
              'These are observations from places you have visited, not promises that every member of a species is alike. Guards, captains, ringleaders and ranged cousins differ.\n\n' +
              [...unique.values()]
                .map(
                  (e) =>
                    e.name +
                    ' · ' +
                    e.form +
                    (e.ranged ? ', ranged' : ', melee') +
                    (e.guard ? ', guardian' : '') +
                    ': Level ' +
                    e.level +
                    ', ' +
                    number(e.maxHp) +
                    ' maximum HP, blow ' +
                    number(e.damage) +
                    '.',
                )
                .join('\n')
            );
          })(),
        ],
      ],
    });
    shelves.push({
      title: 'Crowns, roads and the world',
      intro: 'The provinces behind the figures in the ledger.',
      topics: [
        [
          'The cost of keeping a company',
          'Recruiting at a Barracks costs ' +
            game.barracksRecruitPrice('soldier') +
            ' crowns for a Soldier and ' +
            game.barracksRecruitPrice('archer') +
            ' for a Ranger. Fallen-companion recovery costs ' +
            game.companionRecoveryCost() +
            '; treatment costs ' +
            game.companionTreatmentCost() +
            '. Your first Basic Barracks is free; later ones cost ' +
            R.balance.barracks.buildCost +
            ', and the Full upgrade costs ' +
            game.barracksUpgradeCost() +
            '.',
        ],
        [
          'Steel from the smith',
          'Each purchased tier replaces the earlier one; its bonus does not stack with every old purchase. A new weapon equips automatically only if stronger than your owned alternatives. Armor equips immediately. Reforging adds ' +
            R.balance.equipment.reforgeBonus.weapon +
            ' weapon power or ' +
            R.balance.equipment.reforgeBonus.armor +
            ' armor, once at that tier. Shared Strength can pass applicable gear bonuses to companions.',
        ],
        ...D.regions.map((region) => [
          region.name,
          (game.s.keeperEvidence
            ? region.exploration
            : region.exploration.replace(
                'and councillor who proposed capturing the specialists',
                'and councillor',
              )) +
            '\n\nRegional quests together offer ' +
            region.questxp +
            ' experience and ' +
            region.questgold +
            ' crowns, once. Ordinary outdoor base crown drops range from ' +
            region.gold_range.join(' to ') +
            '; listed experience is ' +
            region.enemy_xp +
            ', before ordinary and level-gap reductions.',
        ]),
      ],
    });
    if (game.s.keeperEvidence)
      shelves.push({
        title: 'The orders among the shelves',
        intro: 'An entry he cannot pretend was written by someone else.',
        topics: [
          [
            'A prisoner for the Archive',
            '“Yes. I proposed taking the specialists. When the lower shelves flooded, I traded another captive for Neri’s skill. You have read my seal; I will not ask you to misread it. Keep these records dry, and I will put what I know to better use.”',
          ],
        ],
      });
    return shelves;
  }
  const api = { sections };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeArchive = api;
})(typeof window !== 'undefined' ? window : globalThis);
