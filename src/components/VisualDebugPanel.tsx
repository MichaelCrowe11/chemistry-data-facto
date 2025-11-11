import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Bug, 
  Play, 
  ArrowRight, 
  ArrowLeft, 
  SkipForward,
  CircleDashed,
  CheckCircle
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Variable {
  name: string
  value: any
  type: string
}

interface DebugState {
  line: number
  variables: Variable[]
  callStack: string[]
  codeSnippet?: string
}

interface VisualDebugPanelProps {
  code: string
  currentLine?: number
  timeline?: Array<{ t: number; label: string; data?: any }>
  onStepForward?: () => void
  onStepBack?: () => void
  onContinue?: () => void
}

export function VisualDebugPanel({ 
  code, 
  currentLine,
  timeline,
  onStepForward,
  onStepBack,
  onContinue
}: VisualDebugPanelProps) {
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugStates, setDebugStates] = useState<DebugState[]>([])
  const [currentStateIndex, setCurrentStateIndex] = useState(0)
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set())
  const [mode, setMode] = useState<'runtime' | 'heuristic'>('heuristic')

  const currentState = debugStates[currentStateIndex]

  const runtimeStates = useMemo<DebugState[]>(() => {
    if (!timeline || timeline.length === 0) return []
    return timeline
      .filter(entry => entry.label === 'line' && entry.data && typeof entry.data.line === 'number')
      .map(entry => ({
        line: entry.data.line as number,
        variables: Array.isArray(entry.data?.vars)
          ? (entry.data.vars as Variable[])
          : [],
        callStack: [`runtime trace (line ${entry.data.line})`],
        codeSnippet: entry.data?.code,
      }))
  }, [timeline])

  const buildHeuristicStates = useCallback((): DebugState[] => {
    const lines = code.split('\n')
    const states: DebugState[] = []
    const trackedVariables = new Map<string, any>()

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim()
      const varMatch = trimmedLine.match(/(?:const|let|var)\s+(\w+)\s*=\s*(.+)/)
      if (varMatch) {
        const [, varName, varValue] = varMatch
        try {
          const evaluatedValue = varValue.replace(/;$/, '')
          trackedVariables.set(varName, evaluatedValue)
        } catch (e) {
          trackedVariables.set(varName, varValue)
        }
      }

      if (trimmedLine && !trimmedLine.startsWith('//')) {
        const variables: Variable[] = Array.from(trackedVariables.entries()).map(([name, value]) => ({
          name,
          value,
          type: typeof value,
        }))

        states.push({
          line: idx + 1,
          variables,
          callStack: [`main (line ${idx + 1})`],
          codeSnippet: trimmedLine,
        })
      }
    })

    return states
  }, [code])

  const startDebugging = () => {
    const hasRuntime = runtimeStates.length > 0
    const states = hasRuntime ? runtimeStates : buildHeuristicStates()
    setDebugStates(states)
    setCurrentStateIndex(0)
    setIsDebugging(true)
    setMode(hasRuntime ? 'runtime' : 'heuristic')
  }

  const stopDebugging = () => {
    setIsDebugging(false)
    setDebugStates([])
    setCurrentStateIndex(0)
    setMode('heuristic')
  }

  const stepForward = () => {
    if (currentStateIndex < debugStates.length - 1) {
      setCurrentStateIndex(prev => prev + 1)
      onStepForward?.()
    }
  }

  const stepBackward = () => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(prev => prev - 1)
      onStepBack?.()
    }
  }

  const continueExecution = () => {
    const nextBreakpoint = debugStates.findIndex((state, idx) => 
      idx > currentStateIndex && breakpoints.has(state.line)
    )
    
    if (nextBreakpoint !== -1) {
      setCurrentStateIndex(nextBreakpoint)
    } else {
      setCurrentStateIndex(debugStates.length - 1)
    }
    onContinue?.()
  }

  const toggleBreakpoint = (line: number) => {
    setBreakpoints(prev => {
      const newSet = new Set(prev)
      if (newSet.has(line)) {
        newSet.delete(line)
      } else {
        newSet.add(line)
      }
      return newSet
    })
  }

  const formatValue = (value: any): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-400'
      case 'number': return 'text-blue-400'
      case 'boolean': return 'text-purple-400'
      case 'object': return 'text-yellow-400'
      case 'function': return 'text-pink-400'
      default: return 'text-foreground'
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" weight="bold" />
          <span className="text-sm font-semibold">Visual Debugger</span>
          {isDebugging && (
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {mode === 'runtime' ? 'Runtime Trace' : 'Heuristic'}
          </Badge>
        </div>
        {currentState && (
          <Badge variant="secondary" className="text-xs">
            Line {currentState.line}
          </Badge>
        )}
      </div>

      <div className="px-3 py-2 border-b border-border bg-card flex items-center gap-2">
        {!isDebugging ? (
          <Button
            size="sm"
            onClick={startDebugging}
            className="h-8 gap-2"
            aria-label="Start debugging"
          >
            <Play className="h-4 w-4" weight="fill" />
            Start Debugging
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={stepBackward}
              disabled={currentStateIndex === 0}
              className="h-8"
              aria-label="Step backward"
            >
              <ArrowLeft className="h-4 w-4" weight="bold" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={stepForward}
              disabled={currentStateIndex === debugStates.length - 1}
              className="h-8"
              aria-label="Step forward"
            >
              <ArrowRight className="h-4 w-4" weight="bold" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={continueExecution}
              className="h-8 gap-2"
              aria-label="Continue to next breakpoint"
            >
              <SkipForward className="h-4 w-4" weight="fill" />
              Continue
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              size="sm"
              variant="ghost"
              onClick={stopDebugging}
              className="h-8"
              aria-label="Stop debugging"
            >
              Stop
            </Button>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        {!isDebugging ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Debugger Ready</p>
            <p className="text-xs mt-1">
              {runtimeStates.length > 0
                ? 'Runtime trace available from last instrumentation run. Start debugging to replay it.'
                : 'No runtime trace captured yet. Run instrumented execution to enable richer debugging.'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Variables
              </h3>
              {currentState?.variables.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  {mode === 'runtime'
                    ? 'No variable snapshot captured for this trace event.'
                    : 'No variables in scope'}
                </div>
              ) : (
                <div className="space-y-2">
                  {currentState?.variables.map((variable, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-background/50 border border-border/50 font-mono text-xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-foreground">{variable.name}</span>
                        <Badge variant="outline" className={cn("text-xs", getTypeColor(variable.type))}>
                          {variable.type}
                        </Badge>
                      </div>
                      <pre className="text-muted-foreground whitespace-pre-wrap break-all">
                        {formatValue(variable.value)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Call Stack
              </h3>
              <div className="space-y-1">
                {currentState?.callStack.map((call, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-background/50 border border-border/50 font-mono text-xs flex items-center gap-2"
                  >
                    <CircleDashed className="h-3 w-3 text-primary" />
                    {call}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Execution Timeline
              </h3>
              <div className="space-y-1">
                {debugStates.map((state, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-2 rounded border cursor-pointer transition-colors text-xs font-mono flex items-center gap-2",
                      idx === currentStateIndex
                        ? "bg-primary/20 border-primary"
                        : "bg-background/30 border-border/50 hover:bg-background/50"
                    )}
                    onClick={() => setCurrentStateIndex(idx)}
                  >
                    {idx === currentStateIndex ? (
                      <CheckCircle className="h-3 w-3 text-primary" weight="fill" />
                    ) : (
                      <CircleDashed className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Line {state.line}</span>
                    <span className="text-muted-foreground">
                      ({state.variables.length} var{state.variables.length !== 1 ? 's' : ''})
                    </span>
                    {state.codeSnippet && (
                      <span className="text-muted-foreground truncate">— {state.codeSnippet}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
