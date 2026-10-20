'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const source = cp.execFileSync('git', ['show', 'a6364ea7b2db5fc8dc03e7eaeab4f931bf0560b6'], {
  cwd: root,
  encoding: 'utf8',
});
const old = JSON.parse(
  fs.readFileSync(root + '/tools/visual-review/veyra-options-20261020/candidates.json', 'utf8'),
);
let revised = old.helper;
const lowerStart = revised.indexOf('      shaped(p.cloth,()=>{'),
  torso = revised.indexOf('      shaped(p.plate,()=>{\n        ctx.moveTo(-17,-23)', lowerStart);
if (lowerStart < 0 || torso < 0) throw Error('Lower armor anchor changed');
const skirt = `      // Static skirt: a single continuous cloth body, with short hanging tassets.
      for(const side of [-1,1]){
        oval(side*10,14.5,5.5,2.3,p.shade);
        line([[side*7,14.5],[side*12,14.5]],p.light,0.8);
      }
      shaped(p.cloth,()=>{
        ctx.moveTo(-11,-3);ctx.lineTo(11,-3);
        ctx.bezierCurveTo(12,2,17,8,19,12);
        ctx.quadraticCurveTo(0,19,-19,12);
        ctx.bezierCurveTo(-17,8,-12,2,-11,-3);
      });
      for(const side of [-1,1]){
        line([[side*6,4],[side*8,12]],'#51465f',0.8);
      }
      ctx.strokeStyle=p.trim;ctx.lineWidth=0.85;ctx.beginPath();
      ctx.moveTo(-17,12);ctx.quadraticCurveTo(0,17,17,12);ctx.stroke();
      for(const side of [-1,1]){
        shaped(p.plate,()=>{
          ctx.moveTo(side*13,-1);ctx.quadraticCurveTo(side*9,-2,side*6,0);
          ctx.lineTo(side*5,7);ctx.quadraticCurveTo(side*9,11,side*15,9);
          ctx.lineTo(side*16,5);
        });
        line([[side*13,1],[side*13,6],[side*9,8]],p.trim,0.9);
        line([[side*7,1],[side*7,5]],p.light,0.9);
      }
      shaped(p.plate,()=>{
        ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.lineTo(5,5);
        ctx.quadraticCurveTo(0,10,-5,5);
      });
      line([[-3,4],[0,7],[3,4]],p.trim,0.9);
`;
revised = revised.slice(0, lowerStart) + skirt + revised.slice(torso);
// Bring the weapon to a compact bent arm; never lengthen the limb toward it.
revised = revised.replace(
  'shield(-24,-1,p.shade);marshalSpear();',
  'shield(-24,-1,p.shade);marshalSpear(23);',
);
const oldArm = '      line([[16,-13],[23,-5],[29,-2]],p.plate,4);grip(29,-2,p.light);';
const arm = `      // Upper-arm plate, elbow cop, vambrace, cuff and articulated gauntlet.
      shaped(p.shade,()=>{
        ctx.moveTo(16,-21);ctx.lineTo(23,-19);
        ctx.quadraticCurveTo(26,-14,24,-8);ctx.lineTo(18,-8);
        ctx.quadraticCurveTo(17,-13,16,-21);
      });
      shaped(p.plate,()=>{
        ctx.moveTo(18,-19);ctx.lineTo(23,-17);ctx.lineTo(23,-10);
        ctx.lineTo(19,-10);ctx.quadraticCurveTo(18,-14,18,-19);
      });
      line([[20,-18],[21,-12]],p.light,1);
      oval(22,-8.5,4.8,3.5,p.plate);
      line([[19,-9],[23,-10],[25,-8]],p.trim,0.85);
      shaped(p.plate,()=>{
        ctx.moveTo(18.5,-7);ctx.lineTo(25,-7);ctx.lineTo(26,-1);
        ctx.quadraticCurveTo(23,2,19.5,-0.5);ctx.lineTo(18.5,-7);
      });
      line([[20,-6],[21,-1]],p.light,1.1);
      line([[19.5,-2],[25,-2]],p.trim,0.9);
      shaped(p.light,()=>{
        ctx.moveTo(21,-2);ctx.quadraticCurveTo(23,-4,25,-1.8);
        ctx.lineTo(25.7,1.7);ctx.quadraticCurveTo(23,3.6,20.8,1.5);
        ctx.lineTo(21,-2);
      });
      line([[21.5,0],[24.5,0]],p.shade,0.65);
      line([[21.5,1.4],[24.4,1.4]],p.shade,0.6);
`;
if (!revised.includes(oldArm)) throw Error('Arm anchor changed');
revised = revised.replace(oldArm, arm);
function candidate(helper) {
  return source
    .replace(
      old.before,
      "        case 'citadel':\n          veyraPreview('B');\n          break;\n",
    )
    .replace('    function mageHead(', helper + '\n    function mageHead(')
    .replace(
      '        bossFinish(e.family);\n        bossPolish(e.family);',
      "        if (e.family !== 'citadel') { bossFinish(e.family); bossPolish(e.family); } else bossPolish('veyra-preview');",
    );
}
function load(s) {
  const c = { PrototypeRules: require(root + '/src/prototype/rules') };
  vm.runInNewContext(s, c);
  return c.PrototypeVisuals;
}
const versions = [load(candidate(old.helper)), load(candidate(revised))];
const assert = require('node:assert/strict');
function selectedFace(v) {
  const c = createCanvas(400, 400),
    x = c.getContext('2d');
  x.translate(200, 280);
  x.scale(2, 2);
  v.draw(
    x,
    { id: 'face-preservation', renderKind: 'enemy', type: 'boss', family: 'citadel' },
    { x: 0, y: 0 },
    4,
  );
  return Buffer.from(x.getImageData(172, 145, 56, 70).data);
}
assert.deepEqual(
  selectedFace(versions[0]),
  selectedFace(versions[1]),
  'Selected face/eyes/hair/lips remain exactly unchanged',
);

