import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Lightning, TrendUp, MagicWand } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Prediction {
  id: string
  type: 'function' | 'variable' | 'import' | 'refactor' | 'fix'
  description: string
  code: string
  confidence: number
  reasoning: string
}

interface AIPredictionPanelProps {
  code: string
  language: string
  cursorLine: number
  onApplyPrediction: (code: string) => void
}

export function AIPredictionPanel({ 
  code, 
  language, 
  cursorLine,
  onApplyPrediction 
}: AIPredictionPanelProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null)

  useEffect(() => {
    const analyzePredictions = async () => {
      setIsAnalyzing(true)
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockPredictions: Prediction[] = generatePredictions(code, language, cursorLine)
      
      setPredictions(mockPredictions)
      setIsAnalyzing(false)
    }

    const debounce = setTimeout(analyzePredictions, 1500)
    return () => clearTimeout(debounce)
  }, [code, language, cursorLine])

  const generatePredictions = (code: string, lang: string, line: number): Prediction[] => {
    const predictions: Prediction[] = []
    const lines = code.split('\n')
    const currentLine = lines[line - 1] || ''

    if (code.includes('function') && !code.includes('return')) {
      predictions.push({
        id: '1',
        type: 'function',
        description: 'Add return statement',
        code: `return result;`,
        confidence: 85,
        reasoning: 'Function likely needs a return value based on context'
      })
    }

    if (code.includes('const') && code.split('\n').length > 10 && !code.includes('export')) {
      predictions.push({
        id: '2',
        type: 'refactor',
        description: 'Extract to separate function',
        code: `function extractedLogic() {\n  // Extracted code here\n}`,
        confidence: 72,
        reasoning: 'Code complexity suggests extraction would improve readability'
      })
    }

    if (lang === 'javascript' && !code.includes('import') && code.length > 50) {
      predictions.push({
        id: '3',
        type: 'import',
        description: 'Add common imports',
        code: `import { useState, useEffect } from 'react';`,
        confidence: 68,
        reasoning: 'React hooks appear to be needed based on code patterns'
      })
    }

    if (code.includes('console.log')) {
      predictions.push({
        id: '4',
        type: 'fix',
        description: 'Replace with proper logging',
        code: `logger.info('Message');`,
        confidence: 91,
        reasoning: 'Production code should use structured logging'
      })
    }

    if (predictions.length === 0) {
      predictions.push({
        id: '5',
        type: 'variable',
        description: 'Add error handling',
        code: `try {\n  // Your code\n} catch (error) {\n  console.error(error);\n}`,
        confidence: 78,
        reasoning: 'Adding error handling improves robustness'
      })
    }

    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  }

  const applyPrediction = (prediction: Prediction) => {
    onApplyPrediction(prediction.code)
    setSelectedPrediction(prediction.id)
    setTimeout(() => setSelectedPrediction(null), 2000)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'function': return <MagicWand className="h-4 w-4" weight="fill" />
      case 'refactor': return <TrendUp className="h-4 w-4" weight="fill" />
      case 'import': return <Lightning className="h-4 w-4" weight="fill" />
      case 'fix': return <Brain className="h-4 w-4" weight="fill" />
      default: return <Brain className="h-4 w-4" weight="fill" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'function': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'refactor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'import': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'fix': return 'bg-green-500/10 text-green-400 border-green-500/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-[var(--sidebar-bg)]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" weight="bold" />
          <span className="text-sm font-semibold">AI Predictions</span>
          {isAnalyzing && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Analyzing...</span>
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {predictions.length} suggestions
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {predictions.length === 0 && !isAnalyzing ? (
            <div className="text-center text-muted-foreground py-12">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">AI Learning Your Code</p>
              <p className="text-xs mt-1">Predictions will appear as you type</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {predictions.map((prediction, idx) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all",
                    selectedPrediction === prediction.id
                      ? "ring-2 ring-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs border", getTypeColor(prediction.type))}
                        >
                          {getTypeIcon(prediction.type)}
                          <span className="ml-1 capitalize">{prediction.type}</span>
                        </Badge>
                        <span className="text-sm font-medium">{prediction.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Progress value={prediction.confidence} className="h-1 flex-1" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {prediction.confidence}%
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground italic">
                      {prediction.reasoning}
                    </div>

                    <pre className="p-2 rounded bg-background/50 border border-border/50 text-xs font-mono overflow-x-auto">
                      {prediction.code}
                    </pre>

                    <Button
                      size="sm"
                      onClick={() => applyPrediction(prediction)}
                      className="w-full h-8 gap-2"
                      disabled={selectedPrediction === prediction.id}
                    >
                      {selectedPrediction === prediction.id ? (
                        <>
                          <Lightning className="h-4 w-4" weight="fill" />
                          Applied!
                        </>
                      ) : (
                        <>
                          <MagicWand className="h-4 w-4" weight="fill" />
                          Apply Suggestion
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
