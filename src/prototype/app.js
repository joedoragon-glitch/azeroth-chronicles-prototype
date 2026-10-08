/* Browser shell. Saved campaign rules are independent of this UI. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    canvas = $('world'),
    ctx = canvas.getContext('2d'),
    D = Campaign.data;
  const persistence = PrototypePersistence.create({ storage: localStorage, Campaign, status });
  let profile = {
      nightmareUnlocked: false,
      activeMode: 'normal',
      audio: { ...PrototypeAudio.defaults },
    },
    game,
    menu = null,
    menuIndex = 0,
    buttons = [],
    keys = {},
    joy = { x: 0, y: 0 },
    last = performance.now(),
    saveTimer = 0,
    hudTimer = 0,
    focused = true,
    paused = false,
    charge = null,
    footstepTimer = 0,
    gateDismissed = false,
    criticalNoticeSeen = null,
    criticalNoticeUntil = 0,
    statusUntil = 0,
    worldPointer = null,
    pointer = null;
  profile = persistence.loadProfile(profile);
  const audio = new PrototypeAudio(profile.audio);
  const platform = PrototypePlatform.init(window);
  const input = PrototypeInput.create(localStorage, status);
  let bindingCapture = null;
  document.body.setAttribute('data-phone-layout', input.preferences.phoneLayout);
  let appRegistration = null,
    appUpdateReady = false,
    appReloadRequested = false,
    installPrompt = null,
    appControllerReloaded = false;
  const hadServiceWorkerController = !!navigator.serviceWorker?.controller;
  async function updateApp() {
    if (!appRegistration) return;
    if (!save()) return;
    paused = true;
    clearInput();
    audio.setPaused(true);
    status('Checking for a game update…');
    try {
      await appRegistration.update();
      const worker = appRegistration.installing;
      if (worker && worker.state !== 'installed' && worker.state !== 'activated')
        await new Promise((resolve) => {
          const done = () => {
              worker.removeEventListener('statechange', check);
              clearTimeout(timer);
              resolve();
            },
            check = () => {
              if (
                worker.state === 'installed' ||
                worker.state === 'activated' ||
                worker.state === 'redundant'
              )
                done();
            },
            timer = setTimeout(done, 15000);
          worker.addEventListener('statechange', check);
          check();
        });
      if (appRegistration.waiting) {
        appReloadRequested = true;
        appRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        paused = false;
        audio.setPaused(false);
        status('No update waiting. Check again shortly.');
      }
    } catch (_) {
      paused = false;
      audio.setPaused(false);
      status('Update unavailable. Your saved run is safe.');
    }
  }
  function runningAsApp() {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true
    );
  }
  function installInstructions() {
    openMenu(
      'Install on phone',
      'Install once, then Azeroth Chronicles launches from the home screen like an app and keeps its offline cache on that device.\n\nAndroid / Chrome: use the Install button when available. If Chrome does not offer it, open the browser menu and choose Install app or Add to Home screen.\n\niPhone / iPad: open the game in Safari, tap Share, choose Add to Home Screen, then Add.',
      installPrompt
        ? [action('Install Azeroth Chronicles', installApp, 'Open the phone installation prompt')]
        : [],
      systemMenu,
    );
  }
  async function installApp() {
    if (runningAsApp()) {
      status('Azeroth Chronicles is already running as an installed app.');
      closeMenu();
      return;
    }
    if (!installPrompt) {
      installInstructions();
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        status('Azeroth Chronicles installed. Open it from your home screen.');
        closeMenu();
      } else installInstructions();
    } catch (_) {
      installInstructions();
    }
  }
  function status(text) {
    if (text === 'Saved locally · export for a backup') return;
    $('status').textContent = text;
    statusUntil = performance.now() + 5000;
  }
  function persistProfile() {
    return persistence.saveProfile(profile);
  }
  function save() {
    return persistence.save(game, profile);
  }
  function load(mode) {
    const restored = persistence.load(mode);
    if (!restored) return false;
    game = restored;
    return true;
  }
  let loaded = load(profile.activeMode);
  if (!loaded) {
    game = persistence.migrateLegacy();
    if (game) {
      loaded = true;
      save();
    } else game = new Campaign();
  }
  let started = loaded;
  const viewport = { width: innerWidth, height: innerHeight };
  const renderer = PrototypeRenderer.create({
    canvas: viewport,
    ctx,
    getGame: () => game,
    platform,
    chargePresentation,
    isPaused: () => paused || !focused || document.hidden,
    Campaign,
    PrototypeVisuals,
    PrototypeCombatVisuals,
    PrototypeSprites: typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites,
  });
  const { world } = renderer,
    worldLabelVisible = renderer.labelVisible;
  const runtime = PrototypeRuntime.create();

  window.Prototype = {
    get game() {
      return game;
    },
    audio,
    renderer,
    platform,
    runtime,
    input,
    save,
    openMenu,
    closeMenu,
    updateHUD,
    labelVisible: worldLabelVisible,
    chargePresentation,
    get profile() {
      return profile;
    },
    get paused() {
      return paused || !!menu || !focused || document.hidden;
    },
  };
  function resize() {
    viewport.width = innerWidth;
    viewport.height = innerHeight;
    const ratio = Math.max(
      1,
      Math.min(
        window.devicePixelRatio || 1,
        platform.mode === 'phone' ? 1.5 : 2,
        Math.sqrt(3000000 / (innerWidth * innerHeight)),
      ),
    );
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize();
  addEventListener('resize', resize);
  function activePlay() {
    return (
      started &&
      !paused &&
      !menu &&
      focused &&
      !document.hidden &&
      !game.s.challenge.pending &&
      !game.s.challenge.gameOver
    );
  }
  function help(back = closeMenu) {
    openMenu(
      'Controls',
      input.actions.map(([id, name]) => input.key(id) + ' — ' + name).join('\n') +
        '\n\nEsc — Menu / back · Enter or Space — Confirm in menus\nMouse or touch — Activate menus and HUD buttons\nSkills 1–3: tap under 0.20 s for normal; hold 0.65 s for charged. Releasing an incomplete hold cancels.\nCharged Skills 1 / 2 / 3 cost 20% / 30% / 35% max MP respectively. Hold through a cooldown to queue the charge; WAIT shows until charging can begin.\nCHARGED means ready to release. NEED MP / NO TARGET / NO HEAL explain a blocked charge. Skills 1–2 lock their target when charging begins.\nNormal Skill 1 builds a same-target combo across three hits; the third adds frontal splash. Switching targets or waiting four seconds resets it.\nSquad doctrine becomes available at Expedition 3 during combat and resets for each encounter.\nMovement autoattack stays active, except while holding Skill 1.\nTouch: use the joystick or tap a reachable place to move when enabled. Keyboard or joystick movement cancels a destination.\nMouse: left click commands Ranger Heal unless click-to-move is enabled; right click commands Mana Recovery. HUD recovery buttons always work.\nSprint remains unavailable.',
      [
        action('Customize keyboard', () => keyboardMenu(back)),
        action('Touch and mouse options', () => pointerMenu(back)),
      ],
      back,
    );
  }
  function keyboardMenu(back = systemMenu) {
    bindingCapture = null;
    openMenu(
      'Customize keyboard',
      'Select an action, then press its new key. Esc cancels. Duplicate keys are rejected. Browser shortcuts remain available.',
      [
        ...input.actions.map(([id, name]) =>
          action(name + ' · ' + input.key(id), () => {
            openMenu('Bind ' + name, 'Press a new key for ' + name + '. Esc cancels.', [], () =>
              keyboardMenu(back),
            );
            bindingCapture = id;
          }),
        ),
        action('Restore default keys', () => {
          input.resetBindings();
          clearInput();
          updateHUD();
          keyboardMenu(back);
        }),
      ],
      () => help(back),
    );
  }
  function pointerMenu(back = systemMenu) {
    const p = input.preferences;
    const select = (name, value) => {
      input.select(name, value);
      document.body.setAttribute('data-phone-layout', input.preferences.phoneLayout);
      clearInput();
      runtime.reset();
      updateHUD();
      pointerMenu(back);
    };
    openMenu(
      'Touch and mouse options',
      'Use the controls that feel comfortable. Menus always accept direct clicks and taps. Movement inputs work alongside the keyboard and joystick.',
      [
        action(
          'Phone layout · ' + (p.phoneLayout === 'two-thumb' ? 'Two thumbs' : 'Left hand'),
          () => select('phoneLayout', p.phoneLayout === 'two-thumb' ? 'left-hand' : 'two-thumb'),
          'Two thumbs: movement left, skills right. Left hand: skills above the joystick.',
        ),
        action(
          'Touch tap-to-move · ' + (p.touchMove ? 'ON' : 'OFF'),
          () => select('touchMove', !p.touchMove),
          'Applies to phones, tablets and touchscreen browsers. Tap a reachable place in the world.',
        ),
        action(
          'Mouse click-to-move · ' + (p.mouseMove ? 'ON' : 'OFF'),
          () => select('mouseMove', !p.mouseMove),
          'When off, left click in the world commands Ranger Heal. Right click commands Mana Recovery.',
        ),
      ],
      () => help(back),
    );
  }
  function cancelTravel() {
    worldPointer = null;
    if (game) {
      game.hero.order = null;
      game.hero.path = [];
    }
  }
  function clearInput() {
    if (typeof Sprint !== 'undefined') Sprint.release();
    cancelCharge();
    keys = {};
    pointer = null;
    cancelTravel();
    joy = { x: 0, y: 0 };
    $('stick').style.transform = '';
  }
  function action(label, fn, detail = '', disabled = false) {
    return { label, action: fn, detail, disabled };
  }
  function openMenu(title, description = '', actions = [], back = closeMenu) {
    bindingCapture = null;
    clearInput();
    gateDismissed = false;
    menu = { title, description, actions, back };
    menuIndex = 0;
    document.body.classList.add('menu-open');
    $('modal').hidden = false;
    $('modal-title').textContent = title;
    $('modal-description').textContent = description;
    renderActions();
  }
  function renderActions() {
    const host = $('modal-actions');
    host.replaceChildren();
    buttons = [];
    for (const a of menu.actions) {
      const b = document.createElement('button');
      b.textContent = a.label;
      b.disabled = a.disabled === true;
      if (a.detail) {
        const span = document.createElement('span');
        span.className = 'detail';
        span.textContent = a.detail;
        b.append(span);
      }
      b.onclick = (e) => {
        audio.unlock();
        a.action();
        if (started) save();
        updateHUD();
      };
      host.append(b);
      buttons.push(b);
    }
    const back = $('close-button');
    back.hidden = false;
    back.innerHTML = 'Back <small>' + input.key('confirm') + ' / Esc</small>';
    buttons.push(back);
    highlight();
  }
  function highlight() {
    buttons.forEach((b, i) => b.classList.toggle('selected', i === menuIndex));
    buttons[menuIndex]?.scrollIntoView({ block: 'nearest' });
  }
  function closeMenu() {
    bindingCapture = null;
    if (game.s.challenge.pending || game.s.challenge.gameOver) gateDismissed = true;
    menu = null;
    $('modal').hidden = true;
    document.body.classList.remove('menu-open');
    clearInput();
  }
  $('close-button').onclick = () => {
    audio.unlock();
    if (!game.s.endingAck && game.peace) {
      game.s.endingAck = true;
      save();
    }
    menu?.back();
  };
  function exportJSON(data, name) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function start(mode, heroClass, succession) {
    if (mode === 'nightmare' && !profile.nightmareUnlocked) return;
    game = new Campaign(mode, heroClass, Math.random, { succession });
    started = true;
    if (typeof Sprint !== 'undefined') Sprint.reset();
    paused = false;
    profile.activeMode = mode;
    save();
    closeMenu();
    updateHUD();
  }
  function chooseClass(mode, succession) {
    if (succession === undefined) {
      openMenu(
        'Challenge condition',
        'The Dark Lord rules the land. To keep heroes from becoming strong enough to challenge him, his forces have captured the specialists who teach skills, forge equipment and prepare adventurers. Free them, rebuild your strength and confront his rule.\n\nSuccession is optional. Each fallen class is lost for this run; after three class deaths the run ends.',
        [
          action('Standard death and refuge recovery', () => chooseClass(mode, false)),
          action('Succession challenge', () => chooseClass(mode, true)),
        ],
      );
      return;
    }
    openMenu(
      'New ' + (mode === 'nightmare' ? 'Nightmare' : 'Normal') + ' adventure',
      'Choose the hero who will begin the resistance. You start with one skill; rescuing the captured specialists unlocks the training and equipment needed to face the Dark Lord.',
      Object.entries(Campaign.classes).map(([id, c]) =>
        action(
          c.icon + ' ' + id,
          () => {
            const exists = persistence.exists(mode);
            if (
              exists &&
              !confirm('Replace the existing ' + mode + ' run? Export it first to keep it.')
            )
              return;
            start(mode, id, succession);
          },
          id === 'paladin'
            ? 'Melee, healing and brief immunity'
            : id === 'mage'
              ? 'Ranged magic, mana recovery and barriers'
              : 'Ranged bow, healing and mobility',
        ),
      ),
      () => chooseClass(mode),
    );
  }
  function awakeningChecklist() {
    return Campaign.dungeonIds.map((id) => {
      const b = game.boss(id),
        region = D.regions.find((r) => r.id === b.region);
      return {
        id,
        label: (game.s.true[id] ? '✓ ' : game.s.normal[id] ? '⚔ ' : '◇ ') + b.name,
        detail:
          (game.s.true[id]
            ? 'TRUE defeated'
            : game.s.normal[id]
              ? 'TRUE awakened — return and challenge it'
              : 'Normal boss still alive — defeat it to awaken TRUE') +
          ' · ' +
          region.name,
      };
    });
  }
  function finaleMenu(back = openMain) {
    const done = Campaign.dungeonIds.filter((id) => game.s.true[id]).length;
    openMenu(
      'Awakening · Final objective',
      'The TRUE Dark Lord is gone forever. Defeat every remaining TRUE dungeon guardian to end the war.\n\nProgress: ' +
        done +
        '/5 TRUE guardians defeated.',
      awakeningChecklist().map((x) => action(x.label, () => {}, x.detail, true)),
      back,
    );
  }
  function acknowledgeAwakening() {
    game.s.awakeningAck = true;
    save();
    closeMenu();
  }
  function awakeningMenu() {
    const done = Campaign.dungeonIds.filter((id) => game.s.true[id]).length;
    openMenu(
      'The Dungeons Awaken',
      'The TRUE Dark Lord has fallen and will not return. His defeat has awakened the remaining TRUE guardians of the five great dungeons. Defeat every remaining TRUE dungeon guardian to end the war. Previously defeated TRUE guardians remain defeated.\n\nProgress: ' +
        done +
        '/5 defeated.',
      [
        ...awakeningChecklist().map((x) => action(x.label, () => {}, x.detail, true)),
        action('Continue', acknowledgeAwakening),
      ],
      acknowledgeAwakening,
    );
  }
  function characterMenu() {
    const h = game.hero;
    openMenu(
      'Character',
      h.class +
        ' · Level ' +
        h.level +
        '\nXP ' +
        Math.floor(h.xp) +
        ' / ' +
        120 * h.level +
        '\nHero progression only. Troops, resources and construction are managed at town Captains or your barracks.',
      [
        action('Skills and teachers', () => skillBook(characterMenu)),
        action('Discipline Training', () => talents(characterMenu)),
      ],
      openMain,
    );
  }
  function saveMenu() {
    openMenu(
      'Save and game management',
      'Backups, reports and run management.',
      [
        action('Save run', () => {
          save();
          closeMenu();
        }),
        action('Export save', () =>
          exportJSON(game.snapshot(), 'Azeroth_Chronicles_' + game.s.mode + '.json'),
        ),
        action('Import save', () => $('import-file').click()),
        action('Export playtest report', () =>
          exportJSON(
            {
              version: PrototypeBuild.version,
              performance: runtime.report(renderer.metrics(), platform.mode),
              currency: 'crowns',
              mode: game.s.mode,
              phase: game.s.phase,
              hero: game.hero,
              statistics: game.s.statistics,
            },
            'Azeroth_Playtest_Report.json',
          ),
        ),
        action('New Normal game', () => chooseClass('normal')),
        action(
          'New game in Nightmare Mode',
          () => chooseClass('nightmare'),
          'Unlocked by the peaceful ending',
          !profile.nightmareUnlocked,
        ),
        action('Load other mode run', () => {
          const mode = game.s.mode === 'normal' ? 'nightmare' : 'normal';
          if (load(mode)) {
            save();
            closeMenu();
          } else game.say('No saved ' + mode + ' run yet.');
        }),
      ],
      systemMenu,
    );
  }
  function platformMenu(back = systemMenu) {
    openMenu(
      'Screen and performance',
      'Current screen: ' +
        (platform.mode === 'desktop' ? 'Chromebook / desktop' : 'Phone / touch') +
        '. The two layouts share your saved campaign. Automatic selection uses input capabilities, so a touchscreen Chromebook keeps its desktop layout.\n\n' +
        runtime.describe(renderer.metrics()),
      [
        action('Automatic screen', () => {
          platform.select('auto');
          closeMenu();
        }),
        action('Chromebook / desktop screen', () => {
          platform.select('desktop');
          closeMenu();
        }),
        action('Phone / touch screen', () => {
          platform.select('phone');
          closeMenu();
        }),
        action('Reset performance sample', () => {
          runtime.reset();
          platformMenu(back);
        }),
      ],
      back,
    );
  }
  function systemMenu() {
    openMenu(
      'Game and settings',
      'Controls, audio and save management.',
      [
        ...(!runningAsApp() && platform.mode === 'phone'
          ? [action('Install on phone', installApp, 'Add Azeroth Chronicles to the home screen')]
          : []),
        ...(appRegistration
          ? [
              action(
                appUpdateReady ? 'Install available game update' : 'Check for game update',
                updateApp,
              ),
            ]
          : []),
        action('Screen and performance', () => platformMenu(systemMenu)),
        action('Controls', () => help(systemMenu)),
        action('Sound settings', () => soundMenu(systemMenu)),
        action(paused ? 'Resume play' : 'Pause play', () => {
          paused = !paused;
          closeMenu();
        }),
        action('Save and game management', saveMenu),
      ],
      openMain,
    );
  }
  function openMain() {
    const rank = game.s.expeditionRank || 1,
      canBuild = !game.isDungeon() && game.availableLabor().length > 0,
      cost = game.barracksBuildCost(),
      costLabel = cost ? cost + ' crowns' : 'FREE';
    openMenu(
      'Adventure menu',
      'Global adventure functions. Troops, resources and construction are managed through town Captains and barracks.',
      [
        action('Map and travel routes', showMap),
        action('Quest journal', () => quests(false)),
        action('Inventory and support', inventory),
        action('Character', characterMenu),
        ...(canBuild
          ? [
              action(
                'Establish Basic Barracks · ' + costLabel,
                () => {
                  if (game.build()) closeMenu();
                },
                cost === 0
                  ? 'FIRST BARRACKS FREE · Creates a nearby companion recovery base'
                  : rank >= 4
                    ? 'One companion builds a Basic camp · optional Full upgrade costs 100 crowns'
                    : 'One companion builds a recovery base; Full upgrade unlocks at Expedition 4',
                game.hero.gold < cost,
              ),
            ]
          : []),
        ...(game.s.phase === 'awakening'
          ? [
              action(
                'Awakening · Final objective',
                () => finaleMenu(openMain),
                'TRUE dungeon guardians ' +
                  Campaign.dungeonIds.filter((id) => game.s.true[id]).length +
                  '/5',
              ),
            ]
          : []),
        ...(profile.nightmareUnlocked
          ? [
              action(
                '★ New Game — Nightmare Mode',
                () => chooseClass('nightmare'),
                'Unlocked by the peaceful ending · Standard or Succession challenge',
              ),
            ]
          : []),
        action('Game and settings', systemMenu),
      ],
    );
  }
  $('menu-button').onclick = (e) => {
    audio.unlock();
    if (!started) chooseClass('normal');
    else if (game.s.challenge.pending) successionMenu();
    else if (game.s.challenge.gameOver) gameOver();
    else openMain();
  };
  $('talent-button').onclick = (e) => {
    audio.unlock();
    if (started && !game.s.challenge.pending && !game.s.challenge.gameOver) talents();
  };
  function ending() {
    profile.nightmareUnlocked = true;
    persistProfile();
    openMenu(
      'Peace for everyone',
      'The evil is defeated. Every dungeon guardian has fallen. The war is over for people and creatures alike.\n\nCreatures are neutral and cannot harm or be harmed. The reclaimed dungeons are their homes.',
      [
        action('Continue in the peaceful world', () => {
          game.s.endingAck = true;
          save();
          closeMenu();
        }),
        action('New game in Nightmare Mode', () => {
          game.s.endingAck = true;
          save();
          chooseClass('nightmare');
        }),
        action('Export completed run', () =>
          exportJSON(game.snapshot(), 'Azeroth_Chronicles_Completed.json'),
        ),
      ],
    );
  }
  function successionMenu() {
    openMenu(
      'Choose your successor',
      'The ' +
        game.hero.class +
        ' has fallen permanently. The death penalty has already removed 20% of carried crowns; the remaining crowns, rescues, quests and boss progress survive. Your successor starts at level 1 in Millhaven and must learn their skills.',
      Object.entries(Campaign.classes)
        .filter(([id]) => !game.s.challenge.fallen.includes(id))
        .map(([id, c]) =>
          action(c.icon + ' ' + id + ' successor', () => {
            game.successor(id);
            save();
            closeMenu();
          }),
        ),
    );
  }
  function gameOver() {
    openMenu(
      'The last successor has fallen',
      'All three classes have fallen. This run is over. Its progress remains available for export; continuing it is disabled.',
      [
        action('Export final run', () =>
          exportJSON(game.snapshot(), 'Azeroth_Succession_Game_Over.json'),
        ),
        action('Start a new Normal run', () => chooseClass('normal')),
        action(
          'Start a new Nightmare run',
          () => chooseClass('nightmare'),
          '',
          !profile.nightmareUnlocked,
        ),
      ],
    );
  }
  $('import-file').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw Error('too large');
      const data = JSON.parse(await file.text()),
        candidate = data.version === 2 ? Campaign.migrate(data) : Campaign.restore(data);
      persistence.writeCandidate(candidate);
      game = candidate;
      started = true;
      profile.activeMode = game.s.mode;
      if (game.peace) profile.nightmareUnlocked = true;
      persistProfile();
      closeMenu();
      status('Imported successfully.');
    } catch (_) {
      status('Invalid import. Your current run was kept intact.');
    }
    e.target.value = '';
  };
  function nearestNPC() {
    return [
      ...game.visibleNPCs(),
      ...game.visibleResourceNodes(),
      ...game.zone().buildings.map((b) => ({ ...b, kind: 'barracks', name: b.name || 'Barracks' })),
    ]
      .filter((n) => Math.hypot(n.x - game.hero.x, n.y - game.hero.y) < 115)
      .sort(
        (a, b) =>
          Math.hypot(a.x - game.hero.x, a.y - game.hero.y) -
          Math.hypot(b.x - game.hero.x, b.y - game.hero.y),
      )[0];
  }
  function interact() {
    const n = nearestNPC();
    if (!n) {
      game.say('Find a marked person or place nearby. Use the map.');
      return;
    }
    if (
      [
        'rest',
        'cage',
        'bundle',
        'landmark',
        'dungeon',
        'exit',
        'fountain',
        'resource',
        'mini',
      ].includes(n.kind)
    ) {
      game.interact(n);
      save();
      updateHUD();
      return;
    }
    if (n.kind === 'barracks') barracksMenu(n);
    else if (n.kind === 'teacher') teacher(n);
    else if (n.kind === 'smith') smith(n);
    else if (n.kind === 'supplier' || n.kind === 'alchemist') supplier(n);
    else if (n.kind === 'recruiter') partyMenu();
    else if (n.kind === 'quests') quests(true);
    else if (n.kind === 'transport') {
      if (n.hub) {
        const destinations = game.hubDestinations();
        openMenu(
          n.name,
          'Borrow this Dark Crown route to any previously visited region. Every destination arrives directly in its main town.',
          destinations.map((target) =>
            action(
              'Travel to ' + target.name,
              () => {
                if (game.travelHub(target.id)) closeMenu();
              },
              target.town,
            ),
          ),
        );
      } else {
        const i = game.regionIndex(),
          r = D.regions[i],
          target = D.regions[i + n.direction],
          cost = n.direction === 1 ? (game.s.recovery[r.id] ? 0 : r.fare) : 0;
        openMenu(
          n.name,
          'Fare ' +
            cost +
            ' crowns. Paid outbound travel includes free return. Health, mana and supplies are preserved.',
          [
            action('Travel to ' + target.name, () => {
              if (game.travel(n.direction)) closeMenu();
            }),
          ],
        );
      }
    }
  }
  $('touch-interact-button').onclick = (e) => {
    audio.unlock();
    if (activePlay()) interact();
  };
  function expeditionSupportActions(n, refresh) {
    return Object.entries(Campaign.rules.expeditionSupportSkills).flatMap(([id, def]) => {
      const cap = def.trainers?.[n.family] || 0;
      if (!cap) return [];
      const rank = game.expeditionSupportRank(id),
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
              (nextTrainer ? ' · Next: ' + game.boss(nextTrainer).captive : ''),
            true,
          ),
        ];
      }
      const cost = game.expeditionSupportCost(id),
        pct = Math.round((next / def.maxRank) * 100);
      return [
        action(
          (rank ? 'Train ' : 'Learn ') + def.name + ' · Rank ' + next + ' · ' + cost + ' crowns',
          () => {
            game.trainExpeditionSupport(id, n.family);
            refresh();
          },
          pct + '% inheritance · ' + def.detail,
          game.hero.gold < cost,
        ),
      ];
    });
  }
  function teacher(n, back = closeMenu) {
    const catalog = game.teacherCatalog(n.family),
      cap = catalog.maxRank,
      next = Object.keys(Campaign.rules.teachers).find(
        (id) => Campaign.rules.teachers[id].maxRank > cap,
      ),
      expCap = game.expeditionInstructorCap(n.family),
      expRank = game.s.expeditionRank || 1,
      expNext = expRank + 1,
      expActions = expCap
        ? [
            expRank < expCap
              ? action(
                  'Train Expedition Skill · Rank ' + expRank + ' → ' + expNext + ' · FREE',
                  () => {
                    game.trainExpedition(n.family);
                    teacher(n, back);
                  },
                  game.expeditionUnlock(expNext),
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
          game.boss(next).captive +
          ' in ' +
          D.regions.find((r) => r.id === game.boss(next).region).name +
          '. '
        : 'Maximum hero-skill training rank available here. ') +
        'Expedition Rank training is free. Hero skills and specialist companion-training skills use crowns.',
      [
        ...expActions,
        ...supportActions,
        ...D.skills
          .filter((s) =>
            game.hero.skills[s[0] - 1]
              ? catalog.train.includes(s[0])
              : catalog.learn.includes(s[0]),
          )
          .map((s) => {
            const rank = game.hero.skills[s[0] - 1],
              cost = rank ? s[5] * rank : s[3];
            return action(
              (rank ? 'Train ' : 'Learn ') + s[1] + ' · ' + cost + ' crowns',
              () => {
                rank ? game.upgrade(s[0], n.family) : game.learn(s[0], n.family);
                teacher(n, back);
              },
              'Skill ' + s[0] + ' · Rank ' + rank + ' · Specialist cap ' + cap,
              rank >= cap || game.hero.gold < cost,
            );
          }),
      ],
      back,
    );
  }
  function skillBook(back = closeMenu) {
    const rank = game.s.expeditionRank || 1,
      next = game.expeditionNextInstructor(rank),
      expDetail =
        rank >= 6
          ? 'Maximum rank'
          : next
            ? 'Next: ' + game.boss(next).captive + ' · ' + game.expeditionUnlock(rank + 1)
            : '',
      support = Object.entries(Campaign.rules.expeditionSupportSkills)
        .filter(([, def]) =>
          Object.keys(def.trainers || {}).some((family) => game.s.rescued[family]),
        )
        .map(([id, def]) => {
          const r = game.expeditionSupportRank(id),
            cost = r < def.maxRank ? game.expeditionSupportCost(id) : 0,
            best = game.expeditionSupportBestTrainer(id),
            nextProvider =
              best ||
              Object.entries(def.trainers)
                .sort((a, b) => a[1] - b[1])
                .find(([, cap]) => cap > r)?.[0],
            provider = nextProvider ? game.boss(nextProvider).captive : '';
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
      companionAdvanced = (game.s.companionCombatTraining || 1) >= 2,
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
          .filter((s) => game.skillRevealed(s[0]))
          .map((s) =>
            action(
              'Skill ' + s[0] + ' ' + s[1] + ' · Rank ' + game.hero.skills[s[0] - 1],
              () => {},
              s[0] === 1
                ? 'Always available · same-target combo: 100% → 110% → 120% + frontal AoE · resets on target switch or 4s gap'
                : s[0] === 2
                  ? s[3] +
                    ' crowns · ' +
                    game.boss(s[4]).captive +
                    ' · ' +
                    D.regions.find((r) => r.id === game.boss(s[4]).region).name +
                    ' · Rank 1 also teaches companion Holy Cleave and Piercing Volley'
                  : s[3] +
                    ' crowns · ' +
                    game.boss(s[4]).captive +
                    ' · ' +
                    D.regions.find((r) => r.id === game.boss(s[4]).region).name,
              true,
            ),
          ),
      ],
      back,
    );
  }
  function supplier(n, back = closeMenu) {
    const advanced = n.kind === 'alchemist',
      vitalityRank = game.companionVitalityRank(),
      vitalityCost = game.companionVitalityCost(),
      respecCost = game.talentRespecCost(),
      spentTalents = (game.hero.talents || []).reduce((sum, v) => sum + v, 0),
      healRank = game.rangerSupportRank('health'),
      manaRank = game.rangerSupportRank('mana'),
      healCost = game.rangerSupportCost('health'),
      manaCost = game.rangerSupportCost('mana');
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
            game.trainRangerSupport('health', n.family);
            supplier(n, back);
          },
          healRank >= 2
            ? 'Restores 150 HP over five seconds to one target · hero has priority · maximum training'
            : '60 → 150 HP over five seconds to one target · same 10s per-Ranger Heal cooldown',
          healRank >= 2 || game.hero.gold < healCost,
        ),
        action(
          manaRank >= 2
            ? 'Ranger Mana Recovery · Rank 2 · MAX'
            : 'Upgrade Ranger Mana Recovery · Rank 2 · ' + manaCost + ' crowns',
          () => {
            game.trainRangerSupport('mana', n.family);
            supplier(n, back);
          },
          manaRank >= 2
            ? 'Restores 100 MP over five seconds to the hero · maximum training'
            : '40 → 100 MP over five seconds · same 10s per-Ranger Mana Recovery cooldown',
          manaRank >= 2 || game.hero.gold < manaCost,
        ),
        action(
          'Train Companion Vitality · Rank ' +
            (vitalityRank + 1) +
            ' · ' +
            vitalityCost +
            ' crowns',
          () => {
            game.trainCompanionVitality(n.family);
            supplier(n, back);
          },
          '+10% companion max HP · current +' +
            vitalityRank * 10 +
            '% · repeatable without a gameplay cap',
          game.hero.gold < vitalityCost,
        ),
        action(
          'Reset discipline training · ' + respecCost + ' crowns',
          () => {
            game.resetTalents(n.family);
            supplier(n, back);
          },
          spentTalents
            ? 'Refund ' +
                spentTalents +
                ' spent training point' +
                (spentTalents === 1 ? '' : 's') +
                ' · level, skills and equipment stay unchanged'
            : 'No spent training points to refund',
          !spentTalents || game.hero.gold < respecCost,
        ),
      ],
      back,
    );
  }
  function smith(n, back = closeMenu) {
    const tier = { crypt: 1, mine: 2, abyss: 3, cindermaw: 4 }[n.family],
      weapon = [0, 100, 450, 1000, 2000][tier],
      armor = [0, 80, 300, 700, 1200][tier],
      weaponBonus = [0, 15, 35, 55, 70][tier],
      armorBonus = [0, 5, 12, 20, 28][tier],
      currentWeapon = game.hero.weapon || 0,
      currentArmor = game.hero.armorTier || 0,
      weaponOwned = currentWeapon >= tier,
      armorOwned = currentArmor >= tier,
      weaponReforged = !!game.hero.reforges['weapon:' + tier],
      armorReforged = !!game.hero.reforges['armor:' + tier],
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
            game.gear(n.family, 'weapon');
            smith(n, back);
          },
          'Current tier ' +
            currentWeapon +
            ' · +' +
            weaponBonus +
            ' power' +
            (weaponOwned ? ' · one-time purchase already satisfied' : ''),
          weaponOwned || game.hero.gold < weapon,
        ),
        action(
          armorOwned
            ? 'Armor tier ' + tier + ' · ' + (currentArmor === tier ? 'OWNED' : 'SURPASSED')
            : 'Armor tier ' + tier + ' · ' + armor + ' crowns',
          () => {
            game.gear(n.family, 'armor');
            smith(n, back);
          },
          'Current tier ' +
            currentArmor +
            ' · +' +
            armorBonus +
            ' armor' +
            (armorOwned ? ' · one-time purchase already satisfied' : ''),
          armorOwned || game.hero.gold < armor,
        ),
        action(
          currentWeapon === tier && weaponReforged
            ? 'Reforge weapon · DONE'
            : currentWeapon !== tier
              ? 'Reforge weapon · UNAVAILABLE'
              : 'Reforge weapon · ' + Math.ceil(weapon / 2) + ' crowns',
          () => {
            game.gear(n.family, 'weapon', true);
            smith(n, back);
          },
          currentWeapon < tier
            ? 'Buy weapon tier ' + tier + ' first'
            : currentWeapon > tier
              ? 'Current weapon tier ' + currentWeapon + ' has surpassed this forge'
              : weaponReforged
                ? 'Already reforged at this tier'
                : '+5 power once at this tier',
          currentWeapon !== tier || weaponReforged || game.hero.gold < Math.ceil(weapon / 2),
        ),
        action(
          currentArmor === tier && armorReforged
            ? 'Reforge armor · DONE'
            : currentArmor !== tier
              ? 'Reforge armor · UNAVAILABLE'
              : 'Reforge armor · ' + Math.ceil(armor / 2) + ' crowns',
          () => {
            game.gear(n.family, 'armor', true);
            smith(n, back);
          },
          currentArmor < tier
            ? 'Buy armor tier ' + tier + ' first'
            : currentArmor > tier
              ? 'Current armor tier ' + currentArmor + ' has surpassed this forge'
              : armorReforged
                ? 'Already reforged at this tier'
                : '+3 armor once at this tier',
          currentArmor !== tier || armorReforged || game.hero.gold < Math.ceil(armor / 2),
        ),
      ],
      back,
    );
  }
  function unitLabel(type) {
    return type === 'archer' ? 'Ranger' : 'Soldier';
  }
  function rosterLabel(u) {
    const i = game.s.party.indexOf(u) + 1;
    return unitLabel(u.type) + ' #' + i;
  }
  function regionalSpecialistProgress() {
    const region = game.definition().id,
      bosses = D.bosses.filter((b) => b.region === region && b.captive),
      missing = bosses.filter((b) => !game.s.rescued[b.id]),
      rescued = bosses.length - missing.length;
    const target = (b) => (b.kind === 'dungeon' ? b.place : b.name);
    const label = (b) => {
      const parts = b.captive.split(' the ');
      return parts.length > 1 ? parts[0] + ' (' + parts.slice(1).join(' the ') + ')' : b.captive;
    };
    return {
      region,
      regionName: game.definition().name,
      bosses,
      missing,
      rescued,
      total: bosses.length,
      target,
      label,
    };
  }
  function regionalSpecialistObjective() {
    const tutorial = game.s.quests['quest-barracks'];
    if (tutorial && !tutorial.paid)
      return 'FIELD BASE · Build your first Barracks — FREE · Open Menu/Esc while in the field → Establish Basic Barracks. It gives companions a nearby recovery base.';
    const p = regionalSpecialistProgress();
    if (!p.total)
      return 'Rescue specialists, rebuild your strength and continue the campaign. Map: Z.';
    if (!p.missing.length)
      return p.region === 'crown' && !game.s.true.darklord
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
    const specialists = game.barracksSpecialists(),
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
    const wounded = game.s.party.some((u) => u.hp > 0 && u.hp < u.maxHp),
      fallen = game.s.party.some((u) => u.hp <= 0);
    openMenu(
      'Recovery',
      'Basic barracks recovery is available from Expedition Rank 1.',
      [
        action(
          'Treat wounded companions · 30 crowns',
          () => {
            game.treatCompanions();
            barracksRecoveryMenu(b, back);
          },
          'Restores every living wounded companion to full health',
          !wounded || game.hero.gold < 30 || game.refugeThreat(),
        ),
        action(
          'Recover fallen companion · 40 crowns',
          () => {
            game.recover();
            barracksRecoveryMenu(b, back);
          },
          'Restores one fallen companion at full health',
          !fallen || game.hero.gold < 40,
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
          const price = game.barracksRecruitPrice(type);
          return action(
            'Recruit ' + label + ' · ' + price + ' crowns',
            () => {
              game.train(b.id, type);
              barracksRecruitmentMenu(b, back);
            },
            b.queue > 0 ? 'Barracks queue occupied' : 'Barracks rate',
            b.queue > 0 || game.hero.gold < price,
          );
        }),
      ],
      back,
    );
  }
  function barracksLaborMenu(b, back) {
    const nodes = game.visibleResourceNodes(),
      hidden = game.hiddenTributeNodes(),
      actions = nodes.map((n) =>
        action(
          'Recover Dark Lord Tribute · ' + (n.siteName || n.name),
          () => {
            game.gather(n.id);
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
            game.scoutTribute();
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
    const active = game.activeParty().length,
      cap = game.barracksFieldCap(b),
      threat = game.refugeThreat(),
      actions = game.s.party.map((u) =>
        u.active !== false
          ? action(
              'Rest ' + rosterLabel(u),
              () => {
                game.restCompanion(u.id);
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
                game.activateCompanion(u.id, b.id);
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
        game.rosterCount() +
        '. ' +
        (!b.full && (game.s.expeditionRank || 1) >= 4
          ? 'Basic barracks support at most 3 active companions. Upgrade it to use your higher Expedition cap.'
          : ''),
      actions.length ? actions : [action('No companions employed', () => {}, '', true)],
      back,
    );
  }
  function barracksCompanyMenu(b, back) {
    const returnHere = () => barracksCompanyMenu(b, back),
      rank = game.s.expeditionRank || 1,
      active = game.activeParty().length,
      cap = game.barracksFieldCap(b),
      fallen = game.s.party.filter((u) => u.hp <= 0).length;
    openMenu(
      'Company',
      'Recruit, recover and choose who travels with you.',
      [
        action(
          'Manage active group',
          () => barracksGroupMenu(b, returnHere),
          'With you ' + active + '/' + cap + ' · employed ' + game.rosterCount(),
        ),
        rank >= 2
          ? action(
              'Recruit companions',
              () => barracksRecruitmentMenu(b, returnHere),
              'Soldier 60 crowns · Ranger 85 crowns · extra hires rest in reserve',
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
      rank = game.s.expeditionRank || 1;
    openMenu(
      'Operations',
      'Regional objectives, routes and expedition labor.',
      [
        action('Regional map and routes', () => showMap(returnHere)),
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
        ...(game.s.phase === 'awakening'
          ? [
              action(
                'Awakening · Final objective',
                () => finaleMenu(returnHere),
                'TRUE dungeon guardians ' +
                  Campaign.dungeonIds.filter((id) => game.s.true[id]).length +
                  '/5',
              ),
            ]
          : []),
      ],
      back,
    );
  }
  function expeditionBarracksAction(b, back) {
    const rank = game.s.expeditionRank || 1;
    if (rank >= 6)
      return action('Expedition Skill · Rank 6', () => {}, 'Maximum rank · active group 6', true);
    const trainer = game.expeditionTrainer(),
      next = rank + 1;
    if (trainer)
      return action(
        'Train Expedition Skill · Rank ' + rank + ' → ' + next + ' · FREE',
        () => {
          game.trainExpedition(trainer);
          barracksMenu(b, back);
        },
        game.expeditionUnlock(next),
      );
    const need = game.expeditionNextInstructor(rank);
    return action(
      'Expedition Skill · Rank ' + rank,
      () => {},
      need
        ? 'Next: rescue ' +
            game.boss(need).captive +
            ' → Rank ' +
            next +
            ' · ' +
            game.expeditionUnlock(next)
        : '',
      true,
    );
  }
  function barracksMenu(ref, back = closeMenu) {
    const b = game.zone().buildings.find((x) => x.id === ref.id);
    if (!b) {
      game.say('That barracks is no longer available.');
      return;
    }
    if (b.progress < 4) {
      const assigned = game
          .activeLivingParty()
          .some((u) => u.order?.type === 'build' && u.order.id === b.id),
        canAssign = !assigned && game.availableLabor().length > 0;
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
                    if (game.assignBuilder(b.id)) closeMenu();
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
    const rank = game.s.expeditionRank || 1,
      returnHere = () => barracksMenu(b, back),
      specialists = game.barracksSpecialists(),
      exp = expeditionBarracksAction(b, back),
      rank2 = rank >= 2,
      baseActions = [
        exp,
        action(
          'Rescued specialists',
          () => barracksSpecialistMenu(b, returnHere),
          (specialists.length
            ? 'Use ' +
              specialists.length +
              ' rescued specialist' +
              (specialists.length === 1 ? '' : 's') +
              ' here · '
            : '') + regionalSpecialistBarracksDetail(),
        ),
        action(
          'Recovery',
          () => barracksRecoveryMenu(b, returnHere),
          'Treat wounded · recover fallen',
        ),
        action(
          'Manage group',
          () => barracksGroupMenu(b, returnHere),
          'With you ' +
            game.activeParty().length +
            '/' +
            game.barracksFieldCap(b) +
            ' · employed ' +
            game.rosterCount(),
        ),
        rank2
          ? action(
              'Recruitment',
              () => barracksRecruitmentMenu(b, returnHere),
              'Soldier 60 crowns · Ranger 85 crowns · extra hires rest in reserve',
            )
          : action(
              'Recruitment — Expedition 2',
              () => {},
              'Rescue Mira and train Expedition to Rank 2',
              true,
            ),
        rank2
          ? action(
              'Resources & labor',
              () => barracksLaborMenu(b, returnHere),
              'Assign idle active troops to regional deposits',
            )
          : action(
              'Resources — Expedition 2',
              () => {},
              'Rescue Mira and train Expedition to Rank 2',
              true,
            ),
      ];
    if (!b.full) {
      const upgrading = game
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
                  : 'Upgrade to Full Barracks · 100 crowns',
                () => {
                  game.upgradeBarracks(b.id);
                  barracksMenu(b, back);
                },
                'Optional upgrade · required only for active groups above 3 · becomes a resource deposit · unlocks full operations',
                !game.availableLabor().length || (!b.upgradePaid && game.hero.gold < 100),
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
        game.definition().name + ' · cheap recovery and expedition base.',
        baseActions,
        back,
      );
      return;
    }
    openMenu(
      'Full Barracks',
      game.definition().name +
        ' field base · ' +
        game.activeParty().length +
        '/' +
        game.barracksFieldCap(b) +
        ' with you · ' +
        game.rosterCount() +
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
        action('Inventory & support', () => inventory(returnHere), 'Ranger support and equipment'),
      ],
      back,
    );
  }
  function inventory(back = closeMenu) {
    const rangers = game.activeLivingParty().filter((u) => u.type === 'archer'),
      heal = game.rangerSupportAmount('health'),
      mana = game.rangerSupportAmount('mana');
    openMenu(
      'Inventory',
      'Crowns ' +
        Math.floor(game.hero.gold) +
        ' · Weapon tier ' +
        game.hero.weapon +
        ' · Armor tier ' +
        game.hero.armorTier +
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
          .filter((name) => game.s.legacyInventory?.includes(name))
          .map((name) =>
            action(
              'Equip ' + name,
              () => {
                game.equipLegacy(name);
                inventory(back);
              },
              'Saved weapon · +' + Campaign.legacyWeapons[name] + ' power',
            ),
          ),
        ...(game.hero.weapon
          ? [
              action('Equip current weapon tier ' + game.hero.weapon, () => {
                game.hero.legacyEquipped = false;
                inventory(back);
              }),
            ]
          : []),
      ],
      back,
    );
  }
  function recallSquad() {
    game.recallParty();
    updateHUD();
  }
  function townRecruitmentMenu(back) {
    const rank = game.s.expeditionRank || 1,
      atLimit = game.rosterCount() >= 3,
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
          ['soldier', 'Soldier', 70],
          ['archer', 'Ranger', 100],
        ].map(([type, label, price]) =>
          action(
            'Recruit ' + label + ' · ' + price + ' crowns',
            () => {
              game.recruit(type);
              townRecruitmentMenu(back);
            },
            'Town can employ only the first 3 companions',
            game.hero.gold < price,
          ),
        ),
      );
    actions.push(
      action(
        'Recover fallen companion · 40 crowns',
        () => {
          game.recover();
          townRecruitmentMenu(back);
        },
        '',
        !game.s.party.some((u) => u.hp <= 0) || game.hero.gold < 40,
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
    const rank = game.s.expeditionRank || 1,
      nodes = game.zone().nodes.filter((n) => n.amount > 0),
      canBuild = !game.isDungeon() && game.availableLabor().length > 0,
      cost = game.barracksBuildCost(),
      costLabel = cost ? cost + ' crowns' : 'FREE',
      actions = [];
    if (canBuild)
      actions.push(
        action(
          'Establish Basic Barracks · ' + costLabel,
          () => {
            game.build();
            townLaborMenu(back);
          },
          cost === 0
            ? 'First barracks is free · establishes nearby companion recovery'
            : rank >= 4
              ? 'Basic camp · optional Full upgrade 100 crowns'
              : 'Basic recovery base; Full upgrade unlocks at Expedition 4',
          game.hero.gold < cost,
        ),
      );
    if (rank >= 2)
      actions.push(
        ...nodes.map((n) =>
          action(
            'Gather ' + n.name + ' ' + n.icon,
            () => {
              game.gather(n.id);
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
    const title = game.definition().town + ' Captain',
      returnHere = () => partyMenu(back);
    openMenu(
      title,
      'Town services cover the starter expedition. For a larger roster: build a barracks.',
      [
        action(
          'Recruitment & recovery',
          () => townRecruitmentMenu(returnHere),
          game.rosterCount() >= 3
            ? '3+ employed · further recruiting requires a barracks'
            : 'Town hiring limit: 3 total companions',
        ),
        action(
          'Construction & resources',
          () => townLaborMenu(returnHere),
          game.barracksBuildCost() === 0
            ? 'First barracks FREE · companion recovery base'
            : 'Basic barracks 20 crowns · Full upgrade optional at Expedition 4',
        ),
      ],
      back,
    );
  }
  function formatTrainingNumber(n) {
    return Number(n.toFixed(2)).toString();
  }
  function disciplineEffect(i) {
    const p = game.talentProfile();
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
    const left = game.hero.freeTalentResets || 0;
    openMenu(
      'Free training reset',
      'Refund every spent training point. This uses one of this hero’s two free resets.',
      [
        action(
          'Confirm reset · ' + left + ' free left',
          () => {
            if (game.freeResetTalents()) talents(back);
          },
          'All spent training points are refunded.',
        ),
      ],
      () => talents(back),
    );
  }
  function talents(back = closeMenu) {
    const names = ['Power Training', 'Mana Training', 'Health Training', 'Movement Training'],
      spent = game.talentSpent(),
      left = game.hero.freeTalentResets || 0,
      actions = names.map((name, i) =>
        action(
          name + ' · Rank ' + game.hero.talents[i] + '/' + game.talentMaxRank(i),
          () => {
            game.talent(i);
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
        game.hero.talentPoints +
        ' · One point raises one discipline by one rank.',
      actions,
      back,
    );
  }
  function quests(atBoard, back = closeMenu) {
    const local = atBoard
      ? game.questDefs().filter((q) => q.region === game.definition().id)
      : game.questDefs();
    openMenu(
      atBoard ? 'Local quests' : 'Quest journal',
      atBoard
        ? 'All local quests are already ACTIVE. Rewards are automatically delivered as soon as their objectives are completed.'
        : 'All quests begin active automatically. Rewards are delivered immediately on completion; no return trip is required.',
      local.map((q) => {
        const p = game.s.quests[q.id],
          reward = q.tutorial ? 'Tutorial' : q.gold + ' crowns / ' + q.xp + ' XP';
        return action(
          q.name +
            ' · ' +
            (p?.paid ? 'Complete' : p?.closedByPeace ? 'Resolved by peace' : 'ACTIVE'),
          () => {},
          q.objective + ' · ' + reward + ' · ' + game.questProgress(q),
        );
      }),
      back,
    );
  }
  function soundMenu(back = closeMenu) {
    const s = audio.settings;
    openMenu(
      'Music and sound',
      'Independent volumes. Preferences survive new games.',
      [
        action(s.muted ? 'Unmute all sound' : 'Mute all sound', () => {
          audio.setSettings({ muted: !s.muted });
          profile.audio = { ...audio.settings };
          persistProfile();
          soundMenu(back);
        }),
        ...['master', 'music', 'ambience', 'effects'].flatMap((key) => [
          action(key + ' − · ' + Math.round(s[key] * 100) + '%', () => {
            audio.setSettings({ [key]: s[key] - 0.1 });
            profile.audio = { ...audio.settings };
            persistProfile();
            soundMenu(back);
          }),
          action(key + ' +', () => {
            audio.setSettings({ [key]: s[key] + 0.1 });
            profile.audio = { ...audio.settings };
            persistProfile();
            soundMenu(back);
          }),
        ]),
      ],
      back,
    );
  }
  function showMap(back = closeMenu) {
    const r = game.definition(),
      room = game.supplyRoom(),
      side = game.sideDungeon(),
      rawNpcs = game.visibleNPCs(),
      mapNpcs = game.isDungeon()
        ? rawNpcs
        : rawNpcs
            .filter(
              (n) =>
                ![
                  'supplier',
                  'recruiter',
                  'quests',
                  'teacher',
                  'smith',
                  'alchemist',
                  'cage',
                  'bundle',
                ].includes(n.kind),
            )
            .map((n) =>
              n.kind === 'rest' && n.id === 'rest' ? { ...n, name: r.town, icon: '🏘️' } : n,
            ),
      fieldTrue = game
        .zone()
        .enemies.filter(
          (e) =>
            e.hp > 0 &&
            e.type === 'boss' &&
            e.form === 'true' &&
            (game.boss(e.family)?.kind === 'field' ||
              e.family === 'darklord' ||
              e.family === 'darklord'),
        )
        .map((e) => ({ ...e, kind: 'trueboss', icon: '⚔️' })),
      fieldBases = game.zone().buildings.map((b) => ({
        ...b,
        kind: 'barracks',
        name: b.name || 'Barracks',
        icon: b.progress < 4 ? '🏗️' : '🏕️',
      })),
      targets = [...fieldTrue, ...mapNpcs, ...fieldBases];
    openMenu(
      (room?.name || side?.name || r.name) + ' map',
      r.biome +
        '\nTransport: ' +
        D.regions.map((r) => r.name).join(' → ') +
        '\nNamed places are destinations; tribute values and labor assignments belong in Barracks Operations.',
      targets.map((n) => {
        const boss = game.boss(n.family);
        return action(
          n.icon + ' ' + n.name,
          () => {
            game.hero.order = { type: 'move', x: n.x, y: n.y };
            closeMenu();
          },
          Math.round(n.x) +
            ', ' +
            Math.round(n.y) +
            (n.kind === 'trueboss'
              ? ' · TRUE boss hunt target'
              : n.kind === 'barracks'
                ? n.progress < 4
                  ? ' · Barracks under construction'
                  : ' · Regional field base'
                : n.kind === 'landmark' || n.sideDungeon
                  ? ' · ' + game.siteDescription(n)
                  : n.kind === 'dungeon' && boss?.kind === 'dungeon' && game.s.phase === 'awakening'
                    ? ' · ' +
                      (game.s.true[n.family]
                        ? 'TRUE defeated'
                        : game.s.normal[n.family]
                          ? 'TRUE awakened — challenge it'
                          : 'Normal boss still alive — defeat it first')
                    : n.kind === 'mini'
                      ? ' · ' + game.miniStatus(n.mini)
                      : n.hub
                        ? ' · Crown travel hub — direct town travel to previously visited regions'
                        : ''),
        );
      }),
      back,
    );
    const map = document.createElement('canvas');
    map.width = 420;
    map.height = 280;
    const ctx = map.getContext('2d'),
      size = game.zoneSize(),
      sx = (x) => (x / size) * 420,
      sy = (y) => (y / size) * 280;
    ctx.fillStyle = D.colors[game.regionIndex()];
    ctx.fillRect(0, 0, 420, 280);
    ctx.strokeStyle = '#e0ddb21b';
    ctx.lineWidth = 1;
    for (let x = 35; x < 420; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 280);
      ctx.stroke();
    }
    for (let y = 35; y < 280; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(420, y);
      ctx.stroke();
    }
    for (let x = 0; x < size; x += 50)
      for (let y = 0; y < size; y += 50)
        if (game.blocked(x, y, game.zoneId, 0)) {
          ctx.fillStyle = game.isDungeon() ? '#78807d' : '#355d72';
          ctx.fillRect(sx(x), sy(y), sx(50) + 1, sy(50) + 1);
        }
    ctx.strokeStyle = '#d9c898';
    ctx.lineWidth = 2;
    for (const road of game.zone().roads || []) {
      ctx.beginPath();
      road.forEach((p, j) => (j ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
      ctx.stroke();
    }
    for (const n of [
      ...mapNpcs,
      ...game.zone().buildings.map((b) => ({ ...b, kind: 'barracks' })),
    ]) {
      const x = sx(n.x),
        y = sy(n.y);
      ctx.fillStyle =
        n.kind === 'dungeon' || n.kind === 'exit'
          ? '#a9d4c6'
          : n.kind === 'barracks'
            ? '#d7bd86'
            : '#f2e4b9';
      ctx.strokeStyle = '#162a25';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, n.kind === 'barracks' ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    for (const e of game.zone().enemies.filter((e) => e.hp > 0 && e.type === 'boss')) {
      ctx.fillStyle = e.neutral ? '#aed6a0' : '#e87b7b';
      ctx.fillRect(sx(e.x) - 2, sy(e.y) - 2, 5, 5);
    }
    ctx.strokeStyle = '#fff2bd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx(game.hero.x), sy(game.hero.y), 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(game.hero.x) - 8, sy(game.hero.y));
    ctx.lineTo(sx(game.hero.x) + 8, sy(game.hero.y));
    ctx.moveTo(sx(game.hero.x), sy(game.hero.y) - 8);
    ctx.lineTo(sx(game.hero.x), sy(game.hero.y) + 8);
    ctx.stroke();
    ctx.strokeStyle = '#e2cf9a';
    ctx.strokeRect(1, 1, 418, 278);
    $('modal-description').append(map);
  }
  $('squad-button').onclick = (e) => {
    audio.unlock();
    if (activePlay() && game.toggleSquadDoctrine()) updateHUD();
  };
  $('recall-button').onclick = (e) => {
    audio.unlock();
    if (activePlay()) {
      recallSquad();
      save();
    }
  };
  $('order-button').onclick = (e) => {
    audio.unlock();
    if (menu) buttons[menuIndex]?.click();
  };
  const skillNames = [
      'Basic attack',
      'Second attack',
      'Self-Heal',
      'Defense or mobility',
      'Area attack',
      'Frequent special',
      'Advanced special',
      'Final special',
    ],
    icons = ['ATK', 'HIT', 'HEAL', 'GUARD', 'AREA', 'CAST', 'BURST', 'FINAL'],
    skillKeys = () => Array.from({ length: 8 }, (_, i) => input.key('skill' + (i + 1))),
    chargeableSlots = new Set([1, 2, 3]);
  function chargeSeconds() {
    return PrototypeRules.chargedSkills?.holdSeconds || 0.65;
  }
  function chargeTapSeconds() {
    return PrototypeRules.chargedSkills?.tapSeconds || 0.2;
  }
  function chargedManaPercent(slot) {
    return Math.round((PrototypeRules.chargedSkills?.manaFractions?.[slot] || 0) * 100);
  }
  function cooldownText(seconds) {
    return (Math.ceil(Math.max(0, seconds) * 10) / 10).toFixed(1);
  }
  function chargedTargetRange(slot) {
    if (slot === 2) {
      const def = PrototypeRules.chargedSkills?.second?.[game.hero.class];
      return def?.range || 480;
    }
    if (slot === 1)
      return game.hero.class === 'paladin' ? 120 : game.hero.class === 'mage' ? 400 : 450;
    return 0;
  }
  function chargeTarget(slot, targetId = null) {
    if (slot !== 1 && slot !== 2) return null;
    const range = chargedTargetRange(slot),
      valid = game
        .zone()
        .enemies.filter(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= range &&
            game.line(game.hero, e),
        );
    if (targetId !== null && targetId !== undefined)
      return valid.find((e) => e.id === targetId) || null;
    const preferred = valid.find((e) => e.id === game.s.heroTarget);
    return (
      preferred ||
      valid.sort(
        (a, b) =>
          Math.hypot(a.x - game.hero.x, a.y - game.hero.y) -
          Math.hypot(b.x - game.hero.x, b.y - game.hero.y),
      )[0] ||
      null
    );
  }
  function chargeHealNeeded() {
    return [game.hero, ...game.activeLivingParty()].some((u) => u.hp > 0 && u.hp < u.maxHp);
  }
  function startChargeClock() {
    if (!charge || charge.started !== null) return false;
    charge.started = performance.now();
    if (charge.slot === 1 || charge.slot === 2)
      charge.targetId = chargeTarget(charge.slot)?.id ?? null;
    return true;
  }
  function syncChargeReady() {
    if (!charge || charge.started !== null || !activePlay()) return false;
    if (game.hero.cd[charge.slot - 1] <= 0) return startChargeClock();
    return false;
  }
  function chargePresentation() {
    if (!charge) return null;
    syncChargeReady();
    const rank = game.hero.skills[charge.slot - 1],
      cost = game.skillManaCost(charge.slot, rank, true),
      enoughMana = game.hero.mp >= cost,
      color =
        game.hero.class === 'mage'
          ? '#9fd8ff'
          : game.hero.class === 'ranger'
            ? '#cfe59a'
            : '#f6d77a';
    if (charge.started === null)
      return {
        slot: charge.slot,
        state: 'waiting',
        elapsed: 0,
        progress: 0,
        ready: false,
        waiting: true,
        cooldown: game.hero.cd[charge.slot - 1],
        cost,
        enoughMana,
        targetId: charge.targetId ?? null,
        color,
      };
    const elapsed = Math.max(0, (performance.now() - charge.started) / 1000),
      progress = Math.min(1, elapsed / chargeSeconds());
    if (progress < 1)
      return {
        slot: charge.slot,
        state: 'charging',
        elapsed,
        progress,
        ready: false,
        waiting: false,
        cooldown: 0,
        cost,
        enoughMana,
        targetId: charge.targetId ?? null,
        color,
      };
    if (!enoughMana)
      return {
        slot: charge.slot,
        state: 'need-mp',
        elapsed,
        progress,
        ready: false,
        waiting: false,
        cooldown: 0,
        cost,
        enoughMana: false,
        targetId: charge.targetId ?? null,
        color,
      };
    if ((charge.slot === 1 || charge.slot === 2) && !chargeTarget(charge.slot, charge.targetId))
      return {
        slot: charge.slot,
        state: 'no-target',
        elapsed,
        progress,
        ready: false,
        waiting: false,
        cooldown: 0,
        cost,
        enoughMana: true,
        targetId: charge.targetId ?? null,
        color,
      };
    if (charge.slot === 3 && !chargeHealNeeded())
      return {
        slot: charge.slot,
        state: 'no-heal',
        elapsed,
        progress,
        ready: false,
        waiting: false,
        cooldown: 0,
        cost,
        enoughMana: true,
        targetId: null,
        color,
      };
    return {
      slot: charge.slot,
      state: 'ready',
      elapsed,
      progress,
      ready: true,
      waiting: false,
      cooldown: 0,
      cost,
      enoughMana: true,
      targetId: charge.targetId ?? null,
      color,
    };
  }
  function beginCharge(slot, source, pointerId = null) {
    const rank = game.hero.skills[slot - 1];
    if (!chargeableSlots.has(slot) || !activePlay() || !rank || game.peace) return false;
    if (charge) cancelCharge();
    const queued = game.hero.cd[slot - 1] > 0;
    charge = { slot, source, pointerId, queued, started: null, targetId: null };
    if (!queued) startChargeClock();
    updateHUD();
    return true;
  }
  function chargeFailureStatus(slot, charged) {
    const rank = game.hero.skills[slot - 1],
      cost = game.skillManaCost(slot, rank, charged);
    if (game.hero.cd[slot - 1] > 0) {
      status('Skill ' + slot + ' is ready in ' + cooldownText(game.hero.cd[slot - 1]) + 's.');
      return;
    }
    if (game.hero.mp < cost) {
      status(
        (charged ? 'Charged ' : '') +
          'Skill ' +
          slot +
          ' needs ' +
          cost +
          ' MP' +
          (charged ? ' (' + chargedManaPercent(slot) + '% max MP).' : '.'),
      );
      return;
    }
    if (slot === 1 || slot === 2) {
      status(
        (charged ? 'Charged ' : '') +
          'Skill ' +
          slot +
          ' needs a hostile target in range and line of sight.',
      );
      return;
    }
    if (slot === 3) {
      status(
        (charged ? 'Charged ' : '') +
          'Self-Heal needs a wounded ' +
          (charged ? 'hero or active companion.' : 'hero.'),
      );
    }
  }
  function chargeStateStatus(cast) {
    if (cast.state === 'need-mp') {
      status(
        'Charged Skill ' +
          cast.slot +
          ' needs ' +
          cast.cost +
          ' MP (' +
          chargedManaPercent(cast.slot) +
          '% max MP).',
      );
      return;
    }
    if (cast.state === 'no-target') {
      status(
        'Charged Skill ' +
          cast.slot +
          ' lost its target · move into range or line of sight and charge again.',
      );
      return;
    }
    if (cast.state === 'no-heal') {
      status('Charged Self-Heal has no wounded hero or active companion to heal.');
    }
  }
  function releaseCharge(slot, source) {
    if (!charge || charge.slot !== slot || charge.source !== source) return false;
    syncChargeReady();
    if (charge.started === null) {
      const remaining = game.hero.cd[slot - 1];
      charge = null;
      status(
        'Skill ' +
          slot +
          ' is ready in ' +
          cooldownText(remaining) +
          's. Hold through the cooldown to queue the charge.',
      );
      updateHUD();
      return false;
    }
    const held = (performance.now() - charge.started) / 1000,
      wasQueued = charge.queued,
      targetId = charge.targetId;
    if (held < chargeSeconds()) {
      const quickTap = !wasQueued && held < chargeTapSeconds();
      charge = null;
      if (!quickTap) {
        status('Skill ' + slot + ' charge canceled safely.');
        updateHUD();
        return false;
      }
      const cast = activePlay() && game.cast(slot, undefined, false);
      if (!cast && activePlay()) chargeFailureStatus(slot, false);
      updateHUD();
      return cast;
    }
    const state = chargePresentation();
    if (!state.ready) {
      charge = null;
      chargeStateStatus(state);
      updateHUD();
      return false;
    }
    charge = null;
    const cast =
      activePlay() && game.cast(slot, slot === 1 || slot === 2 ? targetId : undefined, true);
    if (!cast && activePlay()) chargeFailureStatus(slot, true);
    updateHUD();
    return cast;
  }
  function cancelCharge() {
    if (!charge) return;
    charge = null;
    if (started) updateHUD();
  }
  for (let i = 0; i < 8; i++) {
    const slot = i + 1,
      b = document.createElement('button');
    b.id = 'skill-' + slot;
    b.setAttribute('aria-label', 'Skill ' + slot + ' ' + skillNames[i]);
    b.innerHTML = icons[i] + '<small>' + skillKeys()[i] + '</small>';
    if (chargeableSlots.has(slot)) {
      b.onclick = (e) => {
        e?.preventDefault?.();
        if (e?.isTrusted && e.detail === 0 && activePlay()) game.cast(slot);
      };
      b.onpointerdown = (e) => {
        if (e?.button > 0) return;
        e?.preventDefault?.();
        audio.unlock();
        if (beginCharge(slot, 'pointer', e?.pointerId ?? null)) b.setPointerCapture?.(e.pointerId);
      };
      b.onpointerup = (e) => {
        if (e?.button > 0 || (charge?.pointerId !== null && charge?.pointerId !== e?.pointerId))
          return;
        releaseCharge(slot, 'pointer');
      };
      b.onpointercancel = b.onlostpointercapture = (e) => {
        if (
          charge?.source === 'pointer' &&
          (charge.pointerId === null || charge.pointerId === e?.pointerId)
        )
          cancelCharge();
      };
    } else
      b.onclick = (e) => {
        audio.unlock();
        if (activePlay()) game.cast(slot);
      };
    $('skills').append(b);
  }
  function useRangerSupport(type) {
    if (!activePlay()) return;
    audio.unlock();
    if (game.rangerSupport(type, true)) {
      updateHUD();
      save();
    }
  }
  const quickItems = document.createElement('div');
  quickItems.id = 'quick-items';
  for (const [type, label, key] of [
    ['health', 'Heal', 'H'],
    ['mana', 'Mana Regen', 'M'],
  ]) {
    const b = document.createElement('button');
    b.id = type + '-potion';
    b.className = 'potion-button';
    b.setAttribute('aria-label', 'Command Ranger ' + label);
    b.onclick = (e) => {
      useRangerSupport(type);
    };
    quickItems.append(b);
  }
  $('skills').append(quickItems);
  addEventListener('keydown', (e) => {
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')
    )
      return;
    audio.unlock();
    const code = e.code;
    if (bindingCapture) {
      e.preventDefault();
      if (e.repeat) return;
      if (code === 'Escape') {
        bindingCapture = null;
        menu.back();
        return;
      }
      const error = input.rebind(bindingCapture, code);
      if (error) {
        $('modal-description').textContent = error;
        return;
      }
      bindingCapture = null;
      clearInput();
      updateHUD();
      menu.back();
      return;
    }
    const actionId = input.actionFor(code);
    if (actionId || code === 'Escape' || (menu && ['Enter', 'Space'].includes(code)))
      e.preventDefault();
    if (code === 'Escape') {
      if (menu) menu.back();
      else if (!started) chooseClass('normal');
      else if (game.s.challenge.pending) successionMenu();
      else if (game.s.challenge.gameOver) gameOver();
      else openMain();
      return;
    }
    if (menu) {
      if (e.repeat) return;
      if (['down', 'right'].includes(actionId)) {
        menuIndex = (menuIndex + 1) % Math.max(1, buttons.length);
        highlight();
      } else if (['up', 'left'].includes(actionId)) {
        menuIndex = (menuIndex - 1 + buttons.length) % Math.max(1, buttons.length);
        highlight();
      } else if (actionId === 'confirm' || ['Enter', 'Space'].includes(code))
        buttons[menuIndex]?.click();
      return;
    }
    if ((paused || !focused || document.hidden) && !['pause', 'help'].includes(actionId)) return;
    if (!actionId) return;
    if (['up', 'down', 'left', 'right'].includes(actionId)) cancelTravel();
    keys[actionId] = true;
    if (e.repeat) return;
    if (actionId === 'doctrine') {
      game.toggleSquadDoctrine();
      updateHUD();
    } else if (actionId === 'interact' || actionId === 'confirm') interact();
    else if (actionId === 'recall') {
      recallSquad();
      save();
    } else if (actionId === 'pause') {
      paused = !paused;
      clearInput();
    } else if (actionId === 'map') showMap();
    else if (actionId === 'inventory') inventory();
    else if (actionId === 'heal') useRangerSupport('health');
    else if (actionId === 'mana') useRangerSupport('mana');
    else if (actionId === 'training') talents();
    else if (actionId === 'skills') skillBook();
    else if (actionId === 'help') help();
    else if (actionId === 'quests') quests(false);
    else if (actionId.startsWith('skill')) {
      const slot = Number(actionId.slice(5));
      if (chargeableSlots.has(slot)) beginCharge(slot, 'keyboard');
      else game.cast(slot);
    }
  });
  addEventListener('keyup', (e) => {
    const actionId = input.actionFor(e.code);
    delete keys[actionId];
    if (actionId?.startsWith('skill')) releaseCharge(Number(actionId.slice(5)), 'keyboard');
  });
  const joystick = $('joystick');
  let menuJoyTime = 0;
  function joyUpdate(e) {
    const r = joystick.getBoundingClientRect(),
      dx = (e.clientX - r.left - r.width / 2) / (r.width * 0.4),
      dy = (e.clientY - r.top - r.height / 2) / (r.height * 0.4),
      n = Math.max(1, Math.hypot(dx, dy));
    joy = { x: dx / n, y: dy / n };
    $('stick').style.transform = 'translate(' + joy.x * 24 + 'px,' + joy.y * 24 + 'px)';
  }
  joystick.onpointerdown = (e) => {
    if (e.pointerType === 'mouse' || pointer !== null) return;
    e.preventDefault();
    audio.unlock();
    cancelTravel();
    pointer = e.pointerId;
    joystick.setPointerCapture(pointer);
    joyUpdate(e);
  };
  joystick.onpointermove = (e) => {
    if (e.pointerId === pointer) joyUpdate(e);
  };
  joystick.onpointerup =
    joystick.onpointercancel =
    joystick.onlostpointercapture =
      (e) => {
        if (e.pointerId === pointer) {
          pointer = null;
          joy = { x: 0, y: 0 };
          $('stick').style.transform = '';
        }
      };
  canvas.onpointerdown = (e) => {
    if (!activePlay() || e.button > 0) {
      if (activePlay() && e.pointerType === 'mouse' && e.button === 2) {
        e.preventDefault();
        useRangerSupport('mana');
      }
      return;
    }
    audio.unlock();
    if (e.pointerType === 'mouse' && !input.preferences.mouseMove) {
      e.preventDefault();
      useRangerSupport('health');
      return;
    }
    if (e.pointerType !== 'mouse' && !input.preferences.touchMove) return;
    if (worldPointer || pointer !== null) return;
    e.preventDefault();
    worldPointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      target: world(e.clientX, e.clientY),
      moved: false,
    };
    canvas.setPointerCapture?.(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (
      worldPointer?.id === e.pointerId &&
      Math.hypot(e.clientX - worldPointer.x, e.clientY - worldPointer.y) > 12
    )
      worldPointer.moved = true;
  };
  canvas.onpointerup = (e) => {
    if (worldPointer?.id !== e.pointerId) return;
    const tap = worldPointer;
    worldPointer = null;
    if (
      !activePlay() ||
      tap.moved ||
      pointer !== null ||
      keys.up ||
      keys.down ||
      keys.left ||
      keys.right ||
      Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12
    )
      return;
    if (!PrototypeInput.requestMove(game, tap.target)) status('Choose a reachable place to move.');
  };
  canvas.onpointercancel = canvas.onlostpointercapture = (e) => {
    if (worldPointer?.id === e.pointerId) worldPointer = null;
  };
  addEventListener('contextmenu', (e) => {
    if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return;
    if (e.target === canvas || e.target.closest?.('#hud, #skills, #movement, #modal, #message'))
      e.preventDefault();
  });
  // Make readouts explicit tap targets so touch adjustment cannot choose a nearby button.
  $('hero-stats').onclick = (e) => e?.stopPropagation?.();
  addEventListener('blur', () => {
    focused = false;
    clearInput();
    save();
    audio.setPaused(true);
  });
  addEventListener('focus', () => {
    focused = true;
    last = performance.now();
  });
  document.addEventListener('visibilitychange', () => {
    clearInput();
    last = performance.now();
    if (document.hidden) {
      save();
      audio.setPaused(true);
    }
  });
  addEventListener('pagehide', save);
  function updateCriticalNotice() {
    const host = $('message'),
      latest = game.notices?.at(-1),
      now = performance.now();
    if (latest && latest !== criticalNoticeSeen) {
      criticalNoticeSeen = latest;
      criticalNoticeUntil = now + (latest.duration || 5.5) * 1000;
      host.textContent = latest.text;
      host.classList.add('visible');
    }
    if (criticalNoticeUntil && now >= criticalNoticeUntil) {
      criticalNoticeUntil = 0;
      host.classList.remove('visible');
    }
  }
  const hudMarkup = new Map();
  function setMarkup(id, html) {
    if (hudMarkup.get(id) !== html) {
      $(id).innerHTML = html;
      hudMarkup.set(id, html);
    }
  }
  function updateHUD() {
    const h = game.hero,
      hp = Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100)),
      mp = Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100));
    const talentButton = $('talent-button'),
      talentCount = $('talent-count');
    talentCount.textContent = h.talentPoints;
    talentButton.classList.toggle('talent-ready', h.talentPoints > 0);
    talentButton.title =
      h.talentPoints > 0
        ? h.talentPoints +
          ' unspent training point' +
          (h.talentPoints === 1 ? '' : 's') +
          ' · press ' +
          input.key('training')
        : 'Discipline Training · press ' + input.key('training');
    let heroMarkup =
      '<div class="hero-title"><span>' +
      Campaign.classes[h.class].icon +
      ' ' +
      h.class +
      '</span><small>LEVEL ' +
      h.level +
      '</small></div><div class="resource-line health"><span>HP ' +
      Math.ceil(h.hp) +
      ' / ' +
      h.maxHp +
      '</span><i style="--fill:' +
      hp +
      '%"></i></div><div class="resource-line mana"><span>MP ' +
      Math.floor(h.mp) +
      ' / ' +
      h.maxMp +
      '</span><i style="--fill:' +
      mp +
      '%"></i></div><div class="wallet"><span class="gold">' +
      Math.floor(h.gold) +
      ' crowns</span><span>XP ' +
      Math.floor(h.xp) +
      ' / ' +
      120 * h.level +
      '</span></div>';
    const heroEffects = h.supportEffects || [],
      activeRecovery = heroEffects.slice().sort((a, b) => a.seconds - b.seconds)[0];
    if (activeRecovery)
      heroMarkup +=
        '<small class="restoring">Ranger restoring ' +
        (activeRecovery.type === 'health' ? 'HP' : 'MP') +
        ' · ' +
        activeRecovery.seconds.toFixed(1) +
        's</small>';
    setMarkup('hero-stats', heroMarkup);
    if (statusUntil && performance.now() >= statusUntil) {
      $('status').textContent = '';
      statusUntil = 0;
    }
    const rangers = game.activeLivingParty().filter((u) => u.type === 'archer');
    for (const [type, label, key, cdKey, threshold] of [
      ['health', 'Heal', input.key('heal'), 'healCd', 50],
      ['mana', 'Mana Regen', input.key('mana'), 'manaCd', 35],
    ]) {
      const b = $(type + '-potion'),
        ready = rangers.filter((u) => (u[cdKey] || 0) <= 0).length,
        full =
          type === 'health'
            ? [h, ...game.activeLivingParty()].every((u) => u.hp >= u.maxHp)
            : h.mp >= h.maxMp,
        next = rangers.length ? Math.min(...rangers.map((u) => u[cdKey] || 0)) : 0;
      b.disabled = !rangers.length || !ready || full;
      b.hidden = platform.mode === 'phone' && !rangers.length;
      setMarkup(
        type + '-potion',
        label +
          '<small><span class="key-hint">' +
          key +
          ' · </span>' +
          (ready ? ready + ' ready' : rangers.length ? next.toFixed(1) + 's' : 'Need Ranger') +
          '</small>',
      );
      b.title =
        'Ranger ' +
        label +
        ' · ' +
        (type === 'health'
          ? 'restores ' + game.rangerSupportAmount(type) + ' HP to one injured ally · hero priority'
          : 'restores ' + game.rangerSupportAmount(type) + ' MP to the hero') +
        ' over five seconds · auto at ' +
        threshold +
        '% or less · 10-second cooldown belongs only to the Ranger who casts it';
    }
    const remaining = Campaign.dungeonIds.filter((id) => !game.s.true[id]),
      liveFieldTrue = game
        .zone()
        .enemies.find(
          (e) =>
            e.hp > 0 &&
            e.type === 'boss' &&
            e.form === 'true' &&
            game.boss(e.family)?.kind === 'field',
        ),
      pendingField = Object.entries(game.s.pending || {}).find(
        ([id, p]) => p.kind === 'field' && p.zone === game.zoneId && !game.s.true[id],
      );
    $('objective').textContent = game.peace
      ? 'Peace for everyone. Explore the creatures’ new homes.'
      : liveFieldTrue
        ? 'TRUE BOSS · ' +
          liveFieldTrue.name +
          ' is roaming ' +
          game.definition().name +
          ' · Map: Z'
        : pendingField && !pendingField[1].active
          ? 'TRUE BOSS · ' +
            game.boss(pendingField[0]).name +
            ' TRUE emerging in ' +
            Math.max(0, Math.ceil(pendingField[1].delay)) +
            's'
          : game.s.phase === 'awakening'
            ? 'AWAKENING · Final objective · ' +
              (5 - remaining.length) +
              '/5 TRUE guardians defeated · Map: Z'
            : regionalSpecialistObjective();
    const doctrine = game.squadDoctrineLabel(),
      squad = $('squad-button');
    squad.hidden = (game.s.expeditionRank || 1) < 3 || !doctrine.active;
    squad.textContent = 'Squad · ' + doctrine.label + ' · ' + input.key('doctrine');
    squad.title = doctrine.boss
      ? doctrine.mode === 'focus'
        ? 'Squad concentrates on the boss and ignores adds'
        : 'Squad clears adds and ignores the boss'
      : doctrine.mode === 'focus'
        ? 'Squad concentrates on the hero’s current target'
        : 'Squad spreads across nearby threats';
    for (let i = 0; i < 8; i++) {
      const slot = i + 1,
        b = $('skill-' + slot),
        rank = h.skills[i],
        charging = charge?.slot === slot,
        cast = charging ? chargePresentation() : null;
      b.classList.toggle('locked', !rank);
      b.classList.toggle('charging', charging);
      b.classList.toggle('skill-ready', !!rank && h.cd[i] <= 0 && !charging);
      const revealed = game.skillRevealed(slot),
        chargeTip = chargeableSlots.has(slot)
          ? ' · Tap under ' +
            chargeTapSeconds().toFixed(2) +
            's for normal · hold ' +
            chargeSeconds().toFixed(2) +
            's for charged · Charged cost ' +
            chargedManaPercent(slot) +
            '% max MP'
          : '';
      b.title =
        (revealed ? skillNames[i] : 'Undiscovered skill') +
        (rank ? ' · Rank ' + rank : ' · Not learned') +
        chargeTip +
        (slot === 1
          ? ' · Same-target combo: 100% → 110% → 120% · third hit adds 55% frontal splash'
          : '') +
        (i === 0 && PrototypeRules.movementBasicClasses[h.class]
          ? ' · Movement auto-attacks pause while Skill 1 is held'
          : '') +
        (slot === 2 ? ' · Charged target locks when charging begins' : '');
      b.setAttribute(
        'aria-label',
        'Skill ' +
          slot +
          ' ' +
          (revealed ? skillNames[i] : 'Undiscovered') +
          (chargeableSlots.has(slot)
            ? ' · tap for normal or hold to charge · charged cost ' +
              chargedManaPercent(slot) +
              ' percent max MP'
            : ''),
      );
      b.querySelector('small').textContent = charging
        ? cast.state === 'waiting'
          ? 'WAIT ' + cooldownText(cast.cooldown)
          : cast.state === 'charging'
            ? Math.min(99, Math.round(cast.progress * 100)) + '%'
            : cast.state === 'need-mp'
              ? 'NEED MP'
              : cast.state === 'no-target'
                ? 'NO TARGET'
                : cast.state === 'no-heal'
                  ? 'NO HEAL'
                  : 'CHARGED'
        : !rank
          ? 'Locked'
          : h.cd[i] > 0
            ? cooldownText(h.cd[i])
            : skillKeys()[i];
    }
    const n = nearestNPC();
    $('touch-interact-button').hidden = !n || !activePlay();
    setMarkup('touch-interact-button', 'Interact');
    $('touch-interact-button').title = n ? n.name : '';
    $('order-button').textContent = 'Confirm';
    $('desktop-hints').textContent =
      ['up', 'left', 'down', 'right'].map((id) => input.key(id)).join('') +
      ' · Move   ' +
      input.key('interact') +
      ' / ' +
      input.key('confirm') +
      ' · Interact   ' +
      input.key('map') +
      ' · Map   ' +
      input.key('inventory') +
      ' · Inventory   Esc · Menu';
    $('talent-button').querySelector('small').textContent = input.key('training');
    if ($('squad-button').querySelector('small'))
      $('squad-button').querySelector('small').textContent = input.key('doctrine');
    if ($('recall-button').querySelector('small'))
      $('recall-button').querySelector('small').textContent = input.key('recall');
    updateCriticalNotice();
  }
  function frame(now) {
    if (document.hidden) {
      runtime.suspend();
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    const frameStart = performance.now();
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const frozen =
      paused ||
      menu ||
      !focused ||
      document.hidden ||
      game.s.challenge.pending ||
      game.s.challenge.gameOver;
    if (menu) {
      menuJoyTime -= dt;
      if (Math.abs(joy.y) > 0.4 && menuJoyTime <= 0 && buttons.length) {
        menuIndex = (menuIndex + (joy.y > 0 ? 1 : -1) + buttons.length) % buttons.length;
        highlight();
        menuJoyTime = 0.3;
      }
    }
    audio.update(
      game,
      paused || !!menu || !focused || document.hidden || game.s.challenge.gameOver,
    );
    if (!frozen) {
      let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joy.x,
        y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0) + joy.y;
      if (joy.x || joy.y) {
        const p = world(viewport.width * 0.5 + joy.x * 100, viewport.height * 0.5 + joy.y * 100),
          base = world(viewport.width * 0.5, viewport.height * 0.5);
        x = p.x - base.x;
        y = p.y - base.y;
      }
      const speedFactor = Sprint.tick(dt, !!(x || y || game.hero.order)),
        movingHero = game.hero,
        was = {
          x: movingHero.x,
          y: movingHero.y,
          zone: game.zoneId,
          deaths: game.s.statistics.deaths,
          order: !!movingHero.order,
        };
      game.tick(dt, { x, y, speedFactor });
      syncChargeReady();
      if (
        (x || y || was.order) &&
        charge?.slot !== 1 &&
        game.hero === movingHero &&
        PrototypeRules.movementBasicClasses[movingHero.class] &&
        game.zoneId === was.zone &&
        game.s.statistics.deaths === was.deaths &&
        Math.hypot(movingHero.x - was.x, movingHero.y - was.y) > 0.25
      )
        game.cast(1);
      if (x || y || game.hero.order) {
        footstepTimer += dt;
        if (footstepTimer > 0.35) {
          audio.effect('footstep');
          footstepTimer = 0;
        }
      }
      if (Sprint.enabled) Sprint.hud();
      saveTimer += dt;
      if (saveTimer >= 5) {
        saveTimer = 0;
        save();
      }
    }
    const events = game.effects.splice(0);
    renderer.queue(events);
    renderer.update(dt);
    for (const e of events) audio.effect(e);
    if (
      events.some((e) =>
        [
          'heal',
          'rescue',
          'learning',
          'upgrade',
          'expeditionRank',
          'construction',
          'barracksUpgrade',
          'level',
          'bossDefeat',
          'peace',
          'quest',
          'questComplete',
          'supplies',
          'miniClear',
          'travel',
          'death',
          'successor',
          'gameOver',
        ].includes(e.type),
      )
    )
      save();
    const levelEvent = events.find((e) => e.type === 'level');
    if (levelEvent)
      status(
        'Level ' +
          levelEvent.level +
          '! Training point available · press ' +
          input.key('training') +
          ' or use Discipline Training.',
      );
    if (events.some((e) => e.type === 'peace')) ending();
    if (game.s.phase === 'awakening' && !game.s.awakeningAck && !menu) awakeningMenu();
    if (game.s.challenge.pending && !gateDismissed && menu?.title !== 'Choose your successor')
      successionMenu();
    if (game.s.challenge.gameOver && !gateDismissed && !menu) gameOver();
    if (game.peace && !game.s.endingAck && !menu) ending();
    hudTimer += dt;
    if (hudTimer > 0.15) {
      hudTimer = 0;
      updateHUD();
    }
    if (!frozen) runtime.record(now, frameStart, () => renderer.draw());
    else {
      runtime.suspend();
      if (runtime.shouldDrawIdle(now)) renderer.draw();
    }
    requestAnimationFrame(frame);
  }
  if (Sprint.enabled) {
    Sprint.init();
    $('sprint-button').onpointerdown = (e) => {
      if (e.pointerType !== 'mouse') Sprint.press('touch', true);
    };
    $('sprint-button').onpointerup =
      $('sprint-button').onpointercancel =
      $('sprint-button').onpointerleave =
        () => Sprint.press('touch', false);
  }
  platform.onChange(() => {
    clearInput();
    resize();
    runtime.reset();
  });
  updateHUD();
  if (!loaded) chooseClass('normal');
  requestAnimationFrame(frame);
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  addEventListener('appinstalled', () => {
    installPrompt = null;
    status('Azeroth Chronicles installed. Open it from your home screen.');
  });
  if (
    location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
  ) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (appControllerReloaded) return;
        appControllerReloaded = true;
        if (hadServiceWorkerController) {
          appReloadRequested = false;
          if (started) save();
          location.reload();
        }
      });
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          appRegistration = reg;
          function check() {
            appUpdateReady = !!reg.waiting;
            if (appUpdateReady) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          check();
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            if (worker) worker.addEventListener('statechange', check);
          });
          reg.update().catch(() => {});
        })
        .catch(() => {});
    }
  }
})();
