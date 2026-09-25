# Hardware & Structural Layout

## 1. Physical Hardware Mounting Layout

```
+-------------------------------------------------------------------+
|                        HIVE ROOF ASSEMBLY                         |
|                     - Powered via USB Cable                       |
|                     - ESP32-S3 Master Board                       |
|                     - Software Crypto Module                      |
+-------------------------------------------------------------------+
|                     HONEY SUPER CHAMBER                           |
|                     (Surplus Honey Storage)                       |
|                                                                   |
+-------------------------------------------------------------------+
|                     MAIN BROOD CHAMBER                            |
|                     (Queen & Brood Core)                          |
|                                                                   |
|   * DHT22 (Temp/Hum)                   * MPU 6050 Motion Sensor    |
|   * INMP441 Mic 1 (Left)               * INMP441 Mic 2 (Right)    |
+-------------------------------------------------------------------+
|                    ENTRANCE SCANNER CHUTE                         |
|   * ESP32-CAM + LED Ring Chute (YOLOv8 Bee Scanning)              |
+-------------------------------------------------------------------+
|                       BASE/STAND PLATFORM                         |
|                     - Non-destructive Mount                       |
+-------------------------------------------------------------------+
```

## 2. Consumer QR Code & Model 3 Report UI Design

```
+-------------------------------------------------------+
|                HONEY PASSPORT (MODEL 3)               |
+-------------------------------------------------------+
|  BATCH ID: #HC-2026-8892                              |
|  FLORAL ORIGIN: Multi-Floral Wild Forest              |
|  PURITY STATUS: VERIFIED PURE (PASSED)                |
+-------------------------------------------------------+
| [ AI COMPARISON SUMMARY ]                             |
|  - Hardware Telemetry (Model 1): Hive health optimal  |
|  - Lab Test Results (Model 2): C3/C4 <1.2%, HMF 12mg  |
|  - AI Verdict: 98.4% Consistency Match                |
+-------------------------------------------------------+
| [ VERIFIABLE BLOCKCHAIN RECORD ]                      |
|  Tx Hash: 0x9f82...3b1a                               |
|  ERC-1155 Token ID: 8892                              |
+-------------------------------------------------------+
```

## 3. Hardware Bill of Materials (BOM)

| Component | Function | Interface |
| :--- | :--- | :--- |
| ESP32-S3 Microcontroller | Master processing, FFT computation, software crypto, TinyML input feed | I2C / I2S / GPIO / Wi-Fi |
| MPU 6050 Sensor | 6-axis motion, orientation tracking, anti-theft monitoring | I2C |
| ESP32-CAM Module | Entrance image capture for YOLOv8 mite and wing deformity scan | GPIO / SPI |
| Dual INMP441 MEMS Mics | Bio-acoustic audio sampling (100–500 Hz) & TDOA triangulation | Dual I2S |
| DHT22 Sensor | Brood core temperature and humidity monitoring | One-Wire Digital Bus |
| USB Power Cable | 5V DC power delivery from laptop USB port | USB-C / USB-A |
