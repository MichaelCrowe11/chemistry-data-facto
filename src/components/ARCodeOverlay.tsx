import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MapPin, X, Hand, Crosshair } from '@phosphor-icons/react'
import { toast } from 'sonner'
import '@/types/webxr.d.ts'

interface ARCodeOverlayProps {
  code: string
  language: string
  fileName: string
  onClose: () => void
}

export function ARCodeOverlay({ code, language, fileName, onClose }: ARCodeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [arActive, setArActive] = useState(false)
  const [arSupported, setArSupported] = useState(false)
  const [isPlacing, setIsPlacing] = useState(false)
  const [placedObjects, setPlacedObjects] = useState(0)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sessionRef = useRef<XRSession | null>(null)
  const reticleRef = useRef<THREE.Mesh | null>(null)
  const hitTestSourceRef = useRef<any>(null)

  useEffect(() => {
    checkARSupport()
  }, [])

  const checkARSupport = async () => {
    if ('xr' in navigator) {
      try {
        const supported = await (navigator as any).xr.isSessionSupported('immersive-ar')
        setArSupported(supported)
      } catch (error) {
        console.log('AR not supported:', error)
      }
    }
  }

  const initARScene = () => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    )
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
    light.position.set(0.5, 1, 0.25)
    scene.add(light)

    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2)
    const reticleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      side: THREE.DoubleSide
    })
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
    reticleRef.current = reticle

    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && hitTestSourceRef.current && reticleRef.current) {
        const referenceSpace = renderer.xr.getReferenceSpace()
        const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current)

        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0]
          const pose = hit.getPose(referenceSpace!)
          
          if (pose) {
            reticleRef.current.visible = true
            reticleRef.current.matrix.fromArray(pose.transform.matrix)
          }
        } else {
          reticleRef.current.visible = false
        }
      }

      renderer.render(scene, camera)
    })
  }

  const startAR = async () => {
    if (!arSupported) {
      toast.error('AR not supported on this device')
      return
    }

    try {
      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      })

      sessionRef.current = session
      initARScene()

      if (rendererRef.current) {
        await rendererRef.current.xr.setSession(session)
      }

      session.addEventListener('select', onSelect)

      session.requestReferenceSpace('viewer').then((refSpace: any) => {
        session.requestHitTestSource({ space: refSpace }).then((source: any) => {
          hitTestSourceRef.current = source
          setIsPlacing(true)
        })
      })

      session.addEventListener('end', () => {
        setArActive(false)
        setIsPlacing(false)
        sessionRef.current = null
        hitTestSourceRef.current = null
      })

      setArActive(true)
      toast.success('AR Mode Active - Tap to place code in your space')
    } catch (error) {
      console.error('Failed to start AR:', error)
      toast.error('Failed to start AR session')
    }
  }

  const onSelect = () => {
    if (!reticleRef.current || !reticleRef.current.visible || !sceneRef.current) return

    const codeLines = code.split('\n').slice(0, 10)
    const group = new THREE.Group()

    codeLines.forEach((line, index) => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.width = 1024
      canvas.height = 64

      context.fillStyle = 'rgba(26, 26, 46, 0.9)'
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.font = '32px "JetBrains Mono", monospace'
      context.fillStyle = '#00ff88'
      context.fillText(line.slice(0, 50) || ' ', 10, 45)

      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      const geometry = new THREE.PlaneGeometry(0.5, 0.05)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = -index * 0.06
      group.add(mesh)
    })

    const headerCanvas = document.createElement('canvas')
    const headerCtx = headerCanvas.getContext('2d')
    if (headerCtx) {
      headerCanvas.width = 1024
      headerCanvas.height = 80

      headerCtx.fillStyle = 'rgba(59, 130, 246, 0.9)'
      headerCtx.fillRect(0, 0, headerCanvas.width, headerCanvas.height)

      headerCtx.font = 'bold 40px "JetBrains Mono", monospace'
      headerCtx.fillStyle = '#ffffff'
      headerCtx.fillText(fileName, 20, 55)

      const headerTexture = new THREE.CanvasTexture(headerCanvas)
      const headerMaterial = new THREE.MeshBasicMaterial({
        map: headerTexture,
        transparent: true
      })

      const headerGeometry = new THREE.PlaneGeometry(0.5, 0.04)
      const headerMesh = new THREE.Mesh(headerGeometry, headerMaterial)
      headerMesh.position.y = 0.05
      group.add(headerMesh)
    }

    group.position.setFromMatrixPosition(reticleRef.current.matrix)
    group.quaternion.setFromRotationMatrix(reticleRef.current.matrix)

    sceneRef.current.add(group)
    setPlacedObjects(prev => prev + 1)
    toast.success(`Placed ${fileName} in AR space`)
  }

  const stopAR = () => {
    if (sessionRef.current) {
      sessionRef.current.end()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm relative z-50">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" weight="duotone" />
          <div>
            <h2 className="text-sm font-semibold">AR Code Overlay</h2>
            <p className="text-xs text-muted-foreground">
              Place code in your physical space
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {arSupported ? (
            <Button
              size="sm"
              onClick={arActive ? stopAR : startAR}
              variant={arActive ? "destructive" : "default"}
              className="gap-2"
            >
              {arActive ? (
                <>
                  <X className="h-4 w-4" />
                  Exit AR
                </>
              ) : (
                <>
                  <Hand className="h-4 w-4" />
                  Start AR
                </>
              )}
            </Button>
          ) : (
            <Badge variant="secondary">AR not available</Badge>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative">
        {!arActive && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <Card className="max-w-lg p-8 text-center">
              <MapPin className="h-16 w-16 text-primary mx-auto mb-4" weight="duotone" />
              <h3 className="text-xl font-semibold mb-3">Augmented Reality Code Viewer</h3>
              <p className="text-muted-foreground mb-6">
                View and interact with your code in augmented reality. Place code snippets 
                in your physical environment for immersive debugging and review.
              </p>
              
              {arSupported ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-left text-sm space-y-2">
                    <p className="font-semibold">How to use:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Click "Start AR" to begin</li>
                      <li>Point your camera at a flat surface</li>
                      <li>Tap when the target appears</li>
                      <li>Your code will be placed in 3D space</li>
                    </ol>
                  </div>
                  <Button onClick={startAR} size="lg" className="w-full gap-2">
                    <Hand className="h-5 w-5" />
                    Start AR Experience
                  </Button>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive font-medium mb-2">
                    AR Not Available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This feature requires a device with AR capabilities. Try using Chrome 
                    on an Android device with ARCore support.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {arActive && isPlacing && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <Crosshair className="h-12 w-12 text-primary animate-pulse" weight="bold" />
          </div>
        )}

        {arActive && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
            <Card className="px-6 py-3 bg-card/90 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">AR Active</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm text-muted-foreground">
                  {placedObjects} object{placedObjects !== 1 ? 's' : ''} placed
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
