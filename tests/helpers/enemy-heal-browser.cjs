'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');

exports.verifyEnemyHealing = async function (page, out, tag) {
  try {
    const result = await page.evaluate(() => {
      const g = new Campaign('normal', 'mage', () => 0.9);
      g.s.zone = 'highlands';
      g.s.mercyTime = 0;
      const z = g.zone();
      z.props = [];
      z.buildings = [];
      z.npcs = [];
      z.nodes = [];
      z.enemies = [];
      Object.assign(g.hero, { x: 900, y: 900, hp: g.hero.maxHp * 0.1 });
      g.s.party = [
        g.unit('soldier', 920, 900),
        g.unit('archer', 930, 900),
        g.unit('pet', 940, 900, 'crypt'),
      ];
      for (const u of g.s.party) u.hp = u.maxHp * 0.1;
      const playerHp = [g.hero, ...g.s.party].map((u) => u.hp);
      const make = (name, x) =>
        g.makeEnemy(
          { species: 'ogre', name, level: 8, hp: 1000, damage: 0, gold: 0, xp: 0 },
          { x, y: 900 },
        );
      const caster = make('Ogre stone thrower', 850),
        recipient = make('Ogre', 960);
      Object.assign(caster, { ranged: true, aggro: true });
      Object.assign(recipient, { hp: 400, aggro: true });
      z.enemies = [caster, recipient];
      if (!g.enemySupportHeal(caster)) throw Error('Native ogre healing fixture must cast');
      const canvas = document.createElement('canvas');
      canvas.id = 'enemy-heal-canvas';
      const ratio = document.querySelector('#world').width / innerWidth;
      canvas.width = Math.round(innerWidth * ratio);
      canvas.height = Math.round(innerHeight * ratio);
      Object.assign(canvas.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '999999',
        width: innerWidth + 'px',
        height: innerHeight + 'px',
      });
      document.body.append(canvas);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const traces = [];
      const painter = PrototypeRenderer.create({
        canvas,
        ctx,
        getGame: () => g,
        Campaign,
        PrototypeVisuals,
        platform: {
          cameraZoom: 1.5,
          cameraAnchor: () => ({ x: innerWidth * 0.5, y: innerHeight * 0.5 }),
        },
        PrototypeCombatVisuals: {
          ...PrototypeCombatVisuals,
          enemySupportHeal(...args) {
            traces.push({ ...args[2] });
            return PrototypeCombatVisuals.enemySupportHeal(...args);
          },
        },
        chargePresentation: () => null,
        isPaused: () => false,
        now: () => 16000,
      });
      painter.queue(g.effects);
      painter.draw();
      Object.assign(g.hero, { x: recipient.x, y: recipient.y });
      recipient.x += 90;
      caster.y += 30;
      traces.length = 0;
      const beforeDraw = JSON.stringify(g.snapshot());
      painter.draw();
      const trace = traces.at(-1);
      const pure = JSON.stringify(g.snapshot()) === beforeDraw;
      g.advanceEnemySupportHeal(recipient, 1);
      window.__enemyHealAudit = { g, painter, recipient, caster, traces, canvas };
      return {
        trace,
        recipient: { x: recipient.x, y: recipient.y, id: recipient.id, hp: recipient.hp },
        casterY: caster.y,
        playerHp,
        afterPlayerHp: [g.hero, ...g.s.party].map((u) => u.hp),
        pure,
      };
    });
    assert.equal(result.trace?.target, result.recipient.id);
    assert.equal(
      result.trace?.x,
      result.recipient.x,
      'native recovery follows its enemy, not the hero at the old location',
    );
    assert.equal(result.trace?.y, result.recipient.y);
    assert.equal(result.trace?.fromY, result.casterY);
    assert(result.recipient.hp > 400, 'the actual enemy receives healing');
    assert.deepEqual(result.afterPlayerHp, result.playerHp, 'hero and companions receive none');
    assert(result.pure, 'native drawing never mutates the campaign');
    await page
      .locator('#enemy-heal-canvas')
      .screenshot({ path: path.join(out, 'enemy-heal-recipient-' + tag + '.png') });
    const lifecycle = await page.evaluate(() => {
      const { g, painter, recipient, caster, traces } = __enemyHealAudit;
      const counts = [];
      for (const state of ['dead', 'neutral', 'removed']) {
        recipient.hp = state === 'dead' ? 0 : 400;
        recipient.neutral = state === 'neutral';
        if (state === 'removed') g.zone().enemies = [caster];
        traces.length = 0;
        painter.draw();
        counts.push(traces.length);
      }
      return counts;
    });
    assert.deepEqual(
      lifecycle,
      [0, 0, 0],
      'dead, neutral or departed enemies leave no recovery on the hero',
    );
    console.log('PASS native hostile healing HP boundary, moving recipient and lifecycle ' + tag);
  } finally {
    await page.evaluate(() => {
      window.__enemyHealAudit?.canvas.remove();
      delete window.__enemyHealAudit;
    });
  }
};
