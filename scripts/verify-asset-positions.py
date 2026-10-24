"""Node adapter's position results, using the existing decoded pixel checker."""
import importlib.util
import base64
import io
import json
import sys
from pathlib import Path
from PIL import Image

spec = importlib.util.spec_from_file_location('library_images', Path(__file__).with_name('check-library-images.py'))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def verify(asset):
    data = base64.b64decode(asset['imageBase64'], validate=True)
    base = {'contract': asset['contract']}
    try:
        # Fast path also decodes and checks every local and positioned pixel.
        checker.check_image(data, asset)
        return {'assetId': asset['id'], 'anchors': [p['anchor'] for p in asset['placements']]}
    except (ValueError, OSError):
        try:
            checker.check_image(data, base)
        except (ValueError, OSError) as error:
            return {'assetId': asset['id'], 'anchors': [], 'error': str(error)}
        anchors, rejected = [], []
        for placement in asset['placements']:
            try:
                checker.check_image(data, {**base, 'placements': [placement]})
                anchors.append(placement['anchor'])
            except (ValueError, OSError) as error:
                rejected.append({'anchor': placement['anchor'], 'error': str(error)})
        return {'assetId': asset['id'], 'anchors': anchors, 'rejected': rejected}


if __name__ == '__main__':
    request = json.load(sys.stdin)
    with Image.open(io.BytesIO(base64.b64decode(request['backgroundBase64'], validate=True))) as background:
        background.load()
    print(json.dumps([verify(a) for a in request['assets']]))
