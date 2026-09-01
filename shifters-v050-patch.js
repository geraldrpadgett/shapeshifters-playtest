(function(){
  'use strict';

  GAME_DATA.version='0.5.0-recover-combat';

  function recoverActiveBeforeCombat050(){
    if(typeof state==='undefined'||!state?.players?.[state.active])return false;
    const pi=state.active,p=state.players[pi],changed=!!(p.flipped||p.reverted||p.damage);
    p.flipped=false;p.reverted=false;p.damage=0;
    if(changed)addLog(`${p.name} recovered before combat.`,pi);
    return changed;
  }
  window.recoverActiveBeforeCombat050=recoverActiveBeforeCombat050;

  const nextBefore050=nextPhase;
  nextPhase=function(){
    const before=state?.phase;
    const result=nextBefore050.apply(this,arguments);
    if(before!==3&&state?.phase===3){
      recoverActiveBeforeCombat050();
      if(typeof saveAndRender==='function')saveAndRender();
      if(typeof flashPhaseConsole==='function')flashPhaseConsole();
    }
    return result;
  };
  window.nextPhase=nextPhase;

  const instructionBefore050=phaseInstruction;
  phaseInstruction=function(){
    const text=instructionBefore050();
    if(state?.phase===3)return `Recover happens first: your active Shifter is face-up with damage cleared before combat. ${text}`;
    return text;
  };
  window.phaseInstruction=phaseInstruction;

  const rulesBefore050=renderRules;
  renderRules=function(){
    rulesBefore050();
    const root=document.getElementById('rulesCopy');if(!root)return;
    root.querySelectorAll('.rule-card').forEach(card=>{
      const heading=card.querySelector('h4')?.textContent.trim(),p=card.querySelector('p');if(!p)return;
      if(heading==='Combat')p.innerHTML='Recover your active Shifter <strong>before Combat</strong>. In combat, every engaged attacker and defender exchange damage simultaneously: <strong>Power + Strength</strong> is offense, while <strong>Guard + Vitality</strong> is what must be overcome to make a Shifter Revert or a Guardian leave play. An unblocked attacker still fights the defending Shifter, so either or both can fall. <strong>Direct damage ignores Guard</strong> and is applied straight to Vitality.';
    });
  };
  window.renderRules=renderRules;

  function decorateCardSpacing050(){
    document.querySelectorAll('.card').forEach(card=>{
      const badges=card.querySelector('.trigger-badges');
      card.classList.toggle('has-trigger-badges-v050',!!badges&&badges.children.length>0);
    });
  }
  let queued=false;
  function queue050(){if(queued)return;queued=true;setTimeout(()=>{queued=false;decorateCardSpacing050();},0);}
  const renderBefore050=window.render;
  if(typeof renderBefore050==='function'){
    render=function(){const result=renderBefore050.apply(this,arguments);queue050();return result;};
    window.render=render;
  }
  new MutationObserver(queue050).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  queue050();

  console.info('Shapeshifters v0.5.0 recover-before-combat and simultaneous exchange rules active');
})();
