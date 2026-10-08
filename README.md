# HK Business Consultancy — Website

A static, dependency-free site. The hero uses a looping background video (`assets/hero.mp4`) with a royal-blue tint; the globe is rendered with custom WebGL (`js/globe.js`). There are no build steps or npm packages.

## Run locally
```
npx http-server -p 8080 .
```
Open http://localhost:8080. It needs a server, not `file://`, because it uses ES modules.

## Structure
- `index.html` — all sections and copy
- `css/styles.css` — design tokens (royal blue / gold / white) and layout
- `js/main.js` — navigation, reveals, expertise ecosystem, industries orbit, case-study scroller, insights filter, contact form
- `js/globe.js`, `js/world.js` — WebGL globe, simplified coastlines, UAE hub and regional connections
- `js/gl.js` — small WebGL/maths helpers

## Before launch
- **Contact form:** set `data-endpoint` on the `<form>` in `index.html` to a form handler (Formspree, a CRM webhook or your own API). Until you do, the form validates input but does not send anything.
- **Case studies:** the four "Selected Engagements" panels describe types of engagement and contain no client names or results. Replace them with real projects once clients approve.
- **Insights:** the article titles are editorial themes marked "In preparation". Link each one to a published article.
- **Fonts:** Cormorant Garamond and Jost load from Google Fonts.
