import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { FileItem, EditorTab } from '@/types/editor'
import { FileTree } from '@/components/FileTree'
import { TabBar } from '@/components/TabBar'
import { CodeEditor } from '@/components/CodeEditor'
import { StatusBar } from '@/components/StatusBar'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { UserProfile } from '@/components/UserProfile'
import { SettingsDialog } from '@/components/SettingsDialog'
import { ShareWorkspace } from '@/components/ShareWorkspace'
import { detectLanguage, generateId } from '@/lib/editor-utils'
import { Sidebar, List } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function App() {
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [isOwner, setIsOwner] = useState(false)
  const [files, setFiles] = useKV<FileItem[]>(`crowe-code-files-${userId}`, [])
  const [openTabs, setOpenTabs] = useKV<EditorTab[]>(`crowe-code-tabs-${userId}`, [])
  const [activeTabId, setActiveTabId] = useKV<string | null>(`crowe-code-active-tab-${userId}`, null)
  const [sidebarVisible, setSidebarVisible] = useState(true)

  const safeFiles = files || []
  const safeOpenTabs = openTabs || []
  const safeActiveTabId = activeTabId || null

  const activeTab = safeOpenTabs.find(tab => tab.id === safeActiveTabId) || null

  const handleFileCreate = useCallback((name: string, parentId?: string) => {
    const newFile: FileItem = {
      id: generateId(),
      name,
      type: 'file',
      content: '',
      parent: parentId,
    }

    setFiles((currentFiles) => [...(currentFiles || []), newFile])
    handleFileSelect(newFile.id)
    toast.success(`Created ${name}`)
  }, [setFiles])

  const handleFileDelete = useCallback((fileId: string) => {
    setFiles((currentFiles) => (currentFiles || []).filter(f => f.id !== fileId))
    setOpenTabs((currentTabs) => {
      const updatedTabs = (currentTabs || []).filter(tab => tab.fileId !== fileId)
      if (updatedTabs.length === 0) {
        setActiveTabId(null)
      } else if (safeActiveTabId && !updatedTabs.find(t => t.id === safeActiveTabId)) {
        setActiveTabId(updatedTabs[0].id)
      }
      return updatedTabs
    })
    toast.success('File deleted')
  }, [setFiles, setOpenTabs, setActiveTabId, safeActiveTabId])

  const handleFileSelect = useCallback((fileId: string) => {
    const file = safeFiles.find(f => f.id === fileId)
    if (!file || file.type !== 'file') return

    const existingTab = safeOpenTabs.find(tab => tab.fileId === fileId)
    
    if (existingTab) {
      setActiveTabId(existingTab.id)
    } else {
      const newTab: EditorTab = {
        id: generateId(),
        fileId: file.id,
        fileName: file.name,
        content: file.content || '',
        isDirty: false,
        language: detectLanguage(file.name),
        cursorPosition: { line: 1, column: 1 },
      }
      
      setOpenTabs((currentTabs) => [...(currentTabs || []), newTab])
      setActiveTabId(newTab.id)
    }
  }, [safeFiles, safeOpenTabs, setOpenTabs, setActiveTabId])

  const handleFolderToggle = useCallback((folderId: string) => {
    setFiles((currentFiles) => 
      (currentFiles || []).map(f => 
        f.id === folderId ? { ...f, isOpen: !f.isOpen } : f
      )
    )
  }, [setFiles])

  const handleTabClose = useCallback((tabId: string) => {
    setOpenTabs((currentTabs) => {
      const tabIndex = (currentTabs || []).findIndex(t => t.id === tabId)
      const updatedTabs = (currentTabs || []).filter(t => t.id !== tabId)
      
      if (safeActiveTabId === tabId && updatedTabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, updatedTabs.length - 1)
        setActiveTabId(updatedTabs[newActiveIndex].id)
      } else if (updatedTabs.length === 0) {
        setActiveTabId(null)
      }
      
      return updatedTabs
    })
  }, [setOpenTabs, safeActiveTabId, setActiveTabId])

  const handleContentChange = useCallback((content: string) => {
    if (!safeActiveTabId) return

    setOpenTabs((currentTabs) => 
      (currentTabs || []).map(tab => 
        tab.id === safeActiveTabId 
          ? { ...tab, content, isDirty: true }
          : tab
      )
    )
  }, [safeActiveTabId, setOpenTabs])

  const handleCursorChange = useCallback((line: number, column: number) => {
    if (!safeActiveTabId) return

    setOpenTabs((currentTabs) => 
      (currentTabs || []).map(tab => 
        tab.id === safeActiveTabId 
          ? { ...tab, cursorPosition: { line, column } }
          : tab
      )
    )
  }, [safeActiveTabId, setOpenTabs])

  const saveCurrentFile = useCallback(() => {
    if (!activeTab) return

    setFiles((currentFiles) => 
      (currentFiles || []).map(f => 
        f.id === activeTab.fileId 
          ? { ...f, content: activeTab.content }
          : f
      )
    )

    setOpenTabs((currentTabs) => 
      (currentTabs || []).map(tab => 
        tab.id === activeTab.id 
          ? { ...tab, isDirty: false }
          : tab
      )
    )

    toast.success(`Saved ${activeTab.fileName}`)
  }, [activeTab, setFiles, setOpenTabs])

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCurrentFile()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        const fileName = prompt('Enter file name:')
        if (fileName) handleFileCreate(fileName)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        if (safeActiveTabId) handleTabClose(safeActiveTabId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [saveCurrentFile, handleFileCreate, handleTabClose, safeActiveTabId])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="h-12 flex items-center justify-between px-4 bg-[var(--sidebar-bg)] border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="h-8 w-8"
          >
            {sidebarVisible ? <Sidebar className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
          <h1 className="text-sm font-semibold">Crowe Code</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            v2.0.36
          </div>
          {userId && (
            <>
              <ShareWorkspace isOwner={isOwner} fileCount={safeFiles.length} />
              <SettingsDialog userId={userId} />
            </>
          )}
          <UserProfile
            onUserLoaded={(user) => {
              setUserId(user.id)
              setUserName(user.login)
              setIsOwner(user.isOwner)
            }}
          />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {sidebarVisible && (
          <div className="w-64 shrink-0">
            <FileTree
              files={safeFiles}
              selectedFileId={activeTab?.fileId || null}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              onFolderToggle={handleFolderToggle}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar
            tabs={safeOpenTabs}
            activeTabId={safeActiveTabId}
            onTabSelect={setActiveTabId}
            onTabClose={handleTabClose}
          />

          <div className="flex-1 overflow-hidden bg-slate-50 text-slate-950 border-slate-950 font-thin text-base">
            {activeTab ? (
              <CodeEditor
                content={activeTab.content}
                onChange={handleContentChange}
                onCursorChange={handleCursorChange}
                language={activeTab.language}
              />
            ) : (
              <WelcomeScreen 
                onCreateFile={() => {
                  const fileName = prompt('Enter file name:')
                  if (fileName) handleFileCreate(fileName)
                }}
                userName={userName}
              />
            )}
          </div>
        </div>
      </div>
      <StatusBar activeTab={activeTab} />
    </div>
  );
}

export default App
