/**
 * GreenToken API — Cloudflare Worker + Durable Object.
 *
 * The Durable Object *is* the channel: it holds the world state, the ordered
 * blocks and the chaincode event log, and it serialises every write so the
 * ledger has a single, consistent history — exactly like a Fabric ordering
 * service.
 *
 * The smart contract itself is the shared domain module, so this backend and
 * the browser demo execute identical business logic.
 */

import { GreenTokenLedger, CONTRACT_VERSION } from '../../src/core/ledger';
import { buildSeededLedger } from '../../src/core/seed';
import { type ChainEvent } from '../../src/core/ledger';
import { type CallerContext } from '../../src/core/chaincode';
import { type OrgId } from '../../src/core/types';

export interface Env {
  GREENTOKEN: DurableObjectNamespace;
}

/* ------------------------------------------------------------------ *
 * Durable Object — the channel
 * ------------------------------------------------------------------ */

export class GreenTokenChannel {
  private ctx: DurableObjectState;
  private ledger: GreenTokenLedger | null = null;
  private ready: Promise<GreenTokenLedger> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx;
  }

  private async load(): Promise<GreenTokenLedger> {
    if (this.ledger) return this.ledger;
    if (!this.ready) {
      this.ready = (async () => {
        const stored = await this.ctx.storage.get<any>('ledger');
        let ledger: GreenTokenLedger;
        // Reseed from genesis whenever the chaincode rules change, so the
        // hosted ledger can never be a mix of old and new contract versions.
        const storedVersion = stored?.contractVersion;
        if (stored?.blocks?.length && storedVersion === CONTRACT_VERSION) {
          ledger = await GreenTokenLedger.fromJSON(stored);
        } else {
          ledger = await buildSeededLedger();
          await this.persist(ledger);
        }
        this.ledger = ledger;
        return ledger;
      })();
    }
    return this.ready;
  }

  private async persist(ledger: GreenTokenLedger) {
    await this.ctx.storage.put('ledger', ledger.exportState());
  }

  async fetch(request: Request): Promise<Response> {
    const ledger = await this.load();
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '') || '/';

    try {
      if (request.method === 'GET') {
        switch (true) {
          case path === '/health':
            return json({
              ok: true,
              channel: ledger.channelName,
              blocks: ledger.blocks.length,
              tokens: (await ledger.getAllTokens()).length,
              orderer: ledger.toJSON().ordererPublicKey ? 'consortium-ordering-service' : null,
            });

          case path === '/stats': {
            const stats = await ledger.getStats();
            // The chaincode reads the height from the stub's block number, but
            // the in-memory stub never advances it — the Durable Object *is*
            // the channel, so the real height is the number of blocks it holds.
            return json({ ...(stats.data ?? {}), blockHeight: ledger.blocks.length });
          }

          case path === '/tokens': {
            const q = url.searchParams;
            const res = await ledger.searchTokens({
              status: (q.get('status') as any) ?? 'ALL',
              district: q.get('district') ?? undefined,
              species: q.get('species') ?? undefined,
              q: q.get('q') ?? undefined,
            });
            return json(res.data ?? []);
          }

          case path.startsWith('/tokens/'): {
            const res = await ledger.getToken(path.split('/')[2]);
            return res.ok ? json(res.data) : json({ error: res.message }, 404);
          }

          case path === '/leaderboard': {
            const res = await ledger.getLeaderboard();
            return json(res.data ?? []);
          }

          case path === '/invoices': {
            const res = await ledger.getInvoices();
            return json(res.data ?? []);
          }

          case path === '/blocks':
            return json(ledger.blocks);

          case path === '/events':
            return json(ledger.events.slice(-200).reverse());

          case path === '/verify-chain': {
            const res = await ledger.verifyChain();
            return json(res);
          }

          default:
            return json({ error: 'not found' }, 404);
        }
      }

      if (request.method === 'POST') {
        const body = (await request.json()) as any;
        const caller = toCaller(body.actor);

        switch (true) {
          case path === '/plant': {
            const res = await ledger.plantTree(caller, body.input);
            await this.persist(ledger);
            return json(res, res.ok ? 200 : 400);
          }
          case path === '/verify': {
            const res = await ledger.verifyPlanting(caller, body.input);
            await this.persist(ledger);
            return json(res, res.ok ? 200 : 400);
          }
          case path === '/fund': {
            const res = await ledger.fundTokens(caller, body.input);
            await this.persist(ledger);
            return json(res, res.ok ? 200 : 400);
          }
          case path === '/settle': {
            const res = await ledger.settleFunding(caller, body.invoiceId);
            await this.persist(ledger);
            return json(res, res.ok ? 200 : 400);
          }
          default:
            return json({ error: 'not found' }, 404);
        }
      }

      return json({ error: 'method not allowed' }, 405);
    } catch (err: any) {
      return json({ error: err?.message ?? 'internal error' }, 500);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Worker — routes and CORS
 * ------------------------------------------------------------------ */

function toCaller(actor: any): CallerContext {
  const org: OrgId = actor?.org ?? 'PLANTER';
  return {
    org,
    name: actor?.name ?? 'Anonymous',
    id: actor?.id ?? 'unknown',
    orgName: actor?.orgName ?? org,
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return json({}, 204);

    const url = new URL(request.url);
    if (url.pathname === '/api/events/stream') {
      return sseStream(env);
    }

    const id = env.GREENTOKEN.idFromName('greentoken-channel');
    const stub = env.GREENTOKEN.get(id);
    return stub.fetch(request);
  },
};

/**
 * Server-Sent Events stream of chaincode events.
 * Polls the Durable Object so every connected client sees the same chain
 * activity — the same shape as a Fabric event listener subscription.
 */
function sseStream(env: Env): Response {
  const encoder = new TextEncoder();
  const id = env.GREENTOKEN.idFromName('greentoken-channel');
  const stub = env.GREENTOKEN.get(id);
  let lastCount = -1;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      controller.enqueue(encoder.encode(': greentoken event stream\n\n'));

      const tick = async () => {
        try {
          const res = await stub.fetch('http://do/events');
          const events = (await res.json()) as ChainEvent[];
          if (events.length !== lastCount) {
            lastCount = events.length;
            for (const e of events.slice(0, 5)) send('chaincode', e);
          }
          send('heartbeat', { t: Date.now() });
        } catch {
          /* the DO may be restarting — keep the stream alive */
        }
      };

      await tick();
      const timer = setInterval(() => void tick(), 2500);
      // @ts-expect-error — cleanup hook for the stream
      controller._cancel = () => clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'access-control-allow-origin': '*',
    },
  });
}
