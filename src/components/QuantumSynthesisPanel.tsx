import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Atom, Sparkle, ArrowRight, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface QuantumSynthesisPanelProps {
  onCodeGenerated: (code: string) => void
}

interface ArchitectureNode {
  id: string
  type: 'component' | 'function' | 'class' | 'module'
  name: string
  description: string
  code: string
  confidence: number
}

export function QuantumSynthesisPanel({ onCodeGenerated }: QuantumSynthesisPanelProps) {
  const [intent, setIntent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [architecture, setArchitecture] = useState<ArchitectureNode[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const synthesizeArchitecture = async () => {
    if (!intent.trim()) {
      toast.error('Please describe what you want to build')
      return
    }

    setIsProcessing(true)
    
    try {
      const prompt = `You are a quantum code synthesis engine. Given a high-level intent, generate a complete software architecture.

Intent: ${intent}

Analyze this intent and generate a complete, production-ready architecture. Break it down into logical components with full implementations.

Return a JSON object with a single property "nodes" containing an array of architecture nodes. Each node should have:
- id: unique identifier
- type: one of "component", "function", "class", "module"
- name: descriptive name
- description: what this does
- code: complete, production-ready implementation
- confidence: 0-100 representing AI confidence in this implementation

Generate 3-6 nodes that together form a complete solution. Make the code sophisticated, well-structured, and use modern best practices.`

      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const result = JSON.parse(response)
      
      setArchitecture(result.nodes || [])
      toast.success(`Synthesized ${result.nodes?.length || 0} architecture components`)
    } catch (error) {
      toast.error('Synthesis failed - try rephrasing your intent')
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyCode = (node: ArchitectureNode) => {
    navigator.clipboard.writeText(node.code)
    setCopied(node.id)
    setTimeout(() => setCopied(null), 2000)
    toast.success(`Copied ${node.name}`)
  }

  const applyAll = () => {
    const fullCode = architecture
      .map(node => `// ${node.name}\n// ${node.description}\n\n${node.code}`)
      .join('\n\n')
    
    onCodeGenerated(fullCode)
    toast.success('Applied entire architecture to editor')
  }

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-bg)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Atom className="h-5 w-5 text-purple-400" weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quantum Synthesis</h3>
            <p className="text-xs text-muted-foreground">Architecture from intent</p>
          </div>
        </div>
        
        <Textarea
          placeholder="Describe what you want to build... e.g., 'a todo app with local storage and filtering'"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          className="mb-3 min-h-[100px] text-sm"
        />
        
        <Button
          onClick={synthesizeArchitecture}
          disabled={isProcessing || !intent.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Sparkle className="h-4 w-4 mr-2 animate-spin" />
              Synthesizing Architecture...
            </>
          ) : (
            <>
              <Atom className="h-4 w-4 mr-2" />
              Synthesize Code Architecture
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        <AnimatePresence>
          {architecture.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              <Button onClick={applyAll} variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Apply All to Editor
              </Button>
            </motion.div>
          )}

          {architecture.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 border-border">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        {node.name}
                        <Badge variant="outline" className="text-xs">
                          {node.type}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{node.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge 
                        variant={node.confidence > 80 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {node.confidence}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="bg-background/50 rounded-md p-3 mb-2 max-h-[200px] overflow-auto">
                    <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
                      {node.code}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(node)}
                      className="flex-1 text-xs"
                    >
                      {copied === node.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onCodeGenerated(node.code)}
                      className="flex-1 text-xs"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {architecture.length === 0 && !isProcessing && (
          <div className="text-center py-12 text-muted-foreground">
            <Atom className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Describe your intent above to synthesize code architecture</p>
          </div>
        )}
      </div>
    </div>
  )
}
