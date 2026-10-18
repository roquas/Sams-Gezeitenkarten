"""Rebuild production masks from the shared contract and strict pixel checker."""
import importlib.util
import json
from pathlib import Path
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('checker', ROOT / 'scripts/check-library-images.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)
SHAPES = {'single': [[0, 0]], 'double-east': [[0, 0], [1, 0]],
          'double-diagonal': [[0, 0], [0, 1]], 'triple-asymmetric': [[0, 0], [1, 0], [1, 1]]}


def build():
    source = "import {imageContract} from './src/assets/geometry.mjs'; console.log(JSON.stringify(JSON.parse(process.argv[1]).map(imageContract)));"
    contracts = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source,
                                                   json.dumps(list(SHAPES.values()))], cwd=ROOT))
    output = ROOT / 'docs/asset-templates'
    output.mkdir(exist_ok=True)
    for (name, cells), contract in zip(SHAPES.items(), contracts):
        mask = Image.new('RGBA', (contract['pixelWidth'], contract['pixelHeight']))
        footprint = checker.PixelFootprint(contract)
        for y in range(mask.height):
            for x in range(mask.width):
                if footprint.contains(x, y):
                    mask.putpixel((x, y), (255, 255, 255, 255))
        mask.save(output / (name+'.png'))
        checker.check_image((output / (name+'.png')).read_bytes(), {'contract': contract})
        (output / (name+'.json')).write_text(json.dumps({'cells': cells, **contract}, indent=2)+'\n')
        print(f"{name}: {mask.width} × {mask.height} px")


if __name__ == '__main__':
    build()
