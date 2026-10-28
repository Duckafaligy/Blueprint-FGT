"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, Check, Field, Kpi, Modal, PageHead, Pipeline, Status, Tabs } from "@/components/ui";
import { addHistory, share, usd } from "@/lib/helpers";
import type { DeviceStatus } from "@/lib/types";
import { PID, mine, passed, pct, shipDevices, value } from "@/components/partner/util";

const STAGES = ["Created", "Shipped", "Refurbishing", "Done", "Returned", "QC", "Paid"];

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, update, toast } = useApp();
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const x = mine(state).find((s) => s.id === id);
  if (!x) return <div className="page"><PageHead title="Batch not found" /><Btn href="/partner/batches">Back to batches</Btn></div>;
  const ds = shipDevices(state, x);
  const pc = pct(state);
  const st = x.status;
  const active = st === "Refurbishing";
  const allDone = ds.length > 0 && ds.every((d) => d.status === "Done");
  const now = ds.length && ds.every((d) => d.status === "Sold") ? 6 : ds.length && ds.every(passed) ? 5 : st === "Returned" ? 4 : st === "Done" ? 3 : st === "Refurbishing" ? 2 : st === "Shipped" ? 1 : 0;

  const statuses = Array.from(new Set(ds.map((d) => d.status)));
  const tabs = ["All", ...statuses];
  const t = Math.min(tab, tabs.length - 1);
  const list = t === 0 ? ds : ds.filter((d) => d.status === tabs[t]);
  const selIds = sel.filter((i) => ds.some((d) => d.id === i));

  const setBatch = (status: typeof st, devStatus: DeviceStatus | null, label: string, msg: string) => {
    update((d) => {
      d.shipments.find((s) => s.id === x.id)!.status = status;
      if (devStatus) d.devices.filter((v) => v.shipmentId === x.id).forEach((v) => { v.status = devStatus; addHistory(v, label, x.name, "Dev"); });
    });
    toast(msg);
  };
  const move = (from: DeviceStatus, to: DeviceStatus, label: string) => {
    const hit = ds.filter((d) => selIds.includes(d.id) && d.status === from);
    if (!hit.length) return toast(`Select devices that are ${from} first`, "warn");
    update((s) => s.devices.filter((v) => hit.some((h) => h.id === v.id)).forEach((v) => { v.status = to; addHistory(v, label, undefined, "Dev"); }));
    toast(`${hit.length} marked ${to.toLowerCase()}`);
  };
  const saveNote = () => {
    if (!note.trim()) return setErr("Write a note first.");
    update((s) => s.devices.filter((v) => selIds.includes(v.id)).forEach((v) => { v.note = note.trim(); addHistory(v, "Partner note", note.trim(), "Dev"); }));
    toast(`Note saved on ${selIds.length} device${selIds.length > 1 ? "s" : ""}`);
    setNoteOpen(false); setNote(""); setErr("");
  };
  const toggleAll = () => setSel(selIds.length === list.length ? [] : list.map((d) => d.id));

  const action = st === "Ready for pickup"
    ? <Btn variant="ok" onClick={() => setBatch("Shipped", "At partner", "Picked up by partner", "Marked picked up")}>Mark picked up</Btn>
    : st === "Shipped" ? <Btn onClick={() => setBatch("Refurbishing", null, "", "Work started")}>Start work</Btn>
    : st === "Refurbishing" ? <Btn variant="ok" disabled={!allDone} title={allDone ? "" : "Every device must be Done"} onClick={() => setBatch("Done", null, "", "Batch marked done")}>Mark batch done</Btn>
    : st === "Done" ? <span className="muted">Waiting for FGT to receive it</span> : <Status s="Returned" />;

  const dates: [string, string, boolean][] = [
    ["Created by FGT", x.shipDate, true],
    ["Picked up", st === "Ready for pickup" ? "Waiting" : "Done", st !== "Ready for pickup"],
    ["Work finished", x.dueDate ? `Due ${x.dueDate}` : "Not set", ["Done", "Returned"].includes(st)],
    ["Received by FGT", st === "Returned" ? "Done" : "Waiting", st === "Returned"],
  ];

  return (
    <div className="page">
      <PageHead title={x.name} sub={`${ds.length} laptops. Shipment ${x.shipDate}${x.dueDate ? `, due ${x.dueDate}` : ""}.`} actions={action} />
      <Card><Pipeline stages={STAGES} now={now} /></Card>
      <div className="row gap12 stagger" style={{ alignItems: "stretch" }}>
        <Kpi label="Laptops" value={ds.length} />
        <Kpi label="Done" value={ds.filter((d) => ["Done", "Ready for QC", "Ready to sell", "Sold"].includes(d.status)).length} sub={`of ${ds.length}`} />
        <Kpi label="Resale value" value={value(ds)} prefix="$" decimals={2} />
        <Kpi label="Your share" value={share(value(ds), pc)} prefix="$" decimals={2} color="var(--ok)" sub={`${pc}%`} />
      </div>
      <div className="col gap24" style={{ alignItems: "stretch" }}>
        <div className="col" style={{ minWidth: 0 }}>
          <Tabs items={tabs} value={t} onChange={(i) => { setTab(i); setSel([]); }} />
          <div className="row between card" style={{ padding: "12px 18px", flexDirection: "row" }}>
            <div className="row gap12"><Check on={list.length > 0 && selIds.length === list.length} onChange={toggleAll} label="Select all" /><b>{selIds.length} selected</b></div>
            <div className="row gap8">
              <Btn size="sm" variant="outline" disabled={!active || !selIds.length} onClick={() => move("At partner", "Refurbishing", "Refurbishing started")}>Mark refurbishing</Btn>
              <Btn size="sm" variant="outline" disabled={!active || !selIds.length} onClick={() => move("Refurbishing", "Done", "Partner finished")}>Mark done</Btn>
              <Btn size="sm" variant="soft" disabled={!selIds.length} onClick={() => setNoteOpen(true)}>Add note</Btn>
            </div>
          </div>
          {!active && st !== "Done" && st !== "Returned" && <span className="tiny muted">Status buttons unlock once you start work on this batch.</span>}
          <div className="col gap12 stagger">
            {list.length === 0 && <p className="muted">No devices here.</p>}
            {list.map((d) => (
              <div key={d.id} className="card lift" style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 16 }}>
                <Check on={selIds.includes(d.id)} onChange={(v) => setSel((s) => v ? [...s, d.id] : s.filter((i) => i !== d.id))} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{d.make} {d.model}</b>
                  <div className="tiny muted">{d.serial}</div>
                  <div className="row gap8" style={{ marginTop: 6, flexWrap: "wrap" }}>{d.work.map((w) => <span key={w} className="tag">{w}</span>)}</div>
                </div>
                <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="Add a note" aria-label={`Note for ${d.serial}`} value={d.note ?? ""} onChange={(e) => { const v = e.target.value; update((s) => { s.devices.find((q) => q.id === d.id)!.note = v; }); }} />
                <Status s={d.status} />
                <b style={{ width: 80, textAlign: "right" }}>{usd(share(d.price ?? 0, pc))}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="col stagger" style={{ maxWidth: 520 }}>
          <Card title="Dates">
            {dates.map(([l, v, ok]) => (
              <Check key={l} on={ok} ok label={<span><b>{l}</b><br /><span className="tiny muted">{v}</span></span>} />
            ))}
          </Card>
          {st === "Done" && <Banner color="var(--accent)">Your work is finished. FGT will receive the batch and run quality checks.</Banner>}
        </div>
      </div>
      {noteOpen && (
        <Modal title="Add note" onClose={() => setNoteOpen(false)}>
          <Field label={`Note for ${selIds.length} selected device${selIds.length > 1 ? "s" : ""}`} textarea value={note} onChange={setNote} error={err} placeholder="For example: replaced battery" />
          <div className="row gap8"><Btn onClick={saveNote}>Save note</Btn><Btn variant="soft" onClick={() => setNoteOpen(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
