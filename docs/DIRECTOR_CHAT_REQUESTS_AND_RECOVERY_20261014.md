> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# PR #300 — Director requests from the 14 October pre-certification audit chat

**Status:** authoritative **conversation handoff / acceptance checklist**, not a replacement for the locked canon in PR #298. Recorded on the existing draft PR #300, branch `implementation/director-snapshot-20261013`. The explicit purpose is that UI streaming loss, chat limits, or client–server sync errors **must not erase or silently demote director requests**. Check this file and the latest PR conversation before resuming; update it as requirements are implemented. Preserve every applicable request even if the chat disappears.

**Priority rule:** More recent explicit director requests in this conversation apply in addition to, not instead of, the approved worldbuilding scope. Existing #298 choices and later approved PR #300 combat corrections remain authoritative. Report observed results separately from code written, proposed fixes, old certificates, and unverified claims. Do **not** announce that the current head is complete until source-based task quality review and the later one-time combined acceptance work are finished.

## 1. Director's pre-certification audit — requested first

**Director request:** *Before starting the overnight comprehensive regression, peer checking and other certifications, review PR #300 for anything missed and tentatively audit poor implementation / poor task execution against **all objectives** of the worldbuilding pass.*

**Required work:**
- Reconcile all **45 selected choices** in PR #298, compatible worldbuilding work, and later explicit corrections/director requirements in the PR #300 conversation. Read actual owning code and player-facing paths, not only self-reported done boxes or documentation.
- Identify absent features, placeholders/cosmetic substitutes, invented lore, missing gameplay impact, numerical/canon deviations, bad integration, unreachable content, partial or misleading claims, duplicated earlier work and incorrect tests.
- Check whether each intended character, settlement, institution, boss/captain mechanic, rescue, quest, currency or ending is **encounterable and meaningfully functional** in the game, not just a string in an Archive entry.
- Distinguish objective/source completion from **quality of execution** and unverified proof. Prioritize real defects for corrections before the later full gate.
- Retain concise findings/evidence in PR #300; do not create another implementation PR or restart already integrated mechanics.

**Current checkpoint, not final certification:** `docs/SNAPSHOT_PRECERT_IMPLEMENTATION_AND_NARRATIVE_AUDIT_20261014.md` and `docs/SNAPSHOT_PRECERT_IMPLEMENTATION_QUALITY_AUDIT_20261014.md` contain desk audits of all 45 choices. More diagnosis and corrections may remain. Do not treat those reports as a closed clean bill of health.

## 2. Quest narrative standards and newly added lore

**Director request:** Review the previous player-reviewed quest narration work, including **the specific reactions to robotic, AI-generated, formulaic or poor narrative implementation**; apply those judgments to any new lore shown through quests. Review existing quests and improve appropriate quests so they naturally reveal PR #300's added history and characterization.

**Binding earlier review contract:** The original director-reviewed 30-quest pass in **PR #184, integrated by #188**, deliberately kept **17 silent** quest completions, chose **12 short Chronicle moments**, and retained **one final-approach milestone**. Original selected KEEP moments #20 and #21 were voice-polished with explicit approval; do not reintroduce all-quest notices, inflexible exposition dumps, fake mechanical completions or a permanent black event feed. PR #168 had already selected organic travel/exploration and action-oriented objectives with unchanged payout/save rules.

**Acceptance intent:**
- Let lore arise from observed circumstances, concrete objects, working places, earned discoveries, NPC constraints and the consequences of a quest; avoid encyclopedic narration disguised as a person speaking, generic “you discover…” copy, repetitive heroic speeches, bureaucratic exposition that no character would say, and formulaic moral conclusions.
- Prefer short, distinctive, naturally paced prose with occasional dry wit where appropriate; keep useful travel, night-danger and unlocked-service information clear.
- Support the PR #300 canon that has become relevant at existing quest points: Greenwood/Lifebinder's self-aware skeletons and compelled Borin, the six-signature clue without early identity spoiler; Marches Wraiths, flooding and Neri; Ironroot payroll/captain, separate silver/copper mint and circulating portrait crowns; Frontier civilians rebuilding under governor/inspector, military air program; Crown rations, levies, Vera/Cindermaw's coercive welfare.
- Do not change the **30 quest identities**, automatic completion, one-time reward amounts, existing historical v4 quest flags or progression triggers without separate need/approval. Do not force new quests just to fit every lore paragraph.
- Check authored narration *against actual triggering quests and access conditions*. A historical fact existing in `data.js`, the quest journal or an optional article is not evidence the player will encounter it.

