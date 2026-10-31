# Companion company records & combat laboratory — experience specification (#620)

**Game:** *So I Became the Dark Lord's Problem*. **Design phase:** finalized on 31 October 2026 before implementation. **Integration status:** [PR #723](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/723) implemented the core Company/Orin/Developer-monitor workflows and **merged into main** at [`ff5236852`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/ff52368521f11846721f72b42eefe0e7d83b87cb). This is the **experience/design specification**; illustrative layouts and polish goals below are not all literal screen implementations. **Release evidence:** [exact-main focused validation and GitHub Pages run #41224050148](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41224050148) is in_progress (no conclusion); check its final outcome before marking dev.243 published. Physical-device and owner artistic acceptance remain unverified. Source authority: [issue #620](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/620), [existing companion mastery and Orin contract](COMPANION_MASTERY_AND_CHARMED_RINGLEADER_TRAINING_20261029.md), [Charmed heritage catalog](ROGUE_CHARM_HERITAGE_589.md), [Developer Mode](DEVELOPER_MODE.md), and current engine rules.

## Design-to-implementation reconciliation (31 October 2026)

- **Implemented and merged:** Completed Barracks → Company → Manage active group or Charmed species → **Inspect** opens an individual saved-ID-bound profile with HP, status, Mastery points/tier, Orin marker and a separate Rest/Activate action. A read-only **Abilities & mastery** reference uses actual authored troop, pet and Charmed native/signature/heritage/night rules. Owned boss pets link to the same ability overview. Orin's one-time 100-crown selection pages eight actors at a time and rechecks actor ownership and eligibility before charging. In Developer Mode a distinct companion panel shows last three resolved attack moves and five-second actual HP-loss DPS by stable actor ID.
- **Illustrative design rather than finished graphic detail:** the sample segmented progress bar, uppercase **WITH YOU** badge, graphic mini-cards and precise visual layout below are *not* present as such; the current game uses its native textual menus, **Active** status label and read-only skill details. Skill descriptions are rules-derived pre-critical/pre-defense estimates, not real-time enemy-specific damage forecasts.
- **Outstanding acceptance:** actual phone portrait/landscape, handedness layouts, desktop/Chromebook HUD scrolling and overlaps, sustained runtime smoothness and companion balance/pacing. These are not certified by focused CI or a Pages upload. More paid Soldier/Ranger/pet training remains deferred.

## Fantasy and priorities

The player's Barracks should feel like a **company ledger** of individuals, not a developer inspector and not a trade storefront. Even two unnamed Goblins should feel distinguishable: *this* Goblin's experience, capabilities, current wounds and personal investment. The player should not need to learn combat formulas to understand which ally they want in the field or why an ability is locked. The technical diagnostics belong only in Developer Mode, not in the ordinary game's company book.

Four essential questions, in order: **Who? Where/condition? What can they do? How are they growing?** Actions follow information; Rest and Activate must not be the primary tap target on an unfamiliar row.

### Visual voice and interaction

- Reuse the existing dark/earthy background, muted brass accents, legible light copy, menu action components, optional species/pet insignia, and established game vocabulary. Avoid competing neon or a faux inventory grid.
- Prioritize clear **name**, a single status label, and a compact segmented Mastery bar with a textual numerator for accessibility. The status should read **With you**, **Resting**, **Fallen** or **On expedition**. **Mastery II · 13/18 total** must not be confused with a level, an unearned tier or 13 points within Tier II.
- Two layers of detail: the profile is understandable in one short screen; **Abilities** provides inspectable actual skill cards. Don't show 14 lines of formulas for every skill in the hero's main menu. Text remains readable in both phone orientations; native modal scrolling should not trap touch or cause accidental purchases.
- Use actor's immutable saved **ID** for every callback and drilldown. For duplicate visible names, show short stable ID beside the name; do not manufacture a changing "#7" identity from array position. A changed/removed actor invalidates an old action and returns to the roster without spending crowns or affecting another ally.
- Never create a new image asset as a dependency for a functional player profile. Existing name, role, authored species/boss family and restrained icon treatments can suffice; bespoke illustrations may be added separately after visual review.

