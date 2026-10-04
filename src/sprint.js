/*
 * Sprint was developed, but is not currently implemented as an available
 * gameplay feature. Keep SPRINT_ENABLED false until explicitly activated.
 * Activation: change ONLY the flag below to true, run npm test, verify Q and
 * the left touch button, and bump the PWA cache version before deployment.
 * Full activation/tuning/save instructions: docs/SPRINT.md.
 * No menu, URL parameter, or saved-game value can enable this feature.
 */
const SPRINT_ENABLED = false;
const Sprint = (() => {
    const tuning = Object.freeze({capacity:100, drain:20, regeneration:15, delay:1.5, bonus:.35});
    let stamina=tuning.capacity, recoveryDelay=0, exhausted=false, keyboard=false, touch=false;
    function release() { keyboard=false; touch=false; exhausted=false; }
    function reset() { stamina=tuning.capacity; recoveryDelay=0; release(); }
    function press(source, held) {
        if (!SPRINT_ENABLED) return;
        if (source==='keyboard') keyboard=held;
        if (source==='touch') touch=held;
        if (!keyboard&&!touch) exhausted=false;
    }
    function tick(dt, moving) {
        if (!SPRINT_ENABLED || !Number.isFinite(dt) || dt<=0) return 1;
        const requested=keyboard||touch;
        if (!requested) exhausted=false;
        if (requested && moving && !exhausted && stamina>0) {
            const sprintTime=Math.min(dt, stamina/tuning.drain);
            stamina=Math.max(0, stamina-tuning.drain*sprintTime);
            if (stamina<1e-8) stamina=0;
            recoveryDelay=tuning.delay;
            if (stamina===0) exhausted=true;
            // A partial final frame cannot receive an entire frame's boost.
            return 1+tuning.bonus*sprintTime/dt;
        }
        const recoveryTime=Math.max(0,dt-recoveryDelay);
        recoveryDelay=Math.max(0,recoveryDelay-dt);
        stamina=Math.min(tuning.capacity, stamina+tuning.regeneration*recoveryTime);
        return 1;
    }
    function snapshot() { return {version:1, stamina, recoveryDelay, exhausted}; }
    function validate(data) {
        if (data===undefined) return {version:1,stamina:tuning.capacity,recoveryDelay:0,exhausted:false};
        if (!data || data.version!==1 || !Number.isFinite(data.stamina) || data.stamina<0 || data.stamina>tuning.capacity ||
            !Number.isFinite(data.recoveryDelay) || data.recoveryDelay<0 || data.recoveryDelay>tuning.delay || typeof data.exhausted!=='boolean') {
            throw new Error('Resistencia inválida');
        }
        return {version:1,stamina:data.stamina,recoveryDelay:data.recoveryDelay,exhausted:data.exhausted};
    }
    function restore(data) {
        stamina=data.stamina; recoveryDelay=data.recoveryDelay; keyboard=false; touch=false;
        // No key is physically held after loading. A new press is allowed.
        exhausted=false;
    }
    function hud() {
        if (!SPRINT_ENABLED) return;
        document.getElementById('stamina-status').textContent=`Resistencia ${Math.ceil(stamina)}/100${exhausted?' · suelta Q o Esprintar':''}`;
    }
    function init() {
        if (!SPRINT_ENABLED) return;
        document.getElementById('stamina-status').hidden=false;
        document.getElementById('sprint-button').hidden=false;
        hud();
    }
    return Object.freeze({enabled:SPRINT_ENABLED,tuning,press,tick,release,reset,snapshot,validate,restore,hud,init});
})();
