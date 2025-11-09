import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface AICompletionProps {
  content: string
  cursorPosition: { line: number; column: number }
  language: string
  onAccept: (completion: string) => void
  enabled: boolean
}

export function AICompletion({
  content,
  cursorPosition,
  language,
  onAccept,
  enabled,
}: AICompletionProps) {
  const [suggestion, setSuggestion] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const getSuggestion = useCallback(async () => {
    if (!enabled || !content.trim()) {
      setSuggestion('')
      return
    }

    setIsLoading(true)

    try {
      const lines = content.split('\n')
      const currentLineIndex = cursorPosition.line - 1
      const beforeCursor = lines.slice(0, currentLineIndex + 1).join('\n')
      const afterCursor = lines.slice(currentLineIndex + 1).join('\n')

      const promptText = `You are an AI code completion engine. Given the code context, suggest the next 1-3 lines of code that would logically follow. Return ONLY the code suggestion, no explanations, no markdown.

Language: ${language}

Code before cursor:
${beforeCursor}

Code after cursor:
${afterCursor}

Provide a concise, contextually appropriate code completion (1-3 lines max).`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini')
      const cleanedResponse = response
        .replace(/```[\w]*\n?/g, '')
        .replace(/```/g, '')
        .trim()

      if (cleanedResponse && cleanedResponse.length < 200) {
        setSuggestion(cleanedResponse)
      } else {
        setSuggestion('')
      }
    } catch (error) {
      console.error('AI completion error:', error)
      setSuggestion('')
    } finally {
      setIsLoading(false)
    }
  }, [content, cursorPosition, language, enabled])

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!enabled) {
      setSuggestion('')
      return
    }

    const timer = setTimeout(() => {
      getSuggestion()
    }, 1000)

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [content, cursorPosition])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestion && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        onAccept(suggestion)
        setSuggestion('')
      } else if (suggestion && e.key === 'Escape') {
        setSuggestion('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestion, onAccept])

  if (!suggestion || !enabled) return null

  return (
    <div className="absolute top-0 left-0 pointer-events-none z-10">
      <div className="text-muted-foreground/40 italic font-mono text-sm">
        {suggestion}
        <span className="ml-2 text-xs bg-accent/20 px-2 py-0.5 rounded">
          Tab to accept
        </span>
      </div>
    </div>
  )
}
