"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, Field, KV, PageHead, SelectField } from "@/components/ui";
import { uid } from "@/lib/helpers";
import type { Person } from "@/lib/types";

const ROLES: Person["role"][] = ["QC intern", "Volunteer", "Staff", "Partner contact"];
const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat"];
const PROGRAMS = ["QC certificate", "Sorting and intake", "Executive director", "Partner liaison"];

export default function NewPerson() {
  const { state, update, toast } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ name: "", pref: "", email: "", phone: "", start: "2026-11-10", checks: "0", notes: "" });
  const [role, setRole] = useState<Person["role"]>("QC intern");
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [days, setDays] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((o) => ({ ...o, [k]: v }));
  const need = state.settings.qcChecks;
  const since = f.start ? new Date(f.start + "T12:00").toLocaleDateString("en-CA", { month: "short", year: "numeric" }) : "";

  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Enter the full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
    if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a phone number with 10 digits";
    if (!f.start) e.start = "Pick a start date";
    if (!(Number(f.checks) >= 0)) e.checks = "Enter 0 or more";
    setErr(e);
    if (Object.keys(e).length) return;
    const checks = role === "QC intern" ? Math.round(Number(f.checks)) : 0;
    update((d) => { d.people.push({ id: uid("pe"), name: f.pref.trim() ? `${f.name.trim()} (${f.pref.trim()})` : f.name.trim(), role, program, since, email: f.email.trim(), phone: f.phone.trim(), checks, hours: 0, certified: false }); });
    toast(`${f.name.trim()} registered`);
    router.push("/staff/people");
  };

  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="Register a person" sub="Add an intern, volunteer or staff member." />
      <div className="row start gap24" style={{ flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 460 }}>
          <div className="row start"><Field label="Full name" value={f.name} onChange={set("name")} error={err.name} /><Field label="Preferred name" value={f.pref} onChange={set("pref")} /></div>
          <div className="row start"><Field label="Email" type="email" value={f.email} onChange={set("email")} error={err.email} /><Field label="Phone" type="tel" value={f.phone} onChange={set("phone")} error={err.phone} /></div>
          <div className="col gap8">
            <span className="label">Role</span>
            <div className="row gap8 wrap">{ROLES.map((r) => <button key={r} className={`pillbtn ${role === r ? "on" : ""}`} onClick={() => setRole(r)}>{r}</button>)}</div>
          </div>
          <div className="row start"><SelectField label="Program" value={program} onChange={setProgram} options={PROGRAMS} /><Field label="Start date" type="date" value={f.start} onChange={set("start")} error={err.start} /></div>
          <div className="col gap8">
            <span className="label">Availability</span>
            <div className="row gap8 wrap">{DAYS.map((x) => <button key={x} className={`pillbtn ${days.includes(x) ? "on" : ""}`} onClick={() => setDays((o) => (o.includes(x) ? o.filter((y) => y !== x) : [...o, x]))}>{x}</button>)}</div>
          </div>
          {role === "QC intern" && <Field label={`Training checks already verified (certificate at ${need})`} type="number" value={f.checks} onChange={set("checks")} error={err.checks} />}
          <Field label="Notes" textarea value={f.notes} onChange={set("notes")} />
          <div className="row"><Btn onClick={save}>Register</Btn><Btn variant="soft" href="/staff/people">Cancel</Btn></div>
        </Card>
        <Card title="Summary" style={{ width: 360, maxWidth: "100%" }}>
          <KV rows={[["Name", f.name || "Not set"], ["Role", role], ["Program", program], ["Starts", since || "Not set"], ["Days", days.length ? days.join(", ") : "Not set"], ...(role === "QC intern" ? [["Checks", `${Number(f.checks) || 0} of ${need}`] as [string, string]] : [])]} />
        </Card>
      </div>
    </div>
  );
}
