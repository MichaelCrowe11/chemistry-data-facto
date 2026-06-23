/**
 * L-System Implementation for Mycelial Growth
 * Generates organic branching patterns for Synapse-Code
 */

import * as THREE from 'three'

export interface LSystemRule {
  [key: string]: string
}

export interface LSystemConfig {
  axiom: string
  rules: LSystemRule
  iterations: number
  angle: number // degrees
  length: number
  thickness: number
  branchDecay: number // How much smaller branches get
}

export interface BranchPoint {
  position: THREE.Vector3
  direction: THREE.Vector3
  thickness: number
  generation: number
}

export class LSystemGrowth {
  private config: LSystemConfig
  private instructions: string = ''

  constructor(config: Partial<LSystemConfig> = {}) {
    this.config = {
      axiom: 'F',
      rules: {
        'F': 'F[+F]F[-F][F]' // Default mycelial branching pattern
      },
      iterations: 4,
      angle: 25,
      length: 0.3,
      thickness: 0.05,
      branchDecay: 0.7,
      ...config
    }
  }

  /**
   * Generate L-System string
   */
  generate(iterations?: number): string {
    const iter = iterations ?? this.config.iterations
    let current = this.config.axiom

    for (let i = 0; i < iter; i++) {
      current = this.applyRules(current)
    }

    this.instructions = current
    return current
  }

  /**
   * Apply production rules to string
   */
  private applyRules(input: string): string {
    let output = ''

    for (const char of input) {
      output += this.config.rules[char] || char
    }

    return output
  }

  /**
   * Create 3D geometry from L-System instructions
   */
  createGeometry(instructions?: string): THREE.BufferGeometry {
    const inst = instructions || this.instructions || this.generate()

    const points: THREE.Vector3[] = []
    const stack: BranchPoint[] = []

    let position = new THREE.Vector3(0, 0, 0)
    let direction = new THREE.Vector3(0, 1, 0)
    let thickness = this.config.thickness
    let generation = 0

    const angleRad = this.config.angle * Math.PI / 180

    for (const char of inst) {
      switch (char) {
        case 'F': // Move forward and draw
          const next = position.clone().add(
            direction.clone().multiplyScalar(this.config.length)
          )
          points.push(position.clone(), next.clone())
          position = next
          break

        case '+': // Rotate right (around Z axis)
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleRad)
          break

        case '-': // Rotate left (around Z axis)
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), -angleRad)
          break

        case '^': // Pitch up (around X axis)
          direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleRad)
          break

        case '&': // Pitch down (around X axis)
          direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), -angleRad)
          break

        case '\\': // Roll right (around Y axis)
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad)
          break

        case '/': // Roll left (around Y axis)
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -angleRad)
          break

        case '[': // Push state (start branch)
          stack.push({
            position: position.clone(),
            direction: direction.clone(),
            thickness,
            generation
          })
          generation++
          thickness *= this.config.branchDecay
          break

        case ']': // Pop state (end branch)
          const state = stack.pop()
          if (state) {
            position = state.position
            direction = state.direction
            thickness = state.thickness
            generation = state.generation
          }
          break
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }

  /**
   * Create tube geometry with varying thickness
   */
  createTubeGeometry(instructions?: string): THREE.BufferGeometry {
    const inst = instructions || this.instructions || this.generate()

    const paths: THREE.CurvePath<THREE.Vector3>[] = []
    const stack: BranchPoint[] = []

    let position = new THREE.Vector3(0, 0, 0)
    let direction = new THREE.Vector3(0, 1, 0)
    let currentPath: THREE.Vector3[] = []

    const angleRad = this.config.angle * Math.PI / 180

    for (const char of inst) {
      switch (char) {
        case 'F':
          const next = position.clone().add(
            direction.clone().multiplyScalar(this.config.length)
          )
          currentPath.push(position.clone())
          position = next
          break

        case '+':
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleRad)
          break

        case '-':
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), -angleRad)
          break

        case '[':
          if (currentPath.length > 0) {
            currentPath.push(position.clone())
          }
          stack.push({
            position: position.clone(),
            direction: direction.clone(),
            thickness: this.config.thickness,
            generation: 0
          })
          currentPath = []
          break

        case ']':
          if (currentPath.length > 0) {
            currentPath.push(position.clone())
          }
          const state = stack.pop()
          if (state) {
            position = state.position
            direction = state.direction
          }
          currentPath = []
          break
      }
    }

    // For now, return simple line geometry
    // Can be enhanced with actual tube geometry later
    return this.createGeometry(inst)
  }

  /**
   * Get branching points for anastomosis (fusion)
   */
  getBranchPoints(instructions?: string): BranchPoint[] {
    const inst = instructions || this.instructions || this.generate()
    const branchPoints: BranchPoint[] = []
    const stack: BranchPoint[] = []

    let position = new THREE.Vector3(0, 0, 0)
    let direction = new THREE.Vector3(0, 1, 0)
    let generation = 0

    const angleRad = this.config.angle * Math.PI / 180

    for (const char of inst) {
      switch (char) {
        case 'F':
          position = position.clone().add(
            direction.clone().multiplyScalar(this.config.length)
          )
          break

        case '+':
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleRad)
          break

        case '-':
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), -angleRad)
          break

        case '[':
          branchPoints.push({
            position: position.clone(),
            direction: direction.clone(),
            thickness: this.config.thickness * Math.pow(this.config.branchDecay, generation),
            generation
          })
          stack.push({
            position: position.clone(),
            direction: direction.clone(),
            thickness: this.config.thickness,
            generation
          })
          generation++
          break

        case ']':
          const state = stack.pop()
          if (state) {
            position = state.position
            direction = state.direction
            generation = state.generation
          }
          break
      }
    }

    return branchPoints
  }
}

