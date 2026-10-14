import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHART_ASSET_SPEC as s,headingZones,isOpaquePaper,toAssetPixel,createChartBaseLayers} from '../../src/ui/chart-asset-contract.mjs';
import {hexCenter,hexVertices} from '../../src/ui/place-labels.mjs';
test('all 20 unchanged coordinate envelopes plus safety lie on mandatory parchment',()=>{
 const zones=headingZones();assert.equal(zones.length,20);
 for(const z of zones){const [l,t,r,b]=z.safe;for(const [x,y] of [[l,t],[r,t],[r,b],[l,b]])assert.ok(isOpaquePaper(x,y),JSON.stringify(z));}
 assert.deepEqual(JSON.parse(readFileSync('docs/seekarte-template/contract.json')),{...s,headings:zones.map(z=>({...z,pixelSafe:[...toAssetPixel(z.safe[0],z.safe[1]),...toAssetPixel(z.safe[2],z.safe[3])]}))});
});
test('the complete 5x5 geometry fits the guaranteed transparent opening',()=>{
 const [l,t,r,b]=s.transparentOpening;
 for(let row=0;row<5;row++)for(let q=0;q<5;q++)for(const [x,y] of hexVertices(...hexCenter({q,r:row})))assert.ok(x>l&&x<r&&y>t&&y<b);
 assert.equal(s.pixelWidth/s.width,s.pixelHeight/s.height);assert.equal(s.pixelWidth,2252);
});
test('corner illustrations cannot intersect any padded coordinate zone',()=>{
 for(const a of s.illustrationZones)for(const z of headingZones()){const b=z.safe;assert.ok(a[2]<b[0]||a[0]>b[2]||a[3]<b[1]||a[1]>b[3]);}
});
test('prepared renderer has one uniformly scaled image per independent layer',()=>{
 const el=(tag,attrs={})=>({tag,attrs,children:[],append(n){this.children.push(n);}});
 const layers=createChartBaseLayers(el);for(const [kind,node] of Object.entries(layers)){
  assert.equal(node.attrs['pointer-events'],'none');
  const image=node.children.filter(n=>n.tag==='image');assert.equal(image.length,1);
  assert.equal(image[0].attrs.href,s[kind]);assert.equal(image[0].attrs.preserveAspectRatio,'xMidYMid meet');
 }
});
