# Background return-to-title and guarded Continue

**Game:** *So I Became the Dark Lord's Problem*  
**Scope:** browser/PWA visibility lifecycle, existing save ownership, title screen and renderer recovery.  
**Source of change:** owner's Chromebook reproduction, 28 October 2026, version `0.9.1+snapshot.dev.213`.

## Observation and cause

The player stress-tested Flooded Marches with the experimental PixiJS WebGL2 renderer, minimized the browser to share a report, and experienced severe slowdown on returning. The post-return report records `webglcontextlost` ("WebGL context lost"), one successful renderer recovery, 1,426 discarded procedural textures, 1,789 cumulative procedural bakes, three emergency performance entries and fallback/recovery activity. Ordinary procedural cache-budget evictions remained zero. These facts support GPU-context loss and texture reconstruction rather than proving a browser disk-cache flush. The diagnostics cannot prove the exact browser event that caused the context loss or the duration of the user-visible slowdown.

GPU textures are not equivalent to browser/offline cached source files. A lost WebGL context invalidates GPU allocations; the renderer may need to rebuild or reupload artwork, even when downloaded assets survive.

## Player contract

1. While a campaign is active, browser `visibilitychange` to `hidden` saves the current campaign through the existing writer and persistence guards and returns the **live session** to the bilingual main/title screen. The hero, companions, zone, combat progress and settings are not reset.
2. The title screen stays visible when the browser returns to the foreground. No gameplay, combat, movement, cooldowns, simulation clock or automatic renderer recovery runs while it is inactive.
3. **Continue Adventure / Continuar aventura** is the explicit re-entry gate. It uses the existing readiness flow to warm sprite assets, validate or prepare graphics for the actual loaded destination, draw the first frame and only then resume simulation.
4. A surviving GPU context and usable texture caches should be reused. Do **not** destroy or eagerly invalidate a healthy renderer because the browser was minimized.
5. If WebGL failed, use the existing Canvas safety renderer while restoration is prepared. A previously confirmed WebGL selection can be restored from the title loading screen after an in-session failure, even if the browser originally launched with Canvas; startup quarantine and repeated-failure holds must continue to protect the player.
6. Visibility loss while Continue is already preparing cancels that activation. Reopening must never auto-start the game through a stale asynchronous callback; the player selects Continue again.
7. A transient `blur` without document visibility loss retains the existing in-place pause behavior. Ordinary page restore from BFCache still reloads to recover save ownership; a cold/reloaded page already starts at title.
8. If campaign saving fails during hide, preserve the live game in a paused state and show the save-failure warning rather than abandoning unsaved progress or falsely presenting a saved campaign.

## Implementation

- `src/prototype/app.js`: after a successful hidden-session save, invoke the existing `showTitleScreen` transition. It cancels transient input, menus and pending scene transitions and sets `started=false`. `warmScene` already returns without work for hidden documents, so the actual warmup is deferred to Continue. Existing Pixi resources are left intact.
- On a hidden event during title loading, invalidate the old Continue epoch and resolve its skip gate so its completion cannot activate after foregrounding.
- In the existing Continue renderer-restoration condition, permit a pending **in-session** confirmed-WebGL recovery in addition to the original confirmed-startup branch. Do not bypass a quarantined startup or repeated-failure hold.
- No changes to campaign serialization format, gameplay AI, physics, cache budgets, frame-rate target, graphics backend, graphics settings or automatic emergency policy.

## Verification and acceptance

Automated regression cases cover English/Spanish title states; cold launch; successful save and exact in-memory campaign retention; a blur without hiding; minimizing with an open menu; inactive hidden/foreground frame callbacks; repeated hidden events; ready-frame gating; interrupted Continue; and explicit resumed Continue. Existing title, save ownership/persistence, renderer-guard and Pixi recovery suites should remain green.

**Merge gate:** review the actual PR diff, pass all required GitHub Actions checks and ensure no save/renderer lifecycle regressions. **Device acceptance remains separate:** on the Chromebook and representative phone/PWA, compare warm minimize/return with and without actual WebGL context loss. Verify that a surviving context remains warm, lost GPU artwork is rebuilt behind Continue, the Canvas fallback remains accessible, the campaign save/companions remain intact, and frame-time spikes do not appear during resumed combat. Record screenshots and measurements before calling this *device-verified*. CI success alone does not establish hardware performance.

## Known limitations

The browser can suspend/kill the page before a `visibilitychange` handler completes; the existing autosave and cold-boot recovery remain necessary. GPU context loss may occur after the title has reappeared; the existing renderer error/fallback path still applies. Nothing can guarantee that every driver-side GPU stall is measurable from JavaScript, and no claim is made that minimizing always destroys a cache.

## 28 October 2026 follow-up — crash-recovered Continue identity (draft PR #581)

