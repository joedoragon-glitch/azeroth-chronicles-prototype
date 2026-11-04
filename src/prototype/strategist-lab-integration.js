/* Dormant B3 integration: existing Campaign, authentic source, native
 * companion provenance, native ordinary-enemy damage and unsafe threat hold.
 * Deliberately NOT registered in index.html, Campaign.tick, save admission
 * or the four playable classes. Off-region ranged/special AI remains HOLD.
 */
(function(root){
  'use strict';
  const resolve=(browser,local)=>typeof module==='undefined'?root[browser]:require(local);
  function install(Campaign){
    if(!Campaign?.rules||!Campaign.prototype)throw Error('Native Campaign required');
    const Materials=resolve('PrototypeStrategistMaterials','./strategist-materials.js');
    const Nav=resolve('PrototypeStrategistLabNavigation','./strategist-lab-navigation.js');
    const Sources=resolve('PrototypeStrategistLabSources','./strategist-lab-sources.js');
    const Workforce=resolve('PrototypeStrategistLabWorkforce','./strategist-lab-workforce.js');
    const Threats=resolve('PrototypeStrategistLabThreats','./strategist-lab-threats.js');
    const Combat=resolve('PrototypeStrategistLabCombat','./strategist-lab-combat.js');
    const Labs=resolve('PrototypeStrategistFieldLabs','./strategist-field-labs.js');
    const navigation=Nav.adapter(), rules=Campaign.rules;
    const workforce=Workforce.install(Campaign);
    const sources=Sources.create(Materials,rules);
    const threats=Threats.create({
      // Ordinary melee uses collision-authoritative local sight. Native
      // ranged special geometry is not simulated off-zone, so conservatively
      // refuse work within even a fortified enemy's possible fire range.
      sight:(game,zone,worker,enemy)=>game.enemyRanged(enemy)
        ? true : Nav.passable(game,zone,worker,enemy,Nav.budget(0,90)),
      nearestRadius:Math.max(
        rules.balance.enemyAcquisitionRange * rules.balance.enemyAcquisitionRangeMultiplier,
        rules.balance.enemyRangedBasicRange *
          rules.balance.fortifications.rangeMultiplier,
      ),
    });
    const remote=Combat.create({navigation,rules});
    const status=Labs.install(Campaign,{
      materials:Materials,navigation,rules,
      authenticatedLocation:workforce.authenticatedLocation,
      safeFromThreat:threats.safeFromThreat,
      inspectThreat:(game,zone,pos,worker)=>
        threats.inspect(game,zone,{...pos,workerId:worker?.id}),
      verifySource:sources.verifySource,
      advanceEnemyDanger:remote.advanceEnemyDanger,
      neriRescued:game=>!!game.s?.rescued?.neri,
    });
    return Object.freeze({...status,workforce,threats,remote,sources,
      scope:'dormant-current-zone-native-plus-remote-ordinary-melee'});
  }
  const api=Object.freeze({install});
  if(typeof module!=='undefined')module.exports=api;
  else root.PrototypeStrategistLabIntegration=api;
})(typeof window!=='undefined'?window:globalThis);
