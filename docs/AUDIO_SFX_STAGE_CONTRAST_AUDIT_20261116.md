# SIBDLP Sound Library — registered effects and stage-differentiation review (16 Nov 2026)

## Current source and release uncertainty

- PR #880 merged into main on 16 November 2026 at 07:02 UTC as commit 409f0ed671b0ff2563f788bf45ab665e01c05ca6. It replaced 30 production WAV bytes, updated the manifest, and staged the dev.289 service-worker/audio package. All 30 originals remain SHA-frozen in tools/audio/sfx-legacy/dev288.
- PR #881 is a separate, explicitly NONSHIPPING, older research/A-B branch; its 30 experimental previews and ten extra sketches are NOT the current registered effects. Do not merge it to solve this report.
- The current source does **not** verify actual Pages publication or the owner's installed/PWA client. A dev.288 client could still present the old 30 and old catalog. Conversely, the current source uses SHA-256 verification when fetching a WAV, so an old asset mistakenly served with a new manifest hash should be rejected, not quietly played as new.
- The source facts do not prove whether the owner's observed similarities originate from old bytes, new artistic timbre, speaker/level masking, or a combination.

## Source inventory

Exactly 30 **registered recorded effects**: 12 material families (steel, claw, bone, stone, wet, arrow, spectral, ash, holy, arcane, root, dust) with separate release/impact WAVs, plus six standalone cues (critical warning, hero steel swing, hero steel impact, Soldier Power Strike, Holy Cleave, Piercing Volley). The existing 95 event-guide keys have eight nonempty recording-bound categories; the remaining keys deliberately rely on runtime synthesis or silence. The recorder program was original project-owned waveform synthesis, **not a generative AI audio model**. This is not a claim that the separate studio pilots were integrated.

## Independent PCM stage audit

Measured directly from the archived old and currently registered WAVs: percentage of total normalized signal energy in the first 40 milliseconds. Earlier/stronger energy means an abrupt impact-like onset; later onset/center means a moving/launching cue. Values are descriptive, not loudness matching or a human hearing assessment.

| Material | Original dev.288 release / impact | Current dev.289 release / impact |
| --- | ---: | ---: |
| Steel | not measured in archive pass | 5% / 72% |
| Claw | 94% / 97% | 14% / 47% |
| Bone | not measured in archive pass | 38% / 96% |
| Stone | **95% / 96%** | **9% / 70%** |
| Wet | not measured in archive pass | 18% / 76% |
| Arrow | **96% / 95%** | **41% / 95%** |
| Spectral | **96% / 95%** | **13% / 65%** |
| Ash | not measured in archive pass | 8% / 83% |
| Holy | 94% / 96% | 44% / 73% |
| Arcane | not measured in archive pass | 16% / 78% |
| Root | not measured in archive pass | 8% / 89% |
| Dust | not measured in archive pass | 6% / 92% |

The five audited old pairs also have amplitude-envelope cosine similarity between 0.998 and 1.000, consistent with a common transient template. The new waveform data establish distinct temporal stage structures; in particular, the user's arrow, stone and spectral examples are no longer nearly identical in envelope. **Claw and holy remain perceptual-watchlist cases** because their new 20-ms-binned envelope cosine similarities are still approximately 0.907 and 0.932. Distinct hashes/timing are necessary but not sufficient for satisfying sound design.

## Narrow branch-only correction

- The **same Game Sound Library** gains a contextual release-versus-impact comparison beneath the selected sound, using two existing game IDs and the existing SHA-checked, tap-initiated, one-shot playback path. It is never offered for a cue without a counterpart. Switching stage clears a restrictive filter rather than playing an invisible or wrong entry.
- New desktop/phone browser assertions check selection, actual player result, source controls and proper hiding for unrelated sounds. The physical-WAV QA now rejects any of the twelve new pairs whose launch/contact onsets or energy centers collapse together; the test is explicitly **not** a psychoacoustic verdict.
- No new recordings, altered gameplay events, mixing changes, published files, save access, or unapproved Phase 2 assets. The branch updates its own Sound Library PWA file fingerprints but is not a release. No merge or deployment without applicable owner permission.

## Verification and further decision

1. Run the exact-source Python PCM, Node audio-library, browser, build/offline regression suites and record real CI results on the review PR. No success is assumed from writing tests.
2. Independently identify what the actual player deployment serves (version, manifest hash/manager and physical WAV hash), especially with an installed PWA. A source merge is **not** a published-client verification.
3. Listen to **the verified new files**, comparing release versus contact for all twelve families, beginning with the reported arrow/stone/spectral pair and claw/holy watchlist, using headphones and a phone speaker. Judge distinct *timbre* as well as temporal behavior; confirm meaning in actual game encounters.
4. Only if the new pair's acoustic design remains insufficient, adjust the affected generator design, physically regenerate WAV assets and manifest hashes, maintain old backups and rollback, rerun regression and seek publication approval.

Status: source and PCM comparison complete; library comparison feature and regression checks staged for verification; actual player delivery and human audible quality **UNVERIFIED**.
