import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/StatCard'
import { CompoundCard } from '@/components/CompoundCard'
import { ReactionCard } from '@/components/ReactionCard'
import { LiteratureCard } from '@/components/LiteratureCard'
import { chemistryApi } from '@/lib/api'
import { Compound, Reaction, Literature, Stats } from '@/types/chemistry'
import { 
  Flame, 
  Zap, 
  BookOpen, 
  BarChart3,
  Search,
  AlertCircle,
  Beaker,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [literature, setLiterature] = useState<Literature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [compoundQuery, setCompoundQuery] = useState('')
  const [reactionMinYield, setReactionMinYield] = useState('')
  const [literatureQuery, setLiteratureQuery] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await chemistryApi.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError('Unable to connect to Chemistry Data Factory API. Ensure the backend is running at http://localhost:8000')
    }
  }

  const searchCompounds = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await chemistryApi.searchCompounds({ 
        query: compoundQuery,
        limit: 50 
      })
      setCompounds(results)
      toast.success(`Found ${results.length} compounds`)
    } catch (err) {
      setError('Failed to search compounds')
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const searchReactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await chemistryApi.searchReactions({
        min_yield: reactionMinYield ? Number(reactionMinYield) : undefined,
        limit: 50
      })
      setReactions(results)
      toast.success(`Found ${results.length} reactions`)
    } catch (err) {
      setError('Failed to search reactions')
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const searchLiterature = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await chemistryApi.searchLiterature({
        query: literatureQuery,
        limit: 50
      })
      setLiterature(results)
      toast.success(`Found ${results.length} papers`)
    } catch (err) {
      setError('Failed to search literature')
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Beaker className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Chemistry Data Factory</h1>
              <p className="text-sm text-muted-foreground">
                Comprehensive chemistry knowledge discovery platform
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="compounds" className="gap-2">
              <Flame className="h-4 w-4" />
              Compounds
            </TabsTrigger>
            <TabsTrigger value="reactions" className="gap-2">
              <Zap className="h-4 w-4" />
              Reactions
            </TabsTrigger>
            <TabsTrigger value="literature" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Literature
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Database Statistics</h2>
              <p className="text-muted-foreground mb-6">
                Overview of chemistry knowledge stored in the data factory
              </p>
            </div>

            {stats ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Compounds"
                  value={stats.compounds}
                  icon={Flame}
                  description="Chemical structures with properties"
                />
                <StatCard
                  title="Reactions"
                  value={stats.reactions}
                  icon={Zap}
                  description="Chemical reactions with conditions"
                />
                <StatCard
                  title="Literature"
                  value={stats.literature}
                  icon={BookOpen}
                  description="Scientific papers and patents"
                />
                <StatCard
                  title="Techniques"
                  value={stats.techniques}
                  icon={Beaker}
                  description="Laboratory techniques and methods"
                />
                <StatCard
                  title="Equipment"
                  value={stats.equipment}
                  icon={Beaker}
                  description="Laboratory equipment catalog"
                />
                <StatCard
                  title="SOPs"
                  value={stats.sops}
                  icon={FileText}
                  description="Standard operating procedures"
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            )}

            {!stats && !error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Connecting to Chemistry Data Factory API...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure the backend is running at http://localhost:8000
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compounds" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Compound Search</h2>
              <p className="text-muted-foreground mb-6">
                Search for compounds by name, formula, or SMILES
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Search compounds (e.g., aspirin, C6H6, benzene)..."
                value={compoundQuery}
                onChange={(e) => setCompoundQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCompounds()}
                className="flex-1"
              />
              <Button onClick={searchCompounds} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {loading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            )}

            {!loading && compounds.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {compounds.map((compound) => (
                  <CompoundCard
                    key={compound.compound_id}
                    compound={compound}
                    onClick={() => toast.info(`Viewing ${compound.common_name || 'compound'}`)}
                  />
                ))}
              </div>
            )}

            {!loading && compounds.length === 0 && compoundQuery && (
              <div className="text-center py-12 text-muted-foreground">
                No compounds found. Try a different search query.
              </div>
            )}
          </TabsContent>

          <TabsContent value="reactions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Reaction Browser</h2>
              <p className="text-muted-foreground mb-6">
                Explore chemical reactions and their conditions
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Minimum yield %"
                value={reactionMinYield}
                onChange={(e) => setReactionMinYield(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchReactions()}
                className="max-w-xs"
              />
              <Button onClick={searchReactions} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {loading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            )}

            {!loading && reactions.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reactions.map((reaction) => (
                  <ReactionCard
                    key={reaction.reaction_id}
                    reaction={reaction}
                    onClick={() => toast.info(`Viewing reaction details`)}
                  />
                ))}
              </div>
            )}

            {!loading && reactions.length === 0 && reactionMinYield && (
              <div className="text-center py-12 text-muted-foreground">
                No reactions found. Try adjusting your filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="literature" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Literature Discovery</h2>
              <p className="text-muted-foreground mb-6">
                Search scientific papers and patents
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Search literature (e.g., organic synthesis, catalysis)..."
                value={literatureQuery}
                onChange={(e) => setLiteratureQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchLiterature()}
                className="flex-1"
              />
              <Button onClick={searchLiterature} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {loading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            )}

            {!loading && literature.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {literature.map((lit) => (
                  <LiteratureCard
                    key={lit.reference_id}
                    literature={lit}
                    onClick={() => toast.info(`Viewing ${lit.title}`)}
                  />
                ))}
              </div>
            )}

            {!loading && literature.length === 0 && literatureQuery && (
              <div className="text-center py-12 text-muted-foreground">
                No literature found. Try a different search query.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Chemistry Data Factory • Comprehensive chemistry knowledge platform
        </div>
      </footer>
    </div>
  )
}

export default App