import { Code, File, Folder, User, Sparkle, Robot, ChatCircleText, ArrowsClockwise, Play, Bug, Brain, ChartBar, Speedometer } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedLogo } from '@/components/AnimatedLogo'

interface WelcomeScreenProps {
  onCreateFile: () => void
  userName?: string
}

export function WelcomeScreen({ onCreateFile, userName }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-background text-foreground overflow-auto">
      <div className="max-w-2xl text-center space-y-6 p-8">
        <div className="flex justify-center">
          <AnimatedLogo className="text-5xl" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl font-bold">Crowe Code</h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-xs">
              REVOLUTIONARY
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            The world's first AI-native code editor with live execution & visual debugging
          </p>
          {userName && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <User className="w-3.5 h-3.5" />
              <span>Welcome back, {userName}</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Play className="w-5 h-5" weight="fill" />
              <h2 className="font-semibold text-sm">Live Execution</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Run JavaScript/TypeScript instantly in the browser with real-time output
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Bug className="w-5 h-5" weight="fill" />
              <h2 className="font-semibold text-sm">Visual Debugger</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Step through code, inspect variables, and travel through execution timeline
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Brain className="w-5 h-5" weight="fill" />
              <h2 className="font-semibold text-sm">AI Predictions</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              AI predicts your next code changes with confidence scoring
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Robot className="w-5 h-5" weight="fill" />
              <h2 className="font-semibold text-sm">AI Pair Programmer</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Collaborate with AI that implements features alongside you
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <ChartBar className="w-5 h-5" weight="fill" />
              <h2 className="font-semibold text-sm">Complexity Analyzer</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Visual heat maps show code complexity with refactoring suggestions
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <Speedometer className="w-5 h-5" weight="fill" />
              <h2 className="font-semibold text-sm">Performance Profiler</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Line-by-line execution timing with optimization recommendations
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={onCreateFile}
            className="w-full gap-2"
            size="lg"
          >
            <File className="w-4 h-4" />
            Create Your First File
          </Button>

          <div className="text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Sparkle className="w-3 h-3" weight="fill" />
              All files auto-save to your workspace
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium">Essential Shortcuts</p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Ctrl+N</kbd>
              <span className="ml-2">New File</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Ctrl+S</kbd>
              <span className="ml-2">Save</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Ctrl+K</kbd>
              <span className="ml-2">AI Chat</span>
            </div>
            <div>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Ctrl+B</kbd>
              <span className="ml-2">Toggle Sidebar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
