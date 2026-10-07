# Dormant sprint

Sprint was developed but is deliberately not currently implemented as an available gameplay feature. `src/sprint.js` contains `const SPRINT_ENABLED = false;`. Q remains reserved, the stamina display and touch control remain hidden, and no menu, URL, save flag or unlock enables it.

For an experimental activation, change that flag to `true`; the expanded shell already wires Q and the touch hold button into `Sprint.press`, passes its movement multiplier to the campaign, and displays the stamina HUD. Capacity is 100, drain 20/s, regeneration 15/s after 1.5 seconds and speed bonus 35%. Run `npm test`, `npm run test:browser`, and manual exhaustion, pause, cancellation and background checks. Companions and the squad cursor never sprint.

Before releasing an enabled version, add activated browser coverage, wire `Sprint.snapshot/validate/restore` into the expanded v4 save format, review sprint versus haste and ordered hero movement, update the control text and service-worker cache version, and verify the canonical GitHub Pages/PWA build. The legacy shell retains its original save wiring. These instructions describe the dormant generated mechanic and the additional release work for enabling it in the expanded shell.

Keep the source flag false for this requested test release. No runtime setting is permitted to change it.
