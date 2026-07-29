/**
 * Spore Particle System
 * Bioluminescent spores for Synapse-Code with organic movement
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Spore {
  position: THREE.Vector3
  velocity: THREE.Vector3
  size: number
  opacity: number
  color: THREE.Color
  pulsePhase: number
  pulseSpeed: number
  lifetime: number
  age: number
  trail: THREE.Vector3[]
}

interface SporeSystemProps {
  count?: number
  emissionPoint?: THREE.Vector3
  emissionRadius?: number
  bioluminescentColor?: string
  amberColor?: string
  sporeSize?: number
  quality?: 'low' | 'medium' | 'high'
  mode?: 'drift' | 'burst' | 'swarm' | 'release'
  windStrength?: number
  trailLength?: number
}

export function SporeSystem({
  count = 300,
  emissionPoint = new THREE.Vector3(0, 0, 0),
  emissionRadius = 2,
  bioluminescentColor = '#00ffd9',
  amberColor = '#ffaa00',
  sporeSize = 0.08,
  quality = 'high',
  mode = 'drift',
  windStrength = 0.5,
  trailLength = 10
}: SporeSystemProps) {
  const sporesRef = useRef<Spore[]>([])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const trailsRef = useRef<THREE.Line[]>([])

  // Quality settings
  const actualCount = useMemo(() => {
    switch (quality) {
      case 'low': return Math.min(count, 50)
      case 'medium': return Math.min(count, 150)
      case 'high': return count
    }
  }, [quality, count])

  const showTrails = quality !== 'low'

  // Initialize spores
  useEffect(() => {
    const spores: Spore[] = []
    const bioColor = new THREE.Color(bioluminescentColor)
    const ambColor = new THREE.Color(amberColor)

    for (let i = 0; i < actualCount; i++) {
      let position: THREE.Vector3
      let velocity: THREE.Vector3

      switch (mode) {
        case 'drift':
          // Random position in sphere
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          const r = emissionRadius * Math.cbrt(Math.random())

          position = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          ).add(emissionPoint)

          velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.1
          )
          break

        case 'burst':
          // Start at center, burst outward
          position = emissionPoint.clone()
          const burstTheta = Math.random() * Math.PI * 2
          const burstPhi = Math.acos(2 * Math.random() - 1)
          velocity = new THREE.Vector3(
            Math.sin(burstPhi) * Math.cos(burstTheta) * 3,
            Math.sin(burstPhi) * Math.sin(burstTheta) * 3,
            Math.cos(burstPhi) * 3
          )
          break

        case 'swarm':
          // Clustered movement
          position = new THREE.Vector3(
            (Math.random() - 0.5) * emissionRadius * 2,
            (Math.random() - 0.5) * emissionRadius * 2,
            (Math.random() - 0.5) * emissionRadius * 2
          ).add(emissionPoint)

          velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
          )
          break

        case 'release':
          // Floating upward release
          position = new THREE.Vector3(
            (Math.random() - 0.5) * emissionRadius,
            -emissionRadius,
            (Math.random() - 0.5) * emissionRadius
          ).add(emissionPoint)

          velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            0.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.05
          )
          break
      }

      // Color variation between bioluminescent and amber
      const colorMix = Math.random()
      const color = bioColor.clone().lerp(ambColor, colorMix)

      spores.push({
        position,
        velocity,
        size: sporeSize * (0.6 + Math.random() * 0.8),
        opacity: 0.5 + Math.random() * 0.5,
        color,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        lifetime: 15 + Math.random() * 10,
        age: Math.random() * 5, // Stagger start times
        trail: []
      })
    }

    sporesRef.current = spores
  }, [actualCount, mode, emissionPoint, emissionRadius, bioluminescentColor, amberColor, sporeSize])

  // Create geometry
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })
  }, [])

  // Perlin noise approximation for organic movement
  const noise3D = (x: number, y: number, z: number, time: number): THREE.Vector3 => {
    return new THREE.Vector3(
      Math.sin(x * 2.4 + time) * Math.cos(y * 3.1) * Math.sin(z * 1.7),
      Math.cos(x * 1.9 + time) * Math.sin(y * 2.3) * Math.cos(z * 2.8),
      Math.sin(x * 3.2) * Math.cos(y * 1.6 + time) * Math.sin(z * 2.1)
    )
  }

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const spores = sporesRef.current
    const matrix = new THREE.Matrix4()
    const scale = new THREE.Vector3()
    const time = state.clock.elapsedTime

    spores.forEach((spore, i) => {
      // Update age
      spore.age += delta

      // Reset if lifetime exceeded
      if (spore.age > spore.lifetime) {
        spore.age = 0
        spore.position.copy(emissionPoint)

        if (mode === 'release') {
          spore.position.y -= emissionRadius
        }
      }

      // Organic noise-based movement
      const noiseForce = noise3D(
        spore.position.x * 0.5,
        spore.position.y * 0.5,
        spore.position.z * 0.5,
        time * 0.5
      ).multiplyScalar(0.02)

      // Wind force
      const wind = new THREE.Vector3(
        Math.sin(time * 0.3) * windStrength,
        0,
        Math.cos(time * 0.2) * windStrength
      ).multiplyScalar(0.01)

      // Apply forces
      spore.velocity.add(noiseForce)
      spore.velocity.add(wind)

      // Mode-specific behaviors
      switch (mode) {
        case 'drift':
          // Gentle upward drift
          spore.velocity.y += 0.005
          break

        case 'burst':
          // Gravity after burst
          spore.velocity.y -= delta * 0.3
          break

        case 'swarm':
          // Swarm cohesion - move towards center of mass
          const toCenter = emissionPoint.clone().sub(spore.position)
          const distance = toCenter.length()
          if (distance > emissionRadius * 1.5) {
            spore.velocity.add(toCenter.normalize().multiplyScalar(0.01))
          }

          // Separation - avoid other spores (simplified)
          if (i % 5 === 0 && i > 0) {
            const neighbor = spores[i - 1]
            const toNeighbor = spore.position.clone().sub(neighbor.position)
            if (toNeighbor.length() < 0.3) {
              spore.velocity.add(toNeighbor.normalize().multiplyScalar(0.02))
            }
          }
          break

        case 'release':
          // Continue upward
          spore.velocity.y = Math.max(spore.velocity.y, 0.3)
          break
      }

      // Damping
      spore.velocity.multiplyScalar(0.98)

      // Update position
      spore.position.add(spore.velocity.clone().multiplyScalar(delta * 10))

      // Update trail
      if (showTrails) {
        spore.trail.push(spore.position.clone())
        if (spore.trail.length > trailLength) {
          spore.trail.shift()
        }
      }

      // Pulsing bioluminescence
      const pulse = Math.sin(time * spore.pulseSpeed + spore.pulsePhase) * 0.5 + 0.5
      const currentOpacity = spore.opacity * pulse

      // Age-based fade
      let ageFade = 1.0
      if (spore.age < 0.5) {
        ageFade = spore.age / 0.5 // Fade in
      } else if (spore.age > spore.lifetime - 1) {
        ageFade = (spore.lifetime - spore.age) / 1 // Fade out
      }

      // Pulsing scale
      const pulseScale = 1.0 + pulse * 0.3
      scale.setScalar(spore.size * pulseScale)

      // Update instance matrix
      matrix.compose(spore.position, new THREE.Quaternion(), scale)
      meshRef.current!.setMatrixAt(i, matrix)

      // Update color (would need custom shader for per-instance colors)
      // For now, we'll use a single pulsing material
    })

    meshRef.current.instanceMatrix.needsUpdate = true

    // Pulse the overall material color
    const avgPulse = Math.sin(time * 1.5) * 0.5 + 0.5
    const bioColor = new THREE.Color(bioluminescentColor)
    const ambColor = new THREE.Color(amberColor)
    material.color.lerpColors(bioColor, ambColor, avgPulse)
    material.opacity = 0.6 + avgPulse * 0.3
  })

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, actualCount]}
        frustumCulled={false}
      />

      {/* Spore trails */}
      {showTrails && <SporeTrails spores={sporesRef.current} color={bioluminescentColor} />}

      {/* Ambient glow */}
      <mesh position={emissionPoint}>
        <sphereGeometry args={[emissionRadius * 1.5, 32, 32]} />
        <meshBasicMaterial
          color={bioluminescentColor}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

