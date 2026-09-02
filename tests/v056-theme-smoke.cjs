const {chromium}=require('playwright');
const assert=require('assert/strict');
const fs=require('fs');
const BASE=process.env.PLAYTEST_URL||'https://shapeshifters-playtest-wzwi.vercel.app';
const EXPECTED=process.env.EXPECTED_VERSION||'0.5.7-visual-layer-fix';
const fresh=()=>`${BASE}/?v057=${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    let version='';
    for(let i=0;i<30;i++){
      await page.goto(fresh(),{waitUntil:'domcontentloaded',timeout:30000});
      try{await page.waitForFunction(()=>typeof GAME_DATA!=='undefined'&&typeof state!=='undefined'&&state?.players&&document.body.classList.contains('dnd-theme-v056'),{timeout:8000})}catch(_e){}
      version=await page.evaluate(()=>typeof GAME_DATA!=='undefined'?GAME_DATA.version:'');if(version===EXPECTED)break;await sleep(3000);
    }
    assert.equal(version,EXPECTED);
    await page.locator('#newGameBtn').click();if(await page.locator('#confirmDialog[open]').count())await page.locator('#confirmYes').click();
    await page.waitForFunction(()=>state?.players?.length===2&&document.querySelector('.player-board.v055-fox')&&document.querySelector('.player-board.v055-snake'));
    const visual=await page.evaluate(()=>{
      const fox=document.querySelector('.player-board.v055-fox'),snake=document.querySelector('.player-board.v055-snake');
      const shifter=fox.querySelector('.shifter-center'),glamour=fox.querySelector('.glamour'),card=document.querySelector('.card'),button=document.querySelector('button:not(.card)'),echo=fox.querySelector('.echo-ring');
      const echoChild=echo?.firstElementChild||null;
      const f=getComputedStyle(fox),fb=getComputedStyle(fox,'::before'),sc=getComputedStyle(shifter),g=glamour?getComputedStyle(glamour):null,c=card?getComputedStyle(card):null,b=button?getComputedStyle(button):null,body=getComputedStyle(document.body),eb=echo?getComputedStyle(echo,'::before'):null,ec=echoChild?getComputedStyle(echoChild):null;
      return {bodyClass:document.body.classList.contains('dnd-theme-v056'),fox:!!fox,snake:!!snake,
        boardRadius:f.borderRadius,boardBorder:f.borderTopWidth,boardBg:f.backgroundImage,
        ornamentWidth:fb.width,ornamentHeight:fb.height,ornamentTop:fb.top,
        shifterRadius:sc.borderRadius,shifterBorder:sc.borderTopStyle,
        cardRadius:c?.borderRadius||'',cardBorder:c?.borderTopStyle||'',glamourRadius:g?.borderRadius||'',buttonRadius:b?.borderRadius||'',
        echoBeforeZ:eb?.zIndex||'',echoChildZ:ec?.zIndex||'',
        bodyBg:body.backgroundImage,foxStamp:fox.querySelector('.v055-theme-stamp')?.textContent||'',snakeStamp:snake.querySelector('.v055-theme-stamp')?.textContent||''};
    });
    assert.equal(visual.bodyClass,true);assert.equal(visual.fox,true);assert.equal(visual.snake,true);
    assert.equal(visual.boardRadius,'4px');assert.equal(visual.boardBorder,'3px');assert.match(visual.boardBg,/repeating-linear-gradient|linear-gradient/);
    assert.ok(parseFloat(visual.ornamentWidth)<220,`ornament too wide: ${visual.ornamentWidth}`);assert.ok(parseFloat(visual.ornamentHeight)<60,`ornament too tall: ${visual.ornamentHeight}`);assert.equal(visual.ornamentTop,'-10px');
    assert.equal(visual.shifterRadius,'3px');assert.equal(visual.shifterBorder,'double');
    assert.equal(visual.cardRadius,'2px');assert.equal(visual.cardBorder,'double');assert.equal(visual.glamourRadius,'2px');assert.equal(visual.buttonRadius,'2px');
    assert.equal(visual.echoBeforeZ,'0');assert.equal(visual.echoChildZ,'2');
    assert.match(visual.bodyBg,/repeating-linear-gradient/);assert.match(visual.foxStamp,/EMBER COURT/);assert.match(visual.snakeStamp,/COILED COURT/);assert.deepEqual(errors,[]);
    fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/v057-layer-fix.png',fullPage:true});
    console.log('V057_THEME_SMOKE_PASS',JSON.stringify(visual));
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
