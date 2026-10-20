# Nighttime movement and basic attack rate — 20 October 2026

Published as dev.97 through [PR #331](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/331), merge `7650c732a9aefd34c69b611c765bbb31767bd6c7`. Packaging-only run `39389110093` succeeded; exact live bytes match. Normal release workflow restored and temporary publisher removed. [Publication receipt](evidence/NIGHT_TEMPO_DEV97_PUBLICATION_20261020.json). Owner play is next.

Dev.97 follows published dev.96 (`f896ac3be3c00ffaa560b6757fb3c5e92740b5cd`). Joel first requested a small increase, then explicitly revised it to **10% at night, rising with the boss counter to 25%**. The earlier 2–5% proposal is superseded and was never published.

`rules.balance.nightTempo` owns `1 + min(0.25, 0.10 + 0.0075 × nightPoints)`: zero, ten and twenty unique eligible boss-form victories yield 1.10×, 1.175× and 1.25×. Daylight and peace return 1×; Nightmare follows its existing night condition. HP/damage escalation is unchanged.

The multiplier affects enemy combat walking: pursuit, ranged withdrawal, movement during mobile Rogue casts, support approaches and regroup/escape travel. Normal collision, Slow, frenzy, pursuit bursts and captain movement phases compose with the multiplier. Narrative patrol/idle routes, scripted attack dashes and projectile speeds are left alone. Heroes, companions and pets receive no speed modifier.

Melee basic cooldowns shorten by dividing their existing duration by tempo. Ranged recovery accounts for the full aim-and-shot cycle while keeping the existing aiming warning intact; the transient aim record retains its original duration. Special attack warnings/recovery, support healing's ten-second cooldown, Rogue's three-second reuse, summon clocks and healing pulses are unchanged. No new frame/timer loop or persistent save field.

Focused checks passed: night-tempo progression/day/peace/Nightmare, actual melee/ranged cycle timing, unchanged aim duration and actual pursuit displacement; existing pursuit-burst, Slow/cooldown and Rogue cast-continuity checks; area-healing preservation; build/generated-source/assets and changed-file formatting. No broad game suites, browser matrix or hosted game CI. FPS source, travel collision and artwork remain unchanged. Physical-device difficulty/pacing remains for owner play.

Publication and workflow cleanup are complete. No automatic further work follows publication.
