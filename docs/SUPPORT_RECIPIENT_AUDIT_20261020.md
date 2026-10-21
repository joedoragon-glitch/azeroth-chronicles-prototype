> **Dev.119 follow-up:** The one message defect below is repaired in the [Ranger feedback correction](RANGER_SUPPORT_FEEDBACK_20261020.md). The dev.118 findings and reproduction below remain historical evidence.

# Support recipients audit — dev.118, 20 October 2026

**Result: no missing pet recipient or broken support effect found in the covered paths.** All eleven pet families, Soldier, Ranger companion and the hero receive the effects their current definitions intend. One minor feedback defect is reproduced below. This audit changes no live gameplay, balance, saves or artwork.

| Source / skill | Actual recipients and conditions | Result |
| --- | --- | --- |
| Ranger hero Skill 3 | Tap heals self. Charged heals hero and all wounded active living companions, including every pet family. No revival. Rejects a charged heal when nobody eligible is injured. | Pass |
| Paladin Skill 8 / Last Bastion | Self-heal; ward protects hero plus active living troops/pets within the authored radius and line of sight. Tap ward 20%; charged 30%; expires and actually reduces HP loss. Shield Stance is personal. | Pass |
| Ranger hero Companion Rally | Nearby active living Soldier, Ranger and all eleven pets, with line of sight. Faster movement and basic attacks; actual AI attack intervals verified for all 13 companion identities. Hero excluded; specials keep their cooldowns. Expires normally. | Pass |
| Mage Fracture | Enemy-side vulnerability increases real damage from hero, both troops and all pets. Actual Mage cast/projectile also verified. Mage has no party-heal skill in the current kit. | Pass |
| Paladin Weaken | Enemy-side outgoing reduction protects every kind of hero/companion recipient; expires normally. | Pass |
| Ranger companion Heal | Manual and automatic healing can target hero, Soldier, another Ranger, itself or any pet. One recipient; hero priority, otherwise lowest eligible HP fraction. Healing over time restores real HP and clamps at maximum. | Pass |
| Little Lifebinder: Stay Alive | Actual hit heals itself plus at most one wounded nearby ally: hero, either troop or another pet. Lowest HP fraction first, 280 reach and line of sight. Missed shots, dead/resting sources and dead/resting/out-of-range/blocked recipients do not produce ally healing. | Pass |
| Pebble Colossus / Cinder Cub wards | Self-only by definition: 25% / 35% protection, not shared party buffs. Actual skill resolution, mitigation, expiry and strongest-layer behavior covered. | Pass |
| Veteran troop techniques | Soldier's strike protection is personal. Ranger covering Slow is applied to the enemy on a successful hit, so every ally benefits from that enemy being slowed. Retreat AI/gates/expiry remain correct. | Pass |

All recipient matrices exclude fallen and resting companions. Spatial wards/rally and Lifebinder support honor their range/line rules. Ranger hero Party Heal and Ranger companion Heal currently use active-party eligibility without a distance/line-of-sight cutoff; that is recorded behavior, not changed by this audit. The displayed 240-radius Party Heal pulse is a presentation cue, not an enforced recipient boundary. Introducing such a boundary would be a separate balance change.

## One remaining feedback defect

**Low priority — a silenced ready Ranger is reported as cooling down.** Cast Mage charged Skill 3 with a ready Ranger inside its Silence field and a wounded pet. Manual Heal correctly fails, spends no heal cooldown and produces no healing, but says `Heal is cooling down · 0s.` The cause is `party.js::rangerSupport`: after filtering silenced casters it reports the remaining failure as a cooldown. Recommended repair: report Silence when it blocks otherwise-ready Rangers, preserving the existing cooldown/availability messages.

Mage Silence deliberately suppresses allied special/support **casters** inside its area, including pets. This is not a pet exclusion: moving a ready Ranger or Lifebinder outside the field lets it heal a pet still inside. Already-applied healing also continues. Those actual caster/recipient cases passed. No change to this bilateral skill design is proposed by the audit.

## Evidence and limits

The [reproducer](../tools/visual-review/support-recipient-audit-dev118/check.cjs) passes **146** targeted native domain/AI/projectile cases. [Results](../tools/visual-review/support-recipient-audit-dev118/results.json) include the complete matrix, exact support-source hashes and the reproduced feedback message against main `31fcdc9b500cc13e09082349745b83f77055ea71` / live dev.118. Fixtures use fresh campaigns and small eligible parties; each role is also tested individually, without exceeding field capacity to fabricate an all-pets squad.

Existing `ranged-pet-support`, `melee-pet-roles`, `hero-skills-consolidation` and `community-veteran-companions` suites also pass. These cover contact/miss/source safety, healing caps, stronger wards, charge interruption, Slow, Silence and veteran retreat activation. Changed audit-source formatting passes. No browser/device matrix, broad CI, version bump or deployment was performed. The feedback defect remains unpatched; the audit found no recipient-mechanics repair requiring implementation.
