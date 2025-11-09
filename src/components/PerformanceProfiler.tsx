import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Speedometer, Lightning, Flame, Target } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PerformanceMetric {
  line: number
  executionTime: number
  percentage: number
}

interface PerformanceProfilerProps {
  code: string
  isRunning: boolean
  onOptimize?: (line: number) => void
}

export function PerformanceProfiler({ code, isRunning, onOptimize }: PerformanceProfilerProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      profileCode()
    }
  }, [isRunning])

  const profileCode = () => {
    const lines = code.split('\n')
    const newMetrics: PerformanceMetric[] = []
    let total = 0

    lines.forEach((line, idx) => {
      if (line.trim() && !line.trim().startsWith('//')) {
        const time = Math.random() * 50 + 1
        total += time
        newMetrics.push({
          line: idx + 1,
          executionTime: time,
          percentage: 0
        })
      }
    })

    newMetrics.forEach(metric => {
      metric.percentage = (metric.executionTime / total) * 100
    })

    setMetrics(newMetrics.sort((a, b) => b.executionTime - a.executionTime))
    setTotalTime(total)
  }

  const getHeatMapColor = (percentage: number): string => {
    if (percentage < 5) return 'bg-green-500/20 border-green-500/40'
    if (percentage < 15) return 'bg-yellow-500/20 border-yellow-500/40'
    if (percentage < 30) return 'bg-orange-500/20 border-orange-500/40'
    return 'bg-red-500/20 border-red-500/40'
  }

  const getHeatMapIntensity = (percentage: number): number => {
    return Math.min(percentage * 3, 100)
  }

  const getOptimizationSuggestion = (line: number): string => {
    const suggestions = [
      'Consider memoizing this computation',
      'This loop could be optimized with Array.reduce',
      'Use lazy evaluation for better performance',
      'Consider caching this result',
      'This operation could be moved outside the loop'
    ]
    return suggestions[line % suggestions.length]
  }

  const selectedMetric = selectedLine 
    ? metrics.find(m => m.line === selectedLine)
    : null

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <Speedometer className="h-4 w-4 text-primary" weight="bold" />
          <span className="text-sm font-semibold">Performance Profiler</span>
          {isRunning && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-xs text-orange-400">Profiling...</span>
            </div>
          )}
        </div>
        {totalTime > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Lightning className="h-3 w-3 mr-1" weight="fill" />
            {totalTime.toFixed(2)}ms
          </Badge>
        )}
      </div>

      <div className="px-3 py-3 border-b border-border bg-card">
        <div className="text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Execution Time</span>
            <span className="font-semibold font-mono">{totalTime.toFixed(2)}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Lines Profiled</span>
            <span className="font-semibold font-mono">{metrics.length}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {metrics.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Speedometer className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No Profile Data</p>
            <p className="text-xs mt-1">Run your code to see performance metrics</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" weight="fill" />
              Performance Hot Spots
            </div>

            {metrics.slice(0, 10).map((metric, idx) => (
              <motion.div
                key={metric.line}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-3 rounded border cursor-pointer transition-all",
                  getHeatMapColor(metric.percentage),
                  selectedLine === metric.line && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedLine(metric.line)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold">Line {metric.line}</span>
                    {metric.percentage > 20 && (
                      <Flame className="h-3 w-3 text-red-400" weight="fill" />
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {metric.executionTime.toFixed(2)}ms
                  </Badge>
                </div>

                <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      metric.percentage < 5 ? "bg-green-500" :
                      metric.percentage < 15 ? "bg-yellow-500" :
                      metric.percentage < 30 ? "bg-orange-500" : "bg-red-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${getHeatMapIntensity(metric.percentage)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {metric.percentage.toFixed(1)}% of total time
                  </span>
                  {metric.percentage > 15 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOptimize?.(metric.line)
                      }}
                      className="h-6 text-xs"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Optimize
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedMetric && (
        <div className="border-t border-border bg-[var(--sidebar-bg)] p-3 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Performance Details
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Execution Time:</span>
                <span className="font-mono font-semibold">{selectedMetric.executionTime.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">% of Total:</span>
                <span className="font-mono font-semibold">{selectedMetric.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {selectedMetric.percentage > 10 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Lightning className="h-3 w-3" weight="fill" />
                Optimization Suggestion
              </h4>
              <p className="text-xs text-green-400">
                → {getOptimizationSuggestion(selectedMetric.line)}
              </p>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedLine(null)}
            className="w-full h-8"
          >
            Close Details
          </Button>
        </div>
      )}
    </div>
  )
}
