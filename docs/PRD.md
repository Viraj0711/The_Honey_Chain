# Product Requirement Document (PRD)

## 1. Document Overview & Objective
This document defines the functional, operational, user, and technical boundary specifications for the Smart Apiculture Traceability Platform. It serves as the primary system context and truth model for software agents, engineers, and developers building the platform. All hardware references, user interaction flows, data retention policies, multi-model database schema pipelines, and cryptographic requirements outlined here must be implemented without hallucination or arbitrary extrapolation.

---

## 2. Platform Core Vision & Context
The platform is a software-first, edge-AI and EVM-blockchain supply chain traceability ecosystem engineered to solve honey adulteration and enable precision apiary management. It replaces manual off-chain assertions with cryptographically signed telemetry, computer vision, bio-acoustics, TinyML edge report generation, web-uploaded laboratory reports, dual-report AI reconciliation, and dynamic consumer-facing QR passports.

### Key System Constraints & Architecture Rules
* Power Subsystem: System is powered strictly via a 5V laptop USB port interface (no solar panels, no LiFePO4 battery modules).
* Hardware Security: Physical crypto silicon (e.g., NXP SE050) is replaced entirely by a software cryptographic library running ECDSA secp256k1 and HMAC-SHA256 signatures inside the ESP32-S3 software runtime with eFuse-protected flash encryption.
* Motion Sensing: Micro-movement, orientation tracking, and anti-theft monitoring use the MPU 6050 6-axis accelerometer/gyroscope module (replaces ADXL345).
* Excluded Components: Load cells (HX711 weight scales), standalone thermal imagers (MLX90640), and E-Nose VOC gas sensors are explicitly NOT used in this architecture.
* Local Data Lifecycle & Sync: Telemetry captured at the edge is buffered in local storage when Wi-Fi is unavailable. Upon network restoration, data automatically syncs to cloud storage (CouchDB/FastAPI). Local records automatically refresh and hard-delete entries older than 7 days.

---

## 3. Targeted User Personas & Ecosystem Stakeholders