/**
 * Spore trails visualization
 */
interface SporeTrailsProps {
  spores: Spore[]
  color: string
}

function SporeTrails({ spores, color }: SporeTrailsProps) {
  const trailColor = new THREE.Color(color)

  const trails = useMemo(() => {
    return spores.map((spore, i) => {
      if (spore.trail.length < 2) return null

      const points = spore.trail
      const geometry = new THREE.BufferGeometry().setFromPoints(points)

      return (
        <line key={i}>
          <primitive object={geometry} attach="geometry" />
          <lineBasicMaterial
            color={trailColor}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </line>
      )
    })
  }, [spores, trailColor])

  return <>{trails}</>
}

/**
 * Pre-configured variants
 */

export function DriftingSpores(props: Partial<SporeSystemProps>) {
  return <SporeSystem mode="drift" count={200} {...props} />
}

export function SporeRelease(props: Partial<SporeSystemProps>) {
  return (
    <SporeSystem
      mode="release"
      count={150}
      emissionRadius={3}
      windStrength={0.3}
      {...props}
    />
  )
}

export function SporeSwarm(props: Partial<SporeSystemProps>) {
  return (
    <SporeSystem
      mode="swarm"
      count={300}
      emissionRadius={4}
      windStrength={0.2}
      {...props}
    />
  )
}

export function SporeBurst(props: Partial<SporeSystemProps>) {
  return (
    <SporeSystem
      mode="burst"
      count={100}
      emissionRadius={1}
      {...props}
    />
  )
}

/**
 * Mycelial fruiting body that releases spores
 */
export function FruitingBody({
  position = new THREE.Vector3(0, 0, 0),
  size = 1,
  releaseInterval = 2
}: {
  position?: THREE.Vector3
  size?: number
  releaseInterval?: number
}) {
  const sporeEmissionRef = useRef(0)

  useFrame((state, delta) => {
    sporeEmissionRef.current += delta
  })

  return (
    <group position={position}>
      {/* Fruiting body structure */}
      <mesh>
        <capsuleGeometry args={[size * 0.3, size, 8, 16]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ff6600"
          emissiveIntensity={0.3}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Cap */}
      <mesh position={[0, size * 0.7, 0]}>
        <sphereGeometry args={[size * 0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#cc7700"
          emissive="#ff6600"
          emissiveIntensity={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* Spore release */}
      <SporeRelease
        emissionPoint={position.clone().add(new THREE.Vector3(0, size, 0))}
        emissionRadius={size * 0.5}
        count={50}
        sporeSize={0.05}
      />
    </group>
  )
}
