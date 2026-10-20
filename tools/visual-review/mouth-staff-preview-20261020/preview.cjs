'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const live = cp.execFileSync('git', ['show', '39dc376e511f3d3a60baacf6a877ad5d2ca24bd8'], {
  cwd: root,
  encoding: 'utf8',
});
const original = cp.execFileSync(
  'git',
  ['show', '9eab6e25fdc85055436884c2945f2964ad8dfe05:src/prototype/visuals.js'],
  { cwd: root, encoding: 'utf8' },
);
const patches = [];
function patch(source, before, after) {
  if (!source.includes(before)) throw Error('Missing preview anchor ' + before.slice(0, 80));
  patches.push({ before, after });
  return source.replace(before, after);
}
let proposed = live;
const mouthHelper =
  "\n    function expressionLips(x, y, warm, wry, tone) {\n      // A tapered upper lip with a cupid's bow and a rounded lower lip.\n      // Both follow the existing expression curve; the old mouth is not painted.\n      const point = (t) => {\n        const inv = 1-t, ax=x-2.5, ay=y+5, bx=x+0.5,\n          by=y+(warm?8:wry?5.8:5), cx=x+3, cy=y+(wry?3.6:5);\n        const dx=2*inv*(bx-ax)+2*t*(cx-bx),dy=2*inv*(by-ay)+2*t*(cy-by),len=Math.hypot(dx,dy);\n        return {x:inv*inv*ax+2*inv*t*bx+t*t*cx,y:inv*inv*ay+2*inv*t*by+t*t*cy,nx:-dy/len,ny:dx/len};\n      };\n      const trace = (side) => {\n        ctx.beginPath();\n        for(let j=0;j<=24;j++) {\n          const t=j/24,p=point(t),taper=Math.pow(Math.sin(Math.PI*t),0.8),\n            width=side<0?taper*(0.9-0.45*Math.exp(-Math.pow((t-0.5)/0.12,2))):taper*0.9;\n          const xx=p.x+p.nx*width*side,yy=p.y+p.ny*width*side;\n          j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);\n        }\n        for(let j=24;j>=0;j--){const p=point(j/24);ctx.lineTo(p.x,p.y);}\n        ctx.closePath();ctx.fill();\n      };\n      ctx.fillStyle=tone;trace(-1);trace(1);\n      ctx.strokeStyle='#7c3c4d';ctx.lineWidth=0.34;ctx.beginPath();\n      for(let j=0;j<=24;j++){const p=point(j/24);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}\n      ctx.stroke();\n    }\n";
