"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";

export function Logo({ href }: { href?: string }) {
  const inner = (<><img src="/img/logo.png" alt="Free Geek Toronto" /><b>FLOW</b></>);
  return href ? <Link href={href} className="logo">{inner}</Link> : <div className="logo">{inner}</div>;
}

/** Donor and Business funnels: logo and a phone number, no nav links. */
export function FunnelShell({ children, steps }: { children: ReactNode; steps?: { label: string; on: boolean }[] }) {
  return (
    <div>
      <header className="fun-head">
        <Logo />
        {steps && (
          <div className="row gap12">
            {steps.map((s, i) => (
              <span key={s.label} className="row gap8" style={{ opacity: s.on ? 1 : 0.5 }}>
                <span className="avatar" style={{ width: 26, height: 26, fontSize: 13, background: s.on ? "var(--brand)" : "var(--surface2)", color: s.on ? "#fff" : "var(--muted)" }}>{i + 1}</span>
                <span style={{ fontWeight: s.on ? 700 : 500, fontSize: 15 }}>{s.label}</span>
              </span>
            ))}
          </div>
        )}
        <span className="muted small">Questions? <b style={{ color: "var(--fg)" }}>416-572-3737</b></span>
      </header>
      {children}
    </div>
  );
}

export interface NavItem { href: string; label: string; count?: number }

/** Staff and Partner workspace: header with search and user, plus a sidebar of the role's own pages. */
export function AppShell({ label, user, initials, nav, searchPlaceholder, onSearch, children }: {
  label: string; user: string; initials: string; nav: NavItem[]; searchPlaceholder: string; onSearch?: (q: string) => void; children: ReactNode;
}) {
  const path = usePathname();
  return (
    <div>
      <header className="app-head">
        <div className="row gap12"><Logo /><span style={{ width: 1, height: 30, background: "var(--line)" }} /><b className="muted small">{label}</b></div>
        <input className="input searchbox" placeholder={searchPlaceholder} aria-label="Search" onKeyDown={(e) => { if (e.key === "Enter") onSearch?.((e.target as HTMLInputElement).value); }} />
        <div className="row gap8"><span className="avatar">{initials}</span><b className="small">{user}</b></div>
      </header>
      <div className="app-body">
        <nav className="app-side" aria-label={label}>
          {nav.map((n) => {
            const first = nav[0].href;
            const active = n.href === first ? path === first : path === n.href || path.startsWith(n.href + "/");
            return <Link key={n.href} href={n.href} className={active ? "active" : ""}>{n.label}{n.count ? <span className="count">{n.count}</span> : null}</Link>;
          })}
        </nav>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

const ROLES = [
  { href: "/donor", label: "Donor", sub: "Can I donate this?", color: "#FDC23E" },
  { href: "/individual", label: "Individual", sub: "Shop and checkout", color: "#9AA7B2" },
  { href: "/business", label: "Business", sub: "Inquiry and tracking", color: "#7C93FF" },
  { href: "/staff", label: "FGT Staff", sub: "Operations", color: "#3DDC84" },
  { href: "/partner", label: "Partner", sub: "Batches and earnings", color: "#F0A12B" },
];

export function DemoSidebar() {
  const path = usePathname();
  const { reset } = useApp();
  return (
    <aside className="demo-side" aria-label="Demo previews">
      <div className="demo-brand"><img src="/img/logo.png" alt="" /><div><b>FGT Flow</b><small>Demo preview</small></div></div>
      <div className="demo-label">Previews</div>
      {ROLES.map((r) => (
        <Link key={r.href} href={r.href} className={`demo-link ${path === r.href || path.startsWith(r.href + "/") ? "active" : ""}`}>
          <span className="demo-dot" style={{ background: r.color }} />
          <span>{r.label}<small>{r.sub}</small></span>
        </Link>
      ))}
      <div className="demo-spacer" />
      <button className="demo-reset" onClick={reset}>Reset demo</button>
      <div className="demo-note">Demo day is Friday, Nov 6. Everything you change stays in this browser until you reset.</div>
    </aside>
  );
}
