/**
 * Mycelial Network Component
 * Uses L-System for organic growth visualization
 * For Synapse-Code cinematic experience
 */

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LSystemGrowth, MycelialPatterns, Anastomosis } from '@/algorithms/lSystem'

interface MycelialNetworkProps {
  pattern?: keyof typeof MycelialPatterns
  iterations?: number
  growthSpeed?: number
  bioluminescentColor?: string
  baseColor?: string
  quality?: 'low' | 'medium' | 'high'
  animated?: boolean
}

export function MycelialNetwork({
  pattern = 'complex',
  iterations = 4,
  growthSpeed = 1.0,
  bioluminescentColor = '#00ffd9',
  baseColor = '#ffaa00',
  quality = 'high',
  animated = true
}: MycelialNetworkProps) {
  const hyphaeRef = useRef<THREE.LineSegments>(null)
  const fusionsRef = useRef<THREE.LineSegments>(null)
  const [growthProgress, setGrowthProgress] = useState(0)

  // Generate L-System
  const lSystem = useMemo(() => {
    const config = MycelialPatterns[pattern]
    return new LSystemGrowth({
      ...config,
      iterations: iterations || config.iterations
    })
  }, [pattern, iterations])

  // Generate geometry
  const { hyphaeGeometry, fusionGeometry } = useMemo(() => {
    const instructions = lSystem.generate()
    const hyphae = lSystem.createGeometry(instructions)

    // Create fusion points
    const branchPoints = lSystem.getBranchPoints(instructions)
    const anastomosis = new Anastomosis(0.5)

    // Split points into groups for self-fusion detection
    const midPoint = Math.floor(branchPoints.length / 2)
    const group1 = branchPoints.slice(0, midPoint)
    const group2 = branchPoints.slice(midPoint)

    const fusions = anastomosis.findFusionPoints(group1, group2)
    const fusionGeo = anastomosis.createFusionGeometry(fusions)

    return { hyphaeGeometry: hyphae, fusionGeometry: fusionGeo }
  }, [lSystem])

  // Animate growth
  useFrame((state, delta) => {
    if (!animated || growthProgress >= 1) return

    setGrowthProgress(prev => Math.min(prev + delta * growthSpeed * 0.5, 1))
  })

  useEffect(() => {
    if (!hyphaeRef.current) return

    // Update material opacity based on growth
    const material = hyphaeRef.current.material as THREE.LineBasicMaterial
    if (material) {
      material.opacity = growthProgress * 0.8
      material.needsUpdate = true
    }
  }, [growthProgress])

  // Bioluminescent pulse effect
  useFrame((state) => {
    if (!hyphaeRef.current) return

    const time = state.clock.getElapsedTime()
    const material = hyphaeRef.current.material as THREE.LineBasicMaterial

    if (material && animated) {
      const pulse = Math.sin(time * 2) * 0.5 + 0.5
      const baseCol = new THREE.Color(baseColor)
      const glowCol = new THREE.Color(bioluminescentColor)

      material.color.lerpColors(baseCol, glowCol, pulse * 0.5)
      material.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Main hyphal network */}
      <lineSegments ref={hyphaeRef} geometry={hyphaeGeometry}>
        <lineBasicMaterial
          color={baseColor}
          transparent
          opacity={quality === 'high' ? 0.8 : quality === 'medium' ? 0.6 : 0.4}
          linewidth={quality === 'high' ? 2 : 1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Fusion points (anastomosis) */}
      {fusionGeometry && (
        <lineSegments ref={fusionsRef} geometry={fusionGeometry}>
          <lineBasicMaterial
            color={bioluminescentColor}
            transparent
            opacity={quality === 'high' ? 0.6 : quality === 'medium' ? 0.4 : 0.3}
            linewidth={quality === 'high' ? 3 : 2}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
    </group>
  )
}

/**
 * Animated mycelial growth with time-lapse effect
 */
export function AnimatedMycelialGrowth({
  maxIterations = 6,
  growthInterval = 2000,
  ...props
}: MycelialNetworkProps & {
  maxIterations?: number
  growthInterval?: number
}) {
  const [currentIterations, setCurrentIterations] = useState(1)

  useEffect(() => {
    if (currentIterations >= maxIterations) return

    const timer = setInterval(() => {
      setCurrentIterations(prev => Math.min(prev + 1, maxIterations))
    }, growthInterval)

    return () => clearInterval(timer)
  }, [currentIterations, maxIterations, growthInterval])

  return <MycelialNetwork {...props} iterations={currentIterations} />
}

/**
 * Interactive mycelial growth that responds to cursor
 */
export function InteractiveMycelialGrowth({
  cursorPosition,
  growthRadius = 3,
  ...props
}: MycelialNetworkProps & {
  cursorPosition?: THREE.Vector3
  growthRadius?: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current || !cursorPosition) return

    // Rotate network to "face" cursor
    const direction = new THREE.Vector3()
      .subVectors(cursorPosition, groupRef.current.position)
      .normalize()

    const targetRotation = Math.atan2(direction.x, direction.z)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation,
      0.1
    )
  })

  return (
    <group ref={groupRef}>
      <MycelialNetwork {...props} />
    </group>
  )
}
