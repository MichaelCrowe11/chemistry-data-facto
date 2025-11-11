import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Tunnel3DProps {
  speed?: number;
  color1?: number;
  color2?: number;
}

export function Tunnel3D({ 
  speed = 0.05,
  color1 = 0x00C9FF,
  color2 = 0xFF6B9D
}: Tunnel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    tunnelSegments: THREE.Mesh[];
    animationId?: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.01);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(color1, 2, 50);
    pointLight1.position.set(0, 0, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(color2, 2, 50);
    pointLight2.position.set(0, 0, -10);
    scene.add(pointLight2);

    const tunnelSegments: THREE.Mesh[] = [];
    const segmentCount = 50;
    const segmentSpacing = 3;

    for (let i = 0; i < segmentCount; i++) {
      const geometry = new THREE.TorusGeometry(5, 0.3, 16, 32);
      
      const colorMix = new THREE.Color(color1).lerp(
        new THREE.Color(color2),
        i / segmentCount
      );

      const material = new THREE.MeshStandardMaterial({
        color: colorMix,
        emissive: colorMix,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7
      });

      const segment = new THREE.Mesh(geometry, material);
      segment.position.z = -i * segmentSpacing;
      scene.add(segment);
      tunnelSegments.push(segment);
    }

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 200;
      starPositions[i + 1] = (Math.random() - 0.5) * 200;
      starPositions[i + 2] = -(Math.random() * 200);
    }

    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      tunnelSegments
    };

    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += speed;

      tunnelSegments.forEach((segment, index) => {
        segment.position.z += speed * 2;
        
        if (segment.position.z > 5) {
          segment.position.z = -(segmentCount - 1) * segmentSpacing;
        }

        segment.rotation.z = time + (index * 0.1);

        const scale = 1 + Math.sin(time * 2 + index * 0.5) * 0.1;
        segment.scale.set(scale, scale, 1);
      });

      const starPositions = stars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starPositions.length; i += 3) {
        starPositions[i + 2] += speed * 3;
        if (starPositions[i + 2] > 5) {
          starPositions[i + 2] = -200;
        }
      }
      stars.geometry.attributes.position.needsUpdate = true;

      camera.position.x = Math.sin(time * 0.3) * 0.5;
      camera.position.y = Math.cos(time * 0.2) * 0.5;

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
  }, [speed, color1, color2]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
}
