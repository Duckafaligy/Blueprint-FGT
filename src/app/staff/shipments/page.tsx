"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, PageHead, Progress } from "@/components/ui";
import { shipDevices, shipProgress, shipValue } from "@/components/staff-b/parts";
import { STATUS_COLOR, partnerOf, usd0 } from "@/lib/helpers";
import type { ShipmentStatus } from "@/lib/types";

const COLS: ShipmentStatus[] = ["Planned", "Ready for pickup", "Shipped", "Refurbishing", "Done", "Returned"];

export default function ShipmentsPage() {
  const { state } = useApp();
  const router = useRouter();
  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="Shipments" sub="Batches going to and coming back from refurbishing partners." actions={<Btn href="/staff/shipments/plan">Plan a shipment</Btn>} />
      <div className="board stagger">
        {COLS.map((c) => {
          const list = state.shipments.filter((s) => s.status === c);
          const back = c === "Returned" || c === "Done";
          return (
            <div key={c} className="board-col">
              <h4><span>{c}</span><span className="tag">{list.length}</span></h4>
              {list.map((s) => (
                <button key={s.id} className="bcard" style={{ ["--c" as string]: STATUS_COLOR[c] }} onClick={() => router.push(`/staff/shipments/${s.id}`)}>
                  <h5>{s.name}</h5>
                  <span className="small">{partnerOf(state, s.partnerId)?.name}</span>
                  <span className="tiny muted">{shipDevices(state, s).length} devices · {usd0(shipValue(state, s))}</span>
                  <Progress pct={shipProgress(state, s)} />
                  <span className="row between tiny muted">
                    <span>{back ? `Due ${s.dueDate ?? s.shipDate}` : `Ship ${s.shipDate}`}</span>
                    {s.status === "Planned" && (s.notified ? <span className="tag" style={{ color: "var(--ok)" }}>Partner told</span> : <span className="tag" style={{ color: "var(--warn)" }}>Not told yet</span>)}
                  </span>
                </button>
              ))}
              {list.length === 0 && <span className="tiny muted center" style={{ padding: 12 }}>Nothing here</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
