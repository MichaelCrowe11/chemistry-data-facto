import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Cloud, 
  CloudArrowUp, 
  Lightning, 
  ChartBar, 
  ArrowsClockwise, 
  Check, 
  Warning,
  X,
  Copy,
  Trash,
  UploadSimple
} from '@phosphor-icons/react'

interface CDNProvider {
  id: string
  name: string
  type: 'cloudflare' | 'cloudfront' | 'fastly' | 'bunny' | 'custom'
  endpoint: string
  apiKey: string
  zone?: string
  enabled: boolean
}

interface CDNAsset {
  id: string
  fileName: string
  originalPath: string
  cdnUrl: string
  provider: string
  size: number
  uploadedAt: number
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'UNKNOWN'
  optimized: boolean
  compressionSavings?: number
}

interface CDNMetrics {
  totalAssets: number
  totalBandwidth: number
  cacheHitRate: number
  avgLoadTime: number
  costSavings: number
  requestsByRegion: { region: string; count: number }[]
}

interface CDNIntegrationPanelProps {
  onClose: () => void
}

export function CDNIntegrationPanel({ onClose }: CDNIntegrationPanelProps) {
  const [providers, setProviders] = useKV<CDNProvider[]>('cdn-providers', [])
  const [assets, setAssets] = useKV<CDNAsset[]>('cdn-assets', [])
  const [metrics, setMetrics] = useState<CDNMetrics>({
    totalAssets: 0,
    totalBandwidth: 0,
    cacheHitRate: 0,
    avgLoadTime: 0,
    costSavings: 0,
    requestsByRegion: []
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [newProvider, setNewProvider] = useState<Partial<CDNProvider>>({
    name: '',
    type: 'cloudflare',
    endpoint: '',
    apiKey: '',
    zone: '',
    enabled: true
  })

  useEffect(() => {
    calculateMetrics()
  }, [assets])

  const calculateMetrics = () => {
    const totalAssets = assets.length
    const totalBandwidth = assets.reduce((sum, asset) => sum + asset.size, 0)
    const cacheHits = assets.filter(a => a.cacheStatus === 'HIT').length
    const cacheHitRate = totalAssets > 0 ? (cacheHits / totalAssets) * 100 : 0
    const avgLoadTime = 45 + Math.random() * 30
    const costSavings = totalBandwidth * 0.00008 * (cacheHitRate / 100)

    const regions = [
      { region: 'North America', count: Math.floor(totalAssets * 0.4) },
      { region: 'Europe', count: Math.floor(totalAssets * 0.3) },
      { region: 'Asia Pacific', count: Math.floor(totalAssets * 0.2) },
      { region: 'South America', count: Math.floor(totalAssets * 0.1) }
    ]

    setMetrics({
      totalAssets,
      totalBandwidth,
      cacheHitRate,
      avgLoadTime,
      costSavings,
      requestsByRegion: regions
    })
  }

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.endpoint || !newProvider.apiKey) {
      toast.error('Please fill in all required fields')
      return
    }

    const provider: CDNProvider = {
      id: `cdn-${Date.now()}`,
      name: newProvider.name!,
      type: newProvider.type as CDNProvider['type'],
      endpoint: newProvider.endpoint!,
      apiKey: newProvider.apiKey!,
      zone: newProvider.zone,
      enabled: true
    }

    setProviders((current) => [...current, provider])
    setConfigDialogOpen(false)
    setNewProvider({
      name: '',
      type: 'cloudflare',
      endpoint: '',
      apiKey: '',
      zone: '',
      enabled: true
    })
    toast.success(`Added CDN provider: ${provider.name}`)
  }

  const handleRemoveProvider = (id: string) => {
    setProviders((current) => current.filter(p => p.id !== id))
    toast.success('CDN provider removed')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    if (!selectedProvider) {
      toast.error('Please select a CDN provider first')
      return
    }

    const provider = providers.find(p => p.id === selectedProvider)
    if (!provider) return

    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      setUploadProgress(((i + 1) / files.length) * 100)

      const simulatedCdnUrl = `https://${provider.endpoint}/assets/${Date.now()}-${file.name}`
      const asset: CDNAsset = {
        id: `asset-${Date.now()}-${i}`,
        fileName: file.name,
        originalPath: `/assets/${file.name}`,
        cdnUrl: simulatedCdnUrl,
        provider: provider.name,
        size: file.size,
        uploadedAt: Date.now(),
        cacheStatus: 'MISS',
        optimized: false,
        compressionSavings: 0
      }

      setAssets((current) => [...current, asset])
    }

    setUploading(false)
    setUploadProgress(0)
    toast.success(`Uploaded ${files.length} asset(s) to ${provider.name}`)
  }

  const handlePurgeCache = async (assetId: string) => {
    toast.info('Purging cache...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setAssets((current) =>
      current.map(a =>
        a.id === assetId ? { ...a, cacheStatus: 'MISS' as const } : a
      )
    )
    toast.success('Cache purged successfully')
  }

  const handleOptimizeAsset = async (assetId: string) => {
    toast.info('Optimizing asset...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const savings = 25 + Math.random() * 40
    setAssets((current) =>
      current.map(a =>
        a.id === assetId
          ? { ...a, optimized: true, compressionSavings: savings }
          : a
      )
    )
    toast.success(`Optimized! Saved ${savings.toFixed(1)}% bandwidth`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('CDN URL copied to clipboard')
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const activeProvider = providers.find(p => p.id === selectedProvider)

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Cloud className="h-6 w-6 text-cyan-400" weight="duotone" />
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CDN Integration</h2>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 text-white/70 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 bg-white/5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/60">Total Assets</CardDescription>
                <CardTitle className="text-3xl font-bold text-cyan-400">{metrics.totalAssets}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/60">Cache Hit Rate</CardDescription>
                <CardTitle className="text-3xl font-bold text-green-400">{metrics.cacheHitRate.toFixed(1)}%</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/60">Total Bandwidth</CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-400">{formatBytes(metrics.totalBandwidth)}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader className="pb-3">
                <CardDescription className="text-white/60">Avg Load Time</CardDescription>
                <CardTitle className="text-3xl font-bold text-purple-400">{metrics.avgLoadTime.toFixed(0)}ms</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="h-5 w-5 text-cyan-400" weight="duotone" />
                Requests by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.requestsByRegion.map((region) => (
                  <div key={region.region}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">{region.region}</span>
                      <span className="text-cyan-400">{region.count} requests</span>
                    </div>
                    <Progress 
                      value={(region.count / metrics.totalAssets) * 100} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning className="h-5 w-5 text-yellow-400" weight="fill" />
                Cost Savings
              </CardTitle>
              <CardDescription className="text-white/70">
                Estimated monthly savings from CDN caching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-cyan-400">
                ${metrics.costSavings.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select CDN provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={!selectedProvider || uploading}
                className="bg-white/10 border-white/20 text-white file:text-white"
                id="cdn-file-upload"
              />
            </div>

            <Button
              disabled={!selectedProvider || uploading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <UploadSimple className="h-4 w-4 mr-2" weight="bold" />
              Upload
            </Button>
          </div>

          {uploading && (
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading to {activeProvider?.name}...</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 bg-white/10" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {assets.map((asset) => (
              <Card key={asset.id} className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{asset.fileName}</h3>
                        <Badge 
                          variant={asset.cacheStatus === 'HIT' ? 'default' : 'secondary'}
                          className={
                            asset.cacheStatus === 'HIT' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }
                        >
                          {asset.cacheStatus}
                        </Badge>
                        {asset.optimized && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            <Lightning className="h-3 w-3 mr-1" weight="fill" />
                            Optimized
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-white/60 space-y-1">
                        <div className="flex items-center gap-2">
                          <span>Provider: {asset.provider}</span>
                          <span>•</span>
                          <span>Size: {formatBytes(asset.size)}</span>
                          {asset.compressionSavings && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">Saved {asset.compressionSavings.toFixed(1)}%</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="truncate max-w-xs">{asset.cdnUrl}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(asset.cdnUrl)}
                            className="h-6 w-6 text-cyan-400 hover:text-cyan-300"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!asset.optimized && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOptimizeAsset(asset.id)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Lightning className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePurgeCache(asset.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ArrowsClockwise className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAssets((current) => current.filter(a => a.id !== asset.id))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {assets.length === 0 && (
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 mx-auto mb-4 text-white/30" weight="duotone" />
                <h3 className="text-lg font-semibold mb-2">No assets uploaded yet</h3>
                <p className="text-white/60 text-sm">Select a CDN provider and upload your first asset to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="providers" className="flex-1 overflow-auto p-4 space-y-4">
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                <Cloud className="h-4 w-4 mr-2" weight="duotone" />
                Add CDN Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Configure CDN Provider</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new CDN provider to distribute your assets globally
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    placeholder="My CDN Provider"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <Select
                    value={newProvider.type}
                    onValueChange={(value) => setNewProvider({ ...newProvider, type: value as CDNProvider['type'] })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloudflare">Cloudflare</SelectItem>
                      <SelectItem value="cloudfront">AWS CloudFront</SelectItem>
                      <SelectItem value="fastly">Fastly</SelectItem>
                      <SelectItem value="bunny">BunnyCDN</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="provider-endpoint">Endpoint/Domain</Label>
                  <Input
                    id="provider-endpoint"
                    value={newProvider.endpoint}
                    onChange={(e) => setNewProvider({ ...newProvider, endpoint: e.target.value })}
                    placeholder="cdn.example.com"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="provider-api-key">API Key</Label>
                  <Input
                    id="provider-api-key"
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="provider-zone">Zone ID (Optional)</Label>
                  <Input
                    id="provider-zone"
                    value={newProvider.zone}
                    onChange={(e) => setNewProvider({ ...newProvider, zone: e.target.value })}
                    placeholder="Zone or bucket ID"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <Button onClick={handleAddProvider} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Check className="h-4 w-4 mr-2" weight="bold" />
                  Add Provider
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {providers.map((provider) => (
              <Card key={provider.id} className="bg-white/5 border-white/10 text-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{provider.name}</h3>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {provider.type}
                        </Badge>
                        {provider.enabled && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Check className="h-3 w-3 mr-1" weight="bold" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-white/60 space-y-1">
                        <div>Endpoint: {provider.endpoint}</div>
                        {provider.zone && <div>Zone: {provider.zone}</div>}
                        <div className="text-xs text-white/40">API Key: {provider.apiKey.slice(0, 8)}...</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveProvider(provider.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {providers.length === 0 && (
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 mx-auto mb-4 text-white/30" weight="duotone" />
                <h3 className="text-lg font-semibold mb-2">No CDN providers configured</h3>
                <p className="text-white/60 text-sm mb-4">Add your first CDN provider to start distributing assets globally</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
