"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, Check, DataTable, Field, Modal, PageHead, Progress, SelectField } from "@/components/ui";
import { addHistory, devicesOfLot } from "@/lib/helpers";
import type { Device, Path } from "@/lib/types";

const OPTS: { p: Path; label: string }[] = [{ p: "resell", label: "Resell" }, { p: "partner", label: "Partner" }, { p: "recycle", label: "Recycle" }];
const HIST: Record<Path, string> = { resell: "Resell after in-house prep", partner: "Sent to partner", recycle: "Marked to recycle" };
const NEW = { type: "Laptop", make: "", model: "", serial: "" };

export default function Page() {
  const { lotId } = useParams<{ lotId: string }>();
  const { state, update, toast } = useApp();
  const router = useRouter();
  const [scan, setScan] = useState("");
  const [adding, setAdding] = useState(false);
  const [recycling, setRecycling] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");
  const [nd, setNd] = useState(NEW);
  const [ndErr, setNdErr] = useState<Record<string, string>>({});

  const lot = state.lots.find((l) => l.id === lotId);
  if (!lot) return <PageHead title="Pickup not found" actions={<Btn href="/staff/intake">Back to intake</Btn>} />;
  const devs = devicesOfLot(state, lotId);
  const total = Math.max(lot.count, devs.length);
  const received = devs.filter((d) => d.status !== "Booked");
  const decided = received.filter((d) => d.path);
  const ready = received.length >= total && decided.length === received.length && !lot.intakeDone;
  const by = (p: Path) => decided.filter((d) => d.path === p).length;

  const checkIn = (id: string) => {
    update((s) => { const d = s.devices.find((x) => x.id === id); if (d && d.status === "Booked") { d.status = "Received"; addHistory(d, "Received", "Checked in at intake"); } });
  };
  const doScan = () => {
    const q = scan.trim().toLowerCase();
    if (!q) return;
    const d = devs.find((x) => x.serial.toLowerCase() === q);
    if (!d) toast(`Serial ${scan.trim()} is not on this pickup`, "bad");
    else if (d.status !== "Booked") toast(`${d.serial} is already checked in`, "warn");
    else { checkIn(d.id); toast(`${d.serial} checked in`); }
    setScan("");
  };
  const decide = (id: string, p: Path, why?: string) => {
    update((s) => {
      const d = s.devices.find((x) => x.id === id);
      if (!d) return;
      d.path = p; d.reason = p === "recycle" ? why : undefined;
      if (p !== "partner") d.work = [];
      addHistory(d, HIST[p], p === "recycle" ? why : "Decision made at intake");
    });
  };
  const closeRecycle = () => { setRecycling(null); setReasonErr(""); };
  const saveRecycle = () => {
    if (!reason.trim()) return setReasonErr("A reason is required to recycle a device");
    decide(recycling!, "recycle", reason.trim());
    toast("Marked to recycle"); setReason(""); closeRecycle();
  };
  const addDevice = () => {
    const e: Record<string, string> = {};
    if (!nd.make.trim()) e.make = "Enter the make";
    if (!nd.model.trim()) e.model = "Enter the model";
    if (!nd.serial.trim()) e.serial = "Enter the serial number";
    else if (state.devices.some((x) => x.serial.toLowerCase() === nd.serial.trim().toLowerCase())) e.serial = "That serial is already in the system";
    setNdErr(e);
    if (Object.keys(e).length) return;
    update((s) => {
      const n = s.devices.filter((x) => x.lotId === lotId).length + 1;
      let id = `${lotId}-${n}`; let k = n;
      while (s.devices.some((x) => x.id === id)) id = `${lotId}-${++k}`;
      const d: Device = { id, lotId, type: nd.type, make: nd.make.trim(), model: nd.model.trim(), serial: nd.serial.trim(), status: "Received", path: null, work: [], price: 250, history: [] };
      addHistory(d, "Received", "Added at intake, not on the list");
      s.devices.push(d);
      const l = s.lots.find((x) => x.id === lotId); if (l && l.count < n) l.count = n;
    });
    toast(`${nd.serial.trim()} added to ${lotId}`);
    setAdding(false); setNd(NEW); setNdErr({});
  };
  const finish = () => {
    update((s) => { const l = s.lots.find((x) => x.id === lotId); if (l) { l.intakeDone = true; l.status = "In progress"; } });
    toast(`Intake finished for ${lot.company}`);
    router.push("/staff/wipe");
  };

  return (
    <>
      <PageHead title={`Intake · ${lot.company}`} sub={`${lot.id} · ${lot.window} · ${lot.address}`}
        actions={<><Btn variant="outline" onClick={() => setAdding(true)}>Add a device not on the list</Btn><Btn disabled={!ready} onClick={finish}>Finish intake</Btn></>} />
      <div className="row start gap24">
        <div className="col grow">
          <form className="row gap12 end" onSubmit={(e) => { e.preventDefault(); doScan(); }}>
            <Field label="Scan or type a serial" value={scan} onChange={setScan} placeholder="Serial number, then Enter" />
            <Btn type="submit">Check in</Btn>
          </form>
          <DataTable<Device> rows={devs} empty="No devices listed. Use Add a device not on the list."
            cols={[
              { head: "", width: 44, cell: (d) => <Check on={d.status !== "Booked"} ok onChange={(v) => v && checkIn(d.id)} /> },
              { head: "Serial", cell: (d) => <span className="mono">{d.serial}</span> },
              { head: "Device", cell: (d) => `${d.make} ${d.model}` },
              { head: "Decision", cell: (d) => d.status === "Booked" ? <span className="muted small">Check in first</span> : d.status !== "Received" ? <span className="small">{d.path}</span> : (
                <div className="seg">{OPTS.map((o) => <button key={o.p} className={d.path === o.p ? "on" : ""} onClick={() => o.p === "recycle" ? (setRecycling(d.id), setReason(d.reason ?? "")) : decide(d.id, o.p)}>{o.label}</button>)}</div>) },
            ]} />
        </div>
        <div className="col" style={{ width: 340, flexShrink: 0 }}>
          <Card title="Progress">
            <b style={{ fontFamily: "var(--f-display)", fontSize: 40 }}>{received.length} of {total}</b>
            <Progress pct={(received.length / Math.max(total, 1)) * 100} color="var(--ok)" />
            <span className="small muted">{decided.length} of {received.length} checked in devices have a decision.</span>
          </Card>
          <Card title="What happens next">
            <div className="small col gap8">
              <span>{by("partner")} go to a partner after wiping.</span>
              <span>{by("resell")} get prepped in-house and resold.</span>
              <span>{by("recycle")} are recycled.</span>
              <span className="muted">Finish intake sends everything to the wipe log.</span>
            </div>
          </Card>
          {lot.intakeDone && <Banner color="var(--ok)">Intake is finished for this pickup.</Banner>}
        </div>
      </div>
      {recycling && (
        <Modal title="Why recycle this device?" onClose={closeRecycle}>
          <Field label="Reason" textarea value={reason} onChange={setReason} error={reasonErr} placeholder="For example, screen cracked, board damaged" />
          <div className="row gap12" style={{ justifyContent: "flex-end" }}><Btn variant="soft" onClick={closeRecycle}>Cancel</Btn><Btn variant="bad" onClick={saveRecycle}>Recycle</Btn></div>
        </Modal>
      )}
      {adding && (
        <Modal title="Add a device not on the list" onClose={() => setAdding(false)}>
          <SelectField label="Type" value={nd.type} onChange={(v) => setNd({ ...nd, type: v })} options={["Laptop", "Desktop", "Monitor", "Other"]} />
          <Field label="Make" value={nd.make} onChange={(v) => setNd({ ...nd, make: v })} error={ndErr.make} />
          <Field label="Model" value={nd.model} onChange={(v) => setNd({ ...nd, model: v })} error={ndErr.model} />
          <Field label="Serial number" value={nd.serial} onChange={(v) => setNd({ ...nd, serial: v })} error={ndErr.serial} />
          <div className="row gap12" style={{ justifyContent: "flex-end" }}><Btn variant="soft" onClick={() => setAdding(false)}>Cancel</Btn><Btn onClick={addDevice}>Add and check in</Btn></div>
        </Modal>
      )}
    </>
  );
}
