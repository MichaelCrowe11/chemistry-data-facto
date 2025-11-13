export interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document' | 'model' | 'font'
  path: string
  size?: number
  uploadedAt: Date
  tags: string[]
  metadata?: Record<string, any>
  category?: string
  description?: string
  protected: boolean
  userId?: string
}

export interface AssetCategory {
  id: string
  name: string
  icon: string
  description: string
  count: number
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: 'images',
    name: 'Images',
    icon: 'Image',
    description: 'PNG, JPG, SVG, WebP graphics and icons',
    count: 0
  },
  {
    id: 'videos',
    name: 'Videos',
    icon: 'Video',
    description: 'MP4, WebM video tutorials and demos',
    count: 0
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: 'SpeakerHigh',
    description: 'MP3, WAV, OGG sound effects and music',
    count: 0
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: 'FileText',
    description: 'PDF, MD, TXT research papers and docs',
    count: 0
  },
  {
    id: 'models',
    name: '3D Models',
    icon: 'Cube',
    description: 'GLB, GLTF, OBJ 3D assets for visualization',
    count: 0
  },
  {
    id: 'fonts',
    name: 'Fonts',
    icon: 'TextAa',
    description: 'TTF, WOFF, WOFF2 custom typefaces',
    count: 0
  }
]

export class AssetManager {
  private assets: Map<string, Asset> = new Map()
  
  constructor() {
    this.loadAssets()
  }

  private async loadAssets() {
    const assets = await window.spark.kv.get<Asset[]>('crowe-assets')
    if (assets) {
      assets.forEach(asset => this.assets.set(asset.id, asset))
    }
  }

  async saveAssets() {
    const assetArray = Array.from(this.assets.values())
    await window.spark.kv.set('crowe-assets', assetArray)
  }

  addAsset(asset: Asset) {
    this.assets.set(asset.id, asset)
    this.saveAssets()
    return asset
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id)
  }

  getAssetsByType(type: Asset['type']): Asset[] {
    return Array.from(this.assets.values()).filter(a => a.type === type)
  }

  getAssetsByCategory(category: string): Asset[] {
    return Array.from(this.assets.values()).filter(a => a.category === category)
  }

  getProtectedAssets(): Asset[] {
    return Array.from(this.assets.values()).filter(a => a.protected)
  }

  searchAssets(query: string): Asset[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.assets.values()).filter(asset =>
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      asset.description?.toLowerCase().includes(lowerQuery)
    )
  }

  updateAsset(id: string, updates: Partial<Asset>) {
    const asset = this.assets.get(id)
    if (asset) {
      const updated = { ...asset, ...updates }
      this.assets.set(id, updated)
      this.saveAssets()
      return updated
    }
    return null
  }

  deleteAsset(id: string) {
    const deleted = this.assets.delete(id)
    if (deleted) {
      this.saveAssets()
    }
    return deleted
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values())
  }

  getAssetStats() {
    const stats = {
      total: this.assets.size,
      byType: {} as Record<string, number>,
      protected: 0,
      totalSize: 0
    }

    this.assets.forEach(asset => {
      stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1
      if (asset.protected) stats.protected++
      if (asset.size) stats.totalSize += asset.size
    })

    return stats
  }
}

export const assetManager = new AssetManager()

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function getAssetIcon(type: Asset['type']): string {
  const icons = {
    image: 'Image',
    video: 'Video',
    audio: 'SpeakerHigh',
    document: 'FileText',
    model: 'Cube',
    font: 'TextAa'
  }
  return icons[type]
}
