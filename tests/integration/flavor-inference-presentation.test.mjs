// Synthetic transport fixtures only; never an independent quality judgment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInferenceReviewFiles,createInferenceGroupFiles} from '../../scripts/lib/flavor-inference-presentation.mjs';
import {sha256} from '../../scripts/lib/content-hash.mjs';
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function adversarialPng(){
 const base=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
 for(let pad=0;pad<3;pad++){const data=Buffer.concat([Buffer.alloc(pad),Buffer.from('E01A','base64')]),body=Buffer.concat([Buffer.from('teSt'),data]),chunk=Buffer.alloc(12+data.length);chunk.writeUInt32BE(data.length);body.copy(chunk,4);chunk.writeUInt32BE(crc(body),8+data.length);const png=Buffer.concat([base.subarray(0,-12),chunk,base.subarray(-12)]);if(png.toString('base64').includes('E01'))return png;}
 assert.fail('fixture must exercise the dangerous base64 substring');
}
const unesc=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[k]));
function verify(html,members){
 const images=[...html.matchAll(/<img\b[^>]*>/g)];assert.equal(images.length,members.length);
 images.forEach(([tag],i)=>{const src=/src="([^"]+)"/.exec(tag)?.[1];assert.ok(src?.startsWith('data:image/png;base64,'));const b64=src.slice('data:image/png;base64,'.length);assert.match(b64,/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);const bytes=Buffer.from(b64,'base64');assert.equal(bytes.toString('base64'),b64);assert.deepEqual(bytes,members[i].files.get(members[i].number+'-K01.png'));});
 const normative=[...html.matchAll(/<h2>(.*?)<\/h2><pre>([\s\S]*?)<\/pre>/g)].map(([,n,b])=>[unesc(n),unesc(b)]);
 assert.deepEqual(normative,members.flatMap(m=>[...m.files].filter(([n])=>n.endsWith('.json')&&n!=='inventory.json'||n.endsWith('.md')).map(([n,b])=>[n,String(b)])));
}
function member(number){const source=new Map([['rules.md',Buffer.from('SYNTHETIC E01 MARKER\n<normative> & unchanged\n')],['world/world.md',Buffer.from('E01 / normative world\n')]]),jobBytes=Buffer.from(JSON.stringify({jobId:'synthetic-'+number,inputHash:'unchanged',methodHash:'pinned',claimIds:['c1'],input:{text:'SYNTHETIC E01 MARKER'}})+'\n'),schemaBytes=Buffer.from('{"description":"SYNTHETIC E01 MARKER","const":"E01"}\n');return {number,files:createInferenceReviewFiles({number,source,jobBytes,schemaBytes,png:adversarialPng()})};}
test('individual inference reading versions preserve every embedded PNG and normative E01 source',()=>{
 for(const number of ['E02-1','E04-2']){const m=member(number),html=m.files.get(number+'-LESEFASSUNG.html');verify(html,[m]);assert.match(html,new RegExp('<title>'+number+' · Reviewer'));assert.match(html,/SYNTHETIC E01 MARKER/);assert.match(m.files.get(number+'-START.txt'),new RegExp(number+'\\.response\\.json'));const inv=JSON.parse(m.files.get('inventory.json'));for(const [n,h] of Object.entries(inv))assert.equal(sha256(m.files.get(n)),h);}
});
test('combined inference groups preserve all cards, normative sources and byte-identical individual fallbacks',()=>{
 const members=[member('E02-1'),member('E02-2')],files=createInferenceGroupFiles(members,'E02');verify(files.get('E02-LESEFASSUNG.html'),members);assert.match(files.get('E02-START.txt'),/E02 · Reviewer/);
 for(const m of members){for(const [n,b] of m.files)assert.deepEqual(files.get(m.number+'/'+n),b);verify(files.get(m.number+'/'+m.number+'-LESEFASSUNG.html'),[m]);}for(const [n,h] of Object.entries(JSON.parse(files.get('group-inventory.json'))))assert.equal(sha256(files.get(n)),h);
});
test('the byte/source assertions detect the former global substitution in single and combined versions',()=>{
 const m=member('E02-1');assert.throws(()=>verify(m.files.get('E02-1-LESEFASSUNG.html').replaceAll('E01','E02-1'),[m]));
 const files=createInferenceGroupFiles([m,member('E02-2')],'E02');assert.throws(()=>verify(files.get('E02-LESEFASSUNG.html').replaceAll('E01','E02'),[m,member('E02-2')]));
});
