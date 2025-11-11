import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  Cube,
  Eye,
  MapPin,
  Microphone,
  Brain,
  Article,
  Flask,
  Robot,
  Play,
  CheckCircle,
  FileCode,
  Atom,
  ImageSquare,
  Keyboard,
  Lightning,
  ChartLineUp
} from '@phosphor-icons/react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string
  action?: string
  highlight?: {
    element: string
    position: 'top' | 'bottom' | 'left' | 'right'
  }
  interactive?: boolean
  demoAction?: () => void
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Crowe Code',
    description: 'An immersive VR/AR research IDE that revolutionizes how you write, visualize, and understand code. Let\'s take a quick tour of the groundbreaking features.',
    icon: <Sparkle className="h-8 w-8 text-purple-400" weight="duotone" />,
  },
  {
    id: 'file-system',
    title: 'Smart File System',
    description: 'Create and organize files in the sidebar. Files are automatically saved and synced to your account.',
    icon: <FileCode className="h-8 w-8 text-blue-400" weight="duotone" />,
    target: 'file-tree',
    action: 'Click the + icon to create your first file',
  },
  {
    id: 'ai-chat',
    title: 'AI Code Assistant',
    description: 'Get intelligent code suggestions, explanations, and refactoring help. Press Cmd/Ctrl+K anytime.',
    icon: <Sparkle className="h-8 w-8 text-cyan-400" weight="duotone" />,
    target: 'ai-chat-button',
    action: 'Click to open the AI assistant',
  },
  {
    id: 'research-papers',
    title: 'arXiv Integration',
    description: 'Search and link research papers from arXiv directly to your code. Perfect for research-driven development.',
    icon: <Article className="h-8 w-8 text-blue-400" weight="duotone" />,
    target: 'papers-button',
    action: 'Access cutting-edge research',
  },
  {
    id: 'experiments',
    title: 'Experiment Tracking',
    description: 'Track ML experiments, parameters, and results. Version your research iterations automatically.',
    icon: <Flask className="h-8 w-8 text-green-400" weight="duotone" />,
    target: 'experiments-button',
    action: 'Manage scientific experiments',
  },
  {
    id: 'sentient-debugger',
    title: 'Sentient Debugger',
    description: 'AI-powered debugging that understands context, predicts bugs before they happen, and suggests fixes proactively.',
    icon: <Brain className="h-8 w-8 text-purple-400" weight="duotone" />,
    target: 'sentient-button',
    action: 'Experience predictive debugging',
  },
  {
    id: 'holographic-viz',
    title: '3D Code Visualization',
    description: 'See your code structure in stunning 3D holographic views. Understand complex architectures at a glance.',
    icon: <Cube className="h-8 w-8 text-pink-400" weight="duotone" />,
    target: 'holographic-button',
    action: 'Visualize code in 3D',
  },
  {
    id: 'quantum-synthesis',
    title: 'Quantum Code Synthesis',
    description: 'Generate entire functions and modules from natural language descriptions using advanced AI.',
    icon: <Atom className="h-8 w-8 text-orange-400" weight="duotone" />,
    target: 'quantum-button',
    action: 'Try AI code generation',
  },
  {
    id: '3d-gallery',
    title: 'WebGL 3D Gallery',
    description: 'Explore beautiful 3D showcases powered by Three.js. See code come alive in 3D space.',
    icon: <ImageSquare className="h-8 w-8 text-cyan-400" weight="duotone" />,
    target: 'gallery3d-button',
    action: 'Browse 3D visualizations',
  },
  {
    id: 'vr-workspace',
    title: 'VR Workspace',
    description: 'Step into a virtual reality coding environment. Code with spatial awareness and immersive focus.',
    icon: <Eye className="h-8 w-8 text-purple-400" weight="duotone" />,
    target: 'vr-workspace-button',
    action: 'Enter VR workspace',
  },
  {
    id: 'ar-overlay',
    title: 'AR Code Overlay',
    description: 'Project your code into augmented reality. Review code anywhere in your physical space.',
    icon: <MapPin className="h-8 w-8 text-green-400" weight="duotone" />,
    target: 'ar-button',
    action: 'Enable AR mode',
  },
  {
    id: 'voice-commands',
    title: 'Voice Coding',
    description: 'Code hands-free with voice commands. Perfect for VR/AR mode or accessibility. Train custom commands.',
    icon: <Microphone className="h-8 w-8 text-pink-400" weight="duotone" />,
    target: 'voice-button',
    action: 'Try voice commands',
  },
  {
    id: 'ai-pair',
    title: 'AI Pair Programmer',
    description: 'Your collaborative coding partner. Get real-time suggestions, architecture advice, and best practices.',
    icon: <Robot className="h-8 w-8 text-blue-400" weight="duotone" />,
    target: 'pair-button',
    action: 'Start pair programming',
  },
  {
    id: 'live-execution',
    title: 'Live Code Execution',
    description: 'Run JavaScript and Python code instantly. See results, logs, and performance metrics in real-time.',
    icon: <Play className="h-8 w-8 text-green-400" weight="duotone" />,
    target: 'execution-button',
    action: 'Execute code live',
  },
  {
    id: 'asset-compressor',
    title: 'Asset Compressor & Optimizer',
    description: 'Compress and optimize images, videos, and other assets with AI-powered recommendations. Reduce file sizes while maintaining quality.',
    icon: <Lightning className="h-8 w-8 text-purple-400" weight="duotone" />,
    target: 'compressor-button',
    action: 'Compress and optimize assets',
  },
  {
    id: 'optimization-dashboard',
    title: 'Optimization Dashboard',
    description: 'Get insights and analytics on asset optimization opportunities. Track potential savings and view AI-powered recommendations for maximum efficiency.',
    icon: <ChartLineUp className="h-8 w-8 text-green-400" weight="duotone" />,
    target: 'optimization-button',
    action: 'View optimization insights',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Master these shortcuts to code faster: Cmd/Ctrl+K for AI, Cmd/Ctrl+S to save, Cmd/Ctrl+N for new file.',
    icon: <CheckCircle className="h-8 w-8 text-blue-400" weight="duotone" />,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'ve discovered the power of Crowe Code. Start creating, researching, and coding in ways you never thought possible.',
    icon: <CheckCircle className="h-8 w-8 text-green-400" weight="duotone" />,
  },
]

