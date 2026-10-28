"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Banner, Btn, Card, Check, EmailPreview, Field, KV, Pipeline } from "@/components/ui";
import { uid, usd } from "@/lib/helpers";
import { Chips, Counter, Crumbs, Opts, Q, Wizard, useDraft, useInquiry, useStartOver } from "./kit";

const KINDS = [
  { v: "donate", label: "Donate retired devices", sub: "We pick up, wipe and give each device a second life" },
  { v: "bulk", label: "Buy refurbished in bulk", sub: "Technology for Social Change: refurbished laptops and desktops for your team or charity" },
  { v: "both", label: "Both", sub: "Retire old devices and buy refurbished ones" },
  { v: "unsure", label: "Not sure", sub: "Tell us about your office and we will suggest what fits" },
];
const KIND_LABEL: Record<string, string> = { donate: "Donate retired devices", bulk: "Buy refurbished in bulk", both: "Both", unsure: "Not sure" };
const WHO = ["Small business", "Professional services", "Charity or nonprofit", "School or college", "Government", "Other"];
const TEAM = ["1 to 10", "11 to 50", "51 to 200", "200 or more"];
const FREQ = ["One time", "Regular, every year or two"];
const APPROVER = ["Me", "My manager", "Finance team", "A committee"];
const CONTACT = ["Email", "Phone call", "Text message"];
const AGE = ["Under 3 years", "3 to 5 years", "6 to 9 years", "10 years or more", "A mix"];
const COND = ["Working", "Mostly working", "Some broken", "Not sure"];
const OS = ["Windows 11", "Windows 10", "Older Windows", "macOS", "Linux", "ChromeOS", "Not sure"];
const SENS = [
  { v: "Standard", label: "Standard", sub: "Everyday office files" },
  { v: "Sensitive", label: "Sensitive", sub: "Client files, staff records" },
  { v: "Highly sensitive", label: "Highly sensitive", sub: "Financial, health or legal records. We will confirm a stricter process." },
];
const BACK = ["Certificate of data destruction", "Impact report", "Asset list", "Chain of custody form", "Photos at pickup"];
const TAGS = ["Yes, asset tags", "Yes, lease stickers", "Both", "No", "Not sure"];
const ACCESS = ["Street level", "Elevator", "Loading dock", "Stairs only", "Key fob or security desk"];
const BINS = ["We have boxes", "Please bring bins", "Not sure"];
const TIMING = ["As soon as possible", "Within two weeks", "This month", "Flexible"];
const BULK_OS = ["Windows 11", "Windows 10", "Linux", "No preference"];
const SPECS = ["Any working device", "8 GB memory and an SSD", "16 GB memory and an SSD", "Touchscreen or 2-in-1"];
const DELIVERY = [{ v: "Pick up at FGT", label: "Pick up at FGT", sub: "Free. Collect from our Toronto shop" }, { v: "Deliver to us", label: "Deliver to us", sub: "We ship or drive it to your address" }];

/** the steps this business will see, in order */
export const flowFor = (kind: string) => (kind === "bulk" ? ["1", "bulk", "review"] : kind === "both" ? ["1", "2", "3", "bulk", "review"] : ["1", "2", "3", "review"]);
const href = (k: string) => `/business/inquiry/${k}`;

export default function InquiryStep() {
  const { step } = useParams<{ step: string }>();
  const { d } = useDraft();
  const flow = flowFor(String(d.kind ?? ""));
  const i = flow.indexOf(step);
  const props = { n: Math.max(i, 0) + 1, of: flow.length, back: i > 0 ? href(flow[i - 1]) : undefined, next: href(flow[i + 1] ?? "review") };
  if (step === "1") return <Step1 {...props} />;
  if (step === "2") return <Step2 {...props} />;
  if (step === "3") return <Step3 {...props} />;
  if (step === "bulk") return <Bulk {...props} />;
  if (step === "review") return <Review />;
  if (step === "sent") return <Sent />;
  return <div className="page"><h1>Page not found</h1><Btn href="/business/inquiry/1">Start an inquiry</Btn></div>;
}

type SP = { n: number; of: number; back?: string; next: string };

