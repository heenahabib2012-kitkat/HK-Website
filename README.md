# HK Business Consultancy — Website

A cinematic, single-page website for **HK Business Consultancy**, Dubai.
*From Kuwait to Dubai. From Dubai to the world.*

This is a static site with no build step and no framework. It is plain HTML, CSS and vanilla JavaScript, and you can host it on any static host (Netlify, Vercel, Cloudflare Pages, S3, cPanel and so on).

## Run locally

```bash
npx http-server -p 8080 .     # or: python3 -m http.server 8080
# open http://localhost:8080
```

## Concept: "The Ascent"

The site is drawn as a tower, and scrolling climbs it. Kuwait is the ground floor, Dubai the body of the building, and the world the view from the observation deck at the top.

- **Lift rail** (desktop): the panel on the right shows your current level and a lit lift car, with one stop per section. On mobile the level readout sits in the header.
- **Floors**: every section opens on a floor slab (`▽ LVL 048`). The **Directory** button lists all floors, the way a lobby directory does.
- **Services** are floors 25–32. Choosing one lights its windows and opens the detail.
- **Sky lobby (Why Dubai)** includes a live chart of office hours in Singapore, Mumbai, Dubai, Kuwait, London and New York, plotted in Dubai time with daylight saving handled.
- **Observation deck (Global presence)** is a 360° view from Dubai. City bearings and great-circle distances are calculated live, and selecting a city shows how HK supports that region.
- Colour: white drawing sheet, royal-blue ink, and gold used only as light (the lit floor, the lift car, "now").
- Type: Big Shoulders Display (display), Instrument Sans (body), IBM Plex Mono (levels, coordinates, labels).

## Alternative direction: "Lattice"

`lattice.html` is a second, complete design of the same site, built around a mashrabiya screen. Its CSS and JS are `assets/css/lattice.css` and `assets/js/lattice.js`, and it shares `assets/js/config.js`.

- The hero window's light follows the real position of the sun over Dubai: sand-gold by day, rose at dusk, lantern-lit at night. The screen opens as you scroll.
- The eight services sit on the eight points of a khatam star.
- "Every direction from Dubai" is a rosette of cities placed at their true bearing and distance.
- The hero and closing lantern are real 3D (raw WebGL in `assets/js/lattice3d.js`, no library): each lattice bar is an extruded, lit bar that turns with the pointer. Without WebGL the drawn SVG screen is used instead.
- The services star has depth and tilts with the pointer; the journey is a 3D walk through three arches as you scroll (a flat list on phones and with reduced motion).
- Our approach is shown as the survey, construction and carving of a geometric pattern.
- Photo slots (`heroView`, `about`, `kuwait`, `dubai`, `world` in `assets/js/config.js`) are optional: the hero photo is seen through the 3D lattice, the others fill the arches. Empty slots fall back to the drawings.
- The Arabic line under the headline must be confirmed by HK.

To launch Lattice instead of The Ascent, rename `lattice.html` to `index.html`.

## Alternative direction: "Departures"

`departures.html` is a third complete design: Dubai as the world's connecting hub. Its CSS and JS are `assets/css/departures.css` and `assets/js/departures.js`; it also uses `assets/js/geo.js` (world outline for the route map) and shares `assets/js/config.js`.

- Split-flap boards throughout: the hero headline, the services "departures" board (select a service to set it boarding) and the call-to-action gate sign.
- A live world-clock board: local time and whether offices are open (09:00–18:00 local on working days; Kuwait works Sunday to Thursday).
- Our journey as a boarding pass (KWI → DXB, 856 km, → the world); global presence as a great-circle route map from DXB; sectors as wayfinding signs; insights as magazine covers; the Chairman's portrait in an aircraft-window frame.

To launch it instead of The Ascent, rename `departures.html` to `index.html`.

## Structure

```
index.html              All sections, SEO meta, Open Graph and schema.org markup
privacy.html, terms.html  Legal page templates (need legal review)
assets/css/main.css     Design tokens at the top, then every section
assets/js/config.js     ← EDIT: Chairman photo path and the enquiry-form endpoint
assets/js/main.js       Level tracking, tower drawing, services, clocks, panorama, dialogs, form
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

The design is drawn rather than photographic, so it needs no stock imagery. The one photo slot is the Chairman's portrait: put an optimised WebP/AVIF file in `assets/img/` and set `photos.chairman` in `assets/js/config.js`.

## Enquiry form

Set `formEndpoint` in `assets/js/config.js` to any endpoint that accepts a `multipart/form-data` POST, such as Formspree, Basin or your own API.

**Until you set it, the form validates and shows the thank-you message but sends nothing.** It only logs a notice to the browser console. The form includes a honeypot field against spam bots.

## Motion, accessibility and performance

- There is one orchestrated animation: the tower drawing itself on load. Everything else is small and responds to what the visitor does, and all content is visible without waiting for animation.
- The operating system's `prefers-reduced-motion` setting is respected, and the footer has a **Reduce motion** toggle.
- The page makes no WebGL or canvas render loops; the tower, charts and panorama are plain SVG and HTML.
- The hero headline is sized to fit its column in JavaScript, so its four lines stay intact whichever font loads.
- The only external request is Google Fonts.

## Regenerating the Open Graph image

Serve the site locally, open `tools/og-image.html` at a 1200×630 viewport, and screenshot it to `assets/img/og-image.jpg`. Do this with the web fonts loaded so the image uses the brand typefaces.
