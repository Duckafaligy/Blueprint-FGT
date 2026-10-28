"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, Check, Field, KV, Banner } from "@/components/ui";
import { FunnelShell } from "@/components/shell";
import type { AppState } from "@/lib/types";

type A = Record<string, unknown>;
const s = (a: A, k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
const arr = (a: A, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);

const ITEMS = ["Laptop", "Desktop tower", "Monitor", "Phone or tablet", "Printer", "TV", "Keyboard mouse or cables", "Something else"];
const BRANDS = ["Dell", "HP", "Lenovo", "Apple", "Acer", "Other"];
const AGES = ["Under 5 years", "5 to 10 years", "10 years or more", "Not sure"];
const POWER = ["Yes", "No", "Not sure"];
const CONDS = ["Cracked screen", "Missing keys", "Liquid damage", "Missing parts", "Battery looks swollen or bulging", "None of these"];
const EXTRAS = ["Charger", "Bag or case", "Mouse", "Original box", "Nothing"];
const DATA = ["I erased it", "I backed it up but did not erase it", "I have not done anything yet"];
const HOWS = ["I will bring it in", "I need it picked up"];
const SWOLLEN = CONDS[4];
const NONE = CONDS[5];

export function resultKind(st: AppState): "bring" | "pickup" | "recycle" {
  const a = st.donorAnswers; const item = s(a, "item");
  const count = Number(a.count) || 1;
  if ((item === "Laptop" || item === "Desktop tower") && count >= st.settings.minLot) return "pickup";
  if (arr(a, "cond").includes(SWOLLEN) || s(a, "age") === "10 years or more" || s(a, "power") === "No"
    || ["Printer", "TV", "Phone or tablet", "Something else"].includes(item)) return "recycle";
  return "bring";
}

function Pips({ n }: { n: number }) {
  return <div className="pips" aria-hidden>{Array.from({ length: 8 }, (_, i) => <i key={i} className={i < n ? "on" : ""} style={{ animationDelay: `${i * 40}ms` }} />)}</div>;
}

const Q_TITLES = ["What are you donating?", "Brand and model", "About how old is it?", "Does it turn on?", "Physical condition", "What comes with it?", "What is on it?", "How will you get it to FGT?"];
const REQUIRED = [1, 3, 4, 8];

function Radio({ opts, value, onPick }: { opts: string[]; value: string; onPick: (v: string) => void }) {
  return <div className="col gap12 stagger">{opts.map((o) => (
    <button key={o} className={`opt ${value === o ? "on" : ""}`} role="radio" aria-checked={value === o} onClick={() => onPick(o)}>{o}<span className="dot">{value === o ? "✓" : ""}</span></button>
  ))}</div>;
}

export function Question() {
  const { n: raw } = useParams<{ n: string }>();
  const n = Math.round(Number(raw));
  const router = useRouter();
  const { state, update } = useApp();
  const bad = !(n >= 1 && n <= 8);
  useEffect(() => { if (bad) router.replace("/donor/q/1"); }, [bad, router]);
  if (bad) return null;
  const a = state.donorAnswers;
  const set = (k: string, v: unknown) => update((d) => { d.donorAnswers[k] = v; });
  const toggle = (k: string, v: string, none: string) => update((d) => {
    const cur = arr(d.donorAnswers, k);
    d.donorAnswers[k] = v === none ? (cur.includes(v) ? [] : [v])
      : (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).filter((x) => x !== none);
  });
  const count = Number(a.count) || 1;
  const valid = n === 1 ? !!s(a, "item") : n === 3 ? !!s(a, "age") : n === 4 ? !!s(a, "power") : n === 8 ? !!s(a, "how") : true;
  const next = () => router.push(n === 8 ? `/donor/result/${resultKind(state)}` : `/donor/q/${n + 1}`);
  const multi = (k: string, opts: string[], none: string) => (
    <div className="col gap12 stagger">{opts.map((o) => (
      <div key={o} className="card" style={{ padding: "10px 18px", flexDirection: "row" }}>
        <Check on={arr(a, k).includes(o)} onChange={() => toggle(k, o, none)} label={o} />
      </div>
    ))}</div>
  );
  return (
    <FunnelShell>
      <div className="page narrow">
        <div className="qcard" key={n}>
          <Pips n={n} />
          <span className="muted small">Question {n} of 8{REQUIRED.includes(n) ? "" : " · optional"}</span>
          <h1>{Q_TITLES[n - 1]}</h1>
          {n === 1 && (<>
            <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {ITEMS.map((i) => <button key={i} className={`tile ${s(a, "item") === i ? "on" : ""}`} aria-pressed={s(a, "item") === i} onClick={() => set("item", i)}>{i}</button>)}
            </div>
            <div className="row gap24"><b>How many?</b>
              <div className="stepper">
                <button aria-label="Fewer" onClick={() => set("count", Math.max(1, count - 1))}>−</button>
                <b>{count}</b>
                <button className="plus" aria-label="More" onClick={() => set("count", Math.min(99, count + 1))}>+</button>
              </div>
            </div>
          </>)}
          {n === 2 && (<>
            <div className="row wrap gap12">{BRANDS.map((b) => <button key={b} className={`chip-btn ${s(a, "brand") === b ? "on" : ""}`} onClick={() => set("brand", s(a, "brand") === b ? "" : b)}>{b}</button>)}</div>
            <Field label="Model (optional)" value={s(a, "model")} onChange={(v) => set("model", v)} placeholder="For example ThinkPad T440" />
          </>)}
          {n === 3 && <Radio opts={AGES} value={s(a, "age")} onPick={(v) => set("age", v)} />}
          {n === 4 && <Radio opts={POWER} value={s(a, "power")} onPick={(v) => set("power", v)} />}
          {n === 5 && (<>
            {multi("cond", CONDS, NONE)}
            {arr(a, "cond").includes(SWOLLEN) && <p className="small" style={{ color: "var(--bad)", fontWeight: 600 }}>Safety: a swollen battery can be a fire risk. Do not charge or press on it, and keep it away from heat.</p>}
          </>)}
          {n === 6 && multi("extras", EXTRAS, "Nothing")}
          {n === 7 && (<>
            <Radio opts={DATA} value={s(a, "data")} onPick={(v) => set("data", v)} />
            <p className="muted small">Either way, FGT wipes every drive that comes through the door.</p>
          </>)}
          {n === 8 && (<>
            <Radio opts={HOWS} value={s(a, "how")} onPick={(v) => set("how", v)} />
            <div className="row gap12 wrap">
              <Field label="Postal code (optional)" value={s(a, "postal")} onChange={(v) => set("postal", v)} placeholder="M5V 1A1" />
              <Field label="Email for a copy of the result (optional)" value={s(a, "email")} onChange={(v) => set("email", v)} type="email" placeholder="you@example.com" />
            </div>
            <p className="muted small">FGT cannot issue tax receipts, but will confirm your drop-off.</p>
          </>)}
          <div className="row between">
            {n > 1 ? <Btn variant="outline" href={`/donor/q/${n - 1}`}>Back</Btn> : <span />}
            <Btn onClick={next} disabled={!valid}>{n === 8 ? "See result" : "Next"}</Btn>
          </div>
        </div>
      </div>
    </FunnelShell>
  );
}

const MAPS = "https://www.google.com/maps/search/?api=1&query=180+Sudbury+Street+Toronto";
const ext = (href: string, label: string, primary = false) => (
  <a className={`btn ${primary ? "" : "outline"}`} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
);
const InfoCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card title={title} lift style={{ flex: 1 }}>{children}</Card>
);

