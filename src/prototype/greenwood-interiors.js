/* Greenwood occupied interiors: local composition, v4 reconciliation and procedural furniture. */
(function (root) {
  'use strict';
  const version = 1,
    ids = new Set(['supply-vale', 'crypt', 'side-vale-cellars']);
  const treasury = [
    [190, 740, 'goblin-cot', 24, 'private'],
    [180, 235, 'reclamation-cradles', 0, 'receiving'],
    [740, 235, 'inventory-cabinet', 24, 'inventory'],
    [675, 520, 'reclamation-bench', 26, 'work'],
    [180, 475, 'warm-brazier', 16, 'household'],
    [775, 770, 'pay-chest', 20, 'reserve'],
    [300, 760, 'personal-locker', 0, 'private'],
    [540, 230, 'reclamation-cradles', 0, 'receiving'],
    [270, 600, 'root-table', 18, 'household'],
    [790, 415, 'tool-rack', 0, 'work'],
    [175, 585, 'ration', 0, 'household'],
    [745, 570, 'reclamation-ledger', 0, 'accounts'],
    [540, 760, 'tool-rack', 0, 'equipment'],
    [560, 440, 'supply-stack', 0, 'inventory'],
  ];
  const crypt = [
    [210, 270, 'supply-stack'],
    [450, 270, 'tool-rack'],
    [230, 430, 'torch'],
    [490, 430, 'woodpile'],
    [220, 600, 'coffin'],
    [510, 560, 'ossuary'],
    [220, 900, 'grave-marker'],
    [520, 960, 'grave-lamp'],
    [600, 410, 'tool-rack'],
    [820, 400, 'woodpile'],
    [590, 770, 'supply-stack'],
    [890, 840, 'torch'],
    [1230, 350, 'forge'],
    [1290, 530, 'tool-rack'],
    [1130, 670, 'weapon-rack'],
    [1270, 720, 'supply-stack'],
    [240, 1100, 'sleep-roll'],
    [385, 1110, 'estate-rug'],
    [285, 1300, 'estate-hearth'],
    [560, 1310, 'estate-lounge'],
    [200, 1000, 'warm-brazier'],
    [620, 980, 'banner'],
    [610, 1110, 'sleep-roll'],
    [650, 1340, 'warm-brazier'],
    [420, 1220, 'game-table'],
    [800, 1150, 'binding-desk'],
    [785, 1330, 'sleep-roll'],
    [980, 1310, 'scroll-stack'],
    [780, 970, 'torch'],
    [1060, 870, 'stone-seat'],
  ];
  const cellars = [
    [200, 230, 'crate'],
    [310, 230, 'ration'],
    [440, 210, 'preserve-rack'],
    [680, 230, 'root-table'],
    [850, 220, 'goblin-cot'],
    [200, 550, 'goblin-cot'],
    [340, 550, 'pup-nest'],
    [640, 530, 'tool-basket'],
    [900, 550, 'cellar-hearth'],
    [270, 850, 'crate'],
    [700, 850, 'game-table'],
    [180, 740, 'sleep-roll'],
    [880, 800, 'goblin-cot'],
  ];
  const custom = new Set([
    'goblin-cot',
    'reclamation-cradles',
    'inventory-cabinet',
    'reclamation-bench',
    'pay-chest',
    'personal-locker',
    'reclamation-ledger',
    'binding-desk',
    'preserve-rack',
    'tool-basket',
    'cellar-hearth',
    'cellar-pier',
    'estate-plan-board',
    'worker-tool-stand',
  ]);
  function configure(R) {
    // Geometry is scoped to these interiors; no stats, roster, drops or skill changes.
    R.treasuryArchitecture['supply-vale'] = {
      version: 1,
      walkable: [
        { id: 'receiving-household', bounds: [40, 435, 40, 860] },
        { id: 'reclamation-office', bounds: [370, 860, 140, 825] },
      ],
      surfaces: [
        { kind: 'earth', bounds: [90, 340, 180, 360] },
        { kind: 'unfinished', bounds: [510, 820, 180, 465] },
        { kind: 'private-rug', bounds: [110, 350, 650, 825] },
      ],
      partitions: R.treasuryWalls['supply-vale'].map((p) => ({
        ...p,
        gaps: p.gaps.map((g) => [...g]),
      })),
    };
    R.treasuryDecor['supply-vale'] = treasury.map(([x, y, k, r, role]) => [
      x,
      y,
      k,
      r,
      'scornfang-' + role,
    ]);
    // Same eight defender identities/roles. The ranged captain has room to work
    // behind the two-opening screen, supported from both flanks.
    const posts = [
      [300, 360],
      [540, 340],
      [580, 650],
      [735, 610],
      [290, 610],
      [680, 280],
      [705, 415],
      [680, 735],
    ];
    R.treasuryGuardFormations['supply-vale'].forEach((p, j) => {
      [p.x, p.y] = posts[j];
    });
    R.treasuryGuardFormations['supply-vale'][3].name = 'Scornfang';
    R.interiorEncounterLayout['supply-vale'] = {
      version: 1,
      captain: { x: 735, y: 610 },
      guards: [0, 1, 2, 4, 5, 6, 7],
    };
    const a = R.dungeonArchitecture.crypt;
    R.dungeonDecor.crypt = crypt.map(([x, y, k]) => [x, y, k, 'estate-work']);
    a.version = 5;
    const retreat = a.walkable.find((p) => p.id === 'protected-retreat');
    retreat.bounds = [930, 1420, 790, 1420];
    // An alternate flank supplements the original central opening. No forced
    // choke restricts the Lifebinder's movement or accumulating attendants.
    a.walkable.push({ id: 'retreat-flank', bounds: [850, 1040, 1060, 1350] });
    const gate = a.partitions.find((p) => p.id === 'retreat-threshold');
    gate.gaps = [
      [1000, 1100],
      [1160, 1350],
    ];
    R.interiorEncounterLayout.crypt = {
      ...R.interiorEncounterLayout.crypt,
      version: 2,
      boss: { x: 1210, y: 1210 },
      guards: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    const guardPosts = [
      [350, 450],
      [510, 360],
      [330, 620],
      [470, 620],
      [650, 810],
      [820, 810],
      [1100, 720],
      [1260, 740],
      [1080, 940],
      [1320, 950],
    ];
    R.dungeonGuardFormations.crypt.forEach((p, j) => {
      [p.x, p.y] = guardPosts[j];
    });
    const side = R.sideDungeons.find((p) => p.id === 'side-vale-cellars');
    side.decor = cellars.map((r) => [...r]);
  }
  function install(C, { R }) {
    if (R.greenwoodLayout?.version !== 2) return;
    configure(R);
    C.prototype.greenwoodInteriorScene = function (z) {
      if (!ids.has(z.id) || z.greenwoodInteriorVersion === version) return;
      const previous = this.s.zone;
      this.s.zone = z.id;
      try {
        const rows = z.id === 'supply-vale' ? treasury : z.id === 'crypt' ? crypt : cellars;
        const prefix =
          z.id === 'supply-vale' ? 'treasury-' : z.id === 'crypt' ? 'decor-' : 'side-decor-';
        // Retire only ten generic late-added lounge objects from the battle
        // floor. They carry no reward, ownership, inspection or progress IDs.
        if (z.id === 'crypt') z.props = z.props.filter((p) => !/^decor-(3[0-9])$/.test(p.id));
        rows.forEach(([x, y, structure, r = 0, role], j) => {
          const id = prefix + j;
          let p = z.props.find((p) => p.id === id);
          if (!p) {
            p = { id };
            z.props.push(p);
          }
          Object.assign(p, {
            x,
            y,
            structure,
            r: z.id === 'supply-vale' ? r : 0,
            decorative: z.id !== 'supply-vale' || !r,
            sceneRole: role || 'occupied-' + z.id,
            greenwoodInterior: true,
          });
          if (custom.has(structure)) p.greenwoodInteriorAsset = structure;
          else delete p.greenwoodInteriorAsset;
        });
        const add = (id, x, y, structure) => {
          if (z.props.some((p) => p.id === id)) return;
          z.props.push({
            id,
            x,
            y,
            structure,
            r: 0,
            decorative: true,
            greenwoodInterior: true,
            greenwoodInteriorAsset: structure,
          });
        };
        if (z.id === 'crypt') {
          add('greenwood-crypt-estate-plan', 710, 460, 'estate-plan-board');
          add('greenwood-crypt-worker-tools', 1160, 300, 'worker-tool-stand');
          add('greenwood-crypt-stone-care', 240, 780, 'reclamation-cradles');
          // Prepared command ground: low corner fixtures never furnish the
          // center as a second drawing room or obscure summoned attendants.
          add('greenwood-crypt-command-lamp', 1370, 1320, 'cellar-hearth');
        }
        if (z.id === 'side-vale-cellars') {
          for (const p of z.props.filter((p) => p.id.startsWith('side-wall-')))
            Object.assign(p, {
              structure: 'cellar-pier',
              greenwoodInteriorAsset: 'cellar-pier',
              greenwoodInterior: true,
            });
        }
        // Existing actors keep current casts, wounds, deaths and orders. Native
        // defenderEncounterLayout owns post migration and defers active fights.
        for (const pending of Object.values(this.s.pending || {})) {
          if (pending.zone !== z.id || !pending.base) continue;
          const match = z.enemies.find((e) => e.id === pending.base.id);
          const guards = z.enemies
            .filter(
              (e) =>
                e.guard &&
                e.form === 'normal' &&
                e.type !== 'boss' &&
                !e.summon &&
                !e.reinforcement &&
                !e.awakenedGuard,
            )
            .sort((a, b) => this.idOrder(a, b));
          const index = guards.indexOf(match),
            cfg = R.interiorEncounterLayout[z.id];
          const post =
            match?.type === 'boss'
              ? cfg?.boss
              : match?.roomCaptain
                ? cfg?.captain
                : (R.dungeonGuardFormations[z.id] || R.treasuryGuardFormations[z.id])?.[index];
          if (post)
            Object.assign(pending.base, { x: post.x, y: post.y, home: { x: post.x, y: post.y } });
        }
        if (previous === z.id)
          // enter() creates the room before replacing outdoor coordinates
          // with its arrival formation. That native transition owns actors
          // still outside this room's bounds; do not search from the Vale.
          for (const p of [this.hero, ...this.s.party])
            if (
              p.x >= 40 &&
              p.y >= 40 &&
              p.x <= this.zoneSize(z.id) - 40 &&
              p.y <= this.zoneSize(z.id) - 40 &&
              this.blocked(p.x, p.y, z.id, this.actorRadius(p))
            )
              Object.assign(p, this.safe(p.x, p.y, z.id));
        z.greenwoodInteriorVersion = version;
      } finally {
        this.s.zone = previous;
      }
    };
  }
  function draw(ctx, e, p) {
    const kind = e.greenwoodInteriorAsset;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const poly = (pts, fill, stroke = '#382f25', width = 1.4) => {
      ctx.beginPath();
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    };
    const line = (pts, color = '#493a29', width = 1.3) => {
      ctx.beginPath();
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    const oval = (x, y, rx, ry, color, rot = 0) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };
    const box = (x, y, w, d, h, colors = ['#ae8657', '#80603f', '#624b36']) => {
      const a = [x, y - h],
        b = [x + w, y + w * 0.35 - h],
        c = [x + w - d, y + (w + d) * 0.35 - h],
        f = [x - d, y + d * 0.35 - h];
      poly([f, c, [c[0], c[1] + h], [f[0], f[1] + h]], colors[1]);
      poly([b, c, [c[0], c[1] + h], [b[0], b[1] + h]], colors[2]);
      poly([a, b, c, f], colors[0]);
    };
    const paper = (x, y, w = 20) => {
      poly(
        [
          [x, y],
          [x + w, y + 6],
          [x + w - 8, y + 13],
          [x - 8, y + 7],
        ],
        '#d7ca9e',
        '#7b684a',
        0.8,
      );
      for (let j = 0; j < 3; j++)
        line(
          [
            [x + 1, y + 3 + j * 2],
            [x + w - 9, y + 6 + j * 2],
          ],
          '#6c7158',
          0.7,
        );
      oval(x + w - 10, y + 10, 1.9, 1, '#9d624b');
    };
    const leg = (x, y, h = 24) => {
      line(
        [
          [x, y],
          [x, y - h],
        ],
        '#4c3929',
        5,
      );
      line(
        [
          [x - 1, y - 2],
          [x - 1, y - h + 2],
        ],
        '#b48c5b',
        1,
      );
    };
    const tabletop = (w = 62, d = 31) => {
      oval(0, 10, w * 0.75, 12, '#10231b38');
      leg(-w / 2, 5);
      leg(w / 2 - 8, 13);
      leg(3, 25);
      box(-w * 0.4, -17, w, d, 5);
      for (let j = 0; j < 4; j++)
        line(
          [
            [-w * 0.4 + j * 14, -21 + j * 5],
            [-w * 0.4 + j * 14 - d, -21 + j * 5 + d * 0.35],
          ],
          '#d0aa72',
          0.8,
        );
    };
    oval(0, 7, kind === 'cellar-pier' ? 25 : 45, 9, '#10231b40');
    if (kind === 'goblin-cot') {
      leg(-30, 6, 12);
      leg(31, 8, 12);
      box(-24, -7, 61, 31, 7);
      poly(
        [
          [-21, -21],
          [28, -5],
          [2, 7],
          [-49, -9],
        ],
        '#697e68',
        '#445044',
      );
      ctx.beginPath();
      ctx.moveTo(-43, -11);
      ctx.quadraticCurveTo(-26, -18, -17, -19);
      ctx.lineTo(25, -5);
      ctx.lineTo(1, 4);
      ctx.closePath();
      ctx.fillStyle = '#829780';
      ctx.fill();
      poly(
        [
          [-25, -22],
          [-7, -16],
          [-18, -9],
          [-37, -16],
        ],
        '#c5b999',
        '#7b7158',
        1,
      );
      line(
        [
          [-12, -12],
          [9, -5],
          [-4, 0],
        ],
        '#b3aa7e',
        1,
      );
      line(
        [
          [-34, -7],
          [-11, 1],
        ],
        '#465c52',
        1,
      );
    } else if (
      kind === 'inventory-cabinet' ||
      kind === 'personal-locker' ||
      kind === 'preserve-rack'
    ) {
      const pantry = kind === 'preserve-rack',
        personal = kind === 'personal-locker';
      box(-25, -7, 65, 23, personal ? 66 : 88, ['#b49160', '#80633f', '#5b4937']);
      for (let j = 0; j < 3; j++) {
        const y = -70 + j * 23;
        poly(
          [
            [-39, y],
            [19, y + 20],
            [19, y + 35],
            [-39, y + 15],
          ],
          '#3d4030',
          '#584934',
          1,
        );
        if (pantry)
          for (let k = 0; k < 4; k++) {
            const x = -30 + k * 12,
              yy = y + 15 + k * 4;
            oval(x, yy, 5, 4.4, k % 2 ? '#986543' : '#75835d');
            box(x - 3, yy - 3, 6, 3, 7, ['#b69b67', '#8c7652', '#786546']);
            oval(x, yy - 10, 4, 1.5, '#d2bc87');
          }
        else if (!personal)
          for (let k = 0; k < 2; k++) {
            const x = -32 + k * 25;
            box(x, y + 16 + k * 8, 22, 10, 12, ['#b0a488', '#8a7c61', '#6c624f']);
            poly(
              [
                [x - 6, y + 10 + k * 8],
                [x, y + 12 + k * 8],
                [x, y + 18 + k * 8],
                [x - 6, y + 16 + k * 8],
              ],
              '#dbd0aa',
              '#8b7955',
              0.6,
            );
            line(
              [
                [x - 4, y + 12 + k * 8],
                [x - 2, y + 14 + k * 8],
              ],
              '#77684a',
              0.7,
            );
          }
        else {
          line(
            [
              [-32, y + 9],
              [7, y + 22],
            ],
            '#ba9866',
            1,
          );
          oval(4, y + 22, 1.5, 1.5, '#d2ba6b');
        }
      }
      line(
        [
          [-43, -9],
          [-43, -91],
        ],
        '#cca775',
        2,
      );
      line(
        [
          [22, 15],
          [22, -67],
        ],
        '#caa36b',
        2,
      );
      if (personal) {
        line(
          [
            [28, -50],
            [37, -47],
            [36, -26],
          ],
          '#4a3a28',
          2,
        );
        poly(
          [
            [33, -46],
            [43, -43],
            [46, -21],
            [35, -25],
          ],
          '#697557',
        );
      }
    } else if (
      kind === 'reclamation-bench' ||
      kind === 'reclamation-ledger' ||
      kind === 'binding-desk'
    ) {
      tabletop();
      paper(-11, -23, 26);
      paper(14, -13, 19);
      box(-28, -22, 16, 11, 7, ['#7b8a69', '#4e634d', '#43513c']);
      line(
        [
          [-24, -25],
          [-14, -22],
        ],
        '#dacda0',
        1,
      );
      if (kind === 'reclamation-bench') {
        // Cradled architectural fragment, not a claimed retired Crypt relic.
        poly(
          [
            [-15, -17],
            [3, -27],
            [19, -21],
            [21, -13],
            [4, -9],
          ],
          '#a5a18c',
          '#5c6257',
        );
        line(
          [
            [-13, -16],
            [3, -21],
            [16, -17],
          ],
          '#d1c9a6',
          2,
        );
        line(
          [
            [20, -8],
            [34, -4],
          ],
          '#62513b',
          2,
        );
        oval(33, -5, 4, 2, '#c7ae78');
        for (let j = 0; j < 3; j++)
          line(
            [
              [-30 - j * 3, -15],
              [-18 - j * 3, -9],
            ],
            '#c4b08a',
            1.4,
          );
      } else {
        oval(32, -5, 4.5, 2.5, '#3d4639');
        line(
          [
            [32, -7],
            [38, -25],
          ],
          '#e5d7aa',
          1.6,
        );
        if (kind === 'reclamation-ledger')
          for (let j = 0; j < 4; j++)
            oval(-36 + j * 4, -11 + j, 2.6, 1.2, j % 2 ? '#c2ae70' : '#a68a5f');
        else {
          box(2, -20, 15, 11, 6, ['#8a7262', '#60504a', '#463d39']);
          line(
            [
              [7, -24],
              [5, -14],
            ],
            '#b9b39d',
            1,
          );
        }
      }
    } else if (kind === 'reclamation-cradles') {
      box(-24, -4, 43, 24, 13, ['#b99b6c', '#937548', '#715b3d']);
      poly(
        [
          [-38, -13],
          [-13, -23],
          [8, -15],
          [-15, -3],
        ],
        '#b7b49e',
        '#817d68',
        1,
      );
      line(
        [
          [-35, -13],
          [-16, -17],
          [5, -13],
        ],
        '#ded3ad',
        2,
      );
      // Padded open carrying frame with folded cloth and transport tags.
      for (const x of [-39, 6])
        line(
          [
            [x, -3],
            [x, -24],
            [x + 7, -27],
          ],
          '#765a39',
          4,
        );
      paper(-1, -1, 12);
      line(
        [
          [-20, 5],
          [-8, 9],
        ],
        '#d4b17c',
        1,
      );
    } else if (kind === 'pay-chest') {
      box(-21, -4, 49, 30, 27, ['#8d7852', '#68563c', '#4c4333']);
      for (const x of [-25, 6])
        poly(
          [
            [x, -24],
            [x + 7, -22],
            [x + 7, 8],
            [x, 6],
          ],
          '#6a7568',
          '#3b443c',
          1,
        );
      poly(
        [
          [-8, -11],
          [2, -8],
          [2, 2],
          [-8, -1],
        ],
        '#b59b5d',
      );
      oval(-3, -5, 1.6, 2, '#343c33');
      paper(-15, -31, 21);
    } else if (kind === 'tool-basket' || kind === 'worker-tool-stand') {
      box(-15, -2, 36, 20, 20, ['#a98d58', '#856d45', '#675638']);
      for (let j = 0; j < 5; j++)
        line(
          [
            [-28, -2 + j * 3],
            [4, 9 + j * 3],
          ],
          '#bb9f68',
          0.9,
        );
      line(
        [
          [-16, -3],
          [-3, -47],
        ],
        '#a48a61',
        4,
      );
      poly(
        [
          [-8, -44],
          [4, -41],
          [9, -58],
          [-2, -62],
        ],
        '#8c9988',
        '#3d5145',
      );
      line(
        [
          [5, 1],
          [18, -35],
        ],
        '#b59a6a',
        3,
      );
      line(
        [
          [8, -42],
          [27, -35],
        ],
        '#78877a',
        5,
      );
      if (kind === 'worker-tool-stand') {
        line(
          [
            [-25, -18],
            [-25, -63],
            [11, -51],
            [11, -6],
          ],
          '#6a5439',
          5,
        );
        paper(-30, -39, 17);
      }
    } else if (kind === 'cellar-hearth') {
      box(-22, -1, 47, 30, 14, ['#939985', '#6b7769', '#4f6055']);
      poly(
        [
          [-29, -14],
          [-2, -24],
          [22, -15],
          [-5, -5],
        ],
        '#493e2b',
        '#626753',
      );
      for (let j = 0; j < 3; j++) {
        oval(-12 + j * 8, -14, 7, 3, '#a26839', 0.5);
        ctx.beginPath();
        ctx.moveTo(-11 + j * 8, -16);
        ctx.quadraticCurveTo(-17 + j * 8, -27, -8 + j * 8, -36 + j * 3);
        ctx.quadraticCurveTo(j * 8, -22, -4 + j * 8, -16);
        ctx.fillStyle = j === 1 ? '#ebbb67' : '#bd7d40';
        ctx.fill();
      }
      line(
        [
          [-32, -17],
          [-32, -47],
          [10, -32],
          [10, 0],
        ],
        '#423c30',
        3,
      );
      oval(-8, -23, 11, 6, '#465448');
      oval(-8, -29, 10, 3, '#657264');
    } else if (kind === 'cellar-pier') {
      box(-13, 0, 31, 27, 8, ['#a4aa92', '#828c7a', '#687565']);
      for (let j = 0; j < 2; j++)
        box(-10, -7 - j * 10, 25, 21, 10, ['#9ca28e', '#7f8977', '#687462']);
      box(-15, -27, 35, 29, 7, ['#b5b8a1', '#929b88', '#6c7b69']);
      line(
        [
          [-12, -15],
          [7, -8],
        ],
        '#c6c4a9',
        0.7,
      );
      line(
        [
          [-17, -25],
          [2, -18],
        ],
        '#c6c4a9',
        0.7,
      );
    } else if (kind === 'estate-plan-board') {
      leg(-26, 16, 78);
      leg(26, 30, 78);
      box(-27, -43, 62, 8, 50, ['#b28b58', '#86643f', '#5b4935']);
      poly(
        [
          [-32, -79],
          [23, -60],
          [23, -22],
          [-32, -41],
        ],
        '#c6bc93',
        '#6d664e',
      );
      line(
        [
          [-26, -68],
          [15, -54],
          [15, -32],
          [-26, -46],
          [-26, -68],
        ],
        '#697461',
        1,
      );
      line(
        [
          [-7, -61],
          [-7, -40],
        ],
        '#697461',
        1,
      );
      line(
        [
          [-25, -54],
          [15, -40],
        ],
        '#697461',
        1,
      );
      for (let j = 0; j < 6; j++) oval(-24 + j * 6, -43 + j * 2, 1.7, 1, '#8d6349');
    }
    ctx.restore();
  }
  const api = { install, draw, version };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PrototypeGreenwoodInteriors = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
