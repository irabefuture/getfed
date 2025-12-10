/**
 * Production-safe error logging system
 * Captures errors and exposes them for mobile debugging via ErrorToast
 */

// In-memory error storage (last 10 errors)
const errorStore = {
  errors: [],
  maxErrors: 10,
  listeners: new Set()
}

/**
 * Error entry structure
 * @typedef {Object} ErrorEntry
 * @property {string} id - Unique error ID
 * @property {string} type - Error type: 'error', 'unhandled', 'supabase', 'api', 'debug'
 * @property {string} message - Error message
 * @property {string} [stack] - Stack trace if available
 * @property {Object} [context] - Additional context data
 * @property {number} timestamp - Unix timestamp
 */

/**
 * Generate unique ID for error
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Log an error to the store
 * @param {string} type - Error type
 * @param {string} message - Error message
 * @param {Object} [options] - Additional options
 * @param {string} [options.stack] - Stack trace
 * @param {Object} [options.context] - Additional context
 */
export function logError(type, message, options = {}) {
  const entry = {
    id: generateId(),
    type,
    message: String(message).slice(0, 500), // Truncate long messages
    stack: options.stack?.slice(0, 1000),
    context: options.context,
    timestamp: Date.now()
  }

  // Add to store
  errorStore.errors.unshift(entry)

  // Trim to max size
  if (errorStore.errors.length > errorStore.maxErrors) {
    errorStore.errors = errorStore.errors.slice(0, errorStore.maxErrors)
  }

  // Also log to console for dev tools
  console.error(`[ErrorLogger:${type}]`, message, options.context || '')

  // Notify listeners
  errorStore.listeners.forEach(listener => listener(errorStore.errors))

  return entry
}

/**
 * Log debug info (only stored when debug mode active)
 * @param {string} label - Debug label
 * @param {Object} data - Data to log
 */
export function logDebug(label, data) {
  const isDebugMode = typeof window !== 'undefined' &&
    (window.location.search.includes('debug=true') ||
     window.__DEBUG_MODE__ === true)

  // Always log to console
  console.log(`[Debug:${label}]`, data)

  // Only store in error panel if debug mode
  if (isDebugMode) {
    logError('debug', label, { context: data })
  }
}

/**
 * Log a Supabase operation result
 * @param {string} operation - Operation name (e.g., 'fetchUsers', 'saveMealPlan')
 * @param {Object} result - Supabase result object
 * @param {Object} [params] - Query parameters
 */
export function logSupabase(operation, result, params = {}) {
  const { data, error } = result

  if (error) {
    logError('supabase', `${operation}: ${error.message}`, {
      context: {
        code: error.code,
        details: error.details,
        hint: error.hint,
        params
      }
    })
  } else {
    logDebug(`Supabase:${operation}`, {
      success: true,
      rowCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
      params
    })
  }

  return result
}

/**
 * Get all stored errors
 * @returns {ErrorEntry[]}
 */
export function getErrors() {
  return [...errorStore.errors]
}

/**
 * Clear all stored errors
 */
export function clearErrors() {
  errorStore.errors = []
  errorStore.listeners.forEach(listener => listener([]))
}

/**
 * Subscribe to error updates
 * @param {Function} listener - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribeToErrors(listener) {
  errorStore.listeners.add(listener)
  return () => errorStore.listeners.delete(listener)
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode() {
  if (typeof window === 'undefined') return false
  return window.location.search.includes('debug=true') ||
         window.__DEBUG_MODE__ === true
}

/**
 * Enable debug mode programmatically
 */
export function enableDebugMode() {
  if (typeof window !== 'undefined') {
    window.__DEBUG_MODE__ = true
  }
}

/**
 * Disable debug mode programmatically
 */
export function disableDebugMode() {
  if (typeof window !== 'undefined') {
    window.__DEBUG_MODE__ = false
  }
}

/**
 * Initialize global error handlers
 * Call this once at app startup
 */
export function initializeErrorCapture() {
  if (typeof window === 'undefined') return

  // Capture unhandled errors
  window.onerror = (message, source, lineno, colno, error) => {
    logError('error', message, {
      stack: error?.stack,
      context: { source, lineno, colno }
    })
    return false // Don't prevent default handling
  }

  // Capture unhandled promise rejections
  window.onunhandledrejection = (event) => {
    const error = event.reason
    logError('unhandled', error?.message || String(error), {
      stack: error?.stack,
      context: { type: 'unhandledrejection' }
    })
  }

  console.log('[ErrorLogger] Initialized - use ?debug=true to show error panel')
}

/**
 * Wrapper for async functions to catch and log errors
 * @param {Function} fn - Async function to wrap
 * @param {string} label - Label for error logging
 */
export function withErrorLogging(fn, label) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError('api', `${label}: ${error.message}`, {
        stack: error.stack,
        context: { args: args.map(a => typeof a === 'object' ? '[Object]' : a) }
      })
      throw error // Re-throw so calling code can handle
    }
  }
}
