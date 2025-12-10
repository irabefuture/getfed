'use client'

import ErrorBoundary from './ErrorBoundary'

/**
 * App-level error boundary wrapper
 *
 * Wraps the entire application to catch any unhandled render errors.
 * Provides a fallback UI so the app doesn't completely crash.
 */
export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary name="App">
      {children}
    </ErrorBoundary>
  )
}
