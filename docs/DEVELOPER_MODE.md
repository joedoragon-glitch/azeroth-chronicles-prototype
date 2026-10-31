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

## Developer Finisher — fast death/progression testing

While actively playing a Developer Mode run, the **Dev Finish** control sits next to **Summon**, on both desktop and phone. It opens two actions, independent of the hero class, learned skills, mana and ordinary cooldowns:

- **Finish target:** delivers an extreme, piercing, single-target hit to the currently selected foe (via **Target**), or the nearest valid enemy if no target was selected, up to 680 world units away.
- **Sweep nearby:** delivers the same hit to up to eight eligible hostiles within 360 world units of the hero. Use this for quick kill-count, quest and event checks; a newly spawned enemy from a kill-triggered event is not automatically included in the same sweep.

These actions require genuine target eligibility and line of sight; they do **not** teleport through walls, hit neutral characters or override combat-reset protection. Reposition the developer hero when needed. Each hit uses the actual `Campaign.damage()` and `Campaign.kill()` pathway, so a **real** monster/boss death can create ordinary loot drops, advance quests, award victories and trigger native after-death encounters. This is a developer test run, not a claim that a normal-mode character could win this way.

**Important:** Developer Mode's *Summon* button creates temporary encounter fixtures. Those fixtures **still cannot award real loot, kill counts, boss victories, quest progress or persistent rewards** even when a Dev Finisher kills them. To inspect the genuine death/reward outcome, visit and kill the **naturally spawned** enemy/boss in the actual region or dungeon. Developer run saves remain isolated from normal campaigns.


## Issue #620 — individual companion combat monitor (merged PR #723)

[PR #723](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/723) added the separate **DEV · COMPANIONS** monitor, retaining the original hero's last-three-hits and incoming/outgoing five-second DPS panel. The companion monitor is **developer-only**; normal campaigns do not track or display these diagnostics.

The companion header counts active, living members; each row identifies an individual by name, type and stable saved actor ID. **Moves** lists up to three most recently resolved *attack releases*, with their combined actual enemy HP damage. A three-arrow volley and a two-target cone are each **one move**, not three or two hit entries. Tracked projectile releases remain pending until contact, cancellation or expiry; a fully missed or blocked release can resolve as **zero**. **DPS** is enemy HP actually removed over the rolling last five seconds, divided by five; mitigation applies and overkill is capped at the enemy's remaining HP. Incoming, reflected and hero-only hits do not enter companion totals.

The new panel sits opposite the hero panel (**desktop right / phone left**), is collapsed by default on phone, and has a header toggle and bounded scrollable interior. It is a diagnostic display, **not a measured FPS improvement**. Its histories and projectile links are bounded/transient and never copied into version-4 saves; a fresh game run resets them. Simulation time controls the rolling window, so paused time does not advance its decay.

**Status:** implemented, PR-head [focused CI and offline build passed on `445169d`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41223383766), and merged at [`ff5236852`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/ff52368521f11846721f72b42eefe0e7d83b87cb); [exact-main focused validation and GitHub Pages run #41224050148](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41224050148) is in_progress (no conclusion); check its final outcome before marking dev.243 published. Neither a successful build nor deployment proves actual iPhone/Chromebook readability, placement or performance.
