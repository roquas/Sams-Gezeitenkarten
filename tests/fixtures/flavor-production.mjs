// TECHNICAL TEST RESPONSES ONLY. No produced episode or semantic approval.
import {createProductionPackage,loadCommunityProduction} from '../../scripts/lib/flavor-production-package.mjs';
import {responseReferences} from '../../scripts/lib/flavor-production.mjs';
let cached;
export function productionFixture(){
 if(!cached){const inputs=loadCommunityProduction();cached={...inputs,...createProductionPackage(inputs)};}
 return cached;
}
export function technicalResponse(order){return {contractVersion:1,orderId:order.orderId,positions:order.positions.map(p=>({...responseReferences(p),status:'complete',
 title:'TECHNISCHER TEST '+p.caseId,intro:['Technische Importprobe ohne erzählerische Produktion.'],
 clues:p.request.source.logic.clues.map(c=>({id:c.id,text:'TECHNISCHER TEST: '+p.request.source.presentation.clueTexts[c.id]})),
 metadata:{form:'technical-test',themes:[],worldMotifs:[],inventions:[]}}))};}
