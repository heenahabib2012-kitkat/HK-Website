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

1. **Official HK logo** — the header/footer currently use an interim gold-framed HK monogram. Replace `src/partials/logo.html` (one place) with the official logo, and `src/assets/brand/hk-mark.svg` (favicon).
2. **Founder photograph** — save as `src/assets/img/photos/founder.jpg`. Until then a framed placeholder is shown.
3. **Photography** — every image slot uses a generated architectural line-art plate in the brand colours. Drop real photography into `src/assets/img/photos/<slot>.jpg` to replace any of them (slot list in that folder's README).
4. **Brand film** — the home hero is a real-time, code-rendered animation (gold lines → HK mark → wireframe skyline → globe with corridors from Dubai). To use a produced film instead, add `src/assets/video/hk-brand-film.mp4` (optionally `hk-brand-film.webm` and `hk-brand-film-mobile.mp4`); it replaces the animation automatically.
5. **Client & associate logos** — currently set as typographic wordmarks in `clients.html` and `network.html`.
6. **Facebook page URL** — `social.facebook` in `site.config.json` currently points to a Facebook search for the page name.
7. **Content to confirm against the Company Profile 2026** — the founder's message on the About page is drafted from the brief and should be replaced with the profile's wording; Privacy Policy and Terms should be reviewed by a legal adviser.

## Motion

All motion is subtle and purposeful: an intro where gold lines converge into the mark, word-by-word headline reveals, image mask reveals, gentle parallax, a cursor-following preview on the expertise list, animated map corridors and page-transition curtains. Everything respects `prefers-reduced-motion`, pauses off-screen, and the hero film has a pause control.
