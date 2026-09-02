const { chromium } = require('playwright');
const assert = require('assert/strict');

const BASE = process.env.PLAYTEST_URL || 'https://shapeshifters-playtest-wzwi.vercel.app';
const EXPECTED = process.env.EXPECTED_VERSION || '0.5.2-shifter-glamour-cap';
const fresh = () => `${BASE}/?v052=${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const step = name => console.log(`V052_SMOKE_STEP ${name}`);

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
    try{await page.waitForFunction(()=>typeof GAME_DATA!=='undefined'&&typeof state!=='undefined'&&state?.players&&document.querySelectorAll('.player-board').length===2,{timeout:8000});}catch(_e){}
    version=await page.evaluate(()=>typeof GAME_DATA!=='undefined'?(GAME_DATA?.version||''):'');
    console.log(`V052_SMOKE_VERSION attempt=${attempt+1} version=${version||'missing'}`);
    if(version===EXPECTED)break;
    await sleep(3000);
  }
  assert.equal(version,EXPECTED,`production did not reach ${EXPECTED}; saw ${version}`);

  step('new-game');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count())await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>state?.players?.length===2&&state.phase===2);

  step('deck-and-limit');
  const deckState=await page.evaluate(()=>({
    max:GAME_DATA.maxGlamours,
    totals:state.players.map(p=>(p.glamourDeck?.length||0)+(p.glamourField?.length||0)+(p.glamourDiscard?.length||0))
  }));
  assert.equal(deckState.max,9,'maximum manifested Glamour must be 9');
  assert.deepEqual(deckState.totals,[18,18],'each Shifter must still have an 18-card Glamour set');

  step('shifter-damage-does-not-accumulate');
  const nonAccum=await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];state.active=0;
    a.zones.Relic=[];a.zones.Guardian=[];if(!a.v044)a.v044={};a.v044.turnFlags={};
    d.stats.guard=0;d.stats.vitality=3;d.damage=0;d.flipped=false;d.reverted=false;
    window.directDamage051(0,1,'First separate hit');
    const first={damage:d.damage,flipped:d.flipped};
    window.directDamage051(0,1,'Second separate hit');
    const second={damage:d.damage,flipped:d.flipped};
    window.directDamage051(0,3,'Single lethal hit');
    const lethal={damage:d.damage,flipped:d.flipped};
    saveAndRender();return {first,second,lethal};
  });
  assert.deepEqual(nonAccum.first,{damage:1,flipped:false});
  assert.deepEqual(nonAccum.second,{damage:1,flipped:false},'two separate 1-damage hits must not accumulate to 2');
  assert.deepEqual(nonAccum.lethal,{damage:3,flipped:true},'one 3-damage event should still be lethal against 3 Vitality');

  step('glamour-10th-keep-nine');
  const beforeKeep=await page.evaluate(()=>{
    const p=state.players[0];state.active=0;state.phase=2;state.pendingGlamour=null;p.flipped=false;p.reverted=false;p.damage=0;p.stats.strength=2;p.glamourDiscard=[];
    p.glamourField=Array.from({length:9},(_,i)=>({id:`field-${i}`,number:700+i,name:`Field Glamour ${i+1}`,value:1,text:'No additional effect.',tapped:false,instanceId:`field-${i}-x`}));
    p.glamourDeck=[{id:'tenth-keep',number:799,name:'Tenth Keep',value:1,text:'Manifest — Your Shifter gets +1 Strength.',tapped:false}];
    if(!p.flags)p.flags={};p.flags.glamourDrawn=false;p.flags.glamourPlayed=false;
    const returned=autoTurnGlamour(0,{ready:true,source:'smoke'});saveAndRender();
    return {returned:returned===null,field:p.glamourField.length,pending:state.pendingGlamour?.card?.name,strength:p.stats.strength};
  });
  assert.deepEqual(beforeKeep,{returned:true,field:9,pending:'Tenth Keep',strength:2});
  await page.waitForSelector('#glamourChoiceDialog[open]');
  await page.locator('[data-glamour-keep-v052]').click();
  await page.waitForFunction(()=>!state.pendingGlamour);
  const kept=await page.evaluate(()=>({field:state.players[0].glamourField.length,discard:state.players[0].glamourDiscard.map(g=>g.name),strength:state.players[0].stats.strength}));
  assert.equal(kept.field,9);assert.ok(kept.discard.includes('Tenth Keep'));assert.equal(kept.strength,2,'set-aside Glamour must not resolve Manifest');

  step('glamour-10th-replace');
  await page.evaluate(()=>{
    const p=state.players[0];p.glamourDeck=[{id:'tenth-replace',number:800,name:'Tenth Replace',value:2,text:'Manifest — Your Shifter gets +1 Strength.',tapped:false}];
    autoTurnGlamour(0,{ready:true,source:'smoke'});saveAndRender();
  });
  await page.waitForSelector('#glamourChoiceDialog[open]');
  await page.locator('[data-glamour-replace-v052="0"]').click();
  await page.waitForFunction(()=>!state.pendingGlamour&&state.players[0].glamourField.some(g=>g.name==='Tenth Replace'));
  const replaced=await page.evaluate(()=>({
    field:state.players[0].glamourField.length,
    first:state.players[0].glamourField[0]?.name,
    discard:state.players[0].glamourDiscard.map(g=>g.name),
    strength:state.players[0].stats.strength
  }));
  assert.equal(replaced.field,9);assert.equal(replaced.first,'Tenth Replace');assert.ok(replaced.discard.includes('Field Glamour 1'));assert.equal(replaced.strength,3,'replacement Glamour must resolve Manifest exactly when it enters');

  step('no-overflow');
  const overflow=await page.evaluate(()=>state.players.map(p=>p.glamourField.length));
  assert.ok(overflow.every(n=>n<=9),`Glamour field overflowed: ${overflow.join(',')}`);
  assert.deepEqual(errors,[],`browser console/page errors:\n${errors.join('\n')}`);
  console.log('V052_LIVE_SMOKE_PASS',JSON.stringify({version,deckState,nonAccum,kept,replaced,overflow}));
  await browser.close();
})().catch(async err=>{console.error(err.stack||err);process.exit(1);});
