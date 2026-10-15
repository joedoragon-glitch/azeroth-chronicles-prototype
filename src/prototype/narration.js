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
      text: 'Borin found six signatures beneath “Victory” in an old ledger. The Lifebinder’s skeleton workers remembered their lives. Borin built the winter house because he had to.',
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
      text: 'Crag kept the Treasury for Ridge Tyrant. Crown riders tended their direwolves beside the barracks. The account books also recorded who was allowed to leave.',
    }, // 16
    null, // 17
    {
      kind: 'narration',
      text: 'Silver and copper arrive separately at Stonecross. They leave as crowns stamped with the Dark Lord’s face, while armed guards count the sealed crates.',
    }, // 18
    null, // 19
    {
      kind: 'narration',
      text: 'Now the checkpoint makes sense. The convoy brings supplies, the repair yards keep wagons rolling, and the guards hold the crossing.',
    }, // 20
    {
      kind: 'narration',
      text: 'Eren is free. The dragons bred at Abyss Bastion are meant for an army. Veyrith, the loyal Air Marshal, believes aerial supremacy will secure lasting peace.',
    }, // 21
    null, // 22
    {
      kind: 'narration',
      text: 'The repaired roads serve villagers and soldiers alike. The Ashen Warlord commands the occupation; his inspector still counts every wagon.',
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
      text: 'Rations arrive under Cindermaw’s seal. Levies leave under armed guard. Crownwatch calls both deliveries.',
    }, // 29
    {
      kind: 'milestone',
      text: 'FINAL APPROACH · Tovan and Vera are free · The Dark Lord waits beyond the fortress gate',
    }, // 30
  ];
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
