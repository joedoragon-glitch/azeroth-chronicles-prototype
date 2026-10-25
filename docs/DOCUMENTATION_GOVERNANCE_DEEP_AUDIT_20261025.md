# Azeroth Chronicles — Deep Documentation Governance & Architecture Audit

**Audit date:** 24 October 2026  
**Immutable source baseline:** [`e4e8234b5f784ddc9492fe79d956fd0a696b12af`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/e4e8234b5f784ddc9492fe79d956fd0a696b12af) on `main`  
**Runtime package:** `0.9.1+snapshot.dev.175`  
**Published workflow evidence:** [Focused checks and deploy #40140119390](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40140119390); successful focused validation, package preparation, upload and GitHub Pages deployment for this SHA.  
**Mode:** Read-only source and documentation audit. No GitHub mutations, tests or workflows initiated, merges, releases, or gameplay changes.

## Plan revision — 25 October 2026: add test-governance and regression-drift review

**Status of this revision:** The original audit's findings remain **pinned to the 24 October dev.175 SHA above**. This amendment **changes the proposed future work**, not the facts or dates of that completed documentation audit. It is not a new full repository audit, a certification of dev.180/dev.181, or permission to modify tests. The owner has approved adjusting the *plan*, not merging code or triggering game tests.

**New requirement:** In addition to repairing documentation authority, conduct a **bounded, initially read-only Test Governance and Regression-Drift Review**. The purpose is to prevent *avoidable recurring* CI surprises, test assumptions that silently go stale, test fixtures that omit live gameplay prerequisites, and incorrect classification of unrelated/inherited failures. It must preserve strong regression checks, approved game mechanics, historical source-hash receipts, and the existing owner-gated release policy. **A first failing CI run is not itself a defect in the development process.**

**Additional contextual evidence, not a re-baseline:** At a separate 25 October GitHub check, `main` was [`2af8e97990f6d45b446149592334b9d31b2dfb34`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/2af8e97990f6d45b446149592334b9d31b2dfb34), dev.180. The ordinary ranged-enemy healing change was [draft PR #448](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/448), targeting dev.181, while [draft PR #447](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/447) was a **different PixiJS release-gate/test correction**. A screenshot in the discussion referred to “PR #447” for healing and four failures; this inconsistency illustrates why a screenshot, nickname or PR number must be verified against its **exact head SHA, base SHA, run ID and file changes** before a failure becomes audit evidence. The screenshot is an example of reported symptoms, not independently validated proof of their causes.

**Crucial reuse finding:** The project already has a test-impact selector, [`.github/scripts/focused-ci.cjs`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/.github/scripts/focused-ci.cjs), its protective [test policy suite](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/tests/ci-focus-policy.test.cjs), existing regression tests, and [dev.175 test-drift repair analysis](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/AUDIT_INTEGRATION_REPAIRS_DEV175.md). **Audit, reconcile and extend these; do not invent a second competing mapping system or assume earlier repairs were absent.**

**Revised project shape:** Two connected but independently reviewable tracks, not a blended game change: **Track A — Documentation Authority & Discoverability** (original Phases 0–5); **Track B — Test Governance & Regression Drift** (new stages T0–T5). Track B begins as investigation; future test, fixture or CI-selector edits require their own explicit authorization and scoped review. Track A remains documentation-only unless specifically approved otherwise. Both tracks refresh their baseline independently at execution time.

## Executive review verdict

**Severity:** **High documentation governance / moderate project-wide operational risk**, not a demonstrated game integrity emergency.

The project is **documented extensively**, not neglected. It already has a substantive architecture ownership table, an October 19 classification and archive-preservation effort, an established decision log, a reproducible script/asset inventory, and release/CI evidence. The initial quick audit correctly detected stale present-tense entry points, but it overemphasized sheer document volume and did not establish that a new `START_HERE.md`, `CONTRIBUTING.md`, `CODEOWNERS`, or wholesale reorganization was necessary.

The stronger, verified problem is **authority routing**: several documents or issues call outdated build versions “current”; one operational policy file contains **incompatible current versus legacy CI instructions**; chronological information is interleaved with guidance; and the historical October 19 inventory has not acquired a systematic *incremental* classification layer for subsequent records. A newcomer or AI assistant can retrieve correct documentation yet mistakenly act on a later-looking, historical or superseded instruction.

**Recommended outcome:** Repair current-policy contradictions and status claims first, preserve frozen historical material, then add a small machine-readable authority registry and documentation-only checks. **Do not refactor gameplay, reopen feature work, prune development branches, or rewrite every archived report.**

## 1. Audit method and scope

1. Inspected the repository tree at the exact SHA above: **5,235 tree entries, 4,879 blobs**, `docs/` **560 files**, including **287 Markdown documents** and **259 files under `docs/evidence/`**. A further seven files sit in `docs/vfx-audit/`. Evidence files and other non-Markdown resources were inventoried by path/size; their contents were **not each independently recertified**.
2. Retrieved the **full source text of all 287 `docs/*.md` files** (the directory is flat for Markdown in this snapshot), in bounded batches. Every returned Markdown body underwent a structural/header scan and a static pass over its conventional inline Markdown local-file links. This is corpus-wide *mechanical* inspection, **not a claim that every sentence of every historical report received manual semantic or historical fact-checking**.
3. Conducted deeper semantic comparison of primary entry points, operating instructions, history controls, release evidence, and selected subsystem guides: `README.md`, `AGENTS.md`, `CONTROLES.md`, `DEVELOPMENT_STATE.md`, `DOCUMENTATION_INDEX.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `MECHANIC_DEVELOPMENT.md`, `DOCUMENTATION_AUDIT_20261019.md`, `V09_RELEASE_NOTES.md`, recent performance/integration/Archive records and the sprite production references.
4. Checked the authority structure against `package.json`, `scripts/site-assets.cjs`, `scripts/build.cjs`, `.github/workflows/focused-deploy.yml`, `.github/workflows/pages.yml`, `.github/scripts/focused-ci.cjs`, and the repository’s architecture and CI tests. Read the live GitHub Pages workflow's individual successful jobs, the three open PRs at this snapshot, [draft PR #435](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/435), and [Recovery Desk issue #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297).
5. Audited the **preliminary audit's assertions**, classifying each as confirmed, qualified, or corrected rather than automatically carrying it forward.

**Scope limits:** The Markdown link pass identifies conventional `](relative-path)` references; it did **not** certify fragment anchors, reference-style links, HTML `href`s, external URLs, GitHub rendering, arbitrary path text, or semantic accuracy of every source-specific historical statement. No game tests, browser tests, full CI, GitHub modifications or third-party hardware tests were run. Source/deployment evidence is pinned to this October 24 checkpoint; current GitHub status will need refreshing before implementation.

## 2. Evidence register: confirmed and qualified findings

### GOV-01 — Current-source / published-build claims are stale (High; **confirmed**)

At this exact source commit, `package.json` says **dev.175**. The completed [run #40140119390](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40140119390) has **successful** “Focused validation” and “Publish focused update” jobs; the latter includes successful “Deploy focused, verified build”. Thus, the stronger conclusion than the initial report is: **dev.175 was successfully built and deployed via Pages**, although this does not prove all installed devices accepted the update or that owner/hardware acceptance occurred.

Meanwhile these current-facing surfaces identify a *different* latest or published baseline:

| Source at audited SHA | Claim or context | Assessment |
| --- | --- | --- |
| [`README.md`, line 1](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/README.md#L1) | “Current development status” dev.169 | **Stale present-tense assertion** |
| [`AGENTS.md`, lines 3–7](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/AGENTS.md#L3-L7) | dev.170 described as unreleased candidate; dev.169 described as authoritative published state | **Stale operating context**, partially softened by adjacent history caveats |
| [`docs/DEVELOPMENT_STATE.md`, line 3](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DEVELOPMENT_STATE.md#L3) | “Published build and branch” dev.169 | **Stale current state** |
| [`docs/DOCUMENTATION_INDEX.md`, line 1](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DOCUMENTATION_INDEX.md#L1) | “Current documentation index” dev.169 | **Stale entry point** |
| [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) | “Current recovery checkpoint” dev.173 | **Stale external authority map** (issue last changed earlier than this audit's latest main) |
| [`CONTROLES.md`, opening](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/CONTROLES.md) | Published-game guide tied to dev.79 | **Outdated reference**, unless expressly relabeled historical; controls themselves were not exhaustively reverified here |
| [`docs/V09_RELEASE_NOTES.md`, opening](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/V09_RELEASE_NOTES.md) | “Published runtime” dev.119 | **Ambiguous time scope**: legitimate dated Community Snapshot, but not an appropriate *latest release* source |

**Consequences:** Wrong assumption about what has shipped, ambiguous next steps, and failure to distinguish source, Pages publication, automated validation, installation status and physical-device testing. **No evidence here of corrupted saves or a wrong compiled game.**

**Remedy:** Maintain explicit `source`, `pagesDeployment`, `automatedValidation`, `deviceAcceptance`, and `ownerApproval` facts, each with evidence and timestamps/commits. Synchronize a *small* set of current-facing pointers only when evidence supports the update. Old release notes remain historical, not secretly rewritten to dev.175.

### GOV-02 — Contradictory CI/testing instructions inside the active agent policy (High; **new confirmed finding**)

[`AGENTS.md`, lines ~250–265](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/AGENTS.md#L250-L265) still instructs contributors that shared PR/main Node **and Chromium checks** live in `.github/actions/check-game/action.yml`, while `.github/workflows/pages.yml` “owns WebKit, artifacts and deployment”, and also describes a full test-driven workflow after runtime edits.

That **conflicts with the newer active rule at the very top of `AGENTS.md`** and with [`.github/workflows/focused-deploy.yml`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/.github/workflows/focused-deploy.yml): ordinary PR/main processing uses **focused relevant tests and reproducible build checks**; full-game/Chromium/WebKit matrices are **manual and owner-authorized** in `pages.yml`. The outdated policy bullets sit inside a section headed **“Project working rules”**, not merely a dated historical artifact.

**Risk:** An assistant could select an unauthorized, expensive test procedure, misunderstand deployment gates, or attempt to “restore” an obsolete workflow. Even if a workflow would not actually execute without approval, the directions contradict each other. This ranks **above** cosmetic documentation decluttering.

**Remedy:** Harmonize the active policy bullets against actual workflows and explicit owner authorization. Keep their former wording only in historical context if it is important evidence. Establish a light policy/invariant test for the critical CI/deployment instructions. **Never weaken the owner’s consent restriction merely to simplify text.**

### GOV-03 — Operational docs double as chronological ledgers (Medium–High; **confirmed, more narrowly framed**)

- `AGENTS.md` is **86.6 KB** (270 lines); its “Project working rules” H1 begins at **line 139**. Crucially, it **does already lead with the owner's test/deployment restriction**, so the initial assertion that safety rules are simply hidden is inaccurate. The problem is that operational and historical material are interleaved and the end contains conflicting outdated operating instructions.
- `DEVELOPMENT_STATE.md` is **93.5 KB** (299 lines); it has a current **24 October** H1 and another **“Current development state — 20 October 2026”** H1 at line ~145, plus historical “Current playable contracts” and dev.119 status tables further down. The preceding section explicitly calls older milestones historical, so a reader who observes the whole context can interpret much correctly; snippet-based readers may not.
- `DOCUMENTATION_INDEX.md` is about **100.7 KB** (332 lines); ~82 lines of accumulating release and maintenance statements precede its actual H1 (“Documentation index — 20 October 2026”). Its “Start here” section begins around line 91 and the October 19 **“Complete incoming inventory”** begins around line 143.

**Remedy:** Current operational summaries should be short, easily scanned, and lead with headings and authority rules. Relocate/segregate only duplicated chronology **after a byte-preservation and source-reference audit**, not via destructive mass edits. Fix specific misleading current claims even if they appear in a historically useful record.

### GOV-04 — October 19 classified inventory is intentionally frozen, not simply incomplete (Medium; **prior finding qualified**)

The [October 19 audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DOCUMENTATION_AUDIT_20261019.md) rigorously reconciled an earlier incoming corpus, explicitly categorized records, preserved historical SHA-256 receipts, repaired link failures, and documented 18 protected source-linked receipts. Its former **175 incoming records** are a **dated historical census**, not a promise that the same table will contain every file added thereafter.

In this audit snapshot there are 287 Markdown files under `docs/`, and **50 of those paths lack a direct conventional Markdown link** in the current index (from the static index-link comparison). Examples include the recent dev.175 repair record, dev.174 resolution, Archive N1/A2–A5 records, navigation stages and newer performance diagnostics. Many have links from other reports. **Direct-link absence does not prove the source is orphaned, inaccurate, or unclassified for all purposes.**

**Actual defect/gap:** There is no small, reliably updated *post-October-19 supplement* that conveys current status/classification/ownership for all incoming work, while keeping the historical inventory frozen. The index currently serves two incompatible ergonomic purposes: active navigation and preserved classification evidence.

**Remedy:** Preserve the dated table and hashes. Add an incrementally maintained routing/status layer, preferably machine-readable, with a concise current human view. New reports can be historical from birth; do not impose artificial “current” status on them.

### GOV-05 — Potentially misleading older “current” labels in bounded subsystem guides (Medium; **confirmed as discoverability issue, not automatic factual error**)

Examples: `SPRITE_PRODUCTION_CURRENT_CONTEXT.md` leads with a 20 October **“Current restart boundary”** and dev.117 while a second banner explains it is a historical production journal. `SPRITE_RESTART_20261020.md` is a dated dev.118 handoff linked from current-facing guidance. `CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md` is properly version-specific, and `PERFORMANCE_BASELINE_DEV170_20261024.md` is visibly a dev.170 candidate document, but the latter’s “keep in separate PR” implementation instructions must not be mistaken for instructions to recreate already merged work.

These documents can remain valuable and accurate for their *reference commits*. Merely changing every occurrence of “current” would erase provenance or invalidate authored chronology.

**Remedy:** Add document-level **authority and applicability status** outside frozen contents; adjust *live routing* to mention the actual status or newer successor, and update only genuinely maintained guidance when required. Retain parser-owned catalog IDs and frozen receipts byte-for-byte.

### GOV-06 — Documentation tests/checks need a narrow protection layer (Medium; **confirmed**)

- Existing [`tests/architecture.test.cjs`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/tests/architecture.test.cjs) protects the **multi-file Pages/PWA canon** and rejects a portable single-HTML release constraint. Keep it.
- Existing [`tests/campaign-domains.test.cjs`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/tests/campaign-domains.test.cjs) checks installed Campaign domains, not documentation authority.
- [`.github/scripts/focused-ci.cjs`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/.github/scripts/focused-ci.cjs) maps changed code/asset paths to affected suites. Conventional doc-only Markdown changes do not select a dedicated documentation freshness/classification suite. On PRs the **build consistency check still runs** under the actual focused workflow; do not say doc-only PRs receive literally no checks.

**Remedy:** Add a tiny, specifically scoped documentation validator for new/changed docs, with no game simulation or browser matrix. It should test **inventory classification, valid paths/links, bounded metadata, status-reference coherence and key CI-policy invariants**. Avoid brittle natural-language rule matching beyond a few critical policy strings; structured metadata is safer than searching every historical version string.

### GOV-07 — Navigation quality is better than the volume suggests (Low; **prior risk substantially downgraded**)

All **287** `docs/*.md` texts were fetched and mechanically scanned for conventional inline relative Markdown link targets against the immutable repository tree; the simple path detector found **no missing target**. Earlier, a separate sample of **558 links in 20 high-value files** also found zero missing paths. The October 19 audit documented more extensive historical checking including fragment anchors, but that was against its **then-current source**, not today’s corpus.

**No current evidence supports describing broken Markdown file links as a widespread crisis.** The likely navigation issue is better understood as **authority/role discoverability**, not file disappearance. Still add a more complete, cheap link checker for future changes, and report its limits.

### GOV-08 — Existing draft documentation work needs forward reconciliation, not duplication (Medium; **confirmed**)

[PR #435](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/435) is a **draft** modifying only `AGENTS.md`, `DEVELOPMENT_STATE.md`, and `DOCUMENTATION_INDEX.md`. Its patch advances a dev.169 description to a **dev.173** one and indexes Archive/recovery facts. This was reasonable at the time, but **dev.175** is now successfully deployed, and [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) is itself pinned to dev.173. The open-PR snapshot also includes #436 (stationary autoattack draft) and #401 (unaccepted design preview); no other open pull requests were returned. This count is context, **not a branch cleanup request**.

**Remedy:** Use #435 as a source of already-reviewed administrative edits, compare each sentence against the new immutable baseline, update or supersede the draft only with authorization. Do **not** merge its dev.173 top-line status onto dev.175 `main` unchanged; do not open a conflicting parallel documentation PR without first deciding how #435 is handled. No runtime or version bump required solely to correct prose; be aware that **pushing/merging to `main` automatically triggers the normal Pages workflow**.

### GOV-09 — Player-facing historical versions need explicit temporal labels (Medium; **new qualified finding**)

The Spanish [`CONTROLES.md`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/CONTROLES.md) opens with a “published game” dev.79 guide and states development is paused. [`docs/V09_RELEASE_NOTES.md`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/V09_RELEASE_NOTES.md) opens with published dev.119, yet its title says **October 2026 Community Snapshot**. These are not obviously wrong as **dated snapshot artifacts**. They are risky only if README/Index present them as **latest controls or latest release notes** without a proper label. Controls and UI contracts should be compared against the actual input code before updating translations or mechanics text.

**Remedy:** Distinguish “history of the October Community Snapshot” from “current user guide”. Keep dated release receipts, create or update current player guidance as necessary, and do a focused English/Spanish consistency check before any gameplay-facing wording is changed.

### GOV-10 — A very small formatting regression reveals weak entry-point hygiene (Low; **confirmed**)

`README.md` now places a lengthy status paragraph before its first H1, despite the October 19 documentation audit recording restoration of its primary H1-first layout. `AGENTS.md` also contains a literal escaped `\\n\\n` sequence joining two otherwise distinct current-status paragraphs near its top. Neither is a code defect. They are concrete examples of incremental append-only status editing degrading readability.

**Remedy:** Enforce first-heading-first where appropriate, one compact status section per live entry point, and basic formatting checks; do not chase cosmetic formatting through archived receipts.

## 3. Direct challenge to the quick audit's eight claims

| Preliminary ID | Deep-review disposition | Corrected interpretation |
| --- | --- | --- |
| D1 (stale version) | **Confirmed and strengthened** | Actual dev.175 Pages deploy verified, not merely inferred from package metadata; device/hardware acceptance separate |
| D2 (oversized docs) | **Confirmed but qualified** | Top of `AGENTS.md` already exposes owner policy; a *later conflicting workflow rule* is more serious than line count |
| D3 (50 missing direct index links) | **Fact retained, conclusion narrowed** | The dated inventory is intentionally historical; the missing piece is a post-audit active classification supplement |
| D4 (frozen hash drift) | **Design working as intended** | Frozen hashes are provenance, not failed current checks; preserve them |
| D5 (lack of machine-readable navigation) | **Opportunity, not standalone defect** | Current prose maps owners well; no `CODEOWNERS`/`CONTRIBUTING` requirement established for a solo project |
| D6 (local links) | **Strengthened positive evidence** | Corpus-wide conventional path scan found no missing file targets; anchors/reference-style and semantic links remain outside this scan |
| D7 (documentation-only checks) | **Confirmed, narrowly** | Ordinary PR build check exists, but no dedicated incremental document authority/coverage gate |
| D8 (PR #435 outdated) | **Confirmed** | Reconcile its dev.173 patch with published dev.175; no duplicate PR or automatic merge |

## 4. Proposed authority model (minimal, not a second game engine)

Always distinguish **what can authorize action** from **what can describe behavior or history**:

1. **Owner's latest explicit scope and consent**, plus standing release/test prohibitions. Dated approvals are valid **only** for their recorded work; a historical approval does not authorize restarting an unrelated task.
2. **Exact current repository source and build contract** for implementation facts: `package.json`, `src/prototype/`, `scripts/site-assets.cjs`, `scripts/build.cjs`, active workflow YAMLs, actual asset manifests. These indicate source behavior, not human/device validation.
3. **Verified release evidence** for publication: exact commit/version, successful Pages deploy job and, when specifically claimed, independent public-build checks. Keep this separate from owner physical-device signoff.
4. **Current maintained guides** for orientation and practice: `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_STATE.md`, current subsection-level reference guides. Their claims should point to authorities (1)–(3).
5. **Owner-approved design canon and authored decisions**, as qualified by later explicit rulings and current game data. A dated design decision is not automatically invalid because it is old.
6. **Pinned historical evidence and preserved artifacts**, authoritative about **their own audited baseline only**; retained original text is not a standing instruction.
7. **Unaccepted proposals, previews, and drafts** are reference material, not production truth.

This is a **proposed navigation rule** for the docs, not a mandate to modify gameplay or override established owner instructions.

## 5. Recommended documentation design: reuse before adding

### Human-facing landing surfaces

| Surface | Desired role and treatment | Source of truth or anti-duplication rule |
| --- | --- | --- |
| `README.md` | Player-facing overview, play/install links, first H1, small current build pointer, concise development entry links | **Do not** embed growing PR chronology or full historical work list |
| `AGENTS.md` | **Short policy-first operational contract**: consent, never merge/deploy without approval, first-read sources, relevant code/test workflow, handoffs; link to history | Owner permissions and actual workflow files win over stale prose; preserve old copy in history as needed |
| `docs/DEVELOPMENT_STATE.md` | **One clearly bounded current checkpoint**: source, deployment, validation, accepted limitations, unresolved work, date/commit, existing issue and PR pointers | May name the current source/deploy, but never call source tests device certification |
| `docs/ARCHITECTURE.md` | Existing subsystem ownership guide; keep its valuable table, update only verified stale passages | `scripts/site-assets.cjs` and actual source own code paths |
| `docs/DOCUMENTATION_INDEX.md` | Put H1 and “Where to start” at the top; short topical **current routing**; clearly label the old October 19 inventory as a dated, preserved census | Do not delete the historical inventory or silently restamp its hashes |
| `docs/DECISIONS.md` | Preserve accepted decisions and chronology; add status/supersession metadata elsewhere for retrieval | A later owner decision may supersede only the relevant subject, not the whole document |
| `docs/RELEASE_STATUS.md` **optional** | Add only if separate source/deployment/evidence fields cannot be maintained in the existing current-state document | Avoid creating a second competing “latest” page |
| `docs/START_HERE.md` **not initially recommended** | The existing index **already contains “Start here”**; make it reachable before inventing another starting point | Add only if a later usability evaluation justifies it |
| `CONTRIBUTING.md` / `CODEOWNERS` **not required by audit** | Optional if collaborating contributors and ownership needs actually arise | Not evidence of an urgent documentation deficiency |

### One structured document registry

Introduce **one authoritative machine-readable routing file**, e.g. `docs/document-register.json`, with versioned schema and all **tracked Markdown** paths as keys/records. **Import the existing October 19 classifications as baseline evidence** but preserve their historical timing; explicitly review newer files instead of defaulting every unrecognized document to “obsolete”. Keep non-Markdown evidence linked by document records or an artifact reference field, not necessarily 259 full duplicate records.

**Recommended minimal schema** (illustrative; not created in GitHub):

```json
{
  "schemaVersion": 1,
  "registryScope": "tracked Markdown paths and active route metadata",
  "auditedFromCommit": "e4e8234b5f784ddc9492fe79d956fd0a696b12af",
  "documents": [
    {
      "path": "docs/ARCHITECTURE.md",
      "role": "maintained-reference",
      "topics": ["runtime", "ownership", "build"],
      "scope": "current-source-referenced",
      "canonicalFor": ["subsystem-routing"],
      "supersededBy": [],
      "frozen": false,
      "verificationRef": "e4e8234b5f784ddc9492fe79d956fd0a696b12af"
    },
    {
      "path": "docs/DOCUMENTATION_AUDIT_20261019.md",
      "role": "historical-evidence",
      "topics": ["documentation", "reconciliation"],
      "scope": "19-october-audit-baseline",
      "canonicalFor": [],
      "supersededBy": [],
      "frozen": false,
      "verificationRef": null
    }
  ]
}
```

**Schema semantics:**

- `role` must be one of `active-policy`, `maintained-reference`, `accepted-decision`, `historical-evidence`, `historical-data`, `superseded-guide`, `draft-proposal`, `generated-reference`, or `needs-review` during migration. The role is **not** a claim that gameplay still matches a dated file.
- `topics` is an enumerated searchable list; a single doc can cover several topics. `canonicalFor` is reserved for a small, unique set of navigation functions, never copied game constants.
- `scope` says whether the assertions apply to current source, a specific historical SHA/version, or an explicitly open proposal. `verificationRef` is **evidence of checking applicability**, not a fresh checksum of frozen documents. Use a separate archival SHA/hash field where appropriate.
- `supersededBy` must point to an **existing** document/record, and should specify **subject/decision scope** when partial. Never globally invalidate a decision merely because a newer audit exists.
- `frozen: true` is reserved for records **verified to be byte-protected** by an explicit provenance or hash contract; it prevents routine formatting, heading insertion, source-hash recomputation, or mass search-and-replace. Other historical documents remain historical even when not formally byte-frozen.
- Runtime versions, asset counts, skill parameters, and source script order are **not copied** into the registry. Refer to current source/asset manifests. Live deploy SHA may live in a separate *verified release evidence* metadata section only if it is maintained under clear evidence rules; don't infer it from Git HEAD.

The generated **inventory** (actual Markdown paths) should be computed directly from the repository; the **semantic metadata** (role, approval, subject, supersession) is reviewed by people/agents. Avoid building two independently maintained inventories or generating a new historical SHA table every commit.

### Optional task-based routing (human and AI)

Small routing table linked from Index/Architecture, not a second source tree:

| Task | Go first | Check next |
| --- | --- | --- |
| Current deployment or “what is shipped?” | Current state and exact GitHub Pages workflow evidence | `package.json`, PR/commit, update/installed PWA caveats |
| Gameplay behavior or balance | Owning source and rules | `ARCHITECTURE.md`, accepted decision, affected focused tests |
| Save migration/persistence | `save.js`, `persistence.js` | Dev.175 integration evidence, historical migration tests, owner safety rules |
| Menus and UX | `app.js`, `menus.js` | Menu integration/release evidence; old step-specific drafts are bounded |
| Navigation | `navigation.js`, `world.js` | Stage 2–5 evidence, current source and active tests |
| Sprite/art | Sprite manifest and accepted procedural canon | `DESIGN_TO_SPRITE_WORKFLOW.md`, accepted source/rollback records |
| Performance/graphics | `runtime.js`, `renderer.js`, Pixi adapter, settings | Current source, dev.169/174 dated evidence, hardware acceptance gap |
| Audio | Asset manifest and audio owners | Current authoring guides, only their applicable sections |
| Old pending idea/request | Owner's current decision and Recovery Desk / issue or PR | Dated historical record; verify merged status before suggesting work |

## 6. Track A — Documentation authority and discovery (future authorized docs-only pass)

**Phase 0 — Freeze evidence and disposition (read-only):** Refresh exact `main` source/deploy evidence and PR #435. Tag each finding with current commit and distinguish historical source from new production. Decide whether to update/rebase/supersede #435; do not silently merge the older candidate.

**Phase 1 — Correct high-risk operational contradictions:** In one focused, reviewable documentation change, reconcile `AGENTS.md`'s active CI instructions and the source/deployment/acceptance references in `README.md`, `DEVELOPMENT_STATE.md`, `DOCUMENTATION_INDEX.md`; account for [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) as a linked external status surface. Mark dev.169/170/173 as dated evidence when appropriate. Do **not** change frozen reports or old release records merely to replace version strings. Protect H1-first and clear historical headings in maintained docs.

**Phase 2 — Establish current vs historical routing:** Preserve the October 19 classification table verbatim. Classify all **post-audit and direct-link-unindexed** Markdown records, including dev.174–175 and Archive/Narrative/Pixi/navigation changes. Verify approval and release status from exact commits, PRs and workflows. Do not presume “new file = active feature”; most short dev.NNN files are implementation receipts.

**Phase 3 — Create the minimal structured registry:** Implement a schema that covers tracked Markdown paths, records reviewed status/provenance, validates referenced paths and partial supersession, and exposes a compact current topic routing table. Do not create a second balance, sprite, asset, code or test manifest. Preserve original frozen receipts and parser-bound sprite prompts byte-identically.

**Phase 4 — Add cheap documentation checks:** Introduce a *documentation-only* Node validation script with tests for: coverage of tracked Markdown; schema/roles/topic validity; no unknown paths/duplicate canonical owner; local relative link file paths (and, when robust, anchors/references); forbidden accidental promotion of historical evidence; current active-policy/test-workflow consistency; and the current source version not being represented as an older unqualified “latest” in maintained entry-point metadata. Print specific file/line errors. Run only on changed doc/config scope under ordinary focused checks; no full-game, Chromium, WebKit or performance matrix.

**Phase 5 — Acceptance through representative developer/AI tasks:** Using the exact checked source, ask a reviewer unfamiliar with the repo to locate (a) v4 save protection, (b) Pixi/Canvas fallback, (c) automatic FPS/adaptive skipping, (d) current release evidence, and (e) an old sprite approval. In each scenario they should reliably identify **current source owner**, **applicable design policy**, **historical evidence**, **relevant focused tests**, **what not to modify**, and **whether owner consent is required**. Resolve ambiguities with routing changes, not a new layer of duplicated narrative.

**Release safety:** Even if this is docs-only, **a push to `main` starts the current focused workflow and successful Pages deployment**. Draft review remains non-deployed. Obtain the owner's explicit authorization for merge/publication. No runtime version bump, generated PWA file change, comprehensive suite or source refactor should be bundled into a pure documentation repair unless independent evidence shows it is necessary.

## 6B. Track B — Test Governance and Regression-Drift Review (new plan)

**Scope and separation:** This is a **distinct subproject**, initially read-only, motivated by recurrent test drift and by the reported dev.181 healing-test/Archive failures. It does **not** authorize a balance change, enemy idle-healing repair, PixiJS fix, global suite, workflow dispatch, or release. A later scoped approval is required before changing test files, test fixtures, the focused selector or GitHub workflows. Do not retrofit new test expectations by simply copying outputs from potentially faulty current code.

### T0 — Evidence and exact-base reconciliation (read-only)

Before investigating the reported failures, pin **current main** and the **specific failing candidate**: package version, branch, head/base SHA, merge base if relevant, modified files, CI workflow/run attempt, precise failing assertions, stack traces, environment, and latest follow-up status. Confirm whether the exact failure reproduces on (a) the unmodified base commit and (b) the candidate at its tested head, with the *same relevant inputs* when an authorized focused reproduction is available. A failure on both can still matter; do not dismiss it as unrelated merely because it predates the PR.

Maintain a **bounded per-failure disposition**, ideally in the existing PR/issue record rather than a new competing project ledger. Suggested fields: `sourceRef`, `prAndHead`, `testPathAndCase`, `firstSeenRun`, `observedFailure`, `baseReproduction`, `candidateReproduction`, `classification`, `approvedContract`, `owner`, `nextAction`, `closureEvidence`. Classification is **confirmed gameplay regression**, **outdated independently reviewed expectation**, **invalid/non-native fixture**, **inherited real bug**, **test infrastructure/environment**, **unexplained**, or **not applicable**. Leave `unexplained` when evidence is insufficient. No silent skip, blanket expected-failure, weakened assertion or baseline rewrite.

Initial examples to investigate, **not predetermined diagnoses**:

| Reported symptom | Evidence required before declaring a cause | Preventive control sought |
| --- | --- | --- |
| Two “outdated cooldown” expectations | Resolve distinct clocks, source/caster/recipient cooldowns, live rule tables and accepted decisions; compare base/head behavior | Review dependency-sensitive assertions when approved mechanics change; protect independent expected values |
| Test unintentionally hits known idle-healing defect | Establish native aggro/arrival/field-opening preconditions and whether scenario is intended as a defect regression or an unrelated balance fixture | Shared native setup helper + explicit separate regression for the unresolved defect |
| Archive reference test fails | Determine actual observed assertion and whether changed combat rules legitimately alter its projection; verify English/Spanish and read-only reference expectations | Archive included in cross-domain impact map; independently checked descriptions/formulas |
| Pixi/settings browser gate (separate existing #447 context) | Verify pause/resume semantics, timeout and base/head CI; keep graphics acceptance separate from healing rules | Avoid false failures from unrealistic UI/render lifecycle assumptions without weakening the render assertion |

### T1 — Audit *existing* source-to-test dependency coverage (read-only)

Inventory the current source-to-test rules in `.github/scripts/focused-ci.cjs` and the assertions in `tests/ci-focus-policy.test.cjs`; inspect related existing `tests/*.test.cjs` suites, reusable helpers, `docs/MECHANIC_DEVELOPMENT.md`, and the relevant domain source owners. Compare to actual recent source-only commits and to the fixed mappings described by dev.175. This is a **dependency audit**, not a count of test files.

For each representative subsystem (enemy support healing, shared cooldown/Slow, party/companions, Archive reference, Pixi/frame performance, saves), record: **changed production paths → directly affected behaviors → old and new contract tests → shared fixtures → user-facing reference surfaces → selection group → known gaps**. Include the reverse question, “If only this implementation file changes six months later, will the original regression still be selected?” Distinguish a missing selector edge from an intentionally unselected unrelated test. Keep selector ownership in the existing executable map.

Test scenarios to analyze include **ordinary healer versus boss/captain healer and recipient**, per-caster versus per-recipient timer, multi-target area healing, no self-heal, 75%/90% contextual gates, Slow/debt, native opening-field admission, Archive's bilingual explanatory numbers, and save/restore. These are *examples from current source/PR scope*, not a new specification of game mechanics; compare them to exact live code and owner approvals when execution begins.

### T2 — Review expected-value provenance and fixture realism (read-only)

For each discrepant case, trace the expected value to a **dated approved mechanic, reviewed rule definition, intentionally preserved fixture contract, or independent calculation**. Document the version under which the assertion is valid and why the new expected value would be correct. Separate historical immutable evidence from adjustable current regression tests. Any proposed test update must explicitly name what changed and what negative cases remain protected.

Review setup validity: campaign mode, field-opening prerequisite, actor role and eligibility, time source, current zone rules, geometry/line of sight, boss/captain distinctions, and animation/menu pause lifecycle. Prefer shared **native-state constructors or exact in-game setup helpers** to ad hoc mutation of saved flags. Add a real-bug regression separately where an inherited bug remains unresolved; do not hide it by changing a balance-test fixture to avoid the defective path without preserving that bug's traceability.

### T3 — Specify minimal preventive controls; ask approval before implementation

Produce a **small change proposal**, with exact paths, intended selector changes, original-suite changes, expected-value rationale, and proof that legitimate failures would still be caught. Only after separate owner approval, implement focused controls using the **existing** `focused-ci.cjs` / policy-suite / test-helper / mechanics-guide architecture. A second test registry is disfavored; use a **small, generated impact-report view** or PR description only if needed for human review.

Possible narrowly scoped safeguards, if confirmed necessary:

- A selector-policy case that deliberately changes only a mapped source path and asserts the relevant **original tests** are included; missing expected suites cause CI failure rather than silent architecture-only fallback.
- A fixture-helper contract that proves required native state (opening admission, eligibility, clock, distance/LOS, paused rendering) is established and that a deliberately invalid setup fails explicitly.
- An approved-mechanic reference check using an **independent expected computation**, guarding separate ordinary/leader healing and Archive-facing numbers, instead of regenerating expectations from implementation output.
- A PR checklist entry for **behavior/test impact, baseline comparison, known unrelated failures and the evidence link**, in the existing PR template or contribution guidance if one exists. Do not require a large new report for every one-line fix.
- A documented known-failing-case disposition with a named issue/PR owner and evidence; no broad quarantine or “fix test until green” instruction.

The first mitigation may be **better classification and clearer guidance**, not necessarily more code or tests. A clean CI run is not proof that all game behaviors are correct; a failed run may be a desirable guard against an accidental change.

### T4 — Scope and validation gates when separately authorized

Use the **smallest affected local tests** and the selector-policy regression for test or CI-map changes. New fixtures must validate positive **and negative** cases, including untouched boss/captain mechanics. When relevant, compare the same selected tests on the tested base and tested head; retain per-run provenance. Check that source-only changes trigger cross-domain tests and that a deliberately missing mapped test is reported. Do **not** trigger the manual full-browser/full-game suite or deploy merely because this governance plan exists.

Keep documentation-only Track A review separate from test/CI repair work. Any approved test/selector change should be isolated in a separately reviewable PR or clearly scoped change so GitHub main-branch auto-deployment is never an accidental side effect. Preserve source hashes, frozen fixtures and the existing v4 save/cache/renderer contracts.

### T5 — Acceptance review and failure-prevention demonstrations

A reviewer should be able to verify the following **without requiring zero first-attempt CI failures**:

1. A source-only ordinary-healing edit selects relevant original enemy-support, area, regroup and Archive contract tests wherever the mapped dependency truly exists; unrelated browser/global suites are not auto-selected.
2. An obsolete cooldown expectation is either shown valid for a pinned historical contract or corrected with an **independently supported current contract** and a recorded reason; no assertion weakened simply because it failed.
3. Invalid fixture prerequisites are identified; the relevant real-world setup is tested and a genuine separate inherited bug remains documented/testable.
4. A base-branch failure, candidate-introduced failure, and unresolved failure are distinguishable with exact run IDs and source heads, avoiding blanket “unrelated” claims.
5. A missing or renamed mapped regression test causes a clear, actionable selector failure; original tests cannot quietly lose coverage when later source-only PRs are opened.
6. A policy reviewer can find the correct workflow, owner permissions and test-specific routing from `AGENTS.md`, `MECHANIC_DEVELOPMENT.md`, and the structured document index without contradicting current CI.
7. Regression cases include the **unchanged negative behavior** that must survive any correction; the team can show a test would fail for an intentionally wrong implementation in a controlled fixture/policy-unit-test setting, without damaging production data.

**Exit artifact:** An evidence-linked **Test Governance Review** consisting of a gap matrix, ranked confirmed defects/risks, minimal proposed code/doc changes, protected invariants, and accepted remaining gaps. This can be embedded as a dated addendum to the documentation project rather than an ever-growing independent manual. Distinguish review findings from implementation completion, and never mark an unexecuted check as passed.

### Scheduling relative to Track A

**First:** refresh baseline and resolve the active `AGENTS.md` CI contradiction (Track A Phases 0–1) so no subsequent work follows obsolete authorization instructions. **Next:** conduct T0–T2 *read-only* concurrently with Track A classification/registry work when useful. **Then:** seek owner approval for Track B implementation only if the audit proves a gap; complete Track A's docs-only gates independently. **Finally:** perform separate evidence-based acceptance of each track. Do not block harmless documentation navigation improvements on a gameplay test investigation, or force game-source changes into a documentation PR.

## 7. Acceptance criteria for the actual repair project

- A new contributor reading only `README.md` → `AGENTS.md` → the top of `DOCUMENTATION_INDEX.md` can determine the live source/deploy refs and whether feature work is authorized, without encountering an unqualified obsolete “latest”.
- **No conflicting active policy** regarding focused CI, manual full-suite consent, or automatic main deployment. Historical policy descriptions are clearly scoped.
- Current source, latest successful Pages deploy, scope of automated tests, real-device testing and owner signoff are separate explicitly evidenced statuses.
- The October 19 audit, frozen receipts, hashes, generative sprite catalog and dated historical records retain their bytes, or any exception has individually documented approval and preserved originals.
- All tracked Markdown documents are discoverable with explicit `role` and `scope`; newly added documents cannot silently become uncategorized live instructions.
- Register records are schema-valid and refer to existing paths. Canonical routing does not create two authoritative sources for the same subject. Historical reports may reference old versions without being rejected as wrong.
- Documentation path/anchor tests and policy invariants pass as **focused** checks without launching game-wide/browser tests.
- A final change report states exact modified docs, preservation proof, remaining uncertainties, and whether release/deployment occurred. No claim of gameplay/hardware certification is made merely because documentation CI passes.


**Additional acceptance conditions for revised plan (Track B, only after separate authorization):**

- The original CI mapping and prior dev.175 test-drift repairs were accounted for; proposed additions have documented gaps and do not duplicate their owners.
- The reported dev.181 failures are classified only after exact-head/exact-base evidence, or explicitly left **unverified**; PR numbers and screenshot summaries are not accepted as immutable provenance.
- Relevant existing test suites retain their positive/negative contracts, with independent expected-value justification and realistic fixtures. Known defects remain visible rather than hidden by unrelated test setup changes.
- Current source-to-test mapping selects cross-domain regressions and fails clearly on missing expected tests; it never silently escalates routine PRs to owner-gated comprehensive testing.
- A CI pass/failure is described with its actual scope and run SHA, not as proof of full-game acceptance or evidence of incompetence.

## 8. Open verification questions, explicitly *not* current defects

1. **Per-line semantic freshness of every dated source statement** was not recertified. A document can carry a historical “current” sentence legitimately; investigate only if it is routed as present-tense authority.
2. **Local anchors/reference-style/HTML/external links** are not fully covered by the simple corpus scan. The older October 19 full-anchor result applies to its audited corpus only.
3. **`CONTROLES.md` gameplay accuracy** must be checked against actual current `input.js` and shell before revising its Spanish controls; the version label alone does not prove wrong input advice.
4. **Current public-host readback and installed PWA adoption** were not independently performed in this deep audit. GitHub Actions confirms successful upload/deploy on dev.175; user device acceptance remains separate.
5. **Authored decision chronology** needs targeted subject-level checks rather than indiscriminate modernizing. Older design canon and protected source receipts must not be restamped to today’s version.
6. **New required documentation files** (`START_HERE`, `CONTRIBUTING`, `CODEOWNERS`, a second status JSON) are **not established necessities**. Favor improving existing trusted entry points first.

## 9. Source index (pinned baseline)

- [Repository commit and exact source](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/e4e8234b5f784ddc9492fe79d956fd0a696b12af)
- [Focused validation and successful Pages deploy](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40140119390)
- [README](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/README.md); [AGENTS](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/AGENTS.md); [CONTROLES](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/CONTROLES.md)
- [Current development state at audited commit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DEVELOPMENT_STATE.md); [Documentation index](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DOCUMENTATION_INDEX.md); [Architecture](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/ARCHITECTURE.md); [Decisions](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DECISIONS.md)
- [October 19 reconciliation and preservation audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/DOCUMENTATION_AUDIT_20261019.md); [pre-break history](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md)
- [Site asset/script inventory](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/scripts/site-assets.cjs); [Build](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/scripts/build.cjs); [Focused workflow](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/.github/workflows/focused-deploy.yml); [Manual full-suite workflow](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/.github/workflows/pages.yml); [Focused CI selector](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/.github/scripts/focused-ci.cjs)
- [Architecture regression](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/tests/architecture.test.cjs); [October 24 dev.175 integration repairs](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/AUDIT_INTEGRATION_REPAIRS_DEV175.md)
- [Existing draft documentation PR #435](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/435); [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297)


### 25 October contextual references for the revised *plan* (not the dev.175 audit)

- [`main` dev.180 checkpoint observed during plan revision](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/2af8e97990f6d45b446149592334b9d31b2dfb34). This is not assumed to remain current at implementation time.
- [Dev.181 ordinary enemy-healing draft PR #448](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/448), with separate ordinary/leader healing expectations and Archive reference changes, inspected at draft head `3d2f34bf34e7517e8b072deee87eddec33b82548` for scope only.
- [PixiJS validation draft PR #447](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/447), a separate test lifecycle issue, not the healing PR.
- [Existing focused source-to-test selector](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/.github/scripts/focused-ci.cjs) and [selector-policy regression](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/tests/ci-focus-policy.test.cjs). Their current live content must be re-read from the new base before any proposed edit.
- [Dev.175 integration and historic test-drift root causes](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/e4e8234/docs/AUDIT_INTEGRATION_REPAIRS_DEV175.md).

## 10. Practical instruction for a later development chat

> **Request:** Execute the Azeroth Chronicles *revised documentation governance plan* in this report with its two distinct tracks. First read current GitHub `main`, open PRs, run status, `AGENTS.md`, documentation index, architecture and focused-CI selector; compare with the audit's pinned dev.175 source. Reclassify every finding as still-open, resolved, partially resolved, or superseded. Run **Track A** documentation-authority work within new explicit owner approval. For **Track B**, conduct stages T0–T2 as a read-only audit first, analyzing original tests, fixtures, cross-domain mappings and exact PR/run evidence; bring back the gap matrix and exact bounded remediation proposal **before modifying tests or CI**. Preserve v4 saves, accepted mechanics, Canvas/Pixi fallbacks, frozen source/asset receipts and the multi-file PWA. Use only focused relevant validation and preserve the owner-only comprehensive-test and merge/deployment gates. Never claim dev.181 or a screenshot's PR number is still current without checking.

**This instruction is a handoff template, not standing authorization to merge, deploy, change code, launch full suites, or start feature development.**

---

### Final disposition

**Original dev.175 deep documentation audit complete** for its defined corpus-wide structural scan and targeted semantic cross-check. The documentation warrants a focused governance repair, **not emergency demolition, feature development, or a universal rewrite**. Highest-priority documentation remediation remains the active CI policy contradiction and superseded release/status claims. The historical October 19 archive remains an asset to preserve. **Plan revision, 25 October:** Add a distinct, initially read-only Test Governance and Regression-Drift Review, building on existing CI selectors and dev.175 repairs; do not silently combine it with docs-only implementation. Its test-specific findings are **not yet audited or implemented**. Both tracks require a fresh live baseline and independently scoped future authorization. **No GitHub repository changes, game tests, merge, or deployment occurred during this report revision.**
