      if(hasName(p,'Foxfire Chorus')&&!v.turnFlags.guardianManifestDamage){v.turnFlags.guardianManifestDamage=true;directDamage(pi,1,'Foxfire Chorus');}
      const offering=p.zones.Relic.find(x=>x.name==='Offering Bowl');if(offering&&(offering.storedRenown||0)){const n=offering.storedRenown;offering.storedRenown=0;addTruth(pi,n,'Offering Bowl');}
    }
    if(c?.type==='Relic'){
      if(hasName(p,'Relic Seer')&&!v.turnFlags.relicManifestDraw){v.turnFlags.relicManifestDraw=true;rawAutoDraw(pi,1,'Relic Seer');}
      const basin=p.zones.Relic.find(x=>x.name==='Offering Basin'&&x!==c);if(basin&&(basin.storedRenown||0)){const n=basin.storedRenown;basin.storedRenown=0;addTruth(pi,n,'Offering Basin');}
    }
    if(c?.type==='Echo'){
      const basin=p.zones.Relic.find(x=>x.name==='Offering Basin');if(basin){basin.storedRenown=(basin.storedRenown||0)+3;addLog(`${basin.name} stored 3 Truth.`,pi);}
      if(c.color==='Green'&&hasName(p,'Tablet of Nine Heads')&&!v.turnFlags.vigorManifestGuard){v.turnFlags.vigorManifestGuard=true;addTemp(pi,'guard',1,'endTurn','Tablet of Nine Heads');}
      if(c.color==='Purple'&&hasName(p,'Foxfire Totem')&&!v.turnFlags.soulManifestDamage){v.turnFlags.soulManifestDamage=true;directDamage(pi,1,'Foxfire Totem');}
    }
  }

  const priorAutoTurnGlamour=autoTurnGlamour;
  autoTurnGlamour=function(pi,opts){const g=priorAutoTurnGlamour(pi,opts||{});if(g)resolveManifest(pi,g);return g;};

  const priorPlayCard=playCard;
  playCard=function(pi,index){
    const c=state.players[pi]?.hand[index];if(!c)return false;const wasRelic=c.type==='Relic';const ok=priorPlayCard(pi,index);if(!ok)return false;
    const p=state.players[pi],v=vstate(p);if(c.type!=='Instinct')applyStaticBuffsForCard(p,c);resolveManifest(pi,c);resolveManifestReacts(pi,c);
    if(wasRelic){if(v.nextRelicDiscount>0)v.nextRelicDiscount=Math.max(0,v.nextRelicDiscount-1);if(v.firstRelicTrigger&&!v.turnFlags.firstRelicTriggerPaid){v.turnFlags.firstRelicTriggerPaid=true;addTruth(pi,3,'Glamour Relic trigger');}v.turnFlags.firstRelicPlayed=true;}
    syncConditionalShifterPassives(p);saveAndRender();return true;
  };
  const priorDiscardEcho=discardEchoCard;
  discardEchoCard=function(pi,color,index){const c=state.players[pi]?.echoes[color]?.[index];if(c)removeStaticBuffsForCard(state.players[pi],c);priorDiscardEcho(pi,color,index);syncConditionalShifterPassives(state.players[pi]);};
  const priorDiscardZone=discardZoneCard;
  discardZoneCard=function(pi,type,index){const c=state.players[pi]?.zones[type]?.[index];if(c)removeStaticBuffsForCard(state.players[pi],c);priorDiscardZone(pi,type,index);syncConditionalShifterPassives(state.players[pi]);};
  const priorDiscardHand=discardHandCard;
  discardHandCard=function(pi,index){const ok=priorDiscardHand(pi,index);if(ok!==false){const v=vstate(state.players[pi]);if(v.discardDebt>0)v.discardDebt--;saveAndRender();}return ok;};

  const priorPhaseAllowed=phaseActionAllowed;
  phaseActionAllowed=function(pi,action,card){
    if(action==='declareAttack'||action==='declareBlock'||action==='revert'||action==='recover')return false;
    if(action==='discardMemory'&&state?.players?.[pi]&&vstate(state.players[pi]).discardDebt>0)return canControlPlayer(pi);
    return priorPhaseAllowed(pi,action,card);
  };
  const priorPhaseIssue=phaseCompletionIssue;
  phaseCompletionIssue=function(){const p=activePlayer(),debt=vstate(p).discardDebt;if(debt>0)return `Discard ${debt} Memory card${debt===1?'':'s'} to finish the card effect.`;return priorPhaseIssue();};

  const priorPrepareTurnStart=prepareTurnStart;
  prepareTurnStart=function(p,first){clearUntilNextTurn(p);priorPrepareTurnStart(p,first);const v=vstate(p);v.floatingGlamour=0;v.turnFlags={};v.discardDebt=0;v.nextRelicDiscount=0;v.firstRelicTrigger=false;};
  const priorStartNextTurn=startNextTurn;
  startNextTurn=function(skipped){const old=activePlayer();vstate(old).floatingGlamour=0;priorStartNextTurn(skipped);ensureCombatState();};

  setFlipped=function(pi,value){
    if(!canControlPlayer(pi)){toast('That belongs to the other player.');return false;}snapshot();const p=state.players[pi];
    if(value){if(!p.flipped){p.flipped=true;p.reverted=false;state.metrics.reversions[p.key]++;addLog(`${p.name} Reverted.`,pi);}}
    else{p.flipped=false;p.reverted=false;p.damage=0;addLog(`${p.name} recovered.`,pi);}
    saveAndRender();return true;
  };

  function recoverAfterCombat(){
    state.players.forEach((p,pi)=>{
      if(p.flipped||p.reverted)addLog(`${p.name} recovered at the end of combat.`,pi);
      p.flipped=false;p.reverted=false;p.damage=0;
    });
  }

  function shifterCombatStat(pi,stat,mode){
    const p=state.players[pi];let n=p.stats[stat]||0;
    allInfluence(p).forEach(c=>{
      const txt=c.text||'';let m;
      if(mode==='attacking'&&(m=txt.match(new RegExp(`Your Shifter gets \\+(\\d+) ${titleCase(stat)} while attacking`,'i'))))n+=+m[1];
      if(mode==='defending'&&(m=txt.match(new RegExp(`Your Shifter gets \\+(\\d+) ${titleCase(stat)} while defending`,'i'))))n+=+m[1];
    });
    return n;
  }
  function guardianCombatStat(pi,c,stat,mode,attackers){
    const p=state.players[pi];let n=c?.[stat]||0;
