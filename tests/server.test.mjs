import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import worker from '../server.mjs';
function setup(){const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0000_agenda.sql','utf8'));const prepare=sql=>{let args=[];return {bind(...a){args=a;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return db.prepare(sql).run(...args);}};};return {DB:{prepare,async batch(items){db.exec('BEGIN');try{const out=[];for(const x of items)out.push(await x.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}}};}
async function call(env,path,uid='eric',method='GET',data,origin='https://test.local'){const headers={};if(uid)headers['oai-authenticated-user-id']=uid;if(method!=='GET')headers.origin=origin;const response=await worker.fetch(new Request('https://test.local'+path,{method,headers,body:data?JSON.stringify(data):undefined}),env);return {status:response.status,data:await response.json()};}
test('shared room isolation, invitation, individual choices, and mandatory sessions',async()=>{
 const env=setup();assert.equal((await call(env,'/api/me',null)).status,401);
 const made=await call(env,'/api/rooms','eric','POST',{name:'Eric'});assert.equal(made.status,201);const {id,invite}=made.data;const url='/api/rooms/'+id;
 assert.equal((await call(env,url,'stranger')).status,403);
 assert.equal((await call(env,url+'/join','cesar','POST',{name:'César',invite:'wrong'})).status,403);
 assert.equal((await call(env,url+'/join','cesar','POST',{name:'César',invite})).status,200);
 assert.equal((await call(env,url+'/join','third','POST',{name:'Third',invite})).status,409);
 assert.equal((await call(env,url+'/choices','cesar','PUT',{slot:'eco',choice:2})).status,200);
 let room=(await call(env,url)).data;assert.equal(room.members[0].choices.eco,0);assert.equal(room.members[1].choices.eco,2);assert.equal(room.members[1].name,'César');assert.ok(!JSON.stringify(room).includes('user_id'));
 assert.equal((await call(env,url+'/choices','eric','PUT',{slot:'ss1',choice:-1})).status,400);
 assert.equal((await call(env,url+'/choices','cesar','PUT',{slot:'ss1',choice:-1})).status,200);
 assert.equal((await call(env,url+'/choices','cesar','PUT',{slot:'eco',choice:99})).status,400);
 assert.equal((await call(env,url+'/choices','cesar','PUT',{slot:'eco',choice:0},'https://evil.test')).status,403);
 assert.equal((await call(env,url+'/invite','cesar','POST',{})).status,403);
});
