import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { site } from '../config/site'

const bronze = new THREE.MeshPhysicalMaterial({ color: '#4a382e', metalness: 0.65, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.35 })

function Statue({ reduced }: { reduced: boolean }) {
  const { scene } = useGLTF(import.meta.env.BASE_URL + site.model)
  const ref = useRef<THREE.Group>(null!)
  const obj = useRef<THREE.Object3D | null>(null)
  if (!obj.current) {
    const c = scene.clone(true)
    c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.material = bronze })
    const size = new THREE.Box3().setFromObject(c).getSize(new THREE.Vector3())
    c.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z))
    const b = new THREE.Box3().setFromObject(c)
    c.position.set(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2)
    obj.current = c
  }
  useFrame(({ clock, pointer, camera, size }) => {
    camera.position.z = 6 / Math.min(Math.max(size.width / size.height, 0.52), 1)
    if (reduced) return
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.45 + pointer.x * 0.3
    ref.current.rotation.x = -pointer.y * 0.08
  })
  return <group ref={ref}><primitive object={obj.current} /></group>
}

export default function Hero3D({ reduced }: { reduced: boolean }) {
  const mobile = window.innerWidth < 768
  return (
    <Canvas dpr={[1, mobile ? 1.5 : 2]} camera={{ position: [0, 0, 4.6], fov: 38 }} gl={{ antialias: !mobile }}>
      <pointLight position={[0, 0.2, -1]} intensity={8} color="#bcd8ff" />
      <spotLight position={[2.5, 3, 3]} angle={0.5} penumbra={1} intensity={40} color="#ffd9b0" />
      <Environment resolution={256}>
        <Lightformer form="ring" intensity={4} position={[0, 0, -3]} scale={5} />
        <Lightformer form="rect" intensity={2} position={[3, 2, 2]} scale={[2, 4, 1]} />
      </Environment>
      <Suspense fallback={null}><Statue reduced={reduced} /></Suspense>
    </Canvas>
  )
}
