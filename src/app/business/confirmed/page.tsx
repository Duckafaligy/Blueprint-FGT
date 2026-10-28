"use client";
import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { Btn, EmailPreview, KV, Card } from "@/components/ui";
import { usd } from "@/lib/helpers";
import { COMPANY, Crumbs, useDraft, useStartOver } from "@/components/business/kit";
import type { Device } from "@/lib/types";

interface Row { id: string; type: string; make: string; model: string; serial: string; notes: string }
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function ConfirmedPage() {
  const { state, update, hydrated } = useApp();
  const { d, s } = useDraft();
  const startOver = useStartOver();
  const rows = (Array.isArray(d.rows) ? d.rows : []) as Row[];
  const lotId = d.createdLotId ? String(d.createdLotId) : "";
  const ready = rows.length > 0 && !!s("s_window");

  useEffect(() => {
    if (!hydrated || !ready) return;
    update((x) => {
      if (x.inquiryDraft.createdLotId) return; // already created: reload or re-render
      const r = (x.inquiryDraft.rows ?? []) as Row[];
      const nums = x.lots.filter((l) => l.id.startsWith("MSA-")).map((l) => Number(l.id.slice(4)) || 0);
      const id = "MSA-" + String(Math.max(30, ...nums) + 1).padStart(4, "0");
      const sd = x.inquiryDraft;
      const addr = [sd.s_address, sd.s_floor].filter(Boolean).join(", ");
      x.lots.push({ id, company: COMPANY, contact: String(sd.s_name ?? ""), email: String(sd.s_email ?? ""), phone: String(sd.s_phone ?? ""), address: addr, window: String(sd.s_window), count: r.length, status: "Booked", fee: x.settings.pickupFee, kind: "donate" });
      r.forEach((row, i) => {
        const dev: Device = { id: `${id}-${i + 1}`, lotId: id, type: cap(row.type.trim().toLowerCase()), make: row.make, model: row.model, serial: row.serial, status: "Booked", path: null, work: [], history: [] };
        if (row.notes) dev.note = row.notes;
        x.devices.push(dev);
      });
      sd.createdLotId = id;
      const inq = x.inquiries.find((i) => i.id === sd.sentId);
      if (inq) inq.status = "Approved";
    });
  }, [hydrated, ready, update]);

  if (!lotId && !ready) {
    return (
      <div className="page"><Crumbs items={[["Quote", "/business/quote"], ["Confirmed"]]} /><h1>Nothing to confirm yet</h1>
        <p className="muted">Pick a pickup window and list your devices first.</p>
        <div className="row gap12"><Btn href="/business/schedule">Pick a window</Btn><Btn variant="outline" href="/business/devices">Device list</Btn></div></div>
    );
  }
  const lot = state.lots.find((l) => l.id === lotId);
  return (
    <div className="page narrow">
      <div className="qcard" style={{ alignItems: "center", textAlign: "center" }}>
        <span className="stamp" style={{ fontSize: 28 }}>Pickup booked</span>
        <h1>You are all set</h1>
        <p className="muted">We will see {rows.length} devices on {s("s_window")}. Follow them from pickup to their second life.</p>
        <Card style={{ width: "100%", textAlign: "left" }}>
          <KV rows={[["Lot", lot?.id ?? "Creating..."], ["Window", s("s_window")], ["Address", [s("s_address"), s("s_floor")].filter(Boolean).join(", ")], ["Devices", String(rows.length)], ["Pickup fee", usd(state.settings.pickupFee)]]} />
        </Card>
        <EmailPreview to={s("s_email")} subject={`Pickup confirmed: ${s("s_window")}`}>
          <p>Hi {s("s_name").split(" ")[0]},</p>
          <p>Your pickup is booked for {s("s_window")} at {s("s_address")}. We will collect {rows.length} devices and wipe every drive. Certificates arrive as each device is done. Lot reference: {lot?.id}.</p>
        </EmailPreview>
        <div className="row gap12 wrap" style={{ justifyContent: "center" }}>
          <Btn size="lg" href="/business/donations">Track my devices</Btn>
          <Btn size="lg" variant="outline" onClick={startOver}>Start another inquiry</Btn>
        </div>
      </div>
    </div>
  );
}
