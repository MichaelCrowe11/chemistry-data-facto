/**
 * Voice Command Analytics Dashboard
 * Displays usage statistics and training insights
 */

import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  ChartBar,
  TrendUp,
  Lightning,
  CheckCircle,
  Warning,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Sparkle
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  analyzeCommandUsage,
  suggestTrainingImprovements,
  exportVoiceTrainingData,
  importVoiceTrainingData,
  type CommandAnalytics,
  type TrainingSuggestion
} from '@/lib/voice-pattern-matching'

interface CustomVoiceCommand {
  id: string
  name: string
  description: string
  phrases: string[]
  actionType: 'insert-code' | 'run-command' | 'ai-generate' | 'custom-script'
  actionData: string
  createdAt: Date
  trainingSamples: string[]
  isActive: boolean
  confidenceThreshold?: number
  useCount?: number
  lastUsed?: Date
  tags?: string[]
}

interface VoiceAnalyticsDashboardProps {
  onClose: () => void
}

export function VoiceAnalyticsDashboard({ onClose }: VoiceAnalyticsDashboardProps) {
  const [customCommands, setCustomCommands] = useKV<CustomVoiceCommand[]>('custom-voice-commands', [])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState('')

  const analytics = useMemo(() => {
    return analyzeCommandUsage(customCommands || [])
  }, [customCommands])

  const suggestions = useMemo(() => {
    return suggestTrainingImprovements(customCommands || [])
  }, [customCommands])

  const totalCommands = (customCommands || []).length
  const activeCommands = (customCommands || []).filter(cmd => cmd.isActive).length
  const totalUses = (customCommands || []).reduce((sum, cmd) => sum + (cmd.useCount || 0), 0)
  const avgSamplesPerCommand = totalCommands > 0
    ? (customCommands || []).reduce((sum, cmd) => sum + cmd.trainingSamples.length, 0) / totalCommands
    : 0

  const mostUsedCommands = [...analytics]
    .sort((a, b) => b.totalUses - a.totalUses)
    .slice(0, 5)

  const recentlyUsedCommands = [...(customCommands || [])]
    .filter(cmd => cmd.lastUsed)
    .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
    .slice(0, 5)

  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high')
  const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium')

  const handleExport = () => {
    const exportJson = exportVoiceTrainingData(customCommands || [])
    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice-commands-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Voice commands exported successfully')
    setShowExportDialog(false)
  }

  const handleImport = () => {
    try {
      const importedCommands = importVoiceTrainingData(importData)
      
      setCustomCommands(prev => [...(prev || []), ...importedCommands])
      
      toast.success(`Imported ${importedCommands.length} voice commands`)
      setShowImportDialog(false)
      setImportData('')
    } catch (error) {
      toast.error('Failed to import: ' + (error as Error).message)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-muted-foreground'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartBar className="h-5 w-5 text-primary" weight="duotone" />
            <h2 className="text-lg font-semibold">Voice Command Analytics</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalCommands}</div>
                <div className="text-xs text-muted-foreground">Total Commands</div>
              </div>
              <Lightning className="h-8 w-8 text-primary opacity-50" weight="duotone" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {activeCommands} active
              </Badge>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalUses}</div>
                <div className="text-xs text-muted-foreground">Total Uses</div>
              </div>
              <TrendUp className="h-8 w-8 text-green-500 opacity-50" weight="duotone" />
            </div>
            <div className="mt-2">
              <div className="text-[10px] text-muted-foreground">
                Avg: {avgSamplesPerCommand.toFixed(1)} samples/command
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-3 w-3 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-3 w-3 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {highPrioritySuggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Warning className="h-4 w-4 text-yellow-500" />
                Training Improvements ({highPrioritySuggestions.length})
              </h3>
              <div className="space-y-2">
                {highPrioritySuggestions.map((suggestion, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-3 bg-yellow-500/5 border-yellow-500/20">
                      <div className="flex items-start gap-2">
                        <Badge variant={getPriorityBadge(suggestion.priority)} className="text-[10px] mt-0.5">
                          {suggestion.priority}
                        </Badge>
                        <div className="flex-1">
                          <div className="text-xs font-medium mb-1">
                            {suggestion.suggestion}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {suggestion.reason}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {mostUsedCommands.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendUp className="h-4 w-4 text-green-500" />
                  Most Used Commands
                </h3>
                <div className="space-y-2">
                  {mostUsedCommands.map((cmd, i) => {
                    const command = (customCommands || []).find(c => c.id === cmd.commandId)
                    if (!command) return null
                    
                    return (
                      <motion.div
                        key={cmd.commandId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{cmd.commandName}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {cmd.totalUses} uses
                                </Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  {command.trainingSamples.length} samples
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-green-500">
                                {(cmd.avgConfidence * 100).toFixed(0)}%
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                confidence
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <Progress value={cmd.avgConfidence * 100} className="h-1" />
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {recentlyUsedCommands.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-primary" />
                  Recently Used
                </h3>
                <div className="space-y-2">
                  {recentlyUsedCommands.map((cmd, i) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="p-3 bg-muted/30">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{cmd.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {cmd.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground">
                              {cmd.lastUsed ? new Date(cmd.lastUsed).toLocaleTimeString() : 'Never'}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mediumPrioritySuggestions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  Optional Improvements ({mediumPrioritySuggestions.length})
                </h3>
                <div className="space-y-2">
                  {mediumPrioritySuggestions.map((suggestion, i) => {
                    const command = (customCommands || []).find(c => c.id === suggestion.commandId)
                    if (!command) return null
                    
                    return (
                      <Card key={i} className="p-3 bg-blue-500/5 border-blue-500/10">
                        <div className="text-xs font-medium mb-1">
                          {command.name}: {suggestion.suggestion}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {suggestion.reason}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {totalCommands === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ChartBar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No commands to analyze yet</p>
              <p className="text-xs mt-1">Create and use custom voice commands to see analytics</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Voice Commands</DialogTitle>
            <DialogDescription>
              Download your trained voice commands as a JSON file to back up or share.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <div className="bg-muted rounded p-3">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total commands:</span>
                  <span className="font-medium">{totalCommands}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Training samples:</span>
                  <span className="font-medium">
                    {(customCommands || []).reduce((sum, cmd) => sum + cmd.trainingSamples.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File size:</span>
                  <span className="font-medium">
                    ~{(exportVoiceTrainingData(customCommands || []).length / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Voice Commands</DialogTitle>
            <DialogDescription>
              Paste JSON data from a previous export to restore voice commands.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <textarea
              className="w-full h-40 p-3 bg-muted rounded font-mono text-xs"
              placeholder="Paste JSON data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowImportDialog(false)
              setImportData('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importData.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
