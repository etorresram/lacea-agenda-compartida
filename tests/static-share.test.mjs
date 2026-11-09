import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const slots=JSON.parse(fs.readFileSync('sessions.json','utf8'));
const code=fs.readFileSync('static/share-client.js','utf8').replace('PROGRAM',JSON.stringify(slots));
function start(url,stored={}){
 const nodes={};class Element{constructor(){this.children=[];this.value='';}append(...a){this.children.push(...a);}replaceChildren(){this.children=[];}setAttribute(k,v){this[k]=v;}select(){}focus(){this.focused=true;}querySelector(q){return nodes[q]??=new Element();}}
 const root=new Element(),location=new URL(url),clipboard={text:'',async writeText(v){this.text=v;}};
 const context={document:{getElementById:()=>root,createElement:()=>new Element()},location,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,btoa,atob,navigator:{clipboard},localStorage:{getItem:k=>stored[k],setItem:(k,v)=>stored[k]=v}};
 vm.runInNewContext(code,context);return {nodes,clipboard,stored};
}
test('Guest selects a session and shares a Unicode-safe snapshot that does not overwrite recipient choices',async()=>{
 const guest=start('https://example.org/agenda/?modo=invitado');
 assert.equal(guest.nodes['#person-name'].value,'');
 assert.equal(guest.nodes['#invite-friend'].hidden,true);
 guest.nodes['#send-selection'].onclick();assert.match(guest.nodes['#share-status'].textContent,/Escribe tu nombre/);
 guest.nodes['#person-name'].value='César Mora';guest.nodes['#person-name'].onchange();
 guest.nodes['#day-nav'].children[1].onclick();
 guest.nodes['#events'].children.find(r=>r.children[0].textContent==='17:30').children[1].onclick();
 const options=guest.nodes['#inspector'].children.filter(n=>n.className?.split(' ').includes('option'));
 options[2].children[0].onchange();
 assert.ok(guest.nodes['#events'].children.some(row=>row.children.some(n=>n.className?.includes('chosen-course'))));
 assert.equal(guest.nodes['#inspector'].children.filter(n=>n.className?.split(' ').includes('option'))[2].className,'option chosen-option');
 guest.nodes['#send-selection'].onclick();await Promise.resolve();
 const link=guest.nodes['#result-url'].value;assert.ok(link.includes('#agenda='));assert.ok(!link.includes('modo='));
 const stored={'lacea-owner-v1':JSON.stringify({v:1,name:'Eric',owner:true,picks:{eco:1}})};
 const reader=start(link,stored);
 assert.match(reader.nodes['#day-title'].textContent,/Miércoles 11/);
 reader.nodes['#day-nav'].children[1].onclick();
 reader.nodes['#events'].children.find(r=>r.children[0].textContent==='17:30').children[1].onclick();
 assert.equal(reader.nodes['#shared-view'].textContent,'Selección de César Mora');
 assert.equal(reader.nodes['#send-selection'].disabled,true);
 assert.equal(reader.nodes['#person-name'].value,'César Mora');
 const received=reader.nodes['#inspector'].children.filter(n=>n.className?.split(' ').includes('option'))[2];
 assert.equal(received.className,'option chosen-option');
 assert.equal(received.children[0].disabled,true);
 assert.ok(received.children[1].children.some(n=>n.textContent==='✓ Seleccionado por César Mora'));
 assert.ok(reader.nodes['#events'].children.some(row=>row.children.some(n=>n.className?.includes('chosen-course'))));
 assert.equal(reader.nodes['#inspector'].children.filter(n=>n.className?.split(' ').includes('option'))[2].children[0].checked,true);
 assert.equal(JSON.parse(stored['lacea-owner-v1']).picks.eco,1);
 reader.nodes['#my-view'].onclick();assert.equal(reader.nodes['#send-selection'].disabled,false);
 assert.equal(reader.nodes['#person-name'].value,'Eric');
 assert.equal(reader.nodes['#inspector'].children.filter(n=>n.className?.split(' ').includes('option'))[1].children[0].checked,true);
});
test('Read-only selected options override blue checked and disabled styles',()=>{
 const html=fs.readFileSync('docs/index.html','utf8');
 assert.match(html,/#lacea-dash \.option\.chosen-option:has\(input:checked\),#lacea-dash \.option\.chosen-option:has\(input:disabled\)\{background:var\(--selected-fill\);border-color:var\(--selected-green\);opacity:1\}/);
 assert.match(html,/#lacea-dash \.event\.chosen-course\[aria-pressed=true\]\{outline-color:var\(--selected-green\)\}/);
});
test('Invite link is clean; malformed snapshots fall back safely',()=>{
 const owner=start('https://example.org/agenda/');owner.nodes['#invite-friend'].onclick();assert.equal(owner.nodes['#result-url'].value,'https://example.org/agenda/?modo=invitado');
 const bad=start('https://example.org/agenda/#agenda=not-valid');assert.match(bad.nodes['#share-status'].textContent,/no es válido/);
});
test('Wednesday shows both occupied time and overlapping Bonhomme I; guest can select the lecture',()=>{
 const owner=start('https://example.org/agenda/');
 assert.match(owner.nodes['#day-title'].textContent,/Miércoles 11/);
 const rows=owner.nodes['#events'].children;
 assert.ok(rows.some(r=>r.children[0].textContent==='09:00'&&r.children[1].children.some(n=>n.textContent==='Agenda ocupada')));
 const lecture=rows.find(r=>r.children[0].textContent==='10:00');
 assert.ok(lecture);assert.equal(lecture.children[0].children[0].textContent,'12:00');
 lecture.children[1].onclick();
 assert.ok(owner.nodes['#inspector'].children.some(n=>n.textContent==='Opciones de este bloque'));
 const guest=start('https://example.org/agenda/?modo=invitado');guest.nodes['#day-nav'].children[0].onclick();
 assert.ok(guest.nodes['#events'].children.some(r=>r.children[0].textContent==='10:00'));
 const first=guest.nodes['#inspector'].children.find(n=>n.className?.split(' ').includes('option'));
 first.children[0].onchange();
 assert.equal(JSON.parse(guest.stored['lacea-guest-v1']).picks.b1,0);
});
test('Fresh agendas start empty and RIDGE remains fixed for owners and guests',()=>{
 for(const suffix of ['', '?modo=invitado']){
  const app=start('https://example.org/agenda/'+suffix);
  assert.equal(app.nodes['#picked'].textContent,'00');
  app.nodes['#day-nav'].children[1].onclick();
  const ridge=app.nodes['#events'].children.find(r=>r.children[1].className==='event ridge');
  assert.ok(ridge);
  assert.ok(ridge.children[1].children.some(n=>n.textContent==='RIDGE · horario fijo'));
  ridge.children[1].onclick();
  assert.equal(app.nodes['#inspector'].children.some(n=>n.className?.split(' ').includes('option')),false);
  assert.ok(app.nodes['#inspector'].children.some(n=>n.textContent?.includes('Enrique Mendoza')));
  assert.equal(app.nodes['#picked'].textContent,'00');
 }
});
test('Previously shared links open with no selections while retaining the sender name',()=>{
 const old={v:1,name:'César Mora',owner:false,picks:{eco:2,b1:0,ss1:0}};
 const code=Buffer.from(JSON.stringify(old)).toString('base64url');
 const reader=start('https://example.org/agenda/#agenda='+code);
 assert.equal(reader.nodes['#person-name'].value,'César Mora');
 assert.equal(reader.nodes['#picked'].textContent,'00');
 for(const day of reader.nodes['#day-nav'].children){
  day.onclick();
  assert.equal(reader.nodes['#events'].children.some(r=>r.children[1].className.includes('chosen-course')),false);
 }
});
