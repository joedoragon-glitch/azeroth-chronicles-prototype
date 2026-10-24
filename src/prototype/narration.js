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

  // Locked transcription of the author's 24 October 2026 bilingual editorial master.
  // Never edit manuscript prose here without a replacement explicitly approved by the owner.
  lines.approved = Object.freeze({
    "C04": {
      "en": "Borin was forced to work on the Dark Lord’s still-unfinished winter retreat under the Lifebinder’s watch. Every skeleton the Lifebinder creates retains its identity.",
      "es": "Borin fue obligado a trabajar en la residencia invernal del Dark Lord, todavía en obras y bajo la supervisión del Lifebinder. Todos sus esqueletos conservan su identidad."
    },
    "C05": {
      "en": "The merchant wagon at the stand behind Millhaven goes to the Flooded Marches. That's the way out of Greenwood; the forest paths won't take you across regions.",
      "es": "La carreta del paradero detrás de Millhaven va a Flooded Marches. Para salir de Greenwood hay que tomarla: los senderos del bosque no llevan a la siguiente región."
    },
    "C06": {
      "en": "The Dark Lord is building a winter retreat for friends and future guests. The house is unfinished, but Thornfang and his wolves are already patrolling the wooded approaches.",
      "es": "El Dark Lord construye una residencia invernal para recibir a amigos e invitados. La casa sigue en obras. Thornfang y sus lobos ya vigilan los accesos del bosque."
    },
    "C09": {
      "en": "Neri is free. At a completed Barracks, consult her through Rescued Specialists for Preparation Tonics, Companion Vitality and discipline resets.",
      "es": "Neri está libre. Puedes consultar sus tónicos de preparación, la vitalidad de los compañeros y los reinicios de disciplinas en Especialistas rescatados de un cuartel terminado."
    },
    "C11": {
      "en": "Two Lantern Wraiths have fallen, but they return at night. For a nighttime departure from the Marches, the Wraiths blocking the ferry must first be cleared.",
      "es": "Han caído dos Lantern Wraiths, pero aparecen de nuevo por la noche. Para zarpar de las Marismas de noche, primero hay que despejar de Wraiths la salida del ferry."
    },
    "C16": {
      "en": "Crag guards Ridge Tyrant's Treasury. Crown riders bunk near their armored direwolves' kennels. Treasury accounts record wages, stores and restrictions on workers.",
      "es": "Crag custodia el Tesoro de Ridge Tyrant. Los jinetes duermen cerca de las perreras de sus lobos acorazados. Las cuentas registran salarios, provisiones y límites al personal."
    },
    "C18": {
      "en": "Silver and copper travel separately to Stonecross. The mint turns them into crowns bearing the Dark Lord’s portrait. Guards count the sealed crates before the wagons depart.",
      "es": "Plata y cobre llegan por separado a Stonecross. La ceca acuña coronas con la imagen del Dark Lord. Los guardias cuentan las cajas selladas antes de partir."
    },
    "C20": {
      "en": "Supplies arrive with the convoy. Repair crews keep its wagons moving, and soldiers guard the ravine crossing on the way to the Ashen Warlord's checkpoint.",
      "es": "El convoy trae suministros; las cuadrillas reparan las carretas y los soldados protegen el paso del barranco camino al puesto del Ashen Warlord."
    },
    "C21": {
      "en": "Eren is free. At Abyss Bastion, dragons are being raised for a royal air force that does not yet exist. Veyrith fiercely defends the plan as the way to secure peace from above.",
      "es": "Eren está libre. Abyss Bastion cría dragones para una fuerza aérea de la Corona que aún no existe. Veyrith defiende el proyecto: cree que dominar el cielo protegerá la paz."
    },
    "C23": {
      "en": "In the Ashen Frontier, families rebuild beside roads repaired by the occupying army. Trade moves along those roads under the Ashen Warlord's guards and inspector.",
      "es": "En Ashen Frontier, las familias reconstruyen casas junto a caminos reparados por el ejército ocupante. Por allí circulan mercancías bajo control del Ashen Warlord y su inspector."
    },
    "C24": {
      "en": "Behind Emberwatch, the civilian dragon landing offers passage to Dark Crown. Abyss Bastion's dragons belong to the military project, not the passenger route.",
      "es": "Detrás de Emberwatch está el embarcadero de dragones civiles con servicio a Dark Crown. Los dragones de Abyss Bastion pertenecen al proyecto militar, no a esa ruta de pasajeros."
    },
    "C29": {
      "en": "Rations enter Crownwatch under Cindermaw’s seal. The Crown also pays specialists drafted into service. The wages are real; refusing the assignment is another matter.",
      "es": "Las raciones llegan a Crownwatch con el sello de Cindermaw. La Corona también paga a los especialistas reclutados a la fuerza. Cobrar no significa que puedan negarse."
    },
    "C30": {
      "en": "FINAL APPROACH · Tovan and Vera are free · The Dark Lord waits beyond the fortress gate",
      "es": "TRAMO FINAL · Tovan y Vera están libres · El Dark Lord espera tras la puerta de la fortaleza"
    },
    "P01": {
      "en": "“My books are soaked. Neri knows how to preserve them, and I cannot do her work for her. Free her; then we can speak of keeping the Archive standing.”",
      "es": "«Mis libros están empapados. Neri sabe cómo conservarlos, y yo no puedo hacer su trabajo. Libérala; después hablaremos de cómo salvar el Archivo»."
    },
    "P02": {
      "en": "“Neri is free. Good. Give me your word that you will protect the Archive and let her restore the records by choice. In return, I will answer your questions as best I can.”",
      "es": "«Neri está libre. Bien. Dame tu palabra de que protegerás el Archivo y dejarás que ella restaure los libros por voluntad propia. A cambio, responderé tus preguntas lo mejor que pueda»."
    },
    "P03": {
      "en": "“Ask what you please. The books have survived the flooding so far; they can endure a few questions.”",
      "es": "«Pregunta lo que quieras. Los libros han resistido la inundación hasta ahora; también aguantarán unas cuantas preguntas»."
    },
    "P04": {
      "en": "“I came back because I chose to. The damp books still need work, and I know how to do it.” Neri turns toward the volumes. Her tonics and training remain available.",
      "es": "«He vuelto porque he querido. Esos libros siguen húmedos y todavía queda mucho por hacer. Sé cómo cuidarlos». Neri se vuelve hacia los volúmenes. Sigue ofreciendo sus tónicos y su entrenamiento."
    },
    "D01": {
      "en": "An old ossuary opens onto guest rooms still under construction. A building plan shows six places set at the winter table.",
      "es": "El antiguo osario da paso a habitaciones para invitados todavía sin terminar. En los planos de la residencia de invierno aparece una mesa con seis asientos."
    },
    "D02": {
      "en": "Garun's geometric mark appears on roads and settlements he helped design. At Colossus Mine, he inspects the Ogre wardens and structural supports; Ridge Tyrant handles the wages. Beyond the forge, small machines and angular ornaments fill Garun's workshop.",
      "es": "La marca geométrica de Garun aparece en caminos y asentamientos que ayudó a diseñar. En Colossus Mine, él inspecciona a los guardianes ogros y los soportes de la mina; Ridge Tyrant se encarga de los salarios. Más allá de la forja, el taller de Garun está lleno de máquinas pequeñas y adornos angulosos."
    },
    "D03": {
      "en": "Abyss Bastion is preparing equipment for dragon riders and maintains a hatchery for the planned royal air force. The launch platform is unfinished. Veyrith, the Dark Lord's purple personal mount, has no completed fleet to command yet.",
      "es": "Abyss Bastion prepara equipo para jinetes de dragones y dispone de un criadero destinado a la futura fuerza aérea de la Corona. La plataforma de lanzamiento sigue en obras. Veyrith, el dragón púrpura que sirve de montura al Dark Lord, aún no tiene una flota terminada que comandar."
    },
    "D04": {
      "en": "The Citadel of Ashes is Marshal Veyra’s academy and the headquarters of the Crown’s professional army. Its officers train soldiers from different peoples to follow the same drill. In Veyra’s quarters, parade uniform and cosmetics receive equally careful attention.",
      "es": "La Ciudadela de las Cenizas es la academia de la mariscal Veyra y el cuartel general del ejército profesional de la Corona. Sus oficiales instruyen a soldados de distintos pueblos en una misma disciplina. En los aposentos de Veyra, el uniforme de gala y los cosméticos reciben el mismo cuidado."
    },
    "I01": {
      "en": "These were once fruit cellars. Scornfang’s Goblin workers now have bedrolls, games and nests for their young here, having been displaced by the winter-estate project and the changes at the Crypt. Their preserves were bought with wages, not stolen.",
      "es": "Aquí se guardaba fruta para el invierno. Ahora duermen y se reúnen las familias goblin que trabajan para Scornfang, desplazadas por las obras de la residencia y los cambios en la Cripta. Hay nidos para sus crías y conservas que pagaron con sus salarios."
    },
    "I02": {
      "en": "The watchhouse is partly flooded. Reed Beasts nest above the waterline, among fish racks and piles of shells. They have made shelter of the old military building.",
      "es": "El antiguo puesto de vigilancia está inundado en parte. Las bestias del cañaveral anidan por encima del nivel del agua, entre secaderos de pescado y montones de conchas. El edificio les sirve de refugio."
    },
    "I03": {
      "en": "The Old Signal Keep is old, but its warning station still works. Ogre households gather around the hearth after their shifts. The mining gear is professional equipment, well maintained and supplied through the Crown; the stone seats and game table are theirs to use when work is done.",
      "es": "La fortaleza de señales es antigua, pero sigue funcionando. Las familias ogro se reúnen alrededor del fogón al terminar la jornada. Sus herramientas de minería son equipo profesional, bien mantenido y abastecido por la Corona. Los asientos de piedra y la mesa de juego tienen tanto uso como los puestos de trabajo."
    },
    "I04": {
      "en": "The Orcs use the old shrine as a barracks, yet they continue to care for its surviving ritual furniture. They cook, drill and play games around it. Among the papers here are memoranda bearing Scornfang’s name, suggesting someone beyond the Frontier has taken an interest in preserving the site.",
      "es": "Los orcos usan el antiguo santuario como cuartel, pero conservan y cuidan su mobiliario ritual. Cocinan, hacen prácticas militares y juegan junto a los objetos que quedan. Entre los papeles hay memorandos con el nombre de Scornfang: alguien de fuera de la región parece haberse interesado por conservar el lugar."
    },
    "I05": {
      "en": "The foundry's walls are damaged, but the forge is working. Crown soldiers eat and sleep near the repair benches, with weapons and equipment on racks between duties.",
      "es": "Las paredes de la fundición están dañadas, pero la forja sigue funcionando. Los soldados de la Corona comen y duermen junto a los bancos de reparación; entre sus tareas, dejan armas y equipo en los armeros."
    },
    "L01": {
      "en": "Bedrolls lie around the Goblin camp's cookfire. Crates, provisions and raiding supplies occupy the nearby shelter; the place is lived in between excursions.",
      "es": "Alrededor de la hoguera del campamento goblin hay mantas para dormir. Bajo el cobertizo guardan cajas, provisiones y objetos de sus incursiones. Aquí también viven cuando no están fuera."
    },
    "L02": {
      "en": "Muddy nests and wallows cover this bank. Tracks run between the water and feeding ground; the Mire creatures use the place as a home, not merely as an ambush point.",
      "es": "La orilla está llena de nidos y revolcaderos en el barro. Las huellas van del agua a los lugares donde se alimentan. Para las criaturas del pantano, esta ribera también es su hogar."
    },
    "L03": {
      "en": "Mining tools rest near the Ogre household's communal hearth. Stone seats face the fire, where the Ogres gather to eat when the work is done.",
      "es": "Las herramientas de minería quedan cerca del fogón comunal. Los asientos de piedra rodean el fuego, donde los ogros se reúnen para comer después del trabajo."
    },
    "K01": {
      "en": "My maps show the Marches' principal waterways. Mirejaw knows bends and shallow channels they do not. His mud slows pursuers and helps his wounds close. Reedport and Fisher Camp still fish outside his territory; not every boat answers to him.",
      "es": "Mis mapas recogen los principales canales de Flooded Marches. Mirejaw conoce recodos y pasos poco profundos que no aparecen en ellos. Su fango frena a los perseguidores y favorece su recuperación. Reedport y Fisher Camp siguen pescando fuera de sus dominios; no todas las barcas responden ante él."
    },
    "K02": {
      "en": "Ridge Tyrant can produce a figure for almost anything he argues: wages, repaired roads, minted crowns, caravans delivered. His title is Master of Coin; in practice, he directs the Crown’s economy and finances. Paying the specialists pressed into service was his proposal. They receive wages even when they cannot refuse the assignment. His contracted archers protect payrolls and mineral shipments, sometimes far beyond Ironroot. I keep copies of his accounts. One advantage of figures is that you can check them.",
      "es": "Ridge Tyrant siempre tiene una cifra a mano: salarios pagados, caminos reparados, coronas acuñadas, caravanas llegadas a destino. Es el Maestro de la Moneda, pero en la práctica dirige la economía y las finanzas de la Corona. Fue idea suya pagar también a los especialistas reclutados sin posibilidad de negarse. Sus arqueros contratados protegen las nóminas y los cargamentos de mineral, incluso lejos de Ironroot. Conservo copias de sus libros. Al menos las cifras permiten comprobar sus argumentos."
    },
    "K03": {
      "en": "Veyra guarded the coastal roads before joining our company. She trained Goblins, Ogres, Humans and other irregular troops to drill together, maintain their equipment and take pride in their uniforms. Even as marshal, she still trains Crown soldiers herself. She still practices cosmetology; in her view, something useful should also look right. Garun shares her interest in design. I have heard their conversations on workmanship and proportion at length. She is loyal to the Dark Lord and wary of politics. Yet if his throne stood empty, her officers and disciplined garrisons could put the provinces under her command. I doubt she would enjoy governing them; a military administration might nevertheless be the result.",
      "es": "Antes de viajar con nuestra compañía, Veyra vigilaba los caminos de la costa. Enseñó a goblins, ogros, humanos y otras tropas irregulares a marchar juntos, cuidar el equipo y llevar el uniforme con orgullo. Aun siendo mariscal, sigue instruyendo personalmente a soldados de la Corona. Sigue ejerciendo la cosmetología y sostiene que lo útil también debe tener buen aspecto. Garun comparte su interés por el diseño; he escuchado sus discusiones sobre materiales y proporciones durante horas. Es leal al Dark Lord y desconfía de la política. Si el trono quedara vacío, sus oficiales y guarniciones disciplinadas podrían poner las provincias a sus órdenes. Dudo que disfrutara gobernándolas; aun así, podría terminar imponiéndose una administración militar."
    },
    "K04": {
      "en": "The Dark Lord appointed Cindermaw because he could organize Ash beasts and administer territory. Crownwatch, Ash Refuge, the Ruined Foundry, roads and supply lines fall under his ministry. These services provide food and shelter and employ paid workers. Some specialists serve by conscription, not choice. Cindermaw co-manages the Treasury with Dreadmaw, who guards its Inner Vault. The Treasury accounts record Vera’s wages as Master Smith and the restrictions imposed on her while captive. Those wages did not give her permission to leave.",
      "es": "El Dark Lord nombró a Cindermaw por su capacidad para organizar a las bestias de ceniza y administrar territorios. Crownwatch, Ash Refuge, la Fundición en Ruinas, las carreteras y los suministros dependen de su ministerio. Estos servicios proporcionan alimentos y alojamiento y emplean personal remunerado. Algunos especialistas sirven por reclutamiento forzoso, no por elección propia. Cindermaw comparte la administración del Tesoro con Dreadmaw, guardián de la cámara interior. Las cuentas del Tesoro registran el sueldo de Vera como maestra herrera y las restricciones que le impusieron durante su cautiverio. Cobrar no le daba permiso para marcharse."
    },
    "K05": {
      "en": "My records list fish shipments from Reedport, wages paid in Ironroot, Crown taxes and guarded transfers of specialists conscripted into paid service. All travel along the roads the Crown maintains.",
      "es": "Mis registros incluyen envíos de pescado desde Reedport, salarios pagados en Ironroot, impuestos de la Corona y traslados custodiados de especialistas reclutados a la fuerza, aunque reciban sueldo. Todo pasa por los caminos que mantiene la Corona."
    },
    "K06": {
      "en": "The Lantern Wraiths left Ironroot when the mines and mint became intolerable to them. They study and help with my records now, and I still remind them to watch their lanterns. They are none too pleased with the flood, whose cause I cannot explain. I am glad they have friends outside these shelves. Cindermaw and Dreadmaw are fond of them, and they return that affection. They visit when duty allows.",
      "es": "Los Lantern Wraiths dejaron Ironroot porque ya no soportaban las minas ni la casa de moneda. Ahora estudian en el Archivo y me ayudan con los registros. Todavía tengo que recordarles que vigilen sus faroles. La inundación les desagrada tanto como a mí, aunque sigo sin saber qué la causó. Me alegra que tengan amigos fuera de estos estantes. Cindermaw y Dreadmaw les tienen cariño, y el afecto es mutuo; se visitan cuando sus obligaciones lo permiten."
    },
    "K07": {
      "en": "Thornfang trained as a Crown wilderness scout in professional canine handling, recall, scent work and pack welfare. He patrols the approaches to the Dark Lord's winter estate. Mira has accompanied these patrols as a paid instructor, though her service came without the freedom to leave. When a fight breaks off, he leads his pack toward the den. His tracks remain visible along the woodland paths.",
      "es": "Thornfang fue explorador de la Corona y recibió formación en manejo de cánidos, respuesta a la llamada, trabajo olfativo y bienestar de la manada. Patrulla los accesos a la residencia invernal del Dark Lord. Mira ha acompañado estas patrullas como instructora remunerada, aunque no tenía libertad para marcharse. Si abandona un combate, conduce a los suyos hacia la guarida. Sus huellas siguen marcadas en los senderos."
    },
    "K08": {
      "en": "The Lifebinder and I traveled with the Dark Lord long before these garrisons. His work combines mortuary science and thanatology with the conservation and reuse of buildings. His skeletons endure and remain aware; they are not living people restored to life. I refuse to confuse the two, particularly when I record their names and allegiances. The Lifebinder’s bindings sustain work on the still-unfinished winter estate; Borin was compelled to contribute to its construction.",
      "es": "El Lifebinder y yo viajamos con el Dark Lord mucho antes de estas guarniciones. Su oficio reúne ciencias mortuorias y tanatología con conservación y reutilización de edificios. Sus esqueletos perduran y conservan la conciencia; no son personas devueltas a la vida. Me niego a confundir ambas cosas, sobre todo al registrar sus nombres y lealtades. Las ataduras del Lifebinder sostienen las obras de la residencia invernal, todavía inconclusa; Borin fue obligado a participar en su construcción."
    },
    "K09": {
      "en": "I belonged to the Dark Lord’s traveling company before I settled in the Archive. These days I keep records, sit on the council and fish when my duties allow. I drowned long ago; that is how I came by my name. The flooding of these shelves is a later calamity, and its cause remains unknown to me. Neri knows what can be done to preserve the damaged books.",
      "es": "Viajé con la antigua compañía del Dark Lord antes de instalarme en el Archivo. Ahora llevo los registros, participo en el consejo y, cuando las obligaciones me dejan, voy a pescar. Me ahogué hace muchos años; de ahí viene mi nombre. La inundación que amenaza estos libros ocurrió mucho después y todavía desconozco su causa. Neri sabe cómo conservar los volúmenes dañados."
    },
    "K10": {
      "en": "I knew Garun the Firstborn as our Ogre Bastion. During one expedition he held a collapsing mountain gate long enough to save the company. Garun has designed roads, bridges and fortresses, but perhaps his most remarkable work was himself. He designed his own stone body, fitted around a luminous heartstone, with golden eyes, an angular shell and a separate diamond core. All his own work. He would still rather inspect a bridge than endure another council meeting about construction.\nAt Colossus Mine, Ogre wardens and Crown riders on armored direwolves guard the site; the riders' bunks and their mounts' kennels share the working quarters. Ridge Tyrant, his captain and the crews manage the Mine’s accounts, wages and daily production. Garun is well paid, though the Mine has expenses he must meet. He spends spare crowns on little machines, strange ornaments and architectural experiments. I confess I enjoy seeing what he brings back.\nThe Mine’s records show fair payment for Dara’s repairs and unusual commissions, alongside the limited movement she could negotiate and Garun’s power to deny her departure while captive. Garun trusts the Dark Lord and is comfortable here; the Mine is his workshop and refuge as much as his post. Should the throne stand empty, the roads, strongholds and labor under his control could make him powerful. I suspect he would try to keep people safe by directing their movement. Whether they would welcome such protection is another matter.",
      "es": "Conocí a Garun el Primogénito como nuestro Bastión ogro. Durante una expedición sostuvo una puerta de montaña que se venía abajo el tiempo suficiente para salvar a la compañía. Garun ha diseñado caminos, puentes y fortalezas, pero quizás su obra más extraordinaria fue su propio cuerpo. Lo diseñó en piedra, con las piezas ensambladas alrededor de una piedra del corazón luminosa, ojos dorados, una coraza angulosa y un núcleo de diamante independiente. Todo obra suya. Todavía prefiere inspeccionar un puente antes que soportar otra sesión del consejo sobre obras.\nEn Colossus Mine, guardianes ogros y jinetes de la Corona montados en lobos terribles acorazados custodian el recinto. Los dormitorios de los jinetes y las perreras de sus monturas comparten las dependencias de trabajo. Ridge Tyrant, su capitán y las cuadrillas se encargan de las cuentas, los salarios y la producción diaria de la mina. Garun cobra bien, aunque también debe afrontar los gastos de la mina. Gasta las coronas que le sobran en pequeñas máquinas, adornos extraños y experimentos arquitectónicos. Confieso que disfruto viendo lo que trae.\nLas cuentas de la mina muestran los pagos justos por las reparaciones y los encargos de Dara, junto con la libertad de movimiento limitada que podía negociar y la facultad de Garun de impedirle salir durante su cautiverio. Garun confía en el Dark Lord y se encuentra cómodo aquí; la mina es tanto su taller y refugio como su destino. Si el trono quedara vacío, sus caminos, fortalezas y trabajadores podrían darle un poder considerable. Sospecho que intentaría proteger a la gente decidiendo por dónde puede moverse. Otra cuestión sería si esa protección le resultaría bienvenida a quienes la reciben."
    },
    "K11": {
      "en": "The Ashen Warlord commands the Orc warbands occupying the Frontier. Reports arriving here describe repaired crossings, supplied checkpoints and caravans reaching Emberwatch again. His patrols inspect the roads, collect Crown taxes and enforce military orders in occupied settlements. Work is paid; specialists recruited by force cannot simply walk away from their posts. Cinder Warlord inspects those routes for him. The approaches to Abyss Bastion’s unfinished air works remain guarded. Trade has resumed under military supervision.",
      "es": "El Ashen Warlord dirige las bandas orcas que ocupan la Frontera. Los informes que llegan al Archivo hablan de pasos reparados, puestos abastecidos y caravanas que vuelven a Emberwatch. Sus patrullas inspeccionan los caminos, recaudan impuestos de la Corona y hacen cumplir las órdenes militares en los asentamientos ocupados. El trabajo se paga, pero los especialistas reclutados a la fuerza no pueden abandonar su puesto sin más. Cinder Warlord inspecciona las rutas en su nombre. Los accesos a las obras aéreas de Abyss Bastion siguen vigilados. El comercio ha vuelto, bajo mando militar."
    },
    "K12": {
      "en": "I remember Veyrith carrying the Dark Lord during our travels: a purple dragon, proud, disciplined and loyal. I see no reason to think the years have made him less so. He defends the proposed royal air force fiercely, convinced that control of the sky can secure the peace below. The hatchery, harness stations and launch platform at Abyss Bastion are being prepared for that purpose. The platform is unfinished, and there is no completed fleet yet.",
      "es": "Recuerdo a Veyrith llevando al Dark Lord en nuestros viajes: un dragón púrpura, orgulloso, disciplinado y leal. No encuentro motivos para pensar que los años le hayan cambiado el carácter. Defiende con firmeza la futura fuerza aérea de la Corona, convencido de que dominar el cielo puede proteger la paz en tierra. Con ese fin se preparan el criadero de dragones, los puestos de arneses y la plataforma de lanzamiento de Abyss Bastion. La plataforma sigue en obras y la flota todavía no existe."
    },
    "K13": {
      "en": "I traveled with the Dark Lord through victories that some towns celebrated and others mourned. There came a day when the last command from outside never received a successor. He made his own decisions then. Rival peoples began trading under his peace, and Crown roads now link more of the realm. Those roads also carry soldiers, tax revenues and specialists pressed into paid service.\nHe says, ‘Freedom has a price.’ I wrote that down. The accounts record wages for posts whose occupants cannot freely refuse the assignment.",
      "es": "Viajé con el Dark Lord en campañas que unas aldeas celebraron y otras lloraron. Llegó un día en que dejaron de recibirse órdenes de fuera. Desde entonces tomó sus propias decisiones. Pueblos antes enfrentados empezaron a comerciar bajo su paz y los caminos de la Corona hoy conectan más lugares. Por esos caminos también circulan soldados, recaudaciones de impuestos y especialistas incorporados al servicio por la fuerza, aunque reciban sueldo.\nÉl dice: «La libertad tiene un precio». Lo anoté. En los libros constan los salarios de quienes no pueden elegir libremente si aceptan el puesto."
    },
    "R01": {
      "en": "My Greenwood records begin with Millhaven, Orchard Hamlet and the working mill, among farms and woodland roads. At the Forest Crypt, the Lifebinder—one of my old companions—oversees the Dark Lord’s unfinished winter residence. He works with skeletons who endure and remain aware, although they are not alive again. Every skeleton retains an identity; some still use their former names and loyalties.",
      "es": "Mis registros de Greenwood comienzan en Millhaven, Orchard Hamlet y el molino, entre tierras de cultivo y caminos del bosque. En Forest Crypt, el Lifebinder —que viajó conmigo hace años— supervisa la residencia de invierno del Dark Lord, todavía inconclusa. Trabaja con esqueletos que perduran y conservan la conciencia, aunque no han vuelto a la vida. Todos conservan su identidad; algunos mantienen sus nombres y lealtades de antes."
    },
    "R02": {
      "en": "The Dark Lord seized Ironroot's silver-bearing and copper-bearing mountains long ago. Quarry Outpost retains its old name, though its workings now sort the ore sent to Stonecross. Silver and copper move separately under guard; the mint strikes crowns with the Dark Lord's portrait, and the Master of Coin records the wages and shipments. I compare incoming ore with the mint's output. Some residents welcome the reliable work. Others resent Crown ownership. Away from the roads, wolves hunt while Ogre households cook, work stone and gather at their hearths.",
      "es": "Hace mucho que el Dark Lord se apoderó de las montañas de Ironroot que contienen plata y cobre. Quarry Outpost conserva su antiguo nombre, aunque sus explotaciones clasifican el mineral que llega a Stonecross. La plata y el cobre viajan por separado, bajo escolta; la ceca acuña coronas con el retrato del Dark Lord y el Maestro de la Moneda registra salarios y cargamentos. Yo cotejo las cargas con la producción de la ceca. Hay habitantes que agradecen el trabajo estable; otros rechazan que las montañas pertenezcan a la Corona. Lejos de los caminos cazan los lobos, mientras las familias ogro cocinan, trabajan la piedra y se reúnen junto al fuego."
    },
    "R03": {
      "en": "Reports from the Ashen Frontier describe red poppies on disturbed earth and pale-trunk saplings rising among cooled ash and old blast scars. Gardens are returning beside damaged walls; the ravine and old battle sites remain scarred. Emberwatch and Burned Hamlet rebuild under the Warlord’s rule. The repaired crossings carry food and trade, while inspections and taxes remain enforced. Specialists pressed into Crown service receive wages, but cannot refuse their appointments. The Ruined Shrine barracks, the forts, the night Stalkers’ hold and the guarded route to Abyss Bastion remain parts of that occupation.",
      "es": "Los informes de Ashen Frontier mencionan amapolas rojas en tierra removida y árboles jóvenes, de tronco claro, entre la ceniza fría y las marcas de antiguas explosiones. Hay huertos junto a muros dañados; el barranco y los viejos campos de batalla siguen mostrando las heridas. Emberwatch y Burned Hamlet se reconstruyen bajo el gobierno del Warlord. Por los pasos reparados circulan comida y mercancías; siguen las inspecciones y los impuestos. Los especialistas reclutados a la fuerza reciben salario, pero no pueden rechazar su destino. El cuartel de Ruined Shrine, los fuertes, el refugio de los Stalkers nocturnos y la ruta vigilada a Abyss Bastion pertenecen a la misma ocupación."
    },
    "R04": {
      "en": "Crownwatch maintains homes, guarded transport and roads. The Citadel, Cindermaw's ministry and the barracks enforce Crown authority. Near the lava channels, heat exchangers and insulated flues carry volcanic warmth to glass and ceramic kilns, drying rooms, public baths and rooms used in winter. The Ruined Foundry and the fortress roads employ paid crews. At the Crystal Deposit, workers extract valuable crystals and prepare them for shipment. These are all part of the Crown's functioning economy. The records also list taxes and wages paid to specialists conscripted into posts they cannot refuse.",
      "es": "Crownwatch mantiene viviendas, transporte vigilado y caminos. La Ciudadela, el ministerio de Cindermaw y los cuarteles hacen cumplir la autoridad de la Corona. Cerca de los cauces de lava, intercambiadores y conductos aislados llevan calor a hornos de vidrio y cerámica, secaderos, baños públicos y salas usadas en invierno. La Fundición en Ruinas y los caminos de la fortaleza emplean cuadrillas remuneradas. En el Yacimiento de Cristales, los trabajadores extraen cristales valiosos y preparan los cargamentos. Todo forma parte de la economía de la Corona. Los registros consignan también impuestos y salarios de especialistas reclutados a la fuerza para puestos que no pueden rechazar."
    },
    "R05": {
      "en": "Reedport and Fisher Camp live by fishing, while Mirejaw, Reed Beasts and night Wraiths occupy their own parts of Flooded Marches. I keep the Archive's records and serve on the council; I fish when my duties allow. I drowned long before the flood now threatening these shelves, and I still do not know what caused the later disaster. Neri can preserve the damaged books; those removed from the water and the supplies outside show how much work remains.",
      "es": "En Reedport y Fisher Camp se vive de la pesca; Mirejaw, las bestias del cañaveral y los Wraiths nocturnos ocupan otras zonas de Flooded Marches. Llevo los registros del Archivo y formo parte del consejo; también pesco cuando mis obligaciones me lo permiten. Me ahogué mucho antes de la inundación que hoy amenaza estos estantes, y todavía desconozco su causa. Neri puede conservar los libros dañados; los volúmenes sacados y los materiales de restauración del exterior muestran cuánto queda por hacer."
    },
    "P05": {
      "en": "“You have read my seal. I proposed capturing the specialists; I will not pretend otherwise. When the lower shelves flooded, I exchanged another captive for Neri's help preserving the books. Protect these records, and I will share what I know.”",
      "es": "«Has visto mi sello. Yo propuse capturar a los especialistas, y no pienso negarlo. Cuando se inundaron los estantes inferiores, entregué a otro cautivo a cambio de la ayuda de Neri para salvar los libros. Protege estos registros y compartiré contigo lo que sé»."
    },
    "P06": {
      "en": "“Proposal: Take the land’s specialists into our custody. This recommendation is mine.\nLater entry: I have exchanged another captive for Neri. Her knowledge is needed to preserve the water-damaged records.\n— Drowned Keeper”",
      "es": "«Propuesta: poner bajo nuestra custodia a los especialistas del territorio. Esta recomendación es mía.\nAnotación posterior: he entregado a otro cautivo a cambio de Neri. Necesitamos su experiencia para conservar los registros dañados por el agua.\n— Drowned Keeper»"
    },
    "P07": {
      "en": "“I have Preparation Tonics and teach Ranger field support. Tell me what you need before you leave.”",
      "es": "«Tengo tónicos de preparación y enseño técnicas de apoyo a los exploradores. Dime qué necesitas antes de partir»."
    },
    "M01": {
      "en": "Seven marks are cut into the throne: one for the ruler and six for the companions who traveled beside him. Your hand fits the last. You recognize the mark of your old company. You were its missing sixth companion.",
      "es": "Siete marcas están talladas en el trono: una del gobernante y seis de sus antiguos compañeros. Tu mano encaja en la última. Reconoces la señal de tu vieja compañía. Eras el sexto integrante que faltaba."
    },
    "M02": {
      "en": "At last, you can rest. The Crown is yours, and the war is over.",
      "es": "Por fin puedes descansar. La Corona es tuya y la guerra ha terminado."
    },
    "M03": {
      "en": "THE OLD WAR IS OVER\nThe creatures return to their homes.\nSo I Became the Dark Lord’s Problem\nThank you for playing.",
      "es": "LA ANTIGUA GUERRA HA TERMINADO\nLas criaturas regresan a sus hogares.\nSo I Became the Dark Lord’s Problem\nGracias por jugar."
    },
    "R05_append": {
      "en": "You have read the document bearing my seal. I proposed capturing the specialists, and I exchanged another captive for Neri’s work in this Archive.",
      "es": "Has leído el documento con mi sello. Yo propuse capturar a los especialistas y entregué a otro cautivo a cambio del trabajo de Neri en este Archivo."
    },
    "P07_nomana": {
      "en": "“I have Preparation Tonics. I can train your Rangers' healing support, strengthen companion vitality and help you reset spent discipline points. The prices and limits are on the service list.”",
      "es": "«Tengo tónicos de preparación. Puedo mejorar las habilidades de curación de tus exploradores, fortalecer la vitalidad de los compañeros y ayudarte a reiniciar puntos de disciplina ya gastados. Los precios y límites están en la lista de servicios»."
    },
    "Throne_Keeper": {
      "en": "I kept a record of the last command our company received from outside. The seven marks on the throne belong to the Dark Lord and the six companions who traveled with him. One of those marks is yours.",
      "es": "Conservé un registro de la última orden que recibió nuestra compañía desde fuera. Las siete marcas del trono corresponden al Dark Lord y a los seis compañeros que viajamos con él. Una de esas marcas te pertenece."
    },
    "D04_entrance": {
      "en": "The Citadel of Ashes is Marshal Veyra’s academy and the headquarters of the Crown’s professional army. Its officers train soldiers from different peoples to follow the same drill.",
      "es": "La Ciudadela de las Cenizas es la academia de la mariscal Veyra y el cuartel general del ejército profesional de la Corona. Sus oficiales instruyen a soldados de distintos pueblos en una misma disciplina."
    }
  });
  if (typeof module !== 'undefined') module.exports = lines;
  else root.PrototypeNarration = lines;
})(typeof window !== 'undefined' ? window : globalThis);
