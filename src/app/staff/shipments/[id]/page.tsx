"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, DataTable, Field, Kpi, Modal, PageHead, Pipeline, Status, Tabs } from "@/components/ui";
import { isDoneDev, shipDevices, shipValue } from "@/components/staff-b/parts";
import { NOW, addHistory, partnerOf, share, usd } from "@/lib/helpers";

const STAGES = ["Created", "Shipped", "Refurbishing", "Done", "Returned", "QC", "Paid"];

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, update, toast } = useApp();
  const [tab, setTab] = useState(0);
  const [modal, setModal] = useState<null | "msg">(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const sh = state.shipments.find((x) => x.id === id);
  if (!sh) return <div className="page" style={{ padding: 0 }}><PageHead title="Shipment not found" actions={<Btn href="/staff/shipments">Back to shipments</Btn>} /></div>;
  const partner = partnerOf(state, sh.partnerId);
  const devs = shipDevices(state, sh).filter((d) => !!d).map((d) => d!);
  const pct = partner?.sharePct ?? 0;

  let now = 0;
  if (sh.status === "Shipped") now = 1;
  else if (sh.status === "Refurbishing") now = 2;
  else if (sh.status === "Done") now = 3;
  else if (sh.status === "Returned") now = devs.length && devs.every((d) => d.status === "Sold") ? 6 : devs.length && devs.every((d) => ["Ready to sell", "Sold"].includes(d.status)) ? 5 : 4;

  const done = devs.filter((d) => isDoneDev(d.status)).length;
  const refurb = devs.filter((d) => d.status === "Refurbishing").length;
  const waiting = devs.length - done - refurb;
  const shareTotal = devs.reduce((a, d) => a + share(d.price ?? 0, pct), 0);

  const openMsg = (t: string) => { setText(t); setErr(""); setModal("msg"); };
  const send = () => {
    if (!text.trim()) { setErr("Write a message first"); return; }
    update((d) => { const s = d.shipments.find((x) => x.id === id); if (s) { s.messages.push({ from: "FGT", text: text.trim(), at: NOW }); s.notified = true; } });
    toast(`Message sent to ${partner?.name}`);
    setModal(null);
  };
  const ready = () => {
    update((d) => { const s = d.shipments.find((x) => x.id === id); if (s) { s.status = "Ready for pickup"; s.accepted = true; s.messages.push({ from: "FGT", text: "This batch is ready for pickup.", at: NOW }); } });
    toast(`${sh.name} is ready for pickup`);
  };
  const shipIt = () => {
    update((d) => {
      const s = d.shipments.find((x) => x.id === id); if (!s) return;
      s.status = "Shipped";
      d.devices.forEach((dv) => { if (s.deviceIds.includes(dv.id)) { dv.status = "At partner"; addHistory(dv, `Shipped to ${partner?.name}`, s.name); } });
    });
    toast(`${sh.name} shipped`);
  };
  const receive = () => {
    update((d) => {
      const s = d.shipments.find((x) => x.id === id); if (!s) return;
      s.status = "Returned";
      d.devices.forEach((dv) => { if (s.deviceIds.includes(dv.id) && dv.status === "Done") { dv.status = "Ready for QC"; addHistory(dv, "Back from partner", `${s.name} received`); } });
    });
    toast(`${sh.name} received. Devices are ready for QC`);
  };

  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead
        title={sh.name}
        sub={`${partner?.name} · ${devs.length} devices · ship ${sh.shipDate}${sh.dueDate ? ` · due ${sh.dueDate}` : ""}`}
        actions={<>
          <Status s={sh.status} />
          <Btn variant="outline" onClick={() => openMsg("")}>Message partner</Btn>
          {sh.status === "Planned" && <>
            <Btn variant="outline" onClick={() => openMsg(sh.messages.at(-1)?.from === "FGT" && sh.notified ? "" : `We are adding ${devs.length} devices to your next shipment, planned for ${sh.shipDate}.`)}>Tell partner</Btn>
            <Btn onClick={ready}>Mark ready for pickup</Btn>
          </>}
          {sh.status === "Ready for pickup" && <Btn onClick={shipIt}>Mark shipped</Btn>}
          {sh.status === "Done" && <Btn variant="ok" onClick={receive}>Receive batch</Btn>}
          {sh.status === "Returned" && <Btn href="/staff/qc">Open QC queue</Btn>}
        </>}
      />
      <Card><Pipeline stages={STAGES} now={now} /></Card>
      <div className="row stagger">
        <Kpi label="Done" value={done} sub={`of ${devs.length}`} color="var(--ok)" />
        <Kpi label="Refurbishing" value={refurb} color="var(--warn)" />
        <Kpi label="Waiting" value={waiting} />
        <Kpi label="Partner share total" value={shareTotal} prefix="$" decimals={2} sub={`${pct}% of ${usd(shipValue(state, sh))}`} color="var(--brand)" />
      </div>
      <Tabs items={["Devices", `Messages (${sh.messages.length})`]} value={tab} onChange={setTab} />
      {tab === 0 ? (
        <DataTable
          rows={devs}
          cols={[
            { head: "Device", cell: (d) => <div><b>{d.make} {d.model}</b><div className="tiny muted mono">{d.serial}</div></div> },
            { head: "Work", cell: (d) => d.work.join(", ") || "None" },
            { head: "Status", cell: (d) => <Status s={d.status} /> },
            { head: "Partner note", cell: (d) => d.note ?? <span className="muted">None</span> },
            { head: "Resale value", cell: (d) => usd(d.price ?? 0) },
            { head: "Partner share", cell: (d) => usd(share(d.price ?? 0, pct)) },
          ]}
        />
      ) : (
        <Card>
          {sh.messages.length === 0 && <span className="muted">No messages yet.</span>}
          <div className="col stagger">
            {sh.messages.map((m, i) => (
              <div key={i} className="col gap8" style={{ alignSelf: m.from === "FGT" ? "flex-end" : "flex-start", maxWidth: 560, background: m.from === "FGT" ? "var(--surface2)" : "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px" }}>
                <span className="tiny muted">{m.from === "FGT" ? "FGT" : partner?.name} · {m.at}</span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <div><Btn onClick={() => openMsg("")}>Message partner</Btn></div>
        </Card>
      )}
      {modal && (
        <Modal title={`Message ${partner?.name}`} onClose={() => setModal(null)}>
          <Field label="Message" textarea value={text} onChange={setText} error={err} placeholder="Write to the partner" />
          <div className="row"><Btn onClick={send}>Send message</Btn><Btn variant="soft" onClick={() => setModal(null)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
