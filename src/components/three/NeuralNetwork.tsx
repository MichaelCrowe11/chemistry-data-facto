/**
 * Neural Network Visualization
 * Advanced 3D neural network with signal propagation
 * For Crowe Code cinematic experience
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface NeuralNode {
  id: string
  position: THREE.Vector3
  activation: number
  connections: string[]
  layer: number
}

interface NeuralNetworkProps {
  nodeCount?: number
  layers?: number
  signalSpeed?: number
  activeColor?: string
  inactiveColor?: string
  quality?: 'low' | 'medium' | 'high'
}

export function NeuralNetwork({
  nodeCount = 100,
  layers = 5,
  signalSpeed = 1.0,
  activeColor = '#00d9ff',
  inactiveColor = '#4b00ff',
  quality = 'high'
}: NeuralNetworkProps) {
  const nodesRef = useRef<THREE.Points>(null)
  const connectionsRef = useRef<THREE.LineSegments>(null)
  const signalsRef = useRef<Map<string, number>>(new Map())

  // Generate neural network structure
  const network = useMemo(() => {
    const nodes: NeuralNode[] = []
    const nodesPerLayer = Math.ceil(nodeCount / layers)

    // Create layered structure
    for (let layer = 0; layer < layers; layer++) {
      const layerNodes = layer === 0 || layer === layers - 1
        ? Math.ceil(nodesPerLayer * 0.6) // Smaller input/output layers
        : nodesPerLayer

      for (let i = 0; i < layerNodes; i++) {
        const angle = (i / layerNodes) * Math.PI * 2
        const radius = 3 + Math.random() * 2
        const layerSpacing = 4

        nodes.push({
          id: `node-${layer}-${i}`,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            (layer - layers / 2) * layerSpacing,
            Math.sin(angle) * radius
          ),
          activation: 0,
          connections: [],
          layer
        })
      }
    }

    // Create connections between layers
    for (let layer = 0; layer < layers - 1; layer++) {
      const currentLayer = nodes.filter(n => n.layer === layer)
      const nextLayer = nodes.filter(n => n.layer === layer + 1)

      currentLayer.forEach(node => {
        // Connect to 2-4 nodes in next layer
        const connectionCount = 2 + Math.floor(Math.random() * 3)
        const shuffled = [...nextLayer].sort(() => Math.random() - 0.5)

        for (let i = 0; i < Math.min(connectionCount, shuffled.length); i++) {
          node.connections.push(shuffled[i].id)
        }
      })
    }

    return nodes
  }, [nodeCount, layers])

  // Create geometries
  const { nodeGeometry, connectionGeometry } = useMemo(() => {
    const nodePositions = new Float32Array(network.length * 3)
    const nodeColors = new Float32Array(network.length * 3)
    const nodeSizes = new Float32Array(network.length)

    network.forEach((node, i) => {
      nodePositions[i * 3] = node.position.x
      nodePositions[i * 3 + 1] = node.position.y
      nodePositions[i * 3 + 2] = node.position.z

      const color = new THREE.Color(inactiveColor)
      nodeColors[i * 3] = color.r
      nodeColors[i * 3 + 1] = color.g
      nodeColors[i * 3 + 2] = color.b

      nodeSizes[i] = 0.1 + Math.random() * 0.2
    })

    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3))
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(nodeSizes, 1))

    // Create connections
    const connectionPoints: number[] = []
    network.forEach(node => {
      node.connections.forEach(targetId => {
        const target = network.find(n => n.id === targetId)
        if (target) {
          connectionPoints.push(
            node.position.x, node.position.y, node.position.z,
            target.position.x, target.position.y, target.position.z
          )
        }
      })
    })

    const connectionGeo = new THREE.BufferGeometry()
    connectionGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(connectionPoints), 3)
    )

    return { nodeGeometry: nodeGeo, connectionGeometry: connectionGeo }
  }, [network, inactiveColor])

  // Initiate random signals
  useEffect(() => {
    const interval = setInterval(() => {
      const inputNodes = network.filter(n => n.layer === 0)
      const randomNode = inputNodes[Math.floor(Math.random() * inputNodes.length)]
      if (randomNode) {
        signalsRef.current.set(randomNode.id, 0)
      }
    }, 1000 / signalSpeed)

    return () => clearInterval(interval)
  }, [network, signalSpeed])

  // Animation loop
  useFrame((state, delta) => {
    if (!nodesRef.current) return

    const time = state.clock.getElapsedTime()
    const colors = nodeGeometry.attributes.color.array as Float32Array
    const activeCol = new THREE.Color(activeColor)
    const inactiveCol = new THREE.Color(inactiveColor)

    // Update signal propagation
    const newSignals = new Map<string, number>()

    signalsRef.current.forEach((progress, nodeId) => {
      const node = network.find(n => n.id === nodeId)
      if (!node) return

      const newProgress = progress + delta * signalSpeed

      if (newProgress < 1.0) {
        // Signal still traveling
        newSignals.set(nodeId, newProgress)

        // Update node color
        const nodeIndex = network.indexOf(node)
        const activation = Math.sin(newProgress * Math.PI)
        const color = inactiveCol.clone().lerp(activeCol, activation)

        colors[nodeIndex * 3] = color.r
        colors[nodeIndex * 3 + 1] = color.g
        colors[nodeIndex * 3 + 2] = color.b
      } else {
        // Signal reached, propagate to connections
        node.connections.forEach(targetId => {
          if (!newSignals.has(targetId)) {
            newSignals.set(targetId, 0)
          }
        })
      }
    })

    signalsRef.current = newSignals

    // Decay inactive nodes
    network.forEach((node, i) => {
      if (!signalsRef.current.has(node.id)) {
        colors[i * 3] = THREE.MathUtils.lerp(colors[i * 3], inactiveCol.r, delta * 2)
        colors[i * 3 + 1] = THREE.MathUtils.lerp(colors[i * 3 + 1], inactiveCol.g, delta * 2)
        colors[i * 3 + 2] = THREE.MathUtils.lerp(colors[i * 3 + 2], inactiveCol.b, delta * 2)
      }
    })

    nodeGeometry.attributes.color.needsUpdate = true

    // Gentle rotation
    if (nodesRef.current) {
      nodesRef.current.rotation.y = time * 0.05
    }
  })

  return (
    <group>
      {/* Neural nodes */}
      <points ref={nodesRef} geometry={nodeGeometry}>
        <pointsMaterial
          size={quality === 'high' ? 0.2 : quality === 'medium' ? 0.15 : 0.1}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connections */}
      <lineSegments ref={connectionsRef} geometry={connectionGeometry}>
        <lineBasicMaterial
          color={inactiveColor}
          transparent
          opacity={quality === 'high' ? 0.3 : quality === 'medium' ? 0.2 : 0.1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}

// Shader-based neural pathway for connections
export const neuralPathwayVertexShader = `
attribute vec3 target;
attribute float signal;
uniform float time;
varying float vSignal;

void main() {
  // Bezier curve for connection paths
  vec3 control = (position + target) * 0.5 + vec3(0.0, 2.0, 0.0);
  vec3 bezier = pow(1.0 - signal, 2.0) * position +
                2.0 * (1.0 - signal) * signal * control +
                pow(signal, 2.0) * target;

  // Electric pulse animation
  float pulse = sin(signal * 10.0 - time * 5.0) * 0.5 + 0.5;
  vSignal = pulse;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(bezier, 1.0);
}
`

export const neuralPathwayFragmentShader = `
varying float vSignal;
uniform vec3 activeColor;
uniform vec3 inactiveColor;

void main() {
  vec3 color = mix(inactiveColor, activeColor, vSignal);
  float glow = pow(vSignal, 2.0) * 2.0;

  gl_FragColor = vec4(color * (1.0 + glow), 0.8 + vSignal * 0.2);
}
`
