"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { DataTable, Field, PageHead, Status } from "@/components/ui";
import { partnerOf, usd0 } from "@/lib/helpers";
import { rangeOf } from "@/components/staff-a/common";
import type { Device } from "@/lib/types";

const STATUSES = ["All", "Booked", "Received", "Wiped", "At partner", "Refurbishing", "Done", "Ready for QC", "Ready to sell", "Sold", "Recycled"] as const;

function Devices() {
  const { state } = useApp();
  const router = useRouter();
  const urlQ = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [st, setSt] = useState<(typeof STATUSES)[number]>("All");
  useEffect(() => setQ(urlQ), [urlQ]);
  const needle = q.trim().toLowerCase();
  const rows = state.devices.filter((d) => (st === "All" || d.status === st) &&
    (!needle || [d.serial, d.make, d.model, d.id, d.lotId].some((v) => v.toLowerCase().includes(needle))));
  return (
    <>
      <PageHead title="Devices" sub={`${rows.length} of ${state.devices.length} devices`} />
      <div className="row gap12 wrap">
        <Field label="Search" value={q} onChange={setQ} placeholder="Serial, make, model or pickup" style={{ maxWidth: 360 }} />
      </div>
      <div className="row wrap gap8">
        {STATUSES.map((s) => <button key={s} className={`pillbtn ${s === st ? "on" : ""}`} onClick={() => setSt(s)}>{s}</button>)}
      </div>
      <DataTable<Device> rows={rows} onRow={(d) => router.push(`/staff/devices/${d.id}`)} empty="No devices match."
        cols={[
          { head: "Serial", cell: (d) => <span className="mono bold">{d.serial}</span> },
          { head: "Device", cell: (d) => `${d.make} ${d.model}` },
          { head: "Status", cell: (d) => <Status s={d.status} /> },
          { head: "Resale value", cell: (d) => (d.price ? usd0(d.price) : "-") },
          { head: "Partner share range", cell: (d) => (d.price ? rangeOf(d.price) : "-") },
          { head: "Partner", cell: (d) => partnerOf(state, d.partnerId)?.name ?? <span className="muted">None</span> },
        ]} />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Devices /></Suspense>;
}
