import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createParticleField,
  updateParticleConnections,
  animateParticles,
  setupChemistryLighting,
  createDNAHelix,
  createMoleculeStructure,
  createOrbitalRing
} from '../lib/three-utils';

interface MolecularBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

/**
 * Animated molecular particle background with DNA helix and chemistry elements
 * Provides an immersive 3D environment behind the entire application
 */
export function MolecularBackground({
  intensity = 'high',
  interactive = true
}: MolecularBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId?: number;
    particles: THREE.Points;
    connections: THREE.LineSegments;
    positions: Float32Array;
    velocities: Float32Array;
    dnaHelix?: THREE.Group;
    molecules: THREE.Group[];
    orbitals: THREE.Mesh[];
    mouse: THREE.Vector2;
    targetCameraPos: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Particle count based on intensity
    const particleCounts = { low: 50, medium: 100, high: 200 };
    const particleCount = particleCounts[intensity];

    // Initialize scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0A0E27, 10, 50);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0A0E27, 0.95);
    containerRef.current.appendChild(renderer.domElement);

    // Setup lighting
    setupChemistryLighting(scene);

    // Create particle field
    const { particles, connections, positions, velocities } = createParticleField(
      particleCount,
      30
    );
    scene.add(particles);
    scene.add(connections);

    // Create DNA helix in the background
    const dnaHelix = createDNAHelix(15, 3, 4);
    dnaHelix.position.set(-15, 0, -10);
    dnaHelix.rotation.x = Math.PI / 6;
    scene.add(dnaHelix);

    // Create floating molecules
    const molecules: THREE.Group[] = [];
    const moleculeTypes = ['benzene', 'water', 'methane', 'complex'] as const;

    for (let i = 0; i < 5; i++) {
      const molecule = createMoleculeStructure(
        moleculeTypes[Math.floor(Math.random() * moleculeTypes.length)]
      );
      const angle = (i / 5) * Math.PI * 2;
      const radius = 12 + Math.random() * 8;
      molecule.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 10,
        Math.sin(angle) * radius - 10
      );
      molecule.scale.setScalar(0.5 + Math.random() * 0.5);
      scene.add(molecule);
      molecules.push(molecule);
    }

    // Create orbital rings
    const orbitals: THREE.Mesh[] = [];
    const orbitalColors = [0x00C9FF, 0xFF6B9D, 0x7C3AED, 0x10B981];

    for (let i = 0; i < 4; i++) {
      const orbital = createOrbitalRing(5 + i * 2, orbitalColors[i], 0.03);
      orbital.position.set(15, 0, -15);
      orbital.rotation.x = Math.random() * Math.PI;
      orbital.rotation.y = Math.random() * Math.PI;
      scene.add(orbital);
      orbitals.push(orbital);
    }

    // Mouse tracking for interactive parallax
    const mouse = new THREE.Vector2();
    const targetCameraPos = new THREE.Vector3(0, 0, 15);

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update target camera position for parallax
      targetCameraPos.x = mouse.x * 2;
      targetCameraPos.y = mouse.y * 2;
      targetCameraPos.z = 15;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Store scene data
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      connections,
      positions,
      velocities,
      dnaHelix,
      molecules,
      orbitals,
      mouse,
      targetCameraPos
    };

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.01;

      // Animate particles
      animateParticles(positions, velocities, 30);
      particles.geometry.attributes.position.needsUpdate = true;

      // Update particle connections
      if (time % 0.1 < 0.01) { // Update connections every 10 frames
        updateParticleConnections(positions, connections, 4, 150);
      }

      // Rotate DNA helix
      if (dnaHelix) {
        dnaHelix.rotation.y += 0.002;
        dnaHelix.rotation.z = Math.sin(time * 0.5) * 0.1;
      }

      // Animate molecules - floating and rotating
      molecules.forEach((molecule, index) => {
        molecule.rotation.x += 0.001 * (index % 2 ? 1 : -1);
        molecule.rotation.y += 0.002 * (index % 2 ? -1 : 1);
        molecule.position.y += Math.sin(time + index) * 0.01;
      });

      // Animate orbital rings
      orbitals.forEach((orbital, index) => {
        orbital.rotation.x += 0.001 * (index % 2 ? 1 : -1);
        orbital.rotation.y += 0.002;
        orbital.rotation.z += 0.0015 * (index % 2 ? -1 : 1);
      });

      // Smooth camera parallax
      if (interactive) {
        camera.position.lerp(targetCameraPos, 0.05);
        camera.lookAt(0, 0, 0);
      }

      // Rotate entire scene slightly
      particles.rotation.y += 0.0001;
      connections.rotation.y += 0.0001;

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }

      if (sceneRef.current) {
        const { renderer, animationId, scene } = sceneRef.current;

        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        // Dispose of geometries and materials
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });

        renderer.dispose();
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }

      sceneRef.current = null;
    };
  }, [intensity, interactive]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: 'linear-gradient(180deg, #0A0E27 0%, #1A1F3A 100%)'
      }}
    />
  );
}
