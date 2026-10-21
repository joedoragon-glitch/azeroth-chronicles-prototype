# Ranger Heal feedback — dev.119

Fixes the minor message defect from the [support recipient audit](SUPPORT_RECIPIENT_AUDIT_20261020.md). If otherwise-ready Rangers are inside Mage Silence, manual Heal now says **“Ranger cannot use Heal while silenced.”** It no longer claims a zero-second cooldown. The same reason handling applies to the retained legacy Mana Recovery label when that resource mode is enabled.

Caster selection, availability, healing, cooldowns and Silence rules are unchanged. A ready caster outside the field can still heal a pet inside. Automatic failed support stays quiet. Normal cooldown and no-active-Ranger messages remain.

Eight focused cases pass: Silence, quiet automatic failure, actual cooldown, dead/resting/absent Rangers, mixed silenced-ready/cooling casters, and an outside ready caster successfully healing. Build/generated syntax, asset inventories and changed-source formatting are checked. No full-game suite or hosted test CI is needed for this message correction.

Prepared for package-only publication. The earlier 146-case dev.118 audit and reproduction remain immutable historical evidence; use `tests/ranger-support-feedback.test.cjs` for the repaired message.
