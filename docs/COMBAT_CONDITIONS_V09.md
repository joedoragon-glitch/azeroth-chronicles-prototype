# Combat conditions and secondary effects · v0.9 audit

**Scope:** player skills, companion specials/support, ordinary and ranged monsters,
night threats, ringleaders, captains, normal/TRUE bosses, traps, hazards and tactical
AI. This is a **register of existing mechanics**, not approval for new crowd-control
skills or a combat rebalance. The runtime contract comes from `rules.js` and the
actual owners; skill names, descriptions, sounds and visual cues do not grant effects.

The supported GitHub Pages/PWA game is multi-file. The version-4 save model and
existing procedural/sprite graphics remain canonical. Continue the v0.9 stabilization
release gate rather than reopening content or balance.

## Vocabulary: not every side effect is a status ailment

| Canonical concept | Representation and current behavior | Authors / entry points |
| --- | --- | --- |
| **Slow** (timed condition) | `unit.slow` is **remaining seconds**, not a speed multiplier. Hero and companions move at 65% while slowed; monsters at 50%. The longest remaining duration wins. It does not freeze movement, prevent skills or modify cooldowns. | Mage frost projectile/charged area/area spells; reedbeast/mireling spitter projectiles; Thornfang Root line, Mirejaw bog, Keeper Undertow, night Wraith/Stalker, captain attacks, rogue snares/binds/pivots, persistent patches and seal traps |
| **Haste** (timed self-buff) | `hero.haste` speeds the hero's movement to 125% during direct input **and ordered following**. Skill 4 Ranger and Skill 6 Ranger grant it. It is not an attack-rate or cooldown buff. | `hero-combat.js`, `engine.js` |
| **Damage immunity / guard** (timed defensive condition) | `unit.immune` blocks `hitParty` damage and **on-hit conditions**. Paladin/Mage Skill 4 and Skill 8 can grant hero immunity; a Soldier's automatic survival guard grants 2.5s. Reapplication does not shorten longer remaining protection. Immunity does not change collision or environmental impassability. | `hero-combat.js`, `party.js`, `combat.js` |
| **Dust cover** (temporary direct-target exclusion) | `enemy.rogueDustCoverUntil` is an absolute encounter-clock deadline. Affected Goblins cannot be *directly selected or homed onto* until it expires, and existing direct orders/locks/projectiles are dropped. They **remain vulnerable to area attacks**. This is neither invisibility nor total invulnerability. | Blinding Dust tactical maneuvers; `tacticalDirectTargetable` / `tacticalDropDustTarget` in `combat.js` |
| **Forced scatter** (timed control override) | Thornfang's Packbreaker Howl moves the struck hero/companions outward during a transient **0.6s** control override. Direct hero input, manual orders and companion AI cannot cancel it during that interval; world collision and bounded boss leash exceptions still apply. No saved status is created. | `tacticalBeginScatter` / `tacticalAdvanceScatter`, `engine.js` |
| **Shove / sweep** (instant displacement) | Successful rogue shove/scatter/sweep hits move the victim through the existing collision-aware movement function. Unlike Thornfang's special scatter, these are not a general timed loss-of-control status. | Rogue move and signature resolvers, `engine.js` |
| **Charge / leap / pursuit / withdrawal** (actor motion) | An enemy moves along a marked trajectory or repositions/retreats; charge contact can deal damage. These are movement actions by the **attacker**, not automatically knockback or paralysis of the target. | `boss-combat.js`, `engine.js`, `rules.js` |
| **HP siphon** (damage-dependent recovery) | Cinder Spitters, eligible supernatural boss attacks and Wraiths regain **15% of HP actually removed**, after mitigation, immunity and overkill. Each successfully hit living party member contributes; healing cannot exceed attacker max HP. This is not a persistent status on the victim. | `hitParty` in `combat.js`; `ashFeeding` and `vitalitySiphon` rules |
| **Independent self-recovery** (warned heal action) | Abyss Dragon's Ember Renewal heals 8% max HP; Ash Sentinel's Ash Reforge heals 10%, when below 60% HP, on their 24s/28s independent cooldowns. They are not damage or siphon effects. | `bossRecovery` and `boss-combat.js` |
| **Ranger Heal / recovery over time** (support effect) | Ranger healing can restore the hero or wounded **living** active companions over its duration; it cannot revive fallen units. Ordinary Skill 3 heals hero only; charged Skill 3 heals living active party. | `party.js`, `hero-combat.js` |
| **Patches, traps, rings and other hazards** (world effect) | Warned geometry can deal direct or periodic damage; certain patches add on-hit Slow. A hazard has its own timer, geometry and hit/tick accounting: it is **not itself** a status condition. | `boss-combat.js`, `combat.js`, `engine.js` |
| **Rally, summon, phase guard, frenzy, threat and burst compression** (AI/encounter modifiers) | Tactical rally changes engaged defenders' pursuit; summons add actors; captain/boss guards and frenzy adjust combat parameters; threat and burst compression affect AI and damage. These are **not** debuffs on the hero. | `engine.js`, `boss-combat.js`, `combat.js`, `rules.js` |

