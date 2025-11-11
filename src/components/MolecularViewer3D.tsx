import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Play, Pause, ArrowClockwise, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createMoleculeStructure, setupChemistryLighting, createOrbitalRing } from '../lib/three-utils';

interface MolecularViewer3DProps {
  moleculeType?: 'benzene' | 'water' | 'methane' | 'complex';
  title?: string;
  showOrbitals?: boolean;
  autoRotate?: boolean;
}

/**
 * Interactive 3D Molecular Structure Viewer
 * Features rotation controls, zoom, and orbital visualization
 */
export function MolecularViewer3D({
  moleculeType = 'complex',
  title = 'Molecular Structure',
  showOrbitals = true,
  autoRotate = true
}: MolecularViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [zoom, setZoom] = useState(15);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    molecule: THREE.Group;
    orbitals: THREE.Mesh[];
    animationId?: number;
    mouse: {
      isDown: boolean;
      startX: number;
      startY: number;
      rotationX: number;
      rotationY: number;
    };
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = zoom;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    setupChemistryLighting(scene);

    // Create molecule
    const molecule = createMoleculeStructure(moleculeType);
    scene.add(molecule);

    // Create orbital rings
    const orbitals: THREE.Mesh[] = [];
    if (showOrbitals) {
      const orbitalColors = [0x00C9FF, 0xFF6B9D, 0x7C3AED];
      for (let i = 0; i < 3; i++) {
        const orbital = createOrbitalRing(3 + i, orbitalColors[i], 0.03);
        orbital.rotation.x = (Math.PI / 3) * i;
        orbital.rotation.y = (Math.PI / 4) * i;
        scene.add(orbital);
        orbitals.push(orbital);
      }
    }

    const mouse = {
      isDown: false,
      startX: 0,
      startY: 0,
      rotationX: 0,
      rotationY: 0
    };

    sceneRef.current = {
      scene,
      camera,
      renderer,
      molecule,
      orbitals,
      mouse
    };

    // Mouse controls
    const handleMouseDown = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      mouse.isDown = true;
      mouse.startX = e.clientX;
      mouse.startY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!sceneRef.current || !mouse.isDown) return;

      const deltaX = e.clientX - mouse.startX;
      const deltaY = e.clientY - mouse.startY;

      mouse.rotationY += deltaX * 0.01;
      mouse.rotationX += deltaY * 0.01;

      molecule.rotation.y = mouse.rotationY;
      molecule.rotation.x = mouse.rotationX;

      mouse.startX = e.clientX;
      mouse.startY = e.clientY;
    };

    const handleMouseUp = () => {
      if (!sceneRef.current) return;
      mouse.isDown = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!sceneRef.current) return;

      const newZoom = camera.position.z + e.deltaY * 0.01;
      camera.position.z = Math.max(5, Math.min(30, newZoom));
      setZoom(camera.position.z);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.01;

      // Auto-rotate if enabled and not dragging
      if (isRotating && !mouse.isDown) {
        molecule.rotation.y += 0.005;
        mouse.rotationY = molecule.rotation.y;
      }

      // Animate orbitals
      orbitals.forEach((orbital, index) => {
        orbital.rotation.z += 0.002 * (index + 1);
      });

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current || !containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);

      if (sceneRef.current) {
        const { renderer, animationId, scene } = sceneRef.current;
        if (animationId) cancelAnimationFrame(animationId);

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
    };
  }, [moleculeType, showOrbitals]);

  // Update rotation state
  useEffect(() => {
    if (sceneRef.current && !isRotating && sceneRef.current.mouse.isDown) {
      // Keep current rotation when stopping auto-rotate
    }
  }, [isRotating]);

  // Update camera zoom
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.camera.position.z = zoom;
    }
  }, [zoom]);

  const handleReset = () => {
    if (!sceneRef.current) return;
    sceneRef.current.molecule.rotation.set(0, 0, 0);
    sceneRef.current.mouse.rotationX = 0;
    sceneRef.current.mouse.rotationY = 0;
    setZoom(15);
    sceneRef.current.camera.position.z = 15;
  };

  const moleculeNames = {
    benzene: 'Benzene (C₆H₆)',
    water: 'Water (H₂O)',
    methane: 'Methane (CH₄)',
    complex: 'Complex Molecule'
  };

  return (
    <motion.div
      className="h-full flex flex-col bg-card/50 backdrop-blur border border-border rounded-lg overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card/80">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {moleculeNames[moleculeType]}
          </Badge>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRotating(!isRotating)}
            className="h-7 w-7 p-0"
          >
            {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(5, zoom - 2))}
            className="h-7 w-7 p-0"
          >
            <MagnifyingGlassPlus className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(30, zoom + 2))}
            className="h-7 w-7 p-0"
          >
            <MagnifyingGlassMinus className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 w-7 p-0"
          >
            <ArrowClockwise className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gradient-to-br from-background/50 to-background/80"
      >
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Info */}
      <div className="p-2 border-t border-border bg-card/80 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Interactive 3D Viewer</span>
          <span>Zoom: {zoom.toFixed(1)}x</span>
        </div>
      </div>
    </motion.div>
  );
}
