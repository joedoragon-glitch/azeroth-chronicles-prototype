> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# PR #300 — Crown economy: regional monster reward review (15 October 2026)

**Assessment only. No payout, price, XP, level-penalty, or save schema changes authorized or made.** Currency is Crowns, although code/save keys still use `gold`.

Source of truth: `src/prototype/data.js` (five regions, bosses, quests), `src/prototype/rewards.js` (loot and penalties), `src/prototype/rules.js` (multipliers/gear costs), `src/prototype/world.js` (population), `src/prototype/engine.js` (death awards and summons).

## Base payout before player-level penalties

| Region | Ordinary | Ringleader | Night ordinary | Initial outdoor enemies | Named Normal bosses | All region quests | Dungeon first clear |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| Greenwood | 6 | 9 | 4 | 32 | Thornfang 35 + Lifebinder 65 | 160 | 100 |
| Marches | 11 | 16 | 8 | 40 | Mirejaw 100 + Drowned Keeper 150 | 380 | 220 |
| Ironroot | 18 | 27 | 14 | 48 | Ridge Tyrant 220 + Garun 300 | 700 | 400 |
| Frontier | 27 | 40 | 22 | 56 | Warlord 380 + Veyrith 480 | 1,200 | 650 |
| Crown | 37 | 55 | 30 | 64 | Cindermaw 560 + Veyra 700 + Dark Lord 850 | 1,900 | 900 |

The ringleader multiplier is 1.5 times its base and reward results are floored. The Frontier's one separately authored field captain has a nominal 68 Crowns (`round(27 × 2.5)`), not included above. Ordinary *main-dungeon and Treasury guardians* are made rewardless by `guardianRewards` (0 Crown / 0 XP), and owned temporary summons do not pay. Some outdoor mini-site defenders use earlier distinct rules and should not be treated as room guards.

Reward multiplier with **hero levels ABOVE enemy level**: +0 = 1.0, +1 = 0.75, +2 = 0.4, +3 = 0.1, +4 or more = 0.0; each actual payout floors the reduced reward. Loot also must actually be collected. Normal values are therefore ceilings rather than guaranteed receipts.

## Nominal first-clear Crown injection, not a live-player cash-flow measurement

Assumptions: defeat/collect all **initial** outdoor ordinary enemies once at full 100% reward, complete all region quests once, defeat named Normal bosses once and take one main dungeon first-clear bonus; do **not** count finite resource deposits, dynamically spawned elites or night foes, mini-sites, post-game TRUE bosses, level penalties, money spent, or missed loot.

| Region | Ordinary enemies | Quests | Normal bosses | First clear | Modeled subtotal |
| --- | ---: | ---: | ---: | ---: | ---: |
| Greenwood | 192 | 160 | 100 | 100 | 552 |
| Marches | 440 | 380 | 250 | 220 | 1,290 |
| Ironroot | 864 | 700 | 520 | 400 | 2,484 |
| Frontier | 1,512 | 1,200 | 860 | 650 | 4,222 |
| Crown | 2,368 | 1,900 | 2,110 | 900 | 7,278 |
| **All regions** | **5,376** | **4,340** | **3,840** | **2,270** | **15,826** |

Frontier + Crown account for a nominal **11,500 Crowns**, of which ordinary initial outdoor mobs contribute **3,880**. The bigger late-region cash injection is the combined quest + boss + dungeon-clear reward (7,620), not just the modest step in standard monster drop from 27 to 37. Dark Crown's initial ordinary pool is 64 vs Frontier's 56, which compounds it. The numbers are *upper-bound model inputs*, not verified account balances.

Late player sinks include tier-4 weapon 2,000 and armor 1,200, skill 7 unlock 1,000 and skill 8 unlock 1,600; 70-Crown preparation tonics plus reforge, training, companion hiring/recovery and travel. Five post-Dark-Lord awakened dungeon bosses separately pay 500/600/700/800/1,000; the ordinary TRUE boss branch otherwise doubles nominal boss reward where its special awakened override is inapplicable.

## Assessment and decision gate

**Risk:** net late-game inflation is plausible for completionists. Simply spreading unchanged large boss payments across more standard monsters does *not* lower total Crowns, and may reward grinding more. Avoid punitive reductions to story-route players who need gear/skills.

**Proposed follow-up, not coded:** compare realistic hero balances for (1) story-route, (2) thorough completionist, (3) deliberate farming under correct kill levels, actual merchant/recovery costs, quests, bosses, resources, TRUE and restored-v4 behavior. If those confirm excess, consider a *bounded reduction in surplus nonessential late-game fixed/elite rewards* while keeping bosses rewarding and normal enemies fairly compensated; or conservatively shift reward concentration from elites to several already-authored ordinary enemies while explicitly reducing the whole region budget. Get separate director numerical signoff before changing values. Never change protected class-combat/XP/final-phase rules to fit an arbitrary total.

**Evidence boundary:** This is a source-and-formula review; no Node executable campaign run or Playwright end-to-end balance measurement is claimed.
