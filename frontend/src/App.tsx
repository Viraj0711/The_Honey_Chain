import { useEffect, useState } from 'react'
import CinematicBackground from './components/CinematicBackground'
import KineticCursor from './components/KineticCursor'
import DashboardHeader from './components/DashboardHeader'
import TelemetryGrid from './components/TelemetryGrid'
import SpectrogramPanel from './components/SpectrogramPanel'
import ColonyStatusPanel from './components/ColonyStatusPanel'
import FieldNotesPanel from './components/FieldNotesPanel'
import DiagnosticFeed from './components/DiagnosticFeed'
import { isDistress, useMockTelemetry } from './lib/telemetry'

const CLOCK_INTERVAL_MS = 1000

export default function App() {
  const { telemetry, logs } = useMockTelemetry()
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), CLOCK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  const distress = isDistress(telemetry)

  return (
    <>
      <CinematicBackground />
      <KineticCursor />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-5 md:px-8 md:py-7">
        <DashboardHeader clock={clock} distress={distress} />

        <main className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="flex flex-col gap-4 lg:col-span-8">
            <TelemetryGrid telemetry={telemetry} distress={distress} />
            <SpectrogramPanel telemetry={telemetry} distress={distress} />
          </section>

          <aside className="flex flex-col gap-4 lg:col-span-4">
            <ColonyStatusPanel telemetry={telemetry} distress={distress} />
            <FieldNotesPanel telemetry={telemetry} distress={distress} />
          </aside>
        </main>

        <DiagnosticFeed logs={logs} />

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 pb-2 text-[11px] tracking-[0.18em] text-ink-dim uppercase">
          <span>HoneyChain MVP · Software-First prototype</span>
          <span>Mock telemetry · no physical ESP32-S3 attached</span>
        </footer>
      </div>
    </>
  )
}
