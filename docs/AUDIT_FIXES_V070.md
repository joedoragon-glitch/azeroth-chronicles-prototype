# v0.7.0 mechanics audit implementation

This release implements the 23 findings from the October 4 v0.6.2 audit. The original audit remains the baseline; this document records the resulting behavior and checks. It does not claim that automated checks establish human combat comfort, a balanced full campaign, or pleasant audio on every device.

| Finding | Result | Verification |
|---|---|---|
| F01 | A normal-normal-TRUE field cycle schedules one normal return; loaded duplicates are removed. | Exact population regression |
| F02 | Boss windups require sight; attacks/projectiles respect terrain; blocked encounters reset after 12 seconds without progress. | Occluded shapes, sealed encounter and projectile tests |
| F03 | TRUE crypt volleys stagger; archive channels, mine rockfalls and abyss flames have separately warned stages; citadel openings remain explicit. | Family follow-up regressions and browser rendering |
| F04 | Equipment tiers must be integers; victory/pending records and reservation counts validate before import. | Rejected malformed saves and valid round trips |
| F05 | Pause, menus, hidden pages and inactive challenges block keyboard, touch and held casts. | Production-shell and browser regressions |
| F06 | Mage ice effects, ranger double shot/haste, distinct advanced attacks and final healing/protection are restored. | Actual projectile/status/health tests |
| F07 | All 30 quests have explicit objective types and authored target IDs. Night observation requires visiting the site at night; fortress approach requires its gate. | Wrong/right destination and site tests |
| F08 | Inactive-region recruitment queues reserve capacity across the entire campaign, including recovery. | Travel/queue/cap regression |
| F09 | Living companions prevent cleared patrols from respawning nearby. | Camp-presence regression |
| F10 | Actual main or minor refuge survives save/load and determines normal death recovery. | Minor-rest, reload and death regression |
| F11 | Succession deaths preserve the paid crossing recovery credit before class replacement. | Zero-gold successor crossing |
| F12 | Ordinary and summoned ranged threats launch visible, terrain-blocked projectiles. | Launch-before-damage and barrier regression |
| F13 | Each major attack has explicit damage coefficients and recovery; basics can occur between majors. | Root/slam/charge rules and basic attack regression |
| F14 | Pounces land, charges move, combos/sequences warn each stage, mine cores open and Dark Lord sectors alternate below half health. | Motion, output-window and phase regressions |
| F15 | R/C/X/T/G/V shortcuts return; complete help, joystick menu selection, touch selection and Confirm are available. | Shell and four viewport browser checks |
| F16 | Travel validates arrival transactionally and restores fare, destination and facts if it fails. | Injected failure after mutation |
| F17 | Idle enemies adopt day/night statistics while preserving their health fraction; engaged fights freeze their tier. | Fraction and existing encounter tests |
| F18 | Skill book names teacher regions; exhausted teachers identify the next instructor and region. | Production UI guidance and browser checks |
| F19 | Workers deposit at the closest inhabited refuge. | Minor-settlement deposit regression |
| F20 | Migration preserves legacy regional association, buildings, retained weapons and exact bottle values. Saved weapons remain selectable; legacy resource amounts are retained. | Actual v2 migration plus consumable/location/gear tests |
| F21 | Area damage resolves in stable enemy-ID order. | Reversed-population streak comparison |
| F22 | Each score has a 32-bar A/A/B/A form, contrasting phrases, regional colors and bounded outgoing/incoming transitions. Combat entry fades in 0.5 seconds; exploration transitions use 2 seconds. | Scheduler bounds, forms, phase selection and browser audio unlock |
| F23 | Authored forest patches, ponds/cliffs/fortifications, named sites, solid houses/fences and distinct dungeon barriers/pillars replace generic site/layout approximations. | All named-site routes, all main roads and distinct dungeon collision samples |

## Validation and limits

