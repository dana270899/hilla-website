# Launch checklist

Tick items off with `[x]` as they're done.

## Privacy page — `privacy.html`

- [ ] Hilla reads the whole page and approves the wording
- [ ] Confirm the privacy contact email (currently `einhilla@gmail.com`)
- [ ] Confirm the tools listed match what's actually installed (Google Analytics, Microsoft Clarity). If a tool is added or removed later, update the page
- [ ] Update "עדכון אחרון" (last updated) to the publish date
- [ ] Optional: have an Israeli privacy lawyer give it a quick look

## Accessibility page — `accessibility.html`

- [ ] Fill in the accessibility coordinator details (all `[placeholder]` fields):
  - [ ] Name — `[שם רכז/ת הנגישות]`
  - [ ] Phone — `[מספר טלפון]`
  - [ ] Email — `[כתובת דוא"ל]`
  - [ ] Office address — `[כתובת]`
- [ ] "הסדרי נגישות במשרד": describe the office's physical accessibility (parking, entrance, elevator, restroom), or delete the section if there's no public office
- [ ] Re-check the "הסתייגויות" (limitations) list still matches the site
- [ ] Update "עדכון אחרון" (last updated) to the publish date
- [ ] Remove the `<!-- TODO -->` comments once filled in

## Connect analytics — `analytics.js`

- [ ] Create a GA4 property and web data stream for the live domain
- [ ] Paste the Measurement ID (`G-XXXXXXXXXX`) into `GA_ID`
- [ ] Create a Clarity project for the live domain
- [ ] Paste the Project ID into `CLARITY_ID`
- [ ] In Clarity → Settings → Masking, set masking to **Strict** (the privacy page promises typed text isn't saved)
- [ ] After deploying, open the live site and confirm a visit shows up in GA → Reports → Realtime
- [ ] Confirm Clarity shows a recording within ~2 hours
- [ ] Note: nothing loads on `localhost`, so test on the live domain only

## Also still open (found in the code)

- [ ] Real WhatsApp number in the footer of every page — replace `972XXXXXXXXX`
- [ ] Footer lead text is still a draft ("אולי משפט קצר בסגנון…")
- [ ] Once the domain is known: add `og:url` and `og:image` (full `https://` URLs) to the blog pages
- [ ] Optional: give each blog article its own photo (they share one stock photo for now)
