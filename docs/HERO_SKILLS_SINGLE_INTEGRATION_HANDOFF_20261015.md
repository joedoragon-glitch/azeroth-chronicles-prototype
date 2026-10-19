> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# Azeroth Chronicles — single combined hero-skills implementation handoff

15 October 2026 · Handoff for the next integration conversation
**Status:** Authoritative skills and audiovisual implementations are **committed in separate GitHub branches**; no combined branch, combined testing, production merge or deployment is certified by this handoff. The user requested one consolidation/testing pass rather than separate tests for each skill workstream.

## Verified GitHub references (read again at integration time)

- Repo: `joedoragon-glitch/azeroth-chronicles-prototype`
- **Completed hero gameplay, balance, player-information UI and documentation:** `feature/hero-skills-2-4-on-snapshot-20261015`. **Ignore the old “2-4” part of its name**: it contains all eight normal and charged active skills for all three classes and every subsequent decision. Last pre-handoff documented source checkpoint: `2300d7e9c9e7142595956ae3dca4d3acdbe37f15`. This handoff document is committed afterward.
- **Completed hero audio/visual source:** `feature/hero-skill-av-20261015`. Created from a historical skill-branch ancestor `1d142ea7936e4004e697fb9ebbb7205eb6d33cf5`, **before** the later `Hero skills` menu, Barracks and Keeper quick-reference changes. Its own README/ledger calls the AV work source-complete, not run-tested.
- **PR #300** (`implementation/director-snapshot-20261013`) was rechecked and is **MERGED into main**, head `cbde536da1efb334a505ed95b7d0e904d67154e9`. Earlier notes saying #300 remained unmerged are historical and must NOT be treated as current.
- **PR #305** (`design/hero-skills-3-4-approved-20261015`) is an **older incomplete main-based draft, still open**. Do not merge or cherry-pick it wholesale; both source-complete branches above supersede it.
- **Other potentially overlapping, currently unmerged PRs:** #308 (combat/timing etc.) and #310 (interrupt charged skills on meaningful HP damage) were open when checked. #309 (timed Slow affects skill cooldown recovery) was closed/unmerged. Do not automatically import, override, or discard those branches; review latest status/owner intent before including any of their mechanics.

## Integration order (create ONE new isolated integration branch)

1. Re-fetch current `main`, both hero branches, their code and docs. Do not rely on previous descriptions or branch display names.
2. Branch from **latest main**. Merge the completed **hero-skills** branch first, reconciling newer main changes without dropping authoritative approved Skills 1–8 combat/input/save/player UI code.
3. Merge the **hero-skill-av** branch second using Git three-way ancestry, not a blind directory/file overwrite. The AV branch forked earlier than the latest UI changes; preserving `src/prototype/menus.js`, `src/prototype/archive.js`, `src/prototype/app.js`, `README.md`, and the latest hero reference docs is essential.
4. Keep additive AV presentation event fields and owners: `src/prototype/hero-presentation.js`, `src/prototype/audio-hero.js`; reconcile overlapping `hero-combat.js`, `combat.js`, `renderer.js`, `app.js`, `combat-visuals.js`, `audio-effects.js`, `audio.js`. Do not erase the gameplay/source changes while selecting AV changes or vice versa.
5. The AV branch has mechanically edited generated/package/version artifacts (`index.html`, `prototype.html`, `phone.html`, `sw.js`, build-info, package/lock, templates and `scripts/site-assets.cjs`). Resolve **one** combined canonical version, asset inventory, loading order and offline cache ID. Regenerate the site using the repository’s supported build workflow **once combined validation is authorized**; do not treat either dev branch's prebuilt entry files as certified output.
6. Compare merged gameplay mechanics against the latest skill branch; AV modifications are supposed to be **presentation-only** (new event/flight/contact metadata must not change skill admission, damage or control). Do not add new passives.
7. Document the exact integration branch, commits, file-level decisions, remaining conflicts and testing status; prepare **one consolidated PR** for owner review, rather than individual release PRs per workstream. Never merge into main or deploy without explicit owner approval.

## Approved hero-skill design contract

