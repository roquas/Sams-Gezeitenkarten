import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHART_ASSET_SPEC as s,headingZones,isOpaquePaper,createChartBaseLayers,chartContract,inRegion,PROTECTION,TRANSPARENT,EDGE_LIMIT} from '../../src/ui/chart-asset-contract.mjs';
import {HEXES,HEX_BOUNDS,CHART_CENTER,ROW_ENVELOPE,polygonPath,pointInPolygon} from '../../src/ui/chart-geometry.mjs';
import {hexCenter,hexVertices} from '../../src/ui/place-labels.mjs';
import {adjacent} from '../../src/engine/hex.mjs';
const sampleRect=(r,fn)=>{for(let x=r[0]+.01;x<r[2];x+=.5)for(let y=r[1]+.01;y<r[3];y+=.5)assert.ok(fn(x,y),`${x},${y}`);};
test('all 20 text, plaque and four-unit soft zones are explicit; complete plaques on paper',()=>{
 const zones=headingZones();assert.equal(zones.length,20);
 for(const z of zones){sampleRect(z.bounds,isOpaquePaper);assert.deepEqual(z.safe,[z.bounds[0]-4,z.bounds[1]-4,z.bounds[2]+4,z.bounds[3]+4]);sampleRect(z.hard,isOpaquePaper);}
 assert.deepEqual(JSON.parse(readFileSync('docs/seekarte-template/contract.json')),chartContract());
});
test('bounding-box centered map retains every center, polygon, distance and adjacency',()=>{
 assert.deepEqual(CHART_CENTER,[s.x+s.width/2,s.y+s.height/2]);
 assert.equal(HEX_BOUNDS[0]-s.x,s.x+s.width-HEX_BOUNDS[2]);assert.equal(HEX_BOUNDS[1]-s.y,s.y+s.height-HEX_BOUNDS[3]);
 assert.equal(HEXES.length,25);
 for(const h of HEXES){assert.deepEqual(h.center,[60+h.q*82+h.r%2*41,56+h.r*68]);assert.deepEqual(h.polygon,hexVertices(...hexCenter(h)));for(const p of h.polygon)assert.ok(inRegion(p,PROTECTION)&&inRegion(p,TRANSPARENT));
 for(const k of HEXES){const d=Math.hypot(h.center[0]-k.center[0],h.center[1]-k.center[1]);assert.equal(adjacent(h.id,k.id),d>0&&d<83);}}
 assert.equal(s.pixelWidth/s.width,s.pixelHeight/s.height);assert.equal(s.pixelWidth,2252);
});
test('nonconvex hull preserves staggered recesses and covers every hour-marker circle',()=>{
 assert.ok(!pointInPolygon([35,124],ROW_ENVELOPE));assert.ok(pointInPolygon([35,192],ROW_ENVELOPE));
 assert.ok(!inRegion([35,15],TRANSPARENT));assert.ok(!inRegion([450,360],TRANSPARENT));
 for(const h of HEXES)for(let hour=1;hour<=6;hour++)for(let i=0;i<72;i++){
 const a=(hour-2)*Math.PI/3,b=i*Math.PI/36,p=[h.center[0]+28*Math.cos(a)+9.95*Math.cos(b),h.center[1]+28*Math.sin(a)+9.95*Math.sin(b)];assert.ok(inRegion(p,PROTECTION));}
 for(const p of PROTECTION.flat())assert.ok(inRegion(p,TRANSPARENT));
});
test('SVG alpha reference and JSON use identical union polygons, not an even-odd overlapping hole',()=>{
 const svg=readFileSync('docs/seekarte-template/frame-mask.svg','utf8');
 const embedded=svg.match(/<metadata id="chart-contract">([\s\S]*?)<\/metadata>/)[1].replaceAll('&lt;','<').replaceAll('&amp;','&');assert.deepEqual(JSON.parse(embedded),chartContract());
 for(const p of EDGE_LIMIT)assert.ok(svg.includes(`d="${polygonPath(p)}" fill="black"`));
 assert.ok(svg.includes('mask="url(#paper)"'));assert.ok(!svg.includes('evenodd'));
});
test('illustration set differences exclude gameplay and hard text, including protected parrot',()=>{
 const c=chartContract();assert.equal(c.illustrationZones.length,4);
 for(const z of c.illustrationZones){assert.deepEqual(z.subtractUnion,[...EDGE_LIMIT,...headingZones().map(h=>h.hardPolygon)]);assert.equal(z.operation,'difference');}
 assert.match(c.illustrationZones[2].essentialParts,/Entire essential silhouette/);
});
test('prepared renderer has one uniformly scaled image per independent layer',()=>{
 const el=(tag,attrs={})=>({tag,attrs,children:[],append(n){this.children.push(n);}});
 for(const [kind,node] of Object.entries(createChartBaseLayers(el))){assert.equal(node.attrs['pointer-events'],'none');const image=node.children.filter(n=>n.tag==='image');assert.equal(image.length,1);assert.equal(image[0].attrs.href,s[kind]);assert.equal(image[0].attrs.preserveAspectRatio,'xMidYMid meet');assert.equal(image[0].attrs.x,s.x);}
});
