// Offline only. Never imported by the engine, generator or browser.
import {schemaErrors,puzzleSchema,logicSchema} from '../../src/puzzles/schema.mjs';
import {validateLogicDefinition,validateLogic} from '../../src/engine/validate.mjs';
import {validateDefinition} from '../../src/puzzles/validate.mjs';
import {canonicalJson,sha256} from './content-hash.mjs';

export const FLAVOR_VERSION=1; // Unchanged public request/source-hash protocol.
export const FLAVOR_DRAFT_VERSION=2; // Complete pinned names, including every start object.
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const text={type:'string',minLength:1,maxLength:12000};
const id={type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$',maxLength:80};
const hash={type:'string',pattern:'^[a-f0-9]{64}$'};
const revision={type:'integer',minimum:1,maximum:2147483647};
const dict=items=>({type:'object',propertyNames:id,additionalProperties:items});
const sourceFields=['schemaVersion','rulesVersion','dataVersion','id','logic','presentation','resultTexts'];
const sourceSchema=object(Object.fromEntries(sourceFields.map(k=>[k,puzzleSchema.properties[k]])),sourceFields.filter(k=>k!=='resultTexts'));
export const flavorRequestSchema=object({contractVersion:{const:FLAVOR_VERSION},sourceHash:hash,source:sourceSchema});
// Only these existing presentation fields may be edited. Artwork stays in source.
const editableFields=['title','intro','objectNames','clueTexts','hints','cluePlaceRefs'];
const presentationSchema=object(Object.fromEntries(editableFields.map(k=>[k,puzzleSchema.properties.presentation.properties[k]])),editableFields.filter(k=>k!=='cluePlaceRefs'));
const evidenceSchema=version=>({oneOf:[object({mode:{const:'free'}}),version===1?
 object({mode:{const:'controlled-v1'},statement:logicSchema.properties.clues.items,order:{enum:['time-first','fact-first']},startAlias:{enum:['Start','Ausgangspunkt','Beginn der Fahrt']}}):
 object({mode:{const:'controlled-v2'},statement:logicSchema.properties.clues.items,order:{enum:['time-first','fact-first']}})]});
export const flavorEvidenceSchema=evidenceSchema(FLAVOR_DRAFT_VERSION);
const draftSchema=version=>object({contractVersion:{const:version},sourceHash:hash,revision,
 presentation:presentationSchema,resultTexts:puzzleSchema.properties.resultTexts,evidence:dict(evidenceSchema(version))});
export const flavorDraftSchema={oneOf:[draftSchema(1),draftSchema(FLAVOR_DRAFT_VERSION)]};
const resultSchema=version=>object({status:{enum:['PASS','FAIL','UNCERTAIN']},method:{const:'flavor-check-v'+version},
 scope:{const:'single-clue-contract'},code:text,details:text,inputHash:hash});
export const flavorCheckpointSchema={oneOf:[1,FLAVOR_DRAFT_VERSION].map(version=>object({contractVersion:{const:version},sourceHash:hash,draft:draftSchema(version),checks:dict(resultSchema(version))}))};
const assert=(ok,message)=>{if(!ok)throw Error(`flavor: ${message}`);};
function structure(value,schema){const errors=schemaErrors(value,schema);assert(!errors.length,errors.join('; '));}
const digest=(value,version=FLAVOR_VERSION)=>sha256('gezeitenkarten-flavor/v'+version+'\0'+canonicalJson(value));
const same=(a,b)=>canonicalJson(a)===canonicalJson(b);
const copy=structuredClone;
const own=(record,key,fallback)=>record&&Object.hasOwn(record,key)?record[key]:fallback;
export const startObjectId=source=>source.logic.map.objects.find(o=>o.cells.includes(source.logic.start)).id;
function references(source,presentation){
 const objects=source.logic.map.objects.map(o=>o.id),clues=source.logic.clues.map(c=>c.id);
 assert(Object.keys(presentation.objectNames).every(k=>objects.includes(k)),'unknown object name ID');
 assert(same(Object.keys(presentation.clueTexts).sort(),[...clues].sort()),'missing or unknown clue text ID');
 for(const [key,refs] of Object.entries(presentation.cluePlaceRefs??{})){
  assert(clues.includes(key),'unknown clue reference ID');assert(refs.every(k=>objects.includes(k)),'unknown place reference ID');
 }
}
export function validateFlavorRequest(request){
 structure(request,flavorRequestSchema);validateLogicDefinition(request.source);references(request.source,request.source.presentation);
 assert(request.sourceHash===digest(request.source),'source hash mismatch');return request;
}
export function createFlavorRequest(document,options={}){
 validateDefinition(document,options);
 const source=Object.fromEntries(sourceFields.filter(k=>Object.hasOwn(document,k)).map(k=>[k,copy(document[k])]));
 return validateFlavorRequest({contractVersion:FLAVOR_VERSION,sourceHash:digest(source),source});
}
export function validateFlavorDraft(request,draft){
 validateFlavorRequest(request);structure(draft,flavorDraftSchema);
 assert(draft.sourceHash===request.sourceHash,'draft belongs to another source');references(request.source,draft.presentation);
 const expectedNames=request.source.presentation.objectNames,actualNames=draft.presentation.objectNames;
 if(draft.contractVersion===FLAVOR_DRAFT_VERSION)assert(same(actualNames,expectedNames),'object names must equal all pinned names');
 else{
  // Read-only wire compatibility: old snapshots may lack this entry. No new
  // draft generator removes names, and a complete old map is valid as well.
  assert(Object.entries(actualNames).every(([id,name])=>own(expectedNames,id)!==undefined&&name===own(expectedNames,id)),'legacy pinned name mismatch');
  assert(Object.keys(expectedNames).every(id=>Object.hasOwn(actualNames,id)||id===startObjectId(request.source)),'legacy missing pinned name');
 }
 const clueIds=request.source.logic.clues.map(c=>c.id);
 assert(Object.keys(draft.evidence).every(k=>clueIds.includes(k)),'unknown evidence clue ID');
 for(const [key,evidence] of Object.entries(draft.evidence))if(evidence.mode!=='free'){
  assert(evidence.statement.id===key,'statement clue ID mismatch');
  validateLogic({...request.source.logic,clues:[evidence.statement]});
 }
 return draft;
}
export function createFlavorDraft(request){
 validateFlavorRequest(request);
 const presentation=Object.fromEntries(editableFields.filter(k=>Object.hasOwn(request.source.presentation,k)).map(k=>[k,copy(request.source.presentation[k])]));
 return validateFlavorDraft(request,{contractVersion:FLAVOR_DRAFT_VERSION,sourceHash:request.sourceHash,revision:1,
  presentation,resultTexts:copy(request.source.resultTexts??{}),evidence:{}});
}

// A finite controlled language, NOT a natural-language interpreter. Full byte
// equality binds every word to the structured statement, including negation.
export function renderControlledClue(request,statement,options={}){
 validateFlavorRequest(request);validateLogic({...request.source.logic,clues:[statement]});
 assert(!Object.hasOwn(options,'startAlias'),'startAlias is obsolete; use the pinned object name');
 const {order='time-first'}=options;
 return renderStatement(statement,order,()=>`${JSON.stringify(own(request.source.presentation.objectNames,statement.placeId,'Ort'))} [${statement.placeId}]`);
}
// Only verifies already persisted v1 evidence. Never used to create new drafts.
function archivedControlledText(request,statement,{order,startAlias}){
 const place=()=>statement.placeId===startObjectId(request.source)?
  (request.source.logic.map.objects.find(o=>o.id===statement.placeId).cells.length===1?`${startAlias} [${statement.placeId}]`:`Objekt [${statement.placeId}], das ${startAlias} enthält`):
  `${JSON.stringify(own(request.source.presentation.objectNames,statement.placeId,'Ort'))} [${statement.placeId}]`;
 return renderStatement(statement,order,place);
}
function renderStatement(statement,order,place){
 assert(['time-first','fact-first'].includes(order),'unknown controlled order');
 let time,fact;
 switch(statement.type){
  case 'position':time=`In Stunde ${statement.hour}`;fact=`befindet sich das Schiff auf Feld ${statement.cell}`;break;
  case 'direction':time=`Von Stunde ${statement.hour-1} zu Stunde ${statement.hour}`;fact=`fährt das Schiff nach ${{E:'Osten',SE:'Südosten',SW:'Südwesten',W:'Westen',NW:'Nordwesten',NE:'Nordosten'}[statement.direction]}`;break;
  case 'turn':time=`In Stunde ${statement.hour}`;fact=`ändert das Schiff gegenüber der unmittelbar vorherigen Fahrtrichtung seinen Kurs um ${Math.abs(statement.degrees)}° ${statement.degrees<0?'links':'rechts'} (0° bedeutet geradeaus)`;break;
  case 'distanceToPlace':time=`In Stunde ${statement.hour}`;fact=`beträgt der kleinste Hexabstand des Schiffs zur gesamten Fläche von ${place()} genau ${statement.distance}`;break;
  case 'distanceBetweenHours':time=`Zwischen den Positionen in Stunde ${statement.hours[0]} und Stunde ${statement.hours[1]}`;fact=`beträgt der Hexabstand genau ${statement.distance}`;break;
  case 'countDistanceToPlace':time=`Von Stunde ${statement.fromHour} bis einschließlich Stunde ${statement.toHour}`;fact=`ist der kleinste Hexabstand des Schiffs zur gesamten Fläche von ${place()} in genau ${statement.count} dieser Stunden gleich ${statement.distance}${statement.count===0?' (in keiner dieser Stunden)':''}`;break;
  default:throw Error('Unsupported clue type '+statement.type);
 }
 // Semicolon reversal deliberately avoids a heuristic grammar/parser.
 return order==='time-first'?`${time}: ${fact}.`:`${fact}; ${time}.`;
}
function checkValidated(request,draft,clueId){
 const original=request.source.logic.clues.find(c=>c.id===clueId);assert(original,'unknown clue ID');
 const text=draft.presentation.clueTexts[clueId],evidence=own(draft.evidence,clueId,{mode:'free'});
 const placeRefs=own(draft.presentation.cluePlaceRefs,clueId,null);
 const inputHash=digest({sourceHash:request.sourceHash,clueId,text,evidence,placeRefs},draft.contractVersion);
 const result=(status,code,details)=>({status,method:'flavor-check-v'+draft.contractVersion,scope:'single-clue-contract',code,details,inputHash});
 if(evidence.mode==='free')return result('UNCERTAIN','interpretation-required','Free prose has no verified complete interpretation, including possible additional constraints.');
 const rendered=draft.contractVersion===1?archivedControlledText(request,evidence.statement,evidence):renderControlledClue(request,evidence.statement,evidence);
 if(text!==rendered)return result('FAIL','uncovered-text','Text is not exactly the complete controlled rendering; evidence does not cover every word.');
 // Parameter preservation is the F01 contract, not arbitrary logical theorem
 // proving. Even accidentally redundant changes fail this stricter contract.
 if(!same(original,evidence.statement))return result('FAIL','changed-statement','Controlled statement changes an original clue type, identity or parameter.');
 const expectedRefs=evidence.statement.placeId?[evidence.statement.placeId]:[];
 if(placeRefs!==null&&!same([...placeRefs].sort(),expectedRefs))return result('FAIL','changed-place-references','Explicit presentation references do not match the complete controlled statement.');
 return result('PASS','controlled-preservation','Entire controlled text is bound to the unchanged structured clue. No claim about free prose or the whole story.');
}
export function checkFlavorClue(request,draft,clueId){validateFlavorDraft(request,draft);return checkValidated(request,draft,clueId);}
export function createFlavorCheckpoint(request,draft){
 validateFlavorDraft(request,draft);
 return {contractVersion:draft.contractVersion,sourceHash:request.sourceHash,draft:copy(draft),
  checks:Object.fromEntries(request.source.logic.clues.map(c=>[c.id,checkValidated(request,draft,c.id)]))};
}
export function resumeFlavorCheckpoint(request,checkpoint){
 structure(checkpoint,flavorCheckpointSchema);assert(checkpoint.sourceHash===request.sourceHash,'checkpoint source mismatch');
 const fresh=createFlavorCheckpoint(request,checkpoint.draft);
 assert(same(checkpoint.checks,fresh.checks),'stale or tampered checks');
 return {checkpoint:fresh,pendingClueIds:Object.keys(fresh.checks).filter(id=>fresh.checks[id].status!=='PASS')};
}
export function upgradeFlavorDraft(request,previous){
 validateFlavorDraft(request,previous);
 const draft=copy(previous);
 if(draft.contractVersion!==FLAVOR_DRAFT_VERSION){
  draft.contractVersion=FLAVOR_DRAFT_VERSION;draft.presentation.objectNames=copy(request.source.presentation.objectNames);
  // Old proof syntax is not silently promoted to a new method. Text stays put.
  draft.evidence=Object.fromEntries(Object.entries(draft.evidence).map(([id])=>[id,{mode:'free'}]));
 }
 return draft;
}
export function repairFlavorClue(request,checkpoint,{clueId,expectedRevision,text,evidence,placeRefs}){
 const {checkpoint:current}=resumeFlavorCheckpoint(request,checkpoint);
 assert(current.draft.revision===expectedRevision,'stale repair revision');
 assert(Object.hasOwn(current.draft.presentation.clueTexts,clueId),'unknown repair clue ID');
 const draft=upgradeFlavorDraft(request,current.draft);draft.revision++;
 draft.presentation.clueTexts[clueId]=text;draft.evidence[clueId]=copy(evidence);
 if(placeRefs!==undefined){draft.presentation.cluePlaceRefs??={};draft.presentation.cluePlaceRefs[clueId]=copy(placeRefs);}
 return createFlavorCheckpoint(request,draft);
}
