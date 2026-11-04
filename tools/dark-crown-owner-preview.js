/* Dark Crown owner's standalone review UI. This file is NOT in the public game.
 * All jumps go through the native Campaign.enter() and developer-mode v4 save.
 * The original app's menu is used to PAUSE gameplay while browsing.
 */
(function (root) {
  'use strict';
  const groups = [
    { id: 'city', en: 'City and neighborhoods', es: 'Ciudad y vecindarios', places: [
      ['arrival', 'Crownwatch arrival', 'Llegada a Crownwatch', 'crown', 690, 430,
        'Begin with the approach and the first impression of the capital.', 'Empieza por el acceso y la primera impresión de la capital.'],
      ['civic', 'Civic hall and square', 'Salón cívico y plaza', 'crown', 600, 550,
        'Inspect civic architecture, lanterns, shops and public space.', 'Observa la arquitectura, los faroles, los comercios y la plaza.'],
      ['ash', 'Ash Refuge', 'Refugio de Ceniza', 'crown', 1030, 1840,
        'Look for a distinct residential and artisan neighborhood.', 'Busca una identidad propia para el barrio de viviendas y artesanos.'],
      ['market', 'Market and freight', 'Mercado y carga', 'crown', 850, 1400,
        'Inspect stalls, receiving areas and pedestrian access.', 'Observa los puestos, las entregas y los pasos peatonales.']
    ]},
    { id: 'routes', en: 'Crossings and roads', es: 'Puentes y caminos', places: [
      ['bridge-north', 'North lava bridge', 'Puente norte de lava', 'crown', 1350, 1000,
        'Walk to both banks and judge the scale of the crossing.', 'Camina hacia ambas orillas y valora la escala del puente.'],
      ['bridge-south', 'South lava bridge', 'Puente sur de lava', 'crown', 1350, 2400,
        'Inspect the second original bridge and its road approaches.', 'Observa el segundo puente original y sus accesos.']
    ]},
    { id: 'industry', en: 'Industry and production', es: 'Industria y producción', places: [
      ['heat', 'Eastern geothermal works', 'Instalaciones geotérmicas', 'crown', 2835, 770,
        'Examine the heatworks layout, lava and industrial atmosphere.', 'Examina la distribución industrial, la lava y el ambiente.'],
      ['glass', 'Glass and ceramics', 'Vidrio y cerámica', 'crown', 2355, 2180,
        'Look for a readable sequence of materials and workshops.', 'Busca un recorrido claro entre materiales y talleres.'],
      ['foundry-out', 'Foundry exterior', 'Exterior de la fundición', 'crown', 1915, 2755,
        'Judge the defended workshop exterior and the arrival route.', 'Valora el exterior protegido y su camino de acceso.'],
      ['foundry-in', 'Foundry interior', 'Interior de la fundición', 'side-crown-foundry', null, null,
        'Danger: 14 hostile guards. The unfinished human-work props are still visible.', 'Peligro: 14 guardias hostiles. Aún se ven figuras de trabajadores provisionales.', 'danger']
    ]},
    { id: 'landmarks', en: 'Power and landmarks', es: 'Poder y lugares emblemáticos', places: [
      ['ministry', 'Cindermaw ministry', 'Ministerio de Cindermaw', 'crown', 1100, 285,
        'Inspect official presence and the surrounding district.', 'Observa la presencia oficial y el distrito cercano.'],
      ['den', 'Cindermaw den', 'Guarida de Cindermaw', 'crown', 2580, 1900,
        'Danger: hostile creature territory. Compare it with the ministry.', 'Peligro: territorio de criaturas hostiles. Compáralo con el ministerio.', 'danger'],
      ['crystal', 'Crystal source and dispatch', 'Cristales y despacho', 'crown', 1195, 2675,
        'Look for evidence of secure sorting, storage and transport.', 'Busca indicios de clasificación, almacén y transporte.'],
      ['orrery', 'Bronze survey orrery', 'Planetario de bronce', 'crown', 1940, 3150,
        'Inspect the instrument and its civic setting.', 'Observa el instrumento y su entorno público.'],
      ['fortress', 'Fortress approach', 'Acceso a la fortaleza', 'crown', 3060, 3040,
        'Walk toward the fortress; judge defenses and logistics.', 'Acércate a la fortaleza y valora las defensas y la logística.'],
      ['citadel-in', 'Citadel interior', 'Interior de la ciudadela', 'citadel', null, null,
        'Danger: this is the combat interior, not an exterior academy.', 'Peligro: este es el interior de combate, no la academia exterior.', 'danger']
    ]}
  ];
  const $ = (id) => document.getElementById(id);
  const spanish = () => document.documentElement.lang.toLowerCase().startsWith('es');
  const t = (en, es) => spanish() ? es : en;
  const node = (tag, className, content) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content != null) el.textContent = content;
    return el;
  };
  const entries = groups.flatMap((group) => group.places.map((place) => ({ group, place })));
  const history = [];
  let category = 'all', menuOwned = false, lastVisited = null;
  const launcher = node('button', 'crown-review-launcher');
  launcher.id = 'crown-review-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');
  const backdrop = node('div', 'crown-review-backdrop');
  backdrop.id = 'crown-review-backdrop';
  backdrop.hidden = true;
  const dialog = node('section', 'crown-review-dialog');
  dialog.id = 'crown-review-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'crown-review-title');
  const header = node('header', 'crown-review-header');
  const headings = node('div', 'crown-review-headings');
  const eyebrow = node('p', 'crown-review-eyebrow');
  const title = node('h2', '');
  title.id = 'crown-review-title';
  const subtitle = node('p', 'crown-review-subtitle');
  headings.append(eyebrow, title, subtitle);
  const closeButton = node('button', 'crown-review-close', '×');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close exploration guide');
  header.append(headings, closeButton);
  const main = node('div', 'crown-review-main');
  const current = node('p', 'crown-review-current');
  current.id = 'crown-review-current';
  const search = node('input', 'crown-review-search');
  search.id = 'crown-review-search';
  search.type = 'search';
  search.autocomplete = 'off';
  search.setAttribute('aria-label', 'Find a destination');
  const categories = node('div', 'crown-review-categories');
  categories.setAttribute('role', 'group');
  categories.setAttribute('aria-label', 'Destination categories');
  const results = node('div', 'crown-review-results');
  const empty = node('p', 'crown-review-empty');
  empty.hidden = true;
  const feedback = node('p', 'crown-review-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  main.append(current, search, categories, feedback, results, empty);
  const footer = node('footer', 'crown-review-footer');
  const backButton = node('button', 'crown-review-back');
  backButton.id = 'crown-review-back';
  backButton.type = 'button';
  const doneButton = node('button', 'crown-review-done');
  doneButton.type = 'button';
  footer.append(backButton, doneButton);
  dialog.append(header, main, footer);
  backdrop.append(dialog);
  document.body.append(launcher, backdrop);

  // Preview-scoped bridge to the landscape-only phone contract in draft #793.
  // The main game's Stage 3 orientation guard is NOT merged yet. Do not try
  // screen.orientation.lock() or rotate the Canvas: show a neutral blocker and
  // own the native pause menu only when the game had no menu open already.
  const rotate = node('section', 'crown-review-rotate');
  rotate.id = 'crown-review-rotate';
  rotate.hidden = true;
  rotate.tabIndex = -1;
  rotate.setAttribute('role', 'alertdialog');
  rotate.setAttribute('aria-modal', 'true');
  rotate.setAttribute('aria-labelledby', 'crown-review-rotate-title');
  const rotateCard = node('div', 'crown-review-rotate-card');
  const rotateIcon = node('span', 'crown-review-rotate-icon', '↻');
  rotateIcon.setAttribute('aria-hidden', 'true');
  const rotateHeading = node('h2', '', 'Rotate your phone / Gira tu teléfono');
  rotateHeading.id = 'crown-review-rotate-title';
  const rotateText = node('p', '',
    'This review is designed for landscape. Turn your phone sideways to continue. ' +
    'Esta vista está diseñada para horizontal. Gira el teléfono para continuar.');
  rotateCard.append(rotateIcon, rotateHeading, rotateText);
  rotate.append(rotateCard);
  document.body.append(rotate);
  let rotationOwnsMenu = false;
  let rotationPreviousFocus = null;
  function portraitPhone() {
    // Device experience, not a narrow desktop window or virtual keyboard.
    return root.Prototype?.platform?.mode === 'phone' &&
      !!root.matchMedia?.('(orientation: portrait)').matches &&
      root.innerHeight > root.innerWidth;
  }
  function syncPhoneOrientation() {
    if (!portraitPhone()) {
      if (rotate.hidden) return;
      rotate.hidden = true;
      document.body.classList.remove('crown-review-orientation-blocked');
      document.body.append(rotate);
      if (rotationOwnsMenu) {
        rotationOwnsMenu = false;
        root.Prototype?.closeMenu();
      }
      if (!backdrop.hidden) closeButton.focus({ preventScroll: true });
      else if (rotationPreviousFocus?.isConnected) rotationPreviousFocus.focus({ preventScroll: true });
      rotationPreviousFocus = null;
      return;
    }
    if (!rotate.hidden) return;
    rotationPreviousFocus = document.activeElement;
    const api = root.Prototype;
    const modal = $('modal');
    if (api?.started && modal?.hidden && !menuOwned) {
      api.openMenu('Owner preview · rotate phone', '', [], () => {});
      rotationOwnsMenu = true;
    }
    // A guide, settings panel, or owned orientation pause all use the *real*
    // native modal. Mount inside it so outside-tap dismissal cannot unpause.
    if (modal && !modal.hidden) modal.append(rotate);
    else document.body.append(rotate);
    rotate.hidden = false;
    document.body.classList.add('crown-review-orientation-blocked');
    rotate.focus({ preventScroll: true });
  }

  function available() {
    const api = root.Prototype;
    return !!(api?.started && !api.sceneLoading && api.game?.s.mode === 'developer');
  }
  function localize() {
    launcher.textContent = t('Explore Dark Crown', 'Explorar Corona Oscura');
    eyebrow.textContent = t('UNRELEASED · OWNER PREVIEW', 'SIN PUBLICAR · VISTA DEL CREADOR');
    title.textContent = t('Explore Dark Crown', 'Explorar Corona Oscura');
    subtitle.textContent = t('Pick an area, look around, and return here whenever you like.',
      'Elige una zona, explórala y vuelve a esta guía cuando quieras.');
    closeButton.setAttribute('aria-label', t('Close guide', 'Cerrar guía'));
    search.placeholder = t('Search 16 places…', 'Buscar entre 16 lugares…');
    search.setAttribute('aria-label', t('Search destinations', 'Buscar destinos'));
    doneButton.textContent = t('Continue exploring', 'Seguir explorando');
    backButton.textContent = t('Return to previous spot', 'Volver al lugar anterior');
    categories.setAttribute('aria-label', t('Destination categories', 'Categorías de destinos'));
  }
  function showCurrent() {
    const game = root.Prototype?.game;
    if (!available()) {
      current.textContent = t('To start: New Game → Developer Mode → choose your hero. No existing Normal save is replaced.',
        'Para empezar: Nueva partida → modo Desarrollador → elige tu héroe. No se reemplaza tu partida Normal.');
      return;
    }
    current.textContent = lastVisited
      ? t('Last stop: ', 'Última parada: ') + t(lastVisited[1], lastVisited[2]) +
        t(' · Game paused while this guide is open.', ' · El juego está en pausa mientras esta guía esté abierta.')
      : t('Ready to explore. Your game is paused while this guide is open.',
        'Listo para explorar. El juego está en pausa mientras esta guía esté abierta.');
    if (game && !game.s) current.textContent = '';
  }
  function updateCategories() {
    // Keep the original button DOM mounted while its click is being processed.
    // Replacing a pressed chip during a touch/click can retry or retarget it.
    const all = [{id:'all', en:'All places',es:'Todos'}, ...groups];
    if (!categories.childElementCount) {
      for (const group of all) {
        const button = node('button', 'crown-review-category');
        button.type = 'button';
        button.dataset.ownerCategory = group.id;
        button.addEventListener('click', () => {
          category = group.id;
          updateCategories();
          updateResults();
        });
        categories.append(button);
      }
    }
    for (let i = 0; i < all.length; i++) {
      const button = categories.children[i], group = all[i];
      button.textContent = t(group.en, group.es);
      button.setAttribute('aria-pressed', String(category === group.id));
    }
  }
  function updateResults() {
    results.replaceChildren();
    const q = search.value.toLocaleLowerCase().trim();
    let count = 0;
    for (const group of groups) {
      if (category !== 'all' && category !== group.id) continue;
      const matching = entries.filter((entry) => entry.group === group &&
        (!q || [group.en, group.es, ...entry.place.map((part) => typeof part === 'string' ? part : '')]
          .join(' ').toLocaleLowerCase().includes(q)));
      if (!matching.length) continue;
      count += matching.length;
      const section = node('section', 'crown-review-section');
      const heading = node('h3', 'crown-review-group-title', t(group.en, group.es));
      const list = node('div', 'crown-review-grid');
      section.append(heading, list);
      for (const {place} of matching) {
        const card = node('article', 'crown-review-card');
        const top = node('div', 'crown-review-card-top');
        const name = node('h4', '', t(place[1], place[2]));
        const tag = node('span', place[8] === 'danger' ? 'crown-review-tag danger' : 'crown-review-tag',
          place[8] === 'danger' ? t('Combat danger', 'Peligro de combate') :
            place[4] === null ? t('Interior', 'Interior') : t('Outdoor', 'Exterior'));
        top.append(name, tag);
        const description = node('p', 'crown-review-description', t(place[6], place[7]));
        const visit = node('button', 'crown-review-visit', t('Visit this place', 'Visitar este lugar'));
        visit.type = 'button';
        visit.dataset.ownerDestination = place[0];
        visit.disabled = !available();
        visit.addEventListener('click', () => jump(place, false));
        card.append(top, description, visit);
        list.append(card);
      }
      results.append(section);
    }
    empty.hidden = count !== 0;
    empty.textContent = t('No matching places. Try another search or category.',
      'No se encontraron lugares. Prueba otra búsqueda o categoría.');
    backButton.disabled = !available() || !history.length;
  }
  function close() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.classList.remove('crown-review-open');
    launcher.setAttribute('aria-expanded', 'false');
    if (menuOwned) {
      // Return to the ordinary document BEFORE closing the native pause menu.
      document.body.append(backdrop);
      menuOwned = false;
      root.Prototype?.closeMenu();
    }
    launcher.focus({ preventScroll: true });
  }
  function open() {
    if (!backdrop.hidden || !rotate.hidden) return;
    const api = root.Prototype;
    if (api?.started && !$('modal').hidden) {
      launcher.textContent = t('Close game menu first', 'Cierra primero el menú del juego');
      return;
    }
    menuOwned = false;
    if (available()) {
      // Own the native menu for the exact lifetime of the guide: native app
      // freezes simulation, skill charges and audio just like any game menu.
      api.openMenu('Owner region review', '', [], close);
      // The native game consumes outside-menu pointerdown events. Mounting
      // this preview guide inside its own modal makes all touch/click targets
      // legitimate menu descendants without changing any production handler.
      $('modal').append(backdrop);
      menuOwned = true;
    }
    localize();
    category = 'all';
    search.value = '';
    feedback.textContent = '';
    showCurrent();
    updateCategories();
    updateResults();
    document.body.classList.add('crown-review-open');
    backdrop.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    closeButton.focus({ preventScroll: true });
  }
  function jump(place, returning) {
    if (!rotate.hidden) return;
    if (!available()) {
      feedback.textContent = t('Start a Developer Mode game first.', 'Primero inicia una partida en modo Desarrollador.');
      return;
    }
    const api = root.Prototype, game = api.game;
    const prior = {zone:game.zoneId,x:game.hero.x,y:game.hero.y};
    const arrival = place[4] == null ? null : {x:place[4],y:place[5]};
    try {
      api.cancelNavigation?.();
      if (!game.enter(place[3], arrival)) {
        feedback.textContent = t('This destination could not be reached.', 'No se pudo visitar este destino.');
        return;
      }
    } catch (_) {
      feedback.textContent = t('Travel failed; remain in the guide and check your run.',
        'Falló el viaje; revisa tu partida antes de continuar.');
      return;
    }
    if (!returning) {
      history.push(prior);
      if (history.length > 12) history.shift();
      lastVisited = place;
    } else {
      lastVisited = null;
    }
    const saved = api.save();
    api.updateHUD();
    if (!saved) {
      feedback.textContent = t('You arrived, but saving failed. Export the run before closing.',
        'Llegaste, pero falló el guardado. Exporta la partida antes de salir.');
      updateResults();
      return;
    }
    close();
  }
  function returnPrevious() {
    if (!available() || !history.length) return;
    const previous = history[history.length - 1];
    const entry = ['previous', 'Previous spot', 'Lugar anterior', previous.zone, previous.x, previous.y, '', ''];
    // Only discard the history slot after the real navigation succeeds.
    const before = root.Prototype.game.zoneId;
    jump(entry, true);
    if (backdrop.hidden && before) history.pop();
  }
  launcher.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  doneButton.addEventListener('click', close);
  backButton.addEventListener('click', returnPrevious);
  search.addEventListener('input', updateResults);
  backdrop.addEventListener('pointerdown', (event) => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', (event) => {
    if (backdrop.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled])')]
        .filter((el) => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }, true);
  // Block keyboard/game input during an upright phone review, independently
  // of the unfinished orientation work on the main game branch.
  document.addEventListener('keydown', (event) => {
    if (rotate.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  root.addEventListener('resize', syncPhoneOrientation);
  root.addEventListener('orientationchange', syncPhoneOrientation);
  root.matchMedia?.('(orientation: portrait)')?.addEventListener?.('change', syncPhoneOrientation);
  root.Prototype?.platform?.onChange?.(syncPhoneOrientation);
  localize();
  syncPhoneOrientation();
})(window);
