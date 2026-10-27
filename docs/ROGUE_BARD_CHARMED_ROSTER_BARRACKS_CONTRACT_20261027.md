# Rogue Bard — Expedition ownership caps and low-friction Barracks company management

**27 October 2026 · Owner-directed clarification · Draft PR #511 · No playable Rogue or Charm implementation**

This is the controlling clarification for the **Rogue's charmed-creature ownership quota** and the **future Basic/Full Barracks interface**. Read with [canonical owner handoff](ROGUE_BARD_CANONICAL_OWNER_HANDOFF_20261027.md) and [fourth-class runtime housekeeping](ROGUE_BARD_FOURTH_CLASS_HOUSEKEEPING_20261027.md). In any conflict with an earlier “12 total charmed” suggestion, **this document supersedes that global limit**. The owner has not finalized Charm probability; do not substitute an arbitrary lower capture rate for an implemented ownership rule.

## 1. Owner rule: Expedition governs two different limits

The existing non-Rogue active caps by Expedition rank 1–6 remain **2 / 3 / 3 / 4 / 5 / 6**. The Rogue always has **one additional active slot**, including at rank 1: **3 / 4 / 4 / 5 / 6 / 7**. PR #511 already prepares this class bonus *inertly*, without adding Rogue as a playable class.

**New owner-established restriction:** The Rogue's maximum number of *owned charmed creatures of any one individual eligible authored monster type* equals **her effective active Expedition cap at that rank**. Count every living active, resting/reserve, fallen, and otherwise still-owned charmed member of that type. Do not count just the currently deployed copies. Do not merge separate authored types into one species-family quota.

| Expedition rank | Existing hero field-party cap | Rogue field-party cap **and maximum owned of each individual charmable type** |
|---|---:|---:|
| 1 | 2 | **3** |
| 2 | 3 | **4** |
| 3 | 3 | **4** |
| 4 | 4 | **5** |
| 5 | 5 | **6** |
| 6 | 6 | **7** |

Example: At Rogue Expedition 2, **four Goblin Slingers** may be owned in total: 1 active + 2 resting + 1 fallen **already reaches the four-Slinger quota**. She may independently own up to four of another genuinely different eligible monster type; the two types do not share an arbitrary aggregate Charm budget. At Expedition 6, seven Goblin Slingers plus seven ordinary Goblins are theoretically possible if both are separate vetted authored charmable types. **Seven is a per-type upper bound, not a blanket company-size restriction.**

**The older proposed 12-owned-charmed-monsters total is rejected as current design.** No new gameplay-wide charmed-monster count cap should be invented. The existing engine's general **200-companion safety guard** is an independent legacy technical constraint (see `party.js::companionRecruitmentReason` and `save.js`), **not** a newly approved Charm progression rule. Audit whether it would practically obstruct the available vetted creature catalog; do not silently equate it with 12 or raise it without save/performance validation.

### Counting identity and entitlement

- Derive one stable **authored individual-type ID**, independent of translated display name or player-given nickname. For example, a Goblin Slinger and a different Goblin archetype must have different quota identities. A simple broad `speciesId: 'goblin'` is **not precise enough** to count those independently. The exact identifier contract should be designed against the existing enemy catalog and allowlist before Charm goes live.
- Only Rogue **new Charm attempts** use this quota. The admission check happens **before** rolling the optional Charm chance or moving the hostile, so quota-rejected targets remain ordinary enemies with no partial conversion and no RNG consumption. One primary legal basic hit remains the only eligible capture event.
- Owned counts include **active + rested + fallen + away**, counted once per stable companion ID, regardless of Barracks location and regardless of whether the member can currently fight.
- Gaining an Expedition rank may raise the per-type entitlement; it **never creates or activates** companions automatically. No capacity is gained from purchasing/upgrading Barracks.
- **Succession preserves all previously owned charmed creatures**, as the owner already directed; later non-Rogue classes cannot Charm new ones. If a new hero has fewer active slots, move only the necessary excess **to reserve**, preserving species, names, IDs, health, fallen state, and recovery rights. Do not retrospectively delete inherited monsters or apply a reduced current-class quota to already-owned specimens.
- Existing boss pets remain a separate collection and count toward active party spaces, **not** the per-charmable-monster-type quota. Captains, Ringleaders, bosses and other prohibited hostiles never enter the allowlist.
- A full active party does not cancel ownership eligibility: if the type is below quota, a successful Charm may join **reserve** rather than exceeding the active slot cap, provided the conversion/roster transaction is validated. Barracks construction is **not required** to Charm, and no barracks must exist merely to retain owned companions.

## 2. Source-verified current Barracks mechanics, and what not to change

At the 27 October #511 head, `progression.js::expeditionPartyCap` returns the rank cap plus the dormant Rogue bonus. `party.js::barracksFieldCap(b)` is **Full: full effective Expedition cap; Basic: min(3, effective Expedition cap)**. `party.js::activateCompanion` checks the actual local completed Barracks cap. `restCompanion` simply transfers a member to the global company reserve without assigning a finite building storage slot. `menus.js::barracksGroupMenu` currently puts *all* roster members on one long Rest/Add action list; `barracksPetMenu` is a separate boss-pet collection.

