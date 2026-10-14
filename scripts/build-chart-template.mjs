import {mkdir,writeFile} from 'node:fs/promises';
import {CHART_ASSET_SPEC as s,headingZones,toAssetPixel} from '../src/ui/chart-asset-contract.mjs';
import {hexCenter,hexVertices} from '../src/ui/place-labels.mjs';
const dir='docs/seekarte-template';await mkdir(dir,{recursive:true});
const zones=headingZones();
await writeFile(`${dir}/contract.json`,JSON.stringify({...s,headings:zones.map(z=>({...z,pixelSafe:[...toAssetPixel(z.safe[0],z.safe[1]),...toAssetPixel(z.safe[2],z.safe[3])]}))},null,2)+'\n');
const root=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${s.viewBox}" width="${s.pixelWidth}" height="${s.pixelHeight}">`;
const rect=([x,y,r,b],attrs)=>`<rect x="${x}" y="${y}" width="${r-x}" height="${b-y}" ${attrs}/>`;
// Technical mask, deliberately no artwork. Hole is inside permitted transition band.
const mask='<path fill="#fff" fill-rule="evenodd" d="M -36 -38 H 516 V 428 H -36 Z M 24.5 9 H 466 V 379.5 H 24.5 Z"/>';
await writeFile(`${dir}/frame-mask.svg`,root+'<title>Technical alpha mask — not final artwork</title>'+mask+'</svg>\n');
let parts=[root,'<title>Binding chart geometry: technical template, no artwork</title>',rect([-44,-44,519,429],'fill="#eee"'),rect(s.opaqueOuter,'fill="#ead9ae"'),rect(s.opaqueOpening,'fill="#efac67"'),rect(s.transparentOpening,'fill="#bbdfe4"')];
for(let r=0;r<5;r++)for(let q=0;q<5;q++){
 const [x,y]=hexCenter({q,r});parts.push(`<polygon points="${hexVertices(x,y).map(p=>p.join(',')).join(' ')}" fill="none" stroke="#45767d" stroke-width=".6"/>`);
}
for(const z of zones){parts.push(rect(z.safe,'fill="#75b77c" fill-opacity=".5" stroke="#295a37" stroke-width=".4"'),rect(z.bounds,'fill="none" stroke="#243829" stroke-width=".4"'),`<circle cx="${z.x}" cy="${z.y}" r="1" fill="#971b1b"/>`,`<text x="${z.x}" y="${z.y+2.5}" text-anchor="middle" font-size="7" font-family="sans-serif">${z.side[0].toUpperCase()}${z.index+1}</text>`);}
for(const r of s.illustrationZones)parts.push(rect(r,'fill="#b395cf" fill-opacity=".5" stroke="#694b83" stroke-width=".5"'));
parts.push('</svg>');await writeFile(`${dir}/template.svg`,parts.join('\n')+'\n');
console.log('Wrote contract.json, template.svg and frame-mask.svg');
