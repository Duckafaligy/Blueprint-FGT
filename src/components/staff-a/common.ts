import type { AppState, Lot } from "@/lib/types";
import { usd0 } from "@/lib/helpers";

/** estimated resale value of one device, used for bookings */
export const EST = 330;
export const rangeOf = (v: number) => `${usd0(v * 0.2)} to ${usd0(v * 0.5)}`;
export const canIntake = (l: Lot) => l.status === "Picked up" || (l.status === "In progress" && !l.intakeDone);
export const isToday = (l: Lot, day: string) => l.window.startsWith(day);

/** next wipe certificate number, FGT-2026-xxxxx */
export function nextCert(s: AppState, taken: string[] = []): string {
  let max = 400;
  for (const d of s.devices) {
    const m = d.wipe?.cert?.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  for (const c of taken) max = Math.max(max, parseInt(c.slice(-5), 10));
  return `FGT-2026-${String(max + 1).padStart(5, "0")}`;
}
