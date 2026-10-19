"""Export Tesoro with the existing uncut whole-canvas multihex pipeline."""
import importlib.util
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('whole_export', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
plan = json.loads((ROOT/'docs/reviews/tesoro/composition-plan.json').read_text())
exporter.SHAPES = {plan['key']: plan['cells']}
exporter.FILES = {plan['key']: plan['file']}

if __name__ == '__main__':
    sources = ROOT/'output/tesoro'
    sources.mkdir(parents=True, exist_ok=True)
    if not (sources/'tesoro-source.png').exists():
        shutil.copyfile(ROOT/'docs/reviews/tesoro/tesoro-master.png', sources/'tesoro-source.png')
    exporter.export(sources, ROOT/'docs/reviews/tesoro/pixel-audit.json',
                    min_visible_per_cell=15000)
