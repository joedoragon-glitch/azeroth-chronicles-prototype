# Save recovery checkpoints — dev.176

Owner scope: bounded automatic checkpoints and a player-facing recovery path,
following the dev.175 protection fix. Base: published dev.175,
`e4e8234b5f784ddc9492fe79d956fd0a696b12af` / PR #438.

## Retention and work budget

`persistence.js` owns one `azeroth-v4-<mode>-checkpoints-v1` bundle per mode.
Each bundle contains at most three distinct validated campaign byte strings,
newest first, and is capped at 500,000 JavaScript characters (about 1 MB of
UTF-16 storage). Large saves or storage quota pressure can reduce retention.
Normal, Nightmare and Developer slots remain separate. Existing v4 primary
keys/schema and bounded unreadable-original/v2 backups remain compatible.

The first successful load/save seeds protection. During ordinary saves,
rotation is at most once per 60 seconds, keeping the preceding durable primary;
it does not rotate on each five-second autosave. Duplicate bytes do not consume
another slot. The interval persists across restarts; clock rollback allows a
fresh checkpoint rather than blocking rotation indefinitely. Explicit import,
new-run and accepted-recovery boundaries also preserve the preceding valid
primary when possible. Incoming invalid live state cannot enter the history.

Unchanged bundles reuse parsed metadata, and primary bytes already validated
by the load/save owner avoid another restoration during checkpoint creation.
Recovery instantiates candidates only when the player requests inspection.
There is no per-frame checkpoint work and no change to combat cadence.

Count/size/quota pressure removes oldest checkpoints first. Failed atomic
bundle writes preserve the previous bundle. Optional backup failure does not
block ordinary primary saving; a warning asks for an export. If primary growth
hits quota, older checkpoints can yield space, retaining at least one. A failed
primary write retains the previous primary. Archiving a failed-load original
remains mandatory before an explicit replacement can succeed.

## Player flow

A failed or missing primary with retained recovery data opens the protected
save menu. **Try recovery** searches the primary, three recent checkpoints,
preserved originals and applicable v2 sources. It uses only the existing v4
restoration and documented v2 migration owners; unknown schema versions,
malformed JSON and inconsistent states are not repaired by guessing.

Up to three valid, mode-matching options are shown. Review displays hero class,
level, location and checkpoint time (or an unavailable-date label), with a
warning that progress after that checkpoint can be lost. Inspection/cancellation
writes nothing. **Recover this run** revalidates private source bytes, checks
that the primary has not changed since preview and requires writer ownership.
Only after the recovered primary is written does the shell switch campaigns.
The failed original stays preserved. Import and accepted recovery share the
same existing profile/restart/HUD adoption path. English and Spanish are covered.

No usable candidate leads to export/import guidance. Backups cannot reconstruct
lost data from before they existed. All local checkpoints share browser storage
with the primary; manual exports still protect against clearing all site data.
Recovery is for consistency/compatibility, with no accusation of cheating.

## Verification and handoff

Focused checkpoint/recovery tests pass during implementation: retention,
ordinary-save throttling and restart interval, count/size/mode boundaries,
invalid entry rejection, documented migration, preview/cancel/accept, exact
original retention, stale/non-owner fencing and quota failures. Existing
persistence-safety and writer tests also passed before the final focused pass.
Final focused results and remaining limitations are recorded before handoff.
No full-game suite, browser matrix, PR, merge or deployment follows automatically.
