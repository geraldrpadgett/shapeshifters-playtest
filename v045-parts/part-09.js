      (p.glamourField||[]).forEach(g=>{if(/\bManifest\b/i.test(g?.text||'')&&!g._v044ManifestResolved){resolveManifest(pi,g);changed=true;}});
      allInfluence(p).forEach(c=>{if(c&&!c._v044StaticApplied&&parseStaticShifterBuffs(c).length){applyStaticBuffsForCard(p,c);changed=true;}});
      syncConditionalShifterPassives(p);
    });
    return changed;
  }
  function sanitizeCardDialogV045(){
    document.querySelectorAll('#cardDialog [data-effect-action]').forEach(btn=>{const t=(btn.textContent||'').trim();if(/^Declare (Attacker|Blocker)$/i.test(t))btn.remove();});
    const ctx=typeof activeCardContext!=='undefined'?activeCardContext:null;if(ctx?.kind==='hand'&&state?.players?.[ctx.pi]&&vstate(state.players[ctx.pi]).discardDebt>0){const b=document.getElementById('detailDiscard');if(b){b.disabled=false;b.textContent=`Discard · ${vstate(state.players[ctx.pi]).discardDebt} required`;}}
  }
  function decorateV045(){
    if(v045Decorating)return;v045Decorating=true;
    try{
      const changed=reconcileV045();reflowV044();decorateRevertButtons();decorateCombat();decorateNextButton();updateSubtitle();sanitizeCardDialogV045();
      document.querySelectorAll('.glamour-lane').forEach(lane=>{const board=lane.closest('.player-board'),deck=board?.querySelector('[data-board-deck^="memory|"]');if(!deck)return;const pi=+(deck.dataset.boardDeck.split('|')[1]);const p=state.players[pi],f=vstate(p).floatingGlamour||0,head=lane.querySelector('.lane-head b');if(head)head.textContent=`${availableV045(p)} available${f?` · ${f} floating`:''}`;});
      if(state?.phase===3){const c=ensureCombatState(),next=document.getElementById('nextPhaseBtn');if(next&&c.stage==='block'&&canControlPlayer(1-state.active))next.disabled=false;const hint=document.getElementById('phaseHint');if(hint)hint.textContent=c.stage==='declare'?'Select your Shifter and/or Guardians. All attackers target the opposing Shifter.':'Defender assigns Guardian blockers. Unblocked attackers hit the Shifter; tap Resolve Combat when blocking is finished.';}
      if(changed&&!v045ReconcileRender){v045ReconcileRender=true;setTimeout(()=>{v045ReconcileRender=false;saveAndRender();},0);}
    }finally{v045Decorating=false;}
  }
  let v045DecorateQueued=false,rootObserverV045=null,dialogObserverV045=null;
  const rootV045=document.getElementById('gameRoot'),dialogV045=document.getElementById('cardDialog');
  function observeV045(){
    if(rootV045){if(!rootObserverV045)rootObserverV045=new MutationObserver(queueDecorateV045);rootObserverV045.observe(rootV045,{childList:true,subtree:true});}
    if(dialogV045){if(!dialogObserverV045)dialogObserverV045=new MutationObserver(queueDecorateV045);dialogObserverV045.observe(dialogV045,{childList:true,subtree:true});}
  }
  function queueDecorateV045(){if(v045DecorateQueued)return;v045DecorateQueued=true;setTimeout(()=>{v045DecorateQueued=false;rootObserverV045?.disconnect();dialogObserverV045?.disconnect();decorateV045();observeV045();},0);}
  observeV045();

  document.addEventListener('click',function(e){
    const next=e.target.closest?.('#nextPhaseBtn');if(next&&state?.phase===3){e.preventDefault();e.stopImmediatePropagation();handleAttackAdvanceV045();return;}
    const flip=e.target.closest?.('[data-shifter-flip]');if(flip){e.preventDefault();e.stopImmediatePropagation();const [pi,v]=flip.dataset.shifterFlip.split('|');flipV045(+pi,v==='true');return;}
    const play=e.target.closest?.('#detailPlay');if(play&&!play.disabled&&typeof activeCardContext!=='undefined'&&activeCardContext?.kind==='hand'){e.preventDefault();e.stopImmediatePropagation();playMemoryV045(activeCardContext.pi,activeCardContext.i);return;}
    const handDiscard=e.target.closest?.('#detailDiscard');if(handDiscard&&typeof activeCardContext!=='undefined'&&activeCardContext?.kind==='hand'){e.preventDefault();e.stopImmediatePropagation();discardHandV045(activeCardContext.pi,activeCardContext.i);return;}
    const move=e.target.closest?.('#cardDialog [data-effect-action]');if(move&&/^Move to discard$/i.test((move.textContent||'').trim())&&typeof activeCardContext!=='undefined'){e.preventDefault();e.stopImmediatePropagation();discardInfluenceV045(activeCardContext);return;}
    const keep=e.target.closest?.('#keepCurrentAwakenings');if(keep&&state?.pendingAwakening){e.preventDefault();e.stopImmediatePropagation();resolveAwakeningChoiceV045(null);return;}
    const replace=e.target.closest?.('[data-awaken-replace]');if(replace&&state?.pendingAwakening){e.preventDefault();e.stopImmediatePropagation();resolveAwakeningChoiceV045(+replace.dataset.awakenReplace);return;}
  },true);

  queueDecorateV045();

  ensureState();renderRules();render();queueDecorateV045();
})();
