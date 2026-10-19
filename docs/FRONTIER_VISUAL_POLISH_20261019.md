# Frontier visual polish — 19 October 2026

The owner resumed the three existing-content repairs from [issue #320](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/320). They are implemented locally in candidate **0.9.1+snapshot.dev.80**, on `polish/frontier-orc-identity`. Latest runtime source checkpoint: `eddc15f02fb1e229fd3e5137c1f8ec970203fdc3`; original Orc source checkpoint: `c8a281d8cdd0ea7b352c44b399516e70aed4e313`; baseline main: `e6ea987aded7b441bdedf51e1fc29b38b1ed2f02` (published gameplay remains dev.79).

**Integration status:** the owner explicitly authorized pushing, then merging the completed visual batch into the game on 19 October 2026. The earlier staging blocker and handoff-only limitation are superseded. [The integration record](FRONTIER_UPDATE_INTEGRATION_20261019.md) preserves original history, exact source archives and the test ledger. Normal update checks gate publication; no full certificate is inferred from focused checks.

## Visible changes

| Requirement | Implemented result |
| --- | --- |
| V-01: Cinder Warlord | Orc face with visible amber eyes, heavy brow, muzzle, lower tusks, ears and neck. Copies the governor's horn-fitted shoulder cups, diagonal authority sash, short red mantle and axe; keeps a smaller open headband, officious expression, cheek stripe and inspection ledger. Original captain scale remains 1.18. |
| V-02: Orc species | One curved head/body construction across ordinary melee, axe thrower, guardian, officer, Cinder and the Ashen Warlord. Connected shoulders/elbows, hands, knees, boots, leather and iron joins replace generic humanoid primitives. The governor has a larger crest, scar, heavier cuirass and longer mantle. His helmet is open; NORMAL/TRUE decorations retain a visible face. Crown Orcs retain steel, violet/oxblood livery and the royal seal, fitted below the new jaw. |
| V-03: Frontier Raider Archers | Region-3 enemy archers now use one coherent irregular/guerrilla field outfit: soft ash-brown hood, dust scarf, cloth tunic and half-cloak, leather bracer, one back quiver and one recurve bow. No helmet, cuirass or pauldrons. Crown marksmen show allegiance with a small oxblood cloth armband; officers use sewn rank marks and guardians darker cloth. Generic archer and Crown gear overlays are bypassed for this regional body. Other-region archers, Ranger heroes and the allied Goblin Archer retain their original drawings/assets. |

[Current marksman before/after](evidence/frontier-marksman-20261019/marksman-comparison.webp) · [Current full lineage/variant sheet](evidence/frontier-marksman-20261019/revised-lineage.webp)

The earlier `frontier-polish-20261019` captures retain the first candidate as historical evidence. Its armored Crown marksman was rejected by the owner and is superseded by the correction below.

[Desktop comparison in the game](evidence/frontier-polish-20261019/after-lineage-1280-day.webp) · [Phone comparison in the game](evidence/frontier-polish-20261019/after-lineage-375-day.webp) · [Phone at night](evidence/frontier-polish-20261019/after-lineage-375-night.webp)

## Source and asset boundaries

`src/prototype/visuals.js` owns the complete shared Orc drawing and `frontierRaider`. Existing generic Orc/captain/boss finish layers were consolidated into that body so they cannot cover its face. Existing Crown armor dispatch remains shared for other units; Frontier archers now own their entire outfit and bypass its incompatible plate/helmet/quiver pass. No new runtime file or dependency was introduced. Package/lockfile, generated build information and service-worker cache version advance together to dev.80.

Current main and the October 16 art census were reread. The manifest still contains 33 approved identities; none binds the enemy Orc, Warlord boss, Cinder or enemy Raider Archer bodies. These use procedural rendering. `ally:archer` is a separate accepted Goblin sprite and remains untouched. No original master, sprite manifest, variant registration, clip or audio asset changed. No image generation was used. Per-design records retain their prior references and now point to the exact procedural captures for this revision.

No maps, scenery, flowers, spawn positions, actor identities, combat geometry, statistics, timing, saves, portrait/dialogue data or audio were edited. Existing facing, presentation motion, nameplates, target indicators, captain attack cues and TRUE/ringleader finishes still use their existing owners.

## Focused verification

- `npm run build`: pass, dev.80; 204 campaign / 14 optional historical assets.
- `npm run format:check`: pass.
- `npm run check`: pass; generated outputs/syntax, sprite inventory/scope, materials and enemy audio coverage.
- `node tests/enemy-vfx-art.test.cjs`: pass; 264 authored recipes and 108 normal/TRUE animation draws, cue purity and lifecycle/fallback cases.
- `node tests/sprite-lifecycle.test.cjs`: pass; residency, anchors, variant identity, replacement, clips, reduced motion and procedural fallback.
- Focused body comparison: **8 changed target contracts, 32 unrelated body contracts pixel-identical**, using representatives from the five actual outdoor regions. No actor mutation or label-height changes. This is a bounded rendering check, not whole-game certification.
- 24 before/after native shell captures: 1280×800 desktop and 375×800 phone presentation, both at 150%, in day and verified night; checkpoint lineage comparison, authored Orc fort and authored Raider redoubt. No page errors; rendering leaves snapshots unchanged. [Machine-readable report](evidence/frontier-polish-20261019/native-capture-report.json).
- Native-size inspection: shared species and rank differences are visible; the captain/boss faces remain exposed with combat/nameplate overlays; Frontier uniforms match the surrounding ash/wood/earth. Fort walls still occlude some actors as before; these captures do not certify every possible nameplate/scenery overlap.

The side-by-side checkpoint deliberately repositions three existing actor records **in the capture fixture only**, to compare lineage; fort/redoubt captures retain authored spawns and props. Transparent body references also include explicit guardian/officer flags and TRUE form for visual coverage, not claims of additional authored spawns. Desktop/phone captures are Chromium **134.0.6998.35**, DPR 1 emulation, not physical-device or WebKit evidence. The pinned browser download failed; an older available Chromium Headless Shell was used without changing project dependencies. The initial night fixture used the cycle boundary and was corrected to clock 450 before the retained captures were produced.

No full regression/balance matrix, hosted CI or deployment ran. Final coordinated release validation and the owner's release decision remain pending. Individual appearance acceptance has not been attributed to the owner.

## Reproduce or resume

The manual tools are independent of CI discovery. Run from the repository with installed dependencies:

```sh
node tools/visual-review/frontier-polish-scope.cjs
node tools/visual-review/frontier-polish-gallery.cjs before
node tools/visual-review/frontier-polish-gallery.cjs after
CHROMIUM_EXECUTABLE=/path/to/headless_shell node tools/visual-review/frontier-polish-browser.cjs
```

Outputs default to `test-results/`; retained evidence is lossless WebP. The comparison baseline is read from Git. Original checkpoint `c8a281d8` owns the Orc repairs; `0703dfaa` owns the later marksman correction; subsequent local commits carry evidence, handoffs and documentation. Next action is now the combined-update integration handoff, not a standalone PR or validation cycle. Do not merge/deploy from an old handoff.

## Superseded standalone PR draft (retained history)

**Title:** Polish Frontier Orc lineage and ashland raider uniforms

**Body:**

```markdown
Addresses #320: ordinary Orcs, Cinder Warlord and the Ashen Warlord now share expressive Orc anatomy. Cinder conspicuously copies the governor's military kit while retaining his inspection ledger and subordinate rank. Frontier enemy archers wear ash/earth uniforms, with bows, quivers, guardian and officer distinctions preserved.

Candidate 0.9.1+snapshot.dev.80. Gameplay, saves, locations, audio, flowers and approved sprite registrations are unchanged. Other-region archers and allied Goblin Archer artwork are retained.

Validation: build, formatting, generated/asset checks, enemy VFX art and sprite lifecycle passed. Focused body comparison confirms 8 changed target contracts and 32 pixel-identical unrelated contracts. Retained 24 native before/after desktop/phone captures at 150%, including day/night and combat/nameplate overlays.

Full regression, hosted CI, WebKit/physical-device review and release approval remain pending. See docs/FRONTIER_VISUAL_POLISH_20261019.md and its evidence/design handoffs. Open as draft; do not merge/deploy from this checkpoint.
```


## Owner correction — guerrilla marksman, 19 October 2026

The owner rejected the previous preview's Crown marksman as two uniforms and two equipment sets. The screenshot confirmed an iron helmet, cuirass, pauldrons and second quiver drawn over the already hooded Raider. Retaining this overlay was an implementation error, not the requested terrain/faction adaptation.

The complete regional body is rebuilt for the requested mobile irregular role: adult face/brow/jaw, soft hood, dust scarf below the chin, loose field tunic, short half-cloak, flexible trousers/boots, leather forearm guard, one field pouch, one back quiver and one working recurve bow. One cloth armband carries Crown allegiance; sewn marks identify officers. Guardian, Raider, leader and actual Crown marksman all use this coherent loadout. Generic enemy quiver, leader equipment and Crown soldier layers cannot stack onto it. Other-region archers and all other bodies retain their previous output.

[Detail comparison](evidence/frontier-marksman-20261019/marksman-comparison.webp) (3× drawing for inspection) · [Actual phone scale](evidence/frontier-marksman-20261019/after-marksman-375-day.webp) · [Desktop night](evidence/frontier-marksman-20261019/after-marksman-1280-night.webp). Native captures remain at 150%.

Focused correction checks passed: build, format check, generated/asset checks, and a comparison against the prior local candidate `626bd58b`: **3 affected authored archer contracts changed; 37 unrelated contracts remain pixel-identical**, including the earlier Orc/boss/captain repairs. Snapshot purity and label heights are preserved. Sixteen additional before/after captures cover the actual Crown marksman camp and Raider redoubt on desktop and phone, day and verified night; no page errors or render-driven state mutations. [Capture receipt](evidence/frontier-marksman-20261019/native-capture-report.json). The four isolated ordinary/guardian/officer/Crown references are retained in the archer handoff.

These are Chromium emulation/focused visual checks, not new full regression or physical-device certification. The prior VFX/sprite-lifecycle receipts remain scoped to their original checkpoint; those suites were not rerun because this correction does not change their owning code. Version remains dev.80 within the same unreleased candidate. No remote staging retry, hosted CI, merge or release was attempted. The later combined-update integration handoff supersedes the proposed standalone PR process; release authorization remains separate.

Reproduce the targeted correction capture with `FRONTIER_VISUAL_BASELINE=626bd58b FRONTIER_VISUAL_SCENES=marksman,raider-redoubt` and the browser tool. The scope tool accepts `FRONTIER_VISUAL_BASELINE=626bd58b FRONTIER_VISUAL_TARGET=archers`.


### Follow-up: separate boots

The owner liked the guerrilla redesign but identified the pale decorative stroke between the boots as a rope. Removed that stroke only for Frontier enemy archers, including their guardian, officer and Crown variants. Both boots now stand separately. Current isolated references use `feet-corrected-body-8` through `feet-corrected-body-11`; earlier captures retain the preceding artwork. Prettier, build/syntax and a direct native-size drawing inspection passed. No new full/browser suite was run for this one-stroke correction. Same unreleased dev.80 candidate; no staging/release action.
