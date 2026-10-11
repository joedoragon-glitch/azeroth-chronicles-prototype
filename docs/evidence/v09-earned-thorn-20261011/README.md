# v0.9 earned-action pilot — 2026-10-11

Status: bounded early-game milestone passed; all six broad acceptance follow-ups remain open in #213.

Runtime: released v0.9.0 commit `d7d2c22485b08265b31bf595305ef952b40b72cd`; no runtime changes. Controller checkpoint: `a95ecd531ad5c8f4ba7a4bf5000698b3cf8af991`. The final script differs only by Prettier formatting.

## Method

Fresh Normal Ranger campaign, fixed RNG 0.9, instrumented Node engine controller using public casts, construction, rest, interaction, training, talents, and ordinary move/attack orders. Geometry is read directly from the engine. Construction and combat advance through 0.1-second ticks; transient rendering effects are consumed as in the shell. No resources, stats, enemy HP, positions, or construction progress are injected. No earned save rollback during the route.

Reproduce from repository root:

```sh
BETA_NATURAL_OUTPUT=test-results/earned-thorn node scripts/beta-earned-thorn-audit.cjs
```

## Observed results

- Free barracks completed through 30 seconds of simulation, progress 4.
- Goblin camp, orchard and mill pond reached; earned level 4 by the final checkpoint.
- First normal Thornfang defeat is recorded at engine event time 98 in `02-save.json`; that snapshot records a 24-second boss encounter. The controller encountered him incidentally during the initial route. Later preparation also produced a respawn defeat at event time 297. The final aggregate boss duration is 18 seconds and must not be confused with the first encounter.
- `Thornfang defeated` in the raw report at time 527.4 is a delayed observation of an already defeated boss, not the kill time or a separate fight.
- The preparation controller timed out pursuing an ordinary enemy (`combat stopped` at 524.5); this was not a hero death. Its route efficiency needs improvement before a wider campaign trial. This result does not establish a game defect.
- Mira rescued at event time 539; skill slot 2 learned for 40 earned crowns; Expedition Rank 2 trained (free first upgrade). Final level 4, 295 crowns, 90 kills including repeat encounters, zero deaths, both starting companions alive. No equipment upgrades were exercised (weapon and armor tier remain 0). Paid fallen-companion recovery was not exercised because nobody fell.
- Early earned-state restore assertions passed for crowns, XP, skills, equipment fields, quests and living party state. Although the raw inherited assertion label says living/fallen party, no fallen-party case occurred in this run.
- A separate final-snapshot restore check passed for level, XP, crowns, skills, weapon, armor tier, talents, normal boss flags, rescue flags, quests and Expedition Rank 2. The input snapshot was unchanged. This is current-engine state, not a historical player-created export/import.

## Evidence and scope

`earned-saves.tar.gz` contains all twelve chronological full save snapshots, the early earned checkpoint and raw report. `save-sha256.json` verifies each extracted file. `report.json` is the unedited run output. Save names match the report event sequence (`00-save.json` fresh through `11-save.json` final).

The controller was syntax-checked; its final formatting check passed. Released runtime files are unchanged. Existing full release CI was not repeated. No main merge or deployment was performed for this pilot.

This is engine-action evidence, not live browser UI validation, human usability, physical hardware, a complete campaign, Nightmare, Awakening or TRUE validation. Browser access showed an existing campaign, which was closed without altering its save; a local browser install was unavailable. Historical player saves and physical phone/Chromebook tests remain outstanding.

Next engineering pass: resume a copy of the preserved earned state for Crypt/equipment and onward progression, improve controller target/time-out reporting, and add direct encounter timestamps before expanding the route. Do not mark a broad acceptance item complete based on this one deterministic pilot.
