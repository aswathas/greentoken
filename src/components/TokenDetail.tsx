import React from 'react';
import { useStore } from '../core/store';
import { Card, HashPill, SectionTitle, StatusBadge, Button } from './ui';
import { type TreeToken } from '../core/types';

export default function TokenDetail({
  tokenId,
  onBack,
}: {
  tokenId: string;
  onBack: () => void;
}) {
  const { tokens, ledger } = useStore();
  const token = tokens.find((t) => t.tokenId === tokenId);

  if (!token) {
    return (
      <Card>
        <SectionTitle title="Token not found" />
        <Button variant="soft" onClick={onBack}>← Back</Button>
      </Card>
    );
  }

  const txs = (ledger?.blocks ?? [])
    .flatMap((b) => b.txs.map((tx) => ({ tx, block: b.number })))
    .filter(({ tx }) => {
      const p = tx.payload as Record<string, unknown>;
      return p.tokenId === token.tokenId || (tx.payload as any).tokenIds?.includes(token.tokenId);
    });

  const approvalEndorsements = token.endorsements.filter((e) => e.verdict === 'APPROVE');

  return (
    <div className="grid grid--2">
      <div className="col-span-7">
        <Card>
          <div className="tdhead">
            <div>
              <div className="tdhead__id mono-xs">{token.tokenId}</div>
              <h2 className="tdhead__title">
                {token.count} × {token.species}
              </h2>
              <div className="tdhead__sub">
                {token.planterName} · {token.planterOrg} · {token.district}, {token.state}
              </div>
            </div>
            <StatusBadge status={token.status} />
          </div>

          <img className="tdphoto" src={token.photo.dataUrl} alt="Planting proof" />

          <div className="kvgrid">
            <div>
              <span>Species</span>
              <strong>{token.species}</strong>
            </div>
            <div>
              <span>Trees</span>
              <strong>{token.count}</strong>
            </div>
            <div>
              <span>CO₂ / year</span>
              <strong>{token.estimatedCo2Kg} kg</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{token.status}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{new Date(token.createdAt).toLocaleString()}</strong>
            </div>
            <div>
              <span>Invoice</span>
              <strong>{token.invoiceId ?? '—'}</strong>
            </div>
          </div>

          <div className="tdblock">
            <h3>Geo-stamp proof</h3>
            <div className="kvgrid kvgrid--2">
              <div>
                <span>Latitude</span>
                <strong>{token.geo.lat.toFixed(6)}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{token.geo.lng.toFixed(6)}</strong>
              </div>
              <div>
                <span>Accuracy</span>
                <strong>±{token.geo.accuracyMeters} m</strong>
              </div>
              <div>
                <span>Captured</span>
                <strong>{new Date(token.geo.capturedAt).toLocaleString()}</strong>
              </div>
            </div>
            <div className="tdhash">
              <span>geoHash — SHA-256 of the coordinate payload</span>
              <HashPill value={token.geo.geoHash} full />
            </div>
          </div>

          <div className="tdblock">
            <h3>Photo proof</h3>
            <div className="kvgrid kvgrid--2">
              <div>
                <span>Size</span>
                <strong>{(token.photo.byteLength / 1024).toFixed(1)} KB</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{token.photo.mimeType}</strong>
              </div>
            </div>
            <div className="tdhash">
              <span>photoHash — SHA-256 of the image bytes</span>
              <HashPill value={token.photo.sha256} full />
            </div>
          </div>

          <Button variant="soft" onClick={onBack}>← Back to list</Button>
        </Card>
      </div>

      <div className="col-span-5">
        <Card>
          <SectionTitle
            title="Endorsements"
            sub={`${approvalEndorsements.length} of ${token.requiredEndorsements} required. Each carries an ECDSA signature from the endorsing organisation.`}
          />
          {token.endorsements.length === 0 && <p className="muted">No endorsements yet — awaiting review.</p>}
          <div className="endorselist">
            {token.endorsements.map((e) => (
              <div key={e.by} className="endorse">
                <div className="endorse__top">
                  <span className={`endorse__verdict endorse__verdict--${e.verdict.toLowerCase()}`}>
                    {e.verdict === 'APPROVE' ? '✓' : '✕'} {e.verdict}
                  </span>
                  <strong>{e.orgName}</strong>
                </div>
                <em>{e.note}</em>
                <div className="endorse__meta">
                  <span>{new Date(e.endorsedAt).toLocaleString()}</span>
                </div>
                <div className="endorse__sig">
                  <span>Signature</span>
                  <HashPill value={e.signature} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt">
          <SectionTitle title="Ledger trail" sub="Every state change for this token." />
          <div className="trail">
            {txs.length === 0 && <p className="muted">No transactions found.</p>}
            {txs.map(({ tx, block }) => (
              <div key={tx.txId} className="trail__item">
                <div className="trail__head">
                  <span className={`feed__tag feed__tag--${tx.type.toLowerCase()}`}>{tx.type}</span>
                  <span className="trail__block">block #{block}</span>
                </div>
                <div className="trail__meta">
                  {tx.actorName} · {new Date(tx.timestamp).toLocaleString()}
                </div>
                <div className="trail__hash">
                  <HashPill value={tx.txHash} label="txHash" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt">
          <SectionTitle title="Raw token (readable)" sub="Exactly what a verifier would read off the chain." />
          <pre className="json">{JSON.stringify(readableToken(token), null, 2)}</pre>
        </Card>
      </div>
    </div>
  );
}

/** The public, privacy-preserving view of the token (contact excluded). */
function readableToken(t: TreeToken) {
  return {
    tokenId: t.tokenId,
    status: t.status,
    species: t.species,
    trees: t.count,
    estimatedCo2Kg: t.estimatedCo2Kg,
    planter: { id: t.planterId, name: t.planterName, org: t.planterOrg },
    location: {
      district: t.district,
      state: t.state,
      lat: t.geo.lat,
      lng: t.geo.lng,
      accuracyMeters: t.geo.accuracyMeters,
      geoHash: t.geo.geoHash,
    },
    evidence: { photoHash: t.photo.sha256, photoBytes: t.photo.byteLength },
    endorsements: t.endorsements.map((e) => ({
      by: e.orgName,
      verdict: e.verdict,
      at: e.endorsedAt,
      signature: e.signature.slice(0, 24) + '…',
    })),
    invoiceId: t.invoiceId ?? null,
    privateFieldsWithheld: ['planterContact'],
  };
}
