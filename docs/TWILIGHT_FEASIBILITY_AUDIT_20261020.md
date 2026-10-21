# Sunrise, sunset and Nightmare framing — feasibility audit

Review only, against published dev.120 source. No runtime edits, release, broad test suites or new artwork. The owner will assess this proposal before implementation.

## Verdict

Feasible as a contained, moderate update using existing engine/rules, save, renderer/visuals and audio owners. Ordinary twilight is presentation; the Nightmare opener intentionally changes when nighttime gameplay begins. Performance and final appearance still require focused native review after implementation.

## Verified current behavior

Read clock, constructor, night multipliers/tempo, engagement/update, night spawns, save validation/restore, actual peaceful ending, Rest/credits, renderer/atmosphere and audio selection paths.

Controlled probes of unchanged source:
- Normal: clock 330 and 359.999 use day rules; 360, 570 and 599.999 use night rules. Zero-victory night multipliers are 1.10 HP / 1.15 damage and 1.10 tempo.
- Nightmare: constructor clock is zero, clock remains zero after an active tick, and night is forced regardless of clock. An existing Nightmare save restores at clock zero with night active. Therefore clock alone cannot distinguish a legacy run from a new opening.
- Active Normal fight: engagement at clock 359.95 locks HP/damage at day values. After a tick to 360.05, night and 1.10 tempo activate but that enemy retains 1.00 HP/damage factors. This is existing encounter behavior, not a newly introduced defect.
- Actual Nightmare peace: checkEnding requires TRUE Dark Lord, throne claimed and all five TRUE dungeon guardians. It immediately removes hostile populations/hazards and sets clock 360. Night bonuses/tempo become 1.00 under peace even though visual night remains true. Rest/credits occur later.

## Proposed implementation contract

1. Keep Normal gameplay boundaries and durations. Derive sunset from clock 330–360, sunrise from 570–600. Interpolate continuous darkness and distinct amber/copper versus rose/gold grades; reach the adjacent endpoint without a brightness jump.
2. Use separate visual-phase/intensity data rather than overloading the Boolean gameplay night flag. Fade existing lamps, glow, regional tints and motes together. Keep interiors' authored lighting and essential combat contrast. Reuse existing bounded gradients/light pools, including Optimization Mode.
3. Give newly created Nightmare campaigns a saved 30-second opening countdown. Day gameplay is active until it reaches zero, then permanent night. Legacy saves default to completed, never to 30. Save/resume preserves remaining time; travel, ordinary death, Succession and reload must not restart it. Validate optional timer fields explicitly within v4 compatibility.
4. At the Nightmare intro boundary, refresh ordinary day-scaled ongoing enemies once while preserving HP fraction, damage-source rules, authored/elite exceptions, targets, telegraphs and encounter state. No healing/reset. Keep ordinary Normal encounter-lock behavior unchanged. Existing night-spawn logic and dynamic tempo can then follow night normally.
5. Trigger the one-time 30-second victory dawn at actual peace, not an earlier Dark Lord defeat. Peace/rewards apply immediately. Persist its progress and prevent old completed saves or later peaceful cycles from replaying the special victory effect. Ordinary peaceful day/night cycling can resume afterward unless the owner selects lasting daylight.
6. Drive progress from active simulation time so pause, hidden tabs and menus do not consume either sequence. Existing loading/creation UI must not spend the opening before the player can play. The victory sunrise is visible in the world before final Rest/credits; immediate Rest must not silently consume its progress behind a frozen menu.
7. Existing music/director/finale paths can be retained. Audio may follow the existing gameplay boundaries/peace cue with existing fades; no soundtrack rewrite is required for this feature.

## Recommendations for owner assessment

- Refresh ongoing enemy scaling once at the Nightmare intro boundary; otherwise an early encounter could remain at day strength after the promised grace period.
- Begin the victory dawn when peace is earned, before final Rest/credits, so the player can watch it in the world. Resume the existing peaceful cycle afterward unless a permanent-day ending is specifically desired.

## Focused checks needed after implementation

Exact Normal phase endpoints; Nightmare 29.999/30-second gameplay boundary; engaged/idle enemy scaling and night spawns; new/legacy/partial-intro/partial-victory saves; pause/menu/background/travel/death/Succession; full ending versus earlier boss victories; regional/interior/Optimization Mode lighting continuity; one desktop and phone startup/render smoke. No broad balance matrix is justified by this audit.
