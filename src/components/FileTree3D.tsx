import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Cube, ListBullets } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createAtom, createBond, setupChemistryLighting } from '../lib/three-utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTree3DProps {
  files: FileNode[];
  onFileSelect: (path: string) => void;
  currentFile?: string;
}

/**
 * 3D File Tree Visualization
 * Displays file structure as an interactive 3D node graph
 */
export function FileTree3D({ files, onFileSelect, currentFile }: FileTree3DProps) {
  const [is3DMode, setIs3DMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    nodes: Map<string, THREE.Group>;
    animationId?: number;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  } | null>(null);

  useEffect(() => {
    if (!is3DMode || !containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    setupChemistryLighting(scene);

    const nodes = new Map<string, THREE.Group>();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Build 3D tree structure
    const buildTree = (
      fileNodes: FileNode[],
      parentPos: THREE.Vector3,
      depth: number = 0,
      angleOffset: number = 0
    ) => {
      const radius = 5 + depth * 3;
      const angleStep = (Math.PI * 2) / Math.max(fileNodes.length, 1);

      fileNodes.forEach((node, index) => {
        const angle = angleOffset + index * angleStep;
        const x = Math.cos(angle) * radius;
        const y = -depth * 4;
        const z = Math.sin(angle) * radius;

        const position = new THREE.Vector3(x, y, z);

        // Create node visualization
        const nodeGroup = createAtom(
          node.type === 'folder' ? 'N' : 'C',
          node.type === 'folder' ? 0.6 : 0.4,
          position
        );

        // Add label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = '#ffffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(node.name, 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.y = 1;
        nodeGroup.add(sprite);

        // Store reference
        (nodeGroup as any).userData = { path: node.path, type: node.type };
        nodes.set(node.path, nodeGroup);
        scene.add(nodeGroup);

        // Create connection to parent
        if (depth > 0) {
          const bond = createBond(parentPos, position, 0x00C9FF, 0.05);
          scene.add(bond);
        }

        // Recursively build children
        if (node.children && node.children.length > 0) {
          buildTree(node.children, position, depth + 1, angle);
        }
      });
    };

    buildTree(files, new THREE.Vector3(0, 0, 0));

    // Highlight current file
    if (currentFile && nodes.has(currentFile)) {
      const node = nodes.get(currentFile)!;
      const highlight = new THREE.Mesh(
        new THREE.RingGeometry(0.8, 1, 32),
        new THREE.MeshBasicMaterial({ color: 0x00C9FF, side: THREE.DoubleSide })
      );
      node.add(highlight);
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      nodes,
      raycaster,
      mouse
    };

    // Mouse interaction
    const handleMouseClick = (event: MouseEvent) => {
      if (!sceneRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !object.userData.path) {
          object = object.parent as THREE.Object3D;
        }

        if (object.userData.path && object.userData.type === 'file') {
          onFileSelect(object.userData.path);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!sceneRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);

      // Reset all node scales
      nodes.forEach(node => {
        node.scale.setScalar(1);
      });

      // Highlight hovered node
      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !object.userData.path) {
          object = object.parent as THREE.Object3D;
        }

        if (object.userData.path) {
          const node = nodes.get(object.userData.path);
          if (node) {
            node.scale.setScalar(1.3);
          }
        }
      }
    };

    containerRef.current.addEventListener('click', handleMouseClick);
    containerRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.01;

      // Rotate entire tree slowly
      nodes.forEach((node, path) => {
        node.rotation.y += 0.002;
      });

      // Camera orbit
      camera.position.x = Math.sin(time * 0.1) * 25;
      camera.position.z = Math.cos(time * 0.1) * 25;
      camera.lookAt(0, -5, 0);

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleMouseClick);
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }

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
  }, [is3DMode, files, currentFile, onFileSelect]);

  return (
    <div className="h-full flex flex-col">
      {/* Toggle Button */}
      <div className="p-2 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIs3DMode(!is3DMode)}
          className="w-full gap-2"
        >
          {is3DMode ? (
            <>
              <ListBullets className="w-4 h-4" />
              Switch to List View
            </>
          ) : (
            <>
              <Cube className="w-4 h-4" />
              Switch to 3D View
            </>
          )}
        </Button>
      </div>

      {/* 3D Visualization or fallback */}
      {is3DMode ? (
        <motion.div
          ref={containerRef}
          className="flex-1 relative bg-gradient-to-b from-background to-background/50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-2 left-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
            Click nodes to open files • Drag to rotate
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 p-4 text-sm text-muted-foreground">
          <p>Traditional file tree view would go here</p>
          <p className="text-xs mt-2">Toggle 3D mode to see interactive visualization</p>
        </div>
      )}
    </div>
  );
}
