# Phase 2A — canonical sprite production roster

This file defines the candidate sprite library to be produced before the visual audit. Nothing in this roster is active in `assets/sprites/manifest.json`; production and implementation remain separate.

The current `src/prototype/visuals.js` renderer is canonical. Candidate art must follow `GRAPHICS_OVERHAUL_PHASE1.md`.

## A. Heroes and companions

1. Hero — Paladin
2. Hero — Mage
3. Hero — Ranger
4. Companion — Soldier
5. Companion — Archer / Ranger support

Legacy Worker art is not part of the current production roster because current saves migrate legacy Workers to Soldiers and current active combat/labor roles are Soldier/Archer.

## B. Specialists

One candidate per canonical specialist family:

6. Mira — Thornfang / Greenwood instructor
7. Borin — Crypt / village smith
8. Sela — Mirejaw / Marches instructor
9. Neri — Archive / alchemist
10. Orin — Ridge / Highland instructor
11. Dara — Mine / Highland smith
12. Lyss — Warlord / advanced instructor
13. Eren — Abyss / runewright
14. Vera — Cindermaw / master smith
15. Tovan — Citadel / final instructor

Closed/open cage states remain procedural framing around the specialist unless the later audit finds the cage itself benefits from a raster asset.

## C. Ordinary and night creature bases

Base forms:

16. Goblin melee
17. Skeleton melee
18. Mireling melee
19. Reed beast base
20. Wolf
21. Ogre melee
22. Orc melee
23. Raider Archer
24. Ash beast base
25. Crown soldier
26. Wraith
27. Ash stalker

Exact combat variants that visibly change equipment or role need distinct candidates:

28. Goblin slinger
29. Skeleton bow variant
30. Mireling spitter hybrid
31. Reed-beast spitter hybrid
32. Ogre stone-thrower hybrid
33. Orc axe-thrower hybrid
34. Ash-beast cinder-spitter hybrid

Guardian variants are candidates only when the procedural guard treatment visibly changes the silhouette. The later audit will determine whether the shared guard additions are better kept procedural or baked into exact guard sprites.

Ringleaders do not get separate base art: they reuse the exact underlying approved variant plus procedural ringleader/frenzy treatment.

## D. Bosses

35. Thornfang
36. Crypt Guardian
37. Mirejaw
38. Drowned Keeper
39. Ridge Tyrant
40. Stone Colossus
41. Ashen Warlord
42. Abyss Dragon
43. Cindermaw
44. Ash Sentinel
45. Dark Lord

TRUE forms do not get separate body sprites. They reuse the canonical normal body plus the existing procedural TRUE treatment.

## E. Named captain/miniboss candidates

These are produced as distinct candidates because the canonical renderer adds mentor-specific silhouette details beyond ordinary ringleader treatment:

46. Scornfang — Thornfang disciple
47. Direjaw — Mirejaw disciple
48. Crag Tyrant — Ridge Tyrant disciple
49. Dreadmaw — Cindermaw disciple
50. Cinder Warlord — Ashen Warlord disciple / roaming Frontier captain

Any later captain added to the game receives its own candidate rather than inheriting a generic captain sprite.

## F. Major destination structures

Main dungeon entrances:

51. Forest Crypt entrance
52. Sunken Archive entrance
53. Colossus Mine entrance
54. Abyss Bastion entrance
55. Citadel of Ashes entrance

Field-boss Treasury entrances:

56. Thornfang Treasury entrance
57. Mirejaw Treasury entrance
58. Ridge Tyrant Treasury entrance
59. Cindermaw Treasury entrance

Final / authored major entrance:

60. Dark fortress gate

Occupied side-interior entrance families are candidates where their current authored exterior is visually distinct from the generic dungeon gate. Exact sprite approval waits for the audit if the current renderer shares too much geometry to justify separate art.

## G. Settlement structure families

Greenwood:
61. Vale cottage
62. Vale workshop

Marches:
63. March stilt house
64. March boathouse

Highlands:
65. Highland stone house
66. Highland smithy

Frontier:
67. Frontier patched house
68. Frontier workshop

Dark Crown:
69. Crown ash house
70. Crown forgehouse

Repeated fences, walls, boardwalk segments and palisade segments remain procedural.

## H. Player-built barracks

Completed Basic Barracks candidates:

71. Greenwood Basic Barracks
72. Marches Basic Barracks
73. Highlands Basic Barracks
74. Frontier Basic Barracks
75. Dark Crown Basic Barracks

Construction-state barracks remain procedural during Phase 2A unless the audit finds a clear benefit to static stage sprites. Full-Barracks visual differences will be assessed after the basic completed family is audited.

## I. Creature-territory / stronghold identity props

These are candidate sprites because they define places rather than behaving as repeated terrain segments:

76. Goblin roadside camp
77. Mire nesting bank
78. Wolf den / hunting-ground shelter
79. Ogre hearth
80. Orc bivouac
81. Ash-beast roost
82. Crown field barracks stronghold

## J. Named landmark structures with high sprite value

83. Abandoned orchard cluster
84. Drowned Watchhouse
85. Old Signal Keep / lookout
86. Ruined Shrine
87. Ruined Foundry
88. Siege camp
89. Watchtower / tower family where used as a named destination

Purely geometric crossings, ponds, ore/crystal ground formations, road objects and other map-shape-dependent landmarks remain procedural by default.

## K. Transport identities

Static transport bodies can benefit from sprite finish while their movement/interaction remains procedural:

90. Merchant wagon
91. Ferryman boat
92. Pack-beast caravan mount
93. Dragon transport

## L. Selected large world-life props

Produce candidates only for the identity-heavy set; small generic clutter stays procedural:

94. Market stand
95. Well
96. Watchpost
97. Command tent
98. Forge
99. War table
100. Dark throne
101. Crown banner
102. Training dummy
103. Weapon rack
104. Fish rack
105. Ore crane

Generic crates, barrels, rations, bone piles, laundry, gardens, sleep rolls and similar repeatable small clutter stay procedural unless the visual audit identifies a specific deficiency.

## M. Vegetation / wild-prop representatives

Rather than replacing every seeded natural object, produce one canonical representative for each major current wild-prop family:

106. Greenwood broadleaf tree / bush cluster
107. Marches wetland shrub / reed cluster
108. Highlands pine
109. Frontier charred tree
110. Dark Crown obsidian/crystal rock

These candidates are specifically for testing whether sprite vegetation improves the world. Procedural seeded variation remains canon and may stay the final solution if static art makes the landscape repetitive.

## Production rules

- Candidate filenames live under `assets/sprites/candidates/`.
- They are **not** registered in the live manifest during Phase 2A.
- No candidate may introduce a gameplay or lore-bearing detail absent from the procedural renderer/data.
- The later Phase 2B audit may reject, merge, or leave procedural any candidate category.
- Implementation begins only after Phase 2B approval.
