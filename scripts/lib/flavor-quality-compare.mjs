// Isolated clue conjunctions, never the saved target or the other clues.
import assert from 'node:assert/strict';
import {createRules} from '../../src/engine/puzzle.mjs';
import {validateLogic} from '../../src/engine/validate.mjs';
import {normalizeCountClues} from './count-clue-normalization.mjs';
import {canonicalJson} from './content-hash.mjs';
import {hash,interpretationFor} from './flavor-quality-contract.mjs';

export const COMPARE_METHOD='isolated-engine-conjunction-1';
export function normalForm(atoms){
 const distinct=[...new Map(atoms.map(a=>{const {id,...meaning}=a;return [canonicalJson(meaning),meaning];})).values()];
 return normalizeCountClues(distinct.map((a,i)=>({...a,id:'A'+(i+1)}))).clues.map(({id,...a})=>a);
}
export function compareClue({map,start,steps,original,atoms,unresolved=[]},{maxNodes=250000,maxExamples=2}={}){
 assert.ok(Number.isSafeInteger(maxNodes)&&maxNodes>0&&maxNodes<=250000,'flavor quality: invalid search budget');
 assert.ok(Number.isSafeInteger(maxExamples)&&maxExamples>=1&&maxExamples<=5,'flavor quality: invalid witness limit');
 const base={map,start,steps,clues:[]};validateLogic({...base,clues:[original]});
 const interpretation=atoms.map((a,i)=>({...a,id:'A'+(i+1)}));validateLogic({...base,clues:interpretation});
 const rules=createRules(base),originalForm=normalForm([original]),interpretationForm=normalForm(interpretation);
 const sameNormalForm=canonicalJson(originalForm)===canonicalJson(interpretationForm);
 const budget={remaining:maxNodes};let complete=true,routes=0,originalOnly=0,interpretationOnly=0,originalTrue=0,interpretationTrue=0;
 const witnesses={originalOnly:[],interpretationOnly:[]};
 try{
  for(const route of rules.routes([start],budget)){
   // Legal base validation is explicit, even if the generator contract changes.
   assert.ok(rules.legal(route),'flavor quality: engine emitted illegal witness');routes++;
   const left=rules.matches(route,original),right=interpretation.every(c=>rules.matches(route,c));
   if(left)originalTrue++;if(right)interpretationTrue++;
   if(left&&!right){originalOnly++;if(witnesses.originalOnly.length<maxExamples)witnesses.originalOnly.push({route,original:true,interpretation:false});}
   if(right&&!left){interpretationOnly++;if(witnesses.interpretationOnly.length<maxExamples)witnesses.interpretationOnly.push({route,original:false,interpretation:true});}
  }
 }catch(error){
  // Only the engine's explicit node-budget signal is an incomplete search.
  // Input, filesystem and programming errors remain operational errors.
  if(error.message!=='Suchbudget überschritten; Eindeutigkeit nicht bewiesen')throw error;
  complete=false;
 }
 let result;
 if(!complete)result=originalOnly||interpretationOnly?'different-incomplete':'incomparable';
 else if(!routes)result='incomparable';
 else if(!originalOnly&&!interpretationOnly)result='equivalent';
 else if(originalOnly&&!interpretationOnly)result='strengthened';
 else if(interpretationOnly&&!originalOnly)result='weakened';
 else result='changed';
 const completeInterpretation=unresolved.length===0;
 if(!completeInterpretation)result='incomparable';
 return {clueId:original.id,result,completeInterpretation,unresolved:[...unresolved],method:COMPARE_METHOD,
 proof:sameNormalForm?'canonical-atoms-and-safe-count-normalization':'joint-conjunction-engine-enumeration',
 scope:{maxNodes,nodesVisited:maxNodes-budget.remaining,enumerationComplete:complete,legalRoutes:routes,
 emptyBase:complete&&routes===0,otherCluesUsed:false,savedTargetUsed:false},
 counts:{originalTrue,interpretationTrue,originalOnly,interpretationOnly,exact:complete},witnesses,
 originalForm,interpretationForm};
}
export function compareReaderItem(publicItem,reader,originals,options){
 const chart=publicItem.input.chart;
 return {method:COMPARE_METHOD,publicInputHash:publicItem.inputHash,readerHash:hash(reader),
 clues:originals.map(original=>compareClue({...chart,original,...interpretationFor(reader,original.id)},options)),
 limit:'Compares submitted interpretations only. Interpretation errors, extra prose information and deduction disclosure require independent review.'};
}
