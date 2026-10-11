# Boss identity pit stop — implementation and audit register

Status: **Implemented on isolated PR #230; final exact-head CI and owner merge authorization required**. This register distinguishes actual game code, test evidence and deliberate post-merge balance observation.

## Invariants

- Scope is existing boss families `crypt`, `mire`, `archive`, `ridge`, `warlord`; preserve their IDs, world positions, unlock chains, rewards, default damage and base HP, and historical saves.
- Apply shared approved ability identities to Normal and TRUE encounters. Retain TRUE's existing difficulty scaling, encounter transitions, enhanced summon behavior, and special attacks except for explicitly authored changes.
- Never use a single-HTML compatibility constraint to restrict assets or design. GitHub Pages/PWA multi-file is canonical.
- Performance bounds and readable counterplay matter, including on touch devices.
- No automatic merge. Audit before declaring ready.

## Accepted designs (source of truth)

### Mirejaw (`mire`)
- Scaly hide: incoming damage reduction of 40% at full HP, falling linearly to zero at 50% HP; never regenerates in the same combat. No armor bar.
- Jaw Snap landing on exactly one hero or companion triggers Death Roll: 1.5 s, three damage ticks totaling one standard Jaw Snap, victim cannot move/attack/cast during roll, victim then has 35% slow for 2 seconds. Mirejaw cannot launch another action during roll. Existing attack damage is not silently doubled.
- Bog Spit: keep name, projectile/ground damage, and existing duration. Inside the mud: movement speed 75% (first second), 60% (second), 45% (third), 35% thereafter. Accumulation stops upon exiting, movement recovers over 2 seconds; no immobilization or additional damage.
- Other attacks unaffected.

### Ashen Warlord (`warlord`)
- Choking Ash: 180-unit stationary circle; persists 6 seconds; 12-second cooldown after expiration. While inside, victims suffer 35% miss chance and 30% movement slowdown, lingering 2 seconds after exiting. Applies to hero and companions, no damage, no direct Warlord debuff.
- Banner Bombardment: six simultaneous clearly marked impact circles, 1.8s existing warning, each hit's original damage, navigable escape routes. Other authored moves unchanged.
- Attacks' base damage and Warlord HP unchanged.

### Drowned Keeper (`archive`)
- Intelligent healer priority: living Archer support companions preferred first, then hero once none remain. Respect line-of-sight and combat/leash constraints; avoid infinite chase.
- Anchor Swing: hook one victim, prioritizing Archer; pull and restrain without movement, skills, or healing. Keep existing impact damage. Captive remains until Keeper needs anchor again; then release, not upon generic damage. Frozen captive healing cooldown resumes on release. Do not leave orphaned captive state after death, leash/reset, dungeon transition, or load.
- Cooldown Sabotage: separate telegraphed, dodgeable attack (1.5s warning; 12s between attempts), adds 3s to longest remaining cooldown of chosen Archer's healing first, otherwise chosen hero skill. No new damage. Avoid affecting unavailable/disallowed skills and respect frozen captive timers. Existing Keeper offenses unchanged.

### Ridge Tyrant (`ridge`)
- Identity: Master of Coin, economical use of the mountain logistics site. Coinage Blow replaces Hammer Blow's label with original damage and behavior.
- Rolling Cargo: Boulder Throw replacement; existing warning and damage, knockback; implement using actual geometry rather than pretend a cart exists.
- Toll Collection: replaces charge, existing damage, shove and 2-second slow.
- Payroll Order: former summon call, contracted archers prioritize top damage dealer using a bounded, deterministic threat ledger.
- Ledger Audit: every 12s marks highest damage dealer for 5s, with archers focusing them.
- Ledger of Losses: opens ledger immediately at combat start; permanently removes **ground warning graphics**, not attack execution windups, sounds or readable character motions. Should never invisibly eliminate all reasonable counterplay; preserve TRUE behavior and basic combat flow.

### Lifebinder (`crypt`), formerly Crypt Guardian
- **Only a rename of existing family `crypt`**. Normal 'Lifebinder', TRUE 'TRUE Lifebinder'. Great Lifekeeper deputy promotion and duplicate boss deferred; do not add a second boss.
- Same HP, base damage, progression, rewards and underlying boss character model.
- Binding Sweep: same cone behavior. Stay Alive: same projectile volley.
- Groundwork (former Draining Ground): four simultaneously marked, persistent damaging circles using existing warning and base damage; target hero, nearest companion, and two flanking escape-limiting positions; retain dodgeable escape routes.
- Call the Attendants: each cast calls **three** estate retainers in junior Crown style (dark crimson/black/muted gold, lighter uniform, guard-servant blend), not generic skeletons or full Crown military. They persist while alive; normal three-unit living cap is bypassed, but a higher safe ceiling is required for performance. Existing summon cooldown stays. TRUE form retains its special warband composition and scaling, with ability identity respected.
- Forest Crypt is the Dark Lord's **unfinished private winter estate**: older crypt remains only as repurposed heritage; completed spaces deeply cozy and Crown-styled (black/crimson/gold, warm amber light, rugs, hearths, chairs, game tables, guest quarters), active construction in unfinished rooms (scaffolds, stone, lumber, tools), unobstructed walkthrough, functional workstations, safe save migration and unchanged combat geometry.

