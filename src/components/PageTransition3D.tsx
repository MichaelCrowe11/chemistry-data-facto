import { useEffect, useRef, useState } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);
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

    setIsAnimating(true);
    const { transitionRing, scene, camera, renderer } = sceneRef.current;
    if (!transitionRing) return;

    let progress = 0;
    const duration = 0.8;
    const startTime = Date.now();

    const animate = () => {
      if (!sceneRef.current) return;

      const elapsed = (Date.now() - startTime) / 1000;
      progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease.inOutCubic(progress);

      transitionRing.scale.setScalar(1 + easedProgress * 2);
      transitionRing.rotation.z += 0.1;
      const opacity = Math.sin(easedProgress * Math.PI);
      (transitionRing.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;

      renderer.render(scene, camera);

      if (progress < 1) {
        sceneRef.current.animationId = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animate();

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
    };
  }, [transitionKey]);

  const getTransitionStyle = () => {
    const styles: Record<string, React.CSSProperties> = {
      left: {
        transform: isAnimating ? 'translateX(0) rotateY(0deg)' : 'translateX(-100px) rotateY(-15deg)',
        opacity: isAnimating ? 1 : 0
      },
      right: {
        transform: isAnimating ? 'translateX(0) rotateY(0deg)' : 'translateX(100px) rotateY(15deg)',
        opacity: isAnimating ? 1 : 0
      },
      up: {
        transform: isAnimating ? 'translateY(0) rotateX(0deg)' : 'translateY(100px) rotateX(15deg)',
        opacity: isAnimating ? 1 : 0
      },
      down: {
        transform: isAnimating ? 'translateY(0) rotateX(0deg)' : 'translateY(-100px) rotateX(-15deg)',
        opacity: isAnimating ? 1 : 0
      },
      zoom: {
        transform: isAnimating ? 'scale(1) translateZ(0)' : 'scale(0.8) translateZ(-100px)',
        opacity: isAnimating ? 1 : 0
      }
    };
    return styles[direction];
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
        style={{ mixBlendMode: 'screen' }}
      />

      <div
        key={transitionKey}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 1000,
          transition: 'all 0.5s cubic-bezier(0.43, 0.13, 0.23, 0.96)',
          ...getTransitionStyle()
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}
