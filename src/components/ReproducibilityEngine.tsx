import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { FileItem } from '@/types/editor'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Package, Download, Upload, Check, Copy, X, FileArchive, Database, GitBranch, Cpu, Calendar, User } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ReproducibilityPackage {
  id: string
  name: string
  description: string
  createdAt: string
  author: string
  files: FileItem[]
  dependencies: { [key: string]: string }
  environment: {
    node?: string
    npm?: string
    browser?: string
    os?: string
  }
  randomSeeds: {
    mathSeed?: number
    dateSeed?: number
    customSeeds?: { [key: string]: number }
  }
  dataSnapshot: {
    kvStore: { [key: string]: any }
    localStorage?: { [key: string]: string }
  }
  configuration: {
    [key: string]: any
  }
  executionContext: {
    timestamp: string
    timezone: string
    locale: string
  }
  notes: string
  tags: string[]
}

interface ReproducibilityEngineProps {
  files: FileItem[]
  onRestoreEnvironment: (pkg: ReproducibilityPackage) => void
}

export function ReproducibilityEngine({ files, onRestoreEnvironment }: ReproducibilityEngineProps) {
  const [packages, setPackages] = useKV<ReproducibilityPackage[]>('repro-packages', [])
  const [isCreating, setIsCreating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [packageName, setPackageName] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [packageNotes, setPackageNotes] = useState('')
  const [packageTags, setPackageTags] = useState('')
  const [includeDependencies, setIncludeDependencies] = useState(true)
  const [includeRandomSeeds, setIncludeRandomSeeds] = useState(true)
  const [includeDataSnapshot, setIncludeDataSnapshot] = useState(true)
  const [includeEnvironment, setIncludeEnvironment] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<ReproducibilityPackage | null>(null)

  const safePackages = packages || []

  const detectDependencies = async (): Promise<{ [key: string]: string }> => {
    const deps: { [key: string]: string } = {}
    
    for (const file of files) {
      if (file.type === 'file' && file.content) {
        const importMatches = file.content.match(/import .+ from ['"]([^'"]+)['"]/g)
        if (importMatches) {
          importMatches.forEach(imp => {
            const match = imp.match(/from ['"]([^'"]+)['"]/)
            if (match && match[1] && !match[1].startsWith('.') && !match[1].startsWith('@/')) {
              const pkgName = match[1].startsWith('@') 
                ? match[1].split('/').slice(0, 2).join('/') 
                : match[1].split('/')[0]
              deps[pkgName] = 'latest'
            }
          })
        }
      }
    }

    return deps
  }

  const captureKVStore = async (): Promise<{ [key: string]: any }> => {
    try {
      const keys = await window.spark.kv.keys()
      const kvData: { [key: string]: any } = {}
      
      for (const key of keys) {
        const value = await window.spark.kv.get(key)
        kvData[key] = value
      }
      
      return kvData
    } catch (error) {
      return {}
    }
  }

  const createPackage = async () => {
    if (!packageName.trim()) {
      toast.error('Please enter a package name')
      return
    }

    setIsCreating(true)

    try {
      const user = await window.spark.user()
      const dependencies = includeDependencies ? await detectDependencies() : {}
      const kvStore = includeDataSnapshot ? await captureKVStore() : {}
      
      const newPackage: ReproducibilityPackage = {
        id: `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: packageName,
        description: packageDescription,
        createdAt: new Date().toISOString(),
        author: user?.login || 'Anonymous',
        files: files,
        dependencies,
        environment: includeEnvironment ? {
          node: 'v20.x',
          npm: '10.x',
          browser: navigator.userAgent,
          os: navigator.platform,
        } : {},
        randomSeeds: includeRandomSeeds ? {
          mathSeed: Math.floor(Math.random() * 1000000),
          dateSeed: Date.now(),
          customSeeds: {
            'Math.random': 12345,
            'crypto.random': 67890,
          }
        } : {},
        dataSnapshot: {
          kvStore,
        },
        configuration: {
          locale: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        executionContext: {
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
        },
        notes: packageNotes,
        tags: packageTags.split(',').map(t => t.trim()).filter(Boolean),
      }

      setPackages((current) => [...(current || []), newPackage])
      
      toast.success(`Created reproducibility package: ${packageName}`)
      
      setPackageName('')
      setPackageDescription('')
      setPackageNotes('')
      setPackageTags('')
      setIsCreating(false)
    } catch (error) {
      toast.error('Failed to create package')
      setIsCreating(false)
    }
  }

  const exportPackage = (pkg: ReproducibilityPackage) => {
    setIsExporting(true)
    
    const packageJson = JSON.stringify(pkg, null, 2)
    const blob = new Blob([packageJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pkg.name.replace(/\s+/g, '-').toLowerCase()}-repro-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setTimeout(() => {
      setIsExporting(false)
      toast.success('Package exported successfully')
    }, 500)
  }

  const copyPackageToClipboard = (pkg: ReproducibilityPackage) => {
    const packageJson = JSON.stringify(pkg, null, 2)
    navigator.clipboard.writeText(packageJson)
    toast.success('Package copied to clipboard')
  }

  const importPackage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const pkg = JSON.parse(event.target?.result as string) as ReproducibilityPackage
            setPackages((current) => [...(current || []), pkg])
            toast.success(`Imported package: ${pkg.name}`)
          } catch (error) {
            toast.error('Invalid package file')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const deletePackage = (pkgId: string) => {
    setPackages((current) => (current || []).filter(p => p.id !== pkgId))
    if (selectedPackage?.id === pkgId) {
      setSelectedPackage(null)
    }
    toast.success('Package deleted')
  }

  const restorePackage = (pkg: ReproducibilityPackage) => {
    onRestoreEnvironment(pkg)
    toast.success(`Restored environment: ${pkg.name}`)
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-primary" weight="duotone" />
          <h2 className="text-sm font-semibold">Reproducibility Engine</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Package complete environments for perfect reproduction
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-blue-400" />
              Create New Package
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="pkg-name" className="text-xs">Package Name</Label>
                <Input
                  id="pkg-name"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g., ML Experiment v1.0"
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="pkg-desc" className="text-xs">Description</Label>
                <Input
                  id="pkg-desc"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="Brief description of this environment"
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="pkg-notes" className="text-xs">Research Notes</Label>
                <Textarea
                  id="pkg-notes"
                  value={packageNotes}
                  onChange={(e) => setPackageNotes(e.target.value)}
                  placeholder="Experimental setup, hypotheses, observations..."
                  className="mt-1 text-xs min-h-[60px]"
                />
              </div>

              <div>
                <Label htmlFor="pkg-tags" className="text-xs">Tags (comma-separated)</Label>
                <Input
                  id="pkg-tags"
                  value={packageTags}
                  onChange={(e) => setPackageTags(e.target.value)}
                  placeholder="ml, experiment, baseline, v1"
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inc-deps" className="text-xs">Include Dependencies</Label>
                  <Switch
                    id="inc-deps"
                    checked={includeDependencies}
                    onCheckedChange={setIncludeDependencies}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="inc-seeds" className="text-xs">Include Random Seeds</Label>
                  <Switch
                    id="inc-seeds"
                    checked={includeRandomSeeds}
                    onCheckedChange={setIncludeRandomSeeds}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="inc-data" className="text-xs">Include Data Snapshot</Label>
                  <Switch
                    id="inc-data"
                    checked={includeDataSnapshot}
                    onCheckedChange={setIncludeDataSnapshot}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="inc-env" className="text-xs">Include Environment Info</Label>
                  <Switch
                    id="inc-env"
                    checked={includeEnvironment}
                    onCheckedChange={setIncludeEnvironment}
                  />
                </div>
              </div>

              <Button
                onClick={createPackage}
                disabled={isCreating || !packageName.trim()}
                className="w-full h-8 text-xs bg-gradient-to-r from-blue-500 to-cyan-500"
                size="sm"
              >
                {isCreating ? (
                  <>Creating Package...</>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Create Reproducibility Package
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Saved Packages ({safePackages.length})</h3>
            <Button
              onClick={importPackage}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Import
            </Button>
          </div>

          {safePackages.length === 0 ? (
            <Card className="p-8 text-center bg-muted/50">
              <FileArchive className="h-12 w-12 mx-auto mb-3 text-muted-foreground" weight="duotone" />
              <p className="text-sm text-muted-foreground mb-1">No packages yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first reproducibility package
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {safePackages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`p-3 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedPackage?.id === pkg.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{pkg.name}</h4>
                      {pkg.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyPackageToClipboard(pkg)
                        }}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          exportPackage(pkg)
                        }}
                        title="Export package"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePackage(pkg.id)
                        }}
                        title="Delete package"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {pkg.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{pkg.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(pkg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Database className="h-3 w-3" />
                      {pkg.files.length} files
                    </div>
                    {Object.keys(pkg.dependencies).length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GitBranch className="h-3 w-3" />
                        {Object.keys(pkg.dependencies).length} deps
                      </div>
                    )}
                    {pkg.randomSeeds.mathSeed && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Cpu className="h-3 w-3" />
                        seeded
                      </div>
                    )}
                  </div>

                  {selectedPackage?.id === pkg.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {pkg.notes && (
                        <div className="text-xs">
                          <div className="font-semibold mb-1">Research Notes:</div>
                          <div className="text-muted-foreground whitespace-pre-wrap bg-muted/50 p-2 rounded">
                            {pkg.notes}
                          </div>
                        </div>
                      )}

                      {Object.keys(pkg.dependencies).length > 0 && (
                        <div className="text-xs">
                          <div className="font-semibold mb-1">Dependencies:</div>
                          <div className="bg-muted/50 p-2 rounded space-y-0.5">
                            {Object.entries(pkg.dependencies).slice(0, 5).map(([dep, version]) => (
                              <div key={dep} className="flex justify-between text-muted-foreground">
                                <span className="font-mono">{dep}</span>
                                <span className="font-mono">{version}</span>
                              </div>
                            ))}
                            {Object.keys(pkg.dependencies).length > 5 && (
                              <div className="text-muted-foreground italic">
                                +{Object.keys(pkg.dependencies).length - 5} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {pkg.environment.browser && (
                        <div className="text-xs">
                          <div className="font-semibold mb-1">Environment:</div>
                          <div className="bg-muted/50 p-2 rounded space-y-0.5 text-muted-foreground">
                            <div>Browser: {pkg.environment.browser.split('(')[0].trim()}</div>
                            <div>OS: {pkg.environment.os}</div>
                            <div>Locale: {pkg.configuration.locale}</div>
                            <div>Timezone: {pkg.configuration.timezone}</div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => restorePackage(pkg)}
                        className="w-full h-7 text-xs bg-gradient-to-r from-green-500 to-emerald-500"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Restore This Environment
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
