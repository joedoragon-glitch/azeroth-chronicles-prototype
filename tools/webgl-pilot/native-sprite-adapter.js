/* STAGING ONLY: translate authentic PrototypeSprites resource choices into
   GPU-native texture commands. Never paints a Canvas or changes game state.
   Unsupported procedural bodies are EXPLICIT blockers, never invisible skips. */
(function (root) {
  'use strict';
  function create({ sprites, gpuCore, clock = () => sprites.timeMs(),
                    isReducedMotion = () => false } = {}) {
    if (!sprites?.definitionFor || !sprites?.frameFor || !sprites?.variant ||
        !sprites?.entityScale || !gpuCore?.spriteLayout)
      throw Error('Original sprite selector and GPU core are required');
    const state = new WeakMap();
    const events = new Map();
    const counters = { supported: 0, proceduralRequired: 0, animatedFrames: 0 };
    function noteEvents(list) {
      for (const event of list || []) {
        const who = event.type === 'hurt' ? event.target :
          ['swing','shot','cast'].includes(event.type) ? event.actor : null;
        if (who !== undefined && who !== null) {
          events.set(who, {
            state: event.type === 'hurt' ? 'hurt' : 'attack',
            at: clock()
          });
        }
      }
      for (const [id, event] of events) {
        if (clock() - event.at > 10000) events.delete(id);
      }
      while (events.size > 256) events.delete(events.keys().next().value);
    }
    function animation(entity, entry, paused = false) {
      const owner = entity.spriteIdentity || entity;
      const old = state.get(owner);
      const current = clock();
      if (paused && old) return {
        name: old.state, elapsed: current - old.at, facing: old.facing
      };
      const dx = old ? entity.x - old.x : 0,
        dy = old ? entity.y - old.y : 0;
      const event = events.get(entity.renderKind === 'hero' ? 'hero' : entity.id);
      let name = entity.spriteClip ||
        (entity.hp <= 0 ? 'death'
        : old && entity.hp < old.hp ? 'hurt'
        : entity.telegraph ? 'windup'
        : Math.hypot(dx || 0, dy || 0) > 0.01 ? 'walk' : 'idle');
      if (event) {
        const clip = entry.clips?.[event.state];
        const duration = clip?.frames.reduce((sum, frame) =>
          sum + frame.durationMs, 0) || 0;
        if (current - event.at < duration) name = event.state;
      }
      const direction = entity.spriteFacing ||
        (Math.hypot(dx || 0, dy || 0) > 0.01
          ? Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'east' : 'west'
            : dy > 0 ? 'south' : 'north'
          : old?.facing || 'south');
      const selected = entry.clips?.[name + ':' + direction]
        ? name + ':' + direction : name;
      const at = old?.state === selected ? old.at :
        event?.state === name ? event.at : current;
      state.set(owner, {
        x: entity.x, y: entity.y, hp: entity.hp,
        state: selected, at, facing: direction
      });
      return { name: selected, elapsed: current - at, facing: direction };
    }
    function commandFor(entity, point, {
      region = 0, rescued = false, facing = 1, paused = false
    } = {}) {
      if (!entity || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y))
        throw Error('A real entity and projected image anchor are required');
      const found = sprites.definitionFor(entity, region, rescued);
      if (!found) {
        counters.proceduralRequired++;
        return {
          supported: false, reason: 'original-game-procedural-art',
          renderKind: entity.renderKind,
          identity: String(entity.id || entity.structure || entity.name || 'unregistered'),
          requires: 'independent-native-WebGL-procedural-body'
        };
      }
      const { entry, key } = found;
      const pose = animation(entity, entry, paused);
      const reduced = !!isReducedMotion();
      const selectedClip = entry.clips?.[pose.name];
      const frame = selectedClip && !reduced
        ? sprites.frameFor(selectedClip, pose.elapsed) : null;
      const resource = frame || sprites.variant(entity, entry);
      if (!resource || !resource.src) {
        // Unlike the current Canvas renderer, a missing image cannot be
        // replaced by invisible pixels and still count as a GPU renderer.
        return {
          supported: false, reason: 'missing-approved-image-resource',
          identity: String(key), requires: 'asset-validation'
        };
      }
      const descriptor = {
        id: resource.src,
        src: resource.src,
        width: resource.width || entry.width,
        height: resource.height || entry.height,
        hash: resource.hash || entry.hash || null
      };
      const command = gpuCore.spriteLayout({
        textureId: descriptor.id, entry, frame,
        imageWidth: descriptor.width, imageHeight: descriptor.height,
        point, scale: sprites.entityScale(entity, entry), facing
      });
      if (frame) counters.animatedFrames++;
      counters.supported++;
      return {
        supported: true, key, texture: descriptor, command,
        animation: {
          name: pose.name, elapsedMs: pose.elapsed,
          frameSource: frame?.src || null
        },
        // The shipping scene bridge now owns the native Frontier shoots.
        // This standalone selector still flags other procedural overlays.
        additionalArt: {
          spriteAccessories: (entity.rangedAim || entity.form === 'true' || entity.form === 'ringleader') ? {
            form: entity.form, type: entity.type, rangedAim: !!entity.rangedAim,
            frenzy: !!entity.frenzy, scale: sprites.entityScale(entity, entry),
            overlayScale: Number(entry.overlayScale) || 1,
          } : null,
          frontierTreeShootsSceneOverlayRequired: region === 3 &&
            entity.renderKind === 'prop' && entity.structure === 'dead-tree'
        }
      };
    }
    function counts() { return { ...counters, pendingEvents: events.size }; }
    function reset() {
      // Resetting actor identity is handled by constructing a new adapter;
      // the internal WeakMap intentionally never mutates production sprites.
      events.clear();
    }
    return Object.freeze({ commandFor, noteEvents, counts, reset });
  }
  const api = Object.freeze({ create });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AzerothGpuSpriteAdapter = api;
})(typeof window !== 'undefined' ? window : globalThis);
