import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface NetworkNode {
  id: string;
  label: string;
  connections: string[];
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
}

export function NetworkGraph3D({ nodes }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    nodeObjects: Map<string, THREE.Mesh>;
    animationId?: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00C9FF, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const nodeObjects = new Map<string, THREE.Mesh>();
    const nodeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    const colors = [0x00C9FF, 0xFF6B9D, 0x7C3AED, 0x10B981, 0xF59E0B];
    
    nodes.forEach((node, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: colors[index % colors.length],
        emissive: colors[index % colors.length],
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2
      });

      const mesh = new THREE.Mesh(nodeGeometry, material);
      
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = 10;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 10,
        Math.sin(angle) * radius
      );

      scene.add(mesh);
      nodeObjects.set(node.id, mesh);
    });

    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00C9FF, 
      transparent: true, 
      opacity: 0.3 
    });

    nodes.forEach(node => {
      const sourceNode = nodeObjects.get(node.id);
      if (!sourceNode) return;

      node.connections.forEach(targetId => {
        const targetNode = nodeObjects.get(targetId);
        if (!targetNode) return;

        const points = [sourceNode.position, targetNode.position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
      });
    });

    sceneRef.current = {
      scene,
      camera,
      renderer,
      nodeObjects
    };

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      targetRotationY = mouseX * Math.PI;
      targetRotationX = mouseY * Math.PI;
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.01;

      nodeObjects.forEach((mesh, id) => {
        mesh.position.y += Math.sin(time + parseInt(id, 36)) * 0.01;
        mesh.rotation.y += 0.01;
      });

      scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.05;
      scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.05;

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
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
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
  }, [nodes]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
}
