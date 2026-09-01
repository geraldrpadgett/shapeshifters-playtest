(function(){
  'use strict';

  GAME_DATA.version='0.4.3-awakening-choice';
  GAME_DATA.awakeningDeckSize=18;
  GAME_DATA.maxAwakenings=9;

  const glamourDecks={
    fox:[
      {id:'fg-01',number:1,name:'Foxfire Spark',value:1,text:'Manifest — Your Shifter gets +1 Power this turn.'},{id:'fg-02',number:2,name:'Cunning Ember',value:1,text:'Manifest — Your next Relic this turn costs 1 less Glamour.'},{id:'fg-03',number:3,name:'Lingering Spark',value:1,text:'No additional effect.'},{id:'fg-04',number:4,name:'Mirror Flame',value:2,text:'Manifest — The first time one of your Relics triggers this turn, gain 3 Truth.'},{id:'fg-05',number:5,name:'Spirit Cinder',value:2,text:'Manifest — Your Shifter gets +1 Power this turn.'},{id:'fg-06',number:6,name:'Dancing Foxfire',value:2,text:'No additional effect.'},{id:'fg-07',number:7,name:'Ninefold Glimmer',value:3,text:'Manifest — If you control a Relic, your Shifter gets +1 Power this turn.'},{id:'fg-08',number:8,name:'Moonlit Flame',value:3,text:'No additional effect.'},{id:'fg-09',number:9,name:'Trickster’s Glow',value:3,text:'No additional effect.'},{id:'fg-10',number:10,name:'Ancestral Foxfire',value:4,text:'Manifest — Your next Relic this turn costs 1 less Glamour.'},{id:'fg-11',number:11,name:'Ember of Memory',value:4,text:'No additional effect.'},{id:'fg-12',number:12,name:'Wild Glamour',value:4,text:'No additional effect.'},{id:'fg-13',number:13,name:'Spirit Blaze',value:5,text:'No additional effect.'},{id:'fg-14',number:14,name:'Burning Mirage',value:5,text:'No additional effect.'},{id:'fg-15',number:15,name:'Veiled Inferno',value:5,text:'No additional effect.'},{id:'fg-16',number:16,name:'Nine-Tailed Flame',value:6,text:'No additional effect.'},{id:'fg-17',number:17,name:'Primal Foxfire',value:6,text:'No additional effect.'},{id:'fg-18',number:18,name:'Ancient Glamour',value:6,text:'No additional effect.'}
    ],
    snake:[
      {id:'sg-01',number:1,name:'Emerald Glimmer',value:1,text:'Manifest — Your Shifter gets +1 Guard this turn.'},{id:'sg-02',number:2,name:'Coiled Offering',value:1,text:'Manifest — Your next Relic this turn costs 1 less Glamour.'},{id:'sg-03',number:3,name:'Venomous Gleam',value:1,text:'No additional effect.'},{id:'sg-04',number:4,name:'Living Amethyst',value:2,text:'Manifest — Your Shifter gets +1 Vitality this turn.'},{id:'sg-05',number:5,name:'Ancient Offering',value:2,text:'Manifest — The first time one of your Relics triggers this turn, gain 3 Truth.'},{id:'sg-06',number:6,name:'Serpent’s Glow',value:2,text:'No additional effect.'},{id:'sg-07',number:7,name:'Hydra’s Reflection',value:3,text:'Manifest — If you control a Relic, your Shifter gets +1 Guard this turn.'},{id:'sg-08',number:8,name:'Jeweled Coil',value:3,text:'No additional effect.'},{id:'sg-09',number:9,name:'Scaled Glamour',value:3,text:'No additional effect.'},{id:'sg-10',number:10,name:'Ancient Resonance',value:4,text:'Manifest — Your next Relic this turn costs 1 less Glamour.'},{id:'sg-11',number:11,name:'Amethyst Scale',value:4,text:'No additional effect.'},{id:'sg-12',number:12,name:'Deep Coil',value:4,text:'No additional effect.'},{id:'sg-13',number:13,name:'Hydra’s Essence',value:5,text:'No additional effect.'},{id:'sg-14',number:14,name:'Ancient Venom',value:5,text:'No additional effect.'},{id:'sg-15',number:15,name:'Coiling Darkness',value:5,text:'No additional effect.'},{id:'sg-16',number:16,name:'Nine-Headed Glamour',value:6,text:'No additional effect.'},{id:'sg-17',number:17,name:'Primordial Scale',value:6,text:'No additional effect.'},{id:'sg-18',number:18,name:'Ancient Serpent’s Essence',value:6,text:'No additional effect.'}
    ]
  };

  AWAKENINGS.fox=[
    {level:1,name:'Kindled Strength',text:'Your Shifter gets +1 Strength.'},{level:2,name:'Foxfire Within',text:'Your Shifter gets +1 Power.'},{level:3,name:'Predator’s Grace',text:'Your Shifter gets +1 Guard.'},{level:4,name:'Ninefold Heart',text:'Your Shifter gets +1 Vitality.'},{level:5,name:'Burning Pack',text:'Your Guardians get +1 Strength.'},{level:6,name:'Spirit Pack',text:'Your Guardians get +1 Power.'},{level:7,name:'Protect the Den',text:'Your Guardians get +1 Guard while blocking.'},{level:8,name:'Shared Vitality',text:'Your Guardians get +1 Vitality.'},{level:9,name:'Hunt Together',text:'React — When your Shifter attacks, choose a Guardian. It gets +1 Strength this combat.'},{level:10,name:'Kindle the Pack',text:'React — Whenever a Guardian Manifests, your Shifter gets +1 Power this turn.'},{level:11,name:'Flashing Tails',text:'Awaken — Your Shifter gets +2 Guard until your next turn.'},{level:12,name:'Call of the Den',text:'The first Guardian you play each turn costs 1 less Glamour.'},{level:13,name:'Stories of the Hunt',text:'Awaken — If you control a Guardian, gain 3 Truth.'},{level:14,name:'Glorious Pursuit',text:'React — The first time a Guardian you control successfully attacks each turn, gain 3 Truth.'},{level:15,name:'Shared Fury',text:'React — The first time your Shifter’s Strength increases each turn, choose a Guardian. It gets +1 Strength this turn.'},{level:16,name:'Foxfire Chorus',text:'React — The first time a Guardian enters each turn, deal 1 direct damage.'},{level:17,name:'Many Tails, One Spirit',text:'Your Shifter gets +1 Power while you control 2 or more Guardians.'},{level:18,name:'The Growing Pack',text:'3 Awakenings: Guardians get +1 Strength. 6 Awakenings: They also get +1 Power. 9 Awakenings: They also get +1 Vitality.'}
  ];
  AWAKENINGS.snake=[
    {level:1,name:'Endless Growth',text:'Your Shifter gets +1 Vitality.'},{level:2,name:'Coiling Defense',text:'Your Shifter gets +1 Guard.'},{level:3,name:'Ancient Muscle',text:'Your Shifter gets +1 Strength.'},{level:4,name:'Venomous Spirit',text:'Your Shifter gets +1 Power.'},{level:5,name:'Growing Brood',text:'Your Guardians get +1 Vitality.'},{level:6,name:'Coiled Brood',text:'Your Guardians get +1 Guard while blocking.'},{level:7,name:'Hydra’s Bite',text:'Your Guardians get +1 Strength.'},{level:8,name:'Mystic Brood',text:'Your Guardians get +1 Power.'},{level:9,name:'Shelter Beneath the Coil',text:'React — When your Shifter is attacked, choose a Guardian. It gets +1 Vitality this combat.'},{level:10,name:'Strength in Survival',text:'React — Whenever a Guardian successfully blocks, your Shifter gets +1 Guard until end of turn.'},{level:11,name:'Sudden Shedding',text:'Awaken — Your Shifter gets +2 Guard until your next turn.'},{level:12,name:'Call the Brood',text:'The first Guardian you play each turn costs 1 less Glamour.'},{level:13,name:'Ancient Witnesses',text:'Awaken — If you control a Guardian, gain 3 Truth.'},{level:14,name:'Unbroken Defense',text:'React — The first time a Guardian successfully blocks each turn, gain 3 Truth.'},{level:15,name:'Shared Growth',text:'React — The first time your Shifter’s Vitality increases each turn, choose a Guardian. It gets +1 Vitality this turn.'},{level:16,name:'Many Heads Watching',text:'React — The first time a Guardian enters each turn, your Shifter gets +1 Guard this turn.'},{level:17,name:'The Brood Endures',text:'Your Shifter gets +1 Vitality while you control 2 or more Guardians.'},{level:18,name:'The Growing Hydra',text:'3 Awakenings: Guardians get +1 Vitality. 6 Awakenings: They also get +1 Guard. 9 Awakenings: They also get +1 Strength.'}
  ];

  buildGlamourDeck=function(key){return shuffle(glamourDecks[key].map(card=>({...deepClone(card)})));};
  buildAwakeningDeck=function(key){return shuffle(AWAKENINGS[key].map((a,i)=>({...deepClone(a),number:i+1,id:`a-${key}-${i+1}`})));};

  makePlayer=function(key){
    const s=GAME_DATA.shifters[key];
    const p={key,name:s.short,renown:0,awakening:0,reverted:false,flipped:false,damage:0,stats:clone(s.base),memoryDeck:buildMemoryDeck(key),hand:[],discard:[],echoes:Object.fromEntries(Object.keys(GAME_DATA.colors).map(color=>[color,[]])),zones:{Guardian:[],Relic:[]},glamourDeck:buildGlamourDeck(key),glamourField:[],awakeningDeck:buildAwakeningDeck(key),awakeningField:[],awakeningDiscard:[],hiddenHand:false,flags:{glamourDrawn:false,glamourPlayed:false,memoryDrawn:false,awakeningDrawn:false},tempMods:{endTurn:{power:0,strength:0,guard:0,vitality:0},endCombat:{power:0,strength:0,guard:0,vitality:0}}};
    for(let i=0;i<GAME_DATA.openingMemoryHand;i++)rawDrawMemory(p);
    return p;
  };

  glamourMarkup=function(g,cls=''){return `<div class="glamour ${cls} ${g.tapped?'tapped':''}" title="${esc(g.name||'Glamour')} — ${esc(g.text||'')}"><small class="glamour-number">#${g.number||''}</small><span class="glamour-value">${g.value}</span><small class="glamour-title">${esc(g.name||'Glamour')}</small></div>`;};

  autoAwakeningThenCleanup=function(){
    const pi=state.active,p=activePlayer();state.phase=5;const a=rawDrawAwakening(p);p.flags.awakeningDrawn=true;
    if(!a){state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pi);return;}
    if(p.awakeningField.length<GAME_DATA.maxAwakenings){p.awakeningField.push(a);p.awakening=p.awakeningField.length;state.metrics.awakeningsPlayed[p.key]++;addLog(`${p.name} automatically manifested ${a.name}.`,pi);toast(`${a.name} manifested · ${p.awakeningField.length}/${GAME_DATA.maxAwakenings}`);state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pi);return;}
    state.pendingAwakening={pi,card:a};addLog(`${p.name} revealed ${a.name}. With 9 Awakenings manifested, choose whether to keep the current nine or replace one.`,pi);setTimeout(openAwakeningChoiceDialog,0);
  };

  const originalPhaseCompletionIssue=phaseCompletionIssue;
  phaseCompletionIssue=function(){if(state&&state.pendingAwakening)return 'Choose whether to keep or replace an Awakening first.';return originalPhaseCompletionIssue();};

  function ensureAwakeningChoiceDialog(){
    if(document.getElementById('awakeningChoiceDialog'))return;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="awakeningChoiceDialog" class="modal wide awakening-choice-modal"><div class="modal-head"><div><span class="eyebrow">AWAKENING LIMIT REACHED</span><h2>Choose Your Nine</h2></div></div><div class="modal-body"><div id="awakeningChoiceBody"></div></div></dialog>`);
    const d=document.getElementById('awakeningChoiceDialog');d.addEventListener('cancel',e=>e.preventDefault());d.addEventListener('click',e=>{if(e.target===d){e.preventDefault();e.stopImmediatePropagation();}},true);
  }
  ensureAwakeningChoiceDialog();

  window.openAwakeningChoiceDialog=function(){
    const pending=state&&state.pendingAwakening;if(!pending)return;const p=state.players[pending.pi],a=pending.card,body=document.getElementById('awakeningChoiceBody');if(!body)return;
    const current=p.awakeningField.map((old,i)=>`<button class="awakening-replace-option" data-awaken-replace="${i}">${awakeningMarkup(old,p.key)}<span class="play-hint">Replace this card</span></button>`).join('');
    body.innerHTML=`<div class="awakening-choice-intro"><div class="awakening-choice-new">${awakeningMarkup(a,p.key)}</div><div class="awakening-choice-copy"><span class="eyebrow">NEW AWAKENING</span><h3>${esc(a.name)}</h3><p>You already have ${GAME_DATA.maxAwakenings} manifested Awakenings. Keep your current nine, or replace one manifested card with this new card.</p><div class="awakening-keep-row"><button class="button primary" id="keepCurrentAwakenings">Keep Current 9</button></div><span class="eyebrow">OR REPLACE ONE</span></div></div><div class="awakening-choice-grid">${current}</div>`;
    document.getElementById('keepCurrentAwakenings').onclick=()=>resolveAwakeningChoice(null);document.querySelectorAll('[data-awaken-replace]').forEach(el=>el.onclick=()=>resolveAwakeningChoice(+el.dataset.awakenReplace));openDialog('awakeningChoiceDialog');
  };

  window.resolveAwakeningChoice=function(replaceIndex=null){
    const pending=state&&state.pendingAwakening;if(!pending)return;const p=state.players[pending.pi],a=pending.card;if(!Array.isArray(p.awakeningDiscard))p.awakeningDiscard=[];snapshot();
    if(Number.isInteger(replaceIndex)&&replaceIndex>=0&&replaceIndex<p.awakeningField.length){const old=p.awakeningField[replaceIndex];p.awakeningField[replaceIndex]=a;p.awakeningDiscard.push(old);state.metrics.awakeningsPlayed[p.key]++;addLog(`${p.name} replaced ${old.name} with ${a.name}.`,pending.pi);toast(`${a.name} replaced ${old.name}.`);}else{p.awakeningDiscard.push(a);addLog(`${p.name} kept the current nine Awakenings; ${a.name} was set aside.`,pending.pi);toast(`Kept current 9 · ${a.name} set aside.`);}
    p.awakening=p.awakeningField.length;state.pendingAwakening=null;state.phase=6;addLog(`Phase: ${GAME_DATA.phases[6]}.`,pending.pi);closeDialog('awakeningChoiceDialog');saveAndRender();flashPhaseConsole();
  };

  function reflowDeckZones(){document.querySelectorAll('.v4-tabletop').forEach(table=>{const row=table.querySelector('.auto-deck-row'),bottom=table.querySelector('.table-bottom-row');if(!row||!bottom||row.children.length<2)return;const left=row.children[0],right=row.children[1];left.classList.add('deck-stack-lane','left');right.classList.add('deck-stack-lane','right');const glamour=bottom.querySelector('.glamour-lane'),awakening=bottom.querySelector('.awakening-lane');if(glamour)left.appendChild(glamour);if(awakening)right.appendChild(awakening);});}
  const originalRender=render;render=function(){originalRender();reflowDeckZones();};

  const originalRenderRules=renderRules;renderRules=function(){originalRenderRules();const root=document.getElementById('rulesCopy');if(!root)return;root.querySelectorAll('.rule-card').forEach(card=>{if(card.querySelector('h4')?.textContent.trim()==='Awakening'){card.querySelector('p').innerHTML='Awakening has <strong>no hand</strong>: after Recover, the top Awakening card manifests automatically. The deck has <strong>18 cards</strong>, but only <strong>9</strong> can be manifested at once. After the ninth, each new Awakening is revealed and you choose to keep your current nine or replace one.';}});};
})();
