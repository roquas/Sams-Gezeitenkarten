#!/usr/bin/env python3
"""Read-only technical acceptance check. Exit 2 = files missing, 1 = invalid.
Requires Pillow and numpy; artistic approval remains a separate manual step.
"""
import argparse,json,sys
from pathlib import Path
import numpy as np
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('--root',default='.');p.add_argument('--contract',default='docs/seekarte-template/contract.json');a=p.parse_args()
root=Path(a.root);spec=json.loads(Path(a.contract).read_text());report={'status':'passed','files':{},'manual_review_required':['neutral object-free sea','no cracks or illustrations in quiet label zones','text contrast in actual SVG','artistic approval']}
files=spec['format']['files']
missing=[files[k] for k in ['sea','frame','quietFrame'] if not (root/files[k]).is_file()]
if missing:
 print(json.dumps({'status':'pending','missing':missing},indent=2));sys.exit(2)
errors=[]
for kind in ['sea','frame','quietFrame']:
 file=root/files[kind]
 with Image.open(file) as im:
  info={'size':list(im.size),'format':im.format,'mode':im.mode};report['files'][kind]=info
  if im.format!='WEBP':errors.append(kind+': expected actual WebP')
  if im.size!=(spec['format']['pixels']['width'],spec['format']['pixels']['height']):errors.append(kind+': wrong dimensions');continue
  if kind!='sea' and 'A' not in im.getbands():errors.append(f'{kind}: missing alpha channel');continue
  rgba=np.asarray(im.convert('RGBA'));alpha=rgba[:,:,3]
  if kind=='sea':
   if np.any(alpha!=255):errors.append('sea: must be fully opaque')
   continue
  scale=spec['format']['pixels']['perSvgUnit'];h,w=alpha.shape
  # Pixel centers, no resampling or tolerance that could conceal residual alpha.
  bounds=spec['format']['svgBounds']
  xx=(np.arange(w)+.5)/scale+bounds['x'];yy=(np.arange(h)+.5)/scale+bounds['y']
  def mask(rect):
   l,t,r,b=rect;return (yy[:,None]>=t)&(yy[:,None]<b)&(xx[None,:]>=l)&(xx[None,:]<r)
  def polygon(points):
   result=np.zeros((h,w),dtype=bool)
   for i,(ax,ay) in enumerate(points):
    bx,by=points[(i+1)%len(points)]
    if ay==by:continue
    result^=((ay>yy[:,None])!=(by>yy[:,None])) & (xx[None,:]<(bx-ax)*(yy[:,None]-ay)/(by-ay)+ax)
   return result
  def union(polys):
   result=np.zeros((h,w),dtype=bool)
   for points in polys:result|=polygon(points)
   return result
  zones=spec['zones']
  opening=union(zones['transparent']['polygons'])
  # Keep the hard alpha rules; add counts/extent so export defects can be
  # distinguished from substantial coast/coordinate geometry problems.
  info['alpha_diagnostics']={}
  def examine(name, bad):
   n=int(np.count_nonzero(bad))
   if not n:return
   rows,cols=np.where(bad)
   ix=int(rows[0]);iy=int(cols[0])
   info['alpha_diagnostics'][name]={
    'affected_pixels':n, 'fraction_of_region':round(n/max(int(np.count_nonzero(opening if name=='mandatory_clear' else perimeter if name=='perimeter' else np.ones_like(alpha,dtype=bool))),1),7),
    'bbox_pixels':[int(cols.min()),int(rows.min()),int(cols.max()),int(rows.max())],
    'first_pixel':[iy,ix,int(alpha[ix,iy])],
    'alpha_min':int(alpha[bad].min()),'alpha_max':int(alpha[bad].max())
   }
  examine('mandatory_clear',opening&(alpha!=0))
  if 'mandatory_clear' in info['alpha_diagnostics']:errors.append(f'{kind}: nonzero alpha in mandatory clear opening')
  perimeter=np.zeros_like(alpha,dtype=bool)
  perimeter[[0,-1],:]=True
  perimeter[:,[0,-1]]=True
  examine('perimeter',perimeter&(alpha!=255))
  if 'perimeter' in info['alpha_diagnostics']:errors.append(f'{kind}: all outermost pixels must be opaque')
  rgb=rgba[:,:,:3]/255;linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);luma=linear@np.array([.2126,.7152,.0722])
  info['label_zones']=[]
  for z in zones['headings']['items']:
   selected=mask(z['bounds']);v=luma[selected]
   if np.any(alpha[selected]!=255):
    name=f"label_{z['side']}_{z['index']+1}"
    examine(name,selected&(alpha!=255))
    errors.append(f"{kind}: {z['side']} {z['index']+1} not on opaque parchment")
   info['label_zones'].append({'side':z['side'],'index':z['index'],'min_luminance':round(float(v.min()),4),'max_luminance':round(float(v.max()),4)})
report['errors']=errors
if errors:report['status']='failed'
print(json.dumps(report,indent=2));sys.exit(1 if errors else 0)
