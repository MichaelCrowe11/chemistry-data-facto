/**
 * Cinematic Intro Sequence
 * 16-second 4-phase intro for Crowe Code and Synapse-Code
 */

import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { NeuralNetwork } from './NeuralNetwork'
import { MycelialNetwork } from './MycelialNetwork'
import { CodeFragments, AssemblingCode, ExplodingCode } from './CodeFragments'
import { ObsidianOrb, CroweCodeOrb } from './ObsidianOrb'
import { SporeSystem, SporeRelease, FruitingBody } from './SporeSystem'

type Platform = 'crowe' | 'synapse'

interface Phase {
  id: number
  name: string
  duration: number
  camera: {
    position: [number, number, number]
    lookAt: [number, number, number]
  }
}

const crowePhases: Phase[] = [
  {
    id: 1,
    name: 'Void Awakening',
    duration: 4,
    camera: {
      position: [0, 0, 15],
      lookAt: [0, 0, 0]
    }
  },
  {
    id: 2,
    name: 'Neural Genesis',
    duration: 4,
    camera: {
      position: [5, 3, 10],
      lookAt: [0, 0, 0]
    }
  },
  {
    id: 3,
    name: 'Code Synthesis',
    duration: 4,
    camera: {
      position: [8, 5, 12],
      lookAt: [0, 2, 0]
    }
  },
  {
    id: 4,
    name: 'Platform Reveal',
    duration: 4,
    camera: {
      position: [0, 2, 8],
      lookAt: [0, 0, 0]
    }
  }
]

const synapsePhases: Phase[] = [
  {
    id: 1,
    name: 'Primordial Substrate',
    duration: 4,
    camera: {
      position: [0, 5, 15],
      lookAt: [0, 0, 0]
    }
  },
  {
    id: 2,
    name: 'Hyphal Emergence',
    duration: 4,
    camera: {
      position: [10, 8, 12],
      lookAt: [0, 2, 0]
    }
  },
  {
    id: 3,
    name: 'Network Formation',
    duration: 4,
    camera: {
      position: [6, 4, 10],
      lookAt: [0, 0, 0]
    }
  },
  {
    id: 4,
    name: 'Consciousness Bloom',
    duration: 4,
    camera: {
      position: [0, 3, 10],
      lookAt: [0, 1, 0]
    }
  }
]

interface CinematicIntroProps {
  platform: Platform
  onComplete?: () => void
  autoPlay?: boolean
  quality?: 'low' | 'medium' | 'high'
  skipButton?: boolean
}

