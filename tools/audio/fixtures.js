/* Generated diagnostic PCM, not soundtrack content or registered production assets. */
(function (root) {
  'use strict';
  async function create() {
    const files = new Map(),
      assets = {};
    for (const [id, frequency, duration, loop] of [
      ['diagnostic-a', 220, 2, true],
      ['diagnostic-b', 330, 2, true],
      ['diagnostic-click', 660, 0.18, false],
    ]) {
      const rate = 22050,
        length = Math.round(rate * duration),
        bytes = new ArrayBuffer(44 + length * 2),
        view = new DataView(bytes);
      const text = (at, value) =>
        [...value].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)));
      text(0, 'RIFF');
      view.setUint32(4, 36 + length * 2, true);
      text(8, 'WAVE');
      text(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, rate, true);
      view.setUint32(28, rate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      text(36, 'data');
      view.setUint32(40, length * 2, true);
      for (let i = 0; i < length; i++) {
        const envelope = loop ? 1 : Math.sin((Math.PI * i) / length) ** 2;
        view.setInt16(
          44 + i * 2,
          Math.round(Math.sin((2 * Math.PI * frequency * i) / rate) * envelope * 0.12 * 32767),
          true,
        );
      }
      const digest = new Uint8Array(await root.crypto.subtle.digest('SHA-256', bytes));
      const sha256 = [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
      const src = './assets/audio/' + id + '.wav';
      files.set(src, bytes);
      assets[id] = {
        src,
        duration,
        sha256,
        kind: loop ? 'music' : 'effect',
        credits: { author: 'Azeroth Chronicles engineering fixture', license: 'CC0-1.0' },
        ...(loop ? { loop: { start: 0, end: duration } } : {}),
      };
    }
    const api = { schemaVersion: 1, assets };
    return {
      manifest: api,
      files,
      fetch: async (url) => {
        const key = './assets/audio/' + new URL(url).pathname.split('/assets/audio/')[1];
        return files.has(key)
          ? new Response(files.get(key).slice(0), { headers: { 'Content-Type': 'audio/wav' } })
          : new Response('Missing diagnostic', { status: 404 });
      },
    };
  }
  if (typeof module !== 'undefined') module.exports = { create };
  else root.AudioDiagnosticFixtures = { create };
})(typeof window !== 'undefined' ? window : globalThis);