export function Result() {
  const { kind } = useParams<{ kind: string }>();
  const router = useRouter();
  const { state, update, hydrated } = useApp();
  const ok = kind === "bring" || kind === "pickup" || kind === "recycle";
  const logged = useRef(false);
  const a = state.donorAnswers;
  useEffect(() => {
    if (!ok) { router.replace("/donor/q/1"); return; }
    if (!hydrated || logged.current) return;
    logged.current = true;
    if (!s(a, "item")) return;
    update((d) => { d.checkerLog.push({ at: "Nov 6", item: s(a, "item"), age: s(a, "age") || "Not sure", power: s(a, "power") || "Not sure", result: kind as "bring" }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ok]);
  if (!ok) return null;
  const swollen = arr(a, "cond").includes(SWOLLEN);
  const again = () => { update((d) => { d.donorAnswers = {}; }); router.push("/donor/q/1"); };
  const rows: [string, string][] = [
    ["Item", s(a, "item") ? `${s(a, "item")}${Number(a.count) > 1 ? ` x ${a.count}` : ""}` : "Not answered"],
    ["Brand and model", [s(a, "brand"), s(a, "model")].filter(Boolean).join(" ") || "Not given"],
    ["Age", s(a, "age") || "Not answered"],
    ["Turns on", s(a, "power") || "Not answered"],
    ["Condition", arr(a, "cond").join(", ") || "Not given"],
    ["Comes with", arr(a, "extras").join(", ") || "Not given"],
    ["Data", s(a, "data") || "Not given"],
    ["Getting it to FGT", s(a, "how") || "Not answered"],
  ];
  const cfg = {
    bring: { color: "var(--ok)", title: "Yes, bring it in", sub: "Drop-off is Fridays and Saturdays, 12 to 5." },
    pickup: { color: "var(--brand)", title: "Book a business pickup", sub: `${state.settings.minLot} or more computers is a lot to carry, so a pickup is the easier way.` },
    recycle: { color: "var(--warn)", title: "FGT can recycle this", sub: "It is probably not reusable, but it will not go to waste." },
  }[kind];
  return (
    <FunnelShell>
      <div className="page" style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ animation: "fadeUp .6s var(--ease-out) both" }}>
          <Banner color={cfg.color}>
            <div className="col gap12">
              <h1 style={{ fontSize: 64, color: cfg.color }}>{cfg.title}</h1>
              <p style={{ fontSize: 18 }}>{cfg.sub}</p>
              {swollen && kind === "recycle" && <p style={{ color: "var(--bad)", fontWeight: 700 }}>Safety: the battery looks swollen. Do not charge it, keep it away from heat, and carry it in a non-metal box.</p>}
              <div className="row gap12 wrap">
                {kind === "pickup" ? (<><Btn href="/business/inquiry/1">Start an inquiry</Btn><Btn variant="outline" href="/donor/result/bring">I only have a few devices</Btn></>)
                  : (<>{ext(MAPS, "Get directions", true)}<Btn variant="outline" onClick={again}>Check another item</Btn></>)}
              </div>
            </div>
          </Banner>
        </div>
        <div className="row gap24 stagger" style={{ alignItems: "stretch" }}>
          {kind === "bring" && (<>
            <InfoCard title="Drop-off"><p>Fridays and Saturdays, 12 to 5.</p><p>180 Sudbury Street, Unit C3, Toronto.</p><p className="muted small">There is no step-free entrance. Call 416-572-3737 if you need a hand.</p></InfoCard>
            <InfoCard title="Before you come"><Check on label="Unplug and pack cables together" ok /><Check on label="Take out any discs or cards" ok /><Check on label="Sign out of your accounts" ok /></InfoCard>
            <InfoCard title="Also welcome"><p>Laptops, desktops, flat monitors, keyboards, mice and cables.</p><p className="muted small">FGT wipes every drive it receives.</p></InfoCard>
          </>)}
          {kind === "pickup" && (<>
            <InfoCard title="What you get"><p>A flat-fee pickup (${state.settings.pickupFee}), certified data wipes, and an impact report.</p></InfoCard>
            <InfoCard title="How it works"><p>1. Tell us what you have. 2. Approve the quote. 3. Pick a window. 4. We collect and track every device.</p></InfoCard>
            <InfoCard title="Only a few devices?"><p>Fewer than {state.settings.minLot} computers? Bring them to Sudbury Street on a Friday or Saturday.</p></InfoCard>
          </>)}
          {kind === "recycle" && (<>
            <InfoCard title="Bring it in anyway"><p>Our team can check it. If it can be reused, it will be. Drop-off is Fridays and Saturdays, 12 to 5, at 180 Sudbury Street Unit C3.</p></InfoCard>
            <InfoCard title="What happens to it"><p>FGT recycles responsibly, for free. Drives are wiped first.</p></InfoCard>
            <InfoCard title="Prefer somewhere closer"><p>Recycle My Electronics lists drop-off depots across Ontario.</p>{ext("https://www.recyclemyelectronics.ca", "Recycle My Electronics")}</InfoCard>
          </>)}
        </div>
        <Card title="Your answers" right={<Btn variant="ghost" size="sm" href="/donor/q/1">Change answers</Btn>}>
          <KV rows={rows} />
          {s(a, "email") && <p className="small muted">A copy of this result is going to {s(a, "email")}. FGT cannot issue tax receipts, but will confirm your drop-off.</p>}
        </Card>
      </div>
    </FunnelShell>
  );
}
