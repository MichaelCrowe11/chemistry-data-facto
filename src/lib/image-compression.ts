export interface ImageCompressionOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
  preserveExif?: boolean
  progressive?: boolean
  stripMetadata?: boolean
}

export interface ImageOptimizationResult {
  blob: Blob
  url: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
  savingsPercent: number
  format: string
}

export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<ImageOptimizationResult> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg',
    stripMetadata = true
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          let { width, height } = img
          const aspectRatio = width / height

          if (width > maxWidth) {
            width = maxWidth
            height = width / aspectRatio
          }

          if (height > maxHeight) {
            height = maxHeight
            width = height * aspectRatio
          }

          canvas.width = Math.round(width)
          canvas.height = Math.round(height)

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          const mimeType = format === 'png' 
            ? 'image/png' 
            : format === 'webp' 
            ? 'image/webp' 
            : 'image/jpeg'

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }

              const compressedSize = blob.size
              const originalSize = file.size
              const savingsPercent = ((originalSize - compressedSize) / originalSize) * 100

              resolve({
                blob,
                url: URL.createObjectURL(blob),
                width: canvas.width,
                height: canvas.height,
                originalSize,
                compressedSize,
                savingsPercent,
                format
              })
            },
            mimeType,
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

export async function optimizeImage(
  file: File,
  preset: 'web' | 'thumbnail' | 'print' = 'web'
): Promise<ImageOptimizationResult> {
  const presets: Record<string, ImageCompressionOptions> = {
    web: {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'webp',
      stripMetadata: true,
      progressive: true
    },
    thumbnail: {
      quality: 0.6,
      maxWidth: 480,
      maxHeight: 360,
      format: 'jpeg',
      stripMetadata: true,
      progressive: false
    },
    print: {
      quality: 0.95,
      maxWidth: 3840,
      maxHeight: 2160,
      format: 'png',
      stripMetadata: false,
      progressive: false
    }
  }

  return compressImage(file, presets[preset])
}

export async function convertImageFormat(
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp'
): Promise<ImageOptimizationResult> {
  return compressImage(file, {
    format: targetFormat,
    quality: targetFormat === 'png' ? 1.0 : 0.9,
    stripMetadata: false
  })
}

export async function generateImageThumbnail(
  file: File,
  size: number = 200
): Promise<ImageOptimizationResult> {
  return compressImage(file, {
    quality: 0.7,
    maxWidth: size,
    maxHeight: size,
    format: 'jpeg',
    stripMetadata: true
  })
}

export async function batchCompressImages(
  files: File[],
  options: ImageCompressionOptions = {},
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<ImageOptimizationResult[]> {
  const results: ImageOptimizationResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    if (onProgress) {
      onProgress(i + 1, files.length, file.name)
    }

    try {
      const result = await compressImage(file, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error)
    }
  }

  return results
}

export function calculateCompressionStats(results: ImageOptimizationResult[]) {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0)
  const totalSavings = totalOriginalSize - totalCompressedSize
  const averageSavingsPercent = results.length > 0
    ? results.reduce((sum, r) => sum + r.savingsPercent, 0) / results.length
    : 0

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    averageSavingsPercent,
    filesProcessed: results.length
  }
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  maintainAspectRatio: boolean = true
): Promise<ImageOptimizationResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          let targetWidth = width
          let targetHeight = height

          if (maintainAspectRatio) {
            const aspectRatio = img.width / img.height
            if (width / height > aspectRatio) {
              targetWidth = height * aspectRatio
            } else {
              targetHeight = width / aspectRatio
            }
          }

          canvas.width = Math.round(targetWidth)
          canvas.height = Math.round(targetHeight)

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }

              const compressedSize = blob.size
              const originalSize = file.size
              const savingsPercent = ((originalSize - compressedSize) / originalSize) * 100

              resolve({
                blob,
                url: URL.createObjectURL(blob),
                width: canvas.width,
                height: canvas.height,
                originalSize,
                compressedSize,
                savingsPercent,
                format: 'jpeg'
              })
            },
            'image/jpeg',
            0.9
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string

      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

export function estimateCompressionSavings(
  fileSize: number,
  quality: number,
  formatChange: boolean = false
): number {
  let estimatedSavings = 1 - quality

  if (formatChange) {
    estimatedSavings += 0.2
  }

  return Math.min(estimatedSavings, 0.85) * 100
}
