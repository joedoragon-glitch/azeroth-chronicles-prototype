# Approved 513-entry procedural pass

Start with `docs/APPROVED_ART_PASS_20261019.md`. Evidence is retained under `approved-art-pass/`; `handoff-index.json` maps every original stable assessment identity to its current resumable design record. The 168 matching earlier procedural-candidate records retain their past evidence and point to their latest continuation.

The artwork commit is `8acd14de52359febdb40a1d588d2c4c62b4fabf7`. This local review branch is unreleased. No new raster assets were generated. Retained-image reconciliation changes dependency/comparison receipts only; it does not approve a new appearance.

Focused checks:

```bash
node --expose-gc tools/visual-review/check-approved-art.cjs
python3 tools/visual-review/build-approved-art-review.py
node tools/visual-review/verify-approved-art-review.cjs
```

The first uses the retained assessment baseline from Git, current production drawings and manifest contracts. The HTML builder uses Pillow and retained WebP captures; it recreates the self-contained review file without any network calls. The UI verifier uses Playwright and checks pairing, search, notes/export, zoom, navigation, responsive layout and all 36 scene previews. Set `ART_REVIEW_CHROMIUM` to a specific installed Chromium executable if needed.

`capture-approved-art-scenes.cjs` retains the exact successful scene fixtures. It runs the real desktop/phone browser renderer at 150%, switches only the drawing source for the before stage, and checks page errors and snapshot immutability. Running it intentionally replaces these dated native captures; do so only for a new comparison revision and preserve the current evidence first. It is a bounded artwork check, not a complete gameplay regression or physical-device acceptance test.

The original 605 before images must remain immutable. Result-review approvals belong to Joel's later feedback, separate from his approval of every implementation plan. Nothing in these tools authorizes a merge, release or deployment.
