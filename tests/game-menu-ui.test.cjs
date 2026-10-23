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
  assert.equal(e.get('modal-actions').children.length, 3);
  click(t('Equipment', 'Equipo'));
  short();
  back();
  click(t('Ranger support', 'Apoyo del Ranger'));
  short();
  assert(e.get('modal-description').textContent.includes(String(g.rangerSupportAmount('health'))));
  back();
  click(t('Preparation Tonics', 'Tónicos de preparación'));
  short();
  back();
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
  short();
  assert.equal(e.get('modal-actions').children.length, 6);
  const volume = s.Prototype.audio.settings.music;
  click(t('Music volume', 'Volumen de música'));
  short();
  click(t('Quieter', 'Bajar volumen'));
  assert(Math.abs(s.Prototype.audio.settings.music - (volume - 0.1)) < 1e-9);
  click(t('Louder', 'Subir volumen'));
  assert(Math.abs(s.Prototype.audio.settings.music - volume) < 1e-9);
  back();
  click(t('Mute all sound', 'Silenciar todo'));
  assert(s.Prototype.audio.settings.muted);
  click(t('Unmute all sound', 'Activar todo el sonido'));
  assert(!s.Prototype.audio.settings.muted);
  assert.equal(JSON.parse(storage.get(s.PrototypePersistence.profileKey)).audio.muted, false);
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
  assert.equal(e.get('modal-actions').children.length, s.Prototype.input.actions.length + 4);
  assert.equal(s.Prototype.input.preferences.preset, 'right');
  click(t('Classic · number keys', 'Clásico · teclas numéricas'));
  title('Apply keyboard preset', 'Aplicar distribución de teclado');
  click(t('Keep current keys', 'Conservar teclas actuales'));
  assert.equal(s.Prototype.input.preferences.preset, 'right','cancelling keeps defaults');
  click(t('Classic · number keys', 'Clásico · teclas numéricas'));
  click(t('Apply preset', 'Aplicar distribución'));
  assert.equal(s.Prototype.input.actionFor('Digit1'),'skill1');
  assert.equal(s.Prototype.input.actionFor('KeyI'),null,'Classic has no Inventory shortcut');
  assert.equal(s.Prototype.input.actionFor('KeyJ'),null,'Classic has no Journal shortcut');
  click(t('Left-hand skills (IJKL)', 'Habilidades con mano izquierda (IJKL)'));
  click(t('Apply preset', 'Aplicar distribución'));
  assert.equal(s.Prototype.input.actionFor('KeyI'),'up');
  assert.equal(s.Prototype.input.actionFor('KeyR'),'skill8');
  click(t('Right-hand skills (WASD) · Default', 'Habilidades con mano derecha (WASD) · Predeterminado'));
  click(t('Apply preset', 'Aplicar distribución'));
  assert.equal(s.Prototype.input.actionFor('KeyJ'),'skill1');
  assert.equal(s.Prototype.input.actionFor('Space'),'skill6');
  assert.equal(s.Prototype.input.actionFor('KeyR'),null);
  assert.equal(s.Prototype.input.actionFor('KeyT'),null);
  back();
  click(t('Touch and mouse options', 'Opciones táctiles y de ratón'));
  short();
  const beforeMove = s.Prototype.input.preferences.touchMove;
  click(t('Touch tap-to-move', 'Tocar para moverse'));
  assert.equal(s.Prototype.input.preferences.touchMove, !beforeMove);
  back();
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
