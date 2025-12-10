'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ThumbsUp, ThumbsDown, Printer, Clock, Check, ArrowLeft } from 'lucide-react'
import { toAustralianName, formatQuantity } from '@/lib/ingredientFormat'
import { getRecipeRating, setRecipeRating, clearRecipeRating } from '@/lib/recipeRatings'
import { useUser } from '@/context/UserContext'

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
  // New props for picker preview mode
  mode = 'view', // 'view' (from planner) or 'preview' (from picker)
  onSelect, // Called when user selects recipe in preview mode
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [currentRating, setCurrentRating] = useState(null) // 'liked' | 'disliked' | null
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const overlayRef = useRef(null)
  const scrollRef = useRef(null)
  const wakeLockRef = useRef(null)
  const touchStartY = useRef(0)
  const touchStartScrollTop = useRef(0)
  const isSwipingDown = useRef(false)

  const { user } = useUser()

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

  // Fetch existing rating when overlay opens
  useEffect(() => {
    if (isOpen && recipe?.id && user?.id) {
      setCurrentRating(null) // Reset while loading
      getRecipeRating(user.id, recipe.id).then(rating => {
        setCurrentRating(rating)
      })
    } else if (!isOpen) {
      setCurrentRating(null) // Reset when closed
    }
  }, [isOpen, recipe?.id, user?.id])

  // Handle rating button press (toggle on/off)
  const handleRating = async (ratingType) => {
    if (!user?.id || !recipe?.id || isRatingLoading) return

    const clickedRating = ratingType === 'up' ? 'liked' : 'disliked'

    setIsRatingLoading(true)

    // If clicking the same rating, clear it (toggle off)
    if (currentRating === clickedRating) {
      const success = await clearRecipeRating(user.id, recipe.id)
      if (success) {
        setCurrentRating(null)
      }
    } else {
      // Set new rating
      const success = await setRecipeRating(user.id, recipe.id, clickedRating)
      if (success) {
        setCurrentRating(clickedRating)
        onRate?.(ratingType) // Call original handler if provided
      }
    }

    setIsRatingLoading(false)
  }

  // Force re-layout when window regains focus (fixes iOS Safari print return bug)
  useEffect(() => {
    if (!isOpen) return

    const handleFocus = () => {
      // Force a re-layout by toggling a minimal style change
      if (scrollRef.current) {
        const scrollTop = scrollRef.current.scrollTop
        scrollRef.current.style.overflow = 'hidden'
        // Force reflow
        void scrollRef.current.offsetHeight
        scrollRef.current.style.overflow = ''
        scrollRef.current.scrollTop = scrollTop
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
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

  // Handle print - generate dedicated print window with recipe content
  const handlePrint = () => {
    if (!recipe) return

    // Calculate scaled ingredients
    const baseServings = recipe.base_servings || 1
    const householdTotal = isHouseholdMode && householdPortions?.total > 1
      ? householdPortions.total
      : 1

    // Build ingredient list HTML
    const ingredientsHtml = recipe.ingredients?.map(ing => {
      const perServeGrams = (ing.grams || 0) / baseServings
      const scaledGrams = perServeGrams * householdTotal
      const auName = toAustralianName(ing.name)
      const qty = formatQuantity(scaledGrams, ing.name)
      return `<li><span class="amount">${qty}</span><span>${auName}${ing.notes ? ` (${ing.notes})` : ''}</span></li>`
    }).join('') || ''

    // Build method steps HTML
    const methodHtml = recipe.instructions?.map((step, i) =>
      `<li>${step}</li>`
    ).join('') || ''

    // Build portions info if household mode
    const portionsHtml = isHouseholdMode && householdPortions?.breakdown?.length > 0
      ? `<div class="portions"><strong>Portions:</strong> ${householdPortions.breakdown.map(p => `${p.name}: ${p.percentage}%`).join(' · ')}</div>`
      : ''

    const macros = recipe.per_serve || {}

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${sanitizeText(recipe.name)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.5;
            color: #333;
          }
          h1 {
            font-size: 22px;
            margin: 0 0 8px 0;
            line-height: 1.2;
          }
          .meta {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ddd;
          }
          .meal-type {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          h2 {
            font-size: 16px;
            margin: 20px 0 10px 0;
            color: #222;
          }
          .ingredients {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .ingredients li {
            padding: 6px 0;
            display: flex;
            gap: 12px;
            border-bottom: 1px solid #f0f0f0;
          }
          .ingredients .amount {
            color: #666;
            min-width: 70px;
            flex-shrink: 0;
          }
          .method {
            padding-left: 20px;
            margin: 0;
          }
          .method li {
            padding: 8px 0;
            line-height: 1.6;
          }
          .portions {
            font-size: 13px;
            color: #666;
            margin-top: 12px;
            padding: 10px;
            background: #f8f8f8;
            border-radius: 6px;
          }
          .batch-note {
            font-size: 13px;
            color: #8B6914;
            background: #FFF8E7;
            padding: 10px;
            border-radius: 6px;
            margin-top: 16px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="meal-type">${slot?.icon || ''} ${slot?.label || ''} · ${slot?.time || ''}</div>
        <h1>${sanitizeText(recipe.name)}</h1>
        <div class="meta">
          ${recipe.total_time_mins ? `${recipe.total_time_mins} min · ` : ''}${macros.calories || '?'} cal · ${macros.protein_g || '?'}g protein · ${macros.fat_g || '?'}g fat · ${macros.carbs_g || '?'}g carbs
        </div>

        <h2>Ingredients${householdTotal > 1 ? ` (serves ${householdPortions?.breakdown?.length || householdTotal})` : ''}</h2>
        <ul class="ingredients">
          ${ingredientsHtml}
        </ul>
        ${portionsHtml}

        <h2>Method</h2>
        <ol class="method">
          ${methodHtml}
        </ol>

        ${recipe.batch_notes ? `<div class="batch-note">💡 ${recipe.batch_notes}</div>` : ''}
      </body>
      </html>
    `

    // Open print window and trigger print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      // Small delay to ensure content is rendered before printing
      setTimeout(() => {
        printWindow.print()
        // On iOS, close the print window after a delay to return cleanly
        setTimeout(() => {
          printWindow.close()
        }, 500)
      }, 100)
    }
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
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
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
            <p className="text-xs text-muted-foreground mb-2">
              {currentRating ? 'Your rating:' : 'Rate this recipe'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRating('up')}
                disabled={isRatingLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  currentRating === 'liked'
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentRating === 'disliked'
                      ? 'opacity-40 border-gray-200'
                      : 'hover:bg-green-50 hover:border-green-300'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${currentRating === 'liked' ? 'text-white' : 'text-green-600'}`} />
                <span>Good</span>
              </button>
              <button
                onClick={() => handleRating('down')}
                disabled={isRatingLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  currentRating === 'disliked'
                    ? 'bg-red-500 border-red-500 text-white'
                    : currentRating === 'liked'
                      ? 'opacity-40 border-gray-200'
                      : 'hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <ThumbsDown className={`h-4 w-4 ${currentRating === 'disliked' ? 'text-white' : 'text-red-600'}`} />
                <span>Not for me</span>
              </button>
            </div>
            {currentRating === 'disliked' && (
              <p className="text-xs text-muted-foreground mt-2">
                This recipe won't be suggested again
              </p>
            )}
          </div>

          {/* Footer buttons - context-aware */}
          <div className="pt-4">
            {mode === 'preview' ? (
              // Preview mode (from picker): Back + Add This
              <div className="flex gap-3">
                <button
                  onClick={handleCloseButton}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => {
                    onSelect?.(recipe)
                    triggerClose()
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  <Check className="h-4 w-4" />
                  <span>Add This</span>
                </button>
              </div>
            ) : (
              // View mode (from planner): Single Close button
              <button
                onClick={handleCloseButton}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
