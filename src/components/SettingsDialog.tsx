import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Gear, Palette, Code } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface UserSettings {
  fontSize: number
  tabSize: number
  lineNumbers: boolean
  minimap: boolean
  wordWrap: boolean
  autoSave: boolean
  theme: 'dark' | 'light'
}

const defaultSettings: UserSettings = {
  fontSize: 14,
  tabSize: 2,
  lineNumbers: true,
  minimap: false,
  wordWrap: false,
  autoSave: true,
  theme: 'dark',
}

interface SettingsDialogProps {
  userId: string
}

export function SettingsDialog({ userId }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useKV<UserSettings>(
    `crowe-code-settings-${userId}`,
    defaultSettings
  )

  const safeSettings = settings || defaultSettings

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((current) => ({
      ...(current || defaultSettings),
      [key]: value,
    }))
    toast.success('Settings updated')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Gear className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" />
            Editor Settings
          </DialogTitle>
          <DialogDescription>
            Customize your coding experience in Crowe Code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Code className="h-4 w-4" />
              Editor
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontSize" className="text-xs">
                    Font Size (px)
                  </Label>
                  <Input
                    id="fontSize"
                    type="number"
                    min="10"
                    max="24"
                    value={safeSettings.fontSize}
                    onChange={(e) =>
                      updateSetting('fontSize', Number(e.target.value))
                    }
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tabSize" className="text-xs">
                    Tab Size
                  </Label>
                  <Input
                    id="tabSize"
                    type="number"
                    min="2"
                    max="8"
                    value={safeSettings.tabSize}
                    onChange={(e) =>
                      updateSetting('tabSize', Number(e.target.value))
                    }
                    className="h-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lineNumbers" className="text-xs">
                    Line Numbers
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show line numbers in the editor
                  </p>
                </div>
                <Switch
                  id="lineNumbers"
                  checked={safeSettings.lineNumbers}
                  onCheckedChange={(checked) =>
                    updateSetting('lineNumbers', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="wordWrap" className="text-xs">
                    Word Wrap
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Wrap long lines automatically
                  </p>
                </div>
                <Switch
                  id="wordWrap"
                  checked={safeSettings.wordWrap}
                  onCheckedChange={(checked) =>
                    updateSetting('wordWrap', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="minimap" className="text-xs">
                    Minimap
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show code overview on the right
                  </p>
                </div>
                <Switch
                  id="minimap"
                  checked={safeSettings.minimap}
                  onCheckedChange={(checked) =>
                    updateSetting('minimap', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave" className="text-xs">
                    Auto Save
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save changes
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={safeSettings.autoSave}
                  onCheckedChange={(checked) =>
                    updateSetting('autoSave', checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Palette className="h-4 w-4" />
              Appearance
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme" className="text-xs">
                  Color Theme
                </Label>
                <p className="text-xs text-muted-foreground">
                  Currently using dark theme
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
