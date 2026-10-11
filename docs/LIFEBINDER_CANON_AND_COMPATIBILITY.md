# Lifebinder — Forest Crypt identity and beta continuity (#237)

**Status:** independent draft canon and high-yield beta implementation, for owner review. **Never merge or deploy as part of this PR without the owner's separate approval.** Supersedes the *current-day character* label “Crypt Guardian”; does not erase historical documents describing the old release. Scope: master #232, audit #251, issue #237; combat/estate draft #230 remains independent.

## Character contract

**Biography (the internal authorial truth).** The Lifebinder was once a mortal mortuary oathwright: a burial mason who thought the least one owed the dead was a name and a witness. As one of the previous player-controlled hero's **five adventuring companions**, he followed that hero's campaigns not as a conventional healer but as the one who counted and buried those the party left behind. Mortally wounded during those travels, he made himself his first enduring binding; the existing hooded, skull-faced body and ossuary-like stone mantle are the visible cost of that choice. When the player abandoned the world and the hero and companions recovered independent agency, he faced the scale of the old party's killings and began to bind surviving traces of the dead into incomplete undead existence. The hero became the Dark Lord, and the Lifebinder supported a peace meant to end hero-farming, even as that peace acquired prisons, forced labor and its own violence. He still loves the old friend behind the Crown but refuses to cross a name off his casualty ledger merely because their shared government would prefer silence.

**Personality:** soft-spoken, patient, precise about names and promises; warmer toward the supposedly dead than toward officials. His fault is an inability to accept an ending: early desperate bindings were sometimes made before consent could be asked, and his doctrine of mercy can turn possessive.

**Present motivation:** give the realm's casualties continuity, a place to belong and protection from adventurers treating them as experience points. He would prefer his friend's peace to endure, but he believes he could administer a fairer one if the Dark Lord falls.

**Successor claim:** his powerbase is not the Ridge Tyrant's coin, the Keeper's Archive, the Sentinel's formal command or the Dragon's air force. It is a potentially vast **community of bound dead** from successive wars, disasters and hero campaigns—people with memories, debts, loyalties and routes through all five regions. Many would rally to their maker by choice or gratitude; others would not. The grave-marker and tending network lets such a following outlive one battlefield. The accessible level-3 personal encounter is intentionally no measure of how many could ultimately support him.

## What life-binding actually does

- It anchors a *fading person's continuity* to identifiable remains and an attended memorial anchor. The body may move or speak again, sometimes as bare skeleton; memory and intention can persist, but the result is **undead, not cured or resurrected**.
- It cannot reverse an ordinary wound into healthy living flesh, restore a pulse, conjure a person from no trace, or guarantee that every long-dead casualty can be reached. Some bindings fail. It is deliberate work rather than an instant mass-raise spell.
- A bound person may forget sensations, tire into stillness and need an anchor renewed. Anchor-keepers can share the upkeep; the Lifebinder does not have to control every step personally. A person can seek release, which ends the bond without restoring mortal life.
- The act of binding **does not grant obedience**. His true military potential depends on people choosing to remain with him. Those bound without advance consent can be grateful, angry, disloyal or desperate to rest; the old coercions are part of his character's moral burden.
- These are **narrative limits**, not a new regeneration, ally-recruitment, inventory or damage subsystem for this beta.

## Undead life under the Crown Peace

A bound skeleton can choose work, keep relationships, guard a road, refuse a patrol, withdraw to a memorial settlement, or defend a home from a hero. The Crown Peace discourages killing creatures for XP and recognizes some bound residents as subjects worth protecting. It does not make their lives unconditionally free: the regime can still compel labor and use fear to keep order, which is precisely why the Lifebinder's claim to more humane succession is credible but not innocent.

**Ontology / implementation fence:**
- **Skeletons:** present in Greenwood and the Forest Crypt, and used by the current Crypt summon and TRUE entourage. Some may be life-bound former casualties. No assumption that *every* Skeleton is personally bound, owned or friendly to him.
- **Lantern Wraiths:** established night-only spectral enemies in the Marches, with different movement/combat and a separate Keeper wraith-summon connection. Their origin and relationship to life-binding are **unresolved**; neither “all wraiths are Lifebinder-made” nor “all are dead human souls” is canon.
- **Ash Stalkers:** different Frontier night monster, not automatically undead. The Drowned Keeper's appearance does not prove he underwent the Lifebinder's ritual.
- Do not introduce a new undead species registry, automatic raise-on-kill, retainer conversion or global faction relation in #237.

## What the Forest Crypt means

