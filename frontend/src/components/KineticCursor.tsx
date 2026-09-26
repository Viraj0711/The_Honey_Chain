import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ACCENT } from '../lib/palette'

const CURSOR_SIZE = 38
const CURSOR_HALF = CURSOR_SIZE / 2
const POSITION_STIFFNESS = 220
const POSITION_DAMPING = 18
const POSITION_MASS = 0.55
const ROTATION_STIFFNESS = 150
const ROTATION_DAMPING = 16
const MIN_TRAVEL = 1.4
const PRESS_SCALE = 0.78
const OFFSCREEN = -200

function BeeGlyph() {
  return (
    <svg
      viewBox="0 0 44 44"
      width={CURSOR_SIZE}
      height={CURSOR_SIZE}
      style={{ display: 'block', filter: `drop-shadow(0 0 6px ${ACCENT}88)` }}
      aria-hidden="true"
    >
      <g className="bee-wing bee-wing-up">
        <ellipse cx="15" cy="11" rx="9" ry="5.4" fill={ACCENT} opacity="0.4" transform="rotate(-28 15 11)" />
      </g>
      <g className="bee-wing bee-wing-down">
        <ellipse cx="15" cy="33" rx="9" ry="5.4" fill={ACCENT} opacity="0.4" transform="rotate(28 15 33)" />
      </g>
      <path d="M6.5 22 L2 22 L6.5 19 Z" fill={ACCENT} />
      <ellipse cx="21" cy="22" rx="13.5" ry="8.4" fill={ACCENT} />
      <rect x="16" y="14" width="3.4" height="16" rx="1.4" fill="#16181D" opacity="0.85" />
      <rect x="23" y="15" width="3.4" height="14" rx="1.4" fill="#16181D" opacity="0.85" />
      <circle cx="35.5" cy="22" r="4.8" fill={ACCENT} />
      <path d="M37 17.5 C37.5 14.5 39.5 13 41 12.5" stroke={ACCENT} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M37 26.5 C37.5 29.5 39.5 31 41 31.5" stroke={ACCENT} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function KineticCursor() {
  const [enabled] = useState(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return fine && !reduce
  })
  const [pressed, setPressed] = useState(false)

  const x = useMotionValue(OFFSCREEN)
  const y = useMotionValue(OFFSCREEN)
  const springX = useSpring(x, { stiffness: POSITION_STIFFNESS, damping: POSITION_DAMPING, mass: POSITION_MASS })
  const springY = useSpring(y, { stiffness: POSITION_STIFFNESS, damping: POSITION_DAMPING, mass: POSITION_MASS })

  const rotation = useMotionValue(0)
  const springRotation = useSpring(rotation, { stiffness: ROTATION_STIFFNESS, damping: ROTATION_DAMPING })

  const pointer = useRef({ x: OFFSCREEN, y: OFFSCREEN })
  const unwrapped = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - pointer.current.x
      const dy = e.clientY - pointer.current.y
      if (Math.hypot(dx, dy) > MIN_TRAVEL) {
        const raw = (Math.atan2(dy, dx) * 180) / Math.PI
        let delta = raw - (unwrapped.current % 360)
        while (delta > 180) delta -= 360
        while (delta < -180) delta += 360
        unwrapped.current += delta
        rotation.set(unwrapped.current)
      }
      x.set(e.clientX)
      y.set(e.clientY)
      pointer.current = { x: e.clientX, y: e.clientY }
    }
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [enabled, x, y, rotation])

  if (!enabled) return null

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-60"
      style={{ x: springX, y: springY }}
      aria-hidden="true"
    >
      <motion.div
        style={{ rotate: springRotation, width: CURSOR_SIZE, height: CURSOR_SIZE, marginLeft: -CURSOR_HALF, marginTop: -CURSOR_HALF }}
        animate={{ scale: pressed ? PRESS_SCALE : 1 }}
        transition={{ duration: 0.18 }}
      >
        <BeeGlyph />
      </motion.div>
    </motion.div>
  )
}
