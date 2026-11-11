# GreenToken — Hyperledger Fabric network

This directory contains the real Fabric v2.5 network used for the Unit 5 lab record:
one ordering service (etcdraft), one Fabric CA, one peer with CouchDB as its state database,
and a peer CLI you start on demand.

| File | Purpose |
|---|---|
| `docker-compose.yaml` | The four services plus the `cli` profile |
| `deploy.sh` | Package → install → approve (per org) → commit the GreenToken chaincode |
| `README.md` | This file |
| `crypto/` | **Generated** by `cryptogen` — MSPs, TLS material, CA config (git-ignored) |
| `channel-artifacts/` | **Generated** by `configtxgen` — `genesis.block`, `configtx.yaml`, channel tx (git-ignored) |

---

## 1. Topology and port mapping

```
                        Docker network "greentoken-net"

   ┌────────────┐        ┌──────────────┐        ┌────────────┐
   │  couchdb   │◄──────►│    peer0     │◄──────►│  orderer0  │
   │            │ state  │  greentoken  │ gRPC   │  etcdraft  │
   │  :5984     │  db    │  :7051 :9443 │        │  :7050     │
   └────────────┘        └──────┬───────┘        └────────────┘
                                 ▲
   ┌────────────┐                │
   │    ca0     │──── enrols ────┘
   │  :7054     │
   └────────────┘
```

| Service | Image | Host port | Container port | Used by |
|---|---|---|---|---|
| `orderer0` | `hyperledger/fabric-orderer:2.5` | `7050`, `2020` | `7050`, `2020` | `deploy.sh` → `ORDERER=localhost:7050` |
| `ca0` | `hyperledger/fabric-ca:1.5` | `7054` | `7054` | `deploy.sh` → `PEER_CA=localhost:7054`; member enrolment |
| `peer0` | `hyperledger/fabric-peer:2.5` | `7051`, `9443` | `7051`, `9443` | `deploy.sh` → `PEER_CONN=localhost:7051`; chaincode host |
| `couchdb` | `couchdb:3.3.3` | `5984`, `6924` | `5984`, `6924` | peer's key/value **state** database |
| `cli` | `hyperledger/fabric-tools:2.5` | — | — | interactive `peer` CLI (profile `cli` only) |

The peer's **block store stays LevelDB** (default, on the peer's own volume `peer-data`); only the
world state is externalised to CouchDB — the same split the official `fabric-samples` network
uses.

> CouchDB is the upstream Apache image, not a `hyperledger/fabric-*` image — `fabric-samples`
> uses `couchdb:3.3.3` for the same reason: Hyperledger never published a CouchDB image.

### Volumes and paths

| Host path | Mounted in the containers as | Contents |
|---|---|---|
| `./crypto` | `/tmp/hyperledger` | `organizations/` (MSPs + TLS), `fabric-ca-config.yaml` |
| `./channel-artifacts` | `/tmp/hyperledger/channel-artifacts` | `genesis.block`, `configtx.yaml`, the channel transaction |
| `../chaincode` | `/tmp/hyperledger/chaincode` | the chaincode source, for the external (Node.js) chaincode builder |

