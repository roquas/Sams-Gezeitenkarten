"""Export round two using the established whole-canvas, strict-union exporter.

No cropping, rotation, per-cell masking or runtime transforms. The two approved
round-one images are never inputs or targets of this command.
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('whole_export', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
items = json.loads((ROOT/'dev/multihex-round2.json').read_text())
exporter.SHAPES = {a['key']: a['cells'] for a in items}
exporter.FILES = {a['key']: a['file'] for a in items}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--key', action='append', choices=list(exporter.SHAPES))
    args = parser.parse_args()
    report = ROOT/'docs/reviews/multihex-round2/pixel-audit.json'
    previous = json.loads(report.read_text()) if args.key and report.exists() else []
    if args.key:
        exporter.SHAPES = {k:v for k,v in exporter.SHAPES.items() if k in args.key}
    fresh = exporter.export(ROOT/'output/multihex-round2', report)
    combined = {r['key']:r for r in previous+fresh}
    report.write_text(json.dumps([combined[a['key']] for a in items if a['key'] in combined],indent=2)+'\n')
