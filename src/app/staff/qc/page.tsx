"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, DataTable, PageHead, Tabs } from "@/components/ui";
import { partnerOf } from "@/lib/helpers";
import type { Device } from "@/lib/types";

const TABS = ["All", "From partners", "In-house"];

export default function Page() {
  const { state } = useApp();
  const [tab, setTab] = useState(0);
  const queue = state.devices.filter((d) => d.status === "Ready for QC");
  const rows = queue.filter((d) => tab === 0 || (tab === 1 ? !!d.partnerId : !d.partnerId));
  return (
    <>
      <PageHead title="QC queue" sub={`${queue.length} device${queue.length === 1 ? "" : "s"} waiting for a ten point check.`} />
      <Tabs items={TABS} value={tab} onChange={setTab} />
      <DataTable<Device> rows={rows} empty="The QC queue is empty."
        cols={[
          { head: "Serial", cell: (d) => <span className="mono bold">{d.serial}</span> },
          { head: "Device", cell: (d) => `${d.make} ${d.model}` },
          { head: "Source", cell: (d) => partnerOf(state, d.partnerId)?.name ?? "In-house" },
          { head: "Work done", cell: (d) => <span className="small">{d.note ?? (d.work.join(", ") || "In-house prep")}</span> },
          { head: "Pickup", cell: (d) => d.lotId },
          { head: "", cell: (d) => <Btn size="sm" href={`/staff/qc/${d.id}`}>Start QC</Btn> },
        ]} />
    </>
  );
}
