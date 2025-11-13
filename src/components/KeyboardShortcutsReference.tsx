import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from '@phosphor-icons/react'

const shortcuts = [
  {
    category: 'File Management',
    items: [
      { keys: ['Cmd/Ctrl', 'N'], description: 'Create new file' },
      { keys: ['Cmd/Ctrl', 'S'], description: 'Save current file' },
      { keys: ['Cmd/Ctrl', 'W'], description: 'Close current tab' },
    ],
  },
  {
    category: 'AI & Tools',
    items: [
      { keys: ['Cmd/Ctrl', 'K'], description: 'Open AI Chat' },
      { keys: ['Cmd/Ctrl', 'B'], description: 'Toggle sidebar' },
    ],
  },
  {
    category: 'Voice Commands',
    items: [
      { keys: ['Say'], description: '"Create function" - Generate code' },
      { keys: ['Say'], description: '"Save file" - Save current work' },
      { keys: ['Say'], description: '"Run code" - Execute code' },
    ],
  },
]

export function KeyboardShortcutsReference() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="h-5 w-5 text-purple-400" weight="duotone" />
        <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
      </div>

      {shortcuts.map((section, idx) => (
        <div key={idx}>
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            {section.category}
          </h4>
          <div className="space-y-2">
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
              >
                <span className="text-xs text-slate-400">{item.description}</span>
                <div className="flex gap-1">
                  {item.keys.map((key, keyIdx) => (
                    <kbd
                      key={keyIdx}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-xs text-purple-300">
          <strong>Pro Tip:</strong> Enable voice commands for a truly hands-free
          coding experience in VR/AR mode!
        </p>
      </div>
    </div>
  )
}
