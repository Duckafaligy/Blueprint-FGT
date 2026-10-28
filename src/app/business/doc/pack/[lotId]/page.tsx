"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, DataTable } from "@/components/ui";
import { devicesOfLot } from "@/lib/helpers";
import { Crumbs } from "@/components/business/kit";

export default function PackPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const { state } = useApp();
  const lot = state.lots.find((l) => l.id === lotId);
  if (!lot) return <div className="page"><Crumbs items={[["My donations", "/business/donations"], ["Certificate pack"]]} /><h1>Lot not found</h1><div><Btn href="/business/donations">Back to My donations</Btn></div></div>;
  const wiped = devicesOfLot(state, lot.id).filter((d) => d.wipe);
  return (
    <div className="doc-bg">
      <div className="no-print row between" style={{ width: 794, maxWidth: "100%" }}>
        <Crumbs items={[["My donations", "/business/donations"], [lot.id, `/business/lot/${lot.id}`], ["Certificate pack"]]} />
        <Btn onClick={() => window.print()}>Print</Btn>
      </div>
      <div className="doc">
        <span className="bold">Free Geek Toronto</span>
        <h1>Certificate pack</h1>
        <p>{lot.company} · {lot.id} · {wiped.length} devices wiped</p>
        <DataTable rows={wiped} empty="No devices wiped yet. Certificates appear as each drive is wiped."
          cols={[
            { head: "Certificate", cell: (d) => <Link className="link mono" href={`/business/doc/certificate/${d.id}`}>{d.wipe!.cert ?? "View"}</Link> },
            { head: "Device", cell: (d) => `${d.make} ${d.model}` },
            { head: "Serial", cell: (d) => <span className="mono">{d.serial || "none"}</span> },
            { head: "Result", cell: (d) => (d.wipe!.destroyed ? "Destroyed" : "Wiped") },
            { head: "Date", cell: (d) => d.wipe!.at },
          ]} />
      </div>
    </div>
  );
}
