"""Check real PNG/WebP dimensions and every visible pixel against the hex union.

Run after validate-assets.mjs. Technical safety only, never artistic approval.
"""
import io
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def inside(point, polygon):
    x, y = point
    return all((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]) >= -1e-7
               for a, b in zip(polygon, polygon[1:]+polygon[:1]))


def check_image(data, asset):
    image = Image.open(io.BytesIO(data))
    if image.format not in ('PNG', 'WEBP') or getattr(image, 'n_frames', 1) != 1:
        raise ValueError('expected a static PNG/WebP')
    if image.getexif().get(274, 1) != 1:
        raise ValueError('EXIF rotation/mirroring is not supported')
    contract = asset['contract']
    if image.size != (contract['pixelWidth'], contract['pixelHeight']):
        raise ValueError('actual image dimensions differ from geometry contract')
    if 'A' not in image.getbands():
        raise ValueError('explicit alpha channel required')
    alpha = image.convert('RGBA').getchannel('A')
    if not alpha.getbbox():
        raise ValueError('empty image')
    for y in range(image.height):
        for x in range(image.width):
            if not alpha.getpixel((x, y)):
                continue
            # All four pixel corners must lie within one declared polygon.
            # A transparent gap between chart hexes cannot be painted over.
            corners = [((x+dx)/4-contract['width']/2, (y+dy)/4-contract['height']/2)
                       for dx, dy in [(0, 0), (1, 0), (1, 1), (0, 1)]]
            if not any(all(inside(p, polygon) for p in corners) for polygon in contract['polygons']):
                raise ValueError(f'visible pixel outside geometry at {x},{y}')


if __name__ == '__main__':
    assets = json.loads(subprocess.check_output(['node', 'scripts/validate-assets.mjs', '--image-contract'], cwd=ROOT))
    for asset in assets:
        try:
            check_image((ROOT / asset['image']['path']).read_bytes(), asset)
        except ValueError as error:
            raise SystemExit(f"{asset['id']}: {error}") from error
    print(f'OK: {len(assets)} transparent images fit their actual hex unions')
