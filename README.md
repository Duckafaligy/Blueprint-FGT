# Blueprint-FGT

FGT Flow: a working demo for Free Geek Toronto, built for the Blueprint 2026 case competition (FUSE Society).

One web app follows every donated computer from the first offer to the final sale or recycling. The left sidebar switches between five previews:

| Preview | What it shows |
|---|---|
| Donor | An 8 question funnel that says bring it in, book a business pickup, or FGT will recycle it |
| Individual | The refurbished shop, cart, checkout and order tracking |
| Business | Inquiry, quote, pickup booking with a CSV device list, tracking, certificates and the impact report |
| FGT Staff | Intake, wipe log, partners and deals, shipments, QC, ready to sell, devices, people, settings |
| Partner | Incoming shipments, batches, device status and earnings |

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build, same as Vercel runs
```

## Deploy

Import the repo in Vercel. No environment variables and no database are needed.

## How the demo works

- Demo day is Friday, Nov 6, 2026. The starting data is in `src/lib/seed.ts`.
- All changes live in the browser (localStorage). **Reset demo** in the sidebar restores the starting data.
- The rules every screen follows are in `RULES.md`: the device status flow, partner share (20 to 50 percent of FGT's resale price, set per partner), and the business booking flow.
- No real logins, payments or emails. Emails show as on-screen previews and certificates print to PDF from the browser.
- Shop products and photos come from Free Geek Toronto's public site and online shop. Check licences before any public use.
