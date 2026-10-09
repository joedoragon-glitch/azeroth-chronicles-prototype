/* Authored regions, settlements and interiors. Content work belongs here. */
(function (root) {
  'use strict';
  const roadPlans = new Map();
  function install(Campaign, { D, R, dungeonIds, classes }) {
    const clone = (x) => JSON.parse(JSON.stringify(x)),
      clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class World {
      settlementLayout(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.settlementLayoutVersion === 3
        )
          return;
        const i = this.regionIndex(z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const major = { x: D.towns[i][0], y: D.towns[i][1] },
            minor = { x: D.minors[i][0], y: D.minors[i][1] },
            keep = (p) =>
              !String(p.id || '').startsWith('structure-') &&
              !String(p.id || '').startsWith('settlement-') &&
              !(
                String(p.id || '').startsWith('forest-') &&
                (dist(p, major) < 390 || dist(p, minor) < 330)
              );
          z.props = z.props.filter(keep);
          const terrainSafe = (x, y, r) => {
            if (!this.blocked(x, y, z.id, r, true)) return { x, y };
            for (let d = 30; d <= 180; d += 30)
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
                if (!this.blocked(p.x, p.y, z.id, r, true)) return p;
              }
            return null;
          };
          const regionalStructures = [
            { house: 'vale-cottage', workshop: 'vale-workshop', fence: 'vale-fence' },
            { house: 'march-stilt-house', workshop: 'march-boathouse', fence: 'march-boardwalk' },
            { house: 'highland-stone-house', workshop: 'highland-smithy', fence: 'highland-wall' },
            {
              house: 'frontier-patched-house',
              workshop: 'frontier-workshop',
              fence: 'frontier-palisade',
            },
            { house: 'crown-ash-house', workshop: 'crown-forgehouse', fence: 'crown-wall' },
          ][i];
          const add = (center, layout, prefix) => {
            layout.forEach(([dx, dy, structure], j) => {
              const p = terrainSafe(center.x + dx, center.y + dy, 34);
              if (!p) return;
              z.props.push({
                id: 'settlement-' + prefix + '-' + j,
                ...p,
                r: 32,
                structure: regionalStructures[structure] || structure,
                roadBlocker: true,
              });
            });
          };
          add(major, R.settlementLayouts.major, 'major');
          add(minor, R.settlementLayouts.minor, 'minor');
          const by = (id) => z.npcs.find((n) => n.id === id),
            place = (id, dx, dy) => {
              const n = by(id);
              if (n)
                Object.assign(
                  n,
                  terrainSafe(major.x + dx, major.y + dy, 8) || {
                    x: major.x + dx,
                    y: major.y + dy,
                  },
                );
            };
          place('supplier', 115, -85);
          place('recruiter', -125, 90);
          place('board', 210, 55);
          place('rest', 0, 0);
          const crownTravelHub = (R.crownRoutes || []).some((r) => z.id === 'crown' && r.travelHub);
          const rearStand = R.travelArrivalStands?.[z.id];
          if (rearStand) {
            const homeward = by('return');
            if (homeward)
              Object.assign(homeward, terrainSafe(rearStand.x, rearStand.y, 8) || rearStand);
          } else if (!R.harbors?.[z.id] && !crownTravelHub) place('return', 150, 175);
          const minorRest = by('minor');
          if (minorRest) Object.assign(minorRest, terrainSafe(minor.x, minor.y, 8) || minor);
          z.boardPositionVersion = 2;
          if (z.id === 'vale') z.supplierPositionVersion = 2;
          z.settlementLayoutVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      roadNetwork(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || this.sideDungeon(z.id)) return;
        this.settlementLayout(z);
        const i = this.regionIndex(z.id),
          roadVersion = ['frontier', 'crown'].includes(z.id) ? 10 : 9;
        if (z.roadVersion === roadVersion) return;
        const origin = { x: D.towns[i][0], y: D.towns[i][1] },
          field = this.fieldCenter(i),
          oldZone = this.s.zone,
          key = z.id + ':v' + roadVersion;
        this.s.zone = z.id;
        const harbor = R.harbors?.[z.id],
          finalGate = i === 4 ? R.sites[i].find((s) => s[0] === 'fortress-gate') : null,
          frontierRoutes = z.id === 'frontier' ? (R.frontierRoutes || []).map((r) => r.point) : [],
          frontierSites =
            z.id === 'frontier'
              ? ['convoy', 'shrine', 'orc-bivouac']
                  .map((id) => R.sites[i].find((s) => s[0] === id))
                  .filter(Boolean)
                  .map((s) => [s[2], s[3]])
              : [],
          crownRoutes = z.id === 'crown' ? (R.crownRoutes || []).map((r) => r.point) : [],
          crownSites =
            z.id === 'crown'
              ? ['crown-barracks', 'siege']
                  .map((id) => R.sites[i].find((s) => s[0] === id))
                  .filter(Boolean)
                  .map((s) => [s[2], s[3]])
              : [],
          destinations = [
            D.minors[i],
            D.ports[i],
            D.entrances[i],
            [field.x, field.y],
            ...(finalGate ? [[finalGate[2], finalGate[3]]] : []),
            ...(harbor ? [[harbor.arrival.x, harbor.arrival.y]] : []),
            ...frontierRoutes,
            ...frontierSites,
            ...crownRoutes,
            ...crownSites,
          ],
          props = z.props,
          blockers = z.props
            .filter((p) => p.roadBlocker)
            .map((p) => ({ ...p, r: (p.r || 0) + 30 }));
        z.props = blockers;
        try {
          if (roadPlans.has(key)) z.roads = clone(roadPlans.get(key));
          else {
            z.roads = destinations
              .filter(([x, y]) => dist(origin, { x, y }) > 1)
              .map(([x, y]) => this.route(origin, { x, y }, { road: true }))
              .filter((p) => p.length > 1);
            roadPlans.set(key, clone(z.roads));
          }
        } finally {
          z.props = props;
          this.s.zone = oldZone;
        }
        const near = (p, a, b) => {
          const dx = b.x - a.x,
            dy = b.y - a.y,
            t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
          return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
        };
        z.props = z.props.filter(
          (p) =>
            p.roadBlocker ||
            p.structure ||
            !z.roads.some((path) =>
              path.some((b, j) => j && near(p, path[j - 1], b) < (p.r || 0) + 60),
            ),
        );
        z.roadVersion = roadVersion;
      }
      zone() {
        if (this.s.zones[this.s.zone]) {
          const z = this.s.zones[this.s.zone];
          if (!this.isDungeon()) {
            this.regionalDestinations(z);
            this.roadNetwork(z);
          }
          this.authoredPlaces(z);
          this.regionalTravelSafety(z);
          return z;
        }
        const i = this.regionIndex(),
          r = D.regions[i],
          dungeon = this.isDungeon(),
          id = this.s.zone;
        const z = {
          id,
          enemies: [],
          props: [],
          npcs: [],
          buildings: [],
          nodes: [],
          packTimers: {},
          clock: 0,
        };
        this.s.zones[id] = z;
        const room = this.supplyRoom();
        if (room) {
          z.room = true;
          z.treasury = room.boss;
          z.npcs.push({
            id: 'exit',
            name: 'Leave ' + room.name,
            kind: 'exit',
            x: 125,
            y: 155,
            icon: '🚪',
          });
          const cacheSpots = R.treasuryCacheSpots?.[id] || [
            [650, 365],
            [720, 690],
            [545, 760],
          ];
          for (let j = 0; j < room.count; j++) {
            const [x, y] = cacheSpots[j];
            const p = this.safe(x, y, id);
            z.npcs.push({
              id: 'bundle-' + j,
              name: room.name + ' cache ' + (j + 1),
              kind: 'bundle',
              index: j,
              ...p,
              icon: '📦',
            });
          }
          if (!this.peace) {
            const i = this.regionIndex(),
              r = D.regions[i],
              sp = D.species[i][0],
              gold = this.regionalEnemyRewards(i, 'roomGuard').gold,
              captainProfile = R.roomCaptains?.[id],
              authored = R.treasuryGuardFormations?.[id],
              posts =
                authored ||
                [
                  [320, 340],
                  [530, 360],
                  [590, 655],
                  [745, 590],
                ].map(([x, y], j) => ({ x, y, captain: j === 3 }));
            for (const [j, slot] of posts.entries()) {
              const captain = !!slot.captain && !!captainProfile,
                p = this.safe(slot.x, slot.y, id),
                e = this.makeEnemy(
                  {
                    species: sp[0],
                    name: captain ? captainProfile.name : slot.name || sp[1] + ' treasury guard',
                    icon: sp[2],
                    level: i * 3 + 2,
                    hp: (65 + i * 105) * (captain ? 2 : 1),
                    damage: (7 + i * 8) * (captain ? 1.25 : 1),
                    gold,
                    xp: this.regionalEnemyRewards(i, 'roomGuard').xp,
                  },
                  p,
                );
              e.guard = true;
              e.roomGuard = true;
              e.pack = id + '-' + (slot.group || 'guard-' + j);
              if (slot.role) e.forcedRole = slot.role;
              if (captain) {
                e.captain = true;
                e.roomCaptain = true;
                e.captainProfile = id;
                e.captainMentor = captainProfile.mentor;
                e.captainVisualIdol = captainProfile.visualIdol || captainProfile.mentor;
                e.visualScale = captainProfile.visualScale || 1.16;
                e.specialCd = 1.25;
                e.roomCaptainVersion = 1;
              }
              this.configureEnemy(e, j);
              z.enemies.push(e);
            }
          }
          this.treasuryInterior(z);
          this.guardianPopulation(z);
          this.roomCaptainPopulation(z);
          return z;
        }
        const side = this.sideDungeon();
        if (side) {
          z.sideDungeon = side.id;
          z.npcs.push({
            id: 'exit',
            name: 'Leave ' + side.name,
            kind: 'exit',
            sideExit: true,
            x: 120,
            y: 150,
            icon: '🚪',
          });
          for (const [j, [x, y, structure]] of (side.decor || []).entries())
            z.props.push({ id: 'side-decor-' + j, x, y, r: 0, decorative: true, structure });
          for (const [j, [x, y, radius]] of (side.walls || []).entries())
            z.props.push({
              id: 'side-wall-' + j,
              x,
              y,
              r: radius || 28,
              structure: 'pillar',
              sideDungeon: side.id,
            });
          if (!this.peace) {
            const species = D.species[i],
              preferred = species.find((s) => s[0] === side.species) || species[0],
              positions = [
                [245, 325],
                [355, 390],
                [735, 320],
                [845, 390],
                [250, 690],
                [365, 755],
                [700, 690],
                [830, 760],
                [515, 285],
                [560, 520],
                [520, 800],
                [290, 520],
                [780, 525],
                [565, 900],
                [890, 615],
                [190, 820],
              ];
            for (let j = 0; j < side.enemyCount; j++) {
              const sp = preferred,
                raw = positions[j % positions.length],
                p = this.safe(raw[0], raw[1], side.id),
                pack = Math.floor(j / 3),
                e = this.makeEnemy(
                  {
                    species: sp[0],
                    name: sp[1] + ' resident',
                    icon: sp[2],
                    level: Math.max(1, i * 3 + (pack % 2) + 1),
                    hp: 65 + i * 105,
                    damage: 7 + i * 8,
                    gold: this.regionalEnemyRewards(i).gold,
                    xp: this.regionalEnemyRewards(i).xp,
                  },
                  p,
                );
              e.pack = side.id + '-pack-' + pack;
              e.sideDungeon = true;
              this.configureEnemy(e, j);
              z.enemies.push(e);
            }
            this.ordinaryMeleePopulation(z);
            this.ordinaryRangedPopulation(z);
          }
          z.sideDungeonVersion = 1;
          return z;
        }
        const region = r.id,
          bosses = D.bosses.filter((b) => b.region === region),
          field = bosses.find((b) => b.kind === 'field'),
          boss = dungeon ? this.boss(id) : field;
        if (dungeon) {
          z.npcs.push(
            { id: 'exit', name: 'Return to ' + r.name, kind: 'exit', x: 160, y: 240, icon: '🚪' },
            {
              id: 'cage-' + boss.id,
              name: boss.captive,
              kind: 'cage',
              family: boss.id,
              x: 1200,
              y: 1270,
              icon: '🔒',
            },
          );
          if (id === 'citadel')
            z.npcs.push({
              id: 'fountain',
              name: 'Preparation fountain',
              kind: 'fountain',
              x: 430,
              y: 370,
              icon: '⛲',
            });
        } else {
          const [x, y] = D.towns[i],
            minor = D.minors[i];
          z.npcs.push(
            {
              id: 'supplier',
              name: r.town + ' Supplies',
              kind: 'supplier',
              x: x + 85,
              y: y - 40,
              icon: '🛒',
            },
            {
              id: 'recruiter',
              name: r.town + ' Captain',
              kind: 'recruiter',
              x: x - 80,
              y: y + 60,
              icon: '👥',
            },
            {
              id: 'board',
              name: r.town + ' Quest board',
              kind: 'quests',
              x: x + 70,
              y: y + 95,
              icon: '📜',
            },
            { id: 'rest', name: r.town + ' Refuge', kind: 'rest', x, y, icon: '🏠' },
            { id: 'minor', name: r.minor, kind: 'rest', x: minor[0], y: minor[1], icon: '🏡' },
          );
          const [px, py] = D.ports[i],
            outboundIcon = ['🐎', '⛵', '🐫', '🐉'][i] || '🛣️',
            returnIcon = ['', '🐎', '⛵', '🐫', '🐉'][i] || '🛣️';
          if (i < D.regions.length - 1)
            z.npcs.push({
              id: 'outbound',
              name: r.transport + ' to ' + D.regions[i + 1].name,
              kind: 'transport',
              direction: 1,
              x: px,
              y: py,
              icon: outboundIcon,
            });
          if (i > 0)
            z.npcs.push({
              id: 'return',
              name: 'Return to ' + D.regions[i - 1].name,
              kind: 'transport',
              direction: -1,
              x: x + 120,
              y: y + 150,
              icon: returnIcon,
            });
          const db = bosses.find((b) => b.kind === 'dungeon'),
            [ex, ey] = D.entrances[i];
          z.npcs.push({
            id: 'entrance',
            name: db.place,
            kind: 'dungeon',
            family: db.id,
            x: ex,
            y: ey,
            icon: '🏛️',
          });
          const { x: fx, y: fy } = this.fieldCenter(i);
          z.npcs.push({
            id: 'cage-' + field.id,
            name: field.captive,
            kind: 'cage',
            family: field.id,
            x: fx + 90,
            y: fy + 80,
            icon: '🔒',
          });
          for (let j = 0; j < 3; j++) {
            const p = this.safe(minor[0] + 150 + j * 70, minor[1] + 160 + j * 90);
            z.npcs.push({
              id: 'bundle-' + j,
              name: 'Quest supplies ' + (j + 1),
              kind: 'bundle',
              index: j,
              ...p,
              icon: '📦',
            });
          }
          const landmarks = [...D.entrances[i], ...D.ports[i]];
          for (let j = 0; j < 3; j++) {
            const p = this.safe(
              j === 0 ? minor[0] + 150 : j === 1 ? fx - 150 : ex - 180,
              j === 0 ? minor[1] + 40 : j === 1 ? fy + 180 : ey + 100,
            );
            z.npcs.push({
              id: 'landmark-' + j,
              name: ['Regional monument', 'Wildland lookout', 'Ancient ruins'][j],
              kind: 'landmark',
              ...p,
              icon: ['🗿', '🏕️', '🏚️'][j],
            });
          }
          // Regional companion labor is authored later as distributed Dark Lord Tribute; no generic bootstrap node.
          for (const [patch, [cx, cy, rx, ry]] of R.forests[i].entries())
            for (let k = 0; k < 45; k++) {
              const angle = k * 2.3999632297,
                radius = Math.sqrt((k + 0.5) / 45),
                x = cx + Math.cos(angle) * rx * radius,
                y = cy + Math.sin(angle) * ry * radius;
              if (
                z.npcs.some((n) => dist(n, { x, y }) < 150) ||
                dist({ x, y }, { x: fx, y: fy }) < 200 ||
                this.blocked(x, y, id, 50)
              )
                continue;
              z.props.push({
                id: 'forest-' + patch + '-' + k,
                x,
                y,
                r: 24,
                icon: i === 4 ? '🪨' : i === 3 ? '🌳' : k % 5 === 0 ? '🪨' : '🌲',
              });
            }
        }
        const count = dungeon ? this.dungeonGuardCount(id) : r.enemy_count,
          species = D.species[i],
          group = dungeon ? 2 : i < 2 ? 3 : i < 4 ? 4 : 5;
        for (let j = 0; j < count; j++) {
          const pack = Math.floor(j / group),
            g = dungeon ? this.dungeonGuardBlueprint(id, j) : null,
            s = g?.sp || species[pack % species.length],
            size = dungeon ? 1500 : r.size;
          const base = dungeon
            ? { x: g.x, y: g.y }
            : {
                x: 650 + ((pack * 337 + 71 * i) % (size - 900)),
                y: 500 + ((pack * 431 + 137 * i) % (size - 800)),
              };
          let p = this.safe(
            base.x + (dungeon ? 0 : (j % group) * 44),
            base.y + (dungeon ? 0 : ((j % group) % 2) * 50),
          );
          if (
            !dungeon &&
            D.towns.some(([tx, ty], ti) => ti === i && dist(p, { x: tx, y: ty }) < 260)
          )
            p = this.safe(base.x + 350, base.y + 250);
          const e = this.makeEnemy(
            {
              species: s[0],
              name: dungeon ? g.name : s[1],
              icon: s[2],
              level: Math.max(1, i * 3 + (pack % 2) + 1),
              hp: 65 + i * 105,
              damage: 7 + i * 8,
              gold: this.regionalEnemyRewards(i).gold,
              xp: this.regionalEnemyRewards(i, dungeon ? 'guard' : 'ordinary').xp,
            },
            p,
          );
          e.pack = dungeon ? g.pack : id + '-pack-' + pack;
          e.guard = dungeon;
          if (g?.role) e.forcedRole = g.role;
          if (dungeon) this.configureEnemy(e, j);
          z.enemies.push(e);
        }
        const point = dungeon ? { x: 1160, y: 1110 } : this.fieldCenter(i);
        if (dungeon && this.s.normal[boss.id]) z.enemies = z.enemies.filter((e) => !e.guard);
        if (!this.s.normal[boss.id] || (boss.kind === 'field' && !this.s.pending[boss.id]))
          z.enemies.push(this.bossEnemy(boss, 'normal', point));
        if (!dungeon) {
          const finalBoss = bosses.find((b) => b.kind === 'final'),
            finalReady = !!this.s.rescued.cindermaw && !!this.s.rescued.citadel;
          if (
            finalBoss &&
            finalReady &&
            !this.s.normal[finalBoss.id] &&
            !this.s.pending[finalBoss.id] &&
            !this.s.true[finalBoss.id]
          )
            z.enemies.push(
              this.bossEnemy(finalBoss, 'normal', { x: D.fields[i][0], y: D.fields[i][1] }),
            );
        }
        this.regionalDestinations(z);
        this.roadNetwork(z);
        this.authoredPlaces(z);
        this.regionalTravelSafety(z);
        this.refreshNPCs();
        if (this.peace) this.makeHabitat(z);
        return z;
      }
      regionalDestinations(z) {
        const destinationVersion = z.id === 'crown' ? 5 : 3;
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          z.destinationLayoutVersion === destinationVersion
        )
          return;
        const i = this.regionIndex(z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const move = (id, raw) => {
            const n = z.npcs.find((n) => n.id === id);
            if (!n || !raw) return;
            Object.assign(n, this.safe(raw[0], raw[1], z.id));
          };
          move('entrance', D.entrances[i]);
          // Highlands has an inbound ferry but a separate outbound pack caravan.
          if (z.id !== 'march') move('outbound', D.ports[i]);
          const rearStand = R.travelArrivalStands?.[z.id];
          if (rearStand) move('return', [rearStand.x, rearStand.y]);
          if (z.id === 'crown') {
            z.npcs = z.npcs.filter((n) => n.id !== 'return' && !n.crownTravelHub);
            for (const route of (R.crownRoutes || []).filter((r) => r.travelHub)) {
              const p = this.safe(route.point[0], route.point[1], z.id),
                hub = route.travelHub;
              z.npcs.push({
                id: 'crown-travel-' + route.id,
                name: hub.name,
                kind: 'transport',
                hub: true,
                crownTravelHub: true,
                routeId: route.id,
                ...p,
                icon: hub.icon || '🛣️',
                interactionOnly: hub.visibleVehicle === false,
              });
            }
          }
          const minor = z.npcs.find((n) => n.id === 'minor');
          if (minor) Object.assign(minor, this.safe(D.minors[i][0], D.minors[i][1], z.id));
          z.destinationLayoutVersion = destinationVersion;
        } finally {
          this.s.zone = oldZone;
        }
      }
      regionalTravelSafety(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.travelSafetyVersion === 1
        )
          return;
        const landingIds =
          {
            vale: ['outbound'],
            march: ['return'],
            highlands: ['return', 'outbound'],
            frontier: ['return'],
            crown: ['crown-travel-frontier-return'],
          }[z.id] || [];
        const landings = landingIds.map((id) => z.npcs.find((n) => n.id === id)).filter(Boolean);
        // Preserve monster numbers and difficulty; just keep their spawn homes away
        // from the actual arrival and its immediately surrounding companion space.
        const previousZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const e of z.enemies) {
            if (e.hp <= 0 || e.neutral || e.type === 'boss' || !e.home) continue;
            if (!landings.some((p) => dist(p, e.home) < 295)) continue;
            const nearby = landings.reduce(
              (best, p) => (!best || dist(p, e.home) < dist(best, e.home) ? p : best),
              null,
            );
            const dx = e.home.x - nearby.x;
            const dy = e.home.y - nearby.y;
            const length = Math.hypot(dx, dy) || 1;
            const directions = [
              [dx / length, dy / length],
              [0.8, 0.6],
              [0.6, -0.8],
              [-0.6, 0.8],
            ];
            for (const [ux, uy] of directions) {
              const candidate = this.safe(nearby.x + ux * 435, nearby.y + uy * 435, z.id);
              if (landings.some((p) => dist(p, candidate) < 320)) continue;
              e.home = { ...candidate };
              if (!e.aggro) Object.assign(e, candidate);
              break;
            }
          }
          z.travelSafetyVersion = 1;
        } finally {
          this.s.zone = previousZone;
        }
      }
      alignLandmarks(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.landmarkLayoutVersion === 3)
          return;
        const i = this.regionIndex(z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const [id, , x, y] of R.sites[i]) {
            const n = z.npcs.find((n) => n.kind === 'landmark' && n.id === id);
            if (!n) continue;
            const target = this.safe(x, y, z.id),
              dx = target.x - n.x,
              dy = target.y - n.y;
            if (Math.hypot(dx, dy) < 1) continue;
            Object.assign(n, target);
            for (const e of z.enemies.filter((e) => e.site === id && !e.mini)) {
              const q = this.safe(e.home.x + dx, e.home.y + dy, z.id);
              e.home = { ...q };
              if (e.hp > 0 && !e.aggro) Object.assign(e, q);
            }
            for (const b of z.npcs.filter((b) => b.kind === 'bundle' && b.site === id)) {
              const q = this.safe(b.x + dx, b.y + dy, z.id);
              Object.assign(b, q);
            }
          }
          z.landmarkLayoutVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      regionalAesthetics(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.aestheticVersion === 4) return;
        const i = this.regionIndex(z.id),
          size = D.regions[i].size,
          major = { x: D.towns[i][0], y: D.towns[i][1] },
          minor = { x: D.minors[i][0], y: D.minors[i][1] },
          field = this.fieldCenter(i),
          theme = R.natureThemes[i],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('aesthetic-'));
          let serial = 0,
            natureCount = 0;
          const nearRoad = (p, margin = 70) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const clear = (p, margin = 55) =>
            !this.blocked(p.x, p.y, z.id, 8, true) &&
            !nearRoad(p, margin) &&
            !z.npcs.some((n) => dist(n, p) < 75) &&
            !z.nodes.some((n) => dist(n, p) < 70) &&
            !z.buildings.some((n) => dist(n, p) < 70) &&
            !z.props.some((q) => q.roadBlocker && dist(q, p) < q.r + 45);
          const add = (p, structure, prefix = 'nature') => {
            if (!clear(p, prefix === 'town' ? 48 : 65)) return false;
            z.props.push({
              id: 'aesthetic-' + prefix + '-' + serial++,
              ...p,
              r: 0,
              decorative: true,
              structure,
            });
            return true;
          };
          const townLife = (center, layout, prefix) => {
            for (const [dx, dy, structure] of layout)
              add({ x: center.x + dx, y: center.y + dy }, structure, prefix);
          };
          townLife(major, R.settlementLayouts.majorLife, 'town');
          townLife(minor, R.settlementLayouts.minorLife, 'hamlet');
          const natureTargets = [72, 88, 120, 88, 90],
            natureSteps = [270, 250, 215, 250, 250],
            natureTarget = natureTargets[i],
            natureStep = natureSteps[i];
          for (let gx = 170; gx < size - 140 && natureCount < natureTarget; gx += natureStep)
            for (let gy = 190; gy < size - 140 && natureCount < natureTarget; gy += natureStep) {
              const seed =
                  (Math.imul(gx + i * 97, 73856093) ^ Math.imul(gy + i * 131, 19349663)) >>> 0,
                x = gx + (seed % 101) - 50,
                y = gy + ((seed >>> 8) % 91) - 45,
                p = { x, y };
              if (
                dist(p, major) < 390 ||
                dist(p, minor) < 330 ||
                dist(p, field) < 320 ||
                z.enemies.some((e) => e.hp > 0 && dist(e.home, p) < 55)
              )
                continue;
              if (add(p, theme[seed % theme.length])) natureCount++;
            }
          const {
              bounds: [x1, x2, y1, y2],
              gaps,
            } = R.barriers[i],
            edgeKinds =
              i === 0
                ? ['bush', 'reeds']
                : i === 1
                  ? ['reeds', 'cattails']
                  : i === 2
                    ? ['rock-cluster', 'alpine-scrub']
                    : i === 3
                      ? ['dead-tree', 'dry-scrub']
                      : ['black-rock', 'crystal-cluster'];
          let edgeIndex = 0;
          for (
            let y = y1 + 120;
            y < y2 - 100 && edgeIndex < 14;
            y += Math.max(130, Math.floor((y2 - y1) / 12))
          ) {
            if (gaps.some(([lo, hi]) => y > lo - 110 && y < hi + 110)) continue;
            for (const x of [x1 - 38, x2 + 38]) {
              const p = { x, y: y + ((edgeIndex * 37) % 51) - 25 };
              if (add(p, edgeKinds[edgeIndex % edgeKinds.length], 'bank')) edgeIndex++;
            }
          }
          const scenery = {
            orchard: ['sapling', 'wildflowers'],
            'den-ruins': ['stump', 'fallen-log'],
            'mill-pond': ['reeds', 'bush'],
            cache: ['bush', 'fallen-log'],
            'night-site': ['reeds', 'cattails'],
            wagon: ['driftwood', 'reeds'],
            watch: ['watchpost', 'reeds'],
            dock: ['cattails', 'driftwood'],
            lookout: ['alpine-scrub', 'rock-cluster'],
            ore: ['rock-cluster', 'heather'],
            tower: ['rock-cluster', 'pine-sapling'],
            shrine: ['dead-tree', 'ash-patch'],
            overlook: ['dry-scrub', 'rock-cluster'],
            checkpoint: ['barricade', 'banner'],
            convoy: ['cart', 'crate'],
            foundry: ['ember-pit', 'black-rock'],
            shelf: ['crystal-cluster', 'black-rock'],
            siege: ['barricade', 'banner'],
            'fortress-gate': ['black-rock', 'banner'],
          };
          for (const n of z.npcs.filter(
            (n) => n.kind === 'landmark' && !n.internalSite && scenery[n.id],
          ))
            for (const [j, structure] of scenery[n.id].entries()) {
              const a = (j ? 2.4 : -0.6) + i * 0.23,
                p = { x: n.x + Math.cos(a) * 70, y: n.y + Math.sin(a) * 70 };
              add(p, structure, 'site');
            }
          const oppression =
            i < 2 ? 'ration' : i === 2 ? 'watchpost' : i === 3 ? 'barricade' : 'banner';
          add({ x: major.x - 300, y: major.y + 15 }, oppression, 'town');
          add({ x: major.x + 300, y: major.y + 15 }, oppression, 'town');
          z.aestheticVersion = 4;
        } finally {
          this.s.zone = oldZone;
        }
      }
      worldLife(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.worldLifeVersion === 1) return;
        const i = this.regionIndex(z.id),
          plan = R.worldLifePlans?.[i],
          oldZone = this.s.zone;
        if (!plan) return;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('world-life-'));
          let serial = 0;
          const nearRoad = (p, margin = 36) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const add = (x, y, structure, scope = 'wild', allowRoad = false) => {
            let p = { x, y };
            if (this.blocked(x, y, z.id, 8, true)) {
              try {
                p = this.safe(x, y, z.id);
              } catch (_) {
                return false;
              }
            }
            if (!allowRoad && nearRoad(p, 45)) return false;
            if (z.npcs.some((n) => dist(n, p) < 45) || z.nodes.some((n) => dist(n, p) < 45))
              return false;
            z.props.push({
              id: 'world-life-' + scope + '-' + serial++,
              ...p,
              r: 0,
              decorative: true,
              structure,
            });
            return true;
          };
          for (const [x, y, structure] of plan.civilian || []) add(x, y, structure, 'civilian');
          for (const habitat of plan.habitats || []) {
            const [cx, cy] = habitat.center;
            for (const [dx, dy, structure] of habitat.props || [])
              add(cx + dx, cy + dy, structure, 'habitat');
          }
          const field = this.fieldCenter(i);
          for (const [dx, dy, structure] of plan.field || [])
            add(field.x + dx, field.y + dy, structure, 'field');
          z.worldLifeVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      ironrootLivelihood(z) {
        if (z.id !== 'highlands' || z.ironrootLifeVersion === 1) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('ironroot-life-'));
          const [townX, townY] = D.towns[this.regionIndex(z.id)];
          const futureServices = Object.values(R.serviceOffsets).map(([x, y]) =>
            this.safe(townX + x, townY + y, z.id),
          );
          for (const district of R.ironrootLife || []) {
            for (const [j, [x, y, structure]] of district.props.entries()) {
              const candidates = [{ x, y }];
              for (let d = 35; d <= 175; d += 35)
                for (let k = 0; k < 12; k++) {
                  const angle = (k * Math.PI) / 6;
                  candidates.push({ x: x + Math.cos(angle) * d, y: y + Math.sin(angle) * d });
                }
              const p = candidates.find(
                (p) =>
                  !this.blocked(p.x, p.y, z.id, 8, true) &&
                  !z.npcs.some((n) => dist(n, p) < 85) &&
                  !futureServices.some((n) => dist(n, p) < 85) &&
                  !z.nodes.some((n) => dist(n, p) < 65) &&
                  !z.roads?.some((path) =>
                    path.some((b, k) => k && this.distanceToSegment(p, path[k - 1], b) < 65),
                  ) &&
                  !z.props.some((q) => dist(q, p) < (q.r || 0) + 45),
              );
              if (!p) continue;
              z.props.push({
                id: 'ironroot-life-' + district.id + '-' + j,
                ...p,
                r: 0,
                decorative: true,
                structure,
                ironrootDistrict: district.id,
              });
            }
          }
          z.ironrootLifeVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      frontierOccupationLayout(z) {
        if (z.id !== 'frontier' || z.frontierLayoutVersion === 3) return;
        const districts = R.frontierDistricts || [],
          routes = R.frontierRoutes || [],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('frontier-layout-'));
          let serial = 0;
          const roadNear = (p, margin = 40) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const roadTraceStructures = new Set(['road-ruts', 'road-patch']);
          const clearPoint = (x, y) => {
            if (!this.blocked(x, y, z.id, 8, true)) return { x, y };
            for (let radius = 30; radius <= 180; radius += 30)
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                if (!this.blocked(p.x, p.y, z.id, 8, true)) return p;
              }
            return null;
          };
          const place = (base, spec, prefix) => {
            const [dx, dy, structure] = spec,
              roadTrace = roadTraceStructures.has(structure),
              p = clearPoint(base.x + dx, base.y + dy);
            if (!p) return false;
            // Furniture stays off travel lanes; flat ruts/patches are the only authored road-surface exception.
            if (!roadTrace && roadNear(p, 48)) return false;
            if (
              !roadTrace &&
              (z.npcs.some((n) => dist(n, p) < 45) ||
                z.nodes.some((n) => n.amount > 0 && dist(n, p) < 48) ||
                z.buildings.some((n) => dist(n, p) < 55))
            )
              return false;
            z.props.push({
              id: 'frontier-layout-' + prefix + '-' + serial++,
              ...p,
              r: 0,
              decorative: true,
              structure,
              frontierDistrict: prefix,
              roadTrace,
            });
            return true;
          };
          for (const d of districts) {
            const center = { x: d.center[0], y: d.center[1] };
            for (const spec of d.props || []) place(center, spec, d.id);
          }
          for (const route of routes) {
            const center = { x: route.point[0], y: route.point[1] };
            for (const spec of route.props || []) place(center, spec, 'route-' + route.id);
          }
          z.frontierLayoutVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      darkCrownLayout(z) {
        if (z.id !== 'crown' || z.crownLayoutVersion === 1) return;
        const districts = R.crownDistricts || [],
          routes = R.crownRoutes || [],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('crown-layout-'));
          // Replace the old generic fortress work-camp cluster with authored regime districts while keeping boss/stronghold life intact.
          for (const d of districts.filter((d) => d.id === 'fortress-logistics'))
            z.props = z.props.filter(
              (p) =>
                !(
                  String(p.id || '').startsWith('world-life-habitat-') &&
                  dist(p, { x: d.center[0], y: d.center[1] }) < 220
                ),
            );
          let serial = 0;
          const roadNear = (p, margin = 40) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const solidNear = (p, r) =>
            z.props.some((q) => !q.decorative && dist(q, p) < (q.r || 0) + r + 12);
          const clearPoint = (x, y, r = 8) => {
            const raw = { x, y };
            if (!this.blocked(x, y, z.id, r, true) && !solidNear(raw, r)) return raw;
            for (let radius = 35; radius <= 210; radius += 35)
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                if (!this.blocked(p.x, p.y, z.id, r, true) && !solidNear(p, r)) return p;
              }
            return null;
          };
          const place = (base, spec, prefix) => {
            const [dx, dy, structure, r = 0] = spec,
              p = clearPoint(base.x + dx, base.y + dy, Math.max(8, r));
            if (!p) return false;
            if (
              roadNear(p, r > 0 ? r + 62 : 50) ||
              z.npcs.some((n) => dist(n, p) < 48) ||
              z.nodes.some((n) => dist(n, p) < 50) ||
              z.buildings.some((n) => dist(n, p) < 60)
            )
              return false;
            z.props.push({
              id: 'crown-layout-' + prefix + '-' + serial++,
              ...p,
              r,
              decorative: r <= 0,
              structure,
              crownDistrict: prefix,
            });
            return true;
          };
          for (const d of districts) {
            const center = { x: d.center[0], y: d.center[1] };
            for (const spec of d.props || []) place(center, spec, d.id);
          }
          for (const route of routes) {
            const center = { x: route.point[0], y: route.point[1] };
            for (const spec of route.props || [])
              place(center, [spec[0], spec[1], spec[2], 0], 'route-' + route.id);
          }
          z.crownLayoutVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      harborLayout(z) {
        const h = R.harbors?.[z.id];
        if (!h) return;
        const transport =
          z.id === 'march'
            ? z.npcs.find((n) => n.id === 'outbound')
            : z.id === 'highlands'
              ? z.npcs.find((n) => n.id === 'return')
              : null;
        if (transport) {
          Object.assign(transport, h.boat);
          transport.name =
            z.id === 'march' ? 'Ferry to Ironroot Highlands' : 'Ferry back to Flooded Marches';
          transport.harbor = true;
        }
        if (z.harborVersion === 2) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const w = h.water,
            d = h.dock,
            insideHarbor = (p) =>
              p.x > w.x1 - 70 && p.x < w.x2 + 70 && p.y > w.y1 - 70 && p.y < w.y2 + 70;
          z.props = z.props.filter(
            (p) => !String(p.id || '').startsWith('harbor-') && !insideHarbor(p),
          );
          for (const e of z.enemies.filter(
            (e) => e.hp > 0 && e.type === 'mob' && dist(e, h.arrival) < 280,
          )) {
            const fallback = this.safe(
              z.id === 'march' ? 1900 : 650,
              z.id === 'march' ? 980 : 2180,
              z.id,
            );
            e.home = { ...fallback };
            if (!e.aggro) Object.assign(e, fallback);
          }
          const roadDistance = (p) => {
            let nearest = Infinity;
            for (const path of z.roads || [])
              for (let j = 1; j < path.length; j++)
                nearest = Math.min(nearest, this.distanceToSegment(p, path[j - 1], path[j]));
            return nearest;
          };
          const add = (id, x, y, structure, r = 0) => {
            let p = { x, y };
            if (roadDistance(p) <= 70 || this.blocked(p.x, p.y, z.id, 8, true)) {
              let found = null;
              for (const radius of [90, 130, 170, 220]) {
                for (let n = 0; n < 24; n++) {
                  const a = (n * Math.PI) / 12,
                    q = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                  if (this.blocked(q.x, q.y, z.id, 8, true) || roadDistance(q) <= 70) continue;
                  found = q;
                  break;
                }
                if (found) break;
              }
              if (found) p = found;
              else return;
            }
            z.props.push({ id: 'harbor-' + id, ...p, r, decorative: true, structure });
          };
          if (z.id === 'march') {
            for (const [id, x, y, structure] of [
              ['mangrove-a', 2320, 500, 'mangrove'],
              ['mangrove-b', 2470, 560, 'mangrove'],
              ['mangrove-c', 2490, 820, 'mangrove'],
              ['reeds-a', 2460, 700, 'reeds'],
              ['reeds-b', 2370, 860, 'cattails'],
              ['drift', 2500, 870, 'driftwood'],
            ])
              add(id, x, y, structure);
          } else if (z.id === 'highlands') {
            for (const [id, x, y, structure] of [
              ['pine-a', 470, 1765, 'pine-sapling'],
              ['pine-b', 510, 2140, 'pine-sapling'],
              ['rock-a', 455, 1840, 'rock-cluster'],
              ['rock-b', 480, 2070, 'rock-cluster'],
              ['heather', 560, 2170, 'heather'],
            ])
              add(id, x, y, structure);
          }
          z.harborVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      regionalHandoffLife(z) {
        const scenes = R.regionalHandoffScenes?.[z.id];
        if (!scenes || z.regionalHandoffVersion === 1) return;
        const previous = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('regional-handoff-'));
          const [townX, townY] = D.towns[this.regionIndex(z.id)];
          const futureServices = Object.values(R.serviceOffsets).map(([x, y]) =>
            this.safe(townX + x, townY + y, z.id),
          );
          const clear = (p) =>
            !this.blocked(p.x, p.y, z.id, 24) &&
            !z.npcs.some((n) => dist(n, p) < 65) &&
            !futureServices.some((n) => dist(n, p) < 65) &&
            !z.nodes.some((n) => n.amount > 0 && dist(n, p) < 55) &&
            !z.props.some((n) => dist(n, p) < 45) &&
            !z.roads.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < 60),
            );
          for (const [j, [x, y, structure, district, sceneRole]] of scenes.entries()) {
            let point = null;
            for (const radius of [0, 50, 100, 150, 200]) {
              for (let n = 0; n < 16; n++) {
                const a = (n * Math.PI) / 8,
                  p = { x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius };
                if (clear(p)) {
                  point = p;
                  break;
                }
              }
              if (point) break;
            }
            if (point)
              z.props.push({
                id: 'regional-handoff-' + j,
                ...point,
                r: 0,
                decorative: true,
                structure,
                regionalDistrict: district,
                ...(sceneRole ? { sceneRole } : {}),
              });
          }
          z.regionalHandoffVersion = 1;
        } finally {
          this.s.zone = previous;
        }
      }
      dungeonWorkstation(z) {
        const spec = R.dungeonWorkstations?.[z.id];
        if (!spec) return;
        const captive = z.npcs.find((n) => n.kind === 'cage' && n.family === z.id);
        if (captive) Object.assign(captive, spec, { x: spec.x, y: spec.y });
      }
      abyssAviationProject(z) {
        if (z.id !== 'abyss' || z.flightProjectVersion === 1) return;
        // Update only presentation on existing saves: occupants, progress and geometry stay put.
        for (const [j, [, , structure, district]] of R.dungeonDecor.abyss.entries()) {
          const p = z.props.find((p) => p.id === 'decor-' + j && p.decorative);
          if (p) Object.assign(p, { structure, dungeonDistrict: district });
        }
        z.flightProjectVersion = 1;
      }
      authoredPlaces(z) {
        if (this.supplyRoom(z.id)) {
          this.treasuryInterior(z);
          this.combatPopulation(z);
          this.guardianPopulation(z);
          this.roomCaptainPopulation(z);
          return;
        }
        if (this.sideDungeon(z.id)) {
          this.combatPopulation(z);
          this.ordinaryMeleePopulation(z);
          this.ordinaryRangedPopulation(z);
          return;
        }
        this.harborLayout(z);
        this.repairMiniGuardianReachability(z);
        this.spaceQuestBoard(z);
        this.spaceMillhavenSupplier(z);
        this.combatPopulation(z);
        this.nightEnemyPopulation(z);
        if (dungeonIds.includes(z.id)) {
          this.dungeonWorkstation(z);
          this.decorateDungeon(z);
          this.abyssAviationProject(z);
          for (const e of z.enemies) this.upgradeRingleader(e);
          this.guardianPopulation(z);
          this.guardianRewards(z);
          return;
        }
        if (z.placesVersion !== 2) {
          z.npcs = z.npcs.filter((n) => !n.id.startsWith('landmark-'));
          const i = this.regionIndex(z.id);
          for (const [id, name, x, y] of R.sites[i]) {
            let n = z.npcs.find((n) => n.id === id);
            const data = {
              id,
              name,
              kind: 'landmark',
              ...this.safe(x, y, z.id),
              icon: /bridge|crossing/i.test(name)
                ? '🪵'
                : /camp|convoy|wagon/i.test(name)
                  ? '🏕️'
                  : '🏚️',
              ...(z.id === 'frontier' && id === 'checkpoint' ? { internalSite: true } : {}),
            };
            if (n) Object.assign(n, data);
            else z.npcs.push(data);
          }
          z.placesVersion = 2;
        }
        this.localSites(z);
        this.retireResourceMini(z);
        this.resourceDeposits(z);
        this.miniDungeons(z);
        this.repairMiniGuardianReachability(z);
        this.spreadOutdoorForces(z);
        this.alignLandmarks(z);
        this.sideInteriors(z);
        this.supplyInteriors(z);
        this.regionalAesthetics(z);
        this.worldLife(z);
        this.creatureStrongholds(z);
        this.frontierOccupationLayout(z);
        this.darkCrownLayout(z);
        this.ordinaryMeleePopulation(z);
        this.ordinaryRangedPopulation(z);
        this.guardianPopulation(z);
        this.summonPopulation(z);
        for (const e of z.enemies) this.upgradeRingleader(e);
        this.fieldCaptainPopulation(z);
        this.finalBossPopulation(z);
        this.regionalHandoffLife(z);
        this.ironrootLivelihood(z);
      }
      spaceQuestBoard(z) {
        if (dungeonIds.includes(z.id) || z.boardPositionVersion === 2) return;
        const board = z.npcs.find((n) => n.kind === 'quests');
        if (!board) return;
        const i = this.regionIndex(z.id),
          [x, y] = D.towns[i],
          p = this.safe(x + 210, y + 55, z.id);
        Object.assign(board, p);
        z.boardPositionVersion = 2;
      }
      spaceMillhavenSupplier(z) {
        if (z.id !== 'vale' || z.supplierPositionVersion === 2) return;
        const supplier = z.npcs.find((n) => n.id === 'supplier');
        if (!supplier) return;
        const [x, y] = D.towns[0];
        Object.assign(supplier, this.safe(x + 115, y - 85, z.id));
        z.supplierPositionVersion = 2;
      }
      creatureStrongholdCenter(z, cfg) {
        if (cfg.site) {
          const n = z.npcs.find((n) => n.id === cfg.site);
          if (n) return { x: n.x, y: n.y };
        }
        return cfg.center ? { x: cfg.center[0], y: cfg.center[1] } : null;
      }
      creatureStrongholds(z) {
        const strongholdVersion = z.id === 'crown' ? 7 : 6;
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.creatureStrongholdsVersion === strongholdVersion
        )
          return;
        const plans = (R.creatureStrongholds || []).filter((s) => s.region === z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('stronghold-'));
          const roadNear = (p, margin = 55) =>
            z.roads?.some((path) =>
              path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
            );
          const occupied = new Set();
          for (const cfg of plans) {
            const center = this.creatureStrongholdCenter(z, cfg);
            if (!center) continue;
            // Replace light habitat dressing around the hold with a more deliberate territorial layout.
            z.props = z.props.filter(
              (p) =>
                !(String(p.id || '').startsWith('world-life-habitat-') && dist(p, center) < 175),
            );
            let livedInCount = 0;
            const placedStructures = new Set();
            for (const [j, [dx, dy, structure]] of (cfg.props || []).entries()) {
              let p = { x: center.x + dx, y: center.y + dy };
              try {
                p = this.safe(p.x, p.y, z.id);
              } catch (_) {
                continue;
              }
              if (roadNear(p, 42)) continue;
              z.props.push({
                id: 'stronghold-' + cfg.id + '-prop-' + j,
                ...p,
                r: 0,
                decorative: true,
                structure,
                stronghold: cfg.id,
              });
              placedStructures.add(structure);
              livedInCount++;
            }
            // A road can clip the original domestic layout, but a stronghold must still read as a place somebody lives in.
            if (livedInCount < 5 && cfg.props?.length) {
              const fallback = [];
              for (const radius of [105, 145, 190, 235])
                for (let n = 0; n < 16; n++) {
                  const a = (n * Math.PI) / 8 + 0.3;
                  fallback.push({
                    x: center.x + Math.cos(a) * radius,
                    y: center.y + Math.sin(a) * radius,
                  });
                }
              let cursor = 0;
              for (const q of fallback) {
                if (livedInCount >= 5) break;
                if (
                  roadNear(q, 48) ||
                  this.blocked(q.x, q.y, z.id, 8, true) ||
                  z.nodes.some((n) => n.amount > 0 && dist(n, q) < 55) ||
                  z.npcs.some((n) => dist(n, q) < 55) ||
                  z.props.some((p) => p.stronghold === cfg.id && dist(p, q) < 34)
                )
                  continue;
                let p;
                try {
                  p = this.safe(q.x, q.y, z.id);
                } catch (_) {
                  continue;
                }
                if (roadNear(p, 48)) continue;
                const source = cfg.props[cursor++ % cfg.props.length],
                  structure = source[2];
                z.props.push({
                  id: 'stronghold-' + cfg.id + '-lived-' + livedInCount,
                  ...p,
                  r: 0,
                  decorative: true,
                  structure,
                  stronghold: cfg.id,
                });
                placedStructures.add(structure);
                livedInCount++;
              }
            }
            const ring = [
              [-145, -105],
              [-70, -145],
              [70, -145],
              [145, -105],
              [155, 20],
              [115, 120],
              [40, 155],
              [-40, 155],
              [-115, 120],
              [-155, 20],
            ];
            let wallCount = 0;
            for (const [j, [dx, dy]] of ring.entries()) {
              let p = { x: center.x + dx, y: center.y + dy };
              if (
                roadNear(p, 85) ||
                this.blocked(p.x, p.y, z.id, 28, true) ||
                z.nodes.some((n) => n.amount > 0 && dist(n, p) < 85)
              )
                continue;
              z.props.push({
                id: 'stronghold-' + cfg.id + '-wall-' + j,
                ...p,
                r: 26,
                structure: cfg.wall || 'stockade',
                stronghold: cfg.id,
              });
              wallCount++;
            }
            // Road-adjacent holds still get a partial defensive backstop on whichever side has room.
            if (!wallCount) {
              const fallback = [
                [-240, -185],
                [0, -250],
                [240, -185],
                [255, 40],
                [190, 215],
                [0, 260],
                [-190, 215],
                [-255, 40],
              ];
              for (const [j, [dx, dy]] of fallback.entries()) {
                const p = { x: center.x + dx, y: center.y + dy };
                if (
                  roadNear(p, 90) ||
                  this.blocked(p.x, p.y, z.id, 28, true) ||
                  z.nodes.some((n) => n.amount > 0 && dist(n, p) < 90) ||
                  z.npcs.some((n) => dist(n, p) < 85)
                )
                  continue;
                z.props.push({
                  id: 'stronghold-' + cfg.id + '-backstop-' + j,
                  ...p,
                  r: 26,
                  structure: cfg.wall || 'stockade',
                  stronghold: cfg.id,
                });
                if (++wallCount >= 3) break;
              }
            }
            if (cfg.night) continue;
            const candidates = z.enemies
              .filter(
                (e) =>
                  e.type === 'mob' &&
                  e.form === 'normal' &&
                  !e.guard &&
                  !e.mini &&
                  !e.summon &&
                  !e.nightOnly &&
                  !e.captain &&
                  !e.roomCaptain &&
                  !e.sideDungeon &&
                  e.species === cfg.species &&
                  !occupied.has(e.id),
              )
              .sort(
                (a, b) =>
                  (a.site === cfg.site ? -1 : 0) - (b.site === cfg.site ? -1 : 0) ||
                  this.idOrder(a, b),
              )
              .slice(0, cfg.guardCount || 3);
            const spots = [
              [-95, -20],
              [-25, -95],
              [80, -65],
              [100, 35],
              [20, 105],
              [-85, 75],
            ];
            for (const [j, e] of candidates.entries()) {
              const [dx, dy] = spots[j % spots.length],
                p = this.safe(center.x + dx, center.y + dy, z.id);
              e.home = { ...p };
              if (e.hp > 0 && !e.aggro) Object.assign(e, p);
              e.stronghold = cfg.id;
              e.strongholdResident = true;
              e.pack = 'stronghold-' + cfg.id + '-' + Math.floor(j / 3);
              if (cfg.site) e.site = cfg.site;
              occupied.add(e.id);
            }
          }
          z.creatureStrongholdsVersion = strongholdVersion;
        } finally {
          this.s.zone = oldZone;
        }
      }
      sideInteriors(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.sideEntranceVersion === 2
        )
          return;
        const configs = (R.sideDungeons || []).filter((d) => d.region === z.id),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('side-entrance-'));
          const roadNear = (p, margin = 50) =>
              z.roads?.some((path) =>
                path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
              ),
            approach = {
              cellar: ['stump', 'crate', 'fallen-log'],
              flooded: ['reeds', 'driftwood', 'fishing-net'],
              keep: ['rock-cluster', 'stone-marker', 'weapon-rack'],
              shrine: ['ash-patch', 'bone-pile', 'stolen-goods'],
              foundry: ['black-rock', 'ember-pit', 'supply-stack'],
            };
          for (const cfg of configs) {
            let n = z.npcs.find((n) => n.id === cfg.site);
            const source = R.sites[this.regionIndex(z.id)].find((s) => s[0] === cfg.site);
            if (!source) continue;
            const p = this.safe(source[2], source[3], z.id),
              data = {
                id: cfg.site,
                name: cfg.name,
                kind: 'dungeon',
                family: cfg.id,
                sideDungeon: true,
                ...p,
                icon: '🏚️',
              };
            if (n) Object.assign(n, data);
            else {
              n = data;
              z.npcs.push(n);
            }
            for (const [j, structure] of (approach[cfg.theme] || []).entries()) {
              const a = -0.6 + j * 2.15,
                q = this.safe(p.x + Math.cos(a) * 78, p.y + Math.sin(a) * 68, z.id);
              if (roadNear(q)) continue;
              z.props.push({
                id: 'side-entrance-' + cfg.id + '-' + j,
                ...q,
                r: 0,
                decorative: true,
                structure,
              });
            }
          }
          z.sideEntranceVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      supplyInteriors(z) {
        const room = R.supplyRooms.find((r) => r.region === z.id);
        if (!room) return;
        if (z.supplyRoomVersion === 6) return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          z.npcs = z.npcs.filter((n) => n.kind !== 'bundle');
          const center = this.fieldCenter(this.regionIndex(z.id)),
            off = room.entryOffset || [240, -160],
            target = this.safe(center.x + off[0], center.y + off[1], z.id),
            existing = z.npcs.find((n) => n.id === 'supply-entrance'),
            data = {
              ...target,
              id: 'supply-entrance',
              name: room.name,
              kind: 'dungeon',
              family: room.id,
              treasury: true,
              treasuryBoss: room.boss,
              icon: '🗝️',
            };
          if (existing) Object.assign(existing, data);
          else z.npcs.push(data);
          z.props = z.props.filter((p) => !String(p.id || '').startsWith('treasury-approach-'));
          const roadNear = (p, margin = 50) =>
              z.roads?.some((path) =>
                path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < margin),
              ),
            dressing =
              {
                thorn: ['fang-trophy', 'stolen-goods', 'thorn-bed'],
                mire: ['reed-nest', 'fish-rack', 'shell-hoard'],
                ridge: ['trophy-rack', 'stone-seat', 'weapon-rack'],
                cindermaw: ['roost', 'ember-pit', 'bone-pile'],
              }[room.boss] || [];
          for (const [j, structure] of dressing.entries()) {
            const a = -0.55 + j * 2.1,
              q = this.safe(target.x + Math.cos(a) * 88, target.y + Math.sin(a) * 72, z.id);
            if (roadNear(q)) continue;
            z.props.push({ id: 'treasury-approach-' + j, ...q, r: 0, decorative: true, structure });
          }
          z.supplyRoomVersion = 6;
        } finally {
          this.s.zone = oldZone;
        }
      }
      localSites(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.localSitesVersion === 3
        )
          return;
        const i = this.regionIndex(z.id),
          refuges = [D.towns[i], D.minors[i]],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          for (const n of z.npcs.filter((n) => n.kind === 'landmark')) {
            const source = R.sites[i].find((a) => a[0] === n.id);
            if (source) Object.assign(n, this.safe(source[2], source[3], z.id));
          }
          z.npcs = z.npcs.filter((n) => n.kind !== 'bundle');
          const targets = z.npcs.filter(
              (n) => n.kind === 'landmark' && !n.internalSite && !n.id.startsWith('bridge-'),
            ),
            packs = [
              ...new Set(
                z.enemies
                  .filter(
                    (e) =>
                      e.type === 'mob' && e.pack && !e.guard && !e.summon && e.form === 'normal',
                  )
                  .map((e) => e.pack),
              ),
            ];
          targets.forEach((site, j) => {
            const pack = packs[j];
            if (!pack) return;
            z.enemies
              .filter((e) => e.pack === pack)
              .forEach((e, k) => {
                let p = null;
                for (let t = 0; t < 24; t++) {
                  const a = ((t + k * 3) * Math.PI) / 12,
                    candidate = {
                      x: site.x + Math.cos(a) * (85 + Math.floor(k / 2) * 35),
                      y: site.y + Math.sin(a) * (85 + Math.floor(k / 2) * 35),
                    };
                  if (
                    this.blocked(candidate.x, candidate.y, z.id) ||
                    refuges.some(([x, y]) => dist(candidate, { x, y }) < 260) ||
                    !this.line(candidate, site)
                  )
                    continue;
                  p = candidate;
                  break;
                }
                if (!p) p = this.safe(site.x + 70, site.y + 45, z.id);
                e.home = { ...p };
                e.site = site.id;
                if (e.hp > 0 && !e.aggro) Object.assign(e, p);
              });
          });
          z.localSitesVersion = 3;
        } finally {
          this.s.zone = oldZone;
        }
      }
      resourceDeposits(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.resourceDepositsVersion === 2
        )
          return;
        const plan = R.tributePlans?.[z.id] || [],
          total = R.tributeTotal || 640,
          legacyNodes = (z.nodes || []).filter((n) => !n.tribute),
          legacyRemaining = legacyNodes.reduce((sum, n) => sum + (Number(n.amount) || 0), 0),
          legacyCap = R.legacyResourceTotals?.[z.id] || 0,
          recorded = Math.max(0, Math.floor(this.s.gathered?.[z.id] || 0)),
          inferred =
            recorded > 0
              ? recorded
              : legacyNodes.length && legacyCap
                ? Math.max(0, legacyCap - legacyRemaining)
                : 0,
          already = Math.min(total, inferred),
          remaining = Math.max(0, total - already),
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          if (already > recorded) this.s.gathered[z.id] = already;
          const raw = plan.map((s) => Math.floor((remaining * s.amount) / total)),
            left = remaining - raw.reduce((a, b) => a + b, 0);
          for (let j = 0; j < left; j++) raw[j % raw.length]++;
          z.nodes = [];
          for (const [j, source] of plan.entries()) {
            const site = z.npcs.find((n) => n.id === source.site);
            if (!site) continue;
            const off = source.offset || [80, 60],
              p = this.safe(site.x + off[0], site.y + off[1], z.id),
              id = 'tribute-' + z.id + '-' + source.id;
            z.nodes.push({
              id,
              ...p,
              amount: raw[j] || 0,
              icon: '🪙',
              site: source.site,
              siteName: site.name,
              name: 'Dark Lord Tribute',
              kind: 'resource',
              tribute: true,
              tributeId: source.id,
              hidden: !!source.hidden,
              context: source.context || 'tribute stores',
              resourceGroup: 'tribute-' + z.id,
            });
            if (!source.hidden && this.s.discovered[z.id + ':' + source.site])
              this.s.discovered[z.id + ':tribute:' + source.id] = true;
          }
          z.resourceDepositsVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      retireResourceMini(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          this.sideDungeon(z.id) ||
          z.resourceMiniRetiredVersion === 1
        )
          return;
        const id = 'resource-' + z.id,
          i = this.regionIndex(z.id),
          r = D.regions[i],
          hadLegacyMini =
            (z.minis || []).some((m) => m.id === id) ||
            z.npcs.some((n) => n.mini === id) ||
            z.props.some(
              (p) => p.mini === id || String(p.id || '').startsWith('mini-wall-' + id + '-'),
            ) ||
            z.enemies.some((e) => e.mini === id);
        z.minis = (z.minis || []).filter((m) => m.id !== id);
        z.npcs = z.npcs.filter((n) => !(n.kind === 'mini' && n.mini === id));
        z.props = z.props.filter(
          (p) => p.mini !== id && !String(p.id || '').startsWith('mini-wall-' + id + '-'),
        );
        for (const e of z.enemies.filter((e) => e.mini === id)) {
          delete e.mini;
          e.guard = false;
          e.name = e.name.replace(/ guardian$/, '');
          e.gold = this.regionalEnemyRewards(i).gold;
          e.xp = this.regionalEnemyRewards(i).xp;
          delete e.miniRewardVersion;
          e.pack =
            'retired-resource-patrol-' + Math.floor((Number(e.id?.split('-').at(-1)) || 0) / 3);
        }
        for (const n of z.nodes || []) delete n.mini;
        if (hadLegacyMini) delete z.resourceDepositsVersion;
        z.resourceMiniRetiredVersion = 1;
      }
      openResourceMini(z) {
        this.retireResourceMini(z);
      }
      spreadOutdoorForces(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || z.outdoorOccupationVersion === 2)
          return;
        const i = this.regionIndex(z.id),
          fieldBoss = D.bosses.find((b) => b.region === z.id && b.kind === 'field'),
          center = this.fieldCenter(i),
          fieldId = 'field-' + fieldBoss.id,
          town = { x: D.towns[i][0], y: D.towns[i][1] },
          minor = { x: D.minors[i][0], y: D.minors[i][1] },
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const mini = z.minis?.find((m) => m.id === fieldId),
            normalBoss = z.enemies.find(
              (e) => e.type === 'boss' && e.family === fieldBoss.id && e.form === 'normal',
            ),
            oldCenter = mini
              ? { x: mini.x, y: mini.y }
              : normalBoss?.home || { x: D.fields[i][0], y: D.fields[i][1] },
            dx = center.x - oldCenter.x,
            dy = center.y - oldCenter.y;
          if (Math.hypot(dx, dy) > 5) {
            const nearRoad = (p) =>
              z.roads?.some((path) =>
                path.some(
                  (b, j) => j && this.distanceToSegment(p, path[j - 1], b) < (p.r || 20) + 55,
                ),
              );
            const shifted = (p) => this.safe(p.x + dx, p.y + dy, z.id);
            if (mini) {
              mini.x = center.x;
              mini.y = center.y;
              mini.trapPosts = (mini.trapPosts || [])
                .map((p) => ({ ...p, ...shifted(p) }))
                .filter((p) => !nearRoad({ ...p, r: 20 }));
            }
            z.props = z.props.filter((p) => {
              if (p.mini !== fieldId) return true;
              const q = shifted(p);
              if (nearRoad({ ...q, r: p.r || 20 })) return false;
              Object.assign(p, q);
              return true;
            });
            const cage = z.npcs.find((n) => n.kind === 'cage' && n.family === fieldBoss.id);
            if (cage) Object.assign(cage, this.safe(center.x + 90, center.y + 80, z.id));
            const marker = z.npcs.find((n) => n.kind === 'mini' && n.mini === fieldId);
            if (marker) Object.assign(marker, this.safe(center.x - 130, center.y - 10, z.id));
            for (const e of z.enemies.filter((e) => e.mini === fieldId)) {
              const q = shifted(e.home);
              e.home = { ...q };
              if (e.hp > 0 && !e.aggro) Object.assign(e, q);
            }
            if (normalBoss) {
              normalBoss.home = { ...center };
              if (normalBoss.hp > 0 && !normalBoss.aggro) Object.assign(normalBoss, center);
            }
            const pending = this.s.pending[fieldBoss.id];
            if (pending?.kind === 'field' && pending.zone === z.id) {
              pending.base.home = { ...center };
              pending.base.x = center.x;
              pending.base.y = center.y;
            }
          }
          const allPacks = [
              ...new Set(
                z.enemies
                  .filter(
                    (e) =>
                      e.type === 'mob' &&
                      e.pack &&
                      !e.summon &&
                      !e.nightOnly &&
                      e.form === 'normal',
                  )
                  .map((e) => e.pack),
              ),
            ],
            packs = allPacks.filter((pack) =>
              z.enemies
                .filter((e) => e.pack === pack)
                .every(
                  (e) =>
                    !e.guard &&
                    !e.mini &&
                    !e.site &&
                    !e.summon &&
                    !e.nightOnly &&
                    e.form === 'normal',
                ),
            ),
            anchors = R.occupationAnchors?.[i] || [],
            used = [];
          for (let pi = 0; pi < packs.length; pi++) {
            let anchor = null;
            for (let step = 0; step < anchors.length; step++) {
              const [ax, ay] = anchors[(pi * 3 + step) % anchors.length];
              let p;
              try {
                p = this.safe(ax, ay, z.id);
              } catch (_) {
                continue;
              }
              if (
                dist(p, town) < 390 ||
                dist(p, minor) < 320 ||
                dist(p, center) < 380 ||
                z.npcs.some((n) => dist(p, n) < 150) ||
                used.some((q) => dist(p, q) < 220)
              )
                continue;
              anchor = p;
              break;
            }
            if (!anchor) continue;
            used.push(anchor);
            const members = z.enemies
              .filter((e) => e.pack === packs[pi])
              .sort((a, b) => this.idOrder(a, b));
            for (let k = 0; k < members.length; k++) {
              const a = k * 2.3999632297,
                r = 35 + Math.floor(k / 2) * 28,
                q = this.safe(anchor.x + Math.cos(a) * r, anchor.y + Math.sin(a) * r, z.id),
                e = members[k];
              e.home = { ...q };
              if (e.hp > 0 && !e.aggro) Object.assign(e, q);
            }
          }
          z.outdoorOccupationVersion = 2;
        } finally {
          this.s.zone = oldZone;
        }
      }
      repairMiniGuardianReachability(z) {
        if (
          dungeonIds.includes(z.id) ||
          this.supplyRoom(z.id) ||
          !z.minis?.length ||
          z.miniReachabilityVersion === 1
        )
          return;
        const oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const occupied = [];
          for (const e of z.enemies.filter((e) => e.guard && e.mini)) {
            const mini = z.minis.find((m) => m.id === e.mini);
            if (!mini) continue;
            let marker = z.npcs.find((n) => n.kind === 'mini' && n.mini === mini.id);
            if (!marker) marker = this.safe(mini.x - 130, mini.y - 10, z.id);
            if (
              !this.blocked(e.home.x, e.home.y, z.id, 15) &&
              this.clearSegment(marker, e.home, 15)
            ) {
              occupied.push(e.home);
              continue;
            }
            let replacement = null;
            for (const radius of [70, 100, 130, 160, 190, 220]) {
              for (let n = 0; n < 24; n++) {
                const a = (n * Math.PI) / 12,
                  p = { x: mini.x + Math.cos(a) * radius, y: mini.y + Math.sin(a) * radius };
                if (
                  this.blocked(p.x, p.y, z.id, 15) ||
                  occupied.some((q) => dist(q, p) < 42) ||
                  !this.clearSegment(marker, p, 15)
                )
                  continue;
                replacement = p;
                break;
              }
              if (replacement) break;
            }
            if (replacement) {
              e.home = { ...replacement };
              if (e.hp > 0 && !e.aggro) Object.assign(e, replacement);
              occupied.push(replacement);
            }
          }
          z.miniReachabilityVersion = 1;
        } finally {
          this.s.zone = oldZone;
        }
      }
      miniDungeons(z) {
        if (dungeonIds.includes(z.id) || this.supplyRoom(z.id) || this.sideDungeon(z.id)) return;
        this.retireResourceMini(z);
        if (z.minisVersion === 2) return;
        const i = this.regionIndex(z.id),
          r = D.regions[i],
          plan = R.miniPlans[i],
          oldZone = this.s.zone;
        this.s.zone = z.id;
        try {
          const family = D.bosses.find((b) => b.region === z.id && b.kind === 'field').id,
            field = this.fieldCenter(i),
            id = 'field-' + family,
            existing = (z.minis || []).find((m) => m.id === id);
          if (existing) {
            if (z.minisVersion !== 2 && (this.s.normal[family] || this.s.rescued[family])) {
              existing.cleared = true;
              for (const e of z.enemies.filter((e) => e.mini === id)) {
                e.hp = 0;
                e.deathPaid = true;
              }
            }
            z.minis = [existing];
            z.minisVersion = 2;
            return;
          }
          z.minis = [];
          const inherited = !!this.s.normal[family] || !!this.s.rescued[family],
            mini = {
              id,
              type: 'field',
              family,
              site: null,
              name: plan.field,
              x: field.x,
              y: field.y,
              cleared: inherited,
              trapPosts: [],
            };
          z.minis.push(mini);
          const roads = (p) =>
              z.roads.some((path) =>
                path.some((b, j) => j && this.distanceToSegment(p, path[j - 1], b) < p.r + 60),
              ),
            posts = [
              [-190, -190],
              [-120, -190],
              [-50, -190],
              [70, -190],
              [140, -190],
              [190, -190],
              [-190, -120],
              [-190, 0],
              [-190, 120],
              [-190, 190],
              [-120, 190],
              [-50, 190],
              [70, 190],
              [140, 190],
              [190, 190],
              [190, 120],
              [190, 0],
              [190, -120],
              [-95, -65],
              [90, -75],
              [0, 140],
            ];
          for (const [j, [dx, dy]] of posts.entries()) {
            const p = { x: field.x + dx, y: field.y + dy, r: j < 18 ? 27 : 30 };
            if (
              this.blocked(p.x, p.y, z.id, p.r + 15) ||
              roads(p) ||
              z.npcs.some((n) => dist(n, p) < p.r + 65) ||
              z.nodes.some((n) => dist(n, p) < p.r + 65) ||
              z.enemies.some((e) => e.type === 'boss' && dist(e.home, p) < 90) ||
              (z.id === oldZone && dist(this.hero, p) < 80)
            )
              continue;
            z.props.push({
              id: 'mini-wall-' + id + '-' + j,
              ...p,
              structure: j < 18 ? plan.theme : 'pillar',
              mini: id,
              icon: '🪨',
            });
          }
          const count = 4 + i * 2,
            pool = z.enemies.filter(
              (e) =>
                e.type === 'mob' &&
                !e.guard &&
                !e.summon &&
                !e.mini &&
                !e.nightOnly &&
                e.form === 'normal',
            ),
            preferredSpecies = D.species[i][1][0],
            preferred = pool
              .filter((e) => e.species === preferredSpecies)
              .sort((a, b) => this.idOrder(a, b)),
            candidates = (
              preferred.length >= count ? preferred : pool.sort((a, b) => this.idOrder(a, b))
            ).slice(0, count),
            offsets = [
              [-250, -100],
              [-250, -25],
              [-110, -250],
              [-25, -250],
              [150, 110],
              [180, 40],
              [30, 180],
              [-60, 160],
              [100, -10],
              [70, 70],
              [-120, 60],
              [-100, -90],
            ];
          candidates.forEach((e, j) => {
            const [dx, dy] = offsets[j % offsets.length],
              p = this.safe(field.x + dx, field.y + dy, z.id);
            Object.assign(e, p);
            e.home = { ...p };
            e.guard = true;
            e.mini = id;
            e.pack = id + '-guard-pair-' + Math.floor(j / 2);
            e.name = e.name.replace(/ guardian$/, '') + ' guardian';
            e.gold = this.regionalEnemyRewards(i, 'roomGuard').gold;
            e.xp = this.regionalEnemyRewards(i, 'roomGuard').xp;
            e.miniRewardVersion = 1;
            if (inherited) {
              e.hp = 0;
              e.deathPaid = true;
            }
            this.configureEnemy(e, j);
          });
          const p = { x: field.x + 50, y: field.y + 65 },
            kinds = R.outdoorMiniTrapKinds[z.id] || ['spikes'];
          if (
            !this.blocked(p.x, p.y) &&
            !roads({ ...p, r: 20 }) &&
            !z.npcs.some((n) => dist(n, p) < 65)
          )
            mini.trapPosts.push({ ...p, kind: kinds[0], index: 110 });
          const marker = this.safe(field.x - 130, field.y - 10, z.id);
          z.npcs.push({
            id: 'mini-' + id,
            name: mini.name,
            kind: 'mini',
            mini: id,
            ...marker,
            icon: '🏚️',
          });
          z.minisVersion = 2;
          for (const n of [...z.npcs, ...z.nodes, ...z.enemies.filter((e) => e.hp > 0)])
            if (this.blocked(n.x, n.y, z.id)) Object.assign(n, this.safe(n.x, n.y, z.id));
          for (const e of z.enemies)
            if (this.blocked(e.home.x, e.home.y, z.id))
              e.home = this.safe(e.home.x, e.home.y, z.id);
        } finally {
          this.s.zone = oldZone;
        }
      }
    }
    const methods = Object.getOwnPropertyDescriptors(World.prototype);
    delete methods.constructor;
    Object.defineProperties(Campaign.prototype, methods);
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeWorld = api;
})(typeof window !== 'undefined' ? window : globalThis);
