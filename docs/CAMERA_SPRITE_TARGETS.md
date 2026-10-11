# Camera and sprite targets · 9 October 2026

Joel chose 150% camera framing for desktop and supported phones. This is the default, with optional original 100% and 175% settings. World units, speeds, collision, targeting and attack ranges retain their existing values. Supported phone viewports begin at 375×800 CSS pixels, with rotation; narrow desktop windows retain desktop presentation.

## Actual viewing size

These are target visible body footprints for the existing canon at 150%, not transparent frame sizes. Measurements use current static outputs, alpha >20, and each contract's display scale; rounded values are useful for review, but processing should preserve the exact reference geometry. Animation or poses can extend these bounds.

| Design | Current body at 100% | Visible body at 150% (CSS pixels) | Desktop raster at DPR 2 | Phone raster at DPR 1.5 |
| --- | --- | --- | --- | --- |
| Paladin static | 50×65 | 75×98 | 150×195 | 113×147 |
| Mage | 40×63 | 60×95 | 120×189 | 90×142 |
| Ranger | 45×58 | 68×87 | 135×174 | 102×131 |
| Goblin | 38×49 | 57×74 | 114×147 | 86×111 |
| Vale cottage | 68×66 | 102×99 | 204×198 | 153×149 |

The shell caps device pixel ratio at 2 on desktop and 1.5 on phone, subject to its existing three-million-pixel canvas budget. Physical target dimensions equal the exact 100% reference body ×1.5 camera scale ×actual canvas ratio, rounded upward. Lower effective ratios use fewer physical pixels. Physical panel resolution does not replace CSS viewport size when judging phone layout.

## Future production rule

Keep accepted identity, world display dimensions and anchors. Author simple faces, readable silhouettes and material detail for the CSS body sizes above. Review an asset in the game at 150% on desktop and the supported minimum phone, in day/night and relevant combat context. Use sufficient processed raster resolution for the chosen canvas ratio, with minimal resizing; a detailed source cannot restore pixels discarded by processing.

For the current 192×192 reference frame, a full-frame raster without enlargement at the maximum desktop ratio is 576×576 (192×1.5×2); phone alone needs 432×432. These are future processing budgets, not permission to enlarge existing files. The preparation policy now supports 576-pixel outputs through an explicit raster scale, with density-aware frame coordinates, unchanged display geometry and existing bounded memory. See SPRITE_RESOLUTION_HOUSEKEEPING.md. Adaptation was subsequently resumed on 9 October. Follow SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md for fresh exports from untouched generator outputs and the audit of older intermediates. Preserve reference display geometry and gameplay units rather than making the actor larger to accommodate the raster.

Camera selection and viewing-size targets are resolved. Joel resumed adaptation, generation, implementation and publication on 9 October. Earlier production pauses are historical; fresh exports and native in-game review follow SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md. Existing sources, processed assets, approvals, animations, checkpoints and rollback records remain intact.

## Additional world-size retargets · 9 October 2026

Following the world proportion audit, selected environment features also have *world-presentation* multipliers in addition to the selected 150% camera. Houses and substantial habitable structures currently target 1.40×; major entrances, player transports and oppressive infrastructure 1.35×; trees and orchard features 1.30×. Combat entities keep 1.00×. This does not scale movement, attack ranges or region dimensions.

At the existing 192×192 logical frame, the **new source-raster targets** at the capped desktop DPR 2 are 576×576 for ordinary actors, 768×768 for tree features, and 816×816 for enlarged buildings/entrances/transports. These budgets include transparent pixels and are not permission to upscale reduced in-game exports. Larger targets may require recovering an untouched generator output or regenerating more legible geometry; inspect source sufficiency per asset. The developer policy and density limits live in [PROPORTION_IMPLEMENTATION_CHECKPOINT.md](PROPORTION_IMPLEMENTATION_CHECKPOINT.md).

Do not apply the scale twice. The renderer currently provides the additional `visualScale` for procedural and registered sprite presentation; keep the authored reference display geometry stable when preparing originals. Future material/texture tiles use their own pipeline contracts rather than the global character-sprite frame size.

The older 576-pixel figures above describe the *pre-proportion* 1.00× camera case; do not use them as the final pixel budget for a new 1.30–1.40× original-master replacement.
