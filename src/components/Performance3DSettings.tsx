import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gear, Lightning, Eye, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as RadixSwitch from '@radix-ui/react-switch';

export interface Performance3DConfig {
  backgroundIntensity: 'low' | 'medium' | 'high';
  particleCount: 'minimal' | 'balanced' | 'maximum';
  enableBloom: boolean;
  enableParallax: boolean;
  enableTransitions: boolean;
  antialiasing: boolean;
  pixelRatio: 'auto' | '1' | '2';
}

const DEFAULT_CONFIG: Performance3DConfig = {
  backgroundIntensity: 'high',
  particleCount: 'maximum',
  enableBloom: true,
  enableParallax: true,
  enableTransitions: true,
  antialiasing: true,
  pixelRatio: 'auto'
};

interface Performance3DSettingsProps {
  onConfigChange?: (config: Performance3DConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Performance Settings Panel for 3D Graphics
 * Allows users to adjust visual quality and performance settings
 */
export function Performance3DSettings({
  onConfigChange,
  isOpen,
  onClose
}: Performance3DSettingsProps) {
  const [config, setConfig] = useState<Performance3DConfig>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('3d-performance-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [fps, setFps] = useState(60);

  // Monitor FPS
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance || typeof window.performance.now !== 'function') {
      return;
    }

    let frameCount = 0;
    let lastTime = window.performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = window.performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    const animationId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Save config and notify parent
  useEffect(() => {
    localStorage.setItem('3d-performance-config', JSON.stringify(config));
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const updateConfig = <K extends keyof Performance3DConfig>(
    key: K,
    value: Performance3DConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getPerformanceLevel = () => {
    if (fps >= 55) return { level: 'Excellent', color: 'text-green-400', badge: 'bg-green-500' };
    if (fps >= 40) return { level: 'Good', color: 'text-yellow-400', badge: 'bg-yellow-500' };
    if (fps >= 25) return { level: 'Fair', color: 'text-orange-400', badge: 'bg-orange-500' };
    return { level: 'Poor', color: 'text-red-400', badge: 'bg-red-500' };
  };

  const performance = getPerformanceLevel();

  const presets = [
    {
      name: 'Ultra',
      icon: Sparkle,
      config: {
        backgroundIntensity: 'high' as const,
        particleCount: 'maximum' as const,
        enableBloom: true,
        enableParallax: true,
        enableTransitions: true,
        antialiasing: true,
        pixelRatio: 'auto' as const
      }
    },
    {
      name: 'High',
      icon: Lightning,
      config: {
        backgroundIntensity: 'medium' as const,
        particleCount: 'balanced' as const,
        enableBloom: true,
        enableParallax: true,
        enableTransitions: true,
        antialiasing: true,
        pixelRatio: '2' as const
      }
    },
    {
      name: 'Balanced',
      icon: Eye,
      config: {
        backgroundIntensity: 'medium' as const,
        particleCount: 'balanced' as const,
        enableBloom: false,
        enableParallax: true,
        enableTransitions: true,
        antialiasing: true,
        pixelRatio: '1' as const
      }
    },
    {
      name: 'Performance',
      icon: Lightning,
      config: {
        backgroundIntensity: 'low' as const,
        particleCount: 'minimal' as const,
        enableBloom: false,
        enableParallax: false,
        enableTransitions: true,
        antialiasing: false,
        pixelRatio: '1' as const
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card border border-border rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-2">
            <Gear className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">3D Graphics Settings</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">FPS:</span>
            <Badge className={`${performance.badge} text-white`}>
              {fps}
            </Badge>
            <span className={`text-xs ${performance.color}`}>
              {performance.level}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold mb-3">Quality Presets</h3>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => {
              const Icon = preset.icon;
              return (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(preset.config)}
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{preset.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Detailed Settings */}
        <div className="p-4 space-y-4">
          {/* Background Intensity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Background Intensity</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Button
                  key={level}
                  variant={config.backgroundIntensity === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig('backgroundIntensity', level)}
                  className="flex-1 capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Controls the number of particles and effects in the background
            </p>
          </div>

          {/* Particle Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Particle Count</label>
            <div className="flex gap-2">
              {(['minimal', 'balanced', 'maximum'] as const).map((level) => (
                <Button
                  key={level}
                  variant={config.particleCount === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig('particleCount', level)}
                  className="flex-1 capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Number of particles rendered in 3D scenes
            </p>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-3">
            <SettingToggle
              label="Bloom Effects"
              description="Adds glowing effects to 3D elements"
              checked={config.enableBloom}
              onCheckedChange={(checked) => updateConfig('enableBloom', checked)}
            />

            <SettingToggle
              label="Parallax Mouse Tracking"
              description="Camera follows mouse movement for depth effect"
              checked={config.enableParallax}
              onCheckedChange={(checked) => updateConfig('enableParallax', checked)}
            />

            <SettingToggle
              label="Page Transitions"
              description="3D transitions when switching between views"
              checked={config.enableTransitions}
              onCheckedChange={(checked) => updateConfig('enableTransitions', checked)}
            />

            <SettingToggle
              label="Anti-aliasing"
              description="Smooths jagged edges (performance impact)"
              checked={config.antialiasing}
              onCheckedChange={(checked) => updateConfig('antialiasing', checked)}
            />
          </div>

          {/* Pixel Ratio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Render Quality</label>
            <div className="flex gap-2">
              {(['auto', '1', '2'] as const).map((ratio) => (
                <Button
                  key={ratio}
                  variant={config.pixelRatio === ratio ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig('pixelRatio', ratio)}
                  className="flex-1 uppercase"
                >
                  {ratio === 'auto' ? 'Auto' : `${ratio}x`}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Higher values = sharper but more demanding
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfig(DEFAULT_CONFIG)}
          >
            Reset to Default
          </Button>

          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingToggle({ label, description, checked, onCheckedChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>

      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary transition-colors"
      >
        <RadixSwitch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
    </div>
  );
}

/**
 * Hook to use 3D performance config in components
 */
export function usePerformance3DConfig(): Performance3DConfig {
  const [config, setConfig] = useState<Performance3DConfig>(() => {
    const saved = localStorage.getItem('3d-performance-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('3d-performance-config');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return config;
}
