import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const meshesRef = useRef<THREE.Mesh[]>([])
  const animRef = useRef<number | null>(null)

  const [wireframe, setWireframe] = useState<boolean>(() => {
    return localStorage.getItem("wireframe") === "true"
  })
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem("autoRotate") !== "false"
  })
  const [activeMeshIndex, setActiveMeshIndex] = useState(0)

  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  const figureNames = ['Cubo', 'Esfera', 'Plano', 'Cilindro', 'Cono', 'Toro']

  const geometries = useMemo(() => ([
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.PlaneGeometry(2, 2),
    new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
    new THREE.ConeGeometry(0.5, 1, 32),
    new THREE.TorusGeometry(0.5, 0.2, 32, 64)
  ]), [])

  const materials = useMemo(() => ([
    new THREE.MeshPhongMaterial({ color: '#44aa88', wireframe }),
    new THREE.MeshPhongMaterial({ color: '#8844aa', wireframe }),
    new THREE.MeshPhongMaterial({ color: '#aa8844', side: THREE.DoubleSide, wireframe }),
    new THREE.MeshPhongMaterial({ color: '#ffaa44', wireframe }),
    new THREE.MeshPhongMaterial({ color: '#44aaff', wireframe }),
    new THREE.MeshPhongMaterial({ color: '#ff44aa', wireframe }),
  ]), []) 

  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
  }, [autoRotate])

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    const meshes = geometries.map((geometry, i) => new THREE.Mesh(geometry, materials[i]))
    meshes.forEach(mesh => {
      mesh.visible = false
      scene.add(mesh)
    })

    meshesRef.current = meshes
    meshes[0].visible = true
    currentMeshRef.current = meshes[0]

    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometries.forEach(geo => geo.dispose())
      materials.forEach(mat => mat.dispose())
      scene.clear()
    }
  }, [geometries, materials])

  // Actualizar figura activa
  useEffect(() => {
    const meshes = meshesRef.current
    if (!meshes.length) return
    meshes.forEach((mesh, i) => {
      mesh.visible = i === activeMeshIndex
      if (i === activeMeshIndex) {
        mesh.rotation.set(0, 0, 0)
      }
    })
    currentMeshRef.current = meshes[activeMeshIndex]
  }, [activeMeshIndex])

  // Actualizar wireframe dinámicamente
  useEffect(() => {
    meshesRef.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshPhongMaterial
      mat.wireframe = wireframe
      mat.needsUpdate = true
    })
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8 }}>
        <div style={{ background: '#111', color: '#fff', padding: '4px 8px', borderRadius: 4 }}>
          Figura actual: <strong>{figureNames[activeMeshIndex]}</strong>
        </div>
        <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8 }}>
          <div style={{ background: '#111', color: '#fff', padding: '4px 8px', borderRadius: 4 }}>
            Figura actual: <strong>{figureNames[activeMeshIndex]}</strong>
          </div>

            {figureNames.map((name, index) => (
        <button
      key={name}
      onClick={() => setActiveMeshIndex(index)}
      style={{
        backgroundColor: activeMeshIndex === index ? '#2a2' : '#222',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid #444',
        cursor: 'pointer'
      }}
    >
      {name}
    </button>
  ))}

  <button onClick={() => setAutoRotate(!autoRotate)}>
    {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
  </button>

  <button onClick={() => setWireframe(!wireframe)}>
    {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
  </button>
</div>
        <button onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>
    </div>
  )
}
