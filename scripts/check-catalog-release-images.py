"""Release driver: invoke this Git snapshot's existing local pixel validator."""
import importlib.util
import json
import platform
import sys
from pathlib import Path
import PIL
import numpy
from PIL import Image, features

spec = importlib.util.spec_from_file_location('library_images', Path(__file__).with_name('check-library-images.py'))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def main():
    request = json.load(sys.stdin)
    assets, backgrounds = [], []
    for asset in request['assets']:
        data = Path(asset['path']).read_bytes()
        checker.check_image(data, {'contract': asset['contract']})
        with Image.open(asset['path']) as image:
            assets.append({'format': image.format, 'width': image.width, 'height': image.height})
    for background in request['backgrounds']:
        with Image.open(background) as image:
            if image.format not in ('PNG', 'WEBP') or getattr(image, 'n_frames', 1) != 1:
                raise ValueError('background must be a static PNG/WebP: ' + background)
            image.load()
            backgrounds.append({'format': image.format, 'width': image.width, 'height': image.height})
    print(json.dumps({'assets': assets, 'backgrounds': backgrounds,
                     'tools': {'python': platform.python_version(), 'pillow': PIL.__version__, 'numpy': numpy.__version__,
                               'webp': features.version('webp'), 'zlib': features.version('zlib')}}))


if __name__ == '__main__':
    main()
