import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CodeChallenge, ChallengeProgress, TestCase, ChallengeAttempt, UserChallengeStats } from '@/types/challenges'
import { codeChallenges } from '@/lib/challenge-data'
import { 
  Play, 
  X, 
  CheckCircle,
  XCircle,
  Lightbulb,
  Trophy,
  Target,
  Clock,
  ChartBar,
  Star,
  Code,
  Sparkle,
  ArrowRight,
  LightbulbFilament,
  BookOpen,
  Fire
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface CodeChallengesPanelProps {
  onClose: () => void
  onCodeInsert?: (code: string) => void
  initialChallengeId?: string
}

export function CodeChallengesPanel({ onClose, onCodeInsert, initialChallengeId }: CodeChallengesPanelProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<CodeChallenge | null>(null)
  const [userCode, setUserCode] = useState('')
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string; testId: string }[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [hintsRevealed, setHintsRevealed] = useState<number[]>([])
  const [challengeProgress, setChallengeProgress] = useKV<Record<string, ChallengeProgress>>('code-challenge-progress', {})
  const [userStats, setUserStats] = useKV<UserChallengeStats>('code-challenge-stats', {
    totalCompleted: 0,
    totalAttempts: 0,
    totalXP: 0,
    streak: 0,
    categoriesCompleted: {},
    difficultiesCompleted: {}
  })
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [showStats, setShowStats] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (initialChallengeId) {
      const challenge = codeChallenges.find(c => c.id === initialChallengeId)
      if (challenge) {
        handleSelectChallenge(challenge)
      }
    }
  }, [initialChallengeId])

  useEffect(() => {
    if (selectedChallenge) {
      const progress = challengeProgress?.[selectedChallenge.id]
      if (progress?.currentCode) {
        setUserCode(progress.currentCode)
      } else {
        setUserCode(selectedChallenge.starterCode)
      }
      startTimeRef.current = Date.now()
    }
  }, [selectedChallenge, challengeProgress])

  const handleSelectChallenge = (challenge: CodeChallenge) => {
    setSelectedChallenge(challenge)
    setTestResults([])
    setHintsRevealed([])
    setShowHints(false)
  }

  const saveProgress = (code: string) => {
    if (!selectedChallenge) return

    const currentProgress = challengeProgress?.[selectedChallenge.id] || {
      challengeId: selectedChallenge.id,
      attempts: 0,
      completed: false,
      bestScore: 0,
      hintsUsed: 0,
      startedAt: Date.now(),
      timeSpentMs: 0,
      xpEarned: 0
    }

    setChallengeProgress(prev => ({
      ...(prev || {}),
      [selectedChallenge.id]: {
        ...currentProgress,
        currentCode: code,
        timeSpentMs: currentProgress.timeSpentMs + (Date.now() - startTimeRef.current)
      }
    }))

    startTimeRef.current = Date.now()
  }

  const runTests = async () => {
    if (!selectedChallenge) return

    setIsRunning(true)
    setTestResults([])

    await new Promise(resolve => setTimeout(resolve, 500))

    const results: { passed: boolean; message: string; testId: string }[] = []
    let allPassed = true

    try {
      const userFunction = new Function(`return ${userCode}`)()

      for (const testCase of selectedChallenge.testCases) {
        try {
          let actualOutput: any
          
          if (testCase.input === '') {
            actualOutput = userFunction()
          } else {
            const args = eval(`[${testCase.input}]`)
            actualOutput = userFunction(...args)
          }

          const actualStr = JSON.stringify(actualOutput)
          const expectedStr = testCase.expectedOutput.startsWith('"') 
            ? testCase.expectedOutput 
            : JSON.stringify(eval(testCase.expectedOutput))

          const passed = actualStr === expectedStr

          results.push({
            passed,
            message: passed 
              ? `✓ ${testCase.description}` 
              : `✗ ${testCase.description}\nExpected: ${expectedStr}\nGot: ${actualStr}`,
            testId: testCase.id
          })

          if (!passed) allPassed = false
        } catch (error) {
          results.push({
            passed: false,
            message: `✗ ${testCase.description}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
            testId: testCase.id
          })
          allPassed = false
        }
      }
    } catch (error) {
      toast.error('Code syntax error: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setIsRunning(false)
      return
    }

    setTestResults(results)
    setIsRunning(false)

    const timeSpent = Date.now() - startTimeRef.current
    const currentProgress = challengeProgress?.[selectedChallenge.id] || {
      challengeId: selectedChallenge.id,
      attempts: 0,
      completed: false,
      bestScore: 0,
      hintsUsed: hintsRevealed.length,
      startedAt: Date.now(),
      timeSpentMs: 0,
      xpEarned: 0
    }

    const passedCount = results.filter(r => r.passed).length
    const score = Math.round((passedCount / results.length) * 100)

    setChallengeProgress(prev => ({
      ...(prev || {}),
      [selectedChallenge.id]: {
        ...currentProgress,
        attempts: currentProgress.attempts + 1,
        completed: allPassed ? true : currentProgress.completed,
        completedAt: allPassed && !currentProgress.completed ? Date.now() : currentProgress.completedAt,
        bestScore: Math.max(score, currentProgress.bestScore),
        hintsUsed: Math.max(hintsRevealed.length, currentProgress.hintsUsed),
        currentCode: userCode,
        timeSpentMs: currentProgress.timeSpentMs + timeSpent,
        xpEarned: allPassed && !currentProgress.completed ? selectedChallenge.xpReward : currentProgress.xpEarned
      }
    }))

    if (allPassed && !currentProgress.completed) {
      const xpBonus = hintsRevealed.length === 0 ? Math.round(selectedChallenge.xpReward * 0.2) : 0
      const totalXP = selectedChallenge.xpReward + xpBonus

      setUserStats(prev => ({
        totalCompleted: (prev?.totalCompleted || 0) + 1,
        totalAttempts: (prev?.totalAttempts || 0) + 1,
        totalXP: (prev?.totalXP || 0) + totalXP,
        streak: calculateStreak(prev?.lastCompletedDate),
        lastCompletedDate: Date.now(),
        categoriesCompleted: {
          ...(prev?.categoriesCompleted || {}),
          [selectedChallenge.category]: ((prev?.categoriesCompleted || {})[selectedChallenge.category] || 0) + 1
        },
        difficultiesCompleted: {
          ...(prev?.difficultiesCompleted || {}),
          [selectedChallenge.difficulty]: ((prev?.difficultiesCompleted || {})[selectedChallenge.difficulty] || 0) + 1
        }
      }))

      toast.success(
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" weight="fill" />
          <div>
            <div className="font-semibold">Challenge Complete! 🎉</div>
            <div className="text-xs mt-1">
              +{totalXP} XP {xpBonus > 0 && `(+${xpBonus} bonus for no hints!)`}
            </div>
          </div>
        </div>,
        { duration: 5000 }
      )
    } else {
      setUserStats(prev => ({
        ...prev!,
        totalAttempts: (prev?.totalAttempts || 0) + 1
      }))

      if (allPassed) {
        toast.success('All tests passed! 🎉')
      } else {
        toast.error(`${passedCount}/${results.length} tests passed. Keep trying!`)
      }
    }
  }

  const calculateStreak = (lastCompletedDate?: number): number => {
    if (!lastCompletedDate) return 1
    
    const now = Date.now()
    const daysSinceLastCompletion = Math.floor((now - lastCompletedDate) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastCompletion === 0 || daysSinceLastCompletion === 1) {
      return (userStats?.streak || 0) + 1
    }
    
    return 1
  }

  const revealHint = (level: number) => {
    if (!hintsRevealed.includes(level)) {
      setHintsRevealed(prev => [...prev, level])
      toast.info('Hint revealed! Your XP bonus may be affected.')
    }
  }

  const resetChallenge = () => {
    if (selectedChallenge) {
      setUserCode(selectedChallenge.starterCode)
      setTestResults([])
      setHintsRevealed([])
      saveProgress(selectedChallenge.starterCode)
      toast.info('Challenge reset to starter code')
    }
  }

  const insertIntoEditor = () => {
    if (onCodeInsert && userCode) {
      onCodeInsert(userCode)
      toast.success('Code inserted into editor')
    }
  }

  const filteredChallenges = codeChallenges.filter(challenge => {
    if (filterCategory !== 'all' && challenge.category !== filterCategory) return false
    if (filterDifficulty !== 'all' && challenge.difficulty !== filterDifficulty) return false
    return true
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-muted'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'javascript': return <Code className="h-4 w-4" />
      case 'typescript': return <Code className="h-4 w-4" />
      case 'react': return <Sparkle className="h-4 w-4" />
      case 'algorithms': return <ChartBar className="h-4 w-4" />
      case 'data-structures': return <Target className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  if (showStats) {
    return (
      <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
        <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" weight="duotone" />
            <h2 className="font-semibold">Your Stats</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowStats(false)}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fire className="h-5 w-5 text-orange-500" weight="fill" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-3xl font-bold text-green-400">{userStats?.totalCompleted || 0}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-3xl font-bold text-blue-400">{userStats?.totalXP || 0}</div>
                    <div className="text-xs text-muted-foreground">Total XP</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="text-3xl font-bold text-purple-400">{userStats?.totalAttempts || 0}</div>
                    <div className="text-xs text-muted-foreground">Attempts</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="text-3xl font-bold text-orange-400">{userStats?.streak || 0}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Progress</div>
                  <Progress 
                    value={(userStats?.totalCompleted || 0) / codeChallenges.length * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {userStats?.totalCompleted || 0} / {codeChallenges.length} challenges
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-lg">By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(userStats?.categoriesCompleted || {}).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="text-sm capitalize">{category}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
                {Object.keys(userStats?.categoriesCompleted || {}).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Complete challenges to see stats
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-lg">By Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(userStats?.difficultiesCompleted || {}).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{difficulty}</span>
                    <Badge className={getDifficultyColor(difficulty)}>{count}</Badge>
                  </div>
                ))}
                {Object.keys(userStats?.difficultiesCompleted || {}).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Complete challenges to see stats
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (!selectedChallenge) {
    return (
      <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
        <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" weight="duotone" />
            <h2 className="font-semibold">Code Challenges</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowStats(true)}>
              <Trophy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Category</div>
            <Tabs value={filterCategory} onValueChange={setFilterCategory} className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="javascript" className="text-xs">JS</TabsTrigger>
                <TabsTrigger value="react" className="text-xs">React</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
            <Tabs value={filterDifficulty} onValueChange={setFilterDifficulty} className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="beginner" className="text-xs">Easy</TabsTrigger>
                <TabsTrigger value="intermediate" className="text-xs">Med</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs">Hard</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredChallenges.map(challenge => {
              const progress = challengeProgress?.[challenge.id]
              const isCompleted = progress?.completed || false
              
              return (
                <Card
                  key={challenge.id}
                  className={cn(
                    "cursor-pointer transition-all hover:bg-accent/50 border-border",
                    isCompleted && "border-green-500/30 bg-green-500/5"
                  )}
                  onClick={() => handleSelectChallenge(challenge)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(challenge.category)}
                        <CardTitle className="text-sm">{challenge.title}</CardTitle>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" weight="fill" />
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {challenge.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge className={cn("text-xs", getDifficultyColor(challenge.difficulty))}>
                        {challenge.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {challenge.estimatedTime}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {challenge.xpReward} XP
                      </Badge>
                      {progress && progress.attempts > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {progress.attempts} {progress.attempts === 1 ? 'attempt' : 'attempts'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              )
            })}

            {filteredChallenges.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No challenges found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  const progress = challengeProgress?.[selectedChallenge.id]
  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSelectedChallenge(null)}>
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <h2 className="font-semibold text-sm truncate">{selectedChallenge.title}</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base mb-1">{selectedChallenge.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {selectedChallenge.description}
                  </CardDescription>
                </div>
                {progress?.completed && (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" weight="fill" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge className={getDifficultyColor(selectedChallenge.difficulty)}>
                  {selectedChallenge.difficulty}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedChallenge.estimatedTime}
                </Badge>
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1" />
                  {selectedChallenge.xpReward} XP
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-2">Learning Objectives:</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {selectedChallenge.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {progress && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-medium mb-2">Your Progress:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Attempts</div>
                      <div className="font-semibold">{progress.attempts}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Best Score</div>
                      <div className="font-semibold">{progress.bestScore}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Time</div>
                      <div className="font-semibold">{Math.round(progress.timeSpentMs / 1000)}s</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={userCode}
                onChange={(e) => {
                  setUserCode(e.target.value)
                  saveProgress(e.target.value)
                }}
                className="w-full h-48 px-3 py-2 text-xs font-mono bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your code here..."
                spellCheck={false}
              />

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={runTests}
                  disabled={isRunning}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="h-3 w-3 mr-1" weight="fill" />
                  {isRunning ? 'Running...' : 'Run Tests'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetChallenge}>
                  Reset
                </Button>
                {onCodeInsert && (
                  <Button size="sm" variant="outline" onClick={insertIntoEditor}>
                    <Code className="h-3 w-3 mr-1" />
                    Insert
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHints(!showHints)}
                >
                  <Lightbulb className="h-3 w-3 mr-1" weight={showHints ? 'fill' : 'regular'} />
                  Hints ({selectedChallenge.hints.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {showHints && (
            <Card className="bg-card/50 border-border border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LightbulbFilament className="h-4 w-4 text-yellow-500" weight="fill" />
                  Hints
                </CardTitle>
                <CardDescription className="text-xs">
                  Using hints may reduce your XP bonus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedChallenge.hints.map((hint, idx) => (
                  <div key={idx} className="border border-border rounded-md p-3">
                    {hintsRevealed.includes(hint.level) ? (
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Hint {hint.level}:</div>
                        <div className="text-xs text-muted-foreground">{hint.text}</div>
                        {hint.codeSnippet && (
                          <pre className="text-xs bg-background p-2 rounded border border-border overflow-x-auto">
                            <code>{hint.codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revealHint(hint.level)}
                        className="w-full"
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Reveal Hint {hint.level}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {testResults.length > 0 && (
            <Card className={cn(
              "bg-card/50 border-border",
              passedTests === totalTests ? "border-green-500/30" : "border-red-500/30"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Test Results</CardTitle>
                  <Badge className={passedTests === totalTests ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {passedTests} / {totalTests} Passed
                  </Badge>
                </div>
                <Progress value={(passedTests / totalTests) * 100} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-2 rounded-md border text-xs",
                      result.passed 
                        ? "bg-green-500/10 border-green-500/30 text-green-400" 
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" weight="fill" />
                      )}
                      <pre className="whitespace-pre-wrap flex-1 font-mono">{result.message}</pre>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
