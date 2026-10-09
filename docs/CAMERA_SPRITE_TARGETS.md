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

For the current 192×192 reference frame, a full-frame raster without enlargement at the maximum desktop ratio is 576×576 (192×1.5×2); phone alone needs 432×432. These are future processing budgets, not permission to enlarge existing files. The current preparation policy limits outputs to 512 pixels; revise and verify that policy, frame coordinates, memory accounting and rendering density before producing a 576-pixel replacement. Preserve reference display geometry and gameplay units rather than making the actor larger to accommodate the raster.

Camera selection and viewing-size targets are resolved. Sprite generation, replacement and further asset publication remain paused until Joel requests production to resume. Existing sources, processed assets, approvals, animations, checkpoints and rollback records remain intact.