function Step1({ n, of, back, next }: SP) {
  const { set, s } = useDraft();
  const router = useRouter();
  const [errs, setErrs] = useState<Record<string, string>>({});
  const go = () => {
    const e: Record<string, string> = {};
    if (!s("kind")) e.kind = "Pick what you need.";
    if (!s("who")) e.who = "Pick the closest match.";
    if (!s("team")) e.team = "Pick a team size.";
    if (!s("freq")) e.freq = "Tell us if this is one time or regular.";
    if (!s("approver")) e.approver = "Who signs off on the quote?";
    if (!s("contactBy")) e.contactBy = "Pick how we should reach you.";
    setErrs(e);
    if (Object.keys(e).length) return false;
    router.push(next);
  };
  const pick = (k: string) => (v: string | string[]) => { set(k, v); setErrs((x) => ({ ...x, [k]: "" })); };
  return (
    <div className="col" style={{ gap: 0 }}>
      <div style={{ padding: "20px 80px 0" }}><Crumbs items={[["Inquiry"], ["What you need"]]} /></div>
      <Wizard n={n} of={of} back={back} onNext={go} title="What do you need?" sub="Maple Street Accounting, a few quick questions. About 3 minutes.">
        <Q label="What would you like to do?" error={errs.kind}>
          <Opts options={KINDS} value={s("kind")} onChange={pick("kind")} />
        </Q>
        <Q label="Who are you?" error={errs.who}><Chips options={WHO} value={s("who")} onChange={pick("who")} /></Q>
        <Q label="How big is your team?" error={errs.team}><Chips options={TEAM} value={s("team")} onChange={pick("team")} /></Q>
        <Q label="One time or regular?" error={errs.freq}><Chips options={FREQ} value={s("freq")} onChange={pick("freq")} /></Q>
        <Q label="Who approves the quote?" error={errs.approver}><Chips options={APPROVER} value={s("approver")} onChange={pick("approver")} /></Q>
        <Q label="How should we contact you?" error={errs.contactBy}><Chips options={CONTACT} value={s("contactBy")} onChange={pick("contactBy")} /></Q>
      </Wizard>
    </div>
  );
}

function Step2({ n, of, back, next }: SP) {
  const { set, s, n: num, a } = useDraft();
  const router = useRouter();
  const [errs, setErrs] = useState<Record<string, string>>({});
  const counts: [string, string][] = [["c_laptops", "Laptops"], ["c_desktops", "Desktops"], ["c_monitors", "Monitors"], ["c_phones", "Phones and tablets"], ["c_other", "Other"]];
  const total = counts.reduce((t, [k]) => t + num(k), 0);
  const go = () => {
    const e: Record<string, string> = {};
    if (total < 1) e.count = "Add at least one device.";
    if (!s("age")) e.age = "Pick the typical age.";
    if (!s("cond")) e.cond = "Pick the typical condition.";
    if (!s("sens")) e.sens = "Tell us how sensitive the data is.";
    if (!s("tags")) e.tags = "Tell us about asset tags.";
    setErrs(e);
    if (Object.keys(e).length) return false;
    router.push(next);
  };
  const pick = (k: string) => (v: string | string[]) => { set(k, v); setErrs((x) => ({ ...x, [k]: "" })); };
  return (
    <div className="col" style={{ gap: 0 }}>
      <div style={{ padding: "20px 80px 0" }}><Crumbs items={[["Inquiry", "/business/inquiry/1"], ["Devices and data"]]} /></div>
      <Wizard n={n} of={of} back={back} onNext={go} title="Your devices and data" sub="Rough numbers are fine. Pickups start at 10 devices.">
        <Q label={`How many devices? (${total} so far)`} error={errs.count}>
          <div className="col gap8 stagger">{counts.map(([k, l]) => <Counter key={k} label={l} value={num(k)} onChange={(v) => { set(k, v); setErrs((x) => ({ ...x, count: "" })); }} />)}</div>
        </Q>
        <Q label="How old are they, mostly?" error={errs.age}><Chips options={AGE} value={s("age")} onChange={pick("age")} /></Q>
        <Q label="What condition are they in?" error={errs.cond}><Chips options={COND} value={s("cond")} onChange={pick("cond")} /></Q>
        <Q label="Operating systems (tick all that apply)">
          <div className="biz-grid2">{OS.map((o) => <Check key={o} on={a("os").includes(o)} label={o} onChange={(v) => set("os", v ? [...a("os"), o] : a("os").filter((x) => x !== o))} />)}</div>
        </Q>
        <Q label="How sensitive is the data on them?" error={errs.sens}><Opts options={SENS} value={s("sens")} onChange={pick("sens")} /></Q>
        <Q label="What do you need back from us?">
          <div className="col gap8">{BACK.map((o) => <Check key={o} on={a("back").includes(o)} label={o} onChange={(v) => set("back", v ? [...a("back"), o] : a("back").filter((x) => x !== o))} />)}</div>
        </Q>
        <Q label="Do the devices have asset tags or lease stickers?" error={errs.tags}><Chips options={TAGS} value={s("tags")} onChange={pick("tags")} /></Q>
      </Wizard>
    </div>
  );
}

