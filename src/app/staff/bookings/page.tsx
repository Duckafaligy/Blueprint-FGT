"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, DataTable, Field, KV, Modal, PageHead, Status, Tabs } from "@/components/ui";
import { usd0 } from "@/lib/helpers";
import { DEMO_DAY } from "@/lib/seed";
import { EST, canIntake, isToday, rangeOf } from "@/components/staff-a/common";
import type { Lot } from "@/lib/types";

const TABS = ["Upcoming", "Today", "In progress", "All"];
const EMPTY = { company: "", contact: "", address: "", window: "", count: "10" };

export default function Page() {
  const { state, update, toast } = useApp();
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState<Record<string, string>>({});

  const rows = state.lots.filter((l) =>
    tab === 0 ? l.status === "Booked" : tab === 1 ? isToday(l, DEMO_DAY) : tab === 2 ? l.status === "In progress" || l.status === "Picked up" : true);
  const lot = state.lots.find((l) => l.id === open);

  const add = () => {
    const e: Record<string, string> = {};
    if (!f.company.trim()) e.company = "Enter the company name";
    if (!f.contact.trim()) e.contact = "Enter a contact person";
    if (!f.address.trim()) e.address = "Enter the pickup address";
    if (!f.window.trim()) e.window = "Enter a pickup window, for example Fri, Nov 20 · 1 to 4";
    const n = Number(f.count);
    if (!Number.isInteger(n) || n < 1 || n > 500) e.count = "Enter a whole number from 1 to 500";
    setErrs(e);
    if (Object.keys(e).length) return;
    const prefix = f.company.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
    const id = `${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    update((d) => {
      d.lots.unshift({ id, company: f.company.trim(), contact: f.contact.trim(), email: "", phone: "", address: f.address.trim(), window: f.window.trim(), count: n, status: "Booked", fee: d.settings.pickupFee, kind: n >= d.settings.minLot ? "bulk" : "donate" });
    });
    toast(`Booking ${id} added`);
    setAdding(false); setF(EMPTY); setErrs({}); setTab(3);
  };

  const pickedUp = (l: Lot) => {
    update((d) => { const x = d.lots.find((y) => y.id === l.id); if (x) x.status = "Picked up"; });
    toast(`${l.company} marked as picked up`);
  };

  return (
    <>
      <PageHead title="Bookings" sub="Pickups booked by businesses. Open one to start intake once it arrives." actions={<Btn onClick={() => setAdding(true)}>Add booking</Btn>} />
      <Tabs items={TABS} value={tab} onChange={setTab} />
      <DataTable<Lot> rows={rows} onRow={(l) => setOpen(l.id)} empty="No bookings in this view."
        cols={[
          { head: "Booking", cell: (l) => <span className="mono bold">{l.id}</span> },
          { head: "Company", cell: (l) => <b>{l.company}</b> },
          { head: "Window", cell: (l) => l.window },
          { head: "Devices", cell: (l) => l.count },
          { head: "Est. resale value", cell: (l) => usd0(l.count * EST) },
          { head: "Partner share range", cell: (l) => rangeOf(l.count * EST) },
          { head: "Status", cell: (l) => <Status s={l.status} /> },
        ]} />
      {lot && (
        <Modal title={`${lot.company} · ${lot.id}`} onClose={() => setOpen(null)}>
          <KV rows={[["Status", <Status key="s" s={lot.status} />], ["Window", lot.window], ["Address", lot.address], ["Contact", `${lot.contact}${lot.phone ? " · " + lot.phone : ""}`], ["Devices", lot.count], ["Est. resale value", usd0(lot.count * EST)], ["Partner share range", rangeOf(lot.count * EST)], ["Pickup fee", usd0(lot.fee)]]} />
          <div className="row gap12" style={{ justifyContent: "flex-end" }}>
            <Btn variant="soft" onClick={() => setOpen(null)}>Close</Btn>
            {lot.status === "Booked" && <Btn variant="outline" onClick={() => pickedUp(lot)}>Mark picked up</Btn>}
            {canIntake(lot) && <Btn href={`/staff/intake/${lot.id}`}>Open intake</Btn>}
          </div>
        </Modal>
      )}
      {adding && (
        <Modal title="Add booking" onClose={() => setAdding(false)}>
          <Field label="Company" value={f.company} onChange={(v) => setF({ ...f, company: v })} error={errs.company} />
          <Field label="Contact" value={f.contact} onChange={(v) => setF({ ...f, contact: v })} error={errs.contact} />
          <Field label="Address" value={f.address} onChange={(v) => setF({ ...f, address: v })} error={errs.address} />
          <div className="row start gap12">
            <Field label="Window" value={f.window} onChange={(v) => setF({ ...f, window: v })} error={errs.window} placeholder="Fri, Nov 20 · 1 to 4" />
            <Field label="Devices" type="number" width={120} value={f.count} onChange={(v) => setF({ ...f, count: v })} error={errs.count} />
          </div>
          <div className="row gap12" style={{ justifyContent: "flex-end" }}><Btn variant="soft" onClick={() => setAdding(false)}>Cancel</Btn><Btn onClick={add}>Add booking</Btn></div>
        </Modal>
      )}
    </>
  );
}
