import { useEffect, useRef } from 'react'
import { ACCENT, CRIMSON } from '../lib/palette'

const SAMPLES = 56
const TICK_MS = 450
const BASELINE_SPREAD = 26
const DISTRESS_SPREAD = 70
const BASELINE_FROM = 100
const BASELINE_TO = 220
const FLOOR_HZ = 60
const Y_MIN = 80
const Y_MAX = 520
const CHART_HEIGHT = 240
const MAX_DPR = 2
const PAD_TOP = 12
const PAD_RIGHT = 2
const PAD_BOTTOM = 2
const PAD_LEFT = 2
const STROKE_WIDTH = 2
const FILL_ALPHA = 0.38

interface Point {
  x: number
  y: number
}

function toCanvasY(hz: number, top: number, innerH: number) {
  const clamped = Math.min(Y_MAX, Math.max(Y_MIN, hz))
  return top + innerH * (1 - (clamped - Y_MIN) / (Y_MAX - Y_MIN))
}

function traceMonotone(ctx: CanvasRenderingContext2D, points: Point[]) {
  const n = points.length
  if (n < 2) return

  const dx: number[] = []
  const slope: number[] = new Array(n)

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x
    slope[i] = (points[i + 1].y - points[i].y) / dx[i]
  }

  slope[n - 1] = slope[n - 2]

  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      slope[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      slope[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])
    }
  }

  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i] / 3
    ctx.bezierCurveTo(
      points[i].x + third,
      points[i].y + slope[i] * third,
      points[i + 1].x - third,
      points[i + 1].y - slope[i + 1] * third,
      points[i + 1].x,
      points[i + 1].y,
    )
  }
}

interface AcousticWaveformProps {
  dominantHz: number
  distress: boolean
}

export default function AcousticWaveform({ dominantHz, distress }: AcousticWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seriesRef = useRef<number[]>([])
  const sampleRef = useRef({ dominantHz, distress })

  useEffect(() => {
    sampleRef.current = { dominantHz, distress }
  }, [dominantHz, distress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const targetW = Math.max(1, Math.round(w * dpr))
      const targetH = Math.max(1, Math.round(h * dpr))
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const color = sampleRef.current.distress ? CRIMSON : ACCENT
      const innerW = w - PAD_LEFT - PAD_RIGHT
      const innerH = h - PAD_TOP - PAD_BOTTOM
      const step = innerW / (SAMPLES - 1)
      const baselineY = PAD_TOP + innerH

      const points = seriesRef.current.map((hz, i) => ({
        x: PAD_LEFT + i * step,
        y: toCanvasY(hz, PAD_TOP, innerH),
      }))

      const gradient = ctx.createLinearGradient(0, PAD_TOP, 0, baselineY)
      gradient.addColorStop(0, `${color}${Math.round(FILL_ALPHA * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${color}00`)

      const last = points[points.length - 1]
      const first = points[0]

      ctx.beginPath()
      traceMonotone(ctx, points)
      ctx.lineTo(last.x, baselineY)
      ctx.lineTo(first.x, baselineY)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      traceMonotone(ctx, points)
      ctx.strokeStyle = color
      ctx.lineWidth = STROKE_WIDTH
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    const tick = () => {
      const spread = sampleRef.current.distress ? DISTRESS_SPREAD : BASELINE_SPREAD
      const next = sampleRef.current.dominantHz + (Math.random() - 0.5) * spread
      const series = seriesRef.current
      series.push(Math.max(FLOOR_HZ, next))
      series.shift()
      draw()
    }

    const observer = new ResizeObserver(draw)
    seriesRef.current = Array.from({ length: SAMPLES }, () => BASELINE_FROM + Math.random() * (BASELINE_TO - BASELINE_FROM))
    observer.observe(canvas)
    draw()

    let id = 0
    if (!reduce) id = window.setInterval(tick, TICK_MS)

    return () => {
      observer.disconnect()
      window.clearInterval(id)
    }
  }, [])

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <canvas ref={canvasRef} className="block h-full w-full" role="img" aria-label="Live INMP441 acoustic spectrogram" />
    </div>
  )
}
