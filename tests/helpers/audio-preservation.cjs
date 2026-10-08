'use strict';
const crypto = require('node:crypto');
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
module.exports = function evidence(Audio) {
  const music = [];
  for (const theme of Audio.themes)
    for (const peace of [false, true])
      for (const night of [false, true])
        for (const trueForm of [false, true]) {
          const a = new Audio();
          a.ctx = { currentTime: 0, state: 'running' };
          a.cue = { id: theme.id, region: 'highlands', peace, night, true: trueForm };
          a.tone = (...args) => music.push(args);
          for (let i = 0; i < 256; i++) {
            a.ctx.currentTime = a.next;
            a.schedule();
          }
        }
  const effects = [],
    routes = [];
  const events = [
    ...[
      'purchase',
      'successor',
      'gameOver',
      'heal',
      'gold',
      'level',
      'rescue',
      'learning',
      'upgrade',
      'travel',
      'eliteWarning',
      'eliteFrenzy',
      'captainPhase',
      'captainSummon',
      'bossDefeat',
      'awakening',
      'peace',
      'death',
      'reset',
      'construction',
      'barracksUpgrade',
      'questComplete',
      'quest',
      'supplies',
      'miniClear',
      'squadRecall',
      'squadDoctrine',
      'manaDrain',
      'companionVitality',
      'talentRespec',
      'rangerSupportTraining',
      'expeditionSupport',
      'expeditionRank',
      'rest',
      'tributeDiscovery',
      'sideInteriorDiscovery',
    ].map((type) => ({ type })),
  ];
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const type of [
      'melee',
      'swing',
      'spell',
      'charged',
      'chargedArea',
      'chargedImpact',
      'basicComboFinisher',
      'hurt',
      'hit',
      'footstep',
    ])
      for (const combo of [1, 2, 3]) events.push({ type, actor: 'hero', class: cls, combo });
  for (const actor of ['hero', 'companion', 'enemy'])
    for (const style of [
      'arrow',
      'magic',
      'holy',
      'spectral',
      'cinder',
      'axe',
      'stone',
      'spit',
      'beam',
    ])
      for (const type of ['projectileLaunch', 'projectileImpact'])
        events.push({ type, actor, style });
  events.push(
    { type: 'melee', actor: 'companion', role: 'soldier', special: 'power-strike' },
    { type: 'chargedArea', companion: true, effect: 'holy-cleave' },
    { type: 'chargedArea', companion: true, effect: 'piercing-volley' },
    { type: 'projectileLaunch', style: 'magic', beam: true },
    { type: 'projectileLaunch', style: 'arrow', rapid: true },
    { type: 'projectileLaunch', style: 'arrow', special: 'triple-shot' },
  );
  for (const event of events) {
    const a = new Audio();
    a.ctx = { currentTime: 1, state: 'running' };
    for (const method of ['tone', 'noiseBurst', 'sweep'])
      a[method] = (...args) => effects.push([method, ...args]);
    routes.push(a.soundKind(event));
    a.effect(event);
  }
  return {
    catalog: hash(Audio.themes),
    defaults: hash(Audio.defaults),
    scheduledMusic: hash(music),
    effectRecipes: hash(effects),
    effectRoutes: hash(routes),
    scheduledNotes: music.length,
    effectEvents: events.length,
  };
};
