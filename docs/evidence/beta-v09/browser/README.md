# Selected browser scene evidence

Tested candidate: `4a53dedba7201df71b2c9dc6848f5795f2d706a9` (v0.8.137). Evidence-only branch; runtime source remains identical to that candidate. This branch is not a release or a deployment.

`report.json` records all 33 controlled captures: five outdoor towns and main dungeon entrances plus the Abyss hatchery checkpoint at 1280×800, 375×800 and 800×375, all at 150% camera in local WebKit. Isolated fresh Normal/Paladin, paused real renderer, direct checkpoint relocation and day lighting; no real saves accessed. Each requested/actual position, safe-position check and initial party state is recorded. Zero page errors. These are simulated scene samples, not a human traversal, complete occlusion census, full-party combat or physical-device acceptance.

Three illustrative raw screenshots are retained here: Sunken Archive portrait, Stonecross desktop and Abyss hatchery landscape. Other capture filenames in the manifest describe transient local samples and are not attached. The agent visually inspected this subset for selected route/entrance readability; camera/scenery/collision are unchanged.

Reproduce from a checkout of the tested SHA with Playwright/WebKit installed:

```sh
BROWSER_ENGINE=webkit BETA_TARGET_ROOT="$PWD" BETA_CAPTURE_DIR=test-results/beta-spatial node docs/evidence/beta-v09/browser/spatial-browser.cjs
```

The script uses WebKit directly. `PLAYWRIGHT_MODULE` can specify an installed module. Canonical CI screenshots, logs and artifacts remain in the run linked from issue #213. This evidence supplements the 30 measured routes; it does not waive any release gate.
