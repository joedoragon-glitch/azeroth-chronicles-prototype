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
      script.src = new URL('src/prototype/' + name + '.js', rootUrl).href;
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
    for (const name of scriptOwners) await loadScript(name);
    const response = await indexResponse;
    if (!response.ok) throw Error('The published visual catalog is unavailable');
    index = await response.json();
    if (index.schemaVersion !== 1 || !Array.isArray(index.entries))
      throw Error('Invalid visual catalog version');
    if (!await PrototypeSprites.preload(new URL('assets/sprites/manifest.json', rootUrl).href))
      throw Error('The sprite registry is unavailable');
  } catch (error) {
    $('library-count').textContent = 'Could not open showroom: ' + error.message;
    window.SpriteShowroom = { ready: false, mode: 'library', error: error.message };
    return;
  }
  const state = {
    entries: index.entries,
    filtered: [],
    visible: 24,
    selected: null,
    view: 'current',
    variant: 0,
    light: 'day',
    scale: 1.5,
    generation: 0,
  };
  const imageCache = new Map();
  const reviewNotes = new Map();
  const groups = [...new Set(state.entries.map((e) => e.group))].sort();
  const regions = [...new Set(state.entries.map((e) => e.region))].sort();
  for (const [id, values] of [['asset-group', groups], ['asset-region', regions]]) {
    for (const name of values) $(id).add(new Option(name, name));
  }
  const human = (v) => String(v || '').replace(/[:_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  function statesFor(entry) {
    return [...entry.states, ...(entry.datedStates || []).map((s) => ({
      ...s, label: s.label + ' · Oct 2026 fixture',
    }))];
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
  async function paint(canvas, entry, visual, fixture, generation, thumb = false) {
    const logicalWidth = 480, logicalHeight = 340, density = thumb ? 1 : 1.5;
    canvas.width = logicalWidth * density;
    canvas.height = logicalHeight * density;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.setTransform(density, 0, 0, density, 0, 0);
    stageBackground(ctx, logicalWidth, logicalHeight, state.light);
    const zoom = thumb ? 1.45 : state.scale;
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
      return entry.sourceKind === 'archived-material' ? 'Historical material · not in the current game'
        : 'Registered road material';
    const fixture = activeState(entry);
    const selected = fixture?.entity
      ? (PrototypeSprites.definitionFor(fixture.entity, fixture.region) ? 'raster' : 'procedural')
      : entry.representation;
    const use = selected === 'raster' ? 'Raster selected by this fixture'
      : selected === 'procedural' ? 'Procedural selected by this fixture'
        : 'Reference unavailable';
    return (entry.sourceKind === 'dated-reference' ? 'Dated review fixture · ' : '') + use;
  }
  function filterResults() {
    const query = $('asset-query').value.trim().toLowerCase();
    const group = $('asset-group').value, region = $('asset-region').value;
    const kind = $('asset-kind').value;
    state.filtered = state.entries.filter((entry) => {
      if (group && entry.group !== group) return false;
      if (region && entry.region !== region) return false;
      if (query && ![entry.id, entry.name, entry.region, entry.group]
        .join(' ').toLowerCase().includes(query)) return false;
      if (kind === 'raster' && entry.representation !== 'raster') return false;
      if (kind === 'procedural' && entry.representation !== 'procedural') return false;
      if (kind === 'retained' && !rasterAvailable(entry)) return false;
      if (kind === 'dated' && entry.sourceKind !== 'dated-reference') return false;
      if (kind === 'material' && !isMaterial(entry)) return false;
      return true;
    });
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
  function card(entry) {
    const button = document.createElement('button');
    button.className = 'asset-card';
    button.type = 'button';
    button.setAttribute('role', 'listitem');
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
    meta.textContent = entry.region;
    const status = document.createElement('span');
    status.className = 'library-card-state';
    status.textContent = entry.sourceKind === 'dated-reference' ? 'Review fixture · Oct 2026'
      : isMaterial(entry) ? 'Material' : entry.representation === 'raster'
        ? 'Sprite selected' : 'Procedural selected';
    body.append(title, meta, status);
    button.append(thumb, body);
    button.addEventListener('click', () => selectAsset(entry.id));
    if (observer) observer.observe(canvas);
    else void paint(canvas, entry, entry.representation === 'raster' ||
      isMaterial(entry) ? 'raster' : 'current', entry.states?.[0] || null, state.generation, true);
    return button;
  }
  function renderCards() {
    filterResults();
    if (observer) observer.disconnect();
    const grid = $('asset-grid');
    grid.replaceChildren(...state.filtered.slice(0, state.visible).map(card));
    $('asset-results').textContent = state.filtered.length + ' matching artworks · ' +
      Math.min(state.visible, state.filtered.length) + ' shown';
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
      select.add(new Option(states[i].label, String(i)));
    select.disabled = states.length < 2;
    select.value = String(Math.min(state.variant, states.length - 1));
    const versions = $('asset-revision');
    versions.replaceChildren();
    if (entry.registeredRaster)
      versions.add(new Option(entry.sourceKind === 'archived-material' ? 'Retired material'
        : 'Registered sprite / material', entry.registeredRaster));
    for (const h of entry.archive || []) {
      if (h.src === entry.registeredRaster) continue;
      versions.add(new Option('Preserved revision ' + String(h.revision).slice(0, 10), h.src));
    }
    for (const [clipName, clip] of Object.entries(entry.spriteEntry?.clips || {})) {
      for (let i = 0; i < (clip.frames || []).length; i++) {
        const frame = clip.frames[i];
        if (frame.src && ![...versions.options].some((o) => o.value === frame.src))
          versions.add(new Option('Animation · ' + clipName + ' · frame ' + (i + 1), frame.src));
      }
    }
    versions.disabled = versions.options.length < 2;
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
      ['Stable ID', entry.id],
      ['Category', entry.group],
      ['Location', entry.region],
      ['Source', entry.sourceKind === 'dated-reference' ? 'October 2026 review case'
        : entry.sourceKind === 'current-contract' ? 'Current exact sprite-processing fixture'
          : entry.sourceKind],
      ['Renderer selection', entry.representation],
      ['Catalog number', entry.catalogId || 'Not assigned'],
      ['Active raster identity', entry.activeSpriteKey || 'None for this fixture'],
      ['Registered revision', entry.revision || 'No registered raster revision'],
      ['Preserved raster versions', String(entry.archive?.length || 0)],
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
  async function inspect() {
    const entry = state.selected;
    if (!entry) return;
    const gen = ++state.generation;
    $('asset-title').textContent = entry.name;
    $('asset-selection').textContent = statusText(entry) + ' · ' + entry.region;
    updateViewButtons(entry);
    metadata(entry);
    const compare = state.view === 'compare';
    $('asset-secondary-frame').hidden = !compare;
    $('asset-preview-grid').dataset.compare = String(compare);
    const firstMode = compare ? 'procedural' : state.view;
    const secondMode = 'raster';
    $('asset-caption').textContent = firstMode === 'raster' ? 'Registered or retained sprite'
      : firstMode === 'procedural' ? 'Current procedural drawing'
        : 'What the game selects for this fixture';
    $('asset-secondary-caption').textContent = 'Registered or retained sprite';
    const fixture = activeState(entry);
    const [first, second] = await Promise.all([
      paint($('asset-preview'), entry, firstMode, fixture, gen),
      compare ? paint($('asset-secondary'), entry, secondMode, fixture, gen) : Promise.resolve(true),
    ]);
    if (gen !== state.generation) return;
    $('asset-preview-note').textContent = !first || !second
      ? 'This source fixture cannot be isolated reliably here. No image has been invented.'
      : 'Isolated asset study at ' + Math.round(state.scale * 100) +
        '% · ' + (state.light === 'night' ? 'night studio grade' : 'day studio') +
        '. This is not a full gameplay screenshot or device-renderer acceptance.';
  }
  function selectedUrl() {
    const link = new URL(location.href);
    link.search = '';
    link.hash = '';
    if (state.selected) link.searchParams.set('asset', state.selected.id);
    if (state.variant > 0) link.searchParams.set('state', String(state.variant));
    return link.href;
  }
  function reflectUrl() {
    if (state.selected) history.replaceState(null, '', selectedUrl());
  }
  function selectAsset(id, variant = 0) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry) return;
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
    if (matchMedia('(max-width: 780px)').matches)
      $('asset-inspector').scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  async function copy(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const old = button.textContent;
      button.textContent = 'Copied';
      button.disabled = true;
      setTimeout(() => { button.textContent = old; button.disabled = false; }, 1250);
    } catch {
      $('asset-preview-note').textContent = 'Clipboard unavailable here. Your exact asset link: ' + selectedUrl();
    }
  }
  for (const id of ['asset-query', 'asset-group', 'asset-region', 'asset-kind'])
    $(id).addEventListener(id === 'asset-query' ? 'input' : 'change', () => {
      state.visible = 24;
      renderCards();
    });
  $('asset-reset').addEventListener('click', () => {
    for (const id of ['asset-query', 'asset-group', 'asset-region', 'asset-kind']) $(id).value = '';
    state.visible = 24;
    renderCards();
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
      state.scale = Number($('asset-scale').value);
      void inspect();
    });
  }
  function next(direction) {
    if (!state.filtered.length || !state.selected) return;
    let i = state.filtered.findIndex((e) => e.id === state.selected.id);
    if (i < 0) i = direction > 0 ? -1 : state.filtered.length;
    const candidate = state.filtered[Math.max(0, Math.min(state.filtered.length - 1, i + direction))];
    if (candidate) selectAsset(candidate.id);
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
  renderCards();
  const params = new URL(location.href).searchParams;
  const selectedId = params.get('asset');
  selectAsset(state.entries.some((e) => e.id === selectedId)
    ? selectedId : state.entries[0]?.id, Number(params.get('state') || 0));
  $('library-count').textContent = index.counts.exactContracts +
    ' current sprite fixtures · ' + index.counts.liveRegistrations +
    ' registered sprites · ' + index.counts.datedReviewCases +
    ' dated visual review cases · ' + index.counts.currentMaterials + ' road materials';
  window.SpriteShowroom = {
    ready: true, mode: 'library', entries: state.entries.length,
    select: (id) => selectAsset(id),
  };

}
