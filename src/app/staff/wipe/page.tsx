"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, DataTable, PageHead, Seg, SelectField, Status } from "@/components/ui";
import { addHistory } from "@/lib/helpers";
import { nextCert } from "@/components/staff-a/common";
import type { AppState, Device } from "@/lib/types";

const FILTERS = ["All", "To wipe", "Wiped"] as const;
const label = (d: Device) => `${d.serial} · ${d.make} ${d.model}`;

function applyWipe(s: AppState, id: string, method: string, passes: string, result: "Success" | "Failed", taken: string[]) {
  const d = s.devices.find((x) => x.id === id);
  if (!d) return "";
  const cert = nextCert(s, taken);
  taken.push(cert);
  const at = "Nov 6";
  d.wipe = { result, method, passes, cert, by: "Sam", at, destroyed: result === "Failed" ? true : undefined };
  d.status = d.path === "recycle" ? "Recycled" : "Wiped";
  addHistory(d, result === "Success" ? "Wiped" : "Wipe failed", `${method} · ${passes} · ${result.toLowerCase()} · ${cert}${result === "Failed" ? " · drive physically destroyed" : ""}`);
  return cert;
}

export default function Page() {
  const { state, update, toast } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const waiting = state.devices.filter((d) => d.status === "Received");
  const wiped = state.devices.filter((d) => d.wipe);
  const rows = filter === "To wipe" ? waiting : filter === "Wiped" ? wiped : [...waiting, ...wiped];
  const [pick, setPick] = useState("");
  const [method, setMethod] = useState("ShredOS / nwipe");
  const [passes, setPasses] = useState("3-pass overwrite");
  const [result, setResult] = useState<"Success" | "Failed">("Success");
  const [last, setLast] = useState<{ cert: string; failed: boolean } | null>(null);

  const chosen = waiting.find((d) => label(d) === pick) ?? waiting[0];

  const save = () => {
    if (!chosen) return;
    const taken: string[] = []; let cert = "";
    update((s) => { cert = applyWipe(s, chosen.id, method, passes, result, taken); });
    setLast({ cert, failed: result === "Failed" }); setPick("");
    toast(result === "Success" ? `Certificate ${cert} made` : `Wipe failed for ${chosen.serial}. Destroy the drive.`, result === "Success" ? "ok" : "bad");
  };
  const all = () => {
    if (!waiting.length) return toast("No devices are waiting to be wiped", "warn");
    const taken: string[] = [];
    update((s) => { s.devices.filter((d) => d.status === "Received").forEach((d) => applyWipe(s, d.id, "ShredOS / nwipe", "3-pass overwrite", "Success", taken)); });
    toast(`Wiped ${waiting.length} device${waiting.length > 1 ? "s" : ""} with certificates`);
  };

  return (
    <>
      <PageHead title="Wipe log" sub="Every device is wiped before it leaves intake. Each wipe gets a certificate." actions={<Btn variant="outline" onClick={all}>Wipe all received</Btn>} />
      <div className="row start gap24">
        <div className="col grow">
          <Seg items={FILTERS} value={filter} onChange={setFilter} />
          <DataTable<Device> rows={rows} empty="Nothing in the wipe log yet."
            cols={[
              { head: "Serial", cell: (d) => <span className="mono">{d.serial}</span> },
              { head: "Device", cell: (d) => `${d.make} ${d.model}` },
              { head: "Pickup", cell: (d) => d.lotId },
              { head: "Status", cell: (d) => d.wipe ? <Status s={d.wipe.result} label={d.wipe.destroyed ? "Failed, destroyed" : "Wiped"} /> : <Status s="Received" label="Waiting to wipe" /> },
              { head: "Method", cell: (d) => d.wipe ? <span className="small">{d.wipe.method}, {d.wipe.passes}</span> : "" },
              { head: "Certificate", cell: (d) => d.wipe?.cert ? <Link className="link mono" href={`/business/doc/certificate/${d.id}`}>{d.wipe.cert}</Link> : "" },
            ]} />
        </div>
        <Card title="Record a wipe" style={{ width: 360, flexShrink: 0 }}>
          {waiting.length === 0 ? <span className="muted small">No received devices are waiting. Finish intake first.</span> : (
            <>
              <SelectField label="Device" value={chosen ? label(chosen) : ""} onChange={setPick} options={waiting.map(label)} />
              <SelectField label="Method" value={method} onChange={setMethod} options={["ShredOS / nwipe", "DBAN", "Blancco Drive Eraser"]} />
              <SelectField label="Passes" value={passes} onChange={setPasses} options={["1-pass overwrite", "3-pass overwrite", "7-pass overwrite"]} />
              <div className="col gap8"><span className="label">Result</span><Seg items={["Success", "Failed"] as const} value={result} onChange={setResult} /></div>
              <Btn onClick={save}>Save and make certificate</Btn>
            </>
          )}
          {last && (last.failed
            ? <Banner color="var(--bad)"><b>Physically destroy this drive.</b><div className="small">The wipe failed. Certificate {last.cert} records the destruction.</div></Banner>
            : <Banner color="var(--ok)"><b>Certificate {last.cert}</b><div className="small">Saved to the device history.</div></Banner>)}
        </Card>
      </div>
    </>
  );
}
