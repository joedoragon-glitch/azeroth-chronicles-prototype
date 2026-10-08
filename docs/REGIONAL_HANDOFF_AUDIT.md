# Regional handoff implementation audit · v0.8.87

## Sources and baseline

Joel authorized implementation after reviewing the reorganized project. The supplied Flooded Marches handoff, takeover order step 7, explicitly directs regression testing, a clean merge and deployment verification before a live claim. Sources: Greenwood_Vale_Crypt_Guardian_Handoff_AUDITED_FINAL.docx, Flooded_Marches_Drowned_Keeper_Handoff_AUDITED.docx and Ironroot_Highlands_Handoff_AUDITED_v2(1).docx. All three were read in full. Implementation begins from current main afc5979e1bd90fd27fed2b487854168942db2827 (v0.8.85), rather than assuming older handoff paths or a different stack. Current main advanced to fafefe0a54abcbeee13b2ca2de0770c38cc543fe (Abyss air-superiority v0.8.86) during the audit. Its runtime, art and tests are integrated and preserved; this regional release advances to v0.8.87. The canonical multi-file Canvas/PWA, separate accepted desktop/phone CSS, progression/save/menu boundaries and sprite preparation tooling are retained.

## Implemented first pass

| Location | Authored areas and context | Retained mechanics |
| --- | --- | --- |
| Forest Crypt | Receiving, older crypt, unfinished conversion spine, craft wing, guest lodge, caretaker study and protected retreat. Borin works in the craft area. Approach supplies support the private-estate conversion. | Guardian/TRUE boss, independent Borin rescue, tutorial and Thornfang/Mira, existing local creature homes. |
| Sunken Archive | Intake, dry stacks, restoration wing/lab, shallow flooded lower section, Keeper study and preservation hall. Neri works with restoration materials. Removed pages, supplies and a pump mark outdoor relief. | Keeper/TRUE boss, independent Neri rescue, Mirejaw/Sela, ferry, fishing settlements, Reed Beasts and independent night Wraiths. |
| Colossus Mine | Haulage, new and older workings, repair/forge, collapsed shafts, Colossus chamber and a connected haulage loop. Dara stays in the repair/metallurgy area. Outdoor loading, quarry and pay/ledger scenes support the economy. | Colossus/TRUE boss, independent Dara rescue, mountain routes, settlement services, Wolf/Ogre homes and Ridge archers. |
| Highlands Treasury | Entry, hearth room, quiet room, sleeping room and connecting passage, with ordinary furnishings and limited coin/accounting context. Visible walls match collision. | Private residence identity, existing Wolf captain/guards, three cache positions/rewards and return path. |

Every main location has seven overlapping connected areas and four real partitions, replacing the old one-divider rectangle. Furnishings reuse existing procedural structures with context overlays; no replacement art or production sprite registration is introduced. Archive water and mine/unfinished floor treatment are visual surfaces, not new damage or traversal rules. Existing guardian/trap counts, zero guardian rewards and species combat profiles are preserved; placement changes support the authored layouts. Captives remain internally keyed rescue NPCs and become normal services only after their own existing boss/key gate.

## Settled canon and open choices

The Guardian is a trusted outsider caretaker overseeing an unfinished seasonal retreat. Greenwood ownership comes from the Dark Lord wanting a place there, not an invented ancient local Guardian history. Dark Crown is the permanent seat. The Keeper is a capable scholar/councillor, loves fishing, proposed specialist capture and traded an unspecified captive to acquire Neri. His past drowning explains the nickname; the current flood cause is unspecified. The Ridge Tyrant is Master of Coin in an established mountain economy whose roads/pay/trade coexist with tyranny.

The Guardian's biography, Borin's exact construction assignment, orchard/Thornfang/Goblin histories, the Keeper's degree, flood cause and trade identities remain unspecified. The reconciled Ironroot implementation records provisional choices for Dara's repair work, an ancient Colossus exposed by old cuts and Ridge convoy/payroll escorts; see IRONROOT_HIGHLANDS_LAYOUT.md. Those choices are implementation interpretations, not previously fixed user canon. This release establishes playable support for continued iteration; it does not finish those creative decisions or certify the three regions complete.

## Audit findings fixed

