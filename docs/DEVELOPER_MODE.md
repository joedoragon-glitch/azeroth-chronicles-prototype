# Developer Mode · testing-only combat laboratory

> **Current-use boundary — 19 October 2026:** Apply this contract with [current development state](DEVELOPMENT_STATE.md). Dated verification/rollout sections retain their historical scope; they do not authorize work during the break.

Open the development URL with `?developer=1`, for example,
`/index.html?developer=1` or `/phone.html?developer=1`.

Without this opt-in query, community players cannot select Developer Mode in the
new-game menus, and developer save imports are rejected. This is **not an
authentication mechanism**: anyone who knows the URL parameter can opt in.
For an access-controlled public distribution, omit developer support from the
deployed assets entirely.

A fresh opt-in session offers the Developer class selector. Later select
**New Developer Mode run** under Adventure or Save management. Developer saves
use the separate `azeroth-v4-developer` slot; the profile still remembers the last
Normal/Nightmare campaign. v4 save compatibility is retained.

## Developer Finisher — fast death/progression testing

While actively playing a Developer Mode run, the **Dev Finish** control sits next to **Summon**, on both desktop and phone. It opens two actions, independent of the hero class, learned skills, mana and ordinary cooldowns:

- **Finish target:** delivers an extreme, piercing, single-target hit to the currently selected foe (via **Target**), or the nearest valid enemy if no target was selected, up to 680 world units away.
- **Sweep nearby:** delivers the same hit to up to eight eligible hostiles within 360 world units of the hero. Use this for quick kill-count, quest and event checks; a newly spawned enemy from a kill-triggered event is not automatically included in the same sweep.

These actions require genuine target eligibility and line of sight; they do **not** teleport through walls, hit neutral characters or override combat-reset protection. Reposition the developer hero when needed. Each hit uses the actual `Campaign.damage()` and `Campaign.kill()` pathway, so a **real** monster/boss death can create ordinary loot drops, advance quests, award victories and trigger native after-death encounters. This is a developer test run, not a claim that a normal-mode character could win this way.

**Important:** Developer Mode's *Summon* button creates temporary encounter fixtures. Those fixtures **still cannot award real loot, kill counts, boss victories, quest progress or persistent rewards** even when a Dev Finisher kills them. To inspect the genuine death/reward outcome, visit and kill the **naturally spawned** enemy/boss in the actual region or dungeon. Developer run saves remain isolated from normal campaigns.

- Fatal damage immediately refills hero HP without triggering death statistics,
  succession or penalties. Nonfatal damage and enemy AI remain real.
- Skill 1 is available manually with keyboard, mouse and touch, including its
  normal tap and charged form. Movement auto-attack remains disabled in both
  the shell and engine; moving does not spend its cooldown or attack a target.
  Other skills remain available.
- The damage monitor shows the last three hits taken and dealt (newest first),
  and separate five-second rolling incoming/outgoing DPS, updated in real time.
  Only hero-sourced outgoing hits count, not companions. Telemetry is transient
  and not saved. The fatal blow is counted at its post-armor strength.
- The Summon button appears near the phone joystick and at the lower desktop
  edge. The selector offers the current region's exclusive bosses in regular
  and TRUE forms, and its supply captain / Frontier overseer.
- Summons reuse actual boss constructors, the region's native captain combat
  profiles and production base stats. They spawn hostile but cannot award
  campaign kills, rewards, victories or respawn rights. Test actors (including
  their adds) are deliberately transient and excluded from saved campaigns.

Verify each hero class, five regions, both boss forms, captains, phone and desktop
controls, normal and lethal hits, Skill 1 across all input paths, other skills,
save/reload, and ordinary startup/import **without** `?developer=1`.
