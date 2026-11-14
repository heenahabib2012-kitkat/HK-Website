# HK Business Consultancy — website

Corporate website for **Honest & Keen Business Consultancy LLC** — *Building Businesses. Creating Possibilities.*

A fast, dependency-free static site (HTML, CSS, vanilla JS) composed from partials by a small Node build script.
Royal blue · white · champagne gold; Cormorant Garamond + Manrope (self-hosted).

## Pages

| Page | File |
|---|---|
| Home — cinematic hero film, Honest & Keen, expertise, industries, global reach, founder, testimonials | `src/pages/index.html` |
| About HK — story timeline, founder's message, vision & mission, principles | `src/pages/about.html` |
| Our Expertise — the five services, each with expandable detail + enquiry CTA | `src/pages/expertise.html` |
| Industries — interactive nine-sector explorer (deep links: `industries.html#healthcare`) | `src/pages/industries.html` |
| Global Reach — interactive corridor map | `src/pages/global-reach.html` |
| Our Network — associate companies | `src/pages/network.html` |
| Our Clients — testimonials | `src/pages/clients.html` |
| Contact — enquiry form | `src/pages/contact.html` |
| Privacy, Terms, 404 | `src/pages/privacy.html`, `terms.html`, `404.html` |

Shared header, footer, logo and CTA live in `src/partials/`. Contact details, social links, form endpoint and analytics ID live in `site.config.json`.

## Build & preview

```bash
npm install
npm run build      # → dist/
npm run serve      # http://localhost:4173
```

## Deploy

- **Netlify** (recommended): connect the repo — `netlify.toml` builds and publishes `dist/`. The contact form uses **Netlify Forms** automatically; set the notification email to `info@honestandkeen.com` under *Site settings → Forms → Form notifications*.
- **Any other static host** (GitHub Pages, cPanel, S3…): upload `dist/`. Set `forms.endpoint` in `site.config.json` to a form service or CRM endpoint that accepts POSTed form data (e.g. Formspree, Web3Forms, HubSpot), then rebuild. If submission fails, visitors are offered a pre-filled email to info@honestandkeen.com.
- Analytics: put a GA4 measurement ID in `analytics.ga4` and rebuild.

## Brand assets still to supply

The build prints anything still pending. These were not available when the site was built:

1. **Official HK logo** — in place (`src/assets/brand/hk-logo.png`, web sizes `hk-logo-128.webp` / `hk-logo-256.webp`, favicon and touch icon). The header, footer, network diagram and opening animation use it via `src/partials/logo.html`.
2. **Founder photograph** — in place (`src/assets/img/photos/founder.jpg`), cropped to the 4:5 portrait frame only: no colour grade and no retouching, to preserve his natural appearance.
3. **Photography** — every image slot uses a generated architectural line-art plate in the brand colours. Drop real photography into `src/assets/img/photos/<slot>.jpg` to replace any of them (slot list in that folder's README).
4. **Brand film** — the home hero plays a graded brand film edited from licensed stock footage (curved glass → Downtown Dubai at night → a tilt up the Burj Khalifa): `src/assets/video/hk-brand-film.mp4` / `.webm` (desktop) and `hk-brand-film-mobile.mp4` (portrait, phones). To re-cut it, put the source clips in `footage/` as `glass.mp4`, `night.mp4`, `burj.mp4` and run `bash tools/edit-brand-film.sh` (needs ffmpeg). If the video can't play, the page falls back to a real-time 3D film (three.js, loaded only when needed), then a 2D line film. Add `?film-t=12` to the home URL to freeze the 3D fallback for review.
5. **Client & associate logos** — currently set as typographic wordmarks in `clients.html` and `network.html`.
6. **Facebook page URL** — `social.facebook` in `site.config.json` currently points to a Facebook search for the page name.
7. **Content to confirm against the Company Profile 2026** — the founder's message on the About page is drafted from the brief and should be replaced with the profile's wording; Privacy Policy and Terms should be reviewed by a legal adviser.

## Motion

All motion is subtle and purposeful: an intro where gold lines converge into the mark, word-by-word headline reveals, image mask reveals, gentle parallax, a cursor-following preview on the expertise list, animated map corridors and page-transition curtains. Everything respects `prefers-reduced-motion`, pauses off-screen, and the hero film has a pause control.

## WordPress (GoDaddy Managed WordPress)

`python3 tools/make-wp-theme.py` packages the built site as a theme: `share/hk-business-consultancy-theme.zip`.
Upload it under **Appearance → Themes → Add New → Upload Theme** and activate it. The theme (`wp-theme/`) serves the
site from its `site/` folder at the domain root (`/`, `/about.html`, …), leaves WordPress admin untouched, emails
contact-form enquiries with `wp_mail()` to the address in `site.config.json`, and keeps a copy under **Tools → HK Enquiries**.
