import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
  onCursorChange: (line: number, column: number) => void
  onSelectionChange?: (selection: string) => void
  language: string
}

export function CodeEditor({ content, onChange, onCursorChange, onSelectionChange, language }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lineCount, setLineCount] = useState(1)

  useEffect(() => {
    const lines = content.split('\n').length
    setLineCount(lines)
  }, [content])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      onChange(newContent)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleCursorMove = () => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const text = textarea.value.substring(0, textarea.selectionStart)
    const lines = text.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1
    onCursorChange(line, column)

    if (onSelectionChange) {
      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
      onSelectionChange(selectedText)
    }
  }

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className="h-full flex bg-[var(--editor-bg)]" style={{ backgroundColor: 'var(--editor-bg)' }}>
      <div 
        className="w-12 shrink-0 py-4 text-right pr-3 select-none text-[var(--editor-line-number)] text-sm leading-6"
        style={{ color: 'var(--editor-line-number)' }}
      >
        {lineNumbers.map(num => (
          <div key={num}>{num}</div>
        ))}
      </div>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onSelect={handleCursorMove}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          className={cn(
            "w-full h-full resize-none outline-none bg-transparent",
            "text-foreground py-4 pr-4 leading-6 text-sm",
            "editor-font"
          )}
          style={{ 
            caretColor: 'var(--accent)',
            tabSize: 2
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </div>
  )
}
