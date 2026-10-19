"""Export only the recomposed claw v2 through the existing whole-image contract."""
import importlib.util
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('whole_export', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
plan = json.loads((ROOT/'docs/reviews/multihex-completion/composition-plan.json').read_text())
exporter.SHAPES = {plan['key']:plan['cells']}
exporter.FILES = {plan['key']:plan['file']}
if __name__ == '__main__':
    exporter.export(ROOT/'output/multihex-completion',ROOT/'docs/reviews/multihex-completion/pixel-audit.json')
