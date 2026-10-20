'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),C=require('../../../src/prototype/engine');
const g=new C('developer','mage',()=>.9);g.s.zone='crown';g.zone();g.s.rescued.cindermaw=true;g.s.rescued.citadel=true;g.refreshNPCs();
fs.writeFileSync(path.join(__dirname,'dev109-save.json.gz'),zlib.gzipSync(JSON.stringify(g.s)));
const z=g.zone();fs.writeFileSync(path.join(__dirname,'before-census.json'),JSON.stringify({props:z.props,npcs:z.npcs,roads:z.roads,footpaths:z.footpaths,enemies:z.enemies.map(e=>({id:e.id,x:e.x,y:e.y,home:e.home})),buildings:z.buildings},null,2));
console.log(z.props.filter(p=>!/^forest-/.test(p.id)).map(p=>[p.id,p.structure,Math.round(p.x),Math.round(p.y),p.r].join(' ')).join('\n'));console.log('NPCS',z.npcs.map(n=>[n.id,n.x,n.y,n.servicePoint]));
