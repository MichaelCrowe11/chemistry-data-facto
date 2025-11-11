export interface BackupMetadata {
  id: string
  timestamp: Date
  userId: string
  userName: string
  description: string
  fileCount: number
  dataSize: number
  assetCount: number
  version: string
  autoBackup: boolean
  tags: string[]
}

export interface DataSnapshot {
  metadata: BackupMetadata
  files: any[]
  kvStore: Record<string, any>
  assets: any[]
  settings: any
  experiments: any[]
  checksum: string
}

export interface BackupSchedule {
  enabled: boolean
  frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  retentionDays: number
  maxBackups: number
  lastBackup?: Date
  nextBackup?: Date
}

export class DataProtectionService {
  private static readonly BACKUP_KEY = 'crowe-backups'
  private static readonly SCHEDULE_KEY = 'crowe-backup-schedule'
  private static readonly VERSION = '1.0.0'

  async createBackup(userId: string, userName: string, description: string, files: any[], autoBackup = false): Promise<DataSnapshot> {
    const kvKeys = await window.spark.kv.keys()
    const kvStore: Record<string, any> = {}
    
    for (const key of kvKeys) {
      if (!key.startsWith('crowe-backups')) {
        const value = await window.spark.kv.get(key)
        kvStore[key] = value
      }
    }

    const assets = await window.spark.kv.get('crowe-assets') || []
    const settings = await window.spark.kv.get(`crowe-settings-${userId}`) || {}
    const experiments = await window.spark.kv.get(`crowe-experiments-${userId}`) || []

    const metadata: BackupMetadata = {
      id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      userName,
      description,
      fileCount: files.length,
      dataSize: this.calculateDataSize({ files, kvStore, assets, settings, experiments }),
      assetCount: Array.isArray(assets) ? assets.length : 0,
      version: DataProtectionService.VERSION,
      autoBackup,
      tags: autoBackup ? ['auto'] : ['manual']
    }

    const snapshot: DataSnapshot = {
      metadata,
      files,
      kvStore,
      assets,
      settings,
      experiments,
      checksum: this.generateChecksum({ files, kvStore, assets, settings, experiments })
    }

    await this.saveBackup(snapshot)
    return snapshot
  }

  async saveBackup(snapshot: DataSnapshot) {
    const backups = await this.getBackups()
    backups.push(snapshot)
    
    const schedule = await this.getSchedule()
    if (schedule.maxBackups && backups.length > schedule.maxBackups) {
      backups.sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime())
      backups.splice(schedule.maxBackups)
    }

    await window.spark.kv.set(DataProtectionService.BACKUP_KEY, backups)
  }

  async getBackups(): Promise<DataSnapshot[]> {
    const backups = await window.spark.kv.get<DataSnapshot[]>(DataProtectionService.BACKUP_KEY)
    return backups || []
  }

  async getBackup(id: string): Promise<DataSnapshot | null> {
    const backups = await this.getBackups()
    return backups.find(b => b.metadata.id === id) || null
  }

  async deleteBackup(id: string): Promise<boolean> {
    const backups = await this.getBackups()
    const filtered = backups.filter(b => b.metadata.id !== id)
    
    if (filtered.length !== backups.length) {
      await window.spark.kv.set(DataProtectionService.BACKUP_KEY, filtered)
      return true
    }
    return false
  }

  async restoreBackup(snapshot: DataSnapshot): Promise<void> {
    if (!this.verifyChecksum(snapshot)) {
      throw new Error('Backup verification failed - checksum mismatch')
    }

    for (const [key, value] of Object.entries(snapshot.kvStore)) {
      await window.spark.kv.set(key, value)
    }

    if (snapshot.assets) {
      await window.spark.kv.set('crowe-assets', snapshot.assets)
    }
  }

  async getSchedule(): Promise<BackupSchedule> {
    const schedule = await window.spark.kv.get<BackupSchedule>(DataProtectionService.SCHEDULE_KEY)
    return schedule || {
      enabled: false,
      frequency: 'daily',
      retentionDays: 30,
      maxBackups: 10
    }
  }

  async updateSchedule(schedule: BackupSchedule): Promise<void> {
    await window.spark.kv.set(DataProtectionService.SCHEDULE_KEY, schedule)
  }

  async exportBackup(snapshot: DataSnapshot): Promise<string> {
    return JSON.stringify(snapshot, null, 2)
  }

  async importBackup(jsonString: string): Promise<DataSnapshot> {
    try {
      const snapshot = JSON.parse(jsonString) as DataSnapshot
      
      if (!snapshot.metadata || !snapshot.checksum) {
        throw new Error('Invalid backup format')
      }

      if (!this.verifyChecksum(snapshot)) {
        throw new Error('Backup verification failed')
      }

      await this.saveBackup(snapshot)
      return snapshot
    } catch (error) {
      throw new Error(`Failed to import backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cleanOldBackups(retentionDays: number): Promise<number> {
    const backups = await this.getBackups()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const kept = backups.filter(b => new Date(b.metadata.timestamp) > cutoffDate)
    const removed = backups.length - kept.length

    if (removed > 0) {
      await window.spark.kv.set(DataProtectionService.BACKUP_KEY, kept)
    }

    return removed
  }

  async getBackupStats() {
    const backups = await this.getBackups()
    const schedule = await this.getSchedule()

    const totalSize = backups.reduce((sum, b) => sum + b.metadata.dataSize, 0)
    const autoBackups = backups.filter(b => b.metadata.autoBackup).length
    const manualBackups = backups.length - autoBackups

    return {
      total: backups.length,
      autoBackups,
      manualBackups,
      totalSize,
      schedule,
      oldest: backups.length > 0 ? backups.reduce((oldest, b) => 
        new Date(b.metadata.timestamp) < new Date(oldest.metadata.timestamp) ? b : oldest
      ).metadata.timestamp : null,
      newest: backups.length > 0 ? backups.reduce((newest, b) => 
        new Date(b.metadata.timestamp) > new Date(newest.metadata.timestamp) ? b : newest
      ).metadata.timestamp : null
    }
  }

  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size
  }

  private generateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  private verifyChecksum(snapshot: DataSnapshot): boolean {
    const { checksum, ...data } = snapshot
    const calculatedChecksum = this.generateChecksum({
      files: data.files,
      kvStore: data.kvStore,
      assets: data.assets,
      settings: data.settings,
      experiments: data.experiments
    })
    return checksum === calculatedChecksum
  }
}

export const dataProtection = new DataProtectionService()

export function formatBackupSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

export function getBackupFrequencyLabel(frequency: BackupSchedule['frequency']): string {
  const labels = {
    hourly: 'Every Hour',
    daily: 'Every Day',
    weekly: 'Every Week',
    manual: 'Manual Only'
  }
  return labels[frequency]
}
