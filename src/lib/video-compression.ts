export interface VideoCompressionOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  maxDuration?: number
  targetFormat?: 'mp4' | 'webm'
  maxFileSize?: number
  fps?: number
}

export interface VideoOptimizationResult {
  url: string
  duration: number
  originalSize: number
  estimatedCompressedSize: number
  savingsPercent: number
  format: string
  width: number
  height: number
}

export async function getVideoMetadata(file: File): Promise<{
  duration: number
  width: number
  height: number
  fps: number
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30
      })

      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  })
}

export async function generateVideoThumbnail(
  file: File,
  timeInSeconds: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration / 2)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create thumbnail'))
          return
        }

        resolve(URL.createObjectURL(blob))
        URL.revokeObjectURL(video.src)
      }, 'image/jpeg', 0.8)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  })
}

export function estimateVideoCompression(
  originalSize: number,
  quality: VideoCompressionOptions['quality'] = 'medium'
): number {
  const compressionRates = {
    low: 0.70,
    medium: 0.50,
    high: 0.30,
    ultra: 0.15
  }

  const savingsPercent = (1 - compressionRates[quality]) * 100
  return savingsPercent
}

export async function extractVideoFrames(
  file: File,
  frameCount: number = 10
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = async () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const frames: string[] = []
      const interval = video.duration / frameCount

      for (let i = 0; i < frameCount; i++) {
        try {
          const frameUrl = await new Promise<string>((resolveFrame, rejectFrame) => {
            video.currentTime = i * interval

            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              canvas.toBlob((blob) => {
                if (!blob) {
                  rejectFrame(new Error('Failed to create frame'))
                  return
                }

                resolveFrame(URL.createObjectURL(blob))
              }, 'image/jpeg', 0.8)
            }
          })

          frames.push(frameUrl)
        } catch (error) {
          console.error(`Failed to extract frame ${i}:`, error)
        }
      }

      resolve(frames)
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  })
}

export function calculateVideoCompressionStats(
  files: File[],
  quality: VideoCompressionOptions['quality'] = 'medium'
) {
  const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0)
  const estimatedSavings = estimateVideoCompression(totalOriginalSize, quality)
  const estimatedCompressedSize = totalOriginalSize * (1 - estimatedSavings / 100)

  return {
    totalOriginalSize,
    estimatedCompressedSize,
    estimatedSavings,
    filesCount: files.length
  }
}

export async function trimVideo(
  file: File,
  startTime: number,
  endTime: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      const duration = endTime - startTime

      if (duration <= 0 || endTime > video.duration) {
        reject(new Error('Invalid time range'))
        URL.revokeObjectURL(video.src)
        return
      }

      reject(new Error('Video trimming requires server-side processing'))
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
      URL.revokeObjectURL(video.src)
    }
  })
}

export function getRecommendedVideoSettings(fileSize: number, duration: number): VideoCompressionOptions {
  const sizeMB = fileSize / (1024 * 1024)
  const bitrate = (fileSize * 8) / duration

  if (sizeMB > 100 || bitrate > 10000000) {
    return {
      quality: 'low',
      targetFormat: 'webm',
      fps: 24
    }
  } else if (sizeMB > 50 || bitrate > 5000000) {
    return {
      quality: 'medium',
      targetFormat: 'mp4',
      fps: 30
    }
  } else {
    return {
      quality: 'high',
      targetFormat: 'mp4',
      fps: 30
    }
  }
}
