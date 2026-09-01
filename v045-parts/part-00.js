(function(){
  'use strict';

  GAME_DATA.version='0.4.5-tabletop-combat';

  const STAT_KEYS=['power','strength','guard','vitality'];
  const titleCase=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const triggerKinds=text=>({react:/\bReact\b/i.test(text||''),manifest:/\bManifest\b/i.test(text||''),awaken:/\bAwaken\b/i.test(text||'')});
  const triggerClass=text=>{const t=triggerKinds(text);return [t.react?'has-react':'',t.manifest?'has-manifest':'',t.awaken?'has-awaken':''].filter(Boolean).join(' ');};
  const triggerBadges=text=>{const t=triggerKinds(text);return `<span class="trigger-badges">${t.react?'<span class="trigger-chip react">REACT</span>':''}${t.manifest?'<span class="trigger-chip manifest">MANIFEST</span>':''}${t.awaken?'<span class="trigger-chip awaken">AWAKEN</span>':''}</span>`;};
  const allEchoes=p=>Object.values(p.echoes||{}).flat();
  const allInfluence=p=>[...allEchoes(p),...(p.zones?.Guardian||[]),...(p.zones?.Relic||[]),...(p.awakeningField||[])];
  const findByName=(p,name)=>allInfluence(p).find(c=>c?.name===name);
  const hasName=(p,name)=>!!findByName(p,name);
  const attackerKey=a=>a.kind==='shifter'?`s-${a.pi}`:`g-${a.pi}-${a.index}`;

  function vstate(p){
    if(!p.v044)p.v044={};
    if(!Number.isFinite(p.v044.floatingGlamour))p.v044.floatingGlamour=0;
    if(!p.v044.turnFlags)p.v044.turnFlags={};
    if(!p.v044.conditionalApplied)p.v044.conditionalApplied={power:0,strength:0,guard:0,vitality:0};
    if(!Number.isFinite(p.v044.discardDebt))p.v044.discardDebt=0;
    if(!Number.isFinite(p.v044.nextRelicDiscount))p.v044.nextRelicDiscount=0;
    if(!p.v044.firstRelicTrigger)p.v044.firstRelicTrigger=false;
    if(!p.v044.untilNextTurn)p.v044.untilNextTurn={power:0,strength:0,guard:0,vitality:0};
    return p.v044;
  }
  function ensureState(){
    if(!state?.players)return;
    state.players.forEach(p=>{
      vstate(p);
      if(!Array.isArray(p.awakeningDiscard))p.awakeningDiscard=[];
      allInfluence(p).forEach(c=>{if(c)applyStaticBuffsForCard(p,c);});
      syncConditionalShifterPassives(p);
    });
    ensureCombatState();
  }
  function ensureCombatState(){
    if(!state)return null;
    const c=state.combat;
    if(!c||!Array.isArray(c.attackers)||!c.blocks){state.combat={stage:'declare',attackers:[],blocks:{}};}
    if(!state.combat.stage)state.combat.stage='declare';
    return state.combat;
  }

  function parseStaticShifterBuffs(c){
    const out=[];const sentences=String(c?.text||'').split(/\.\s*/).map(x=>x.trim()).filter(Boolean);
    sentences.forEach(sentence=>{const m=sentence.match(/^Your Shifter gets \+(\d+) (Power|Strength|Guard|Vitality)$/i);if(m)out.push({amount:+m[1],stat:m[2].toLowerCase()});});
    return out;
  }
  function applyStaticBuffsForCard(p,c){
    if(!c||c._v044StaticApplied)return;
    const buffs=parseStaticShifterBuffs(c); if(!buffs.length)return;
    c._v044StaticApplied=buffs;
    buffs.forEach(b=>p.stats[b.stat]=(p.stats[b.stat]||0)+b.amount);
  }
  function removeStaticBuffsForCard(p,c){
    const buffs=c?._v044StaticApplied;if(!Array.isArray(buffs))return;
    buffs.forEach(b=>p.stats[b.stat]=Math.max(0,(p.stats[b.stat]||0)-b.amount));
    delete c._v044StaticApplied;
  }
  function syncConditionalShifterPassives(p){
    const v=vstate(p),desired={power:0,strength:0,guard:0,vitality:0};
    if((p.zones?.Guardian?.length||0)>=2){
      if(hasName(p,'Many Tails, One Spirit'))desired.power+=1;
      if(hasName(p,'The Brood Endures'))desired.vitality+=1;
    }
    STAT_KEYS.forEach(stat=>{
      const prev=v.conditionalApplied[stat]||0,next=desired[stat]||0,delta=next-prev;
      if(delta)p.stats[stat]=Math.max(0,(p.stats[stat]||0)+delta);
      v.conditionalApplied[stat]=next;
    });
  }

  const priorMakePlayer=makePlayer;
  makePlayer=function(key){const p=priorMakePlayer(key);vstate(p);return p;};

  const priorAvailableGlamour=availableGlamour;
  availableGlamour=function(p){return priorAvailableGlamour(p)+(vstate(p).floatingGlamour||0);};
  autoPay=function(p,cost){
    const v=vstate(p);let remain=Math.max(0,cost||0);
    const fromFloat=Math.min(v.floatingGlamour,remain);v.floatingGlamour-=fromFloat;remain-=fromFloat;
    const candidates=p.glamourField.map((g,i)=>({g,i})).filter(x=>!x.g.tapped).sort((a,b)=>a.g.value-b.g.value);
    for(const x of candidates){
      if(remain<=0)break;
      x.g.tapped=true;remain-=x.g.value;
      if(remain<0){v.floatingGlamour+=-remain;remain=0;}
    }
    return remain<=0;
  };

  const priorEffectiveCost=effectiveCost;
  effectiveCost=function(p,c){
    let cost=priorEffectiveCost(p,c),v=vstate(p);
    if(c?.type==='Relic'){
      const firstDiscount=!v.turnFlags.firstRelicPlayed&&(hasName(p,'Collector’s Instinct')||hasName(p,'Keeper of Offerings')||hasName(p,'Trickster’s Lantern'))?1:0;
      cost=Math.max(0,cost-firstDiscount-Math.min(1,v.nextRelicDiscount||0));
    }
    return cost;
  };

  function addTruth(pi,n,source){
