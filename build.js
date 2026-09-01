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
for(const name of ['shifters-v043-patch.js','shifters-v043-patch.css','shifters-v044-patch.css','shifters-v046-layout.css']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const v045Parts=['part-00.js','part-01.js','part-02.js','part-03.js','part-04.js','part-05.js','part-06.js','part-07.js','part-08a.js','part-08b.js','part-09.js'];
const v045=v045Parts.map(name=>fs.readFileSync(path.join(__dirname,'v045-parts',name),'utf8')).join('');
fs.writeFileSync(path.join(out,'shifters-v045-patch.js'),v045);
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
for(const version of ['v042','v043','v044','v045','v046']){
  html=html.replace(new RegExp('\\s*<link[^>]*shifters-'+version+'-patch\\.css[^>]*>','ig'),'');
  html=html.replace(new RegExp('\\s*<script[^>]*shifters-'+version+'-patch\\.js[^>]*><\\/script>','ig'),'');
}
html=html.replace(/v0\.4\.0 Stable Tabletop/g,'v0.4.6 Reference Layout');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v043-patch.css">\n  <link rel="stylesheet" href="shifters-v044-patch.css">\n  <link rel="stylesheet" href="shifters-v046-layout.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v043-patch.js"></script>\n  <script src="shifters-v045-patch.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Built Shapeshifters v0.4.6 reference tabletop into dist/');
