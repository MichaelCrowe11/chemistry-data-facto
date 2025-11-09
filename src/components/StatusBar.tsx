import { EditorTab } from '@/types/editor'

interface StatusBarProps {
  activeTab: EditorTab | null
}

export function StatusBar({ activeTab }: StatusBarProps) {
  return (
    <div 
      className="h-6 px-3 flex items-center justify-between text-xs bg-[var(--status-bar-bg)] text-foreground border-t border-border"
      style={{ backgroundColor: 'var(--status-bar-bg)' }}
    >
      <div className="flex items-center gap-4">
        <span className="text-accent font-medium">Crowe Code</span>
        {activeTab && (
          <>
            <span className="text-muted-foreground">|</span>
            <span>{activeTab.language}</span>
          </>
        )}
      </div>
      {activeTab && (
        <div className="flex items-center gap-4">
          <span>
            Ln {activeTab.cursorPosition.line}, Col {activeTab.cursorPosition.column}
          </span>
          <span>UTF-8</span>
        </div>
      )}
    </div>
  )
}
