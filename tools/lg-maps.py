"""Displacement maps for the Liquid Glass filters (technique: Zettersten's
liquid-glass skill, with a physically based bezel). R = x shift, G = y shift,
128 = neutral.

The glass is a flat slab with a rounded bezel along the rim. Each pixel of
the bezel bends the light by Snell's law (n = 1.5) according to the slope of
a convex squircle profile, so the bend is strongest right at the rim and
fades smoothly into the flat centre. A faint radial term on top magnifies
the middle a little, as thick glass does.

Run: python3 tools/lg-maps.py  ->  src/assets/lg/{orb,folder}-map.png
"""
import numpy as np
from PIL import Image

N_GLASS = 1.5


def bezel_strength(x):
    """x: 0 at the rim .. 1 where the bezel meets the flat top."""
    x = np.clip(x, 1e-4, 1)
    # convex squircle height profile h = (1 - (1-x)^4)^(1/4), slope dh/dx
    u = 1 - x
    h_inner = np.clip(1 - u**4, 1e-6, None)
    slope = (u**3) * h_inner ** (-0.75)
    ti = np.arctan(slope)  # incidence angle on the curved surface
    tt = np.arcsin(np.sin(ti) / N_GLASS)  # refracted angle
    shift = np.tan(ti - tt)  # lateral shift through the glass
    return shift


def glass_map(w, h, radius, bezel, magnify, ss=3):
    W, H = w * ss, h * ss
    r, b = radius * ss, bezel * ss
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    px, py = xs + 0.5 - W / 2, ys + 0.5 - H / 2
    qx, qy = np.abs(px) - (W / 2 - r), np.abs(py) - (H / 2 - r)
    outside = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0))
    inside = np.minimum(np.maximum(qx, qy), 0)
    sdf = outside + inside - r  # < 0 inside the shape
    d = -sdf
    gy, gx = np.gradient(sdf)
    n = np.hypot(gx, gy) + 1e-9
    nx, ny = -gx / n, -gy / n  # inward normal

    s = bezel_strength(d / b)
    s = np.where((d >= 0) & (d < b), s, 0.0)
    # Physically almost all of the bend sits in the last pixel of the rim,
    # which vanishes at this size; normalise a little way in and lift the
    # curve so the bend spreads over the bezel but keeps its shape.
    s = np.clip(s / bezel_strength(np.array(0.08)), 0, 1) ** 0.55
    vx, vy = s * nx, s * ny
    # magnify the middle: sample a little toward the centre everywhere
    vx += -magnify * px / (W / 2)
    vy += -magnify * py / (H / 2)
    length = np.hypot(vx, vy)
    k = np.where(length > 1, 1 / length, 1)
    vx, vy = vx * k, vy * k
    vx = np.where(d >= 0, vx, 0)
    vy = np.where(d >= 0, vy, 0)
    # the CSS uses scale < 0, so negate to sample inward
    R = 128 - 127 * vx
    G = 128 - 127 * vy
    img = np.stack([R, G, np.full_like(R, 128)], -1).clip(0, 255).astype(np.uint8)
    return Image.fromarray(img).resize((w, h), Image.LANCZOS)


if __name__ == "__main__":
    glass_map(92, 92, 46, 22, 0.05).save("src/assets/lg/orb-map.png")
    glass_map(340, 198, 22, 26, 0.04).save("src/assets/lg/folder-map.png")
    print("ok")
