// Betatest data is deliberately independent of resettable game saves.
export const FEEDBACK_SCHEMA_VERSION=1;
export const PREFIX='gezeitenkarten-beta-v1:';
export function puzzleIdentity(puzzle,scope){
 const identity=puzzle.identity??{};
 return {catalog:scope,puzzleId:puzzle.id,schemaVersion:puzzle.schemaVersion,dataVersion:puzzle.dataVersion,rulesVersion:puzzle.rulesVersion,
  mapStructureId:identity.mapStructureId??null,instanceId:identity.instanceId??null,variantId:identity.variantId??null,sourcePublicationId:identity.sourcePublicationId??null};
}
const identityFields=['catalog','puzzleId','schemaVersion','dataVersion','rulesVersion','mapStructureId','instanceId','variantId','sourcePublicationId'];
export const recordId=identity=>JSON.stringify(identityFields.map(key=>identity[key]??null));
const fields=(value,keys)=>Object.fromEntries(keys.map(key=>[key,value[key]??null]));
const feedbackFields=['difficulty','fairness','comment','status','updatedAt','fun','solvingStyle'];
const phaseFields=['phaseId','startedAt','endedAt','status','activeMs','paused','hints','noteChecks','routeChecks','penaltyPoints','timeTracking'];
function exportedRecord(record){
 return {...fields(record,['recordId','title','createdAt','updatedAt','revision','solvedAt']),identity:fields(record.identity,identityFields),
  phases:record.phases.map(phase=>({...fields(phase,phaseFields),feedbackAtEnd:phase.feedbackAtEnd?fields(phase.feedbackAtEnd,feedbackFields):null})),feedback:fields(record.feedback,feedbackFields)};
}
const uuid=()=>globalThis.crypto.randomUUID?.()??Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
export function createBetaStore({storage,report=()=>{},now=()=>new Date().toISOString(),newId=uuid}={}){
 const memory=new Map(),unreadable=new Set();
 function read(key){
  if(memory.has(key))return structuredClone(memory.get(key));
  try{
   const raw=storage.getItem(key);if(raw===null)return null;
   const value=JSON.parse(raw);
   const valid=key.endsWith(':tester')?typeof value?.testerId==='string':key.endsWith(':general')?typeof value?.comment==='string'&&Number.isSafeInteger(value.revision):
    typeof value?.recordId==='string'&&value.identity&&typeof value.title==='string'&&typeof value.feedback?.comment==='string'&&Number.isSafeInteger(value.revision)&&Array.isArray(value.phases)&&value.phases.every(p=>typeof p.phaseId==='string'&&Number.isFinite(p.activeMs)&&p.activeMs>=0);
   if(!valid)throw Error('Invalid local data');return value;
  }
  catch{unreadable.add(key);report('Lokale Daten sind nicht lesbar. Neue Eingaben bleiben vorerst nur auf dieser Seite; vorhandene Daten werden nicht überschrieben.');return null;}
 }
 function write(key,value){
  memory.set(key,structuredClone(value));
  if(unreadable.has(key))return false;
  try{storage.setItem(key,JSON.stringify(value));memory.delete(key);return true;}
  catch{report('Lokales Speichern fehlgeschlagen (Speicherung gesperrt oder Speicher voll). Neue Eingaben bleiben nur auf dieser Seite. Exportiere sie vor dem Verlassen.');return false;}
 }
 const testerKey=PREFIX+'tester',tester=read(testerKey)??{testerId:newId(),createdAt:now()};
 if(!tester.testerId)throw Error('Ungültige lokale Testkennung.');
 write(testerKey,tester);
 const generalKey=PREFIX+'general';
 function general(){return read(generalKey)??{comment:'',updatedAt:null,revision:0};}
 function records(){
  const keys=new Set(memory.keys());
  try{for(let i=0;i<storage.length;i++)keys.add(storage.key(i));}catch{report('Lokale Datensätze können nicht vollständig gelesen werden. Der Export enthält nur hier verfügbare Daten.');}
  return [...keys].filter(k=>k?.startsWith(PREFIX+'record:')).sort().map(read).filter(Boolean);
 }
 function get(identity){return read(PREFIX+'record:'+recordId(identity));}
 function update(identity,change,{title=''}={}){
  const id=recordId(identity),stamp=now();
  let record=get(identity)??{recordId:id,identity,title,createdAt:stamp,updatedAt:stamp,revision:0,solvedAt:null,phases:[],feedback:{difficulty:null,fairness:null,comment:'',status:null,updatedAt:null,fun:null,solvingStyle:null}};
  change(record);record.updatedAt=stamp;record.revision++;write(PREFIX+'record:'+id,record);return record;
 }
 function start(identity,title,{replay=false,resume=false,paused=false,counters={}}={}){
  return update(identity,r=>{
   const phase=r.phases.at(-1),initialCounters=phase?{}:counters;
   const resuming=resume&&phase?.status==='abandoned';
   if((replay||resuming)&&phase){phase.endedAt??=now();phase.feedbackAtEnd??=structuredClone(r.feedback);}
   if(replay&&phase)r.feedback={difficulty:null,fairness:null,comment:'',status:null,updatedAt:null,fun:null,solvingStyle:null};
   if(resuming&&r.feedback.status==='abandoned'){r.feedback.status='open';r.feedback.updatedAt=now();}
   if(!phase||replay||resuming)r.phases.push({phaseId:newId(),startedAt:now(),endedAt:null,status:'open',activeMs:0,paused,hints:initialCounters.hints??0,noteChecks:initialCounters.noteChecks??0,routeChecks:0,penaltyPoints:initialCounters.penaltyPoints??0,timeTracking:'available',feedbackAtEnd:null});
  },{title});
 }
 function phaseUpdate(identity,change){return update(identity,r=>{const phase=r.phases.at(-1);if(phase)change(phase,r);});}
 function feedback(identity,values,title){return update(identity,r=>{
  for(const key of ['difficulty','fairness','comment','status','fun','solvingStyle'])if(Object.hasOwn(values,key))r.feedback[key]=values[key];
  r.feedback.updatedAt=now();
  if(values.status==='abandoned'){
   const phase=r.phases.at(-1);if(phase?.status==='open'){phase.status='abandoned';phase.endedAt=now();phase.feedbackAtEnd=structuredClone(r.feedback);}
  }
 },{title});}
 return {get,update,start,phaseUpdate,feedback,records,general,
  setExperience(experience){const value=general();value.experience=experience;value.updatedAt=now();value.revision++;return write(generalKey,value);},
  setGeneral(comment){const value=general();value.comment=comment;value.updatedAt=now();value.revision++;return write(generalKey,value);},
  exportData(application){return {feedbackSchemaVersion:FEEDBACK_SCHEMA_VERSION,exportedAt:now(),testerId:tester.testerId,application,
   puzzles:records().sort((a,b)=>a.recordId<b.recordId?-1:a.recordId>b.recordId?1:0).map(exportedRecord),generalFeedback:fields(general(),['comment','updatedAt','revision','experience'])};},
  // Let concurrent tabs observe the latest stored value. Failed local writes stay exportable.
  hasUnsaved:()=>memory.size>0
 };
}
