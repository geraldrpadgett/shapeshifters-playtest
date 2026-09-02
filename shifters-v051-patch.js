(function(){
  'use strict';

  GAME_DATA.version='0.5.1-automation-polish';
  const manifestPattern051=/(?:^|[.!?]\s*)Manifest\s*[—-]/i;

  function memoryLocations051(p){
    if(!p)return [];
    return [
      ...(p.memoryDeck||[]),...(p.hand||[]),...(p.discard||[]),
      ...Object.values(p.echoes||{}).flat(),...(p.zones?.Guardian||[]),...(p.zones?.Relic||[])
    ];
  }
  function fixCard32List051(cards){let changed=false;(cards||[]).forEach(c=>{if(Number(c?.number)===32&&Number(c.cost)!==1){c.cost=1;changed=true;}});return changed;}
  function fixCurrentCard32s051(){let changed=false;(state?.players||[]).forEach(p=>{if(fixCard32List051(memoryLocations051(p)))changed=true;});return changed;}

  if(typeof buildMemoryDeck==='function'){
    const buildMemoryBefore051=buildMemoryDeck;
    buildMemoryDeck=function(key){const deck=buildMemoryBefore051.apply(this,arguments);fixCard32List051(deck);return deck;};
    window.buildMemoryDeck=buildMemoryDeck;
  }

  function addTempShifter051(pi,stat,n,bucket,source){
    const p=state?.players?.[pi];if(!p||!n)return;
    p.stats[stat]=(p.stats[stat]||0)+n;
    if(!p.tempMods)p.tempMods={};
    if(!p.tempMods[bucket])p.tempMods[bucket]={power:0,strength:0,guard:0,vitality:0};
    p.tempMods[bucket][stat]=(p.tempMods[bucket][stat]||0)+n;
    if(typeof addLog==='function')addLog(`${p.name} gets +${n} ${stat.charAt(0).toUpperCase()+stat.slice(1)}${bucket==='endCombat'?' for this combat':' until end of turn'}${source?` from ${source}`:''}.`,pi);
  }
  function addTruth051(pi,n,source){
    const p=state?.players?.[pi];if(!p||!n)return;
    p.renown=Math.max(0,(p.renown||0)+n);
    if(state?.metrics?.renownGained?.[p.key]!==undefined&&n>0)state.metrics.renownGained[p.key]+=n;
    if(state?.metrics?.renownLost?.[p.key]!==undefined&&n<0)state.metrics.renownLost[p.key]+=Math.abs(n);
    if(typeof addLog==='function')addLog(`${p.name} ${n>0?'gained':'lost'} ${Math.abs(n)} Truth${source?` from ${source}`:''}.`,pi);
    if(p.renown>=GAME_DATA.victoryRenown&&!state.winner)state.winner=p.key;
  }
  function drawMemory051(pi,n,source){
    const p=state?.players?.[pi];if(!p||typeof rawDrawMemory!=='function')return 0;let count=0;
    for(let i=0;i<n;i++){if(rawDrawMemory(p)){count++;if(state?.metrics?.memoryDraws?.[p.key]!==undefined)state.metrics.memoryDraws[p.key]++;}}
    if(count&&typeof addLog==='function')addLog(`${p.name} drew ${count} Memory card${count===1?'':'s'}${source?` from ${source}`:''}.`,pi);
    return count;
  }
  function markDiscard051(pi,n,source){
    const p=state?.players?.[pi];if(!p||!n)return;if(!p.v044)p.v044={};p.v044.discardDebt=(p.v044.discardDebt||0)+n;
    if(typeof addLog==='function')addLog(`${p.name} must discard ${n} Memory card${n===1?'':'s'}${source?` for ${source}`:''}.`,pi);
  }

  function resolveInstinct051(pi,c){
    if(!c||c.type!=='Instinct'||c._v051InstinctResolved)return false;
    c._v051InstinctResolved=true;const txt=String(c.text||''),p=state?.players?.[pi];if(!p)return false;let m;

    m=txt.match(/Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality) (?:for this combat|this combat|until end of combat)/i);
    if(m)addTempShifter051(pi,m[2].toLowerCase(),+m[1],'endCombat',c.name);
    m=txt.match(/Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality) (?:this turn|until end of turn)/i);
    if(m)addTempShifter051(pi,m[2].toLowerCase(),+m[1],'endTurn',c.name);

    m=txt.match(/(?:^|[.!?]\s*)Deal (\d+) direct damage/i);
    if(m&&typeof window.directDamage051==='function')window.directDamage051(pi,+m[1],c.name);
    m=txt.match(/(?:^|[.!?]\s*)Gain (\d+) Truth/i);if(m)addTruth051(pi,+m[1],c.name);
    m=txt.match(/(?:^|[.!?]\s*)Draw (\d+) cards?/i);if(m){drawMemory051(pi,+m[1],c.name);const d=txt.match(/discard (\d+) cards?/i);if(d)markDiscard051(pi,+d[1],c.name);}
    if(/(?:^|[.!?]\s*)(?:Flip|Turn) 1 Glamour/i.test(txt)&&typeof autoTurnGlamour==='function')autoTurnGlamour(pi,{ready:true,source:c.name});

    m=txt.match(/choose a Guardian[^.]*?(?:it|that Guardian) gets \+(\d+) (Power|Strength|Guard|Vitality) (?:for this combat|this combat|until end of combat)/i);
    if(m&&p.zones?.Guardian?.length){const g=p.zones.Guardian[0];if(!g._v049CombatMods)g._v049CombatMods={};const stat=m[2].toLowerCase();g._v049CombatMods[stat]=(g._v049CombatMods[stat]||0)+(+m[1]);if(typeof addLog==='function')addLog(`${g.name} gets +${m[1]} ${m[2]} for this combat from ${c.name}.`,pi);}

    if(typeof addLog==='function')addLog(`${c.name} resolved automatically as an Instinct.`,pi);
    return true;
  }
  window.resolveInstinct051=resolveInstinct051;

  if(typeof playCard==='function'){
    const playBefore051=playCard;
    playCard=function(pi,index){
      const c=state?.players?.[pi]?.hand?.[index],p=state?.players?.[pi];
      if(c?.type==='Echo'&&(p?.flipped||p?.reverted)){if(typeof toast==='function')toast('Your Shifter must be face-up to receive an Echo.');return false;}
      const ok=playBefore051.apply(this,arguments);if(ok!==false&&c?.type==='Instinct')resolveInstinct051(pi,c);return ok;
    };
    window.playCard=playCard;
  }

  let autoAdvanceQueued051=false;
  function queueAutomaticOpening051(){
    if(autoAdvanceQueued051)return;autoAdvanceQueued051=true;
    setTimeout(()=>{autoAdvanceQueued051=false;automaticOpening051();},0);
  }
  function automaticOpening051(){
    if(typeof state==='undefined'||!state?.players||state.winner||state.pendingAwakening||typeof nextPhase!=='function')return;
    const pi=state.active,p=state.players[pi];if(!p)return;
    if(state.phase===0&&!p._v051AutoPhase0){p._v051AutoPhase0=true;nextPhase();return;}
    if(state.phase===1&&!p._v051AutoDraw){
      p._v051AutoDraw=true;
      const firstSkip=typeof isFirstPlayerFirstTurn==='function'&&isFirstPlayerFirstTurn();
      if(!firstSkip&&!p.flags?.memoryDrawn){drawMemory051(pi,1,'turn');if(!p.flags)p.flags={};p.flags.memoryDrawn=true;}
      nextPhase();
    }
  }

  if(typeof prepareTurnStart==='function'){
    const prepareBefore051=prepareTurnStart;
    prepareTurnStart=function(p,first){const r=prepareBefore051.apply(this,arguments);if(p){p._v051AutoPhase0=false;p._v051AutoDraw=false;}queueAutomaticOpening051();return r;};
    window.prepareTurnStart=prepareTurnStart;
  }

  function removeManualShifterControls051(){
    document.querySelectorAll('[data-shifter-flip],[data-revert]').forEach(el=>el.remove());
  }
  function reorderInfluence051(){
    document.querySelectorAll('.area-influence-v044 .support-row').forEach(row=>{
      const zones=[...row.children].filter(el=>el.classList?.contains('table-zone')||/GUARDIAN|RELIC/i.test(el.textContent||''));
      const relic=zones.find(el=>/\bRELICS?\b/i.test(el.textContent||'')),guardian=zones.find(el=>/\bGUARDIANS?\b/i.test(el.textContent||''));
      if(relic&&guardian){row.appendChild(relic);row.appendChild(guardian);}
    });
  }
  function contextCard051(){
    if(typeof activeCardContext==='undefined'||!activeCardContext||!state?.players)return null;const ctx=activeCardContext,p=state.players[ctx.pi];if(!p)return null;
    if(ctx.kind==='hand')return p.hand?.[ctx.i]||null;if(ctx.kind==='echo')return p.echoes?.[ctx.color]?.[ctx.i]||null;if(ctx.kind==='zone')return p.zones?.[ctx.type]?.[ctx.i]||null;return null;
  }
  function removeManualTriggerButtons051(){
    const c=contextCard051();if(!c||(c.type!=='Instinct'&&!manifestPattern051.test(c.text||'')))return;
    document.querySelectorAll('#cardDialog [data-effect-action]').forEach(btn=>{const t=(btn.textContent||'').trim();if(!/^Move to discard$/i.test(t)&&!/^Declare (?:Attacker|Blocker)$/i.test(t))btn.remove();});
  }
  function decorateActiveHand051(){
    if(!state?.players)return;
    const dialog=[...document.querySelectorAll('dialog[open]')].find(d=>/ACTIVE HAND/i.test(d.textContent||'')||d.querySelector('[data-hand-card]'));if(!dialog)return;
    const p=state.players[state.active];if(!p)return;
    const available=typeof availableGlamour==='function'?availableGlamour(p):(p.glamourField||[]).filter(g=>!g.tapped).reduce((s,g)=>s+(g.value||0),0)+(p.v044?.floatingGlamour||0);
    const total=(p.glamourField||[]).reduce((s,g)=>s+(Number(g.value)||0),0);
    let badge=dialog.querySelector('.hand-glamour-summary-v051');if(!badge){badge=document.createElement('div');badge.className='hand-glamour-summary-v051';const head=dialog.querySelector('.modal-head');if(head)head.insertAdjacentElement('afterend',badge);else dialog.prepend(badge);}
    badge.textContent=`Glamour: ${available} available · ${total} total on field`;
  }
  function updateVersion051(){const s=document.querySelector('.subtitle');if(s)s.textContent=s.textContent.replace(/v0\.5\.0[^·]*/i,'v0.5.1 Automation + Guard Polish');}

  const rulesBefore051=renderRules;
  renderRules=function(){
    rulesBefore051();const root=document.getElementById('rulesCopy');if(!root)return;
    root.querySelectorAll('.rule-card').forEach(card=>{
      const h=card.querySelector('h4')?.textContent.trim(),p=card.querySelector('p');if(!p)return;
      if(h==='Combat')p.innerHTML='Your active Shifter <strong>Recovers automatically before Combat</strong>. Attackers and defenders exchange damage simultaneously: <strong>Power + Strength</strong> is offense, while <strong>Guard + Vitality</strong> determines survival. Direct damage is still reduced by <strong>Guard</strong>; only damage that gets past Guard reaches Vitality. A Shifter that reaches lethal damage Reverts automatically and stays face-down until its owner’s next Recover.';
      if(h==='Glamour')p.innerHTML='At the start of each turn, the top Glamour manifests automatically, then the Memory draw happens automatically and play advances to <strong>Cast</strong>. The first player still skips the Memory draw on the first turn. Manifest effects resolve once when their card is played or manifested.';
    });
  };
  window.renderRules=renderRules;

  let decorating051=false,queued051=false;
  function decorate051(){
    if(decorating051)return;decorating051=true;
    try{const fixed=fixCurrentCard32s051();removeManualShifterControls051();reorderInfluence051();removeManualTriggerButtons051();decorateActiveHand051();updateVersion051();queueAutomaticOpening051();if(fixed&&typeof saveAndRender==='function')setTimeout(()=>saveAndRender(),0);}
    finally{decorating051=false;}
  }
  function queue051(){if(queued051)return;queued051=true;setTimeout(()=>{queued051=false;decorate051();},0);}

  const renderBefore051=window.render;
  if(typeof renderBefore051==='function'){
    render=function(){const r=renderBefore051.apply(this,arguments);queue051();return r;};
    window.render=render;
  }
  new MutationObserver(queue051).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  new MutationObserver(queue051).observe(document.getElementById('cardDialog')||document.body,{childList:true,subtree:true});

  if(fixCurrentCard32s051()&&typeof saveAndRender==='function')setTimeout(()=>saveAndRender(),0);
  try{renderRules();}catch(_e){}
  queue051();
  console.info('Shapeshifters v0.5.1 automation, layout, cost, and Guard rules active');
})();
