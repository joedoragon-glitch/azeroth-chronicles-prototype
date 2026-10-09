/* Session policy and local interaction leases; no transport or saved campaign state. */
(function (root) {
  'use strict';
  function create({ getGame, getActor = (game) => game.hero }) {
    let mode = 'single-player';
    function setMode(next) {
      if (!['single-player', 'cooperative'].includes(next)) throw Error('Unknown session mode');
      mode = next;
    }
    function timing({ started, menuOpen, paused, focused, hidden, blocked }) {
      const worldPaused =
        !started ||
        blocked ||
        (mode === 'single-player' && (menuOpen || paused || !focused || hidden));
      return {
        worldPaused: !!worldPaused,
        inputBlocked: !!(worldPaused || menuOpen || paused || !focused || hidden),
      };
    }
    function captureInteraction(source) {
      const game = getGame();
      return Object.freeze({
        game,
        actor: getActor(game),
        zone: game.zoneId,
        epoch: game.interactionEpoch || 0,
        deaths: game.s.statistics.deaths,
        source: Object.freeze({ id: source.id, kind: source.kind }),
      });
    }
    function interactionValid(lease) {
      if (!lease) return true;
      const game = getGame(),
        actor = getActor(game);
      if (
        lease.game !== game ||
        lease.actor !== actor ||
        lease.zone !== game.zoneId ||
        lease.epoch !== (game.interactionEpoch || 0) ||
        lease.deaths !== game.s.statistics.deaths ||
        actor.hp <= 0 ||
        game.s.challenge.pending ||
        game.s.challenge.gameOver
      )
        return false;
      const source =
        lease.source.kind === 'barracks'
          ? game.zone().buildings.find((b) => b.id === lease.source.id)
          : game
              .visibleNPCs()
              .find((n) => n.id === lease.source.id && n.kind === lease.source.kind);
      return !!source && Math.hypot(source.x - actor.x, source.y - actor.y) <= 115;
    }
    return {
      get mode() {
        return mode;
      },
      setMode,
      timing,
      captureInteraction,
      interactionValid,
    };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeSession = api;
})(typeof window !== 'undefined' ? window : globalThis);
