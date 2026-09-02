const { chromium }=require('playwright');
const assert=require('assert/strict');
const fs=require('fs');
const BASE=process.env.PLAYTEST_URL||'https://shapeshifters-playtest-wzwi.vercel.app';
const EXPECTED=process.env.EXPECTED_VERSION||'0.5.5-prismatic-tabletop';
const fresh=()=>`${BASE}/?v055=${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    let version='';
    for(let i=0;i<30;i++){
      await page.goto(fresh(),{waitUntil:'domcontentloaded',timeout:30000});
      try{await page.waitForFunction(()=>typeof GAME_DATA!=='undefined'&&typeof state!=='undefined'&&state?.players&&document.body.classList.contains('prismatic-theme-v055'),{timeout:8000})}catch(_e){}
      version=await page.evaluate(()=>typeof GAME_DATA!=='undefined'?GAME_DATA.version:'');if(version===EXPECTED)break;await sleep(3000);
    }
    assert.equal(version,EXPECTED);
    await page.locator('#newGameBtn').click();if(await page.locator('#confirmDialog[open]').count())await page.locator('#confirmYes').click();
    await page.waitForFunction(()=>state?.players?.length===2&&document.querySelector('.player-board.v055-fox')&&document.querySelector('.player-board.v055-snake'));
    const visual=await page.evaluate(()=>{
      const fox=document.querySelector('.player-board.v055-fox'),snake=document.querySelector('.player-board.v055-snake'),shifter=fox.querySelector('.shifter-center'),glamour=fox.querySelector('.glamour'),card=document.querySelector('.card');
      const f=getComputedStyle(fox),s=getComputedStyle(snake),sc=getComputedStyle(shifter),g=glamour?getComputedStyle(glamour):null,c=card?getComputedStyle(card):null;
      return {
        body:document.body.classList.contains('prismatic-theme-v055'),fox:!!fox,snake:!!snake,
        foxAccent:f.getPropertyValue('--v055-a').trim(),snakeAccent:s.getPropertyValue('--v055-a').trim(),
        boardRadius:f.borderRadius,boardBackground:f.backgroundImage,shifterRadius:sc.borderRadius,
        glamourRadius:g?.borderRadius||'',cardRadius:c?.borderRadius||'',cardTagged:card?[...card.classList].some(x=>/^v055-(red|orange|yellow|green|blue|purple)$/.test(x)):false,
        foxStamp:fox.querySelector('.v055-theme-stamp')?.textContent||'',snakeStamp:snake.querySelector('.v055-theme-stamp')?.textContent||''
      };
    });
    assert.equal(visual.body,true);assert.equal(visual.fox,true);assert.equal(visual.snake,true);
    assert.equal(visual.foxAccent,'#ff5a32');assert.equal(visual.snakeAccent,'#28d487');
    assert.equal(visual.boardRadius,'28px');assert.match(visual.boardBackground,/radial-gradient/);assert.equal(visual.shifterRadius,'24px');
    assert.equal(visual.glamourRadius,'18px');assert.equal(visual.cardRadius,'14px');assert.equal(visual.cardTagged,true);
    assert.match(visual.foxStamp,/FOX/);assert.match(visual.snakeStamp,/SNAKE/);assert.deepEqual(errors,[]);
    fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/v055-prismatic.png',fullPage:true});
    console.log('V055_THEME_SMOKE_PASS',JSON.stringify(visual));
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