function Step3({ n, of, back, next }: SP) {
  const { set, s, a } = useDraft();
  const router = useRouter();
  const [errs, setErrs] = useState<Record<string, string>>({});
  const go = () => {
    const e: Record<string, string> = {};
    if (!s("address").trim()) e.address = "Enter the pickup address.";
    if (!s("floor").trim()) e.floor = "Enter the floor or suite.";
    if (!a("access").length) e.access = "Pick at least one.";
    if (!s("timing")) e.timing = "Pick a timing.";
    if (!s("dayName").trim()) e.dayName = "Enter a name.";
    if (!/\d{3}\D*\d{3}\D*\d{4}/.test(s("dayPhone"))) e.dayPhone = "Enter a 10 digit phone number.";
    setErrs(e);
    if (Object.keys(e).length) return false;
    router.push(next);
  };
  const f = (k: string) => (v: string) => { set(k, v); setErrs((x) => ({ ...x, [k]: "" })); };
  return (
    <div className="col" style={{ gap: 0 }}>
      <div style={{ padding: "20px 80px 0" }}><Crumbs items={[["Inquiry", "/business/inquiry/1"], ["Logistics"]]} /></div>
      <Wizard n={n} of={of} back={back} onNext={go} title="Pickup logistics" sub="So our driver knows what to expect on the day.">
        <Q label="How many locations?"><Chips options={["1", "2 or 3", "4 or more"]} value={s("locations", "1")} onChange={(v) => set("locations", v)} /></Q>
        <Field label="Pickup address" value={s("address")} onChange={f("address")} placeholder="142 King Street East" error={errs.address} />
        <div className="biz-form-row"><Field label="Floor or suite" value={s("floor")} onChange={f("floor")} placeholder="Suite 300" error={errs.floor} /><Field label="On-site hours" value={s("hours")} onChange={f("hours")} placeholder="Mon to Fri, 8 to 5" /></div>
        <Q label="Building access (pick all that apply)" error={errs.access}><Chips multi options={ACCESS} value={a("access")} onChange={(v) => { set("access", v); setErrs((x) => ({ ...x, access: "" })); }} /></Q>
        <Field label="Parking notes" textarea value={s("parking")} onChange={f("parking")} placeholder="Visitor spots behind the building, call from the lobby" />
        <Q label="Bins or boxes"><Chips options={BINS} value={s("bins", "We have boxes")} onChange={(v) => set("bins", v)} /></Q>
        <Q label="When would you like the pickup?" error={errs.timing}><Chips options={TIMING} value={s("timing")} onChange={(v) => { set("timing", v); setErrs((x) => ({ ...x, timing: "" })); }} /></Q>
        <div className="biz-form-row"><Field label="Day-of contact name" value={s("dayName")} onChange={f("dayName")} placeholder="Dana Okafor" error={errs.dayName} /><Field label="Day-of contact phone" value={s("dayPhone")} onChange={f("dayPhone")} placeholder="416-555-0142" error={errs.dayPhone} /></div>
      </Wizard>
    </div>
  );
}

