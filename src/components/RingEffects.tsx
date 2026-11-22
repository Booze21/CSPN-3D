import { useEffect, useRef } from 'react'
import { startRingEffects } from '../effects/ringEffects'

/** LED ring + icy-blue serpentine ribbons (full-screen background layers). */
export default function RingEffects() {
  const box = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => startRingEffects(box.current!, ring.current!, cv.current!), [])
  return (
    <div ref={box} className="absolute inset-0">
      <div ref={ring} className="absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
      <canvas ref={cv} className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen" />
    </div>
  )
}
