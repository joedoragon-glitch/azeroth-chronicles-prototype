'use strict';
const C = require('../../src/prototype/engine'),
  V = require('../../src/prototype/visuals'),
  Sprites = require('../../src/prototype/sprites');
const project = (e) => ({ x: (e.x - e.y) * 0.76, y: (e.x + e.y) * 0.27 });
function campaignEntities(id, width = 1280, height = 800) {
  const game = new C('normal', 'paladin', () => 0.7);
  game.enter(id);
  const focus = project(game.hero),
    anchor = { x: width / 1.5 / 2, y: height / 1.5 / 2 },
    entities = [];
  for (const [list, renderKind] of [
    [game.zone().props, 'prop'],
    [game.visibleNPCs(), 'npc'],
    [game.visibleResourceNodes(), 'node'],
    [game.zone().buildings, 'building'],
    [game.zone().enemies, 'enemy'],
    [game.activeLivingParty(), 'ally'],
    [[game.hero], 'hero'],
  ])
    for (const e of list) {
      if (renderKind === 'enemy' && e.hp <= 0) continue;
      const p = project(e),
        x = p.x - focus.x + anchor.x,
        y = p.y - focus.y + anchor.y;
      if (x < -180 || x > width / 1.5 + 180 || y < -180 || y > height / 1.5 + 180) continue;
      const entity = { ...e, renderKind };
      const found = Sprites.definitionFor(entity, game.regionIndex(), !!game.s.rescued[e.family]);
      if ((V.featureScale(entity) || 1) > 1)
        entity.visualScale = V.assetSafeScale(entity, found?.entry);
      entities.push(entity);
    }
  entities.sort((a, b) => a.x + a.y - b.x - b.y);
  const measure = (e) =>
    Sprites.height(e, game.regionIndex(), !!game.s.rescued[e.family], V.height(e));
  return { name: id + '-' + width, entities, project, height: measure };
}
function crowded(name, actorCount, coverCount, clutterCount) {
  const entities = [];
  for (let i = 0; i < actorCount; i++)
    entities.push({
      id: 'actor-' + i,
      renderKind: i === 0 ? 'hero' : i < 4 ? 'ally' : 'enemy',
      hp: 100,
      x: 500 + (i % 8) * 12,
      y: 500 + Math.floor(i / 8) * 16,
    });
  for (let i = 0; i < coverCount + clutterCount; i++)
    entities.push({
      id: 'cover-' + i,
      renderKind: 'prop',
      structure: i < coverCount ? ['house', 'dead-tree', 'stonewall'][i % 3] : 'grass',
      x: 505 + (i % 14) * 21,
      y: 505 + Math.floor(i / 14) * 25,
    });
  entities.sort((a, b) => a.x + a.y - b.x - b.y);
  return { name, entities, project, height: V.height };
}
function scenes() {
  Sprites.installManifest(require('../../assets/sprites/manifest.json'));
  return [
    ...['vale', 'march', 'highlands', 'frontier', 'crown', 'crypt', 'mine', 'archive'].flatMap(
      (id) => [campaignEntities(id), campaignEntities(id, 375, 812)],
    ),
    crowded('cover-clutter-stress', 31, 32, 128),
    crowded('actor-cover-stress', 61, 100, 64),
    crowded('empty-cover-stress', 31, 0, 160),
  ];
}
function edgeScenes() {
  const base = crowded('edge', 31, 32, 128);
  return [
    {
      ...base,
      name: 'no-actor-cover-stress',
      entities: base.entities.filter((e) => e.renderKind === 'prop'),
    },
    {
      ...base,
      name: 'dead-neutral-only-cover-stress',
      entities: base.entities.map((e) =>
        e.renderKind === 'prop' ? e : { ...e, renderKind: 'enemy', hp: 0, neutral: true },
      ),
    },
  ];
}
module.exports = { scenes, edgeScenes, crowded, project };
