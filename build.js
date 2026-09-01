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
  let data;
  try{data=zlib.gunzipSync(gz);}catch(e){throw new Error('Base payload failed while unpacking '+dest+': '+e.message);}
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
fs.copyFileSync(path.join(__dirname,'shifters-v043-patch.js'),path.join(out,'shifters-v043-patch.js'));
fs.copyFileSync(path.join(__dirname,'shifters-v043-patch.css'),path.join(out,'shifters-v043-patch.css'));
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<link[^>]*shifters-v042-patch\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v042-patch\.js[^>]*><\/script>/ig,'');
html=html.replace(/\s*<link[^>]*shifters-v043-patch\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v043-patch\.js[^>]*><\/script>/ig,'');
html=html.replace(/v0\.4\.0 Stable Tabletop/g,'v0.4.3 Awakening Choice');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v043-patch.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v043-patch.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Built Shapeshifters v0.4.3 plain static site into dist/');
