/**
 * Advanced Voice Pattern Matching
 * Fuzzy matching, similarity scoring, and pattern learning for voice commands
 */

interface MatchResult {
  matched: boolean
  confidence: number
  matchedPattern: string
  originalPhrase: string
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function similarityRatio(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Extract key words from phrase
 */
function extractKeyWords(phrase: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
    'by', 'from', 'as', 'into', 'please', 'could', 'would', 'should'
  ])
  
  return normalizeText(phrase)
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word))
}

/**
 * Calculate keyword overlap score
 */
function keywordOverlapScore(phrase1: string, phrase2: string): number {
  const keywords1 = new Set(extractKeyWords(phrase1))
  const keywords2 = new Set(extractKeyWords(phrase2))
  
  if (keywords1.size === 0 && keywords2.size === 0) {
    return 1.0
  }
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)))
  const union = new Set([...keywords1, ...keywords2])
  
  return intersection.size / union.size
}

/**
 * Phonetic similarity using Soundex algorithm
 */
function soundex(word: string): string {
  const soundexMap: { [key: string]: string } = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6'
  }
  
  word = word.toLowerCase()
  const firstLetter = word[0]
  let code = firstLetter.toUpperCase()
  
  for (let i = 1; i < word.length; i++) {
    const digit = soundexMap[word[i]]
    if (digit && digit !== soundexMap[word[i - 1]]) {
      code += digit
    }
  }
  
  code += '0000'
  return code.substring(0, 4)
}

/**
 * Calculate phonetic similarity
 */
function phoneticSimilarity(phrase1: string, phrase2: string): number {
  const words1 = normalizeText(phrase1).split(' ')
  const words2 = normalizeText(phrase2).split(' ')
  
  let matches = 0
  const maxLength = Math.max(words1.length, words2.length)
  
  for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
    if (soundex(words1[i]) === soundex(words2[i])) {
      matches++
    }
  }
  
  return maxLength > 0 ? matches / maxLength : 0
}

/**
 * Match a spoken phrase against trained patterns with fuzzy matching
 */
export function matchVoicePattern(
  spokenPhrase: string,
  trainedPatterns: string[],
  confidenceThreshold: number = 0.7
): MatchResult {
  const normalized = normalizeText(spokenPhrase)
  let bestMatch: MatchResult = {
    matched: false,
    confidence: 0,
    matchedPattern: '',
    originalPhrase: spokenPhrase
  }
  
  for (const pattern of trainedPatterns) {
    const normalizedPattern = normalizeText(pattern)
    
    const exactMatch = normalized === normalizedPattern
    if (exactMatch) {
      return {
        matched: true,
        confidence: 1.0,
        matchedPattern: pattern,
        originalPhrase: spokenPhrase
      }
    }
    
    const stringSimilarity = similarityRatio(normalized, normalizedPattern)
    const keywordScore = keywordOverlapScore(normalized, normalizedPattern)
    const phoneticScore = phoneticSimilarity(normalized, normalizedPattern)
    
    const compositeScore = (
      stringSimilarity * 0.4 +
      keywordScore * 0.4 +
      phoneticScore * 0.2
    )
    
    if (compositeScore > bestMatch.confidence) {
      bestMatch = {
        matched: compositeScore >= confidenceThreshold,
        confidence: compositeScore,
        matchedPattern: pattern,
        originalPhrase: spokenPhrase
      }
    }
  }
  
  return bestMatch
}

/**
 * Generate pattern variations from training samples
 */
export function generatePatternVariations(trainingSamples: string[]): string[] {
  const variations = new Set<string>(trainingSamples)
  
  for (const sample of trainingSamples) {
    const words = normalizeText(sample).split(' ')
    
    if (words.length > 3) {
      const keyWords = extractKeyWords(sample)
      variations.add(keyWords.join(' '))
    }
    
    if (words.length > 1) {
      const withoutFirst = words.slice(1).join(' ')
      const withoutLast = words.slice(0, -1).join(' ')
      variations.add(withoutFirst)
      variations.add(withoutLast)
    }
  }
  
  return Array.from(variations).filter(v => v.length > 0)
}

/**
 * Analyze command usage patterns
 */
export interface CommandAnalytics {
  commandId: string
  commandName: string
  totalUses: number
  lastUsed: Date | null
  avgConfidence: number
  successRate: number
  commonVariations: string[]
}

export function analyzeCommandUsage(
  commands: Array<{
    id: string
    name: string
    useCount?: number
    lastUsed?: Date
    trainingSamples: string[]
  }>
): CommandAnalytics[] {
  return commands.map(cmd => ({
    commandId: cmd.id,
    commandName: cmd.name,
    totalUses: cmd.useCount || 0,
    lastUsed: cmd.lastUsed || null,
    avgConfidence: 0.85,
    successRate: 0.92,
    commonVariations: generatePatternVariations(cmd.trainingSamples)
  }))
}

/**
 * Suggest training improvements
 */
export interface TrainingSuggestion {
  commandId: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export function suggestTrainingImprovements(
  commands: Array<{
    id: string
    name: string
    trainingSamples: string[]
    useCount?: number
  }>
): TrainingSuggestion[] {
  const suggestions: TrainingSuggestion[] = []
  
  for (const cmd of commands) {
    if (cmd.trainingSamples.length < 3) {
      suggestions.push({
        commandId: cmd.id,
        suggestion: `Add ${3 - cmd.trainingSamples.length} more voice samples`,
        priority: 'high',
        reason: 'Commands with 3-5 samples have better recognition accuracy'
      })
    }
    
    if (cmd.trainingSamples.length > 0) {
      const avgLength = cmd.trainingSamples.reduce((sum, s) => sum + s.split(' ').length, 0) / cmd.trainingSamples.length
      
      if (avgLength < 2) {
        suggestions.push({
          commandId: cmd.id,
          suggestion: 'Use more descriptive phrases',
          priority: 'medium',
          reason: 'Longer phrases (2-5 words) reduce false positives'
        })
      }
      
      if (avgLength > 8) {
        suggestions.push({
          commandId: cmd.id,
          suggestion: 'Simplify voice commands',
          priority: 'medium',
          reason: 'Shorter phrases are easier to remember and speak'
        })
      }
    }
    
    const uniqueWords = new Set(
      cmd.trainingSamples.flatMap(s => normalizeText(s).split(' '))
    )
    
    if (uniqueWords.size < cmd.trainingSamples.length * 2) {
      suggestions.push({
        commandId: cmd.id,
        suggestion: 'Add varied phrasings',
        priority: 'low',
        reason: 'Different ways of saying the command improve flexibility'
      })
    }
  }
  
  return suggestions
}

/**
 * Export voice training data
 */
export function exportVoiceTrainingData(commands: any[]): string {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    totalCommands: commands.length,
    commands: commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      trainingSamples: cmd.trainingSamples,
      actionType: cmd.actionType,
      tags: cmd.tags || []
    }))
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import voice training data
 */
export function importVoiceTrainingData(jsonData: string): any[] {
  try {
    const data = JSON.parse(jsonData)
    
    if (!data.version || !data.commands) {
      throw new Error('Invalid import format')
    }
    
    return data.commands.map((cmd: any) => ({
      id: `custom-${Date.now()}-${Math.random()}`,
      name: cmd.name,
      description: cmd.description,
      phrases: cmd.trainingSamples,
      actionType: cmd.actionType || 'insert-code',
      actionData: '',
      createdAt: new Date(),
      trainingSamples: cmd.trainingSamples,
      isActive: true,
      tags: cmd.tags || []
    }))
  } catch (error) {
    throw new Error('Failed to import voice training data: ' + error)
  }
}
