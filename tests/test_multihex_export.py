"""The authoring export must preserve meaningful alpha and its soft fringe."""
import importlib.util
from pathlib import Path
import unittest
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('exporter', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)

class MultihexExportTests(unittest.TestCase):
    def test_only_remote_alpha_one_residue_changes(self):
        pixels = np.zeros((64,64,4),dtype=np.uint8)
        pixels[:,:,:3] = [35,80,145]
        pixels[32,32,3] = 2
        pixels[32,40,3] = 1  # eight pixels from alpha 2: soft fringe survives
        pixels[32,41,3] = 1  # remote alpha-1 residue
        pixels[10,10,3] = 16
        pixels[3,3,3] = 1   # near faint smoke: survives
        pixels[60,60,3] = 255
        original = Image.fromarray(pixels)
        prepared,count = exporter.prepare_source(original)
        result = np.asarray(prepared)
        self.assertEqual(count,1)
        expected = pixels.copy();expected[32,41,3] = 0
        np.testing.assert_array_equal(result,expected)
        np.testing.assert_array_equal(np.asarray(original),pixels)

    def test_each_declared_cell_has_substantial_visible_art(self):
        import json
        catalog = json.loads((ROOT/'assets/catalog/library.json').read_text())
        assets = [a for a in catalog['assets'] if a['id'] in {
            'land-coast.island.h2.tropical-bays.v1',
            'land-coast.island.h3.massive-volcano.v1',
            'land-coast.archipelago.h3.bent-reefs.v1'}]
        self.assertEqual(len(assets),3)
        contracts = {tuple(map(tuple,cells)): data for cells,data in zip(exporter.SHAPES.values(),exporter.contracts())}
        for asset in assets:
            c = contracts[tuple(map(tuple,asset['geometry']['cells']))]['contract']
            alpha = np.asarray(Image.open(ROOT/asset['image']['path']).getchannel('A'))
            yy,xx = np.mgrid[:c['pixelHeight'],:c['pixelWidth']]
            x,y = (xx+.5)/4-c['width']/2,(yy+.5)/4-c['height']/2
            for polygon in c['polygons']:
                inside = np.ones(alpha.shape,dtype=bool)
                for a,b in zip(polygon,polygon[1:]+polygon[:1]):
                    inside &= (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]) >= 0
                # Reject a tiny central sprite that nominally claims distant cells.
                self.assertGreater(np.count_nonzero(inside & (alpha>=16)),4500,asset['id'])

if __name__ == '__main__':
    unittest.main()
