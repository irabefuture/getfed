'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ThumbsUp, ThumbsDown, Printer, Clock } from 'lucide-react'
import { toAustralianName, formatQuantity } from '@/lib/ingredientFormat'

// Helper to sanitize text (remove IP addresses and URLs)
const sanitizeText = (text) => {
  if (!text) return ''
  return text
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/localhost:\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Full-screen recipe overlay for mobile cooking mode
 * - True full-screen modal (covers everything including header)
 * - White background for easy reading
 * - Screen stays awake (Wake Lock API)
 * - Swipe down to dismiss (when at top of scroll)
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
  const [swipeOffset, setSwipeOffset] = useState(0)
  const overlayRef = useRef(null)
  const scrollRef = useRef(null)
  const wakeLockRef = useRef(null)
  const touchStartY = useRef(0)
  const touchStartScrollTop = useRef(0)
  const isSwipingDown = useRef(false)

  // Swipe dismiss thresholds
  const DISMISS_THRESHOLD = 100

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

  // Reset swipe state when overlay opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSwipeOffset(0)
      isSwipingDown.current = false
    }
  }, [isOpen])

  // Handle touch start for swipe-down dismiss
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    touchStartScrollTop.current = scrollRef.current?.scrollTop || 0
    isSwipingDown.current = false
  }

  // Handle touch move for swipe-down dismiss
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY
    const deltaY = currentY - touchStartY.current
    const scrollTop = scrollRef.current?.scrollTop || 0

    // Only allow swipe-down dismiss when:
    // 1. We're at the top of the scroll (scrollTop <= 0)
    // 2. User is swiping down (deltaY > 0)
    // 3. We started at or near the top
    if (touchStartScrollTop.current <= 5 && deltaY > 0 && scrollTop <= 0) {
      isSwipingDown.current = true
      // Apply resistance to the swipe
      const resistance = 0.5
      setSwipeOffset(Math.max(0, deltaY * resistance))
      e.preventDefault()
    }
  }

  // Handle touch end for swipe-down dismiss
  const handleTouchEnd = () => {
    if (isSwipingDown.current && swipeOffset >= DISMISS_THRESHOLD) {
      // Trigger close
      triggerClose()
    } else {
      // Snap back
      setSwipeOffset(0)
    }
    isSwipingDown.current = false
  }

  // Animate close
  const triggerClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setSwipeOffset(0)
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

  // Calculate visual offset for swipe animation
  const translateY = isClosing ? '100%' : `${swipeOffset}px`
  const opacity = isClosing ? 0 : Math.max(0.3, 1 - swipeOffset / 300)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] md:hidden bg-white flex flex-col"
      style={{
        transform: `translateY(${translateY})`,
        transition: isSwipingDown.current ? 'none' : 'transform 0.2s ease-out',
        opacity,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Fixed Header Area - Recipe info + meal type row */}
      <div className="flex-shrink-0 bg-white safe-area-top">
        {/* Swipe indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Recipe title and description */}
        <div className="px-4 pb-2">
          <h1 className="text-xl font-bold leading-tight">{sanitizeText(recipe.name)}</h1>
          {recipe.description && sanitizeText(recipe.description) && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {sanitizeText(recipe.description)}
            </p>
          )}

          {/* Quick stats row */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            {recipe.total_time_mins && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {recipe.total_time_mins}m
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">{macros.calories} cal</span>
            <span className="text-muted-foreground">·</span>
            <span>{macros.protein_g}P</span>
            <span className="text-muted-foreground">·</span>
            <span>{macros.fat_g}F</span>
            <span className="text-muted-foreground">·</span>
            <span>{macros.carbs_g}C</span>
          </div>
        </div>

        {/* Meal type row with actions */}
        <div className="flex items-center justify-between px-4 py-2 border-y bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-base">{slot?.icon}</span>
            <span className="uppercase tracking-wide font-medium text-xs">{slot?.label}</span>
            <span>·</span>
            <span className="text-xs">{slot?.time}</span>
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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="px-4 py-4 space-y-5 pb-32">
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
              <p className="text-sm text-amber-900">{recipe.batch_notes}</p>
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

          {/* Close button - full width for easy tap */}
          <div className="pt-4">
            <button
              onClick={handleCloseButton}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
