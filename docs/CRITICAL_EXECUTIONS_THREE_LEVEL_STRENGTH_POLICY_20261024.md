# Critical Executions — Three Strength Levels and Independent Global Tuning
**24 October 2026 · Azeroth Chronicles · owner-directed revision · PR #440**

## Owner's decision: one effect identity, three pre-authored strength settings

The purpose of this change is to avoid the enormous approval burden of independently inventing and reviewing multiple bespoke critical variants for every combat move. **Each authored skill has a defined critical *consequence*, and that consequence has three intensities**:

| Level | Intended feel | Operational policy |
| --- | --- | --- |
| **1 — Modest** | Reliable, restrained improvement | **Default for initial release**. Protect balance; never change the underlying attack's aim, action cadence or safety. |
| **2 — Meaningful** | Noticeably better original move | Intermediate values; use when field testing suggests Level 1 is too subdued. |
| **3 — Strong** | A special critical that really matters | Deliberately dramatic, but *not* an unlimited multiplier or a fourth level. Still honors protections and boss fairness boundaries. |

**This is strength, not chance.** A normal action has its previously designed chance of entering a critical outcome (hero + pets/troops and world each begin at 10%). Level 1→2→3 changes the critical outcome **on a successful critical**, not how frequently the roll succeeds. Codices remain a separate future chance/progression system unless a later explicit design extends them to effect potency.

## Three independent intensity groups, each with 1–3

- **Hero**: one global slider for all three hero classes. No new per-class UI or player-facing option now.
- **Companions**: Soldier, Archer/Ranger and all 11 pet families inherit this separate intensity. No coupling to Hero.
- **World**: ordinary hostiles, ringleaders, captains, bosses, TRUE forms, night creatures and enemy support actions. *Stage 3* will author and hook their critical consequences; the World intensity control exists now.

All three defaults are **Level 1** in all three existing modes (Normal, Nightmare, Developer). **Nightmare World Level 3** is supported as an *explicit optional developer override*, NOT activated automatically. Thus adjusting monsters never inadvertently buffs/nerfs the player, and increasing pet critical strength never changes the hero's own critical strength.

## Implemented code, still dormant in production

