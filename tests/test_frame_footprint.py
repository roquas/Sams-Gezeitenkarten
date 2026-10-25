"""Frame compatibility checks complete source squares, including slivers."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('frame_footprint', ROOT/'scripts/lib/frame_footprint.py')
frame = importlib.util.module_from_spec(spec)
spec.loader.exec_module(frame)


class FrameFootprintTests(unittest.TestCase):
    def mask(self, polygons):
        return frame.graphic_overlap_mask(polygons, {'x': 0, 'y': 0}, (4, 4), 4)

    def test_boundary_touch_has_zero_area_but_alpha_one_sliver_must_be_rejected(self):
        polygon = [[.25, 0], [.5, 0], [.5, 1], [.25, 1]]
        mask = self.mask([polygon])
        self.assertFalse(mask[:, 0].any())
        self.assertTrue(mask[:, 1].all())
        self.assertFalse(mask[:, 2:].any())
        # A .001-unit incursion is missed by pixel-center sampling.
        polygon[0][0] -= .001
        polygon[3][0] -= .001
        self.assertTrue(self.mask([polygon])[:, 0].all())

    def test_sloped_edge_intersection_without_any_pixel_corner_inside(self):
        triangle = [[.24, .30], [.30, .24], [.30, .30]]
        mask = self.mask([triangle])
        self.assertFalse(mask[0, 0])
        self.assertTrue(mask[0, 1])
        self.assertTrue(mask[1, 0])
        self.assertTrue(mask[1, 1])

    def test_union_retains_holes_and_detects_cell_inside_pixel(self):
        tiny = [[.01, .01], [.02, .01], [.02, .02], [.01, .02]]
        mask = self.mask([tiny, [[.75, .75], [1, .75], [1, 1], [.75, 1]]])
        self.assertEqual(int(mask.sum()), 2)
        self.assertTrue(mask[0, 0])
        self.assertTrue(mask[3, 3])

    def test_checker_rejects_alpha_one_tip_overlap_outside_old_clear_opening(self):
        contract = json.loads((ROOT/'docs/seekarte-template/contract.json').read_text())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for ref in contract['format']['files'].values():
                target = root/ref
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT/ref, target)
            target = root/contract['format']['files']['frame']
            with Image.open(target) as source:
                image = source.convert('RGBA')
            # Square [60,60.25] × [9.5,9.75]: a thin positive-area cut at
            # A1's full tip; its center is outside even that graphic cell.
            image.putpixel((388, 216), (0, 80, 100, 1))
            image.save(target, format='WEBP', lossless=True)
            result = subprocess.run(['python3', str(ROOT/'scripts/check-chart-assets.py'),
                                     '--root', str(root)], cwd=ROOT, capture_output=True, text=True)
            self.assertEqual(result.returncode, 1, result.stderr)
            report = json.loads(result.stdout)
            self.assertEqual(report['errors'], ['frame: nonzero alpha overlaps complete geographic graphic cells'])
            info = report['files']['frame']
            self.assertEqual(info['geographic_graphic_cells']['overlapping_alpha_pixels'], 1)
            self.assertNotIn('mandatory_clear', info['alpha_diagnostics'])


if __name__ == '__main__':
    unittest.main()
