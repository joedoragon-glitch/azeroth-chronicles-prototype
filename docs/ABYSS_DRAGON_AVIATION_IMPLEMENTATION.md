## Implemented aviation maneuvers — experimental draft

This candidate builds on the existing boss-combat movement state instead of creating a second engine. The four primary warning labels are Compressor Surge, Wake Vortex, Lazy Eight and Scramble Order. The three additional named abilities are High Yo-Yo, Wingover and Go-Around.

Lazy Eight moves through lateral banking waypoints before the two existing separately warned landing impacts. High Yo-Yo banks toward the already-marked target before executing the existing limited strike. Wingover banks out and reverses before executing the previously marked scatter. Go-Around withdraws after its healing warning and heals only when that motion finishes. The existing normal and TRUE summon ceilings are untouched.

Every added waypoint is checked against collision; blocked segments fall back to the normal collision-aware destination movement, with bounded timeouts. New automated tests cover both difficulties and normal/TRUE forms. Actual game/device checks and protected-hash reconciliation are still release gates.

The name **Air Force One** remains a playful comparison, not a literal aircraft or an operational military air fleet. No merge or deployment is authorized.
