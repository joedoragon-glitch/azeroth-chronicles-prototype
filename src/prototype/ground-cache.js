/* Presentation-only reuse of the static outdoor floor, never actors or terrain animation. */
(function (root) {
  'use strict';
  class GroundCache {
    constructor(options = {}) {
      this.budget = options.budget ?? 64 * 1024 * 1024;
      this.margin = options.margin ?? 256;
      this.createCanvas =
        options.createCanvas ||
        ((width, height) => {
          if (root.OffscreenCanvas) return new root.OffscreenCanvas(width, height);
          const canvas = root.document?.createElement('canvas');
          if (canvas) {
            canvas.width = width;
            canvas.height = height;
          }
          return canvas;
        });
      this.item = null;
      this.builds = 0;
      this.hits = 0;
      // Measure completed CPU raster construction only, never ordinary cache hits.
      this.now = options.now || (() => root.performance?.now?.() ?? Date.now());
      this.rebuildMs = 0;
      this.maxRebuildMs = 0;
      this.lastRebuildMs = 0;
      this.failedBuilds = 0;
      this.budgetSkips = 0;
      this.transformSkips = 0;
    }
    clear() {
      if (this.item) this.item.canvas.width = this.item.canvas.height = 0;
      this.item = null;
    }
    // Prepare the ONE existing offscreen backing raster, without drawing onto
    // the visible world canvas. The live draw path calls this same method.
    prepare({ width, height, origin, scene, revision, paint, transform }) {
      const t = transform;
      if (!t || t.b || t.c || t.e || t.f || t.a <= 0 || t.d <= 0) {
        this.transformSkips++;
        this.clear();
        return false;
      }
      let margin = this.margin;
      while (
        margin > 64 &&
        Math.ceil((width + margin * 2) * t.a) * Math.ceil((height + margin * 2) * t.d) * 4 >
          this.budget
      )
        margin -= 64;
      const pixelsX = Math.ceil((width + margin * 2) * t.a),
        pixelsY = Math.ceil((height + margin * 2) * t.d),
        bytes = pixelsX * pixelsY * 4;
      if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > this.budget) {
        this.budgetSkips++;
        this.clear();
        return false;
      }
      let item = this.item;
      const dx = item ? origin.x - item.origin.x : 0,
        dy = item ? origin.y - item.origin.y : 0;
      if (
        !item ||
        item.scene !== scene ||
        item.revision !== revision ||
        item.width !== width ||
        item.height !== height ||
        item.a !== t.a ||
        item.d !== t.d ||
        item.margin !== margin ||
        Math.abs(dx) > margin ||
        Math.abs(dy) > margin
      ) {
        // Retire the old backing store before allocating its replacement.
        this.clear();
        const buildStarted = this.now();
        let canvas;
        try {
          canvas = this.createCanvas(pixelsX, pixelsY);
          const q = canvas?.getContext('2d');
          if (!q) {
            this.failedBuilds++;
            if (canvas) canvas.width = canvas.height = 0;
            return false;
          }
          q.setTransform(t.a, 0, 0, t.d, 0, 0);
          q.fillStyle = '#0c1913';
          q.fillRect(0, 0, pixelsX / t.a, pixelsY / t.d);
          paint(q, { x: origin.x + margin, y: origin.y + margin }, pixelsX / t.a, pixelsY / t.d);
        } catch (_) {
          this.failedBuilds++;
          if (canvas) canvas.width = canvas.height = 0;
          return false;
        }
        const measuredMs = this.now() - buildStarted;
        const buildMs = Number.isFinite(measuredMs) ? Math.max(0, measuredMs) : 0;
        this.lastRebuildMs = buildMs;
        this.rebuildMs += buildMs;
        this.maxRebuildMs = Math.max(this.maxRebuildMs, buildMs);
        item = this.item = {
          canvas,
          bytes,
          scene,
          revision,
          width,
          height,
          a: t.a,
          d: t.d,
          origin: { ...origin },
          margin,
        };
        this.builds++;
      } else this.hits++;
      return true;
    }
    draw(ctx, args) {
      const transform = ctx.getTransform?.();
      if (!this.prepare({ ...args, transform })) return false;
      const item = this.item;
      // Blit dimensions and position are identical to the pre-refactor path.
      ctx.drawImage(
        item.canvas,
        args.origin.x - item.origin.x - item.margin,
        args.origin.y - item.origin.y - item.margin,
        item.canvas.width / transform.a,
        item.canvas.height / transform.d,
      );
      return true;
    }
    status() {
      return {
        bytes: this.item?.bytes || 0,
        budget: this.budget,
        builds: this.builds,
        hits: this.hits,
        margin: this.item?.margin || 0,
        // Cumulative synchronous Canvas painter times, not browser frame/VRAM data.
        rebuildMs: this.rebuildMs,
        maxRebuildMs: this.maxRebuildMs,
        lastRebuildMs: this.lastRebuildMs,
        failedBuilds: this.failedBuilds,
        budgetSkips: this.budgetSkips,
        transformSkips: this.transformSkips,
      };
    }
  }
  if (typeof module !== 'undefined') module.exports = GroundCache;
  else root.PrototypeGroundCache = GroundCache;
})(typeof window !== 'undefined' ? window : globalThis);
