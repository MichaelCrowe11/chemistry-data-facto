import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Flask, Play, Trash, Download, TrendUp } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Experiment {
  id: string
  name: string
  timestamp: string
  parameters: Record<string, any>
  metrics: Record<string, number>
  code: string
  notes: string
  status: 'running' | 'completed' | 'failed'
}

interface ExperimentTrackingPanelProps {
  currentCode: string
  onRunExperiment?: (experimentId: string) => void
}

export function ExperimentTrackingPanel({ currentCode, onRunExperiment }: ExperimentTrackingPanelProps) {
  const [experiments, setExperiments] = useKV<Experiment[]>('research-experiments', [])
  const [experimentName, setExperimentName] = useState('')
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  const safeExperiments = experiments || []

  const startNewExperiment = () => {
    if (!experimentName.trim()) {
      toast.error('Please enter an experiment name')
      return
    }

    const newExperiment: Experiment = {
      id: `exp_${Date.now()}`,
      name: experimentName,
      timestamp: new Date().toISOString(),
      parameters: {},
      metrics: {},
      code: currentCode,
      notes: '',
      status: 'running'
    }

    setExperiments((current) => [newExperiment, ...(current || [])])
    setExperimentName('')
    setIsTracking(true)
    toast.success(`Started experiment: ${experimentName}`)
    onRunExperiment?.(newExperiment.id)
  }

  const completeExperiment = (id: string, metrics: Record<string, number>) => {
    setExperiments((current) =>
      (current || []).map((exp) =>
        exp.id === id
          ? { ...exp, metrics, status: 'completed' as const }
          : exp
      )
    )
    setIsTracking(false)
    toast.success('Experiment completed')
  }

  const deleteExperiment = (id: string) => {
    setExperiments((current) => (current || []).filter((exp) => exp.id !== id))
    toast.success('Experiment deleted')
  }

  const exportExperiments = () => {
    const csv = ['ID,Name,Timestamp,Status,Metrics,Parameters']
    safeExperiments.forEach((exp) => {
      const metricsStr = JSON.stringify(exp.metrics).replace(/,/g, ';')
      const paramsStr = JSON.stringify(exp.parameters).replace(/,/g, ';')
      csv.push(`${exp.id},${exp.name},${exp.timestamp},${exp.status},${metricsStr},${paramsStr}`)
    })

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiments_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Experiments exported to CSV')
  }

  const simulateMetrics = () => {
    const metrics = {
      accuracy: Math.random() * 0.3 + 0.7,
      loss: Math.random() * 0.5,
      f1_score: Math.random() * 0.25 + 0.75,
      precision: Math.random() * 0.2 + 0.8,
      recall: Math.random() * 0.2 + 0.75,
    }
    return metrics
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Flask className="h-5 w-5 text-primary" weight="fill" />
          <h2 className="text-sm font-semibold">Experiment Tracking</h2>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {safeExperiments.length} runs
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Experiment name..."
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startNewExperiment()}
              className="text-xs"
            />
            <Button
              size="sm"
              onClick={startNewExperiment}
              disabled={isTracking}
              className="shrink-0"
            >
              <Play className="h-4 w-4 mr-1" weight="fill" />
              Start
            </Button>
          </div>

          {isTracking && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const runningExp = safeExperiments.find((e) => e.status === 'running')
                  if (runningExp) {
                    completeExperiment(runningExp.id, simulateMetrics())
                  }
                }}
                className="flex-1 text-xs"
              >
                Complete Run
              </Button>
            </div>
          )}

          {safeExperiments.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={exportExperiments}
              className="w-full text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export to CSV
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {safeExperiments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Flask className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No experiments yet</p>
              <p className="mt-1">Track ML runs and compare results</p>
            </div>
          )}

          {safeExperiments.map((exp) => (
            <Card
              key={exp.id}
              className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedExp(selectedExp?.id === exp.id ? null : exp)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold truncate">{exp.name}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(exp.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      exp.status === 'completed'
                        ? 'default'
                        : exp.status === 'running'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="text-[10px] px-1.5 py-0 shrink-0"
                  >
                    {exp.status}
                  </Badge>
                </div>

                {exp.status === 'completed' && Object.keys(exp.metrics).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(exp.metrics).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1 text-[10px]">
                        <TrendUp className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-mono font-semibold">
                          {typeof value === 'number' ? value.toFixed(4) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedExp?.id === exp.id && (
                  <>
                    <Separator />
                    
                    {Object.keys(exp.metrics).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          All Metrics
                        </p>
                        {Object.entries(exp.metrics).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center text-[10px]"
                          >
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-mono font-semibold">
                              {typeof value === 'number' ? value.toFixed(6) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {exp.code && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          Code Snapshot
                        </p>
                        <pre className="text-[9px] bg-muted/50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                          {exp.code.slice(0, 200)}
                          {exp.code.length > 200 ? '...' : ''}
                        </pre>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteExperiment(exp.id)
                        }}
                        className="flex-1 h-7 text-[10px]"
                      >
                        <Trash className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          Track experiments, compare metrics, export results
        </p>
      </div>
    </div>
  )
}
