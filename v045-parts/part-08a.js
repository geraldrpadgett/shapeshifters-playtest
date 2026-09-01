    syncConditionalShifterPassives(p);closeDialog('cardDialog');saveAndRender();return true;
  }
  function discardHandV045(pi,index){
    const p=state.players[pi],c=p?.hand?.[index];if(!c)return false;
    const v=vstate(p),forced=v.discardDebt>0;
    if(!canControlPlayer(pi)){toast('That belongs to the other player.');return false;}
    if(!forced&&!phaseActionAllowed(pi,'discardMemory')){toast(phaseLockMessage('discardMemory'));return false;}
    snapshot();p.hand.splice(index,1);p.discard.push(c);if(forced)v.discardDebt=Math.max(0,v.discardDebt-1);addLog(`${p.name} discarded ${c.name}.`,pi);closeDialog('cardDialog');saveAndRender();return true;
  }
  function discardInfluenceV045(ctx){
    if(!ctx||!canControlPlayer(ctx.pi))return false;const p=state.players[ctx.pi];let c=null;
    if(ctx.kind==='echo'){c=p.echoes?.[ctx.color]?.[ctx.i];if(!c)return false;snapshot();removeStaticBuffsForCard(p,c);p.echoes[ctx.color].splice(ctx.i,1);p.discard.push(c);addLog(`${p.name} moved ${c.name} from ${ctx.color} Echos to discard.`,ctx.pi);}
    else if(ctx.kind==='zone'){c=p.zones?.[ctx.type]?.[ctx.i];if(!c)return false;snapshot();removeStaticBuffsForCard(p,c);p.zones[ctx.type].splice(ctx.i,1);p.discard.push(c);addLog(`${p.name} moved ${c.name} from ${ctx.type}s to discard.`,ctx.pi);}
    else return false;
    syncConditionalShifterPassives(p);closeDialog('cardDialog');saveAndRender();return true;
  }
  function flipV045(pi,toFaceDown){
    if(!canControlPlayer(pi)){toast('That belongs to the other player.');return false;}snapshot();const p=state.players[pi];
    if(toFaceDown){if(!p.flipped){p.flipped=true;p.reverted=false;state.metrics.reversions[p.key]++;addLog(`${p.name} Reverted.`,pi);}}
    else{p.flipped=false;p.reverted=false;p.damage=0;addLog(`${p.name} recovered.`,pi);}
    saveAndRender();return true;
  }
  function resolveAwakeningChoiceV045(replaceIndex=null){
    const pending=state?.pendingAwakening;if(!pending)return;const p=state.players[pending.pi],a=pending.card;if(!Array.isArray(p.awakeningDiscard))p.awakeningDiscard=[];snapshot();
    if(Number.isInteger(replaceIndex)&&replaceIndex>=0&&replaceIndex<p.awakeningField.length){const old=p.awakeningField[replaceIndex];removeStaticBuffsForCard(p,old);p.awakeningField[replaceIndex]=a;p.awakeningDiscard.push(old);state.metrics.awakeningsPlayed[p.key]++;resolveAwakenEnter(pending.pi,a);addLog(`${p.name} replaced ${old.name} with ${a.name}.`,pending.pi);toast(`${a.name} replaced ${old.name}.`);}
