/* Player input preferences are separate from campaign saves and combat rules. */
(function (root) {
  'use strict';
  const legacyManaEnabled = (
    typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js')
  ).resourceMode.manaEnabled;
  const actions = [
    ['up', 'Move up / previous menu entry', 'KeyW'],
    ['down', 'Move down / next menu entry', 'KeyS'],
    ['left', 'Move left / previous menu entry', 'KeyA'],
    ['right', 'Move right / next menu entry', 'KeyD'],
    ...Array.from({ length: 4 }, (_, i) => [
      'skill' + (i + 1),
      'Skill ' + (i + 1),
      'Digit' + (i + 1),
    ]),
    ['confirm', 'Confirm / interact', 'KeyF'],
    ['menu', 'Open menu / back', 'Escape'],
    ['doctrine', 'Squad doctrine', 'Tab'],
    ['recall', 'Recall squad', 'KeyQ'],
    ['target', 'Cycle hero target', 'KeyE'],
    ['map', 'Map', 'KeyZ'],
    ['training', 'Talents', 'KeyC'],
    ['skills', 'Skills and teachers', 'KeyX'],
    ['pause', 'Pause', 'KeyV'],
    ['help', 'Controls', 'KeyG'],
    ['heal', 'Command companion Heal', 'KeyR'],
    ...(legacyManaEnabled ? [['mana', 'Command Ranger Mana Recovery', 'KeyM']] : []),
  ];
  function label(code) {
    const names = {
      Space: 'Space',
      Escape: 'Esc',
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
  function create() {
    const bindings = Object.freeze(Object.fromEntries(actions.map(([id, , code]) => [id, code])));
    const preferences = Object.freeze({
      bindings,
      preset: 'alternate-layout',
      phoneLayout: 'left-hand',
      joystickMode: 'fixed',
      hudStyle: 'classic',
      touchMove: false,
      mouseMove: false,
    });
    return {
      actions,
      preferences,
      key(id) {
        return id === 'skill5' || id === 'skill6' || id === 'skill7' || id === 'skill8'
          ? label(bindings['skill' + (Number(id.slice(5)) - 4)])
          : label(bindings[id] || '');
      },
      actionFor(code, desktop = false) {
        if (desktop && (code === 'Enter' || code === 'NumpadEnter')) return 'confirm';
        return actions.find(([, , bound]) => bound === code)?.[0] ?? null;
      },
    };
  }
  // An anchored menu drag starts neutral even when the thumb lands off-center.
  // This is separate from the fixed, center-relative movement joystick.
  function menuJoystickDragVector(start, point, width) {
    const radius = Math.max(1, width * 0.35);
    const dx = (point.x - start.x) / radius;
    const dy = (point.y - start.y) / radius;
    const magnitude = Math.max(1, Math.hypot(dx, dy));
    return { x: dx / magnitude, y: dy / magnitude };
  }
  // Menu-only four-way intent. Walking keeps the original analog joystick vector.
  // A tilt selects once; holding waits before controlled repeats. Returning to
  // center is required before changing directions, so diagonals cannot wobble
  // between previous and next choices as a thumb drifts.
  function createMenuJoystickNavigator() {
    const engage = 0.65, release = 0.32, axisRatio = 1.18;
    const firstRepeatMs = 540, heldRepeatMs = 370;
    let direction = 0, repeatAt = 0, waitForCenter = false;
    const reset = (requireCenter = false) => {
      direction = 0;
      repeatAt = 0;
      waitForCenter = requireCenter;
    };
    return {
      reset,
      step(vector, now) {
        const x = Number.isFinite(vector?.x) ? vector.x : 0;
        const y = Number.isFinite(vector?.y) ? vector.y : 0;
        if (Math.hypot(x, y) <= release) {
          reset();
          return 0;
        }
        if (waitForCenter) return 0;
        if (direction) {
          if (now < repeatAt) return 0;
          repeatAt = now + heldRepeatMs;
          return direction;
        }
        const ax = Math.abs(x), ay = Math.abs(y);
        const primary = Math.max(ax, ay), secondary = Math.min(ax, ay);
        // An uncertain diagonal does not imply either menu direction.
        if (primary < engage || primary < secondary * axisRatio) return 0;
        direction = Math.sign(ax > ay ? x : y);
        repeatAt = now + firstRepeatMs;
        return direction;
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
  // HUD presentation is a separate, pure classifier. It never changes action
  // validity, movement or combat state. The previous snapshot implements
  // hysteresis so quick HP changes and aggro dropouts do not make the HUD flicker.
  function adaptiveHudLowHealth(hp, maxHp, previouslyLow = false) {
    if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return false;
    const ratio = Math.max(0, hp) / maxHp;
    return previouslyLow ? ratio <= 0.35 : ratio <= 0.30;
  }
  function adaptiveHudPresentation(signals, previous = null, now = 0) {
    const lowHP = adaptiveHudLowHealth(signals.hp, signals.maxHp, previous?.lowHP);
    const immediatePressure = !!(
      signals.threat || signals.projectile || signals.hazard ||
      signals.target || signals.targetLocked || signals.charging ||
      signals.queued || signals.targetPress
    );
    const pressureUntil = immediatePressure
      ? now + 2000 : Math.max(0, previous?.pressureUntil || 0);
    const pressure = immediatePressure || now < pressureUntil;
    const inputActive = !!(signals.charging || signals.queued || signals.targetPress);
    return {
      lowHP,
      pressure,
      pressureUntil,
      context: signals.menu ? 'menu' : pressure ? 'combat' :
        signals.navigation ? 'travel' : signals.interactable ? 'interact' : 'explore',
      target: pressure || !!signals.target || !!signals.targetLocked || !!signals.targetPress,
      recall: pressure || !!signals.tutorialRecall,
      moving: !!signals.moving,
      inputActive,
    };
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
  const api = { create, createSkillQueue, actions, requestMove,
    floatingJoystickVector, floatingJoystickZone, menuJoystickDragVector,
    createMenuJoystickNavigator,
    adaptiveHudLowHealth, adaptiveHudPresentation };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeInput = api;
})(typeof window !== 'undefined' ? window : globalThis);
