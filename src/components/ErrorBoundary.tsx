/**
 * Enhanced Error Boundary with Recovery
 * Prevents full app crashes and provides graceful error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Warning, ArrowClockwise, House, Bug } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean // If true, only affects this component, not whole app
  resetKeys?: any[] // Array of values that trigger reset when changed
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
}

/**
 * Production-ready error boundary with recovery mechanisms
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service (e.g., Sentry)
    this.logErrorToService(error, errorInfo)

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    const { hasError } = this.state

    // Auto-reset if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )

      if (hasResetKeyChanged) {
        this.handleReset()
      }
    }
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with Sentry or similar service
    console.error('Error caught by boundary:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportBug = () => {
    const { error, errorInfo } = this.state
    const issueBody = `
**Error Message:**
${error?.message || 'Unknown error'}

**Stack Trace:**
\`\`\`
${error?.stack || 'No stack trace'}
\`\`\`

**Component Stack:**
\`\`\`
${errorInfo?.componentStack || 'No component stack'}
\`\`\`

**Browser:** ${navigator.userAgent}
**Timestamp:** ${new Date().toISOString()}
    `.trim()

    const githubIssueUrl = `https://github.com/MichaelCrowe11/chemistry-data-facto/issues/new?title=${encodeURIComponent(
      `Bug: ${error?.message || 'Unhandled error'}`
    )}&body=${encodeURIComponent(issueBody)}`

    window.open(githubIssueUrl, '_blank')
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state
    const { children, fallback, isolate } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Show different UI based on error count
      const isCritical = errorCount > 2

      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <Card className="max-w-2xl w-full p-8 space-y-6">
            {/* Error icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <Warning size={48} weight="duotone" className="text-destructive" />
              </div>
            </div>

            {/* Error message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {isCritical ? 'Critical Error' : 'Something went wrong'}
              </h2>
              <p className="text-muted-foreground">
                {isCritical
                  ? 'The application has encountered multiple errors. Please reload the page or contact support.'
                  : 'We\'re sorry for the inconvenience. This error has been logged and we\'ll look into it.'}
              </p>
            </div>

            {/* Error details (dev mode only) */}
            {import.meta.env.DEV && error && (
              <div className="p-4 rounded-lg bg-muted text-sm font-mono space-y-2">
                <div className="font-bold text-destructive">{error.message}</div>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
                {errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error count warning */}
            {errorCount > 1 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
                This error has occurred {errorCount} times. If it persists, please report it.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!isolate && (
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1 gap-2"
                >
                  <ArrowClockwise size={16} />
                  Try Again
                </Button>
              )}

              {isCritical ? (
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <ArrowClockwise size={16} />
                  Reload Page
                </Button>
              ) : (
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <House size={16} />
                  Go Home
                </Button>
              )}

              <Button
                onClick={this.handleReportBug}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Bug size={16} />
                Report Bug
              </Button>
            </div>

            {/* Help text */}
            <p className="text-center text-sm text-muted-foreground">
              If this problem persists, try clearing your browser cache or contact support.
            </p>
          </Card>
        </div>
      )
    }

    return children
  }
}

/**
 * Wraps children in an error boundary that isolates failures to a single component.
 *
 * @param componentName - Human-readable component name displayed in the fallback UI and included in error logs.
 * @returns The children wrapped with an isolated ErrorBoundary; if the wrapped component throws, the provided fallback UI is rendered instead.
 */
export function ComponentErrorBoundary({
  children,
  componentName
}: {
  children: ReactNode
  componentName: string
}) {
  return (
    <ErrorBoundary
      isolate
      fallback={
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <Warning size={20} weight="duotone" />
            <span className="font-medium">Error in {componentName}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This component failed to load. Try refreshing the page.
          </p>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error(`Error in ${componentName}:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Returns a React state setter that, when called with an `Error`, will cause that error to be thrown in the next render,
 * triggering the nearest ErrorBoundary. This works by storing the error in state and throwing it in a `useEffect`.
 *
 * @returns A React state setter; calling it with an `Error` will cause that error to be thrown in the next render cycle,
 *          so an enclosing ErrorBoundary can catch it.
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}