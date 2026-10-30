"""Reproducible geographic diagrams. Proposed design, never native game evidence."""
from pathlib import Path
from xml.sax.saxutils import escape

out = Path(__file__).resolve().parents[2] / 'docs/evidence/greenwood-redesign-20261029'
out.mkdir(parents=True, exist_ok=True)
svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1020" viewBox="0 0 1440 1020">',
       '<rect width="1440" height="1020" fill="#f2eee3"/>',
       '<style>text{font-family:Arial,sans-serif;fill:#203d32}.title{font-size:25px;font-weight:bold}.sub{font-size:16px}.label{font-size:14px;font-weight:bold;paint-order:stroke;stroke:#f2eee3;stroke-width:4px;stroke-linejoin:round}.small{font-size:13px}</style>',
       '<text x="44" y="44" class="title">Greenwood Vale · two different regional designs</text>',
       '<text x="44" y="72" class="sub">PROPOSED GEOGRAPHY · No game screenshots · Dimensions provisional · North at top</text>']

plans = [
    {'name': 'A · Cultivated west / wooded east', 'size': 3200,
     'river': [(1730,0),(1790,450),(1670,1000),(1500,1550),(1740,2280),(1610,2730),(1770,3200)],
     'sites': [('Millhaven',650,600),('Hamlet',550,1750),('Orchards',780,2100),('Mill',1000,1350),
               ('Goblin fort',350,2640),('Old cellars',1080,2510),('Thornfang',920,2880),
               ('Treasury',2070,1050),('Cache',2420,1690),('Skeleton watch',2670,2220),
               ('Crypt / estate',2740,2790),('Wagon',2910,420)],
     'cross': [(1670,1000),(1740,2280)],
     'cart': [[(300,600),(650,600),(1000,650),(1330,1000),(1670,1000),(2070,1000),(2480,650),(2910,420)]],
     'farm': [[(650,600),(650,1050),(1000,1550),(550,1750),(780,2100),(1300,2280),(1740,2280)],
              [(2070,1000),(2180,1350),(2420,1690),(2490,2350),(2740,2790)]],
     'path': [[(550,1750),(250,2100),(350,2640),(920,2880),(1080,2510),(1300,2280)],
              [(1740,2280),(2150,2350),(2670,2220),(2740,2790)]],
     'woods': [(250,340,220,300),(1100,300,310,180),(400,1180,230,250),(300,2320,200,380),
               (1110,2810,390,290),(2140,400,210,300),(2650,1780,400,380),(2280,2900,250,220)],
     'fields': [(470,1870,280,440),(2740,1320,210,210),(850,900,240,170)]},
    {'name': 'B · River-elbow crossroads', 'size': 3400,
     'river': [(1000,0),(900,650),(1300,1200),(1760,1690),(2000,2200),(2340,2800),(2250,3400)],
     'sites': [('Millhaven',1450,1800),('Hamlet',2530,850),('Orchards',2820,1180),('Mill',620,450),
               ('Goblin fort',480,1070),('Old cellars',2980,1570),('Thornfang',450,2730),
               ('Treasury',1080,2910),('Cache',2540,2200),('Skeleton watch',2980,2660),
               ('Crypt / estate',2880,3090),('Wagon',2900,350)],
     'cross': [(1760,1690),(2340,2800)],
     'cart': [[(620,450),(650,1350),(1450,1800),(1760,1690),(2300,1550),(2530,850),(2900,350)]],
     'farm': [[(2530,850),(2820,1180),(2980,1570)],[(1450,1800),(1080,2360),(1080,2910)],
              [(2300,1550),(2540,2200),(2980,2660),(2880,3090)]],
     'path': [[(650,1350),(480,1070)],[(1080,2360),(450,2730),(1080,2910),(1800,2800),(2340,2800),(2880,3090)]],
     'woods': [(340,440,220,260),(520,1710,330,260),(650,2800,420,350),(1600,500,400,300),
               (2900,1960,350,260),(2800,2950,350,380),(1630,3060,260,230)],
     'fields': [(2550,1000,400,420),(1130,1500,230,240)]}
]

