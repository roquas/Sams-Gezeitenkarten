import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Optional independent visual check against the user's self-contained study.
// Start the existing dev server first; no production files are mutated.
const [referencePath,baseURL='http://127.0.0.1:4173/',outputPath]=process.argv.slice(2);
if(!referencePath)throw Error('Usage: node scripts/verify-a3-route-reference.mjs REFERENCE.html [BASE_URL] [OUTPUT.json]');
const browser=await chromium.launch();
try{
const original=await browser.newPage(),app=await browser.newPage();
await original.route(/^https?:/,r=>r.abort());
await original.goto(pathToFileURL(path.resolve(referencePath)).href);
await app.goto(baseURL);
const comparisons=[];
for(const sceneId of ['referenz','gerade','knick'])for(const requestedHour of (sceneId==='referenz'?[1,3,6]:[1,2,3])){
 const data=await original.evaluate(({sceneId,requestedHour})=>{
  const s=DATA.scenes.find(s=>s.id===sceneId),hour=Math.min(requestedHour,s.steps),uid='pixel-reference';
  const svg=node('svg',{xmlns:NS,viewBox:s.viewBox,width:563,height:473});svg.append(finalBand(s,uid,hour),finalDirection(s,uid,hour));
  return {source:svg.outerHTML,centers:s.centers,route:s.route,hour,viewBox:s.viewBox};
 },{sceneId,requestedHour});
 const result=await app.evaluate(async data=>{
  const {routeSegments,drawRouteInk}=await import('/src/ui/route-ink.mjs');
  const el=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
  const byId=Object.fromEntries(data.centers.map(([id])=>[id,{q:id.charCodeAt(0)-65,r:Number(id.slice(1))-1}]));
  const svg=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:data.viewBox,width:563,height:473});
  svg.append(drawRouteInk(el,routeSegments(data.route,byId),data.hour,'pixel-production'));
  const pixels=async source=>{
   const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(source);await image.decode();
   const canvas=document.createElement('canvas');canvas.width=563;canvas.height=473;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,563,473).data;
  };
  const a=await pixels(data.source),b=await pixels(svg.outerHTML);let changedPixels=0,maxChannelDifference=0;
  for(let i=0;i<a.length;i+=4){let changed=false;for(let c=0;c<4;c++){const delta=Math.abs(a[i+c]-b[i+c]);if(delta)changed=true;maxChannelDifference=Math.max(maxChannelDifference,delta);}if(changed)changedPixels++;}
  return {changedPixels,maxChannelDifference};
 },data);
 comparisons.push({scene:sceneId,hour:data.hour,...result});
}
const report={description:'Browser raster comparison of the original K-final band and direction overlay against the production module, including texture, cap compositing and gradients. Transparent 563×473 canvas; base chart and optional numbers excluded.',comparisons};
if(outputPath)fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(comparisons.some(r=>r.changedPixels))process.exitCode=1;
}finally{await browser.close();}
