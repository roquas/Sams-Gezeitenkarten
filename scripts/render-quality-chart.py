#!/usr/bin/env python3
"""Rasterize the inventory-bound public SVG subset; never read production data."""
import base64,io,json,math,sys,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import numpy as np
p=json.load(sys.stdin);svg=ET.fromstring(p['svg']);vx,vy,vw,vh=map(float,svg.attrib['viewBox'].split());scale=2
size=(round(vw*scale),round(vh*scale));canvas=Image.new('RGBA',size,'#e9d5b0')
font_paths=['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/System/Library/Fonts/Supplemental/Arial.ttf']
def font(n):
 for path in font_paths:
  if Path(path).is_file():return ImageFont.truetype(path,n)
 return ImageFont.load_default()
def point(x,y):return ((float(x)-vx)*scale,(float(y)-vy)*scale)
def image(node):
 a=node.attrib;ref=a['href'];assert ref in p['images'],'image is not in the verified public inventory'
 im=Image.open(io.BytesIO(base64.b64decode(p['images'][ref])));assert im.format in ['PNG','WEBP'];im=im.convert('RGBA')
 target=(round(float(a['width'])*scale),round(float(a['height'])*scale));im=ImageOps.contain(im,target,Image.Resampling.LANCZOS)
 x,y=point(a['x'],a['y']);x+= (target[0]-im.width)/2;y+=(target[1]-im.height)/2
 layer=Image.new('RGBA',size);layer.alpha_composite(im,(round(x),round(y)));return layer
def draw(node,target):
 tag=node.tag.rsplit('}',1)[-1];a=node.attrib
 assert tag in ['svg','g','title','rect','clipPath','image','polygon','text'],'unsupported public SVG element'
 if a.get('display')=='none' or tag in ['title','clipPath']:return
 if tag=='g' and 'data-asset-mosaic' in a:
  premul=np.zeros((size[1],size[0],3),dtype=np.float32);alpha=np.zeros((size[1],size[0],1),dtype=np.float32)
  for child in node:
   assert child.tag.rsplit('}',1)[-1]=='image';rgba=np.asarray(image(child),dtype=np.float32)/255;premul+=rgba[:,:,:3]*rgba[:,:,3:4];alpha+=rgba[:,:,3:4]
  alpha=np.minimum(alpha,1);rgb=np.minimum(premul,1)/np.maximum(alpha,1e-8);rgba=np.concatenate([np.minimum(rgb,1),alpha],axis=2);target.alpha_composite(Image.fromarray(np.rint(rgba*255).astype('uint8'),'RGBA'));return
 if tag=='image':target.alpha_composite(image(node));return
 if tag in ['svg','g']:
  for child in node:draw(child,target)
  return
 layer=Image.new('RGBA',size);d=ImageDraw.Draw(layer)
 if tag=='rect':
  x,y=point(a.get('x',0),a.get('y',0));d.rectangle([x,y,x+float(a['width'])*scale,y+float(a['height'])*scale],fill=a.get('fill','#000'))
 if tag=='polygon':
  pts=[point(*pair.split(',')) for pair in a['points'].split()];width=max(1,round(float(a.get('stroke-width',1))*scale));color=a.get('stroke','#253a48')
  d.line(pts+[pts[0]],fill=color,width=width,joint='curve')
 if tag=='text':
  x,y=point(a.get('x',0),a.get('y',0));d.text((x,y),node.text or '',font=font(round(float(a.get('font-size',12))*scale)),anchor='ms',fill=a.get('fill','#17232a'),stroke_width=round(float(a.get('stroke-width',0))*scale),stroke_fill=a.get('stroke','#fff6db'))
 target.alpha_composite(layer)
draw(svg,canvas)
start=next(h for h in p['hexes'] if h['id']==p['chart']['start']);x,y=point(*start['center']);d=ImageDraw.Draw(canvas);d.ellipse((x-9*scale,y-9*scale,x+9*scale,y+9*scale),outline='#b91c1c',width=round(2.25*scale))
rows=[p['label']+' | Start '+p['chart']['start']+' | '+str(p['chart']['steps'])+' Etappen','Legende: Name [Objekt-ID] — vollständige Fläche — Befahrbarkeit']
for obj in p['chart']['map']['objects']:
 rows.append(p['chart']['objectNames'][obj['id']]+' ['+obj['id']+'] — '+', '.join(obj['cells'])+' — '+('befahrbar' if obj['passable'] else 'gesperrt'))
wrapped=[]
for text in rows:
 while text:
  cut=len(text)
  while cut>1 and font(round(8.75*scale)).getlength(text[:cut])>size[0]-40:cut-=1
  if cut<len(text) and ' ' in text[:cut]:cut=text.rfind(' ',0,cut)+1
  wrapped.append(text[:cut].rstrip());text=text[cut:]
rows=wrapped
legend=Image.new('RGBA',(size[0],50+38*len(rows)),'#fff7e4');ld=ImageDraw.Draw(legend)
for i,text in enumerate(rows):ld.text((20,12+i*38),text,font=font(round(8.75*scale)),fill='#17232a')
out=Image.new('RGB',(size[0],size[1]+legend.height),'#fff7e4');out.paste(canvas.convert('RGB'));out.paste(legend.convert('RGB'),(0,size[1]));out.save(sys.stdout.buffer,format='PNG')
