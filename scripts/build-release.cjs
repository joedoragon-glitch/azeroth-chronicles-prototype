'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<link rel="(?:manifest|icon)"[^>]*>/g,'');
const spriteManifestPath=path.join(root,'assets','sprites','manifest.json'),spriteManifest=JSON.parse(fs.readFileSync(spriteManifestPath,'utf8')),embeddedSprites={};
for(const entry of Object.values(spriteManifest.sprites||{})){
  if(!entry?.src)continue;
  const rel=entry.src.replace(/^\.\//,''),file=path.join(root,rel);
  if(!fs.existsSync(file))throw new Error('Missing sprite asset '+entry.src);
  const ext=path.extname(file).toLowerCase(),mime=ext==='.webp'?'image/webp':ext==='.png'?'image/png':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':null;
  if(!mime)throw new Error('Unsupported sprite format '+entry.src);
  embeddedSprites[entry.src]='data:'+mime+';base64,'+fs.readFileSync(file).toString('base64');
}
html=html.replace('</head>','<script>window.__AZEROTH_SPRITE_MANIFEST__='+JSON.stringify(spriteManifest)+';window.__AZEROTH_EMBEDDED_SPRITES__='+JSON.stringify(embeddedSprites)+'</script></head>');
html=html.replace(/<link rel="stylesheet" href="\.\/([^\"]+)">/g,(_,f)=>'<style>'+fs.readFileSync(path.join(root,f),'utf8')+'</style>');
html=html.replace(/<script src="\.\/([^\"]+)"><\/script>/g,(_,f)=>'<script>\n'+fs.readFileSync(path.join(root,f),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
html=html.replace("if(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')",'if(false)');
fs.mkdirSync(path.join(root,'release'),{recursive:true});const out=path.join(root,'release','Azeroth_Chronicles_Playtest.html');fs.writeFileSync(out,html);fs.writeFileSync(path.join(root,'release','SHA256.txt'),crypto.createHash('sha256').update(html).digest('hex')+'  Azeroth_Chronicles_Playtest.html\n');console.log('Built '+out+' ('+Buffer.byteLength(html)+' bytes)');