### Primary Persona 1: Commercial Beekeeper & Smallholder Farmer
* Target Demographics: Independent migratory/stationary beekeepers, traditional honey harvesters, and rural smallholders across Indian apiary belts.
* Technical Access Level: Low to Medium. Operates smartphone mobile app or basic feature phone via USSD (*123#).
* Core Pain Points: Colony losses due to unmonitored parasite infestations (Varroa destructor, DWV), absconding/swarming, inability to command premium pricing due to market adulteration.
* System Interactions:
  * Receives automated edge alerts on swarming (FFT 250–450 Hz) or queen distress (FFT 340–500 Hz).
  * Views comb frame identification via dual-microphone TDOA spatial location.
  * Uploads lab test PDF/data reports for specific honey batches via the web platform/app.
  * Logs harvest batches, geolocation, and floral origin via app or USSD keypads.
  * Receives tokenized Pollination Credits via Direct Benefit Transfer (DBT) smart contract escrow.

### Primary Persona 2: Farmer Producer Organization (FPO) & Apiary Aggregator
* Target Demographics: Regional cooperative managers, FPO executives, and bulk honey collection centers.
* Technical Access Level: High. Operates web administrative portals and tablet interfaces.
* Core Pain Points: Bulk batch contamination, mixing pure honey with adulterated syrups, lack of digital chain-of-custody tracking.
* System Interactions:
  * Aggregates individual farmer harvests into unified commercial processing batches.
  * Assigns digital batch identifiers and links accredited laboratory testing reports.
  * Issues software cryptographically verified custody transfers to processors and distributors.

### Primary Persona 3: Accredited Testing Laboratory & Quality Regulator
* Target Demographics: FSSAI-accredited testing facilities, NMR spectroscopy labs, and regulatory auditors.
* Technical Access Level: Professional / Enterprise. Operates laboratory management system APIs and web consoles.
* Core Pain Points: Certificate forgery, untraceable lab reports, inability to enforce legal purity limits in retail supply chains.
* System Interactions:
  * Performs physicochemical analysis (NMR, HMF, Moisture, C3/C4 sugars, SMR/TMR markers).
  * Uploads cryptographic hashes of certified lab reports directly to the blockchain contract.
  * Executes batch clearance or rejection rules based on regulatory thresholds.

### Primary Persona 4: End Consumer & Retail Customer
* Target Demographics: Domestic retail shoppers, international exporters, and health-conscious honey buyers.
* Technical Access Level: Everyday Consumer. Uses standard smartphone camera applications.
* Core Pain Points: Fear of purchasing C3/C4 sugar syrup or rice syrup adulterated honey, lack of transparent origin data.
* System Interactions:
  * Scans dynamic QR codes on consumer packaging to open the final verified report generated from Model 3.
  * Reviews reconciled floral source, map of apiary origin, hive health history, lab test purity results, and immutable custody chain.

---

## 4. Multi-Model Data & AI Analytics Pipeline Architecture

```
+---------------------------------------------------------------------------------+
|                                1. HARDWARE DATA                                 |
|   ESP32-S3 Telemetry -> TinyML Model -> Hardware Report -> Database Model 1      |
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                                 2. FARMER LAB DATA                              |
|   Farmer Uploads Lab Test -> Extraction Engine -> Lab Report -> Database Model 2|
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                             3. DUAL-REPORT AI ENGINE                            |
|   Database Model 1 + Database Model 2 -> AI Reconciliation -> Database Model 3  |
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                            4. CONSUMER QR PASSPORT                              |
|   Database Model 3 Record -> Dynamic QR Code -> Consumer Scans -> View Final Report|
+---------------------------------------------------------------------------------+
```

### 4.1 Ingestion & TinyML Hardware Report Pipeline (Database Model 1)
* Real-time hardware telemetry captured by the ESP32-S3 at a given timestamp is fed directly into an on-device/edge TinyML inference engine.
* The TinyML model evaluates raw acoustics, climate metrics, camera frames, and orientation data to generate an automated Hardware Batch Report.
* The generated hardware batch report is persisted directly into the cloud database using schema **Model 1 (HardwareBatchReport)**.

### 4.2 Farmer Lab Upload Pipeline (Database Model 2)
* The farmer or apiary manager uploads the official laboratory test report (document/PDF/data inputs) for a specific batch through the web platform or mobile portal.
* The system parses and structures the physicochemical lab parameters (Moisture, HMF, C3/C4 sugars, SMR/TMR, Diastase activity).
* The extracted laboratory data is persisted into the cloud database using schema **Model 2 (FarmerLabReport)**.

### 4.3 AI Dual-Report Comparison & Final Synthesis Engine (Database Model 3)
* A dedicated Cloud AI Reconciliation Engine ingests both **Model 1** (TinyML Hardware Report) and **Model 2** (Farmer Lab Report) for the corresponding batch ID.
* The AI engine cross-references telemetry anomalies against laboratory parameters to detect inconsistencies (e.g., high honey yield logged without corresponding bio-acoustic activity, or mismatched physical parameters).
* The AI engine synthesizes both sources into an integrated, verified **Final Batch Report**.
* The final synthesized output is stored in the database using schema **Model 3 (FinalVerifiedReport)**.

### 4.4 Consumer Dynamic QR Code Generation
* Upon creation/update of a record in **Model 3**, the system generates a dynamic QR code encoding a secure public URI pointing directly to the Model 3 record.
* When a retail customer scans the QR code on consumer packaging, the application fetches and renders the unified **Model 3 Final Verified Report** on the consumer UI.

---

## 5. Functional Requirements & Feature Breakdown

### 5.1 Multi-Modal Ingestion Engine
* The system shall ingest data from three channels: hardware edge nodes, mobile app interfaces, and USSD (*123#) feature phone routes.
* Offline-First Mobile Sync: PouchDB embedded on mobile clients buffers manual entries offline and replicates to CouchDB cloud clusters upon internet restoration.

### 5.2 Edge Diagnostics & Environmental Telemetry
* Bio-Acoustics Engine: Captures audio via dual INMP441 I2S microphones and executes 128-point FFT on the ESP32-S3:
  * 100 Hz – 220 Hz: Baseline flight, fanning, normal activity.
  * 250 Hz – 450 Hz: Swarming preparation state.
  * 340 Hz – 500 Hz: Queen piping / colony distress.
* TDOA Localization: Uses cross-correlation microsecond delay (dt = t2 - t1) to calculate spatial delta (dr = vs * dt) and isolate distress to a specific comb frame (#1 to #6).
* Computer Vision: Captures entrance video streams via ESP32-CAM and processes images using YOLOv8-nano models to flag Varroa mite infestations and Deformed Wing Virus (DWV).
* Climate Tracking: Monitored via DHT22 sensor for brood core temperature and humidity thresholds.
* Orientation & Anti-Theft: Monitored via MPU 6050 6-axis sensor for tilt and motion events.

### 5.3 Data Retention & Cloud Sync Manager
* Local Cache Engine: Telemetry signed by the software cryptographic key is saved to ESP32-S3 local flash memory during Wi-Fi outages.
* Reconnection Sync: Upon Wi-Fi link restoration, the buffer automatically streams un-synced payloads to the cloud endpoint (FastAPI / CouchDB).
* 7-Day Purge Protocol: Local memory manager auto-purges cached records older than 7 days to maintain storage availability and eliminate physical data tampering.

### 5.4 Off-Chain DAG Anomaly Engine & EVM Blockchain
* Evidence Graph (DAG): Evaluates incoming telemetry and supply chain transitions off-chain to detect anomaly invariants (e.g., volume inflation exceeding hive output capacity, duplicate batch IDs, missing custody transfers).
* EVM Smart Contracts: ERC-1155 batch tokens are minted only when accredited lab hashes (NMR/FSSAI) meet quality rules.
* Pollination Credit Escrow: Executes Direct Benefit Transfer (DBT) smart contract payouts to beekeepers based on validated hive uptime.

---

## 6. Non-Functional & Operational Requirements

### 6.1 Hardware Footprint & Power
* Interface: Powered directly from standard 5V USB ports (e.g., laptop USB interface).
* Form Factor: Non-destructive retrofit kit designed for wooden hives (Newton or Langstroth).

### 6.2 Physicochemical Quality Rules Engine
The platform automatically enforces compliance against FSSAI quality parameters prior to batch token minting:

| Quality Parameter | FSSAI Legal Limit | System Rule Enforcement |
| :--- | :--- | :--- |
| Moisture Content | Max 20.0% | Fail: Reject token minting (fermentation risk) |
| HMF Content | Max 40.0 mg/kg | Fail: Reject token minting (overheating / invert syrup) |
| Apparent Reducing Sugars | Min 65.0% | Fail: Reject token minting (starch syrup dilution) |
| Sucrose Content | Max 5.0% | Fail: Reject token minting (un-inverted cane syrup) |
| C3/C4 Sugar Syrups | Max 7.0% | Fail: Reject token minting (corn/cane syrup adulteration) |
| SMR & TMR Markers | Must be Negative | Fail: Immediate blacklist (rice syrup adulteration) |
| Diastase Activity | Min 8.0 Schade | Fail: Reject token minting (enzyme degradation) |
