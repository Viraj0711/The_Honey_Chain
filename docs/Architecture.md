# Software & System Architecture

## 1. End-to-End Multi-Model Architecture Topology

```
+---------------------------------------------------------------------------------+
|                                 EDGE LAYER                                      |
|                                                                                 |
|  +-------------------+   +--------------------+   +--------------------------+  |
|  | DHT22 Climate     |   | Dual INMP441 Mics  |   | ESP32-CAM (YOLOv8)       |  |
|  | (Temp & Humidity) |   | (I2S Bio-Acoustics)|   | MPU 6050 (6-Axis Motion) |  |
|  +---------+---------+   +---------+----------+   +------------+-------------+  |
|            |                       |                           |                |
|            +-----------------------+---------------------------+                |
|                                    |                                            |
|                                    v                                            |
|                    +--------------------------------+                           |
|                    | ESP32-S3 Microcontroller       |                           |
|                    | - Software ECDSA Signatures    |                           |
|                    | - Power: 5V Laptop USB Port    |                           |
|                    +---------------+----------------+                           |
+------------------------------------|--------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                         TINYML & MODEL 1 INGESTION                              |
|                                                                                 |
|  +---------------------------+       +---------------------------------------+  |
|  | TinyML Engine             | ----> | Database Model 1                      |  |
|  | (Generates HW Batch Report) |       | (HardwareBatchReport Schema)          |  |
|  +---------------------------+       +-------------------+-------------------+  |
+----------------------------------------------------------|----------------------+
                                                           |
                                                           v
+---------------------------------------------------------------------------------+
|                        FARMER LAB UPLOAD & MODEL 2                              |
|                                                                                 |
|  +---------------------------+       +---------------------------------------+  |
|  | Farmer Web Upload Portal  | ----> | Database Model 2                      |  |
|  | (Lab Test PDF & Parameters)|       | (FarmerLabReport Schema)              |  |
|  +---------------------------+       +-------------------+-------------------+  |
+----------------------------------------------------------|----------------------+
                                                           |
                                                           v
+---------------------------------------------------------------------------------+
|                       AI COMPARISON ENGINE & MODEL 3                            |
|                                                                                 |
|                    +--------------------------------+                           |
|                    | Dual-Report AI Engine          |                           |
|                    | - Compares Model 1 & Model 2   |                           |
|                    | - Generates Final Synthesis    |                           |
|                    +---------------+----------------+                           |
|                                    |                                            |
|                                    v                                            |
|                    +--------------------------------+                           |
|                    | Database Model 3               |                           |
|                    | (FinalVerifiedReport Schema)   |                           |
|                    +---------------+----------------+                           |
+------------------------------------|--------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                      CONSUMER QR PASSPORT & BLOCKCHAIN                          |
|                                                                                 |
|  +------------------------+   +----------------------+   +-------------------+  |
|  | Dynamic QR Code        |   | EVM Smart Contracts  |   | Consumer Web UI   |  |
|  | (Encodes Model 3 URI)  |   | - ERC-1155 Token     |   | (Renders Final    |  |
|  |                        |   | - Anchors Model 3 Hash|  |  Verified Report) |  |
|  +------------------------+   +----------------------+   +-------------------+  |
+---------------------------------------------------------------------------------+
```

## 2. Multi-Model Data Flow Pipeline
1. Hardware Batch Logging: Telemetry captured by the ESP32-S3 passes through TinyML inference to generate a hardware report, stored in **Database Model 1**.
2. Farmer Lab Upload: The farmer uploads official lab analysis for the batch via the web interface, stored in **Database Model 2**.
3. AI Report Synthesis: The Cloud AI Comparison service fetches Model 1 and Model 2 records for the target batch ID, evaluates cross-consistency, and writes the output to **Database Model 3**.
4. QR Passport Resolution: The platform generates a dynamic QR code linked to Model 3. Scanning the QR code renders the synthesized Model 3 report directly to the consumer.
