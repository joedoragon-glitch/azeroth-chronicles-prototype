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
  assert.equal(e.get('modal-actions').children.length, 6);
  assert(!e.get('modal-actions').children.some((b) =>
    b.textContent.startsWith(t('Codices of the Unforeseen', 'Códices de lo Imprevisto'))),
    'critical Codices are discovered in-world, not managed in the main menu');
  for (const label of [
    t('Character', 'Personaje'),
    t('Quest journal', 'Diario de misiones'),
    t('Settings', 'Ajustes'),
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
  click(t('Settings', 'Ajustes'));
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
    assert(!e.get('modal').hidden, 'setting should leave its page open');
  };
  const section = (en, es = en) => {
    assert(rows().some((node) => node.className === 'menu-section' && node.textContent === t(en, es)));
  };
  // All screen, renderer, graphics and pacing settings are inline: no child pages.
  section('Renderer and recovery', 'Motor gráfico y recuperación');
  assert(!rows().some((node) => node.textContent.startsWith(
    t('Export playtest report', 'Exportar informe de prueba'))));
  assert(!rows().some((node) => ['menu-action', 'menu-action menu-highlight'].includes(node.className)),
    'Screen and performance has no navigation buttons');
  assert(!rows().some((node) => node.className === 'menu-section' &&
    node.textContent.startsWith(t('Preferred renderer', 'Motor gráfico preferido'))),
    'preferred renderer belongs to the selected graphics control, not a duplicate label');
  section('Active renderer', 'Motor gráfico activo');
  section('Effective density', 'Densidad efectiva');
  assert(!rows().some((node) => node.className === 'menu-section' &&
    [t('Display', 'Pantalla'), t('Canvas graphics', 'Gráficos de Canvas'),
      t('Frame pacing', 'Ritmo de fotogramas'),
      t('Active draw target', 'Objetivo de dibujo activo'),
      t('Active layout', 'Disposición activa'),
      t('Effective optimization', 'Optimización efectiva')].includes(node.textContent)),
    'redundant headings and status readouts should be absent');
  assert(!e.get('modal').textContent.includes('Choose phone or desktop controls. Your save stays the same.'),
    'unneeded layout explanation should be absent');
  assert.equal(rows().filter((r) => r.className === 'menu-setting').length, 6);

  // On a fresh title screen the Canvas DOM surface is not a failed Pixi world.
  // Migrations must be silent: no technical release announcements to players.
  const titleOnly = shell(language, 'paladin', {
    stayOnTitle: true,
    graphicsGuard: require('../tools/webgl-pilot/renderer-switch-guard.js'),
  });
  const titleElements = titleOnly.elements;
  const titleNotice = titleElements.get('startup-update-notice');
  assert(!/Performance settings updated|Ajustes de rendimiento actualizados/.test(titleNotice.textContent),
    'silent default migration does not announce itself on the title screen');
  titleElements.get('title-settings').click();
  const titleActions = () => titleElements.get('modal-actions').children;
  const screenEntry = titleActions().find((node) => node.textContent.startsWith(
    t('Screen and performance', 'Pantalla y rendimiento')));
  assert(screenEntry, 'Screen and performance is accessible from title settings');
  screenEntry.click();
  const titleSections = titleActions().filter((node) => node.className === 'menu-section');
  assert(!titleSections.some((node) => node.textContent === t('Pixi graphics', 'Gráficos de Pixi')),
    'no redundant Pixi graphics heading at the title screen');
  assert(titleActions().some((node) => node.textContent.includes(t('Optimization Mode', 'Modo de optimización'))),
    'Pixi optimization remains available inline on the title screen');
  assert(!titleSections.some((node) => node.textContent.startsWith(
    t('Active renderer', 'Motor gráfico activo'))),
    'do not present the title Canvas surface as a world renderer');
  assert(!titleSections.some((node) => node.textContent.startsWith(
    t('Renderer status', 'Estado del motor gráfico'))),
    'no false startup-failure warning before entering the game');
  const titleRenderer = titleActions().find((node) => node.className === 'menu-setting' &&
    node.children.some((child) => child.textContent === t('Graphics renderer', 'Motor gráfico')));
  assert(titleRenderer, 'renderer preference is editable without another submenu');
  const titleChoice = titleRenderer.children.find((node) => node.className === 'menu-setting-input');
  titleChoice.value = 'canvas2d';
  titleChoice.onchange();
  assert(titleActions().some((node) => node.className === 'menu-section' &&
    node.textContent === t('Canvas graphics', 'Gráficos de Canvas')),
    'explicitly selecting Canvas on title switches to its inline settings');
  const writes = [];
  const originalSet = storage.set.bind(storage);
  storage.set = (key, value) => {
    writes.push(key);
    return originalSet(key, value);
  };
  const canvas = setting('Graphics renderer', 'Motor gráfico');
  assert(canvas.children.some((o) => o.value === 'canvas2d'));
  assert(canvas.children.some((o) => o.value === 'webgl2'));
  assert.equal(s.Prototype.experimentalGraphics.mode, 'canvas2d');

  selectSetting('Graphics renderer', 'Motor gráfico', 'canvas2d');
  assert(setting('Optimization Mode', 'Modo de optimización'),
    'Canvas optimization remains available without a graphics heading');
  selectSetting('Screen layout', 'Disposición de pantalla', 'phone');
  assert.equal(s.Prototype.platform.mode, 'phone');
  assert.equal(storage.get(s.PrototypePlatform.preferenceKey), 'phone');
  selectSetting('Camera zoom', 'Zoom de cámara', '1.5');
  assert.equal(s.Prototype.platform.cameraZoom, 1.5);
  assert.equal(JSON.parse(storage.get(s.PrototypePlatform.cameraPreferenceKey)).phone, 1.5);

  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'auto');
  selectSetting('Optimization Mode', 'Modo de optimización', 'on');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'on');
  for (const resolution of ['native', 'auto', '100', '80', '60', '50']) {
    selectSetting('Rendering resolution', 'Resolución de renderizado', resolution);
    assert.equal(s.Prototype.renderResolution.preference, resolution);
    assert.equal(storage.get(s.PrototypeRuntime.resolutionPreferenceKey), resolution);
  }
  selectSetting('Rendering resolution', 'Resolución de renderizado', 'auto');
  selectSetting('Optimization Mode', 'Modo de optimización', 'off');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'off');
  selectSetting('Optimization Mode', 'Modo de optimización', 'auto');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'auto');

  assert.equal(s.Prototype.fps.preference, 'auto');
  assert.equal(s.Prototype.fps.target, 30);
  for (const value of ['60', '20', 'auto']) {
    selectSetting('Drawing target (FPS)', 'Objetivo de dibujo (FPS)', value);
    assert.equal(s.Prototype.fps.preference, value);
    assert.equal(storage.get(s.PrototypeRuntime.fpsPreferenceKey), value);
    if (value === '20') assert.equal(s.Prototype.fps.target, 20);
  }
  assert.equal(s.Prototype.frameSkip.enabled, true, 'On by default');
  click(t('Adaptive frame skip', 'Salto adaptativo de fotogramas'));
  assert.equal(s.Prototype.frameSkip.enabled, false);
  assert.equal(storage.get(s.PrototypeRuntime.frameSkipPreferenceKey), 'off');
  click(t('Adaptive frame skip', 'Salto adaptativo de fotogramas'));
  assert.equal(s.Prototype.frameSkip.enabled, true);
  assert.equal(storage.get(s.PrototypeRuntime.frameSkipPreferenceKey), 'on');

  assert(!writes.some((key) => key.startsWith('azeroth-v4-')), 'device settings write no campaign saves');
  back();
  title('Settings', 'Ajustes');
  click(t('Playtest tools', 'Herramientas de prueba'));
  assert(rows().some((node) => node.textContent.startsWith(t('Export playtest report', 'Exportar informe de prueba'))));
  section('Performance details', 'Detalles de rendimiento');
  click(t('Help and privacy', 'Ayuda y privacidad'));
  title('Help and privacy', 'Ayuda y privacidad');
  back();
  title('Playtest tools', 'Herramientas de prueba');
  click(t('Start renderer profiling', 'Iniciar registro del renderizador'));
  click(t('Stop renderer profiling', 'Detener registro del renderizador'));
  click(t('Reset performance sample', 'Reiniciar muestra de rendimiento'));
  title('Reset performance sample', 'Reiniciar muestra de rendimiento');
  back();
  title('Playtest tools', 'Herramientas de prueba');
  click(t('Reset performance sample', 'Reiniciar muestra de rendimiento'));
  click(t('Confirm sample reset', 'Confirmar reinicio de la muestra'));
  title('Playtest tools', 'Herramientas de prueba');
  back();
  title('Settings', 'Ajustes');
  click(t('Sound settings', 'Ajustes de sonido'));
  title('Music and sound', 'Música y sonido');
  writes.length = 0;
  short();
  // Instrument the actual shell's localStorage adapter. Audio already persists
  // to its profile; dragging should never rewrite the entire campaign save.
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
  // 5 channels × (0%, 100%, 37%, restored) plus two mute changes:
  // each persists the small audio profile, none serializes the campaign.
  assert.equal(writes.filter((key) => key === s.PrototypePersistence.profileKey).length, 22,
    'every audio adjustment persists its own profile change');
  assert.equal(writes.filter((key) => key === 'azeroth-v4-normal').length, 0,
    'sound sliders and mute must not trigger full-campaign saves');
  storage.set = originalSet;
  back();
  title('Settings', 'Ajustes');
  click(t('Sound settings', 'Ajustes de sonido'));
  title('Music and sound', 'Música y sonido');
  for (const [key, en, es] of channels) {
    const slider = soundSlider(en, es);
    assert.equal(slider.output.textContent, Math.round(originalVolumes[key] * 100) + '%');
  }
  back();
  click(t('Install on phone', 'Instalar en el teléfono'));
  short();
  back();
  click(t('Language', 'Idioma'));
  click(language === 'en' ? 'English' : 'Español');
  title('Settings', 'Ajustes');
  click(t('Controls', 'Controles'));
  short();
  assert.equal(e.get('modal-actions').children.length, 2,
    'Settings Controls contains only customization, not duplicate help topics');
  click(t('Customize keyboard', 'Personalizar teclado'));
  title('Customize keyboard', 'Personalizar teclado');
  assert.equal(s.Prototype.input.preferences.preset, 'right');
  assert.equal(
    e.get('modal-actions').children.filter((node) => node.className === 'menu-section').length,
    2,
  );
  const groupPaths = [
    ['Movement and menu keys', 'Teclas de movimiento y menú',
      ['up', 'down', 'left', 'right', 'confirm', 'menu']],
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
  const hudRow = controls.find(
    (node) => node.className === 'menu-setting' &&
      node.children.some((child) => child.textContent === t('HUD style', 'Estilo de interfaz')),
  );
  assert(hudRow, 'independent Classic/Adaptive preference appears in both languages');
  const hudSelect = hudRow.children.find((child) => child.className === 'menu-setting-input');
  assert.equal(hudSelect.value, 'classic', 'old saves preserve Classic by default');
  hudSelect.value = 'adaptive';
  hudSelect.onchange();
  assert.equal(s.Prototype.input.preferences.hudStyle, 'adaptive');
  assert.equal(JSON.parse(storage.get(s.PrototypeInput.preferenceKey)).hudStyle, 'adaptive');
  assert.equal(e.get('modal').hidden, false, 'HUD setting does not dismiss settings');
  hudSelect.value = 'classic';
  hudSelect.onchange();
  assert.equal(s.Prototype.input.preferences.hudStyle, 'classic');
  assert.equal(JSON.parse(storage.get(s.PrototypeInput.preferenceKey)).hudStyle, 'classic');
  const joystickRow = controls.find(
    (node) => node.className === 'menu-setting' &&
      node.children.some((child) => child.textContent === t('Movement joystick', 'Joystick de movimiento')),
  );
  assert(joystickRow, 'separate movement joystick setting exists in both languages');
  const joystickSelect = joystickRow.children.find((child) => child.className === 'menu-setting-input');
  assert.equal(joystickSelect.value, 'fixed', 'fixed mode is the compatible default');
  joystickSelect.value = 'floating';
  joystickSelect.onchange();
  assert.equal(s.Prototype.input.preferences.joystickMode, 'floating');
  assert.equal(e.get('modal').hidden, false, 'switching input mode does not close the menu');
  assert.equal(JSON.parse(storage.get(s.PrototypeInput.preferenceKey)).joystickMode, 'floating');
  assert.equal(e.get('joystick').getAttribute('aria-hidden'), 'false', 'menu always keeps fixed accessible joystick');
  joystickSelect.value = 'fixed';
  joystickSelect.onchange();
  assert.equal(s.Prototype.input.preferences.joystickMode, 'fixed');

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
  title('Settings', 'Ajustes');
  assert(!e.get('modal-actions').children.some((node) =>
    node.textContent.includes('Save and game management') ||
      node.textContent.includes('Partidas guardadas')),
    'save and backups are no longer duplicated inside Settings');
  assert(!e.get('modal-actions').children.some((node) =>
    node.textContent.includes('Check for game update') ||
      node.textContent.includes('Buscar actualización')),
    'manual update checks are removed; startup checks remain');
  back(); // Adventure menu
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


/* Unlisted diagnostics share the production app and PWA assets, not a fork.
 * The URL enables only this browser entry; ordinary visitors cannot discover
 * the mode in menus, load its save or resume it from the active profile.
 */
{
  const shared = new Map();
  const diagnosticLocation = { protocol: 'file:', hostname: '', search: '?combatDiagnostics=1' };
  const ordinaryLocation = { protocol: 'file:', hostname: '', search: '' };
  const playtest = shell('en', 'paladin', { storage: shared, location: diagnosticLocation });
  const actions = () => playtest.elements.get('modal-actions').children;
  const click = (label) => {
    const button = actions().find((item) => item.textContent.startsWith(label));
    assert(button && !button.disabled, 'Diagnostics selection available: ' + label);
    button.click();
  };
  assert.equal(playtest.elements.get('title-screen').hidden, false);
  playtest.elements.get('title-new').click();
  click('New Combat Diagnostics run');
  assert.equal(playtest.elements.get('modal-title').textContent,
    'New Combat Diagnostics adventure', 'new runs reuse saved language');
  // The optional name field now follows the hero cards in the landscape setup.
  // Exercise the real button that starts the selected class.
  const heroButton = actions().find((node) => /paladin/i.test(node.textContent));
  assert(heroButton && !heroButton.disabled, 'Paladin class button remains accessible');
  heroButton.click();
  assert.equal(playtest.scope.Prototype.game.s.mode, 'arena');
  assert(shared.has('azeroth-v4-arena'), 'diagnostic run uses its own v4 save');
  assert.equal(JSON.parse(shared.get('azeroth-v4-profile')).activeMode, 'normal',
    'diagnostic autosaves never hijack the ordinary profile');
  const resumed = shell('en', 'paladin', { storage: shared, location: diagnosticLocation });
  assert.equal(resumed.scope.Prototype.game.s.mode, 'arena',
    'special link resumes the same saved combat mode on the current game build');

  const normal = shell('en', 'paladin', { storage: shared, location: ordinaryLocation });
  assert.equal(normal.scope.Prototype.game.s.mode, 'normal',
    'ordinary URL still loads the normal campaign even when an arena save exists');
  const normalActions = () => normal.elements.get('modal-actions').children;
  const open = (label) => {
    const button = normalActions().find((item) => item.textContent.startsWith(label));
    assert(button, 'Missing ordinary menu: ' + label);
    button.click();
  };
  normal.elements.get('menu-button').click();
  open('Settings');
  assert(!normalActions().some((item) => /Save and game management|Check for game update/.test(item.textContent)),
    'settings do not duplicate save/update navigation');
  normal.elements.get('close-button').click();
  open('Return to Main Menu');
  normal.elements.get('title-saves').click();
  assert(!normalActions().some((item) => /Combat (Arena|Diagnostics)/i.test(item.textContent)),
    'regular Saved Games menu stays free of diagnostic entries');
  normal.elements.get('close-button').click();
  normal.elements.get('title-new').click();
  assert(!normalActions().some((item) => /Combat (Arena|Diagnostics)/i.test(item.textContent)),
    'regular New Game menu stays free of diagnostic entries');
  normal.elements.get('close-button').click();

  const special = resumed.elements;
  special.get('menu-button').click();
  const specialOpen = (label) => {
    const button = special.get('modal-actions').children.find(
      (item) => item.textContent.startsWith(label),
    );
    assert(button && !button.disabled, 'Playtest menu item: ' + label);
    button.click();
  };
  specialOpen('Settings');
  assert(!special.get('modal-actions').children.some((item) =>
    /Save and game management|Check for game update/.test(item.textContent)));
  special.get('close-button').click();
  specialOpen('Return to Main Menu');
  special.get('title-saves').click();
  assert(special.get('modal-actions').children.some((item) =>
    item.textContent.startsWith('Combat Diagnostics')),
    'playtest link preserves its separate saved arena selection');
  special.get('close-button').click();
  special.get('title-new').click();
  assert(special.get('modal-actions').children.some((item) =>
    item.textContent.startsWith('New Combat Diagnostics run')),
    'playtest link exposes diagnostic New Game only');
}
