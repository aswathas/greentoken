import React, { useMemo, useState } from 'react';
import { useStore } from '../core/store';
import { Card, SectionTitle, Stat } from './ui';

const TABS = ['Planters', 'Districts', 'Species'] as const;

interface Row {
  id: string;
  name: string;
  orgName?: string;
  tokens: number;
  trees: number;
  co2Kg: number;
  fundsReceived?: number;
}

export default function Leaderboard() {
  const { leaderboard, tokens, stats } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Planters');

  const byDistrict = useMemo<Row[]>(() => {
    const m = new Map<string, { trees: number; co2: number; tokens: number }>();
    for (const t of tokens) {
      if (t.status === 'REJECTED') continue;
      const e = m.get(t.district) ?? { trees: 0, co2: 0, tokens: 0 };
      e.trees += t.count;
      e.co2 += t.estimatedCo2Kg;
      e.tokens += 1;
      m.set(t.district, e);
    }
    return [...m.entries()]
      .map(([name, v]) => ({ id: `d-${name}`, name, trees: v.trees, co2Kg: v.co2, tokens: v.tokens }))
      .sort((a, b) => b.co2Kg - a.co2Kg);
  }, [tokens]);

  const bySpecies = useMemo<Row[]>(() => {
    const m = new Map<string, { trees: number; co2: number; tokens: number }>();
    for (const t of tokens) {
      if (t.status === 'REJECTED') continue;
      const e = m.get(t.species) ?? { trees: 0, co2: 0, tokens: 0 };
      e.trees += t.count;
      e.co2 += t.estimatedCo2Kg;
      e.tokens += 1;
      m.set(t.species, e);
    }
    return [...m.entries()]
      .map(([name, v]) => ({ id: `s-${name}`, name, trees: v.trees, co2Kg: v.co2, tokens: v.tokens }))
      .sort((a, b) => b.co2Kg - a.co2Kg);
  }, [tokens]);

  const rows: Row[] = tab === 'Planters' ? leaderboard : tab === 'Districts' ? byDistrict : bySpecies;
  const maxCo2 = Math.max(1, ...rows.map((r) => r.co2Kg));

  const podium = leaderboard.slice(0, 3);

  return (
    <div className="grid grid--1">
      <div className="col-span-12">
        <Card>
          <SectionTitle
            title="Leaderboard"
            sub="Every number below is derived from ledger state — a planter cannot inflate their own score, because the endorsements live on chain."
          />
          <div className="podium">
            {podium.map((p, i) => (
              <div key={p.id} className={`podium__item podium__item--${i + 1}`}>
                <div className="podium__medal">{['🥇', '🥈', '🥉'][i]}</div>
                <div className="podium__name">{p.name}</div>
                <div className="podium__org">{p.orgName}</div>
                <div className="podium__val">{(p.co2Kg / 1000).toFixed(2)} t CO₂</div>
                <div className="podium__sub">
                  {p.trees} trees · {p.tokens} token(s)
                </div>
                {p.fundsReceived > 0 && (
                  <div className="podium__money">₹{p.fundsReceived.toLocaleString()} received</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-span-12 statrow">
        <Stat label="Total tokens" value={stats?.totalTokens ?? 0} tone="green" />
        <Stat label="Trees planted" value={(stats?.totalTrees ?? 0).toLocaleString()} />
        <Stat label="CO₂ sequestered" value={`${((stats?.totalCo2Kg ?? 0) / 1000).toFixed(1)} t`} tone="green" />
        <Stat label="Funds disbursed" value={`₹${(stats?.totalFunding ?? 0).toLocaleString()}`} tone="gold" />
      </div>

      <div className="col-span-12">
        <Card>
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t} className={`tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{tab === 'Planters' ? 'Planter' : 'Name'}</th>
                  {tab === 'Planters' && <th>Organisation</th>}
                  <th>Tokens</th>
                  <th>Trees</th>
                  <th>CO₂ (kg/yr)</th>
                  <th style={{ width: '30%' }}>Relative</th>
                  {tab === 'Planters' && <th>Funds received</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`medal ${i < 3 ? 'medal--top' : ''}`}>{i + 1}</span>
                    </td>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    {r.orgName && <td className="muted">{r.orgName}</td>}
                    <td>{r.tokens}</td>
                    <td>{r.trees}</td>
                    <td>{r.co2Kg}</td>
                    <td>
                      <div className="bar__track">
                        <div className="bar__fill" style={{ width: `${(r.co2Kg / maxCo2) * 100}%` }} />
                      </div>
                    </td>
                    {r.fundsReceived !== undefined && (
                      <td className="money">₹{r.fundsReceived.toLocaleString()}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