- \`src/prototype/critical-levels.js\` — independent three-group, three-mode tuning config; bounds-validated integer settings \`1|2|3\`; explicit per-action outcome registry for the **51 PR #439 hero families**, **6 Soldier/Archer core moves + Ranger HP/MP support**, and **11 pets × 3 moves (33)**. This is **92 individual authored action keys**. Every key chooses an eligible existing consequence (hit potency, Slow/Weaken duration, heal total, taunt, protection, displacement, retreat suppression, etc.). There is **no fallback to doubling damage** for unregistered moves; such keys return no description.
- \`src/prototype/critical-party-integration.js\` — the previously dormant, opt-in Stage 2 reviewer now binds one selected strength/effect to **the action's release receipt**, if and only if the action was critical. The strength is frozen at release and shared by the three-arrow burst, delayed Cross/Hawk, etc. No skill mechanic has yet consumed the receipt to modify an outcome, and the opt-in adapter itself is **not loaded by Campaign**.
- \`tests/critical-levels.test.cjs\` and strengthened \`tests/critical-party-integration.test.cjs\` — cover 3 independently adjustable groups, per-mode overrides, 92 explicit authoring keys, invalid levels, no universal fallback, progressive values, existing-effect enhancement with caller caps, RNG separation and in-flight snapshot isolation.
- Public development configuration interface on the optional Stage 2 controller: \`criticalLevels()\` and \`setCriticalLevel(group, level, mode='normal')\`. This is not a new visible player setting or persistent save field.

Example **development-only configuration** after explicit adapter installation:
\`\`\`js
controller.setCriticalLevel('hero', 1);
controller.setCriticalLevel('companion', 2);
controller.setCriticalLevel('world', 1);
controller.setCriticalLevel('world', 3, 'nightmare'); // Nightmare only
\`\`\`
Note that the Stage 2 integration presently owns **only party action receipts**. The World configuration works and is testable, but actual world actor effect integration starts with Stage 3. There are deliberately no changes to old saves, UI or published builds.

## Centralized starter numbers (NOT approved balance telemetry)

One shared small tier table per **type of consequence** means further balance tuning is a quick central change rather than rewriting every move. The proposed values are:

| Existing outcome / lever | Level 1 | Level 2 | Level 3 |
| --- | ---: | ---: | ---: |
| Existing hit damage | ×1.08 | ×1.20 | ×1.40 |
| Existing heal amount | ×1.10 | ×1.25 | ×1.45 |
| Existing Slow/Weaken/Vulnerability duration | +0.20s | +0.50s | +1.00s |
| Existing ward/haste duration | +0.30s | +0.75s | +1.40s |
| Original ward damage reduction (when applicable) | +0.015 | +0.035 | +0.060 |
| Existing displacement distance | ×1.08 | ×1.18 | ×1.30 |
| Ranger Hawk same-retreat suppression | +0.20s | +0.50s | +1.00s |
| Existing summon recipient HP (future Stage 3) | ×1.05 | ×1.15 | ×1.30 |

Additional duration levers in source for Silence, Taunt and cooldown sabotage are similarly bounded to three values. These **are initial authoring proposals**, not measured or approved combat balance results. We can adjust a *single tier entry* after playtesting. The existing collision, maximum HP, maximum reduction, Slow stack/debt, healing eligibility, spell-immunity, targeting and protected boss rules always take precedence. No modifier automatically adds another projectile, summoned minion, target, hazard, status category, damage tick or cast.

\`enhanceExisting(receipt, existingValue, expectedLever, {min,max})\` is a small typed calculation helper. The owning native resolver must pass its actual legal bounds and invoke it **once at the correct consequence stage**. It does **not** automatically change spells simply because a critical receipt exists.

## Performance design

Each actor group setting lookup is an O(1) lookup on **the actual released action**. Authoring registry construction is performed once when imported. No 92-entry scan occurs on every tick or attack; no search for all units' settings, new particles or background timers. An older in-flight arrow retains its old level if a developer changes the tuning mid-cast. Critical odds remain isolated from general Campaign random rolls.

This adds **no active gameplay cost** until the modules are imported and installed. The prior Stage 2 review adapter still wraps per-tick party methods when manually installed for tests, so **it is not production-ready**: direct source-owned release hooks are a required Stage 2 completion gate. Future performance profiling still compares disabled, shadow roll, effects without visuals, and effects with visuals.

## Sensitive action-specific follow-ups (do not silently guess)

- **Hawk Interception**: suppression only matters against a *currently retreating* target; if the target isn't retreating, define a meaningful same-action fallback critical consequence (e.g. its existing damage), without broadening retreat interception.
- **Paladin Shield Stance**: critical applies to a real *stance-raise*, not the button press that *lowers* it. Improve mitigation within actual native caps.
- **Summons / command-only actions**: Level 3 must never create an extra troop, bypass scene caps or repeat a warned attack. Any troop-vitality modifier must be applied once at the existing summon and then remain immutable.
- **Ranger Heal and pet healing**: increase the original total budget once. No rolls or bonuses on individual healing ticks, recipients, or pet contact stages.
- **World moves**: Stage 3 must inspect actual current \`rules.js\`, attack-source and boss extension semantics (including PR #439 changes) and explicitly choose an existing lever; \`world\` intensity by itself does **not** authorize a universal world damage boost.
- **Codex books**: retain the five dungeon books' original *critical chance* reward concept unless the owner later approves optional effects on intensity. Do not quietly make a book upgrade a global intensity level.

## Validation and change boundaries

During this checkpoint, the three checked-in focused contract test files (\`critical-executions.test.cjs\`, \`critical-levels.test.cjs\`, \`critical-party-integration.test.cjs\`) were executed from fetched GitHub source in a **JavaScript CommonJS compatibility harness with a small Node assert shim** and passed. This is a useful logic check but **not** native Node test runner, repo build, browser/E2E, CI or hardware benchmark. No full game suite was started.

**PR #439** remains an open draft, observed head \`7b8ac015d777b8cb60a560e80032bf3705e46f25\` as this work began. #440 does not overwrite #439's hero combat, UI, audio, timing or saved progression. No gameplay, merge or deployment was enabled here.

**Decision:** Use the three-tier approach as the approved *architecture*, with Level 1 defaults and independent Hero / Companions / World settings. Treat exact numeric amounts, boss exceptions and the ability-by-ability integration as review candidates until focused native tests and playtests provide evidence.
