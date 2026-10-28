"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, DataTable, Kpi, Status } from "@/components/ui";
import { csvEscape, devicesOfLot, download, lotFinished } from "@/lib/helpers";
import { Crumbs, MiniProgress, cust, custColor, finished } from "@/components/business/kit";

export default function LotPage() {
  const { id } = useParams<{ id: string }>();
  const { state, toast } = useApp();
  const lot = state.lots.find((l) => l.id === id);
  if (!lot) return <div className="page"><Crumbs items={[["My donations", "/business/donations"], ["Lot"]]} /><h1>Lot not found</h1><div><Btn href="/business/donations">Back to My donations</Btn></div></div>;
  const ds = devicesOfLot(state, lot.id);
  const wiped = ds.filter((d) => d.wipe);
  const fin = lotFinished(state, lot.id);
  const n = (f: (s: string) => boolean) => ds.filter((d) => f(d.status)).length;
  const pack = () => {
    download(`certificates-${lot.id}.csv`, ["certificate,type,make,model,serial,method,result,date", ...wiped.map((d) => [d.wipe!.cert ?? "", d.type, d.make, d.model, d.serial, d.wipe!.method, d.wipe!.result, d.wipe!.at].map(csvEscape).join(","))].join("\n"));
    toast("Certificate pack downloaded");
  };
  return (
    <div className="page">
      <Crumbs items={[["My donations", "/business/donations"], [lot.id]]} />
      <div className="page-head"><div><h1>{lot.id}</h1><p>{lot.window} · {lot.address}</p></div>
        <div className="row gap8 wrap"><Btn variant="outline" disabled={!wiped.length} onClick={pack}>Download certificate pack</Btn><Btn variant="outline" href={`/business/doc/pack/${lot.id}`}>View pack</Btn>
          <Btn variant="accent" href={fin ? `/business/doc/impact/${lot.id}` : undefined} disabled={!fin} title={fin ? undefined : "Opens when every device is finished"}>Impact report</Btn></div></div>
      {!fin && <p className="small muted">The impact report opens once every device is ready to sell, reused or recycled.</p>}
      <div className="row gap12 stagger">
        <Kpi label="Devices" value={ds.length} />
        <Kpi label="Received" value={n((s) => s !== "Booked")} />
        <Kpi label="Wiped" value={wiped.length} color="var(--ok)" />
        <Kpi label="Being refurbished" value={n((s) => ["At partner", "Refurbishing", "Done", "Ready for QC"].includes(s))} color="var(--warn)" />
        <Kpi label="Finished" value={ds.filter(finished).length} color="var(--brand)" />
      </div>
      <DataTable rows={ds} empty="No devices in this lot yet."
        cols={[
          { head: "Device", cell: (d) => <div><b>{d.make} {d.model}</b><div className="tiny muted">{d.type}</div></div> },
          { head: "Serial", cell: (d) => <span className="mono">{d.serial || "none"}</span> },
          { head: "Progress", cell: (d) => <MiniProgress st={d.status} /> },
          { head: "Status", cell: (d) => <Status s={custColor(d.status)} label={cust(d.status)} /> },
          { head: "Certificate", cell: (d) => (d.wipe ? <Link className="link" href={`/business/doc/certificate/${d.id}`}>{d.wipe.cert ?? "View"}</Link> : <span className="muted">After wipe</span>) },
        ]} />
    </div>
  );
}
