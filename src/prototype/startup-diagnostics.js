/* Bounded, device-local startup evidence. Never owns campaign or recovery policy. */
(function (root) {
  'use strict';
  const KEY = 'sibdlp-startup-history-v1';
  const MAX_ATTEMPTS = 3,
    MAX_EVENTS = 48,
    MAX_BYTES = 32768,
    MAX_AGE = 7 * 86400000;
  const stages = new Set([
    'document-open',
    'dom-ready',
    'window-loaded',
    'asset-error',
    'page-error',
    'unhandled-rejection',
    'app-entered',
    'canvas-context-start',
    'canvas-context-ready',
    'save-load-start',
    'save-load-finished',
    'ownership-start',
    'ownership-settled',
    'update-check-start',
    'update-gate-finished',
    'update-reload-requested',
    'title-shown',
    'entry-requested',
    'sprites-start',
    'sprites-settled',
    'save-recovery-start',
    'save-recovery-finished',
    'graphics-choice',
    'graphics-state',
    'gpu-start',
    'gpu-settled',
    'scene-draw-start',
    'scene-draw-completed',
    'scene-draw-failed',
    'arrival-start',
    'arrival-settled',
    'audio-start',
    'audio-settled',
    'scene-revealed',
    'controls-ready',
    'first-live-draw',
    'first-movement-observed',
    'map-opened',
    'document-hidden',
    'document-visible',
    'pagehide',
    'bfcache-return',
    'background-return-classified',
    'entry-interrupted',
  ]);
  const code = (value) =>
    typeof value === 'string' && /^[a-zA-Z0-9._:+-]{1,80}$/.test(value) ? value : null;
  function details(input = {}) {
    const out = {};
    for (const key of [
      'reason',
      'renderer',
      'preferredRenderer',
      'phase',
      'hold',
      'zone',
      'entry',
      'decision',
      'navigationType',
      'failureType',
      'failureStage',
      'version',
      'asset',
    ]) {
      const value = code(input[key]);
      if (value) out[key] = value;
    }
    for (const key of [
      'line',
      'column',
      'viewportWidth',
      'viewportHeight',
      'backingWidth',
      'backingHeight',
      'recoveryAttempts',
    ])
      if (Number.isFinite(input[key]))
        out[key] = Math.max(0, Math.min(100000000, Math.round(input[key])));
    if (typeof input.failureMessage === 'string')
      out.failureMessage = input.failureMessage
        .replace(/https?:\/\/\S+/g, '[url]')
        .replace(/[^\x20-\x7e]/g, '?')
        .slice(0, 160);
    if (typeof input.buildCommit === 'string' && /^[a-f0-9]{40}$/.test(input.buildCommit))
      out.buildCommit = input.buildCommit;
    for (const key of [
      'hidden',
      'persisted',
      'wasDiscarded',
      'loaded',
      'canWrite',
      'recoveryPaused',
      'recoveryPending',
      'skipped',
      'ready',
    ])
      if (typeof input[key] === 'boolean') out[key] = input[key];
    if (Number.isFinite(input.hiddenDurationMs))
      out.hiddenDurationMs = Math.max(0, Math.round(input.hiddenDurationMs));
    return out;
  }
  function create({
    storage = null,
    now = () => Date.now(),
    clock = () => performance.now(),
    documentInfo = {},
  } = {}) {
    let available = true,
      lastWriteSucceeded = false,
      droppedAttempts = 0,
      updatedAt = now();
    let attempts = [],
      current,
      origin = clock(),
      movementPending = false,
      liveDrawPending = false;
    let identity = { version: null, buildCommit: null };
    try {
      const raw = storage?.getItem(KEY);
      if (raw && raw.length <= MAX_BYTES) {
        const data = JSON.parse(raw);
        if (
          data?.version === 1 &&
          Number.isFinite(data.updatedAt) &&
          now() - data.updatedAt <= MAX_AGE &&
          data.updatedAt <= now() + 60000 &&
          Array.isArray(data.attempts)
        ) {
          droppedAttempts =
            Number.isSafeInteger(data.droppedAttempts) && data.droppedAttempts >= 0
              ? data.droppedAttempts
              : 0;
          for (const old of data.attempts.slice(-MAX_ATTEMPTS)) {
            if (!Number.isFinite(old.startedAt) || !Array.isArray(old.events)) continue;
            const events = old.events
              .filter((e) => stages.has(e?.stage) && Number.isFinite(e.elapsedMs))
              .slice(-MAX_EVENTS)
              .map((e) => ({ stage: e.stage, elapsedMs: Math.max(0, e.elapsedMs), ...details(e) }));
            attempts.push({
              kind: code(old.kind) || 'unknown',
              startedAt: old.startedAt,
              build: {
                version: code(old.build?.version),
                buildCommit: details(old.build).buildCommit || null,
              },
              outcome: ['ready', 'failed', 'interrupted'].includes(old.outcome)
                ? old.outcome
                : 'interrupted',
              interruption:
                old.outcome === 'preparing'
                  ? 'previous-document-ended-before-ready'
                  : code(old.interruption),
              droppedEvents:
                Number.isSafeInteger(old.droppedEvents) && old.droppedEvents >= 0
                  ? old.droppedEvents
                  : 0,
              firstFailure:
                old.firstFailure && stages.has(old.firstFailure.stage)
                  ? {
                      stage: old.firstFailure.stage,
                      elapsedMs: Number.isFinite(old.firstFailure.elapsedMs)
                        ? old.firstFailure.elapsedMs
                        : 0,
                      ...details(old.firstFailure),
                    }
                  : null,
              events,
            });
          }
        }
      }
    } catch (_) {
      available = false;
    }
    const envelope = () => ({ version: 1, updatedAt, droppedAttempts, attempts });
    function persist() {
      updatedAt = now();
      try {
        let bytes = JSON.stringify(envelope());
        while (bytes.length > MAX_BYTES && attempts.length > 1) {
          attempts.shift();
          droppedAttempts++;
          bytes = JSON.stringify(envelope());
        }
        while (bytes.length > MAX_BYTES && current.events.length > 8) {
          current.events.splice(8, 1);
          current.droppedEvents++;
          bytes = JSON.stringify(envelope());
        }
        if (!storage?.setItem || bytes.length > MAX_BYTES) throw Error('unavailable');
        storage.setItem(KEY, bytes);
        available = true;
        lastWriteSucceeded = true;
      } catch (_) {
        available = false;
        lastWriteSucceeded = false;
      }
    }
    function record(stage, input = {}) {
      if (!stages.has(stage)) return false;
      const clean = details(input);
      if (stage === 'app-entered') {
        identity = { version: clean.version || null, buildCommit: clean.buildCommit || null };
        current.build = { ...identity };
      }
      const previous = current.events.at(-1);
      if (previous?.stage === stage && JSON.stringify(details(previous)) === JSON.stringify(clean))
        return false;
      const event = { stage, elapsedMs: Math.max(0, Math.round(clock() - origin)), ...clean };
      if (
        ['asset-error', 'page-error', 'unhandled-rejection', 'scene-draw-failed'].includes(stage) ||
        clean.failureType
      ) {
        if (!current.firstFailure) current.firstFailure = { ...event };
        if (current.outcome !== 'ready') current.outcome = 'failed';
      }
      current.events.push(event);
      if (current.events.length > MAX_EVENTS) {
        current.events.splice(8, 1);
        current.droppedEvents++;
      }
      if (stage === 'scene-revealed') current.outcome = 'ready';
      if (stage === 'controls-ready') {
        movementPending = true;
        liveDrawPending = true;
      }
      if (stage === 'first-live-draw') liveDrawPending = false;
      if (stage === 'first-movement-observed') movementPending = false;
      persist();
      return true;
    }
    function begin(kind) {
      current = {
        kind: code(kind) || 'unknown',
        startedAt: now(),
        outcome: 'preparing',
        build: { ...identity },
        interruption: null,
        droppedEvents: 0,
        firstFailure: null,
        events: [],
      };
      origin = clock();
      movementPending = false;
      liveDrawPending = false;
      attempts.push(current);
      while (attempts.length > MAX_ATTEMPTS) {
        attempts.shift();
        droppedAttempts++;
      }
    }
    function entry(kind) {
      // The first New/Continue remains part of this document's boot, so its
      // early failures and update gate are not detached from the final report.
      if (current.outcome === 'ready' || current.kind === 'continue') begin(kind);
      record('entry-requested', { entry: kind });
    }
    function foreground(kind = 'foreground-return') {
      if (
        ['foreground-return', 'bfcache-return'].includes(current.kind) &&
        current.outcome === 'preparing'
      ) {
        if (kind === 'bfcache-return') {
          current.kind = kind;
          record(kind);
        }
        return;
      }
      begin(kind);
      record(kind === 'bfcache-return' ? kind : 'document-visible');
    }
    function interrupt(reason) {
      if (current.outcome === 'ready') return;
      record('entry-interrupted', { reason });
      if (current.outcome === 'preparing') {
        current.outcome = 'interrupted';
        current.interruption = code(reason);
        persist();
      }
    }
    function report() {
      return JSON.parse(
        JSON.stringify({
          ...envelope(),
          retention: {
            maxAttempts: MAX_ATTEMPTS,
            maxEventsPerAttempt: MAX_EVENTS,
            maxBytes: MAX_BYTES,
          },
          persistence: { available, lastWriteSucceeded },
          note: 'Automatic English-only milestone history, independent of campaign saves and opt-in profiling. Elapsed time includes user waiting and browser suspension, not CPU cost. First live draw records synchronous submission, not compositor/GPU completion. Movement is recorded only after native input changes hero position; no movement is required to finish startup. A hard stop can lose unflushed work; an unfinished prior document is not proof of a crash. No history exists before this recorder script executes.',
        }),
      );
    }
    begin('document-open');
    record('document-open', documentInfo);
    return Object.freeze({
      record,
      entry,
      foreground,
      interrupt,
      report,
      needsMovement: () => movementPending,
      needsLiveDraw: () => liveDrawPending,
    });
  }
  const api = { create, KEY, MAX_ATTEMPTS, MAX_EVENTS, MAX_BYTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = Object.freeze(api);
  else {
    let storage = null;
    try {
      storage = root.localStorage;
    } catch (_) {}
    const journal = create({
      storage,
      clock: () => root.performance.now(),
      documentInfo: {
        navigationType: root.performance.getEntriesByType?.('navigation')?.[0]?.type || 'unknown',
        wasDiscarded: root.document.wasDiscarded === true,
        hidden: !!root.document.hidden,
      },
    });
    root.PrototypeStartupDiagnostics = Object.freeze({ ...api, journal });
    root.document.addEventListener('DOMContentLoaded', () => journal.record('dom-ready'));
    root.addEventListener('load', () => journal.record('window-loaded'));
    root.addEventListener(
      'error',
      (event) => {
        const target = event.target;
        if (target && ['SCRIPT', 'LINK'].includes(target.tagName)) {
          const raw = String(target.src || target.href || '')
            .split(/[?#]/)[0]
            .split('/')
            .pop();
          journal.record('asset-error', { asset: raw });
        } else
          journal.record('page-error', {
            failureType: event.error?.name || 'Error',
            failureMessage: event.message,
            asset: String(event.filename || '')
              .split(/[?#]/)[0]
              .split('/')
              .pop(),
            line: event.lineno,
            column: event.colno,
          });
      },
      true,
    );
    root.addEventListener('unhandledrejection', (event) =>
      journal.record('unhandled-rejection', {
        failureType: event.reason?.name,
        failureMessage: typeof event.reason === 'string' ? event.reason : event.reason?.message,
      }),
    );
    let lastHidden = !!root.document.hidden;
    root.document.addEventListener('visibilitychange', () => {
      if (lastHidden === !!root.document.hidden) return;
      lastHidden = !!root.document.hidden;
      if (root.document.hidden) {
        journal.record('document-hidden');
        journal.interrupt('document-hidden');
      } else journal.foreground();
    });
    root.addEventListener('pagehide', (event) =>
      journal.record('pagehide', { persisted: event?.persisted === true }),
    );
    root.addEventListener('pageshow', (event) => {
      if (event?.persisted) journal.foreground('bfcache-return');
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