proposed = patch(proposed, '    function face(', mouthHelper + '\n    function face(');
proposed = patch(
  proposed,
  "function face(x, y, color = skin, bulk = 1, aged = false, mood = 'steady')",
  "function face(x, y, color = skin, bulk = 1, aged = false, mood = 'steady', lipColor = null)",
);
proposed = patch(
  proposed,
  "      ctx.strokeStyle = '#825a50';\n      ctx.lineWidth = 0.9;\n      ctx.beginPath();\n      ctx.moveTo(x - 2.5, y + 5);\n      ctx.quadraticCurveTo(x + 0.5, y + (warm ? 8 : wry ? 5.8 : 5), x + 3, y + (wry ? 3.6 : 5));\n      ctx.stroke();",
  "      if (lipColor) expressionLips(x, y, warm, wry, lipColor);\n      else {\n      ctx.strokeStyle = '#825a50';\n      ctx.lineWidth = 0.9;\n      ctx.beginPath();\n      ctx.moveTo(x - 2.5, y + 5);\n      ctx.quadraticCurveTo(x + 0.5, y + (warm ? 8 : wry ? 5.8 : 5), x + 3, y + (wry ? 3.6 : 5));\n      ctx.stroke();\n      }",
);
proposed = patch(
  proposed,
  "face(0, -29, skin, 0.94, false, 'bright');\n      lipstick(0, -24, '#bd587d', 0.7);",
  "face(0, -29, skin, 0.94, false, 'bright', '#bd587d');",
);
proposed = patch(
  proposed,
  "face(0, -29, skin, 1, ['ridge', 'citadel', 'crypt'].includes(e.family), mood);\n      if (women) lipstick(0, -24, '#b75c70', mood === 'wry' ? 0 : 0.7);",
  "face(0, -29, skin, 1, ['ridge', 'citadel', 'crypt'].includes(e.family), mood, women ? '#b75c70' : null);",
);
proposed = patch(
  proposed,
  "lipstick(0, -30, '#a94058');",
  "expressionLips(-0.25, -35, false, false, '#a94058');",
);
const mouthPatches = patches.slice();
const staffHelpers = `
    function previewStaff(option, woodland = false) {
      ctx.save();ctx.translate(-7,0); // Original staff axis x=18; arms/hands never move.
      const shaft = woodland ? '#806348' : '#596983';
      shaped(shaft, () => {
        ctx.moveTo(23.4,14);ctx.lineTo(23,-34);ctx.lineTo(27,-34);ctx.lineTo(26.6,14);
      });
      softRect(22,-36,6,4,woodland?'#c9b57d':'#c6b482',0.6);
      softRect(23,11,4,4,'#b6bdbe',0.7);
      softRect(22.3,-8,5.4,14,woodland?'#574b3a':'#51465f',1);
      for(const y of [-5,-1,3]) line([[22.6,y],[27.4,y-1]],'#c9b57d',0.8);
      if(option==='A') {
        if(woodland) {
          shaped('#8baf78',()=>{ctx.moveTo(25,-35);ctx.bezierCurveTo(12,-37,13,-48,16,-51);ctx.bezierCurveTo(26,-48,27,-41,25,-35);});
          shaped('#b5c795',()=>{ctx.moveTo(25,-35);ctx.bezierCurveTo(36,-40,37,-48,33,-54);ctx.bezierCurveTo(24,-51,22,-42,25,-35);});
          oval(25,-41,2.3,3.2,'#d5ad69');
        } else {
          shaped('#c4d1d7',()=>{ctx.moveTo(29,-55);ctx.bezierCurveTo(11,-55,12,-33,27,-33);ctx.lineTo(28,-37);ctx.bezierCurveTo(18,-38,19,-48,29,-51);});
          oval(28,-44,4,5.3,'#b18bd0');
          line([[25,-37],[26,-39],[30,-39],[31,-37]],'#c6b482',1.4);
        }
      } else if(option==='B') {
        if(woodland) {
          ctx.strokeStyle=ink;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(25,-35);ctx.lineTo(25,-44);ctx.bezierCurveTo(25,-57,11,-57,13,-45);ctx.stroke();
          ctx.strokeStyle='#806348';ctx.lineWidth=3.6;ctx.stroke();
          softRect(22,-39,6,3,'#c9b57d',0.6);
        } else {
          shaped('#99c9dc',()=>{ctx.moveTo(25,-56);ctx.quadraticCurveTo(34,-48,31,-39);ctx.quadraticCurveTo(25,-33,19,-39);ctx.quadraticCurveTo(16,-48,25,-56);});
          line([[18,-43],[20,-35],[30,-35],[32,-43]],'#c6b482',2);
        }
      } else {
        ctx.strokeStyle=ink;ctx.lineWidth=4.6;ctx.beginPath();ctx.ellipse(25,-45,8,10,0,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle=woodland?'#c9b57d':'#c4d1d7';ctx.lineWidth=2.5;ctx.stroke();
        line([[25,-54],[25,-50]],woodland?'#c9b57d':'#c4d1d7',1.5);
        oval(25,-45,3.7,5.4,woodland?'#d0a163':'#8a9dca');
      }
      ctx.restore();
    }
`;
function staffVersion(option) {
  let s = live.replace('    function mageHead(', staffHelpers + '\n    function mageHead(');
  let start = s.indexOf('        line(', s.indexOf('        mageHead();')),
    end = s.indexOf('        poly(', start);
  s =
    s.slice(0, start) +
    `        previewStaff('${option}');\n        grip(17, -2);\n` +
    s.slice(end);
  const crowned = s.indexOf('        mageHead(true);');
  start = s.lastIndexOf('        line(\n          [\n            [18, -36]', crowned);
  if (start < 0) throw Error('Crowned staff anchor');
  s =
    s.slice(0, start) +
    `        previewStaff('${option}');\n        grip(17, -1);\n` +
    s.slice(crowned);
  const specialist = s.indexOf('    function specialist(e)'),
    thorn = s.indexOf("case 'thorn':", specialist);
  start = s.indexOf('          line(\n            [\n              [18, -36]', thorn);
  end = s.indexOf('          rect(-17, -10', start);
  if (start < 0 || end < 0) throw Error('Mira staff anchor');
  s = s.slice(0, start) + `          previewStaff('${option}', true);\n` + s.slice(end);
  return s;
}
function load(source) {
  const c = { PrototypeRules: require(root + '/src/prototype/rules') };
  vm.runInNewContext(source, c);
  return c.PrototypeVisuals;
}
const versions = [load(original), load(live), load(proposed)],
  staves = [versions[1], ...['A', 'B', 'C'].map((x) => load(staffVersion(x)))];
const subjects = [
  ['Mage', { renderKind: 'hero', class: 'mage' }],
  ...[
    ['Mira', 'thorn', 'teacher'],
    ['Sela', 'mire', 'teacher'],
    ['Neri', 'archive', 'alchemist'],
    ['Dara', 'mine', 'smith'],
    ['Lyss · half-smile', 'warlord', 'teacher'],
    ['Vera', 'cindermaw', 'smith'],
  ].map(([name, family, kind]) => [name, { renderKind: 'npc', family, kind }]),
  ['Veyra', { renderKind: 'enemy', type: 'boss', family: 'citadel' }],
];
function background(ctx, w, h, title, subtitle) {
  ctx.fillStyle = '#273139';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f1e9dc';
  ctx.font = 'bold 25px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, 24, 36);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#c5d0d4';
  ctx.fillText(subtitle, 24, 63);
}
const lips = createCanvas(1040, 1500),
  lc = lips.getContext('2d');
