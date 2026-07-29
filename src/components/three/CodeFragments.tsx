/**
 * Code Fragment System
 * Holographic code particles that float and reassemble for Crowe Code
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CodeFragment {
  position: THREE.Vector3
  velocity: THREE.Vector3
  character: string
  size: number
  opacity: number
  color: THREE.Color
  targetPosition?: THREE.Vector3
  lifetime: number
  age: number
}

interface CodeFragmentsProps {
  count?: number
  codeSnippet?: string
  color?: string
  emissionRate?: number
  particleSize?: number
  quality?: 'low' | 'medium' | 'high'
  mode?: 'float' | 'assemble' | 'explode' | 'matrix'
  speed?: number
}

export function CodeFragments({
  count = 500,
  codeSnippet = `function transform(data) {\n  return data.map(x => x * 2)\n}`,
  color = '#00d9ff',
  emissionRate = 50,
  particleSize = 0.1,
  quality = 'high',
  mode = 'float',
  speed = 1.0
}: CodeFragmentsProps) {
  const fragmentsRef = useRef<CodeFragment[]>([])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Quality settings
  const actualCount = useMemo(() => {
    switch (quality) {
      case 'low': return Math.min(count, 100)
      case 'medium': return Math.min(count, 300)
      case 'high': return count
    }
  }, [quality, count])

  // Parse code snippet into character array
  const characters = useMemo(() => {
    return codeSnippet.split('').filter(c => c.trim().length > 0 || c === ' ')
  }, [codeSnippet])

  // Initialize fragments
  useEffect(() => {
    const fragments: CodeFragment[] = []
    const baseColor = new THREE.Color(color)

    for (let i = 0; i < actualCount; i++) {
      const char = characters[i % characters.length]

      let position: THREE.Vector3
      let velocity: THREE.Vector3
      let targetPosition: THREE.Vector3 | undefined

      switch (mode) {
        case 'float':
          position = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          )
          velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
          )
          break

        case 'assemble':
          // Start scattered, move to grid
          position = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          )
          const row = Math.floor(i / 40)
          const col = i % 40
          targetPosition = new THREE.Vector3(
            (col - 20) * 0.3,
            (row - 10) * 0.5,
            0
          )
          velocity = new THREE.Vector3(0, 0, 0)
          break

        case 'explode':
          // Start centered, explode outward
          position = new THREE.Vector3(0, 0, 0)
          const theta = Math.random() * Math.PI * 2
          const phi = Math.random() * Math.PI
          velocity = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * 2,
            Math.sin(phi) * Math.sin(theta) * 2,
            Math.cos(phi) * 2
          )
          break

        case 'matrix':
          // Matrix rain effect
          position = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            10 + Math.random() * 5,
            (Math.random() - 0.5) * 10
          )
          velocity = new THREE.Vector3(0, -2 - Math.random() * 2, 0)
          break
      }

      fragments.push({
        position,
        velocity,
        character: char,
        size: particleSize * (0.8 + Math.random() * 0.4),
        opacity: Math.random() * 0.5 + 0.5,
        color: baseColor.clone(),
        targetPosition,
        lifetime: 10 + Math.random() * 10,
        age: 0
      })
    }

    fragmentsRef.current = fragments
  }, [actualCount, mode, characters, color, particleSize])

  // Create geometry and material
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 customColor;

        varying float vOpacity;
        varying vec3 vColor;

        void main() {
          vOpacity = opacity;
          vColor = customColor;

          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform sampler2D characterTexture;

        varying float vOpacity;
        varying vec3 vColor;

        void main() {
          // Holographic effect
          vec2 uv = gl_PointCoord;
          float dist = length(uv - 0.5);

          // Soft circular glow
          float alpha = smoothstep(0.5, 0.3, dist);
          alpha *= vOpacity;

          // Holographic scan lines
          float scanline = sin(uv.y * 30.0) * 0.1 + 0.9;

          // Edge glow
          float edge = smoothstep(0.5, 0.45, dist);
          vec3 glowColor = vColor * 1.5;

          vec3 finalColor = mix(vColor, glowColor, edge) * scanline;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      uniforms: {
        characterTexture: { value: null }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [])

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const fragments = fragmentsRef.current
    const matrix = new THREE.Matrix4()
    const baseColor = new THREE.Color(color)

    fragments.forEach((fragment, i) => {
      // Update age
      fragment.age += delta

      // Reset if lifetime exceeded
      if (fragment.age > fragment.lifetime) {
        fragment.age = 0
        if (mode === 'matrix') {
          fragment.position.y = 10 + Math.random() * 5
          fragment.position.x = (Math.random() - 0.5) * 20
        }
      }

      // Update based on mode
      switch (mode) {
        case 'float':
          // Brownian motion
          fragment.velocity.add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.01
            )
          )
          fragment.velocity.multiplyScalar(0.98) // Damping
          fragment.position.add(fragment.velocity.clone().multiplyScalar(delta * speed))

          // Boundary wrap
          if (Math.abs(fragment.position.x) > 10) fragment.position.x *= -0.9
          if (Math.abs(fragment.position.y) > 10) fragment.position.y *= -0.9
          if (Math.abs(fragment.position.z) > 10) fragment.position.z *= -0.9
          break

        case 'assemble':
          // Move towards target position
          if (fragment.targetPosition) {
            const toTarget = fragment.targetPosition.clone().sub(fragment.position)
            const distance = toTarget.length()

            if (distance > 0.01) {
              fragment.velocity.lerp(toTarget.multiplyScalar(0.1), 0.1)
              fragment.position.add(fragment.velocity.clone().multiplyScalar(delta * speed))
            }
          }
          break

        case 'explode':
          // Explode outward with gravity
          fragment.velocity.y -= delta * 0.5 // Gravity
          fragment.position.add(fragment.velocity.clone().multiplyScalar(delta * speed))
          fragment.opacity = Math.max(0, fragment.opacity - delta * 0.1)
          break

        case 'matrix':
          // Fall down
          fragment.position.add(fragment.velocity.clone().multiplyScalar(delta * speed))

          // Fade based on Y position
          fragment.opacity = THREE.MathUtils.clamp(
            (fragment.position.y + 10) / 15,
            0,
            1
          )
          break
      }

      // Pulsing glow
      const pulse = Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.3 + 0.7
      fragment.color.copy(baseColor).multiplyScalar(pulse)

      // Update instance matrix
      matrix.setPosition(fragment.position)
      meshRef.current!.setMatrixAt(i, matrix)

      // Update custom attributes (would need to be set up properly)
      // For now, color will be controlled by shader uniform
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, actualCount]}
      frustumCulled={false}
    >
      <primitive object={material} ref={materialRef} attach="material" />
    </instancedMesh>
  )
}

/**
 * Pre-configured variants
 */

