#!/usr/bin/env python3
"""Normalize only minor WebP alpha export artifacts in the two parchment frames.

Dry-run by default.  --apply rewrites both WebPs losslessly, *only* after both
have passed strict safety gates.  The geometric coastal artwork is not moved.
Requires Pillow and numpy, already used by check-chart-assets.py.
"""
import argparse
import json
import os
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

MAX_CLEAR_RESIDUE = 24
MIN_OPAQUE_ARTIFACT = 238


def polygon_mask(points, xx, yy, shape):
    mask = np.zeros(shape, dtype=bool)
    for i, (ax, ay) in enumerate(points):
        bx, by = points[(i + 1) % len(points)]
        if ay == by:
            continue
        mask ^= (((ay > yy[:, None]) != (by > yy[:, None])) &
                 (xx[None, :] < (bx - ax) * (yy[:, None] - ay) / (by - ay) + ax))
    return mask


def rect_mask(rect, xx, yy):
    left, top, right, bottom = rect
    return ((yy[:, None] >= top) & (yy[:, None] < bottom) &
            (xx[None, :] >= left) & (xx[None, :] < right))


def normalize_alpha(alpha, mandatory_clear, perimeter, label_zones):
    """Pure alpha repair. Raise on significant errors; no change to other pixels."""
    errors = []
    if np.any(mandatory_clear & (alpha > MAX_CLEAR_RESIDUE)):
        errors.append("mandatory transparent region contains alpha above 24")
    if np.any(perimeter & (alpha < MIN_OPAQUE_ARTIFACT)):
        errors.append("outside edge contains alpha below 238")
    for name, zone in label_zones:
        if np.any(zone & (alpha < MIN_OPAQUE_ARTIFACT)):
            errors.append(f"{name}: substantive transparency remains (alpha below 238)")
    if errors:
        raise ValueError("; ".join(errors))

    fixed = alpha.copy()
    clear_count = int(np.count_nonzero(mandatory_clear & (alpha != 0)))
    edge_count = int(np.count_nonzero(perimeter & (alpha != 255)))
    labels = np.zeros_like(alpha, dtype=bool)
    for _name, zone in label_zones:
        labels |= zone
    label_count = int(np.count_nonzero(labels & (alpha != 255)))
    fixed[mandatory_clear] = 0
    fixed[perimeter | labels] = 255
    return fixed, {"mandatory_clear": clear_count, "outer_edge": edge_count,
                   "coordinate_labels": label_count}


def self_test():
    a = np.full((5, 5), 255, dtype=np.uint8)
    clear = np.zeros_like(a, dtype=bool)
    perimeter = np.zeros_like(a, dtype=bool)
    heading = np.zeros_like(a, dtype=bool)
    clear[2, 2] = True
    perimeter[0, :] = perimeter[-1, :] = True
    perimeter[:, 0] = perimeter[:, -1] = True
    heading[1, 3] = True
    a[2, 2] = 24
    a[0, 1] = 238
    a[1, 3] = 254
    out, counts = normalize_alpha(a, clear, perimeter, [("test", heading)])
    assert (out[2, 2], out[0, 1], out[1, 3]) == (0, 255, 255)
    assert counts == {"mandatory_clear": 1, "outer_edge": 1, "coordinate_labels": 1}
    assert np.count_nonzero(a != out) == 3
    a[2, 2] = 25
    try:
        normalize_alpha(a, clear, perimeter, [("test", heading)])
    except ValueError:
        pass
    else:
        raise AssertionError("Unacceptable coast pixel was silently corrected")
    a[2, 2] = 0
    a[1, 3] = 0
    try:
        normalize_alpha(a, clear, perimeter, [("test", heading)])
    except ValueError:
        pass
    else:
        raise AssertionError("Missing coordinate backing was silently corrected")
    print("Alpha normalizer self-test passed")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--contract", default="docs/seekarte-template/contract.json")
    parser.add_argument("--apply", action="store_true", help="Overwrite both frames after validation")
    parser.add_argument("--self-test", action="store_true", help="Run synthetic safety tests and exit")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return

    root = Path(args.root)
    contract_path = root / args.contract
    spec = json.loads(contract_path.read_text(encoding="utf-8"))
    w = spec["format"]["pixels"]["width"]
    h = spec["format"]["pixels"]["height"]
    scale = spec["format"]["pixels"]["perSvgUnit"]
    bounds = spec["format"]["svgBounds"]
    xx = (np.arange(w) + 0.5) / scale + bounds["x"]
    yy = (np.arange(h) + 0.5) / scale + bounds["y"]
    clear = np.zeros((h, w), dtype=bool)
    for polygon in spec["zones"]["transparent"]["polygons"]:
        clear |= polygon_mask(polygon, xx, yy, (h, w))
    perimeter = np.zeros((h, w), dtype=bool)
    perimeter[[0, -1], :] = True
    perimeter[:, [0, -1]] = True
    labels = [(f"{z['side']} {z['index'] + 1}", rect_mask(z["bounds"], xx, yy))
              for z in spec["zones"]["headings"]["items"]]

    prepared = []
    failures = []
    for kind in ("frame", "quietFrame"):
        file = root / spec["format"]["files"][kind]
        with Image.open(file) as image:
            if image.format != "WEBP" or image.size != (w, h) or "A" not in image.getbands():
                failures.append(f"{file}: wrong WebP dimensions or no alpha")
                continue
            pixels = np.asarray(image.convert("RGBA")).copy()
        try:
            after, counts = normalize_alpha(pixels[:, :, 3], clear, perimeter, labels)
        except ValueError as e:
            failures.append(f"{file}: {e}")
            continue
        pixels[:, :, 3] = after
        print(f"{file}: {counts}")
        prepared.append((file, pixels))

    if failures:
        for problem in failures:
            print("STOP:", problem)
        raise SystemExit("No files changed. Repair coordinate/shoreline geometry in Photoshop first.")
    if not args.apply:
        print("Dry-run only. Re-run with --apply after confirming the above.")
        return

    temps = []
    try:
        for file, pixels in prepared:
            with tempfile.NamedTemporaryFile(prefix=file.stem + "-alpha-", suffix=".webp",
                                             dir=file.parent, delete=False) as temp:
                path = Path(temp.name)
            temps.append((path, file))
            # Lossless WebP prevents another lossy recompression of the Photoshop artwork.
            Image.fromarray(pixels, "RGBA").save(path, format="WEBP",
                                                 lossless=True, exact=True, method=6)
            with Image.open(path) as im:
                check = np.asarray(im.convert("RGBA"))
            if not np.array_equal(check[:, :, 3], pixels[:, :, 3]):
                raise RuntimeError(f"{file}: alpha changed during re-encoding")
            if not np.array_equal(check[:, :, :3][pixels[:, :, 3] != 0],
                                  pixels[:, :, :3][pixels[:, :, 3] != 0]):
                raise RuntimeError(f"{file}: visible RGB changed during re-encoding")
        for path, file in temps:
            os.replace(path, file)
        print("Both frames normalized. Run python3 scripts/check-chart-assets.py and inspect git diff.")
    finally:
        for path, _file in temps:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