- An Archive jet obstructed the route to its boss under inflated hazard checks; it was moved to a lower flooded-area position, preserving the trap count.
- New Highlands geometry initially had collision partitions without visible walls; the renderer now clips/draws the authored residence footprint and partitions.
- Long specialist names clipped on portrait Canvas captures; workstation labels now clamp and, where necessary, scale within the Canvas.
- Outdoor support props initially preceded later stronghold structures; support placement now runs last and reserves present/future service stands, roads and terrain clearance.
- Legacy Treasury migration compacted collected cache indices; Highlands migration now retains each exact collected-cache identity.

## Save and progression audit

Versioned layout migration updates decoration, captive placement and safe actor positions. It preserves mode/schema/keys, currency, quest counts, rescued state, dead guards, clear state and normal/TRUE entitlements. Guards are restaged without reviving dead units. Highlands migration retains Wolf captain death and collected cache indices. Repeated restore is idempotent and furnishing IDs do not duplicate. Original legacy backups are not modified.

## Validation

- `npm run format:check`, `npm run check` and the full 39-suite `npm test` regression run.
- New regional regression coverage: normal/Nightmare entry, every room reachable with all hazards inflated (including jet width), safe boss/captive/exit positions, unchanged guard counts and Wolf melee identity, actual boss kill to independent rescue to service, restored service and TRUE reentry, old actor/guard migration, completed-dungeon preservation, Treasury cache/captain preservation, future service clearance and duplicate-free outdoor support.
- Existing dungeon-pressure, specialist-rescue, migration, local-site and world-aesthetic checks remain part of the full suite.
- Native Canvas captures inspected at 2200×1200, 1280×800 and 375×812 for all four authored interiors. Browser regressions exercise actual Canvas geometry and label bounds across the existing desktop/phone viewport matrix; release CI also covers WebKit phone and offline/live deployment behavior.

Local format/build/asset checks and all 39 non-browser regression suites passed after integrating the newer Abyss update. All 217 local Chromium browser checks passed across 1280×800, 375×812, 320×568, 844×390, 768×310, 568×320 and 980×1740. The unchanged-CSS comparison and deliberate-perturbation detection pass at every viewport. The development sprite showroom passes its four viewport checks plus actual transparent-image/offline/subpath/save coverage. Native and actual-browser regional captures were inspected. Release CI, WebKit and live deployment verification remain required release gates. Browser/emulated viewport checks do not replace Joel's physical Chromebook/iPhone comfort review or further artistic iteration.

## Reconciliation of parallel work

Joel identified two overlapping local implementations before either published. Both original histories are preserved by the merge. The reconciled release keeps the regional branch's Crypt/Archive architecture, furnishings, surfaces, workstations and outdoor support; it keeps the Ironroot branch's Mine geometry, guardian profiles, detailed household/production drawing families and livelihood scenes. The regional residence footprint and matching wall rendering are combined with Ironroot domestic furnishings. One version of each layout and one outdoor furnishing set are active.

Working captive presentation is staged by one shared rules-owned workstation specification; Dara uses the authored equipment-repair drawing. Outdoor support runs after existing strongholds and reserves future rescued-service positions. A Mine seal was moved from a narrow connector to an old-workings corner after the combined inflated-hazard checks exposed a choke. Trap count/type/timing/damage remain unchanged. A pre-existing browser probe could miss the brief Skill 2 WAIT display while polling on the slowest local viewport. It now observes the real pointer-down, charge presentation and HUD together in one browser turn, retaining the queued-state and WAIT assertions. Browser waits have a deadline and failure screenshot. Both regression suites and both real-browser probes run on the reconciled version; the regional probe also runs in the WebKit phone gate.

## Release status

Joel explicitly authorized repository publication in this chat. The reconciled release remains local while its combined checks run, then requires passing PR Chromium and phone-WebKit gates before merge, followed by main deployment and exact published-build verification. The combined formatter/generated/sprite checks and all 40 non-browser suites passed locally. The four-viewport sprite showroom and real transparent-binary/offline/subpath/save checks passed. Direct comparison against pre-change main verified identical guardian species, names, health/damage, ranged weapons, levels and rewards in all three dungeons; actual old saves migrated with currency and deaths retained. Full combined browser and release checks remain underway; no live completion is claimed by this audit.
