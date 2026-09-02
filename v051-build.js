const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'dist');
const gamePath=path.join(out,'shifters-v045-patch.js');
let game=fs.readFileSync(gamePath,'utf8');

function required(oldText,newText,label){
  if(!game.includes(oldText))throw new Error('v0.5.1 post-build patch failed: '+label);
  game=game.replace(oldText,newText);
}

// Track one-turn Guardian discounts created by Manifest effects separately from
// true static cost reducers that remain in the Area of Influence.
required(
  "    if(!Number.isFinite(p.v044.nextRelicDiscount))p.v044.nextRelicDiscount=0;",
  "    if(!Number.isFinite(p.v044.nextRelicDiscount))p.v044.nextRelicDiscount=0;\n    if(!Number.isFinite(p.v044.nextGuardianDiscount))p.v044.nextGuardianDiscount=0;",
  'Guardian Manifest discount state'
);

required(
  "    if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=(v.nextRelicDiscount||0)+1;",
  "    if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=(v.nextRelicDiscount||0)+1;\n    if(/(^|[.!?]\\s*)Manifest\\s*[—-]/i.test(txt)&&/(?:The first|Your next) Guardian[^.]*costs 1 less Glamour/i.test(txt))v.nextGuardianDiscount=(v.nextGuardianDiscount||0)+1;",
  'one-shot Guardian Manifest discount'
);

const oldCostEngine=[
"  function costBreakdownV048(p,c){",
"    const v=vstate(p),base=Math.max(0,Number(c?.cost)||0),key=costKeyV048(c);if(!v.turnFlags.costFirstUsed)v.turnFlags.costFirstUsed={};",
"    const pat=costPatternV048(key);let first=0;if(key&&pat&&!v.turnFlags.costFirstUsed[key])first=allInfluence(p).filter(src=>pat.test(src?.text||'')).length;",
"    const next=c?.type==='Relic'?Math.max(0,v.nextRelicDiscount||0):0,total=first+next;return {base,key,first,next,total,cost:Math.max(0,base-total)};",
"  }",
"  function consumeCostV048(p,b){const v=vstate(p);if(b?.key&&b.first>0){if(!v.turnFlags.costFirstUsed)v.turnFlags.costFirstUsed={};v.turnFlags.costFirstUsed[b.key]=true;}if(b?.next>0)v.nextRelicDiscount=0;}"
].join('\n');
const newCostEngine=[
"  function costBreakdownV048(p,c){",
"    const v=vstate(p),base=Math.max(0,Number(c?.cost)||0),key=costKeyV048(c);if(!v.turnFlags.costFirstUsed)v.turnFlags.costFirstUsed={};",
"    const pat=costPatternV048(key);let first=0;if(key&&pat&&!v.turnFlags.costFirstUsed[key])first=allInfluence(p).filter(src=>pat.test(src?.text||'')&&!/(^|[.!?]\\s*)Manifest\\s*[—-]/i.test(src?.text||'')).length;",
"    const nextRelic=c?.type==='Relic'?Math.max(0,v.nextRelicDiscount||0):0,nextGuardian=c?.type==='Guardian'?Math.max(0,v.nextGuardianDiscount||0):0,next=nextRelic+nextGuardian,total=first+next;return {base,key,first,next,nextRelic,nextGuardian,total,cost:Math.max(0,base-total)};",
"  }",
"  function consumeCostV048(p,b){const v=vstate(p);if(b?.key&&b.first>0){if(!v.turnFlags.costFirstUsed)v.turnFlags.costFirstUsed={};v.turnFlags.costFirstUsed[b.key]=true;}if(b?.nextRelic>0)v.nextRelicDiscount=0;if(b?.nextGuardian>0)v.nextGuardianDiscount=0;}"
].join('\n');
required(oldCostEngine,newCostEngine,'Manifest/static cost separation');

required(
  "prepareTurnStart=function(p,first){clearUntilNextTurn(p);priorPrepareTurnStart(p,first);const v=vstate(p);v.floatingGlamour=0;v.turnFlags={};v.discardDebt=0;v.nextRelicDiscount=0;v.firstRelicTrigger=false;};",
  "prepareTurnStart=function(p,first){clearUntilNextTurn(p);priorPrepareTurnStart(p,first);const v=vstate(p);v.floatingGlamour=0;v.turnFlags={};v.discardDebt=0;v.nextRelicDiscount=0;v.nextGuardianDiscount=0;v.firstRelicTrigger=false;};",
  'clear Manifest Guardian discount at turn start'
);

