import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCountClues,countNormalizationPool} from '../../scripts/lib/count-clue-normalization.mjs';
import {clueKey} from '../../scripts/lib/puzzle-clues.mjs';

const count=(id,fromHour,toHour,n=0,extra={})=>({id,type:'countDistanceToPlace',
 fromHour,toHour,placeId:'port',distance:2,count:n,...extra});
const permutations=values=>values.length?values.flatMap((v,i)=>permutations(values.filter((_,j)=>i!==j)).map(rest=>[v,...rest])):[[]];
const keys=clues=>clues.map(clueKey).sort();
const truth=(clue,bits)=>{
 let n=0;for(let h=clue.fromHour;h<=clue.toHour;h++)n+=(bits>>h)&1;
 return n===clue.count;
};

for(const [label,raw,expected] of [
 ['overlapping zero',[count('a',3,5),count('b',4,6)],count('H1',3,6)],
 ['adjacent zero',[count('a',1,2),count('b',3,5)],count('H1',1,5)],
 ['overlapping all',[count('a',2,4,3),count('b',3,5,3)],count('H1',2,5,4)],
 ['adjacent all',[count('a',2,3,2),count('b',4,5,2)],count('H1',2,5,4)],
 ['nested all',[count('a',1,6,6),count('b',2,4,3)],count('H1',1,6,6)],
 ['hour zero and singletons',[count('a',0,0),count('b',1,1),count('c',2,6)],count('H1',0,6)]
])test(label+': exact union, provenance, no mutation and idempotence',()=>{
 const before=structuredClone(raw),result=normalizeCountClues(raw);
 assert.equal(result.changed,true);assert.deepEqual(result.clues,[expected]);
 assert.deepEqual(raw,before);assert.equal(result.provenance.rawClues.length,raw.length);
 assert.equal(result.provenance.outputs[0].sources.length,raw.length);
 assert.deepEqual(normalizeCountClues(result.clues).clues,result.clues);
 assert.equal(normalizeCountClues(result.clues).changed,false);
 for(let bits=0;bits<128;bits++)assert.equal(raw.every(c=>truth(c,bits)),truth(result.clues[0],bits));
});

test('all 56 extreme intervals and every pair agree for all 128 hour assignments',()=>{
 let pairs=0;
 for(const all of [false,true])for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)
 for(let c=0;c<=6;c++)for(let d=c;d<=6;d++){
  const raw=[count('a',a,b,all?b-a+1:0),count('b',c,d,all?d-c+1:0)];
  const result=normalizeCountClues(raw);pairs++;
  assert.equal(result.changed,a<=d+1&&c<=b+1);
  for(let bits=0;bits<128;bits++)assert.equal(raw.every(c=>truth(c,bits)),result.clues.every(c=>truth(c,bits)));
 }
 assert.equal(pairs,1568);
});

test('connected groups, bridging intervals and all input permutations have one canonical representation',()=>{
 const raw=[count('z',1,2),count('a',5,6),count('m',2,4),count('n',3,3)];
 const expected=normalizeCountClues(raw);
 assert.equal(expected.clues.length,1);assert.deepEqual(expected.clues,[count('H1',1,6)]);
 for(const input of permutations(raw))assert.equal(JSON.stringify(normalizeCountClues(input)),JSON.stringify(expected));
 // A two-stage pairing produces the same logical normal form.
 const first=normalizeCountClues(raw.slice(0,3)).clues;
 assert.deepEqual(normalizeCountClues([...first,{...raw[3],id:'other'}]).clues,expected.clues);
 assert.deepEqual(JSON.parse(JSON.stringify(expected)),expected);
});

for(const [label,raw] of [
 ['interior counts',[count('a',1,3,1),count('b',2,4,1)]],
 ['different objects',[count('a',1,3),count('b',2,4,0,{placeId:'shore'})]],
 ['different distances',[count('a',1,3),count('b',2,4,0,{distance:3})]],
 ['real gap',[count('a',1,2),count('b',4,6)]],
 ['different predicates',[count('a',1,3),{id:'b',type:'distanceToPlace',hour:4,placeId:'port',distance:2}]],
 ['mixed all and zero',[count('a',1,3),count('b',2,4,3)]],
 ['partial and all',[count('a',1,3,2),count('b',2,4,3)]],
 ['overlap is not additive',[count('a',1,3,2),count('b',2,4,2)]]
])test('unchanged: '+label,()=>{
 const result=normalizeCountClues(raw);assert.equal(result.changed,false);
 assert.deepEqual(keys(result.clues),keys(raw));
 assert.ok(result.provenance.outputs.every(o=>o.rule==='unchanged'));
});

test('uncertain or invalid input fails rather than being repaired',()=>{
 for(const raw of [[count('a',4,2)],[count('a',2,3,3)],[count('a',1,2),count('a',3,4)],
  [count('a',1,2,0,{additionalCondition:true})],[count('a',1,2,0,{distance:9})]])
  assert.throws(()=>normalizeCountClues(raw));
 assert.deepEqual(normalizeCountClues([]).clues,[]);
});

test('auxiliary solver pool covers every subset union without adding selectable clues',()=>{
 const raw=[count('N1',0,1),count('a',1,3),count('b',3,5),count('c',6,6)];
 const before=structuredClone(raw),pool=countNormalizationPool(raw),available=new Set(keys(pool));
 assert.deepEqual(pool.slice(0,raw.length),raw);assert.deepEqual(raw,before);
 assert.equal(new Set(pool.map(c=>c.id)).size,pool.length);
 assert.equal(available.size,pool.length);assert.ok(pool.length<=28);
 for(let bits=1;bits<16;bits++){
  const selected=raw.filter((_,i)=>(bits>>i)&1);
  for(const clue of normalizeCountClues(selected).clues)assert.ok(available.has(clueKey(clue)));
 }
 for(const c of pool.slice(raw.length))assert.ok(c.type==='countDistanceToPlace'&&c.count===0);
});
