"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, Check, DataTable, Field, KV, Modal, PageHead } from "@/components/ui";
import { fmtDate } from "@/components/staff-b/parts";
import { NOW, share, uid, usd, addHistory } from "@/lib/helpers";

export default function PlanShipment() {
  const { state, update, toast } = useApp();
  const router = useRouter();
  const [partnerId, setPartnerId] = useState(state.partners[0]?.id ?? "");
  const [date, setDate] = useState("2026-11-10");
  const [picked, setPicked] = useState<string[]>([]);
  const [tell, setTell] = useState(true);
  const [custom, setCustom] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);

  const partner = state.partners.find((p) => p.id === partnerId);
  const pct = partner?.sharePct ?? 0;
  const eligible = state.devices.filter((d) => d.status === "Wiped" && d.path === "partner" && !d.shipmentId);
  const chosen = eligible.filter((d) => picked.includes(d.id));
  const value = chosen.reduce((a, d) => a + (d.price ?? 0), 0);
  const earns = chosen.reduce((a, d) => a + share(d.price ?? 0, pct), 0);
  const dateLabel = date ? fmtDate(date) : "the ship date";
  const message = custom ?? `Hi ${partner?.contact.split(" ")[0] ?? "there"}, we are adding ${chosen.length} devices to your next shipment, planned for ${dateLabel}. Open Incoming to see them.`;
  const allOn = eligible.length > 0 && picked.length === eligible.length;

  const toggle = (id: string) => setPicked((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!partner) e.partner = "Pick a partner";
    if (!date) e.date = "Pick a ship date";
    if (!chosen.length) e.devices = "Pick at least one device";
    if (tell && !message.trim()) e.msg = "Write a message or turn the toggle off";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const doSave = () => {
    if (!partner) return;
    const id = uid("pl");
    const name = `Plan ${String(state.shipments.length + 1).padStart(2, "0")}`;
    const ids = chosen.map((d) => d.id);
    update((d) => {
      d.shipments.push({ id, name, partnerId: partner.id, deviceIds: ids, status: "Planned", shipDate: fmtDate(date), notified: tell, accepted: false, messages: tell ? [{ from: "FGT", text: message.trim(), at: NOW }] : [] });
      d.devices.forEach((dv) => { if (ids.includes(dv.id)) { dv.partnerId = partner.id; dv.shipmentId = id; addHistory(dv, `Planned for ${name}`, `${partner.name}, ship ${fmtDate(date)}`); } });
    });
    toast(tell ? `${name} saved and ${partner.name} told` : `${name} saved`);
    router.push("/staff/shipments");
  };

  const save = () => {
    if (!validate()) return;
    if (partner && chosen.length < partner.minBatch) setConfirm(true); else doSave();
  };

  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="Plan a shipment" sub="Pick a partner and the wiped devices that go to them." />
      <div className="row start gap24" style={{ flexWrap: "wrap" }}>
        <div className="col grow gap24" style={{ minWidth: 520 }}>
          <Card>
            <div className="row start">
              <div className="field">
                <label htmlFor="pp">Partner</label>
                <select id="pp" className="input" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                  {state.partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sharePct}%)</option>)}
                </select>
                {partner && <span className="help">Share {partner.sharePct}% · smallest batch {partner.minBatch} · {partner.turnaround}</span>}
              </div>
              <Field label="Ship date" type="date" value={date} onChange={setDate} error={err.date} />
            </div>
          </Card>
          <div className="col">
            <div className="row between"><h3 style={{ fontSize: 26 }}>Wiped devices for a partner</h3><Check on={allOn} onChange={(v) => setPicked(v ? eligible.map((d) => d.id) : [])} label="Select all" /></div>
            <DataTable
              rows={eligible}
              empty="No wiped devices are waiting for a partner."
              onRow={(d) => toggle(d.id)}
              rowClass={(d) => (picked.includes(d.id) ? "sel" : "")}
              cols={[
                { head: "", width: 44, cell: (d) => <Check on={picked.includes(d.id)} onChange={() => toggle(d.id)} /> },
                { head: "Device", cell: (d) => <div><b>{d.make} {d.model}</b><div className="tiny muted mono">{d.serial}</div></div> },
                { head: "Lot", cell: (d) => d.lotId },
                { head: "Work", cell: (d) => d.work.join(", ") || "None" },
                { head: "Resale value", cell: (d) => usd(d.price ?? 0) },
                { head: "Partner share", cell: (d) => usd(share(d.price ?? 0, pct)) },
              ]}
            />
            {err.devices && <span className="err-text">{err.devices}</span>}
          </div>
        </div>
        <div className="col" style={{ width: 380, maxWidth: "100%" }}>
          <Card title="Totals">
            <KV rows={[["Devices", <b key="a">{chosen.length}</b>], ["Resale value", usd(value)], ["Partner earns", <span key="e" style={{ color: "var(--ok)" }}>{usd(earns)}</span>], ["FGT keeps", usd(value - earns)]]} />
          </Card>
          <Card>
            <div className="row between"><b>Tell the partner</b><button className={`toggle ${tell ? "on" : ""}`} role="switch" aria-checked={tell} aria-label="Tell the partner" onClick={() => setTell((v) => !v)} /></div>
            {tell && <Field label="Message" textarea value={message} onChange={setCustom} error={err.msg} />}
            <Btn onClick={save}>{tell ? "Save and tell partner" : "Save shipment"}</Btn>
            <Btn variant="soft" href="/staff/shipments">Cancel</Btn>
          </Card>
        </div>
      </div>
      {confirm && partner && (
        <Modal title="Smaller than their smallest batch" onClose={() => setConfirm(false)}>
          <p>{partner.name} asks for at least {partner.minBatch} devices. You picked {chosen.length}. Plan it anyway?</p>
          <div className="row"><Btn onClick={() => { setConfirm(false); doSave(); }}>Plan it anyway</Btn><Btn variant="soft" onClick={() => setConfirm(false)}>Go back</Btn></div>
        </Modal>
      )}
    </div>
  );
}
