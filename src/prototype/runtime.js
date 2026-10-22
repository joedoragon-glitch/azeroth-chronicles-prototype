/* Bounded, local performance samples; no network telemetry or simulation policy. */
(function (root) {
  'use strict';
  function create(clock = () => performance.now()) {
    let samples = [],
      previous = null,
      idleAt = -Infinity;
    function record(now, start, draw) {
      const renderStart = clock();
      draw();
      const end = clock(),
        workMs = Math.max(0, end - start),
        preRenderMs = Math.max(0, renderStart - start),
        renderMs = Math.max(0, end - renderStart),
        intervalMs = previous === null ? 0 : now - previous;
      previous = now;
      samples.push({ workMs, preRenderMs, renderMs, intervalMs });
      if (samples.length > 180) samples.shift();
      return { workMs, preRenderMs, renderMs, intervalMs };
    }
    function report(render = {}, experience = 'desktop') {
      const work = samples.map((s) => s.workMs).sort((a, b) => a - b),
        preRender = samples.map((s) => s.preRenderMs).sort((a, b) => a - b),
        renderWork = samples.map((s) => s.renderMs).sort((a, b) => a - b),
        intervals = samples.map((s) => s.intervalMs).filter((n) => n > 0),
        mean = intervals.reduce((a, b) => a + b, 0) / (intervals.length || 1),
        frameRate = mean ? 1000 / mean : 0;
      return {
        experience,
        sampleFrames: samples.length,
        fps: frameRate < 10 ? Math.round(frameRate * 10) / 10 : Math.round(frameRate),
        workP95Ms: Math.round((work[Math.floor((work.length - 1) * 0.95)] || 0) * 100) / 100,
        workP99Ms: Math.round((work[Math.floor((work.length - 1) * 0.99)] || 0) * 100) / 100,
        preRenderP95Ms:
          Math.round((preRender[Math.floor((preRender.length - 1) * 0.95)] || 0) * 100) / 100,
        renderP95Ms:
          Math.round((renderWork[Math.floor((renderWork.length - 1) * 0.95)] || 0) * 100) / 100,
        sampledWindowMs: Math.round(intervals.reduce((sum, ms) => sum + ms, 0)),
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
        // Hidden/paused frames call suspend explicitly. Slow active frames remain
        // evidence, including severe stalls longer than 250 ms.
        if (interval <= 0) {
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
      if (now - lastCheck < 6000 || (lastSwitch !== null && now - lastSwitch < 12000)) return;
      lastCheck = now;
      if (samples.length < 2 || samples.at(-1).now - samples[0].now < 4500) return;
      const frames = samples.filter((s) => s.drawn),
        work = frames.map((s) => s.workMs).sort((a, b) => a - b),
        meanInterval = samples.reduce((total, s) => total + s.interval, 0) / samples.length,
        drawRate =
          frames.length > 1
            ? ((frames.length - 1) * 1000) / (frames.at(-1).now - frames[0].now)
            : 0,
        p95 = work[Math.floor((work.length - 1) * 0.95)] || Infinity;
      if (
        target === 30 &&
        samples.length >= 90 &&
        meanInterval <= 19 &&
        drawRate >= 27 &&
        p95 < 12
      ) {
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
  // Adapt only the backing-store density. CSS coordinates, camera, input and
  // simulation remain independent of this device-local presentation policy.
  const resolutionPreferenceKey = 'azeroth-render-resolution-v1';
  function createResolution(storage) {
    // Manual density is relative to CSS viewport size, never device resolution.
    const fixedRatios = Object.freeze({ '100': 1, '80': 0.8, '60': 0.6, '50': 0.5 });
    let preference = 'auto';
    try {
      const saved = storage?.getItem(resolutionPreferenceKey);
      if (saved === 'native' || Object.hasOwn(fixedRatios, saved)) preference = saved;
    } catch (_) {}
    let maximum = 1,
      ratio = 1,
      samples = [],
      checkAt = null,
      changedAt = null,
      changes = 0;
    function selectedRatio() {
      return Object.hasOwn(fixedRatios, preference) ? fixedRatios[preference] : maximum;
    }
    function suspend() {
      samples = [];
      checkAt = null;
    }
    return {
      get preference() {
        return preference;
      },
      get ratio() {
        return ratio;
      },
      configure(value) {
        if (!Number.isFinite(value) || value <= 0) return;
        if (value === maximum && ratio === selectedRatio()) return;
        maximum = value;
        ratio = selectedRatio();
        suspend();
      },
      select(value) {
        if (value !== 'auto' && value !== 'native' && !Object.hasOwn(fixedRatios, value))
          return false;
        preference = value;
        ratio = selectedRatio();
        changedAt = null;
        suspend();
        try {
          storage?.setItem(resolutionPreferenceKey, value);
        } catch (_) {}
        return true;
      },
      observe(now, renderMs, target, preRenderMs = 0) {
        if (
          preference !== 'auto' ||
          !Number.isFinite(now) ||
          !Number.isFinite(renderMs) ||
          renderMs < 0 ||
          !Number.isFinite(preRenderMs) ||
          preRenderMs < 0 ||
          ![30, 60].includes(target)
        )
          return false;
        if (samples.length && now <= samples.at(-1).now) suspend();
        samples.push({ now, renderMs, preRenderMs });
        // Keep two active frames even at extreme slowdown. Requiring sixteen
        // frames inside four seconds made recovery impossible below four FPS.
        // Pauses explicitly suspend; a single loading spike cannot dominate
        // the lower of two observations or a populated 80th percentile.
        while (samples.length > 120 || (samples.length > 2 && now - samples[0].now > 4000))
          samples.shift();
        if (checkAt === null) checkAt = now;
        if (now - checkAt < 3000 || samples.length < 2 || now - samples[0].now < 1200) return false;
        checkAt = now;
        const costs = samples.map((s) => s.renderMs).sort((a, b) => a - b),
          preRenderCosts = samples.map((s) => s.preRenderMs).sort((a, b) => a - b),
          cost = costs[Math.floor((costs.length - 1) * 0.8)],
          frameBudget = 1000 / target,
          // Reserve observed shell/simulation time without blurring a scene
          // whose renderer is already cheap during a CPU-only slowdown.
          budget = Math.max(
            frameBudget * 0.35,
            frameBudget - preRenderCosts[Math.floor((preRenderCosts.length - 1) * 0.8)],
          ),
          minimum = Math.min(0.75, maximum);
        let next = ratio;
        if (cost > budget * 1.1 && ratio > minimum) {
          next = Math.max(
            minimum,
            Math.min(ratio - 0.125, Math.floor(ratio * Math.sqrt((budget * 0.8) / cost) * 8) / 8),
          );
        } else if (ratio < maximum && (changedAt === null || now - changedAt >= 12000)) {
          const sharper = Math.min(maximum, ratio + 0.125);
          if (cost * (sharper / ratio) ** 2 < budget * 0.7) next = sharper;
        }
        if (next === ratio) return false;
        ratio = next;
        changedAt = now;
        changes++;
        suspend();
        return true;
      },
      suspend,
      status: () => ({ preference, ratio, maximum, changes }),
    };
  }
  const api = {
    create,
    createFrameRate,
    fpsPreferenceKey,
    createResolution,
    resolutionPreferenceKey,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRuntime = api;
})(typeof window !== 'undefined' ? window : globalThis);
