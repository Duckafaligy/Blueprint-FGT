"use client";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Kpi } from "@/components/ui";
import { devicesOfLot, lotFinished } from "@/lib/helpers";
import { Crumbs } from "@/components/business/kit";

export default function ImpactPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const { state } = useApp();
  const lot = state.lots.find((l) => l.id === lotId);
  const back = <Btn href={lot ? `/business/lot/${lot.id}` : "/business/donations"} variant="outline">Back to {lot ? lot.id : "My donations"}</Btn>;
  if (!lot) return <div className="page"><Crumbs items={[["My donations", "/business/donations"], ["Impact report"]]} /><h1>Lot not found</h1><div>{back}</div></div>;
  if (!lotFinished(state, lot.id)) {
    return <div className="page"><Crumbs items={[["My donations", "/business/donations"], [lot.id, `/business/lot/${lot.id}`], ["Impact report"]]} /><h1>Impact report is locked</h1><p className="muted">It opens once every device in {lot.id} is ready to sell, reused or recycled.</p><div>{back}</div></div>;
  }
  const ds = devicesOfLot(state, lot.id);
  const reused = ds.filter((d) => d.status === "Ready to sell" || d.status === "Sold").length;
  const recycled = ds.filter((d) => d.status === "Recycled").length;
  const kg = ds.length * state.settings.kgPerDevice;
  return (
    <div className="doc-bg">
      <div className="no-print row between" style={{ width: 794, maxWidth: "100%" }}>
        <Crumbs items={[["My donations", "/business/donations"], [lot.id, `/business/lot/${lot.id}`], ["Impact report"]]} />
        <Btn onClick={() => window.print()}>Print or save as PDF</Btn>
      </div>
      <div className="doc">
        <span className="bold">Free Geek Toronto</span>
        <h1>Impact report</h1>
        <p>{lot.company} · {lot.id} · {lot.window}</p>
        <div className="row gap12 wrap stagger">
          <Kpi label="Received" value={ds.length} />
          <Kpi label="Wiped" value={ds.filter((d) => d.wipe).length} color="var(--ok)" />
          <Kpi label="Reused" value={reused} color="var(--brand)" />
          <Kpi label="Recycled" value={recycled} />
        </div>
        <div className="kpi"><span>Electronics kept out of landfill</span><b style={{ color: "var(--ok)" }}>{kg.toLocaleString("en-CA")} kg</b><small>{ds.length} devices at {state.settings.kgPerDevice} kg each</small></div>
        <p>Thank you, {lot.company}. {reused} of your devices will help someone in the community get online, and every drive was wiped before it left our hands. Your donation also funds Free Geek Toronto&apos;s training and digital access programs.</p>
      </div>
    </div>
  );
}
