/* Physical keyboard codes: defaults favor the left hand, independent of case. */
const KeyboardControls = (() => {
    const actions = [
        ['moveUp','Mover arriba','KeyW'], ['moveDown','Mover abajo','KeyS'],
        ['moveLeft','Mover a la izquierda','KeyA'], ['moveRight','Mover a la derecha','KeyD'],
        ['spell1','Espada','Digit1'], ['spell2','Fuego','Digit2'], ['spell3','Curar','Digit3'],
        ['spell4','Escudo','Digit4'], ['spell5','Ataque de área','Digit5'], ['spell6','Poder frecuente','Space'], ['spell7','Poder mayor','ShiftLeft'], ['spell8','Poder protector','KeyB'],
        ['interact','Interactuar','KeyE'], ['confirm','Confirmar en menús / interactuar','KeyF'],
        ['menu','Menú / volver','Escape'], ['inventory','Mochila','KeyR'],
        ['talents','Talentos','KeyC'], ['spellbook','Libro de habilidades','KeyX'],
        ['quest','Misión','KeyT'], ['map','Mapa','KeyZ'], ['pause','Pausa','KeyV'], ['help','Ayuda','KeyG']
    ];
    const defaults = Object.fromEntries(actions.map(([id,,code]) => [id,code]));
    const bindings=Object.freeze({...defaults});
    const aliases = {KeyI:'inventory',KeyK:'spellbook',KeyM:'map',KeyP:'pause',KeyH:'help'};
    function actionFor(code) {
        return actions.find(([id]) => bindings[id] === code)?.[0] || aliases[code] || null;
    }
    function label(code) {
        const names = {ShiftLeft:'Mayús izq.',Escape:'Esc',Space:'Espacio',Tab:'Tab',Backquote:'`',BracketLeft:'[',BracketRight:']',Minus:'−',Equal:'=',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
        return names[code] || code.replace(/^Key|^Digit/,'');
    }
    return {actions,defaults,bindings,actionFor,label};
})();
