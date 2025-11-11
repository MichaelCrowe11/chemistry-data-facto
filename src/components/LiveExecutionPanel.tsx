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
  onRunComplete?: (summary: {
    durationMs: number
    logs: ExecutionResult[]
    timeline?: Array<{ t: number; label: string; data?: any }>
  }) => void
}

export function LiveExecutionPanel({ code, language, onBreakpointHit, onRunComplete }: LiveExecutionPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [autoRun, setAutoRun] = useState(false)
  const [results, setResults] = useState<ExecutionResult[]>([])
  const [executionTime, setExecutionTime] = useState<number>(0)
  const [instrument, setInstrument] = useState<boolean>(true)

  const executeCode = useCallback(async () => {
    // Normalize language values produced by detectLanguage (e.g. 'JavaScript', 'TypeScript')
    const normalized = language.toLowerCase()
    const isSupported = normalized === 'javascript' || normalized === 'typescript' || normalized === 'javascript react' || normalized === 'typescript react'
    if (!isSupported) {
      setResults([{
        type: 'warn',
        content: `Live execution only supports JavaScript / TypeScript. Current language: ${language}`,
        timestamp: Date.now()
      }])
      return
    }

    setIsRunning(true)
    setResults([])

    // Spawn worker
    const worker = new Worker(new URL('@/workers/executor.ts', import.meta.url), { type: 'module' })

    const id = `${Date.now()}`
    let settled = false

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        worker.terminate()
        setExecutionTime(0)
        setResults([{
          type: 'error',
          content: 'Execution timed out',
          timestamp: Date.now()
        }])
        setIsRunning(false)
      }
    }, 3000)

    worker.onmessage = (e: MessageEvent<any>) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      const { durationMs, logs, result, error, timeline } = e.data as {
        durationMs: number; logs: any[]; result?: any; error?: string; timeline?: any[]
      }
      setExecutionTime(durationMs)
      const mapped = logs.map(l => ({ ...l })) as ExecutionResult[]
      if (typeof result !== 'undefined') {
        mapped.push({ type: 'result', content: `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`, timestamp: Date.now() })
      }
      setResults([
        { type: 'info', content: `✓ Execution completed in ${durationMs.toFixed(2)}ms`, timestamp: Date.now() },
        ...mapped
      ])
      onRunComplete?.({ durationMs, logs: mapped, timeline })
      setIsRunning(false)
      worker.terminate()
    }

    worker.onerror = () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setExecutionTime(0)
      setResults([{ type: 'error', content: 'Worker error during execution', timestamp: Date.now() }])
      setIsRunning(false)
      worker.terminate()
    }

    worker.postMessage({ id, code, language, instrument })
  }, [code, language, instrument, onRunComplete])

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

        <Button
          size="sm"
          variant={instrument ? 'default' : 'outline'}
          onClick={() => setInstrument(!instrument)}
          className="h-8 gap-2"
          aria-pressed={instrument}
          aria-label="Toggle instrumentation"
        >
          <Lightning className="h-4 w-4" weight={instrument ? 'fill' : 'regular'} />
          Instrument
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
              <p className="text-[10px] mt-2 text-muted-foreground">Sandboxed execution with 3s timeout. Enable Instrument for basic runtime tracing via __trace().</p>
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
