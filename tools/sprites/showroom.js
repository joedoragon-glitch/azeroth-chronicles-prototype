'use strict';
// One showroom, two views of the same art review workflow:
// local sprite production exposes comparison.json; the public page browses
// a source-derived visual index without regenerating screenshots.
(async function boot() {
  let comparison = false;
  try {
    const response = await fetch(new URL('./comparison.json', location.href), { cache: 'no-store' });
    comparison = response.ok && (await response.clone().json().catch(() => null))?.comparisons?.length > 0;
  } catch (_) {}
  if (comparison) {
    document.getElementById('library-root').hidden = true;
    document.getElementById('single-review').hidden = false;
    return startFocusedComparison();
  }
  document.getElementById('single-review').hidden = true;
  return startBrowsableShowroom();
})().catch((error) => {
  const target = document.getElementById('library-count');
  if (target) target.textContent = 'The showroom could not start: ' + (error.message || error);
});
function startFocusedComparison() {
'use strict';
(async () => {
  const byId = (id) => document.getElementById(id);
  try {
    const response = await fetch('comparison.json', { cache: 'no-store' });
    if (!response.ok) throw Error('Comparison data is unavailable');
    const data = await response.json();
    byId('name').textContent = data.name;
    byId('status').textContent = data.pending
      ? 'Preparation preview — no candidate artwork yet.'
      : 'Candidate preview — appearance approval is pending.';
    byId('question').textContent = data.pending
      ? 'No creative decision is needed yet.'
      : 'Does this preserve the existing identity and improve its appearance?';
    const load = (src) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(Error('Unable to load comparison image'));
        image.src = src;
      });
    const [canonical, candidate] = await Promise.all([
      load('canonical-isolated.png'),
      load(data.candidateImage),
    ]);
    function draw() {
      const profile = data.comparisons[Number(byId('viewport').value) || 0],
        ratio = profile.ratio || 1,
        zoom = profile.cameraZoom || data.cameraZoom || 1,
        extent = 312;
      for (const id of ['canonical', 'candidate', 'overlay']) {
        const canvas = byId(id);
        canvas.width = Math.round(extent * ratio);
        canvas.height = Math.round(extent * ratio);
        canvas.style.width = extent + 'px';
        const ctx = canvas.getContext('2d'),
          size = 12;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        for (let y = 0; y < extent; y += size)
          for (let x = 0; x < extent; x += size) {
            ctx.fillStyle = ((x + y) / size) % 2 ? '#27342d' : '#1a2721';
            ctx.fillRect(x, y, size, size);
          }
        ctx.imageSmoothingEnabled = false;
        const dw = data.runtime.displayWidth * zoom,
          dh = data.runtime.displayHeight * zoom,
          x = (extent - dw) / 2,
          y = (extent - dh) / 2;
        ctx.globalAlpha = 1;
        ctx.drawImage(id === 'candidate' ? candidate : canonical, x, y, dw, dh);
        if (id === 'overlay') {
          ctx.globalAlpha = Number(byId('blend').value) / 100;
          ctx.drawImage(candidate, x, y, dw, dh);
          ctx.globalAlpha = 1;
        }
        if (byId('guides').checked) {
          const ax = x + dw * data.runtime.anchorX,
            ay = y + dh * data.runtime.anchorY;
          ctx.strokeStyle = '#efca74';
          ctx.beginPath();
          ctx.moveTo(ax - 15, ay);
          ctx.lineTo(ax + 15, ay);
          ctx.moveTo(ax, ay - 15);
          ctx.lineTo(ax, ay + 15);
          ctx.stroke();
          ctx.strokeStyle = '#83c5dc';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, ay - data.runtime.labelHeight * zoom);
          ctx.lineTo(extent, ay - data.runtime.labelHeight * zoom);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    const select = byId('viewport');
    data.comparisons.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent =
        item.width +
        ' × ' +
        item.height +
        ' · ' +
        item.lighting +
        ' · ' +
        Math.round((item.cameraZoom || 1) * 100) +
        '% · ' +
        Number((item.ratio || 1).toFixed(2)) +
        '× pixels';
      select.append(option);
    });
    function scene() {
      const item = data.comparisons[Number(select.value)];
      byId('viewing-size').textContent =
        Math.round((item.cameraZoom || 1) * 100) +
        '% camera · ' +
        Number((item.ratio || 1).toFixed(2)) +
        '× canvas density · ' +
        (item.pixelWidth || item.width) +
        ' × ' +
        (item.pixelHeight || item.height) +
        ' raster. Open scene images for a 1:1 pixel inspection.';
      for (const [id, link, src] of [
        ['current-scene', 'current-link', item.canonical],
        ['proposed-scene', 'proposed-link', item.candidate],
      ]) {
        byId(id).src = src;
        byId(link).href = src;
        byId(id).width = item.width;
        byId(id).height = item.height;
      }
    }
    byId('blend').addEventListener('input', draw);
    byId('guides').addEventListener('change', draw);
    select.addEventListener('change', () => {
      scene();
      draw();
    });
    draw();
    scene();
    window.SpriteShowroom = { ready: true, key: data.key, pending: data.pending };
  } catch (error) {
    byId('error').hidden = false;
    byId('error').textContent = error.message;
  }
})();

}
async function startBrowsableShowroom() {

  'use strict';
  const $ = (id) => document.getElementById(id);
  const rootUrl = new URL('../../', location.href);
  const anchor = document.querySelector('.library-back');
  anchor.href = new URL('index.html', rootUrl).href;
  // Only after the focused comparison mode has been ruled out. The game's
  // sprite resources are root-relative; this is the existing game's base.
  const base = document.createElement('base');
  base.href = rootUrl.href;
  document.head.prepend(base);
  const scriptOwners = [
    'highlands', 'greenwood-landscape', 'dark-crown-landscape',
    'greenwood-interiors', 'data', 'rules', 'visuals', 'sprite-format', 'sprites',
  ];
  function loadScript(name) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const path = 'src/prototype/' + name + '.js';
      const source = new URL(path, rootUrl);
      const fingerprint = index?.sourceFingerprints?.[path];
      if (fingerprint) source.searchParams.set('v', fingerprint);
      script.src = source.href;
      script.onload = resolve;
      script.onerror = () => reject(Error('Could not load game painter: ' + name));
      document.head.append(script);
    });
  }
  const indexResponse = fetch(new URL('tools/sprites/library-index.json', rootUrl), {
    cache: 'no-cache',
  });
  let index;
  try {
    const response = await indexResponse;
    if (!response.ok) throw Error('The published visual catalog is unavailable');
    index = await response.json();
    if (index.schemaVersion !== 1 || !Array.isArray(index.entries))
      throw Error('Invalid visual catalog version');
    for (const name of scriptOwners) await loadScript(name);
    const manifestUrl = new URL('assets/sprites/manifest.json', rootUrl);
    if (index.sourceFingerprints?.['assets/sprites/manifest.json'])
      manifestUrl.searchParams.set('v',
        index.sourceFingerprints['assets/sprites/manifest.json']);
    if (!await PrototypeSprites.preload(manifestUrl.href))
      throw Error('The sprite registry is unavailable');
  } catch (error) {
    $('library-count').textContent = 'Could not open showroom: ' + error.message;
    window.SpriteShowroom = { ready: false, mode: 'library', error: error.message };
    return;
  }
  const state = {
    entries: index.entries,
    filtered: [],
    collection: 'current',
    visible: 24,
    selected: null,
    view: 'current',
    variant: 0,
    light: 'day',
    scale: 'close',
    generation: 0,
  };

  // UI localization is ephemeral and independent of save/persistence language.
  // Exact source entity names and stable IDs deliberately remain canonical.
  const requestedLanguage = new URL(location.href).searchParams.get('lang');
  let language = ['en', 'es'].includes(requestedLanguage)
    ? requestedLanguage : /^es\b/i.test(navigator.language || '') ? 'es' : 'en';
  const spanish = {
    back: '← Volver al juego',
    intro: 'Todo el arte visual del juego en un solo lugar. Explora dibujos procedurales, sprites registrados y referencias conservadas sin entrar en una partida.',
    search: 'Buscar arte', category: 'Categoría', location: 'Ubicación', artworkType: 'Tipo de arte',
    browse: 'Explorar el arte', clear: 'Borrar filtros', more: 'Mostrar más',
    footnote: 'Las referencias históricas tienen fecha. Sus vistas actuales usan el código de dibujo vigente, pero no demuestran por sí solas que ese estado aparezca aún en una escena de la campaña.',
    selected: 'Arte seleccionado', gameSelection: 'En el juego', procedural: 'Procedural',
    sprite: 'Sprite', compare: 'Comparar', appearance: 'Apariencia o estado',
    revision: 'Versión del sprite', lighting: 'Iluminación', viewScale: 'Escala',
    prev: '← Anterior', next: 'Siguiente →', copyLink: 'Copiar enlace',
    technical: 'Identidad, fuentes y datos técnicos', noteTitle: 'Escribir una observación sobre el arte',
    noteLabel: 'Tu observación (no se envía automáticamente)', copyNote: 'Copiar observación',
    footer: 'Esta sala es de solo lectura. Nunca abre, modifica ni reemplaza partidas guardadas. La aceptación artística y la publicación son decisiones independientes.',
    searchPlaceholder: 'Busca Paladín, huerto, ferry, material…',
    notePlaceholder: '¿Qué deberíamos conservar, cambiar o comparar?',
    allArtwork: 'Todo el arte', everyLocation: 'Todas las ubicaciones', allTypes: 'Todos los tipos',
    rasterFilter: 'Sprite seleccionado', proceduralFilter: 'Procedural seleccionado',
    retainedFilter: 'Tiene sprite para comparar', datedFilter: 'Referencias históricas',
    materials: 'Materiales', day: 'Día', night: 'Noche', closeUp: 'Vista ampliada',
    game100: '100% del juego', game150: '150% del juego', game200: '200% del juego',
    matches: 'resultados', shown: 'visibles', selectedRaster: 'Sprite seleccionado para este estado',
    selectedProcedural: 'Procedural seleccionado para este estado',
    referenceUnavailable: 'Referencia no disponible', historicalFixture: 'Referencia histórica',
    worldFixture: 'Estado del mundo actual', playableHero: 'Personaje jugable',
    historicalMaterial: 'Material histórico · ya no está en el juego',
    currentMaterial: 'Material de camino registrado',
    reviewedFixture: 'Referencia de octubre de 2026', materialCard: 'Material',
    rasterCard: 'Sprite seleccionado', proceduralCard: 'Procedural seleccionado',
    gameCaption: 'Lo que usa el juego para este estado',
    spriteCaption: 'Sprite registrado o conservado', proceduralCaption: 'Dibujo procedural actual',
    compareCaption: 'Sprite registrado o conservado',
    previewUnavailable: 'Este estado no puede aislarse de forma fiable aquí. No se ha inventado ninguna imagen.',
    studioClose: 'vista ampliada (no es escala del juego)',
    gameScale: 'escala del juego', nightGrade: 'estudio nocturno', dayGrade: 'estudio diurno',
    isolatedCaveat: 'Estudio de un recurso aislado. No es una captura de la escena completa ni una aceptación del renderizador del dispositivo.',
    currentFixture: 'Estado actual', registeredSprite: 'Sprite registrado / material',
    retiredMaterial: 'Material retirado', priorVersion: 'Versión conservada',
    animationFrame: 'Animación', copied: 'Copiado',
    clipboardUnavailable: 'No se puede acceder al portapapeles. Enlace exacto:',
    currentWorld: 'identidades del mundo actual', visualEntries: 'recursos visuales',
    registeredSprites: 'sprites registrados', datedCases: 'referencias históricas',
    stableId: 'ID estable', region: 'Ubicación', origin: 'Fuente',
    renderer: 'Selección del renderizador', catalogNo: 'Número de catálogo',
    activeRaster: 'Identidad del sprite activo', registeredRevision: 'Revisión registrada',
    historicalVersions: 'Versiones conservadas', none: 'Ninguno',
  };
  const categoryEs = {
    'Characters': 'Personajes', 'Buildings & services': 'Edificios y servicios',
    'World & scenery': 'Mundo y escenarios', 'Materials': 'Materiales',
    'Visual states': 'Estados visuales',
  };
  const regionEs = {
    'Greenwood Vale': 'Valle de Greenwood', 'Flooded Marches': 'Marismas inundadas',
    'Ironroot Highlands': 'Tierras Altas de Ironroot', 'Ashen Frontier': 'Frontera de Cenizas',
    'Dark Crown': 'Corona Oscura', 'Historical': 'Histórico',
    'Mixed / interior': 'Mixto / interior',
  };
  const staticTargets = [
    ['.library-back','back'], ['.library-lede','intro'],
    ['.library-search','search'], ['.library-controls label:nth-child(2)','category'],
    ['.library-controls label:nth-child(3)','location'],
    ['.library-controls label:nth-child(4)','artworkType'],
    ['#browse-heading','browse'], ['#asset-reset','clear'],
    ['#asset-more','more'], ['.library-footnote','footnote'],
    ['.library-inspector > .library-eyebrow','selected'],
    ['#asset-view-buttons [data-view="current"]','gameSelection'],
    ['#asset-view-buttons [data-view="procedural"]','procedural'],
    ['#asset-view-buttons [data-view="raster"]','sprite'],
    ['#asset-view-buttons [data-view="compare"]','compare'],
    ['.library-detail-controls label:nth-child(1)','appearance'],
    ['.library-detail-controls label:nth-child(2)','revision'],
    ['.library-detail-controls label:nth-child(3)','lighting'],
    ['.library-detail-controls label:nth-child(4)','viewScale'],
    ['#asset-prev','prev'], ['#asset-next','next'], ['#asset-copy','copyLink'],
    ['.library-details:first-of-type summary','technical'],
    ['.library-details:last-of-type summary','noteTitle'],
    ['.library-details label[for="asset-note"]','noteLabel'],
    ['#asset-copy-note','copyNote'], ['.library-footer','footer'],
    ['#asset-group option[value=""]','allArtwork'],
    ['#asset-region option[value=""]','everyLocation'],
    ['#asset-kind option[value=""]','allTypes'],
    ['#asset-kind option[value="raster"]','rasterFilter'],
    ['#asset-kind option[value="procedural"]','proceduralFilter'],
    ['#asset-kind option[value="retained"]','retainedFilter'],
    ['#asset-kind option[value="dated"]','datedFilter'],
    ['#asset-kind option[value="material"]','materials'],
    ['#asset-light option[value="day"]','day'],
    ['#asset-light option[value="night"]','night'],
    ['#asset-scale option[value="close"]','closeUp'],
    ['#asset-scale option[value="1"]','game100'],
    ['#asset-scale option[value="1.5"]','game150'],
    ['#asset-scale option[value="2"]','game200'],
  ];
  const originalTexts = new Map();
  const word = (key, english) => language === 'es' ? (spanish[key] || english || key) : english || key;
  function localeStatic() {
    document.documentElement.lang = language;
    $('asset-language').value = language;
    for (const [selector, key] of staticTargets) {
      const item = document.querySelector(selector);
      if (!item) continue;
      const node = item.querySelector('input,select')
        ? [...item.childNodes].find((child) => child.nodeType === 3 && child.textContent.trim())
        : item;
      if (!node) continue;
      if (!originalTexts.has(node)) originalTexts.set(node, node.textContent);
      node.textContent = language === 'es' ? spanish[key] : originalTexts.get(node);
    }
    $('asset-query').placeholder = language === 'es' ? spanish.searchPlaceholder
      : 'Find Paladin, orchard, ferry, material…';
    $('asset-note').placeholder = language === 'es' ? spanish.notePlaceholder
      : 'What should we keep, change or compare?';
    for (const option of $('asset-group').options) {
      if (option.value) option.textContent = language === 'es'
        ? categoryEs[option.value] || option.value : option.value;
    }
    for (const option of $('asset-region').options) {
      if (option.value) option.textContent = language === 'es'
        ? regionEs[option.value] || option.value : option.value;
    }
  }

  const imageCache = new Map();
  const reviewNotes = new Map();
  const groups = [...new Set(state.entries.map((e) => e.group))].sort();
  const regions = [...new Set(state.entries.flatMap((e) => e.regions || [e.region]))].sort();
  for (const [id, values] of [['asset-group', groups], ['asset-region', regions]]) {
    for (const name of values) $(id).add(new Option(name, name));
  }
  const human = (v) => String(v || '').replace(/[:_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  function statesFor(entry) {
    return [...entry.states, ...(entry.datedStates || []).map((s) => ({
      ...s, label: s.label + ' · Oct 2026 fixture',
    }))];
  }
  function displayState(label) {
    if (language !== 'es') return label;
    return String(label || '')
      .replace(/^Current fixture$/, 'Estado actual')
      .replace(/^Current playable hero$/, 'Personaje jugable actual')
      .replace(/^Current body$/, 'Aspecto actual')
      .replace(/^Observed world fixture · /, 'Estado observado · ')
      .replace(/ · Oct 2026 fixture$/, ' · referencia de octubre de 2026');
  }
  function linkedImage(src) {
    if (!/^\.\/assets\/(?:sprites|materials)\/[a-zA-Z0-9_/-]+\.(?:png|webp)$/.test(src || '') ||
        src.includes('..'))
      return Promise.reject(Error('Invalid showroom image path'));
    if (!imageCache.has(src)) {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => reject(Error('Artwork image did not load'));
        img.src = new URL(src.slice(2), rootUrl).href;
      });
      imageCache.set(src, promise);
      if (imageCache.size > 24) imageCache.delete(imageCache.keys().next().value);
    }
    return imageCache.get(src);
  }
  function activeState(entry) {
    return statesFor(entry)[state.variant] || statesFor(entry)[0] || null;
  }
  function selectedSprite(entry, thumb = false) {
    const value = thumb ? '' : $('asset-revision').value;
    return value || entry.registeredRaster || entry.archive?.[0]?.src || null;
  }
  function stageBackground(ctx, w, h, light) {
    ctx.fillStyle = light === 'night' ? '#102027' : '#23362e';
    ctx.fillRect(0, 0, w, h);
    const grid = 20;
    for (let y = 0; y < h; y += grid)
      for (let x = 0; x < w; x += grid) {
        if ((x / grid + y / grid) % 2 === 0) {
          ctx.fillStyle = light === 'night' ? '#15282e' : '#2a3e35';
          ctx.fillRect(x, y, grid, grid);
        }
      }
    ctx.strokeStyle = light === 'night' ? '#73807d77' : '#b7b89b77';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * .73);
    ctx.lineTo(w, h * .73);
    ctx.stroke();
  }
  function inspectionScale(entry) {
    if (entry.id === 'transport:ferry' || entry.id.includes('transport:ferry')) return 2;
    if (entry.group === 'Characters') return 5;
    if (entry.group === 'Buildings & services') return 3;
    if (entry.group === 'World & scenery') return 3.9;
    if (entry.group === 'Visual states') return 3.3;
    return 3;
  }
  async function paint(canvas, entry, visual, fixture, generation, thumb = false) {
    const logicalWidth = 480, logicalHeight = 340, density = thumb ? 1 : 1.5;
    canvas.width = logicalWidth * density;
    canvas.height = logicalHeight * density;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.setTransform(density, 0, 0, density, 0, 0);
    stageBackground(ctx, logicalWidth, logicalHeight, state.light);
    const zoom = thumb || state.scale === 'close' ? inspectionScale(entry) : Number(state.scale);
    const p = { x: logicalWidth / (2 * zoom), y: logicalHeight * .73 / zoom };
    const isMaterial = ['material', 'historical'].includes(entry.representation);
    const src = visual === 'raster' || isMaterial ? selectedSprite(entry, thumb) : null;
    const valid = () => thumb || generation === state.generation;
    try {
      if (isMaterial) {
        const image = await linkedImage(entry.registeredRaster);
        if (!valid()) return false;
        const pattern = ctx.createPattern(image, 'repeat');
        if (!pattern) return false;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      } else if (visual === 'raster') {
        if (!src) return false;
        const img = await linkedImage(src);
        if (!valid()) return false;
        const data = entry.spriteEntry || {};
        const sourceWidth = Number(data.width || img.naturalWidth);
        const sourceHeight = Number(data.height || img.naturalHeight);
        const dw = Number(data.displayWidth || sourceWidth / 3) * zoom;
        const dh = Number(data.displayHeight || sourceHeight / 3) * zoom;
        const ax = Number.isFinite(data.anchorX) ? data.anchorX : .5;
        const ay = Number.isFinite(data.anchorY) ? data.anchorY : .88;
        ctx.imageSmoothingEnabled = false;
        const frame = Object.values(entry.spriteEntry?.clips || {}).flatMap((clip) => clip.frames || [])
          .find((item) => item.src === src && Array.isArray(item.rect) && item.rect.length === 4);
        if (frame) ctx.drawImage(img, ...frame.rect,
          p.x * zoom - dw * ax, p.y * zoom - dh * ay, dw, dh);
        else ctx.drawImage(img, p.x * zoom - dw * ax, p.y * zoom - dh * ay, dw, dh);
      } else if (fixture?.entity) {
        const entity = { ...fixture.entity };
        const region = fixture.region;
        if (visual === 'current') {
          const result = PrototypeSprites.definitionFor(entity, region);
          if (result?.key) {
            await PrototypeSprites.warm([result.key], { clips: true });
            if (!valid()) return false;
          }
        }
        ctx.save();
        ctx.scale(zoom, zoom);
        let painted = false;
        if (visual === 'current') {
          painted = PrototypeSprites.draw(ctx, entity, p, region, false);
        }
        if (!painted) PrototypeVisuals.draw(ctx, entity, p, region, false);
        ctx.restore();
      } else return false;
      if (state.light === 'night') {
        ctx.fillStyle = '#15203948';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      }
      return true;
    } catch (error) {
      if (!valid()) return false;
      ctx.fillStyle = '#f4cda3';
      ctx.font = '15px sans-serif';
      ctx.fillText('Preview unavailable for this fixture', 16, 28);
      return false;
    }
  }
  function isMaterial(entry) {
    return entry.group === 'Materials';
  }
  function rasterAvailable(entry) {
    return !!(entry.registeredRaster || entry.archive?.length);
  }
  function statusText(entry) {
    if (isMaterial(entry))
      return word(entry.sourceKind === 'archived-material' ? 'historicalMaterial' : 'currentMaterial',
        entry.sourceKind === 'archived-material' ? 'Historical material · not in the current game'
          : 'Registered road material');
    const fixture = activeState(entry);
    const selected = fixture?.entity
      ? (PrototypeSprites.definitionFor(fixture.entity, fixture.region) ? 'raster' : 'procedural')
      : entry.representation;
    const hasRetained = selected === 'procedural' && rasterAvailable(entry);
    const use = selected === 'raster' ? word('selectedRaster', 'Sprite currently selected')
      : hasRetained
        ? word('proceduralRetained', 'Procedural drawing in game · retained sprite available')
        : selected === 'procedural' ? word('selectedProcedural', 'Procedural drawing in game')
          : word('referenceUnavailable', 'Reference unavailable');
    const prefix = entry.sourceKind === 'dated-reference'
      ? word('historicalFixture', 'Dated review fixture') + ' · '
      : entry.sourceKind === 'current-world-fixture'
        ? word('worldFixture', 'Current world-source fixture') + ' · '
        : entry.sourceKind === 'current-hero-fixture'
          ? word('playableHero', 'Playable hero') + ' · ' : '';
    return prefix + use;
  }
  function belongsToCollection(entry, collection = state.collection) {
    const dated = entry.sourceKind === 'dated-reference' ||
      entry.sourceKind === 'archived-material';
    if (collection === 'current') return !dated;
    if (collection === 'dated') return dated || !!entry.datedStates?.length;
    return true;
  }
  function inRegion(entry, selected) {
    return !selected || (entry.regions || [entry.region]).includes(selected);
  }
  function collectionCounters() {
    return {
      current: state.entries.filter((e) => belongsToCollection(e, 'current')).length,
      dated: state.entries.filter((e) => belongsToCollection(e, 'dated')).length,
      all: state.entries.length,
    };
  }
  const originalRegionNames = Object.freeze([...regions]);
  function localeCount(base, count) {
    return base + ' · ' + count;
  }
  function updateCollectionControls() {
    const counts = collectionCounters();
    const terms = language === 'es'
      ? { current: 'Arte actual', dated: 'Revisiones históricas', all: 'Todo' }
      : { current: 'Current game artwork', dated: 'Historical reviews', all: 'All entries' };
    for (const button of document.querySelectorAll('.library-collection [data-collection]')) {
      const name = button.dataset.collection;
      button.textContent = terms[name] + ' (' + counts[name] + ')';
      button.setAttribute('aria-pressed', String(state.collection === name));
    }
    const message = state.collection === 'current'
      ? 'Current renderer identities are shown first; dated reviews are available separately.'
      : state.collection === 'dated'
        ? 'These are dated design references and preserved material records. A preview may use newer renderer code.'
        : 'Current and historical entries are together. Use the category and region filters to narrow the list.';
    $('collection-explain').textContent = language === 'es'
      ? (state.collection === 'current'
        ? 'Primero se muestra el arte del juego actual; las revisiones anteriores están en otra colección.'
        : state.collection === 'dated'
          ? 'Son referencias históricas y materiales conservados. Las vistas previas pueden usar el código actual.'
          : 'Se muestran el arte actual y el histórico. Filtra por categoría y región para reducir resultados.')
      : message;
  }
  function optionCounts() {
    const current = state.entries.filter((e) => belongsToCollection(e));
    for (const option of $('asset-group').options) {
      if (!option.value) continue;
      const count = current.filter((e) => e.group === option.value).length;
      option.dataset.count = String(count);
      option.textContent = localeCount(language === 'es'
        ? categoryEs[option.value] || option.value : option.value, count);
    }
    for (const option of $('asset-region').options) {
      if (!option.value) continue;
      const count = current.filter((e) => inRegion(e, option.value)).length;
      option.dataset.count = String(count);
      option.textContent = localeCount(language === 'es'
        ? regionEs[option.value] || option.value : option.value, count);
    }
  }
  function progressiveFacets() {
    const group = $('asset-group').value, region = $('asset-region').value;
    const available = state.entries.filter((e) =>
      belongsToCollection(e) && inRegion(e, region) && (!group || e.group === group));
    const sub = $('asset-subcategory'), oldSub = sub.value;
    const subs = group ? [...new Set(available.map((e) => e.subcategory).filter(Boolean))]
      .sort() : [];
    sub.replaceChildren(new Option(language === 'es' ? 'Todas las clases' : 'Every kind', ''));
    for (const name of subs) sub.add(new Option(
      name + ' · ' + available.filter((e) => e.subcategory === name).length, name));
    sub.value = subs.includes(oldSub) ? oldSub : '';
    $('asset-subcategory-wrap').hidden = subs.length <= 1;
    const area = $('asset-area'), oldArea = area.value;
    const areas = region ? [...new Set(available.flatMap((e) => e.areas || []))].sort() : [];
    area.replaceChildren(new Option(language === 'es' ? 'Todas las zonas' : 'Every area', ''));
    for (const name of areas)
      area.add(new Option(human(name) + ' · ' +
        available.filter((e) => e.areas?.includes(name)).length, name));
    area.value = areas.includes(oldArea) ? oldArea : '';
    $('asset-area-wrap').hidden = areas.length <= 1;
  }
  function filterResults() {
    const query = $('asset-query').value.trim().toLowerCase();
    const group = $('asset-group').value, region = $('asset-region').value;
    const sub = $('asset-subcategory').value, area = $('asset-area').value;
    const kind = $('asset-kind').value;
    state.filtered = state.entries.filter((entry) => {
      if (!belongsToCollection(entry)) return false;
      if (group && entry.group !== group) return false;
      if (!inRegion(entry, region)) return false;
      if (sub && entry.subcategory !== sub) return false;
      if (area && !entry.areas?.includes(area)) return false;
      if (kind === 'raster' && entry.displayStatus !== 'sprite-active') return false;
      if (kind === 'procedural' && entry.representation !== 'procedural') return false;
      if (kind === 'retained' && entry.displayStatus !== 'procedural-with-sprite')
        return false;
      if (query && ![entry.id, entry.name, entry.region, entry.group,
        entry.subcategory, ...(entry.tags || []), ...(entry.areas || [])]
        .join(' ').toLowerCase().includes(query)) return false;
      return true;
    });
    if (query) {
      const rank = (entry) => entry.id.toLowerCase() === query ? 0
        : entry.name.toLowerCase() === query ? 1
          : entry.id.toLowerCase().startsWith(query) ? 2
            : entry.name.toLowerCase().startsWith(query) ? 3 : 4;
      state.filtered.sort((a, b) => rank(a) - rank(b) ||
        a.name.localeCompare(b.name));
    } else {
      // The roster is organized by visible category, then its more useful
      // subcategory and name; archival source-order is not browsing order.
      state.filtered.sort((a, b) => a.group.localeCompare(b.group) ||
        String(a.subcategory || '').localeCompare(String(b.subcategory || '')) ||
        a.name.localeCompare(b.name));
    }
  }
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((observed) => {
      for (const item of observed) {
        if (!item.isIntersecting) continue;
        observer.unobserve(item.target);
        const id = item.target.getAttribute('data-asset-id');
        const entry = state.entries.find((a) => a.id === id);
        if (entry) void paint(item.target, entry, entry.representation === 'raster' ||
          isMaterial(entry) ? 'raster' : 'current', entry.states?.[0] || null, state.generation, true);
      }
    }, { rootMargin: '180px' });
  }
  function labelCard(entry) {
    if (entry.sourceKind === 'dated-reference') return word('reviewedFixture', 'Review · Oct 2026');
    if (isMaterial(entry)) return word('materialCard', 'Material');
    if (entry.displayStatus === 'sprite-active') return word('rasterCard', 'Uses sprite');
    if (entry.displayStatus === 'procedural-with-sprite')
      return word('retainedCard', 'Procedural · sprite retained');
    return word('proceduralCard', 'Procedural only');
  }
  function resultCaption() {
    return state.filtered.length + ' ' + word('matches', 'matching artworks') + ' · ' +
      Math.min(state.visible, state.filtered.length) + ' ' + word('shown', 'shown');
  }
  function relabelVisibleCards() {
    for (const node of $('asset-grid').querySelectorAll('.asset-card')) {
      const entryId = node.querySelector('canvas')?.dataset.assetId;
      const entry = state.entries.find((item) => item.id === entryId);
      if (!entry) continue;
      const location = node.querySelector('.library-card-meta');
      if (location) location.textContent = language === 'es'
        ? regionEs[entry.region] || entry.region : entry.region;
      const status = node.querySelector('.library-card-state');
      if (status) status.textContent = labelCard(entry);
    }
    $('asset-results').textContent = resultCaption();
  }
  function card(entry) {
    const button = document.createElement('button');
    button.className = 'asset-card';
    button.type = 'button';
    // Preserve the native button role for keyboard and screen-reader users.
    button.setAttribute('aria-current', String(entry.id === state.selected?.id));
    const thumb = document.createElement('div');
    thumb.className = 'library-thumb';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('data-asset-id', entry.id);
    canvas.setAttribute('aria-hidden', 'true');
    thumb.append(canvas);
    const body = document.createElement('div');
    body.className = 'library-card-body';
    const title = document.createElement('strong');
    title.className = 'library-card-title';
    title.textContent = entry.name;
    const meta = document.createElement('span');
    meta.className = 'library-card-meta';
    const areaLabel = (entry.areas || []).find((area) => area && area !== entry.id.split(':')[0]);
    meta.textContent = (language === 'es' ? regionEs[entry.region] || entry.region : entry.region) +
      (areaLabel && entry.areas.length === 1 && areaLabel !== 'vale' &&
        areaLabel !== 'march' && areaLabel !== 'highlands' &&
        areaLabel !== 'frontier' && areaLabel !== 'crown'
        ? ' · ' + human(areaLabel) : '');
    const status = document.createElement('span');
    status.className = 'library-card-state';
    status.textContent = labelCard(entry);
    body.append(title, meta, status);
    button.append(thumb, body);
    button.addEventListener('click', () => selectAsset(entry.id));
    if (observer) observer.observe(canvas);
    else void paint(canvas, entry, entry.representation === 'raster' ||
      isMaterial(entry) ? 'raster' : 'current', entry.states?.[0] || null, state.generation, true);
    const item = document.createElement('div');
    item.setAttribute('role', 'listitem');
    item.className = 'asset-card-item';
    item.append(button);
    return item;
  }
  function renderCards() {
    filterResults();
    if (observer) observer.disconnect();
    const grid = $('asset-grid');
    grid.replaceChildren(...state.filtered.slice(0, state.visible).map(card));
    $('asset-results').textContent = resultCaption();
    $('asset-more').hidden = state.visible >= state.filtered.length;
    for (const node of grid.querySelectorAll('.asset-card')) {
      if (node.querySelector('canvas')?.dataset.assetId === state.selected?.id)
        node.setAttribute('aria-current', 'true');
    }
  }
  function rebuildStates(entry) {
    const select = $('asset-state');
    select.replaceChildren();
    const states = statesFor(entry);
    for (let i = 0; i < states.length; i++)
      select.add(new Option(displayState(states[i].label), String(i)));
    select.disabled = states.length < 2;
    select.parentElement.hidden = states.length < 2;
    select.value = String(Math.max(0, Math.min(state.variant, states.length - 1)));
    const versions = $('asset-revision');
    versions.replaceChildren();
    if (entry.registeredRaster)
      versions.add(new Option(entry.sourceKind === 'archived-material'
        ? word('retiredMaterial', 'Retired material')
        : word('registeredSprite', 'Registered sprite / material'), entry.registeredRaster));
    for (const h of entry.archive || []) {
      if (h.src === entry.registeredRaster) continue;
      versions.add(new Option(word('priorVersion', 'Preserved revision') + ' ' +
        String(h.revision).slice(0, 10), h.src));
    }
    for (const [clipName, clip] of Object.entries(entry.spriteEntry?.clips || {})) {
      for (let i = 0; i < (clip.frames || []).length; i++) {
        const frame = clip.frames[i];
        if (frame.src && ![...versions.options].some((o) => o.value === frame.src))
          versions.add(new Option(word('animationFrame', 'Animation') + ' · ' +
            clipName + ' · ' + (i + 1), frame.src));
      }
    }
    versions.disabled = versions.options.length < 2;
    versions.parentElement.hidden = versions.options.length < 2;
  }
  function updateViewButtons(entry) {
    const hasState = !!activeState(entry)?.entity;
    const sprite = rasterAvailable(entry);
    const possible = new Set(['current']);
    if (hasState && !isMaterial(entry)) possible.add('procedural');
    if (sprite) possible.add('raster');
    if (hasState && sprite && !isMaterial(entry)) possible.add('compare');
    if (!possible.has(state.view)) state.view = 'current';
    for (const button of $('asset-view-buttons').querySelectorAll('button')) {
      button.disabled = !possible.has(button.dataset.view);
      button.setAttribute('aria-pressed', String(state.view === button.dataset.view));
    }
  }
  function metadata(entry) {
    const el = $('asset-metadata');
    const parts = [
      [word('stableId','Stable ID'), entry.id],
      [word('category','Category'), language === 'es' ? categoryEs[entry.group] || entry.group : entry.group],
      [word('region','Location'), language === 'es' ? regionEs[entry.region] || entry.region : entry.region],
      [word('origin','Source'), entry.sourceKind === 'dated-reference' ? word('reviewedFixture','October 2026 review case')
        : entry.sourceKind],
      [word('renderer','Renderer selection'), entry.representation],
      [word('catalogNo','Catalog number'), entry.catalogId || '—'],
      [word('activeRaster','Active raster identity'), entry.activeSpriteKey || '—'],
      [word('registeredRevision','Registered revision'), entry.revision || '—'],
      [word('historicalVersions','Preserved raster versions'), String(entry.archive?.length || 0)],
      [word('subCategory','Kind within category'), entry.subcategory || '—'],
      [word('areaMetadata','Source areas'), entry.areas?.join(', ') || '—'],
      [word('tagMetadata','Searchable tags'), entry.tags?.join(' · ') || '—'],
      [word('sourcePath','Current source modules'), entry.sourceFiles?.join(', ') || '—'],
    ];
    el.replaceChildren(...parts.map(([key, value]) => {
      const p = document.createElement('p');
      const b = document.createElement('strong');
      b.textContent = key + ': ';
      const span = document.createElement('span');
      span.textContent = value;
      p.append(b, span);
      return p;
    }));
  }
  const sourceCache = new Map();
  function appendReviewText(parent, label, text, provenance) {
    if (!text) return;
    const heading = document.createElement('strong');
    heading.textContent = label;
    const p = document.createElement('p');
    p.textContent = text;
    const note = document.createElement('p');
    note.className = 'source-provenance';
    note.textContent = provenance;
    parent.append(heading, p, note);
  }
  function displaySourceDefinition(entry) {
    const fixture = activeState(entry);
    const source = $('asset-design-description');
    source.replaceChildren();
    appendReviewText(source,
      language === 'es' ? 'Decisión de diseño documentada' : 'Recorded design decision',
      entry.currentDesign?.summary,
      language === 'es'
        ? 'Registro del propietario; coteja posibles decisiones posteriores con el código vigente.'
        : 'Owner decision record; later changes may supersede it. The live painter is authoritative.');
    appendReviewText(source,
      language === 'es' ? 'Plan de revisión histórica (octubre de 2026)'
        : 'Dated review plan (October 2026)',
      entry.historicalDesign?.summary,
      (entry.historicalDesign?.source || '') +
        (language === 'es' ? ' · referencia histórica, no necesariamente el diseño actual'
          : ' · historical reference, not necessarily the current design'));
    if (!source.childElementCount) {
      const p = document.createElement('p');
      p.textContent = language === 'es'
        ? 'No existe una descripción artística específica para esta identidad en los registros consultados. Debajo aparece el estado real del código.'
        : 'No asset-specific art direction is recorded for this identity in the indexed records. The actual render input is shown below.';
      source.append(p);
    }
    const current = fixture?.entity
      ? { assetId: entry.id, region: fixture.region, area: fixture.area || null,
          renderInput: fixture.entity }
      : { assetId: entry.id, materialOrArchive: entry.registeredRaster || null,
          registryRevision: entry.revision || null };
    $('asset-definition').textContent = JSON.stringify(current, null, 2);
    const selector = $('asset-source-file'), previous = selector.value;
    selector.replaceChildren();
    for (const file of entry.sourceFiles || []) {
      if (/^src\/prototype\/[a-z0-9-]+\.js$/.test(file))
        selector.add(new Option(file.replace('src/prototype/', ''), file));
    }
    selector.value = [...selector.options].some((o) => o.value === previous)
      ? previous : selector.options[0]?.value || '';
    $('asset-read-code').disabled = !selector.value;
    $('asset-source-excerpt').hidden = true;
    $('asset-source-excerpt').textContent = '';
    $('asset-source-status').textContent = language === 'es'
      ? 'Elige «Mostrar código» para consultar el módulo usado por el juego.'
      : 'Select “Show matching code” to inspect the current game source on demand.';
    updateFullSourceLink();
  }
  function updateFullSourceLink() {
    const file = $('asset-source-file').value;
    const link = $('asset-source-full');
    const valid = /^src\/prototype\/[a-z0-9-]+\.js$/.test(file);
    link.hidden = !valid;
    if (!valid) {
      link.removeAttribute('href');
      return;
    }
    const href = new URL(file, rootUrl);
    const revision = index.sourceFingerprints?.[file];
    if (revision) href.searchParams.set('v', revision);
    link.href = href.href;
    link.textContent = language === 'es' ? 'Abrir archivo completo: ' + file
      : 'Open complete game source: ' + file;
  }
  async function showCurrentCode() {
    const entry = state.selected, file = $('asset-source-file').value;
    if (!entry || !/^src\/prototype\/[a-z0-9-]+\.js$/.test(file)) return;
    const identity = entry.id;
    const status = $('asset-source-status');
    status.textContent = language === 'es' ? 'Leyendo código de la versión actual…'
      : 'Reading source from this exact game build…';
    try {
      if (!sourceCache.has(file)) {
        const url = new URL(file, rootUrl);
        const revision = index.sourceFingerprints?.[file];
        if (revision) url.searchParams.set('v', revision);
        const request = fetch(url.href, { cache: 'no-cache' }).then(async (response) => {
          if (!response.ok) throw Error('Painter file unavailable (' + response.status + ')');
          return response.text();
        });
        sourceCache.set(file, request);
        if (sourceCache.size > 6) sourceCache.delete(sourceCache.keys().next().value);
      }
      const lines = (await sourceCache.get(file)).split(/\r?\n/);
      if (identity !== state.selected?.id || file !== $('asset-source-file').value) return;
      const terms = (entry.sourceTerms || []).map((t) => String(t).toLowerCase());
      let best = -1, bestScore = -1;
      for (let i = 0; i < lines.length; i++) {
        const row = lines[i].toLowerCase();
        for (const term of terms) {
          if (!row.includes(term)) continue;
          const quoted = row.includes("'" + term + "'") || row.includes('"' + term + '"');
          const branch = /\bcase\b|\bif\s*\(|\belse if\b|\b(?:function|const)\b/.test(row);
          const score = (quoted ? 8 : 0) + (branch ? 5 : 0) +
            (/draw|paint|render/.test(row) ? 3 : 0);
          if (score > bestScore) { bestScore = score; best = i; }
        }
      }
      const first = best < 0 ? 0 : Math.max(0, best - 6);
      const last = best < 0 ? Math.min(20, lines.length) : Math.min(lines.length, best + 14);
      $('asset-source-excerpt').textContent = lines.slice(first, last).map((line, n) =>
        String(first + n + 1).padStart(5, ' ') + ' │ ' + line).join('\n');
      $('asset-source-excerpt').hidden = false;
      status.textContent = best < 0
        ? (language === 'es'
          ? 'Este módulo no contiene una coincidencia literal del nombre. Es código real; consulta el archivo completo para seguir las funciones compartidas.'
          : 'No direct asset-name match was found here. This is real code; shared drawing logic may not mention the exact asset name.')
        : (language === 'es'
          ? 'Fragmento real en ' + file + ', cerca de la línea ' + (best + 1) +
            '. Una coincidencia de texto no demuestra que abarque toda la función.'
          : 'Actual code in ' + file + ' near line ' + (best + 1) +
            '. A matching line is a navigation aid, not the entire drawing algorithm.');
    } catch (error) {
      if (identity !== state.selected?.id) return;
      status.textContent = (language === 'es' ? 'No se pudo leer el código: '
        : 'Could not read game source: ') + error.message;
      sourceCache.delete(file);
    }
  }
  $('asset-read-code').addEventListener('click', () => void showCurrentCode());
  $('asset-source-file').addEventListener('change', () => {
    updateFullSourceLink();
    $('asset-source-excerpt').hidden = true;
    $('asset-source-excerpt').textContent = '';
    $('asset-source-status').textContent = '';
  });

  function updateTags(entry) {
    const box = $('asset-tags');
    box.replaceChildren();
    const terms = (entry.tags || []).filter((term) =>
      term && term !== entry.region && term !== entry.subcategory);
    for (const term of terms.slice(0, 5)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = human(term);
      button.title = language === 'es'
        ? 'Buscar otros recursos con esta etiqueta'
        : 'Find other artwork with this tag';
      button.addEventListener('click', () => {
        $('asset-query').value = term;
        filtersChanged();
      });
      box.append(button);
    }
    box.hidden = !box.childElementCount;
  }

  async function inspect() {
    const entry = state.selected;
    if (!entry) return;
    const position = state.filtered.findIndex((item) => item.id === entry.id);
    $('asset-prev').disabled = position <= 0;
    $('asset-next').disabled = position < 0 || position >= state.filtered.length - 1;
    const gen = ++state.generation;
    $('asset-title').textContent = entry.name;
    $('asset-selection').textContent = statusText(entry) + ' · ' +
      (language === 'es' ? regionEs[entry.region] || entry.region : entry.region);
    updateViewButtons(entry);
    metadata(entry);
    updateTags(entry);
    displaySourceDefinition(entry);
    const explain = {
      current: 'The current game renderer decides whether this state uses a sprite or a procedural drawing.',
      procedural: 'Shows the current code-drawn appearance, even if the game normally selects a sprite.',
      raster: 'Shows a registered or preserved raster. A retained sprite is not necessarily used in the game.',
      compare: 'Both versions use the same inspection state and zoom. They are isolated artwork, not a whole gameplay scene.',
    };
    $('asset-view-help').textContent = language === 'es'
      ? {
        current: 'El renderizador decide si este estado usa un sprite o un dibujo procedural.',
        procedural: 'Muestra el dibujo generado por el código, aunque el juego use un sprite.',
        raster: 'Muestra el sprite registrado o conservado. No necesariamente se usa en el juego.',
        compare: 'Ambos usan el mismo estado y escala; no representan una escena completa.',
      }[state.view] : explain[state.view];
    const compare = state.view === 'compare';
    $('asset-secondary-frame').hidden = !compare;
    $('asset-preview-grid').dataset.compare = String(compare);
    const firstMode = compare ? 'procedural' : state.view;
    const secondMode = 'raster';
    $('asset-caption').textContent = firstMode === 'raster'
      ? word('spriteCaption','Registered or retained sprite')
      : firstMode === 'procedural' ? word('proceduralCaption','Current procedural drawing')
        : word('gameCaption','What the game selects for this fixture');
    $('asset-secondary-caption').textContent = word('compareCaption','Registered or retained sprite');
    const fixture = activeState(entry);
    const [first, second] = await Promise.all([
      paint($('asset-preview'), entry, firstMode, fixture, gen),
      compare ? paint($('asset-secondary'), entry, secondMode, fixture, gen) : Promise.resolve(true),
    ]);
    if (gen !== state.generation) return;
    $('asset-preview-note').textContent = !first || !second
      ? word('previewUnavailable','This source fixture cannot be isolated reliably here. No image has been invented.')
      : (language === 'es' ? 'Estudio de recurso aislado · ' : 'Isolated asset study · ') +
        (state.scale === 'close'
          ? word('studioClose','studio close-up (magnified, not game scale)')
          : Math.round(Number(state.scale) * 100) + '% ' + word('gameScale','game scale')) +
        ' · ' + (state.light === 'night'
          ? word('nightGrade','night studio grade') : word('dayGrade','day studio')) +
        '. ' + word('isolatedCaveat',
          'This is not a full gameplay screenshot or device-renderer acceptance.');
  }
  function selectedUrl() {
    const link = new URL(location.href);
    link.search = '';
    link.hash = '';
    if (state.selected) link.searchParams.set('asset', state.selected.id);
    if (state.variant > 0) link.searchParams.set('state', String(state.variant));
    if (language === 'es') link.searchParams.set('lang','es');
    if (state.collection === 'dated') link.searchParams.set('collection', 'dated');
    if (state.collection === 'all') link.searchParams.set('collection', 'all');
    return link.href;
  }
  function reflectUrl() {
    if (state.selected) history.replaceState(null, '', selectedUrl());
  }
  function selectAsset(id, variant = 0, scrollToInspector = true) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry) return;
    if (!belongsToCollection(entry)) {
      state.collection = entry.sourceKind === 'dated-reference' ||
        entry.sourceKind === 'archived-material' ? 'dated' : 'current';
      updateCollectionControls();
      optionCounts();
      progressiveFacets();
      renderCards();
    }
    state.selected = entry;
    $('asset-note').value = reviewNotes.get(id) || '';
    state.variant = Math.min(variant, Math.max(0, statesFor(entry).length - 1));
    state.view = 'current';
    rebuildStates(entry);
    updateViewButtons(entry);
    reflectUrl();
    for (const node of $('asset-grid').querySelectorAll('.asset-card'))
      node.setAttribute('aria-current', String(node.querySelector('canvas')?.dataset.assetId === id));
    void inspect();
    if (scrollToInspector && matchMedia('(max-width: 780px)').matches)
      $('asset-inspector').scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  async function copy(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const old = button.textContent;
      button.textContent = word('copied','Copied');
      button.disabled = true;
      setTimeout(() => { button.textContent = old; button.disabled = false; }, 1250);
    } catch {
      $('asset-preview-note').textContent = word('clipboardUnavailable',
        'Clipboard unavailable here. Your exact asset link: ') + ' ' + selectedUrl();
    }
  }
  function syncVisibleSelection() {
    if (!state.filtered.length) {
      state.selected = null;
      $('asset-inspector').hidden = true;
      return;
    }
    $('asset-inspector').hidden = false;
    if (!state.filtered.some((entry) => entry.id === state.selected?.id))
      selectAsset(state.filtered[0].id, 0, false);
    else void inspect();
  }
  function filtersChanged({ rebuildFacets = false } = {}) {
    state.visible = 24;
    if (rebuildFacets) progressiveFacets();
    renderCards();
    syncVisibleSelection();
  }
  $('asset-query').addEventListener('input', () => filtersChanged());
  for (const id of ['asset-group', 'asset-region'])
    $(id).addEventListener('change', () => filtersChanged({ rebuildFacets: true }));
  for (const id of ['asset-subcategory', 'asset-area', 'asset-kind'])
    $(id).addEventListener('change', () => filtersChanged());
  document.querySelector('.library-collection').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-collection]');
    if (!button) return;
    state.collection = button.dataset.collection;
    updateCollectionControls();
    optionCounts();
    filtersChanged({ rebuildFacets: true });
  });
  $('asset-reset').addEventListener('click', () => {
    for (const id of ['asset-query', 'asset-group', 'asset-region', 'asset-kind',
      'asset-subcategory', 'asset-area']) $(id).value = '';
    filtersChanged({ rebuildFacets: true });
  });
  $('asset-more').addEventListener('click', () => {
    state.visible += 24;
    renderCards();
  });
  $('asset-view-buttons').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (!button || button.disabled) return;
    state.view = button.dataset.view;
    void inspect();
  });
  $('asset-state').addEventListener('change', () => {
    state.variant = Number($('asset-state').value) || 0;
    reflectUrl();
    void inspect();
  });
  for (const id of ['asset-revision', 'asset-light', 'asset-scale']) {
    $(id).addEventListener('change', () => {
      state.light = $('asset-light').value;
      state.scale = $('asset-scale').value;
      void inspect();
    });
  }
  function next(direction) {
    if (!state.filtered.length || !state.selected) return;
    let i = state.filtered.findIndex((e) => e.id === state.selected.id);
    if (i < 0) i = direction > 0 ? -1 : state.filtered.length;
    const index = Math.max(0, Math.min(state.filtered.length - 1, i + direction));
    const candidate = state.filtered[index];
    if (candidate) {
      // Browsing from the inspector automatically reveals the next page of
      // cards, rather than selecting an invisible item offscreen.
      if (index >= state.visible) {
        state.visible = Math.ceil((index + 1) / 24) * 24;
        renderCards();
      }
      selectAsset(candidate.id);
    }
  }
  $('asset-prev').addEventListener('click', () => next(-1));
  $('asset-next').addEventListener('click', () => next(1));
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    if (event.key === 'ArrowLeft') next(-1);
    if (event.key === 'ArrowRight') next(1);
  });
  $('asset-copy').addEventListener('click', () => copy(selectedUrl(), $('asset-copy')));
  $('asset-note').addEventListener('input', () => {
    if (state.selected) reviewNotes.set(state.selected.id, $('asset-note').value);
  });
  $('asset-copy-note').addEventListener('click', () => copy(
    'Sprite Showroom art review\nAsset: ' + state.selected.id +
    '\nLink: ' + selectedUrl() +
    '\nObservation: ' + $('asset-note').value.trim(),
    $('asset-copy-note'),
  ));
  window.addEventListener('popstate', () => {
    const params = new URL(location.href).searchParams;
    const id = params.get('asset');
    if (id && state.entries.some((e) => e.id === id)) selectAsset(id, Number(params.get('state') || 0));
  });
  function renderTotal() {
    $('library-count').textContent = language === 'es'
      ? state.entries.length + ' ' + spanish.visualEntries + ' · ' +
        index.counts.currentWorldIdentities + ' ' + spanish.currentWorld + ' · ' +
        index.counts.liveRegistrations + ' ' + spanish.registeredSprites + ' · ' +
        index.counts.datedReviewCases + ' ' + spanish.datedCases
      : state.entries.length + ' browsable visual entries · ' +
        index.counts.currentWorldIdentities + ' current-source identities · ' +
        index.counts.liveRegistrations + ' registered sprites · ' +
        index.counts.datedReviewCases + ' dated reference cases';
  }
  $('asset-language').addEventListener('change', () => {
    language = $('asset-language').value === 'es' ? 'es' : 'en';
    localeStatic();
    renderTotal();
    relabelVisibleCards();
    if (state.selected) {
      rebuildStates(state.selected);
      void inspect();
      reflectUrl();
    }
  });
  localeStatic();
  renderCards();
  const params = new URL(location.href).searchParams;
  const selectedId = params.get('asset');
  selectAsset(state.entries.some((e) => e.id === selectedId)
    ? selectedId : state.entries[0]?.id, Number(params.get('state') || 0));
  renderTotal();
  window.SpriteShowroom = {
    ready: true, mode: 'library', entries: state.entries.length,
    select: (id) => selectAsset(id),
  };

}
