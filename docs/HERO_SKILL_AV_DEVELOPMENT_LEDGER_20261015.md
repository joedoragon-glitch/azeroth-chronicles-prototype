# Hero skill audiovisual development ledger

15 October 2026. Development only. Owner explicitly defers tests, gameplay runs,
build/validation commands, CI, release PRs, merges and deployment until workstreams
are combined. Source inspection is not runtime validation.

- Branch: `feature/hero-skill-av-20261015`
- Authoritative parent: `feature/hero-skills-2-4-on-snapshot-20261015`
- Parent commit: `1d142ea7936e4004e697fb9ebbb7205eb6d33cf5`
- PR #305 is an older incomplete draft and is excluded.
- Scope: presentation of all 24 active skills and their charged forms; no passives,
  balance changes, input timing changes or new gameplay resources.

## Checkpoints

1. Source inspection: read architecture, development state, sprite workflow,
   consolidated skill review, cooldown/rotation audit, static balance audit and
   the current hero/shared combat, rules, shell, renderer, effects/audio/mixer,
   asset inventory, build template and CI trigger configuration. Existing Canvas
   effect queue and Web Audio voice/mixer lifecycle are the extension points.
2. Presentation hooks: additive cast/chain/area-recipient metadata, real projectile
   launch/impact identity, and actual displacement observation. Implementation in
   progress; no tests executed.

## Resume

Continue the dedicated hero presentation and audio owners, wire them into the
existing queue/render/audio facade and offline script graph, document every skill
mapping, then commit recoverable progress. Never describe this branch as tested.