**Current checkpoint:** The connected branch contains updated `src/prototype/narration.js` and associated `tests/quest-narration.test.cjs`, with additions focused on already-approved #4/#16/#18/#23/#29. Inspect latest source before new edits because the branch was concurrently receiving story changes. Final human-sounding voice and player-facing review remain outstanding; preserve exact approved KEEP #20/#21 and cut distribution.

## 3. Expand and update the Drowned Keeper's Archive

**Director request:** The Keeper's Archive must reflect the substantial new worldbuilding, not retain an outdated encyclopedia. Use its earlier reviewed design as the baseline.

**Earlier design contracts:** PRs **#172/#185/#199/#205** established the optional Archive, captive Keeper/TRUE availability, discoverable ledger and `keeperEvidence` story gate, concise in-character answers with optional exact figures, and safeguards against stale campaign unlocks. Do not turn the Keeper into an omniscient quest feed or ignore the separately established flooding uncertainty.

**Acceptance intent:**
- Update the provinces, relationships, professions, ministries, lived-in economy, Dark Lord's former companions, Ironroot/Frontier/Crown Peace, rescued specialists and true identities. Describe relevant details in **the Keeper's distinctive voice** instead of copying raw design memos into long topic text.
- Preserve the ledger-gated culpability revelation: the Keeper's own capture role is not public knowledge until evidence is read. The hero-as-sixth-companion explicit recognition remains gated until actual throne coronation; early six signatures may serve as subtle clues, never an early full spoiler.
- Keep recorded character/class/stat mechanics **accurate from live rules**, separate from short practical advice; optional detailed numerical figures remain usable for those who want them.
- Preserve Archive access/re-capture rules, original scholarly personality, Barracks remote access rules, v4 saves and optional nature. Wraiths assist the Keeper, their dislike of the flooding is real and **its cause remains unknown**.
- Verify new Keeper topics are available through actual UI when eligible, are not shown when blocked, and do not force a player to read every article to understand their quest.

