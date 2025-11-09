export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileItem[]
  parent?: string
  isOpen?: boolean
}

export interface EditorTab {
  id: string
  fileId: string
  fileName: string
  content: string
  isDirty: boolean
  language: string
  cursorPosition: { line: number; column: number }
}

export interface EditorState {
  files: FileItem[]
  openTabs: EditorTab[]
  activeTabId: string | null
  sidebarVisible: boolean
  statusBarVisible: boolean
}
