(function(){
  'use strict';

  GAME_DATA.version='0.5.2-shifter-glamour-cap';
  GAME_DATA.maxGlamours=9;

  const esc052=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function ensureGlamourState052(){
    let changed=false;
    (state?.players||[]).forEach((p,pi)=>{
      if(!Array.isArray(p.glamourDiscard)){p.glamourDiscard=[];changed=true;}
      if((p.glamourField||[]).length>GAME_DATA.maxGlamours){
        const extras=p.glamourField.splice(GAME_DATA.maxGlamours);
        p.glamourDiscard.push(...extras);changed=true;
        if(typeof addLog==='function')addLog(`${p.name} had ${extras.length} legacy Glamour above the 9-card limit; the extras were set aside.`,pi);
      }
    });
    return changed;
  }

  function ensureGlamourChoiceDialog052(){
    let d=document.getElementById('glamourChoiceDialog');if(d)return d;
    d=document.createElement('dialog');d.id='glamourChoiceDialog';d.className='glamour-choice-v052';
    d.innerHTML='<div class="glamour-choice-shell-v052"><div class="glamour-choice-head-v052"><span>GLAMOUR LIMIT</span><strong>Choose your manifested nine</strong></div><div id="glamourChoiceBody052"></div></div>';
    d.addEventListener('cancel',e=>e.preventDefault());
    d.addEventListener('click',e=>{
      const keep=e.target.closest?.('[data-glamour-keep-v052]');if(keep){e.preventDefault();window.resolveGlamourChoice052?.(null);return;}
      const replace=e.target.closest?.('[data-glamour-replace-v052]');if(replace){e.preventDefault();window.resolveGlamourChoice052?.(+replace.dataset.glamourReplaceV052);}
    });
    document.body.appendChild(d);return d;
  }

  function glamourChoiceCard052(g,label){
    return `<div class="glamour-choice-card-v052"><small>${esc052(label)}</small><strong>#${esc052(g?.number||'—')} · ${esc052(g?.name||`Glamour ${g?.value??''}`)}</strong><span>${esc052(g?.value??0)} Glamour${g?.tapped?' · tapped':''}</span><p>${esc052(g?.text||'')}</p></div>`;
  }

  function openGlamourChoice052(){
    const pending=state?.pendingGlamour;if(!pending)return false;const p=state.players?.[pending.pi];if(!p)return false;
    const d=ensureGlamourChoiceDialog052(),body=d.querySelector('#glamourChoiceBody052');
    body.innerHTML=`${glamourChoiceCard052(pending.card,'REVEALED 10TH+ GLAMOUR')}<p class="glamour-choice-copy-v052">You may keep your current nine Glamour and set the revealed card aside, or replace exactly one manifested Glamour. The revealed card only Manifests if it enters the field.</p><button class="button ghost glamour-keep-v052" data-glamour-keep-v052>Keep current 9 · set revealed card aside</button><div class="glamour-choice-grid-v052">${(p.glamourField||[]).map((g,i)=>`<button class="glamour-replace-v052" data-glamour-replace-v052="${i}">${glamourChoiceCard052(g,`REPLACE SLOT ${i+1}`)}</button>`).join('')}</div>`;
    if(!d.open)d.showModal();return true;
  }
  window.openGlamourChoice052=openGlamourChoice052;

  const issueBefore052=phaseCompletionIssue;
  phaseCompletionIssue=function(){if(state?.pendingGlamour)return 'Choose whether to keep your current nine Glamour or replace one before continuing.';return issueBefore052();};
  window.phaseCompletionIssue=phaseCompletionIssue;

  const rulesBefore052=renderRules;
  renderRules=function(){
    rulesBefore052();const root=document.getElementById('rulesCopy');if(!root)return;
    root.querySelectorAll('.rule-card').forEach(card=>{
      const h=card.querySelector('h4')?.textContent.trim(),p=card.querySelector('p');if(!p)return;
      if(h==='Combat')p.innerHTML='Shifter damage <strong>does not accumulate</strong>. Each damage event is checked separately against that Shifter’s Guard and Vitality; separate nonlethal hits never add together to cause a Revert. Combat still uses <strong>Power + Strength</strong> for offense, and direct damage is reduced by <strong>Guard</strong> before checking Vitality.';
      if(h==='Glamour')p.innerHTML='Each Shifter has an <strong>18-card Glamour deck</strong> but may have only <strong>9 Glamour manifested</strong> at once. Glamour 1–9 manifest normally. Beginning with the 10th reveal, choose to keep the current nine and set the new card aside, or replace one of the nine. A revealed card does not resolve its Manifest text unless it actually enters the field.';
    });
  };
  window.renderRules=renderRules;

  function decorateGlamourLimit052(){
    if(!state?.players)return;
    document.querySelectorAll('.glamour-lane').forEach((lane,index)=>{
      const p=state.players[index];if(!p)return;let note=lane.querySelector('.glamour-limit-note-v052');if(!note){note=document.createElement('span');note.className='glamour-limit-note-v052';const head=lane.querySelector('.lane-head');if(head)head.appendChild(note);else lane.prepend(note);}note.textContent=`${Math.min(p.glamourField?.length||0,GAME_DATA.maxGlamours)}/${GAME_DATA.maxGlamours} manifested`;
    });
    if(state.pendingGlamour)openGlamourChoice052();
  }

  let queued052=false;
  function queue052(){if(queued052)return;queued052=true;setTimeout(()=>{queued052=false;decorateGlamourLimit052();},0);}
  new MutationObserver(queue052).observe(document.body,{childList:true,subtree:true});

  const normalized=ensureGlamourState052();
  try{renderRules();}catch(_e){}
  if(normalized&&typeof saveAndRender==='function')setTimeout(()=>saveAndRender(),0);else queue052();
  console.info('Shapeshifters v0.5.2 non-accumulating Shifter damage and nine-Glamour cap active');
})();
