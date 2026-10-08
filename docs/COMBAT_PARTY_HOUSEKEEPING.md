# Combat and party housekeeping — prepared v0.8.88

Joel narrowed this pass to the tangled combat and party responsibilities, then explicitly requested separate ownership for hero profession skills and boss-related attacks. Storage-denial handling, malformed imports and long-session stress boundaries are deferred. The baseline is the reconciled regional release, commit `6a20a291fc0547e372f699e597f1151d08ec6bb8` (v0.8.87). The earlier regional branches and the other chat's checkout are untouched.

## Change

| Owner | Responsibility moved intact | Methods |
| --- | --- | ---: |
| `src/prototype/hero-combat.js` | Paladin, Mage and Ranger skills, basic combos and hero skill mana costs | 5 |
| `src/prototype/boss-combat.js` | Boss attack selection/sequences, geometry/resolution/motion, summon policies and spawning; existing shared captain/night attack primitives | 17 |
| `src/prototype/combat.js` | Shared targets, damage, mana drain, segment geometry, projectiles/hazards | 6 |
| `src/prototype/party.js` | Companion creation/roster/recruitment/recovery, active/reserve selection, labor/deposits, formations/doctrine/Recall, automatic specials and Ranger support | 42 |

The pass moves 70 methods out of the engine and reduces it from 5,636 to 3,507 lines (about 38%). All four modules install the existing Campaign method descriptors and receive content/rules explicitly. They do not import the engine, own browser state or maintain a second campaign state store. The engine retains the constructor, simulation update order, enemy AI, encounter population/engagement, death/succession, infrastructure commands and quests. Companion progression remains in `progression.js`.

All extracted method parameters and bodies are unchanged after ignoring formatting and parser location metadata. Live rules/content, navigation, renderer, visuals, audio, presentation CSS, save schema and storage implementation are unchanged. The browser template, shared asset inventory, generated entries and service worker load/cache all four new modules before the engine. Event-coverage tests follow the script inventory so moving an event emitter cannot accidentally remove it from audio contract checks.

This is an incremental ownership improvement. `cast`, `updateParty` and `updateEnemies` remain substantial methods. Boss combat calls shared enemy creation/engagement and captain services; shared combat calls death/kill services; party calls world, navigation and progression services through Campaign. A new framework or an independently simulated subsystem is not required for this cleanup.

## Preservation checks

Run the comparative tool against an untouched checkout of the baseline:

```sh
node scripts/compare-housekeeping.cjs ../combat-party-baseline --exact-methods
```

The optional `--exact-methods` flag adds parsed-method and descriptor checks for extraction-only passes. Without the flag, behavior comparisons remain usable for later internal refactoring. The tool now records the actual baseline commit and accepts balance declarations from their current owner.

- The constructor and 285 public instance/static method/accessor bodies and descriptors match the baseline. The 282 instance methods/accessors have one owner each across engine and domain modules.
- 427 deterministic live/transient/result/snapshot comparisons match. The 12 class/mode/Succession scenarios cover ordinary Skills 1–8, charged Skills 1–3, movement/basic attacks, Ranger support, Recall/reserves/fallen units, progression and death/succession. The matrix includes 184 boss attack cases: every authored attack, both forms, both modes, with high/low HP stages and subsequent motion/projectile/hazard updates.
- All 20 native Canvas scene comparisons match pixel for pixel: five regions and five main dungeons at desktop and phone dimensions. Parsed CSS, content, balance and existing rules match.
- `tests/campaign-domains.test.cjs` loads the actual offline browser script graph in a DOM-free/CommonJS-free VM and compares combat/party simulation with the Node entry for every class and mode. Existing gameplay regressions cover companion skill choice/cooldowns, formations, protection, labor, queues, recovery, terrain/line of sight and boss mechanics.

The incomplete-hold browser probe now advances a controlled 350ms clock within one browser turn. Previously, separate runner calls could exceed the 650ms charge threshold on a slow viewport and incorrectly test a complete hold. It asserts that charging is incomplete and spends no MP/cooldown or damage; the separate native keyboard/mouse/touch hold tests remain real-time.

The reproducible comparison evidence is in `docs/evidence/COMBAT_PARTY_EQUIVALENCE.json`. Exact methods and selected scenario/scene equality provide strong preservation evidence, not proof of every possible play state or a performance claim.

## Release status

Prepared on `codex/combat-party-housekeeping`; no push, merge or deployment is performed by this pass. The prior publication pause remains in effect. WebKit must pass in the release environment: this workspace has no WebKit executable, so its local phone suite cannot start. Local verification is complete as recorded below.


| Check | Result |
| --- | --- |
| Build and generated-entry/offline/syntax check | Pass, v0.8.88; 34 campaign assets |
| Formatter and whitespace checks | Pass |
| Non-browser regression suites | 41 passed |
| Exact-method/behavior/scene comparison | Constructor + 285 method bodies/descriptors; 427 behavior comparisons; 20 identical scenes |
| Browser/CommonJS domain integration | All three professions in both modes passed |
| Full Chromium desktop/phone matrix | 224 checks passed at seven viewport sizes |
| WebKit phone suite | Cannot launch: WebKit executable absent; required before release |

One earlier Chromium run reported 25 differing pixels around button edges in the unchanged CSS screenshot comparison. The untouched baseline probe and final full matrix passed with the existing exact-pixel assertion. No fixture, CSS or screenshot tolerance was changed. Chromium used the available local executable with LCD text disabled; it is local verification rather than a claim of real iPhone testing.

## Integration note

This report records the combat-only extraction against v0.8.87. The branch was subsequently rebased onto main's v0.8.88 audio foundation and extended with the prepared v0.8.89 economy/EXP pass. See `ECONOMY_EXP_HOUSEKEEPING.md` for the combined candidate's current checks and `ECONOMY_EXP_EQUIVALENCE.json` for the comparison against the untouched combined combat/audio baseline. The original combat evidence was retained rather than overwritten.

Joel subsequently authorized publication of the combined combat/economy work. The pause recorded above describes the earlier combat-only state; release proceeds through the existing GitHub checks and live verification.
