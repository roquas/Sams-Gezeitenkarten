// In-memory fixtures for engine and contract tests. No production catalog/files.
import {RULES_VERSION,GEOMETRY} from '../../../src/puzzles/schema.mjs';
import {imageContract} from '../../../src/assets/geometry.mjs';
export const map=()=>({geometry:GEOMETRY,grid:{columns:5,rows:5},objects:[
 {id:'port',cells:['C3','D3'],passable:true},
 {id:'shore',cells:['B2','C2'],passable:false}]});
export const logic=()=>({map:map(),start:'C3',steps:1,clues:[{id:'E',type:'direction',hour:1,direction:'E'}]});
export const definition=()=>({schemaVersion:2,rulesVersion:RULES_VERSION,dataVersion:1,id:'fixture',logic:logic(),
 presentation:{title:'Fixture',intro:['Test'],objectNames:{},clueTexts:{E:'East'},hints:[],background:'test-sea',assetPlacements:[]},solution:['C3','D3']});
export function asset(id='test.island',cells=[[0,0]],passable=false){
 const {pixelWidth:width,pixelHeight:height}=imageContract(cells);
 return {id,family:'test',semanticClass:'island',role:'geographic',passable,stage:'illustration',production:'enabled',geometry:{cells},image:{path:'assets/test/'+id.replaceAll('.','-')+'.png',width,height},provenance:{source:'synthetic test fixture',rights:'test only'},candidateFamilies:['test']};
}
export function catalog(assets=[asset()]){
 return {schemaVersion:2,semanticVersion:1,backgrounds:[{id:'test-sea',family:'test',image:'assets/test/sea.webp'}],assets,
 reviews:assets.map(a=>({assetId:a.id,backgroundId:'test-sea',status:'approved',reviewer:'Synthetic fixture only',date:'2026-10-22',assetSha256:'a'.repeat(64),backgroundSha256:'b'.repeat(64),notes:'Synthetic contract data, never a production approval.'}))};
}
export const uiPuzzle=()=>({...logic(),id:'fixture',schemaVersion:2,dataVersion:1,solution:['C3','D3']});
