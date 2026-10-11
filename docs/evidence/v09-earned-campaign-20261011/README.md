# Earned v0.9 campaign continuation

This is partial beta acceptance evidence, not full-campaign certification.
The runtime is released v0.9.0, commit
`d7d2c22485b08265b31bf595305ef952b40b72cd`. No runtime source was changed.

## Method and provenance

`scripts/beta-earned-campaign-audit.cjs` resumes the Normal Ranger campaign from
the earlier `v09-earned-thorn-20261011` evidence. It uses fixed RNG 0.9 and reads
engine geometry, enemies, cooldowns and progression. It issues ordinary movement,
casts and public engine service actions. It does not grant currency, experience,
stats, equipment or kills, teleport, or skip worker construction and recruitment
timers. This is instrumented engine testing, not browser interaction or human
playability evidence. Fixed RNG and one class/difficulty limit generalization.

Each primary segment resumes the preceding segment's **actual final save**, even
after failure. Hero deaths, gold penalties, companion losses and paid recoveries
remain in the chain. Failed attempts are retained, not replaced with successful
forks. The separate ferry and host-timing diagnostics are not primary progression.

The archive contains reports and final saves; `checkpoint-index.json` gives
chronological segment outcomes and SHA-256 hashes. Starting with the Abyss
attempt, `controller.cjs` records the exact executed controller per segment.
Earlier controller revisions are retained in branch history. Report
`sourceCommit` records the local checkout HEAD, not the latest controller commit;
`releasedRuntime` identifies the runtime. Do not confuse these provenance fields.

To resume in the repository, extract the archive beneath `test-results`, then:

```sh
BETA_RESUME=test-results/<previous-segment>/final-save.json \
BETA_NATURAL_OUTPUT=test-results/<new-segment> \
node scripts/beta-earned-campaign-audit.cjs <route>
```

Use a new output directory. Routes include `crypt`, `march`, `highlands`,
`frontier`, `crown`, `prepare` and `fortify`. `prepare` passing means its bounded
routine completed; inspect actual purchases rather than assuming every desired
upgrade was affordable. `fortify` additionally asserts completed full barracks,
five living active companions and Self-Heal rank 3. An INCOMPLETE assertion
message names the unmet condition; it does not mean that condition passed.

## Confirmed progression

- Seven normal boss families: Thornfang, Crypt Guardian, Mirejaw, Drowned Keeper,
  Ridge Tyrant, Stone Colossus and Ashen Warlord.
- TRUE Thornfang and seven specialist rescues, through Lyss.
- Paid Vale → Marches → Highlands → Frontier transport; level 11, Expedition 5,
  skills 1–7 learned, tier-2 weapon and armor, Ranger Heal rank 2.
- Resource assignments, worker deposits, quest rewards, paid companion recovery,
  training and equipment purchases exercised with earned crowns.
- Every completed segment checks isolated engine restore of progression, economy,
  equipment, skills, party, quests and transport, and verifies its input save was
  unchanged. This is not a genuine historical player export/import.

## Failures and interpretation

The primary campaign has four hero deaths through the reinforced Abyss attempt:
Marches (38-crown penalty), Frontier entrance approach (42), and Abyss interior
approach (26), followed by the reinforced Abyss encounter (49). No loss was rolled
back. Companion losses are also retained.

Controller corrections handle removed summons, bound no-progress combat,
separate transport movement from discretionary fighting, and avoid kiting foes
beyond their home territory. An independent ferry diagnostic reached interaction
range in 6.3 simulated seconds; its state was not substituted for the failed
primary attempt. These observations do not establish a game pathfinding defect.

Frontier fortification earned 717 crowns from resources, loot and quest rewards,
but its initial unguarded construction attempt lost its companions with the
barracks unfinished. The continuation used actual paid recovery and escorted the
workers. Full barracks construction and upgrade completed through ticks; paid
recruitment produced five living active companions. Self-Heal reached rank 3,
and a purchased tonic was consumed after recovery. Companion maximum HP did not
inherit the hero's tonic bonus. The party reached level 12 with 242 crowns.

The subsequent reinforced Abyss attempt reached the encounter but ended in
defeat. This is not a passed boss encounter. The exact latest primary resume point
is `earned-abyss-reinforced/final-save.json`: time 2540.6, level 12, Frontier refuge,
193 crowns, four hero deaths, all five companions fallen. Full barracks, earned
progression, skills and equipment persist. Abyss, Crown and the campaign ending
remain unverified. No further test process is running after this checkpoint.

No scoped runtime defect has been reproduced from these attempts. Controller
failures and losses are evidence of incomplete coverage, not proof of a runtime
bug or proof of satisfactory balance.

## Acceptance limits

Issue #213 remains 7/13 verified with six broad follow-ups open. The full campaign,
remaining TRUE encounters, Nightmare and Awakening still need earned evidence.
Historical player-created save export/import, actual phone/Chromebook controls,
installed PWA offline/update behavior, and sustained device performance remain
unverified here. Node timings do not establish physical-device FPS or memory.

No new deployment is warranted by test-controller changes alone. The previously
passed release validation was not unnecessarily rerun.
