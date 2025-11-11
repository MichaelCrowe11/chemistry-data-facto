export const assetPaths = {
  images: {
    logo: () => import('@/assets/images/crowelogo.png'),
  },
  video: {},
  audio: {},
  documents: {},
  models: {},
  fonts: {},
} as const

export type AssetCategory = keyof typeof assetPaths

export const getAssetUrl = async (category: AssetCategory, name: string): Promise<string> => {
  const assets = assetPaths[category]
  if (name in assets) {
    const module = await (assets as any)[name]()
    return module.default
  }
  throw new Error(`Asset not found: ${category}/${name}`)
}

export const preloadAsset = async (category: AssetCategory, name: string): Promise<void> => {
  await getAssetUrl(category, name)
}

export const preloadAssets = async (assets: Array<{ category: AssetCategory; name: string }>): Promise<void> => {
  await Promise.all(assets.map(({ category, name }) => preloadAsset(category, name)))
}