background(
  lc,
  1040,
  1500,
  'Mouth correction · PREVIEW ONLY',
  'Shaped upper and lower lips follow the original expression; old mouth removed. No face shading.',
);
const columns = ['Original expression', 'Released dev.102', 'Revised · shaped lips'];
columns.forEach((name, j) => {
  lc.fillStyle = j === 2 ? '#bddcb2' : '#eee5d3';
  lc.font = '16px sans-serif';
  lc.fillText(name, 195 + j * 280, 98);
});
for (let i = 0; i < subjects.length; i++) {
  const [name, e] = subjects[i],
    y = 115 + i * 171;
  lc.fillStyle = '#eee5d3';
  lc.font = '16px sans-serif';
  lc.fillText(name, 18, y + 78);
  for (let j = 0; j < 3; j++) {
    const x = 185 + j * 280;
    lc.fillStyle = j === 2 ? '#3b4d4e' : '#3a444c';
    lc.fillRect(x, y, 267, 158);
    lc.save();
    lc.beginPath();
    lc.rect(x + 8, y + 8, 130, 135);
    lc.clip();
    lc.translate(x + 70, y + 83);
    lc.scale(4, 4);
    lc.translate(0, e.type === 'boss' ? 44 : 29);
    versions[j].draw(lc, { id: 'mouth-review', ...e }, { x: 0, y: 0 }, 3);
    lc.restore();
    lc.save();
    lc.translate(x + 202, y + 125);
    lc.scale(1.25, 1.25);
    versions[j].draw(lc, { id: 'mouth-review', ...e }, { x: 0, y: 0 }, 3);
    lc.restore();
  }
}
fs.writeFileSync(__dirname + '/mouths-preview.png', lips.toBuffer('image/png'));
function staffSheet(mira = false) {
  const rows = mira ? 1 : 2,
    w = 1320,
    h = 110 + rows * 350,
    c = createCanvas(w, h),
    x = c.getContext('2d');
  background(
    x,
    w,
    h,
    mira ? 'Mira instructor staff · PREVIEW ONLY' : 'Mage staff options · PREVIEW ONLY',
    'STAFF ONLY: original arm, hand, grip, face, hair and body. Staff axis stays exactly where it is now.',
  );
  const names = mira
    ? ['Current', 'A · Leaf crest', 'B · Carved crook', 'C · Amber ring']
    : ['Current', 'A · Moon setting', 'B · Crystal setting', 'C · Open silver ring'];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < 4; col++) {
      const left = col * 330,
        top = 100 + row * 350;
      x.fillStyle = col ? '#3b4d4e' : '#3a444c';
      x.fillRect(left + 7, top, 316, 337);
      x.fillStyle = '#eee5d3';
      x.font = '18px sans-serif';
      x.textAlign = 'center';
      x.fillText(names[col] + (!mira && row ? ' · Crowned' : ''), left + 165, top + 28);
      for (const [scale, dx, dy] of [
        [3.25, 120, 267],
        [1.5, 273, 286],
      ]) {
        x.save();
        x.beginPath();
        x.rect(left + 8, top + 35, 314, 285);
        x.clip();
        x.translate(left + dx, top + dy);
        x.scale(scale, scale);
        staves[col].draw(
          x,
          {
            id: 'staff-review',
            ...(mira
              ? { renderKind: 'npc', family: 'thorn', kind: 'teacher' }
              : { renderKind: 'hero', class: 'mage', crowned: !!row }),
          },
          { x: 0, y: 0 },
          0,
        );
        x.restore();
      }
      x.fillStyle = '#c5d0d4';
      x.font = '13px sans-serif';
      x.fillText('Detail / normal camera size', left + 165, top + 322);
    }
  fs.writeFileSync(
    __dirname + '/' + (mira ? 'mira-staff-preview.png' : 'mage-staff-preview.png'),
    c.toBuffer('image/png'),
  );
}
staffSheet();
staffSheet(true);
fs.writeFileSync(
  __dirname + '/candidate-patches.json',
  JSON.stringify(
    {
      status:
        'Joel approved revised shaped lips, Mage A Moon setting, Mira C Amber ring on 20 October 2026; selected choices integrated in dev.103. Other choices unselected.',
      date: '2026-10-20',
      baseVersion: '0.9.1+snapshot.dev.102',
      sourceSha256: crypto.createHash('sha256').update(live).digest('hex'),
      mouthPatches,
      staffHelpers,
      staffChoices: ['A', 'B', 'C'],
      staffConstraint:
        'Staff-only changes. Use original x=18 axis; preserve all original arm and grip code. Staff views use LIVE dev.102 faces, independent of the mouth proposal.',
      mouthRule:
        'Shaped upper and lower lips replace the original mouth, preserving its expression curve and Lyss’s raised corner. The broad-line preview was explicitly rejected. No new face shading; crowned scarf retained.',
    },
    null,
    2,
  ) + '\n',
);
console.log('Wrote three preview sheets and exact in-memory candidates. Runtime source unchanged.');
