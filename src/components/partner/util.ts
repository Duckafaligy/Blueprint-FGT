import type { AppState, Device, Shipment } from "@/lib/types";
import { devicesOfShipment, share } from "@/lib/helpers";

export const PID = "p1";
export const AFTER_DONE = ["Done", "Ready for QC", "Ready to sell", "Sold"];
export const mine = (s: AppState) => s.shipments.filter((x) => x.partnerId === PID);
export const pct = (s: AppState) => s.partners.find((p) => p.id === PID)?.sharePct ?? 0;
export const value = (ds: Device[]) => ds.reduce((a, d) => a + (d.price ?? 0), 0);
export const myShare = (s: AppState, ds: Device[]) => share(value(ds), pct(s));
export const doneCount = (ds: Device[]) => ds.filter((d) => AFTER_DONE.includes(d.status)).length;
export const shipDevices = (s: AppState, x: Shipment) => devicesOfShipment(s, x.id);
export const passed = (d: Device) => d.status === "Ready to sell" || d.status === "Sold";
