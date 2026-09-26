import type { LucideIcon } from 'lucide-react'
import { ACCENT, CRIMSON } from '../lib/palette'

interface ModuleRowProps {
  icon: LucideIcon
  name: string
  role: string
  detail: string
  ok: boolean
}

export default function ModuleRow({ icon: Icon, name, role, detail, ok }: ModuleRowProps) {
  const color = ok ? ACCENT : CRIMSON

  return (
    <div
      className="flex items-center gap-3 rounded-md px-3 py-2"
      style={{ background: 'rgba(22,24,29,0.55)', border: '1px solid rgba(245,166,35,0.10)' }}
    >
      <Icon size={16} strokeWidth={1.75} style={{ color: ACCENT, opacity: 0.8 }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-ink-primary">{name}</div>
        <div className="truncate text-[11px] text-ink-dim">{role}</div>
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-[11px]" style={{ color }}>
          {detail}
        </span>
        <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 7px ${color}` }} />
      </div>
    </div>
  )
}
