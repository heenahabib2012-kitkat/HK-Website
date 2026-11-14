# HK Business Consultancy — Website

Static website: no build step. Upload the whole folder to any web host.

## Run locally
    npx http-server -p 8080 .
Then open http://localhost:8080 (it needs a server because it uses ES modules).

## What's where
- `index.html` — all sections: About, Founder's Message, Vision & Mission, Services (3D chessboard), Industries (dial-wheel), Global Reach (globe), Associate Companies, Clients, Why HK, Insights, Contact
- `css/styles.css` — styles (royal navy, gold, white)
- `js/` — interactions and the WebGL scenes (`chess.js`, `wheel.js`, `globe.js`)
- `assets/` — hero video, seal logo, founder photo, client and associate logos
- `profile/` — the company profile brochure (HTML source + print-ready PDFs)

## Contact form
Without a form service the "Connect With HK" button opens the visitor's email app addressed to info@honestandkeen.com.
To receive enquiries directly, create a free form at https://formspree.io and put its URL in `data-endpoint="…"` on the `<form>` in `index.html`.

## Hosting options
- **Netlify / Vercel / Cloudflare Pages** (free): drag-and-drop this folder or connect the GitHub repo; then point your domain (hkbusinessconsultancy.com) at it.
- **GitHub Pages** (free): repository Settings → Pages → deploy from the branch.
- **Any existing host** (cPanel etc.): upload the folder contents to `public_html`.
