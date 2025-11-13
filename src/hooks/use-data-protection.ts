import { useKV } from '@github/spark/hooks'
import { useCallback } from 'react'

export interface DataBackup {
  timestamp: number
  version: string
  data: Record<string, any>
  checksum: string
}

export const useDataProtection = (userId: string) => {
  const [backups, setBackups] = useKV<DataBackup[]>(`data-backups-${userId}`, [])
  const [encryptionEnabled, setEncryptionEnabled] = useKV<boolean>(`encryption-enabled-${userId}`, false)

  const createChecksum = useCallback(async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }, [])

  const createBackup = useCallback(async (): Promise<void> => {
    const keys = await window.spark.kv.keys()
    const data: Record<string, any> = {}
    
    for (const key of keys) {
      if (key.startsWith(`crowe-code-`) || key.startsWith(`${userId}-`)) {
        const value = await window.spark.kv.get(key)
        if (value !== undefined) {
          data[key] = value
        }
      }
    }

    const dataString = JSON.stringify(data)
    const checksum = await createChecksum(dataString)

    const backup: DataBackup = {
      timestamp: Date.now(),
      version: '1.0.0',
      data,
      checksum,
    }

    setBackups((current) => {
      const newBackups = [...current, backup]
      return newBackups.slice(-10)
    })
  }, [userId, setBackups, createChecksum])

  const restoreBackup = useCallback(async (timestamp: number): Promise<boolean> => {
    const backup = backups.find(b => b.timestamp === timestamp)
    if (!backup) return false

    const dataString = JSON.stringify(backup.data)
    const checksum = await createChecksum(dataString)

    if (checksum !== backup.checksum) {
      console.error('Backup integrity check failed')
      return false
    }

    for (const [key, value] of Object.entries(backup.data)) {
      await window.spark.kv.set(key, value)
    }

    return true
  }, [backups, createChecksum])

  const exportData = useCallback(async (): Promise<string> => {
    const keys = await window.spark.kv.keys()
    const data: Record<string, any> = {}
    
    for (const key of keys) {
      if (key.startsWith(`crowe-code-`) || key.startsWith(`${userId}-`)) {
        const value = await window.spark.kv.get(key)
        if (value !== undefined) {
          data[key] = value
        }
      }
    }

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      userId,
      version: '1.0.0',
      data,
    }, null, 2)
  }, [userId])

  const importData = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(jsonString)
      
      if (!imported.data || typeof imported.data !== 'object') {
        return false
      }

      for (const [key, value] of Object.entries(imported.data)) {
        await window.spark.kv.set(key, value)
      }

      return true
    } catch (error) {
      console.error('Import failed:', error)
      return false
    }
  }, [])

  const validateDataIntegrity = useCallback(async (): Promise<boolean> => {
    try {
      const keys = await window.spark.kv.keys()
      
      for (const key of keys) {
        const value = await window.spark.kv.get(key)
        if (value === undefined) continue

        try {
          JSON.stringify(value)
        } catch {
          console.error(`Data integrity issue with key: ${key}`)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Integrity validation failed:', error)
      return false
    }
  }, [])

  return {
    backups,
    encryptionEnabled,
    setEncryptionEnabled,
    createBackup,
    restoreBackup,
    exportData,
    importData,
    validateDataIntegrity,
  }
}
