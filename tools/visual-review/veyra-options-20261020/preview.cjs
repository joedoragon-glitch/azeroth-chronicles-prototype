'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const source = require('node:child_process').execFileSync(
  'git',
  ['show', 'a6364ea7b2db5fc8dc03e7eaeab4f931bf0560b6'],
  { cwd: root, encoding: 'utf8' },
);
const helper = `
    function veyraPreview(option) {
      const palette = {
        A: {plate:'#8da9b7',light:'#d0dce0',shade:'#546d80',cloth:'#354f77',trim:'#d9bc7c',iris:'#577f79'},
        B: {plate:'#dbd9c9',light:'#f3edda',shade:'#929e9c',cloth:'#685974',trim:'#ccac69',iris:'#5f829d'},
        C: {plate:'#616f85',light:'#aab9c9',shade:'#39475d',cloth:'#743f4d',trim:'#c7aa74',iris:'#778a62'},
      }[option];
      const p=palette;
      // Heavy fitted plate and practical coat tails, with the same spear/shield poses.
      humanoid(p.shade, steel, 1.45, false);
      shaped(p.cloth,()=>{
        ctx.moveTo(-13,-21);ctx.quadraticCurveTo(-20,-17,-24,12);
        ctx.quadraticCurveTo(-14,18,-2,12);ctx.lineTo(2,12);
        ctx.quadraticCurveTo(17,18,24,12);ctx.quadraticCurveTo(20,-18,13,-21);
      });
      for(const side of [-1,1]){
        shaped(p.plate,()=>{
          ctx.moveTo(side*10,-5);ctx.quadraticCurveTo(side*18,-5,side*20,7);
          ctx.lineTo(side*15,14);ctx.lineTo(side*9,12);ctx.lineTo(side*7,1);
        });
        line([[side*10,-2],[side*15,3],[side*15,10]],p.light,1.1);
        shaped(p.plate,()=>{
          ctx.moveTo(side*8,9);ctx.lineTo(side*16,9);ctx.lineTo(side*17,16);
          ctx.quadraticCurveTo(side*12,19,side*7,16);
        });
        line([[side*11,10],[side*12,16]],p.trim,0.8);
      }
      shaped(p.plate,()=>{
        ctx.moveTo(-17,-23);ctx.quadraticCurveTo(-9,-29,0,-24);
        ctx.quadraticCurveTo(9,-29,17,-23);ctx.lineTo(15,-10);
        ctx.quadraticCurveTo(8,-3,0,-4);ctx.quadraticCurveTo(-8,-3,-15,-10);
      });
      shaped(p.light,()=>{
        ctx.moveTo(-11,-22);ctx.quadraticCurveTo(0,-26,11,-22);
        ctx.lineTo(8,-17);ctx.quadraticCurveTo(0,-20,-8,-17);
      });
      line([[0,-20],[0,-6]],p.light,1.1);
      line([[-13,-10],[-7,-6],[0,-5],[7,-6],[13,-10]],p.trim,1.3);
      softRect(-10,-3,20,3.8,'#574a43',0.8);softRect(-2,-3,4,4,p.trim,0.5);
      for(const side of [-1,1]){
        shaped(p.plate,()=>{
          ctx.moveTo(side*13,-24);ctx.quadraticCurveTo(side*23,-28,side*29,-20);
          ctx.quadraticCurveTo(side*31,-16,side*25,-12);ctx.lineTo(side*16,-16);
        });
        line([[side*15,-23],[side*22,-23],[side*27,-19]],p.trim,1.3);
        line([[side*17,-18],[side*23,-16]],p.light,0.9);
        fillOval(side*22,-21,0.8,0.8,p.light);
      }
      // The helmet masks the generic base head; no second face or mouth underneath.
      shaped(p.shade,()=>{
        ctx.moveTo(-13,-47);ctx.quadraticCurveTo(-10,-55,0,-55);
        ctx.quadraticCurveTo(10,-55,13,-47);ctx.lineTo(12,-25);
        ctx.quadraticCurveTo(0,-18,-12,-25);
      });
      oval(0,-36,8.5,10.5,'#d5ad94');
      shaped('#dfcfb3',()=>{
        ctx.moveTo(-8,-44);ctx.quadraticCurveTo(-4,-50,5,-47);
        ctx.quadraticCurveTo(10,-46,9,-39);ctx.lineTo(6,-41);
        ctx.quadraticCurveTo(2,-46,-3,-42);ctx.lineTo(-8,-41);
      });
      shaped('#c8b79b',()=>{
        ctx.moveTo(7,-44);ctx.quadraticCurveTo(12,-42,10,-33);
        ctx.lineTo(8,-31);ctx.lineTo(8,-38);ctx.lineTo(4,-41);
      });
      // Almond eyes: visible whites and irises, fine lids, and arched brows.
      for(const side of [-1,1]){
        const ex=side*3.45,ey=-37;
        ctx.fillStyle='#f3e7d8';ctx.beginPath();ctx.moveTo(ex-2.05,ey);
        ctx.quadraticCurveTo(ex,ey-2.15,ex+2.05,ey);
        ctx.quadraticCurveTo(ex,ey+1.7,ex-2.05,ey);ctx.fill();
        fillOval(ex,ey,0.95,1.3,p.iris);fillOval(ex,ey+0.1,0.43,1.0,'#2c343b');
        fillOval(ex-0.25,ey-0.5,0.27,0.35,'#fff6e4');
        ctx.strokeStyle='#50433e';ctx.lineWidth=0.65;ctx.beginPath();ctx.moveTo(ex-2.1,ey);
        ctx.quadraticCurveTo(ex,ey-2.15,ex+2.1,ey);ctx.stroke();
        line([[ex-side*2,-40],[ex-side*0.2,-40.8],[ex+side*1.8,-40.3]],'#8a765d',0.75);
      }
      line([[0,-36],[-0.5,-33.3],[0.8,-33.3]],'#ae7f68',0.6);
      expressionLips(-0.25,-35,false,false,'#a94058');
      for(const side of [-1,1]){
        shaped(p.plate,()=>{
          ctx.moveTo(side*10,-45);ctx.lineTo(side*13,-43);ctx.lineTo(side*12,-27);
          ctx.lineTo(side*8,-24);ctx.lineTo(side*9,-29);ctx.lineTo(side*10,-33);
        });
        line([[side*11,-42],[side*11,-29],[side*9,-27]],p.trim,0.9);
      }
      shaped(p.plate,()=>{
        ctx.moveTo(-13,-48);ctx.quadraticCurveTo(0,-58,13,-48);
        ctx.lineTo(11,-46);ctx.quadraticCurveTo(0,-52,-11,-46);
      });
      line([[-11,-48],[0,-53],[11,-48]],p.trim,1.2);
      if(option==='B'){
        shaped(p.trim,()=>{ctx.moveTo(-3,-52);ctx.quadraticCurveTo(0,-58,3,-52);ctx.lineTo(2,-50);ctx.lineTo(-2,-50);});
        oval(0,-52,1,1.7,'#856b96');
      }
      shield(-24,-1,p.shade);marshalSpear();
      shaped(p.trim,()=>{
        ctx.moveTo(0,-21);ctx.quadraticCurveTo(5,-17,4,-14);
        ctx.lineTo(0,-10);ctx.lineTo(-4,-14);ctx.quadraticCurveTo(-5,-17,0,-21);
      });
      fillOval(0,-16,1.5,2,option==='B'?'#83749c':'#719ca5');
      line([[16,-13],[23,-5],[29,-2]],p.plate,4);grip(29,-2,p.light);
    }
`;
const branchStart = source.indexOf(
    "        case 'citadel':",
    source.indexOf("} else if (e.type === 'boss'"),
  ),
  branchEnd = source.indexOf("        case 'darklord':", branchStart);
