const fs=require('fs');
const path=require('path');
const out=path.join(__dirname,'dist');
for(const name of ['shifters-v053-fantasy.css','shifters-v053-fantasy.js']){
  fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
}
const indexPath=path.join(out,'index.html');
let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/\s*<link[^>]*shifters-v053-fantasy\.css[^>]*>/ig,'');
html=html.replace(/\s*<script[^>]*shifters-v053-fantasy\.js[^>]*><\/script>/ig,'');
html=html.replace('</head>','  <link rel="stylesheet" href="shifters-v053-fantasy.css">\n</head>');
html=html.replace('</body>','  <script src="shifters-v053-fantasy.js"></script>\n</body>');
fs.writeFileSync(indexPath,html);
console.log('Applied Shapeshifters v0.5.3 premium fantasy tabletop theme.');
