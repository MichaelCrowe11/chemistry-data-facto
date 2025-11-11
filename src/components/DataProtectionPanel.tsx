import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Download, Upload, Clock, CheckCircle, XCircle, AlertTriangle } from '@phosphor-icons/react'
import { useDataProtection } from '@/hooks/use-data-protection'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DataProtectionPanelProps {
  userId: string
  onClose: () => void
}

export const DataProtectionPanel = ({ userId, onClose }: DataProtectionPanelProps) => {
  const {
    backups,
    createBackup,
    restoreBackup,
    exportData,
    importData,
    validateDataIntegrity,
  } = useDataProtection(userId)

  const [isValidating, setIsValidating] = useState(false)
  const [integrityStatus, setIntegrityStatus] = useState<'valid' | 'invalid' | null>(null)

  const handleCreateBackup = async () => {
    try {
      await createBackup()
      toast.success('Backup created successfully')
    } catch (error) {
      toast.error('Failed to create backup')
    }
  }

  const handleRestoreBackup = async (timestamp: number) => {
    try {
      const success = await restoreBackup(timestamp)
      if (success) {
        toast.success('Backup restored successfully')
        window.location.reload()
      } else {
        toast.error('Failed to restore backup - integrity check failed')
      }
    } catch (error) {
      toast.error('Failed to restore backup')
    }
  }

  const handleExportData = async () => {
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crowe-code-backup-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const success = await importData(text)
        if (success) {
          toast.success('Data imported successfully')
          window.location.reload()
        } else {
          toast.error('Failed to import data - invalid format')
        }
      } catch (error) {
        toast.error('Failed to import data')
      }
    }
    input.click()
  }

  const handleValidateIntegrity = async () => {
    setIsValidating(true)
    try {
      const isValid = await validateDataIntegrity()
      setIntegrityStatus(isValid ? 'valid' : 'invalid')
      if (isValid) {
        toast.success('Data integrity validated - all systems healthy')
      } else {
        toast.error('Data integrity issues detected')
      }
    } catch (error) {
      setIntegrityStatus('invalid')
      toast.error('Failed to validate data integrity')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" weight="duotone" />
          <h2 className="font-semibold text-sm">Data Protection</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
              <CardDescription className="text-xs">
                Protect and manage your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleCreateBackup}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Create Backup Now
              </Button>
              <Button
                onClick={handleExportData}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
              <Button
                onClick={handleImportData}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button
                onClick={handleValidateIntegrity}
                className="w-full justify-start"
                variant="outline"
                size="sm"
                disabled={isValidating}
              >
                {integrityStatus === 'valid' ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : integrityStatus === 'invalid' ? (
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {isValidating ? 'Validating...' : 'Validate Integrity'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Backup History</CardTitle>
              <CardDescription className="text-xs">
                {backups.length} backup{backups.length !== 1 ? 's' : ''} available (max 10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No backups yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {backups
                    .slice()
                    .reverse()
                    .map((backup) => (
                      <div
                        key={backup.timestamp}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            {new Date(backup.timestamp).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              v{backup.version}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Object.keys(backup.data).length} keys
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRestoreBackup(backup.timestamp)}
                          size="sm"
                          variant="ghost"
                          className="h-7"
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>Automatic checksum validation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>SHA-256 integrity verification</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>Encrypted local storage</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <span>Import/export with validation</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
