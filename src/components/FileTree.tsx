import { FileItem } from '@/types/editor'
import { File, Folder, FolderOpen, Plus, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FileTreeProps {
  files: FileItem[]
  selectedFileId: string | null
  onFileSelect: (fileId: string) => void
  onFileCreate: (name: string, parentId?: string) => void
  onFileDelete: (fileId: string) => void
  onFolderToggle: (folderId: string) => void
}

export function FileTree({ 
  files, 
  selectedFileId, 
  onFileSelect, 
  onFileCreate,
  onFileDelete,
  onFolderToggle 
}: FileTreeProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const handleCreate = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim())
      setNewFileName('')
      setIsCreating(false)
    }
  }

  const renderFileItem = (file: FileItem, depth = 0) => {
    const isSelected = file.id === selectedFileId
    const Icon = file.type === 'folder' 
      ? (file.isOpen ? FolderOpen : Folder)
      : File

    return (
      <div key={file.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 cursor-pointer group",
            "hover:bg-muted transition-colors",
            isSelected && "bg-secondary"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              onFolderToggle(file.id)
            } else {
              onFileSelect(file.id)
            }
          }}
        >
          {isSelected && (
            <div className="absolute left-0 w-0.5 h-5 bg-accent" />
          )}
          
          <Icon 
            className={cn(
              "w-4 h-4 shrink-0",
              file.type === 'folder' ? 'text-accent' : 'text-muted-foreground'
            )} 
          />
          <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFileDelete(file.id)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background rounded p-0.5"
          >
            <Trash className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
        
        {file.type === 'folder' && file.isOpen && file.children && (
          <div>
            {file.children.map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className="h-full flex flex-col bg-[var(--sidebar-bg)] border-r border-border"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      <div className="h-9 px-3 flex items-center justify-between border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Explorer
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="px-3 py-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewFileName('')
                }
              }}
              onBlur={handleCreate}
              placeholder="filename.txt"
              className="h-7 text-sm"
              autoFocus
            />
          </div>
        )}
        
        {files.length === 0 && !isCreating ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No files yet
          </div>
        ) : (
          <div className="py-1">
            {files.map(file => renderFileItem(file))}
          </div>
        )}
      </div>
    </div>
  )
}
