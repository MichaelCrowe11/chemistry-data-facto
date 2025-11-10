import * as THREE from 'three';

/**
 * Three.js utility functions for chemistry-themed 3D visualizations
 */

// Periodic table colors for molecular visualizations
export const ELEMENT_COLORS: Record<string, number> = {
  H: 0xFFFFFF,  // Hydrogen - White
  C: 0x909090,  // Carbon - Gray
  N: 0x3050F8,  // Nitrogen - Blue
  O: 0xFF0D0D,  // Oxygen - Red
  F: 0x90E050,  // Fluorine - Green
  P: 0xFF8000,  // Phosphorus - Orange
  S: 0xFFFF30,  // Sulfur - Yellow
  Cl: 0x1FF01F, // Chlorine - Green
  Br: 0xA62929, // Bromine - Brown
  I: 0x940094,  // Iodine - Purple
  default: 0x00C9FF // Cyan for unknown
};

/**
 * Create a molecular atom sphere with glow effect
 */
export function createAtom(
  element: string = 'C',
  radius: number = 0.5,
  position: THREE.Vector3 = new THREE.Vector3()
): THREE.Group {
  const group = new THREE.Group();

  const color = ELEMENT_COLORS[element] || ELEMENT_COLORS.default;

  // Main sphere
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    shininess: 100,
    specular: 0xffffff
  });
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  // Outer glow
  const glowGeometry = new THREE.SphereGeometry(radius * 1.3, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);

  group.position.copy(position);
  return group;
}

/**
 * Create a molecular bond between two atoms
 */
export function createBond(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number = 0xCCCCCC,
  radius: number = 0.1
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const material = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.2,
    shininess: 50
  });

  const bond = new THREE.Mesh(geometry, material);
  bond.position.copy(midpoint);

  // Align the cylinder with the bond direction
  const axis = new THREE.Vector3(0, 1, 0);
  bond.quaternion.setFromUnitVectors(axis, direction.normalize());

  return bond;
}

/**
 * Create a DNA helix structure
 */
export function createDNAHelix(
  height: number = 10,
  radius: number = 2,
  turns: number = 3
): THREE.Group {
  const group = new THREE.Group();
  const pointsPerTurn = 20;
  const totalPoints = pointsPerTurn * turns;

  for (let i = 0; i < totalPoints; i++) {
    const t = i / totalPoints;
    const angle = t * Math.PI * 2 * turns;
    const y = (t - 0.5) * height;

    // First strand
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;
    const atom1 = createAtom('N', 0.3, new THREE.Vector3(x1, y, z1));
    group.add(atom1);

    // Second strand (opposite side)
    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;
    const atom2 = createAtom('O', 0.3, new THREE.Vector3(x2, y, z2));
    group.add(atom2);

    // Connecting bonds
    if (i % 4 === 0) {
      const bond = createBond(
        new THREE.Vector3(x1, y, z1),
        new THREE.Vector3(x2, y, z2),
        0x4080FF,
        0.08
      );
      group.add(bond);
    }
  }

  return group;
}

/**
 * Create a molecular orbital ring
 */
export function createOrbitalRing(
  radius: number = 2,
  color: number = 0x00C9FF,
  thickness: number = 0.05
): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(radius, thickness, 16, 100);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Create particle field with connections
 */
export function createParticleField(
  count: number = 100,
  bounds: number = 20
): {
  particles: THREE.Points;
  connections: THREE.LineSegments;
  positions: Float32Array;
  velocities: Float32Array;
} {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  // Initialize particles
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * bounds;
    positions[i + 1] = (Math.random() - 0.5) * bounds;
    positions[i + 2] = (Math.random() - 0.5) * bounds;

    velocities[i] = (Math.random() - 0.5) * 0.02;
    velocities[i + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i + 2] = (Math.random() - 0.5) * 0.02;
  }

  // Create particle points
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00C9FF,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  // Create connections
  const connectionGeometry = new THREE.BufferGeometry();
  const connectionMaterial = new THREE.LineBasicMaterial({
    color: 0x00C9FF,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });

  const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);

  return { particles, connections, positions, velocities };
}

/**
 * Update particle field connections
 */
export function updateParticleConnections(
  positions: Float32Array,
  connections: THREE.LineSegments,
  maxDistance: number = 3,
  maxConnections: number = 100
): void {
  const linePositions: number[] = [];
  const count = positions.length / 3;
  let connectionCount = 0;

  for (let i = 0; i < count && connectionCount < maxConnections; i++) {
    for (let j = i + 1; j < count && connectionCount < maxConnections; j++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < maxDistance) {
        linePositions.push(
          positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
          positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
        );
        connectionCount++;
      }
    }
  }

  connections.geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(linePositions, 3)
  );
}

/**
 * Animate particle field
 */
