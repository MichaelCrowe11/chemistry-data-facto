import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Galaxy3DProps {
  starCount?: number;
  armCount?: number;
  rotationSpeed?: number;
}

export function Galaxy3D({ 
  starCount = 10000,
  armCount = 5,
  rotationSpeed = 0.001
}: Galaxy3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    galaxy: THREE.Points;
    animationId?: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 100);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 30);
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

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const colorInner = new THREE.Color(0x00C9FF);
    const colorOuter = new THREE.Color(0xFF6B9D);
    const colorMid = new THREE.Color(0x7C3AED);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      const radius = Math.random() * 20;
      const spinAngle = radius * 0.3;
      const branchAngle = ((i % armCount) / armCount) * Math.PI * 2;

      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY * 0.5;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const mixedColor = colorInner.clone();
      const distanceRatio = radius / 20;
      
      if (distanceRatio < 0.5) {
        mixedColor.lerp(colorMid, distanceRatio * 2);
      } else {
        mixedColor.copy(colorMid).lerp(colorOuter, (distanceRatio - 0.5) * 2);
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true
    });

    const galaxy = new THREE.Points(geometry, material);
    scene.add(galaxy);

    const coreLight = new THREE.PointLight(0x00C9FF, 2, 50);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      galaxy
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

      galaxy.rotation.y = time * 2;
      galaxy.rotation.x = Math.sin(time) * 0.2;

      camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 10 + 20 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      const positions = galaxy.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = Math.sin(time * 2 + positions[i]) * 0.5;
      }
      galaxy.geometry.attributes.position.needsUpdate = true;

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
          if (object instanceof THREE.Points) {
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
  }, [starCount, armCount, rotationSpeed]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
}
