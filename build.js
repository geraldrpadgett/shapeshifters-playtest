const fs=require('fs');
const path=require('path');
const zlib=require('zlib');
const src=path.join(__dirname,'payload');
const out=path.join(__dirname,'dist');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(src,'payload-manifest.json'),'utf8'));
for(const [dest,parts] of Object.entries(manifest.text)){
  const gz=Buffer.concat(parts.map(p=>Buffer.from(fs.readFileSync(path.join(src,p),'utf8').trim(),'base64')));
  const data=zlib.gunzipSync(gz);
  const fp=path.join(out,dest);
  fs.mkdirSync(path.dirname(fp),{recursive:true});
  fs.writeFileSync(fp,data);
}
const assets=Buffer.concat(manifest.assetPack.map(p=>Buffer.from(fs.readFileSync(path.join(src,p),'utf8').trim(),'base64')));
for(const a of manifest.assets){
  const fp=path.join(out,a.dest);
  fs.mkdirSync(path.dirname(fp),{recursive:true});
  fs.writeFileSync(fp,assets.subarray(a.start,a.start+a.length));
}
for(const [packed,dest] of [['patch-v042-js.gz.b64','shifters-v042-patch.js'],['patch-v042-css.gz.b64','shifters-v042-patch.css']]){
  const gz=Buffer.from(fs.readFileSync(path.join(__dirname,packed),'utf8').trim(),'base64');
  fs.writeFileSync(path.join(out,dest),zlib.gunzipSync(gz));
}
console.log('Built Shapeshifters v0.4.2 into dist/');
