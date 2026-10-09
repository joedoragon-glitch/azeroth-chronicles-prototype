/* Shared expression profiles, derived from actual attacks. No mechanics or skill-name catalog. */
(function (root) {
  'use strict';
  const species = Object.freeze({
    wolf: ['claw', 'wolf'],
    goblin: ['dust', 'goblin'],
    skeleton: ['bone', 'skeleton'],
    reedbeast: ['wet', 'mire'],
    mireling: ['wet', 'mire'],
    wraith: ['spectral', 'spectral'],
    stalker: ['claw', 'shadow'],
    ogre: ['stone', 'ogre'],
    orc: ['steel', 'orc'],
    archer: ['arrow', 'military'],
    crownguard: ['steel', 'military'],
    ashbeast: ['ash', 'dragon'],
  });
  const families = Object.freeze({
    thorn: ['root', 'wolf'],
    crypt: ['bone', 'skeleton'],
    mire: ['wet', 'mire'],
    archive: ['spectral', 'spectral'],
    ridge: ['stone', 'ogre'],
    mine: ['stone', 'stone'],
    warlord: ['steel', 'orc'],
    abyss: ['ash', 'dragon'],
    citadel: ['ash', 'military'],
    cindermaw: ['ash', 'dragon'],
    darklord: ['arcane', 'military'],
  });
  const captains = Object.freeze({
    'supply-vale': ['dust', 'goblin'],
    'supply-march': ['wet', 'mire'],
    'supply-highlands': ['stone', 'ogre'],
    'supply-crown': ['ash', 'dragon'],
    'frontier-overseer': ['steel', 'orc'],
  });
  const styles = Object.freeze({
    arrow: 'arrow',
    axe: 'steel',
    stone: 'stone',
    spit: 'wet',
    spectral: 'spectral',
    cinder: 'ash',
    holy: 'holy',
    magic: 'arcane',
  });
  const actions = new Set([
    'circle',
    'line',
    'cone',
    'sector',
    'volley',
    'ring',
    'summon',
    'projectile',
    'frenzy',
    'scramble',
    'molt',
    'howl',
    'carapace',
    'overtime',
  ]);
  // Explicit shared contracts for the authored rogue repertoire. A new effect
  // requires a conscious presentation decision, even if it reuses a family.
  const rogueActions = new Set([
    'dash',
    'shove',
    'snare',
    'scatter',
    'pivot',
    'sweep',
    'bind',
    'rally',
    'cover',
    'withdraw',
  ]);
  function profile(e, a) {
    const base =
      (e.captain || e.roomCaptain ? captains[e.captainProfile] : null) ||
      (e.type === 'boss' ? families[e.family] : null) ||
      species[e.species];
    if (!base) return null;
    const action = a.rogueMove ? a.effect || a.style : a.kind;
    if (!(a.rogueMove ? rogueActions : actions).has(action)) return null;
    let material =
      styles[a.projectileStyle || (a.kind === 'projectile' ? a.style : null)] || base[0];
    if (a.kind === 'volley') material = styles[e.projectileStyle || 'arrow'];
    if (e.family === 'thorn' && (a.charge || a.landing || a.kind === 'cone')) material = 'claw';
    if (e.captainProfile === 'supply-vale' && a.index === 1) material = 'root';
    if (e.captainProfile === 'supply-vale' && a.charge) material = 'claw';
    const accent =
      a.rogueSignature || a.nightSkill || e.type === 'boss' || e.captain || e.roomCaptain
        ? e.captainProfile || e.family || e.species
        : null;
    return Object.freeze({
      material,
      personality: base[1],
      action,
      accent,
      signature: !!a.rogueSignature,
      summon: a.kind === 'summon',
    });
  }
  function route(event) {
    const p = event.identity?.presentation;
    if (!p || !event.skillId || event.skillId !== event.identity.id) return null;
    const stage = event.stage;
    if (stage === 'travel' || stage === 'linger')
      return Object.freeze({
        mode: 'silent',
        reason: 'Motion and persistent beds reuse the release; no per-frame sound.',
      });
    if (stage === 'impact' && (p.summon || !event.contact))
      return Object.freeze({
        mode: 'silent',
        reason: 'No confirmed contact; summon/cast and ground expression do not imply a hit.',
      });
    if (stage === 'spawn' && !event.target) return null;
    const keys = {
      windup: 'enemyWindup',
      release: 'enemyRelease',
      impact: 'enemyImpact',
      spawn: 'enemySpawn',
      phase: 'enemyPhase',
    };
    if (!keys[stage]) return null;
    return Object.freeze({
      mode: 'shared',
      key: keys[stage],
      ...p,
      reason:
        'Authored material/action family plus creature personality; important casts add a restrained motif.',
    });
  }
  const api = Object.freeze({ profile, route, species, families, captains, styles });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeEnemyPresentation = api;
})(typeof window !== 'undefined' ? window : globalThis);
