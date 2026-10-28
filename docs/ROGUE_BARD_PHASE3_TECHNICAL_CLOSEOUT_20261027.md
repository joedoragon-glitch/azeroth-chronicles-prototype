> **Current Rogue canon / archival notice — 28 October 2026:** This is a dated PR #511 stage report, **not a current implementation order or release status**. Rogue/Pícara is now **merged, published and normally playable** (dev.208). Weapon for both normal and crowned art = **staff with one oversized suspended spherical jingle bell**, never guitar, lute or strings. Critical intensity is **developer-authored** (Rogue Level 2 default), not a player slider. Older pre-release, guitar, naming and candidate mechanics below are historical only. Follow [current Rogue canon](ROGUE_CURRENT_CANON.md), current source, and [development state](DEVELOPMENT_STATE.md) for present-day work.

# Rogue Bard Phase 3 — technical closeout and Phase 4 handoff

**27 October 2026 · Draft PR #511 · one Rogue Bard class only · verified code head `f24f16ef934ca340bc1a4413f1ee404868493e53`**

## Result

> **Phase 1–3 consolidated status (27 October 2026):** **Foundation, Hero Basics, and Authentic Charm are COMPLETE AS STAGED / FOCUSED-VALIDATED; Phase 4 is READY BUT NOT IMPLEMENTED.** The binding native Charm rule is **12% on lawful surviving auto-primary hit**; every successful capture is **automatically given a permanent silly English/Spanish name (70 per language)** and **100% friendly max HP**, even in reserve. No naming popup/toggle/tutorial or naming-based heal. The distinct fresh Charm-first → worker → Barracks tutorial is Phase 7. [48 focused suites and reproducible build passed](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40503909024) at `f24f16ef`; [documentation head likewise passed](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40505058428) at `922a9cc2`. Main `5c6197e8` integrated with 0 commits behind at closeout. PR #511 is OPEN/DRAFT, unmerged/undeployed, Rogue unregistered. Read [consolidated baseline](ROGUE_BARD_PHASES_1_TO_3_CONSOLIDATION_20261027.md). **Superseded statements further below are historical notes, not live requirements.**


**Phase 3 Authentic Charm — COMPLETE AS STAGED / FOCUSED VALIDATED. Ready to begin Phase 4 Companion Integration. Not ready to merge, deploy or enable Rogue in the character menu.** The technical closeout is specific to this code/tree and owner-approved Phase 3 contract; it is not full class/playtest acceptance.

## Approved Phase 3 mechanics now implemented

- Real surviving, landed Rogue automatic bell-basic **primary hit only**; never manual tap/charged songs, splash-only contacts, lethal hits or excluded bosses/captains/guards/summons.
- Owner-fixed **12%** independent persisted Charm draw for eligible opportunities only; exact ordinary species and melee/ranged subtype identity, authenticated capture ledger and saved provenance; no unintended gold, XP, loot, kill or quest rewards, and no duplicate monster retention.
- Expedition-rank *owned per exact subtype* caps **3/4/4/5/6/7**; separate native active-group cap and global reserve admission, including previously owned resting/fallen/away captures.
- Every successful Charm **automatically assigns a permanent silly nickname** from the live interface's 70 English or 70 Spanish names and instantly restores **100% friendly max HP**. Same behavior when the field is full, without menu popup, tutorial interruption or opt-in. Locale rotation is persisted and separate from Charm/critical/combat RNG; already assigned names survive a later interface language change.
- Native v4 save validation and older-v4 cursor defaults; cross-region travel, dismissal, death/recovery, save/reload and Succession ownership; Paladin/Mage/Ranger remain the only registered/playable classes.

## Integration and actual CI receipts

The common base was `990fc79d`, current upstream `main` was `5c6197e871f8f4393d26d9b7a261b9324ef85d12`, and the branch was 46 commits behind immediately before the merge. Safe two-parent merge `dac13bcf68dda0584ff61c394b64422606021000` reconciled the newer title-screen/PWA/UI changes and Rogue-specific code, with **0 commits behind** on the immediate post-merge comparison.

Overlaps: `app.js` and `menus.js` were non-conflicting; one Skill 1 cooldown-test assertion changed on both branches and took the newer mainline assertion. Twenty-four other upstream-only paths carried the exact current main Git blob identities. The merge was on the **draft branch**, not main.

Initial focused [GitHub Actions run 40503170680](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40503170680) executed 48 relevant test suites: the native Rogue Charm integration suite **passed** but the source-scope audit failed on a stale `renderer.js` fingerprint (no enumerated sprite/catalog drift). Inspected the exact renderer PR diff: a presentation-only ♫ Charmed nameplate cue, label text/priority and readable bold personally named labels, shared across Canvas/Pixi nameplate implementations. Updated only the reviewed renderer source hash in the canonical sprite-scope evidence at `f24f16ef`.

**Final successful focused evidence:** [GitHub Actions run 40503909024](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40503909024) **PASSED 48 selected focused test suites**, including actual `tests/rogue-hero-phase2.test.cjs` (Charm, full friendly HP, EN/ES naming, active/reserve, quota, exclusion, save/restore, tamper rejection, Succession, three-class isolation), source/syntax, targeting, renderer/sprite, original-class and save/recovery checks. The workflow's reproducible offline-ready `node scripts/build.cjs --check` **PASSED** for `0.9.1+snapshot.dev.205`: 219 campaign assets and 14 optional historical assets. Its Pages publish/upload step **SKIPPED** because this was a draft PR validation run.

## Deferred by design — do not expand Phase 3

**Phase 4:** replace soldier/archer-role actor scaffolds with authentic subtype-specific friendly baselines, AI/combat/movement, all legitimate monster workers' native Barracks build/upgrade and later gathering, complete owned-roster management/recovery/inheritance parity and species visuals where the Phase 4 acceptance contract specifies. These were **not** implemented by Phase 3.

**Phase 5:** remaining seven dual-form performances; **Phase 6:** Rogue critical mechanics; **Phase 7:** recorded bell/audio and normal/crowned appearance/Canvas-Pixi presentation, EN/ES/mobile, and **fresh-Rogue Charm first → first captured worker → Build Barracks** onboarding; **Phase 8:** real owner playtest, full game/browser/device/offline PWA release acceptance.

Current policy: **keep draft PR #511 open/unmerged/undeployed**; do not register the Rogue class or start release gates. Recheck newer upstream `main` drift before subsequent integration. Later documentation-only closeout commits do not change the game code already proven at `f24f16ef`.
