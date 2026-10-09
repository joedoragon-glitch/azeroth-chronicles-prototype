/* Specialist, expedition, inventory and training menu catalog. Shell services are injected. */
(function (root) {
  'use strict';
  function create({
    getGame,
    Campaign,
    D,
    action,
    openMenu,
    closeMenu,
    recallSquad,
    showMap,
    finaleMenu,
  }) {
    function expeditionSupportActions(n, refresh) {
      return Object.entries(Campaign.rules.expeditionSupportSkills).flatMap(([id, def]) => {
        const cap = def.trainers?.[n.family] || 0;
        if (!cap) return [];
        const rank = getGame().expeditionSupportRank(id),
          next = rank + 1;
        if (rank >= def.maxRank)
          return [
            action(
              def.name + ' · Rank ' + def.maxRank,
              () => {},
              '100% inheritance · maximum rank',
              true,
            ),
          ];
        if (rank >= cap) {
          const nextTrainer = Object.entries(def.trainers)
            .sort((a, b) => a[1] - b[1])
            .find(([, limit]) => limit > rank)?.[0];
          return [
            action(
              def.name + ' · Rank ' + rank,
              () => {},
              'This specialist trains through Rank ' +
                cap +
                (nextTrainer ? ' · Next: ' + getGame().boss(nextTrainer).captive : ''),
              true,
            ),
          ];
        }
        const cost = getGame().expeditionSupportCost(id),
          pct = Math.round((next / def.maxRank) * 100);
        return [
          action(
            (rank ? 'Train ' : 'Learn ') + def.name + ' · Rank ' + next + ' · ' + cost + ' crowns',
            () => {
              getGame().trainExpeditionSupport(id, n.family);
              refresh();
            },
            pct + '% inheritance · ' + def.detail,
            getGame().hero.gold < cost,
          ),
        ];
      });
    }
    function teacher(n, back = closeMenu) {
      const catalog = getGame().teacherCatalog(n.family),
        cap = catalog.maxRank,
        next = Object.keys(Campaign.rules.teachers).find(
          (id) => Campaign.rules.teachers[id].maxRank > cap,
        ),
        expCap = getGame().expeditionInstructorCap(n.family),
        expRank = getGame().s.expeditionRank || 1,
        expNext = expRank + 1,
        expActions = expCap
          ? [
              expRank < expCap
                ? action(
                    'Train Expedition Skill · Rank ' + expRank + ' → ' + expNext + ' · FREE',
                    () => {
                      getGame().trainExpedition(n.family);
                      teacher(n, back);
                    },
                    getGame().expeditionUnlock(expNext),
                  )
                : action(
                    'Expedition Skill · Rank ' + expRank,
                    () => {},
                    expRank >= 6
                      ? 'Maximum Expedition rank'
                      : 'This instructor trains Expedition through rank ' + expCap,
                    true,
                  ),
            ]
          : [],
        supportActions = expeditionSupportActions(n, () => teacher(n, back));
      openMenu(
        n.name,
        (next
          ? 'Higher hero-skill ranks: rescue ' +
            getGame().boss(next).captive +
            ' in ' +
            D.regions.find((r) => r.id === getGame().boss(next).region).name +
            '. '
          : 'Maximum hero-skill training rank available here. ') +
          'Expedition Rank training is free. Hero skills and specialist companion-training skills use crowns.',
        [
          ...expActions,
          ...supportActions,
          ...D.skills
            .filter((s) =>
              getGame().hero.skills[s[0] - 1]
                ? catalog.train.includes(s[0])
                : catalog.learn.includes(s[0]),
            )
            .map((s) => {
              const rank = getGame().hero.skills[s[0] - 1],
                cost = getGame().skillTrainingCost(s[0], rank);
              return action(
                (rank ? 'Train ' : 'Learn ') + s[1] + ' · ' + cost + ' crowns',
                () => {
                  rank ? getGame().upgrade(s[0], n.family) : getGame().learn(s[0], n.family);
                  teacher(n, back);
                },
                'Skill ' + s[0] + ' · Rank ' + rank + ' · Specialist cap ' + cap,
                rank >= cap || getGame().hero.gold < cost,
              );
            }),
        ],
        back,
      );
    }
    function skillBook(back = closeMenu) {
      const rank = getGame().s.expeditionRank || 1,
        next = getGame().expeditionNextInstructor(rank),
        expDetail =
          rank >= 6
            ? 'Maximum rank'
            : next
              ? 'Next: ' +
                getGame().boss(next).captive +
                ' · ' +
                getGame().expeditionUnlock(rank + 1)
              : '',
        support = Object.entries(Campaign.rules.expeditionSupportSkills)
          .filter(([, def]) =>
            Object.keys(def.trainers || {}).some((family) => getGame().s.rescued[family]),
          )
          .map(([id, def]) => {
            const r = getGame().expeditionSupportRank(id),
              cost = r < def.maxRank ? getGame().expeditionSupportCost(id) : 0,
              best = getGame().expeditionSupportBestTrainer(id),
              nextProvider =
                best ||
                Object.entries(def.trainers)
                  .sort((a, b) => a[1] - b[1])
                  .find(([, cap]) => cap > r)?.[0],
              provider = nextProvider ? getGame().boss(nextProvider).captive : '';
            const pct = Math.round((r / def.maxRank) * 100);
            return action(
              r ? def.name + ' · Rank ' + r : def.name + ' · Not learned',
              () => {},
              r >= def.maxRank
                ? '100% inheritance · maximum'
                : r
                  ? pct +
                    '% inheritance · next ' +
                    cost +
                    ' crowns' +
                    (provider ? ' · ' + provider : '')
                  : 'Learn Rank 1 · ' + cost + ' crowns' + (provider ? ' · ' + provider : ''),
              true,
            );
          }),
        companionAdvanced = (getGame().s.companionCombatTraining || 1) >= 2,
        companionLine = action(
          'Companion combat skills · ' + (companionAdvanced ? 'Advanced' : 'Core'),
          () => {},
          companionAdvanced
            ? 'Soldier: Power Strike (8s) + Holy Cleave (12s) · Archer: Triple Shot (8s) + Piercing Volley (12s)'
            : 'Soldier: Power Strike · Archer: Triple Shot · Learn hero Skill 2 Rank 1 to unlock Holy Cleave and Piercing Volley',
          true,
        );
      openMenu(
        'Skills and teachers',
        'Expedition Rank training is free. Hero skills and specialist companion-training skills use crowns; none require hero levels.',
        [
          action('Expedition Skill · Rank ' + rank, () => {}, expDetail, true),
          ...support,
          companionLine,
          ...D.skills
            .filter((s) => getGame().skillRevealed(s[0]))
            .map((s) =>
              action(
                'Skill ' + s[0] + ' ' + s[1] + ' · Rank ' + getGame().hero.skills[s[0] - 1],
                () => {},
                s[0] === 1
                  ? 'Always available · same-target combo: 100% → 110% → 120% + frontal AoE · resets on target switch or 4s gap'
                  : s[0] === 2
                    ? getGame().skillTrainingCost(s[0], 0) +
                      ' crowns · ' +
                      getGame().boss(s[4]).captive +
                      ' · ' +
                      D.regions.find((r) => r.id === getGame().boss(s[4]).region).name +
                      ' · Rank 1 also teaches companion Holy Cleave and Piercing Volley'
                    : getGame().skillTrainingCost(s[0], 0) +
                      ' crowns · ' +
                      getGame().boss(s[4]).captive +
                      ' · ' +
                      D.regions.find((r) => r.id === getGame().boss(s[4]).region).name,
                true,
              ),
            ),
        ],
        back,
      );
    }
    function supplier(n, back = closeMenu) {
      const advanced = n.kind === 'alchemist',
        vitalityRank = getGame().companionVitalityRank(),
        vitalityCost = getGame().companionVitalityCost(),
        respecCost = getGame().talentRespecCost(),
        spentTalents = (getGame().hero.talents || []).reduce((sum, v) => sum + v, 0),
        healRank = getGame().rangerSupportRank('health'),
        manaRank = getGame().rangerSupportRank('mana'),
        healCost = getGame().rangerSupportCost('health'),
        manaCost = getGame().rangerSupportCost('mana');
      if (!advanced) {
        openMenu(
          n.name,
          'Combat potions have been retired. Rangers now provide field Heal and Mana Recovery, so the supply shop no longer requires you to maintain potion stock.',
          [
            action(
              'Ranger field support',
              () => {},
              'Heal triggers automatically at 50% HP or less · Mana Recovery at 35% MP or less · H/M command them manually',
              true,
            ),
          ],
          back,
        );
        return;
      }
      openMenu(
        n.name,
        'Neri trains Ranger field support instead of selling health or mana potions. Training is permanent for every Ranger, including Rangers you recruit later.',
        [
          action(
            healRank >= 2
              ? 'Ranger Heal · Rank 2 · MAX'
              : 'Upgrade Ranger Heal · Rank 2 · ' + healCost + ' crowns',
            () => {
              getGame().trainRangerSupport('health', n.family);
              supplier(n, back);
            },
            healRank >= 2
              ? 'Restores 150 HP over five seconds to one target · hero has priority · maximum training'
              : '60 → 150 HP over five seconds to one target · same 10s per-Ranger Heal cooldown',
            healRank >= 2 || getGame().hero.gold < healCost,
          ),
          action(
            manaRank >= 2
              ? 'Ranger Mana Recovery · Rank 2 · MAX'
              : 'Upgrade Ranger Mana Recovery · Rank 2 · ' + manaCost + ' crowns',
            () => {
              getGame().trainRangerSupport('mana', n.family);
              supplier(n, back);
            },
            manaRank >= 2
              ? 'Restores 100 MP over five seconds to the hero · maximum training'
              : '40 → 100 MP over five seconds · same 10s per-Ranger Mana Recovery cooldown',
            manaRank >= 2 || getGame().hero.gold < manaCost,
          ),
          action(
            'Train Companion Vitality · Rank ' +
              (vitalityRank + 1) +
              ' · ' +
              vitalityCost +
              ' crowns',
            () => {
              getGame().trainCompanionVitality(n.family);
              supplier(n, back);
            },
            '+10% companion max HP · current +' +
              vitalityRank * 10 +
              '% · repeatable without a gameplay cap',
            getGame().hero.gold < vitalityCost,
          ),
          action(
            'Reset discipline training · ' + respecCost + ' crowns',
            () => {
              getGame().resetTalents(n.family);
              supplier(n, back);
            },
            spentTalents
              ? 'Refund ' +
                  spentTalents +
                  ' spent training point' +
                  (spentTalents === 1 ? '' : 's') +
                  ' · level, skills and equipment stay unchanged'
              : 'No spent training points to refund',
            !spentTalents || getGame().hero.gold < respecCost,
          ),
        ],
        back,
      );
    }
    function smith(n, back = closeMenu) {
      const tier = Campaign.rules.balance.equipment.tiers[n.family],
        weapon = getGame().equipmentCost('weapon', tier),
        armor = getGame().equipmentCost('armor', tier),
        weaponBonus = Campaign.rules.balance.equipment.bonuses.weapon[tier],
        armorBonus = Campaign.rules.balance.equipment.bonuses.armor[tier],
        currentWeapon = getGame().hero.weapon || 0,
        currentArmor = getGame().hero.armorTier || 0,
        weaponOwned = currentWeapon >= tier,
        armorOwned = currentArmor >= tier,
        weaponReforged = !!getGame().hero.reforges['weapon:' + tier],
        armorReforged = !!getGame().hero.reforges['armor:' + tier],
        equipmentMaxed =
          weaponOwned &&
          armorOwned &&
          (currentWeapon > tier || weaponReforged) &&
          (currentArmor > tier || armorReforged),
        supportActions = expeditionSupportActions(n, () => smith(n, back)),
        equipmentStatus = equipmentMaxed
          ? 'EQUIPMENT SERVICE MAXED — you already own or have surpassed every equipment improvement this smith can offer. '
          : 'Current equipment: weapon tier ' +
            currentWeapon +
            ' · armor tier ' +
            currentArmor +
            '. ';
      openMenu(
        n.name,
        equipmentStatus +
          'Equipment replaces the earlier tier in its slot. Tier purchases are one-time; bonuses do not stack.' +
          (supportActions.length
            ? ' This specialist also teaches companion equipment inheritance.'
            : ''),
        [
          ...supportActions,
          action(
            weaponOwned
              ? 'Weapon tier ' + tier + ' · ' + (currentWeapon === tier ? 'OWNED' : 'SURPASSED')
              : 'Weapon tier ' + tier + ' · ' + weapon + ' crowns',
            () => {
              getGame().gear(n.family, 'weapon');
              smith(n, back);
            },
            'Current tier ' +
              currentWeapon +
              ' · +' +
              weaponBonus +
              ' power' +
              (weaponOwned ? ' · one-time purchase already satisfied' : ''),
            weaponOwned || getGame().hero.gold < weapon,
          ),
          action(
            armorOwned
              ? 'Armor tier ' + tier + ' · ' + (currentArmor === tier ? 'OWNED' : 'SURPASSED')
              : 'Armor tier ' + tier + ' · ' + armor + ' crowns',
            () => {
              getGame().gear(n.family, 'armor');
              smith(n, back);
            },
            'Current tier ' +
              currentArmor +
              ' · +' +
              armorBonus +
              ' armor' +
              (armorOwned ? ' · one-time purchase already satisfied' : ''),
            armorOwned || getGame().hero.gold < armor,
          ),
          action(
            currentWeapon === tier && weaponReforged
              ? 'Reforge weapon · DONE'
              : currentWeapon !== tier
                ? 'Reforge weapon · UNAVAILABLE'
                : 'Reforge weapon · ' + getGame().equipmentCost('weapon', tier, true) + ' crowns',
            () => {
              getGame().gear(n.family, 'weapon', true);
              smith(n, back);
            },
            currentWeapon < tier
              ? 'Buy weapon tier ' + tier + ' first'
              : currentWeapon > tier
                ? 'Current weapon tier ' + currentWeapon + ' has surpassed this forge'
                : weaponReforged
                  ? 'Already reforged at this tier'
                  : '+5 power once at this tier',
            currentWeapon !== tier ||
              weaponReforged ||
              getGame().hero.gold < getGame().equipmentCost('weapon', tier, true),
          ),
          action(
            currentArmor === tier && armorReforged
              ? 'Reforge armor · DONE'
              : currentArmor !== tier
                ? 'Reforge armor · UNAVAILABLE'
                : 'Reforge armor · ' + getGame().equipmentCost('armor', tier, true) + ' crowns',
            () => {
              getGame().gear(n.family, 'armor', true);
              smith(n, back);
            },
            currentArmor < tier
              ? 'Buy armor tier ' + tier + ' first'
              : currentArmor > tier
                ? 'Current armor tier ' + currentArmor + ' has surpassed this forge'
                : armorReforged
                  ? 'Already reforged at this tier'
                  : '+3 armor once at this tier',
            currentArmor !== tier ||
              armorReforged ||
              getGame().hero.gold < getGame().equipmentCost('armor', tier, true),
          ),
        ],
        back,
      );
    }
    function unitLabel(type) {
      return type === 'archer' ? 'Ranger' : 'Soldier';
    }
    function rosterLabel(u) {
      const i = getGame().s.party.indexOf(u) + 1;
      return unitLabel(u.type) + ' #' + i;
    }
    function regionalSpecialistProgress() {
      const region = getGame().definition().id,
        bosses = D.bosses.filter((b) => b.region === region && b.captive),
        missing = bosses.filter((b) => !getGame().s.rescued[b.id]),
        rescued = bosses.length - missing.length;
      const target = (b) => (b.kind === 'dungeon' ? b.place : b.name);
      const label = (b) => {
        const parts = b.captive.split(' the ');
        return parts.length > 1 ? parts[0] + ' (' + parts.slice(1).join(' the ') + ')' : b.captive;
      };
      return {
        region,
        regionName: getGame().definition().name,
        bosses,
        missing,
        rescued,
        total: bosses.length,
        target,
        label,
      };
    }
    function regionalSpecialistObjective() {
      const tutorial = getGame().s.quests['quest-barracks'];
      if (tutorial && !tutorial.paid)
        return 'FIELD BASE · Build your first Barracks — FREE · Open Menu/Esc while in the field → Establish Basic Barracks. It gives companions a nearby recovery base.';
      const p = regionalSpecialistProgress();
      if (!p.total)
        return 'Rescue specialists, rebuild your strength and continue the campaign. Map: Z.';
      if (!p.missing.length)
        return p.region === 'crown' && !getGame().s.true.darklord
          ? p.regionName +
              ' specialists ' +
              p.rescued +
              '/' +
              p.total +
              ' rescued · FINAL OBJECTIVE · Reach the Dark fortress and defeat the Dark Lord. Map: Z.'
          : p.regionName +
              ' specialists ' +
              p.rescued +
              '/' +
              p.total +
              ' rescued · Continue the campaign. Map: Z.';
      const goals = p.missing.map(
        (b) => 'Rescue ' + p.label(b) + (b.kind === 'dungeon' ? ' in ' : ' from ') + p.target(b),
      );
      return (
        p.regionName +
        ' specialists ' +
        p.rescued +
        '/' +
        p.total +
        ' · ' +
        goals.join(' · ') +
        '. Map: Z.'
      );
    }
    function regionalSpecialistBarracksDetail() {
      const p = regionalSpecialistProgress();
      if (!p.total) return 'No regional specialist objectives here.';
      if (!p.missing.length)
        return p.regionName + ': ' + p.rescued + '/' + p.total + ' regional specialists rescued.';
      return (
        p.regionName +
        ': ' +
        p.rescued +
        '/' +
        p.total +
        ' rescued · Still captive: ' +
        p.missing.map((b) => p.label(b) + ' — ' + p.target(b)).join('; ') +
        '.'
      );
    }
    function barracksSpecialistMenu(b, back) {
      const specialists = getGame().barracksSpecialists(),
        returnHere = () => barracksSpecialistMenu(b, back),
        regional = regionalSpecialistBarracksDetail();
      openMenu(
        'Rescued specialists',
        regional +
          ' Rescued specialists work from your barracks. More advanced specialists replace older redundant services.',
        specialists.length
          ? specialists.map((s) =>
              action(s.name, () => {
                const n = { ...s };
                s.kind === 'teacher'
                  ? teacher(n, returnHere)
                  : s.kind === 'smith'
                    ? smith(n, returnHere)
                    : supplier(n, returnHere);
              }),
            )
          : [action('No specialists rescued yet', () => {}, regional, true)],
        back,
      );
    }
    function barracksRecoveryMenu(b, back) {
      const wounded = getGame().s.party.some((u) => u.hp > 0 && u.hp < u.maxHp),
        fallen = getGame().s.party.some((u) => u.hp <= 0);
      openMenu(
        'Recovery',
        'Basic barracks recovery is available from Expedition Rank 1.',
        [
          action(
            'Treat wounded companions · ' + getGame().companionTreatmentCost() + ' crowns',
            () => {
              getGame().treatCompanions();
              barracksRecoveryMenu(b, back);
            },
            'Restores every living wounded companion to full health',
            !wounded ||
              getGame().hero.gold < getGame().companionTreatmentCost() ||
              getGame().refugeThreat(),
          ),
          action(
            'Recover fallen companion · ' + getGame().companionRecoveryCost() + ' crowns',
            () => {
              getGame().recover();
              barracksRecoveryMenu(b, back);
            },
            'Restores one fallen companion at full health',
            !fallen || getGame().hero.gold < getGame().companionRecoveryCost(),
          ),
        ],
        back,
      );
    }
    function barracksRecruitmentMenu(b, back) {
      const queueName = b.queue > 0 ? unitLabel(b.queueType || 'soldier') : null;
      openMenu(
        'Recruitment',
        (queueName
          ? 'Training ' + queueName + ' · ' + b.queue.toFixed(1) + 's remaining'
          : 'Recruit as many companions as you want') +
          '. New recruits join the active group if this barracks can support another slot; otherwise they rest in reserve.',
        [
          ...[
            ['soldier', 'Soldier'],
            ['archer', 'Ranger'],
          ].map(([type, label]) => {
            const price = getGame().barracksRecruitPrice(type);
            return action(
              'Recruit ' + label + ' · ' + price + ' crowns',
              () => {
                getGame().train(b.id, type);
                barracksRecruitmentMenu(b, back);
              },
              b.queue > 0 ? 'Barracks queue occupied' : 'Barracks rate',
              b.queue > 0 || getGame().hero.gold < price,
            );
          }),
        ],
        back,
      );
    }
    function barracksLaborMenu(b, back) {
      const nodes = getGame().visibleResourceNodes(),
        hidden = getGame().hiddenTributeNodes(),
        actions = nodes.map((n) =>
          action(
            'Recover Dark Lord Tribute · ' + (n.siteName || n.name),
            () => {
              getGame().gather(n.id);
              closeMenu();
            },
            Math.floor(n.amount) + ' crowns remaining · ' + (n.context || 'recovered tribute'),
          ),
        );
      if (hidden.length)
        actions.push(
          action(
            'Search for hidden Dark Lord Tribute',
            () => {
              getGame().scoutTribute();
              barracksLaborMenu(b, back);
            },
            hidden.length +
              ' undiscovered source' +
              (hidden.length === 1 ? '' : 's') +
              ' remain · scouts reveal locations, not their value',
          ),
        );
      openMenu(
        'Resources & labor',
        'Companions recover tribute intended for the Dark Lord and return its value to the resistance economy. Exact amounts are managed here; hidden sources must be located by expedition scouts.',
        actions.length
          ? actions
          : [
              action(
                'No remaining regional tribute',
                () => {},
                'All known and hidden Dark Lord Tribute in this region has been recovered.',
                true,
              ),
            ],
        back,
      );
    }
    function barracksGroupMenu(b, back) {
      const active = getGame().activeParty().length,
        cap = getGame().barracksFieldCap(b),
        threat = getGame().refugeThreat(),
        actions = getGame().s.party.map((u) =>
          u.active !== false
            ? action(
                'Rest ' + rosterLabel(u),
                () => {
                  getGame().restCompanion(u.id);
                  barracksGroupMenu(b, back);
                },
                u.hp > 0
                  ? 'With you · ' + Math.ceil(u.hp) + '/' + u.maxHp + ' HP'
                  : 'With you · FALLEN',
                threat,
              )
            : action(
                'Add ' + rosterLabel(u) + ' to group',
                () => {
                  getGame().activateCompanion(u.id, b.id);
                  barracksGroupMenu(b, back);
                },
                u.hp <= 0
                  ? 'Resting · FALLEN — recover first'
                  : 'Resting · ' + Math.ceil(u.hp) + '/' + u.maxHp + ' HP',
                u.hp <= 0 || active >= cap || threat,
              ),
        );
      openMenu(
        'Manage group',
        'With you ' +
          active +
          '/' +
          cap +
          ' · Employed ' +
          getGame().rosterCount() +
          '. ' +
          (!b.full && (getGame().s.expeditionRank || 1) >= 4
            ? 'Basic barracks support at most 3 active companions. Upgrade it to use your higher Expedition cap.'
            : ''),
        actions.length ? actions : [action('No companions employed', () => {}, '', true)],
        back,
      );
    }
    function barracksCompanyMenu(b, back) {
      const returnHere = () => barracksCompanyMenu(b, back),
        rank = getGame().s.expeditionRank || 1,
        active = getGame().activeParty().length,
        cap = getGame().barracksFieldCap(b),
        fallen = getGame().s.party.filter((u) => u.hp <= 0).length;
      openMenu(
        'Company',
        'Recruit, recover and choose who travels with you.',
        [
          action(
            'Manage active group',
            () => barracksGroupMenu(b, returnHere),
            'With you ' + active + '/' + cap + ' · employed ' + getGame().rosterCount(),
          ),
          rank >= 2
            ? action(
                'Recruit companions',
                () => barracksRecruitmentMenu(b, returnHere),
                'Soldier ' +
                  getGame().barracksRecruitPrice('soldier') +
                  ' crowns · Ranger ' +
                  getGame().barracksRecruitPrice('archer') +
                  ' crowns · extra hires rest in reserve',
              )
            : action(
                'Recruitment — Expedition 2',
                () => {},
                'Rescue Mira and train Expedition to Rank 2',
                true,
              ),
          action(
            'Recovery',
            () => barracksRecoveryMenu(b, returnHere),
            fallen
              ? fallen + ' fallen · treat wounded or recover fallen'
              : 'Treat wounded · recover fallen',
          ),
        ],
        back,
      );
    }
    function barracksOperationsMenu(b, back) {
      const returnHere = () => barracksOperationsMenu(b, back),
        rank = getGame().s.expeditionRank || 1;
      openMenu(
        'Operations',
        'Regional objectives, routes and expedition labor.',
        [
          action('Local objectives', () => quests(true, returnHere)),
          rank >= 2
            ? action(
                'Resources & labor',
                () => barracksLaborMenu(b, returnHere),
                'Assign idle active troops · full barracks is a deposit point',
              )
            : action(
                'Resources — Expedition 2',
                () => {},
                'Rescue Mira and train Expedition to Rank 2',
                true,
              ),
        ],
        back,
      );
    }
    function expeditionBarracksAction(b, back) {
      const rank = getGame().s.expeditionRank || 1;
      if (rank >= 6)
        return action('Expedition Skill · Rank 6', () => {}, 'Maximum rank · active group 6', true);
      const trainer = getGame().expeditionTrainer(),
        next = rank + 1;
      if (trainer)
        return action(
          'Train Expedition Skill · Rank ' + rank + ' → ' + next + ' · FREE',
          () => {
            getGame().trainExpedition(trainer);
            barracksMenu(b, back);
          },
          getGame().expeditionUnlock(next),
        );
      const need = getGame().expeditionNextInstructor(rank);
      return action(
        'Expedition Skill · Rank ' + rank,
        () => {},
        need
          ? 'Next: rescue ' +
              getGame().boss(need).captive +
              ' → Rank ' +
              next +
              ' · ' +
              getGame().expeditionUnlock(next)
          : '',
        true,
      );
    }
    function barracksMenu(ref, back = closeMenu) {
      const b = getGame()
        .zone()
        .buildings.find((x) => x.id === ref.id);
      if (!b) {
        getGame().say('That barracks is no longer available.');
        return;
      }
      if (b.progress < 4) {
        const assigned = getGame()
            .activeLivingParty()
            .some((u) => u.order?.type === 'build' && u.order.id === b.id),
          canAssign = !assigned && getGame().availableLabor().length > 0;
        openMenu(
          'Barracks under construction',
          'The hero keeps watch while one companion builds. Progress ' +
            Math.floor(b.progress) +
            '/4. Recall cancels labor without losing progress.',
          assigned
            ? [action('Construction in progress', () => {}, 'One companion is building.', true)]
            : canAssign
              ? [
                  action(
                    'Assign companion to construction',
                    () => {
                      if (getGame().assignBuilder(b.id)) closeMenu();
                    },
                    'Uses one idle active Soldier or Ranger',
                  ),
                ]
              : [
                  action(
                    'No idle companion available',
                    () => {},
                    'Recall or finish another labor assignment first.',
                    true,
                  ),
                ],
          back,
        );
        return;
      }
      const rank = getGame().s.expeditionRank || 1,
        returnHere = () => barracksMenu(b, back),
        specialists = getGame().barracksSpecialists(),
        exp = expeditionBarracksAction(b, back),
        baseActions = [
          exp,
          action(
            'Company',
            () => barracksCompanyMenu(b, returnHere),
            'Recruit · active group · recovery',
          ),
          action(
            'Rescued specialists',
            () => barracksSpecialistMenu(b, returnHere),
            (specialists.length ? specialists.length + ' available here · ' : '') +
              regionalSpecialistBarracksDetail(),
          ),
          action(
            'Operations',
            () => barracksOperationsMenu(b, returnHere),
            'Local objectives · resources and labor',
          ),
        ];
      if (!b.full) {
        const upgrading = getGame()
            .activeLivingParty()
            .some((u) => u.order?.type === 'upgrade' && u.order.id === b.id),
          canUpgrade = rank >= 4;
        if (canUpgrade)
          baseActions.push(
            upgrading
              ? action(
                  'Full Barracks upgrade in progress',
                  () => {},
                  'Progress ' + Math.floor(b.upgradeProgress || 0) + '/4',
                  true,
                )
              : action(
                  b.upgradePaid
                    ? 'Resume Full Barracks upgrade'
                    : 'Upgrade to Full Barracks · ' + getGame().barracksUpgradeCost() + ' crowns',
                  () => {
                    getGame().upgradeBarracks(b.id);
                    barracksMenu(b, back);
                  },
                  'Optional upgrade · required only for active groups above 3 · becomes a resource deposit · unlocks full operations',
                  !getGame().availableLabor().length ||
                    (!b.upgradePaid && getGame().hero.gold < getGame().barracksUpgradeCost()),
                ),
          );
        else
          baseActions.push(
            action(
              'Full Barracks — Expedition 4',
              () => {},
              'Supports active groups above 3 · resource deposit · full operations',
              true,
            ),
          );
        openMenu(
          'Basic Barracks',
          getGame().definition().name + ' · cheap recovery and expedition base.',
          baseActions,
          back,
        );
        return;
      }
      openMenu(
        'Full Barracks',
        getGame().definition().name +
          ' field base · ' +
          getGame().activeParty().length +
          '/' +
          getGame().barracksFieldCap(b) +
          ' with you · ' +
          getGame().rosterCount() +
          ' employed.',
        [
          exp,
          action(
            'Company',
            () => barracksCompanyMenu(b, returnHere),
            'Recruit · active group · recovery',
          ),
          action(
            'Rescued specialists',
            () => barracksSpecialistMenu(b, returnHere),
            (specialists.length ? specialists.length + ' available here · ' : '') +
              regionalSpecialistBarracksDetail(),
          ),
          action(
            'Operations',
            () => barracksOperationsMenu(b, returnHere),
            'Map · objectives · resources',
          ),
        ],
        back,
      );
    }
    function inventory(back = closeMenu) {
      const rangers = getGame()
          .activeLivingParty()
          .filter((u) => u.type === 'archer'),
        heal = getGame().rangerSupportAmount('health'),
        mana = getGame().rangerSupportAmount('mana');
      openMenu(
        'Inventory',
        'Crowns ' +
          Math.floor(getGame().hero.gold) +
          ' · Weapon tier ' +
          getGame().hero.weapon +
          ' · Armor tier ' +
          getGame().hero.armorTier +
          '\nCrowns are the official currency of the Dark Lord’s regime.',
        [
          action('Recall squad', () => {
            recallSquad();
            closeMenu();
          }),
          action(
            'Ranger Heal · ' + heal + ' HP',
            () => {},
            rangers.length
              ? rangers.length +
                  ' active Ranger' +
                  (rangers.length === 1 ? '' : 's') +
                  ' · combat: auto at ≤50% HP · out of combat: tops off injured allies · hero priority · command with H'
              : 'No active Ranger · recruit or activate one for field healing',
            true,
          ),
          action(
            'Ranger Mana Recovery · ' + mana + ' MP',
            () => {},
            rangers.length
              ? rangers.length +
                  ' active Ranger' +
                  (rangers.length === 1 ? '' : 's') +
                  ' · automatic at hero ≤35% MP · command with M'
              : 'No active Ranger · recruit or activate one for field mana recovery',
            true,
          ),
          ...Object.keys(Campaign.legacyWeapons)
            .filter((name) => getGame().s.legacyInventory?.includes(name))
            .map((name) =>
              action(
                'Equip ' + name,
                () => {
                  getGame().equipLegacy(name);
                  inventory(back);
                },
                'Saved weapon · +' + Campaign.legacyWeapons[name] + ' power',
              ),
            ),
          ...(getGame().hero.weapon
            ? [
                action('Equip current weapon tier ' + getGame().hero.weapon, () => {
                  getGame().hero.legacyEquipped = false;
                  inventory(back);
                }),
              ]
            : []),
        ],
        back,
      );
    }
    function townRecruitmentMenu(back) {
      const rank = getGame().s.expeditionRank || 1,
        atLimit = getGame().rosterCount() >= 3,
        actions = [];
      if (rank < 2)
        actions.push(
          action(
            'Recruitment — Expedition 2 required',
            () => {},
            'Rescue Mira and train Expedition to Rank 2',
            true,
          ),
        );
      else if (atLimit)
        actions.push(
          action(
            'Town recruitment limit reached',
            () => {},
            'Further recruiting requires a barracks.',
            true,
          ),
        );
      else
        actions.push(
          ...[
            ['soldier', 'Soldier', getGame().recruitPrice('soldier')],
            ['archer', 'Ranger', getGame().recruitPrice('archer')],
          ].map(([type, label, price]) =>
            action(
              'Recruit ' + label + ' · ' + price + ' crowns',
              () => {
                getGame().recruit(type);
                townRecruitmentMenu(back);
              },
              'Town can employ only the first 3 companions',
              getGame().hero.gold < price,
            ),
          ),
        );
      actions.push(
        action(
          'Recover fallen companion · ' + getGame().companionRecoveryCost() + ' crowns',
          () => {
            getGame().recover();
            townRecruitmentMenu(back);
          },
          '',
          !getGame().s.party.some((u) => u.hp <= 0) ||
            getGame().hero.gold < getGame().companionRecoveryCost(),
        ),
      );
      openMenu(
        'Town recruitment',
        'Town recruitment stops at 3 total employed companions, including resting or fallen ones. Build a barracks for further hiring.',
        actions,
        back,
      );
    }
    function townLaborMenu(back) {
      const rank = getGame().s.expeditionRank || 1,
        nodes = getGame()
          .zone()
          .nodes.filter((n) => n.amount > 0),
        canBuild = !getGame().isDungeon() && getGame().availableLabor().length > 0,
        cost = getGame().barracksBuildCost(),
        costLabel = cost ? cost + ' crowns' : 'FREE',
        actions = [];
      if (canBuild)
        actions.push(
          action(
            'Establish Basic Barracks · ' + costLabel,
            () => {
              getGame().build();
              townLaborMenu(back);
            },
            cost === 0
              ? 'First barracks is free · establishes nearby companion recovery'
              : rank >= 4
                ? 'Basic camp · optional Full upgrade ' +
                  getGame().barracksUpgradeCost() +
                  ' crowns'
                : 'Basic recovery base; Full upgrade unlocks at Expedition 4',
            getGame().hero.gold < cost,
          ),
        );
      if (rank >= 2)
        actions.push(
          ...nodes.map((n) =>
            action(
              'Gather ' + n.name + ' ' + n.icon,
              () => {
                getGame().gather(n.id);
                closeMenu();
              },
              Math.floor(n.amount) + ' crowns remaining · assigns all idle active troops',
            ),
          ),
        );
      else
        actions.push(
          action(
            'Resources — Expedition 2 required',
            () => {},
            'Rescue Mira and train Expedition to Rank 2',
            true,
          ),
        );
      openMenu(
        'Construction & resources',
        'The hero does not build. One active companion provides construction labor.',
        actions,
        back,
      );
    }
    function partyMenu(back = closeMenu) {
      const title = getGame().definition().town + ' Captain',
        returnHere = () => partyMenu(back);
      openMenu(
        title,
        'Town services cover the starter expedition. For a larger roster: build a barracks.',
        [
          action(
            'Recruitment & recovery',
            () => townRecruitmentMenu(returnHere),
            getGame().rosterCount() >= 3
              ? '3+ employed · further recruiting requires a barracks'
              : 'Town hiring limit: 3 total companions',
          ),
          action(
            'Construction & resources',
            () => townLaborMenu(returnHere),
            getGame().barracksBuildCost() === 0
              ? 'First barracks FREE · companion recovery base'
              : 'Basic barracks ' +
                  getGame().barracksBuildCost() +
                  ' crowns · Full upgrade optional at Expedition 4',
          ),
        ],
        back,
      );
    }
    function formatTrainingNumber(n) {
      return Number(n.toFixed(2)).toString();
    }
    function disciplineEffect(i) {
      const p = getGame().talentProfile();
      if (i === 0) return 'Each rank: +' + p.power + ' Power';
      if (i === 1)
        return (
          'Each rank: +' +
          formatTrainingNumber(p.mana * 0.125) +
          ' MP/s in combat · +' +
          formatTrainingNumber(p.mana * 0.25) +
          ' MP/s out of combat'
        );
      if (i === 2) return 'Each rank: +' + p.hp + ' maximum HP';
      return 'Each rank: +' + p.speed + ' movement speed';
    }
    function freeTalentResetMenu(back = closeMenu) {
      const left = getGame().hero.freeTalentResets || 0;
      openMenu(
        'Free training reset',
        'Refund every spent training point. This uses one of this hero’s two free resets.',
        [
          action(
            'Confirm reset · ' + left + ' free left',
            () => {
              if (getGame().freeResetTalents()) talents(back);
            },
            'All spent training points are refunded.',
          ),
        ],
        () => talents(back),
      );
    }
    function talents(back = closeMenu) {
      const names = ['Power Training', 'Mana Training', 'Health Training', 'Movement Training'],
        spent = getGame().talentSpent(),
        left = getGame().hero.freeTalentResets || 0,
        actions = names.map((name, i) =>
          action(
            name + ' · Rank ' + getGame().hero.talents[i] + '/' + getGame().talentMaxRank(i),
            () => {
              getGame().talent(i);
              talents(back);
            },
            disciplineEffect(i),
          ),
        );
      actions.push(
        action(
          'Reset discipline training · FREE · ' + left + ' left',
          () => freeTalentResetMenu(back),
          spent
            ? 'Refund all spent training points.'
            : left
              ? 'Spend at least one point before resetting.'
              : 'Free resets exhausted.',
          !spent || !left,
        ),
      );
      openMenu(
        'Discipline Training',
        'Available training points ' +
          getGame().hero.talentPoints +
          ' · One point raises one discipline by one rank.',
        actions,
        back,
      );
    }
    function quests(atBoard, back = closeMenu) {
      const local = atBoard
        ? getGame()
            .questDefs()
            .filter((q) => q.region === getGame().definition().id)
        : getGame().questDefs();
      openMenu(
        atBoard ? 'Local quests' : 'Quest journal',
        atBoard
          ? 'All local quests are already ACTIVE. Rewards are automatically delivered as soon as their objectives are completed.'
          : 'All quests begin active automatically. Rewards are delivered immediately on completion; no return trip is required.',
        local.map((q) => {
          const p = getGame().s.quests[q.id],
            reward = q.tutorial ? 'Tutorial' : q.gold + ' crowns / ' + q.xp + ' XP';
          return action(
            q.name +
              ' · ' +
              (p?.paid ? 'Complete' : p?.closedByPeace ? 'Resolved by peace' : 'ACTIVE'),
            () => {},
            q.objective + ' · ' + reward + ' · ' + getGame().questProgress(q),
          );
        }),
        back,
      );
    }
    return {
      teacher,
      skillBook,
      supplier,
      smith,
      regionalSpecialistObjective,
      barracksMenu,
      inventory,
      partyMenu,
      talents,
      quests,
    };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeMenus = api;
})(typeof window !== 'undefined' ? window : globalThis);
