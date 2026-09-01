const fs=require('fs');
const path=require('path');

const target=path.join(__dirname,'dist','shifters-v045-patch.js');
let source=fs.readFileSync(target,'utf8');

function guard(unsafe,safe,label){
  if(!source.includes(unsafe))throw new Error(`Expected ${label} null-state pattern was not found.`);
  source=source.replace(unsafe,safe);
}

guard(
  "function decorateCombat(){\n    if(state.phase!==3)return;",
  "function decorateCombat(){\n    if(!state?.players||state.phase!==3)return;",
  'decorateCombat'
);

guard(
  "function decorateNextButton(){\n    if(state.phase!==3)return;",
  "function decorateNextButton(){\n    if(!state?.players||state.phase!==3)return;",
  'decorateNextButton'
);

guard(
  "function decorateV045(){\n    if(v045Decorating)return;v045Decorating=true;",
  "function decorateV045(){\n    if(v045Decorating||!state?.players)return;v045Decorating=true;",
  'decorateV045'
);

fs.writeFileSync(target,source);
console.log('Applied New Game null-state guards to tabletop decorators.');
