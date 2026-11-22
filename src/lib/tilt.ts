export const tilt = { x: 0, y: 0 }
let on = false
const clamp = (v: number) => Math.max(-1, Math.min(1, v))

/** Phone tilt -> statue movement. Must be called from a user gesture (iOS asks permission). */
export function enableTilt() {
  if (on || typeof DeviceOrientationEvent === 'undefined') return
  const add = () => {
    on = true
    window.addEventListener('deviceorientation', (e) => { tilt.x = clamp((e.gamma ?? 0) / 30); tilt.y = clamp(((e.beta ?? 45) - 45) / 30) }, { passive: true })
  }
  const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  if (typeof D.requestPermission === 'function') D.requestPermission().then((s) => { if (s === 'granted') add() }).catch(() => {})
  else add()
}
