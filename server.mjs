import { PAGE, SLOTS } from './generated.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const one=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).first();
const run=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).run();
async function body(req){if(Number(req.headers.get('content-length')||0)>8192)throw Error('body');const text=await req.text();if(text.length>8192)throw Error('body');return JSON.parse(text);}
function name(value){return typeof value==='string'?value.trim().slice(0,60):'';}
export default {
 async fetch(req,env){
  const url=new URL(req.url),path=url.pathname;
  if(!path.startsWith('/api/'))return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com;"}});
  const uid=req.headers.get('oai-authenticated-user-id');
  if(!uid)return json({error:'Inicia sesión con ChatGPT para compartir tu agenda.'},401);
  if(req.method!=='GET'&&req.headers.get('origin')!==url.origin)return json({error:'Origen no autorizado.'},403);
  try{
   if(path==='/api/me')return json({authenticated:true});
   if(path==='/api/rooms'&&req.method==='POST'){
    const data=await body(req),label=name(data.name);if(!label)return json({error:'Escribe tu nombre.'},400);
    const id=crypto.randomUUID(),invite=token(),now=new Date().toISOString();
    const choices=Object.fromEntries(SLOTS.filter(s=>s.type!=='fixed').map(s=>[s.id,s.id==='b1'?-1:0]));
    await env.DB.batch([env.DB.prepare('INSERT INTO rooms VALUES (?,?,?,?)').bind(id,uid,await sha(invite),now),env.DB.prepare('INSERT INTO members VALUES (?,?,?,?,?)').bind(id,uid,label,JSON.stringify(choices),now)]);
    return json({id,invite},201);
   }
   const match=path.match(/^\/api\/rooms\/([a-f0-9-]{36})(?:\/(join|choices|invite))?$/);
   if(!match)return json({error:'No encontrado.'},404);
   const [,id,action]=match,room=await one(env,'SELECT * FROM rooms WHERE id=?',id);
   if(!room)return json({error:'Agenda no encontrada.'},404);
   if(action==='join'&&req.method==='POST'){
    const data=await body(req),label=name(data.name);if(!label||typeof data.invite!=='string'||await sha(data.invite)!==room.invite_hash)return json({error:'Invitación no válida.'},403);
    const now=new Date().toISOString();
    await run(env,'INSERT INTO members (room_id,user_id,display_name,choices,updated_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM members WHERE room_id=?)<2 ON CONFLICT(room_id,user_id) DO NOTHING',id,uid,label,'{}',now,id);
    if(!await one(env,'SELECT user_id FROM members WHERE room_id=? AND user_id=?',id,uid))return json({error:'Esta agenda ya tiene dos participantes.'},409);
    return json({id});
   }
   const me=await one(env,'SELECT * FROM members WHERE room_id=? AND user_id=?',id,uid);
   if(!me)return json({error:'Necesitas la invitación para acceder a esta agenda.'},403);
   if(action==='invite'&&req.method==='POST'){
    if(room.owner_id!==uid)return json({error:'Solo quien creó la agenda puede invitar.'},403);
    const invite=token();await run(env,'UPDATE rooms SET invite_hash=? WHERE id=?',await sha(invite),id);return json({invite});
   }
   if(action==='choices'&&req.method==='PUT'){
    const data=await body(req),slot=SLOTS.find(s=>s.id===data.slot);
    if(!slot||slot.type==='fixed'||!Number.isInteger(data.choice)||data.choice< -1||data.choice>=slot.options.length)return json({error:'Selección no válida.'},400);
    if(room.owner_id===uid&&slot.type==='ridge'&&data.choice!==0)return json({error:'Esta sesión RIDGE es obligatoria para tu agenda.'},400);
    await run(env,'UPDATE members SET choices=json_set(choices,?,?),updated_at=? WHERE room_id=? AND user_id=?','$.'+slot.id,data.choice,new Date().toISOString(),id,uid);
    return json({saved:true});
   }
   if(!action&&req.method==='GET'){
    const result=await env.DB.prepare('SELECT user_id,display_name,choices,updated_at FROM members WHERE room_id=? ORDER BY rowid').bind(id).all();
    return json({id,isOwner:room.owner_id===uid,members:result.results.map(m=>({name:m.display_name,mine:m.user_id===uid,owner:m.user_id===room.owner_id,choices:JSON.parse(m.choices),updatedAt:m.updated_at}))});
   }
   return json({error:'Método no permitido.'},405);
  }catch(e){console.error('agenda_api_error',e.message);return json({error:'No se pudo completar la operación. Inténtalo de nuevo.'},500);}
 }
};
