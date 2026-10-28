"use client";
import { useEffect, useRef, useState } from "react";
import { Card, KV } from "@/components/ui";
import { share, usd, partnerOf } from "@/lib/helpers";
import type { AppState, Partner, Shipment } from "@/lib/types";

export const WORK_OPTIONS = ["Batteries", "Memory", "Keyboards", "Screens", "Fans", "Full refurbish", "Linux install"];
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** number that tweens from its last value */
export function AnimNum({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    let raf = 0; const from = last.current; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 350); const x = from + (value - from) * (1 - Math.pow(1 - k, 3)); last.current = x; setV(x); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{Math.round(v)}{suffix}</>;
}

export function ShareSlider({ value, onChange, min, max }: { value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <div className="col gap12">
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <b style={{ fontFamily: "var(--f-display)", fontSize: 72, lineHeight: 1, color: "var(--brand)" }}><AnimNum value={value} suffix="%" /></b>
        <span className="muted small">of FGT's resale price, between {min}% and {max}%</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} aria-label="Deal share" onChange={(e) => onChange(Number(e.target.value))} />
      <div className="row between tiny muted"><span>{min}%</span><span>{max}%</span></div>
    </div>
  );
}

export function DealSummary({ pct }: { pct: number }) {
  const price = 309.99;
  const earns = share(price, pct);
  return (
    <Card title="Deal summary" style={{ alignSelf: "flex-start", width: 380, maxWidth: "100%" }}>
      <span className="muted small">Example: a Dell Latitude 5420 that sells for {usd(price)}</span>
      <KV rows={[["Resale price", usd(price)], ["Partner earns", <span key="e" style={{ color: "var(--ok)" }}>{usd(earns)}</span>], ["FGT keeps", usd(price - earns)]]} />
      <span className="help">Paid when the device sells.</span>
    </Card>
  );
}

export const shipDevices = (s: AppState, sh: Shipment) => sh.deviceIds.map((id) => s.devices.find((d) => d.id === id)).filter((d) => !!d);
const DONE = ["Done", "Ready for QC", "Ready to sell", "Sold"];
export const isDoneDev = (st: string) => DONE.includes(st);
export const shipValue = (s: AppState, sh: Shipment) => shipDevices(s, sh).reduce((a, d) => a + (d!.price ?? 0), 0);
export const shipProgress = (s: AppState, sh: Shipment) => {
  const ds = shipDevices(s, sh);
  return ds.length ? Math.round((ds.filter((d) => isDoneDev(d!.status)).length / ds.length) * 100) : 0;
};
export const shipShare = (s: AppState, sh: Shipment) => {
  const p = partnerOf(s, sh.partnerId);
  return shipDevices(s, sh).reduce((a, d) => a + share(d!.price ?? 0, p?.sharePct ?? 0), 0);
};

export function partnerStats(s: AppState, p: Partner) {
  const mine = s.devices.filter((d) => d.partnerId === p.id);
  const out = mine.filter((d) => ["At partner", "Refurbishing", "Done"].includes(d.status)).length;
  const queued = s.shipments.filter((x) => x.partnerId === p.id && x.status === "Planned").reduce((a, x) => a + x.deviceIds.length, 0);
  const earned = mine.filter((d) => d.status === "Sold").reduce((a, d) => a + share(d.price ?? 0, p.sharePct), 0);
  const fails = mine.filter((d) => d.history.some((h) => h.label.startsWith("Failed QC"))).length;
  const tested = mine.filter((d) => d.qc || d.history.some((h) => h.label.startsWith("Failed QC"))).length;
  return { out, queued, earned, fails, tested };
}

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
};
