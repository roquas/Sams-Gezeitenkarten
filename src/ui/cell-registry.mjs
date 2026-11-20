// Rebuild both views together after switching the active rules object.
export function createCellRegistry(rules){
 const cells=rules.cells.map(id=>({q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1,id}));
 return {cells,byId:Object.fromEntries(cells.map(cell=>[cell.id,cell]))};
}
