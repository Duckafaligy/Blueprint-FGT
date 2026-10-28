# Shared rules for the FGT Flow demo (read before coding)

Demo day is Friday, Nov 6. All state lives in `useApp()` (`src/lib/store.tsx`). Change it only with `update((d) => { ... })`, which gives you a draft copy. Show feedback with `toast("...")`. Reset demo restores `src/lib/seed.ts`.

## Device status flow (a status only moves along this flow)
Booked -> Received (intake) -> Wiped (wipe log) -> At partner (shipment shipped) -> Refurbishing -> Done (partner finished) -> Ready for QC (batch returned to FGT) -> Ready to sell (QC pass) -> Sold.
- In-house path: Received -> Wiped -> Ready for QC (after in-house prep) -> Ready to sell -> Sold.
- Recycle path: Received -> Wiped -> Recycled. A reason is required at intake.
- A failed wipe sets `wipe.result = "Failed"` and `wipe.destroyed = true`. The device still counts as wiped.
- QC fail on a partner device: status back to "At partner", the shipment stays with the partner, history entry "Failed QC, back to partner at no cost". QC fail on an in-house device: status back to "Wiped".
- QC pass: status "Ready to sell", `grade`, `qc` record, `priceApproved = false` until staff approve the price on Ready to sell. `price` already holds FGT's estimated resale price.
- Every change adds an entry with `addHistory(device, label, detail?, by?)`.

## Shipments
Planned (staff chose a partner and devices; `notified` true after staff tell the partner) -> Ready for pickup (partner accepted) -> Shipped (devices become "At partner") -> Refurbishing -> Done (all devices Done) -> Returned (staff receive it; devices become "Ready for QC").
Only devices with status "Wiped", `path === "partner"` and no `shipmentId` can be planned. Planning sets `partnerId` and `shipmentId` on each device.

## Money
Partner share is a percent (20 to 50, `settings.shareMin` and `shareMax`) of FGT's resale price (`device.price`), set per partner (`partner.sharePct`). Use `share(price, pct)`. It is earned when the device passes QC, shown as "Pending sale" while Ready to sell and "Paid" once Sold. Never use a flat per-device fee.

## Business flow
Inquiry -> Quote ($settings.pickupFee) -> approve -> schedule pickup -> device list (CSV or typed) -> confirmed. Confirming creates a new `Lot` (status "Booked", company Maple Street Accounting) and one device per row (status "Booked", type from the row), so staff see it under Bookings and can run intake on it. A lot is finished when every device is Ready to sell, Sold or Recycled (`lotFinished`). The impact report opens only then.

## Coding rules
- Every page is a client component ("use client"). Read dynamic params with `useParams()` from `next/navigation`.
- Use the classes in `src/app/globals.css` and the components in `src/components/ui.tsx` and `shell.tsx`. Page animation classes: `.page`, `.stagger`, `.qcard`, `.stamp`, `.shake`. Add more CSS only in your own file under your role's folder.
- No new dependencies. No emoji. Plain words, no em dashes.
- Every button, link, form field, tab and toggle must do something real. Validate forms and show errors with `error` on `Field`.
- Run `npx tsc --noEmit` before you finish. Do not run `next build` or the dev server; the lead does that.
- Do not edit files outside your own folders. If you need a new field in `types.ts` or `seed.ts`, say so in your report instead of editing them.
