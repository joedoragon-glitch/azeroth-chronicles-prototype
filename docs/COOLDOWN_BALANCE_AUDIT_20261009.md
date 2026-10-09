# Cooldown-only combat balance audit · 9 October 2026

The approved implementation is merged and deployed as **v0.8.119**, functional commit `48e2c0e2550c2735fcd45864f5d7aa75b85f9156` ([PR #183](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/183)). [Release run 37978681773](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/37978681773) passed main regressions, desktop/phone browsers, mobile WebKit, assets, deployment, exact published SHA, live smoke and Keeper Archive checks.

Main subsequently advanced with selective quest narration and territorial Monster Fort/save migrations. The entire **810-benchmark / 11,007-encounter matrix was replayed on v0.8.121 main `0a7450d7401c7e6b7f7509da38872644fedd693d`**. Every encounter metric and throughput row matched the v0.8.119 dataset exactly. The committed raw evidence and summary identify this newer engine baseline; newer narration, fort migrations and release files are preserved.

**Recommendation: retain the current cooldowns, 20% Cooldown Training cap, uncapped 15% actual-damage siphons, and charged party-heal cooldown.** No new gameplay defect was confirmed by the balance audit. Ranger mobility uptime and the long tail of Dragon/Sentinel recovery are balance concerns to watch. The evidence does not justify a blanket retune. This audit changes developer tooling, evidence, documentation and regression coverage; production combat rules remain unchanged.

## Functional corrections and preservation

Latest main v0.8.118 was integrated into the active branch before release. Superseded PR #169 remains closed; drafts #174/#182 were not merged. Current quest improvements, preparation tonics, responsive UI, compact Controls, amber notices, enemy VFX/audio, Keeper Archive, assets and v4 save compatibility are preserved.

| Confirmed integration problem | Small correction in v0.8.119 |
| --- | --- |
| Recovery warnings inherited damaging-circle VFX identity | Bypass that identity for boss recovery; preserve the green non-damaging warning and heal feedback |
| Skills integration lost teacher/region/cost guidance | Append skill/cooldown details to the existing guidance |
| Inventory retained active mana wording | Gate it by the reversible resource flag |
| `0.85` appeared as `0.8` in skill details | Display the exact cooldown with sufficient precision |
| Ranger Skill 4 wording implied attack haste | Describe its existing movement haste |

The Ash-beast discrepancy was a **fixture normalization issue**, not extra siphon healing: lazy normalization added 50 HP to the inserted enemy before its correctly calculated 23.8425 HP siphon. Synchronizing the fixture before measurement fixes the comparison. The 15%-of-actual-HP-damage contract was not weakened. Historical MP mode remains executable and tested behind `PrototypeRules.resourceMode.manaEnabled`; old MP values, talent investments, mana inventory/support fields and original backups remain recoverable. Active mana recovery, costs and HUD are disabled; Ranger Heal is preserved.

## Reproducible scope and limits

The final dataset contains **810 120-second skill benchmarks and 11,007 encounter trials**. Seeds are **113, 271 and 997**. These are deterministic configurations using three reused seeds, not 11,007 independent human samples.

- Paladin, Mage and Ranger; all eight normal and three charged abilities; Cooldown Training ranks 0–5.
- Levels 6/16/30, skill ranks 1/4/8, weapon/armor tiers 0/2/4. Encounters learn slots 1–3 / 1–6 / 1–8 respectively. Isolated ability benchmarks deliberately test every slot at every tier.
- Other talents: early `[0, CDR, 0, 0]`, middle `[3, CDR, 3, 1]`, late `[5, CDR, 5, 3]`. No tonic, potions, reforges or companion inheritance bonuses. Companion combat training is 2 after Skill 2 is learned; Ranger support remains at its default rank.
- Normal/Nightmare; solo, one Soldier + one Ranger, six companions (three of each), and two Soldiers for no-Ranger healing comparisons. Six companions at level 6 are a capacity stress test, not an assertion about ordinary progression.
- All eleven normal/TRUE boss families, regular authored enemy packs in Vale/Highlands/Crown, and late awakened dungeons for every class. TRUE dungeon strength uses victory-level +2. Early-level TRUE trials are underprepared stress cases, not a progression target.
- Matched healing on/off: all three classes, ranks 0/5, both difficulties/forms, all four companion configurations. Charged-policy comparisons cover every talent rank, both difficulties/forms, solo/mixed parties, Archive at level 16 and Dark Lord at level 30.

The production `Campaign.tick`, damage resolver, compression, targeting, rogue moves, support, summons, terrain, dungeon partitions and traps run. Bosses use authored spawn points. Local props are cleared in most isolated encounters; Archive policy trials retain them. Background guardian waves/packs/night spawning and reward level-ups are suppressed to isolate the fight. The policy does not perfectly dodge every rogue maneuver or trap. A 180-second timeout is censored; defeats are not counted as quick victories. Paired duration comparisons require both actors to survive and avoid resets. Initial bursts and finite-window edges affect 120-second rates.

Damage comes from the resolver's actual-damage callback, not net HP change. Re-engagement normalization and encounter resets are accounted separately. **All 11,007 primary-target HP ledgers balance** within 0.001 HP for non-defeat outcomes. Defeat resets are censored. This prevents the earlier normalization error from contaminating the audit. Enjoyment, real-device performance and every authored party route still require human playtesting.

[Raw evidence (gzip JSON)](evidence/COOLDOWN_BALANCE_20261009.json.gz) · [Readable summary and all late-tier single-target measurements](evidence/COOLDOWN_BALANCE_20261009_SUMMARY.json) · [Simulation harness](../scripts/cooldown-balance-audit.cjs) · [Summary generator](../scripts/summarize-cooldown-balance.py)

```sh
node scripts/cooldown-balance-audit.cjs --out=/tmp/cooldown-full.json
python3 scripts/summarize-cooldown-balance.py /tmp/cooldown-full.json /tmp/cooldown-summary.json /tmp/cooldown-full.json.gz
```

`--shard=N/M` partitions encounter indices; shard 0 also measures skills. `--encounters-only` and `--from-case=N` support segmented runs. Combine segments by unique `caseIndex`; the summary generator rejects incomplete evidence. Individual fights can be replayed through the harness's exported `fight(config)`.

## Exact cooldowns

All three classes use the same table. Charged/normal versions share their slot timer. Queued holding starts its 650 ms charge **after** cooldown expiry; that hold cannot be preloaded. At rank 5 the theoretical normal cast rate rises 25%, rather than 20%. Minimum sustained charged cycles are 3.05 / 5.45 / 16.65 seconds at rank 5.

| Ability | Rank 0 | Rank 1 | Rank 2 | Rank 3 | Rank 4 | Rank 5 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Normal 1 | 0.85 | 0.816 | 0.782 | 0.748 | 0.714 | 0.68 |
| Normal 2 | 3 | 2.88 | 2.76 | 2.64 | 2.52 | 2.4 |
| Normal 3 | 8 | 7.68 | 7.36 | 7.04 | 6.72 | 6.4 |
| Normal 4 | 14 | 13.44 | 12.88 | 12.32 | 11.76 | 11.2 |
| Normal 5 | 9 | 8.64 | 8.28 | 7.92 | 7.56 | 7.2 |
| Normal 6 | 4 | 3.84 | 3.68 | 3.52 | 3.36 | 3.2 |
| Normal 7 | 15 | 14.4 | 13.8 | 13.2 | 12.6 | 12 |
| Normal 8 | 24 | 23.04 | 22.08 | 21.12 | 20.16 | 19.2 |
| Charged 1 | 3 | 2.88 | 2.76 | 2.64 | 2.52 | 2.4 |
| Charged 2 | 6 | 5.76 | 5.52 | 5.28 | 5.04 | 4.8 |
| Charged 3 | 20 | 19.2 | 18.4 | 17.6 | 16.8 | 16 |

## Every ability and class

Late-tier isolated measurements below show **rank 0 → rank 5**. Attacks use actual single-target DPS against an unarmored, replenished target; Skill 3 uses hero HPS against replenished wounds; Skill 4 uses immunity/haste percentage. Real boss compression, motion, competition between abilities and missing-HP limits are covered by the encounter trials, so this table is not a boss-DPS prediction.

| Ability / metric | Paladin | Mage | Ranger |
| --- | ---: | ---: | ---: |
| Normal 1 · DPS | 360.0 → 449.0 | 397.3 → 495.6 | 378.7 → 472.3 |
| Normal 2 · DPS | 184.9 → 231.1 | 206.0 → 257.4 | 213.2 → 266.5 |
| Normal 3 · HPS | 27.3 → 34.6 | 29.1 → 36.8 | 28.2 → 35.7 |
| Normal 4 · buff uptime | 26.7 → 32.6% | 22.9 → 28.1% | 43.2 → 52.8% |
| Normal 5 · DPS | 67.7 → 82.2 | 75.4 → 91.5 | 71.5 → 86.8 |
| Normal 6 · DPS | 123.7 → 156.7 | 136.6 → 173.1 | 130.2 → 164.9 |
| Normal 7 · DPS | 100.9 → 126.1 | 131.1 → 163.8 | 177.7 → 222.1 |
| Normal 8 · DPS | 47.1 → 66.0 | 51.9 → 72.7 | 49.5 → 69.4 |
| Charged 1 · DPS | 228.3 → 276.8 | 252.0 → 305.4 | 240.2 → 291.1 |
| Charged 2 · DPS | 83.2 → 101.7 | 92.7 → 113.3 | 95.9 → 117.3 |
| Charged 3 · HPS | 10.9 → 14.6 | 11.6 → 15.5 | 11.3 → 15.0 |

Skill 8 also heals the hero: its late-tier benchmark HPS is Paladin 30.2→42.3, Mage 28.4→39.8, Ranger 29.1→40.8. Its rank-8 duration is four seconds of immunity. These finite-window increases include five versus seven initial-ready casts; the underlying steady cooldown-rate gain remains 25%.

- **Charged Skill 1:** single-target DPS is about 61–64% of the normal combo in these fixtures. In 144 matched configurations per class/boss, charge-heavy Skill 1 was 4.1% / 14.0% / 12.4% slower at the median surviving Dark Lord pair for Paladin/Mage/Ranger. Archive medians were 0% / 5.3% / 9.1% slower. Occasional opening-burst wins are useful; normal combos are not obsolete. Keep 3 seconds.
- **Charged Skill 2:** at full training it casts 22 times in 120 seconds versus 50 normal casts. Six aligned targets raise charged DPS to 610.2 / 679.7 / 703.6, while single-target charged DPS is 101.7 / 113.3 / 117.3. That is a geometry-dependent AoE tradeoff. Forced charging produced no consistent encounter advantage: Dark Lord median penalties were 0% / 6.6% / 5.4%. Keep 6 seconds and existing shapes.
- **Charged Skill 3:** six continuously wounded companions yield aggregate HPS 87.3 / 93.1 / 90.2 at full training, plus the hero's 14.6 / 15.5 / 15.0. This is a capacity benchmark, not automatic healing. The shared slot locks out the faster 6.4-second normal self-heal for 16 seconds; holding adds 650 ms. In 180 matched Mage/full-training encounters, allowing party healing changed clean victories from 169 to 171. It was actually cast in 75 encounters, at most four times; maximum delivered companion healing was 3,131.2 HP. It did not guarantee survival or resurrect fallen companions. Keep 20 seconds.
- **Immunity:** late-tier long-run non-overlapping upper bounds from Skills 4+8 are approximately 52.5% Paladin and 48.1% Mage; Ranger gets about 20.8% from Skill 8. Real overlap and failed targeting reduce availability. Successful full-training late-TRUE medians were approximately 39–46% for Paladin/Mage and 24–26% for Ranger, depending on party/difficulty. Short fights can end inside an initial protection window; that does not demonstrate permanent immunity.
- **Haste/control:** Ranger Skill 6 alone reaches 95.4% movement-haste uptime in the 120-second late-tier benchmark; combined encounter uptime is about 97%. Its effect is +25% movement speed, not attack speed. Mage Skill 2 maintains almost continuous movement slow even at rank 0 (four-second slow, three-second cooldown). It does not slow boss spell cooldowns. These are mobility/control concerns to playtest, not evidence of extra attack DPS or a broken training cap.

## Competitiveness and challenge

Prepared rank-5 normal-boss trials are usually short. Late TRUE trials remain materially dangerous. Each class/difficulty cell below has 54 trials across six late TRUE families, three party sizes and three seeds; successful-duration medians exclude deaths.

| Class | Normal: victories / median seconds | Nightmare: victories / median seconds |
| --- | ---: | ---: |
| Paladin | 45/54 · 28.9s | 40/54 · 34.5s |
| Mage | 53/54 · 28.5s | 39/54 · 30.6s |
| Ranger | 40/54 · 26.45s | 35/54 · 28.1s |

Across both difficulties, moving from rank 0 to 5 changed late-TRUE victories from 60→85 / 71→92 / 56→75 out of 108 for Paladin/Mage/Ranger. Median paired time reductions were 18.4% / 20.1% / 16.5%. Normal-boss reductions were only 5.4% / 8.0% / 8.2%, because initial bursts and companion output dominate short fights. Training is valuable, but the evidence does not support reducing its cap now.

Mage remains competitive without MP: strongest measured normal basic DPS, sustained frost control, area damage and the best aggregate late-TRUE result. It needs no compensatory buff. That establishes mechanical competitiveness; subjective enjoyment is unmeasured.

Six companions do not make every TRUE fight safe. At rank 5, Nightmare late-TRUE victories with six companions were Paladin 18/18, Mage 17/18, Ranger 13/18. Median surviving companion counts were 0.5 / 3 / 2 respectively. Ranger's high mobility coexists with lower aggregate survival, so a haste nerf based only on uptime would be premature.

Ordinary packed enemies can disappear within the initial skill burst at late gear. Increasing cooldowns would not change that first volley. Existing prepared-first-boss, difficulty, guard/awakening, geometry and rogue regressions remain passing. The isolated, scripted, well-trained normal-fight results do not certify fresh-player difficulty or every crowded authored approach. Verify those in play before changing damage or existing compression.

## Enemy healing and encounter duration

Each row contains 288 matched healing on/off pairs across every class, ranks 0/5, both difficulties/forms, all four party configurations and all seeds. Duration statistics use only mutual surviving, reset-free pairs. Turning recovery on also displaces attacks and changes later AI timing, so individual differences can be negative; they are total encounter effects, not a pure HP/DPS quotient.

| Family | Victories off → on | Clean pairs | Median added seconds / percent | Largest added seconds | Maximum observed own recovery |
| --- | ---: | ---: | ---: | ---: | ---: |
| crypt | 254 → 254 | 251 | 0s / 0.0% | 1.8s | 1.16% of starting HP |
| archive | 286 → 287 | 274 | 0s / 0.0% | 16.8s | 1.76% of starting HP |
| abyss | 178 → 175 | 163 | 0.8s / 10.2% | 20.2s | 16.00% of starting HP |
| citadel | 226 → 222 | 201 | 1s / 6.5% | 29.3s | 40.00% of starting HP |
| darklord | 281 → 281 | 270 | 0s / 0.0% | 1s | 1.21% of starting HP |

Siphon medians add zero seconds; the largest observed siphon contribution is 1.76% of starting boss HP in this cohort. This is an observation, **not a new cap**. Badly handled area/periodic attacks can heal more; the seven-recipient, overkill, immunity, terrain-blocking and Wraith single-heal regressions enforce the uncapped actual-damage rule. Keep 15%.

Independent recovery deserves targeted playtesting. Dragon healing adds about 10.2% at the median clean pair; Sentinel adds 6.5%. Only three/four net victories were lost out of 288 respectively, while some attacks displaced by healing made other seeds easier. Thus recovery has a measurable cost without being a universal stalemate. Longer tails still matter:

| Repeatable case | Healing off | Approved healing on | Delivered recovery |
| --- | ---: | ---: | ---: |
| Mage, level 30, CDR 5, TRUE Abyss, Normal, mixed pair, seed 997 | 37.3s | 57.5s | 4,551.04 HP |
| Ranger, level 30, CDR 5, TRUE Citadel, Normal, six companions, seed 113 | 50.2s | 79.5s | 6,044.4 HP |

These are raw cases 4820/4821 and 7829/7830. Another Sentinel trial recovered 40% of starting HP across repeated permitted casts. Some underprepared TRUE/solo policies died or timed out even without recovery; disabling healing is not a general difficulty solution.

## Smallest recommendations

1. **Retain the verified functional implementation, every current cooldown and the 20% talent cap.** That is the smallest justified correction set. No live balance edits were made by this audit.
2. **Retain uncapped actual-damage siphons and 20-second charged party healing.** Do not replace actual damage with attack damage, add maximum-HP caps, or weaken immunity/miss/overkill tests.
3. **Prioritize the two Dragon/Sentinel tail cases above for human replay.** If players confirm that repeated recovery feels tedious, the smallest next experiment is changing only the existing recovery fractions (Dragon 8%→6%, Sentinel 10%→8%), keeping warnings, 24/28-second cooldowns and damaging attacks intact. These candidate values are recommendations for a subsequent measured experiment, not values this audit tested or deployed. Current median effects alone do not require them.
4. **Keep Ranger's current haste while observing actual kiting.** If mobility removes encounter decisions in human play, an isolated experiment reducing Skill 6's existing rank-duration coefficient from 0.15 to 0.10 would lower its rank-8 duration from 3.05 to 2.7 seconds (84.4% nominal full-training uptime), without retuning cooldowns. This remains untested and should not accompany a broad class nerf; Ranger currently has the weakest aggregate late-TRUE result.
5. **Keep Mage's identity and do not add a replacement resource.** Validate enjoyment, normal-map pacing and opening bursts on the actual Chromebook/phone before drawing broader conclusions from the scripted policy.

## Regression and release evidence

- Functional release: 74 regression suites; 222 desktop/phone checks; full mobile WebKit, quest/Archive, rogue, audio, terrain, sprite/showroom and VFX gates; 30 scene/60 image captures; build/assets/format and published-build verification. Release run linked above completed successfully.
- Supporting audit changes on latest v0.8.121: 77 local regression suites, format and generated/assets checks. New observation tests verify deterministic replay, ordinary packs, normalization versus actual damage, reset/defeat attribution, charge opportunity costs and six-unit heal accounting.
- New browser regression: **54 zero-MP queued charged casts per engine** (three classes × six ranks × three slots), exact timer at cast boundary and early queued cancellation. Chromium keyboard and WebKit touch paths passed.
- Real PWA upgrade from v0.8.118 to latest v0.8.121 passed in Chromium and WebKit: actual worker activation/cache retirement, retained class/currency/Succession/talents/dormant MP and mana fields, and phone reopening while the origin server was shut down. `COOLDOWN_PREVIOUS_ROOT` selects the extracted previous tree. These new input/upgrade gates are added to PR/main/WebKit CI.
- CI reproduces the summary from compressed raw evidence. Consult the supporting PR/main run for its exact completed head; the functional production evidence above refers specifically to commit `48e2c0e…`.
