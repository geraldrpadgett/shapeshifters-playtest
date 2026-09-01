const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'dist');
const gamePath=path.join(out,'shifters-v045-patch.js');
let game=fs.readFileSync(gamePath,'utf8');

function required(oldText,newText,label){
  if(!game.includes(oldText))throw new Error('v0.5.0 post-build patch failed: '+label);
  game=game.replace(oldText,newText);
}

// Direct damage already bypasses Guard in the engine. Make that explicit in the combat log.
required(
  "if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct':''} damage${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;",
  "if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct damage (Guard ignored)':' damage'}${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;",
  'direct damage Guard bypass log'
);

// An unblocked attacker and the defending Shifter now exchange combat damage simultaneously.
required(
  "        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkDamage-guard);shifterWasHit=shifterWasHit||dmg>0;damageShifter(dp,dmg,combatName(a),false);addLog(`${combatName(a)} attacked ${dP.name} Shifter for ${dmg} after Guard.`,api);if(dmg>0&&a.kind==='guardian')successfulGuardianAttackTriggers(api);if(dmg===0)successfulShifterDefenseTriggers(dp);",
  [
    "        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkDamage-guard);",
    "        const defStrength=shifterCombatStat(dp,'strength','defending'),defPower=shifterCombatStat(dp,'power','defending'),defDamage=defStrength+defPower,back=Math.max(0,defDamage-atkGuard);",
    "        shifterWasHit=shifterWasHit||dmg>0;",
    "        damageShifter(dp,dmg,combatName(a),false);",
    "        if(a.kind==='guardian'&&attackerRef)attackerRef.damage=(attackerRef.damage||0)+back;else if(a.kind==='shifter')damageShifter(api,back,`${dP.name} Shifter`,false);",
    "        addLog(`${combatName(a)} dealt ${dmg} combat damage to ${dP.name} Shifter; ${dP.name} Shifter dealt ${back} back.`,api);",
    "        if(dmg>0&&a.kind==='guardian')successfulGuardianAttackTriggers(api);if(dmg===0)successfulShifterDefenseTriggers(dp);"
  ].join('\n'),
  'simultaneous unblocked combat exchange'
);

// Reverted Shifters no longer auto-recover after combat.
required(
  "recoverAfterCombat();state.combat={stage:'declare',attackers:[],blocks:{}};addLog('Combat resolved. Shifters recovered before Awakening.',api);",
  "state.combat={stage:'declare',attackers:[],blocks:{}};addLog('Combat resolved. Reverted Shifters remain face-down until their owner’s next Recover step.',api);",
  'remove post-combat recovery'
);
required(
  "function finishCombatToAwakeningV045(){recoverAfterCombat();state.combat={stage:'declare',attackers:[],blocks:{}};autoAwakeningV045();}",
  "function finishCombatToAwakeningV045(){state.combat={stage:'declare',attackers:[],blocks:{}};autoAwakeningV045();}",
  'remove skip-combat recovery'
);

fs.writeFileSync(gamePath,game);
for(const name of ['shifters-v050-patch.js','shifters-v050-patch.css']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<link[^>]*shifters-v050-patch\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v050-patch\.js[^>]*><\/script>/ig,'');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v050-patch.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v050-patch.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Applied Shapeshifters v0.5.0 recover-before-combat and simultaneous exchange rules.');
