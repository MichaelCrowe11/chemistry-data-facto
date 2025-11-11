import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CodeCubeProps {
  code: string;
  language: string;
}

export function CodeCube3D({ code, language }: CodeCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cube: THREE.Mesh;
    animationId?: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00C9FF, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF6B9D, 1, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const edges = new THREE.EdgesGeometry(geometry);
    
    const materials = [
      new THREE.MeshStandardMaterial({ 
        color: 0x00C9FF, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0x00C9FF,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0xFF6B9D, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0xFF6B9D,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x7C3AED, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0x7C3AED,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x10B981, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0x10B981,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0xF59E0B, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0xF59E0B,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0xEF4444, 
        metalness: 0.8, 
        roughness: 0.2,
        emissive: 0xEF4444,
        emissiveIntensity: 0.1
      }),
    ];

    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
    );
    cube.add(edgeLines);

    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 10;
      particlePositions[i + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10;
    }
    
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00C9FF,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      cube
    };

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (!sceneRef.current) return;

      cube.rotation.x += 0.005;
      cube.rotation.y += 0.01;
      
      cube.rotation.x += mouseY * 0.02;
      cube.rotation.y += mouseX * 0.02;

      particles.rotation.y += 0.001;

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!sceneRef.current || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
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
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
    };
  }, [code, language]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-64 rounded-lg overflow-hidden"
    />
  );
}
