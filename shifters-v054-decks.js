(function(){
  'use strict';

  GAME_DATA.version='0.5.4-app-beta-v02-decks';
  GAME_DATA.deckDataVersion='App Beta v0.2';
  GAME_DATA.memoryDeckSize=36;
  GAME_DATA.glamourDeckSize=18;
  GAME_DATA.awakeningDeckSize=18;

  const clone=x=>JSON.parse(JSON.stringify(x));
  const caps=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const expand=(key,prefix,specs)=>specs.flatMap(spec=>{
    const out=[];
    for(let number=spec.from;number<=spec.to;number++)out.push({...clone(spec.card),number,id:`${key}-${prefix}-${String(number).padStart(2,'0')}`});
    return out;
  });

  const memorySpecs={
    fox:[
      {from:1,to:2,card:{name:'Kindled Claws',type:'Echo',color:'Red',cost:3,text:'Your Shifter gets +1 Strength.'}},
      {from:3,to:3,card:{name:'Ninefold Fury',type:'Echo',color:'Red',cost:6,text:'Your Shifter gets +2 Strength.'}},
      {from:4,to:5,card:{name:'Pack Spirit',type:'Echo',color:'Orange',cost:2,text:'Your Shifter gets +1 Power.'}},
      {from:6,to:6,card:{name:'Heart of the Den',type:'Echo',color:'Orange',cost:4,text:'Your Shifter gets +1 Vitality.'}},
      {from:7,to:8,card:{name:'Quickstep',type:'Echo',color:'Yellow',cost:2,text:'Your Shifter gets +1 Guard.'}},
      {from:9,to:9,card:{name:'Flashing Tails',type:'Echo',color:'Yellow',cost:4,text:'Your Shifter gets +2 Guard.'}},
      {from:10,to:11,card:{name:'Toughened Hide',type:'Echo',color:'Green',cost:3,text:'Your Shifter gets +1 Vitality.'}},
      {from:12,to:12,card:{name:'Ancient Heart',type:'Echo',color:'Green',cost:6,text:'Your Shifter gets +2 Vitality.'}},
      {from:13,to:14,card:{name:'Cunning Focus',type:'Echo',color:'Blue',cost:2,text:'Your Shifter gets +1 Guard.'}},
      {from:15,to:15,card:{name:"Fox’s Insight",type:'Echo',color:'Blue',cost:2,text:'Your Shifter gets +1 Power.'}},
      {from:16,to:17,card:{name:'Foxfire Soul',type:'Echo',color:'Purple',cost:1,text:'Your Shifter gets +1 Power.'}},
      {from:18,to:18,card:{name:'Spirit Blaze',type:'Echo',color:'Purple',cost:3,text:'Your Shifter gets +2 Power.'}},
      {from:19,to:20,card:{name:'Ember Kit',type:'Guardian',color:'Orange',cost:1,strength:1,power:0,guard:0,vitality:1,text:'No additional effect.'}},
      {from:21,to:22,card:{name:'Den Guardian',type:'Guardian',color:'Orange',cost:2,strength:1,power:0,guard:1,vitality:2,text:'Manifest — Gain 3 Truth.'}},
      {from:23,to:24,card:{name:'Foxfire Spirit',type:'Guardian',color:'Purple',cost:2,strength:0,power:1,guard:0,vitality:1,text:'Manifest — Your Shifter gets +1 Power.'}},
      {from:25,to:26,card:{name:'Pack Champion',type:'Guardian',color:'Red',cost:5,strength:2,power:1,guard:1,vitality:2,text:'No additional effect.'}},
      {from:27,to:28,card:{name:'Foxfire Lantern',type:'Relic',color:'Blue',cost:2,text:'This Relic provides 1 Glamour.'}},
      {from:29,to:30,card:{name:'Ember Fan',type:'Relic',color:'Red',cost:2,text:'This Relic provides 1 Glamour.'}},
      {from:31,to:32,card:{name:'Trickster Mask',type:'Relic',color:'Purple',cost:3,text:'Manifest — Gain 3 Truth.'}},
      {from:33,to:34,card:{name:'Nine-Tail Charm',type:'Relic',color:'Purple',cost:4,text:'Your Shifter gets +1 Power.'}},
      {from:35,to:35,card:{name:'Sudden Pounce',type:'Instinct',color:'Red',cost:2,text:'React — When your Shifter attacks, it gets +2 Power for this Clash.'}},
      {from:36,to:36,card:{name:'Burning Bite',type:'Instinct',color:'Red',cost:3,text:'React — When your Shifter attacks, it gets +1 Strength for this Clash.'}}
    ],
    snake:[
      {from:1,to:2,card:{name:'Thickened Scales',type:'Echo',color:'Green',cost:3,text:'Your Shifter gets +1 Vitality.'}},
      {from:3,to:3,card:{name:'Immortal Coil',type:'Echo',color:'Green',cost:6,text:'Your Shifter gets +2 Vitality.'}},
      {from:4,to:5,card:{name:"Serpent’s Grace",type:'Echo',color:'Yellow',cost:2,text:'Your Shifter gets +1 Guard.'}},
      {from:6,to:6,card:{name:'Ninefold Ward',type:'Echo',color:'Yellow',cost:4,text:'Your Shifter gets +2 Guard.'}},
      {from:7,to:8,card:{name:'Ancient Memory',type:'Echo',color:'Blue',cost:2,text:'Manifest — Draw 2 cards, then discard 1.'}},
      {from:9,to:9,card:{name:'Relic Seer',type:'Echo',color:'Blue',cost:3,text:'Your Shifter gets +1 Power.'}},
      {from:10,to:11,card:{name:'Crushing Coil',type:'Echo',color:'Red',cost:3,text:'Your Shifter gets +1 Strength.'}},
      {from:12,to:12,card:{name:"Hydra’s Bite",type:'Echo',color:'Red',cost:6,text:'Your Shifter gets +2 Strength.'}},
      {from:13,to:14,card:{name:'Brood Bond',type:'Echo',color:'Orange',cost:2,text:'Your Shifter gets +1 Guard.'}},
      {from:15,to:15,card:{name:'Guardian Brood',type:'Echo',color:'Orange',cost:4,text:'Your Shifter gets +1 Vitality.'}},
      {from:16,to:17,card:{name:'Venomous Spirit',type:'Echo',color:'Purple',cost:1,text:'Your Shifter gets +1 Power.'}},
      {from:18,to:18,card:{name:'Ancient Essence',type:'Echo',color:'Purple',cost:3,text:'Your Shifter gets +2 Power.'}},
      {from:19,to:20,card:{name:'Emerald Adder',type:'Guardian',color:'Green',cost:1,strength:1,power:0,guard:0,vitality:1,text:'No additional effect.'}},
      {from:21,to:22,card:{name:'Coil Guardian',type:'Guardian',color:'Green',cost:2,strength:1,power:0,guard:1,vitality:2,text:'Manifest — Gain 3 Truth.'}},
      {from:23,to:24,card:{name:'Shrine Keeper',type:'Guardian',color:'Blue',cost:2,strength:0,power:1,guard:1,vitality:1,text:'Manifest — Draw 1 card, then discard 1.'}},
      {from:25,to:26,card:{name:'Ancient Hydra',type:'Guardian',color:'Green',cost:5,strength:2,power:0,guard:1,vitality:3,text:'No additional effect.'}},
      {from:27,to:28,card:{name:'Serpent Idol',type:'Relic',color:'Blue',cost:2,text:'This Relic provides 1 Glamour.'}},
      {from:29,to:30,card:{name:'Offering Basin',type:'Relic',color:'Blue',cost:2,text:'This Relic provides 1 Glamour.'}},
      {from:31,to:32,card:{name:'Altar of Renewal',type:'Relic',color:'Blue',cost:3,text:'Manifest — Gain 3 Truth.'}},
      {from:33,to:34,card:{name:'Tablet of Nine Heads',type:'Relic',color:'Blue',cost:4,text:'Your Shifter gets +1 Guard.'}},
      {from:35,to:35,card:{name:'Sudden Coil',type:'Instinct',color:'Green',cost:2,text:'React — When your Shifter is attacked, it gets +2 Guard for this Clash.'}},
      {from:36,to:36,card:{name:'Refuse to Die',type:'Instinct',color:'Green',cost:3,text:'React — When your Shifter is attacked, it gets +2 Vitality for this Clash.'}}
    ]
  };

  const glamourSpecs={
    fox:[
      {from:1,to:4,card:{name:'Foxfire Spark',value:1,text:'Manifest — Your Shifter gets +1 Power.'}},
      {from:5,to:8,card:{name:'Mirror Flame',value:2,text:'Manifest — Gain 3 Truth.'}},
      {from:9,to:11,card:{name:'Dancing Foxfire',value:3,text:'No additional effect.'}},
      {from:12,to:14,card:{name:'Ancestral Foxfire',value:4,text:'No additional effect.'}},
      {from:15,to:16,card:{name:'Spirit Blaze',value:5,text:'No additional effect.'}},
      {from:17,to:18,card:{name:'Nine-Tailed Flame',value:6,text:'No additional effect.'}}
    ],
    snake:[
      {from:1,to:4,card:{name:'Venom Spark',value:1,text:'Manifest — Your Shifter gets +1 Power.'}},
      {from:5,to:8,card:{name:'Coiled Light',value:2,text:'Manifest — Gain 3 Truth.'}},
      {from:9,to:11,card:{name:'Serpent Gleam',value:3,text:'No additional effect.'}},
      {from:12,to:14,card:{name:'Shed Radiance',value:4,text:'No additional effect.'}},
      {from:15,to:16,card:{name:'Hydra Glow',value:5,text:'No additional effect.'}},
      {from:17,to:18,card:{name:'Ancient Venom',value:6,text:'No additional effect.'}}
    ]
  };

  const awakeningSpecs={
    fox:[
      {from:1,to:2,card:{name:'Kindled Strength',text:'Your Shifter gets +1 Strength.'}},
      {from:3,to:5,card:{name:'Foxfire Within',text:'Your Shifter gets +1 Power.'}},
      {from:6,to:7,card:{name:"Predator’s Grace",text:'Your Shifter gets +1 Guard.'}},
      {from:8,to:8,card:{name:'Ninefold Heart',text:'Your Shifter gets +1 Vitality.'}},
      {from:9,to:10,card:{name:'Burning Pack',text:'Your Guardians get +1 Strength.'}},
      {from:11,to:13,card:{name:'Spirit Pack',text:'Your Guardians get +1 Power.'}},
      {from:14,to:15,card:{name:'Protect the Den',text:'Your Guardians get +1 Guard.'}},
      {from:16,to:16,card:{name:'Shared Vitality',text:'Your Guardians get +1 Vitality.'}},
      {from:17,to:17,card:{name:'Call of the Den',text:'Guardians cost 1 less Glamour to Cast.'}},
      {from:18,to:18,card:{name:'Stories of the Hunt',text:'Awaken — Gain 3 Truth.'}}
    ],
    snake:[
      {from:1,to:2,card:{name:'Endless Growth',text:'Your Shifter gets +1 Vitality.'}},
      {from:3,to:4,card:{name:'Coiling Defense',text:'Your Shifter gets +1 Guard.'}},
      {from:5,to:5,card:{name:'Ancient Muscle',text:'Your Shifter gets +1 Strength.'}},
      {from:6,to:8,card:{name:'Venomous Spirit',text:'Your Shifter gets +1 Power.'}},
      {from:9,to:10,card:{name:'Growing Brood',text:'Your Guardians get +1 Vitality.'}},
      {from:11,to:12,card:{name:'Coiled Brood',text:'Your Guardians get +1 Guard.'}},
      {from:13,to:13,card:{name:"Hydra’s Might",text:'Your Guardians get +1 Strength.'}},
      {from:14,to:16,card:{name:'Mystic Brood',text:'Your Guardians get +1 Power.'}},
      {from:17,to:17,card:{name:'Call of the Brood',text:'Guardians cost 1 less Glamour to Cast.'}},
      {from:18,to:18,card:{name:'Ancient Witnesses',text:'Awaken — Gain 3 Truth.'}}
    ]
  };

  function memoryList(key){return expand(key,'m',memorySpecs[key]||[]);}
  function glamourList(key){return expand(key,'g',glamourSpecs[key]||[]);}
  function awakeningList(key){return expand(key,'a',awakeningSpecs[key]||[]).map(a=>({...a,level:a.number}));}

  window.APP_BETA_V02_DECKS={memory:{fox:memoryList('fox'),snake:memoryList('snake')},glamour:{fox:glamourList('fox'),snake:glamourList('snake')},awakening:{fox:awakeningList('fox'),snake:awakeningList('snake')}};

  buildMemoryDeck=function(key){return shuffle(memoryList(key).map(clone));};
  buildGlamourDeck=function(key){return shuffle(glamourList(key).map(clone));};
  buildAwakeningDeck=function(key){return shuffle(awakeningList(key).map(clone));};
  window.buildMemoryDeck=buildMemoryDeck;
  window.buildGlamourDeck=buildGlamourDeck;
  window.buildAwakeningDeck=buildAwakeningDeck;
  if(typeof AWAKENINGS!=='undefined'){
    AWAKENINGS.fox=awakeningList('fox').map(clone);
    AWAKENINGS.snake=awakeningList('snake').map(clone);
  }

  function addTruth054(pi,n,source){
    const p=state?.players?.[pi];if(!p||!n)return;
    p.renown=Math.max(0,(p.renown||0)+n);
    if(state?.metrics?.renownGained?.[p.key]!==undefined&&n>0)state.metrics.renownGained[p.key]+=n;
    if(state?.metrics?.renownLost?.[p.key]!==undefined&&n<0)state.metrics.renownLost[p.key]+=Math.abs(n);
    if(typeof addLog==='function')addLog(`${p.name} ${n>0?'gained':'lost'} ${Math.abs(n)} Truth${source?` from ${source}`:''}.`,pi);
    if(p.renown>=GAME_DATA.victoryRenown&&!state.winner)state.winner=p.key;
  }

  function resolveSimpleManifest054(pi,c){
    if(!c||c._v054SimpleManifestResolved)return false;
    const m=String(c.text||'').match(/(?:^|[.!?]\s*)Manifest\s*[—-]\s*Gain (\d+) Truth/i);
    if(!m)return false;
    c._v054SimpleManifestResolved=true;addTruth054(pi,+m[1],c.name);return true;
  }
  window.resolveSimpleManifest054=resolveSimpleManifest054;

  if(typeof autoTurnGlamour==='function'){
    const autoTurnBefore054=autoTurnGlamour;
    autoTurnGlamour=function(pi,opts){const g=autoTurnBefore054.apply(this,arguments);if(g)resolveSimpleManifest054(pi,g);return g;};
    window.autoTurnGlamour=autoTurnGlamour;
  }
  if(typeof playCard==='function'){
    const playBefore054=playCard;
    playCard=function(pi,index){const c=state?.players?.[pi]?.hand?.[index];const ok=playBefore054.apply(this,arguments);if(ok!==false&&c)resolveSimpleManifest054(pi,c);return ok;};
    window.playCard=playCard;
  }

  function resolveAwakenTruth054(pi,a){
    if(!a||a._v054AwakenTruthResolved)return false;
    const m=String(a.text||'').match(/(?:^|[.!?]\s*)Awaken\s*[—-]\s*Gain (\d+) Truth/i);if(!m)return false;
    a._v054AwakenTruthResolved=true;addTruth054(pi,+m[1],a.name);return true;
  }
  if(typeof autoAwakeningThenCleanup==='function'){
    const awakenBefore054=autoAwakeningThenCleanup;
    autoAwakeningThenCleanup=function(){const pi=state?.active,before=state?.players?.[pi]?.awakeningField?.slice()||[];const r=awakenBefore054.apply(this,arguments);const after=state?.players?.[pi]?.awakeningField||[];after.forEach(a=>{if(!before.includes(a))resolveAwakenTruth054(pi,a);});return r;};
    window.autoAwakeningThenCleanup=autoAwakeningThenCleanup;
  }
  if(typeof resolveAwakeningChoice==='function'){
    const choiceBefore054=resolveAwakeningChoice;
    resolveAwakeningChoice=function(replaceIndex=null){const pending=state?.pendingAwakening,pi=pending?.pi,a=pending?.card;const r=choiceBefore054.apply(this,arguments);if(a&&state?.players?.[pi]?.awakeningField?.includes(a))resolveAwakenTruth054(pi,a);return r;};
    window.resolveAwakeningChoice=resolveAwakeningChoice;
  }

  function relicProviders054(p){return (p?.zones?.Relic||[]).filter(c=>/This Relic provides 1 Glamour\.?/i.test(c?.text||''));}
  const availableBefore054=typeof availableGlamour==='function'?availableGlamour:null;
  if(availableBefore054){
    availableGlamour=function(p){return availableBefore054(p)+relicProviders054(p).filter(r=>!r._v054GlamourSpent).length;};
    window.availableGlamour=availableGlamour;
  }
  if(typeof autoPay==='function'){
    autoPay=function(p,cost){
      let remain=Math.max(0,Number(cost)||0);if(!p)return false;
      if(!p.v044)p.v044={};let floating=Math.max(0,Number(p.v044.floatingGlamour)||0),fromFloat=Math.min(floating,remain);p.v044.floatingGlamour=floating-fromFloat;remain-=fromFloat;
      for(const r of relicProviders054(p)){if(remain<=0)break;if(r._v054GlamourSpent)continue;r._v054GlamourSpent=true;r.tapped=true;remain-=1;}
      const candidates=(p.glamourField||[]).filter(g=>!g.tapped).sort((a,b)=>(a.value||0)-(b.value||0));
      for(const g of candidates){if(remain<=0)break;g.tapped=true;remain-=Math.max(0,Number(g.value)||0);if(remain<0){p.v044.floatingGlamour=(p.v044.floatingGlamour||0)+(-remain);remain=0;}}
      return remain<=0;
    };
    window.autoPay=autoPay;
  }
  if(typeof prepareTurnStart==='function'){
    const prepareBefore054=prepareTurnStart;
    prepareTurnStart=function(p,first){const r=prepareBefore054.apply(this,arguments);relicProviders054(p).forEach(c=>{c._v054GlamourSpent=false;c.tapped=false;});return r;};
    window.prepareTurnStart=prepareTurnStart;
  }

  if(window.resolveInstinct051){
    const instinctBefore054=window.resolveInstinct051;
    window.resolveInstinct051=function(pi,c){
      if(!c||c._v054ClashResolved)return false;
      const m=String(c.text||'').match(/React\s*[—-]\s*When your Shifter (?:attacks|is attacked), it gets \+(\d+) (Power|Strength|Guard|Vitality) for this Clash/i);
      if(!m)return instinctBefore054.apply(this,arguments);
      const p=state?.players?.[pi];if(!p)return false;const stat=m[2].toLowerCase(),n=+m[1];
      c._v054ClashResolved=true;c._v051InstinctResolved=true;p.stats[stat]=(p.stats[stat]||0)+n;
      if(!p.tempMods)p.tempMods={};if(!p.tempMods.endCombat)p.tempMods.endCombat={power:0,strength:0,guard:0,vitality:0};p.tempMods.endCombat[stat]=(p.tempMods.endCombat[stat]||0)+n;
      if(typeof addLog==='function')addLog(`${p.name} gets +${n} ${caps(stat)} for this Clash from ${c.name}.`,pi);
      if(typeof addLog==='function')addLog(`${c.name} resolved automatically as an Instinct.`,pi);
      return true;
    };
  }

  function persistentGuardianReduction054(p){return [...Object.values(p?.echoes||{}).flat(),...(p?.zones?.Guardian||[]),...(p?.zones?.Relic||[]),...(p?.awakeningField||[])].filter(src=>/Guardians cost 1 less Glamour to Cast\.?/i.test(src?.text||'')).length;}
  const effectiveBefore054=typeof effectiveCost==='function'?effectiveCost:null;
  if(effectiveBefore054){
    effectiveCost=function(p,c){let cost=effectiveBefore054(p,c);if(c?.type==='Guardian')cost=Math.max(0,cost-persistentGuardianReduction054(p));return cost;};
    window.effectiveCost=effectiveCost;
  }

  function decorateCosts054(){
    if(typeof state==='undefined'||!state?.players||typeof effectiveCost!=='function')return;
    document.querySelectorAll('[data-hand-card]').forEach(w=>{const [piRaw,iRaw]=(w.dataset.handCard||'').split('|'),p=state.players[+piRaw],c=p?.hand?.[+iRaw],el=w.querySelector('.cost');if(!p||!c||!el)return;const cost=effectiveCost(p,c);if(cost!==Number(c.cost)){el.innerHTML=`<span class="cost-original-v048">${c.cost}</span>${cost}`;w.classList.add('cost-reduced-v048');}else{el.textContent=c.cost;w.classList.remove('cost-reduced-v048');}});
    const ctx=typeof activeCardContext!=='undefined'?activeCardContext:null,btn=document.getElementById('detailPlay');if(btn&&ctx?.kind==='hand'){const p=state.players[ctx.pi],c=p?.hand?.[ctx.i];if(p&&c){const cost=effectiveCost(p,c);btn.textContent=`Play · ${cost} Glamour${cost<Number(c.cost)?` (−${Number(c.cost)-cost})`:''}`;}}
  }
  let queued054=false;function queue054(){if(queued054)return;queued054=true;setTimeout(()=>{queued054=false;decorateCosts054();},0);}
  const renderBefore054=window.render;if(typeof renderBefore054==='function'){render=function(){const r=renderBefore054.apply(this,arguments);queue054();return r;};window.render=render;}
  new MutationObserver(queue054).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  new MutationObserver(queue054).observe(document.getElementById('cardDialog')||document.body,{childList:true,subtree:true});

  if(typeof renderRules==='function'){
    const rulesBefore054=renderRules;
    renderRules=function(){rulesBefore054();const root=document.getElementById('rulesCopy');if(!root)return;root.querySelectorAll('.rule-card').forEach(card=>{const h=card.querySelector('h4')?.textContent.trim(),p=card.querySelector('p');if(!p)return;if(h==='Glamour')p.innerHTML='At the start of each turn, the top Glamour manifests automatically, then Memory draws automatically and play advances to <strong>Cast</strong>. Each Glamour deck has <strong>18 cards</strong> with at most <strong>9 manifested</strong>. Relics that say they provide Glamour each provide <strong>1 reusable Glamour per turn</strong>. Manifest effects resolve once when the card enters.';});};window.renderRules=renderRules;
  }

  try{renderRules();}catch(_e){}
  queue054();
  console.info('Shapeshifters App Beta v0.2 deck data active');
})();
