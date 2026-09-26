import { hhmm } from '../lib/format'
import { fieldNote, type Telemetry } from '../lib/telemetry'
import { INK } from '../lib/palette'

interface FieldNotesPanelProps {
  telemetry: Telemetry
  distress: boolean
}

export default function FieldNotesPanel({ telemetry, distress }: FieldNotesPanelProps) {
  return (
    <section className="panel p-4 md:p-5">
      <h2 className="font-display text-xl tracking-wide text-ink-primary">FIELD NOTES</h2>
      <p className="font-hand mt-3" style={{ fontSize: '17px', fontWeight: 500, lineHeight: 1.7, color: INK }}>
        {fieldNote(distress, telemetry)}
      </p>
      <p className="mt-3 text-[11px] tracking-[0.18em] text-ink-dim uppercase">
        Recorded {hhmm(telemetry.timestamp)} · apiary south row
      </p>
    </section>
  )
}
