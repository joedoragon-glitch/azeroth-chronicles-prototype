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
    practiceRecall = () => closeMenu(),
    showMap,
    finaleMenu,
    storyNavigate = () => {},
    sceneTransitionTo = (destination, label, commit) => { if (commit()) closeMenu(); },
    chooseNewRun = () => {},
    status = () => {},
    requestName = () => {},
    openCharacter = null,
  }) {
    // Author-final bilingual copy is a fixed source of text, not a rewrite prompt.
    const approvedNarrative = (
      typeof PrototypeNarration !== 'undefined' ? PrototypeNarration : require('./narration.js')
    ).approved;
    function refugeIntro(site) {
      const owner = getGame(),
        zone = owner.zoneId,
        current = owner.zone().npcs.find((n) => n.id === site.id && n.kind === 'rest');
      if (!current || zone !== 'vale' || owner.interactionDistance(current) > 115)
        return closeMenu();
      const reason = owner.refugeThreat()
        ? 'End nearby combat first.'
        : owner.s.restCooldown > 0 && !owner.peace
          ? 'Rest ready in ' + Math.ceil(owner.s.restCooldown) + 's.'
          : '';
      openMenu(
        current.name,
        'Rest here to heal you and living companions.\nSets your death recovery point. Both refuges share a 90s cooldown.\nFallen companions: Captain or Barracks.',
        [
          action(
            'Rest now',
            () => {
              const game = getGame();
              if (game !== owner || game.zoneId !== zone) return closeMenu();
              const target = game.zone().npcs.find((n) => n.id === site.id && n.kind === 'rest');
              if (target && game.interact(target)) {
                game.acknowledgeRefuge(target);
                closeMenu();
              } else refugeIntro(site);
            },
            reason || 'Heal and set your recovery point.',
            !!reason,
          ),
          action(
            'Got it',
            () => {
              const game = getGame();
              if (game === owner && game.zoneId === zone) game.acknowledgeRefuge(current);
              closeMenu();
            },
            'Close without resting.',
          ),
        ],
      );
    }
    function dungeonEntranceMenu(ref, back = closeMenu) {
      const game = getGame(),
        entrance = game.dungeonEntrance(ref);
      if (!entrance) {
        status('Visit the dungeon entrance to prepare a camp.');
        return;
      }
      const camp = game.dungeonCamp(entrance),
        reason = game.dungeonCampReason(entrance),
        cost = camp ? 0 : game.barracksBuildCost();
      if (camp && (camp.progress >= 4 || camp.dungeonEntrance === entrance.family)) {
        sceneTransitionTo(entrance.family, entrance.name, () => getGame().interact(entrance));
        return;
      }
      openMenu(
        entrance.name,
        game.peace
          ? 'Enter, or prepare your recovery camp outside.'
          : 'Leaving resets an unfinished encounter. Defeated leaders keep their normal return time; earned progress stays saved.',
        [
          action('Enter dungeon', () => {
            const current = getGame().dungeonEntrance(entrance);
            if (current) sceneTransitionTo(current.family, current.name, () => getGame().interact(current));
          }),
          action(
            camp?.progress >= 4
              ? 'Use nearby Barracks & set recovery'
              : camp
                ? 'Finish Barracks & set recovery'
                : 'Build Barracks & set recovery',
            () => {
              if (!getGame().prepareDungeonCamp(entrance)) {
                status(getGame().messages.at(-1));
                dungeonEntranceMenu(entrance, back);
                return;
              }
              const ready = getGame().dungeonCamp(entrance);
              if (ready?.progress >= 4)
                barracksMenu(ready, () => dungeonEntranceMenu(entrance, back));
              else closeMenu();
            },
            reason ||
              (camp?.progress >= 4
                ? 'Reuse this camp for recovery and companion services.'
                : (camp ? 'No extra cost' : cost ? cost + ' crowns' : 'First Barracks FREE') +
                  ' · one Soldier or Ranger builds outside. Recovery switches when finished.'),
            !!reason,
          ),
        ],
        back,
      );
    }
    function transport(n) {
      const game = getGame(),
        i = game.regionIndex(),
        target = D.regions[i + n.direction];
      if (!target) return;
      const cost = game.travelFare(i, n.direction),
        work = game.passageWorkQuote(n.direction),
        departureReason = game.lanternFerryReason(n.direction),
        ferryPassage =
          (game.zoneId === 'march' && n.direction === 1) ||
          (game.zoneId === 'highlands' && n.direction === -1)
            ? Campaign.rules.tidalFerryPassage
            : '';
      const actions = [
        action(
          'Travel to ' + target.name,
          () => {
            sceneTransitionTo(target.id, target.name, () => getGame().travel(n.direction));
          },
          departureReason || cost + ' crowns',
          !!departureReason || game.hero.gold < cost,
        ),
      ];
      if (work)
        actions.push(
          action(
            'Work for passage · pay ' + work.payment + ' crowns',
            () => {
              sceneTransitionTo(target.id, target.name, () => getGame().travel(n.direction, { workPassage: true }));
            },
            departureReason ||
              'Help the crew cover the missing ' +
                work.work +
                ' crowns. Includes free return; no companions or resource deposits needed.',
            !!departureReason,
          ),
        );
      openMenu(
        n.name,
        (ferryPassage ? ferryPassage + '\n\n' : '') +
          (game.s.mode === 'developer'
            ? 'FREE — Developer Mode. Travel has no fare or return-ticket requirement.'
            : 'Fare ' +
              cost +
              ' crowns. Outbound travel includes free return. Health and supplies are preserved.' +
              (work
                ? ' Both local specialists are rescued: the crew will accept help with their supplies for the fare shortfall.'
                : '')),
        actions,
      );
    }
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
    function nextSkillInstructor(family) {
      const cap = getGame().teacherCatalog(family).maxRank;
      return (
        Object.keys(Campaign.rules.teachers).find(
          (id) => Campaign.rules.teachers[id].maxRank > cap,
        ) || null
      );
    }
    function teacher(n, back = closeMenu) {
      const returnHere = () => teacher(n, back),
        hasSupport = Object.values(Campaign.rules.expeditionSupportSkills).some(
          (def) => def.trainers?.[n.family],
        );
      openMenu(
        n.name,
        'Choose your training.',
        [
          action(
            'Hero skills',
            () => teacherSkills(n, returnHere),
            'Learn or improve your class skills.',
          ),
          ...(getGame().expeditionInstructorCap(n.family)
            ? [
                action(
                  'Expedition training · FREE',
                  () => teacherExpedition(n, returnHere),
                  'Group size and field options.',
                ),
              ]
            : []),
          ...(hasSupport
            ? [
                action(
                  'Companion training',
                  () => teacherCompanions(n, returnHere),
                  'Bonuses shared with your companions.',
                ),
              ]
            : []),
          action('Open skill journal', () => skillBook(returnHere), 'Effects and controls.'),
          ...(nextSkillInstructor(n.family)
            ? [
                action(
                  'Higher ranks',
                  () => teacherNext(n, returnHere),
                  'Find the next instructor.',
                ),
              ]
            : []),
        ],
        back,
      );
    }
    function teacherSkills(n, back) {
      const g = getGame(),
        catalog = g.teacherCatalog(n.family),
        cap = catalog.maxRank,
        arenaFree = g.s.mode === 'arena',
        skills = D.skills.filter((s) =>
          g.hero.skills[s[0] - 1] ? catalog.train.includes(s[0]) : catalog.learn.includes(s[0]),
        ),
        finished = skills.every((s) => g.hero.skills[s[0] - 1] >= cap);
      openMenu(
        'Hero skills',
        finished
          ? nextSkillInstructor(n.family)
            ? 'Training finished here. Back → Higher ranks for the next instructor.'
            : 'All available skills are at maximum rank.'
          : arenaFree
            ? 'Choose a skill to preview its training. All arena training is FREE.'
            : 'Choose a skill to preview its training.\nCrowns ' + Math.floor(g.hero.gold),
        skills.map((s) => {
          const rank = g.hero.skills[s[0] - 1],
            cost = g.skillTrainingCost(s[0], rank),
            card = professionSkillCard(s[0]),
            capped = rank >= cap;
          return action(
            capped
              ? card.name + ' · Rank ' + rank + ' · Finished here'
              : (rank ? 'Train ' : 'Learn ') + card.name + ' · ' + (arenaFree ? 'FREE' : cost + ' crowns'),
            () => skillUpgrade(s[0], () => teacherSkills(n, back), n),
            'Skill ' +
              s[0] +
              ' · ' +
              card.role +
              ' · ' +
              (capped
                ? 'Instructor limit: Rank ' + cap
                : 'Rank ' + rank + ' → ' + (rank + 1) + ' · Preview') +
              (!capped && !arenaFree && g.hero.gold < cost ? '\nNeed more crowns.' : ''),
            capped,
          );
        }),
        back,
      );
    }
    function teacherExpedition(n, back) {
      const g = getGame(),
        rank = g.s.expeditionRank || 1,
        cap = g.expeditionInstructorCap(n.family),
        next = g.expeditionNextInstructor(rank),
        nextBoss = next ? g.boss(next) : null;
      openMenu(
        'Expedition training',
        rank < cap
          ? 'Expand your group and field options. Training is free.'
          : rank >= 6
            ? 'Maximum Expedition rank.'
            : 'Next: ' +
              nextBoss.captive +
              ' — ' +
              D.regions.find((r) => r.id === nextBoss.region).name,
        [
          rank < cap
            ? action(
                'Train Expedition Skill · Rank ' + rank + ' → ' + (rank + 1) + ' · FREE',
                () => {
                  getGame().trainExpedition(n.family);
                  teacherExpedition(n, back);
                },
                g.expeditionUnlock(rank + 1),
              )
            : action(
                'Expedition Skill · Rank ' + rank,
                () => {},
                'Finished with this instructor.',
                true,
              ),
        ],
        back,
      );
    }
    function teacherCompanions(n, back) {
      openMenu(
        'Companion training',
        'Train bonuses shared with your companions.',
        expeditionSupportActions(n, () => teacherCompanions(n, back)),
        back,
      );
    }
    function teacherNext(n, back) {
      const id = nextSkillInstructor(n.family);
      if (!id) return back();
      const boss = getGame().boss(id),
        region = D.regions.find((r) => r.id === boss.region);
      openMenu(
        'Higher ranks',
        (getGame().s.rescued[id] ? 'Visit ' : 'Rescue ') +
          boss.captive +
          ' — ' +
          region.name +
          '.\nThis instructor teaches higher hero-skill ranks.',
        [],
        back,
      );
    }
    // One short, class-specific reference shared by the skill list and trainers.
    // Rules/Campaign remain authoritative for ranks, cooldowns and availability.
    // The Keeper's Archive is optional deeper reading, not required for basics.
    const SkillReference =
      typeof PrototypeSkillReference !== 'undefined'
        ? PrototypeSkillReference
        : require('./skill-reference.js');
    function professionSkillCard(slot) {
      return SkillReference.card(getGame(), slot);
    }
    function skillSections(info) {
      return (info.auto ? [info.auto, info.tap, info.charge] : [info.tap, info.charge]).map(
        (form) => ({
          title: form.title,
          text: form.effect,
          rows: form.metrics.map((m) => ({ label: m.label, value: SkillReference.value(m) })),
        }),
      );
    }
    function skillDetail(slot, back) {
      const g = getGame(),
        info = SkillReference.describe(g, slot);
      if (!info) return;
      openMenu(
        'Skill ' + slot + ' · ' + info.name,
        {
          summary:
            'Rank ' +
            info.rank +
            (info.rank === 8
              ? ' · Maximum rank'
              : ' · Automatic basics, Tap and Charged use this rank.') +
            (slot === 1 ? ' · Self-taught from Rank 1; rescued specialists refine it.' : ''),
          sections: skillSections(info),
          note: info.note,
        },
        [
          ...(info.rank < 8
            ? [
                action(
                  'Next rank · Preview',
                  () => skillUpgrade(slot, () => skillDetail(slot, back)),
                  'Compare changes and find an instructor.',
                ),
              ]
            : []),
          action(
            'Using skills',
            () => skillControls(() => skillDetail(slot, back)),
            'Tap, charge, cooldowns and damage figures.',
          ),
        ],
        back,
      );
    }
    function skillControls(back) {
      openMenu(
        'Using skills',
        {
          summary:
            'Automatic Skill 1 basics attack independently. Tap for the normal technique. Hold to prepare the charged technique.',
          sections: [
            {
              title: 'Controls',
              text: 'Charged starts both recovery timers: short Tap and longer Charged. Tap returns after its own cooldown, even while Charged is still recovering. Tapping does not restart the charged lock. Charged needs both timers ready. On cooldown, tap to queue normal or briefly hold to queue charged. A strong hit can interrupt preparation.',
            },
            {
              title: 'Reading effects',
              text: 'Damage figures use your current Power, before enemy defenses and situational bonuses. Healing cannot exceed maximum health. Distances use map units.',
            },
          ],
          note: 'Skill ranks do not shorten cooldowns. Discipline training can.',
        },
        [],
        back,
      );
    }
    function skillUpgrade(slot, back, instructor = null) {
      const g = getGame(),
        rank = g.hero.skills[slot - 1],
        next = rank + 1,
        info = SkillReference.describe(g, slot, next);
      if (!info) return back();
      const trainer =
          instructor?.family ||
          Object.keys(Campaign.rules.teachers).find(
            (id) =>
              Campaign.rules.teachers[id].train.includes(slot) &&
              Campaign.rules.teachers[id].maxRank >= next,
          ),
        cost = g.skillTrainingCost(slot, rank),
        arenaFree = g.s.mode === 'arena',
        costLabel = arenaFree ? 'FREE' : cost + ' crowns',
        previewOnly = !instructor,
        ready =
          instructor &&
          g.s.rescued[instructor.family] &&
          next <= g.teacherCatalog(instructor.family).maxRank;
      openMenu(
        info.name + ' · ' + (rank ? 'Rank ' + rank + ' → ' + next : 'Learn Rank 1'),
        {
          summary: previewOnly
            ? trainer
              ? 'Next instructor: ' + g.boss(trainer).captive + ' · ' + costLabel
              : 'No further instructor available.'
            : rank
              ? 'Compare your upgrade before training.'
              : 'Learn both forms at Rank 1.',
          sections: rank
            ? SkillReference.changes(g, slot).map((block) => ({
                ...block,
                text: block.rows.length ? '' : 'No change at this rank.',
              }))
            : skillSections(info),
          note: rank
            ? 'Only changed effects are shown. Cooldowns stay the same.'
            : slot === 2 && !g.companionSecondSkillUnlocked()
              ? 'Also unlocks advanced Soldier/Ranger and pet skills, plus Charmed monster elite traits.'
              : info.note,
        },
        previewOnly
          ? []
          : [
              action(
                (rank ? 'Train ' : 'Learn ') + info.name + ' · ' + costLabel,
                () => {
                  const current = getGame();
                  // An old quote must never spend money on a different rank or class.
                  if (
                    current !== g ||
                    current.hero.skills[slot - 1] !== rank ||
                    current.skillTrainingCost(slot, rank) !== cost
                  )
                    return skillUpgrade(slot, back, instructor);
                  const learned = rank
                    ? current.upgrade(slot, instructor.family)
                    : current.learn(slot, instructor.family);
                  if (learned) back();
                  else skillUpgrade(slot, back, instructor);
                },
                !ready
                  ? 'Training unavailable here.'
                  : !arenaFree && g.hero.gold < cost
                    ? 'Need more crowns.'
                    : slot === 1
                      ? 'Also improves automatic basics.'
                      : 'Applies to Tap and Charged.',
                !ready || (!arenaFree && g.hero.gold < cost),
              ),
            ],
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
        'Choose a skill. View automatic Skill 1 basics, Tap and Charged effects with independent recovery.',
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
        companionAdvanced = getGame().companionSecondSkillUnlocked(),
        companionDescription = companionAdvanced
          ? 'Soldier: Power Strike (8s) + Holy Cleave (12s) · Ranger: Triple Shot (8s) + Piercing Volley (12s). Expedition 4: Soldier Power Strike grants 20% self-protection for 2s; Ranger Triple Shot’s first arrow Slows for 1s if fired within 150 units and it hits. Rangers use it while falling back when ready.'
          : 'Soldier: Power Strike · Archer: Triple Shot · Learn hero Skill 2 Rank 1 to unlock Holy Cleave and Piercing Volley',
        companionLine = action(
          'Companion combat skills · ' + (companionAdvanced ? 'Advanced' : 'Core'),
          () =>
            openMenu('Companion combat skills', companionDescription, [], () =>
              skillTrainingOverview(back),
            ),
          'View automatic combat skills.',
        );
      openMenu(
        'Training and companions',
        'Skills use crowns; Expedition training is free. Preview each skill to see what its next rank changes.',
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
        approvedNarrative.P06.en,
        [action('Close the ledger', back)],
        back,
      );
    }
    // A2/A3 Archive navigation: one stable callback tree per game and entry route.
    // The shared menu history compares back-function identity and title; recreating
    // these callbacks on every Back used to lose both selection and scroll position.
    const archiveSessions = new WeakMap();
    function keeperTopics(back = closeMenu) {
      const game = getGame();
      if (!game.s.keeperPact || !game.keeperAvailable()) return;
      let routes = archiveSessions.get(game);
      if (!routes) {
        routes = new Map();
        archiveSessions.set(game, routes);
      }
      let session = routes.get(back);
      if (!session) {
        const archive =
          typeof PrototypeArchive !== 'undefined' ? PrototypeArchive : require('./archive.js');
        const shelfBacks = new Map(),
          answerBacks = new Map();
        const available = () => getGame() === game && game.s.keeperPact && game.keeperAvailable();
        const allSections = () => archive.sections(game, { D, R: Campaign.rules });
        const sectionByTitle = (title) => allSections().find((item) => item.title === title);
        const guarded = () => {
          if (available()) return true;
          back();
          return false;
        };
        // Headings are visual scan aids, not new lore or additional shelf levels.
        // They never enter the keyboard button order and cannot hide a topic.
        function groupName(section, topicTitle, index) {
          if (section.title === 'Adversaries and their attacks') {
            if (index === 0) return 'The TRUE adversaries';
            if (topicTitle === 'Creatures encountered') return 'Creatures encountered';
            const boss = D.bosses.find((b) => b.name === topicTitle);
            return boss?.kind === 'field' ? 'Field adversaries' : 'Dungeon guardians';
          }
          if (section.title === 'The Crown and its institutions')
            return index < 7 ? 'Offices and governors' : 'People and records';
          return null;
        }
        function answer(sectionTitle, topicTitle, figures = false) {
          if (!guarded()) return;
          const topic = sectionByTitle(sectionTitle)?.topics.find(
            ([title]) => title === topicTitle,
          );
          if (!topic || (figures && !topic[2])) return shelf(sectionTitle);
          const id = sectionTitle + ':' + topicTitle;
          if (!shelfBacks.has(sectionTitle))
            shelfBacks.set(sectionTitle, () => shelf(sectionTitle));
          if (!answerBacks.has(id)) answerBacks.set(id, () => answer(sectionTitle, topicTitle));
          const actions = [];
          if (!figures && topic[2])
            actions.push(
              action('Show me the figures', () => answer(sectionTitle, topicTitle, true)),
            );
          if (figures) actions.push(action('Return to the answer', answerBacks.get(id)));
          actions.push(action('Another question', shelfBacks.get(sectionTitle)));
          actions.push(action('All shelves', index));
          openMenu(
            topicTitle,
            topic[figures ? 2 : 1],
            actions,
            figures ? answerBacks.get(id) : shelfBacks.get(sectionTitle),
            { view: 'archive-reading', archiveSection: sectionTitle, archiveFigures: figures },
          );
        }
        function shelf(sectionTitle) {
          if (!guarded()) return;
          const section = sectionByTitle(sectionTitle);
          if (!section) return index();
          const actions = [];
          let previousGroup;
          for (const [position, [title]] of section.topics.entries()) {
            const group = groupName(section, title, position);
            if (group && group !== previousGroup) actions.push({ kind: 'section', label: group });
            previousGroup = group;
            actions.push(action(title, () => answer(sectionTitle, title)));
          }
          openMenu(section.title, section.intro, actions, index, { view: 'archive-shelf' });
        }
        function index() {
          if (!guarded()) return;
          const sections = allSections();
          openMenu(
            'The Keeper’s shelves',
            approvedNarrative.P03.en,
            sections.map((section) =>
              action(
                section.title,
                () => shelf(section.title),
                section.intro + ' · ' + section.topics.length + ' questions',
              ),
            ),
            back,
            { view: 'archive-index' },
          );
        }
        session = { index };
        routes.set(back, session);
      }
      session.index();
    }
    function keeper(back = closeMenu) {
      const game = getGame();
      if (!game.keeperAvailable()) return;
      if (!game.s.keeperPact) {
        const ready = game.keeperPactReady();
        openMenu(
          'The Drowned Keeper',
          ready ? approvedNarrative.P02.en : approvedNarrative.P01.en,
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
        getGame().unloadCompanyTribute(n);
        openMenu(
          n.name,
          manaEnabled
            ? 'Combat potions have been retired. Rangers now provide field Heal and Mana Recovery, so the supply shop no longer requires you to maintain potion stock.'
            : 'Tribute collection and delivery. Visiting unloads all company cargo, including resting and fallen companions. Rangers provide Heal in the field.',
          [
            barracksGatherAction(n, () => supplier(n, back)),
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
        n.presentation === 'archive-restorer'
          ? approvedNarrative.P04.en
          : manaEnabled
            ? approvedNarrative.P07.en
            : approvedNarrative.P07_nomana.en,
        [
          { kind: 'section', label: 'Preparation Tonics' },
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
          { kind: 'section', label: 'Ranger support' },
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
          { kind: 'section', label: 'Training and resets' },
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
          { kind: 'section', label: 'Equipment upgrades' },
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
          { kind: 'section', label: 'Reforging' },
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
          { kind: 'section', label: 'Appearance' },
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
          ...(supportActions.length
            ? [{ kind: 'section', label: 'Expedition support' }, ...supportActions]
            : []),
        ],
        back,
      );
    }
    function unitLabel(type) {
      return type === 'archer' ? 'Ranger' : 'Soldier';
    }
    function rosterLabel(u) {
      const i = getGame().s.party.indexOf(u) + 1,
        label = u.customName ||
          (u.charmOrigin
            ? charmedTypeName(u) + ' #' + i
            : u.type === 'pet'
              ? getGame().petDefinition(u)?.name || 'Boss pet'
              : unitLabel(u.type) + ' #' + i);
      return label + (u.expeditionId ? ' · On expedition' : '');
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
      if (tutorial && !tutorial.paid && !tutorial.captainBriefed)
        return 'COMPANIONS · Meet the town Captain to learn about your Soldier and Ranger. Your first Barracks is FREE: Open Menu/Esc in the field → Establish Basic Barracks.';
      if (tutorial && !tutorial.paid && !tutorial.recallPracticed)
        return 'COMPANIONS · Try Recall squad to bring your companions back, then build your first Barracks — FREE. Open Menu/Esc in the field → Establish Basic Barracks.';
      if (tutorial && !tutorial.paid) {
        if (getGame().hasAnyBarracks())
          return 'FIELD BASE · Construction in progress. Keep your builder assigned.';
        return tutorial.barracksBriefed
          ? 'FIELD BASE · Leave town → open ground off the road → Menu → Establish Basic Barracks (FREE).'
          : "COMPANIONS · Recall practiced. Continue the Captain's briefing.";
      }
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
        missing = regionalSpecialistProgress().missing[0],
        regional = missing
          ? 'Rescue ' +
            missing.captive.split(' the ')[0] +
            ' — ' +
            (missing.kind === 'dungeon' ? missing.place : missing.name)
          : 'All local specialists rescued.';
      const availableKeeper = !!getGame().s.keeperPact && getGame().keeperAvailable();
      openMenu(
        'Rescued specialists',
        'Choose a rescued specialist for training or equipment.',
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
    function careQueueSummary(kind) {
      const g = getGame(),
        request = g.s.companionCareRequests[kind];
      if (!request) return '';
      const names = [
        ...(kind === 'treatment' && request.heroWounded ? ['Hero'] : []),
        ...request.companionIds
          .map((id) => g.s.party.find((u) => u.id === id))
          .filter(Boolean)
          .map(rosterLabel),
      ].join(', ');
      const reason = g.companionCareReason(kind, request, { ignoreFunds: true, checkSource: true });
      return (
        (kind === 'recovery' ? 'Queued recovery: ' : 'Queued treatment: ') +
        names +
        ' · ' +
        Math.floor(g.hero.gold) +
        '/' +
        g.companionCarePrice(kind) +
        ' crowns · ' +
        (reason || 'Automatic when eligible.')
      );
    }
    function companionQueueSummary() {
      const lines = [
        careQueueSummary('recovery'),
        careQueueSummary('treatment'),
        recruitmentQueueSummary(),
      ].filter(Boolean);
      if (lines.length > 1) lines.push('Queue payment order: recovery → treatment → recruitment.');
      return lines.join('\n');
    }
    function careChoice(kind, barracksId, refresh) {
      const g = getGame(),
        queued = !!g.s.companionCareRequests[kind],
        request = queued
          ? g.s.companionCareRequests[kind]
          : g.companionCareCandidate(kind, barracksId),
        reason = g.companionCareReason(kind, request, { ignoreFunds: true, checkSource: true }),
        cost = g.companionCarePrice(kind),
        target = g.companionCareTargets(kind, request)[0];
      return action(
        (queued
          ? kind === 'recovery'
            ? 'Cancel queued recovery'
            : 'Cancel queued treatment'
          : kind === 'recovery'
            ? 'Recover fallen companion'
            : 'Treat wounds') +
          ' · ' +
          cost +
          ' crowns',
        () => {
          getGame().requestCompanionCare(kind, barracksId);
          refresh();
        },
        queued
          ? 'Queued · tap to cancel. No crowns spent.'
          : (reason === 'No requested companion is still fallen.'
              ? 'No fallen companions.'
              : reason === 'No requested party member is still wounded.'
                ? 'No wounds to treat.'
                : reason) ||
              (kind === 'recovery'
                ? 'Recover ' + rosterLabel(target) + ' · '
                : 'Full health for party. · ') +
                (g.hero.gold < cost
                  ? 'Short on crowns? Tap to queue.'
                  : 'Safe conditions required.'),
        !queued && !!reason,
      );
    }
    function barracksRecoveryActions(refresh, barracksId) {
      return [
        careChoice('recovery', barracksId, refresh),
        careChoice('treatment', barracksId, refresh),
      ];
    }
    function barracksRespawnActions(b, refresh) {
      const g = getGame();
      if (g.s.challenge.succession) return [];
      const selected = g.s.barracksRespawn?.zone === g.zoneId && g.s.barracksRespawn?.id === b.id;
      return [
        action(
          selected ? 'Return death recovery to refuge' : 'Set death recovery point',
          () => {
            if (selected) getGame().clearBarracksRespawn();
            else getGame().setBarracksRespawn(b.id);
            refresh();
          },
          selected
            ? 'Respawn here, or switch back to your refuge.'
            : 'Respawn here after defeat in this region.',
        ),
      ];
    }
    function barracksRecoveryMenu(b, back) {
      const refresh = () => barracksRecoveryMenu(b, back);
      openMenu(
        'Recovery',
        'Treat wounds heals the hero and living companions for 30 crowns. Fallen companions need separate recovery. Short on crowns? Tap to queue.' +
          '\n' +
          (getGame().s.challenge.succession
            ? 'Succession: class loss replaces crown loss.'
            : 'Local death loss: ' + (b.full ? 5 : 15) + '%.') +
          (companionQueueSummary() ? '\n\n' + companionQueueSummary() : ''),
        [...barracksRecoveryActions(refresh, b.id), ...barracksRespawnActions(b, refresh)],
        back,
      );
    }
    function barracksPetDetail(b, family, back) {
      const game = getGame(),
        row = game.petCollection().find((r) => r.boss.id === family);
      if (!row?.def) return back();
      const { boss, def, unit, state } = row,
        reason =
          state === 'Locked' || !unit
            ? game.petRecruitmentReason(family, b.id)
            : state === 'Fallen'
              ? 'This pet has fallen. Recover it at the Barracks first.'
              : unit.active !== false
                ? game.companionRestReason(unit.id)
                : game.companionActivationReason(unit.id, b.id);
      openMenu(
        unit?.customName || def.name,
        'Inspired by ' +
          boss.name +
          ' · ' +
          state +
          '\n' +
          (def.role === 'ranged' ? 'Ranged support.' : 'Close-range support.') +
          '\n' +
          def.specialty,
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
            'Pet skills',
            () => barracksPetSkills(b, family, () => barracksPetDetail(b, family, back)),
            'Automatic attacks and charged skills.',
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
            reason ||
              (!unit
                ? game.activeParty().length < game.barracksFieldCap(b)
                  ? 'Joins your group for free.'
                  : 'Group full. Recruits into reserve; rest a member to make room.'
                : 'Keeps its health while resting.'),
            !!reason,
          ),
        ],
        back,
      );
    }
    function barracksPetSkills(b, family, back) {
      const game = getGame(),
        def = game.petDefinition(family);
      if (!def) return back();
      openMenu(
        'Pet skills',
        'Pets use these skills automatically in combat.',
        [
          action(
            'First · ' + def.first.name,
            () => {},
            'Clear line required · ' + game.petSkillSummary(family, 1),
            true,
          ),
          action(
            'Charged · ' + def.second.name,
            () => {},
            (game.companionSecondSkillUnlocked()
              ? 'Automatic 0.65s charge · '
              : 'Unlock: learn hero Skill 2 from Mira · ') + game.petSkillSummary(family, 2),
            true,
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
          ' unlocked · TRUE victories unlock free pets.\nThey share group slots and need recovery when fallen. Pets cannot work or summon.',
        rows.map(({ boss, def, state, unit }) =>
          action(
            (unit?.customName || def.name) + ' · ' + state,
            () => barracksPetDetail(b, boss.id, returnHere),
            boss.name + ' · ' + def.specialty,
          ),
        ),
        back,
      );
    }
    function recruitmentQueueSummary() {
      const g = getGame(),
        request = g.s.recruitmentRequest;
      if (!request) return '';
      const reason = g.companionRecruitmentReason(request.type, request.barracksId, {
        ignoreFunds: true,
        completeRequest: true,
        zone: request.zone,
      });
      return (
        'Queued recruitment: ' +
        unitLabel(request.type) +
        ' · ' +
        Math.floor(g.hero.gold) +
        '/' +
        g.recruitmentRequestPrice() +
        ' crowns' +
        ' · ' +
        (reason || 'Automatic when eligible; full group → reserve.')
      );
    }
    function recruitmentChoice(type, label, barracksId, reopen) {
      const g = getGame(),
        queued = g.recruitmentRequestMatches(type, barracksId),
        price = barracksId === null ? g.recruitPrice(type) : g.barracksRecruitPrice(type),
        reason = g.companionRecruitmentReason(type, barracksId, {
          ignoreFunds: true,
          replaceRequest: true,
        });
      return action(
        queued
          ? 'Cancel queued ' + label + ' · ' + price + ' crowns'
          : 'Recruit ' + label + ' · ' + price + ' crowns',
        () => {
          getGame().requestCompanionRecruitment(type, barracksId);
          reopen();
        },
        queued
          ? 'Queued · tap to cancel. No crowns spent.'
          : reason ||
              (g.hero.gold < price
                ? 'Short on crowns? Tap to queue.'
                : barracksId === null
                  ? 'Joins your group; full groups send recruits to reserve.'
                  : 'Joins after training; a full active group sends the recruit to reserve.'),
        !queued && !!reason,
      );
    }
    function otherRecruitmentCancellation(barracksId, reopen) {
      const request = getGame().s.recruitmentRequest;
      return request && request.barracksId !== barracksId
        ? [
            action(
              'Cancel queued recruitment',
              () => {
                getGame().cancelRecruitmentRequest();
                reopen();
              },
              recruitmentQueueSummary(),
            ),
          ]
        : [];
    }
    function barracksRecruitmentMenu(b, back) {
      const queueName = b.queue > 0 ? unitLabel(b.queueType || 'soldier') : null;
      const reopen = () => barracksRecruitmentMenu(b, back);
      openMenu(
        'Recruitment',
        (queueName
          ? 'Training ' + queueName + ' · ' + b.queue.toFixed(1) + 's remaining'
          : 'Choose a recruit') +
          '. A full group sends recruits to reserve.\nShort on crowns? Tap to queue.' +
          (companionQueueSummary() ? '\n\n' + companionQueueSummary() : ''),
        [
          ...otherRecruitmentCancellation(b.id, reopen),
          ...[
            ['soldier', 'Soldier'],
            ['archer', 'Ranger'],
          ].map(([type, label]) => recruitmentChoice(type, label, b.id, reopen)),
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
              if (getGame().gather(n.id)) closeMenu();
            },
            getGame().availableGatherers().length
              ? Math.floor(n.amount) +
                  ' crowns remaining · all idle troops · escort along the waypoint'
              : 'An idle gatherer is needed.',
            !getGame().availableGatherers().length,
          ),
        );
      if (getGame().zoneId === 'highlands') {
        for (const n of hidden)
          actions.push(
            action(
              'Search ' + n.siteName,
              () => {
                if (getGame().scoutTribute(n.id, b.id)) closeMenu();
                else barracksLaborMenu(b, back);
              },
              'Escort idle troops here to reveal the tribute.',
              !getGame().availableGatherers().length,
            ),
          );
      } else if (hidden.length)
        actions.push(
          action(
            'Locate & gather hidden Dark Lord Tribute',
            () => {
              const next = getGame().hiddenTributeNodes()[0];
              if (
                next &&
                getGame().scoutTribute() &&
                (!getGame().tributeKnown(next) || getGame().gather(next.id))
              )
                closeMenu();
              else barracksLaborMenu(b, back);
            },
            hidden.length +
              ' undiscovered source' +
              (hidden.length === 1 ? '' : 's') +
              (getGame().zoneId === 'highlands'
                ? ' remain · escort a search party; reveal on arrival'
                : ' remain · locate one and send all idle troops'),
            !getGame().availableGatherers().length,
          ),
        );
      openMenu(
        'Resources & labor',
        'Choose a tribute site, then escort your workers.\nCombat pauses gathering. Deliver their cargo to Town Supplies.',
        actions.length
          ? actions
          : [
              action(
                'No remaining regional tribute',
                () => {},
                'All regional tribute recovered.',
                true,
              ),
            ],
        back,
      );
    }
    // Barracks company navigation remains cheap even when a future class owns
    // many resting monsters. This reads roster snapshots only on menu opening.
    const BARRACKS_ROSTER_PAGE_SIZE = 8;
    function barracksPagedActions(rows, page, makeAction, reopen) {
      const pages = Math.max(1, Math.ceil(rows.length / BARRACKS_ROSTER_PAGE_SIZE)),
        current = Number.isInteger(page) ? Math.max(0, Math.min(pages - 1, page)) : 0,
        from = current * BARRACKS_ROSTER_PAGE_SIZE,
        result = rows.slice(from, from + BARRACKS_ROSTER_PAGE_SIZE).map(makeAction);
      if (pages > 1) {
        if (current > 0)
          result.push(action('Previous page', () => reopen(current - 1)));
        result.push(action('Page', () => {}, (current + 1) + '/' + pages, true));
        if (current < pages - 1)
          result.push(action('Next page', () => reopen(current + 1)));
      }
      return result;
    }
    function barracksCompanionAction(b, u, refresh) {
      // Stable member ID, not array index: an action is revalidated by the
      // authoritative companion operation before changing membership.
      const reason =
        u.active !== false
          ? getGame().companionRestReason(u.id)
          : getGame().companionActivationReason(u.id, b.id);
      return u.active !== false
        ? action(
            'Rest ' + rosterLabel(u),
            () => {
              getGame().restCompanion(u.id);
              refresh();
            },
            reason ||
              (u.hp > 0
                ? 'With you · ' +
                  Math.ceil(u.hp) +
                  '/' +
                  u.maxHp +
                  ' HP · Rest to free a group slot.'
                : 'With you · FALLEN · Rest to free a group slot.'),
            !!reason,
          )
        : action(
            'Add ' + rosterLabel(u) + ' to group',
            () => {
              getGame().activateCompanion(u.id, b.id);
              refresh();
            },
            reason || 'Resting · ' + Math.ceil(u.hp) + '/' + u.maxHp + ' HP',
            !!reason,
          );
    }
    function barracksGroupMenu(b, back, page = 0) {
      const game = getGame(),
        active = game.activeParty().length,
        cap = game.barracksFieldCap(b),
        roster = game.s.party,
        refresh = (next = page) => barracksGroupMenu(b, back, next),
        actions = barracksPagedActions(roster, page, (u) => barracksCompanionAction(b, u, () => refresh()), refresh);
      openMenu(
        'Manage group',
        'With you ' +
          active +
          '/' +
          cap +
          ' · Employed ' +
          game.rosterCount() +
          ' · Rest a companion to free a slot. ' +
          (!b.full && (game.s.expeditionRank || 1) >= 4
            ? 'Basic cap: 3. Upgrade for larger groups.'
            : ''),
        actions.length ? actions : [action('No companions employed', () => {}, '', true)],
        back,
      );
    }
    // This type-first path is dormant until authenticated Charm provenance exists.
    // The stable typeId is a future capture/save contract; unknown provenance
    // must NOT cause unrelated subtypes to be grouped together.
    function charmedTypeId(u) {
      if (!u?.charmOrigin || typeof u.charmOrigin !== 'object') return '';
      return typeof u.charmOrigin.typeId === 'string' && u.charmOrigin.typeId
        ? u.charmOrigin.typeId
        : 'unclassified:' + u.id;
    }
    function charmedTypeName(u) {
      const data = u.charmOrigin,
        name = data?.typeName || data?.displayName || data?.typeId || '';
      return typeof name === 'string' && name.trim()
        ? name.trim()
        : 'Charmed creature';
    }
    function charmedStatus(u) {
      if (u.expeditionId) return 'Away';
      if (u.hp <= 0) return 'Fallen';
      return u.active === false ? 'Resting' : 'Active';
    }
    function barracksCharmedTypeMenu(b, typeId, back, page = 0, view = 'All') {
      const game = getGame(),
        owned = game.s.party.filter((u) => charmedTypeId(u) === typeId),
        roster = owned.filter((u) => view === 'All' || charmedStatus(u) === view),
        label = owned.length ? charmedTypeName(owned[0]) : 'Charmed creature',
        refresh = (next = page, nextView = view) =>
          barracksCharmedTypeMenu(b, typeId, back, next, nextView),
        actions = barracksPagedActions(roster, page, (u) => {
          const result = barracksCompanionAction(b, u, () => refresh());
          return { ...result, detail: charmedStatus(u) + ' · ' + result.detail };
        }, refresh),
        views = ['All', 'Active', 'Resting', 'Fallen', 'Away'];
      actions.push(action(
        'Filter: ' + view,
        () => refresh(0, views[(views.indexOf(view) + 1) % views.length]),
        'Cycle All, Active, Resting, Fallen and Away.',
      ));
      openMenu(
        'Charmed monsters',
        label +
          ' · ' +
          owned.length +
          ' owned · With you ' +
          owned.filter((u) => u.active !== false).length +
          ' · Resting ' +
          owned.filter((u) => charmedStatus(u) === 'Resting').length +
          ' · Fallen ' +
          owned.filter((u) => charmedStatus(u) === 'Fallen').length +
          ' · Away ' +
          owned.filter((u) => charmedStatus(u) === 'Away').length +
          ' · Local group cap ' +
          game.barracksFieldCap(b),
        actions,
        back,
      );
    }
    function barracksCharmedMenu(b, back, page = 0) {
      const game = getGame(),
        grouped = new Map();
      for (const u of game.s.party) {
        const key = charmedTypeId(u);
        if (!key) continue;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(u);
      }
      const groups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)),
        refresh = (next = page) => barracksCharmedMenu(b, back, next),
        actions = barracksPagedActions(groups, page, ([key, units]) => {
          const active = units.filter((u) => u.active !== false).length,
            fallen = units.filter((u) => u.hp <= 0).length,
            owned = units.length,
            limit = game.hero.class === 'rogue' ? game.expeditionPartyCap() : null;
          return action(
            charmedTypeName(units[0]) + ' · ' + owned + (limit ? '/' + limit : '') + ' owned',
            () => barracksCharmedTypeMenu(b, key, () => barracksCharmedMenu(b, back, page)),
            'With you ' + active + ' · Resting ' +
              units.filter((u) => charmedStatus(u) === 'Resting').length +
              ' · Fallen ' + fallen +
              ' · Away ' + units.filter((u) => charmedStatus(u) === 'Away').length,
          );
        }, refresh);
      openMenu(
        'Charmed monsters',
        groups.length +
          ' types · ' +
          game.s.party.filter((u) => !!charmedTypeId(u)).length +
          ' owned · Basic Barracks manages up to 3 active members; Full Barracks uses Expedition capacity. Owned reserves are not Barracks storage slots.',
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
    function barracksNamesMenu(b, back, page = 0) {
      const game = getGame(),
        returnHere = (next = page) => barracksNamesMenu(b, back, next),
        actions = barracksPagedActions(game.s.party, page, (u) =>
          action(
            rosterLabel(u),
            () => nameCompanion(u.id, () => returnHere()),
            (u.charmOrigin
              ? charmedTypeName(u)
              : u.type === 'pet'
                ? game.petDefinition(u)?.name || 'Boss pet'
                : unitLabel(u.type)) +
              (u.customName ? ' · Permanent name chosen' : ' · Name available'),
            !!u.customName,
          ), returnHere);
      openMenu(
        'Name companions',
        'Choose a name once. You can skip and return later.',
        actions.length ? actions : [action('No companions employed', () => {}, '', true)],
        back,
      );
    }
    function barracksCompanyMenu(b, back) {
      const returnHere = () => barracksCompanyMenu(b, back),
        game = getGame(),
        rank = game.s.expeditionRank || 1,
        active = game.activeParty().length,
        cap = game.barracksFieldCap(b),
        company = game.s.party,
        charmed = company.filter((u) => !!charmedTypeId(u));
      openMenu(
        'Company',
        'With you ' + active + '/' + cap +
          ' · Resting ' + company.filter((u) => charmedStatus(u) === 'Resting').length +
          ' · Fallen ' + company.filter((u) => charmedStatus(u) === 'Fallen').length +
          ' · Away ' + company.filter((u) => charmedStatus(u) === 'Away').length +
          (charmed.length
            ? ' · Charmed ' + new Set(charmed.map(charmedTypeId)).size +
              ' types / ' + charmed.length + ' owned'
            : '') + '. Choose who travels with you.',
        [
          action(
            'Boss pet collection',
            () => barracksPetMenu(b, returnHere),
            'Defeat TRUE bosses to unlock pets.',
          ),
          action(
            'Manage active group',
            () => barracksGroupMenu(b, returnHere),
            'With you ' + active + '/' + cap + ' · employed ' + getGame().rosterCount(),
          ),
          ...(getGame().s.party.some((u) => !!charmedTypeId(u))
            ? [
                action(
                  'Charmed monsters',
                  () => barracksCharmedMenu(b, returnHere),
                  'Browse owned monster types and change their active status.',
                ),
              ]
            : []),
          action(
            'Name companions',
            () => barracksNamesMenu(b, returnHere),
            'Optional · chosen once.',
          ),
          ...(getGame().hero.class === 'rogue'
            ? []
            : [
                rank >= 2
                  ? action(
                      'Recruit companions',
                      () => barracksRecruitmentMenu(b, returnHere),
                      'Soldier ' +
                        getGame().barracksRecruitPrice('soldier') +
                        ' crowns · Ranger ' +
                        getGame().barracksRecruitPrice('archer') +
                        ' crowns',
                    )
                  : action(
                      'Recruitment — Expedition 2',
                      () => {},
                      'Rescue Mira and train Expedition to Rank 2',
                      true,
                    ),
              ]),
        ],
        back,
      );
    }
    function barracksGatherAction(b, back) {
      const unlocked = (getGame().s.expeditionRank || 1) >= 2;
      if (getGame().zoneId === 'highlands' && b.kind === 'supplier')
        return action(
          'Gather resources',
          () =>
            openMenu(
              'Hidden Highlands tribute',
              'Crag Tyrant took precautions and hid the region’s Dark Lord Tribute among its stores. No one in town knows where he put it. This supply post can receive recovered cargo, but it has no facilities to organize a search. Use a completed Barracks to send workers to investigate the Highlands, and escort them to the sites.',
              [],
              back,
            ),
          'Ask about the regional tribute and search facilities.',
        );
      return action(
        'Gather resources',
        () => barracksLaborMenu(b, back),
        unlocked
          ? 'Choose tribute for idle companions to gather'
          : 'Rescue Mira and train Expedition to Rank 2',
        !unlocked,
      );
    }
    function resourceExpeditionWorkers(b, region, back) {
      const game = getGame(),
        workers = game.s.party.filter((u) => game.canGatherTribute(u));
      openMenu(
        'Choose expedition companion',
        'One available companion goes away for ' +
          Math.round(game.resourceExpeditionDuration() / 60) +
          ' minutes of active play. Reserves can go. Tribute is delivered automatically on return.',
        workers.length
          ? workers.map((u) => {
              const reason = game.resourceExpeditionWorkerReason(u);
              return action(
                rosterLabel(u) + (u.active === false ? ' · Reserve' : ' · Active'),
                () => {
                  if (getGame().startResourceExpedition(b.id, region, u.id))
                    resourceExpeditionsMenu(b, back);
                },
                reason || 'Send this companion · no fee',
                !!reason,
              );
            })
          : [
              action(
                'No resource companion available',
                () => {},
                'Recruit a worker at the Barracks.',
                true,
              ),
            ],
        back,
      );
    }
    function resourceExpeditionsMenu(b, back) {
      const game = getGame(),
        regions = game.resourceExpeditionRegions(),
        returnHere = () => resourceExpeditionsMenu(b, back);
      openMenu(
        'Resource expeditions',
        'Recover leftover tribute from earlier regions after every local specialist is rescued. Choose one companion; continue playing while they work.',
        regions.length
          ? regions.map((row) => {
              if (row.mission)
                return action(
                  row.region.name + ' · Expedition underway',
                  () => {},
                  Math.ceil(Math.max(0, row.mission.finishAt - game.s.time)) +
                    's remaining · companion returns automatically',
                  true,
                );
              const reason = game.resourceExpeditionReason(b.id, row.region.id);
              return action(
                row.region.name,
                () => resourceExpeditionWorkers(b, row.region.id, returnHere),
                reason ||
                  Math.floor(row.remaining) + ' crowns remaining · includes undiscovered tribute',
                !!reason,
              );
            })
          : [
              action(
                'No earlier regions',
                () => {},
                'Visit a later region to send a recovery expedition back.',
                true,
              ),
            ],
        back,
      );
    }
    function barracksOperationsMenu(b, back) {
      const returnHere = () => barracksOperationsMenu(b, back);
      openMenu(
        'Operations',
        'Quests and resource gathering.',
        [
          action('Local objectives', () => quests(true, returnHere)),
          barracksGatherAction(b, returnHere),
          ...(b.full
            ? [
                action(
                  'Resource expeditions',
                  () => resourceExpeditionsMenu(b, returnHere),
                  'Send a companion to recover leftover tribute from earlier cleared regions',
                ),
              ]
            : []),
        ],
        back,
      );
    }
    function barracksTrainingMenu(b, back) {
      const returnHere = () => barracksTrainingMenu(b, back);
      openMenu(
        'Training',
        'Rescue specialists to unlock skills and larger groups.',
        [
          expeditionBarracksAction(b, returnHere, returnHere),
          action('Rescued specialists', () => barracksSpecialistMenu(b, returnHere)),
          action('Skill journal', () => skillBook(returnHere)),
        ],
        back,
      );
    }
    function expeditionBarracksAction(b, back, refresh = () => barracksMenu(b, back)) {
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
            refresh();
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
          'Keep watch while a companion builds. Recall pauses work; progress is kept.',
          assigned
            ? [
                action(
                  'Construction in progress',
                  () => {},
                  'Progress ' + Math.floor(b.progress) + '/4',
                  true,
                ),
              ]
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
        tonic = barracksTonicAction(b, back),
        // Both completed Barracks types share one service hierarchy.
        // Full-only services remain discoverable in their matching category.
        services = [
          action('Company', () => barracksCompanyMenu(b, returnHere), 'Group, recruits and pets.'),
          action(
            'Recovery',
            () => barracksRecoveryMenu(b, returnHere),
            'Treat party wounds or recover fallen companions.',
          ),
          action(
            'Training',
            () => barracksTrainingMenu(b, returnHere),
            'Skills and rescued specialists.',
          ),
          action(
            'Operations',
            () => barracksOperationsMenu(b, returnHere),
            'Quests and resources.',
          ),
          ...(tonic ? [tonic] : []),
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
        ];
      if (!b.full) {
        const upgrading = getGame()
            .activeLivingParty()
            .some((u) => u.order?.type === 'upgrade' && u.order.id === b.id),
          canUpgrade = rank >= 4,
          upgrade = canUpgrade
            ? upgrading
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
                  'Larger active groups and a supply deposit.',
                  !getGame().availableLabor().length ||
                    (!b.upgradePaid && getGame().hero.gold < getGame().barracksUpgradeCost()),
                )
            : action(
                'Full Barracks — Expedition 4',
                () => {},
                'Larger active groups and a supply deposit.',
                true,
              );
        openMenu(
          'Basic Barracks',
          'Your field base. Recovery → Treat wounds heals your party for 30 crowns.',
          [...services, upgrade],
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
        services,
        back,
      );
    }
    function inventory(back = closeMenu, fromCharacter = false) {
      const g = getGame(),
        healers = g.healCompanionCasters(),
        rangers = g.activeLivingParty().filter((u) => u.type === 'archer' && !u.charmOrigin),
        support = healers.length
          ? healers.length +
            ' active healer(s) · Heal ' +
            g.rangerSupportAmount('health') +
            ' HP.\nUse the Heal button. During cooldown, tap to queue hero healing. Automatic healing stays active.' +
            (Campaign.rules.resourceMode.manaEnabled && rangers.length
              ? '\nMana Recovery ' + g.rangerSupportAmount('mana') + ' MP.'
              : '')
          : 'Field Heal requires an active Ranger, Charmed ranged monster or ally-healing pet.',
        tonics =
          'Stored: ' +
          g.preparationTonicStock() +
          '\n' +
          (g.hero.tonic
            ? 'ACTIVE · +10% maximum HP until rest or defeat.'
            : '+10% maximum HP until rest or defeat. Use at a completed Barracks.') +
          (!g.s.rescued.archive ? '\nRescue Neri to buy tonics.' : '');
      openMenu(
        'Inventory',
        {
          summary: 'Crowns ' + Math.floor(g.hero.gold),
          sections: [
            { title: 'Ranger support', text: support },
            { title: 'Preparation Tonics', text: tonics },
          ],
        },
        [
          action(
            'Equipment',
            () => inventoryEquipment(() => inventory(back, fromCharacter)),
            'Weapons, armor and reforges.',
          ),
          ...(openCharacter && !fromCharacter
            ? [action('Character and identity', openCharacter)]
            : []),
        ],
        back,
      );
    }
    function inventoryEquipment(back) {
      const hero = getGame().hero,
        equipped =
          (hero.customWeaponName ? hero.customWeaponName + ' · ' : '') +
          (hero.legacyEquipped ? hero.legacyWeaponName : 'tier ' + hero.weapon);
      openMenu(
        'Equipment',
        'Equipped weapon: ' +
          equipped +
          '\nEquipped armor: ' +
          (hero.customArmorName || 'tier ' + hero.armorTier) +
          '\nWeapon reforge: ' +
          (hero.reforges['weapon:' + hero.weapon]
            ? hero.legacyEquipped
              ? 'owned (inactive while legacy weapon equipped)'
              : 'active'
            : 'none') +
          ' · Armor reforge: ' +
          (hero.reforges['armor:' + hero.armorTier] ? 'active' : 'none'),
        [
          ...Object.keys(Campaign.legacyWeapons)
            .filter((name) => getGame().s.legacyInventory?.includes(name))
            .map((name) =>
              action(
                'Equip ' + name,
                () => {
                  if (getGame().equipLegacy(name)) status(name + ' equipped.');
                  inventoryEquipment(back);
                },
                'Saved weapon · +' + Campaign.legacyWeapons[name] + ' power',
              ),
            ),
          ...(getGame().hero.weapon
            ? [
                action('Equip current weapon tier ' + getGame().hero.weapon, () => {
                  if (getGame().equipTierWeapon())
                    status('Weapon tier ' + getGame().hero.weapon + ' equipped.');
                  inventoryEquipment(back);
                }),
              ]
            : []),
        ],
        back,
      );
    }
    function companionBasics(back = closeMenu) {
      getGame().briefCompanions();
      const practiced = !!getGame().s.quests['quest-barracks']?.recallPracticed;
      openMenu(
        'Meet your company',
        practiced
          ? 'Recalled!\nOrders cancelled. Companions stay close and defend without chasing.\nGive a new order to send them out again.\n\nNext: build your first Barracks for FREE.'
          : 'Soldier: close combat.\nRanger: ranged attacks + healing.\nThey follow and fight automatically.\n\nRecall brings them back to you.',
        [
          ...(practiced
            ? [
                action('Continue', () => {
                  if (getGame().hasAnyBarracks()) closeMenu();
                  else {
                    getGame().briefBarracks();
                    barracksBasics(back);
                  }
                }),
              ]
            : []),
          action('Practice Recall squad', () => practiceRecall(() => companionBasics(back))),
        ],
        back,
      );
    }
    function barracksBasics(back = closeMenu) {
      openMenu(
        'Meet your company',
        'Leave town. Find open ground off the road.\nOpen Menu → Establish Basic Barracks (FREE).\nOne idle Soldier or Ranger builds it.\nOnce built: Treat wounds fully heals your party for 30 crowns when safe.',
        [action("Let's go", closeMenu)],
        back,
      );
    }
    function townRecruitmentMenu(back) {
      const reopen = () => townRecruitmentMenu(back);
      if (getGame().hero.class === 'rogue') {
        openMenu(
          getGame().definition().town + ' Captain',
          'Rogues do not hire Soldiers or Rangers. Charm eligible monsters in battle. The Captain can treat party wounds for 30 crowns or recover fallen companions.',
          [
            ...otherRecruitmentCancellation(null, reopen),
            careChoice('recovery', null, reopen),
            careChoice('treatment', null, reopen),
          ],
          back,
        );
        return;
      }
      const recruitmentLocked =
        (getGame().s.expeditionRank || 1) < 2 || getGame().rosterCount() >= 3;
      const actions = [
        action('Companion basics', () => companionBasics(reopen), 'Roles and Recall.'),
        ...((getGame().s.expeditionRank || 1) < 2
          ? [
              action(
                'Recruitment — Expedition 2 required',
                () => {},
                'Rescue Mira and train Expedition to Rank 2',
                true,
              ),
            ]
          : getGame().rosterCount() >= 3
            ? [
                action(
                  'Recruit at a Barracks',
                  () => {},
                  'Town limit: 3 companions, reserves included.',
                  true,
                ),
              ]
            : []),
        ...otherRecruitmentCancellation(null, reopen),
        ...[
          ['soldier', 'Soldier'],
          ['archer', 'Ranger'],
        ]
          .filter(([type]) => !recruitmentLocked || getGame().recruitmentRequestMatches(type, null))
          .map(([type, label]) => recruitmentChoice(type, label, null, reopen)),
        careChoice('recovery', null, reopen),
        careChoice('treatment', null, reopen),
      ];
      openMenu(
        getGame().definition().town + ' Captain',
        'Recruit companions, treat party wounds for 30 crowns, or recover the fallen.\nShort on crowns? Tap an available service to queue it.' +
          (companionQueueSummary() ? '\n\n' + companionQueueSummary() : ''),
        actions,
        back,
      );
    }
    function partyMenu(back = closeMenu) {
      const g = getGame(),
        tutorial = g.s.quests['quest-barracks'];
      if (g.hero.class === 'rogue') {
        // The conventional starter-Soldier tutorial is false for a hero
        // whose company begins empty; Charm onboarding is authored later.
        g.briefCompanions();
        townRecruitmentMenu(back);
      } else if (tutorial && !tutorial.paid && !tutorial.captainBriefed && (g.s.expeditionRank || 1) === 1)
        companionBasics(back);
      else {
        g.briefCompanions();
        townRecruitmentMenu(back);
      }
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

    // Share the live story objectives between the journal and local quest board.
    function storyJournal(
      back = closeMenu,
      present = (summary, options) => openMenu('Story journal', summary, options, back),
    ) {
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

    function announcements(back = closeMenu) {
      const game = getGame(),
        entries = game.storyReadings();
      openMenu(
        'Announcements',
        'Read unlocked stories and notices.',
        [...entries]
          .reverse()
          .map((n) =>
            action(
              (D.regions.find((r) => r.id === n.region)?.name || 'Adventure') +
                ' · ' +
                n.text.slice(0, 64),
              () =>
                openMenu('Announcements', n.text + (n.detail ? '\n\n' + n.detail : ''), [], () =>
                  announcements(back),
                ),
            ),
          ),
        back,
      );
    }
    function quests(atBoard, back = closeMenu, completed = false, sideQuests = false) {
      if (!completed && !sideQuests) {
        const returnHere = () => quests(atBoard, back);
        storyJournal(back, (summary, objectives) => {
          const g = getGame(),
            tutorial = g
              .questDefs()
              .find(
                (q) => q.tutorial && !g.s.quests[q.id]?.paid && !g.s.quests[q.id]?.closedByPeace,
              );
          openMenu(
            atBoard ? 'Quest board' : 'Quest journal',
            summary + '\nTap an objective to track it.',
            [
              ...(tutorial
                ? [
                    action(
                      tutorial.name + ' · ACTIVE',
                      () => {
                        const destination = getGame().questDestination(tutorial.id);
                        if (destination) storyNavigate(destination, tutorial.name, tutorial.id);
                        else status(getGame().questProgress(tutorial));
                      },
                      getGame().questProgress(tutorial),
                    ),
                  ]
                : []),
              ...objectives,
              action(
                'Side Quests',
                () => quests(atBoard, returnHere, false, true),
                'Optional tasks, exploration and extra rewards.',
              ),
              action('Completed quests', () => quests(atBoard, returnHere, true, true)),
              ...(!atBoard ? [action('Announcements', () => announcements(returnHere))] : []),
            ],
            back,
          );
        });
        return;
      }
      const game = getGame(),
        returnHere = () => quests(atBoard, back, completed, sideQuests),
        local = game
          .questDefs()
          .filter(
            (q) =>
              (!atBoard || q.region === game.definition().id) &&
              (completed || !q.tutorial) &&
              (completed
                ? game.s.quests[q.id]?.paid || game.s.quests[q.id]?.closedByPeace
                : !game.s.quests[q.id]?.paid && !game.s.quests[q.id]?.closedByPeace),
          );
      openMenu(
        completed ? 'Completed quests' : 'Side Quests',
        completed
          ? 'Finished quests and rewards.'
          : 'Tap a quest to track it. Rewards arrive automatically.',
        [
          ...local.map((q) =>
            action(
              q.name + (completed ? ' · Complete' : ' · ACTIVE'),
              () => {
                const destination = getGame().questDestination(q.id);
                if (destination) storyNavigate(destination, q.name, q.id);
                else
                  status(
                    q.kind === 'barracks'
                      ? getGame().questProgress(q)
                      : 'No destination is currently available. ' + q.objective,
                  );
              },
              q.objective +
                ' · ' +
                (q.tutorial ? 'Tutorial' : q.gold + ' crowns / ' + q.xp + ' XP') +
                ' · ' +
                game.questProgress(q),
              completed,
            ),
          ),
          ...(!local.length
            ? [action(completed ? 'No completed quests' : 'No pending quests', () => {}, '', true)]
            : []),
          ...(atBoard && !completed
            ? [action('All side quests', () => quests(false, returnHere, false, true))]
            : []),
          ...(!completed
            ? [action('Completed quests', () => quests(atBoard, returnHere, true, true))]
            : []),
        ],
        back,
      );
    }
    return {
      refugeIntro,
      dungeonEntranceMenu,
      transport,
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
      announcements,
    };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeMenus = api;
})(typeof window !== 'undefined' ? window : globalThis);
