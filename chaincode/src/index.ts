/**
 * GreenToken chaincode entry point (package.json "main").
 *
 * `fabric-chaincode-node start` loads this module and expects a `contracts`
 * export that is an **array of contract classes** — the Fabric 2.5 bootstrap
 * (`fabric-shim`'s `ChaincodeFromContract`) creates the instances itself.
 *
 *   https://hyperledger.github.io/fabric-chaincode-node/main/api/tutorial-deep-dive-contract-interface.html
 */

// Node's Web Crypto implementation (the domain code calls `crypto.subtle`).
import './crypto.node';

import { GreenTokenContract } from './contract';

export { GreenTokenContract };

/** The contracts deployed by this chaincode. */
export const contracts = [GreenTokenContract];
