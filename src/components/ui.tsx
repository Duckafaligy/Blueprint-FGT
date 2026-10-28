"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { STATUS_COLOR } from "@/lib/helpers";
import { useApp } from "@/lib/store";

type BtnProps = {
  children: ReactNode; onClick?: () => void; href?: string; variant?: "primary" | "outline" | "soft" | "accent" | "ok" | "bad" | "ghost";
  size?: "sm" | "md" | "lg"; disabled?: boolean; style?: CSSProperties; type?: "button" | "submit"; title?: string; className?: string;
};
export function Btn({ children, onClick, href, variant = "primary", size = "md", disabled, style, type = "button", title, className = "" }: BtnProps) {
  const cls = `btn ${variant === "primary" ? "" : variant} ${size === "md" ? "" : size} ${disabled ? "disabled" : ""} ${className}`.replace(/\s+/g, " ");
  if (href && !disabled) return <Link href={href} className={cls} style={style} title={title} onClick={onClick}>{children}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style} title={title}>{children}</button>;
}

export function Status({ s, label }: { s: string; label?: string }) {
  return <span className="chip" style={{ ["--c" as string]: STATUS_COLOR[s] ?? "var(--muted)" }}><i />{label ?? s}</span>;
}

export function Check({ on, onChange, label, ok }: { on: boolean; onChange?: (v: boolean) => void; label?: ReactNode; ok?: boolean }) {
  return (
    <span className="checkrow" role="checkbox" aria-checked={on} tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onChange?.(!on); }}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange?.(!on); } }}>
      <span className={`cb ${on ? "on" : ""} ${ok ? "ok" : ""}`}>{on ? "✓" : ""}</span>
      {label != null && <span>{label}</span>}
    </span>
  );
}

export function Seg<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return <div className="seg">{items.map((i) => <button key={i} className={i === value ? "on" : ""} onClick={() => onChange(i)}>{i}</button>)}</div>;
}

export function Tabs({ items, value, onChange }: { items: string[]; value: number; onChange: (i: number) => void }) {
  return <div className="tabs">{items.map((t, i) => <button key={t} className={i === value ? "on" : ""} onClick={() => onChange(i)}>{t}</button>)}</div>;
}

export function Field({ label, value, onChange, placeholder, type = "text", error, help, textarea, style, width, list }: {
  label: string; value: string | number; onChange?: (v: string) => void; placeholder?: string; type?: string; error?: string; help?: string; textarea?: boolean; style?: CSSProperties; width?: number; list?: string[];
}) {
  const id = useId();
  const common = { id, className: `input ${error ? "err" : ""}`, value: String(value), placeholder, onChange: (e: { target: { value: string } }) => onChange?.(e.target.value) };
  return (
    <div className="field" style={width ? { flex: "none", width, ...style } : style}>
      <label htmlFor={id}>{label}</label>
      {textarea ? <textarea {...common} /> : <input {...common} type={type} list={list ? id + "l" : undefined} />}
      {list && <datalist id={id + "l"}>{list.map((o) => <option key={o} value={o} />)}</datalist>}
      {error ? <span className="err-text">{error}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, width }: { label: string; value: string; onChange: (v: string) => void; options: string[]; width?: number }) {
  const id = useId();
  return (
    <div className="field" style={width ? { flex: "none", width } : undefined}>
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>
    </div>
  );
}

export function Progress({ pct, color }: { pct: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.max(0, Math.min(100, pct))), 40); return () => clearTimeout(t); }, [pct]);
  return <div className="progress"><i style={{ width: w + "%", background: color }} /></div>;
}

