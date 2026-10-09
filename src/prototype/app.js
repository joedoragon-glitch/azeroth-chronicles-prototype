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
    gateDismissed = false,
    criticalNoticeSeen = null,
    criticalNoticeUntil = 0,
    statusUntil = 0,
    worldPointer = null,
    pointer = null;
  profile = persistence.loadProfile(profile);
  const audio = new PrototypeAudio(profile.audio);
  audio.enableProduction();
  const platform = PrototypePlatform.init(window);
  audio.setMixProfile(platform.mode === 'phone' ? 'phone' : 'reference');
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
    PrototypeMaterials: typeof PrototypeMaterials === 'undefined' ? null : PrototypeMaterials,
  });
  const { world } = renderer,
    worldLabelVisible = renderer.labelVisible;
  const runtime = PrototypeRuntime.create();

  const {
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
  } = PrototypeMenus.create({
    getGame: () => game,
    Campaign,
    D,
    action,
    openMenu,
    closeMenu,
    recallSquad,
    showMap,
    finaleMenu,
  });

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
        '\n\nEsc — Menu / back · Enter or Space — Confirm in menus\nMouse or touch — Activate menus and HUD buttons\nSkills 1–3: tap under 0.20 s for normal; hold 0.65 s for charged. Releasing an incomplete hold cancels.\nCharged Skills 1 / 2 / 3 cost 20% / 30% / 35% max MP respectively. Hold through a cooldown to queue the charge; WAIT shows until charging can begin.\nCHARGED means ready to release. NEED MP / NO TARGET / NO HEAL explain a blocked charge. Skills 1–2 lock their target when charging begins; Target changes it deliberately while held.\nTap Q (or your assigned Target key), or tap the Target button, to cycle visible enemies. Hold either for 0.55 s to LOCK the current target for the encounter while dodging or fighting summons; tap again to switch and unlock. A lock clears when the target dies, returns home, or the hero changes area.\nHold Skill 1 or 2 for a fine aim guide: gold means in range and clear, amber means move closer, red means blocked. No target switching is needed for Self-Heal.\nNormal Skill 1 builds a same-target combo across three hits; the third adds frontal splash. Switching targets or waiting four seconds resets it.\nSquad doctrine becomes available at Expedition 3 during combat and resets for each encounter.\nMovement autoattack stays active, except while holding Skill 1.\nTouch: use the joystick or tap a reachable place to move when enabled. Keyboard or joystick movement cancels a destination.\nMouse: left click commands Ranger Heal unless click-to-move is enabled; right click commands Mana Recovery. HUD recovery buttons always work.\nNormal Skill 3 heals the hero; charged Skill 3 also heals living active companions. Rangers automatically support the active group; manual Heal can restore the hero or a wounded living companion, and Mana Recovery restores hero MP. Fallen companions require separate recovery.\nSprint remains unavailable.',
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
    cancelTargetPress();
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
    audio.interfaceSound('open');
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
        audio.unlock().then(() => audio.interfaceSound('confirm'));
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
    audio.interfaceSound('select');
    buttons.forEach((b, i) => b.classList.toggle('selected', i === menuIndex));
    buttons[menuIndex]?.scrollIntoView({ block: 'nearest' });
  }
  function closeMenu() {
    audio.interfaceSound('close');
    bindingCapture = null;
    if (game.s.challenge.pending || game.s.challenge.gameOver) gateDismissed = true;
    menu = null;
    $('modal').hidden = true;
    document.body.classList.remove('menu-open');
    clearInput();
  }
  $('close-button').onclick = () => {
    audio.unlock().then(() => audio.interfaceSound('back'));
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
        game.xpRequired(h.level) +
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
              audio: audio.status(),
              sprites: typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites.status(),
              materials:
                typeof PrototypeMaterials === 'undefined' ? null : PrototypeMaterials.status(),
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
        'Camera: ' +
        Math.round((platform.cameraZoom || 1) * 100) +
        '% for this screen. Compare closer views while movement and attack ranges stay the same.\n\n' +
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
        ...[1, 1.5, 1.75].map((scale) =>
          action(
            'Camera ' + Math.round(scale * 100) + '%' + (scale === 1 ? ' · original' : ''),
            () => {
              clearInput();
              platform.selectCameraZoom(scale);
              closeMenu();
            },
          ),
        ),
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
                    ? 'One companion builds a Basic camp · optional Full upgrade costs ' +
                      game.barracksUpgradeCost() +
                      ' crowns'
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
        ' has fallen permanently. The death penalty has already removed ' +
        Math.round(Campaign.rules.balance.economy.deathPenaltyFraction * 100) +
        '% of carried crowns; the remaining crowns, rescues, quests and boss progress survive. Your successor starts at level 1 in Millhaven and must learn their skills.',
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
          cost = game.travelFare(D.regions.indexOf(r), n.direction);
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

  function recallSquad() {
    game.recallParty();
    updateHUD();
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
        ...['master', 'music', 'ambience', 'effects', 'interface'].flatMap((key) => [
          action(key + ' − · ' + Math.round((s[key] ?? s.effects) * 100) + '%', () => {
            audio.setSettings({ [key]: (s[key] ?? s.effects) - 0.1 });
            profile.audio = { ...audio.settings };
            persistProfile();
            soundMenu(back);
          }),
          action(key + ' +', () => {
            audio.setSettings({ [key]: (s[key] ?? s.effects) + 0.1 });
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
        (game.zoneId === 'highlands'
          ? '\n' + r.exploration
          : game.zoneId === 'mine'
            ? '\n' + game.boss('mine').history
            : game.zoneId === 'supply-highlands'
              ? '\nThe Master of Coin lives here off duty. Supper, a warm hearth and a tabletop game come before the ledger. Crag Tyrant protects the household; the three guarded caches still serve the Treasury raid.'
              : '') +
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
  const targetHoldMs = 550;
  let targetPress = null;
  function visibleHostile(enemy) {
    const p = renderer.screen(enemy);
    return p.x > 18 && p.x < viewport.width - 18 && p.y > 76 && p.y < viewport.height - 34;
  }
  function useTarget(locked = false, preferredId = null) {
    if (!activePlay()) return;
    const target = locked
      ? game.holdHeroTarget(visibleHostile, preferredId)
      : game.cycleHeroTarget(visibleHostile);
    // Explicit selection while charging deliberately switches its aim.
    if (charge && (charge.slot === 1 || charge.slot === 2)) charge.targetId = target?.id ?? null;
    status(
      target
        ? locked
          ? 'TARGET LOCKED · ' + target.name + ' · Hold focus until the encounter ends.'
          : 'Target · ' + target.name + ' · Hold Target to lock.'
        : 'No visible hostile targets nearby.',
    );
    updateHUD();
  }
  function beginTargetPress(source, pointerId = null) {
    if (!activePlay() || targetPress) return false;
    targetPress = {
      source,
      pointerId,
      started: performance.now(),
      preferredId: game.selectedHeroTarget()?.id || game.s.heroTarget || null,
    };
    $('target-button').classList.add('target-pressing');
    return true;
  }
  function cancelTargetPress() {
    targetPress = null;
    $('target-button').classList.remove('target-pressing');
  }
  function progressTargetPress() {
    if (
      !targetPress ||
      targetPress.activated ||
      !activePlay() ||
      performance.now() - targetPress.started < targetHoldMs
    )
      return;
    targetPress.activated = true;
    useTarget(true, targetPress.preferredId);
  }
  function releaseTargetPress(source, pointerId = null) {
    if (
      !targetPress ||
      targetPress.source !== source ||
      (source === 'pointer' && targetPress.pointerId !== pointerId)
    )
      return;
    progressTargetPress();
    const alreadyLocked = targetPress.activated;
    cancelTargetPress();
    if (!alreadyLocked) useTarget();
  }
  const targetButton = $('target-button');
  let ignorePointerClickUntil = 0;
  targetButton.onclick = (e) => {
    // Touch browsers may synthesize detail=0 clicks after pointerup. Never
    // cycle twice; genuine keyboard/accessibility clicks still work.
    if (Date.now() < ignorePointerClickUntil || e?.detail > 0) return;
    audio.unlock();
    useTarget();
  };
  targetButton.onpointerdown = (e) => {
    if (e.button > 0) return;
    e.preventDefault?.();
    audio.unlock();
    if (beginTargetPress('pointer', e.pointerId)) targetButton.setPointerCapture?.(e.pointerId);
  };
  targetButton.onpointerup = (e) => {
    if (e.button > 0) return;
    if (targetPress?.source === 'pointer' && targetPress.pointerId === e.pointerId)
      ignorePointerClickUntil = Date.now() + 400;
    releaseTargetPress('pointer', e.pointerId);
  };
  targetButton.onpointercancel = targetButton.onlostpointercapture = (e) => {
    if (targetPress?.source === 'pointer' && targetPress.pointerId === e.pointerId)
      cancelTargetPress();
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
    return slot === 1 || slot === 2 ? game.heroSkillRange(slot, true) : 0;
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
            game.tacticalDirectTargetable(e) &&
            Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= range &&
            game.line(game.hero, e),
        );
    if (targetId !== null && targetId !== undefined)
      return valid.find((e) => e.id === targetId) || null;
    const selected = game.selectedHeroTarget();
    if (selected) return valid.find((e) => e.id === selected.id) || null;
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
  // Preview nearby visible hostiles even if they are not yet in range or
  // behind cover. Only chargeTarget() can authorize the actual release.
  function chargedPreviewTarget() {
    const selected = game.selectedHeroTarget();
    if (selected) return selected;
    const candidates = game
      .zone()
      .enemies.filter(
        (e) =>
          e.hp > 0 &&
          !e.neutral &&
          !e.returning &&
          Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= 680 &&
          visibleHostile(e),
      );
    return (
      candidates.find((e) => e.id === game.s.heroTarget) ||
      candidates.sort(
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
      charge.targetId = chargedPreviewTarget()?.id ?? null;
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
      if (menu) {
        audio.interfaceSound('back');
        menu.back();
      } else if (!started) chooseClass('normal');
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
        if (buttons[menuIndex]?.disabled) audio.interfaceSound('denied');
        else buttons[menuIndex]?.click();
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
    } else if (actionId === 'target') beginTargetPress('keyboard');
    else if (actionId === 'pause') {
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
    if (actionId === 'target') releaseTargetPress('keyboard');
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
  addEventListener('pagehide', () => {
    save();
    audio.setPaused(true);
  });
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
      game.xpRequired(h.level) +
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
      input.key('target') +
      ' · Target   ' +
      input.key('interact') +
      ' / ' +
      input.key('confirm') +
      ' · Interact   ' +
      input.key('map') +
      ' · Map   Esc · Menu';
    $('talent-button').querySelector('small').textContent = input.key('training');
    if ($('squad-button').querySelector('small'))
      $('squad-button').querySelector('small').textContent = input.key('doctrine');
    if ($('recall-button').querySelector('small'))
      $('recall-button').querySelector('small').textContent = input.key('recall');
    const selected = game.selectedHeroTarget(),
      targetButton = $('target-button');
    targetButton.classList.toggle('has-target', !!selected);
    targetButton.classList.toggle('target-locked', !!selected && !!game.manualHeroTargetLocked);
    targetButton.setAttribute(
      'aria-label',
      selected
        ? (game.manualHeroTargetLocked ? 'Locked target: ' : 'Target: ') +
            selected.name +
            '. Tap to cycle or hold to lock.'
        : 'Tap to cycle enemies; hold to lock target',
    );
    targetButton.title = selected
      ? 'Hero target: ' +
        selected.name +
        (game.manualHeroTargetLocked ? ' · LOCKED for this encounter' : '') +
        ' · Tap ' +
        input.key('target') +
        ' to cycle, hold to lock'
      : 'Tap to cycle visible enemies · hold for ' + (targetHoldMs / 1000).toFixed(2) + 's to lock';
    if (targetButton.querySelector('small'))
      targetButton.querySelector('small').textContent = input.key('target');
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
    if (typeof PrototypeSprites !== 'undefined') PrototypeSprites.advance(dt * 1000, !!frozen);
    if (!frozen) progressTargetPress();
    if (menu) {
      menuJoyTime -= dt;
      if (Math.abs(joy.y) > 0.4 && menuJoyTime <= 0 && buttons.length) {
        menuIndex = (menuIndex + (joy.y > 0 ? 1 : -1) + buttons.length) % buttons.length;
        highlight();
        menuJoyTime = 0.3;
      }
    }
    audio.update(game, paused || !focused || document.hidden, {
      menu: !!menu,
      backgrounded: !focused || document.hidden,
      paused,
      started,
    });
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
      if (
        game.hero === movingHero &&
        game.zoneId === was.zone &&
        game.s.statistics.deaths === was.deaths
      )
        audio.footstep(game, Math.hypot(movingHero.x - was.x, movingHero.y - was.y));
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

if (typeof PrototypeMaterials !== 'undefined') void PrototypeMaterials.load();
