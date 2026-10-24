"""Regression checks for image dimensions, transparency and local hex containment."""
import importlib.util
import io
import json
import subprocess
import unittest
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('library_images', ROOT / 'scripts/check-library-images.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class LibraryImageTests(unittest.TestCase):
    def setUp(self):
        self.asset = {'contract': {'pixelWidth': 16, 'pixelHeight': 16, 'width': 4, 'height': 4,
                                 'polygons': [[[-1, -1], [1, -1], [1, 1], [-1, 1]]]}}

    def data(self, image):
        output = io.BytesIO()
        image.save(output, format='PNG', exif=image.getexif())
        return output.getvalue()

    def test_inside_pixel_is_valid(self):
        image = Image.new('RGBA', (16, 16))
        image.putpixel((8, 8), (40, 80, 120, 255))
        checker.check_image(self.data(image), self.asset)

    def test_transparent_but_oversized_content_is_rejected(self):
        image = Image.new('RGBA', (16, 16))
        image.putpixel((0, 0), (40, 80, 120, 1))
        with self.assertRaisesRegex(ValueError, 'outside geometry'):
            checker.check_image(self.data(image), self.asset)

    def test_gap_in_union_is_not_a_bounding_box(self):
        self.asset['contract']['polygons'] = [[[-2, -2], [-1, -2], [-1, 2], [-2, 2]],
                                            [[1, -2], [2, -2], [2, 2], [1, 2]]]
        image = Image.new('RGBA', (16, 16))
        image.putpixel((8, 8), (40, 80, 120, 255))
        with self.assertRaisesRegex(ValueError, 'outside geometry'):
            checker.check_image(self.data(image), self.asset)

    def test_dimensions_alpha_and_empty_content(self):
        for image, reason in [(Image.new('RGBA', (8, 8)), 'dimensions'),
                              (Image.new('RGB', (16, 16)), 'alpha'),
                              (Image.new('RGBA', (16, 16)), 'empty')]:
            with self.assertRaisesRegex(ValueError, reason):
                checker.check_image(self.data(image), self.asset)

    def test_exif_rotation_is_rejected(self):
        image = Image.new('RGBA', (16, 16))
        image.getexif()[274] = 6
        with self.assertRaisesRegex(ValueError, 'EXIF'):
            checker.check_image(self.data(image), self.asset)

    def contract(self, cells, anchor=None):
        source = """import {imageContract,placementContract} from './src/assets/geometry.mjs';
        const cells=JSON.parse(process.argv[1]);console.log(JSON.stringify(process.argv[2]?
        placementContract({id:'test',geometry:{cells}},process.argv[2]):imageContract(cells)));"""
        return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source,
                                                  json.dumps(cells), *([anchor] if anchor else [])], cwd=ROOT))

    def pixel(self, contract, x, y, alpha=1):
        image = Image.new('RGBA', (contract['pixelWidth'], contract['pixelHeight']))
        image.putpixel((x, y), (40, 80, 120, alpha))
        return image

    def test_exact_vertical_boundary_uses_complete_pixel_area_even_at_alpha_one(self):
        c = self.contract([[0, 0]])
        checker.check_image(self.data(self.pixel(c, 343, 204)), {'contract': c})
        with self.assertRaisesRegex(ValueError, 'outside geometry'):
            checker.check_image(self.data(self.pixel(c, 344, 204)), {'contract': c})

    def test_inside_center_does_not_allow_a_pixel_straddling_an_external_sloped_edge(self):
        c = self.contract([[0, 0]])
        footprint = checker.PixelFootprint(c)
        pixel = next((x, y) for y in range(c['pixelHeight']) for x in range(c['pixelWidth'])
                     if checker.inside(((x+.5)/4-c['width']/2, (y+.5)/4-c['height']/2), c['polygons'][0])
                     and not footprint.contains(x, y))
        with self.assertRaisesRegex(ValueError, 'outside geometry'):
            checker.check_image(self.data(self.pixel(c, *pixel)), {'contract': c})

    def test_union_accepts_pixels_crossing_internal_diagonal_boundaries(self):
        c = self.contract([[0, 0], [0, 1]])
        footprint = checker.PixelFootprint(c)
        # This pixel crosses the sloped shared edge, so neither individual
        # polygon contains all corners; its area is still wholly in the union.
        x, y = c['pixelWidth']//2-1, c['pixelHeight']//2
        corners = [((x+dx)/4-c['width']/2, (y+dy)/4-c['height']/2)
                   for dx, dy in [(0, 0), (1, 0), (1, 1), (0, 1)]]
        self.assertFalse(any(all(checker.inside(p, polygon) for p in corners) for polygon in c['polygons']))
        self.assertTrue(footprint.contains(x, y))
        checker.check_image(self.data(self.pixel(c, x, y)), {'contract': c})

    def test_horizontal_land_has_no_former_water_gap(self):
        c = self.contract([[0, 0], [1, 0]])
        image = Image.new('RGBA', (c['pixelWidth'], c['pixelHeight']))
        for x in range(20, c['pixelWidth']-20):
            image.putpixel((x, c['pixelHeight']//2), (40, 80, 120, 255))
        checker.check_image(self.data(image), {'contract': c})

    def test_concave_omissions_and_enclosed_holes_reject_alpha(self):
        ring = [[0, 0], [1, -1], [2, -1], [2, 0], [1, 1], [0, 1]]
        c = self.contract(ring)
        with self.assertRaisesRegex(ValueError, 'outside geometry'):
            checker.check_image(self.data(self.pixel(c, c['pixelWidth']//2, c['pixelHeight']//2)), {'contract': c})
        # A hole fully inside one square is missed by a corners-only union test.
        c = {'width': 1, 'height': 1, 'pixelWidth': 4, 'pixelHeight': 4, 'polygons': [
            [[0, 0], [.1, 0], [.1, .25], [0, .25]],
            [[.15, 0], [.25, 0], [.25, .25], [.15, .25]],
            [[.1, 0], [.15, 0], [.15, .1], [.1, .1]],
            [[.1, .15], [.15, .15], [.15, .25], [.1, .25]]]}
        self.assertFalse(checker.PixelFootprint(c).contains(2, 2))

    def test_full_upper_tip_is_valid_at_board_boundary_and_inside(self):
        cells = [[0, 0]]
        c = self.contract(cells)
        # Contract correction: y=-45 at A1 may exceed gameplay protection;
        # geographic art retains the same complete local cell as C3.
        image = self.pixel(c, c['pixelWidth']//2, 24)
        checker.check_image(self.data(image), {'contract': c})
        checker.check_image(self.data(image), {'contract': c, 'placements': [
            {'id': 'inside', 'anchor': 'C3', 'contract': self.contract(cells, 'C3')}]})
        checker.check_image(self.data(image), {'contract': c, 'placements': [
            {'id': 'edge', 'anchor': 'A1', 'contract': self.contract(cells, 'A1')}]})

    def test_static_format_and_exif_mirror_remain_forbidden(self):
        image = Image.new('RGBA', (16, 16))
        image.putpixel((8, 8), (40, 80, 120, 255))
        data = io.BytesIO()
        image.convert('RGB').save(data, format='BMP')
        with self.assertRaisesRegex(ValueError, 'static PNG/WebP'):
            checker.check_image(data.getvalue(), self.asset)
        image.getexif()[274] = 2
        with self.assertRaisesRegex(ValueError, 'EXIF'):
            checker.check_image(self.data(image), self.asset)

    def test_masks_are_complete_strict_pixel_footprints(self):
        for name in ['single', 'double-east', 'double-diagonal', 'triple-asymmetric']:
            base = ROOT / 'docs/asset-templates' / name
            c = json.loads(base.with_suffix('.json').read_text())
            checker.check_image(base.with_suffix('.png').read_bytes(), {'contract': c})
            mask = Image.open(base.with_suffix('.png'))
            footprint = checker.PixelFootprint(c)
            for y in range(mask.height):
                for x in range(mask.width):
                    self.assertEqual(mask.getpixel((x, y))[3] > 0, footprint.contains(x, y))

    def test_all_illustrations_fit_every_valid_board_position(self):
        source = """import fs from 'node:fs';
        import {imageContract,placementContract,placedCells} from './src/assets/geometry.mjs';
        import {HEXES} from './src/ui/chart-geometry.mjs';
        const catalog=JSON.parse(fs.readFileSync('assets/catalog/library.json'));
        console.log(JSON.stringify(catalog.assets.filter(a=>a.stage==='illustration').map(a=>{
        const board=new Set(HEXES.map(h=>h.id));
        return {...a,contract:imageContract(a.geometry.cells),placements:HEXES.filter(h=>placedCells(a,h.id).every(id=>board.has(id))).map(h=>({
        id:'review-'+h.id,anchor:h.id,contract:placementContract(a,h.id)}))};})));"""
        assets = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source], cwd=ROOT))
        self.assertNotEqual(assets[0]['image']['path'], assets[1]['image']['path'])
        for asset in assets:
            with self.subTest(asset=asset['id']):
                expected = {'land-coast.island.h4.long-sand.v1': 10}
                self.assertGreaterEqual(len(asset['placements']), expected.get(asset['id'], 12))
                if len(asset['geometry']['cells']) == 1:
                    self.assertEqual(len(asset['placements']), 25)
                checker.check_image((ROOT / asset['image']['path']).read_bytes(), asset)


if __name__ == '__main__':
    unittest.main()
