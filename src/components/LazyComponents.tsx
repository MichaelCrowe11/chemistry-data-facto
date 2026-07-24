import { lazy } from 'react'

// Lazy load heavy 3D components
export const MolecularBackground = lazy(() => import('@/components/MolecularBackground').then(m => ({ default: m.MolecularBackground })))
export const Enhanced3DWelcome = lazy(() => import('@/components/Enhanced3DWelcome').then(m => ({ default: m.Enhanced3DWelcome })))
export const Gallery3D = lazy(() => import('@/components/3DGallery').then(m => ({ default: m.Gallery3D })))
export const VRCodeSpace = lazy(() => import('@/components/VRCodeSpace').then(m => ({ default: m.VRCodeSpace })))
export const ARCodeOverlay = lazy(() => import('@/components/ARCodeOverlay').then(m => ({ default: m.ARCodeOverlay })))
export const VRWorkspace = lazy(() => import('@/components/VRWorkspace').then(m => ({ default: m.VRWorkspace })))
export const HolographicCodeViz = lazy(() => import('@/components/HolographicCodeViz').then(m => ({ default: m.HolographicCodeViz })))
export const CodeDNASequencer = lazy(() => import('@/components/CodeDNASequencer').then(m => ({ default: m.CodeDNASequencer })))
export const DataVisualization3D = lazy(() => import('@/components/DataVisualization3D').then(m => ({ default: m.DataVisualization3D })))

// Lazy load AI/ML features
export const AIChatPanel = lazy(() => import('@/components/AIChatPanel').then(m => ({ default: m.AIChatPanel })))
export const AIPredictionPanel = lazy(() => import('@/components/AIPredictionPanel').then(m => ({ default: m.AIPredictionPanel })))
export const CollaborativeAIPairProgrammer = lazy(() => import('@/components/CollaborativeAIPairProgrammer').then(m => ({ default: m.CollaborativeAIPairProgrammer })))
export const SentientDebugger = lazy(() => import('@/components/SentientDebugger').then(m => ({ default: m.SentientDebugger })))
export const QuantumSynthesisPanel = lazy(() => import('@/components/QuantumSynthesisPanel').then(m => ({ default: m.QuantumSynthesisPanel })))

// Lazy load research/data panels
export const ResearchPaperPanel = lazy(() => import('@/components/ResearchPaperPanel').then(m => ({ default: m.ResearchPaperPanel })))
export const ExperimentTrackingPanel = lazy(() => import('@/components/ExperimentTrackingPanel').then(m => ({ default: m.ExperimentTrackingPanel })))
export const ReproducibilityEngine = lazy(() => import('@/components/ReproducibilityEngine').then(m => ({ default: m.ReproducibilityEngine })))

// Lazy load feature panels
export const VoiceCodingPanel = lazy(() => import('@/components/VoiceCodingPanel').then(m => ({ default: m.VoiceCodingPanel })))
export const VideoTutorialPanel = lazy(() => import('@/components/VideoTutorialPanel').then(m => ({ default: m.VideoTutorialPanel })))
export const CodeChallengesPanel = lazy(() => import('@/components/CodeChallengesPanel').then(m => ({ default: m.CodeChallengesPanel })))
export const DataProtectionPanel = lazy(() => import('@/components/DataProtectionPanel').then(m => ({ default: m.DataProtectionPanel })))
export const AssetManager = lazy(() => import('@/components/AssetManager').then(m => ({ default: m.AssetManager })))
export const AssetCompressor = lazy(() => import('@/components/AssetCompressor').then(m => ({ default: m.AssetCompressor })))
export const OptimizationDashboard = lazy(() => import('@/components/OptimizationDashboard').then(m => ({ default: m.OptimizationDashboard })))

// Lazy load analysis panels
export const LiveExecutionPanel = lazy(() => import('@/components/LiveExecutionPanel').then(m => ({ default: m.LiveExecutionPanel })))
export const VisualDebugPanel = lazy(() => import('@/components/VisualDebugPanel').then(m => ({ default: m.VisualDebugPanel })))
export const CodeComplexityVisualizer = lazy(() => import('@/components/CodeComplexityVisualizer').then(m => ({ default: m.CodeComplexityVisualizer })))
export const PerformanceProfiler = lazy(() => import('@/components/PerformanceProfiler').then(m => ({ default: m.PerformanceProfiler })))

// Lazy load UI enhancement components
export const OnboardingTour = lazy(() => import('@/components/OnboardingTour').then(m => ({ default: m.OnboardingTour })))
export const Performance3DSettings = lazy(() => import('@/components/Performance3DSettings').then(m => ({ default: m.Performance3DSettings })))