// A face-down Shifter cannot receive an Echo.
required(
  "    if(c.type==='Echo'&&(p.echoes[c.color]?.length||0)>=GAME_DATA.echoPerColorLimit){toast(`${c.color} Echo limit is ${GAME_DATA.echoPerColorLimit}.`);return false;}",
  "    if(c.type==='Echo'&&(p.flipped||p.reverted)){toast('Your Shifter must be face-up to receive an Echo.');return false;}\n    if(c.type==='Echo'&&(p.echoes[c.color]?.length||0)>=GAME_DATA.echoPerColorLimit){toast(`${c.color} Echo limit is ${GAME_DATA.echoPerColorLimit}.`);return false;}",
  'face-down Echo restriction'
);

// Instinct effects resolve exactly once as part of playing the card.
required(
  "    resolveManifest(pi,c);resolveManifestReacts(pi,c);\n    const v=vstate(p);consumeCostV048(p,breakdown);",
  "    resolveManifest(pi,c);resolveManifestReacts(pi,c);if(c.type==='Instinct')window.resolveInstinct051?.(pi,c);\n    const v=vstate(p);consumeCostV048(p,breakdown);",
  'automatic Instinct resolution'
);

// Direct damage now uses Guard just like other Shifter damage: Guard reduces the
// event first, then any remainder is applied to Vitality/damage.
const oldDirect=[
"  function directDamage(fromPi,n,source){",
"    const target=1-fromPi;damageShifter(target,n,source,true);",
"    const p=state.players[fromPi],v=vstate(p);",
"    if(!v.turnFlags.directDamageTriggered){",
"      v.turnFlags.directDamageTriggered=true;",
"      const shrine=p.zones.Relic.find(c=>c.name==='Shrine of Embers');if(shrine){shrine.storedRenown=(shrine.storedRenown||0)+3;addLog(`${shrine.name} stored 3 Truth.`,fromPi);}",
"      if(hasName(p,'Burning Essence'))autoTurnGlamour(fromPi,{ready:true,source:'Burning Essence'});",
"    }",
"  }"
].join('\n');
const newDirect=[
"  function directDamage(fromPi,n,source){",
"    const target=1-fromPi,targetPlayer=state.players[target],raw=Math.max(0,Number(n)||0),guard=Math.max(0,Number(targetPlayer?.stats?.guard)||0),blocked=Math.min(raw,guard),dealt=Math.max(0,raw-guard);",
"    if(blocked>0)addLog(`${targetPlayer.name} blocked ${blocked} of ${raw} direct damage with Guard${source?` from ${source}`:''}; ${dealt} got through.`,target);",
"    if(dealt>0)damageShifter(target,dealt,source,true);else return 0;",
"    const p=state.players[fromPi],v=vstate(p);",
"    if(!v.turnFlags.directDamageTriggered){",
"      v.turnFlags.directDamageTriggered=true;",
"      const shrine=p.zones.Relic.find(c=>c.name==='Shrine of Embers');if(shrine){shrine.storedRenown=(shrine.storedRenown||0)+3;addLog(`${shrine.name} stored 3 Truth.`,fromPi);}",
"      if(hasName(p,'Burning Essence'))autoTurnGlamour(fromPi,{ready:true,source:'Burning Essence'});",
"    }",
"    return dealt;",
"  }",
"  window.directDamage051=directDamage;"
].join('\n');
required(oldDirect,newDirect,'Guard applies to direct damage');

required(
  "if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct damage (Guard ignored)':' damage'}${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;",
  "if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct':''} damage${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;",
  'remove Guard ignored direct-damage log'
);

fs.writeFileSync(gamePath,game);
for(const name of ['shifters-v051-patch.js','shifters-v051-patch.css']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<link[^>]*shifters-v051-patch\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v051-patch\.js[^>]*><\/script>/ig,'');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v051-patch.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v051-patch.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Applied Shapeshifters v0.5.1 automation, layout, cost, and Guard rules.');
