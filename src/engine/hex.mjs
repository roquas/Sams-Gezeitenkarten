// Pure pointy-hex geometry using the archived 3.6 even-row offset layout.
export function cellsOf(grid){return Array.from({length:grid.columns*grid.rows},(_,i)=>String.fromCharCode(65+i%grid.columns)+(Math.floor(i/grid.columns)+1));}
export function axial(id){const match=/^([A-Z])([1-9][0-9]*)$/.exec(id);if(!match)throw Error('Invalid cell '+id);const row=Number(match[2])-1;return [match[1].charCodeAt(0)-65-Math.floor(row/2),row];}
export function distance(a,b){const [q,r]=axial(a),[s,t]=axial(b);return Math.max(Math.abs(q-s),Math.abs(r-t),Math.abs(q+r-s-t));}
export function adjacent(a,b){return distance(a,b)===1;}
export const directions=['E','SE','SW','W','NW','NE'];
export function direction(a,b){if(!adjacent(a,b))return null;const [q,r]=axial(a),[s,t]=axial(b);return ({'1,0':'E','0,1':'SE','-1,1':'SW','-1,0':'W','0,-1':'NW','1,-1':'NE'})[[s-q,t-r].join(',')]??null;}
