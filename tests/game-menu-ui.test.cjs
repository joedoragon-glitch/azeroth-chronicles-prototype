'use strict';
const assert = require('node:assert/strict'),
  { shell } = require('./helpers/production-shell.cjs');
for (const language of ['en', 'es']) {
  const { scope: s, elements: e, storage, events } = shell(language),
    g = s.Prototype.game;
  const t = (en, es) => (language === 'en' ? en : es);
  const click = (prefix) => {
    const button = e.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
    assert(button, prefix + ' missing from ' + e.get('modal-title').textContent);
    assert(!button.disabled, prefix + ' disabled');
    button.click();
  };
  const title = (en, es) => assert.equal(e.get('modal-title').textContent, t(en, es));
  const back = () => e.get('close-button').click();
  const short = () =>
    assert(e.get('modal-description').textContent.trim().split(/\s+/).length <= 45);
  e.get('menu-button').click();
  assert.equal(e.get('modal-actions').children.length, 5);
  for (const label of [
    t('Character', 'Personaje'),
    t('Quest journal', 'Diario de misiones'),
    t('Game and settings', 'Juego y ajustes'),
  ])
    assert(e.get('modal-actions').children.some((b) => b.textContent === label));
  const initial = JSON.stringify(g.snapshot());
  click(t('Character', 'Personaje'));
  short();
  click(t('Inventory and support', 'Inventario y apoyo'));
  title('Inventory', 'Inventario');
  short();
  const inventorySummary = e.get('modal-description');
  assert.equal(e.get('modal-actions').children.length, 1, 'only actionable Equipment stays a button');
  assert.equal(inventorySummary.children.length, 2, 'support and tonics render in the same Inventory view');
  const info = (en, es) => {
    const section = inventorySummary.children.find((section) =>
      section.children[0]?.textContent === t(en, es));
    assert(section, en + ' information visible without another screen');
    return section.children[1]?.textContent || '';
  };
  assert(info('Ranger support', 'Apoyo del Ranger').includes(String(g.rangerSupportAmount('health'))));
  assert(info('Preparation Tonics', 'Tónicos de preparación').includes(String(g.preparationTonicStock())));
  click(t('Equipment', 'Equipo'));
  short();
  back();
  title('Inventory', 'Inventario');
  assert.equal(inventorySummary.children.length, 2, 'returning from Equipment preserves the summaries');
  back();
  title('Character', 'Personaje');
  click(t('Skill journal', 'Diario de habilidades'));
  short();
  click(t('Training and companions', 'Entrenamiento y compañeros'));
  short();
  click(t('Companion combat skills', 'Habilidades de combate de compañeros'));
  assert(e.get('modal-description').textContent.includes('Power Strike'));
  back();
  back();
  back();
  title('Character', 'Personaje');
  click(t('Talents', 'Talentos'));
  short();
  back();
  back();
  title('Adventure menu', 'Menú de aventura');
  click(t('Quest journal', 'Diario de misiones'));
  assert(e.get('modal-actions').children.some((b) => b.textContent.includes('Mira')));
  click(t('Announcements', 'Anuncios'));
  short();
  back();
  title('Quest journal', 'Diario de misiones');
  back();
  click(t('Game and settings', 'Juego y ajustes'));
  click(t('Screen and performance', 'Pantalla y rendimiento'));
  title('Screen and performance', 'Pantalla y rendimiento');
  short();
  const rows = () => e.get('modal-actions').children;
  const setting = (en, es = en) => {
    const label = t(en, es);
    const row = rows().find((child) =>
      child.className === 'menu-setting' &&
      child.children.some((item) => item.textContent === label));
    assert(row, 'missing inline setting ' + label);
    return row.children.find((child) => child.className === 'menu-setting-input');
  };
  const selectSetting = (en, es, value) => {
    const control = setting(en, es);
    assert(control, 'missing control ' + en);
    control.value = value;
    control.onchange();
    title('Screen and performance', 'Pantalla y rendimiento');
    assert(!e.get('modal').hidden, 'setting should not close the unified window');
  };
  const section = (en, es = en) => {
    assert(rows().some((node) => node.className === 'menu-section' && node.textContent === t(en, es)));
  };
  section('Display', 'Pantalla');
  section('Graphics', 'Gráficos');
  section('Frame rate', 'Fotogramas por segundo');
  section('Graphics renderer', 'Motor gráfico');
  section('Diagnostics', 'Diagnósticos');
  assert.equal(rows().filter((r) => r.className === 'menu-setting').length, 5);
  const canvas = setting('Graphics renderer', 'Motor gráfico');
  assert(canvas.children.some((o) => o.value === 'canvas2d'));
  assert(canvas.children.some((o) => o.value === 'webgl2'));
  assert.equal(s.Prototype.experimentalGraphics.mode, 'canvas2d');

  selectSetting('Screen layout', 'Disposición de pantalla', 'phone');
  assert.equal(s.Prototype.platform.mode, 'phone');
  assert.equal(storage.get(s.PrototypePlatform.preferenceKey), 'phone');
  selectSetting('Camera zoom', 'Zoom de cámara', '1.5');
  assert.equal(s.Prototype.platform.cameraZoom, 1.5);
  assert.equal(JSON.parse(storage.get(s.PrototypePlatform.cameraPreferenceKey)).phone, 1.5);

  click(language === 'en' ? 'Optimization Mode' : 'Modo de optimización');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'on');
  for (const resolution of ['native', 'auto', '100', '80', '60', '50']) {
    selectSetting('Rendering resolution', 'Resolución de renderizado', resolution);
    assert.equal(s.Prototype.renderResolution.preference, resolution);
    assert.equal(storage.get(s.PrototypeRuntime.resolutionPreferenceKey), resolution);
  }
  selectSetting('Rendering resolution', 'Resolución de renderizado', 'auto');
  click(language === 'en' ? 'Optimization Mode' : 'Modo de optimización');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'off');

  assert.equal(s.Prototype.fps.preference, 'auto');
  assert.equal(s.Prototype.fps.target, 30);
  for (const value of ['60', '30', '20', 'auto60', 'auto']) {
    selectSetting('Frame rate', 'Fotogramas por segundo', value);
    assert.equal(s.Prototype.fps.preference, value);
    assert.equal(storage.get(s.PrototypeRuntime.fpsPreferenceKey), value);
    if (value === '20') assert.equal(s.Prototype.fps.target, 20);
  }
  assert.equal(s.Prototype.frameSkip.enabled, false, 'Off by default');
  click(t('Adaptive frame skip', 'Salto adaptativo de fotogramas'));
  assert.equal(s.Prototype.frameSkip.enabled, true);
  assert.equal(storage.get(s.PrototypeRuntime.frameSkipPreferenceKey), 'on');
  click(t('Adaptive frame skip', 'Salto adaptativo de fotogramas'));
  assert.equal(s.Prototype.frameSkip.enabled, false);
  assert.equal(storage.get(s.PrototypeRuntime.frameSkipPreferenceKey), 'off');

  click(t('Show performance details', 'Mostrar detalles de rendimiento'));
  title('Screen and performance', 'Pantalla y rendimiento');
  assert(rows().some((node) => node.textContent === t('Performance details', 'Detalles de rendimiento')));
  click(t('Reset performance sample', 'Reiniciar muestra de rendimiento'));
  title('Screen and performance', 'Pantalla y rendimiento');
  click(t('Hide performance details', 'Ocultar detalles de rendimiento'));
  assert(!rows().some((node) => node.textContent === t('Performance details', 'Detalles de rendimiento')));
  back();
  title('Game and settings', 'Juego y ajustes');
  click(t('Sound settings', 'Ajustes de sonido'));
  title('Music and sound', 'Música y sonido');
  short();
  // Instrument the actual shell's localStorage adapter. Audio already persists
  // to its profile; dragging should never rewrite the entire campaign save.
  const writes = [];
  const originalSet = storage.set.bind(storage);
  storage.set = (key, value) => {
    writes.push(key);
    return originalSet(key, value);
  };
  const soundRows = () => e.get('modal-actions').children;
  const channels = [
    ['master', 'Master volume', 'Volumen general'],
    ['music', 'Music volume', 'Volumen de música'],
    ['ambience', 'Ambience volume', 'Volumen ambiental'],
    ['effects', 'Effects volume', 'Volumen de efectos'],
    ['interface', 'Interface volume', 'Volumen de interfaz'],
  ];
  const soundSlider = (en, es) => {
    const row = soundRows().find(
      (child) =>
        child.className === 'menu-setting' &&
        child.children.some((item) => item.textContent === t(en, es)),
    );
    assert(row, 'missing volume row: ' + en);
    const input = row.children.find((child) => child.className === 'menu-setting-input');
    const output = row.children[2];
    assert(input && output, 'volume slider and current percentage are both visible');
    return { input, output };
  };
  assert.equal(soundRows().filter((node) => node.className === 'menu-setting').length, 5);
  assert(soundRows().some((node) => node.className === 'menu-section'));
  const originalVolumes = Object.fromEntries(
    channels.map(([key]) => [key, s.Prototype.audio.settings[key] ?? s.Prototype.audio.settings.effects]),
  );
  for (const [key, en, es] of channels) {
    const { input, output } = soundSlider(en, es);
    assert.equal(input.value, Math.round(originalVolumes[key] * 100));
    assert.equal(output.textContent, Math.round(originalVolumes[key] * 100) + '%');
    for (const percent of [0, 100, 37]) {
      input.value = String(percent);
      input.oninput();
      assert(Math.abs(s.Prototype.audio.settings[key] - percent / 100) < 1e-9);
      assert.equal(output.textContent, percent + '%', 'displayed percentage follows slider');
      assert.equal(
        JSON.parse(storage.get(s.PrototypePersistence.profileKey)).audio[key],
        percent / 100,
        'each audio channel persists immediately',
      );
      title('Music and sound', 'Música y sonido');
      assert(!e.get('modal').hidden, 'adjusting any slider keeps the sound window open');
    }
    input.value = String(Math.round(originalVolumes[key] * 100));
    input.oninput();
  }
  click(t('Mute all sound', 'Silenciar todo'));
  assert(s.Prototype.audio.settings.muted);
  assert.equal(
    JSON.parse(storage.get(s.PrototypePersistence.profileKey)).audio.muted,
    true,
  );
  for (const [key] of channels)
    assert(Math.abs((s.Prototype.audio.settings[key] ?? s.Prototype.audio.settings.effects) - originalVolumes[key]) < 1e-9,
      'mute preserves every saved channel level');
  click(t('Mute all sound', 'Silenciar todo'));
  assert(!s.Prototype.audio.settings.muted);
  assert.equal(JSON.parse(storage.get(s.PrototypePersistence.profileKey)).audio.muted, false);
  back();
  title('Game and settings', 'Juego y ajustes');
  click(t('Sound settings', 'Ajustes de sonido'));
  title('Music and sound', 'Música y sonido');
  for (const [key, en, es] of channels) {
    const slider = soundSlider(en, es);
    assert.equal(slider.output.textContent, Math.round(originalVolumes[key] * 100) + '%');
  }
  // 5 channels × (0%, 100%, 37%, restored) plus two mute changes:
  // each persists the small audio profile, none serializes the campaign.
  assert.equal(writes.filter((key) => key === s.PrototypePersistence.profileKey).length, 22,
    'every audio adjustment persists its own profile change');
  assert.equal(writes.filter((key) => key === 'azeroth-v4-normal').length, 0,
    'sound sliders and mute must not trigger full-campaign saves');
  storage.set = originalSet;
  back();
  click(t('Install on phone', 'Instalar en el teléfono'));
  short();
  back();
  click(t('Language', 'Idioma'));
  click(language === 'en' ? 'English' : 'Español');
  title('Game and settings', 'Juego y ajustes');
  click(t('Controls', 'Controles'));
  short();
  assert.equal(e.get('modal-actions').children.length, 5);
  click(t('Movement and menus', 'Movimiento y menús'));
  short();
  back();
  click(t('Skills and targeting', 'Habilidades y objetivos'));
  short();
  for (const [en, es] of [
    ['Using skills', 'Usar habilidades'],
    ['Queued skills', 'Habilidades en cola'],
    ['Targeting and dodging', 'Apuntar y esquivar'],
  ]) {
    click(t(en, es));
    short();
    back();
  }
  click(t('Combat conditions', 'Estados de combate'));
  back();
  back();
  click(t('Companion commands', 'Órdenes de compañeros'));
  short();
  back();
  click(t('Customize keyboard', 'Personalizar teclado'));
  title('Customize keyboard', 'Personalizar teclado');
  assert.equal(s.Prototype.input.preferences.preset, 'right');
  assert.equal(
    e.get('modal-actions').children.filter((node) => node.className === 'menu-section').length,
    2,
  );
  const groupPaths = [
    ['Movement and menu keys', 'Teclas de movimiento y menú',
      ['up', 'down', 'left', 'right', 'confirm']],
    ['Skills and combat keys', 'Teclas de habilidades y combate',
      ['skill1', 'skill2', 'skill3', 'skill4', 'skill5', 'skill6', 'skill7', 'skill8', 'target', 'heal', 'mana']],
    ['Companion and utility keys', 'Teclas de compañeros y utilidades',
      ['doctrine', 'recall', 'map', 'training', 'skills', 'pause', 'help']],
  ];
  for (const [en, es, ids] of groupPaths) {
    click(t(en, es));
    title(en, es);
    assert.equal(
      e.get('modal-actions').children.length,
      s.Prototype.input.actions.filter(([id]) => ids.includes(id)).length,
      'each editable keyboard action appears in exactly one category',
    );
    back();
    title('Customize keyboard', 'Personalizar teclado');
    assert(
      e.get('modal-actions').children.some((node) => node.textContent.startsWith(t(en, es))),
      'keyboard root stays available',
    );
  }
  click(t('Classic · number keys', 'Clásico · teclas numéricas'));
  title('Apply keyboard preset', 'Aplicar distribución de teclado');
  click(t('Keep current keys', 'Conservar teclas actuales'));
  assert.equal(s.Prototype.input.preferences.preset, 'right', 'cancel keeps defaults');
  click(t('Classic · number keys', 'Clásico · teclas numéricas'));
  click(t('Apply preset', 'Aplicar distribución'));
  assert.equal(s.Prototype.input.actionFor('Digit1'), 'skill1');
  assert.equal(s.Prototype.input.actionFor('KeyI'), null);
  assert.equal(s.Prototype.input.actionFor('KeyJ'), null);
  click(t('Left-hand skills (IJKL)', 'Habilidades con mano izquierda (IJKL)'));
  click(t('Apply preset', 'Aplicar distribución'));
  assert.equal(s.Prototype.input.actionFor('KeyI'), 'up');
  assert.equal(s.Prototype.input.actionFor('KeyR'), 'skill8');
  click(t('Right-hand skills (WASD) · Default', 'Habilidades con mano derecha (WASD) · Predeterminado'));
  click(t('Apply preset', 'Aplicar distribución'));
  assert.equal(s.Prototype.input.actionFor('KeyJ'), 'skill1');
  assert.equal(s.Prototype.input.actionFor('Space'), 'skill6');
  assert.equal(s.Prototype.input.actionFor('KeyR'), null);
  assert.equal(s.Prototype.input.actionFor('KeyT'), null);

  click(t('Companion and utility keys', 'Teclas de compañeros y utilidades'));
  title('Companion and utility keys', 'Teclas de compañeros y utilidades');
  const mapBind = e.get('modal-actions').children.find(
    (button) => button.textContent.endsWith(' · Z'),
  );
  assert(mapBind, 'Map binding should be visible');
  mapBind.click();
  assert(e.get('modal-title').textContent.startsWith('Bind '), 'binding prompt is preserved');
  events.keydown.forEach((fn) => fn({ code: 'F9', preventDefault() {} }));
  assert.equal(s.Prototype.input.actionFor('F9'), 'map');
  title('Companion and utility keys', 'Teclas de compañeros y utilidades');
  const updated = e.get('modal-actions').children.find(
    (button) => button.textContent.endsWith(' · F9'),
  );
  assert(updated?.classList.contains('selected'), 'key capture returns to selected action');
  updated.click();
  events.keydown.forEach((fn) => fn({ code: 'KeyZ', preventDefault() {} }));
  assert.equal(s.Prototype.input.actionFor('KeyZ'), 'map');
  assert.equal(s.Prototype.input.preferences.preset, 'right');
  back();
  title('Customize keyboard', 'Personalizar teclado');
  back();
  title('Controls', 'Controles');

  click(t('Touch and mouse options', 'Opciones táctiles y de ratón'));
  title('Touch and mouse options', 'Opciones táctiles y de ratón');
  const controls = e.get('modal-actions').children;
  assert.equal(controls.filter((node) => node.className === 'menu-section').length, 2);
  const phoneRow = controls.find(
    (node) => node.className === 'menu-setting' &&
      node.children.some((child) => child.textContent === t('Phone layout', 'Disposición táctil')),
  );
  assert(phoneRow, 'phone layout dropdown is visible');
  const phoneSelect = phoneRow.children.find((child) => child.className === 'menu-setting-input');
  const initialPhoneLayout = s.Prototype.input.preferences.phoneLayout;
  phoneSelect.value = 'left-hand';
  phoneSelect.onchange();
  assert.equal(s.Prototype.input.preferences.phoneLayout, 'left-hand');
  assert.equal(JSON.parse(storage.get(s.PrototypeInput.preferenceKey)).phoneLayout, 'left-hand');
  phoneSelect.value = initialPhoneLayout;
  phoneSelect.onchange();

  const toggle = (en, es) => {
    const node = e.get('modal-actions').children.find(
      (item) => item.textContent.startsWith(t(en, es)),
    );
    assert(node && node.className === 'menu-setting-toggle', 'missing inline toggle ' + en);
    return node;
  };
  for (const [key, en, es] of [
    ['touchMove', 'Touch tap-to-move', 'Tocar para moverse'],
    ['mouseMove', 'Mouse click-to-move', 'Clic para moverse'],
  ]) {
    const before = s.Prototype.input.preferences[key];
    toggle(en, es).click();
    assert.equal(s.Prototype.input.preferences[key], !before);
    assert.equal(JSON.parse(storage.get(s.PrototypeInput.preferenceKey))[key], !before);
    title('Touch and mouse options', 'Opciones táctiles y de ratón');
    assert(!e.get('modal').hidden, 'touch/mouse toggles never close settings');
    toggle(en, es).click();
    assert.equal(s.Prototype.input.preferences[key], before);
  }
  back();
  title('Controls', 'Controles');
  back();
  title('Game and settings', 'Juego y ajustes');
  click(t('Save and game management', 'Partidas guardadas'));
  short();
  assert.equal(e.get('modal-actions').children.length, 5);
  click(t('Save backups', 'Copias de seguridad'));
  short();
  assert.equal(e.get('modal-actions').children.length, 2);
  back();
  click(t('New game', 'Nueva partida'));
  short();
  assert(
    e
      .get('modal-actions')
      .children.find((b) =>
        b.textContent.startsWith(t('New game in Nightmare Mode', 'Nueva partida Pesadilla')),
      ).disabled,
  );
  back();
  back();
  back();
  assert.equal(
    JSON.stringify(g.snapshot()),
    initial,
    'Reading menus and device settings preserve the campaign',
  );

  // Navigation remains usable after moving Clear waypoint off the root menu.
  click(t('Map and travel routes', 'Mapa y rutas de viaje'));
  short();
  const place = g.mapDestinations().find((p) => g.navigationTarget(p));
  assert(place);
  click((place.icon || '•') + ' ' + place.name);
  click(t('Navigate', 'Ir'));
  assert(e.get('modal').hidden);
  assert.equal(g.hero.order.type, 'move');
  assert(g.hero.path.length);
  e.get('menu-button').click();
  click(t('Quest journal', 'Diario de misiones'));
  click(t('Your First Company', 'Tu primera compañía'));
  assert.equal(s.Prototype.trackedQuest, 'quest-barracks');
  e.get('menu-button').click();
  assert(
    !e
      .get('modal-actions')
      .children.some((b) => b.textContent === t('Clear waypoint', 'Quitar ruta')),
  );
  click(t('Map and travel routes', 'Mapa y rutas de viaje'));
  click(t('Clear waypoint', 'Quitar ruta'));
  assert.equal(s.Prototype.trackedWaypoint, null);

  // Remaining keyboard shortcuts still open their pages directly.
  for (const [code, en, es] of [
    ['KeyC', 'Talents', 'Talentos'],
    ['KeyX', 'Skill journal', 'Diario de habilidades'],
    ['KeyG', 'Controls', 'Controles'],
  ]) {
    s.Prototype.closeMenu();
    events.keydown.forEach((fn) => fn({ code, preventDefault() {} }));
    title(en, es);
  }
  s.Prototype.closeMenu();
  for (const code of ['KeyR','KeyT']){
    events.keydown.forEach(fn=>fn({code,preventDefault(){}}));
    assert(e.get('modal').hidden, code+' does not open an Inventory/Quest shortcut');
  }
}
console.log(
  'PASS bilingual menus, WASD/right-hand default, keyboard preset switching, no Inventory/Quest shortcuts and unchanged campaign',
);
