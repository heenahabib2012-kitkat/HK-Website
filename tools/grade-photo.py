"""Resize and brand-grade a photo for the website.

    python3 tools/grade-photo.py <input image> <slot> [--crop x,y,w,h]

Writes src/assets/img/photos/<slot>.webp (max 1800px wide). The grade is gentle:
slightly reduced saturation, royal-blue lift in the shadows and a champagne
warmth in the highlights, so photos from different sources sit together.
"""
import sys, os
import numpy as np
from PIL import Image, ImageEnhance

def grade(im):
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(0.84)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    a = np.asarray(im).astype(np.float32) / 255.0
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    royal = np.array([16, 43, 99], np.float32) / 255.0
    champagne = np.array([232, 208, 160], np.float32) / 255.0
    a = a + (royal - a) * ((1 - lum) ** 2) * 0.22          # blue shadows
    a = a + (champagne - a) * (lum ** 3) * 0.10             # warm highlights
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

def main():
    src, slot = sys.argv[1], sys.argv[2]
    im = Image.open(src)
    if '--crop' in sys.argv:
        x, y, w, h = map(int, sys.argv[sys.argv.index('--crop') + 1].split(','))
        im = im.crop((x, y, x + w, y + h))
    if im.width > 1800:
        im = im.resize((1800, round(im.height * 1800 / im.width)), Image.LANCZOS)
    out = os.path.join(os.path.dirname(__file__), '..', 'src/assets/img/photos', f'{slot}.webp')
    grade(im).save(out, quality=80, method=6)
    print(slot, im.size, os.path.getsize(out) // 1024, 'KB')

if __name__ == '__main__':
    main()
