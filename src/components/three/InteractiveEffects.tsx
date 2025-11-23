/**
 * Interactive Effects System
 * Mouse trails, electric effects, and bioluminescent interactions
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Electric trail that follows cursor (Crowe Code)
 */
interface ElectricTrailProps {
  color?: string
  segments?: number
  width?: number
  fadeSpeed?: number
  quality?: 'low' | 'medium' | 'high'
}

export function ElectricTrail({
  color = '#00d9ff',
  segments = 50,
  width = 0.1,
  fadeSpeed = 2.0,
  quality = 'high'
}: ElectricTrailProps) {
  const trailRef = useRef<THREE.Line>(null)
  const pointsRef = useRef<THREE.Vector3[]>([])
  const { camera, size, pointer } = useThree()

  const actualSegments = quality === 'low' ? 20 : quality === 'medium' ? 35 : segments

  // Initialize trail points
  useEffect(() => {
    pointsRef.current = Array.from({ length: actualSegments }, () => new THREE.Vector3())
  }, [actualSegments])

  // Trail shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;

        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          // Electric glow effect
          vec3 glowColor = color * (1.0 + vAlpha);
          gl_FragColor = vec4(glowColor, vAlpha * 0.6);
        }
      `,
      uniforms: {
        color: { value: new THREE.Color(color) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [color])

  useFrame((state, delta) => {
    if (!trailRef.current) return

    const points = pointsRef.current

    // Get mouse position in 3D space
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)

    const dir = vector.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    const pos = camera.position.clone().add(dir.multiplyScalar(distance))

    // Add electrical jitter
    pos.x += (Math.random() - 0.5) * 0.1
    pos.y += (Math.random() - 0.5) * 0.1

    // Update trail points
    points.unshift(pos)
    points.pop()

    // Update geometry
    const geometry = trailRef.current.geometry
    geometry.setFromPoints(points)

    // Update alpha attribute for fade
    const alphas = new Float32Array(points.length)
    for (let i = 0; i < points.length; i++) {
      alphas[i] = 1 - i / points.length
    }

    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.attributes.position.needsUpdate = true
  })

  return (
    <line ref={trailRef}>
      <bufferGeometry />
      <primitive object={material} attach="material" />
    </line>
  )
}

/**
 * Bioluminescent trail (Synapse-Code)
 */
interface BioluminescentTrailProps {
  primaryColor?: string
  secondaryColor?: string
  segments?: number
  pulseSpeed?: number
  quality?: 'low' | 'medium' | 'high'
}

export function BioluminescentTrail({
  primaryColor = '#00ffd9',
  secondaryColor = '#ffaa00',
  segments = 40,
  pulseSpeed = 1.5,
  quality = 'high'
}: BioluminescentTrailProps) {
  const trailRef = useRef<THREE.Line>(null)
  const pointsRef = useRef<THREE.Vector3[]>([])
  const particlesRef = useRef<THREE.Points>(null)
  const { camera, pointer } = useThree()

  const actualSegments = quality === 'low' ? 15 : quality === 'medium' ? 25 : segments

  useEffect(() => {
    pointsRef.current = Array.from({ length: actualSegments }, () => new THREE.Vector3())
  }, [actualSegments])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        attribute float pulse;
        varying float vAlpha;
        varying float vPulse;

        void main() {
          vAlpha = alpha;
          vPulse = pulse;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 primaryColor;
        uniform vec3 secondaryColor;
        uniform float time;
        varying float vAlpha;
        varying float vPulse;

        void main() {
          // Bioluminescent pulsing
          float pulse = sin(time * 2.0 + vPulse * 6.28) * 0.5 + 0.5;
          vec3 color = mix(primaryColor, secondaryColor, pulse);

          // Soft organic glow
          float glow = 1.0 + pulse * 0.5;
          gl_FragColor = vec4(color * glow, vAlpha * 0.7);
        }
      `,
      uniforms: {
        primaryColor: { value: new THREE.Color(primaryColor) },
        secondaryColor: { value: new THREE.Color(secondaryColor) },
        time: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending
    })
  }, [primaryColor, secondaryColor])

  // Particle system for spore-like trail
  const particleGeometry = useMemo(() => {
    const positions = new Float32Array(actualSegments * 3)
    const sizes = new Float32Array(actualSegments)

    for (let i = 0; i < actualSegments; i++) {
      sizes[i] = Math.random() * 0.1 + 0.05
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geometry
  }, [actualSegments])

  useFrame((state, delta) => {
    if (!trailRef.current) return

    const points = pointsRef.current

    // Get mouse position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)

    const dir = vector.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    const pos = camera.position.clone().add(dir.multiplyScalar(distance))

    // Organic movement (less jittery than electric)
    pos.x += Math.sin(state.clock.elapsedTime * 3) * 0.02
    pos.y += Math.cos(state.clock.elapsedTime * 2) * 0.02

    // Update trail
    points.unshift(pos)
    points.pop()

    // Update geometry
    const geometry = trailRef.current.geometry
    geometry.setFromPoints(points)

    // Update attributes
    const alphas = new Float32Array(points.length)
    const pulses = new Float32Array(points.length)

    for (let i = 0; i < points.length; i++) {
      alphas[i] = 1 - i / points.length
      pulses[i] = i / points.length
    }

    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('pulse', new THREE.BufferAttribute(pulses, 1))
    geometry.attributes.position.needsUpdate = true

    // Update time uniform
    material.uniforms.time.value = state.clock.elapsedTime * pulseSpeed

    // Update particle positions
    if (particlesRef.current) {
      const particlePositions = particleGeometry.attributes.position.array as Float32Array

      points.forEach((point, i) => {
        if (i % 2 === 0) {
          const index = i / 2
          particlePositions[index * 3] = point.x
          particlePositions[index * 3 + 1] = point.y
          particlePositions[index * 3 + 2] = point.z
        }
      })

      particleGeometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      <line ref={trailRef}>
        <bufferGeometry />
        <primitive object={material} attach="material" />
      </line>

      {quality !== 'low' && (
        <points ref={particlesRef}>
          <primitive object={particleGeometry} attach="geometry" />
          <pointsMaterial
            size={0.05}
            color={primaryColor}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  )
}

/**
 * Interactive hover glow effect
 */
interface HoverGlowProps {
  color?: string
  intensity?: number
  radius?: number
  platform?: 'crowe' | 'synapse'
}

export function HoverGlow({
  color = '#00d9ff',
  intensity = 2.0,
  radius = 1.0,
  platform = 'crowe'
}: HoverGlowProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const { camera, pointer } = useThree()

  useFrame((state) => {
    if (!lightRef.current) return

    // Get mouse position in 3D space
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)

    const dir = vector.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    const pos = camera.position.clone().add(dir.multiplyScalar(distance))

    // Smooth follow
    lightRef.current.position.lerp(pos, 0.1)

    // Pulsing intensity
    if (platform === 'synapse') {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
      lightRef.current.intensity = intensity * pulse
    }
  })

  return (
    <>
      <pointLight ref={lightRef} color={color} intensity={intensity} distance={radius * 5} />

      {/* Visible glow sphere */}
      <mesh position={lightRef.current?.position}>
        <sphereGeometry args={[radius * 0.1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  )
}

/**
 * Click ripple effect
 */
interface ClickRippleProps {
  color?: string
  maxRadius?: number
  duration?: number
  platform?: 'crowe' | 'synapse'
}

export function ClickRipple({
  color = '#00d9ff',
  maxRadius = 2,
  duration = 1.5,
  platform = 'crowe'
}: ClickRippleProps) {
  const ripplesRef = useRef<Array<{
    position: THREE.Vector3
    startTime: number
    id: number
  }>>([])

  const meshesRef = useRef<THREE.Group>(null)
  const { camera, pointer } = useThree()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Get 3D position from click
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1

      const vector = new THREE.Vector3(x, y, 0.5)
      vector.unproject(camera)

      const dir = vector.sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const pos = camera.position.clone().add(dir.multiplyScalar(distance))

      ripplesRef.current.push({
        position: pos,
        startTime: Date.now(),
        id: Math.random()
      })
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [camera])

  useFrame((state) => {
    if (!meshesRef.current) return

    const now = Date.now()

    // Remove old ripples
    ripplesRef.current = ripplesRef.current.filter(
      (ripple) => now - ripple.startTime < duration * 1000
    )

    // Update ripple meshes
    meshesRef.current.children = []

    ripplesRef.current.forEach((ripple) => {
      const elapsed = (now - ripple.startTime) / 1000
      const progress = elapsed / duration

      const radius = maxRadius * progress
      const opacity = 1 - progress

      // Platform-specific appearance
      if (platform === 'crowe') {
        // Electric ring
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius * 0.95, radius, 32),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: opacity * 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
          })
        )

        ring.position.copy(ripple.position)
        ring.lookAt(camera.position)
        meshesRef.current!.add(ring)
      } else {
        // Organic pulse
        const circle = new THREE.Mesh(
          new THREE.CircleGeometry(radius, 32),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: opacity * 0.3,
            blending: THREE.AdditiveBlending
          })
        )

        circle.position.copy(ripple.position)
        circle.lookAt(camera.position)
        meshesRef.current!.add(circle)
      }
    })
  })

  return <group ref={meshesRef} />
}

