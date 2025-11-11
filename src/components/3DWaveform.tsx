import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WaveformProps {
  amplitude?: number;
  frequency?: number;
  color?: number;
}

export function Waveform3D({ 
  amplitude = 5,
  frequency = 0.5,
  color = 0x00C9FF 
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    waves: THREE.Line[];
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
    camera.position.set(0, 10, 20);
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const waves: THREE.Line[] = [];
    const waveCount = 10;
    const pointsPerWave = 100;

    const colorGradient = new THREE.Color(color);

    for (let w = 0; w < waveCount; w++) {
      const points: THREE.Vector3[] = [];
      
      for (let i = 0; i < pointsPerWave; i++) {
        const x = (i / pointsPerWave) * 40 - 20;
        const y = 0;
        const z = w * 2 - waveCount;
        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const hsl = { h: 0, s: 0, l: 0 };
      colorGradient.getHSL(hsl);
      const waveColor = new THREE.Color().setHSL(
        hsl.h + (w / waveCount) * 0.2,
        1,
        0.5
      );

      const material = new THREE.LineBasicMaterial({ 
        color: waveColor,
        transparent: true,
        opacity: 0.6 + (w / waveCount) * 0.4
      });

      const wave = new THREE.Line(geometry, material);
      scene.add(wave);
      waves.push(wave);
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      waves
    };

    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.05;

      waves.forEach((wave, waveIndex) => {
        const positions = wave.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const offset = waveIndex * 0.5;
          positions[i + 1] = 
            Math.sin(x * frequency + time + offset) * amplitude +
            Math.sin(x * frequency * 2 + time * 1.5 + offset) * (amplitude * 0.5);
        }
        
        wave.geometry.attributes.position.needsUpdate = true;
      });

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
          if (object instanceof THREE.Line) {
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
  }, [amplitude, frequency, color]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
}
