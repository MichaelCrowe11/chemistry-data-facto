import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { ShareNetwork, Copy, Check, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ShareWorkspaceProps {
  isOwner: boolean
  fileCount: number
}

export function ShareWorkspace({ isOwner, fileCount }: ShareWorkspaceProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  if (!isOwner) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ShareNetwork className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareNetwork className="h-5 w-5" />
            Share Workspace
          </DialogTitle>
          <DialogDescription>
            Share this coding workspace with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Workspace Stats</div>
                <div className="text-xs text-muted-foreground">
                  {fileCount} file{fileCount !== 1 ? 's' : ''} in workspace
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              Owner Access
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-url" className="text-xs">
              Share Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view and edit the workspace
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-xs font-medium mb-1">Collaboration Features</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Real-time file synchronization</li>
              <li>• User-specific workspaces</li>
              <li>• Persistent file storage</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
