# HK Business Consultancy — Website

A cinematic, single-page website for **HK Business Consultancy**, Dubai.
*From Kuwait to Dubai. From Dubai to the world.*

This is a static site with no build step and no framework. It is plain HTML, CSS and vanilla JavaScript, and you can host it on any static host (Netlify, Vercel, Cloudflare Pages, S3, cPanel and so on).

## Run locally

```bash
npx http-server -p 8080 .     # or: python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

```
index.html              All sections, SEO meta, Open Graph and schema.org markup
privacy.html, terms.html  Legal page templates (need legal review)
assets/css/main.css     Design system (tokens at the top) and all section styles
assets/js/config.js     ← EDIT: photo paths and the enquiry-form endpoint
assets/js/geo.js        Simplified world geometry, region names and hover-card copy
assets/js/globe.js      Interactive 3D dot globe (canvas; no WebGL needed)
assets/js/worldmap.js   Dot world map with gold arcs (SVG)
assets/js/skyline.js    Procedural animated Dubai night skyline (canvas)
assets/js/main.js       Cursor, magnetic buttons, tilt, reveals, parallax, overlays, form
assets/img/             Favicon, Apple touch icon, Open Graph image
tools/og-image.html     Source for assets/img/og-image.jpg
```

## Before launch: content placeholders

Nothing on the site invents facts. That means no client names, statistics, awards, office locations or credentials. Search `index.html` for `EDITABLE` and for bracketed text:

| Placeholder | Where |
|---|---|
| `[CHAIRMAN'S NAME]`, portrait and signature | Chairman section and the `#dlg-chairman` overlay |
| Full Chairman's message (4 bracketed paragraphs) | `#dlg-chairman` overlay |
| `[EMAIL]`, `[PHONE]`, `[WEBSITE]` | Contact section, privacy and terms pages |
| Social links (`href="#contact"`) | Contact section → `.socials` |
| Sectors list | `#sectors`: **confirm with HK** and add or remove `<li>` items |
| Insight articles | `#insights` cards and the `#dlg-insight` overlay |
| Governing law | `terms.html` |
| Domain | `<link rel="canonical">`, `robots.txt`, `sitemap.xml`; add `url`, `email`, `telephone` and `sameAs` to the JSON-LD block |

Bracketed placeholders show a dashed gold underline so they are easy to spot on screen.

## Photography

Every image slot already has illustrated artwork: the procedural skyline, the Kuwait Towers silhouette and gradient art. The site therefore looks finished with no photos. To add real photography:

1. Export optimised **WebP or AVIF** files (around 2400px wide for full-bleed slots, around 1200px for the About and Chairman images).
2. Put them in `assets/img/`.
3. Set their paths in `assets/js/config.js` → `photos`.

Photos load lazily and fade in over the artwork. Alt text comes from each slot's `data-alt` attribute in `index.html`.

## Enquiry form

Set `formEndpoint` in `assets/js/config.js` to any endpoint that accepts a `multipart/form-data` POST, such as Formspree, Basin or your own API.

**Until you set it, the form validates and shows the thank-you message but sends nothing.** It only logs a notice to the browser console. The form includes a honeypot field against spam bots.

## Motion, accessibility and performance

- The operating system's `prefers-reduced-motion` setting is respected. The footer also has a **Reduce motion** toggle, which is remembered per visitor. In that mode every canvas renders one still frame.
- Canvases pause when they are off-screen. Mobile uses fewer globe points and particles, and a lower pixel ratio.
- The custom cursor, magnetic buttons and 3D tilt run only on devices with a precise pointer (mouse or trackpad).
- The Journey section scrolls horizontally on desktop and becomes a vertical story below 900px wide.
- Overlays use the native `<dialog>` element, so focus handling and closing with Esc work out of the box.
- The only external request is Google Fonts (Outfit and Manrope).

## Regenerating the Open Graph image

Serve the site locally, open `tools/og-image.html` at a 1200×630 viewport, and screenshot it to `assets/img/og-image.jpg`. Do this with the web fonts loaded so the image uses the brand typefaces.
