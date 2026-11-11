import React, { useState } from 'react';
import { useStore } from '../core/store';
import { Button, Card, HashPill, SectionTitle } from './ui';

export default function LedgerExplorer() {
  const { ledger, chainValid, tamper, restore, resetDemo, stats } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<{ valid: boolean; brokenAt?: number; reason?: string } | null>(null);

  const blocks = ledger?.blocks ?? [];

  async function runVerify() {
    setChecking(true);
    const res = await ledger!.verifyChain();
    setReport(res);
    setChecking(false);
  }

  async function doTamper(blockNumber: number) {
    await tamper(blockNumber, 'payload');
    const res = await ledger!.verifyChain();
    setReport(res);
  }

  async function doRestore() {
    await restore();
    const res = await ledger!.verifyChain();
    setReport(res);
  }

  return (
    <div className="grid grid--1">
      <div className="col-span-12">
        <Card className={chainValid ? 'integritycard' : 'integritycard integritycard--bad'}>
          <div className="integritycard__left">
            <div className={`integrity__ring ${chainValid ? '' : 'is-bad'}`} />
            <div>
              <div className="integritycard__title">
                {chainValid ? '✓ Chain integrity verified' : '⛔ Tampering detected'}
              </div>
              <div className="integritycard__sub">
                {report?.reason ??
                  `Every one of the ${blocks.length} blocks was re-hashed from scratch — Merkle roots, transaction hashes and the chain of previous-hash links all match.`}
              </div>
              {report && !report.valid && (
                <div className="integritycard__break">
                  First broken block: <strong>#{report.brokenAt}</strong>
                </div>
              )}
            </div>
          </div>
          <div className="integritycard__actions">
            <Button variant="soft" onClick={runVerify} disabled={checking}>
              {checking ? 'Verifying…' : '🔍 Re-verify chain'}
            </Button>
            {blocks.length > 0 && (
              <Button variant="danger" onClick={() => doTamper(blocks[blocks.length - 1].number)}>
                ⚠ Tamper with last block
              </Button>
            )}
            <Button variant="ghost" onClick={doRestore}>
              ↺ Restore chain
            </Button>
          </div>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle
            title="How tamper-evidence works here"
            sub="This is the Unit-5 'cryptography and security on blockchain' requirement, demonstrated live."
          />
          <div className="cryptoexplain">
            <div className="cryptoexplain__step">
              <span>1</span>
              <div>
                <strong>Transaction hash</strong>
                <code>txHash = SHA-256(txId | type | payloadHash | timestamp)</code>
                <p>Edit any field of a transaction and its hash no longer reproduces.</p>
              </div>
            </div>
            <div className="cryptoexplain__step">
              <span>2</span>
              <div>
                <strong>Merkle root</strong>
                <code>merkleRoot = Merkle(txHashes)</code>
                <p>All transaction hashes in a block are folded into one root — a single altered tx breaks it.</p>
              </div>
            </div>
            <div className="cryptoexplain__step">
              <span>3</span>
              <div>
                <strong>Block header</strong>
                <code>hash = SHA-256(prevHash | merkleRoot | number | timestamp)</code>
                <p>The header hash commits to the previous block, so edits cascade down the chain.</p>
              </div>
            </div>
            <div className="cryptoexplain__step">
              <span>4</span>
              <div>
                <strong>Block signature</strong>
                <code>ECDSA P-256 signature by the ordering service</code>
                <p>Only the ordering organisation can produce a validly signed block.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle
            title={`Blocks — height ${blocks.length}`}
            sub="Genesis block onward. Each block lists the transactions it ordered."
            right={
              <Button variant="ghost" small onClick={resetDemo}>
                ↺ Reset demo
              </Button>
            }
          />
          <div className="blocks">
            {blocks
              .slice()
              .reverse()
              .map((b) => {
                const isOpen = open === b.number;
                return (
                  <div key={b.number} className={`block ${isOpen ? 'is-open' : ''}`}>
                    <button className="block__head" onClick={() => setOpen(isOpen ? null : b.number)}>
                      <span className="block__no">#{b.number}</span>
                      <span className="block__meta">
                        <strong>{b.txs.length} transaction(s)</strong>
                        <em>{new Date(b.timestamp).toLocaleString()}</em>
                      </span>
                      <span className="block__hashes">
                        <HashPill value={b.hash} label="hash" static />
                      </span>
                      <span className="block__chev">{isOpen ? '▾' : '▸'}</span>
                    </button>

                    {isOpen && (
                      <div className="block__body">
                        <div className="block__kv">
                          <div>
                            <span>Previous hash</span>
                            <HashPill value={b.prevHash} full />
                          </div>
                          <div>
                            <span>Merkle root</span>
                            <HashPill value={b.merkleRoot} full />
                          </div>
                          <div>
                            <span>Ordering service signature</span>
                            <HashPill value={b.signature} full />
                          </div>
                          <div>
                            <span>Signed by</span>
                            <strong>{b.signerOrg} (Consortium Ordering Service)</strong>
                          </div>
                        </div>

                        <div className="block__txs">
                          {b.txs.map((tx) => (
                            <div key={tx.txId} className="tx">
                              <div className="tx__head">
                                <span className={`feed__tag feed__tag--${tx.type.toLowerCase()}`}>{tx.type}</span>
                                <strong>{tx.actorName}</strong>
                                <em>{new Date(tx.timestamp).toLocaleString()}</em>
                              </div>
                              <div className="tx__hashes">
                                <HashPill value={tx.txHash} label="txHash" />
                                <HashPill value={tx.payloadHash} label="payload" />
                              </div>
                              {tx.endorsements.length > 0 && (
                                <div className="tx__endorse">
                                  ✓ Endorsed by {tx.endorsements.map((e) => e.org).join(', ')} with an ECDSA signature
                                </div>
                              )}
                              <pre className="json json--sm">{JSON.stringify(tx.payload, null, 2)}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
}
