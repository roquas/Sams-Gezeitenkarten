"""Validate complete alpha-pixel squares against disjoint convex union fragments.

Geometry comes exclusively from the shared JS contract. A boundary touch has
zero area; no positive-area overlap is allowed, even at alpha=1.
"""
import io
import argparse
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EPSILON = 1e-10  # SVG square units; only compensates double-precision arithmetic


def inside(point, polygon):
    x, y = point
    return all((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]) >= 0
               for a, b in zip(polygon, polygon[1:]+polygon[:1]))


def area(polygon):
    # Translate before the shoelace sum to avoid cancellation at map coordinates.
    if not polygon:
        return 0
    x, y = polygon[0]
    return abs(sum((a[0]-x)*(b[1]-y)-(a[1]-y)*(b[0]-x)
                   for a, b in zip(polygon, polygon[1:]+polygon[:1])))/2


def clip_axis(polygon, axis, bound, sign):
    output = []
    for p, q in zip(polygon, polygon[1:]+polygon[:1]):
        dp, dq = sign*(p[axis]-bound), sign*(q[axis]-bound)
        if dp >= 0:
            output.append(p)
        if (dp < 0) != (dq < 0):
            t = dp/(dp-dq)
            output.append([p[0]+t*(q[0]-p[0]), p[1]+t*(q[1]-p[1])])
    return output


class PixelFootprint:
    def __init__(self, contract):
        self.width, self.height = contract['width'], contract['height']
        self.polygons = [(p, [min(v[0] for v in p), min(v[1] for v in p),
                              max(v[0] for v in p), max(v[1] for v in p)])
                         for p in contract['polygons']]

    def contains(self, x, y):
        left, top = x/4-self.width/2, y/4-self.height/2
        right, bottom = left+.25, top+.25
        corners = [[left, top], [right, top], [right, bottom], [left, bottom]]
        covered = 0
        for polygon, bounds in self.polygons:
            if bounds[2] <= left or bounds[0] >= right or bounds[3] <= top or bounds[1] >= bottom:
                continue
            if all(inside(p, polygon) for p in corners):
                return True
            fragment = polygon
            for axis, bound, sign in [(0, left, 1), (0, right, -1), (1, top, 1), (1, bottom, -1)]:
                fragment = clip_axis(fragment, axis, bound, sign)
                if not fragment:
                    break
            covered += area(fragment)
        # Fragments have disjoint interiors. This permits crossing internal
        # cell/triangulation edges, but detects concavities and enclosed holes.
        return covered >= .25**2-EPSILON


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
    alpha = image.convert('RGBA').getchannel('A')  # forces full decoding
    if not alpha.getbbox():
        raise ValueError('empty image')
    checks = [('geometry', PixelFootprint(contract))]
    checks += [(f"map boundary ({p['id']} at {p['anchor']})", PixelFootprint(p['contract']))
               for p in asset.get('placements', [])]
    for y in range(image.height):
        for x in range(image.width):
            if alpha.getpixel((x, y)):
                for label, footprint in checks:
                    if not footprint.contains(x, y):
                        raise ValueError(f'visible pixel outside {label} at {x},{y}')


def validate_images(base=ROOT, runtime_files=()):
    assets = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/validate-assets.mjs'),
                                                '--root', str(base), '--image-contract'], cwd=ROOT))
    for asset in assets:
        try:
            check_image((base / asset['image']['path']).read_bytes(), asset)
        except (ValueError, OSError) as error:
            raise ValueError(f"{asset['id']}: {error}") from error
    catalog = json.loads((base / 'assets/catalog/library.json').read_text())
    references = set(runtime_files) | {b['image'] for b in catalog['backgrounds']}
    for ref in sorted(references - {a['image']['path'] for a in assets}):
        if Path(ref).suffix not in ('.png', '.webp'):
            continue
        try:
            with Image.open(base / ref) as image:
                image.load()  # decode all shipped rasters, including legacy/backgrounds
        except (ValueError, OSError) as error:
            raise ValueError(f'{ref}: damaged runtime image: {error}') from error
    return len(assets)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--runtime-file', action='append', default=[])
    args = parser.parse_args()
    try:
        print(f'OK: {validate_images(args.root.resolve(), args.runtime_file)} images fit graphic cells and all published board positions')
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
