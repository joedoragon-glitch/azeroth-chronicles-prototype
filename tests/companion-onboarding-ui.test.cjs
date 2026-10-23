'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  { shell } = require('./helpers/production-shell.cjs');
for (const language of ['en', 'es']) {
  const { scope: s, elements: e, storage, events, frame } = shell(language),
    g = s.Prototype.game;
  const npc = g.zone().npcs.find((n) => n.kind === 'recruiter');
  const click = (prefix) => {
    const b = e.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
    assert(b, prefix);
    assert(!b.disabled);
    b.click();
  };
  assert(
    e
      .get('objective')
      .textContent.includes(language === 'en' ? 'Meet the town Captain' : 'Habla con el capitán'),
  );
  Object.assign(g.hero, { x: npc.x, y: npc.y });
  e.get('touch-interact-button').click();
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Meet your company' : 'Conoce a tu compañía',
  );
  assert(
    !e
      .get('modal-actions')
      .children.some((b) => /Open recruitment|Abrir reclutamiento/.test(b.textContent)),
  );
  const briefing = e.get('modal-description').textContent;
  assert(
    briefing.includes(language === 'en' ? 'Soldier: close combat.' : 'Soldado: combate cercano.'),
  );
  assert(
    briefing.includes(
      language === 'en'
        ? 'Ranger: ranged attacks + healing.'
        : 'Ranger: ataques a distancia + curación.',
    ),
  );
  assert(briefing.trim().split(/\s+/).length <= 40);
  assert(!briefing.includes('Expedition Rank 2'));

  click(language === 'en' ? 'Practice Recall squad' : 'Probar Reagrupar');
  assert(e.get('modal').hidden);
  assert(e.get('recall-button').classList.contains('tutorial-highlight'));
  assert(!g.s.quests['quest-barracks'].recallPracticed);
  assert(!g.s.recallActive);
  assert(!JSON.parse(storage.get('azeroth-v4-normal')).quests['quest-barracks'].recallPracticed);
  // Keep the real active frame loop running before the learner presses Recall.
  events.keydown.forEach((fn) => fn({ code: 'ArrowRight', preventDefault() {} }));
  for (let i = 1; i <= 120; i++) {
    frame(i * 17);
    if (i === 4) events.keyup.forEach((fn) => fn({ code: 'ArrowRight', preventDefault() {} }));
    assert(
      e.get('recall-button').classList.contains('tutorial-highlight'),
      'Recall stays highlighted through active frames',
    );
    assert(!g.s.quests['quest-barracks'].recallPracticed);
  }

  const health = g.s.party.map((u) => u.hp);
  g.s.party.forEach((u) => (u.hp = 0));
  e.get('recall-button').click();
  assert(e.get('modal').hidden);
  assert(e.get('recall-button').classList.contains('tutorial-highlight'));
  assert(!g.s.quests['quest-barracks'].recallPracticed);
  g.s.party.forEach((u, i) => (u.hp = health[i]));
  e.get('recall-button').click();
  assert(!e.get('modal').hidden);
  assert(!e.get('recall-button').classList.contains('tutorial-highlight'));
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Meet your company' : 'Conoce a tu compañía',
  );
  assert(
    !e
      .get('modal-actions')
      .children.some((b) => /Open recruitment|Abrir reclutamiento/.test(b.textContent)),
  );
  const acknowledgement = e.get('modal-description').textContent;
  assert(acknowledgement.includes(language === 'en' ? 'Orders cancelled.' : 'Órdenes canceladas.'));
  assert(acknowledgement.includes(language === 'en' ? 'without chasing' : 'sin perseguir'));
  assert(acknowledgement.includes(language === 'en' ? 'FREE' : 'GRATIS'));
  assert(acknowledgement.trim().split(/\s+/).length <= 40);
  assert(g.s.recallActive);
  assert(g.s.quests['quest-barracks'].recallPracticed);
  assert(JSON.parse(storage.get('azeroth-v4-normal')).quests['quest-barracks'].recallPracticed);
  assert(
    e
      .get('objective')
      .textContent.includes(language === 'en' ? 'Recall practiced' : 'Reagrupar practicado'),
  );
  click(language === 'en' ? 'Continue' : 'Continuar');
  assert(!e.get('modal').hidden);
  const directions = e.get('modal-description').textContent;
  assert(directions.includes(language === 'en' ? 'Leave town.' : 'Sal del pueblo.'));
  assert(
    directions.includes(
      language === 'en'
        ? 'Open Menu → Establish Basic Barracks'
        : 'Abre Menú → Establecer cuartel básico',
    ),
  );
  assert(directions.trim().split(/\s+/).length <= 32);
  assert(g.s.quests['quest-barracks'].barracksBriefed);
  assert(JSON.parse(storage.get('azeroth-v4-normal')).quests['quest-barracks'].barracksBriefed);
  assert(C.restore(g.snapshot()).s.quests['quest-barracks'].barracksBriefed);
  assert(g.questProgress(g.questDefs()[0]).includes('off the road'));
  assert(
    e.get('objective').textContent.includes(language === 'en' ? 'FIELD BASE' : 'BASE DE CAMPO'),
  );
  click(language === 'en' ? "Let's go" : 'Vamos');
  e.get('touch-interact-button').click();
  assert(e.get('modal-title').textContent.includes('Captain'));
  click(language === 'en' ? 'Companion basics' : 'Lo básico de tus compañeros');
  click(language === 'en' ? 'Practice Recall squad' : 'Probar Reagrupar');
  assert(e.get('modal').hidden);
  assert(e.get('recall-button').classList.contains('tutorial-highlight'));
  events.keydown.forEach((fn) => fn({ code: 'KeyQ', preventDefault() {} }));
  assert(!e.get('modal').hidden);
  assert(!e.get('recall-button').classList.contains('tutorial-highlight'));
  click(language === 'en' ? 'Continue' : 'Continuar');
  click(language === 'en' ? "Let's go" : 'Vamos');
  g.s.expeditionRank = 2;
  g.hero.gold = 0;
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  click(language === 'en' ? 'Recruit Soldier' : 'Reclutar Soldado');
  assert.equal(g.s.recruitmentRequest.type, 'soldier');
  assert(JSON.parse(storage.get('azeroth-v4-normal')).recruitmentRequest);
  assert(
    e
      .get('modal-description')
      .textContent.includes(language === 'en' ? 'Queued recruitment' : 'Reclutamiento en cola'),
  );
  click(language === 'en' ? 'Cancel queued Soldier' : 'Cancelar en cola: Soldado');
  assert.equal(g.s.recruitmentRequest, null);
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).recruitmentRequest, null);
  g.s.party.push(g.unit('soldier', g.hero.x + 40, g.hero.y));
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  assert(e.get('modal-description').textContent.trim().split(/\s+/).length <= 24);
  assert(
    e
      .get('modal-actions')
      .children.some(
        (b) =>
          b.textContent === (language === 'en' ? 'Recruit at a Barracks' : 'Recluta en un cuartel'),
      ),
  );
  assert(
    !e
      .get('modal-actions')
      .children.some((b) =>
        /^(Recruit Soldier|Recruit Ranger|Reclutar Soldado|Reclutar Ranger)/.test(b.textContent),
      ),
  );
  const careDetails = e
    .get('modal-actions')
    .children.flatMap((b) => b.children.map((c) => c.textContent));
  assert(
    careDetails.includes(language === 'en' ? 'No fallen companions.' : 'No hay compañeros caídos.'),
  );
  assert(
    careDetails.includes(
      language === 'en' ? 'No wounded companions.' : 'No hay compañeros heridos.',
    ),
  );
  g.s.party.pop();

  s.Prototype.closeMenu();
  g.zone().enemies = [];
  g.s.party[0].hp = 0;
  g.s.party[1].hp = 10;
  g.s.party[1].healCd = 999;
  e.get('touch-interact-button').click();
  click(language === 'en' ? 'Recover fallen companion' : 'Recuperar compañero caído');
  assert.equal(
    JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.recovery.companionIds[0],
    g.s.party[0].id,
  );
  click(language === 'en' ? 'Treat wounded companions' : 'Curar compañeros heridos');
  assert(JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.treatment);
  const enemy = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 100, damage: 1, gold: 0, xp: 0 },
    { x: g.hero.x + 80, y: g.hero.y },
  );
  enemy.aggro = true;
  g.zone().enemies = [enemy];
  g.hero.gold = 40;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 40);
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  assert(
    e
      .get('modal-description')
      .textContent.includes(language === 'en' ? 'nearby combat' : 'combate cercano'),
  );
  click(language === 'en' ? 'Cancel queued recovery' : 'Cancelar recuperación en cola');
  click(language === 'en' ? 'Cancel queued treatment' : 'Cancelar tratamiento en cola');
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.recovery, null);
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.treatment, null);
  enemy.aggro = false;
  s.Prototype.closeMenu();
  const board = g.zone().npcs.find((n) => n.kind === 'quests');
  Object.assign(g.hero, { x: board.x, y: board.y });
  e.get('touch-interact-button').click();
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Quest board' : 'Tablón de misiones',
  );
  assert(!e.get('modal-actions').children.some((b) => b.textContent === 'Story guide'));
  assert(e.get('modal-actions').children.some((b) => b.textContent.includes('Mira')));
  assert(!e.get('modal-actions').children.some((b) => b.textContent.includes('Stolen Stores')));
  click(language === 'en' ? 'Side Quests' : 'Misiones secundarias');
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Side Quests' : 'Misiones secundarias',
  );
  assert(
    e
      .get('modal-actions')
      .children.some((b) =>
        b.textContent.includes(language === 'en' ? 'Stolen Stores' : 'Suministros robados'),
      ),
  );
  // Highlight survives menu navigation/reopening and a rejected placement, then ends on construction.
  s.Prototype.closeMenu();
  g.s.party.forEach((u) => {
    u.hp = u.maxHp;
    u.order = null;
  });
  g.hero.gold = 0;
  g.zone().enemies = [];
  Object.assign(g.hero, { x: 600, y: 1500 });
  const buildPrefix = language === 'en' ? 'Establish Basic Barracks' : 'Establecer cuartel básico';
  const buildButton = () =>
    e.get('modal-actions').children.find((b) => b.textContent.startsWith(buildPrefix));
  e.get('menu-button').click();
  assert(buildButton().classList.contains('tutorial-highlight'));
  events.keydown.forEach((fn) => fn({ code: 'ArrowDown', preventDefault() {} }));
  assert(buildButton().classList.contains('tutorial-highlight'));
  s.Prototype.closeMenu();
  e.get('menu-button').click();
  assert(buildButton().classList.contains('tutorial-highlight'));
  const route = g.route;
  g.route = () => [];
  click(buildPrefix);
  assert(!g.hasAnyBarracks());
  assert(buildButton().classList.contains('tutorial-highlight'));
  g.route = route;
  click(buildPrefix);
  assert(g.hasAnyBarracks());
  assert(e.get('modal').hidden);
  assert(g.s.party.some((u) => u.order?.type === 'build'));
  assert.equal(g.hero.gold, 0);
  assert(g.questProgress(g.questDefs()[0]).includes('Construction in progress'));
  e.get('menu-button').click();
  assert(!buildButton().classList.contains('tutorial-highlight'));

  const base = g.zone().buildings.find((b) => b.kind === 'barracks');
  const text = (en, es) => (language === 'en' ? en : es);
  const shortHeader = () =>
    assert(e.get('modal-description').textContent.trim().split(/\s+/).length <= 40);
  const back = () => e.get('close-button').click();
  const openBase = () => {
    s.Prototype.closeMenu();
    Object.assign(g.hero, { x: base.x, y: base.y });
    e.get('touch-interact-button').click();
  };
  openBase();
  assert.equal(
    e.get('modal-title').textContent,
    text('Barracks under construction', 'Cuartel en construcción'),
  );
  shortHeader();
  base.progress = 4;
  g.s.party.forEach((u) => {
    u.order = null;
  });
  g.checkQuests();
  openBase();
  assert.equal(e.get('modal-title').textContent, text('Basic Barracks', 'Cuartel básico'));
  shortHeader();
  const rootLabels = e.get('modal-actions').children.map((b) => b.textContent);
  assert.equal(rootLabels.length, 5);
  for (const label of [
    text('Company', 'Compañía'),
    text('Recovery', 'Recuperación'),
    text('Training', 'Entrenamiento'),
    text('Operations', 'Operaciones'),
  ])
    assert(rootLabels.includes(label));
  assert(
    !rootLabels.some((label) =>
      /Recover fallen|Set death|Rescued specialists|Skill journal/.test(label),
    ),
  );

  click(text('Recovery', 'Recuperación'));
  shortHeader();
  assert(
    e
      .get('modal-description')
      .textContent.includes(text('Local death loss: 15%', 'Pérdida local al caer: 15%')),
  );
  click(text('Set death recovery point', 'Establecer punto de reaparición'));
  assert.equal(g.s.barracksRespawn.id, base.id);
  assert.equal(e.get('modal-title').textContent, text('Recovery', 'Recuperación'));
  back();
  assert.equal(e.get('modal-title').textContent, text('Basic Barracks', 'Cuartel básico'));

  g.s.expeditionRank = 1;
  click(text('Company', 'Compañía'));
  assert(
    e
      .get('modal-actions')
      .children.some(
        (b) =>
          b.textContent === text('Recruitment — Expedition 2', 'Reclutamiento — Expedición 2') &&
          b.disabled,
      ),
  );
  back();
  g.s.expeditionRank = 2;
  click(text('Company', 'Compañía'));
  shortHeader();
  assert(
    !e
      .get('modal-actions')
      .children.some((b) => b.textContent === text('Recovery', 'Recuperación')),
  );
  click(text('Manage active group', 'Gestionar grupo activo'));
  shortHeader();
  assert.equal(e.get('modal-actions').children.length, g.rosterCount());
  back();
  click(text('Recruit companions', 'Reclutar compañeros'));
  shortHeader();
  click(text('Recruit Soldier', 'Reclutar Soldado'));
  assert.equal(g.s.recruitmentRequest.barracksId, base.id);
  click(text('Cancel queued Soldier', 'Cancelar en cola: Soldado'));
  assert.equal(g.s.recruitmentRequest, null);
  back();
  click(text('Name companions', 'Nombrar compañeros'));
  shortHeader();
  back();
  click(text('Boss pet collection', 'Colección de mascotas de jefes'));
  shortHeader();
  const family = g.petCollection()[0].boss.id;
  click(g.petDefinition(family).name);
  assert(!e.get('modal-actions').children.some((b) => /^(First|Charged) ·/.test(b.textContent)));
  click(text('Pet skills', 'Habilidades de mascota'));
  shortHeader();
  assert.equal(e.get('modal-actions').children.length, 2);
  back();
  back();
  back();
  back();
  assert.equal(e.get('modal-title').textContent, text('Basic Barracks', 'Cuartel básico'));

  click(text('Training', 'Entrenamiento'));
  shortHeader();
  assert.equal(e.get('modal-actions').children.length, 3);
  click(text('Rescued specialists', 'Especialistas rescatados'));
  shortHeader();
  assert(
    e
      .get('modal-actions')
      .children.some(
        (b) =>
          b.textContent ===
          text('No specialists rescued yet', 'Aún no hay especialistas rescatados'),
      ),
  );
  back();
  back();
  click(text('Operations', 'Operaciones'));
  shortHeader();
  click(text('Local objectives', 'Objetivos locales'));
  assert.equal(e.get('modal-title').textContent, text('Quest board', 'Tablón de misiones'));
  back();
  assert.equal(e.get('modal-title').textContent, text('Operations', 'Operaciones'));
  click(text('Gather resources', 'Recoger recursos'));
  shortHeader();
  assert.equal(e.get('modal-title').textContent, text('Resources & labor', 'Recursos y trabajo'));
  back();
  back();
  g.s.expeditionRank = 4;
  openBase();
  const upgrade = e
    .get('modal-actions')
    .children.find((b) => b.textContent.startsWith('Upgrade to Full Barracks'));
  assert(upgrade?.disabled, 'upgrade still needs its normal crowns');
  assert(upgrade.textContent.includes(String(g.barracksUpgradeCost())));
  base.full = true;
  base.upgradeProgress = 4;
  base.upgradePaid = true;
  openBase();
  assert.equal(e.get('modal-title').textContent, 'Full Barracks');
  const fullRoot = e.get('modal-actions').children.map((b) => b.textContent);
  assert.deepEqual(fullRoot.slice(0, 4), [
    text('Company', 'Compañía'),
    text('Recovery', 'Recuperación'),
    text('Training', 'Entrenamiento'),
    text('Operations', 'Operaciones'),
  ], 'Full Barracks follows the same four categories as Basic Barracks');
  assert(!fullRoot.some((label) =>
    /Recover fallen|Rescued specialists|Skill journal|Expediciones de recursos|Resource expeditions/.test(label)),
    'Full services are nested under their matching category',
  );
  click(text('Recovery', 'Recuperación'));
  assert(
    e.get('modal-actions').children.some((b) =>
      b.textContent.startsWith(text('Recover fallen companion', 'Recuperar compañero caído'))),
    'Full recovery still offers companion care',
  );
  assert(e.get('modal-description').textContent.includes('5%'), 'Full still explains its 5% death-loss rule');
  back();
  click(text('Training', 'Entrenamiento'));
  assert(e.get('modal-actions').children.some(
    (b) => b.textContent === text('Rescued specialists', 'Especialistas rescatados')),
  );
  back();
  click(text('Operations', 'Operaciones'));
  assert(e.get('modal-actions').children.some(
    (b) => b.textContent === text('Resource expeditions', 'Expediciones de recursos')),
    'Full-only resource expeditions remain reachable',
  );
  click(text('Resource expeditions', 'Expediciones de recursos'));
  assert.equal(e.get('modal-title').textContent, text('Resource expeditions', 'Expediciones de recursos'));
  back();
  assert.equal(e.get('modal-title').textContent, text('Operations', 'Operaciones'));
  back();
  click(text('Company', 'Compañía'));
  assert(
    !e.get('modal-actions').children.some((b) => b.textContent === text('Recovery', 'Recuperación')),
    'the redundant Full Company recovery shortcut is removed',
  );
}
console.log(
  'PASS production English/Spanish captain interaction, staged objective, Recall, queue/cancel menu feedback and immediate action saves',
);
