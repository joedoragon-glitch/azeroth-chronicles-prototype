# Cooperative roster foundation · v0.8.128

This is an internal, opt-in roster/progression milestone. It is not playable cooperative mode. No Multiplayer, Host or Join button is added. `app.js`, existing Campaign methods, single-player combat, party capacity, pausing, balance and save storage are unchanged by this milestone.

## Existing campaign admission

`PrototypeCooperative.create({ Campaign, source, hostId })` creates a detached working branch from the running Campaign. It copies live enemies, projectiles, hazards and transient Map/Set ledgers directly; the v4 continuation-save serializer is intentionally not used because it cleans up active combat. The original Campaign stays untouched. Campaign's prototype is never patched. Function references, including an injected random function, are retained; this in-memory branch is not a portable network snapshot or an independently cloned random generator.

`join({ playerId, heroClass })` admits one guest when an active companion slot is free. At Expedition rank 1, two active AI companions fill the available slots, so admission returns `companion-slot-required`. The host explicitly rests a chosen companion through `restCompanion(hostId, companionId)`; the existing safe-rest restrictions still apply. No AI companion is dismissed, randomized or secretly moved to rest. A resting or fallen active companion still occupies its slot according to existing Campaign rules. The guest occupies one companion slot and never enters the AI roster. The guarded reactivation API includes that occupied human slot in its capacity check.

Leaving releases the slot but does not automatically reactivate an AI companion. The same guest can rejoin with the same class and retains their individual progress within this session. Guest records are campaign-scoped and in memory; durable guest identity/progress is future work. Joining Succession, a pending challenge, game over, or a dead host is blocked until cooperative death/Succession rules are designed. This adds no restriction to ordinary single-player Succession.

## Shared and individual state

The team owns crowns, potion inventory, tonic stock, equipment tiers and reforges. Both character records reference this one team resource store; joining does not add the guest's default starting money or items. Campaign-wide quest state, rescued specialists, expedition training, companion upgrades and the AI roster remain in the one branched Campaign.

Each hero has their own class, XP, level, health, earned talent points and cooldowns. Class-specific training is not integrated yet; the next gameplay pass must define how shared upgrades apply across different professions rather than silently treating all training as individual. `awardExperience(playerId, amount)` applies existing level-growth rules to that connected character only. It accepts finite non-negative integer host awards up to 1,000,000 per call. Guest levels do not resize/heal the host's AI companions; host levels retain the existing companion inheritance behavior. This method does not decide kill/quest XP distribution; that policy must be applied by the future authoritative command/reward layer. It is not a client command endpoint. Skill training and death rules likewise require the actor-aware gameplay pass.

`character(id)` and `connectedCharacter(id)` return detached copies for observation. `spend(id, amount)` rejects disconnected/unknown actors and uses the existing crown transaction checks. Raw `campaign`/`team` access belongs only to trusted host code, not incoming network payloads.

For a future fresh cooperative start, `recommendCompanion([class1, class2], random)` favors the canonical Paladin companion (`soldier`) if both heroes lack a Paladin, favors the archer if both heroes are Paladins, and randomizes when either role complements the pair. Existing campaign companions are preserved; the recommendation does not mutate a roster.

## Explicit runtime boundary

The working branch deliberately refuses `tick()` and `snapshot()`: the current combat loop and v4 serializer know only one hero. Silently calling them would produce misleading or lost state. `finishSolo()` requires the guest to leave, materializes the host's shared resources and returns the branch as an ordinary Campaign with the existing simulation/save methods restored. It never replaces the live app Campaign or writes a save automatically. A later integration must explicitly adopt and persist that returned Campaign and store the guest separately.

The earlier `Prototype.setSessionMode` hook is not connected to this module yet. No timing or input rule changes occur in ordinary play merely because this script is loaded.

Next implementation: actor-addressed commands and a single authoritative two-hero simulation step, covering enemy threat, projectiles, area damage, healing, independent targeting, reward attribution, death and joint travel. Then add shared-session persistence and a two-browser transport. Keep all of those opt-in and preserve the current single-player branch.

## Verification

`tests/session-cooperative.test.cjs` covers full-party refusal, explicit AI rest, admission and duplicate guests, slot release/rejoin, shared money/items/equipment, independent XP/levels, detached observations, live combat-state preservation, transient ledger isolation, mode/challenge guards, safe return to a v4 solo Campaign, and an unchanged original Campaign/prototype. Existing single-player browser tests remain the presentation/control preservation gate.
