# Cooldown-only combat · continuation handover

**Functional integration and measured balance audit are complete.** [PR #183](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/183) is merged and deployed as v0.8.119 at `48e2c0e2550c2735fcd45864f5d7aa75b85f9156`. [Release run 37978681773](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/37978681773) passed main regressions, desktop/phone browsers, mobile WebKit, assets, deployment, exact published SHA, live smoke and Keeper Archive. Always inspect current GitHub/main/CI before new work; the SHA above is the audited functional release, not a promise that main never advances.

Superseded #169 remains closed; older integration drafts #174/#182 must not be merged. Preserve all newer quest, tonic, responsive UI, amber-notification, enemy VFX/audio, Keeper Archive and save work. Keep the multi-file GitHub Pages/PWA architecture.

## Approved implementation to preserve


- Multi-file GitHub Pages/PWA, all three classes. `PrototypeRules.resourceMode.manaEnabled = false` is the reversible resource switch, not destructive deletion. Legacy mana logic and v4 save fields remain for rollback. Active gameplay has no MP expenditure, regeneration or recovery HUD; Ranger Mana Recovery is hidden and disabled, Ranger Heal remains.
- Normal Skill 1–8 base cooldowns remain `[0.85, 3, 8, 14, 9, 4, 15, 24]` seconds in slot order. Charged Skills 1–3 provisionally use `[3, 6, 20]` seconds. Charged input requires the existing held-action workflow; charged and normal share the same slot cooldown.
- Talent index 1 retains its historical 5-rank investment and now presents as **Cooldown Training**, reducing **all hero skill cooldowns by 4% per rank**, up to 20% at rank 5, for all three classes. Preserve previous talent ranks, talent points and respec behavior. This arithmetic is implemented and measured in the linked audit; the current values are retained, with human playtesting limits stated.
- Classes retain their damage, frost, combo, heal, immune, haste and charged-area identities; no new mana potions. Skill details live in the Character → Skills menu, not as MP costs cluttering gameplay HUD.
- Cinder Spitters heal their own missing HP equal to 15% of **actual hero/companion HP damage** they deal with successful ranged hits. Wraiths, Crypt Guardian, Drowned Keeper and Dark Lord apply the same real-damage life-steal to their approved formerly MP-draining attacks, including multiple party members or periodic hits. **No 1%-per-hit Ash-beast cap and no 2%-per-skill boss cap.** Existing max HP remains the natural boundary. No extra HP damage. Immune or blocked hits give no healing. Old Wraith fixed heal must not stack in cooldown mode.
- Abyss Dragon and Ash Sentinel are not life-stealers: provisional telegraphed independent self-heals (Ember Renewal: 8% boss max HP, 24-second ability cooldown; Ash Reforge: 10%, 28 seconds). They remain normal damaging bosses otherwise.
- The functional release is v0.8.119 at `48e2c0e2550c2735fcd45864f5d7aa75b85f9156`. Keep newer main quest, tonic, amber-notice and VFX work intact.

## Completed audit and remaining questions

The full matrix replayed on v0.8.121 main `0a7450d7401c7e6b7f7509da38872644fedd693d` with identical encounter metrics and skill throughput; latest narration and fort/save fixes are retained. Read [COOLDOWN_BALANCE_AUDIT_20261009.md](COOLDOWN_BALANCE_AUDIT_20261009.md), its compressed raw evidence and summary before retuning. It covers 810 skill benchmarks and 11,007 encounters, all classes, all normal/charged slots, ranks 0–5, representative levels, Normal/Nightmare, normal/TRUE bosses, three seeds, party sizes, charged policies and matched healing on/off.

Current recommendation is to retain every cooldown, 20% training cap, uncapped 15% actual-damage siphons, and 20-second charged party healing. Normal combos retain sustained single-target value; charged AoE trades cadence for geometry; party healing trades away faster self-healing; Mage is mechanically competitive without MP. No new gameplay defect was confirmed by this audit.

Remaining human-play questions: Ranger Skill 6 has about 95% isolated movement-haste uptime at full late training; Dragon/Sentinel recovery has long-duration tails. Replay the report's seed/setup cases before changing numbers. Suggested smaller recovery fractions or Ranger duration coefficient are explicitly **untested experiments**, not approved/deployed corrections. Do not infer enjoyment or new-player pacing from scripted, prepared fixtures.

## Regression and evidence continuation

The Ash-beast 50-HP discrepancy came from fixture normalization. Pre-measurement synchronization now passes strict 15% accounting; do not weaken this rule. Historical MP-mode, Wraith single-heal, immunity, companion overkill, hazard pulse, green warning and all-class/rank menu/timer tests passed in the release.

Supporting audit regressions cover deterministic full combat replay, actual damage versus HP normalization/reset attribution, native packs and charged opportunity costs. Keyboard Chromium and touch-path WebKit test 54 zero-MP charged casts per engine and queued cancellation. Real service-worker v0.8.118→v0.8.121 upgrade/offline reopen tests preserve old talents, MP and mana inventory/support fields in both engines. CI reproduces the committed summary from raw evidence. Check the latest supporting PR/main run for completion before claiming its gates passed.

For new work, distinguish confirmed defects from balance concerns, retain reproducible seed/config evidence, and apply only the smallest measured correction. No replacement resources, destructive MP migration, new mana potions or unrelated overwrites.
