import { z } from 'zod'

export const FileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['file', 'folder']),
  content: z.string().optional(),
  parent: z.string().optional(),
  isOpen: z.boolean().optional(),
  createdAt: z.number().optional(),
  modifiedAt: z.number().optional(),
})

export const EditorTabSchema = z.object({
  id: z.string(),
  fileId: z.string(),
  fileName: z.string(),
  content: z.string(),
  isDirty: z.boolean(),
  language: z.string(),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }),
})

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontSize: z.number().min(8).max(32).optional(),
  tabSize: z.number().min(2).max(8).optional(),
  autoSave: z.boolean().optional(),
  enableAI: z.boolean().optional(),
  enable3D: z.boolean().optional(),
  enableVR: z.boolean().optional(),
  enableVoice: z.boolean().optional(),
})

export const ExperimentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  code: z.string(),
  language: z.string(),
  results: z.any().optional(),
  timestamp: z.number(),
  tags: z.array(z.string()).optional(),
})

export const ResearchPaperSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  abstract: z.string(),
  arxivId: z.string().optional(),
  url: z.string().url(),
  publishedDate: z.string(),
  categories: z.array(z.string()).optional(),
  linkedFiles: z.array(z.string()).optional(),
})

export const ReproducibilityPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  files: z.array(FileItemSchema),
  dependencies: z.record(z.string()),
  environment: z.object({
    runtime: z.string(),
    version: z.string(),
    platform: z.string().optional(),
  }),
  dataSnapshot: z.object({
    kvStore: z.record(z.any()).optional(),
    timestamp: z.number(),
  }),
  createdAt: z.number(),
  checksum: z.string().optional(),
})

export type FileItem = z.infer<typeof FileItemSchema>
export type EditorTab = z.infer<typeof EditorTabSchema>
export type UserPreferences = z.infer<typeof UserPreferencesSchema>
export type Experiment = z.infer<typeof ExperimentSchema>
export type ResearchPaper = z.infer<typeof ResearchPaperSchema>
export type ReproducibilityPackage = z.infer<typeof ReproducibilityPackageSchema>
