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

The title screen now exposes a visible bilingual live-region confirmation instructing **Continue Adventure**; a failed import instead displays a readable error inside the current dialog and leaves the existing save untouched. Cancelling the native picker without selecting a file leaves the dialog unchanged. The launch/restore tests verify native input invocation, bilingual confirmation, and manual Continue handoff. Actual browser file-picker behavior still requires device verification.
