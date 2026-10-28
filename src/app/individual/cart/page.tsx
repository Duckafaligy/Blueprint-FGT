"use client";
import { Btn, Card, KV } from "@/components/ui";
import { Funnel, Thumb, money, totals } from "@/components/individual/lib";
import { useApp } from "@/lib/store";

export default function CartPage() {
  const { state, update, toast } = useApp();
  const t = totals(state.cart, "ship");
  const setQty = (id: string, qty: number) =>
    update((d) => { const i = d.cart.findIndex((c) => c.productId === id); if (i < 0) return; if (qty <= 0) d.cart.splice(i, 1); else d.cart[i].qty = qty; });
  const remove = (id: string, title: string) => { setQty(id, 0); toast(`${title} removed`, "warn"); };

  return (
    <div>
      <Funnel step={0} />
      <div className="page">
        <h1 style={{ fontSize: 46 }}>Your cart</h1>
        {t.lines.length === 0 ? (
          <Card className="center" style={{ alignItems: "center", padding: 56 }}>
            <h3>Your cart is empty</h3><p className="muted">Add a refurbished laptop and it will show up here.</p>
            <Btn href="/individual">Keep shopping</Btn>
          </Card>
        ) : (
          <div className="two-col">
            <div className="col grow stagger">
              {t.lines.map(({ p, qty }) => (
                <div key={p.id} className="cart-line">
                  <div className="t"><Thumb p={p} /></div>
                  <div className="col grow gap8">
                    <b style={{ fontSize: 18 }}>{p.title}</b>
                    <span><span className="chip" style={{ ["--c" as string]: p.ships ? "var(--brand)" : "var(--accent)" }}><i />{p.ships ? "Ships by Canada Post" : "Pick up at the shop"}</span></span>
                    <button className="link" style={{ alignSelf: "flex-start" }} onClick={() => remove(p.id, p.title)}>Remove</button>
                  </div>
                  <div className="stepper">
                    <button aria-label="Fewer" onClick={() => setQty(p.id, qty - 1)}>-</button>
                    <b>{qty}</b>
                    <button className="plus" aria-label="More" onClick={() => setQty(p.id, qty + 1)}>+</button>
                  </div>
                  <b className="price" style={{ width: 110, textAlign: "right", fontSize: 26 }}>{money(p.price * qty)}</b>
                </div>
              ))}
              <Btn variant="ghost" href="/individual" style={{ alignSelf: "flex-start" }}>Keep shopping</Btn>
            </div>
            <Card title="Order summary" style={{ width: 360, flexShrink: 0 }}>
              <KV rows={[["Subtotal", money(t.subtotal)], ["Canada Post", t.shipping ? money(t.shipping) : "Free"], ["HST 13%", money(t.tax)], ["Total", money(t.total)]]} />
              <Btn size="lg" href="/individual/checkout">Checkout</Btn>
              <span className="tiny muted">Laptops ship for $19.50 once per order. Everything else is picked up at the shop for free.</span>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
