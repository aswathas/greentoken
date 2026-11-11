import React, { useEffect, useState } from 'react';
import { useStore } from '../core/store';
import { type OrgId } from '../core/types';

export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'plant', label: 'Plant a Tree', icon: '🌱' },
  { id: 'verify', label: 'Verification', icon: '✓' },
  { id: 'discover', label: 'Discover & Fund', icon: '🔍' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'ledger', label: 'Ledger Explorer', icon: '⛓' },
  { id: 'invoices', label: 'Invoices', icon: '🧾' },
] as const;

export type NavId = (typeof NAV)[number]['id'];

const ORG_ORDER: OrgId[] = ['PLANTER', 'VERIFIER', 'AUDITOR', 'FUNDER'];

const ORG_LABEL: Record<OrgId, string> = {
  PLANTER: 'Planters',
  VERIFIER: 'Forest Dept',
  AUDITOR: 'Auditors',
  FUNDER: 'Funders',
};

export default function Layout({
  page,
  setPage,
  children,
}: {
  page: NavId;
  setPage: (p: NavId) => void;
  children: React.ReactNode;
}) {
  const { participants, current, switchTo, toasts, dismissToast, stats, chainValid } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const grouped = ORG_ORDER.map((org) => ({
    org,
    people: participants.filter((p) => p.org === org),
  })).filter((g) => g.people.length > 0);

  const pending = stats?.pendingTokens ?? 0;

  // While the drawer is open the page behind it must not scroll, and Escape
  // must close it — both are expected behaviour on a phone.
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [navOpen]);

  const navList = (
    <nav className="nav">
      {NAV.map((item) => (
        <button
          key={item.id}
          className={`nav__item ${page === item.id ? 'is-active' : ''}`}
          onClick={() => {
            setPage(item.id);
            setNavOpen(false);
          }}
        >
          <span className="nav__icon">{item.icon}</span>
          <span>{item.label}</span>
          {item.id === 'verify' && pending > 0 && <span className="nav__badge">{pending}</span>}
        </button>
      ))}
    </nav>
  );

  const chainStatus = (
    <div className="sidebar__foot">
      <div className="chainpill">
        <span className={`dot ${chainValid ? 'dot--ok' : 'dot--bad'}`} />
        <div>
          <div className="chainpill__title">
            {chainValid ? 'Chain verified' : 'Chain integrity broken'}
          </div>
          <div className="chainpill__sub">
            {stats?.blockHeight ?? 0} blocks · {stats?.totalTokens ?? 0} tokens
          </div>
        </div>
      </div>
      <div className="sidebar__meta">
        Channel <code>greentoken-channel</code>
      </div>
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">🌳</div>
          <div>
            <div className="brand__name">GreenToken</div>
            <div className="brand__sub">Verifiable blue-green carbon</div>
          </div>
        </div>

        {navList}
        {chainStatus}
      </aside>

      {/* Mobile drawer — the sidebar's replacement, so no navigation is ever lost. */}
      {navOpen && (
        <>
          <div className="drawer__backdrop" onClick={() => setNavOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="drawer__head">
              <div className="brand" style={{ marginBottom: 0 }}>
                <div className="brand__mark">🌳</div>
                <div>
                  <div className="brand__name">GreenToken</div>
                  <div className="brand__sub">Verifiable blue-green carbon</div>
                </div>
              </div>
              <button
                className="drawer__close"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            {navList}
            {chainStatus}
          </aside>
        </>
      )}

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="topbar__burger"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
            >
              ☰
            </button>
            <div className="topbar__title">
              {NAV.find((n) => n.id === page)?.label}
            </div>
          </div>

          <div className="identity">
            <div className="identity__label">Acting as</div>
            <div className="identity__picker">
              <button
                className="identity__btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
              >
                <span className={`avatar avatar--${current?.org.toLowerCase()}`}>
                  {current?.name?.[0] ?? '?'}
                </span>
                <span className="identity__name">
                  <strong>{current?.name ?? 'Select…'}</strong>
                  <em>{current?.orgName}</em>
                </span>
                <span className="identity__caret">▾</span>
              </button>

              {menuOpen && (
                <>
                  <div className="menu__backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="menu">
                    {grouped.map((g) => (
                      <div key={g.org} className="menu__group">
                        <div className="menu__grouplabel">{ORG_LABEL[g.org]}</div>
                        {g.people.map((p) => (
                          <button
                            key={p.id}
                            className={`menu__item ${p.id === current?.id ? 'is-active' : ''}`}
                            onClick={() => {
                              switchTo(p.id);
                              setMenuOpen(false);
                            }}
                          >
                            <span className={`avatar avatar--${p.org.toLowerCase()}`}>{p.name[0]}</span>
                            <span className="menu__itemtext">
                              <strong>{p.name}</strong>
                              <em>{p.role}</em>
                            </span>
                            {p.id === current?.id && <span className="menu__tick">✓</span>}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`} onClick={() => dismissToast(t.id)}>
            <span className="toast__icon">
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
