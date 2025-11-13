import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FloatingIslands3DProps {
  islandCount?: number;
  rotationSpeed?: number;
}

export function FloatingIslands3D({ 
  islandCount = 8,
  rotationSpeed = 0.001
}: FloatingIslands3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    islands: THREE.Group[];
    animationId?: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000814, 20, 100);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 40);
    camera.lookAt(0, 0, 0);

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

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00C9FF, 2, 50);
    pointLight1.position.set(-10, 10, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF6B9D, 2, 50);
    pointLight2.position.set(10, 10, 0);
    scene.add(pointLight2);

    const islands: THREE.Group[] = [];

    const createIsland = () => {
      const island = new THREE.Group();

      const baseGeometry = new THREE.DodecahedronGeometry(2, 0);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a4d6d,
        metalness: 0.3,
        roughness: 0.7,
        emissive: 0x0a2233,
        emissiveIntensity: 0.2
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.scale.set(1, 0.5, 1);
      island.add(base);

      const crystalCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < crystalCount; i++) {
        const crystalGeometry = new THREE.ConeGeometry(0.3, 1.5, 6);
        const crystalColors = [0x00C9FF, 0xFF6B9D, 0x7C3AED, 0x10B981];
        const crystalColor = crystalColors[Math.floor(Math.random() * crystalColors.length)];
        
        const crystalMaterial = new THREE.MeshStandardMaterial({
          color: crystalColor,
          emissive: crystalColor,
          emissiveIntensity: 0.5,
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.9
        });
        
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(
          (Math.random() - 0.5) * 2,
          1 + Math.random() * 0.5,
          (Math.random() - 0.5) * 2
        );
        crystal.rotation.z = (Math.random() - 0.5) * 0.3;
        island.add(crystal);
      }

      const ringGeometry = new THREE.TorusGeometry(3, 0.05, 16, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00C9FF,
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      island.add(ring);

      return island;
    };

    for (let i = 0; i < islandCount; i++) {
      const island = createIsland();
      
      const angle = (i / islandCount) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      
      island.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 15,
        Math.sin(angle) * radius
      );
      
      island.rotation.y = Math.random() * Math.PI * 2;
      
      scene.add(island);
      islands.push(island);
    }

    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 100;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 100;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 100;

      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.6 + 0.5, 1, 0.5);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
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
      islands
    };

    let time = 0;
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

      time += rotationSpeed;

      islands.forEach((island, index) => {
        island.rotation.y += rotationSpeed * 5;
        
        island.position.y += Math.sin(time * 3 + index) * 0.02;
        
        const angle = time + (index / islandCount) * Math.PI * 2;
        const radius = 15 + Math.sin(time + index) * 2;
        island.position.x = Math.cos(angle) * radius;
        island.position.z = Math.sin(angle) * radius;

        island.children.forEach((child, childIndex) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.ConeGeometry) {
            child.rotation.y += 0.02;
            const material = child.material as THREE.MeshStandardMaterial;
            material.emissiveIntensity = 0.3 + Math.sin(time * 5 + childIndex) * 0.2;
          }
        });
      });

      particles.rotation.y += rotationSpeed * 2;
      particles.rotation.x += rotationSpeed;

      const targetX = mouseX * 10;
      const targetY = mouseY * 10 + 15;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

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
      
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      
      if (sceneRef.current) {
        const { renderer, animationId, scene } = sceneRef.current;
        if (animationId) cancelAnimationFrame(animationId);
        
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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
  }, [islandCount, rotationSpeed]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
}
