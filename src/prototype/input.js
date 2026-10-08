/* Player input preferences are separate from campaign saves and combat rules. */
(function (root) {
  'use strict';
  const preferenceKey = 'azeroth-input-v1';
  const actions = [
    ['up', 'Move up / previous menu entry', 'KeyW'],
    ['down', 'Move down / next menu entry', 'KeyS'],
    ['left', 'Move left / previous menu entry', 'KeyA'],
    ['right', 'Move right / next menu entry', 'KeyD'],
    ...Array.from({ length: 8 }, (_, i) => [
      'skill' + (i + 1),
      'Skill ' + (i + 1),
      i < 5 ? 'Digit' + (i + 1) : ['Space', 'ShiftLeft', 'KeyB'][i - 5],
    ]),
    ['interact', 'Interact', 'KeyE'],
    ['confirm', 'Confirm / interact', 'KeyF'],
    ['doctrine', 'Squad doctrine', 'Tab'],
    ['recall', 'Recall squad', 'Backquote'],
    ['map', 'Map', 'KeyZ'],
    ['inventory', 'Inventory', 'KeyI'],
    ['training', 'Discipline Training', 'KeyC'],
    ['skills', 'Skills and teachers', 'KeyX'],
    ['quests', 'Quest journal', 'KeyJ'],
    ['pause', 'Pause', 'KeyP'],
    ['help', 'Controls', 'KeyG'],
    ['heal', 'Command Ranger Heal', 'KeyH'],
    ['mana', 'Command Ranger Mana Recovery', 'KeyM'],
  ];
  const defaults = Object.fromEntries(actions.map(([id, , code]) => [id, code]));
  const aliases = { KeyR: 'inventory', KeyT: 'quests', KeyV: 'pause' };
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
      phoneLayout: 'two-thumb',
      touchMove: true,
      mouseMove: false,
    };
    try {
      const saved = JSON.parse(storage.getItem(preferenceKey) || 'null');
      if (saved && typeof saved === 'object') {
        const candidate = { ...defaults, ...saved.bindings };
        // Reject malformed/duplicate maps as a whole so movement is never stranded.
        if (
          actions.every(([id]) => validCode(candidate[id])) &&
          new Set(actions.map(([id]) => candidate[id])).size === actions.length
        )
          preferences.bindings = Object.fromEntries(actions.map(([id]) => [id, candidate[id]]));
        preferences.phoneLayout = saved.phoneLayout === 'left-hand' ? 'left-hand' : 'two-thumb';
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
        preferences.bindings[id] = code;
        persist();
        return null;
      },
      resetBindings() {
        preferences.bindings = { ...defaults };
        persist();
      },
      select(name, value) {
        if (name === 'phoneLayout')
          preferences.phoneLayout = value === 'left-hand' ? value : 'two-thumb';
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
  const api = { create, actions, defaults, preferenceKey, requestMove };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeInput = api;
})(typeof window !== 'undefined' ? window : globalThis);
