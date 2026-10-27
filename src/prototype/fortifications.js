/* Authored defended areas. Wall permissions apply only to hostile ranged fire. */
(function (root) {
  'use strict';
  function install(Campaign, { R }) {
    const frames = new WeakMap();
    const rectangle = (x1, x2, y1, y2) => [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ];
    const contains = (points, p) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [x, y] = points[i],
          [a, b] = points[j];
        if (y > p.y !== b > p.y && p.x < ((a - x) * (p.y - y)) / (b - y) + x) inside = !inside;
      }
      return inside;
    };
    class Fortifications {
      fortAreas() {
        const z = this.s.zones[this.zoneId] || this.zone();
        let frame = frames.get(z);
        if (frame?.props === z.props && frame.count === z.props.length) return frame.areas;
        const areas = [],
          cfg = R.balance.fortifications;
        const add = (id, points, walls, partitions = []) =>
          areas.push({
            id,
            zone: z.id,
            points,
            props: new Set(walls.map((p) => p.id)),
            partitions: new Set(partitions),
          });
        for (const plan of R.creatureStrongholds.filter((p) => p.region === z.id)) {
          const walls = z.props.filter((p) => p.stronghold === plan.id && !p.decorative && p.r > 0);
          if (!walls.length) continue;
          const ring =
            plan.defenseStyle === 'fort'
              ? [
                  ...Array.from({ length: 7 }, (_, k) => [-150 + k * 50, -150]).filter(
                    ([x]) => x !== 0 && x !== 50,
                  ),
                  ...Array.from({ length: 7 }, (_, k) => [-150 + k * 50, 150]),
                  ...Array.from({ length: 5 }, (_, k) => [-150, -100 + k * 50]),
                  ...Array.from({ length: 5 }, (_, k) => [150, -100 + k * 50]),
                ]
              : [
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
          // Infer the current authored anchor from stable wall indices. This
          // follows relocated forts instead of granting protection at old sites.
          const anchors = walls.flatMap((p) => {
            const match = String(p.id).match(/-wall-(\d+)$/),
              offset = match && ring[+match[1]];
            return offset ? [{ x: p.x - offset[0], y: p.y - offset[1] }] : [];
          });
          const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
          const center = anchors.length
            ? { x: median(anchors.map((p) => p.x)), y: median(anchors.map((p) => p.y)) }
            : this.creatureStrongholdCenter(z, plan);
          if (!center) continue;
          const points =
            plan.defenseStyle === 'fort'
              ? rectangle(center.x - 150, center.x + 150, center.y - 150, center.y + 150)
              : ring.map(([x, y]) => [center.x + x, center.y + y]);
          add(plan.id, points, walls);
        }
        for (const mini of z.minis || []) {
          const walls = z.props.filter(
            (p) => p.mini === mini.id && String(p.id).startsWith('mini-wall-') && !p.decorative,
          );
          if (mini.type === 'field' && walls.length)
            add(
              mini.id,
              rectangle(
                mini.x - cfg.compoundHalfSize,
                mini.x + cfg.compoundHalfSize,
                mini.y - cfg.compoundHalfSize,
                mini.y + cfg.compoundHalfSize,
              ),
              walls,
            );
        }
        for (const area of cfg.outdoorAreas.filter((a) => a.zone === z.id)) {
          add(
            area.id,
            rectangle(...area.bounds),
            z.props.filter(
              (p) =>
                area.districts.includes(p.crownDistrict) &&
                !p.decorative &&
                ['crown-wall', 'stonewall', 'stockade', 'palisade'].includes(p.structure),
            ),
          );
        }
        if (cfg.interiorZones.includes(z.id)) {
          const architecture = R.dungeonArchitecture[z.id] || R.treasuryArchitecture[z.id];
          if (architecture) {
            const partitions = architecture.partitions.map((p) => p.id);
            for (const area of architecture.walkable)
              add(z.id + '-' + area.id, rectangle(...area.bounds), [], partitions);
          } else {
            const size = this.zoneSize(),
              treasury = !!this.supplyRoom(z.id),
              edge = treasury ? 40 : 70;
            add(
              z.id,
              rectangle(edge, size - edge, edge, size - edge),
              z.props.filter((p) => String(p.id).startsWith('side-wall-')),
              treasury ? (R.treasuryWalls[z.id] || []).map((p) => p.id) : [],
            );
          }
        }
        frames.set(z, { time: this.s.time, props: z.props, count: z.props.length, areas });
        return areas;
      }
      enemyFort(e) {
        if (
          !e ||
          e.hp <= 0 ||
          e.neutral ||
          !this.s.zones[this.zoneId]?.enemies.some((u) => u === e || u.id === e.id)
        )
          return null;
        return this.fortAreas().find((f) => contains(f.points, e)) || null;
      }
      enemyRanged(e) {
        return e.ranged ?? ['archer', 'crownguard'].includes(e.species);
      }
      enemyRangedRange(e) {
        return (
          (e.shotRange || 280) *
          R.balance.enemyRangedBasicRangeMultiplier *
          (this.enemyFort(e) ? R.balance.fortifications.rangeMultiplier : 1)
        );
      }
      enemyAcquisitionRange(e) {
        // Forts preserve their extended acquisition band without coupling
        // detection to the independently configurable firing multiplier.
        const detection = R.balance.enemyAcquisitionRangeMultiplier;
        return Math.max(
          R.balance.enemyAcquisitionRange * detection,
          this.enemyRanged(e) && this.enemyFort(e)
            ? (e.shotRange || 280) * detection * R.balance.fortifications.rangeMultiplier
            : 0,
        );
      }
      enemyRangedLine(e, target) {
        return this.enemyRanged(e)
          ? this.fortShotClear(e, target, this.enemyShotCover(this.enemyFort(e)))
          : this.line(e, target);
      }
      enemyShotCover(fort = null) {
        this.fortAreas();
        const z = this.s.zones[this.zoneId],
          frame = frames.get(z);
        frame.cover ||= new Map();
        const key = fort?.id || '';
        if (frame.cover.has(key)) return frame.cover.get(key);
        const cfg = R.balance.fortifications,
          architecture = R.dungeonArchitecture[z.id] || R.treasuryArchitecture[z.id];
        const cover = {
          props: new Set([
            ...(fort?.props || []),
            ...z.props
              .filter((p) => !p.decorative && cfg.lowObstacleStructures.includes(p.structure))
              .map((p) => p.id),
          ]),
          partitions: new Set([
            ...(fort?.partitions || []),
            ...(architecture?.partitions || [])
              .filter((p) => cfg.lowPartitionIds.includes(p.id))
              .map((p) => p.id),
          ]),
        };
        frame.cover.set(key, cover);
        return cover;
      }
      fortShotBlocked(p, fort) {
        return this.blocked(p.x, p.y, this.zoneId, 0, false, fort);
      }
      fortShotClear(a, b, fort) {
        const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8));
        for (let j = 0; j <= n; j++)
          if (
            this.fortShotBlocked(
              { x: a.x + ((b.x - a.x) * j) / n, y: a.y + ((b.y - a.y) * j) / n },
              fort,
            )
          )
            return false;
        return true;
      }
      prepareFortProjectile(p, enemy, target = null) {
        // Capture launch rights, never grant them to a shot entering from outside.
        p.fortChecked = true;
        const fort = this.enemyFort(enemy);
        p.fortZone = this.zoneId;
        if (fort) p.fortId = fort.id;
        p.fortFromX = p.x;
        p.fortFromY = p.y;
        p.fortBaseSpeed ??= p.speed;
        p.fortBaseLife ??= p.life || 0;
        const baseLife =
            fort && !p.preserveFootprint
              ? Math.max(p.fortBaseLife, this.enemyRangedRange(enemy) / p.fortBaseSpeed + 0.1)
              : p.fortBaseLife,
          span = p.fortBaseSpeed * baseLife;
        p.speed = p.fortBaseSpeed * (fort ? R.balance.fortifications.projectileSpeedMultiplier : 1);
        // Speed up the same flight, preserving special-shot footprints and
        // warning reach rather than extending their range a second time.
        p.life = span / p.speed;
        const end = target || { x: p.x + (p.dx || 0) * span, y: p.y + (p.dy || 0) * span };
        p.rangedArc = !!fort || !this.line(p, end);
        p.fortDistance = Math.max(1, target ? Math.hypot(target.x - p.x, target.y - p.y) : span);
        // An arc has one fixed landing point. A dodged shot ends there rather
        // than skating along the floor for the remainder of its range budget.
        if (p.rangedArc) p.life = Math.min(p.life, p.fortDistance / p.speed);
      }
      projectileFort(p) {
        return p.source === 'enemy' && p.fortZone === this.zoneId
          ? this.enemyShotCover(this.fortAreas().find((f) => f.id === p.fortId) || null)
          : null;
      }
      fortProjectileLift(p) {
        if (!p.rangedArc || p.fortZone !== this.zoneId) return 0;
        const along = (p.x - p.fortFromX) * (p.dx || 0) + (p.y - p.fortFromY) * (p.dy || 0);
        const t = Math.max(0, Math.min(1, along / p.fortDistance));
        return (
          R.balance.fortifications.launchHeight * (1 - t) +
          R.balance.fortifications.arcHeight * Math.sin(Math.PI * t)
        );
      }
    }
    for (const key of Object.getOwnPropertyNames(Fortifications.prototype))
      if (key !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          key,
          Object.getOwnPropertyDescriptor(Fortifications.prototype, key),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeFortifications = api;
})(typeof window !== 'undefined' ? window : globalThis);
