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
  short();
  assert.equal(e.get('modal-actions').children.length, 5);
  click(t('Screen layout', 'Disposición de pantalla'));
  short();
  click(t('Phone / touch screen', 'Pantalla de teléfono / táctil'));
  assert.equal(s.Prototype.platform.mode, 'phone');
  assert.equal(storage.get(s.PrototypePlatform.preferenceKey), 'phone');
  e.get('menu-button').click();
  click(t('Game and settings', 'Juego y ajustes'));
  click(t('Screen and performance', 'Pantalla y rendimiento'));
  click(t('Camera zoom', 'Zoom de cámara'));
  short();
  click(t('Camera 150%', 'Cámara 150%'));
  assert.equal(s.Prototype.platform.cameraZoom, 1.5);
  assert.equal(JSON.parse(storage.get(s.PrototypePlatform.cameraPreferenceKey)).phone, 1.5);
  e.get('menu-button').click();
  click(t('Game and settings', 'Juego y ajustes'));
  click(t('Screen and performance', 'Pantalla y rendimiento'));
  click(t('Graphics quality', 'Calidad gráfica'));
  short();
  click('Optimization Mode');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'on');
  click(t('Maximum sharpness', 'Nitidez máxima'));
  assert.equal(s.Prototype.renderResolution.preference, 'native');
  assert.equal(storage.get(s.PrototypeRuntime.resolutionPreferenceKey), 'native');
  click(t('Automatic sharpness', 'Nitidez automática'));
  assert.equal(s.Prototype.renderResolution.preference, 'auto');
  click('Optimization Mode');
  assert.equal(storage.get('azeroth-optimization-mode-v1'), 'off');
  back();
  click(t('Frame rate', 'Fotogramas por segundo'));
  short();
  click('60 FPS');
  assert.equal(s.Prototype.fps.preference, '60');
  assert.equal(storage.get(s.PrototypeRuntime.fpsPreferenceKey), '60');
  click('30 FPS');
  assert.equal(s.Prototype.fps.preference, '30');
  click('Auto');
  assert.equal(s.Prototype.fps.preference, 'auto');
  back();
  click(t('Performance details', 'Detalles de rendimiento'));
  click(t('Reset performance sample', 'Reiniciar muestra de rendimiento'));
  back();
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
  assert.equal(e.get('modal-actions').children.length, s.Prototype.input.actions.length + 1);
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

  // Every keyboard shortcut still opens its own page directly.
  for (const [code, en, es] of [
    ['KeyR', 'Inventory', 'Inventario'],
    ['KeyC', 'Talents', 'Talentos'],
    ['KeyX', 'Skill journal', 'Diario de habilidades'],
    ['KeyT', 'Quest journal', 'Diario de misiones'],
    ['KeyG', 'Controls', 'Controles'],
  ]) {
    s.Prototype.closeMenu();
    events.keydown.forEach((fn) => fn({ code, preventDefault() {} }));
    title(en, es);
  }
}
console.log(
  'PASS concise English/Spanish game-menu branches and Back routes, native map movement, unchanged campaign, persistent graphics/audio/input preferences and original shortcuts',
);
