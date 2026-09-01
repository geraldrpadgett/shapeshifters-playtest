const fs=require('fs');
const path=require('path');

const target=path.join(__dirname,'dist','shifters-v045-patch.js');
let source=fs.readFileSync(target,'utf8');

function guardPhaseDecorator(name){
  const unsafe=new RegExp(`(function\\s+${name}\\(\\)\\{\\s*)if\\(state(?:\\?\\.)?phase!==3\\)return;`);
  const safe=new RegExp(`function\\s+${name}\\(\\)\\{[\\s\\S]{0,120}?if\\(!state(?:\\?\\.)?players\\|\\|state\\.phase!==3\\)return;`);
  if(unsafe.test(source)){
    source=source.replace(unsafe,`$1if(!state?.players||state.phase!==3)return;`);
  }else if(!safe.test(source)){
    throw new Error(`Could not locate ${name} for New Game null-state guard.`);
  }
}

guardPhaseDecorator('decorateCombat');
guardPhaseDecorator('decorateNextButton');

const decorateUnsafe=/(function\s+decorateV045\(\)\{\s*)if\(v045Decorating\)return;v045Decorating=true;/;
if(decorateUnsafe.test(source)){
  source=source.replace(decorateUnsafe,'$1if(v045Decorating||!state?.players)return;v045Decorating=true;');
}else if(!/function\s+decorateV045\(\)\{[\s\S]{0,120}?v045Decorating\|\|!state\?\.players/.test(source)){
  throw new Error('Could not locate decorateV045 for New Game null-state guard.');
}

fs.writeFileSync(target,source);
console.log('Applied New Game null-state guards to tabletop decorators.');
