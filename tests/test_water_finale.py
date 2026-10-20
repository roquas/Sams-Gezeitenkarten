"""Independent output checks for the final quiet, off-center water series."""
import json
from pathlib import Path
import unittest
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
FILES = {'gulls': 2, 'dolphins': 2, 'foam-flecks': 1, 'current-arc': 1,
         'spray': 1, 'foam-trail': 1, 'cross-ripples': 1}


class WaterFinaleTests(unittest.TestCase):
    def test_new_motifs_are_small_off_center_and_sources_are_not_cut(self):
        for key, version in FILES.items():
            with self.subTest(key=key):
                image = Image.open(ROOT/f'assets/library/flavor-{key}-v{version}.png')
                self.assertEqual(image.mode, 'RGBA')
                self.assertEqual(image.size, (360, 408))
                alpha = np.asarray(image.getchannel('A'))
                yy, xx = np.nonzero(alpha >= 16)
                self.assertGreater(len(xx), 30)
                self.assertLess(len(xx), 9000, 'Keep sea open; no large sticker-like patch')
                center = np.array([(xx.min()+xx.max()+1)/2, (yy.min()+yy.max()+1)/2])
                self.assertGreaterEqual(float(np.linalg.norm(center-[180,204])), 64)
                if key in ('gulls','dolphins'):
                    old = np.asarray(Image.open(ROOT/f'assets/library/flavor-{key}-v1.png').getchannel('A'))
                    oy, ox = np.nonzero(old >= 16)
                    self.assertLessEqual(xx.max()-xx.min()+1, (ox.max()-ox.min()+1)*.45)
                    self.assertLessEqual(len(xx), np.count_nonzero(old >= 16)*.25)
                source = np.asarray(Image.open(ROOT/f'docs/reviews/water-finale/masters/{key}-source.png').getchannel('A'))
                for edge in (source[0,:], source[-1,:], source[:,0], source[:,-1]):
                    self.assertFalse(np.any(edge >= 16), 'Do not cut painted content at source canvas edge')

    def test_nineteen_exact_approvals_and_no_new_file_inherits_an_approval(self):
        c = json.loads((ROOT/'assets/catalog/library.json').read_text())
        self.assertEqual(sum(r['status']=='approved' for r in c['reviews']), 19)
        for key, version in FILES.items():
            aid = f'sea-life.accent.h1.{key}.v{version}'
            reviews = [r for r in c['reviews'] if r['assetId']==aid]
            self.assertEqual(len(reviews),3)
            for r in reviews:
                self.assertEqual(r['status'],'pending')
                self.assertFalse(any(k in r for k in ('assetSha256','backgroundSha256','date','reviewer')))


if __name__ == '__main__':
    unittest.main()
