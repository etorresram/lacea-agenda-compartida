(()=>{
const root=document.getElementById('lacea-dash'),slots=PROGRAM;
const names={11:'Miércoles',12:'Jueves',13:'Viernes',14:'Sábado'};
const guest=new URLSearchParams(location.search).get('modo')==='invitado';
const key=guest?'lacea-guest-v1':'lacea-owner-v1';
const blank=Object.fromEntries(slots.filter(s=>s.type!=='fixed').map(s=>[s.id,guest||s.id==='b1'?-1:0]));
let own={v:1,name:guest?'':'Eric',owner:!guest,picks:blank},shared=null,viewShared=false,day=12,selected='eco';
function clean(p){if(!p||p.v!==1||typeof p.name!=='string'||!p.picks||typeof p.picks!=='object')throw Error('Enlace no válido');const picks={};for(const s of slots){const n=p.picks[s.id];if(s.type!=='fixed')picks[s.id]=Number.isInteger(n)&&n>=-1&&n<s.options.length?n:-1;}return {v:1,name:p.name.trim().slice(0,60)||'Invitado',owner:p.owner===true,picks};}
function encode(p){const b=new TextEncoder().encode(JSON.stringify(p));return btoa(Array.from(b,c=>String.fromCharCode(c)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(s){if(s.length>8000)throw Error('Enlace demasiado largo');return clean(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))));}
try{const saved=localStorage.getItem(key);if(saved)own=clean(JSON.parse(saved));}catch{}
let error='';try{const code=new URLSearchParams(location.hash.slice(1)).get('agenda');if(code){shared=decode(code);viewShared=true;}}catch{error='El enlace de selección no es válido. Puedes crear tu propia agenda.';}
const get=q=>root.querySelector(q);
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function current(){return viewShared?shared:own;}
function pick(s,p=current()){return Number.isInteger(p?.picks[s.id])?p.picks[s.id]:-1;}
function opt(s,p=current()){if(s.type==='fixed')return s.options[0];const i=pick(s,p);return i>=0?s.options[i]:['Sin elegir','Espacio disponible',[]];}
function save(){try{localStorage.setItem(key,JSON.stringify(own));get('#share-status').textContent='Selección guardada en este navegador.';}catch{get('#share-status').textContent='Tu navegador no permite guardar. Copia el enlace para conservar tu selección.';}get('#share-result').hidden=true;}
function render(){
get('#invite-friend').hidden=guest||viewShared;get('#my-view').hidden=guest&&!shared;get('.share-help').textContent=guest?'Escribe tu nombre, selecciona tus cursos y genera el enlace para compartir tu selección.':'Invita a César o genera un enlace con tu selección. Cada enlace conserva las elecciones de ese momento.';get('#person-name').value=current().name;get('#my-view').setAttribute('aria-pressed',String(!viewShared));get('#shared-view').hidden=!shared;if(shared){get('#shared-view').textContent='Selección de '+shared.name;get('#shared-view').setAttribute('aria-pressed',String(viewShared));}get('#send-selection').disabled=viewShared;get('#person-name').disabled=viewShared;
const nav=get('#day-nav');nav.replaceChildren();for(const d of [11,12,13,14]){const b=el('button','day');b.type='button';b.setAttribute('aria-pressed',String(day===d));b.append(el('span','date',String(d)));const info=el('span');info.append(el('span','weekday',names[d]),el('small','',d===11?'Econometría':'Sesiones y alternativas'));b.append(info);b.onclick=()=>{day=d;selected=slots.find(s=>s.day===d&&s.type!=='fixed').id;render();};nav.append(b);}
get('#picked').textContent=String(slots.filter(s=>s.type!=='fixed'&&pick(s)>=0).length).padStart(2,'0');get('#day-title').textContent=names[day]+' '+day+' · '+(current().name||'Tu agenda');
const events=get('#events');events.replaceChildren();const visible=slots.filter(s=>s.day===day&&(s.type!=='fixed'||current().owner));
for(const s of visible){const row=el('div','event-row'),time=el('div','time',s.start);time.append(el('small','',s.end));const b=el('button','event '+s.type+(s.type!=='fixed'&&pick(s)>=0?' chosen-course':''));b.type='button';b.setAttribute('aria-pressed',String(selected===s.id));const o=opt(s);b.append(el('span','kind',s.type==='fixed'?'Agenda ocupada':s.type==='ridge'?(current().owner?'RIDGE · obligatorio':'RIDGE'):'Sesión LACEA'),el('strong','',o[0]));if(o[2]?.length)b.append(el('span','authors-preview',o[2].map(a=>a.join(' · ')).join(' / ')));const loc=el('span','location');loc.append(el('span','',o[1]));if(shared&&s.type!=='fixed'&&pick(s,own)>=0&&pick(s,own)===pick(s,shared))loc.append(el('span','together','Coinciden'));else if(s.options.length>1)loc.append(el('span','options-count',s.options.length+' opciones'));b.append(loc);b.onclick=()=>{selected=s.id;render();};row.append(time,b);events.append(row);}
const s=visible.find(s=>s.id===selected)||visible[0];if(!s)return;selected=s.id;const panel=get('#inspector');panel.replaceChildren();const o=opt(s);panel.append(el('span','tag',viewShared?'SELECCIÓN RECIBIDA':'TU SELECCIÓN'),el('h3','',o[0]));const meta=el('div','meta');meta.append(el('span','',s.start+' — '+s.end),el('span','',o[1]));panel.append(meta);
if(o[2]?.length){panel.append(el('div','choose-title','Autores / ponentes'));for(const a of o[2]){const person=el('div','person');person.append(el('div','person-name',a[0]),el('div','affiliation',a[1]));panel.append(person);}}
else if(pick(s)>=0&&s.type!=='fixed')panel.append(el('div','note','Ponentes no detallados en el programa oficial.'));
if(s.type!=='fixed'){const required=current().owner&&s.type==='ridge';panel.append(el('div','choose-title',required?'Asistencia obligatoria':'Opciones de este bloque'));const options=required?s.options:[...s.options,['Dejar sin elegir','',[]]];options.forEach((o,i)=>{const value=i===s.options.length?-1:i;const label=el('label','option'+(value>=0&&pick(s)===value?' chosen-option':'')),radio=el('input');radio.type='radio';radio.name='lacea-session';radio.checked=pick(s)===value;radio.disabled=viewShared||required;const t=el('span','',o[0]);t.append(el('small','',o[1]));if(o[2]?.length)t.append(el('small','',o[2].map(a=>a.join(' — ')).join(' / ')));radio.onchange=()=>{own.picks[s.id]=value;save();render();};if(value>=0&&pick(s)===value)t.append(el('span','selection-proof','✓ Seleccionado'+(viewShared?' por '+shared.name:'')));label.append(radio,t);panel.append(label);});}
if(shared&&s.type!=='fixed'){const counterpart=viewShared?own:shared;panel.append(el('div','note',counterpart.name+': '+opt(s,counterpart)[0]));}
if(s.type==='ridge')panel.append(el('div','note','Aula RIDGE pendiente de confirmación.'));
}
function base(){const url=new URL(location.href);url.search='';url.hash='';return url;}
async function reveal(url,label){get('#share-result').hidden=false;get('#result-label').textContent=label;get('#result-url').value=url;try{await navigator.clipboard.writeText(url);get('#share-status').textContent='Enlace copiado. Envíalo por WhatsApp o correo.';}catch{get('#result-url').select();get('#share-status').textContent='Copia el enlace que aparece debajo.';}}
get('#invite-friend').onclick=()=>{const url=base();url.searchParams.set('modo','invitado');reveal(url.href,'Enlace para que César haga su selección');};
get('#send-selection').onclick=()=>{const name=get('#person-name').value.trim().slice(0,60);if(!name){get('#share-status').textContent='Escribe tu nombre antes de generar el enlace.';get('#person-name').focus();return;}own.name=name;save();const url=base();url.hash='agenda='+encode(own);reveal(url.href,'Enlace con tu selección actual');};
get('#copy-result').onclick=()=>reveal(get('#result-url').value,get('#result-label').textContent);
get('#person-name').onchange=()=>{own.name=get('#person-name').value.trim().slice(0,60);save();render();};
get('#my-view').onclick=()=>{viewShared=false;render();};get('#shared-view').onclick=()=>{viewShared=true;render();};
get('#share-status').textContent=error||(shared?'Estás viendo la selección que '+shared.name+' compartió.':guest?'Escribe tu nombre y elige tus cursos. Se resaltarán en verde.':'Invita a César o comparte tu selección.');
render();
})();