function Bulk({ n, of, back, next }: SP) {
  const { set, s, n: num } = useDraft();
  const router = useRouter();
  const [errs, setErrs] = useState<Record<string, string>>({});
  const items: [string, string][] = [["b_laptops", "Laptops"], ["b_desktops", "Desktops"], ["b_monitors", "Monitors"], ["b_kbm", "Keyboards and mice"]];
  const total = items.reduce((t, [k]) => t + num(k), 0);
  const go = () => {
    const e: Record<string, string> = {};
    if (!s("org").trim()) e.org = "Enter your organization.";
    if (total < 1) e.count = "Add at least one item.";
    if (!s("delivery")) e.delivery = "Pick pick-up or delivery.";
    setErrs(e);
    if (Object.keys(e).length) return false;
    router.push(next);
  };
  return (
    <div className="col" style={{ gap: 0 }}>
      <div style={{ padding: "20px 80px 0" }}><Crumbs items={[["Inquiry", "/business/inquiry/1"], ["Buy in bulk"]]} /></div>
      <Wizard n={n} of={of} back={back} onNext={go} title="Buy refurbished in bulk" sub="Technology for Social Change: tested, wiped, refurbished devices at fair prices.">
        <div className="biz-form-row">
          <Field label="Organization" value={s("org")} onChange={(v) => { set("org", v); setErrs((x) => ({ ...x, org: "" })); }} placeholder="Maple Street Accounting" error={errs.org} />
          <Field label="Charity number (optional)" value={s("charity")} onChange={(v) => set("charity", v)} placeholder="123456789 RR0001" />
        </div>
        <Q label={`What do you need? (${total} items)`} error={errs.count}>
          <div className="col gap8 stagger">{items.map(([k, l]) => <Counter key={k} label={l} value={num(k)} onChange={(v) => { set(k, v); setErrs((x) => ({ ...x, count: "" })); }} />)}</div>
        </Q>
        <Q label="Operating system"><Chips options={BULK_OS} value={s("bulkOs", "No preference")} onChange={(v) => set("bulkOs", v)} /></Q>
        <Q label="Minimum specs"><Chips options={SPECS} value={s("specs", "Any working device")} onChange={(v) => set("specs", v)} /></Q>
        <Q label={`Budget: ${usd(num("budget", 3000))}`}>
          <input type="range" min={500} max={20000} step={250} value={num("budget", 3000)} onChange={(e) => set("budget", Number(e.target.value))} aria-label="Budget" />
          <div className="row between tiny muted"><span>$500</span><span>$20,000</span></div>
        </Q>
        <Q label="Pick up or delivery?" error={errs.delivery}><Opts options={DELIVERY} value={s("delivery")} onChange={(v) => { set("delivery", v); setErrs((x) => ({ ...x, delivery: "" })); }} /></Q>
        <Field label="What will the devices be used for?" textarea value={s("purpose")} onChange={(v) => set("purpose", v)} placeholder="New hires, a youth program, a computer lab" />
      </Wizard>
    </div>
  );
}

