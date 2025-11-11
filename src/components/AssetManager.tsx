import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Asset, ASSET_CATEGORIES, formatFileSize, getAssetIcon } from '@/lib/asset-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  X,
  MagnifyingGlass,
  Upload,
  Tag,
  LockKey,
  Trash,
  Image,
  Video,
  SpeakerHigh,
  FileText,
  Cube,
  TextAa,
  DownloadSimple,
  ShieldCheck,
  FolderOpen
} from '@phosphor-icons/react'

interface AssetManagerProps {
  onClose: () => void
  userId: string
}

export function AssetManager({ onClose, userId }: AssetManagerProps) {
  const [assets, setAssets] = useKV<Asset[]>('crowe-assets', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: '',
    protected: false
  })

  const safeAssets = assets || []

  const iconMap: Record<string, any> = {
    Image,
    Video,
    SpeakerHigh,
    FileText,
    Cube,
    TextAa
  }

  const filteredAssets = safeAssets.filter(asset => {
    const matchesSearch = !searchQuery || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: safeAssets.length,
    protected: safeAssets.filter(a => a.protected).length,
    totalSize: safeAssets.reduce((sum, a) => sum + (a.size || 0), 0),
    byCategory: ASSET_CATEGORIES.map(cat => ({
      ...cat,
      count: safeAssets.filter(a => a.category === cat.id).length
    }))
  }

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setEditForm({
      name: asset.name,
      description: asset.description || '',
      tags: asset.tags.join(', '),
      protected: asset.protected
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedAsset) return

    setAssets((current) => 
      (current || []).map(a => 
        a.id === selectedAsset.id
          ? {
              ...a,
              name: editForm.name,
              description: editForm.description,
              tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
              protected: editForm.protected
            }
          : a
      )
    )

    toast.success('Asset updated successfully')
    setEditDialogOpen(false)
    setSelectedAsset(null)
  }

  const handleDeleteAsset = (asset: Asset) => {
    if (asset.protected) {
      toast.error('Cannot delete protected asset. Remove protection first.')
      return
    }

    if (window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) {
      setAssets((current) => (current || []).filter(a => a.id !== asset.id))
      toast.success('Asset deleted')
    }
  }

  const handleExportAssetList = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalAssets: safeAssets.length,
      assets: safeAssets.map(a => ({
        name: a.name,
        type: a.type,
        category: a.category,
        size: formatFileSize(a.size),
        tags: a.tags,
        protected: a.protected,
        uploadedAt: a.uploadedAt
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crowe-assets-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Asset list exported')
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" weight="duotone" />
          <h2 className="font-semibold text-foreground">Asset Manager</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Protected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                <ShieldCheck className="h-5 w-5" weight="fill" />
                {stats.protected}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{formatFileSize(stats.totalSize)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleExportAssetList} variant="outline" size="icon">
            <DownloadSimple className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            {stats.byCategory.slice(0, 3).map(cat => {
              const Icon = iconMap[cat.icon]
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="flex-1">
                  <Icon className="h-3 w-3 mr-1" />
                  {cat.count}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No assets found</p>
              <p className="text-xs mt-1">Upload assets to get started</p>
            </div>
          ) : (
            filteredAssets.map(asset => {
              const Icon = iconMap[getAssetIcon(asset.type)]
              return (
                <Card key={asset.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            {asset.protected && (
                              <LockKey className="h-3 w-3 text-green-400 flex-shrink-0" weight="fill" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</p>
                          {asset.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {asset.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEditAsset(asset)}
                        >
                          <Tag className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAsset(asset)}
                          disabled={asset.protected}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset metadata and protection settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Name</Label>
              <Input
                id="asset-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-description">Description</Label>
              <Textarea
                id="asset-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe this asset..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-tags">Tags (comma separated)</Label>
              <Input
                id="asset-tags"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="logo, branding, header"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LockKey className="h-4 w-4 text-green-400" />
                <Label htmlFor="asset-protected">Protected Asset</Label>
              </div>
              <Switch
                id="asset-protected"
                checked={editForm.protected}
                onCheckedChange={(checked) => setEditForm({ ...editForm, protected: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
