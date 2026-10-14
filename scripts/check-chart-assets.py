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
missing=[spec[k] for k in ['sea','frame'] if not (root/spec[k]).is_file()]
if missing:
 print(json.dumps({'status':'pending','missing':missing},indent=2));sys.exit(2)
errors=[]
for kind in ['sea','frame']:
 file=root/spec[kind]
 with Image.open(file) as im:
  info={'size':list(im.size),'format':im.format,'mode':im.mode};report['files'][kind]=info
  if im.format!='WEBP':errors.append(kind+': expected actual WebP')
  if im.size!=(spec['pixelWidth'],spec['pixelHeight']):errors.append(kind+': wrong dimensions');continue
  if kind=='frame' and 'A' not in im.getbands():errors.append('frame: missing alpha channel');continue
  rgba=np.asarray(im.convert('RGBA'));alpha=rgba[:,:,3]
  if kind=='sea':
   if np.any(alpha!=255):errors.append('sea: must be fully opaque')
   continue
  scale=spec['pixelsPerUnit'];h,w=alpha.shape
  # Pixel centers, no resampling or tolerance that could conceal residual alpha.
  xx=(np.arange(w)+.5)/scale+spec['x'];yy=(np.arange(h)+.5)/scale+spec['y']
  def mask(rect):
   l,t,r,b=rect;return (yy[:,None]>=t)&(yy[:,None]<b)&(xx[None,:]>=l)&(xx[None,:]<r)
  opening=mask(spec['transparentOpening']);paper=mask(spec['opaqueOuter'])&~mask(spec['opaqueOpening'])
  if np.any(alpha[opening]!=0):errors.append('frame: nonzero alpha in mandatory clear opening')
  if np.any(alpha[paper]!=255):errors.append('frame: non-opaque mandatory parchment band')
  if any(np.any(edge!=0) for edge in [alpha[0],alpha[-1],alpha[:,0],alpha[:,-1]]):errors.append('frame: canvas edge must be transparent')
  rgb=rgba[:,:,:3]/255;linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);luma=linear@np.array([.2126,.7152,.0722])
  info['label_zones']=[]
  for z in spec['headings']:
   selected=mask(z['safe']);v=luma[selected]
   if np.any(alpha[selected]!=255):errors.append(f"frame: {z['side']} {z['index']+1} not on opaque parchment")
   info['label_zones'].append({'side':z['side'],'index':z['index'],'min_luminance':round(float(v.min()),4),'max_luminance':round(float(v.max()),4)})
report['errors']=errors
if errors:report['status']='failed'
print(json.dumps(report,indent=2));sys.exit(1 if errors else 0)
