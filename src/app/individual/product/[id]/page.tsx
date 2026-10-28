"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Btn, Card, KV } from "@/components/ui";
import { GradeChip, InStock, PRODUCTS, ProductCard, ShopHeader, Thumb, addToCart, memText, money, osName, productOf } from "@/components/individual/lib";
import { useApp } from "@/lib/store";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { update, toast } = useApp();
  const [saved, setSaved] = useState(false);
  const p = productOf(id);
  if (!p) {
    return <div><ShopHeader /><div className="page"><h1>Product not found</h1><Btn href="/individual">Back to the shop</Btn></div></div>;
  }
  const more = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const rows: [string, string][] = ([
    ["Category", p.category], ["Processor", p.cpu], ["Memory", memText(p)], ["Storage", p.storage],
    ["Operating system", p.os ? p.os.split("Productivity")[0].trim() : (osName(p) ?? "")], ["Screen", p.screen],
    ["Connectivity", p.conn], ["Ports", p.ports], ["Condition notes", p.issue || "No issues listed"],
  ] as [string, string][]).filter((r) => r[1]);

  return (
    <div>
      <ShopHeader />
      <div className="page">
        <div className="crumbs"><Link href="/individual">Shop</Link><span>/</span><Link href="/individual">{p.category}</Link><span>/</span><b style={{ color: "var(--fg)" }}>{p.title}</b></div>
        <div className="pdp">
          <div className="big"><Thumb p={p} /></div>
          <div className="col grow">
            <div className="row gap8"><InStock />{GradeChip({ g: p.grade })}</div>
            <h1 style={{ fontSize: 54 }}>{p.title}</h1>
            <span className="price" style={{ fontSize: 44 }}>{money(p.price)}</span>
            <div className="row gap12 wrap">
              <Btn size="lg" onClick={() => { addToCart(update, p.id); toast(`${p.title} added to your cart`); }}>Add to cart</Btn>
              <Btn size="lg" variant="outline" onClick={() => { setSaved(!saved); toast(saved ? "Removed from saved items" : "Saved for later", saved ? "warn" : "ok"); }}>{saved ? "Saved" : "Save for later"}</Btn>
            </div>
            <div className="infoboxes">
              <div><b>Data wiped</b><span className="small muted">Certified erase before sale</span></div>
              <div><b>Checked by FGT</b><span className="small muted">Tested by trained volunteers</span></div>
              <div><b>{p.ships ? "Ships in Canada" : "Pick up at the shop"}</b><span className="small muted">{p.ships ? "Canada Post, $19.50 per order" : "Free, at Free Geek Toronto"}</span></div>
              <div><b>90-day warranty</b><span className="small muted">Covers faults we missed</span></div>
            </div>
          </div>
        </div>
        <Card title="Specifications"><KV rows={rows} /></Card>
        {more.length > 0 && (
          <div className="col">
            <h2 style={{ fontSize: 34 }}>More like this</h2>
            <div className="pgrid stagger">{more.map((m) => <ProductCard key={m.id} p={m} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
