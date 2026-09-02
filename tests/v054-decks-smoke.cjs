const { chromium } = require('playwright');
const assert = require('assert/strict');

const BASE=process.env.PLAYTEST_URL||'https://shapeshifters-playtest-wzwi.vercel.app';
const EXPECTED=process.env.EXPECTED_VERSION||'0.5.4-app-beta-v02-decks';
const fresh=()=>`${BASE}/?v054=${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const step=name=>console.log(`V054_SMOKE_STEP ${name}`);

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});

  step('wait-production');
  let version='';
  for(let attempt=0;attempt<30;attempt++){
    await page.goto(fresh(),{waitUntil:'domcontentloaded',timeout:30000});
    try{await page.waitForFunction(()=>typeof GAME_DATA!=='undefined'&&typeof state!=='undefined'&&state?.players&&window.APP_BETA_V02_DECKS,{timeout:8000});}catch(_e){}
    version=await page.evaluate(()=>typeof GAME_DATA!=='undefined'?(GAME_DATA.version||''):'');
    console.log(`V054_SMOKE_VERSION attempt=${attempt+1} version=${version||'missing'}`);
    if(version===EXPECTED)break;
    await sleep(3000);
  }
  assert.equal(version,EXPECTED,`production did not reach ${EXPECTED}; saw ${version}`);

  step('new-game');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count())await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>state?.players?.length===2&&state.phase===2);

  step('exact-deck-data');
  const decks=await page.evaluate(()=>{
    const sort=arr=>arr.slice().sort((a,b)=>a.number-b.number);
    const summarizeMemory=key=>{const a=sort(buildMemoryDeck(key));return {count:a.length,numbers:a.map(c=>c.number),types:a.reduce((o,c)=>(o[c.type]=(o[c.type]||0)+1,o),{}),cards:a.map(c=>({number:c.number,name:c.name,type:c.type,color:c.color,cost:c.cost,text:c.text,strength:c.strength,power:c.power,guard:c.guard,vitality:c.vitality}))};};
    const summarizeGlamour=key=>{const a=sort(buildGlamourDeck(key));return {count:a.length,values:a.reduce((o,c)=>(o[c.value]=(o[c.value]||0)+1,o),{}),cards:a.map(c=>({number:c.number,name:c.name,value:c.value,text:c.text}))};};
    const summarizeAwakening=key=>{const a=sort(buildAwakeningDeck(key));return {count:a.length,cards:a.map(c=>({number:c.number,name:c.name,text:c.text}))};};
    return {fox:{memory:summarizeMemory('fox'),glamour:summarizeGlamour('fox'),awakening:summarizeAwakening('fox')},snake:{memory:summarizeMemory('snake'),glamour:summarizeGlamour('snake'),awakening:summarizeAwakening('snake')},dataVersion:GAME_DATA.deckDataVersion};
  });
  assert.equal(decks.dataVersion,'App Beta v0.2');
  for(const key of ['fox','snake']){
    assert.equal(decks[key].memory.count,36);assert.deepEqual(decks[key].memory.types,{Echo:18,Guardian:8,Relic:8,Instinct:2});
    assert.deepEqual(decks[key].memory.numbers,Array.from({length:36},(_,i)=>i+1));
    assert.equal(decks[key].glamour.count,18);assert.deepEqual(decks[key].glamour.values,{'1':4,'2':4,'3':3,'4':3,'5':2,'6':2});
    assert.equal(decks[key].awakening.count,18);
  }
  assert.deepEqual(decks.fox.memory.cards[0],{number:1,name:'Kindled Claws',type:'Echo',color:'Red',cost:3,text:'Your Shifter gets +1 Strength.',strength:undefined,power:undefined,guard:undefined,vitality:undefined});
  assert.equal(decks.fox.memory.cards[31].name,'Trickster Mask');assert.equal(decks.fox.memory.cards[31].type,'Relic');assert.equal(decks.fox.memory.cards[31].cost,3);
  assert.equal(decks.fox.memory.cards[34].name,'Sudden Pounce');assert.match(decks.fox.memory.cards[34].text,/\+2 Power for this Clash/);
  assert.equal(decks.fox.glamour.cards[0].name,'Foxfire Spark');assert.equal(decks.fox.glamour.cards[4].name,'Mirror Flame');assert.equal(decks.fox.glamour.cards[17].name,'Nine-Tailed Flame');
  assert.equal(decks.fox.awakening.cards[16].name,'Call of the Den');assert.equal(decks.fox.awakening.cards[17].name,'Stories of the Hunt');
  assert.deepEqual(decks.snake.memory.cards[0],{number:1,name:'Thickened Scales',type:'Echo',color:'Green',cost:3,text:'Your Shifter gets +1 Vitality.',strength:undefined,power:undefined,guard:undefined,vitality:undefined});
  assert.equal(decks.snake.memory.cards[31].name,'Altar of Renewal');assert.equal(decks.snake.memory.cards[31].type,'Relic');assert.equal(decks.snake.memory.cards[31].cost,3);
  assert.equal(decks.snake.memory.cards[34].name,'Sudden Coil');assert.match(decks.snake.memory.cards[35].text,/\+2 Vitality for this Clash/);
  assert.equal(decks.snake.glamour.cards[0].name,'Venom Spark');assert.equal(decks.snake.glamour.cards[4].name,'Coiled Light');assert.equal(decks.snake.glamour.cards[17].name,'Ancient Venom');
  assert.equal(decks.snake.awakening.cards[16].name,'Call of the Brood');assert.equal(decks.snake.awakening.cards[17].name,'Ancient Witnesses');

  step('manifest-truth');
  const manifestTruth=await page.evaluate(()=>{
    const p=state.players[0],card=window.APP_BETA_V02_DECKS.glamour.fox.find(c=>c.number===5);p.renown=0;p.glamourField=[];p.glamourDeck=[JSON.parse(JSON.stringify(card))];autoTurnGlamour(0,{ready:true,source:'v054 smoke'});return {truth:p.renown,name:p.glamourField[0]?.name,once:p.glamourField[0]?._v054SimpleManifestResolved===true};
  });
  assert.deepEqual(manifestTruth,{truth:3,name:'Mirror Flame',once:true});

  step('relic-provides-glamour');
  const relicResource=await page.evaluate(()=>{
    const p=state.players[0],relic=JSON.parse(JSON.stringify(window.APP_BETA_V02_DECKS.memory.fox.find(c=>c.number===27)));p.zones.Relic=[relic];p.glamourField=[];if(!p.v044)p.v044={};p.v044.floatingGlamour=0;const before=availableGlamour(p),paid=autoPay(p,1),after=availableGlamour(p);return {before,paid,after,spent:relic._v054GlamourSpent===true,tapped:relic.tapped===true};
  });
  assert.deepEqual(relicResource,{before:1,paid:true,after:0,spent:true,tapped:true});

  step('persistent-guardian-discount');
  const discount=await page.evaluate(()=>{
    const p=state.players[0],a=JSON.parse(JSON.stringify(window.APP_BETA_V02_DECKS.awakening.fox.find(c=>c.number===17))),g=JSON.parse(JSON.stringify(window.APP_BETA_V02_DECKS.memory.fox.find(c=>c.number===19)));state.active=0;state.phase=2;p.awakeningField=[a];p.zones.Guardian=[];p.zones.Relic=[];p.hand=[g];p.glamourField=[];if(!p.v044)p.v044={};p.v044.floatingGlamour=0;const shown=effectiveCost(p,p.hand[0]);const ok=playCard(0,0);return {shown,ok,guardians:p.zones.Guardian.length,name:p.zones.Guardian[0]?.name};
  });
  assert.deepEqual(discount,{shown:0,ok:true,guardians:1,name:'Ember Kit'});

  step('clash-reacts');
  const reacts=await page.evaluate(()=>{
    const p=state.players[0],base={...p.stats};p.tempMods.endCombat={power:0,strength:0,guard:0,vitality:0};
    const fox=JSON.parse(JSON.stringify(window.APP_BETA_V02_DECKS.memory.fox.find(c=>c.number===35)));const first=window.resolveInstinct051(0,fox),after=p.stats.power,second=window.resolveInstinct051(0,fox);
    p.stats={...base};p.tempMods.endCombat={power:0,strength:0,guard:0,vitality:0};const snake=JSON.parse(JSON.stringify(window.APP_BETA_V02_DECKS.memory.snake.find(c=>c.number===35)));const snakeFirst=window.resolveInstinct051(0,snake),snakeAfter=p.stats.guard;
    return {basePower:base.power,first,after,second,snakeBaseGuard:base.guard,snakeFirst,snakeAfter};
  });
  assert.equal(reacts.first,true);assert.equal(reacts.after,reacts.basePower+2);assert.equal(reacts.second,false);assert.equal(reacts.snakeFirst,true);assert.equal(reacts.snakeAfter,reacts.snakeBaseGuard+2);

  step('awaken-truth');
  const awakenTruth=await page.evaluate(()=>{
    const p=state.players[0],a=JSON.parse(JSON.stringify(window.APP_BETA_V02_DECKS.awakening.fox.find(c=>c.number===18)));state.active=0;p.renown=0;p.awakeningField=[];p.awakeningDeck=[a];p.flags.awakeningDrawn=false;autoAwakeningThenCleanup();return {truth:p.renown,name:p.awakeningField[0]?.name,resolved:p.awakeningField[0]?._v054AwakenTruthResolved===true};
  });
  assert.deepEqual(awakenTruth,{truth:3,name:'Stories of the Hunt',resolved:true});

  assert.deepEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log('V054_LIVE_SMOKE_PASS',JSON.stringify({version,decks:{foxMemory:decks.fox.memory.count,snakeMemory:decks.snake.memory.count,glamourValues:decks.fox.glamour.values},manifestTruth,relicResource,discount,reacts,awakenTruth}));
  await browser.close();
})().catch(err=>{console.error(err);process.exit(1);});