function Review() {
  const { d, s, n: num, a } = useDraft();
  const { state, update, toast } = useApp();
  const router = useRouter();
  const kind = s("kind");
  const flow = flowFor(kind);
  const quote = state.settings.pickupFee;
  const list = (v: string[]) => (v.length ? v.join(", ") : "None");
  const dev = ["c_laptops:Laptops", "c_desktops:Desktops", "c_monitors:Monitors", "c_phones:Phones and tablets", "c_other:Other"].map((x) => x.split(":")).filter(([k]) => num(k) > 0).map(([k, l]) => `${num(k)} ${l.toLowerCase()}`);
  const bulk = ["b_laptops:laptops", "b_desktops:desktops", "b_monitors:monitors", "b_kbm:keyboards and mice"].map((x) => x.split(":")).filter(([k]) => num(k) > 0).map(([k, l]) => `${num(k)} ${l}`);
  const sections: { step: string; title: string; rows: [string, string][] }[] = [
    { step: "1", title: "What you need", rows: [["Request", KIND_LABEL[kind] ?? "Not set"], ["Who you are", s("who", "Not set")], ["Team size", s("team", "Not set")], ["How often", s("freq", "Not set")], ["Quote approver", s("approver", "Not set")], ["Contact by", s("contactBy", "Not set")]] },
  ];
  if (flow.includes("2")) {
    sections.push({ step: "2", title: "Devices and data", rows: [["Devices", dev.join(", ") || "None"], ["Age", s("age", "Not set")], ["Condition", s("cond", "Not set")], ["Operating systems", list(a("os"))], ["Data sensitivity", s("sens", "Not set")], ["Needed back", list(a("back"))], ["Asset tags", s("tags", "Not set")]] });
    sections.push({ step: "3", title: "Logistics", rows: [["Locations", s("locations", "1")], ["Address", `${s("address", "Not set")}, ${s("floor")}`], ["Access", list(a("access"))], ["Parking", s("parking", "None")], ["On-site hours", s("hours", "Not set")], ["Bins or boxes", s("bins", "We have boxes")], ["Timing", s("timing", "Not set")], ["Day-of contact", `${s("dayName")} ${s("dayPhone")}`]] });
  }
  if (flow.includes("bulk")) sections.push({ step: "bulk", title: "Buy in bulk", rows: [["Organization", s("org", "Not set")], ["Charity number", s("charity", "None")], ["Items", bulk.join(", ") || "None"], ["Operating system", s("bulkOs", "No preference")], ["Minimum specs", s("specs", "Any working device")], ["Budget", usd(num("budget", 3000))], ["Delivery", s("delivery", "Not set")], ["Purpose", s("purpose", "None")]] });

  const send = () => {
    if (!kind) { toast("Answer step 1 first", "warn"); router.push(href("1")); return; }
    const id = uid("INQ");
    update((x) => {
      if (x.inquiryDraft.sentId) return;
      x.inquiries.push({ id, kind: kind as "donate", answers: { ...x.inquiryDraft }, status: "Sent", quote, createdAt: "Nov 6" });
      x.inquiryDraft.sentId = id;
    });
    toast("Inquiry sent");
    router.push(href("sent"));
  };
  return (
    <div className="page narrow">
      <div style={{ width: 820, maxWidth: "100%" }}><Crumbs items={[["Inquiry", href("1")], ["Review"]]} /></div>
      <div className="qcard">
        <div className="col gap8"><span className="small muted bold">Step {flow.length} of {flow.length}</span><div className="pips">{flow.map((f) => <i key={f} className="on" />)}</div></div>
        <div className="col gap8"><h1>Review your inquiry</h1><p className="muted">Check everything, change anything, then send it to FGT.</p></div>
        <div className="col gap12 stagger">
          {sections.map((sec) => (
            <Card key={sec.step} title={sec.title} right={<Link className="link" href={href(sec.step)}>Edit</Link>}><KV rows={sec.rows} /></Card>
          ))}
        </div>
        <Banner color="var(--accent)"><div className="row between"><div><b>Estimated quote</b><p className="small muted">Final quote follows within one business day.</p></div><b style={{ fontFamily: "var(--f-display)", fontSize: 44 }}>{usd(quote)}</b></div></Banner>
        <div className="row between"><Btn href={href(flow[flow.length - 2])} variant="soft">Back</Btn><Btn size="lg" onClick={send}>Send inquiry</Btn></div>
      </div>
    </div>
  );
}

function Sent() {
  const inq = useInquiry();
  const startOver = useStartOver();
  const { s } = useDraft();
  if (!inq) return <div className="page"><Crumbs items={[["Inquiry", href("1")], ["Sent"]]} /><h1>No inquiry yet</h1><p className="muted">Send an inquiry first.</p><Btn href={href("1")}>Start an inquiry</Btn></div>;
  return (
    <div className="page narrow">
      <div className="qcard" style={{ alignItems: "center", textAlign: "center" }}>
        <span className="stamp">Inquiry sent</span>
        <h1>Thank you, Dana</h1>
        <p className="muted">Reference {inq.id}. We will email your quote within one business day. You can open the quote now in this demo.</p>
        <div style={{ width: "100%" }}><Pipeline stages={["Inquiry sent", "Quote ready", "You approve", "Pickup booked", "Devices listed"]} now={0} /></div>
        <EmailPreview to="dana@maplestreetaccounting.example" subject={`We got your inquiry, ${inq.id}`}>
          <p>Hi Dana,</p>
          <p>Thanks for contacting Free Geek Toronto. Your inquiry is with our team. Next we will send a quote of {usd(inq.quote)} for {inq.kind === "bulk" ? "your bulk order" : "your pickup"}. We will reach you by {s("contactBy", "email").toLowerCase()}.</p>
        </EmailPreview>
        <div className="row gap12 wrap" style={{ justifyContent: "center" }}>
          <Btn size="lg" href="/business/quote">See my quote</Btn>
          <Btn variant="outline" size="lg" onClick={startOver}>Start another inquiry</Btn>
          <Btn variant="ghost" href="/business/donations">My donations</Btn>
        </div>
      </div>
    </div>
  );
}
