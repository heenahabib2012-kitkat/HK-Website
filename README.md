# HK Business Consultancy: Website

The marketing website for **HK Business Consultancy**, a Dubai-headquartered business advisory firm. Its main job is to bring in qualified enquiries and consultation requests.

It is a static site with no build step and no framework: plain HTML, CSS and vanilla JavaScript. You can host it on any static host, such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 or cPanel.

## Run locally

```bash
python3 -m http.server 8080     # or: npx http-server -p 8080 .
# open http://localhost:8080
```

## Structure

```
index.html              All sections, SEO meta and schema.org markup
assets/css/site.css     Design tokens at the top, then each section, then responsive rules
assets/js/config.js     EDIT THIS: form endpoint, enquiry email, WhatsApp number
assets/js/site.js       Header, mobile menu, services, tabs, CTA prefill, form, reveal
assets/img/             Favicon and the Chairman's portrait (founder.jpg)
```

## Page sections

1. **Hero:** positioning statement, *Book a Consultation* and *Discuss Your Business*, and an "at a glance" panel.
2. **Our perspective:** one objective, multiple disciplines, plus three pillars: strategic thinking, commercial understanding and practical execution.
3. **Services:** nine service lines grouped into three practices. Each one expands to show what it covers and has a "Discuss this service" link.
4. **Who we help:** entrepreneurs, international businesses, investors, and established businesses and brands.
5. **Approach:** Idea → Structure → Market → Launch → Scale.
6. **Sectors:** the organisations HK has worked with, grouped by sector, followed by testimonial and case-study placeholders.
7. **About:** the story and a timeline (Kuwait 2015 → Dubai HQ 2021 → today).
8. **Chairman's message:** Habib Koya Marapatta, with his operating background.
9. **Leadership:** core team, regional directors and advisory board, shown as tabs.
10. **Presence:** Dubai HQ, Kuwait, Saudi Arabia, Qatar, Oman, India and Malaysia.
11. **Book a consultation:** the enquiry form and direct contact details.

## Calls to action

- The primary CTA is **Book a Consultation**. It appears in the header on desktop, in the hero and in the mobile menu. On phones there is also a bar fixed to the bottom of the screen; it appears after the hero and hides once the contact section is on screen.
- The secondary CTA is **Discuss Your Business**. It appears in the hero and on each audience card.
- All CTAs go to the consultation form. The "Discuss this service" and audience links pre-select the matching option in the form.

## Enquiry form

Set `formEndpoint` in `assets/js/config.js` to any endpoint that accepts a `multipart/form-data` POST, such as Formspree, Basin, Getform or your own API.

**If `formEndpoint` is empty,** the form still validates. On submit it opens the visitor's email app with the enquiry filled in and addressed to `info@honestandkeen.com`, and shows a link to send the same message on WhatsApp instead. The form also has a honeypot field to catch spam bots.

## Content sources

No copy on the site was invented. It comes from HK's own reference content already in this repository's history:

- Services, team, group companies, markets, client list, timeline, Chairman's message and contact details come from the content file on branch `claude/blissful-lovelace-lovcxp` (`assets/js/data.js`).
- Some service wording ("Investment & Strategic Advisory", the business consulting scope, "Understand the business, its objectives and its market") comes from branch `claude/elegant-brown-jfchp2`.
- The founder's operating background and portrait come from branch `claude/mcp-list-command-84vih9` (habibkoya.com).

The site deliberately leaves out several things that appeared in earlier drafts:

- **Statistics:** "10+ years", "50+ clients", "15+ countries", "30+ years" and "43 countries".
- **Awards:** none are shown.
- **Advisory board bios:** only names and regions are shown, because the bios contain claims about government relations.

## Before launch: confirm with HK

Search `index.html` for text in square brackets.

| Item | Where | Action |
|---|---|---|
| `[CLIENT TESTIMONIAL TO BE PROVIDED]` | Sectors → proof cards | Supply an approved testimonial, or remove the card |
| `[CASE STUDY DETAILS TO BE PROVIDED]` (×2) | Sectors → proof cards | Supply approved case studies, or remove the cards |
| `[OFFICE ADDRESS TO BE PROVIDED]` | Contact | Add the Dubai office address |
| Client names | Sectors | Confirm HK has permission to publish every name, especially **Embassy of India, Kuwait** |
| Service wording | Services 03 and 07 | Check that the wording for **Legal & Compliance Support** and **Investment & Strategic Advisory** matches HK's licensed activities |
| Founder background | Chairman section | Confirm the wording about previous roles (Domino's, Starbucks, Auntie Anne's, Costa Coffee, HMB Group) |
| Chairman's portrait | `assets/img/founder.jpg` | Replace it with a formal portrait if one is available (~900×1100, 4:5) |
| Email domain | Contact, footer, `config.js` | Confirm `info@honestandkeen.com` is the right enquiry inbox |
| Social links | none yet | Add LinkedIn and Instagram URLs when they are available |
| Privacy policy | none yet | Add one before collecting enquiries through a third-party form service |
| Domain | `<link rel="canonical">`, `og:url` and JSON-LD in `index.html` | Currently set to `www.hkbusinessconsultancy.com` |

## Design

- **Colour:** deep petrol ink (`#0E1B22`), warm paper (`#F6F2EB`), and brass used only as an accent. All tokens are at the top of `site.css`.
- **Type:** Newsreader for display and Hanken Grotesk for body text, loaded from Google Fonts with Georgia and Helvetica/Arial fallbacks.
- **Motion:** a light fade-in as sections scroll into view. It is switched off when `prefers-reduced-motion` is set, and a safety net makes sure content is never left hidden.
- **Accessibility:** skip link, semantic landmarks, visible focus styles, keyboard-operable tabs and accordions, labelled form fields with inline errors, and touch targets of at least 44px.
- **Imagery:** the only photograph is the Chairman's portrait. The hero uses a fine geometric (khatam) line pattern instead of stock photography.
