# Current development state

## Foundation complete in v0.8.81

Desktop/browser and phone presentation are distinct. World authoring, navigation, rendering, persistence, platform selection and runtime measurements have explicit module boundaries. Entry generation, offline assets, versioning and deployment use a shared build inventory. Existing maps, campaign behavior and procedural sprite canon are preserved.

## Continue existing work

| Workstream | Current evidence and next step |
| --- | --- |
| Regional playtesting | Continue Joel's region-by-region review and corrections. Recent authored Frontier/Crown and main-dungeon depth work remains in place. Housekeeping does not certify every map as artistically finished. |
| Procedural canon | Static polish v0.8.79 and terrain/effects polish v0.8.80 are retained. New feedback should improve current canon in the owning modules. |
| Sprite production | The approved catalog has 231 entries; the production sprite manifest remains empty. Follow the existing small-experiment/approval gates in the sprite production contract before mass generation. This engineering pass does not manufacture or register replacement art. |
| Chromebook tuning | Play the desktop entry on the actual laptop. Reports now include active frame cadence, work time and renderer counters for reproducible tuning. |
| Phone playtesting | Use the dedicated phone entry or installed PWA. Check real-device thumb reach, portrait/landscape behavior and offline reopening. |
| Engineering | Keep changes incremental. Extract combat/progression or menu subsystems when needed; benchmark before introducing collision caches, workers or a different renderer. |
| Distribution | Browser desktop and installed phone web app are current targets. Native packaging is a later distribution decision, independent of finishing maps or sprites. |

Map and sprite completion are not prerequisites for sound engineering. Conversely, changing frameworks does not complete map design, resolve performance by itself, or turn a PWA into a native package. Keep gameplay decisions in `DECISIONS.md`, engineering ownership in `ARCHITECTURE.md`, and historical releases in `PROJECT_HISTORY.md`.

## Input update v0.8.82

Direct menu/HUD clicks and taps, persistent keyboard rebinding, two-thumb phone controls and optional pointer movement replace the inherited input prohibitions. See `README.md` for player settings. Autoattack and death/economy rules are preserved. Real-device comfort remains part of Joel's playtesting.