### Existing authoring keys (keep names stable during v0.9)

- **`slow`** may be a *boolean* on an attack/hazard, a *number of seconds* on an actual unit, or a duration in a charged Mage skill definition. **`slowDuration`**, **`slowSeconds`**, and **`projectileSlow`** are authored duration settings, not separate statuses. Call `applySlow(unit, seconds)` at resolution; do not assign an on-hit Slow from presentation events.
- **`immune`** is remaining protection time. It does not make an actor disappear from targeting or grant passage through solid geometry.
- **`blinds`** configures the *caster's dust-cover window*; the target is not given an accuracy debuff. Naming this "blind" to players would be misleading without that distinction.
- **`scatter`**, **`sweep`**, **`shove`**, **`dash`**, **`pivot`**, **`withdraw`**, **`bind`**, **`rally`** and **`snare`** are tactical move/effect identifiers. A `bind` currently slows rather than roots or silences; a `dash` repositions the enemy rather than disabling the victim.
- **`manaDrain`** is a **legacy, dormant authoring field** in cooldown-only mode (`resourceMode.manaEnabled = false`). Do not strip it: historical MP mode must remain reversible. The active siphon logic is based on real HP loss, not mana loss. See `COOLDOWN_ONLY_COMBAT_MIGRATION.md`.

## Global conditions contract

1. A condition with on-hit semantics is applied **only after the hit succeeds**, not merely because its telegraph overlaps a target. Immunity blocks both damage and the on-hit condition. Lethally struck companions must not retain a fresh Slow.
2. Timed Slow stacking is `Math.max(remaining, newDuration)`; a shorter reapplication never cancels a longer one. Durations are finite, positive seconds. Status timers count down in active simulation, not while the game is paused.
3. Separate **damage eligibility**, **target eligibility**, **movement control** and **collision**. Dust blocks direct targeting but not AoE. Thornfang scatter temporarily overrides orders but preserves collisions. Immunity blocks on-hit damage/debuffs but not map geometry.
4. Temporary tactical maps, dust cover and scatter do **not** persist across zone return, defeat or save restore. Existing v4 keys and legacy mana fields remain compatible. Recovery, heal cooldowns, and character training are separate persistence concerns.
5. Live balance is authored in `rules.js` or its existing subsystem table. Do not change slow strengths, class skills, warning lengths, boss healing amounts or chase rules incidentally while fixing condition bookkeeping.
6. Visual and audio descriptions must reflect the actual resolver. An animation called a "bind" does not prove immobilization; a draining attack in active cooldown mode may mean **HP siphon**, not MP drain.

## Focused v0.9 findings

- **Corrected on this branch:** Immediate boss AoE, periodic slow hazards and trap seals previously could Slow an immune unit despite `hitParty` rejecting the hit. These now require successful damage resolution and a living victim; trap and hazard Slow also preserve longer existing durations. `combat.js` centralizes timed Slow application.
- **Corrected on this branch:** A shorter hero defensive cast could replace a longer existing immunity. Reapplication now preserves the longer remaining duration, capped at the existing four seconds.
- **Corrected on this branch:** Ranger Haste had a 125% movement multiplier for direct movement but not movement orders. Ordered movement now uses the same multiplier.
- **Already intentional:** Goblin dust does not prevent AoE; enemy charges are attacker movement; all enemies have role-appropriate tactical moves/signatures; Thornfang scatter temporarily overrides hero/AI controls, but ordinary shove does not.
- **Already intentional:** MP drain is dormant, active Wraith/supernatural/cinder siphon is HP-based, and Dragon/Sentinel use independent recovery skills. No retune is authorized.

## Validation and remaining release evidence

The new `tests/combat-conditions.test.cjs` covers Slow/immunity interaction across Normal and Nightmare immediate areas, recurring hazards, seals, duration stacking, companion death, defensive buff refresh, and dust-vs-AoE. The existing `rogue-integration`, `cooldown-healing-contract`, `dungeon-pressure`, `targeting`, `rts`, `cooldown-only` and browser suites remain required.

Before claiming **v0.9 certified**, run the exact-head format/build/check/test gates, then desktop Chromium, phone Chromium/WebKit, old-v4-save reload/import, PWA upgrade/offline, and a manual representative Normal/Nightmare/TRUE encounter pass: Mage frost, Ranger haste, Paladin/Mage immunity, Soldier guard, spitter projectiles, Wraith siphon, boss slow patches, Goblin dust, knockback/scatter near walls, and trap seals. Verify hostile/status feedback remains legible at gameplay scale and on phone. Automated tests are evidence, not a substitute for practical control and clarity checks.

**Not currently authored as generalized conditions:** stun, silence, mind control, hard root, fear, player taunt or universal stealth. Do not promise testers these effects solely because an attack name implies them. New conditions should first define target types, application eligibility, timer/stack rules, immunity interaction, UI/audio notice, save lifecycle and regression coverage.
