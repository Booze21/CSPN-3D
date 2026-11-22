import { lazy, Suspense, useMemo } from 'react'
import { useProgress } from '@react-three/drei'
import { instagram, site } from './config/site'

const Hero3D = lazy(() => import('./components/Hero3D'))
const RingEffects = lazy(() => import('./components/RingEffects'))

const IgIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
)

function Progress() {
  const { progress, active } = useProgress()
  if (!active && progress >= 100) return null
  return <div className="pointer-events-none absolute inset-x-0 top-1/2 text-center text-[10px] uppercase tracking-[0.35em] text-white/40">Loading {Math.round(progress)}%</div>
}

export default function App() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const webgl = useMemo(() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false } }, [])
  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#07080a]">
      {webgl && !reduced && <Suspense fallback={null}><RingEffects /></Suspense>}
      {webgl && <div className="absolute inset-0"><Suspense fallback={null}><Hero3D reduced={reduced} /></Suspense></div>}
      {webgl && <Progress />}

      <div className="pointer-events-none absolute inset-0 flex justify-evenly">
        {[0, 1, 2, 3].map((i) => <span key={i} className="h-full w-px bg-white/[0.07]" />)}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.6)_100%)]" />

      <span className="absolute left-6 top-6 font-serif text-lg tracking-[0.35em] md:left-12 md:top-10">{site.title}</span>

      <div className="fade-up pointer-events-none absolute inset-x-0 top-[14%] px-6 text-center">
        <h1 className="font-serif text-5xl font-light leading-none tracking-[0.2em] sm:text-7xl md:text-8xl">{site.title}</h1>
        <p className="mt-4 text-[10px] uppercase tracking-[0.5em] text-white/60 sm:text-xs">{site.subtitle}</p>
      </div>

      <div className="absolute inset-x-0 bottom-[9%] flex justify-center px-6">
        <a href={instagram.profileUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 border border-white/50 bg-black/30 px-8 py-4 text-xs uppercase tracking-[0.3em] backdrop-blur transition hover:bg-white hover:text-black">
          <IgIcon />{site.buttonLabel}
        </a>
      </div>
      <p className="absolute inset-x-0 bottom-4 text-center text-[10px] uppercase tracking-[0.3em] text-white/30">@{instagram.username}</p>
    </main>
  )
}
