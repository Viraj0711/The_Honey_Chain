# Blockchain Architecture & Ledger Design

## 1. Smart Contract Architecture
* Standard: ERC-1155 Multi-Token Standard for batch tokenization, quality certification, and custody tracking.
* Lifecycle State Machine:
  1. BatchLogged: Beekeeper logs raw harvest data with GPS location and software-signed device ID (creates Model 1 entry).
  2. LabAttached: Farmer/Lab uploads accredited lab report (creates Model 2 entry).
  3. AISynthesized: Dual-report AI engine reconciles Model 1 and Model 2 into Model 3.
  4. TokenMinted: ERC-1155 token is minted, anchoring the SHA-256 hash of the Model 3 report to the blockchain.
  5. PassportGenerated: Token ID maps to the dynamic consumer QR code pointing to Model 3.

## 2. DAG Evidence Graph (Off-Chain Anomaly Engine)
* Structure: Directed Acyclic Graph (DAG) tracks off-chain state handoffs prior to ledger finality.
* Multi-Model Enforcement Rules:
  * Model 1 vs. Model 2 Cross-Check: Verifies that hardware activity signatures in Model 1 align with harvest volumes claimed in Model 2.
  * Model 3 Integrity Invariant: Blocks smart contract minting if Model 3 status returns REJECTED or flags severe adulteration.

## 3. Pollination Credit Escrow
* DBT Escrow System: Smart contract locks pollination funds and releases credits directly to verified beekeeper wallets based on edge telemetry uptime logged in Model 1.
