/* Authored regional quest payoffs, independent of the world/visual canon. */
(function (root) {
  'use strict';
  // 1-based review numbers match quest-0 through quest-29; null means no announcement.
  // Every quest still finishes and pays automatically, including those without a card.
  const lines = [
    null, // 1
    null, // 2
    null, // 3
    { kind: 'narration', text: "The Crypt Guardian kept Borin working on the Dark Lord's unfinished woodland retreat. The Forest Crypt was never just a tomb." }, // 4
    { kind: 'narration', text: "The merchant wagon behind Millhaven travels onward to Flooded Marches. The wagon stand is your link beyond Greenwood Vale." }, // 5
    { kind: 'narration', text: "The Dark Lord claims Greenwood as a private woodland retreat, not his capital. His seat of power remains in Dark Crown." }, // 6
    null, // 7
    null, // 8
    { kind: 'narration', text: "Neri can train Companion Vitality and reset discipline training through a completed barracks. The Archive's damaged records still need care." }, // 9
    null, // 10
    { kind: 'narration', text: "Lantern wraiths return after dark. Clearing this patrol does not make the shore safe on future nights." }, // 11
    null, // 12
    null, // 13
    null, // 14
    null, // 15
    { kind: 'narration', text: "The Ridge Tyrant's comforts come from Ironroot's wealth. As the Dark Lord's Master of Coin, he oversees wages and ore caravans." }, // 16
    null, // 17
    { kind: 'narration', text: "Ironroot's ore is processed into the regime's crowns at Stonecross. Guarded caravans carry the wealth away." }, // 18
    null, // 19
    { kind: 'narration', text: "Convoys, repair yards, guarded crossings: the occupation needs more than soldiers to keep its roads." }, // 20
    { kind: 'narration', text: "Eren is free of Abyss Bastion. Its dragon preparations were built for war, not ordinary travelers." }, // 21
    null, // 22
    { kind: 'narration', text: "People still repair and rebuild in Ashen Frontier despite the occupation. Its guarded roads carry both daily supplies and military convoys." }, // 23
    { kind: 'narration', text: "The civilian dragon landing behind Emberwatch offers passage toward Dark Crown. Abyss Bastion's dragons belong to the military project, not passenger travel." }, // 24
    null, // 25
    null, // 26
    null, // 27
    null, // 28
    { kind: 'narration', text: "Dark Crown's labor quarters, levies, and guarded roads keep its fortresses supplied. The regime is more than the Dark Lord's throne." }, // 29
    { kind: 'milestone', text: "FINAL APPROACH · Tovan and Vera are free · The Dark Lord waits beyond the fortress gate" }, // 30
  ];
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
