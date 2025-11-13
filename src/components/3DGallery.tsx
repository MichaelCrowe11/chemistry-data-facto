import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { CodeCube3D } from '@/components/3DCodeCube';
import { ParticleField3D } from '@/components/3DParticleField';
import { NetworkGraph3D } from '@/components/3DNetworkGraph';
import { Waveform3D } from '@/components/3DWaveform';
import { Tunnel3D } from '@/components/3DTunnel';
import { Galaxy3D } from '@/components/3DGalaxy';
import { FloatingIslands3D } from '@/components/3DFloatingIslands';
import { X, Cube, Atom, Network, Waveform, Spiral, Planet, CloudArrowUp } from '@phosphor-icons/react';

interface Gallery3DProps {
  onClose: () => void;
  currentCode?: string;
  currentLanguage?: string;
}

export function Gallery3D({ onClose, currentCode, currentLanguage }: Gallery3DProps) {
  const [selectedDemo, setSelectedDemo] = useState<string>('islands');

  const networkNodes = [
    { id: '0', label: 'Main', connections: ['1', '2', '3'] },
    { id: '1', label: 'Utils', connections: ['4'] },
    { id: '2', label: 'Components', connections: ['5'] },
    { id: '3', label: 'Hooks', connections: ['4', '5'] },
    { id: '4', label: 'Services', connections: [] },
    { id: '5', label: 'API', connections: ['4'] },
  ];

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Cube className="w-5 h-5 text-cyan-400" weight="fill" />
          <h2 className="font-semibold text-sm">3D Gallery</h2>
          <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 border-0 text-xs">
            IMMERSIVE
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-7 w-7"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-cyan-500/20">
          <p className="text-xs text-muted-foreground mb-3">
            Explore immersive 3D visualizations powered by WebGL. These interactive demos showcase
            spatial interactions and game-like graphics rendering.
          </p>
          
          <Tabs value={selectedDemo} onValueChange={setSelectedDemo} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="islands" className="text-xs gap-1">
                <CloudArrowUp className="w-3 h-3" />
                Islands
              </TabsTrigger>
              <TabsTrigger value="galaxy" className="text-xs gap-1">
                <Planet className="w-3 h-3" />
                Galaxy
              </TabsTrigger>
              <TabsTrigger value="tunnel" className="text-xs gap-1">
                <Spiral className="w-3 h-3" />
                Tunnel
              </TabsTrigger>
              <TabsTrigger value="cube" className="text-xs gap-1">
                <Cube className="w-3 h-3" />
                Cube
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="particles" className="text-xs gap-1">
                <Atom className="w-3 h-3" />
                Particles
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs gap-1">
                <Network className="w-3 h-3" />
                Network
              </TabsTrigger>
              <TabsTrigger value="waveform" className="text-xs gap-1">
                <Waveform className="w-3 h-3" />
                Waves
              </TabsTrigger>
            </TabsList>

            <TabsContent value="islands" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg overflow-hidden border border-cyan-500/20 h-80">
                <FloatingIslands3D islandCount={8} rotationSpeed={0.002} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Floating Crystal Islands</p>
                <p>Explore mystical floating islands with glowing crystals orbiting in 3D space. Interactive camera follows your mouse for immersive navigation.</p>
              </div>
            </TabsContent>

            <TabsContent value="cube" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg p-1 border border-cyan-500/20">
                <CodeCube3D 
                  code={currentCode || ''} 
                  language={currentLanguage || 'javascript'} 
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Interactive Code Cube</p>
                <p>A multi-faceted 3D cube representing your code structure. Move your mouse to rotate and explore.</p>
              </div>
            </TabsContent>

            <TabsContent value="particles" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg overflow-hidden border border-cyan-500/20 h-64">
                <ParticleField3D intensity="high" color={0x00C9FF} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Particle Field Simulation</p>
                <p>Thousands of interactive particles respond to your mouse movements in real-time with physics-based behavior.</p>
              </div>
            </TabsContent>

            <TabsContent value="network" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg overflow-hidden border border-cyan-500/20 h-64">
                <NetworkGraph3D nodes={networkNodes} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">3D Network Graph</p>
                <p>Visualize code dependencies and module relationships in an interactive 3D space.</p>
              </div>
            </TabsContent>

            <TabsContent value="waveform" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg overflow-hidden border border-cyan-500/20 h-64">
                <Waveform3D amplitude={3} frequency={0.3} color={0xFF6B9D} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">3D Audio Waveform</p>
                <p>Dynamic 3D waveforms simulate audio visualization with layered sine waves and smooth animations.</p>
              </div>
            </TabsContent>

            <TabsContent value="tunnel" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg overflow-hidden border border-cyan-500/20 h-64">
                <Tunnel3D speed={0.08} color1={0x00C9FF} color2={0xFF6B9D} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Hyperspace Tunnel</p>
                <p>Travel through an infinite 3D tunnel with pulsating rings and stars. Immersive spatial experience with dynamic camera movement.</p>
              </div>
            </TabsContent>

            <TabsContent value="galaxy" className="space-y-3">
              <div className="bg-gradient-to-br from-cyan-950/50 to-purple-950/50 rounded-lg overflow-hidden border border-cyan-500/20 h-64">
                <Galaxy3D starCount={8000} armCount={5} rotationSpeed={0.002} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Spiral Galaxy Simulation</p>
                <p>Explore a procedurally generated spiral galaxy with thousands of stars. Move your mouse to orbit around the galactic core.</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-cyan-950/30 to-purple-950/30 border-cyan-500/20">
          <h3 className="font-semibold text-xs mb-2 text-cyan-400">Technical Features</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>WebGL-powered hardware-accelerated rendering</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Real-time physics simulation and particle systems</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-400">•</span>
              <span>Mouse-driven parallax and interactive controls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Optimized for 60fps with dynamic LOD</span>
            </li>
          </ul>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-950/30 to-pink-950/30 border-purple-500/20">
          <h3 className="font-semibold text-xs mb-2 text-purple-400">What You Can Do</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">→</span>
              <span>Move your mouse to interact with each visualization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-400">→</span>
              <span>Switch between demos using the tabs above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">→</span>
              <span>Enjoy smooth 3D animations and spatial effects</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
