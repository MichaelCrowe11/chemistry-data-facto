import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Keyboard } from '@phosphor-icons/react'

const shortcuts = [
  { key: 'Cmd/Ctrl + S', action: 'Save current file' },
  { key: 'Cmd/Ctrl + N', action: 'Create new file' },
  { key: 'Cmd/Ctrl + W', action: 'Close current tab' },
  { key: 'Cmd/Ctrl + B', action: 'Toggle sidebar' },
  { key: 'Cmd/Ctrl + K', action: 'Toggle AI chat assistant' },
  { key: 'Tab', action: 'Insert 2 spaces / Accept AI suggestion' },
  { key: 'Shift + Enter', action: 'New line in chat' },
  { key: 'Esc', action: 'Dismiss AI suggestion' },
]

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-4">
            {shortcuts.map((shortcut, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.action}
                </span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
