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
      id: 'C04',
      text: "Borin was forced to work on the Dark Lord’s still-unfinished winter retreat under the Lifebinder’s watch. Every skeleton the Lifebinder creates retains its identity.",
      es: "Borin fue obligado a trabajar en la residencia invernal del Dark Lord, todavía en obras y bajo la supervisión del Lifebinder. Todos sus esqueletos conservan su identidad.",
    }, // 4
    {
      kind: 'narration',
      id: 'C05',
      text: "The merchant wagon at the stand behind Millhaven goes to the Flooded Marches. That's the way out of Greenwood; the forest paths won't take you across regions.",
      es: "La carreta del paradero detrás de Millhaven va a Flooded Marches. Para salir de Greenwood hay que tomarla: los senderos del bosque no llevan a la siguiente región.",
    }, // 5
    {
      kind: 'narration',
      id: 'C06',
      text: "The Dark Lord is building a winter retreat for friends and future guests. The house is unfinished, but Thornfang and his wolves are already patrolling the wooded approaches.",
      es: "El Dark Lord construye una residencia invernal para recibir a amigos e invitados. La casa sigue en obras. Thornfang y sus lobos ya vigilan los accesos del bosque.",
    }, // 6
    null, // 7
    null, // 8
    {
      kind: 'narration',
      id: 'C09',
      text: "Neri is free. At a completed Barracks, consult her through Rescued Specialists for Preparation Tonics, Companion Vitality and discipline resets.",
      es: "Neri está libre. Puedes consultar sus tónicos de preparación, la vitalidad de los compañeros y los reinicios de disciplinas en Especialistas rescatados de un cuartel terminado.",
    }, // 9
    null, // 10
    {
      kind: 'narration',
      id: 'C11',
      text: "Two Lantern Wraiths have fallen, but they return at night. For a nighttime departure from the Marches, the Wraiths blocking the ferry must first be cleared.",
      es: "Han caído dos Lantern Wraiths, pero aparecen de nuevo por la noche. Para zarpar de las Marismas de noche, primero hay que despejar de Wraiths la salida del ferry.",
    }, // 11
    null, // 12
    null, // 13
    null, // 14
    null, // 15
    {
      kind: 'narration',
      id: 'C16',
      text: "Crag guards Ridge Tyrant's Treasury. Crown riders bunk near their armored direwolves' kennels. Treasury accounts record wages, stores and restrictions on workers.",
      es: "Crag custodia el Tesoro de Ridge Tyrant. Los jinetes duermen cerca de las perreras de sus lobos acorazados. Las cuentas registran salarios, provisiones y límites al personal.",
    }, // 16
    null, // 17
    {
      kind: 'narration',
      id: 'C18',
      text: "Silver and copper travel separately to Stonecross. The mint turns them into crowns bearing the Dark Lord’s portrait. Guards count the sealed crates before the wagons depart.",
      es: "Plata y cobre llegan por separado a Stonecross. La ceca acuña coronas con la imagen del Dark Lord. Los guardias cuentan las cajas selladas antes de partir.",
    }, // 18
    null, // 19
    {
      kind: 'narration',
      id: 'C20',
      text: "Supplies arrive with the convoy. Repair crews keep its wagons moving, and soldiers guard the ravine crossing on the way to the Ashen Warlord's checkpoint.",
      es: "El convoy trae suministros; las cuadrillas reparan las carretas y los soldados protegen el paso del barranco camino al puesto del Ashen Warlord.",
    }, // 20
    {
      kind: 'narration',
      id: 'C21',
      text: "Eren is free. At Abyss Bastion, dragons are being raised for a royal air force that does not yet exist. Veyrith fiercely defends the plan as the way to secure peace from above.",
      es: "Eren está libre. Abyss Bastion cría dragones para una fuerza aérea de la Corona que aún no existe. Veyrith defiende el proyecto: cree que dominar el cielo protegerá la paz.",
    }, // 21
    null, // 22
    {
      kind: 'narration',
      id: 'C23',
      text: "In the Ashen Frontier, families rebuild beside roads repaired by the occupying army. Trade moves along those roads under the Ashen Warlord's guards and inspector.",
      es: "En Ashen Frontier, las familias reconstruyen casas junto a caminos reparados por el ejército ocupante. Por allí circulan mercancías bajo control del Ashen Warlord y su inspector.",
    }, // 23
    {
      kind: 'narration',
      id: 'C24',
      text: "Behind Emberwatch, the civilian dragon landing offers passage to Dark Crown. Abyss Bastion's dragons belong to the military project, not the passenger route.",
      es: "Detrás de Emberwatch está el embarcadero de dragones civiles con servicio a Dark Crown. Los dragones de Abyss Bastion pertenecen al proyecto militar, no a esa ruta de pasajeros.",
    }, // 24
    null, // 25
    null, // 26
    null, // 27
    null, // 28
    {
      kind: 'narration',
      id: 'C29',
      text: "Rations enter Crownwatch under Cindermaw’s seal. The Crown also pays specialists drafted into service. The wages are real; refusing the assignment is another matter.",
      es: "Las raciones llegan a Crownwatch con el sello de Cindermaw. La Corona también paga a los especialistas reclutados a la fuerza. Cobrar no significa que puedan negarse.",
    }, // 29
    {
      kind: 'milestone',
      id: 'C30',
      text: "FINAL APPROACH · Tovan and Vera are free · The Dark Lord waits beyond the fortress gate",
      es: "TRAMO FINAL · Tovan y Vera están libres · El Dark Lord espera tras la puerta de la fortaleza",
    }, // 30
  ];
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
