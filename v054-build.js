const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'dist');
const required=(text,oldText,newText,label)=>{if(!text.includes(oldText))throw new Error('v0.5.4 post-build patch failed: '+label);return text.replace(oldText,newText);};

// The old v0.5.1 emergency fix applied to every card numbered 32. In App Beta v0.2,
// #32 is a 3-cost Relic in both decks, so keep the legacy correction scoped only
// to the old synthetic Guardian #32 used by the regression harness.
const v051Path=path.join(out,'shifters-v051-patch.js');
let v051=fs.readFileSync(v051Path,'utf8');
v051=required(v051,
  "if(Number(c?.number)===32&&Number(c.cost)!==1)",
  "if(Number(c?.number)===32&&c?.type==='Guardian'&&Number(c.cost)!==1)",
  'scope legacy card 32 fix to Guardians'
);
fs.writeFileSync(v051Path,v051);

// Extend the authoritative cost engine with the simplified persistent Awakening
// wording: “Guardians cost 1 less Glamour to Cast.” This applies to every Guardian,
// not only the first Guardian each turn.
const gamePath=path.join(out,'shifters-v045-patch.js');
let game=fs.readFileSync(gamePath,'utf8');
game=required(game,
  "    const pat=costPatternV048(key);let first=0;if(key&&pat&&!v.turnFlags.costFirstUsed[key])first=allInfluence(p).filter(src=>pat.test(src?.text||'')&&!/(^|[.!?]\\s*)Manifest\\s*[—-]/i.test(src?.text||'')).length;",
  "    const pat=costPatternV048(key);let first=0;if(key&&pat&&!v.turnFlags.costFirstUsed[key])first=allInfluence(p).filter(src=>pat.test(src?.text||'')&&!/(^|[.!?]\\s*)Manifest\\s*[—-]/i.test(src?.text||'')).length;const persistentGuardian=c?.type==='Guardian'?allInfluence(p).filter(src=>/Guardians cost 1 less Glamour to Cast\\.?/i.test(src?.text||'')).length:0;",
  'persistent Guardian cost reducer source'
);
game=required(game,
  "    const nextRelic=c?.type==='Relic'?Math.max(0,v.nextRelicDiscount||0):0,nextGuardian=c?.type==='Guardian'?Math.max(0,v.nextGuardianDiscount||0):0,next=nextRelic+nextGuardian,total=first+next;return {base,key,first,next,nextRelic,nextGuardian,total,cost:Math.max(0,base-total)};",
  "    const nextRelic=c?.type==='Relic'?Math.max(0,v.nextRelicDiscount||0):0,nextGuardian=c?.type==='Guardian'?Math.max(0,v.nextGuardianDiscount||0):0,next=nextRelic+nextGuardian,total=first+persistentGuardian+next;return {base,key,first,persistentGuardian,next,nextRelic,nextGuardian,total,cost:Math.max(0,base-total)};",
  'persistent Guardian cost reducer total'
);

