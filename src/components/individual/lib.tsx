"use client";
import "./individual.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import raw from "@/data/products.json";
import type { AppState, Product } from "@/lib/types";
import { Logo } from "@/components/shell";
import { Btn } from "@/components/ui";
import { useApp } from "@/lib/store";

export const PRODUCTS = raw as unknown as Product[];
export const CATEGORIES = ["Laptops", "Desktops", "Peripherals", "Gaming consoles", "Mobile devices", "Televisions"];
export const productOf = (id: string) => PRODUCTS.find((p) => p.id === id);
export const SHIPPING = 19.5;
export const money = (x: number) => "$" + x.toFixed(2);

/** memory text without the glued-on drive details */
export const memText = (p: Product) => (p.memory || "").split(/Hard Drive/i)[0].trim();
export function memBucket(p: Product): string | null {
  const m = memText(p).match(/(\d+)/);
  if (!m) return null;
  const n = +m[1];
  return n <= 8 ? "8 GB" : n <= 16 ? "16 GB" : "24 to 32 GB";
}
export function osName(p: Product): string | null {
  const t = `${p.os} ${p.title}`.toLowerCase();
  if (t.includes("windows")) return "Windows 11";
  if (t.includes("linux")) return "Linux Mint";
  if (t.includes("macos") || t.includes("mac os")) return "macOS";
  if (t.includes("chromeos") || t.includes("chromebook")) return "ChromeOS";
  return null;
}
export const specLine = (p: Product) =>
  [p.cpu && p.cpu.split("@")[0].trim(), memText(p) && memText(p).split("@")[0].trim(), p.storage].filter(Boolean).join(" · ") || p.category;

export function totals(cart: AppState["cart"], delivery: "ship" | "pickup") {
  const lines = cart.map((c) => ({ ...c, p: productOf(c.productId) })).filter((l): l is { productId: string; qty: number; p: Product } => !!l.p);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = delivery === "ship" && lines.some((l) => l.p.ships) ? SHIPPING : 0;
  const tax = Math.round((subtotal + shipping) * 13) / 100;
  return { lines, subtotal, shipping, tax, total: subtotal + shipping + tax };
}

export function Thumb({ p }: { p: Product }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="pimg" src={p.image} alt={p.title} loading="lazy" />;
}

export function addToCart(update: ReturnType<typeof useApp>["update"], id: string) {
  update((d) => { const l = d.cart.find((c) => c.productId === id); if (l) l.qty++; else d.cart.push({ productId: id, qty: 1 }); });
}

export function ShopHeader({ q, setQ }: { q?: string; setQ?: (v: string) => void }) {
  const { state, toast } = useApp();
  const router = useRouter();
  const count = state.cart.reduce((s, c) => s + c.qty, 0);
  const last = state.orders[state.orders.length - 1];
  return (
    <header className="shop-head">
      <Logo href="/individual" />
      <input className="input searchbox" aria-label="Search products" placeholder="Search laptops, desktops and more"
        value={q ?? ""} onChange={(e) => (setQ ? setQ(e.target.value) : router.push("/individual"))} />
      <div className="rt">
        <button className="link" onClick={() => (last ? router.push(`/individual/confirmation/${last.id}`) : toast("No orders yet", "warn"))}>Order status</button>
        <Btn variant="outline" href="/individual/cart">Cart <span className="badge" key={count}>{count}</span></Btn>
      </div>
    </header>
  );
}

export function Funnel({ step }: { step: 0 | 1 | 2 }) {
  const steps = ["Cart", "Checkout", "Confirmation"].map((label, i) => ({ label, on: i <= step }));
  return (
    <header className="fun-head">
      <Logo href="/individual" />
      <div className="row gap12">
        {steps.map((s, i) => (
          <span key={s.label} className="row gap8" style={{ opacity: s.on ? 1 : 0.5 }}>
            <span className="avatar" style={{ width: 26, height: 26, fontSize: 13, background: s.on ? "var(--brand)" : "var(--surface2)", color: s.on ? "#fff" : "var(--muted)" }}>{i + 1}</span>
            <span style={{ fontWeight: s.on ? 700 : 500, fontSize: 15 }}>{s.label}</span>
          </span>
        ))}
      </div>
      <span className="muted small">Questions? <b style={{ color: "var(--fg)" }}>416-572-3737</b></span>
    </header>
  );
}

export const InStock = () => <span className="chip" style={{ ["--c" as string]: "var(--ok)" }}><i />In stock</span>;
export const GradeChip = ({ g }: { g?: string | null }): ReactNode => (g ? <span className={`gb ${g}`}>Grade {g}</span> : null);

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={`/individual/product/${p.id}`} className="pcard">
      <div className="img"><Thumb p={p} /><span style={{ position: "absolute", top: 10, left: 10 }}><GradeChip g={p.grade} /></span></div>
      <div className="body">
        <h3>{p.title}</h3>
        <span className="small muted">{specLine(p)}</span>
        <span className="tiny" style={{ color: p.issue ? "var(--warn)" : "var(--muted)" }}>{p.issue || "No issues listed"}</span>
        <div className="row between" style={{ marginTop: "auto", paddingTop: 6 }}>
          <span className="price">{money(p.price)}</span>
          <InStock />
        </div>
      </div>
    </Link>
  );
}
