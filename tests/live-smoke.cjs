const { chromium } = require('playwright');
const assert = require('assert/strict');

const BASE = process.env.PLAYTEST_URL || 'https://shapeshifters-playtest-wzwi.vercel.app';
const EXPECTED = process.env.EXPECTED_VERSION || '0.5.2-shifter-glamour-cap';
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

  step('automatic-opening');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2&&state?.phase===2);
  const opening=await page.evaluate(()=>({phase:state.phase,phaseName:GAME_DATA.phases[state.phase],hand:state.players[0].hand.length,glamour:state.players[0].glamourField.length,buttons:document.querySelectorAll('[data-shifter-flip],[data-revert]').length}));
  assert.match(opening.phaseName,/Cast/i,'automatic Glamour + first-turn draw skip should land on Cast');
  assert.equal(opening.hand,5,'first player must still skip the first Memory draw');
  assert.ok(opening.glamour>=1,'top Glamour should manifest automatically');
  assert.equal(opening.buttons,0,'manual Recover/Revert buttons must be removed');

  step('automatic-next-turn-draw');
  await page.evaluate(()=>{state.phase=6;saveAndRender();});
  await page.waitForSelector('#nextPhaseBtn');
  await page.locator('#nextPhaseBtn').click();
  await page.waitForFunction(()=>state.active===1&&state.phase===2);
  const nextTurn=await page.evaluate(()=>({hand:state.players[1].hand.length,glamour:state.players[1].glamourField.length,phaseName:GAME_DATA.phases[state.phase]}));
  assert.match(nextTurn.phaseName,/Cast/i);
  assert.equal(nextTurn.hand,6,'later turns should draw one Memory automatically');
  assert.ok(nextTurn.glamour>=1,'later turns should manifest the top Glamour automatically');

  step('new-game-reset');
  await page.locator('#newGameBtn').click();
  if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();
  await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2&&state.phase===2);

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
    const p=state.players[0];if(!p.v044)p.v044={};p.v044.floatingGlamour=0;
    p.glamourField=[{id:'smoke-g4',number:904,name:'Smoke Four',value:4,text:'No additional effect.',tapped:false}];
    const paid=autoPay(p,3);saveAndRender();return {paid,float:p.v044.floatingGlamour,tapped:p.glamourField[0].tapped};
  });
  assert.deepEqual(floatResult,{paid:true,float:1,tapped:true});
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.floating-glamour-v049')).some(el=>/FLOATING\s+1/.test(el.textContent||'')));

  step('active-hand-glamour-summary');
  await page.evaluate(()=>{
    const p=state.players[0];p.glamourField=[{id:'sum-ready',value:2,tapped:false},{id:'sum-tapped',value:3,tapped:true}];if(!p.v044)p.v044={};p.v044.floatingGlamour=1;saveAndRender();openMyHandDialog(false);
  });
  await page.waitForSelector('.hand-glamour-summary-v051');
  const handSummary=await page.locator('.hand-glamour-summary-v051').innerText();
  assert.match(handSummary,/3 available/i);
  assert.match(handSummary,/5 total on field/i);
  await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));

  step('face-down-echo-block');
  await page.evaluate(()=>{
    const p=state.players[0];p.flipped=true;p.reverted=false;p.echoes.Red=[];p.hand=[{id:'smoke-echo',number:990,name:'Smoke Echo',type:'Echo',color:'Red',cost:0,text:'No additional effect.'}];state.active=0;state.phase=2;saveAndRender();openMyHandDialog(false);
  });
  await page.locator('#handDialog[open] [data-hand-dialog-card="0|0"]').first().click();
  await page.waitForFunction(()=>document.getElementById('cardDialog')?.open===true);
  await page.locator('#detailPlay').click();
  await page.waitForTimeout(100);
  const echoBlocked=await page.evaluate(()=>({hand:state.players[0].hand.length,echoes:state.players[0].echoes.Red.length,flipped:state.players[0].flipped}));
  assert.deepEqual(echoBlocked,{hand:1,echoes:0,flipped:true},'face-down Shifter must not receive an Echo');
  await page.evaluate(()=>{state.players[0].flipped=false;state.players[0].damage=0;document.querySelectorAll('dialog[open]').forEach(d=>d.close());saveAndRender();});

  step('manifest-guardian-discount');
  await page.evaluate(()=>{
    const p=state.players[0];state.active=0;state.phase=2;p.awakeningField=[];p.zones.Relic=[];p.zones.Guardian=[];if(!p.v044)p.v044={};p.v044.turnFlags={costFirstUsed:{}};p.v044.nextGuardianDiscount=0;p.glamourField=[{id:'pay',number:1,name:'Pay',value:6,text:'No additional effect.',tapped:false}];
    p.hand=[{id:'smoke-lantern',number:926,name:"Trickster's Lantern",type:'Relic',color:'Blue',cost:0,text:'Manifest — Draw 1 card. The first Guardian you play each turn costs 1 less Glamour.'}];saveAndRender();openMyHandDialog(false);
  });
  await page.locator('#handDialog[open] [data-hand-dialog-card="0|0"]').first().click();await page.waitForFunction(()=>document.getElementById('cardDialog')?.open===true);await page.locator('#detailPlay').click();
  await page.waitForFunction(()=>state.players[0].v044?.nextGuardianDiscount===1);
  await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  const oneShot=await page.evaluate(()=>{const p=state.players[0];p.hand=[{id:'smoke-32',number:32,name:'Smoke Guardian 32',type:'Guardian',color:'Red',cost:0,strength:1,power:1,guard:0,vitality:1,text:'No additional effect.'}];saveAndRender();return true;});
  assert.equal(oneShot,true);
  await page.waitForFunction(()=>state.players[0].hand[0]?.cost===1);
  const discounted=await page.evaluate(()=>effectiveCost(state.players[0],state.players[0].hand[0]));
  assert.equal(discounted,0,'Manifest discount should apply to the next Guardian on the Manifest turn');
  await page.evaluate(()=>openMyHandDialog(false));await page.locator('#handDialog[open] [data-hand-dialog-card="0|0"]').first().click();await page.waitForFunction(()=>document.getElementById('cardDialog')?.open===true);await page.locator('#detailPlay').click();
  await page.waitForFunction(()=>state.players[0].v044?.nextGuardianDiscount===0);
  await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  const laterCost=await page.evaluate(()=>{
    const p=state.players[0];p.hand=[{id:'smoke-next-guardian',number:33,name:'Smoke Next Guardian',type:'Guardian',color:'Red',cost:1,strength:1,power:1,guard:0,vitality:1,text:'No additional effect.'}];saveAndRender();return effectiveCost(p,p.hand[0]);
  });
  assert.equal(laterCost,1,'Manifest Relic must not remain a permanent Guardian cost reducer');

  step('card-32-cost');
  const card32=await page.evaluate(()=>{const p=state.players[0];p.zones.Relic=[{id:'static-lantern',number:26,name:"Trickster's Lantern",type:'Relic',color:'Blue',cost:2,text:'Manifest — Draw 1 card. The first Guardian you play each turn costs 1 less Glamour.',_v044ManifestResolved:true}];p.awakeningField=[];p.v044.turnFlags={costFirstUsed:{}};p.v044.nextGuardianDiscount=0;p.hand=[{id:'bug-32',number:32,name:'Card Thirty Two',type:'Guardian',color:'Blue',cost:0,strength:1,power:1,guard:0,vitality:1,text:'No additional effect.'}];saveAndRender();return true;});
  assert.equal(card32,true);
  await page.waitForFunction(()=>state.players[0].hand[0]?.cost===1);
  const cost32=await page.evaluate(()=>({base:state.players[0].hand[0].cost,effective:effectiveCost(state.players[0],state.players[0].hand[0])}));
  assert.deepEqual(cost32,{base:1,effective:1});

  step('instinct-once');
  const instinct=await page.evaluate(()=>{
    const p=state.players[0],base=p.stats.strength,c={id:'smoke-instinct',number:991,name:'Smoke Instinct',type:'Instinct',color:'Red',cost:0,text:'Play when your Shifter is attacked. Your Shifter gets +2 Strength for this combat.'};
    const first=window.resolveInstinct051(0,c),afterFirst=p.stats.strength,second=window.resolveInstinct051(0,c),afterSecond=p.stats.strength;return {base,first,afterFirst,second,afterSecond,resolved:c._v051InstinctResolved};
  });
  assert.equal(instinct.first,true);assert.equal(instinct.afterFirst,instinct.base+2);assert.equal(instinct.second,false);assert.equal(instinct.afterSecond,instinct.afterFirst);assert.equal(instinct.resolved,true);

  step('discard-inspect');
  const discarded=await page.evaluate(()=>{const p=state.players[0],c=p.hand[0];p.discard=[c];saveAndRender();return c.name;});
  await page.locator('[data-open-discard="0"]').first().click();await page.waitForFunction(()=>document.getElementById('discardDialog')?.open===true);
  assert.ok((await page.locator('#discardDialog').innerText()).includes(discarded));
  await page.locator('[data-v049-discard-card="0|0"]').click();await page.waitForFunction(()=>document.getElementById('cardDialog')?.open===true);
  assert.ok((await page.locator('#cardDialog').innerText()).includes(discarded));await page.evaluate(()=>closeDialog('cardDialog'));

  step('recover-before-combat-no-buttons');
  const recovery=await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];state.active=0;state.phase=2;a.flipped=true;a.reverted=false;a.damage=1;d.flipped=true;d.reverted=false;d.damage=1;nextPhase();return {phase:state.phase,aFlipped:a.flipped,aDamage:a.damage,dFlipped:d.flipped,dDamage:d.damage};
  });
  assert.equal(recovery.phase,3);assert.equal(recovery.aFlipped,false);assert.equal(recovery.aDamage,0);assert.equal(recovery.dFlipped,true);assert.equal(await page.locator('[data-shifter-flip],[data-revert]').count(),0);

  step('direct-damage-respects-guard');
  const direct=await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];state.active=0;d.flipped=false;d.reverted=false;d.damage=0;d.stats.guard=99;d.stats.vitality=1;
    a.glamourField=[];a.glamourDeck=[{id:'smoke-direct',number:997,name:'Smoke Direct',value:1,text:'Manifest — Deal 1 direct damage.',tapped:false}];autoTurnGlamour(0,{ready:true,source:'smoke'});
    const blocked={flipped:d.flipped,damage:d.damage,guard:d.stats.guard};
    d.flipped=false;d.reverted=false;d.damage=0;d.stats.guard=1;d.stats.vitality=1;a.glamourDeck=[{id:'smoke-direct-2',number:998,name:'Smoke Direct Two',value:1,text:'Manifest — Deal 2 direct damage.',tapped:false}];autoTurnGlamour(0,{ready:true,source:'smoke'});saveAndRender();
    return {blocked,partial:{flipped:d.flipped,damage:d.damage,guard:d.stats.guard},log:(state.log||[]).map(x=>typeof x==='string'?x:(x?.text||x?.message||'')).join('\n')};
  });
  assert.deepEqual(direct.blocked,{flipped:false,damage:0,guard:99},'Guard must fully block smaller direct damage');
  assert.deepEqual(direct.partial,{flipped:true,damage:1,guard:1},'only direct damage above Guard should reach Vitality');
  assert.match(direct.log,/blocked .* direct damage with Guard/i);assert.doesNotMatch(direct.log,/Guard ignored/i);

  step('influence-side-order');
  const influenceOrder=await page.evaluate(()=>[...document.querySelector('.area-influence-v044 .support-row').children].map(el=>(el.textContent||'').trim().split('\n')[0]));
  assert.match(influenceOrder[0]||'',/Relic/i,'Relics should be on the left');assert.match(influenceOrder[1]||'',/Guardian/i,'Guardians should be on the right');

  step('card-overlap');
  await page.evaluate(()=>{const p=state.players[0];p.hand=[{id:'smoke-trigger-card',number:996,name:'Smoke Trigger',type:'Guardian',color:'Red',cost:1,strength:1,power:1,guard:0,vitality:1,text:'React — When this attacks, gain 1 Truth.'}];state.phase=2;saveAndRender();});
  await page.waitForTimeout(150);
  const visual=await page.evaluate(()=>{
    const card=document.querySelector('[data-hand-card] .card');if(!card)return {card:false};const rect=e=>e?e.getBoundingClientRect().toJSON():null;
    const leaves=[...card.querySelectorAll('*')].filter(el=>!el.children.length&&/READY TO CAST|INSPECT/i.test((el.textContent||'').trim()));
    return {card:true,type:rect(card.querySelector('.card-type')),badges:rect(card.querySelector('.trigger-badges')),number:rect(card.querySelector('.card-number')),action:rect(leaves[0]||null)};
  });
  assert.equal(visual.card,true);assert.ok(visual.number&&visual.number.height<=20,`card number badge stretched to ${visual.number?.height}`);
  assert.equal(overlaps(visual.type,visual.badges),false,'color/type must not overlap REACT/MANIFEST badges');if(visual.action)assert.equal(overlaps(visual.number,visual.action),false,'card number must not overlap ready/cast/inspect hint');

  step('permanent-stat');
  const permanent=await page.evaluate(()=>{const p=state.players[0],base=p.stats.strength;p.awakeningDeck=[{id:'smoke-aw-perm',number:998,level:998,name:'Smoke Strength',text:'Your Shifter gets +1 Strength.'}];state.active=0;state.phase=5;autoAwakeningThenCleanup();saveAndRender();return {base,after:p.stats.strength};});
  assert.equal(permanent.after,permanent.base+1);

  step('guardian-combat-sequence');
  await page.locator('#newGameBtn').click();if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2&&state.phase===2);
  await page.evaluate(()=>{
    const a=state.players[0],d=state.players[1];a.zones.Guardian=[{id:'smoke-attacker',number:901,name:'Smoke Attacker',type:'Guardian',color:'Red',cost:0,strength:2,power:1,guard:0,vitality:2,text:'No additional effect.',damage:0}];d.zones.Guardian=[{id:'smoke-blocker',number:902,name:'Smoke Blocker',type:'Guardian',color:'Green',cost:0,strength:1,power:1,guard:1,vitality:2,text:'No additional effect.',damage:0}];a.awakeningDeck=[{id:'smoke-aw-combat',number:903,level:903,name:'Smoke Combat Awakening',text:'Your Shifter gets +1 Strength.'}];a.awakeningField=[];a.awakening=0;state.active=0;state.phase=3;state.combat={stage:'declare',attackers:[],blocks:{}};saveAndRender();
  });
  await page.waitForSelector('[data-zone-card="0|Guardian|0"] .combat-select-v044');await page.locator('[data-zone-card="0|Guardian|0"] .combat-select-v044').click();await page.locator('#nextPhaseBtn').click();await page.waitForFunction(()=>state.combat?.stage==='block');await page.locator('[data-zone-card="1|Guardian|0"] .combat-select-v044').click();await page.locator('#nextPhaseBtn').click();await page.waitForFunction(()=>state.phase===6&&state.players[0].awakeningField.length===1);
  const combat=await page.evaluate(()=>({attackerField:state.players[0].zones.Guardian.length,blockerField:state.players[1].zones.Guardian.length,attackerDiscard:state.players[0].discard.some(c=>c.name==='Smoke Attacker'),blockerDiscard:state.players[1].discard.some(c=>c.name==='Smoke Blocker'),awakening:state.players[0].awakeningField[0]?.name,phase:state.phase}));
  assert.equal(combat.attackerField,0);assert.equal(combat.blockerField,0);assert.ok(combat.attackerDiscard&&combat.blockerDiscard);assert.equal(combat.awakening,'Smoke Combat Awakening');assert.equal(combat.phase,6);

  step('shifter-trade-example');
  await page.locator('#newGameBtn').click();if(await page.locator('#confirmDialog[open]').count()) await page.locator('#confirmYes').click();await page.waitForFunction(()=>document.querySelectorAll('.player-board').length===2&&state.phase===2);
  await page.evaluate(()=>{
    const fox=state.players[0],snake=state.players[1];fox.stats={power:1,strength:1,guard:0,vitality:1};snake.stats={power:0,strength:1,guard:1,vitality:1};fox.damage=0;snake.damage=0;fox.flipped=false;snake.flipped=false;fox.reverted=false;snake.reverted=false;fox.zones.Guardian=[];snake.zones.Guardian=[];fox.awakeningDeck=[{id:'smoke-aw-trade',number:995,level:995,name:'Smoke Trade Awakening',text:'No additional effect.'}];fox.awakeningField=[];fox.awakening=0;state.active=0;state.phase=3;state.combat={stage:'declare',attackers:[],blocks:{}};saveAndRender();
  });
  await page.waitForSelector('.player-board .shifter-center .combat-select-v044');const attackButton=page.locator('.player-board').first().locator('.shifter-center .combat-select-v044');await attackButton.click();await page.locator('#nextPhaseBtn').click();await page.waitForFunction(()=>state.combat?.stage==='block');await page.locator('#nextPhaseBtn').click();await page.waitForFunction(()=>state.phase===6);
  const trade=await page.evaluate(()=>({foxFlipped:state.players[0].flipped,snakeFlipped:state.players[1].flipped,foxDamage:state.players[0].damage,snakeDamage:state.players[1].damage,phase:state.phase,buttons:document.querySelectorAll('[data-shifter-flip],[data-revert]').length,log:(state.log||[]).map(x=>typeof x==='string'?x:(x?.text||x?.message||'')).join('\n')}));
  assert.equal(trade.foxFlipped,true);assert.equal(trade.snakeFlipped,true);assert.equal(trade.foxDamage,1);assert.equal(trade.snakeDamage,1);assert.equal(trade.buttons,0);assert.match(trade.log,/dealt 1 back/i);

  assert.deepEqual(errors,[],`browser console/page errors:\n${errors.join('\n')}`);
  console.log('LIVE_SMOKE_PASS',JSON.stringify({version,opening,nextTurn,glamour:glamour.name,float:floatResult.float,handSummary,echoBlocked,cost32,instinct,recovery,direct,influenceOrder,visual,permanent,combat,trade}));
  await browser.close();
})().catch(async err=>{console.error(err.stack||err);process.exit(1);});