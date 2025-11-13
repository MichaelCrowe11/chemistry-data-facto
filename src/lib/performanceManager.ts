/**
 * Enhanced Performance Manager
 * Adaptive quality system with FPS monitoring and LOD management
 */

import { useEffect, useRef, useState } from 'react'

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra'

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  memoryUsage: number
}

export interface QualitySettings {
  tier: QualityTier
  particleCount: number
  shadowQuality: 'none' | 'low' | 'medium' | 'high'
  postProcessing: boolean
  antialiasing: boolean
  reflections: boolean
  animationQuality: number // 0-1
  renderScale: number // 0.5-1.0
  maxLights: number
  textureQuality: 'low' | 'medium' | 'high'
}

export interface PerformanceManagerConfig {
  targetFPS: number
  minFPS: number
  maxFPS: number
  adaptiveQuality: boolean
  debugMode: boolean
  measureInterval: number // ms
  adjustmentThreshold: number // frames below target before adjustment
}

const DEFAULT_CONFIG: PerformanceManagerConfig = {
  targetFPS: 60,
  minFPS: 30,
  maxFPS: 120,
  adaptiveQuality: true,
  debugMode: false,
  measureInterval: 1000,
  adjustmentThreshold: 30 // 0.5 seconds at 60fps
}

const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  low: {
    tier: 'low',
    particleCount: 50,
    shadowQuality: 'none',
    postProcessing: false,
    antialiasing: false,
    reflections: false,
    animationQuality: 0.5,
    renderScale: 0.75,
    maxLights: 2,
    textureQuality: 'low'
  },
  medium: {
    tier: 'medium',
    particleCount: 150,
    shadowQuality: 'low',
    postProcessing: false,
    antialiasing: true,
    reflections: false,
    animationQuality: 0.75,
    renderScale: 0.85,
    maxLights: 4,
    textureQuality: 'medium'
  },
  high: {
    tier: 'high',
    particleCount: 300,
    shadowQuality: 'medium',
    postProcessing: true,
    antialiasing: true,
    reflections: true,
    animationQuality: 1.0,
    renderScale: 1.0,
    maxLights: 6,
    textureQuality: 'high'
  },
  ultra: {
    tier: 'ultra',
    particleCount: 500,
    shadowQuality: 'high',
    postProcessing: true,
    antialiasing: true,
    reflections: true,
    animationQuality: 1.0,
    renderScale: 1.0,
    maxLights: 8,
    textureQuality: 'high'
  }
}

export class PerformanceManager {
  private config: PerformanceManagerConfig
  private metrics: PerformanceMetrics
  private currentQuality: QualitySettings
  private fpsHistory: number[]
  private poorFrameCount: number
  private lastAdjustmentTime: number
  private listeners: Set<(quality: QualitySettings) => void>

  constructor(config: Partial<PerformanceManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0
    }

    // Auto-detect initial quality based on device
    const initialTier = this.detectDeviceCapability()
    this.currentQuality = QUALITY_PRESETS[initialTier]

    this.fpsHistory = []
    this.poorFrameCount = 0
    this.lastAdjustmentTime = Date.now()
    this.listeners = new Set()