export function animateParticles(
  positions: Float32Array,
  velocities: Float32Array,
  bounds: number = 20
): void {
  for (let i = 0; i < positions.length; i += 3) {
    // Update positions
    positions[i] += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];

    // Bounce off bounds
    if (Math.abs(positions[i]) > bounds / 2) velocities[i] *= -1;
    if (Math.abs(positions[i + 1]) > bounds / 2) velocities[i + 1] *= -1;
    if (Math.abs(positions[i + 2]) > bounds / 2) velocities[i + 2] *= -1;
  }
}

/**
 * Create a complex molecule structure
 */
export function createMoleculeStructure(
  structure: 'benzene' | 'water' | 'methane' | 'complex' = 'complex'
): THREE.Group {
  const group = new THREE.Group();

  if (structure === 'benzene') {
    // Benzene ring (C6H6)
    const radius = 1.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const carbon = createAtom('C', 0.4, new THREE.Vector3(x, 0, z));
      group.add(carbon);

      // Add bonds
      if (i > 0) {
        const prevAngle = ((i - 1) / 6) * Math.PI * 2;
        const prevX = Math.cos(prevAngle) * radius;
        const prevZ = Math.sin(prevAngle) * radius;
        const bond = createBond(
          new THREE.Vector3(prevX, 0, prevZ),
          new THREE.Vector3(x, 0, z)
        );
        group.add(bond);
      }
    }
    // Close the ring
    const lastAngle = (5 / 6) * Math.PI * 2;
    const lastX = Math.cos(lastAngle) * radius;
    const lastZ = Math.sin(lastAngle) * radius;
    const closeBond = createBond(
      new THREE.Vector3(lastX, 0, lastZ),
      new THREE.Vector3(radius, 0, 0)
    );
    group.add(closeBond);

  } else if (structure === 'water') {
    // H2O
    const oxygen = createAtom('O', 0.5, new THREE.Vector3(0, 0, 0));
    const hydrogen1 = createAtom('H', 0.3, new THREE.Vector3(-1, 0.6, 0));
    const hydrogen2 = createAtom('H', 0.3, new THREE.Vector3(1, 0.6, 0));

    group.add(oxygen, hydrogen1, hydrogen2);
    group.add(createBond(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1, 0.6, 0)));
    group.add(createBond(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.6, 0)));

  } else if (structure === 'methane') {
    // CH4 - Tetrahedral
    const carbon = createAtom('C', 0.5, new THREE.Vector3(0, 0, 0));
    group.add(carbon);

    const hydrogenPositions = [
      new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(1.5),
      new THREE.Vector3(-1, -1, 1).normalize().multiplyScalar(1.5),
      new THREE.Vector3(-1, 1, -1).normalize().multiplyScalar(1.5),
      new THREE.Vector3(1, -1, -1).normalize().multiplyScalar(1.5)
    ];

    hydrogenPositions.forEach(pos => {
      const hydrogen = createAtom('H', 0.3, pos);
      group.add(hydrogen);
      group.add(createBond(new THREE.Vector3(0, 0, 0), pos));
    });

  } else {
    // Complex random molecule
    const centerAtom = createAtom('N', 0.6, new THREE.Vector3(0, 0, 0));
    group.add(centerAtom);

    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 2 + Math.random();

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const elements = ['C', 'O', 'N', 'S'];
      const element = elements[Math.floor(Math.random() * elements.length)];
      const atom = createAtom(element, 0.3 + Math.random() * 0.2, new THREE.Vector3(x, y, z));
      group.add(atom);
      group.add(createBond(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)));
    }
  }

  return group;
}

/**
 * Setup scene with chemistry-themed lighting
 */
export function setupChemistryLighting(scene: THREE.Scene): void {
  // Ambient light for overall brightness
  const ambient = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambient);

  // Key light - cyan tint for chemistry theme
  const keyLight = new THREE.DirectionalLight(0x00C9FF, 1.5);
  keyLight.position.set(5, 5, 5);
  scene.add(keyLight);

  // Fill light - warm counterbalance
  const fillLight = new THREE.DirectionalLight(0xFF6B9D, 0.5);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  // Point lights for molecular glow effect
  const pointLight1 = new THREE.PointLight(0x00C9FF, 1, 50);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xFF6B9D, 1, 50);
  pointLight2.position.set(-10, -10, -10);
  scene.add(pointLight2);
}

/**
 * Create gradient background shader material
 */
export function createGradientBackground(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(2, 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color(0x0A0E27) },
      color2: { value: new THREE.Color(0x1A1F3A) },
      color3: { value: new THREE.Color(0x00C9FF) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        float mixValue = sin(uv.y * 3.0 + time * 0.5) * 0.5 + 0.5;
        vec3 color = mix(color1, color2, uv.y);
        color = mix(color, color3, mixValue * 0.1);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthWrite: false
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Ease functions for smooth animations
 */
export const ease = {
  inOutCubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  outElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  inOutQuad: (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
};
