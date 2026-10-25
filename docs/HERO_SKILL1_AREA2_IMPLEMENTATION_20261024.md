# Hero Skill 1 — Area 2 audiovisual and in-game teaching checkpoint

**24 October 2026 · Draft PR #439 · unmerged · not deployed**

Area 2 is the **actual source implementation** of original Skill 1 art, sound, names and in-game explanations for the previously implemented Area 1 mechanics. Working names (no permanent naming decision): **Radiant Cross / Cruz radiante**, **Wide Arcane Beam / Rayo arcano amplio**, **Hawk Interception / Intercepción del halcón**. Existing normal techniques remain **Radiant Strike / Golpe radiante**, **Arcane Beam / Rayo arcano**, **Rapid Arrows / Flechas rápidas**. No Ragnarok or Frieren assets, exact names, copyrighted recordings, or game lore are imported.

## Implementation evidence

- **Simulation receipts first.** `hero-combat.js` emits `heroSkillArea` (Cross first and second pulses, four actual solid-terrain-clipped arms; Mage beam endpoint after terrain clipping), `heroHawk` (launch, bounded per-step flight, contact, expire), and `hawkRetreatInterrupted` on a valid actual retreat. Gameplay remains independent of presentation and audio. Hawk expiration has no hit confirmation.
- **Visual owner.** `hero-presentation.js`, fed by `combat-visuals.js` into `renderer.js` and its combat overlay, draws a bounded four-arm original luminous Cross, a distinctly wide arcane lane, and a directed top-down hunting hawk silhouette with contact/interruption cue. Widths and endpoints use native receipts, not decorative guessed range; Cross arms stop at solid-terrain blockers. Original automatic basics and focused normal Tap projectiles still use their established visual paths. Reduced-motion and optimization paths use fewer embellishments but retain functional hit geometry.
- **Audio owner.** `audio-hero.js`, through the existing mixer and shared voice/headroom limits, adds synthesized bounded original holy double-pulse, wide beam release and hawk launch/contact/interception chime. No crowd-per-target sound burst, no mandatory new sound download, no additional audio engine. Mute, pause, lack of WebAudio and offline availability never affect combat.
- **Player-facing single source.** `skill-reference.js` computes the **automatic, Tap and Charged** forms of Skill 1 at current Power/skill rank/talents, including 100/110/120 combo and splash, 0.85s basic timer, 3s Tap and class 8/7/8s Charged baseline, Paladin two pulses/width/arm range/8-target cap, Mage corridor width/range/one hit per foe, Ranger three-arrow Tap/hawk launch and flight budget/lifetime/damage/short retreat-family lock. Upgrades compare all three forms without adding a new slot/tree.
- **Actual game views.** `menus.js` now gives the Hero Skill Journal and rank/instructor preview separate auto/Tap/Charged sections and explains **asymmetric per-slot readiness**, including that Tap never extends Charged. `app.js` updates combat help, Skill 1 button names, normal vs charged HUD timing and accessible button descriptions. `archive.js` updates the Keeper's original reference voice for all three classes and derives live Skill 1 figures from the same SkillReference, not copied constants. The player's first rank remains self-learned; rescued specialists upgrade that rank.
- **Spanish equivalents.** In-game mechanical copy and labels include original working names and the dual-timer explanation, with Archive references localized separately from the immutable Chronicle manuscript. Existing narrative and boss dialogue remain unchanged.
- **Player controls and README.** Existing 0.65s deliberate hold and queue input route are preserved for Area 3 detailed behavior testing; `README.md` now describes the three-form first skill and independent timer behavior.

## Tests

`tests/hero-skill1-area2.test.cjs` is a **native focused regression** covering all classes at ranks 1/2/4/6/8, real rule-derived figures, rank-delta rows, Cross world-geometry receipts, hero visual queue/draw, Keeper localized names, offline synth fallback, muted audio, and no per-frame hawk sound spam.

The **first CI focused validation** confirmed **PASS** of this new Area 2 test and Area 1 smoke; it exposed an old two-form preview assertion in `tests/skill-reference.test.cjs`, updated to recognize the new three-section Skill 1, and an audio-scheduler test fixture that assumed a boss always existed in the last entered zone; updated to choose a living enemy for the same sound cue check. Those changes need CI verification on the latest commit. Do not claim a full pass while that check is pending.

## Remaining gates

**Area 3:** queued Charged vs newly ready Tap conflict choices and optional boss retreat motion safety; do not disguise these as audiovisual bugs.

**Area 4:** deeper native + browser checks (reduced motion/Canvas/WebGL fallback, 8-slot cooldowns + Slow/save migration, companions/pets and boss phases), focused balancing driven by playtest results, and final PR review.

**Safety:** No merge, deploy, or main-branch code changes authorized.