if (branchStart < 0 || branchEnd < 0) throw Error('Veyra branch not found');
const before = source.slice(branchStart, branchEnd);
function candidate(option) {
  let s =
    source.slice(0, branchStart) +
    `        case 'citadel':\n          veyraPreview('${option}');\n          break;\n` +
    source.slice(branchEnd);
  s = s.replace('    function mageHead(', helper + '\n    function mageHead(');
  return s.replace(
    '        bossFinish(e.family);\n        bossPolish(e.family);',
    "        if (e.family !== 'citadel') { bossFinish(e.family); bossPolish(e.family); } else bossPolish('veyra-preview');",
  );
}
function load(s) {
  const c = { PrototypeRules: require(root + '/src/prototype/rules') };
  vm.runInNewContext(s, c);
  return c.PrototypeVisuals;
}
const versions = [load(source), ...['A', 'B', 'C'].map((o) => load(candidate(o)))];
const names = [
  'Current dev.103',
  'A · Polished blue steel',
  'B · Ivory parade armor',
  'C · Dark field armor',
];
const canvas = createCanvas(1440, 1000),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#27333a';
ctx.fillRect(0, 0, 1440, 1000);
ctx.fillStyle = '#eee6d5';
ctx.font = 'bold 25px sans-serif';
ctx.fillText('Marshal Veyra · face and armor options', 24, 36);
ctx.font = '16px sans-serif';
ctx.fillText(
  'PREVIEW ONLY · open eyes and face, blonde swept crop, accepted lips, spear/shield stance and TRUE crown retained',
  24,
  66,
);
for (let i = 0; i < 4; i++) {
  const x = i * 360;
  ctx.fillStyle = i ? '#3b4b51' : '#35434a';
  ctx.fillRect(x + 7, 95, 346, 885);
  ctx.fillStyle = '#f2e9d5';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(names[i], x + 180, 126);
  for (const [scale, dx, dy, form] of [
    [2.75, 135, 415, 'normal'],
    [1.15, 290, 415, 'true'],
  ]) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 10, 145, 340, 355);
    ctx.clip();
    ctx.translate(x + dx, dy);
    ctx.scale(scale, scale);
    versions[i].draw(
      ctx,
      { id: 'veyra-review', renderKind: 'enemy', type: 'boss', family: 'citadel', form },
      { x: 0, y: 0 },
      4,
    );
    ctx.restore();
  }
  ctx.fillStyle = '#cfdbd9';
  ctx.font = '14px sans-serif';
  ctx.fillText('Full design / smaller TRUE view', x + 180, 494);
  // Large face/chest crop permits direct eye, hair, lip and armor review.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 24, 525, 312, 390);
  ctx.clip();
  ctx.translate(x + 180, 870);
  ctx.scale(6, 6);
  versions[i].draw(
    ctx,
    { id: 'veyra-face', renderKind: 'enemy', type: 'boss', family: 'citadel' },
    { x: 0, y: 0 },
    4,
  );
  ctx.restore();
  ctx.fillStyle = '#cfdbd9';
  ctx.font = '15px sans-serif';
  ctx.fillText('Face and breastplate detail', x + 180, 950);
}
fs.writeFileSync(__dirname + '/veyra-options.png', canvas.toBuffer('image/png'));
fs.writeFileSync(
  __dirname + '/candidates.json',
  JSON.stringify(
    {
      status: 'Preview only; owner selection pending. Runtime Veyra drawing unchanged.',
      baseVersion: 'dev.103',
      date: '2026-10-20',
      sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
      before,
      helper,
      options: ['A', 'B', 'C'],
      replacementTemplate: "case 'citadel': veyraPreview(OPTION); break;",
      finishRule:
        'Do not repaint old Citadel armor over the candidate. Preserve the shared TRUE halo/glints through bossPolish with a non-armor key.',
      preserve: [
        'Accepted shaped lips',
        'Cropped blonde hair',
        'Existing spear/shield stance',
        'Boss scale, collision, TRUE crown and all mechanics',
      ],
    },
    null,
    2,
  ) + '\n',
);

// Retain actual 150% camera-scale views as well as the enlarged comparison.
const native = createCanvas(1280, 260),
  nc = native.getContext('2d');
nc.fillStyle = '#35434a';
nc.fillRect(0, 0, 1280, 260);
for (let i = 0; i < 4; i++) {
  nc.fillStyle = '#f1e8d6';
  nc.font = '15px sans-serif';
  nc.textAlign = 'center';
  nc.fillText(names[i], i * 320 + 160, 24);
  for (const [form, dx] of [
    ['normal', 85],
    ['true', 235],
  ]) {
    nc.save();
    nc.translate(i * 320 + dx, 205);
    nc.scale(1.5, 1.5);
    versions[i].draw(
      nc,
      { id: 'veyra-native', renderKind: 'enemy', type: 'boss', family: 'citadel', form },
      { x: 0, y: 0 },
      4,
    );
    nc.restore();
  }
}
fs.writeFileSync(__dirname + '/veyra-native-150.png', native.toBuffer('image/png'));
