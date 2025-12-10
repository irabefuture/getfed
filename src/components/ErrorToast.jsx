'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp, Bug, Trash2 } from 'lucide-react'
import {
  getErrors,
  clearErrors,
  subscribeToErrors,
  formatTimestamp,
  isDebugMode
} from '@/lib/errorLogger'

/**
 * Floating error panel for mobile debugging
 * Shows last 3 errors with timestamps
 * Only visible when errors exist and debug mode is enabled
 */
export default function ErrorToast() {
  const [errors, setErrors] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    // Check debug mode on mount
    setDebugMode(isDebugMode())

    // Load initial errors
    setErrors(getErrors())

    // Subscribe to new errors
    const unsubscribe = subscribeToErrors((newErrors) => {
      setErrors(newErrors)
      // Auto-show panel when new error arrives
      if (newErrors.length > 0) {
        setIsDismissed(false)
      }
    })

    // Listen for URL changes (for SPA navigation)
    const handleLocationChange = () => {
      setDebugMode(isDebugMode())
    }

    window.addEventListener('popstate', handleLocationChange)

    return () => {
      unsubscribe()
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  // Don't render if no errors, dismissed, or debug mode not enabled
  if (!debugMode || errors.length === 0 || isDismissed) {
    return null
  }

  const displayErrors = isExpanded ? errors : errors.slice(0, 3)

  const getTypeColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-400'
      case 'unhandled':
        return 'text-red-500'
      case 'supabase':
        return 'text-orange-400'
      case 'api':
        return 'text-yellow-400'
      case 'debug':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const getTypeBadge = (type) => {
    const colors = {
      error: 'bg-red-900/50 text-red-300',
      unhandled: 'bg-red-900/70 text-red-200',
      supabase: 'bg-orange-900/50 text-orange-300',
      api: 'bg-yellow-900/50 text-yellow-300',
      debug: 'bg-blue-900/50 text-blue-300'
    }
    return colors[type] || 'bg-gray-800 text-gray-300'
  }

  return (
    <div
      className="fixed bottom-20 left-2 right-2 z-[300] max-w-md mx-auto"
      style={{ touchAction: 'none' }}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-800/80 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-white">
              Debug Log ({errors.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearErrors()
              }}
              className="p-1 hover:bg-gray-700 rounded"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDismissed(true)
              }}
              className="p-1 hover:bg-gray-700 rounded"
              title="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Error List */}
        <div
          className={`overflow-y-auto transition-all duration-200 ${
            isExpanded ? 'max-h-80' : 'max-h-40'
          }`}
        >
          {displayErrors.map((error) => (
            <ErrorItem key={error.id} error={error} getTypeBadge={getTypeBadge} />
          ))}
        </div>

        {/* Show more indicator */}
        {!isExpanded && errors.length > 3 && (
          <div className="px-3 py-1 text-center text-xs text-gray-500 bg-gray-800/50">
            Tap to show {errors.length - 3} more
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorItem({ error, getTypeBadge }) {
  const [isContextExpanded, setIsContextExpanded] = useState(false)

  return (
    <div className="px-3 py-2 border-b border-gray-800 last:border-b-0">
      <div className="flex items-start gap-2">
        <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeBadge(error.type)}`}>
          {error.type}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 break-words">{error.message}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {formatTimestamp(error.timestamp)}
          </p>
        </div>
      </div>

      {/* Context data (expandable) */}
      {error.context && (
        <div className="mt-1">
          <button
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            className="text-[10px] text-blue-400 hover:text-blue-300"
          >
            {isContextExpanded ? 'Hide details' : 'Show details'}
          </button>
          {isContextExpanded && (
            <pre className="mt-1 p-2 bg-gray-800 rounded text-[10px] text-gray-400 overflow-x-auto max-h-32 overflow-y-auto">
              {JSON.stringify(error.context, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Stack trace (expandable) */}
      {error.stack && (
        <details className="mt-1">
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400">
            Stack trace
          </summary>
          <pre className="mt-1 p-2 bg-gray-800 rounded text-[10px] text-gray-500 overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  )
}
