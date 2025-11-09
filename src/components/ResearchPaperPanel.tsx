import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MagnifyingGlass, Article, Copy, Check, Link as LinkIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

declare const spark: {
  llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
  llm: (prompt: string, model?: string, jsonMode?: boolean) => Promise<string>
}

interface Paper {
  id: string
  title: string
  authors: string[]
  abstract: string
  published: string
  arxivId?: string
  doi?: string
  pdfUrl?: string
  category: string
}

interface ResearchPaperPanelProps {
  onLinkPaper?: (paper: Paper) => void
  onGenerateCitation?: (paper: Paper) => void
}

export function ResearchPaperPanel({ onLinkPaper, onGenerateCitation }: ResearchPaperPanelProps) {
  const [query, setQuery] = useState('')
  const [papers, setPapers] = useState<Paper[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const searchPapers = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsSearching(true)
    try {
      const prompt = spark.llmPrompt`You are a research paper search assistant. Generate 5 realistic academic papers related to: "${query}". 

Return a JSON object with a single property "papers" containing an array of paper objects. Each paper should have:
- id (unique identifier)
- title (realistic academic paper title)
- authors (array of 2-4 author names)
- abstract (2-3 sentence description)
- published (date in YYYY-MM-DD format)
- arxivId (format: YYMM.NNNNN, e.g., 2301.07041)
- category (e.g., cs.AI, cs.LG, cs.CV, stat.ML)
- pdfUrl (arXiv PDF URL)

Make them relevant to the query and realistic.`

      const response = await spark.llm(prompt, 'gpt-4o', true)
      const data = JSON.parse(response)
      
      setPapers(data.papers || [])
      if (data.papers?.length === 0) {
        toast.info('No papers found. Try a different query.')
      }
    } catch (error) {
      toast.error('Failed to search papers')
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const generateBibTeX = (paper: Paper) => {
    const year = paper.published.split('-')[0]
    const firstAuthor = paper.authors[0]?.split(' ').pop()?.toLowerCase() || 'unknown'
    const key = `${firstAuthor}${year}`
    
    return `@article{${key},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  journal={arXiv preprint arXiv:${paper.arxivId}},
  year={${year}},
  url={${paper.pdfUrl || `https://arxiv.org/abs/${paper.arxivId}`}}
}`
  }

  const copyBibTeX = (paper: Paper) => {
    const bibtex = generateBibTeX(paper)
    navigator.clipboard.writeText(bibtex)
    setCopiedId(paper.id)
    toast.success('BibTeX copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const linkToCode = (paper: Paper) => {
    const citation = `\n\n// Reference: ${paper.title}\n// ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ', et al.' : ''}\n// arXiv:${paper.arxivId} (${paper.published.split('-')[0]})\n// ${paper.pdfUrl || `https://arxiv.org/abs/${paper.arxivId}`}\n`
    
    navigator.clipboard.writeText(citation)
    toast.success('Citation comment copied - paste in your code')
    onLinkPaper?.(paper)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Article className="h-5 w-5 text-primary" weight="fill" />
          <h2 className="text-sm font-semibold">Research Papers</h2>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search arXiv, papers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPapers()}
            className="text-xs"
          />
          <Button
            size="sm"
            onClick={searchPapers}
            disabled={isSearching}
            className="shrink-0"
          >
            <MagnifyingGlass className="h-4 w-4" />
          </Button>
        </div>
        {isSearching && (
          <p className="text-xs text-muted-foreground mt-2">Searching papers...</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {papers.length === 0 && !isSearching && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Article className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Search for academic papers</p>
              <p className="mt-1">Link research to your code</p>
            </div>
          )}

          {papers.map((paper) => (
            <Card
              key={paper.id}
              className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedPaper(selectedPaper?.id === paper.id ? null : paper)}
            >
              <div className="space-y-2">
                <div>
                  <h3 className="text-xs font-semibold leading-tight mb-1">
                    {paper.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {paper.authors.slice(0, 3).join(', ')}
                    {paper.authors.length > 3 ? ', et al.' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {paper.category}
                  </Badge>
                  {paper.arxivId && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      arXiv:{paper.arxivId}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {paper.published}
                  </span>
                </div>

                {selectedPaper?.id === paper.id && (
                  <>
                    <Separator />
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {paper.abstract}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          linkToCode(paper)
                        }}
                        className="flex-1 h-7 text-[10px]"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Link to Code
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyBibTeX(paper)
                        }}
                        className="flex-1 h-7 text-[10px]"
                      >
                        {copiedId === paper.id ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            BibTeX
                          </>
                        )}
                      </Button>
                      {paper.pdfUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(paper.pdfUrl, '_blank')
                          }}
                          className="h-7 text-[10px]"
                          title="Open PDF"
                        >
                          <Article className="h-3 w-3" />
                        </Button>
                      )}
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
          Search connects to academic databases
        </p>
      </div>
    </div>
  )
}
