"""Regression checks for image dimensions, transparency and local hex containment."""
import importlib.util
import io
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


if __name__ == '__main__':
    unittest.main()
