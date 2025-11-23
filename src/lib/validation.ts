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
 * Escape a string so it can be safely inserted into HTML.
 *
 * @param html - Input text or markup to be escaped
 * @returns The escaped HTML string with special characters replaced by entities, suitable for use as element.innerHTML
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Produce a filesystem-safe file name that conforms to the module's filename rules.
 *
 * Attempts to validate and return a name that satisfies `fileNameSchema`. If validation fails,
 * a safe fallback is returned by replacing disallowed characters, trimming to 255 characters,
 * and returning `'untitled'` when the result would be empty.
 *
 * @param name - The original file name to sanitize
 * @returns A sanitized file name suitable for use on the filesystem
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
 * Checks whether a string's byte size does not exceed a given limit.
 *
 * @param content - The string whose byte size will be measured.
 * @param maxSizeBytes - Maximum allowed size in bytes (default: 10 * 1024 * 1024).
 * @returns `true` if the UTF-8 byte size of `content` is less than or equal to `maxSizeBytes`, `false` otherwise.
 */
export function validateFileSize(content: string, maxSizeBytes: number = 10 * 1024 * 1024): boolean {
  const sizeBytes = new Blob([content]).size
  return sizeBytes <= maxSizeBytes
}

/**
 * Sanitizes source code by removing known dangerous runtime-specific patterns.
 *
 * Logs a console warning for each removed pattern.
 *
 * @param code - The source code to sanitize.
 * @returns A copy of `code` where detected dangerous patterns (for example `import.meta`, `__dirname`, `__filename`, `process.env`) are replaced with a security placeholder.
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
 * Checks whether a workspace identifier is valid according to the module's user ID rules.
 *
 * The identifier must consist of letters, digits, underscores, or hyphens and must satisfy the module's length constraints.
 *
 * @param id - The workspace identifier to validate
 * @returns `true` if `id` meets the allowed-character and length requirements, `false` otherwise.
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
 * Create a shallow copy of an object with keys that can cause prototype pollution removed.
 *
 * @param obj - The source object whose keys will be sanitized
 * @returns A new object containing the same entries as `obj` except any keys named `__proto__`, `constructor`, or `prototype` are omitted
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
 * Format a Zod validation error into a single human-readable message.
 *
 * @param error - The Zod validation error to format
 * @returns A single string where each validation issue is represented as `"path: message"` (or just the message if no path), joined by commas
 */
export function formatValidationError(error: z.ZodError): string {
  const messages = error.errors.map(err => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
  return messages.join(', ')
}

/**
 * Parse a JSON string and validate the result against a Zod schema.
 *
 * @param json - The JSON string to parse.
 * @param schema - Zod schema used to validate the parsed value.
 * @returns The parsed value typed as `T` if parsing and validation succeed, `null` if parsing fails or validation fails.
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
 * Provides reusable validation and sanitization utilities for file names, file content, and experiment names.
 *
 * @returns An object with the following properties:
 * - `validateFileName` — Validates a file name and returns `{ valid: boolean; error?: string }`.
 * - `validateFileContent` — Validates file content and returns `{ valid: boolean; error?: string }`.
 * - `validateExperimentName` — Validates an experiment name and returns `{ valid: boolean; error?: string }`.
 * - `sanitizeFileName` — Sanitizes or normalizes a file name when validation fails.
 * - `sanitizeCode` — Removes or neutralizes dangerous code patterns from a code string.
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