'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};
const idleDeadline = { timeRemaining: () => 20 };

(async () => {
  for (const language of ['en', 'es']) {
    const queued = [];
    const { scope, elements, storage, frame } =
      shell(language, 'ranger', { stayOnTitle: true, idleCallbacks: queued });
    const save = storage.get('azeroth-v4-normal'),
      game = scope.Prototype.game,
      initialState = JSON.stringify(game.snapshot());
    let calls = 0;
    scope.Prototype.renderer.prepareCurrentGround = () => {
      calls++;
      return true;
    };
    await flush();
    assert.equal(queued.length, 1, 'one idle job after inactive-title sprite warming');
    assert.equal(scope.Prototype.started, false);
    assert.equal(elements.get('title-screen').hidden, false);
    queued.shift()(idleDeadline);
    assert.equal(calls, 1, 'Canvas floor preparation executes only while idle on title');
    assert.equal(JSON.stringify(game.snapshot()), initialState,
      'inactive title preparation cannot change campaign');
    assert.equal(storage.get('azeroth-v4-normal'), save, 'preparation does not write saves');
    assert.equal(scope.Prototype.started, false, 'preparation never resumes simulation');

    // Returning to the title schedules a fresh guarded task.
    elements.get('title-continue').click();
    frame(400);
    assert.equal(scope.Prototype.started, true);
    const next = [];
    // Reopening the title is still an inactive save, using the common menu.
    elements.get('menu-button').click();
    const name = language === 'es' ? 'Volver al menú principal' : 'Return to Main Menu';
    const returnAction = elements.get('modal-actions').children.find(x => x.textContent === name);
    assert(returnAction);
    returnAction.click();
    await flush();
    while (queued.length) next.push(queued.shift());
    assert(next.length >= 1, 'return to title offers Canvas idle warmup');
    scope.document.hidden = true;
    for (const cb of next) cb(idleDeadline);
    assert.equal(calls, 1, 'hidden PWA must not prepare');
  }

  // Starting Continue before the queued idle callback must invalidate it.
  {
    const jobs = [], app = shell('en', 'paladin', { stayOnTitle: true, idleCallbacks: jobs });
    await flush();
    assert.equal(jobs.length, 1);
    let count = 0;
    app.scope.Prototype.renderer.prepareCurrentGround = () => { count++; return true; };
    app.elements.get('title-continue').click();
    jobs[0](idleDeadline);
    assert.equal(count, 0, 'pending title work cannot run after Continue starts');
    app.frame(250);
    assert.equal(app.scope.Prototype.started, true);
  }

  // If the browser does not expose an idle budget or the save is unavailable,
  // the existing Continue first-frame path remains unaffected.
  {
    const jobs = [], app = shell('en', 'paladin', { stayOnTitle: true, idleCallbacks: jobs });
    await flush();
    let count = 0;
    app.scope.Prototype.renderer.prepareCurrentGround = () => { count++; };
    jobs[0]({ timeRemaining: () => 1 });
    assert.equal(count, 0, 'insufficient idle budget skips synchronous paint');
    app.elements.get('title-continue').click();
    app.frame(350);
    assert.equal(app.scope.Prototype.started, true);
  }
  {
    const jobs = [];
    shell('en', 'paladin', { stayOnTitle: true, seedSave: false, idleCallbacks: jobs });
    await flush();
    assert.equal(jobs.length, 0, 'no campaign, no speculative zone preparation');
  }
  console.log('PASS Canvas title-only idle ground preparation, guard cancellation and saves');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
