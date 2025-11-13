import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Cube, X, Desktop, Eye, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import '@/types/webxr.d.ts'
import { FileItem } from '@/types/editor'

interface VRWorkspaceProps {
  files: FileItem[]
  activeFile: { name: string; content: string; language: string } | null
  onClose: () => void
  onFileSelect?: (fileId: string) => void
}

export function VRWorkspace({ files, activeFile, onClose, onFileSelect }: VRWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [vrSupported, setVrSupported] = useState(false)
  const [vrActive, setVrActive] = useState(false)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const sessionRef = useRef<XRSession | null>(null)
  const workspaceGroupRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    checkVRSupport()
    initPreviewScene()

    return () => {
      if (sessionRef.current) {
        sessionRef.current.end()
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (vrActive && activeFile) {
      updateMainCodePanel()
    }
  }, [activeFile, vrActive])

  const checkVRSupport = async () => {
    if ('xr' in navigator) {
      try {
        const supported = await (navigator as any).xr.isSessionSupported('immersive-vr')
        setVrSupported(supported)
      } catch (error) {
        console.log('VR not supported:', error)
      }
    }
  }

  const initPreviewScene = () => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 1.6, 4)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 10)
    pointLight1.position.set(3, 3, 3)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 10)
    pointLight2.position.set(-3, 3, -3)
    scene.add(pointLight2)

    const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x222244)
    gridHelper.position.y = -0.01
    scene.add(gridHelper)

    const workspaceGroup = new THREE.Group()
    workspaceGroupRef.current = workspaceGroup
    scene.add(workspaceGroup)

    createWorkspaceEnvironment()

    let time = 0
    const animate = () => {
      if (!vrActive) {
        requestAnimationFrame(animate)
        time += 0.01
        
        if (workspaceGroupRef.current) {
          workspaceGroupRef.current.rotation.y = Math.sin(time * 0.2) * 0.1
        }

        renderer.render(scene, camera)
      }
    }

    animate()
  }

  const createWorkspaceEnvironment = () => {
    if (!workspaceGroupRef.current) return

    workspaceGroupRef.current.clear()

    const fileTreePanel = createFileTreePanel()
    fileTreePanel.position.set(-2.5, 1.5, -3)
    fileTreePanel.rotation.y = 0.3
    workspaceGroupRef.current.add(fileTreePanel)

    if (activeFile) {
      const codePanel = createCodePanel(activeFile.content, activeFile.name)
      codePanel.position.set(0, 1.5, -3)
      workspaceGroupRef.current.add(codePanel)
    }

    const toolbarPanel = createToolbarPanel()
    toolbarPanel.position.set(0, 2.8, -3)
    workspaceGroupRef.current.add(toolbarPanel)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(5, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.8,
        metalness: 0.2
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    workspaceGroupRef.current.add(floor)
  }

  const createFileTreePanel = (): THREE.Group => {
    const group = new THREE.Group()

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return group

    canvas.width = 512
    canvas.height = 1024

    ctx.fillStyle = '#16213e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#0f4c75'
    ctx.fillRect(0, 0, canvas.width, 60)
    ctx.font = 'bold 32px "JetBrains Mono"'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('FILES', 20, 42)

    ctx.font = '24px "JetBrains Mono"'
    files.slice(0, 15).forEach((file, index) => {
      const y = 100 + index * 50
      ctx.fillStyle = file.type === 'folder' ? '#3bbaef' : '#00ff88'
      ctx.fillText(file.type === 'folder' ? '📁 ' + file.name : '📄 ' + file.name, 30, y)
    })

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95
    })

    const geometry = new THREE.PlaneGeometry(1.5, 3)
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x00ffff })
    )
    group.add(border)

    return group
  }

  const createCodePanel = (code: string, fileName: string): THREE.Group => {
    const group = new THREE.Group()

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return group

    canvas.width = 2048
    canvas.height = 2048

    ctx.fillStyle = '#0f0f1e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#1e3a5f'
    ctx.fillRect(0, 0, canvas.width, 80)
    ctx.font = 'bold 48px "JetBrains Mono"'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(fileName, 30, 58)

    const lines = code.split('\n').slice(0, 25)
    ctx.font = '36px "JetBrains Mono"'
    
    lines.forEach((line, index) => {
      const y = 140 + index * 60
      
      ctx.fillStyle = '#555566'
      ctx.fillText(String(index + 1).padStart(3, ' '), 30, y)
      
      ctx.fillStyle = '#00ff88'
      ctx.fillText(line.slice(0, 60), 150, y)
    })

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95
    })

    const geometry = new THREE.PlaneGeometry(4, 4)
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 })
    )
    group.add(border)

    return group
  }

  const createToolbarPanel = (): THREE.Group => {
    const group = new THREE.Group()

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return group

    canvas.width = 2048
    canvas.height = 128

    ctx.fillStyle = 'rgba(30, 58, 95, 0.9)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = 'bold 40px "JetBrains Mono"'
    ctx.fillStyle = '#00ffff'
    ctx.fillText('⚡ Crowe Code VR Workspace', 40, 80)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    })

    const geometry = new THREE.PlaneGeometry(4, 0.25)
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)

    return group
  }

  const updateMainCodePanel = () => {
    if (!workspaceGroupRef.current || !activeFile) return
    createWorkspaceEnvironment()
  }

  const startVR = async () => {
    if (!vrSupported) {
      toast.error('VR not supported on this device')
      return
    }

    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      })

      sessionRef.current = session

      if (rendererRef.current) {
        await rendererRef.current.xr.setSession(session)

        rendererRef.current.setAnimationLoop((time, frame) => {
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          }
        })
      }

      session.addEventListener('end', () => {
        setVrActive(false)
        sessionRef.current = null
        if (rendererRef.current) {
          rendererRef.current.setAnimationLoop(null)
        }
      })

      setVrActive(true)
      toast.success('Entered VR Workspace - Look around to explore')
    } catch (error) {
      console.error('Failed to start VR:', error)
      toast.error('Failed to start VR session')
    }
  }

  const stopVR = () => {
    if (sessionRef.current) {
      sessionRef.current.end()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm relative z-50">
        <div className="flex items-center gap-3">
          <Desktop className="h-6 w-6 text-primary" weight="duotone" />
          <div>
            <h2 className="text-sm font-semibold">VR Workspace</h2>
            <p className="text-xs text-muted-foreground">
              Immersive development environment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vrSupported ? (
            <Button
              size="sm"
              onClick={vrActive ? stopVR : startVR}
              variant={vrActive ? "destructive" : "default"}
              className="gap-2"
            >
              {vrActive ? (
                <>
                  <X className="h-4 w-4" />
                  Exit VR
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Enter VR
                </>
              )}
            </Button>
          ) : (
            <Badge variant="secondary">VR not available</Badge>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative bg-gradient-to-b from-slate-900 to-black">
        {!vrActive && (
          <div className="absolute inset-0 flex items-center justify-center p-8 z-10 pointer-events-none">
            <Card className="max-w-2xl p-8 pointer-events-auto">
              <div className="text-center mb-6">
                <Cube className="h-20 w-20 text-primary mx-auto mb-4 animate-pulse" weight="duotone" />
                <h3 className="text-2xl font-bold mb-3">Virtual Reality Workspace</h3>
                <p className="text-muted-foreground">
                  Step into an immersive 3D coding environment with spatial file navigation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Features
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 3D file explorer</li>
                    <li>• Floating code panels</li>
                    <li>• Spatial code organization</li>
                    <li>• Hand tracking support</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Requirements
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• VR headset (Quest, Vive, etc.)</li>
                    <li>• WebXR compatible browser</li>
                    <li>• Standing room space</li>
                  </ul>
                </div>
              </div>

              {vrSupported ? (
                <Button onClick={startVR} size="lg" className="w-full gap-2">
                  <Eye className="h-5 w-5" />
                  Enter VR Workspace
                </Button>
              ) : (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-destructive font-medium mb-2">
                    VR Not Available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connect a VR headset and use a WebXR-compatible browser to access this feature.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {vrActive && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
            <Card className="px-6 py-3 bg-card/90 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">VR Workspace Active</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm text-muted-foreground">
                  {files.length} files • {activeFile?.name || 'No file open'}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
