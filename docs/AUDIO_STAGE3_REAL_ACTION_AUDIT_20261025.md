# Audio Stage 3 — real combat action coverage

**Review checkpoint:** 2026-10-25  
**Base:** `main` `e3c78266b28f3325d2afdcb76ae849fcff306deb`  
**Stage:** 3 of 5. Independent of unmerged Stage 1 #468 and Stage 2 #470.

## Goal and evidence boundary

Answer the player's question **“Does each actual attack, skill, companion action and boss stage really reach an audio source?”** without confusing an asset registration with audible playback. This stage adds a **gameplay-event-to-audio-facade integration test** based on real `Campaign.cast`, `Campaign.tick` autonomous companions, actual projectile updates, and actual boss attack resolvers. No soundtrack, balance, animation, projectile, cooldown, asset, cache, save or game-runtime behavior is changed.

The regression test at `tests/audio-stage3-action-audit.test.cjs` creates 48 independent hero casts (3 classes × 8 slots × Tap/Charged), 13 companion combat encounters (Soldier, Archer and 11 pets) and every normal/TRUE boss's authored attack indexes. It then sends the **actual emitted event receipts** into the real installed `PrototypeAudio.effect` dispatcher. Sound source methods are intercepted before they contact an audio device; direct procedural output is counted. The live authored sound manifest is also consulted for matched optional WAV-binding candidates. The test cross-checks the existing enemy audio-catalog coverage, which verifies all known identity/stage permutations.

**No-source observations are not automatically bugs.** The pipeline deliberately suppresses presentation-handled legacy receipts, bookkeeping and duplicated stages. `companionSkill`, `petSkill`, and `hit` are intentionally bookkeeping-level because melee, projectile and special cast/impact events own foley; charge completions and Ranger hawk flight/expiry similarly suppress duplicate launch sound. Enemy presentation may explicitly mark stages `silent`.

The test forces the cold-recording path to use immediate procedural sound. Thus **“source attempted” is not “sound perceptibly played on a phone”**. It does not decode music/PCM, measure volumes, test all combinations of crowd throttling or certify exact real-device acoustics. Those remain Stage 4 mix analysis and Stage 5 browser/physical-device acceptance.

## Source analysis

- `src/prototype/app.js`: drains `Campaign.effects` and calls `audio.effect` for each receipt while also updating render effects. No dependency on moving before combat sound dispatch.
- `src/prototype/audio-hero.js`: owns hero skill audio, honors actual flight and impact, and gates duplicate/charged Skill 1 bookkeeping.
- `src/prototype/audio-effects.js`: resolves companion Steel/Guard, Archer Triple Shot/Piercing Volley, projectile launches/impacts, creature/hit, general spells and combat event notes. `soundKind` explicitly suppresses actions delegated elsewhere.
- `src/prototype/audio-enemy.js` and `enemy-presentation.js`: staged warnings, releases, travel, impacts, misses, spawn and phase; material/personality synthesis when WAV is not bound.
- `assets/audio/manifest.json`: 30 recorded SFX files bound through a small subset of 95 event keys. Most hero/companion/boss sound receipts resolve procedurally, which is not a missing asset by itself.

## Real-action coverage findings (CI-confirmed)
  
The focused Stage 3 action integration ran **48 hero forms**, **13 autonomous companion types**, **22 boss/form combinations**, **362 actual boss attack receipts**, and cross-checked **264 enemy presentation identities / 1,962 catalog stage variants**. Each tested hero form, companion combat stream and boss attack index reached an immediate procedural source attempt in the cold-recording test environment.

These are observed *source attempts*, not decoded speaker sound; the WAV column counts **matching manifest bindings** that could replace an immediate synth when warmed, not actually heard recordings.

