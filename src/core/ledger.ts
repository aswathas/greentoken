/**
 * GreenToken Ledger — a Fabric-shaped ledger running in-process.
 *
 * Models the parts of Hyperledger Fabric that matter for this project:
 *   - World state (a key/value store addressed by composite keys)
 *   - Transactions proposed by clients, endorsed by organisations, then ordered
 *   - Blocks whose header contains a Merkle root over tx hashes and the hash of
 *     the previous block, making the chain tamper-evident
 *   - Chaincode events emitted on every state change
 *
 * The block hash is  SHA-256(prevHash | merkleRoot | number | timestamp)
 * and each block is signed with ECDSA P-256 by the ordering organisation.
 *
 * `verifyChain()` recomputes every hash and Merkle root from scratch and
 * reports the first block where the recomputed hash disagrees with the stored
 * one — this is what powers the tamper-detection demo.
 */

import {
  type Block,
  type FundingInvoice,
  type LedgerTx,
  type OrgId,
  type Participant,
  type TreeToken,
  type TxType,
} from './types';
import { merkleRoot, sha256, signPayload, generateKeyPair, verifyPayload } from './crypto';
import {
  type ChaincodeStub,
  type CallerContext,
  PlantTree,
  VerifyPlanting,
  FundTokens,
  SettleFunding,
  GetToken,
  SearchTokens,
  GetLeaderboard,
  GetStats,
  GetInvoice,
  GetAllInvoices,
  ORG_NAMES,
} from './chaincode';

export const ORDERER_ORG = 'VERIFIER';

/**
 * Bump this whenever the chaincode rules change in a way that invalidates the
 * seeded ledger. The Durable Object host compares it against the stored
 * snapshot and reseeds from genesis when they differ, so a contract upgrade
 * never leaves a half-old ledger behind.
 */
export const CONTRACT_VERSION = '2';
export const ORDERER_NAME = 'Consortium Ordering Service';

/**
 * Fields that must never reach the shared ledger.
 *
 * `privateContact` is the planter's phone number. It is accepted by the
 * PlantTree input for the UI's benefit, but it is removed from every
 * transaction payload before the payload is hashed or stored.
 */
const PRIVATE_FIELDS = ['privateContact'] as const;

/** Returns a copy of the payload without any private (off-ledger) field. */
export function stripPrivateData(payload: Record<string, unknown>): Record<string, unknown> {
  if (!PRIVATE_FIELDS.some((f) => f in payload)) return payload;
  const copy: Record<string, unknown> = { ...payload };
  for (const field of PRIVATE_FIELDS) delete copy[field];
  return copy;
}

export interface ChainEvent {
  name: string;
  payload: Record<string, unknown>;
  txId: string;
  blockNumber: number;
  timestamp: string;
}

export interface ChainVerification {
  valid: boolean;
  blockCount: number;
  txCount: number;
  brokenAt?: number;
  reason?: string;
}

/** In-memory implementation of the ChaincodeStub contract. */
class MemoryStub implements ChaincodeStub {
  private events: ChainEvent[] = [];
  private blockNumber = 0;

  constructor(
    /** The ledger's shared world state — every stub reads and writes the same store. */
    private state: Map<string, any>,
    private caller: CallerContext,
    private mspId: string,
    private attributes: Record<string, string>,
    private txId: string,
    private keys: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null,
  ) {}

  async getState(key: string) {
    return this.state.has(key) ? this.state.get(key) : null;
  }
  async putState(key: string, value: unknown) {
    this.state.set(key, value);
  }
  async deleteState(key: string) {
    this.state.delete(key);
  }
  async getStateByRange(prefix: string) {
    const out: { key: string; value: any }[] = [];
    for (const key of [...this.state.keys()].sort()) {
      if (key.startsWith(prefix)) out.push({ key, value: this.state.get(key) });
    }
    return out;
  }
  async emitEvent(name: string, payload: unknown) {
    this.events.push({
      name,
      payload: payload as Record<string, unknown>,
      txId: this.txId,
      blockNumber: this.blockNumber,
      timestamp: new Date().toISOString(),
    });
  }
  getMSPID() {
    return this.mspId;
  }
  getAttributeValue(name: string) {
    return this.attributes[name] ?? null;
  }
  getTxID() {
    return this.txId;
  }
  getBlockNumber() {
    return this.blockNumber;
  }
  getSignerKeys() {
    return this.keys;
  }

  drainEvents(): ChainEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}

