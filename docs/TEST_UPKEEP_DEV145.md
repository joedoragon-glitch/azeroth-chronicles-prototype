# Test upkeep after dev.145

Owner requested correction of the incomplete test upkeep identified in the survival follow-up audit. This change updates the five affected existing suites, a separate source-linked preservation receipt and the development contract. Live runtime stays dev.145; source gameplay, generated assets, save schema and release wiring are unchanged. No deployment is needed.

Night/Rogue and enemy healing tests advance the actual Nightmare intro boundary and assert day-to-night behavior instead of assuming a fresh campaign is already in permanent night. Dreadmaw withdrawal fixtures set native `roomCaptain` and assert agricultural dispatch. The lifecycle test checks the active same-ID defender after travel replaces the old object. Cindermaw forced Cordon cases assert real native gaps and use a physically reachable nearby valid origin; the original anchor's selector refusal is tested. No terrain override or blanket placement bypass is added.

The historical protected Rogue fixture and original hashes are preserved. The new `snapshot-dread-upkeep-dev145.json` records 46 explicit rule reversals with dev.96/dev.101 source commits and decisions, plus four reviewed method receipts. Source diffs trace repeated Rogue use, expanded geometry/earlier retreat, night tempo, mounted movement, fort reach/line checks and committed withdrawal casting. Every other protected rule/method remains under its original hash. Negative probes reject unlisted rules, further edits of an approved field, approved-method edits and historically unchanged-method edits.

Development guidance now requires affected original tests/fixtures to accompany rule changes in the same PR, explicit timing/geometry/native actor prerequisites, source-linked snapshot reconciliation and actual final-candidate suite results. Diagnostic passes cannot stand in for failing originals. Focused validation remains focused; no automatic broad CI or device matrix is introduced.

## Checkpoint

Night/ringleader and 61 withdrawal cases pass; healing and complete Dreadmaw/Cindermaw results are being collected. Four preservation mutation probes pass. No broad CI or runtime release. Next: collect remaining original-suite results, check formatting/whitespace and finish this tests/documentation-only PR with `[skip ci]`.
