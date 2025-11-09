import { Code, File, Folder, User, Sparkle, Robot, ChatCircleText, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AnimatedLogo } from '@/components/AnimatedLogo'

interface WelcomeScreenProps {
  onCreateFile: () => void
  userName?: string
}

export function WelcomeScreen({ onCreateFile, userName }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <AnimatedLogo className="text-5xl" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Crowe Code</h1>
          <p className="text-muted-foreground text-sm">
            AI-powered code editor for the web
          </p>
          {userName && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <User className="w-3.5 h-3.5" />
              <span>Welcome back, {userName}</span>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-accent">
            <Sparkle className="w-5 h-5" weight="fill" />
            <h2 className="font-semibold text-sm">AI-Powered Features</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <ChatCircleText className="w-4 h-4 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-medium">AI Chat</p>
                <p className="text-muted-foreground">Ask coding questions</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Code Actions</p>
                <p className="text-muted-foreground">Explain & refactor</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Robot className="w-4 h-4 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Bug Detection</p>
                <p className="text-muted-foreground">Find issues early</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowsClockwise className="w-4 h-4 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-medium">Smart Refactor</p>
                <p className="text-muted-foreground">Improve code quality</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={onCreateFile}
            className="w-full gap-2"
            size="lg"
          >
            <File className="w-4 h-4" />
            New File
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-2">
              <Folder className="w-3 h-3" />
              Files are saved automatically to your workspace
            </p>
          </div>
        </div>

        <div className="pt-8 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium">Keyboard Shortcuts</p>
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
              <span className="ml-2">Sidebar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
