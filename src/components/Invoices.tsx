import React from 'react';
import { useStore } from '../core/store';
import { Button, Card, EmptyState, HashPill, SectionTitle, Stat } from './ui';
import RoleGate from './RoleGate';

export default function Invoices() {
  const { invoices, current, settleFunding, tokens } = useStore();
  // Settlement is granted by the chaincode to funders AND auditors
  // (SettleFunding -> requireOrg(stub, ['FUNDER', 'AUDITOR'])). The UI gate
  // must not be stricter than the contract, or the auditor is locked out of a
  // capability the ledger actually grants them.
  const canSettle = current?.org === 'FUNDER' || current?.org === 'AUDITOR';

  const gross = invoices.reduce((s, i) => s + i.grossAmount, 0);
  const discount = invoices.reduce((s, i) => s + i.discountAmount, 0);
  const net = invoices.reduce((s, i) => s + i.netAmount, 0);
  const settled = invoices.filter((i) => i.status === 'SETTLED');

  return (
    <div className="grid grid--1">
      <div className="col-span-12 statrow">
        <Stat label="Invoices issued" value={invoices.length} tone="blue" />
        <Stat label="Gross value" value={`₹${gross.toLocaleString()}`} />
        <Stat label="Bulk discount saved" value={`₹${discount.toLocaleString()}`} tone="green" />
        <Stat label="Net disbursed" value={`₹${net.toLocaleString()}`} tone="gold" />
        <Stat label="Settled" value={`${settled.length} / ${invoices.length}`} tone="green" />
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle
            title="Invoices"
            sub="Each invoice bundles verified tokens, applies the bulk discount ladder and records the settlement to the planters."
            right={canSettle ? <span className="pill pill--ok">💰 Settlement authority active</span> : undefined}
          />

          {/* Dead end replaced: the contract accepts SettleFunding from funders AND
              auditors, so the gate lists both — and renders nothing at all for the
              auditor, who already holds settlement authority. */}
          <RoleGate
            action="Settling an invoice"
            allows={['FUNDER', 'AUDITOR']}
            reason="Settlement releases the money to the planters, so the contract accepts it only from the Corporate Green Funders or the Independent Carbon Auditor."
          />

          {invoices.length === 0 && <EmptyState title="No invoices yet" hint="Fund some verified tokens from Discover." />}

          <div className="invgrid">
            {invoices.map((inv) => {
              const covered = tokens.filter((t) => t.invoiceId === inv.invoiceId);
              return (
                <div key={inv.invoiceId} className={`invcard ${inv.status === 'SETTLED' ? 'is-settled' : ''}`}>
                  <div className="invcard__head">
                    <div>
                      <div className="invcard__id">{inv.invoiceId}</div>
                      <div className="invcard__funder">{inv.funderName}</div>
                    </div>
                    <span className={`badge badge--${inv.status === 'SETTLED' ? 'green' : 'amber'}`}>{inv.status}</span>
                  </div>

                  <div className="invcard__lines">
                    <div className="invoice__row">
                      <span>Tokens</span>
                      <strong>
                        {inv.tokenIds.length} ({inv.units} trees)
                      </strong>
                    </div>
                    <div className="invoice__row">
                      <span>Unit price</span>
                      <strong>₹{inv.pricePerToken}</strong>
                    </div>
                    <div className="invoice__row">
                      <span>Gross</span>
                      <strong>₹{inv.grossAmount.toLocaleString()}</strong>
                    </div>
                    <div className="invoice__row invoice__row--discount">
                      <span>Discount ({inv.discountPct}%)</span>
                      <strong>− ₹{inv.discountAmount.toLocaleString()}</strong>
                    </div>
                    <div className="invoice__row invoice__row--total">
                      <span>Net</span>
                      <strong>₹{inv.netAmount.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="invcard__tokens">
                    {covered.map((t) => (
                      <span key={t.tokenId} className="chip chip--sm">
                        {t.tokenId} · {t.count}×{t.species}
                      </span>
                    ))}
                  </div>

                  <div className="invcard__foot">
                    <span className="muted mono-xs">
                      {new Date(inv.issuedAt).toLocaleString()}
                      {inv.settledAt ? ` → ${new Date(inv.settledAt).toLocaleString()}` : ''}
                    </span>
                    {inv.status === 'ISSUED' && (
                      <Button
                        variant="soft"
                        small
                        disabled={!canSettle}
                        onClick={() => settleFunding(inv.invoiceId)}
                      >
                        Settle & release funds
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle title="How discounting is computed" sub="The invoice manager in the smart contract." />
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Units purchased</th>
                  <th>Discount</th>
                  <th>Example on ₹150/token</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { min: 1, pct: 0 },
                  { min: 50, pct: 5 },
                  { min: 200, pct: 10 },
                  { min: 500, pct: 15 },
                ].map((t) => (
                  <tr key={t.min}>
                    <td>{t.min}+</td>
                    <td>{t.pct}%</td>
                    <td>
                      {t.min} units → gross ₹{(t.min * 150).toLocaleString()}, net ₹
                      {Math.round(t.min * 150 * (1 - t.pct / 100)).toLocaleString()}
                    </td>
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
