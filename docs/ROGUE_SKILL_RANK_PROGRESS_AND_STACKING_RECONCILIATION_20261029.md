# Rogue / Pícara — rank progression and stacking integration (29 October 2026)

**Game:** So I Became the Dark Lord's Problem. **Related issue:** #602.
**Scope:** Gameplay-ranked effects and instructor/journal verification. No artwork, names, graphics-engine or companion-navigation changes. No assumption that an unmerged draft is current release behavior.

## Integration decision

- **PR #606 is merged** and owns the additive stacking contract across Rogue songs, Wither/Mending, enemy debuffs, and two legal music stations. Preserve its independent live cast records and natural expirations. Unlike the older nonstacking implementation, a legitimately achieved normal + charged or repeated cast may contribute for its own remaining duration.
- **PR #603 remains an unmerged, earlier, Skill-1-only alternative.** Its +5%/+7% original-rank intent is already incorporated more broadly by #606; do **not** reapply its obsolete family names or strongest-only changes. The gameplay integration uses #606's actual current mainline structures.
- **PR #604** separately verified the English/Spanish instructor, Rank-8 and Skill Journal flows. Its three test files are integrated here without merging that draft independently.
- PR #555 (Rogue canon/docs), #531 (jingle art/diagnostics), and other non-Rogue engine work remain independent. The rank work does not change their files or override their publication gates.

## Authoritative ranked forms

All eight skills use **one saved Rank 1–8 per slot**. Rank 1 remains byte-for-byte equivalent to the merged gameplay baseline for each parameter. Both Tap and Charged have measurable upgrades per rank; they can improve differently. The Rank-1-to-8 delta is spread linearly over seven paid advances and stored nowhere new; the pre-existing **+15% of Rank-1 direct damage per rank** remains the source of basic Skill 1 and direct Skill 8 damage.

| Slot | Tap improvements by Rank 8 | Charged improvements by Rank 8 |
| --- | --- | --- |
| 1 | Basic-hit Refrain +5% → +7%; auto and pulse direct damage retain native rank multiplier | Basic-hit Refrain +7% → +9%; direct pulse retains native multiplier |
| 2 | Slow 1.5 → 2.1s; movement +8% → +12%; cooldown recovery +5% → +8%; boon +0.5s | Slow 2.2 → 2.8s; movement +12% → +16%; recovery +8% → +11%; boon +0.5s |
| 3 | Enemy interrupt debt +0.2s, cast protection duration 3 → 4s | Debt +0.2s, hush duration +0.3s, protection 4 → 5s |
| 4 | Wither budget +0.5 percentage points of target HP; anti-heal +8pp; heal 3% → 4.5% max HP; incoming healing +2pp | Wither +0.7pp; anti-heal +6pp; heal 5% → 6% max HP; incoming healing +2pp |
| 5 | Station Slow +0.15s, Slow resistance +5pp, station lifetime +0.5s | Same Slow/resistance/lifetime improvements; ward 6% → 8%, pulse damage coefficient +0.05 |
| 6 | Enemy cooldown debt +0.25s; special recovery +12% → +15%; boon +0.5s | Debt +0.3s; recovery +18% → +21%; boon +0.5s |
| 7 | Push +8 units, Weaken +0.6s and +2.5pp strength; outgoing damage +5% → +7%; boon +0.5s | Push +10, Weaken +0.6s and +3pp strength; outgoing +8% → +10%; boon +0.5s |
| 8 | Direct damage keeps +15%/rank; critical chance +4pp → +5pp, special damage +4% → +5%, boon +0.5s | Same native direct-damage scaling; critical chance +6pp → +7pp, special damage +6% → +7%, hush +0.15s, boon +0.5s |

These are initial bounded tuning values, **not a claim of owner-tested balance**. No cooldown, radius, maximum-target, Charm eligibility, critical-roll frequency, boss phase protection, or skill-training costs are changed. Current normal/charged separation and earned overlapping performance windows remain intact.

## Implementation ownership

- `hero-combat.js::roguePerformanceAtRank` resolves rank-aware source data on demand, without mutating frozen `R.roguePerformances`. `rogueSkill1Config` similarly resolves both basic-buff forms; actual legally released songs retain the independent per-cast stacking from #606.
- `skill-reference.js::describe/changes` uses the **same live resolution**, so all paid rank-ups show real current effects and actual next-rank differences. Skill 8 now shows current actual per-hit damage instead of a rank-independent coefficient.
- `party.js` lifts the old 5% heal-budget ceiling to a finite 8% noncritical / 10% critical per-cast safety limit so Rank-8 Charged Mending can supply its promised 6% budget. The pre-existing healed-HP maximum, finite single-cast budgets, no revival, and one frozen critical receipt remain.
- `tests/rogue-skill-rank-progression.test.cjs`: 128 real casts = 8 skills × Tap/Charged × eight ranks. Tests real Rogue/self-companion/hostile effects, rank-by-rank journal comparisons and Rank-8 +7%/+9% Skill 1 stacking; existing #606 stacking regression must also stay green.
- Imported #604's English/Spanish instructor UI, all-tier paid upgrade and journal tests. **Passing source-only assertions are not physical-device confirmation.**

## Merge/acceptance gates

Focused test suites, existing Rogue critical/stacking tests, build packaging and source/docs verification should pass against this integration head. Report and repair unexpected failures before marking ready. Keep draft until tested; no autonomous merge or Playable/PWA deployment, and no assertion that older branch PRs automatically become obsolete without review. Performance/critical balance can still need a separate player playtest before final balance approval.
