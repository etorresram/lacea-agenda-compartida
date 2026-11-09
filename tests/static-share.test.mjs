import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const slots=JSON.parse(fs.readFileSync('sessions.json','utf8'));
const code=fs.readFileSync('static/share-client.js','utf8').replace('PROGRAM',JSON.stringify(slots));
function start(url,stored={}){
 const nodes={};class Element{constructor(){this.children=[];this.value='';}append(...a){this.children.push(...a);}replaceChildren(){this.children=[];}setAttribute(k,v){this[k]=v;}select(){}querySelector(q){return nodes[q]??=new Element();}}
 const root=new Element(),location=new URL(url),clipboard={text:'',async writeText(v){this.text=v;}};
 const context={document:{getElementById:()=>root,createElement:()=>new Element()},location,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,btoa,atob,navigator:{clipboard},localStorage:{getItem:k=>stored[k],setItem:(k,v)=>stored[k]=v}};
 vm.runInNewContext(code,context);return {nodes,clipboard,stored};
}
test('Guest selects a session and shares a Unicode-safe snapshot that does not overwrite recipient choices',async()=>{
 const guest=start('https://example.org/agenda/?modo=invitado');
 assert.equal(guest.nodes['#person-name'].value,'César');
 const options=guest.nodes['#inspector'].children.filter(n=>n.className==='option');
 options[2].children[0].onchange();
 guest.nodes['#send-selection'].onclick();await Promise.resolve();
 const link=guest.nodes['#result-url'].value;assert.ok(link.includes('#agenda='));assert.ok(!link.includes('modo='));
 const stored={'lacea-owner-v1':JSON.stringify({v:1,name:'Eric',owner:true,picks:{eco:1}})};
 const reader=start(link,stored);
 assert.equal(reader.nodes['#shared-view'].textContent,'Selección de César');
 assert.equal(reader.nodes['#send-selection'].disabled,true);
 assert.equal(reader.nodes['#inspector'].children.filter(n=>n.className==='option')[2].children[0].checked,true);
 assert.equal(JSON.parse(stored['lacea-owner-v1']).picks.eco,1);
 reader.nodes['#my-view'].onclick();assert.equal(reader.nodes['#send-selection'].disabled,false);
 assert.equal(reader.nodes['#inspector'].children.filter(n=>n.className==='option')[1].children[0].checked,true);
});
test('Invite link is clean; malformed snapshots fall back safely',()=>{
 const owner=start('https://example.org/agenda/');owner.nodes['#invite-friend'].onclick();assert.equal(owner.nodes['#result-url'].value,'https://example.org/agenda/?modo=invitado');
 const bad=start('https://example.org/agenda/#agenda=not-valid');assert.match(bad.nodes['#share-status'].textContent,/no es válido/);
});
