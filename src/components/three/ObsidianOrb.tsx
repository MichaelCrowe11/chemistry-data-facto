/**
 * Obsidian Orb Component
 * Central focal point for Crowe Code with obsidian glass material
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  obsidianGlassVertexShader,
  obsidianGlassFragmentShader,
  obsidianGlassMaterialConfig
} from '@/shaders/obsidianGlass'

interface ObsidianOrbProps {
  radius?: number
  segments?: number
  electricColor?: string
  rotation?: boolean
  rotationSpeed?: number
  pulseSpeed?: number
  quality?: 'low' | 'medium' | 'high'
  interactiveHover?: boolean
}

export function ObsidianOrb({
  radius = 2,
  segments = 64,
  electricColor = '#00d9ff',
  rotation = true,
  rotationSpeed = 0.2,
  pulseSpeed = 1.0,
  quality = 'high',
  interactiveHover = true
}: ObsidianOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Quality-based segments
  const actualSegments = useMemo(() => {
    switch (quality) {
      case 'low': return 32
      case 'medium': return 48
      case 'high': return segments
    }
  }, [quality, segments])

  // Create environment map for reflections
  const envMap = useMemo(() => {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256)
    const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
    return cubeRenderTarget.texture
  }, [])

  // Create noise texture for organic patterns
  const noiseTexture = useMemo(() => {
    const size = 128
    const data = new Uint8Array(size * size * 4)

    for (let i = 0; i < size * size; i++) {
      const stride = i * 4
      const noise = Math.random() * 255
      data[stride] = noise
      data[stride + 1] = noise
      data[stride + 2] = noise
      data[stride + 3] = 255
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    texture.needsUpdate = true
    return texture
  }, [])

  // Shader material
  const material = useMemo(() => {
    const electricCol = new THREE.Color(electricColor)

    return new THREE.ShaderMaterial({
      vertexShader: obsidianGlassVertexShader,
      fragmentShader: obsidianGlassFragmentShader,
      uniforms: {
        envMap: { value: envMap },
        noiseTexture: { value: noiseTexture },
        time: { value: 0 },
        cameraPosition: { value: new THREE.Vector3() },
        lightPosition: { value: new THREE.Vector3(10, 10, 10) },
        electricColor: { value: electricCol },
        reflectivity: { value: obsidianGlassMaterialConfig.reflectivity },
        circuitDensity: { value: obsidianGlassMaterialConfig.circuitDensity },
        mousePosition: { value: new THREE.Vector2(0, 0) }
      },
      transparent: true,
      side: THREE.DoubleSide
    })
  }, [envMap, noiseTexture, electricColor])

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return

    // Update time uniform
    materialRef.current.uniforms.time.value = state.clock.elapsedTime * pulseSpeed

    // Update camera position
    materialRef.current.uniforms.cameraPosition.value.copy(state.camera.position)

    // Rotation
    if (rotation) {
      meshRef.current.rotation.y += delta * rotationSpeed
      meshRef.current.rotation.x += delta * rotationSpeed * 0.5
    }

    // Pulsing scale
    const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.05 + 1
    meshRef.current.scale.setScalar(pulse)

    // Interactive hover effect
    if (interactiveHover) {
      const mouse = state.pointer
      materialRef.current.uniforms.mousePosition.value.set(mouse.x, mouse.y)
    }
  })

  return (
    <group>
      {/* Main obsidian sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[radius, actualSegments]} />
        <primitive object={material} ref={materialRef} attach="material" />
      </mesh>

      {/* Inner glow core */}
      <mesh scale={0.6}>
        <sphereGeometry args={[radius * 0.5, 32, 32]} />
        <meshBasicMaterial
          color={electricColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Electric rings */}
      <ElectricRings
        radius={radius * 1.2}
        color={electricColor}
        count={3}
        speed={rotationSpeed}
      />

      {/* Particle corona */}
      <OrbCorona
        radius={radius * 1.5}
        particleCount={quality === 'high' ? 200 : quality === 'medium' ? 100 : 50}
        color={electricColor}
      />
    </group>
  )
}

/**
 * Electric rings orbiting the orb
 */
interface ElectricRingsProps {
  radius: number
  color: string
  count: number
  speed: number
}

function ElectricRings({ radius, color, count, speed }: ElectricRingsProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.y += delta * speed * (1 + i * 0.3)
      ring.rotation.x += delta * speed * 0.5 * (1 + i * 0.2)
    })
  })

  const rings = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const ringRadius = radius + i * 0.3
      const tubeRadius = 0.02 + i * 0.01

      return (
        <mesh key={i} rotation={[Math.PI / 2, 0, (Math.PI / count) * i]}>
          <torusGeometry args={[ringRadius, tubeRadius, 8, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6 - i * 0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )
    })
  }, [count, radius, color])

  return <group ref={groupRef}>{rings}</group>
}

/**
 * Particle corona around the orb
 */
interface OrbCoronaProps {
  radius: number
  particleCount: number
  color: string
}

function OrbCorona({ radius, particleCount, color }: OrbCoronaProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      // Random position on sphere surface
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Random orbital velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }

    return { positions, velocities }
  }, [particleCount, radius])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      // Update positions with velocities
      posArray[i * 3] += velocities[i * 3] * delta * 10
      posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10
      posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10

      // Keep particles on sphere surface
      const x = posArray[i * 3]
      const y = posArray[i * 3 + 1]
      const z = posArray[i * 3 + 2]
      const dist = Math.sqrt(x * x + y * y + z * z)

      if (dist > 0) {
        posArray[i * 3] = (x / dist) * radius
        posArray[i * 3 + 1] = (y / dist) * radius
        posArray[i * 3 + 2] = (z / dist) * radius
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/**
 * Pre-configured variants
 */

export function CroweCodeOrb(props: Partial<ObsidianOrbProps>) {
  return (
    <ObsidianOrb
      electricColor="#00d9ff"
      radius={2}
      rotationSpeed={0.2}
      {...props}
    />
  )
}

export function StaticObsidianOrb(props: Partial<ObsidianOrbProps>) {
  return (
    <ObsidianOrb
      rotation={false}
      interactiveHover={false}
      {...props}
    />
  )
}

export function MiniObsidianOrb(props: Partial<ObsidianOrbProps>) {
  return (
    <ObsidianOrb
      radius={0.5}
      segments={32}
      quality="medium"
      {...props}
    />
  )
}
