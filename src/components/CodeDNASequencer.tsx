import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dna, Warning, CheckCircle, Info, TrendUp } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface CodeDNASequencerProps {
  code: string
  language: string
}

interface CodePattern {
  type: 'strength' | 'weakness' | 'mutation' | 'opportunity'
  pattern: string
  description: string
  lineNumbers: number[]
  severity: 'low' | 'medium' | 'high'
  suggestion?: string
}

interface DNAAnalysis {
  complexity: number
  maintainability: number
  testability: number
  patterns: CodePattern[]
  codeHealth: number
}

export function CodeDNASequencer({ code, language }: CodeDNASequencerProps) {
  const [analysis, setAnalysis] = useState<DNAAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (code && code.length > 50) {
      analyzeCodeDNA()
    }
  }, [code])

  const analyzeCodeDNA = async () => {
    setIsAnalyzing(true)
    
    try {
      const prompt = `You are a Code DNA Sequencer that analyzes code patterns like genetic sequences.

Analyze this ${language} code:
${code}

Perform a deep pattern analysis identifying:
1. Code "genes" - recurring patterns and idioms
2. Code "mutations" - antipatterns, bugs, or deviations from best practices
3. Code "strengths" - well-implemented patterns
4. Code "opportunities" - areas for improvement or optimization

Return a JSON object with these properties:
- complexity: 0-100 (cyclomatic complexity estimate)
- maintainability: 0-100 (how easy to maintain)
- testability: 0-100 (how testable the code is)
- codeHealth: 0-100 (overall health score)
- patterns: array of objects with:
  - type: "strength" | "weakness" | "mutation" | "opportunity"
  - pattern: name of the pattern
  - description: what you found
  - lineNumbers: array of line numbers where this appears
  - severity: "low" | "medium" | "high"
  - suggestion: optional improvement suggestion

Be thorough but focus on the most impactful patterns. Return 4-8 patterns.`

      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const result = JSON.parse(response)
      
      setAnalysis(result)
    } catch (error) {
      console.error('DNA analysis failed:', error)
      setAnalysis({
        complexity: 50,
        maintainability: 70,
        testability: 60,
        codeHealth: 65,
        patterns: []
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20'
    if (score >= 60) return 'bg-yellow-500/20'
    return 'bg-red-500/20'
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="h-4 w-4 text-green-400" weight="fill" />
      case 'weakness':
        return <Warning className="h-4 w-4 text-orange-400" weight="fill" />
      case 'mutation':
        return <Warning className="h-4 w-4 text-red-400" weight="fill" />
      case 'opportunity':
        return <TrendUp className="h-4 w-4 text-blue-400" weight="fill" />
      default:
        return <Info className="h-4 w-4 text-gray-400" weight="fill" />
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20">
            <Dna className="h-5 w-5 text-green-400" weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Code DNA Sequencer</h3>
            <p className="text-xs text-muted-foreground">Pattern genetics analysis</p>
          </div>
        </div>

        {analysis && (
          <div className="grid grid-cols-2 gap-2">
            <Card className={`${getHealthBg(analysis.codeHealth)} border-border/50`}>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Health</div>
                <div className={`text-2xl font-bold ${getHealthColor(analysis.codeHealth)}`}>
                  {analysis.codeHealth}%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Patterns</div>
                <div className="text-2xl font-bold text-foreground">
                  {analysis.patterns.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Complexity</div>
                <div className={`text-lg font-semibold ${getHealthColor(100 - analysis.complexity)}`}>
                  {analysis.complexity}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Testability</div>
                <div className={`text-lg font-semibold ${getHealthColor(analysis.testability)}`}>
                  {analysis.testability}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {isAnalyzing && (
          <div className="text-center py-12">
            <Dna className="h-12 w-12 mx-auto mb-3 text-green-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">Sequencing code DNA...</p>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <>
            {analysis.patterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-card/50 border-border">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start gap-2">
                      {getPatternIcon(pattern.type)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                          {pattern.pattern}
                          <Badge 
                            variant={
                              pattern.severity === 'high' ? 'destructive' :
                              pattern.severity === 'medium' ? 'default' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {pattern.severity}
                          </Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mb-2">
                          {pattern.description}
                        </p>
                        {pattern.lineNumbers.length > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Lines: {pattern.lineNumbers.join(', ')}
                            </Badge>
                          </div>
                        )}
                        {pattern.suggestion && (
                          <div className="bg-background/50 rounded p-2 mt-2">
                            <div className="text-xs font-medium text-blue-400 mb-1">
                              💡 Suggestion
                            </div>
                            <p className="text-xs text-foreground/80">
                              {pattern.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </>
        )}

        {!analysis && !isAnalyzing && code.length <= 50 && (
          <div className="text-center py-12 text-muted-foreground">
            <Dna className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Write more code to analyze DNA patterns</p>
          </div>
        )}
      </div>
    </div>
  )
}
