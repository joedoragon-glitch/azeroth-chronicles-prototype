'use strict';
// Focused campaign-to-director integration: real Succession/ending transitions,
// not a synthetic gameOver flag in a disconnected productionCue unit test.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const { audio } = require('./helpers/audio-context.cjs');
const create = (mode, options = {}) => new Campaign(mode, 'paladin', () => 0.25, options);
const makeAudio = (campaign) => {
  const a = audio();
  a.enableProduction();
  a.context = a.describe(campaign);
  a.updateEnvironment = () => {};
  a.sceneDetails = () => {};
  a.setRecordedScore = async () => false; // No audio downloads in routing-only regression.
  return a;
};
const deliver = (a, campaign) => {
  const events = campaign.effects.splice(0);
  for (const event of events) a.effect(event);
  return events.map((e) => e.type);
};
const scene = (a, c, activity = {}) => a.productionCue(a.describe(c, activity));
{
  const c = create('normal', { succession: true }), a = makeAudio(c);
  c.die();
  assert(c.s.challenge.pending, 'multiple successors must retain selection');
  assert(!c.s.challenge.gameOver, 'intermediate loss is not Game Over');
  assert(deliver(a, c).includes('death'));
  assert.equal(scene(a, c, { menu: true }).id, 'defeat');
  a.updateProduction(a.describe(c, { menu: true }));
  assert.equal(a.mixScene, 'world', 'successor choice must not bury the loss song under menu attenuation');
  a.ctx.currentTime = 3;
  assert(c.successor('mage'), 'explicit successor works by original Campaign rule');
  assert(deliver(a, c).includes('successor'));
  assert.equal(scene(a, c).id, 'defeat', 'selection fades the loss rather than hard cutting it');
  a.ctx.currentTime = 9;
  assert.notEqual(scene(a, c).id, 'defeat', 'intermediate loss is bounded');
}
{
  const c = create('normal', { succession: true }), a = makeAudio(c);
  c.s.challenge.fallen = Object.keys(Campaign.classes).filter((id) => !['paladin', 'mage'].includes(id));
  c.die();
  const events = deliver(a, c);
  assert(events.includes('death') && events.includes('successor'));
  assert.equal(c.hero.class, 'mage', 'single successor auto-handoff is a campaign decision');
  assert(!c.s.challenge.pending && !c.s.challenge.gameOver);
  assert.equal(scene(a, c).id, 'defeat', 'same-frame auto-handoff must not suppress the song');
}
{
  const c = create('normal', { succession: true }), a = makeAudio(c);
  c.s.challenge.fallen = Object.keys(Campaign.classes).filter((id) => id !== 'paladin');
  c.die();
  const events = deliver(a, c);
  assert(events.includes('death') && events.includes('gameOver'));
  assert(c.s.challenge.gameOver && !c.s.challenge.pending);
  assert.equal(scene(a, c, { menu: true }).id, 'defeat');
  a.ctx.currentTime = 60;
  assert.equal(scene(a, c).id, 'defeat', 'terminal screen retains the established Game Over score');
}
for (const mode of ['normal', 'nightmare', 'arena']) {
  const c = create(mode), a = makeAudio(c);
  c.die();
  deliver(a, c);
  assert(!c.s.challenge.gameOver, mode + ' is not Game Over');
  assert.notEqual(scene(a, c).id, 'defeat', mode + ' recovery has no new loss score');
}
{
  const c = create('normal'), a = makeAudio(c);
  assert.equal(scene(a, c, { started: false }).id, 'title', 'main title');
  assert.notEqual(scene(a, c).id, 'title', 'gameplay exits title score');
  c.s.true.darklord = true;
  c.s.throneClaimed = true;
  for (const id of Campaign.dungeonIds) c.s.true[id] = true;
  const missing = Campaign.dungeonIds.at(-1);
  c.s.true[missing] = false;
  c.checkEnding();
  assert(!c.peace && !c.effects.some((e) => e.type === 'peace'), 'all five TRUE dungeons required');
  c.s.true[missing] = true;
  c.checkEnding();
  assert(c.peace, 'actual TRUE Dark Lord + claimed throne + five TRUE dungeons trigger peace');
  const events = deliver(a, c);
  assert(events.includes('peace'), 'a qualifying end emits its one-time peace event');
  assert.equal(a.finaleUntil, 49, 'Finale holds its approximately 48-second intended phrase');
  assert.equal(scene(a, c).id, 'finale');
  a.ctx.currentTime = 50;
  assert.notEqual(scene(a, c).id, 'finale', 'Finale transitions into location peace score');
  assert(scene(a, c).id.startsWith('peace-'));
  c.checkEnding();
  assert(!c.effects.some((e) => e.type === 'peace'), 'ending is not re-triggered');
}
console.log('PASS live campaign death/auto/selection/exhaustion/recovery/endgate event-driven soundtrack routing');
