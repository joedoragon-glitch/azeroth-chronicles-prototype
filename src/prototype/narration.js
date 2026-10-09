/* Authored quest payoff copy; separated from visual-canon source tables. */
(function (root) {
  'use strict';
  // Stable quest-0 through quest-29 order. No state, XP or quest mechanics here.
  const lines = [
    "With Mira free, Greenwood gains back a teacher. Thornfang's defeat has opened a path home.",
    "Fewer raiders trouble the mill road for now. Greenwood's farms still need watching.",
    "Thornfang's Treasury held more than a wolf could use. These stolen stores belong beyond his den.",
    "The Forest Crypt was built for a retreat, not a prison. Borin's escape spoils the Guardian's hospitality.",
    'From the mill bridge to the wagon stand, Millhaven has a road to the wider world. Keeping it open is another matter.',
    "Farms, creature territories, and hidden paths all belong to Greenwood's daily life, whatever its distant ruler claims.",
    'Mirejaw can no longer keep Sela captive. The marsh remains dangerous, but one prisoner is going home.',
    'Several threats have fallen along the causeways. The reeds still make it hard to see what lies ahead.',
    'Neri leaves the Sunken Archive alive. Its threatened records remain, and saving them will take a different kind of work.',
    "Behind Mirejaw's guarded hoard are ordinary provisions. In the Marches, even a supply crate is worth a fight.",
    'Lantern shore grows quiet again. The wraiths are gone for now; night will return.',
    'Raised roads, fishing camps, and flooded ruins shape this region. There is more to the Marches than the main road.',
    "Orin is free of the Ridge Tyrant's grasp. The mountain's ore still travels through the regime's hands.",
    'The quarry route has fewer dangers for a while. Stonecross still depends on the work that travels it.',
    "Dara is leaving the Colossus Mine behind. A smith's tools can serve different hands once the chains are gone.",
    'The Ridge Tyrant kept a comfortable reserve. Ironroot has been profitable for someone.',
    'Wolves, ogres, miners, and caravan crews all have a place in Ironroot. No single title explains a mountain.',
    "Stonecross's ore leaves the mountain by caravan. The Dark Lord's wealth has a very ordinary beginning.",
    "Lyss is free of the Ashen Warlord's checkpoint. The occupied road remains scarred by the machinery around it.",
    'Convoys, repair yards, guarded crossings: the occupation needs more than soldiers to keep its roads.',
    'Eren is free of Abyss Bastion. Its dragon preparations were built for war, not ordinary travelers.',
    'The Frontier road has fewer enemies for now. Its barricades and inspection posts still tell you who holds it.',
    'The Frontier is not only ruins. Repair work and everyday life persist beside the scars of occupation.',
    'Behind Emberwatch, the civilian dragon landing offers a very different journey from the military aerie.',
    'Tovan is free of the Ash Sentinel. Even in Dark Crown, the regime cannot keep every teacher silent.',
    'The approach remains hostile despite your victories. Dark Crown is defended in layers.',
    "Vera is free of Cindermaw's holding. Even the regime's heartland has smiths who never chose their masters.",
    "Cindermaw's Treasury is another guarded storehouse. Even at the seat of power, supplies have to come from somewhere.",
    'From labor quarters to siege works, Dark Crown is an organized machine. Its roads keep the fortress supplied.',
    'The fortress gate rises ahead. Tovan and Vera are free, but the Dark Lord still waits beyond it.',
  ];
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