**Current checkpoint:** `src/prototype/archive.js` has received new institutional dossiers (Garun, Veyrith, Veyra, the regime's benefits and costs, and other histories). They require prose, topic-access and scene-context acceptance; prior desk checks alone are not sufficient.

## 4. Town / hamlet building spacing and roads

**Director observation:** In several towns, houses appear stacked/partly on top of one another or much too close. Some named places and props still sit **over/on roads** despite the earlier road pass. NPC, character and building titles may draw **on top of one another**.

**Director requirement:**
- Redistribute homes sensibly into free **rear and side** plots; avoid visually overlapping **actual roof/body footprints** at supported camera zooms, not just collision circles or building anchors.
- Preserve enough open space for **rescued named instructors, smiths, alchemists, other town services and their accessible frontages** even on saves where those characters have not yet been rescued. Keep entrances, interactive NPCs, refuges, transport links and player Barracks accessible.
- Move non-road objects/named locations away from travel lanes and resolve obstructive visual scenery; don't destroy necessary bridges, actual road traces, purposeful tracking clues, resources, quest sites or stable IDs. No roads randomly cutting through buildings.
- Prevent **NPC/character/building nameplates** from overlapping other names; prioritize important interactables and readability on phone and desktop. Don't solve label overlap only by making lettering unreadably small.
- Respect collisions, original roads, saved placements/progress, deterministic migrations, patrols, quest triggers, town identity and scenery details; don't erase houses to claim no overlap.
- Inspect the actual look in all five main regional towns/hamlets and representative legacy scenes when the final visual gate runs.

**Current focused implementation:** PR #300 `world.js` now contains `townVisualClearance` and `clearNamedRoadMarkers`; `renderer.js` contains shared priority nameplate slots; `tests/snapshot-town-visual-clearance.test.cjs` captures invariants. A small engine-only source probe reported **65 houses across five regions**, zero pairwise *estimated projected* overlaps, zero eligible named road intruders and future rescued specialists with plot distance ≥197 world units. This is **not** proof that every original sprite at 150% camera is legible, that no building/label ever collides in real pixels, or that old-save maps pass—retain those as explicit acceptance work.

## 5. Greenwood Vale cottages: original quality and 100%→150% camera correction

**Director observation:** The Greenwood cottage buildings look **disproportionately small** compared with other town buildings. The installed cottage sprite appears compressed/downsampled. The original was prepared for a **100% camera**, then the sprite pipeline was changed to a **150% camera** requirement. They should be resized sensibly using **the original artwork**, not merely stretch low-quality runtime PNGs.

**The exact verified repository lineage (do not lose):**
- Stable sprite key: `prop:vale-cottage:vale` (catalog 061); current installed manifest `assets/sprites/manifest.json` points to `assets/sprites/prop-vale-cottage-vale-d94098c0186d31ce1b16815a3092957b5e428e35117729a9f2ffd9d8ec79ff3a.png` with **192×192** raster / **192×192** logical display, `anchorX=0.5`, `anchorY=0.75`, `labelHeight=64`.
- The accepted refined pilot candidate is `tools/sprites/pilots/2026-10-08-refined/vale-cottage/candidate.json`, and the retained **1318×1318 source.png** is in that directory. Candidate evidence records source SHA-256 `ee52d21f1f1d6a95fb1e545db3fa584a7b9ae86618f9277b1d475d9c1b3778e3`, with a 192×192 output hashed `d94098c0186d31ce1b16815a3092957b5e428e35117729a9f2ffd9d8ec79ff3a`.
- `tools/sprites/pilots/2026-10-08/prop-vale-cottage-vale/normalization.json` indicates a 32-pixel transparent border applied to an earlier generated image, with no content trim. `source.png` is a padded larger source, **not proof by filename alone of untouched raw generator output**. `generated-original.png` is also retained in that pilot tree; inspect both and verify exact lineage before any processing.
- `src/prototype/visuals.js`: `featureScale('vale-cottage')` targets **1.40×**, but `assetSafeScale` requires enough original raster density for registered sprites and can return **1×** when entry is just 192×192. Thus a cottage can remain visually small while surrounding procedural houses gain the 1.40× world-feature multiplier.
- `docs/CAMERA_SPRITE_TARGETS.md` specifies Vale cottage historical 100% visible body ~**68×66** and **150%** target ~**102×99 CSS pixels** before later feature proportion considerations. Later 1.40× enlarged-building density target is **816×816 raster** for a 192×192 logical frame at 150% camera and desktop DPR2 (not an instruction to upscale lossy 192px output).
- `docs/SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md` explicitly prohibits enlarging the 100% runtime image to impersonate a higher-density original. Recreate the final 150%/1.40× display export from the **accepted original generator art**, applying only needed grounding/placement transforms once, and preserve its original accepted look.

**Required next action (OPEN / NOT COMPLETED):**
1. Inspect historical original `generated-original.png`, padded source, accepted refined art and actual visible alpha bounds; verify it is the correct **approved revision**, not a superseded look. Confirm physical source dimensions and sufficient real detail.
2. Prepare a new **immutable** high-resolution 150%-camera-ready cottage raster/manifest candidate from genuine source artwork and preserve provenance, hash, rollback and original. Maintain logical `displayWidth/Height`, anchors, 1.40× feature behavior and footprint; no gameplay/collision rescale.
3. Compare cottage size against neighboring Greenwood houses/workshops, roof overlap after the town-spacing changes, and 150% camera desktop/phone native screenshots. Adjust world proportional appearance **without forcing overlarge roof occlusion** or label conflicts. Use procedural design fallback if source art is insufficient—**never** silently stretch 192px into an allegedly detailed export.
4. Update renderer/manifest/asset pipeline/provenance/tests only after authentic export is available. Do not state the art has been re-exported or visually accepted until actually done.

**Important:** This cottage original-master task is now **explicitly requested** by the director and must not be discarded as part of older paused all-sprite production. It is a **targeted necessary visual correction**, not authorization to resume unrelated sprite batch PR #217 or rewrite the entire catalog.

## 6. Testing cadence, safeguards, and ownership

The director expressly asked to **save the combined regression, audiovisual verification, historical-save testing, independent playable/peer checks and broad certification until the final coherent milestone so they can run overnight**. This does **not** waive those gates; do targeted source probes as needed to avoid reckless code changes, then run full combined tests and repair failures at the end. Do not set an overnight task without an explicit automation request; GitHub CI may run by its own workflow triggers.

All implementation remains on **the same draft PR #300**; do not merge to `main`, deploy GitHub Pages/PWA, tag, release, post to community or rename the product without separate director permission. Do not duplicate integrated work. Keep approved older systems (rescues, quests/rewards, v4 saves, original sprites, worldbuilding) and the Dark Lord/Rogue modifications. Source-of-truth, evidence and handoffs must be **committed to GitHub on every significant checkpoint**, including when a chat changes or an error interrupts.

## 7. Recovery procedure for any later chat

1. Open **PR #300** and read its **newest comments**, the **current head commit** and `docs/SNAPSHOT_IMPLEMENTATION_20261013.md`; do **not** follow stale dev.25 text in PR description as the latest state.
2. Read **this file**, the two pre-cert quality audit files, `docs/SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md`, the cottage pilot `candidate.json` and the current branch files. Ensure all five director additions above remain queued even if older audit rows say "implemented".
3. Check whether another chat updated the head or the same files. Fetch fresh blob SHAs before writes; GitHub 409 is a concurrent-edit signal, **not** permission to overwrite.
4. Continue the cottage original-master investigation and player-facing quality corrections, make targeted test probes, record honest PASS/OPEN/NOT RUN statuses, and keep the final overnight full-suite gate deferred until the owner requests it.
5. Before completing the PR, crosswalk **every user request** to actual source/test/evidence or a plainly named open blocker. No silent omission.

**Request count recorded:** (1) full worldbuilding execution audit; (2) human-sounding quest/lore integration; (3) Drowned Keeper Archive update; (4) town houses, roads and labels; (5) Greenwood cottages' correct 150% original-master sizing; (6) robust GitHub request preservation; plus the standing **defer comprehensive overnight audit**, **single PR**, **no merge/deploy**, **no duplicate work** constraints.



## 15 October — newly added director visual corrections: compact HUD and all route vehicles

The director additionally asked to shorten the **top-left HP/level/class information HUD**, now that the MP bar was removed, and to **improve every visible transport**, especially the Greenwood ↔ Flooded Marches merchant wagon and Flooded Marches ↔ Ironroot ferry; both formerly looked like primitive placeholder shapes. These are explicit owner requirements, not optional recommendations.

**Implementation source now exists on the same PR, dev.48:** `styles/phone.css` uses a 252px phone dock and a full-width single HP resource column; `src/prototype/visuals.js` now paints a horse-drawn covered wagon, working marsh/highland ferries, pack caravan and civilian dragon tack instead of the old geometric stand-ins. The original route icons/IDs, harbor/arrivals, fares, mechanics and historical saves remain untouched; visible names have taller height allocation. Recovery report: [transport/HUD pre-audit](SNAPSHOT_TRANSPORT_AND_HUD_VISUAL_PREAUDIT_20261015.md). Authored `tests/snapshot-transport-hud-preaudit.test.cjs`; source syntax and five direct instrumented render paths checked. **Real browser/art quality not accepted; final overnight visual test remains pending.** No main/merge/deploy/publication permission.
