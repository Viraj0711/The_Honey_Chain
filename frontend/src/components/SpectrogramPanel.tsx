import { Waves } from 'lucide-react'
import AcousticWaveform from './AcousticWaveform'
import { ACOUSTIC_BANDS, type Telemetry } from '../lib/telemetry'
import { ACCENT, CRIMSON } from '../lib/palette'

interface SpectrogramPanelProps {
  telemetry: Telemetry
  distress: boolean
}

export default function SpectrogramPanel({ telemetry, distress }: SpectrogramPanelProps) {
  const accent = distress ? CRIMSON : ACCENT

  return (
    <section className="panel p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Waves size={16} strokeWidth={1.75} style={{ color: ACCENT }} aria-hidden="true" />
          <h2 className="font-display text-xl tracking-wide text-ink-primary">LIVE SPECTROGRAM</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-dim">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: ACCENT }} />
            {ACOUSTIC_BANDS.baseline.from}–{ACOUSTIC_BANDS.baseline.to} Hz healthy
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: CRIMSON }} />
            {ACOUSTIC_BANDS.distress.from}–{ACOUSTIC_BANDS.distress.to} Hz distress
          </span>
        </div>
      </div>
      <p className="mt-1 text-[12px] text-ink-dim">
        INMP441 FFT · dominant band{' '}
        <span className="whitespace-nowrap" style={{ color: accent }}>
          {telemetry.inmp441.dominant_hz} Hz
        </span>
      </p>
      <div className={distress ? 'chart-pulse mt-2' : 'mt-2'}>
        <AcousticWaveform dominantHz={telemetry.inmp441.dominant_hz} distress={distress} />
      </div>
    </section>
  )
}
