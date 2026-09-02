(function(){
  'use strict';
  if(typeof GAME_DATA!=='undefined')GAME_DATA.version='0.5.5-prismatic-tabletop';

  const colorClass=/\b(Red|Orange|Yellow|Green|Blue|Purple)\b/i;
  function tagBoard(pi){
    const board=document.querySelector(`[data-board-deck="memory|${pi}"]`)?.closest('.player-board');
    if(!board)return;
    const key=state?.players?.[pi]?.key||'';
    board.classList.toggle('v055-fox',key==='fox');
    board.classList.toggle('v055-snake',key==='snake');
    if(!board.querySelector('.v055-theme-stamp')){
      const stamp=document.createElement('div');stamp.className='v055-theme-stamp';stamp.textContent=key==='fox'?'FOX · EMBER GLAMOUR':key==='snake'?'SNAKE · COILED GLAMOUR':'SHIFTER';board.appendChild(stamp);
    }else{
      const stamp=board.querySelector('.v055-theme-stamp');stamp.textContent=key==='fox'?'FOX · EMBER GLAMOUR':key==='snake'?'SNAKE · COILED GLAMOUR':'SHIFTER';
    }
  }
  function tagCards(){
    document.querySelectorAll('.card').forEach(card=>{
      card.classList.remove('v055-red','v055-orange','v055-yellow','v055-green','v055-blue','v055-purple');
      const type=card.querySelector('.card-type')?.textContent||'';const m=type.match(colorClass);if(m)card.classList.add(`v055-${m[1].toLowerCase()}`);
    });
  }
  function apply(){
    document.documentElement.classList.add('prismatic-theme-v055');
    document.body?.classList.add('prismatic-theme-v055');
    if(typeof state!=='undefined'&&state?.players){tagBoard(0);tagBoard(1);}tagCards();
  }
  let queued=false;function queue(){if(queued)return;queued=true;setTimeout(()=>{queued=false;apply();},0);}
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  new MutationObserver(queue).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  console.info('Shapeshifters v0.5.5 prismatic tabletop theme active');
})();
