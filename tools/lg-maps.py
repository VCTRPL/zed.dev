"""Displacement maps for the Liquid Glass filters (technique: Zettersten's
liquid-glass skill). R = x shift, G = y shift, 128 = neutral.

Only a thin bezel along the rim bends the light; the centre stays flat and
clear, like the edge of a glass lens. Shifts point inward, so at the rim the
glass shows what lies a little further inside the element.

Run: python3 tools/lg-maps.py  ->  src/assets/lg/{orb,folder}-map.png
"""
import numpy as np
from PIL import Image


def rounded_rect_map(w, h, radius, bezel, ss=2):
    W, H = w * ss, h * ss
    r, b = radius * ss, bezel * ss
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    px, py = xs + 0.5 - W / 2, ys + 0.5 - H / 2
    qx, qy = np.abs(px) - (W / 2 - r), np.abs(py) - (H / 2 - r)
    outside = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0))
    inside = np.minimum(np.maximum(qx, qy), 0)
    sdf = outside + inside - r  # < 0 inside the shape
    d = -sdf  # distance from the rim, inward
    # inward normal = -grad(sdf)
    gy, gx = np.gradient(sdf)
    n = np.hypot(gx, gy) + 1e-9
    nx, ny = -gx / n, -gy / n
    t = np.clip(1 - d / b, 0, 1)
    m = t**2 * (3 - 2 * t)  # smooth fall-off from the rim into the glass
    m = np.where(d >= 0, m, 0.0)
    # feDisplacementMap uses scale < 0 in the CSS, so negate to move inward
    R = 128 - 127 * m * nx
    G = 128 - 127 * m * ny
    img = np.stack([R, G, np.zeros_like(R)], -1).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(img).resize((w, h), Image.LANCZOS)
    return im


if __name__ == "__main__":
    rounded_rect_map(92, 92, 46, 20).save("src/assets/lg/orb-map.png")
    rounded_rect_map(340, 198, 22, 28).save("src/assets/lg/folder-map.png")
    print("ok")
