"""Trim a partner logo to its content and save it for the website.

    python3 tools/prepare-logo.py <input> <name> [--keep-bg]

Finds the logo's content against its background colour (sampled from the corner),
crops to it with even padding, and writes src/assets/img/logos/<name>.png.
"""
import sys, os
import numpy as np
from PIL import Image

src, name = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(int)
bg = a[3, 3]
diff = np.abs(a - bg).sum(axis=2) > 60
ys, xs = np.where(diff)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = int(max(x1 - x0, y1 - y0) * 0.08)
box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad + 1), min(im.height, y1 + pad + 1))
out = im.crop(box)
dst = os.path.join(os.path.dirname(__file__), '..', 'src/assets/img/logos', f'{name}.png')
os.makedirs(os.path.dirname(dst), exist_ok=True)
out.save(dst, optimize=True)
print(name, out.size, 'bg', tuple(bg))
