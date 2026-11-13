> **Actualización de menús, PR #800 — integrada y publicada:** La nueva ruta es Nueva partida → Nueva aventura (Normal y recuperación estándar por defecto, Sucesión opcional) → Elegir héroe. Se mantienen las cuatro clases, el nombre opcional y la confirmación antes de reemplazar una partida. Ayuda agrupa primeros pasos, combate, partidas, problemas y créditos; las herramientas técnicas quedan dentro de Problemas. La integración, las pruebas automatizadas y la publicación están verificadas; la aceptación física en el iPhone Air sigue pendiente. Consulta el estado de publicación en docs/DEVELOPMENT_STATE.md.

# Guía del juego en español

**¡Sí, puedes jugar en español a So I Became the Dark Lord's Problem!** El juego tiene una opción de idioma español que puedes elegir antes de crear tu personaje o activar después, sin empezar otra partida.

**[Jugar en el navegador o Chromebook](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/)** · **[Jugar en el teléfono](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)**

La traducción es **parcial**: los menús, controles y muchas explicaciones están en español, pero todavía puedes encontrar nombres, textos y partes de la historia en inglés. Esta guía está pensada para ayudarte a jugar y entender el proyecto aunque no leas inglés.

**Ir directamente a:** [Ponerlo en español](#cómo-poner-el-juego-en-español) · [De qué trata](#de-qué-trata-el-juego) · [Empezar a jugar](#tus-primeros-pasos) · [Controles](#controles-básicos) · [Guardar](#guardar-y-actualizar) · [Entender GitHub](#si-llegaste-desde-github).

> **Nota sobre el borrador v0.9.2 (PR #868, todavía sin publicar):** La selección de personajes distinguirá al **Paladín**, la **Maga**, el **Explorador** y la **Pícara** mediante descripciones más completas. Las referencias a quien juega se redactarán con naturalidad y sin presuponer su género: «tu personaje», «elige», «consulta» o «te». Esto no cambia la identidad de los personajes ficticios: Veyra sigue siendo **la mariscal**, y Mira, Sela, Neri, Dara, Lyss y Vera son mujeres. El Drowned Keeper sigue siendo un personaje masculino y sus recuerdos conservan la primera persona. Estas mejoras aún no describen una actualización publicada.\n\n## Cómo poner el juego en español

**Si empiezas una partida nueva:**

1. Abre uno de los enlaces para jugar de arriba.
2. En la pantalla principal, pulsa **New Game / Nueva partida**.
3. Selecciona el modo de partida. Después aparece **Choose your language / Elige tu idioma**.
4. Pulsa **Español** y continúa con la selección de clase.

**Si ya tienes una partida o quieres cambiar el idioma sin empezar de nuevo:** desde la pantalla principal, abre **Ajustes → Idioma → Español**. Si estás jugando, abre **Menú → Juego y ajustes → Idioma → Español**. En una pantalla que todavía esté en inglés, busca **Settings** o **Game and settings → Language · English**.

El idioma elegido queda guardado como una **preferencia del navegador/dispositivo**; no cambia tus avances ni necesita una partida diferente. El título oficial del juego permanece en inglés. Si aparece una palabra en inglés, no significa que hayas elegido mal: la traducción todavía está en desarrollo.

## De qué trata el juego

**So I Became the Dark Lord's Problem** es un juego de rol de fantasía original para una sola persona. Su nombre puede traducirse para presentarlo como *Así que me convertí en el problema del Señor Oscuro*, pero el título oficial sigue siendo el inglés.

El Señor Oscuro ya domina el mundo. Tu misión es recorrer **cinco regiones**, enfrentarte a sus fuerzas, liberar a personajes que pueden enseñarte oficios y habilidades, reunir compañeros y avanzar hacia los grandes jefes. Hay **diez asentamientos**, **cinco mazmorras principales** y lugares que puedes descubrir mientras exploras.

No se trata solo de combatir: puedes ayudar a los asentamientos, mejorar a tu personaje, administrar tu compañía, construir o utilizar un **cuartel** (*Barracks*) y descubrir cómo recuperar a los compañeros caídos. La moneda del mundo se llama **coronas** (*crowns*).

La aventura tiene objetivos principales, encargos locales y una historia que continúa después del enfrentamiento inicial con el régimen.

## Tus primeros pasos

1. **Nueva partida:** elige **Normal**, selecciona **Español** y elige un personaje. Los cuatro protagonistas jugables son **Paladín, Maga, Explorador (Ranger) y Pícara (Rogue)**. Cada una combate de manera diferente. La Pícara también puede encantar a ciertos enemigos (*Charm*) y convertirlos en compañeros.
2. **Muévete y explora:** camina por el escenario, acércate a los personajes y usa **Interactuar** cuando aparezca. No hace falta entender cada sistema desde el principio.
3. **Consulta qué hacer:** abre **Aventura → Diario de misiones** (*Adventure → Quest journal*) para seguir los objetivos de la historia. El **Mapa y rutas de viaje** te ayuda a encontrar destinos.
4. **Aprende tus habilidades:** ve a **Aventura → Habilidades del personaje** (*Hero skills*) para consultar las acciones disponibles, sus mejoras y cómo entrenarlas. Las habilidades usan **tiempos de reutilización**, no una barra de maná.
5. **Cuida a tu compañía:** los compañeros pueden luchar contigo, retirarse cuando están heridos y necesitar recuperación. El capitán y los cuarteles terminados ofrecen **Curar heridas** por 30 coronas: recupera toda la salud de tu personaje y los compañeros vivos cuando no haya combate cercano. En los refugios puedes curarlos gratis, con un tiempo de espera de 90 segundos. Los compañeros caídos necesitan una recuperación aparte.
   En **Cuartel → Recuperación** puedes elegir individualmente a los compañeros caídos. Un cuartel básico permite dejar **hasta 3 recuperaciones pendientes**; un cuartel completo admite todas las que necesites dentro de tu compañía. Cada compañero cuesta **40 coronas**. Puedes cancelar una solicitud sin pagar; se procesa automáticamente al reunir las coronas y cumplir las condiciones de seguridad. El capitán conserva una sola solicitud de recuperación. Curar heridas cuesta 30 coronas y no revive a los caídos.
   **Solo para la Pícara:** en **Cuartel → Recuperación** puedes decidir qué ocurre cuando cae un monstruo encantado. La opción predeterminada lo manda a la reserva para liberar un espacio del grupo activo. También puedes hacer que **conserve ese espacio**, como los compañeros de las otras clases, hasta que lo recuperes por 40 coronas o lo pases manualmente a reserva. En ambos casos sigue siendo tu compañero y conserva su identidad. El cambio solo afecta a los futuros caídos: no mueve a los que ya estén caídos.
   **Consulta a cada compañero:** en un **cuartel terminado → Company (Compañía)**, entra en **Manage active group** (*Administrar el grupo activo*) o **Charmed monsters** (*Monstruos encantados*) y selecciona **Inspect** (*Inspeccionar*). Puedes ver su salud, estado, progreso de **Mastery** (*Maestría*) y **Abilities & mastery** (*Habilidades y maestría*) sin retirarlo del grupo por accidente. La colección de mascotas de jefes también permite consultar sus habilidades. Los umbrales acumulativos de Maestría son **4 / 10 / 18** puntos. Cuando rescates a **Orin** en **Ironroot Highlands**, su servicio permite escoger **un monstruo encantado concreto** para la mejora única de Ringleader por **100 coronas**, con vista previa y confirmación antes de pagar. Consulta el [estado de desarrollo](docs/DEVELOPMENT_STATE.md) para distinguir una actualización publicada de una instalada en tu dispositivo.
6. **Continúa cuando quieras:** en la pantalla principal, **Continuar aventura** retoma una partida guardada válida. El modo **Nightmare** (Pesadilla) se desbloquea tras alcanzar el final pacífico y usa un guardado separado.

Algunas opciones pueden conservar el nombre inglés en tu versión. Las explicaciones entre paréntesis ayudan a reconocerlas aunque todavía no estén traducidas.

**Música y menús:** la banda sonora nueva ya está publicada: 65 grabaciones musicales nuevas sustituyen las anteriores en sus escenas correspondientes y se conservan las 18 piezas originales de Dark Crown. El tema principal empieza después de la primera interacción que autorice el sonido en el navegador (por ejemplo, un toque o clic), sin necesidad de mover al personaje o usar una habilidad. Al volver al menú principal, regresa el tema del título. Si abres el menú **Aventura** o **Juego y ajustes** dentro de la partida, la acción puede quedar en pausa, pero la música del lugar continúa. Al elegir **Continuar aventura**, el juego prepara la música de la zona cargada antes de darte el control cuando es posible. Algunos navegadores impiden reproducir sonido antes de cualquier interacción; la actualización de una aplicación instalada depende de su caché. Las pruebas automáticas de la versión publicada pasaron, pero las pruebas personales de escucha y del teléfono siguen pendientes, sin impedir que juegues.

Greenwood tiene un molino y estanque de trabajo, huertos en distintas etapas, una bodega decorativa independiente y rutas por el bosque. **Scornfang's Treasury** es un lugar distinto de **Old Orchard Cellars**, que sigue siendo un interior ocupado.

**Tutorial ampliado en desarrollo para v0.9.2 (todavía no publicado):** se está preparando una secuencia de misiones que comenzará con el capitán y la primera construcción de un cuartel; para la Pícara incluirá conseguir un monstruo encantado legítimamente. Después enseñará el tablón, la distinción entre historia principal y misiones secundarias, el mapa y la navegación hacia **Old Orchard Cellars** para estudiar **El arte del engaño**, un códice que ya existe y aumenta la probabilidad crítica de tu personaje en un punto porcentual. Otra misión independiente, al utilizar por primera vez **Cuartel → Operaciones → Recoger recursos** tras desbloquear Expedición 2, explicará cómo enviar compañeros a recoger tributo y depositarlo a cambio de coronas. Las expediciones de recursos a regiones anteriores seguirán siendo una función avanzada con instrucciones, sin otra misión guiada. Los ataques automáticos del personaje no deberán iniciar por sí solos combates contra jefes o capitanes; una habilidad utilizada deliberadamente sí podrá hacerlo si cumple las reglas normales. Estas mejoras aún necesitan pruebas y autorización antes de aparecer en el juego publicado.

## Controles básicos

Los siguientes son los **atajos predeterminados** del teclado. Puedes cambiar movimiento, interacción, apertura del menú, combate y otras teclas en **Ajustes → Controles → Personalizar teclado**. La tecla Esc siempre funciona como salida de emergencia de los menús. También hay distribuciones clásicas y alternativas.

En computadora, al acercarte a un personaje, objeto o recurso, aparece un aviso con su nombre y la tecla actual de **Interactuar**. Si cambias esa tecla, el aviso usa la nueva.

| Lo que quieres hacer | Computadora o Chromebook | Teléfono |
| --- | --- | --- |
| Moverte | **W / A / S / D** | Palanca izquierda o tocar un destino accesible |
| Hablar, usar algo o confirmar | **F** | Botón **Interactuar** |
| Habilidades 1 a 5 | **J / K / L / U / I** | Botones de habilidades |
| Habilidades 6 a 8 | **Espacio / O / N** | Botones de habilidades |
| Cargar una habilidad | Mantener pulsada unos **0,65 segundos** | Mantener el botón |
| Cambiar de enemigo seleccionado | **E** | **Objetivo** (*Target*) |
| Reagrupar a tus compañeros | Tecla de acento grave o **Q** con los ajustes predeterminados | **Reagrupar** (*Recall*) |
| Consultar el mapa | **Z** (también **M**) | Menú **Aventura** |
| Talentos / lista de habilidades | **C / X** | Menú **Aventura** |
| Pausar / ver controles / volver | **P / G / Esc** | Menú |
| Ordenar la curación del Ranger | **H** | Botón de curación |

**Combate:** tu personaje puede realizar ataques básicos automáticos. Una pulsación corta de habilidad ejecuta su forma normal; algunas habilidades ofrecen una forma cargada al mantener el botón. Cada acción tiene un tiempo de espera antes de reutilizarse. Si mantienes **Objetivo** unos **0,55 segundos**, puedes fijar un enemigo; pulsarlo brevemente cambia de objetivo.

**Reagrupar (Recall):** pulsa una vez para ordenar a tus compañeros que regresen y permanezcan a la defensiva durante **cinco segundos de juego**. El botón indica que está activo y muestra la cuenta atrás. Pulsa otra vez para cancelar antes; de lo contrario, termina solo al cumplirse los cinco segundos. Tus ataques automáticos o habilidades manuales no lo cancelan. El tiempo no avanza mientras el juego está en pausa, y no puedes asignar nuevas tareas a compañeros durante esos cinco segundos.

**En el teléfono:** puedes usar la palanca o tocar el suelo para desplazarte. Los controles táctiles tienen una disposición para dos pulgares y una alternativa para zurdos. Abrir un menú o volver a manejar la palanca interrumpe el desplazamiento automático.

Para aprender a jugar, consultar informes de prueba, rendimiento, actualizaciones, versión y contacto con el creador, abre **Ayuda y créditos** en el menú principal. Para cambiar las teclas o controles táctiles, usa **Ajustes → Controles**.

## Guardar y actualizar

**Las partidas se guardan en el navegador o dispositivo donde juegas.** No existe sincronización de partidas en la nube. Antes de borrar los datos del navegador o cambiar de teléfono, exporta una copia.

- **Copia de la partida:** desde el menú principal, abre **Partidas y copias de seguridad** para seleccionar, recuperar, exportar o importar partidas. Cada botón explica brevemente su función. La [protección de guardados #773](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/773) incorpora exportaciones verificadas con modo/clase/nivel/fecha, una vista previa y confirmación separada antes de importar, recordatorios discretos y una solicitud opcional de almacenamiento persistente. Consulta el [estado de desarrollo](docs/DEVELOPMENT_STATE.md) y el [PR #775](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/775) para confirmar la publicación y la versión instalada. Guarda el `.json` fuera de los datos del navegador; que comience la descarga no garantiza que el archivo se conserve. Ni el punto de recuperación local ni la persistencia impiden que borres los datos o pierdas el dispositivo.
- **Actualizaciones:** el juego comprueba automáticamente las novedades al iniciarse. Si hay una lista para instalar durante la partida, aparece el aviso correspondiente. Ya no existe el botón manual de búsqueda en Ajustes; una aplicación instalada puede conservar temporalmente la versión anterior.
- **Ver qué versión estás jugando:** **Juego y ajustes → Pantalla y rendimiento → Exportar informe de prueba**. Ese archivo muestra el campo `version` y datos de diagnóstico; **no es una copia de tu partida**.

**Versión actual y publicación verificada:** consulta [Estado de desarrollo](docs/DEVELOPMENT_STATE.md) para distinguir la versión del código, la versión publicada en GitHub Pages y la que realmente está instalada en tu dispositivo.

**Cambio preparado en el PR #574:** **PixiJS WebGL2 · Predeterminado** será el motor gráfico principal y **Canvas 2D · Respaldo** seguirá disponible para elegirlo o recuperarse de un fallo de WebGL. La actualización reemplazará la preferencia antigua por Canvas **una sola vez**; si vuelves a elegir Canvas, el juego respetará esa decisión al reiniciar. PixiJS se preparará al entrar en **Nueva partida / Continuar aventura**, no mientras esperas en el menú principal. Si la preparación tarda demasiado, podrás seleccionar **Continuar con Canvas**. Si cambias manualmente de Canvas a PixiJS, se conservará la confirmación de 15 segundos. La opción de PixiJS ya no llevará la etiqueta «Experimental», pero eso **no garantiza** mejor rendimiento ni sustituye las pruebas en Chromebook o teléfono.

**Disponibilidad:** la actualización del PR #574 entra en el código del juego al integrarse en `main` y requiere una publicación correcta de GitHub Pages. Una instalación PWA puede conservar la versión anterior hasta actualizarse. Consulta [Estado de desarrollo](docs/DEVELOPMENT_STATE.md) y el informe de diagnóstico para comprobar la versión y el motor realmente activos.

## Palabras que quizá veas en inglés

| En el juego o en los documentos | Qué significa |
| --- | --- |
| **New Game / Continue Adventure** | Crear una partida / continuar una partida |
| **Quest journal** | Diario de misiones; indica los objetivos de la historia |
| **Adventure / Hero skills / Talents** | Aventura / habilidades del héroe / talentos |
| **Recall / Target / Interact** | Reagrupar compañeros / elegir objetivo / interactuar |
| **Barracks / Captain** | Cuartel / capitán; servicios para la compañía |
| **Charm** | Encantar a un enemigo válido para que se una a tu compañía |
| **Cooldown / Charged** | Tiempo de espera / versión cargada de una habilidad |
| **PWA** | Aplicación web que el navegador puede instalar en la pantalla de inicio |
| **PR (pull request)** | Propuesta de cambios al código o documentación; no significa que ya esté publicada |

## Si llegaste desde GitHub

**No necesitas saber programar ni leer la documentación técnica para jugar.** Los dos enlaces del principio abren el juego directamente. GitHub es el lugar donde se mantiene el código, se revisan cambios y se conservan documentos de desarrollo.

La mayoría de los documentos del repositorio están en inglés. Para orientarte:

| Si quieres saber… | Consulta… |
| --- | --- |
| Qué es el juego y dónde jugar | [README principal](README.md) *(en inglés)* |
| Qué versión está publicada y qué falta por terminar | [Estado de desarrollo](docs/DEVELOPMENT_STATE.md) *(en inglés)* |
| Dónde encontrar documentos de un sistema | [Índice de documentación](docs/DOCUMENTATION_INDEX.md) *(en inglés)* |
| Cómo está organizado el código | [Arquitectura](docs/ARCHITECTURE.md) *(técnico, en inglés)* |

**Importante:** el nombre `azeroth-chronicles-prototype` aparece en la dirección de GitHub porque es un identificador histórico. El juego ya tiene una identidad propia y **no es un producto de Warcraft**. [Aquí se explica el cambio de nombre](docs/BRAND_IDENTITY.md) *(en inglés)*.

Los documentos con fechas antiguas pueden describir ideas descartadas o estados anteriores. Una propuesta o un *PR* abierto no significa que esa función ya esté disponible. Para jugar, sigue esta guía y los menús del juego; para conocer el estado real del proyecto, consulta el documento de desarrollo vigente.
