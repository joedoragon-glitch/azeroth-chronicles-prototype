/* Dormant Ogre Strategist Field Labs. Does not register itself in the browser.
 * Uses the existing Campaign.s, crowns and future shared Acid stock. No wall-clock timers.
 * Source and remote navigation adapters MUST be backed by actual world/navigation owners.
 */
(function (root) {
  'use strict';
  const REGIONS = Object.freeze(['vale', 'march', 'highlands', 'frontier', 'crown']);
  const MATERIALS = Object.freeze(['water', 'wood', 'mineral', 'fire']);
  const PRODUCTS = Object.freeze({
    water: 'waterReagent', wood: 'woodEssence',
    mineral: 'mineralCatalyst', fire: 'fireElixir',
  });
  // Candidates, not approved prices or balance. Supplied independently of live rules
  // until owning teams can reconcile a rules.balance namespace without conflicts.
  const CANDIDATE = Object.freeze({
    labCrowns: 50, trainingCrowns: 20, windmillCrowns: 75,
    constructionSeconds: 20, travelSpeed: 90, sampleSeconds: 2,
    retrySeconds: 8, processingSeconds: 6, remoteEfficiency: 0.55,
    baseWorkerSlots: 1, workerSlotsPerRank: 1, baseStorage: 36,
    storagePerRank: 12, rankCrowns: [65, 95, 130],
    maxRank: 3, maximumDt: 0.1, maximumSourceRange: 3800,
  });
  const finitePoint = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const finiteCount = (n) => Number.isSafeInteger(n) && n >= 0;
  const points = (route) => Array.isArray(route) && route.length > 0 &&
    route.length <= 128 && route.every(finitePoint);
  const clone = (p) => ({ x: p.x, y: p.y });
  const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);

  function install(Campaign, adapters = {}) {
    const materials = adapters.materials;
    const navigation = adapters.navigation;
    const safeFromThreat = adapters.safeFromThreat;
    const authenticatedLocation = adapters.authenticatedLocation;
    const verifySource = adapters.verifySource;
    const validSetup = materials && typeof materials.forGather === 'function' &&
      navigation && typeof navigation.route === 'function' &&
      typeof navigation.passable === 'function' &&
      typeof safeFromThreat === 'function' &&
      typeof authenticatedLocation === 'function' && typeof verifySource === 'function';

    class FieldLabs {
      fieldLabConfig() { return CANDIDATE; }
      fieldLabNetwork(create = false) {
        if (!this.s || !this.s.zones) return null;
        let bank = this.s.strategistLabEconomy;
        if (!bank && create && this.hero?.class === 'strategist') {
          bank = {
            alchemyRank: 0,
            samples: { water: 0, wood: 0, mineral: 0, fire: 0 },
            products: { waterReagent: 0, woodEssence: 0, mineralCatalyst: 0, fireElixir: 0 },
            jobs: {},
          };
          this.s.strategistLabEconomy = bank;
        }
        return bank || null;
      }
      fieldLabs() {
        return REGIONS.flatMap((zoneId) =>
          (this.s.zones?.[zoneId]?.buildings || [])
            .filter((b) => b.kind === 'strategist-field-lab' && b.zoneId === zoneId)
            .map((b) => ({ zoneId, lab: b })));
      }
      fieldLab(zoneId) {
        if (!REGIONS.includes(zoneId)) return null;
        return this.fieldLabs().find((entry) => entry.zoneId === zoneId)?.lab || null;
      }
      fieldLabManaged() { return this.hero?.class === 'strategist'; }
      fieldLabStorageLimit() {
        return CANDIDATE.baseStorage +
          CANDIDATE.storagePerRank * (this.fieldLabNetwork()?.alchemyRank || 0);
      }
      fieldLabWorkerLimit() {
        return CANDIDATE.baseWorkerSlots +
          CANDIDATE.workerSlotsPerRank * (this.fieldLabNetwork()?.alchemyRank || 0);
      }
      fieldLabStockCount() {
        const bank = this.fieldLabNetwork();
        if (!bank) return 0;
        return [...Object.values(bank.samples), ...Object.values(bank.products),
          this.s.strategistAcidBottles || 0].reduce((sum, n) => sum + (finiteCount(n) ? n : 0), 0);
      }
      fieldLabCanManage(zoneId) {
        // Any established Lab can be a remote network console; only the owner class
        // can change the network. The physical Lab must be in the current region.
        return this.fieldLabManaged() && this.s.zone === zoneId && !!this.fieldLab(zoneId);
      }
      buildFieldLab(zoneId, site) {
        if (!this.fieldLabManaged() || !REGIONS.includes(zoneId) ||
            this.s.zone !== zoneId || this.fieldLab(zoneId) || !finitePoint(site) ||
            this.s.mode === 'arena' || this.isDungeon?.()) return false;
        const zone = this.s.zones[zoneId];
        if (!zone || !Array.isArray(zone.buildings) ||
            !zone.buildings.some((b) => b.kind === 'barracks' &&
              typeof b.id === 'string' && b.id.startsWith('barracks-')))
          return false; // An unfinished placed Barracks qualifies.
        if (typeof this.blocked !== 'function' || this.blocked(site.x, site.y, zoneId, 42) ||
            typeof this.route !== 'function' || !this.route(this.hero, site).length ||
            zone.buildings.some((b) => finitePoint(b) && distance(site, b) < 105) ||
            typeof this.spend !== 'function') return false;
        if (!this.spend(CANDIDATE.labCrowns)) return false;
        const lab = {
          id: 'strategist-lab-' + this.s.nextId++, kind: 'strategist-field-lab',
          name: 'Field Lab', x: site.x, y: site.y, zoneId,
          progress: 0, windmill: false, workSeconds: 0, processSeconds: 0,
        };
        zone.buildings.push(lab);
        this.fieldLabNetwork(true);
        return lab;
      }
      advanceFieldLabConstruction(dt) {
        if (!this.fieldLabManaged() || !Number.isFinite(dt) || dt <= 0 ||
            dt > CANDIDATE.maximumDt) return;
        const lab = this.fieldLab(this.s.zone);
        if (lab && lab.progress < 4) {
          lab.workSeconds = Math.min(CANDIDATE.constructionSeconds, (lab.workSeconds || 0) + dt);
          lab.progress = Math.min(4, 4 * lab.workSeconds / CANDIDATE.constructionSeconds);
        }
      }
      trainFieldLabWorker(workerId) {
        if (!this.fieldLabManaged() || typeof workerId !== 'string') return false;
        const u = this.s.party?.find((p) => p.id === workerId);
        if (!this.fieldLabWorkerEligible(u, false)) return false;
        if (u.fieldLabTrained === true) return true; // Never recharge a qualification.
        if (!this.spend(CANDIDATE.trainingCrowns)) return false;
        u.fieldLabTrained = true;
        return true;
      }
      fieldLabWorkerEligible(u, forAssignment = true) {
        if (!u || !this.s.party?.includes(u) || typeof u.id !== 'string' ||
            !finiteCount(Math.floor(u.hp)) || u.hp <= 0 ||
            !['soldier', 'archer', 'pet'].includes(u.type) && !u.charmOrigin) return false;
        // A claimed monster identity is not permission to work. Existing owner
        // validates the six-field capture receipt against authenticated captures.
        if (u.charmOrigin && (typeof this.isCharmedCompanion !== 'function' ||
            !this.isCharmedCompanion(u))) return false;
        if (u.type === 'pet' && (typeof this.petDefinition !== 'function' ||
            !this.petDefinition(u.petFamily))) return false;
        if (u.expeditionId || u.keeperHeld || u.deathRollHeld ||
            u.order || u.fieldLabJob || this._companionCharges?.has(u.id)) return false;
        // Assignment is an explicit owner action. Either an idle active
        // companion or a verified inactive reserve may be selected; never
        // silently take the starting Soldier/Archer away from the hero.
        if (forAssignment && u.fieldLabTrained !== true) return false;
        return true;
      }
      assignFieldLabWorker(fromZone, labZone, workerId, material) {
        if (!this.fieldLabCanManage(fromZone) || !MATERIALS.includes(material) ||
            !REGIONS.includes(labZone) || !validSetup) return false;
        const bank = this.fieldLabNetwork(), lab = this.fieldLab(labZone);
        const worker = this.s.party?.find((u) => u.id === workerId);
        if (!bank || !lab || lab.progress < 4 || !this.fieldLabWorkerEligible(worker) ||
            Object.keys(bank.jobs).filter((id) => bank.jobs[id].zoneId === labZone).length >=
              this.fieldLabWorkerLimit()) return false;
        // Reserves don't encode their last region in existing v4 saves.
        // An adapter must *prove* the current zone and position. Never infer
        // the lab's region from inactive companion x/y, or teleport a worker.
        const location = authenticatedLocation(this, worker);
        if (!location || location.zoneId !== labZone || !finitePoint(location.point) ||
            !finitePoint(worker) || distance(location.point, worker) > 0.01 ||
            !safeFromThreat(this, labZone, location.point, worker)) return false;
        const stationPath = navigation.route(this, labZone, location.point, lab);
        if (!this.fieldLabValidRoute(labZone, location.point, stationPath, lab)) return false;
        const job = {
          zoneId: labZone, labId: lab.id, workerId, material, position: clone(location.point),
          phase: 'station', path: stationPath.map(clone), waypoint: 0,
          sampleLeft: 0, carries: false, retryAt: this.s.time || 0,
          target: null, sourceId: null,
        };
        job.wasActive = worker.active !== false;
        worker.active = false; // Native active-party exclusion during paid labor.
        worker.order = { type: 'strategist-field-lab', id: lab.id };
        worker.fieldLabJob = lab.id;
        bank.jobs[workerId] = job;
        return true;
      }
      unassignFieldLabWorker(fromZone, workerId) {
        if (!this.fieldLabCanManage(fromZone)) return false;
        const bank = this.fieldLabNetwork(), job = bank?.jobs[workerId];
        if (!job) return false;
        const worker = this.s.party.find((u) => u.id === workerId);
        if (worker && worker.fieldLabJob === job.labId) {
          worker.x = job.position.x; worker.y = job.position.y;
          worker.order = null; delete worker.fieldLabJob;
          // Do not reactivate or move the reserve to the hero's region.
        }
        delete bank.jobs[workerId];
        return true;
      }
      upgradeFieldLabWindmill(fromZone, labZone) {
        if (!this.fieldLabCanManage(fromZone)) return false;
        const lab = this.fieldLab(labZone);
        if (!lab || lab.progress < 4 || lab.windmill ||
            !this.spend(CANDIDATE.windmillCrowns)) return false;
        lab.windmill = true; // Requires no Neri education.
        lab.productionPriority = 'acid'; // Preserve surplus instead of auto-consuming it.
        return true;
      }
      setFieldLabProductionPriority(fromZone, labZone, priority) {
        if (!this.fieldLabCanManage(fromZone) ||
            !['acid', 'reagents', 'balanced'].includes(priority)) return false;
        const lab = this.fieldLab(labZone);
        if (!lab || lab.progress < 4 ||
            (priority !== 'reagents' && !lab.windmill)) return false;
        lab.productionPriority = priority;
        return true; // No extra worker or invented source.
      }
      learnAdvancedLabAlchemy(fromZone) {
        if (!this.fieldLabCanManage(fromZone) ||
            adapters.neriRescued?.(this) !== true) return false;
        const bank = this.fieldLabNetwork(), rank = bank?.alchemyRank;
        if (!Number.isInteger(rank) || rank < 0 || rank >= CANDIDATE.maxRank ||
            !this.spend(CANDIDATE.rankCrowns[rank])) return false;
        bank.alchemyRank++;
        return true; // Separate from all five paid combat skill lessons.
      }
      fieldLabValidRoute(zoneId, origin, path, target) {
        if (!points(path) || !finitePoint(origin) || !finitePoint(target) ||
            distance(path[path.length - 1], target) > 24) return false;
        let at = origin;
        for (const waypoint of path) {
          if (navigation.passable(this, zoneId, at, waypoint) !== true) return false;
          at = waypoint;
        }
        return true;
      }
      fieldLabMove(job, dt, worker) {
        if (!points(job.path) || !finitePoint(job.position)) return false;
        let left = CANDIDATE.travelSpeed * dt;
        while (left > 0 && job.waypoint < job.path.length) {
          const to = job.path[job.waypoint], d = distance(job.position, to);
          if (!navigation.passable(this, job.zoneId, job.position, to)) return false;
          if (d <= 0.001) { job.waypoint++; continue; }
          const step = Math.min(left, d);
          job.position.x += (to.x - job.position.x) * step / d;
          job.position.y += (to.y - job.position.y) * step / d;
          left -= step;
          if (step >= d - 0.001) job.waypoint++;
        }
        worker.x = job.position.x; worker.y = job.position.y;
        return job.waypoint >= job.path.length;
      }
      fieldLabPlanTrip(job, worker, lab) {
        if (!validSetup || (this.s.time || 0) < job.retryAt) return false;
        job.retryAt = (this.s.time || 0) + CANDIDATE.retrySeconds;
        // #770 authentic forGather API. One *scheduled* source query at a
        // decision event, not a scan on each simulation/render frame.
        // The route/passable functions MUST work for the specified region.
        let approvedPath = null;
        const source = materials.forGather(this, job.material, {
          lab: { zone: job.zoneId, id: lab.id }, worker: clone(job.position),
          range: CANDIDATE.maximumSourceRange,
          authorize: (g, l) => g === this && l.id === lab.id &&
            this.fieldLabNetwork()?.jobs[job.workerId] === job &&
            job.phase === 'idle',
          zone: this.s.zones[job.zoneId],
          rules: adapters.rules,
          route: (from, point, zone) => {
            const candidate = navigation.route(this, zone.id, from, point);
            approvedPath = points(candidate) ? candidate : null;
            return candidate;
          },
          passable: (from, point, zone) => navigation.passable(this, zone.id, from, point),
        });
        if (!source || !finitePoint(source.point)) return false;
        // Reuse the path already authenticated by #770 instead of solving twice.
        const path = approvedPath;
        if (!this.fieldLabValidRoute(job.zoneId, job.position, path, source.point))
          return false;
        job.sourceId = source.id; job.target = clone(source.point);
        job.path = path.map(clone); job.waypoint = 0; job.phase = 'outbound';
        return true;
      }
      fieldLabDeliver(job, worker) {
        const bank = this.fieldLabNetwork();
        if (!bank || !job.carries || this.fieldLabStockCount() >= this.fieldLabStorageLimit())
          return false;
        bank.samples[job.material]++;
        job.carries = false;
        job.phase = 'idle'; job.sourceId = null; job.target = null;
        job.path = []; job.waypoint = 0;
        worker.x = job.position.x; worker.y = job.position.y;
        return true;
      }
      fieldLabMakeProduct(job, lab, dt) {
        const bank = this.fieldLabNetwork();
        if (job.phase !== 'idle' || !bank || this.fieldLabStockCount() >= this.fieldLabStorageLimit())
          return false;
        lab.processSeconds = (lab.processSeconds || 0) + dt *
          (job.zoneId === this.s.zone ? 1 : CANDIDATE.remoteEfficiency);
        if (lab.processSeconds < CANDIDATE.processingSeconds) return false;
        lab.processSeconds -= CANDIDATE.processingSeconds;
        const input = job.material, output = PRODUCTS[input];
        if (lab.windmill && lab.productionPriority !== 'reagents') {
          // A single authenticated idle worker operates the machine. The
          // recipe consumes two distinct SURPLUS genuine samples; each must
          // retain one sample for ordinary reagent preparation.
          const kinds = MATERIALS.filter((key) => finiteCount(bank.samples[key]) &&
            bank.samples[key] >= 2).slice(0, 2);
          if (kinds.length === 2) {
            bank.samples[kinds[0]]--; bank.samples[kinds[1]]--;
            if (!finiteCount(this.s.strategistAcidBottles)) {
              // Imported unsafe stock is never silently overwritten.
              bank.samples[kinds[0]]++; bank.samples[kinds[1]]++;
              return false;
            }
            this.s.strategistAcidBottles++;
            return true;
          }
        }
        if (lab.windmill && lab.productionPriority === 'acid') return false;
        if (!finiteCount(bank.samples[input]) || !finiteCount(bank.products[output]) ||
            bank.samples[input] < 1) return false;
        bank.samples[input]--; bank.products[output]++;
        return true;
      }
      advanceFieldLabEconomy(dt) {
        // Called only by a future *authorized Campaign.tick integration*.
        // No call site in this draft, no Date.now and no offline catch-up.
        if (!Number.isFinite(dt) || dt <= 0 || dt > CANDIDATE.maximumDt) return;
        const bank = this.fieldLabNetwork();
        if (!bank || !validSetup) return;
        this.advanceFieldLabConstruction(dt);
        let planned = false; // At most one source-selection wake-up per tick.
        for (const [workerId, job] of Object.entries(bank.jobs)) {
          const lab = this.fieldLab(job.zoneId);
          const worker = this.s.party?.find((u) => u.id === workerId);
          if (!lab || lab.id !== job.labId || lab.progress < 4 || !worker ||
              worker.hp <= 0 || worker.fieldLabTrained !== true ||
              worker.fieldLabJob !== lab.id || worker.order?.type !== 'strategist-field-lab' ||
              worker.expeditionId || !MATERIALS.includes(job.material) ||
              !finitePoint(job.position) || !safeFromThreat(this, job.zoneId, job.position, worker))
            continue; // No invented safe progress through an enemy encounter.
          if (job.phase === 'station' || job.phase === 'outbound' || job.phase === 'return') {
            const waypoint = job.path?.[job.waypoint];
            if (waypoint && !navigation.passable(this, job.zoneId, job.position, waypoint)) {
              if ((this.s.time || 0) >= job.retryAt) {
                job.retryAt = (this.s.time || 0) + CANDIDATE.retrySeconds;
                const destination = job.phase === 'outbound' ? job.target : lab;
                const replanned = navigation.route(this, job.zoneId, job.position, destination);
                if (this.fieldLabValidRoute(job.zoneId, job.position, replanned, destination)) {
                  job.path = replanned.map(clone); job.waypoint = 0;
                }
              }
              continue;
            }
            if (!this.fieldLabMove(job, dt, worker)) continue;
            if (job.phase === 'station') { job.phase = 'idle'; job.path = []; }
            else if (job.phase === 'outbound') {
              job.phase = 'sampling'; job.sampleLeft = CANDIDATE.sampleSeconds;
            } else this.fieldLabDeliver(job, worker);
          } else if (job.phase === 'sampling') {
            job.sampleLeft -= dt * (job.zoneId === this.s.zone ? 1 :
              CANDIDATE.remoteEfficiency);
            if (job.sampleLeft > 0) continue;
            if (!verifySource(this, job.zoneId, job.material, job.sourceId, job.target)) {
              job.phase = 'idle'; job.carries = false; job.path = [];
              job.sourceId = null; job.target = null;
              job.retryAt = (this.s.time || 0) + CANDIDATE.retrySeconds;
              continue;
            }
            // One bounded return replan per retry interval when a dynamic
            // obstruction appears; never retry a region-scale route each frame.
            if ((this.s.time || 0) < job.retryAt) continue;
            const back = navigation.route(this, job.zoneId, job.position, lab);
            if (!this.fieldLabValidRoute(job.zoneId, job.position, back, lab)) {
              job.retryAt = (this.s.time || 0) + CANDIDATE.retrySeconds;
              continue;
            }
            job.carries = true; job.phase = 'return';
            job.retryAt = (this.s.time || 0) + CANDIDATE.retrySeconds;
            job.path = back.map(clone); job.waypoint = 0;
          } else if (job.phase === 'idle') {
            if (job.carries) { // Storage was full when returning.
              this.fieldLabDeliver(job, worker); continue;
            }
            if (this.fieldLabMakeProduct(job, lab, dt)) continue;
            if (!planned && (this.s.time || 0) >= job.retryAt) {
              planned = true;
              this.fieldLabPlanTrip(job, worker, lab);
            }
          }
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(FieldLabs.prototype))
      if (name !== 'constructor')
        Object.defineProperty(Campaign.prototype, name,
          Object.getOwnPropertyDescriptor(FieldLabs.prototype, name));
    return Object.freeze({ readyForTrips: !!validSetup, config: CANDIDATE });
  }
  const api = Object.freeze({ install, MATERIALS, PRODUCTS, REGIONS, CANDIDATE });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeStrategistFieldLabs = api;
})(typeof window !== 'undefined' ? window : globalThis);
