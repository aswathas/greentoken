import React, { useEffect, useState } from 'react';
import Layout, { type NavId } from './components/Layout';
import Dashboard from './components/Dashboard';
import PlantTree from './components/PlantTree';
import Verify from './components/Verify';
import Discover from './components/Discover';
import Leaderboard from './components/Leaderboard';
import LedgerExplorer from './components/LedgerExplorer';
import Invoices from './components/Invoices';
import TokenDetail from './components/TokenDetail';
import { useStore } from './core/store';
import { PageTransition } from './motion';

const VALID: NavId[] = ['dashboard', 'plant', 'verify', 'discover', 'leaderboard', 'ledger', 'invoices'];

export default function App() {
  const { ready } = useStore();
  const [page, setPage] = useState<NavId>('dashboard');
  const [tokenId, setTokenId] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      const raw = window.location.hash.replace('#', '');
      if (raw.startsWith('token/')) {
        setTokenId(raw.split('/')[1]);
        return;
      }
      if (VALID.includes(raw as NavId)) setPage(raw as NavId);
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(p: NavId) {
    setPage(p);
    setTokenId(null);
    window.location.hash = p;
    window.scrollTo({ top: 0 });
  }

  function openToken(id: string) {
    setTokenId(id);
    window.location.hash = `token/${id}`;
    window.scrollTo({ top: 0 });
  }

  if (!ready) {
    return (
      <div className="boot">
        <div className="boot__leaf">🌳</div>
        <div className="boot__title">GreenToken</div>
        <div className="boot__sub">Booting the consortium · seeding genesis blocks…</div>
      </div>
    );
  }

  return (
    <Layout page={page} setPage={go}>
      <PageTransition pageKey={tokenId ? `token:${tokenId}` : page}>
        {tokenId ? (
          <TokenDetail tokenId={tokenId} onBack={() => go(page)} />
        ) : (
          <>
            {page === 'dashboard' && <Dashboard setPage={go} />}
            {page === 'plant' && <PlantTree />}
            {page === 'verify' && <Verify onOpen={openToken} />}
            {page === 'discover' && <Discover onOpen={openToken} />}
            {page === 'leaderboard' && <Leaderboard />}
            {page === 'ledger' && <LedgerExplorer />}
            {page === 'invoices' && <Invoices />}
          </>
        )}
      </PageTransition>
    </Layout>
  );
}
