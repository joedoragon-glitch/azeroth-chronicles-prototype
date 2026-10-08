/* Recorded audio: verified local fetch, lazy decode and bounded LRU ownership. */
(function (root) {
  'use strict';
  const encodedLimit = 8 * 1024 * 1024;
  class Assets {
    constructor(ctx, manifest, options = {}) {
      this.ctx = ctx;
      this.manifest = JSON.parse(JSON.stringify(manifest));
      this.fetch = options.fetch || root.fetch.bind(root);
      this.base = new URL(options.baseUrl || './', root.location?.href || 'https://localhost/');
      this.budget = options.budget ?? 32 * 1024 * 1024;
      if (!Number.isFinite(this.budget) || this.budget < 1024 || this.budget > 64 * 1024 * 1024)
        throw Error('Invalid decoded memory budget');
      this.cache = new Map();
      this.pending = new Map();
      this.controllers = new Set();
      this.bytes = 0;
      this.closed = false;
      this.tail = Promise.resolve();
      this.lastError = null;
    }
    entry(id) {
      const e = this.manifest?.schemaVersion === 1 && this.manifest.assets?.[id];
      if (
        !e ||
        !['music', 'ambience', 'effect'].includes(e.kind) ||
        !Number.isFinite(e.duration) ||
        e.duration <= 0 ||
        e.duration > 600 ||
        (e.loop &&
          (!Number.isFinite(e.loop.start) ||
            !Number.isFinite(e.loop.end) ||
            e.loop.start < 0 ||
            e.loop.start >= e.loop.end ||
            e.loop.end > e.duration))
      )
        throw Error('Invalid recording: ' + id);
      return e;
    }
    candidates(entry) {
      const candidates = [entry, ...(entry.variants || [])];
      if (candidates.length > 4) throw Error('Too many codec variants');
      return candidates.map((e) => {
        if (
          !/^\.\/assets\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(e.src || '') ||
          !/^[a-f0-9]{64}$/.test(e.sha256 || '')
        )
          throw Error('Invalid recording path/hash');
        const url = new URL(e.src, this.base);
        if (
          url.origin !== this.base.origin ||
          !url.href.startsWith(new URL('./assets/audio/', this.base).href)
        )
          throw Error('Recording escapes local audio root');
        return { url: url.href, sha256: e.sha256 };
      });
    }
    touch(id) {
      const item = this.cache.get(id);
      if (item) {
        this.cache.delete(id);
        this.cache.set(id, item);
      }
      return item;
    }
    room(size) {
      if (size > this.budget) throw Error('Recording exceeds decoded memory budget');
      for (const [id, item] of this.cache) {
        if (this.bytes + size <= this.budget) break;
        if (!item.refs) {
          this.cache.delete(id);
          this.bytes -= item.bytes;
        }
      }
      if (this.bytes + size > this.budget)
        throw Error('Active recordings fill decoded memory budget');
    }
    async bytesFor(candidate) {
      const controller = new AbortController();
      this.controllers.add(controller);
      const timer = root.setTimeout(() => controller.abort(), 15000);
      try {
        const response = await this.fetch(candidate.url, {
          signal: controller.signal,
          credentials: 'same-origin',
        });
        if (!response.ok) throw Error('Recording fetch failed: ' + response.status);
        const declared = Number(response.headers?.get('content-length'));
        if (declared > encodedLimit) throw Error('Encoded recording exceeds budget');
        let bytes;
        if (response.body?.getReader) {
          const reader = response.body.getReader(),
            chunks = [];
          let length = 0;
          try {
            while (true) {
              const result = await reader.read();
              if (result.done) break;
              length += result.value.byteLength;
              if (length > encodedLimit) throw Error('Encoded recording exceeds budget');
              chunks.push(result.value);
            }
          } catch (error) {
            await reader.cancel().catch(() => {});
            throw error;
          }
          bytes = new Uint8Array(length);
          let at = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, at);
            at += chunk.byteLength;
          }
        } else bytes = new Uint8Array(await response.arrayBuffer());
        if (!bytes.length || bytes.length > encodedLimit) throw Error('Invalid encoded size');
        const digest = new Uint8Array(await root.crypto.subtle.digest('SHA-256', bytes));
        const hash = [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
        if (hash !== candidate.sha256) throw Error('Recording hash mismatch');
        if (this.closed) throw Error('Audio assets disposed');
        return bytes.buffer;
      } finally {
        root.clearTimeout(timer);
        this.controllers.delete(controller);
      }
    }
    load(id) {
      if (this.closed) return Promise.reject(Error('Audio assets disposed'));
      const cached = this.touch(id);
      if (cached) return Promise.resolve(cached);
      if (this.pending.has(id)) return this.pending.get(id);
      if (this.pending.size >= 8) return Promise.reject(Error('Audio load queue full'));
      const job = this.tail.then(async () => {
        if (this.closed) throw Error('Audio assets disposed');
        const entry = this.entry(id),
          candidates = this.candidates(entry);
        // Serialize decodes and reserve a conservative stereo allocation before decoding.
        this.room(Math.ceil(entry.duration * this.ctx.sampleRate * 2 * 4));
        let last;
        for (const candidate of candidates) {
          try {
            const bytes = await this.bytesFor(candidate);
            let decodeTimer;
            const buffer = await Promise.race([
              this.ctx.decodeAudioData(bytes),
              new Promise((_, reject) => {
                decodeTimer = root.setTimeout(() => {
                  this.dispose();
                  reject(Error('Audio decode timed out; reopen audio to retry'));
                }, 20000);
              }),
            ]).finally(() => root.clearTimeout(decodeTimer));
            if (this.closed) throw Error('Audio assets disposed');
            if (
              buffer.numberOfChannels > 2 ||
              buffer.numberOfChannels < 1 ||
              Math.abs(buffer.duration - entry.duration) > Math.max(0.08, entry.duration * 0.01) ||
              (entry.loop && entry.loop.end > buffer.duration + 1 / buffer.sampleRate)
            )
              throw Error('Decoded duration/channels/loop mismatch');
            const size = buffer.length * buffer.numberOfChannels * 4;
            this.room(size);
            const item = { buffer, bytes: size, refs: 0, entry, src: candidate.url };
            this.cache.set(id, item);
            this.bytes += size;
            this.lastError = null;
            return item;
          } catch (error) {
            last = error;
            if (this.closed) throw error;
          }
        }
        throw last || Error('No playable codec');
      });
      this.pending.set(id, job);
      this.tail = job.catch(() => {});
      job.then(
        () => this.pending.delete(id),
        (error) => {
          this.pending.delete(id);
          this.lastError = error.message;
        },
      );
      return job;
    }
    retain(id, item) {
      if (this.closed || this.cache.get(id) !== item) throw Error('Recording was evicted');
      item.refs++;
      this.touch(id);
    }
    release(item) {
      item.refs = Math.max(0, item.refs - 1);
    }
    status() {
      return {
        decodedBytes: this.bytes,
        decodedBudget: this.budget,
        cached: this.cache.size,
        pending: this.pending.size,
        pinned: [...this.cache.values()].filter((i) => i.refs).length,
        lastError: this.lastError,
      };
    }
    dispose() {
      this.closed = true;
      for (const c of this.controllers) c.abort();
      this.cache.clear();
      this.bytes = 0;
    }
  }
  if (typeof module !== 'undefined') module.exports = Assets;
  else root.PrototypeAudioAssets = Assets;
})(typeof window !== 'undefined' ? window : globalThis);
