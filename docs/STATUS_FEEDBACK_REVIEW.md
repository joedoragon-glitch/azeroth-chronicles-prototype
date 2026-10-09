# Short status feedback contract

The transient status is for immediate help after a specific attempted action, not a scrolling game event feed or quest narration.

- Routine feedback is short-lived (~2.6 s); save/storage/backup failures remain longer (~6.5 s).
- Keep a single status near the two stacked amber milestones without overlapping on phone.
- Keep only short useful failures: target, unavailable skill/cooldown, lost target, unreachable position, insufficient crowns, defeat boss before freeing specialist, active enemies block refuge rest, guards block Treasury access, no idle labor.
- Discard duplicate level-up status (amber covers it), installed-app notices, harmless charge-cancellation prose and routine trainer/smith/tonic amber events.
- On a smith purchase, confirm **equipped** only if the weapon actually becomes active. If the hero's owned legacy weapon is stronger, confirm that the purchased upgrade did not replace it. Armor is active as soon as its tier is purchased. Inventory item switches also receive a brief confirmation.
- Insufficient-MP status exists **only** while `PrototypeRules.resourceMode.manaEnabled !== false`. The reversible cooldown-only proposal lives in PR #169 and its `docs/COOLDOWN_ONLY_COMBAT_MIGRATION.md` has an explicit restoration checklist. Do not delete the original mana warning text permanently.
- All other advanced game knowledge belongs in the optional Drowned Keeper codex, not the Controls help or transient HUD.
- The Ember/amber banner is reserved for milestones, useful combat victories and selective story narration. The 30 specific quest-completion story lines are deferred to the next chat by request.
