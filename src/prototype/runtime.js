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
        const layerNote = render.measuredLayer === 'canvas-combat-overlay'
          ? 'Canvas combat overlay only; Pixi world actor/tile counts are separate.\n'
          : '';
        return (
          'Local sample: ' +
          r.fps +
          ' issued draws/s · ' +
          r.workP95Ms +
          ' ms at the 95th percentile. ' +
          r.sampleFrames +
          ' recent frames.\n' + layerNote + 'Canvas visible objects: ' +
          (render.entitiesDrawn || 0) +
          ' / ' +
          (render.entitiesConsidered || 0) +
          '. Floor tiles: ' +
          (render.tilesDrawn || 0) +
          ' / ' +
          (render.tileCandidates || 0) +
          ' candidates.\nExport a playtest report to include this sample. These are local synchronous estimates, not presented FPS.'
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
      if (['auto', 'auto60', '20', '30', '60'].includes(saved)) preference = saved;
    } catch (_) {}
    let target = preference === '60' ? 60 : preference === '20' ? 20 : 30,
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
      if (!['auto', 'auto60', '20', '30', '60'].includes(value)) return false;
      preference = value;
      target = value === '60' ? 60 : value === '20' ? 20 : 30;
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
      if (preference !== 'auto' && preference !== 'auto60') return;
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
      if (preference === 'auto') {
        // New default: start at 30, use 20 during sustained pressure, and
        // cautiously recover to 30 after measured headroom returns.
        if (target === 30 && (drawRate < 25 || p95 > 33)) {
          target = 20;
          nextDraw = null;
          lastSwitch = now;
        } else if (
          target === 20 &&
          samples.length >= 90 &&
          meanInterval <= 35 &&
          drawRate >= 18 &&
          p95 < 24
        ) {
          target = 30;
          nextDraw = null;
          lastSwitch = now;
        }
      } else if (
        // Preserve the previous Auto 30–60 policy as an explicit setting.
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

  // Device-local draw reduction with an emergency simulation-hold signal.
  // Normal adaptive skips never interrupt simulation or input.
  const frameSkipPreferenceKey = 'azeroth-adaptive-frame-skip-v1';
  function createFrameSkip(storage) {
    // New installs use adaptive skipping. An explicit device-local Off wins.
    let enabled = true;
    try {
      enabled = storage?.getItem(frameSkipPreferenceKey) !== 'off';
    } catch (_) {}
    let drawWork = null,
      renderWork = null,
      drawnSamples = 0,
      consecutiveSkips = 0,
      lastDrawAt = null,
      skippedDraws = 0,
      emergency = false,
      emergencyEntries = 0,
      protectedCallbacks = 0,
      criticalIntervals = 0,
      criticalDraws = 0,
      healthyDraws = 0,
      lastIntervalMs = Infinity;
    // Ordinary load: two skipped opportunities and a 350ms image-age guard.
    // Critical load: more aggressive skipping, but still probe the renderer.
    const maximumDrawAgeMs = 350;
    const emergencyMaximumDrawAgeMs = 650;
    const criticalIntervalMs = 180;
    const hardStallIntervalMs = 650;
    function engageEmergency() {
      if (emergency) return;
      emergency = true;
      emergencyEntries++;
      healthyDraws = 0;
      consecutiveSkips = 0;
    }
    function suspend() {
      drawWork = renderWork = null;
      drawnSamples = 0;
      consecutiveSkips = 0;
      lastDrawAt = null;
      emergency = false;
      criticalIntervals = 0;
      criticalDraws = 0;
      healthyDraws = 0;
      lastIntervalMs = Infinity;
    }
    return {
      get enabled() { return enabled; },
      get emergency() { return enabled && emergency; },
      select(value) {
        if (typeof value !== 'boolean') return false;
        enabled = value;
        skippedDraws = 0;
        emergencyEntries = 0;
        protectedCallbacks = 0;
        suspend();
        try { storage?.setItem(frameSkipPreferenceKey, enabled ? 'on' : 'off'); } catch (_) {}
        return true;
      },
      // Detect sustained near-freeze callback timing *before* simulation, so
      // the rescue callback cannot inflict combat damage while input is stale.
      // A single ordinary spike is insufficient; a hard stall can trigger at once.
      beginFrame(now, intervalMs) {
        if (!enabled || !Number.isFinite(now) ||
          !Number.isFinite(intervalMs) || intervalMs < 0) return false;
        lastIntervalMs = intervalMs;
        if (!emergency) {
          criticalIntervals = intervalMs >= criticalIntervalMs ? criticalIntervals + 1 : 0;
          if (intervalMs >= hardStallIntervalMs || criticalIntervals >= 2)
            engageEmergency();
        }
        if (emergency) protectedCallbacks++;
        return emergency;
      },
      // Called only for a drawing already permitted by the regular FPS limiter.
      // Applies at every valid FPS target; warnings have no special exemption.
      shouldSkip(now, target) {
        if (!enabled || !Number.isFinite(now) ||
          !Number.isFinite(target) || target <= 0) return false;
        const stressed =
          drawnSamples >= 6 &&
          drawWork > (1000 / target) * 1.12 &&
          renderWork >= 5;
        const drawAge = lastDrawAt === null ? Infinity : now - lastDrawAt;
        const skip = (emergency || stressed) &&
          consecutiveSkips < (emergency ? 5 : 2) &&
          drawAge >= 0 &&
          drawAge < (emergency ? emergencyMaximumDrawAgeMs : maximumDrawAgeMs);
        consecutiveSkips = skip ? consecutiveSkips + 1 : 0;
        if (skip) skippedDraws++;
        return skip;
      },
      observe(now, workMs, renderMs, drawn) {
        if (!enabled || !drawn || !Number.isFinite(now) ||
          !Number.isFinite(workMs) || workMs < 0 ||
          !Number.isFinite(renderMs) || renderMs < 0) return;
        // Skipped callbacks never count as artificially cheap drawings.
        const weight = 0.25;
        drawWork = drawWork === null ? workMs : drawWork * (1 - weight) + workMs * weight;
        renderWork = renderWork === null ? renderMs : renderWork * (1 - weight) + renderMs * weight;
        drawnSamples++;
        lastDrawAt = now;
        consecutiveSkips = 0;
        if (emergency) {
          // Require several healthy *actual draw probes* before unfreezing
          // gameplay. Skipped draws cannot falsely satisfy recovery.
          healthyDraws = lastIntervalMs < 110 && workMs < 90 && renderMs < 70
            ? healthyDraws + 1 : 0;
          if (healthyDraws >= 3) {
            emergency = false;
            criticalIntervals = 0;
            criticalDraws = 0;
            healthyDraws = 0;
          }
        } else {
          criticalDraws = renderMs >= 140 || workMs >= 190 ? criticalDraws + 1 : 0;
          if (criticalDraws >= 2) engageEmergency();
        }
      },
      suspend,
      status() {
        return {
          enabled, skippedDraws, drawnSamples, emergencyActive: emergency,
          emergencyEntries, protectedCallbacks,
          estimatedDrawWorkMs: drawWork === null ? null : Math.round(drawWork * 100) / 100,
          estimatedRenderWorkMs: renderWork === null ? null : Math.round(renderWork * 100) / 100,
        };
      },
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
  // Bounded diagnostic timings; AI is nested within the total simulation cost.
  function createFrameProfile() {
    const keys = ['frameWorkMs', 'intervalMs', 'simulationMs', 'companionAIMs', 'enemyAIMs',
      'otherSimulationMs', 'hudMs', 'audioUpdateMs', 'eventDispatchMs', 'renderMs', 'otherJsMs'];
    const rendererStages = [
      ['pixiMs', 'pixiAttempted'],
      ['canvasOverlayMs', 'canvasOverlayDrawn'],
      ['canvasWorldMs', 'canvasWorldDrawn'],
    ];
    let samples = [];
    function summary(values) {
      if (!values.length) return { samples: 0, meanMs: 0, p95Ms: 0 };
      const sorted = values.slice().sort((a, b) => a - b),
        round = n => Math.round(n * 100) / 100;
      return { samples: values.length,
        meanMs: round(values.reduce((a, b) => a + b, 0) / values.length),
        p95Ms: round(sorted[Math.floor((sorted.length - 1) * 0.95)]) };
    }
    function report() {
      const stages = {};
      for (const key of keys)
        stages[key] = summary(samples.filter(s => key !== 'renderMs' || s.drawn).map(s => s[key]));
      // Subsets are independently sampled only on world draws that actually
      // used the named surface. Never dilute a Pixi mean with Canvas-only frames.
      for (const [key, flag] of rendererStages)
        stages[key] = summary(samples.filter(s => s.drawn && s[flag]).map(s => s[key]));
      const durationMs = samples.slice(1).reduce((total, sample) => total + sample.intervalMs, 0);
      const activeFrames = samples.length;
      const drawnFrames = samples.filter(s => s.drawn).length;
      const actualDraws = samples.slice(1).filter(s => s.drawn).length;
      const rate = count => durationMs > 0
        ? Math.round(count * 10000 / durationMs) / 10 : 0;
      return {
        activeFrames, drawnFrames,
        adaptiveSkippedDraws: samples.filter(s => s.adaptiveSkipped).length,
        callbackFps: rate(Math.max(0, activeFrames - 1)),
        displayedFps: rate(actualDraws),
        stages,
        note: 'Callback FPS counts game-update opportunities; displayed FPS counts issued world draws, not monitor-presented frames. RenderMs is the combined synchronous world draw call. Pixi/Canvas stages measure synchronous CPU call time only (not GPU completion); their sample counts are per active surface, and separate p95 values cannot be added. AI is included in simulation.'
      };
    }
    return {
      record(row) {
        if (!row || !Number.isFinite(row.frameWorkMs) || row.frameWorkMs < 0) return;
        const sample = { drawn: !!row.drawn, adaptiveSkipped: !!row.adaptiveSkipped };
        for (const key of keys) sample[key] = Number.isFinite(row[key]) ? Math.max(0, row[key]) : 0;
        for (const [key, flag] of rendererStages) {
          sample[flag] = sample.drawn && row[flag] === true;
          sample[key] = sample[flag] && Number.isFinite(row[key])
            ? Math.max(0, row[key]) : 0;
        }
        samples.push(sample);
        if (samples.length > 180) samples.shift();
      },
      reset() { samples = []; },
      report,
      describe() {
        const r = report();
        if (!r.activeFrames) return 'Frame stages: no active gameplay sampled.';
        const print = (label, key) => label + ': ' + r.stages[key].meanMs + ' / ' + r.stages[key].p95Ms + ' ms';
        const rendererLines = [
          ['  Pixi world', 'pixiMs'],
          ['  Canvas combat overlay', 'canvasOverlayMs'],
          ['  Canvas full world', 'canvasWorldMs'],
        ].filter(([, key]) => r.stages[key].samples)
          .map(([label, key]) => print(label, key) + ' (' + r.stages[key].samples + ' draws)');
        return 'Game updates ' + r.callbackFps + '/s · issued world draws ' + r.displayedFps +
          '/s · adaptive skips ' + r.adaptiveSkippedDraws + '\n' +
          'Frame stages · mean / p95 (' + r.activeFrames + ' active, ' + r.drawnFrames + ' drawn)\n' +
          [print('Simulation total', 'simulationMs'), print('  Companion AI', 'companionAIMs'),
            print('  Enemy AI', 'enemyAIMs'), print('  Other simulation', 'otherSimulationMs'),
            print('Audio update', 'audioUpdateMs'), print('Event dispatch + audio effects', 'eventDispatchMs'),
            print('HUD', 'hudMs'), print('Combined world draw', 'renderMs'),
            ...rendererLines, print('Other frame JS', 'otherJsMs')].join('\n') +
          '\nAI is a subset of simulation. Renderer figures are synchronous CPU timings, not GPU/presented FPS. Sample in active play, not the menu.';
      },
    };
  }
  const api = {
    createFrameProfile,
    create,
    createFrameRate,
    fpsPreferenceKey,
    createFrameSkip,
    frameSkipPreferenceKey,
    createResolution,
    resolutionPreferenceKey,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeRuntime = api;
})(typeof window !== 'undefined' ? window : globalThis);
