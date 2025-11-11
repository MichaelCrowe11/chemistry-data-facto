import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { TutorialProgressTracker } from '@/components/TutorialProgressTracker'
import { toast } from 'sonner'
import { 
  Play, 
  Pause, 
  X, 
  MagnifyingGlass,
  Clock,
  Sparkle,
  Cube,
  Desktop,
  Microphone,
  Brain,
  Flask,
  Article,
  Eye,
  Robot,
  Star,
  CheckCircle,
  BookOpen,
  Trophy,
  Target
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

interface Tutorial {
  id: string
  title: string
  description: string
  duration: string
  category: 'vr-ar' | 'voice' | 'ai' | 'research' | 'basics' | '3d'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  videoUrl: string
  steps: TutorialStep[]
  icon: any
  tags: string[]
  completed?: boolean
  relatedChallenges?: string[]
}

interface TutorialStep {
  timestamp: number
  title: string
  description: string
  action?: string
  challengeId?: string
}

interface VideoTutorialPanelProps {
  onClose: () => void
  onStartFeature?: (featureId: string) => void
}

const tutorials: Tutorial[] = [
  {
    id: 'javascript-basics',
    title: 'JavaScript Coding Basics',
    description: 'Master JavaScript fundamentals with interactive challenges and hands-on practice.',
    duration: '6:00',
    category: 'basics',
    difficulty: 'beginner',
    videoUrl: 'js-basics-demo',
    icon: BookOpen,
    tags: ['JavaScript', 'Beginner', 'Practice', 'Challenges'],
    relatedChallenges: ['hello-world-js', 'sum-two-numbers', 'reverse-string'],
    steps: [
      { timestamp: 0, title: 'Introduction to Functions', description: 'Learn function syntax and return statements', challengeId: 'hello-world-js' },
      { timestamp: 60, title: 'Working with Parameters', description: 'Practice using function parameters', challengeId: 'sum-two-numbers' },
      { timestamp: 150, title: 'String Manipulation', description: 'Master string methods and transformations', challengeId: 'reverse-string' },
      { timestamp: 270, title: 'Array Operations', description: 'Learn to work with arrays', challengeId: 'find-largest' }
    ]
  },
  {
    id: 'vr-workspace',
    title: 'VR Workspace Immersion',
    description: 'Learn how to enter and navigate the VR workspace with spatial file organization and 3D code visualization.',
    duration: '4:30',
    category: 'vr-ar',
    difficulty: 'intermediate',
    videoUrl: 'vr-workspace-demo',
    icon: Desktop,
    tags: ['VR', 'WebXR', 'Immersive', 'Spatial'],
    steps: [
      { timestamp: 0, title: 'Entering VR Mode', description: 'Click the VR Workspace button in the toolbar', action: 'vr-workspace' },
      { timestamp: 45, title: 'Navigate Files in 3D', description: 'Use controllers or gaze to select floating file nodes' },
      { timestamp: 120, title: 'Spatial Gestures', description: 'Pinch to zoom, swipe to navigate, grab to move files' },
      { timestamp: 210, title: 'Exit VR Mode', description: 'Press menu button or click Exit VR' }
    ]
  },
  {
    id: 'vr-code-view',
    title: 'VR Code Visualization',
    description: 'Experience your code in 3D space with syntax highlighting and interactive code blocks floating around you.',
    duration: '3:45',
    category: 'vr-ar',
    difficulty: 'intermediate',
    videoUrl: 'vr-code-demo',
    icon: Eye,
    tags: ['VR', 'Code View', '3D', 'Syntax'],
    steps: [
      { timestamp: 0, title: 'Open a File', description: 'Select any code file in the editor', action: 'open-file' },
      { timestamp: 30, title: 'Launch VR Code View', description: 'Click the VR Code View button (eye icon)', action: 'vr-code' },
      { timestamp: 90, title: 'Navigate Code Blocks', description: 'Look around to see code in 3D space' },
      { timestamp: 150, title: 'Edit in VR', description: 'Use virtual keyboard or voice commands to edit' }
    ]
  },
  {
    id: 'ar-overlay',
    title: 'AR Code Overlay',
    description: 'Project your code onto real-world surfaces using augmented reality and interact with it hands-free.',
    duration: '3:15',
    category: 'vr-ar',
    difficulty: 'intermediate',
    videoUrl: 'ar-overlay-demo',
    icon: Cube,
    tags: ['AR', 'WebXR', 'Mixed Reality', 'Hands-free'],
    steps: [
      { timestamp: 0, title: 'Grant Camera Permission', description: 'Allow camera access for AR features' },
      { timestamp: 20, title: 'Activate AR Mode', description: 'Click the AR Code Overlay button (map pin icon)', action: 'ar' },
      { timestamp: 60, title: 'Position Code Panel', description: 'Point camera at surface and tap to anchor' },
      { timestamp: 120, title: 'Use Gestures', description: 'Pinch to resize, swipe to scroll through code' }
    ]
  },
  {
    id: 'voice-commands',
    title: 'Voice Coding Basics',
    description: 'Master hands-free coding with voice commands for navigation, editing, and file management.',
    duration: '5:00',
    category: 'voice',
    difficulty: 'beginner',
    videoUrl: 'voice-commands-demo',
    icon: Microphone,
    tags: ['Voice', 'Hands-free', 'Accessibility', 'Commands'],
    steps: [
      { timestamp: 0, title: 'Enable Voice Panel', description: 'Click the Microphone icon in toolbar', action: 'voice' },
      { timestamp: 30, title: 'Basic Commands', description: 'Try "save file", "new file", "close file"' },
      { timestamp: 120, title: 'Code Generation', description: 'Say "generate function that..." to create code' },
      { timestamp: 210, title: 'Navigation', description: 'Use "go to line", "scroll up/down", "next file"' }
    ]
  },
  {
    id: 'custom-voice-training',
    title: 'Custom Voice Commands',
    description: 'Train personalized voice commands and create custom shortcuts for your unique workflow.',
    duration: '4:15',
    category: 'voice',
    difficulty: 'advanced',
    videoUrl: 'voice-training-demo',
    icon: Brain,
    tags: ['Voice', 'Training', 'Custom', 'AI'],
    steps: [
      { timestamp: 0, title: 'Open Voice Panel', description: 'Access the voice commands interface', action: 'voice' },
      { timestamp: 20, title: 'Create Custom Command', description: 'Click "Train New Command" button' },
      { timestamp: 60, title: 'Record Phrase', description: 'Say your custom phrase 3-5 times' },
      { timestamp: 150, title: 'Assign Action', description: 'Link phrase to an editor action or code snippet' },
      { timestamp: 220, title: 'Test Command', description: 'Try your new voice command in the editor' }
    ]
  },
  {
    id: 'ai-pair-programmer',
    title: 'AI Pair Programming',
    description: 'Collaborate with AI in real-time for code review, suggestions, and automated refactoring.',
    duration: '5:30',
    category: 'ai',
    difficulty: 'intermediate',
    videoUrl: 'ai-pair-demo',
    icon: Robot,
    tags: ['AI', 'Collaboration', 'Code Review', 'GPT-4'],
    steps: [
      { timestamp: 0, title: 'Open AI Pair Panel', description: 'Click the Robot icon in toolbar', action: 'pair' },
      { timestamp: 30, title: 'Start Session', description: 'Describe what you want to build' },
      { timestamp: 90, title: 'Review Suggestions', description: 'See AI-generated code in real-time' },
      { timestamp: 180, title: 'Iterative Refinement', description: 'Chat with AI to improve the code' },
      { timestamp: 270, title: 'Apply Changes', description: 'Accept suggestions and integrate into your project' }
    ]
  },
  {
    id: 'sentient-debugger',
    title: 'Sentient Debugger',
    description: 'Experience revolutionary AI-powered debugging that predicts issues before they occur.',
    duration: '4:45',
    category: 'ai',
    difficulty: 'advanced',
    videoUrl: 'sentient-debugger-demo',
    icon: Brain,
    tags: ['AI', 'Debugging', 'Predictive', 'Analysis'],
    steps: [
      { timestamp: 0, title: 'Enable Sentient Mode', description: 'Click the purple Brain icon', action: 'sentient' },
      { timestamp: 30, title: 'Real-time Analysis', description: 'Watch as AI analyzes your code continuously' },
      { timestamp: 120, title: 'Predictive Warnings', description: 'See potential bugs highlighted before running' },
      { timestamp: 200, title: 'AI-Suggested Fixes', description: 'Review and apply automated fixes' }
    ]
  },
  {
    id: 'research-papers',
    title: 'Research Paper Integration',
    description: 'Search arXiv, link papers to code, and auto-generate citations for research-driven development.',
    duration: '4:00',
    category: 'research',
    difficulty: 'intermediate',
    videoUrl: 'research-papers-demo',
    icon: Article,
    tags: ['Research', 'arXiv', 'Citations', 'Science'],
    steps: [
      { timestamp: 0, title: 'Open Papers Panel', description: 'Click the Article icon in toolbar', action: 'papers' },
      { timestamp: 20, title: 'Search arXiv', description: 'Enter keywords to find relevant papers' },
      { timestamp: 90, title: 'Link to Code', description: 'Associate papers with your implementation' },
      { timestamp: 150, title: 'Generate Citations', description: 'Auto-create BibTeX or formatted citations' }
    ]
  },
  {
    id: 'experiment-tracking',
    title: 'Experiment Tracking',
    description: 'Track ML experiments with version control, parameter logging, and result visualization.',
    duration: '5:15',
    category: 'research',
    difficulty: 'advanced',
    videoUrl: 'experiment-tracking-demo',
    icon: Flask,
    tags: ['Experiments', 'ML', 'Tracking', 'Versioning'],
    steps: [
      { timestamp: 0, title: 'Open Experiments Panel', description: 'Click the Flask icon', action: 'experiments' },
      { timestamp: 30, title: 'Create Experiment', description: 'Name and describe your experiment' },
      { timestamp: 90, title: 'Log Parameters', description: 'Set hyperparameters and configurations' },
      { timestamp: 180, title: 'Run & Track', description: 'Execute code and auto-log results' },
      { timestamp: 270, title: 'Compare Runs', description: 'View side-by-side comparison of experiments' }
    ]
  },
  {
    id: 'reproducibility-engine',
    title: 'Reproducibility Engine',
    description: 'Package entire environments with dependencies, data snapshots, and configurations for perfect reproducibility.',
    duration: '4:30',
    category: 'research',
    difficulty: 'advanced',
    videoUrl: 'reproducibility-demo',
    icon: CheckCircle,
    tags: ['Reproducibility', 'Environment', 'Sharing', 'Science'],
    steps: [
      { timestamp: 0, title: 'Open Reproducibility Panel', description: 'Click the Package icon', action: 'reproducibility' },
      { timestamp: 30, title: 'Create Snapshot', description: 'Capture current environment state' },
      { timestamp: 120, title: 'Export Package', description: 'Generate shareable reproducibility package' },
      { timestamp: 200, title: 'Restore Environment', description: 'Load a saved environment snapshot' }
    ]
  },
  {
    id: '3d-gallery',
    title: '3D Code Gallery',
    description: 'Explore your codebase in an interactive 3D gallery with WebGL visualizations.',
    duration: '3:30',
    category: '3d',
    difficulty: 'beginner',
    videoUrl: '3d-gallery-demo',
    icon: Cube,
    tags: ['3D', 'WebGL', 'Visualization', 'Gallery'],
    steps: [
      { timestamp: 0, title: 'Open 3D Gallery', description: 'Click the Image Square icon', action: 'gallery3d' },
      { timestamp: 20, title: 'Navigate Exhibits', description: 'Use mouse to rotate and explore 3D scenes' },
      { timestamp: 90, title: 'View Code Structures', description: 'See different visualization styles' },
      { timestamp: 150, title: 'Performance Settings', description: 'Adjust graphics quality for your device' }
    ]
  },
  {
    id: 'holographic-viz',
    title: 'Holographic Code Visualization',
    description: 'View code structure as a 3D hologram with real-time dependency mapping and flow analysis.',
    duration: '4:00',
    category: '3d',
    difficulty: 'intermediate',
    videoUrl: 'holographic-demo',
    icon: Cube,
    tags: ['3D', 'Holographic', 'Dependencies', 'Flow'],
    steps: [
      { timestamp: 0, title: 'Select Code File', description: 'Open a file with functions and imports' },
      { timestamp: 20, title: 'Launch Holographic View', description: 'Click the Cube icon', action: 'holographic' },
      { timestamp: 60, title: 'Explore 3D Structure', description: 'Rotate to see call graphs and dependencies' },
      { timestamp: 150, title: 'Interactive Nodes', description: 'Click nodes to jump to code sections' }
    ]
  }
]

export function VideoTutorialPanel({ onClose, onStartFeature }: VideoTutorialPanelProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [playingStep, setPlayingStep] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useKV<Record<string, TutorialProgress>>('tutorial-progress', {})

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutorial.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = activeCategory === 'all' || tutorial.category === activeCategory
    return matchesSearch && matchesCategory
  }).map(tutorial => ({
    ...tutorial,
    completed: progress?.[tutorial.id]?.completed || false
  }))

  const handlePlayStep = (stepIndex: number) => {
    setPlayingStep(stepIndex)
    setIsPlaying(true)
    
    if (selectedTutorial) {
      setProgress((current) => {
        const tutorialProgress = current?.[selectedTutorial.id] || {
          tutorialId: selectedTutorial.id,
          completed: false,
          stepsCompleted: [],
          totalSteps: selectedTutorial.steps.length,
          lastViewed: Date.now(),
          bookmarked: false
        }
        
        const stepsCompleted = tutorialProgress.stepsCompleted.includes(stepIndex)
          ? tutorialProgress.stepsCompleted
          : [...tutorialProgress.stepsCompleted, stepIndex].sort((a, b) => a - b)
        
        const completed = stepsCompleted.length === selectedTutorial.steps.length
        
        return {
          ...(current || {}),
          [selectedTutorial.id]: {
            ...tutorialProgress,
            stepsCompleted,
            completed,
            lastViewed: Date.now(),
            completedAt: completed ? Date.now() : tutorialProgress.completedAt
          }
        }
      })
      
      if ((progress?.[selectedTutorial.id]?.stepsCompleted.length || 0) + 1 === selectedTutorial.steps.length) {
        toast.success('Tutorial completed! 🎉', {
          description: 'Check your progress tracker for achievements.'
        })
      }
    }
  }

  const handleToggleBookmark = () => {
    if (selectedTutorial) {
      setProgress((current) => {
        const tutorialProgress = current?.[selectedTutorial.id] || {
          tutorialId: selectedTutorial.id,
          completed: false,
          stepsCompleted: [],
          totalSteps: selectedTutorial.steps.length,
          lastViewed: Date.now(),
          bookmarked: false
        }
        
        const bookmarked = !tutorialProgress.bookmarked
        
        toast.success(bookmarked ? 'Tutorial bookmarked' : 'Bookmark removed')
        
        return {
          ...(current || {}),
          [selectedTutorial.id]: {
            ...tutorialProgress,
            bookmarked
          }
        }
      })
    }
  }

  const handleStepAction = (action?: string) => {
    if (action && onStartFeature) {
      onStartFeature(action)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vr-ar': return Desktop
      case 'voice': return Microphone
      case 'ai': return Brain
      case 'research': return Article
      case '3d': return Cube
      default: return BookOpen
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-blue-400 bg-blue-500/20'
      case 'advanced': return 'text-purple-400 bg-purple-500/20'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      {showProgress ? (
        <TutorialProgressTracker
          onClose={() => setShowProgress(false)}
          onResumeTutorial={(tutorialId) => {
            const tutorial = tutorials.find(t => t.id === tutorialId)
            if (tutorial) {
              setSelectedTutorial(tutorial)
              setShowProgress(false)
            }
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-purple-400" weight="duotone" />
              <h2 className="text-sm font-semibold">Video Tutorials</h2>
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

          {!selectedTutorial ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="basics" className="text-xs">Basics</TabsTrigger>
                <TabsTrigger value="vr-ar" className="text-xs">VR/AR</TabsTrigger>
                <TabsTrigger value="voice" className="text-xs">Voice</TabsTrigger>
              </TabsList>
              <TabsList className="grid grid-cols-3 w-full mt-2">
                <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                <TabsTrigger value="research" className="text-xs">Research</TabsTrigger>
                <TabsTrigger value="3d" className="text-xs">3D</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-between mb-3">
              <span>{filteredTutorials.length} tutorials found</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => setShowProgress(true)}
              >
                <Trophy className="h-3 w-3 mr-1" />
                My Progress
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 pt-0 space-y-3">
              {filteredTutorials.map((tutorial) => {
                const Icon = tutorial.icon
                return (
                  <Card
                    key={tutorial.id}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-accent/50 hover:border-primary/50",
                      tutorial.completed && "border-green-500/50 bg-green-500/5"
                    )}
                    onClick={() => setSelectedTutorial(tutorial)}
                  >
                    <CardHeader className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" weight="duotone" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {tutorial.title}
                              {tutorial.completed && (
                                <CheckCircle className="h-3 w-3 text-green-400" weight="fill" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {tutorial.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {tutorial.duration}
                        </Badge>
                        <Badge className={cn("text-xs", getDifficultyColor(tutorial.difficulty))}>
                          {tutorial.difficulty}
                        </Badge>
                        {tutorial.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTutorial(null)
                setPlayingStep(-1)
                setIsPlaying(false)
              }}
              className="mb-3"
            >
              ← Back to Tutorials
            </Button>
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <selectedTutorial.icon className="h-5 w-5 text-primary" weight="duotone" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedTutorial.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{selectedTutorial.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedTutorial.duration}
                  </Badge>
                  <Badge className={cn("text-xs", getDifficultyColor(selectedTutorial.difficulty))}>
                    {selectedTutorial.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-border bg-muted/30">
            <div className="aspect-video bg-background rounded-lg flex items-center justify-center border border-border overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />
              <div className="relative z-10 text-center">
                <Play className="h-12 w-12 mx-auto text-primary mb-2" weight="duotone" />
                <p className="text-xs text-muted-foreground">Interactive Tutorial Video</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedTutorial.videoUrl}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Tutorial Steps</h4>
                <Badge variant="secondary" className="text-xs">
                  {selectedTutorial.steps.length} steps
                </Badge>
              </div>

              {selectedTutorial.steps.map((step, index) => (
                <Card
                  key={index}
                  className={cn(
                    "cursor-pointer transition-all hover:bg-accent/50",
                    playingStep === index && "border-primary bg-primary/5"
                  )}
                  onClick={() => handlePlayStep(index)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0",
                        playingStep === index 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm">{step.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {step.description}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(step.timestamp / 60)}:{(step.timestamp % 60).toString().padStart(2, '0')}
                          </Badge>
                          {step.action && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStepAction(step.action)
                              }}
                            >
                              <Sparkle className="h-3 w-3 mr-1" />
                              Try Now
                            </Button>
                          )}
                          {step.challengeId && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStepAction('challenges')
                              }}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Practice
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayStep(index)
                        }}
                      >
                        {playingStep === index && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  if (selectedTutorial.steps[0]?.action) {
                    handleStepAction(selectedTutorial.steps[0].action)
                  }
                }}
              >
                <Play className="h-4 w-4 mr-2" weight="fill" />
                Start Tutorial
              </Button>
              <Button 
                variant="outline"
                onClick={handleToggleBookmark}
              >
                <Star 
                  className="h-4 w-4 mr-2" 
                  weight={progress?.[selectedTutorial.id]?.bookmarked ? 'fill' : 'regular'} 
                />
                Bookmark
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
