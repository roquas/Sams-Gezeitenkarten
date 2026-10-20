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
export const deferredIds=new Set([...flavorPrototypes.map(a=>a.id),'sea-life.accent.h1.turtle.v1']);
export function availability(asset){
 return asset.stage==='technical-placeholder'?'Technischer Platzhalter':({enabled:'Für Produktion vorgesehen',draft:'Entwurf / erneut zu prüfen',historical:'Historisch',deferred:'Zurückgestellt'})[asset.production]??'Nicht für Produktion vorgesehen';
}
export function conceptualRole(asset){
 return asset.id==='sea-life.accent.h1.turtle.v1'?'Tiermotiv für möglichen späteren beweglichen Einsatz':asset.role==='decoration'?'Freies Kartenmotiv':asset.passable?'Befahrbarer Ort':'Unbefahrbarer Ort';
}

export function motifName(asset){
 const technical={'technical.single.v1':'Technischer Einzelhex-Platzhalter','technical.double.v1':'Technischer Zweierhex-Platzhalter','technical.lighthouse.v1':'Technischer Leuchtturm-Platzhalter','technical.decoration.v1':'Technischer Dekorations-Platzhalter'};
 if(technical[asset.id])return technical[asset.id];
 const curated=[...passableSmallPlaces,...flavorPrototypes].find(p=>p.id===asset.id);
 if(curated)return curated.name;
 const key=asset.id.split('.').slice(-2).join('.');
 return ({'basalt-spire.v1':'Reduzierte Felsnadel','basalt-spire-water.v1':'Wasserreiche Felsnadel (Original)','offcenter-beacon.v1':'Leuchtturm','broken-passages.v1':'Zerbrochenes Atoll','offcenter-sloop.v1':'Versunkenes Wrack','tropical-bays.v1':'Palmenbuchten','massive-volcano.v1':'Glutberg','bent-reefs.v1':'Sandriffbogen – früher Entwurf','sand-reefs.v2':'Sandriffbogen','south-harbor.v1':'Südhafen','smuggler-cove.v1':'Schmugglerbucht','long-sand.v1':'Langer Strand','jungle-temple.v1':'Tempel der Gezeiten','crab-claw.v1':'Krabbenzange v1','crab-claw.v2':'Krabbenzange v2','tesoro.v1':'Tesoro v1','tesoro.v2':'Tesoro v2','tesoro.v3':'Tesoro v3','tesoro.v4':'Tesoro v4','gulls.v1':'Seevögel v1','dolphins.v1':'Delfine v1','turtle.v1':'Meeresschildkröte'})[key]??asset.id;
}
