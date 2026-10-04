'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<link rel="(?:manifest|icon)"[^>]*>/g,'');
html=html.replace(/<link rel="stylesheet" href="\.\/([^\"]+)">/g,(_,f)=>'<style>'+fs.readFileSync(path.join(root,f),'utf8')+'</style>');
html=html.replace(/<script src="\.\/([^\"]+)"><\/script>/g,(_,f)=>'<script>\n'+fs.readFileSync(path.join(root,f),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
html=html.replace("if(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')",'if(false)');
fs.mkdirSync(path.join(root,'release'),{recursive:true});const out=path.join(root,'release','Azeroth_Chronicles_Playtest.html');fs.writeFileSync(out,html);fs.writeFileSync(path.join(root,'release','SHA256.txt'),crypto.createHash('sha256').update(html).digest('hex')+'  Azeroth_Chronicles_Playtest.html\n');console.log('Built '+out+' ('+Buffer.byteLength(html)+' bytes)');
