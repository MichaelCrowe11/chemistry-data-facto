/**
 * Interactive Onboarding Tour
 * Guides new users through Crowe Code's features
 */

import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  GraduationCap,
  Plus,
  Sparkle,
  Article,
  Flask,
  Atom,
  Dna,
  Cube,
  CheckCircle,
  X
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string // CSS selector for highlighting
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  action?: 'create-file' | 'search-papers' | 'explore-features'
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Crowe Code! 🎓',
    description: 'The first IDE built specifically for researchers and scientists. Let\'s take a quick 2-minute tour to get you started.',
    icon: <GraduationCap size={48} weight="duotone" className="text-primary" />,
    position: 'center'
  },
  {
    id: 'create-file',
    title: 'Create Your First File',
    description: 'Click the + button in the file tree to create a new file. Try creating "experiment.py" or "research.md".',
    icon: <Plus size={48} weight="duotone" className="text-primary" />,
    target: '[data-tour="file-tree-create"]',
    position: 'right',
    action: 'create-file'
  },
  {
    id: 'ai-features',
    title: 'AI-Powered Coding',
    description: 'As you type, AI will suggest completions. Press Tab to accept. Try writing "import numpy as np" and watch the magic!',
    icon: <Sparkle size={48} weight="duotone" className="text-primary" />,
    position: 'center'
  },
  {
    id: 'research-papers',
    title: 'Search Academic Papers',
    description: 'Click the 📚 Papers panel to search arXiv, PubMed, and other academic databases directly from your IDE.',
    icon: <Article size={48} weight="duotone" className="text-primary" />,
    target: '[data-tour="panel-papers"]',
    position: 'left',
    action: 'search-papers'
  },
  {
    id: 'experiments',
    title: 'Track ML Experiments',
    description: 'Use the 🧪 Experiments panel to automatically track parameters, metrics, and results. Zero configuration required!',
    icon: <Flask size={48} weight="duotone" className="text-primary" />,
    target: '[data-tour="panel-experiments"]',
    position: 'left'
  },
  {
    id: 'revolutionary',
    title: 'Revolutionary Features',
    description: 'Experience cutting-edge tools:\n• ⚛️ Quantum Synthesis - Generate code from intent\n• 🧬 DNA Sequencer - Analyze code patterns\n• 🔮 Holographic Viz - See code in 3D',
    icon: <Atom size={48} weight="duotone" className="text-primary" />,
    position: 'center',
    action: 'explore-features'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You\'ve learned the basics of Crowe Code. Start exploring and building amazing research! Need help? Press Cmd/Ctrl+K for the command palette.',
    icon: <CheckCircle size={48} weight="duotone" className="text-green-500" />,
    position: 'center'
  }
]

interface OnboardingTourProps {
  userId: string
}

export function OnboardingTour({ userId }: OnboardingTourProps) {
  const [tourCompleted, setTourCompleted] = useKV<boolean>(
    `crowe-onboarding-completed-${userId}`,
    false
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  // Show tour for new users
  useEffect(() => {
    if (!tourCompleted && userId) {
      // Small delay to let the app render
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tourCompleted, userId])

  // Highlight target element
  useEffect(() => {
    if (isOpen && tourSteps[currentStep].target) {
      const element = document.querySelector(tourSteps[currentStep].target!) as HTMLElement
      if (element) {
        setHighlightedElement(element)
        element.classList.add('tour-highlight')
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight')
      }
    }
  }, [currentStep, isOpen])

  const step = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
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
    setIsOpen(false)
    // Don't mark as completed so they can restart later
  }

  const handleComplete = () => {
    setTourCompleted(true)
    setIsOpen(false)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setTourCompleted(false)
    setIsOpen(true)
  }

  // Expose restart function globally for help menu
  useEffect(() => {
    ;(window as any).restartOnboardingTour = handleRestart
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleSkip}
      />

      {/* Tour dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            'sm:max-w-[500px] z-50',
            step.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : '',
            step.position === 'right' ? 'top-1/2 left-3/4 -translate-y-1/2' : '',
            step.position === 'left' ? 'top-1/2 right-3/4 -translate-y-1/2' : ''
          )}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={handleSkip}
            aria-label="Close tour"
          >
            <X size={20} />
          </Button>

          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              {step.icon}
            </div>

            <DialogTitle className="text-2xl text-center">
              {step.title}
            </DialogTitle>

            <DialogDescription className="text-base text-center whitespace-pre-line">
              {step.description}
            </DialogDescription>

            {/* Progress indicator */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Step {currentStep + 1} of {tourSteps.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    index === currentStep
                      ? 'bg-primary w-6'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tour
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="min-w-[100px]"
              >
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </DialogFooter>

          {/* Action hints */}
          {step.action && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-center text-primary">
                {step.action === 'create-file' && '👉 Try creating a file now to continue'}
                {step.action === 'search-papers' && '👉 Try searching for a paper'}
                {step.action === 'explore-features' && '👉 Click any revolutionary feature to explore'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          outline: 3px solid hsl(var(--primary));
          outline-offset: 4px;
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
          animation: tour-pulse 2s ease-in-out infinite;
        }

        @keyframes tour-pulse {
          0%, 100% {
            outline-color: hsl(var(--primary));
          }
          50% {
            outline-color: hsl(var(--primary) / 0.5);
          }
        }
      `}</style>
    </>
  )
}

/**
 * Badge component to indicate tour availability
 */
export function OnboardingBadge({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        onClick?.()
        ;(window as any).restartOnboardingTour?.()
      }}
      className="gap-2"
    >
      <GraduationCap size={16} weight="duotone" />
      Take Tour
    </Button>
  )
}
