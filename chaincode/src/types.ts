/**
 * GreenToken — shared type definitions.
 *
 * These types are deliberately framework-free so that the identical business
 * logic can run in three places:
 *   1. The browser demo (src/core/chaincode.ts)
 *   2. A Cloudflare Worker + Durable Object backend (worker/src)
 *   3. A real Hyperledger Fabric chaincode (chaincode/src/contract.ts)
 */

export type OrgId = 'PLANTER' | 'VERIFIER' | 'FUNDER' | 'AUDITOR';

export type TokenStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FUNDED';

export type TxType =
  | 'PlantTree'
  | 'VerifyPlanting'
  | 'RejectPlanting'
  | 'FundTokens'
  | 'SettleFunding';

export interface GeoStamp {
  lat: number;
  lng: number;
  accuracyMeters: number;
  capturedAt: string;
  /** SHA-256 of the geo payload — proves the coordinates were not edited. */
  geoHash: string;
}

export interface PhotoProof {
  /** SHA-256 of the image bytes — the image itself stays off-chain. */
  sha256: string;
  byteLength: number;
  mimeType: string;
  /** Compressed thumbnail kept for the demo; in Fabric this would be a private-data asset. */
  dataUrl?: string;
}

export interface Endorsement {
  /** Participant id of the endorser (a distinct reviewer of the proof). */
  by: string;
  org: OrgId;
  orgName: string;
  verdict: 'APPROVE' | 'REJECT';
  note: string;
  endorsedAt: string;
  /** ECDSA signature over the endorsement payload. */
  signature: string;
}

export interface FundingInvoice {
  invoiceId: string;
  funderId: string;
  funderName: string;
  units: number;
  pricePerToken: number;
  discountPct: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  tokenIds: string[];
  issuedAt: string;
  settledAt?: string;
  status: 'ISSUED' | 'SETTLED';
}

export interface TreeToken {
  tokenId: string;
  planterId: string;
  planterName: string;
  planterOrg: string;
  district: string;
  state: string;
  species: string;
  count: number;
  estimatedCo2Kg: number;
  geo: GeoStamp;
  photo: PhotoProof;
  status: TokenStatus;
  endorsements: Endorsement[];
  requiredEndorsements: number;
  invoiceId?: string;
  createdAt: string;
  verifiedAt?: string;
  fundedAt?: string;
  /**
   * The planter's contact number is deliberately ABSENT from this type: it is
   * stripped from the PlantTree input at the chaincode boundary, so it never
   * reaches world state, the transaction payload or any read view.
   */
}

/** A single ledger transaction, mirroring a Fabric transaction record. */
export interface LedgerTx {
  txId: string;
  type: TxType;
  actorOrg: OrgId;
  actorName: string;
  /** Hash of the function payload. */
  payloadHash: string;
  /** Readable payload (kept for the explorer view). */
  payload: Record<string, unknown>;
  endorsements: { org: OrgId; signature: string }[];
  timestamp: string;
  txHash: string;
  blockNumber: number;
}

/** A block, mirroring a Fabric block header + payload. */
export interface Block {
  number: number;
  prevHash: string;
  /** Merkle root over the tx hashes in this block. */
  merkleRoot: string;
  txHashes: string[];
  txs: LedgerTx[];
  timestamp: string;
  /** Signature of the ordering node (ECDSA P-256). */
  signature: string;
  signerOrg: OrgId;
  /** hash = SHA-256(prevHash | merkleRoot | number | timestamp) */
  hash: string;
}

export interface Participant {
  id: string;
  name: string;
  org: OrgId;
  orgName: string;
  role: string;
  publicKey?: JsonWebKey;
  /** Private key material is kept client-side only, never on the ledger. */
  privateKey?: JsonWebKey;
}

export interface LeaderboardRow {
  id: string;
  name: string;
  orgName: string;
  tokens: number;
  co2Kg: number;
  fundsReceived: number;
  trees: number;
}

export interface NetworkStats {
  blockHeight: number;
  totalTokens: number;
  verifiedTokens: number;
  pendingTokens: number;
  fundedTokens: number;
  rejectedTokens: number;
  totalCo2Kg: number;
  totalFunding: number;
  totalTrees: number;
  chainValid: boolean;
}

export interface ChaincodeResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}
