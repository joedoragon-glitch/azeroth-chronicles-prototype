'use strict';
// Preview-only procedural alternatives. Nothing imports this file in the game.
const palette = {
  ink: '#283b32',
  plaster: '#c9b88e',
  shadow: '#858769',
  timber: '#836346',
  light: '#c7a677',
  roof: '#ac7355',
  roofLight: '#c18a65',
  roofSide: '#865b48',
  stone: '#89927d',
  glass: '#719b8b',
  cream: '#eee0b5',
  green: '#66815b',
};
const options = [
  {
    id: 'refuge',
    name: 'Millhaven Refuge',
    entity: 'rest',
    choices: [
      ['Hearth Hall', 'A broad public hall with a sheltered entrance.'],
      ['Shelter Court', 'Two wings around an open, welcoming courtyard.'],
      ['Lantern House', 'A civic refuge marked by a tall lantern cupola.'],
    ],
  },
  {
    id: 'orchard',
    name: 'Orchard Hamlet · recovery house',
    entity: 'minor',
    choices: [
      ['Harvest Hall', 'A communal barn hall with an apple crest.'],
      ['Orchard Court', 'An open garden court with covered resting bays.'],
      ['Wayside Hearth', 'A low orchard lodge with a warm chimney and porch.'],
    ],
  },
  {
    id: 'captain',
    name: 'Millhaven Captain',
    entity: 'recruiter',
    choices: [
      ['Watch House', 'A compact guardhouse with a lookout balcony.'],
      ['Company Lodge', 'An orderly timber hall with an open equipment bay.'],
      ['Captain’s Gate', 'An open command gateway with a shield crest.'],
    ],
  },
  {
    id: 'supplies',
    name: 'Millhaven Supplies',
    entity: 'supplier',
    choices: [
      ['Provision Store', 'A hoist-front storehouse with an open stock bay.'],
      ['Market Arcade', 'Two covered counters beneath a broad tiled roof.'],
      ['Wagon Store', 'A tall stock barn with a sheltered loading porch.'],
    ],
  },
  {
    id: 'mill',
    name: 'Mill pond',
    entity: 'mill-pond',
    choices: [
      ['Wheel House', 'A working timber mill with a large waterwheel.'],
      ['Pondside Mill', 'A low mill and covered race beside the pond.'],
      ['Twin Gable Mill', 'Paired roofs over a stone millrace and wheel.'],
    ],
  },
  {
    id: 'treasury',
    name: 'Thornfang’s Treasury',
    entity: 'supply-entrance',
    choices: [
      ['Thorn Lodge', 'A fortified timber lodge with a tusk-framed threshold.'],
      ['Root Vault', 'An earthen store vault held within living roots.'],
      ['Stockade Counting House', 'A palisade storehouse with a guarded counting hatch.'],
    ],
  },
];
function draw(ctx, id, variant, x = 0, y = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const P = palette;
  function shape(c, fn, stroke = P.ink, w = 1.25) {
    ctx.beginPath();
    fn();
    ctx.fillStyle = c;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = w;
      ctx.stroke();
    }
  }
  function poly(v, c, stroke = P.ink, w = 1.25) {
    shape(
      c,
      () => {
        v.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
        ctx.closePath();
      },
      stroke,
      w,
    );
  }
  function line(v, c = P.ink, w = 1.25) {
    ctx.beginPath();
    v.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.stroke();
  }
  function box(x, y, w, h, c, r = 1.3) {
    shape(c, () => ctx.roundRect(x, y, w, h, r));
  }
  function oval(x, y, a, b, c, stroke = P.ink) {
    shape(c, () => ctx.ellipse(x, y, a, b, 0, 0, Math.PI * 2), stroke);
  }
  function beam(a, b, w = 3, c = P.timber) {
    line([a, b], P.ink, w + 1.4);
    line([a, b], c, w);
    line(
      [
        [a[0] - 0.5, a[1]],
        [b[0] - 0.5, b[1]],
      ],
      P.light,
      0.55,
    );
  }
  function boards(x, y, w, h, c = P.timber, horizontal = false) {
    box(x, y, w, h, c);
    for (let n = 6; n < (horizontal ? h : w); n += 6)
      line(
        horizontal
          ? [
              [x + 0.5, y + n],
              [x + w - 0.5, y + n],
            ]
          : [
              [x + n, y + 0.5],
              [x + n, y + h - 0.5],
            ],
        '#6e573f',
        0.65,
      );
  }
  function stone(x, y, w, h) {
    box(x, y, w, h, P.stone);
    for (let j = 6; j < h; j += 6) {
      line(
        [
          [x, y + j],
          [x + w, y + j],
        ],
        '#576653',
        0.65,
      );
      for (let i = j % 12 ? 5 : 12; i < w; i += 13)
        line(
          [
            [x + i, y + j - 5],
            [x + i, y + j],
          ],
          '#65745e',
          0.65,
        );
    }
  }
  function wall(x, y, w, h) {
    poly(
      [
        [x + w, y],
        [x + w + 9, y - 6],
        [x + w + 9, y + h - 4],
        [x + w, y + h],
      ],
      P.shadow,
    );
    box(x, y, w, h, P.plaster);
    for (const a of [x + 2, x + w - 2]) beam([a, y], [a, y + h], 2.3);
    beam([x, y + h - 2], [x + w, y + h - 2], 2.5);
  }
  function roof(x, y, w, rise = 27, style = 'gable') {
    const ridge = x + w * 0.48,
      top = y - rise;
    let face =
      style === 'hip'
        ? [
            [x, y],
            [x + w * 0.2, top + 3],
            [x + w * 0.7, top - 3],
            [x + w, y],
          ]
        : [
            [x, y],
            [ridge, top],
            [x + w, y],
          ];
    poly(
      [
        [ridge, top],
        [ridge + 10, top - 5],
        [x + w + 9, y - 6],
        [x + w, y],
      ],
      P.roofSide,
    );
    poly(face, P.roof);
    ctx.save();
    ctx.beginPath();
    face.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.closePath();
    ctx.clip();
    for (let q = 8; q < rise + 3; q += 8) {
      let yy = top + q;
      line(
        [
          [x, yy],
          [x + w, yy],
        ],
        '#d3a87b',
        0.9,
      );
      for (let a = x + (q % 16 ? 6 : 13); a < x + w; a += 15)
        line(
          [
            [a, yy - 7],
            [a + 2, yy],
          ],
          '#775642',
          0.7,
        );
    }
    ctx.restore();
    beam([x - 1, y + 1], [x + w + 1, y + 1], 3.3);
    line(
      [
        [x + 3, y - 2],
        [ridge, top + 2],
      ],
      P.roofLight,
      1.4,
    );
  }
  function door(x, y, w = 15, h = 27, open = false) {
    box(x - 2, y - 2, w + 4, h + 3, P.timber, 3);
    box(x, y, w, h, open ? '#314c3d' : '#92724c', 2);
    if (!open) {
      for (let i = 4; i < w; i += 4)
        line(
          [
            [x + i, y + 1],
            [x + i, y + h - 1],
          ],
          '#62553d',
          0.65,
        );
      beam([x + 1, y + 8], [x + w - 1, y + 8], 1.2, '#b4ac86');
      oval(x + w - 3, y + h * 0.65, 0.9, 0.9, P.ink);
    }
    stone(x - 4, y + h, w + 8, 3.5);
  }
  function win(x, y, w = 13, h = 15, lit = false) {
    box(x - 1, y - 1, w + 2, h + 2, P.timber);
    box(x, y, w, h, lit ? '#e2c984' : P.glass);
    line(
      [
        [x + w / 2, y],
        [x + w / 2, y + h],
      ],
      P.cream,
      0.85,
    );
    line(
      [
        [x, y + h / 2],
        [x + w, y + h / 2],
      ],
      P.cream,
      0.85,
    );
  }
  function chimney(x, y, h = 26) {
    stone(x, y, 10, h);
    box(x - 1, y - 2, 12, 4, '#737e6b');
    oval(x + 5, y - 1, 4, 1.2, '#415145');
  }
  function lantern(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    line(
      [
        [0, -8],
        [0, -5],
      ],
      P.ink,
      1,
    );
    box(-3, -5, 6, 9, '#56604a', 1);
    box(-1.8, -3, 3.6, 5.5, '#f3d28c', 0.5);
    poly(
      [
        [-4, -5],
        [0, -8],
        [4, -5],
      ],
      P.timber,
    );
    ctx.restore();
  }
  function bench(x, y, w = 23) {
    beam([x + 3, y], [x + 3, y + 6], 1.6);
    beam([x + w - 3, y], [x + w - 3, y + 6], 1.6);
    boards(x, y - 3, w, 4, P.light, true);
  }
  function pot(x, y, leaf = true) {
    shape('#997357', () => {
      ctx.moveTo(x - 4, y - 7);
      ctx.lineTo(x + 4, y - 7);
      ctx.quadraticCurveTo(x + 5, y + 1, x, y + 2);
      ctx.quadraticCurveTo(x - 5, y + 1, x - 4, y - 7);
    });
    line(
      [
        [x - 4, y - 7],
        [x + 4, y - 7],
      ],
      P.light,
      1.3,
    );
    if (leaf) {
      beam([x, y - 7], [x, y - 13], 0.8, P.green);
      oval(x - 3, y - 13, 3, 1.5, P.green);
      oval(x + 2, y - 16, 2, 3, '#8d9b6b');
    }
  }
  function crest(x, y, kind = 'shelter', size = 10) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 10, size / 10);
    box(-7, -8, 14, 17, '#ded1a6', 2);
    if (kind === 'apple') {
      oval(-2, 1, 3.2, 4, '#ae6750');
      oval(2, 1, 3.2, 4, '#ae6750');
      line(
        [
          [0, -2],
          [1, -6],
        ],
        P.timber,
        1.1,
      );
      oval(3, -5, 2.5, 1.2, P.green);
    } else if (kind === 'shield') {
      poly(
        [
          [-5, -5],
          [5, -5],
          [4, 3],
          [0, 6],
          [-4, 3],
        ],
        '#6b8370',
      );
      line(
        [
          [-3, -1],
          [0, 3],
          [3, -2],
        ],
        P.cream,
        1.3,
      );
    } else if (kind === 'store') {
      box(-4, -3, 8, 7, '#ab8351');
      line(
        [
          [-4, -2],
          [4, 4],
        ],
        P.light,
        1,
      );
    } else {
      poly(
        [
          [-5, -1],
          [0, -6],
          [5, -1],
        ],
        P.roof,
      );
      line(
        [
          [-4, 0],
          [-4, 5],
          [4, 5],
          [4, 0],
        ],
        P.timber,
        1.4,
      );
      oval(0, 2, 1.5, 2, '#cf9e51');
    }
    ctx.restore();
  }
  function porch(x, y, w = 43, d = 16) {
    poly(
      [
        [x, y],
        [x + w, y],
        [x + w + 7, y + d],
        [x - 6, y + d],
      ],
      '#a3936b',
    );
    for (let j = 4; j < d; j += 4)
      line(
        [
          [x - 3, y + j],
          [x + w + 3, y + j],
        ],
        '#6e704e',
        0.65,
      );
    for (const a of [x - 2, x + w + 2]) beam([a, y + d], [a, y - 17], 2.4);
    roof(x - 8, y - 17, w + 16, 11, 'hip');
  }
  function hall(x = -38, y = -35, w = 76, h = 47, rise = 29, style = 'gable') {
    stone(x - 1, y + h - 5, w + 2, 8);
    wall(x, y, w, h - 4);
    roof(x - 5, y, w + 10, rise, style);
  }
  function bed(x, y) {
    box(x, y, 17, 7, '#dacda7');
    box(x + 1, y, 5, 5, '#eee3c1');
    box(x + 6, y, 10, 6, '#93a085');
    for (const a of [x + 1, x + 16]) beam([a, y + 3], [a, y + 10], 1.4);
  }
  function barrel(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    shape('#ae8c57', () => {
      ctx.moveTo(-6, -15);
      ctx.quadraticCurveTo(-9, -6, -6, 0);
      ctx.quadraticCurveTo(0, 3, 6, 0);
      ctx.quadraticCurveTo(9, -6, 6, -15);
      ctx.closePath();
    });
    oval(0, -15, 6, 2, '#cab079');
    for (const q of [-11, -3])
      line(
        [
          [-7, q],
          [7, q],
        ],
        '#798777',
        2,
      );
    line(
      [
        [0, -12],
        [0, -1],
      ],
      '#705c3f',
      0.7,
    );
    ctx.restore();
  }
  function crate(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    boards(-7, -12, 14, 12, '#a68b5b');
    line(
      [
        [-6, -11],
        [6, -1],
      ],
      P.light,
      1.5,
    );
    ctx.restore();
  }
  function banner(x, y, color = '#73917b', kind = 'shield') {
    beam([x, y], [x, y - 29], 1.6);
    poly(
      [
        [x + 1, y - 27],
        [x + 13, y - 25],
        [x + 12, y - 10],
        [x + 6, y - 7],
        [x + 1, y - 10],
      ],
      color,
    );
    if (kind === 'shield')
      line(
        [
          [x + 4, y - 21],
          [x + 8, y - 17],
          [x + 11, y - 22],
        ],
        P.cream,
        1.1,
      );
  }
  function tree(x, y, s = 0.7) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    beam([0, 0], [0, -26], 4);
    for (const [a, b, r] of [
      [-10, -26, 12],
      [9, -29, 13],
      [0, -38, 13],
    ])
      oval(a, b, r, r * 0.82, '#66855c');
    for (const [a, b] of [
      [-10, -27],
      [5, -35],
      [12, -24],
    ])
      oval(a, b, 2, 2, '#c19756');
    ctx.restore();
  }
  function wheel(x, y, r = 18) {
    oval(x, y, r, r, '#795c40');
    oval(x, y, r - 4, r - 4, '#4c6758');
    for (let k = 0; k < 10; k++) {
      let a = (k * Math.PI) / 5;
      beam([x, y], [x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2)], 2, '#bb9869');
      ctx.save();
      ctx.translate(x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1));
      ctx.rotate(a);
      box(-2, -4, 5, 8, '#a98a5b', 0.5);
      ctx.restore();
    }
    oval(x, y, r - 5, r - 5, '#00000000', '#b89c71');
    oval(x, y, 3, 3, '#b8aa80');
  }
  function water(x, y, w = 100) {
    oval(x, y, w / 2, 13, '#527f76', null);
    for (const [a, b, c] of [
      [-30, -2, 18],
      [0, 5, 23],
      [22, -5, 14],
    ])
      line(
        [
          [x + a, y + b],
          [x + a + c, y + b],
        ],
        '#91b5a0',
        1.3,
      );
  }
  function tusk(x, y, dir = 1) {
    shape('#ded5af', () => {
      ctx.moveTo(x - 3, y + 12);
      ctx.quadraticCurveTo(x + dir * 10, y + 6, x + dir * 4, y - 8);
      ctx.quadraticCurveTo(x + dir * 2, y + 1, x - 3, y + 5);
      ctx.closePath();
    });
  }
  function vines(x, y) {
    for (let i = 0; i < 5; i++) {
      let a = x + i * 6;
      line(
        [
          [a, y + 4],
          [a + 4, y - 4],
          [a + 10, y],
        ],
        '#3f5b3a',
        1.7,
      );
      oval(a + 4, y - 4, 3, 1.8, '#78905b');
    }
  }
  function fence(x, y, w = 32) {
    for (let a = x; a <= x + w; a += 8) {
      poly(
        [
          [a - 2, y],
          [a - 2, y - 21],
          [a, y - 26],
          [a + 2, y - 21],
          [a + 2, y],
        ],
        '#7d704d',
      );
    }
    beam([x, y - 6], [x + w, y - 6], 2);
  }
  oval(2, 17, 61, 12, '#213d2d55', null);
  if (id === 'refuge') {
    if (variant === 0) {
      chimney(-32, -73, 31);
      hall(-47, -38, 94, 52, 31, 'hip');
      win(-38, -28, 16, 20, true);
      win(22, -28, 16, 20, true);
      door(-10, -21, 20, 33, true);
      porch(-21, 6, 42, 13);
      crest(0, -47, 'shelter', 10);
      bench(-49, 14, 22);
      lantern(36, -22, 1.1);
    } else if (variant === 1) {
      hall(-29, -48, 58, 39, 28, 'hip');
      door(-9, -30, 18, 30, true);
      crest(0, -55, 'shelter', 10);
      for (const a of [-52, 28]) {
        hall(a, -25, 24, 43, 23);
        win(a + 7, -12, 10, 14, true);
      }
      poly(
        [
          [-25, 0],
          [26, 0],
          [33, 22],
          [-34, 22],
        ],
        '#a39372',
      );
      line(
        [
          [-23, 10],
          [25, 10],
        ],
        '#c4b48b',
        1,
      );
      bench(-42, 17, 18);
      bench(25, 17, 18);
      lantern(-23, -4);
      lantern(24, -4);
      pot(-4, 15);
    } else {
      hall(-44, -32, 88, 45, 27, 'hip');
      win(-34, -22, 15, 18, true);
      win(23, -22, 13, 18, true);
      wall(-15, -81, 30, 50);
      win(-10, -71, 20, 19, true);
      roof(-21, -81, 42, 15, 'hip');
      for (const a of [-13, 13]) beam([a, -80], [a, -46], 2.1);
      box(-13, -48, 26, 7, P.timber);
      door(-11, -22, 22, 34, true);
      porch(-23, 7, 46, 13);
      crest(0, -35);
      bench(30, 16, 20);
      lantern(-35, -10);
    }
  } else if (id === 'orchard') {
    if (variant === 0) {
      hall(-43, -34, 86, 48, 38);
      wall(-18, -54, 36, 20);
      roof(-22, -54, 44, 23);
      crest(0, -46, 'apple', 11);
      door(-12, -21, 24, 33, true);
      win(-34, -23, 12, 17, true);
      win(24, -23, 12, 17, true);
      porch(-22, 7, 44, 12);
      bench(-48, 14, 23);
      pot(40, 13);
      tree(51, 1, 0.45);
    } else if (variant === 1) {
      hall(-35, -49, 70, 35, 24, 'hip');
      door(-8, -35, 16, 25, true);
      crest(0, -57, 'apple');
      for (const a of [-51, 30]) {
        wall(a, -19, 22, 35);
        box(a + 3, -15, 16, 27, '#45614a');
        bed(a + 4, -1);
        roof(a - 4, -19, 30, 19);
      }
      poly(
        [
          [-29, -9],
          [30, -9],
          [36, 23],
          [-36, 23],
        ],
        '#b3a67b',
      );
      bench(-19, 14, 30);
      pot(-25, 3);
      pot(26, 3);
      tree(52, 0, 0.4);
    } else {
      chimney(-37, -62, 30);
      hall(-42, -29, 84, 43, 23, 'hip');
      door(-7, -17, 16, 29, true);
      win(-31, -19, 15, 16, true);
      win(19, -19, 14, 16, true);
      porch(-39, 9, 78, 13);
      bench(-34, 13, 22);
      bench(16, 13, 22);
      crest(1, -37, 'apple', 9);
      lantern(-38, -10);
      tree(52, 10, 0.48);
    }
  } else if (id === 'captain') {
    if (variant === 0) {
      hall(-46, -29, 68, 43, 26);
      door(-27, -17, 16, 29, true);
      win(2, -19, 11, 15);
      stone(16, -58, 30, 70);
      wall(16, -58, 30, 28);
      roof(12, -58, 38, 21);
      box(19, -48, 24, 16, '#3f5240');
      beam([14, -26], [48, -26], 3);
      for (let a = 18; a < 47; a += 7) beam([a, -26], [a, -35], 1.5);
      beam([15, -36], [48, -36], 2);
      crest(30, -15, 'shield', 10);
      banner(-47, 6);
      bench(-5, 14, 18);
    } else if (variant === 1) {
      hall(-46, -38, 92, 51, 30, 'hip');
      door(-11, -23, 21, 35, true);
      crest(0, -47, 'shield', 11);
      win(-34, -27, 14, 17);
      box(22, -26, 18, 31, '#354f40');
      for (let a = 25; a < 41; a += 6) {
        beam([a, 1], [a, -19], 1.4);
        poly(
          [
            [a, -23],
            [a + 2, -18],
            [a - 2, -18],
          ],
          '#a6b1a1',
        );
      }
      banner(-48, 11);
      bench(-32, 14, 22);
      lantern(15, -17);
    } else {
      for (const a of [-47, 25]) {
        stone(a, -22, 22, 36);
        wall(a, -55, 22, 34);
        win(a + 6, -44, 10, 16);
        roof(a - 4, -55, 30, 18);
      }
      beam([-25, -25], [25, -25], 8);
      roof(-32, -33, 64, 22, 'hip');
      crest(0, -38, 'shield', 12);
      beam([-25, -23], [-25, 16], 3);
      beam([25, -23], [25, 16], 3);
      banner(-47, 7);
      lantern(27, -17);
      bench(31, 15, 20);
    }
  } else if (id === 'supplies') {
    if (variant === 0) {
      hall(-39, -41, 78, 55, 35);
      box(-23, -18, 39, 31, '#354c3e');
      boards(-23, -41, 39, 18, P.shadow);
      beam([-26, -47], [-26, -72], 2.8);
      beam([-27, -71], [-3, -71], 2.8);
      line(
        [
          [-8, -71],
          [-8, -49],
        ],
        '#bdae82',
        1.5,
      );
      crate(-8, -42, 0.7);
      win(23, -28, 10, 14);
      crest(20, -50, 'store', 9);
      crate(-13, 11);
      crate(4, 11, 0.85);
      barrel(34, 15, 0.8);
      porch(-26, 8, 50, 12);
    } else if (variant === 1) {
      hall(-47, -40, 94, 52, 25, 'hip');
      for (const a of [-38, 6]) {
        box(a, -23, 32, 28, '#354c3e');
        boards(a, -1, 32, 14, '#a58a5d', true);
      }
      roof(-52, -24, 104, 11, 'hip');
      for (const a of [-45, 0, 45]) beam([a, -22], [a, 15], 2.5);
      for (const a of [-30, -18, 15]) oval(a, -4, 3.5, 3, '#c2b38c');
      barrel(33, 11, 0.6);
      crest(0, -47, 'store', 9);
      crate(-48, 16, 0.7);
    } else {
      hall(-35, -42, 70, 56, 38);
      box(-15, -34, 30, 20, P.timber);
      line(
        [
          [-13, -32],
          [13, -16],
        ],
        P.light,
        2,
      );
      crest(0, -62, 'store', 10);
      door(-13, -9, 27, 22, true);
      win(-28, -28, 9, 13);
      win(20, -28, 9, 13);
      porch(-44, 11, 88, 16);
      crate(-34, 17);
      barrel(32, 17, 0.9);
      box(-19, 10, 37, 8, P.timber);
      for (const a of [-14, 13]) oval(a, 20, 5, 5, '#6d694d');
      crate(-6, 8, 0.7);
    }
  } else if (id === 'mill') {
    water(7, 18, 125);
    if (variant === 0) {
      stone(-40, -24, 64, 39);
      wall(-40, -47, 64, 32);
      roof(-45, -47, 74, 30);
      win(-30, -35, 14, 16);
      door(-5, -15, 17, 26);
      boards(24, -30, 28, 5, '#a28b61', true);
      beam([26, -24], [46, -24], 3);
      wheel(39, -3, 21);
      line(
        [
          [45, -23],
          [50, -2],
          [48, 13],
        ],
        '#9ebfa9',
        2,
      );
      crate(-39, 16, 0.7);
    } else if (variant === 1) {
      hall(-45, -33, 79, 46, 26, 'hip');
      win(-36, -21, 13, 16);
      door(-11, -18, 16, 29);
      win(13, -21, 13, 16);
      stone(32, -11, 22, 23);
      wheel(37, 0, 16);
      roof(24, -17, 37, 12, 'hip');
      boards(-43, 11, 57, 8, '#af986d', true);
      for (const a of [-39, 9]) beam([a, 12], [a, 23], 2);
      barrel(-36, 11, 0.65);
    } else {
      for (const a of [-44, -4]) {
        stone(a, -26, 39, 40);
        wall(a, -42, 39, 23);
        roof(a - 3, -42, 45, 27);
        win(a + 9, -33, 12, 13);
      }
      door(-18, -14, 17, 27);
      wheel(40, 1, 20);
      beam([20, -16], [54, -16], 3);
      poly(
        [
          [43, 4],
          [54, 8],
          [58, 19],
          [44, 19],
        ],
        '#71978a',
      );
      crate(-41, 16, 0.75);
    }
  } else if (id === 'treasury') {
    if (variant === 0) {
      hall(-44, -36, 88, 50, 32, 'hip');
      boards(-34, -24, 68, 36, '#88734b');
      door(-13, -20, 26, 32, true);
      for (const a of [-33, 29]) beam([a, 12], [a, -28], 4);
      tusk(-16, -28, -1);
      tusk(20, -28, 1);
      vines(-32, -40);
      vines(9, -40);
      box(27, -18, 10, 12, '#354b36');
      for (const a of [29, 33, 36]) beam([a, -18], [a, -7], 0.9, '#a1a081');
      crate(-44, 17, 0.8);
      fence(32, 16, 24);
    } else if (variant === 1) {
      shape('#6a7952', () => {
        ctx.moveTo(-57, 14);
        ctx.bezierCurveTo(-58, -40, -18, -62, 5, -59);
        ctx.bezierCurveTo(36, -63, 59, -23, 58, 15);
        ctx.closePath();
      });
      shape('#506349', () => {
        ctx.moveTo(-32, 14);
        ctx.bezierCurveTo(-39, -39, 24, -50, 33, 14);
        ctx.closePath();
      });
      stone(-25, -20, 50, 32);
      door(-13, -17, 26, 29, true);
      roof(-31, -22, 62, 21, 'hip');
      for (const [a, d] of [
        [-42, -1],
        [43, 1],
      ]) {
        shape('#7f6d48', () => {
          ctx.moveTo(a - 7, 14);
          ctx.bezierCurveTo(a - 4, -16, a + d * 3, -36, a - d * 14, -49);
          ctx.lineTo(a - d * 5, -52);
          ctx.bezierCurveTo(a + d * 13, -31, a + 9, -10, a + 9, 13);
          ctx.closePath();
        });
      }
      for (const [a, b] of [
        [-29, -45],
        [-7, -58],
        [18, -53],
        [38, -34],
      ]) {
        oval(a - 5, b + 1, 7, 4, '#5e7950');
        oval(a + 4, b, 8, 5, '#68835a');
        oval(a, b - 4, 6, 4, '#7b9162');
      }
      tusk(-16, -22, -1);
      tusk(19, -22, 1);
      crate(43, 17, 0.8);
    } else {
      fence(-56, 13, 112);
      hall(-33, -39, 66, 51, 34);
      boards(-27, -29, 54, 39, '#8f764d');
      door(-12, -19, 24, 31, true);
      for (const a of [-48, 42]) {
        stone(a, -13, 9, 28);
        beam([a + 4, -11], [a + 4, -40], 3);
        tusk(a + 4, -34, a < 0 ? -1 : 1);
      }
      roof(-44, -11, 88, 14, 'hip');
      box(20, -21, 13, 11, '#334732');
      for (const a of [23, 27, 30])
        line(
          [
            [a, -20],
            [a, -11],
          ],
          '#a5aa8b',
          1,
        );
      box(-39, 5, 15, 4, P.light);
      oval(-34, 3, 2, 1, '#b9c3ad');
      oval(-29, 3, 2, 1, '#c5cbb8');
      vines(-24, -43);
    }
  }
  ctx.restore();
}
module.exports = { draw, options, palette };
