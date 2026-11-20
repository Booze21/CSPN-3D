import { Suspense, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { instagram, sculptures } from '../config/site'
import Sculpture from './Sculpture'

const GAP = 2.4
const pos = (i: number): [number, number, number] => [(i - (sculptures.length - 1) / 2) * GAP, 0, 0]

function Rig({ target, reduced }: { target: number | null; reduced: boolean }) {
  const { camera } = useThree()
  const look = useMemo(() => new THREE.Vector3(0, 1.3, 0), [])
  useFrame((_, d) => {
    const k = reduced ? 1 : Math.min(1, d * 2.5)
    const t = target === null ? new THREE.Vector3(0, 1.3, 0) : new THREE.Vector3(...pos(target)).add(new THREE.Vector3(0, 1.4, 0))
    const want = target === null ? new THREE.Vector3(0, 1.6, 7.5) : t.clone().add(new THREE.Vector3(0, 0.2, 3.2))
    camera.position.lerp(want, k)
    look.lerp(t, k)
    camera.lookAt(look)
  })
  return null
}

export default function Gallery3D({ reduced }: { reduced: boolean }) {
  const [sel, setSel] = useState<number | null>(null)
  const mobile = window.innerWidth < 768
  const s = sel !== null ? sculptures[sel] : null
  const webgl = useMemo(() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false } }, [])
  if (!webgl) return <div className="grid h-[70vh] place-items-center px-6 text-center text-white/60">Your browser does not support WebGL.<br />Please view the collection on Instagram.</div>
  return (
    <div className="relative h-[80vh] min-h-[480px] w-full">
      <Canvas shadows={!mobile} dpr={[1, mobile ? 1.5 : 2]} camera={{ position: [0, 1.6, 7.5], fov: 40 }} gl={{ antialias: !mobile, powerPreference: 'high-performance' }} onPointerMissed={() => setSel(null)}>
        <color attach="background" args={['#0b0b0c']} />
        <fog attach="fog" args={['#0b0b0c', 8, 22]} />
        <ambientLight intensity={0.15} />
        {sculptures.map((_, i) => (
          <spotLight key={i} position={[pos(i)[0], 6, 2.5]} angle={0.35} penumbra={0.8} intensity={mobile ? 60 : 90} castShadow={!mobile} color="#fff4e0" />
        ))}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} position={[0, 5, -5]} scale={[12, 3, 1]} />
          <Lightformer form="rect" intensity={1} position={[-6, 2, 3]} scale={[3, 5, 1]} />
        </Environment>
        <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[60, 30]} /><meshStandardMaterial color="#111113" roughness={0.45} metalness={0.4} /></mesh>
        <Suspense fallback={null}>
          {sculptures.map((d, i) => <Sculpture key={d.id} data={d} position={pos(i)} active={sel === i} onSelect={() => setSel(i)} reduced={reduced} />)}
        </Suspense>
        <ContactShadows position={[0, 0.01, 0]} scale={30} blur={2.5} opacity={0.6} far={4} />
        <Rig target={sel} reduced={reduced} />
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.2} maxPolarAngle={1.65} target={[0, 1.3, 0]} enabled={sel === null} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
        {s ? (
          <div className="pointer-events-auto max-w-sm rounded-sm border border-white/10 bg-black/70 p-5 text-center backdrop-blur">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{s.era}</p>
            <h3 className="mt-1 font-serif text-3xl">{s.name}</h3>
            <p className="mt-2 text-sm text-white/60">{s.description}</p>
            <a href={s.instagramUrl || instagram.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block border border-white/40 px-5 py-2 text-xs uppercase tracking-[0.25em] transition hover:bg-white hover:text-black">View on Instagram</a>
          </div>
        ) : <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Drag to look around · Click a sculpture</p>}
      </div>
    </div>
  )
}
