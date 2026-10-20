'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'),
  { createCanvas } = require(root + '/node_modules/@napi-rs/canvas');
const live = fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8');
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
proposed = patch(
  proposed,
  "function face(x, y, color = skin, bulk = 1, aged = false, mood = 'steady')",
  "function face(x, y, color = skin, bulk = 1, aged = false, mood = 'steady', lipColor = null)",
);
proposed = patch(
  proposed,
  "ctx.strokeStyle = '#825a50';\n      ctx.lineWidth = 0.9;",
  "ctx.strokeStyle = lipColor || '#825a50';\n      ctx.lineWidth = lipColor ? 1.65 : 0.9;",
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
  "line([[-2, -30], [2, -30]], '#a94058', 1.65);",
);
// Preview geometry only: one colored stroke uses the ORIGINAL mouth curve verbatim.
// No lip overlay, second contour, gloss, new face shading or expression change.
const mouthPatches = patches.slice();
const staffHelpers = `
    function previewStaff(option, woodland = false) {
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
      if (!woodland) {
        line([[14,-6],[24,-4]],ink,5.3);
        line([[14,-6],[24,-4]],skin,3.3);
        grip(24,-4);
      }
    }
`;
function staffVersion(option) {
  let s = proposed.replace('    function mageHead(', staffHelpers + '\n    function mageHead(');
  let start = s.indexOf('        line(', s.indexOf('        mageHead();')),
    end = s.indexOf('        poly(', start);
  s = s.slice(0, start) + `        previewStaff('${option}');\n` + s.slice(end);
  const crowned = s.indexOf('        mageHead(true);');
  start = s.lastIndexOf('        line(\n          [\n            [18, -36]', crowned);
  if (start < 0) throw Error('Crowned staff anchor');
  s = s.slice(0, start) + `        previewStaff('${option}');\n` + s.slice(crowned);
  const specialist = s.indexOf('    function specialist(e)'),
    thorn = s.indexOf("case 'thorn':", specialist);
  start = s.indexOf('          line(\n            [\n              [18, -36]', thorn);
  end = s.indexOf('          rect(-17, -10', start);
  if (start < 0 || end < 0) throw Error('Mira staff anchor');
  s = s.slice(0, start) + `          previewStaff('${option}', true);\n` + s.slice(end);
  return s.replace(
    'const hand = teacher ? { x: 19, y: -8 }',
    "const hand = teacher ? (e.family === 'thorn' ? { x: 24, y: -4 } : { x: 19, y: -8 })",
  );
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
  'Flat rose color follows each original expression. No extra mouth, highlight or face shading.',
);
const columns = ['Original expression', 'Released dev.102', 'Proposed · single colored mouth'];
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
    'Straight shafts, fitted hand grips, compact heads. Existing hair, clothing and body retained.',
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
      status: 'Preview only; owner review pending. No runtime edits or deployment.',
      date: '2026-10-20',
      baseVersion: '0.9.1+snapshot.dev.102',
      sourceSha256: crypto.createHash('sha256').update(live).digest('hex'),
      mouthPatches,
      staffHelpers,
      staffChoices: ['A', 'B', 'C'],
      mouthRule:
        'Replace existing mouth stroke with a colored stroke along the exact same curve. Lyss retains raised right corner. No new shading. Crowned Mage scarf retained.',
    },
    null,
    2,
  ) + '\n',
);
console.log('Wrote three preview sheets and exact in-memory candidates. Runtime source unchanged.');
