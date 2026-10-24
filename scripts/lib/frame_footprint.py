"""Positive-area intersection of source pixel squares with convex graphic cells."""
import numpy as np


def graphic_overlap_mask(polygons, bounds, size, scale):
    """SAT for convex cells vs axis-aligned squares; boundary-only touches pass.

    Checking pixel centers or corners alone would miss thin incursions. The
    square's support on each edge normal includes its complete source area.
    Cells are the shared JS contract, in counterclockwise coordinate order.
    """
    width, height = size
    result = np.zeros((height, width), dtype=bool)
    left = np.arange(width)/scale+bounds['x']
    top = np.arange(height)/scale+bounds['y']
    step = 1/scale
    for polygon in polygons:
        xs, ys = zip(*polygon)
        cols = np.flatnonzero((left+step > min(xs)) & (left < max(xs)))
        rows = np.flatnonzero((top+step > min(ys)) & (top < max(ys)))
        if not len(cols) or not len(rows):
            continue
        xx = left[cols][None, :]+step/2
        yy = top[rows][:, None]+step/2
        overlap = np.ones((len(rows), len(cols)), dtype=bool)
        for a, b in zip(polygon, polygon[1:]+polygon[:1]):
            dx, dy = b[0]-a[0], b[1]-a[1]
            overlap &= dx*(yy-a[1])-dy*(xx-a[0])+step/2*(abs(dx)+abs(dy)) > 1e-10
        result[np.ix_(rows, cols)] |= overlap
    return result
