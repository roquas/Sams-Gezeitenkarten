"""Export Tesoro with the existing uncut whole-canvas multihex pipeline."""
import importlib.util
import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('whole_export', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', choices=['v1', 'v2', 'v3'], default='v3')
    version = parser.parse_args().version
    folder = 'tesoro' if version == 'v1' else f'tesoro-{version}'
    plan = json.loads((ROOT/f'docs/reviews/{folder}/composition-plan.json').read_text())
    exporter.SHAPES = {plan['key']: plan['cells']}
    exporter.FILES = {plan['key']: plan['file']}
    sources = ROOT/f'output/{folder}'
    sources.mkdir(parents=True, exist_ok=True)
    if not (sources/'tesoro-source.png').exists():
        shutil.copyfile(ROOT/plan['master'], sources/'tesoro-source.png')
    exporter.export(sources, ROOT/f'docs/reviews/{folder}/pixel-audit.json',
                    min_visible_per_cell=15000 if version == 'v1' else 35000,
                    min_visible_by_cell=[35000,35000,62500,62500] if version == 'v3' else None)
