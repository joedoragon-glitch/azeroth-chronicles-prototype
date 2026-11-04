/* Optional v4 Field Lab validation. Strictly dormant until Strategist admission.
 * No migration of old four-class saves, no Date.now and no inventory creation.
 */
(function (root) {
  'use strict';
  const REGIONS = ['vale','march','highlands','frontier','crown'];
  const MATERIALS = ['water','wood','mineral','fire'];
  const PRODUCTS = ['waterReagent','woodEssence','mineralCatalyst','fireElixir'];
  const PHASES = ['station','idle','outbound','sampling','return'];
  const C = Object.freeze({ maxRank: 3, baseStorage: 36, storagePerRank: 12,
    baseWorkers: 1, workersPerRank: 1, buildSeconds: 20, processSeconds: 6,
    retrySeconds: 8, maxPath: 128, maxJobs: 20 });
  const fail = (message) => { throw Error('Invalid Field Lab save: ' + message); };
  const plain = (v) => !!v && typeof v === 'object' && !Array.isArray(v) &&
    (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
  const only = (v, keys) => plain(v) &&
    Object.keys(v).every(k => keys.includes(k));
  const point = (p, limit) => plain(p) && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    p.x >= 0 && p.y >= 0 && p.x <= limit && p.y <= limit;
  const count = (n, max) => Number.isSafeInteger(n) && n >= 0 && n <= max;
  const close = (a,b) => Math.hypot(a.x-b.x,a.y-b.y) <= 0.02;
  function validate(s, options = {}) {
    if (!plain(s) || !plain(s.zones) || !Array.isArray(s.party)) fail('campaign');
    const bank = s.strategistLabEconomy;
    const labs = REGIONS.flatMap((zoneId) => (s.zones[zoneId]?.buildings || [])
      .filter(b => b.kind === 'strategist-field-lab').map(lab => ({ zoneId,lab })));
    // Old saves cannot accidentally acquire a Lab wallet or trained-worker
    // qualification just by loading, and no four-class author is admitted.
    if (bank === undefined) {
      if (labs.length || s.party.some(u => u.fieldLabTrained !== undefined ||
          u.fieldLabJob !== undefined ||
          u.order?.type === 'strategist-field-lab')) fail('orphan data');
      return false;
    }
    if (s.hero?.class !== 'strategist' &&
      !(s.challenge?.succession === true &&
        s.challenge.fallen?.includes('strategist')))
      fail('hero provenance');
    if (!only(bank, ['foundedByStrategist','alchemyRank','samples','products','jobs']) ||
        bank.foundedByStrategist !== true ||
        !count(bank.alchemyRank, C.maxRank) ||
        !only(bank.samples, MATERIALS) || !only(bank.products, PRODUCTS) ||
        !only(bank.jobs, Object.keys(bank.jobs || {}))) fail('network');
    const capacity = C.baseStorage + bank.alchemyRank * C.storagePerRank;
    for (const key of MATERIALS)
      if (!count(bank.samples[key], capacity)) fail('sample count');
    for (const key of PRODUCTS)
      if (!count(bank.products[key], capacity)) fail('product count');
    // E0 owns carried Acid (provisional 1,000); the Lab warehouse does NOT
    // own a second bottle cap. The caller supplies E0's exact max on admission.
    const e0Cap = options.maxBottles ?? 1000;
    if (!count(e0Cap, 100000) || e0Cap === 0 ||
        !count(s.strategistAcidBottles, e0Cap)) fail('canonical Acid stock');
    const total = [...MATERIALS.map(k=>bank.samples[k]),
      ...PRODUCTS.map(k=>bank.products[k])]
      .reduce((a,b)=>a+b,0);
    if (total > capacity) fail('storage overflow');
    if (labs.length < 1 || labs.length > REGIONS.length ||
      new Set(labs.map(x=>x.zoneId)).size !== labs.length) fail('Lab count');
    const labIds = new Set();
    for (const {zoneId,lab} of labs) {
      const zone = s.zones[zoneId], size = options.zoneSize?.(zoneId) ?? 5000;
      if (!plain(lab) ||
          !only(lab, ['id','kind','name','x','y','zoneId','progress','windmill',
            'workSeconds','processSeconds','productionPriority']) ||
          !/^strategist-lab-[1-9]\d{0,9}$/.test(lab.id) ||
          labIds.has(lab.id) || lab.zoneId !== zoneId ||
          lab.name !== 'Field Lab' || !point(lab,size) ||
          !Number.isFinite(lab.progress) || lab.progress < 0 || lab.progress > 4 ||
          !Number.isFinite(lab.workSeconds) ||
          lab.workSeconds < 0 || lab.workSeconds > C.buildSeconds ||
          lab.windmill !== true && lab.windmill !== false ||
          !Number.isFinite(lab.processSeconds) ||
          lab.processSeconds < 0 || lab.processSeconds >= C.processSeconds + 1e-6 ||
          !['acid','reagents','balanced',undefined].includes(lab.productionPriority) ||
          (!lab.windmill && lab.productionPriority !== undefined &&
            lab.productionPriority !== 'reagents') ||
          (lab.windmill && lab.progress < 4) ||
          !zone.buildings.some(b => b.kind === 'barracks' &&
            typeof b.id === 'string' && /^barracks-\d+$/.test(b.id)))
        fail('building');
      labIds.add(lab.id);
    }
    const jobIds = Object.keys(bank.jobs);
    if (jobIds.length > C.maxJobs) fail('job count');
    const counts = new Map();
    const roster = new Map();
    for (const u of s.party) {
      if (!plain(u) || typeof u.id !== 'string' || roster.has(u.id)) fail('roster');
      roster.set(u.id,u);
      if (u.fieldLabTrained !== undefined && u.fieldLabTrained !== true)
        fail('worker qualification');
      const job = bank.jobs[u.id];
      if (u.fieldLabJob !== undefined && (!job || u.fieldLabJob !== job.labId))
        fail('orphan job');
      if (u.order?.type === 'strategist-field-lab' &&
          (!job || u.order.id !== job.labId)) fail('orphan work order');
    }
    for (const [id,job] of Object.entries(bank.jobs)) {
      const u = roster.get(id);
      if (!only(job, ['zoneId','labId','workerId','material','position','phase',
          'path','waypoint','sampleLeft','carries','retryAt','target','sourceId',
          'wasActive','blocked','threatId']) ||
          !u || u.fieldLabTrained !== true || u.fieldLabJob !== job.labId ||
          u.order?.type !== 'strategist-field-lab' ||
          u.order.id !== job.labId || u.active !== false ||
          !(u.hp > 0) || u.expeditionId ||
          job.workerId !== id || !REGIONS.includes(job.zoneId) ||
          !MATERIALS.includes(job.material) || !PHASES.includes(job.phase) ||
          !labIds.has(job.labId) ||
          !labs.some(x => x.lab.id === job.labId && x.zoneId === job.zoneId) ||
          !point(job.position, options.zoneSize?.(job.zoneId) ?? 5000) ||
          !point(u, options.zoneSize?.(job.zoneId) ?? 5000) ||
          !close(job.position,u) ||
          !Array.isArray(job.path) || job.path.length > C.maxPath ||
          !job.path.every(p=>point(p, options.zoneSize?.(job.zoneId) ?? 5000)) ||
          !count(job.waypoint, job.path.length) ||
          !Number.isFinite(job.sampleLeft) || job.sampleLeft < -0.1 ||
          job.sampleLeft > 2.1 ||
          typeof job.carries !== 'boolean' ||
          !Number.isFinite(job.retryAt) || job.retryAt < 0 ||
          job.retryAt > s.time + C.retrySeconds + 1 ||
          typeof job.wasActive !== 'boolean' ||
          (job.blocked !== undefined && typeof job.blocked !== 'boolean') ||
          (job.threatId !== undefined &&
            (typeof job.threatId !== 'string' || job.threatId.length > 150)) ||
          (job.target !== null && !point(job.target,options.zoneSize?.(job.zoneId) ?? 5000)) ||
          (job.sourceId !== null && (typeof job.sourceId !== 'string' ||
            job.sourceId.length > 150)) ||
          (job.phase === 'station' && (job.sourceId !== null || job.target !== null)) ||
          (job.phase === 'idle' && (job.sourceId !== null || job.target !== null)) ||
          (job.phase === 'sampling' && (!job.target || !job.sourceId)) ||
          (job.phase === 'outbound' && (!job.target || !job.sourceId)) ||
          (job.phase === 'return' && job.carries !== true) ||
          (job.phase !== 'return' && job.phase !== 'idle' && job.carries))
        fail('assignment');
      counts.set(job.zoneId,(counts.get(job.zoneId)||0)+1);
    }
    for (const n of counts.values())
      if (n > C.baseWorkers + bank.alchemyRank*C.workersPerRank)
        fail('worker capacity');
    return true;
  }
  const api = Object.freeze({ validate });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeStrategistLabSave = api;
})(typeof window !== 'undefined' ? window : globalThis);
