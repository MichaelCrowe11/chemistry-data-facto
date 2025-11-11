import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Code, File, User, Sparkle, Robot, Play, Bug, Brain, ChartBar, Speedometer } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedLogo } from '@/components/AnimatedLogo';
import {
  createMoleculeStructure,
  createOrbitalRing,
  setupChemistryLighting
} from '../lib/three-utils';

interface Enhanced3DWelcomeProps {
  onCreateFile: () => void;
  userName?: string;
}

/**
 * Enhanced 3D Welcome Screen with floating molecular structures
 * Features interactive 3D molecules, orbital rings, and parallax effects
 */
export function Enhanced3DWelcome({ onCreateFile, userName }: Enhanced3DWelcomeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    molecules: THREE.Group[];
    orbitals: THREE.Mesh[];
    animationId?: number;
    mouse: THREE.Vector2;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    canvasRef.current.appendChild(renderer.domElement);

    // Setup lighting
    setupChemistryLighting(scene);

    // Create floating molecules
    const molecules: THREE.Group[] = [];
    const moleculeTypes = ['benzene', 'water', 'methane', 'complex'] as const;
    const positions = [
      { x: -12, y: 8, z: -5 },
      { x: 12, y: 6, z: -8 },
      { x: -10, y: -6, z: -6 },
      { x: 11, y: -8, z: -7 },
      { x: 0, y: 10, z: -10 }
    ];

    positions.forEach((pos, i) => {
      const molecule = createMoleculeStructure(moleculeTypes[i % 4]);
      molecule.position.set(pos.x, pos.y, pos.z);
      molecule.scale.setScalar(0.8);
      scene.add(molecule);
      molecules.push(molecule);
    });

    // Create orbital rings around the content
    const orbitals: THREE.Mesh[] = [];
    const orbitalColors = [0x00C9FF, 0xFF6B9D, 0x7C3AED];

    for (let i = 0; i < 3; i++) {
      const orbital = createOrbitalRing(8 + i * 1.5, orbitalColors[i], 0.02);
      orbital.position.set(0, 0, -5);
      orbital.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
      scene.add(orbital);
      orbitals.push(orbital);
    }

    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      molecules,
      orbitals,
      mouse
    };

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.01;

      // Animate molecules
      molecules.forEach((molecule, index) => {
        molecule.rotation.x += 0.002 * (index % 2 ? 1 : -1);
        molecule.rotation.y += 0.003 * (index % 2 ? -1 : 1);
        molecule.position.y += Math.sin(time + index) * 0.02;
      });

      // Animate orbitals
      orbitals.forEach((orbital, index) => {
        orbital.rotation.y += 0.001 * (index + 1);
        orbital.rotation.z += 0.002 * (index % 2 ? 1 : -1);
      });

      // Parallax camera movement
      const targetX = mouse.x * 2;
      const targetY = mouse.y * 2;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);

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
        if (canvasRef.current?.contains(renderer.domElement)) {
          canvasRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  const features = [
    {
      icon: Play,
      title: 'Live Execution',
      description: 'Run JavaScript/TypeScript instantly in the browser with real-time output'
    },
    {
      icon: Bug,
      title: 'Visual Debugger',
      description: 'Step through code, inspect variables, and travel through execution timeline'
    },
    {
      icon: Brain,
      title: 'AI Predictions',
      description: 'AI predicts your next code changes with confidence scoring'
    },
    {
      icon: Robot,
      title: 'AI Pair Programmer',
      description: 'Collaborate with AI that implements features alongside you'
    },
    {
      icon: ChartBar,
      title: 'Complexity Analyzer',
      description: 'Visual heat maps show code complexity with refactoring suggestions'
    },
    {
      icon: Speedometer,
      title: 'Performance Profiler',
      description: 'Line-by-line execution timing with optimization recommendations'
    }
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center overflow-auto relative">
      {/* 3D Canvas Background */}
      <div
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Content */}
      <div className="max-w-2xl text-center space-y-6 p-8 relative z-10">
        <div
          className="flex justify-center animate-in zoom-in spin-in duration-500"
        >
          <AnimatedLogo className="text-5xl" />
        </div>

        <div
          className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200"
        >
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Crowe Code
            </h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-xs shadow-lg shadow-purple-500/50">
              REVOLUTIONARY
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            The world's first AI-native code editor with live execution & visual debugging
          </p>
          {userName && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <User className="w-3.5 h-3.5" />
              <span>Welcome back, {userName}</span>
            </div>
          )}
        </div>

        <div
          className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300 delay-400"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 space-y-3 text-left relative overflow-hidden group cursor-pointer transition-all hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{
                  animationDelay: `${500 + index * 100}ms`,
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ zIndex: 0 }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="w-5 h-5" weight="fill" />
                    <h2 className="font-semibold text-sm">{feature.title}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>

                {hoveredCard === index && (
                  <div
                    className="absolute inset-0 border-2 border-cyan-500/50 rounded-lg animate-in fade-in duration-200"
                    style={{ zIndex: 1 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          className="pt-4 space-y-3 animate-in fade-in duration-300 delay-1000"
        >
          <div className="transition-transform hover:scale-105 active:scale-95">
            <Button
              onClick={onCreateFile}
              className="w-full gap-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 border-0 shadow-lg shadow-purple-500/50"
              size="lg"
            >
              <File className="w-4 h-4" />
              Create Your First File
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Sparkle className="w-3 h-3" weight="fill" />
              All files auto-save to your workspace
            </p>
          </div>
        </div>

        <div
          className="pt-4 space-y-2 text-xs text-muted-foreground animate-in fade-in duration-300 delay-1200"
        >
          <p className="font-medium">Essential Shortcuts</p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted/80 backdrop-blur rounded text-foreground">Ctrl+N</kbd>
              <span className="ml-2">New File</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted/80 backdrop-blur rounded text-foreground">Ctrl+S</kbd>
              <span className="ml-2">Save</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted/80 backdrop-blur rounded text-foreground">Ctrl+K</kbd>
              <span className="ml-2">AI Chat</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted/80 backdrop-blur rounded text-foreground">Ctrl+B</kbd>
              <span className="ml-2">Toggle Sidebar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
