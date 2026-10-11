# Boss identity pit stop — implementation and audit register

Status: **DRAFT — NOT MERGE READY**. Owner-approved design, independently auditable implementation checklist. This file is intentionally candid: a changed name or config value is not proof that a gameplay mechanic works.

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

## Implemented so far on this branch

- Lifebinder name and approved attack labels in boss data; Ridge Tyrant identity labels.
- Lifebinder Groundwork count of four and Warlord bombardment count of six in authored attack config.
- Raised Lifebinder normal-attendant safety cap to 12 with three generated per cast; TRUE retained established six-unit (4 + 2) warband composition; reduced Crown-style attendant render scale and names.
- Mirejaw 40%-to-0% HP-dependent damage resistance using centralized damage resolver.
- Crypt winter estate warmer floor/wall palettes and added existing cozy props.

## Audit blockers — MUST fix before ready-for-review or merge

- [ ] Implement Mirejaw Death Roll (grab, exact damage schedule, stun, release/slow, cleanup) and progressive Bog Spit slow including hero/companions and all saved/restore paths.
- [ ] Implement Choking Ash's stationary cloud, miss and movement effects, reset semantics; validate six circles' actual geometry, telegraph visibility and escape lanes.
- [ ] Implement Keeper's healer-focus AI, anchor capture/release, cooldown freezing/sabotage, and safety on death/disengage/reload.
- [ ] Implement Tyrant's knockback/slow, focused archers, Ledger Audit, immediate Ledger of Losses and still-readable attack animations. Current data labels alone DO NOT implement these.
- [ ] Validate Lifebinder four Groundwork marks target the intended positions, not merely generic linearly offset circles; validate TRUE summons receive intended attendant styling and per-cast policy without breaking baseline TRUE combat.
- [ ] Produce original junior-Crown attendant art; temporary smaller Crown enemy silhouettes are placeholders, not a finished sprite conversion.
- [ ] Complete estate environment: cozy completed rooms, half-finished wings, Crown palette, detailed construction, correct room layout; current palette/prop changes are only initial pass.
- [ ] Audit old boss name across UI, quest logs, historical saves, achievements, descriptions, audio, visual keys, event strings and deterministic fixture references. Do not rename family ID `crypt`.
- [ ] Add automated tests for all mechanics, forms, multiplayer-independent solo combat, cooldown boundary cases, summoning cap, save migration, and no offender damage change.
- [ ] Run full Node regressions, browser UI coverage, mobile/desktop, production Pages/PWA/offline checks, performance and a complete historical-save test. Verify CI on the exact branch SHA.
- [ ] Re-run Ranger/Paladin/Mage encounter audit across Normal and TRUE with multiple seeds, logging boss duration, mechanic executions, outcomes, companions, potions, hero health, and visual clarity. One Astra run is baseline, not target proof.
- [ ] Review PR diff against this spec; manually classify every check as pass/blocker with evidence before merging.

## Baseline and tuning rule

Astra observed ~13s Mirejaw; ~13s Warlord; ~17s Keeper, losing both approaching companions; ~18s Ridge, losing one; ~10s original Crypt Guardian (Lifebinder). Do not convert those single-run figures into mandatory duration quotas, and do not inflate base HP/damage unless separately approved.
