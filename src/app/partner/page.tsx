"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, Check, DataTable, Field, Kpi, Modal, PageHead } from "@/components/ui";
import { addHistory, NOW, partnerOf, share, usd } from "@/lib/helpers";
import { PID, mine, shipDevices, value } from "@/components/partner/util";

export default function Incoming() {
  const { state, update, toast } = useApp();
  const p = partnerOf(state, PID)!;
  const ship = mine(state).find((x) => x.status === "Planned" && x.notified);
  const devs = useMemo(() => (ship ? shipDevices(state, ship) : []), [state, ship]);
  const [off, setOff] = useState<string[]>([]);
  const [ask, setAsk] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const tiles = (
    <div className="row gap12 stagger" style={{ alignItems: "stretch" }}>
      <Kpi label="Your share" raw={`${p.sharePct}%`} sub="of the resale price" />
      <Kpi label="Paid" raw="On sale" sub="when each device sells" />
      <Kpi label="Smallest batch" value={p.minBatch} sub="devices" />
      <Kpi label="Turnaround" raw={p.turnaround.replace(" business days", "")} sub="business days" />
    </div>
  );

  if (!ship) {
    return (
      <div className="page">
        <PageHead title="Incoming" sub="Devices FGT plans to send you next." />
        <Card style={{ alignItems: "center", textAlign: "center", padding: 48 }}>
          <h3>Nothing incoming right now</h3>
          <p className="muted">When FGT plans your next shipment you will see the devices here. Your accepted shipments are under Batches.</p>
          <Btn href="/partner/batches">View batches</Btn>
        </Card>
        {tiles}
      </div>
    );
  }

  const kept = devs.filter((d) => !off.includes(d.id));
  const msg = ship.messages.find((m) => m.from === "FGT");

  const accept = () => {
    update((d) => {
      const s = d.shipments.find((x) => x.id === ship.id)!;
      const removed = d.devices.filter((x) => off.includes(x.id));
      removed.forEach((x) => { x.shipmentId = undefined; x.partnerId = undefined; addHistory(x, "Removed from shipment by partner", "Back in FGT's pool", "Dev"); });
      s.deviceIds = s.deviceIds.filter((i) => !off.includes(i));
      s.accepted = true; s.status = "Ready for pickup";
      s.messages.push({ from: "Partner", text: `Accepted ${s.deviceIds.length} devices. Ready for pickup.`, at: NOW });
      if (removed.length) s.messages.push({ from: "Partner", text: `We left out ${removed.length} device${removed.length > 1 ? "s" : ""}: ${removed.map((x) => x.serial).join(", ")}. They return to FGT's pool.`, at: NOW });
    });
    toast(`Shipment accepted. ${kept.length} devices ready for pickup`);
  };
  const send = () => {
    if (text.trim().length < 3) return setErr("Write a short message first.");
    update((d) => d.shipments.find((x) => x.id === ship.id)!.messages.push({ from: "Partner", text: text.trim(), at: NOW }));
    toast("Message sent to FGT"); setAsk(false); setText(""); setErr("");
  };

  return (
    <div className="page">
      <PageHead title="Incoming" sub="Check the devices, untick any you cannot take, then accept." />
      <Banner color="var(--accent)">
        <b style={{ fontSize: 20 }}>FGT is adding {devs.length} devices to your next shipment</b>
        <div className="muted" style={{ marginTop: 4 }}>Planned for {ship.shipDate}</div>
        {msg && <div style={{ marginTop: 8 }}>{msg.text}</div>}
      </Banner>
      <div className="row gap12 stagger" style={{ alignItems: "stretch" }}>
        <Kpi label="Devices coming" value={kept.length} sub={`of ${devs.length} planned`} />
        <Kpi label="Resale value" value={value(kept)} prefix="$" decimals={2} sub="FGT's estimate" />
        <Kpi label="Your share" value={share(value(kept), p.sharePct)} prefix="$" decimals={2} color="var(--ok)" sub={`${p.sharePct}% when sold`} />
      </div>
      <Card title="Devices in this shipment" right={
        <div className="row gap8">
          <Btn variant="outline" onClick={() => setAsk(true)}>Ask to change</Btn>
          <Btn variant="ok" disabled={kept.length === 0} onClick={accept}>Accept shipment</Btn>
        </div>}>
        <DataTable rows={devs} cols={[
          { head: "", width: 44, cell: (d) => <Check on={!off.includes(d.id)} onChange={(v) => setOff((o) => v ? o.filter((i) => i !== d.id) : [...o, d.id])} /> },
          { head: "Device", cell: (d) => <b>{d.make} {d.model}</b> },
          { head: "Serial", cell: (d) => d.serial },
          { head: "Work needed", cell: (d) => d.work.length ? <span className="row gap8">{d.work.map((w) => <span key={w} className="tag">{w}</span>)}</span> : <span className="muted">None</span> },
          { head: "Resale value", className: "right", cell: (d) => usd(d.price ?? 0) },
          { head: "Your share", className: "right", cell: (d) => <b>{usd(share(d.price ?? 0, p.sharePct))}</b> },
        ]} />
        {off.length > 0 && <span className="tiny muted">{off.length} unticked. They go back to FGT and we will let them know.</span>}
      </Card>
      {tiles}
      {ask && (
        <Modal title="Ask to change" onClose={() => setAsk(false)}>
          <Field label="Message to FGT" textarea value={text} onChange={setText} error={err} placeholder="For example: can we move it to Nov 12?" />
          <div className="row gap8"><Btn onClick={send}>Send</Btn><Btn variant="soft" onClick={() => setAsk(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
