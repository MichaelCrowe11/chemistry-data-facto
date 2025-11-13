export interface CodeChallenge {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: 'javascript' | 'python' | 'typescript' | 'react' | 'algorithms' | 'data-structures'
  estimatedTime: string
  xpReward: number
  starterCode: string
  solution: string
  language: string
  hints: ChallengeHint[]
  testCases: TestCase[]
  learningObjectives: string[]
  relatedTutorials?: string[]
  prerequisites?: string[]
}

export interface ChallengeHint {
  level: number
  text: string
  codeSnippet?: string
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  description: string
  hidden?: boolean
}

export interface ChallengeAttempt {
  challengeId: string
  code: string
  timestamp: number
  passed: boolean
  testsPassed: number
  totalTests: number
  hintsUsed: number
  timeSpentMs: number
}

export interface ChallengeProgress {
  challengeId: string
  attempts: number
  completed: boolean
  completedAt?: number
  bestScore: number
  hintsUsed: number
  currentCode?: string
  startedAt: number
  timeSpentMs: number
  xpEarned: number
}

export interface UserChallengeStats {
  totalCompleted: number
  totalAttempts: number
  totalXP: number
  streak: number
  lastCompletedDate?: number
  categoriesCompleted: Record<string, number>
  difficultiesCompleted: Record<string, number>
}
