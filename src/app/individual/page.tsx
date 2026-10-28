"use client";
import { useMemo, useState } from "react";
import { Btn, Card, Check } from "@/components/ui";
import { CATEGORIES, PRODUCTS, ProductCard, ShopHeader, memBucket, osName } from "@/components/individual/lib";

const MEM = ["8 GB", "16 GB", "24 to 32 GB"];
const OS = ["Windows 11", "Linux Mint", "macOS", "ChromeOS"];
const SORTS = ["Price low to high", "Price high to low", "Grade"];
const MAXP = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 10) * 10;

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function Shop() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState(SORTS[0]);
  const [grades, setGrades] = useState<string[]>([]);
  const [mems, setMems] = useState<string[]>([]);
  const [oses, setOses] = useState<string[]>([]);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(MAXP);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (!cat || p.category === cat) &&
      (!t || `${p.title} ${p.cpu} ${p.category} ${p.os}`.toLowerCase().includes(t)) &&
      (!grades.length || (p.grade && grades.includes(p.grade))) &&
      (!mems.length || mems.includes(memBucket(p) ?? "")) &&
      (!oses.length || oses.includes(osName(p) ?? "")) &&
      p.price >= min && p.price <= max);
    const gr = (g?: string | null) => (g ? "ABC".indexOf(g) : 9);
    return list.sort((a, b) => (sort === "Grade" ? gr(a.grade) - gr(b.grade) || a.price - b.price : sort === "Price low to high" ? a.price - b.price : b.price - a.price));
  }, [q, cat, sort, grades, mems, oses, min, max]);

  const clear = () => { setQ(""); setCat(null); setGrades([]); setMems([]); setOses([]); setMin(0); setMax(MAXP); };

  return (
    <div>
      <ShopHeader q={q} setQ={setQ} />
      <nav className="catbar" aria-label="Categories">
        {CATEGORIES.map((c) => <button key={c} className={`pillbtn ${cat === c ? "on" : ""}`} onClick={() => setCat(cat === c ? null : c)}>{c}</button>)}
      </nav>
      <div className="page">
        <div className="row between">
          <h1 style={{ fontSize: 46 }}>{cat ?? "All refurbished tech"}</h1>
          <label className="row gap8 small muted">Sort by
            <select className="input" style={{ width: 200 }} value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
        </div>
        <div className="shop-body">
          <aside className="filters" aria-label="Filters">
            <div className="grp"><h4>Condition</h4>{["A", "B", "C"].map((g) => <Check key={g} on={grades.includes(g)} onChange={() => setGrades(toggle(grades, g))} label={`Grade ${g}`} />)}</div>
            <div className="grp"><h4>Memory</h4>{MEM.map((m) => <Check key={m} on={mems.includes(m)} onChange={() => setMems(toggle(mems, m))} label={m} />)}</div>
            <div className="grp"><h4>Operating system</h4>{OSES(oses, setOses)}</div>
            <div className="grp">
              <h4>Price range</h4>
              <input type="range" aria-label="Minimum price" min={0} max={MAXP} step={10} value={min} onChange={(e) => setMin(Math.min(+e.target.value, max))} />
              <input type="range" aria-label="Maximum price" min={0} max={MAXP} step={10} value={max} onChange={(e) => setMax(Math.max(+e.target.value, min))} />
              <div className="row between small muted"><span>${min}</span><span>${max}</span></div>
            </div>
            <div className="grp"><h4>Availability</h4><Check on ok label="In stock only" /></div>
            <Btn variant="soft" size="sm" onClick={clear}>Clear filters</Btn>
          </aside>
          <div className="col grow">
            <span className="small muted">Showing {shown.length} of {PRODUCTS.length}</span>
            <div className="pgrid stagger" key={shown.map((p) => p.id).join()}>
              {shown.map((p) => <ProductCard key={p.id} p={p} />)}
              {!shown.length && (
                <Card className="empty"><h3>Nothing matches</h3><p className="muted">Try fewer filters or a different search.</p><Btn onClick={clear}>Clear filters</Btn></Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  function OSES(sel: string[], set: (v: string[]) => void) {
    return OS.map((o) => <Check key={o} on={sel.includes(o)} onChange={() => set(toggle(sel, o))} label={o} />);
  }
}
