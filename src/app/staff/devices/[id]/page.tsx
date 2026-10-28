"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, KV, PageHead, Status } from "@/components/ui";
import { lotOf, partnerOf, share, usd } from "@/lib/helpers";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const d = state.devices.find((x) => x.id === id);
  if (!d) return <PageHead title="Device not found" actions={<Btn href="/staff/devices">Back to devices</Btn>} />;
  const p = partnerOf(state, d.partnerId);
  const lot = lotOf(state, d.lotId);
  const price = d.price ?? 0;
  const earn = p ? share(price, p.sharePct) : 0;
  return (
    <>
      <PageHead title={`${d.make} ${d.model}`} sub={`${d.serial} · ${d.id}`} actions={<><Status s={d.status} /><Btn variant="soft" href="/staff/devices">Back to devices</Btn></>} />
      <div className="row start gap24 stagger">
        <div className="col grow">
          <Card title="Specs">
            <KV rows={[["Type", d.type], ["Make and model", `${d.make} ${d.model}`], ["Serial", <span key="s" className="mono">{d.serial}</span>], ["Pickup", lot ? `${lot.company} · ${d.lotId}` : d.lotId], ["Path", d.path ?? "Not decided"], ...(d.reason ? [["Recycle reason", d.reason] as [string, string]] : []), ["Work needed", d.work.join(", ") || "None"], ["Grade", d.grade ?? "Not graded"], ...(d.note ? [["Partner note", d.note] as [string, string]] : [])]} />
          </Card>
          <Card title="Wipe and QC">
            {d.wipe ? (
              <KV rows={[["Wipe", <Status key="w" s={d.wipe.result} />], ["Method", `${d.wipe.method}, ${d.wipe.passes}`], ["By", `${d.wipe.by}, ${d.wipe.at}`], ["Certificate", d.wipe.cert ? <Link key="c" className="link mono" href={`/business/doc/certificate/${d.id}`}>{d.wipe.cert}</Link> : "None"], ...(d.wipe.destroyed ? [["Drive", "Physically destroyed"] as [string, string]] : [])]} />
            ) : <span className="muted small">Not wiped yet.</span>}
            {d.qc ? (
              <KV rows={[["QC", <Status key="q" s={d.qc.result} />], ["Grade", d.qc.grade ?? "None"], ["Checks passed", `${d.qc.ticks.filter(Boolean).length} of ${d.qc.ticks.length}`], ["By", `${d.qc.by}, ${d.qc.at}`], ...(d.qc.note ? [["Note", d.qc.note] as [string, string]] : [])]} />
            ) : <span className="muted small">No QC record yet.</span>}
          </Card>
        </div>
        <div className="col" style={{ width: 400, flexShrink: 0 }}>
          <Card title="Value">
            <KV rows={[["Resale price", d.price ? usd(price) : "Not priced"], ["Partner", p ? `${p.name} · ${p.sharePct}%` : "In-house"], ["Partner earns", p ? usd(earn) : "None"], ["FGT keeps", usd(price - earn)], ["Price", d.priceApproved ? "Approved" : "Not approved"], ...(d.soldAt ? [["Sold", d.soldAt] as [string, string]] : [])]} />
          </Card>
          <Card title="History">
            {d.history.length === 0 && <span className="muted small">No history yet.</span>}
            <div className="col gap12">
              {[...d.history].reverse().map((h, i) => (
                <div key={i} className="row start gap12">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--brand)", marginTop: 7, flexShrink: 0 }} />
                  <div><b>{h.label}</b>{h.detail && <div className="small">{h.detail}</div>}<div className="tiny muted">{h.at}{h.by ? ` · ${h.by}` : ""}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
