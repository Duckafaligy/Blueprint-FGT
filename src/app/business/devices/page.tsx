"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, DataTable, Field, KV, SelectField } from "@/components/ui";
import { csvEscape, download, uid, usd } from "@/lib/helpers";
import { Crumbs, Wizard, useDraft } from "@/components/business/kit";

interface Row { id: string; type: string; make: string; model: string; serial: string; notes: string }
const TYPES = ["laptop", "desktop", "monitor", "phone", "tablet"];
const COLS = ["type", "make", "model", "serial", "notes"];

/** small CSV parser: quotes, commas and line breaks inside quotes */
function parseCsv(text: string): string[][] {
  const out: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); out.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); out.push(row); }
  return out.filter((r) => r.some((x) => x.trim() !== ""));
}

/** one message per bad row, keyed by row id */
function problems(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {}; const seen = new Map<string, number>();
  rows.forEach((r, i) => {
    const t = r.type.trim().toLowerCase();
    if (!t) out[r.id] = `Row ${i + 1}: missing type. Choose one.`;
    else if (!TYPES.includes(t)) out[r.id] = `Row ${i + 1}: unknown type "${r.type}". Use laptop, desktop, monitor, phone or tablet.`;
    const sn = r.serial.trim().toLowerCase();
    if (sn && !out[r.id]) { if (seen.has(sn)) out[r.id] = `Row ${i + 1}: duplicate serial, already used on row ${seen.get(sn)}. Fix the serial.`; }
    if (sn && !seen.has(sn)) seen.set(sn, i + 1);
  });
  return out;
}

const SAMPLE = [
  "type,make,model,serial,notes",
  "laptop,Dell,Latitude 5420,7H2K91Z,Front desk",
  "laptop,Dell,Latitude 5420,4RT8M2Q,",
  "laptop,HP,EliteBook 840 G8,CND1412XY,Partner office",
  ",HP,EliteBook 840 G8,CND1412XZ,Type missing on purpose",
  "laptop,Lenovo,ThinkPad T14,PF2X88Q,",
  "desktop,Dell,OptiPlex 7080,9QW3T1K,Server room",
  "desktop,HP,EliteDesk 800,CND9981,",
  "monitor,Dell,P2419H,B6K1F0P,24 inch",
  "monitor,Dell,P2419H,CND0412,24 inch",
  "laptop,Lenovo,ThinkPad T490,PC1N7EE,Cracked corner",
  "tablet,Apple,iPad 8th gen,3VX9H2L,",
  "phone,Samsung,Galaxy A52,CND7731,Locked",
].join("\n");

