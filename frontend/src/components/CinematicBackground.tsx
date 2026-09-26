import { useEffect, useRef } from 'react'

interface Pollen {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  a: number
  p: number
}

const AREA_PER_PARTICLE = 24_000
const MIN_PARTICLES = 26
const MAX_PARTICLES = 130
const MAX_DPR = 2
const RESIZE_DEBOUNCE_MS = 180

export default function CinematicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let resizeTimer = 0
    let particles: Pollen[] = []
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const seed = () => {
      const target = Math.round((w * h) / AREA_PER_PARTICLE)
      const count = Math.max(MIN_PARTICLES, Math.min(target, MAX_PARTICLES))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.6,
        vx: (Math.random() - 0.5) * 0.18,
        vy: 0.04 + Math.random() * 0.22,
        a: 0.05 + Math.random() * 0.3,
        p: Math.random() * Math.PI * 2,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const pt of particles) {
        if (!reduce) {
          pt.x += pt.vx
          pt.y += pt.vy
          pt.p += 0.012
          if (pt.y > h + 6) {
            pt.y = -6
            pt.x = Math.random() * w
          }
          if (pt.x > w + 6) pt.x = -6
          if (pt.x < -6) pt.x = w + 6
        }
        const cx = pt.x + Math.sin(pt.p) * 0.8
        const rad = pt.r * 3.6
        const g = ctx.createRadialGradient(cx, pt.y, 0, cx, pt.y, rad)
        g.addColorStop(0, `rgba(245, 190, 110, ${pt.a})`)
        g.addColorStop(1, 'rgba(245, 166, 35, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, pt.y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        cancelAnimationFrame(raf)
        resize()
        seed()
        draw()
      }, RESIZE_DEBOUNCE_MS)
    }

    resize()
    seed()
    draw()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0" style={{ isolation: 'isolate' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 18% 0%, #3c2d1d 0%, #241d15 46%, #16181D 100%)' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(22, 24, 29, 0.85)', mixBlendMode: 'multiply' }}
      />
    </div>
  )
}
