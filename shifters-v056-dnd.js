(function(){
  'use strict';
  if(typeof GAME_DATA!=='undefined')GAME_DATA.version='0.5.6-dnd-tabletop';

  function apply056(){
    document.documentElement.classList.add('dnd-theme-v056');
    document.body?.classList.add('dnd-theme-v056');
    document.querySelectorAll('.player-board').forEach((board,i)=>{
      const key=state?.players?.[i]?.key||'';
      board.classList.toggle('v056-fox',key==='fox');
      board.classList.toggle('v056-snake',key==='snake');
      const stamp=board.querySelector('.v055-theme-stamp');
      if(stamp)stamp.textContent=key==='fox'?'FOX · EMBER COURT':key==='snake'?'SNAKE · COILED COURT':'SHIFTER';
    });
  }

  let queued=false;
  function queue056(){
    if(queued)return;queued=true;
    setTimeout(()=>{queued=false;apply056();},0);
  }

  apply056();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply056,{once:true});
  new MutationObserver(queue056).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  console.info('Shapeshifters v0.5.6 D&D tabletop theme active');
})();
