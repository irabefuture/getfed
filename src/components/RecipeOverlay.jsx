'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ThumbsUp, ThumbsDown, Printer, Clock } from 'lucide-react'
import { toAustralianName, formatQuantity } from '@/lib/ingredientFormat'

/**
 * Full-screen recipe overlay for mobile cooking mode
 * - True full-screen modal (covers everything including header)
 * - White background for easy reading
 * - Screen stays awake (Wake Lock API)
 * - Double-tap to close (prevents accidental closes while cooking)
 * - Swipe up/down to scroll content
 * - Rating buttons
 */
export default function RecipeOverlay({
  recipe,
  slot,
  isOpen,
  onClose,
  onRate,
  householdPortions,
  isHouseholdMode,
  onSwap,
  onClear,
}) {
  const [isClosing, setIsClosing] = useState(false)
  const overlayRef = useRef(null)
  const wakeLockRef = useRef(null)
  const lastTapTime = useRef(0)

  // Request wake lock when overlay opens (cooking mode)
  useEffect(() => {
    if (isOpen && 'wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch (err) {
          console.log('Wake Lock not supported or denied:', err)
        }
      }
      requestWakeLock()
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [isOpen])

  // Handle double-tap to close
  const handleTap = (e) => {
    // Don't close if tapping on interactive elements
    const isInteractive = e.target.closest('button, a, [role="button"]')
    if (isInteractive) return

    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.current

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected - close
      triggerClose()
      lastTapTime.current = 0
    } else {
      lastTapTime.current = now
    }
  }

  // Animate close
  const triggerClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Close button handler
  const handleCloseButton = (e) => {
    e.stopPropagation()
    triggerClose()
  }

  if (!isOpen || !recipe) return null

  const macros = recipe.per_serve || {}

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] md:hidden bg-white"
      style={{
        transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.2s ease-out',
      }}
      onClick={handleTap}
    >
      {/* Header - sticky with close button */}
      <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">{slot?.icon}</span>
            <span className="uppercase tracking-wide font-medium">{slot?.label}</span>
            <span>•</span>
            <span>{slot?.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Print recipe"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={handleCloseButton}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Close recipe"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable recipe content */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 60px)' }}>
        <div className="px-4 py-4 space-y-5 pb-24">
          {/* Title and description */}
          <div>
            <h1 className="text-xl font-bold mb-1">{recipe.name}</h1>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>

            {/* Time and nutrition summary */}
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              {recipe.total_time_mins && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {recipe.total_time_mins} min
                </span>
              )}
              <span className="font-medium">{macros.calories} cal</span>
              <span>{macros.protein_g}g protein</span>
              <span>{macros.fat_g}g fat</span>
              <span>{macros.carbs_g}g carbs</span>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h2 className="text-base font-semibold mb-2">
              Ingredients
              {isHouseholdMode && householdPortions?.breakdown?.length > 0 && (
                <span className="font-normal text-muted-foreground ml-2 text-sm">
                  (serves {householdPortions.breakdown.length})
                </span>
              )}
            </h2>
            <ul className="space-y-1.5">
              {recipe.ingredients?.map((ing, i) => {
                const baseServings = recipe.base_servings || 1
                const perServeGrams = (ing.grams || 0) / baseServings
                const scaledGrams =
                  isHouseholdMode && householdPortions?.total > 1
                    ? perServeGrams * householdPortions.total
                    : perServeGrams
                const auName = toAustralianName(ing.name)
                const qty = formatQuantity(scaledGrams, ing.name)
                return (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground w-16 flex-shrink-0">{qty}</span>
                    <span>{auName}</span>
                    {ing.notes && (
                      <span className="text-muted-foreground text-xs">({ing.notes})</span>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Portion guidance */}
            {isHouseholdMode && householdPortions?.breakdown?.length > 0 && (
              <div className="mt-3 p-2 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Portions: </span>
                  {householdPortions.breakdown.map((p, i) => (
                    <span key={p.name}>
                      {i > 0 && ' · '}
                      {p.name}: {p.percentage}%
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {/* Method */}
          <div>
            <h2 className="text-base font-semibold mb-2">Method</h2>
            <ol className="space-y-3">
              {recipe.instructions?.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Batch notes */}
          {recipe.batch_notes && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-900">💡 {recipe.batch_notes}</p>
            </div>
          )}

          {/* Rating */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">How was this recipe?</p>
            <div className="flex gap-3">
              <button
                onClick={() => onRate?.('up')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span>Good</span>
              </button>
              <button
                onClick={() => onRate?.('down')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <ThumbsDown className="h-4 w-4 text-red-600" />
                <span>Not for me</span>
              </button>
            </div>
          </div>
        </div>

        {/* Close hint at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 safe-area-bottom pointer-events-none">
          <p className="text-center text-xs text-muted-foreground">
            Double-tap to close
          </p>
        </div>
      </div>
    </div>
  )
}
