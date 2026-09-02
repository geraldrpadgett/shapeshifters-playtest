(function(){
  'use strict';
  if(typeof GAME_DATA!=='undefined')GAME_DATA.version='0.5.3-fantasy-tabletop';
  const apply=()=>{
    document.documentElement.classList.add('fantasy-theme-v053');
    if(document.body)document.body.classList.add('fantasy-theme-v053');
  };
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  console.info('Shapeshifters v0.5.3 fantasy tabletop theme active');
})();
