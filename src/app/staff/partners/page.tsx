"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, DataTable, KV, PageHead, Status } from "@/components/ui";
import { shipDevices, shipProgress, shipShare, shipValue, partnerStats } from "@/components/staff-b/parts";
import { usd } from "@/lib/helpers";

export default function PartnersPage() {
  const { state } = useApp();
  const router = useRouter();
  const [sel, setSel] = useState<string>(state.partners[0]?.id ?? "");
  const p = state.partners.find((x) => x.id === sel) ?? state.partners[0];
  const batches = p ? state.shipments.filter((s) => s.partnerId === p.id) : [];
  const st = p ? partnerStats(state, p) : null;
  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="Partners" sub="Refurbishers who fix devices for a share of the resale price." actions={<Btn href="/staff/partners/new">Add a partner</Btn>} />
      <DataTable
        rows={state.partners}
        onRow={(r) => setSel(r.id)}
        rowClass={(r) => (r.id === p?.id ? "sel" : "")}
        cols={[
          { head: "Partner", cell: (r) => <div><b>{r.name}</b><div className="tiny muted">{r.contact}</div></div> },
          { head: "Share", cell: (r) => <b style={{ fontFamily: "var(--f-display)", fontSize: 34, color: "var(--brand)" }}>{r.sharePct}%</b> },
          { head: "What they do", cell: (r) => <span className="row gap8 wrap">{r.work.map((w) => <span key={w} className="tag">{w}</span>)}</span> },
          { head: "Devices out now", cell: (r) => partnerStats(state, r).out },
          { head: "Queued", cell: (r) => partnerStats(state, r).queued },
          { head: "Earned to date", cell: (r) => usd(partnerStats(state, r).earned) },
          { head: "Status", cell: (r) => <Status s={r.status} /> },
        ]}
      />
      {p && st && (
        <div className="row start gap24 stagger" style={{ flexWrap: "wrap" }}>
          <Card title={`${p.name} · deal terms`} style={{ width: 400, maxWidth: "100%" }} lift right={<Link href={`/staff/partners/${p.id}`} className="link">Edit deal</Link>}>
            <KV rows={[
              ["Share of resale price", `${p.sharePct}%`], ["Turnaround", p.turnaround], ["Smallest batch", `${p.minBatch} devices`], ["Area", p.area],
              ["Quality fail rate", st.tested ? `${st.fails} of ${st.tested} (${Math.round((st.fails / st.tested) * 100)}%)` : "No QC results yet"],
              ["Notes", p.notes || "None"],
            ]} />
          </Card>
          <div className="col grow" style={{ minWidth: 380 }}>
            <h3 style={{ fontSize: 26 }}>Batches with {p.name}</h3>
            <DataTable
              rows={batches}
              empty="No batches yet."
              onRow={(b) => router.push(`/staff/shipments/${b.id}`)}
              cols={[
                { head: "Batch", cell: (b) => <b>{b.name}</b> },
                { head: "Devices", cell: (b) => shipDevices(state, b).length },
                { head: "Resale value", cell: (b) => usd(shipValue(state, b)) },
                { head: "Partner share", cell: (b) => usd(shipShare(state, b)) },
                { head: "Done", cell: (b) => `${shipProgress(state, b)}%` },
                { head: "Status", cell: (b) => <Status s={b.status} /> },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
