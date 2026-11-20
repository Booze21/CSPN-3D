import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { SculptureConfig } from '../config/site'

const marble = new THREE.MeshPhysicalMaterial({ color: '#efebe3', roughness: 0.32, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.4 })

function Model({ url, scale, y, active, reduced }: { url: string; scale: number; y: number; active: boolean; reduced: boolean }) {
  const { scene } = useGLTF(url) // Draco decoder loads automatically
  const ref = useRef<THREE.Group>(null!)
  const model = useRef<THREE.Object3D | null>(null)
  if (!model.current) {
    const c = scene.clone(true)
    c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = marble; m.castShadow = true; m.receiveShadow = true } })
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    c.scale.setScalar((1.6 / Math.max(size.x, size.y, size.z)) * scale) // normalise to ~1.6 units
    const b2 = new THREE.Box3().setFromObject(c)
    c.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y + y, -(b2.min.z + b2.max.z) / 2)
    model.current = c
  }
  useFrame((_, d) => { if (!reduced && !active) ref.current.rotation.y += d * 0.25 })
  return <group ref={ref}><primitive object={model.current} /></group>
}

export default function Sculpture({ data, position, active, onSelect, reduced }: { data: SculptureConfig; position: [number, number, number]; active: boolean; onSelect: () => void; reduced: boolean }) {
  const [exists, setExists] = useState(false)
  const url = import.meta.env.BASE_URL + data.model
  useEffect(() => {
    let alive = true
    fetch(url, { method: 'HEAD' }).then((r) => { if (alive) setExists(r.ok && !(r.headers.get('content-type') || '').includes('text/html')) }).catch(() => {})
    return () => { alive = false }
  }, [url])
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect() }} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.7, 48]} />
        <meshStandardMaterial color="#1b1b1d" roughness={0.35} metalness={0.5} />
      </mesh>
      <group position={[0, 0.7, 0]}>
        {exists ? <Model url={url} scale={data.scale} y={data.yOffset} active={active} reduced={reduced} /> : (
          <Html center position={[0, 0.8, 0]} style={{ pointerEvents: 'none' }}>
            <div className="w-44 text-center text-[10px] uppercase tracking-[0.25em] text-white/40">Asset slot<br /><span className="normal-case tracking-normal text-white/30">public/{data.model}</span></div>
          </Html>
        )}
      </group>
    </group>
  )
}
