(function(){
  'use strict';
  function influence(p){return [...Object.values(p?.echoes||{}).flat(),...(p?.zones?.Guardian||[]),...(p?.zones?.Relic||[]),...(p?.awakeningField||[])];}
  function keyFor(c){if(c?.type==='Relic')return 'relic';if(c?.type==='Guardian')return 'guardian';if(c?.type==='Echo'&&c?.color==='Green')return 'vigorEcho';return null;}
  function patternFor(key){return key==='relic'?/The first Relic you play each turn costs 1 less Glamour/i:key==='guardian'?/The first Guardian you play each turn costs 1 less Glamour/i:key==='vigorEcho'?/The first Vigor Echo you play each turn costs 1 less Glamour/i:null;}
  function breakdown(p,c){
    const base=Math.max(0,Number(c?.cost)||0),v=p?.v044||{},flags=v.turnFlags||{},key=keyFor(c),pat=patternFor(key);
    let first=0;if(key&&pat&&!(flags.costFirstUsed||{})[key])first=influence(p).filter(src=>pat.test(src?.text||'')).length;
    const next=c?.type==='Relic'?Math.max(0,Number(v.nextRelicDiscount)||0):0,total=first+next;
    return {base,first,next,total,cost:Math.max(0,base-total)};
  }
  function decorate(){
    if(!window.state?.players)return;
    document.querySelectorAll('[data-hand-card]').forEach(w=>{
      const [piRaw,iRaw]=(w.dataset.handCard||'').split('|'),pi=+piRaw,i=+iRaw,p=state.players[pi],c=p?.hand?.[i];if(!p||!c)return;
      const b=breakdown(p,c),el=w.querySelector('.cost');if(!el)return;
      if(b.total>0&&b.cost<b.base){el.innerHTML='<span class="cost-original-v048">'+b.base+'</span>'+b.cost;el.title=b.base+' Glamour − '+b.total+' = '+b.cost;w.classList.add('cost-reduced-v048');}
      else{el.textContent=c.cost;el.removeAttribute('title');w.classList.remove('cost-reduced-v048');}
    });
    const ctx=window.activeCardContext,btn=document.getElementById('detailPlay');
    if(btn&&ctx?.kind==='hand'){
      const p=state.players[ctx.pi],c=p?.hand?.[ctx.i];if(p&&c){const b=breakdown(p,c);btn.textContent='Play · '+b.cost+' Glamour'+(b.total?' (−'+b.total+')':'');btn.title=b.total?'Base '+b.base+' Glamour; '+b.total+' cost reduction active.':'';}
    }
  }
  let queued=false;function queue(){if(queued)return;queued=true;setTimeout(()=>{queued=false;decorate();},0);}
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(){const r=oldRender.apply(this,arguments);queue();return r;};
  const oldOpen=window.openHandCard;if(typeof oldOpen==='function')window.openHandCard=function(){const r=oldOpen.apply(this,arguments);queue();return r;};
  new MutationObserver(queue).observe(document.getElementById('cardDialog')||document.body,{childList:true,subtree:true});
  queue();
})();
