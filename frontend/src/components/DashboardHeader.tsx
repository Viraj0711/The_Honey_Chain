import { Hexagon } from 'lucide-react'
import { clockTime } from '../lib/format'
import { ACCENT, CRIMSON } from '../lib/palette'

interface DashboardHeaderProps {
  clock: Date
  distress: boolean
}

export default function DashboardHeader({ clock, distress }: DashboardHeaderProps) {
  const accent = distress ? CRIMSON : ACCENT

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-md"
          style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.32)' }}
        >
          <Hexagon size={24} strokeWidth={1.75} style={{ color: ACCENT }} aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-display text-2xl leading-none tracking-wide text-ink-primary md:text-[28px]">
            HONEYCHAIN
          </h1>
          <p className="mt-1 text-[11px] tracking-[0.22em] text-ink-dim uppercase">
            Edge-AI Apiary Monitor · Hive 04
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-[11px] tracking-[0.18em] text-ink-dim uppercase">Local Time</span>
          <span className="font-display text-lg leading-tight text-ink-primary">{clockTime(clock)}</span>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            border: `1px solid ${distress ? 'rgba(255,71,71,0.45)' : 'rgba(245,166,35,0.3)'}`,
            background: distress ? 'rgba(255,71,71,0.08)' : 'rgba(245,166,35,0.07)',
          }}
        >
          <span className="live-dot" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} aria-hidden="true" />
          <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: accent }}>
            {distress ? 'Distress' : 'Live'}
          </span>
        </div>
      </div>
    </header>
  )
}
