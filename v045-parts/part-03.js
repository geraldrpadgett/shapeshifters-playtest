    allInfluence(p).forEach(src=>{
      const txt=src.text||'';let m;
      if((m=txt.match(new RegExp(`(?:Guardians you control|Your Guardians) get \\+(\\d+) ${titleCase(stat)}(?:\\.|$)`,'i'))))n+=+m[1];
      if(mode==='blocking'&&(m=txt.match(new RegExp(`(?:Guardians you control|Your Guardians) get \\+(\\d+) ${titleCase(stat)} while blocking`,'i'))))n+=+m[1];
    });
    if(mode==='attacking'&&c?.name==='Pack Hunter'&&attackers?.filter(a=>a.kind==='guardian').length>1&&stat==='strength')n+=1;
    if(stat==='strength')n+=c?._v044CombatStrengthBonus||0;
    if(stat==='vitality')n+=c?._v044CombatVitalityBonus||0;
    const growth=p.awakeningField.find(a=>a.name==='The Growing Pack'||a.name==='The Growing Hydra');
    if(growth){const k=p.awakeningField.length;if(p.key==='fox'){if(stat==='strength'&&k>=3)n+=1;if(stat==='power'&&k>=6)n+=1;if(stat==='vitality'&&k>=9)n+=1;}else{if(stat==='vitality'&&k>=3)n+=1;if(stat==='guard'&&k>=6)n+=1;if(stat==='strength'&&k>=9)n+=1;}}
    return n;
  }
  function beginAttackTriggers(){
    const c=ensureCombatState(),api=state.active,dp=1-api,aP=state.players[api],dP=state.players[dp],v=vstate(aP),dv=vstate(dP);
    const guardians=c.attackers.filter(a=>a.kind==='guardian');const shifterAttacks=c.attackers.some(a=>a.kind==='shifter');
    guardians.forEach(a=>{
      const g=aP.zones.Guardian[a.index];if(!g)return;
      if(/When this attacks, your Shifter gets \+1 Strength until end of turn/i.test(g.text||''))addTemp(api,'strength',1,'endTurn',g.name);
      if(/When this attacks, draw 1 card, then discard 1 card/i.test(g.text||'')){rawAutoDraw(api,1,g.name);markDiscardDebt(api,1,g.name);}
    });
    if(guardians.length&&hasName(aP,'Shared Hunt'))addTemp(api,'strength',guardians.length,'endTurn','Shared Hunt');
    if(shifterAttacks){
      const shrine=aP.zones.Relic.find(x=>x.name==='Shrine of Embers');if(shrine&&(shrine.storedRenown||0)){const n=shrine.storedRenown;shrine.storedRenown=0;addTruth(api,n,'Shrine of Embers');}
      const bowl=aP.zones.Relic.find(x=>x.name==='Offering Bowl');if(bowl){bowl.storedRenown=(bowl.storedRenown||0)+3;addLog(`${bowl.name} stored 3 Truth.`,api);}
      if(hasName(aP,'Hunt Together')&&aP.zones.Guardian.length){const target=guardians[0]?aP.zones.Guardian[guardians[0].index]:aP.zones.Guardian[0];target._v044CombatStrengthBonus=(target._v044CombatStrengthBonus||0)+1;addLog(`Hunt Together gave ${target.name} +1 Strength for this combat.`,api);}
    }
    if(c.attackers.length){
      if(hasName(dP,'Slippery Form')&&!dv.turnFlags.shifterAttackedGuard){dv.turnFlags.shifterAttackedGuard=true;addTemp(dp,'guard',1,'endCombat','Slippery Form');}
      if(hasName(dP,'Many Heads Watching')&&false){} // reserved for Guardian-manifest trigger
      if(hasName(dP,'Shelter Beneath the Coil')&&dP.zones.Guardian.length){const target=dP.zones.Guardian[0];target._v044CombatVitalityBonus=(target._v044CombatVitalityBonus||0)+1;addLog(`Shelter Beneath the Coil gave ${target.name} +1 Vitality for this combat.`,dp);}
    }
  }
  function successfulBlockTriggers(dp,blocker){
    const p=state.players[dp],v=vstate(p);
    if(blocker?.name==='Coil Guardian')addTruth(dp,3,'Coil Guardian');
    if(hasName(p,'Guardian Brood')&&!v.turnFlags.guardianBlockVitality){v.turnFlags.guardianBlockVitality=true;addTemp(dp,'vitality',1,'endTurn','Guardian Brood');}
    if(hasName(p,'Strength in Survival'))addTemp(dp,'guard',1,'endTurn','Strength in Survival');
    if(hasName(p,'Unbroken Defense')&&!v.turnFlags.unbrokenDefense){v.turnFlags.unbrokenDefense=true;addTruth(dp,3,'Unbroken Defense');}
  }
  function successfulShifterDefenseTriggers(dp){
    const p=state.players[dp],v=vstate(p);if(v.turnFlags.successfulDefense)return;v.turnFlags.successfulDefense=true;
    if(hasName(p,'Persistent Spark'))addTruth(dp,3,'Persistent Spark');
    if(hasName(p,'Endless Growth')){p.stats.vitality+=1;addLog(`${p.name} permanently gets +1 Vitality from Endless Growth.`,dp);}
    const altar=p.zones.Relic.find(x=>x.name==='Altar of Renewal');if(altar&&(altar.storedRenown||0)){const n=altar.storedRenown;altar.storedRenown=0;addTruth(dp,n,'Altar of Renewal');}
  }
  function successfulGuardianAttackTriggers(api){const p=state.players[api],v=vstate(p);if(hasName(p,'Glorious Pursuit')&&!v.turnFlags.gloriousPursuit){v.turnFlags.gloriousPursuit=true;addTruth(api,3,'Glorious Pursuit');}}

  function toggleAttacker(pi,kind,index){
    if(state.phase!==3||pi!==state.active||!canControlPlayer(pi))return;const c=ensureCombatState();if(c.stage!=='declare')return;
    const key=attackerKey({pi,kind,index}),at=c.attackers.findIndex(a=>attackerKey(a)===key);snapshot();if(at>=0)c.attackers.splice(at,1);else c.attackers.push({pi,kind,index});addLog(`${kind==='shifter'?state.players[pi].name+' Shifter':state.players[pi].zones.Guardian[index]?.name||'Guardian'} ${at>=0?'removed from':'declared as'} attackers.`,pi);saveAndRender();
  }
  function blockerAssignment(pi,index){
    const c=ensureCombatState();if(state.phase!==3||c.stage!=='block'||pi===state.active||!canControlPlayer(pi))return;
