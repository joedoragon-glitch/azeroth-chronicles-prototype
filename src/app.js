/* Browser integration. Game rules remain in game.js; no build or packages. */
(() => {
    const byId = id => document.getElementById(id);
    const joystick = byId('joystick'), knob = byId('joystick-knob'), sword = byId('slot-1');
    const status = byId('app-status'), installButton = byId('install-button'), updateButton = byId('update-button');
    let menuDirection = null, menuRepeatAt = 0;
    let movementPointer = null, swordPointer = null, installPrompt = null, registration = null;
    let touchPreference = null, reloading = false;
    try { touchPreference = window.localStorage.getItem('azeroth-touch-controls'); } catch (_) { /* Optional preference. */ }
    const touchMedia = window.matchMedia('(any-pointer: coarse)');

    function setTouchMode(enabled) {
        window.resetTouchControls();
        document.body.classList.toggle('touch-mode', enabled);
        byId('touch-toggle').setAttribute('aria-pressed', String(enabled));
        byId('touch-toggle').textContent = enabled ? 'Ocultar controles táctiles' : 'Mostrar controles táctiles';
    }
    function releaseCapture(element, pointer) {
        if (pointer !== null && element.hasPointerCapture(pointer)) element.releasePointerCapture(pointer);
    }
    window.resetTouchControls = () => {
        const move = movementPointer, attack = swordPointer;
        movementPointer = swordPointer = null;menuDirection=null;menuRepeatAt=0;
        touchInput.x = touchInput.y = 0; touchInput.attack = false;
        knob.style.transform = 'translate(0px, 0px)';
        releaseCapture(joystick, move); releaseCapture(sword, attack);
    };
    function moveJoystick(event) {
        const rect = joystick.getBoundingClientRect();
        const radius = Math.max(1, (Math.min(rect.width, rect.height) - knob.offsetWidth) / 2);
        let x = (event.clientX - rect.left - rect.width / 2) / radius;
        let y = (event.clientY - rect.top - rect.height / 2) / radius;
        const length = Math.hypot(x, y);
        if (length > 1) { x /= length; y /= length; }
        // Small center dead zone; full travel reaches normal keyboard speed.
        const magnitude = Math.min(1, length);
        const adjusted = magnitude <= .12 ? 0 : (magnitude - .12) / .88;
        touchInput.x = magnitude ? x * adjusted / Math.min(1, magnitude) : 0;
        touchInput.y = magnitude ? y * adjusted / Math.min(1, magnitude) : 0;
        knob.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
    }
    window.navigateTouchMenu = now => {
        if(!activeWindow){menuDirection=null;return;}
        const x=touchInput.x,y=touchInput.y;
        const direction=Math.max(Math.abs(x),Math.abs(y))<.4?null:Math.abs(y)>=Math.abs(x)?(y<0?'moveUp':'moveDown'):(x<0?'moveLeft':'moveRight');
        if(!direction){menuDirection=null;return;}
        if(direction!==menuDirection||now>=menuRepeatAt){menuDirection=direction;menuRepeatAt=now+240;handleMenuKeyboard(KeyboardControls.bindings[direction]);}
    };
    joystick.addEventListener('pointerdown' , event => {
        if ((isGamePaused() && !activeWindow) || movementPointer !== null || event.button > 0) return;
        event.preventDefault(); AudioSys.init(); movementPointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId); moveJoystick(event);
    });
    joystick.addEventListener('pointermove', event => {
        if (event.pointerId === movementPointer) { event.preventDefault(); moveJoystick(event); }
    });
    function stopMovement(event) {
        if (event.pointerId !== movementPointer) return;
        const pointer = movementPointer; movementPointer = null;
        touchInput.x = touchInput.y = 0; knob.style.transform = 'translate(0px, 0px)';
        releaseCapture(joystick, pointer);
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) joystick.addEventListener(event, stopMovement);
    sword.addEventListener('pointerdown', event => {
        if (isGamePaused() || swordPointer !== null || event.button > 0) return;
        event.preventDefault(); AudioSys.init(); swordPointer = event.pointerId;
        sword.setPointerCapture(event.pointerId); touchInput.attack = true; castSpell(1);
    });
    function stopSword(event) {
        if (event.pointerId !== swordPointer) return;
        const pointer = swordPointer; swordPointer = null; touchInput.attack = false;
        releaseCapture(sword, pointer);
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) sword.addEventListener(event, stopSword);
    window.addEventListener('load', () => {
        // Pointer events cast on press; keyboard activation still casts on click.
        sword.onclick = event => { if (!event || event.detail === 0) { AudioSys.init(); castSpell(1); } };
    });
    byId('interact-button').addEventListener('click', () => { if (!isGamePaused()) { AudioSys.init(); if(typeof Squad!=='undefined'&&Squad.active)Squad.order();else interactWithNearby(); } });
    byId('touch-toggle').addEventListener('click', () => {
        const enabled = !document.body.classList.contains('touch-mode');
        touchPreference = enabled ? 'on' : 'off';
        try { window.localStorage.setItem('azeroth-touch-controls', touchPreference); } catch (_) { /* Game remains usable. */ }
        setTouchMode(enabled);
    });
    touchMedia.addEventListener('change', () => { if (touchPreference === null) setTouchMode(touchMedia.matches); });
    setTouchMode(touchPreference === null ? touchMedia.matches : touchPreference === 'on');
    window.updateAppPauseUI = () => { byId('app-pause-button').textContent = manualPaused ? 'Continuar partida' : 'Pausar partida'; };
    byId('app-pause-button').addEventListener('click', () => { togglePause(); closeAllWindows(); });

    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault(); installPrompt = event; installButton.hidden = false;
    });
    installButton.addEventListener('click', async () => {
        if (!installPrompt) return;
        const prompt = installPrompt; installPrompt = null; installButton.hidden = true;
        try { await prompt.prompt(); await prompt.userChoice; } catch (_) { status.textContent = 'Puedes instalar desde el menú de Chrome.'; }
    });
    window.addEventListener('appinstalled', () => { installPrompt = null; installButton.hidden = true; status.textContent = 'Aplicación instalada. Tu partida sigue guardada en este dispositivo.'; });

    if ('serviceWorker' in navigator && window.isSecureContext) {
        let controlled = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!controlled) { controlled = true; return; }
            if (reloading) return;
            reloading = true; saveGame(); window.location.reload();
        });
        function offerUpdate() {
            if (registration.waiting && navigator.serviceWorker.controller) updateButton.hidden = false;
        }
        navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
            registration = reg; offerUpdate();
            reg.addEventListener('updatefound', () => {
                const worker = reg.installing;
                if (worker) worker.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
            });
            navigator.serviceWorker.ready.then(() => {
                status.textContent = 'Aplicación preparada para jugar sin conexión. El guardado pertenece a este dispositivo; exporta una copia para llevarlo a otro.';
            });
        }).catch(() => { status.textContent = 'El juego funciona, pero no se pudo preparar el modo sin conexión. Vuelve a abrirlo con conexión para reintentar.'; });
        updateButton.addEventListener('click', () => {
            if (!registration || !registration.waiting) return;
            saveGame(); if (!manualPaused) togglePause();
            updateButton.disabled = true; status.textContent = 'Actualizando; tu partida está guardada.';
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
    }
})();
