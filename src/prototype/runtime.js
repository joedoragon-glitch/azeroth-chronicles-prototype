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

  // Rendering-only limiter. Never gates the animation callback or simulation tick.
  const fpsPreferenceKey = 'azeroth-fps-v1';
  function createFrameRate(storage) {
    let preference = 'auto';
    try {
      const saved = storage?.getItem(fpsPreferenceKey);
      if (['auto', '30', '60'].includes(saved)) preference = saved;
    } catch (_) {}
    let target = preference === '60' ? 60 : 30,
      nextDraw = null,
      lastFrame = null,
      lastCheck = null,
      lastSwitch = null,
      samples = [];
    function reset() {
      nextDraw = null;
      lastFrame = null;
      lastCheck = null;
      lastSwitch = null;
      samples = [];
    }
    function select(value) {
      if (!['auto', '30', '60'].includes(value)) return false;
      preference = value;
      target = value === '60' ? 60 : 30;
      reset();
      try {
        storage?.setItem(fpsPreferenceKey, value);
      } catch (_) {}
      return true;
    }
    function shouldDraw(now) {
      if (!Number.isFinite(now)) return false;
      const period = 1000 / target;
      if (nextDraw === null) {
        nextDraw = now + period;
        return true;
      }
      if (now + 0.5 < nextDraw) return false;
      nextDraw += period;
      if (nextDraw <= now) nextDraw = now + period;
      return true;
    }
    function observe(now, workMs, drawn) {
      if (!Number.isFinite(now) || !Number.isFinite(workMs)) return;
      if (lastFrame !== null) {
        const interval = now - lastFrame;
        if (interval > 250 || interval <= 0) {
          reset();
        } else {
          samples.push({ now, interval, workMs, drawn: !!drawn });
          while (samples.length && samples[0].now < now - 6000) samples.shift();
        }
      }
      lastFrame = now;
      if (preference !== 'auto') return;
      if (lastCheck === null) {
        lastCheck = now;
        return;
      }
      if (now - lastCheck < 6000 || (lastSwitch !== null && now - lastSwitch < 12000))
        return;
      lastCheck = now;
      if (samples.length < 90 || samples.at(-1).now - samples[0].now < 4500) return;
      const frames = samples.filter((s) => s.drawn),
        work = frames.map((s) => s.workMs).sort((a, b) => a - b),
        meanInterval =
          samples.reduce((total, s) => total + s.interval, 0) / samples.length,
        drawRate =
          frames.length > 1
            ? ((frames.length - 1) * 1000) / (frames.at(-1).now - frames[0].now)
            : 0,
        p95 = work[Math.floor((work.length - 1) * 0.95)] || Infinity;
      if (target === 30 && meanInterval <= 19 && drawRate >= 27 && p95 < 12) {
        target = 60;
        nextDraw = null;
        lastSwitch = now;
      } else if (target === 60 && (drawRate < 49 || p95 > 18)) {
        target = 30;
        nextDraw = null;
        lastSwitch = now;
      }
    }
    return {
      get preference() {
        return preference;
      },
      get target() {
        return target;
      },
      select,
      shouldDraw,
      observe,
      suspend: reset,
    };
  }
  const api = { create, createFrameRate, fpsPreferenceKey };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRuntime = api;
})(typeof window !== 'undefined' ? window : globalThis);