/** number that counts up when it first appears */
export function CountUp({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now(); const dur = 700; const from = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); setV(from + (value - from) * e); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{v.toLocaleString("en-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}

export function Kpi({ label, value, sub, color, prefix, suffix, decimals, raw }: { label: string; value?: number; sub?: string; color?: string; prefix?: string; suffix?: string; decimals?: number; raw?: string }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <b style={{ color }}>{raw ?? <CountUp value={value ?? 0} prefix={prefix} suffix={suffix} decimals={decimals} />}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export function Card({ title, children, right, style, lift, className = "" }: { title?: string; children: ReactNode; right?: ReactNode; style?: CSSProperties; lift?: boolean; className?: string }) {
  return (
    <div className={`card ${lift ? "lift" : ""} ${className}`} style={style}>
      {(title || right) && <div className="row between">{title ? <h3>{title}</h3> : <span />}{right}</div>}
      {children}
    </div>
  );
}

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return <div className="kv">{rows.map(([a, b], i) => <div key={i}><span>{a}</span><span>{b}</span></div>)}</div>;
}

export function Banner({ color = "var(--brand)", children, style }: { color?: string; children: ReactNode; style?: CSSProperties }) {
  return <div className="banner" style={{ ["--c" as string]: color, ...style }}>{children}</div>;
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      <div className="row gap12">{actions}</div>
    </div>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>{children}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return <div className="toasts">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind === "ok" ? "" : t.kind}`}>{t.msg}</div>)}</div>;
}

export function EmailPreview({ to, subject, children }: { to: string; subject: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", alignSelf: "flex-start", width: 440, maxWidth: "100%" }}>
      <div className="row between" style={{ background: "var(--surface2)", padding: "12px 18px" }}><b className="tiny muted">EMAIL PREVIEW</b><span className="tiny muted">Not sent in the demo</span></div>
      <div className="col gap12" style={{ padding: "20px 22px" }}>
        <span className="tiny muted">To: {to}</span>
        <b style={{ fontSize: 19 }}>{subject}</b>
        <hr style={{ border: 0, borderTop: "1px solid var(--line)", width: "100%" }} />
        <div style={{ lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

/** Generic table. cols have a header and a render function. */
export interface Col<T> { head: ReactNode; cell: (r: T, i: number) => ReactNode; width?: number | string; className?: string }
export function DataTable<T>({ cols, rows, onRow, rowClass, empty = "Nothing here yet." }: { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; rowClass?: (r: T) => string; empty?: string }) {
  return (
    <div className="table">
      <table>
        <thead><tr>{cols.map((c, i) => <th key={i} style={{ width: c.width }}>{c.head}</th>)}</tr></thead>
        <tbody className="stagger-rows">
          {rows.length === 0 && <tr><td colSpan={cols.length} className="muted center" style={{ padding: 28 }}>{empty}</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className={`${onRow ? "click" : ""} ${rowClass?.(r) ?? ""}`} onClick={() => onRow?.(r)}>
              {cols.map((c, j) => <td key={j} className={c.className}>{c.cell(r, i)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pipeline({ stages, now }: { stages: string[]; now: number }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 0, width: "100%" }}>
      {stages.map((s, i) => (
        <div key={s} style={{ display: "contents" }}>
          <div className="col center" style={{ alignItems: "center", gap: 8, width: 110, flexShrink: 0 }}>
            <div style={{ width: i === now ? 34 : 28, height: i === now ? 34 : 28, borderRadius: "50%", background: i <= now ? "var(--brand)" : "var(--surface2)", border: `3px solid ${i === now ? "var(--accent)" : i <= now ? "var(--brand)" : "var(--surface2)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, transition: "all .4s var(--ease-out)" }}>{i < now ? "✓" : ""}</div>
            <span style={{ fontSize: 14, fontWeight: i <= now ? 700 : 500, color: i <= now ? "var(--fg)" : "var(--muted)", lineHeight: 1.25 }}>{s}</span>
          </div>
          {i < stages.length - 1 && <div style={{ flex: 1, height: 4, borderRadius: 2, background: i < now ? "var(--brand)" : "var(--surface2)", marginTop: 15, transition: "background .4s" }} />}
        </div>
      ))}
    </div>
  );
}
