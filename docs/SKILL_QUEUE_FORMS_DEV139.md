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

## Ownership and verification

`app.js` owns gesture classification and existing queue dispatch; thresholds are in `rules.chargedSkills.queueInput`. `hero-presentation.js` adds form letters to existing markers and the shared CSS fits feedback in the existing buttons. No engine, encounter, enemy AI, world, saved progression, damage, authored art or skill timing changes.

Focused real-shell coverage: `tests/skill-queue-forms-browser.test.cjs`, evidence/captures in `tools/visual-review/skill-queue-dev139/`. Covers all eight slots and both forms, all three classes' tap/brief-hold/full-hold, near-expiry recognition, threshold boundaries, repeated-tap non-upgrade, long-frame hold recognition, genuine touch, mouse and keyboard events, independent mixed requests, repeated input, wrong/cancelled contact, Recall/menu/retreat, nonlethal charge interruption, real same-hero defeat/recovery, death/zone/reload, English/Spanish phone feedback and desktop sublabel fit. All 59 focused cases pass with no page errors. Existing charge-interruption, 54 charged-opener scenarios and cooldown-only behavior suites are reused/passed separately. No broad CI, repeated full-game/device suites or actual-device FPS claims.

## Delivery state

Prepared locally on `fix/skill-queue-forms-dev139` from published main `7d9d89ed19e3bcedda2893b8726a7a99088a156c`. Generated/syntax/build consistency and locked changed-source formatting pass. Normal workflow bytes are retained; no temporary publisher remains in the final candidate. No broad GitHub CI ran.

The initial checkpoint push was rejected by automatic approval review: it cited insufficient publication authorization, an unverified remote and an outstanding validation failure. No remote write is claimed. The local UI-fit check was corrected to measure the changed sublabels (the baseline HASTE title is separate), the input design was simplified per subsequent owner steering, and final checks pass. Remote checkpoint, PR and publication remain pending; inspect remote state before any retry.
