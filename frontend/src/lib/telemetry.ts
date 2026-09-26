import { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "./firebase";
import { clockTime, hhmm } from "./format";

export type ColonyState = "NORMAL" | "QUEEN_DISTRESS";
export type LogTone = "normal" | "amber" | "crimson";

export interface Telemetry {
  timestamp: string;
  dht22: { temp_c: number; humidity_percent: number };
  inmp441: { dominant_hz: number; state: ColonyState };
  tinyml: {
    status: string;
    prob_present: number;
    prob_absent: number;
  };
}

export interface DiagnosticEntry {
  id: string;
  tone: LogTone;
  text: string;
}

export const ACOUSTIC_BANDS = {
  baseline: { from: 100, to: 220 },
  distress: { from: 340, to: 500 },
} as const;

export const CLIMATE_LIMITS = {
  humidityRisk: 66,
  broodWarm: 35.4,
  broodFloor: 30.4,
  broodCeiling: 37.2,
  humidityFloor: 48,
  humidityCeiling: 71,
} as const;

const STREAM_INTERVAL_MS = 2000;
const LOG_RETENTION = 40;
const DISTRESS_PROBABILITY = 0.16;
const DISTRESS_MIN_MS = 6000;
const DISTRESS_MAX_MS = 5000;

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
const nextId = () =>
  `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const nominalProse: Array<(t: Telemetry) => string> = [
  (t) =>
    `Acoustic baseline steady at ${t.inmp441.dominant_hz} Hz. Colony behaviour nominal.`,
  () => "Thermal regulation stable across the 24 h run. Variance within 0.4°C.",
  () => "INMP441 FFT window clean. No Varroa-linked anomalies detected.",
  () => "Forager traffic consistent. Entrance remains unobstructed.",
];

function buildEntry(t: Telemetry): Omit<DiagnosticEntry, "id"> {
  const time = hhmm(t.timestamp);
  const { dominant_hz: hz, state } = t.inmp441;
  const { temp_c: temp, humidity_percent: hum } = t.dht22;

  if (state === "QUEEN_DISTRESS") {
    return {
      tone: "crimson",
      text: `[${time}] Queen distress signature at ${hz} Hz. Inspect brood comb for supersedure cells.`,
    };
  }
  if (hum > CLIMATE_LIMITS.humidityRisk) {
    return {
      tone: "amber",
      text: `[${time}] Humidity rising to ${hum}%. Increase ventilation to mitigate Chalkbrood risk.`,
    };
  }
  if (temp > CLIMATE_LIMITS.broodWarm) {
    return {
      tone: "amber",
      text: `[${time}] Brood nest warm at ${temp}°C. Distribute water trays near the entrance.`,
    };
  }
  return {
    tone: "normal",
    text: `[${time}] ${nominalProse[Math.floor(Math.random() * nominalProse.length)](t)}`,
  };
}

function seedEntries(): DiagnosticEntry[] {
  const base = Date.now();
  const seed = (
    minutesAgo: number,
    tone: LogTone,
    text: string,
  ): DiagnosticEntry => ({
    id: `seed-${minutesAgo}-${Math.random().toString(36).slice(2, 6)}`,
    tone,
    text: `[${clockTime(base - minutesAgo * 60_000)}] ${text}`,
  });

  return [
    seed(
      6,
      "normal",
      "ESP32-S3 link established. Streaming at 2 s intervals over MQTT.",
    ),
    seed(
      4,
      "normal",
      "INMP441 FFT window calibrated. Baseline acoustic band 100–220 Hz.",
    ),
    seed(
      2,
      "amber",
      "DHT22 humidity trending up 1.8%. Watching Chalkbrood exposure window.",
    ),
    seed(
      0,
      "normal",
      "Acoustic baseline steady at 168 Hz. Colony behaviour nominal.",
    ),
  ];
}

type FirebaseHistoryEntry = {
  timestamp?: number | string;
  temperature?: number | string;
  humidity?: number | string;
  dominant_freq_hz?: number | string;
  dominant_hz?: number | string;
  status?: string;
  prob_absent?: number | string;
  prob_present?: number | string;
  bands?: {
    temperature?: number | string;
    humidity?: number | string;
    dominant_freq_hz?: number | string;
    dominant_hz?: number | string;
    status?: string;
    prob_absent?: number | string;
    prob_present?: number | string;
    timestamp?: number | string;
  };
};

function normalizeTelemetry(
  entry: FirebaseHistoryEntry | undefined,
): Telemetry {
  const payload: Record<string, any> = entry ?? {};
  const temp = Number(payload.temperature ?? payload.temp ?? 0);
  const humidity = Number(payload.humidity ?? payload.rh ?? 0);
  const hz = Number(
    payload.dominant_freq_hz ??
      payload.dominant_hz ??
      payload.frequency_hz ??
      0,
  );
  const status = String(payload.status ?? "HEALTHY").toUpperCase();
  const probPresent = Number(payload.prob_present ?? payload.probPresent ?? 0);
  const probAbsent = Number(payload.prob_absent ?? payload.probAbsent ?? 0);
  const timestamp = Number(payload.timestamp ?? Date.now());

  const tinymlState =
    status.includes("QUEEN_ABSENT") ||
    status.includes("DISTRESS") ||
    status.includes("ALERT") ||
    probAbsent > probPresent
      ? "QUEEN_DISTRESS"
      : "NORMAL";

  return {
    timestamp: new Date(timestamp).toISOString(),
    dht22: {
      temp_c: Number.isFinite(temp) ? round1(temp) : 0,
      humidity_percent: Number.isFinite(humidity) ? round1(humidity) : 0,
    },
    inmp441: {
      dominant_hz: Number.isFinite(hz) ? Math.round(hz) : 0,
      state: tinymlState,
    },
    tinyml: {
      status: status || "HEALTHY",
      prob_present: Number.isFinite(probPresent) ? probPresent : 0,
      prob_absent: Number.isFinite(probAbsent) ? probAbsent : 0,
    },
  };
}

function buildFirebaseLogEntries(
  entries: FirebaseHistoryEntry[],
): DiagnosticEntry[] {
  return entries
    .slice(-LOG_RETENTION)
    .reverse()
    .map((entry, index) => {
      const telemetry = normalizeTelemetry(entry);
      const tone: LogTone =
        telemetry.inmp441.state === "QUEEN_DISTRESS"
          ? "crimson"
          : telemetry.dht22.humidity_percent > CLIMATE_LIMITS.humidityRisk ||
              telemetry.dht22.temp_c > CLIMATE_LIMITS.broodWarm
            ? "amber"
            : "normal";
      return {
        id: `firebase-${telemetry.timestamp}-${index}`,
        tone,
        text: `${tone === "crimson" ? "[Alert]" : "[Status]"} ${new Date(telemetry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${telemetry.inmp441.state === "QUEEN_DISTRESS" ? "Queen distress signature detected" : "Acoustic baseline stable"} at ${telemetry.inmp441.dominant_hz} Hz.`,
      };
    });
}

export function useMockTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry>(() => ({
    timestamp: new Date().toISOString(),
    dht22: { temp_c: 34.2, humidity_percent: 62.5 },
    inmp441: { dominant_hz: 168, state: "NORMAL" },
    tinyml: {
      status: "HEALTHY",
      prob_present: 0.8,
      prob_absent: 0.2,
    },
  }));
  const [logs, setLogs] = useState<DiagnosticEntry[]>(seedEntries);
  const distressUntil = useRef(0);
  const skipFirst = useRef(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTelemetry((prev) => {
        const now = Date.now();
        if (
          now > distressUntil.current &&
          Math.random() < DISTRESS_PROBABILITY
        ) {
          distressUntil.current =
            now + DISTRESS_MIN_MS + Math.random() * DISTRESS_MAX_MS;
        }
        const distress = now < distressUntil.current;
        const temp = clamp(
          prev.dht22.temp_c + (Math.random() - 0.5) * 0.7,
          CLIMATE_LIMITS.broodFloor,
          CLIMATE_LIMITS.broodCeiling,
        );
        const hum = clamp(
          prev.dht22.humidity_percent + (Math.random() - 0.5) * 2.4,
          CLIMATE_LIMITS.humidityFloor,
          CLIMATE_LIMITS.humidityCeiling,
        );
        const hz = distress
          ? ACOUSTIC_BANDS.distress.from +
            Math.random() *
              (ACOUSTIC_BANDS.distress.to - ACOUSTIC_BANDS.distress.from)
          : ACOUSTIC_BANDS.baseline.from +
            Math.random() *
              (ACOUSTIC_BANDS.baseline.to - ACOUSTIC_BANDS.baseline.from);

        return {
          timestamp: new Date(now).toISOString(),
          dht22: { temp_c: round1(temp), humidity_percent: round1(hum) },
          inmp441: {
            dominant_hz: Math.round(hz),
            state: distress ? "QUEEN_DISTRESS" : "NORMAL",
          },
          tinyml: {
            status: distress ? "ALERT: QUEEN_ABSENT (100.0%)" : "HEALTHY",
            prob_present: distress ? 0.01 : 0.8,
            prob_absent: distress ? 0.99 : 0.2,
          },
        };
      });
    }, STREAM_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setLogs((prev) =>
      [...prev, { id: nextId(), ...buildEntry(telemetry) }].slice(
        -LOG_RETENTION,
      ),
    );
  }, [telemetry]);

  return { telemetry, logs };
}

export function useFirebaseTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry>({
    timestamp: new Date().toISOString(),
    dht22: { temp_c: 0, humidity_percent: 0 },
    inmp441: { dominant_hz: 0, state: "NORMAL" },
    tinyml: {
      status: "HEALTHY",
      prob_present: 0,
      prob_absent: 0,
    },
  });
  const [logs, setLogs] = useState<DiagnosticEntry[]>([]);

  useEffect(() => {
    const historyRef = ref(db, "beehive/history");

    const unsubscribe = onValue(historyRef, (snapshot) => {
      const value = snapshot.val() as Record<
        string,
        FirebaseHistoryEntry
      > | null;
      if (!value) {
        setLogs([]);
        return;
      }

      const entries = Object.values(value);
      const latest = entries
        .slice()
        .sort(
          (a, b) =>
            Number(b.timestamp ?? b?.bands?.timestamp ?? 0) -
            Number(a.timestamp ?? a?.bands?.timestamp ?? 0),
        )[0];

      setTelemetry(normalizeTelemetry(latest));
      setLogs(buildFirebaseLogEntries(entries));
    });

    return () => unsubscribe();
  }, []);

  return { telemetry, logs };
}

export function fieldNote(distress: boolean, t: Telemetry) {
  if (distress) {
    return "Sharp piping tones from the brood box — the queen may be disturbed. Check for supersedure cells before dusk and keep the entrance clear.";
  }
  if (t.dht22.humidity_percent > CLIMATE_LIMITS.humidityRisk) {
    return "Air feels heavy in the hive this hour. Crack the upper vent to move the damp out before nightfall.";
  }
  if (t.dht22.temp_c > CLIMATE_LIMITS.broodWarm) {
    return "Warm run through the afternoon. Shade the west wall and keep the water tray topped up.";
  }
  return "Nest hum reads calm. Foragers are working the south approach — leave the entrance clear and the water tray full.";
}

export function isDistress(t: Telemetry) {
  return t.inmp441.state === "QUEEN_DISTRESS";
}
