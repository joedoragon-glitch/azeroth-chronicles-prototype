/* Player input preferences are separate from campaign saves and combat rules. */
(function (root) {
  'use strict';
  const preferenceKey = 'azeroth-input-v1';
  const legacyManaEnabled = (
    typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js')
  ).resourceMode.manaEnabled;
  const actions = [
    ['up', 'Move up / previous menu entry', 'KeyW'],
    ['down', 'Move down / next menu entry', 'KeyS'],
    ['left', 'Move left / previous menu entry', 'KeyA'],
    ['right', 'Move right / next menu entry', 'KeyD'],
    ...Array.from({ length: 8 }, (_, i) => [
      'skill' + (i + 1),
      'Skill ' + (i + 1),
      ['KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI', 'Space', 'KeyO', 'KeyN'][i],
    ]),
    ['confirm', 'Confirm / interact', 'KeyF'],
    ['doctrine', 'Squad doctrine', 'Tab'],
    ['recall', 'Recall squad', 'Backquote'],
    ['target', 'Cycle hero target', 'KeyE'],
    ['map', 'Map', 'KeyZ'],
    ['training', 'Talents', 'KeyC'],
    ['skills', 'Skills and teachers', 'KeyX'],
    ['pause', 'Pause', 'KeyP'],
    ['help', 'Controls', 'KeyG'],
    ['heal', 'Command Ranger Heal', 'KeyH'],
    ...(legacyManaEnabled ? [['mana', 'Command Ranger Mana Recovery', 'KeyM']] : []),
  ];
  const defaults = Object.fromEntries(actions.map(([id, , code]) => [id, code]));
  const classic = {
    ...defaults,
    skill1: 'Digit1',
    skill2: 'Digit2',
    skill3: 'Digit3',
    skill4: 'Digit4',
    skill5: 'Digit5',
    skill7: 'ShiftLeft',
    skill8: 'KeyB',
  };
  const left = {
    ...defaults,
    up: 'KeyI',
    down: 'KeyK',
    left: 'KeyJ',
    right: 'KeyL',
    skill1: 'KeyD',
    skill2: 'KeyS',
    skill3: 'KeyA',
    skill4: 'KeyE',
    skill5: 'KeyW',
    skill7: 'KeyQ',
    skill8: 'KeyR',
    target: 'KeyO',
  };
  const presets = { right: defaults, classic, left };
  const detectPreset = (bindings) =>
    Object.keys(presets).find((name) =>
      actions.every(([id]) => bindings[id] === presets[name][id]),
    ) || 'custom';
  const aliases = { KeyV: 'pause', KeyQ: 'recall' };
  const validCode = (code) =>
    typeof code === 'string' &&
    /^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight|Tab|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|F[1-4]|F[6-9]|F10)$/.test(
      code,
    );
  function label(code) {
    const names = {
      Space: 'Space',
      ShiftLeft: 'Left Shift',
      ShiftRight: 'Right Shift',
      Backquote: '`',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Minus: '−',
      Equal: '=',
      BracketLeft: '[',
      BracketRight: ']',
      Backslash: '\\',
      Semicolon: ';',
      Quote: "'",
      Comma: ',',
      Period: '.',
      Slash: '/',
    };
    return names[code] || code.replace(/^Key|^Digit/, '');
  }
  function create(storage, status = () => {}) {
    let preferences = {
      bindings: { ...defaults },
      preset: 'right',
      phoneLayout: 'two-thumb',
      joystickMode: 'fixed',
      touchMove: true,
      mouseMove: false,
    };
    try {
      const saved = JSON.parse(storage.getItem(preferenceKey) || 'null');
      if (saved && typeof saved === 'object') {
        const storedBindings =
          saved.bindings && typeof saved.bindings === 'object' ? saved.bindings : {};
        // Existing preference records predate presets: retain their classic layout.
        const base = Object.hasOwn(presets, saved.preset)
          ? presets[saved.preset]
          : Object.keys(storedBindings).length
            ? classic
            : defaults;
        const candidate = { ...base, ...storedBindings };
        const used = new Set(
          actions.filter(([id]) => id !== 'target').map(([id]) => candidate[id]),
        );
        // F already covers both field interaction and menu confirmation.
        // Upgrade the previous Q targeting default to E unless E belongs to
        // a custom binding; custom target keys are kept unchanged.
        if (candidate.target === 'KeyQ' && !used.has('KeyE')) candidate.target = 'KeyE';
        // Older profiles may predate targeting entirely. Preserve their
        // custom controls and choose an unused key for the new action.
        if (!Object.hasOwn(storedBindings, 'target') && used.has(candidate.target)) {
          for (const key of 'QYUOLNKJIPBVCXZFGRTH1234567890') {
            const code = (/^[0-9]$/.test(key) ? 'Digit' : 'Key') + key;
            if (validCode(code) && !used.has(code)) {
              candidate.target = code;
              break;
            }
          }
        }
        // Reject malformed/duplicate maps as a whole so movement is never stranded.
        if (
          actions.every(([id]) => validCode(candidate[id])) &&
          new Set(actions.map(([id]) => candidate[id])).size === actions.length
        ) {
          preferences.bindings = Object.fromEntries(actions.map(([id]) => [id, candidate[id]]));
          preferences.preset = detectPreset(preferences.bindings);
        }
        preferences.phoneLayout = saved.phoneLayout === 'left-hand' ? 'left-hand' : 'two-thumb';
        preferences.joystickMode = saved.joystickMode === 'floating' ? 'floating' : 'fixed';
        preferences.touchMove = saved.touchMove !== false;
        preferences.mouseMove = saved.mouseMove === true;
      }
    } catch (_) {}
    function persist() {
      try {
        storage.setItem(preferenceKey, JSON.stringify(preferences));
      } catch (_) {
        status('Controls work for this session. Local storage unavailable.');
      }
    }
    return {
      actions,
      get preferences() {
        return preferences;
      },
      key(id) {
        return label(preferences.bindings[id]);
      },
      actionFor(code) {
        const bound = actions.find(([id]) => preferences.bindings[id] === code)?.[0];
        if (bound) return bound;
        // M also opens the map without taking away Z or a custom map binding.
        // If legacy mana is enabled, its historical M shortcut takes priority.
        if (code === 'KeyM' && !legacyManaEnabled) return 'map';
        const alias = aliases[code];
        return alias && preferences.bindings[alias] === defaults[alias] ? alias : null;
      },
      rebind(id, code) {
        if (!Object.hasOwn(defaults, id) || !validCode(code))
          return 'Choose a letter, number, arrow or supported action key. Esc cancels; Enter remains a menu fallback.';
        const conflict = actions.find(
          ([other]) => other !== id && preferences.bindings[other] === code,
        );
        if (conflict)
          return label(code) + ' is already used for ' + conflict[1] + '. Choose another key.';
        if (preferences.bindings[id] === code) return null;
        preferences.bindings[id] = code;
        preferences.preset = detectPreset(preferences.bindings);
        persist();
        return null;
      },
      applyPreset(name) {
        if (!Object.hasOwn(presets, name)) return false;
        preferences.bindings = { ...presets[name] };
        preferences.preset = name;
        persist();
        return true;
      },
      resetBindings() {
        preferences.bindings = { ...defaults };
        preferences.preset = 'right';
        persist();
      },
      select(name, value) {
        if (name === 'phoneLayout')
          preferences.phoneLayout = value === 'left-hand' ? value : 'two-thumb';
        else if (name === 'joystickMode')
          preferences.joystickMode = value === 'floating' ? 'floating' : 'fixed';
        else if (name === 'touchMove' || name === 'mouseMove') preferences[name] = value === true;
        persist();
      },
    };
  }
  function requestMove(game, target) {
    if (
      !Number.isFinite(target.x) ||
      !Number.isFinite(target.y) ||
      target.x < 0 ||
      target.y < 0 ||
      target.x > game.zoneSize() ||
      target.y > game.zoneSize() ||
      game.blocked(target.x, target.y)
    )
      return false;
    const path = game.route(game.hero, target);
    if (!path.length) return false;
    game.hero.order = { type: 'move', x: target.x, y: target.y };
    game.hero.path = path;
    game.hero.routeAge = 1.3;
    return true;
  }

  // Presentation-only floating touch geometry. The existing game tick still
  // receives the same x/y vector; no movement, pathfinding or speed rules change.
  function floatingJoystickVector(start, point, radius, deadZone = 10) {
    const dx = point.x - start.x, dy = point.y - start.y;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance <= deadZone) return { x: 0, y: 0 };
    const factor = Math.max(1, distance / Math.max(1, radius));
    return { x: dx / radius / factor, y: dy / radius / factor };
  }
  function floatingJoystickZone(point, viewport, obstacles = []) {
    const width = Math.min(200, viewport.width * 0.43);
    const height = Math.min(160, Math.max(116, viewport.height * 0.26));
    if (!(point.x >= 0 && point.x <= width && point.y >= viewport.height - height &&
          point.y <= viewport.height)) return false;
    // Use actual onscreen button rectangles for both handedness layouts.
    return !obstacles.some((rect) =>
      point.x >= rect.x - 10 && point.x <= rect.x + rect.width + 10 &&
      point.y >= rect.y - 10 && point.y <= rect.y + rect.height + 10);
  }
  // Transient intent only. Gameplay, cooldowns and target legality stay in Campaign.
  function createSkillQueue(capacity = 16) {
    const entries = new Map();
    let nextId = 0;
    return {
      capacity,
      get size() {
        return entries.size;
      },
      append(request) {
        if (entries.size >= capacity) return false;
        request.id = ++nextId;
        entries.set(request.id, request);
        return true;
      },
      get(slot) {
        return [...entries.values()].find((r) => r.slot === slot);
      },
      has(slot) {
        return !!this.get(slot);
      },
      contains(request) {
        return entries.get(request?.id) === request;
      },
      values() {
        return entries.values();
      },
      forSlot(slot) {
        return [...entries.values()].filter((r) => r.slot === slot);
      },
      heads() {
        const seen = new Set();
        return [...entries.values()].filter((r) => {
          if (seen.has(r.slot)) return false;
          seen.add(r.slot);
          return true;
        });
      },
      contact(slot, source, pointerId) {
        return [...entries.values()].find(
          (r) => r.slot === slot && r.input?.source === source && r.input.pointerId === pointerId,
        );
      },
      remove(request) {
        return entries.delete(request?.id);
      },
      clear() {
        entries.clear();
      },
    };
  }
  const api = { create, createSkillQueue, actions, defaults, presets, preferenceKey, requestMove,
    floatingJoystickVector, floatingJoystickZone };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeInput = api;
})(typeof window !== 'undefined' ? window : globalThis);
