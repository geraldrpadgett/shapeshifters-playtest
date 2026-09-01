const fs=require('fs');
const path=require('path');

const target=path.join(__dirname,'dist','shifters-v045-patch.js');
let source=fs.readFileSync(target,'utf8');

const unsafe="function decorateNextButton(){\n    if(state.phase!==3)return;";
const safe="function decorateNextButton(){\n    if(!state||state.phase!==3)return;";

if(!source.includes(unsafe)){
  throw new Error('Expected v0.4.5 decorateNextButton null-state pattern was not found.');
}

source=source.replace(unsafe,safe);
fs.writeFileSync(target,source);
console.log('Applied v0.4.9 New Game null-state render guard.');
