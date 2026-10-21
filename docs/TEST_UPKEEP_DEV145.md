# Test upkeep after dev.145

Owner requested correction of the incomplete test upkeep identified in the survival follow-up audit. This change updates the five affected existing suites, a separate source-linked preservation receipt and the development contract. Live runtime stays dev.145; source gameplay, generated assets, save schema and release wiring are unchanged. No deployment is needed.

Night/Rogue and enemy healing tests advance the actual Nightmare intro boundary and assert day-to-night behavior instead of assuming a fresh campaign is already in permanent night. Dreadmaw withdrawal fixtures set native `roomCaptain` and assert agricultural dispatch. The lifecycle test checks the active same-ID defender after travel replaces the old object. Cindermaw forced Cordon cases assert real native gaps and use a physically reachable nearby valid origin; the original anchor's selector refusal is tested. No terrain override or blanket placement bypass is added.

The historical protected Rogue fixture and original hashes are preserved. The new `snapshot-dread-upkeep-dev145.json` records 46 explicit rule reversals with dev.96/dev.101 source commits and decisions, plus four reviewed method receipts. Source diffs trace repeated Rogue use, expanded geometry/earlier retreat, night tempo, mounted movement, fort reach/line checks and committed withdrawal casting. Every other protected rule/method remains under its original hash. Negative probes reject unlisted rules, further edits of an approved field, approved-method edits and historically unchanged-method edits.

Development guidance now requires affected original tests/fixtures to accompany rule changes in the same PR, explicit timing/geometry/native actor prerequisites, source-linked snapshot reconciliation and actual final-candidate suite results. Diagnostic passes cannot stand in for failing originals. Focused validation remains focused; no automatic broad CI or device matrix is introduced.

## Complete verification

All five affected original suites now pass on the final candidate:

- Night/ringleader/Rogue and enemy support-healing suites, including actual sunset boundaries and native renderer/save checks.
- 62 enemy withdrawal scenarios, including real Dreadmaw dispatch and the intentionally shifting native closure.
- Dreadmaw: protected original table reconstructed with source-linked approved changes; 42 live casts, 42 fatal recovery boundaries and 12 contextual scheduler pilots.
- Cindermaw: native placement/refusal, all four mode/form move groups and lifecycle, 120 fatal boundaries, and all seven regular slots through the unforced native selector.
- Four negative preservation probes reject unexpected rules/methods. The historical fixture is byte-for-byte unchanged. Changed test formatting and whitespace checks pass.

[Evidence receipt](evidence/TEST_UPKEEP_DEV145_20261021.json) and [guard probe/logs](../tools/survival-test-upkeep-dev145/) retain results. PR #382 contains the complete test/documentation change; no new runtime build, deployment, broad CI or device matrix is needed. The review-only audit’s pending original-suite status is superseded by these real suite results. Original diagnostic evidence remains historical.

## Follow-on history request

PR #382 is merged as `5f4b28af08a24aeff253f8f7f11a6acbfeac3e9d`. The owner then requested a trace of first drift and a reviewable retest scope. [Historical trace](TEST_DRIFT_HISTORY_DEV145.md) distinguishes the repaired original failures from a broader permanent-Nightmare coverage gap in older specialist mode fixtures. Passing the repaired suites does not certify every untested phase/interaction; that gap is the first proposed follow-up for joint review.

That first package is now complete: [six original specialist matrices cover explicit grace, post-sunset and legacy night](NIGHTMARE_SPECIALIST_UPKEEP_DEV145.md), alongside Normal controls. The independently reproduced Lifebinder identity and Scornfang stepping assumptions are corrected. All six original suites and the daylight/tempo controls pass; no gameplay change or deployment follows from this test upkeep.
