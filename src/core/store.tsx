/**
 * Application store — React binding over the GreenTokenLedger.
 *
 * Exposes:
 *   - the current identity (which organisation the user is acting as)
 *   - a role switcher so every organisation in the consortium can be demoed
 *   - chaincode invocations that run through the ledger and update the UI
 *   - live chaincode events (the "activity feed")
 *   - persistence to localStorage so a refresh does not reset the demo
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GreenTokenLedger } from './ledger';
import { buildSeededLedger, SEED_PEOPLE, SEED_ORG_NAMES } from './seed';
import {
  type ChainEvent,
} from './ledger';
import {
  type OrgId,
  type Participant,
  type FundingInvoice,
  type TreeToken,
  type LeaderboardRow,
  type NetworkStats,
} from './types';
import { type CallerContext } from './chaincode';

const STORAGE_KEY = 'greentoken.ledger.v1';
const IDENTITY_KEY = 'greentoken.identity.v1';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

interface StoreValue {
  ready: boolean;
  ledger: GreenTokenLedger | null;
  participants: Participant[];
  current: Participant | null;
  switchTo: (id: string) => void;
  caller: CallerContext | null;
  tokens: TreeToken[];
  invoices: FundingInvoice[];
  events: ChainEvent[];
  leaderboard: LeaderboardRow[];
  stats: NetworkStats | null;
  toasts: Toast[];
  pushToast: (kind: Toast['kind'], message: string) => void;
  dismissToast: (id: number) => void;
  refresh: () => Promise<void>;
  plantTree: (input: Parameters<GreenTokenLedger['plantTree']>[1]) => Promise<{ ok: boolean; message: string }>;
  verifyPlanting: (input: Parameters<GreenTokenLedger['verifyPlanting']>[1]) => Promise<{ ok: boolean; message: string }>;
  fundTokens: (input: Parameters<GreenTokenLedger['fundTokens']>[1]) => Promise<{ ok: boolean; message: string }>;
  settleFunding: (invoiceId: string) => Promise<{ ok: boolean; message: string }>;
  tamper: (blockNumber: number, mode: 'payload' | 'header') => Promise<void>;
  restore: () => Promise<void>;
  resetDemo: () => Promise<void>;
  chainValid: boolean;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ledgerRef = useRef<GreenTokenLedger | null>(null);
  const [ready, setReady] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [tokens, setTokens] = useState<TreeToken[]>([]);
  const [invoices, setInvoices] = useState<FundingInvoice[]>([]);
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [chainValid, setChainValid] = useState(true);

  const pushToast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    const ledger = ledgerRef.current;
    if (!ledger) return;
    const [tk, inv, lb, st] = await Promise.all([
      ledger.getAllTokens(),
      ledger.getAllInvoicesRaw(),
      ledger.getLeaderboard(),
      ledger.getStats(),
    ]);
    setTokens(tk);
    setInvoices(inv);
    setLeaderboard(lb.data ?? []);
    const verification = await ledger.verifyChain();
    setChainValid(verification.valid);
    setStats({
      ...(st.data as NetworkStats),
      blockHeight: ledger.blocks.length,
      chainValid: verification.valid,
    });
    setEvents([...ledger.events].reverse());
  }, []);

  /* ---------------- boot ---------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let ledger: GreenTokenLedger | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          ledger = await GreenTokenLedger.fromJSON(JSON.parse(raw));
        }
      } catch {
        ledger = null;
      }
      if (!ledger || ledger.blocks.length === 0) {
        ledger = await buildSeededLedger();
      }
      if (cancelled) return;
      ledgerRef.current = ledger;
      setParticipants([...ledger.participants.values()]);
      ledger.subscribe(() => void refresh());

      const savedIdentity = localStorage.getItem(IDENTITY_KEY);
      const fallback =
        ledger.participantByOrg('PLANTER')?.id ?? [...ledger.participants.values()][0]?.id ?? '';
      setCurrentId(savedIdentity && ledger.getParticipant(savedIdentity) ? savedIdentity : fallback);

      await refresh();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  /* ---------------- persistence ---------------- */

  useEffect(() => {
    if (!ready || !ledgerRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgerRef.current.exportState()));
    } catch {
      /* storage full — the demo still works in-memory */
    }
  }, [ready, tokens, invoices, events]);

  useEffect(() => {
    if (currentId) localStorage.setItem(IDENTITY_KEY, currentId);
  }, [currentId]);

  /* ---------------- identity ---------------- */

  const current = useMemo(
    () => participants.find((p) => p.id === currentId) ?? null,
    [participants, currentId],
  );

  const switchTo = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const caller = useMemo<CallerContext | null>(() => {
    if (!current) return null;
    return { org: current.org, name: current.name, id: current.id, orgName: current.orgName };
  }, [current]);

  /* ---------------- chaincode calls ---------------- */

  const wrap = useCallback(
    async (fn: () => Promise<{ ok: boolean; message: string }>) => {
      const res = await fn();
      pushToast(res.ok ? 'success' : 'error', res.message);
      await refresh();
      return res;
    },
    [pushToast, refresh],
  );

  const plantTree = useCallback(
    (input: Parameters<GreenTokenLedger['plantTree']>[1]) => {
      if (!caller) return Promise.resolve({ ok: false, message: 'No identity selected.' });
      return wrap(() => ledgerRef.current!.plantTree(caller, input));
    },
    [caller, wrap],
  );

  const verifyPlanting = useCallback(
    (input: Parameters<GreenTokenLedger['verifyPlanting']>[1]) => {
      if (!caller) return Promise.resolve({ ok: false, message: 'No identity selected.' });
      return wrap(() => ledgerRef.current!.verifyPlanting(caller, input));
    },
    [caller, wrap],
  );

  const fundTokens = useCallback(
    (input: Parameters<GreenTokenLedger['fundTokens']>[1]) => {
      if (!caller) return Promise.resolve({ ok: false, message: 'No identity selected.' });
      return wrap(() => ledgerRef.current!.fundTokens(caller, input));
    },
    [caller, wrap],
  );

  const settleFunding = useCallback(
    (invoiceId: string) => {
      if (!caller) return Promise.resolve({ ok: false, message: 'No identity selected.' });
      return wrap(() => ledgerRef.current!.settleFunding(caller, invoiceId));
    },
    [caller, wrap],
  );

  /* ---------------- security demo ---------------- */

  const tamper = useCallback(
    async (blockNumber: number, mode: 'payload' | 'header') => {
      const ledger = ledgerRef.current;
      if (!ledger) return;
      const res = await ledger.tamperBlock(blockNumber, mode);
      pushToast('info', res.message);
      await refresh();
    },
    [pushToast, refresh],
  );

  const restore = useCallback(async () => {
    const ledger = ledgerRef.current;
    if (!ledger) return;
    const res = await ledger.restoreChain();
    pushToast('success', res.message);
    await refresh();
  }, [pushToast, refresh]);

  const resetDemo = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    const ledger = await buildSeededLedger();
    ledgerRef.current = ledger;
    setParticipants([...ledger.participants.values()]);
    ledger.subscribe(() => void refresh());
    await refresh();
    pushToast('success', 'Demo reset — the consortium has been reseeded from the genesis block.');
  }, [pushToast, refresh]);

  const value: StoreValue = {
    ready,
    ledger: ledgerRef.current,
    participants,
    current,
    switchTo,
    caller,
    tokens,
    invoices,
    events,
    leaderboard,
    stats,
    toasts,
    pushToast,
    dismissToast,
    refresh,
    plantTree,
    verifyPlanting,
    fundTokens,
    settleFunding,
    tamper,
    restore,
    resetDemo,
    chainValid,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}

export { SEED_PEOPLE, SEED_ORG_NAMES };
