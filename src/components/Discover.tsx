import React, { useMemo, useState } from 'react';
import { useStore } from '../core/store';
import { Button, Card, EmptyState, HashPill, SectionTitle, StatusBadge } from './ui';
import RoleGate from './RoleGate';
import TreeMap from './TreeMap';
import { discountForUnits, BASE_PRICE_INR } from '../core/chaincode';
import { type TreeToken } from '../core/types';

export default function Discover({ onOpen }: { onOpen: (id: string) => void }) {
  const { tokens, current, fundTokens } = useStore();
  const [status, setStatus] = useState<string>('VERIFIED');
  const [district, setDistrict] = useState('');
  const [species, setSpecies] = useState('');
  const [q, setQ] = useState('');
  const [basket, setBasket] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isFunder = current?.org === 'FUNDER';

  const districts = useMemo(
    () => [...new Set(tokens.map((t) => t.district))].sort(),
    [tokens],
  );
  const speciesList = useMemo(
    () => [...new Set(tokens.map((t) => t.species))].sort(),
    [tokens],
  );

  const filtered = useMemo(
    () =>
      tokens.filter((t) => {
        if (status !== 'ALL' && t.status !== status) return false;
        if (district && t.district !== district) return false;
        if (species && t.species !== species) return false;
        if (q) {
          const hay = `${t.tokenId} ${t.planterName} ${t.district} ${t.state} ${t.species}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [tokens, status, district, species, q],
  );

  const selected = tokens.filter((t) => basket.includes(t.tokenId));
  const units = selected.reduce((s, t) => s + t.count, 0);
  const gross = units * BASE_PRICE_INR;
  const pct = discountForUnits(units);
  const discount = Math.round((gross * pct) / 100);
  const net = gross - discount;

  function toggle(t: TreeToken) {
    if (t.status !== 'VERIFIED') return;
    setBasket((b) => (b.includes(t.tokenId) ? b.filter((x) => x !== t.tokenId) : [...b, t.tokenId]));
  }

  async function fund() {
    setBusy(true);
    await fundTokens({
      tokenIds: basket,
      units,
      pricePerToken: BASE_PRICE_INR,
      funderId: current!.id,
      funderName: current!.name,
    });
    setBusy(false);
    setBasket([]);
  }

  return (
    <div className="grid grid--1">
      <div className="col-span-12">
        <Card>
          <SectionTitle
            title="Discover verified plantings"
            sub="Funders can see exactly what they are buying: species, planter, GPS coordinates and photo hash — all readable straight off the ledger."
            right={
              isFunder ? (
                <span className="pill pill--ok">💰 Funding as {current?.name}</span>
              ) : undefined
            }
          />

          {/* Dead end replaced: the contract only lets a Corporate Green Funder issue an
              invoice, so offer the eligible funders as one-click switches. Renders
              nothing for a funder — the current identity already qualifies. */}
          <RoleGate
            action="Funding verified tokens"
            allows={['FUNDER']}
            reason="Funding commits the funder to pay the planters once the token is verified, so the contract only lets a Corporate Green Funder issue the invoice."
          />

          <div className="filters">
            <input
              placeholder="Search token, planter, district…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="FUNDED">Funded</option>
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={species} onChange={(e) => setSpecies(e.target.value)}>
              <option value="">All species</option>
              {speciesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="filters__count">{filtered.length} token(s)</div>
          </div>

          <TreeMap tokens={filtered} height={340} highlightIds={basket} onSelect={onOpen} />
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle title="Token marketplace" sub="Tick VERIFIED tokens to add them to a funding basket." />
          <div className="tgrid">
            {filtered.map((t) => {
              const picked = basket.includes(t.tokenId);
              return (
                <div
                  key={t.tokenId}
                  className={`tcard ${picked ? 'is-picked' : ''} ${t.status !== 'VERIFIED' ? 'is-locked' : ''}`}
                >
                  <div className="tcard__media" onClick={() => onOpen(t.tokenId)}>
                    <img src={t.photo.dataUrl} alt="" />
                    <div className="tcard__overlay">
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  <div className="tcard__body">
                    <div className="tcard__row">
                      <strong>
                        {t.count} × {t.species}
                      </strong>
                      <span className="tcard__co2">{t.estimatedCo2Kg} kg</span>
                    </div>
                    <em>
                      {t.planterName} · {t.district}, {t.state}
                    </em>
                    <div className="tcard__meta">
                      <span>📍 {t.geo.lat.toFixed(3)}, {t.geo.lng.toFixed(3)}</span>
                      <span>±{t.geo.accuracyMeters} m</span>
                    </div>
                    <div className="tcard__hash">
                      <HashPill value={t.photo.sha256} label="photo" />
                    </div>
                    {t.status === 'VERIFIED' && (
                      <button className="tcard__pick" onClick={() => toggle(t)}>
                        {picked ? '✓ In basket' : '+ Add to basket'}
                      </button>
                    )}
                    {t.status === 'FUNDED' && <div className="tcard__funded">Funded · invoice {t.invoiceId}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <EmptyState
              title="No tokens match these filters"
              hint="Switch the status filter to “All statuses” to see verified, pending and funded tokens."
            />
          )}
        </Card>
      </div>

      <div className="col-span-12">
        <Card className={basket.length ? 'basket basket--active' : 'basket'}>
          <SectionTitle
            title="Funding basket"
            sub="The FundTokens function issues one invoice for the whole basket and applies the bulk discount ladder."
          />
          {basket.length === 0 ? (
            <p className="muted">Basket is empty — select VERIFIED tokens above.</p>
          ) : (
            <>
              <div className="basket__items">
                {selected.map((t) => (
                  <span key={t.tokenId} className="chip">
                    {t.count} × {t.species} · {t.district}{' '}
                    <button onClick={() => toggle(t)} aria-label="remove">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="invoice">
                <div className="invoice__row">
                  <span>Tokens</span>
                  <strong>{basket.length}</strong>
                </div>
                <div className="invoice__row">
                  <span>Trees covered</span>
                  <strong>{units}</strong>
                </div>
                <div className="invoice__row">
                  <span>Unit price</span>
                  <strong>₹{BASE_PRICE_INR} / token</strong>
                </div>
                <div className="invoice__row">
                  <span>Gross</span>
                  <strong>₹{gross.toLocaleString()}</strong>
                </div>
                <div className="invoice__row invoice__row--discount">
                  <span>Bulk discount ({pct}%)</span>
                  <strong>− ₹{discount.toLocaleString()}</strong>
                </div>
                <div className="invoice__row invoice__row--total">
                  <span>Net payable</span>
                  <strong>₹{net.toLocaleString()}</strong>
                </div>
                <div className="invoice__note">
                  Discount ladder: 50+ units → 5% · 200+ → 10% · 500+ → 15%
                </div>
                <Button
                  full
                  variant="gold"
                  disabled={!isFunder || busy}
                  onClick={fund}
                >
                  {busy ? 'Issuing invoice…' : `🧾 Issue invoice & fund ${units} token(s)`}
                </Button>
                {!isFunder && (
                  <div className="invoice__warn">
                    The contract will reject this unless you act as a Corporate Green Funder — use
                    the one-click switch above to become one.
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
