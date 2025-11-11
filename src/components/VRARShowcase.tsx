import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, MapPin, Desktop, Cube, Sparkle, X } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

interface VRARShowcaseProps {
  onClose: () => void
  onSelectMode: (mode: 'vr-code' | 'vr-workspace' | 'ar') => void
}

export function VRARShowcase({ onClose, onSelectMode }: VRARShowcaseProps) {
  const [vrSupported, setVrSupported] = useState(false)
  const [arSupported, setArSupported] = useState(false)

  useEffect(() => {
    checkSupport()
  }, [])

  const checkSupport = async () => {
    if ('xr' in navigator) {
      try {
        const vr = await (navigator as any).xr.isSessionSupported('immersive-vr')
        const ar = await (navigator as any).xr.isSessionSupported('immersive-ar')
        setVrSupported(vr)
        setArSupported(ar)
      } catch (error) {
        console.log('WebXR check failed:', error)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Immersive Coding Experience
            </h1>
            <p className="text-muted-foreground text-lg">
              Code in Virtual Reality and Augmented Reality with WebXR technology
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-blue-400" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold mb-2">VR Code View</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View your code as floating 3D panels in virtual reality with animated visualizations
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant="secondary" className="text-xs">3D Panels</Badge>
                <Badge variant="secondary" className="text-xs">Controllers</Badge>
                <Badge variant="secondary" className="text-xs">Hand Tracking</Badge>
              </div>
              <Button
                onClick={() => onSelectMode('vr-code')}
                className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
                disabled={!vrSupported}
              >
                <Eye className="h-4 w-4" />
                {vrSupported ? 'Try VR Code' : 'VR Not Available'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Desktop className="h-8 w-8 text-purple-400" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold mb-2">VR Workspace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full immersive development environment with file tree and spatial code editor
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant="secondary" className="text-xs">File Tree</Badge>
                <Badge variant="secondary" className="text-xs">360° View</Badge>
                <Badge variant="secondary" className="text-xs">Multi-Panel</Badge>
              </div>
              <Button
                onClick={() => onSelectMode('vr-workspace')}
                className="w-full gap-2 bg-purple-500 hover:bg-purple-600"
                disabled={!vrSupported}
              >
                <Desktop className="h-4 w-4" />
                {vrSupported ? 'Enter Workspace' : 'VR Not Available'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-green-400" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AR Code Overlay</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Place code in your physical space using augmented reality for unique debugging
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant="secondary" className="text-xs">Real World</Badge>
                <Badge variant="secondary" className="text-xs">Surface Detect</Badge>
                <Badge variant="secondary" className="text-xs">Multi-Place</Badge>
              </div>
              <Button
                onClick={() => onSelectMode('ar')}
                className="w-full gap-2 bg-green-500 hover:bg-green-600"
                disabled={!arSupported}
              >
                <MapPin className="h-4 w-4" />
                {arSupported ? 'Start AR Mode' : 'AR Not Available'}
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card/50">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Cube className="h-5 w-5 text-primary" />
              Requirements
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-400">VR:</span>
                <span className="text-muted-foreground">Meta Quest, Vive, Index with WebXR browser</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">AR:</span>
                <span className="text-muted-foreground">ARCore/ARKit device with Chrome/Safari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">All:</span>
                <span className="text-muted-foreground">WebGL 2.0 compatible graphics</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-primary" />
              Use Cases
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Review code in immersive 3D space</div>
              <div>• Debug with AR overlays on your desk</div>
              <div>• Present code in VR meetings</div>
              <div>• Spatial learning and memorization</div>
              <div>• Multi-file comparison in 3D</div>
            </div>
          </Card>
        </div>

        {!vrSupported && !arSupported && (
          <Card className="mt-6 p-6 bg-destructive/10 border-destructive/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h4 className="font-semibold text-destructive mb-1">WebXR Not Available</h4>
                <p className="text-sm text-muted-foreground">
                  Your device or browser doesn't support WebXR. Try using Chrome or Edge with a VR headset, 
                  or Chrome on an ARCore-compatible Android device.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 flex justify-center gap-4 text-sm text-muted-foreground">
          <a href="/VR_AR_FEATURES.md" className="hover:text-foreground transition-colors">
            📖 Full Documentation
          </a>
          <span>•</span>
          <a href="/VR_AR_QUICKSTART.md" className="hover:text-foreground transition-colors">
            🚀 Quick Start Guide
          </a>
        </div>
      </div>
    </div>
  )
}