## Navigation contracts

```text
Completed Barracks
  Company
    Manage active group -> paged owned roster
      Inspect individual -> Individual profile -> Abilities & growth
                                |                  -> Back to same individual
                                +- Rest / Activate (existing legality reasons)
                                +- Name, only if still unnamed
      -> Back to the same page
    Charmed monsters -> species list -> All/Active/Resting/Fallen/Away + pages
      Inspect individual -> same profile -> Back to original species/filter/page
    Boss pet collection -> chosen pet -> owned individual's profile/abilities
    How Mastery works (one shared help page)
    Name companions, Recruit companions (existing)
  Rescued specialists -> Orin -> training chooser -> preview -> confirm/cancel

Orin in person -> same chooser -> preview -> confirm/cancel
```

**No destructive/rest action on a roster row.** Page and filter state are preserved through profile/abilities and revalidated when returning. A status change should refresh the existing roster logically, showing where the companion went. Fallen and away actors can still be inspected; use existing recovery/expedition explanations rather than making up a shortcut or cost.

## Companion profile layout

```text
COMPANY / INDIVIDUAL
[Charmed • Goblin Ranger]             [WITH YOU]
Pockets                               [ID ally-134]
Health    122 / 122

MASTERY II            13 / 18 total points
[##########-----]     5 points to Mastery III
Ringleader status: Not trained   (Charmed only)

[Abilities & growth • 3 known, 2 available]
[Rest in reserve]                    (disabled reason if illegal)
[Choose permanent name]              (only if eligible)
Back: Goblins / All / Page 2
```

These are **layout-only sample values**; display numbers and skill counts from the actual individual and current rules, not from this example. The game may use the existing menu description and action rows to approximate the hierarchy while retaining legible spacing. **Do not add permanent identity strings or counters to saves.**

## Abilities & growth layout

Display named ability entries in actual combat-priority/slot order. Each entry has:

1. **Name and ability family** (Native, Ringleader, Third heritage, Night-born innate, Soldier/Ranger first/charged, or pet first/charged).
2. **Plain-language effect** first: e.g. "A short cone that slows up to two enemies" or "Jump to one enemy along a clear route". Source geometry and limits from authored rules; no vague "skill" placeholders.
3. A compact mechanics row: **range / width or radius / target cap / cooldown**; only show an effect (slow, push, siphon, healing, ward, movement) if actually authored.
4. **Available** or **Locked — reason** (hero Skill 2, trainer or legitimate owner/class prerequisites). A locked action remains discoverable, never clickable as an impossible purchase.
5. **Mastery impact**, with **current → next** only for the coefficients that genuinely change. At Tier III say MAX. When a stat does not scale with Mastery, say so rather than claim generic damage improves. A separate "Before defenses/critical" qualifier applies to damage estimates.

Normal attacks and passives should not masquerade as unlockable skills. The two night-captured species retain Soul Drain or Shadow Pounce **after sunrise**; their "night" refers to capture origin, not daytime combat prohibition. The third heritage skill does not replace native or Ringleader action. The common mastery thresholds are **4 / 10 / 18 cumulative**, shared but **tracked individually**, not a species-level or squad-level rank.

**Shared help: How Mastery works.** A brief single entry in Company explains legitimate +1 quest, +1 hero level, +1 returning captain, +1 distinct guardian receipt, +2 first credited normal/TRUE boss; only living, active companions earn it; no Mastery in Arena or Developer Mode. Tier improves existing effects conservatively and does not grant a locked skill. Avoid repeatedly presenting the rules on every card.

## Orin — personal, irreversible choice

- Show a unique identity and role, current Mastery, **Available / Already trained / Unavailable** in a paginated chooser of **8 rows/page**, keeping roster order. Provide a simple status view filter when helpful, but never hide already trained individuals from inspection or lose the current page on Back.
- Rows remain **selectable for inspection** even when the purchase is not affordable. For trained/ineligible individuals explain the reason in the preview, not a dead disabled row. Select exact saved actor ID and re-check campaign/actor eligibility at confirmation.
- Preview: **this individual's** HP and attack before → after, current balance, exact **100 crowns**, one-time 2.5× HP / 1.5× damage, pursuit/frenzy and independence from Mastery and hero Skill 2. Do not imply Mastery can be purchased or the species as a whole is promoted.
- **Confirm training · 100 crowns** is the sole payment action; insufficient crowns disables it and shows the shortfall. Back returns to the same candidate page. Trained/removed/stale actors cannot be charged twice or accidentally resolved to another Goblin.

