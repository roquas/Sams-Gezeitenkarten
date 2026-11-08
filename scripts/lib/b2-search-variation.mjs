// Offline experiment only. No production caller or change to baseline seeds.
import {randomStream} from '../../src/generation/random.mjs';
import {SearchBudgetExceeded} from './puzzle-route-solver.mjs';
export const DIVERSIFIED_STRATEGY='bounded-weak-reduction-1';
const shuffled=(values,random)=>{
 const a=[...values];for(let i=a.length-1;i>0;i--){const j=random.integer(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
};
export function weakReductionSearch({clues,solver,seed,budgets,onCandidate,window=8}){
 if(!Number.isSafeInteger(window)||window<1||window>32)throw Error('Invalid exploration window');
 const failures={};let restarts=0,reducedSets=0;
 const add=reason=>{failures[reason]=(failures[reason]??0)+1;};
 try{
  const empty=solver.check([]);
  if(!empty.count)return {restarts,reducedSets,failures:{NO_LEGAL_ROUTE:1},exhaustive:true};
  while(restarts<budgets.maxRestarts){
   const random=randomStream(seed,DIVERSIFIED_STRATEGY+'/'+restarts++);
   let pending=shuffled(clues.map((_,i)=>i),random),selected=[],current=empty;
   while(current.count>1&&pending.length){
    const options=[],retained=[];let cursor=0;
    // Inspect at most window progressing alternatives. Failed progress can
    // never become progress after intersecting further conditions.
    for(;cursor<pending.length&&options.length<window;cursor++){
     const index=pending[cursor],result=solver.check([...selected,index]);
     if(result.count<current.count)options.push({index,result});else add('NO_PROGRESS');
    }
    if(!options.length)break;
    // Ties prefer the weaker standalone condition; otherwise a final
    // shortcut could erase all previously accumulated partial conditions.
    const best=options.reduce((a,b)=>b.result.count>a.result.count||
     (b.result.count===a.result.count&&solver.check([b.index]).count>solver.check([a.index]).count)?b:a);
    for(const option of options)if(option!==best)retained.push(option.index);
    pending=[...retained,...pending.slice(cursor)];selected.push(best.index);current=best.result;
   }
   if(current.count!==1){add('POOL_NOT_UNIQUE');continue;}
   for(const index of shuffled(selected,random)){
    const reduced=selected.filter(i=>i!==index);
    if(solver.check(reduced).count===1)selected=reduced;
   }
   reducedSets++;
   const outcome=onCandidate(selected,solver);
   if(outcome!==true)add(typeof outcome==='string'?outcome:'DUPLICATE_VARIANT');
   if(empty.count===1)return {restarts,reducedSets,failures,exhaustive:true};
  }
  add('RESTART_BUDGET_EXHAUSTED');
 }catch(error){if(!(error instanceof SearchBudgetExceeded))throw error;add(error.reason);}
 return {restarts,reducedSets,failures,exhaustive:false};
}
