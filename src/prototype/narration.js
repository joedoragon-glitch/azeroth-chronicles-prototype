/* Authored regional quest payoffs, independent of the world/visual canon. */
(function (root) {
  'use strict';
  // 1-based review numbers match quest-0 through quest-29; null means no announcement.
  // Every quest still finishes and pays automatically, including those without a card.
  const lines = [
    null, // 1
    null, // 2
    null, // 3
    {
      kind: 'narration',
      text: "The Dark Lord wanted a woodland retreat. The Crypt Guardian supervised construction, and Borin wasn't exactly there by choice.",
    }, // 4
    {
      kind: 'narration',
      text: "When you're ready for the Flooded Marches, take the merchant wagon behind Millhaven. Walking won't get you across regions.",
    }, // 5
    {
      kind: 'narration',
      text: 'On paper, Greenwood belongs to the Dark Lord. The wolves seem to have missed that announcement.',
    }, // 6
    null, // 7
    null, // 8
    {
      kind: 'narration',
      text: 'Neri is now available through Rescued Specialists at a completed barracks. Ask her about Preparation Tonics, Companion Vitality, or discipline resets.',
    }, // 9
    null, // 10
    {
      kind: 'narration',
      text: "Two wraiths down. Don't mistake that for a safe shoreline—Lantern wraiths return after dark.",
    }, // 11
    null, // 12
    null, // 13
    null, // 14
    null, // 15
    {
      kind: 'narration',
      text: "The Dark Lord's Master of Coin lives rather comfortably. The Ridge Tyrant controls Ironroot's wages and caravans—and it shows.",
    }, // 16
    null, // 17
    {
      kind: 'narration',
      text: "So that's where the crowns come from. The ore goes to Stonecross; the finished crowns leave by guarded caravan.",
    }, // 18
    null, // 19
    {
      kind: 'narration',
      text: 'Now the checkpoint makes sense. The convoy brings supplies, the repair yards keep wagons rolling, and the guards hold the crossing.',
    }, // 20
    {
      kind: 'narration',
      text: 'Eren is free. The dragons bred at Abyss Bastion are meant for an army. The Dark Lord has plans beyond his own mount.',
    }, // 21
    null, // 22
    {
      kind: 'narration',
      text: 'People are patching up homes in the Frontier while the army keeps its convoys moving. Same roads, very different priorities.',
    }, // 23
    {
      kind: 'narration',
      text: "For a ride to Dark Crown, head behind Emberwatch to the civilian dragon landing. Abyss Bastion's dragons aren't taking passengers.",
    }, // 24
    null, // 25
    null, // 26
    null, // 27
    null, // 28
    {
      kind: 'narration',
      text: "The fortress doesn't run itself. Someone has to collect the levies, move the supplies, and keep the roads guarded.",
    }, // 29
    {
      kind: 'milestone',
      text: 'FINAL APPROACH · Tovan and Vera are free · The Dark Lord waits beyond the fortress gate',
    }, // 30
  ];
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
