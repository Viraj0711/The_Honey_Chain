import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import type { DiagnosticEntry, LogTone } from '../lib/telemetry'
import { ACCENT, CRIMSON, PROSE } from '../lib/palette'

const toneColor: Record<LogTone, string> = {
  normal: PROSE,
  amber: ACCENT,
  crimson: CRIMSON,
}

const toneBackground: Record<LogTone, string> = {
  normal: 'rgba(22,24,29,0.4)',
  amber: 'rgba(22,24,29,0.4)',
  crimson: 'rgba(255,71,71,0.07)',
}

const STAGGER_STEP = 0.03
const STAGGER_CAP = 8

interface DiagnosticFeedProps {
  logs: DiagnosticEntry[]
}

export default function DiagnosticFeed({ logs }: DiagnosticFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  return (
    <section className="panel mt-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity size={16} strokeWidth={1.75} style={{ color: ACCENT }} aria-hidden="true" />
          <h2 className="font-display text-xl tracking-wide text-ink-primary">SYSTEM LOG</h2>
        </div>
        <span className="text-[11px] tracking-[0.18em] text-ink-dim uppercase">
          Diagnostic feed · {logs.length} entries
        </span>
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="HoneyChain diagnostic feed"
        className="log-scroll mt-3 max-h-[232px] space-y-1.5 overflow-y-auto pr-2"
      >
        {logs.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut', delay: Math.min(i, STAGGER_CAP) * STAGGER_STEP }}
            className="font-hand rounded px-3 py-1.5"
            style={{
              color: toneColor[l.tone],
              background: toneBackground[l.tone],
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: 1.7,
            }}
          >
            {l.text}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
