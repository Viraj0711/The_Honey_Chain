# Epidemiological & Quality Diagnostic Rules

## 1. Edge & Biological Diagnostic Thresholds

| Pathology / Event | Primary Sensor | Signal / Threshold Condition | Automated System Action |
| :--- | :--- | :--- | :--- |
| Swarming State | INMP441 Microphones | FFT spectral power peak in 250–450 Hz band | Trigger swarming alert to mobile / USSD |
| Queen Loss / Piping | Dual INMP441 (TDOA) | Pulsed 340–500 Hz signal; TDOA identifies frame offset | Highlight comb frame coordinate for queen check |
| Varroosis Mite | ESP32-CAM | YOLOv8 vision scan flags >3% mite count per frame | Trigger treatment protocol (Formic/Oxalic acid) |
| Brood Climate Stress | DHT22 Sensor | Core temperature strays outside 32.0°C – 36.0°C | Alert manager to adjust hive ventilation/shade |
| Physical Tampering | MPU 6050 Motion | Tilt angle >30° or sudden acceleration impulse | Write high-priority security payload to memory |

## 2. Dual-Report AI Comparison & Quality Rules

| Model 1 Input (TinyML Hardware) | Model 2 Input (Farmer Lab Upload) | AI Cross-Comparison Rule | Model 3 Output Decision |
| :--- | :--- | :--- | :--- |
| Normal baseline acoustics & climate | All parameters within FSSAI legal limits | High data consistency (>90% match) | Verdict: PASSED. Generate QR code for Model 3. |
| High acoustic distress or colony loss flagged | Lab report uploaded shows normal yield | Discrepancy: Harvest volume inconsistent with hive state | Verdict: FLAGGED. Highlight yield anomaly in Model 3. |
| Normal edge telemetry | C3/C4 sugars >7.0% or SMR/TMR positive | Physicochemical violation detected | Verdict: REJECTED. Block token minting and alert regulatory portal. |
| Edge telemetry missing / corrupted | Lab report valid and accredited | Missing hardware telemetry confirmation | Verdict: PARTIAL PASSED. Note missing IoT proof in Model 3 summary. |

## 3. Physicochemical Quality Validation Rules (FSSAI)

| Quality Parameter | FSSAI Compliance Limit | Rule Enforcement Outcome |
| :--- | :--- | :--- |
| Moisture Content | Maximum 20.0% | Reject token minting; flag fermentation risk |
| HMF Content | Maximum 40.0 mg/kg | Reject token minting; flag thermal damage/invert syrup |
| Apparent Reducing Sugars | Minimum 65.0% | Reject token minting; flag dilution |
| Sucrose Content | Maximum 5.0% | Reject token minting; flag un-inverted cane syrup |
| C3/C4 Sugars | Maximum 7.0% | Reject token minting; flag cane/corn syrup addition |
| SMR & TMR Markers | Must be Negative | Reject token minting; immediate blacklist (rice syrup) |
