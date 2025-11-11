/**
 * Input Validation and Sanitization
 * Security layer to prevent injection attacks and data corruption
 */

import { z } from 'zod'

/**
 * File name validation
 * Prevents path traversal and malicious file names
 */
export const fileNameSchema = z
  .string()
  .min(1, 'File name cannot be empty')
  .max(255, 'File name too long (max 255 characters)')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'File name can only contain letters, numbers, dots, hyphens, and underscores'
  )
  .refine(
    (name) => !name.startsWith('.') || name.length > 1,
    'File name cannot be just a dot'
  )
  .refine(
    (name) => !['..', '.', 'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'].includes(name.toUpperCase()),
    'Invalid file name (reserved name)'
  )

/**
 * File path validation
 * Prevents directory traversal attacks
 */
export const filePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .max(4096, 'File path too long')
  .refine(
    (path) => !path.includes('..'),
    'File path cannot contain ..'
  )
  .refine(
    (path) => !path.startsWith('/') && !path.includes('\\'),
    'File path cannot be absolute'
  )

/**
 * File content validation
 * Limits file size to prevent abuse
 */
export const fileContentSchema = z
  .string()
  .max(10 * 1024 * 1024, 'File too large (max 10MB)')

/**
 * User ID validation
 */
export const userIdSchema = z
  .string()
  .min(1, 'User ID cannot be empty')
  .max(100, 'User ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format')

/**
 * Code execution input validation
 */
export const codeExecutionSchema = z.object({
  code: z.string().max(1 * 1024 * 1024, 'Code too large (max 1MB)'),
  language: z.enum(['javascript', 'typescript', 'python']),
  timeout: z.number().min(100).max(10000).optional()
})

/**
 * Experiment name validation
 */
export const experimentNameSchema = z
  .string()
  .min(1, 'Experiment name cannot be empty')
  .max(200, 'Experiment name too long')
  .regex(
    /^[a-zA-Z0-9\s._-]+$/,
    'Experiment name can only contain letters, numbers, spaces, dots, hyphens, and underscores'
  )

/**
 * Paper search query validation
 */
export const paperSearchSchema = z
  .string()
  .min(2, 'Search query too short (min 2 characters)')
  .max(500, 'Search query too long (max 500 characters)')

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(name: string): string {
  try {
    return fileNameSchema.parse(name)
  } catch (error) {
    // Fallback: remove invalid characters
    const sanitized = name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 255)

    if (sanitized.length === 0) {
      return 'untitled'
    }

    return sanitized
  }
}

/**
 * Validate file size
 */
export function validateFileSize(content: string, maxSizeBytes: number = 10 * 1024 * 1024): boolean {
  const sizeBytes = new Blob([content]).size
  return sizeBytes <= maxSizeBytes
}

/**
 * Sanitize code for execution
 * Removes potentially dangerous patterns
 */
export function sanitizeCode(code: string): string {
  // Remove import.meta and other dangerous patterns
  let sanitized = code

  // Warning: This is basic sanitization. Proper sandboxing should be done in Web Worker
  const dangerousPatterns = [
    /import\.meta/g,
    /__dirname/g,
    /__filename/g,
    /process\.env/g,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('Dangerous pattern detected and removed:', pattern)
      sanitized = sanitized.replace(pattern, '/* REMOVED FOR SECURITY */')
    }
  }

  return sanitized
}

/**
 * Validate and sanitize workspace ID
 */
export function validateWorkspaceId(id: string): boolean {
  try {
    userIdSchema.parse(id)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }

    sanitized[key] = value
  }

  return sanitized as T
}

/**
 * Validation error formatter
 */
export function formatValidationError(error: z.ZodError): string {
  const messages = error.errors.map(err => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
  return messages.join(', ')
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T>(json: string, schema: z.ZodSchema<T>): T | null {
  try {
    const parsed = JSON.parse(json)
    return schema.parse(parsed)
  } catch (error) {
    console.error('JSON parse error:', error)
    return null
  }
}

/**
 * React hook for validation
 */
export function useValidation() {
  const validateFileName = (name: string): { valid: boolean; error?: string } => {
    try {
      fileNameSchema.parse(name)
      return { valid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: formatValidationError(error) }
      }
      return { valid: false, error: 'Invalid file name' }
    }
  }

  const validateFileContent = (content: string): { valid: boolean; error?: string } => {
    try {
      fileContentSchema.parse(content)
      return { valid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: formatValidationError(error) }
      }
      return { valid: false, error: 'Invalid file content' }
    }
  }

  const validateExperimentName = (name: string): { valid: boolean; error?: string } => {
    try {
      experimentNameSchema.parse(name)
      return { valid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: formatValidationError(error) }
      }
      return { valid: false, error: 'Invalid experiment name' }
    }
  }

  return {
    validateFileName,
    validateFileContent,
    validateExperimentName,
    sanitizeFileName,
    sanitizeCode,
  }
}
