const fs=require('fs');
const path=require('path');

const target=path.join(__dirname,'dist','shifters-v045-patch.js');
let source=fs.readFileSync(target,'utf8');
let applied=[];

const nextUnsafe="function decorateNextButton(){\n    if(state.phase!==3)return;";
const nextSafe="function decorateNextButton(){\n    if(!state||state.phase!==3)return;";
if(source.includes(nextUnsafe)){source=source.replace(nextUnsafe,nextSafe);applied.push('decorateNextButton');}
else if(source.includes(nextSafe))applied.push('decorateNextButton-already-safe');

const observerUnsafe="function decorateV045(){\n    if(v045Decorating)return;v045Decorating=true;";
const observerSafe="function decorateV045(){\n    if(v045Decorating||!state?.players)return;v045Decorating=true;";
if(source.includes(observerUnsafe)){source=source.replace(observerUnsafe,observerSafe);applied.push('decorateV045');}
else if(source.includes(observerSafe))applied.push('decorateV045-already-safe');

const queueUnsafe="function queueDecorateV045(){if(v045DecorateQueued)return;v045DecorateQueued=true;setTimeout(()=>{v045DecorateQueued=false;rootObserverV045?.disconnect();dialogObserverV045?.disconnect();decorateV045();observeV045();},0);}";
const queueSafe="function queueDecorateV045(){if(v045DecorateQueued)return;v045DecorateQueued=true;setTimeout(()=>{v045DecorateQueued=false;rootObserverV045?.disconnect();dialogObserverV045?.disconnect();if(!state?.players)return;decorateV045();observeV045();},0);}";
if(source.includes(queueUnsafe)){source=source.replace(queueUnsafe,queueSafe);applied.push('queueDecorateV045');}
else if(source.includes(queueSafe))applied.push('queueDecorateV045-already-safe');

const renderUnsafe="render=function(){ensureState();priorRender();reflowV044();decorateRevertButtons();decorateCombat();decorateNextButton();updateSubtitle();};";
const renderSafe="render=function(){ensureState();priorRender();if(!state?.players)return;reflowV044();decorateRevertButtons();decorateCombat();decorateNextButton();updateSubtitle();};";
if(source.includes(renderUnsafe)){source=source.replace(renderUnsafe,renderSafe);applied.push('legacy-render');}
else if(source.includes(renderSafe))applied.push('legacy-render-already-safe');

fs.writeFileSync(target,source);
console.log('Applied New Game null-state guards:',applied.join(', ')||'no matching decorators');
