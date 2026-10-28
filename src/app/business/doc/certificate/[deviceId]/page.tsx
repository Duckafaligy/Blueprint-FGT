"use client";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, KV } from "@/components/ui";
import { Crumbs } from "@/components/business/kit";

export default function CertificatePage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { state } = useApp();
  const dev = state.devices.find((d) => d.id === deviceId);
  const lot = dev && state.lots.find((l) => l.id === dev.lotId);
  const w = dev?.wipe;
  if (!dev || !lot || !w) {
    return <div className="page"><Crumbs items={[["My donations", "/business/donations"], ["Certificate"]]} /><h1>No certificate yet</h1><p className="muted">A certificate appears after the drive is wiped.</p><div><Btn href={lot ? `/business/lot/${lot.id}` : "/business/donations"}>Back</Btn></div></div>;
  }
  const failed = w.result === "Failed" || w.destroyed;
  return (
    <div className="doc-bg">
      <div className="no-print row between" style={{ width: 794, maxWidth: "100%" }}>
        <Crumbs items={[["My donations", "/business/donations"], [lot.id, `/business/lot/${lot.id}`], ["Certificate"]]} />
        <Btn onClick={() => window.print()}>Print or save as PDF</Btn>
      </div>
      <div className="doc">
        <div className="row between"><span className="bold">Free Geek Toronto</span><span className="mono small">{w.cert ?? "No number"}</span></div>
        <h1>Certificate of data destruction</h1>
        <p>Free Geek Toronto certifies that the storage drive in the device below, owned by <b>{lot.company}</b>, was processed as follows.</p>
        <KV rows={[
          ["Company", lot.company], ["Lot", lot.id], ["Device", `${dev.make} ${dev.model} (${dev.type})`], ["Serial number", dev.serial || "Not recorded"],
          ["Method", failed ? "Physical destruction" : w.method], ["Passes", failed ? "Not applicable" : w.passes], ["Result", failed ? "Drive could not be wiped" : "Wiped and verified"],
          ["Date", w.at], ["Performed by", w.by], ["Certificate number", w.cert ?? "Not issued"],
        ]} />
        {failed && <p><b>The drive could not be wiped, so it was physically destroyed.</b> No data can be recovered from it.</p>}
        <p className="small muted">This certificate covers the drive only. The device itself was then reused or recycled.</p>
      </div>
    </div>
  );
}
