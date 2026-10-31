/* Browser shell. Saved campaign rules are independent of this UI. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id),
    canvas = $('world'),
    ctx = canvas.getContext('2d'),
    D = Campaign.data,
    manaEnabled = PrototypeRules.resourceMode.manaEnabled,
    developerEnabled = /(?:^|[?&])developer=1(?:&|$)/.test(window.location?.search || ''),
    // Unlisted low-spec test route. A query link is not authentication.
    combatDiagnosticsEnabled = /(?:^|[?&])combatDiagnostics=1(?:&|$)/.test(
      window.location?.search || '',
    );
  // Quiet fourth-class release. Register before profile/load/save validation,
  // New Game and Succession; v4 storage keys and original classes stay intact.
  Campaign.enableRoguePlaytest();
  // Dev.170 is a one-time upgrade to the recommended performance baseline.
  // Deliberately supersede earlier device choices once, before any controllers
  // read them. Never touch campaigns, audio, language, controls or renderer.
  const performanceBaselineKey = 'azeroth-performance-defaults-dev170-v1';
  function applyPerformanceBaseline(storage) {
    try {
      if (storage.getItem(performanceBaselineKey) === 'applied') return false;
      for (const [key, value] of [
        ['azeroth-fps-v1', 'auto'],
        ['azeroth-adaptive-frame-skip-v1', 'on'],
        ['azeroth-render-resolution-v1', 'auto'],
        ['azeroth-optimization-mode-v1', 'off'],
        ['azeroth-camera-v2', JSON.stringify({ desktop: 1.5, phone: 1.5 })],
      ])
        storage.setItem(key, value);
      // The marker is written LAST, only after the baseline is durable.
      // Later player adjustments must remain their own choices.
      storage.setItem(performanceBaselineKey, 'applied');
      return true;
    } catch (_) {
      // Restricted storage keeps the game's existing safe in-memory defaults.
      return false;
    }
  }
  const performanceBaselineUpgraded = applyPerformanceBaseline(localStorage);

  // One-time device upgrade: Auto is the new optimization default, including
  // for previously saved On/Off choices. Subsequent user choices persist.
  // Campaign saves, FPS choices and other settings are not touched.
  const optimizationKey = 'azeroth-optimization-mode-v1';
  const optimizationAutoUpgradeKey = 'azeroth-optimization-auto-default-v1';
  function upgradeOptimizationAuto(storage) {
    try {
      if (storage.getItem(optimizationAutoUpgradeKey) === 'applied') return false;
      storage.setItem(optimizationKey, 'auto');
      storage.setItem(optimizationAutoUpgradeKey, 'applied');
      return true;
    } catch (_) { return false; }
  }
  const optimizationAutoUpgraded = upgradeOptimizationAuto(localStorage);
  let optimizationPreference = 'auto';
  try {
    const saved = localStorage.getItem(optimizationKey);
    if (['off', 'auto', 'on'].includes(saved)) optimizationPreference = saved;
  } catch (_) {}
  // Runtime state is distinct from the stored preference and never a save field.
  let optimizationMode = optimizationPreference === 'on';

  // Presentation-only community localization; campaign IDs and names never change.
  const languageKey = 'azeroth-display-language-v1';
  let language = 'en';
  try {
    language = localStorage.getItem(languageKey) === 'es' ? 'es' : 'en';
  } catch (_) {}
  document.documentElement.lang = language === 'es' ? 'es-419' : 'en';
  const spanishText = {
    'Try recovery': 'Intentar recuperar',
    'Recovery options': 'Opciones de recuperación',
    'Choose a recoverable run to review. Nothing is replaced until you confirm.':
      'Elige una partida recuperable para revisarla. Nada se reemplaza hasta que confirmes.',
    'No usable local checkpoint was found. Import a backup, or export the original for investigation.':
      'No se encontró un punto de recuperación local utilizable. Importa una copia de seguridad o exporta el original para investigarlo.',
    'The main save is missing. Try a recovery checkpoint or import a backup.':
      'Falta la partida principal. Intenta recuperarla desde un punto guardado o importa una copia de seguridad.',
    'Review recovery': 'Revisar recuperación',
    'Recover this run': 'Recuperar esta partida',
    Checkpoint: 'Punto de recuperación',
    'Compatible saved run': 'Partida compatible',
    'Preserved original': 'Original conservado',
    'Legacy saved run': 'Partida antigua',
    Saved: 'Guardado',
    'Date unavailable': 'Fecha no disponible',
    Level: 'Nivel',
    'Saved run unavailable. Try recovery or import a backup.':
      'Partida guardada no disponible. Intenta recuperarla o importa una copia de seguridad.',
    'Restoring this run may lose progress made after this checkpoint. Your unreadable original will remain preserved.':
      'Recuperar esta partida puede perder avances posteriores a este punto. Se conservará el original que no se pudo abrir.',
    'Run recovered successfully.': 'Partida recuperada correctamente.',
    'Recovery failed. Your original save was kept. Export it before closing.':
      'La recuperación falló. Se conservó tu partida original. Expórtala antes de cerrar.',
    'Saved locally, but a recovery checkpoint could not be stored. Export a backup.':
      'Partida guardada localmente, pero no se pudo guardar un punto de recuperación. Exporta una copia de seguridad.',
    'Saved run could not be opened': 'No se pudo abrir la partida guardada',
    'Your original save is protected. Import a backup or export the original before starting a new run.':
      'Tu partida original está protegida. Importa una copia de seguridad o exporta el original antes de empezar una partida nueva.',
    'Export original save': 'Exportar partida original',
    'Saved game is protected': 'La partida guardada está protegida',
    'Open the game in an updated browser to continue safely. You can still export this run.':
      'Abre el juego en un navegador actualizado para continuar de forma segura. Aún puedes exportar esta partida.',
    'Another window may have newer progress. Close the other game window, then reload here to continue. Export this run first to keep its unsaved progress.':
      'Otra ventana puede tener avances más recientes. Cierra la otra ventana del juego y recarga esta para continuar. Exporta primero esta partida para conservar sus avances sin guardar.',
    'Reload this window': 'Recargar esta ventana',
    'Crystal Deposit': 'Yacimiento de Cristales',
    'Veyra’s private quarters': 'Aposentos privados de Veyra',
    'Purchased preserves': 'Conservas compradas',
    'Working signal station': 'Estación de señales en servicio',
    'Scornfang memoranda': 'Memorandos de Scornfang',
    'Critically wounded companions are keeping their distance.':
      'Los compañeros con heridas críticas están manteniendo la distancia.',
    'Safe attacks and skills remain available; retreat comes first.':
      'Pueden usar ataques y habilidades seguros; retirarse tiene prioridad.',
    'Choose your language': 'Elige tu idioma',
    'Adventure menu': 'Menú de aventura',
    'Game and settings': 'Juego y ajustes',
    'Challenge condition': 'Tipo de desafío',
    'Standard death and refuge recovery': 'Muerte normal y recuperación en refugio',
    'Succession challenge': 'Desafío de sucesión',
    Controls: 'Controles',
    'Combat conditions': 'Estados de combate',
    'Customize keyboard': 'Personalizar teclado',
    'Right-hand skills (WASD) · Default': 'Habilidades con mano derecha (WASD) · Predeterminado',
    'Classic · number keys': 'Clásico · teclas numéricas',
    'Left-hand skills (IJKL)': 'Habilidades con mano izquierda (IJKL)',
    'Apply keyboard preset': 'Aplicar distribución de teclado',
    'Apply preset': 'Aplicar distribución',
    'Keep current keys': 'Conservar teclas actuales',
    'Touch and mouse options': 'Opciones táctiles y de ratón',
    'Screen and performance': 'Pantalla y rendimiento',
    'Gather resources': 'Recolectar recursos',
    'The ferry crosses a sheltered coastal channel from Lantern Shore’s mangrove inlet to Stonecross’s western landing. The Ironroot dock connects directly to the hardwood forest and mint town.':
      'El ferry cruza un canal costero resguardado desde la ensenada de manglares de Lantern Shore hasta el embarcadero occidental de Stonecross. El muelle de Ironroot conecta directamente con el bosque caducifolio y el pueblo de la ceca.',
    'Hidden Highlands tribute': 'Tributo oculto de las Highlands',
    'Ask about the regional tribute and search facilities.':
      'Preguntar por el tributo regional y los medios para buscarlo.',
    'Crag Tyrant took precautions and hid the region’s Dark Lord Tribute among its stores. No one in town knows where he put it. This supply post can receive recovered cargo, but it has no facilities to organize a search. Use a completed Barracks to send workers to investigate the Highlands, and escort them to the sites.':
      'Crag Tyrant tomó precauciones y ocultó el tributo del Dark Lord de la región entre sus almacenes. Nadie en el pueblo sabe dónde lo puso. Este puesto de suministros puede recibir la carga recuperada, pero no tiene los medios para organizar una búsqueda. Usa un cuartel terminado para enviar trabajadores a investigar las Highlands y escóltalos hasta los lugares.',
    'Organize Highlands searches from a completed Barracks.':
      'Organiza las búsquedas en las Highlands desde un cuartel terminado.',
    'Investigate the stores with idle troops. Escort them to the site; tribute is revealed only after their search.':
      'Investiga los almacenes con tropas disponibles. Escóltalas hasta el lugar; el tributo solo se descubre tras su búsqueda.',

    'Resource expeditions': 'Expediciones de recursos',
    'Choose expedition companion': 'Elegir compañero de expedición',
    'No resource companion available': 'No hay compañeros recolectores disponibles',
    'No earlier regions': 'No hay regiones anteriores',
    'Expedition returned': 'Regresó la expedición',
    'Tribute delivered': 'Tributo entregado',
    'Locate & gather hidden Dark Lord Tribute':
      'Localizar y recolectar tributo oculto del Dark Lord',
    'Tribute collection and delivery. Visiting unloads all company cargo, including resting and fallen companions. Rangers provide Heal in the field.':
      'Recolección y entrega de tributo. Al visitar, se descarga toda la carga de la compañía, incluidos los compañeros en reserva y caídos. Los Rangers curan en el campo.',
    'All idle gatherers work one selected tribute site. Escort them along the waypoint; combat pauses work. Supplies unloads all company cargo. Hidden sources can be located here.':
      'Todos los recolectores disponibles trabajan en el tributo elegido. Escóltalos siguiendo la ruta; el combate pausa el trabajo. Suministros descarga toda la carga de la compañía. Aquí puedes localizar tributos ocultos.',
    'An idle gatherer is needed.': 'Necesitas un recolector disponible.',
    'An idle gatherer and an unexhausted tribute site are required.':
      'Necesitas un recolector disponible y un tributo sin agotar.',
    'This companion cannot gather resources.': 'Este compañero no puede recolectar recursos.',
    'Includes resting and fallen companions.': 'Incluye a los compañeros en reserva y caídos.',
    'Story guide': 'Guía de la historia',
    'All pending quests': 'Todas las misiones pendientes',
    'Completed quests': 'Misiones completadas',
    'No pending quests': 'No hay misiones pendientes',
    'No completed quests': 'No hay misiones completadas',
    'Clear waypoint': 'Quitar ruta',
    'Cancel navigation': 'Cancelar ruta',
    'Map of the current area. Select a place to navigate.':
      'Mapa de la zona actual. Selecciona un lugar para navegar.',
    'Tap a pending quest to track its next objective. The waypoint remains during combat. Rewards are delivered automatically.':
      'Toca una misión pendiente para seguir su próximo objetivo. La ruta permanece durante el combate. Las recompensas se entregan automáticamente.',
    'Rescued specialists': 'Especialistas rescatados',
    'Build in the field, outside dungeons': 'Construye en el campo, fuera de las mazmorras',
    'An idle active Soldier or Ranger is needed':
      'Se necesita un soldado o explorador activo sin tarea',
    'Choose tribute for idle companions to gather':
      'Elige el tributo que recogerán los compañeros sin tarea',
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
    'New Combat Diagnostics run': 'Nueva partida de Diagnóstico de combate',
    'Load Combat Diagnostics run': 'Cargar partida de Diagnóstico de combate',
    'Combat Arena': 'Arena de combate',
    'Combat Arena · destinations': 'Arena de combate · destinos',
    'Arena Guide': 'Guía de la arena',
    'Free recovery': 'Recuperación gratis',
    'Level Trainer': 'Entrenador de niveles',
    'Install on phone': 'Instalar en el teléfono',
    'Install game': 'Instalar juego',
    'Check for game update': 'Buscar actualización',
    'Install available game update': 'Instalar actualización',
    'Update available': 'Actualización disponible',
    'Open game menu': 'Abrir menú del juego',
    'Checking for a game update…': 'Buscando una actualización…',
    'Downloading the game update… You can keep playing.':
      'Descargando la actualización… Puedes seguir jugando.',
    'Map and travel routes': 'Mapa y rutas de viaje',
    'Quest journal': 'Diario de misiones',
    'Story journal': 'Guía de la historia',
    Announcements: 'Anuncios',
    'Earned lore and recent announcements. Select an entry to read the full text.':
      'Historia descubierta y anuncios recientes. Selecciona uno para leer el texto completo.',
    'Full text: Menu · Announcements': 'Texto completo: Menú · Anuncios',
    'Local quests': 'Misiones de la región',
    'Inventory and support': 'Inventario y apoyo',
    Inventory: 'Inventario',
    'Skill journal': 'Diario de habilidades',
    Talents: 'Talentos',
    'Open Talents': 'Abrir talentos',
    'Lantern Shore is held by the night Wraiths. Clear them before departure, or wait for daylight.':
      'Los Wraiths nocturnos ocupan Lantern Shore. Derrótalos para partir o espera a que amanezca.',
    Training: 'Entrenamiento',
    Character: 'Personaje',
    'Optional · choose once': 'Opcional · se elige una vez',
    'Equipment, Ranger support and Preparation Tonics.':
      'Equipo, apoyo del Ranger y tónicos de preparación.',
    'A separate permanent name for your reign': 'Otro nombre permanente para tu reinado',
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
    'Gathering route is blocked by terrain.': 'El terreno bloquea la ruta de recolección.',
    'Try another resource site or Recall the squad.':
      'Prueba otro recurso o reagrupa al escuadrón.',
    '“I return by choice. The soaked pages still need drying, and the damaged shelves need care.” Neri offers her usual tonics and training here.':
      '«Vuelvo porque quiero. Las páginas mojadas aún necesitan secarse, y las estanterías dañadas necesitan cuidados». Neri ofrece aquí sus tónicos y entrenamientos habituales.',
    'Return death recovery to refuge': 'Volver al refugio al morir',
    'Set death recovery point': 'Establecer punto de reaparición',
    'Enter dungeon': 'Entrar en la mazmorra',
    'Build Barracks & set recovery': 'Construir cuartel y fijar reaparición',
    'Finish Barracks & set recovery': 'Terminar cuartel y fijar reaparición',
    'Use nearby Barracks & set recovery': 'Usar cuartel cercano y fijar reaparición',
    'Leaving resets an unfinished encounter. Defeated leaders keep their normal return time; earned progress stays saved.':
      'Al salir se reinicia un encuentro no terminado. Los líderes derrotados conservan su tiempo normal de regreso; tu progreso ganado se conserva.',
    'Enter, or prepare your recovery camp outside.':
      'Entra o prepara tu campamento de recuperación fuera.',
    'Reuse this camp for recovery and companion services.':
      'Usa este campamento para recuperarte y atender a tus compañeros.',
    'Visit the dungeon entrance to prepare a camp.':
      'Acércate a la entrada de la mazmorra para preparar un campamento.',
    'Succession uses successors instead of recovery points.':
      'Sucesión usa sucesores en lugar de puntos de reaparición.',
    'End nearby combat before preparing your camp.':
      'Termina el combate cercano antes de preparar tu campamento.',
    'An idle active Soldier or Ranger is needed to build. Recall workers or recover a fallen companion first.':
      'Necesitas un Soldado o Ranger activo y libre para construir. Reagrupa a los trabajadores o recupera a un compañero caído primero.',
    'Your companion is building outside the dungeon. Stay outside until construction finishes; this camp will then become your recovery point.':
      'Tu compañero construye fuera de la mazmorra. Quédate fuera hasta que termine; entonces este campamento será tu punto de reaparición.',
    'Recover here within this region. Entering another region switches to its refuge.':
      'Reaparece aquí dentro de esta región. Al entrar en otra región, usarás su refugio.',
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
    'Ranger Heal queued for the hero.': 'Curación del Ranger en cola para el héroe.',
    'Heal queued for the hero.': 'Curación en cola para el héroe.',
    'Command Heal': 'Ordenar Curar',
    'No active companion can use Heal.': 'Ningún compañero activo puede usar Curar.',
    'Healer cannot use Heal while silenced.': 'El sanador no puede usar Curar mientras esté silenciado.',
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
    'observe Lantern Shore after dark': 'observa Lantern Shore de noche',
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
    'The Dark Lord rules the land. To keep heroes from becoming strong enough to challenge him, his forces have captured the specialists who teach skills, forge equipment and prepare adventurers. Free them, rebuild your strength and confront his rule.\n\nSuccession is optional. Each fallen class is lost for this run; after four class deaths the run ends.':
      'El Dark Lord gobierna estas tierras y mantiene cautivos a los especialistas que enseñan habilidades, forjan equipo y preparan aventureros. Rescátalos, recupera fuerzas y desafía su dominio.\n\nSucesión es opcional: cada clase que cae se pierde durante esta partida. Si mueren las cuatro, la partida termina.',
    'All three classes have fallen. This run is over. Its progress remains available for export; continuing it is disabled.':
      'Las tres clases han caído. Esta partida terminó. Puedes exportar su progreso, pero no continuarla.',
    'All four classes have fallen. This run is over. Its progress remains available for export; continuing it is disabled.':
      'Las cuatro clases han caído. Esta partida terminó. Puedes exportar su progreso, pero no continuarla.',
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
      "Recover 2 caches from Scornfang's Treasury",
      'Recupera 2 escondites del tesoro de Scornfang.',
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
      'Visit Lantern Shore at night; defeat 2 wraiths',
      'Visita Lantern Shore de noche y derrota a 2 wraiths.',
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
      'Ore Workers at Risk',
      'Mineros en peligro',
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
  Object.assign(spanishText, {
    'Your First Company': 'Tu primera compañía',
    'Quest board': 'Tablón de misiones',
    'Side Quests': 'Misiones secundarias',
    'All side quests': 'Todas las misiones secundarias',
    'Story objectives': 'Objetivos de la historia',
    'Choose an objective to track it. Optional board tasks are in Side Quests.':
      'Elige un objetivo para seguirlo. Las tareas opcionales del tablón están en Misiones secundarias.',
    'Optional tasks, exploration and extra rewards.':
      'Tareas opcionales, exploración y recompensas adicionales.',
    'Meet the Captain, try Recall squad, then build your first Basic Barracks (free).':
      'Habla con el capitán, prueba Reagrupar y establece tu primer cuartel básico (gratis).',
    'Meet the town Captain to learn about your Soldier and Ranger.':
      'Habla con el capitán para conocer a tu Soldado y tu Ranger.',
    'Try Recall squad to bring your companions back to you.':
      'Prueba Reagrupar para que tus compañeros regresen contigo.',
    'COMPANIONS · Meet the town Captain to learn about your Soldier and Ranger. Your first Barracks is FREE: Open Menu/Esc in the field → Establish Basic Barracks.':
      'COMPAÑEROS · Habla con el capitán para conocer a tu Soldado y tu Ranger. El primer cuartel es GRATIS: abre Menú/Esc en el campo → Establecer cuartel básico.',
    'COMPANIONS · Try Recall squad to bring your companions back, then build your first Barracks — FREE. Open Menu/Esc in the field → Establish Basic Barracks.':
      'COMPAÑEROS · Prueba Reagrupar y construye tu primer cuartel GRATIS. Abre Menú/Esc en el campo → Establecer cuartel básico.',
    'Meet your company': 'Conoce a tu compañía',
    'Companion basics': 'Lo básico de tus compañeros',
    'Practice Recall squad': 'Probar Reagrupar',
    'Open recruitment': 'Abrir reclutamiento',
    'Roles and Recall.': 'Funciones y Reagrupar.',
    'Your Soldier and Ranger follow and fight automatically. Use Recall squad to regroup. Town hiring supports the first 3 companions; Expedition Rank 2 unlocks recruitment.':
      'Tu Soldado y tu Ranger te siguen y luchan automáticamente. Usa Reagrupar para reunirlos. El pueblo admite los primeros 3 compañeros; Expedición 2 desbloquea el reclutamiento.',
    'QUEUED · No crowns spent. Tap again to cancel, or choose another companion.':
      'EN COLA · No has gastado coronas. Toca de nuevo para cancelar o elige otro compañero.',
    'Not enough crowns. Tap to queue this recruit; payment and arrival happen only when every condition is met.':
      'No tienes suficientes coronas. Toca para dejar el recluta en cola; se pagará y llegará solo cuando se cumplan todos los requisitos.',
    'Town can employ only the first 3 companions.':
      'El pueblo solo puede contratar a los primeros 3 compañeros.',
    'Joins after training; a full active group sends the recruit to reserve.':
      'Se incorpora tras el entrenamiento; si el grupo está lleno, queda en reserva.',
    'Joins automatically when every condition is met; full group means reserve.':
      'Se incorpora automáticamente cuando se cumplen todos los requisitos; si el grupo está lleno, queda en reserva.',
    'Cancel queued recruitment': 'Cancelar reclutamiento en cola',
    'Queued recruitment cancelled. No crowns were spent.':
      'Reclutamiento en cola cancelado. No has gastado coronas.',
    'Joined your active group.': 'Se incorporó al grupo activo.',
    'Active group full. Resting in reserve.': 'El grupo activo está lleno. Descansa en reserva.',
    'Soldier recruited': 'Soldado reclutado',
    'Ranger recruited': 'Ranger reclutado',
    'Soldier recruitment queued. Tap the same choice to cancel.':
      'Soldado en cola de reclutamiento. Toca la misma opción para cancelar.',
    'Ranger recruitment queued. Tap the same choice to cancel.':
      'Ranger en cola de reclutamiento. Toca la misma opción para cancelar.',
    'Soldier: close combat.\nRanger: ranged attacks + healing.\nThey follow and fight automatically.\n\nRecall brings them back to you.':
      'Soldado: combate cercano.\nRanger: ataques a distancia + curación.\nTe siguen y luchan automáticamente.\n\nReagrupar los trae de vuelta.',
    'Recalled!\nOrders cancelled. Companions stay close and defend without chasing.\nGive a new order to send them out again.\n\nNext: build your first Barracks for FREE.':
      '¡Reagrupados!\nÓrdenes canceladas. Tus compañeros se quedan cerca y se defienden sin perseguir.\nDales una nueva orden para enviarlos de nuevo.\n\nDespués: construye tu primer cuartel GRATIS.',
    'Recruit companions or restore your company.\nShort on crowns? Tap an available service to queue it.':
      'Recluta compañeros o recupera tu compañía.\n¿Te faltan coronas? Toca un servicio disponible para dejarlo en cola.',
    'Recruit companions, treat party wounds for 30 crowns, or recover the fallen.\nShort on crowns? Tap an available service to queue it.':
      'Recluta compañeros, cura las heridas del grupo por 30 coronas o recupera a los caídos.\n¿Te faltan coronas? Toca un servicio disponible para dejarlo en cola.',
    'Recruit at a Barracks': 'Recluta en un cuartel',
    'Town limit: 3 companions, reserves included.':
      'Límite del pueblo: 3 compañeros, incluidas las reservas.',
    'No fallen companions.': 'No hay compañeros caídos.',
    'No wounded companions.': 'No hay compañeros heridos.',
    'Queued · tap to cancel. No crowns spent.': 'En cola · toca para cancelar. Sin gastar coronas.',
    'Short on crowns? Tap to queue.': '¿Te faltan coronas? Toca para dejarlo en cola.',
    'Full health for living companions.': 'Salud completa para los compañeros vivos.',
    'Full health for party.': 'Salud completa para el grupo.',
    'No wounds to treat.': 'No hay heridas que curar.',
    Hero: 'Héroe',
    'Treat wounds': 'Curar heridas',
    'Treat wounds heals the hero and living companions for 30 crowns. Fallen companions need separate recovery. Short on crowns? Tap to queue.':
      'Curar heridas restaura al héroe y sus compañeros vivos por 30 coronas. Los caídos necesitan recuperación aparte. ¿Te faltan coronas? Toca para dejarlo en cola.',
    'Treat party wounds or recover fallen companions.':
      'Cura las heridas del grupo o recupera compañeros caídos.',
    'Your field base. Recovery → Treat wounds heals your party for 30 crowns.':
      'Tu base de campo. Recuperación → Curar heridas restaura al grupo por 30 coronas.',
    'Party wounds treated. Fallen companions still require recovery.':
      'Las heridas del grupo han sido curadas. Los compañeros caídos necesitan recuperación aparte.',
    'Wounds treated': 'Heridas curadas',
    'Hero and wounded living companions restored to full health.':
      'El héroe y los compañeros vivos heridos recuperaron toda su salud.',
    'No requested party member is still wounded.':
      'Ningún miembro del grupo solicitado sigue herido.',
    "Rogue · Free slots when Charmed allies fall": "Pícara · Liberar espacios al caer compañeros encantados",
    "Rogue · Keep fallen Charmed allies in party slots": "Pícara · Conservar espacios para compañeros encantados caídos",
    "Rogue · Free slots when Charmed allies fall · SELECTED": "Pícara · Liberar espacios al caer compañeros encantados · SELECCIONADO",
    "Rogue · Keep fallen Charmed allies in party slots · SELECTED": "Pícara · Conservar espacios para compañeros encantados caídos · SELECCIONADO",
    "Default: fallen Charmed allies go to reserve. You can still recover them for 40 crowns; their field slot is free for a new Charm.": "Predeterminado: los encantados caídos pasan a reserva. Puedes recuperarlos por 40 coronas; su espacio queda libre para otro encantamiento.",
    "Fallen Charmed allies keep their occupied slot like other classes until recovered or manually rested. New Charms cannot take that slot.": "Los encantados caídos conservan su espacio como en las demás clases hasta recuperarlos o pasarlos manualmente a reserva. Otros encantamientos no pueden usarlo.",
    "Rogue only: Choose how FUTURE fallen Charmed allies occupy party slots. The default frees the slot by moving the fallen ally to reserve. Keeping the slot instead lets you recover that same ally into your active group later. Both modes preserve ownership and require paid recovery. Switching modes never moves existing fallen companions.": "Solo Pícara: elige qué ocurre con los espacios de los compañeros encantados que caigan EN EL FUTURO. De forma predeterminada pasan a reserva y liberan su espacio. Si lo conservas, podrás recuperar al mismo compañero dentro del grupo activo. Ambas opciones mantienen la propiedad y requieren pagar la recuperación. Cambiar de opción no mueve a los compañeros que ya hayan caído.",
    "Fallen Charmed allies will move to reserve, freeing their party slots.": "Los encantados caídos pasarán a reserva y liberarán su espacio del grupo.",
    "Fallen Charmed allies will keep their party slots until recovered or rested.": "Los encantados caídos conservarán su espacio hasta recuperarlos o pasarlos a reserva.",
    'Rogues do not hire Soldiers or Rangers. Charm eligible monsters in battle. The Captain can treat party wounds for 30 crowns or recover fallen companions.':
      'Las Pícaras no contratan Soldados ni Rangers. Encantan monstruos elegibles en combate. El capitán puede curar al grupo por 30 coronas o recuperar compañeros caídos.',
    'Safe conditions required.': 'Requiere condiciones seguras.',
    'Joins your group; full groups send recruits to reserve.':
      'Se une al grupo; si está lleno, queda en reserva.',
    'Leave town. Find open ground off the road.\nOpen Menu → Establish Basic Barracks (FREE).\nOne idle Soldier or Ranger builds it.':
      'Sal del pueblo. Busca terreno abierto fuera del camino.\nAbre Menú → Establecer cuartel básico (GRATIS).\nUn Soldado o Ranger libre lo construye.',
    'Leave town. Find open ground off the road.\nOpen Menu → Establish Basic Barracks (FREE).\nOne idle Soldier or Ranger builds it.\nOnce built: Treat wounds fully heals your party for 30 crowns when safe.':
      'Sal del pueblo. Busca terreno abierto fuera del camino.\nAbre Menú → Establecer cuartel básico (GRATIS).\nUn Soldado o Ranger libre lo construye.\nAl terminar: Curar heridas restaura la salud de tu grupo por 30 coronas cuando estés a salvo.',
    "Let's go": 'Vamos',
    "COMPANIONS · Recall practiced. Continue the Captain's briefing.":
      'COMPAÑEROS · Reagrupar practicado. Continúa la explicación del capitán.',
    "Continue the Captain's briefing for the next step.":
      'Continúa la explicación del capitán para el siguiente paso.',
    'Leave town → open ground off the road → Menu → Establish Basic Barracks (FREE).':
      'Sal del pueblo → terreno abierto fuera del camino → Menú → Establecer cuartel básico (GRATIS).',
    'FIELD BASE · Leave town → open ground off the road → Menu → Establish Basic Barracks (FREE).':
      'BASE DE CAMPO · Sal del pueblo → terreno abierto fuera del camino → Menú → Establecer cuartel básico (GRATIS).',
    'FIELD BASE · Construction in progress. Keep your builder assigned.':
      'BASE DE CAMPO · Construcción en curso. Mantén al constructor asignado.',
    'Open ground off the road. One companion builds it.':
      'Terreno abierto fuera del camino. Un compañero lo construye.',
    'Open ground off the road. One companion builds it. Once built: Treat wounds heals the party for 30 crowns.':
      'Terreno abierto fuera del camino. Un compañero lo construye. Al terminar, Curar heridas restaura la salud del grupo por 30 coronas.',
    'Try Recall now': 'Prueba Reagrupar ahora',
    'Try it now': 'Pruébalo ahora',
  });
  Object.assign(spanishText, {
    'Restore living wounded companions to full health.':
      'Restaura toda la salud de los compañeros vivos y heridos.',
    'Not enough crowns. Tap to queue; all other requirements must still hold when it executes.':
      'No tienes suficientes coronas. Toca para dejarlo en cola; los demás requisitos deben seguir cumpliéndose al ejecutarse.',
    'Basic barracks recovery is available from Expedition Rank 1.':
      'Los servicios de recuperación del cuartel básico están disponibles desde Expedición 1.',
    'Companion services require a living, available hero.':
      'Los servicios de compañeros requieren un héroe vivo y disponible.',
    'Companion services wait until nearby combat has ended.':
      'Los servicios de compañeros esperan a que termine el combate cercano.',
    'The source town Captain is no longer available.':
      'El capitán del pueblo donde lo pediste ya no está disponible.',
    'Finish building this Barracks before using companion services.':
      'Termina este cuartel antes de usar sus servicios de compañeros.',
    'No requested companion is still fallen.': 'Ninguno de los compañeros elegidos sigue caído.',
    'No requested companion is living and wounded.':
      'Ninguno de los compañeros elegidos está vivo y herido.',
    'A requested companion is away on a resource expedition.':
      'Un compañero elegido está en una expedición de recursos.',
    'Not enough crowns for companion care.':
      'No tienes suficientes coronas para atender a tus compañeros.',
    'Queued companion care is no longer needed. No crowns were spent.':
      'La atención en cola ya no es necesaria. No has gastado coronas.',
    'Queued companion care cancelled. No crowns were spent.':
      'Atención de compañeros en cola cancelada. No has gastado coronas.',
    'Companion recovery queued. Tap the same choice to cancel.':
      'Recuperación de compañero en cola. Toca la misma opción para cancelar.',
    'Companion treatment queued. Tap the same choice to cancel.':
      'Tratamiento de compañeros en cola. Toca la misma opción para cancelar.',
    'Companion recovered.': 'Compañero recuperado.',
    'Companion recovered': 'Compañero recuperado',
    'Living companions treated. Fallen companions still require recovery.':
      'Los compañeros vivos han sido tratados. Los caídos aún necesitan recuperación.',
    'Companions treated': 'Compañeros tratados',
    'Living wounded companions restored to full health.':
      'Los compañeros vivos y heridos recuperaron toda su salud.',
    'Executes automatically only when every condition is met.':
      'Se ejecuta automáticamente solo cuando se cumplen todos los requisitos.',
    'When multiple actions are ready, payment order is recovery, treatment, then recruitment.':
      'Si hay varias acciones listas, se paga primero la recuperación, luego el tratamiento y por último el reclutamiento.',
    'Tap again to cancel. No crowns spent.': 'Toca de nuevo para cancelar. No has gastado coronas.',
    'Tap again to cancel, or choose another companion. No crowns spent.':
      'Toca de nuevo para cancelar o elige otro compañero. No has gastado coronas.',
    'Requires safety from nearby combat.': 'Requiere estar fuera de peligro del combate cercano.',
  });
  Object.assign(spanishText, {
    'Basic Barracks': 'Cuartel básico',
    'Barracks under construction': 'Cuartel en construcción',
    Company: 'Compañía',
    Recovery: 'Recuperación',
    Training: 'Entrenamiento',
    Operations: 'Operaciones',
    Recruitment: 'Reclutamiento',
    'Manage group': 'Gestionar grupo',
    'Manage active group': 'Gestionar grupo activo',
    'Name companions': 'Nombrar compañeros',
    'Recruit companions': 'Reclutar compañeros',
    'Boss pet collection': 'Colección de mascotas de jefes',
    'Charmed monsters': 'Monstruos encantados',
    'Charmed creature': 'Criatura encantada',
    'Previous page': 'Página anterior',
    'Next page': 'Página siguiente',
    Page: 'Página',
    'Browse owned monster types and change their active status.':
      'Consulta los tipos de monstruos que posees y cambia quién viaja contigo.',
    'Pet skills': 'Habilidades de mascota',
    'Rescued specialists': 'Especialistas rescatados',
    'Resources & labor': 'Recursos y trabajo',
    'Local objectives': 'Objetivos locales',
    'Gather resources': 'Recoger recursos',
    'No specialists rescued yet': 'Aún no hay especialistas rescatados',
    'No companions employed': 'No hay compañeros contratados',
    'Full Barracks — Expedition 4': 'Cuartel completo — Expedición 4',
    'Your field base. Choose a service.': 'Tu base de campo. Elige un servicio.',
    'Group, recruits and pets.': 'Grupo, reclutas y mascotas.',
    'Heal or recover companions.': 'Cura o recupera compañeros.',
    'Skills and rescued specialists.': 'Habilidades y especialistas rescatados.',
    'Quests and resources.': 'Misiones y recursos.',
    'Restore companions. Short on crowns? Tap to queue.':
      'Recupera compañeros. ¿Te faltan coronas? Toca para dejarlo en cola.',
    'Succession: class loss replaces crown loss.':
      'Sucesión: pierdes la clase en lugar de coronas.',
    'Respawn here, or switch back to your refuge.': 'Reaparece aquí o vuelve a usar tu refugio.',
    'Respawn here after defeat in this region.': 'Reaparece aquí al caer en esta región.',
    'Choose who travels with you.': 'Elige quién viaja contigo.',
    'Defeat TRUE bosses to unlock pets.': 'Derrota jefes TRUE para desbloquear mascotas.',
    'Optional · chosen once.': 'Opcional · se elige una vez.',
    'Rest a companion to free a slot.': 'Deja descansar a un compañero para liberar un puesto.',
    'Basic cap: 3. Upgrade for larger groups.':
      'Límite básico: 3. Mejora el cuartel para grupos mayores.',
    'Choose a name once. You can skip and return later.':
      'Elige un nombre una vez. Puedes omitirlo y volver después.',
    'Choose a rescued specialist for training or equipment.':
      'Elige un especialista rescatado para entrenar o equiparte.',
    'All local specialists rescued.': 'Todos los especialistas locales rescatados.',
    'Rescue specialists to unlock skills and larger groups.':
      'Rescata especialistas para desbloquear habilidades y grupos mayores.',
    'Choose a recruit. A full group sends recruits to reserve.':
      'Elige un recluta. Si el grupo está lleno, queda en reserva.',
    'Choose a tribute site, then escort your workers.':
      'Elige un lugar con tributo y escolta a tus trabajadores.',
    'Combat pauses gathering. Deliver their cargo to Town Supplies.':
      'El combate pausa la recogida. Entrega la carga en Suministros del pueblo.',
    'Escort idle troops here to reveal the tribute.':
      'Escolta aquí tropas libres para encontrar el tributo.',
    'All regional tribute recovered.': 'Todo el tributo de la región recuperado.',
    'Quests and resource gathering.': 'Misiones y recogida de recursos.',
    'Larger active groups and a supply deposit.':
      'Grupos activos mayores y depósito de suministros.',
    'Keep watch while a companion builds. Recall pauses work; progress is kept.':
      'Vigila mientras un compañero construye. Reagrupar pausa el trabajo; se conserva el progreso.',
    'Select fallen companions to recover for 40 crowns each. Short on crowns? Queue them in order. Treat wounds heals the hero and living companions for 30 crowns.':
      'Elige qué compañeros caídos recuperar por 40 coronas cada uno. Si te faltan coronas, déjalos en cola por orden. Curar heridas devuelve toda la salud al héroe y a los compañeros vivos por 30 coronas.',
    'Queue full: upgrade to Full Barracks for unlimited recovery requests.':
      'Cola llena: mejora a cuartel completo para recuperar compañeros sin límite de solicitudes.',
    'Your company has no fallen members.': 'No hay compañeros caídos en tu compañía.',
    'Recover now for 40 crowns, or join the existing queue.':
      'Recupera ahora por 40 coronas o añade a la cola existente.',
    'Companion recovery queued. Select the same companion to cancel.':
      'Recuperación en cola. Elige al mismo compañero para cancelarla.',
    'The Captain already has a recovery queued.':
      'El capitán ya tiene una recuperación en cola.',
    'Basic Barracks recovery queue is full (3). Upgrade to Full Barracks for unlimited recovery requests.':
      'La cola del cuartel básico está llena (3). Mejora a cuartel completo para eliminar el límite de solicitudes.',
    'No fallen companions': 'No hay compañeros caídos',
    'Queued · tap to cancel. No crowns spent.':
      'En cola · toca para cancelar. No has gastado coronas.',
    'Short on crowns? Tap to queue.': '¿Te faltan coronas? Toca para dejarlo en cola.',
    'No fallen companions.': 'No hay compañeros caídos.',
        'Queue payment order: recovery → treatment → recruitment.':
      'Orden de pago de la cola: recuperación → tratamiento → reclutamiento.',
    'Automatic when eligible.': 'Automático al cumplir los requisitos.',
    'Automatic when eligible; full group → reserve.':
      'Automático al cumplir los requisitos; grupo lleno → reserva.',
    'TRUE victories unlock free pets.': 'Las victorias TRUE desbloquean mascotas gratis.',
    'They share group slots and need recovery when fallen. Pets cannot work or summon.':
      'Ocupan puestos del grupo y requieren recuperación al caer. No trabajan ni invocan.',
    'Automatic attacks and charged skills.': 'Ataques automáticos y habilidades cargadas.',
    'Pets use these skills automatically in combat.':
      'Las mascotas usan estas habilidades automáticamente en combate.',
    'Clear line required': 'Requiere línea despejada',
    'Automatic 0.65s charge': 'Carga automática de 0.65 s',
    'Unlock: learn hero Skill 2 from Mira': 'Desbloqueo: aprende la habilidad 2 del héroe con Mira',
    'Joins your group for free.': 'Se une al grupo gratis.',
    'Group full. Recruits into reserve; rest a member to make room.':
      'Grupo lleno. Se recluta en reserva; deja descansar a alguien para hacer sitio.',
    'Keeps its health while resting.': 'Conserva su salud al descansar.',
    'Construction in progress': 'Construcción en curso',
    'Assign companion to construction': 'Asignar compañero a construir',
    'No idle companion available': 'No hay compañeros libres',
    'Recall or finish another labor assignment first.': 'Reagrupa o termina otro trabajo primero.',
    'Uses one idle active Soldier or Ranger': 'Usa un Soldado o Ranger activo y libre',
    'Recruitment — Expedition 2': 'Reclutamiento — Expedición 2',
    'Name available': 'Nombre disponible',
    'Permanent name chosen': 'Nombre permanente elegido',
    'Ranged support.': 'Apoyo a distancia.',
    'Close-range support.': 'Apoyo cercano.',
    Active: 'Activo',
    Locked: 'Bloqueado',
    Recruitable: 'Disponible',
    Fallen: 'Caído',
    Resting: 'En descanso',
  });
  Object.assign(spanishText, {
    Character: 'Personaje',
    Equipment: 'Equipo',
    'Ranger support': 'Apoyo del Ranger',
    'Preparation Tonics': 'Tónicos de preparación',
    'Skills and targeting': 'Habilidades y objetivos',
    'Movement and menus': 'Movimiento y menús',
    'Companion commands': 'Órdenes de compañeros',
    'Using skills': 'Usar habilidades',
    'Queued skills': 'Habilidades en cola',
    'Targeting and dodging': 'Apuntar y esquivar',
    'Combat conditions': 'Estados de combate',
    'Companion combat skills': 'Habilidades de combate de compañeros',
    'Training and companions': 'Entrenamiento y compañeros',
    Talents: 'Talentos',
    'Skill journal': 'Diario de habilidades',
    Controls: 'Controles',
    'Character and identity': 'Personaje e identidad',
    'Equipment upgrades': 'Mejoras de equipo',
    Reforging: 'Reforja',
    Appearance: 'Apariencia',
    'Expedition support': 'Apoyo de Expedición',
    'Training and resets': 'Entrenamiento y reinicios',
    'Choose a topic or adjust your inputs.': 'Elige un tema o ajusta tus controles.',
    'Choose the control you want to learn.': 'Elige el control que quieres aprender.',
    'Choose an action, then press its new key. Esc cancels. Each key binds one action.':
      'Elige una acción y pulsa su nueva tecla. Esc cancela. Cada tecla corresponde a una acción.',
    'Choose your layout and movement controls.':
      'Elige la disposición y los controles de movimiento.',
    'Tap reachable ground to move.': 'Toca terreno accesible para moverte.',
    'Optimization Mode': 'Modo de optimización',
    'Auto · Recommended': 'Auto · Recomendado',
    'Auto lowers graphics under sustained load. Emergencies can override Off.':
      'Auto reduce los gráficos cuando hay mucha carga. Las emergencias pueden anular Desactivado.',
    'Off disables ordinary skips, not emergency combat protection.':
      'Desactivado evita los saltos habituales, no la protección de combate en emergencias.',
    On: 'Activado',
    Off: 'Desactivado',
    Display: 'Pantalla',
    Graphics: 'Gráficos',
    Diagnostics: 'Diagnósticos',
    'Show performance details': 'Mostrar detalles de rendimiento',
    'Hide performance details': 'Ocultar detalles de rendimiento',
    'Start navigation profiling': 'Iniciar medición de multitudes',
    'Stop navigation profiling': 'Detener medición de multitudes',
    'Capture navigation and terrain work, then export a playtest report.':
      'Mide el juego con multitudes y luego exporta un informe de prueba.',
    'Adjust everything here without leaving this screen.':
      'Ajusta todo aquí sin salir de esta pantalla.',
    'On by default. Skips drawings under load; briefly pauses combat during critical slowdowns.':
      'Activado por defecto. Omite dibujos con carga; pausa brevemente el combate si el rendimiento es crítico.',
    'WebGL2 may run faster on some devices. Try it for 15 seconds; keep it or return to Canvas.':
      'WebGL2 puede acelerar el juego en algunos dispositivos. Pruébalo 15 segundos; consérvalo o vuelve a Canvas.',
    'WebGL2 may run faster on your device. If it feels slower or looks wrong, return to Canvas.':
      'WebGL2 puede acelerar el juego en tu dispositivo. Si va más lento o se ve mal, vuelve a Canvas.',
    'Performance settings updated to recommended defaults. You can change them in Settings.':
      'Ajustes de rendimiento actualizados a los valores recomendados. Puedes cambiarlos en Ajustes.',
    'Optimization Mode now defaults to Auto. You can change it in Settings.':
      'El modo de optimización ahora usa Auto por defecto. Puedes cambiarlo en Ajustes.',
    'Local samples are diagnostic estimates, not verified display FPS.':
      'Las muestras locales son estimaciones diagnósticas, no FPS reales verificados.',
    'Towns and camps': 'Pueblos y campamentos',
    'Travel routes': 'Rutas de viaje',
    'Dungeon entrances': 'Entradas de mazmorras',
    'Places and threats': 'Lugares y amenazas',
    'Screen layout': 'Disposición de pantalla',
    'Camera zoom': 'Zoom de cámara',
    'Graphics quality': 'Calidad gráfica',
    'Graphics renderer': 'Motor gráfico',
    'Canvas 2D is the safe default. PixiJS WebGL2 is experimental; you can revert at any time.':
      'Canvas 2D es la opción predeterminada segura. PixiJS WebGL2 es experimental; puedes volver a Canvas cuando quieras.',
    'Canvas 2D · Default': 'Canvas 2D · Predeterminado',
    'PixiJS WebGL2 · Experimental': 'PixiJS WebGL2 · Experimental',
    'Keep WebGL2': 'Conservar WebGL2',
    'Revert to Canvas': 'Volver a Canvas',
    'Frame rate': 'Fotogramas por segundo',
    'Adaptive frame skip': 'Salto adaptativo de fotogramas',
    'Skips some world drawings under load; gameplay and warnings continue.':
      'Omite algunos dibujos del mundo bajo carga; el juego y los avisos continúan.',
    'Critical slowdown: combat paused while performance recovers. You can lower graphics in Settings.':
      'Ralentización crítica: combate en pausa durante la recuperación. Puedes bajar los gráficos en Ajustes.',
    'Previous session stopped unexpectedly. Returned to your refuge safely.':
      'La sesión anterior se cerró inesperadamente. Regresaste a tu refugio con seguridad.',
    'Previous session stopped unexpectedly. Returned to your barracks safely.':
      'La sesión anterior se cerró inesperadamente. Regresaste a tu cuartel con seguridad.',
    'Performance recovered: combat resumed.': 'Rendimiento recuperado: combate reanudado.',
    'Critical slowdown: enemies disengaged and companions are withdrawing.':
      'Ralentización crítica: enemigos retirados y compañeros replegándose.',
    'Critical slowdown persists: returned to your recovery point without a defeat.':
      'La ralentización continúa: regreso al punto de recuperación sin derrota.',
    'Performance details': 'Detalles de rendimiento',
    'Choose what to adjust.': 'Elige qué ajustar.',
    'Choose phone or desktop controls. Your save stays the same.':
      'Elige controles de teléfono u ordenador. Conservas tu partida.',
    'Automatic screen': 'Pantalla automática',
    'Chromebook / desktop screen': 'Pantalla de Chromebook / ordenador',
    'Phone / touch screen': 'Pantalla de teléfono / táctil',
    'Zoom changes your view only.': 'El zoom solo cambia la vista.',
    'Lower graphics can improve frame rate.': 'Reducir los gráficos puede mejorar el rendimiento.',
    'Simpler scenery and lower resolution.': 'Escenario más simple y menor resolución.',
    'Automatic sharpness': 'Nitidez automática',
    'Automatic sharpness ✓': 'Nitidez automática ✓',
    'Rendering resolution': 'Resolución de renderizado',
    'Choose world detail without changing screen size or controls.':
      'Ajusta la resolución del mundo sin cambiar la pantalla ni los controles.',
    '100% · Standard': '100% · Estándar',
    '80% · Balanced': '80% · Equilibrado',
    '60% · Performance': '60% · Rendimiento',
    '50% · Maximum speed': '50% · Máxima velocidad',
    'Maximum sharpness': 'Nitidez máxima',
    'Maximum sharpness ✓': 'Nitidez máxima ✓',
    'Adjusts resolution to keep play smooth.': 'Ajusta la resolución para mantener la fluidez.',
    'Sharper image; more graphics work.': 'Imagen más nítida; mayor carga gráfica.',
    'Choose a target for smoother motion or lower graphics load.':
      'Elige mayor fluidez o menor carga gráfica.',
    'Auto 20–30 FPS · Default': 'Auto 20–30 FPS · Predeterminado',
    'Auto 30–60 FPS': 'Auto 30–60 FPS',
    'Starts at 30 FPS; falls back to 20 under load.':
      'Empieza a 30 FPS; baja a 20 cuando hay mucha carga.',
    'Lowest graphics load.': 'Carga gráfica mínima.',
    'Starts at 30 FPS and tries 60.': 'Empieza a 30 FPS e intenta llegar a 60.',
    'Lower graphics load.': 'Menor carga gráfica.',
    'Smoother motion.': 'Movimiento más fluido.',
    'Reset performance sample': 'Reiniciar muestra de rendimiento',
    'Start renderer profiling': 'Iniciar registro del renderizador',
    'Stop renderer profiling': 'Detener registro del renderizador',
    'Clear renderer profiling': 'Borrar registro del renderizador',
    'Record bounded frame spikes and PR #518 cache activity while playing.':
      'Registra picos de fotogramas y actividad de caché mientras juegas, con límites.',
    'Download a local JSON report to share yourself.':
      'Descarga un informe JSON local para compartirlo tú mismo.',
    'Master volume': 'Volumen general',
    'Music volume': 'Volumen de música',
    'Ambience volume': 'Volumen ambiental',
    'Effects volume': 'Volumen de efectos',
    'Interface volume': 'Volumen de interfaz',
    'Music and sound': 'Música y sonido',
    'Volume levels': 'Niveles de volumen',
    'Adjust all five volumes here. Muting preserves your levels.':
      'Ajusta aquí los cinco volúmenes. Silenciar conserva los niveles.',
    'Switch sound off or on without resetting the sliders.':
      'Activa o silencia el sonido sin reiniciar los controles de volumen.',
    'Choose a volume to adjust.': 'Elige el volumen que quieres ajustar.',
    'Mute all sound': 'Silenciar todo',
    'Unmute all sound': 'Activar todo el sonido',
    Quieter: 'Bajar volumen',
    Louder: 'Subir volumen',
    'Save and game management': 'Partidas guardadas',
    'Save backups': 'Copias de seguridad',
    'Save run': 'Guardar partida',
    'Export save': 'Exportar partida',
    'Import save': 'Importar partida',
    'Export playtest report': 'Exportar informe de prueba',
    'New game': 'Nueva partida',
    'Load other mode run': 'Cargar partida del otro modo',
    'Save, back up, or choose another run.': 'Guarda, crea una copia o elige otra partida.',
    'Export a backup before replacing a run.': 'Exporta una copia antes de reemplazar una partida.',
    'Choose a mode. Export a backup to keep your current run.':
      'Elige un modo. Exporta una copia para conservar tu partida actual.',
    'New Normal game': 'Nueva partida Normal',
    'New game in Nightmare Mode': 'Nueva partida Pesadilla',
    'Unlocked by the peaceful ending': 'Se desbloquea con el final pacífico',
    'Weapons, armor and reforges.': 'Armas, armadura y reforjas.',
    'Automatic healing and your Heal command.': 'Curación automática y tu orden de Curar.',
    'Temporary maximum HP boost.': 'Aumento temporal de salud máxima.',
    'Recruit a Ranger to unlock field Heal.':
      'Recluta un Ranger para desbloquear la curación de campo.',
    'Field Heal requires an active Ranger, Charmed ranged monster or ally-healing pet.':
      'Curar en el campo requiere un Ranger activo, un monstruo encantado a distancia o una mascota que cure aliados.',
    'Use the Ranger Heal button. During cooldown, tap to queue hero healing. Automatic healing stays active.':
      'Usa el botón Curar del Ranger. Durante la recuperación, toca para poner tu curación en cola. La curación automática sigue activa.',
    'Use the Heal button. During cooldown, tap to queue hero healing. Automatic healing stays active.':
      'Usa el botón Curar. Durante la recuperación, toca para poner tu curación en cola. La curación automática sigue activa.',
    ACTIVE: 'ACTIVO',
    '+10% maximum HP until rest or defeat.': ' +10% de salud máxima hasta descansar o caer.',
    '+10% maximum HP until rest or defeat. Use at a completed Barracks.':
      '+10% de salud máxima hasta descansar o caer. Úsalo en un cuartel terminado.',
    'Rescue Neri to buy tonics.': 'Rescata a Neri para comprar tónicos.',
    'Choose a skill for its effects and controls. Instructors teach new ranks.':
      'Elige una habilidad para ver sus efectos y controles. Los instructores enseñan nuevos rangos.',
    'View automatic combat skills.': 'Ver habilidades automáticas de combate.',
    'Read unlocked stories and notices.': 'Lee historias y avisos desbloqueados.',
    'Tap an objective to track it.': 'Toca un objetivo para seguirlo.',
    'Finished quests and rewards.': 'Misiones terminadas y recompensas.',
    'Tap a quest to track it. Rewards arrive automatically.':
      'Toca una misión para seguirla. Las recompensas llegan automáticamente.',
    'Choose a place, then select Navigate.': 'Elige un lugar y pulsa Ir.',
    Navigate: 'Ir',
    'Navigate to selected': 'Ir al lugar elegido',
    'No route': 'Sin ruta',
    'Clear waypoint': 'Quitar ruta',
    Language: 'Idioma',
    'On ✓': 'Activado ✓',
    'Off ✓': 'Desactivado ✓',
    'Keyboard presets': 'Distribuciones de teclado',
    'Key bindings': 'Teclas asignadas',
    'Movement and menu keys': 'Teclas de movimiento y menú',
    'Skills and combat keys': 'Teclas de habilidades y combate',
    'Companion and utility keys': 'Teclas de compañeros y utilidades',
    'Touch controls': 'Controles táctiles',
    'Mouse controls': 'Controles del ratón',
    'Choose an action to change its key. Esc cancels.':
      'Elige una acción para cambiar su tecla. Esc cancela.',
    'Restore default keys': 'Restaurar teclas predeterminadas',
    'Phone layout': 'Disposición táctil',
    'Touch tap-to-move': 'Tocar para moverse',
    'Mouse click-to-move': 'Clic para moverse',
    'Two thumbs': 'Dos pulgares',
    'Left hand': 'Mano izquierda',
    'Movement joystick': 'Joystick de movimiento',
    'HUD style': 'Estilo de interfaz',
    Classic: 'Clásico',
    Adaptive: 'Adaptativo',
    'Adaptive quietly reduces idle control backgrounds; all learned actions stay available.':
      'Adaptativo atenúa los controles inactivos; todas las habilidades aprendidas siguen disponibles.',
    Fixed: 'Fijo',
    Floating: 'Flotante',
    'Floating: touch the lower-left movement area; menus keep the fixed stick.':
      'Flotante: toca la zona inferior izquierda para moverte; el menú conserva el joystick fijo.',
  });
  Object.assign(spanishText, {
    'iPhone / iPad: Safari → Share → Add to Home Screen → Add.\nAndroid / Chrome: browser menu → Install app or Add to Home screen.':
      'iPhone / iPad: Safari → Compartir → Añadir a pantalla de inicio → Añadir.\nAndroid / Chrome: menú del navegador → Instalar app o Añadir a pantalla de inicio.',
  });
  Object.assign(spanishText, {
    'Choose your training.': 'Elige tu entrenamiento.',
    'Hero skills': 'Habilidades del héroe',
    'Learn or improve your class skills.': 'Aprende o mejora habilidades de tu clase.',
    'Expedition training': 'Entrenamiento de Expedición',
    FREE: 'GRATIS',
    'Group size and field options.': 'Tamaño del grupo y opciones de campo.',
    'Companion training': 'Entrenamiento de compañeros',
    'Bonuses shared with your companions.': 'Bonificaciones compartidas con tus compañeros.',
    'Open skill journal': 'Abrir diario de habilidades',
    'Effects and controls.': 'Efectos y controles.',
    'Higher ranks': 'Rangos superiores',
    'Find the next instructor.': 'Encuentra al siguiente instructor.',
    'Choose a skill to learn or improve.': 'Elige una habilidad para aprender o mejorar.',
    'Training finished here. Back → Higher ranks for the next instructor.':
      'Entrenamiento terminado aquí. Atrás → Rangos superiores para ver al siguiente instructor.',
    'All available skills are at maximum rank.':
      'Todas las habilidades disponibles están al máximo.',
    'Finished here': 'Terminado aquí',
    'Finished with this instructor.': 'Terminado con este instructor.',
    'Need more crowns.': 'Necesitas más coronas.',
    'Expand your group and field options. Training is free.':
      'Amplía tu grupo y las opciones de campo. El entrenamiento es gratis.',
    'Maximum Expedition rank.': 'Rango máximo de Expedición.',
    'Train bonuses shared with your companions.':
      'Entrena bonificaciones compartidas con tus compañeros.',
    'This instructor teaches higher hero-skill ranks.':
      'Este instructor enseña rangos superiores de habilidades del héroe.',
    'Magic combo / beam': 'Combo mágico / rayo',
    'Single slow / frost burst': 'Ralentizar / explosión de escarcha',
    'Basic attack / holy burst': 'Ataque básico / explosión sagrada',
    'Weaken / frontal cleave': 'Debilitar / corte frontal',
    'Arrow combo / rapid triple': 'Combo de flechas / triple rápido',
    'Two slowing arrows / line': 'Dos flechas ralentizadoras / línea',
    'Companions inherit applicable discipline-training HP, damage and movement speed.':
      'Los compañeros heredan salud, daño y velocidad del entrenamiento de disciplinas aplicable.',
  });
  Object.assign(spanishText, {
    'Choose a skill to preview its training.': 'Elige una habilidad para ver su entrenamiento.',
    'Choose a skill. View your current Tap and Charged effects.':
      'Elige una habilidad. Consulta sus efectos normales y cargados actuales.',
    'Tap and Charged share this rank.': 'Normal y cargada comparten este rango.',
    Tap: 'Normal',
    Charged: 'Cargada',
    'Next rank · Preview': 'Siguiente rango · Vista previa',
    'Compare changes and find an instructor.': 'Compara los cambios y encuentra un instructor.',
    'Using skills': 'Usar habilidades',
    'Tap, charge, cooldowns and damage figures.': 'Toques, cargas, recuperación y cifras de daño.',
    'Tap for the normal form. Hold to prepare the charged form.':
      'Toca para la versión normal. Mantén pulsado para preparar la cargada.',
    Controls: 'Controles',
    'Reading effects': 'Leer los efectos',
    'Damage figures use your current Power, before enemy defenses and situational bonuses. Healing cannot exceed maximum health. Distances use map units.':
      'El daño usa tu Poder actual, antes de defensas y bonificaciones de combate. La curación no supera la salud máxima. Las distancias usan unidades del mapa.',
    'Skill ranks do not shorten cooldowns. Discipline training can.':
      'Los rangos de habilidad no reducen la recuperación. El entrenamiento de disciplinas sí puede.',
    'Learn Rank 1': 'Aprender rango 1',
    'Compare your upgrade before training.': 'Compara la mejora antes de entrenar.',
    'Learn both forms at Rank 1.': 'Aprende ambas versiones en rango 1.',
    'No change at this rank.': 'Sin cambios en este rango.',
    'Only changed effects are shown. Cooldowns stay the same.':
      'Solo se muestran efectos que cambian. La recuperación sigue igual.',
    'Training unavailable here.': 'Entrenamiento no disponible aquí.',
    'Applies to Tap and Charged.': 'Se aplica a normal y cargada.',
    'Also unlocks advanced Soldier and Ranger skills, plus charged pet skills.':
      'También desbloquea habilidades avanzadas de Soldier y Ranger, y habilidades cargadas de mascotas.',
    'No further instructor available.': 'No hay otro instructor disponible.',
    Preview: 'Vista previa',
    'Skills use crowns; Expedition training is free. Preview each skill to see what its next rank changes.':
      'Las habilidades cuestan coronas; Expedición es gratis. Consulta cada habilidad para ver qué cambia en su siguiente rango.',
    Cooldown: 'Recuperación',
    'Base damage': 'Daño base',
    'Combo damage': 'Daño del combo',
    'Third-hit splash': 'Daño de área del tercer golpe',
    'Damage per arrow': 'Daño por flecha',
    Arrows: 'Flechas',
    'Enemy damage reduced': 'Daño enemigo reducido',
    'Weaken duration': 'Duración de Debilitar',
    'Enemy damage taken': 'Daño que recibe el enemigo',
    'Vulnerability duration': 'Duración de vulnerabilidad',
    'Slow duration': 'Duración de Lentitud',
    Reach: 'Alcance',
    Radius: 'Radio',
    Width: 'Anchura',
    'Incoming damage reduced': 'Daño recibido reducido',
    Duration: 'Duración',
    'Damage vs elites': 'Daño contra élites',
    'Push distance': 'Distancia de empuje',
    'Silence duration': 'Duración de Silencio',
    'Healing per ally': 'Curación por aliado',
    'Self-healing': 'Autocuración',
    'Movement speed': 'Velocidad de movimiento',
    'Companion movement': 'Movimiento de compañeros',
    'Companion basic attack speed': 'Ataques básicos de compañeros',
    'Primary damage': 'Daño al objetivo principal',
    'Other targets': 'Daño a otros objetivos',
    'Taunt duration': 'Duración de provocación',
    'Max targets': 'Máximo de objetivos',
    'Final arrow push': 'Empuje de la última flecha',
    'Damage: first / second / later': 'Daño: primero / segundo / siguientes',
    'Arrows per target': 'Flechas por objetivo',
    'Arrows if one foe': 'Flechas contra un solo enemigo',
    'Self-heal': 'Autocuración',
    'Party damage reduced': 'Daño al grupo reducido',
    'Ward duration': 'Duración de protección',
    'Sword combo; third hit cleaves': 'Combo de espada; el tercer golpe corta en área',
    'Fire a holy projectile': 'Dispara un proyectil sagrado',
    'Hit one foe; weaken its damage': 'Golpea a un enemigo y reduce su daño',
    'Holy Cleave: weaken a frontal group': 'Holy Cleave: debilita enemigos frente a ti',
    'Raise your shield to reduce incoming damage': 'Alza el escudo para reducir el daño recibido',
    'Shield Bash: strike and push a cone': 'Shield Bash: golpea y empuja en cono',
    'No Skill 1 while raised; other damage ×0.6. Tap to lower; cooldown starts on lowering.':
      'Sin Habilidad 1 mientras está alzado; el resto del daño ×0,6. Toca para bajarlo; ahí empieza la recuperación.',
    'Dodgeable holy shot: hit + draw attention': 'Disparo sagrado esquivable: daño y provocación',
    'Grand Judgment: splash + group taunt': 'Grand Judgment: daño en área y provocación grupal',
    'Boss taunt affects basic attacks briefly; scripted specials remain.':
      'Provocar jefes afecta brevemente a sus ataques básicos; sus especiales continúan.',
    'Damage nearby foes': 'Daña enemigos cercanos',
    'Consecrated Wave: wider damage and weaken': 'Consecrated Wave: más área de daño y debilitar',
    'Rush to a foe and strike': 'Acércate rápidamente a un enemigo y golpea',
    'Vanguard Impact: rush + short push wave': 'Vanguard Impact: avance y onda de empuje corta',
    'Oath Strike: wider damage and weaken': 'Oath Strike: más área de daño y debilitar',
    'Holy area damage, self-heal and nearby party ward':
      'Daño sagrado en área, autocuración y protección de aliados cercanos',
    'Last Bastion: bigger blast, self-heal, party ward and weaken':
      'Last Bastion: más área, autocuración, protección del grupo y debilitar',
    'No immunity. Ward and Shield Stance use only the stronger reduction.':
      'Sin inmunidad. La protección y Shield Stance solo aplican la reducción más fuerte.',
    'Magic combo; third hit splashes': 'Combo mágico; el tercer golpe daña en área',
    'Arcane Beam: fire a powerful beam': 'Arcane Beam: dispara un rayo potente',
    'Hit and slow one foe': 'Golpea y ralentiza a un enemigo',
    'Frost Burst: damage and slow around the target':
      'Frost Burst: daño y lentitud alrededor del objetivo',
    'Dodgeable bolt: stop one warned/aimed attack on hit':
      'Proyectil esquivable: al acertar, interrumpe un ataque en preparación',
    'Silence Field: block nearby special skills':
      'Silence Field: bloquea habilidades especiales cercanas',
    'Silence affects you and companions too; basic attacks still work.':
      'Silencio también os afecta a ti y a tus compañeros; los ataques básicos siguen funcionando.',
    'Dodgeable bolt: damage and vulnerability': 'Proyectil esquivable: daño y vulnerabilidad',
    'Arcane Rupture: area damage and vulnerability':
      'Arcane Rupture: daño en área y vulnerabilidad',
    'Fracture never stacks; the stronger effect applies.':
      'La vulnerabilidad no se acumula; se aplica la más fuerte.',
    'Damage and push nearby foes': 'Daña y empuja a enemigos cercanos',
    'Force Wave: wider damage and stronger push': 'Force Wave: más área y empuje más fuerte',
    'Magic projectile + brief slow': 'Proyectil mágico y lentitud breve',
    'Focused Beam: stronger shot + slow': 'Focused Beam: disparo más fuerte y lentitud',
    'Damage leaps between nearby foes': 'El daño salta entre enemigos cercanos',
    'Chainstorm: stronger, wider chain': 'Chainstorm: cadena más fuerte y amplia',
    'Blast around the target; primary hit strongest':
      'Explosión alrededor del objetivo; más daño al principal',
    'Arcane Cataclysm: bigger blast and brief vulnerability':
      'Arcane Cataclysm: explosión mayor y vulnerabilidad breve',
    'No healing or immunity. Fracture is nonstacking.':
      'Sin curación ni inmunidad. La vulnerabilidad no se acumula.',
    'Arrow combo; third hit fans out': 'Combo de flechas; el tercer golpe se abre en abanico',
    'Rapid Triple Shot: fire three arrows': 'Rapid Triple Shot: dispara tres flechas',
    'Two arrows slow one foe': 'Dos flechas ralentizan a un enemigo',
    'Pinning Volley: line hit + slow': 'Pinning Volley: daño en línea y lentitud',
    'Heal yourself': 'Cúrate',
    'Party Heal: you + wounded living allies': 'Party Heal: tú y tus aliados vivos heridos',
    'Cannot revive fallen companions.': 'No revive compañeros caídos.',
    'Move faster': 'Muévete más rápido',
    'Companion Rally: nearby companions move and attack faster':
      'Companion Rally: compañeros cercanos se mueven y atacan más rápido',
    'Nearby living allies only; no dash and no faster special skills.':
      'Solo aliados vivos cercanos; sin avance rápido ni especiales más veloces.',
    'Hit nearby foes': 'Golpea enemigos cercanos',
    'Arrow Rain: wider hits and slow': 'Arrow Rain: más área de daño y lentitud',
    'Shoot one foe and push it back': 'Dispara a un enemigo y empújalo',
    'Repelling Volley: 3 arrows + stronger push':
      'Repelling Volley: tres flechas y empuje más fuerte',
    'A powerful arrow that pierces defense': 'Una flecha potente que atraviesa la defensa',
    'Stronger defense-piercing arrow and slow':
      'Flecha que atraviesa la defensa más fuerte y lentitud',
    'Fire arrows at several foes': 'Dispara flechas a varios enemigos',
    'Grand Hunt: fire two arrows per foe': 'Grand Hunt: dispara dos flechas por enemigo',
    'When isolated, fire 2 normal or 3 charged arrows at one foe. No piercing.':
      'Contra un solo enemigo, dispara dos flechas normales o tres cargadas. No atraviesan defensa.',
  });
  Object.assign(spanishText, {
    'Rest here to heal you and living companions.':
      'Descansa aquí para curarte a ti y a tus compañeros vivos.',
    'Sets your death recovery point. Both refuges share a 90s cooldown.':
      'Fija tu punto de regreso tras morir. Ambos refugios comparten 90 s de recuperación.',
    'Fallen companions: Captain or Barracks.': 'Compañeros caídos: Capitán o Cuartel.',
    'End nearby combat first.': 'Termina el combate cercano primero.',
    'Rest now': 'Descansar ahora',
    'Heal and set your recovery point.': 'Cúrate y fija tu punto de regreso.',
    'Got it': 'Entendido',
    'Close without resting.': 'Cerrar sin descansar.',
  });
  // New player mechanics copy; locked Chronicle passages remain unchanged.
  Object.assign(spanishText, {
    'Radiant Strike': 'Golpe radiante',
    'Radiant Strike / Radiant Cross': 'Golpe radiante / Cruz radiante',
    'Arcane Beam / Wide Arcane Beam': 'Rayo arcano / Rayo arcano amplio',
    'Rapid Arrows / Hawk Interception': 'Flechas rápidas / Intercepción del halcón',
    'Self-taught from Rank 1; rescued specialists refine it.':
      'Aprendido por tu cuenta desde el rango 1; los especialistas rescatados lo perfeccionan.',
    'Radiant Cross': 'Cruz radiante',
    'Arcane Beam': 'Rayo arcano',
    'Wide Arcane Beam': 'Rayo arcano amplio',
    'Rapid Arrows': 'Flechas rápidas',
    'Hawk Interception': 'Intercepción del halcón',
    'Automatic basics': 'Ataques básicos automáticos',
    'Automatic sword combo / holy projectile / Radiant Cross':
      'Combo de espada automático / proyectil sagrado / Cruz radiante',
    'Automatic magic combo / narrow beam / wide beam':
      'Combo mágico automático / rayo estrecho / rayo amplio',
    'Automatic bow combo / rapid arrows / hunting hawk':
      'Combo de arco automático / flechas rápidas / halcón cazador',
    'Fire one focused holy projectile': 'Lanza un proyectil sagrado concentrado',
    'Radiant Cross: two holy pulses along four arms':
      'Cruz radiante: dos pulsos sagrados en cuatro brazos',
    'Fire one narrow Arcane Beam': 'Lanza un rayo arcano estrecho',
    'Wide Arcane Beam: hit every enemy along the broad line':
      'Rayo arcano amplio: golpea a todos los enemigos en la línea ancha',
    'Fire three rapid arrows at one foe': 'Dispara tres flechas rápidas a un enemigo',
    'Hawk Interception: pursue one foe and stop an active retreat':
      'Intercepción del halcón: persigue a un enemigo e interrumpe una retirada activa',
    'Attacks independently while moving or standing. Three same-target hits build a finishing splash; Skill 1 Tap and Charged do not reset the combo.':
      'Ataca independientemente en movimiento o en reposo. Tres golpes al mismo enemigo culminan en daño de área; las formas normal y cargada no reinician el combo.',
    'Automatic Skill 1 basics attack independently. Tap for the normal technique. Hold to prepare the charged technique.':
      'Los ataques básicos automáticos de la habilidad 1 funcionan aparte. Toca para la técnica normal; mantén para preparar la cargada.',
    'Charged starts both recovery timers: short Tap and longer Charged. Tap returns after its own cooldown, even while Charged is still recovering. Tapping does not restart the charged lock. Charged needs both timers ready. On cooldown, tap to queue normal or briefly hold to queue charged. A strong hit can interrupt preparation.':
      'La cargada inicia las recuperaciones normal corta y cargada larga. La normal vuelve al acabar su recuperación, incluso si la cargada sigue ocupada. Usar normal no reinicia cargada; para cargar ambas deben estar listas. Toca para poner normal en cola o mantén brevemente para cargada. Un golpe fuerte interrumpe la preparación.',
    'Automatic basics, Tap and Charged use this rank.':
      'Los ataques básicos, la normal y la cargada usan el mismo rango.',
    'Rank 1 is self-taught; rescued specialists refine it.':
      'El rango 1 lo aprendiste por tu cuenta; los especialistas rescatados lo perfeccionan.',
    'Choose a skill. View automatic Skill 1 basics, Tap and Charged effects with independent recovery.':
      'Elige una habilidad. Consulta los ataques básicos automáticos, la normal y la cargada, con recuperaciones independientes.',
    'Also improves automatic basics.': 'También mejora los ataques básicos automáticos.',
    'Basic attack interval': 'Intervalo de ataque básico',
    'Damage per pulse': 'Daño por pulso',
    Pulses: 'Pulsos',
    'Damage per enemy': 'Daño por enemigo',
    'Initial target range': 'Alcance inicial del objetivo',
    'Maximum flight path': 'Recorrido máximo del halcón',
    'Flight lifetime': 'Duración del vuelo',
    'Retreat lockout': 'Bloqueo de retirada',
    'Tap ready': 'Normal lista',
    'Charged ready': 'Cargada lista',
    'Retreat interrupted': 'Retirada interrumpida',
  });
  // N1: Only the author's approved bilingual Chronicle pairs may supply this copy.
  const approvedNarrative =
    typeof PrototypeNarration !== 'undefined' ? PrototypeNarration.approved : null;
  const chronicleTranslations = new Map(
    (typeof PrototypeNarration !== 'undefined' ? PrototypeNarration : [])
      .filter((entry) => entry && entry.es)
      .map((entry) => [entry.text, entry.es]),
  );
  const narrativeTranslations = new Map(
    Object.values(approvedNarrative || {}).map((pair) => [pair.en, pair.es]),
  );
  Object.assign(spanishText, {
    'Return to Main Menu': 'Volver al menú principal',
    'Saved Games & Backups': 'Partidas y copias de seguridad',
    'Help & Credits': 'Ayuda y créditos',
    'Try recovery': 'Intentar recuperar',
  });
  function translateSegment(piece) {
    if (chronicleTranslations.has(piece)) return chronicleTranslations.get(piece);
    // Announcement index titles use a 64-character preview of the original card.
    const chroniclePreview =
      typeof PrototypeNarration !== 'undefined'
        ? PrototypeNarration.find((entry) => entry?.es && entry.text.slice(0, 64) === piece)
        : null;
    if (chroniclePreview) return chroniclePreview.es.slice(0, 64);
    // Earned dungeon/interior/landmark and ending previews also use the
    // manuscript's Spanish words rather than truncating English mid-sentence.
    const approvedPreview = Object.values(approvedNarrative || {}).find(
      (pair) => pair.en.slice(0, 64) === piece,
    );
    if (approvedPreview) return approvedPreview.es.slice(0, 64);
    const ferryPassage = Campaign.rules.tidalFerryPassage;
    if (ferryPassage && piece.startsWith(ferryPassage))
      return spanishText[ferryPassage] + piece.slice(ferryPassage.length);
    // The optional Codices carry author-supplied English and Spanish copy.
    for (const book of Object.values(Campaign.rules.criticalCodices || {})) {
      if (piece === book.name) return book.nameEs;
      if (piece === book.description) return book.descriptionEs;
      if (piece === book.name + ' has already been studied.')
        return book.nameEs + ' ya se ha estudiado.';
      const prefix = 'Learned ' + book.name + ' · ';
      if (piece.startsWith(prefix))
        return 'Aprendido ' + book.nameEs + ' · ' +
          piece.slice(prefix.length).replace('Codices of the Unforeseen', 'Códices de lo Imprevisto');
    }
    // Level-up learning cues are dynamic; translate their current numeric value,
    // without changing the Campaign's authored event or milestone mechanics.
    const levelGrowth = /^Level (\d+)! (Fortitude|Agility|Arcane Power) improved\. Training point available — press C or use Discipline Training\.$/.exec(piece);
    if (levelGrowth)
      return '¡Nivel ' + levelGrowth[1] + '! ' +
        { Fortitude: 'Fortaleza', Agility: 'Agilidad', 'Arcane Power': 'Poder arcano' }[levelGrowth[2]] +
        ' mejorado. Punto de entrenamiento disponible: pulsa C o entra en Entrenamiento de disciplinas.';
    if (/^LEVEL \d+$/.test(piece)) return piece.replace('LEVEL ', 'NIVEL ');
    if (piece === 'Training point available') return 'Punto de entrenamiento disponible';
    if (/^Search /.test(piece)) return piece.replace('Search ', 'Investigar ');
    if (/^(Learn|Train) /.test(piece) && !spanishText[piece])
      return piece
        .replace(/^Learn /, 'Aprender ')
        .replace(/^Train /, 'Entrenar ')
        .replace('Expedition Skill', 'Expedición');
    if (/^Expedition Skill/.test(piece)) return piece.replace('Expedition Skill', 'Expedición');
    if (/^Rank /.test(piece)) return piece.replace('Rank ', 'Rango ');
    if (/^Instructor limit: Rank /.test(piece))
      return piece.replace('Instructor limit: Rank ', 'Límite del instructor: rango ');
    if (/^Skill \d+$/.test(piece)) return piece.replace('Skill ', 'Habilidad ');
    if (/^\d+% inheritance/.test(piece)) return piece.replace('inheritance', 'herencia');
    if (/^Next instructor: /.test(piece))
      return piece.replace('Next instructor: ', 'Siguiente instructor: ');
    if (/% bonus/.test(piece)) return piece.replaceAll('% bonus', '% adicional');
    if (/^Next: /.test(piece)) return piece.replace('Next: ', 'Siguiente: ');
    if (/^Visit /.test(piece)) return piece.replace('Visit ', 'Visita a ');

    if (/^Crowns \d+/.test(piece)) return piece.replace('Crowns ', 'Coronas ');
    if (/^Stored: /.test(piece)) return piece.replace('Stored: ', 'Guardados: ');
    if (/^Equipped weapon: /.test(piece))
      return piece.replace('Equipped weapon: ', 'Arma equipada: ').replace('tier ', 'nivel ');
    if (/^Equipped armor: /.test(piece))
      return piece.replace('Equipped armor: ', 'Armadura equipada: ').replace('tier ', 'nivel ');
    if (/^(Weapon|Armor) reforge: /.test(piece))
      return piece
        .replace('Weapon reforge: ', 'Reforja de arma: ')
        .replace('Armor reforge: ', 'Reforja de armadura: ');
    if (/^Camera \d+%/.test(piece)) return piece.replace('Camera ', 'Cámara ');

    if (/^Local death loss: /.test(piece))
      return piece.replace('Local death loss: ', 'Pérdida local al caer: ');
    if (/^With you /.test(piece)) return piece.replace('With you ', 'Contigo ');
    if (/^Resting /.test(piece)) return piece.replace('Resting ', 'En reserva ');
    if (/^Fallen /.test(piece)) return piece.replace('Fallen ', 'Caídos ');
    if (/^Local group cap /.test(piece))
      return piece.replace('Local group cap ', 'Límite local del grupo ');
    if (/^[0-9]+([/][0-9]+)? owned$/.test(piece)) return piece.replace('owned', 'poseídos');
    if (/^[0-9]+ types$/.test(piece)) return piece.replace('types', 'tipos');
    if (/^[Ee]mployed /.test(piece)) return piece.replace(/^[Ee]mployed /, 'Contratados ');
    if (/^Rest /.test(piece))
      return piece.replace('Rest ', 'Descansar ').replace('Soldier', 'Soldado');
    if (/^Add .+ to group$/.test(piece))
      return piece
        .replace('Add ', 'Añadir ')
        .replace(' to group', ' al grupo')
        .replace('Soldier', 'Soldado');
    if (/^Progress /.test(piece)) return piece.replace('Progress ', 'Progreso ');
    if (/^\d+\/\d+ unlocked$/.test(piece)) return piece.replace('unlocked', 'desbloqueadas');
    if (/^Inspired by /.test(piece)) return piece.replace('Inspired by ', 'Inspirado en ');

    if (Object.prototype.hasOwnProperty.call(spanishText, piece)) return spanishText[piece];
    if (/^One available companion goes away for /.test(piece))
      return piece
        .replace(
          'One available companion goes away for ',
          'Un compañero disponible se ausenta durante ',
        )
        .replace(
          ' minutes of active play. Reserves can go. Tribute is delivered automatically on return.',
          ' minutos de juego activo. Los compañeros en reserva pueden ir. El tributo se entrega automáticamente al regresar.',
        );
    if (/^Cancel queued (recovery|treatment)$/.test(piece))
      return piece
        .replace('Cancel queued recovery', 'Cancelar recuperación en cola')
        .replace('Cancel queued treatment', 'Cancelar tratamiento en cola');
    if (/^Basic Barracks recovery queue: \d+\/3\.$/.test(piece))
      return piece.replace('Basic Barracks recovery queue: ', 'Cola del cuartel básico: ');
    if (/^Full Barracks recovery queue: \d+ \(no limit\)\.$/.test(piece))
      return piece
        .replace('Full Barracks recovery queue: ', 'Cola del cuartel completo: ')
        .replace('(no limit)', '(sin límite)');
    if (/^Recovery page \d+\/\d+$/.test(piece))
      return piece.replace('Recovery page ', 'Página de recuperación ');
    if (/^Queued #\d+$/.test(piece)) return piece.replace('Queued #', 'En cola #');
    if (/^Queued recoveries: /.test(piece))
      return piece.replace('Queued recoveries: ', 'Recuperaciones en cola: ');
    if (/^Queued (recovery|treatment): /.test(piece))
      return piece
        .replace('Queued recovery: ', 'Recuperación en cola: ')
        .replace('Queued treatment: ', 'Tratamiento en cola: ')
        .replace(': Hero', ': Héroe');
    if (/^Cancel queued (Soldier|Ranger)/.test(piece))
      return piece.replace('Cancel queued ', 'Cancelar en cola: ').replace('Soldier', 'Soldado');
    if (/^Queued recruitment: /.test(piece))
      return piece
        .replace('Queued recruitment: ', 'Reclutamiento en cola: ')
        .replace('Soldier', 'Soldado');
    if (/^\d+(?:\/\d+)? crowns$/.test(piece)) return piece.replace('crowns', 'coronas');
    if (/^Recruit (Soldier|Ranger)(?: · \d+ crowns)?$/.test(piece))
      return piece
        .replace('Recruit ', 'Reclutar ')
        .replace('Soldier', 'Soldado')
        .replace('crowns', 'coronas');
    if (/^Treat wounds/.test(piece))
      return piece
        .replace('Treat wounds', 'Curar heridas')
        .replace('crowns', 'coronas');
    if (/^Recover (?!fallen companion|Dark Lord)/.test(piece))
      return piece.replace('Recover ', 'Recuperar ');
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
        .replace('observe Lantern Shore after dark', 'observa Lantern Shore de noche');
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
    if (chronicleTranslations.has(value)) return chronicleTranslations.get(value);
    if (narrativeTranslations.has(value)) return narrativeTranslations.get(value);
    // Archive answers can append live, rule-derived figures to an approved
    // historical passage. Replace ONLY the exact authored substring.
    let localized = value;
    for (const [en, es] of narrativeTranslations)
      if (localized.includes(en)) localized = localized.replace(en, es);
    if (localized !== value) return localized;
    return value
      .split('\n')
      .map((line) => line.split(' · ').map(translateSegment).join(' · '))
      .join('\n');
  }
  function setLanguage(value) {
    language = value === 'es' ? 'es' : 'en';
    if (game) game.rogueNicknameLanguage = language;
    document.documentElement.lang = language === 'es' ? 'es-419' : 'en';
    try {
      localStorage.setItem(languageKey, language);
    } catch (_) {}
    $('menu-button').firstChild.textContent = language === 'es' ? '☰ Menú ' : '☰ Menu ';
    refreshUpdateNotice();
    $('talent-button').firstChild.textContent =
      language === 'es' ? 'Entrenamiento · ' : 'Training · ';
    $('recall-button').firstChild.textContent = language === 'es' ? 'Reagrupar ' : 'Recall squad ';
    $('target-button').firstChild.textContent = language === 'es' ? 'Objetivo ' : 'Target ';
    $('skills').setAttribute('aria-label', language === 'es' ? 'Habilidades' : 'Skills');
    updateHUD();
    if (titleScreen && !started) refreshTitleScreen();
  }

  const writerGuard = PrototypePersistence.createWriterGuard({
    locks: navigator.locks,
    required: location.protocol === 'https:',
  });
  const persistence = PrototypePersistence.create({
    storage: localStorage,
    Campaign,
    status,
    canWrite: writerGuard.canWrite,
  });
  const restartGuard = PrototypePersistence.createRestartGuard({
    storage: localStorage,
    Campaign,
    canWrite: writerGuard.canWrite,
  });
  let profile = {
      nightmareUnlocked: false,
      activeMode: 'normal',
      audio: { ...PrototypeAudio.defaults },
    },
    game,
    titleScreen = null,
    titleLoading = false,
    titleImportNotice = false,
    titleEpoch = 0,
    titleWarmup = null,
    titleSkipGraphics = null,
    sceneTransition = null,
    sceneTransitionEpoch = 0,
    started = false,
    menu = null,
    menuIndex = 0,
    buttons = [],
    keys = {},
    joy = { x: 0, y: 0 },
    last = performance.now(),
    saveTimer = 0,
    hudTimer = 0,
    adaptiveHudState = null,
    focused = true,
    paused = false,
    charge = null,
    queuedCharges = PrototypeInput.createSkillQueue(),
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
    statusContext = null,
    worldPointer = null,
    pointer = null,
    joystickTouchId = null,
    joystickStart = null;
  profile = persistence.loadProfile(profile);
  const audio = new PrototypeAudio(profile.audio);
  audio.setOptimizationMode(optimizationMode);
  audio.enableProduction();
  // Browsers require a user gesture before audible playback. Unlock on that
  // gesture itself, not on the first movement, attack or skill receipt.
  // Existing menu/button unlocks remain the click/tap fallback for WebKit.
  function unlockSoundtrackOnGesture(event) {
    if (event.type === 'keydown' && (event.repeat || event.isComposing)) return;
    if (audio.ctx?.state === 'running') {
      removeEventListener('pointerdown', unlockSoundtrackOnGesture, true);
      removeEventListener('keydown', unlockSoundtrackOnGesture, true);
      return;
    }
    void audio.unlock().then((ready) => {
      if (!ready) return;
      removeEventListener('pointerdown', unlockSoundtrackOnGesture, true);
      removeEventListener('keydown', unlockSoundtrackOnGesture, true);
    });
  }
  addEventListener('pointerdown', unlockSoundtrackOnGesture, true);
  addEventListener('keydown', unlockSoundtrackOnGesture, true);
  if (typeof PrototypeMaterials !== 'undefined')
    PrototypeMaterials.setOptimizationMode(optimizationMode);
  const platform = PrototypePlatform.init(window);
  audio.setMixProfile(platform.mode === 'phone' ? 'phone' : 'reference');
  const input = PrototypeInput.create(localStorage, status);
  let bindingCapture = null;
  document.body.setAttribute('data-phone-layout', input.preferences.phoneLayout);
  document.body.setAttribute('data-joystick-mode', input.preferences.joystickMode);
  document.body.setAttribute('data-hud-style', input.preferences.hudStyle);
  let appRegistration = null,
    appUpdateReady = false,
    appReloadRequested = false,
    installPrompt = null,
    appControllerReloaded = false,
    appUpdateCheck = null,
    appUpdateBusy = false,
    appLastUpdateCheck = -Infinity,
    startupUpdatePending = true,
    startupUpdateNotice = null;
  let hadServiceWorkerController = !!navigator.serviceWorker?.controller;
  function refreshUpdateNotice() {
    appUpdateReady = !!appRegistration?.waiting;
    const button = $('update-button');
    button.hidden = startupUpdatePending || !appUpdateReady;
    button.textContent = tr('Update available');
    button.setAttribute('aria-label', tr('Install available game update'));
    button.disabled = appUpdateBusy || appReloadRequested;
    $('menu-button').classList.toggle('update-ready', appUpdateReady);
    $('menu-button').setAttribute(
      'aria-label',
      tr('Open game menu') + (appUpdateReady ? ' · ' + tr('Update available') : ''),
    );
  }
  function checkAppUpdate(force = false) {
    if (!appRegistration) return Promise.resolve();
    if (appUpdateCheck) return appUpdateCheck;
    if (!force && Date.now() - appLastUpdateCheck < 300000) return Promise.resolve();
    appLastUpdateCheck = Date.now();
    appUpdateCheck = appRegistration.update().finally(() => {
      appUpdateCheck = null;
      refreshUpdateNotice();
    });
    return appUpdateCheck;
  }
  async function updateApp() {
    if (startupUpdatePending || !appRegistration || appUpdateBusy || appReloadRequested) return;
    let activationPause = null;
    appUpdateBusy = true;
    refreshUpdateNotice();
    try {
      // A fully cached waiting update can install even while offline. Never
      // put a network refresh ahead of that ready update.
      if (!appRegistration.waiting) {
        status('Checking for a game update…');
        await checkAppUpdate(true);
      }
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
        if (started && !save()) return;
        activationPause = paused;
        paused = true;
        clearInput();
        audio.setPaused(true);
        appReloadRequested = true;
        appRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        status(
          appRegistration.installing
            ? 'Downloading the game update… You can keep playing.'
            : 'Already up to date.',
        );
      }
    } catch (_) {
      if (activationPause !== null) {
        appReloadRequested = false;
        paused = activationPause;
        audio.setPaused(paused || !focused || document.hidden);
      }
      status('Update unavailable. Your saved run is safe.');
    } finally {
      appUpdateBusy = false;
      refreshUpdateNotice();
    }
  }
  $('update-button').onclick = updateApp;

  // The startup gate runs before the title becomes visible or graphics are
  // prepared. Service-worker installation is atomic: an incomplete download
  // never replaces the previous offline game or its save storage.
  function refreshStartupUpdateNotice() {
    const notice = $('startup-update-notice');
    notice.hidden = !startupUpdateNotice;
    notice.textContent = startupUpdateNotice === 'offline'
      ? (language === 'es'
        ? 'Sin conexión. No se pudieron buscar actualizaciones; jugarás con la última versión instalada.'
        : 'You are offline. Could not check for updates; playing the last installed version.')
      : startupUpdateNotice === 'unavailable'
        ? (language === 'es'
          ? 'No se pudieron buscar actualizaciones. Puedes jugar con la última versión instalada.'
          : 'Could not check for updates. You can play the last installed version.')
        : '';
  }
  function startupUpdateText(english, spanish) {
    $('startup-update-text').textContent = language === 'es' ? spanish : english;
  }
  function startupBound(promise, milliseconds) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), milliseconds);
      Promise.resolve(promise).then(
        (value) => { clearTimeout(timer); resolve(value); },
        () => { clearTimeout(timer); resolve(false); },
      );
    });
  }
  // Browsers can serve an offline page from a service-worker cache while
  // navigator.onLine still reports true. Probe a HEAD request that our worker
  // explicitly does not intercept before claiming an online update check.
  async function startupNetworkAvailable() {
    if (navigator.onLine === false) return false;
    if (typeof fetch !== 'function') return true; // non-browser test shell
    try {
      return !!(await startupBound(
        fetch(new URL('./sw.js?network-probe=' + Date.now(), location.href), {
          method: 'HEAD', cache: 'no-store',
        }).then(() => true, () => false),
        4000,
      ));
    } catch (_) { return false; }
  }
  function waitForWorkerInstall(worker) {
    if (!worker || ['installed', 'activated', 'redundant'].includes(worker.state))
      return Promise.resolve(true);
    return new Promise((resolve) => {
      const done = () => {
        if (!['installed', 'activated', 'redundant'].includes(worker.state)) return;
        worker.removeEventListener('statechange', done);
        resolve(true);
      };
      worker.addEventListener('statechange', done);
      done();
    });
  }
  function finishStartupUpdate() {
    if (!startupUpdatePending) return;
    startupUpdatePending = false;
    $('startup-update').hidden = true;
    refreshUpdateNotice();
    showTitleScreen();
  }
  async function initializeStartupUpdate() {
    const supported = 'serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost' ||
       location.hostname === '127.0.0.1');
    if (!supported) {
      startupUpdateNotice = navigator.onLine === false ? 'offline' : 'unavailable';
      return finishStartupUpdate();
    }
    const serviceWorker = navigator.serviceWorker;
    try {
      startupUpdateText('Checking for updates…', 'Buscando actualizaciones…');
      const reg = await startupBound(
        serviceWorker.getRegistration('./').then(
          (existing) => existing || serviceWorker.register('./sw.js'),
        ),
        12000,
      );
      if (!reg) {
        startupUpdateNotice = navigator.onLine === false ? 'offline' : 'unavailable';
        return finishStartupUpdate();
      }
      appRegistration = reg;
      const watchWorker = () => {
        refreshUpdateNotice();
        reg.installing?.addEventListener('statechange', refreshUpdateNotice);
      };
      reg.addEventListener('updatefound', watchWorker);
      watchWorker();

      // A fully downloaded waiting update also works offline. Otherwise do
      // one explicit freshness check, before any menu or game-scene preparation.
      if (!reg.waiting && serviceWorker.controller) {
        if (!await startupNetworkAvailable()) startupUpdateNotice = 'offline';
        else {
          // A rejected or timed-out check is not an update: keep the complete
          // installed version playable and explain what could not be verified.
          const checked = await startupBound(
            checkAppUpdate(true).then(() => true, () => false), 12000);
          if (!checked)
            startupUpdateNotice = navigator.onLine === false ? 'offline' : 'unavailable';
          if (reg.installing) {
            startupUpdateText('Downloading update…', 'Descargando actualización…');
            const installed = await startupBound(waitForWorkerInstall(reg.installing), 25000);
            if (!installed && !reg.waiting) startupUpdateNotice = 'unavailable';
          }
        }
      } else if (navigator.onLine === false && !reg.waiting) {
        startupUpdateNotice = 'offline';
      }
      if (reg.waiting && serviceWorker.controller) {
        startupUpdateText('Applying update…', 'Aplicando actualización…');
        appReloadRequested = true;
        // controllerchange performs the one silent reload required to load
        // the new HTML, JavaScript, CSS and translations as one coherent build.
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => {
          // An activation that never completes must not trap offline players.
          if (startupUpdatePending && !appControllerReloaded) {
            appReloadRequested = false;
            finishStartupUpdate();
          }
        }, 12000);
        return;
      }
      finishStartupUpdate();
      // Ongoing checks may discover an update while playing, but must never
      // automatically replace the code of an active campaign.
      setInterval(() => {
        if (!document.hidden && navigator.onLine !== false)
          checkAppUpdate().catch(() => {});
      }, 300000);
    } catch (_) {
      // Network, registration and storage failures preserve the old game.
      appReloadRequested = false;
      startupUpdateNotice = navigator.onLine === false ? 'offline' : 'unavailable';
      finishStartupUpdate();
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
      'iPhone / iPad: Safari → Share → Add to Home Screen → Add.\nAndroid / Chrome: browser menu → Install app or Add to Home screen.',
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
  // Technical receipts are quieter than warnings, while save failures and
  // emergency combat pauses must remain legible and screen-reader immediate.
  function statusTier(text) {
    if (
      /critical slowdown|saving failed|storage unavailable|saved run unavailable|recovery failed|returned to (your )?(refuge|recovery point)|emergency reset/i.test(text)
    ) return 'critical';
    if (/legacy save|invalid import|imported successfully|recovery checkpoint/i.test(text))
      return 'important';
    return 'routine';
  }
  function status(text) {
    if (text === 'Saved locally · export for a backup') return;
    const tier = statusTier(text), host = $('status');
    host.dataset.noticeTier = tier;
    host.setAttribute('role', tier === 'critical' ? 'alert' : 'status');
    host.textContent = tr(text);
    statusUntil = performance.now() + (tier === 'critical' || tier === 'important'
      ? 6000 : text === 'Performance recovered: combat resumed.' ? 1750 : 2600);
    statusContext = tier === 'routine'
      ? { game, zone: game?.zoneId, visit: game?.noticeVisit } : null;
  }
  function manaStatus(text) {
    // Dormant MP remains recoverable: the restoration flag brings this back.
    if (PrototypeRules.resourceMode?.manaEnabled !== false) status(text);
  }
  function persistProfile() {
    return persistence.saveProfile(profile);
  }
  function save() {
    return started && persistence.save(game, profile);
  }
  // Live game shell only. Standalone Campaign fixtures remain independent.
  // Bind once after each actual playable Campaign has been created/restored.
  // Both isolated RNG streams resume from the same v4 save state.
  function activateLiveCritical(candidate) {
    if (!candidate) return candidate;
    // Cosmetic capture nicknames follow the current interface language.
    // Existing names never change when the language changes.
    candidate.rogueNicknameLanguage = language;
    if (candidate._criticalPartyNative?.enabled && candidate._criticalWorldNative?.enabled)
      return candidate;
    PrototypeCriticalPartyNative.attachCampaign(
      candidate, PrototypeCriticalExecutions, PrototypeCriticalLevels,
      PrototypeCriticalWorldNative, { enabled: true },
    );
    return candidate;
  }
  function load(mode) {
    if (mode === 'arena' && !combatDiagnosticsEnabled) return false;
    const restored = persistence.load(mode);
    if (!restored) return false;
    game = activateLiveCritical(restored);
    return true;
  }
  let recoveredOnStartup = false;
  let loaded = combatDiagnosticsEnabled
    ? load('arena')
    : (developerEnabled && load('developer')) || load(profile.activeMode);
  if (!loaded) {
    game =
      combatDiagnosticsEnabled ||
      persistence.loadFailed(profile.activeMode) ||
      persistence.exists('normal') ||
      persistence.exists('nightmare')
        ? null
        : persistence.migrateLegacy();
    if (game) {
      game = activateLiveCritical(game);
      loaded = true;
      persistence.writeCandidate(game);
    } else game = activateLiveCritical(new Campaign());
  }
  // An unclean active-session marker indicates the previous browser stopped
  // before its normal shutdown. Keep validated campaign progress, but never
  // restart inside the potentially frozen encounter.
  // Validated campaigns begin loaded but inactive until Continue.
  started = false;
  function reconcileProfileEntitlements() {
    // A completed saved campaign unlocks Nightmare even while the title is
    // inactive. This is a profile entitlement, not a gameplay tick or autosave.
    if (!loaded || !writerGuard.canWrite()) return;
    if (game?.peace && game.s.mode !== 'arena' && game.s.finalRestCompleted &&
        !profile.nightmareUnlocked) {
      profile.nightmareUnlocked = true;
      persistProfile();
    }
  }
  function recoverLoadedSession() {
    if (!loaded || !writerGuard.canWrite()) return;
    const recovered = restartGuard.recover(game);
    if (recovered) {
      recoveredOnStartup = true;
      game = activateLiveCritical(recovered);
      persistence.save(game, profile);
      status(
        recovered.selectedBarracksRespawn()
          ? 'Previous session stopped unexpectedly. Returned to your barracks safely.'
          : 'Previous session stopped unexpectedly. Returned to your refuge safely.',
      );
    }
    // Arm crash recovery only after Continue activates gameplay.
    reconcileProfileEntitlements();
  }
  // Recovery is deferred until an explicit Continue gesture.
  reconcileProfileEntitlements();
  // Navigation is runtime-only and survives manual takeover as a visible guide.
  let navigationGuide = null,
    questGuide = null,
    gatheringGuideRequest = null,
    suspendedGatheringGuide = null,
    recallPractice = null;
  const cancelNavigationButton = document.createElement('button');
  cancelNavigationButton.id = 'cancel-navigation-button';
  cancelNavigationButton.type = 'button';
  cancelNavigationButton.hidden = true;
  cancelNavigationButton.onclick = () => {
    clearWaypoint();
    status(language === 'es' ? 'Ruta cancelada.' : 'Navigation cleared.');
    updateHUD();
  };
  document.body.append(cancelNavigationButton);
  const viewport = { width: innerWidth, height: innerHeight };
  // Arrival is complete only after the navigation-owned move has stopped
  // (or the player manually reaches the same destination). A 55-unit visual
  // cutoff previously hid Cancel while the engine was still walking to 25.
  function navigationArrived(guide) {
    return (
      Math.hypot(game.hero.x - guide.point.x, game.hero.y - guide.point.y) <= 25 &&
      (!guide.autopilot || game.hero.order !== guide.order)
    );
  }
  // A route exists only while a valid chosen navigation session is visible.
  // Quest and gathering guides do not create the contextual navigation HUD button.
  function visibleNavigationRoute() {
    const guide = navigationGuide;
    if (
      !guide ||
      guide.campaign !== game ||
      guide.hero !== game.hero ||
      guide.deaths !== game.s.statistics.deaths ||
      guide.zone !== game.zoneId ||
      game.hero.hp <= 0 ||
      navigationArrived(guide)
    )
      return null;
    const points =
      guide.autopilot && game.hero.order === guide.order && game.hero.path?.length
        ? game.hero.path
        : guide.route;
    return points?.length ? points : null;
  }
  function mapKeyHint() {
    const key = input.key('map');
    return input.actionFor('KeyM') === 'map' && key !== 'M' ? key + ' / M' : key;
  }
  const rendererSetup = {
    getGame: () => game,
    platform,
    chargePresentation,
    queuedChargePresentation,
    isPaused: () => paused || !focused || document.hidden,
    getGuideRoute: () =>
      navigationGuide
        ? visibleNavigationRoute()
        : questGuide?.route?.length
          ? questGuide.route
          : null,
    Campaign,
    PrototypeVisuals,
    PrototypeCombatVisuals,
    PrototypeSprites: typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites,
    PrototypeMaterials: typeof PrototypeMaterials === 'undefined' ? null : PrototypeMaterials,
  };
  const renderer = PrototypeRenderer.create({ ...rendererSetup, canvas: viewport, ctx });
  renderer.setOptimizationMode(optimizationMode);
  const { world } = renderer,
    worldLabelVisible = renderer.labelVisible;
  const runtime = PrototypeRuntime.create();
  const frameProfile = PrototypeRuntime.createFrameProfile();
  const fps = PrototypeRuntime.createFrameRate(localStorage);
  const frameSkip = PrototypeRuntime.createFrameSkip(localStorage);
  const renderResolution = PrototypeRuntime.createResolution(localStorage);
  const autoOptimization = PrototypeRuntime.createAutoOptimization();
  function setOptimizationActive(enabled) {
    const next = !!enabled;
    if (optimizationMode === next) return false;
    optimizationMode = next;
    if (typeof PrototypeMaterials !== 'undefined')
      PrototypeMaterials.setOptimizationMode(next);
    audio.setOptimizationMode(next);
    renderer.setOptimizationMode(next);
    resize();
    runtime.reset();
    frameProfile.reset();
    fps.suspend();
    return true;
  }

  // Opt-in renderer pilot; one live Campaign, no saved graphics state.
  // Canvas is retained as an independent, always-available presentation surface.
  const gpuTrialPanel = document.createElement('section');
  gpuTrialPanel.id = 'gpu-renderer-trial';
  gpuTrialPanel.hidden = true;
  gpuTrialPanel.setAttribute('role', 'region');
  gpuTrialPanel.setAttribute('aria-live', 'polite');
  gpuTrialPanel.style.cssText =
    'position:fixed;top:clamp(24px,10vh,96px);left:50%;transform:translateX(-50%);' +
    'z-index:30;box-sizing:border-box;width:360px;max-width:calc(100vw - 32px);' +
    'max-height:calc(100dvh - 48px);overflow-y:auto;pointer-events:auto;' +
    'background:linear-gradient(160deg,#213944,#13252e);color:#f4f1dc;' +
    'border:1px solid #d8bb7d;border-radius:18px;padding:20px;' +
    'box-shadow:0 18px 48px #000b;text-align:center;font-family:inherit';
  const gpuTrialMessage = document.createElement('p');
  gpuTrialMessage.style.cssText = 'margin:0 0 8px;font-size:16px;font-weight:700;line-height:1.4';
  const gpuTrialHint = document.createElement('p');
  gpuTrialHint.style.cssText = 'margin:0;font-size:13px;line-height:1.5;color:#d4e1dc';
  gpuTrialHint.textContent = tr(
    'WebGL2 may run faster on your device. If it feels slower or looks wrong, return to Canvas.',
  );
  const gpuTrialActions = document.createElement('div');
  gpuTrialActions.style.cssText =
    'display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:20px';
  const gpuKeep = document.createElement('button');
  const gpuRevert = document.createElement('button');
  gpuKeep.style.cssText =
    'display:block;box-sizing:border-box;width:100%;min-height:52px;padding:12px 16px;' +
    'border:2px solid #edd08b;border-radius:12px;background:#caaa68;color:#162730;' +
    'font-size:15px;font-weight:700;line-height:1.3;font-family:inherit;' +
    'cursor:pointer;touch-action:manipulation';
  gpuRevert.style.cssText =
    'display:block;box-sizing:border-box;width:100%;min-height:52px;padding:12px 16px;' +
    'border:2px solid #849ba6;border-radius:12px;background:#294551;color:#f4f1dc;' +
    'font-size:15px;font-weight:700;line-height:1.3;font-family:inherit;' +
    'cursor:pointer;touch-action:manipulation';
  gpuTrialActions.append(gpuKeep, gpuRevert);
  gpuTrialPanel.append(gpuTrialMessage, gpuTrialHint, gpuTrialActions);
  document.body.append(gpuTrialPanel);
  let graphicsController = null;
  // Some isolated gameplay test shells intentionally omit optional rendering
  // modules. Never make their absence stop the original Canvas game.
  const pixiUnavailable = {
    prepare: async () => false,
    noteEvents() {},
    draw() {},
    activate() {},
    deactivate() {},
    release() {},
    status: () => ({ active: false, available: false }),
  };
  const pixiGame =
    typeof PrototypePixiExperimental === 'undefined'
      ? pixiUnavailable
      : PrototypePixiExperimental.create({
          worldCanvas: canvas,
          viewport,
          platform,
          getGame: () => game,
          canvasRenderer: renderer,
          getRendererOptions: () => rendererSetup,
          getOptimizationMode: () => optimizationMode,
          onPreparationProgress: ({ prepared, total }) => {
            // One loading surface throughout decode, terrain tiles and GPU
            // uploads; the count shows actual completed terrain tiles.
            const message = language === 'es'
              ? 'Preparando terreno ' + prepared + '/' + total + '…'
              : 'Preparing terrain ' + prepared + '/' + total + '…';
            if (titleLoading && $('title-loading')) $('title-loading').textContent = message;
            else if (sceneTransition && $('scene-loading-text'))
              $('scene-loading-text').textContent = message;
          },
          onFailure: (failure) => {
            graphicsController?.webglFailed(failure);
            const recovery = graphicsController?.status();
            status(recovery?.recoveryPending
              ? 'PixiJS issue: Canvas backup active; WebGL2 will retry when safe.'
              : 'WebGL2 returned to Canvas: ' + failure.message);
          },
        });
  // Fan out presentation events without editing the protected simulation loop.
  const queueOriginalVisuals = renderer.queue;
  renderer.queue = (events) => {
    queueOriginalVisuals(events);
    pixiGame.noteEvents(events);
  };
  function updateGpuTrial(snapshot) {
    const trial = snapshot.phase === 'trial';
    const preparing = snapshot.phase === 'preparing';
    // A launch remains one visible title-screen preparation, including
    // Pixi initialization and the actual saved arrival's GPU uploads.
    // Manual renderer changes outside startup retain the Keep/Revert panel.
    gpuTrialPanel.hidden = (!trial && !preparing) || (preparing && titleLoading);
    gpuTrialActions.style.display = trial ? 'grid' : 'none';
    if (preparing) {
      gpuTrialMessage.textContent = tr('Preparing PixiJS graphics…');
      return;
    }
    if (!trial) {
      // Announce actual transitions rather than silently dismissing the
      // panel. The HUD's role=status announces this to assistive technology.
      if (snapshot.reason === 'user-confirmed' ||
          snapshot.reason === 'confirmed-this-session-only')
        status('PixiJS WebGL2 ready and selected.');
      else if (snapshot.reason === 'user-chose-canvas')
        status('Canvas 2D ready and selected.');
      else if (snapshot.reason === 'webgl-recovery-pending')
        status('WebGL2 interrupted. Canvas is active; retry when safe.');
      else if (snapshot.reason === 'webgl-recovery-attempt')
        status('Canvas is active. Trying to restore WebGL2…');
      else if (snapshot.reason === 'confirmed-webgl-restored')
        status('PixiJS WebGL2 restored.');
      else if (snapshot.reason === 'webgl-recovery-paused')
        status('Canvas backup active. WebGL2 recovery paused after repeated failures.');
      return;
    }
    gpuTrialMessage.textContent =
      tr('PixiJS WebGL2 · Experimental') + ' · ' + snapshot.secondsRemaining + 's';
    gpuKeep.textContent = tr('Keep WebGL2');
    gpuRevert.textContent = tr('Revert to Canvas');
  }
  const fallbackController = {
    status: () => ({ mode: 'canvas2d', phase: 'canvas', secondsRemaining: 0 }),
    requestWebGL: async () => false,
    resumeConfirmedWebGL: async () => false,
    maybeRecover: async () => false,
    confirm: () => false,
    revert: () => false,
    webglFailed: () => false,
    visibilityChanged() {},
  };
  const graphicsGuard =
    typeof AzerothRendererSwitchGuard === 'undefined' ? null : AzerothRendererSwitchGuard;
  const previousRendererChoice = graphicsGuard
    ? graphicsGuard.startupChoice(localStorage)
    : { renderer: 'canvas2d' };
  graphicsController = graphicsGuard
    ? graphicsGuard.create({
        storage: localStorage,
        prepareWebGL: () => pixiGame.prepare(),
        getFailureDetails: () => pixiGame.failureDetails?.() || null,
        // Do not rebuild a GPU scene while the player is moving or enemies
        // could immediately engage. A recovery happens when the scene is
        // visible, idle and outside nearby danger.
        canRecover: () => {
          if (!started || paused || menu || !focused || document.hidden ||
              frameSkip.emergency || joy.x || joy.y || game.hero.order ||
              game.hero.path?.length || game.s.projectiles?.length ||
              keys.left || keys.right || keys.up || keys.down) return false;
          return (game.zone()?.enemies || []).every((enemy) =>
            enemy.hp <= 0 || Math.hypot(enemy.x - game.hero.x, enemy.y - game.hero.y) > 420
          );
        },
        showWebGL: () => {
          renderer.setRenderLayer('overlay');
          pixiGame.activate();
          renderer.draw();
        },
        showCanvas: () => {
          pixiGame.deactivate();
          renderer.setRenderLayer('full');
          renderer.draw();
          // Only release GPU resources after the reliable Canvas is visible.
          pixiGame.release();
        },
        notify: updateGpuTrial,
      })
    : fallbackController;
  gpuKeep.onclick = () => graphicsController.confirm();
  gpuRevert.onclick = () => graphicsController.revert();
  // iOS Home Screen PWAs dispatch visibilitychange on document, not window.
  document.addEventListener('visibilitychange', () =>
    graphicsController.visibilityChanged(document.hidden),
  );
  addEventListener('pagehide', () => graphicsController.visibilityChanged(true));
  // Keep the fresh-launch title visible. Do not initialize previously confirmed
  // Pixi in a separate, player-visible pass before Continue/New Game. The first
  // playable scene will coordinate sprite, renderer and arrival GPU preparation
  // under one title-screen loading state, using the saved spawn when available.
  function drawWorld() {
    // These measure synchronous draw calls, not completed GPU/presented frames.
    const timing = {
      pixiMs: 0,
      canvasOverlayMs: 0,
      canvasWorldMs: 0,
      pixiAttempted: false,
      canvasOverlayDrawn: false,
      canvasWorldDrawn: false,
    };
    if (graphicsController.status().mode === 'webgl2') {
      const startedAt = performance.now();
      timing.pixiAttempted = true;
      try {
        pixiGame.draw();
      } catch (error) {
        // Pixi normally reports an exact failure first; preserve it.
        // This catches only otherwise unhandled wrapper exceptions.
        graphicsController.webglFailed({
          type: 'render-exception',
          stage: 'draw-world',
          message: String(error?.message || error),
        });
      } finally {
        // An exception may include fallback cleanup inside the timed call.
        timing.pixiMs = Math.max(0, performance.now() - startedAt);
      }
    }
    const overlay = graphicsController.status().mode === 'webgl2';
    const canvasStartedAt = performance.now();
    renderer.draw();
    const canvasMs = Math.max(0, performance.now() - canvasStartedAt);
    if (overlay) {
      timing.canvasOverlayMs = canvasMs;
      timing.canvasOverlayDrawn = true;
    } else {
      timing.canvasWorldMs = canvasMs;
      timing.canvasWorldDrawn = true;
    }
    return timing;
  }
  function addRenderStageTimes(stageTimes, timing) {
    for (const key of ['pixiMs', 'canvasOverlayMs', 'canvasWorldMs'])
      stageTimes[key] += timing[key];
    for (const key of ['pixiAttempted', 'canvasOverlayDrawn', 'canvasWorldDrawn'])
      stageTimes[key] ||= timing[key];
  }

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
    announcements,
    transport,
    refugeIntro,
    dungeonEntranceMenu,
  } = PrototypeMenus.create({
    getGame: () => game,
    Campaign,
    D,
    action,
    openMenu,
    closeMenu,
    practiceRecall,
    showMap,
    finaleMenu,
    storyNavigate,
    chooseNewRun: (mode) => chooseLanguage(mode),
    status,
    requestName,
    sceneTransitionTo,
    openCharacter: characterMenu,
  });

  window.Prototype = {
    get game() {
      return game;
    },
    get started() {
      return started;
    },
    get sceneLoading() {
      return !!sceneTransition;
    },
    audio,
    renderer,
    get experimentalGraphics() {
      return { ...graphicsController.status(), ...pixiGame.status() };
    },
    platform,
    runtime,
    frameProfile,
    renderResolution,
    fps,
    frameSkip,
    input,
    save,
    openMenu,
    closeMenu,
    get menuControls() {
      return menuControls;
    },
    updateHUD,
    labelVisible: worldLabelVisible,
    chargePresentation,
    queuedChargePresentation,
    get trackedWaypoint() {
      const points = visibleNavigationRoute();
      return points
        ? {
            id: navigationGuide.destination.id || null,
            kind: 'navigation',
            zone: navigationGuide.zone,
            points: points.map((p) => ({ ...p })),
          }
        : !navigationGuide && questGuide
          ? {
              id: questGuide.id || questGuide.nodeId,
              kind: questGuide.kind || 'quest',
              zone: questGuide.zone,
              points: questGuide.route.map((p) => ({ ...p })),
            }
          : null;
    },
    cancelNavigation: clearWaypoint,
    get navigationState() {
      return visibleNavigationRoute()
        ? { active: true, autopilot: navigationGuide.autopilot, zone: navigationGuide.zone }
        : { active: false, autopilot: false, zone: null };
    },
    get trackedQuest() {
      return questGuide?.id || null;
    },
    get profile() {
      return profile;
    },
    get paused() {
      return paused || !!menu || !focused || document.hidden;
    },
  };
  // Bitmap dimension assignments erase every Canvas pixel, even when the
  // assigned size is unchanged. Retain the current image on harmless resize
  // requests (including some optimization-mode and viewport notifications).
  // Count actual surface resets in the existing local playtest report so a
  // reported twilight flash can be correlated with real backing changes.
  const canvasBackingDiagnostics = {
    resizeRequests: 0,
    backingResets: 0,
    avoidedResets: 0,
    lastReset: null,
  };
  function resize() {
    // Keep the 15-second *unconfirmed* trial conservative: resizing during
    // the trial still safely reverts. A confirmed selection instead rebuilds
    // viewport-sized Pixi scene layers on the next draw. This allows a
    // backgrounded iPhone PWA to resume after normal viewport changes.
    if (
      graphicsController?.status().phase === 'trial' &&
      (viewport.width !== innerWidth || viewport.height !== innerHeight)
    ) {
      const gpu = pixiGame.status();
      graphicsController.webglFailed({
        type: 'viewport-changed',
        stage: 'resize',
        message: 'Viewport dimensions changed; Canvas restored',
        resources: {
          loadedTextures: gpu.loadedTextures,
          proceduralTextures: gpu.proceduralTextures,
          proceduralBytes: gpu.proceduralBytes,
        },
      });
    }
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
    const maximumRatio = optimizationMode
      ? 1
      : Math.max(
          1,
          Math.min(
            window.devicePixelRatio || 1,
            platform.mode === 'phone' ? 1.5 : 2,
            Math.sqrt(3000000 / (innerWidth * innerHeight)),
          ),
        );
    renderResolution.configure(maximumRatio);
    // Arena only: hard-cap world pixels without saving a preference.
    const ratio = game?.s?.mode === 'arena' ? Math.min(renderResolution.ratio, 0.5) : renderResolution.ratio;
    const backingWidth = Math.round(innerWidth * ratio),
      backingHeight = Math.round(innerHeight * ratio),
      widthChanged = canvas.width !== backingWidth,
      heightChanged = canvas.height !== backingHeight;
    canvasBackingDiagnostics.resizeRequests++;
    if (widthChanged) canvas.width = backingWidth;
    if (heightChanged) canvas.height = backingHeight;
    if (widthChanged || heightChanged) {
      canvasBackingDiagnostics.backingResets++;
      canvasBackingDiagnostics.lastReset = {
        width: backingWidth,
        height: backingHeight,
        clock: Number.isFinite(game?.s?.clock) ? game.s.clock : null,
        phase: game?.daylightPhase?.().phase || null,
      };
    } else canvasBackingDiagnostics.avoidedResets++;
    // Restore presentation scale even when the existing bitmap is retained.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize();
  if (game.s.mode === 'arena') {
    // A resumed diagnostic save needs the same low-cost Canvas setup as new runs.
    graphicsController.revert();
    setOptimizationActive(true);
    resize();
  }
  addEventListener('resize', () => {
    releaseJoystick();
    resize();
  });
  function activePlay() {
    return (
      started &&
      writerGuard.canWrite() &&
      !persistence.conflicted(game.s.mode) &&
      !paused &&
      !menu &&
      !frameSkip.emergency &&
      focused &&
      !document.hidden &&
      !game.s.challenge.pending &&
      !game.s.challenge.gameOver
    );
  }
  function help(back = closeMenu) {
    const returnHere = () => help(back);
    openMenu(
      'Controls',
      'Choose a topic or adjust your inputs.',
      [
        action('Customize keyboard', () => keyboardMenu(back)),
        action('Touch and mouse options', () => pointerMenu(back)),
        action('Movement and menus', () => {
          const keys = ['up', 'left', 'down', 'right'].map((id) => input.key(id)).join('/');
          openMenu(
            'Movement and menus',
            language === 'es'
              ? 'Moverse: ' +
                  keys +
                  ' o palanca táctil. Interactuar: ' +
                  input.key('confirm') +
                  '. Mapa: ' +
                  mapKeyHint() +
                  '.\nMenú: Esc. Flechas para elegir, ' +
                  input.key('confirm') +
                  '/Enter para confirmar y Esc para volver.'
              : 'Move: ' +
                  keys +
                  ' or joystick. Interact: ' +
                  input.key('confirm') +
                  '. Map: ' +
                  mapKeyHint() +
                  '.\nMenu: Esc. Arrows select, ' +
                  input.key('confirm') +
                  '/Enter confirms, Esc returns.',
            [],
            returnHere,
          );
        }),
        action('Skills and targeting', () => combatHelp(returnHere)),
        action('Companion commands', () =>
          openMenu(
            'Companion commands',
            language === 'es'
              ? 'Reagrupar: ' +
                  input.key('recall') +
                  '. Tus compañeros vuelven contigo.\nCuración Ranger: ' +
                  input.key('heal') +
                  '. En recuperación, toca para poner tu curación en cola.\nRecupera a los caídos con un capitán o cuartel.'
              : 'Recall: ' +
                  input.key('recall') +
                  '. Companions return to you.\nCompanion Heal: ' +
                  input.key('heal') +
                  '. During cooldown, tap to queue hero healing.\nRecover fallen companions at a Captain or Barracks.',
            [],
            returnHere,
          ),
        ),
      ],
      back,
    );
  }
  function combatHelp(back) {
    const returnHere = () => combatHelp(back);
    const explain = (title, en, es) => () =>
      openMenu(title, language === 'es' ? es : en, [], returnHere);
    openMenu(
      'Skills and targeting',
      'Choose the control you want to learn.',
      [
        action(
          'Using skills',
          explain(
            'Using skills',
            'Tap for normal, hold until CHARGED and release. Charged starts the short Tap cooldown and its own longer one; Tap returns earlier without extending Charged. Automatic Skill 1 basics continue separately. See the Skill journal.',
            'Toca para normal o mantén hasta CARGADA y suelta. La cargada inicia ambas recuperaciones; normal vuelve antes y no prolonga cargada. Los ataques básicos de la habilidad 1 siguen aparte. Consulta el Diario.',
          ),
        ),
        action(
          'Queued skills',
          explain(
            'Queued skills',
            'During Tap recovery, tap to queue normal. Hold briefly to queue Charged until both timers are ready. A ready Tap can be used while Charged recovers. Blue numbers mean normal; gold means charged.',
            'Mientras normal se recupera, tócala para ponerla en cola. Mantén brevemente para poner cargada en cola hasta que ambas recuperaciones terminen. Normal puede usarse aunque cargada siga en recuperación. Azul: normal; dorado: cargada.',
          ),
        ),
        action(
          'Targeting and dodging',
          explain(
            'Targeting and dodging',
            'Target: ' +
              input.key('target') +
              '. Tap to cycle; hold to lock.\nAim: gold is clear, amber is too far, red is blocked. Dodge marked attacks.',
            'Objetivo: ' +
              input.key('target') +
              '. Toca para cambiar; mantén para fijar.\nPuntería: dorado, despejada; ámbar, lejos; rojo, bloqueada. Esquiva ataques marcados.',
          ),
        ),
        action('Combat conditions', () => combatConditions(returnHere)),
      ],
      back,
    );
  }
  function chooseKeyboardPreset(name, back) {
    openMenu(
      'Apply keyboard preset',
      language === 'es'
        ? 'Esto reemplaza las teclas actuales. La partida y los controles táctiles no cambian.'
        : 'This replaces current key bindings. Your campaign and touch controls are unchanged.',
      [
        action('Apply preset', () => {
          input.applyPreset(name);
          clearInput();
          updateHUD();
          keyboardMenu(back);
        }),
        action('Keep current keys', () => keyboardMenu(back)),
      ],
      () => keyboardMenu(back),
    );
  }
  // Keep the parent Back route stable across previews and key binding edits,
  // so the shared menu foundation can restore the highlighted category.
  const keyboardBackRoutes = new WeakMap();
  const keyboardGroups = [
    {
      id: 'movement',
      title: 'Movement and menu keys',
      ids: ['up', 'down', 'left', 'right', 'confirm'],
    },
    {
      id: 'combat',
      title: 'Skills and combat keys',
      ids: [
        'skill1',
        'skill2',
        'skill3',
        'skill4',
        'skill5',
        'skill6',
        'skill7',
        'skill8',
        'target',
        'heal',
        'mana',
      ],
    },
    {
      id: 'commands',
      title: 'Companion and utility keys',
      ids: ['doctrine', 'recall', 'map', 'training', 'skills', 'pause', 'help'],
    },
  ];
  function keyboardBindingsMenu(group, back, returnToKeyboard = () => keyboardMenu(back)) {
    const returnHere = () => keyboardBindingsMenu(group, back, returnToKeyboard);
    const entries = input.actions
      .filter(([id]) => group.ids.includes(id))
      .map(([id, name]) => {
        const item = action(name + ' · ' + input.key(id), () => {
          openMenu(
            'Bind ' + name,
            'Press a new key for ' + name + '. Esc cancels.',
            [],
            returnHere,
          );
          bindingCapture = id;
        });
        // Labels change after binding, but this stable identity preserves
        // the selected action when the player returns from key capture.
        item.key = 'binding:' + id;
        return item;
      });
    openMenu(
      group.title,
      'Choose an action to change its key. Esc cancels.',
      entries,
      returnToKeyboard,
    );
  }
  function keyboardMenu(back = systemMenu) {
    bindingCapture = null;
    const presetNames = {
      right: language === 'es' ? 'Mano derecha + WASD' : 'Right-hand skills + WASD',
      classic: language === 'es' ? 'Clásico (números)' : 'Classic (numbers)',
      left: language === 'es' ? 'Mano izquierda + IJKL' : 'Left-hand skills + IJKL',
      custom: language === 'es' ? 'Personalizado' : 'Custom',
    };
    if (!keyboardBackRoutes.has(back)) keyboardBackRoutes.set(back, () => help(back));
    const returnToHelp = keyboardBackRoutes.get(back);
    openMenu(
      'Customize keyboard',
      language === 'es'
        ? 'Distribución: ' + presetNames[input.preferences.preset] + '. Elige una o cambia teclas.'
        : 'Layout: ' + presetNames[input.preferences.preset] + '. Choose a preset or rebind keys.',
      [
        menuControls.section('Keyboard presets'),
        action('Right-hand skills (WASD) · Default', () => chooseKeyboardPreset('right', back)),
        action('Classic · number keys', () => chooseKeyboardPreset('classic', back)),
        action('Left-hand skills (IJKL)', () => chooseKeyboardPreset('left', back)),
        menuControls.section('Key bindings'),
        ...keyboardGroups.map((group) =>
          action(
            group.title,
            () => keyboardBindingsMenu(group, back),
            group.ids.filter((id) => input.actions.some(([candidate]) => candidate === id)).length +
              ' actions',
          ),
        ),
        action('Restore default keys', () => chooseKeyboardPreset('right', back)),
      ],
      returnToHelp,
    );
  }
  function pointerMenu(back = systemMenu) {
    const p = input.preferences;
    const select = (name, value) => {
      input.select(name, value);
      document.body.setAttribute('data-phone-layout', input.preferences.phoneLayout);
      document.body.setAttribute('data-joystick-mode', input.preferences.joystickMode);
      document.body.setAttribute('data-hud-style', input.preferences.hudStyle);
      adaptiveHudState = null;
      clearInput();
      syncJoystickPresentation();
      runtime.reset();
      frameProfile.reset();
      updateHUD();
    };
    openMenu(
      'Touch and mouse options',
      'Choose your layout and movement controls.',
      [
        menuControls.section('Touch controls'),
        menuControls.select(
          'Phone layout',
          p.phoneLayout,
          [
            { value: 'two-thumb', label: 'Two thumbs' },
            { value: 'left-hand', label: 'Left hand' },
          ],
          (value) => select('phoneLayout', value),
          'Two thumbs: movement left, skills right. Left hand: skills above the joystick.',
        ),
        menuControls.select(
          'HUD style',
          p.hudStyle,
          [
            { value: 'classic', label: 'Classic' },
            { value: 'adaptive', label: 'Adaptive' },
          ],
          (value) => select('hudStyle', value),
          'Adaptive quietly reduces idle control backgrounds; all learned actions stay available.',
        ),
        menuControls.select(
          'Movement joystick',
          p.joystickMode,
          [
            { value: 'fixed', label: 'Fixed' },
            { value: 'floating', label: 'Floating' },
          ],
          (value) => select('joystickMode', value),
          'Floating: touch the lower-left movement area; menus keep the fixed stick.',
        ),
        menuControls.toggle(
          'Touch tap-to-move',
          p.touchMove,
          (enabled) => select('touchMove', enabled),
          'Tap reachable ground to move.',
        ),
        menuControls.section('Mouse controls'),
        menuControls.toggle(
          'Mouse click-to-move',
          p.mouseMove,
          (enabled) => select('mouseMove', enabled),
          manaEnabled
            ? 'When off, left click in the world commands companion Heal. Right click commands Ranger Mana Recovery.'
            : 'When off, left click in the world commands companion Heal.',
        ),
      ],
      () => help(back),
    );
  }
  function cancelTravel() {
    worldPointer = null;
    if (game) {
      if (navigationGuide?.autopilot && game.hero.order === navigationGuide.order) {
        navigationGuide.autopilot = false;
        navigationGuide.next = 0;
      }
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
    document.body.classList.remove('floating-joystick-active');
  }
  function syncJoystickPresentation() {
    const invisible = platform.mode === 'phone' && input.preferences.joystickMode === 'floating' && !menu;
    const control = $('joystick');
    control.tabIndex = invisible ? -1 : 0;
    control.setAttribute('aria-hidden', invisible ? 'true' : 'false');
  }
  function clearInput(preserveNavigation = true) {
    syncPartyChargeClock();
    if (typeof Sprint !== 'undefined') Sprint.release();
    if (queuedCharges.size)
      status(language === 'es' ? 'Cola de habilidades cancelada.' : 'Skill queue cancelled.');
    queuedCharges.clear();
    game?.cancelRangerHealRequest();
    cancelCharge();
    cancelTargetPress();
    keys = {};
    releaseJoystick();
    // Modal input cleanup must not cancel a still-owned walking order.
    if (
      preserveNavigation &&
      navigationGuide?.autopilot &&
      game?.hero.order === navigationGuide.order
    )
      worldPointer = null;
    else cancelTravel();
  }
  // Shared presentation controls. Gameplay menus still use action() unchanged.
  const menuControls = Object.freeze({
    section: (label, detail = '') => ({ kind: 'section', label, detail }),
    toggle: (label, value, onChange, detail = '', saveCampaign = true) => ({
      kind: 'toggle',
      label,
      value: !!value,
      onChange,
      detail,
      saveCampaign,
    }),
    slider: (
      label,
      value,
      min,
      max,
      step,
      onChange,
      detail = '',
      suffix = '',
      saveCampaign = true,
    ) => ({
      kind: 'slider',
      label,
      value,
      min,
      max,
      step,
      onChange,
      detail,
      suffix,
      saveCampaign,
    }),
    select: (label, value, options, onChange, detail = '') => ({
      kind: 'select',
      label,
      value,
      options,
      onChange,
      detail,
    }),
  });
  const menuHistory = [];
  let menuReturnFocus = null;
  let menuKeys = [];
  function menuPosition(title, back) {
    if (!menu) {
      menuHistory.length = 0;
      const focused = document.activeElement;
      menuReturnFocus =
        focused && focused !== document.body && focused !== $('modal') ? focused : null;
      return null;
    }
    const previous = {
      title: menu.title,
      back: menu.back,
      index: menuIndex,
      key: menuKeys[menuIndex],
      scrollTop: $('modal-content').scrollTop || 0,
    };
    if (previous.title === title && previous.back === back) return previous;
    // A rebuilt ancestor is a Back transition, even when its caller is a
    // skill/service confirmation rather than the physical Back button.
    for (let i = menuHistory.length - 1; i >= 0; i--) {
      if (menuHistory[i].title !== title || menuHistory[i].back !== back) continue;
      const restored = menuHistory[i];
      menuHistory.length = i;
      return restored;
    }
    menuHistory.push(previous);
    return null;
  }
  function action(label, fn, detail = '', disabled = false, tutorialHighlight = false, classId = null) {
    return {
      label,
      action: (...args) => {
        if (!writerGuard.canWrite() || persistence.conflicted(game.s.mode)) {
          savedRunConflictMenu();
          return;
        }
        return fn(...args);
      },
      detail,
      disabled,
      tutorialHighlight,
      classId,
    };
  }
  function translateMenu(value) {
    if (
      language === 'es' &&
      menu?.view?.startsWith('archive-') &&
      typeof PrototypeArchive !== 'undefined'
    ) {
      // Exact UI labels must be resolved before the generic translator turns
      // "Return to the answer" into a partly translated "Regresar a ..." label.
      // Author-final prose deliberately bypasses this exact-UI-only lookup.
      const label = PrototypeArchive.translateArchiveLabel(value);
      if (label !== value) return label;
      return PrototypeArchive.translateArchive(
        value,
        PrototypeArchive.translationNames(game, { D, R: Campaign.rules }),
      );
    }
    return tr(value);
  }
  function openMenu(title, description = '', actions = [], back = closeMenu, options = {}) {
    const restored = menuPosition(title, back);
    bindingCapture = null;
    clearInput(true);
    gateDismissed = false;
    menu = { title, description, actions, back, view: options.view || 'default' };
    $('modal').setAttribute(
      'data-view',
      options.view ||
        (title === 'The Crown · Credits'
          ? 'credits'
          : title === 'Adventure menu'
            ? 'adventure'
            : title === 'Game and settings'
              ? 'settings'
              : 'default'),
    );
    // Small interactions need a small dialog; longer service catalogs keep a readable width.
    const archiveLayout =
      options.view === 'archive-reading' &&
      !!options.archiveSection &&
      typeof PrototypeArchiveReading !== 'undefined';
    const display = archiveLayout
      ? PrototypeArchiveReading.present({
          title,
          text: translateMenu(description),
          section: options.archiveSection,
          figures: options.archiveFigures,
        })
      : description;
    const structured = Array.isArray(display?.sections);
    // Localize the complete audited string once, then only arrange its fragments.
    const renderedText = archiveLayout ? (value) => value : translateMenu;
    const hasControls = actions.some((entry) => !!entry.kind);
    const compact =
      !structured &&
      !hasControls &&
      actions.length <= 2 &&
      description.length <= 180 &&
      actions.every((a) => a.label.length <= 46 && (a.detail || '').length <= 95);
    const regular =
      structured ||
      (!hasControls &&
        actions.length <= 5 &&
        description.length <= 340 &&
        actions.every((a) => a.label.length <= 68 && (a.detail || '').length <= 160));
    $('modal').setAttribute('data-dialog-size', compact ? 'compact' : regular ? 'regular' : 'wide');
    audio.interfaceSound('open');
    menuIndex = 0;
    document.body.classList.add('menu-open');
    syncJoystickPresentation();
    $('modal').hidden = false;
    $('modal-title').textContent = translateMenu(title);
    const descriptionHost = $('modal-description');
    const archiveReading = menu.view === 'archive-reading';
    // A4: make a long answer separately reachable for keyboard and assistive
    // technology without changing its full author-approved text or scroll.
    descriptionHost.tabIndex = archiveReading ? 0 : -1;
    if (archiveReading) descriptionHost.setAttribute('role', 'document');
    else {
      descriptionHost.removeAttribute('role');
      descriptionHost.removeAttribute('aria-label');
    }
    if (archiveReading)
      descriptionHost.setAttribute(
        'aria-label',
        language === 'es' ? 'Lectura del Archivo' : 'Archive reading',
      );
    descriptionHost.classList.toggle('skill-reference', structured);
    descriptionHost.classList.toggle('archive-reference', structured && archiveReading);
    descriptionHost.textContent = renderedText(structured ? display.summary || '' : display);
    if (structured) {
      for (const block of display.sections) {
        const section = document.createElement('section'),
          heading = document.createElement('h3');
        if (archiveLayout && !block.title && block.rows?.length === 1 && !block.rows[0].label)
          section.className = 'archive-prose';
        heading.textContent = renderedText(block.title);
        if (block.title) section.append(heading);
        if (block.text) {
          const text = document.createElement('p');
          text.textContent = renderedText(block.text);
          section.append(text);
        }
        if (block.rows?.length) {
          const list = document.createElement('dl');
          for (const row of block.rows) {
            const term = document.createElement('dt'),
              value = document.createElement('dd');
            term.textContent = renderedText(row.label);
            value.textContent = renderedText(row.value);
            list.append(term, value);
          }
          section.append(list);
        }
        for (const paragraph of block.paragraphs || []) {
          const p = document.createElement('p');
          p.textContent = renderedText(paragraph);
          section.append(p);
        }
        if (archiveReading && block.formula) {
          const details = document.createElement('details'),
            summary = document.createElement('summary'),
            formula = document.createElement('p');
          summary.textContent = translateMenu('Exact calculation');
          formula.textContent = renderedText(block.formula);
          details.append(summary, formula);
          section.append(details);
        }
        descriptionHost.append(section);
      }
      if (display.note) {
        const note = document.createElement('p');
        note.className = 'skill-note';
        note.textContent = renderedText(display.note);
        descriptionHost.append(note);
      }
    }
    $('modal-content').scrollTop = 0;
    renderActions();
    if (restored) {
      const match = menuKeys.indexOf(restored.key);
      menuIndex = match >= 0 ? match : Math.min(restored.index, buttons.length - 1);
      highlight();
      $('modal-content').scrollTop = restored.scrollTop;
    }
    // Give keyboard and assistive-technology users a reliable dialog focus entry.
    $('modal').tabIndex = -1;
    if (restored && buttons[menuIndex] && !buttons[menuIndex].disabled)
      buttons[menuIndex].focus?.({ preventScroll: true });
    else $('modal').focus?.({ preventScroll: true });
  }
  // The browser must receive a trusted click on the actual file input.
  // Preserve its stable DOM node and onchange handler between dialog rebuilds.
  const importFileInput = $('import-file');
  function renderActions() {
    const host = $('modal-actions');
    if (!importFileInput.hidden) {
      importFileInput.hidden = true;
      document.body.append(importFileInput);
    }
    host.replaceChildren();
    buttons = [];
    menuKeys = [];
    if (menu.view === 'archive-reading') {
      for (const summary of $('modal-description').querySelectorAll?.('summary') || []) {
        const index = buttons.length;
        summary.onfocus = () => {
          menuIndex = index;
          highlight();
        };
        summary.onclick = () => {
          menuIndex = index;
          highlight();
        };
        buttons.push(summary);
        menuKeys.push('__archive_formula_' + index);
      }
    }
    const commit = (entry, value) => {
      entry.value = value;
      entry.onChange(value);
      // Profile-only controls already persist their preference on change.
      // Avoid serializing the entire campaign on every volume-slider tick.
      if (started && entry.saveCampaign !== false) save();
      updateHUD();
    };
    const details = (hostElement, entry) => {
      if (!entry.detail) return;
      if (menu.view === 'class-select' && entry.detail.includes('\n')) {
        const [role, growth] = entry.detail.split('\n');
        for (const [text, className] of [
          [role, 'class-role'],
          [growth, 'class-growth'],
        ]) {
          const span = document.createElement('span');
          span.className = 'detail ' + className;
          span.textContent = translateMenu(text);
          hostElement.append(span);
        }
        return;
      }
      const span = document.createElement('span');
      span.className = 'detail';
      span.textContent = translateMenu(entry.detail);
      hostElement.append(span);
    };
    for (const [index, a] of menu.actions.entries()) {
      if (a.kind === 'section') {
        const heading = document.createElement('h3');
        heading.className = 'menu-section';
        heading.textContent = translateMenu(a.label);
        host.append(heading);
        if (a.detail) {
          const note = document.createElement('p');
          note.className = 'menu-section-detail';
          note.textContent = translateMenu(a.detail);
          host.append(note);
        }
        continue;
      }
      let b, fileRow = null;
      if (a.kind === 'file') {
        // Keep the native input in the visible clickable row. An invisible
        // off-menu input activated by a programmatic click can fail to show
        // the system picker in a Chromium PWA.
        b = importFileInput;
        b.hidden = false;
        b.disabled = false;
        b.setAttribute('aria-label', tr(a.label));
        b.onclick = () => {};
        fileRow = document.createElement('label');
        fileRow.className = 'menu-import-picker';
        fileRow.textContent = tr(a.label);
        fileRow.append(b);
      } else if (a.kind === 'toggle') {
        b = document.createElement('button');
        b.className = 'menu-setting-toggle';
        const update = () => {
          b.textContent = tr(a.label) + ' · ' + tr(a.value ? 'On' : 'Off');
          b.setAttribute('aria-checked', String(a.value));
          details(b, a);
        };
        b.setAttribute('role', 'switch');
        b.disabled = a.disabled === true;
        b.onclick = () => {
          commit(a, !a.value);
          update();
        };
        update();
      } else if (a.kind === 'slider' || a.kind === 'select') {
        const row = document.createElement('label');
        row.className = 'menu-setting';
        const heading = document.createElement('span');
        heading.className = 'menu-setting-label';
        heading.textContent = translateMenu(a.label);
        row.append(heading);
        b = document.createElement(a.kind === 'slider' ? 'input' : 'select');
        b.className = 'menu-setting-input';
        b.setAttribute('aria-label', tr(a.label));
        b.disabled = a.disabled === true;
        if (a.kind === 'slider') {
          b.type = 'range';
          b.min = a.min;
          b.max = a.max;
          b.step = a.step;
          b.value = a.value;
          const output = document.createElement('output');
          const showValue = () => {
            const formatted = String(a.value) + a.suffix;
            output.textContent = formatted;
            b.setAttribute('aria-valuetext', formatted);
          };
          showValue();
          b.oninput = () => {
            commit(a, Number(b.value));
            showValue();
          };
          row.append(b, output);
        } else {
          for (const option of a.options) {
            const item = document.createElement('option');
            item.value = String(option.value);
            item.textContent = tr(option.label);
            b.append(item);
          }
          b.value = String(a.value);
          b.onchange = () => commit(a, b.value);
          row.append(b);
        }
        details(row, a);
        host.append(row);
      } else {
        b = document.createElement('button');
        b.textContent = translateMenu(a.label);
        if (a.classId === 'rogue') {
          const symbol = document.createElement('span');
          symbol.setAttribute('aria-hidden', 'true');
          symbol.style.cssText = 'display:inline-flex;vertical-align:middle;margin-right:0.4em';
          symbol.innerHTML = rogueJingleIconSvg;
          b.prepend(symbol);
        }
        b.disabled = a.disabled === true;
        b.classList.toggle('tutorial-highlight', !!a.tutorialHighlight);
        details(b, a);
        b.onclick = () => {
          audio.unlock().then(() => audio.interfaceSound('confirm'));
          a.action();
          if (started) save();
          updateHUD();
        };
      }
      if (a.kind !== 'slider' && a.kind !== 'select') host.append(fileRow || b);
      const buttonIndex = buttons.length;
      b.onfocus = () => {
        if (menuIndex === buttonIndex) return;
        menuIndex = buttonIndex;
        highlight();
      };
      if (a.kind !== 'slider' && a.kind !== 'select') {
        const invoke = b.onclick;
        b.onclick = (event) => {
          menuIndex = buttonIndex;
          invoke(event);
        };
      }
      buttons.push(b);
      menuKeys.push(a.key || (a.kind || 'action') + ':' + a.label);
    }
    const back = $('close-button');
    back.hidden = false;
    back.innerHTML = tr('Back') + ' <small>' + input.key('confirm') + ' / Esc</small>';
    buttons.push(back);
    menuKeys.push('__back__');
    highlight();
  }
  function highlight(moveFocus = false) {
    audio.interfaceSound('select');
    buttons.forEach((b, i) => b.classList.toggle('selected', i === menuIndex));
    const selected = buttons[menuIndex];
    if (moveFocus && selected)
      (selected.disabled ? $('modal') : selected).focus?.({ preventScroll: true });
    // Never jump an answer down to the first action as its text opens.
    // Explicit keyboard/joystick navigation still scrolls a chosen action into view.
    if (moveFocus) selected?.scrollIntoView({ block: 'nearest' });
  }
  function closeMenu() {
    if (started && (!writerGuard.canWrite() || persistence.conflicted(game.s.mode))) {
      savedRunConflictMenu();
      return;
    }
    audio.interfaceSound('close');
    bindingCapture = null;
    if (game.s.challenge.pending || game.s.challenge.gameOver) gateDismissed = true;
    menu = null;
    menuHistory.length = 0;
    menuKeys = [];
    $('modal').hidden = true;
    document.body.classList.remove('menu-open');
    clearInput(true);
    syncJoystickPresentation();
    if (menuReturnFocus?.focus) menuReturnFocus.focus({ preventScroll: true });
    menuReturnFocus = null;
  }
  function appendNameField(initialValue = '') {
    const label = document.createElement('label'),
      field = document.createElement('input');
    label.className = 'character-name-field';
    label.textContent = language === 'es' ? 'Nombre opcional · hasta 24 caracteres' : 'Optional name · up to 24 characters';
    field.id = 'character-name';
    field.type = 'text';
    field.maxLength = 24;
    field.autocomplete = 'off';
    field.value = initialValue;
    field.placeholder = language === 'es' ? 'Déjalo vacío para decidir después' : 'Leave blank to decide later';
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
    if (!menu || (started && (game.s.challenge.pending || game.s.challenge.gameOver))) return;
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
    if (started && !game.s.endingAck && game.peace && game.s.finalRestCompleted) {
      game.s.endingAck = true;
      save();
    }
    menu?.back();
  };
  function exportJSON(data, name) {
    exportSaveText(JSON.stringify(data, null, 2), name);
  }
  function exportSaveText(text, name) {
    const blob = new Blob([text], { type: 'application/json' }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  // Stage 5: destination preparation observes only an ALREADY CONSTRUCTED zone
  // in the saved campaign. Never call zone(), enter(), tick() or gameplay RNG
  // to predict an unvisited destination. Decoded art is optional, bounded work.
  function readOnlySceneKeys(destination, combatFirst = false) {
    const sprites = typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites;
    if (!sprites?.definitionFor || !game?.s?.zones) return [];
    const known = game.s.zones[destination] || null;
    const region = game.regionIndex(destination);
    // Prepare combat sprites and animations from the actual admitted scene,
    // not just the first few visible actors. A save already records the hero,
    // companions, living enemies and known encounter locations.
    const hero = game.hero;
    const companions = typeof game.activeParty === 'function'
      ? game.activeParty().map((actor) => ({ ...actor, renderKind: 'ally' }))
      : [];
    const distance = (e) => Math.hypot(e.x - hero.x, e.y - hero.y);
    const leaders = (e) => e.type === 'boss' || e.fieldCaptain ||
      e.roomCaptain || e.captain;
    const enemies = known && destination === game.zoneId
      ? (known.enemies || []).filter((e) => e.hp > 0 &&
          Number.isFinite(e.x) && Number.isFinite(e.y))
          .sort((a, b) => Number(leaders(b)) - Number(leaders(a)) ||
            distance(a) - distance(b))
          .map((e) => ({ ...e, renderKind: 'enemy' }))
      : [];
    // Only native entry or a restored save makes encounter placement real.
    // Whole dungeon interiors and all already-spawned outdoor enemy classes
    // are eligible; field bosses are never left for combat-time decoding.
    const imminent = combatFirst ? enemies.filter(
      (e) => leaders(e) || distance(e) <= 850) : [];
    const fringe = enemies;
    const neighbors = known && destination === game.zoneId
      ? [...(known.npcs || []).map((e) => ({ ...e, renderKind: 'npc' })),
        ...(known.props || []).map((e) => ({ ...e, renderKind: 'prop' })),
        ...(known.buildings || []).map((e) => ({ ...e, renderKind: 'building' })),
        ...(known.nodes || []).map((e) => ({ ...e, renderKind: 'node' }))]
          .filter((e) => Number.isFinite(e.x) && Number.isFinite(e.y))
          .sort((a, b) => distance(a) - distance(b))
      : [];
    const keys = new Set();
    for (const actor of [...imminent, { ...hero, renderKind: 'hero' },
      ...companions, ...fringe, ...neighbors]) {
      // Appearance lookup never calls Campaign.zone()/enter() or consumes RNG.
      const match = sprites.definitionFor(actor, region, !!game.s.rescued?.[actor.family]);
      if (match?.key) keys.add(match.key);
    }
    return [...keys];
  }
  function combatCriticalArrival(destination) {
    // Main dungeons, side interiors and supply rooms can place hostile actors
    // within engagement range of spawn. Their first *visible* encounter frame
    // takes priority over all optional asset warming, even on a revisited zone.
    // All three definitions are read-only catalog lookups, not zone creation.
    return Campaign.dungeonIds.includes(destination) ||
      !!game.sideDungeon?.(destination) ||
      !!game.supplyRoom?.(destination);
  }
  function warmScene(destination, combatFirst = false) {
    const sprites = typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites;
    if (!sprites?.warm || document.hidden) return null;
    const keys = readOnlySceneKeys(destination, combatFirst);
    if (!keys.length) return null;
    // Loading is readiness-driven: a slow decode is not a failed decode.
    // Missing or broken images settle independently in the sprite cache.
    // This never changes campaign state, game randomness or simulation time.
    return Promise.resolve().then(() => sprites.warm(keys,
      combatFirst ? { variants: true, clips: true } : {})).catch(() => null);
  }
  function prepareGpuForArrival() {
    if (graphicsController.status().mode !== 'webgl2' ||
        typeof pixiGame.warmArrival !== 'function') return null;
    // Await real GPU readiness rather than treating slow hardware as a failure.
    // Actual Pixi errors/context cancellation still return false for Canvas recovery.
    return Promise.resolve().then(() => pixiGame.warmArrival()).catch(() => false);
  }
  function drawReadyScene() {
    try {
      drawWorld();
      return true;
    } catch (_) {
      // A first-use WebGL exception must not strand the player behind loading.
      try {
        graphicsController.revert();
        renderer.setRenderLayer('full');
        renderer.draw();
        return true;
      } catch (_) {
        return false;
      }
    }
  }
  function transitionLoadingText(label, step) {
    const host = $('scene-loading-text');
    const es = language === 'es';
    host.textContent = step === 'paint'
      ? (es ? 'Preparando la vista de llegada…' : 'Drawing arrival scene…')
      : (es ? 'Preparando viaje · ' : 'Preparing travel · ') + label;
  }
  function cancelSceneTransition() {
    const previous = sceneTransition;
    if (!previous) return;
    ++sceneTransitionEpoch;
    previous.resolveSkip?.(false);
    sceneTransition = null;
    $('scene-loading').hidden = true;
    $('scene-loading-retry').hidden = true;
    // If the gameplay commit occurred, do not roll back or replay it.
    // A hidden page is safely saved by the existing visibility/pagehide owner.
    last = performance.now();
    audio.setPaused(!started || !focused || document.hidden || paused);
  }
  function revealSceneTransition(token) {
    const ticket = sceneTransition;
    if (!ticket || ticket.token !== token || !ticket.committed) return;
    if (document.hidden || !focused || !writerGuard.canWrite()) return;
    if (game !== ticket.campaign || game.zoneId !== ticket.destination) {
      cancelSceneTransition();
      return;
    }
    if (!ticket.painted && drawReadyScene()) {
      ticket.painted = true;
      const gpuWarmup = ticket.skipped ? null : prepareGpuForArrival();
      if (gpuWarmup) {
        ticket.gpuPreparing = true;
        void Promise.race([gpuWarmup, ticket.skipPromise.then(() => false)])
          .then((ready) => {
          if (sceneTransition?.token !== token) return;
          if (!ready) graphicsController.revert();
          ticket.gpuPreparing = false;
          requestAnimationFrame(() => revealSceneTransition(token));
        });
        return;
      }
    }
    if (ticket.gpuPreparing) return;
    if (!ticket.painted || !drawReadyScene()) {
      // Preserve committed progress. Leave a clear retryable interruption state
      // rather than showing a partially rendered world.
      transitionLoadingText('', 'paint');
      $('scene-loading-text').textContent = language === 'es'
        ? 'No se pudo dibujar la llegada. Intenta de nuevo con Canvas.'
        : 'Arrival could not be drawn. Retry with Canvas.';
      $('scene-loading-retry').textContent = language === 'es'
        ? 'Reintentar con Canvas' : 'Retry with Canvas';
      ticket.drawFailed = true;
      $('scene-loading-retry').hidden = false;
      $('scene-loading-retry').focus?.({ preventScroll: true });
      return;
    }
    rendererEvent('arrival-revealed', ticket.destination);
    cancelSceneTransition();
    clearInput();
    last = performance.now();
    frameSkip.suspend();
    runtime.reset();
    fps.suspend();
    updateHUD();
    $('menu-button').focus?.({ preventScroll: true });
  }
  function sceneTransitionTo(destination, label, commit) {
    if (!started || sceneTransition || document.hidden || !focused ||
        !writerGuard.canWrite() || persistence.conflicted(game.s.mode))
      return false;
    const token = ++sceneTransitionEpoch;
    const campaign = game;
    rendererEvent('arrival-start', destination);
    let resolveSkip;
    const skipPromise = new Promise((resolve) => { resolveSkip = resolve; });
    sceneTransition = { token, campaign, destination, committed: false,
      skipped: false, skipPromise, resolveSkip };
    $('scene-loading').hidden = false;
    $('scene-loading-retry').hidden = false;
    $('scene-loading-retry').textContent = language === 'es'
      ? 'Continuar con Canvas' : 'Continue with Canvas';
    transitionLoadingText(label || destination, 'warm');
    clearInput();
    audio.setPaused(true);
    const proceed = () => {
      if (sceneTransition?.token !== token || document.hidden || !focused ||
          !writerGuard.canWrite() || game !== campaign) {
        if (sceneTransition?.token === token) cancelSceneTransition();
        return;
      }
      let accepted = false;
      try {
        accepted = !!commit();
      } catch (_) {
        accepted = false;
      }
      if (!accepted || game.zoneId !== destination) {
        cancelSceneTransition();
        return;
      }
      sceneTransition.committed = true;
      rendererEvent('arrival-committed', destination);
      // Only the existing domain action may spend fare, reset encounters,
      // create the entered zone or update quest/discovery state.
      if (menu) closeMenu();
      transitionLoadingText(label || destination, 'paint');
      if (!save()) status('Saving failed. Export your run before closing.');
      // Native enter() has now built the real dungeon and placed the hero and
      // nearby enemies. Warm the close-range encounter artwork *after* that
      // authoritative step while the clock is stopped and the screen covered.
      // Never spend an unbounded period trying to complete optional atlas art.
      const encounterWarmup = sceneTransition.skipped
        ? null : warmScene(destination, true);
      const reveal = () => {
        if (sceneTransition?.token !== token) return;
        requestAnimationFrame(() => revealSceneTransition(token));
      };
      if (encounterWarmup)
        void Promise.race([encounterWarmup, skipPromise]).then(reveal, reveal);
      else reveal();
    };
    // Dungeon entries are combat-critical: do not wait on an optional atlas,
    // decoration, or procedural upload before performing native admission.
    // Simulation remains held until the committed first frame is drawn and
    // the opaque interlude is removed. No artificial combat grace period.
    const critical = combatCriticalArrival(destination);
    const pending = critical ? null : warmScene(destination);
    if (pending) void Promise.race([pending, skipPromise]).then(proceed, proceed);
    else proceed();
    return true;
  }

  // Presentation-only title surface: never tick or autosave a loaded campaign.
  function refreshTitleScreen() {
    if (!titleScreen) return;
    const es = language === 'es';
    const t = (en, spanish) => es ? spanish : en;
    $('title-heading').textContent = "So I Became the Dark Lord's Problem";
    titleScreen.querySelector?.('nav')?.setAttribute?.(
      'aria-label', es ? 'Menú principal' : 'Main menu',
    );
    $('title-tagline').textContent = t(
      "He conquered the world. He wasn't expecting you.",
      "Conquistó el mundo. No contaba contigo.",
    );
    const valid = loaded && !!game?.s && !persistence.loadFailed(game.s.mode);
    const place = valid
      ? D.regions.find((region) => region.id === game.zoneId)?.name ||
        D.bosses.find((boss) => boss.id === game.zoneId)?.place || game.zoneId
      : '';
    $('title-preview').textContent = valid
      ? t('Saved adventure', 'Aventura guardada') + ' · ' +
        (game.hero.name || game.hero.class) + ' · ' +
        t('Level ', 'Nivel ') + game.hero.level + ' · ' + place
      : persistence.loadFailed(profile.activeMode)
        ? t('Saved adventure needs recovery', 'La partida requiere recuperación')
        : t('Your adventure awaits', 'Tu aventura te espera');
    const importFeedback = $('title-import-feedback');
    importFeedback.hidden = !titleImportNotice || titleLoading;
    importFeedback.textContent = titleImportNotice
      ? t('Import successful. Select Continue Adventure to play.',
          'Importación completada. Selecciona Continuar aventura para jugar.')
      : '';
    $('title-continue').textContent = t('Continue Adventure', 'Continuar aventura');
    $('title-new').textContent = t('New Game', 'Nueva partida');
    $('title-saves').textContent = t('Saved Games & Backups', 'Partidas y copias de seguridad');
    $('title-settings').textContent = t('Settings', 'Ajustes');
    $('title-help').textContent = t('Help & Credits', 'Ayuda y créditos');
    refreshStartupUpdateNotice();
    $('title-continue').disabled = startupUpdatePending || titleLoading || !valid ||
      !writerGuard.canWrite() || persistence.conflicted(game.s.mode) ||
      !!game.s.challenge?.gameOver;
    for (const id of ['title-new', 'title-saves', 'title-settings', 'title-help'])
      $(id).disabled = startupUpdatePending || titleLoading;
    titleCanvasContinue.hidden = !titleLoading || !!titleSkipGraphics?.skipped;
    titleCanvasContinue.textContent = language === 'es'
      ? 'Continuar con Canvas' : 'Continue with Canvas';
    if (!titleLoading) {
      $('title-loading').hidden = true;
      $('title-loading').textContent = '';
    }
  }
  function showTitleScreen() {
    stopRendererRecording();
    ++titleEpoch;
    titleSkipGraphics?.resolve(false);
    titleSkipGraphics = null;
    titleLoading = false;
    cancelSceneTransition();
    started = false;
    paused = false;
    clearInput();
    audio.setPaused(true);
    last = performance.now();
    if (menu) {
      menu = null;
      menuHistory.length = 0;
      $('modal').hidden = true;
      document.body.classList.remove('menu-open');
    }
    titleScreen.hidden = startupUpdatePending;
    $('startup-update').hidden = !startupUpdatePending;
    document.body.classList.add('title-active');
    // No sprite, material or GPU warmup until Continue/New Game is chosen.
    titleWarmup = null;
    refreshTitleScreen();
    if (!startupUpdatePending) {
      const primary = $('title-continue').disabled ? $('title-new') : $('title-continue');
      primary.focus?.({ preventScroll: true });
    }
  }
  function enterPreparedScene() {
    if (startupUpdatePending || titleLoading || started || !loaded || !writerGuard.canWrite()) return;
    if (persistence.conflicted(game.s.mode)) return savedRunConflictMenu();
    titleLoading = true;
    titleImportNotice = false;
    const epoch = ++titleEpoch;
    // First-scene resources belong to this explicit entry, not idle title.
    if (typeof PrototypeMaterials !== 'undefined') void PrototypeMaterials.load();
    titleWarmup = warmScene(game.zoneId, true);
    let resolveSkip;
    const skipPromise = new Promise((resolve) => { resolveSkip = resolve; });
    titleSkipGraphics = { skipped: false, resolve: resolveSkip };
    const waitOrSkip = (pending, onSettled) => pending
      ? void Promise.race([pending, skipPromise]).then(onSettled, onSettled)
      : onSettled();
    $('title-loading').hidden = false;
    $('title-loading').textContent = language === 'es'
      ? 'Preparando la primera escena…' : 'Preparing first scene…';
    refreshTitleScreen();
    clearInput();
    let campaign = game;
    const reveal = () => {
      if (epoch !== titleEpoch || document.hidden || !writerGuard.canWrite() ||
          campaign !== game) {
        titleLoading = false;
        refreshTitleScreen();
        return;
      }
      // Only Continue authorizes abnormal-session recovery.
      recoverLoadedSession();
      // Crash recovery may replace the Campaign object with a safe-location
      // clone. Continue's readiness guards must track that validated recovery,
      // not silently abandon the title in its disabled loading state.
      campaign = game;
      if (menu) closeMenu();
      $('title-loading').textContent = language === 'es'
        ? 'Preparando la primera escena…' : 'Drawing first scene…';
      const finish = () => {
        if (epoch !== titleEpoch || document.hidden || !writerGuard.canWrite()) {
          titleLoading = false;
          refreshTitleScreen();
          return;
        }
        titleLoading = false;
        titleSkipGraphics = null;
        titleCanvasContinue.hidden = true;
        started = true;
        titleScreen.hidden = true;
        document.body.classList.remove('title-active');
        paused = false;
        last = performance.now();
        saveTimer = 0;
        frameSkip.suspend();
        runtime.reset();
        fps.suspend();
        restartGuard.arm(game);
        updateHUD();
        audio.setPaused(false);
        $('menu-button').focus?.({ preventScroll: true });
      };
      const paint = () => {
        if (epoch !== titleEpoch || document.hidden || !writerGuard.canWrite()) {
          titleLoading = false;
          refreshTitleScreen();
          return;
        }
        const showReadyFrame = () => {
          if (epoch !== titleEpoch || document.hidden ||
              campaign !== game || !writerGuard.canWrite()) return;
          if (!drawReadyScene()) {
            titleLoading = false;
            status('Unable to prepare the game scene. Canvas backup is available.');
            refreshTitleScreen();
            return;
          }
          const gpuWarmup = titleSkipGraphics?.skipped ? null : prepareGpuForArrival();
          if (gpuWarmup) void Promise.race([gpuWarmup, skipPromise.then(() => false)])
            .then((ready) => {
              if (epoch !== titleEpoch) return;
              if (!ready) graphicsController.revert();
              requestAnimationFrame(finish);
            });
          else requestAnimationFrame(finish);
        };
        // The save supplies the actual zone/hero/party. Only after recovery
        // and that scene's sprite warmup do we initialize confirmed Pixi,
        // all behind the SAME title loading surface. New Game shares this path.
        const gpuState = graphicsController.status();
        const shouldRestorePixi = !titleSkipGraphics?.skipped &&
          (previousRendererChoice.renderer === 'webgl2' || gpuState.recoveryPending) &&
          !gpuState.recoveryPaused &&
          gpuState.phase === 'canvas' &&
          gpuState.preferredRenderer === 'webgl2';
        if (!shouldRestorePixi) return showReadyFrame();
        $('title-loading').textContent = language === 'es'
          ? 'Preparando gráficos PixiJS…' : 'Preparing PixiJS graphics…';
        const restoration = graphicsController.resumeConfirmedWebGL();
        void Promise.race([restoration, skipPromise]).then(
          showReadyFrame, showReadyFrame);
      };
      // Recovering an unclean save can change the spawn after title warmup.
      const actual = titleSkipGraphics?.skipped ? null : warmScene(game.zoneId, true);
      waitOrSkip(actual, paint);
    };
    waitOrSkip(titleWarmup, reveal);
  }
  function returnToTitleScreen() {
    if (!started || !writerGuard.canWrite() || !save()) {
      status('Saving failed. Export your run before closing.');
      return;
    }
    if (!crashRecoveryPending && !frameSkip.emergency) restartGuard.clean();
    showTitleScreen();
  }
  function selectSavedMode(mode) {
    if (!writerGuard.canWrite()) return savedRunConflictMenu();
    const candidate = persistence.load(mode);
    if (!candidate) {
      profile.activeMode = mode;
      return savedRunRecoveryMenu();
    }
    game = activateLiveCritical(candidate);
    loaded = true;
    titleImportNotice = false;
    if (!['developer', 'arena'].includes(mode)) profile.activeMode = mode;
    persistProfile();
    showTitleScreen();
  }
  function titleSaveMenu() {
    const modes = ['normal', 'nightmare',
      ...(developerEnabled ? ['developer'] : []),
      ...(combatDiagnosticsEnabled ? ['arena'] : [])];
    openMenu(
      'Saved Games & Backups',
      language === 'es'
        ? 'Elige una partida, recupera una copia o exporta tus datos antes de reemplazarlos.'
        : 'Choose a campaign, recover a checkpoint, or export a backup.',
      [
        ...modes.map((mode) => {
          const candidate = persistence.load(mode);
          return action(
            mode === 'normal' ? 'Normal' : mode === 'nightmare' ? 'Nightmare' :
              mode === 'developer' ? 'Developer' : 'Combat Diagnostics',
            () => selectSavedMode(mode),
            candidate ? (candidate.hero.name || candidate.hero.class) +
              ' · ' + candidate.hero.level : (language === 'es' ? 'Sin partida válida' : 'No valid save'),
            !candidate,
          );
        }),
        action('Try recovery', () => {
          if (loaded) profile.activeMode = game.s.mode;
          savedRunRecoveryMenu();
        }),
        ...modes.filter((mode) => persistence.loadFailed(mode)).map((mode) =>
          action(
            (language === 'es' ? 'Recuperar ' : 'Recover ') + mode,
            () => {
              profile.activeMode = mode;
              savedRunRecoveryMenu();
            },
          ),
        ),
        ...modes.filter((mode) => persistence.exists(mode)).map((mode) => ({
          label: (language === 'es' ? 'Exportar ' : 'Export ') + mode,
          action: () => {
            const raw = localStorage.getItem(PrototypePersistence.saveKey(mode));
            if (raw) exportSaveText(raw, 'Azeroth_Original_' + mode + '.json');
          },
        })),
        { kind: 'file', label: 'Import save' },
      ],
      showTitleScreen,
      { view: 'title-saves' },
    );
  }
  function titleHelpMenu() {
    openMenu('Help & Credits',
      language === 'es'
        ? "So I Became the Dark Lord's Problem. Una aventura de fantasía original. Consulta Controles para aprender a jugar."
        : "So I Became the Dark Lord's Problem. An original fantasy adventure. Open Controls to review movement, skills and input options.",
      [action('Controls', () => help(titleHelpMenu))],
      showTitleScreen);
  }
  function start(mode, heroClass, succession, heroName = null) {
    if (mode === 'arena' && !combatDiagnosticsEnabled) return;
    if (mode === 'developer' && !developerEnabled) return;
    if (mode === 'nightmare' && !profile.nightmareUnlocked) return;
    const candidate = activateLiveCritical(
      new Campaign(mode, heroClass, Math.random, { succession }),
    );
    if (heroName) candidate.nameHero(heroName);
    try {
      persistence.writeCandidate(candidate);
    } catch (_) {
      status('Saving failed. Export your run before closing.');
      return;
    }
    restartGuard.clean();
    game = activateLiveCritical(candidate);
    if (game.s.mode === 'arena') {
      graphicsController.revert();
      setOptimizationActive(true);
      resize();
    } else setOptimizationActive(optimizationPreference === 'on');
    loaded = true;
    if (typeof Sprint !== 'undefined') Sprint.reset();
    paused = false;
    if (!['developer', 'arena'].includes(mode)) profile.activeMode = mode;
    persistProfile();
    showTitleScreen();
    enterPreparedScene();
  }
  function chooseLanguage(mode) {
    if (mode === 'arena' && !combatDiagnosticsEnabled) return;
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
      () => (started ? openMain() : newGameMenu()),
    );
  }
  function savedRunRecoveryMenu() {
    openMenu(
      'Saved run could not be opened',
      persistence.original(profile.activeMode)
        ? 'Your original save is protected. Import a backup or export the original before starting a new run.'
        : 'The main save is missing. Try a recovery checkpoint or import a backup.',
      [
        action('Try recovery', savedRunRecoveryOptions),
        action(
          'Export original save',
          () =>
            exportSaveText(
              persistence.original(profile.activeMode),
              'Azeroth_Original_' + profile.activeMode + '.json',
            ),
          '',
          !persistence.original(profile.activeMode),
        ),
        { kind: 'file', label: 'Import save' },
        action('Start a new Normal run', () => chooseLanguage('normal')),
      ],
      started ? savedRunRecoveryMenu : showTitleScreen,
      { view: 'save-recovery' },
    );
  }
  function recoverySummary(option) {
    const place =
      D.regions.find((region) => region.id === option.zone)?.name ||
      D.bosses.find((boss) => boss.id === option.zone)?.place ||
      option.zone;
    const heroClass = heroClassLabel(option.heroClass);
    return tr('Level') + ' ' + option.level + ' · ' + heroClass + ' · ' + place;
  }
  function savedRunRecoveryOptions() {
    let options;
    try {
      options = persistence.recoveryOptions(profile.activeMode);
    } catch (_) {
      status('Recovery failed. Your original save was kept. Export it before closing.');
      return;
    }
    openMenu(
      'Recovery options',
      options.length
        ? 'Choose a recoverable run to review. Nothing is replaced until you confirm.'
        : 'No usable local checkpoint was found. Import a backup, or export the original for investigation.',
      options.map((option, index) =>
        action(
          tr(
            {
              checkpoint: 'Checkpoint',
              compatible: 'Compatible saved run',
              original: 'Preserved original',
              legacy: 'Legacy saved run',
            }[option.source],
          ) +
            ' ' +
            (index + 1),
          () => reviewSavedRunRecovery(option),
          recoverySummary(option),
        ),
      ),
      savedRunRecoveryMenu,
      { view: 'save-recovery-options' },
    );
  }
  function reviewSavedRunRecovery(option) {
    const date =
      option.savedAt === null
        ? tr('Date unavailable')
        : tr('Saved') +
          ' ' +
          new Date(option.savedAt).toLocaleString(language === 'es' ? 'es-US' : 'en-US');
    openMenu(
      'Review recovery',
      recoverySummary(option) +
        '\n' +
        date +
        '\n\n' +
        tr(
          'Restoring this run may lose progress made after this checkpoint. Your unreadable original will remain preserved.',
        ),
      [
        action('Recover this run', () => {
          try {
            const candidate = persistence.recover(profile.activeMode, option.id);
            resumeSavedRun(candidate);
            status('Run recovered successfully.');
          } catch (_) {
            status('Recovery failed. Your original save was kept. Export it before closing.');
          }
        }),
      ],
      savedRunRecoveryOptions,
      { view: 'save-recovery-review' },
    );
  }
  function savedRunConflictMenu() {
    openMenu(
      'Saved game is protected',
      writerGuard.status() === 'unsupported'
        ? 'Open the game in an updated browser to continue safely. You can still export this run.'
        : 'Another window may have newer progress. Close the other game window, then reload here to continue. Export this run first to keep its unsaved progress.',
      [
        {
          label: 'Export save',
          action: () => exportJSON(game.snapshot(), 'Azeroth_Unsaved_Run.json'),
        },
        { label: 'Reload this window', action: () => location.reload() },
      ],
      savedRunConflictMenu,
      { view: 'save-conflict' },
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
  // Concise copy for choosing a class and for inspecting its live growth.
  // The values stay tied to the established combat rules.
  function classGrowthLine(heroClass) {
    const p = Campaign.rules.balance.classPassives;
    const es = language === 'es';
    if (heroClass === 'rogue') return es
      ? 'Travesura · Cada nivel: +2 puntos porcentuales de probabilidad crítica de la Pícara.'
      : 'Mischief · Each level: +2 percentage points Rogue critical chance.';
    if (heroClass === 'paladin')
      return es
        ? 'Fortaleza · Cada nivel: +' + p.paladin.hpPerLevel +
            ' PV máximos y +' + p.paladin.armorEffectivenessPerLevel.toFixed(2).replace('.', ',') +
            ' de daño bloqueado por punto de armadura.'
        : 'Fortitude · Each level: +' + p.paladin.hpPerLevel +
            ' max HP and +' + p.paladin.armorEffectivenessPerLevel.toFixed(2) +
            ' damage blocked per Armor point.';
    if (heroClass === 'ranger')
      return es
        ? 'Agilidad · Cada nivel: +' + p.ranger.speedPerLevel +
            ' de velocidad y +' + Math.round(p.ranger.cooldownReductionPerLevel * 100) +
            '% de reducción de recuperación.'
        : 'Agility · Each level: +' + p.ranger.speedPerLevel +
            ' speed and +' + Math.round(p.ranger.cooldownReductionPerLevel * 100) +
            '% cooldown reduction.';
    if (heroClass === 'mage') return es
      ? 'Poder arcano · Cada nivel: +' + p.mage.powerPerLevel + ' de poder.'
      : 'Arcane Power · Each level: +' + p.mage.powerPerLevel + ' Power.';
    // Unknown classes never inherit an invented Mage growth description.
    return '';
  }
  // Owner-approved Option A: pale-gold spherical jingle bell, taken from
  // the simple line-art reference. Horizontal equator seam and ONE bottom
  // keyhole slit replace the previously unreadable crossed cutouts.
  // Shared unchanged across New Game, Succession and the HUD.
  const rogueJingleIconSvg =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" style="vertical-align:-0.2em;flex:none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M9.75 5.1V4.2a2.25 2.25 0 0 1 4.5 0v.9" fill="none" stroke="#18140f" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle cx="12" cy="13.1" r="8.8" fill="#f1d77e" stroke="#18140f" stroke-width="1.9"/>' +
    '<path d="M6.1 8.9Q7.5 6.8 10.9 6.6" stroke="#18140f" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
    '<path d="M3 12.6H21" stroke="#18140f" stroke-width="1.9" stroke-linecap="round"/>' +
    '<path d="M12 17.9V21.65" stroke="#18140f" stroke-width="1.9" stroke-linecap="round"/>' +
    '<circle cx="12" cy="17.2" r="1.65" fill="#18140f"/>' +
    '</svg>';
  // Read-only class selection copy. Registry membership alone governs
  // which buttons exist; a future class gets its own description, never Ranger's.
  const heroClassPresentation = Object.freeze({
    paladin: {
      en: 'Paladin', es: 'Paladín',
      detail: 'Melee, healing and brief immunity', detailEs: 'Combate cercano, curación e inmunidad breve',
    },
    mage: {
      en: 'Mage', es: 'Mago',
      detail: 'Ranged magic, frost control and protective barriers', detailEs: 'Magia a distancia, hielo y barreras protectoras',
    },
    ranger: {
      en: 'Ranger', es: 'Explorador',
      detail: 'Ranged bow, healing and mobility', detailEs: 'Arco a distancia, curación y movilidad',
    },
    rogue: {
      en: 'Rogue', es: 'Pícara',
      detail: 'Charmed companions, musical disruption and survival tricks. Start alone; automatic basic hits may Charm surviving eligible monsters, who can then build Barracks.', detailEs: 'Compañeros encantados, música disruptiva y trucos de supervivencia. Empiezas sola; los ataques básicos automáticos pueden encantar a monstruos aptos que sobreviven, y luego ellos pueden construir cuarteles.',
    },
  });
  function heroClassLabel(id, localized = language === 'es') {
    return (heroClassPresentation[id] || {})[localized ? 'es' : 'en'] || id;
  }
  function heroClassDetail(id) {
    return heroClassPresentation[id]?.[language === 'es' ? 'detailEs' : 'detail'] || 'Class skills require authored rules';
  }
  function playableClassCountWord() {
    const count = Object.keys(Campaign.classes).length;
    return { 3: 'three', 4: 'four', 5: 'five' }[count] || String(count);
  }
  function chooseClass(mode, succession) {
    if (mode === 'arena' && !combatDiagnosticsEnabled) return;
    if (mode === 'developer' && !developerEnabled) return;
    if (mode === 'developer' || mode === 'arena') succession = false;
    if (succession === undefined) {
      openMenu(
        'Challenge condition',
        'The Dark Lord rules the land. To keep heroes from becoming strong enough to challenge him, his forces have captured the specialists who teach skills, forge equipment and prepare adventurers. Free them, rebuild your strength and confront his rule.\n\nSuccession is optional. Each fallen class is lost for this run; after ' +
          playableClassCountWord() +
          ' class deaths the run ends.',
        [
          action('Standard death and refuge recovery', () => chooseClass(mode, false)),
          action('Succession challenge', () => chooseClass(mode, true)),
        ],
      );
      return;
    }
    openMenu(
      'New ' +
        (mode === 'nightmare' ? 'Nightmare' : mode === 'developer' ? 'Developer' : mode === 'arena' ? 'Combat Diagnostics' : 'Normal') +
        ' adventure',
      mode === 'arena'
        ? 'Low-spec combat testing without the campaign. Begin with Basic Attack, learn other skills from hub instructors for free, and choose enemies with the Arena Guide.'
        : language === 'es'
          ? 'Elige quién liderará la resistencia. Cada clase recibe su ventaja innata desde el nivel 1. Rescata especialistas para aprender más habilidades y conseguir equipo.'
          : 'Choose who leads the resistance. Each class grows automatically from level 1. Rescue specialists to unlock more skills and equipment.',
      Object.entries(Campaign.classes).map(([id, c]) =>
        action(
          (id === 'rogue' ? '' : c.icon + ' ') + heroClassLabel(id),
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
          heroClassDetail(id) + (classGrowthLine(id) ? '\n' + classGrowthLine(id) : ''),
          false, false, id,
        ),
      ),
      () => started ? chooseClass(mode) : newGameMenu(),
      { view: 'class-select' },
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
    const h = game.hero,
      es = language === 'es',
      className = es
        ? { paladin: 'Paladín', mage: 'Mago', ranger: 'Explorador', rogue: 'Pícara' }[h.class]
        : { paladin: 'Paladin', mage: 'Mage', ranger: 'Ranger', rogue: 'Rogue' }[h.class],
      stats = [
        { label: es ? 'PV máximos' : 'Max HP', value: String(h.maxHp) },
        { label: es ? 'Poder' : 'Power', value: String(game.power()) },
        { label: es ? 'Armadura' : 'Armor', value: String(game.armor()) },
        { label: es ? 'Velocidad' : 'Speed', value: String(game.heroMoveSpeed()) },
        {
          label: es ? 'Reducción de recuperación' : 'Cooldown reduction',
          value: Math.round(game.heroCooldownReduction() * 100) + '%',
        },
        {
          label: es ? 'Probabilidad crítica' : 'Critical chance',
          value: (game.criticalPartyChance('hero') * 100).toFixed(0) + '%',
        },
      ];
    if (h.class === 'paladin')
      stats.push({
        label: es ? 'Bloqueo por punto de armadura' : 'Blocked per Armor point',
        value: game.armorEffectivenessFor(h).toFixed(2).replace('.', es ? ',' : '.') +
          (es ? ' daño' : ' damage'),
      });
    openMenu(
      'Character',
      {
        summary:
          (h.customName || h.regnalName ? game.heroDisplayName() + ' · ' : '') +
          className +
          (es ? ' · Nivel ' : ' · Level ') +
          h.level +
          '\nXP ' + Math.floor(h.xp) + ' / ' + game.xpRequired(h.level),
        sections: [
          {
            title: es ? 'Crecimiento de clase' : 'Class growth',
            text: classGrowthLine(h.class),
          },
          { title: es ? 'Atributos actuales' : 'Current stats', rows: stats },
        ],
      },
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
        action(
          'Inventory and support',
          () => inventory(characterMenu, true),
          'Equipment, Ranger support and Preparation Tonics.',
        ),
        action('Skill journal', () => skillBook(characterMenu)),
        action('Talents', () => talents(characterMenu)),
      ],
      openMain,
      { view: 'character' },
    );
  }
  // Opt-in, device-local, bounded samples. Never writes into campaign saves.
  let rendererRecording = null;
  let lastRendererRecording = null;
  const rendererDiagnosticCounters = [
    'proceduralBakes', 'proceduralCacheHits', 'sharedProceduralHits',
    'proceduralEvictions', 'proceduralCacheEvictions', 'backgroundRepaints',
    'terrainTilesPrepared', 'terrainTileReuses',
    'backgroundLookaheadPaints', 'backgroundLookaheadPromotions',
    'backgroundLookaheadMisses', 'backgroundLookaheadFailures',
    'backgroundLookaheadPaintMs', 'backgroundLookaheadPromoteMs',
    'neighborhoodPrepared', 'neighborhoodWarmupMs', 'syncProceduralBakeMs',
    'syncBackgroundPaintMs', 'approvedGpuPrepared', 'proceduralGpuPrepared',
    'gpuPreparationMs', 'gpuPreparationBatches',
  ];
  // Constant-memory distributions cover the entire opt-in capture, unlike the
  // short rolling frame profiler. Quantiles are bucket ceilings, not exact FPS.
  const rendererHistogramBoundsMs = [4, 8, 12, 16, 20, 24, 33, 50, 75, 100, 150, 250, 500, 1000];
  function rendererHistogramAdd(histogram, value) {
    let bucket = 0;
    while (bucket < rendererHistogramBoundsMs.length && value > rendererHistogramBoundsMs[bucket])
      bucket++;
    histogram[bucket]++;
  }
  function rendererHistogramQuantile(histogram, q) {
    const total = histogram.reduce((sum, count) => sum + count, 0);
    if (!total) return null;
    const target = Math.ceil(total * q);
    let observed = 0;
    for (let i = 0; i < histogram.length; i++) {
      observed += histogram[i];
      if (observed >= target) return rendererHistogramBoundsMs[i] ?? null;
    }
    return null;
  }
  function rendererDiagnosticSnapshot() {
    const pixi = pixiGame.status();
    const counters = Object.fromEntries(rendererDiagnosticCounters.map((key) =>
      [key, Number.isFinite(pixi[key]) ? pixi[key] : 0]));
    for (const [key, value] of Object.entries(pixi.backgroundLookaheadSkips || {}))
      counters['lookaheadSkip_' + key] = value;
    return { counters, renderer: graphicsController.status().mode,
      zone: game.zoneId, proceduralBytes: pixi.proceduralBytes || 0 };
  }
  function beginRendererRecording() {
    rendererRecording = {
      version: 1, startedAt: new Date().toISOString(),
      startedClockMs: performance.now(), baseline: rendererDiagnosticSnapshot(),
      frames: 0, draws: 0, slowFrames: 0, worstFrames: [], events: [],
      frameWorkHistogram: Array(rendererHistogramBoundsMs.length + 1).fill(0),
      callbackIntervalHistogram: Array(rendererHistogramBoundsMs.length + 1).fill(0),
    };
    lastRendererRecording = null;
  }
  function rendererEvent(type, destination) {
    if (rendererRecording && rendererRecording.events.length < 16)
      rendererRecording.events.push({ type, destination, elapsedMs: Math.round(
        performance.now() - rendererRecording.startedClockMs) });
  }
  function noteRendererRecordingFrame(stages, workMs, intervalMs, drawn, recovering, skipped) {
    const capture = rendererRecording;
    if (!capture) return;
    capture.frames++;
    if (drawn) capture.draws++;
    rendererHistogramAdd(capture.frameWorkHistogram, workMs);
    rendererHistogramAdd(capture.callbackIntervalHistogram, intervalMs);
    if (workMs < 34 && intervalMs < 50) return;
    capture.slowFrames++;
    const point = { elapsedMs: Math.round(performance.now() - capture.startedClockMs),
      workMs: Math.round(workMs * 10) / 10,
      intervalMs: Math.round(intervalMs * 10) / 10,
      renderMs: Math.round(stages.renderMs * 10) / 10,
      simulationMs: Math.round(stages.simulationMs * 10) / 10,
      pixiMs: Math.round(stages.pixiMs * 10) / 10,
      canvasOverlayMs: Math.round(stages.canvasOverlayMs * 10) / 10,
      canvasWorldMs: Math.round(stages.canvasWorldMs * 10) / 10,
      drawn: !!drawn, recovering: !!recovering, adaptiveSkipped: !!skipped,
      zone: game.zoneId, renderer: graphicsController.status().mode };
    // Keep only the 32 highest-severity incidents, not an unbounded frame log.
    const severity = (p) => Math.max(p.workMs, p.intervalMs);
    if (capture.worstFrames.length < 32) capture.worstFrames.push(point);
    else {
      let smallest = 0;
      for (let i = 1; i < capture.worstFrames.length; i++)
        if (severity(capture.worstFrames[i]) < severity(capture.worstFrames[smallest]))
          smallest = i;
      if (severity(point) > severity(capture.worstFrames[smallest]))
        capture.worstFrames[smallest] = point;
    }
  }
  function rendererRecordingReport(capture = rendererRecording || lastRendererRecording) {
    if (!capture) return { state: 'not-recorded', note: 'Optional recording is off.' };
    const finish = capture.finished || rendererDiagnosticSnapshot();
    const keys = new Set([...Object.keys(capture.baseline.counters),
      ...Object.keys(finish.counters)]);
    const counterResetKeys = [...keys].filter((key) =>
      (finish.counters[key] || 0) < (capture.baseline.counters[key] || 0));
    const counterResetSet = new Set(counterResetKeys);
    const percentile = (histogram) => ({
      p50UpperMs: rendererHistogramQuantile(histogram, 0.5),
      p95UpperMs: rendererHistogramQuantile(histogram, 0.95),
      p99UpperMs: rendererHistogramQuantile(histogram, 0.99),
    });
    return {
      state: capture === rendererRecording ? 'recording' : 'stopped',
      startedAt: capture.startedAt,
      durationMs: Math.max(0, Math.round((capture.finishedClockMs ||
        performance.now()) - capture.startedClockMs)),
      initialRenderer: capture.baseline.renderer, finalRenderer: finish.renderer,
      initialZone: capture.baseline.zone, finalZone: finish.zone,
      frames: capture.frames, draws: capture.draws, slowFrames: capture.slowFrames,
      slowThresholds: { workMs: 34, intervalMs: 50 },
      histograms: {
        boundsMs: rendererHistogramBoundsMs,
        frameWork: capture.frameWorkHistogram,
        callbackInterval: capture.callbackIntervalHistogram,
        overflow: 'Values above 1000 ms are unbounded; percentile ceiling is null.',
      },
      approximatePercentiles: {
        frameWork: percentile(capture.frameWorkHistogram),
        callbackInterval: percentile(capture.callbackIntervalHistogram),
      },
      worstFrames: [...capture.worstFrames].sort((a, b) => a.elapsedMs - b.elapsedMs),
      events: capture.events,
      counterDeltas: Object.fromEntries([...keys].map((key) =>
        [key, counterResetSet.has(key) ? null :
          (finish.counters[key] || 0) - (capture.baseline.counters[key] || 0)])),
      counterResetKeys,
      initialProceduralBytes: capture.baseline.proceduralBytes,
      finalProceduralBytes: finish.proceduralBytes,
      note: 'Bounded synchronous CPU samples, not GPU completion or displayed frames.',
    };
  }
  function stopRendererRecording() {
    if (!rendererRecording) return;
    rendererRecording.finished = rendererDiagnosticSnapshot();
    rendererRecording.finishedClockMs = performance.now();
    lastRendererRecording = rendererRecording;
    rendererRecording = null;
  }
  function exportPlaytestReport() {
    exportJSON(
            {
              version: PrototypeBuild.version,
              performance: {
                ...runtime.report(
                  {
                    ...renderer.metrics(),
                    // In WebGL mode these counters belong to the transparent
                    // Canvas cues, NOT the Pixi world.
                    measuredLayer:
                      graphicsController.status().mode === 'webgl2'
                        ? 'canvas-combat-overlay'
                        : 'canvas-full-world',
                  },
                  platform.mode,
                ),
                // Report the active surface, not just the saved preference.
                graphicsRenderer: {
                  activeRenderer:
                    graphicsController.status().mode === 'webgl2' && pixiGame.status().active
                      ? 'pixijs-webgl2'
                      : 'canvas2d',
                  ...graphicsController.status(),
                  ...pixiGame.status(),
                },
                frameProfile: frameProfile.report(),
                rendererDiagnostics: rendererRecordingReport(),
                environment: {
                  userAgent: String(navigator.userAgent || '').slice(0, 300),
                  hardwareConcurrency: Number.isFinite(navigator.hardwareConcurrency)
                    ? navigator.hardwareConcurrency : null,
                  deviceMemoryGiB: Number.isFinite(navigator.deviceMemory)
                    ? navigator.deviceMemory : null,
                  viewportWidth: viewport.width,
                  viewportHeight: viewport.height,
                },
                crowdDiagnostics: game.crowdDiagnosticsReport(),
                ...(developerEnabled && game.s.mode === 'developer'
                  ? { effectDiagnostics: renderer.effectDiagnosticsReport() }
                  : {}),
                frameRatePreference: fps.preference,
                frameRateTarget: fps.target,
                frameSkip: frameSkip.status(),
                renderResolution: renderResolution.status(),
                optimizationMode: optimizationMode ? 'on' : 'off',
                optimizationPreference,
                emergencyGraphicsOverride: optimizationMode &&
                  optimizationPreference === 'off',
                devicePixelRatio: window.devicePixelRatio || 1,
                backingPixelRatio: canvas.width / Math.max(1, viewport.width),
                backingWidth: canvas.width,
                backingHeight: canvas.height,
                canvasBacking: { ...canvasBackingDiagnostics },
              },
              audio: audio.status(),
              sprites: typeof PrototypeSprites === 'undefined' ? null : PrototypeSprites.status(),
              materials:
                typeof PrototypeMaterials === 'undefined' ? null : PrototypeMaterials.status(),
              currency: 'crowns',
              mode: game.s.mode,
              phase: game.s.phase,
              hero: game.hero,
              partyDiagnostics: game.partyDiagnosticsReport(),
              statistics: game.s.statistics,
            },
            'Azeroth_Playtest_Report.json',
          )
  }
  function saveMenu() {
    openMenu(
      'Save and game management',
      'Save, back up, or choose another run.',
      [
        action('Save run', () => {
          save();
          closeMenu();
        }),
        action('Save backups', saveBackupMenu),
        action('New game', newGameMenu),
        ...(combatDiagnosticsEnabled
          ? [
              action(
                'Load Combat Diagnostics run',
                () => {
                  if (load('arena')) {
                    graphicsController.revert();
                    setOptimizationActive(true);
                    resize();
                    save();
                    closeMenu();
                    updateHUD();
                  }
                },
                'Continue your separate low-spec combat-testing save.',
                !persistence.exists('arena'),
              ),
            ]
          : []),
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
  function saveBackupMenu() {
    openMenu(
      'Save backups',
      'Export a backup before replacing a run.',
      [
        action('Export save', () =>
          exportJSON(game.snapshot(), 'Azeroth_Chronicles_' + game.s.mode + '.json'),
        ),
        { kind: 'file', label: 'Import save' },
      ],
      saveMenu,
    );
  }
  function newGameMenu() {
    openMenu(
      'New game',
      'Choose a mode. Export a backup to keep your current run.',
      [
        action('New Normal game', () => chooseLanguage('normal')),
        ...(combatDiagnosticsEnabled
          ? [
              action(
                'New Combat Diagnostics run',
                () => chooseLanguage('arena'),
                'Unlisted low-spec playtest · black battlefield · authentic combat',
              ),
            ]
          : []),
        ...(developerEnabled
          ? [action('New Developer Mode run', () => chooseLanguage('developer'))]
          : []),
        action(
          'New game in Nightmare Mode',
          () => chooseLanguage('nightmare'),
          'Unlocked by the peaceful ending',
          !profile.nightmareUnlocked,
        ),
      ],
      started ? saveMenu : showTitleScreen,
    );
  }
  // Menu audit Step 2: one window for every display, renderer and frame option.
  // This is a presentation-only reorganization; each setter is the existing one.
  let performanceDetailsExpanded = false;
  let effectRecording = false;
  function platformMenu(back = systemMenu) {
    const resolutions = [
      ['auto', 'Automatic sharpness'],
      ['native', 'Maximum sharpness'],
      ['100', '100% · Standard'],
      ['80', '80% · Balanced'],
      ['60', '60% · Performance'],
      ['50', '50% · Maximum speed'],
    ];
    const frameRates = [
      ['auto', 'Auto 20–30 FPS · Default'],
      ['auto60', 'Auto 30–60 FPS'],
      ['20', '20 FPS'],
      ['30', '30 FPS'],
      ['60', '60 FPS'],
    ];
    const choices = (values) => values.map(([value, label]) => ({ value, label }));
    const items = [
      menuControls.section('Display'),
      menuControls.select(
        'Screen layout',
        platform.preference,
        choices([
          ['auto', 'Automatic screen'],
          ['desktop', 'Chromebook / desktop screen'],
          ['phone', 'Phone / touch screen'],
        ]),
        (value) => {
          platform.select(value);
          // Each screen type remembers its own camera zoom; update the
          // adjacent selector without navigating away from this window.
          const camera = Array.from($('modal-actions').querySelectorAll?.('select') || []).find(
            (control) => control.getAttribute?.('aria-label') === tr('Camera zoom'),
          );
          if (camera) camera.value = String(platform.cameraZoom);
        },
        'Choose phone or desktop controls. Your save stays the same.',
      ),
      menuControls.select(
        'Camera zoom',
        String(platform.cameraZoom),
        choices([
          ['1', 'Camera 100%'],
          ['1.5', 'Camera 150%'],
          ['1.75', 'Camera 175%'],
        ]),
        (value) => {
          clearInput();
          platform.selectCameraZoom(Number(value));
        },
        'Zoom changes your view only.',
      ),
      menuControls.section('Graphics'),
      menuControls.select(
        'Optimization Mode',
        optimizationPreference,
        choices([
          ['off', 'Off'],
          ['auto', 'Auto · Recommended'],
          ['on', 'On'],
        ]),
        (value) => {
          if (!['off', 'auto', 'on'].includes(value)) return;
          optimizationPreference = value;
          try { localStorage.setItem(optimizationKey, value); } catch (_) {}
          autoOptimization.reset();
          // Critical recovery is not an opt-out, even if Off is chosen now.
          setOptimizationActive(value === 'on' || frameSkip.emergency);
        },
        'Auto lowers graphics under sustained load. Emergencies can override Off.',
      ),
      menuControls.select(
        'Rendering resolution',
        renderResolution.preference,
        choices(resolutions),
        (value) => {
          renderResolution.select(value);
          resize();
          runtime.reset();
          frameProfile.reset();
          fps.suspend();
        },
        'Choose world detail without changing screen size or controls.',
      ),
      menuControls.section('Frame rate'),
      menuControls.select(
        'Frame rate',
        fps.preference,
        choices(frameRates),
        (value) => {
          fps.select(value);
          frameSkip.suspend();
          runtime.reset();
          frameProfile.reset();
        },
        'Choose a target for smoother motion or lower graphics load.',
      ),
      menuControls.toggle(
        'Adaptive frame skip',
        frameSkip.enabled,
        (enabled) => {
          frameSkip.select(enabled);
          fps.suspend();
          runtime.reset();
          frameProfile.reset();
        },
        'Off disables ordinary skips, not emergency combat protection.',
      ),
      menuControls.section('Graphics renderer'),
      menuControls.select(
        'Graphics renderer',
        graphicsController.status().preferredRenderer || graphicsController.status().mode,
        choices([
          ['canvas2d', 'Canvas 2D · Default'],
          ['webgl2', 'PixiJS WebGL2 · Experimental'],
        ]),
        (value) => {
          if (value === 'canvas2d') {
            graphicsController.revert();
            closeMenu();
            return;
          }
          // The existing independent 15-second Keep/Revert panel must be
          // visible over the live game, never obscured by a settings dialog.
          closeMenu();
          status('Preparing real campaign artwork in PixiJS…');
          graphicsController.requestWebGL().then((ready) => {
            if (!ready) status('PixiJS unavailable; Canvas 2D remains active.');
          });
        },
        graphicsController.status().preferredRenderer === 'webgl2' &&
          graphicsController.status().mode === 'canvas2d'
          ? 'WebGL2 remains your choice; Canvas backup is active. Recovery tries when safe.'
          : 'WebGL2 may run faster on some devices. Try it for 15 seconds; keep it or return to Canvas.',
      ),
      ...(graphicsController.status().recoveryPaused
        ? [action('Retry PixiJS WebGL2', () => {
            closeMenu();
            status('Preparing PixiJS graphics…');
            graphicsController.requestWebGL().then((ready) => {
              if (!ready) status('WebGL2 unavailable. Canvas backup remains active.');
            });
          })]
        : []),
      menuControls.section('Diagnostics'),
      action('Export playtest report', exportPlaytestReport,
        'Download a local JSON report to share yourself.'),
      action(
        performanceDetailsExpanded ? 'Hide performance details' : 'Show performance details',
        () => {
          performanceDetailsExpanded = !performanceDetailsExpanded;
          platformMenu(back);
        },
        'Local samples are diagnostic estimates, not verified display FPS.',
      ),
    ];
    if (performanceDetailsExpanded) {
      items.push(
        action(rendererRecording ? 'Stop renderer profiling' : 'Start renderer profiling', () => {
          if (rendererRecording) stopRendererRecording();
          else beginRendererRecording();
          platformMenu(back);
        }, 'Record bounded frame spikes and PR #518 cache activity while playing.'),
        ...(lastRendererRecording && !rendererRecording ? [
          action('Clear renderer profiling', () => {
            lastRendererRecording = null;
            platformMenu(back);
          }),
        ] : []),
        menuControls.section(
          'Performance details',
          runtime.describe({
            ...renderer.metrics(),
            measuredLayer:
              graphicsController.status().mode === 'webgl2'
                ? 'canvas-combat-overlay'
                : 'canvas-full-world',
          }) +
            '\n\n' +
            frameProfile.describe() +
            '\n\n' +
            game.crowdDiagnosticsDescribe(),
        ),
        action(
          game.crowdDiagnosticsReport().recording
            ? 'Stop navigation profiling'
            : 'Start navigation profiling',
          () => {
            if (game.crowdDiagnosticsReport().recording) game.stopCrowdDiagnostics();
            else game.startCrowdDiagnostics();
            platformMenu(back);
          },
          'Capture navigation and terrain work, then export a playtest report.',
        ),
        ...(developerEnabled && game.s.mode === 'developer'
          ? [
              menuControls.section('Developer effect diagnostics'),
              action(
                effectRecording ? 'Stop effect recording' : 'Start effect recording',
                () => {
                  effectRecording = renderer.setEffectDiagnostics(!effectRecording);
                  platformMenu(back);
                },
                'Bounded, in-memory recording. Export with the existing playtest report.',
              ),
              action('Clear effect recording', () => {
                renderer.resetEffectDiagnostics();
                effectRecording = false;
                platformMenu(back);
              }),
              menuControls.section(
                'Effect recording · ' +
                  (effectRecording ? 'ON' : 'OFF') +
                  ' · painter calls, not pixel verification',
              ),
            ]
          : []),
        action('Reset performance sample', () => {
          runtime.reset();
          frameProfile.reset();
          frameProfile.clearSlowdowns();
          platformMenu(back);
        }),
      );
    }
    openMenu(
      'Screen and performance',
      'Adjust everything here without leaving this screen.',
      items,
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
      started ? openMain : showTitleScreen,
    );
  }
  function arenaTravel(id) {
    if (!game.arenaSelectStage(id)) return;
    clearWaypoint();
    save();
    closeMenu();
    updateHUD();
  }
  function arenaRegionMenu(index) {
    if (game.s.mode !== 'arena') return;
    const region = D.regions[index];
    openMenu(
      region.name + ' · Combat Arena',
      'Native combat with a small number of active enemies. All destinations remain open.',
      game.arenaStages()
        .filter((stage) => stage.region === index && stage.kind !== 'hub')
        .map((stage) => action(stage.label, () => arenaTravel(stage.id))),
      arenaDestinations,
    );
  }
  function arenaDestinations() {
    if (game.s.mode !== 'arena') return;
    openMenu(
      'Combat Arena · destinations',
      'Choose any stage. Return to the safe hub at any time, including during combat.',
      [
        action('Safe hub · specialists', () => arenaTravel('hub')),
        ...D.regions.map((region, index) =>
          action(region.name, () => arenaRegionMenu(index), 'Ordinary · guardians/captain · bosses'),
        ),
      ],
      openMain,
    );
  }
  function openMain() {
    if (game.s.mode === 'arena') {
      openMenu('Combat Arena', 'Black floor · no scenery · all combat rules preserved. Your arena save is separate.', [
        action('Choose an enemy encounter', arenaDestinations),
        ...(game.s.arenaStage === 'hub'
          ? []
          : [
              action('Replay current encounter', () => arenaTravel(game.s.arenaStage)),
              action('Return to safe hub', () => arenaTravel('hub')),
            ]),
        action('Build free Barracks here', () => {
          const b = game.arenaBuildBarracks();
          if (b) { save(); barracksMenu(b, openMain); }
        }, 'Instant, invisible structure. Existing Barracks services remain available.'),
        action('Free recovery · heal the party', () => {
          game.arenaRest();
          save();
          closeMenu();
          updateHUD();
        }),
        action('Character', characterMenu),
        action('Skill journal', () => skillBook(openMain)),
        action('Game and settings', systemMenu),
        action('Return to Main Menu', returnToTitleScreen),
      ]);
      return;
    }
    const canBuild = !game.isDungeon() && game.availableLabor().length > 0,
      cost = game.barracksBuildCost(),
      costLabel = cost ? cost + ' crowns' : 'FREE';
    openMenu('Adventure menu', '', [
      action(
        'Establish Basic Barracks · ' + costLabel,
        () => {
          if (game.build()) closeMenu();
        },
        !canBuild
          ? game.isDungeon()
            ? 'Build in the field, outside dungeons'
            : 'An idle active Soldier or Ranger is needed'
          : 'Open ground off the road. One companion builds it. Once built: Treat wounds heals the party for 30 crowns.',
        !canBuild || game.hero.gold < cost,
        !!game.s.quests['quest-barracks']?.barracksBriefed &&
          !game.s.quests['quest-barracks'].paid &&
          !game.hasAnyBarracks(),
      ),
      ...(appUpdateReady ? [action('Install available game update', updateApp)] : []),
      action(
        'Map and travel routes',
        () => showMap(openMain),
        language === 'es'
          ? 'Elige un destino en el mapa · Tecla: ' + mapKeyHint()
          : 'Choose a marked destination · Key: ' + mapKeyHint(),
      ),
      action('Quest journal', () => quests(false, openMain)),
      action('Character', characterMenu),
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
      action('Game and settings', systemMenu),
      action('Return to Main Menu', returnToTitleScreen),
    ]);
  }
  $('menu-button').onclick = (e) => {
    audio.unlock();
    if (!started) showTitleScreen();
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
      { paladin: 'Paladin', mage: 'Mage', ranger: 'Ranger', rogue: 'Rogue' }[game.hero.class] || 'Hero';
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
      (language === 'es' ? approvedNarrative.M03.es : approvedNarrative.M03.en);
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
          action((id === 'rogue' ? '' : c.icon + ' ') +
            heroClassLabel(id, false) + ' successor', () => {
            game.successor(id);
            save();
            closeMenu();
          }, '', false, false, id),
        ),
    );
  }
  function gameOver() {
    openMenu(
      'The last successor has fallen',
      'All ' +
        playableClassCountWord() +
        ' classes have fallen. This run is over. Its progress remains available for export; continuing it is disabled.',
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
      if (candidate.s.mode === 'arena' && !combatDiagnosticsEnabled)
        throw Error('Combat Diagnostics import requires the playtest link');
      persistence.writeCandidate(candidate);
      resumeSavedRun(candidate, { imported: true });
      status('Imported successfully.');
    } catch (_) {
      status('Invalid import. Your current run was kept intact.');
      // The normal status bar is hidden by the title screen. Keep failures
      // visible in the current save dialog without replacing any campaign.
      if (menu && $('modal-description')) $('modal-description').textContent =
        language === 'es'
          ? 'No se pudo importar el archivo. Tu partida actual se conservó.'
          : 'Unable to import that file. Your current run was kept intact.';
    }
    e.target.value = '';
  };
  function resumeSavedRun(candidate, { imported = false } = {}) {
    if (candidate?.s?.mode === 'arena' && !combatDiagnosticsEnabled) return;
    restartGuard.clean();
    game = activateLiveCritical(candidate);
    if (game.s.mode === 'arena') {
      graphicsController.revert();
      setOptimizationActive(true);
      resize();
    } else setOptimizationActive(optimizationPreference === 'on');
    loaded = true;
    started = false;
    if (!['developer', 'arena'].includes(game.s.mode)) profile.activeMode = game.s.mode;
    if (game.peace && game.s.finalRestCompleted && !['developer', 'arena'].includes(game.s.mode))
      profile.nightmareUnlocked = true;
    persistProfile();
    titleImportNotice = imported;
    showTitleScreen();
  }
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
    if (game.s.mode === 'arena' && n.kind === 'arena-guide') {
      arenaDestinations();
      return;
    }
    if (game.s.mode === 'arena' && n.kind === 'arena-level-trainer') {
      if (game.arenaLevelUp()) {
        save();
        updateHUD();
        status(
          language === 'es'
            ? '¡Nivel ' + game.hero.level + '! Has subido un nivel.'
            : 'Level ' + game.hero.level + '! Gained exactly one level.',
        );
      }
      return;
    }
    if (game.s.mode === 'arena' && n.kind === 'arena-recovery') {
      game.arenaRest();
      save();
      updateHUD();
      status('All active fighters recovered for free.');
      return;
    }
    if (
      n.kind === 'rest' &&
      game.zoneId === 'vale' &&
      !game.s.discovered['vale:refuge-help:' + n.id]
    ) {
      refugeIntro(n);
      return;
    }
    if (n.kind === 'dungeon' && !game.sideDungeon(n.family)) {
      dungeonEntranceMenu(n);
      return;
    }
    if (n.kind === 'exit' || (n.kind === 'dungeon' && n.sideDungeon)) {
      const destination = n.kind === 'dungeon' ? n.family :
        game.sideDungeon()?.region || game.supplyRoom()?.region || game.definition().id;
      sceneTransitionTo(destination, n.name || destination, () => game.interact(n));
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
        'critical-codex',
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
        else if (n.treasuryRecovery) status(game.messages.at(-1));
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
    else if (n.kind === 'scene-detail') {
      // Source-checked interaction is required: merely entering the Citadel
      // cannot reveal Veyra's private quarters.
      if (game.interact(n) && approvedNarrative?.[n.narrativeId]) {
        save();
        openMenu(
          n.name,
          approvedNarrative[n.narrativeId].en,
          [action('Back', closeMenu)],
          closeMenu,
        );
      }
    } else if (n.kind === 'supplier' || n.kind === 'alchemist') {
      supplier(n);
      save();
      updateHUD();
    } else if (n.kind === 'recruiter') partyMenu();
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
                sceneTransitionTo(target.id, target.name, () => game.travelHub(target.id));
              },
              target.town,
            ),
          ),
        );
      } else {
        transport(n);
      }
    }
  }
  $('touch-interact-button').onclick = (e) => {
    audio.unlock();
    if (activePlay()) interact();
  };

  function practiceRecall(complete) {
    recallPractice = { owner: game, complete };
    closeMenu();
    updateHUD();
    $('recall-button').focus?.({ preventScroll: true });
  }
  function recallSquad() {
    if (queuedCharges.size)
      status(language === 'es' ? 'Cola de habilidades cancelada.' : 'Skill queue cancelled.');
    queuedCharges.clear();
    if (charge?.autoRelease) cancelCharge();
    const recalled = game.recallParty();
    if (recalled && recallPractice?.owner === game && game.activeLivingParty().length) {
      const complete = recallPractice.complete;
      recallPractice = null;
      complete();
    }
    updateHUD();
  }

  function volumeLabel(key) {
    return {
      master: 'Master volume',
      music: 'Music volume',
      ambience: 'Ambience volume',
      effects: 'Effects volume',
      interface: 'Interface volume',
    }[key];
  }
  function soundMenu(back = closeMenu) {
    const settings = audio.settings;
    const apply = (value) => {
      audio.setSettings(value);
      profile.audio = { ...audio.settings };
      persistProfile();
    };
    openMenu(
      'Music and sound',
      'Adjust all five volumes here. Muting preserves your levels.',
      [
        menuControls.toggle(
          'Mute all sound',
          settings.muted,
          (muted) => apply({ muted }),
          'Switch sound off or on without resetting the sliders.',
          false,
        ),
        menuControls.section('Volume levels'),
        ...['master', 'music', 'ambience', 'effects', 'interface'].map((key) =>
          menuControls.slider(
            volumeLabel(key),
            Math.round((settings[key] ?? settings.effects) * 100),
            0,
            100,
            1,
            (percent) => apply({ [key]: percent / 100 }),
            '',
            '%',
            false,
          ),
        ),
      ],
      back,
    );
  }

  function clearWaypoint() {
    if (navigationGuide?.autopilot && game.hero.order === navigationGuide.order) {
      game.hero.order = null;
      game.hero.path = [];
    }
    navigationGuide = null;
    // Explicit Cancel/Clear dismisses all visible guides. The companion's
    // saved gathering order continues, but we don't automatically re-track it.
    suspendedGatheringGuide = null;
    // Dismissing a gathering waypoint never cancels saved companion work.
    if (questGuide?.kind === 'gathering') gatheringGuideRequest = game.s.gatheringTarget;
    questGuide = null;
    cancelNavigationButton.hidden = true;
  }
  function startNavigation(destination, label, choice) {
    if (game.hero.order?.type !== 'move') return;
    // Only this explicitly selected map journey has automatic-travel priority.
    // A targeted but out-of-range skill must not replace it with a chase order.
    game.hero.order.navigation = true;
    // Map navigation temporarily takes visual priority over a gathering guide.
    // Restore the earlier guide only on natural arrival (not explicit Cancel).
    const gathering = game.s.gatheringTarget;
    if (
      questGuide?.kind === 'gathering' &&
      questGuide.campaign === game &&
      questGuide.nodeId === gathering?.id &&
      questGuide.sourceZone === gathering.zone
    )
      suspendedGatheringGuide = gathering;
    else if (!navigationGuide || suspendedGatheringGuide !== gathering)
      suspendedGatheringGuide = null;
    questGuide = null;
    if (gathering) gatheringGuideRequest = gathering;
    navigationGuide = {
      campaign: game,
      hero: game.hero,
      deaths: game.s.statistics.deaths,
      zone: game.zoneId,
      destination,
      label,
      point: choice.point,
      // Own a stable guidance copy; movement consumes/mutates hero.path.
      route: choice.path.map((point) => ({ x: point.x, y: point.y })),
      order: game.hero.order,
      autopilot: true,
      origin: { x: game.hero.x, y: game.hero.y },
      next: 0,
    };
    cancelNavigationButton.hidden = !visibleNavigationRoute();
  }
  function updateNavigationGuide(force = false) {
    const guide = navigationGuide;
    if (!guide) return;
    if (
      guide.campaign !== game ||
      guide.hero !== game.hero ||
      guide.deaths !== game.s.statistics.deaths ||
      guide.zone !== game.zoneId ||
      game.hero.hp <= 0
    ) {
      navigationGuide = null;
      suspendedGatheringGuide = null;
      cancelNavigationButton.hidden = true;
      return;
    }
    if (navigationArrived(guide)) {
      navigationGuide = null;
      cancelNavigationButton.hidden = true;
      const gathering = suspendedGatheringGuide;
      suspendedGatheringGuide = null;
      // A still-active task regains its passive waypoint after arrival.
      // This never issues hero movement or changes a companion's work order.
      if (gathering && gathering === game.s.gatheringTarget) {
        gatheringGuideRequest = null;
        updateQuestGuide(true);
      }
      return;
    }
    if (guide.autopilot && game.hero.order !== guide.order) guide.autopilot = false;
    if (guide.autopilot) return; // Follow the live hero route without new plans.
    if (
      !force &&
      game.s.time < guide.next &&
      Math.hypot(game.hero.x - guide.origin.x, game.hero.y - guide.origin.y) < 100
    )
      return;
    guide.next = game.s.time + 1;
    guide.origin = { x: game.hero.x, y: game.hero.y };
    const choice = game.navigationTarget(guide.destination);
    guide.route = choice ? choice.path : [];
  }
  function updateQuestGuide(force = false) {
    const gathering = game.s.gatheringTarget;
    if (gathering && gathering !== gatheringGuideRequest) {
      gatheringGuideRequest = gathering;
      questGuide = {
        kind: 'gathering',
        nodeId: gathering.id,
        sourceZone: gathering.zone,
        campaign: game,
        hero: game.hero,
        deaths: game.s.statistics.deaths,
        zone: null,
        route: [],
        next: 0,
      };
      // A gathering guide can remain secondary to a chosen navigation destination.
    } else if (!gathering) {
      gatheringGuideRequest = null;
      if (questGuide?.kind === 'gathering') questGuide = null;
    }
    if (!questGuide) return;
    if (
      questGuide.campaign !== game ||
      questGuide.hero !== game.hero ||
      questGuide.deaths !== game.s.statistics.deaths ||
      game.s.quests[questGuide.id]?.paid ||
      game.s.quests[questGuide.id]?.done ||
      game.s.quests[questGuide.id]?.closedByPeace
    ) {
      questGuide = null;
      return;
    }
    while (
      questGuide.route.length &&
      Math.hypot(questGuide.route[0].x - game.hero.x, questGuide.route[0].y - game.hero.y) < 38
    )
      questGuide.route.shift();
    if (!force && questGuide.zone === game.zoneId && game.s.time < questGuide.next) return;
    questGuide.next = game.s.time + 1;
    const target =
      questGuide.kind === 'gathering'
        ? questGuide.sourceZone === game.zoneId &&
          game.zone().nodes.find((n) => n.id === questGuide.nodeId && n.amount > 0)
        : questGuide.id
          ? game.questDestination(questGuide.id)
          : questGuide.destination;
    if (!target || target.hp <= 0) {
      questGuide.route = [];
      return;
    }
    if (
      !questGuide.id &&
      questGuide.kind !== 'gathering' &&
      Math.hypot(target.x - game.hero.x, target.y - game.hero.y) < 90
    ) {
      questGuide = null;
      return;
    }
    const moved =
      questGuide.target &&
      Math.hypot(target.x - questGuide.target.x, target.y - questGuide.target.y) > 60;
    const displaced =
      questGuide.origin &&
      Math.hypot(game.hero.x - questGuide.origin.x, game.hero.y - questGuide.origin.y) > 100;
    if (
      !force &&
      !moved &&
      !displaced &&
      (questGuide.route.length ||
        Math.hypot(target.x - game.hero.x, target.y - game.hero.y) < 115) &&
      questGuide.zone === game.zoneId &&
      questGuide.target?.id === target.id
    )
      return;
    const choice = game.navigationTarget(target);
    questGuide.zone = game.zoneId;
    questGuide.target = { id: target.id, x: target.x, y: target.y };
    questGuide.origin = { x: game.hero.x, y: game.hero.y };
    questGuide.route =
      choice && Math.hypot(choice.point.x - game.hero.x, choice.point.y - game.hero.y) > 75
        ? choice.path
        : [];
  }
  function storyNavigate(destination, label, questId = null) {
    if (questId) {
      closeMenu();
      clearWaypoint();
      questGuide = {
        id: questId,
        campaign: game,
        hero: game.hero,
        deaths: game.s.statistics.deaths,
        zone: null,
        route: [],
        next: 0,
      };
      updateQuestGuide(true);
      status(
        language === 'es'
          ? 'Objetivo: ' + tr(label) + '. Sigue la ruta.'
          : 'Tracking ' + label + '. Follow the waypoint.',
      );
      return;
    }
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
      startNavigation(destination, label, { point: choice, path: game.hero.path });
      status('Following path to ' + label + '.');
    } else status('Route unavailable. Try again nearby.');
  }

  // prettier-ignore
  function showMap(back = closeMenu) {
    if (game.s.mode === 'arena') return arenaDestinations();
    const zone = game.zone();
    const room = game.supplyRoom();
    const side = game.sideDungeon();
    const region = game.definition();
    const destinations = game.mapDestinations();

    let selected = null;
    let route = null;
    // Preserve the native nearest-first order within each category while
    // giving long map lists predictable landmarks. This never reveals hidden
    // bosses or services: only mapDestinations() supplies the entries.
    const groupFor = (place) =>
      place.kind === 'transport' || place.kind === 'exit'
        ? 'Travel routes'
        : place.kind === 'dungeon' || place.sideDungeon
          ? 'Dungeon entrances'
          : place.kind === 'rest' || place.kind === 'barracks'
            ? 'Towns and camps'
            : 'Places and threats';
    const groups = ['Towns and camps', 'Travel routes', 'Dungeon entrances', 'Places and threats'];
    const orderedPlaces = groups.flatMap((name) =>
      destinations.filter((place) => groupFor(place) === name),
    );
    const choices = [
      action(
        'Navigate to selected',
        () => {
          if (!selected) return;
          // Begin the new order after the dialog releases its held input.
          const latest = findRoute(selected);
          if (!latest) {
            status('No walkable route to ' + selected.name + '.');
            return;
          }
          closeMenu();
          if (PrototypeInput.requestMove(game, latest.point)) {
            startNavigation(selected, selected.name, latest);
            status('Walking to ' + selected.name + '.');
          } else status('Route blocked. Choose another destination.');
        },
        '',
        true,
      ),
      ...groups.flatMap((group) => {
        const places = orderedPlaces.filter((place) => groupFor(place) === group);
        return places.length
          ? [
              menuControls.section(group),
              ...places.map((place) =>
                action(
                  (place.icon || '•') + ' ' + place.name,
                  () => choose(place),
                  place.kind === 'transport'
                    ? 'Walk to the travel service; choose your journey there.'
                    : place.kind === 'dungeon' || place.sideDungeon
                      ? 'Walk to the entrance, then interact to enter.'
                      : '',
                ),
              ),
            ]
          : [];
      }),
      ...(navigationGuide || questGuide
        ? [
            action('Clear waypoint', () => {
              clearWaypoint();
              closeMenu();
            }),
          ]
        : []),
    ];
    openMenu((room?.name || side?.name || region.name) + ' map', 'Choose a place, then select Navigate.', choices, back);
    $('modal').setAttribute('data-view', 'map');
    // Section headings do not participate in keyboard action indices.
    const mapButtons = Array.from($('modal-actions').children).filter(
      (node) => typeof node.onclick === 'function',
    );
    const go = mapButtons[0];
    go.classList.add('route-go');
    go.setAttribute('aria-live', 'polite');
    orderedPlaces.forEach((_, index) =>
      mapButtons[index + 1].setAttribute('aria-pressed', 'false'),
    );
    const map = document.createElement('canvas');
    map.width = 480;
    map.height = 320;
    map.setAttribute('aria-label', tr('Map of the current area. Select a place to navigate.'));
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
            const cliff = region.id === 'highlands' && Campaign.rules.terrain[2].some(p => p.kind === 'cliff' && x > p.x1 && x < p.x2 && y > p.y1 && y < p.y2);
            ctx.fillStyle = game.isDungeon() || cliff ? '#78807d' : '#355d72';
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
      go.textContent = tr(route ? 'Navigate · ' + place.name : 'No route · ' + place.name);
      orderedPlaces.forEach((candidate, index) => {
        const button = mapButtons[index + 1];
        const picked = candidate === place;
        button.classList.toggle('route-picked', picked);
        button.setAttribute('aria-pressed', String(picked));
      });
      // Section headings are DOM siblings, not keyboard menu actions.
      // Match the selected real action, including grouped destination lists.
      menuIndex = buttons.indexOf(mapButtons[orderedPlaces.indexOf(place) + 1]);
      highlight();
      drawMap();
    }

    // A canvas tap selects ONLY a listed destination, never an arbitrary
    // ground coordinate. Compare distances in displayed CSS pixels, not
    // intrinsic map pixels, so narrow/landscape layouts have equal accuracy.
    // A close tie is intentionally left unselected: use the named list row.
    let touchMapContact = false;
    map.style.touchAction = 'manipulation';
    map.onpointerdown = (event) => {
      touchMapContact = event.pointerType === 'touch' || event.pointerType === 'pen';
    };
    map.onpointercancel = () => { touchMapContact = false; };
    map.onclick = (event) => {
      const touch = touchMapContact ||
        event.pointerType === 'touch' || event.pointerType === 'pen';
      touchMapContact = false;
      const rect = map.getBoundingClientRect();
      if (!rect.width || !rect.height || !Number.isFinite(event.clientX) ||
          !Number.isFinite(event.clientY)) return;
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const radius = touch ? 22 : 12;
      const nearby = destinations
        .map((place) => ({
          place,
          distance: Math.hypot(
            sx(place.x) * rect.width / map.width - x,
            sy(place.y) * rect.height / map.height - y,
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      if (!nearby.length || nearby[0].distance > radius) return;
      if (nearby[1] && nearby[1].distance <= radius &&
          nearby[1].distance - nearby[0].distance < 8) return;
      choose(nearby[0].place);
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
        1: 'Radiant Strike / Radiant Cross',
        2: 'Sundering Strike',
        3: 'Shield Stance',
        4: 'Judgment',
        5: 'Holy Area',
        6: 'Vanguard Rush',
        7: 'Holy Assault',
        8: 'Sanctuary Oath / Last Bastion',
      },
      mage: {
        1: 'Arcane Beam / Wide Arcane Beam',
        2: 'Frost Bolt',
        3: 'Spell Interrupt',
        4: 'Arcane Fracture',
        5: 'Force Pulse / Force Wave',
        6: 'Magic Shot',
        7: 'Arcane Chain / Chainstorm',
        8: 'Astral Detonation / Arcane Cataclysm',
      },
      ranger: {
        1: 'Rapid Arrows / Hawk Interception',
        2: 'Pinning Shot',
        3: 'Self-Heal',
        4: 'Movement Haste / Rally',
        5: 'Arrow Volley',
        6: 'Repelling Shot / Volley',
        7: 'Piercing Arrow',
        8: 'Hunters Salvo / Grand Hunt',
      },
      rogue: {
        1: 'Ding and Sting / Raise a Racket',
        2: "Lead Feet / Can't Dance",
        3: 'Beat Breaker / Shut the Band Up',
        4: 'Sour Note / Rotten Chorus',
        5: 'Sticky Shuffle / Briar Boogie',
        6: 'Stolen Beat / Time Out',
        7: 'Wrong Foot / Panic Party',
        8: 'Bad Bell Day / Last Laugh',
      },
    };
    return tr(labels[game.hero.class]?.[slot] || skillNames[slot - 1]);
  };
  function chargeSeconds() {
    return PrototypeRules.chargedSkills?.holdSeconds || 0.65;
  }
  function chargeTapSeconds() {
    return PrototypeRules.chargedSkills?.tapSeconds || 0.2;
  }
  function queueInputRule() {
    return PrototypeRules.chargedSkills.queueInput;
  }
  function syncQueuedInput(request) {
    if (
      request.input &&
      game.partyChargeNow() - request.input.pressedAt + 1e-9 >= queueInputRule().holdSeconds
    )
      request.charged = true;
  }
  function queuedInputReady(request) {
    syncQueuedInput(request);
    return request.charged || !request.input;
  }
  function queuedSkillLabel(request) {
    const form =
      language === 'es'
        ? request.charged
          ? 'CARGADA'
          : 'NORMAL'
        : request.charged
          ? 'CHARGED'
          : 'NORMAL';
    return form + ' ' + (language === 'es' ? 'COLA' : 'QUEUED');
  }
  function beginQueuedInput(request, source, pointerId) {
    if (request.input) return;
    request.input = { source, pointerId, pressedAt: game.partyChargeNow() };
  }
  function finishQueuedInput(slot, source, pointerId = null) {
    const request = queuedCharges.contact(slot, source, pointerId),
      contact = request?.input;
    if (!contact || contact.source !== source || contact.pointerId !== pointerId) return false;
    const held = game.partyChargeNow() - contact.pressedAt;
    syncQueuedInput(request);
    request.input = null;
    // Match manual input's deliberate no-action gap, rather than upgrading
    // an ambiguous release into an accidental normal cast.
    if (!request.charged && held >= chargeTapSeconds()) {
      if (charge === request) cancelCharge(false);
      else queuedCharges.remove(request);
      status(language === 'es' ? 'Entrada cancelada.' : 'Input cancelled.');
    } else if (
      !request.charged &&
      slot === 3 &&
      game.hero.class === 'paladin' &&
      game.hero.shieldStance > 0
    ) {
      // Lowering an active stance is an immediate exception, not a queue jump
      // for an attack. Leave every older Shield Bash request untouched.
      if (charge === request) cancelCharge(false);
      else queuedCharges.remove(request);
      game.cast(3, undefined, false);
    }
    updateHUD();
    return true;
  }
  function cancelQueuedInput(slot, source, pointerId) {
    const request = queuedCharges.contact(slot, source, pointerId),
      contact = request?.input;
    if (!contact || contact.source !== source || contact.pointerId !== pointerId) return;
    if (charge === request) cancelCharge();
    else queuedCharges.remove(request);
    updateHUD();
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
  function chargeTarget(slot, targetId = null, charged = true) {
    if (!chargeNeedsTarget(slot)) return null;
    const range = game.heroSkillRange(slot, charged),
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
    if ((game.hero.chargedCd?.[charge.slot - 1] || 0) > 0) return false;
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
      charge.deaths !== game.s.statistics.deaths ||
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
    if (charge.autoRelease && (!queuedInputReady(charge) || !charge.charged)) return false;
    if (
      game.hero.cd[charge.slot - 1] <= 0 &&
      (game.hero.chargedCd?.[charge.slot - 1] || 0) <= 0 &&
      game.partyChargeRecovery(game.hero) <= 0
    )
      return startChargeClock();
    return false;
  }
  function queuedChargePresentation() {
    return [...queuedCharges.values()].map((request, index) => {
      syncQueuedInput(request);
      return {
        id: request.id,
        order: index + 1,
        slot: request.slot,
        charged: request.charged,
        ready:
          queuedInputReady(request) &&
          queuedCharges.get(request.slot) === request &&
          game.hero.cd[request.slot - 1] <= 0 &&
          (!request.charged || (game.hero.chargedCd?.[request.slot - 1] || 0) <= 0),
        charging: charge === request && request.started !== null,
        color: request.charged ? '#f6d77a' : '#9dc6dd',
      };
    });
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
        charged: charge.charged,
        state: 'waiting',
        elapsed: 0,
        progress: 0,
        ready: false,
        waiting: true,
        cooldown: Math.max(
          game.hero.cd[charge.slot - 1],
          charge.charged ? game.hero.chargedCd?.[charge.slot - 1] || 0 : 0,
          game.partyChargeRecovery(game.hero),
        ),
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
    if (!canChargeSlot(slot) || !activePlay() || !rank || game.peace) return false;
    syncPartyChargeClock();
    // A new contact always creates a new intent, even for the same form.
    if (
      queuedCharges.contact(slot, source, pointerId) ||
      (charge?.source === source && charge.slot === slot && charge.pointerId === pointerId)
    )
      return false;
    const queued =
      queuedCharges.has(slot) ||
      charge?.slot === slot ||
      game.hero.cd[slot - 1] > 0 ||
      (game.hero.chargedCd?.[slot - 1] || 0) > 0 ||
      game.partyChargeRecovery(game.hero) > 0;
    if (queued && queuedCharges.size >= queuedCharges.capacity) {
      status(
        language === 'es'
          ? 'Cola llena (16). Entrada rechazada.'
          : 'Queue full (16). Input rejected.',
      );
      return false;
    }
    if (!queued && charge) cancelCharge(true, true);
    const request = {
      slot,
      source,
      pointerId,
      queued,
      autoRelease: queued,
      started: null,
      targetId: null,
      campaign: game,
      unit: game.hero,
      zone: game.zoneId,
      deaths: game.s.statistics.deaths,
      pressedAt: game.partyChargeNow(),
      charged: !queued,
      input: null,
    };
    if (queued) {
      request.source = 'queued';
      request.pointerId = null;
      beginQueuedInput(request, source, pointerId);
      queuedCharges.append(request);
      if (!charge) charge = request;
    } else {
      charge = request;
      startChargeClock();
    }
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
  function releaseCharge(slot, source, automatic = false, pointerId = null) {
    if (!automatic && finishQueuedInput(slot, source, pointerId)) return true;
    if (!charge || charge.slot !== slot || charge.source !== source) return false;
    if (!automatic && source === 'pointer' && charge.pointerId !== pointerId) return false;
    syncChargeReady();
    if (!charge) return false;
    if (charge.autoRelease && !automatic) {
      // A completed input during cooldown is one retained request. Detach it
      // from pointer capture/key-up so natural contact release cannot discard it.
      charge.source = 'queued';
      charge.pointerId = null;
      updateHUD();
      return true;
    }
    if (charge.started === null) {
      const quickTap =
          !charge.queued && game.partyChargeNow() - charge.pressedAt < chargeTapSeconds(),
        remaining = Math.max(
          game.hero.cd[slot - 1],
          game.hero.chargedCd?.[slot - 1] || 0,
          game.partyChargeRecovery(game.hero),
        );
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
  function selectQueuedCharge() {
    let invalidated = false;
    for (const request of queuedCharges.values())
      if (
        request.campaign !== game ||
        request.unit !== game.hero ||
        request.zone !== game.zoneId ||
        request.deaths !== game.s.statistics.deaths ||
        game.hero.hp <= 0 ||
        game.peace ||
        !game.hero.skills[request.slot - 1] ||
        game.hero.deathRollHeld ||
        game.hero.keeperHeld ||
        game._tacticalScatter?.has('hero')
      ) {
        queuedCharges.remove(request);
        invalidated = true;
      }
    if (invalidated)
      status(language === 'es' ? 'Cola de habilidades cancelada.' : 'Skill queue cancelled.');
    if (charge?.autoRelease && !queuedCharges.contains(charge)) cancelCharge(false);
    // A manual cast or a running charge keeps its normal preparation. Other
    // skills retain independent requests and wait for their own cooldown.
    if (charge && (!charge.autoRelease || charge.started !== null)) return;
    const ready = queuedCharges
      .heads()
      .find(
        (request) =>
          queuedInputReady(request) &&
          game.hero.cd[request.slot - 1] <= 0 &&
          (!request.charged || (game.hero.chargedCd?.[request.slot - 1] || 0) <= 0) &&
          (!request.charged || game.partyChargeRecovery(game.hero) <= 0),
      );
    if (ready) charge = ready;
    else if (!charge) charge = queuedCharges.values().next().value || null;
  }
  function releaseQueuedCharge() {
    if (!charge?.autoRelease || !activePlay()) return;
    syncQueuedInput(charge);
    if (!charge.charged) {
      if (!queuedInputReady(charge) || game.hero.cd[charge.slot - 1] > 0) return;
      // A normal request has no preparation, but obeys the same no-chase rule.
      const slot = charge.slot,
        target = chargeTarget(slot, null, false);
      const invalid =
        chargeNeedsTarget(slot) &&
        (!target ||
          Math.hypot(target.x - game.hero.x, target.y - game.hero.y) >
            game.heroSkillRange(slot, false) ||
          !game.line(game.hero, target));
      cancelCharge(false);
      if (invalid) status('Target lost. Move closer.');
      else if (!game.cast(slot, target?.id, false)) chargeFailureStatus(slot, false);
      updateHUD();
      return;
    }
    if ((game.hero.chargedCd?.[charge.slot - 1] || 0) > 0) return;
    const state = chargePresentation();
    if (!charge || !state || state.state === 'waiting' || state.state === 'charging') return;
    const slot = charge.slot,
      target = chargeNeedsTarget(slot) ? chargeTarget(slot, charge.targetId) : null;
    // An automatic request can fire at a valid current target; it must not
    // turn a later retreat into a new approach order.
    if (
      state.ready &&
      chargeNeedsTarget(slot) &&
      (!target ||
        Math.hypot(target.x - game.hero.x, target.y - game.hero.y) > chargedTargetRange(slot) ||
        !game.line(game.hero, target))
    ) {
      cancelCharge();
      status('Target lost. Move closer.');
      return;
    }
    releaseCharge(slot, charge.source, true);
  }
  function cancelCharge(feedback = true, preserveQueued = false) {
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
    if (charge.autoRelease) {
      if (preserveQueued) {
        charge.started = null;
        charge.avBuildup = charge.avRise = charge.avReady = false;
        charge.targetId = null;
        delete charge.encountersAtStart;
      } else queuedCharges.remove(charge);
    }
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
        if (e?.button > 0) return;
        releaseCharge(slot, 'pointer', false, e?.pointerId ?? null);
      };
      b.onpointercancel = b.onlostpointercapture = (e) => {
        cancelQueuedInput(slot, 'pointer', e?.pointerId ?? null);
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
    if (type === 'health' ? game.requestRangerHeal() : game.rangerSupport(type, true)) {
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
    b.setAttribute('aria-label', (type === 'health' ? 'Command ' : 'Command Ranger ') + label);
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
      (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '') &&
        !(menu && ['Tab', 'Escape'].includes(e.code)))
    )
      return;
    // A loading interlude owns keyboard focus; hidden menus cannot commit a
    // second travel or close the overlay while arrival is being prepared.
    if (sceneTransition) {
      e.preventDefault?.();
      return;
    }
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
    if (
      menu?.view === 'archive-reading' &&
      document.activeElement?.tagName === 'SUMMARY' &&
      ['Enter', 'Space'].includes(code)
    )
      return;
    // Reading text owns its native scrolling keys. Tab/Escape still use the
    // dialog route; Enter must never activate an action behind focused prose.
    if (
      menu?.view === 'archive-reading' &&
      document.activeElement === $('modal-description') &&
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        'Space',
        'Enter',
      ].includes(code)
    )
      return;
    const actionId = input.actionFor(code);
    if (actionId || code === 'Escape' || (menu && ['Enter', 'Space'].includes(code)))
      e.preventDefault();
    if (code === 'Escape') {
      if (menu) {
        audio.interfaceSound('back');
        menu.back();
      } else if (!started) showTitleScreen();
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
        // Include temporary name fields and native settings controls. Do not
        // let keyboard focus escape to the game underneath the open dialog.
        const descendants = Array.from(
          $('modal').querySelectorAll?.(
            menu.view === 'archive-reading'
              ? 'button, input, select, textarea, summary, [role="document"][tabindex="0"]'
              : 'button, input, select, textarea',
          ) || [],
        ).filter((element) => !element.disabled && !element.hidden);
        const available = descendants.length
          ? descendants
          : buttons.filter((button) => !button.disabled);
        if (!available.length) return;
        const focusedIndex = available.indexOf(document.activeElement);
        const from = focusedIndex < 0 ? (e.shiftKey ? 0 : -1) : focusedIndex;
        const next =
          available[(from + (e.shiftKey ? -1 : 1) + available.length) % available.length];
        const nextIndex = buttons.indexOf(next);
        if (nextIndex >= 0) {
          menuIndex = nextIndex;
          highlight(true);
        } else {
          next.focus?.({ preventScroll: true });
          if (next.tagName === 'SUMMARY') next.scrollIntoView?.({ block: 'nearest' });
        }
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
    if (!started) return;
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
    else if (actionId === 'heal') useRangerSupport('health');
    else if (manaEnabled && actionId === 'mana') useRangerSupport('mana');
    else if (actionId === 'training') talents();
    else if (actionId === 'skills') skillBook();
    else if (actionId === 'help') help();
    else if (actionId.startsWith('skill')) {
      const slot = Number(actionId.slice(5));
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
  syncJoystickPresentation();
  let menuJoyTime = 0;
  const floatingGameplay = () =>
    platform.mode === 'phone' && input.preferences.joystickMode === 'floating' && !menu;
  function joyUpdate(e) {
    if (floatingGameplay() && joystickStart) {
      const r = joystick.getBoundingClientRect();
      const wasStill = joy.x === 0 && joy.y === 0;
      joy = PrototypeInput.floatingJoystickVector(
        joystickStart, { x: e.clientX, y: e.clientY }, r.width * 0.4,
      );
      // Merely placing a stationary thumb does not cancel a guided journey.
      if (wasStill && (joy.x || joy.y)) cancelTravel();
    } else {
      const r = joystick.getBoundingClientRect(),
        dx = (e.clientX - r.left - r.width / 2) / (r.width * 0.4),
        dy = (e.clientY - r.top - r.height / 2) / (r.height * 0.4),
        n = Math.max(1, Math.hypot(dx, dy));
      joy = { x: dx / n, y: dy / n };
    }
    $('stick').style.transform = 'translate(' + joy.x * 24 + 'px,' + joy.y * 24 + 'px)';
  }
  function beginFloatingJoystick(e) {
    if (!floatingGameplay() || !activePlay() || e.pointerType !== 'touch' ||
        pointer !== null || worldPointer !== null) return false;
    const obstacles = [
      '#touch-interact-button', '#recall-button', '#target-button', '#squad-button',
      '#skills', '#quick-items', '#developer-summon', '#developer-finisher', '#cancel-navigation-button',
      '#sprint-button', '#update-button', '#menu-button', '#order-button', '#modal',
    ].flatMap((selector) => {
      const el = document.querySelector(selector);
      if (!el || el.hidden || getComputedStyle(el).display === 'none' ||
          getComputedStyle(el).visibility === 'hidden') return [];
      const rect = el.getBoundingClientRect();
      return [{ x: rect.left, y: rect.top, width: rect.width, height: rect.height }];
    });
    if (!PrototypeInput.floatingJoystickZone(
      { x: e.clientX, y: e.clientY },
      { width: window.innerWidth, height: window.innerHeight }, obstacles,
    )) return false;
    e.preventDefault();
    audio.unlock();
    pointer = e.pointerId;
    joystickTouchId = null;
    joystickStart = { x: e.clientX, y: e.clientY };
    joy = { x: 0, y: 0 };
    $('stick').style.transform = '';
    const rect = joystick.getBoundingClientRect();
    const left = Math.max(0, Math.min(window.innerWidth - rect.width, e.clientX - rect.width / 2));
    const top = Math.max(0, Math.min(window.innerHeight - rect.height, e.clientY - rect.height / 2));
    joystick.style.setProperty('--floating-joystick-left', Math.round(left) + 'px');
    joystick.style.setProperty('--floating-joystick-top', Math.round(top) + 'px');
    document.body.classList.add('floating-joystick-active');
    canvas.setPointerCapture?.(pointer);
    return true;
  }
  joystick.onpointerdown = (e) => {
    if (floatingGameplay()) return;
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
  const rememberJoystickTouch = (e) => {
    if (pointer === null || joystickTouchId !== null || !joystickStart) return;
    const contact = Array.from(e.changedTouches).find(
      (touch) => Math.hypot(touch.clientX - joystickStart.x, touch.clientY - joystickStart.y) < 25,
    );
    if (contact) joystickTouchId = contact.identifier;
  };
  for (const target of [joystick, canvas])
    target.addEventListener('touchstart', rememberJoystickTouch, { passive: true });
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
    if (beginFloatingJoystick(e)) return;
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
    if (floatingGameplay() && e.pointerId === pointer) {
      joyUpdate(e);
      return;
    }
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
    // Intentional world movement takes over even when the tapped spot is blocked.
    cancelTravel();
    if (!PrototypeInput.requestMove(game, tap.target)) status('Path blocked.');
  };
  canvas.onpointercancel = canvas.onlostpointercapture = (e) => {
    if (floatingGameplay() && e.pointerId === pointer) releaseJoystick();
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
    if (save() && !crashRecoveryPending && !frameSkip.emergency) restartGuard.clean();
    audio.setPaused(true);
  });
  addEventListener('focus', () => {
    focused = true;
    last = performance.now();
    if (sceneTransition?.committed) {
      const token = sceneTransition.token;
      requestAnimationFrame(() => revealSceneTransition(token));
    }
    if (started && !paused && !document.hidden) restartGuard.arm(game);
    checkAppUpdate().catch(() => {});
  });
  addEventListener('online', () => {
    if (startupUpdateNotice === 'offline') {
      startupUpdateNotice = null;
      refreshStartupUpdateNotice();
    }
    checkAppUpdate(true).catch(() => {
      if (!started) {
        startupUpdateNotice = 'unavailable';
        refreshStartupUpdateNotice();
      }
    });
  });
  document.addEventListener('visibilitychange', () => {
    clearInput();
    last = performance.now();
    if (document.hidden) {
      if (sceneTransition && !sceneTransition.committed) cancelSceneTransition();
      renderResolution.suspend();
      // A hidden browser may lose its GPU context and require expensive
      // texture reconstruction. Never resume simulation directly into it.
      const wasPlaying = started;
      const saved = save();
      if (saved && !crashRecoveryPending && !frameSkip.emergency) restartGuard.clean();
      audio.setPaused(true);
      if (wasPlaying) {
        if (saved && writerGuard.canWrite()) {
          // warmScene explicitly skips hidden documents. Continue will perform
          // the normal sprite/GPU arrival preparation behind the loading UI.
          // Keep surviving GPU resources intact for a cheap warm return.
          showTitleScreen();
        } else {
          // Match manual Return to Main Menu: do not abandon unsaved progress.
          paused = true;
          status('Saving failed. Export your run before closing.');
        }
      } else if (titleLoading) {
        // Invalidate an interrupted Continue. No pending promise or graphics
        // upload may silently activate gameplay when the page is reopened.
        showTitleScreen();
      }
    } else {
      if (sceneTransition?.committed) {
        const token = sceneTransition.token;
        requestAnimationFrame(() => revealSceneTransition(token));
      }
      if (started && !paused && focused) restartGuard.arm(game);
      checkAppUpdate().catch(() => {});
    }
  });
  addEventListener('pagehide', () => {
    clearInput();
    if (sceneTransition && !sceneTransition.committed) cancelSceneTransition();
    if (save() && !crashRecoveryPending && !frameSkip.emergency) restartGuard.clean();
    audio.setPaused(true);
    writerGuard.release();
  });
  addEventListener('pageshow', (event) => {
    // A BFCache restore retains this same live JS session.
    if (event.persisted) {
      // A page restored from BFCache has already released its writer lock.
      // Reload to acquire ownership again; ordinary app minimize uses no reload.
      location.reload();
      return;
    }
    // Some iOS Home Screen returns dispatch pageshow without another
    // visibilitychange. Re-arm recovery eligibility from the actual document
    // state instead of leaving the renderer controller marked backgrounded.
    graphicsController.visibilityChanged(document.hidden);
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
      state.layout = '';
      state.quietAfter = 0;
      host.replaceChildren();
    }
    // Consume all new notices in order. A third notice waits instead of replacing
    // either visible one, including when several milestones happen in one frame.
    // Transfer unread notices rather than trimming a history buffer: a bulk
    // completion or restored run must not lose observations before the next frame.
    for (const n of (game.notices || []).splice(0))
      if (n.id > state.lastId) {
        // Repeated routine feedback replaces the previous routine receipt.
        if (n.kind === 'feedback') {
          state.waiting = state.waiting.filter((p) => p.kind !== 'feedback');
          state.active = state.active.filter((p) => p.kind !== 'feedback');
        }
        if (!n.silentWhenInspectable) state.waiting.push({ ...n, receivedAt: now });
        state.lastId = n.id;
      }
    state.active = state.active.filter((n) => now < n.until);
    const validVisit = (n) =>
      n.scope !== 'visit' || (n.zone === game.zoneId && n.visit === game.noticeVisit);
    const actionable = (n) =>
      !n.requiresTalentPoints ||
      (n.heroClass === game.hero.class &&
        game.hero.talentPoints > 0 &&
        game.hero.talents.some((rank, i) => rank < game.talentMaxRank(i)));
    const relevant = (n) =>
      actionable(n) && validVisit(n) && (n.scope !== 'region' || n.region === game.definition().id);
    // Regional lore waits for a return to its own region. Local warnings and
    // command receipts expire on travel, even if the player immediately returns.
    state.waiting = state.waiting.filter(
      (n) => actionable(n) && validVisit(n) && (n.kind !== 'feedback' || now - n.receivedAt < 4000),
    );
    const away = state.active.filter((n) => n.scope === 'region' && !relevant(n));
    state.waiting.unshift(...away.map(({ until, ...n }) => n));
    state.active = state.active.filter(relevant);
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
    const immediate = (n) => n.kind === 'warning' || n.kind === 'feedback';
    if (!canNarrate && state.active.some((n) => !immediate(n))) {
      const interrupted = state.active
        .filter((n) => !immediate(n))
        .map(({ until, ...notice }) => notice);
      state.active = state.active.filter(immediate);
      state.waiting.unshift(...interrupted);
    }
    if (
      state.active.some((n) => n.kind === 'narration') &&
      (!canNarrate || state.waiting.some((n) => relevant(n) && n.kind !== 'narration'))
    ) {
      const interrupted = state.active
        .filter((n) => n.kind === 'narration')
        .map(({ until, ...notice }) => notice);
      state.active = state.active.filter((n) => n.kind !== 'narration');
      state.waiting.unshift(...interrupted);
    }
    const slots = platform.mode === 'phone' ? 1 : 2;
    if (state.active.length > slots) {
      state.waiting.unshift(...state.active.splice(slots).map(({ until, ...n }) => n));
    }
    if (
      state.waiting.some((n) => relevant(n) && n.kind === 'warning') &&
      state.active.some((n) => n.kind !== 'warning')
    ) {
      state.waiting.unshift(
        ...state.active.filter((n) => n.kind !== 'warning').map(({ until, ...n }) => n),
      );
      state.active = state.active.filter((n) => n.kind === 'warning');
    }
    if (
      slots === 1 &&
      state.active.some((n) => n.kind === 'milestone' || !n.kind) &&
      state.waiting.some((n) => relevant(n) && n.kind === 'feedback')
    ) {
      state.waiting.unshift(...state.active.map(({ until, ...n }) => n));
      state.active = [];
    }
    while (state.active.length < slots && state.waiting.length) {
      // Existing milestones retain their full duration. New warnings lead the
      // waiting queue, while a story is shown only when both slots are clear.
      const warningIndex = state.waiting.findIndex((n) => relevant(n) && n.kind === 'warning');
      const feedbackIndex =
        !menu && !paused && focused && !document.hidden
          ? state.waiting.findIndex((n) => relevant(n) && n.kind === 'feedback')
          : -1;
      const milestoneIndex = canNarrate
        ? state.waiting.findIndex(
            (n) => relevant(n) && n.kind !== 'narration' && n.kind !== 'feedback',
          )
        : -1;
      let index =
        warningIndex >= 0 ? warningIndex : feedbackIndex >= 0 ? feedbackIndex : milestoneIndex;
      if (index < 0 && canNarrate && !state.active.length)
        index = state.waiting.findIndex((n) => relevant(n) && n.kind === 'narration');
      if (index < 0) break;
      const [notice] = state.waiting.splice(index, 1);
      state.active.push({
        ...notice,
        until: now + (notice.duration || 5.5) * 1000,
      });
    }
    const width = typeof window === 'undefined' ? 1280 : window.innerWidth,
      height = typeof window === 'undefined' ? 800 : window.innerHeight,
      shortPhone = platform.mode === 'phone' && width > height,
      layout = [platform.mode, width, height].join(':');
    if (layout !== state.layout) {
      state.layout = layout;
      const style = typeof getComputedStyle === 'undefined' ? null : getComputedStyle(host),
        safeLeft = Number.parseFloat(style?.getPropertyValue('--notice-safe-left')) || 0,
        safeRight = Number.parseFloat(style?.getPropertyValue('--notice-safe-right')) || 0;
      const hud = $('hud').getBoundingClientRect(),
        edge = Math.max(12, platform.mode === 'phone' ? safeLeft : 0),
        right =
          platform.mode === 'desktop'
            ? Math.max(180, hud.left - edge)
            : width - Math.max(12, safeRight),
        left = shortPhone && width - hud.right > 250 ? hud.right + edge : edge,
        available = Math.max(160, right - left),
        noticeWidth = Math.min(platform.mode === 'phone' ? (shortPhone ? 320 : 310) : 480, available);
      host.style.width = noticeWidth + 'px';
      host.style.left = left + available / 2 + 'px';
      host.style.top =
        (platform.mode === 'phone' && !shortPhone ? hud.bottom + 6 : Math.max(edge, hud.top)) +
        'px';
    }
    const rendered = layout + ':' + state.active.map((n) => n.id).join(',');
    if (rendered !== state.rendered) {
      state.rendered = rendered;
      host.replaceChildren(
        ...state.active.map((n) => {
          const card = document.createElement(n.requiresTalentPoints ? 'button' : 'div');
          card.className =
            'notice-card notice-' +
            (['narration', 'warning', 'feedback'].includes(n.kind) ? n.kind : 'milestone');
          if (n.requiresTalentPoints) {
            card.type = 'button';
            card.className += ' notice-action';
            card.setAttribute('aria-label', tr('Open Talents') + ' · ' + n.text);
            card.onkeydown = card.onkeyup = (e) => {
              if (['Enter', 'Space'].includes(e.code)) e.stopPropagation();
            };
            card.onclick = (e) => {
              e.stopPropagation();
              if (
                !started ||
                menu ||
                paused ||
                game.s.challenge.pending ||
                game.s.challenge.gameOver ||
                state.game !== game ||
                !state.active.includes(n) ||
                !actionable(n)
              )
                return;
              audio.unlock();
              talents();
              updateCriticalNotice();
            };
          }
          if (n.kind === 'warning') card.setAttribute('role', 'alert');
          const displayedText =
            language === 'es' && n.textEs
              ? n.textEs
              : n.kind === 'narration' || n.kind === 'milestone' ? tr(n.text) : n.text;
          const full = displayedText + (n.detail ? ' ' + n.detail : ''),
            limit = shortPhone ? 72 : platform.mode === 'phone' ? 88 : 150,
            compact = full.length > limit;
          card.textContent = compact ? full.slice(0, limit - 1).trimEnd() + '…' : displayedText;
          if (compact) {
            const hint = document.createElement('small');
            hint.className = 'notice-detail';
            hint.textContent = tr('Full text: Menu · Announcements');
            card.append(hint);
          } else if (n.detail) {
            const detail = document.createElement('small');
            detail.className = 'notice-detail';
            detail.textContent = n.detail;
            card.append(detail);
          }
          if (n.requiresTalentPoints) {
            const hint = document.createElement('small');
            hint.className = 'notice-detail';
            hint.textContent = tr('Open Talents');
            card.append(hint);
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
    // Routine receipts never stack beneath an important amber announcement;
    // urgent status remains legible even when both channels are active.
    const shortStatus = $('status');
    if (platform.mode === 'phone') {
      const urgent = ['critical', 'important'].includes(shortStatus.dataset.noticeTier);
      const deferRoutine = state.active.length > 0 && !urgent;
      shortStatus.classList.toggle('notice-deferred', deferRoutine);
      shortStatus.style.top = state.active.length && urgent
        ? Math.ceil(host.getBoundingClientRect().bottom + 8) + 'px'
        : '';
    } else {
      shortStatus.classList.remove('notice-deferred');
      shortStatus.style.top = '';
    }
  }
  const developerSummonButton = document.createElement('button');
  developerSummonButton.id = 'developer-summon';
  developerSummonButton.textContent = 'Summon';
  developerSummonButton.setAttribute('aria-label', 'Summon a regional boss or captain');
  developerSummonButton.hidden = true;
  document.body.append(developerSummonButton);
  const developerFinisherButton = document.createElement('button');
  developerFinisherButton.id = 'developer-finisher';
  developerFinisherButton.textContent = 'Finish';
  developerFinisherButton.setAttribute('aria-label', 'Developer finisher and nearby sweep');
  developerFinisherButton.hidden = true;
  document.body.append(developerFinisherButton);
  const developerCombatMonitor = document.createElement('aside');
  developerCombatMonitor.id = 'developer-combat-monitor';
  developerCombatMonitor.setAttribute('aria-label', 'Developer combat monitor');
  developerCombatMonitor.hidden = true;
  document.body.append(developerCombatMonitor);
  const developerCompanionMonitor = document.createElement('aside');
  developerCompanionMonitor.id = 'developer-companion-monitor';
  developerCompanionMonitor.setAttribute('aria-label', 'Developer companion damage monitor');
  developerCompanionMonitor.hidden = true;
  const companionMonitorToggle = document.createElement('button');
  companionMonitorToggle.type = 'button';
  companionMonitorToggle.textContent = 'DEV · COMPANIONS';
  companionMonitorToggle.setAttribute('aria-expanded', String(platform.mode !== 'phone'));
  const companionMonitorContent = document.createElement('div');
  companionMonitorContent.id = 'developer-companion-content';
  companionMonitorContent.hidden = platform.mode === 'phone';
  companionMonitorToggle.onclick = () => {
    const collapsed = !companionMonitorContent.hidden;
    companionMonitorContent.hidden = collapsed;
    companionMonitorToggle.setAttribute('aria-expanded', String(!collapsed));
  };
  developerCompanionMonitor.append(companionMonitorToggle, companionMonitorContent);
  document.body.append(developerCompanionMonitor);
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
  function runDeveloperFinisher(sweep) {
    closeMenu();
    if (!started || game.s.mode !== 'developer') return;
    const result = game.developerFinisher(null, sweep);
    status(
      result.kills
        ? 'Developer finisher · ' + result.kills + (result.kills === 1 ? ' enemy defeated.' : ' enemies defeated.')
        : 'No eligible enemy hit. Select a target or move into range and line of sight.',
    );
    if (result.kills) save();
    updateHUD();
  }
  developerFinisherButton.onclick = () => {
    if (!activePlay() || game.s.mode !== 'developer') return;
    openMenu(
      'Developer · Finisher',
      'Extreme damage through normal enemy deaths. Real enemies drop real loot and advance progress; developer summons do not.',
      [
        action('Finish selected or nearest enemy', () => runDeveloperFinisher(false)),
        action('Sweep nearby enemies (up to 8)', () => runDeveloperFinisher(true)),
      ],
      closeMenu,
    );
  };

  // Reuse the original portrait-stamped Crown loot painter for the HUD.
  // Rasterize it ONCE at 2x for the tiny UI badge. No separate generic
  // currency drawing, asset manifest, or recurring canvas work per HUD tick.
  function prepareHudCrownCoin() {
    const coin = document.createElement('canvas');
    // The loot painter extends 12.5 units above and 10.5 below its point.
    // A 24-unit stamp cropped the upper crown; the 28-unit stamp gives the
    // full silver coin, portrait, rim and ground shadow breathing room.
    coin.width = coin.height = 56;
    const ink = coin.getContext?.('2d');
    if (!ink?.setTransform || typeof coin.toDataURL !== 'function') return;
    ink.setTransform(2, 0, 0, 2, 0, 0);
    PrototypeRenderer.drawCrownLoot(ink, { x: 14, y: 14 });
    $('hero-stats').style?.setProperty?.(
      '--hud-crown-image',
      'url("' + coin.toDataURL('image/png') + '")',
    );
  }
  prepareHudCrownCoin();
  const hudMarkup = new Map();
  function setMarkup(id, html) {
    if (hudMarkup.get(id) !== html) {
      $(id).innerHTML = html;
      hudMarkup.set(id, html);
    }
  }
  function updateHUD() {
    if (navigationGuide && navigationGuide.campaign !== game) navigationGuide = null;
    const devActive = started && game.s.mode === 'developer';
    developerSummonButton.hidden = !devActive;
    developerFinisherButton.hidden = !devActive;
    developerCombatMonitor.hidden = !devActive;
    developerCompanionMonitor.hidden = !devActive;
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
      const companionRows = game.developerCompanionSnapshot() || [];
      companionMonitorToggle.textContent = 'DEV · COMPANIONS (' + companionRows.length + ')';
      const body = companionRows.length
        ? companionRows.map((row) => row.name + ' [' + row.type + ' · ' + row.id + ']\n' +
            'Moves: ' + (row.last.map((m) =>
              m.name + ' ' + Math.round(m.damage)).join(' / ') || '—') +
            '\n5s DPS: ' + row.dps.toFixed(1)).join('\n\n')
        : 'No active companions.';
      if (companionMonitorContent.textContent !== body) {
        const previousScroll = companionMonitorContent.scrollTop;
        companionMonitorContent.textContent = body;
        companionMonitorContent.scrollTop = previousScroll;
      }
    }
    const h = game.hero,
      hp = Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100)),
      mp = manaEnabled ? Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100)) : 0;
    const adaptive = platform.mode === 'phone' && input.preferences.hudStyle === 'adaptive';
    const lowHP = adaptive && PrototypeInput.adaptiveHudLowHealth(h.hp, h.maxHp, adaptiveHudState?.lowHP);
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
      (h.class === 'rogue' ? rogueJingleIconSvg : Campaign.classes[h.class].icon) +
      ' ' +
      game.heroDisplayName() +
      '</span><small>' +
      (language === 'es' ? 'NIVEL ' : 'LEVEL ') +
      h.level +
      '</small></div><div class="resource-line health"><span class="health-readout"><span class="hp-count">HP ' +
      Math.ceil(h.hp) +
      ' / ' +
      h.maxHp +
      '</span><span class="hud-crowns" title="' +
      Math.floor(h.gold) +
      (language === 'es' ? ' coronas' : ' crowns') +
      '" aria-label="' +
      Math.floor(h.gold) +
      (language === 'es' ? ' coronas' : ' crowns') +
      '">' +
      Math.floor(h.gold).toLocaleString(language === 'es' ? 'es-ES' : 'en-US') +
      '</span></span><i style="--fill:' +
      hp +
      '%"></i>' +
      (lowHP
        ? '<small class="hud-low-health" aria-label="' +
          (language === 'es' ? 'Salud baja' : 'Low health') +
          '">! ' + (language === 'es' ? 'VIDA BAJA' : 'LOW HP') + '</small>'
        : '') +
      '</div>' +
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
        '<span class="hero-ailment" role="status" aria-label="' +
        (language === 'es' ? 'Ralentizado' : 'Slowed') +
        '">❄ ' + (language === 'es' ? 'LENTO' : 'SLOW') + ' · ' +
        h.slow.toFixed(1) + 's</span>';
    setMarkup('hero-stats', heroMarkup);
    if (
      statusUntil &&
      (performance.now() >= statusUntil ||
        (statusContext &&
          (statusContext.game !== game ||
            statusContext.zone !== game.zoneId ||
            statusContext.visit !== game.noticeVisit)))
    ) {
      $('status').textContent = '';
      statusUntil = 0;
    }
    const rangers = game.activeLivingParty().filter((u) => u.type === 'archer' && !u.charmOrigin);
    const healers = game.healCompanionCasters();
    $('quick-items').classList.toggle('has-rangers', healers.length > 0 || rangers.length > 0);
    for (const [type, label, key, cdKey, threshold] of manaEnabled
      ? [
          ['health', 'Heal', input.key('heal'), 'healCd', 50],
          ['mana', 'Mana Regen', input.key('mana'), 'manaCd', 35],
        ]
      : [['health', 'Heal', input.key('heal'), 'healCd', 50]]) {
      const b = $(type + '-potion'),
        queuedHeal = type === 'health' ? game.queuedRangerHeal() : null,
        casters = type === 'health' ? healers : rangers,
        ready = (type === 'health' ? game.availablePartyHealers() : game.availableRangers(type))
          .filter((u) => !game.mageSilenceActive(u)).length,
        full =
          type === 'health'
            ? [h, ...game.activeLivingParty()].every((u) => u.hp >= u.maxHp)
            : h.mp >= h.maxMp,
        next = casters.length ? Math.min(...casters.map((u) =>
          type === 'health' ? game.companionHealCooldown(u) : u[cdKey] || 0)) : 0;
      const recovering = type === 'mana' && game.hasSupportEffect(h, 'mana');
      const canQueueHeal = type === 'health' &&
        casters.some((u) => game.companionHealCooldown(u) > 0);
      b.disabled =
        !casters.length ||
        (!ready && !canQueueHeal && !queuedHeal) ||
        (full && !canQueueHeal && !queuedHeal) ||
        recovering;
      b.classList.toggle('support-queued', !!queuedHeal);
      b.setAttribute(
        'aria-label',
        tr((type === 'health' ? 'Command ' : 'Command Ranger ') + label) +
          (queuedHeal
            ? language === 'es'
              ? ' · Curación del héroe en cola'
              : ' · Hero heal queued'
            : ''),
      );
      b.hidden = platform.mode === 'phone' && !casters.length;
      setMarkup(
        type + '-potion',
        label +
          '<small><span class="key-hint">' +
          key +
          ' · </span>' +
          (queuedHeal
            ? (language === 'es' ? 'COLA ' : 'QUEUED ') +
              (queuedHeal.cooldown > 0
                ? cooldownText(queuedHeal.cooldown) + 's'
                : language === 'es'
                  ? 'esperando'
                  : 'waiting')
            : recovering
              ? 'Restoring'
              : ready
                ? ready + ' ready'
                : casters.length
                  ? next.toFixed(1) + 's'
                  : type === 'health' ? 'Need healer' : 'Need Ranger') +
          '</small>',
      );
      b.title =
        (type === 'health' ? 'Companion ' : 'Ranger ') +
        label +
        ' · ' +
        (type === 'health'
          ? 'restores ' + game.rangerSupportAmount(type) + ' HP to one injured ally · hero priority'
          : 'restores ' + game.rangerSupportAmount(type) + ' MP to the hero') +
        ' over five seconds · auto at ' +
        threshold +
        '% or less · 10-second cooldown belongs only to the companion who casts it' +
        (type === 'health' ? ' · Tap during cooldown to queue one Heal for the hero' : '');
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
        backlog = queuedCharges.forSlot(slot),
        queuedRequest = backlog[0],
        cast = charge?.slot === slot ? chargePresentation() : null,
        charging = !!cast;
      for (const request of backlog) syncQueuedInput(request);
      const backlogLabel = backlog
        .map((request, index) => index + 1 + '. ' + queuedSkillLabel(request))
        .join(' → ');
      b.disabled = false;
      b.classList.toggle('locked', !rank || b.disabled);
      b.classList.toggle('charging', charging);
      b.classList.toggle('skill-ready', !!rank && h.cd[i] <= 0 && !charging && !queuedRequest);
      b.classList.toggle('skill-queued', !!queuedRequest);
      b.dataset.queuedForm = queuedRequest ? (queuedRequest.charged ? 'charged' : 'normal') : '';
      const revealed = game.skillRevealed(slot),
        normalWait = h.cd[i] || 0,
        chargedWait = h.chargedCd?.[i] || 0,
        chargeTip = canChargeSlot(slot)
          ? ' · Tap under ' +
            chargeTapSeconds().toFixed(2) +
            's for normal · hold ' +
            chargeSeconds().toFixed(2) +
            's for charged' +
            (language === 'es'
              ? ' · La cargada inicia ambas recuperaciones; la normal vuelve antes'
              : ' · Charged starts both recoveries; Tap returns sooner without extending Charged') +
            ' · ' +
            (language === 'es' ? 'Normal ' : 'Tap ') +
            (normalWait > 0
              ? cooldownText(normalWait) + 's'
              : language === 'es'
                ? 'lista'
                : 'ready') +
            ' · ' +
            (language === 'es' ? 'Cargada ' : 'Charged ') +
            (Math.max(normalWait, chargedWait) > 0
              ? cooldownText(Math.max(normalWait, chargedWait)) + 's'
              : language === 'es'
                ? 'lista'
                : 'ready') +
            (language === 'es'
              ? ' · Toca para poner normal en cola; mantén brevemente para cargada'
              : ' · During cooldown: tap queues normal; briefly hold queues charged') +
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
          ? language === 'es'
            ? ' · Los ataques automáticos continúan durante la carga si el combate lo permite'
            : ' · Automatic basics continue during charge when combat allows'
          : '') +
        (slot === 2 ? ' · Charged target locks when charging begins' : '') +
        (backlogLabel ? ' · ' + backlogLabel : '') +
        (language === 'es' ? ' · Menú/Retirada: cancelar cola' : ' · Menu/Recall: clear queue');
      b.setAttribute(
        'aria-label',
        'Skill ' +
          slot +
          ' ' +
          (revealed ? skillLabel(slot) : 'Undiscovered') +
          (canChargeSlot(slot)
            ? (language === 'es'
                ? ' · Toca para normal, mantén para cargar'
                : ' · tap for normal or hold to charge') +
              (language === 'es' ? ' · Normal ' : ' · Tap ') +
              (normalWait > 0
                ? cooldownText(normalWait) + 's'
                : language === 'es'
                  ? 'lista'
                  : 'ready') +
              (language === 'es' ? ' · Cargada ' : ' · Charged ') +
              (Math.max(normalWait, chargedWait) > 0
                ? cooldownText(Math.max(normalWait, chargedWait)) + 's'
                : language === 'es'
                  ? 'lista'
                  : 'ready')
            : '') +
          (queuedRequest ? ' · ' + backlogLabel : ''),
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
            ? queuedSkillLabel(queuedRequest).replace(' ', '\n') +
              ' ' +
              cooldownText(cast.cooldown) +
              's'
            : cast.state === 'interrupted'
              ? 'BROKEN'
              : cast.state === 'charging'
                ? (queuedRequest ? (language === 'es' ? 'CARGADA\n' : 'CHARGED\n') : '') +
                  Math.min(99, Math.round(cast.progress * 100)) +
                  '%'
                : cast.state === 'need-mp'
                  ? 'NEED MP'
                  : cast.state === 'no-target'
                    ? 'NO TARGET'
                    : cast.state === 'no-heal'
                      ? 'NO HEAL'
                      : cast.state === 'no-allies'
                        ? 'NO ALLIES'
                        : 'CHARGED'
          : queuedCharges.has(slot)
            ? queuedSkillLabel(queuedRequest).replace(' ', '\n') +
              ' ' +
              cooldownText(Math.max(h.cd[i], queuedRequest?.charged ? chargedWait : 0)) +
              's'
            : slot === 3 && h.class === 'paladin' && h.shieldStance > 0
              ? 'SHIELD ' + cooldownText(h.shieldStance)
              : !rank
                ? 'Locked'
                : h.cd[i] > 0
                  ? cooldownText(h.cd[i])
                  : chargedWait > 0
                    ? skillKeys()[i] + ' C' + cooldownText(chargedWait)
                    : skillKeys()[i];
      if (backlog.length > 1)
        b.querySelector('small').textContent +=
          '\n' + backlog.map((r, index) => index + 1 + (r.charged ? 'C' : 'N')).join(' → ');
      b.dataset.queue = backlog.map((r) => (r.charged ? 'charged' : 'normal')).join(',');
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
      mapKeyHint() +
      ' · ' +
      tr('Map') +
      '   Esc · ' +
      tr('Menu');
    $('talent-button').querySelector('small').textContent = input.key('training');
    if ($('squad-button').querySelector('small'))
      $('squad-button').querySelector('small').textContent = input.key('doctrine');
    if (recallPractice && recallPractice.owner !== game) recallPractice = null;
    const practicingRecall = !!recallPractice;
    $('recall-button').classList.toggle('tutorial-highlight', practicingRecall);
    $('recall-button').setAttribute(
      'aria-label',
      tr(practicingRecall ? 'Try Recall now' : 'Recall squad'),
    );
    if ($('recall-button').querySelector('small'))
      $('recall-button').querySelector('small').textContent =
        (practicingRecall ? tr('Try it now') + ' · ' : '') +
        input.key('recall') +
        (input.actionFor('KeyQ') === 'recall' ? ' / Q' : '');
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
    const navigating = visibleNavigationRoute();
    cancelNavigationButton.hidden = !navigating;
    if (adaptive) {
      // One bounded snapshot during the existing 150ms HUD update, never per render.
      const nearby = (entity, distance) =>
        entity && Number.isFinite(entity.x) && Number.isFinite(entity.y) &&
        Math.abs(entity.x - h.x) < distance && Math.abs(entity.y - h.y) < distance;
      const zone = game.zone();
      const threat = zone.enemies.some((enemy) =>
        enemy.hp > 0 && !enemy.neutral &&
        (enemy.aggro || enemy.telegraph || enemy.rangedAim) && nearby(enemy, 850));
      const projectile = game.s.projectiles.some((p) => p.source === 'enemy' && nearby(p, 850));
      const hazard = game.s.hazards.some((a) => a.source === 'enemy' && nearby(a, 650));
      adaptiveHudState = PrototypeInput.adaptiveHudPresentation({
        hp: h.hp, maxHp: h.maxHp, threat, projectile, hazard,
        target: !!selected, targetLocked: !!selected && !!game.manualHeroTargetLocked,
        charging: !!charge, queued: queuedCharges.size > 0, targetPress: !!targetPress,
        tutorialRecall: practicingRecall, interactable: !!n, navigation: navigating,
        moving: !!(joy.x || joy.y || keys.up || keys.down || keys.left || keys.right),
        menu: !!menu || paused || !activePlay(),
      }, adaptiveHudState, performance.now());
      const attrs = {
        hudContext: adaptiveHudState.context,
        hudPressure: adaptiveHudState.pressure ? 'high' : 'quiet',
        hudLowHp: adaptiveHudState.lowHP ? 'true' : 'false',
        hudTarget: adaptiveHudState.target ? 'active' : 'quiet',
        hudRecall: adaptiveHudState.recall ? 'active' : 'quiet',
      };
      for (const [name, value] of Object.entries(attrs))
        if (document.body.dataset[name] !== value) document.body.dataset[name] = value;
    } else adaptiveHudState = null;
    cancelNavigationButton.textContent = tr('Cancel navigation');
    cancelNavigationButton.setAttribute('aria-label', tr('Cancel navigation'));
    updateCriticalNotice();
  }
  // Idle probes are rate-limited but successful basic attacks keep native cadence.
  let nextAutoBasicProbeAt = 0;
  let emergencyShown = false;
  // Preserve the abnormal-session marker through a critical freeze, even if
  // a delayed blur/pagehide event eventually fires during the shutdown.
  let crashRecoveryPending = false;
  const rescueEscalation = {
    entries: [],
    phase: 0,
    beganAt: null,
    resetAt: null,
    lastHealthyAt: null,
  };
  function clearEmergencyEscalation() {
    rescueEscalation.entries = [];
    rescueEscalation.phase = 0;
    rescueEscalation.beganAt = null;
    rescueEscalation.resetAt = null;
    rescueEscalation.lastHealthyAt = null;
  }
  function emergencyRecoveryDecision(now, recovering, simulating) {
    const e = rescueEscalation;
    e.entries = e.entries.filter((stamp) => now - stamp < 20000);
    if (recovering && !emergencyShown) {
      e.entries.push(now);
      e.beganAt = now;
    }
    if (recovering) {
      // A persistent near-freeze or repeated failed releases justifies
      // intervention. A single spike never resets a legitimate encounter.
      if (e.phase === 0 && (now - e.beganAt >= 5000 || e.entries.length >= 3)) {
        game.partyDiagnosticsRecoveryAction('encounter-reset-attempt');
        const reset = game.emergencyResetEncounter();
        // A critical freeze can also happen without engaged enemies (terrain,
        // GPU/driver trouble, huge scenery). No enemy reset is possible then,
        // but prolonged failure must still reach the refuge fallback.
        e.phase = 1;
        e.resetAt = now;
        if (reset) status('Critical slowdown: enemies disengaged and companions are withdrawing.');
      } else if (e.phase === 1) {
        game.emergencyAdvanceWithdrawal();
        const repeated = e.entries.filter((stamp) => stamp >= e.resetAt).length >= 2;
        if (now - e.resetAt >= 8000 || repeated) {
          game.partyDiagnosticsRecoveryAction('refuge-return-attempt');
          if (game.emergencyReturnToSafety()) {
            e.phase = 2;
            if (save()) restartGuard.arm(game);
            frameSkip.suspend();
            status('Critical slowdown persists: returned to your recovery point without a defeat.');
          }
        }
      }
      e.lastHealthyAt = null;
    } else if (simulating) {
      e.beganAt = null;
      e.lastHealthyAt ??= now;
      if (now - e.lastHealthyAt >= 20000) clearEmergencyEscalation();
    } else {
      // User-initiated pause, modal, unfocused window and interrupted
      // simulation should not accumulate wall time toward a forced relocation.
      clearEmergencyEscalation();
    }
  }
  // Sample only exceptional callbacks. No GPS, map lookups, canvas readback,
  // saved-run mutation, per-frame world scan or new player interaction.
  function slowdownLocation(events) {
    const h = game.hero, z = game.zone(),
      x = Math.round(h.x), y = Math.round(h.y), r2 = 420 * 420,
      nearby = (units) => (units || []).filter((u) =>
        Number.isFinite(u.x) && Number.isFinite(u.y) &&
        (u.x - x) ** 2 + (u.y - y) ** 2 <= r2);
    const enemies = nearby(z?.enemies).filter(e => e.hp > 0),
      activeAllies = (game.s.party || []).filter(u => u.active !== false && u.hp > 0),
      enemyTypes = {};
    for (const e of enemies) {
      const kind = String(e.species || e.type || 'unknown').slice(0, 32);
      if (Object.keys(enemyTypes).length < 8 || Object.hasOwn(enemyTypes, kind))
        enemyTypes[kind] = (enemyTypes[kind] || 0) + 1;
    }
    const eventTypes = {};
    for (const e of events || []) {
      const kind = String(e.type || 'unknown').slice(0, 32);
      if (Object.keys(eventTypes).length < 8 || Object.hasOwn(eventTypes, kind))
        eventTypes[kind] = (eventTypes[kind] || 0) + 1;
    }
    return {
      zone: game.zoneId, gameSeconds: Math.round(game.s.time * 10) / 10,
      heroX: x, heroY: y, gridSize: 256,
      gridX: Math.floor(x / 256), gridY: Math.floor(y / 256),
      heroClass: h.class, heroMoving: !!(h.order || joy.x || joy.y ||
        keys.left || keys.right || keys.up || keys.down),
      engaged: !!game.s.squadEngagement, activeAllies: activeAllies.length,
      charmedAllies: activeAllies.filter(u => !!u.charmOrigin).length,
      activeEnemyCount: (z?.enemies || []).filter(e => e.hp > 0).length,
      nearbyRadius: 420, nearbyEnemyCount: enemies.length,
      nearbyEngagedEnemies: enemies.filter(e => !!e.aggro).length,
      nearbyEnemyKinds: enemyTypes,
      nearbyProps: nearby(z?.props).length,
      nearbyBuildings: nearby(z?.buildings).length,
      nearbyNpcs: nearby(z?.npcs).length,
      nearbyHazards: nearby(game.s.hazards).length,
      nearbyProjectiles: nearby(game.s.projectiles).length,
      eventKinds: eventTypes,
    };
  }
  function frame(now) {
    if (!started || sceneTransition) {
      last = now;
      clearEmergencyEscalation();
      frameSkip.suspend();
      requestAnimationFrame(frame);
      return;
    }
    if (persistence.conflicted(game.s.mode) && menu?.view !== 'save-conflict')
      savedRunConflictMenu();
    if (document.hidden) {
      clearEmergencyEscalation();
      frameSkip.suspend();
      autoOptimization.reset();
      renderResolution.suspend();
      runtime.suspend();
      fps.suspend();
      emergencyShown = false;
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    // A failed confirmed renderer remains the preference, but Canvas draws
    // until a safe and bounded recovery succeeds.
    void graphicsController.maybeRecover?.();
    const frameStart = performance.now();
    const intervalMs = now - last;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const frozen =
      !writerGuard.canWrite() ||
      persistence.conflicted(game.s.mode) ||
      graphicsController?.status().phase === 'preparing' ||
      paused ||
      menu ||
      !focused ||
      document.hidden ||
      game.s.challenge.pending ||
      game.s.challenge.gameOver;
    const recovering = !frozen && frameSkip.beginFrame(now, intervalMs);
    if (!frozen)
      game.partyDiagnosticsObserveEmergency(
        recovering, intervalMs, frameSkip.status().emergencyEntries,
      );
    if (recovering) {
      crashRecoveryPending = true;
      // Act before further expensive rendering; never require the player to
      // reach Settings while hostile simulation is critically stalled.
      if (!optimizationMode) {
        const override = autoOptimization.observe(now, {
          activePlay: true, emergency: true,
          preference: optimizationPreference, optimized: optimizationMode,
        });
        if (override === true) setOptimizationActive(true);
      }
    }
    const simulating = !frozen && !recovering;
    emergencyRecoveryDecision(now, recovering, simulating);
    const emergencyEntered = recovering && !emergencyShown;
    if (recovering !== emergencyShown) {
      emergencyShown = recovering;
      status(
        recovering
          ? 'Critical slowdown: combat paused while performance recovers. You can lower graphics in Settings.'
          : 'Performance recovered: combat resumed.',
      );
    }
    // Keep the combat charge clock paused together with the simulation.
    syncPartyChargeClock();
    if (typeof PrototypeSprites !== 'undefined') PrototypeSprites.advance(dt * 1000, !simulating);
    if (simulating) progressTargetPress();
    if (menu) {
      menuJoyTime -= dt;
      if (Math.abs(joy.y) > 0.4 && menuJoyTime <= 0 && buttons.length) {
        menuIndex = (menuIndex + (joy.y > 0 ? 1 : -1) + buttons.length) % buttons.length;
        highlight(true);
        menuJoyTime = 0.3;
      }
    }
    const stageTimes = !frozen
      ? {
          simulationMs: 0,
          companionAIMs: 0,
          companionGuidanceMs: 0,
          companionSetupMs: 0,
          companionUnitsMs: 0,
          companionBookkeepingMs: 0,
          enemyAIMs: 0,
          hudMs: 0,
          audioUpdateMs: 0,
          eventDispatchMs: 0,
          renderMs: 0,
          pixiMs: 0,
          canvasOverlayMs: 0,
          canvasWorldMs: 0,
          pixiAttempted: false,
          canvasOverlayDrawn: false,
          canvasWorldDrawn: false,
        }
      : null;
    const audioAt = stageTimes ? performance.now() : 0;
    audio.update(game, paused || !focused || document.hidden || recovering, {
      menu: !!menu,
      backgrounded: !focused || document.hidden,
      paused: paused || recovering,
      started,
    });
    if (stageTimes) stageTimes.audioUpdateMs = performance.now() - audioAt;
    if (simulating) {
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
      const simulationAt = performance.now(),
        marks = {};
      game.crowdDiagnosticsBeginFrame();
      game.tick(dt, {
        x,
        y,
        speedFactor,
        performanceMark: (stage) => {
          marks[stage] = performance.now();
        },
      });
      game.crowdDiagnosticsEndFrame();
      game.partyDiagnosticsObserveTick();
      stageTimes.simulationMs = performance.now() - simulationAt;
      if (marks.partyStart !== undefined && marks.partyEnd !== undefined)
        stageTimes.companionAIMs = Math.max(0, marks.partyEnd - marks.partyStart);
      if (marks.partyStart !== undefined && marks.partyGuidanceEnd !== undefined)
        stageTimes.companionGuidanceMs = Math.max(0, marks.partyGuidanceEnd - marks.partyStart);
      if (marks.partyGuidanceEnd !== undefined && marks.partySetupEnd !== undefined)
        stageTimes.companionSetupMs = Math.max(0, marks.partySetupEnd - marks.partyGuidanceEnd);
      if (marks.partySetupEnd !== undefined && marks.partyUnitsEnd !== undefined)
        stageTimes.companionUnitsMs = Math.max(0, marks.partyUnitsEnd - marks.partySetupEnd);
      if (marks.partyUnitsEnd !== undefined && marks.partyBookkeepingEnd !== undefined)
        stageTimes.companionBookkeepingMs = Math.max(0, marks.partyBookkeepingEnd - marks.partyUnitsEnd);
      if (marks.partyEnd !== undefined && marks.enemyEnd !== undefined)
        stageTimes.enemyAIMs = Math.max(0, marks.enemyEnd - marks.partyEnd);
      if (marks.enemyExtraStart !== undefined && marks.enemyExtraEnd !== undefined)
        stageTimes.enemyAIMs += Math.max(0, marks.enemyExtraEnd - marks.enemyExtraStart);
      selectQueuedCharge();
      updateQuestGuide();
      updateNavigationGuide();
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
      releaseQueuedCharge();
      if (
        game.s.mode !== 'developer' &&
        true &&
        game.hero === movingHero &&
        PrototypeRules.movementBasicClasses[movingHero.class] &&
        game.zoneId === was.zone &&
        game.s.statistics.deaths === was.deaths &&
        game.hero.basicCd <= 0 &&
        now >= nextAutoBasicProbeAt
      )
        nextAutoBasicProbeAt = game.castMovementBasic() ? now : now + 100;
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
    const eventAt = stageTimes ? performance.now() : 0;
    const events = game.effects.splice(0);
    if (effectRecording && game.s.mode !== 'developer') {
      effectRecording = false;
      renderer.setEffectDiagnostics(false);
    }
    renderer.queue(events);
    renderer.update(simulating ? dt : 0);
    for (const e of events) {
      audio.effect(e);
      if (e.type === 'chargeInterrupted' && e.target === 'hero')
        status('Charged skill interrupted.');
      if (e.type === 'hawkRetreatInterrupted')
        status(language === 'es' ? 'Retirada interrumpida.' : 'Retreat interrupted.');
      if (e.type === 'actionFailed' && e.reason === 'crowns')
        status('Need ' + e.needed + ' crowns.');
    }
    if (stageTimes) stageTimes.eventDispatchMs = performance.now() - eventAt;
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
          'companionRecruitment',
          'companionRecovery',
          'companionQueueChanged',
          'rogueCharmSlotPolicyChanged',
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
    if (simulating) hudTimer += dt;
    if (hudTimer > 0.15) {
      hudTimer = 0;
      const hudAt = stageTimes ? performance.now() : 0;
      updateHUD();
      if (stageTimes) stageTimes.hudMs = performance.now() - hudAt;
    }
    if (!frozen) {
      // Combat cues keep advancing; drawing eligibility never depends on warnings.
      const eligibleDraw = fps.shouldDraw(now);
      const adaptiveSkipped = eligibleDraw && frameSkip.shouldSkip(now, fps.target);
      const draw = eligibleDraw && !adaptiveSkipped;
      if (effectRecording) renderer.noteEffectDrawDecision(eligibleDraw, adaptiveSkipped);
      if (draw) {
        let drawTiming;
        const sample = runtime.record(now, frameStart, () => {
          drawTiming = drawWorld();
        });
        stageTimes.renderMs += sample.renderMs;
        addRenderStageTimes(stageTimes, drawTiming);
        if (renderResolution.observe(now, sample.renderMs, fps.target, sample.preRenderMs)) {
          resize();
          const redrawAt = performance.now();
          const redrawTiming = drawWorld();
          stageTimes.renderMs += performance.now() - redrawAt;
          addRenderStageTimes(stageTimes, redrawTiming);
          runtime.reset();
          frameProfile.reset();
          fps.suspend();
        }
      }
      fps.observe(now, performance.now() - frameStart, draw, adaptiveSkipped);
      const frameWorkMs = performance.now() - frameStart;
      if (effectRecording)
        renderer.noteEffectFrame({
          gameTime: game.s.time,
          intervalMs,
          frameWorkMs,
          simulationMs: stageTimes.simulationMs,
          renderMs: stageTimes.renderMs,
          drawn: draw,
          simulating,
          recovering,
          fpsLimited: !eligibleDraw,
          adaptiveSkipped,
        });
      frameSkip.observe(now, frameWorkMs, stageTimes.renderMs, draw);
      const optimizationDecision = autoOptimization.observe(now, {
        activePlay: simulating || recovering,
        emergency: recovering || frameSkip.emergency,
        preference: optimizationPreference, optimized: optimizationMode,
        intervalMs, workMs: frameWorkMs, adaptiveSkipped, target: fps.target,
      });
      if (game.s.mode === 'arena') {
        if (!optimizationMode) setOptimizationActive(true);
      } else if (optimizationDecision !== null) setOptimizationActive(optimizationDecision);
      const otherSimulationMs = Math.max(
          0,
          stageTimes.simulationMs - stageTimes.companionAIMs - stageTimes.enemyAIMs,
        ),
        accounted =
          stageTimes.simulationMs +
          stageTimes.hudMs +
          stageTimes.audioUpdateMs +
          stageTimes.eventDispatchMs +
          stageTimes.renderMs;
      frameProfile.record({
        ...stageTimes,
        emergencyEntered,
        location: frameWorkMs >= 50 || intervalMs >= 120 || emergencyEntered
          ? slowdownLocation(events) : null,
        // Only event categories, never object payloads or character names.
        // Retain the preceding callback's activity to help explain a later gap.
        recentEventKinds: events.length
          ? events.slice(0, 12).map(e => String(e.type || 'unknown').slice(0, 32))
          : null,
        otherSimulationMs,
        frameWorkMs,
        intervalMs,
        otherJsMs: Math.max(0, frameWorkMs - accounted),
        drawn: draw,
        adaptiveSkipped,
      });
      if (simulating || recovering)
        noteRendererRecordingFrame(stageTimes, frameWorkMs, intervalMs,
          draw, recovering, adaptiveSkipped);
    } else {
      frameSkip.suspend();
      autoOptimization.reset();
      emergencyShown = false;
      renderResolution.suspend();
      fps.suspend();
      runtime.suspend();
      if (runtime.shouldDrawIdle(now)) drawWorld();
    }
    // Only a successfully completed ordinary simulation frame clears the
    // critical-recovery marker. Stale image probes alone cannot certify it.
    if (simulating) crashRecoveryPending = false;
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
    frameProfile.reset();
    fps.suspend();
  });
  titleScreen = $('title-screen');
  const titleCanvasContinue = document.createElement('button');
  titleCanvasContinue.type = 'button';
  titleCanvasContinue.hidden = true;
  titleCanvasContinue.style.cssText =
    'position:fixed;bottom:max(16px,env(safe-area-inset-bottom));' +
    'left:50%;transform:translateX(-50%);z-index:12;' +
    'min-height:44px;padding:10px 18px;' +
    'border:1px solid #dfc78f;border-radius:8px;background:#385c4b;' +
    'color:#fff4d8;font:600 14px sans-serif;cursor:pointer';
  titleScreen.append(titleCanvasContinue);
  titleCanvasContinue.onclick = () => {
    if (!titleLoading || !titleSkipGraphics) return;
    titleSkipGraphics.skipped = true;
    graphicsController.revert();
    titleSkipGraphics.resolve(false);
    titleCanvasContinue.hidden = true;
  };
  $('title-continue').onclick = enterPreparedScene;
  $('title-new').onclick = newGameMenu;
  $('title-saves').onclick = titleSaveMenu;
  $('title-settings').onclick = systemMenu;
  $('title-help').onclick = titleHelpMenu;
  $('scene-loading-retry').onclick = () => {
    const ticket = sceneTransition;
    if (!ticket) return;
    ticket.skipped = true;
    graphicsController.revert();
    ticket.resolveSkip?.(false);
    $('scene-loading-retry').hidden = true;
    // Awaiting preflight, decoded art or GPU upload is released by skipPromise.
    // If a draw actually failed, try drawing the committed scene with Canvas.
    if (ticket.drawFailed)
      requestAnimationFrame(() => revealSceneTransition(ticket.token));
  };
  updateHUD();
  setLanguage(language);
  showTitleScreen();
  if (loaded && (performanceBaselineUpgraded || optimizationAutoUpgraded) && !recoveredOnStartup)
    status(
      performanceBaselineUpgraded
        ? 'Performance settings updated to recommended defaults. You can change them in Settings.'
        : 'Optimization Mode now defaults to Auto. You can change it in Settings.',
    );
  requestAnimationFrame(frame);
  if (writerGuard.pending)
    writerGuard.ready
      .then((state) => {
        if (state !== 'owner') {
          savedRunConflictMenu();
          return;
        }
        // Ownership may arrive after a previous window's final save. Read fresh
        // bytes before allowing input, recovery or any automatic write.
        profile = persistence.loadProfile(profile);
        let refreshed = combatDiagnosticsEnabled
          ? persistence.load('arena')
          : (developerEnabled && persistence.load('developer')) ||
            persistence.load(profile.activeMode);
        if (
          !refreshed &&
          !combatDiagnosticsEnabled &&
          !persistence.loadFailed(profile.activeMode) &&
          !persistence.exists('normal') &&
          !persistence.exists('nightmare')
        ) {
          refreshed = persistence.migrateLegacy();
          if (refreshed) {
            persistence.writeCandidate(refreshed);
            profile.activeMode = refreshed.s.mode;
          }
        }
        if (refreshed) {
          game = activateLiveCritical(refreshed);
          if (game.s.mode === 'arena') {
            graphicsController.revert();
            setOptimizationActive(true);
            resize();
          }
          loaded = true;
          started = false;
          reconcileProfileEntitlements();
          if (
            menu?.view === 'save-conflict' ||
            menu?.view === 'save-recovery' ||
            menu?.title === 'Choose your language'
          )
            closeMenu();
        } else if (persistence.loadFailed(combatDiagnosticsEnabled ? 'arena' : profile.activeMode)) {
          loaded = started = false;
          showTitleScreen();
        } else {
          loaded = started = false;
          game = activateLiveCritical(new Campaign());
          showTitleScreen();
        }
        updateHUD();
        refreshTitleScreen();
      })
      .catch(() => {
        writerGuard.release();
        status('Saving failed. Export your run before closing.');
        savedRunConflictMenu();
      });
  else if (!writerGuard.canWrite()) savedRunConflictMenu();
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  addEventListener('appinstalled', () => {
    installPrompt = null;
    status('Game installed. Open it from your home screen.');
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (appControllerReloaded) return;
      if (hadServiceWorkerController) {
        appReloadRequested = false;
        appControllerReloaded = true;
        if (started && writerGuard.canWrite() && !save()) {
          appControllerReloaded = false;
          status('Saving failed. Export your run before closing.');
          return;
        }
        location.reload();
      } else hadServiceWorkerController = true;
    });
  }
  // This is the sole entry to the interactive title. The preflight finishes
  // first; a pending update silently reloads into its own complete new shell.
  void initializeStartupUpdate();
})();