**Preserve the meaningful Basic Barracks limitation, without manufacturing a storage restriction.** For Rogue, a completed Basic Barracks can deploy/redeploy **at most three active companions from there**, even if Expedition 2–6 authorizes four to seven elsewhere. It must **not offer a fourth active redeployment** through a Basic Barracks; show the current 3-slot local service limit, an informative disabled action, and a clear Full Barracks upgrade path. A Full Barracks allows the full class/rank active cap. Ordinary captured creatures can still be **owned and resting in the global roster** even without a Barracks. “Barracks capacity” here is a **field-service/active-management cap**, not a reason to destroy or refuse owned Charm creatures as physical housing overflow.

The owner's latest direction is **keep Basic Barracks nearly as-is**: preserve its simple services and meaningful smaller redeployment limit, and use a lightweight path to the same global charmed collection if any exist. The **Full Barracks** is where high-volume sorting/deployment should be especially efficient. Both must read the **same authoritative owned roster**, not separate local inventories or duplicate NPC copies. The ordinary Soldier/Ranger hiring restriction for Rogue remains independent: do not let a new generic companion selector accidentally enable their hiring.

## 3. Required navigable and low-pressure management

### Company landing page: concise, informative, no wall of names

Display **Active X/Y**, **Resting N**, **Fallen N**, and a separate **Charmed collection: T types / N owned** when applicable. Keep **Boss pet collection** distinct. A Rogue's company can legitimately contain many reserve specimens; do not concatenate every charmed unit into the initial Company action list. Avoid mandatory batch assignments, timers, notices, auto-sorting decisions or repeated confirmation dialogs merely to manage a collection.

**Full Barracks** should offer immediately understandable paths: **Manage active group**, **Charmed monsters**, **Boss pets**, and **Recovery / naming** using the current hierarchy. Basic Barracks may expose the same read-only collection and resting choices without promising extra deployment slots. The existing normal Soldier/Ranger management remains accessible to the other three classes and successors who legitimately inherited regular troops.

### Charmed-monster collection: by precise type first, then individual

1. A **species/type index**, not 50+ undifferentiated companion buttons: “Goblin Slinger · 4/4 owned · 2 active, 1 resting, 1 fallen”; “Wolf · 2/4 owned · 1 active, 1 resting”, etc. Include an **All / Active / Resting / Fallen** view or concise equivalent without burying the core action.
2. Selecting a type shows a **paged short list**, ideally **6–8 companions at a time** on phone as well as desktop. Each row states the individual name (or species label), HP/fallen state, **Active / Resting / Away** status and one appropriate immediate action. Preserve Back context, current type, page and useful scroll/focus when refreshing after a Rest/Add action.
3. **Rest** and **Add to group** remain one simple action with the existing legal safety gates (combat, unconscious, away, completed Barracks and local active cap). No silent eviction or automatic arbitrary rest of someone else just because a new companion was selected. When the active group is full, say **which limit** prevents Add (Basic Barracks 3, Expedition rank N, or fallen active slot) and offer an obvious route to Manage active group.
4. Naming, eventual recovery and optional voluntary dismissal belong in an individual detail page or concise action. Make irreversible dismissal explicit, not an accidental consequence of a paging control; boss-pet no-dismiss rules remain unchanged. Do not force the player to name each capture.
5. Sorting should be **stable** (authored type/name, then persistent companion ID or capture order), not rearrange on every HP tick. **Never assume roster array index is permanent identity**; use stable companion IDs for callbacks. Change of company state should refresh summaries without returning to the top-level Barracks menu.
6. When no charmed monsters are owned, hide the empty collection path for non-Rogue classes, or explain “None charmed yet” only where Rogue discovery helps. Do not expose a Rogue control to current players as a false promise. Keep English/Spanish support, accessible keyboard/phone navigation and existing menu history behavior.

**Performance:** paging/filtering is a menu-open operation over bounded saved records, **not** another per-frame entity scan, reserved-companion AI, or a new world rendering system.

## 4. Implementation dependencies and required regression cases

**Before gameplay integration:** approve the stable individual-type key by auditing actual enemy archetypes; add bounded provenance and authenticated quota fields, lawful conversion without kill/XP/quest/respawn duplicates, role-based companion AI/recovery, v4 save migration/validation and Succession preservation. Do not create a magical independent Barracks inventory. Keep the PR in draft; this document is a design contract, **not** evidence that UI or capture is implemented.

**Must test:** each rank 1–6 exactly at and above type quota; Goblin vs Goblin Slinger separate keys; mixed active/resting/fallen/away counts; refusal without RNG/progress mutation; active-full Charm successfully placed into reserve; successful Charm without owning/building any Barracks; Basic 3 vs Full rank-derived cap including Rogue 7; multiple type pages (e.g., 30–60 owned distributed across types) with quick individual add/rest/naming; fallen/away and disabled-action reasons; existing Pet collection; ordinary 3-class recruitment and existing-save behavior; 4-class Succession with inherited creatures and smaller active cap; save round-trip, bilingual menus, keyboard/touch and no page reset on ordinary actions.

**Design separation:** the owner did **not** decide that Charm probability must be nerfed. The **12% per surviving legal primary hit** remains an untested candidate. Once basic recruitment is playable, compare actual early capture frequency, first-ally time, encounter disruption and reserve growth at fixed seeds. Tune probability only on balance evidence rather than introducing a speculative hard aggregate ownership ceiling.
