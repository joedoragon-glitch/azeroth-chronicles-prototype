/* Browser shell. Saved campaign rules are independent of this UI. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    canvas = $('world'),
    ctx = canvas.getContext('2d'),
    D = Campaign.data,
    manaEnabled = PrototypeRules.resourceMode.manaEnabled,
    developerEnabled = /(?:^|[?&])developer=1(?:&|$)/.test(window.location?.search || '');
  // A device-only display preference: never part of the campaign or profile export.
  const optimizationKey = 'azeroth-optimization-mode-v1';
  let optimizationMode = false;
  try {
    optimizationMode = localStorage.getItem(optimizationKey) === 'on';
  } catch (_) {}

  // Presentation-only community localization; campaign IDs and names never change.
  const languageKey = 'azeroth-display-language-v1';
  let language = 'en';
  try {
    language = localStorage.getItem(languageKey) === 'es' ? 'es' : 'en';
  } catch (_) {}
  document.documentElement.lang = language === 'es' ? 'es-419' : 'en';
  const spanishText = {
    'Choose your language': 'Elige tu idioma',
    'Adventure menu': 'Menú de aventura',
    'Game and settings': 'Juego y ajustes',
    'Challenge condition': 'Tipo de desafío',
    'Standard death and refuge recovery': 'Muerte normal y recuperación en refugio',
    'Succession challenge': 'Desafío de sucesión',
    Controls: 'Controles',
    'Combat conditions': 'Estados de combate',
    'Customize keyboard': 'Personalizar teclado',
    'Touch and mouse options': 'Opciones táctiles y de ratón',
    'Screen and performance': 'Pantalla y rendimiento',
    'Sound settings': 'Ajustes de sonido',
    'Save and game management': 'Guardar y gestionar partidas',
    'Save run': 'Guardar partida',
    'Export save': 'Exportar partida',
    'Import save': 'Importar partida',
    'Export playtest report': 'Exportar informe',
    'New Normal game': 'Nueva partida normal',
    'New game in Nightmare Mode': 'Nueva partida en modo Nightmare',
    'Load other mode run': 'Cargar partida de otro modo',
    'New Developer Mode run': 'Nueva partida de desarrollo',
    'Install on phone': 'Instalar en el teléfono',
    'Install game': 'Instalar juego',
    'Check for game update': 'Buscar actualización',
    'Install available game update': 'Instalar actualización',
    'Map and travel routes': 'Mapa y rutas de viaje',
    'Quest journal': 'Diario de misiones',
    'Story journal': 'Guía de la historia',
    'Local quests': 'Misiones de la región',
    'Inventory and support': 'Inventario y apoyo',
    Inventory: 'Inventario',
    'Skill journal': 'Diario de habilidades',
    Talents: 'Talentos',
    Training: 'Entrenamiento',
    Character: 'Personaje',
    Company: 'Compañía',
    Recruitment: 'Reclutamiento',
    'Local objectives': 'Objetivos locales',
    Party: 'Grupo',
    Map: 'Mapa',
    Back: 'Volver',
    Continue: 'Continuar',
    Confirm: 'Confirmar',
    Cancel: 'Cancelar',
    Close: 'Cerrar',
    Move: 'Mover',
    Target: 'Objetivo',
    Interact: 'Interactuar',
    Menu: 'Menú',
    'Recall squad': 'Reagrupar escuadra',
    Squad: 'Escuadra',
    Heal: 'Curar',
    Skills: 'Habilidades',
    'Skip for now': 'Ahora no',
    'Edit name': 'Editar nombre',
    'Decide later': 'Decidir después',
    'Keep this name?': '¿Conservar este nombre?',
    'Name your hero': 'Ponle nombre a tu héroe',
    'Choose your Dark Lord name': 'Elige tu nombre de Dark Lord',
    'Melee, healing and brief immunity': 'Combate cercano, curación e inmunidad breve',
    'Ranged magic, frost control and protective barriers':
      'Magia a distancia, hielo y barreras protectoras',
    'Ranged bow, healing and mobility': 'Arco a distancia, curación y movilidad',
    'The Crown · Credits': 'La Corona · Créditos',
    'Continue in the peaceful world': 'Seguir en el mundo en paz',
    'New game · Normal Mode': 'Nueva partida · modo normal',
    'New game · Nightmare Mode': 'Nueva partida · modo Nightmare',
    'Export completed run': 'Exportar partida completada',
    ACTIVE: 'ACTIVA',
    Complete: 'Completada',
    'Resolved by peace': 'Resuelta por la paz',
    Tutorial: 'Tutorial',
    'New Normal adventure': 'Nueva aventura normal',
    'New Nightmare adventure': 'Nueva aventura Nightmare',
    'Awakening complete': 'Despertar completado',
    'Awakening · Final objective': 'Despertar · objetivo final',
    'Campaign complete · Nightmare unlocked': 'Campaña completada · Nightmare desbloqueado',
    'Return death recovery to refuge': 'Volver al refugio al morir',
    'Set death recovery point': 'Establecer punto de reaparición',
    'Rest here · Complete the journey': 'Descansar aquí · completar el viaje',
    'Recruitment — Expedition 2 required': 'Reclutamiento: requiere Expedición 2',
    'Town recruitment limit reached': 'Se alcanzó el límite de reclutas',
    'Further recruiting requires a barracks.': 'Para reclutar más necesitas un cuartel.',
    'Rescue Mira and train Expedition to Rank 2': 'Rescata a Mira y mejora Expedición al rango 2',
    'Power Training': 'Entrenamiento de poder',
    'Mana Training': 'Entrenamiento de maná',
    'Cooldown Training': 'Entrenamiento de recuperación',
    'Health Training': 'Entrenamiento de salud',
    'Movement Training': 'Entrenamiento de movimiento',
    Rank: 'rango',
    FREE: 'GRATIS',
    crowns: 'coronas',
    LEVEL: 'NIVEL',
    'All local quests are already ACTIVE. Rewards are automatically delivered as soon as their objectives are completed.':
      'Todas las misiones locales están activas. Las recompensas se entregan al cumplir los objetivos.',
    'All quests begin active automatically. Rewards are delivered immediately on completion; no return trip is required.':
      'Todas las misiones se activan automáticamente. Recibes las recompensas al completarlas; no hace falta regresar.',
    'Backups, reports and run management.': 'Copias de seguridad, informes y gestión de partidas.',
    'Unlocked by the peaceful ending': 'Se desbloquea con el final pacífico',
    'Tap / charged effects and cooldowns': 'Efectos normales y cargados; tiempos de recuperación',
    'Charged skill interrupted by damage.': 'El daño interrumpió la habilidad cargada.',
    'Charged skill interrupted.': 'Habilidad cargada interrumpida.',
    'Already up to date.': 'Ya tienes la versión más reciente.',
    'Update unavailable. Your saved run is safe.':
      'No se pudo actualizar. Tu partida está a salvo.',
    'Game installed. Open it from your home screen.':
      'Juego instalado. Ábrelo desde la pantalla de inicio.',
    'Rescue specialists, rebuild your strength and continue the campaign. Map: Z.':
      'Rescata especialistas, recupera fuerzas y continúa la campaña. Mapa: Z.',
    'PEACE · Journey complete. Explore the creatures’ new homes.':
      'PAZ · Viaje completado. Explora los nuevos hogares de las criaturas.',
    'PEACE · Rest at a refuge, preparation fountain or completed Barracks.':
      'PAZ · Descansa en un refugio, una fuente de preparación o un cuartel terminado.',
    'DARK CROWN · Claim the Throne · Fortress courtyard, near (3250, 3090) · Map: Z':
      'DARK CROWN · Reclama el trono en el patio de la fortaleza, cerca de (3250, 3090) · Mapa: Z',
    'Find and defeat the TRUE Dark Lord': 'Encuentra y derrota al TRUE Dark Lord',
    'Specialists rescued · Defeat the Dark Lord': 'Especialistas rescatados · Derrota al Dark Lord',
    'Dungeon exit': 'Salida de la mazmorra',
    'Regional transport': 'Transporte regional',
    'Mira · ask the Orchard trail witness': 'Mira · habla con el testigo del camino del huerto',
    'Complete · field base established': 'Completada · base de campo construida',
    'Complete · reward delivered': 'Completada · recompensa entregada',
    'Construction in progress · keep one companion assigned until complete':
      'Construcción en curso · deja un compañero asignado hasta terminar',
    'Open Adventure menu while in the field → Establish Basic Barracks · first one FREE':
      'Abre el menú de aventura en el campo → Establecer cuartel básico · el primero es GRATIS',
    'shore observed': 'costa observada',
    'observe Lantern shore after dark': 'observa Lantern shore de noche',
    'FIELD BASE · Build your first Barracks — FREE · Open Menu/Esc while in the field → Establish Basic Barracks. It gives companions a nearby recovery base.':
      'BASE DE CAMPO · Construye tu primer cuartel GRATIS · Abre Menú/Esc en el campo → Establecer cuartel básico. Tus compañeros podrán recuperarse allí.',
    'Establish Basic Barracks': 'Establecer cuartel básico',
    'TRUE defeated': 'TRUE derrotado',
    'TRUE awakened — return and challenge it': 'TRUE despertó: regresa para enfrentarlo',
    'Normal boss still alive — defeat it to awaken TRUE':
      'El jefe normal sigue vivo: derrótalo para despertar TRUE',
    'Use 1–24 letters, numbers, spaces, apostrophes, periods or hyphens.':
      'Usa de 1 a 24 letras, números, espacios, apóstrofos, puntos o guiones.',
    'The Dark Lord rules the land. To keep heroes from becoming strong enough to challenge him, his forces have captured the specialists who teach skills, forge equipment and prepare adventurers. Free them, rebuild your strength and confront his rule.\n\nSuccession is optional. Each fallen class is lost for this run; after three class deaths the run ends.':
      'El Dark Lord gobierna estas tierras y mantiene cautivos a los especialistas que enseñan habilidades, forjan equipo y preparan aventureros. Rescátalos, recupera fuerzas y desafía su dominio.\n\nSucesión es opcional: cada clase que cae se pierde durante esta partida. Si mueren las tres, la partida termina.',
    'Choose the hero who will begin the resistance. You start with one skill; rescuing the captured specialists unlocks the training and equipment needed to face the Dark Lord.':
      'Elige al héroe que iniciará la resistencia. Comienzas con una habilidad; rescatar especialistas desbloquea el entrenamiento y equipo necesarios para enfrentar al Dark Lord.',
  };
  const questTranslations = [
    [
      'A Teacher Taken',
      'Una maestra cautiva',
      'Defeat Thornfang; free Mira',
      'Derrota a Thornfang y rescata a Mira.',
    ],
    [
      'Roads Under Threat',
      'Caminos bajo amenaza',
      'Defeat 5 outdoor enemies in Greenwood Vale',
      'Derrota a 5 enemigos al aire libre en Greenwood Vale.',
    ],
    [
      'Stolen Stores',
      'Suministros robados',
      "Recover 2 caches from Thornfang's Treasury",
      'Recupera 2 escondites del tesoro de Thornfang.',
    ],
    [
      'An Unfinished Retreat',
      'Un retiro inconcluso',
      'Defeat Lifebinder; free Borin',
      'Derrota a Lifebinder y rescata a Borin.',
    ],
    [
      'Keeping Trade Open',
      'Mantener el comercio abierto',
      'Visit Mill bridge and wagon stand',
      'Visita el puente del molino y la parada del carromato.',
    ],
    [
      'Who Owns the Woods?',
      '¿De quién son estos bosques?',
      'Discover any 3 Greenwood Vale sites',
      'Descubre 3 lugares de Greenwood Vale.',
    ],
    [
      'The Island Prisoner',
      'La prisionera de la isla',
      'Defeat Mirejaw; free Sela',
      'Derrota a Mirejaw y rescata a Sela.',
    ],
    [
      'Unsafe Crossings',
      'Cruces peligrosos',
      'Defeat 6 outdoor enemies in Flooded Marches',
      'Derrota a 6 enemigos al aire libre en Flooded Marches.',
    ],
    [
      'Records at Risk',
      'Registros en peligro',
      'Defeat Drowned Keeper; free Neri',
      'Derrota a Drowned Keeper y rescata a Neri.',
    ],
    [
      'Hidden Provisions',
      'Provisiones ocultas',
      "Recover 3 caches from Mirejaw's Treasury",
      'Recupera 3 escondites del tesoro de Mirejaw.',
    ],
    [
      'Shadows After Sundown',
      'Sombras después del anochecer',
      'Visit Lantern shore at night; defeat 2 wraiths',
      'Visita Lantern shore de noche y derrota a 2 wraiths.',
    ],
    [
      'Beyond the Main Road',
      'Más allá del camino principal',
      'Discover any 3 Flooded Marches sites',
      'Descubre 3 lugares de Flooded Marches.',
    ],
    [
      "The Tyrant's Grip",
      'El dominio del tirano',
      'Defeat Ridge Tyrant; free Orin',
      'Derrota a Ridge Tyrant y rescata a Orin.',
    ],
    [
      'Quarry Workers at Risk',
      'Trabajadores de la cantera en peligro',
      'Defeat 7 outdoor enemies in Ironroot Highlands',
      'Derrota a 7 enemigos al aire libre en Ironroot Highlands.',
    ],
    [
      'An Unwilling Hand',
      'Una mano obligada',
      'Defeat Stone Colossus; free Dara',
      'Derrota a Stone Colossus y rescata a Dara.',
    ],
    [
      "The Master's Reserve",
      'La reserva del amo',
      "Recover 3 caches from Ridge Tyrant's Treasury",
      'Recupera 3 escondites del tesoro de Ridge Tyrant.',
    ],
    [
      'Whose Mountain?',
      '¿De quién es esta montaña?',
      'Discover any 3 Ironroot Highlands sites',
      'Descubre 3 lugares de Ironroot Highlands.',
    ],
    [
      'Follow the Crowns',
      'Sigue las coronas',
      'Visit Stonecross ore vein and caravan stand',
      'Visita la veta de mineral de Stonecross y la parada de caravanas.',
    ],
    [
      'Captive at the Front',
      'Cautiva en el frente',
      'Defeat Ashen Warlord; free Lyss',
      'Derrota a Ashen Warlord y rescata a Lyss.',
    ],
    [
      'An Army Needs Supplies',
      'Un ejército necesita suministros',
      'Visit convoy, guarded ravine bridge and checkpoint',
      'Visita el convoy, el puente del barranco vigilado y el puesto de control.',
    ],
    [
      'Wings of War',
      'Alas de guerra',
      'Defeat Abyss Dragon; free Eren',
      'Derrota a Abyss Dragon y rescata a Eren.',
    ],
    [
      'Roads Still Contested',
      'Caminos todavía disputados',
      'Defeat 8 outdoor enemies in Ashen Frontier',
      'Derrota a 8 enemigos al aire libre en Ashen Frontier.',
    ],
    [
      'Rebuilding Under Guard',
      'Reconstrucción bajo vigilancia',
      'Discover any 3 Ashen Frontier sites',
      'Descubre 3 lugares de Ashen Frontier.',
    ],
    [
      'A Different Kind of Flight',
      'Otra clase de vuelo',
      'Visit civilian dragon landing behind Emberwatch',
      'Visita el embarcadero civil de dragones detrás de Emberwatch.',
    ],
    [
      'The Last Lesson',
      'La última lección',
      'Defeat Ash Sentinel; free Tovan',
      'Derrota a Ash Sentinel y rescata a Tovan.',
    ],
    [
      'Hostile Ground',
      'Terreno hostil',
      'Defeat 8 outdoor enemies in Dark Crown',
      'Derrota a 8 enemigos al aire libre en Dark Crown.',
    ],
    [
      'A Smith in Chains',
      'Una herrera encadenada',
      'Defeat Cindermaw; free Vera',
      'Derrota a Cindermaw y rescata a Vera.',
    ],
    [
      "Dreadmaw's Duty",
      'El deber de Dreadmaw',
      "Recover 3 caches from Cindermaw's Treasury",
      'Recupera 3 escondites del tesoro de Cindermaw.',
    ],
    [
      'The Machinery of Rule',
      'La maquinaria del poder',
      'Discover any 3 Dark Crown sites',
      'Descubre 3 lugares de Dark Crown.',
    ],
    [
      'Ready for the Dark Lord',
      'Listo para el Dark Lord',
      'Free Tovan and Vera; reach fortress gate',
      'Rescata a Tovan y Vera, y llega a la puerta de la fortaleza.',
    ],
  ];
  for (const [
    englishTitle,
    spanishTitle,
    englishObjective,
    spanishObjective,
  ] of questTranslations) {
    spanishText[englishTitle] = spanishTitle;
    spanishText[englishObjective] = spanishObjective;
  }
  spanishText['A Place to Recover'] = 'Un lugar para recuperarse';
  spanishText['In the field, choose Establish Basic Barracks from Adventure (free).'] =
    'En el campo, abre Aventura y elige Establecer cuartel básico (gratis).';
  function translateSegment(piece) {
    if (Object.prototype.hasOwnProperty.call(spanishText, piece)) return spanishText[piece];
    if (/^Recruit (Soldier|Ranger) · \d+ crowns/.test(piece))
      return piece.replace('Recruit ', 'Reclutar ').replace('crowns', 'coronas');
    if (/^Recover fallen companion/.test(piece))
      return piece
        .replace('Recover fallen companion', 'Recuperar compañero caído')
        .replace('crowns', 'coronas');
    if (/^Establish Basic Barracks/.test(piece))
      return piece
        .replace('Establish Basic Barracks', 'Establecer cuartel básico')
        .replace('crowns', 'coronas')
        .replace('FREE', 'GRATIS');
    if (/^Need \d+ crowns/.test(piece))
      return piece.replace('Need ', 'Necesitas ').replace('crowns', 'coronas');
    if (/^(\d+) crowns \/ (\d+) XP/.test(piece)) return piece.replace('crowns', 'coronas');
    if (/^\d+\/\d+ (supplies recovered|outdoor enemies|places discovered)/.test(piece))
      return piece
        .replace('supplies recovered', 'suministros recuperados')
        .replace('outdoor enemies', 'enemigos al aire libre')
        .replace('places discovered', 'lugares descubiertos')
        .replace('explore naturally', 'explora el mundo');
    if (/^\d+\/\d+ night wraiths/.test(piece))
      return piece
        .replace('night wraiths', 'wraiths nocturnos')
        .replace('shore observed', 'costa observada')
        .replace('observe Lantern shore after dark', 'observa Lantern shore de noche');
    if (/^Navigate · /.test(piece)) return piece.replace('Navigate · ', 'Ir a · ');
    if (/^Return to /.test(piece)) return piece.replace('Return to ', 'Regresar a ');
    if (/^Awakening · /.test(piece))
      return piece.replace('Awakening', 'Despertar').replace('defeated', 'derrotados');
    if (/^Specialists rescued · /.test(piece))
      return piece
        .replace('Specialists rescued', 'Especialistas rescatados')
        .replace('Next:', 'Siguiente:');
    if (/^.* specialists \d+\/\d+/.test(piece))
      return piece.replace('specialists', 'especialistas').replace('rescued', 'rescatados');
    if (/^Rescue /.test(piece))
      return piece
        .replace('Rescue ', 'Rescata a ')
        .replace(' from ', ' de ')
        .replace(' in ', ' en ');
    if (/^New (Normal|Nightmare|Developer) adventure/.test(piece))
      return piece.replace('New ', 'Nueva aventura ');
    return piece;
  }
  function tr(value) {
    if (language !== 'es' || typeof value !== 'string') return value;
    if (Object.prototype.hasOwnProperty.call(spanishText, value)) return spanishText[value];
    return value.split(' · ').map(translateSegment).join(' · ');
  }
  function setLanguage(value) {
    language = value === 'es' ? 'es' : 'en';
    document.documentElement.lang = language === 'es' ? 'es-419' : 'en';
    try {
      localStorage.setItem(languageKey, language);
    } catch (_) {}
    $('menu-button').firstChild.textContent = language === 'es' ? '☰ Menú ' : '☰ Menu ';
    $('talent-button').firstChild.textContent =
      language === 'es' ? 'Entrenamiento · ' : 'Training · ';
    $('recall-button').firstChild.textContent = language === 'es' ? 'Reagrupar ' : 'Recall squad ';
    $('target-button').firstChild.textContent = language === 'es' ? 'Objetivo ' : 'Target ';
    $('skills').setAttribute('aria-label', language === 'es' ? 'Habilidades' : 'Skills');
    updateHUD();
  }

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
    chargeClockGame = null,
    gateDismissed = false,
    criticalNotices = {
      game: null,
      lastId: 0,
      waiting: [],
      active: [],
      rendered: '',
      quietAfter: 0,
    },
    statusUntil = 0,
    worldPointer = null,
    pointer = null,
    joystickTouchId = null,
    joystickStart = null;
  profile = persistence.loadProfile(profile);
  const audio = new PrototypeAudio(profile.audio);
  audio.setOptimizationMode(optimizationMode);
  audio.enableProduction();
  if (typeof PrototypeMaterials !== 'undefined')
    PrototypeMaterials.setOptimizationMode(optimizationMode);
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
        status('Already up to date.');
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
      "Install once, then So I Became the Dark Lord's Problem launches from the home screen like an app and keeps its offline cache on that device.\n\nAndroid / Chrome: use the Install button when available. If Chrome does not offer it, open the browser menu and choose Install app or Add to Home screen.\n\niPhone / iPad: open the game in Safari, tap Share, choose Add to Home Screen, then Add.",
      installPrompt
        ? [action('Install game', installApp, 'Open the phone installation prompt')]
        : [],
      systemMenu,
    );
  }
  async function installApp() {
    if (runningAsApp()) {
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
        status('Game installed. Open it from your home screen.');
        closeMenu();
      } else installInstructions();
    } catch (_) {
      installInstructions();
    }
  }
  function status(text) {
    if (text === 'Saved locally · export for a backup') return;
    $('status').textContent = tr(text);
    const important =
      /storage unavailable|Saving failed|Saved run unavailable|Legacy save|Invalid import|Imported successfully/i.test(
        text,
      );
    statusUntil = performance.now() + (important ? 6000 : 2800);
  }
  function manaStatus(text) {
    // Dormant MP remains recoverable: the restoration flag brings this back.
    if (PrototypeRules.resourceMode?.manaEnabled !== false) status(text);
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
  let loaded = (developerEnabled && load('developer')) || load(profile.activeMode);
  if (!loaded) {
    game = persistence.migrateLegacy();
    if (game) {
      loaded = true;
      save();
    } else game = new Campaign();
  }
  // Older completed peaceful saves retain their already-earned Nightmare
  // entitlement even if the local profile record was reset or imported.
  if (game.peace && game.s.finalRestCompleted && !profile.nightmareUnlocked) {
    profile.nightmareUnlocked = true;
    persistProfile();
  }
  let started = loaded;
  let storyRouteActive = false;
  const viewport = { width: innerWidth, height: innerHeight };
  const renderer = PrototypeRenderer.create({
    canvas: viewport,
    ctx,
    getGame: () => game,
    platform,
    chargePresentation,
    isPaused: () => paused || !focused || document.hidden,
    getGuideRoute: () =>
      storyRouteActive && game.hero.order?.type === 'move' ? game.hero.path : null,
    Campaign,
    PrototypeVisuals,
    PrototypeCombatVisuals,
    PrototypeSprites: typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites,
    PrototypeMaterials: typeof PrototypeMaterials === 'undefined' ? null : PrototypeMaterials,
  });
  renderer.setOptimizationMode(optimizationMode);
  const { world } = renderer,
    worldLabelVisible = renderer.labelVisible;
  const runtime = PrototypeRuntime.create();
  const fps = PrototypeRuntime.createFrameRate(localStorage);

  const {
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
    storyNavigate,
    chooseNewRun: (mode) => chooseLanguage(mode),
    status,
    requestName,
    openCharacter: characterMenu,
  });

  window.Prototype = {
    get game() {
      return game;
    },
    audio,
    renderer,
    platform,
    runtime,
    fps,
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
    // Below the supported 375x800 portrait / 800x375 landscape layout,
    // proportionally fit controls instead of authoring a second smaller UI.
    // The Canvas continues to render at its actual viewport size.
    const portrait = innerHeight >= innerWidth;
    const referenceWidth = portrait ? 375 : 800;
    const referenceHeight = portrait ? 800 : 375;
    const phoneUiFit =
      platform.mode === 'phone'
        ? Math.max(0.8, Math.min(1, innerWidth / referenceWidth, innerHeight / referenceHeight))
        : 1;
    document.body.style.setProperty?.('--phone-ui-fit', phoneUiFit.toFixed(3));
    const ratio = optimizationMode
      ? 1
      : Math.max(
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
  addEventListener('resize', () => {
    releaseJoystick();
    resize();
  });
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
    const skillKeys = Array.from({ length: 8 }, (_, i) => input.key('skill' + (i + 1))).join(' / ');
    const description =
      'Move ' +
      ['up', 'left', 'down', 'right'].map((id) => input.key(id)).join('/') +
      '; phone: joystick. Interact ' +
      input.key('confirm') +
      '.\n' +
      'Skills 1–8: ' +
      skillKeys +
      '. Tap for normal; hold any skill' +
      ' for 0.65s until CHARGED, then release. Damage can interrupt preparation. ' +
      (game.hero.class === 'paladin'
        ? 'Skill 3 raises a shield; tap again to lower it or hold for Shield Bash.'
        : game.hero.class === 'mage'
          ? 'Skill 3 interrupts an enemy cast; hold for a Silence Field that affects friend and foe.'
          : 'Skill 3 heals you; charged Skill 3 heals living companions too.') +
      '\n' +
      'Target ' +
      input.key('target') +
      ': tap to cycle, hold to lock. Aim: gold is clear, amber is too far, red is blocked. Dodge marked attacks.\n' +
      'Recall ' +
      input.key('recall') +
      (input.actionFor('KeyQ') === 'recall' ? ' / Q' : '') +
      '; Ranger Heal ' +
      input.key('heal') +
      (PrototypeRules.resourceMode?.manaEnabled !== false
        ? '; Mana Recovery ' + input.key('mana')
        : '') +
      '. Fallen companions need Barracks recovery.\nMap ' +
      input.key('map') +
      (input.actionFor('KeyM') === 'map' && input.key('map') !== 'M' ? ' / M' : '') +
      ', Journal ' +
      input.key('quests') +
      ', Menu Esc. In menus: ' +
      input.key('up') +
      '/' +
      input.key('down') +
      ' selects; ' +
      input.key('confirm') +
      '/Enter confirms; Esc returns. Mouse/touch buttons also work.' +
      (game.s.keeperPact && game.keeperAvailable()
        ? '\nThe Keeper has deeper answers at your Barracks.'
        : '');
    openMenu(
      'Controls',
      language === 'es'
        ? 'Moverse: ' +
            ['up', 'left', 'down', 'right'].map((id) => input.key(id)).join('/') +
            '; teléfono: palanca táctil. Interactuar: ' +
            input.key('confirm') +
            '.\nHabilidades: ' +
            skillKeys +
            '. Toca para usar; mantén 0,65 s hasta CHARGED y suelta. ' +
            (game.hero.class === 'paladin'
              ? 'Habilidad 3: escudo. Toca para bajarlo o mantén pulsado para Shield Bash.'
              : game.hero.class === 'mage'
                ? 'Habilidad 3: interrumpir hechizos. Mantén pulsado para Silence Field.'
                : 'Habilidad 3: curación. Cargada también cura a compañeros vivos.') +
            '\nObjetivo: ' +
            input.key('target') +
            ', toca para cambiar y mantén para fijar. Dorado: a tiro; ámbar: lejos; rojo: bloqueado. Esquiva ataques marcados.' +
            '\nReagrupar: ' +
            input.key('recall') +
            '. Mapa: ' +
            input.key('map') +
            '. Misiones: ' +
            input.key('quests') +
            '. Menú: Esc. En menús, usa flechas, ' +
            input.key('confirm') +
            '/Enter para confirmar y Esc para volver.'
        : description,
      [
        action('Combat conditions', () => combatConditions(() => help(back))),
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
          manaEnabled
            ? 'When off, left click in the world commands Ranger Heal. Right click commands Mana Recovery.'
            : 'When off, left click in the world commands Ranger Heal.',
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
  // Reset a released/orphaned contact and its visual thumb together.
  function releaseJoystick() {
    pointer = null;
    joystickTouchId = null;
    joystickStart = null;
    joy = { x: 0, y: 0 };
    $('stick').style.transform = '';
  }
  function clearInput() {
    syncPartyChargeClock();
    if (typeof Sprint !== 'undefined') Sprint.release();
    cancelCharge();
    cancelTargetPress();
    keys = {};
    releaseJoystick();
    cancelTravel();
  }
  function action(label, fn, detail = '', disabled = false) {
    return { label, action: fn, detail, disabled };
  }
  function openMenu(title, description = '', actions = [], back = closeMenu) {
    bindingCapture = null;
    clearInput();
    gateDismissed = false;
    menu = { title, description, actions, back };
    $('modal').setAttribute(
      'data-view',
      title === 'The Crown · Credits'
        ? 'credits'
        : title === 'Adventure menu'
          ? 'adventure'
          : title === 'Game and settings'
            ? 'settings'
            : 'default',
    );
    // Small interactions need a small dialog; longer service catalogs keep a readable width.
    const compact =
      actions.length <= 2 &&
      description.length <= 180 &&
      actions.every((a) => a.label.length <= 46 && (a.detail || '').length <= 95);
    const regular =
      actions.length <= 5 &&
      description.length <= 340 &&
      actions.every((a) => a.label.length <= 68 && (a.detail || '').length <= 160);
    $('modal').setAttribute('data-dialog-size', compact ? 'compact' : regular ? 'regular' : 'wide');
    audio.interfaceSound('open');
    menuIndex = 0;
    document.body.classList.add('menu-open');
    $('modal').hidden = false;
    $('modal-title').textContent = tr(title);
    $('modal-description').textContent = tr(description);
    $('modal-content').scrollTop = 0;
    renderActions();
    // Give keyboard and assistive-technology users a reliable dialog focus entry.
    $('modal').tabIndex = -1;
    $('modal').focus?.({ preventScroll: true });
  }
  function renderActions() {
    const host = $('modal-actions');
    host.replaceChildren();
    buttons = [];
    for (const [index, a] of menu.actions.entries()) {
      const b = document.createElement('button');
      b.textContent = tr(a.label);
      b.disabled = a.disabled === true;
      if (a.detail) {
        const span = document.createElement('span');
        span.className = 'detail';
        span.textContent = tr(a.detail);
        b.append(span);
      }
      b.onclick = (e) => {
        // A mouse/touch choice must become the keyboard-confirmed choice too.
        if (buttons[index] === b && menuIndex !== index) {
          menuIndex = index;
          highlight();
        }
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
    back.innerHTML = tr('Back') + ' <small>' + input.key('confirm') + ' / Esc</small>';
    buttons.push(back);
    highlight();
  }
  function highlight(moveFocus = false) {
    audio.interfaceSound('select');
    buttons.forEach((b, i) => b.classList.toggle('selected', i === menuIndex));
    const selected = buttons[menuIndex];
    if (moveFocus && selected)
      (selected.disabled ? $('modal') : selected).focus?.({ preventScroll: true });
    selected?.scrollIntoView({ block: 'nearest' });
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
  function appendNameField(initialValue = '') {
    const label = document.createElement('label'),
      field = document.createElement('input');
    label.className = 'character-name-field';
    label.textContent = 'Optional name · up to 24 characters';
    field.id = 'character-name';
    field.type = 'text';
    field.maxLength = 24;
    field.autocomplete = 'off';
    field.value = initialValue;
    field.placeholder = 'Leave blank to decide later';
    label.append(field);
    $('modal-actions').prepend(label);
    return field;
  }
  function requestName({
    title,
    description,
    onSubmit,
    onSkip,
    onDone,
    initialValue = '',
    permanent = true,
  }) {
    let field;
    const submit = () => {
      if (!field.value.trim()) return onSkip();
      const name = Campaign.normalizeCharacterName(field.value);
      if (!name) {
        $('modal-description').textContent = tr(
          'Use 1–24 letters, numbers, spaces, apostrophes, periods or hyphens.',
        );
        field.focus();
        return;
      }
      const edit = () =>
        requestName({
          title,
          description,
          onSubmit,
          onSkip,
          onDone,
          permanent,
          initialValue: name,
        });
      openMenu(
        'Keep this name?',
        name +
          (permanent
            ? '\n\nThis name can be chosen only once.'
            : '\n\nThis changes only the equipment’s name.'),
        [
          action('Confirm · ' + name, () => {
            if (!onSubmit(name)) return onDone();
            save();
            updateHUD();
            onDone();
          }),
          action('Edit name', edit),
          action('Decide later', onSkip),
        ],
        edit,
      );
    };
    openMenu(
      title,
      description,
      [action('Continue', submit), action('Skip for now', onSkip)],
      onSkip,
    );
    field = appendNameField(initialValue);
    field.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        submit();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onSkip();
      }
    };
    field.focus({ preventScroll: true });
  }
  function nameHeroMenu(regnal = false, back = characterMenu) {
    requestName({
      title: regnal ? 'Choose your Dark Lord name' : 'Name your hero',
      description: regnal
        ? 'The crown is yours. Take a new name for your reign, or decide later from Character.'
        : 'Choose your hero’s permanent name, or decide later from Character.',
      onSubmit: (name) => game.nameHero(name, regnal),
      onSkip: back,
      onDone: back,
    });
  }
  // A touch outside the dialog dismisses it and cannot activate the world or
  // a HUD control beneath it. Intro, successor and game-over choices are mandatory.
  let outsidePointerId = null;
  function dismissOutside() {
    if (!menu || !started || game.s.challenge.pending || game.s.challenge.gameOver) return;
    if (game.peace && game.s.finalRestCompleted && !game.s.endingAck) {
      game.s.endingAck = true;
      save();
    }
    if (menu.title === 'The Dungeons Awaken' && !game.s.awakeningAck) {
      game.s.awakeningAck = true;
      save();
    }
    closeMenu();
  }
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (
        !menu ||
        $('modal').contains(event.target) ||
        event.target.closest?.('#order-button, #joystick, #stick')
      ) {
        // WebKit can omit the click after a canceled pointerdown. A fresh
        // pointerdown must not inherit dismissal from the previous gesture.
        outsidePointerId = null;
        return;
      }
      outsidePointerId = event.pointerId;
      event.preventDefault();
      event.stopImmediatePropagation();
      dismissOutside();
    },
    true,
  );
  document.addEventListener(
    'pointerup',
    (event) => {
      if (outsidePointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  document.addEventListener(
    'pointercancel',
    (event) => {
      if (outsidePointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      outsidePointerId = null;
    },
    true,
  );
  document.addEventListener(
    'click',
    (event) => {
      // WebKit may not dispatch click after a prevented pointerdown.
      // Do not let an old outside-tap ID swallow a later, valid menu choice.
      if (
        menu &&
        ($('modal').contains(event.target) ||
          event.target.closest?.('#order-button, #joystick, #stick'))
      ) {
        outsidePointerId = null;
        return;
      }
      if (outsidePointerId === null && !menu) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      outsidePointerId = null;
      dismissOutside();
    },
    true,
  );
  $('close-button').onclick = () => {
    audio.unlock().then(() => audio.interfaceSound('back'));
    if (!game.s.endingAck && game.peace && game.s.finalRestCompleted) {
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
  function start(mode, heroClass, succession, heroName = null) {
    if (mode === 'developer' && !developerEnabled) return;
    if (mode === 'nightmare' && !profile.nightmareUnlocked) return;
    game = new Campaign(mode, heroClass, Math.random, { succession });
    if (heroName) game.nameHero(heroName);
    started = true;
    if (typeof Sprint !== 'undefined') Sprint.reset();
    paused = false;
    if (mode !== 'developer') profile.activeMode = mode;
    save();
    closeMenu();
    updateHUD();
  }
  function chooseLanguage(mode) {
    openMenu(
      'Choose your language',
      'English / Español',
      [
        action('English' + (language === 'en' ? ' ✓' : ''), () => {
          setLanguage('en');
          chooseClass(mode);
        }),
        action('Español' + (language === 'es' ? ' ✓' : ''), () => {
          setLanguage('es');
          chooseClass(mode);
        }),
      ],
      () => (started ? openMain() : chooseClass(mode)),
    );
  }
  function languageMenu(back = systemMenu) {
    openMenu(
      'Choose your language',
      'English / Español',
      [
        action('English' + (language === 'en' ? ' ✓' : ''), () => {
          setLanguage('en');
          back();
        }),
        action('Español' + (language === 'es' ? ' ✓' : ''), () => {
          setLanguage('es');
          back();
        }),
      ],
      back,
    );
  }
  function chooseClass(mode, succession) {
    if (mode === 'developer' && !developerEnabled) return;
    if (mode === 'developer') succession = false;
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
      'New ' +
        (mode === 'nightmare' ? 'Nightmare' : mode === 'developer' ? 'Developer' : 'Normal') +
        ' adventure',
      'Choose the hero who will begin the resistance. You start with one skill; rescuing the captured specialists unlocks the training and equipment needed to face the Dark Lord.',
      Object.entries(Campaign.classes).map(([id, c]) =>
        action(
          c.icon +
            ' ' +
            (language === 'es'
              ? { paladin: 'Paladín', mage: 'Mago', ranger: 'Explorador' }[id] || id
              : id),
          () => {
            const rawName = $('character-name')?.value || '',
              heroName = rawName.trim() ? Campaign.normalizeCharacterName(rawName) : null;
            if (rawName.trim() && !heroName) {
              $('modal-description').textContent = tr(
                'Use 1–24 letters, numbers, spaces, apostrophes, periods or hyphens.',
              );
              return;
            }
            const exists = persistence.exists(mode);
            if (
              exists &&
              !confirm(
                language === 'es'
                  ? '¿Reemplazar la partida ' + mode + '? Expórtala antes si quieres conservarla.'
                  : 'Replace the existing ' + mode + ' run? Export it first to keep it.',
              )
            )
              return;
            start(mode, id, succession, heroName);
          },
          id === 'paladin'
            ? 'Melee, healing and brief immunity'
            : id === 'mage'
              ? 'Ranged magic, frost control and protective barriers'
              : 'Ranged bow, healing and mobility',
        ),
      ),
      () => chooseClass(mode),
    );
    appendNameField();
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
      (game.s.throneClaimed
        ? 'Secure the remaining TRUE guardians, then Rest to finish the reign.'
        : 'Claim the Throne at Dark Crown’s fortress courtyard first. Earlier TRUE victories already count.') +
        '\n\nProgress: ' +
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
      'The TRUE Dark Lord has fallen. Claim the Throne at the fortress courtyard in Dark Crown before taking power. Already-earned TRUE dungeon victories remain credited; only the others need defeating.\n\nProgress: ' +
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
      (h.customName || h.regnalName ? game.heroDisplayName() + ' · ' : '') +
        h.class +
        ' · Level ' +
        h.level +
        '\nXP ' +
        Math.floor(h.xp) +
        ' / ' +
        game.xpRequired(h.level) +
        '\nHero progression only. Troops, resources and construction are managed at town Captains or your barracks.',
      [
        ...(!h.customName
          ? [action('Name your hero', () => nameHeroMenu(false), 'Optional · choose once')]
          : []),
        ...(game.s.throneClaimed && !h.regnalName
          ? [
              action(
                'Choose your Dark Lord name',
                () => nameHeroMenu(true),
                'A separate permanent name for your reign',
              ),
            ]
          : []),
        action('Skill journal', () => skillBook(characterMenu)),
        action('Talents', () => talents(characterMenu)),
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
              performance: {
                ...runtime.report(renderer.metrics(), platform.mode),
                frameRatePreference: fps.preference,
                frameRateTarget: fps.target,
                optimizationMode: optimizationMode ? 'on' : 'off',
                devicePixelRatio: window.devicePixelRatio || 1,
                backingPixelRatio: canvas.width / Math.max(1, viewport.width),
                backingWidth: canvas.width,
                backingHeight: canvas.height,
              },
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
        action('New Normal game', () => chooseLanguage('normal')),
        ...(developerEnabled
          ? [action('New Developer Mode run', () => chooseLanguage('developer'))]
          : []),
        action(
          'New game in Nightmare Mode',
          () => chooseLanguage('nightmare'),
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
        'Optimization Mode: ' +
        (optimizationMode ? 'On' : 'Off') +
        '. When On: procedural terrain, less decorative scenery and ambience, and lower internal rendering resolution. Combat warnings and gameplay rules are unchanged.\n\n' +
        'Frame rate: ' +
        (fps.preference === 'auto' ? 'Auto' : fps.preference + ' FPS') +
        ' · current target ' +
        fps.target +
        ' FPS. Rendering only; gameplay stays unchanged.\n\n' +
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
        action(
          'Optimization Mode · ' + (optimizationMode ? 'On ✓' : 'Off ✓'),
          () => {
            optimizationMode = !optimizationMode;
            try {
              localStorage.setItem(optimizationKey, optimizationMode ? 'on' : 'off');
            } catch (_) {}
            if (typeof PrototypeMaterials !== 'undefined')
              PrototypeMaterials.setOptimizationMode(optimizationMode);
            audio.setOptimizationMode(optimizationMode);
            renderer.setOptimizationMode(optimizationMode);
            resize();
            runtime.reset();
            fps.suspend();
            platformMenu(back);
          },
          'Device-only preference · reduced graphics and possible decorative pop-in',
        ),
        ...[
          ['auto', 'Auto (starts at 30, tries 60)'],
          ['30', '30 FPS · Relaxed'],
          ['60', '60 FPS · Smooth'],
        ].map(([value, label]) =>
          action('Frame rate · ' + label + (fps.preference === value ? ' ✓' : ''), () => {
            fps.select(value);
            runtime.reset();
            platformMenu(back);
          }),
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
      '',
      [
        ...(!runningAsApp() && platform.mode === 'phone'
          ? [action('Install on phone', installApp, 'Add the game to the home screen')]
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
        action('Save and game management', saveMenu),
        action('Language · ' + (language === 'es' ? 'Español' : 'English'), () =>
          languageMenu(systemMenu),
        ),
      ],
      openMain,
    );
  }
  function openMain() {
    const rank = game.s.expeditionRank || 1,
      canBuild = !game.isDungeon() && game.availableLabor().length > 0,
      cost = game.barracksBuildCost(),
      costLabel = cost ? cost + ' crowns' : 'FREE';
    openMenu('Adventure menu', '', [
      action('Map and travel routes', showMap),
      action('Quest journal', () => quests(false)),
      action('Inventory and support', inventory),
      action('Skill journal', () => skillBook(openMain), 'Tap / charged effects and cooldowns'),
      action('Talents', () => talents(openMain)),
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
              () => chooseLanguage('nightmare'),
              'Unlocked by the peaceful ending · Standard or Succession challenge',
            ),
          ]
        : []),
      ...(developerEnabled
        ? [action('New Developer Mode run', () => chooseLanguage('developer'))]
        : []),
      action('Game and settings', systemMenu),
    ]);
  }
  $('menu-button').onclick = (e) => {
    audio.unlock();
    if (!started) chooseLanguage('normal');
    else if (game.s.challenge.pending) successionMenu();
    else if (game.s.challenge.gameOver) gameOver();
    else openMain();
  };
  $('talent-button').onclick = (e) => {
    audio.unlock();
    if (started && !game.s.challenge.pending && !game.s.challenge.gameOver) talents();
  };
  function ending() {
    if (!game.s.finalRestCompleted) return;
    profile.nightmareUnlocked = true;
    persistProfile();
    const crownedClass =
      { paladin: 'Paladin', mage: 'Mage', ranger: 'Ranger' }[game.hero.class] || 'Hero';
    const credits =
      'THE CROWN\n\n' +
      (game.hero.regnalName || game.hero.customName
        ? game.heroDisplayName()
        : 'The ' + crownedClass) +
      ' takes the throne.\n\n' +
      'THE FIVE REGIONS\n\n' +
      'Greenwood · Flooded Marches\nIronroot · Ashen Frontier · Dark Crown\n\n' +
      'THE FORMER GUARDIANS\n\n' +
      Campaign.dungeonIds.map((id) => game.boss(id).name).join(' · ') +
      '\n\n' +
      'THE OLD WAR IS OVER\n\n' +
      'The creatures return to their homes.\n\n' +
      'So I Became the Dark Lord’s Problem\n\n' +
      'Thank you for playing.';
    openMenu('The Crown · Credits', credits, [
      action('Continue in the peaceful world', () => {
        game.s.endingAck = true;
        save();
        closeMenu();
      }),
      action('New game · Normal Mode', () => {
        game.s.endingAck = true;
        save();
        chooseLanguage('normal');
      }),
      action('New game · Nightmare Mode', () => {
        game.s.endingAck = true;
        save();
        chooseLanguage('nightmare');
      }),
      action('Export completed run', () =>
        exportJSON(game.snapshot(), 'Azeroth_Chronicles_Completed.json'),
      ),
    ]);
  }
  function successionMenu() {
    openMenu(
      'Choose your successor',
      'The ' +
        game.hero.class +
        ' has fallen permanently. Succession carries no crown penalty; all crowns, rescues, quests and boss progress survive. Your successor starts at level 1 in Millhaven and must learn their skills.',
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
        action('Start a new Normal run', () => chooseLanguage('normal')),
        action(
          'Start a new Nightmare run',
          () => chooseLanguage('nightmare'),
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
      if (candidate.s.mode === 'developer' && !developerEnabled)
        throw Error('Developer import disabled');
      persistence.writeCandidate(candidate);
      game = candidate;
      started = true;
      if (game.s.mode !== 'developer') profile.activeMode = game.s.mode;
      if (game.peace && game.s.finalRestCompleted && game.s.mode !== 'developer')
        profile.nightmareUnlocked = true;
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
      .filter((n) => game.interactionDistance(n) < 115)
      .sort((a, b) => game.interactionDistance(a) - game.interactionDistance(b))[0];
  }
  function appointmentMenu(n, group = null) {
    if (
      !game.s.throneClaimed ||
      !game.s.true[game.zoneId] ||
      !Campaign.dungeonIds.includes(game.zoneId)
    ) {
      status('Claim the throne and defeat this dungeon’s TRUE guardian first.');
      return;
    }
    const current = game.dungeonMaster(),
      groups = {
        field: 'Field bosses',
        captain: 'Named captains',
        specialist: 'Rescued specialists',
      },
      candidates = game.dungeonMasterCandidates(),
      usedElsewhere = (id) =>
        Object.entries(game.s.appointments || {}).some(
          ([dungeon, appointed]) => dungeon !== game.zoneId && appointed === id,
        ),
      description =
        (current ? 'Current master: ' + current.name : 'No appointed master') +
        '. Appointments are optional, peaceful and unique; defeated captains remain eligible.';
    if (!group) {
      openMenu('Appoint Dungeon Master', description, [
        ...Object.entries(groups).map(([id, label]) =>
          action(
            label,
            () => appointmentMenu(n, id),
            candidates.filter((choice) => choice.group === id).length + ' eligible',
          ),
        ),
        ...(current
          ? [
              action('Leave this dungeon unappointed', () => {
                if (game.appointDungeonMaster(game.zoneId, null)) closeMenu();
              }),
            ]
          : []),
        action('Decide later', closeMenu),
      ]);
      return;
    }
    openMenu(
      'Appoint Dungeon Master · ' + groups[group],
      description,
      [
        ...candidates
          .filter((choice) => choice.group === group)
          .map((choice) =>
            action(
              (current?.id === choice.id ? '✓ ' : '') + choice.name,
              () => {
                if (game.appointDungeonMaster(game.zoneId, choice.id)) closeMenu();
              },
              usedElsewhere(choice.id)
                ? 'Already appointed in another dungeon'
                : 'Permanent local resident; no new fight',
              usedElsewhere(choice.id),
            ),
          ),
        action('Back to appointment choices', () => appointmentMenu(n)),
      ],
      () => appointmentMenu(n),
    );
  }
  function interact() {
    const n = nearestNPC();
    if (!n) {
      status('Nothing nearby to interact with.');
      return;
    }
    if (
      [
        'rest',
        'cage',
        'bundle',
        'landmark',
        'throne',
        'dungeon-master',
        'patrol-report',
        'dungeon',
        'exit',
        'fountain',
        'resource',
        'mini',
      ].includes(n.kind)
    ) {
      const success = game.interact(n);
      if (!success) {
        if (n.kind === 'cage' && !game.s.keys[n.family])
          status('Defeat ' + game.boss(n.family).name + ' before freeing ' + n.name + '.');
        else if (n.kind === 'rest')
          status(
            game.refugeThreat()
              ? 'Cannot rest during combat.'
              : 'Rest ready in ' + Math.ceil(game.s.restCooldown) + 's.',
          );
        else if (n.kind === 'bundle' || n.kind === 'fountain')
          status(n.kind === 'bundle' ? 'Clear the guards first.' : 'Fountain unavailable.');
        else if (n.kind === 'resource')
          status(
            (game.s.expeditionRank || 1) < 2
              ? 'Expedition Rank 2 needed.'
              : 'An idle companion is needed.',
          );
      }
      save();
      updateHUD();
      if (success && n.kind === 'throne' && !game.hero.regnalName) nameHeroMenu(true, closeMenu);
      return;
    }
    if (n.kind === 'appointment') appointmentMenu(n);
    else if (n.kind === 'barracks') barracksMenu(n);
    else if (n.kind === 'teacher') teacher(n);
    else if (n.kind === 'smith') smith(n);
    else if (n.kind === 'keeper') keeper();
    else if (n.kind === 'archive-record') keeperLedger();
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
          game.s.mode === 'developer'
            ? 'FREE — Developer Mode. Travel has no fare or return-ticket requirement.'
            : 'Fare ' +
                cost +
                (manaEnabled
                  ? ' crowns. Paid outbound travel includes free return. Health, mana and supplies are preserved.'
                  : ' crowns. Paid outbound travel includes free return. Health and supplies are preserved.'),
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

  function storyNavigate(destination, label) {
    if (!destination || !Number.isFinite(destination.x) || !Number.isFinite(destination.y)) {
      status('Destination unavailable.');
      return;
    }
    const choice = game.navigationTarget(destination)?.point;
    if (!choice) {
      status('No walkable path. Move closer and try again.');
      return;
    }
    closeMenu();
    if (PrototypeInput.requestMove(game, choice)) {
      storyRouteActive = true;
      status('Following path to ' + label + '.');
    } else status('Route unavailable. Try again nearby.');
  }

  // prettier-ignore
  function showMap(back = closeMenu) {
    const zone = game.zone();
    const room = game.supplyRoom();
    const side = game.sideDungeon();
    const region = game.definition();
    const destinations = game.mapDestinations();

    let selected = null;
    let route = null;
    const choices = [
      action(
        'Navigate to selected',
        () => {
          if (!selected) return;
          // Closing the dialog clears input and cancels the previous movement order.
          // Start the route only AFTER closing, or selection silently does nothing.
          const latest = findRoute(selected);
          if (!latest) {
            status('No walkable route to ' + selected.name + '.');
            return;
          }
          closeMenu();
          if (PrototypeInput.requestMove(game, latest.point)) {
            storyRouteActive = true;
            status('Walking to ' + selected.name + '.');
          } else status('Route blocked. Choose another destination.');
        },
        '',
        true,
      ),
      ...destinations.map((place) =>
        action((place.icon || '•') + ' ' + place.name, () => choose(place), place.kind === 'transport' ? 'Walk to the travel service; choose your journey there.' : place.kind === 'dungeon' || place.sideDungeon ? 'Walk to the entrance, then interact to enter.' : ''),
      ),
    ];
    openMenu((room?.name || side?.name || region.name) + ' map', '', choices, back);
    $('modal').setAttribute('data-view', 'map');
    const go = $('modal-actions').children[0];
    go.classList.add('route-go');
    const map = document.createElement('canvas');
    map.width = 480;
    map.height = 320;
    map.setAttribute('aria-label', 'Map of the current area. Select a place to navigate.');
    $('modal-description').append(map);
    const ctx = map.getContext('2d');
    const size = game.zoneSize();
    const sx = (x) => (x / size) * map.width;
    const sy = (y) => (y / size) * map.height;

    function findRoute(place) {
      return game.navigationTarget(place);
    }

    function drawMap() {
      ctx.fillStyle = D.colors[game.regionIndex()] || '#263d40';
      ctx.fillRect(0, 0, map.width, map.height);
      ctx.strokeStyle = '#e0ddb21b';
      ctx.lineWidth = 1;
      for (let x = 40; x < map.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, map.height);
        ctx.stroke();
      }
      for (let y = 40; y < map.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(map.width, y);
        ctx.stroke();
      }
      for (let x = 0; x < size; x += 60)
        for (let y = 0; y < size; y += 60)
          if (game.blocked(x, y, game.zoneId, 0, true)) {
            ctx.fillStyle = game.isDungeon() ? '#78807d' : '#355d72';
            ctx.fillRect(sx(x), sy(y), sx(60) + 1, sy(60) + 1);
          }
      ctx.fillStyle = game.isDungeon() ? '#59615d' : '#77715a';
      for (const prop of zone.props.filter(p => !p.decorative && p.r > 0)) {
        ctx.beginPath();
        ctx.ellipse(sx(prop.x), sy(prop.y), Math.max(1,sx(prop.r)), Math.max(1,sy(prop.r)), 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.strokeStyle = '#d9c898';
      ctx.lineWidth = 2.5;
      for (const road of zone.roads || []) {
        ctx.beginPath();
        road.forEach((point, index) =>
          index
            ? ctx.lineTo(sx(point.x), sy(point.y))
            : ctx.moveTo(sx(point.x), sy(point.y)),
        );
        ctx.stroke();
      }
      if (route) {
        ctx.strokeStyle = '#8ee7d0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx(game.hero.x), sy(game.hero.y));
        for (const point of route.path) ctx.lineTo(sx(point.x), sy(point.y));
        ctx.stroke();
      }
      for (const place of destinations) {
        const isPicked = place === selected;
        const x = sx(place.x);
        const y = sy(place.y);
        ctx.beginPath();
        ctx.arc(x, y, isPicked ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle =
          place.kind === 'boss'
            ? '#e78d82'
            : place.kind === 'barracks'
              ? '#e0c183'
              : '#b7e1d5';
        ctx.fill();
        ctx.lineWidth = isPicked ? 2.5 : 1;
        ctx.strokeStyle = isPicked ? '#ffffff' : '#142a32';
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(sx(game.hero.x), sy(game.hero.y), 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff2bd';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(game.hero.x) - 9, sy(game.hero.y));
      ctx.lineTo(sx(game.hero.x) + 9, sy(game.hero.y));
      ctx.moveTo(sx(game.hero.x), sy(game.hero.y) - 9);
      ctx.lineTo(sx(game.hero.x), sy(game.hero.y) + 9);
      ctx.stroke();
      ctx.strokeStyle = '#d9c898';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, map.width - 1, map.height - 1);
    }

    function choose(place) {
      selected = place;
      route = findRoute(place);
      go.disabled = !route;
      go.textContent = route ? 'Navigate · ' + place.name : 'No route · ' + place.name;
      Array.from($('modal-actions').children).forEach((button, index) =>
        button.classList.toggle('route-picked', destinations[index - 1] === place),
      );
      menuIndex = destinations.indexOf(place) + 1;
      highlight();
      drawMap();
    }

    map.onclick = (event) => {
      const rect = map.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * map.width;
      const y = ((event.clientY - rect.top) / rect.height) * map.height;
      const nearest = destinations
        .map((place) => ({ place, distance: Math.hypot(sx(place.x) - x, sy(place.y) - y) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance < 16) choose(nearest.place);
    };
    drawMap();
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
    status(target ? (locked ? 'Locked · ' : 'Target · ') + target.name : 'No target nearby.');
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
    chargeableSlots = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
  const canChargeSlot = (slot) => chargeableSlots.has(slot);
  // Ranger Skill 4 charges a companion rally: no enemy aim/lock required.
  const chargeNeedsTarget = (slot) =>
    [1, 2, 6, 7].includes(slot) ||
    (slot === 8 && game.hero.class !== 'paladin') ||
    (slot === 4 && game.hero.class !== 'ranger');
  const skillLabel = (slot) => {
    const labels = {
      paladin: {
        2: 'Sundering Strike',
        3: 'Shield Stance',
        4: 'Judgment',
        5: 'Holy Area',
        6: 'Vanguard Rush',
        7: 'Holy Assault',
        8: 'Sanctuary Oath / Last Bastion',
      },
      mage: {
        2: 'Frost Bolt',
        3: 'Spell Interrupt',
        4: 'Arcane Fracture',
        5: 'Force Pulse / Force Wave',
        6: 'Magic Shot',
        7: 'Arcane Chain / Chainstorm',
        8: 'Astral Detonation / Arcane Cataclysm',
      },
      ranger: {
        2: 'Pinning Shot',
        3: 'Self-Heal',
        4: 'Movement Haste / Rally',
        5: 'Arrow Volley',
        6: 'Repelling Shot / Volley',
        7: 'Piercing Arrow',
        8: 'Hunters Salvo / Grand Hunt',
      },
    };
    return labels[game.hero.class]?.[slot] || skillNames[slot - 1];
  };
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
    return chargeNeedsTarget(slot) ? game.heroSkillRange(slot, true) : 0;
  }
  function chargeTarget(slot, targetId = null) {
    if (!chargeNeedsTarget(slot)) return null;
    const range = chargedTargetRange(slot),
      valid = game.zone().enemies.filter(
        (e) =>
          e.hp > 0 &&
          !e.neutral &&
          !game.attackResetProtected(e) &&
          // Respect the targeting system's own acquisition rules; a
          // charged release must not impose a second arbitrary distance cap.
          game.tacticalDirectTargetable(e),
      ),
      inRange = valid.filter(
        (e) => Math.hypot(e.x - game.hero.x, e.y - game.hero.y) <= range && game.line(game.hero, e),
      );
    // A chosen target remains charged even outside attack range. The hero
    // approaches only after release; charge preparation never moves him.
    // Keep the original charge aim while valid. Resolve a replacement if
    // that enemy dies, disappears, or becomes unreachable before release.
    const original =
      targetId !== null && targetId !== undefined ? valid.find((e) => e.id === targetId) : null;
    if (original) return original;
    const selected = game.selectedHeroTarget();
    const selectedInRange = selected && valid.find((e) => e.id === selected.id);
    if (selectedInRange) return selectedInRange;
    // Respect deliberate boss locks: a live locked boss that is out of
    // reach must not redirect the attack into a nearby summon.
    if (selected && game.manualHeroTargetLocked) return null;
    const preferred = inRange.find((e) => e.id === game.s.heroTarget);
    return (
      preferred ||
      inRange.sort(
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
          !game.attackResetProtected(e) &&
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
  function chargeRallyAvailable() {
    if (game.hero.class !== 'ranger') return false;
    const rank = game.hero.skills[3] || 1,
      rally = PrototypeRules.heroTactics.ranger.rally,
      radius = rally.radius + Math.floor(rank / 2) * rally.radiusStep;
    return game
      .activeLivingParty()
      .some(
        (u) =>
          Math.hypot(u.x - game.hero.x, u.y - game.hero.y) <= radius && game.line(game.hero, u),
      );
  }
  // Active wall time is shared with companion casts. It is independent of the
  // movement/AI dt cap, freezes in menus/background/pause, and never enters saves.
  function syncPartyChargeClock() {
    if (!game) return;
    if (chargeClockGame !== game) {
      chargeClockGame?.partyChargeNow();
      chargeClockGame?.clearPartyCharges();
      const owner = game;
      let value = owner.partyChargeNow(),
        stamp = performance.now(),
        running = activePlay();
      owner.setPartyChargeClock(() => {
        const next = performance.now(),
          active = game === owner && activePlay();
        if (running && active) value += Math.max(0, next - stamp) / 1000;
        stamp = next;
        running = active;
        return value;
      });
      chargeClockGame = owner;
    }
    game.partyChargeNow();
  }
  function startChargeClock() {
    if (!charge || charge.started !== null) return false;
    syncPartyChargeClock();
    if (!game.beginPartyCharge(game.hero, charge.slot)) return false;
    charge.started = game.partyChargeState(game.hero).started;
    // Record which protected encounters were active at the instant charging began.
    charge.encountersAtStart = game.chargedEncounterSnapshot();
    if (chargeNeedsTarget(charge.slot)) charge.targetId = chargedPreviewTarget()?.id ?? null;
    return true;
  }
  function syncChargeReady() {
    syncPartyChargeClock();
    if (!charge) return false;
    if (
      charge.unit !== game.hero ||
      charge.zone !== game.zoneId ||
      game.hero.hp <= 0 ||
      game.hero.deathRollHeld ||
      game.hero.keeperHeld ||
      game._tacticalScatter?.has('hero') ||
      (charge.started !== null && !game.partyChargeState(game.hero))
    ) {
      cancelCharge();
      return false;
    }
    if (charge.started !== null || !activePlay()) return false;
    if (game.hero.cd[charge.slot - 1] <= 0 && game.partyChargeRecovery(game.hero) <= 0)
      return startChargeClock();
    return false;
  }
  function chargePresentation() {
    if (!charge) return null;
    syncChargeReady();
    if (!charge) return null;
    const rank = game.hero.skills[charge.slot - 1],
      cost = game.skillManaCost(charge.slot, rank, true),
      enoughMana = game.hero.mp >= cost,
      color =
        PrototypeHeroPresentation.profile({
          class: game.hero.class,
          slot: charge.slot,
          charged: true,
        })?.colors[0] || '#f6d77a';
    if (charge.started !== null && game.partyChargeState(game.hero)?.interrupted)
      return {
        slot: charge.slot,
        state: 'interrupted',
        elapsed: Math.max(0, game.partyChargeNow() - charge.started),
        progress: 0,
        ready: false,
        waiting: false,
        cooldown: 0,
        cost,
        enoughMana,
        targetId: charge.targetId ?? null,
        color,
      };
    if (charge.started === null)
      return {
        slot: charge.slot,
        state: 'waiting',
        elapsed: 0,
        progress: 0,
        ready: false,
        waiting: true,
        cooldown: Math.max(game.hero.cd[charge.slot - 1], game.partyChargeRecovery(game.hero)),
        cost,
        enoughMana,
        targetId: charge.targetId ?? null,
        color,
      };
    const elapsed = Math.max(0, game.partyChargeNow() - charge.started),
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
    if (chargeNeedsTarget(charge.slot) && !chargeTarget(charge.slot, charge.targetId))
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
    if (charge.slot === 4 && game.hero.class === 'ranger' && !chargeRallyAvailable())
      return {
        slot: charge.slot,
        state: 'no-allies',
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
    if (charge.slot === 3 && game.hero.class === 'ranger' && !chargeHealNeeded())
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
    if (
      !canChargeSlot(slot) ||
      !activePlay() ||
      !rank ||
      game.peace ||
      (game.s.mode === 'developer' && slot === 1)
    )
      return false;
    if (charge) cancelCharge();
    syncPartyChargeClock();
    const queued = game.hero.cd[slot - 1] > 0;
    charge = {
      slot,
      source,
      pointerId,
      queued,
      started: null,
      targetId: null,
      campaign: game,
      unit: game.hero,
      zone: game.zoneId,
      pressedAt: game.partyChargeNow(),
    };
    if (!queued) startChargeClock();
    updateHUD();
    return true;
  }
  function chargeFailureStatus(slot, charged) {
    const rank = game.hero.skills[slot - 1],
      cost = game.skillManaCost(slot, rank, charged);
    if (game.hero.cd[slot - 1] > 0) {
      status('Skill ' + slot + ' · ' + cooldownText(game.hero.cd[slot - 1]) + 's.');
      return;
    }
    if (game.hero.mp < cost) {
      manaStatus('Need ' + cost + ' MP.');
      return;
    }
    if (chargeNeedsTarget(slot)) {
      status('No target in range.');
      return;
    }
    if (slot === 4 && charged && game.hero.class === 'ranger' && !chargeRallyAvailable()) {
      status('No living companions in Rally range.');
      return;
    }
    if (slot === 3 && game.hero.class === 'ranger') status('No healing needed.');
    if (slot === 3 && game.hero.class === 'mage') status('No casting enemy to interrupt.');
  }
  function chargeStateStatus(cast) {
    if (cast.state === 'need-mp') {
      manaStatus('Need ' + cast.cost + ' MP.');
      return;
    }
    if (cast.state === 'no-target') {
      status('Target lost. Move closer.');
      return;
    }
    if (cast.state === 'no-heal') {
      status('No healing needed.');
    }
    if (cast.state === 'no-allies') {
      status('No living companions in Rally range.');
    }
  }
  function chargeFeedback(stage) {
    if (!charge || charge.started === null) return;
    const receipt = {
      type: 'heroCharge',
      actor: 'hero',
      class: game.hero.class,
      slot: charge.slot,
      charged: true,
      stage,
      x: game.hero.x,
      y: game.hero.y,
    };
    renderer.queue([receipt]);
    audio.effect(receipt);
  }
  function observeChargeFeedback() {
    if (!charge || charge.started === null) return;
    const state = chargePresentation();
    if (!state || !charge || state.state === 'interrupted') return;
    // Quiet taps do not trigger charging sounds. The input thresholds stay authoritative.
    if (!charge.avBuildup && state.elapsed >= chargeTapSeconds()) {
      charge.avBuildup = true;
      chargeFeedback('build');
    }
    if (!charge.avRise && state.progress >= 0.7 && !state.ready) {
      charge.avRise = true;
      chargeFeedback('rise');
    }
    if (!charge.avReady && state.ready) {
      charge.avReady = true;
      chargeFeedback('ready');
    }
  }
  function releaseCharge(slot, source) {
    if (!charge || charge.slot !== slot || charge.source !== source) return false;
    syncChargeReady();
    if (!charge) return false;
    if (charge.started === null) {
      const quickTap =
          !charge.queued && game.partyChargeNow() - charge.pressedAt < chargeTapSeconds(),
        remaining = Math.max(game.hero.cd[slot - 1], game.partyChargeRecovery(game.hero));
      cancelCharge();
      if (quickTap) {
        const cast = activePlay() && game.cast(slot, undefined, false);
        if (!cast && activePlay()) chargeFailureStatus(slot, false);
        updateHUD();
        return cast;
      }
      status('Skill ' + slot + ' · ' + cooldownText(remaining) + 's.');
      updateHUD();
      return false;
    }
    const held = game.partyChargeNow() - charge.started,
      interrupted = !!game.partyChargeState(game.hero)?.interrupted,
      wasQueued = charge.queued,
      targetId = charge.targetId,
      encountersAtStart = charge.encountersAtStart;
    if (held < chargeSeconds()) {
      const quickTap = !wasQueued && held < chargeTapSeconds();
      cancelCharge();
      if (!quickTap) {
        updateHUD();
        return false;
      }
      const cast = activePlay() && game.cast(slot, undefined, false);
      if (!cast && activePlay()) chargeFailureStatus(slot, false);
      updateHUD();
      return cast;
    }
    const state = chargePresentation();
    if (interrupted || !state?.ready) {
      cancelCharge();
      if (interrupted) status('Charged skill interrupted by damage.');
      else if (state) chargeStateStatus(state);
      updateHUD();
      return false;
    }
    // The charge is still released manually; only the aim is resolved now.
    const releaseTarget = chargeNeedsTarget(slot) ? chargeTarget(slot, targetId) : null;
    const failedRelease = {
      type: 'heroCharge',
      actor: 'hero',
      class: game.hero.class,
      slot,
      charged: true,
      stage: 'cancel',
      x: game.hero.x,
      y: game.hero.y,
    };
    cancelCharge(false);
    const cast =
      activePlay() &&
      game.cast(
        slot,
        chargeNeedsTarget(slot) ? releaseTarget?.id : undefined,
        true,
        encountersAtStart,
      );
    if (!cast && activePlay()) {
      renderer.queue([failedRelease]);
      audio.effect(failedRelease);
      chargeFailureStatus(slot, true);
    }
    updateHUD();
    return cast;
  }
  function cancelCharge(feedback = true) {
    if (!charge) return;
    if (
      feedback &&
      charge.campaign === game &&
      charge.unit === game.hero &&
      charge.started !== null &&
      !charge.campaign.partyChargeState(charge.unit)?.interrupted &&
      charge.campaign.partyChargeNow() - charge.started >= chargeTapSeconds()
    )
      chargeFeedback('cancel');
    charge.campaign.clearPartyCharge(charge.unit);
    charge = null;
    if (started) updateHUD();
  }
  for (let i = 0; i < 8; i++) {
    const slot = i + 1,
      b = document.createElement('button');
    b.id = 'skill-' + slot;
    b.setAttribute('aria-label', 'Skill ' + slot + ' ' + skillLabel(slot));
    b.innerHTML = icons[i] + '<small>' + skillKeys()[i] + '</small>';
    if (chargeableSlots.has(slot)) {
      b.onclick = (e) => {
        e?.preventDefault?.();
        if (activePlay() && (!canChargeSlot(slot) || (e?.isTrusted && e.detail === 0)))
          game.cast(slot);
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
  for (const [type, label, key] of manaEnabled
    ? [
        ['health', 'Heal', 'H'],
        ['mana', 'Mana Regen', 'M'],
      ]
    : [['health', 'Heal', 'H']]) {
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
      } else if (!started) chooseLanguage('normal');
      else if (game.s.challenge.pending) successionMenu();
      else if (game.s.challenge.gameOver) gameOver();
      else openMain();
      return;
    }
    if (menu) {
      // Reserve ordinary Tab navigation inside dialogs, but honor a player's
      // explicit Tab remap to a menu direction or confirmation action.
      if (code === 'Tab' && !['up', 'down', 'left', 'right', 'confirm'].includes(actionId)) {
        e.preventDefault();
        if (e.repeat) return;
        const available = buttons.filter((b) => !b.disabled);
        if (!available.length) return;
        const focusedIndex = available.indexOf(document.activeElement);
        const from = focusedIndex < 0 ? (e.shiftKey ? 0 : -1) : focusedIndex;
        const next =
          available[(from + (e.shiftKey ? -1 : 1) + available.length) % available.length];
        menuIndex = buttons.indexOf(next);
        highlight(true);
        return;
      }
      if (e.repeat) return;
      if (['down', 'right'].includes(actionId)) {
        menuIndex = (menuIndex + 1) % Math.max(1, buttons.length);
        highlight(true);
      } else if (['up', 'left'].includes(actionId)) {
        menuIndex = (menuIndex - 1 + buttons.length) % Math.max(1, buttons.length);
        highlight(true);
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
    } else if (actionId === 'confirm') interact();
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
    else if (manaEnabled && actionId === 'mana') useRangerSupport('mana');
    else if (actionId === 'training') talents();
    else if (actionId === 'skills') skillBook();
    else if (actionId === 'help') help();
    else if (actionId === 'quests') quests(false);
    else if (actionId.startsWith('skill')) {
      const slot = Number(actionId.slice(5));
      if (game.s.mode === 'developer' && slot === 1) return;
      if (canChargeSlot(slot)) beginCharge(slot, 'keyboard');
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
    if (e.pointerType === 'mouse') return;
    if (pointer !== null) {
      // A new primary contact or missing old capture proves the old touch ended.
      // A second finger must not steal the live joystick during combat.
      if (e.isPrimary !== true && joystick.hasPointerCapture?.(pointer) !== false) return;
      releaseJoystick();
    }
    e.preventDefault();
    audio.unlock();
    cancelTravel();
    pointer = e.pointerId;
    joystickStart = { x: e.clientX, y: e.clientY };
    joystick.setPointerCapture(pointer);
    joyUpdate(e);
  };
  joystick.onpointermove = (e) => {
    if (e.pointerId === pointer) joyUpdate(e);
  };
  function finishJoystickPointer(e) {
    if (e.pointerId === pointer) releaseJoystick();
  }
  joystick.onpointerup =
    joystick.onpointercancel =
    joystick.onlostpointercapture =
      finishJoystickPointer;
  // Catch terminal pointer events that land outside the captured element.
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    document.addEventListener(type, finishJoystickPointer, true);
  // iOS/WebKit may omit the pointer ending but still send the touch ending.
  // Match Touch.identifier explicitly: it need not equal PointerEvent.pointerId.
  joystick.addEventListener(
    'touchstart',
    (e) => {
      if (pointer === null || joystickTouchId !== null || !joystickStart) return;
      const contact = Array.from(e.changedTouches).find(
        (touch) =>
          Math.hypot(touch.clientX - joystickStart.x, touch.clientY - joystickStart.y) < 25,
      );
      if (contact) joystickTouchId = contact.identifier;
    },
    { passive: true },
  );
  for (const type of ['touchend', 'touchcancel'])
    document.addEventListener(
      type,
      (e) => {
        if (pointer === null) return;
        if (
          (joystickTouchId !== null &&
            Array.from(e.changedTouches).some((touch) => touch.identifier === joystickTouchId)) ||
          e.touches.length === 0
        )
          releaseJoystick();
      },
      true,
    );
  canvas.onpointerdown = (e) => {
    if (!activePlay() || e.button > 0) {
      if (manaEnabled && activePlay() && e.pointerType === 'mouse' && e.button === 2) {
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
    if (!PrototypeInput.requestMove(game, tap.target)) status('Path blocked.');
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
    clearInput();
    save();
    audio.setPaused(true);
  });
  function updateCriticalNotice() {
    const host = $('message'),
      now = performance.now(),
      state = criticalNotices;
    if (state.game !== game) {
      state.game = game;
      state.lastId = 0;
      state.waiting = [];
      state.active = [];
      state.rendered = '';
      state.quietAfter = 0;
      host.replaceChildren();
    }
    // Consume all new notices in order. A third notice waits instead of replacing
    // either visible one, including when several milestones happen in one frame.
    // Transfer unread notices rather than trimming a history buffer: a bulk
    // completion or restored run must not lose observations before the next frame.
    for (const n of (game.notices || []).splice(0))
      if (n.id > state.lastId) {
        state.waiting.push(n);
        state.lastId = n.id;
      }
    state.active = state.active.filter((n) => now < n.until);
    // Nonurgent reading waits for a quiet interval, including incoming shots and
    // nearby lingering hazards after the last attacker falls or disengages.
    const readers = [game.hero, ...game.activeLivingParty()];
    const nearReaders = (e, radius) =>
      readers.some((u) => Math.hypot(e.x - u.x, e.y - u.y) < radius);
    const inCombat =
      game
        .zone()
        .enemies.some(
          (e) =>
            e.hp > 0 &&
            !e.neutral &&
            !game.attackResetProtected(e) &&
            (e.aggro || e.telegraph || e.rangedAim) &&
            nearReaders(e, 900),
        ) ||
      game.s.projectiles.some((p) => p.source === 'enemy' && p.life > 0 && nearReaders(p, 900)) ||
      game.s.hazards.some((a) => a.life > 0 && nearReaders(a, (a.radius || 0) + 220));
    if (inCombat) state.quietAfter = now + 2500;
    const canNarrate =
      !inCombat &&
      now >= state.quietAfter &&
      game.hero.hp > 0 &&
      !menu &&
      !paused &&
      focused &&
      !document.hidden &&
      !game.s.challenge.pending &&
      !game.s.challenge.gameOver;
    // Hide an already-visible nonurgent card as soon as danger resumes; preserve
    // the notice and its full reading time for the next safe opportunity.
    if (!canNarrate && state.active.some((n) => n.kind !== 'warning')) {
      const interrupted = state.active
        .filter((n) => n.kind !== 'warning')
        .map(({ until, ...notice }) => notice);
      state.active = state.active.filter((n) => n.kind === 'warning');
      state.waiting.unshift(...interrupted);
    }
    if (
      state.active.some((n) => n.kind === 'narration') &&
      (!canNarrate || state.waiting.some((n) => n.kind !== 'narration'))
    ) {
      const interrupted = state.active
        .filter((n) => n.kind === 'narration')
        .map(({ until, ...notice }) => notice);
      state.active = state.active.filter((n) => n.kind !== 'narration');
      state.waiting.unshift(...interrupted);
    }
    while (state.active.length < 2 && state.waiting.length) {
      // Existing milestones retain their full duration. New warnings lead the
      // waiting queue, while a story is shown only when both slots are clear.
      const warningIndex = state.waiting.findIndex((n) => n.kind === 'warning');
      const milestoneIndex = canNarrate
        ? state.waiting.findIndex((n) => n.kind !== 'narration')
        : -1;
      const index = warningIndex >= 0 ? warningIndex : milestoneIndex;
      if (index < 0 && (!canNarrate || state.active.length)) break;
      const [notice] = state.waiting.splice(index < 0 ? 0 : index, 1);
      state.active.push({
        ...notice,
        until: now + (notice.duration || 5.5) * 1000,
      });
    }
    const rendered = state.active.map((n) => n.id).join(',');
    if (rendered !== state.rendered) {
      state.rendered = rendered;
      host.replaceChildren(
        ...state.active.map((n) => {
          const card = document.createElement('div');
          card.className =
            'notice-card notice-' +
            (n.kind === 'narration' || n.kind === 'warning' ? n.kind : 'milestone');
          if (n.kind === 'warning') card.setAttribute('role', 'alert');
          card.textContent = n.text;
          if (n.detail) {
            const detail = document.createElement('small');
            detail.className = 'notice-detail';
            detail.textContent = n.detail;
            card.append(detail);
          }
          return card;
        }),
      );
    }
    host.classList.toggle('visible', state.active.length > 0);
    host.classList.toggle(
      'wide-notice',
      state.active.some(
        (n) => n.kind === 'narration' || n.text.length + (n.detail?.length || 0) > 90,
      ),
    );
    // The separate short-lived phone status must stay below the amber stack.
    if (platform.mode === 'phone')
      $('status').style.top = state.active.length
        ? Math.ceil(host.getBoundingClientRect().bottom + 8) + 'px'
        : '';
    else $('status').style.top = '';
  }
  const developerSummonButton = document.createElement('button');
  developerSummonButton.id = 'developer-summon';
  developerSummonButton.textContent = 'Summon';
  developerSummonButton.setAttribute('aria-label', 'Summon a regional boss or captain');
  developerSummonButton.hidden = true;
  document.body.append(developerSummonButton);
  const developerCombatMonitor = document.createElement('aside');
  developerCombatMonitor.id = 'developer-combat-monitor';
  developerCombatMonitor.setAttribute('aria-label', 'Developer combat monitor');
  developerCombatMonitor.hidden = true;
  document.body.append(developerCombatMonitor);
  function openDeveloperSummonMenu() {
    if (!activePlay() || game.s.mode !== 'developer') return;
    openMenu(
      'Developer · Summon',
      'Summon a hostile regional boss (regular or TRUE) or captain. No campaign rewards or victory progress.',
      game.developerSummonOptions().map((entry) =>
        action(entry.label, () => {
          const enemy = game.developerSummon(entry.id);
          closeMenu();
          if (enemy) status('Summoned ' + enemy.name);
        }),
      ),
      closeMenu,
    );
  }
  developerSummonButton.onclick = openDeveloperSummonMenu;
  const hudMarkup = new Map();
  function setMarkup(id, html) {
    if (hudMarkup.get(id) !== html) {
      $(id).innerHTML = html;
      hudMarkup.set(id, html);
    }
  }
  function updateHUD() {
    const devActive = started && game.s.mode === 'developer';
    developerSummonButton.hidden = !devActive;
    developerCombatMonitor.hidden = !devActive;
    if (devActive) {
      const telemetry = game.developerCombatSnapshot(),
        recent = (hits) => hits.map((hit) => Math.round(hit)).join(' / ') || '—';
      developerCombatMonitor.textContent =
        'DEV · COMBAT MONITOR\n' +
        'Taken: ' +
        recent(telemetry.incoming.last) +
        '\n' +
        'Incoming DPS: ' +
        telemetry.incoming.dps.toFixed(1) +
        '\n' +
        'Dealt: ' +
        recent(telemetry.outgoing.last) +
        '\n' +
        'Outgoing DPS: ' +
        telemetry.outgoing.dps.toFixed(1);
    }
    const h = game.hero,
      hp = Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100)),
      mp = manaEnabled ? Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100)) : 0;
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
        : 'Talents · press ' + input.key('training');
    let heroMarkup =
      '<div class="hero-title"><span>' +
      Campaign.classes[h.class].icon +
      ' ' +
      game.heroDisplayName() +
      '</span><small>' +
      (language === 'es' ? 'NIVEL ' : 'LEVEL ') +
      h.level +
      '</small></div><div class="resource-line health"><span>HP ' +
      Math.ceil(h.hp) +
      ' / ' +
      h.maxHp +
      '</span><i style="--fill:' +
      hp +
      '%"></i></div>' +
      (manaEnabled
        ? '<div class="resource-line mana"><span>MP ' +
          Math.floor(h.mp) +
          ' / ' +
          h.maxMp +
          '</span><i style="--fill:' +
          mp +
          '%"></i></div>'
        : '') +
      '<div class="wallet"><span class="gold">' +
      Math.floor(h.gold) +
      (language === 'es' ? ' coronas</span><span>XP ' : ' crowns</span><span>XP ') +
      Math.floor(h.xp) +
      ' / ' +
      game.xpRequired(h.level) +
      '</span></div>';
    const heroEffects = h.supportEffects || [],
      activeRecovery = heroEffects
        .filter((e) => manaEnabled || e.type === 'health')
        .sort((a, b) => a.seconds - b.seconds)[0];
    if (activeRecovery)
      heroMarkup +=
        '<small class="restoring">Ranger restoring ' +
        (activeRecovery.type === 'health' ? 'HP' : 'MP') +
        ' · ' +
        activeRecovery.seconds.toFixed(1) +
        's</small>';
    if (h.slow > 0)
      heroMarkup +=
        '<small class="restoring" aria-label="Slowed: movement and skill recovery reduced">Slow · movement + recovery ↓</small>';
    setMarkup('hero-stats', heroMarkup);
    if (statusUntil && performance.now() >= statusUntil) {
      $('status').textContent = '';
      statusUntil = 0;
    }
    const rangers = game.activeLivingParty().filter((u) => u.type === 'archer');
    $('quick-items').classList.toggle('has-rangers', rangers.length > 0);
    for (const [type, label, key, cdKey, threshold] of manaEnabled
      ? [
          ['health', 'Heal', input.key('heal'), 'healCd', 50],
          ['mana', 'Mana Regen', input.key('mana'), 'manaCd', 35],
        ]
      : [['health', 'Heal', input.key('heal'), 'healCd', 50]]) {
      const b = $(type + '-potion'),
        ready = rangers.filter((u) => (u[cdKey] || 0) <= 0).length,
        full =
          type === 'health'
            ? [h, ...game.activeLivingParty()].every((u) => u.hp >= u.maxHp)
            : h.mp >= h.maxMp,
        next = rangers.length ? Math.min(...rangers.map((u) => u[cdKey] || 0)) : 0;
      const recovering = type === 'mana' && game.hasSupportEffect(h, 'mana');
      b.disabled = !rangers.length || !ready || full || recovering;
      b.hidden = platform.mode === 'phone' && !rangers.length;
      setMarkup(
        type + '-potion',
        label +
          '<small><span class="key-hint">' +
          key +
          ' · </span>' +
          (recovering
            ? 'Restoring'
            : ready
              ? ready + ' ready'
              : rangers.length
                ? next.toFixed(1) + 's'
                : 'Need Ranger') +
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
      ? game.s.finalRestCompleted
        ? 'PEACE · Journey complete. Explore the creatures’ new homes.'
        : 'PEACE · Rest at a refuge, preparation fountain or completed Barracks.'
      : game.s.phase === 'awakening' && !game.s.throneClaimed
        ? 'DARK CROWN · Claim the Throne · Fortress courtyard, near (3250, 3090) · Map: Z'
        : liveFieldTrue
          ? 'TRUE BOSS · ' +
            liveFieldTrue.name +
            ' is roaming ' +
            game.definition().name +
            (liveFieldTrue.family === 'thorn'
              ? ' · Scout tracks / Orchard trail witness'
              : ' · Map: Z')
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

    // The HUD objective is generated by the engine; keep proper names and
    // quest state untouched, but localize the shared dynamic guidance.
    $('objective').textContent = tr($('objective').textContent);
    $('objective').title = $('objective').textContent;
    const doctrine = game.squadDoctrineLabel(),
      squad = $('squad-button');
    squad.hidden = (game.s.expeditionRank || 1) < 3 || !doctrine.active;
    squad.textContent = tr('Squad') + ' · ' + doctrine.label + ' · ' + input.key('doctrine');
    squad.title = doctrine.boss
      ? doctrine.mode === 'focus'
        ? 'BOSS priority: the squad obeys your order to attack the boss, even with active adds'
        : 'ADDS: ignore the boss while adds or attackers remain; resume the boss once clear, then switch back for new adds'
      : doctrine.mode === 'focus'
        ? 'Squad concentrates on the hero’s current target'
        : 'Squad spreads across nearby threats';
    for (let i = 0; i < 8; i++) {
      const slot = i + 1,
        b = $('skill-' + slot),
        rank = h.skills[i],
        cast = charge?.slot === slot ? chargePresentation() : null,
        charging = !!cast;
      b.disabled = game.s.mode === 'developer' && slot === 1;
      b.classList.toggle('locked', !rank || b.disabled);
      b.classList.toggle('charging', charging);
      b.classList.toggle('skill-ready', !!rank && h.cd[i] <= 0 && !charging);
      const revealed = game.skillRevealed(slot),
        chargeTip = canChargeSlot(slot)
          ? ' · Tap under ' +
            chargeTapSeconds().toFixed(2) +
            's for normal · hold ' +
            chargeSeconds().toFixed(2) +
            's for charged' +
            (manaEnabled
              ? ' · Charged cost ' + chargedManaPercent(slot) + '% max MP'
              : ' · charged cooldown ' + game.skillCooldown(slot, true).toFixed(1) + 's')
          : '';
      b.title =
        (revealed ? skillLabel(slot) : 'Undiscovered skill') +
        (b.disabled ? ' · Disabled in Developer Mode' : '') +
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
          (revealed ? skillLabel(slot) : 'Undiscovered') +
          (canChargeSlot(slot)
            ? ' · tap for normal or hold to charge' +
              (manaEnabled ? ' · charged cost ' + chargedManaPercent(slot) + ' percent max MP' : '')
            : ''),
      );
      if (b.firstChild?.nodeType === 3)
        b.firstChild.textContent =
          {
            paladin: { 2: 'SUN', 3: 'SHLD', 4: 'JUDGE' },
            mage: { 2: 'FROST', 3: 'STOP', 4: 'ARC' },
            ranger: { 2: 'PIN', 3: 'HEAL', 4: 'HASTE' },
          }[h.class]?.[slot] || icons[i];
      b.querySelector('small').textContent = b.disabled
        ? 'OFF'
        : charging
          ? cast.state === 'waiting'
            ? 'WAIT ' + cooldownText(cast.cooldown)
            : cast.state === 'interrupted'
              ? 'BROKEN'
              : cast.state === 'charging'
                ? Math.min(99, Math.round(cast.progress * 100)) + '%'
                : cast.state === 'need-mp'
                  ? 'NEED MP'
                  : cast.state === 'no-target'
                    ? 'NO TARGET'
                    : cast.state === 'no-heal'
                      ? 'NO HEAL'
                      : cast.state === 'no-allies'
                        ? 'NO ALLIES'
                        : 'CHARGED'
          : slot === 3 && h.class === 'paladin' && h.shieldStance > 0
            ? 'SHIELD ' + cooldownText(h.shieldStance)
            : !rank
              ? 'Locked'
              : h.cd[i] > 0
                ? cooldownText(h.cd[i])
                : skillKeys()[i];
    }
    const n = nearestNPC();
    $('touch-interact-button').hidden = !n || !activePlay();
    setMarkup('touch-interact-button', tr('Interact'));
    $('touch-interact-button').title = n ? n.name : '';
    $('order-button').textContent = tr('Confirm');
    $('desktop-hints').textContent =
      ['up', 'left', 'down', 'right'].map((id) => input.key(id)).join('') +
      ' · ' +
      tr('Move') +
      '   ' +
      input.key('target') +
      ' · ' +
      tr('Target') +
      '   ' +
      input.key('confirm') +
      ' · ' +
      tr('Interact') +
      '   ' +
      input.key('map') +
      ' · ' +
      tr('Map') +
      '   Esc · ' +
      tr('Menu');
    $('talent-button').querySelector('small').textContent = input.key('training');
    if ($('squad-button').querySelector('small'))
      $('squad-button').querySelector('small').textContent = input.key('doctrine');
    if ($('recall-button').querySelector('small'))
      $('recall-button').querySelector('small').textContent =
        input.key('recall') + (input.actionFor('KeyQ') === 'recall' ? ' / Q' : '');
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
    syncPartyChargeClock();
    if (document.hidden) {
      runtime.suspend();
      fps.suspend();
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
      // A held charged skill must not secretly resume after a damaging hit.
      // A genuine sub-0.2s tap is still an ordinary, immediate skill.
      if (
        charge &&
        charge.started !== null &&
        game.partyChargeState(game.hero)?.interrupted &&
        game.partyChargeNow() - charge.started >= chargeTapSeconds()
      ) {
        cancelCharge();
        status('Charged skill interrupted by damage.');
      }
      observeChargeFeedback();
      if (
        game.s.mode !== 'developer' &&
        (x || y || was.order) &&
        charge?.slot !== 1 &&
        game.hero === movingHero &&
        PrototypeRules.movementBasicClasses[movingHero.class] &&
        game.zoneId === was.zone &&
        game.s.statistics.deaths === was.deaths &&
        Math.hypot(movingHero.x - was.x, movingHero.y - was.y) > 0.25
      )
        game.castMovementBasic();
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
    renderer.update(frozen ? 0 : dt);
    for (const e of events) {
      audio.effect(e);
      if (e.type === 'chargeInterrupted' && e.target === 'hero')
        status('Charged skill interrupted.');
      if (e.type === 'actionFailed' && e.reason === 'crowns')
        status('Need ' + e.needed + ' crowns.');
    }
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
          'archiveKnowledge',
          'travel',
          'death',
          'successor',
          'gameOver',
        ].includes(e.type),
      )
    )
      save();
    if (events.some((e) => e.type === 'peace')) ending();
    if (game.s.phase === 'awakening' && !game.s.awakeningAck && !menu) awakeningMenu();
    if (game.s.challenge.pending && !gateDismissed && menu?.title !== 'Choose your successor')
      successionMenu();
    if (game.s.challenge.gameOver && !gateDismissed && !menu) gameOver();
    if (game.peace && game.s.finalRestCompleted && !game.s.endingAck && !menu) ending();
    hudTimer += dt;
    if (hudTimer > 0.15) {
      hudTimer = 0;
      updateHUD();
    }
    if (!frozen) {
      const draw = fps.shouldDraw(now);
      if (draw) runtime.record(now, frameStart, () => renderer.draw());
      fps.observe(now, performance.now() - frameStart, draw);
    } else {
      fps.suspend();
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
    fps.suspend();
  });
  updateHUD();
  if (!loaded) chooseLanguage(developerEnabled ? 'developer' : 'normal');
  else setLanguage(language);
  requestAnimationFrame(frame);
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  addEventListener('appinstalled', () => {
    installPrompt = null;
    status('Game installed. Open it from your home screen.');
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
