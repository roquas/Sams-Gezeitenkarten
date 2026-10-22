// Browser adapter, deliberately supplied to the transport loader by the UI.
export async function verifyPuzzleImages(puzzle){
 const refs=[puzzle.background.asset,...puzzle.assetPlacements.map(p=>puzzle.assetLibrary.assets.find(a=>a.id===p.assetId).image.path)];
 await Promise.all([...new Set(refs)].map(async ref=>{
  const image=new Image();image.src=new URL(ref,puzzle.resourceBaseUrl).href;
  try{await image.decode();}catch{throw Error('Kartengrafik fehlt oder ist beschädigt: '+ref);}
 }));
}
