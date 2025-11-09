import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Warning, Info, Lightbulb, ShieldCheck } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface SentientDebuggerProps {
  code: string
  language: string
  cursorPosition: { line: number; column: number }
  onSuggestFix: (lineNumber: number, suggestion: string) => void
}

interface IntentionIssue {
  type: 'logic_error' | 'security' | 'performance' | 'best_practice'
  severity: 'critical' | 'warning' | 'info'
  lineNumber: number
  title: string
  description: string
  intention: string
  betterApproach: string
  autoFixAvailable: boolean
}

export function SentientDebugger({ code, language, cursorPosition, onSuggestFix }: SentientDebuggerProps) {
  const [issues, setIssues] = useState<IntentionIssue[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState('')

  useEffect(() => {
    const codeSignature = `${code.substring(0, 500)}-${code.length}`
    if (code && code.length > 30 && codeSignature !== lastAnalysis) {
      const debounceTimer = setTimeout(() => {
        analyzeIntent()
        setLastAnalysis(codeSignature)
      }, 2000)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [code])

  const analyzeIntent = async () => {
    setIsAnalyzing(true)
    
    try {
      const prompt = `You are a Sentient Debugger that understands developer *intent* not just syntax.

Analyze this ${language} code and identify where the developer's likely *intention* doesn't match what the code actually does:

${code}

Look for:
1. Logic errors where the code doesn't match the apparent goal
2. Security vulnerabilities that indicate misunderstood risks
3. Performance issues from unintended inefficiencies
4. Best practice violations that suggest misunderstanding

Return a JSON object with a single property "issues" containing an array of intention issues. Each issue:
- type: "logic_error" | "security" | "performance" | "best_practice"
- severity: "critical" | "warning" | "info"
- lineNumber: line where issue occurs
- title: brief title
- description: what the code does wrong
- intention: what the developer likely meant to do
- betterApproach: how to fix it
- autoFixAvailable: boolean

Find 2-6 meaningful issues. Be insightful about developer intent.`

      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const result = JSON.parse(response)
      
      setIssues(result.issues || [])
    } catch (error) {
      console.error('Sentient analysis failed:', error)
      setIssues([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400'
      case 'warning': return 'text-orange-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'logic_error': return <Warning className="h-4 w-4" weight="fill" />
      case 'security': return <ShieldCheck className="h-4 w-4" weight="fill" />
      case 'performance': return <Lightbulb className="h-4 w-4" weight="fill" />
      case 'best_practice': return <Info className="h-4 w-4" weight="fill" />
      default: return <Info className="h-4 w-4" weight="fill" />
    }
  }

  const applyFix = (issue: IntentionIssue) => {
    onSuggestFix(issue.lineNumber, issue.betterApproach)
    toast.success(`Suggested fix for line ${issue.lineNumber}`)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
            <Brain className="h-5 w-5 text-purple-400" weight="fill" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Sentient Debugger</h3>
            <p className="text-xs text-muted-foreground">Understands your intent</p>
          </div>
          {isAnalyzing && (
            <div className="animate-pulse">
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
          )}
        </div>

        {issues.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-2 text-center">
                <div className="text-xs text-red-400 mb-1">Critical</div>
                <div className="text-lg font-bold text-red-400">
                  {issues.filter(i => i.severity === 'critical').length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/20">
              <CardContent className="p-2 text-center">
                <div className="text-xs text-orange-400 mb-1">Warning</div>
                <div className="text-lg font-bold text-orange-400">
                  {issues.filter(i => i.severity === 'warning').length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-2 text-center">
                <div className="text-xs text-blue-400 mb-1">Info</div>
                <div className="text-lg font-bold text-blue-400">
                  {issues.filter(i => i.severity === 'info').length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        <AnimatePresence>
          {issues.map((issue, index) => (
            <motion.div
              key={`${issue.lineNumber}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start gap-2">
                    <div className={getSeverityColor(issue.severity)}>
                      {getTypeIcon(issue.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm font-semibold text-foreground">
                          {issue.title}
                        </CardTitle>
                        <Badge variant={getSeverityBadge(issue.severity)} className="text-xs">
                          {issue.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          L{issue.lineNumber}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-red-400 font-medium">Issue: </span>
                          <span className="text-foreground/80">{issue.description}</span>
                        </div>
                        
                        <div>
                          <span className="text-blue-400 font-medium">Your Intent: </span>
                          <span className="text-foreground/80">{issue.intention}</span>
                        </div>
                        
                        <div className="bg-background/50 rounded p-2">
                          <div className="text-green-400 font-medium mb-1">💡 Better Approach</div>
                          <p className="text-foreground/80">{issue.betterApproach}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {issue.autoFixAvailable && (
                    <Button
                      size="sm"
                      onClick={() => applyFix(issue)}
                      className="w-full text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Apply Suggested Fix
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAnalyzing && issues.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-3 text-purple-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">Analyzing your intentions...</p>
          </div>
        )}

        {!isAnalyzing && issues.length === 0 && code.length > 30 && (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p className="text-sm text-foreground font-medium">No issues detected!</p>
            <p className="text-xs text-muted-foreground mt-2">Your code matches your intent</p>
          </div>
        )}

        {code.length <= 30 && (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Write code to see intention analysis</p>
          </div>
        )}
      </div>
    </div>
  )
}
