# Critical companion survival — dev.141

Joel requested critically wounded companions stop fighting, avoid enemies and keep following him so he can continue an encounter with his healthier companions. This extends the existing party judgment, travel and retreat collision owners.

At 20% HP or below, an active living companion enters individual survival mode immediately. It remains until reaching 40% HP. It does not acquire offensive targets, use active attacks or defensive counterattacks, or finish a pending offensive charge. Critical damage before charge resolution cancels release even when the hit was too small for the normal interruption rule. Forced enemy holds/scatter still take priority until released.

Survival takes priority over build, upgrade, gather and deposit work. Paid progress, orders and cargo are preserved and resume after recovery. Healthy companions keep their own combat/work behavior and the hero's order is untouched. No whole-party Recall is issued. Low-health units are excluded from the fighting support estimate.

The wounded companion selects lower-pressure positions around the moving hero and itself, using nearby enemy awareness, ranged reach and boss special reach. It avoids idle hostiles too. Normal following uses a 420-unit search band; long-range threats expand that band to seek safer spacing. Bounded route planning goes around terrain while avoiding hostile awareness. A blocked destination permits only physically legal local escape steps that improve its safety score. Friendly passage from dev.140 remains; enemies and terrain never grant a retreat escape allowance. Moving retreat keeps the existing 50% defense, ending on arrival. There is no new healing, invulnerability, speed bonus, teleport, reduced recovery cost or guarantee of survival inside an enclosed or overwhelmingly dangerous arena.

One optional boolean, `survivalRetreat`, retains the recovery threshold through Recall, travel and save/reload, including partial healing above 20%. It is validated in the compatible v4 save schema. Old saves need no migration and critically wounded old-save companions recognize their health on update. Destinations, paths and threat observations remain transient. Recovery to 40% releases this hold; ordinary non-critical caution still applies.

An English/Spanish notice explains that critical companions are avoiding combat, keep following and rejoin at 40%. Existing Ranger healing and other supportive effects remain usable.

## Validation record

Implementation checkpoint: 58 focused survival scenarios passed, including all 39 hero-class/role combinations, two simultaneous wounded companions with a healthy fighter, moving hero, immediate entry, charge timing, work/cargo preservation, Recall, save/travel, ranged reach, walls and native terrain with actual engine ticks. Boss spacing, supportive healing, forced hold and narrow-lane cases also pass. Final existing-suite verification and phone startup are pending at this checkpoint. No broad CI/full-game suites are authorized or run.

The dev.106 cover-fire fixture now uses wounded 30% HP, because critical units intentionally no longer shoot. The dev.140 collision fixture uses 30% HP under captain pressure to keep ordinary automatic-regroup coverage separate from the new survival policy. Existing numerical collision/Recall-defense expectations are preserved.

The dev.139 assessment's critical anchor, preparation/construction priority and delayed-entry findings are addressed for critical companions by this update. Ordinary non-critical regroup destination and preparation/work priority behavior remains unchanged. The historical dev.139 evidence is preserved and must not be presented as a dev.141 result.

Standing owner requested-fix publication workflow: package-only deploy after the focused checks, verify exact public build/resources, then restore normal workflow byte-for-byte and remove temporary publisher. Publication pending.
