/**
 * Cinematic Components Index
 * Central export point for all 3D cinematic components
 */

// Core Components
export { NeuralNetwork } from './NeuralNetwork'
export { MycelialNetwork, AnimatedMycelialGrowth, InteractiveMycelialGrowth } from './MycelialNetwork'

// Particle Systems
export {
  CodeFragments,
  FloatingCodeFragments,
  AssemblingCode,
  ExplodingCode,
  MatrixRain,
  TexturedCodeFragments
} from './CodeFragments'

export {
  SporeSystem,
  DriftingSpores,
  SporeRelease,
  SporeSwarm,
  SporeBurst,
  FruitingBody
} from './SporeSystem'

// Focal Elements
export {
  ObsidianOrb,
  CroweCodeOrb,
  StaticObsidianOrb,
  MiniObsidianOrb
} from './ObsidianOrb'

// Cinematic Sequences
export {
  CinematicIntro,
  CroweCinematicIntro,
  SynapseCinematicIntro,
  QuickIntro
} from './CinematicIntro'

// Interactive Effects
export {
  ElectricTrail,
  BioluminescentTrail,
  HoverGlow,
  ClickRipple,
  CursorAttraction,
  InteractivePlatformEffects
} from './InteractiveEffects'

// Types
export type { QualityTier, PerformanceMetrics, QualitySettings } from '@/lib/performanceManager'