for i,p in enumerate(plans):
    ox,oy,side = 45+i*710,142,640
    scale = side/p['size']
    def xy(q): return (ox+q[0]*scale,oy+q[1]*scale)
    def line(points,color,width,dash=''):
        coords=' '.join(f'{x:.1f},{y:.1f}' for x,y in map(xy,points))
        svg.append(f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {dash}/>')
    svg.append(f'<text x="{ox}" y="113" class="title">{escape(p["name"])}</text>')
    svg.append(f'<rect x="{ox}" y="{oy}" width="{side}" height="{side}" fill="#c6d1a7" stroke="#55765d"/>')
    for cx,cy,rx,ry in p['woods']:
        x,y=xy((cx,cy))
        svg.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx*scale}" ry="{ry*scale}" fill="#617f58" opacity=".65"/>')
    for cx,cy,rx,ry in p['fields']:
        x,y=xy((cx,cy))
        svg.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx*scale}" ry="{ry*scale}" fill="#cdb879" opacity=".8"/>')
    # Smooth cubic interpolation yields an illustrative continuous water course.
    river=p['river']
    d=f'M {xy(river[0])[0]},{xy(river[0])[1]}'
    for a,b in zip(river,river[1:]):
        ax,ay=xy(a);bx,by=xy(b);my=(ay+by)/2
        d+=f' C {ax},{my} {bx},{my} {bx},{by}'
    svg.extend([f'<path d="{d}" fill="none" stroke="#819e88" stroke-width="31"/>',f'<path d="{d}" fill="none" stroke="#5b98a5" stroke-width="22"/>'])
    if i==0:
        line([(870,1080),(900,1230),(1000,1350),(1110,1480),(1350,1590),(1500,1550)],'#5b98a5',5)
        x,y=xy((1000,1350));svg.append(f'<ellipse cx="{x}" cy="{y}" rx="23" ry="16" fill="#5b98a5"/>')
        x,y=xy((2720,1320));svg.append(f'<ellipse cx="{x}" cy="{y}" rx="18" ry="12" fill="#5b98a5"/>')
    for key,color,width in [('cart','#97674b',8),('farm','#ad9163',4),('path','#f3e5bd',2)]:
        for road in p[key]:line(road,color,width)
    for x,y in p['cross']:line([(x-120,y),(x+120,y)],'#e4c78e',9)
    for name,x,y in p['sites']:
        px,py=xy((x,y)); hostile=name in ['Goblin fort','Thornfang','Skeleton watch','Treasury','Old cellars']
        color='#9a4c3c' if hostile else '#294936'
        svg.append(f'<circle cx="{px}" cy="{py}" r="5" fill="{color}" stroke="#f2eee3" stroke-width="2"/>')
        # Labels on outer eastern sites face inward, keeping the drawing complete.
        anchor='end' if x>p['size']*.73 else 'start'; tx=px-8 if anchor=='end' else px+8
        svg.append(f'<text x="{tx}" y="{py-9}" text-anchor="{anchor}" class="label">{escape(name)}</text>')
    for n in range(1,4):
        x=ox+side*n/4;y=oy+side*n/4
        svg.extend([f'<path d="M{x},{oy}v{side}" stroke="#ffffff" opacity=".22"/>',f'<path d="M{ox},{y}h{side}" stroke="#ffffff" opacity=".22"/>'])
    svg.append(f'<text x="{ox}" y="815" class="sub">{p["size"]} drafting grid · scale and placement subject to measurement</text>')

svg.extend(['<text x="45" y="864" class="sub">Green stands: layered hardwood woods · Ochre: cultivation / pasture · Blue: shared basin concept</text>',
            '<text x="45" y="894" class="sub">Heavy brown: cart spine · Light brown: farm / freight lanes · Pale: woodland paths · Red: existing hostile households</text>',
            '<text x="45" y="945" class="sub">A selected for construction study. Compare A at 3200 / 3400 before fixing size; expand further if needed.</text>',
            '<text x="45" y="976" class="small">No gameplay, new lore, enemies or rewards introduced. See the masterplan record for protected IDs, edge use and migration requirements.</text>', '</svg>'])
(out/'masterplans.svg').write_text('\n'.join(svg)+'\n')
print(out/'masterplans.svg')
