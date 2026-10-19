"""Author whole multihex RGBA sprites without clipping or rotation.

Requires original image_gen canvases in --sources (local output/multihex by
 default). Only full-canvas proportional resampling and transparent padding.
The strict geometry checker is authoritative; masks select a legal placement,
never erase pixels from the artwork. Detached alpha=1 export residue more than
eight source pixels from any alpha>=2 is discarded before resampling; all
illustration alpha and its soft fringe are preserved. Runtime uses the ordinary asset renderer.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('checker', ROOT/'scripts/check-library-images.py')
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)
SHAPES = {'tropical': [[0, 0], [1, 0]], 'volcano': [[0, 0], [1, 0], [1, -1]],
          'archipelago': [[0, 0], [1, 0], [1, 1]]}
FILES = {'tropical': 'tropical-bays-h2-v1.png', 'volcano': 'massive-volcano-h3-v1.png',
         'archipelago': 'bent-reefs-h3-v1.png'}


def contracts():
    source = """import {imageContract,placementContract,placedCells} from './src/assets/geometry.mjs';
    import {HEXES} from './src/ui/chart-geometry.mjs';
    const board=new Set(HEXES.map(h=>h.id));
    console.log(JSON.stringify(JSON.parse(process.argv[1]).map(cells=>{
     const a={id:'authoring',geometry:{cells}};
     return {contract:imageContract(cells),placements:HEXES.filter(h=>placedCells(a,h.id).every(id=>board.has(id))).map(h=>({
      id:h.id,anchor:h.id,contract:placementContract(a,h.id)}))};
    })));"""
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source,
                                               json.dumps(list(SHAPES.values()))], cwd=ROOT))


def strict_mask(contract):
    """Fast convex interiors; exact union-area check for remaining edge pixels."""
    w, h = contract['pixelWidth'], contract['pixelHeight']
    yy, xx = np.mgrid[:h, :w]
    x, y = xx/4-contract['width']/2, yy/4-contract['height']/2
    full = np.zeros((h, w), dtype=bool)
    possible = np.zeros_like(full)
    for polygon in contract['polygons']:
        corners = []
        for dx, dy in [(0, 0), (.25, 0), (.25, .25), (0, .25)]:
            inside = np.ones_like(full)
            for a, b in zip(polygon, polygon[1:]+polygon[:1]):
                inside &= (b[0]-a[0])*(y+dy-a[1])-(b[1]-a[1])*(x+dx-a[0]) >= 0
            corners.append(inside)
        full |= np.logical_and.reduce(corners)
        possible |= np.logical_or.reduce(corners)
    footprint = checker.PixelFootprint(contract)
    for py, px in np.argwhere(possible & ~full):
        full[py, px] = footprint.contains(int(px), int(py))
    return full


def prepare_source(original):
    """Remove only detached alpha=1 residue, independent of geometry masks."""
    pixels = np.asarray(original).copy()
    support = original.getchannel('A').point(lambda a: 255 if a >= 2 else 0).filter(ImageFilter.MaxFilter(17))
    residue = (pixels[:, :, 3] == 1) & (np.asarray(support) == 0)
    pixels[residue, 3] = 0
    return Image.fromarray(pixels), int(np.count_nonzero(residue))


def export(sources, report_path=None):
    reports = []
    for (name, cells), data in zip(SHAPES.items(), contracts()):
        c = data['contract']; w, h = c['pixelWidth'], c['pixelHeight']
        allowed = strict_mask(c)
        seen = set()
        for p in data['placements']:
            signature = json.dumps(p['contract']['polygons'])
            if signature not in seen:
                allowed &= strict_mask(p['contract']); seen.add(signature)
        source = sources/(name+'-source.png')
        original = Image.open(source).convert('RGBA')
        prepared, residue_count = prepare_source(original)
        nominal = min(w/original.width, h/original.height)
        found = None
        # Prefer large whole-canvas exports; fixed search order makes this reproducible.
        for percent in range(100, 39, -1):
            scale = nominal*percent/100
            size = (round(original.width*scale), round(original.height*scale))
            sample = prepared.resize(size, Image.Resampling.LANCZOS)
            alpha = np.asarray(sample.getchannel('A')) > 0
            offsets = sorted(((dx,dy) for dy in range(-80,81,4) for dx in range(-64,65,4)), key=lambda p:p[0]**2+p[1]**2)
            for dx, dy in offsets:
                left, top = (w-size[0])//2+dx, (h-size[1])//2+dy
                if left < 0 or top < 0 or left+size[0] > w or top+size[1] > h:
                    continue
                if not np.any(alpha & ~allowed[top:top+size[1],left:left+size[0]]):
                    found = (sample, left, top, percent); break
            if found: break
        if not found: raise ValueError(name+': no uncut proportional fit')
        sample,left,top,percent = found
        result = Image.new('RGBA',(w,h)); result.paste(sample,(left,top))
        target = ROOT/'assets/library'/FILES[name]; result.save(target)
        # Independently recheck final bytes against local and every valid map position.
        checker.check_image(target.read_bytes(), data)
        report = {'key':name,'cells':cells,'image':str(target.relative_to(ROOT)),
                  'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
                  'assetSha256':hashlib.sha256(target.read_bytes()).hexdigest(),
                  'sourceSize':original.size,'sampleSize':sample.size,'paddingLeftTop':[left,top],
                  'nominalPercent':percent,'canvas':[w,h],
                  'visiblePixels':int(np.count_nonzero(np.asarray(result.getchannel('A')))),
                  'alphaOnePixels':int(np.count_nonzero(np.asarray(result.getchannel('A'))==1)),
                  'validAnchors':[p['anchor'] for p in data['placements']],
                  'outsidePixels':0,'detachedAlphaOneResiduePixels':residue_count,
                  'alphaPolicy':'Only detached alpha=1 residue farther than 8 source pixels from alpha>=2 removed; all artwork and soft fringe preserved',
                  'crop':False,'rotation':False}
        reports.append(report); print(json.dumps(report), flush=True)
    (report_path or ROOT/'docs/reviews/multihex/pixel-audit.json').write_text(json.dumps(reports,indent=2)+'\n')
    return reports


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources',type=Path,default=ROOT/'output/multihex')
    export(parser.parse_args().sources)
