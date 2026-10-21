# Cooldown queue forms — dev.139

Owner requested practical tap versus charged selection, forgiving hold recognition and clear stored-form feedback. Later steering preserves the original small colored numbers and simplifies to tap/hold only, to avoid ambiguous extra gestures. This supersedes dev.126's all-charged cooldown input; it extends the existing queue, not a second scheduler.

## Player behavior

- Tap a cooling skill to store one **normal** cast.
- Hold a cooling skill for at least 0.25 active seconds to select **charged**. Releasing at any later time, including the familiar full 0.65-second hold, retains the charged request. No exact release time is required. Repeated taps never select charged, add duplicate casts, downgrade a charged request or restart preparation.
- Normal casts fire after cooldown/retry recovery and contact release, without charge preparation or an extra second-tap recognition delay. A contact still held at cooldown expiry waits until its form is known: release before 0.25s means normal; crossing 0.25s means charged. The form is visibly updated at recognition.
- Charged casts still prepare for 0.65 seconds **after** cooldown/retry recovery and then release once automatically. The brief input selects the form; it does not preload or skip preparation/interruption. Ready skills keep their existing under-0.2-second normal tap / full-0.65-second manual charge-and-release behavior.
- Every skill retains its independent request. Eligible requests proceed in insertion order among those ready; a longer unrelated cooldown does not block others. Actual preparation is sequential. A ready manual skill can temporarily take over without deleting other requests.
- Button labels explicitly show NORMAL / CHARGED and QUEUED plus cooldown, or charged preparation percentage. Spanish uses NORMAL / CARGADA and COLA. The original number-only markers keep their size and spacing: light blue (#9dc6dd) means normal and gold (#f6d77a) means charged; ready fill and preparation cues remain. No N/C suffixes. Button wording also identifies the form without depending on color perception. Tooltips, accessible button labels and Controls explain the forms. No new rendering surfaces.
- Automatic normal and charged casts validate current, form-specific reach/line of sight and cannot create a chase. Normal/charged effects and cooldowns remain authoritative in hero combat. Normal support skills retain their existing recipient/refusal rules.
- Recall, menus, pause/focus clearing, hero/zone/campaign lifecycle and genuine contact cancellation clear requests. Natural pointer-up/capture loss preserves the completed request. Different pointer identities cannot release someone else's hold. Requests and gesture timestamps remain transient, with no saved campaign changes.

## Ranger companion Heal

The owner subsequently added one-tap queuing for the companion's Heal. The existing Heal button, H shortcut and applicable world mouse command call the same request method. If no unsilenced ready Ranger can heal and an active living Ranger is cooling down, one transient hero-directed request is retained. The button remains actionable during cooldown and shows QUEUED/COLA with its remaining time. Repeated taps never add requests or change the recipient.

The first eligible Ranger resolves it before automatic ally triage, using the existing heal amount, five-second effect and that caster's ten-second cooldown. A ready normal Heal retains its existing hero-priority/ally fallback behavior. A **queued** request only heals the hero: full health or existing Heal coverage at readiness clears it without another paid cooldown. Silence/held casters cannot release early; another ready valid Ranger may satisfy the request. With no active living Ranger, the pending request clears. Recall, shell input clearing/menus, real hero defeat, zone/hero changes, challenge transitions and reload cannot preserve a ghost request.

`party.js` owns the transient WeakMap and resolution at the start of existing automatic support, after real cooldown recovery; no new timer loop, saved fields or parallel healing system. `app.js` owns existing control routing and queued feedback. `tests/ranger-heal-queue.test.cjs` covers real-tick expiry across all three hero classes, explicit hero priority, duplicates, ready casts, absence/fallen/reserve casters, Silence, multiple Rangers, healthy/covered hero, Recall/death/zone/challenge and snapshot/reload. The original Ranger support-feedback suite also passes. Actual Heal button/key routing, preservation of independent hero requests, cancellation and bilingual queue feedback are included in the 63-case browser evidence.

## Ownership and verification

`app.js` owns gesture classification and existing queue dispatch; thresholds are in `rules.chargedSkills.queueInput`. `hero-presentation.js` retains number-only markers with form colors and the shared CSS fits feedback in the existing buttons. No engine, encounter, enemy AI, world, saved progression, damage, authored art or underlying skill timing changes.

Focused real-shell coverage: `tests/skill-queue-forms-browser.test.cjs`, evidence/captures in `tools/visual-review/skill-queue-dev139/`. Covers all eight slots and both forms, all three classes' tap/brief-hold/full-hold, near-expiry recognition, threshold boundaries, repeated-tap non-upgrade, long-frame hold recognition, genuine touch, mouse and keyboard events, independent mixed requests, repeated input, wrong/cancelled contact, Recall/menu/retreat, nonlethal charge interruption, real same-hero defeat/recovery, death/zone/reload, English/Spanish phone feedback and desktop sublabel fit. All 63 focused cases pass with no page errors. Existing charge-interruption, 54 charged-opener scenarios and cooldown-only behavior suites are reused/passed separately. No broad CI, repeated full-game/device suites or actual-device FPS claims.

## Delivery state

Prepared from published main `7d9d89ed19e3bcedda2893b8726a7a99088a156c`. Implementation checkpoint `dd96a19df94cf7d9380bd025735eb0252615c635` is preserved on `fix/skill-queue-forms-dev139` with an exact local/remote Git tree match. Final gesture/UI review, generated/syntax/build consistency and locked changed-source formatting pass.

Package-only publication is next under the owner's established phone-play workflow. Broad CI/full-game/device suites remain deferred. Restore normal `pages.yml` byte-for-byte and remove the temporary publisher after verified publication.
