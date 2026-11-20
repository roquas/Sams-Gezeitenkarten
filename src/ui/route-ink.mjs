import {hexCenter} from './place-labels.mjs';

// K-final from the self-contained A3-Routenvergleich.html (iteration 4).
// Keep the B+ brush and K contour; only the selected direction pigment changes.
const brush={width:22,variation:2.2,color:'#694934',opacity:.68};
const wedge={start:.10,end:.90,startWidth:.96,endWidth:.025,variation:.24,cap:1.3};
const digits={
 1:'M -2 -4 L 1 -7 L 0 7 M -3 7 L 3 7',
 2:'M -4 -4 C -3 -9 5 -8 4 -3 C 3 0 -2 2 -4 6 Q 0 5 4 6',
 3:'M -4 -6 Q 5 -10 3 -2 Q 0 0 -1 0 Q 6 -1 3 5 Q 0 9 -4 6',
 4:'M 2 -7 L -4 2 L 5 1 M 2 -4 L 2 7',
 5:'M 4 -7 L -3 -6 L -4 0 C 4 -4 7 7 0 7 Q -3 7 -4 5',
 6:'M 3 -7 C -3 -6 -6 1 -3 6 C 2 11 8 1 1 0 Q -2 0 -3 3'
};
export function routeSegments(route,byId){
 return route.slice(1).map((id,i)=>{
  const a=hexCenter(byId[route[i]]),b=hexCenter(byId[id]),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),n=[-dy/l,dx/l];
  return {a,b,n,q:[(a[0]+b[0])/2+n[0]*2.3,(a[1]+b[1])/2+n[1]*2.3],id,source:route[i],i:i+1,l};
 });
}
export function routePoint(g,t){
 return [(1-t)**2*g.a[0]+2*(1-t)*t*g.q[0]+t*t*g.b[0],(1-t)**2*g.a[1]+2*(1-t)*t*g.q[1]+t*t*g.b[1]];
}
function segmentFrame(g,t){
 const p=routePoint(g,t),dx=2*(1-t)*(g.q[0]-g.a[0])+2*t*(g.b[0]-g.q[0]),dy=2*(1-t)*(g.q[1]-g.a[1])+2*t*(g.b[1]-g.q[1]),l=Math.hypot(dx,dy);
 return {p,tangent:[dx/l,dy/l],normal:[-dy/l,dx/l]};
}
export function ribbon(g){
 const left=[],right=[];
 for(let j=0;j<=40;j++){
  const t=j/40,{p,normal:[nx,ny]}=segmentFrame(g,t),s=t*g.l+g.i*13;
  const wave=Math.sin(s*.10)*.53+Math.sin(s*.29)*.25+Math.sin(s*1.7)*.28+Math.cos(s*2.8)*.17;
  const w=brush.width/2+brush.variation*wave;
  left.push([p[0]+nx*w,p[1]+ny*w]);right.push([p[0]-nx*w,p[1]-ny*w]);
 }
 return 'M '+left.concat(right.reverse()).map(p=>p.map(x=>x.toFixed(2)).join(' ')).join(' L ')+' Z';
}
function smoothSide(points){
 let d='';
 for(let i=1;i<points.length-1;i++){
  const p=points[i],q=points[i+1];d+=` Q ${p[0]} ${p[1]} ${(p[0]+q[0])/2} ${(p[1]+q[1])/2}`;
 }
 const end=points.at(-1);return d+` L ${end[0]} ${end[1]}`;
}
export function directionContour(g){
 const k=wedge,left=[],right=[];
 for(let j=0;j<=48;j++){
  const u=j/48,t=k.start+(k.end-k.start)*u,{p,normal}=segmentFrame(g,t);
  const half=11*(k.endWidth+(k.startWidth-k.endWidth)*(1-u));
  const grain=k.variation*Math.sin(Math.PI*u)*(Math.sin((t*g.l+g.i*13)*.52)*.65+Math.sin((t*g.l+g.i*13)*1.4)*.35);
  const width=Math.max(.20,half+grain);
  left.push([p[0]+normal[0]*width,p[1]+normal[1]*width]);right.push([p[0]-normal[0]*width,p[1]-normal[1]*width]);
 }
 const start=segmentFrame(g,k.start),end=segmentFrame(g,k.end),a=left[0],b=right.at(-1);
 const back=[start.p[0]-start.tangent[0]*k.cap,start.p[1]-start.tangent[1]*k.cap],tip=[end.p[0]+end.tangent[0]*.55,end.p[1]+end.tangent[1]*.55];
 return `M ${a[0]} ${a[1]}`+smoothSide(left)+` Q ${tip[0]} ${tip[1]} ${b[0]} ${b[1]}`+smoothSide(right.slice().reverse())+` Q ${back[0]} ${back[1]} ${a[0]} ${a[1]} Z`;
}
const decorative={'pointer-events':'none','aria-hidden':'true'};
export function drawRouteInk(el,segments,selected,uid){
 const root=el('g',{class:'route-ink',...decorative});
 if(!segments.length)return root;
 const clipId=uid+'-clip',defs=el('defs'),clip=el('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'});
 const band=el('g',{class:'route-band',opacity:brush.opacity}),base=el('g',{fill:brush.color});
 // Opaque pieces are composited together BEFORE the common 68% opacity.
 // Shared caps bridge turns without accumulating translucent dark knots.
 for(const g of segments){
  const attrs={d:ribbon(g)};
  base.append(el('path',{...attrs,class:'route-stroke','data-route-hour':g.i}));clip.append(el('path',attrs));
 }
 for(const [p,r] of [...segments.slice(1).map(g=>[g.a,brush.width*.475]),[segments[0].a,brush.width*.46],[segments.at(-1).b,brush.width*.46]]){
  const attrs={cx:p[0],cy:p[1],r};base.append(el('circle',attrs));clip.append(el('circle',attrs));
 }
 defs.append(clip);band.append(base);
 const texture=el('g',{class:'route-texture','clip-path':`url(#${clipId})`,fill:'none','stroke-linecap':'round'});
 for(const a of segments)for(let z=0;z<8;z++){
  const off=-9+z*2.5,dx=a.n[0]*off,dy=a.n[1]*off;
  texture.append(el('path',{d:`M ${a.a[0]+dx} ${a.a[1]+dy} Q ${a.q[0]+dx} ${a.q[1]+dy} ${a.b[0]+dx} ${a.b[1]+dy}`,stroke:z%3===0?'#ead6ac':'#4d3d32','stroke-width':z%3===0?.65:.3,opacity:z%3===0?.43:.2,'stroke-dasharray':`${6+z*3} ${4+z*2}`,'stroke-dashoffset':z*7}));
 }
 band.append(texture);
 const direction=el('g',{class:'route-directions','clip-path':`url(#${clipId})`});
 for(const g of segments){
  const current=g.i===selected,color=current?'#a15f43':'#452d21',opacity=current?.84:.64,gradId=uid+'-direction-'+g.i;
  const start=routePoint(g,wedge.start),end=routePoint(g,wedge.end);
  const gradient=el('linearGradient',{id:gradId,gradientUnits:'userSpaceOnUse',x1:start[0],y1:start[1],x2:end[0],y2:end[1]});
  for(const [offset,factor] of [[0,.20],[.065,1],[.96,1],[1,.76]])gradient.append(el('stop',{offset,'stop-color':color,'stop-opacity':opacity*factor}));
  defs.append(gradient);
  direction.append(el('path',{class:'route-direction','data-route-hour':g.i,'data-route-current':String(current),'data-source':g.source,'data-target':g.id,d:directionContour(g),fill:`url(#${gradId})`}));
 }
 root.append(defs,band,direction);return root;
}
export function drawRouteNumbers(el,segments,selected){
 const numbers=el('g',{class:'route-numbers',...decorative});
 for(const g of segments){
  // The study's vector glyphs and emphasis, at a fixed target-side position.
  // Deliberately omit its experimental collision search (optional labels).
  const [x,y]=routePoint(g,.72),active=g.i===selected,rotation=[-6,4,-3,5,-4,3][(g.i-1)%6];
  const item=el('g',{'data-route-hour':g.i,'data-route-current':String(active),'data-target':g.id,transform:`translate(${x} ${y}) rotate(${rotation})`});
  const glyph=el('g',{transform:`scale(${active?1.18:1})`,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'});
  glyph.append(el('path',{d:digits[g.i],stroke:'#f8edcf','stroke-width':active?4.1:3.5,'stroke-opacity':active?.93:.85}));
  glyph.append(el('path',{d:digits[g.i],stroke:active?'#893625':'#453c31','stroke-width':active?2.15:1.65}));
  item.append(glyph);
  if(active)item.append(el('path',{class:'selected-number-underline',d:'M -5 11 Q 0 12 5 10.8',fill:'none',stroke:'#893625','stroke-width':1.5,'stroke-linecap':'round'}));
  numbers.append(item);
 }
 return numbers;
}
