# Stage 2 — Hero, companion and pet critical receipts: isolated integration checkpoint

**Azeroth Chronicles · PR #440 · 24 October 2026**

**Status:** Stage 2 **receipt-routing prototype committed**. It is intentionally **opt-in, unimported and OFF in the game**. Critical effects, skill-specific balance, physical indicator, save migration and hostile action integration have **not** been enabled. The pending [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439) remains independent and unmerged.

## What this commit delivers

- `src/prototype/critical-party-integration.js` — an **explicit** `install(Campaign, CriticalExecutions, {enabled:true,stream})` review adapter. With `enabled` omitted or false it returns without changing any prototype, reading RNG, or registering an action. The module is **not imported by `engine.js`, app initialization, renderer or HTML**, so this PR does not change gameplay when opened or merged alone.
- The enabled **test/review** adapter works with the **real Stage 1 `critical-executions.js` resolver**, not the general Campaign RNG. One critical receipt is recorded per observed committed action with party-domain classification. It does not modify health, damage, statuses, cooldowns, visuals or audio.
- Hero `cast` uses the existing `heroSkillCast` emitted **after action commitment but before effects**, recognizing PR #439's independent auto-basic, 8 Tap slots and 8 Charged slots in all three classes. Newly spawned projectiles share its release receipt; PR #439's delayed Paladin Cross/Ranger Hawk effect objects inherit the receipt. Mage Wide Arcane Beam reuses the single immediate cast receipt.
- Soldier and Archer: first skills (including 3-shot Triple Shot), second charged skills (only at actual release), Ranger Heal/Mana Recovery, ordinary basics and defensive Recall counters are observed. The pet delegation from `companionUseFirstSkill` and `resolveCompanionSecondSkill` does **not** double-roll.
- All 11 pets use family identity keys for ordinary basics and both specials. A ranged pet's released projectile carries the same receipt. Ordinary pet defensive counter uses its own release.
- Observations are a **64-entry bounded transient ring-like window**, not `s.statistics.events`, `game.effects`, the existing 40-slot FX queue, or a save record. `uninstall()` restores methods that the adapter still owns. Repeat installation is rejected.

## Stage 2 source matrix

| Actor and action | Opt-in receipt path | Confirmed in isolated tests? | Further verification required |
| --- | --- | --- | --- |
| Paladin/Mage/Ranger auto basic | `cast` → `heroSkillCast`, `automatic` arg | Mock class release/identity | Native PR #439 still/moving combo and protected bosses |
| Hero Skill 1 Tap/Charged | Same event, distinct key; projectile/`_heroSkillEffects` children | Ranger triple burst and Paladin-style delayed effect fixture | Real PR #439 Cross pulse, Hawk moving-target path, Wide Beam crowd |
| Hero Skills 2–8 Tap/Charged | Same event, separate keys | Representative activated slots fixture | 3-class × 7-slot native coverage and queued interruption |
| Soldier/Archer first specials | `companionUseFirstSkill` successful result | Triple Shot 3 projectiles share receipt | Native combat, failed-hit and Veteran ward |
| Soldier/Archer charged second | `resolveCompanionSecondSkill` successful result | Fixture verified | Native 0.65s hold/cancel and cast-completion semantics |
| Ranger support | `rangerSupport` successful result; actual selected Ranger | One heal fixture | Native full/queued/auto-care, silence, 5-second HoT |
| Pet first/second | `usePetSkill` successful result; pet delegation excluded | Pet first/second fixture | Every pet family, direct healing, Slow, ward and native contact |
| Basic attacks | `companionFight` cooldown transition; pet defensive counter | Soldier/Pet basic fixtures | Native misses, AI movement, per-tick overhead |
| Recall defensive troop basics | `updateParty` resulting shot/melee events | Archer/Soldier fixtures | **Missed Soldier melee may have no event and remain unmapped** |

## Focused test evidence

- Local `node --check` passed for the integration module and test source.
- Local `node tests/critical-party-integration.test.cjs` passed in a **representative method-fixture harness**, including a rerun using a local copy of the real Stage 1 resolver contract. The committed GitHub test now imports the **actual** `../src/prototype/critical-executions.js`.
- Cases cover OFF/no prototype writes, opt-in install/reinstallation refusal, failed cast/no RNG, delayed hero receipt, 3-arrow single-roll, independent troop and pet skill actions, delegated pet no-double-roll, Ranger Heal, ordinary basics, Recall counters, observation cap, and uninstall.
- **Not performed:** actual full native Campaign fight tests, browser/phone test, PR #439 merge/rebase, entire existing suite, CI/build, FPS profiling, balance comparison or deployment.

## Performance and correctness limitations — do not conceal

This is **not the final production release-hook design**. For quick focused instrumentation without editing PR #439's highly active hero/engine files, the optional adapter wraps `companionFight` and `updateParty`, which are active on simulation ticks when installed. Their observation logic performs bounded but unnecessary searches/copies in crowded combat; it would violate our preferred **action-release-only overhead** if switched on in gameplay as is. **Do not wire `install(enabled:true)` into app startup.**

Before real enablement, promote the validated semantics to **small direct release hooks** in the combat owners (on a reconciled #439 branch): Roll exactly when the legal attack releases, before direct consequences are applied; pass one immutable receipt to all projectile impacts, pulses, chains, pet healing/wards and multi-target victims. Do not count an ordinary basic from cooldown inference, because a missed Recall Soldier melee emits no `melee` event and could be lost. Damage/status/heal modifications must use the original resolver and approved *skill-specific caps*, not a universal multiplier.

The adapter may identify an eligible action **after** direct damage/healing for some troop and pet paths. This is sufficient to research release ownership and attach child projectiles, but **not** to implement critical consequences retrospectively. The final source-owner hooks must run before each action's original consequence is resolved.

No new event is emitted, no extra projectile/attack/geometry/summon is created, and no rendered critical exclamation mark is present. Metadata on transient shots and delayed hero effects is research-only and never lands in serialized saves under the existing snapshot contract.

## Source coordination and next review gate

- PR #439 observed head at start of this Stage 2 pass: `6c796de8792f042293d610eb1e126ce83f793ca9`, open draft; it continues adding hero presentation, controls, skill reference and tests. **The Stage 2 source changes are only new files**. Do not overwrite `app.js`, `hero-combat.js`, `boss-combat.js`, `engine.js`, `rules.js`, `skill-reference.js`, `audio-hero.js` or `save.js` from #439.
- PR #440 remains the **same continuing draft**, not a separate Stage 2 PR.
- Owner approval of individual critical effects/caps and book bonuses remains pending. Stage 0 historical enemy registry also requires re-extraction on a final reconciled tree. Native action fixture equivalence, source-owned release injection, and target device measurements remain blocking steps before enabling combat.
- No new hero skill art/sound/HP balancing has been imported from PR #439 and no gameplay feature has shipped.

**Review decision:** This is a useful Stage 2 code checkpoint for action-identity mapping and integration contract validation, **not a Stage 2 completion certificate**. Proceed with direct hooks only after PR #439 reconciliation and per-skill critical semantics are established.
