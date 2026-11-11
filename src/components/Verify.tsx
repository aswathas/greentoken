import React, { useState } from 'react';
import { useStore } from '../core/store';
import { Button, Card, EmptyState, HashPill, Progress, SectionTitle, StatusBadge } from './ui';
import RoleGate from './RoleGate';
import { type TreeToken } from '../core/types';

export default function Verify({ onOpen }: { onOpen: (tokenId: string) => void }) {
  const { tokens, current, verifyPlanting } = useStore();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const canVerify = current?.org === 'VERIFIER' || current?.org === 'AUDITOR';
  const queue = tokens.filter((t) => t.status === 'PENDING');

  async function decide(token: TreeToken, verdict: 'APPROVE' | 'REJECT') {
    setBusy(token.tokenId);
    await verifyPlanting({
      tokenId: token.tokenId,
      verdict,
      note: notes[token.tokenId]?.trim() || (verdict === 'APPROVE' ? 'Proof verified on the ground.' : 'Proof did not satisfy verification criteria.'),
    });
    setBusy(null);
  }

  return (
    <div className="grid grid--1">
      <div className="col-span-12">
        <Card>
          <SectionTitle
            title="Verification queue"
            sub="Planting proofs awaiting independent review. Two separate endorsements are required before a token can be funded."
            right={
              canVerify ? (
                <span className="pill pill--ok">✓ You can endorse as {current?.orgName}</span>
              ) : undefined
            }
          />

          {/* Dead end replaced: instead of "switch to Forest Dept or Auditor", offer the
              switch itself — one click per eligible reviewer. Renders nothing for a
              verifier/auditor because the current identity already qualifies. */}
          <RoleGate
            action="Endorsing a planting proof"
            allows={['VERIFIER', 'AUDITOR']}
            reason="An endorsement is a signed field-review statement, so the contract only accepts one from the State Forest Department or the Independent Carbon Auditor — and never twice from the same organisation."
          />

          {queue.length === 0 && (
            <EmptyState
              title="Nothing pending — every proof has been reviewed"
              hint="Plant a new tree from the Planters Association identity to add one to this queue."
            />
          )}

          <div className="qgrid">
            {queue.map((t) => {
              const approvals = t.endorsements.filter((e) => e.verdict === 'APPROVE').length;
              return (
                <div key={t.tokenId} className="qcard">
                  <div className="qcard__head">
                    <img src={t.photo.dataUrl} alt="" className="qcard__thumb" />
                    <div className="qcard__title">
                      <div className="qcard__row">
                        <strong>
                          {t.count} × {t.species}
                        </strong>
                        <StatusBadge status={t.status} />
                      </div>
                      <em>
                        {t.planterName} · {t.district}, {t.state}
                      </em>
                      <span className="mono-xs">{t.tokenId}</span>
                    </div>
                  </div>

                  <div className="qcard__proof">
                    <div>
                      <span>Geo-stamp</span>
                      <code>
                        {t.geo.lat.toFixed(4)}, {t.geo.lng.toFixed(4)}
                      </code>
                      <em>±{t.geo.accuracyMeters} m accuracy</em>
                    </div>
                    <div>
                      <span>Photo hash</span>
                      <HashPill value={t.photo.sha256} />
                    </div>
                    <div>
                      <span>CO₂ estimate</span>
                      <strong>{t.estimatedCo2Kg} kg/yr</strong>
                    </div>
                  </div>

                  <div className="qcard__endorsements">
                    <div className="qcard__progline">
                      <span>Endorsements</span>
                      <strong>
                        {approvals} / {t.requiredEndorsements}
                      </strong>
                    </div>
                    <Progress value={approvals} max={t.requiredEndorsements} />
                    <div className="qcard__endorsers">
                      {t.endorsements.map((e) => (
                        <span key={e.by} className="chip">
                          {e.orgName} · {e.verdict}
                        </span>
                      ))}
                      {t.endorsements.length === 0 && <span className="chip chip--muted">No endorsements yet</span>}
                    </div>
                  </div>

                  {canVerify ? (
                    <div className="qcard__actions">
                      <input
                        placeholder="Review note (optional)"
                        value={notes[t.tokenId] ?? ''}
                        onChange={(e) => setNotes((n) => ({ ...n, [t.tokenId]: e.target.value }))}
                      />
                      <Button
                        variant="soft"
                        small
                        disabled={busy === t.tokenId}
                        onClick={() => decide(t, 'REJECT')}
                      >
                        ✕ Reject
                      </Button>
                      <Button
                        small
                        disabled={busy === t.tokenId}
                        onClick={() => decide(t, 'APPROVE')}
                      >
                        ✓ Endorse
                      </Button>
                    </div>
                  ) : (
                    <div className="qcard__actions qcard__actions--locked">
                      <span>🔒 Only the Forest Department and Independent Auditors may endorse — switch to one of them above</span>
                    </div>
                  )}

                  <button className="qcard__link" onClick={() => onOpen(t.tokenId)}>
                    View full provenance →
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle title="Already reviewed" sub="Approved, funded and rejected tokens." />
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Planter</th>
                  <th>Species</th>
                  <th>District</th>
                  <th>CO₂</th>
                  <th>Endorsements</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tokens
                  .filter((t) => t.status !== 'PENDING')
                  .map((t) => (
                    <tr key={t.tokenId} onClick={() => onOpen(t.tokenId)} className="table__row--click">
                      <td className="mono-xs">{t.tokenId}</td>
                      <td>{t.planterName}</td>
                      <td>
                        {t.count} × {t.species}
                      </td>
                      <td>{t.district}</td>
                      <td>{t.estimatedCo2Kg} kg</td>
                      <td>
                        {t.endorsements.filter((e) => e.verdict === 'APPROVE').length}/
                        {t.requiredEndorsements}
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
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
