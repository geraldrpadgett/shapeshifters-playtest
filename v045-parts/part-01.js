    if(!n)return;const p=state.players[pi];p.renown=Math.max(0,p.renown+n);if(n>0)state.metrics.renownGained[p.key]+=n;else state.metrics.renownLost[p.key]+=Math.abs(n);addLog(`${p.name} ${n>0?'gained':'lost'} ${Math.abs(n)} Truth${source?` from ${source}`:''}.`,pi);if(p.renown>=GAME_DATA.victoryRenown&&!state.winner)state.winner=p.key;
  }
  function addTemp(pi,stat,n,bucket,source){
    const p=state.players[pi];p.stats[stat]=(p.stats[stat]||0)+n;
    if(!p.tempMods[bucket])p.tempMods[bucket]={power:0,strength:0,guard:0,vitality:0};
    p.tempMods[bucket][stat]=(p.tempMods[bucket][stat]||0)+n;
    addLog(`${p.name} gets +${n} ${titleCase(stat)}${bucket==='endCombat'?' for this combat':' until end of turn'}${source?` from ${source}`:''}.`,pi);
  }
  function addUntilNextTurn(pi,stat,n,source){
    const p=state.players[pi],v=vstate(p);p.stats[stat]=(p.stats[stat]||0)+n;v.untilNextTurn[stat]=(v.untilNextTurn[stat]||0)+n;addLog(`${p.name} gets +${n} ${titleCase(stat)} until its next turn${source?` from ${source}`:''}.`,pi);
  }
  function clearUntilNextTurn(p){const v=vstate(p);STAT_KEYS.forEach(stat=>{const n=v.untilNextTurn[stat]||0;if(n)p.stats[stat]=Math.max(0,(p.stats[stat]||0)-n);v.untilNextTurn[stat]=0;});}
  function rawAutoDraw(pi,n,source){
    const p=state.players[pi];let count=0;for(let i=0;i<n;i++){if(rawDrawMemory(p)){count++;state.metrics.memoryDraws[p.key]++;}}
    if(count)addLog(`${p.name} drew ${count} Memory card${count===1?'':'s'}${source?` from ${source}`:''}.`,pi);
  }
  function markDiscardDebt(pi,n,source){const p=state.players[pi],v=vstate(p);v.discardDebt+=n;addLog(`${p.name} must discard ${n} Memory card${n===1?'':'s'}${source?` for ${source}`:''}.`,pi);setTimeout(()=>{if(canControlPlayer(pi)){openMyHandDialog(false);toast(`Discard ${v.discardDebt} card${v.discardDebt===1?'':'s'} to finish the effect.`);}},0);}
  function revertShifter(pi,source){
    const p=state.players[pi];if(p.flipped)return;p.flipped=true;p.reverted=false;state.metrics.reversions[p.key]++;addLog(`${p.name} Reverted${source?` from ${source}`:''}.`,pi);
  }
  function damageShifter(pi,n,source,direct=false){
    if(n<=0)return 0;const p=state.players[pi];p.damage=Math.max(0,(p.damage||0)+n);addLog(`${p.name} took ${n}${direct?' direct':''} damage${source?` from ${source}`:''} → ${p.damage}/${p.stats.vitality}.`,pi);if(p.damage>=p.stats.vitality)revertShifter(pi,source);return n;
  }
  function directDamage(fromPi,n,source){
    const target=1-fromPi;damageShifter(target,n,source,true);
    const p=state.players[fromPi],v=vstate(p);
    if(!v.turnFlags.directDamageTriggered){
      v.turnFlags.directDamageTriggered=true;
      const shrine=p.zones.Relic.find(c=>c.name==='Shrine of Embers');if(shrine){shrine.storedRenown=(shrine.storedRenown||0)+3;addLog(`${shrine.name} stored 3 Truth.`,fromPi);}
      if(hasName(p,'Burning Essence'))autoTurnGlamour(fromPi,{ready:true,source:'Burning Essence'});
    }
  }
  function resolveManifest(pi,c){
    if(!c||c._v044ManifestResolved||!/\bManifest\b/i.test(c.text||''))return;
    c._v044ManifestResolved=true;const p=state.players[pi],v=vstate(p),txt=c.text||'';
    const direct=(txt.match(/Manifest[^.]*Deal (\d+) direct damage/i)||[])[1];if(direct)directDamage(pi,+direct,c.name);
    let m=txt.match(/Manifest[^.]*Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality) until end of turn/i);if(m)addTemp(pi,m[2].toLowerCase(),+m[1],'endTurn',c.name);
    m=txt.match(/Manifest[^.]*Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality)\./i);if(m&&!/until end of turn/i.test(m[0])){p.stats[m[2].toLowerCase()]+=+m[1];addLog(`${p.name} permanently gets +${m[1]} ${m[2]} from ${c.name}.`,pi);}
    if(/Manifest[^.]*Draw 2 cards/i.test(txt)){rawAutoDraw(pi,2,c.name);if(/discard 1 card/i.test(txt))markDiscardDebt(pi,1,c.name);}else if(/Manifest[^.]*Draw 1 card/i.test(txt)&&!/may draw/i.test(txt)){rawAutoDraw(pi,1,c.name);if(/discard 1 card/i.test(txt))markDiscardDebt(pi,1,c.name);}
    if(/Manifest[^.]*Flip 1 Glamour/i.test(txt))autoTurnGlamour(pi,{ready:true,source:c.name});
    if(/Manifest[^.]*next Relic this turn costs 1 less Glamour/i.test(txt))v.nextRelicDiscount=Math.max(v.nextRelicDiscount,1);
    if(/Manifest[^.]*first time one of your Relics triggers this turn, gain 3 Truth/i.test(txt))v.firstRelicTrigger=true;
    if(/Manifest[^.]*If you control a Relic, your Shifter gets \+1 (Power|Guard) this turn/i.test(txt)&&p.zones.Relic.length)addTemp(pi,RegExp.$1.toLowerCase(),1,'endTurn',c.name);
    if(/Manifest[^.]*If you control a Relic, gain 3 Truth/i.test(txt)&&p.zones.Relic.length)addTruth(pi,3,c.name);
    if(/Manifest[^.]*If you control a Wrath Echo, gain 3 Truth/i.test(txt)&&(p.echoes.Red||[]).length)addTruth(pi,3,c.name);
  }
  function resolveManifestReacts(pi,c){
    const p=state.players[pi],v=vstate(p),txt=c?.text||'';
    if(c?.type==='Guardian'){
      if(hasName(p,'Trickster’s Pack')&&!v.turnFlags.guardianManifestTruth){v.turnFlags.guardianManifestTruth=true;addTruth(pi,3,'Trickster’s Pack');}
      if(hasName(p,'Kindle the Pack'))addTemp(pi,'power',1,'endTurn','Kindle the Pack');
