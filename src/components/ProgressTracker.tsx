import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle } from '@phosphor-icons/react'

export interface ProgressMilestone {
  id: string
  title: string
  description: string
  completed: boolean
}

const defaultMilestones: ProgressMilestone[] = [
  {
    id: 'create-first-file',
    title: 'Create Your First File',
    description: 'Create a file and start coding',
    completed: false,
  },
  {
    id: 'use-ai-chat',
    title: 'Try AI Assistant',
    description: 'Open AI chat and ask a question',
    completed: false,
  },
  {
    id: 'use-vr-mode',
    title: 'Enter VR Mode',
    description: 'Experience immersive coding',
    completed: false,
  },
  {
    id: 'use-voice-commands',
    title: 'Try Voice Commands',
    description: 'Code hands-free with voice',
    completed: false,
  },
  {
    id: 'link-research-paper',
    title: 'Link a Research Paper',
    description: 'Connect arXiv paper to your code',
    completed: false,
  },
  {
    id: 'run-code',
    title: 'Execute Code Live',
    description: 'Run your code in the IDE',
    completed: false,
  },
  {
    id: 'use-3d-viz',
    title: 'Explore 3D Visualizations',
    description: 'Try holographic or gallery mode',
    completed: false,
  },
  {
    id: 'use-sentient-debugger',
    title: 'Use Sentient Debugger',
    description: 'Get AI-powered debugging insights',
    completed: false,
  },
]

interface ProgressTrackerProps {
  userId: string
}

export function ProgressTracker({ userId }: ProgressTrackerProps) {
  const [milestones, setMilestones] = useKV<ProgressMilestone[]>(
    `crowe-code-progress-${userId}`,
    defaultMilestones
  )

  const safeMilestones = milestones || defaultMilestones
  const completedCount = safeMilestones.filter((m) => m.completed).length
  const totalCount = safeMilestones.length
  const progressPercent = (completedCount / totalCount) * 100

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-purple-500/30 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Your Journey</h3>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{totalCount}
        </Badge>
      </div>

      <Progress value={progressPercent} className="h-2 mb-4" />

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {safeMilestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
          >
            {milestone.completed ? (
              <CheckCircle
                className="h-5 w-5 text-green-400 shrink-0 mt-0.5"
                weight="fill"
              />
            ) : (
              <Circle
                className="h-5 w-5 text-slate-600 shrink-0 mt-0.5"
                weight="regular"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-medium ${
                  milestone.completed ? 'text-slate-300' : 'text-white'
                }`}
              >
                {milestone.title}
              </h4>
              <p className="text-xs text-slate-500">{milestone.description}</p>
            </div>
          </div>
        ))}
      </div>

      {progressPercent === 100 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-300 font-semibold">
            🎉 Congratulations! You've mastered Crowe Code!
          </p>
        </div>
      )}
    </Card>
  )
}

export function markMilestoneComplete(
  milestones: ProgressMilestone[],
  milestoneId: string
): ProgressMilestone[] {
  return milestones.map((m) =>
    m.id === milestoneId ? { ...m, completed: true } : m
  )
}
