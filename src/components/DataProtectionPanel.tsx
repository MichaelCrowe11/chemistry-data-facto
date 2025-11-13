import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { dataProtection, formatBackupSize, getBackupFrequencyLabel, BackupSchedule, DataSnapshot } from '@/lib/data-protection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  X, 
  Shield, 
  Database, 
  Clock, 
  CheckCircle, 
  CloudArrowDown, 
  CloudArrowUp, 
  Trash, 
  LockKey,
  FloppyDisk,
  DownloadSimple,
  UploadSimple,
  Gear,
  Timer,
  File,
  Package
} from '@phosphor-icons/react'

interface DataProtectionPanelProps {
  userId: string
  onClose: () => void
}

export function DataProtectionPanel({ userId, onClose }: DataProtectionPanelProps) {
  const [files] = useKV<any[]>(`crowe-code-files-${userId}`, [])
  const [backups, setBackups] = useState<DataSnapshot[]>([])
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [backupDescription, setBackupDescription] = useState('')
  const [importData, setImportData] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadData()
    loadUserName()
  }, [])

  const loadUserName = async () => {
    try {
      const user = await window.spark.user()
      setUserName(user.login)
    } catch (error) {
      setUserName('User')
    }
  }

  const loadData = async () => {
    try {
      const [backupsData, scheduleData, statsData] = await Promise.all([
        dataProtection.getBackups(),
        dataProtection.getSchedule(),
        dataProtection.getBackupStats()
      ])
      setBackups(backupsData)
      setSchedule(scheduleData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load backup data:', error)
    }
  }

  const handleCreateBackup = async () => {
    if (!backupDescription.trim()) {
      toast.error('Please enter a backup description')
      return
    }

    setLoading(true)
    try {
      const snapshot = await dataProtection.createBackup(
        userId,
        userName,
        backupDescription,
        files || [],
        false
      )
      
      await loadData()
      toast.success('Backup created successfully')
      setCreateDialogOpen(false)
      setBackupDescription('')
    } catch (error) {
      toast.error('Failed to create backup')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreBackup = async (snapshot: DataSnapshot) => {
    if (!window.confirm(`Restore backup from ${new Date(snapshot.metadata.timestamp).toLocaleString()}? This will overwrite current data.`)) {
      return
    }

    setLoading(true)
    try {
      await dataProtection.restoreBackup(snapshot)
      toast.success('Backup restored successfully. Reload the page to see changes.')
    } catch (error) {
      toast.error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm('Delete this backup? This cannot be undone.')) {
      return
    }

    try {
      await dataProtection.deleteBackup(id)
      await loadData()
      toast.success('Backup deleted')
    } catch (error) {
      toast.error('Failed to delete backup')
    }
  }

  const handleExportBackup = async (snapshot: DataSnapshot) => {
    try {
      const jsonString = await dataProtection.exportBackup(snapshot)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crowe-backup-${snapshot.metadata.id}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup exported')
    } catch (error) {
      toast.error('Failed to export backup')
    }
  }

  const handleImportBackup = async () => {
    if (!importData.trim()) {
      toast.error('Please paste backup data')
      return
    }

    setLoading(true)
    try {
      await dataProtection.importBackup(importData)
      await loadData()
      toast.success('Backup imported successfully')
      setImportDialogOpen(false)
      setImportData('')
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSchedule = async (updates: Partial<BackupSchedule>) => {
    if (!schedule) return

    try {
      const updated = { ...schedule, ...updates }
      await dataProtection.updateSchedule(updated)
      setSchedule(updated)
      toast.success('Schedule updated')
    } catch (error) {
      toast.error('Failed to update schedule')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" weight="fill" />
          <h2 className="font-semibold text-foreground">Data Protection</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1">
                <CheckCircle className="h-3 w-3" weight="fill" />
                Protected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-400">{backups.length}</div>
              <p className="text-xs text-muted-foreground">Backups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1">
                <Database className="h-3 w-3" />
                Total Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-accent">
                {stats ? formatBackupSize(stats.totalSize) : '0 B'}
              </div>
              <p className="text-xs text-muted-foreground">Stored</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
          >
            <FloppyDisk className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setScheduleDialogOpen(true)}
          >
            <Gear className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setImportDialogOpen(true)}
          >
            <UploadSimple className="h-4 w-4" />
          </Button>
        </div>

        {schedule && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Auto Backup</span>
                </div>
                <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                  {schedule.enabled ? getBackupFrequencyLabel(schedule.frequency) : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
          {backups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No backups yet</p>
              <p className="text-xs mt-1">Create your first backup to protect your data</p>
            </div>
          ) : (
            backups.map((backup) => (
              <Card key={backup.metadata.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate">{backup.metadata.description}</h3>
                          {backup.metadata.autoBackup && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(backup.metadata.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleRestoreBackup(backup)}
                          title="Restore"
                        >
                          <CloudArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleExportBackup(backup)}
                          title="Export"
                        >
                          <DownloadSimple className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteBackup(backup.metadata.id)}
                          title="Delete"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <File className="h-3 w-3" />
                        {backup.metadata.fileCount} files
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {formatBackupSize(backup.metadata.dataSize)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        v{backup.metadata.version}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>Save a snapshot of your current workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backup-description">Description</Label>
              <Input
                id="backup-description"
                placeholder="e.g., Before major refactor"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
              />
            </div>
            <Card>
              <CardContent className="p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files:</span>
                  <span className="font-medium">{files?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{userName}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={loading}>
              <FloppyDisk className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Schedule</DialogTitle>
            <DialogDescription>Configure automatic backup settings</DialogDescription>
          </DialogHeader>
          {schedule && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="schedule-enabled">Enable Auto Backup</Label>
                <Switch
                  id="schedule-enabled"
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => handleUpdateSchedule({ enabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-frequency">Frequency</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(value: any) => handleUpdateSchedule({ frequency: value })}
                  disabled={!schedule.enabled}
                >
                  <SelectTrigger id="schedule-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Every Day</SelectItem>
                    <SelectItem value="weekly">Every Week</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-retention">Retention (days)</Label>
                <Input
                  id="schedule-retention"
                  type="number"
                  value={schedule.retentionDays}
                  onChange={(e) => handleUpdateSchedule({ retentionDays: parseInt(e.target.value) || 30 })}
                  disabled={!schedule.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-max">Max Backups</Label>
                <Input
                  id="schedule-max"
                  type="number"
                  value={schedule.maxBackups}
                  onChange={(e) => handleUpdateSchedule({ maxBackups: parseInt(e.target.value) || 10 })}
                  disabled={!schedule.enabled}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setScheduleDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Backup</DialogTitle>
            <DialogDescription>Paste exported backup JSON data</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Backup Data (JSON)</Label>
              <Textarea
                id="import-data"
                placeholder='{"metadata": {...}, "files": [...], ...}'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportBackup} disabled={loading}>
              <UploadSimple className="h-4 w-4 mr-2" />
              Import Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
