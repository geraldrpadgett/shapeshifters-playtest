const { chromium } = require('playwright');
const assert = require('assert/strict');

const BASE = process.env.PLAYTEST_URL || 'https://shapeshifters-playtest-wzwi.vercel.app';
const EXPECTED = process.env.EXPECTED_VERSION || '0.5.0-recover-combat';
const fresh = () => `${BASE}/?smoke=${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const step = name => console.log(`SMOKE_STEP ${name}`);
const overlaps=(a,b)=>!!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;

(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});

  step('wait-production');
  let version='';
  for(let attempt=0;attempt<30;attempt++){
    await page.goto(fresh(),{waitUntil:'domcontentloaded',timeout:30000});
    try{await page.waitForFunction(()=>typeof GAME_DATA!=='undefined'&&typeof state!=='undefined'&&state?.players&&document.querySelectorAll('.player-board').length===2,{timeout:8000});}catch(_e){}
    version=await page.evaluate(()=>typeof GAME_DATA!=='undefined'?(GAME_DATA?.version||''):'');
    console.log(`SMOKE_VERSION attempt=${attempt+1} version=${version||'missing'}`);
    if(version===EXPECTED)break;
    await sleep(3000);
  }
  assert.equal(version,EXPECTED,`production did not reach ${EXPECTED}; saw ${version}`);

  step('new-game');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2);
  const boardText=await page.locator('#gameRoot').innerText();
  assert.match(boardText,/Fox/i); assert.match(boardText,/Snake/i);

  step('glamour-inspect');
  const glamour=await page.evaluate(()=>{
    const p=state.players[0],g=p.glamourDeck.pop();g.tapped=false;p.glamourField=[g];saveAndRender();return {name:g.name,text:g.text,number:g.number,value:g.value};
  });
  await page.waitForTimeout(100);
  const glamourCard=page.locator('[data-v044-inspect-glamour^="0|"]').first();
  await glamourCard.click();
  await page.waitForFunction(()=>document.getElementById('cardDialog')?.open===true);
  const glamourDialog=await page.locator('#cardDialog').innerText();
  assert.match(glamourDialog,new RegExp(glamour.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.ok(glamourDialog.includes(glamour.text));
  assert.ok(glamourDialog.includes(`Card #${glamour.number}`));
  assert.ok(glamourDialog.includes(`${glamour.value} Glamour`));
  await page.evaluate(()=>closeDialog('cardDialog'));

  step('floating-glamour');
  const floatResult=await page.evaluate(()=>{
    const p=state.players[0];
    if(!p.v044)p.v044={};p.v044.floatingGlamour=0;
    p.glamourField=[{id:'smoke-g4',number:904,name:'Smoke Four',value:4,text:'No additional effect.',tapped:false}];
    const paid=autoPay(p,3);saveAndRender();
    return {paid,float:p.v044.floatingGlamour,tapped:p.glamourField[0].tapped};
  });
  assert.deepEqual(floatResult,{paid:true,float:1,tapped:true});
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.floating-glamour-v049')).some(el=>/FLOATING\s+1/.test(el.textContent||'')));

  step('discard-inspect');
  const discarded=await page.evaluate(()=>{
    const p=state.players[0],c=p.hand[0];p.discard=[c];saveAndRender();return c.name;
  });
  await page.locator('[data-open-discard="0"]').first().click();
  await page.waitForFunction(()=>document.getElementById('discardDialog')?.open===true);
  assert.ok((await page.locator('#discardDialog').innerText()).includes(discarded));
  await page.locator('[data-v049-discard-card="0|0"]').click();
  await page.waitForFunction(()=>document.getElementById('cardDialog')?.open===true);
  assert.ok((await page.locator('#cardDialog').innerText()).includes(discarded));
  await page.evaluate(()=>closeDialog('cardDialog'));

  step('revert-recover');
  const revert=page.locator('[data-shifter-flip^="0|"]').first();
  assert.equal((await revert.innerText()).trim(),'REVERT');
  await revert.click();
  await page.waitForFunction(()=>state.players[0].flipped===true);
  assert.equal((await page.locator('[data-shifter-flip^="0|"]').first().innerText()).trim(),'RECOVER');
  await page.locator('[data-shifter-flip^="0|"]').first().click();
  await page.waitForFunction(()=>state.players[0].flipped===false&&state.players[0].damage===0);

  step('recover-before-combat');
  const recovery=await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];state.active=0;a.flipped=true;a.reverted=false;a.damage=1;d.flipped=true;d.damage=1;
    const changed=recoverActiveBeforeCombat050();saveAndRender();
    return {changed,aFlipped:a.flipped,aDamage:a.damage,dFlipped:d.flipped,dDamage:d.damage,instruction:(phaseInstruction()||'')};
  });
  assert.equal(recovery.changed,true);
  assert.equal(recovery.aFlipped,false,'active Shifter should Recover before combat');
  assert.equal(recovery.aDamage,0,'Recover should clear active Shifter damage');
  assert.equal(recovery.dFlipped,true,'opponent Shifter must stay Reverted until its own Recover step');

  step('direct-damage-ignores-guard');
  const direct=await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];state.active=0;
    d.flipped=false;d.reverted=false;d.damage=0;d.stats.guard=99;d.stats.vitality=1;
    a.glamourField=[];a.glamourDeck=[{id:'smoke-direct',number:997,name:'Smoke Direct',value:1,text:'Manifest — Deal 1 direct damage.',tapped:false}];
    autoTurnGlamour(0,{ready:true,source:'smoke'});saveAndRender();
    return {flipped:d.flipped,damage:d.damage,guard:d.stats.guard,log:(state.log||[]).map(x=>typeof x==='string'?x:(x?.text||x?.message||'')).join('\n')};
  });
  assert.equal(direct.guard,99);
  assert.equal(direct.damage,1,'direct damage should apply without Guard reduction');
  assert.equal(direct.flipped,true,'1 direct damage must Revert a 1 Vitality Shifter even through 99 Guard');
  assert.match(direct.log,/Guard ignored/i);

  step('card-overlap');
  await page.evaluate(()=>{
    const p=state.players[0];
    p.hand=[{id:'smoke-trigger-card',number:996,name:'Smoke Trigger',type:'Guardian',color:'Red',cost:0,strength:1,power:1,guard:0,vitality:1,text:'React — When this attacks, gain 1 Truth.'}];
    saveAndRender();
  });
  await page.waitForTimeout(150);
  const visual=await page.evaluate(()=>{
    const card=document.querySelector('[data-hand-card] .card');if(!card)return {card:false};
    const rect=e=>e?e.getBoundingClientRect().toJSON():null;
    const leaves=[...card.querySelectorAll('*')].filter(el=>!el.children.length&&/READY TO CAST|INSPECT/i.test((el.textContent||'').trim()));
    return {card:true,type:rect(card.querySelector('.card-type')),badges:rect(card.querySelector('.trigger-badges')),number:rect(card.querySelector('.card-number')),action:rect(leaves[0]||null)};
  });
  assert.equal(visual.card,true);
  assert.equal(overlaps(visual.type,visual.badges),false,'color/type must not overlap REACT/MANIFEST badges');
  if(visual.action)assert.equal(overlaps(visual.number,visual.action),false,'card number must not overlap ready/cast/inspect hint');

  step('permanent-stat');
  const permanent=await page.evaluate(()=>{
    const p=state.players[0],base=p.stats.strength;
    p.awakeningDeck=[{id:'smoke-aw-perm',number:998,level:998,name:'Smoke Strength',text:'Your Shifter gets +1 Strength.'}];
    state.active=0;state.phase=5;autoAwakeningThenCleanup();saveAndRender();
    return {base,after:p.stats.strength};
  });
  assert.equal(permanent.after,permanent.base+1);

  step('guardian-combat-sequence');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2);
  await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];
    a.zones.Guardian=[{id:'smoke-attacker',number:901,name:'Smoke Attacker',type:'Guardian',color:'Red',cost:0,strength:2,power:1,guard:0,vitality:2,text:'No additional effect.',damage:0}];
    d.zones.Guardian=[{id:'smoke-blocker',number:902,name:'Smoke Blocker',type:'Guardian',color:'Green',cost:0,strength:1,power:1,guard:1,vitality:2,text:'No additional effect.',damage:0}];
    a.awakeningDeck=[{id:'smoke-aw-combat',number:903,level:903,name:'Smoke Combat Awakening',text:'Your Shifter gets +1 Strength.'}];
    a.awakeningField=[];a.awakening=0;state.active=0;state.phase=3;state.combat={stage:'declare',attackers:[],blocks:{}};saveAndRender();
  });
  await page.waitForSelector('[data-zone-card="0|Guardian|0"] .combat-select-v044');
  await page.locator('[data-zone-card="0|Guardian|0"] .combat-select-v044').click();
  await page.locator('#nextPhaseBtn').click();
  await page.waitForFunction(()=>state.combat?.stage==='block');
  await page.locator('[data-zone-card="1|Guardian|0"] .combat-select-v044').click();
  await page.locator('#nextPhaseBtn').click();
  await page.waitForFunction(()=>state.phase===6&&state.players[0].awakeningField.length===1);
  const combat=await page.evaluate(()=>({attackerField:state.players[0].zones.Guardian.length,blockerField:state.players[1].zones.Guardian.length,attackerDiscard:state.players[0].discard.some(c=>c.name==='Smoke Attacker'),blockerDiscard:state.players[1].discard.some(c=>c.name==='Smoke Blocker'),awakening:state.players[0].awakeningField[0]?.name,phase:state.phase}));
  assert.equal(combat.attackerField,0,'attacker should die from blocker Strength + Power');
  assert.equal(combat.blockerField,0,'blocker should die from attacker Strength + Power');
  assert.ok(combat.attackerDiscard&&combat.blockerDiscard,'dead Guardians must move to Memory discard');
  assert.equal(combat.awakening,'Smoke Combat Awakening');
  assert.equal(combat.phase,6);

  step('shifter-trade-example');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2);
  await page.evaluate(()=>{
    const fox=state.players[0],snake=state.players[1];
    fox.stats={power:1,strength:1,guard:0,vitality:1};snake.stats={power:0,strength:1,guard:1,vitality:1};
    fox.damage=0;snake.damage=0;fox.flipped=false;snake.flipped=false;fox.reverted=false;snake.reverted=false;
    fox.zones.Guardian=[];snake.zones.Guardian=[];
    fox.awakeningDeck=[{id:'smoke-aw-trade',number:995,level:995,name:'Smoke Trade Awakening',text:'No additional effect.'}];fox.awakeningField=[];fox.awakening=0;
    state.active=0;state.phase=3;state.combat={stage:'declare',attackers:[],blocks:{}};saveAndRender();
  });
  await page.waitForSelector('.player-board [data-shifter-flip^="0|"]');
  const attackButton=page.locator('.player-board').first().locator('.shifter-center .combat-select-v044');
  await attackButton.click();
  await page.locator('#nextPhaseBtn').click();
  await page.waitForFunction(()=>state.combat?.stage==='block');
  await page.locator('#nextPhaseBtn').click();
  await page.waitForFunction(()=>state.phase===6);
  const trade=await page.evaluate(()=>({foxFlipped:state.players[0].flipped,snakeFlipped:state.players[1].flipped,foxDamage:state.players[0].damage,snakeDamage:state.players[1].damage,phase:state.phase,log:(state.log||[]).map(x=>typeof x==='string'?x:(x?.text||x?.message||'')).join('\n')}));
  assert.equal(trade.foxFlipped,true,'Fox 1/1/0/1 should Revert from Snake counter-damage');
  assert.equal(trade.snakeFlipped,true,'Snake 0/1/1/1 should Revert from Fox attack');
  assert.equal(trade.foxDamage,1);assert.equal(trade.snakeDamage,1);
  assert.match(trade.log,/dealt 1 back/i);

  assert.deepEqual(errors,[],`browser console/page errors:\n${errors.join('\n')}`);
  console.log('LIVE_SMOKE_PASS',JSON.stringify({version,glamour:glamour.name,float:floatResult.float,discarded,recovery,direct,visual,permanent,combat,trade}));
  await browser.close();
})().catch(async err=>{console.error(err.stack||err);process.exit(1);});
