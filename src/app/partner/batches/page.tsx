"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { DataTable, Kpi, PageHead, Progress, Status } from "@/components/ui";
import { share, STATUS_COLOR, usd } from "@/lib/helpers";
import { doneCount, mine, myShare, pct, shipDevices, value } from "@/components/partner/util";

const COLS = ["Ready for pickup", "Shipped", "Refurbishing", "Done", "Returned"] as const;
const TITLE: Record<string, string> = { "Ready for pickup": "Ready for pickup", Shipped: "Shipped to you", Refurbishing: "Refurbishing", Done: "Done", Returned: "Returned and checked" };

function Board() {
  const { state } = useApp();
  const router = useRouter();
  const q = (useSearchParams().get("q") ?? "").trim().toLowerCase();
  const rows = mine(state).filter((x) => x.status !== "Planned").map((x) => ({ x, ds: shipDevices(state, x) }));
  const shown = rows.filter(({ x, ds }) => !q || x.name.toLowerCase().includes(q) || ds.some((d) => d.serial.toLowerCase().includes(q)));
  const hits = q ? rows.flatMap(({ x, ds }) => ds.filter((d) => d.serial.toLowerCase().includes(q)).map((d) => ({ d, x }))) : [];
  const allDs = rows.flatMap((r) => r.ds);

  return (
    <div className="page">
      <PageHead title="Batches" sub={q ? `Showing results for "${q}"` : "Every shipment FGT has sent you, by stage."} />
      <div className="row gap12 stagger" style={{ alignItems: "stretch" }}>
        <Kpi label="Active batches" value={rows.filter((r) => r.x.status !== "Returned").length} />
        <Kpi label="Laptops with you" value={allDs.filter((d) => ["At partner", "Refurbishing", "Done"].includes(d.status)).length} />
        <Kpi label="Total resale value" value={value(allDs)} prefix="$" decimals={2} />
        <Kpi label="Your share" value={myShare(state, allDs)} prefix="$" decimals={2} color="var(--ok)" sub={`${pct(state)}% of resale`} />
      </div>
      {hits.length > 0 && (
        <DataTable rows={hits} onRow={({ x }) => router.push(`/partner/batches/${x.id}`)} cols={[
          { head: "Serial", cell: ({ d }) => <b>{d.serial}</b> },
          { head: "Device", cell: ({ d }) => `${d.make} ${d.model}` },
          { head: "Batch", cell: ({ x }) => x.name },
          { head: "Status", cell: ({ d }) => <Status s={d.status} /> },
        ]} />
      )}
      {q && shown.length === 0 && <p className="muted">No batches or serials match &quot;{q}&quot;.</p>}
      <div className="board stagger">
        {COLS.map((c) => {
          const items = shown.filter((r) => r.x.status === c);
          return (
            <div key={c} className="board-col">
              <h4>{TITLE[c]} <span className="tag">{items.length}</span></h4>
              {items.length === 0 && <span className="tiny muted" style={{ padding: 6 }}>Nothing here</span>}
              {items.map(({ x, ds }) => {
                const p = ds.length ? Math.round((doneCount(ds) / ds.length) * 100) : 0;
                const foot = c === "Ready for pickup" ? `Pickup ${x.shipDate}` : c === "Shipped" || c === "Refurbishing" ? `Due ${x.dueDate ?? "soon"}` : c === "Done" ? "Waiting for FGT to receive it" : "Checked by FGT";
                return (
                  <button key={x.id} className="bcard" style={{ ["--c" as string]: STATUS_COLOR[c] }} onClick={() => router.push(`/partner/batches/${x.id}`)}>
                    <h5>{x.name}</h5>
                    <span className="tiny muted">{ds.length} laptops</span>
                    <Progress pct={p} color={STATUS_COLOR[c]} />
                    <span className="tiny">{p}% done</span>
                    <span className="tiny muted">{foot}</span>
                    <div className="row between"><b>{usd(value(ds))}</b><span className="tiny" style={{ color: "var(--ok)", fontWeight: 700 }}>You {usd(share(value(ds), pct(state)))}</span></div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <h3 style={{ fontSize: 26 }}>Value by batch</h3>
      <DataTable rows={shown} onRow={({ x }) => router.push(`/partner/batches/${x.id}`)} cols={[
        { head: "Batch", cell: ({ x }) => <b>{x.name}</b> },
        { head: "Status", cell: ({ x }) => <Status s={x.status} /> },
        { head: "Laptops", cell: ({ ds }) => ds.length },
        { head: "Resale value", className: "right", cell: ({ ds }) => usd(value(ds)) },
        { head: "Your share", className: "right", cell: ({ ds }) => <b>{usd(myShare(state, ds))}</b> },
      ]} />
    </div>
  );
}

export default function Page() { return <Suspense fallback={null}><Board /></Suspense>; }
