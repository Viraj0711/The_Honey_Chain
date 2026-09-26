import { Droplets, ShieldAlert, ShieldCheck, Thermometer, Waves } from 'lucide-react'
import StatCard from './StatCard'
import type { Telemetry } from '../lib/telemetry'

interface TelemetryGridProps {
  telemetry: Telemetry
  distress: boolean
}

export default function TelemetryGrid({ telemetry, distress }: TelemetryGridProps) {
  return (
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
        tone={distress ? 'crimson' : 'amber'}
      />
      <StatCard
        icon={distress ? ShieldAlert : ShieldCheck}
        label="Colony State"
        value={distress ? 'ALERT' : 'NOMINAL'}
        unit=""
        sub={distress ? 'Queen distress detected' : 'No anomalies detected'}
        tone={distress ? 'crimson' : 'default'}
      />
    </div>
  )
}
