"""Author small, deliberately off-center whole-canvas RGBA sea illustrations.

Uses the established source-alpha cleanup, exact shared geometry masks and
independent complete-pixel validator. No illustration crop, erasure or rotation.
Size and position are baked into new PNGs; runtime geometry is unchanged.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('exporter', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
DIRECTORY = ROOT/'docs/reviews/water-finale'


def export(only=None):
    exporter.SHAPES = {'single': [[0, 0]]}
    data = exporter.contracts()[0]
    contract = data['contract']
    width, height = contract['pixelWidth'], contract['pixelHeight']
    allowed = exporter.strict_mask(contract)
    signatures = set()
    for p in data['placements']:
        signature = json.dumps(p['contract']['polygons'])
        if signature not in signatures:
            allowed &= exporter.strict_mask(p['contract'])
            signatures.add(signature)
    prior = json.loads((DIRECTORY/'pixel-audit.json').read_text()) if only and (DIRECTORY/'pixel-audit.json').exists() else []
    reports = {r['key']: r for r in prior}
    prompts = json.loads((DIRECTORY/'generation-prompts.json').read_text())['prompts']
    for item in prompts:
        key, version = item['key'], item['version']
        if only and key != only:
            continue
        source = DIRECTORY/'masters'/(key+'-source.png')
        original = Image.open(source).convert('RGBA')
        prepared, residue_count = exporter.prepare_source(original)
        substantial = prepared.getchannel('A').point(lambda a: 255 if a >= 16 else 0)
        bbox = substantial.getbbox()
        if not bbox:
            raise ValueError(key+': empty source')
        center = [(bbox[0]+bbox[2])/2, (bbox[1]+bbox[3])/2]
        nominal = min(item['size'][0]/(bbox[2]-bbox[0]), item['size'][1]/(bbox[3]-bbox[1]), width/original.width, height/original.height)
        found = None
        # A fixed desired center is art direction, never a runtime placement offset.
        for percent in range(100, 49, -1):
            scale = nominal*percent/100
            size = (round(original.width*scale), round(original.height*scale))
            left, top = [round(target-c*scale) for target, c in zip(item['center'], center)]
            if left < 0 or top < 0 or left+size[0] > width or top+size[1] > height:
                continue
            sample = prepared.resize(size, Image.Resampling.LANCZOS)
            alpha = np.asarray(sample.getchannel('A')) > 0
            if not np.any(alpha & ~allowed[top:top+size[1], left:left+size[0]]):
                found = sample, left, top, percent
                break
        if not found:
            raise ValueError(key+': cannot preserve complete canvas near requested edge')
        sample, left, top, percent = found
        result = Image.new('RGBA', (width, height))
        result.paste(sample, (left, top))
        target = ROOT/'assets/library'/('flavor-'+key+'-v'+str(version)+'.png')
        result.save(target)
        exporter.checker.check_image(target.read_bytes(), data)
        alpha = np.asarray(result.getchannel('A'))
        yy, xx = np.nonzero(alpha >= 16)
        visible_center = [(int(xx.min())+int(xx.max())+1)/2, (int(yy.min())+int(yy.max())+1)/2]
        distance = float(np.linalg.norm(np.array(visible_center)-[width/2, height/2]))
        if distance < 64:
            raise ValueError(key+': motif is insufficiently off-center')
        report = {'key': key, 'version': version, 'image': str(target.relative_to(ROOT)),
                  'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                  'assetSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                  'sourceSize': original.size, 'sampleSize': sample.size, 'paddingLeftTop': [left, top],
                  'canvas': [width, height], 'requestedSubstantialSize': item['size'],
                  'requestedCenter': item['center'], 'nominalPercent': percent,
                  'substantialAlphaBBox': [int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1)],
                  'substantialBBoxCenter': visible_center, 'distanceFromHexCenterPixels': distance,
                  'visiblePixelsAlpha16': int(len(xx)), 'allNonzeroAlphaPixels': int(np.count_nonzero(alpha)),
                  'validAnchors': [p['anchor'] for p in data['placements']], 'outsidePixels': 0,
                  'detachedAlphaOneResiduePixels': residue_count,
                  'alphaPolicy': 'Existing prepare_source: only detached alpha=1 residue removed, meaningful alpha and fringe preserved',
                  'crop': False, 'rotation': False, 'runtimeTransform': False}
        reports[key] = report
        print(json.dumps(report), flush=True)
    ordered = [reports[p['key']] for p in prompts]
    (DIRECTORY/'pixel-audit.json').write_text(json.dumps(ordered, indent=2)+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--key', choices=['gulls','dolphins','foam-flecks','current-arc','spray','foam-trail','cross-ripples'])
    export(parser.parse_args().key)
