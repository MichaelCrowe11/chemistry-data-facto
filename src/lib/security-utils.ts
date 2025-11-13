export const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

export const sanitizeCode = (code: string): string => {
  return code.replace(/<script[^>]*>.*?<\/script>/gi, '')
}

export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export const validateFileSize = (content: string, maxSizeMB: number = 5): boolean => {
  const sizeInBytes = new Blob([content]).size
  const sizeInMB = sizeInBytes / (1024 * 1024)
  return sizeInMB <= maxSizeMB
}

export const validateFileExtension = (fileName: string, allowedExtensions: string[]): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? allowedExtensions.includes(extension) : false
}

export const secureStorageKey = (userId: string, key: string): string => {
  return `crowe-code-${userId}-${key}`
}

export const encodeDataUrl = (data: any): string => {
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

export const decodeDataUrl = (encoded: string): any => {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch {
    return null
  }
}

export const rateLimit = (fn: Function, delayMs: number = 1000) => {
  let lastCall = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delayMs) {
      lastCall = now
      return fn(...args)
    }
  }
}

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}
