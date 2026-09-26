# HoneyChain Platform - Assets Requirement Specification

## 1. Media & Graphical Assets

*   **Bee Cursor Graphic (`bee-cursor.svg` or `bee-cursor.png`)**
    *   **Description:** A top-down vector illustration or high-resolution render of an *Apis cerana indica* (Indian Hive Bee) with spread wings[cite: 4].
    *   **Specifications:** Transparent background, 128x128 px canvas size, oriented facing upward (0° rotation). Tinted in the accent amber (`#F5A623`).
    *   **Usage:** Used by Framer Motion / GSAP to track cursor movements with spring lag and dynamic rotation angles.

*   **Ambient Hive Background Video (`hive-ambient-loop.mp4` / `.webm`)**
    *   **Description:** A slow-motion macro video clip (15–30 second seamless loop) showing subtle activity at a wooden beehive entrance or soft particulate motion (drifting pollen motes).
    *   **Specifications:** 1080p resolution, high-compression WebM/MP4 format (under 10 MB). Muted audio track.
    *   **Usage:** Placed in a fixed background layer underneath an 85% opaque `#16181D` dark overlay (`mix-blend-mode: multiply`) to provide continuous non-static motion.

*   **KVIC Wooden Hive "Digital Twin" Diagram (`kvic-hive-cutaway.svg`)**
    *   **Description:** An isometric 2D vector cutaway of a standard KVIC Newton brood box[cite: 4].
    *   **Specifications:** Clean vector SVG using dark outlines, showing internal comb frames with designated marker callouts for sensor placement (DHT22 central probe and dual INMP441 acoustic microphones)[cite: 4].
    *   **Usage:** Serves as the central visual centerpiece on the dashboard, displaying live heat-map glows derived from the DHT22 climate readings[cite: 4].

## 2. Typography & Web Fonts

*   **Primary Font: 'Passion One'**
    *   **Source:** Google Fonts import or local `.ttf` (`PassionOne-Bold.ttf`).
    *   **Usage:** Applied strictly to major section titles, live numeric metrics, hive identifiers, and critical alert popups.
*   **Secondary Font: 'Playwrite Belgique Wallonie-Bruxelles Guides'**
    *   **Source:** Google Fonts import.
    *   **Usage:** Applied to diagnostic logs, automated Edge-AI interpretations, system recommendations, and field note overlays.

## 3. UI & Iconography Assets

*   **Custom Sensor Icon Set (Monochrome SVGs)**
    *   **Description:** Vector icons matched to the specific hardware telemetry:
        *   `icon-acoustic-wave.svg` (INMP441 Microphone / Audio Frequency)[cite: 4]
        *   `icon-thermometer.svg` (DHT22 Temperature Probe)[cite: 4]
        *   `icon-droplet.svg` (DHT22 Brood Humidity Probe)[cite: 4]
        *   `icon-queen-crown.svg` (Queen Health / Piping Indicator)[cite: 4]
        *   `icon-warning-triangle.svg` (Swarm / Disease Risk Alert)[cite: 4]
        *   `icon-qr-code.svg` (Consumer Batch Passport Link)[cite: 4]
    *   **Specifications:** SVG format with `fill="currentColor"` to allow colors to dynamically shift between accent amber (`#F5A623`) during normal states and crimson (`#FF4747`) during alert states.

## 4. Technical Libraries & Frontend Dependencies

*   **Animation & Physics Engine:** `framer-motion` (React) or `gsap`. Handles spring-physics lag for the bee cursor, calculates trigonometric rotation angles (`Math.atan2`), and animates alert card entrances.
*   **Real-time Canvas Rendering Library:** `recharts`, `chart.js`, or Native HTML5 Canvas API. Renders the smooth rolling audio spectrogram representing the INMP441 microphone’s Fast Fourier Transform (FFT) audio frequency data (100 Hz–500 Hz range)[cite: 4].
*   **Tailwind CSS Configuration (`tailwind.config.js`):**
    ```javascript
    module.exports = {
      theme: {
        extend: {
          colors: {
            'base-dark': '#16181D',    // 60% Primary Canvas Background
            'surface-card': '#2A241D', // 30% Card & Container Base
            'amber-accent': '#F5A623', // 10% Accent (Healthy Data)
            'alert-crimson': '#FF4747' // 10% Accent (Critical State)
          },
          fontFamily: {
            'display': ['"Passion One"', 'cursive'],
            'handwriting': ['"Playwrite Belgique Wallonie-Bruxelles Guides"', 'cursive']
          }
        }
      }
    }
    ```

## 5. Data Simulation & Mock Telemetry Assets

*   **Mock Stream JSON Generator (`mock-telemetry-stream.js`)**
    *   **Description:** A local JavaScript script that generates simulated ESP32 payload data over WebSockets or periodic state updates.
    *   **Data Structure:**
        ```json
        {
          "hive_id": "KVIC-APIARY-01",
          "timestamp": "2026-09-26T09:30:00Z",
          "dht22": {
            "temperature_c": 34.2,
            "humidity_percent": 62.5
          },
          "inmp441": {
            "dominant_frequency_hz": 165,
            "spectral_density_db": 12.4,
            "behavioral_state": "NORMAL_BASELINE"
          }
        }
        ```