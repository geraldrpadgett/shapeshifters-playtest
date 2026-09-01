(function(){
  'use strict';

  GAME_DATA.version='0.4.9-combat-polish';

  const escape049=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function playerIndexFromBoard(board){
    const deck=board?.querySelector('[data-board-deck^="memory|"]');
    return deck?Number((deck.dataset.boardDeck||'').split('|')[1]):null;
  }

  function decorateFloatingGlamour049(){
    if(!window.state?.players)return;
    document.querySelectorAll('.glamour-lane').forEach(lane=>{
      const board=lane.closest('.player-board'),pi=playerIndexFromBoard(board);if(pi===null||!state.players[pi])return;
      const p=state.players[pi],floating=Math.max(0,Number(p.v044?.floatingGlamour)||0);
      let badge=lane.querySelector('.floating-glamour-v049');
      if(!badge){badge=document.createElement('div');badge.className='floating-glamour-v049';const head=lane.querySelector('.lane-head');(head||lane).appendChild(badge);}
      badge.textContent=`FLOATING ${floating}`;
      badge.classList.toggle('has-value',floating>0);
      badge.title='Unused Glamour from overpayment. Spend it later this turn; it clears at end of turn.';
    });
  }

  function decorateShifterButtons049(){
    document.querySelectorAll('[data-revert]').forEach(el=>el.remove());
    document.querySelectorAll('[data-shifter-flip]').forEach(btn=>{
      const [,target]=(btn.dataset.shifterFlip||'').split('|');
      const faceUp=target==='true';
      btn.textContent=faceUp?'REVERT':'RECOVER';
      btn.setAttribute('aria-label',faceUp?'Revert Shifter':'Recover Shifter');
    });
  }

  function decorateTriggerAttention049(){
    const combat=state?.phase===3?state.combat:null;
    document.querySelectorAll('.has-react,.has-manifest').forEach(card=>{
      card.classList.remove('trigger-live-v049');
      if(!combat)return;
      const text=(card.textContent||'').replace(/\s+/g,' ');
      const attackLive=combat.stage==='declare'&&/\b(?:when|whenever|first time)\b[^.]{0,90}\battack/i.test(text);
      const blockLive=combat.stage==='block'&&/\b(?:when|whenever|first time)\b[^.]{0,90}\bblock/i.test(text);
      if(attackLive||blockLive)card.classList.add('trigger-live-v049');
    });
  }

  function inspectDiscard049(pi,index){
    const c=state?.players?.[pi]?.discard?.[index];if(!c)return;
    const eyebrow=document.getElementById('cardDialogEyebrow'),title=document.getElementById('cardDialogTitle'),body=document.getElementById('cardDialogBody');
    if(!body)return;
    if(eyebrow)eyebrow.textContent='DISCARD';
    if(title)title.textContent=c.name||'Discarded Memory';
    body.innerHTML=cardDetail(c);
    openDialog('cardDialog');
  }

  function openDiscard049(pi){
    const p=state?.players?.[pi],dialog=document.getElementById('discardDialog'),title=document.getElementById('discardDialogTitle'),cards=document.getElementById('discardDialogCards');
    if(!p||!dialog||!cards)return;
    if(title)title.textContent=`${p.name} Memory Discard · ${p.discard.length}`;
    cards.innerHTML=p.discard.length?p.discard.map((c,i)=>`<button type="button" class="discard-card-v049" data-v049-discard-card="${pi}|${i}" aria-label="Inspect ${escape049(c.name||'discarded card')}">${cardMarkup(c,true)}</button>`).join(''):'<div class="empty-zone-v049">No Memory cards have been discarded.</div>';
    cards.querySelectorAll('[data-v049-discard-card]').forEach(btn=>btn.addEventListener('click',()=>{const [owner,idx]=btn.dataset.v049DiscardCard.split('|');closeDialog('discardDialog');inspectDiscard049(+owner,+idx);}));
    openDialog('discardDialog');
  }

  if(typeof window.openDiscardDialog==='function'||typeof openDiscardDialog!=='undefined'){
    try{openDiscardDialog=openDiscard049;}catch(_e){}
    window.openDiscardDialog=openDiscard049;
  }

  const detail049=cardDetail;
  cardDetail=function(c,extraActions='',tokenPanel=''){
    const html=detail049(c,extraActions,tokenPanel);
    if(c?.type!=='Glamour')return html;
    const number=c.number?`Card #${c.number}`:'Glamour card';
    return `<div class="glamour-inspect-meta-v049"><strong>${escape049(number)}</strong><span>${Number(c.value??c.cost)||0} Glamour</span></div>${html}`;
  };
  window.cardDetail=cardDetail;

  function updateVersion049(){
    const subtitle=document.querySelector('.subtitle');
    if(subtitle)subtitle.textContent=subtitle.textContent.replace(/v0\.4\.[0-9][^·]*/i,'v0.4.9 Combat + Trigger Polish');
  }

  let decorating=false,queued=false;
  function decorate049(){
    if(decorating)return;decorating=true;
    try{decorateFloatingGlamour049();decorateShifterButtons049();decorateTriggerAttention049();updateVersion049();}
    finally{decorating=false;}
  }
  function queue049(){if(queued)return;queued=true;setTimeout(()=>{queued=false;decorate049();},0);}

  const render049=window.render;
  if(typeof render049==='function'){
    render=function(){const result=render049.apply(this,arguments);queue049();return result;};
    window.render=render;
  }
  new MutationObserver(queue049).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  new MutationObserver(queue049).observe(document.getElementById('cardDialog')||document.body,{childList:true,subtree:true});
  queue049();

  console.info('Shapeshifters v0.4.9 combat and tabletop polish active');
})();
