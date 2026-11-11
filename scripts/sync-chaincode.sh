#!/usr/bin/env bash
#
# Sync the platform-free chaincode domain into the Fabric chaincode package.
#
# The smart contract logic must be identical in the browser demo, the
# Cloudflare Worker backend and the real Hyperledger Fabric chaincode. This
# script copies the canonical source from src/core into chaincode/src so the
# Fabric package can be built with fabric-chaincode-typescript.
#
# Run it after every change to src/core/chaincode.ts:
#     ./scripts/sync-chaincode.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/src/core"
DST="$ROOT/chaincode/src"

mkdir -p "$DST"

# 1. Types — identical, only the import path differs (same folder).
cp "$SRC/types.ts" "$DST/types.ts"

# 2. Crypto — identical logic, but Node's webcrypto is injected explicitly
#    because fabric-shim runs on Node rather than in a browser.
sed \
  -e "s|^export function toHex|const cryptoRef = (globalThis as any).crypto as Crypto;\n\nexport function toHex|" \
  -e "s|crypto\.subtle|cryptoRef.subtle|g" \
  "$SRC/crypto.ts" > "$DST/crypto.ts"

cat > "$DST/crypto.node.ts" <<'EOF'
/** Injects Node's Web Crypto implementation as the global `crypto`. */
import { webcrypto } from 'crypto';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}
EOF

# 3. Domain — the smart contract itself, renamed so the Fabric contract file
#    can import it without colliding with the adapter.
cp "$SRC/chaincode.ts" "$DST/domain.ts"

echo "✔ Synced chaincode domain → chaincode/src"
echo "  types.ts, crypto.ts, crypto.node.ts, domain.ts"
echo ""
echo "  The Fabric adapter is chaincode/src/contract.ts."
echo "  Build with:  cd chaincode && npm install && npm run build"
