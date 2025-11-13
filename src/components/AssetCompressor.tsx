import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  compressImage, 
  optimizeImage,
  convertImageFormat,
  generateImageThumbnail,
  batchCompressImages,
  ImageCompressionOptions,
  ImageOptimizationResult
} from '@/lib/image-compression'
import { formatFileSize } from '@/lib/asset-manager'
import { toast } from 'sonner'
import {
  X,
  Image,
  Sparkle,
  DownloadSimple,
  ArrowsClockwise,
  Lightning,
  ChartLine,
  Wrench,
  Palette,
  FileImage,
  CheckCircle,
  Warning,
  Gauge
} from '@phosphor-icons/react'

interface AssetCompressorProps {
  onClose: () => void
}

interface CompressionJob {
  id: string
  fileName: string
  originalSize: number
  compressedSize: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  format: string
  quality: number
  savingsPercent: number
}

export function AssetCompressor({ onClose }: AssetCompressorProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [compressionJobs, setCompressionJobs] = useState<CompressionJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{ original: string; compressed: string; job: CompressionJob } | null>(null)

  const [settings, setSettings] = useState<ImageCompressionOptions>({
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'jpeg',
    preserveExif: false,
    progressive: true,
    stripMetadata: true
  })

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files')
      return
    }

    setSelectedFiles(prev => [...prev, ...imageFiles])
    toast.success(`Added ${imageFiles.length} images`)
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleCompress = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected')
      return
    }

    setIsProcessing(true)
    const jobs: CompressionJob[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const jobId = `job-${Date.now()}-${i}`

      const job: CompressionJob = {
        id: jobId,
        fileName: file.name,
        originalSize: file.size,
        compressedSize: 0,
        status: 'processing',
        progress: 0,
        format: settings.format || 'jpeg',
        quality: settings.quality || 0.8,
        savingsPercent: 0
      }

      jobs.push(job)
      setCompressionJobs(prev => [...prev, job])

      try {
        const result = await compressImage(file, settings)
        
        const compressedSize = result.blob.size
        const savingsPercent = ((file.size - compressedSize) / file.size) * 100

        setCompressionJobs(prev => 
          prev.map(j => 
            j.id === jobId
              ? {
                  ...j,
                  compressedSize,
                  savingsPercent,
                  status: 'completed' as const,
                  progress: 100
                }
              : j
          )
        )
      } catch (error) {
        setCompressionJobs(prev => 
          prev.map(j => 
            j.id === jobId
              ? {
                  ...j,
                  status: 'failed' as const,
                  error: error instanceof Error ? error.message : 'Compression failed'
                }
              : j
          )
        )
      }
    }

    setIsProcessing(false)
    
    const completed = jobs.filter(j => j.status === 'completed').length
    const totalSavings = jobs.reduce((sum, j) => sum + (j.originalSize - j.compressedSize), 0)
    
    toast.success(
      <div>
        <div className="font-semibold">Compression Complete!</div>
        <div className="text-xs mt-1">
          {completed} images compressed • Saved {formatFileSize(totalSavings)}
        </div>
      </div>,
      { duration: 5000 }
    )
  }, [selectedFiles, settings])

  const handleDownloadAll = useCallback(async () => {
    const completedJobs = compressionJobs.filter(j => j.status === 'completed')
    
    if (completedJobs.length === 0) {
      toast.error('No compressed files to download')
      return
    }

    toast.info('Preparing downloads...')
    
    for (const job of completedJobs) {
      const originalFile = selectedFiles.find(f => f.name === job.fileName)
      if (!originalFile) continue

      try {
        const result = await compressImage(originalFile, settings)
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `compressed-${job.fileName.replace(/\.[^.]+$/, '')}.${job.format}`
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed:', error)
      }
    }

    toast.success(`Downloaded ${completedJobs.length} compressed images`)
  }, [compressionJobs, selectedFiles, settings])

  const handleClearAll = useCallback(() => {
    setSelectedFiles([])
    setCompressionJobs([])
  }, [])

  const totalOriginalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)
  const totalCompressedSize = compressionJobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + j.compressedSize, 0)
  const totalSavings = totalOriginalSize - totalCompressedSize
  const averageSavingsPercent = compressionJobs.length > 0
    ? compressionJobs
        .filter(j => j.status === 'completed')
        .reduce((sum, j) => sum + j.savingsPercent, 0) / compressionJobs.filter(j => j.status === 'completed').length
    : 0

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Lightning className="h-5 w-5 text-primary" weight="fill" />
          <h2 className="font-semibold text-foreground">Asset Compressor</h2>
          <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
            AI-Powered
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
                <ChartLine className="h-5 w-5" weight="duotone" />
                Compression Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Original Size</p>
                  <p className="text-xl font-bold text-foreground">{formatFileSize(totalOriginalSize)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Compressed Size</p>
                  <p className="text-xl font-bold text-primary">{formatFileSize(totalCompressedSize)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Savings</span>
                  <span className="font-semibold text-green-400">
                    {formatFileSize(totalSavings)} ({averageSavingsPercent.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={averageSavingsPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="compress" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compress">
                <Lightning className="h-4 w-4 mr-2" />
                Compress
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Wrench className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Upload Images</CardTitle>
                  <CardDescription>Select images to compress and optimize</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Image className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Click to upload images</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF supported</p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Selected Files ({selectedFiles.length})
                        </Label>
                        <Button variant="ghost" size="sm" onClick={handleClearAll}>
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileImage className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="text-xs truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCompress}
                      disabled={selectedFiles.length === 0 || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lightning className="h-4 w-4 mr-2" />
                          Compress All
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownloadAll}
                      disabled={compressionJobs.filter(j => j.status === 'completed').length === 0}
                      variant="outline"
                    >
                      <DownloadSimple className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {compressionJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Compression Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {compressionJobs.map(job => (
                      <div key={job.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {job.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" weight="fill" />
                            )}
                            {job.status === 'failed' && (
                              <Warning className="h-4 w-4 text-destructive flex-shrink-0" weight="fill" />
                            )}
                            {job.status === 'processing' && (
                              <ArrowsClockwise className="h-4 w-4 text-primary flex-shrink-0 animate-spin" />
                            )}
                            <span className="text-xs font-medium truncate">{job.fileName}</span>
                          </div>
                          {job.status === 'completed' && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                              -{job.savingsPercent.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        {job.status === 'completed' && (
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Original: </span>
                              <span className="font-medium">{formatFileSize(job.originalSize)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Compressed: </span>
                              <span className="font-medium text-primary">{formatFileSize(job.compressedSize)}</span>
                            </div>
                          </div>
                        )}
                        {job.status === 'processing' && (
                          <Progress value={job.progress} className="h-1" />
                        )}
                        {job.status === 'failed' && job.error && (
                          <p className="text-xs text-destructive">{job.error}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Compression Settings</CardTitle>
                  <CardDescription>Fine-tune compression parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Quality</Label>
                      <span className="text-sm font-medium text-primary">
                        {Math.round((settings.quality || 0.8) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[settings.quality || 0.8]}
                      onValueChange={([value]) => setSettings({ ...settings, quality: value })}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower quality = smaller file size, higher quality = better image
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Output Format</Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value) => setSettings({ ...settings, format: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpeg">JPEG (Best compression)</SelectItem>
                        <SelectItem value="png">PNG (Lossless)</SelectItem>
                        <SelectItem value="webp">WebP (Modern format)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Width</Label>
                      <span className="text-sm font-medium text-primary">
                        {settings.maxWidth || 1920}px
                      </span>
                    </div>
                    <Slider
                      value={[settings.maxWidth || 1920]}
                      onValueChange={([value]) => setSettings({ ...settings, maxWidth: value })}
                      min={480}
                      max={3840}
                      step={120}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Height</Label>
                      <span className="text-sm font-medium text-primary">
                        {settings.maxHeight || 1080}px
                      </span>
                    </div>
                    <Slider
                      value={[settings.maxHeight || 1080]}
                      onValueChange={([value]) => setSettings({ ...settings, maxHeight: value })}
                      min={360}
                      max={2160}
                      step={120}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Progressive JPEG</Label>
                        <p className="text-xs text-muted-foreground">Faster web loading</p>
                      </div>
                      <Switch
                        checked={settings.progressive}
                        onCheckedChange={(checked) => setSettings({ ...settings, progressive: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Strip Metadata</Label>
                        <p className="text-xs text-muted-foreground">Remove EXIF data</p>
                      </div>
                      <Switch
                        checked={settings.stripMetadata}
                        onCheckedChange={(checked) => setSettings({ ...settings, stripMetadata: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Preserve EXIF</Label>
                        <p className="text-xs text-muted-foreground">Keep camera data</p>
                      </div>
                      <Switch
                        checked={settings.preserveExif}
                        onCheckedChange={(checked) => setSettings({ ...settings, preserveExif: checked })}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSettings({
                        quality: 0.8,
                        maxWidth: 1920,
                        maxHeight: 1080,
                        format: 'jpeg',
                        preserveExif: false,
                        progressive: true,
                        stripMetadata: true
                      })}
                    >
                      <ArrowsClockwise className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sparkle className="h-4 w-4 text-blue-400" weight="fill" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">For web use: 80% quality, WebP format</p>
                      <p className="text-muted-foreground">Best balance of quality and file size</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">For thumbnails: 60% quality, 480x360px</p>
                      <p className="text-muted-foreground">Maximum compression for previews</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">For print: 95% quality, PNG format</p>
                      <p className="text-muted-foreground">Preserve maximum quality</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