## Implemented and source-audited

- [x] Mirejaw has the 40%-to-0% health-dependent scales, one-victim 1.5-second Death Roll with three damage beats and no duplicated upfront bite damage, 2-second post-release Slow, plus Bog Spit's progressively stronger movement penalties and 2-second fade. All movement/casting restrictions are owned by real combat state.
- [x] Ashen Warlord's stationary 180-unit Choking Ash has 6s active/12s downtime, visible ground art, accuracy and movement penalties with a 2s aftermath. Banner Bombardment resolves six **simultaneous** circles with authored dodge lanes and unchanged per-hit damage.
- [x] Drowned Keeper selects reachable living Archer healers first, locks Anchor Swing's single hooked victim until the next anchor attack, suppresses actions/heals and freezes the held Archer's healing cooldown. Cooldown Sabotage is a distinct warned non-damaging attack with a 12s attempt cooldown and a 3s extension on the chosen heal/hero skill. Death/reset/load orphan-release safeguards are present.
- [x] Ridge Tyrant displays Ledger of Losses at engagement, removes the Tyrant's ground warning graphics (not windup time or actor animations), tracks actual damage for his mark/payroll archers, uses a visible moving Cargo projectile with shove and a slowing Toll Collection charge, and retains base HP/damage.
- [x] The existing `crypt` family is **renamed**, not duplicated: Lifebinder / TRUE Lifebinder. All base progression, family IDs, first-clear rewards, captive and TRUE transitions remain under old stable keys. Existing-save names are normalized on restore.
- [x] Groundwork chooses four positions **at cast time**, then freezes them for telegraph, impact and persistent hazard resolution. The normal-form Call the Attendants supplies three per cast with a safety ceiling of twelve; TRUE retains its 4-minion / 2-ringleader warband.
- [x] Attendants are custom junior Crown-style **estate staff**, not the normal military Crown soldier presentation. Their style is an approved procedural art family and does not demand a separate sprite asset to block this release.
- [x] Forest Crypt still has its older repurposed core, but the new winter estate shows warm Crown/crimson-gold floors, contrasting walls, rugs, upholstered lounges, fireplaces and active construction. Decor version 4 migrates previously visited Crypt saves without changing geometry or quest/service gates.
- [x] Legacy VFX/audio identities remain the stable `crypt` family slots. A new authored VFX recipe and updated exhaustive inventory cover Keeper's additional sabotage ability; old presentation IDs remain stable.
- [x] Normal/TRUE mechanics, names, summon population, solo/squad state, visual recipe coverage, event routing and first-boss contract have automated regressions in `tests/boss-identity-pitstop.test.cjs` and existing compatibility suites.

## Strict pre-merge verification

- **Required:** the exact PR head must pass Node regressions, production build/syntax, snapshot/source-ownership checks, Chromium and WebKit mobile/browser tests, historical-save tests and Pages artifact checks. Read this from GitHub Actions on the **final SHA**, never from a previous cancelled run.
- **Required:** retain the baseline-equivalence gate for unchanged simulation and all unrelated regions. The `crypt` presentation is intentionally different; the modified comparison explicitly asserts that it changed visually and checks that drawing still does not modify campaign state. `mine` replaces the changed Crypt as the unchanged simulation control.
- **Required:** inspect the PR diff and confirm no unrelated gameplay damage/HP retunes, no enemy-family ID changes, no changes to the app's shared frame/input/audio loop, and no new single-file packaging requirement.
- **Release policy:** do **not** merge without the author's explicit instruction.

## Playtesting after release preparation

A fresh human/AI encounter playthrough with multiple classes and seeds is useful for tuning kill times, actual mechanics displayed, companion losses and touch readability. It is intentionally **not** evidence that these mechanics are broken; it must not be used to quietly increase boss base HP or damage. Re-evaluate pacing only after code correctness and user review.

## Baseline and tuning rule

Astra observed ~13s Mirejaw; ~13s Warlord; ~17s Keeper, losing both approaching companions; ~18s Ridge, losing one; ~10s original Crypt Guardian (Lifebinder). Do not convert those single-run figures into mandatory duration quotas, and do not inflate base HP/damage unless separately approved.