export function FloatingCodeFragments(props: Partial<CodeFragmentsProps>) {
  return <CodeFragments mode="float" {...props} />
}

export function AssemblingCode(props: Partial<CodeFragmentsProps>) {
  return (
    <CodeFragments
      mode="assemble"
      codeSnippet={props.codeSnippet || "const magic = await synthesize(intent)"}
      {...props}
    />
  )
}

export function ExplodingCode(props: Partial<CodeFragmentsProps>) {
  return <CodeFragments mode="explode" count={200} {...props} />
}

export function MatrixRain(props: Partial<CodeFragmentsProps>) {
  return (
    <CodeFragments
      mode="matrix"
      count={300}
      color="#00ff00"
      codeSnippet="01010110100101001010101"
      {...props}
    />
  )
}

/**
 * Advanced variant with text rendering
 * Uses canvas textures for actual character rendering
 */
export function TexturedCodeFragments({
  text = "function transform() { }",
  fontSize = 32,
  ...props
}: CodeFragmentsProps & { text?: string; fontSize?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    ctx.font = `${fontSize}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Create texture atlas of characters
    const chars = text.split('')
    chars.forEach((char, i) => {
      const x = (i % 8) * 8
      const y = Math.floor(i / 8) * 8
      ctx.fillText(char, x + 4, y + 4)
    })

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [text, fontSize])

  return <CodeFragments codeSnippet={text} {...props} />
}
