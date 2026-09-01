    if(c.stage==='declare'&&c.attackers.length){c.stage='block';beginAttackTriggers();addLog('Attackers locked. Defender may declare blockers.',state.active);saveAndRender();flashPhaseConsole();return;}
    if(c.stage==='declare'&&!c.attackers.length){recoverAfterCombat();state.phase=4;addLog(`Phase: ${GAME_DATA.phases[4]}.`,state.active);saveAndRender();flashPhaseConsole();return;}
    if(c.stage==='block'){resolveCombatV044();state.phase=4;addLog(`Phase: ${GAME_DATA.phases[4]}.`,state.active);saveAndRender();flashPhaseConsole();return;}
  };

  // Awakening: apply passive stat buffs and Awaken effects as cards actually manifest.
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

  // More visible trigger cards.
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
