const fs=require('fs');const path=require('path');
const manifest=require('./manifest.json');
const out=path.join(__dirname,'dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const [dest,parts] of Object.entries(manifest.text)){const data=parts.map(p=>fs.readFileSync(path.join(__dirname,p),'utf8')).join('');const fp=path.join(out,dest);fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,data,'utf8');}
for(const [dest,src] of Object.entries(manifest.binary)){const b64=fs.readFileSync(path.join(__dirname,src),'utf8');const fp=path.join(out,dest);fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,Buffer.from(b64,'base64'));}
console.log('Built Shapeshifters web app into dist/');
