"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Check, DataTable, Field, Kpi, Modal, PageHead, Progress, Tabs } from "@/components/ui";
import type { Person } from "@/lib/types";

const TABS = ["Everyone", "Interns", "Volunteers", "Staff"];
const ROLE_OF: Record<string, string | undefined> = { Interns: "QC intern", Volunteers: "Volunteer", Staff: "Staff" };
const ROLE_COLOR: Record<string, string> = { "QC intern": "var(--brand)", Volunteer: "var(--ok)", Staff: "var(--fg)", "Partner contact": "var(--warn)" };

export default function PeoplePage() {
  const { state, update, toast } = useApp();
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [hours, setHours] = useState("");
  const [checks, setChecks] = useState("");
  const [cert, setCert] = useState(false);
  const [err, setErr] = useState("");
  const need = state.settings.qcChecks;
  const role = ROLE_OF[TABS[tab]];
  const rows = state.people.filter((p) => !role || p.role === role);
  const interns = state.people.filter((p) => p.role === "QC intern");

  const open = (p: Person) => { setEditId(p.id); setHours(String(p.hours)); setChecks(String(p.checks)); setCert(p.certified); setErr(""); };
  const ed = state.people.find((p) => p.id === editId);
  const checkN = Number(checks);
  const save = () => {
    if (!(Number(hours) >= 0) || hours.trim() === "") return setErr("Hours must be 0 or more");
    if (ed?.role === "QC intern" && (!(checkN >= 0) || checks.trim() === "")) return setErr("Checks must be 0 or more");
    const isIntern = ed?.role === "QC intern";
    if (cert && isIntern && checkN < need) return setErr(`Needs ${need} verified checks before the certificate`);
    update((d) => { const x = d.people.find((p) => p.id === editId); if (x) { x.hours = Number(hours); if (isIntern) { x.checks = checkN; x.certified = cert; } } });
    toast(`Saved ${ed?.name}`);
    setEditId(null);
  };

  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="People" sub="Interns, volunteers and staff." actions={<Btn href="/staff/people/new">Register a person</Btn>} />
      <div className="row stagger">
        <Kpi label="People" value={state.people.length} />
        <Kpi label="QC interns" value={interns.length} color="var(--brand)" />
        <Kpi label="Certified" value={interns.filter((p) => p.certified).length} color="var(--ok)" sub={`needs ${need} checks`} />
        <Kpi label="Hours logged" value={state.people.reduce((a, p) => a + p.hours, 0)} />
      </div>
      <Tabs items={TABS} value={tab} onChange={setTab} />
      <DataTable
        rows={rows}
        onRow={open}
        cols={[
          { head: "Name", cell: (p) => <div><b>{p.name}</b><div className="tiny muted">{p.email}</div></div> },
          { head: "Role", cell: (p) => <span className="chip" style={{ ["--c" as string]: ROLE_COLOR[p.role] }}><i />{p.role}</span> },
          { head: "Program", cell: (p) => p.program },
          { head: "Since", cell: (p) => p.since },
          { head: "QC checks", width: 200, cell: (p) => p.role === "QC intern" ? <div className="col gap8" style={{ gap: 4 }}><Progress pct={Math.min(100, (p.checks / need) * 100)} color={p.checks >= need ? "var(--ok)" : undefined} /><span className="tiny muted">{p.checks} of {need}</span></div> : <span className="muted">Not applicable</span> },
          { head: "Hours", cell: (p) => p.hours },
          { head: "Certified", cell: (p) => p.role === "QC intern" ? (p.certified ? <span className="chip" style={{ ["--c" as string]: "var(--ok)" }}><i />Certified</span> : <span className="muted">Not yet</span>) : <span className="muted">Not applicable</span> },
        ]}
      />
      {ed && (
        <Modal title={ed.name} onClose={() => setEditId(null)}>
          <span className="muted small">{ed.role} · {ed.program} · since {ed.since}</span>
          <Field label="Hours logged" type="number" value={hours} onChange={setHours} />
          {ed.role === "QC intern" && <>
            <Field label={`Verified QC checks (certificate at ${need})`} type="number" value={checks} onChange={setChecks} />
            <Check on={cert} onChange={(v) => { if (v && checkN < need) { setErr(`Needs ${need} verified checks before the certificate`); return; } setErr(""); setCert(v); }} label="Certified" ok />
          </>}
          {err && <span className="err-text">{err}</span>}
          <div className="row"><Btn onClick={save}>Save</Btn><Btn variant="soft" onClick={() => setEditId(null)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
