    document.querySelectorAll('.v4-tabletop').forEach(table=>{
      if(table.querySelector('.table-layout-v044'))return;
      const support=table.querySelector('.support-row'),echo=table.querySelector('.echo-ring'),auto=table.querySelector('.auto-deck-row'),bottom=table.querySelector('.table-bottom-row');if(!support||!echo||!auto||!bottom)return;
      const piDeck=table.querySelector('[data-board-deck="memory|0"]')?0:table.querySelector('[data-board-deck="memory|1"]')?1:null;if(piDeck===null)return;
      const glamLane=table.querySelector('.glamour-lane'),awakLane=table.querySelector('.awakening-lane'),glamDeck=table.querySelector('.pile-glamour'),awakDeck=table.querySelector('.pile-awakening'),memory=table.querySelector('.memory-dock');if(!glamLane||!awakLane||!glamDeck||!awakDeck||!memory)return;
      const area=document.createElement('div');area.className='area-influence-v044';area.innerHTML='<div class="area-label-v044">AREA OF INFLUENCE</div>';area.appendChild(support);
      const layout=document.createElement('div');layout.className='table-layout-v044';
      const left=document.createElement('aside');left.className='resource-rail-v044 glamour-rail-v044';left.appendChild(glamLane);const gd=document.createElement('div');gd.className='rail-deck-v044';gd.appendChild(glamDeck);left.appendChild(gd);
      const center=document.createElement('div');center.className='center-arena-v044';center.appendChild(echo);const md=document.createElement('div');md.className='memory-center-v044';md.appendChild(memory);center.appendChild(md);
      const right=document.createElement('aside');right.className='resource-rail-v044 awakening-rail-v044';right.appendChild(awakLane);const ad=document.createElement('div');ad.className='rail-deck-v044';ad.appendChild(awakDeck);right.appendChild(ad);
      layout.append(left,center,right);auto.remove();bottom.remove();table.append(area,layout);
      const float=vstate(state.players[piDeck]).floatingGlamour||0;const head=glamLane.querySelector('.lane-head b');if(head)head.textContent=`${availableGlamour(state.players[piDeck])} available${float?` · ${float} floating`:''}`;
      glamLane.querySelectorAll('[data-glamour-field]').forEach(w=>{const [pi,i]=w.dataset.glamourField.split('|');const card=w.querySelector('.glamour');if(card){card.dataset.v044InspectGlamour=`${pi}|${i}`;card.setAttribute('role','button');}});
    });
  }

  function decorateRevertButtons(){
    document.querySelectorAll('[data-revert]').forEach(x=>x.remove());
    document.querySelectorAll('[data-shifter-flip]').forEach(btn=>{const value=(btn.dataset.shifterFlip||'').split('|')[1];btn.textContent=value==='true'?'REVERT':'RECOVER';btn.title=value==='true'?'Revert this Shifter':'Recover this Shifter';});
  }
  function decorateCombat(){
    document.querySelectorAll('.combat-console-v044,.combat-select-v044').forEach(el=>el.remove());
    document.querySelectorAll('.combat-selected-v044').forEach(el=>el.classList.remove('combat-selected-v044'));
    if(state.phase!==3)return;const c=ensureCombatState(),api=state.active,dp=1-api;
    const boardFor=pi=>document.querySelector(`[data-board-deck="memory|${pi}"]`)?.closest('.player-board');const ab=boardFor(api),db=boardFor(dp);if(!ab||!db)return;
    const panel=document.createElement('div');panel.className='combat-console-v044';panel.innerHTML=c.stage==='declare'?`<strong>ATTACK</strong><span>${c.attackers.length?`${c.attackers.length} selected · all target ${state.players[dp].name} Shifter`:'Select your Shifter and/or Guardians'}</span>`:`<strong>BLOCK</strong><span>${Object.keys(c.blocks).length}/${c.attackers.length} attackers blocked · unblocked attackers hit ${state.players[dp].name} Shifter</span>`;ab.querySelector('.tabletop-wrap')?.prepend(panel);
    if(c.stage==='declare'){
      const selected=new Set(c.attackers.map(attackerKey));const s=ab.querySelector('.shifter-center');if(s&&!state.players[api].flipped){const b=document.createElement('button');b.className='combat-select-v044';b.textContent=selected.has(`s-${api}`)?'ATTACKING':'ATTACK';b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleAttacker(api,'shifter',0)};s.appendChild(b);if(selected.has(`s-${api}`))s.classList.add('combat-selected-v044');}
      ab.querySelectorAll(`[data-zone-card^="${api}|Guardian|"]`).forEach(w=>{const idx=+w.dataset.zoneCard.split('|')[2],key=`g-${api}-${idx}`,b=document.createElement('button');b.className='combat-select-v044';b.textContent=selected.has(key)?'ATTACKING':'ATTACK';b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleAttacker(api,'guardian',idx)};w.classList.toggle('combat-selected-v044',selected.has(key));w.appendChild(b);});
    }else{
      db.querySelectorAll(`[data-zone-card^="${dp}|Guardian|"]`).forEach(w=>{const idx=+w.dataset.zoneCard.split('|')[2],assigned=Object.entries(c.blocks).find(([,x])=>x.pi===dp&&x.index===idx),b=document.createElement('button');b.className='combat-select-v044 block';b.textContent=assigned?'BLOCKING':'BLOCK';b.onclick=e=>{e.preventDefault();e.stopPropagation();blockerAssignment(dp,idx)};w.classList.toggle('combat-selected-v044',!!assigned);w.appendChild(b);});
    }
  }
