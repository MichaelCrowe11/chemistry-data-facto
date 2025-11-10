import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

// Initialize PostHog (free tier, privacy-friendly)
export const initAnalytics = () => {
  if (POSTHOG_KEY && typeof window !== 'undefined') {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false, // Only track what you explicitly want
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: false, // Enable session replay for debugging
    })
  }
}

// Track events
export const analytics = {
  // User events
  identify: (userId: string, traits?: Record<string, any>) => {
    if (!POSTHOG_KEY) return
    posthog.identify(userId, traits)
  },

  // Feature usage
  track: (event: string, properties?: Record<string, any>) => {
    if (!POSTHOG_KEY) return
    posthog.capture(event, properties)
  },

  // Page views (auto-tracked)
  page: (pageName: string) => {
    if (!POSTHOG_KEY) return
    posthog.capture('$pageview', { page: pageName })
  },

  // Reset on logout
  reset: () => {
    if (!POSTHOG_KEY) return
    posthog.reset()
  }
}

// Key events to track
export const Events = {
  // User lifecycle
  SIGN_UP: 'user_signed_up',
  SIGN_IN: 'user_signed_in',
  SIGN_OUT: 'user_signed_out',

  // Core features
  FILE_CREATED: 'file_created',
  FILE_SAVED: 'file_saved',
  FILE_OPENED: 'file_opened',
  CODE_EXECUTED: 'code_executed',

  // AI features
  AI_CHAT_OPENED: 'ai_chat_opened',
  AI_QUERY_SENT: 'ai_query_sent',
  AI_CODE_APPLIED: 'ai_code_applied',

  // Engagement
  EXTENSION_INSTALLED: 'extension_installed',
  SETTINGS_CHANGED: 'settings_changed',
  SHARE_CLICKED: 'share_clicked',

  // Drop-off points (to identify issues)
  EDITOR_ERROR: 'editor_error',
  API_ERROR: 'api_error',
  AUTH_ERROR: 'auth_error',
}
