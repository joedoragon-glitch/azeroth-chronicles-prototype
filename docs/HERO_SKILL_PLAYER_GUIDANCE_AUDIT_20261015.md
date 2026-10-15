# Hero skill player guidance — UI audit and concise reference redesign
15 October 2026 · Azeroth Chronicles multi-file GitHub Pages/PWA

**Status:** source-level audit and player-facing copy/UI changes on `feature/hero-skills-2-4-on-snapshot-20261015` (based on PR #300). These changes are **not tested, built, merged, or deployed**. Continue to defer tests until the owner’s consolidated validation pass. **No combat damage, skill effects, targeting, control timing, hold thresholds, ranks, or cooldowns were changed by this UI work.**

## Existing discovery paths: findings

1. **Adventure menu:** previously offered Talents, Inventory, Map etc., but no direct Hero Skills entry. The dormant Character menu had a Skills and Teachers action, yet the main Adventure menu did not expose that path. Gameplay controls could open the reference through an action binding, but the menu path was not discoverable to a casual user.
2. **Skills and Teachers reference:** `menus.js` used descriptions from an older class kit (Paladin/Mage healing and invulnerability on Skills 3/4/8, Ranger Skill 6 haste, old generic Skill 5/7). It displayed class-neutral training labels, lengthy metadata and explanatory text inline across the skill list. It described charged effects for only Skills 1–3 even though every slot now has a charged form.
3. **Rescued teachers:** their menus exposed upgrade price, skill number and rank cap, but not a succinct description of what the player was about to learn. Names came from generic `D.skills` labels such as Area Attack rather than each class’s actual skill.
4. **Barracks:** accessible rescued specialists and the Keeper, but did not directly provide a Hero Skills quick reference. Players should not have to navigate a specialist submenu solely to understand their active abilities.
5. **Drowned Keeper Archive:** contained a more accurate skill reference, but gated access behind story/progression and a Keeper pact, with some long old prose. It should be a voluntary deeper source, **not a prerequisite** for understanding basic class abilities.
6. **HUD:** skill buttons already show available cooldowns, ranks, charge-progress readiness and simple tooltips; the tooltips alone are not dependable for touch users. Avoid placing multi-line rules directly on the eight in-combat buttons.

## Implemented low-friction teaching structure

**Primary path:** `Adventure → Hero skills` at any stage of progression. Also directly accessible from **Basic Barracks**, **Full Barracks**, the existing Character submenu, the existing Skills control, and a **Review hero skills** option at each rescued teacher.

**Overview list:** up to eight **revealed** skills, respecting existing story/progression discovery. Each row contains *skill number, class-specific normal-skill name, learned rank (or Unlearned), and a short role label* (for example, `Frost Bolt · Single slow / frost burst`). No long descriptions in this list. An extra `Training and companions` option retains Expedition/support/companion teaching data without forcing it into the main skill list.

**One selected skill:** a compact read-only detail page with:
- Learned rank; reminder that normal and charged share one skill rank
- **Tap:** one short effect sentence and the **current live normal cooldown**
- **Charge:** one short effect sentence and the **current live charged cooldown**
- An optional single-line restriction only when it materially affects player decisions (e.g., Paladin Shield blocks Skill 1, Mage Silence affects allies, Ranger Rally needs living allies, Skill 8 no immunity)
- For a revealed but unlearned skill, its instructor and learn cost

The overview teaches the shared **0.65s hold**, shared rank/cooldown slot and **+15% of Rank 1 damage per skill rank**. Cooldown values use `game.skillCooldown(slot[, true])`, therefore honor existing Cooldown Training automatically rather than hardcoding static cooldown numbers. Teacher dialogs retain their normal purchase flow and now show each class’s skill name and short role before purchasing; the user can choose the Review option before investing crowns.

**Keeper's shelves:** kept as an optional read-only extended reference with the existing `Show me the figures` flow and dynamic rank/cooldown values. Skill labels now cover the full class-specific 1–8 kits; long effect passages have been shortened to tap/charge distinctions.

## Principles and scope

- **Progressive disclosure, not a rules wall:** visible skill rows are scannable; a player sees one extra description only after choosing a skill; exact figures remain optional at the Keeper. Avoid pop-up tutorials, skill interstitials or persistent tooltip clouds.
- **Information must be current:** no reused "heal", "immunity", "slow" or "haste" text for skills that changed roles. The current preview covers Paladin stance/judgment/wards, Mage frost/force/chain/Fracture, Ranger rally/repelling/hunt.
- **Keep gameplay readable:** HUD remains compact; no permanent in-combat blocks, no extra sound/VFX requirements for this work. The new audiovisual Work branch can add its effects separately.
- **Not yet a passive-skill UI:** independent class passives have been deferred until gameplay balance testing. Do not present empty passive slots or promise future passive effects.
- **Do not accidentally expose spoilers:** only already-revealed skills appear in the overview; unrevealed skills still follow `game.skillRevealed` discovery conditions. A revealed but unlearned skill may show the teacher and cost.

## Deferred combined QA checklist (NOT executed)

- A fresh game shows Skill 1 with accurate normal/charge and cooldown information; advancing to each region reveals appropriate skills without displaying future locked spoilers prematurely.
- `Adventure → Hero skills → Skill N → Back` behaves with mouse, keyboard and phone touch, including screen readers; keyboard/direct Skills control and Character submenu return to the correct parent.
- Both Basic and Full Barracks show the direct Hero Skills option and return to the correct barracks page; rescued teacher Review returns without training/spending gold; actual teacher training still changes learned rank and cost correctly.
- Live cooldowns after Cooldown Training and shared rank progression are reflected in the quick reference; all 24 class/slot pairs display current tap/charged descriptions.
- Keeper's Archive remains an optional alternate reference and respects the story gate, class names, rank and figure contracts; longer optional lore outside of this skill catalog is unaffected.
- Compare mobile dialog sizing, line wraps, scrolling and accessibility against compact-phone and Chromebook layouts. No HUD overcrowding and no gameplay or PWA regression.

**Release:** Do not merge, deploy or mark validated before the owner requests the single coordinated QA pass for the combined gameplay and audiovisual branches.
