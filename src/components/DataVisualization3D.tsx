import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ChartBar, ChartScatter, Cube } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { setupChemistryLighting, createAtom } from '../lib/three-utils';

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
  label?: string;
}

interface DataVisualization3DProps {
  data: DataPoint[];
  type?: 'bar' | 'scatter' | 'surface';
  title?: string;
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  colorScheme?: 'default' | 'heat' | 'cool' | 'chemistry';
}

/**
 * 3D Data Visualization Component
 * Displays experiment results and performance metrics in 3D space
 */
export function DataVisualization3D({
  data,
  type = 'scatter',
  title = '3D Data Visualization',
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  zLabel = 'Z Axis',
  colorScheme = 'chemistry'
}: DataVisualization3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vizType, setVizType] = useState(type);
  const [isRotating, setIsRotating] = useState(true);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dataObjects: THREE.Object3D[];
    animationId?: number;
    mouse: {
      isDown: boolean;
      startX: number;
      startY: number;
    };
    cameraRotation: { x: number; y: number };
  } | null>(null);

  const getColorFromValue = (value: number, min: number, max: number): number => {
    const normalized = (value - min) / (max - min);

    if (colorScheme === 'heat') {
      // Red to yellow to white
      if (normalized < 0.5) {
        return new THREE.Color().setHSL(0, 1, 0.5 + normalized).getHex();
      } else {
        return new THREE.Color().setHSL(0.15, 1 - (normalized - 0.5), 0.5 + normalized * 0.5).getHex();
      }
    } else if (colorScheme === 'cool') {
      // Blue to cyan to white
      return new THREE.Color().setHSL(0.5 + normalized * 0.2, 1 - normalized * 0.3, 0.3 + normalized * 0.5).getHex();
    } else if (colorScheme === 'chemistry') {
      // Chemistry-themed colors
      const colors = [0x3050F8, 0x00C9FF, 0x10B981, 0xFFFF30, 0xFF8000, 0xFF0D0D];
      const index = Math.floor(normalized * (colors.length - 1));
      const nextIndex = Math.min(index + 1, colors.length - 1);
      const t = (normalized * (colors.length - 1)) - index;

      const color1 = new THREE.Color(colors[index]);
      const color2 = new THREE.Color(colors[nextIndex]);
      return color1.lerp(color2, t).getHex();
    } else {
      // Default gradient
      return new THREE.Color().setHSL(0.6 - normalized * 0.3, 0.8, 0.5).getHex();
    }
  };

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Initialize scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    setupChemistryLighting(scene);

    // Create axes
    const axisLength = 10;
    const axesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });

    const xAxis = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0)
    ]);
    const yAxis = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0),
      new THREE.Vector3(0, axisLength, 0)
    ]);
    const zAxis = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength)
    ]);

    scene.add(new THREE.Line(xAxis, axesMaterial));
    scene.add(new THREE.Line(yAxis, axesMaterial));
    scene.add(new THREE.Line(zAxis, axesMaterial));

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x00C9FF, 0x1A1F3A);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Find data bounds
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Create data visualization
    const dataObjects: THREE.Object3D[] = [];

    if (vizType === 'scatter') {
      // Scatter plot
      data.forEach(point => {
        const normalizedPos = {
          x: (point.x - 0.5) * 15,
          y: (point.y - 0.5) * 15,
          z: (point.z - 0.5) * 15
        };

        const color = getColorFromValue(point.value, minValue, maxValue);
        const size = 0.3 + (point.value - minValue) / (maxValue - minValue) * 0.5;

        const sphere = createAtom('C', size, new THREE.Vector3(normalizedPos.x, normalizedPos.y, normalizedPos.z));
        sphere.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshPhongMaterial).color.setHex(color);
            (child.material as THREE.MeshPhongMaterial).emissive.setHex(color);
          }
        });

        scene.add(sphere);
        dataObjects.push(sphere);
      });
    } else if (vizType === 'bar') {
      // 3D Bar chart
      data.forEach(point => {
        const normalizedPos = {
          x: (point.x - 0.5) * 15,
          z: (point.z - 0.5) * 15
        };

        const height = (point.value - minValue) / (maxValue - minValue) * 10 + 0.5;
        const color = getColorFromValue(point.value, minValue, maxValue);

        const geometry = new THREE.BoxGeometry(0.8, height, 0.8);
        const material = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.3,
          shininess: 100
        });

        const bar = new THREE.Mesh(geometry, material);
        bar.position.set(normalizedPos.x, height / 2, normalizedPos.z);

        // Glow outline
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        bar.add(wireframe);

        scene.add(bar);
        dataObjects.push(bar);
      });
    } else if (vizType === 'surface') {
      // Surface plot (simplified)
      const gridSize = Math.ceil(Math.sqrt(data.length));

      for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const normalizedPos = {
          x: (point.x - 0.5) * 15,
          y: (point.value - minValue) / (maxValue - minValue) * 5,
          z: (point.z - 0.5) * 15
        };

        const color = getColorFromValue(point.value, minValue, maxValue);
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(normalizedPos.x, normalizedPos.y, normalizedPos.z);
        scene.add(sphere);
        dataObjects.push(sphere);

        // Connect to neighbors
        if (i > 0 && i % gridSize !== 0) {
          const prevPoint = data[i - 1];
          const prevPos = {
            x: (prevPoint.x - 0.5) * 15,
            y: (prevPoint.value - minValue) / (maxValue - minValue) * 5,
            z: (prevPoint.z - 0.5) * 15
          };

          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(prevPos.x, prevPos.y, prevPos.z),
            new THREE.Vector3(normalizedPos.x, normalizedPos.y, normalizedPos.z)
          ]);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x00C9FF, opacity: 0.3, transparent: true });
          const line = new THREE.Line(lineGeom, lineMat);
          scene.add(line);
        }
      }
    }

    const mouse = {
      isDown: false,
      startX: 0,
      startY: 0
    };

    const cameraRotation = { x: Math.PI / 4, y: Math.PI / 4 };

    sceneRef.current = {
      scene,
      camera,
      renderer,
      dataObjects,
      mouse,
      cameraRotation
    };

    // Mouse controls
    const handleMouseDown = (e: MouseEvent) => {
      mouse.isDown = true;
      mouse.startX = e.clientX;
      mouse.startY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouse.isDown) return;

      const deltaX = e.clientX - mouse.startX;
      const deltaY = e.clientY - mouse.startY;

      cameraRotation.y += deltaX * 0.01;
      cameraRotation.x += deltaY * 0.01;

      cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

      mouse.startX = e.clientX;
      mouse.startY = e.clientY;
    };

    const handleMouseUp = () => {
      mouse.isDown = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;

      // Update camera position
      if (isRotating && !mouse.isDown) {
        cameraRotation.y += 0.002;
      }

      const radius = 20;
      camera.position.x = radius * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
      camera.position.y = radius * Math.sin(cameraRotation.x);
      camera.position.z = radius * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
      camera.lookAt(0, 0, 0);

      // Animate data objects slightly
      dataObjects.forEach((obj, index) => {
        obj.rotation.y += 0.005;
      });

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
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
  }, [data, vizType, isRotating, colorScheme]);

  return (
    <motion.div
      className="h-full flex flex-col bg-card/50 backdrop-blur border border-border rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card/80">
        <h3 className="text-sm font-semibold">{title}</h3>

        <div className="flex items-center gap-1">
          <Button
            variant={vizType === 'scatter' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVizType('scatter')}
            className="h-7 px-2"
          >
            <ChartScatter className="w-4 h-4" />
          </Button>

          <Button
            variant={vizType === 'bar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVizType('bar')}
            className="h-7 px-2"
          >
            <ChartBar className="w-4 h-4" />
          </Button>

          <Button
            variant={vizType === 'surface' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVizType('surface')}
            className="h-7 px-2"
          >
            <Cube className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRotating(!isRotating)}
            className="h-7 px-2 text-xs"
          >
            {isRotating ? 'Pause' : 'Rotate'}
          </Button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gradient-to-br from-background/50 to-background/80"
      >
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No data to visualize
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
            Drag to rotate • {data.length} data points
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-2 border-t border-border bg-card/80 flex items-center justify-between text-xs">
        <div className="flex gap-3">
          <span className="text-cyan-400">{xLabel}</span>
          <span className="text-purple-400">{yLabel}</span>
          <span className="text-pink-400">{zLabel}</span>
        </div>
        <span className="text-muted-foreground">{vizType} mode</span>
      </div>
    </motion.div>
  );
}
