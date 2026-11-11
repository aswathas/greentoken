/** Injects Node's Web Crypto implementation as the global `crypto`. */
import { webcrypto } from 'crypto';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}
