import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Cube, Play, Pause, ArrowsClockwise } from '@phosphor-icons/react'
import * as THREE from 'three'

interface HolographicCodeVizProps {
  code: string
  language: string
}

interface CodeNode {
  id: string
  name: string
  type: 'function' | 'class' | 'import' | 'variable'
  dependencies: string[]
  lineNumber: number
  complexity: number
}

export function HolographicCodeViz({ code, language }: HolographicCodeVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRotating, setIsRotating] = useState(true)
  const [nodes, setNodes] = useState<CodeNode[]>([])
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    animationId?: number
  } | null>(null)

  useEffect(() => {
    analyzeCodeStructure()
  }, [code])

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 15

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00ffff, 1, 100)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })

    const nodeMeshes: THREE.Mesh[] = []
    const nodePositions = new Map<string, THREE.Vector3>()

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2
      const radius = 5 + (node.complexity / 20)
      const x = Math.cos(angle) * radius
      const y = (Math.random() - 0.5) * 4
      const z = Math.sin(angle) * radius

      const position = new THREE.Vector3(x, y, z)
      nodePositions.set(node.id, position)

      let color = 0x4488ff
      if (node.type === 'class') color = 0xff4488
      else if (node.type === 'function') color = 0x44ff88
      else if (node.type === 'import') color = 0xffaa44

      const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      })

      const mesh = new THREE.Mesh(nodeGeometry, material)
      mesh.position.copy(position)
      mesh.userData = { node }
      scene.add(mesh)
      nodeMeshes.push(mesh)
    })

    nodes.forEach((node) => {
      const startPos = nodePositions.get(node.id)
      if (!startPos) return

      node.dependencies.forEach((depId) => {
        const endPos = nodePositions.get(depId)
        if (!endPos) return

        const points = [startPos, endPos]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, lineMaterial)
        scene.add(line)
      })
    })

    let rotationSpeed = 0.002
    const animate = () => {
      if (isRotating) {
        scene.rotation.y += rotationSpeed
      }

      nodeMeshes.forEach((mesh, index) => {
        const time = Date.now() * 0.001
        mesh.position.y += Math.sin(time + index) * 0.002
        
        const scale = 1 + Math.sin(time * 2 + index) * 0.1
        mesh.scale.set(scale, scale, scale)
      })

      renderer.render(scene, camera)
      sceneRef.current!.animationId = requestAnimationFrame(animate)
    }

    sceneRef.current = { scene, camera, renderer }
    animate()

    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      renderer.dispose()
    }
  }, [nodes, isRotating])

  const analyzeCodeStructure = async () => {
    if (!code || code.length < 20) {
      setNodes([])
      return
    }

    try {
      const prompt = `Analyze this ${language} code and extract its structure for 3D visualization:

${code}

Return a JSON object with a single property "nodes" containing an array of code structure nodes. Each node:
- id: unique identifier (string)
- name: function/class/variable name
- type: "function" | "class" | "import" | "variable"
- dependencies: array of id strings this node depends on
- lineNumber: approximate line number
- complexity: estimated complexity 0-100

Extract 5-15 nodes representing the key structural elements. Create realistic dependency relationships.`

      const response = await window.spark.llm(prompt, 'gpt-4o-mini', true)
      const result = JSON.parse(response)
      setNodes(result.nodes || [])
    } catch (error) {
      console.error('Structure analysis failed:', error)
      setNodes([])
    }
  }

  const resetView = () => {
    if (sceneRef.current) {
      sceneRef.current.scene.rotation.set(0, 0, 0)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <Cube className="h-5 w-5 text-cyan-400" weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Holographic Code</h3>
              <p className="text-xs text-muted-foreground">3D structure visualization</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRotating(!isRotating)}
            className="flex-1"
          >
            {isRotating ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Rotate
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetView}
            className="flex-1"
          >
            <ArrowsClockwise className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {nodes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">Legend:</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4488ff]"></div>
                <span className="text-xs text-foreground">Variables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#44ff88]"></div>
                <span className="text-xs text-foreground">Functions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff4488]"></div>
                <span className="text-xs text-foreground">Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ffaa44]"></div>
                <span className="text-xs text-foreground">Imports</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Cube className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Write code to see 3D structure</p>
            </div>
          </div>
        )}
      </div>

      {nodes.length > 0 && (
        <div className="p-4 border-t border-border max-h-40 overflow-auto">
          <div className="text-xs font-medium text-foreground mb-2">Detected Nodes</div>
          <div className="space-y-1">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {node.type}
                  </Badge>
                  <span className="text-foreground">{node.name}</span>
                </div>
                <span className="text-muted-foreground">L{node.lineNumber}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
