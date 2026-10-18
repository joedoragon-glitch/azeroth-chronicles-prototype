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
    storyNavigate = () => {},
    chooseNewRun = () => {},
    status = () => {},
    requestName = () => {},
    openCharacter = null,
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
          action(
            'Open skill journal',
            () => skillBook(() => teacher(n, back)),
            'Short tap and charged effects · cooldowns',
          ),
          ...D.skills
            .filter((s) =>
              getGame().hero.skills[s[0] - 1]
                ? catalog.train.includes(s[0])
                : catalog.learn.includes(s[0]),
            )
            .map((s) => {
              const rank = getGame().hero.skills[s[0] - 1],
                cost = getGame().skillTrainingCost(s[0], rank);
              const card = professionSkillCard(s[0]);
              return action(
                (rank ? 'Train ' : 'Learn ') + card.name + ' · ' + cost + ' crowns',
                () => {
                  rank ? getGame().upgrade(s[0], n.family) : getGame().learn(s[0], n.family);
                  teacher(n, back);
                },
                'Skill ' + s[0] + ' · ' + card.role + ' · Rank ' + rank + '/' + cap,
                rank >= cap || getGame().hero.gold < cost,
              );
            }),
        ],
        back,
      );
    }
    // One short, class-specific reference shared by the skill list and trainers.
    // Rules/Campaign remain authoritative for ranks, cooldowns and availability.
    // The Keeper's Archive is optional deeper reading, not required for basics.
    const skillCards = {
      paladin: [
        [
          'Sword Combo',
          'Basic attack / holy burst',
          'Sword combo; third hit cleaves',
          'Holy projectile: 3× basic damage',
        ],
        [
          'Sundering Strike',
          'Weaken / frontal cleave',
          'Hit one foe; weaken its damage',
          'Holy Cleave: weaken a frontal group',
        ],
        [
          'Shield Stance',
          'Defense / shield knockback',
          'Raise shield: 65–73% protection for 8s',
          'Shield Bash: strike and push a cone',
          'No Skill 1 while raised; other damage ×0.6. Tap to lower; cooldown starts on lowering.',
        ],
        [
          'Judgment',
          'Taunt / group taunt',
          'Strike and draw one foe’s attention',
          'Grand Judgment: splash + group taunt',
          'Boss taunt affects basic attacks briefly; scripted specials remain.',
        ],
        [
          'Holy Area',
          'Area hit / weakening wave',
          'Holy damage to up to 6 foes',
          'Consecrated Wave: up to 8 + weaken',
        ],
        [
          'Vanguard Rush',
          'Approach / impact push',
          'Rush to a foe and strike',
          'Vanguard Impact: rush + short push wave',
        ],
        [
          'Holy Assault',
          'Area hit / stronger weaken',
          'Holy damage to up to 6 foes',
          'Oath Strike: up to 8 + weaken',
        ],
        [
          'Sanctuary Oath',
          'Party ward / Last Bastion',
          'Holy area + 15% heal + 20% party ward',
          'Last Bastion: bigger area + 20% heal + 30% ward + weaken',
          'No immunity. Ward and Shield Stance use only the stronger reduction.',
        ],
      ],
      mage: [
        [
          'Arcane Combo',
          'Magic combo / beam',
          'Magic combo; third hit splashes',
          'Arcane Beam: 3× basic damage',
        ],
        [
          'Frost Bolt',
          'Single slow / frost burst',
          'Frost hit; slow one foe for 2–2.2s',
          'Frost Burst: area slow for 3.2–4.2s',
        ],
        [
          'Spell Interrupt',
          'Interrupt / bilateral silence',
          'Stop one warned or aimed attack',
          'Silence Field: block nearby special skills',
          'Silence affects you and companions too; basic attacks still work.',
        ],
        [
          'Arcane Fracture',
          'Vulnerability / group rupture',
          'Hit + 15–19% incoming damage to foe',
          'Arcane Rupture: area hit + 20–24% vulnerability',
          'Fracture never stacks; the stronger effect applies.',
        ],
        [
          'Force Pulse',
          'Push / wider force wave',
          'Force area damage + knockback, up to 6',
          'Force Wave: wider push, up to 8',
        ],
        [
          'Magic Shot',
          'Slowing shot / focused beam',
          'Magic projectile + brief slow',
          'Focused Beam: stronger shot + slow',
        ],
        [
          'Arcane Chain',
          'Chain / wider chainstorm',
          'Chain damage across up to 3 foes',
          'Chainstorm: stronger chain, up to 5',
        ],
        [
          'Astral Detonation',
          'Area burst / brief fracture',
          'Blast up to 5 foes; primary hit strongest',
          'Arcane Cataclysm: up to 7 + 25–29% vulnerability for 2.5s',
          'No healing or immunity. Fracture is nonstacking.',
        ],
      ],
      ranger: [
        [
          'Bow Combo',
          'Arrow combo / rapid triple',
          'Arrow combo; third hit fans out',
          'Rapid Triple Shot: 3× basic total',
        ],
        [
          'Pinning Shot',
          'Two slowing arrows / line',
          'Two arrows slow one foe',
          'Pinning Volley: line hit + slow',
        ],
        [
          'Self-Heal',
          'Personal / party healing',
          'Heal yourself',
          'Party Heal: you + wounded living allies',
          'Cannot revive fallen companions.',
        ],
        [
          'Movement Haste',
          'Personal speed / companion rally',
          'Move 25% faster for 4–5.75s',
          'Companion Rally: +15–19% move, +8–12% basic attack speed',
          'Nearby living allies only; no dash and no faster special skills.',
        ],
        [
          'Arrow Volley',
          'Area arrows / slowing rain',
          'Hit up to 6 nearby foes',
          'Arrow Rain: arrows at up to 8 + slow',
        ],
        [
          'Repelling Shot',
          'Single push / repelling volley',
          'Shoot one foe and push it back',
          'Repelling Volley: 3 arrows + stronger push',
        ],
        [
          'Piercing Arrow',
          'Pierce / slowing piercing burst',
          '10× Power piercing hit on one foe',
          '12× Power piercing hit + slow',
        ],
        [
          'Hunter’s Salvo',
          'Multi-target / grand hunt',
          '5× Power arrow to up to 3 foes',
          'Grand Hunt: two 4× Power arrows to up to 5',
          'When isolated, fire 2 normal or 3 charged arrows at one foe. No piercing.',
        ],
      ],
    };
    function professionSkillCard(slot) {
      const card = skillCards[getGame().hero.class]?.[slot - 1];
      if (!card) return { name: 'Skill ' + slot, role: '', tap: '', charge: '', note: '' };
      return {
        name: card[0],
        role: card[1],
        tap: card[2],
        charge: card[3],
        note: card[4] || '',
      };
    }
    function skillDetail(slot, back) {
      const g = getGame(),
        def = D.skills.find((entry) => entry[0] === slot);
      if (!def || !(g.hero.skills[slot - 1] > 0)) return;
      const card = professionSkillCard(slot),
        rank = g.hero.skills[slot - 1] || 0,
        formatCd = (value) => (Math.round(value * 10) / 10).toFixed(1),
        teacher = slot === 1 ? '' : g.boss(def[4]).captive,
        nextTrainer =
          rank > 0 && rank < 8
            ? Object.keys(Campaign.rules.teachers).find(
                (id) =>
                  Campaign.rules.teachers[id].train.includes(slot) &&
                  Campaign.rules.teachers[id].maxRank >= rank + 1,
              )
            : null,
        learn =
          rank === 8
            ? '\nMaximum rank'
            : rank
              ? '\nNext rank: ' +
                (nextTrainer ? g.boss(nextTrainer).captive : 'rescued teacher') +
                ' · ' +
                g.skillTrainingCost(slot, rank) +
                ' crowns'
              : '\nLearn from ' + teacher + ' · ' + g.skillTrainingCost(slot, 0) + ' crowns';
      openMenu(
        'Skill ' + slot + ' · ' + card.name,
        'Rank ' +
          rank +
          (rank ? ' · same rank for tap and charge' : ' · not learned') +
          '\nTap · ' +
          formatCd(g.skillCooldown(slot)) +
          's: ' +
          card.tap +
          '\nCharge · ' +
          formatCd(g.skillCooldown(slot, true)) +
          's: ' +
          card.charge +
          (card.note ? '\n' + card.note : '') +
          learn,
        [],
        back,
      );
    }
    function combatConditions(back = closeMenu) {
      const Archive =
        typeof PrototypeArchive !== 'undefined' ? PrototypeArchive : require('./archive.js');
      openMenu(
        'Combat conditions',
        'Choose an effect for a short explanation.',
        Archive.conditionTopics(Campaign.rules).map(([name, brief]) =>
          action(name, () => openMenu(name, brief, [], () => combatConditions(back))),
        ),
        back,
      );
    }
    function skillBook(back = closeMenu) {
      const game = getGame(),
        choices = D.skills
          .filter((s) => game.hero.skills[s[0] - 1] > 0)
          .map((s) => {
            const slot = s[0],
              card = professionSkillCard(slot),
              rank = game.hero.skills[slot - 1] || 0;
            return action(
              'Skill ' + slot + ' · ' + card.name + ' · ' + (rank ? 'Rank ' + rank : 'Unlearned'),
              () => skillDetail(slot, () => skillBook(back)),
              card.role,
            );
          });
      openMenu(
        'Skill journal',
        'Notes on skills you already know. Visit an instructor to learn or train. Tap for normal · hold ' +
          Campaign.rules.chargedSkills.holdSeconds +
          's for charged. Damage can interrupt preparation. One rank, one cooldown slot; damaging skills gain +15% base damage per rank.',
        [
          ...choices,
          action(
            'Combat conditions',
            () => combatConditions(() => skillBook(back)),
            'Slow, Silence, interruption and protection',
          ),
          action(
            'Training and companions',
            () => skillTrainingOverview(() => skillBook(back)),
            'Teacher ranks · companion skills',
          ),
        ],
        back,
      );
    }
    function skillTrainingOverview(back = closeMenu) {
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
            ? 'Soldier: Power Strike (8s) + Holy Cleave (12s) · Ranger: Triple Shot (8s) + Piercing Volley (12s). Expedition 4 adds strike protection and covering Slow.'
            : 'Soldier: Power Strike · Archer: Triple Shot · Learn hero Skill 2 Rank 1 to unlock Holy Cleave and Piercing Volley',
          true,
        );
      openMenu(
        'Training and companions',
        'Rescued specialists teach skills and higher ranks. Skills use crowns; Expedition training is free.',
        [
          action('Expedition Skill · Rank ' + rank, () => {}, expDetail, true),
          ...support,
          companionLine,
        ],
        back,
      );
    }
    function keeperLedger(back = closeMenu) {
      if (!getGame().keeperReadLedger()) return;
      openMenu(
        'The Keeper’s ledger',
        'The Keeper’s seal marks a proposal to capture the land’s specialists. A later entry trades another captive for Neri: her craft was needed to save the soaked records.',
        [action('Close the ledger', back)],
        back,
      );
    }
    function keeperTopics(back = closeMenu) {
      const game = getGame();
      if (!game.s.keeperPact || !game.keeperAvailable()) return;
      const archive =
        typeof PrototypeArchive !== 'undefined' ? PrototypeArchive : require('./archive.js');
      const sections = archive.sections(game, { D, R: Campaign.rules });
      function currentSection(title) {
        const current = getGame();
        if (current !== game || !current.s.keeperPact || !current.keeperAvailable()) {
          back();
          return null;
        }
        return archive.sections(current, { D, R: Campaign.rules }).find((s) => s.title === title);
      }
      function shelf(section) {
        section = currentSection(section.title);
        if (!section) return;
        openMenu(
          section.title,
          section.intro,
          section.topics.map(([title]) =>
            action(title, () => {
              function answer(figures = false) {
                const current = currentSection(section.title);
                const topic = current?.topics.find(([name]) => name === title);
                if (!topic || (figures && !topic[2])) return;
                const actions = [];
                if (!figures && topic[2])
                  actions.push(action('Show me the figures', () => answer(true)));
                actions.push(action('Another question', () => shelf(current)));
                openMenu(title, topic[figures ? 2 : 1], actions, () =>
                  figures ? answer() : shelf(current),
                );
              }
              answer();
            }),
          ),
          () => keeperTopics(back),
        );
      }
      openMenu(
        'The Keeper’s shelves',
        '“Ask what you please. These volumes have survived worse than idle questions.”',
        sections.map((section) => action(section.title, () => shelf(section), section.intro)),
        back,
      );
    }
    function keeper(back = closeMenu) {
      const game = getGame();
      if (!game.keeperAvailable()) return;
      if (!game.s.keeperPact) {
        const ready = game.keeperPactReady();
        openMenu(
          'The Drowned Keeper',
          ready
            ? '“I have lost enough to the water. Promise me you will keep these shelves standing and let Neri tend the records. Then I will share what I know.”'
            : '“The pages are drowning. Free Neri, and then we may talk of saving them.”',
          ready
            ? [
                action('Promise to protect the Archive', () => {
                  if (getGame() !== game || !getGame().keeperPactReady()) {
                    back();
                    return;
                  }
                  if (getGame().promiseKeeper()) keeper(back);
                }),
              ]
            : [action('Leave him to his books', back)],
          back,
        );
        return;
      }
      keeperTopics(back);
    }
    function supplier(n, back = closeMenu) {
      const manaEnabled = Campaign.rules.resourceMode.manaEnabled;
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
          manaEnabled
            ? 'Combat potions have been retired. Rangers now provide field Heal and Mana Recovery, so the supply shop no longer requires you to maintain potion stock.'
            : 'Combat potions have been retired. Rangers provide Heal in the field.',
          [
            action(
              'Ranger field support',
              () => {},
              manaEnabled
                ? 'Heal triggers automatically at 50% HP or less · Mana Recovery at 35% MP or less · H/M command them manually'
                : 'Heal activates automatically for injured allies; command it manually with H',
              true,
            ),
          ],
          back,
        );
        return;
      }
      openMenu(
        n.name,
        manaEnabled
          ? 'Neri sells Preparation Tonics and trains permanent Ranger field support.'
          : 'Neri sells Preparation Tonics and trains permanent Ranger Heal, companion vitality and discipline resets.',
        [
          action(
            getGame().preparationTonicStock() >= 10000
              ? 'Preparation Tonics · STORAGE FULL'
              : 'Buy Preparation Tonic · ' + getGame().preparationTonicCost() + ' crowns',
            () => {
              if (getGame().purchasePreparationTonic()) supplier(n, back);
            },
            'Owned ' +
              getGame().preparationTonicStock() +
              ' · +10% maximum HP until rest or defeat · Use at any completed Barracks',
            getGame().hero.gold < getGame().preparationTonicCost() ||
              getGame().preparationTonicStock() >= 10000,
          ),
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
          ...(manaEnabled
            ? [
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
              ]
            : []),
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
          ...['weapon', 'armor'].map((slot) =>
            action(
              'Name ' + slot,
              () =>
                requestName({
                  title: 'Name your ' + slot,
                  description:
                    'Give your equipped ' +
                    slot +
                    ' a personal name. Its upgrades and statistics stay the same.',
                  initialValue:
                    getGame().hero[slot === 'weapon' ? 'customWeaponName' : 'customArmorName'] ||
                    '',
                  permanent: false,
                  onSubmit: (name) => getGame().nameEquipment(n.family, slot, name),
                  onSkip: () => smith(n, back),
                  onDone: () => smith(n, back),
                }),
              getGame().hero[slot === 'weapon' ? 'customWeaponName' : 'customArmorName'] ||
                'Optional · cosmetic · free',
            ),
          ),
          action(
            weaponOwned
              ? 'Weapon tier ' + tier + ' · ' + (currentWeapon === tier ? 'OWNED' : 'SURPASSED')
              : 'Weapon tier ' + tier + ' · ' + weapon + ' crowns',
            () => {
              if (getGame().gear(n.family, 'weapon')) {
                const hero = getGame().hero;
                status(
                  hero.legacyEquipped
                    ? 'Weapon bought · stronger one stays equipped.'
                    : 'Weapon tier ' + hero.weapon + ' equipped.',
                );
              }
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
              if (getGame().gear(n.family, 'armor'))
                status('Armor tier ' + getGame().hero.armorTier + ' equipped.');
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
      if (u.customName) return u.customName;
      return u.type === 'pet'
        ? getGame().petDefinition(u)?.name || 'Boss pet'
        : unitLabel(u.type) + ' #' + i;
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
      const availableKeeper = !!getGame().s.keeperPact && getGame().keeperAvailable();
      openMenu(
        'Rescued specialists',
        regional +
          ' Rescued specialists work from your barracks. More advanced specialists replace older redundant services.',
        [
          ...(specialists.length
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
            : [action('No specialists rescued yet', () => {}, regional, true)]),
          ...(availableKeeper
            ? [
                action(
                  'Drowned Keeper · The Archive',
                  () => keeper(returnHere),
                  'Ask for his learning',
                ),
              ]
            : []),
        ],
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
    function barracksPetDetail(b, family, back) {
      const game = getGame(),
        row = game.petCollection().find((r) => r.boss.id === family);
      if (!row?.def) return back();
      const { boss, def, unit, state } = row;
      openMenu(
        unit?.customName || def.name,
        'Inspired by ' +
          boss.name +
          ' · ' +
          state +
          '. ' +
          (def.role === 'ranged' ? 'Ranged support.' : 'Close-range support.'),
        [
          ...(unit
            ? [
                action(
                  unit.customName ? 'Name chosen · ' + unit.customName : 'Name this pet',
                  () => nameCompanion(unit.id, () => barracksPetDetail(b, family, back)),
                  unit.customName ? def.name : 'Optional · choose once, or leave it for later',
                  !!unit.customName,
                ),
              ]
            : []),
          action(
            'First · ' + def.first.name,
            () => {},
            'Automatic · ' + game.petSkillSummary(family, 1),
            true,
          ),
          action(
            'Charged · ' + def.second.name,
            () => {},
            'Requires companion combat training · ' + game.petSkillSummary(family, 2),
            true,
          ),
          action(
            state === 'Locked'
              ? 'Defeat TRUE ' + boss.name
              : !unit
                ? 'Recruit · FREE'
                : state === 'Fallen'
                  ? 'Recover through Barracks → Recovery'
                  : state === 'Active'
                    ? 'Rest in collection'
                    : 'Add to group',
            () => {
              const current = getGame().s.party.find(
                (u) => u.type === 'pet' && u.petFamily === family,
              );
              if (!current) getGame().recruitPet(family, b.id);
              else if (current.active !== false) getGame().restCompanion(current.id);
              else getGame().activateCompanion(current.id, b.id);
              barracksPetDetail(b, family, back);
            },
            !unit
              ? 'One permanent individual; uses an ordinary group slot.'
              : 'Health and recovery persist while resting.',
            state === 'Locked' ||
              state === 'Fallen' ||
              game.refugeThreat() ||
              (!unit && game.rosterCount() + game.queuedCompanions() >= 200) ||
              (state === 'Resting' && game.activeParty().length >= game.barracksFieldCap(b)),
          ),
        ],
        back,
      );
    }
    function barracksPetMenu(b, back) {
      const rows = getGame().petCollection(),
        returnHere = () => barracksPetMenu(b, back);
      openMenu(
        'Boss pet collection',
        rows.filter((r) => r.state !== 'Locked').length +
          '/' +
          rows.length +
          ' unlocked · TRUE victories, including past victories, unlock one unique pet each. Free to recruit; ordinary group slots and Barracks recovery apply. Pets do not work or summon.',
        rows.map(({ boss, def, state, unit }) =>
          action(
            (unit?.customName || def.name) + ' · ' + state,
            () => barracksPetDetail(b, boss.id, returnHere),
            boss.name,
          ),
        ),
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
          '. New recruits join the active group if this barracks can support another slot; otherwise they rest in reserve. TRUE boss pets are in the Company collection.',
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
    function nameCompanion(id, back) {
      const unit = getGame().s.party.find((u) => u.id === id);
      if (!unit || unit.customName) return back();
      requestName({
        title: 'Name your companion',
        description:
          getGame().companionDisplayName(unit) +
          ' · Choose a permanent name, or skip and return later.',
        onSubmit: (name) => getGame().nameCompanion(id, name),
        onSkip: back,
        onDone: back,
      });
    }
    function barracksNamesMenu(b, back) {
      const returnHere = () => barracksNamesMenu(b, back);
      openMenu(
        'Name companions',
        'Every employed companion and pet can receive a name once. Skipping keeps that choice available, including for resting and fallen companions.',
        getGame().s.party.length
          ? getGame().s.party.map((u) =>
              action(
                rosterLabel(u),
                () => nameCompanion(u.id, returnHere),
                (u.type === 'pet' ? getGame().petDefinition(u).name : unitLabel(u.type)) +
                  (u.customName ? ' · Permanent name chosen' : ' · Name available'),
                !!u.customName,
              ),
            )
          : [action('No companions employed', () => {}, '', true)],
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
            'Boss pet collection',
            () => barracksPetMenu(b, returnHere),
            'Eleven TRUE bosses · permanent unlocks · existing group slots',
          ),
          action(
            'Manage active group',
            () => barracksGroupMenu(b, returnHere),
            'With you ' + active + '/' + cap + ' · employed ' + getGame().rosterCount(),
          ),
          action(
            'Name companions',
            () => barracksNamesMenu(b, returnHere),
            'Optional, permanent names · all troops and pets',
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
        'Local objectives and expedition labor.',
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
    function tonicPurchaseMenu(b, back) {
      const cost = getGame().preparationTonicCost();
      openMenu(
        'Preparation Tonic',
        'No tonic stored. Buy one to use now, or visit Neri to stock up.',
        [
          action(
            'Buy and use · ' + cost + ' crowns',
            () => {
              if (getGame().purchasePreparationTonic() && getGame().usePreparationTonic())
                barracksMenu(b, back);
            },
            '+10% maximum HP until rest or defeat · one-time use',
            getGame().hero.gold < cost,
          ),
        ],
        () => barracksMenu(b, back),
      );
    }
    function barracksTonicAction(b, back) {
      if (!getGame().s.rescued.archive) return null;
      const stock = getGame().preparationTonicStock();
      if (getGame().hero.tonic)
        return action(
          'Preparation Tonic · ACTIVE',
          () => {},
          '+10% maximum HP until rest or defeat',
          true,
        );
      return action(
        stock ? 'Use Preparation Tonic · ' + stock + ' owned' : 'Preparation Tonic · Buy / Use',
        () => {
          if (getGame().preparationTonicStock()) {
            if (getGame().usePreparationTonic()) barracksMenu(b, back);
          } else tonicPurchaseMenu(b, back);
        },
        stock
          ? 'Consumes one · +10% maximum HP until rest or defeat'
          : 'None owned · Buy one here or from Neri',
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
        tonic = barracksTonicAction(b, back),
        selected =
          getGame().s.barracksRespawn?.zone === getGame().zoneId &&
          getGame().s.barracksRespawn?.id === b.id,
        respawnActions = getGame().s.challenge.succession
          ? []
          : [
              action(
                selected ? 'Return death recovery to refuge' : 'Set death recovery point',
                () => {
                  if (selected) getGame().clearBarracksRespawn();
                  else getGame().setBarracksRespawn(b.id);
                  barracksMenu(b, back);
                },
                selected
                  ? 'Selected recovery point · choose this to use your last refuge instead'
                  : 'On defeat, respawn here rather than at your last refuge',
              ),
            ],
        baseActions = [
          ...(getGame().peace && !getGame().s.finalRestCompleted
            ? [
                action(
                  'Rest here · Complete the journey',
                  () => {
                    if (getGame().completeFinalRest('barracks', b)) closeMenu();
                  },
                  'Completed Barracks · recover and begin the ending credits',
                ),
              ]
            : []),
          exp,
          action(
            'Skill journal',
            () => skillBook(returnHere),
            'Tap / charged effects and cooldowns',
          ),
          ...(tonic ? [tonic] : []),
          ...respawnActions,
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
          getGame().definition().name +
            (getGame().s.challenge.succession
              ? ' · Succession deaths never cost crowns; class loss is the penalty.'
              : ' · completed Basic Barracks reduce local death loss to 15%, including regional dungeons.'),
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
          ' employed. ' +
          (getGame().s.challenge.succession
            ? 'Succession deaths never cost crowns; class loss is the penalty.'
            : 'Local death loss drops to 5%, including regional dungeons.'),
        [
          exp,
          action(
            'Skill journal',
            () => skillBook(returnHere),
            'Tap / charged effects and cooldowns',
          ),
          ...(tonic ? [tonic] : []),
          ...respawnActions,
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
            'Local objectives · resources',
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
        mana = getGame().rangerSupportAmount('mana'),
        hero = getGame().hero,
        equipped =
          (hero.customWeaponName ? hero.customWeaponName + ' · ' : '') +
          (hero.legacyEquipped ? hero.legacyWeaponName : 'tier ' + hero.weapon);
      openMenu(
        'Inventory',
        'Crowns ' +
          Math.floor(getGame().hero.gold) +
          ' · Weapon tier ' +
          getGame().hero.weapon +
          ' · Armor tier ' +
          getGame().hero.armorTier +
          '\nEquipped weapon: ' +
          equipped +
          '\nEquipped armor: ' +
          (hero.customArmorName || 'tier ' + hero.armorTier) +
          ' · Weapon reforge: ' +
          (hero.reforges['weapon:' + hero.weapon]
            ? hero.legacyEquipped
              ? 'owned (inactive while legacy weapon equipped)'
              : 'active'
            : 'none') +
          ' · Armor reforge: ' +
          (hero.reforges['armor:' + hero.armorTier] ? 'active' : 'none') +
          '\nPreparation Tonics: ' +
          getGame().preparationTonicStock() +
          ' stored · ' +
          (hero.tonic
            ? 'ACTIVE on hero only (+10% maximum HP until rest or defeat)'
            : 'inactive · use at a completed Barracks') +
          '\nRanger support: ' +
          (rangers.length
            ? rangers.length +
              ' active · Heal ' +
              heal +
              ' HP (H)' +
              (Campaign.rules.resourceMode.manaEnabled
                ? ' · Mana Recovery ' + mana + ' MP (M)'
                : '') +
              '. Automatic support remains active.'
            : 'Recruit a Ranger to unlock field Heal' +
              (Campaign.rules.resourceMode.manaEnabled ? ' and Mana Recovery.' : '.')) +
          '\nChoose equipment below when available.',
        [
          ...(openCharacter
            ? [
                action(
                  'Character and identity',
                  openCharacter,
                  'View character details and edit your name',
                ),
              ]
            : []),
          ...Object.keys(Campaign.legacyWeapons)
            .filter((name) => getGame().s.legacyInventory?.includes(name))
            .map((name) =>
              action(
                'Equip ' + name,
                () => {
                  if (getGame().equipLegacy(name)) status(name + ' equipped.');
                  inventory(back);
                },
                'Saved weapon · +' + Campaign.legacyWeapons[name] + ' power',
              ),
            ),
          ...(getGame().hero.weapon
            ? [
                action('Equip current weapon tier ' + getGame().hero.weapon, () => {
                  if (getGame().equipTierWeapon())
                    status('Weapon tier ' + getGame().hero.weapon + ' equipped.');
                  inventory(back);
                }),
              ]
            : []),
        ],
        back,
      );
    }
    // prettier-ignore
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
      openMenu(getGame().definition().town + ' Captain', '', actions, back);
    }
    // prettier-ignore
    function partyMenu(back = closeMenu) {
      townRecruitmentMenu(back);
    }
    function formatTrainingNumber(n) {
      return Number(n.toFixed(2)).toString();
    }
    function disciplineEffect(i) {
      const p = getGame().talentProfile();
      if (i === 0) return 'Each rank: +' + p.power + ' Power';
      if (i === 1)
        return Campaign.rules.resourceMode.manaEnabled
          ? 'Each rank: +' +
              formatTrainingNumber(p.mana * 0.125) +
              ' MP/s in combat · +' +
              formatTrainingNumber(p.mana * 0.25) +
              ' MP/s out of combat'
          : 'Each rank: -' +
              Math.round(Campaign.rules.cooldownBalance.reductionPerTalentRank * 100) +
              '% to skill cooldowns · up to 20% at Rank 5';
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
      const names = [
          'Power Training',
          Campaign.rules.resourceMode.manaEnabled ? 'Mana Training' : 'Cooldown Training',
          'Health Training',
          'Movement Training',
        ],
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
        'Talents',
        'Available training points ' +
          getGame().hero.talentPoints +
          ' · One point raises one discipline by one rank.',
        actions,
        back,
      );
    }

    // The global journal is the primary campaign guide. Side quests remain
    // available from local quest boards without changing their saved progress.
    function storyJournal(back = closeMenu) {
      const game = getGame(),
        zone = game.zone(),
        room = game.supplyRoom() || game.sideDungeon(),
        inside = D.bosses.find((boss) => boss.id === game.zoneId),
        regionId = inside?.region || room?.region || game.definition().id,
        index = D.regions.findIndex((region) => region.id === regionId),
        region = D.regions[index],
        here = game.zoneId,
        findNpc = (matches) => zone.npcs.find(matches),
        liveBoss = (id) =>
          zone.enemies.find(
            (enemy) => enemy.type === 'boss' && enemy.family === id && enemy.hp > 0,
          ),
        guideAction = (label, destination) =>
          action('Navigate · ' + label, () => storyNavigate(destination, label), '', !destination),
        present = (summary, options) => openMenu('Story journal', summary, options, back),
        exit = findNpc((n) => n.kind === 'exit');
      const leaveInterior = () => {
        if (!exit) return false;
        present('Return to ' + (region?.name || 'the region'), [guideAction('Dungeon exit', exit)]);
        return true;
      };

      if (game.peace) {
        present('Campaign complete · Nightmare unlocked', [
          action('New Normal adventure', () => chooseNewRun('normal')),
          action('New Nightmare adventure', () => chooseNewRun('nightmare')),
        ]);
        return;
      }

      if (game.s.phase === 'awakening') {
        const remaining = Campaign.dungeonIds.filter((id) => !game.s.true[id]),
          defeated = Campaign.dungeonIds.length - remaining.length;
        if (!remaining.length) {
          present('Awakening complete', []);
          return;
        }
        const id =
            remaining.find((candidate) => candidate === here) ||
            remaining.find((candidate) => game.boss(candidate).region === regionId) ||
            remaining[0],
          boss = game.boss(id);
        if (inside && inside.id !== id && leaveInterior()) return;
        if (room && leaveInterior()) return;
        if (boss.region !== regionId) {
          const targetIndex = D.regions.findIndex((r) => r.id === boss.region),
            transport =
              findNpc((n) => n.kind === 'transport' && n.hub) ||
              findNpc(
                (n) => n.kind === 'transport' && n.direction === Math.sign(targetIndex - index),
              );
          present('Awakening · ' + defeated + '/5 defeated · ' + boss.place, [
            guideAction(transport?.name || 'Regional transport', transport),
          ]);
          return;
        }
        const destination =
          here === id
            ? liveBoss(id) || findNpc((n) => n.kind === 'cage' && n.family === id)
            : findNpc((n) => n.kind === 'dungeon' && n.family === id);
        present('Awakening · ' + defeated + '/5 defeated · ' + boss.name, [
          guideAction(here === id ? boss.name : boss.place, destination),
        ]);
        return;
      }

      const pending = D.bosses.filter(
        (boss) => boss.region === regionId && boss.captive && !game.s.rescued[boss.id],
      );
      if (pending.length) {
        if (room && leaveInterior()) return;
        if (inside && !pending.some((boss) => boss.id === here) && leaveInterior()) return;
        const ordered = [
          ...pending.filter((boss) => boss.id === here),
          ...pending.filter((boss) => boss.id !== here),
        ];
        present(
          (region?.name || 'Region') + ' · ' + (2 - pending.length) + '/2 rescued',
          ordered.map((boss) => {
            const destination =
              boss.id === 'thorn' && here === 'vale'
                ? game.s.keys.thorn
                  ? findNpc((n) => n.id === 'cage-thorn')
                  : findNpc((n) => n.thornReport) || findNpc((n) => n.id === 'thorn-trailhead-0')
                : here === boss.id
                  ? liveBoss(boss.id) || findNpc((n) => n.kind === 'cage' && n.family === boss.id)
                  : boss.kind === 'dungeon'
                    ? findNpc((n) => n.kind === 'dungeon' && n.family === boss.id)
                    : liveBoss(boss.id) ||
                      findNpc((n) => n.kind === 'cage' && n.family === boss.id);
            return guideAction(
              boss.id === 'thorn' && !game.s.keys.thorn
                ? 'Mira · ask the Orchard trail witness'
                : boss.captive.split(' the ')[0] + ' · ' + boss.place,
              destination,
            );
          }),
        );
        return;
      }
      if (inside && leaveInterior()) return;
      if (room && leaveInterior()) return;

      if (index >= 0 && index < D.regions.length - 1) {
        const next = D.regions[index + 1],
          transport = findNpc((n) => n.kind === 'transport' && n.direction === 1);
        present('Specialists rescued · Next: ' + next.name, [
          guideAction(transport?.name || 'Transport to ' + next.name, transport),
        ]);
        return;
      }

      const darklord =
        liveBoss('darklord') ||
        findNpc((n) => n.id === 'fortress-gate') ||
        (D.fields?.[4] ? { x: D.fields[4][0], y: D.fields[4][1] } : null);
      present(
        game.s.normal.darklord
          ? 'Find and defeat the TRUE Dark Lord'
          : 'Specialists rescued · Defeat the Dark Lord',
        [guideAction('Dark Lord', darklord)],
      );
    }

    function quests(atBoard, back = closeMenu) {
      if (!atBoard) return storyJournal(back);
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
      combatConditions,
      supplier,
      smith,
      keeper,
      keeperLedger,
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
