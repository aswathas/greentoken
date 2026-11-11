import React from 'react';
import { useStore } from '../core/store';
import { Card, SectionTitle, Stat, StatusBadge, HashPill, EmptyState, Button } from './ui';
import TreeMap from './TreeMap';
import { type NavId } from './Layout';
import { CARBON_PER_SPECIES } from '../core/chaincode';
import { Ambient, GrowthScene, IntegrityRing, Reveal, Stagger, StaggerItem } from '../motion';

/** Worker base URL — override with VITE_API_BASE at build time. */
const API_BASE = (
  import.meta.env.VITE_API_BASE || 'https://greentoken-api.aswathas13.workers.dev'
).replace(/\/+$/, '');

interface BackendHealth {
  ok?: boolean;
  channel?: string;
  blocks?: number;
  tokens?: number;
}

type NetworkState =
  | { status: 'loading' }
  | { status: 'online'; health: BackendHealth }
  | { status: 'offline' };

export default function Dashboard({ setPage }: { setPage: (p: NavId) => void }) {
  const { stats, tokens, events, leaderboard, participants, chainValid } = useStore();
  const [network, setNetwork] = React.useState<NetworkState>({ status: 'loading' });

  /* Ping the Worker once on mount so the card can report the real backend. */
  React.useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
        if (!res.ok) throw new Error(`health check returned ${res.status}`);
        const health = (await res.json()) as BackendHealth;
        if (!cancelled) setNetwork({ status: 'online', health });
      } catch {
        if (!cancelled) setNetwork({ status: 'offline' });
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const speciesTotals = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tokens) {
      if (t.status === 'REJECTED') continue;
      m.set(t.species, (m.get(t.species) ?? 0) + t.count);
    }
    const max = Math.max(1, ...m.values());
    return [...m.entries()]
      .map(([species, trees]) => ({ species, trees, pct: (trees / max) * 100 }))
      .sort((a, b) => b.trees - a.trees);
  }, [tokens]);

  const topPlanters = leaderboard.slice(0, 5);

  /* ---------------- network card content ---------------- */

  const netHeadline =
    network.status === 'online'
      ? 'Cloudflare Worker connected'
      : network.status === 'offline'
        ? 'Offline mode — running on the in-browser ledger'
        : 'Connecting…';

  const netDetail =
    network.status === 'online'
      ? 'The Durable Object is answering on Cloudflare’s edge network and ordering every transaction for this channel.'
      : network.status === 'offline'
        ? 'The Worker did not answer in time — the browser ledger keeps every transaction locally and the hash chain stays verifiable.'
        : 'Contacting the Worker health endpoint…';

  const netPill = network.status === 'online' ? 'Live' : network.status === 'offline' ? 'Offline' : 'Connecting…';
  const netPillTone = network.status === 'online' ? 'pill--ok' : network.status === 'offline' ? 'pill--warn' : '';
  const netDot = network.status === 'online' ? 'dot--ok' : network.status === 'offline' ? 'dot--warn' : 'dot--wait';

  const netFacts =
    network.status === 'online'
      ? [
          { label: 'Channel', value: network.health.channel ?? 'greentoken-channel' },
          { label: 'Blocks', value: String(network.health.blocks ?? 0) },
          { label: 'Tokens', value: String(network.health.tokens ?? 0) },
        ]
      : network.status === 'offline'
        ? [
            { label: 'Ledger', value: 'browser' },
            { label: 'Blocks', value: String(stats?.blockHeight ?? 0) },
            { label: 'Tokens', value: String(stats?.totalTokens ?? 0) },
          ]
        : [
            { label: 'Channel', value: '—' },
            { label: 'Blocks', value: '—' },
            { label: 'Tokens', value: '—' },
          ];

  return (
    <div className="grid grid--dash">
      <div className="col-span-12">
        <Card className="hero">
          <Ambient className="hero__ambient" />
          <div className="hero__left">
            <div className="hero__eyebrow">Unit 5 · Blockchain Technology with Hyperledger Fabric</div>
            <Reveal>
              <h1 className="hero__title">
                Plant it. Prove it. <span className="grad">Tokenise it.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="hero__sub">
                GreenToken turns a geo-stamped planting photo into a tamper-evident carbon token.
                Independent verifiers endorse the proof, funders discover real plantings on the map and
                fund them with a discounted invoice — all recorded on a hash-linked ledger.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="hero__cta">
                <Button onClick={() => setPage('plant')}>🌱 Plant a tree</Button>
                <Button variant="soft" onClick={() => setPage('discover')}>
                  🔍 Explore verified tokens
                </Button>
                <Button variant="ghost" onClick={() => setPage('ledger')}>
                  ⛓ Inspect the ledger
                </Button>
              </div>
            </Reveal>
          </div>
          <div className="hero__right">
            <GrowthScene className="hero__scene" />
            <IntegrityRing
              valid={chainValid}
              label={chainValid ? 'Ledger intact' : 'Tamper detected'}
              sub={`${stats?.blockHeight ?? 0} blocks · ${stats?.blockHeight ?? 0} endorsements verified`}
            />
          </div>
        </Card>
      </div>

      <div className="col-span-12 statrow">
        <Stagger className="statrow__inner" stagger={0.05}>
          <StaggerItem>
            <Stat label="Tokens minted" value={stats?.totalTokens ?? 0} hint="proposed plantings on chain" tone="green" />
          </StaggerItem>
          <StaggerItem>
            <Stat label="Verified" value={stats?.verifiedTokens ?? 0} hint="passed independent review" tone="green" />
          </StaggerItem>
          <StaggerItem>
            <Stat label="Funded" value={stats?.fundedTokens ?? 0} hint="bought by corporate funders" tone="blue" />
          </StaggerItem>
          <StaggerItem>
            <Stat label="Trees planted" value={stats?.totalTrees ?? 0} hint="across the consortium" />
          </StaggerItem>
          <StaggerItem>
            <Stat
              label="CO₂ sequestered"
              value={(stats?.totalCo2Kg ?? 0) / 1000}
              countProps={{ decimals: 1, suffix: ' t' }}
              hint="kg × 1,000 · annual estimate"
              tone="green"
            />
          </StaggerItem>
          <StaggerItem>
            <Stat
              label="Funds disbursed"
              value={stats?.totalFunding ?? 0}
              countProps={{ prefix: '₹' }}
              hint="settled to planters"
              tone="gold"
            />
          </StaggerItem>
        </Stagger>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle
            title="Network"
            sub="Live status of the Cloudflare Worker that hosts the consortium channel."
            right={<span className={`pill ${netPillTone}`}>{netPill}</span>}
          />
          <div className={`netcard ${network.status === 'offline' ? 'netcard--offline' : ''}`}>
            <div className="netcard__state">
              <span className={`dot ${netDot}`} />
              <div className="netcard__label">
                <strong>{netHeadline}</strong>
                <em>{netDetail}</em>
              </div>
            </div>
            <div className="netcard__facts">
              {netFacts.map((f) => (
                <div key={f.label} className="netcard__fact">
                  <span>{f.label}</span>
                  <strong>{f.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="chainpill netcard__endpoint">
            <span className={`dot ${netDot}`} />
            <div>
              <div className="chainpill__title">{API_BASE}</div>
              <div className="chainpill__sub">GET /api/health · probed once on every page load</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-7">
        <Card>
          <SectionTitle
            title="Where the trees are"
            sub="Every token carries a GPS-verified planting coordinate. Click a marker to inspect the proof."
          />
          <TreeMap tokens={tokens} height={360} onSelect={() => setPage('discover')} />
        </Card>
      </div>

      <div className="col-span-5">
        <Card className="feedcard">
          <SectionTitle
            title="Live chaincode events"
            sub="Emitted on every state transition — the same event stream Fabric publishes to clients."
          />
          <div className="feed">
            {events.length === 0 && <EmptyState title="No events yet" hint="Plant a tree to see the ledger react." />}
            {events.slice(0, 14).map((e, i) => (
              <div key={`${e.txId}-${i}`} className="feed__row">
                <span className={`feed__tag feed__tag--${e.name.toLowerCase()}`}>{e.name}</span>
                <span className="feed__text">{describeEvent(e.name, e.payload)}</span>
                <span className="feed__time">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-span-7">
        <Card>
          <SectionTitle title="Trees by species" sub="Which species the consortium is actually putting in the ground." />
          <div className="bars">
            {speciesTotals.map((s) => (
              <div key={s.species} className="bar">
                <div className="bar__label">
                  <span>{s.species}</span>
                  <em>{s.trees} trees</em>
                </div>
                <div className="bar__track">
                  <div className="bar__fill" style={{ width: `${s.pct}%` }} />
                </div>
                <div className="bar__co2">
                  {(CARBON_PER_SPECIES[s.species] ?? 20) * s.trees} kg CO₂/yr
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="col-span-5">
        <Card>
          <SectionTitle title="Top planters" sub="Ranked by estimated CO₂ sequestered." />
          <div className="ranks">
            {topPlanters.map((p, i) => (
              <div key={p.id} className="rank">
                <span className="rank__no">{i + 1}</span>
                <span className="rank__name">
                  <strong>{p.name}</strong>
                  <em>{p.trees} trees · {p.tokens} token(s)</em>
                </span>
                <span className="rank__val">{(p.co2Kg / 1000).toFixed(1)} t</span>
              </div>
            ))}
            {topPlanters.length === 0 && <EmptyState title="No planters yet" />}
          </div>
          <Button variant="soft" full onClick={() => setPage('leaderboard')}>
            View full leaderboard →
          </Button>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle title="The consortium" sub="Four organisations sharing one channel. Each signs its own transactions." />
          <div className="orggrid">
            {['PLANTER', 'VERIFIER', 'AUDITOR', 'FUNDER'].map((org) => {
              const people = participants.filter((p) => p.org === org);
              if (!people.length) return null;
              return (
                <div key={org} className={`orgcard orgcard--${org.toLowerCase()}`}>
                  <div className="orgcard__name">{people[0].orgName}</div>
                  <div className="orgcard__msp">{org === 'PLANTER' ? 'PlantersAssociationMSP' : org === 'VERIFIER' ? 'ForestDeptMSP' : org === 'AUDITOR' ? 'AuditorMSP' : 'CorporateFundersMSP'}</div>
                  <ul className="orgcard__list">
                    {people.map((p) => (
                      <li key={p.id}>
                        <span>{p.name}</span>
                        <em>{p.role}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <SectionTitle title="How a token moves" sub="The full lifecycle implemented by the smart contract." />
          <div className="flow">
            {[
              { icon: '🌱', t: '1 · Plant', d: 'Planter submits species, count, geo-stamp and a photo. SHA-256 of both is written to the ledger. Token is PENDING.' },
              { icon: '✓', t: '2 · Verify', d: 'Two independent reviewers (Forest Dept / Auditor) inspect the proof and endorse with a digital signature.' },
              { icon: '🪙', t: '3 · Mint', d: 'At quorum of 2 approvals the token becomes VERIFIED and mintable — a transferable blue-green credit.' },
              { icon: '🔍', t: '4 · Discover', d: 'Funders browse verified tokens on the map — real coordinates, real species, real planters.' },
              { icon: '🧾', t: '5 · Fund', d: 'Funder buys a basket. The invoice applies a bulk discount and settles to the planter.' },
              { icon: '🏆', t: '6 · Rank', d: 'The leaderboard is derived from the ledger — nobody can inflate their own carbon number.' },
            ].map((s) => (
              <div key={s.t} className="flow__step">
                <div className="flow__icon">{s.icon}</div>
                <div className="flow__t">{s.t}</div>
                <div className="flow__d">{s.d}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function describeEvent(name: string, payload: Record<string, unknown>): string {
  switch (name) {
    case 'PlantTree':
      return `${payload.planter} planted ${payload.count} × ${payload.species} in ${payload.district}`;
    case 'VerifyPlanting':
      return `${payload.verifier} ${String(payload.verdict).toLowerCase()}d ${payload.tokenId} (${payload.approvals}/${payload.required})`;
    case 'FundTokens':
      return `${payload.funder} funded ${payload.units} token(s) — ₹${payload.netAmount} net after ${payload.discountPct}% discount`;
    case 'SettleFunding':
      return `Invoice ${payload.invoiceId} settled — ₹${payload.netAmount} released to ${payload.beneficiaries} planter(s)`;
    default:
      return name;
  }
}
