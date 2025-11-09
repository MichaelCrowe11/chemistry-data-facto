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
import { AIChatPanel } from '@/components/AIChatPanel'
import { AICodeActions } from '@/components/AICodeActions'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { LiveExecutionPanel } from '@/components/LiveExecutionPanel'
import { VisualDebugPanel } from '@/components/VisualDebugPanel'
import { AIPredictionPanel } from '@/components/AIPredictionPanel'
import { CodeComplexityVisualizer } from '@/components/CodeComplexityVisualizer'
import { CollaborativeAIPairProgrammer } from '@/components/CollaborativeAIPairProgrammer'
import { PerformanceProfiler } from '@/components/PerformanceProfiler'
import { QuantumSynthesisPanel } from '@/components/QuantumSynthesisPanel'
import { CodeDNASequencer } from '@/components/CodeDNASequencer'
import { HolographicCodeViz } from '@/components/HolographicCodeViz'
import { SentientDebugger } from '@/components/SentientDebugger'
import { detectLanguage, generateId } from '@/lib/editor-utils'
import { Sidebar, List, Sparkle, Selection, Play, Bug, Brain, ChartBar, Robot, Speedometer, Atom, Dna, Cube } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function App() {
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [isOwner, setIsOwner] = useState(false)
  const [files, setFiles] = useKV<FileItem[]>(`crowe-code-files-${userId}`, [])
  const [openTabs, setOpenTabs] = useKV<EditorTab[]>(`crowe-code-tabs-${userId}`, [])
  const [activeTabId, setActiveTabId] = useKV<string | null>(`crowe-code-active-tab-${userId}`, null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [aiChatVisible, setAiChatVisible] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [rightPanel, setRightPanel] = useState<'execution' | 'debug' | 'predictions' | 'complexity' | 'pair' | 'performance' | 'quantum' | 'dna' | 'holographic' | 'sentient' | null>('execution')

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

  const handleSelectionChange = useCallback((selection: string) => {
    setSelectedCode(selection)
  }, [])

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setAiChatVisible(prev => !prev)
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
          <h1 className="text-sm font-semibold text-slate-50 border-cyan-300">Crowe Code</h1>
          <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 border-0">Quantum AI</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            v5.0.0 Quantum Evolution
          </div>
          {userId && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'execution' ? null : 'execution')}
                className="h-8 w-8"
                title="Live Execution"
              >
                <Play className="h-5 w-5" weight={rightPanel === 'execution' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'debug' ? null : 'debug')}
                className="h-8 w-8"
                title="Visual Debugger"
              >
                <Bug className="h-5 w-5" weight={rightPanel === 'debug' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'predictions' ? null : 'predictions')}
                className="h-8 w-8"
                title="AI Predictions"
              >
                <Brain className="h-5 w-5" weight={rightPanel === 'predictions' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'complexity' ? null : 'complexity')}
                className="h-8 w-8"
                title="Complexity Analysis"
              >
                <ChartBar className="h-5 w-5" weight={rightPanel === 'complexity' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'pair' ? null : 'pair')}
                className="h-8 w-8"
                title="AI Pair Programmer"
              >
                <Robot className="h-5 w-5" weight={rightPanel === 'pair' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'performance' ? null : 'performance')}
                className="h-8 w-8"
                title="Performance Profiler"
              >
                <Speedometer className="h-5 w-5" weight={rightPanel === 'performance' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'quantum' ? null : 'quantum')}
                className="h-8 w-8"
                title="Quantum Synthesis"
              >
                <Atom className="h-5 w-5" weight={rightPanel === 'quantum' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'dna' ? null : 'dna')}
                className="h-8 w-8"
                title="Code DNA Sequencer"
              >
                <Dna className="h-5 w-5" weight={rightPanel === 'dna' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'holographic' ? null : 'holographic')}
                className="h-8 w-8"
                title="Holographic Code 3D"
              >
                <Cube className="h-5 w-5" weight={rightPanel === 'holographic' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRightPanel(rightPanel === 'sentient' ? null : 'sentient')}
                className="h-8 w-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                title="Sentient Debugger (Revolutionary)"
              >
                <Brain className="h-5 w-5 text-purple-400" weight={rightPanel === 'sentient' ? 'fill' : 'regular'} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setAiChatVisible(!aiChatVisible)}
                className="h-8 w-8"
                title="AI Chat (Cmd/Ctrl+K)"
              >
                <Sparkle className="h-5 w-5" weight={aiChatVisible ? 'fill' : 'regular'} />
              </Button>
              <KeyboardShortcuts />
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

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden bg-slate-50 text-slate-950 border-slate-950 font-thin text-xs relative">
              {activeTab ? (
                <>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    {selectedCode && (
                      <AICodeActions
                        selectedCode={selectedCode}
                        language={activeTab.language}
                        onApplyCode={(code) => {
                          handleContentChange(code)
                        }}
                      />
                    )}
                  </div>
                  <CodeEditor
                    content={activeTab.content}
                    onChange={handleContentChange}
                    onCursorChange={handleCursorChange}
                    onSelectionChange={handleSelectionChange}
                    language={activeTab.language}
                  />
                </>
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

            {rightPanel === 'execution' && activeTab && (
              <div className="w-96 shrink-0">
                <LiveExecutionPanel
                  code={activeTab.content}
                  language={activeTab.language}
                />
              </div>
            )}

            {rightPanel === 'debug' && activeTab && (
              <div className="w-96 shrink-0">
                <VisualDebugPanel
                  code={activeTab.content}
                  currentLine={activeTab.cursorPosition.line}
                />
              </div>
            )}

            {rightPanel === 'predictions' && activeTab && (
              <div className="w-96 shrink-0">
                <AIPredictionPanel
                  code={activeTab.content}
                  language={activeTab.language}
                  cursorLine={activeTab.cursorPosition.line}
                  onApplyPrediction={(code) => {
                    const lines = activeTab.content.split('\n')
                    lines.splice(activeTab.cursorPosition.line, 0, code)
                    handleContentChange(lines.join('\n'))
                  }}
                />
              </div>
            )}

            {rightPanel === 'complexity' && activeTab && (
              <div className="w-96 shrink-0">
                <CodeComplexityVisualizer
                  code={activeTab.content}
                  language={activeTab.language}
                />
              </div>
            )}

            {rightPanel === 'pair' && (
              <div className="w-96 shrink-0">
                <CollaborativeAIPairProgrammer
                  files={safeFiles}
                  activeFile={activeTab}
                  onCodeGenerated={(code) => {
                    if (activeTab) {
                      const lines = activeTab.content.split('\n')
                      lines.push(code)
                      handleContentChange(lines.join('\n'))
                    }
                  }}
                  onFileCreated={(name, content) => {
                    handleFileCreate(name)
                  }}
                />
              </div>
            )}

            {rightPanel === 'performance' && activeTab && (
              <div className="w-96 shrink-0">
                <PerformanceProfiler
                  code={activeTab.content}
                  isRunning={false}
                  onOptimize={(line) => {
                    toast.info(`Analyzing line ${line} for optimization...`)
                  }}
                />
              </div>
            )}

            {rightPanel === 'quantum' && (
              <div className="w-96 shrink-0">
                <QuantumSynthesisPanel
                  onCodeGenerated={(code) => {
                    if (activeTab) {
                      handleContentChange(activeTab.content + '\n\n' + code)
                    } else {
                      const fileName = prompt('Create new file for generated code:')
                      if (fileName) {
                        handleFileCreate(fileName)
                      }
                    }
                  }}
                />
              </div>
            )}

            {rightPanel === 'dna' && activeTab && (
              <div className="w-96 shrink-0">
                <CodeDNASequencer
                  code={activeTab.content}
                  language={activeTab.language}
                />
              </div>
            )}

            {rightPanel === 'holographic' && activeTab && (
              <div className="w-96 shrink-0">
                <HolographicCodeViz
                  code={activeTab.content}
                  language={activeTab.language}
                />
              </div>
            )}

            {rightPanel === 'sentient' && activeTab && (
              <div className="w-96 shrink-0">
                <SentientDebugger
                  code={activeTab.content}
                  language={activeTab.language}
                  cursorPosition={activeTab.cursorPosition}
                  onSuggestFix={(lineNumber, suggestion) => {
                    toast.info(
                      <div>
                        <div className="font-semibold">Suggested fix for line {lineNumber}:</div>
                        <div className="text-xs mt-1">{suggestion}</div>
                      </div>,
                      { duration: 8000 }
                    )
                  }}
                />
              </div>
            )}

            {aiChatVisible && (
              <div className="w-96 shrink-0">
                <AIChatPanel
                  onClose={() => setAiChatVisible(false)}
                  currentFile={
                    activeTab
                      ? {
                          name: activeTab.fileName,
                          content: activeTab.content,
                          language: activeTab.language,
                        }
                      : undefined
                  }
                  onApplyCode={(code) => {
                    if (activeTab) {
                      handleContentChange(code)
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <StatusBar activeTab={activeTab} />
    </div>
  );
}

export default App
