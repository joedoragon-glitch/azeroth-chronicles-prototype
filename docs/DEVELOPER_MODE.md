# Developer Mode · testing-only combat laboratory

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
- Skill 1 is disabled in engine and UI, including movement auto-attack and
  charged/keyboard/touch activation. Other skills remain available.
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
