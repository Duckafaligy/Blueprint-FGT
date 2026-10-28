import type { AppState, Device, DeviceStatus, Partner, Shipment, Lot } from "./types";

export const usd = (x: number) => "$" + x.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const usd0 = (x: number) => "$" + Math.round(x).toLocaleString("en-CA");
/** partner share in dollars: a percent of FGT's resale price */
export const share = (price: number, pct: number) => Math.round(price * pct) / 100;

export const NOW = "Nov 6";
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;

export const lotOf = (s: AppState, id: string): Lot | undefined => s.lots.find((l) => l.id === id);
export const partnerOf = (s: AppState, id?: string): Partner | undefined => s.partners.find((p) => p.id === id);
export const shipmentOf = (s: AppState, id?: string): Shipment | undefined => s.shipments.find((x) => x.id === id);
export const devicesOfLot = (s: AppState, lotId: string): Device[] => s.devices.filter((d) => d.lotId === lotId);
export const devicesOfShipment = (s: AppState, shipId: string): Device[] => s.devices.filter((d) => d.shipmentId === shipId);

/** a lot is finished when every device is ready to sell, sold or recycled */
export const lotFinished = (s: AppState, lotId: string) => {
  const ds = devicesOfLot(s, lotId);
  return ds.length > 0 && ds.every((d) => ["Ready to sell", "Sold", "Recycled"].includes(d.status));
};

export const sharePctOf = (s: AppState, d: Device) => partnerOf(s, d.partnerId)?.sharePct ?? 0;
export const shareOfDevice = (s: AppState, d: Device) => (d.price && d.partnerId ? share(d.price, sharePctOf(s, d)) : 0);

export function addHistory(d: Device, label: string, detail?: string, by = "Sam") {
  d.history.push({ at: `${NOW} · ${new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`, label, detail, by });
}

export const STATUS_COLOR: Record<string, string> = {
  Booked: "var(--muted)", Received: "var(--brand)", Wiped: "var(--accent)", "At partner": "var(--warn)", Refurbishing: "var(--warn)",
  Done: "var(--ok)", "Ready for QC": "var(--accent)", "Ready to sell": "var(--ok)", Sold: "var(--brand)", Recycled: "var(--muted)",
  Planned: "var(--accent)", "Ready for pickup": "var(--accent)", Shipped: "var(--brand)", Returned: "var(--muted)",
  "Picked up": "var(--warn)", "In progress": "var(--warn)", Closed: "var(--muted)", Active: "var(--ok)", Onboarding: "var(--accent)",
  Success: "var(--ok)", Failed: "var(--bad)", Pass: "var(--ok)", Fail: "var(--bad)", Paid: "var(--ok)", "Pending sale": "var(--warn)",
  Sent: "var(--brand)", Quoted: "var(--accent)", Approved: "var(--ok)", Paid2: "var(--ok)",
};

export const isFinished = (st: DeviceStatus) => ["Ready to sell", "Sold", "Recycled"].includes(st);

/** download a text file in the browser */
export function download(filename: string, text: string, type = "text/csv") {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const csvEscape = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
