import { enableTilt } from './tilt'

let audio: HTMLAudioElement | null = null

/** Starts looping music on the first tap/click anywhere (browsers block autoplay before that). */
export function startOnFirstTap(onChange: (playing: boolean) => void) {
  const go = () => {
    window.removeEventListener('pointerdown', go)
    enableTilt()
    try {
      audio = new Audio(import.meta.env.BASE_URL + 'music.mp3')
      audio.loop = true
      audio.volume = 0.55
      audio.play().then(() => onChange(true)).catch(() => onChange(false))
    } catch { onChange(false) }
  }
  window.addEventListener('pointerdown', go)
  return () => window.removeEventListener('pointerdown', go)
}

export function toggleMusic(): boolean {
  if (!audio) return false
  if (audio.paused) { audio.play().catch(() => {}); return true }
  audio.pause()
  return false
}
