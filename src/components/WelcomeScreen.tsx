import { Code, File, Folder } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface WelcomeScreenProps {
  onCreateFile: () => void
}

export function WelcomeScreen({ onCreateFile }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Code className="w-24 h-24 text-accent" weight="duotone" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Crowe Code</h1>
          <p className="text-muted-foreground text-sm">
            A modern code editor for the web
          </p>
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
              Files are saved automatically
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
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Ctrl+W</kbd>
              <span className="ml-2">Close Tab</span>
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
