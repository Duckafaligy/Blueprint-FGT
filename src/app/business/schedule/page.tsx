"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Field } from "@/components/ui";
import { Crumbs, Wizard, useDraft } from "@/components/business/kit";

const WINDOWS = [["Fri, Nov 13", "9 to 12"], ["Sat, Nov 14", "1 to 4"], ["Wed, Nov 18", "9 to 12"]];

export default function SchedulePage() {
  const { state } = useApp();
  const home = state.lots.find((l) => l.id === state.businessLotId);
  const { set, s, d } = useDraft();
  const router = useRouter();
  const [errs, setErrs] = useState<Record<string, string>>({});
  const v = (k: string, def: string) => s(k, def);
  const val = {
    window: s("s_window"),
    address: v("s_address", d.address ? `${d.address}` : home?.address ?? ""),
    floor: v("s_floor", s("floor")),
    name: v("s_name", home?.contact ?? ""),
    phone: v("s_phone", home?.phone ?? ""),
    email: v("s_email", home?.email ?? ""),
  };
  const f = (k: string) => (x: string) => { set("s_" + k, x); setErrs((e) => ({ ...e, [k]: "" })); };
  const go = () => {
    const e: Record<string, string> = {};
    if (!val.window) e.window = "Pick a pickup window.";
    if (!val.address.trim()) e.address = "Enter the pickup address.";
    if (!val.floor.trim()) e.floor = "Enter the floor or suite.";
    if (!val.name.trim()) e.name = "Enter a contact name.";
    if (!/\d{3}\D*\d{3}\D*\d{4}/.test(val.phone)) e.phone = "Enter a 10 digit phone number.";
    if (!/^\S+@\S+\.\S+$/.test(val.email)) e.email = "Enter a valid email.";
    setErrs(e);
    if (Object.keys(e).length) return false;
    // keep the prefilled values so the next pages can read them
    (["address", "floor", "name", "phone", "email"] as const).forEach((k) => set("s_" + k, val[k]));
    router.push("/business/devices");
  };
  return (
    <div className="col" style={{ gap: 0 }}>
      <div style={{ padding: "20px 80px 0" }}><Crumbs items={[["Quote", "/business/quote"], ["Schedule pickup"]]} /></div>
      <Wizard n={1} of={3} back="/business/quote" onNext={go} title="Pick a pickup window" sub="Our driver arrives inside the window you choose.">
        <div className="col gap8">
          <div className="row gap12 wrap" role="radiogroup" aria-label="Pickup window">
            {WINDOWS.map(([day, time]) => {
              const w = `${day} · ${time}`;
              return (
                <button key={w} type="button" role="radio" aria-checked={val.window === w} className={`win ${val.window === w ? "on" : ""}`} onClick={() => f("window")(w)}>
                  <b>{day}</b><span className="muted bold">{time}</span><span className="tiny muted">{val.window === w ? "Selected" : "Open"}</span>
                </button>
              );
            })}
          </div>
          {errs.window && <span className="err-text">{errs.window}</span>}
        </div>
        <Field label="Pickup address" value={val.address} onChange={f("address")} error={errs.address} />
        <div className="biz-form-row"><Field label="Floor or suite" value={val.floor} onChange={f("floor")} error={errs.floor} placeholder="Suite 300" /><Field label="Contact name" value={val.name} onChange={f("name")} error={errs.name} /></div>
        <div className="biz-form-row"><Field label="Phone" value={val.phone} onChange={f("phone")} error={errs.phone} /><Field label="Email" value={val.email} onChange={f("email")} error={errs.email} type="email" /></div>
        <Field label="Notes for the driver (optional)" textarea value={s("s_notes")} onChange={f("notes")} placeholder="Check in at the front desk" />
      </Wizard>
    </div>
  );
}
