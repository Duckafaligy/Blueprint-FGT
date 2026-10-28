"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, KV, Modal, Field, Status } from "@/components/ui";
import { usd } from "@/lib/helpers";
import { Crumbs, useInquiry } from "@/components/business/kit";

export default function QuotePage() {
  const { update, toast, hydrated } = useApp();
  const router = useRouter();
  const inq = useInquiry();
  const [ask, setAsk] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const id = inq?.id;
  const st = inq?.status;

  useEffect(() => {
    if (!hydrated || !id || st !== "Sent") return;
    update((s) => { const i = s.inquiries.find((x) => x.id === id); if (i && i.status === "Sent") i.status = "Quoted"; });
  }, [hydrated, id, st, update]);

  if (!inq) return (
    <div className="page"><Crumbs items={[["Inquiry", "/business/inquiry/1"], ["Quote"]]} /><h1>No quote yet</h1><p className="muted">Send an inquiry and your quote will appear here.</p><div><Btn href="/business/inquiry/1">Start an inquiry</Btn></div></div>
  );
  const pickup = inq.kind !== "bulk";
  const bulk = inq.kind === "bulk" || inq.kind === "both";
  const todo = [
    ...(pickup ? ["Pick up your retired devices from your office at a time you choose", "Wipe every drive to a verified standard and give you a certificate for each device", "Refurbish and reuse what we can, and recycle the rest responsibly", "Send your impact report once every device is done"] : []),
    ...(bulk ? ["Set aside refurbished devices that match your specs and budget (Technology for Social Change)", "Confirm a price and delivery or pick-up date for the bulk order"] : []),
  ];
  const approve = () => {
    update((s) => { const i = s.inquiries.find((x) => x.id === inq.id); if (i) i.status = "Approved"; });
    toast("Quote approved");
    router.push("/business/schedule");
  };
  const send = () => {
    if (!msg.trim()) { setErr("Type your question first."); return; }
    toast("Question sent. FGT will reply by email.");
    setMsg(""); setErr(""); setAsk(false);
  };
  return (
    <div className="page">
      <Crumbs items={[["Inquiry", "/business/inquiry/1"], ["Sent", "/business/inquiry/sent"], ["Quote"]]} />
      <div className="row between"><div className="col gap8"><h1 style={{ fontSize: 56 }}>Your quote</h1><p className="muted">Reference {inq.id} for Maple Street Accounting</p></div><Status s={inq.status} /></div>
      <div className="row start gap24 wrap">
        <div className="col grow gap24 stagger" style={{ minWidth: 340 }}>
          <Card title="What FGT will do"><ul className="col gap8" style={{ margin: 0, paddingLeft: 20 }}>{todo.map((t) => <li key={t}>{t}</li>)}</ul></Card>
          <Card title="What it costs">
            <KV rows={[["Pickup and secure data wipe", usd(inq.quote)], ["Certificates and impact report", "Included"], ["Recycling of devices that cannot be reused", "Included"]]} />
            <div className="row between"><b>Total</b><b style={{ fontFamily: "var(--f-display)", fontSize: 44 }}>{usd(inq.quote)}</b></div>
          </Card>
        </div>
        <div className="col gap12" style={{ width: 340, maxWidth: "100%" }}>
          <Banner color="var(--accent)"><div className="col gap12"><b>Ready to go?</b><p className="small">Approve this quote to pick a pickup window. Nothing is charged today.</p><Btn size="lg" onClick={approve}>Approve and pick a window</Btn><Btn variant="outline" onClick={() => setAsk(true)}>Ask a question</Btn></div></Banner>
        </div>
      </div>
      {ask && (
        <Modal title="Ask a question" onClose={() => setAsk(false)}>
          <Field label="Your question" textarea value={msg} onChange={(v) => { setMsg(v); setErr(""); }} error={err} placeholder="Can you pick up from two floors?" />
          <div className="row between"><Btn variant="soft" onClick={() => setAsk(false)}>Cancel</Btn><Btn onClick={send}>Send</Btn></div>
        </Modal>
      )}
    </div>
  );
}
