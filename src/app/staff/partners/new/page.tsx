"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, Field, PageHead } from "@/components/ui";
import { DealSummary, ShareSlider, WORK_OPTIONS, clamp } from "@/components/staff-b/parts";
import { uid } from "@/lib/helpers";

export default function NewPartner() {
  const { state, update, toast } = useApp();
  const router = useRouter();
  const { shareMin, shareMax } = state.settings;
  const [f, setF] = useState({ name: "", contact: "", email: "", phone: "", turnaround: "10 business days", minBatch: "6", area: "", notes: "" });
  const [work, setWork] = useState<string[]>([]);
  const [pct, setPct] = useState(clamp(35, shareMin, shareMax));
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((o) => ({ ...o, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Enter the business name";
    if (!f.contact.trim()) e.contact = "Enter a contact person";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
    if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a phone number with 10 digits";
    if (!work.length) e.work = "Pick at least one kind of work";
    if (!(Number(f.minBatch) >= 1)) e.minBatch = "Enter 1 or more";
    setErr(e);
    if (Object.keys(e).length) return;
    update((d) => {
      d.partners.push({ id: uid("p"), name: f.name.trim(), contact: f.contact.trim(), email: f.email.trim(), phone: f.phone.trim(), work, sharePct: clamp(pct, d.settings.shareMin, d.settings.shareMax), turnaround: f.turnaround, minBatch: Math.round(Number(f.minBatch)), area: f.area.trim() || "Toronto", notes: f.notes.trim(), status: "Onboarding" });
    });
    toast(`${f.name.trim()} added as a partner`);
    router.push("/staff/partners");
  };

  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="Add a partner" sub="Set the deal once. It applies to every batch you send them." />
      <div className="row start gap24" style={{ flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 460 }}>
          <div className="row start"><Field label="Business name" value={f.name} onChange={set("name")} error={err.name} /><Field label="Contact person" value={f.contact} onChange={set("contact")} error={err.contact} /></div>
          <div className="row start"><Field label="Email" type="email" value={f.email} onChange={set("email")} error={err.email} /><Field label="Phone" type="tel" value={f.phone} onChange={set("phone")} error={err.phone} /></div>
          <div className="col gap8">
            <span className="label">What they do</span>
            <div className="row gap8 wrap">{WORK_OPTIONS.map((w) => <button key={w} className={`pillbtn ${work.includes(w) ? "on" : ""}`} onClick={() => setWork((o) => (o.includes(w) ? o.filter((x) => x !== w) : [...o, w]))}>{w}</button>)}</div>
            {err.work && <span className="err-text">{err.work}</span>}
          </div>
          <div className="row start">
            <Field label="Turnaround" value={f.turnaround} onChange={set("turnaround")} list={["5 business days", "7 business days", "10 business days", "14 business days"]} />
            <Field label="Smallest batch (devices)" type="number" value={f.minBatch} onChange={set("minBatch")} error={err.minBatch} />
            <Field label="Area" value={f.area} onChange={set("area")} placeholder="West end Toronto" />
          </div>
          <div className="col gap8"><span className="label">Deal share</span><ShareSlider value={pct} onChange={setPct} min={shareMin} max={shareMax} /></div>
          <div className="col gap8"><span className="label">Paid</span><span className="chip" style={{ alignSelf: "flex-start", ["--c" as string]: "var(--ok)" }}><i />When the device sells</span></div>
          <Field label="Notes" textarea value={f.notes} onChange={set("notes")} placeholder="Anything staff should know" />
          <div className="row"><Btn onClick={save}>Save partner</Btn><Btn variant="soft" href="/staff/partners">Cancel</Btn></div>
        </Card>
        <DealSummary pct={pct} />
      </div>
    </div>
  );
}