`npm test` includes the prior gameplay/PWA/campaign checks, all 1,024 ending-state combinations, actual v2 migration, 38 road journeys, 18 focused audit regression scenarios, six first-boss balance scenarios, production-shell input checks and a bounded audio scheduler test. Chromium checks cover desktop, small phones and landscape touch views; CI tests both the hosted project files and portable HTML, then repeats the browser checks against the deployed game.

Thornfang's base health increases from 260 to 1,200 at the author's request, with unchanged damage, warnings and attack complexity. Existing saves receive the same health tuning while retaining victory/rescue facts. Six isolated level-1, skill-1 scenarios with the ordinary starting soldier/worker, scripted warning avoidance and at most the starting health potion all win: about 22–28 seconds by day and 25–30 seconds at night. Surrounding packs are removed only for these focused tests; no advanced powers or bought gear are injected. The first encounter deliberately remains shorter than the general later-boss pacing target. TRUE health follows the existing 1.8× rule. Other boss/economy values remain prototype tuning; full campaign income/time and author difficulty feedback remain necessary.

Listening to every cue for three loops, touch comfort on the actual Chromebook/phone, full campaign runs and dense-combat frame timing remain human acceptance work. The synthesized instruments are prototype impressions. Geometry tests cover the authored routes and sites, not every possible position in every save.

## Additional author requests in this release

Dungeon guardian populations rise from 6/8/10/12/14 to 10/14/18/22/26. Each interior has 16 themed decorative objects, distinct floor colors, and 6/8/9/10/12 authored trap positions. Spikes, transverse jets and slowing seals pressure guardian approaches and the boss perimeter; warnings last 1.5 seconds and a unit is hit once per pulse. A route test treating every trap area as permanently blocked still reaches every boss and captive. This proves alternatives exist, not that every player will find the best route.

Guardians use the ordinary two-kill species streak, including the one-or-two ringleader roll. Their elite replacements retain the guardian role and ranged profile; unresolved guardian elites also gate first-clear rewards and the preparation fountain. Upgrading an existing uncleared dungeon adds only missing guardian slots. Dead guardians remain dead, and completed dungeons remain completed. Peace removes these threats and disables all traps.

Field goblins gain slingers and skeletons gain bow variants. Selected reed beasts, mirelings, ogres, orcs and ash beasts can attack at range and physically up close. Ranged attacks have a 0.55-second aiming cue, visible arrows/stones/spit/cinders and terrain collision. Wolves retain physical attacks. Species identity stays intact for ringleader rules. Nine additional regression scenarios cover trap alternatives/timing, guardian elites, save upgrades, mixed range behavior and peace.

Dungeon guardian EXP is now one quarter of the previous guardian value (4/7/8/9/10 EXP by dungeon). Their gold is 35% of the regional midpoint, rounded down (2/3/6/9/12 gold before level penalties). Guardian elites scale these reduced bases, rather than outdoor rewards. First-clear, boss and rescue/quest rewards remain separate. Old guardian and pending-elite rewards migrate without taking back gold or EXP already earned.

Traps damage or slow only the hero and living companions. Bosses, regular guardians, guardian ringleaders and summoned monsters are immune. A regression places all four enemy roles on each trap pulse and verifies their health/status remain unchanged while the player takes the hit.

The final author clarification overrides the old fixed level-18 awakening tier. The hero’s level at the TRUE Dark Lord kill is captured before its EXP reward; returning TRUE bosses are permanently that level +2. Their guardians return once at the same level, with 120 + 35×level base health and 12 + level base damage, and retain reduced guardian rewards and trap immunity. Boss endgame health/damage scale by max(1, captured level /18), rounded to integers, retaining the 13,000–17,000 health and 70–78 damage bands as minimums and preserving each boss’s relative strength. This makes a high-level victory produce mechanically stronger encounters, rather than merely changing the displayed level. Early TRUE victories stay cleared; normal bosses first defeated after awakening also get this guaranteed anchored encounter. The anchor persists through later level-ups, travel, reload and Succession. Five dedicated scenarios verify Normal, Nightmare, Succession and legacy-save behavior. Older awakening saves lack the historical victory level, so migration anchors once from the saved hero level +2 and records it thereafter.
