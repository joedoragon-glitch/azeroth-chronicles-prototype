# PR #313 throne visibility and healing follow-up

Owner reports: the Crown courtyard exposes “Claim the Throne” before the Dark Lord's TRUE defeat; enemy healing must distinguish hostile allies from the hero and companions.

## Implemented candidate dev.75

The fortress throne interaction is absent before TRUE Dark Lord victory, including cached v4 worlds restored from earlier versions. Normal victory does not expose it. Awakening refreshes the physical interaction immediately; coronation, the sixth-companion reveal, prior TRUE dungeon credits, and legacy peace remain compatible. Direct stale interaction references still cannot claim before TRUE victory. The fortress structure and final encounter progression are unchanged.

The normal Dark Lord intentionally appears after both Crown specialists (Vera from Cindermaw and Tovan from the Citadel) are rescued. His normal defeat queues the TRUE encounter. Existing progression coverage verifies that sequence; early courtyard access does not bypass these prerequisites.

The enemy-healing faction guard now reads the current cached roster directly instead of invoking world maintenance for each candidate. It still rejects hero, troops, boss pets, neutral/dead/removed actors and missing rosters. A deterministic synthetic 100-cast/24-monster probe measured 5,000 world reads before versus 100 after; this is scoped overhead evidence, not a device frame-rate claim.

## Validation status

Focused throne route/restore, sixth-companion reveal and enemy-support tests passed. Native Chromium coverage passed desktop 1280×800 and phone 375×800, 393×852, 800×375 and 844×390. Build, formatting, asset checks and all 24 protected integrity checks passed. Full progression and the 1,024-state ending matrix continue as longer checks. Full CI, WebKit and a new source-matched 6,912-case balance observation remain required for merge readiness. Earlier dev.74 runs are historical evidence only; the runtime changed. No merge or deployment is authorized by this checkpoint.
