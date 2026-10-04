// Azeroth Chronicles v0.3. Sin dependencias; conserva el guardado v2.
/* -------------------------------------------------------------
         * SYNTHESIZED WEB AUDIO API SYSTEM (No External Sound Files)
         * ------------------------------------------------------------- */
        const AudioSys = {
            ctx: null,
            init() {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!this.ctx && AudioContextClass) this.ctx = new AudioContextClass();
                    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
                } catch (_) { /* El juego funciona también sin audio. */ }
            },
            playFootstep() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80 + Math.random() * 40, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.05);
            },
            playSwordSwing() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.12);
            },
            playCastFire() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.22);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.22);
            },
            playHeal() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.3);
            },
            playHit() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(120, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.1);
            },
            playLevelUp() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.35);
                });
            },
            playGold() {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1046.50, this.ctx.currentTime);
                osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.07);
                gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.18);
            }
        };

        window.addEventListener('keydown', () => AudioSys.init());
        window.addEventListener('pointerdown', () => AudioSys.init());
    

        /* -------------------------------------------------------------
         * WARCRAFT III RTS PHYSICS & ISOMETRIC MATHEMATICS SYSTEM
         * ------------------------------------------------------------- */
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const mapCanvas = document.getElementById('mapCanvas');
        const mapCtx = mapCanvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (mapCanvas && mapCanvas.parentElement) {
                mapCanvas.width = mapCanvas.parentElement.clientWidth;
                mapCanvas.height = mapCanvas.parentElement.clientHeight;
            }
        }
        window.addEventListener('resize', () => { resizeCanvas(); if (activeWindow === 'map') renderMapUI(); });

        // Map Size in World Units
        const MAP_WORLD_SIZE = 2400; // 2400x2400 world units continuous plane
        const TOWN_BOUNDARY = 500;
        function isInTown(wx = player.wx, wy = player.wy) { return wx < TOWN_BOUNDARY && wy < TOWN_BOUNDARY; }

        /* 
         * Transforms World Coordinates (wx, wy) into Screen Isometric Coordinates (isoX, isoY).
         * Classic Warcraft III / StarCraft Axono-Isometric Projection.
         */
        function worldToIso(wx, wy) {
            const isoX = (wx - wy) * Math.cos(Math.PI / 6);
            const isoY = (wx + wy) * Math.sin(Math.PI / 6) * 0.6; // 0.6 vertical isometric squeeze
            return { x: isoX, y: isoY };
        }

        // Particle VFX Engine
        let particles = [];
        function createParticle(wx, wy, color, speed = 40, size = 4) {
            particles.push({
                wx, wy,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                color,
                size,
                life: 0.6,
                maxLife: 0.6
            });
        }

        // Footstep Dust Trail FX for Warcraft III Run Feeling
        let footstepFX = [];
        function addFootstep(wx, wy) {
            footstepFX.push({
                wx, wy, life: 0.4, maxLife: 0.4
            });
        }

        // Floating Damage / Healing Numbers
        let floatingTexts = [];
        function addFloatingText(text, wx, wy, color = '#ff4444') {
            floatingTexts.push({
                text, wx, wy, color, life: 1.2, maxLife: 1.2
            });
            if (!/^[+-]|^¡Inmune/.test(text)) {
                const feed = document.getElementById('event-feed');
                const entry = document.createElement('div');
                entry.textContent = text; feed.appendChild(entry);
                while (feed.children.length > 3) feed.removeChild(feed.firstChild);
                if (activeWindow) document.getElementById('menu-pause-notice').textContent = text + ' · ESC para cerrar';
            }
        }

        // World Ground Loot Items
        let groundLoot = [];
        function spawnLoot(wx, wy, goldAmount) {
            groundLoot.push({
                wx, wy, gold: goldAmount, name: `${goldAmount}g Monedas de Oro`, icon: '🪙'
            });
        }

        /* -------------------------------------------------------------
         * WARCRAFT III HERO PLAYER STATE & DYNAMICS
         * ------------------------------------------------------------- */
        const player = {
            // World Continuous Floating Point Coordinates
            wx: 300,
            wy: 300,
            
            // WC3 Physics Dynamics Engine Properties
            vx: 0,
            vy: 0,
            currentSpeed: 0,
            maxSpeed: 300,        // Max movement velocity
            acceleration: 900,    // Acceleration rate (units/s²)
            friction: 7.5,        // Ground drag/friction dampening
            
            // Turning Rate Mechanics (Warcraft III turn speed)
            currentFacing: 0,     // Current angle (radians)
            targetFacing: 0,      // Desired direction angle (radians)
            turnRate: Math.PI * 4, // Turning speed (rad/s)
            
            // Run Cycle Animation State
            animCycle: 0,
            isMoving: false,
            stepSoundTimer: 0,

            // RPG Progression
            level: 1,
            xp: 0,
            nextXp: 100,
            hp: 120,
            maxHp: 120,
            mp: 60,
            maxMp: 60,
            gold: 30,
            spellPower: 18,
            armor: 8,
            mpRegen: 3,
            talentPoints: 0,

            // Spell Cooldowns (in seconds)
            cds: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            spellLevels: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
            shieldActive: false,
            shieldTimer: 0
        };

        // Smooth Camera Spring Following System
        const camera = {
            wx: 300,
            wy: 300,
            dampening: 5.5 // Smooth RTS camera interpolation speed
        };

        /* -------------------------------------------------------------
         * TALENT TREE DATA
         * ------------------------------------------------------------- */
        const talents = [
            { id: 't_sp', name: '🔥 Furia de la Luz', desc: '+8 Poder de Ataque', points: 0, maxPoints: 5, apply: () => player.spellPower += 8 },
            { id: 't_mpregen', name: '💧 Mente Clara', desc: '+2 Reg. Maná por segundo', points: 0, maxPoints: 5, apply: () => player.mpRegen += 2 },
            { id: 't_hp', name: '🛡️️ Fortaleza Inquebrantable', desc: '+30 Vida Máxima', points: 0, maxPoints: 5, apply: () => { player.maxHp += 30; player.hp += 30; } },
            { id: 't_speed', name: '⚡ Celeridad Divina', desc: '+40 Velocidad, +150 Aceleración', points: 0, maxPoints: 3, apply: () => { player.maxSpeed += 40; player.acceleration += 150; } }
        ];

        /* -------------------------------------------------------------
         * INVENTORY & EQUIPMENT
         * ------------------------------------------------------------- */
        const inventory = [
            { name: 'Poción de Vida Mayor', icon: '🧪', type: 'consumable', value: 60, desc: 'Restaura 60 Puntos de Vida' },
            { name: 'Poción de Maná', icon: '🧪', type: 'consumable_mp', value: 40, desc: 'Restaura 40 Puntos de Maná' },
            { name: 'Espada de Cruzado', icon: '⚔️', type: 'gear', sp: 10, desc: '+10 Poder de Ataque' }
        ];
        let equippedWeapon = null;

        /* -------------------------------------------------------------
         * FRIENDLY NPCS & HOSTILE ENEMIES
         * ------------------------------------------------------------- */
        const npcs = [
            { id: 'trainer', name: 'Entrenador Paladín', role: 'Entrenador', icon: '🧙‍♂️', wx: 200, wy: 240 },
            { id: 'merchant', name: 'Mercader de Provisiones', role: 'Tienda', icon: '🛒', wx: 380, wy: 200 },
            { id: 'questgiver', name: 'Comandante de la Villa', role: 'Misiones', icon: '📜', wx: 280, wy: 380 }
        ];

        // Static Isometric Scenery Trees & Ruins
        const sceneryProps = [
            { icon: '🌲', wx: 120, wy: 150, scale: 1.2 },
            { icon: '🌲', wx: 450, wy: 100, scale: 1.3 },
            { icon: '🌲', wx: 80, wy: 450, scale: 1.1 },
            { icon: '🏛️', wx: 550, wy: 500, scale: 1.5 },
            { icon: '🌲', wx: 620, wy: 420, scale: 1.3 },
            { icon: '🌲', wx: 900, wy: 300, scale: 1.4 },
            { icon: '🌲', wx: 1050, wy: 800, scale: 1.2 }
        ];

        const questState = {
            active: false,
            completed: false,
            rewardClaimed: false,
            requiredKills: 5,
            currentKills: 0
        };

        let enemies = [
            { id: 1, name: 'Goblin Salteador', icon: '🧌', wx: 700, wy: 650, hp: 70, maxHp: 70, lvl: 1, damage: 8, gold: 12, xp: 35, type: 'mob' },
            { id: 2, name: 'Goblin Salteador', icon: '🧌', wx: 820, wy: 550, hp: 70, maxHp: 70, lvl: 1, damage: 8, gold: 10, xp: 35, type: 'mob' },
            { id: 3, name: 'Orco Guerrero', icon: '👹', wx: 1100, wy: 950, hp: 130, maxHp: 130, lvl: 2, damage: 14, gold: 24, xp: 65, type: 'mob' },
            { id: 4, name: 'Esqueleto Renegado', icon: '💀', wx: 1250, wy: 1100, hp: 110, maxHp: 110, lvl: 2, damage: 16, gold: 20, xp: 60, type: 'mob' },
            { id: 5, name: 'Señor Demonio (Jefe)', icon: '😈', wx: 1700, wy: 1600, hp: 750, maxHp: 750, lvl: 5, damage: 28, gold: 150, xp: 300, type: 'boss' }
        ];

        let selectedTarget = null;
        let activeProjectiles = [];

        /* -------------------------------------------------------------
         * LEFT-HAND KEYBOARD NAVIGATION ENGINE FOR MENUS
         * ------------------------------------------------------------- */
        let activeWindow = null; // 'inventory', 'talents', 'spells', 'shop', 'trainer', 'quest', 'map'
        let menuIndex = 0;
        let pendingControlAction = null;
        let controlNotice = '';
        const keyboardMenuIds = ['menu-inventory','menu-talents','menu-spells','menu-quest','menu-map','menu-help','app-pause-button','menu-save','menu-export','menu-import','touch-toggle','menu-new','install-button','update-button','menu-controls','menu-resume'];
        function keyboardMenuButtons() {
            return keyboardMenuIds.map(id => document.getElementById(id)).filter(button => button && !button.hidden && !button.disabled && (button.id !== 'menu-controls' || document.body.classList.contains('keyboard-input')));
        }
        function renderKeyboardMenu() {
            const buttons = keyboardMenuButtons();
            menuIndex = Math.max(0, Math.min(menuIndex, buttons.length - 1));
            buttons.forEach((button, index) => button.classList.toggle('keyboard-selected', index === menuIndex));
            const selected = buttons[menuIndex];
            if (selected && selected.scrollIntoView) selected.scrollIntoView({block:'nearest'});
        }
        function returnToGameMenu() {
            if (activeWindow && activeWindow !== 'appmenu') openWindow('appmenu');
            else toggleWindow('appmenu');
        }

        function openWindow(winId) {
            closeAllWindows();
            activeWindow = winId;
            clearMovement();
            menuIndex = 0;
            document.getElementById('modal-container').classList.remove('hidden');
            document.getElementById('modal-container').classList.add('flex');
            document.getElementById(`win-${winId}`).classList.remove('hidden');
            document.getElementById(`win-${winId}`).classList.add('flex');
            if (winId === 'map') resizeMapCanvas();
            renderActiveWindowUI();
            updatePauseUI();
        }

        function closeAllWindows() {
            activeWindow = null;
            pendingControlAction = null;
            clearMovement();
            document.getElementById('modal-container').classList.add('hidden');
            document.getElementById('modal-container').classList.remove('flex');
            const wins = ['inventory', 'talents', 'spells', 'shop', 'trainer', 'quest', 'map', 'help', 'appmenu', 'controls'];
            wins.forEach(w => {
                const el = document.getElementById(`win-${w}`);
                if (el) {
                    el.classList.add('hidden');
                    el.classList.remove('flex');
                }
            });
            updatePauseUI();
        }

        function toggleWindow(winId) {
            if (activeWindow === winId) closeAllWindows();
            else openWindow(winId);
        }
    

        /* -------------------------------------------------------------
         * KEYBOARD CONTROLS (WASD FREE VECTOR MOVEMENT & HOTKEYS)
         * ------------------------------------------------------------- */
        const keys = {};
        const touchInput = { x: 0, y: 0, attack: false };

        window.addEventListener('keydown', (e) => {
            const code = e.code;
            if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
            if (activeWindow === 'controls' && pendingControlAction) {
                e.preventDefault();
                document.body.classList.add('keyboard-input');
                if (e.repeat) return;
                if (code === 'Escape') { pendingControlAction = null; controlNotice = 'Asignación cancelada.'; }
                else if (e.ctrlKey || e.altKey || e.metaKey) controlNotice = 'Usa una tecla sin Ctrl, Alt ni Cmd. Esc cancela.';
                else {
                    const error = KeyboardControls.assign(pendingControlAction,code);
                    controlNotice = error || KeyboardControls.notice;
                    if (!error) { pendingControlAction = null; clearMovement(); updateKeyboardHints(); }
                }
                renderControlsUI(); return;
            }
            // Conservar atajos del navegador (Ctrl, Alt, Cmd); Shift permite WASD normal.
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            // Dejar que los botones nativos respondan a Enter/Espacio, sin lanzar ataques.
            if (e.target && /^(BUTTON|A)$/.test(e.target.tagName) && ['Enter','Space'].includes(code)) return;
            if (e.target && /^slot-[1-5]$/.test(e.target.id || '') && ['Enter','Space'].includes(code)) {
                e.preventDefault(); if (!e.repeat) castSpell(Number(e.target.id.slice(-1))); return;
            }
            const action = KeyboardControls.actionFor(code);
            const handled = action || ['Escape','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code);
            if (handled) { e.preventDefault(); document.body.classList.add('keyboard-input'); }
            if (e.repeat && !(action && action.startsWith('move')) && !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code)) return;
            if (action === 'pause') { togglePause(); return; }
            if (action === 'help') { toggleWindow('help'); return; }
            if (action === 'menu') { returnToGameMenu(); return; }

            // Direct Window Hotkeys (Left hand easily accessible)
            const windows = {inventory:'inventory',talents:'talents',spellbook:'spells',quest:'quest',map:'map'};
            if (windows[action]) { toggleWindow(windows[action]); return; }
            if (code === 'Escape') { closeAllWindows(); return; }

            // Route Keyboard Input to Active Modal Menu if open
            if (activeWindow) {
                handleMenuKeyboard(code);
                return;
            }

            if (manualPaused || focusPaused || document.hidden) return;
            // Real-Time Game Key State Registration
            keys[code] = true;

            // Interaction Key E
            if (action === 'interact' || action === 'confirm') {
                interactWithNearby();
            }

            // Ability Hotkeys 1-5
            if (action && action.startsWith('spell') && action !== 'spellbook') castSpell(Number(action.slice(-1)));
        });

        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
        window.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') document.body.classList.remove('keyboard-input'); });

        /* -------------------------------------------------------------
         * MENU NAVIGATION VIA WASD + ENTER
         * ------------------------------------------------------------- */
        function handleMenuKeyboard(code) {
            const action = KeyboardControls.actionFor(code);
            const columns = activeWindow === 'inventory' ? 4 : (activeWindow === 'appmenu' ? 2 : 1);
            if (action === 'moveUp' || (!action && code === 'ArrowUp')) {
                menuIndex = Math.max(0, menuIndex - columns);
                renderActiveWindowUI();
            } else if (action === 'moveDown' || (!action && code === 'ArrowDown')) {
                menuIndex += columns;
                renderActiveWindowUI();
            } else if (action === 'moveLeft' || (!action && code === 'ArrowLeft')) {
                menuIndex = Math.max(0, menuIndex - 1);
                renderActiveWindowUI();
            } else if (action === 'moveRight' || (!action && code === 'ArrowRight')) {
                menuIndex++;
                renderActiveWindowUI();
            } else if (action === 'confirm' || action === 'interact' || ['Enter','Space'].includes(code)) {
                executeMenuSelection();
            }
            if (activeWindow === 'appmenu') renderKeyboardMenu();
        }

        /* -------------------------------------------------------------
         * INTERACTION SYSTEM (E KEY)
         * ------------------------------------------------------------- */
        function interactWithNearby() {
            // 1. Pick up ground loot
            for (let i = groundLoot.length - 1; i >= 0; i--) {
                const loot = groundLoot[i];
                const dist = Math.hypot(player.wx - loot.wx, player.wy - loot.wy);
                if (dist <= 75) {
                    player.gold += loot.gold;
                    AudioSys.playGold();
                    addFloatingText(`+${loot.gold}g Oro Recogido`, player.wx, player.wy, '#facc15');
                    groundLoot.splice(i, 1);
                    return;
                }
            }

            // 2. Interact with friendly NPCs
            for (let npc of npcs) {
                const dist = Math.hypot(player.wx - npc.wx, player.wy - npc.wy);
                if (dist <= 90) {
                    if (npc.id === 'merchant') openWindow('shop');
                    else if (npc.id === 'trainer') openWindow('trainer');
                    else if (npc.id === 'questgiver') openWindow('quest');
                    return;
                }
            }

            // 3. Target nearest hostile enemy
            let closest = null;
            let minDist = 380;
            for (let enemy of enemies) {
                if (enemy.hp <= 0 || enemy.returning) continue;
                const dist = Math.hypot(player.wx - enemy.wx, player.wy - enemy.wy);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            }
            if (closest) {
                selectedTarget = closest;
                updateHUDUI();
                addFloatingText('Objetivo: ' + closest.name, closest.wx, closest.wy, '#ffcc00');
            } else {
                addFloatingText('Acércate a un personaje o enemigo. M abre el mapa.', player.wx, player.wy, '#fde047');
            }
        }

        /* -------------------------------------------------------------
         * SPELL CASTING MECHANICS (KEYS 1-5)
         * ------------------------------------------------------------- */
        // Reglas compartidas por las habilidades y la barra de recarga.
        const SPELL_COSTS = { 1: 0, 2: 15, 3: 25, 4: 30, 5: 40 };
        const SPELL_CDS = { 1: 0.5, 2: 2, 3: 6, 4: 12, 5: 10 };
        function spellScale(num) { return 1 + 0.25 * (player.spellLevels[num] - 1); }

        function castSpell(num) {
            if (!(num in SPELL_COSTS) || isGamePaused() || player.cds[num] > 0) return;
            if ([1, 2, 5].includes(num) && isInTown()) {
                addFloatingText('La villa es un refugio. Sal de ella para combatir.', player.wx, player.wy, '#fde047'); return;
            }
            const range = num === 1 ? 125 : 400;
            if (num === 1 || num === 2) {
                const valid = enemy => enemy && enemy.hp > 0 && !enemy.returning && Math.hypot(player.wx - enemy.wx, player.wy - enemy.wy) <= range;
                if (!valid(selectedTarget)) {
                    selectedTarget = enemies.filter(valid).sort((a, b) =>
                        Math.hypot(player.wx - a.wx, player.wy - a.wy) - Math.hypot(player.wx - b.wx, player.wy - b.wy))[0] || null;
                }
                if (!selectedTarget) {
                    addFloatingText('Sin enemigo al alcance', player.wx, player.wy, '#f59e0b');
                    return;
                }
            }
            if (num === 3 && player.hp >= player.maxHp) {
                addFloatingText('Vida completa', player.wx, player.wy, '#4ade80'); return;
            }
            const areaTargets = enemies.filter(e => e.hp > 0 && !e.returning && Math.hypot(player.wx - e.wx, player.wy - e.wy) <= 300);
            if (num === 5 && !areaTargets.length) {
                addFloatingText('Sin enemigos cercanos', player.wx, player.wy, '#f59e0b'); return;
            }
            if (player.mp < SPELL_COSTS[num]) {
                addFloatingText('¡Maná insuficiente!', player.wx, player.wy, '#3b82f6'); return;
            }
            player.mp -= SPELL_COSTS[num];
            player.cds[num] = SPELL_CDS[num];
            switch (num) {
                case 1: {
                    AudioSys.playSwordSwing();
                    const target = selectedTarget;
                    const damage = (player.spellPower * 0.8 + 15) * spellScale(1);
                    createParticle(target.wx, target.wy, '#eab308', 60, 6);
                    damageEnemy(target, damage, '#ef4444');
                    break;
                }
                case 2:
                    AudioSys.playCastFire();
                    selectedTarget.aggro = true;
                    activeProjectiles.push({type: 'fireball', wx: player.wx, wy: player.wy,
                        targetEnemy: selectedTarget, damage: player.spellPower * 2.2 * spellScale(2), speed: 450});
                    break;
                case 3: {
                    AudioSys.playHeal();
                    const before = player.hp;
                    player.hp = Math.min(player.maxHp, player.hp + (45 + player.spellPower) * spellScale(3));
                    addFloatingText(`+${Math.round(player.hp - before)} Vida`, player.wx, player.wy, '#4ade80');
                    for (let i = 0; i < 14; i++) createParticle(player.wx, player.wy, '#4ade80', 50, 5);
                    break;
                }
                case 4:
                    player.shieldActive = true; player.shieldTimer = 6;
                    addFloatingText('¡Escudo Divino!', player.wx, player.wy, '#facc15');
                    for (let i = 0; i < 18; i++) createParticle(player.wx, player.wy, '#facc15', 70, 6);
                    break;
                case 5:
                    AudioSys.playCastFire();
                    areaTargets.forEach(e => {
                        damageEnemy(e, player.spellPower * 3 * spellScale(5), '#f97316');
                        for (let i = 0; i < 12; i++) createParticle(e.wx, e.wy, '#f97316', 90, 8);
                    });
                    break;
            }
            updateHUDUI();
        }

        function damageEnemy(enemy, damage, color) {
            if (!enemy || enemy.hp <= 0) return;
            if (enemy.returning) return;
            enemy.aggro = true;
            enemy.hp = Math.max(0, enemy.hp - damage);
            addFloatingText(`-${Math.round(damage)}`, enemy.wx, enemy.wy, color);
            if (enemy.hp <= 0) handleEnemyDeath(enemy);
        }

    

        /* -------------------------------------------------------------
         * MODAL UI RENDERERS
         * ------------------------------------------------------------- */
        function renderActiveWindowUI() {
            if (activeWindow === 'inventory') renderInventoryUI();
            else if (activeWindow === 'talents') renderTalentsUI();
            else if (activeWindow === 'spells') renderSpellbookUI();
            else if (activeWindow === 'shop') renderShopUI();
            else if (activeWindow === 'trainer') renderTrainerUI();
            else if (activeWindow === 'quest') renderQuestUI();
            else if (activeWindow === 'map') renderMapUI();
            else if (activeWindow === 'controls') renderControlsUI();
            else if (activeWindow === 'appmenu') renderKeyboardMenu();
        }

        function updateKeyboardHints() {
            const key = id => KeyboardControls.label(KeyboardControls.bindings[id]);
            const text = `${key('moveUp')}/${key('moveLeft')}/${key('moveDown')}/${key('moveRight')}: mover/seleccionar · ${[1,2,3,4,5].map(n=>key('spell'+n)).join('/')}: habilidades · ${key('interact')}: interactuar · ${key('confirm')}: confirmar · ${key('menu')}: menú/volver. ${key('inventory')}: mochila · ${key('talents')}: talentos · ${key('spellbook')}: habilidades · ${key('quest')}: misión · ${key('map')}: mapa · ${key('pause')}: pausa · ${key('help')}: ayuda. Personaliza las teclas en el menú.`;
            document.getElementById('keyboard-menu-guide').textContent = text;
            document.getElementById('keyboard-help-guide').textContent = text;
        }
        function renderControlsUI() {
            const list = document.getElementById('controls-list'); list.innerHTML = '';
            menuIndex = Math.max(0,Math.min(menuIndex,KeyboardControls.actions.length + 1));
            const rows = [...KeyboardControls.actions, ['reset','Restablecer teclas iniciales'],['back','Volver al menú']];
            rows.forEach(([id,label],index) => {
                const button = document.createElement('button'); button.className = 'wow-btn' + (index === menuIndex ? ' selected' : '');
                const name = document.createElement('span'); name.textContent = label; button.appendChild(name);
                if (KeyboardControls.bindings[id]) { const badge = document.createElement('kbd'); badge.textContent = KeyboardControls.label(KeyboardControls.bindings[id]); button.appendChild(badge); }
                button.onclick = () => { menuIndex=index; executeMenuSelection(); };
                button.onfocus = () => { menuIndex=index; };
                list.appendChild(button);
            });
            const selected = list.children[menuIndex]; if (selected && selected.scrollIntoView) selected.scrollIntoView({block:'nearest'});
            document.getElementById('control-status').textContent = pendingControlAction ? `Pulsa una tecla para «${KeyboardControls.actions.find(([id])=>id===pendingControlAction)[1]}». Esc cancela. ${controlNotice}` : controlNotice || KeyboardControls.notice || 'Configuración inicial para la mano izquierda.';
            const key = id => KeyboardControls.label(KeyboardControls.bindings[id]);
            document.getElementById('controls-nav').textContent = `${key('moveUp')}/${key('moveDown')}: seleccionar · ${key('confirm')} o Enter: cambiar · ${key('menu')}: volver · Esc: cerrar`;
        }

        function renderInventoryUI() {
            const grid = document.getElementById('inv-grid');
            grid.innerHTML = '';
            menuIndex = Math.max(0, Math.min(inventory.length - 1, menuIndex));

            inventory.forEach((item, idx) => {
                const isSelected = idx === menuIndex;
                const slot = document.createElement('div');
                slot.className = `p-3 rounded-lg border flex flex-col items-center justify-center cursor-pointer relative ${
                    isSelected ? 'bg-amber-900/70 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-900/80 border-amber-800/50'
                }`;
                slot.innerHTML = `
                    <span class="text-3xl">${item.icon}</span>
                    <span class="text-[10px] font-bold text-amber-200 mt-1 text-center truncate w-full">${item.name}</span>
                    <span class="text-[10px] text-amber-400 text-center">${equippedWeapon === item ? '✓ Equipado' : item.desc}</span>
                `;
                slot.onclick = () => { menuIndex = idx; executeMenuSelection(); };
                slot.onfocus = () => { menuIndex = idx; };
                slot.setAttribute('role', 'button'); slot.tabIndex = 0;
                grid.appendChild(slot);
            });
        }

        function renderTalentsUI() {
            document.getElementById('talent-points-count').innerText = player.talentPoints;
            document.getElementById('stat-maxhp').innerText = player.maxHp;
            document.getElementById('stat-maxmp').innerText = player.maxMp;
            document.getElementById('stat-spellpower').innerText = player.spellPower;
            document.getElementById('stat-armor').innerText = player.armor;

            const container = document.getElementById('talent-list');
            container.innerHTML = '';
            menuIndex = Math.max(0, Math.min(talents.length - 1, menuIndex));

            talents.forEach((talent, idx) => {
                const isSelected = idx === menuIndex;
                const div = document.createElement('div');
                div.className = `p-2.5 rounded-lg border flex justify-between items-center ${
                    isSelected ? 'bg-amber-900/70 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-900/80 border-amber-800/50'
                }`;
                div.innerHTML = `
                    <div>
                        <div class="font-bold text-amber-200 text-xs">${talent.name}</div>
                        <div class="text-[11px] text-amber-400/80">${talent.desc}</div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-mono text-amber-300 font-bold block">${talent.points} / ${talent.maxPoints}</span>
                        <span class="text-[10px] ${talent.points < talent.maxPoints && player.talentPoints > 0 ? 'text-green-400 font-bold' : 'text-gray-500'}">[ENTER] Aprender</span>
                    </div>
                `;
                makeMenuRow(div, idx);
                container.appendChild(div);
            });
        }

        const spellbookData = [
            { name: '1: Golpe de Espada', icon: '⚔️', desc: '0 maná · 0,5 s de recarga · alcance 125. También con Espacio.' },
            { name: '2: Bola de Fuego', icon: '🔥', desc: '15 maná · 2 s de recarga · alcance 400. Sigue al objetivo.' },
            { name: '3: Luz Sagrada', icon: '✨', desc: '25 maná · 6 s de recarga. Cura al instante; no se gasta si tienes toda la vida.' },
            { name: '4: Escudo Divino', icon: '🛡️', desc: '30 maná · 12 s de recarga. Inmunidad durante 6 segundos.' },
            { name: '5: Meteorito Devastador', icon: '☄️', desc: '40 maná · 10 s de recarga. Daña a todos los enemigos a 300 de distancia.' }
        ];

        function renderSpellbookUI() {
            const container = document.getElementById('spellbook-list');
            container.innerHTML = '';
            spellbookData.forEach(sb => {
                const div = document.createElement('div');
                div.className = 'p-3 rounded-lg border border-amber-800/50 bg-slate-900/80 flex items-center gap-3';
                div.innerHTML = `
                    <span class="text-3xl">${sb.icon}</span>
                    <div>
                        <div class="font-bold text-amber-200 text-sm">${sb.name}</div>
                        <div class="text-xs text-amber-400/80">${sb.desc}</div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        const shopCatalog = [
            { id: 1, name: 'Poción de Vida Mayor', icon: '🧪', cost: 15, type: 'consumable', value: 60, desc: '+60 Vida' },
            { id: 2, name: 'Poción de Maná Grande', icon: '🧪', cost: 20, type: 'consumable_mp', value: 50, desc: '+50 Maná' },
            { id: 3, name: 'Martillo del Juicio', icon: '🔨', cost: 80, type: 'gear', sp: 18, desc: '+18 Poder de Ataque' }
        ];

        function renderShopUI() {
            document.getElementById('shop-player-gold').innerText = `${player.gold}g`;
            const container = document.getElementById('shop-item-list');
            container.innerHTML = '';
            menuIndex = Math.max(0, Math.min(shopCatalog.length - 1, menuIndex));

            shopCatalog.forEach((item, idx) => {
                const isSelected = idx === menuIndex;
                const div = document.createElement('div');
                div.className = `p-3 rounded-lg border flex justify-between items-center ${
                    isSelected ? 'bg-amber-900/70 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-900/80 border-amber-800/50'
                }`;
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${item.icon}</span>
                        <div>
                            <div class="font-bold text-amber-200 text-sm">${item.name}</div>
                            <div class="text-xs text-amber-400/80">${item.desc}${item.type === 'gear' ? ' · mejora neta: ' + signed(item.sp - (equippedWeapon ? equippedWeapon.sp : 0)) : ''}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-yellow-400 font-bold text-sm">🪙 ${item.cost}g</div>
                        <span class="text-[10px] ${player.gold >= item.cost ? 'text-green-400 font-bold' : 'text-red-400'}">${item.type === 'gear' && inventory.some(i => i.name === item.name) ? 'Ya lo tienes' : '[ENTER] Comprar'}</span>
                    </div>
                `;
                makeMenuRow(div, idx);
                container.appendChild(div);
            });
        }

        function signed(n) { return (n >= 0 ? '+' : '') + n; }
        function makeMenuRow(element, index) {
            element.style.cursor = 'pointer'; element.setAttribute('role', 'button'); element.tabIndex = 0;
            element.onclick = () => { menuIndex = index; executeMenuSelection(); };
            element.onfocus = () => { menuIndex = index; };
        }
        const MAX_SPELL_LEVEL = 5;
        const spellUpgrades = [
            { num: 1, name: 'Aumentar Golpe de Espada', icon: '⚔️', cost: 25 },
            { num: 2, name: 'Aumentar Bola de Fuego', icon: '🔥', cost: 35 },
            { num: 3, name: 'Aumentar Luz Sagrada', icon: '✨', cost: 45 },
            { num: 5, name: 'Aumentar Meteorito Devastador', icon: '☄️', cost: 60 }
        ];

        function renderTrainerUI() {
            const container = document.getElementById('trainer-spells-list');
            container.innerHTML = '';
            menuIndex = Math.max(0, Math.min(spellUpgrades.length - 1, menuIndex));

            spellUpgrades.forEach((upg, idx) => {
                const isSelected = idx === menuIndex;
                const curLvl = player.spellLevels[upg.num];
                const div = document.createElement('div');
                div.className = `p-3 rounded-lg border flex justify-between items-center ${
                    isSelected ? 'bg-amber-900/70 border-amber-300 ring-2 ring-amber-400' : 'bg-slate-900/80 border-amber-800/50'
                }`;
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${upg.icon}</span>
                        <div>
                            <div class="font-bold text-amber-200 text-sm">${upg.name} (Nivel ${curLvl})</div>
                            <div class="text-xs text-amber-400/80">+25% de la potencia base por nivel</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-yellow-400 font-bold text-sm">🪙 ${curLvl >= MAX_SPELL_LEVEL ? 'Máximo' : upg.cost * curLvl + 'g'}</div>
                        <span class="text-[10px] ${player.gold >= upg.cost * curLvl ? 'text-green-400 font-bold' : 'text-red-400'}">${curLvl >= MAX_SPELL_LEVEL ? 'Nivel máximo' : '[ENTER] Entrenar'}</span>
                    </div>
                `;
                makeMenuRow(div, idx);
                container.appendChild(div);
            });
        }

        function nearCommander() {
            const npc = npcs.find(n => n.id === 'questgiver');
            return Math.hypot(player.wx - npc.wx, player.wy - npc.wy) <= 90;
        }
        function renderQuestUI() {
            const progText = document.getElementById('quest-progress-text');
            const btn = document.getElementById('quest-action-btn');

            if (!questState.active && !questState.completed) {
                progText.innerText = "Misión sin aceptar.";
                btn.innerText = "Aceptar Misión [ENTER]";
                btn.disabled = false;
            } else if (questState.active && !questState.completed) {
                progText.innerText = `Progreso: ${questState.currentKills} / ${questState.requiredKills} enemigos comunes.`;
                btn.innerText = "En Progreso...";
                btn.disabled = true;
            } else if (questState.completed && !questState.rewardClaimed) {
                progText.innerText = "¡Misión lista para entregar!";
                btn.innerText = "Reclamar Recompensa [ENTER]";
                btn.disabled = false;
            } else {
                progText.innerText = "Misión completada. Recompensa otorgada.";
                btn.innerText = "Completada";
                btn.disabled = true;
            }
            if (!nearCommander() && (!questState.active || (questState.completed && !questState.rewardClaimed))) {
                btn.innerText = 'Vuelve al comandante para hablar'; btn.disabled = true;
            }
        }

        function handleQuestAction() {
            if (!nearCommander()) { addFloatingText('Vuelve al comandante de la villa.', player.wx, player.wy, '#fde047'); return; }
            if (!questState.active && !questState.completed) {
                questState.active = true;
                addFloatingText("¡Misión Aceptada!", player.wx, player.wy, '#f59e0b');
                closeAllWindows();
            } else if (questState.completed && !questState.rewardClaimed) {
                questState.rewardClaimed = true;
                player.gold += 60;
                addXp(120);
                AudioSys.playGold();
                addFloatingText("+60g +120XP Recompensa", player.wx, player.wy, '#eab308');
                closeAllWindows();
            }
        }

        function executeMenuSelection() {
            if (activeWindow === 'controls') {
                const row = KeyboardControls.actions[menuIndex];
                if (row) { pendingControlAction=row[0]; controlNotice=''; }
                else if (menuIndex === KeyboardControls.actions.length) { KeyboardControls.reset(); clearMovement(); updateKeyboardHints(); controlNotice=KeyboardControls.notice; }
                else { openWindow('appmenu'); return; }
                renderControlsUI(); return;
            }
            if (activeWindow === 'appmenu') { const button = keyboardMenuButtons()[menuIndex]; if (button) button.click(); return; }
            if (activeWindow === 'help') { closeAllWindows(); return; }
            if (activeWindow === 'map' || activeWindow === 'spells') { closeAllWindows(); return; }
            if (activeWindow === 'inventory') {
                const item = inventory[menuIndex];
                if (item) {
                    if (item.type === 'consumable') {
                        if (player.hp >= player.maxHp) { addFloatingText('Vida completa: poción conservada.', player.wx, player.wy, '#4ade80'); return; }
                        const before = player.hp;
                        player.hp = Math.min(player.maxHp, player.hp + item.value);
                        addFloatingText(`+${Math.round(player.hp - before)} Vida`, player.wx, player.wy, '#22c55e');
                        inventory.splice(menuIndex, 1);
                    } else if (item.type === 'consumable_mp') {
                        if (player.mp >= player.maxMp) { addFloatingText('Maná completo: poción conservada.', player.wx, player.wy, '#60a5fa'); return; }
                        const before = player.mp;
                        player.mp = Math.min(player.maxMp, player.mp + item.value);
                        addFloatingText(`+${Math.round(player.mp - before)} Maná`, player.wx, player.wy, '#3b82f6');
                        inventory.splice(menuIndex, 1);
                    } else if (item.type === 'gear') {
                        if (equippedWeapon === item) {
                            addFloatingText('Ya está equipado', player.wx, player.wy, '#eab308');
                        } else {
                            player.spellPower -= equippedWeapon ? equippedWeapon.sp : 0;
                            equippedWeapon = item;
                            player.spellPower += item.sp;
                            addFloatingText(`Equipado: ${item.name}`, player.wx, player.wy, '#eab308');
                        }
                    }
                    renderInventoryUI();
                }
            } else if (activeWindow === 'talents') {
                const talent = talents[menuIndex];
                if (talent && player.talentPoints > 0 && talent.points < talent.maxPoints) {
                    player.talentPoints--;
                    talent.points++;
                    talent.apply();
                    addFloatingText("¡Talento Aprendido!", player.wx, player.wy, '#f59e0b');
                    renderTalentsUI();
                } else if (talent) {
                    addFloatingText(talent.points >= talent.maxPoints ? 'Talento al máximo.' : 'Sube de nivel para obtener un punto.', player.wx, player.wy, '#fde047');
                }
            } else if (activeWindow === 'shop') {
                const item = shopCatalog[menuIndex];
                if (item && item.type === 'gear' && inventory.some(i => i.name === item.name)) {
                    addFloatingText('Ya tienes ese equipo.', player.wx, player.wy, '#fde047'); return;
                }
                if (inventory.length >= 500) { addFloatingText('Inventario lleno.', player.wx, player.wy, '#fde047'); return; }
                if (item && player.gold >= item.cost) {
                    player.gold -= item.cost;
                    inventory.push({ ...item });
                    AudioSys.playGold();
                    addFloatingText(`Comprado: ${item.name}`, player.wx, player.wy, '#eab308');
                    renderShopUI();
                } else if (item) {
                    addFloatingText('Necesitas más oro.', player.wx, player.wy, '#fde047');
                }
            } else if (activeWindow === 'trainer') {
                const upg = spellUpgrades[menuIndex];
                if (!upg) return;
                if (player.spellLevels[upg.num] >= MAX_SPELL_LEVEL) { addFloatingText('Habilidad al máximo.', player.wx, player.wy, '#fde047'); return; }
                const cost = upg.cost * player.spellLevels[upg.num];
                if (player.gold >= cost) {
                    player.gold -= cost;
                    player.spellLevels[upg.num]++;
                    AudioSys.playLevelUp();
                    addFloatingText(`¡Habilidad Nivel ${player.spellLevels[upg.num]}!`, player.wx, player.wy, '#c084fc');
                    renderTrainerUI();
                } else {
                    addFloatingText('Necesitas más oro.', player.wx, player.wy, '#fde047');
                }
            } else if (activeWindow === 'quest') {
                handleQuestAction();
            }
            updateHUDUI(); saveGame();
        }
    

        /* -------------------------------------------------------------
         * ENEMY AI & KILL SYSTEM
         * ------------------------------------------------------------- */
        function handleEnemyDeath(enemy) {
            if (enemy.respawnRemaining > 0) return;
            enemy.hp = 0;
            enemy.respawnRemaining = enemy.type === 'boss' ? 30 : 8;
            enemy.aggro = false; enemy.returning = false; enemy.telegraph = null;
            if (enemy.type === 'boss') { bossDefeated = true; addFloatingText('¡Señor Demonio derrotado! El ciclo de la demo está completo.', player.wx, player.wy, '#facc15'); }
            AudioSys.playGold();
            spawnLoot(enemy.wx, enemy.wy, enemy.gold);
            addXp(enemy.xp);

            // Quest Tracking
            if (enemy.type !== 'boss' && questState.active && !questState.completed) {
                questState.currentKills++;
                if (questState.currentKills >= questState.requiredKills) {
                    questState.completed = true;
                    addFloatingText("¡Misión Completada!", player.wx, player.wy, '#f59e0b');
                }
            }

            // Reaparición tras 8 segundos de juego, suspendida durante la pausa.
            if (selectedTarget === enemy) selectedTarget = null;
        }

        function addXp(amount) {
            player.xp += amount;
            while (player.xp >= player.nextXp) {
                player.xp -= player.nextXp;
                player.level++;
                player.nextXp = Math.floor(player.nextXp * 1.5);
                player.maxHp += 25;
                player.hp = player.maxHp;
                player.maxMp += 15;
                player.mp = player.maxMp;
                player.talentPoints++;
                AudioSys.playLevelUp();
                addFloatingText("¡NIVEL SUBIDO!", player.wx, player.wy - 30, '#f59e0b');
            }
        }

        function receiveDamage(amount) {
            if (player.shieldActive) { addFloatingText('¡Inmune!', player.wx, player.wy, '#facc15'); return false; }
            const damage = Math.max(3, Math.round(amount - player.armor * 0.35));
            player.hp = Math.max(0, player.hp - damage); lastDamageTimer = 5;
            AudioSys.playHit(); addFloatingText(`-${damage}`, player.wx, player.wy, '#ef4444');
            if (player.hp <= 0) {
                player.hp = player.maxHp; player.mp = player.maxMp;
                player.wx = 300; player.wy = 300; player.shieldActive = false; player.shieldTimer = 0;
                clearMovement(); selectedTarget = null; activeProjectiles = [];
                enemies.forEach(e => { if (e.hp > 0) e.returning = true; e.aggro = false; e.telegraph = null; });
                addFloatingText('Has caído. Revives en la villa conservando tu progreso.', player.wx, player.wy, '#f87171');
                return true;
            }
            return false;
        }
        function updateEnemies(dt) {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) {
                    enemy.respawnRemaining = Math.max(0, enemy.respawnRemaining - dt);
                    if (enemy.respawnRemaining <= 0) {
                        enemy.hp = enemy.maxHp; enemy.wx = enemy.spawnWx; enemy.wy = enemy.spawnWy;
                        enemy.attackCd = 0; enemy.aggro = false; enemy.returning = false; enemy.smashCd = 2;
                    }
                    continue;
                }
                enemy.attackCd = Math.max(0, (enemy.attackCd || 0) - dt);
                enemy.smashCd = Math.max(0, (enemy.smashCd || 0) - dt);
                const dist = Math.hypot(player.wx - enemy.wx, player.wy - enemy.wy);
                const homeDist = Math.hypot(enemy.wx - enemy.spawnWx, enemy.wy - enemy.spawnWy);
                if (homeDist > 600 || (enemy.aggro && (dist > 650 || isInTown()))) { enemy.returning = true; enemy.aggro = false; enemy.telegraph = null; }
                if (enemy.returning) {
                    const dx = enemy.spawnWx - enemy.wx, dy = enemy.spawnWy - enemy.wy;
                    const home = Math.hypot(dx, dy), step = 190 * dt;
                    if (home <= step) { enemy.wx = enemy.spawnWx; enemy.wy = enemy.spawnWy; enemy.hp = enemy.maxHp; enemy.returning = false; }
                    else moveEnemyToward(enemy, enemy.spawnWx, enemy.spawnWy, 190, dt);
                    continue;
                }
                if (dist <= 320 && !isInTown()) enemy.aggro = true;
                if (!enemy.aggro) continue;
                if (enemy.telegraph) {
                    enemy.telegraph.remaining -= dt;
                    if (enemy.telegraph.remaining <= 0) {
                        const attack = enemy.telegraph; enemy.telegraph = null;
                        for (let n = 0; n < 20; n++) createParticle(attack.wx, attack.wy, '#ef4444', 120, 7);
                        if (Math.hypot(player.wx - attack.wx, player.wy - attack.wy) <= attack.radius && receiveDamage(enemy.damage * 1.6)) break;
                    }
                    continue;
                }
                if (enemy.type === 'boss' && enemy.smashCd <= 0 && dist <= 400) {
                    enemy.telegraph = { wx: player.wx, wy: player.wy, radius: 105, remaining: 1.25 };
                    enemy.smashCd = 6; addFloatingText('¡Impacto oscuro! Sal del círculo rojo.', player.wx, player.wy, '#f87171');
                    continue;
                }
                if (dist > 45) {
                    const speed = enemy.type === 'boss' ? 130 : (enemy.lvl === 1 ? 165 : 145);
                    moveEnemyToward(enemy, player.wx, player.wy, speed, dt, 40);
                } else if (enemy.attackCd <= 0) {
                    enemy.attackCd = enemy.type === 'boss' ? 1.8 : 1.4;
                    if (receiveDamage(enemy.damage)) break;
                }
            }
        }

    

        /* -------------------------------------------------------------
         * ISOMETRIC MAP CANVAS DRAWING ('M' KEY)
         * ------------------------------------------------------------- */
        function resizeMapCanvas() {
            mapCanvas.width = mapCanvas.parentElement.clientWidth || 500;
            mapCanvas.height = mapCanvas.parentElement.clientHeight || 288;
        }
        function renderMapUI() {
            if (!mapCtx) return;
            const w = mapCanvas.width;
            const h = mapCanvas.height;
            mapCtx.fillStyle = '#0a0812';
            mapCtx.fillRect(0, 0, w, h);

            const scale = Math.max(1, Math.min(w, h) - 24) / MAP_WORLD_SIZE;
            mapCtx.save();
            mapCtx.translate((w - MAP_WORLD_SIZE * scale) / 2, (h - MAP_WORLD_SIZE * scale) / 2);
            mapCtx.strokeStyle = '#9a732a';
            mapCtx.strokeRect(0, 0, MAP_WORLD_SIZE * scale, MAP_WORLD_SIZE * scale);
            mapCtx.fillStyle = '#263e55';
            mapCtx.fillRect(0, 0, TOWN_BOUNDARY * scale, TOWN_BOUNDARY * scale);

            // Draw Scenery Props
            mapCtx.fillStyle = '#15803d';
            sceneryProps.forEach(prop => {
                mapCtx.fillRect(prop.wx * scale, prop.wy * scale, 3, 3);
            });

            // Draw NPCs
            npcs.forEach(npc => {
                mapCtx.fillStyle = '#facc15';
                mapCtx.beginPath();
                mapCtx.arc(npc.wx * scale, npc.wy * scale, 4, 0, Math.PI * 2);
                mapCtx.fill();
            });

            // Draw Enemies
            enemies.forEach(e => {
                if (e.hp > 0) {
                    mapCtx.fillStyle = e.type === 'boss' ? '#a855f7' : '#ef4444';
                    mapCtx.beginPath();
                    mapCtx.arc(e.wx * scale, e.wy * scale, e.type === 'boss' ? 6 : 3, 0, Math.PI * 2);
                    mapCtx.fill();
                }
            });

            // Draw Player
            mapCtx.fillStyle = '#3b82f6';
            mapCtx.beginPath();
            mapCtx.arc(player.wx * scale, player.wy * scale, 5, 0, Math.PI * 2);
            mapCtx.fill();
            mapCtx.restore();
        }

        /* -------------------------------------------------------------
         * REAL-TIME GAME LOOP & WARCRAFT III PHYSICS ENGINE
         * ------------------------------------------------------------- */
        let lastTime = performance.now();

        function updateGame(dt) {
            if (isGamePaused()) return;
            // 1. WARCRAFT III VECTOR PHYSICS & TURNING SPEED ENGINE
            if (!activeWindow) {
                let inputX = touchInput.x;
                let inputY = touchInput.y;

                // Entradas en coordenadas de pantalla; convertir a ejes del mundo.
                if (keys[KeyboardControls.bindings.moveUp]) inputY -= 1;
                if (keys[KeyboardControls.bindings.moveDown]) inputY += 1;
                if (keys[KeyboardControls.bindings.moveLeft]) inputX -= 1;
                if (keys[KeyboardControls.bindings.moveRight]) inputX += 1;

                const inputLen = Math.hypot(inputX, inputY);

                if (inputLen > 0) {
                    player.isMoving = true;
                    const screenX = inputX / inputLen, screenY = inputY / inputLen;
                    inputX = (screenX / Math.cos(Math.PI / 6) + screenY / 0.3) / 2;
                    inputY = (screenY / 0.3 - screenX / Math.cos(Math.PI / 6)) / 2;
                    const worldLen = Math.hypot(inputX, inputY); inputX /= worldLen; inputY /= worldLen;

                    // Desired target angle based on WASD direction
                    player.targetFacing = Math.atan2(inputY, inputX);

                    // Smooth Warcraft III Angular Rotation towards Target Facing
                    let angleDiff = player.targetFacing - player.currentFacing;
                    
                    // Normalize angle difference to [-PI, PI]
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                    // Rotate facing angle gradually according to turnRate
                    const turnStep = player.turnRate * dt;
                    if (Math.abs(angleDiff) <= turnStep) {
                        player.currentFacing = player.targetFacing;
                    } else {
                        player.currentFacing += Math.sign(angleDiff) * turnStep;
                    }

                    // Apply Acceleration along current facing vector (WC3 style movement)
                    // El giro suaviza el indicador visual; WASD conserva una respuesta directa.
                    const forwardX = inputX;
                    const forwardY = inputY;

                    const desiredVx = forwardX * player.maxSpeed * Math.min(1, inputLen), desiredVy = forwardY * player.maxSpeed * Math.min(1, inputLen);
                    const dvx = desiredVx - player.vx, dvy = desiredVy - player.vy;
                    const delta = Math.hypot(dvx, dvy), step = player.acceleration * dt;
                    if (delta > 0) {
                        const ratio = Math.min(1, step / delta);
                        player.vx += dvx * ratio; player.vy += dvy * ratio;
                    }

                    // Running footsteps sound & dust FX
                    player.stepSoundTimer += dt;
                    if (player.stepSoundTimer >= 0.22) {
                        player.stepSoundTimer = 0;
                        AudioSys.playFootstep();
                        addFootstep(player.wx, player.wy);
                    }

                    // Walk cycle wobble
                    player.animCycle += dt * 12;
                } else {
                    player.isMoving = false;
                    player.animCycle = 0;
                }
            } else {
                player.isMoving = false;
            }

            // Apply Ground Drag / Friction
            if (!player.isMoving) {
                const drag = Math.exp(-player.friction * dt);
                player.vx *= drag; player.vy *= drag;
                if (Math.hypot(player.vx, player.vy) < 1) { player.vx = 0; player.vy = 0; }
            }

            // Cap Speed to Max Speed
            player.currentSpeed = Math.hypot(player.vx, player.vy);
            if (player.currentSpeed > player.maxSpeed) {
                player.vx = (player.vx / player.currentSpeed) * player.maxSpeed;
                player.vy = (player.vy / player.currentSpeed) * player.maxSpeed;
                player.currentSpeed = player.maxSpeed;
            }

            // Update Player World Coordinates
            player.wx += player.vx * dt;
            player.wy += player.vy * dt;

            resolveSceneryCollision(player);
            // Map Bounds Collision
            player.wx = Math.max(60, Math.min(MAP_WORLD_SIZE - 60, player.wx));
            player.wy = Math.max(60, Math.min(MAP_WORLD_SIZE - 60, player.wy));

            // 2. SMOOTH RTS CAMERA SPRING DAMPENING (WARCRAFT III CAMERA FOLLOW)
            camera.wx += (player.wx - camera.wx) * camera.dampening * dt;
            camera.wy += (player.wy - camera.wy) * camera.dampening * dt;

            lastDamageTimer = Math.max(0, lastDamageTimer - dt);
            const restingInTown = isInTown() && lastDamageTimer <= 0 &&
                !enemies.some(e => e.hp > 0 && e.aggro && !e.returning && Math.hypot(player.wx - e.wx, player.wy - e.wy) < 400);
            if (restingInTown) player.hp = Math.min(player.maxHp, player.hp + 8 * dt);
            player.mp = Math.min(player.maxMp, player.mp + (player.mpRegen + (restingInTown ? 3 : 0)) * dt);
            for (let i = groundLoot.length - 1; i >= 0; i--) {
                const loot = groundLoot[i];
                if (Math.hypot(player.wx - loot.wx, player.wy - loot.wy) <= 45) {
                    player.gold += loot.gold; groundLoot.splice(i, 1); AudioSys.playGold();
                    addFloatingText(`+${loot.gold}g Oro`, player.wx, player.wy, '#facc15');
                }
            }

            // Shield Timer update
            if (player.shieldActive) {
                player.shieldTimer = Math.max(0, player.shieldTimer - dt);
                if (player.shieldTimer <= 0) player.shieldActive = false;
            }

            // Action Cooldowns
            for (let k in player.cds) {
                if (player.cds[k] > 0) {
                    player.cds[k] = Math.max(0, player.cds[k] - dt);

                }
            }

            // Espada mantenida: una acción por recarga, sin mensajes por cada fotograma.
            if (touchInput.attack && player.cds[1] === 0 && !isInTown() &&
                enemies.some(e => e.hp > 0 && !e.returning && Math.hypot(player.wx - e.wx, player.wy - e.wy) <= 125)) castSpell(1);

            // Actualización sin eliminar elementos durante un recorrido hacia delante.
            footstepFX.forEach(fx => fx.life -= dt);
            footstepFX = footstepFX.filter(fx => fx.life > 0);
            for (let i = activeProjectiles.length - 1; i >= 0; i--) {
                const p = activeProjectiles[i];
                if (!p.targetEnemy || p.targetEnemy.hp <= 0) {
                    activeProjectiles.splice(i, 1); continue;
                }
                const dx = p.targetEnemy.wx - p.wx;
                const dy = p.targetEnemy.wy - p.wy;
                const distance = Math.hypot(dx, dy);
                const step = p.speed * dt;
                if (distance <= Math.max(20, step)) {
                    damageEnemy(p.targetEnemy, p.damage, '#f97316');
                    for (let n = 0; n < 8; n++) createParticle(p.targetEnemy.wx, p.targetEnemy.wy, '#f97316', 80, 6);
                    activeProjectiles.splice(i, 1);
                } else {
                    p.wx += dx / distance * step;
                    p.wy += dy / distance * step;
                }
            }
            particles.forEach(part => {
                part.wx += part.vx * dt; part.wy += part.vy * dt; part.life -= dt;
            });
            particles = particles.filter(part => part.life > 0);
            floatingTexts.forEach(ft => { ft.wy -= 40 * dt; ft.life -= dt; });
            floatingTexts = floatingTexts.filter(ft => ft.life > 0);

            // Enemy AI Update
            updateEnemies(dt);

            // HUD Refresh
            hudTimer += dt;
            if (hudTimer >= 0.1) { hudTimer = 0; updateHUDUI(); }
            saveTimer += dt;
            if (saveTimer >= 5) { saveTimer = 0; saveGame(); }
        }

        function updateHUDUI() {
            updateGuidance();
            for (const k of Object.keys(SPELL_CDS)) {
                const cd = document.getElementById(`cd-${k}`);
                cd.style.height = `${player.cds[k] / SPELL_CDS[k] * 100}%`;
                cd.textContent = player.cds[k] > 0 ? player.cds[k].toFixed(1) : '';
                const slot = document.getElementById(`slot-${k}`);
                slot.classList.toggle('unavailable', player.mp < SPELL_COSTS[k]);
                slot.classList.toggle('buff-active', k === '4' && player.shieldActive);
            }
            document.getElementById('ui-player-level').innerText = player.level;
            document.getElementById('ui-gold-text').innerText = `🪙 ${player.gold}g`;
            document.getElementById('ui-hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
            document.getElementById('ui-hp-text').innerText = `${Math.round(player.hp)} / ${player.maxHp}`;
            document.getElementById('ui-mp-bar').style.width = `${(player.mp / player.maxMp) * 100}%`;
            document.getElementById('ui-mp-text').innerText = `${Math.round(player.mp)} / ${player.maxMp}`;
            document.getElementById('ui-xp-bar').style.width = `${(player.xp / player.nextXp) * 100}%`;
            document.getElementById('ui-xp-text').innerText = `XP: ${player.xp} / ${player.nextXp}`;

            // Target Unit Frame
            const targetFrame = document.getElementById('target-frame');
            if (selectedTarget && selectedTarget.hp > 0) {
                targetFrame.classList.remove('hidden');
                document.getElementById('ui-target-name').innerText = selectedTarget.name;
                document.getElementById('ui-target-lvl').innerText = `Nv ${selectedTarget.lvl}`;
                document.getElementById('ui-target-hp-bar').style.width = `${(selectedTarget.hp / selectedTarget.maxHp) * 100}%`;
                document.getElementById('ui-target-hp-text').innerText = `${Math.round(selectedTarget.hp)} / ${selectedTarget.maxHp}`;
            } else {
                targetFrame.classList.add('hidden');
            }
        }
    

        /* -------------------------------------------------------------
         * ISOMETRIC VIEWPORT CANVAS RENDERING ENGINE
         * ------------------------------------------------------------- */
        function drawScene() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Compute Camera Offset based on smooth RTS camera state
            const camIso = worldToIso(camera.wx, camera.wy);
            const cameraX = canvas.width / 2 - camIso.x;
            const cameraY = canvas.height / 2 - camIso.y;

            ctx.save();
            ctx.translate(cameraX, cameraY);

            // 1. Render Isometric Terrain Floor Tiles
            const gridSize = 120;
            for (let wx = 0; wx < MAP_WORLD_SIZE; wx += gridSize) {
                for (let wy = 0; wy < MAP_WORLD_SIZE; wy += gridSize) {
                    const iso = worldToIso(wx, wy);
                    if (iso.x + cameraX < -160 || iso.x + cameraX > canvas.width + 160 || iso.y + cameraY < -100 || iso.y + cameraY > canvas.height + 100) continue;
                    ctx.beginPath();
                    ctx.moveTo(iso.x, iso.y);
                    const corner1 = worldToIso(wx + gridSize, wy);
                    const corner2 = worldToIso(wx + gridSize, wy + gridSize);
                    const corner3 = worldToIso(wx, wy + gridSize);
                    ctx.lineTo(corner1.x, corner1.y);
                    ctx.lineTo(corner2.x, corner2.y);
                    ctx.lineTo(corner3.x, corner3.y);
                    ctx.closePath();

                    // Tile Styles
                    if (isInTown(wx, wy)) ctx.fillStyle = '#262f3d'; // Town Stone Plaza
                    else if ((wx + wy) % 240 === 0) ctx.fillStyle = '#182d1b'; // Lush Grass
                    else ctx.fillStyle = '#142416'; // Dark Forest Grass

                    ctx.fill();
                    ctx.strokeStyle = '#09120a';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // 2. Render Footstep Dust Trail FX
            footstepFX.forEach(fx => {
                const fIso = worldToIso(fx.wx, fx.wy);
                const alpha = fx.life / fx.maxLife;
                ctx.fillStyle = `rgba(180, 150, 100, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.ellipse(fIso.x, fIso.y + 8, 8, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. Render Ground Loot Drops
            groundLoot.forEach(loot => {
                const lIso = worldToIso(loot.wx, loot.wy);
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(loot.icon, lIso.x, lIso.y);
                ctx.font = 'bold 10px sans-serif';
                ctx.fillStyle = '#fde047';
                ctx.fillText(loot.name, lIso.x, lIso.y - 14);
            });

            // Marcas de ataque del jefe: se dibujan en el suelo, debajo de las unidades.
            enemies.forEach(e => {
                if (!e.telegraph) return;
                const point = worldToIso(e.telegraph.wx, e.telegraph.wy);
                const radius = e.telegraph.radius;
                ctx.fillStyle = 'rgba(239,68,68,.22)'; ctx.strokeStyle = '#ff6161'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(point.x, point.y, radius * Math.SQRT2 * Math.cos(Math.PI / 6), radius * Math.SQRT2 * 0.3, 0, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fecaca';
                ctx.fillText('¡APÁRTATE!', point.x, point.y - 12);
            });

            // Una sola lista ordenada por profundidad para evitar dibujar al héroe sobre todos los árboles.
            const entities = [...sceneryProps.map(e => ({ e, kind: 'prop' })), ...npcs.map(e => ({ e, kind: 'npc' })),
                ...enemies.filter(e => e.hp > 0).map(e => ({ e, kind: 'enemy' })), { e: player, kind: 'player' }];
            entities.sort((a, b) => (a.e.wx + a.e.wy) - (b.e.wx + b.e.wy));
            entities.forEach(({e, kind}) => {
                const point = worldToIso(e.wx, e.wy);
                if (point.x + cameraX < -100 || point.x + cameraX > canvas.width + 100 || point.y + cameraY < -100 || point.y + cameraY > canvas.height + 100) return;
                ctx.save(); ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath();
                ctx.ellipse(point.x, point.y + 10, kind === 'prop' ? 20 * e.scale : 16, kind === 'prop' ? 10 * e.scale : 8, 0, 0, Math.PI * 2); ctx.fill();
                if (kind === 'enemy' && selectedTarget === e) {
                    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(point.x, point.y + 10, 20, 10, 0, 0, Math.PI * 2); ctx.stroke();
                }
                if (kind === 'player') {
                    const facing = worldToIso(e.wx + Math.cos(e.currentFacing) * 30, e.wy + Math.sin(e.currentFacing) * 30);
                    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(point.x, point.y + 8); ctx.lineTo(facing.x, facing.y + 8); ctx.stroke();
                    if (e.shieldActive) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(point.x, point.y + 8, 26, 13, 0, 0, Math.PI * 2); ctx.stroke(); }
                }
                ctx.font = `${kind === 'prop' ? Math.round(36 * e.scale) : (kind === 'player' ? 34 : (e.type === 'boss' ? 38 : 28))}px sans-serif`;
                const bounce = kind === 'player' && e.isMoving ? Math.sin(e.animCycle) * 4 : 0;
                ctx.fillText(kind === 'player' ? '🛡️' : e.icon, point.x, point.y + 4 + bounce);
                if (kind === 'npc') {
                    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fde047'; ctx.fillText(e.name, point.x, point.y - 24);
                    if (e.id === 'questgiver') {
                        ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#eab308';
                        ctx.fillText(questState.rewardClaimed ? '✓' : (questState.completed ? '❓' : (questState.active ? '…' : '❗')), point.x, point.y - 42);
                    }
                }
                if (kind === 'enemy') {
                    const width = e.type === 'boss' ? 60 : 36;
                    ctx.fillStyle = '#09070c'; ctx.fillRect(point.x - width / 2, point.y - 28, width, 4);
                    ctx.fillStyle = e.returning ? '#60a5fa' : '#ef4444'; ctx.fillRect(point.x - width / 2, point.y - 28, e.hp / e.maxHp * width, 4);
                    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fecaca';
                    ctx.fillText(e.returning ? 'Regresando' : `${e.name} · Nv ${e.lvl}`, point.x, point.y - 34);
                }
                ctx.restore();
            });

            // 8. Render Spell Particles
            particles.forEach(part => {
                const partIso = worldToIso(part.wx, part.wy);
                ctx.fillStyle = part.color;
                ctx.beginPath();
                ctx.arc(partIso.x, partIso.y, part.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // 9. Render Active Projectiles
            activeProjectiles.forEach(p => {
                const prIso = worldToIso(p.wx, p.wy);
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(prIso.x, prIso.y, 7, 0, Math.PI * 2);
                ctx.fill();
            });

            // 10. Render Floating Combat Damage / Text
            floatingTexts.forEach(ft => {
                const ftIso = worldToIso(ft.wx, ft.wy);
                const isMessage = ft.text.length > 24;
                ctx.font = isMessage ? '700 12px sans-serif' : '800 15px sans-serif';
                ctx.fillStyle = ft.color;
                ctx.textAlign = 'center';
                if (isMessage) {
                    // Los avisos largos deben caber en una pantalla de teléfono.
                    const width = Math.min(300, canvas.width - 24), lines = [];
                    let line = '';
                    for (const word of ft.text.split(/\s+/)) {
                        const next = line ? line + ' ' + word : word;
                        if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
                        else line = next;
                    }
                    if (line) lines.push(line);
                    const screenX = Math.max(width / 2 + 12, Math.min(canvas.width - width / 2 - 12, ftIso.x + cameraX));
                    ctx.save(); ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
                    lines.forEach((text, index) => ctx.fillText(text, screenX - cameraX, ftIso.y + index * 16, width));
                    ctx.restore();
                } else ctx.fillText(ft.text, ftIso.x, ftIso.y);
            });

            ctx.restore();
        }

        // v0.2: pausa, colisiones y guardado local.
        let manualPaused = false;
        let focusPaused = false;
        let saveTimer = 0;
        let hudTimer = 0;
        let lastDamageTimer = 0;
        let bossDefeated = false;
        const SAVE_KEY = 'azeroth-chronicles-prototype-save-v2';
        const initialPlayer = JSON.parse(JSON.stringify(player));
        const initialEnemies = enemies.map(e => ({ ...e, spawnWx: e.wx, spawnWy: e.wy, respawnRemaining: 0, attackCd: 0 }));
        enemies.forEach(e => { e.spawnWx = e.wx; e.spawnWy = e.wy; e.respawnRemaining = 0; e.attackCd = 0; });
        const itemTemplates = [...inventory, ...shopCatalog].map(item => ({ ...item }));
        const initialInventory = inventory.map(item => ({ ...item }));

        function updateGuidance() {
            const objective = document.getElementById('objective-tracker');
            let text;
            if (!questState.active) text = 'Habla con el comandante de la villa. Usa Interactuar o E; consulta el mapa en el menú.';
            else if (!questState.completed) text = `Protege la villa: ${questState.currentKills}/${questState.requiredKills} enemigos comunes. Recoge su oro.`;
            else if (!questState.rewardClaimed) text = 'Vuelve al comandante para cobrar: 120 XP + 60g.';
            else if (!bossDefeated) text = 'Compra mejoras y desafía al Señor Demonio. Busca el punto morado en M.';
            else text = '¡Jefe vencido! Puedes seguir probando mejoras o empezar otra partida.';
            if (objective.textContent !== text) objective.textContent = text;
            const hint = document.getElementById('interaction-hint');
            const loot = groundLoot.find(l => Math.hypot(player.wx - l.wx, player.wy - l.wy) <= 75);
            const npc = npcs.find(n => Math.hypot(player.wx - n.wx, player.wy - n.wy) <= 90);
            const prompt = loot ? 'Interactuar: recoger oro · también se recoge al acercarte' : (npc ? 'Interactuar: ' + npc.name : '');
            if (hint.textContent !== prompt) hint.textContent = prompt;
        }
        function clearMovement() {
            for (const code in keys) keys[code] = false;
            touchInput.x = 0; touchInput.y = 0; touchInput.attack = false;
            if (window.resetTouchControls) window.resetTouchControls();
            player.vx = 0; player.vy = 0; player.currentSpeed = 0; player.isMoving = false;
        }
        function isGamePaused() { return !!(activeWindow || manualPaused || focusPaused || document.hidden); }
        function updatePauseUI() {
            document.getElementById('pause-button').textContent = manualPaused ? 'Continuar [P]' : 'Pausa [P]';
            const notice = document.getElementById('pause-notice');
            notice.hidden = !!activeWindow || !(manualPaused || focusPaused);
            notice.textContent = focusPaused ? 'PAUSA — Vuelve al juego para continuar' : 'PAUSA — Toca Continuar en el menú o pulsa P';
            document.getElementById('menu-pause-notice').hidden = !activeWindow;
            if (window.updateAppPauseUI) window.updateAppPauseUI();
        }
        function togglePause() { manualPaused = !manualPaused; clearMovement(); updatePauseUI(); }
        function resolveSceneryCollision(entity) {
            for (let pass = 0; pass < 4; pass++) for (const prop of sceneryProps) {
                const radius = (prop.icon === '🏛️' ? 48 : 22) * prop.scale + 14;
                const dx = entity.wx - prop.wx, dy = entity.wy - prop.wy;
                const distance = Math.hypot(dx, dy);
                if (distance < radius) {
                    const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
                    entity.wx = prop.wx + nx * radius; entity.wy = prop.wy + ny * radius;
                    if ('vx' in entity) {
                        const inward = entity.vx * nx + entity.vy * ny;
                        if (inward < 0) { entity.vx -= inward * nx; entity.vy -= inward * ny; }
                    }
                }
            }
        }
        function moveEnemyToward(entity, targetX, targetY, speed, dt, stopDistance = 0) {
            const dx = targetX - entity.wx, dy = targetY - entity.wy;
            const distance = Math.hypot(dx, dy);
            if (distance <= stopDistance) return;
            let angle = Math.atan2(dy, dx);
            const nx = dx / distance, ny = dy / distance;
            let obstacle = null, nearest = Infinity, side = 0, offset = 0;
            for (const prop of sceneryProps) {
                const radius = (prop.icon === '🏛️' ? 48 : 22) * prop.scale + 14;
                const px = prop.wx - entity.wx, py = prop.wy - entity.wy;
                const ahead = px * nx + py * ny, cross = nx * py - ny * px;
                if (ahead > 0 && ahead < Math.min(distance, radius + 150) && Math.abs(cross) < radius + 12 && ahead < nearest) {
                    obstacle = prop; nearest = ahead; side = cross >= 0 ? -1 : 1; offset = radius + 18 - Math.abs(cross);
                }
            }
            if (obstacle) {
                if (entity.avoiding !== obstacle) { entity.avoiding = obstacle; entity.avoidSide = side; }
                angle += entity.avoidSide * Math.atan2(offset, Math.max(20, nearest));
            } else entity.avoiding = null;
            const step = Math.min(speed * dt, distance - stopDistance);
            entity.wx += Math.cos(angle) * step; entity.wy += Math.sin(angle) * step;
            resolveSceneryCollision(entity);
        }
        function statusMessage(message) { document.getElementById('save-status').textContent = message; }
        function saveSnapshot() {
            return { version: 2, bossDefeated, lastDamageTimer, player: JSON.parse(JSON.stringify(player)),
                talents: talents.map(t => t.points), inventory: inventory.map(i => i.name),
                equipped: equippedWeapon ? inventory.indexOf(equippedWeapon) : -1,
                quest: { ...questState }, enemies: enemies.map(e => ({ id: e.id, wx: e.wx, wy: e.wy,
                    hp: e.hp, respawnRemaining: e.respawnRemaining, attackCd: e.attackCd || 0 })),
                loot: groundLoot.map(l => ({ wx: l.wx, wy: l.wy, gold: l.gold })) };
        }
        function saveGame(showMessage = false) {
            try {
                window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveSnapshot()));
                if (showMessage) statusMessage('Partida guardada en este navegador.');
                return true;
            } catch (_) {
                statusMessage('Guardado local no disponible. Usa Exportar para conservar la partida.');
                return false;
            }
        }
        function applySave(data) {
            // Validar todo antes de tocar la partida. Los objetos del inventario proceden del catálogo local.
            const number = (n, min, max, integer = false) => {
                if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) throw new Error('Valor inválido');
                return n;
            };
            if (!data || data.version !== 2 || !data.player || !data.quest) throw new Error('Formato desconocido');
            if (!Array.isArray(data.talents) || data.talents.length !== talents.length ||
                !Array.isArray(data.inventory) || data.inventory.length > 500 ||
                !Array.isArray(data.enemies) || data.enemies.length !== initialEnemies.length ||
                !Array.isArray(data.loot) || data.loot.length > 10000) throw new Error('Datos incompletos');
            const restoredBossDefeated = data.bossDefeated === true;
            const restoredDamageTimer = number(data.lastDamageTimer ?? 0, 0, 5);
            const p = data.player;
            const restored = { ...initialPlayer, cds: {}, spellLevels: {} };
            for (const key of ['wx','wy']) restored[key] = number(p[key], 60, MAP_WORLD_SIZE - 60);
            for (const key of ['level','nextXp']) restored[key] = number(p[key], 1, 1e15, true);
            for (const key of ['xp','gold','talentPoints']) restored[key] = number(p[key], 0, 1e15, true);
            if (restored.xp >= restored.nextXp) throw new Error('Experiencia inválida');
            for (const key of ['maxHp','maxMp','spellPower','armor','mpRegen','maxSpeed','acceleration']) restored[key] = number(p[key], 0, 1e15);
            if (restored.maxHp <= 0 || restored.maxMp <= 0) throw new Error('Atributos inválidos');
            restored.hp = number(p.hp, 0, restored.maxHp); restored.mp = number(p.mp, 0, restored.maxMp);
            restored.currentFacing = number(p.currentFacing, -1e6, 1e6);
            restored.shieldTimer = number(p.shieldTimer, 0, 6);
            if (typeof p.shieldActive !== 'boolean' || !p.cds || !p.spellLevels) throw new Error('Habilidades inválidas');
            restored.shieldActive = p.shieldActive && restored.shieldTimer > 0;
            for (const key of Object.keys(SPELL_COSTS)) {
                restored.cds[key] = number(p.cds[key], 0, SPELL_CDS[key]);
                restored.spellLevels[key] = number(p.spellLevels[key], 1, MAX_SPELL_LEVEL, true);
            }
            const points = data.talents.map((n, i) => number(n, 0, talents[i].maxPoints, true));
            const items = data.inventory.map(name => {
                const template = itemTemplates.find(i => i.name === name);
                if (!template) throw new Error('Objeto desconocido');
                return { ...template };
            });
            const equipped = number(data.equipped, -1, items.length - 1, true);
            if (equipped >= 0 && items[equipped].type !== 'gear') throw new Error('Equipo inválido');
            const q = { ...questState };
            for (const key of ['active','completed','rewardClaimed']) {
                if (typeof data.quest[key] !== 'boolean') throw new Error('Misión inválida');
                q[key] = data.quest[key];
            }
            q.currentKills = number(data.quest.currentKills, 0, q.requiredKills, true);
            if ((q.completed && (!q.active || q.currentKills < q.requiredKills)) || (q.rewardClaimed && !q.completed)) throw new Error('Misión incoherente');
            const mobs = initialEnemies.map(base => {
                const e = data.enemies.find(candidate => candidate.id === base.id);
                if (!e) throw new Error('Enemigo desconocido');
                return { ...base, wx: number(e.wx, 0, MAP_WORLD_SIZE), wy: number(e.wy, 0, MAP_WORLD_SIZE),
                    hp: number(e.hp, 0, base.maxHp), respawnRemaining: number(e.respawnRemaining, 0, base.type === 'boss' ? 30 : 8), attackCd: number(e.attackCd, 0, 1.8), aggro: false, returning: false, telegraph: null, smashCd: 2 };
            });
            const loot = data.loot.map(l => ({ wx: number(l.wx, 0, MAP_WORLD_SIZE), wy: number(l.wy, 0, MAP_WORLD_SIZE),
                gold: number(l.gold, 0, 1e9, true), icon: '🪙', name: `${l.gold}g Monedas de Oro` }));
            Object.assign(player, restored);
            bossDefeated = restoredBossDefeated; lastDamageTimer = restoredDamageTimer;
            talents.forEach((t, i) => t.points = points[i]);
            inventory.splice(0, inventory.length, ...items);
            equippedWeapon = equipped >= 0 ? inventory[equipped] : null;
            Object.assign(questState, q);
            enemies = mobs; groundLoot = loot;
            clearTransientState();
        }
        function clearTransientState() {
            closeAllWindows(); clearMovement();
            activeProjectiles = []; particles = []; floatingTexts = []; footstepFX = []; selectedTarget = null;
            camera.wx = player.wx; camera.wy = player.wy; saveTimer = 0;
            updateHUDUI(); updatePauseUI();
        }
        function loadGame() {
            try {
                const raw = window.localStorage.getItem(SAVE_KEY);
                if (raw) { applySave(JSON.parse(raw)); statusMessage('Partida recuperada.'); return true; }
            } catch (_) { statusMessage('No se pudo recuperar el guardado. Puedes importar una copia.'); }
            return false;
        }
        function exportSave() {
            const blob = new Blob([JSON.stringify(saveSnapshot(), null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url; link.download = 'Azeroth_Chronicles_Partida.json';
            link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
            statusMessage('Partida exportada. Puedes importarla en otra copia del juego.');
        }
        async function importSave(input) {
            if (!input.files || !input.files[0]) return;
            const previousPause = manualPaused;
            manualPaused = true; clearMovement(); updatePauseUI();
            try {
                if (input.files[0].size > 2 * 1024 * 1024) throw new Error('Archivo demasiado grande');
                const data = JSON.parse(await input.files[0].text());
                applySave(data); saveGame(true);
            } catch (_) { statusMessage('Archivo de partida inválido. La partida actual sigue intacta.'); }
            finally { input.value = ''; manualPaused = previousPause; updatePauseUI(); }
        }
        function newGame() {
            if (!window.confirm('¿Empezar de nuevo? Se reemplazará el guardado de este navegador. Puedes exportarlo primero.')) return;
            Object.assign(player, JSON.parse(JSON.stringify(initialPlayer)));
            inventory.splice(0, inventory.length, ...initialInventory.map(i => ({ ...i })));
            equippedWeapon = null; talents.forEach(t => t.points = 0);
            Object.assign(questState, { active: false, completed: false, rewardClaimed: false, requiredKills: 5, currentKills: 0 });
            enemies = initialEnemies.map(e => ({ ...e })); groundLoot = [];
            manualPaused = false; bossDefeated = false; lastDamageTimer = 0;
            document.getElementById('event-feed').textContent = '';
            clearTransientState(); saveGame(true); openWindow('help');
        }
        window.addEventListener('blur', () => { focusPaused = true; clearMovement(); saveGame(); updatePauseUI(); });
        window.addEventListener('focus', () => { focusPaused = false; clearMovement(); lastTime = performance.now(); updatePauseUI(); });
        document.addEventListener('visibilitychange', () => {
            clearMovement(); lastTime = performance.now();
            if (document.hidden) saveGame();
            updatePauseUI();
        });
        window.addEventListener('pagehide', () => saveGame());

        // Main RAF Loop
        function gameLoop(now) {
            const dt = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;

            updateGame(dt);
            drawScene();

            requestAnimationFrame(gameLoop);
        }

        window.onload = function() {
            resizeCanvas();
            if (window.matchMedia && !window.matchMedia('(any-pointer: coarse)').matches) document.body.classList.add('keyboard-input');
            updateKeyboardHints();
            const loaded = loadGame(); updateHUDUI(); updatePauseUI();
            for (const num of [1, 2, 3, 4, 5]) {
                const slot = document.getElementById(`slot-${num}`);
                slot.onclick = () => { AudioSys.init(); castSpell(num); };
                slot.setAttribute('role', 'button'); slot.tabIndex = 0;
                slot.setAttribute('aria-label', spellbookData[num - 1].name + '. ' + spellbookData[num - 1].desc);
                slot.title = spellbookData[num - 1].desc;
            }
            if (!loaded) openWindow('help');
            requestAnimationFrame(gameLoop);
        };
