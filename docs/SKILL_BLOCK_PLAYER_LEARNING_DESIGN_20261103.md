# Skill Block — player learning and presentation design contract

**Game:** So I Became the Dark Lord's Problem (SIBDLP)  
**Owner approval:** 3 November 2026 — game-design direction and phased implementation approach approved.  
**Status:** Approved design / engineering implementation **not begun** in this PR.  
**Source baseline:** `main` at `42bed35fd5dad6b68cc44a19bd453fb8a733f9ea`, containing merged Skill Block PR [#760](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/760). The exact merge completed the focused checks and automatic Pages publication in [run 41637089826](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41637089826); real-device visual/learning acceptance remains unverified.  
**Scope:** Teach an already implemented combat mechanic through existing, bilingual player-learning surfaces. No combat design, numerical tuning, story rewrite, or new tutorial framework.

> **Independent-session entrypoint:** The next developer should implement this contract on this same draft PR. Read this document, the PR body, current `main`, `AGENTS.md`, `docs/MECHANIC_DEVELOPMENT.md`, `docs/KEEPER_REFERENCE_WRITING.md`, `docs/COMBAT_CONDITIONS_V09.md`, and the original [Skill Block owner contract](SKILL_EVASION_OWNER_CONTRACT_20261101.md). Do not rely on any ChatGPT conversation to recover the task. The owner has approved the design and asks the next session to own engineering, focused checks and documentation; **merge/publication and comprehensive game testing remain separately controlled**.

## 1. Game-design problem: explain the event without interrupting combat

A player can now see **Blocked!** above a defending actor, but the in-game Combat conditions menu, the optional Keeper's Archive and controls help do not explain what caused it. A player may mistake a blocked skill for a projectile missing, a wall obstructing aim, immunity, armor, a failed attack, or a new general hero dodge ability. The controls guide already calls obstructed red aim “blocked,” amplifying that confusion.

**Player mental model (four answers):**
1. **What happened?** A legally connecting *skill impact* was completely blocked; the hit caused no damage or effects tied to that hit.
2. **Why did only one enemy resist the area attack?** Each affected defender checks separately; Skill Block does not cancel the entire AoE cast.
3. **How is this different from aiming or dodging?** A missed/obstructed/avoided attack never qualifies as a Skill Block; the distinct **Blocked!** result is an on-impact defense. Armor/wards mitigate, immunity has other rules.
4. **What changes my tactics?** Block is chance-based; critical skill impacts bypass it, the enemy's odds are higher at night, Ranger and Rogue Bard skills behave differently, and active companions can block eligible enemy skills even though the hero has no general Skill Block.

**Design goals:** immediate legibility, learnable on demand without spoilers, precise mechanics, bilingual clarity, no noise in intense battles, consistent numbers from live rules, no new player progression requirements.  
**Non-goals:** guaranteed onboarding popup, battle-log spam, cinematic lesson, new skill icons/bars, in-world Skill Block lore or dialogue, a new codex or journal subsystem, forced Keeper pact, changing probabilities, new status ailments, player-wide evasion, new sound/VFX, rewriting the approved narrative manuscript.

### Representative player journeys

- **First encounter:** A Mage's area spell reaches three enemies. One displays **Blocked!**; the other two take damage. The player can continue fighting normally, with no pause, banner or narration.
- **Seeking an explanation:** From the existing **Controls → Skills and targeting → Combat conditions** or **Skill journal → Combat conditions**, choose **Skill Block** to see a short, read-only explanation. The entry is available from a new campaign without rescuing the Keeper.
- **Seeking mastery:** After earning access to the Keeper, open **The Keeper's shelves → Conditions and recovery → Skill Block**. Read the same concise meaning, then **Show me the figures** for the detailed and dynamically calculated probabilities. Back returns to the short answer and then the original shelf.
- **Comparing observations:** A Soldier blocks a hostile skill while the hero does not; a Rogue Bard performance cannot be blocked; night changes enemy defenders' odds without changing friendly companion odds. The optional reference accounts for these without teaching a new hero ability.

## 2. Canonical mechanic — **explain, do not alter**

The implementation is the authority; these numbers are verified against `src/prototype/rules.js` and `combat.js` at the baseline commit. The source of truth for numerical display remains `R.skillBlock` rather than strings duplicated in a UI.

| Defender / attack source | Eligible single-target | Eligible area, per affected defender |
| --- | ---: | ---: |
| Hostile enemy resisting an ordinary eligible hero/companion skill | 20% | 30% |
| Hostile enemy resisting **Ranger hero** skill | 15% | 25% |
| Hostile enemy resisting **Rogue Bard hero performance** | **0%** | **0%** |
| Owned, alive and active Soldier, Archer, pet or lawful Charmed companion resisting an eligible **enemy** skill, including enemy Rogue maneuvers | 20% | 30% |

- **Night:** +5 percentage points to **hostile enemies' chance to block** only, including against Ranger skills (20%/30% then); not an allied companion bonus. Use the game's real day/night decision. No bonus for Rogue performances.
- **Critical priority:** An actual critical execution on the skill impact bypasses the block roll. Do not relabel an ordinary skill as a “critical skill” category or recompute a critical.
- **Exclusions:** Ordinary automatic basic attacks and automatic combo finishers are exempt. No currently playable hero has general Skill Block; future Strategist Dodge/Reversal is distinct. Do not imply this chance applies to trap hits, lingering preexisting damage-over-time, friendly support, projectile obstruction, enemy warning geometry, or physical dodge.
- **Outcome:** A blocked legal impact deals zero damage and applies zero *causally attached* on-hit effects. It does not erase previously applied conditions, consume a different RNG stream, undo a committed cast/cooldown or alter target eligibility. For native repeated impacts, follow the actual authoritative per-contact effect ownership; do not simplify it to one global cast roll.
- **Presentation:** A short, bounded label appears above the defender for a *successful legal block*. The English canonical cue is exactly **Blocked!**. It is a combat event, not a lasting status with a debuff icon.

The original gameplay and event-authoring contract remains [SKILL_EVASION_OWNER_CONTRACT_20261101.md](SKILL_EVASION_OWNER_CONTRACT_20261101.md). Do not reinterpret hit validity, immunities, critical receipts or collision from prose examples.

## 3. Information architecture and approved surfaces

| Surface / current source | Purpose and approved design | Priority |
| --- | --- | --- |
| Live combat feedback: `renderer.js`, observed from `skillBlocked` receipts | Keep the short, local **Blocked!** over defender; show localized **¡Bloqueado!** in Spanish. Same behavior in Canvas and Pixi's Canvas overlay, same bounded/fading queue, no new sounds or forced panel. Preserve normal frame-skip behavior. | Required |
| Quick guide: `menus.js::combatConditions`, via Skill journal and Controls | Add exactly **one** **Skill Block** topic to the existing **Combat conditions** list, preferably adjacent to other defensive topics (e.g. after fortification). Selecting the topic displays a brief, read-only answer, no numerical rules wall or new menu family. | Required |
| Keeper: `archive.js::conditionTopics`, `sections`, existing reading menu | **Reuse the same topic** as the quick guide. In **Conditions and recovery**, present the short explanation first; **Show me the figures** reveals exact rules and live rates. Keep the existing rescue/pact gate and the Keeper's authorial/narrative boundaries. | Required |
| Controls: `app.js::combatHelp` → Targeting and dodging | Make **red aim obstruction** and **Blocked! on a valid skill impact** unmistakably different. Preserve targeting keybind, aiming colors and warning advice. This can be one concise sentence/phrase, not a new help category. | Required |
| Skill journal details and teacher previews: `menus.js`, `skill-reference.js` | Leave class abilities, rank/price previews and Tap/Charged figures focused on each skill. Do **not** append universal Skill Block paragraphs to every card. Existing Combat conditions link already gives an entrypoint. | Preserve |
| Starting quests, Announcements, main menu and approved story: `field-onboarding.js`, `narration.js` | No injected tutorial, pop-up, new quest, saved “seen” bit or altered approved EN/ES literary text. | Excluded |

### Existing routes (do not invent new navigation)

1. `Controls → Skills and targeting → Combat conditions → Skill Block` — already reachable through `app.js`'s help path; no Keeper access required.
2. `Adventure → Hero skills / Skill journal → Combat conditions → Skill Block` — the current `menus.js` read-only path; preserve its Back destination from each launcher, including Barracks and instructors.
3. `Barracks → Rescued specialists → Drowned Keeper · The Archive → The Keeper's shelves → Conditions and recovery → Skill Block → Show me the figures` — only after the existing Keeper pact/availability gate.

The interface is already built; **extend existing content**. The quick and Keeper entries must share `Archive.conditionTopics(R)` as their source of *meaning*. In the quick guide, do not expose the optional detailed numbers; the Keeper reveals them only on explicit request.

## 4. Player-facing copy contract (EN / es-419)

### Short explanation — approved direction, final editorial copy may be tightened

**English title:** Skill Block  
**English short answer:**  
> A skill can reach its target and still be blocked. A blocked hit deals no damage and applies no effects caused by that hit. Each target in an area attack checks separately. Critical skill hits cannot be blocked.

**Español — título:** Bloqueo de habilidades  
**Español — explicación breve:**  
> Una habilidad puede alcanzar a su objetivo y aun así ser bloqueada. Un impacto bloqueado no causa daño ni aplica efectos ligados a ese impacto. Cada objetivo de un ataque de área puede bloquearlo por separado. Los impactos críticos de habilidades no se pueden bloquear.

**Feedback:** `Blocked!` (English), `¡Bloqueado!` (Spanish).  
**Micro-clarification for targeting help:** red aiming indicator means an obstructed/unavailable shot, *not* the defender's Skill Block. Only the later local **Blocked!** label means Skill Block.

The exact paragraph wording may receive a minimal editorial correction during engineering for legibility/idiomatic Spanish, but may **not change its mechanical meaning**. Keep one natural short paragraph, preferably four short sentences. Avoid “evades,” “misses,” “reduces damage,” “absorbs the attack,” “hero dodges,” or “every area attack is blocked together.” Avoid treating Blocked! as permanent damage immunity.

### Optional Keeper figures — content requirements, **not a verbatim manuscript**

The detailed text should reveal, in reader-friendly order:
1. **Whose defense?** Ordinary enemies: 20% single, 30% area; Ranger hero skills are easier to land (enemy chance 15%/25%); Rogue Bard performances cannot be blocked. Clearly say this is the **enemy's defense against the Ranger**, not “Ranger gains Block.”
2. **Night:** hostile enemies gain +5 **percentage points** to the appropriate base rate, with clear resulting examples; allied companions do not receive this bonus.
3. **Companions:** active lawful Soldiers, Archers, pets and Charmed companions independently defend against eligible enemy single/area skills at 20%/30%; the **hero does not** gain general Skill Block. Enemy Rogue maneuvers may be blockable by companions.
4. **Exceptions:** basic/automatic attacks and basic-combo finishers are never Skill Block candidates; critical skill impacts bypass. An area ability rolls separately for each legal impacted defender, not an entire cast at once; only linked damage/status effects are negated by that block.
5. **Player consequence:** using a legal skill still consumes its normal cooldown even if the target blocks it. Block is distinct from walls, missed projectiles, armor, shields, wards, immunity and manual evasion. No guarantees about arbitrary DoT or hazard effects.

**Dynamic authority:** Construct percentages from `R.skillBlock.enemySingle`, `enemyArea`, `rangerSingle`, `rangerArea`, `companionSingle`, `companionArea`, `nightEnemyBonus`. Format as percentages/percentage points (including noninteger future tuning), and do not change the player's save or the rule table. Names and localization are keyed to authoring meaning, not brittle partial string substitutions.

**Character-voice rule:** The shared Combat conditions technical paragraphs are neutral gameplay reference, **not spoken first-person Keeper memoirs**. The existing Keeper shelf can present these reference entries without fabricating a new personal anecdote. Preserve every owner-approved historical/manuscript passage in `narration.js`, and do not retouch other shelves to justify this addition. Follow `docs/KEEPER_REFERENCE_WRITING.md` and the established complete-passage localization approach. `docs/COMMUNICATION_STYLE.md` governs the owner's forum voice, **not** this gameplay text.

## 5. UX, presentation and accessibility constraints

- **Quiet feedback:** No new toast/banner, chat log, camera shake, skill sound, notification, persistent indicator, new HUD control or tutorial dialog. The existing separate capped and expiry-bound block cue queue stays intact. Never show **Blocked!** for a miss, obstructed projectile, warning-area avoidance, immunity, automatic basic or true critical.
- **English/Spanish equivalence:** The renderer currently draws a hardcoded `Blocked!` with `ctx.fillText`/`strokeText`; it has no locale input. Prefer a small *injected read-only locale/translation function* from the app shell rather than importing `app.js` into the renderer, creating a new global translation table or writing user preferences to campaign saves. The label must reflect the current language on a later draw, including a mid-session language switch.
- **Canvas/Pixi parity:** The PixiJS world uses the same overlay for Blocked!; preserve the existing overlay draw order, queue limits, reduced-motion behavior and performance budgets. Check text width and clipping (including the leading Spanish inverted exclamation mark); do not arbitrarily increase every combat label.
- **Phone usability:** Existing 11px bold text and brief lifetime may be difficult on real phones. First test legibility at actual on-screen scale and screen orientation, including crowded AoEs; make only evidence-based, narrowly scoped adjustments. A green headless Chromium run is **not** physical iPhone/Chromebook confirmation.
- **Assistive technology:** The reference must be operable by mouse, keyboard and touch. Preserve focus/Back semantics, reading order and legible Spanish typography. Do not announce every repeated blocked hit in an aggressive live region; if an accessible low-noise way of interpreting combat feedback is needed, use established status/help patterns and verify before claiming screen-reader acceptance.
- **No spoilers:** Don't reveal new enemies, bosses, hidden Strategist skills or Keeper records before ordinary progression. The universal mechanic can be explained immediately without naming unseen story elements.

## 6. Phased engineering plan — continue within this PR

### Phase 0 — Baseline and authoritative source reconciliation

- Re-read `main`, PR #760 and the exact merged skill-block code; verify the current branch remains based on the latest non-conflicting main before implementation.
- Audit `Archive.conditionTopics`, `menus.combatConditions`, `app.combatHelp`, `renderer.drawBlockCues`, existing Spanish translation catalog and the current focused tests. Preserve the published combat mechanic and separate future feature branches.
- Confirm the design's target routes and copy boundaries against current browser/runtime entrypoints; correct only proven doc discrepancies without reinterpreting owner choices.

**Exit:** A concise changed-surface list and a confirmed current-main comparison in this PR. No gameplay edits.

### Phase 1 — Discoverable quick reference and optional Keeper depth

- Add **one** `Skill Block` entry to `Archive.conditionTopics(R)` with the approved short paragraph and optional live figures. Share that topic through the existing quick and Keeper UIs without duplicating the prose.
- Add English/Spanish translations using the existing Archive technical-copy/label mechanism. Preserve exact approved `narration.js` source content.
- Extend original tests (especially `tests/player-conditions-reference.test.cjs` and `tests/archive-translation-coverage.test.cjs`) for access without Keeper, detailed Keeper gate, dynamic values after a deliberately altered rule-table fixture, numbers/order parity, English/Spanish readability, Back behavior and snapshot/effect immutability.

**Exit:** Fresh hero reaches a correct short explanation without Keeper; qualified Keeper exposes correct optional live figures; no game mutation or untranslated English.

### Phase 2 — Localized combat cue and targeting-help distinction

- Localize the existing `skillBlocked` overlay text through a read-only presentation dependency; preserve both renderer paths and all existing cue caps/expiry/fade and effects budgets.
- Adjust the existing Targeting and dodging help in English/Spanish to distinguish a blocked aiming line from a skill being blocked at impact. Do not change aim mechanics, colors or keybindings.
- Extend original `tests/skill-evasion-visual.test.cjs` and appropriate menu/help tests for languages, quick language switch, Canvas/Pixi overlay path, narrow-screen clipping and non-interference with critical/suppressed/missed hits.

**Exit:** An eligible blocked hit shows the right language with no unrelated cue; the control help describes both phenomena accurately.

### Phase 3 — Focused player-experience acceptance and documentation

- Run the smallest relevant original reference, localization, menu, combat-cue and renderer regressions. Do a targeted real UI/browser walkthrough where warranted (fresh hero, gated Keeper, English/Spanish, keyboard, phone viewport, PvE AoE and combat fallback); do not silently launch a full-game or cross-browser suite.
- Validate the meaningful examples against the live implementation; reject incorrect figures, confused red-aim terminology, affected class spoilers, incorrect combat receipts, focus/Back regressions, performance budget violations or accidentally altered author-approved prose. Treat actual relevant failures as blockers, unrelated minor debt with the repository deferral policy.
- Update this design contract **in place** with implemented/checked/remaining status and exact tested SHA/CI links; reconcile `docs/COMBAT_CONDITIONS_V09.md`, the documentation directory and maintained player help as appropriate. A runtime change gets its normal version/build/cache fingerprint process; the current design-only commit does not.
- Finish with one reliable PR handoff and verification boundaries. Keep the PR **draft, unmerged and unpublished** until the owner's separate release authorization.

**Exit:** The explanation works end-to-end, copy is accurate and correctly localized, original focused checks/build are green, docs match behavior, and untested hardware/subjective findings remain explicitly pending.

## 7. Independent acceptance matrix / game-designer signoff

| Player test | Expected result |
| --- | --- |
| A fresh Paladin, Mage, Ranger or Rogue can open Controls → Combat conditions → Skill Block | Read-only, accurate short paragraph; no Keeper/story gate, gold charge, new save field or combat mutation |
| Same topic from Skill journal, Basic/Full Barracks where existing entrypoints reach it | Same answer and correct Back parent; no duplicate definition |
| Keeper is unavailable or has no pact | Advanced figures are not unlocked through the Keeper, but short quick help still works |
| Keeper is available with pact | “Show me the figures” produces all live rates; Back returns to the short answer; narrative records are unchanged |
| Mage area skill reaches 3 eligible enemies, only 1 blocks | Only that one defender receives **Blocked!** and avoids that impact; the two others behave normally |
| Ranger skill vs enemy, Rogue Bard performance, lawful companion under enemy skill, daytime vs night | Correct asymmetries and eligibility explained with no misleading “Ranger dodges”/“hero blocks” claim |
| Actual critical skill contact, auto-basic/finisher, pre-contact miss or warning avoidance | No Skill Block cue for excluded results; no secondary effects on a truly blocked hit |
| English, Spanish and switching language while playing | Correct guide title/short text/figures and localized floating cue; no stale or double-translated fragments |
| Red aiming marker and a valid blocked skill in Controls help | Player can distinguish obstruction **before contact** from chance-based block **on impact** |
| Keyboard, touch and small screen / Pixi WebGL with Canvas overlay | Navigable reference, bounded cues, readable layout; real hardware acceptance recorded separately |

**No gameplay or balance changes are required to meet this acceptance.** If a real defect in the merged combat implementation is discovered, record the reproduction and treat it separately; do not disguise a mechanical rewrite as a guidance fix.

## 8. Current implementation ownership, evidence and explicit handoff

**Native owners:** `src/prototype/archive.js` (one topic and technical/localization catalog), `src/prototype/menus.js` (already-existing quick route), `src/prototype/app.js` (help copy, language source and shell dependency injection), `src/prototype/renderer.js` (existing cue text only). Existing `rules.js`, `combat.js`, `hero-combat.js`, `party.js`, `boss-combat.js`, `save.js` and `narration.js` are **read-only authorities** unless a separately established defect and permission changes scope.

**Original regression anchors:** `tests/player-conditions-reference.test.cjs`, `tests/archive-translation-coverage.test.cjs`, `tests/skill-evasion-visual.test.cjs`, `tests/skill-evasion.test.cjs`, `tests/skill-evasion-integration.test.cjs`, and appropriate menu/help/browser focused suites. Review the maintained focused CI selector rather than substituting a new self-validating test.

**Owner authorization today:** Create a solid **design/documentation-only** draft PR that a new chat can implement. The owner approved the described game-design approach and phase order. **Do not implement gameplay/UI in this design session; do not merge, deploy, run comprehensive tests or claim device verification.** The next session owns the engineering phases, normal focused validation, proportional triage and documentation updates, without asking the owner to repeat the design. Merge/publication and comprehensive certification remain distinct decisions.

**Status at design PR creation:** Original Skill Block merged and published, real-device verification unperformed; this new teaching system is **planned**, not implemented or tested. Design review is source-level only. Continue on the same PR rather than opening phase-specific competing drafts.