`deploy.sh` expects **crypto material under `/tmp/hyperledger`** and **channel artifacts under
`./channel-artifacts`** — see [§6](#6-pointing-deploysh-at-this-network). Because `deploy.sh` runs
the peer CLI **on the host**, the host must also be able to resolve `/tmp/hyperledger/...`; the
one-line symlink in §6 does that.

---

## 2. Start the containers

```bash
cd network
docker compose up -d couchdb orderer0 ca0 peer0
docker compose ps
docker compose logs -f peer0
```

The orderer will not start cleanly until `genesis.block` exists (§4). Start it after the channel
artifacts are generated, or restart it once they exist:

```bash
docker compose restart orderer0
```

To open an interactive peer CLI:

```bash
docker compose --profile cli up cli
# you are now inside the container, working dir /tmp/hyperledger
peer version
```

---

## 3. Generate certificates and MSPs with `cryptogen`

`cryptogen` creates one MSP and one TLS bundle per organisation. The four GreenToken
organisations map to four MSP ids:

| Peer org directory | MSP id | Role |
|---|---|---|
| `peerOrganizations/planters.example.com` | `PlantersAssociationMSP` | submits planting proofs |
| `peerOrganizations/forest.example.com` | `ForestDeptMSP` | verifies; runs the ordering service |
| `peerOrganizations/auditor.example.com` | `AuditorMSP` | verifies and settles |
| `peerOrganizations/funders.example.com` | `CorporateFundersMSP` | funds and settles |

### 3.1 `crypto-config.yaml`

Write it to `network/crypto/crypto-config.yaml`:

```yaml
OrdererOrgs:
  - Name: Orderer
    Domain: example.com
    Spec:
      Hostnames:
        - orderer.greentoken.com
        - orderer.example.com
      Client:
        Organization: OrdererOrg
      Server:
        Organization: OrdererOrg
        Hostnames:
          - orderer.greentoken.com
          - orderer.example.com
      CA:
        Organization: OrdererOrg

PeerOrgs:
  - Name: PlantersAssociation
    Domain: example.com
    Spec:
      Hostnames:
        - peer0.greentoken.com
        - peer0.example.com
      Client:
        Organization: PlantersAssociationOrg
      Server:
        Organization: PlantersAssociationOrg
        Hostnames:
          - peer0.greentoken.com
          - peer0.example.com
      CA:
        Organization: PlantersAssociationOrg

  - Name: ForestDept
    Domain: example.com
    Spec:
      Hostnames:
        - peer1.greentoken.com
        - peer1.example.com
      Client:
        Organization: ForestDeptOrg
      Server:
        Organization: ForestDeptOrg
        Hostnames:
          - peer1.greentoken.com
          - peer1.example.com
      CA:
        Organization: ForestDeptOrg

  - Name: Auditor
    Domain: example.com
    Spec:
      Hostnames:
        - peer2.greentoken.com
        - peer2.example.com
      Client:
        Organization: AuditorOrg
      Server:
        Organization: AuditorOrg
        Hostnames:
          - peer2.greentoken.com
          - peer2.example.com
      CA:
        Organization: AuditorOrg

  - Name: CorporateFunders
    Domain: example.com
    Spec:
      Hostnames:
        - peer3.greentoken.com
        - peer3.example.com
      Client:
        Organization: CorporateFundersOrg
      Server:
        Organization: CorporateFundersOrg
        Hostnames:
          - peer3.greentoken.com
          - peer3.example.com
      CA:
        Organization: CorporateFundersOrg
```

### 3.2 Run cryptogen

```bash
cd network
mkdir -p crypto channel-artifacts
cryptogen \
  --config=crypto/crypto-config.yaml \
  --output=crypto/organizations \
  --output=crypto/fabric-ca \
  --output=crypto/genesis.block \
  --output=crypto/channel-artifacts \
  --input=ordererOrganizations \
  --input=peerOrganizations \
  --output=channel-artifacts
```

Afterwards `crypto/organizations/` looks like this:

```
crypto/organizations/
├── ordererOrganizations/example.com/{msp,tls}
└── peerOrganizations/
    ├── planters.example.com/{msp,tls}
    ├── forest.example.com/{msp,tls}
    ├── auditor.example.com/{msp,tls}
    └── funders.example.com/{msp,tls}
```

Every peer organisation gets `tls/client.crt`, `tls/client.key` and `tls/ca.crt` — the three files
`deploy.sh` passes to the peer CLI. The `msp/` directories carry `config.yaml`, `signcerts/`,
`keystore/` and `cacerts/`.

> The compose file mounts `./crypto` at `/tmp/hyperledger`, so the peer reads its MSP from
> `/tmp/hyperledger/organizations/peerOrganizations/example.com/msp`. If you keep the directory
> names above, rename or copy `planters.example.com` to `example.com` (the peer's own org), or
> point `CORE_PEER_MSPCONFIGPATH` at the directory you actually generated.

### 3.3 The Fabric CA

`crypto/fabric-ca/fabric-ca-config.yaml` is generated by `cryptogen` and points the server at the
orderer org's MSP. Move it where the compose file expects it and start the CA:

```bash
cp crypto/fabric-ca/fabric-ca-config.yaml crypto/fabric-ca-config.yaml
docker compose up -d ca0
docker compose logs -f ca0
```

Enrol the member identities into their organisations' CAs (one CA per org in a real network; the
lab uses the single `ca0` with per-org admin credentials):

```bash
fabric-ca-client register --enroll.id.name admin --enroll.id.secret adminpw \
  --tls.certfiles /tmp/hyperledger/organizations/ordererOrganizations/example.com/tls/ca.crt \
  --url https://localhost:7054
```

---

## 4. Create and join the channel with `configtxgen`

### 4.1 `configtx.yaml`

Write it to `network/channel-artifacts/configtx.yaml`:

```yaml
Organizations:
  - &PlantersAssociation
    Name: PlantersAssociationMSP
    ID: PlantersAssociationMSP
    MSPDir: ../crypto/organizations/peerOrganizations/planters.example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('PlantersAssociationMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('PlantersAssociationMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('PlantersAssociationMSP.admin')"
    Identity:
      MspId: PlantersAssociationMSP
      MspType: ENDORSEMENT
      MaxMSPs: 1

  - &ForestDept
    Name: ForestDeptMSP
    ID: ForestDeptMSP
    MSPDir: ../crypto/organizations/peerOrganizations/forest.example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('ForestDeptMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('ForestDeptMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('ForestDeptMSP.admin')"
    Identity:
      MspId: ForestDeptMSP
      MspType: ENDORSEMENT
      MaxMSPs: 1

  - &Auditor
    Name: AuditorMSP
    ID: AuditorMSP
    MSPDir: ../crypto/organizations/peerOrganizations/auditor.example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('AuditorMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('AuditorMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('AuditorMSP.admin')"
    Identity:
      MspId: AuditorMSP
      MspType: ENDORSEMENT
      MaxMSPs: 1

  - &CorporateFunders
    Name: CorporateFundersMSP
    ID: CorporateFundersMSP
    MSPDir: ../crypto/organizations/peerOrganizations/funders.example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('CorporateFundersMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('CorporateFundersMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('CorporateFundersMSP.admin')"
    Identity:
      MspId: CorporateFundersMSP
      MspType: ENDORSEMENT
      MaxMSPs: 1

  - &OrdererOrg
    Name: OrdererMSP
    ID: OrdererMSP
    MSPDir: ../crypto/organizations/ordererOrganizations/example.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('OrdererMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('OrdererMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('OrdererMSP.admin')"
    Identity:
      MspId: OrdererMSP
      MspType: ORDERER
      MaxMSPs: 1

Capabilities:
  Channel: &ChannelCapabilities
    V2_0: true
  Orderer: &OrdererCapabilities
    V2_0: true
  Application: &ApplicationCapabilities
    V2_0: true

Application:
  Organizations:
    - *PlantersAssociation
    - *ForestDept
    - *Auditor
    - *CorporateFunders

Orderer:
  Type: etcdraft
  Addresses:
    - orderer.greentoken.com:7050
  EtcdRaft:
    Consenters:
      - Host: orderer.greentoken.com
        Port: 7050
        ClientTLSCert: ../crypto/organizations/ordererOrganizations/example.com/tls/server.crt
        ServerTLSCert: ../crypto/organizations/ordererOrganizations/example.com/tls/server.crt
    Options:
      TickInterval: 500ms
      ElectionTick: 10
      HeartbeatTick: 1
      MaxInflightBlocks: 5
      SnapshotIntervalSize: 10000

Profiles:
  GreenTokenChannel:
    Consortiums:
      GreenTokenConsortium:
        Organizations:
          - *PlantersAssociation
          - *ForestDept
          - *Auditor
          - *CorporateFunders
    Application:
      Organizations:
        - *PlantersAssociation
        - *ForestDept
        - *Auditor
        - *CorporateFunders
      Capabilities:
        <<: *ApplicationCapabilities
    Orderer:
      Type: etcdraft
      Addresses:
        - orderer.greentoken.com:7050
      Options:
        OrdererAddresses:
          - orderer.greentoken.com:7050
        OrdererOrganization: OrdererOrg
        Capabilities:
          <<: *OrdererCapabilities
      EtcdRaft:
        Consenters:
          - Host: orderer.greentoken.com
            Port: 7050
            ClientTLSCert: ../crypto/organizations/ordererOrganizations/example.com/tls/server.crt
            ServerTLSCert: ../crypto/organizations/ordererOrganizations/example.com/tls/server.crt
        Options:
          TickInterval: 500ms
          ElectionTick: 10
          HeartbeatTick: 1
          MaxInflightBlocks: 5
          SnapshotIntervalSize: 10000
    Capabilities:
      <<: *ChannelCapabilities
```

### 4.2 Generate the genesis block and the channel transaction

```bash
cd network/channel-artifacts

configtxgen -profile GreenTokenChannel \
  -outputBlock genesis.block \
  -outputChannelArtifacts .

configtxgen -profile GreenTokenChannel \
  -outputChannelArtifacts .
```

The first command writes `genesis.block`; the second writes the channel configuration
transaction (`configtx.yaml` plus the channel tx) used by the orderer.

### 4.3 Create the channel on the orderer

With a consortium-based channel the orderer must first know the consortium, then accept the
channel transaction:

```bash
# extract the consortium definition
configtxlator -channelID=greentoken-channel \
  -output=consortium.json configtx.yaml

# create the consortium / channel on the orderer
osnadmin channel create --channelID=greentoken-channel --config consortium.json
# Fabric v2.5 equivalent, through the orderer's admin endpoint:
# curl -X POST -H "Authorization: Bearer <token>" \
#      https://localhost:7050/v3/channels -d '{"configPath":"/tmp/hyperledger/channel-artifacts/consortium.json"}'
```

### 4.4 Join the peers

Run this once per organisation, using that organisation's client TLS certificate:

```bash
peer channel join --channelID greentoken-channel \
  --peer.address peer0.greentoken.com:7051 \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/planters.example.com/tls/client.crt \
  --tlsClientKeyPath  /tmp/hyperledger/organizations/peerOrganizations/planters.example.com/tls/client.key \
  --tlsRootCertPath   /tmp/hyperledger/organizations/peerOrganizations/planters.example.com/tls/ca.crt
```

Then set an anchor peer so the other peers can catch up:

```bash
peer channel update --channelID greentoken-channel \
  --peer.address peer0.greentoken.com:7051 \
  --anchor-peer \
  --tlsClientCertPath ... --tlsClientKeyPath ... --tlsRootCertPath ...
```

Check that it worked:

```bash
peer channel list
```

> **Host name resolution.** The orderer and peers refer to each other by the names in
> `configtx.yaml` (`orderer.greentoken.com`, `peer0.greentoken.com`). Inside the compose network
> Docker resolves the container hostnames; on the host, add them to `/etc/hosts`:
> `127.0.0.1 orderer.greentoken.com peer0.greentoken.com`.

---

## 5. Deploy the chaincode

```bash
cd ..
./network/deploy.sh
```

`deploy.sh` builds `chaincode/` (`npm install && npm run build`), then runs the four lifecycle
steps: **package → install → approveformyorg → commit**. The full walkthrough with the rationale
behind each step is in [`../docs/lab-record.md`](../docs/lab-record.md) §4.

### 5.1 Two things to fix before you run it on a real network

Both are properties of the existing script, recorded here rather than changed:

1. **The approve loop covers one organisation.**
   `deploy.sh:47` reads `for ORG in example.com`. On the four-MSP consortium, the definition must
   be approved once per organisation, each with that organisation's client certificate:
   `planters.example.com`, `forest.example.com`, `auditor.example.com`, `funders.example.com`.
   `commit` fails until the approvals match the channel's endorsement policy.

2. **`--package-id` must be the PACKAGE_ID, not the tarball name.**
   `peer lifecycle chaincode package` prints
   `Package ID: greentoken:1.0.0:<hash>`; `approveformyorg` needs that string in
   `--package-id`. `deploy.sh:52` passes `"$CHAINCODE_NAME.tar.gz"`. Capture the id from the
   package step's output and pass it in.

3. **No explicit endorsement policy is committed.** Without `--endorsement-policy` the channel's
   default policy applies. To let the *platform* enforce the GreenToken quorum, commit with the
   state-based policy for the token key:

   ```
   Signature: NOutOf: 2 of ('ForestDeptMSP'.role,'AuditorMSP'.role)
   ```

   The in-contract quorum check (`REQUIRED_ENDORSEMENTS = 2`) remains the second line of defence.

---

## 6. Pointing `deploy.sh` at this network

`deploy.sh` reads its endpoints from environment variables, defaulting to the ports this compose
file publishes:

| Variable | Default | Meaning | This compose file |
|---|---|---|---|
| `CHANNEL` | `greentoken-channel` | channel id | — |
| `CHAINCODE_NAME` | `greentoken` | chaincode namespace | must match `contracts = { greentoken: … }` in `chaincode/src/contract.ts` |
| `CHAINCODE_VERSION` | `1.0.0` | chaincode version | matches `info.version` |
| `SEQUENCE` | `1` | definition sequence | increment on every upgrade |
| `PEER_CONN` | `localhost:7051` | peer chaincode gRPC | `peer0` → `7051` |
| `ORDERER` | `localhost:7050` | ordering service | `orderer0` → `7050` |
| `PEER_CA` | `localhost:7054` | the Fabric CA | `ca0` → `7054` |

### 6.1 The path contract

`deploy.sh` reads its TLS material from **absolute host paths**:

```
/tmp/hyperledger/organizations/peerOrganizations/<org>/tls/client.crt
/tmp/hyperledger/organizations/peerOrganizations/<org>/tls/client.key
/tmp/hyperledger/organizations/peerOrganizations/<org>/tls/ca.crt
```

and the channel artifacts from **`./channel-artifacts`** (relative to `network/`).

Because the peer CLI in `deploy.sh` runs on the host while the compose file mounts `./crypto` at
`/tmp/hyperledger` *inside* the containers, make the host path match with one symlink:

```bash
cd network
sudo ln -sfn "$(pwd)/crypto" /tmp/hyperledger
ls /tmp/hyperledger/organizations/peerOrganizations/   # must list your orgs
```

`channel-artifacts/` is already relative to `network/`, which is where `deploy.sh` is invoked
from — no symlink needed for that one.

### 6.2 Run it

```bash
cd network
sudo ln -sfn "$(pwd)/crypto" /tmp/hyperledger        # once

cd ..                                              # project root
CHANNEL=greentoken-channel \
PEER_CONN=localhost:7051 \
ORDERER=localhost:7050 \
PEER_CA=localhost:7054 \
./network/deploy.sh
```

### 6.3 Invoke the chaincode

```bash
peer chaincode invoke -C greentoken-channel -n greentoken \
  -c '{"Args":["WhoAmI"]}' \
  -o localhost:7050 \
  --tlsClientCertPath /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.crt \
  --tlsClientKeyPath  /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/client.key \
  --tlsRootCertPath   /tmp/hyperledger/organizations/peerOrganizations/example.com/tls/ca.crt
```

`WhoAmI` echoes the caller's MSP-derived identity — proof that identity comes from the
certificate, not from the request payload.

---

## 7. Tear down

```bash
docker compose --profile cli down -v      # -v also removes the CouchDB, CA and peer volumes
rm -rf crypto channel-artifacts
sudo rm /tmp/hyperledger
```

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `orderer0` exits at start | `genesis.block` is missing — generate it (§4.2) and `docker compose restart orderer0` |
| `peer lifecycle chaincode install` → "peer not found" | `PEER_CONN` does not match the published port, or the peer's MSP directory does not exist under `/tmp/hyperledger` |
| `approveformyorg` → "invalid package id" | `--package-id` must be the PACKAGE_ID printed by the package step |
| `commit` → "no approvals" | Not every organisation has approved — run the approval once per org |
| `invoke` → "access denied" | The transaction's endorsement policy was not satisfied — check the signed-by orgs of the proposal |
| `cannot resolve orderer.greentoken.com` | Add the service names to `/etc/hosts` (see §4.4) |
| Chaincode container fails to build | The external builder needs the chaincode source — the compose file mounts `../chaincode` at `/tmp/hyperledger/chaincode` |
