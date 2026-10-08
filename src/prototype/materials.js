/* Optional grain: world coordinates, exact procedural clipping and bounded lazy residency. */
(function (root) {
  'use strict';
  const Contract =
    root.PrototypeMaterialContract ||
    (typeof require === 'function' ? require('./material-contract.js') : null);
  class Materials {
    constructor(options = {}) {
      this.Image = options.Image || root.Image;
      this.timeout = options.timeout || 15000;
      this.fetch = options.fetch || root.fetch?.bind(root);
      this.entries = {};
      this.cache = new Map();
      this.pending = new Map();
      this.failed = new Set();
      this.queue = [];
      this.pins = new Set();
      this.bytes = 0;
      this.reserved = 0;
      this.decoding = 0;
      this.request = 0;
      this.frame = false;
      this.stats = {
        peakDecodedBytes: 0,
        peakConcurrent: 0,
        evictions: 0,
        staleLoads: 0,
        draws: 0,
      };
    }
    identity(e) {
      return e.hash + ':' + e.width + 'x' + e.height;
    }
    install(manifest) {
      let entries;
      try {
        entries = Contract.entries(manifest);
      } catch (_) {
        return false;
      }
      this.entries = entries;
      this.request++;
      this.active = new Set(Object.values(entries).map((e) => this.identity(e)));
      this.failed.clear();
      this.pins.clear();
      for (const [id, item] of this.cache)
        if (!this.active.has(id)) {
          this.cache.delete(id);
          this.bytes -= item.bytes;
        }
      for (let i = this.queue.length - 1; i >= 0; i--)
        if (!this.active.has(this.queue[i].id)) {
          const job = this.queue.splice(i, 1)[0];
          this.pending.delete(job.id);
          job.resolve(null);
        }
      this.pump();
      return true;
    }
    async load(url = './assets/materials/manifest.json') {
      const request = ++this.request;
      try {
        const response = await this.fetch?.(url, { cache: 'no-cache' });
        if (response?.ok) {
          const next = await response.json();
          if (request === this.request) this.install(next);
        }
      } catch (_) {}
      return this.status();
    }
    room(size) {
      while (this.bytes + this.reserved + size > Contract.LIMITS.decodedBytes) {
        const item = [...this.cache].find(([id]) => !this.pins.has(id));
        if (!item) return false;
        this.cache.delete(item[0]);
        this.bytes -= item[1].bytes;
        this.stats.evictions++;
      }
      return true;
    }
    pump() {
      if (this.frame || !this.Image) return;
      while (this.queue.length && this.decoding < Contract.LIMITS.concurrent) {
        const job = this.queue[0],
          size = job.entry.width * job.entry.height * 4;
        if (!this.room(size)) break;
        this.queue.shift();
        this.decoding++;
        this.reserved += size;
        this.stats.peakConcurrent = Math.max(this.stats.peakConcurrent, this.decoding);
        const img = new this.Image();
        let done = false,
          timer;
        const finish = (ok) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          this.reserved -= size;
          this.decoding--;
          this.pending.delete(job.id);
          const w = img.naturalWidth || img.width,
            h = img.naturalHeight || img.height;
          if (!this.active.has(job.id)) {
            this.stats.staleLoads++;
            ok = false;
          } else if (!ok || w !== job.entry.width || h !== job.entry.height) {
            this.failed.add(job.id);
            ok = false;
          }
          if (ok && this.room(size)) {
            this.cache.set(job.id, { image: img, bytes: size, patterns: new WeakMap() });
            this.bytes += size;
            this.stats.peakDecodedBytes = Math.max(this.stats.peakDecodedBytes, this.bytes);
            job.resolve(img);
          } else job.resolve(null);
          this.pump();
        };
        timer = setTimeout(() => finish(false), this.timeout);
        timer.unref?.();
        img.decoding = 'async';
        img.onload = () => {
          try {
            Promise.resolve(img.decode?.()).then(
              () => finish(true),
              () => finish(false),
            );
          } catch (_) {
            finish(false);
          }
        };
        img.onerror = () => finish(false);
        try {
          img.src = job.entry.src;
        } catch (_) {
          finish(false);
        }
      }
    }
    ensure(key) {
      const entry = this.entries[key];
      if (!entry) return Promise.resolve(null);
      const id = this.identity(entry),
        cached = this.cache.get(id);
      if (cached) {
        this.cache.delete(id);
        this.cache.set(id, cached);
        return Promise.resolve(cached.image);
      }
      if (this.failed.has(id) || !this.Image) return Promise.resolve(null);
      if (this.pending.has(id)) return this.pending.get(id);
      let resolve;
      const promise = new Promise((r) => {
        resolve = r;
      });
      this.pending.set(id, promise);
      this.queue.push({ id, entry, resolve });
      this.pump();
      return promise;
    }
    beginFrame() {
      this.frame = true;
      this.pins.clear();
      this.stats.draws = 0;
    }
    endFrame() {
      this.frame = false;
      this.pump();
    }
    paint(ctx, key, screen, points, angle = 0) {
      const e = this.entries[key];
      if (
        !e ||
        !Array.isArray(points) ||
        points.length < 3 ||
        !points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) ||
        !Number.isFinite(angle)
      )
        return false;
      const id = this.identity(e);
      this.pins.add(id);
      const item = this.cache.get(id);
      if (!item) {
        void this.ensure(key);
        return false;
      }
      let pattern = item.patterns.get(ctx);
      if (!pattern) {
        pattern = ctx.createPattern(item.image, 'repeat');
        if (!pattern) return false;
        item.patterns.set(ctx, pattern);
      }
      const origin = screen({ x: 0, y: 0 }),
        cosine = Math.cos(angle),
        sine = Math.sin(angle),
        span = e.worldSpan / e.width;
      // Screen-space clip is captured before changing the existing DPR transform.
      ctx.save();
      try {
        ctx.beginPath();
        points.map(screen).forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.clip();
        ctx.globalAlpha *= e.opacity;
        ctx.imageSmoothingEnabled = true;
        ctx.transform(0.76, 0.27, -0.76, 0.27, origin.x, origin.y);
        ctx.rotate(angle);
        ctx.scale(span, span);
        ctx.fillStyle = pattern;
        const local = points.map((p) => ({
          x: (p.x * cosine + p.y * sine) / span,
          y: (-p.x * sine + p.y * cosine) / span,
        }));
        const xs = local.map((p) => p.x),
          ys = local.map((p) => p.y);
        ctx.fillRect(
          Math.min(...xs) - 1,
          Math.min(...ys) - 1,
          Math.max(...xs) - Math.min(...xs) + 2,
          Math.max(...ys) - Math.min(...ys) + 2,
        );
        this.stats.draws++;
        return true;
      } finally {
        ctx.restore();
      }
    }
    status() {
      return {
        definitions: Object.keys(this.entries).length,
        decodedBytes: this.bytes,
        reservedBytes: this.reserved,
        decodedBudget: Contract.LIMITS.decodedBytes,
        decoded: this.cache.size,
        queued: this.queue.length,
        decoding: this.decoding,
        failures: this.failed.size,
        ...this.stats,
      };
    }
  }
  if (typeof module !== 'undefined') module.exports = Materials;
  else root.PrototypeMaterials = new Materials();
})(typeof window !== 'undefined' ? window : globalThis);
