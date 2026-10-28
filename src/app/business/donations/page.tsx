"use client";
import { useApp } from "@/lib/store";
import { Btn, Card, Kpi, Progress, Status } from "@/components/ui";
import { devicesOfLot, lotFinished } from "@/lib/helpers";
import { COMPANY, Crumbs, cust, custColor, finished, myLots, useStartOver } from "@/components/business/kit";

export default function DonationsPage() {
  const { state } = useApp();
  const startOver = useStartOver();
  const lots = myLots(state.lots);
  const all = lots.flatMap((l) => devicesOfLot(state, l.id));
  return (
    <div className="page">
      <Crumbs items={[["Inquiry", "/business/inquiry/1"], ["My donations"]]} />
      <div className="page-head"><div><h1>My donations</h1><p>{COMPANY}. Follow every device from pickup to its second life.</p></div><Btn onClick={startOver}>Start another inquiry</Btn></div>
      <div className="row gap12 stagger">
        <Kpi label="Lots" value={lots.length} />
        <Kpi label="Devices donated" value={all.length} />
        <Kpi label="Wiped" value={all.filter((d) => !!d.wipe).length} color="var(--ok)" />
        <Kpi label="Finished" value={all.filter(finished).length} color="var(--brand)" sub="Ready to sell, reused or recycled" />
      </div>
      <div className="biz-card-grid stagger">
        {lots.map((l) => {
          const ds = devicesOfLot(state, l.id);
          const done = ds.filter(finished).length;
          const pct = ds.length ? (done / ds.length) * 100 : 0;
          const counts = ds.reduce<Record<string, number>>((m, d) => { const k = cust(d.status); m[k] = (m[k] ?? 0) + 1; return m; }, {});
          const fin = lotFinished(state, l.id);
          return (
            <Card key={l.id} lift>
              <div className="row between"><h3>{l.id}</h3><span className="small muted">{l.window}</span></div>
              <p className="small muted">{l.address} · {ds.length} devices</p>
              <div className="col gap8"><div className="row between small"><b>{done} of {ds.length} finished</b><span className="muted">{Math.round(pct)}%</span></div><Progress pct={pct} color={fin ? "var(--ok)" : undefined} /></div>
              <div className="row gap8 wrap">{Object.entries(counts).map(([k, n]) => <span key={k} className="row gap8"><Status s={custColor(ds.find((d) => cust(d.status) === k)?.status ?? k)} label={`${n} ${k}`} /></span>)}</div>
              <div className="row gap8 wrap">
                <Btn size="sm" href={`/business/lot/${l.id}`}>Open lot</Btn>
                <Btn size="sm" variant="outline" href={`/business/doc/pack/${l.id}`}>Certificates</Btn>
                <Btn size="sm" variant="accent" href={fin ? `/business/doc/impact/${l.id}` : undefined} disabled={!fin}>Impact report</Btn>
              </div>
              {!fin && <p className="tiny muted">The impact report opens once every device is ready to sell, reused or recycled.</p>}
            </Card>
          );
        })}
      </div>
      {lots.length === 0 && <Card><p className="muted">No donations yet.</p><div><Btn onClick={startOver}>Start an inquiry</Btn></div></Card>}
    </div>
  );
}
