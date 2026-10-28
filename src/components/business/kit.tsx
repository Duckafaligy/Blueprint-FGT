"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { Btn } from "@/components/ui";
import type { Device, Inquiry, Lot } from "@/lib/types";

export const COMPANY = "Maple Street Accounting";

/** customer wording for a device status */
export const cust = (st: string) =>
  ({ "At partner": "Being refurbished", Refurbishing: "Being refurbished", Done: "Being refurbished", "Ready for QC": "Being refurbished", Sold: "Reused" } as Record<string, string>)[st] ?? st;
/** key used for the Status chip colour */
export const custColor = (st: string) => (st === "Sold" ? "Ready to sell" : ["At partner", "Done", "Ready for QC"].includes(st) ? "Refurbishing" : st);
/** how many of six steps are done */
export const stepsDone = (st: string) =>
  ({ Booked: 1, Received: 2, Wiped: 3, "At partner": 4, Refurbishing: 4, Done: 4, "Ready for QC": 4, "Ready to sell": 5, Sold: 6, Recycled: 6 } as Record<string, number>)[st] ?? 1;
export const STEP_NAMES = ["Booked", "Received", "Wiped", "Being refurbished", "Ready to sell", "Reused or recycled"];
export const finished = (d: Device) => ["Ready to sell", "Sold", "Recycled"].includes(d.status);

export function MiniProgress({ st }: { st: string }) {
  const n = stepsDone(st);
  return <div className={`mini6 ${n === 6 ? "done" : ""}`} title={STEP_NAMES[n - 1]}>{STEP_NAMES.map((s, i) => <i key={s} className={i < n ? "on" : ""} style={{ animationDelay: i * 60 + "ms" }} />)}</div>;
}

export function useDraft() {
  const { state, update } = useApp();
  const d = state.inquiryDraft;
  return {
    d,
    set: (k: string, v: unknown) => update((s) => { s.inquiryDraft[k] = v; }),
    s: (k: string, def = "") => (d[k] == null ? def : String(d[k])),
    n: (k: string, def = 0) => (d[k] == null ? def : Number(d[k])),
    a: (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []),
  };
}

/** the inquiry this business just sent (or the latest one) */
export function useInquiry(): Inquiry | undefined {
  const { state } = useApp();
  const id = state.inquiryDraft.sentId;
  return state.inquiries.find((i) => i.id === id) ?? state.inquiries[state.inquiries.length - 1];
}

export function useStartOver() {
  const { update } = useApp();
  const router = useRouter();
  return () => { update((s) => { s.inquiryDraft = {}; }); router.push("/business/inquiry/1"); };
}

export const myLots = (lots: Lot[]) => lots.filter((l) => l.company === COMPANY).sort((a, b) => (a.id < b.id ? 1 : -1));

export function Crumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav className="biz-crumbs" aria-label="Breadcrumb">
      {items.map(([label, href], i) => (
        <span key={label} className="row gap8">{href ? <Link href={href}>{label}</Link> : <b style={{ color: "var(--fg)" }}>{label}</b>}{i < items.length - 1 && <span>/</span>}</span>
      ))}
    </nav>
  );
}

export function Q({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return <div className="biz-q"><span className="qlabel">{label}</span>{children}{error && <span className="err-text">{error}</span>}</div>;
}

export function Chips({ options, value, onChange, multi }: { options: readonly string[]; value: string | string[]; onChange: (v: string | string[]) => void; multi?: boolean }) {
  const on = (o: string) => (multi ? (value as string[]).includes(o) : value === o);
  return (
    <div className="biz-chips">
      {options.map((o) => (
        <button key={o} type="button" className={`chip-btn ${on(o) ? "on" : ""}`} aria-pressed={on(o)}
          onClick={() => onChange(multi ? ((value as string[]).includes(o) ? (value as string[]).filter((x) => x !== o) : [...(value as string[]), o]) : o)}>{o}</button>
      ))}
    </div>
  );
}

export function Opts({ options, value, onChange }: { options: { v: string; label: string; sub?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="col gap12 stagger">
      {options.map((o) => (
        <button key={o.v} type="button" className={`opt ${value === o.v ? "on" : ""}`} onClick={() => onChange(o.v)} role="radio" aria-checked={value === o.v}>
          <span>{o.label}{o.sub && <small>{o.sub}</small>}</span>
          <span className="dot">{value === o.v ? "✓" : ""}</span>
        </button>
      ))}
    </div>
  );
}

export function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className={`biz-count ${value > 0 ? "has" : ""}`}>
      <span>{label}</span>
      <div className="stepper">
        <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>-</button>
        <b>{value}</b>
        <button type="button" className="plus" aria-label={`More ${label}`} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

/** funnel card with progress pips, back link and a Next button that shakes when onNext returns false */
export function Wizard({ n, of, title, sub, children, back, onNext, nextLabel = "Continue", nextDisabled, extra }: {
  n: number; of: number; title: string; sub?: string; children: ReactNode; back?: string; onNext: () => boolean | void; nextLabel?: string; nextDisabled?: boolean; extra?: ReactNode;
}) {
  const [shake, setShake] = useState(0);
  return (
    <div className="page narrow">
      <div className={`qcard ${shake ? "shake" : ""}`} key={shake}>
        <div className="col gap8">
          <span className="small muted bold">Step {n} of {of}</span>
          <div className="pips" aria-hidden>{Array.from({ length: of }, (_, i) => <i key={i} className={i < n ? "on" : ""} />)}</div>
        </div>
        <div className="col gap8"><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
        {children}
        <div className="row between">
          {back ? <Btn href={back} variant="soft">Back</Btn> : <span />}
          <div className="row gap12">{extra}<Btn size="lg" disabled={nextDisabled} onClick={() => { if (onNext() === false) setShake((x) => x + 1); }}>{nextLabel}</Btn></div>
        </div>
      </div>
    </div>
  );
}
