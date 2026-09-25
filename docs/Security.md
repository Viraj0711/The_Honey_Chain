# System Security Architecture

## 1. Edge Identity & Cryptography
* Software Cryptographic Signatures: Every sensor reading is signed at the edge using an ECDSA secp256k1 private key managed by software cryptographic libraries.
* Storage Protection: Cryptographic keys reside in flash-encrypted memory partitions secured by ESP32-S3 eFuse capabilities.
* Oracle Defense: Ingestion nodes verify ECDSA signatures against registered device public keys before pushing data to Database Model 1 or the DAG engine.

## 2. Multi-Model Database & Pipeline Security
* Model 1 Integrity: Writes to Model 1 are restricted to verified edge node signatures processed by the TinyML ingestion engine.
* Model 2 Authentication: Farmer lab uploads (Model 2) require authenticated session tokens (OAuth2/JWT) and cryptographic hash validation of attached lab certificates.
* Model 3 Immutability: Model 3 records are write-once outputs generated strictly by the Cloud AI Comparison service. Once synthesized, the record hash is anchored to the EVM blockchain.

## 3. Transport & Dynamic QR Security
* Transport Encryption: TLS 1.3 enforced across all HTTP, API, database sync, and WebSocket channels.
* Public QR Resolution: Dynamic QR codes encode signed, read-only endpoint URIs pointing to Model 3 records. Public consumers have zero write access to backend models.
* Rolling 7-Day Purge: Local memory retention manager executes background deletion of cached edge records older than 7 days to eliminate physical extraction vulnerabilities.
