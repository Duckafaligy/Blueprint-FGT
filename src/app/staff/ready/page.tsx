"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Btn, Check, DataTable, PageHead, Status, Tabs } from "@/components/ui";
import { addHistory, csvEscape, download, NOW, partnerOf, share, usd } from "@/lib/helpers";
import type { Device } from "@/lib/types";

export default function Page() {
  const { state, update, toast } = useApp();
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const list = state.devices.filter((d) => d.status === (tab === 0 ? "Ready to sell" : "Sold"));
  const chosen = list.filter((d) => sel.includes(d.id));
  const toggle = (id: string, on: boolean) => setSel(on ? [...sel, id] : sel.filter((x) => x !== id));
  const earns = (d: Device) => { const p = partnerOf(state, d.partnerId); return p ? share(d.price ?? 0, p.sharePct) : 0; };

  const commit = (d: Device) => {
    const raw = draft[d.id];
    if (raw === undefined) return;
    const v = parseFloat(raw);
    setDraft(({ [d.id]: _, ...rest }) => rest);
    if (!isFinite(v) || v < 0) return toast("Enter a price of zero or more", "bad");
    if (v === d.price) return;
    update((s) => { const x = s.devices.find((y) => y.id === d.id); if (x) { x.price = v; x.priceApproved = false; addHistory(x, "Price changed", usd(v)); } });
  };
  const approve = () => {
    const todo = chosen.filter((d) => !d.priceApproved);
    if (!todo.length) return toast(chosen.length ? "Those prices are already approved" : "Tick the devices to approve first", "warn");
    update((s) => s.devices.forEach((x) => { if (todo.some((d) => d.id === x.id)) { x.priceApproved = true; addHistory(x, "Price approved", usd(x.price ?? 0)); } }));
    toast(`Approved ${todo.length} price${todo.length > 1 ? "s" : ""}`);
  };
  const exportCsv = () => {
    const rows = (chosen.length ? chosen : list).filter((d) => d.priceApproved);
    if (!rows.length) return toast("No approved devices to export. Approve prices first.", "warn");
    const head = ["Serial", "Make", "Model", "Grade", "Price"];
    const csv = [head, ...rows.map((d) => [d.serial, d.make, d.model, d.grade ?? "", (d.price ?? 0).toFixed(2)])].map((r) => r.map(csvEscape).join(",")).join("\n");
    download("fgt-store-export.csv", csv);
    toast(`Exported ${rows.length} device${rows.length > 1 ? "s" : ""}`);
  };
  const sold = () => {
    const todo = chosen.filter((d) => d.priceApproved);
    if (!todo.length) return toast("Approve the prices of the selected devices first", "warn");
    const total = todo.reduce((a, d) => a + earns(d), 0);
    update((s) => s.devices.forEach((x) => { if (todo.some((d) => d.id === x.id)) { x.status = "Sold"; x.soldAt = NOW; addHistory(x, "Sold", usd(x.price ?? 0)); } }));
    setSel([]);
    toast(`Marked ${todo.length} sold. Partners earned ${usd(total)}.`);
  };

  const cols = [
    ...(tab === 0 ? [{ head: <Check on={list.length > 0 && chosen.length === list.length} onChange={(v) => setSel(v ? list.map((d) => d.id) : [])} />, width: 44, cell: (d: Device) => <Check on={sel.includes(d.id)} onChange={(v) => toggle(d.id, v)} /> }] : []),
    { head: "Serial", cell: (d: Device) => <span className="mono">{d.serial}</span> },
    { head: "Grade", cell: (d: Device) => <b>{d.grade ?? "-"}</b> },
    { head: "Specs", cell: (d: Device) => `${d.make} ${d.model}` },
    { head: "Price", cell: (d: Device) => tab === 0
      ? <input className="input" style={{ width: 110, padding: "7px 10px" }} inputMode="decimal" value={draft[d.id] ?? (d.price ?? 0).toFixed(2)}
          onChange={(e) => setDraft({ ...draft, [d.id]: e.target.value })} onBlur={() => commit(d)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
      : usd(d.price ?? 0) },
    { head: "Partner share", cell: (d: Device) => { const p = partnerOf(state, d.partnerId); return p ? <span>{p.name}, {p.sharePct}%, {usd(earns(d))}</span> : <span className="muted">In-house</span>; } },
    { head: tab === 0 ? "Status" : "Sold", cell: (d: Device) => tab === 0 ? <Status s={d.priceApproved ? "Ready to sell" : "Needs approval"} /> : <span>{d.soldAt}</span> },
  ];

  return (
    <>
      <PageHead title="Ready to sell" sub="Set the price, approve it, then export for the store or mark it sold."
        actions={tab === 0 ? <><Btn variant="outline" onClick={approve}>Approve selected prices</Btn><Btn variant="outline" onClick={exportCsv}>Export CSV for the store</Btn><Btn onClick={sold}>Mark sold</Btn></> : <Btn variant="outline" onClick={exportCsv}>Export CSV</Btn>} />
      <Tabs items={["Ready to sell", "Sold"]} value={tab} onChange={(i) => { setTab(i); setSel([]); }} />
      <DataTable<Device> rows={list} cols={cols} rowClass={(d) => (sel.includes(d.id) ? "sel" : "")} empty={tab === 0 ? "Nothing is ready to sell yet." : "Nothing sold yet."} />
    </>
  );
}
