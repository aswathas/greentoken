/**
 * Cryptographic primitives for the GreenToken ledger.
 *
 * Uses the Web Crypto API only — this code runs identically in a browser,
 * in a Cloudflare Worker, and in Node.js 18+. No third-party crypto library.
 *
 *  - SHA-256  : content hashing (photo proof, geo proof, block headers, tx ids)
 *  - ECDSA P-256 : per-participant digital signatures over signed payloads
 *  - Merkle tree : tx hash aggregation per block
 */

const cryptoRef = (globalThis as any).crypto as Crypto;

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

/** SHA-256 hex digest of a string or byte array. */
export async function sha256(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  const digest = await cryptoRef.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return toHex(digest);
}

/** SHA-256 hex digest of raw bytes. */
export async function sha256Bytes(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  return sha256(bytes);
}

/**
 * Deterministic canonical JSON — stable key ordering so that a hash computed
 * in the browser matches one computed on the server or in chaincode.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const parts = keys.map(
    (k) => JSON.stringify(k) + ':' + canonicalize((value as Record<string, unknown>)[k]),
  );
  return '{' + parts.join(',') + '}';
}

/** Hash of any JSON-serialisable value, key-order independent. */
export async function hashJson(value: unknown): Promise<string> {
  return sha256(canonicalize(value));
}

/** SHA-256 of a file/blob — used for the photo proof. */
export async function sha256Blob(blob: Blob): Promise<{ hash: string; bytes: number }> {
  const buf = await blob.arrayBuffer();
  return { hash: toHex(await cryptoRef.subtle.digest('SHA-256', buf)), bytes: buf.byteLength };
}

/* ------------------------------------------------------------------ *
 * ECDSA P-256 key pairs (participant identities)
 * ------------------------------------------------------------------ */

export interface KeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const pair = await cryptoRef.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  return {
    publicKey: await cryptoRef.subtle.exportKey('jwk', pair.publicKey),
    privateKey: await cryptoRef.subtle.exportKey('jwk', pair.privateKey),
  };
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return cryptoRef.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return cryptoRef.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  );
}

/** Sign a canonical payload with an ECDSA P-256 private key. */
export async function signPayload(payload: unknown, privateKeyJwk: JsonWebKey): Promise<string> {
  const key = await importPrivateKey(privateKeyJwk);
  const data = new TextEncoder().encode(canonicalize(payload));
  const sig = await cryptoRef.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data as unknown as BufferSource);
  return toHex(sig);
}

/** Verify an ECDSA P-256 signature against a public key. */
export async function verifyPayload(
  payload: unknown,
  signatureHex: string,
  publicKeyJwk: JsonWebKey,
): Promise<boolean> {
  try {
    const key = await importPublicKey(publicKeyJwk);
    const data = new TextEncoder().encode(canonicalize(payload));
    const sig = fromHex(signatureHex);
    return await cryptoRef.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig as unknown as BufferSource, data as unknown as BufferSource);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Merkle tree over transaction hashes
 * ------------------------------------------------------------------ */

export async function merkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return await sha256('EMPTY_BLOCK');
  let level = [...leaves];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(await sha256(left + right));
    }
    level = next;
  }
  return level[0];
}

/** Short display form for hashes. */
export function shortHash(h: string, len = 8): string {
  return h ? `${h.slice(0, len)}…${h.slice(-4)}` : '—';
}
