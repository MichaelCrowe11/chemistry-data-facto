import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  Trophy, 
  Star, 
  Clock,
  Play,
  X,
  TrendUp
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface TutorialProgress {
  tutorialId: string
  completed: boolean
  stepsCompleted: number[]
  totalSteps: number
  lastViewed: number
  completedAt?: number
  bookmarked: boolean
}

interface TutorialProgressTrackerProps {
  onClose: () => void
  onResumeTutorial: (tutorialId: string) => void
}

const achievementBadges = [
  {
    id: 'first-tutorial',
    name: 'First Steps',
    description: 'Complete your first tutorial',
    icon: Star,
    requirement: 1,
  },
  {
    id: 'vr-master',
    name: 'VR Master',
    description: 'Complete all VR/AR tutorials',
    icon: Trophy,
    requirement: 3,
  },
  {
    id: 'voice-expert',
    name: 'Voice Expert',
    description: 'Complete all voice command tutorials',
    icon: Trophy,
    requirement: 2,
  },
  {
    id: 'ai-enthusiast',
    name: 'AI Enthusiast',
    description: 'Complete all AI tutorials',
    icon: Trophy,
    requirement: 2,
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Complete all research tool tutorials',
    icon: Trophy,
    requirement: 3,
  },
  {
    id: '3d-explorer',
    name: '3D Explorer',
    description: 'Complete all 3D visualization tutorials',
    icon: Trophy,
    requirement: 2,
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete all available tutorials',
    icon: Trophy,
    requirement: 12,
  },
]

export function TutorialProgressTracker({ onClose, onResumeTutorial }: TutorialProgressTrackerProps) {
  const [progress, setProgress] = useKV<Record<string, TutorialProgress>>('tutorial-progress', {})

  const progressArray = Object.values(progress || {})
  const completedCount = progressArray.filter(p => p.completed).length
  const totalTutorials = 12
  const overallProgress = (completedCount / totalTutorials) * 100

  const inProgressTutorials = progressArray.filter(p => !p.completed && p.stepsCompleted.length > 0)
  const completedTutorials = progressArray.filter(p => p.completed)
  const bookmarkedTutorials = progressArray.filter(p => p.bookmarked)

  const unlockedAchievements = achievementBadges.filter(badge => completedCount >= badge.requirement)

  const totalTimeSpent = progressArray.reduce((acc, p) => {
    if (p.completedAt && p.lastViewed) {
      return acc + (p.completedAt - p.lastViewed)
    }
    return acc
  }, 0)

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-400" weight="duotone" />
          <h2 className="text-sm font-semibold">My Progress</h2>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-7 w-7"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendUp className="h-5 w-5 text-purple-400" weight="duotone" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tutorials Completed</span>
                  <span className="font-semibold">{completedCount} / {totalTutorials}</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{completedCount}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{inProgressTutorials.length}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{bookmarkedTutorials.length}</div>
                  <div className="text-xs text-muted-foreground">Bookmarked</div>
                </div>
              </div>

              {totalTimeSpent > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time Invested
                    </span>
                    <span className="font-semibold">{formatTime(totalTimeSpent)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" weight="fill" />
              Achievements
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {achievementBadges.map(badge => {
                const unlocked = completedCount >= badge.requirement
                const Icon = badge.icon
                return (
                  <Card
                    key={badge.id}
                    className={cn(
                      "transition-all",
                      unlocked 
                        ? "border-yellow-500/50 bg-yellow-500/5" 
                        : "opacity-50 grayscale"
                    )}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          unlocked ? "bg-yellow-500/20" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            unlocked ? "text-yellow-400" : "text-muted-foreground"
                          )} weight={unlocked ? "fill" : "regular"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {badge.name}
                            {unlocked && (
                              <CheckCircle className="h-3 w-3 text-green-400" weight="fill" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {badge.description}
                          </CardDescription>
                        </div>
                        {!unlocked && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {completedCount}/{badge.requirement}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>

          {inProgressTutorials.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-400" weight="fill" />
                Continue Learning
              </h3>
              <div className="space-y-2">
                {inProgressTutorials.map(tutorial => {
                  const progress = (tutorial.stepsCompleted.length / tutorial.totalSteps) * 100
                  return (
                    <Card
                      key={tutorial.tutorialId}
                      className="cursor-pointer hover:bg-accent/50 transition-all"
                      onClick={() => onResumeTutorial(tutorial.tutorialId)}
                    >
                      <CardHeader className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              Tutorial #{tutorial.tutorialId}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {tutorial.stepsCompleted.length}/{tutorial.totalSteps}
                            </Badge>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {completedTutorials.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" weight="fill" />
                Completed Tutorials
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {completedTutorials.map(tutorial => (
                  <Card
                    key={tutorial.tutorialId}
                    className="border-green-500/20 bg-green-500/5"
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" weight="fill" />
                          Tutorial #{tutorial.tutorialId}
                        </CardTitle>
                        {tutorial.bookmarked && (
                          <Star className="h-4 w-4 text-yellow-400" weight="fill" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-muted/30">
        <Button className="w-full" onClick={onClose}>
          <Play className="h-4 w-4 mr-2" weight="fill" />
          Continue Learning
        </Button>
      </div>
    </div>
  )
}
