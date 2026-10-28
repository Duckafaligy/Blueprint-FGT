"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Banner, Btn, Card, EmailPreview, Pipeline } from "@/components/ui";
import { Funnel, Thumb, money, productOf } from "@/components/individual/lib";
import { download } from "@/lib/helpers";
import { useApp } from "@/lib/store";

export default function Confirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { state, toast } = useApp();
  // resets on reload, by design for the demo
  const [steps, setSteps] = useState<Record<string, number>>({});
  const o = state.orders.find((x) => x.id === orderId);
  if (!o) {
    return <div><Funnel step={2} /><div className="page"><Card style={{ alignItems: "center", padding: 56 }}><h3>Order not found</h3><Btn href="/individual">Keep shopping</Btn></Card></div></div>;
  }
  const rows = o.items.map((i) => ({ ...i, p: productOf(i.productId) })).filter((r) => r.p);

  const receipt = () => {
    const txt = [
      "Free Geek Toronto receipt", `Order ${o.id}`, `Date ${new Date(o.createdAt).toLocaleString("en-CA")}`, `Name ${o.name}`,
      o.delivery === "ship" ? `Ship to ${o.address}` : "Pick up at the shop", "",
      ...rows.map((r) => `${r.p!.title} x ${r.qty}  ${money(r.p!.price * r.qty)}`), "",
      `Subtotal ${money(o.subtotal)}`, `Canada Post ${money(o.shipping)}`, `HST 13% ${money(o.tax)}`, `Total ${money(o.total)}`, "", "Demo order. No payment was taken.",
    ].join("\n");
    download(`${o.id}-receipt.txt`, txt, "text/plain");
    toast("Receipt downloaded");
  };

  return (
    <div>
      <Funnel step={2} />
      <div className="page">
        <Banner color="var(--ok)">
          <div className="row between wrap">
            <div><span className="stamp">Order placed</span><h1 style={{ fontSize: 46, marginTop: 12 }}>Thank you, {o.name.split(" ")[0]}</h1><p className="muted">Order <b className="mono" style={{ color: "var(--fg)" }}>{o.id}</b> · Total <b style={{ color: "var(--fg)" }}>{money(o.total)}</b></p></div>
            <div className="row gap12"><Btn variant="outline" onClick={receipt}>Download receipt</Btn><Btn href="/individual">Keep shopping</Btn></div>
          </div>
        </Banner>
        <div className="two-col">
          <div className="col grow stagger">
            {rows.map(({ p, qty }) => {
              const ship = o.delivery === "ship" && p!.ships;
              const stages = ship ? ["Paid", "Packing", "Shipped", "Delivered"] : ["Paid", "Packing", "Ready for pickup", "Picked up"];
              const now = steps[p!.id] ?? 0;
              return (
                <Card key={p!.id}>
                  <div className="row">
                    <div className="cart-line" style={{ border: 0, padding: 0, flex: 1 }}>
                      <div className="t"><Thumb p={p!} /></div>
                      <div className="col gap8"><b style={{ fontSize: 18 }}>{p!.title}</b><span className="small muted">Qty {qty} · {ship ? "Ships by Canada Post" : "Pick up at the shop"}</span></div>
                    </div>
                    <b className="price">{money(p!.price * qty)}</b>
                  </div>
                  <Pipeline stages={stages} now={now} />
                  <div className="row between">
                    <span className="tiny muted">Demo only. Progress resets when you reload.</span>
                    <Btn size="sm" variant="soft" disabled={now >= stages.length - 1} onClick={() => { setSteps({ ...steps, [p!.id]: now + 1 }); toast(`${p!.title}: ${stages[now + 1]}`); }}>Advance status</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
          <EmailPreview to={o.email} subject={`Your FGT order ${o.id}`}>
            <p>Hi {o.name.split(" ")[0]},</p>
            <p>Thanks for your order. {o.delivery === "ship" ? `We will ship your laptop to ${o.address}.` : "We will email you when it is ready to pick up at the shop."}</p>
            <p>Total paid: <b>{money(o.total)}</b>. Every device is data wiped, checked by FGT and covered by a 90-day warranty.</p>
          </EmailPreview>
        </div>
      </div>
    </div>
  );
}
