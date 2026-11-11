#!/usr/bin/env bash
#
# Deploy the GreenToken chaincode to a real Hyperledger Fabric network.
#
# Prerequisites
#   - Docker + Docker Compose
#   - A running Fabric network (see network/docker-compose.yaml)
#   - The `fabric` CLI tools (cryptogen, configtxgen, peer) — or use the
#     fabric-samples test-network scripts instead.
#
# Usage
#   CHANNEL=greentoken-channel ./network/deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHANNEL="${CHANNEL:-greentoken-channel}"
CHAINCODE_NAME="${CHAINCODE_NAME:-greentoken}"
CHAINCODE_VERSION="${CHAINCODE_VERSION:-1.0.0}"
SEQUENCE="${SEQUENCE:-1}"

PEER_CONN="${PEER_CONN:-localhost:7051}"
PEER_CA="${PEER_CA:-localhost:7054}"
ORDERER="${ORDERER:-localhost:7050}"

echo "▸ Building the chaincode"
cd "$ROOT/chaincode"
npm install --silent
npm run build
cd "$ROOT"

echo "▸ Packaging the chaincode"
# The peer builds the chaincode container from this package: it runs
# `npm install --production` and `npm start` inside it, so the package has to
# carry package.json next to the compiled sources — not just the JS files.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp "$ROOT/chaincode/package.json" "$STAGE/package.json"
cp -R "$ROOT/chaincode/dist" "$STAGE/dist"

peer lifecycle chaincode package \
  "$CHAINCODE_NAME.tar.gz" \
  --path "$STAGE" \
  --label "$CHAINCODE_NAME:$CHAINCODE_VERSION"

# `approveformyorg` and `commit` need the PACKAGE_ID that `package` just
# printed — it is the label plus the hash of the package contents, not the
# name of the tarball.
PACKAGE_ID="$(peer lifecycle chaincode queryinstalled --peer.address "$PEER_CONN" 2>/dev/null \
  | grep -o "$CHAINCODE_NAME:$CHAINCODE_VERSION:[0-9a-f]*" \
  | tail -1)"

if [ -z "$PACKAGE_ID" ]; then
  echo "✘ Could not determine the PACKAGE_ID of the installed chaincode." >&2
  echo "  Run the package step manually and copy the 'Package ID:' line." >&2
  exit 1
fi
echo "  Package ID: $PACKAGE_ID"

echo "▸ Installing on peer0"
peer lifecycle chaincode install \
  "$CHAINCODE_NAME.tar.gz" \
  --peer.address "$PEER_CONN" \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.crt \
  --tlsClientKeyPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.key \
  --tlsRootCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/ca.crt

echo "▸ Approving the chaincode definition for every organisation"
# A four-MSP consortium needs one `approveformyorg` per organisation before
# `commit` will succeed. The MSP ids are the directory names under
# /tmp/hyperledger/organizations/peerOrganizations.
for ORG in example.com forestdepartment auditor corporatefunders; do
  TLS_DIR="/tmp/hyperledger/organizations/peerOrganizations/$ORG/tls"
  if [ ! -d "$TLS_DIR" ]; then
    echo "  … skipping $ORG (no crypto material at $TLS_DIR)"
    continue
  fi
  peer lifecycle chaincode approveformyorg \
    -o "$ORDERER" \
    --channelID "$CHANNEL" \
    --name "$CHAINCODE_NAME" \
    --version "$CHAINCODE_VERSION" \
    --package-id "$PACKAGE_ID" \
    --sequence "$SEQUENCE" \
    --tlsClientCertPath "$TLS_DIR/client.crt" \
    --tlsClientKeyPath "$TLS_DIR/client.key" \
    --tlsRootCertPath "$TLS_DIR/ca.crt"
  echo "  ✓ approved for $ORG"
done

echo "▸ Committing the chaincode definition"
peer lifecycle chaincode commit \
  -o "$ORDERER" \
  --channelID "$CHANNEL" \
  --name "$CHAINCODE_NAME" \
  --version "$CHAINCODE_VERSION" \
  --sequence "$SEQUENCE" \
  --peer.address "$PEER_CONN" \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.crt \
  --tlsClientKeyPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.key \
  --tlsRootCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/ca.crt

echo ""
echo "✔ Chaincode '$CHAINCODE_NAME' v$CHAINCODE_VERSION committed to channel '$CHANNEL'."
echo "  Invoke it with:"
echo "    peer chaincode invoke -C $CHANNEL -n $CHAINCODE_NAME -c '{\"Args\":[\"WhoAmI\"]}' \\"
echo "      -o $ORDERER --tlsClientCertPath ... --tlsClientKeyPath ... --tlsRootCertPath ..."
