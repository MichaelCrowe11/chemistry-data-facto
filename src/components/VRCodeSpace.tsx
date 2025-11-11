import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Cube, X, ArrowsOut, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'
import '@/types/webxr'

interface VRCodeSpaceProps {
  code: string
  language: string
  onClose: () => void
  onCodeChange?: (code: string) => void
}

export function VRCodeSpace({ code, language, onClose, onCodeChange }: VRCodeSpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const [vrSupported, setVrSupported] = useState(false)
  const [arSupported, setArSupported] = useState(false)
  const [isVRActive, setIsVRActive] = useState(false)
  const [isARActive, setIsARActive] = useState(false)
  const xrSessionRef = useRef<XRSession | null>(null)
  const codeObjectsRef = useRef<THREE.Mesh[]>([])
  const controllerGroupRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 1.6, 3)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)

    const codeLines = code.split('\n')
    const lineHeight = 0.15
    const startY = (codeLines.length * lineHeight) / 2

    codeObjectsRef.current = []

    codeLines.forEach((line, index) => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.width = 2048
      canvas.height = 128

      context.fillStyle = '#1a1a2e'
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.font = 'bold 48px "JetBrains Mono", monospace'
      context.fillStyle = '#00ff88'
      context.fillText(line || ' ', 20, 80)

      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })

      const geometry = new THREE.PlaneGeometry(4, 0.25)
      const mesh = new THREE.Mesh(geometry, material)
      
      mesh.position.set(0, startY - index * lineHeight, -2)
      mesh.userData = { lineIndex: index, lineText: line }
      
      scene.add(mesh)
      codeObjectsRef.current.push(mesh)
    })

    const controllerGroup = new THREE.Group()
    scene.add(controllerGroup)
    controllerGroupRef.current = controllerGroup

    const controller1 = renderer.xr.getController(0)
    controllerGroup.add(controller1)

    const controller2 = renderer.xr.getController(1)
    controllerGroup.add(controller2)

    const controllerGrip1 = renderer.xr.getControllerGrip(0)
    const controllerGrip2 = renderer.xr.getControllerGrip(1)
    controllerGroup.add(controllerGrip1)
    controllerGroup.add(controllerGrip2)

    const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5),
    ])
    const pointerMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff })
    
    const pointer1 = new THREE.Line(pointerGeometry, pointerMaterial)
    controller1.add(pointer1)
    
    const pointer2 = new THREE.Line(pointerGeometry, pointerMaterial)
    controller2.add(pointer2)

    let animationId: number
    const animate = () => {
      animationId = renderer.xr.isPresenting 
        ? renderer.setAnimationLoop(render)
        : requestAnimationFrame(animate)
      
      if (!renderer.xr.isPresenting) {
        render()
      }
    }

    const render = () => {
      const time = performance.now() * 0.001

      codeObjectsRef.current.forEach((mesh, index) => {
        mesh.position.x = Math.sin(time * 0.5 + index * 0.1) * 0.05
        mesh.rotation.y = Math.sin(time * 0.3 + index * 0.2) * 0.02
      })

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    checkXRSupport()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (renderer) {
        renderer.dispose()
        renderer.domElement.remove()
      }
      if (xrSessionRef.current) {
        xrSessionRef.current.end()
      }
    }
  }, [code])

  const checkXRSupport = async () => {
    if ('xr' in navigator) {
      try {
        const vrSupport = await (navigator as any).xr.isSessionSupported('immersive-vr')
        setVrSupported(vrSupport)
        
        const arSupport = await (navigator as any).xr.isSessionSupported('immersive-ar')
        setArSupported(arSupport)
      } catch (error) {
        console.log('WebXR not fully supported:', error)
      }
    }
  }

  const enterVR = async () => {
    if (!rendererRef.current || !vrSupported) return

    try {
      const sessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
      }
      
      const session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit)
      xrSessionRef.current = session
      
      await rendererRef.current.xr.setSession(session)
      setIsVRActive(true)
      
      session.addEventListener('end', () => {
        setIsVRActive(false)
        xrSessionRef.current = null
      })
      
      toast.success('Entered VR Mode - Use controllers to interact with code')
    } catch (error) {
      console.error('Failed to enter VR:', error)
      toast.error('Failed to enter VR mode')
    }
  }

  const enterAR = async () => {
    if (!rendererRef.current || !arSupported) return

    try {
      const sessionInit = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
        domOverlay: { root: document.body }
      }
      
      const session = await (navigator as any).xr.requestSession('immersive-ar', sessionInit)
      xrSessionRef.current = session
      
      await rendererRef.current.xr.setSession(session)
      setIsARActive(true)

      if (sceneRef.current) {
        sceneRef.current.background = null
      }
      
      session.addEventListener('end', () => {
        setIsARActive(false)
        xrSessionRef.current = null
        if (sceneRef.current) {
          sceneRef.current.background = new THREE.Color(0x0a0a0f)
        }
      })
      
      toast.success('Entered AR Mode - Point at a surface to place code')
    } catch (error) {
      console.error('Failed to enter AR:', error)
      toast.error('Failed to enter AR mode')
    }
  }

  const exitXR = () => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Cube className="h-6 w-6 text-primary" weight="duotone" />
          <div>
            <h2 className="text-sm font-semibold">Immersive Code Space</h2>
            <p className="text-xs text-muted-foreground">{language} - VR/AR Enabled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vrSupported && (
            <Button
              size="sm"
              onClick={isVRActive ? exitXR : enterVR}
              className="gap-2"
              variant={isVRActive ? "destructive" : "default"}
            >
              <Eye className="h-4 w-4" />
              {isVRActive ? 'Exit VR' : 'Enter VR'}
            </Button>
          )}
          {arSupported && (
            <Button
              size="sm"
              onClick={isARActive ? exitXR : enterAR}
              className="gap-2"
              variant={isARActive ? "destructive" : "default"}
            >
              <ArrowsOut className="h-4 w-4" />
              {isARActive ? 'Exit AR' : 'Enter AR'}
            </Button>
          )}
          {!vrSupported && !arSupported && (
            <Badge variant="secondary" className="text-xs">
              WebXR not supported
            </Badge>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative">
        {!vrSupported && !arSupported && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-card/90 backdrop-blur-sm p-6 rounded-lg border border-border max-w-md text-center">
              <Cube className="h-12 w-12 text-primary mx-auto mb-4" weight="duotone" />
              <h3 className="text-lg font-semibold mb-2">WebXR Not Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                VR/AR features require a WebXR-compatible browser and device. 
                Try using Chrome or Edge on a VR headset or AR-capable device.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Meta Quest: Use built-in browser</p>
                <p>• AR on mobile: Use Chrome on Android</p>
                <p>• Desktop VR: Use Chrome with SteamVR</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {(isVRActive || isARActive) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">
              {isVRActive ? 'VR Active' : 'AR Active'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
