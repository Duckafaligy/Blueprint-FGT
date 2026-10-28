"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Btn, Card, Field, KV } from "@/components/ui";
import { Funnel, money, totals } from "@/components/individual/lib";
import { useApp } from "@/lib/store";

type Errs = Record<string, string>;

export default function Checkout() {
  const { state, update, toast } = useApp();
  const router = useRouter();
  const canShip = state.cart.some((c) => totals([c], "ship").lines[0]?.p.ships);
  const [f, setF] = useState({ name: "", email: "", phone: "", street: "", city: "", postal: "", card: "", exp: "", cvc: "" });
  const [pref, setPref] = useState<"ship" | "pickup">("ship");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const delivery = canShip ? pref : "pickup";
  const t = totals(state.cart, delivery);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  function validate(): Errs {
    const e: Errs = {};
    if (f.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
    if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a 10 digit phone number";
    if (delivery === "ship") {
      if (f.street.trim().length < 4) e.street = "Enter your street address";
      if (f.city.trim().length < 2) e.city = "Enter your city";
      if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(f.postal.trim())) e.postal = "Use a postal code like M5V 2T6";
    }
    if (f.card.replace(/\s/g, "").length !== 16 || /\D/.test(f.card.replace(/\s/g, ""))) e.card = "Card number must be 16 digits";
    const m = f.exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) e.exp = "Use MM / YY";
    if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = "3 or 4 digits";
    return e;
  }

  function place() {
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) { toast("Fix the highlighted fields", "bad"); return; }
    setBusy(true);
    const id = `FGT-${10482 + state.orders.length}`;
    update((d) => {
      d.orders.push({
        id, items: d.cart.map((c) => ({ ...c })), name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), delivery,
        address: delivery === "ship" ? `${f.street.trim()}, ${f.city.trim()} ${f.postal.trim().toUpperCase()}` : undefined,
        subtotal: t.subtotal, shipping: t.shipping, tax: t.tax, total: t.total, createdAt: new Date().toISOString(),
      });
      d.cart = [];
    });
    router.push(`/individual/confirmation/${id}`);
  }

  if (!t.lines.length && !busy) {
    return <div><Funnel step={1} /><div className="page"><Card style={{ alignItems: "center", padding: 56 }}><h3>Your cart is empty</h3><Btn href="/individual">Keep shopping</Btn></Card></div></div>;
  }

  return (
    <div>
      <Funnel step={1} />
      <div className="page">
        <h1 style={{ fontSize: 46 }}>Checkout</h1>
        <div className="two-col">
          <div className="col grow">
            <Card title="Contact">
              <Field label="Full name" value={f.name} onChange={set("name")} error={errs.name} />
              <div className="row start"><Field label="Email" type="email" value={f.email} onChange={set("email")} error={errs.email} /><Field label="Phone" value={f.phone} onChange={set("phone")} placeholder="416 555 0123" error={errs.phone} /></div>
            </Card>
            <Card title="Delivery">
              {canShip && (
                <button className={`opt ${delivery === "ship" ? "on" : ""}`} onClick={() => setPref("ship")}>
                  <span>Canada Post<small>Laptops ship for $19.50. Other items are picked up.</small></span><span className="dot">{delivery === "ship" ? "✓" : ""}</span>
                </button>
              )}
              <button className={`opt ${delivery === "pickup" ? "on" : ""}`} onClick={() => setPref("pickup")} disabled={!canShip}>
                <span>Pick up at the shop<small>Free. We email you when it is ready.</small></span><span className="dot">{delivery === "pickup" ? "✓" : ""}</span>
              </button>
              {delivery === "ship" && (
                <>
                  <Field label="Street address" value={f.street} onChange={set("street")} error={errs.street} />
                  <div className="row start"><Field label="City" value={f.city} onChange={set("city")} error={errs.city} /><Field label="Postal code" value={f.postal} onChange={set("postal")} error={errs.postal} width={160} /></div>
                </>
              )}
            </Card>
            <Card title="Payment">
              <Field label="Card number" value={f.card} onChange={set("card")} placeholder="4242 4242 4242 4242" error={errs.card} />
              <div className="row start"><Field label="Expiry" value={f.exp} onChange={set("exp")} placeholder="MM / YY" error={errs.exp} /><Field label="CVC" value={f.cvc} onChange={set("cvc")} placeholder="123" error={errs.cvc} /></div>
              <span className="tiny muted">Demo only. No real payment is taken and nothing is stored.</span>
            </Card>
          </div>
          <Card title="Your order" style={{ width: 380, flexShrink: 0 }}>
            {t.lines.map(({ p, qty }) => <div key={p.id} className="row between small"><span>{p.title} x {qty}</span><b>{money(p.price * qty)}</b></div>)}
            <KV rows={[["Subtotal", money(t.subtotal)], ["Canada Post", t.shipping ? money(t.shipping) : "Free"], ["HST 13%", money(t.tax)], ["Total", money(t.total)]]} />
            <Btn size="lg" onClick={place} disabled={busy}>Place order</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
}
