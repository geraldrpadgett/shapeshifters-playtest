const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'dist');
const gamePath=path.join(out,'shifters-v045-patch.js');
let game=fs.readFileSync(gamePath,'utf8');

function required(oldText,newText,label){
  if(!game.includes(oldText))throw new Error('v0.5.2 post-build patch failed: '+label);
  game=game.replace(oldText,newText);
}

// Shifter damage is event-based, never cumulative. Keep only the most recent
// event for display and test lethality against that event alone.
required(
  "if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct':''} damage${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;",
  "const p=state.players[pi],eventDamage=Math.max(0,Number(n)||0);p.damage=eventDamage;if(eventDamage<=0)return 0;addLog(`${p.name} took ${eventDamage}${direct?' direct':''} damage${source?` from ${source}`:''} as one event → ${eventDamage}/${p.stats.vitality}. Shifter damage does not accumulate.`,pi);if(eventDamage>=p.stats.vitality)revertShifter(pi,source);return eventDamage;",
  'non-accumulating Shifter damage'
);

// Glamour mirrors Awakening: 18-card deck, maximum nine manifested. From the
// 10th reveal onward, keep the current nine or replace exactly one. The revealed
// card does not Manifest unless it actually enters the field.
const oldAuto=`  const priorAutoTurnGlamour=autoTurnGlamour;
  autoTurnGlamour=function(pi,opts){const g=priorAutoTurnGlamour(pi,opts||{});if(g)resolveManifest(pi,g);return g;};`;
const newAuto=`  const priorAutoTurnGlamour=autoTurnGlamour;
  autoTurnGlamour=function(pi,opts){
    const options=opts||{},p=state.players[pi],limit=9;
    if((p.glamourField||[]).length>=limit){
      const g=rawDrawGlamour(p);if(!p.flags)p.flags={};p.flags.glamourDrawn=true;
      if(!g){addLog(\`${'${p.name}'} has no Glamour left to turn.\`,pi);return null;}
      if(!Array.isArray(p.glamourDiscard))p.glamourDiscard=[];
      state.pendingGlamour={pi,card:g,opts:{ready:!!options.ready,source:options.source||'turn'}};
      addLog(\`${'${p.name}'} revealed ${'${g.name||`Glamour ${g.value}`}'}; with 9 Glamour manifested, choose whether to keep the current nine or replace one.\`,pi);
      setTimeout(()=>window.openGlamourChoice052?.(),0);
      return null;
    }
    const g=priorAutoTurnGlamour(pi,options);if(g)resolveManifest(pi,g);return g;
  };
  window.resolveGlamourChoice052=function(replaceIndex=null){
    const pending=state?.pendingGlamour;if(!pending)return false;const p=state.players[pending.pi],g=pending.card,options=pending.opts||{};
    if(!Array.isArray(p.glamourDiscard))p.glamourDiscard=[];snapshot();
    const dialog=document.getElementById('glamourChoiceDialog');if(dialog?.open)dialog.close();
    if(Number.isInteger(replaceIndex)&&replaceIndex>=0&&replaceIndex<p.glamourField.length){
      const old=p.glamourField[replaceIndex],turnStart=(options.source||'turn')==='turn';
      const entering={...g,tapped:turnStart?false:!options.ready,instanceId:\`${'${g.id||`glamour-${g.number||g.value}`}'}-${'${Math.random().toString(36).slice(2,7)}'}\`};
      p.glamourField[replaceIndex]=entering;p.glamourDiscard.push(old);if(!p.flags)p.flags={};p.flags.glamourPlayed=true;
      if(state.metrics?.glamourPlayed?.[p.key]!==undefined)state.metrics.glamourPlayed[p.key]++;
      state.pendingGlamour=null;addLog(\`${'${p.name}'} replaced ${'${old.name||`Glamour ${old.value}`}'} with ${'${entering.name||`Glamour ${entering.value}`}'}; the new Glamour manifested.\`,pending.pi);
      resolveManifest(pending.pi,entering);toast(\`${'${entering.name||`Glamour ${entering.value}`}'} replaced ${'${old.name||`Glamour ${old.value}`}'}\`);
    }else{
      p.glamourDiscard.push(g);state.pendingGlamour=null;addLog(\`${'${p.name}'} kept the current nine Glamour; ${'${g.name||`Glamour ${g.value}`}'} was set aside without manifesting.\`,pending.pi);toast(\`Kept current 9 · ${'${g.name||`Glamour ${g.value}`}'} set aside.\`);
    }
    saveAndRender();if(state.pendingGlamour)setTimeout(()=>window.openGlamourChoice052?.(),0);return true;
  };`;
required(oldAuto,newAuto,'nine-card Glamour choice engine');

fs.writeFileSync(gamePath,game);

// The legacy renderer still emitted manual Shifter flip/revert controls and the
// v0.5.1 decorator removed them a tick later. Remove them at build time so they
// never exist or flash in the DOM.
const appPath=path.join(out,'app.js');
let app=fs.readFileSync(appPath,'utf8');
const appBefore=app;
app=app.replace(/<button class="button primary" data-shifter-flip="[^"]+">Flip Face Up<\/button>/g,'');
app=app.replace(/<button class="shifter-flip-corner" data-shifter-flip="[^"]+" title="[^"]*">FLIP<\/button>\s*/g,'');
app=app.replace(/<button class="mini-btn revert-only" data-revert="[^"]+">[^<]*<\/button>/g,'');
if(app===appBefore)throw new Error('v0.5.2 post-build patch failed: legacy Shifter controls were not found');
fs.writeFileSync(appPath,app);

// Pause the automatic Memory draw / Cast advance while a 10th Glamour choice is pending.
const uiPath=path.join(out,'shifters-v051-patch.js');
let ui=fs.readFileSync(uiPath,'utf8');
const oldGuard="if(typeof state==='undefined'||!state?.players||state.winner||state.pendingAwakening||typeof nextPhase!=='function')return;";
const newGuard="if(typeof state==='undefined'||!state?.players||state.winner||state.pendingAwakening||state.pendingGlamour||typeof nextPhase!=='function')return;";
if(!ui.includes(oldGuard))throw new Error('v0.5.2 post-build patch failed: automatic opening pending-Glamour guard');
ui=ui.replace(oldGuard,newGuard);
fs.writeFileSync(uiPath,ui);

for(const name of ['shifters-v052-patch.js','shifters-v052-patch.css'])fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<link[^>]*shifters-v052-patch\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v052-patch\.js[^>]*><\/script>/ig,'');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v052-patch.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v052-patch.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Applied Shapeshifters v0.5.2 non-accumulating Shifter damage and nine-Glamour cap.');
