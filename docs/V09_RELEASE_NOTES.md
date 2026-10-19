# So I Became the Dark Lord's Problem — October 2026 Community Snapshot

**Published runtime: `0.9.1+snapshot.dev.79`. Development is on break.** The former unpublished v0.9.0 candidate notice is preserved in [documentation history](PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md). It no longer describes release status.

## Published scope

- Five-region offline-capable single-player RPG with desktop/Chromebook keyboard and mouse controls and a dedicated phone touch layout.
- Standard and optional Succession campaigns, Normal/Nightmare saves, specialist rescues, revised boss/captain encounters and authored worldbuilding.
- Eight class-specific hero skills with tap/charged forms, cooldown-only combat, companion support, eleven pet families and concise skill/condition references.
- Auto/30/60 rendering, camera selection, optional Optimization Mode and contextual soundtrack/effects. These do not establish universal device FPS or listening comfort.
- Minimal English/Spanish presentation selection; this is partial localization, not a complete campaign translation.
- Dev.79 enables manual tap/charged Skill 1 in Developer Mode while keeping movement auto-attack disabled.
- Earlier narrow fixes: movement auto-attacks respect fleeing/Recall (dev.77), and Character and identity uses spoiler-free descriptive copy (dev.78).

Existing Pages URLs and installed-app identity remain stable. [Play in a browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) or [open the phone entry](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html). Export saves before clearing browser data or changing devices. The existing v4 schema and legacy v2 import remain; no cloud save service or playable co-op exists.

## Publication and validation are separate

The latest published gameplay source is `23d951092ea5dff806c460c62ca71eeced574f5c` (#319). Successful [packaging-only publisher 39312326936](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39312326936) deployed this exact dev.79 merge after the owner explicitly approved publication with no further testing on 19 October 2026. No new CI/gameplay certificate was issued. Earlier dev.78 evidence remains in [the release handoff](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md).

PR #308 has consolidated full validation evidence. #313 was merged under the owner's release instruction with focused/WebKit evidence and incomplete broader work. Dev.76–78 and the later dev.79 publication used explicit no-CI/no-further-test instructions. Fresh full gameplay/balance certification and complete native-device/human aesthetic acceptance are not claimed. Those historical limits are retained; they are not current break-blocking homework.

## Break boundary and recovery

Documentation audit and PR consolidation are recorded in [current state](DEVELOPMENT_STATE.md) and [the audit](DOCUMENTATION_AUDIT_20261019.md). [#319](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/319) merged the closeout and the manual Developer Mode Skill 1 repair. Its preserved reconciliation ledger records future work; no future implementation runs automatically. Whole-game independent regression, visual polish, co-op modernization, old sprite adoption and outreach wait for the owner to return. Forum silence is not validation.

No rollback is performed or recommended solely because certification was limited. If an actual defect later needs a corrective release, preserve saves and original backups, choose a source supported by evidence for that defect, use a fresh cache/version, pass applicable checks, obtain release authorization and verify publication. Old v0.8.x rollback references remain historical and must not automatically replace the much newer snapshot.