The Forest Crypt was an older burial place. The Dark Lord intended to make it his **unfinished private winter estate**, a rare house in which the previous hero and five companions might sit together without quests, campaigns or a throne room. The plan shows six seats at the winter table. The Lifebinder keeps that promise alive: unfinished construction and Borin's compelled smith-work adjoin guest quarters and named memorial stone. Warm rooms are for the living visitors and the bound who still value company, not a claim that skeletons need heating. The estate represents the lost possibility of ordinary friendship beneath Crown privilege, and the contradiction of building hospitality with a prisoner. Preserve the current Forest Crypt combat footprint, older tomb wing, workstations, route, trapped rooms and accessible first-dungeon role.

## Small discoverable beta cues actually included

1. **At first Crypt entry** the existing one-time dungeon-lore mechanism mentions the old ossuary, half-built Crown rooms, six-seat winter plan and memorial names. No new entity, art asset or dialogue engine is needed.
2. **At Borin's workstation** the established context now mentions the Lifebinder's ledger with the categories BOUND and RELEASED, while keeping Borin's forced construction role unmistakable.
3. **On the “An Unfinished Retreat” quest payoff** one short narration explains that the Lifebinder once traveled with the Dark Lord and bound the campaign dead rather than reviving them. The existing quest ID, rescue and payouts are unchanged.
4. **In the Keeper's province reference** Greenwood identifies the Lifebinder as a former companion and the undead as bound rather than healed. This uses the existing Archive shelf; no new lore menu is added.

The clues complement rather than replace all Forest Crypt props: coffins, ossuary, grave-marker, construction resources, guest lodge, table and Crown retreat already exist. Additional P1 environmental luxury and original sprites belong to the estate/art scope, not a #237 beta gate.

## Technical contract and observed #230 status

| Surface | This PR | #230 / integration warning |
| --- | --- | --- |
| Identity | Name “Lifebinder” for existing family **crypt**, never a second Great Lifekeeper | #230 also renames this table; reconcile by intent, not blind cherry-pick |
| Encounter | Normal name “Lifebinder”; TRUE instance “TRUE Lifebinder” | Existing early-dungeon HP **650**, damage **16**, level **3** and original moves stay here |
| Quests / saves | Quest 3 name, id, target, rewards, rescued/keys/victory flags unchanged; on v4 restore, old boss entity labels are updated in place | Do not rewrite legacy key strings, audio and sprite family keys or historical snapshots |
| Combat | This PR deliberately retains the baseline skeleton grave call, three living normal summons, and six-unit TRUE roster; no changed base damage or geometry | #230 experiments with three Crown-styled estate retainers per cast up to twelve living normal adds; ground circles expand to four. The draft itself marks target placement, TRUE styling, original artwork, mobile solo audits and tests incomplete |
| Estate | Adds text to existing dungeon and workstation inspection; old geometry and props untouched | #230 stages warmer palette and furniture but has unfinished art, construction detail and save/phone route QA |
| Wraiths | Marches nighttime wraith and Keeper's own wraith summons remain distinct | Do not relabel them as Lifebinder-made or as junior Crown attendants |
| Checks | Targeted identity/old-save contract test plus existing quest, victory and TRUE regression expectations | #230's reviewed head (35f95e3) had an unsuccessful full Actions run; this PR does **not** absorb its unstable combat changes |

**Cross-branch reconciliation:** When the owner selects changes for the one later worldbuilding release, combine from the approved integration base and resolve overlaps in data, rules, engine, save and tests. Keep this biography, clue wording and save-ID invariants; take only individually audited mechanics from #230. Do not merge this PR into #230, copy all of #230 into this PR, or silently retune first-dungeon combat.

## Review evidence and further gates

- Code paths inspected: data, world, engine, rules, boss-combat, save, narration, Archive, visuals and current sprite roster; the actual existing Crypt is a hooded, skeletal boss under a stone/ossuary silhouette. The present art needs **no** independent Lifekeeper character.
- New regression: **tests/lifebinder-identity.test.cjs** covers family identity, canonical names, old v4 normal/TRUE entity names, combat baselines, quest rewards, discoverable lore path, Skeleton/Wraith distinction and save-state flags. Existing TRUE rolls, quest list and boss victory notice tests were updated to the new outward title.
- Historical balance decision: **docs/DEFERRED_ENCOUNTER_TIME_AUDIT.md** and **docs/DECISIONS.md** explicitly preserve the Crypt's relatively forgiving first-boss role, without comparing a short fight to Thornfang or changing numeric difficulty.
- Historical documents and old evidence that describe “Crypt Guardian” remain valid as records of prior releases, not current player-facing name contracts. The older rogue-VFX fixture is an archived compatibility reference keyed by **crypt**, not a reason to rename the family.
- Required before selected release: exact-head Node regression and formatter/build checks; browser desktop/phone, WebKit, v4 historic-save regression, first entry/quest/TRUE combat, PWA and offline checks. Report any failures, do not claim live QA from source inspection. No merges, auto-merges, deployment or estate/combat rewrite authorized here.
