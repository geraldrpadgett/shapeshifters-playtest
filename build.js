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
for(const name of ['shifters-v043-patch.js','shifters-v043-patch.css','shifters-v044-patch.css','shifters-v046-layout.css','shifters-v047-trigger-fix.js','shifters-v048-cost-display.js','shifters-v049-patch.js','shifters-v049-patch.css']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const v045Parts=['part-00.js','part-01.js','part-02.js','part-03.js','part-04.js','part-05.js','part-06.js','part-07.js','part-08a.js','part-08b.js','part-09.js'];
let v045=v045Parts.map(name=>fs.readFileSync(path.join(__dirname,'v045-parts',name),'utf8')).join('');
function required(oldText,newText,label){if(!v045.includes(oldText))throw new Error('v0.4.9 source patch failed: '+label);v045=v045.replace(oldText,newText);}
required("if(!c||c._v044ManifestResolved||!/\\bManifest\\b/i.test(c.text||''))return;","if(!c||c._v044ManifestResolved||!/(^|[.!?]\\s*)Manifest\\s*[â€”-]/i.test(c.text||''))return;",'Manifest timing');
required("if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=Math.max(v.nextRelicDiscount,1);","if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=(v.nextRelicDiscount||0)+1;",'next Relic stacking');
required("  function resolveManifestReacts(pi,c){\n    const p=state.players[pi],v=vstate(p),txt=c?.text||'';","  function resolveManifestReacts(pi,c){\n    const p=state.players[pi],v=vstate(p),txt=c?.text||'';\n    if(c?.color==='Red'&&hasName(p,'Wild Magic'))addTemp(pi,'power',2,'endTurn','Wild Magic');",'Whenever Wrath trigger');
const oldGlobal=[
"  const priorEffectiveCost=effectiveCost;",
"  effectiveCost=function(p,c){",
"    let cost=priorEffectiveCost(p,c),v=vstate(p);",
"    if(c?.type==='Relic'){",
"      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collectorâ€™s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Tricksterâ€™s Lantern'))?1:0;",
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
"      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collectorâ€™s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Tricksterâ€™s Lantern'))?1:0;",
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
required("(p.glamourField||[]).forEach(g=>{if(/\\bManifest\\b/i.test(g?.text||'')&&!g._v044ManifestResolved){resolveManifest(pi,g);changed=true;}});","(p.glamourField||[]).forEach(g=>{if(/(^|[.!?]\\s*)Manifest\\s*[â€”-]/i.test(g?.text||'')&&!g._v044ManifestResolved){resolveManifest(pi,g);changed=true;}});",'Manifest reconciliation');

required(
"    if(stat==='vitality')n+=c?._v044CombatVitalityBonus||0;",
"    if(stat==='vitality')n+=c?._v044CombatVitalityBonus||0;\n    n+=c?._v049CombatMods?.[stat]||0;",
'generic Guardian combat modifiers');
required(
"  function successfulBlockTriggers(dp,blocker){",
"  function resolveBlockEnterTriggerV049(dp,blocker){\n    if(!blocker||blocker._v049BlockTriggerResolved)return;blocker._v049BlockTriggerResolved=true;const txt=blocker.text||'';let m;\n    m=txt.match(/When this blocks,\\s*(?:this|it) gets \\+(\\d+) (Power|Strength|Guard|Vitality) (?:this combat|until end of combat)/i);if(m){if(!blocker._v049CombatMods)blocker._v049CombatMods={};blocker._v049CombatMods[m[2].toLowerCase()]=(blocker._v049CombatMods[m[2].toLowerCase()]||0)+(+m[1]);addLog(`${blocker.name} gets +${m[1]} ${m[2]} for this combat.`,dp);}\n    m=txt.match(/When this blocks,\\s*your Shifter gets \\+(\\d+) (Power|Strength|Guard|Vitality) (?:this combat|until end of combat)/i);if(m)addTemp(dp,m[2].toLowerCase(),+m[1],'endCombat',blocker.name);\n    m=txt.match(/When this blocks,\\s*gain (\\d+) Truth/i);if(m&&blocker?.name!=='Coil Guardian')addTruth(dp,+m[1],blocker.name);\n    m=txt.match(/When this blocks,\\s*deal (\\d+) direct damage/i);if(m)directDamage(dp,+m[1],blocker.name);\n  }\n  function successfulBlockTriggers(dp,blocker){",
'when this blocks trigger automation');
required(
"      if(/When this attacks, draw 1 card, then discard 1 card/i.test(g.text||'')){rawAutoDraw(api,1,g.name);markDiscardDebt(api,1,g.name);}",
"      if(/When this attacks, draw 1 card, then discard 1 card/i.test(g.text||'')){rawAutoDraw(api,1,g.name);markDiscardDebt(api,1,g.name);}\n      let m=(g.text||'').match(/When this attacks,\\s*(?:this|it) gets \\+(\\d+) (Power|Strength|Guard|Vitality) (?:this combat|until end of combat)/i);if(m){if(!g._v049CombatMods)g._v049CombatMods={};g._v049CombatMods[m[2].toLowerCase()]=(g._v049CombatMods[m[2].toLowerCase()]||0)+(+m[1]);addLog(`${g.name} gets +${m[1]} ${m[2]} for this combat.`,api);}\n      m=(g.text||'').match(/When this attacks,\\s*gain (\\d+) Truth/i);if(m)addTruth(api,+m[1],g.name);\n      m=(g.text||'').match(/When this attacks,\\s*deal (\\d+) direct damage/i);if(m)directDamage(api,+m[1],g.name);",
'when this attacks trigger automation');
required(
"      const atkStrength=a.kind==='shifter'?shifterCombatStat(api,'strength','attacking'):guardianCombatStat(api,attackerRef,'strength','attacking',c.attackers);\n      const atkGuard=a.kind==='shifter'?shifterCombatStat(api,'guard','attacking'):guardianCombatStat(api,attackerRef,'guard','attacking',c.attackers);",
"      const atkStrength=a.kind==='shifter'?shifterCombatStat(api,'strength','attacking'):guardianCombatStat(api,attackerRef,'strength','attacking',c.attackers);\n      const atkPower=a.kind==='shifter'?shifterCombatStat(api,'power','attacking'):guardianCombatStat(api,attackerRef,'power','attacking',c.attackers);\n      const atkGuard=a.kind==='shifter'?shifterCombatStat(api,'guard','attacking'):guardianCombatStat(api,attackerRef,'guard','attacking',c.attackers),atkDamage=atkStrength+atkPower;",'Strength plus Power attacker damage');
required(
"        const blocker=dP.zones.Guardian[block.index];if(!blocker)return;\n        const bGuard=guardianCombatStat(dp,blocker,'guard','blocking',c.attackers),bStrength=guardianCombatStat(dp,blocker,'strength','blocking',c.attackers);\n        const toBlocker=Math.max(0,atkStrength-bGuard),toAttacker=Math.max(0,bStrength-atkGuard);",
"        const blocker=dP.zones.Guardian[block.index];if(!blocker)return;resolveBlockEnterTriggerV049(dp,blocker);\n        const bGuard=guardianCombatStat(dp,blocker,'guard','blocking',c.attackers),bStrength=guardianCombatStat(dp,blocker,'strength','blocking',c.attackers),bPower=guardianCombatStat(dp,blocker,'power','blocking',c.attackers),bDamage=bStrength+bPower;\n        const toBlocker=Math.max(0,atkDamage-bGuard),toAttacker=Math.max(0,bDamage-atkGuard);",'Strength plus Power blocker damage');
required(
"        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkStrength-guard);",
""6öç7BwV&C×6†–gFW$6öÖ&E7FB†GÂvwV&BrÂvFVfVæF–ærr’ÆFÖsÔÖF‚æÖ‚ƒÆF´FÖvRÖwV&B“²"Â'Væ&Æö6¶VB7G&VæwF‚ÇW2÷vW"FÖvR"“°§&WV—&VB€¢&FVÆWFRrå÷cCD6öÖ&E7G&VæwF„&öçW3¶FVÆWFRrå÷cCD6öÖ&Ef—FÆ—G”&öçW3²"À¢&FVÆWFRrå÷cCD6öÖ&E7G&VæwF„&öçW3¶FVÆWFRrå÷cCD6öÖ&Ef—FÆ—G”&öçW3¶FVÆWFRrå÷cC”6öÖ&DÖöG3¶FVÆWFRrå÷cC”&Æö6µG&–vvW%&W6öÇfVC²"Â&6öÖ&BÖöF–f–W"6ÆVçW"“° §cCS×cCRç&WÆ6R‚÷cÂãEÂãBWFöÖFVBF&ÆWF÷örÂwcãBã’6öÖ&B²G&–vvW"öÆ—6‚r“°¦g2çw&—FTf–ÆU7–æ2‡F‚æ¦ö–â†÷WBÂw6†–gFW'2×cCR×F6‚æ§2r’ÇcCR“°¦6öç7B–æFW…Fƒ×F‚æ¦ö–â†÷WBÂv–æFW‚æ‡FÖÂr“°¦ÆWB‡FÖÃÖg2ç&VDf–ÆU7–æ2†–æFW…F‚ÂwWFc‚r“°¦f÷"†6öç7BfW'6–öâöb²wcC"rÂwcC2rÂwcCBrÂwcCRrÂwcC’uÒ—°¢‡FÖÃÖ‡FÖÂç&WÆ6R†æWr&VtW‡‚uÅÇ2£ÆÆ–æµµãåÒ§6†–gFW'2Òr·fW'6–öâ²r×F6…ÅÂæ775µãåÒ£ârÂv–rr’Ârr“°¢‡FÖÃÖ‡FÖÂç&WÆ6R†æWr&VtW‡‚uÅÇ2£Ç67&—EµãåÒ§6†–gFW'2Òr·fW'6–öâ²r×F6…ÅÂæ§5µãåÒ£ãÅÅÂ÷67&—CârÂv–rr’Ârr“°§Ğ¦‡FÖÃÖ‡FÖÂç&WÆ6R‚õÇ2£ÆÆ–æµµãåÒ§6†–gFW'2×cCbÖÆ–÷WEÂæ775µãåÒ£âö–rÂrr“°¦‡FÖÃÖ‡FÖÂç&WÆ6R‚õÇ2£Ç67&—EµãåÒ§6†–gFW'2×cCr×G&–vvW"Öf—…Âæ§5µãåÒ£ãÅÂ÷67&—Câö–rÂrr“°¦‡FÖÃÖ‡FÖÂç&WÆ6R‚õÇ2£Ç67&—EµãåÒ§6†–gFW'2×cC‚Ö6÷7BÖF—7Æ•Âæ§5µãåÒ£ãÅÂ÷67&—Câö–rÂrr“°¦‡FÖÃÖ‡FÖÂç&WÆ6R‚÷cÂãEÂã7F&ÆRF&ÆWF÷örÂwcãBã’6öÖ&B²G&–vvW"öÆ—6‚r“°¦‡FÖÃÖ‡FÖÂç&WÆ6R‚sÂö†VCârÂrÆÆ–æ²&VÃÒ'7G–ÆW6†VWB"‡&VcÒ'6†–gFW'2×cC2×F6‚æ772#åÆâÆÆ–æ²&VÃÒ'7G–ÆW6†VWB"‡&VcÒ'6†–gFW'2×cCB×F6‚æ772#åÆâÆÆ–æ²&VÃÒ'7G–ÆW6†VWB"‡&VcÒ'6†–gFW'2×cCbÖÆ–÷WBæ772#åÆâÆÆ–æ²&VÃÒ'7G–ÆW6†VWB"‡&VcÒ'6†–gFW'2×cC’×F6‚æ772#åÆãÂö†VCâr“°¦‡FÖÃÖ‡FÖÂç&WÆ6R‚sÂö&öG“ârÂrÇ67&—B7&3Ò'6†–gFW'2×cC2×F6‚æ§2#ãÂ÷67&—CåÆâÇ67&—B7&3Ò'6†–gFW'2×cCR×F6‚æ§2#ãÂ÷67&—CåÆâÇ67&—B7&3Ò'6†–gFW'2×cCr×G&–vvW"Öf—‚æ§2#ãÂ÷67&—CåÆâÇ67&—B7&3Ò'6†–gFW'2×cC‚Ö6÷7BÖF—7Æ’æ§2#ãÂ÷67&—CåÆâÇ67&—B7&3Ò'6†–gFW'2×cC’×F6‚æ§2#ãÂ÷67&—CåÆãÂö&öG“âr“°¦g2çw&—FTf–ÆU7–æ2†–æFW…F‚Æ‡FÖÂ“°¦6öç6öÆRæÆör‚t'V–ÇB6†W6†–gFW'2cãBã’6öÖ&BÂG&–vvW"ÂF—66&BÂæBvÆÖ÷W"öÆ—6‚–çFòF—7Bòr“°