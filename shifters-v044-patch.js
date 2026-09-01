(function(){
  'use strict';

  GAME_DATA.version='0.4.4-tabletop-combat';

  const STAT_KEYS=['power','strength','guard','vitality'];
  const titleCase=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const triggerKinds=text=>({react:/\bReact\b/i.test(text||''),manifest:/\bManifest\b/i.test(text||''),awaken:/\bAwaken\b/i.test(text||'')});
  const triggerClass=text=>{const t=triggerKinds(text);return [t.react?'has-react':'',t.manifest?'has-manifest':'',t.awaken?'has-awaken':''].filter(Boolean).join(' ');};
  const triggerBadges=text=>{const t=triggerKinds(text);return `<span class="trigger-badges">${t.react?'<span class="trigger-chip react">REACT</span>':''}${t.manifest?'<span class="trigger-chip manifest">MANIFEST</span>':''}${t.awaken?'<span class="trigger-chip awaken">AWAKEN</span>':''}</span>`;};
  const allEchoes=p=>Object.values(p.echoes||{}).flat();
  const allInfluence=p=>[...allEchoes(p),...(p.zones?.Guardian||[]),...(p.zones?.Relic||[]),...(p.awakeningField||[])];
  const findByName=(p,name)=>allInfluence(p).find(c=>c?.name===name);
  const hasName=(p,name)=>!!findByName(p,name);
  const attackerKey=a=>a.kind==='shifter'?`s-${a.pi}`:`g-${a.pi}-${a.index}`;

  function vstate(p){
    if(!p.v044)p.v044={};
    if(!Number.isFinite(p.v044.floatingGlamour))p.v044.floatingGlamour=0;
    if(!p.v044.turnFlags)p.v044.turnFlags={};
    if(!p.v044.conditionalApplied)p.v044.conditionalApplied={power:0,strength:0,guard:0,vitality:0};
    if(!Number.isFinite(p.v044.discardDebt))p.v044.discardDebt=0;
    if(!Number.isFinite(p.v044.nextRelicDiscount))p.v044.nextRelicDiscount=0;
    if(!p.v044.firstRelicTrigger)p.v044.firstRelicTrigger=false;
    if(!p.v044.untilNextTurn)p.v044.untilNextTurn={power:0,strength:0,guard:0,vitality:0};
    return p.v044;
  }
  function ensureState(){
    if(!state?.players)return;
    state.players.forEach(p=>{
      vstate(p);
      if(!Array.isArray(p.awakeningDiscard))p.awakeningDiscard=[];
      allInfluence(p).forEach(c=>{if(c)applyStaticBuffsForCard(p,c);});
      syncConditionalShifterPassives(p);
    });
    ensureCombatState();
  }
  function ensureCombatState(){
    if(!state)return null;
    const c=state.combat;
    if(!c||!Array.isArray(c.attackers)||!c.blocks){state.combat={stage:'declare',attackers:[],blocks:{}};}
    if(!state.combat.stage)state.combat.stage='declare';
    return state.combat;
  }

  function parseStaticShifterBuffs(c){
    const out=[];const sentences=String(c?.text||'').split(/\.\s*/).map(x=>x.trim()).filter(Boolean);
    sentences.forEach(sentence=>{const m=sentence.match(/^Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality)$/i);if(m)out.push({amount:+m[1],stat:m[2].toLowerCase()});});
    return out;
  }
  function applyStaticBuffsForCard(p,c){
    if(!c||c._v044StaticApplied)return;
    const buffs=parseStaticShifterBuffs(c); if(!buffs.length)return;
    c._v044StaticApplied=buffs;
    buffs.forEach(b=>p.stats[b.stat]=(p.stats[b.stat]||0)+b.amount);
  }
  function removeStaticBuffsForCard(p,c){
    const buffs=c?._v044StaticApplied;if(!Array.isArray(buffs))return;
    buffs.forEach(b=>p.stats[b.stat]=Math.max(0,(p.stats[b.stat]||0)-b.amount));
    delete c._v044StaticApplied;
  }
  function syncConditionalShifterPassives(p){
    const v=vstate(p),desired={power:0,strength:0,guard:0,vitality:0};
    if((p.zones?.Guardian?.length||0)>=2){
      if(hasName(p,'Many Tails, One Spirit'))desired.power+=1;
      if(hasName(p,'The Brood Endures'))desired.vitality+=1;
    }
    STAT_KEYS.forEach(stat=>{
      const prev=v.conditionalApplied[stat]||0,next=desired[stat]||0,delta=next-prev;
      if(delta)p.stats[stat]=Math.max(0,(p.stats[stat]||0)+delta);
      v.conditionalApplied[stat]=next;
    });
  }

  const priorMakePlayer=makePlayer;
  makePlayer=function(key){const p=priorMakePlayer(key);vstate(p);return p;};

  const priorAvailableGlamour=availableGlamour;
  availableGlamour=function(p){return priorAvailableGlamour(p)+(vstate(p).floatingGlamour||0);};
  autoPay=function(p,cost){
    const v=vstate(p);let remain=Math.max(0,cost||0);
    const fromFloat=Math.min(v.floatingGlamour,remain);v.floatingGlamour-=fromFloat;remain-=fromFloat;
    const candidates=p.glamourField.map((g,i)=>({g,i})).filter(x=>!x.g.tapped).sort((a,b)=>a.g.value-b.g.value);
    for(const x of candidates){
      if(remain<=0)break;
      x.g.tapped=true;remain-=x.g.value;
      if(remain<0){v.floatingGlamour+=-remain;remain=0;}
    }
    return remain<=0;
  };

  const priorEffectiveCost=effectiveCost;
  effectiveCost=function(p,c){
    let cost=priorEffectiveCost(p,c),v=vstate(p);
    if(c?.type==='Relic'){
      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collector’s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Trickster’s Lantern'))?1:0;
      cost=Math.max(0,cost-firstDiscount-Math.min(1,v.nextRelicDiscount||0));
    }
    return cost;
  };

  function addTruth(pi,n,source){
    if(!n)return;const p=state.players[pi];p.renown=Math.max(0,p.renown+n);if(n>0)state.metrics.renownGained[p.key]+=n;else state.metrics.renownLost[p.key]+=Math.abs(n);addLog(`${p.name} ${n>0?'gained':'lost'} ${Math.abs(n)} Truth${source?` from ${source}`:''}.`,pi);if(p.renown>=GAME_DATA.victoryRenown&&!state.winner)state.winner=p.key;
  }
  function addTemp(pi,stat,n,bucket,source){
    const p=state.players[pi];p.stats[stat]=(p.stats[stat]||0)+n;
    if(!p.tempMods[bucket])p.tempMods[bucket]={power:0,strength:0,guard:0,vitality:0};
    p.tempMods[bucket][stat]=(p.tempMods[bucket][stat]||0)+n;
    addLog(`${p.name} gets +${n} ${titleCase(stat)}${bucket==='endCombat'?' for this combat':' until end of turn'}${source?` from ${source}`:''}.`,pi);
  }
  function addUntilNextTurn(pi,stat,n,source){
    const p=state.players[pi],v=vstate(p);p.stats[stat]=(p.stats[stat]||0)+n;v.untilNextTurn[stat]=(v.untilNextTurn[stat]||0)+n;addLog(`${p.name} gets +${n} ${titleCase(stat)} until its next turn${source?` from ${source}`:''}.`,pi);
  }
  function clearUntilNextTurn(p){const v=vstate(p);STAT_KEYS.forEach(stat=>{const n=v.untilNextTurn[stat]||0;if(n)p.stats[stat]=Math.max(0,(p.stats[stat]||0)-n);v.untilNextTurn[stat]=0;});}
  function rawAutoDraw(pi,n,source){
    const p=state.players[pi];let count=0;for(let i=0;i<n;i++){if(rawDrawMemory(p)){count++;state.metrics.memoryDraws[p.key]++;}}
    if(count)addLog(`${p.name} drew ${count} Memory card${count===1?'':'s'}${source?` from ${source}`:''}.`,pi);
  }
  function markDiscardDebt(pi,n,source){const p=state.players[pi],v=vstate(p);v.discardDebt+=n;addLog(`${p.name} must discard ${n} Memory card${n===1?'':'s'}${source?` for ${source}`:''}.`,pi);setTimeout(()=>{if(canControlPlayer(pi)){openMyHandDialog(false);toast(`Discard ${v.discardDebt} card${v.discardDebt===1?'':'s'} to finish the effect.`);}},0);}
  function revertShifter(pi,source){
    const p=state.players[pi];if(p.flipped)return;p.flipped=true;p.reverted=false;state.metrics.reversions[p.key]++;addLog(`${p.name} Reverted${source?` from ${source}`:''}.`,pi);
  }
  function damageShifter(pi,n,source,direct=false){
    if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct':''} damage${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;
  }
  function directDamage(fromPi,n,source){
    const target=1-fromPi;damageShifter(target,n,source,true);
    const p=state.players[fromPi],v=vstate(p);
    if(!v.turnFlags.directDamageTriggered){
      v.turnFlags.directDamageTriggered=true;
      const shrine=p.zones.Relic.find(c=>c.name==='Shrine of Embers');if(shrine){shrine.storedRenown=(shrine.storedRenown||0)+3;addLog(`${shrine.name} stored 3 Truth.`,fromPi);}
      if(hasName(p,'Burning Essence'))autoTurnGlamour(fromPi,{ready:true,source:'Burning Essence'});
    }
  }
  function resolveManifest(pi,c){
    if(!c||c._v044ManifestResolved||!/\bManifest\b/i.test(c.text||''))return;
    c._v044ManifestResolved=true;const p=state.players[pi],v=vstate(p),txt=c.text||'';
    const direct=(txt.match(/Manifest[^.]*Deal (\d+) direct damage/i)||[])[1];if(direct)directDamage(pi,+direct,c.name);
    let m=txt.match(/Manifest[^.]*Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality) until end of turn/i);if(m)addTemp(pi,m[2].toLowerCase(),+m[1],'endTurn',c.name);
    m=txt.match(/Manifest[^.]*Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality)\./i);if(m&&!/until end of turn/i.test(m[0])){p.stats[m[2].toLowerCase()]+=+m[1];addLog(`${p.name} permanently gets +${m[1]} ${m[2]} from ${c.name}.`,pi);}
    if(/Manifest[^.]*Draw 2 cards/i.test(txt)){rawAutoDraw(pi,2,c.name);if(/discard 1 card/i.test(txt))markDiscardDebt(pi,1,c.name);}else if(/Manifest[^.]*Draw 1 card/i.test(txt)&&!/may draw/i.test(txt)){rawAutoDraw(pi,1,c.name);if(/discard 1 card/i.test(txt))markDiscardDebt(pi,1,c.name);}
    if(/Manifest[^.]*Flip 1 Glamour/i.test(txt))autoTurnGlamour(pi,{ready:true,source:c.name});
    if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=Math.max(v.nextRelicDiscount,1);
    if(/Manifest[^.]*first time one of your Relics triggers this turn, gain 3 Truth/i.test(txt))v.firstRelicTrigger=true;
    if(/Manifest[^.]*If you control a Relic, your Shifter gets \+1 (Power|Guard) this turn/i.test(txt)&&p.zones.Relic.length)addTemp(pi,RegExp.$1.toLowerCase(),1,'endTurn',c.name);
    if(/Manifest[^.]*If you control a Relic, gain 3 Truth/i.test(txt)&&p.zones.Relic.length)addTruth(pi,3,c.name);
    if(/Manifest[^.]*If you control a Wrath Echo, gain 3 Truth/i.test(txt)&&(p.echoes.Red||[]).length)addTruth(pi,3,c.name);
  }
  function resolveManifestReacts(pi,c){
    const p=state.players[pi],v=vstate(p);
    if(c?.type==='Guardian'){
      if(hasName(p,'Trickster’s Pack')&&!v.turnFlags.guardianManifestTruth){v.turnFlags.guardianManifestTruth=true;addTruth(pi,3,'Trickster’s Pack');}
      if(hasName(p,'Kindle the Pack'))addTemp(pi,'power',1,'endTurn','Kindle the Pack');
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
    const currentKey=Object.keys(c.blocks).find(k=>c.blocks[k]?.pi===pi&&c.blocks[k]?.index===index);if(currentKey){snapshot();delete c.blocks[currentKey];saveAndRender();return;}
    const open=c.attackers.filter(a=>!c.blocks[attackerKey(a)]);if(!open.length){toast('Every attacker is already blocked.');return;}
    if(open.length===1){assignBlock(pi,index,open[0]);return;}
    const g=state.players[pi].zones.Guardian[index];$('#cardDialogEyebrow').textContent='DECLARE BLOCKER';$('#cardDialogTitle').textContent=g?.name||'Guardian';$('#cardDialogBody').innerHTML=`<div class="combat-target-picker"><p>Choose the attacker for ${esc(g?.name||'this Guardian')} to block.</p>${open.map((a,n)=>`<button class="button combat-target" data-v044-block-target="${attackerKey(a)}">${n+1}. ${esc(combatName(a))}</button>`).join('')}</div>`;document.querySelectorAll('[data-v044-block-target]').forEach(btn=>btn.onclick=()=>{const a=open.find(x=>attackerKey(x)===btn.dataset.v044BlockTarget);if(a)assignBlock(pi,index,a);closeDialog('cardDialog');});openDialog('cardDialog');
  }
  function assignBlock(pi,index,a){snapshot();const c=ensureCombatState();c.blocks[attackerKey(a)]={pi,index};addLog(`${state.players[pi].zones.Guardian[index]?.name||'Guardian'} blocks ${combatName(a)}.`,pi);saveAndRender();}
  function combatName(a){return a.kind==='shifter'?`${state.players[a.pi].name} Shifter`:(state.players[a.pi].zones.Guardian[a.index]?.name||'Guardian');}

  function resolveCombatV044(){
    const c=ensureCombatState(),api=state.active,dp=1-api,aP=state.players[api],dP=state.players[dp];
    const entries=c.attackers.map(a=>({a,key:attackerKey(a),ref:a.kind==='guardian'?aP.zones.Guardian[a.index]:null}));
    entries.forEach(entry=>{
      const a=entry.a,block=c.blocks[entry.key],attackerRef=entry.ref;
      const atkStrength=a.kind==='shifter'?shifterCombatStat(api,'strength','attacking'):guardianCombatStat(api,attackerRef,'strength','attacking',c.attackers);
      const atkGuard=a.kind==='shifter'?shifterCombatStat(api,'guard','attacking'):guardianCombatStat(api,attackerRef,'guard','attacking',c.attackers);
      if(block){
        const blocker=dP.zones.Guardian[block.index];if(!blocker)return;
        const bGuard=guardianCombatStat(dp,blocker,'guard','blocking',c.attackers),bStrength=guardianCombatStat(dp,blocker,'strength','blocking',c.attackers);
        const toBlocker=Math.max(0,atkStrength-bGuard),toAttacker=Math.max(0,bStrength-atkGuard);
        blocker.damage=(blocker.damage||0)+toBlocker;
        if(a.kind==='guardian'&&attackerRef)attackerRef.damage=(attackerRef.damage||0)+toAttacker;else if(a.kind==='shifter')damageShifter(api,toAttacker,blocker.name,false);
        addLog(`${combatName(a)} dealt ${toBlocker} combat damage to ${blocker.name}; ${blocker.name} dealt ${toAttacker} back.`,api);
        successfulBlockTriggers(dp,blocker);if(toBlocker>0&&a.kind==='guardian')successfulGuardianAttackTriggers(api);successfulShifterDefenseTriggers(dp);
      }else{
        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkStrength-guard);damageShifter(dp,dmg,combatName(a),false);addLog(`${combatName(a)} attacked ${dP.name} Shifter for ${dmg} after Guard.`,api);if(dmg>0&&a.kind==='guardian')successfulGuardianAttackTriggers(api);if(dmg===0)successfulShifterDefenseTriggers(dp);
      }
    });
    [api,dp].forEach(pi=>{
      const p=state.players[pi],arr=p.zones.Guardian;
      for(let i=arr.length-1;i>=0;i--){const g=arr[i],mode=pi===dp?'blocking':'attacking',vit=guardianCombatStat(pi,g,'vitality',mode,c.attackers);if((g.damage||0)>=vit){arr.splice(i,1);p.discard.push(g);addLog(`${g.name} did not survive combat and went to discard.`,pi);}}
    });
    state.players.forEach(p=>{p.zones.Guardian.forEach(g=>{delete g._v044CombatStrengthBonus;delete g._v044CombatVitalityBonus;});clearTempMods(p,'endCombat');syncConditionalShifterPassives(p);});
    recoverAfterCombat();state.combat={stage:'declare',attackers:[],blocks:{}};addLog('Combat resolved. Shifters recovered before Awakening.',api);
  }

  const priorPhaseInstruction=phaseInstruction;
  phaseInstruction=function(){
    if(state?.phase===3){const c=ensureCombatState();if(c.stage==='declare')return c.attackers.length?`${c.attackers.length} attacker${c.attackers.length===1?'':'s'} selected. All attackers target the opposing Shifter. Lock attackers when ready.`:'Tap ATTACK on your Shifter and/or Guardians, or advance with no attack.';return `Defender: tap BLOCK on Guardians to assign blockers. Then resolve combat.`;}
    if(state?.phase===4)return 'Combat is complete and Shifters have automatically recovered. Continue to manifest Awakening.';
    return priorPhaseInstruction();
  };

  const priorNextPhase=nextPhase;
  nextPhase=function(){
    if(state?.phase!==3)return priorNextPhase();
    if(!canControlTurn()){toast(`Waiting for ${activePlayer().name}.`);return;}
    const issue=phaseCompletionIssue();if(issue){toast(issue);flashRequiredAction();return;}
    const c=ensureCombatState();snapshot();
    if(c.stage==='declare'&&c.attackers.length){c.stage='block';beginAttackTriggers();addLog('Attackers locked. Defender may declare blockers.',state.active);saveAndRender();flashPhaseConsole();return;}
    if(c.stage==='declare'&&!c.attackers.length){recoverAfterCombat();state.phase=4;addLog(`Phase: ${GAME_DATA.phases[4]}.`,state.active);saveAndRender();flashPhaseConsole();return;}
    if(c.stage==='block'){resolveCombatV044();state.phase=4;addLog(`Phase: ${GAME_DATA.phases[4]}.`,state.active);saveAndRender();flashPhaseConsole();return;}
  };

  function resolveAwakenEnter(pi,a){
    const p=state.players[pi];applyStaticBuffsForCard(p,a);
    if(/Awaken[^.]*Your Shifter gets \+2 Guard until your next turn/i.test(a.text||''))addUntilNextTurn(pi,'guard',2,a.name);
    if(/Awaken[^.]*If you control a Guardian, gain 3 Truth/i.test(a.text||'')&&p.zones.Guardian.length)addTruth(pi,3,a.name);
    syncConditionalShifterPassives(p);
  }
  autoAwakeningThenCleanup=function(){
    const pi=state.active,p=activePlayer();state.phase=5;const a=rawDrawAwakening(p);p.flags.awakeningDrawn=true;
    if(!a){state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pi);return;}
    if(p.awakeningField.length<GAME_DATA.maxAwakenings){p.awakeningField.push(a);p.awakening=p.awakeningField.length;state.metrics.awakeningsPlayed[p.key]++;resolveAwakenEnter(pi,a);addLog(`${p.name} automatically manifested ${a.name}.`,pi);toast(`${a.name} manifested · ${p.awakeningField.length}/${GAME_DATA.maxAwakenings}`);state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pi);return;}
    state.pendingAwakening={pi,card:a};addLog(`${p.name} revealed ${a.name}. With 9 Awakenings manifested, choose whether to keep the current nine or replace one.`,pi);setTimeout(openAwakeningChoiceDialog,0);
  };
  resolveAwakeningChoice=function(replaceIndex=null){
    const pending=state?.pendingAwakening;if(!pending)return;const p=state.players[pending.pi],a=pending.card;if(!Array.isArray(p.awakeningDiscard))p.awakeningDiscard=[];snapshot();
    if(Number.isInteger(replaceIndex)&&replaceIndex>=0&&replaceIndex<p.awakeningField.length){const old=p.awakeningField[replaceIndex];removeStaticBuffsForCard(p,old);p.awakeningField[replaceIndex]=a;p.awakeningDiscard.push(old);state.metrics.awakeningsPlayed[p.key]++;resolveAwakenEnter(pending.pi,a);addLog(`${p.name} replaced ${old.name} with ${a.name}.`,pending.pi);toast(`${a.name} replaced ${old.name}.`);}else{p.awakeningDiscard.push(a);addLog(`${p.name} kept the current nine Awakenings; ${a.name} was set aside.`,pending.pi);toast(`Kept current 9 · ${a.name} set aside.`);}
    p.awakening=p.awakeningField.length;state.pendingAwakening=null;state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pending.pi);closeDialog('awakeningChoiceDialog');saveAndRender();flashPhaseConsole();
  };

  cardMarkup=function(c,compact=false){
    const stats=c.type==='Guardian'?`S ${c.strength} · P ${c.power} · G ${c.guard} · V ${c.vitality}${c.damage?` · D ${c.damage}`:''}`:'';const tokens=c.storedRenown?`<span class="card-tokens">◆ ${c.storedRenown}</span>`:'';const number=c.number||Number((String(c.id||'').match(/(\d+)/)||[])[1]||0);return `<article class="card ${triggerClass(c.text)}" style="${cardStyle(c)}">${number?`<span class="card-number">#${number}</span>`:''}<span class="cost">${c.cost}</span>${triggerBadges(c.text)}<div class="card-type">${esc(c.color)} · ${esc(c.type)}${c.subtype?` — ${esc(c.subtype)}`:''}</div><div class="card-name">${esc(c.name)}</div><div class="card-text">${esc(c.text)}</div>${stats?`<div class="card-stats">${stats}</div>`:''}${tokens}</article>`;
  };
  awakeningMarkup=function(a,key){return `<div class="ability-card ${triggerClass(a.text)}"><span class="card-number">#${a.number||a.level}</span>${triggerBadges(a.text)}<img src="${GAME_DATA.shifters[key].symbol}" alt=""><strong>${esc(a.name)}</strong><span>${esc(a.text)}</span></div>`;};
  glamourMarkup=function(g,cls=''){return `<div class="glamour ${cls} ${g.tapped?'tapped':''} ${triggerClass(g.text)}" title="Tap to inspect ${esc(g.name||'Glamour')}"><small class="glamour-number">#${g.number||''}</small>${triggerBadges(g.text)}<span class="glamour-value">${g.value}</span><small class="glamour-title">${esc(g.name||'Glamour')}</small></div>`;};
  const priorCardDetail=cardDetail;
  cardDetail=function(c,extraActions='',tokenPanel=''){return `<div class="detail-trigger-row">${triggerBadges(c?.text)}</div>`+priorCardDetail(c,extraActions,tokenPanel);};

  function openGlamourInspect(pi,index){
    const g=state.players[pi]?.glamourField[index];if(!g)return;$('#cardDialogEyebrow').textContent='GLAMOUR';$('#cardDialogTitle').textContent=g.name||`Glamour ${g.value}`;const t={...g,type:'Glamour',color:'Neutral',cost:g.value};$('#cardDialogBody').innerHTML=cardDetail(t,`<button class="button ghost" id="v044ManualGlamour">${g.tapped?'Untap manually':'Tap manually'}</button>`);$('#v044ManualGlamour').onclick=()=>{closeDialog('cardDialog');tapGlamour(pi,index);};openDialog('cardDialog');
  }

  function reflowV044(){
    document.querySelectorAll('.v4-tabletop').forEach(table=>{
      if(table.querySelector('.table-layout-v044'))return;
      const support=table.querySelector('.support-row'),echo=table.querySelector('.echo-ring'),auto=table.querySelector('.auto-deck-row'),bottom=table.querySelector('.table-bottom-row');if(!support||!echo||!auto||!bottom)return;
      const piDeck=table.querySelector('[data-board-deck="memory|0"]')?0:table.querySelector('[data-board-deck="memory|1"]')?1:null;if(piDeck===null)return;
      const glamLane=table.querySelector('.glamour-lane'),awakLane=table.querySelector('.awakening-lane'),glamDeck=table.querySelector('.pile-glamour'),awakDeck=table.querySelector('.pile-awakening'),memory=table.querySelector('.memory-dock');if(!glamLane||!awakLane||!glamDeck||!awakDeck||!memory)return;
      const area=document.createElement('div');area.className='area-influence-v044';area.innerHTML='<div class="area-label-v044">AREA OF INFLUENCE</div>';area.appendChild(support);
      const layout=document.createElement('div');layout.className='table-layout-v044';
      const left=document.createElement('aside');left.className='resource-rail-v044 glamour-rail-v044';left.appendChild(glamLane);const gd=document.createElement('div');gd.className='rail-deck-v044';gd.appendChild(glamDeck);left.appendChild(gd);
      const center=document.createElement('div');center.className='center-arena-v044';center.appendChild(echo);const md=document.createElement('div');md.className='memory-center-v044';md.appendChild(memory);center.appendChild(md);
      const right=document.createElement('aside');right.className='resource-rail-v044 awakening-rail-v044';right.appendChild(awakLane);const ad=document.createElement('div');ad.className='rail-deck-v044';ad.appendChild(awakDeck);right.appendChild(ad);
      layout.append(left,center,right);auto.remove();bottom.remove();table.append(area,layout);
      const float=vstate(state.players[piDeck]).floatingGlamour||0;const head=glamLane.querySelector('.lane-head b');if(head)head.textContent=`${availableGlamour(state.players[piDeck])} available${float?` · ${float} floating`:''}`;
      glamLane.querySelectorAll('[data-glamour-field]').forEach(w=>{const [pi,i]=w.dataset.glamourField.split('|');const card=w.querySelector('.glamour');if(card){card.dataset.v044InspectGlamour=`${pi}|${i}`;card.setAttribute('role','button');}});
    });
  }

  function decorateRevertButtons(){
    document.querySelectorAll('[data-revert]').forEach(x=>x.remove());
    document.querySelectorAll('[data-shifter-flip]').forEach(btn=>{const value=(btn.dataset.shifterFlip||'').split('|')[1];btn.textContent=value==='true'?'REVERT':'RECOVER';btn.title=value==='true'?'Revert this Shifter':'Recover this Shifter';});
  }
  function decorateCombat(){
    if(state.phase!==3)return;const c=ensureCombatState(),api=state.active,dp=1-api;
    const boardFor=pi=>document.querySelector(`[data-board-deck="memory|${pi}"]`)?.closest('.player-board');const ab=boardFor(api),db=boardFor(dp);if(!ab||!db)return;
    const panel=document.createElement('div');panel.className='combat-console-v044';panel.innerHTML=c.stage==='declare'?`<strong>ATTACK</strong><span>${c.attackers.length?`${c.attackers.length} selected · all target ${state.players[dp].name} Shifter`:'Select your Shifter and/or Guardians'}</span>`:`<strong>BLOCK</strong><span>${Object.keys(c.blocks).length}/${c.attackers.length} attackers blocked · unblocked attackers hit ${state.players[dp].name} Shifter</span>`;ab.querySelector('.tabletop-wrap')?.prepend(panel);
    if(c.stage==='declare'){
      const selected=new Set(c.attackers.map(attackerKey));const s=ab.querySelector('.shifter-center');if(s&&!state.players[api].flipped){const b=document.createElement('button');b.className='combat-select-v044';b.textContent=selected.has(`s-${api}`)?'ATTACKING':'ATTACK';b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleAttacker(api,'shifter',0)};s.appendChild(b);if(selected.has(`s-${api}`))s.classList.add('combat-selected-v044');}
      ab.querySelectorAll(`[data-zone-card^="${api}|Guardian|"]`).forEach(w=>{const idx=+w.dataset.zoneCard.split('|')[2],key=`g-${api}-${idx}`,b=document.createElement('button');b.className='combat-select-v044';b.textContent=selected.has(key)?'ATTACKING':'ATTACK';b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleAttacker(api,'guardian',idx)};w.classList.toggle('combat-selected-v044',selected.has(key));w.appendChild(b);});
    }else{
      db.querySelectorAll(`[data-zone-card^="${dp}|Guardian|"]`).forEach(w=>{const idx=+w.dataset.zoneCard.split('|')[2],assigned=Object.entries(c.blocks).find(([,x])=>x.pi===dp&&x.index===idx),b=document.createElement('button');b.className='combat-select-v044 block';b.textContent=assigned?'BLOCKING':'BLOCK';b.onclick=e=>{e.preventDefault();e.stopPropagation();blockerAssignment(dp,idx)};w.classList.toggle('combat-selected-v044',!!assigned);w.appendChild(b);});
    }
  }
  function decorateNextButton(){
    if(state.phase!==3)return;const next=$('#nextPhaseBtn'),c=ensureCombatState();if(!next)return;if(c.stage==='declare')next.textContent=c.attackers.length?`Lock ${c.attackers.length} Attacker${c.attackers.length===1?'':'s'}`:'Skip Attack';else next.textContent='Resolve Combat';
  }
  function updateSubtitle(){const s=document.querySelector('.subtitle');if(s)s.textContent=s.textContent.replace(/v0\.4\.[0-9][^·]*/i,'v0.4.4 Automated Tabletop');}

  const priorRender=render;
  render=function(){ensureState();priorRender();reflowV044();decorateRevertButtons();decorateCombat();decorateNextButton();updateSubtitle();};

  document.addEventListener('click',function(e){
    const discard=e.target.closest?.('[data-open-discard]');if(discard){e.preventDefault();e.stopImmediatePropagation();openDiscardDialog(+discard.dataset.openDiscard);return;}
    const glam=e.target.closest?.('[data-v044-inspect-glamour]');if(glam){e.preventDefault();e.stopImmediatePropagation();const [pi,i]=glam.dataset.v044InspectGlamour.split('|');openGlamourInspect(+pi,+i);}
  },true);

  const priorRenderRules=renderRules;
  renderRules=function(){priorRenderRules();const root=$('#rulesCopy');if(!root)return;root.querySelectorAll('.rule-card').forEach(card=>{const h=card.querySelector('h4')?.textContent.trim();if(h==='Combat')card.querySelector('p').innerHTML='During Attack, select your Shifter and/or Guardians; all attackers target the opposing Shifter. The defender assigns Guardian blockers. <strong>Strength</strong> deals combat damage, <strong>Guard</strong> prevents it, and damage reaching <strong>Vitality</strong> Reverts a Shifter or sends a Guardian to discard. Shifters automatically Recover after combat, before Awakening.';if(h==='Glamour')card.querySelector('p').innerHTML='The top Glamour manifests automatically each turn. Tap a Glamour card to inspect its text. If paying a cost would overpay, the unused Glamour <strong>floats</strong> and remains available until the end of the turn.';});};

  ensureState();renderRules();render();
})();
