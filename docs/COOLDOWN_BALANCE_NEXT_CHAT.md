# Cooldown-only combat · next-chat balance audit handover

Current integration: [PR #183](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/183), branch `feature/cooldown-only-combat-integrated-20261009`. Original conflicted feature PR #169 is historical and should not be merged separately. **Always inspect current GitHub state and CI before beginning new changes.**

## Approved implementation to preserve

- Multi-file GitHub Pages/PWA, all three classes. `PrototypeRules.resourceMode.manaEnabled = false` is the reversible resource switch, not destructive deletion. Legacy mana logic and v4 save fields remain for rollback. Active gameplay has no MP expenditure, regeneration or recovery HUD; Ranger Mana Recovery is hidden and disabled, Ranger Heal remains.
- Normal Skill 1–8 base cooldowns remain `[0.85, 3, 8, 14, 9, 4, 15, 24]` seconds in slot order. Charged Skills 1–3 provisionally use `[3, 6, 20]` seconds. Charged input requires the existing held-action workflow; charged and normal share the same slot cooldown.
- Talent index 1 retains its historical 5-rank investment and now presents as **Cooldown Training**, reducing **all hero skill cooldowns by 4% per rank**, up to 20% at rank 5, for all three classes. Preserve previous talent ranks, talent points and respec behavior. This arithmetic is implemented, **not yet numerically balanced**.
- Classes retain their damage, frost, combo, heal, immune, haste and charged-area identities; no new mana potions. Skill details live in the Character → Skills menu, not as MP costs cluttering gameplay HUD.
- Cinder Spitters heal their own missing HP equal to 15% of **actual hero/companion HP damage** they deal with successful ranged hits. Wraiths, Crypt Guardian, Drowned Keeper and Dark Lord apply the same real-damage life-steal to their approved formerly MP-draining attacks, including multiple party members or periodic hits. **No 1%-per-hit Ash-beast cap and no 2%-per-skill boss cap.** Existing max HP remains the natural boundary. No extra HP damage. Immune or blocked hits give no healing. Old Wraith fixed heal must not stack in cooldown mode.
- Abyss Dragon and Ash Sentinel are not life-stealers: provisional telegraphed independent self-heals (Ember Renewal: 8% boss max HP, 24-second ability cooldown; Ash Reforge: 10%, 28 seconds). They remain normal damaging bosses otherwise.
- Source/gameplay regression work and version 0.8.114 PWA update are in the integration PR. Keep newer main quest, tonic, amber-notice and VFX work intact.

## Required audit in the next chat: numerically balance cooldowns

1. Confirm merged/deployed state of PR #183 and all required CI/browsers; do not assume release succeeded. Complete any pending integration defects first without arbitrary combat retunes.
2. Derive skill cooldowns exactly at ranks 0, 1, 2, 3, 4 and 5 for each slot and charged variant, and verify actual runtime timers, UI menus, quick-tap versus charged timing and interruption/queued holds on keyboard and touch.
3. Measure sustained throughput, total damage, boss kill time, party-heal availability, survivor HP and defensive immunity uptime by class (Paladin/Mage/Ranger), with representative learned ranks and talents at early/mid/late levels, Normal/Nightmare, regular fights, bosses and TRUE bosses.
4. Specifically guard against charged basic Skill 1 displacing the free three-hit normal combo, charged Skill 2 erasing normal AoE decisions, or charged Skill 3 providing trivial permanent party sustain. Compare rank 0 against full rank 5 and with/without Rangers.
5. Measure actual contribution from HP life-steal and new telegraphed boss self-heals, including six-companion worst-case hits and repeated hazard pulses. Do not introduce max-HP fraction healing caps by default; report empirical encounter duration and gameplay costs before suggesting changes.
6. For any concern, provide reproducible seed, setup, observed metrics, intended behavior, minimum fix and affected regression tests. Keep prior balance values unless actual measurements justify a change.

## Integration blocker at last handover (2026-10-09)

**Do not claim merged or deployed.** The active PR #183 is open and draft; its head was `15b12c10065325427e83f012c7955db0cd6f7328`. The branch originally integrated main `296356a883903459ba68e70291920f9c4538d96b`; concurrent approved responsive-UI work advanced `main` to `4a2e6b3d9772f4eb44fb3e351f3a67bfb5ac1bdd`, leaving PR #183 conflicted. This introduced the already-shipped v0.8.114 version, so choose a new available version (e.g. 0.8.115) when regenerating build/service-worker files. Preserve UI, tonic, quest, amber-notice, enemy-VFX and saves.

The previous full regression run passed format and generated-file checks but failed `tests/cooldown-only.test.cjs` Cinder Siphon test: recorded siphon event was the correct 15% of actual HP loss (23.8425 HP), while the test observed 73.8425 HP net monster increase because a manually inserted enemy gained another 50 HP from lazy world normalization. A `g.zone()` pre-measurement fixture synchronization was committed, **not subsequently verified by a completed required CI pass**. Confirm this behavior in actual game and test cases, not by weakening the intended 15% siphon rule. The phone WebKit job and all other required browser checks likewise have no certified passing head at handover.

Close status: superseded PR #169 is CLOSED and must not be merged. PR #183 is the sole active implementation, but requires rebase/reintegration, functional regression repair, fresh CI/browser validation, and then merge/deployment. **Only after that** perform the requested numerical cooldown-reduction and encounter balance audit.

## Current audit status

The above values are **provisional** and must not be described as proven balanced. Functional pass/fail depends on most recent GitHub Actions run. In the previous chat, CI runs for several rapid commits were queued/pending; confirm the final head's completed checks. Do not merge conflicted PR #169. Follow the user's explicit instruction: **balance audit is deferred until the next chat, while functional implementation may proceed now if verified.**
