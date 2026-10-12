// Independent reconstruction of the puzzle rules from the unchanged 3.6 HTML.
export const blocked=new Set(['B3','C3','E2']);
export const start='D4';
export const solution=['D4','E3','D2','C2','B2','B1','A1'];
export const cells=Array.from({length:25},(_,i)=>String.fromCharCode(65+i%5)+(Math.floor(i/5)+1));
export function axial(id){if(!cells.includes(id))throw Error('unknown cell '+id);const q=id.charCodeAt(0)-65,r=Number(id[1])-1;return [q-Math.floor(r/2),r];}
export function distance(a,b){const [q,r]=axial(a),[s,t]=axial(b);return Math.max(Math.abs(q-s),Math.abs(r-t),Math.abs(q+r-s-t));}
export function neighbors(a,b){return distance(a,b)===1;}
export function coast(id){return !blocked.has(id)&&['B3','C3'].some(land=>neighbors(id,land));}
export function routes(){const result=[];function visit(path){if(path.length===7){result.push(path);return;}for(const next of cells){if(!blocked.has(next)&&!path.includes(next)&&neighbors(path.at(-1),next))visit([...path,next]);}}visit([start]);return result;}
export function valid(route){return route.length===7&&route[0]===start&&new Set(route).size===7&&route.every((id,i)=>cells.includes(id)&&!blocked.has(id)&&(i===0||neighbors(route[i-1],id)));}
export const directions=['E','SE','SW','W','NW','NE']; // clockwise
export function direction(a,b){if(!neighbors(a,b))return null;const [q,r]=axial(a),[s,t]=axial(b);const lookup={'1,0':'E','0,1':'SE','-1,1':'SW','-1,0':'W','0,-1':'NW','1,-1':'NE'};return lookup[[s-q,t-r].join(',')]??null;}
export const predicates=[
 r=>direction(r[0],r[1])==='NE',
 r=>directions.indexOf(direction(r[1],r[2]))===(directions.indexOf(direction(r[0],r[1]))+5)%6,
 r=>coast(r[4]),
 r=>direction(r[5],r[6])==='W',
 r=>distance(r[5],'C1')===1,
 r=>distance(r[1],r[3])===2,
 r=>r.slice(3,7).filter(coast).length===2
];
export const solutions=()=>routes().filter(r=>predicates.every(p=>p(r)));
