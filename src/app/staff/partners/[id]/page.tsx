"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, Field, KV, PageHead, Status } from "@/components/ui";
import { DealSummary, ShareSlider, clamp } from "@/components/staff-b/parts";

export default function PartnerEdit() {
  const { id } = useParams<{ id: string }>();
  const { state, update, toast } = useApp();
  const router = useRouter();
  const p = state.partners.find((x) => x.id === id);
  const { shareMin, shareMax } = state.settings;
  const [pct, setPct] = useState(0);
  const [notes, setNotes] = useState("");
  useEffect(() => { if (p) { setPct(clamp(p.sharePct, shareMin, shareMax)); setNotes(p.notes); } }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return <div className="page" style={{ padding: 0 }}><PageHead title="Partner not found" actions={<Btn href="/staff/partners">Back to partners</Btn>} /></div>;
  const save = () => {
    update((d) => { const x = d.partners.find((q) => q.id === id); if (x) { x.sharePct = clamp(pct, d.settings.shareMin, d.settings.shareMax); x.notes = notes.trim(); } });
    toast(`Saved the deal with ${p.name}`);
    router.push("/staff/partners");
  };
  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title={p.name} sub={`${p.contact} · ${p.email} · ${p.phone}`} actions={<Status s={p.status} />} />
      <div className="row start gap24" style={{ flexWrap: "wrap" }}>
        <Card title="Edit the deal" style={{ flex: 1, minWidth: 460 }}>
          <ShareSlider value={pct} onChange={setPct} min={shareMin} max={shareMax} />
          <Field label="Notes" textarea value={notes} onChange={setNotes} />
          <KV rows={[["Turnaround", p.turnaround], ["Smallest batch", `${p.minBatch} devices`], ["Area", p.area]]} />
          <div className="row"><Btn onClick={save}>Save changes</Btn><Btn variant="soft" href="/staff/partners">Cancel</Btn></div>
        </Card>
        <DealSummary pct={pct} />
      </div>
    </div>
  );
}
