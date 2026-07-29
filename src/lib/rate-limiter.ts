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
 * Determine whether an AI chat request for a user is allowed under the configured tiered rate limits.
 *
 * @param userId - The user's unique identifier used to track requests
 * @param tier - Subscription tier to apply (`free`, `paid`, or `pro`); defaults to `free`
 * @returns A RateLimitResult describing whether the request is allowed, how many requests remain in the window, the reset time, and an optional `retryAfter` when the limit is exceeded
 */
export function checkAIRateLimit(userId: string, tier: 'free' | 'paid' | 'pro' = 'free'): RateLimitResult {
  const config = rateLimitConfigs.aiChat[tier]
  return rateLimiter.check({
    ...config,
    identifier: `ai-${userId}`
  })
}

/**
 * Determine whether a user may perform a code execution request under the configured rate limits.
 *
 * @returns A `RateLimitResult` describing whether the request is allowed, the number of remaining requests in the current window, the timestamp when the window resets (`resetAt`), and `retryAfter` seconds when the request is blocked.
 */
export function checkExecutionRateLimit(userId: string): RateLimitResult {
  return rateLimiter.check({
    ...rateLimitConfigs.codeExecution,
    identifier: `exec-${userId}`
  })
}

/**
 * Checks the file-operations rate limit for a given user.
 *
 * @param userId - The user identifier used to build the rate-limit key (`file-<userId>`).
 * @returns `RateLimitResult` describing whether the request is allowed, how many requests remain in the current window, the reset timestamp, and an optional `retryAfter` in seconds when the limit is exceeded.
 */
export function checkFileRateLimit(userId: string): RateLimitResult {
  return rateLimiter.check({
    ...rateLimitConfigs.fileOperations,
    identifier: `file-${userId}`
  })
}

/**
 * Determine whether a paper-search request for the given user is allowed by the configured rate limit.
 *
 * @returns An object indicating if the request is allowed, the number of remaining requests in the current window, the reset timestamp (`resetAt`, milliseconds since epoch), and `retryAfter` seconds when the window is exhausted (present only when blocked).
 */
export function checkPaperSearchRateLimit(userId: string): RateLimitResult {
  return rateLimiter.check({
    ...rateLimitConfigs.paperSearch,
    identifier: `paper-${userId}`
  })
}

/**
 * Enforces quantum synthesis rate limits for a given user and subscription tier.
 *
 * @param userId - Identifier for the user whose requests are being tracked
 * @param tier - Subscription tier that selects the configured quota (`'free' | 'paid' | 'pro'`)
 * @returns `RateLimitResult` containing `allowed`, `remaining`, `resetAt`, and optional `retryAfter`
 */
export function checkQuantumRateLimit(userId: string, tier: 'free' | 'paid' | 'pro' = 'free'): RateLimitResult {
  const config = rateLimitConfigs.quantumSynthesis[tier]
  return rateLimiter.check({
    ...config,
    identifier: `quantum-${userId}`
  })
}

/**
 * Provides a React-friendly interface to perform rate limit checks for different endpoints.
 *
 * The returned `checkLimit` function dispatches to the appropriate per-endpoint checker and returns
 * the resulting RateLimitResult for the given user and tier.
 *
 * @param type - One of 'ai', 'execution', 'file', 'paper', or 'quantum' indicating which rate limit to check
 * @param userId - Identifier for the user whose quota is being checked
 * @param tier - Subscription tier for tiered endpoints; defaults to 'free'
 * @returns The rate limit outcome including `allowed`, `remaining`, `resetAt`, and optional `retryAfter`
 * @throws Error if `type` is not one of the supported rate limit types
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