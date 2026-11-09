(()=>{
const root=document.getElementById('lacea-dash'),slots=PROGRAM;
const names={11:'Miércoles',12:'Jueves',13:'Viernes',14:'Sábado'};
let day=12,selected='eco',room=null,viewMine=true,busy=false,roomId=new URLSearchParams(location.search).get('room'),invite=new URLSearchParams(location.hash.slice(1)).get('invite');
const status=document.getElementById('sync-status');
const get=(q)=>root.querySelector(q);
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function button(text,fn){const b=el('button','action',text);b.type='button';b.onclick=fn;return b;}
function report(text,error=false){status.textContent=text;status.className=error?'sync error':'sync';}
async function api(path,method='GET',data){const res=await fetch(path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await res.json();if(!res.ok){const e=new Error(result.error||'No se pudo guardar.');e.status=res.status;throw e;}return result;}
function mine(){return room?.members.find(m=>m.mine);}
function other(){return room?.members.find(m=>!m.mine);}
function active(){return viewMine?mine():other();}
function choice(s,m=active()){const c=m?.choices[s.id];return Number.isInteger(c)&&c>=0&&c<s.options.length?c:-1;}
function selection(s,m=active()){const i=choice(s,m);return i<0?['Sin elegir','Elige una sesión',[]]:s.options[i];}
function fixed(s){return s.type==='fixed';}
function required(s){return s.type==='ridge'&&active()?.owner;}
function render(){
const nav=get('#day-nav');nav.replaceChildren();
for(const d of [11,12,13,14]){const b=button('',()=>{day=d;selected=slots.find(s=>s.day===d&&!fixed(s)).id;render();});b.className='day';b.setAttribute('aria-pressed',String(day===d));b.append(el('span','date',String(d)));const info=el('span');info.append(el('span','weekday',names[d]),el('small','',d===11?'Econometría':'Sesiones y alternativas'));b.append(info);nav.append(b);}
get('#picked').textContent=String(slots.filter(s=>!fixed(s)&&choice(s)>=0).length).padStart(2,'0');get('#day-title').textContent=names[day]+' '+day;
const tabs=get('#people');tabs.replaceChildren();
if(room){for(const m of room.members){const b=button(m.name+(m.mine?' · Tú':''),()=>{viewMine=m.mine;render();});b.setAttribute('aria-pressed',String(m.mine===viewMine));tabs.append(b);}if(!other())tabs.append(el('span','waiting','Esperando a tu invitado'));
get('#invite-button').hidden=!room.isOwner;get('#access').hidden=true;get('#workspace-wrap').hidden=false;}else{get('#invite-button').hidden=true;get('#workspace-wrap').hidden=true;}
const events=get('#events');events.replaceChildren();
for(const s of slots.filter(s=>s.day===day&&(!fixed(s)||active()?.owner))){const row=el('div','event-row'),time=el('div','time',s.start);time.append(el('small','',s.end));const b=button('',()=>{selected=s.id;render();});b.className='event '+s.type;b.setAttribute('aria-pressed',String(selected===s.id));const o=fixed(s)?s.options[0]:selection(s);b.append(el('span','kind',fixed(s)?'Reservado':required(s)?'RIDGE · obligatorio':s.type==='ridge'?'RIDGE':'LACEA'),el('strong','',o[0]));if(o[2]?.length)b.append(el('span','authors-preview',o[2].map(a=>a.join(' · ')).join(' / ')));const loc=el('span','location');loc.append(el('span','',o[1]));if(!fixed(s)&&mine()&&other()&&choice(s,mine())>=0&&choice(s,mine())===choice(s,other()))loc.append(el('span','together','Coinciden'));else if(!fixed(s)&&other()&&choice(s,other())>=0)loc.append(el('span','options-count',other().name+' ya eligió'));b.append(loc);row.append(time,b);events.append(row);}
const s=slots.find(s=>s.id===selected&&s.day===day)||slots.find(s=>s.day===day&&!fixed(s));if(!s)return;selected=s.id;const panel=get('#inspector');panel.replaceChildren();const o=fixed(s)?s.options[0]:selection(s);panel.append(el('span','tag',viewMine?'TU ELECCIÓN':'AGENDA DE '+(active()?.name||'TU INVITADO')),el('h3','',o[0]));const meta=el('div','meta');meta.append(el('span','',names[day]+' '+day+' de noviembre'),el('span','',s.start+' — '+s.end),el('span','',o[1]));panel.append(meta);
if(o[2]?.length){panel.append(el('div','choose-title','Autores / ponentes'));for(const a of o[2]){const p=el('div','person');p.append(el('div','person-name',a[0]),el('div','affiliation',a[1]));panel.append(p);}}
else if(!fixed(s)&&choice(s)>=0)panel.append(el('div','note','Ponentes no detallados en el programa oficial.'));
if(!fixed(s)){panel.append(el('div','choose-title',required(s)?'Asistencia obligatoria':'Opciones de este bloque'));const opts=required(s)?s.options:[...s.options,['Dejar sin elegir','',[]]];opts.forEach((o,i)=>{const val=i===s.options.length?-1:i;const label=el('label','option');const radio=el('input');radio.type='radio';radio.name='session';radio.checked=choice(s)===val;radio.disabled=!viewMine||busy||required(s);const t=el('span','',o[0]);t.append(el('small','',o[1]));if(o[2]?.length)t.append(el('small','',o[2].map(a=>a.join(' — ')).join(' / ')));radio.onchange=()=>setChoice(s,val);label.append(radio,t);panel.append(label);});}
if(other()&&!fixed(s)){const i=choice(s,other());panel.append(el('div','note',other().name+': '+(i>=0?s.options[i][0]:'todavía no ha elegido')));}
if(s.type==='ridge')panel.append(el('div','note','Aula RIDGE pendiente de confirmación.'));
}
async function refresh(){if(!roomId)return;try{room=await api('/api/rooms/'+roomId);render();report('Sincronizado · '+new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}));}catch(e){report(e.message,true);}}
async function setChoice(s,value){if(busy)return;busy=true;render();report('Guardando…');try{await api('/api/rooms/'+roomId+'/choices','PUT',{slot:s.id,choice:value});await refresh();}catch(e){report(e.message,true);}finally{busy=false;render();}}
function shareLink(token){const link=new URL(location.origin);link.searchParams.set('room',roomId);link.hash='invite='+token;const area=get('#share-area');area.hidden=false;const field=get('#share-link');field.value=link.href;get('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(field.value);report('Enlace copiado. Envíalo a César.');}catch{field.select();report('Copia el enlace seleccionado.');}};}
get('#invite-button').onclick=async()=>{try{const result=await api('/api/rooms/'+roomId+'/invite','POST',{});shareLink(result.invite);}catch(e){report(e.message,true);}};
get('#refresh').onclick=refresh;
get('#join-form').onsubmit=async e=>{e.preventDefault();const name=get('#display-name').value.trim();if(!name)return;const submit=get('#submit-room');submit.disabled=true;try{if(invite&&roomId){await api('/api/rooms/'+roomId+'/join','POST',{name,invite});history.replaceState(null,'','?room='+roomId);invite=null;}else{const result=await api('/api/rooms','POST',{name});roomId=result.id;history.replaceState(null,'','?room='+roomId);shareLink(result.invite);}await refresh();}catch(e){report(e.message,true);}finally{submit.disabled=false;}};
async function init(){render();get('#access').hidden=false;get('#submit-room').textContent=invite?'Unirme a la agenda':'Crear agenda compartida';get('#access-title').textContent=invite?'Te invitaron a planear LACEA.':'Planeen LACEA juntos.';const returnTo=location.pathname+location.search+location.hash;get('#signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent(returnTo);try{await api('/api/me');get('#signin').hidden=true;get('#join-form').hidden=false;if(roomId&&!invite)await refresh();else report('Listo para compartir.');}catch(e){get('#join-form').hidden=true;report(e.status===401?'Inicia sesión para guardar tus elecciones.':e.message,e.status!==401);}}
init();setInterval(()=>{if(roomId&&room&&!document.hidden&&!busy)refresh();},15000);
})();
