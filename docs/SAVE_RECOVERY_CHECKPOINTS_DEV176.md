> **28 October 2026 successor configuration (proposed dev.214 / PR #575):** The checkpoint bundle now retains **one** validated recent checkpoint per mode, with a **2,000,000-character maximum encoded bundle**, replacing the former three entries / 500,000 characters. Old three-entry bundles remain readable for recovery; new checkpoint writes retain only the latest. If the sole checkpoint prevents a **primary** save due to storage quota, the writer discards the optional checkpoint and retries the primary write once. Unrelated storage errors do not delete checkpoints. The v4 save format and existing storage keys are unchanged. This source description is **not evidence of publication or device verification**; the dev.176 design and test receipts below are retained as history.

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

Focused checkpoint/recovery tests pass: retention,
ordinary-save throttling and restart interval, count/size/mode boundaries,
invalid entry rejection, documented migration, preview/cancel/accept, exact
original retention, stale/non-owner fencing and quota failures. Existing
persistence-safety and writer tests also pass. The selected integrated pass
covered 15 test files: 14 passed immediately; `platform-runtime` retained an
old status-copy assertion. It now verifies both recovery and backup-import
guidance while preserving its corrupt-original assertion, and passes. The
checkpoint suite passed again after adding clock-rollback and no-extra-world-
restoration checks. All 15 selected files pass on the final source; no changed
source is unmapped and no declared regression is missing.

Reproducible build/generated syntax, touched-file Prettier and diff checks pass:
dev.176, 217 campaign assets and 14 optional historical assets. Existing broader
art/tooling/format warnings remain documented in the dev.175 audit record; they
are not changed or claimed fixed here. No full-game suite, browser matrix or
physical-device storage/PWA certification was performed.

Initial remote source checkpoint: `db200cdf`. Final candidate is on
`fix/save-recovery-checkpoints-20261024`; no PR, merge or publication has been
performed for this follow-up. The approved dev.175 release remains live. The
earlier merge approval applied to PR #438, so this candidate awaits its own
publication approval. Reproduce after checking out the branch:

```sh
CI_BASE_SHA=e4e8234b5f784ddc9492fe79d956fd0a696b12af node .github/scripts/focused-ci.cjs
node scripts/build.cjs --check
```

## 3 November 2026 — Issue #773: external save durability (draft)

This extension leaves the active **v4 localStorage schema and keys**, one
authoritative primary plus **one** checkpoint per mode, 60-second checkpoint
cadence and 2,000,000-character encoded checkpoint cap untouched. The older
three-entry/500,000-character dev.176 configuration above is historical.

**External backup:** User-initiated download only. Serialize and validate the
actual v4 campaign, re-restore its serialized JSON through the canonical
validator, then name it with mode, class, level and UTC minute. The download
API confirms only that the browser was asked to begin a download. No telemetry,
cloud upload, extra origin-local save or automatic backup file is created.
Unreadable originals can still be exported **verbatim as evidence**, not
misidentified as validated backups.

**Import:** v4 files and supported v2 migrations are validated before a
read-only preview identifies mode, hero class, level and location. File
selection, cancellation or failed validation writes nothing. Only explicit
confirmation calls the existing writer-fenced `writeCandidate`, preserving
unreadable originals and rejecting competing-tab/stale-byte replacements.

**Reminder:** the paused title can display a single discreet suggestion when due;
opening the existing backup menus can display the same guidance
after two hours since first observation/download attempt or after five levels
of additional progress. Showing a reminder suppresses another for 24 hours;
the last initiated download restarts the baseline but is never claimed to be
a verified off-device file. The small per-mode metadata has no save bytes and
can fail to write without affecting game saves or the reminder's in-memory
session fallback. No notification or gameplay interruption occurs in combat.

**Persistent storage:** `navigator.storage.persisted()` is checked when
available. `persist()` is invoked only from the player's menu click and may
grant, deny, throw or be unsupported. Saving, loading and offline play never
depend on it. The API can reduce *automatic* eviction, not protect against
site-data deletion, app uninstall, operating-system removal or lost hardware.
`navigator.storage.estimate()` is suitable only for approximate usage/quota
diagnostics, not a guaranteed space forecast; no such numerical promise is
shown in the game. iOS/Safari, private mode and some embedded/portable
contexts may restrict these APIs.

**IndexedDB recommendation — DEFER production migration.** IDB supports
asynchronous, transactional writing and may reduce main-thread stalls and
expand practical storage capacity for large saves, but IndexedDB shares
origin-eviction risk and adds cross-tab transaction and migration failure
modes. Current game saves are a bounded small number of keys, with existing
single-key atomic writes, validated checkpoints and writer lock. No evidence
yet establishes that the present synchronous snapshot writer causes a
meaningful player-facing stall or that IndexedDB would prevent existing
observed data loss. A migration now increases risk without a demonstrated
benefit. The correct GO gate is real-device p95/p99 save serialization/write
latency, representative and near-quota storage sizes, repeatable observed
problems and a separately reviewed non-destructive prototype.

A separately authorized migration must validate the v4 primary and checkpoint
without deleting them, write the candidate in one IndexedDB transaction,
read back and validate content/checksum, set an explicit durable cutover marker
only after commit and promote one authoritative store, not dual-write
indefinitely. A crash before cutover continues using original localStorage;
repeated migration is idempotent; rollback keeps original bytes. Verify
quota-aborted transactions, versionchange/tab contention, cross-window locking,
offline PWA update, denied/private browsing, iOS/Safari, Chromium/Chromebook
and exported JSON compatibility. **No live IDB code, migration or second
campaign authority is authorized under #773.**

**Failure boundaries:** Invalid JSON never becomes a new primary. A failed
localStorage `setItem` preserves the prior value of that key; on quota, the
optional checkpoint may already have been discarded to protect the primary.
All local entries can be lost together during origin clear, eviction,
uninstall or device loss. Only an externally retained file provides independent
recovery. Large save sizes are ultimately bounded by browser quota and the
existing five-megabyte import limit, with UTF-16 key/value accounting varying
by engine. Production migration and complete real-device certification remain
separate consent gates.
