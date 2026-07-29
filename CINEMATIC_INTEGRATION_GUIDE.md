# Cinematic Components Integration Guide

This guide explains how to integrate the cinematic enhancement components into the Crowe Code and Synapse-Code platforms.

## 📦 Components Overview

### Core Systems

1. **Performance Manager** (`src/lib/performanceManager.ts`)
   - Adaptive quality system with FPS monitoring
   - Auto-adjusts based on device capability
   - Quality tiers: low, medium, high, ultra

2. **Neural Network** (`src/components/three/NeuralNetwork.tsx`)
   - Layered neural network visualization
   - Signal propagation animation
   - For Crowe Code platform

3. **Mycelial Network** (`src/components/three/MycelialNetwork.tsx`)
   - L-System based organic growth
   - Anastomosis (fusion) visualization
   - For Synapse-Code platform

4. **Particle Systems**
   - **Code Fragments**: Holographic code particles
   - **Spore System**: Bioluminescent organic spores

5. **Focal Elements**
   - **Obsidian Orb**: Central element for Crowe Code
   - **Fruiting Body**: Mycelial structures for Synapse-Code

6. **Cinematic Intro** (`src/components/three/CinematicIntro.tsx`)
   - 16-second 4-phase intro sequences
   - Platform-specific implementations

7. **Interactive Effects** (`src/components/three/InteractiveEffects.tsx`)
   - Mouse trails (electric/bioluminescent)
   - Click ripples
   - Hover glow effects

## 🚀 Quick Start

### 1. Basic Setup

```tsx
import { Canvas } from '@react-three/fiber'
import { usePerformanceManager } from '@/lib/performanceManager'
import { CroweCinematicIntro } from '@/components/three'

function App() {
  const { quality } = usePerformanceManager()

  return (
    <Canvas>
      <CroweCinematicIntro
        quality={quality.tier}
        onComplete={() => console.log('Intro complete')}
      />
    </Canvas>
  )
}
```

### 2. With Performance Monitoring

```tsx
import { usePerformanceManager, PerformanceMonitor } from '@/lib/performanceManager'

function App() {
  const { manager, quality } = usePerformanceManager({
    targetFPS: 60,
    adaptiveQuality: true,
    debugMode: true
  })

  return (
    <>
      <Canvas>
        {/* Your 3D content */}
      </Canvas>

      {/* Performance overlay */}
      <PerformanceMonitor manager={manager} position="top-right" />
    </>
  )
}
```

## 🎨 Platform-Specific Integration

### Crowe Code Implementation

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import {
  CroweCodeOrb,
  NeuralNetwork,
  CodeFragments,
  InteractivePlatformEffects
} from '@/components/three'

function CroweCodeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d9ff" />

      {/* Environment */}
      <Environment preset="night" />

      {/* Central orb */}
      <CroweCodeOrb radius={2} quality="high" />

      {/* Neural network */}
      <NeuralNetwork nodeCount={100} layers={5} quality="high" />

      {/* Floating code fragments */}
      <CodeFragments mode="float" count={300} quality="high" />

      {/* Interactive effects */}
      <InteractivePlatformEffects
        platform="crowe"
        quality="high"
        showTrail
        showHoverGlow
        showClickRipple
      />

      <OrbitControls />
    </Canvas>
  )
}
```

### Synapse-Code Implementation

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import {
  MycelialNetwork,
  SporeSystem,
  FruitingBody,
  InteractivePlatformEffects
} from '@/components/three'
import * as THREE from 'three'

function SynapseCodeScene() {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ffd9" />

      {/* Environment */}
      <Environment preset="forest" />

      {/* Ground substrate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#3d2817"
          emissive="#ff6600"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Mycelial network */}
      <MycelialNetwork
        pattern="anastomosing"
        iterations={4}
        quality="high"
        animated
      />

      {/* Fruiting bodies */}
      <FruitingBody position={new THREE.Vector3(-3, -2, 0)} size={1.5} />
      <FruitingBody position={new THREE.Vector3(3, -2, 2)} size={1.2} />

      {/* Spores */}
      <SporeSystem mode="drift" count={200} quality="high" />

      {/* Interactive effects */}
      <InteractivePlatformEffects
        platform="synapse"
        quality="high"
        showTrail
        showHoverGlow
        showClickRipple
      />

      <OrbitControls />
    </Canvas>
  )
}
```

## 📖 Component Reference

### Performance Manager

