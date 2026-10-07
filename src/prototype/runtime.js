/* Bounded, local performance samples; no network telemetry or simulation policy. */
(function (root) {
  'use strict';
  function create(clock = () => performance.now()) {
    let samples = [],
      previous = null,
      idleAt = -Infinity;
    function record(now, start, draw) {
      draw();
      const workMs = Math.max(0, clock() - start),
        intervalMs = previous === null ? 0 : now - previous;
      previous = now;
      samples.push({ workMs, intervalMs });
      if (samples.length > 180) samples.shift();
    }
    function report(render = {}, experience = 'desktop') {
      const work = samples.map((s) => s.workMs).sort((a, b) => a - b),
        intervals = samples.map((s) => s.intervalMs).filter((n) => n > 0 && n < 1000),
        mean = intervals.reduce((a, b) => a + b, 0) / (intervals.length || 1);
      return {
        experience,
        sampleFrames: samples.length,
        fps: mean ? Math.round(1000 / mean) : 0,
        workP95Ms: Math.round((work[Math.floor((work.length - 1) * 0.95)] || 0) * 100) / 100,
        render: { ...render },
      };
    }
    return {
      record,
      report,
      suspend() {
        previous = null;
      },
      shouldDrawIdle(now) {
        if (now - idleAt < 250) return false;
        idleAt = now;
        return true;
      },
      reset() {
        samples = [];
        previous = null;
      },
      describe(render) {
        const r = report(render);
        return (
          'Local sample: ' +
          r.fps +
          ' frames/s · ' +
          r.workP95Ms +
          ' ms at the 95th percentile. ' +
          r.sampleFrames +
          ' recent frames.\nVisible objects: ' +
          (render.entitiesDrawn || 0) +
          ' / ' +
          (render.entitiesConsidered || 0) +
          '. Floor tiles: ' +
          (render.tilesDrawn || 0) +
          ' / ' +
          (render.tileCandidates || 0) +
          ' candidates.\nExport a playtest report to include this sample. Measurements describe this device and scene.'
        );
      },
    };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRuntime = api;
})(typeof window !== 'undefined' ? window : globalThis);
