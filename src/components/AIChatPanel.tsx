import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, PaperPlaneTilt, Code, Sparkle, Copy, Check, Brain } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { croweAI, type CroweAIMessage } from '@/lib/crowe-ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AIChatPanelProps {
  onClose: () => void
  userId?: string
  currentFile?: {
    name: string
    content: string
    language: string
  }
  onApplyCode?: (code: string) => void
}

export function AIChatPanel({ onClose, userId, currentFile, onApplyCode }: AIChatPanelProps) {
  const chatKey = `crowe-code-ai-chat-${userId || 'anon'}`
  const [messages, setMessages] = useKV<Message[]>(chatKey, [])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((current) => [...(current || []), userMessage])
    setInput('')
    setIsLoading(true)

    try {
      let contextPrompt = input.trim()
      
      if (currentFile) {
        contextPrompt = `I'm working on a file called "${currentFile.name}" (${currentFile.language}). Here's the current content:

\`\`\`${currentFile.language}
${currentFile.content}
\`\`\`

User question: ${input.trim()}`
      }

      const promptText = `You are an expert coding assistant integrated into a VS Code-style editor called Crowe Code. Help the user with their coding questions, debugging, and code improvements. Be concise but thorough. If providing code, use proper markdown code blocks with language tags.

${contextPrompt}`

      const response = await window.spark.llm(promptText, 'gpt-4o')

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }

      setMessages((current) => [...(current || []), assistantMessage])
    } catch (error) {
      toast.error('Failed to get AI response')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const extractCodeBlocks = (content: string): string[] => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
    const matches: string[] = []
    let match
    while ((match = codeBlockRegex.exec(content)) !== null) {
      matches.push(match[1].trim())
    }
    return matches
  }

  const clearHistory = () => {
    setMessages([])
    toast.success('Chat history cleared')
  }

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] border-l border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
              <Brain className="h-4 w-4 text-white" weight="fill" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold">Crowe Logic</h2>
            <span className="text-xs text-muted-foreground">AI Assistant</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearHistory}
            className="h-7 text-xs"
          >
            Clear
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="space-y-4">
          {(messages || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                  <Brain className="h-8 w-8 text-white" weight="fill" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold mb-1">Crowe Logic AI</p>
              <p className="text-sm">Ask me anything about your code!</p>
              <p className="text-xs mt-2">I can help with debugging, refactoring, explaining code, and more.</p>
            </div>
          )}
          
          {(messages || []).map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                    <Brain className="h-4 w-4 text-white" weight="fill" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-2.5 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border'
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content.split('```').map((part, i) => {
                    if (i % 2 === 1) {
                      const lines = part.split('\n')
                      const lang = lines[0]
                      const code = lines.slice(1).join('\n')
                      
                      return (
                        <div key={i} className="my-2 relative group">
                          <div className="bg-[var(--editor-bg)] rounded-md p-3 font-mono text-xs overflow-x-auto border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-muted-foreground text-xs">{lang || 'code'}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(code, `code-${message.id}-${i}`)}
                                  className="h-6 w-6"
                                >
                                  {copiedId === `code-${message.id}-${i}` ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                                {onApplyCode && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      onApplyCode(code)
                                      toast.success('Code applied to editor')
                                    }}
                                    className="h-6 w-6"
                                  >
                                    <Code className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <pre className="text-foreground">{code}</pre>
                          </div>
                        </div>
                      )
                    }
                    return <span key={i}>{part}</span>
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                  <Brain className="h-4 w-4 text-white" weight="fill" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-lg px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        {currentFile && (
          <div className="mb-2 text-xs text-muted-foreground flex items-center gap-1">
            <Code className="h-3 w-3" />
            <span>Context: {currentFile.name}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px] shrink-0"
          >
            <PaperPlaneTilt className="h-5 w-5" weight="fill" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
