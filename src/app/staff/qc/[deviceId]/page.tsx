"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, Check, Field, KV, PageHead, Progress, Seg } from "@/components/ui";
import { addHistory, NOW, partnerOf, share, usd } from "@/lib/helpers";
import type { Grade } from "@/lib/types";

const CHECKS = ["Powers on and boots", "Battery holds a charge", "Screen", "Keyboard and touchpad", "Ports", "Wi-Fi", "Webcam and audio", "Storage health", "Wipe verified", "OS installed and updated"];
const GRADES = ["A", "B", "C"] as const;

export default function Page() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { state, update, toast } = useApp();
  const router = useRouter();
  const [ticks, setTicks] = useState<boolean[]>(Array(10).fill(false));
  const [note, setNote] = useState("");
  const [grade, setGrade] = useState<Grade>("A");
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    if (!passed) return;
    const t = setTimeout(() => router.push("/staff/qc"), 1300);
    return () => clearTimeout(t);
  }, [passed, router]);

  const d = state.devices.find((x) => x.id === deviceId);
  if (!d) return <PageHead title="Device not found" actions={<Btn href="/staff/qc">Back to the queue</Btn>} />;
  const partner = partnerOf(state, d.partnerId);
  const n = ticks.filter(Boolean).length;
  const allOk = n === 10;
  const canFail = n < 10 && note.trim().length > 0;
  const price = d.price ?? 0;
  const earn = partner ? share(price, partner.sharePct) : 0;
  const inQueue = d.status === "Ready for QC";

  const pass = () => {
    update((s) => {
      const x = s.devices.find((y) => y.id === deviceId);
      if (!x) return;
      x.status = "Ready to sell"; x.grade = grade; x.priceApproved = false;
      x.qc = { result: "Pass", grade, note: note.trim() || undefined, by: "Sam", at: NOW, ticks };
      addHistory(x, "QC passed", `Grade ${grade} · 10 of 10 checks`);
      const sam = s.people.find((p) => p.name.startsWith("Sam"));
      if (sam) sam.checks += 10;
    });
    toast(`${d.serial} passed QC as grade ${grade}`);
    setPassed(true);
  };
  const fail = () => {
    update((s) => {
      const x = s.devices.find((y) => y.id === deviceId);
      if (!x) return;
      const back = !!x.partnerId;
      x.status = back ? "At partner" : "Wiped";
      x.qc = { result: "Fail", note: note.trim(), by: "Sam", at: NOW, ticks };
      addHistory(x, back ? "Failed QC, back to partner at no cost" : "Failed QC, back to in-house prep", note.trim());
    });
    toast(partner ? `${d.serial} failed QC and goes back to ${partner.name} at no cost` : `${d.serial} failed QC and goes back to in-house prep`, "warn");
    router.push("/staff/qc");
  };

  return (
    <>
      <PageHead title={`QC · ${d.make} ${d.model}`} sub={`${d.serial} · ${partner ? partner.name : "In-house"} · ${d.lotId}`} actions={<Btn variant="soft" href="/staff/qc">Back to the queue</Btn>} />
      {!inQueue && !passed ? <Card><span>This device is not in the QC queue. Its status is {d.status}.</span></Card> : (
        <div className="row start gap24">
          <div className="col grow">
            <div className="row between"><b style={{ fontFamily: "var(--f-display)", fontSize: 34 }}>{n} of 10 checks</b><div style={{ width: 240 }}><Progress pct={n * 10} color="var(--ok)" /></div></div>
            <div className="col gap8 stagger">
              {CHECKS.map((c, i) => (
                <div key={c} className="card" style={{ padding: "10px 20px", flexDirection: "row", alignItems: "center", borderColor: ticks[i] ? "var(--ok)" : undefined }}>
                  <Check on={ticks[i]} ok onChange={(v) => setTicks(ticks.map((t, j) => (j === i ? v : t)))} label={<span style={{ fontSize: 19, fontWeight: 600 }}>{c}</span>} />
                </div>
              ))}
            </div>
            <Field label={n < 10 ? "Note (required, something is not ticked)" : "Note (optional)"} textarea value={note} onChange={setNote} placeholder="What failed or needs another look" />
          </div>
          <div className="col" style={{ width: 360, flexShrink: 0 }}>
            <Card title="Grade">
              <Seg items={GRADES} value={grade} onChange={setGrade} />
            </Card>
            <Card title="If it passes">
              <KV rows={[["FGT resale price", usd(price)], ["Partner", partner ? `${partner.name} · ${partner.sharePct}%` : "In-house"], ["Partner earns", partner ? usd(earn) : "None"], ["FGT keeps", usd(price - earn)]]} />
              <span className="small muted">Price is approved on Ready to sell.</span>
            </Card>
            {passed ? <div className="center"><span className="stamp" style={{ fontSize: 40 }}>QC pass</span></div> : (
              <>
                <Btn variant="ok" size="lg" disabled={!allOk} onClick={pass}>Pass</Btn>
                <Btn variant="bad" size="lg" disabled={!canFail} onClick={fail}>Fail and send back</Btn>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
