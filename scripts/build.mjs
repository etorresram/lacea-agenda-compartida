import fs from 'node:fs';
const page=fs.readFileSync('index.html','utf8');
const slots=JSON.parse(fs.readFileSync('sessions.json','utf8'));
const data='const PAGE='+JSON.stringify(page)+';\nconst SLOTS='+JSON.stringify(slots)+';\n';
const server=fs.readFileSync('server.mjs','utf8').replace("import { PAGE, SLOTS } from './generated.mjs';",data);
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/server/index.js',server);
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.writeFileSync('generated.mjs',data+'export { PAGE,SLOTS };');