const canvas = createCanvas(1160, 920),
  ctx = canvas.getContext('2d');
ctx.fillStyle = '#27333a';
ctx.fillRect(0, 0, 1160, 920);
ctx.fillStyle = '#f3ead8';
ctx.font = 'bold 25px sans-serif';
ctx.fillText('Veyra · ivory parade correction', 24, 36);
ctx.font = '16px sans-serif';
ctx.fillText(
  'PREVIEW ONLY · selected face, hair, ivory/gold colors and TRUE effects retained',
  24,
  65,
);
for (let i = 0; i < 2; i++) {
  const x = i * 580;
  ctx.fillStyle = i ? '#3e4e53' : '#35434a';
  ctx.fillRect(x + 8, 92, 564, 810);
  ctx.fillStyle = '#f3ead8';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(i ? 'Corrected arm and skirt' : 'Selected B · earlier preview', x + 290, 127);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 15, 145, 550, 435);
  ctx.clip();
  ctx.translate(x + 270, 455);
  ctx.scale(3.8, 3.8);
  versions[i].draw(
    ctx,
    { id: 'veyra-correction', renderKind: 'enemy', type: 'boss', family: 'citadel' },
    { x: 0, y: 0 },
    4,
  );
  ctx.restore();
  ctx.fillStyle = '#e2ddcf';
  ctx.font = '16px sans-serif';
  ctx.fillText(
    i ? 'Compact plate-covered arm and gauntlet' : 'Thin reaching forearm; separated lower plates',
    x + 290,
    590,
  );
  ctx.fillText(
    i
      ? 'Continuous violet skirt beneath hanging ivory plates'
      : 'These are the details being corrected',
    x + 290,
    614,
  );
  for (const [form, dx] of [
    ['normal', 175],
    ['true', 390],
  ]) {
    ctx.save();
    ctx.translate(x + dx, 840);
    ctx.scale(1.5, 1.5);
    versions[i].draw(
      ctx,
      { id: 'veyra-correction', renderKind: 'enemy', type: 'boss', family: 'citadel', form },
      { x: 0, y: 0 },
      4,
    );
    ctx.restore();
  }
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#cfdbd9';
  ctx.fillText('Normal / TRUE · actual 150% camera scale', x + 290, 881);
}
fs.writeFileSync(__dirname + '/ivory-correction.png', canvas.toBuffer('image/png'));
fs.writeFileSync(
  __dirname + '/candidate.json',
  JSON.stringify(
    {
      status:
        'Ivory parade B selected; corrected arm/skirt preview pending owner review. Not applied.',
      date: '2026-10-20',
      sourceCommit: '1944f7a56ed1f8cc205a51c33979e5d629561d2a',
      sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
      originalBranch: old.before,
      previousHelper: old.helper,
      revisedHelper: revised,
      option: 'B',
      spearAxis: { before: 29, proposed: 23 },
      pose: 'Fixed compact bent arm, fully armored; spear brought inward.',
      lowerArmor:
        'One continuous violet skirt with three short ivory tassets visibly attached under the waist belt; no paired long shin-like panels.',
      preserve: [
        'Selected B face/eyes/hair/lips/palette',
        'Shield position',
        'TRUE crown/halo/glints',
        'All runtime geometry, behavior and animation timing',
      ],
    },
    null,
    2,
  ) + '\n',
);
