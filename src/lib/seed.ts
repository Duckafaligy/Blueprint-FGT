import type { AppState, Device, DeviceStatus, Lot, Partner, Shipment, Person, Settings, Grade, HistoryEntry } from "./types";

/** The demo runs on Friday, Nov 6, 2026. */
export const DEMO_DAY = "Fri, Nov 6";

const MODELS: { make: string; model: string; price: number }[] = [
  { make: "Dell", model: "Latitude 5420", price: 309.99 },
  { make: "HP", model: "EliteBook 840 G8", price: 379.99 },
  { make: "Dell", model: "Latitude 5430", price: 399.99 },
  { make: "Lenovo", model: "ThinkPad T14", price: 569.99 },
  { make: "HP", model: "EliteBook 840 G7", price: 239.99 },
  { make: "Dell", model: "Latitude 5320", price: 379.99 },
  { make: "HP", model: "ProBook 450 G8", price: 289.99 },
  { make: "Lenovo", model: "ThinkPad T490", price: 229.99 },
  { make: "Dell", model: "Latitude 7420", price: 349.99 },
  { make: "HP", model: "EliteBook 830 G7", price: 259.99 },
];
const WORK = [["Battery"], ["Memory"], ["Keyboard"], ["Screen"], ["Fan"], ["Battery", "Memory"], ["Battery"], ["Screen", "Battery"]];

let n = 0;
const cert = () => `FGT-2026-${String(400 + ++n).padStart(5, "0")}`;

interface Spec {
  lotId: string; count: number; status: DeviceStatus; path: Device["path"]; partnerId?: string; shipmentId?: string;
  serialPrefix: string; at: string; modelOffset?: number; serials?: string[]; statuses?: DeviceStatus[]; wiped?: boolean;
  price?: boolean; approved?: boolean; recycleReason?: string; by?: string;
}

function build(s: Spec): Device[] {
  const out: Device[] = [];
  for (let i = 0; i < s.count; i++) {
    const m = MODELS[((s.modelOffset ?? 0) + i) % MODELS.length];
    const serial = s.serials?.[i] ?? `${s.serialPrefix}${String(100 + i * 7)}`;
    const status = s.statuses?.[i] ?? s.status;
    const history: HistoryEntry[] = [{ at: s.at + " · 9:12", label: "Received", detail: "Checked in at intake", by: s.by ?? "Sam" }];
    const d: Device = {
      id: `${s.lotId}-${i + 1}`, lotId: s.lotId, type: "Laptop", make: m.make, model: m.model, serial, status,
      path: s.path, partnerId: s.partnerId, shipmentId: s.shipmentId, work: s.path === "partner" ? WORK[(i + (s.modelOffset ?? 0)) % WORK.length] : [],
      price: m.price, history,
    };
    if (s.path) history.push({ at: s.at + " · 10:40", label: s.path === "partner" ? "Sent to partner" : s.path === "resell" ? "Resell after in-house prep" : "Marked to recycle", detail: "Decision made at intake", by: s.by ?? "Sam" });
    if (s.path === "recycle") d.reason = s.recycleReason ?? "Too old to reuse";
    if (s.wiped !== false && !["Booked", "Received"].includes(status)) {
      const c = cert();
      d.wipe = { result: "Success", method: "ShredOS / nwipe", passes: "3-pass overwrite", cert: c, by: s.by ?? "Sam", at: s.at + " · 11:05" };
      history.push({ at: s.at + " · 11:05", label: "Wiped", detail: `ShredOS · 3 passes · success · ${c}`, by: s.by ?? "Sam" });
    }
    out.push(d);
  }
  return out;
}

const grade = (i: number): Grade => (["A", "B", "B", "A", "C"] as Grade[])[i % 5];

