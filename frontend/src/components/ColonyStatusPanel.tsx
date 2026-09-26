import { Cpu, Radio, ShieldAlert, ShieldCheck, Waves } from 'lucide-react'
import ModuleRow from './ModuleRow'
import type { Telemetry } from '../lib/telemetry'
import { ACCENT, CRIMSON } from '../lib/palette'

interface ColonyStatusPanelProps {
  telemetry: Telemetry
  distress: boolean
}

export default function ColonyStatusPanel({ telemetry, distress }: ColonyStatusPanelProps) {
  const accent = distress ? CRIMSON : ACCENT
  const StatusIcon = distress ? ShieldAlert : ShieldCheck

  return (
    <section className="panel p-4 md:p-5">
      <h2 className="font-display text-xl tracking-wide text-ink-primary">COLONY STATUS</h2>
      <div className="mt-3 flex items-center gap-3">
        <StatusIcon size={30} strokeWidth={1.6} style={{ color: accent }} aria-hidden="true" />
        <div>
          <div className="font-display text-2xl leading-none" style={{ color: accent }}>
            {distress ? 'QUEEN DISTRESS' : 'STABLE'}
          </div>
          <div className="mt-1 text-[12px] text-ink-dim">
            {distress ? 'Acoustic anomaly · inspect within 30 min' : 'All three modules nominal'}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ModuleRow icon={Cpu} name="ESP32-S3" role="Edge MCU · MQTT bridge" detail="ONLINE" ok />
        <ModuleRow
          icon={Radio}
          name="DHT22"
          role="Climate probe · temp / RH"
          detail={`${telemetry.dht22.temp_c.toFixed(1)}°C`}
          ok
        />
        <ModuleRow
          icon={Waves}
          name="INMP441"
          role="Acoustic · FFT / I2S"
          detail={`${telemetry.inmp441.dominant_hz} Hz`}
          ok={!distress}
        />
      </div>
    </section>
  )
}