```tsx
const { manager, quality, metrics } = usePerformanceManager({
  targetFPS: 60,
  minFPS: 30,
  adaptiveQuality: true,
  debugMode: false
})

// Get current quality settings
const settings = manager.getQuality()

// Get component-specific settings
const particleSettings = manager.getComponentSettings('particles')
// Returns: { count: 300, quality: 'high' }

// Set quality manually
manager.setQuality('medium')

// Get performance grade
const grade = manager.getPerformanceGrade()
// Returns: 'excellent' | 'good' | 'fair' | 'poor'
```

### Neural Network

```tsx
<NeuralNetwork
  nodeCount={100}        // Number of nodes
  layers={5}             // Number of layers
  signalSpeed={1.0}      // Animation speed
  activeColor="#00d9ff"  // Active node color
  inactiveColor="#4b00ff" // Inactive node color
  quality="high"         // Performance tier
/>
```

### Mycelial Network

```tsx
<MycelialNetwork
  pattern="anastomosing"  // 'simple' | 'complex' | 'rhizomorphic' | 'dendritic' | 'anastomosing'
  iterations={4}          // L-system iterations
  growthSpeed={1.0}       // Animation speed
  bioluminescentColor="#00ffd9"
  baseColor="#ffaa00"
  quality="high"
  animated={true}
/>
```

### Code Fragments

```tsx
// Floating mode
<CodeFragments
  mode="float"
  count={300}
  codeSnippet="function transform(data) { return data.map(x => x * 2) }"
  color="#00d9ff"
  quality="high"
/>

// Assembling mode
<AssemblingCode
  count={200}
  codeSnippet="const magic = await synthesize(intent)"
/>

// Exploding mode
<ExplodingCode count={100} />

// Matrix rain effect
<MatrixRain count={200} />
```

### Spore System

```tsx
// Drifting spores
<SporeSystem
  mode="drift"
  count={200}
  bioluminescentColor="#00ffd9"
  amberColor="#ffaa00"
  quality="high"
/>

// Preset variants
<DriftingSpores count={200} />
<SporeRelease count={150} />
<SporeSwarm count={300} />
<SporeBurst count={100} />
```

### Obsidian Orb

```tsx
<ObsidianOrb
  radius={2}
  segments={64}
  electricColor="#00d9ff"
  rotation={true}
  rotationSpeed={0.2}
  pulseSpeed={1.0}
  quality="high"
  interactiveHover={true}
/>

// Preset for Crowe Code
<CroweCodeOrb />
```

### Cinematic Intro

```tsx
// Full intro
<CinematicIntro
  platform="crowe"      // 'crowe' | 'synapse'
  onComplete={() => {}} // Callback when complete
  autoPlay={true}
  quality="high"
  skipButton={true}
/>

// Platform-specific
<CroweCinematicIntro onComplete={handleComplete} />
<SynapseCinematicIntro onComplete={handleComplete} />

// Quick version
<QuickIntro platform="crowe" onComplete={handleComplete} />
```

### Interactive Effects

```tsx
// Electric trail (Crowe)
<ElectricTrail
  color="#00d9ff"
  segments={50}
  width={0.1}
  quality="high"
/>

// Bioluminescent trail (Synapse)
<BioluminescentTrail
  primaryColor="#00ffd9"
  secondaryColor="#ffaa00"
  segments={40}
  pulseSpeed={1.5}
  quality="high"
/>

// Hover glow
<HoverGlow
  color="#00d9ff"
  intensity={2.0}
  radius={1.0}
  platform="crowe"
/>

// Click ripple
<ClickRipple
  color="#00d9ff"
  maxRadius={2}
  duration={1.5}
  platform="crowe"
/>

// Combined effects
<InteractivePlatformEffects
  platform="crowe"
  quality="high"
  showTrail={true}
  showHoverGlow={true}
  showClickRipple={true}
/>
```

## 🎬 Cinematic Sequence Phases

### Crowe Code (16 seconds total)

1. **Void Awakening** (0-4s)
   - Obsidian orb emerges from darkness
   - Code fragments explode outward
   - Camera: `[0, 0, 15]`

2. **Neural Genesis** (4-8s)
   - Neural network forms around orb
   - Signals begin propagating
   - Camera: `[5, 3, 10]`

3. **Code Synthesis** (8-12s)
   - Code fragments assemble into patterns
   - Full neural network active
   - Camera: `[8, 5, 12]`

4. **Platform Reveal** (12-16s)
   - Complete scene with all elements
   - Platform title appears
   - Camera: `[0, 2, 8]`

### Synapse-Code (16 seconds total)

1. **Primordial Substrate** (0-4s)
   - Substrate ground plane forms
   - Initial spore release
   - Camera: `[0, 5, 15]`

2. **Hyphal Emergence** (4-8s)
   - Mycelial network begins growing
   - L-system iterations increase
   - Camera: `[10, 8, 12]`

