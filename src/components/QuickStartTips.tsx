import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkle, Question, Lightbulb } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QuickStartTipsProps {
  onStartTour: () => void
}

export function QuickStartTips({ onStartTour }: QuickStartTipsProps) {
  const tips = [
    {
      title: 'First Time Here?',
      description: 'Take the interactive tour to discover all features',
      action: 'Start Tour',
      icon: <Question className="h-5 w-5" weight="duotone" />,
      onClick: onStartTour,
    },
    {
      title: 'AI Assistant',
      description: 'Press Cmd/Ctrl+K to get instant AI help',
      icon: <Sparkle className="h-5 w-5" weight="duotone" />,
      onClick: () => toast.info('Press Cmd/Ctrl+K to open AI Chat'),
    },
    {
      title: 'Quick Tips',
      description: 'Your files auto-save. Try VR/AR modes for immersive coding!',
      icon: <Lightbulb className="h-5 w-5" weight="duotone" />,
      onClick: () => {},
    },
  ]

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3 max-w-sm">
      {tips.map((tip, index) => (
        <Card
          key={index}
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-purple-500/30 backdrop-blur-xl p-4 cursor-pointer hover:border-purple-400/50 transition-all hover:scale-105"
          onClick={tip.onClick}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30 shrink-0">
              {tip.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-1">{tip.title}</h3>
              <p className="text-xs text-slate-400">{tip.description}</p>
              {tip.action && (
                <Button
                  size="sm"
                  className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs h-7"
                >
                  {tip.action}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
