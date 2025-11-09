import { useState, useEffect, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChartBar, Target, TrendUp, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ComplexityMetric {
  line: number
  score: number
  reasons: string[]
  suggestions: string[]
}

interface CodeComplexityVisualizerProps {
  code: string
  language: string
}

export function CodeComplexityVisualizer({ code, language }: CodeComplexityVisualizerProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null)

  const complexityMetrics = useMemo(() => {
    return analyzeComplexity(code)
  }, [code])

  const averageComplexity = useMemo(() => {
    if (complexityMetrics.length === 0) return 0
    const sum = complexityMetrics.reduce((acc, m) => acc + m.score, 0)
    return Math.round(sum / complexityMetrics.length)
  }, [complexityMetrics])

  const highComplexityLines = useMemo(() => {
    return complexityMetrics.filter(m => m.score > 70)
  }, [complexityMetrics])

  const getComplexityColor = (score: number): string => {
    if (score < 30) return 'bg-green-500/20 border-green-500/40'
    if (score < 50) return 'bg-yellow-500/20 border-yellow-500/40'
    if (score < 70) return 'bg-orange-500/20 border-orange-500/40'
    return 'bg-red-500/20 border-red-500/40'
  }

  const getComplexityLabel = (score: number): string => {
    if (score < 30) return 'Low'
    if (score < 50) return 'Moderate'
    if (score < 70) return 'High'
    return 'Critical'
  }

  const getComplexityTextColor = (score: number): string => {
    if (score < 30) return 'text-green-400'
    if (score < 50) return 'text-yellow-400'
    if (score < 70) return 'text-orange-400'
    return 'text-red-400'
  }

  const selectedMetric = selectedLine 
    ? complexityMetrics.find(m => m.line === selectedLine)
    : null

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <ChartBar className="h-4 w-4 text-primary" weight="bold" />
          <span className="text-sm font-semibold">Complexity Analysis</span>
        </div>
        <Badge 
          variant="secondary" 
          className={cn("text-xs", getComplexityTextColor(averageComplexity))}
        >
          Avg: {averageComplexity}
        </Badge>
      </div>

      <div className="px-3 py-3 border-b border-border bg-card space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Overall Complexity</span>
          <span className={cn("font-semibold", getComplexityTextColor(averageComplexity))}>
            {getComplexityLabel(averageComplexity)}
          </span>
        </div>
        
        <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              averageComplexity < 30 ? "bg-green-500" :
              averageComplexity < 50 ? "bg-yellow-500" :
              averageComplexity < 70 ? "bg-orange-500" : "bg-red-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${averageComplexity}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {highComplexityLines.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
            <Warning className="h-4 w-4 text-red-400" weight="fill" />
            <span className="text-xs text-red-400">
              {highComplexityLines.length} line{highComplexityLines.length !== 1 ? 's' : ''} need refactoring
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {complexityMetrics.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No Code to Analyze</p>
              <p className="text-xs mt-1">Start coding to see complexity metrics</p>
            </div>
          ) : (
            <>
              {complexityMetrics.map((metric) => (
                <motion.div
                  key={metric.line}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-2 rounded border cursor-pointer transition-all",
                    getComplexityColor(metric.score),
                    selectedLine === metric.line && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedLine(metric.line)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono">Line {metric.line}</span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getComplexityTextColor(metric.score))}
                    >
                      {metric.score}
                    </Badge>
                  </div>
                  
                  <div className="relative h-1 bg-background/50 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        metric.score < 30 ? "bg-green-500" :
                        metric.score < 50 ? "bg-yellow-500" :
                        metric.score < 70 ? "bg-orange-500" : "bg-red-500"
                      )}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {selectedMetric && (
        <div className="border-t border-border bg-[var(--sidebar-bg)] p-3 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Complexity Factors
            </h4>
            <div className="space-y-1">
              {selectedMetric.reasons.map((reason, idx) => (
                <div key={idx} className="text-xs flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedMetric.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendUp className="h-3 w-3" />
                Suggestions
              </h4>
              <div className="space-y-1">
                {selectedMetric.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="text-xs flex items-start gap-2 text-green-400">
                    <span>→</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
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

function analyzeComplexity(code: string): ComplexityMetric[] {
  const lines = code.split('\n')
  const metrics: ComplexityMetric[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) return

    let score = 10
    const reasons: string[] = []
    const suggestions: string[] = []

    if (trimmed.includes('for') || trimmed.includes('while')) {
      score += 15
      reasons.push('Contains loop')
    }

    if (trimmed.includes('if') || trimmed.includes('else') || trimmed.includes('switch')) {
      score += 10
      reasons.push('Conditional branching')
    }

    if ((trimmed.match(/&&|\|\|/g) || []).length > 1) {
      score += 20
      reasons.push('Complex boolean logic')
      suggestions.push('Extract conditions to variables')
    }

    if (trimmed.includes('try') || trimmed.includes('catch')) {
      score += 5
      reasons.push('Error handling')
    }

    const nestingLevel = line.match(/^\s*/)?.[0].length || 0
    if (nestingLevel > 8) {
      score += Math.floor(nestingLevel / 2)
      reasons.push('Deep nesting')
      suggestions.push('Extract to separate function')
    }

    if (line.length > 80) {
      score += 10
      reasons.push('Long line length')
      suggestions.push('Break into multiple lines')
    }

    if (trimmed.includes('any') && trimmed.includes(':')) {
      score += 8
      reasons.push('Uses "any" type')
      suggestions.push('Add proper type definition')
    }

    if (score > 50) {
      suggestions.push('Consider refactoring for better maintainability')
    }

    if (reasons.length > 0) {
      metrics.push({
        line: idx + 1,
        score: Math.min(score, 100),
        reasons,
        suggestions
      })
    }
  })

  return metrics
}