A matching unclean-session recovery marker lets `recoverLoadedSession()` replace the validated in-memory Campaign with a new `Campaign.restore(snapshot)` clone, relocated to a barracks or regional refuge. The title loader previously retained its pre-recovery Campaign identity and silently rejected the newly recovered one in `showReadyFrame()`. That early return left `titleLoading` true, all title actions disabled and the text at **"Drawing first scene…"** even though the original save loaded.

The proposed fix refreshes only the local Campaign reference after successful synchronous recovery. Earlier asynchronous preparation still checks its original identity; subsequent scene warmup uses the actual recovered zone. This is a lifecycle repair, **not a save migration, save format update, Pixi/Canvas optimization or automatic crash-recovery bypass**.

A bilingual synthetic-v4 test supplies a matching `azeroth-active-play-recovery-v1` marker, verifies that recovery really changes the object, and checks that Continue exposes gameplay after the ready frame. The real player's exported save does **not** include the browser-local marker, so source evidence alone cannot confirm that marker was present at the time of the freeze. No personal save contents are stored in this PR.

**Status:** Draft branch pending exact-head CI and owner device acceptance. Do not claim merged, published, or physically verified until those separate checks pass.

## Import Save confirmation on the title screen (follow-up)

Import Save opens the browser's native JSON file picker. After the user selects a valid file, the import performs validation and guarded replacement, resets the unclean-session marker, and intentionally returns to the title screen rather than starting simulation immediately. This protects the loaded campaign behind an explicit **Continue Adventure** action. Previously the only success notice was written to the gameplay HUD, hidden by the title overlay, making a successful import look like a no-op.

The original import action only called JavaScript `.click()` on a permanently hidden file input *outside* the modal. On the owner's Chromebook the file chooser did not appear at all, so import could never begin. The menu now places that very same `<input type="file">` directly inside a visible, labeled full-width action, with the native input itself handling trusted pointer and keyboard selection. It is moved back to the document before rebuilding a menu so its event handler is not lost. All three import entry points use this direct control. Nothing in the change edits the uploaded campaign.

The title screen also exposes a visible bilingual live-region confirmation instructing **Continue Adventure** after file selection succeeds; a failed import instead displays a readable error inside the current dialog and leaves the existing save untouched. Cancelling the native picker without selecting a file leaves the dialog unchanged. Regression tests check native input inclusion, bilingual confirmation and the manual Continue handoff. A separate local headless-Chromium file-chooser experiment confirmed the overlaid input receives a real file chooser event; that is **not** equivalent to verifying behavior in the owner's installed Chromebook PWA.


## 5 November 2026 — proposed short-hidden classification (draft, not released)

**New evidence:** The dev.256 phone report after an unwanted return to title contained only a short post-transition performance window. No event trace from the preceding document existed, so the specific interruption is **not proven** to be a visibility event, a full page reload, a GPU-context failure or an iOS browser-process restart. Main's `visibilitychange` handler, however, confirms that *any* successful save while `document.hidden` immediately forces a title transition—even a brief hidden/visible flip. Opt-in diagnostic continuity from merged/published PR #802 now retains lifecycle events across menu boundaries and document restarts.

**Revised bounded implementation candidate:** Preserve the essential October 28 guarantees (save immediately, stop input/audio and campaign simulation while hidden, cancel an in-flight Continue, never abandon an unsaved run, retain healthy GPU resources). During **active gameplay only**, defer the decision to show title until the browser reports visible again. A visibility interruption shorter than **2.5 seconds** may resume the same in-memory scene, respecting an existing manual pause/menu, provided the save writer remains valid and no renderer recovery is pending. A sustained hidden interval or a renderer reported as preparing/recovering still routes to the existing safe title/Continue warmup; the player explicitly chooses Continue before combat. A failed save or lost writer ownership stays paused with a warning and is never silently discarded. This classification uses elapsed wall and monotonic time after foregrounding, **not unreliable background timers**. A BFCache restore retains the separate reload/ownership rule.

**Diagnostic distinction:** Each JavaScript document gets a temporary, nonpersonal `documentId` in its bounded journal and JSON export, plus navigation type if the browser provides one. Same-document `return-to-title` events identify an in-place title transition. A new `document-start`/different ID identifies a reload or newly created browser document, **not necessarily** a killed browser process; `service-worker-controller-change`, `pagehide` and `back-forward-cache-restore` are supporting clues, not conclusive cause. A visibility flip alone does not establish GPU context loss.

**Candidate verification gates:** Extend the original EN/ES title and renderer-report regressions for brief hidden/visible flips, sustained intervals, repeated hidden events, save/no-tick safety, interrupted Continue, recovered segments and known graphics-recovery fallback. Run focused reproducible build and owning tests. iPhone Home Screen/Safari and actual WebGL context-loss recovery remain **device-unverified**, and no causal claim about the owner's earlier incident is made. **Status: draft source/test candidate only; not merged, published or iPhone-verified.**