export class GreenTokenLedger {
  blocks: Block[] = [];
  events: ChainEvent[] = [];
  participants = new Map<string, Participant>();
  /** The organisation that runs the ordering service for this channel. */
  ordererKeys: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  channelName = 'greentoken-channel';

  private state = new Map<string, any>();
  private txCounter = 0;
  /** Pristine copy of every transaction payload, used to undo a tamper demo. */
  private originalPayloads = new Map<string, unknown>();
  private listeners = new Set<() => void>();

  /* -------------------- lifecycle -------------------- */

  async init() {
    if (!this.ordererKeys) {
      this.ordererKeys = await generateKeyPair();
    }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emitChange() {
    for (const fn of this.listeners) fn();
  }

  /* -------------------- identity -------------------- */

  mspForOrg(org: OrgId): string {
    return {
      PLANTER: 'PlantersAssociationMSP',
      VERIFIER: 'ForestDeptMSP',
      FUNDER: 'CorporateFundersMSP',
      AUDITOR: 'AuditorMSP',
    }[org];
  }

  addParticipant(p: Participant) {
    this.participants.set(p.id, p);
  }

  getParticipant(id: string): Participant | undefined {
    return this.participants.get(id);
  }

  /** Pick a representative participant from each organisation for the demo. */
  participantByOrg(org: OrgId): Participant | undefined {
    return [...this.participants.values()].find((p) => p.org === org);
  }

  /* -------------------- transaction submission -------------------- */

  private async buildTx(
    type: TxType,
    caller: CallerContext,
    payload: Record<string, unknown>,
    run: (stub: ChaincodeStub) => Promise<{ ok: boolean; message: string; data?: unknown }>,
  ): Promise<{ ok: boolean; message: string; data?: unknown; txId: string; events: ChainEvent[] }> {
    const participant = this.participantByOrg(caller.org);
    const mspId = this.mspForOrg(caller.org);
    const attrs: Record<string, string> = {
      name: caller.name,
      participantId: caller.id,
      role: caller.org,
    };
    const txId = `tx-${Date.now().toString(16)}-${(this.txCounter++).toString(16)}`;
    const stub = new MemoryStub(
      this.state,
      caller,
      mspId,
      attrs,
      txId,
      participant ? { publicKey: participant.publicKey!, privateKey: participant.privateKey! } : null,
    );

    const result = await run(stub);
    const events = stub.drainEvents();

    if (!result.ok) {
      // A failed endorsement is not written to the ledger — the transaction is
      // discarded, exactly as a Fabric endorsement failure behaves.
      return { ...result, txId, events };
    }

    // The planter's contact is private data: it is stripped from the payload
    // before it is hashed or stored, so it appears neither in the payload
    // hash, nor in the Ledger Explorer's readable payload, nor in world state.
    const safePayload = stripPrivateData(payload);

    const payloadHash = await sha256(JSON.stringify(safePayload));
    const endorsements: { org: OrgId; signature: string }[] = [];
    if (participant?.privateKey) {
      endorsements.push({
        org: caller.org,
        signature: await signPayload({ txId, type, payloadHash }, participant.privateKey),
      });
    }

    const tx: LedgerTx = {
      txId,
      type,
      actorOrg: caller.org,
      actorName: caller.name,
      payloadHash,
      payload: safePayload,
      endorsements,
      timestamp: new Date().toISOString(),
      txHash: '',
      blockNumber: this.blocks.length + 1,
    };
    tx.txHash = await sha256(
      [tx.txId, tx.type, tx.payloadHash, tx.timestamp].join('|'),
    );
    this.originalPayloads.set(tx.txId, structuredClone(safePayload));

    await this.appendBlock([tx]);
    this.events.push(...events);

    return { ...result, txId, events };
  }

  private async appendBlock(txs: LedgerTx[]) {
    const number = this.blocks.length + 1;
    const prevHash = this.blocks.length ? this.blocks[this.blocks.length - 1].hash : 'GENESIS';
    const txHashes = txs.map((t) => t.txHash);
    const root = await merkleRoot(txHashes);
    const timestamp = new Date().toISOString();
    const hash = await sha256(`${prevHash}|${root}|${number}|${timestamp}`);
    const signature = this.ordererKeys
      ? await signPayload({ number, prevHash, root, timestamp }, this.ordererKeys.privateKey)
      : '';

    this.blocks.push({
      number,
      prevHash,
      merkleRoot: root,
      txHashes,
      txs,
      timestamp,
      signature,
      signerOrg: ORDERER_ORG,
      hash,
    });
    this.emitChange();
  }

  /* -------------------- chaincode invocations -------------------- */

  async plantTree(caller: CallerContext, input: Parameters<typeof PlantTree>[1]) {
    return this.buildTx('PlantTree', caller, input as unknown as Record<string, unknown>, (s) =>
      PlantTree(s, input),
    );
  }

  async verifyPlanting(caller: CallerContext, input: Parameters<typeof VerifyPlanting>[1]) {
    return this.buildTx('VerifyPlanting', caller, input as unknown as Record<string, unknown>, (s) =>
      VerifyPlanting(s, input),
    );
  }

  async fundTokens(caller: CallerContext, input: Parameters<typeof FundTokens>[1]) {
    return this.buildTx('FundTokens', caller, input as unknown as Record<string, unknown>, (s) =>
      FundTokens(s, input),
    );
  }

  async settleFunding(caller: CallerContext, invoiceId: string) {
    return this.buildTx('SettleFunding', caller, { invoiceId }, (s) => SettleFunding(s, invoiceId));
  }

  /* -------------------- queries -------------------- */

  private readStub(caller?: CallerContext) {
    const p = caller ? this.participantByOrg(caller.org) : undefined;
    return new MemoryStub(
      this.state,
      caller ?? { org: 'AUDITOR', name: 'Reader', id: 'reader', orgName: ORG_NAMES.AUDITOR },
      caller ? this.mspForOrg(caller.org) : 'AuditorMSP',
      { name: caller?.name ?? 'Reader', participantId: caller?.id ?? 'reader' },
      'query',
      p ? { publicKey: p.publicKey!, privateKey: p.privateKey! } : null,
    );
  }

  async getToken(tokenId: string) {
    return GetToken(this.readStub(), tokenId);
  }

  async searchTokens(input: Parameters<typeof SearchTokens>[1]) {
    return SearchTokens(this.readStub(), input);
  }

  async getLeaderboard() {
    return GetLeaderboard(this.readStub());
  }

  async getStats() {
    return GetStats(this.readStub());
  }

  async getInvoice(id: string) {
    return GetInvoice(this.readStub(), id);
  }

  async getInvoices() {
    return GetAllInvoices(this.readStub());
  }

  async getAllTokens(): Promise<TreeToken[]> {
    const res = await this.searchTokens({ status: 'ALL' });
    return res.data ?? [];
  }

  async getAllInvoicesRaw(): Promise<FundingInvoice[]> {
    const res = await this.getInvoices();
    return res.data ?? [];
  }

  /* -------------------- chain verification -------------------- */

  async verifyChain(): Promise<ChainVerification> {
    let prev = 'GENESIS';
    let txCount = 0;

    for (const block of this.blocks) {
      if (block.prevHash !== prev) {
        return {
          valid: false,
          blockCount: this.blocks.length,
          txCount,
          brokenAt: block.number,
          reason: `Block #${block.number} prevHash does not match the previous block hash — the chain was re-pointed.`,
        };
      }
      const root = await merkleRoot(block.txHashes);
      if (root !== block.merkleRoot) {
        return {
          valid: false,
          blockCount: this.blocks.length,
          txCount,
          brokenAt: block.number,
          reason: `Block #${block.number} Merkle root mismatch — a transaction inside this block was altered.`,
        };
      }
      for (const tx of block.txs) {
        // Recompute the payload hash from the stored payload. If someone edits a
        // transaction after it was endorsed, the recomputed digest no longer
        // matches the one the endorsing organisation signed.
        const recomputedPayload = await sha256(JSON.stringify(tx.payload));
        if (recomputedPayload !== tx.payloadHash) {
          return {
            valid: false,
            blockCount: this.blocks.length,
            txCount,
            brokenAt: block.number,
            reason: `Transaction ${tx.txId} payload was altered after endorsement — its stored payload no longer hashes to the signed payloadHash.`,
          };
        }
        const recomputed = await sha256([tx.txId, tx.type, tx.payloadHash, tx.timestamp].join('|'));
        if (recomputed !== tx.txHash) {
          return {
            valid: false,
            blockCount: this.blocks.length,
            txCount,
            brokenAt: block.number,
            reason: `Transaction ${tx.txId} hash mismatch — payload was edited after endorsement.`,
          };
        }
        txCount++;
      }
      const expected = await sha256(`${block.prevHash}|${block.merkleRoot}|${block.number}|${block.timestamp}`);
      if (expected !== block.hash) {
        return {
          valid: false,
          blockCount: this.blocks.length,
          txCount,
          brokenAt: block.number,
          reason: `Block #${block.number} header hash mismatch — the block was tampered with.`,
        };
      }
      prev = block.hash;
    }

    return { valid: true, blockCount: this.blocks.length, txCount };
  }

  /**
   * Tamper with a stored block to demonstrate tamper-evidence.
   * `mode: 'payload'` rewrites a transaction payload; `mode: 'header'` rewrites
   * the block header. Either way verifyChain() must detect the break.
   */
  async tamperBlock(blockNumber: number, mode: 'payload' | 'header' = 'payload') {
    const block = this.blocks.find((b) => b.number === blockNumber);
    if (!block) return { ok: false, message: `Block #${blockNumber} not found.` };

    if (mode === 'header') {
      // Rewrite the header timestamp — the block hash will no longer reproduce.
      block.timestamp = new Date(Date.now() - 60000).toISOString();
    } else if (block.txs.length) {
      // Rewrite a transaction payload — the payloadHash will no longer reproduce.
      const tx = block.txs[0];
      tx.payload = {
        ...tx.payload,
        TAMPERED: true,
        note: 'injected after the fact',
        estimatedCo2Kg: 99999,
      };
    } else {
      block.timestamp = new Date().toISOString();
    }
    this.emitChange();
    return {
      ok: true,
      message:
        mode === 'header'
          ? `Block #${blockNumber} header was rewritten. Re-run chain verification.`
          : `A transaction in block #${blockNumber} was edited. Re-run chain verification.`,
    };
  }

  /** Restore a tampered block back to its original, signed contents. */
  async restoreChain() {
    const res = await this.rebuildChainFromTxs();
    this.emitChange();
    return res;
  }

  /**
   * Rebuild every block from the stored transactions. Used to undo a tamper
   * demo without reloading the page.
   */
  private async rebuildChainFromTxs() {
    const allTxs = this.blocks.flatMap((b) => b.txs);

    // Restore pristine payloads first — the tamper demo edits them in place.
    for (const tx of allTxs) {
      const original = this.originalPayloads.get(tx.txId);
      if (original !== undefined && original !== null) {
        tx.payload = structuredClone(original) as Record<string, unknown>;
      }
    }

    this.blocks = [];
    let current: LedgerTx[] = [];
    for (const tx of allTxs) {
      current.push(tx);
      if (current.length >= 1) {
        await this.appendBlock(current);
        current = [];
      }
    }
    if (current.length) await this.appendBlock(current);
    return {
      ok: true,
      message: `Chain rebuilt — ${this.blocks.length} blocks re-signed by the ordering service.`,
    };
  }

  /* -------------------- serialisation -------------------- */

  /** Full snapshot including world state, so a reload resumes mid-consortium. */
  exportState() {
    return {
      version: 1,
      contractVersion: CONTRACT_VERSION,
      channelName: this.channelName,
      state: [...this.state.entries()],
      blocks: this.blocks,
      events: this.events,
      participants: [...this.participants.values()],
      ordererKeys: this.ordererKeys,
      txCounter: this.txCounter,
      originalPayloads: [...this.originalPayloads.entries()],
    };
  }

  static async fromJSON(data: {
    state: [string, any][];
    blocks: Block[];
    events: ChainEvent[];
    participants: Participant[];
    ordererKeys: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null;
    txCounter: number;
    channelName: string;
    contractVersion?: string;
    originalPayloads?: [string, unknown][];
  }): Promise<GreenTokenLedger> {
    const ledger = new GreenTokenLedger();
    ledger.channelName = data.channelName ?? 'greentoken-channel';
    ledger.state = new Map(data.state ?? []);
    ledger.blocks = data.blocks ?? [];
    ledger.events = data.events ?? [];
    ledger.ordererKeys = data.ordererKeys ?? null;
    ledger.txCounter = data.txCounter ?? 0;
    ledger.originalPayloads = new Map(data.originalPayloads ?? []);
    for (const p of data.participants ?? []) {
      ledger.participants.set(p.id, p);
    }
    if (!ledger.ordererKeys) {
      ledger.ordererKeys = await generateKeyPair();
    }
    return ledger;
  }

  toJSON() {
    return {
      channelName: this.channelName,
      blocks: this.blocks,
      events: this.events,
      ordererPublicKey: this.ordererKeys?.publicKey ?? null,
      participants: [...this.participants.values()].map((p) => ({
        ...p,
        privateKey: undefined,
      })),
      txCounter: this.txCounter,
    };
  }
}
