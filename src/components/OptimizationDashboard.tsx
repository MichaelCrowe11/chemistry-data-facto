import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Asset, formatFileSize } from '@/lib/asset-manager'
import { estimateCompressionSavings } from '@/lib/image-compression'
import { estimateVideoCompression } from '@/lib/video-compression'
import { toast } from 'sonner'
import {
  X,
  ChartBar,
  TrendUp,
  Sparkle,
  Lightning,
  CheckCircle,
  Warning,
  Info,
  Fire,
  CloudArrowDown,
  Gauge
} from '@phosphor-icons/react'

interface OptimizationDashboardProps {
  onClose: () => void
}

interface OptimizationRecommendation {
  id: string
  assetId: string
  assetName: string
  assetType: string
  currentSize: number
  potentialSize: number
  savingsPercent: number
  priority: 'high' | 'medium' | 'low'
  recommendation: string
  action: string
}

export function OptimizationDashboard({ onClose }: OptimizationDashboardProps) {
  const [assets] = useKV<Asset[]>('crowe-assets', [])
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const safeAssets = assets || []

  useEffect(() => {
    analyzeAssets()
  }, [safeAssets])

  const analyzeAssets = () => {
    setIsAnalyzing(true)

    const recs: OptimizationRecommendation[] = []

    safeAssets.forEach(asset => {
      if (!asset.size) return

      const sizeMB = asset.size / (1024 * 1024)
      let potentialSavings = 0
      let recommendation = ''
      let action = ''
      let priority: 'high' | 'medium' | 'low' = 'low'

      if (asset.type === 'image') {
        if (sizeMB > 2) {
          potentialSavings = estimateCompressionSavings(asset.size, 0.8, true)
          recommendation = 'Large image detected. Compress to WebP format for better web performance.'
          action = 'Compress to WebP (80% quality)'
          priority = 'high'
        } else if (sizeMB > 1) {
          potentialSavings = estimateCompressionSavings(asset.size, 0.85, false)
          recommendation = 'Medium-sized image. Slight compression recommended.'
          action = 'Optimize quality (85%)'
          priority = 'medium'
        } else if (sizeMB > 0.5) {
          potentialSavings = estimateCompressionSavings(asset.size, 0.9, false)
          recommendation = 'Image is reasonably sized but can be optimized further.'
          action = 'Minor optimization (90%)'
          priority = 'low'
        }
      } else if (asset.type === 'video') {
        if (sizeMB > 50) {
          potentialSavings = estimateVideoCompression(asset.size, 'low')
          recommendation = 'Very large video file. Aggressive compression recommended.'
          action = 'Compress to low quality'
          priority = 'high'
        } else if (sizeMB > 25) {
          potentialSavings = estimateVideoCompression(asset.size, 'medium')
          recommendation = 'Large video file. Standard compression recommended.'
          action = 'Compress to medium quality'
          priority = 'medium'
        } else if (sizeMB > 10) {
          potentialSavings = estimateVideoCompression(asset.size, 'high')
          recommendation = 'Video can benefit from optimization.'
          action = 'Compress to high quality'
          priority = 'low'
        }
      } else if (asset.type === 'audio') {
        if (sizeMB > 10) {
          potentialSavings = 40
          recommendation = 'Large audio file. Consider converting to more efficient format.'
          action = 'Convert to AAC/Opus'
          priority = 'medium'
        } else if (sizeMB > 5) {
          potentialSavings = 25
          recommendation = 'Audio file can be optimized with better codec.'
          action = 'Optimize bitrate'
          priority = 'low'
        }
      }

      if (potentialSavings > 0) {
        const potentialSize = asset.size * (1 - potentialSavings / 100)
        recs.push({
          id: `rec-${asset.id}`,
          assetId: asset.id,
          assetName: asset.name,
          assetType: asset.type,
          currentSize: asset.size,
          potentialSize,
          savingsPercent: potentialSavings,
          priority,
          recommendation,
          action
        })
      }
    })

    recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.savingsPercent - a.savingsPercent
    })

    setRecommendations(recs)
    setIsAnalyzing(false)
  }

  const totalPotentialSavings = recommendations.reduce(
    (sum, rec) => sum + (rec.currentSize - rec.potentialSize),
    0
  )

  const averageSavingsPercent = recommendations.length > 0
    ? recommendations.reduce((sum, rec) => sum + rec.savingsPercent, 0) / recommendations.length
    : 0

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length
  const mediumPriorityCount = recommendations.filter(r => r.priority === 'medium').length
  const lowPriorityCount = recommendations.filter(r => r.priority === 'low').length

  const totalCurrentSize = safeAssets.reduce((sum, a) => sum + (a.size || 0), 0)
  const optimizationScore = Math.max(0, 100 - (totalPotentialSavings / totalCurrentSize) * 100)

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Fire className="h-4 w-4 text-red-400" weight="fill" />
      case 'medium':
        return <Warning className="h-4 w-4 text-yellow-400" weight="fill" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-400" weight="fill" />
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ChartBar className="h-5 w-5 text-primary" weight="duotone" />
          <h2 className="font-semibold text-foreground">Optimization Dashboard</h2>
          <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500">
            AI Analysis
          </Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-5 w-5" weight="duotone" />
                Optimization Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-primary">
                  {optimizationScore.toFixed(0)}
                </span>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Out of 100</p>
                  {optimizationScore >= 90 && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 mt-1">
                      Excellent
                    </Badge>
                  )}
                  {optimizationScore >= 70 && optimizationScore < 90 && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 mt-1">
                      Good
                    </Badge>
                  )}
                  {optimizationScore >= 50 && optimizationScore < 70 && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 mt-1">
                      Fair
                    </Badge>
                  )}
                  {optimizationScore < 50 && (
                    <Badge variant="secondary" className="bg-red-500/20 text-red-400 mt-1">
                      Needs Work
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={optimizationScore} className="h-2" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{safeAssets.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(totalCurrentSize)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Potential Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {formatFileSize(totalPotentialSavings)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {averageSavingsPercent.toFixed(1)}% average
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommendations by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                  <div className="flex items-center gap-2">
                    <Fire className="h-4 w-4 text-red-400" weight="fill" />
                    <span className="text-sm font-medium">High Priority</span>
                  </div>
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                    {highPriorityCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
                  <div className="flex items-center gap-2">
                    <Warning className="h-4 w-4 text-yellow-400" weight="fill" />
                    <span className="text-sm font-medium">Medium Priority</span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    {mediumPriorityCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-400" weight="fill" />
                    <span className="text-sm font-medium">Low Priority</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {lowPriorityCount}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">High</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="low">Low</TabsTrigger>
            </TabsList>

            {['all', 'high', 'medium', 'low'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-2">
                {recommendations
                  .filter(rec => tab === 'all' || rec.priority === tab)
                  .map(rec => (
                    <Card key={rec.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {getPriorityIcon(rec.priority)}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{rec.assetName}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {rec.recommendation}
                              </p>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Current Size</p>
                            <p className="font-medium">{formatFileSize(rec.currentSize)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Optimized Size</p>
                            <p className="font-medium text-primary">
                              {formatFileSize(rec.potentialSize)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Potential Savings</span>
                            <span className="font-semibold text-green-400">
                              {formatFileSize(rec.currentSize - rec.potentialSize)} (
                              {rec.savingsPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={rec.savingsPercent} className="h-1" />
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          <Lightning className="h-3 w-3 mr-2" />
                          {rec.action}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                {recommendations.filter(rec => tab === 'all' || rec.priority === tab).length ===
                  0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" weight="fill" />
                    <p className="text-sm">No {tab === 'all' ? '' : tab + ' priority'} recommendations</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendUp className="h-4 w-4 text-green-400" weight="duotone" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Sparkle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" weight="fill" />
                <p>
                  Optimizing {recommendations.length} assets could save{' '}
                  <span className="font-semibold text-green-400">
                    {formatFileSize(totalPotentialSavings)}
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" weight="fill" />
                <p>
                  Focus on {highPriorityCount} high-priority items for maximum impact
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" weight="fill" />
                <p>
                  Use WebP format for images to reduce size by up to 30%
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={analyzeAssets}
            disabled={isAnalyzing}
            variant="outline"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <CloudArrowDown className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <CloudArrowDown className="h-4 w-4 mr-2" />
                Re-analyze Assets
              </>
            )}
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
