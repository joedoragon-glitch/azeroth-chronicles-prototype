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
      text: 'Crownwatch collects the levies. Guarded wagons carry tribute and supplies toward the fortress and its siege works.',
    }, // 29
    {
      kind: 'milestone',
      text: 'FINAL APPROACH · Tovan and Vera are free · The Dark Lord waits beyond the fortress gate',
    }, // 30
  ];
  // Authorial boss and dungeon-entry text sits with other narration. The underlying
  // simulation, balance and performance-protected content tables remain untouched.
  const Data = typeof PrototypeData !== 'undefined' ? PrototypeData : require('./data.js'),
    Rules = typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js');
  const sentinel = Data.bosses.find((boss) => boss.id === 'citadel');
  sentinel.history =
    "Marshal Veyra was a coastal road warden and practicing cosmetologist who joined the former hero as a regimental drillmaster. She made goblin, ogre, human and other irregular fighters into the Dark Lord's professional standing army, with ranks, shared drills, discipline, uniforms and officers. Veyra has exacting opinions on grooming, architecture and the appearance of military equipment: functional work should also be beautiful. The Stone Colossus is her good friend, and both enjoy discussing workmanship and proportion. She loyally serves the Dark Lord and dreads politics, believing she could not govern better than he does. Yet her officers and garrisons could support her as a military dictator who rules the five regions as one giant barracks.";
  sentinel.attacks = [
    'Microdermabrasion: nine short-range canister fragments spray in a warned fan.',
    'Dress Ranks: Crown soldiers pivot into a protective formation for five seconds.',
    'Deep-Tissue Contouring: five damaging charges trace a fixed clockwise route telegraphed in full.',
    'Fractional Resurfacing: a 4-by-4 square grid keeps pulsing during other attacks until the Sentinel falls.',
    'Volumize: replenishes Crown soldiers; TRUE form reinforces the elite warband.',
  ];
  Object.assign(Rules.attacks.citadel[0], {
    kind: 'canister',
    warning: 1.6,
    recovery: 1.5,
    opening: 0,
  });
  Object.assign(Rules.attacks.citadel[1], {
    kind: 'formation',
    warning: 1.8,
    recovery: 1.6,
    count: 1,
    manaDrain: 0,
  });
  Object.assign(Rules.attacks.citadel[2], {
    kind: 'pattern-charge',
    warning: 2.6,
    recovery: 2.5,
    charge: true,
    advance: false,
    opening: 0,
    coefficient: 1,
  });
  Object.assign(Rules.attacks.citadel[3], {
    kind: 'checkerboard',
    warning: 2.2,
    recovery: 1.2,
    count: 1,
    sequential: false,
    persistent: false,
    manaDrain: 0,
  });

  Rules.dungeonLore.citadel =
    "The Citadel of Ashes is Marshal Veyra's academy and the headquarters of the Dark Lord's professional army. Its officers turn diverse irregulars into regiments. Her private quarters hold polished mirrors, cosmetic brushes and carefully arranged complexion jars beside her parade uniform.";
  if (!Rules.dungeonDecor.citadel.some((row) => row[2] === 'citadel-vanity-quarters'))
    Rules.dungeonDecor.citadel.push([1080, 1280, 'citadel-vanity-quarters']);
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
