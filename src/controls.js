/* Physical keyboard codes: defaults favor the left hand, independent of case. */
const KeyboardControls = (() => {
    const actions = [
        ['moveUp','Mover arriba','KeyW'], ['moveDown','Mover abajo','KeyS'],
        ['moveLeft','Mover a la izquierda','KeyA'], ['moveRight','Mover a la derecha','KeyD'],
        ['spell1','Espada','Digit1'], ['spell2','Fuego','Digit2'], ['spell3','Curar','Digit3'],
        ['spell4','Escudo','Digit4'], ['spell5','Ataque de área','Digit5'],
        ['interact','Interactuar','KeyE'], ['confirm','Confirmar en menús / interactuar','KeyF'],
        ['menu','Menú / volver','KeyQ'], ['inventory','Mochila','KeyR'],
        ['talents','Talentos','KeyC'], ['spellbook','Libro de habilidades','KeyX'],
        ['quest','Misión','KeyT'], ['map','Mapa','KeyZ'], ['pause','Pausa','KeyV'], ['help','Ayuda','KeyG']
    ];
    const defaults = Object.fromEntries(actions.map(([id,,code]) => [id,code]));
    const storageKey = 'azeroth-keyboard-controls-v1';
    const supported = code => /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Backquote|BracketLeft|BracketRight|Minus|Equal|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(code);
    let bindings = {...defaults};
    let notice = '';
    try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey));
        if (saved && saved.version === 1 && saved.bindings && actions.every(([id]) => supported(saved.bindings[id])) &&
            new Set(actions.map(([id]) => saved.bindings[id])).size === actions.length) {
            bindings = Object.fromEntries(actions.map(([id]) => [id,saved.bindings[id]]));
        }
    } catch (_) { /* Missing, corrupt or unavailable storage keeps safe defaults. */ }
    const aliases = {KeyI:'inventory',KeyB:'inventory',KeyK:'spellbook',KeyM:'map',KeyP:'pause',KeyH:'help',Space:'spell1'};
    function actionFor(code) {
        return actions.find(([id]) => bindings[id] === code)?.[0] || aliases[code] || null;
    }
    function label(code) {
        const names = {Space:'Espacio',Tab:'Tab',Backquote:'`',BracketLeft:'[',BracketRight:']',Minus:'−',Equal:'=',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
        return names[code] || code.replace(/^Key|^Digit/,'');
    }
    function persist() {
        try { window.localStorage.setItem(storageKey,JSON.stringify({version:1,bindings})); notice='Controles guardados en este navegador.'; }
        catch (_) { notice='Controles activos durante esta sesión; el navegador no permite guardarlos.'; }
    }
    function assign(id,code) {
        if (!(id in defaults) || !supported(code)) return 'Usa una letra, número, flecha o tecla sencilla. Esc cancela; Ctrl/Alt/Cmd se reservan al navegador.';
        const conflict = actions.find(([other]) => other !== id && bindings[other] === code);
        if (conflict) return `${label(code)} ya se usa para «${conflict[1]}». Elige otra tecla.`;
        bindings[id]=code; persist(); return null;
    }
    return {actions,defaults,get bindings(){return bindings},get notice(){return notice},actionFor,label,assign,
        reset(){bindings={...defaults};persist()}};
})();
