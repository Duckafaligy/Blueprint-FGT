export type DeviceStatus =
  | "Booked" | "Received" | "Wiped" | "At partner" | "Refurbishing" | "Done"
  | "Ready for QC" | "Ready to sell" | "Sold" | "Recycled";

export type Path = "resell" | "partner" | "recycle";
export type Grade = "A" | "B" | "C";

export interface HistoryEntry { at: string; label: string; detail?: string; by?: string }

export interface Device {
  id: string;
  lotId: string;
  type: string;            // Laptop, Desktop, Monitor ...
  make: string;
  model: string;
  serial: string;
  status: DeviceStatus;
  path: Path | null;       // decided at intake
  reason?: string;         // required for recycle
  partnerId?: string;
  shipmentId?: string;
  work: string[];          // work needed, for example Battery
  grade?: Grade;
  price?: number;          // FGT resale price, set when priced
  priceApproved?: boolean;
  wipe?: { result: "Success" | "Failed"; method: string; passes: string; cert?: string; by: string; at: string; destroyed?: boolean };
  qc?: { result: "Pass" | "Fail"; grade?: Grade; note?: string; by: string; at: string; ticks: boolean[] };
  note?: string;           // partner note
  history: HistoryEntry[];
  soldAt?: string;
}

export interface Lot {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  window: string;          // for example "Thu, Nov 6 · 1 to 4"
  count: number;           // devices booked
  status: "Booked" | "Picked up" | "In progress" | "Closed";
  fee: number;
  kind: "donate" | "bulk";
  intakeDone?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  work: string[];
  sharePct: number;        // 20 to 50, percent of FGT resale price
  turnaround: string;
  minBatch: number;
  area: string;
  notes: string;
  status: "Active" | "Onboarding";
}

export type ShipmentStatus = "Planned" | "Ready for pickup" | "Shipped" | "Refurbishing" | "Done" | "Returned";

export interface Shipment {
  id: string;
  name: string;            // Batch 04 or Plan 07
  partnerId: string;
  deviceIds: string[];
  status: ShipmentStatus;
  shipDate: string;
  dueDate?: string;
  notified: boolean;
  accepted: boolean;
  messages: { from: "FGT" | "Partner"; text: string; at: string }[];
}

export interface Person {
  id: string;
  name: string;
  role: "QC intern" | "Volunteer" | "Staff" | "Partner contact";
  program: string;
  since: string;
  email: string;
  phone: string;
  checks: number;          // verified QC checks (interns)
  hours: number;
  certified: boolean;
}

export interface Settings {
  pickupFee: number;
  minLot: number;
  ageCutoff: number;
  kgPerDevice: number;
  shareMin: number;
  shareMax: number;
  qcChecks: number;        // checks needed for the certificate
  rules: { item: string; condition: string; result: "Bring it in" | "Recycle" | "Book a pickup" }[];
}

export interface Product {
  id: string; handle: string; title: string; category: string; price: number; image: string;
  grade?: Grade | null; cpu: string; memory: string; storage: string; os: string; screen: string;
  issue: string; conn: string; ports: string; ships: boolean;
}

export interface Order {
  id: string;
  items: { productId: string; qty: number }[];
  name: string; email: string; phone: string;
  delivery: "ship" | "pickup";
  address?: string;
  subtotal: number; shipping: number; tax: number; total: number;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  kind: "donate" | "bulk" | "both" | "unsure";
  answers: Record<string, unknown>;
  status: "Sent" | "Quoted" | "Approved";
  quote: number;
  createdAt: string;
}

export interface CheckerEntry { at: string; item: string; age: string; power: string; result: "bring" | "pickup" | "recycle" }

export interface AppState {
  devices: Device[];
  lots: Lot[];
  partners: Partner[];
  shipments: Shipment[];
  people: Person[];
  settings: Settings;
  inquiries: Inquiry[];
  orders: Order[];
  cart: { productId: string; qty: number }[];
  checkerLog: CheckerEntry[];
  /** work in progress answers, per funnel */
  donorAnswers: Record<string, unknown>;
  inquiryDraft: Record<string, unknown>;
  /** the business account used in the demo */
  businessLotId: string;
}
