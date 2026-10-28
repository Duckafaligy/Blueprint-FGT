"use client";
import { useApp } from "@/lib/store";
import { Btn, Card, Kpi, PageHead, Progress, Status } from "@/components/ui";
import { STATUS_COLOR, devicesOfLot, partnerOf, usd0, NOW } from "@/lib/helpers";
import { DEMO_DAY } from "@/lib/seed";

const STATUSES = ["Booked", "Received", "Wiped", "At partner", "Refurbishing", "Done", "Ready for QC", "Ready to sell", "Sold", "Recycled"] as const;

export default function Page() {
  const { state, update, toast } = useApp();
  const pickups = state.lots.filter((l) => l.status === "Picked up");
  const toCheck = state.devices.filter((d) => d.status === "Booked" && pickups.some((l) => l.id === d.lotId)).length;
  const planned = state.shipments.filter((s) => s.status === "Planned");
  const queued = state.devices.filter((d) => planned.some((s) => s.id === d.shipmentId)).length;
  const qc = state.devices.filter((d) => d.status === "Ready for QC").length;
  const counts = STATUSES.map((s) => state.devices.filter((d) => d.status === s).length);
  const max = Math.max(1, ...counts);

  const tell = () => {
    const todo = planned.filter((s) => !s.notified);
    if (!planned.length) return toast("No planned shipments to tell partners about", "warn");
    update((d) => {
      d.shipments.filter((s) => s.status === "Planned").forEach((s) => {
        if (!s.notified) s.messages.push({ from: "FGT", text: `We are adding ${s.deviceIds.length} devices to your next shipment, planned for ${s.shipDate}. Open Incoming to see them.`, at: NOW });
        s.notified = true;
      });
    });
    toast(todo.length ? `Told ${todo.length} partner${todo.length > 1 ? "s" : ""} about planned shipments` : "Every partner already knows");
  };

  return (
    <>
      <PageHead title="Operations" sub={`${DEMO_DAY}. What needs doing today.`} actions={<Btn href="/staff/intake" variant="outline">Start intake</Btn>} />
      <div className="row gap12 stagger" style={{ alignItems: "stretch" }}>
        <Kpi label="Pickups today" value={pickups.length} sub="Picked up, waiting for intake" />
        <Kpi label="Devices to check in" value={toCheck} sub="Still on the truck list" color="var(--warn)" />
        <Kpi label="Queued to ship" value={queued} sub="In planned shipments" />
        <Kpi label="QC queue" value={qc} sub="Back from refurbishing" color="var(--brand)" />
      </div>
      <div className="row start gap24 stagger">
        <Card title="Devices by status" style={{ flex: 1.2 }}>
          <div className="col gap12">
            {STATUSES.map((s, i) => (
              <div key={s} className="row gap12">
                <span style={{ width: 120, fontWeight: 600 }}>{s}</span>
                <div className="grow"><Progress pct={(counts[i] / max) * 100} color={STATUS_COLOR[s]} /></div>
                <b style={{ width: 36, textAlign: "right" }}>{counts[i]}</b>
              </div>
            ))}
          </div>
        </Card>
        <div className="col gap24 grow">
          <Card title="Today's pickups">
            {pickups.length === 0 && <span className="muted">No pickups waiting for intake.</span>}
            {pickups.map((l) => {
              const got = devicesOfLot(state, l.id).filter((d) => d.status !== "Booked").length;
              return (
                <div key={l.id} className="row between">
                  <div><b>{l.company}</b> <span className="mono muted">{l.id}</span><div className="small muted">{l.window} · {got} of {l.count} checked in</div></div>
                  <Btn href={`/staff/intake/${l.id}`} size="sm">Start intake</Btn>
                </div>
              );
            })}
          </Card>
          <Card title="Next shipments" right={<div className="row gap8"><Btn size="sm" variant="outline" href="/staff/shipments/plan">Plan a shipment</Btn><Btn size="sm" onClick={tell}>Tell partners</Btn></div>}>
            {planned.length === 0 && <span className="muted">Nothing planned.</span>}
            {planned.map((s) => {
              const value = state.devices.filter((d) => d.shipmentId === s.id).reduce((a, d) => a + (d.price ?? 0), 0);
              return (
                <div key={s.id} className="row between">
                  <div><b>{partnerOf(state, s.partnerId)?.name}</b><div className="small muted">{s.name} · {s.deviceIds.length} devices · {s.shipDate} · {usd0(value)}</div></div>
                  <Status s={s.notified ? "Sent" : "Planned"} label={s.notified ? "Partner told" : "Not told yet"} />
                </div>
              );
            })}
          </Card>
          <Card title="QC queue" right={<Btn size="sm" href="/staff/qc">Open QC queue</Btn>}>
            <span className="small">{qc} device{qc === 1 ? "" : "s"} waiting for a quality check.</span>
          </Card>
        </div>
      </div>
    </>
  );
}
