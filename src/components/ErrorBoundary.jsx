'use client'

import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/errorLogger'

/**
 * Error Boundary Component
 *
 * Catches render errors in child components and displays a user-friendly
 * error message instead of crashing the entire application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * With fallback:
 *   <ErrorBoundary fallback={<CustomErrorUI />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    this.setState({ errorInfo })

    // Log to our error tracking system
    logError('render', `ErrorBoundary caught: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      context: {
        component: this.props.name || 'Unknown',
        errorType: error.name
      }
    })

    // Also log to console for development
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo?.componentStack)
  }

  handleReload = () => {
    // Reset error state and try again
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleFullReload = () => {
    // Full page reload
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />

          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>

          <p className="text-sm text-red-600 text-center mb-4 max-w-md">
            An unexpected error occurred. This has been logged and we&apos;ll look into it.
          </p>

          {/* Error details (development only or if showDetails prop) */}
          {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
            <details className="mb-4 w-full max-w-md">
              <summary className="text-xs text-red-500 cursor-pointer hover:underline">
                Technical details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700 overflow-auto max-h-32">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              onClick={this.handleFullReload}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Compact error boundary for smaller components
 * Shows a minimal error state that doesn't take up much space
 */
export class CompactErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logError('render', `CompactErrorBoundary: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load</span>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-red-700 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
