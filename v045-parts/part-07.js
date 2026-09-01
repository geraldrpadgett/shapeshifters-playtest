  function decorateNextButton(){
    if(state.phase!==3)return;const next=$('#nextPhaseBtn'),c=ensureCombatState();if(!next)return;if(c.stage==='declare')next.textContent=c.attackers.length?`Lock ${c.attackers.length} Attacker${c.attackers.length===1?'':'s'}`:'Skip Attack';else next.textContent='Resolve Combat';
  }
  function updateSubtitle(){const s=document.querySelector('.subtitle');if(s)s.textContent=s.textContent.replace(/v0\.4\.[0-9][^·]*/i,'v0.4.4 Automated Tabletop');}

  const priorRender=render;
  render=function(){ensureState();priorRender();reflowV044();decorateRevertButtons();decorateCombat();decorateNextButton();updateSubtitle();};

  // Reliable discard and Glamour inspection use capture so older board click handlers cannot swallow them.
  document.addEventListener('click',function(e){
    const discard=e.target.closest?.('[data-open-discard]');if(discard){e.preventDefault();e.stopImmediatePropagation();openDiscardDialog(+discard.dataset.openDiscard);return;}
    const glam=e.target.closest?.('[data-v044-inspect-glamour]');if(glam){e.preventDefault();e.stopImmediatePropagation();const [pi,i]=glam.dataset.v044InspectGlamour.split('|');openGlamourInspect(+pi,+i);}
  },true);

  const priorRenderRules=renderRules;
  renderRules=function(){priorRenderRules();const root=$('#rulesCopy');if(!root)return;root.querySelectorAll('.rule-card').forEach(card=>{const h=card.querySelector('h4')?.textContent.trim();if(h==='Combat')card.querySelector('p').innerHTML='During Attack, select your Shifter and/or Guardians; all attackers target the opposing Shifter. The defender assigns Guardian blockers. <strong>Strength</strong> deals combat damage, <strong>Guard</strong> prevents it, and damage reaching <strong>Vitality</strong> Reverts a Shifter or sends a Guardian to discard. Shifters automatically Recover after combat, before Awakening.';if(h==='Glamour')card.querySelector('p').innerHTML='The top Glamour manifests automatically each turn. Tap a Glamour card to inspect its text. If paying a cost would overpay, the unused Glamour <strong>floats</strong> and remains available until the end of the turn.';});};


  // v0.4.5 robust hooks: core app handlers are bound before this patch loads, so
  // these capture-phase controls and the observer keep the enhanced tabletop
  // active after every base render and make the gameplay automation authoritative.
  let v045Decorating=false,v045ReconcileRender=false;
  function availableV045(p){return (p.glamourField||[]).filter(g=>!g.tapped).reduce((sum,g)=>sum+(g.value||0),0)+(vstate(p).floatingGlamour||0);}
  function effectiveCostV045(p,c){
    let cost=Math.max(0,c?.cost||0),v=vstate(p);
    if(c?.type==='Relic'){
      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collector’s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Trickster’s Lantern'))?1:0;
      cost=Math.max(0,cost-firstDiscount-Math.min(1,v.nextRelicDiscount||0));
    }
    return cost;
  }
  function payV045(p,cost){
    const v=vstate(p);let remain=Math.max(0,cost||0);
    const fromFloat=Math.min(v.floatingGlamour,remain);v.floatingGlamour-=fromFloat;remain-=fromFloat;
    const candidates=(p.glamourField||[]).map((g,i)=>({g,i})).filter(x=>!x.g.tapped).sort((a,b)=>(a.g.value||0)-(b.g.value||0));
    for(const x of candidates){
      if(remain<=0)break;
      x.g.tapped=true;remain-=x.g.value||0;
      if(remain<0){v.floatingGlamour+=-remain;remain=0;}
    }
    return remain<=0;
  }
  function playMemoryV045(pi,index){
    const p=state.players[pi],c=p?.hand?.[index];if(!c)return false;
    if(!canControlPlayer(pi)){toast('That belongs to the other player.');return false;}
    if(!phaseActionAllowed(pi,'playMemory',c)){toast(phaseLockMessage('playMemory'));return false;}
    if(c.type==='Echo'&&(p.echoes[c.color]?.length||0)>=GAME_DATA.echoPerColorLimit){toast(`${c.color} Echo limit is ${GAME_DATA.echoPerColorLimit}.`);return false;}
    if((c.type==='Guardian'||c.type==='Relic')&&(p.zones[c.type]?.length||0)>=GAME_DATA.fieldLimits[c.type]){toast(`${c.type} limit is ${GAME_DATA.fieldLimits[c.type]}.`);return false;}
    const cost=effectiveCostV045(p,c),available=availableV045(p);if(available<cost){toast(`Need ${cost} Glamour; ${available} available including floating Glamour.`);return false;}
    snapshot();payV045(p,cost);p.hand.splice(index,1);
    if(c.type==='Echo')p.echoes[c.color].push(c);else if(c.type==='Instinct')p.discard.push(c);else p.zones[c.type].push(c);
    state.metrics.cardsPlayed[p.key][c.name]=(state.metrics.cardsPlayed[p.key][c.name]||0)+1;
    addLog(`${p.name} played ${c.name}${c.type==='Echo'?` into ${c.color} Echos`:c.type==='Instinct'?' as an Instinct':` into ${c.type}s`} for ${cost} Glamour.`,pi);
    if(c.type!=='Instinct')applyStaticBuffsForCard(p,c);
    resolveManifest(pi,c);resolveManifestReacts(pi,c);
    const v=vstate(p);if(c.type==='Relic'){
      if(v.nextRelicDiscount>0)v.nextRelicDiscount=Math.max(0,v.nextRelicDiscount-1);
      if(v.firstRelicTrigger&&!v.turnFlags.firstRelicTriggerPaid){v.turnFlags.firstRelicTriggerPaid=true;addTruth(pi,3,'Glamour Relic trigger');}
      v.turnFlags.firstRelicPlayed=true;
    }