3. **Network Formation** (8-12s)
   - Full mycelial network with anastomosis
   - Spore swarm emerges
   - Camera: `[6, 4, 10]`

4. **Consciousness Bloom** (12-16s)
   - Fruiting bodies emerge
   - Spores drift through scene
   - Camera: `[0, 3, 10]`

## ⚡ Performance Optimization

### Quality Tiers

| Tier   | Particles | Segments | Shadows | Post-FX | Scale |
|--------|-----------|----------|---------|---------|-------|
| Low    | 50-100    | 32       | None    | No      | 75%   |
| Medium | 150-200   | 48       | Low     | No      | 85%   |
| High   | 300-400   | 64       | Medium  | Yes     | 100%  |
| Ultra  | 500+      | 128      | High    | Yes     | 100%  |

### Adaptive Quality

The performance manager automatically adjusts quality based on FPS:

- **Below target - 10 FPS for 0.5s**: Downgrade quality
- **Above target + 20 FPS for 5s**: Upgrade quality
- **Critical (< 30 FPS)**: Emergency downgrade with setting reduction

### Manual Optimization

```tsx
// Disable specific features on low-end devices
const isMobile = /Mobile|Android/i.test(navigator.userAgent)

<CinematicIntro
  quality={isMobile ? 'low' : 'high'}
  autoPlay={!isMobile} // Skip on mobile
/>

// Component-level quality
<NeuralNetwork
  nodeCount={quality === 'low' ? 50 : 100}
  quality={quality}
/>
```

## 🔗 Integration with Existing Platform

### Homepage Integration

```tsx
// pages/index.tsx
import { useState } from 'react'
import { CroweCinematicIntro } from '@/components/three'

export default function HomePage() {
  const [introComplete, setIntroComplete] = useState(false)

  if (!introComplete) {
    return (
      <div className="h-screen w-full">
        <CroweCinematicIntro onComplete={() => setIntroComplete(true)} />
      </div>
    )
  }

  return (
    <div>
      {/* Existing homepage content */}
    </div>
  )
}
```

### Background Scene

```tsx
// Add as background to existing UI
<div className="relative">
  {/* 3D Background */}
  <div className="absolute inset-0 -z-10">
    <Canvas>
      <CroweCodeOrb radius={3} />
      <InteractivePlatformEffects platform="crowe" />
    </Canvas>
  </div>

  {/* Existing UI */}
  <div className="relative z-10">
    {/* Your content */}
  </div>
</div>
```

### Lazy Loading

```tsx
import dynamic from 'next/dynamic'

const CinematicIntro = dynamic(
  () => import('@/components/three').then(mod => mod.CroweCinematicIntro),
  { ssr: false }
)

// Use with loading state
<Suspense fallback={<LoadingSpinner />}>
  <CinematicIntro />
</Suspense>
```

## 🎯 Best Practices

1. **Always use Performance Manager** for adaptive quality
2. **Lazy load** 3D components to reduce initial bundle size
3. **Provide skip option** for intro sequences
4. **Use quality props** to match user device capability
5. **Monitor FPS** in production with performance manager
6. **Disable effects** on low-end devices
7. **Use presets** (`<CroweCodeOrb />`) for consistency
8. **Combine effects** wisely - don't overload the scene

## 📱 Mobile Considerations

```tsx
const isMobile = /Mobile|Android/i.test(navigator.userAgent)

<CinematicIntro
  quality={isMobile ? 'low' : 'high'}
  autoPlay={false} // Let user start manually on mobile
/>

// Or skip entirely on mobile
{!isMobile && <CinematicIntro />}
```

## 🐛 Debugging

Enable debug mode for performance insights:

```tsx
const { manager } = usePerformanceManager({
  debugMode: true // Logs quality adjustments
})

// Show performance overlay
<PerformanceMonitor manager={manager} position="top-right" />
```

## 📦 Dependencies

Required packages (already in project):
- `three` (v0.175.0)
- `@react-three/fiber`
- `@react-three/drei`
- `react`
- `zod` (for validation)

## 🎓 Examples

See component files for complete implementation examples:
- `/src/components/three/CinematicIntro.tsx` - Full intro sequence
- `/src/components/three/ObsidianOrb.tsx` - Advanced material usage
- `/src/lib/performanceManager.ts` - Performance optimization

## 🚀 Next Steps

1. Import components into your pages
2. Set up performance manager
3. Customize colors and settings to match brand
4. Test on various devices
5. Optimize based on analytics

## 📝 Notes

- All components support quality tiers for performance
- Shaders are optimized for WebGL 2.0
- Performance manager auto-detects device capability
- All particle systems use instanced rendering for performance
- Components are tree-shakeable for minimal bundle size