export function CinematicIntro({
  platform = 'crowe',
  onComplete,
  autoPlay = true,
  quality = 'high',
  skipButton = true
}: CinematicIntroProps) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [hasCompleted, setHasCompleted] = useState(false)

  const phases = platform === 'crowe' ? crowePhases : synapsePhases
  const phase = phases[currentPhase]

  // Phase progression
  useEffect(() => {
    if (!isPlaying || hasCompleted) return

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 0.016 // ~60fps

        if (newTime >= phase.duration) {
          if (currentPhase < phases.length - 1) {
            setCurrentPhase(currentPhase + 1)
            return 0
          } else {
            setHasCompleted(true)
            setIsPlaying(false)
            onComplete?.()
            return prev
          }
        }

        return newTime
      })
    }, 16)

    return () => clearInterval(interval)
  }, [isPlaying, currentPhase, phase, phases, hasCompleted, onComplete])

  const handleSkip = () => {
    setHasCompleted(true)
    setIsPlaying(false)
    onComplete?.()
  }

  const progress = (elapsedTime / phase.duration) * 100

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Three.js Canvas */}
      <Canvas>
        <PerspectiveCamera
          makeDefault
          position={phase.camera.position}
          fov={60}
        />

        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4b00ff" />

        {/* Environment */}
        <Environment preset="night" />

        {/* Platform-specific intro */}
        {platform === 'crowe' ? (
          <CroweCodeIntro phase={currentPhase} progress={elapsedTime} quality={quality} />
        ) : (
          <SynapseCodeIntro phase={currentPhase} progress={elapsedTime} quality={quality} />
        )}

        {/* Camera controls (disabled during playback) */}
        <OrbitControls enabled={!isPlaying} />

        {/* Animated camera transitions */}
        <AnimatedCamera
          targetPosition={phase.camera.position}
          targetLookAt={phase.camera.lookAt}
          enabled={isPlaying}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Phase indicator */}
        <div className="absolute top-8 left-8 text-white pointer-events-auto">
          <div className="text-sm opacity-60 mb-2">
            Phase {phase.id} of {phases.length}
          </div>
          <div className="text-2xl font-bold mb-4">{phase.name}</div>

          {/* Progress bar */}
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip button */}
        {skipButton && isPlaying && (
          <button
            onClick={handleSkip}
            className="absolute top-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all pointer-events-auto"
          >
            Skip Intro
          </button>
        )}

        {/* Completion overlay */}
        {hasCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-4">
                {platform === 'crowe' ? 'Crowe Code' : 'Synapse-Code'}
              </div>
              <div className="text-xl opacity-80">
                {platform === 'crowe'
                  ? 'AI-Native Code Intelligence'
                  : 'Fungal Intelligence Platform'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Crowe Code intro sequence
 */
interface IntroProps {
  phase: number
  progress: number
  quality: 'low' | 'medium' | 'high'
}

function CroweCodeIntro({ phase, progress, quality }: IntroProps) {
  return (
    <group>
      {/* Phase 1: Void Awakening - Obsidian orb emerges */}
      {phase === 0 && (
        <>
          <CroweCodeOrb
            radius={1 + progress * 0.5}
            quality={quality}
            electricColor="#00d9ff"
          />
          <ExplodingCode count={50 + Math.floor(progress * 50)} quality={quality} />
        </>
      )}

      {/* Phase 2: Neural Genesis - Neural network grows */}
      {phase === 1 && (
        <>
          <CroweCodeOrb radius={1.5} quality={quality} />
          <NeuralNetwork
            nodeCount={20 + Math.floor(progress * 80)}
            layers={3 + Math.floor(progress * 2)}
            quality={quality}
          />
        </>
      )}

      {/* Phase 3: Code Synthesis - Code fragments assemble */}
      {phase === 2 && (
        <>
          <CroweCodeOrb radius={1.5} quality={quality} />
          <NeuralNetwork nodeCount={100} layers={5} quality={quality} />
          <AssemblingCode
            count={100 + Math.floor(progress * 200)}
            quality={quality}
          />
        </>
      )}

      {/* Phase 4: Platform Reveal - Full scene */}
      {phase === 3 && (
        <>
          <CroweCodeOrb radius={2} quality={quality} />
          <NeuralNetwork nodeCount={100} layers={5} quality={quality} />
          <CodeFragments mode="float" count={300} quality={quality} />

          {/* Platform title reveal */}
          <mesh position={[0, 4, 0]}>
            <planeGeometry args={[6, 1]} />
            <meshBasicMaterial
              transparent
              opacity={progress * 0.8}
              color="#00d9ff"
            />
          </mesh>
        </>
      )}
    </group>
  )
}

/**
 * Synapse-Code intro sequence
 */
function SynapseCodeIntro({ phase, progress, quality }: IntroProps) {
  return (
    <group>
      {/* Phase 1: Primordial Substrate - Substrate forms */}
      {phase === 0 && (
        <>
          {/* Primordial ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 32, 32]} />
            <meshStandardMaterial
              color="#3d2817"
              emissive="#ff6600"
              emissiveIntensity={0.1 + progress * 0.1}
              roughness={0.9}
            />
          </mesh>

          {/* Initial spore release */}
          <SporeRelease
            count={20 + Math.floor(progress * 30)}
            emissionPoint={new THREE.Vector3(0, -1, 0)}
            quality={quality}
          />
        </>
      )}

      {/* Phase 2: Hyphal Emergence - Mycelium begins growing */}
      {phase === 1 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 32, 32]} />
            <meshStandardMaterial color="#3d2817" emissive="#ff6600" emissiveIntensity={0.2} />
          </mesh>

          <MycelialNetwork
            pattern="complex"
            iterations={2 + Math.floor(progress / 2)}
            quality={quality}
            animated
          />

          <SporeRelease count={50} quality={quality} />
        </>
      )}

      {/* Phase 3: Network Formation - Full mycelial network */}
      {phase === 2 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 32, 32]} />
            <meshStandardMaterial color="#3d2817" emissive="#ff6600" emissiveIntensity={0.2} />
          </mesh>

          <MycelialNetwork
            pattern="anastomosing"
            iterations={4}
            quality={quality}
            animated
          />

          <SporeSystem
            mode="swarm"
            count={100 + Math.floor(progress * 100)}
            quality={quality}
          />
        </>
      )}

      {/* Phase 4: Consciousness Bloom - Fruiting bodies emerge */}
      {phase === 3 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 32, 32]} />
            <meshStandardMaterial color="#3d2817" emissive="#ff6600" emissiveIntensity={0.3} />
          </mesh>

          <MycelialNetwork
            pattern="anastomosing"
            iterations={4}
            quality={quality}
          />

          {/* Fruiting bodies */}
          <FruitingBody position={new THREE.Vector3(-3, -2, 0)} size={progress * 1.5} />
          <FruitingBody position={new THREE.Vector3(3, -2, 2)} size={progress * 1.2} />
          <FruitingBody position={new THREE.Vector3(0, -2, -3)} size={progress * 1.8} />

          <SporeSystem mode="drift" count={200} quality={quality} />
        </>
      )}
    </group>
  )
}

/**
 * Animated camera component
 */
interface AnimatedCameraProps {
  targetPosition: [number, number, number]
  targetLookAt: [number, number, number]
  enabled: boolean
}

function AnimatedCamera({ targetPosition, targetLookAt, enabled }: AnimatedCameraProps) {
  const cameraRef = useRef<THREE.Camera>()

  useEffect(() => {
    if (!enabled || !cameraRef.current) return

    // Smooth camera transition using GSAP or similar
    // For now, we'll use simple lerping in the render loop
  }, [targetPosition, targetLookAt, enabled])

  return null
}

/**
 * Pre-configured variants
 */

export function CroweCinematicIntro(props: Omit<CinematicIntroProps, 'platform'>) {
  return <CinematicIntro platform="crowe" {...props} />
}

export function SynapseCinematicIntro(props: Omit<CinematicIntroProps, 'platform'>) {
  return <CinematicIntro platform="synapse" {...props} />
}

/**
 * Minimal intro for fast loading
 */
export function QuickIntro({
  platform,
  onComplete
}: {
  platform: Platform
  onComplete?: () => void
}) {
  return (
    <CinematicIntro
      platform={platform}
      onComplete={onComplete}
      quality="low"
      autoPlay={true}
      skipButton={true}
    />
  )
}
