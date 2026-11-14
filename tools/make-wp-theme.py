"""Package the built site (dist/) as an installable WordPress theme.

    npm run build && python3 tools/make-wp-theme.py
    -> share/hk-business-consultancy-theme.zip

Install: WordPress admin → Appearance → Themes → Add New → Upload Theme → Activate.
"""
import json, os, shutil, time, zipfile
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SLUG = 'hk-business-consultancy'
BUILD = os.path.join(ROOT, 'share', SLUG)
ZIP = os.path.join(ROOT, 'share', f'{SLUG}-theme.zip')
config = json.load(open(os.path.join(ROOT, 'site.config.json')))

shutil.rmtree(BUILD, ignore_errors=True)
os.makedirs(BUILD)
version = time.strftime('%Y.%m.%d.%H%M')
for name in ('functions.php', 'index.php', 'style.css'):
    s = open(os.path.join(ROOT, 'wp-theme', name)).read()
    s = s.replace('%%EMAIL%%', config['email']).replace('%%VERSION%%', version)
    open(os.path.join(BUILD, name), 'w').write(s)
shutil.copytree(os.path.join(ROOT, 'dist'), os.path.join(BUILD, 'site'))

# Theme screenshot (1200x900) from the social share image
og = Image.open(os.path.join(ROOT, 'dist/assets/img/og-image.jpg')).convert('RGB')
w, h = og.size
crop = og.crop(((w - h * 4 // 3) // 2, 0, (w + h * 4 // 3) // 2, h)) if w * 3 > h * 4 else og
crop.resize((1200, 900), Image.LANCZOS).save(os.path.join(BUILD, 'screenshot.png'), optimize=True)

if os.path.exists(ZIP):
    os.remove(ZIP)
with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, files in os.walk(BUILD):
        for fn in files:
            full = os.path.join(base, fn)
            z.write(full, os.path.join(SLUG, os.path.relpath(full, BUILD)))
print(ZIP, os.path.getsize(ZIP) // 1024, 'KB', 'version', version)
