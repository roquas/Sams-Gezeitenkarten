// Editorial curation only. Runtime types, placement schema and generator stay unchanged.
const small=(key,name,version=1)=>({key,name,id:'sea-life.accent.h1.'+key+'.v'+version});
export const passableSmallPlaces=[
 small('barrels','Treibende Fässer'),small('buoy','Einzelne Boje'),
 small('rowboat','Ruderboot'),small('crate','Treibende Kiste'),
 small('bottle','Flaschenpost'),small('driftwood','Treibholz und Seetang')
];
export const flavorPrototypes=[
 small('foam','Sanfte Schaumströmung'),small('gulls','Kleine Seevögel',2),
 small('dolphins','Beiläufige Delfine',2),small('foam-flecks','Lockere Schaumkronen'),
 small('current-arc','Sanfter Strömungsbogen'),small('spray','Feines Gischtfeld'),
 small('foam-trail','Schmale Schaumspur'),small('cross-ripples','Kreuzende Wellenzüge')
];
export const freeMotifReviewPages=[['foam','gulls','foam-flecks'],['dolphins','current-arc','spray'],['foam-trail','cross-ripples']];
export const historicalIds=new Set([
 'sea-life.accent.h1.gulls.v1','sea-life.accent.h1.dolphins.v1',
 'land-coast.archipelago.h3.bent-reefs.v1',
 'land-coast.island.h4.crab-claw.v1','land-coast.island.h4.crab-claw.v2',
 'land-coast.settlement.h4.tesoro.v1','land-coast.settlement.h4.tesoro.v2','land-coast.settlement.h4.tesoro.v3'
]);
export const deferredIds=new Set(['sea-life.accent.h1.turtle.v1']);
export function availability(asset){
 return asset.stage==='technical-placeholder'?'Technischer Platzhalter':deferredIds.has(asset.id)?'Zurückgestellt':historicalIds.has(asset.id)?'Historisch':'Aktuell / zur Prüfung';
}
export function conceptualRole(asset){
 return deferredIds.has(asset.id)?'Tiermotiv für möglichen späteren beweglichen Einsatz':asset.role==='decoration'?'Freies Kartenmotiv':asset.passable?'Befahrbarer Ort':'Unbefahrbarer Ort';
}