export default function DevicesPage() {
  const { state, update, toast } = useApp();
  const router = useRouter();
  const { d } = useDraft();
  const rows = (Array.isArray(d.rows) ? d.rows : []) as Row[];
  const file = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "type">("upload");
  const [fileErr, setFileErr] = useState("");
  const [nr, setNr] = useState({ type: "", make: "", model: "", serial: "", notes: "" });
  const [nerr, setNerr] = useState("");
  const { pickupFee, minLot } = state.settings;
  const bad = problems(rows);
  const nBad = Object.keys(bad).length;
  const ready = nBad === 0 && rows.length >= minLot;
  const setRows = (fn: (r: Row[]) => Row[]) => update((s) => { s.inquiryDraft.rows = fn((Array.isArray(s.inquiryDraft.rows) ? s.inquiryDraft.rows : []) as Row[]); });
  const edit = (id: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const onFile = async (f?: File) => {
    if (!f) return;
    setFileErr("");
    if (!/\.csv$/i.test(f.name)) { setFileErr("That is not a .csv file. Export your list as CSV and try again."); return; }
    const grid = parseCsv(await f.text());
    const head = (grid[0] ?? []).map((h) => h.trim().toLowerCase());
    if (!head.includes("type")) { setFileErr("The first row must be a header with the columns: type, make, model, serial, notes."); return; }
    const at = (r: string[], c: string) => (head.indexOf(c) >= 0 ? (r[head.indexOf(c)] ?? "").trim() : "");
    const parsed = grid.slice(1).map((r) => ({ id: uid("r"), type: at(r, "type"), make: at(r, "make"), model: at(r, "model"), serial: at(r, "serial"), notes: at(r, "notes") }));
    if (!parsed.length) { setFileErr("The file has a header but no devices."); return; }
    setRows(() => parsed.map((r) => ({ ...r, type: TYPES.includes(r.type.toLowerCase()) ? r.type.toLowerCase() : r.type })));
    toast(`${parsed.length} devices read from ${f.name}`);
    if (file.current) file.current.value = "";
  };
  const add = () => {
    if (!nr.type) { setNerr("Choose a type."); return; }
    setNerr("");
    setRows((r) => [...r, { id: uid("r"), ...nr }]);
    setNr({ type: "", make: "", model: "", serial: "", notes: "" });
  };
  const go = () => {
    if (!ready) return false;
    // normalise before the next step reads them
    setRows((r) => r.map((x) => ({ ...x, type: x.type.trim().toLowerCase() })));
    router.push("/business/confirmed");
  };

  return (
    <div className="col" style={{ gap: 0 }}>
      <div style={{ padding: "20px 80px 0" }}><Crumbs items={[["Quote", "/business/quote"], ["Schedule pickup", "/business/schedule"], ["Device list"]]} /></div>
      <Wizard n={2} of={3} back="/business/schedule" onNext={go} nextDisabled={!ready} title="List your devices" sub={`Upload a CSV or type them in. At least ${minLot} devices for a pickup.`}
        nextLabel="Continue">
        <div className="row gap12 wrap">
          <Btn variant={mode === "upload" ? "primary" : "outline"} onClick={() => setMode("upload")}>Upload a CSV</Btn>
          <Btn variant={mode === "type" ? "primary" : "outline"} onClick={() => setMode("type")}>Type devices instead</Btn>
          <Btn variant="ghost" onClick={() => { download("fgt-sample-devices.csv", SAMPLE); toast("Sample file downloaded"); }}>Download sample</Btn>
        </div>

        {mode === "upload" ? (
          <Card>
            <p className="small muted">Columns: {COLS.join(", ")}. Serial is optional. Allowed types: {TYPES.join(", ")}.</p>
            <div className="row gap12 wrap">
              <input ref={file} type="file" accept=".csv,text/csv" aria-label="Choose a CSV file" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            {fileErr && <Banner color="var(--bad)"><b style={{ color: "var(--bad)" }}>{fileErr}</b></Banner>}
          </Card>
        ) : (
          <Card title="Add a device">
            <div className="biz-form-row"><SelectField label="Type" value={nr.type} onChange={(v) => setNr({ ...nr, type: v })} options={["", ...TYPES]} /><Field label="Make" value={nr.make} onChange={(v) => setNr({ ...nr, make: v })} placeholder="Dell" /><Field label="Model" value={nr.model} onChange={(v) => setNr({ ...nr, model: v })} placeholder="Latitude 5420" /></div>
            <div className="biz-form-row"><Field label="Serial (optional)" value={nr.serial} onChange={(v) => setNr({ ...nr, serial: v })} /><Field label="Notes" value={nr.notes} onChange={(v) => setNr({ ...nr, notes: v })} /></div>
            {nerr && <span className="err-text">{nerr}</span>}
            <div><Btn onClick={add}>Add device</Btn></div>
          </Card>
        )}

        {rows.length > 0 && (
          <div className="col gap12">
            <div className="row between wrap">
              <b>{rows.length} devices{nBad ? `, ${nBad} to fix` : ""}</b>
              <Btn variant="ghost" size="sm" onClick={() => setRows(() => [])}>Clear list</Btn>
            </div>
            {nBad > 0 && <Banner color="var(--bad)"><b style={{ color: "var(--bad)" }}>Fix the red rows to continue.</b></Banner>}
            <DataTable
              rows={rows}
              rowClass={(r) => (bad[r.id] ? "bad" : "")}
              cols={[
                { head: "#", cell: (_r, i) => i + 1, width: 40 },
                { head: "Type", cell: (r) => (bad[r.id] && !bad[r.id].includes("duplicate") ? (
                  <select className="input err" value={TYPES.includes(r.type.toLowerCase()) ? r.type.toLowerCase() : ""} aria-label={`Type for row ${rows.indexOf(r) + 1}`} onChange={(e) => edit(r.id, { type: e.target.value })}><option value="">Choose type</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                ) : r.type) },
                { head: "Make", cell: (r) => r.make },
                { head: "Model", cell: (r) => r.model },
                { head: "Serial", cell: (r) => (bad[r.id]?.includes("duplicate") ? <input className="input err" value={r.serial} aria-label="Serial" onChange={(e) => edit(r.id, { serial: e.target.value })} /> : <span className="mono">{r.serial || "none"}</span>) },
                { head: "Notes", cell: (r) => r.notes },
                { head: "Problem", cell: (r) => (bad[r.id] ? <span className="err-text">{bad[r.id]}</span> : <span className="muted">OK</span>) },
                { head: "", cell: (r) => <button className="link" aria-label="Remove row" onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))}>Remove</button>, width: 80 },
              ]}
            />
          </div>
        )}
        {rows.length < minLot && <p className="small muted">{rows.length} of {minLot} devices listed. Add {minLot - rows.length} more to continue.</p>}
        <KV rows={[["Pickup fee", usd(pickupFee)], ["Devices listed", String(rows.length)]]} />
      </Wizard>
    </div>
  );
}