// Remove legacy name-based abilities that collide with the new simplified cards.
// App Beta v0.2 cards do exactly what their current rules text says.
const legacyRemovals=[
  ["      if(hasName(p,'Relic Seer')&&!v.turnFlags.relicManifestDraw){v.turnFlags.relicManifestDraw=true;rawAutoDraw(pi,1,'Relic Seer');}","      // App Beta v0.2: Relic Seer is a simple Echo; no legacy Relic trigger."],
  ["      const basin=p.zones.Relic.find(x=>x.name==='Offering Basin');if(basin){basin.storedRenown=(basin.storedRenown||0)+3;addLog(`${basin.name} stored 3 Truth.`,pi);}","      // App Beta v0.2: Offering Basin only provides Glamour."],
  ["      if(c.color==='Green'&&hasName(p,'Tablet of Nine Heads')&&!v.turnFlags.vigorManifestGuard){v.turnFlags.vigorManifestGuard=true;addTemp(pi,'guard',1,'endTurn','Tablet of Nine Heads');}","      // App Beta v0.2: Tablet of Nine Heads only grants its printed static Guard."],
  ["    if(blocker?.name==='Coil Guardian')addTruth(dp,3,'Coil Guardian');","    // App Beta v0.2: Coil Guardian gains Truth only from its Manifest text."],
  ["    if(hasName(p,'Guardian Brood')&&!v.turnFlags.guardianBlockVitality){v.turnFlags.guardianBlockVitality=true;addTemp(dp,'vitality',1,'endTurn','Guardian Brood');}","    // App Beta v0.2: Guardian Brood is a simple permanent Echo buff."],
  ["    if(hasName(p,'Endless Growth')){p.stats.vitality+=1;addLog(`${p.name} permanently gets +1 Vitality from Endless Growth.`,dp);}","    // App Beta v0.2: Endless Growth applies once when manifested as an Awakening."],
  ["    const altar=p.zones.Relic.find(x=>x.name==='Altar of Renewal');if(altar&&(altar.storedRenown||0)){const n=altar.storedRenown;altar.storedRenown=0;addTruth(dp,n,'Altar of Renewal');}","    // App Beta v0.2: Altar of Renewal has only its printed Manifest effect."]
];
for(const [oldText,newText] of legacyRemovals)game=required(game,oldText,newText,'remove legacy named effect: '+oldText.slice(0,48));
fs.writeFileSync(gamePath,game);

// Make the cost display mirror the same persistent Guardian reducer.
const v048Path=path.join(out,'shifters-v048-cost-display.js');
let v048=fs.readFileSync(v048Path,'utf8');
v048=required(v048,
  "    let first=0;if(key&&pat&&!(flags.costFirstUsed||{})[key])first=influence(p).filter(src=>pat.test(src?.text||'')&&!isManifestSource(src)).length;",
  "    let first=0;if(key&&pat&&!(flags.costFirstUsed||{})[key])first=influence(p).filter(src=>pat.test(src?.text||'')&&!isManifestSource(src)).length;const persistentGuardian=c?.type==='Guardian'?influence(p).filter(src=>/Guardians cost 1 less Glamour to Cast\\.?/i.test(src?.text||'')).length:0;",
  'display persistent Guardian reducer source'
);
v048=required(v048,
  "    const next=nextRelic+nextGuardian,total=first+next;\n    return {base,first,next,total,cost:Math.max(0,base-total)};",
  "    const next=nextRelic+nextGuardian,total=first+persistentGuardian+next;\n    return {base,first,persistentGuardian,next,total,cost:Math.max(0,base-total)};",
  'display persistent Guardian reducer total'
);
fs.writeFileSync(v048Path,v048);

// Copy the App Beta deck layer. The engine cost calculation above is authoritative,
// so disable the fallback subtraction in the UI patch to avoid double reduction.
const deckSrc=path.join(__dirname,'shifters-v054-decks.js');
const deckOut=path.join(out,'shifters-v054-decks.js');
fs.copyFileSync(deckSrc,deckOut);
let deckJs=fs.readFileSync(deckOut,'utf8');
deckJs=required(deckJs,
  "function persistentGuardianReduction054(p){return [...Object.values(p?.echoes||{}).flat(),...(p?.zones?.Guardian||[]),...(p?.zones?.Relic||[]),...(p?.awakeningField||[])].filter(src=>/Guardians cost 1 less Glamour to Cast\\.?/i.test(src?.text||'')).length;}",
  "function persistentGuardianReduction054(_p){return 0;}",
  'avoid duplicate Guardian reducer subtraction'
);
fs.writeFileSync(deckOut,deckJs);

const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<script[^>]*shifters-v054-decks\.js[^>]*><\/script>/ig,'');
html=html.replace('</body>','  <script src="shifters-v054-decks.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Applied Shapeshifters v0.5.4 App Beta v0.2 deck data and simplified automation.');
