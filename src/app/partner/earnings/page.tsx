"use client";
import { useApp } from "@/lib/store";
import { Banner, Card, DataTable, Kpi, PageHead, Status } from "@/components/ui";
import { share, usd } from "@/lib/helpers";
import type { Device } from "@/lib/types";
import { PID, mine, passed, pct, shipDevices } from "@/components/partner/util";

export default function Earnings() {
  const { state } = useApp();
  const pc = pct(state);
  const all = state.devices.filter((d) => d.partnerId === PID);
  const sh = (ds: Device[]) => ds.reduce((a, d) => a + share(d.price ?? 0, pc), 0);
  const paid = all.filter((d) => d.status === "Sold");
  const pending = all.filter((d) => d.status === "Ready to sell");
  const batches = mine(state).filter((x) => x.status !== "Planned").map((x) => ({ x, ds: shipDevices(state, x) }));
  const inprog = batches.filter((b) => b.x.status !== "Returned").flatMap((b) => b.ds.filter((d) => !passed(d)));
  const rows = all.filter(passed);

  return (
    <div className="page">
      <PageHead title="Earnings" sub={`You earn ${pc}% of each laptop's resale price, paid when it sells.`} />
      <div className="row gap12 stagger" style={{ alignItems: "stretch" }}>
        <Kpi label="Paid" value={sh(paid)} prefix="$" decimals={2} color="var(--ok)" sub={`${paid.length} sold`} />
        <Kpi label="Pending sale" value={sh(pending)} prefix="$" decimals={2} color="var(--warn)" sub={`${pending.length} passed QC`} />
        <Kpi label="In progress" value={sh(inprog)} prefix="$" decimals={2} sub="if every device passes" />
        <Kpi label="Your share" raw={`${pc}%`} sub="of resale price" />
      </div>
      <div className="row gap24" style={{ alignItems: "flex-start" }}>
        <div className="col" style={{ flex: 2, minWidth: 0 }}>
          <DataTable rows={rows} empty="Nothing has passed QC yet." cols={[
            { head: "Device", cell: (d) => `${d.make} ${d.model}` },
            { head: "Serial", cell: (d) => d.serial },
            { head: "Resale price", className: "right", cell: (d) => usd(d.price ?? 0) },
            { head: "Share", className: "right", cell: () => `${pc}%` },
            { head: "You earn", className: "right", cell: (d) => <b>{usd(share(d.price ?? 0, pc))}</b> },
            { head: "Status", cell: (d) => <Status s={d.status === "Sold" ? "Paid" : "Pending sale"} /> },
          ]} />
        </div>
        <div className="col stagger" style={{ flex: 1, minWidth: 260 }}>
          <Card title="By batch">
            {batches.map(({ x, ds }) => (
              <div key={x.id} className="row between"><span>{x.name}</span><b>{usd(sh(ds.filter(passed)))}</b></div>
            ))}
          </Card>
          <Banner color="var(--ok)">Devices that fail QC come back to you at no extra cost, so you are never charged for a re-check.</Banner>
        </div>
      </div>
    </div>
  );
}
