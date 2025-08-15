// src/components/models/Robot.tsx
import { useGLTF } from '@react-three/drei'

export function Robot() {
  const gltf = useGLTF('/models/Robot.glb')
  return <primitive object={gltf.scene} scale={1.2} />
}
useGLTF.preload('/models/Robot.glb')

