# Rogue first real phone playtest — 28 October 2026

**Baseline:** `0.9.1+snapshot.dev.206` (owner's attached `Azeroth_Playtest_Report.json`; full personal report remains in the conversation, not uploaded to GitHub). **Only Greenwood Vale field combat** was tested; no boss acceptance.

## Verified owner findings

- Rogue playable and Charm working. Report confirms level-2 Rogue, three Charmed goblin/goblin-slinger companions and real `rogueBellBasic` / `rogueBellSkill1` releases. The owner could not perceive auto and manual Skill 1 normal/charged feedback; later songs were not tested.
- Source confirms the visual/foley gap: `hero-presentation.js` and `audio-hero.js` had no Rogue event ownership. `audioCue: 'bell-jingle'` was metadata only, not an audible bell. The report's audio was running and unmuted (effects setting 0.7), with no decoded-asset error.
- Phone Safari / Canvas2D, Auto FPS target 20, Optimization mode on. Reported FPS **15** (distinct callback FPS 53.5 and issued draw FPS 18.5). Frame work p95 **28 ms**, p99 **187 ms**. Emergency detector entered **twice** at callback intervals **227 ms** and **205 ms**, then recovered (31/34 ms).
- Sampled draw work mean **3.37 ms**, render p95 **5 ms**, simulation mean **6.87 ms**, companion AI mean **4.41 ms** (already included within simulation). These counters **do not prove** companion AI caused the long-tail slowdown; callback stall and synchronous work are not interchangeable. Optional crowd/effect recording was off. Zero transient effects at export is an instantaneous snapshot, not history.

## Narrow candidate staged in this draft (not yet published)

- Consume **only actual Rogue release events** through the existing bounded hero-presentation and audio owners: bell cast and landed-contact art for auto basics; target-centered bounded rings for normal/charged Skill 1 and higher-song releases; brief synthesized bell tones. Charged and auto-combo finisher are distinguishable; existing Mute/effects level, voice cap and audio throttling respected. No per-hit, frame-loop or permanent-station sounds; no invented projectile or Charm effect.
- No changes to gameplay, boss logic, saves, class balance, existing classes, Canvas/Pixi selection or PWA identity. Increment version/cache together to draft dev.207; **do not bump to 0.9.2**.
- Focused regression from real event shapes and reproducible offline-ready build required. Do not merge/deploy without a fresh owner release decision.

## Separate performance investigation

Retest on comparable iPhone in Greenwood Vale with the same Auto/Optimization conditions, checking callback gaps vs work-time spikes, companion AI/navigation/crowd and lifecycle. Investigate one reproducible cause before changing simulation or renderer. Do not disable emergency protection, guess the cause from aggregate averages or reopen optional Pixi/Canvas cache projects. Physical phone/WebKit matrix requires separate authorization.

**Acceptance record:** Rogue and Charm passed first field-play test. Basic/Skill 1 feedback blocked functional clarity; performance under combat remains unresolved. Boss/other-region, higher songs and save/recovery acceptance not yet established.
