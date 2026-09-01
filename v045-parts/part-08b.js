    else{p.awakeningDiscard.push(a);addLog(`${p.name} kept the current nine Awakenings; ${a.name} was set aside.`,pending.pi);toast(`Kept current 9 · ${a.name} set aside.`);}
    p.awakening=p.awakeningField.length;state.pendingAwakening=null;state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pending.pi);closeDialog('awakeningChoiceDialog');saveAndRender();flashPhaseConsole();
  }
  function autoAwakeningV045(){
    const pi=state.active,p=activePlayer();state.phase=5;const a=rawDrawAwakening(p);p.flags.awakeningDrawn=true;
    if(!a){state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pi);return;}
    if(p.awakeningField.length<GAME_DATA.maxAwakenings){p.awakeningField.push(a);p.awakening=p.awakeningField.length;state.metrics.awakeningsPlayed[p.key]++;resolveAwakenEnter(pi,a);addLog(`${p.name} automatically manifested ${a.name}.`,pi);toast(`${a.name} manifested · ${p.awakeningField.length}/${GAME_DATA.maxAwakenings}`);state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pi);return;}
    state.pendingAwakening={pi,card:a};addLog(`${p.name} revealed ${a.name}. With 9 Awakenings manifested, choose whether to keep the current nine or replace one.`,pi);setTimeout(openAwakeningChoiceDialog,0);
  }
  function finishCombatToAwakeningV045(){recoverAfterCombat();state.combat={stage:'declare',attackers:[],blocks:{}};autoAwakeningV045();}
  function handleAttackAdvanceV045(){
    if(state.phase!==3)return false;const c=ensureCombatState(),api=state.active,dp=1-api;
    if(c.stage==='declare'){
      if(!canControlTurn()){toast(`Waiting for ${activePlayer().name}.`);return true;}
      if(vstate(activePlayer()).discardDebt>0){toast(`Discard ${vstate(activePlayer()).discardDebt} card first.`);openMyHandDialog(false);return true;}
      snapshot();
      if(!c.attackers.length){addLog('No attackers declared.',api);finishCombatToAwakeningV045();saveAndRender();flashPhaseConsole();return true;}
      c.stage='block';beginAttackTriggers();addLog('Attackers locked. Defender may declare blockers.',api);saveAndRender();flashPhaseConsole();return true;
    }
    if(c.stage==='block'){
      const allowed=canControlTurn()||canControlPlayer(dp);if(!allowed){toast('Waiting for the defender to finish blocking.');return true;}
      if(vstate(activePlayer()).discardDebt>0){toast(`Discard ${vstate(activePlayer()).discardDebt} card first.`);return true;}
      snapshot();resolveCombatV044();autoAwakeningV045();saveAndRender();flashPhaseConsole();return true;
    }
    return true;
  }
  function reconcileV045(){
    if(!state?.players)return false;let changed=false;
    state.players.forEach((p,pi)=>{
      vstate(p);