| Class | Slot | Tap / Charged ability | Procedural receipt attempts (Tap / Charged) | Bound WAV candidate receipts (Tap / Charged) |
|---|---:|---|---:|---:|
| Paladin | 1 | Radiant Strike / Radiant Cross | 2 / 2 | 1 / 0 |
| Paladin | 2 | Sundering Strike / Holy Cleave | 2 / 3 | 2 / 1 |
| Paladin | 3 | Shield Stance / Shield Bash | 1 / 2 | 0 / 0 |
| Paladin | 4 | Judgment / Grand Judgment | 2 / 2 | 0 / 0 |
| Paladin | 5 | Holy Area / Consecrated Wave | 1 / 2 | 0 / 0 |
| Paladin | 6 | Vanguard Rush / Vanguard Impact | 2 / 2 | 2 / 0 |
| Paladin | 7 | Holy Assault / Oath Strike | 1 / 2 | 0 / 0 |
| Paladin | 8 | Sanctuary Oath / Last Bastion | 1 / 2 | 0 / 0 |
| Mage | 1 | Arcane Beam / Wide Arcane Beam | 2 / 2 | 0 / 0 |
| Mage | 2 | Frost Bolt / Frost Burst | 2 / 3 | 0 / 0 |
| Mage | 3 | Spell Interrupt / Silence Field | 2 / 2 | 0 / 0 |
| Mage | 4 | Arcane Fracture / Arcane Rupture | 2 / 2 | 0 / 0 |
| Mage | 5 | Force Pulse / Force Wave | 1 / 2 | 0 / 0 |
| Mage | 6 | Magic Shot / Focused Arcane Beam | 2 / 3 | 0 / 0 |
| Mage | 7 | Arcane Chain / Arcane Chainstorm | 1 / 2 | 0 / 0 |
| Mage | 8 | Astral Detonation / Arcane Cataclysm | 1 / 2 | 0 / 0 |
| Ranger | 1 | Rapid Arrows / Hawk Interception | 6 / 2 | 0 / 0 |
| Ranger | 2 | Pinning Shot / Pinning Volley | 4 / 3 | 0 / 0 |
| Ranger | 3 | Self-Heal / Party Heal | 1 / 2 | 0 / 0 |
| Ranger | 4 | Movement Haste / Companion Rally | 1 / 2 | 0 / 0 |
| Ranger | 5 | Arrow Volley / Arrow Rain | 1 / 3 | 0 / 0 |
| Ranger | 6 | Repelling Shot / Repelling Volley | 2 / 7 | 0 / 0 |
| Ranger | 7 | Piercing Arrow / Charged Piercing Arrow | 2 / 3 | 0 / 0 |
| Ranger | 8 | Hunter's Salvo / Grand Hunt | 4 / 7 | 0 / 0 |

The companion combat test exercises Soldier, Archer, and all eleven named boss pets (thorn, crypt, mire, archive, ridge, mine, warlord, abyss, citadel, cindermaw, darklord). Both autonomous skill cooldowns activate in a valid, post-introduction encounter; the dispatcher receives their actual melee, ranged, spell, charged-area or contact receipts. The original test fixture in `tests/roster-skill-update.test.cjs` previously remained inside the introductory hero-only encounter gate. It has been corrected as test-only maintenance, with **no changes to combat logic or save format**.

**Confirmed narrow audio gap (fixed in this PR):** four ranged pet families (crypt, archive, abyss and citadel) emit `projectileImpact` with `style: "pet"`. The dispatcher formerly fell through to a generic sound kind with no procedural implementation. It now maps `pet` contact to the already existing `magicImpact` recipe, matching those pets' magical launch foley. A regression requires every ranged pet's real contact event to attempt a sound. The existing throttle/mixer/voice budgets remain untouched.

**Intentional/non-defect silence:** ordinary `heroSkillCast` receipts often delegate to launch, area or impact events; basic `projectileLaunch` is duplicated by the real `heroProjectileFlight` receipt; `heal` may defer to skill presentation, and `companionChargeStart` is a preparation receipt rather than damage audio. Soldier Power Strike and Holy Cleave, Archer Piercing Volley and some legacy charged stages similarly suppress double-triggering while a related actual receipt plays. A no-source count on one receipt does **not** prove its entire action is silent.

**Independent enemy-audio suite exception:** the older `tests/enemy-audio.test.cjs` currently fails its `concurrentBirths` field-boss 30-second telegraph-preservation assertion in the isolated CI run. Logging showed the enemy disengaging and retiring its telegraph in the synthetic fixture. The assertion was **not relaxed**, the original test was restored unchanged, and no enemy combat logic was modified. The Stage 3 narrow gate instead checks authored identity/stage coverage and real enemy projectile/captain bridging. The old suite's full result remains a separate test-maintenance or encounter-regression investigation before broad release certification; it must not be silently represented as passing.


## Acceptance and handoff

Run the new test:

```sh
node tests/audio-stage3-action-audit.test.cjs
node tests/audio-stage3-action-audit.test.cjs --json
```

Run focused CI plus existing `tests/hero-skills-consolidation.test.cjs`, `tests/roster-skill-update.test.cjs`, `tests/enemy-audio.test.cjs`, `tests/audio-production.test.cjs`, and `tests/audio-recordings.test.cjs` as appropriately selected.

Review any `no_source_observed` entries against neighboring real receipts and source timing, rather than filling silence by adding redundant cast sounds. Treat failing hero/companion/boss action assertions as an unresolved gap until corrected and rerun. Preserve the original 64-voice budget and load throttles.

Do not merge/deploy this draft PR or other drafts without the owner's approval. Stage 4 (music and sound-mix perceptibility) and Stage 5 (browser/offline/device acceptance) are **not** authorized by this stage.
