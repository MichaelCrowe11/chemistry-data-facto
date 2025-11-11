/**
 * Rate Limiter for API Calls
 * Prevents abuse and controls costs for AI API usage
 */

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  identifier: string // user ID or IP
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  /**
   * Check if a request is allowed under rate limit
   */
  check(config: RateLimitConfig): RateLimitResult {
    const { maxRequests, windowMs, identifier } = config
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || []

    // Filter out requests outside the current window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests)
      const resetAt = new Date(oldestRequest + windowMs)
      const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter
      }
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
      resetAt: new Date(now + windowMs)
    }
  }

  /**
   * Reset limits for an identifier (useful for testing)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Clear all rate limits (useful for cleanup)
   */
  clearAll(): void {
    this.requests.clear()
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier: string, windowMs: number): number {
    const now = Date.now()
    const windowStart = now - windowMs
    const userRequests = this.requests.get(identifier) || []
    return userRequests.filter(timestamp => timestamp > windowStart).length
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Rate limit configurations for different API endpoints
 */
export const rateLimitConfigs = {
  // AI API calls - most expensive, strict limits
  aiChat: {
    free: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour for free users
    paid: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100/hour for paid users
    pro: { maxRequests: 500, windowMs: 60 * 60 * 1000 }   // 500/hour for pro users
  },

  // Code execution - potential abuse vector
  codeExecution: {
    maxRequests: 30,
    windowMs: 60 * 1000 // 30/minute
  },

  // File operations - prevent spam
  fileOperations: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 100/minute
  },

  // Paper search - external API costs
  paperSearch: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000 // 50/hour
  },

  // Experiment tracking - moderate limits
  experimentTracking: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000 // 100/hour
  },

  // Quantum synthesis - very expensive AI calls
  quantumSynthesis: {
    free: { maxRequests: 5, windowMs: 60 * 60 * 1000 },  // 5/hour for free
    paid: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour for paid
    pro: { maxRequests: 100, windowMs: 60 * 60 * 1000 }  // 100/hour for pro
  }
}

/**
 * Check rate limit for AI API calls
 */
export function checkAIRateLimit(userId: string, tier: 'free' | 'paid' | 'pro' = 'free'): RateLimitResult {
  const config = rateLimitConfigs.aiChat[tier]
  return rateLimiter.check({
    ...config,
    identifier: `ai-${userId}`
  })
}

/**
 * Check rate limit for code execution
 */
export function checkExecutionRateLimit(userId: string): RateLimitResult {
  return rateLimiter.check({
    ...rateLimitConfigs.codeExecution,
    identifier: `exec-${userId}`
  })
}

/**
 * Check rate limit for file operations
 */
export function checkFileRateLimit(userId: string): RateLimitResult {
  return rateLimiter.check({
    ...rateLimitConfigs.fileOperations,
    identifier: `file-${userId}`
  })
}

/**
 * Check rate limit for paper search
 */
export function checkPaperSearchRateLimit(userId: string): RateLimitResult {
  return rateLimiter.check({
    ...rateLimitConfigs.paperSearch,
    identifier: `paper-${userId}`
  })
}

/**
 * Check rate limit for quantum synthesis
 */
export function checkQuantumRateLimit(userId: string, tier: 'free' | 'paid' | 'pro' = 'free'): RateLimitResult {
  const config = rateLimitConfigs.quantumSynthesis[tier]
  return rateLimiter.check({
    ...config,
    identifier: `quantum-${userId}`
  })
}

/**
 * React hook for rate limit checking
 */
export function useRateLimit() {
  const checkLimit = (type: string, userId: string, tier: 'free' | 'paid' | 'pro' = 'free'): RateLimitResult => {
    switch (type) {
      case 'ai':
        return checkAIRateLimit(userId, tier)
      case 'execution':
        return checkExecutionRateLimit(userId)
      case 'file':
        return checkFileRateLimit(userId)
      case 'paper':
        return checkPaperSearchRateLimit(userId)
      case 'quantum':
        return checkQuantumRateLimit(userId, tier)
      default:
        throw new Error(`Unknown rate limit type: ${type}`)
    }
  }

  return { checkLimit, rateLimiter }
}
