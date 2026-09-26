import type { LucideIcon } from 'lucide-react'
import { ACCENT, CRIMSON, INK, INK_DIM } from '../lib/palette'

export type StatTone = 'default' | 'amber' | 'crimson'

const toneColor: Record<StatTone, string> = {
  default: INK,
  amber: ACCENT,
  crimson: CRIMSON,
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit: string
  sub: string
  tone?: StatTone
}

export default function StatCard({ icon: Icon, label, value, unit, sub, tone = 'default' }: StatCardProps) {
  return (
    <div className="panel flex min-h-[134px] flex-col justify-between p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] tracking-[0.16em] text-ink-dim uppercase">{label}</span>
        <Icon size={16} strokeWidth={1.75} style={{ color: ACCENT, opacity: 0.8 }} aria-hidden="true" />
      </div>
      <div className="mt-3">
        <div
          className="font-display leading-none whitespace-nowrap"
          style={{ color: toneColor[tone], fontSize: 'clamp(30px, 4vw, 44px)' }}
        >
          {value}
          <span className="ml-1 align-top" style={{ fontSize: '0.4em', color: INK_DIM }}>
            {unit}
          </span>
        </div>
        <div className="mt-2 text-[12px] text-ink-dim">{sub}</div>
      </div>
    </div>
  )
}
