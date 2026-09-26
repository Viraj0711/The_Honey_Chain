import {
  Droplets,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Waves,
} from "lucide-react";
import StatCard from "./StatCard";
import type { Telemetry } from "../lib/telemetry";

interface TelemetryGridProps {
  telemetry: Telemetry;
  distress: boolean;
}

export default function TelemetryGrid({
  telemetry,
  distress,
}: TelemetryGridProps) {
  const presentPct = (telemetry.tinyml.prob_present * 100).toFixed(1);
  const absentPct = (telemetry.tinyml.prob_absent * 100).toFixed(1);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Thermometer}
          label="Brood Temp"
          value={telemetry.dht22.temp_c.toFixed(1)}
          unit="°C"
          sub="DHT22 · probe 1"
        />
        <StatCard
          icon={Droplets}
          label="Humidity"
          value={telemetry.dht22.humidity_percent.toFixed(1)}
          unit="%"
          sub="DHT22 · probe 1"
        />
        <StatCard
          icon={Waves}
          label="Dominant Band"
          value={telemetry.inmp441.dominant_hz}
          unit="Hz"
          sub="INMP441 · FFT peak"
          tone={distress ? "crimson" : "amber"}
        />
        <StatCard
          icon={distress ? ShieldAlert : ShieldCheck}
          label="Colony State"
          value={distress ? "ALERT" : "NOMINAL"}
          unit=""
          sub={distress ? "Queen distress detected" : "No anomalies detected"}
          tone={distress ? "crimson" : "default"}
        />
      </div>

      <div className="panel mt-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] tracking-[0.16em] text-ink-dim uppercase">
            TinyML Prediction
          </span>
          <span className="text-[11px] tracking-[0.16em] text-ink-dim uppercase">
            {telemetry.tinyml.status}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={ShieldCheck}
            label="Present"
            value={presentPct}
            unit="%"
            sub="TinyML queen present"
            tone={Number(presentPct) >= 50 ? "default" : "amber"}
          />
          <StatCard
            icon={ShieldAlert}
            label="Absent"
            value={absentPct}
            unit="%"
            sub="TinyML queen absent"
            tone={Number(absentPct) >= 50 ? "crimson" : "amber"}
          />
          <StatCard
            icon={Waves}
            label="Model"
            value={
              Number(presentPct) >= Number(absentPct) ? "PRESENT" : "ABSENT"
            }
            unit=""
            sub="Classification"
            tone={
              Number(presentPct) >= Number(absentPct) ? "default" : "crimson"
            }
          />
          <StatCard
            icon={Thermometer}
            label="Freq"
            value={telemetry.inmp441.dominant_hz}
            unit="Hz"
            sub="Dominant frequency"
            tone={distress ? "crimson" : "amber"}
          />
        </div>
      </div>
    </>
  );
}
