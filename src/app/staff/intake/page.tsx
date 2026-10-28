"use client";
import { useApp } from "@/lib/store";
import { Btn, DataTable, PageHead, Progress } from "@/components/ui";
import { devicesOfLot } from "@/lib/helpers";
import { canIntake } from "@/components/staff-a/common";
import type { Lot } from "@/lib/types";

export default function Page() {
  const { state } = useApp();
  const lots = state.lots.filter(canIntake);
  const got = (l: Lot) => devicesOfLot(state, l.id).filter((d) => d.status !== "Booked").length;
  return (
    <>
      <PageHead title="Intake" sub="Pick a pickup that has arrived. Scan each device in, then decide where it goes." />
      <DataTable<Lot> rows={lots} empty="Nothing waiting for intake."
        cols={[
          { head: "Booking", cell: (l) => <span className="mono bold">{l.id}</span> },
          { head: "Company", cell: (l) => <b>{l.company}</b> },
          { head: "Window", cell: (l) => l.window },
          { head: "Checked in", width: 240, cell: (l) => <div className="row gap8"><div className="grow"><Progress pct={(got(l) / Math.max(l.count, 1)) * 100} /></div><span className="small">{got(l)} of {l.count}</span></div> },
          { head: "", cell: (l) => <Btn size="sm" href={`/staff/intake/${l.id}`}>Start intake</Btn> },
        ]} />
    </>
  );
}