- **3 hero classes × 8 skill slots × 2 modes = 48 forms.** Each tap/charged pair shares a learned Rank 1–8 and cooldown slot. Fixed **0.65s hold** on all eight slots; short tap **<0.20s**; incomplete hold cancels. Skill 4 **Ranger also charges**, providing companion Rally, not a dash.
- Cooldowns base normal slots 1–8: **0.85, 3, 8, 14, 9, 4, 15, 24s**; charged: **3, 6, 20, 20, 18, 12, 25, 40s**. Existing Cooldown Training reduces up to 20%. Damage scales **+15% of Rank-1 baseline per skill rank**. No mana cost in current cooldown-only mode.
- **Paladin:** Skill 2 brief Weaken; Skill 3 Shield Stance (8s, significant defense, no Skill 1, other damage ×0.6; CD begins on shield end) / Shield Bash; Skill 4 Judgment / Grand Judgment taunt (boss basic-target cap, scripted boss specials unaffected); 5–7 holy/rush/control; Skill 8 Sanctuary Oath / Last Bastion damage, bounded party ward/heal, NO invulnerability. Ward and Shield Stance use the **stronger single defensive reduction**, never multiplicative. All encounter geometry/knockback remains collision-safe.
- **Mage:** Skill 2 Frost Bolt/Burst owns Slow; Skill 3 Interrupt / Silence Field affects caster and companions as well as enemies; Skill 4 Fracture/Rupture existing nonstacking vulnerability; Skill 5 Force Pulse/Wave uses knockback, NOT frost Slow; Skill 7 Arcane Chain/Chainstorm bounded chain without invented statuses; Skill 8 Astral Detonation / Arcane Cataclysm bounded explosion, charged short **25–29% Fracture for 2.5s**; no self-healing or immunity.
- **Ranger:** Skill 2 Pinning Shot/Volley slow; Skill 3 heal hero/charged wounded living party; Skill 4 normal hero haste, charged **Companion Rally** modest movement and *ordinary* attack-speed buff, requires eligible nearby living companion; Skill 6 Repelling Shot/Volley knockback **without haste**; Skill 7 single piercing anti-elite shot; Skill 8 Hunter’s Salvo / Grand Hunt bounded real multi-arrow targets, slightly more non-piercing arrows if exactly one eligible foe, without healing or immunity.
- Recent anti-rotation guardrails: shorter Paladin Weaken **1.8–2.2s**, shorter Mage normal Frost Slow **2–2.2s** and charged Frost Burst **3.2–4.2s**, bounded repeatable Skill 5 normal/charged targets **6/8**, Paladin Skill 7 **6/8**, Skill 8 per-class caps. Do not introduce longer charge durations, new status effects, hidden combo penalties, or blanket enemy immunities. Avoid a fixed rotation that trivially wins every encounter; preserve boss warnings and reactive counterplay.
- **Independent class passives are deliberately DEFERRED** until real skill testing. Do not invent or integrate any hero passive yet.

## Player information contract

- **Adventure → Hero skills** is the primary quick reference.
- Both Basic and Full Barracks and rescued teachers also expose it, plus legacy Character/Skills controls.
- List is concise: class-specific name, number, rank, role; one optional skill page explains tap, charged, **live cooldowns**, restrictions, trainer and cost. Do not revert `menus.js` to the old outdated “skills 1–3 charge only / shared heal and immunity” text.
- Keeper’s Archive is optional deeper information, no long mandatory tutorial or UI wall. Only revealed skills appear to preserve discovery.

## AV presentation contract and integration risks

See the AV branch:
- `docs/HERO_SKILL_AV_IMPLEMENTATION_20261015.md` (48-form mapping and event contracts)
- `docs/HERO_SKILL_AV_DEVELOPMENT_LEDGER_20261015.md` (branch parent + source implementation status)
- `docs/HERO_SKILL_AV_COMBINED_VERIFICATION_20261015.md` (deferred integrated verification)
- `src/prototype/hero-presentation.js`, `src/prototype/audio-hero.js`

This work uses Canvas/source-drawn class-specific effects and original synthesized sounds (not recorded audio or new sprite sheets). Keep status glyphs truthful; arrows and impacts only after actual launches/hits, avoid fabricated damage; honor audio volume/mute, reduced-motion, mobile performance, enemy warning priority, offline PWA. Retain additive event metadata and new script loading order in **all** entrypoints and service worker.

## One combined validation and release gate

The owner previously prohibited piecemeal tests. **Prepare integration without starting tests prematurely**. Once the whole consolidated candidate is assembled and the owner authorizes the joint gate, run one coordinated regression for all 48 forms, Rank 1/4/8 behavior, class balance, fixed/charged input on keyboard/touch, boss/TRUE telegraphs, party and status interactions, v4 save restore, image/audio behavior, reduced motion, PWA packaging, actual devices and performance. Include one pass through the broad gameplay, CI/build and offline gates from the AV verification doc. Do not claim correctness from source commits or mergeability alone.

**No production merge or deployment without explicit authorization**, even after a successful combined validation.
