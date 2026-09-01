(function(){
  'use strict';

  GAME_DATA.version='0.4.7-trigger-timing';

  function triggerKinds047(text){
    const raw=String(text||'').trim();
    const manifest=/(?:^|[.!?]\s+)Manifest\s*[—-]/i.test(raw);
    const awaken=/(?:^|[.!?]\s+)Awaken\s*[—-]/i.test(raw);
    const explicitReact=/(?:^|[.!?]\s+)React\s*[—-]/i.test(raw);
    const timingReact=!manifest && /(?:^|[.!?]\s+)(?:Whenever|When|The first time)\b/i.test(raw);
    return {react:explicitReact||timingReact,manifest,awaken};
  }
  function triggerClass047(text){
    const t=triggerKinds047(text);
    return [t.react?'has-react':'',t.manifest?'has-manifest':'',t.awaken?'has-awaken':''].filter(Boolean).join(' ');
  }
  function triggerBadges047(text){
    const t=triggerKinds047(text);
    return `<span class="trigger-badges">${t.react?'<span class="trigger-chip react">REACT</span>':''}${t.manifest?'<span class="trigger-chip manifest">MANIFEST</span>':''}${t.awaken?'<span class="trigger-chip awaken">AWAKEN</span>':''}</span>`;
  }

  cardMarkup=function(c){
    const stats=c.type==='Guardian'?`S ${c.strength} · P ${c.power} · G ${c.guard} · V ${c.vitality}${c.damage?` · D ${c.damage}`:''}`:'';
    const tokens=c.storedRenown?`<span class="card-tokens">◆ ${c.storedRenown}</span>`:'';
    const number=c.number||Number((String(c.id||'').match(/(\d+)/)||[])[1]||0);
    return `<article class="card ${triggerClass047(c.text)}" style="${cardStyle(c)}">${number?`<span class="card-number">#${number}</span>`:''}<span class="cost">${c.cost}</span>${triggerBadges047(c.text)}<div class="card-type">${esc(c.color)} · ${esc(c.type)}${c.subtype?` — ${esc(c.subtype)}`:''}</div><div class="card-name">${esc(c.name)}</div><div class="card-text">${esc(c.text)}</div>${stats?`<div class="card-stats">${stats}</div>`:''}${tokens}</article>`;
  };

  awakeningMarkup=function(a,key){
    return `<div class="ability-card ${triggerClass047(a.text)}"><span class="card-number">#${a.number||a.level}</span>${triggerBadges047(a.text)}<img src="${GAME_DATA.shifters[key].symbol}" alt=""><strong>${esc(a.name)}</strong><span>${esc(a.text)}</span></div>`;
  };

  glamourMarkup=function(g,cls=''){
    return `<div class="glamour ${cls} ${g.tapped?'tapped':''} ${triggerClass047(g.text)}" title="Tap to inspect ${esc(g.name||'Glamour')}"><small class="glamour-number">#${g.number||''}</small>${triggerBadges047(g.text)}<span class="glamour-value">${g.value}</span><small class="glamour-title">${esc(g.name||'Glamour')}</small></div>`;
  };

  const detailBefore047=cardDetail;
  cardDetail=function(c,extraActions='',tokenPanel=''){
    let html=detailBefore047(c,extraActions,tokenPanel);
    html=html.replace(/^<div class="detail-trigger-row">[\s\S]*?<\/div>/,'');
    return `<div class="detail-trigger-row">${triggerBadges047(c?.text)}</div>`+html;
  };

  console.info('Shapeshifters v0.4.7 trigger timing rules active');
})();
