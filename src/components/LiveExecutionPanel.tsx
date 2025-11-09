import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, SquaresFour, ArrowClockwise, Lightning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ExecutionResult {
  type: 'log' | 'error' | 'warn' | 'info' | 'result'
  content: string
  timestamp: number
  lineNumber?: number
}

interface LiveExecutionPanelProps {
  code: string
  language: string
  onBreakpointHit?: (line: number, variables: Record<string, any>) => void
}

export function LiveExecutionPanel({ code, language, onBreakpointHit }: LiveExecutionPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [autoRun, setAutoRun] = useState(false)
  const [results, setResults] = useState<ExecutionResult[]>([])
  const [executionTime, setExecutionTime] = useState<number>(0)

  const executeCode = useCallback(async () => {
    if (language !== 'javascript' && language !== 'typescript') {
      setResults([{
        type: 'warn',
        content: `Live execution only supports JavaScript/TypeScript. Current language: ${language}`,
        timestamp: Date.now()
      }])
      return
    }

    setIsRunning(true)
    setResults([])
    const startTime = performance.now()

    const capturedLogs: ExecutionResult[] = []
    
    const sandboxConsole = {
      log: (...args: any[]) => {
        capturedLogs.push({
          type: 'log',
          content: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          timestamp: Date.now()
        })
      },
      error: (...args: any[]) => {
        capturedLogs.push({
          type: 'error',
          content: args.map(arg => String(arg)).join(' '),
          timestamp: Date.now()
        })
      },
      warn: (...args: any[]) => {
        capturedLogs.push({
          type: 'warn',
          content: args.map(arg => String(arg)).join(' '),
          timestamp: Date.now()
        })
      },
      info: (...args: any[]) => {
        capturedLogs.push({
          type: 'info',
          content: args.map(arg => String(arg)).join(' '),
          timestamp: Date.now()
        })
      }
    }

    try {
      const wrappedCode = `
        (async function() {
          const console = arguments[0];
          ${code}
        })(sandboxConsole);
      `
      
      const AsyncFunction = async function() {}.constructor as any
      const executeFn = new AsyncFunction('sandboxConsole', wrappedCode)
      
      const result = await executeFn(sandboxConsole)
      
      if (result !== undefined) {
        capturedLogs.push({
          type: 'result',
          content: `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`,
          timestamp: Date.now()
        })
      }

      const endTime = performance.now()
      setExecutionTime(endTime - startTime)
      
      setResults([
        {
          type: 'info',
          content: `✓ Execution completed in ${(endTime - startTime).toFixed(2)}ms`,
          timestamp: Date.now()
        },
        ...capturedLogs
      ])
    } catch (error: any) {
      const endTime = performance.now()
      setExecutionTime(endTime - startTime)
      
      setResults([
        {
          type: 'error',
          content: `✗ ${error.message}`,
          timestamp: Date.now()
        },
        ...capturedLogs
      ])
    } finally {
      setIsRunning(false)
    }
  }, [code, language])

  useEffect(() => {
    if (autoRun) {
      const timeout = setTimeout(() => {
        executeCode()
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [code, autoRun, executeCode])

  const clearResults = () => {
    setResults([])
    setExecutionTime(0)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'error': return '✗'
      case 'warn': return '⚠'
      case 'info': return 'ℹ'
      case 'result': return '→'
      default: return '○'
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      case 'result': return 'text-green-400'
      default: return 'text-foreground'
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <SquaresFour className="h-4 w-4 text-primary" weight="bold" />
          <span className="text-sm font-semibold">Live Execution</span>
          {isRunning && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Running...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {executionTime > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Lightning className="h-3 w-3 mr-1" weight="fill" />
              {executionTime.toFixed(2)}ms
            </Badge>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border bg-card flex items-center gap-2">
        <Button
          size="sm"
          onClick={executeCode}
          disabled={isRunning}
          className="h-8 gap-2"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4" weight="fill" />
              Running
            </>
          ) : (
            <>
              <Play className="h-4 w-4" weight="fill" />
              Run Code
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          variant={autoRun ? 'default' : 'outline'}
          onClick={() => setAutoRun(!autoRun)}
          className="h-8 gap-2"
        >
          <Lightning className="h-4 w-4" weight={autoRun ? 'fill' : 'regular'} />
          Auto
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          size="sm"
          variant="ghost"
          onClick={clearResults}
          className="h-8 gap-2"
        >
          <ArrowClockwise className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2 font-mono text-xs">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Play className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No output yet</p>
              <p className="text-xs mt-1">Run your code to see results</p>
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-2 rounded border border-border/50 bg-background/50",
                  getResultColor(result.type)
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="opacity-50 select-none">{getResultIcon(result.type)}</span>
                  <pre className="flex-1 whitespace-pre-wrap break-all">{result.content}</pre>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
