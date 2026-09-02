const fs=require('fs');
const path=require('path');

const target=path.join(__dirname,'dist','shifters-v051-patch.js');
let source=fs.readFileSync(target,'utf8');
function swap(oldText,newText,label){
  if(!source.includes(oldText))throw new Error('v0.5.1 UI post-build patch failed: '+label);
  source=source.replace(oldText,newText);
}

swap(
`  function reorderInfluence051(){
    document.querySelectorAll('.area-influence-v044 .support-row').forEach(row=>{
      const zones=[...row.children].filter(el=>el.classList?.contains('table-zone')||/GUARDIAN|RELIC/i.test(el.textContent||''));
      const relic=zones.find(el=>/\\bRELICS?\\b/i.test(el.textContent||'')),guardian=zones.find(el=>/\\bGUARDIANS?\\b/i.test(el.textContent||''));
      if(relic&&guardian){row.appendChild(relic);row.appendChild(guardian);}
    });
  }`,
`  function reorderInfluence051(){
    document.querySelectorAll('.area-influence-v044 .support-row').forEach(row=>{
      const zones=[...row.children].filter(el=>el.classList?.contains('table-zone')||/GUARDIAN|RELIC/i.test(el.textContent||''));
      const relic=zones.find(el=>/\\bRELICS?\\b/i.test(el.textContent||'')),guardian=zones.find(el=>/\\bGUARDIANS?\\b/i.test(el.textContent||''));
      if(relic&&guardian){const children=[...row.children];if(children.indexOf(relic)>children.indexOf(guardian))row.insertBefore(relic,guardian);}
    });
  }`,
  'stable Relic/Guardian ordering'
);

swap(
`  function decorateActiveHand051(){
    if(!state?.players)return;
    const dialog=[...document.querySelectorAll('dialog[open]')].find(d=>/ACTIVE HAND/i.test(d.textContent||'')||d.querySelector('[data-hand-card]'));if(!dialog)return;
    const p=state.players[state.active];if(!p)return;
    const available=typeof availableGlamour==='function'?availableGlamour(p):(p.glamourField||[]).filter(g=>!g.tapped).reduce((s,g)=>s+(g.value||0),0)+(p.v044?.floatingGlamour||0);
    const total=(p.glamourField||[]).reduce((s,g)=>s+(Number(g.value)||0),0);
    let badge=dialog.querySelector('.hand-glamour-summary-v051');if(!badge){badge=document.createElement('div');badge.className='hand-glamour-summary-v051';const head=dialog.querySelector('.modal-head');if(head)head.insertAdjacentElement('afterend',badge);else dialog.prepend(badge);}
    badge.textContent=\`Glamour: \${available} available · \${total} total on field\`;
  }`,
`  function decorateActiveHand051(){
    if(!state?.players)return;
    const cards=[...document.querySelectorAll('[data-hand-card]')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;});if(!cards.length)return;
    let group=cards[0].parentElement;while(group&& !cards.every(c=>group.contains(c)))group=group.parentElement;if(!group)return;
    const p=state.players[state.active];if(!p)return;
    const available=typeof availableGlamour==='function'?availableGlamour(p):(p.glamourField||[]).filter(g=>!g.tapped).reduce((s,g)=>s+(g.value||0),0)+(p.v044?.floatingGlamour||0);
    const total=(p.glamourField||[]).reduce((s,g)=>s+(Number(g.value)||0),0);
    const host=group.parentElement||group;let badge=host.querySelector(':scope > .hand-glamour-summary-v051');if(!badge){badge=document.createElement('div');badge.className='hand-glamour-summary-v051';if(group.parentElement)group.insertAdjacentElement('beforebegin',badge);else group.prepend(badge);}
    badge.textContent=\`Glamour: \${available} available · \${total} total on field\`;
  }`,
  'Active Hand Glamour summary attachment'
);

swap(
`  new MutationObserver(queue051).observe(document.getElementById('gameRoot')||document.body,{childList:true,subtree:true});
  new MutationObserver(queue051).observe(document.getElementById('cardDialog')||document.body,{childList:true,subtree:true});`,
`  new MutationObserver(queue051).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});`,
  'Active Hand observer coverage'
);

fs.writeFileSync(target,source);
console.log('Applied Shapeshifters v0.5.1 Active Hand UI hardening.');
