// Diagnostic fixture only. Never a substitute for approved raster artwork.
export async function installTechnicalTemplate(page){
 await page.evaluate(async()=>{
  const {createChartBaseLayers}=await import('/src/ui/chart-asset-contract.mjs');
  const el=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const sea='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2252" height="1892"><path fill="#b9dce3" d="M0 0H2252V1892H0Z"/></svg>');
  const layers=createChartBaseLayers(el,{sea,frame:'/docs/seekarte-template/frame-mask.svg'});
  document.querySelector('[data-chart-layer="sea"]').replaceWith(layers.sea);
  document.querySelector('[data-chart-layer="frame"]').replaceWith(layers.frame);
  await Promise.all([sea,'/docs/seekarte-template/frame-mask.svg'].map(async src=>{const i=new Image();i.src=src;await i.decode();}));
 });
}
