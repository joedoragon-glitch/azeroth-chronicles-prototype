/* Dormant bilingual Field Lab menus. UI reads Campaign state and delegates every
 * mutation to its guarded domain methods; no duplicate wallet or menu save.
 */
(function(root) {
  'use strict';
  const LABELS = Object.freeze({
    en: {
      title: 'Field Lab network', absent: 'No usable Field Lab is nearby.',
      ready: 'Ready', building: 'Under construction', windmill: 'Windmill installed',
      noWindmill: 'No windmill', remote: 'Remote: reduced rate', local: 'Local rate',
      network: 'Regional laboratories', stores: 'Material stores', workers: 'Workers',
      training: 'Train a worker', assign: 'Assign worker', recall: 'Release worker',
      material: 'Choose a gathering material', noWorker: 'No eligible idle companions',
      progress: 'Progress', none: 'None', noLabs: 'No other established Labs',
      upgrade: 'Build windmill', priority: 'Processing preference',
      acid: 'Acid Bottles first', reagents: 'Prepare reagents', balanced: 'Balanced',
      neri: 'Advanced Alchemy with Neri', rescue: 'Rescue Neri to learn Advanced Alchemy.',
      trained: 'Qualified', untrained: 'Training needed', active: 'In field party',
      reserve: 'In reserve', cost: 'crowns', water: 'Water', mineral: 'Mineral',
      wood: 'Wood', fire: 'Fire', waterReagent: 'Water Reagent',
      mineralCatalyst: 'Mineral Catalyst', woodEssence: 'Wood Essence',
      fireElixir: 'Fire Elixir', bottles: 'Acid Bottles', storage: 'Storage',
      slots: 'Worker slots', noFunds: 'Insufficient crowns or conditions not met.',
      failed: 'Assignment unavailable: ownership, route or safety check failed.',
      success: 'Assignment accepted.', windmillHelp: 'Consumes surplus samples; never creates bottles without materials and staffing.',
      trainingHelp: 'One qualification purchase per companion. Never consumes a combat skill lesson.',
      releaseHelp: 'A remote worker remains in reserve where they actually are.',
    },
    es: {
      title: 'Red de laboratorios', absent: 'No hay un laboratorio disponible cerca.',
      ready: 'Listo', building: 'En construcción', windmill: 'Molino instalado',
      noWindmill: 'Sin molino', remote: 'Remoto: producción reducida', local: 'Producción local',
      network: 'Laboratorios regionales', stores: 'Almacén de materiales', workers: 'Trabajadores',
      training: 'Capacitar trabajador', assign: 'Asignar trabajador', recall: 'Retirar trabajador',
      material: 'Elegir material de recolección', noWorker: 'No hay compañeros libres aptos',
      progress: 'Progreso', none: 'Ninguno', noLabs: 'No hay otros laboratorios establecidos',
      upgrade: 'Construir molino', priority: 'Prioridad de procesamiento',
      acid: 'Priorizar botellas de ácido', reagents: 'Preparar reactivos', balanced: 'Equilibrado',
      neri: 'Alquimia avanzada con Neri', rescue: 'Rescata a Neri para estudiar alquimia avanzada.',
      trained: 'Capacitado', untrained: 'Necesita capacitación', active: 'En el grupo activo',
      reserve: 'En reserva', cost: 'coronas', water: 'Agua', mineral: 'Mineral',
      wood: 'Madera', fire: 'Fuego', waterReagent: 'Reactivo de agua',
      mineralCatalyst: 'Catalizador mineral', woodEssence: 'Esencia de madera',
      fireElixir: 'Elixir de fuego', bottles: 'Botellas de ácido', storage: 'Almacén',
      slots: 'Plazas de trabajo', noFunds: 'Faltan coronas o requisitos.',
      failed: 'Asignación no disponible: falló una comprobación de propiedad, ruta o seguridad.',
      success: 'Asignación aceptada.', windmillHelp: 'Consume materiales sobrantes; nunca crea botellas sin recursos y personal.',
      trainingHelp: 'Cada compañero paga una sola capacitación. No desbloquea técnicas de combate.',
      releaseHelp: 'Un trabajador remoto sigue en reserva donde realmente se encuentra.',
    },
  });
  const REGIONS = {
    vale:['Greenwood Vale','Valle Verde'], march:['Flooded Marches','Marismas Inundadas'],
    highlands:['Ironroot Highlands','Tierras Altas de Raíz de Hierro'],
    frontier:['Ashen Frontier','Frontera Cenicienta'], crown:['Dark Crown','Corona Oscura'],
  };
  const MATERIALS = ['water','wood','mineral','fire'];
  function create({ getGame, action, openMenu, closeMenu, language = () => 'en',
      status = () => {}, distance = 155 }) {
    const es = () => language() === 'es';
    const t = (key) => LABELS[es() ? 'es' : 'en'][key] || key;
    const region = (id) => REGIONS[id]?.[es()?1:0] || id;
    const readableName = (u) => u.customName || u.name || u.id;
    const rerender = (source, back) => () => openLab(source, back);
    function guard(source) {
      const g = getGame();
      if (!g || g.hero?.class !== 'strategist' ||
          !g.fieldLabCanManage?.(source.zoneId) ||
          !g.fieldLab(source.zoneId) ||
          g.fieldLab(source.zoneId).id !== source.id ||
          Math.hypot(g.hero.x - source.x, g.hero.y - source.y) > distance)
        return null;
      return g;
    }
    function act(label, apply, help, disabled, source, back) {
      return action(label, () => {
        const g = guard(source);
        if (!g) return closeMenu();
        const result = apply(g);
        if (result === false) status(t('noFunds'));
        if (result !== false) status(t('success'));
        openLab(source,back);
      },help,!!disabled);
    }
    function openLab(source, back = closeMenu) {
      const g = guard(source);
      if (!g) { status(t('absent')); return closeMenu(); }
      const bank = g.fieldLabNetwork(), labs = g.fieldLabs(),
        cfg = g.fieldLabConfig();
      const summary = t('storage') + ': ' + g.fieldLabStockCount() + '/' +
        g.fieldLabStorageLimit() + '  ·  ' + t('slots') + ': ' +
        g.fieldLabWorkerLimit() + '\n' +
        labs.map(({zoneId,lab})=> region(zoneId) + ': ' +
          (lab.progress>=4?t('ready'):t('building')) + ' · ' +
          (lab.windmill?t('windmill'):t('noWindmill')) + ' · ' +
          (zoneId===g.s.zone?t('local'):t('remote'))).join('\n');
      const actions = [
        action(t('stores'),()=>stocks(source,back)),
        action(t('network'),()=>network(source,back)),
        action(t('training'),()=>training(source,back),t('trainingHelp')),
        action(t('neri')+' · '+ cfg.rankCrowns[bank?.alchemyRank || 0] +' '+t('cost'),
          ()=> {
            const current=guard(source);
            if (!current) return closeMenu();
            if (!current.learnAdvancedLabAlchemy(source.zoneId)) status(t('noFunds'));
            openLab(source,back);
          },t('rescue'), (bank?.alchemyRank||0)>=cfg.maxRank ||
            !g.s.rescued?.archive || !g.hero.gold ||
            g.hero.gold<cfg.rankCrowns[bank?.alchemyRank||0]),
      ];
      openMenu(t('title'),summary,actions,back);
    }
    function stocks(source, back) {
      const g=guard(source); if (!g) return closeMenu();
      const bank=g.fieldLabNetwork();
      const lines = [...MATERIALS.map(k=>t(k)+': '+(bank.samples[k]||0)),
        ...Object.keys(bank.products).map(k=>t(k)+': '+bank.products[k]),
        t('bottles')+': '+(g.s.strategistAcidBottles||0)];
      openMenu(t('stores'),lines.join('\n'),[],rerender(source,back));
    }
    function network(source,back) {
      const g=guard(source); if (!g) return closeMenu();
      openMenu(t('network'),t('title'),
        g.fieldLabs().map(({zoneId,lab})=>action(
          region(zoneId)+' · '+(lab.progress>=4?t('ready'):t('building')),
          ()=>manage(source,zoneId,back),
          (lab.windmill?t('windmill'):t('noWindmill'))+' · '+
            (zoneId===g.s.zone?t('local'):t('remote')))),
        rerender(source,back));
    }
    function manage(source,zoneId,back) {
      const g=guard(source); if (!g) return closeMenu();
      const lab=g.fieldLab(zoneId), bank=g.fieldLabNetwork(),
        workers=Object.values(bank.jobs).filter(job=>job.zoneId===zoneId),
        ready=lab?.progress>=4;
      if (!lab) return network(source,back);
      const actions=[
        action(t('workers')+' · '+workers.length+'/'+g.fieldLabWorkerLimit(),
          ()=>workerList(source,zoneId,back),t('trainingHelp'),!ready),
        action(t('assign'),()=>assign(source,zoneId,back),t('material'),
          !ready || workers.length>=g.fieldLabWorkerLimit()),
        action(t('upgrade')+' · '+g.fieldLabConfig().windmillCrowns+' '+t('cost'),
          ()=>{
            const now=guard(source);if(!now) return closeMenu();
            if(!now.upgradeFieldLabWindmill(source.zoneId,zoneId)) status(t('noFunds'));
            manage(source,zoneId,back);
          },t('windmillHelp'),!ready || lab.windmill ||
            g.hero.gold<g.fieldLabConfig().windmillCrowns),
        ...(['acid','reagents','balanced'].map(priority=>action(
          (lab.productionPriority===priority?'✓ ':'')+t(priority),
          ()=>{
            const now=guard(source);if(!now)return closeMenu();
            if(!now.setFieldLabProductionPriority(source.zoneId,zoneId,priority))
              status(t('failed'));
            manage(source,zoneId,back);
          },t('priority'),!ready || (!lab.windmill && priority!=='reagents')))),
      ];
      openMenu(region(zoneId)+' · '+t('title'),
        t('progress')+': '+Math.floor(lab.progress)+'/4',actions,
        ()=>network(source,back));
    }
    function workerList(source,zoneId,back) {
      const g=guard(source);if(!g)return closeMenu();
      const jobs=Object.entries(g.fieldLabNetwork().jobs).filter(([,job])=>job.zoneId===zoneId);
      openMenu(t('workers'),jobs.length?jobs.map(([id,job])=>
        readableName(g.s.party.find(u=>u.id===id)||{id})+' · '+t(job.material)).join('\n'):t('none'),
        jobs.map(([id,job])=>action(t('recall')+' · '+
          readableName(g.s.party.find(u=>u.id===id)||{id}),
          ()=>{
            const now=guard(source);if(!now)return closeMenu();
            if(!now.unassignFieldLabWorker(source.zoneId,id))status(t('failed'));
            workerList(source,zoneId,back);
          },t('releaseHelp'))),()=>manage(source,zoneId,back));
    }
    function training(source,back) {
      const g=guard(source);if(!g)return closeMenu();
      const workerCandidates=g.s.party.filter(u=>u.hp>0 && !u.expeditionId &&
        !u.order && !u.fieldLabJob && (u.type==='pet' ||
          ['soldier','archer'].includes(u.type) || u.charmOrigin));
      openMenu(t('training'),t('trainingHelp'),workerCandidates.map(u=>action(
        readableName(u)+' · '+(u.fieldLabTrained?t('trained'):t('untrained'))+
          ' · '+(u.active?t('active'):t('reserve')),
        ()=>{
          const now=guard(source);if(!now)return closeMenu();
          if(!now.trainFieldLabWorker(u.id)) status(t('noFunds'));
          training(source,back);
        },u.fieldLabTrained?t('trained'):
          g.fieldLabConfig().trainingCrowns+' '+t('cost'),
        u.fieldLabTrained===true || g.hero.gold<g.fieldLabConfig().trainingCrowns)),
      ()=>openLab(source,back));
    }
    function assign(source,zoneId,back) {
      const g=guard(source);if(!g)return closeMenu();
      const workerCandidates=g.s.party.filter(u=>
        u.fieldLabTrained===true && g.fieldLabWorkerEligible(u));
      openMenu(t('assign'),t('material'),workerCandidates.map(u=>
        action(readableName(u)+' · '+(u.active?t('active'):t('reserve')),
          ()=>materials(source,zoneId,u.id,back))),
        ()=>manage(source,zoneId,back));
    }
    function materials(source,zoneId,workerId,back) {
      const g=guard(source);if(!g)return closeMenu();
      openMenu(t('material'),t('failed'),MATERIALS.map(kind=>action(t(kind),()=>{
        const now=guard(source);
        if(!now)return closeMenu();
        if(!now.assignFieldLabWorker(source.zoneId,zoneId,workerId,kind))
          status(t('failed'));
        else status(t('success'));
        manage(source,zoneId,back);
      })),()=>assign(source,zoneId,back));
    }
    return Object.freeze({openLab,labels:LABELS});
  }
  const api=Object.freeze({create,LABELS});
  if(typeof module!=='undefined')module.exports=api;
  else root.PrototypeStrategistLabMenus=api;
})(typeof window !== 'undefined' ? window : globalThis);
