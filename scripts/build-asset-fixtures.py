"""Reproducible, deliberately schematic development fixtures, never final art."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

if __name__ == '__main__':
    # Query the same geometry used by the browser rather than duplicating it.
    source = "import {imageContract} from './src/assets/geometry.mjs'; console.log(JSON.stringify([[[0,0]],[[0,0],[1,0]]].map(imageContract)));"
    contracts = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source], cwd=ROOT))
    definitions = [('single', 'land-coast', 'island', False, 0), ('double', 'land-coast', 'island', False, 1),
                   ('lighthouse', 'navigation', 'lighthouse', True, 0), ('decoration', 'sea-life', 'accent', None, 0)]
    assets = []
    for name, family, kind, passable, shape in definitions:
        c = contracts[shape]
        image = Image.new('RGBA', (c['pixelWidth'], c['pixelHeight']))
        draw = ImageDraw.Draw(image)
        cx, cy = image.width/2, image.height/2
        if name in ('single', 'double'):
            centers = [cx] if shape == 0 else [cx-164, cx+164]
            if shape == 1:
                # A conspicuous technical bridge across the former water gap.
                draw.rectangle((cx-164, cy-26, cx+164, cy+26), fill='#947cb5', outline='#49365f', width=8)
            for x in centers:
                draw.regular_polygon((x, cy, 75), 6, fill='#947cb5', outline='#49365f', width=8)
                draw.line((x-30, cy-25, x+30, cy+25), fill='white', width=8)
                draw.line((x+30, cy-25, x-30, cy+25), fill='white', width=8)
        elif name == 'lighthouse':
            draw.rectangle((cx-16, cy-52, cx+16, cy+24), fill='#c45f87', outline='#49365f', width=5)
            draw.polygon([(cx-24, cy-52), (cx, cy-78), (cx+24, cy-52)], fill='#49365f')
            draw.arc((cx-48, cy+26, cx+48, cy+50), 0, 180, fill='#376f8a', width=7)
        else:
            draw.line((cx-28, cy+8, cx-8, cy-5, cx+4, cy+8, cx+25, cy-5), fill='#7658a0', width=7)
        ref = f'assets/library/technical-{name}.png'
        image.save(ROOT / ref)
        a = dict(id=f'technical.{name}.v1', family=family, type=kind, role='decoration' if passable is None else 'geographic',
                 stage='technical-placeholder', production='draft', geometry=dict(cells=[[0, 0]] if shape == 0 else [[0, 0], [1, 0]]),
                 image=dict(path=ref, width=image.width, height=image.height),
                 provenance=dict(source='scripts/build-asset-fixtures.py; schematic test fixture', rights='Project-authored technical fixture; no final illustration'),
                 candidateFamilies=['blue-sea'])
        if passable is not None:
            a['passable'] = passable
        assets.append(a)
    backgrounds = [dict(id='sea-blue-01', family='blue-sea', image='assets/seekarte/sea-blue-01.webp'),
                   dict(id='legacy-parchment-sea', family='parchment-sea', image='assets/seekarte/meer-pergament.webp'),
                   dict(id='prototype-sea', family='blue-sea', image='assets/seekarte/meer-ohne-objekte-prototyp.webp')]
    catalog = dict(schemaVersion=1, backgrounds=backgrounds, assets=assets,
                   reviews=[dict(assetId=a['id'], backgroundId=b['id'], status='pending', notes='Technical placeholder; no artistic approval.') for a in assets for b in backgrounds])
    catalog_path = ROOT / 'assets/catalog/library.json'
    if not catalog_path.exists():
        catalog_path.write_text(json.dumps(catalog, indent=2)+'\n')
