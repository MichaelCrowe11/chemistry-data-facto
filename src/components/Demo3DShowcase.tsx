import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkle, Atom, ChartBar, Cube, Eye } from '@phosphor-icons/react';
import { Card3D, Button3D, Badge3D } from './Card3D';
import { MolecularViewer3D } from './MolecularViewer3D';
import { DataVisualization3D } from './DataVisualization3D';
import { Button } from './ui/button';

/**
 * Demo Showcase Component
 * Demonstrates all 3D features in one place
 */
export function Demo3DShowcase() {
  const [activeDemo, setActiveDemo] = useState<'cards' | 'molecules' | 'data' | 'all'>('all');

  // Generate sample data for visualization
  const generateSampleData = () => {
    const data = [];
    for (let i = 0; i < 50; i++) {
      data.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        value: Math.random() * 100,
        label: `Point ${i + 1}`
      });
    }
    return data;
  };

  const sampleData = generateSampleData();

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          3D Graphics Showcase
        </h1>
        <p className="text-muted-foreground">
          Explore the new Three.js-powered features
        </p>

        <div className="flex justify-center gap-2">
          <Badge3D color="#00C9FF">Chemistry-Themed</Badge3D>
          <Badge3D color="#FF6B9D">Interactive</Badge3D>
          <Badge3D color="#7C3AED">High Performance</Badge3D>
        </div>
      </motion.div>

      {/* Demo Selector */}
      <div className="flex justify-center gap-2">
        {[
          { id: 'all', label: 'All Features', icon: Sparkle },
          { id: 'cards', label: '3D Cards', icon: Cube },
          { id: 'molecules', label: 'Molecules', icon: Atom },
          { id: 'data', label: 'Data Viz', icon: ChartBar }
        ].map((demo) => {
          const Icon = demo.icon;
          return (
            <Button
              key={demo.id}
              variant={activeDemo === demo.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveDemo(demo.id as any)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {demo.label}
            </Button>
          );
        })}
      </div>

      {/* 3D Cards Demo */}
      {(activeDemo === 'cards' || activeDemo === 'all') && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Cube className="w-6 h-6 text-cyan-400" />
            3D Card Components
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Subtle Intensity */}
            <Card3D intensity="subtle" glowColor="#00C9FF">
              <div className="p-6 space-y-2">
                <h3 className="font-semibold text-cyan-400">Subtle Effect</h3>
                <p className="text-sm text-muted-foreground">
                  Gentle 3D tilt and small particle effects
                </p>
                <div className="pt-2">
                  <Button3D variant="ghost" size="sm">
                    Hover Me
                  </Button3D>
                </div>
              </div>
            </Card3D>

            {/* Medium Intensity */}
            <Card3D intensity="medium" glowColor="#FF6B9D">
              <div className="p-6 space-y-2">
                <h3 className="font-semibold text-pink-400">Medium Effect</h3>
                <p className="text-sm text-muted-foreground">
                  Balanced 3D effects with more particles
                </p>
                <div className="pt-2">
                  <Button3D variant="secondary" size="sm">
                    Click Me
                  </Button3D>
                </div>
              </div>
            </Card3D>

            {/* High Intensity */}
            <Card3D intensity="high" glowColor="#7C3AED">
              <div className="p-6 space-y-2">
                <h3 className="font-semibold text-purple-400">High Effect</h3>
                <p className="text-sm text-muted-foreground">
                  Maximum 3D depth with full particle field
                </p>
                <div className="pt-2">
                  <Button3D variant="primary" size="sm">
                    Try Me
                  </Button3D>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Button Showcase */}
          <div className="p-6 bg-card/50 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">3D Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button3D variant="primary" size="sm">
                Small Primary
              </Button3D>
              <Button3D variant="primary" size="md">
                Medium Primary
              </Button3D>
              <Button3D variant="primary" size="lg">
                Large Primary
              </Button3D>

              <Button3D variant="secondary" size="md">
                Secondary
              </Button3D>
              <Button3D variant="ghost" size="md">
                Ghost
              </Button3D>
            </div>
          </div>
        </motion.section>
      )}

      {/* Molecular Viewer Demo */}
      {(activeDemo === 'molecules' || activeDemo === 'all') && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Atom className="w-6 h-6 text-purple-400" />
            Interactive Molecular Structures
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-96">
              <MolecularViewer3D
                moleculeType="benzene"
                title="Benzene Ring (C₆H₆)"
                showOrbitals={true}
                autoRotate={true}
              />
            </div>

            <div className="h-96">
              <MolecularViewer3D
                moleculeType="water"
                title="Water Molecule (H₂O)"
                showOrbitals={false}
                autoRotate={true}
              />
            </div>

            <div className="h-96">
              <MolecularViewer3D
                moleculeType="methane"
                title="Methane (CH₄)"
                showOrbitals={true}
                autoRotate={false}
              />
            </div>

            <div className="h-96">
              <MolecularViewer3D
                moleculeType="complex"
                title="Complex Molecule"
                showOrbitals={true}
                autoRotate={true}
              />
            </div>
          </div>
        </motion.section>
      )}

      {/* Data Visualization Demo */}
      {(activeDemo === 'data' || activeDemo === 'all') && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ChartBar className="w-6 h-6 text-pink-400" />
            3D Data Visualizations
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-96">
              <DataVisualization3D
                data={sampleData}
                type="scatter"
                title="3D Scatter Plot"
                xLabel="Experiment Time"
                yLabel="Performance"
                zLabel="Memory Usage"
                colorScheme="chemistry"
              />
            </div>

            <div className="h-96">
              <DataVisualization3D
                data={sampleData}
                type="bar"
                title="3D Bar Chart"
                xLabel="Categories"
                yLabel="Values"
                zLabel="Groups"
                colorScheme="heat"
              />
            </div>

            <div className="h-96">
              <DataVisualization3D
                data={sampleData}
                type="surface"
                title="3D Surface Plot"
                xLabel="X Axis"
                yLabel="Y Axis"
                zLabel="Z Axis"
                colorScheme="cool"
              />
            </div>

            <div className="h-96">
              <DataVisualization3D
                data={sampleData.map(d => ({ ...d, value: Math.sin(d.x * 10) * Math.cos(d.z * 10) * 50 + 50 }))}
                type="scatter"
                title="Wave Function"
                xLabel="Position X"
                yLabel="Amplitude"
                zLabel="Position Z"
                colorScheme="default"
              />
            </div>
          </div>
        </motion.section>
      )}

      {/* Features List */}
      {activeDemo === 'all' && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Eye className="w-6 h-6 text-cyan-400" />
            All Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Molecular Background',
                description: 'Animated particle field with DNA helices and floating molecules',
                color: '#00C9FF'
              },
              {
                title: 'Enhanced Welcome Screen',
                description: '3D molecular structures with parallax mouse tracking',
                color: '#FF6B9D'
              },
              {
                title: 'Page Transitions',
                description: 'Camera-based 3D transitions between different views',
                color: '#7C3AED'
              },
              {
                title: '3D File Tree',
                description: 'Toggle between list view and 3D node graph visualization',
                color: '#10B981'
              },
              {
                title: 'Interactive Cards',
                description: 'Tilt effects, particle animations, and glow borders',
                color: '#F59E0B'
              },
              {
                title: 'Performance Panel',
                description: 'Real-time FPS monitoring with quality presets and custom settings',
                color: '#EF4444'
              }
            ].map((feature, index) => (
              <Card3D key={index} intensity="medium" glowColor={feature.color}>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold" style={{ color: feature.color }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card3D>
            ))}
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <motion.div
        className="text-center py-8 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p>Built with Three.js, Framer Motion, and React</p>
        <p className="mt-2">
          Press{' '}
          <kbd className="px-2 py-1 bg-muted rounded text-foreground">⚙️</kbd>
          {' '}in the top bar to access Performance Settings
        </p>
      </motion.div>
    </div>
  );
}
