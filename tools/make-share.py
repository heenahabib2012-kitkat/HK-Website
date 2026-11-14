"""Package dist/ as a zip that opens straight from a computer (no web server).

    python3 tools/make-share.py      -> HK-Website-Preview.zip

Browsers block web fonts loaded from file:// pages, so the fonts are embedded
in the stylesheet, and the font preload tags are removed. Everything else is
copied as built.
"""
import base64, os, re, shutil, zipfile

ROOT = os.path.join(os.path.dirname(__file__), '..')
DIST = os.path.join(ROOT, 'dist')
OUT = os.path.join(ROOT, 'share', 'HK-Website-Preview')
ZIP = os.path.join(ROOT, 'share', 'HK-Website-Preview.zip')

shutil.rmtree(OUT, ignore_errors=True)
shutil.copytree(DIST, OUT)
for junk in ('robots.txt', 'sitemap.xml'):
    p = os.path.join(OUT, junk)
    if os.path.exists(p): os.remove(p)

css_path = os.path.join(OUT, 'assets/css/main.css')
css = open(css_path).read()
def embed(m):
    path = os.path.join(OUT, 'assets/fonts', m.group(1))
    data = base64.b64encode(open(path, 'rb').read()).decode()
    return f'url(data:font/woff2;base64,{data})'
css = re.sub(r'url\(\.\./fonts/([^)]+\.woff2)\)', embed, css)
open(css_path, 'w').write(css)
shutil.rmtree(os.path.join(OUT, 'assets/fonts'))

for name in os.listdir(OUT):
    if name.endswith('.html'):
        p = os.path.join(OUT, name)
        h = re.sub(r'<link rel="preload" href="assets/fonts/[^"]+"[^>]*>\n?', '', open(p).read())
        open(p, 'w').write(h)

with open(os.path.join(OUT, 'START HERE - open index.html.txt'), 'w') as f:
    f.write('HK Business Consultancy - website preview\n\n'
            'Unzip this folder, then double-click index.html to open the site in your browser.\n'
            'Keep all the files together in this folder.\n\n'
            'Note: the contact form cannot send messages in this offline preview.\n')

if os.path.exists(ZIP): os.remove(ZIP)
with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, files in os.walk(OUT):
        for fn in files:
            full = os.path.join(base, fn)
            z.write(full, os.path.join('HK-Website-Preview', os.path.relpath(full, OUT)))
print(ZIP, os.path.getsize(ZIP) // 1024, 'KB')
