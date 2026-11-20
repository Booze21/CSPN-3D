import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { instagram, sculptures } from './config/site'

const Gallery3D = lazy(() => import('./components/Gallery3D'))

const IgIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
)

function Loader() {
  return <div className="grid h-[60vh] place-items-center"><div className="w-48"><div className="h-px overflow-hidden bg-white/10"><div className="h-full w-1/3 animate-pulse bg-white/70" /></div><p className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] text-white/40">Loading gallery</p></div></div>
}

export default function App() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [show3D, setShow3D] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow3D(true); io.disconnect() } }, { rootMargin: '300px' })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 mix-blend-difference">
        <span className="font-serif text-xl tracking-[0.35em]">ANCIENT</span>
        <a href={instagram.profileUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IgIcon /></a>
      </header>
      <main>
        <section className="hero-glow grid min-h-screen place-items-center px-6 text-center">
          <div className="fade-up">
            <h1 className="font-serif text-6xl font-light tracking-[0.3em] sm:text-8xl md:text-9xl">ANCIENT</h1>
            <p className="mt-6 text-xs uppercase tracking-[0.5em] text-white/70">The Art of Eternity</p>
            <p className="mx-auto mt-6 max-w-md text-sm text-white/50">Explore the timeless beauty of ancient sculptures.</p>
            <a href="#collection" className="mt-12 inline-block border border-white/40 px-8 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-white hover:text-black">Explore Collection</a>
          </div>
        </section>

        <section id="featured" className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-serif text-4xl font-light">Featured Sculptures</h2>
          <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-3">
            {sculptures.filter((s) => s.featured).map((s) => (
              <a key={s.id} href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="group bg-[#0b0b0c] p-8 transition hover:bg-white/[0.03]">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{s.era}</p>
                <h3 className="mt-3 font-serif text-3xl">{s.name}</h3>
                <p className="mt-3 text-sm text-white/50">{s.description}</p>
                <span className="mt-6 inline-block text-[10px] uppercase tracking-[0.3em] text-white/60 group-hover:text-white">View on Instagram →</span>
              </a>
            ))}
          </div>
        </section>

        <section id="collection" ref={ref} className="py-12">
          <h2 className="px-6 text-center font-serif text-4xl font-light">Ancient Collection</h2>
          {show3D ? <Suspense fallback={<Loader />}><Gallery3D reduced={reduced} /></Suspense> : <Loader />}
        </section>

        <section id="about" className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="font-serif text-4xl font-light">About the Gallery</h2>
          <p className="mt-6 text-white/60">A digital museum devoted to the marble figures of the ancient world — gods, emperors, warriors and pharaohs — presented as objects to be turned in the light and studied from every side.</p>
        </section>

        <section className="border-y border-white/10 py-24 text-center">
          <h2 className="font-serif text-4xl font-light">Follow the Collection</h2>
          <p className="mx-auto mt-4 max-w-md text-white/50">New sculptures and behind-the-scenes studies, every week on Instagram.</p>
          <a href={instagram.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex items-center gap-3 border border-white/40 px-7 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-white hover:text-black"><IgIcon />Follow on Instagram</a>
        </section>
      </main>
      <footer className="px-6 py-10 text-center text-[10px] uppercase tracking-[0.3em] text-white/30">© {new Date().getFullYear()} ANCIENT · @{instagram.username}</footer>
    </>
  )
}