    this.log('Performance Manager initialized', { initialTier, config: this.config })
  }

  /**
   * Detect device capability for initial quality setting
   */
  private detectDeviceCapability(): QualityTier {
    // Check for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    if (isMobile) {
      return 'low'
    }

    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4

    // Check device memory (if available)
    const memory = (navigator as any).deviceMemory || 4

    // Check GPU tier (basic heuristic based on WebGL)
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) {
      return 'low'
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : 'unknown'

    // Heuristic scoring
    let score = 0

    if (cores >= 8) score += 2
    else if (cores >= 4) score += 1

    if (memory >= 8) score += 2
    else if (memory >= 4) score += 1

    if (renderer.includes('NVIDIA') || renderer.includes('AMD')) score += 2
    else if (renderer.includes('Intel')) score += 1

    // Determine tier
    if (score >= 5) return 'ultra'
    if (score >= 3) return 'high'
    if (score >= 1) return 'medium'
    return 'low'
  }

  /**
   * Update performance metrics
   */
  updateMetrics(delta: number, renderer?: any) {
    const fps = 1000 / delta
    this.metrics.fps = fps
    this.metrics.frameTime = delta

    if (renderer) {
      const info = renderer.info
      this.metrics.drawCalls = info.render.calls
      this.metrics.triangles = info.render.triangles

      if (info.memory) {
        this.metrics.memoryUsage = info.memory.geometries + info.memory.textures
      }
    }

    // Update FPS history
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift()
    }

    // Track poor performance
    if (fps < this.config.targetFPS - 10) {
      this.poorFrameCount++
    } else {
      this.poorFrameCount = Math.max(0, this.poorFrameCount - 1)
    }

    // Adaptive quality adjustment
    if (this.config.adaptiveQuality) {
      this.checkAndAdjustQuality()
    }
  }

  /**
   * Check if quality adjustment is needed
   */
  private checkAndAdjustQuality() {
    const now = Date.now()
    const timeSinceAdjustment = now - this.lastAdjustmentTime

    // Only adjust every 2 seconds minimum
    if (timeSinceAdjustment < 2000) return

    const avgFps = this.getAverageFPS()

    // Downgrade if consistently below target
    if (
      this.poorFrameCount > this.config.adjustmentThreshold &&
      avgFps < this.config.targetFPS - 10
    ) {
      this.downgradeQuality()
      this.poorFrameCount = 0
      this.lastAdjustmentTime = now
    }

    // Upgrade if consistently above target with headroom
    else if (
      avgFps > this.config.targetFPS + 20 &&
      this.poorFrameCount === 0 &&
      timeSinceAdjustment > 5000
    ) {
      this.upgradeQuality()
      this.lastAdjustmentTime = now
    }
  }

  /**
   * Downgrade quality tier
   */
  private downgradeQuality() {
    const tiers: QualityTier[] = ['ultra', 'high', 'medium', 'low']
    const currentIndex = tiers.indexOf(this.currentQuality.tier)

    if (currentIndex < tiers.length - 1) {
      const newTier = tiers[currentIndex + 1]
      this.setQuality(newTier)
      this.log('Quality downgraded', { from: this.currentQuality.tier, to: newTier })
    } else {
      // Already at lowest, reduce specific settings
      this.currentQuality.particleCount = Math.max(10, this.currentQuality.particleCount * 0.75)
      this.currentQuality.renderScale = Math.max(0.5, this.currentQuality.renderScale * 0.9)
      this.notifyListeners()
      this.log('Quality reduced further', { settings: this.currentQuality })
    }
  }

  /**
   * Upgrade quality tier
   */
  private upgradeQuality() {
    const tiers: QualityTier[] = ['low', 'medium', 'high', 'ultra']
    const currentIndex = tiers.indexOf(this.currentQuality.tier)

    if (currentIndex < tiers.length - 1) {
      const newTier = tiers[currentIndex + 1]
      this.setQuality(newTier)
      this.log('Quality upgraded', { from: this.currentQuality.tier, to: newTier })
    }
  }

  /**
   * Set quality tier manually
   */
  setQuality(tier: QualityTier) {
    this.currentQuality = { ...QUALITY_PRESETS[tier] }
    this.notifyListeners()
  }

  /**
   * Get current quality settings
   */
  getQuality(): QualitySettings {
    return { ...this.currentQuality }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return sum / this.fpsHistory.length
  }

  /**
   * Subscribe to quality changes
   */
  onChange(callback: (quality: QualitySettings) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentQuality))
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any) {
    if (this.config.debugMode) {
      console.log(`[PerformanceManager] ${message}`, data)
    }
  }

  /**
   * Get performance grade
   */
  getPerformanceGrade(): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgFps = this.getAverageFPS()

    if (avgFps >= this.config.targetFPS) return 'excellent'
    if (avgFps >= this.config.targetFPS * 0.8) return 'good'
    if (avgFps >= this.config.minFPS) return 'fair'
    return 'poor'
  }

  /**
   * Get recommended settings for specific component
   */
  getComponentSettings(componentType: 'particles' | 'lights' | 'shadows' | 'postfx') {
    switch (componentType) {
      case 'particles':
        return {
          count: this.currentQuality.particleCount,
          quality: this.currentQuality.tier
        }
      case 'lights':
        return {
          max: this.currentQuality.maxLights,
          shadows: this.currentQuality.shadowQuality !== 'none'
        }
      case 'shadows':
        return {
          enabled: this.currentQuality.shadowQuality !== 'none',
          quality: this.currentQuality.shadowQuality
        }
      case 'postfx':
        return {
          enabled: this.currentQuality.postProcessing,
          bloom: this.currentQuality.tier !== 'low',
          ssao: this.currentQuality.tier === 'ultra'
        }
    }
  }

  /**
   * Force garbage collection hint (for manual cleanup)
   */
  cleanup() {
    this.fpsHistory = []
    this.listeners.clear()
  }
}

/**
 * React hook for performance management
 */
export function usePerformanceManager(config?: Partial<PerformanceManagerConfig>) {
  const [manager] = useState(() => new PerformanceManager(config))
  const [quality, setQuality] = useState<QualitySettings>(manager.getQuality())
  const [metrics, setMetrics] = useState<PerformanceMetrics>(manager.getMetrics())

  useEffect(() => {
    const unsubscribe = manager.onChange(setQuality)
    return unsubscribe
  }, [manager])

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(manager.getMetrics())
    }, config?.measureInterval || 1000)

    return () => clearInterval(interval)
  }, [manager, config?.measureInterval])

  return {
    manager,
    quality,
    metrics,
    setQuality: (tier: QualityTier) => manager.setQuality(tier),
    getPerformanceGrade: () => manager.getPerformanceGrade()
  }
}

/**
 * Performance monitor component (debug overlay)
 */
export function PerformanceMonitor({
  manager,
  position = 'top-right'
}: {
  manager: PerformanceManager
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}) {
  const [metrics, setMetrics] = useState(manager.getMetrics())
  const [quality, setQuality] = useState(manager.getQuality())

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(manager.getMetrics())
      setQuality(manager.getQuality())
    }, 100)

    return () => clearInterval(interval)
  }, [manager])

  const positionClass = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }[position]

  const grade = manager.getPerformanceGrade()
  const gradeColor = {
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400'
  }[grade]

  return (
    <div
      className={`fixed ${positionClass} bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg font-mono text-sm z-50`}
    >
      <div className="space-y-2">
        <div className="font-bold border-b border-white/20 pb-2">Performance</div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">FPS:</span>
          <span className={gradeColor}>{Math.round(metrics.fps)}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Frame Time:</span>
          <span>{metrics.frameTime.toFixed(2)}ms</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Quality:</span>
          <span className="capitalize">{quality.tier}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Particles:</span>
          <span>{quality.particleCount}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Render Scale:</span>
          <span>{(quality.renderScale * 100).toFixed(0)}%</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Draw Calls:</span>
          <span>{metrics.drawCalls}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Triangles:</span>
          <span>{(metrics.triangles / 1000).toFixed(1)}K</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-white/60">Grade:</span>
          <span className={`${gradeColor} capitalize`}>{grade}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Singleton instance for global usage
 */
export const globalPerformanceManager = new PerformanceManager({
  adaptiveQuality: true,
  debugMode: import.meta.env.DEV
})
