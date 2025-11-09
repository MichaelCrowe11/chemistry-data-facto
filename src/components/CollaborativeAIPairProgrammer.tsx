import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Robot, 
  Sparkle, 
  CheckCircle, 
  Clock,
  Code,
  FileCode,
  ArrowRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface AITask {
  id: string
  type: 'implement' | 'refactor' | 'test' | 'document' | 'optimize'
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  progress: number
  result?: string
}

interface PairProgrammerProps {
  files: any[]
  activeFile?: any
  onCodeGenerated: (code: string) => void
  onFileCreated: (name: string, content: string) => void
}

export function CollaborativeAIPairProgrammer({
  files,
  activeFile,
  onCodeGenerated,
  onFileCreated
}: PairProgrammerProps) {
  const [isActive, setIsActive] = useState(false)
  const [tasks, setTasks] = useState<AITask[]>([])
  const [suggestion, setSuggestion] = useState<string>('')
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    if (isActive && activeFile) {
      generateSuggestions()
    }
  }, [isActive, activeFile?.content])

  const generateSuggestions = async () => {
    setThinking(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const suggestions = [
      "I notice this function could be optimized. Want me to refactor it?",
      "Should I add error handling to this code block?",
      "I can implement the TODO comment on line 15 for you.",
      "This component might benefit from memoization. Shall I add it?",
      "Would you like me to write unit tests for this function?"
    ]
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    setSuggestion(randomSuggestion)
    setThinking(false)
  }

  const startPairProgramming = () => {
    setIsActive(true)
    addTask({
      type: 'implement',
      description: 'Analyzing codebase for improvements...'
    })
  }

  const stopPairProgramming = () => {
    setIsActive(false)
    setTasks([])
    setSuggestion('')
  }

  const addTask = (taskData: Partial<AITask>) => {
    const newTask: AITask = {
      id: Date.now().toString(),
      type: taskData.type || 'implement',
      description: taskData.description || '',
      status: 'in-progress',
      progress: 0,
      ...taskData
    }

    setTasks(prev => [...prev, newTask])
    simulateTaskProgress(newTask.id)
  }

  const simulateTaskProgress = async (taskId: string) => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, progress: i } : task
      ))
    }

    setTasks(prev => prev.map(task =>
      task.id === taskId 
        ? { 
            ...task, 
            status: 'completed',
            result: generateCodeSample(task.type)
          } 
        : task
    ))
  }

  const generateCodeSample = (type: string): string => {
    switch (type) {
      case 'implement':
        return `function processData(data: any[]) {\n  return data.filter(item => item.active)\n    .map(item => item.value);\n}`
      case 'refactor':
        return `const optimizedFunction = useMemo(() => {\n  return expensiveOperation();\n}, [dependencies]);`
      case 'test':
        return `test('should process data correctly', () => {\n  const result = processData(mockData);\n  expect(result).toHaveLength(5);\n});`
      case 'document':
        return `/**\n * Processes the input data array\n * @param data - Array of items to process\n * @returns Filtered and mapped values\n */`
      case 'optimize':
        return `// Optimized version using Set for O(1) lookups\nconst uniqueIds = new Set(items.map(i => i.id));`
      default:
        return '// AI-generated code'
    }
  }

  const acceptSuggestion = () => {
    addTask({
      type: 'implement',
      description: suggestion
    })
    setSuggestion('')
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'implement': return <Code className="h-4 w-4" weight="bold" />
      case 'refactor': return <Sparkle className="h-4 w-4" weight="fill" />
      case 'test': return <CheckCircle className="h-4 w-4" weight="bold" />
      case 'document': return <FileCode className="h-4 w-4" weight="bold" />
      case 'optimize': return <ArrowRight className="h-4 w-4" weight="bold" />
      default: return <Code className="h-4 w-4" weight="bold" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'in-progress': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <Robot className="h-4 w-4 text-primary" weight="bold" />
          <span className="text-sm font-semibold">AI Pair Programmer</span>
          {isActive && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Active</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 py-3 border-b border-border bg-card">
        {!isActive ? (
          <Button
            size="sm"
            onClick={startPairProgramming}
            className="w-full h-9 gap-2"
          >
            <Robot className="h-4 w-4" weight="fill" />
            Start Pair Programming
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={stopPairProgramming}
            className="w-full h-9"
          >
            Stop Session
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {!isActive ? (
          <div className="p-4 text-center text-muted-foreground">
            <Robot className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">AI Ready to Collaborate</p>
            <p className="text-xs mt-1">Start a session to pair program with AI</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {suggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg border border-primary/50 bg-primary/5"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Robot className="h-5 w-5 text-primary mt-0.5" weight="fill" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">AI Suggestion</p>
                      <p className="text-xs text-muted-foreground">{suggestion}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={acceptSuggestion}
                      className="h-7 flex-1"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSuggestion('')}
                      className="h-7 flex-1"
                    >
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {thinking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                AI is thinking...
              </div>
            )}

            <Separator />

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Active Tasks
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-4">
                  No active tasks
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg border border-border bg-background/50"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {getTaskIcon(task.type)}
                          <span className="ml-1">{task.type}</span>
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs ml-auto", getStatusColor(task.status))}
                        >
                          {task.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                          {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" weight="fill" />}
                          {task.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground mb-2">{task.description}</p>

                      {task.status === 'in-progress' && (
                        <Progress value={task.progress} className="h-1" />
                      )}

                      {task.status === 'completed' && task.result && (
                        <>
                          <pre className="p-2 rounded bg-background border border-border/50 text-xs font-mono overflow-x-auto mt-2">
                            {task.result}
                          </pre>
                          <Button
                            size="sm"
                            onClick={() => onCodeGenerated(task.result!)}
                            className="w-full mt-2 h-7"
                          >
                            Apply Code
                          </Button>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
