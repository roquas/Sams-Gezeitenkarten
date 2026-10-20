"""Export the ten flavor sprites through the established uncut RGBA pipeline.

No geometry-based erasure, cropping or rotation. The existing exporter checks
the entire nonzero alpha, including the safety footprint at every legal anchor.
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('exporter', ROOT/'scripts/export-multihex-prototypes.py')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, default=ROOT/'docs/reviews/minigrafiken/masters')
    args = parser.parse_args()
    prompts = json.loads((ROOT/'docs/reviews/minigrafiken/generation-prompts.json').read_text())['prompts']
    exporter.SHAPES = {p['key']: [[0, 0]] for p in prompts}
    exporter.FILES = {p['key']: 'flavor-'+p['key']+'-v1.png' for p in prompts}
    exporter.export(args.sources, ROOT/'docs/reviews/minigrafiken/pixel-audit.json')


if __name__ == '__main__':
    main()
