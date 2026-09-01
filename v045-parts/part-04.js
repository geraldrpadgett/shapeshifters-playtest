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
    let shifterWasHit=false;
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
        successfulBlockTriggers(dp,blocker);if(toBlocker>0&&a.kind==='guardian')successfulGuardianAttackTriggers(api);
        successfulShifterDefenseTriggers(dp);
      }else{
        const guard=shifterCombatStat(dp,'guard','defending'),dmg=Math.max(0,atkStrength-guard);shifterWasHit=shifterWasHit||dmg>0;damageShifter(dp,dmg,combatName(a),false);addLog(`${combatName(a)} attacked ${dP.name} Shifter for ${dmg} after Guard.`,api);if(dmg>0&&a.kind==='guardian')successfulGuardianAttackTriggers(api);if(dmg===0)successfulShifterDefenseTriggers(dp);
      }
    });
    // Discard Guardians that did not survive the exchange.
    [api,dp].forEach(pi=>{
      const p=state.players[pi],arr=p.zones.Guardian;
      for(let i=arr.length-1;i>=0;i--){const g=arr[i],mode=pi===dp?'blocking':'attacking',vit=guardianCombatStat(pi,g,'vitality',mode,c.attackers);if((g.damage||0)>=vit){arr.splice(i,1);p.discard.push(g);addLog(`${g.name} did not survive combat and went to discard.`,pi);}else g.damage=0;}
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
