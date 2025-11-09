import { EditorTab } from '@/types/editor'
import { X, Circle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface TabBarProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
  if (tabs.length === 0) return null

  return (
    <div 
      className="h-9 flex items-center bg-[var(--tab-inactive-bg)] border-b border-border overflow-x-auto"
      style={{ backgroundColor: 'var(--tab-inactive-bg)' }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "h-full px-3 flex items-center gap-2 cursor-pointer group relative shrink-0",
            "hover:bg-[var(--tab-active-bg)] transition-colors",
            "border-r border-border",
            activeTabId === tab.id && "bg-[var(--tab-active-bg)]"
          )}
          style={{
            backgroundColor: activeTabId === tab.id ? 'var(--tab-active-bg)' : undefined
          }}
          onClick={() => onTabSelect(tab.id)}
        >
          {activeTabId === tab.id && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
          )}
          
          <span className="text-sm text-foreground select-none">{tab.fileName}</span>
          
          {tab.isDirty ? (
            <Circle weight="fill" className="w-2 h-2 text-accent shrink-0" />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded p-0.5"
            >
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