export function makeSeed(): AppState {
  n = 0;
  const partners: Partner[] = [
    { id: "p1", name: "Bench Refurb Co.", contact: "Dev Patel", email: "orders@benchrefurb.example", phone: "416-555-0132", work: ["Batteries", "Memory", "Keyboards"], sharePct: 35, turnaround: "10 business days", minBatch: 6, area: "West end Toronto", notes: "Reliable. Fails about 1 in 12 at QC.", status: "Active" },
    { id: "p2", name: "Parkdale Repair Collective", contact: "Lina Mora", email: "hello@parkdalerepair.example", phone: "416-555-0166", work: ["Screens", "Keyboards"], sharePct: 25, turnaround: "7 business days", minBatch: 4, area: "Parkdale", notes: "Fast on screens. Local pickup.", status: "Active" },
    { id: "p3", name: "Scarborough Tech Hub", contact: "Amira Hassan", email: "amira@scarboroughtech.example", phone: "416-555-0170", work: ["Full refurbish", "Linux install"], sharePct: 45, turnaround: "10 business days", minBatch: 6, area: "East GTA", notes: "Starting with a trial batch.", status: "Onboarding" },
  ];

  const lots: Lot[] = [
    { id: "HDG-0031", company: "Harbour Dental Group", contact: "Priti Shah", email: "priti@harbourdental.example", phone: "416-555-0111", address: "88 Adelaide St W", window: "Fri, Nov 6 · 1 to 4", count: 14, status: "Picked up", fee: 125, kind: "donate" },
    { id: "QWL-0007", company: "Queen West Law", contact: "Tom Berg", email: "tom@queenwestlaw.example", phone: "416-555-0122", address: "910 Queen St W", window: "Fri, Nov 13 · 9 to 12", count: 11, status: "Booked", fee: 125, kind: "donate" },
    { id: "BDS-0012", company: "Bloor Design Studio", contact: "Ana Ruiz", email: "ana@bloordesign.example", phone: "416-555-0133", address: "700 Bloor St W", window: "Wed, Nov 18 · 1 to 4", count: 10, status: "Booked", fee: 125, kind: "donate" },
    { id: "TRB-0003", company: "Trillium Brokerage", contact: "Mei Chen", email: "mei@trilliumbrokerage.example", phone: "416-555-0144", address: "20 Bay St", window: "Sat, Nov 21 · 9 to 12", count: 22, status: "Booked", fee: 125, kind: "donate" },
    { id: "MSA-0024", company: "Maple Street Accounting", contact: "Dana Okafor", email: "dana@maplestreetaccounting.example", phone: "416-555-0142", address: "142 King Street East, Suite 300", window: "Sat, Oct 24 · 9 to 12", count: 12, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "MSA-0011", company: "Maple Street Accounting", contact: "Dana Okafor", email: "dana@maplestreetaccounting.example", phone: "416-555-0142", address: "142 King Street East, Suite 300", window: "Sat, Aug 22 · 9 to 12", count: 18, status: "Closed", fee: 125, kind: "donate", intakeDone: true },
    { id: "QWL-0004", company: "Queen West Law", contact: "Tom Berg", email: "tom@queenwestlaw.example", phone: "416-555-0122", address: "910 Queen St W", window: "Wed, Oct 14 · 9 to 12", count: 10, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "BDS-0004", company: "Bloor Design Studio", contact: "Ana Ruiz", email: "ana@bloordesign.example", phone: "416-555-0133", address: "700 Bloor St W", window: "Sat, Oct 10 · 1 to 4", count: 4, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "TRB-0001", company: "Trillium Brokerage", contact: "Mei Chen", email: "mei@trilliumbrokerage.example", phone: "416-555-0144", address: "20 Bay St", window: "Fri, Oct 30 · 9 to 12", count: 14, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "BDS-0009", company: "Bloor Design Studio", contact: "Ana Ruiz", email: "ana@bloordesign.example", phone: "416-555-0133", address: "700 Bloor St W", window: "Fri, Oct 30 · 1 to 4", count: 6, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "QWL-0003", company: "Queen West Law", contact: "Tom Berg", email: "tom@queenwestlaw.example", phone: "416-555-0122", address: "910 Queen St W", window: "Wed, Oct 28 · 9 to 12", count: 8, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "TRB-0002", company: "Trillium Brokerage", contact: "Mei Chen", email: "mei@trilliumbrokerage.example", phone: "416-555-0144", address: "20 Bay St", window: "Sat, Oct 24 · 1 to 4", count: 6, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
    { id: "HDG-0026", company: "Harbour Dental Group", contact: "Priti Shah", email: "priti@harbourdental.example", phone: "416-555-0111", address: "88 Adelaide St W", window: "Fri, Oct 30 · 1 to 4", count: 12, status: "In progress", fee: 125, kind: "donate", intakeDone: true },
  ];

  const D: Device[] = [];
  // Harbour Dental, today: 9 checked in, 5 still to come
  const hdg = build({ lotId: "HDG-0031", count: 14, status: "Received", path: null, serialPrefix: "HDG", at: "Nov 6", modelOffset: 1, wiped: false,
    serials: ["5CG3101K1", "5CG3101K2", "5CG3101K7", "5CG3101M4", "6MXH201", "6MXH203", "6MXH208", "6MXH214", "PF4A3071", "PF4A3075", "PF4A3092", "CND3331A", "CND3331C", "CND3331F"] });
  hdg.forEach((d, i) => {
    if (i < 9) { d.path = i < 9 ? "partner" : null; d.history.push({ at: "Nov 6 · 2:10 PM", label: "Sent to partner", detail: "Decision made at intake", by: "Sam" }); d.work = WORK[i % WORK.length]; }
    else { d.status = "Booked"; d.history = []; }
  });
  D.push(...hdg);

  // Maple Street, picked up Oct 24
  const msaSerials = ["7H2K91Z", "4RT8M2Q", "CND1412XY", "CND1412XZ", "PF2X88Q", "9QW3T1K", "CND9981", "B6K1F0P", "CND0412", "PC1N7EE", "3VX9H2L", "CND7731"];
  const msaModels: [string, string][] = [["Dell", "Latitude 5420"], ["Dell", "Latitude 5420"], ["HP", "EliteBook 840 G8"], ["HP", "EliteBook 840 G8"], ["Lenovo", "ThinkPad T14"], ["Dell", "Latitude 5430"], ["HP", "ProBook 450 G8"], ["Dell", "Latitude 5320"], ["HP", "EliteBook 840 G7"], ["Lenovo", "ThinkPad T490"], ["Dell", "Latitude 7420"], ["HP", "EliteBook 830 G7"]];
  const msaStatus: DeviceStatus[] = ["Done", "Done", "Done", "Done", "Done", "Refurbishing", "Refurbishing", "At partner", "Ready for QC", "Ready for QC", "Recycled", "Recycled"];
  const msa = build({ lotId: "MSA-0024", count: 12, status: "Wiped", path: "partner", partnerId: "p1", shipmentId: "b04", serialPrefix: "M", at: "Oct 24", serials: msaSerials, statuses: msaStatus });
  msa.forEach((d, i) => {
    [d.make, d.model] = msaModels[i];
    d.price = MODELS.find((m) => m.model === d.model)?.price ?? 299.99;
    if (i >= 8 && i < 10) { d.path = "resell"; d.partnerId = undefined; d.shipmentId = undefined; d.work = []; d.history = d.history.filter((h) => !h.label.startsWith("Sent")); d.history.splice(1, 0, { at: "Oct 24 · 10:40", label: "Resell after in-house prep", by: "Sam" }); d.history.push({ at: "Nov 3 · 15:00", label: "Ready for QC", detail: "In-house prep finished", by: "Sam" }); }
    if (i >= 10) { d.path = "recycle"; d.partnerId = undefined; d.shipmentId = undefined; d.work = []; d.reason = i === 10 ? "Screen cracked, board damaged" : "Too old to reuse, battery swollen"; d.price = undefined; }
    if (i < 8) { d.history.push({ at: "Oct 27 · 8:30", label: "Shipped to Bench Refurb Co.", detail: "Batch 04" }); if (d.status === "Done") d.history.push({ at: "Nov 4 · 11:00", label: "Partner finished", detail: d.work.length ? `${d.work.join(", ")} done` : "Done" }); d.grade = undefined; }
  });
  msa[0].note = "Replaced battery"; msa[1].note = "Added 8 GB of memory"; msa[2].note = "Replaced keyboard"; msa[3].note = "Replaced battery"; msa[4].note = "Cleaned fan, new thermal paste"; msa[5].note = "Waiting for a screen"; msa[6].note = "Battery fitted, memory next";
  D.push(...msa);

  // Maple Street closed lot, 18 devices: 12 Sold, 3 Ready to sell, 3 Recycled; Batch 01 is 6 of them
  const old: DeviceStatus[] = [...Array(12).fill("Sold"), ...Array(3).fill("Ready to sell"), ...Array(3).fill("Recycled")];
  const msaOld = build({ lotId: "MSA-0011", count: 18, status: "Sold", path: "resell", serialPrefix: "OLD", at: "Aug 22", statuses: old });
  msaOld.forEach((d, i) => {
    if (i < 6) { d.path = "partner"; d.partnerId = "p1"; d.shipmentId = "b01"; d.work = WORK[i % WORK.length]; d.status = i < 4 ? "Sold" : "Ready to sell"; }
    if (d.status === "Recycled") { d.path = "recycle"; d.reason = "Too old to reuse"; d.price = undefined; }
    if (d.status === "Sold" || d.status === "Ready to sell") { d.grade = grade(i); d.priceApproved = true; d.qc = { result: "Pass", grade: d.grade, by: "Priya", at: "Sep 12", ticks: Array(10).fill(true) }; }
    if (d.status === "Sold") d.soldAt = "Sep 20";
  });
  D.push(...msaOld);

  // Other lots
  D.push(...build({ lotId: "QWL-0004", count: 10, status: "Done", path: "partner", partnerId: "p1", shipmentId: "b02", serialPrefix: "QW4-", at: "Oct 14", modelOffset: 2 }).map((d, i) => ({ ...d, note: i < 4 ? "Done" : "Battery and RAM done" })));
  D.push(...build({ lotId: "BDS-0004", count: 4, status: "Ready for QC", path: "partner", partnerId: "p1", shipmentId: "b03", serialPrefix: "BD4-", at: "Oct 10", modelOffset: 5 }));
  D.push(...build({ lotId: "QWL-0003", count: 8, status: "Wiped", path: "partner", partnerId: "p1", shipmentId: "b05", serialPrefix: "QW3-", at: "Oct 28", modelOffset: 3 }));
  D.push(...build({ lotId: "TRB-0002", count: 6, status: "At partner", path: "partner", partnerId: "p2", shipmentId: "b06", serialPrefix: "TB2-", at: "Oct 24", modelOffset: 4 }));
  D.push(...build({ lotId: "TRB-0001", count: 14, status: "Wiped", path: "partner", partnerId: "p1", shipmentId: "plan07", serialPrefix: "TB1-", at: "Oct 30", modelOffset: 6 }));
  D.push(...build({ lotId: "BDS-0009", count: 6, status: "Wiped", path: "partner", partnerId: "p2", shipmentId: "plan08", serialPrefix: "BD9-", at: "Oct 30", modelOffset: 7 }));
  D.push(...build({ lotId: "HDG-0026", count: 12, status: "Wiped", path: "partner", serialPrefix: "HD6-", at: "Oct 30", modelOffset: 8 }));

  const ids = (lot: string, from = 0, to = 99) => D.filter((d) => d.lotId === lot).slice(from, to).map((d) => d.id);
  const msg = (text: string, at: string) => [{ from: "FGT" as const, text, at }];
  const shipments: Shipment[] = [
    { id: "b01", name: "Batch 01", partnerId: "p1", deviceIds: ids("MSA-0011", 0, 6), status: "Returned", shipDate: "Sep 22", dueDate: "Oct 1", notified: true, accepted: true, messages: [] },
    { id: "b02", name: "Batch 02", partnerId: "p1", deviceIds: ids("QWL-0004"), status: "Done", shipDate: "Oct 20", dueDate: "Nov 7", notified: true, accepted: true, messages: [] },
    { id: "b03", name: "Batch 03", partnerId: "p1", deviceIds: ids("BDS-0004"), status: "Returned", shipDate: "Oct 21", dueDate: "Oct 31", notified: true, accepted: true, messages: [] },
    { id: "b04", name: "Batch 04", partnerId: "p1", deviceIds: ids("MSA-0024", 0, 8), status: "Refurbishing", shipDate: "Oct 27", dueDate: "Nov 10", notified: true, accepted: true, messages: [] },
    { id: "b05", name: "Batch 05", partnerId: "p1", deviceIds: ids("QWL-0003"), status: "Ready for pickup", shipDate: "Nov 7", dueDate: "Nov 21", notified: true, accepted: true, messages: [] },
    { id: "b06", name: "Batch 06", partnerId: "p2", deviceIds: ids("TRB-0002"), status: "Shipped", shipDate: "Nov 4", dueDate: "Nov 7", notified: true, accepted: true, messages: [] },
    { id: "plan07", name: "Plan 07", partnerId: "p1", deviceIds: ids("TRB-0001"), status: "Planned", shipDate: "Tue, Nov 10", notified: true, accepted: false, messages: msg("We are adding 14 devices to your next shipment, planned for Nov 10. Open Incoming to see them.", "Nov 6") },
    { id: "plan08", name: "Plan 08", partnerId: "p2", deviceIds: ids("BDS-0009"), status: "Planned", shipDate: "Tue, Nov 17", notified: false, accepted: false, messages: [] },
  ];
  // device status inside returned / done batches
  D.forEach((d) => { if (d.shipmentId === "b03") d.history.push({ at: "Oct 31 · 15:00", label: "Back from partner", detail: "Batch 03 returned" }); });

  const people: Person[] = [
    { id: "pe1", name: "Priya Nair", role: "QC intern", program: "QC certificate", since: "Jan 2026", email: "priya@example.com", phone: "647-555-0101", checks: 50, hours: 220, certified: true },
    { id: "pe2", name: "Sam Okoro", role: "QC intern", program: "QC certificate", since: "Sep 2026", email: "sam@example.com", phone: "647-555-0102", checks: 34, hours: 96, certified: false },
    { id: "pe3", name: "Jordan Lee", role: "QC intern", program: "QC certificate", since: "Oct 2026", email: "jordan@example.com", phone: "647-555-0103", checks: 21, hours: 48, certified: false },
    { id: "pe4", name: "Aisha Rahman", role: "QC intern", program: "QC certificate", since: "Oct 2026", email: "aisha@example.com", phone: "647-555-0104", checks: 6, hours: 20, certified: false },
    { id: "pe5", name: "Marcus Tran", role: "Volunteer", program: "Sorting and intake", since: "Mar 2026", email: "marcus@example.com", phone: "647-555-0105", checks: 0, hours: 46, certified: false },
    { id: "pe6", name: "Elena Petrova", role: "Volunteer", program: "Sorting and intake", since: "Aug 2026", email: "elena@example.com", phone: "647-555-0106", checks: 0, hours: 18, certified: false },
    { id: "pe7", name: "Ryan Fukunaga", role: "Staff", program: "Executive director", since: "2022", email: "ryan@example.com", phone: "416-555-0107", checks: 0, hours: 0, certified: false },
  ];

  const settings: Settings = {
    pickupFee: 125, minLot: 10, ageCutoff: 10, kgPerDevice: 2, shareMin: 20, shareMax: 50, qcChecks: 50,
    rules: [
      { item: "Laptop", condition: "Under 10 years old", result: "Bring it in" },
      { item: "Laptop or desktop", condition: "10+ years, or no power", result: "Recycle" },
      { item: "Monitor", condition: "Flat panel, works", result: "Bring it in" },
      { item: "Monitor", condition: "CRT", result: "Recycle" },
      { item: "Phone or tablet", condition: "Any", result: "Recycle" },
      { item: "Any computers", condition: "10 or more devices", result: "Book a pickup" },
    ],
  };

  shipments.forEach((sh) => { sh.deviceIds = D.filter((d) => d.shipmentId === sh.id).map((d) => d.id); });
  return {
    devices: D, lots, partners, shipments, people, settings,
    inquiries: [], orders: [], cart: [{ productId: "", qty: 1 }].slice(0, 0), checkerLog: [],
    donorAnswers: {}, inquiryDraft: {}, businessLotId: "MSA-0024",
  };
}
