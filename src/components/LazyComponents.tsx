import { lazy } from 'react'

// Lazy load heavy 3D components
export const MolecularBackground = lazy(() => import('@/components/MolecularBackground'))
export const Enhanced3DWelcome = lazy(() => import('@/components/Enhanced3DWelcome'))
export const Gallery3D = lazy(() => import('@/components/3DGallery'))
export const VRCodeSpace = lazy(() => import('@/components/VRCodeSpace'))
export const ARCodeOverlay = lazy(() => import('@/components/ARCodeOverlay'))
export const VRWorkspace = lazy(() => import('@/components/VRWorkspace'))
export const HolographicCodeViz = lazy(() => import('@/components/HolographicCodeViz'))
export const CodeDNASequencer = lazy(() => import('@/components/CodeDNASequencer'))
export const DataVisualization3D = lazy(() => import('@/components/DataVisualization3D'))

// Lazy load AI/ML features
export const AIChatPanel = lazy(() => import('@/components/AIChatPanel'))
export const AIPredictionPanel = lazy(() => import('@/components/AIPredictionPanel'))
export const CollaborativeAIPairProgrammer = lazy(() => import('@/components/CollaborativeAIPairProgrammer'))
export const SentientDebugger = lazy(() => import('@/components/SentientDebugger'))
export const QuantumSynthesisPanel = lazy(() => import('@/components/QuantumSynthesisPanel'))

// Lazy load research/data panels
export const ResearchPaperPanel = lazy(() => import('@/components/ResearchPaperPanel'))
export const ExperimentTrackingPanel = lazy(() => import('@/components/ExperimentTrackingPanel'))
export const ReproducibilityEngine = lazy(() => import('@/components/ReproducibilityEngine'))

// Lazy load feature panels
export const VoiceCodingPanel = lazy(() => import('@/components/VoiceCodingPanel'))
export const VideoTutorialPanel = lazy(() => import('@/components/VideoTutorialPanel'))
export const CodeChallengesPanel = lazy(() => import('@/components/CodeChallengesPanel'))
export const DataProtectionPanel = lazy(() => import('@/components/DataProtectionPanel'))
export const AssetManager = lazy(() => import('@/components/AssetManager'))
export const AssetCompressor = lazy(() => import('@/components/AssetCompressor'))
export const OptimizationDashboard = lazy(() => import('@/components/OptimizationDashboard'))

// Lazy load analysis panels
export const LiveExecutionPanel = lazy(() => import('@/components/LiveExecutionPanel'))
export const VisualDebugPanel = lazy(() => import('@/components/VisualDebugPanel'))
export const CodeComplexityVisualizer = lazy(() => import('@/components/CodeComplexityVisualizer'))
export const PerformanceProfiler = lazy(() => import('@/components/PerformanceProfiler'))

// Lazy load UI enhancement components
export const OnboardingTour = lazy(() => import('@/components/OnboardingTour'))
export const Performance3DSettings = lazy(() => import('@/components/Performance3DSettings'))
