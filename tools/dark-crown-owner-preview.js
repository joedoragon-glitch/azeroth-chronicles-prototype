/* Separate owner review entry only. Not a production asset. Native Campaign travel. */
(function(root) {
'use strict';
const destinations=[
['arrival','Crownwatch arrival','Llegada a Crownwatch','crown',690,430],
['civic','Civic hall','Salón cívico','crown',600,550],
['ash','Ash Refuge','Refugio de Ceniza','crown',1030,1840],
['heat','Geothermal works','Instalaciones geotérmicas','crown',2835,770],
['glass','Glass and ceramics','Vidrio y cerámica','crown',2355,2180],
['bridge-north','North lava bridge','Puente norte','crown',1350,1000],
['bridge-south','South lava bridge','Puente sur','crown',1350,2400],
['market','Market and freight','Mercado y carga','crown',850,1400],
['foundry-out','Foundry exterior','Exterior de la fundición','crown',1915,2755],
['foundry-in','Foundry interior · danger','Fundición interior · peligro','side-crown-foundry',null,null],
['citadel-in','Citadel interior · danger','Ciudadela interior · peligro','citadel',null,null],
['ministry','Cindermaw ministry','Ministerio de Cindermaw','crown',1100,285],
['den','Cindermaw den','Guarida de Cindermaw','crown',2580,1900],
['crystal','Crystal source and dispatch','Cristales y despacho','crown',1195,2675],
['orrery','Bronze orrery','Planetario de bronce','crown',1940,3150],
['fortress','Fortress approach','Acceso a la fortaleza','crown',3060,3040]
];
const spanish=()=>document.documentElement.lang.startsWith('es'), t=(en,es)=>spanish()?es:en;
const rootElement=document.createElement('details');
rootElement.id='dark-crown-review-locations';
rootElement.style.cssText='position:fixed;z-index:100;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);max-width:min(290px,82vw);font:13px system-ui;color:#fce8bb;background:#14291e;border:1px solid #a79062;border-radius:8px';
const trigger=document.createElement('summary');
trigger.textContent=t('Review locations','Lugares para revisar');
trigger.style.cssText='padding:12px;cursor:pointer;font-weight:bold';
rootElement.append(trigger);
const panel=document.createElement('div');
panel.style.cssText='max-height:65vh;overflow:auto;padding:8px';
const hint=document.createElement('p');
hint.textContent=t('Start a Developer Mode run first. Shortcuts are optional; enemy danger and paths are unchanged.','Inicia una partida en modo Desarrollador. Los atajos son opcionales; los enemigos y caminos siguen igual.');
panel.append(hint);
const feedback=document.createElement('p');
feedback.setAttribute('role','status');
feedback.style.color='#dfc78f';
function jump(d){
 const api=root.Prototype, game=api?.game;
 if(!api?.started || api.sceneLoading || game?.s.mode!=='developer'){
  feedback.textContent=t('Begin New Game → Developer Mode → choose a class first.','Primero elige Nueva partida → modo Desarrollador → una clase.');
  return;
 }
 const arrival=d[4]===null?null:{x:d[4],y:d[5]};
 if(!game.enter(d[3],arrival)){
  feedback.textContent=t('This destination cannot be entered.','No se puede entrar en este destino.');return;
 }
 const saved=api.save();
 api.updateHUD();
 feedback.textContent=saved?t('Arrived at ','Llegaste a ')+(spanish()?d[2]:d[1]):t('Arrived, but saving failed. Export before closing.','Llegaste, pero falló el guardado. Exporta antes de cerrar.');
 rootElement.open=false;
}
for(const d of destinations){
 const b=document.createElement('button');
 b.type='button';
 b.dataset.ownerDestination=d[0];
 b.textContent=spanish()?d[2]:d[1];
 b.style.cssText='display:block;width:100%;padding:9px;margin:4px 0;text-align:left;background:#294737;color:#fff3d5;border:1px solid #5c785d;border-radius:5px;min-height:40px';
 b.addEventListener('click',()=>jump(d));
 panel.append(b);
}
panel.append(feedback);
rootElement.append(panel);
document.body.append(rootElement);
})(window);
