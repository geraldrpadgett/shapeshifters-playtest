const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'dist');
const gamePath=path.join(out,'shifters-v045-patch.js');
let game=fs.readFileSync(gamePath,'utf8');
function one(oldText,newText,label){
  if(!game.includes(oldText))throw new Error('v0.4.9 post-build patch failed: '+label);
  game=game.replace(oldText,newText);
}

one(
  "    if(stat==='vitality')n+=c?._v044CombatVitalityBonus||0;",
  "    if(stat==='vitality')n+=c?._v044CombatVitalityBonus||0;\n    n+=c?._v049CombatMods?.[stat]||0;",
  'Guardian combat modifiers'
);

one(
  "  function successfulBlockTriggers(dp,blocker){",
  "  function resolveBlockEnterTriggerV049(dp,blocker){\n"+
  "    if(!blocker||blocker._v049BlockTriggerResolved)return;blocker._v049BlockTriggerResolved=true;const txt=blocker.text||'';let m;\n"+
  "    m=txt.match(/When this blocks,\\s*(?:this|it) gets \\+(\\d+) (Power|Strength|Guard|Vitality) (?:this combat|until end of combat)/i);if(m){if(!blocker._v049CombatMods)blocker._v049CombatMods={};blocker._v049CombatMods[m[2].toLowerCase()]=(blocker._v049CombatMods[m[2].toLowerCase()]||0)+(+m[1]);addLog(`${blocker.name} gets +${m[1]} ${m[2]} for this combat.`,dp);}\n"+
  "    m=txt.match(/When this blocks,\\s*your Shifter gets \\+(\\d+) (Power|Strength|Guard|Vitality) (?:this combat|until end of combat)/i);if(m)addTemp(dp,m[2].toLowerCase(),+m[1],'endCombat',blocker.name);\n"+
  "    m=txt.match(/When this blocks,\\s*gain (\\d+) Truth/i);if(m&&blocker?.name!=='Coil Guardian')addTruth(dp,+m[1],blocker.name);\n"+
  "    m=txt.match(/When this blocks,\\s*deal (\\d+) direct damage/i);if(m)directDamage(dp,+m[1],blocker.name);\n"+
  "  }\n  function successfulBlockTriggers(dp,blocker){",
  'block trigger automation'
);

one(
  "      if(/When this attacks, draw 1 card, then discard 1 card/i.test(g.text||'')){rawAutoDraw(api,1,g.name);markDiscardDebt(api,1,g.name);}",
  "      if(/When this attacks, draw 1 card, then discard 1 card/i.test(g.text||'')){rawAutoDraw(api,1,g.name);markDiscardDebt(api,1,g.name);}\n"+
  "      let m=(g.text||'').match(/When this attacks,\\s*(?:this|it) gets \\+(\\d+) (Power|Strength|Guard|Vitality) (?:this combat|until end of combat)/i);if(m){if(!g._v049CombatMods)g._v049CombatMods={};g._v049CombatMods[m[2].toLowerCase()]=(g._v049CombatMods[m[2].toLowerCase()]||0)+(+m[1]);addLog(`${g.name} gets +${m[1]} ${m[2]} for this combat.`,api);}\n"+
  "      m=(g.text||'').match(/When this attacks,\\s*gain (\\d+) Truth/i);if(m)addTruth(api,+m[1],g.name);\n"+
  "      m=(g.text||'').match(/When this attacks,\\s*deal (\\d+) direct damage/i);if(m)directDamage(api,+m[1],g.name);",
  'attack trigger automation'
);

one(
  "      const atkStrength=a.kind==='shifter'?shifterCombatStat(api,'strength','attacking'):guardianCombatStat(api,attackerRef,'strength','attacking',c.attackers);\n      const atkGuard=a.kind==='shifter'?shifterCombatStat(api,'guard','attacking'):guardianCombatStat(api,attackerRef,'guard','attacking',c.attackers);",
  "      const atkStrength=a.kind==='shifter'?shifterCombatStat(api,'strength','attacking'):guardianCombatStat(api,attackerRef,'strength','attacking',c.attackers);\n      const atkPower=a.kind==='shifter'?shifterCombatStat(api,'power','attacking'):guardianCombatStat(api,attackerRef,'power','attacking',c.attackers);\n      const atkGuard=a.kind==='shifter'?shifterCombatStat(api,'guard','attacking'):guardianCombatStat(api,attackerRef,'guard','attacking',c.attackers),atkDamage=atkStrength+atkPower;",
  'attacker Strength plus Power'
);

one(
  "        const blocker=dP.zones.Guardian[block.index];if(!blocker)return;\n        const bGuard=guardianCombatStat(dp,blocker,'guard','blocking',c.attackers),bStrength=guardianCombatStat(dp,blocker,'strength','blocking',c.attackers);\n        const toBlocker=Math.max(0,atkStrength-bGuard),toAttacker=Math.max(0,bStrength-atkGuard);",
  "        const blocker=dP.zones.Guardian[block.index];if(!blocker)return;resolveBlockEnterTriggerV049(dp,blocker);\n        const bGuard=guardianCombatStat(dp,blocker,'guard','blocking',c.attackers),bStrength=guardianCombatStat(dp,blocker,'strength','blocking',c.attackers),bPower=guardianCombatStat(dp,blocker,'power','blocking',c.attackers),bDamage=bStrength+bPower;\n        const toBlocker=Math.max(0,atkDamage-bGuard),toAttacker=Math.max(0,bDamage-atkGuard);",
  'blocker Strength plus Power'
);

one(
  "        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkStrength-guard);",
  "        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkDamage-guard);",
  'unblocked Strength plus Power'
);

one(
  "delete g._v044CombatStrengthBonus;delete g._v044CombatVitalityBonus;",
  "delete g._v044CombatStrengthBonus;delete g._v044CombatVitalityBonus;delete g._v049CombatMods;delete g._v049BlockTriggerResolved;",
  'combat modifier cleanup'
);

fs.writeFileSync(gamePath,game);
for(const name of ['shifters-v049-patch.js','shifters-v049-patch.css']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<link[^>]*shifters-v049-patch\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v049-patch\.js[^>]*><\/script>/ig,'');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v049-patch.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v049-patch.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Applied Shapeshifters v0.4.9 combat and tabletop polish.');
