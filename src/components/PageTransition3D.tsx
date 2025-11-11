import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { createOrbitalRing, ease } from '../lib/three-utils';

interface PageTransition3DProps {
  children: React.ReactNode;
  transitionKey: string;
  direction?: 'left' | 'right' | 'up' | 'down' | 'zoom';
}

/**
 * 3D Page Transition Component
 * Wraps content with smooth 3D camera-based transitions
 */
export function PageTransition3D({
  children,
  transitionKey,
  direction = 'right'
}: PageTransition3DProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    transitionRing?: THREE.Mesh;
    animationId?: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    canvasRef.current.appendChild(renderer.domElement);

    // Create transition ring effect
    const transitionRing = createOrbitalRing(10, 0x00C9FF, 0.2);
    transitionRing.position.z = -5;
    scene.add(transitionRing);

    // Add lighting for the ring
    const light = new THREE.PointLight(0x00C9FF, 2, 100);
    light.position.set(0, 0, 0);
    scene.add(light);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      transitionRing
    };

    const handleResize = () => {
      if (!sceneRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

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

  // Trigger transition animation
  useEffect(() => {
    if (!sceneRef.current) return;

    const { transitionRing, scene, camera, renderer } = sceneRef.current;
    if (!transitionRing) return;

    let progress = 0;
    const duration = 0.8; // seconds
    const startTime = Date.now();

    const animate = () => {
      if (!sceneRef.current) return;

      const elapsed = (Date.now() - startTime) / 1000;
      progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease.inOutCubic(progress);

      // Animate transition ring
      transitionRing.scale.setScalar(1 + easedProgress * 2);
      transitionRing.rotation.z += 0.1;
      const opacity = Math.sin(easedProgress * Math.PI);
      (transitionRing.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;

      renderer.render(scene, camera);

      if (progress < 1) {
        sceneRef.current.animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
    };
  }, [transitionKey]);

  const variants = {
    left: {
      initial: { opacity: 0, x: -100, rotateY: -15 },
      animate: { opacity: 1, x: 0, rotateY: 0 },
      exit: { opacity: 0, x: 100, rotateY: 15 }
    },
    right: {
      initial: { opacity: 0, x: 100, rotateY: 15 },
      animate: { opacity: 1, x: 0, rotateY: 0 },
      exit: { opacity: 0, x: -100, rotateY: -15 }
    },
    up: {
      initial: { opacity: 0, y: 100, rotateX: 15 },
      animate: { opacity: 1, y: 0, rotateX: 0 },
      exit: { opacity: 0, y: -100, rotateX: -15 }
    },
    down: {
      initial: { opacity: 0, y: -100, rotateX: -15 },
      animate: { opacity: 1, y: 0, rotateX: 0 },
      exit: { opacity: 0, y: 100, rotateX: 15 }
    },
    zoom: {
      initial: { opacity: 0, scale: 0.8, z: -100 },
      animate: { opacity: 1, scale: 1, z: 0 },
      exit: { opacity: 0, scale: 1.2, z: 100 }
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas for transition effects */}
      <div
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Content with Framer Motion transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          initial={variants[direction].initial}
          animate={variants[direction].animate}
          exit={variants[direction].exit}
          transition={{
            duration: 0.5,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
          style={{
            transformStyle: 'preserve-3d',
            perspective: 1000
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
