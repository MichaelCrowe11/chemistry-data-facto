import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkle, Bug, ArrowsClockwise, ChatCircleText, Code } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AICodeActionsProps {
  selectedCode: string
  language: string
  onApplyCode?: (code: string) => void
  trigger?: React.ReactNode
}

export function AICodeActions({
  selectedCode,
  language,
  onApplyCode,
  trigger,
}: AICodeActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<string>('')

  const executeAction = async (action: 'explain' | 'refactor' | 'bugs' | 'improve') => {
    if (!selectedCode.trim()) {
      toast.error('No code selected')
      return
    }

    setIsLoading(true)
    setActiveAction(action)
    setResult('')

    try {
      let promptText = ''

      switch (action) {
        case 'explain':
          promptText = `Explain this ${language} code in clear, simple terms. Break down what it does step by step:

\`\`\`${language}
${selectedCode}
\`\`\`

Provide a concise explanation suitable for developers.`
          break

        case 'refactor':
          promptText = `Refactor this ${language} code to improve readability, performance, and follow best practices. Return ONLY the refactored code with brief comments explaining major changes:

\`\`\`${language}
${selectedCode}
\`\`\`

Focus on: clean code principles, performance optimization, and modern patterns.`
          break

        case 'bugs':
          promptText = `Analyze this ${language} code for potential bugs, security issues, edge cases, and anti-patterns:

\`\`\`${language}
${selectedCode}
\`\`\`

List each issue with:
1. Issue description
2. Why it's problematic
3. Suggested fix

If no issues found, confirm the code looks good.`
          break

        case 'improve':
          promptText = `Suggest improvements for this ${language} code. Consider error handling, type safety, edge cases, and documentation:

\`\`\`${language}
${selectedCode}
\`\`\`

Return the improved version with comments explaining changes.`
          break
      }

      const response = await window.spark.llm(promptText, 'gpt-4o')
      setResult(response)
    } catch (error) {
      toast.error('AI action failed')
      console.error(error)
      setResult('Failed to process request. Please try again.')
    } finally {
      setIsLoading(false)
      setActiveAction('')
    }
  }

  const extractCode = (text: string): string | null => {
    const codeBlockMatch = text.match(/```[\w]*\n([\s\S]*?)```/)
    return codeBlockMatch ? codeBlockMatch[1].trim() : null
  }

  const applyRefactoredCode = () => {
    const code = extractCode(result)
    if (code && onApplyCode) {
      onApplyCode(code)
      toast.success('Code applied to editor')
      setIsOpen(false)
    } else {
      toast.error('No code block found to apply')
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={!selectedCode.trim()}
          >
            <Sparkle className="h-4 w-4" weight="fill" />
            AI Actions
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent" weight="fill" />
              AI Code Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 border-b border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeAction('explain')}
              disabled={isLoading || !selectedCode.trim()}
              className={cn(
                'gap-2 justify-start',
                activeAction === 'explain' && 'bg-accent/10'
              )}
            >
              <ChatCircleText className="h-4 w-4" />
              Explain
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => executeAction('refactor')}
              disabled={isLoading || !selectedCode.trim()}
              className={cn(
                'gap-2 justify-start',
                activeAction === 'refactor' && 'bg-accent/10'
              )}
            >
              <ArrowsClockwise className="h-4 w-4" />
              Refactor
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => executeAction('bugs')}
              disabled={isLoading || !selectedCode.trim()}
              className={cn(
                'gap-2 justify-start',
                activeAction === 'bugs' && 'bg-accent/10'
              )}
            >
              <Bug className="h-4 w-4" />
              Find Bugs
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => executeAction('improve')}
              disabled={isLoading || !selectedCode.trim()}
              className={cn(
                'gap-2 justify-start',
                activeAction === 'improve' && 'bg-accent/10'
              )}
            >
              <Code className="h-4 w-4" />
              Improve
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            {!result && !isLoading && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Sparkle className="h-10 w-10 mx-auto mb-3 opacity-50" weight="duotone" />
                <p>Select an action to analyze your code</p>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {result && (
              <div className="text-sm space-y-3">
                {result.split('```').map((part, i) => {
                  if (i % 2 === 1) {
                    const lines = part.split('\n')
                    const lang = lines[0]
                    const code = lines.slice(1).join('\n')

                    return (
                      <div key={i} className="bg-[var(--editor-bg)] rounded-md p-3 font-mono text-xs overflow-x-auto border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground">{lang || language}</span>
                        </div>
                        <pre className="text-foreground">{code}</pre>
                      </div>
                    )
                  }
                  return (
                    <div key={i} className="whitespace-pre-wrap">
                      {part}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {result && extractCode(result) && onApplyCode && (
            <div className="p-3 border-t border-border">
              <Button
                size="sm"
                onClick={applyRefactoredCode}
                className="w-full gap-2"
              >
                <Code className="h-4 w-4" />
                Apply to Editor
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
