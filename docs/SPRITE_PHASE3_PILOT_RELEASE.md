> Historical pilot preparation record. The Paladin/Goblin idles and Vale/Highlands roads below were subsequently merged and published through #193 (v0.8.127, a996688ea8cbf9a878e05b31cb5fc6bd104e8729; successful release run 38005221077). Earlier zero-deployed counts are checkpoint history. Continue remaining work under #160 and [current development state](DEVELOPMENT_STATE.md).

# Phase 3 saved pilot integration · v0.8.115

Recovered e8d52105fe89c3d204c37da07ffb68e72eb96509 and reconciled main 296356a883903459ba68e70291920f9c4538d96b. PR #170 notices, rogue repertoire, audio and VFX remain in the merge. No image generation repeated.

Two original-master replacements are reviewed and installed locally: Paladin and Goblin, four 576px frames, two 800ms looping idle clips. Two opaque 256px roads are reviewed and installed: T006 Vale and T008 Highlands. Prior sprite revisions remain in immutable rollback history; both roads have procedural rollback. Existing originals, intermediate pixels and prior evidence remain untouched.

Review includes six capped-ratio profiles in day/night, grounding/silhouette and retained frame pairs. Road review now includes native DPR rather than only the older ratio-1 showroom. Sprite review placement fits the Goblin into landscape views and supplies a real preview level. These are developer-tool changes, not game geometry changes.

Real WebKit capture has 12 device/light scenes and 36 idle/combat screenshots. Both actual atlas frames draw, pause holds the presentation clock, animation preserves exact campaign snapshots, and real Goblin Blinding Dust plus target lock remain available. Native appearance acceptance is the engineer's authorized review; no unseen user artwork acceptance is claimed. Browser captures are under the adaptation batch's `browser-review-v3`; road captures are under each candidate's `native-review-v2`.

All 68 non-browser suites passed. Build, registry/source integrity, scope census and 251-identity / 1,440-decision audio/VFX coverage passed. Exact-head CI, merge, deployment and published SHA verification remain required before the deployed count changes from zero.

The managed host exposes a virtual Node process.pid while /proc exposes host IDs. Publisher locks now retain host PID and process start time, so stale aliases and reused process IDs cannot block recovery or masquerade as current owners. Active publisher rejection, hard-kill pair recovery and unrelated-edit refusal pass. An initial local test/install overlap was recovered through the existing journal; subsequent registry verification ran serially. Lock/journal files were not deleted to bypass recovery.

Counts: prepared 2 body keys / 4 frames / 2 materials; final-reviewed 2 body keys / 2 materials; installed 2 body revisions / 2 materials; verified deployed 0. Total active catalog is 33 body keys and 7 materials. This is the saved pilot batch, not completion of the remaining original adaptations, all-master audit or open 296-decision catalog.


## Reconciled release candidate · v0.8.127 / PR #193

The retained source-backed Paladin/Goblin idles (two 800ms frames each) and T006/T008 roads are reconciled with v0.8.126 main `05e069f`. The FPS-first outdoor floor reuse, projected ground cache and 256 MiB decoded sprite ceiling remain intact. Current registries validate 33 body identities / 7 terrain materials. No finished image generation was repeated.

The real-browser actor review is now checked in and runs on Chromium/WebKit PR/main CI and against the published game. It checks both 576px definitions and actual rendered frames across six desktop/phone profiles in day/night, gameplay snapshot preservation, paused presentation time and the actual Goblin warning. Existing material-rendering and PWA upgrade checks remain required. CI screenshot artifacts supplement the immutable original candidate evidence. Counts remain 2 sprite revisions and 2 materials integrated, 0 verified deployed until exact published SHA and release checks complete.


Chromium release CI caught the ground-projection test applying its one-channel camera tolerance to the newly registered roads. Roads deliberately retain the unchanged original skewed projection: direct/reference pixels were identical (mean/max difference zero), and fractional translated sampling differed by two channel levels in both the candidate and original paths. The test now compares non-ground pixels and camera-phase deltas exactly with that original reference, while retaining the strict cached-ground limits. No runtime renderer or artwork was changed to resolve this test classification error.
