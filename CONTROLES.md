# Controles del juego en vivo · Community Snapshot y actualizaciones

**Actualización del 28 de octubre de 2026:** Pícara / Rogue es la cuarta clase jugable; la compilación publicada verificada es `0.9.1+snapshot.dev.208`. Las pruebas en el teléfono, el equilibrio y la presentación final son comprobaciones independientes. Consulta el [estado vigente](docs/DEVELOPMENT_STATE.md).

Esta guía corresponde al **mismo juego que sigue publicado y recibiendo actualizaciones** en [navegador](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) y [teléfono/PWA](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html). El Community Snapshot de octubre de 2026 (incluida la antigua versión `0.9.1+snapshot.dev.79`) fue un hito histórico, **no un juego separado ni retirado**. Las versiones posteriores siguen siendo jugables desde esas mismas direcciones; consulta el [estado de desarrollo y publicación vigente](docs/DEVELOPMENT_STATE.md) para conocer la última compilación verificada. La versión instalada o guardada en caché en cada dispositivo puede tardar en actualizarse. Esta guía no autoriza modificar el juego, ejecutar pruebas generales ni publicar nuevas versiones.

## Menú principal y estado de la versión actual

Al abrir el juego desde cero, aparece la pantalla principal: **Continuar aventura**, **Nueva partida**, **Partidas y copias de seguridad**, **Ajustes** y **Ayuda y créditos**. **Continuar aventura** solo está disponible cuando existe una partida válida y se puede reanudar con seguridad; la preparación de la primera escena precede al juego activo. Al minimizar una partida en marcha y volver a ella, no se trata de un nuevo inicio. Para regresar al título desde el juego, usa **Volver al menú principal**, que respeta las comprobaciones de guardado. Las partidas Normal y Nightmare son independientes; las cuatro clases disponibles son **Paladín, Mago, Ranger y Pícara (Rogue)**. Pícara llega a la partida normal con la [publicación discreta de Rogue](docs/ROGUE_SOFT_RELEASE_20261028.md); su aceptación visual, sonora y de rendimiento sigue en evaluación.

**Guardados:** **Juego y ajustes → Partidas guardadas → Copias de seguridad → Exportar partida / Importar partida** (también se puede entrar a las copias desde **Partidas y copias de seguridad** en la pantalla principal). Guarda una copia antes de cambiar de dispositivo o borrar datos: no existe sincronización de partidas en la nube.

**Informe y versión instalada:** **Juego y ajustes → Pantalla y rendimiento → Exportar informe de prueba** descarga un archivo JSON local con la versión `version` realmente ejecutada y métricas orientativas. Este informe **no** es una copia de la partida, ni se envía automáticamente. La ruta inglesa equivalente es **Game and settings → Screen and performance → Export playtest report**.

**Gráficos y actualizaciones:** Canvas 2D sigue siendo la opción predeterminada. **PixiJS WebGL2** es experimental y opcional, con una prueba de 15 segundos para conservarlo o regresar a Canvas; no está certificado como sustituto. En **Juego y ajustes** puedes usar **Buscar actualización** o **Instalar actualización** cuando aparezca; una publicación nueva no demuestra que el navegador o la PWA instalada ya la estén usando. Comprueba `version` en el informe. Para saber qué compilación se publicó y cuáles son las pruebas pendientes, consulta el [estado vigente de desarrollo y aceptación](docs/DEVELOPMENT_STATE.md). La traducción al español del juego es parcial; los nombres de algunas clases y opciones se conservan en inglés.

| Acción | Teclado por defecto |
| --- | --- |
| Mover | W/A/S/D |
| Interactuar / confirmar | F |
| Habilidades 1–5 | J / K / L / U / I |
| Habilidades 6–8 | Espacio / O / N |
| Curación del Ranger | H; clic izquierdo en el mundo si clic para moverse está desactivado |
| Doctrina del grupo | Tab durante combate, desde Expedición 3 |
| Reunir al grupo (Recall) | Tecla de acento grave; Q también funciona con la asignación predeterminada |
| Cambiar objetivo (Target) | E o botón Target |
| Mapa | Z o M |
| Inventario / diario de misiones | Menús de Personaje / Aventura (sin atajos) |
| Talentos / habilidades | C / X |
| Pausa / controles / menú y volver | P o V / G / Esc |

La distribución predeterminada de escritorio ahora usa WASD para moverse con la mano izquierda y J/K/L/U/I/Espacio/O/N para habilidades con la derecha. **Game and settings → Controls → Customize keyboard** también ofrece la distribución clásica con números y la distribución inversa (moverse con IJKL, habilidades con la izquierda). Los ajustes existentes de teclado se conservan. Cambiar de distribución requiere confirmación; cada tecla sigue siendo personalizable. El inventario y el diario de misiones se abren desde los menús y ya no tienen atajos de teclado. En menús, las teclas de movimiento seleccionan; F, Enter o Espacio confirman. Los botones aceptan clics y toques; Esc cancela la captura de una tecla, y no se permiten duplicados.

Las habilidades 1–8 admiten toque rápido o pulsación de **0,65 segundos** para cargar con teclado, ratón o pantalla táctil. Mantener Target durante **0,55 segundos** fija el objetivo durante el encuentro; una pulsación corta cambia de objetivo y libera la fijación. La fijación termina si el enemigo muere, vuelve a su territorio o el héroe cambia de zona. Durante una carga dirigida, Target permite cambiar el objetivo. Dorado indica alcance válido, ámbar fuera de alcance y rojo línea de visión bloqueada.

El combate usa tiempos de reutilización: no hay gasto, barra ni recuperación activa de maná. El autoataque por movimiento no ordena perseguir al objetivo ni cancela Recall. La postura defensiva del Paladín desactiva su habilidad 1. Sprint no está disponible.

En teléfono, usa la palanca izquierda o toca un destino accesible; las habilidades están al otro lado. **Touch and mouse options** permite elegir dos pulgares o el diseño alternativo de mano izquierda. Tocar para moverse está activado por defecto; el clic de ratón para moverse es opcional y empieza desactivado. Teclado o palanca toman el control inmediatamente; menús, pausa y pérdida de foco cancelan el destino.

Recall y Target aparecen juntos cerca de la palanca. Interact aparece al estar cerca de un objetivo utilizable. El HUD compacto muestra salud y nivel sin barra de maná. **Adventure → Talents**, **Hero skills**, **Inventory and support** y **Quest journal** abren las referencias correspondientes. Las preferencias de control se guardan aparte de las partidas.