interface OnboardingTourProps {
  onComplete: () => void
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [hasSeenTour, setHasSeenTour] = useKV('crowe-code-onboarding-complete', false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(!hasSeenTour)
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null)

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  useEffect(() => {
    if (!isVisible) return

    if (currentStepData.target) {
      const targetMap: Record<string, string> = {
        'file-tree': '[data-tour="file-tree"]',
        'ai-chat-button': '[data-tour="ai-chat"]',
        'papers-button': '[data-tour="papers"]',
        'experiments-button': '[data-tour="experiments"]',
        'sentient-button': '[data-tour="sentient"]',
        'holographic-button': '[data-tour="holographic"]',
        'quantum-button': '[data-tour="quantum"]',
        'gallery3d-button': '[data-tour="gallery3d"]',
        'vr-workspace-button': '[data-tour="vr-workspace"]',
        'ar-button': '[data-tour="ar"]',
        'voice-button': '[data-tour="voice"]',
        'pair-button': '[data-tour="pair"]',
        'execution-button': '[data-tour="execution"]',
        'compressor-button': '[data-tour="compressor"]',
        'optimization-button': '[data-tour="optimization"]',
      }

      const selector = targetMap[currentStepData.target]
      if (selector) {
        const element = document.querySelector(selector) as HTMLElement
        setHighlightElement(element)

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } else {
      setHighlightElement(null)
    }
  }, [currentStep, currentStepData.target, isVisible])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsVisible(false)
    setHasSeenTour(true)
    onComplete()
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />

      {highlightElement && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightElement.offsetTop - 4,
            left: highlightElement.offsetLeft - 4,
            width: highlightElement.offsetWidth + 8,
            height: highlightElement.offsetHeight + 8,
            border: '3px solid rgb(168, 85, 247)',
            borderRadius: '12px',
            boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.2), 0 0 30px rgba(168, 85, 247, 0.4)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-2xl px-4"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 backdrop-blur-xl">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      Step {currentStep + 1} of {steps.length}
                    </Badge>
                    <h2 className="text-2xl font-bold text-white">
                      {currentStepData.title}
                    </h2>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <Progress value={progress} className="mb-6 h-2" />

              <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                {currentStepData.description}
              </p>

              {currentStepData.action && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-300 font-medium flex items-center gap-2">
                    <Sparkle className="h-4 w-4" weight="fill" />
                    {currentStepData.action}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {currentStep < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-muted-foreground"
                    >
                      Skip Tour
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        Get Started
                        <CheckCircle className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {currentStep === 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-400">14+</div>
                      <div className="text-xs text-slate-400 mt-1">Advanced Features</div>
                    </div>
                    <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="text-2xl font-bold text-purple-400">VR/AR</div>
                      <div className="text-xs text-slate-400 mt-1">Immersive Modes</div>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="text-2xl font-bold text-green-400">AI</div>
                      <div className="text-xs text-slate-400 mt-1">Powered Tools</div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === steps.length - 1 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-purple-300 mb-2">Pro Tips:</h3>
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" weight="fill" />
                        <span>Use <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Cmd/Ctrl+K</kbd> to quickly access AI chat</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" weight="fill" />
                        <span>All your work is automatically saved and synced</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" weight="fill" />
                        <span>Try VR mode for an immersive coding experience</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" weight="fill" />
                        <span>Use voice commands in VR/AR for hands-free coding</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {currentStep === steps.length - 2 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Keyboard className="h-5 w-5 text-purple-400" weight="duotone" />
                      <h3 className="text-sm font-semibold text-purple-300">Essential Shortcuts</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        <div className="flex gap-1 mb-1">
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">Cmd/Ctrl</kbd>
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">K</kbd>
                        </div>
                        <p className="text-xs text-slate-400">AI Chat</p>
                      </div>
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        <div className="flex gap-1 mb-1">
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">Cmd/Ctrl</kbd>
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">S</kbd>
                        </div>
                        <p className="text-xs text-slate-400">Save File</p>
                      </div>
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        <div className="flex gap-1 mb-1">
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">Cmd/Ctrl</kbd>
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">N</kbd>
                        </div>
                        <p className="text-xs text-slate-400">New File</p>
                      </div>
                      <div className="p-2 bg-slate-800/50 rounded-lg">
                        <div className="flex gap-1 mb-1">
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">Cmd/Ctrl</kbd>
                          <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300">B</kbd>
                        </div>
                        <p className="text-xs text-slate-400">Toggle Sidebar</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  )
}