/**
 * Predefined mycelial growth patterns
 */
export const MycelialPatterns = {
  // Simple branching
  simple: {
    axiom: 'F',
    rules: { 'F': 'F[+F]F[-F]F' },
    iterations: 4,
    angle: 25,
    length: 0.3,
    thickness: 0.05,
    branchDecay: 0.7
  },

  // Complex mycelial network
  complex: {
    axiom: 'F',
    rules: {
      'F': 'F[+F]F[-F][F]',
      'X': 'F[+X][-X]FX'
    },
    iterations: 5,
    angle: 22.5,
    length: 0.25,
    thickness: 0.06,
    branchDecay: 0.65
  },

  // Rhizomorphic (cord-like)
  rhizomorphic: {
    axiom: 'FFF',
    rules: {
      'F': 'F[+F]F[-F]F',
      'X': 'FX[+FX][-FX]'
    },
    iterations: 4,
    angle: 30,
    length: 0.35,
    thickness: 0.08,
    branchDecay: 0.75
  },

  // Dendritic (tree-like)
  dendritic: {
    axiom: 'X',
    rules: {
      'X': 'F[+X][-X]FX',
      'F': 'FF'
    },
    iterations: 6,
    angle: 20,
    length: 0.2,
    thickness: 0.04,
    branchDecay: 0.6
  },

  // Anastomosing (fusing network)
  anastomosing: {
    axiom: 'F',
    rules: {
      'F': 'F[+F]F[-F][F][+F][-F]'
    },
    iterations: 3,
    angle: 25,
    length: 0.3,
    thickness: 0.05,
    branchDecay: 0.7
  }
}

/**
 * Anastomosis - detecting and creating hyphal fusion points
 */
export class Anastomosis {
  private threshold: number

  constructor(threshold: number = 0.5) {
    this.threshold = threshold
  }

  /**
   * Find fusion points between hyphae
   */
  findFusionPoints(points1: BranchPoint[], points2: BranchPoint[]): Array<{
    point1: BranchPoint
    point2: BranchPoint
    distance: number
  }> {
    const fusions: Array<{
      point1: BranchPoint
      point2: BranchPoint
      distance: number
    }> = []

    points1.forEach(p1 => {
      points2.forEach(p2 => {
        const distance = p1.position.distanceTo(p2.position)
        if (distance < this.threshold && distance > 0.01) {
          fusions.push({ point1: p1, point2: p2, distance })
        }
      })
    })

    return fusions
  }

  /**
   * Create fusion geometry
   */
  createFusionGeometry(fusions: Array<{
    point1: BranchPoint
    point2: BranchPoint
    distance: number
  }>): THREE.BufferGeometry {
    const points: THREE.Vector3[] = []

    fusions.forEach(fusion => {
      // Create curved connection between fusion points
      const start = fusion.point1.position
      const end = fusion.point2.position
      const mid = start.clone().lerp(end, 0.5)

      // Add some curvature
      const perpendicular = new THREE.Vector3()
        .crossVectors(fusion.point1.direction, fusion.point2.direction)
        .normalize()
        .multiplyScalar(fusion.distance * 0.3)

      mid.add(perpendicular)

      // Create curved path
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const curvePoints = curve.getPoints(10)

      for (let i = 0; i < curvePoints.length - 1; i++) {
        points.push(curvePoints[i], curvePoints[i + 1])
      }
    })

    return new THREE.BufferGeometry().setFromPoints(points)
  }
}
