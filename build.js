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
for(const name of ['shifters-v043-patch.js','shifters-v043-patch.css','shifters-v044-patch.css','shifters-v046-layout.css','shifters-v047-trigger-fix.js','shifters-v048-cost-display.js']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const v045Parts=['part-00.js','part-01.js','part-02.js','part-03.js','part-04.js','part-05.js','part-06.js','part-07.js','part-08a.js','part-08b.js','part-09.js'];
let v045=v045Parts.map(name=>fs.readFileSync(path.join(__dirname,'v045-parts',name),'utf8')).join('');
function required(oldText,newText,label){if(!v045.includes(oldText))throw new Error('v0.4.8 source patch failed: '+label);v045=v045.replace(oldText,newText);}
required("if(!c||c._v044ManifestResolved||!/\\bManifest\\b/i.test(c.text||''))return;","if(!c||c._v044ManifestResolved||!/(^|[.!?]\\s*)Manifest\\s*[—-]/i.test(c.text||''))return;",'Manifest timing');
required("if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=Math.max(v.nextRelicDiscount,1);","if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=(v.nextRelicDiscount||0)+1;",'next Relic stacking');
required("  function resolveManifestReacts(pi,c){\n    const p=state.players[pi],v=vstate(p),txt=c?.text||'';","  function resolveManifestReacts(pi,c){\n    const p=state.players[pi],v=vstate(p),txt=c?.text||'';\n    if(c?.color==='Red'&&hasName(p,'Wild Magic'))addTemp(pi,'power',2,'endTurn','Wild Magic');",'Whenever Wrath trigger');
const oldGlobal=[
"  const priorEffectiveCost=effectiveCost;",
"  effectiveCost=function(p,c){",
"    let cost=priorEffectiveCost(p,c),v=vstate(p);",
"    if(c?.type==='Relic'){",
"      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collector’s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Trickster’s Lantern'))?1:0;",
"      cost=Math.max(0,cost-firstDiscount-Math.min(1,v.nextRelicDiscount||0));",
"    }",
"    return cost;",
"  };"
].join('\n');
required(oldGlobal,"  const priorEffectiveCost=effectiveCost;\n  effectiveCost=function(p,c){return costBreakdownV048(p,c).cost;};",'global effective cost');
const oldLocal=[
"  function effectiveCostV045(p,c){",
"    let cost=Math.max(0,c?.cost||0),v=vstate(p);",
"    if(c?.type==='Relic'){",
"      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collector’s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Trickster’s Lantern'))?1:0;",
"      cost=Math.max(0,cost-firstDiscount-Math.min(1,v.nextRelicDiscount||0));",
"    }",
"    return cost;",
"  }"
].join('\n');
const newLocal=[
"  function costKeyV048(c){if(c?.type==='Relic')return 'relic';if(c?.type==='Guardian')return 'guardian';if(c?.type==='Echo'&&c?.color==='Green')return 'vigorEcho';return null;}",
"  function costPatternV048(key){return key==='relic'?/The first Relic you play each turn costs 1 less Glamour/i:key==='guardian'?/The first Guardian you play each turn costs 1 less Glamour/i:key==='vigorEcho'?/The first Vigor Echo you play each turn costs 1 less Glamour/i:null;}",
"  function costBreakdownV048(p,c){",
"    const v=vstate(p),base=Math.max(0,Number(c?.cost)||0),key=costKeyV048(c);if(!v.turnFlags.costFirstUsed)v.turnFlags.costFirstUsed={};",
"    const pat=costPatternV048(key);let first=0;if(key&&pat&&!v.turnFlags.costFirstUsed[key])first=allInfluence(p).filter(src=>pat.test(src?.text||'')).length;",
"    const next=c?.type==='Relic'?Math.max(0,v.nextRelicDiscount||0):0,total=first+next;return {base,key,first,next,total,cost:Math.max(0,base-total)};",
"  }",
"  function consumeCostV048(p,b){const v=vstate(p);if(b?.key&&b.first>0){if(!v.turnFlags.costFirstUsed)v.turnFlags.costFirstUsed={};v.turnFlags.costFirstUsed[b.key]=true;}if(b?.next>0)v.nextRelicDiscount=0;}",
"  function effectiveCostV045(p,c){return costBreakdownV048(p,c).cost;}"
].join('\n');
required(oldLocal,newLocal,'play cost engine');
required("    const cost=effectiveCostV045(p,c),available=availableV045(p);if(available<cost)","    const breakdown=costBreakdownV048(p,c),cost=breakdown.cost,available=availableV045(p);if(available<cost)",'play cost calculation');
required("    const v=vstate(p);if(c.type==='Relic'){","    const v=vstate(p);consumeCostV048(p,breakdown);if(c.type==='Relic'){",'consume cost effects');
required("(p.glamourField||[]).forEach(g=>{if(/\\bManifest\\b/i.test(g?.text||'')&&!g._v044ManifestResolved){resolveManifest(pi,g);changed=true;}});","(p.glamourField||[]).forEach(g=>{if(/(^|[.!?]\\s*)Manifest\\s*[—-]/i.test(g?.text||'')&&!g._v044ManifestResolved){resolveManifest(pi,g);changed=true;}});",'Manifest reconciliation');
v045=v045.replace(/v0\.4\.4 Automated Tabletop/g,'v0.4.8 Reference Layout + Trigger/Cost Fix');
fs.writeFileSync(path.join(out,'shifters-v045-patch.js'),v045);
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
for(const version of ['v042','v043','v044','v045']){
  html=html.replace(new RegExp('\\s*<link[^>]*shifters-'+version+'-patch\\.css[^>]*>','ig'),'');
  html=html.replace(new RegExp('\\s*<script[^>]*shifters-'+version+'-patch\\.js[^>]*><\\/script>','ig'),'');
}
html=html.replace(/\s*<link[^>]*shifters-v046-layout\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v047-trigger-fix\.js[^>]*><\/script>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v048-cost-display\.js[^>]*><\/script>/ig,'');
html=html.replace(/v0\.4\.0 Stable Tabletop/g,'v0.4.8 Reference Layout + Trigger/Cost Fix');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v043-patch.css">\n  <link rel="stylesheet" href="shifters-v044-patch.css">\n  <link rel="stylesheet" href="shifters-v046-layout.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v043-patch.js"></script>\n  <script src="shifters-v045-patch.js"></script>\n  <script src="shifters-v047-trigger-fix.js"></script>\n  <script src="shifters-v048-cost-display.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Built Shapeshifters v0.4.8 reference layout, trigger timing, and cost fixes into dist/');