## Developer-only companion telemetry

Keep the existing hero *dealt/taken last-hit and five-second DPS* monitor byte-for-byte in meaning and on its existing edge. Separately show a **DEV · COMPANIONS** panel on the **right of desktop / left of phone**, never in ordinary play. Default **collapsed on phone** (count + optional party DPS); desktop may expand. A tap expands the scrollable interior without making a whole-screen overlay.

Compact row model:
```text
DEV · COMPANIONS                   [collapse]
4 WITH YOU
Pockets · Goblin archer [ally-134]         14.2 DPS
  Dust Entrainment  36  /  Shot 12 / Shot 0
Thornpup · Pet [ally-51]                  8.6 DPS
  Tripwire 26 / Bite 17 / Bite 0
```
Illustrative names and numbers, **not live measured results**.

- Each row is one stable actual **active and living** Soldier, Archer, Charmed creature or pet. Same-name units display a short ID. Sorting follows company roster order. Resting/fallen/away members disappear promptly; capture/recruit/recovery adds a row.
- **Last three resolved attack MOVES** per actor (newest first), not last three hit callbacks. A triple-arrow release = one move; a cone hitting two enemies = one move; a miss/blocked or zero-damage move = **0**. A newly launched ranged move is **pending** until all real arrows resolve/cancel; do not count projected damage. Grouping by "same frame time" is insufficient when two actions can occur in one simulation tick: use per-release IDs.
- Record final actual **enemy HP removed** after protection/fortification/armor, with overkill capped by previous HP; real landed damage enters the **rolling five-second DPS** at impact time. No reflected damage, incoming harm, visual-only event, duplicate callback or outgoing hero damage belongs in these totals.
- At most three recent completed move descriptions per actor and a bounded five-second impact-time ledger. Purge removed/old actors and unresolved expired/cancelled projectiles; no unbounded maps/history even during very long tests. Stopwatch uses simulation time: pause freezes, advance decays. If the screen repaints more often than the game state changes, update the text only when changed and throttle expensive DOM writes.
- Reuse stable responsive anchors; constrain interior to safe-area height, keep hitboxes comfortably tappable, and avoid covering hero HP, target/skill strip, telegraphs, update prompts and either left/right phone thumb control. Header can intercept a deliberate tap; panel interior can intercept scrolling; outside region must remain playable.

## Acceptance gates before recommending merge

**Design:** An individual can be found, understood and compared without purchasing or fighting. Same-species duplicate names are disambiguated stably and return correctly through filters/pages. Real native/third heritage/night/standard/pet abilities are discoverable with accurate locked and tier effects. Orin is transparent and cannot charge wrong identity.

**Functional focused tests:** at least 0/1/3/6/7 actor rows; named duplicates, stale callback and 0/99/100 crowns; true damage from multi-target melee and delayed projectile families; misses, blockers, overkill/mitigation; three completed moves and pending releases; five-second decay and simulation pause; dismissal/recovery/new run; ordinary-mode and save isolation; unchanged hero monitor and deterministic combat/rng.

**Build:** generated service worker and version records must match exact branch source. CI successes must correspond to the branch's tested commit, not an old checkpoint. Keep draft until all applicable checks pass.

**Field acceptance:** actual iPhone portrait/landscape and both hand-control layouts, Chromebook/desktop, scroll and non-overlap, plus combat sound/VFX and long-session smoothness. Automated tests do **not** constitute physical device verification. Existing unchecked gameplay/balance list in #620 remains open. No speculative mastery rebalancing or paid Soldier/Ranger/pet specialties.

**Gate:** merge and GitHub Pages deployment require new owner authorization; historical #608 approval does not carry over.
