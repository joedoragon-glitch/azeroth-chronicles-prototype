# Tap talent announcement — dev.133

Owner request, 21 October 2026: tapping the level-up announcement for unspent talents should open Talents directly.

The existing requiresTalentPoints notice becomes a native button, with an English/Spanish Open Talents hint and accessible label. Tap/click opens the existing talent catalog; native Enter/Space activation stays out of gameplay key handling. Only this actionable card accepts pointer events; other announcements remain unchanged. Opening the catalog immediately hides the banner.

Activation rechecks remaining spendable talents, current campaign/active notice, menu/pause and pending/game-over challenge state. Existing combat/quiet-time display rules, queue priorities, talent spending, save data and balance stay unchanged.

Focused verification: actual shell notice updater under the existing DOM adapter covers direct activation, input isolation, immediate hiding, spending before repaint, old hidden cards, succession and campaign switching. Existing notice queue/talent lifecycle cases pass; build/generated/syntax pass. No broad CI or browser installation; owner phone play follows.

Published via PR #369 / `ba49c33879ea4e83fba0d69a0e71a728bebd5bab`; package-only run 39582121732 succeeded. Four exact live files and build match. Normal workflow restored and temporary publisher removed. Receipt: `docs/evidence/TALENT_NOTICE_DEV133_PUBLICATION_20261021.json`.