/**
 * Cursor attraction field (objects drawn to cursor)
 */
interface CursorAttractionProps {
  strength?: number
  radius?: number
  enabled?: boolean
}

export function CursorAttraction({
  strength = 0.5,
  radius = 5,
  enabled = true
}: CursorAttractionProps) {
  const attractionPoint = useRef(new THREE.Vector3())
  const { camera, pointer } = useThree()

  useFrame(() => {
    if (!enabled) return

    // Update attraction point
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)

    const dir = vector.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    attractionPoint.current = camera.position.clone().add(dir.multiplyScalar(distance))
  })

  // This would be used by other components via context or ref
  return null
}

/**
 * Combined interactive effects for platform
 */
interface InteractivePlatformEffectsProps {
  platform: 'crowe' | 'synapse'
  quality?: 'low' | 'medium' | 'high'
  showTrail?: boolean
  showHoverGlow?: boolean
  showClickRipple?: boolean
}

export function InteractivePlatformEffects({
  platform,
  quality = 'high',
  showTrail = true,
  showHoverGlow = true,
  showClickRipple = true
}: InteractivePlatformEffectsProps) {
  const croweColor = '#00d9ff'
  const synapseColor = '#00ffd9'
  const synapseSecondary = '#ffaa00'

  return (
    <group>
      {showTrail && platform === 'crowe' && (
        <ElectricTrail color={croweColor} quality={quality} />
      )}

      {showTrail && platform === 'synapse' && (
        <BioluminescentTrail
          primaryColor={synapseColor}
          secondaryColor={synapseSecondary}
          quality={quality}
        />
      )}

      {showHoverGlow && (
        <HoverGlow
          color={platform === 'crowe' ? croweColor : synapseColor}
          platform={platform}
        />
      )}

      {showClickRipple && (
        <ClickRipple
          color={platform === 'crowe' ? croweColor : synapseColor}
          platform={platform}
        />
      )}
    </group>
  )
}
