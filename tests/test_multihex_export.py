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
            'land-coast.archipelago.h3.bent-reefs.v1',
            'land-coast.island.h4.crab-claw.v2',
            'land-coast.settlement.h4.tesoro.v1',
            'land-coast.settlement.h4.tesoro.v2',
            'land-coast.settlement.h4.tesoro.v3',
            'land-coast.settlement.h4.tesoro.v4'} or any(a['id']==r['id'] for r in json.loads((ROOT/'dev/multihex-round2.json').read_text()))]
        self.assertEqual(len(assets),14)
        shapes = dict(exporter.SHAPES)
        shapes.update({a['key']+'-round2':a['cells'] for a in json.loads((ROOT/'dev/multihex-round2.json').read_text())})
        original_shapes = exporter.SHAPES
        try:
            exporter.SHAPES = shapes
            contracts = {tuple(map(tuple,cells)): data for cells,data in zip(shapes.values(),exporter.contracts())}
        finally:
            exporter.SHAPES = original_shapes
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
                count = np.count_nonzero(inside & (alpha>=16))
                self.assertGreater(count,4500,asset['id'])
                if asset['id'].startswith('land-coast.settlement.h4.tesoro.'):
                    minimum = 15000 if asset['id'].endswith('.v1') else 35000
                    self.assertGreaterEqual(count,minimum,asset['id'])

    def test_tesoro_revision_expands_all_three_requested_outer_regions(self):
        versions = [np.asarray(Image.open(ROOT/f'assets/library/tesoro-h4-{v}.png').getchannel('A')) >= 16
                    for v in ['v1', 'v2']]
        old, current = versions
        self.assertEqual(old.shape, current.shape)
        yy, xx = np.indices(old.shape)
        # Fixed map-canvas regions, independent of exporter scale or padding.
        regions = {'upper left': (xx < 310) & (yy < 210),
                   'lower left': (xx < 440) & (yy > 400),
                   'lower right': (xx > 590) & (yy > 400)}
        for name, region in regions.items():
            self.assertGreater(np.count_nonzero(current & region),
                               np.count_nonzero(old & region), name)
        self.assertGreaterEqual(np.count_nonzero(current), np.count_nonzero(old)*1.1)

    def test_tesoro_v3_densely_occupies_both_lower_cells_without_source_cutoff(self):
        original_shapes = exporter.SHAPES
        try:
            exporter.SHAPES = {'tesoro': [[0,0],[1,0],[0,1],[1,1]]}
            c = exporter.contracts()[0]['contract']
        finally:
            exporter.SHAPES = original_shapes
        alpha = np.asarray(Image.open(ROOT/'assets/library/tesoro-h4-v3.png').getchannel('A')) >= 16
        yy, xx = np.indices(alpha.shape)
        x, y = (xx+.5)/4-c['width']/2, (yy+.5)/4-c['height']/2
        for index in [2, 3]:
            polygon = c['polygons'][index]
            inside = np.ones(alpha.shape,dtype=bool)
            for a,b in zip(polygon,polygon[1:]+polygon[:1]):
                inside &= (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]) >= 0
            self.assertGreaterEqual(np.count_nonzero(alpha & inside)/np.count_nonzero(inside), .70,
                                    'Tesoro v3 lower cell '+str(index))
        source = np.asarray(Image.open(ROOT/'docs/reviews/tesoro-v3/tesoro-master.png').getchannel('A'))
        for edge in [source[0,:],source[-1,:],source[:,0],source[:,-1]]:
            self.assertFalse(np.any(edge >= 16),'Source must not cut opaque illustration at its canvas edge')

    def test_recomposed_claw_reaches_outer_southwest_and_northeast_regions(self):
        cells = [[0, 0], [1, 0], [0, 1], [-1, 1]]
        original_shapes = exporter.SHAPES
        try:
            exporter.SHAPES = {'claw': cells}
            c = exporter.contracts()[0]['contract']
        finally:
            exporter.SHAPES = original_shapes
        yy, xx = np.mgrid[:c['pixelHeight'], :c['pixelWidth']]
        x, y = (xx+.5)/4-c['width']/2, (yy+.5)/4-c['height']/2
        versions = {}
        for version in ['v1', 'v2']:
            alpha = np.asarray(Image.open(ROOT/f'assets/library/crab-claw-h4-{version}.png').getchannel('A'))
            coords = np.argwhere(alpha >= 128)
            outer = []
            # Areas away from the group's middle: west of the SW cell and
            # east of the NE cell. v1 left both of these regions empty.
            for index, dx in [(3, -20), (1, 15)]:
                polygon = c['polygons'][index]
                cx = np.mean(polygon, axis=0)[0]
                inside = np.ones(alpha.shape, dtype=bool)
                for a, b in zip(polygon, polygon[1:]+polygon[:1]):
                    inside &= (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]) >= 0
                region = inside & ((x < cx+dx) if dx < 0 else (x > cx+dx))
                outer.append(int(np.count_nonzero(region & (alpha >= 16))))
            versions[version] = {'span': int(coords[:, 1].max()-coords[:, 1].min()+1), 'outer': outer}
        self.assertGreaterEqual(versions['v2']['span'], versions['v1']['span']*1.25)
        for old, current in zip(versions['v1']['outer'], versions['v2']['outer']):
            self.assertGreater(current, old+1000)

if __name__ == '__main__':
    unittest.main()
