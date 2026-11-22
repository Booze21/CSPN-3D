import { Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { site } from '../config/site'

function Hall() {
  const { scene } = useGLTF(import.meta.env.BASE_URL + site.hall)
  return <primitive object={scene} />
}

function Drift({ reduced }: { reduced: boolean }) {
  useFrame(({ clock, camera }) => {
    const t = reduced ? 0 : clock.elapsedTime
    camera.position.set(Math.sin(t * 0.07) * 3, -10.5 + Math.sin(t * 0.05) * 0.6, 19)
    camera.lookAt(0, -8, 0)
  })
  return null
}

/** Full-screen museum hall behind everything. */
export default function HallBackground({ reduced }: { reduced: boolean }) {
  const mobile = window.innerWidth < 768
  return (
    <div className="absolute inset-0 opacity-50">
      <Canvas dpr={[1, mobile ? 1 : 1.25]} camera={{ fov: 60, near: 0.1, far: 200 }} gl={{ antialias: false }}>
        <hemisphereLight args={['#b8c4dc', '#2a2a30', 1.6]} />
        <directionalLight position={[5, 10, 8]} intensity={1.2} />
        <Suspense fallback={null}><Hall /></Suspense>
        <Drift reduced={reduced} />
      </Canvas>
    </div>
  )
}
