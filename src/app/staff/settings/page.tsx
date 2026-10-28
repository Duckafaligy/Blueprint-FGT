"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Btn, Card, DataTable, Field, Modal, PageHead, SelectField, Status } from "@/components/ui";
import { ShareSlider, clamp } from "@/components/staff-b/parts";
import type { Settings } from "@/lib/types";

type Rule = Settings["rules"][number];
const RESULTS: Rule["result"][] = ["Bring it in", "Recycle", "Book a pickup"];
const RES_COLOR: Record<string, string> = { "Bring it in": "var(--ok)", Recycle: "var(--muted)", "Book a pickup": "var(--brand)" };

export default function SettingsPage() {
  const { state, update, toast, hydrated } = useApp();
  const router = useRouter();
  const s = state.settings;
  const mk = (x: Settings) => ({ pickupFee: String(x.pickupFee), minLot: String(x.minLot), ageCutoff: String(x.ageCutoff), kgPerDevice: String(x.kgPerDevice), shareMin: String(x.shareMin), shareMax: String(x.shareMax), qcChecks: String(x.qcChecks) });
  const [f, setF] = useState(mk(s));
  const [rules, setRules] = useState<Rule[]>(s.rules);
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => { setF(mk(state.settings)); setRules(state.settings.rules); }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof f) => (v: string) => setF((o) => ({ ...o, [k]: v }));

  const [rule, setRule] = useState<{ i: number; r: Rule } | null>(null);
  const [ruleErr, setRuleErr] = useState("");
  const [deal, setDeal] = useState<{ id: string; pct: number } | null>(null);
  const dealP = state.partners.find((p) => p.id === deal?.id);

  const saveRule = () => {
    if (!rule) return;
    if (!rule.r.item.trim() || !rule.r.condition.trim()) return setRuleErr("Fill in the item and the condition");
    setRules((o) => (rule.i < 0 ? [...o, rule.r] : o.map((x, i) => (i === rule.i ? rule.r : x))));
    setRule(null);
    toast("Rule changed. Press Save settings to keep it");
  };
  const saveDeal = () => {
    if (!deal) return;
    update((d) => { const p = d.partners.find((x) => x.id === deal.id); if (p) p.sharePct = clamp(deal.pct, d.settings.shareMin, d.settings.shareMax); });
    toast(`Saved the deal with ${dealP?.name}`);
    setDeal(null);
  };

  const save = () => {
    const e: Record<string, string> = {};
    const num = (k: keyof typeof f, lo: number, hi: number, msg: string) => { const v = Number(f[k]); if (f[k].trim() === "" || !isFinite(v) || v < lo || v > hi) e[k] = msg; };
    num("pickupFee", 0, 10000, "Enter 0 or more");
    num("minLot", 1, 1000, "Enter 1 or more");
    num("ageCutoff", 1, 50, "Enter 1 to 50 years");
    num("kgPerDevice", 0.1, 100, "Enter a weight above 0");
    num("shareMin", 5, 90, "Between 5 and 90");
    num("shareMax", 5, 90, "Between 5 and 90");
    num("qcChecks", 1, 500, "Enter 1 or more");
    if (!e.shareMin && !e.shareMax && Number(f.shareMin) >= Number(f.shareMax)) e.shareMin = "Lowest must be less than highest";
    setErr(e);
    if (Object.keys(e).length) return toast("Fix the highlighted fields", "bad");
    update((d) => {
      d.settings = { ...d.settings, pickupFee: Number(f.pickupFee), minLot: Number(f.minLot), ageCutoff: Number(f.ageCutoff), kgPerDevice: Number(f.kgPerDevice), shareMin: Number(f.shareMin), shareMax: Number(f.shareMax), qcChecks: Number(f.qcChecks), rules };
    });
    toast("Settings saved");
  };

  return (
    <div className="page" style={{ padding: 0 }}>
      <PageHead title="Settings" sub="Rules and numbers that the other screens use." actions={<Btn onClick={save}>Save settings</Btn>} />
      <Card title="Donate Checker rules" right={<Btn size="sm" variant="outline" onClick={() => { setRuleErr(""); setRule({ i: -1, r: { item: "", condition: "", result: "Bring it in" } }); }}>Add rule</Btn>}>
        <DataTable
          rows={rules}
          cols={[
            { head: "Item", cell: (r) => <b>{r.item}</b> },
            { head: "Condition", cell: (r) => r.condition },
            { head: "Result", cell: (r) => <span className="chip" style={{ ["--c" as string]: RES_COLOR[r.result] }}><i />{r.result}</span> },
            { head: "", width: 90, cell: (r) => <button className="link" onClick={() => { setRuleErr(""); setRule({ i: rules.indexOf(r), r: { ...r } }); }}>Edit</button> },
          ]}
        />
      </Card>
      <Card title="Partner deals" right={<Btn size="sm" variant="outline" href="/staff/partners/new">Add a partner</Btn>}>
        <DataTable
          rows={state.partners}
          cols={[
            { head: "Partner", cell: (p) => <b>{p.name}</b> },
            { head: "Status", cell: (p) => <Status s={p.status} /> },
            { head: "Share", cell: (p) => <b style={{ fontFamily: "var(--f-display)", fontSize: 28, color: "var(--brand)" }}>{p.sharePct}%</b> },
            { head: "", width: 130, cell: (p) => <button className="link" onClick={() => setDeal({ id: p.id, pct: p.sharePct })}>Edit deal</button> },
          ]}
        />
      </Card>
      <div className="row start gap24" style={{ flexWrap: "wrap" }}>
        <Card title="Shop and pickups" style={{ flex: 1, minWidth: 420 }}>
          <div className="row start"><Field label="Pickup fee ($)" type="number" value={f.pickupFee} onChange={set("pickupFee")} error={err.pickupFee} /><Field label="Minimum lot (devices)" type="number" value={f.minLot} onChange={set("minLot")} error={err.minLot} /></div>
          <div className="row start"><Field label="Device age cutoff (years)" type="number" value={f.ageCutoff} onChange={set("ageCutoff")} error={err.ageCutoff} /><Field label="Kg per device" type="number" value={f.kgPerDevice} onChange={set("kgPerDevice")} error={err.kgPerDevice} /></div>
        </Card>
        <Card title="Partner share limits" style={{ flex: 1, minWidth: 420 }}>
          <div className="row start"><Field label="Lowest (%)" type="number" value={f.shareMin} onChange={set("shareMin")} error={err.shareMin} help="Between 5 and 90" /><Field label="Highest (%)" type="number" value={f.shareMax} onChange={set("shareMax")} error={err.shareMax} help="Between 5 and 90" /></div>
        </Card>
        <Card title="QC internship" style={{ flex: 1, minWidth: 420 }}>
          <Field label="Verified checks for the certificate" type="number" value={f.qcChecks} onChange={set("qcChecks")} error={err.qcChecks} />
        </Card>
      </div>
      <div className="row"><Btn onClick={save}>Save settings</Btn><Btn variant="soft" onClick={() => router.push("/staff")}>Back to home</Btn></div>

      {rule && (
        <Modal title={rule.i < 0 ? "Add a rule" : "Edit rule"} onClose={() => setRule(null)}>
          <Field label="Item" value={rule.r.item} onChange={(v) => setRule({ ...rule, r: { ...rule.r, item: v } })} />
          <Field label="Condition" value={rule.r.condition} onChange={(v) => setRule({ ...rule, r: { ...rule.r, condition: v } })} error={ruleErr} />
          <SelectField label="Result" value={rule.r.result} options={RESULTS} onChange={(v) => setRule({ ...rule, r: { ...rule.r, result: v as Rule["result"] } })} />
          <div className="row"><Btn onClick={saveRule}>{rule.i < 0 ? "Add rule" : "Save rule"}</Btn><Btn variant="soft" onClick={() => setRule(null)}>Cancel</Btn></div>
        </Modal>
      )}
      {deal && dealP && (
        <Modal title={`Deal with ${dealP.name}`} onClose={() => setDeal(null)}>
          <ShareSlider value={deal.pct} onChange={(n) => setDeal({ ...deal, pct: n })} min={s.shareMin} max={s.shareMax} />
          <div className="row"><Btn onClick={saveDeal}>Save deal</Btn><Btn variant="soft" onClick={() => setDeal(null)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
