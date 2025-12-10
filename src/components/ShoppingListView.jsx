'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  loadShoppingList,
  updateCheckedItems,
  clearShoppingList,
  CATEGORY_LABELS,
  generateShoppingList,
  saveShoppingList,
  generateMealPlanHash
} from '@/lib/shoppingList'
import { getDatesFromStart, formatDateRange, toISODate } from '@/lib/dates'
import { fetchMealPlan } from '@/lib/mealPlanService'
import { calculateMemberPortion } from '@/lib/smartPlanner'
import { Printer, ShoppingCart, AlertCircle, Trash2, RefreshCw, Check, Loader2, X, ChevronDown, ChevronUp, Clipboard } from 'lucide-react'

export default function ShoppingListView() {
  const { user, members, isHouseholdMode, household } = useUser()
  const householdId = household?.id
  const [listData, setListData] = useState(null)
  const [checkedItems, setCheckedItems] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)
  const [meals, setMeals] = useState({})
  const [excludedMeals, setExcludedMeals] = useState([]) // Array of "dateKey-slotId" strings
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])
  const [expandedItems, setExpandedItems] = useState([])
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Generate dates for current week
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const allDates = useMemo(() => getDatesFromStart(today, 7), [today])
  const weekDateKeys = useMemo(() => allDates.map(d => toISODate(d)), [allDates])

  // Load meals and excluded meals from Supabase (or localStorage fallback)
  useEffect(() => {
    async function loadMeals() {
      if (!user) return

      // If we have a household, try Supabase first
      if (householdId && weekDateKeys.length > 0) {
        const startDate = weekDateKeys[0]
        const endDate = weekDateKeys[weekDateKeys.length - 1]

        const { meals: supabaseMeals, excludedMeals: supabaseExcluded, error } = await fetchMealPlan(
          householdId,
          startDate,
          endDate
        )

        if (!error && Object.keys(supabaseMeals).length > 0) {
          setMeals(supabaseMeals)
          setExcludedMeals(supabaseExcluded)
          return
        }
      }

      // Fall back to localStorage
      try {
        const storageKey = `meal-plan-${user.id}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          setMeals(JSON.parse(saved))
        }
        // Load excluded meals
        const excludedKey = `excluded-meals-${user.id}`
        const savedExcluded = localStorage.getItem(excludedKey)
        if (savedExcluded) {
          setExcludedMeals(JSON.parse(savedExcluded))
        }
      } catch (e) {
        console.error('Failed to load meals:', e)
      }
    }

    loadMeals()
  }, [user?.id, householdId, weekDateKeys])

  // Count meals in current week
  const totalWeekMeals = useMemo(() => {
    let count = 0
    weekDateKeys.forEach(dateKey => {
      count += Object.keys(meals[dateKey] || {}).length
    })
    return count
  }, [weekDateKeys, meals])

  // Calculate current meal plan hash (includes exclusions)
  const currentMealHash = useMemo(() => {
    return generateMealPlanHash(meals, weekDateKeys, excludedMeals)
  }, [meals, weekDateKeys, excludedMeals])

  // Check if shopping list needs update
  const isListStale = listData?.mealPlanHash && currentMealHash !== listData.mealPlanHash

  // Get days that have meals
  const daysWithMeals = useMemo(() => {
    return allDates.filter(date => {
      const dateKey = toISODate(date)
      return Object.keys(meals[dateKey] || {}).length > 0
    })
  }, [allDates, meals])

  // Get meal count for a specific date (all meals, ignoring exclusions)
  const getMealCountForDate = (date) => {
    const dateKey = toISODate(date)
    return Object.keys(meals[dateKey] || {}).length
  }

  // Get non-excluded meal count for a specific date
  const getIncludedMealCountForDate = (date) => {
    const dateKey = toISODate(date)
    const dayMeals = meals[dateKey] || {}
    let count = 0
    Object.keys(dayMeals).forEach(slotId => {
      const exclusionKey = `${dateKey}-${slotId}`
      if (!excludedMeals.includes(exclusionKey)) {
        count++
      }
    })
    return count
  }

  // Get week date range for display
  const weekDateRange = useMemo(() => {
    if (allDates.length === 0) return null
    return { first: allDates[0], last: allDates[allDates.length - 1] }
  }, [allDates])
  
  // Load shopping list on mount and when user changes
  useEffect(() => {
    if (user) {
      const saved = loadShoppingList(user.id)
      if (saved) {
        setListData(saved)
        setCheckedItems(saved.checkedItems || [])
      }
    }
  }, [user?.id])
  
  // Toggle item checked state
  const toggleItem = (itemKey) => {
    const newChecked = checkedItems.includes(itemKey)
      ? checkedItems.filter(k => k !== itemKey)
      : [...checkedItems, itemKey]

    setCheckedItems(newChecked)
    if (user) {
      updateCheckedItems(user.id, newChecked)
    }
  }

  // Toggle expanded state for showing meal breakdown
  const toggleExpanded = (itemKey) => {
    setExpandedItems(prev =>
      prev.includes(itemKey)
        ? prev.filter(k => k !== itemKey)
        : [...prev, itemKey]
    )
  }

  // Format meal slot for display
  const formatMealSlot = (mealType) => {
    const labels = {
      'lunch': 'Lunch',
      'snack_afternoon': 'Snack',
      'dinner': 'Dinner',
      'snack_evening': 'Snack'
    }
    return labels[mealType] || mealType
  }

  // Format date for breakdown display (e.g., "Tue")
  const formatBreakdownDate = (dateKey) => {
    const date = new Date(dateKey)
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  }
  
  // Check if all items in a category are checked
  const isCategoryComplete = (items) => {
    return items.every(item => checkedItems.includes(item.name.toLowerCase()))
  }
  
  // Count totals
  const getTotalCounts = () => {
    if (!listData?.list) return { total: 0, checked: 0 }
    
    let total = 0
    Object.values(listData.list).forEach(items => {
      total += items.length
    })
    
    return { total, checked: checkedItems.length }
  }
  
  // Handle print - generate dedicated print window
  const handlePrint = () => {
    if (!listData?.list) return

    const categories = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'other']

    // Build flat list of all items (no category headers for cleaner print)
    const allItems = []
    categories.forEach(category => {
      const items = listData.list[category] || []
      items.forEach(item => allItems.push(item))
    })

    const itemsHtml = allItems.map(item => {
      const isChecked = checkedItems.includes(item.name.toLowerCase())
      return `
        <li class="${isChecked ? 'checked' : ''}">
          <span class="checkbox">${isChecked ? '☑' : '☐'}</span>
          <span class="name">${item.name}</span>
          <span class="qty">${item.grams}g${item.hint ? ` (${item.hint})` : ''}</span>
        </li>
      `
    }).join('')

    const categoriesHtml = `<ul>${itemsHtml}</ul>`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shopping List - ${listData.weekLabel}</title>
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
            margin: 0 0 4px 0;
          }
          .meta {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ddd;
          }
          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          li {
            padding: 6px 0;
            display: flex;
            gap: 8px;
            align-items: baseline;
            border-bottom: 1px solid #f5f5f5;
          }
          li.checked {
            color: #999;
            text-decoration: line-through;
          }
          .checkbox {
            font-size: 14px;
            flex-shrink: 0;
          }
          .name {
            flex: 1;
          }
          .qty {
            color: #666;
            font-size: 13px;
          }
          .note {
            margin-top: 20px;
            padding: 12px;
            background: #FFF8E7;
            border-radius: 6px;
            font-size: 13px;
            color: #8B6914;
          }
          .close-btn {
            position: fixed;
            top: 16px;
            right: 16px;
            background: #333;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .close-btn:hover {
            background: #555;
          }
          @media print {
            body { padding: 0; }
            .close-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="close-btn" onclick="window.close()">✕ Close</button>
        <h1>Shopping List</h1>
        <div class="meta">${listData.weekLabel} · ${checked}/${total} items</div>
        ${categoriesHtml}
        <div class="note">
          <strong>Pantry staples not listed:</strong> Check olive oil, salt, pepper, and basics.
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      // Auto-trigger print dialog after brief delay
      setTimeout(() => {
        printWindow.print()
      }, 300)
      // Note: Window stays open with close button - user can close manually
      // Safari/iOS often blocks auto-close, so we provide visible button instead
    }
  }
  
  // Handle copy for iOS Reminders
  const handleCopyForReminders = async () => {
    if (!listData?.list) return

    const categories = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'other']
    const sections = []

    categories.forEach(category => {
      const items = listData.list[category] || []
      if (items.length === 0) return

      // Build item lines for this category
      const itemLines = items.map(item => {
        // Format: "Item name - quantity"
        const qty = item.hint || `${item.grams}g`
        return `${item.name} - ${qty}`
      })

      // Add category header and items
      sections.push({
        header: CATEGORY_LABELS[category],
        items: itemLines
      })
    })

    // Build final text with category headers and blank lines between groups
    const textParts = []
    sections.forEach((section, idx) => {
      if (idx > 0) textParts.push('') // Blank line between categories
      textParts.push(section.header)
      textParts.push(...section.items)
    })

    const text = textParts.join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)
    }
  }

  // Handle clear
  const handleClear = () => {
    if (confirm('Clear shopping list? This cannot be undone.')) {
      if (user) {
        clearShoppingList(user.id)
        setListData(null)
        setCheckedItems([])
      }
    }
  }

  // Open day selector with all days with meals pre-selected
  const openDaySelector = () => {
    // Pre-select all days that have meals
    const daysWithMealKeys = daysWithMeals.map(d => toISODate(d))
    setSelectedDays(daysWithMealKeys)
    setShowDaySelector(true)
  }

  // Toggle a day in selection
  const toggleDaySelection = (dateKey) => {
    setSelectedDays(prev =>
      prev.includes(dateKey)
        ? prev.filter(d => d !== dateKey)
        : [...prev, dateKey]
    )
  }

  // Handle update from meal plan with selected days
  const handleUpdateFromMealPlan = (useDateKeys = null) => {
    if (!user) return

    // Use provided date keys or fall back to all week days
    const dateKeysToUse = useDateKeys || weekDateKeys

    // Filter out excluded meals from the meals object
    const filteredMeals = {}
    dateKeysToUse.forEach(dateKey => {
      const dayMeals = meals[dateKey]
      if (dayMeals) {
        const filteredDayMeals = {}
        Object.entries(dayMeals).forEach(([slotId, recipe]) => {
          const exclusionKey = `${dateKey}-${slotId}`
          if (!excludedMeals.includes(exclusionKey)) {
            filteredDayMeals[slotId] = recipe
          }
        })
        if (Object.keys(filteredDayMeals).length > 0) {
          filteredMeals[dateKey] = filteredDayMeals
        }
      }
    })

    // Count meals in selected days (after filtering)
    let mealCount = 0
    dateKeysToUse.forEach(dk => {
      mealCount += Object.keys(filteredMeals[dk] || {}).length
    })

    if (mealCount === 0) return

    setIsUpdating(true)
    setShowDaySelector(false)

    try {
      // Generate shopping list with breakdown data for ingredient sources (using filtered meals)
      const shoppingList = isHouseholdMode && members.length > 0
        ? generateShoppingList(filteredMeals, dateKeysToUse, members, true)
        : generateShoppingList(filteredMeals, dateKeysToUse, 1, true)

      // Create label based on selected dates
      const selectedDates = dateKeysToUse.map(dk => new Date(dk)).sort((a, b) => a - b)
      const weekLabel = selectedDates.length > 0
        ? formatDateRange(selectedDates[0], selectedDates[selectedDates.length - 1])
        : 'Selected days'
      // Include excluded meals in hash so future exclusion changes are detected
      const hash = generateMealPlanHash(meals, dateKeysToUse, excludedMeals)

      saveShoppingList(user.id, shoppingList, weekLabel, hash)

      // Reload the list data
      const saved = loadShoppingList(user.id)
      if (saved) {
        setListData(saved)
        setCheckedItems(saved.checkedItems || [])
      }

      setJustUpdated(true)
      setTimeout(() => setJustUpdated(false), 2000)
    } catch (e) {
      console.error('Failed to update shopping list:', e)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle confirm from day selector
  const handleConfirmDaySelection = () => {
    handleUpdateFromMealPlan(selectedDays)
  }
  
  // No list committed yet
  if (!listData) {
    return (
      <>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <div className="shrink-0 p-4 md:p-6 pb-0">
            <h1 className="text-xl md:text-2xl font-bold">Shopping List</h1>
          </div>

          {/* Centered content area */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-20">
            <div className="max-w-sm text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-medium mb-2">No shopping list yet</h2>
              <p className="text-sm text-muted-foreground mb-8">
                {totalWeekMeals > 0
                  ? 'Your meal plan is ready. Generate your shopping list below.'
                  : 'Plan your week first, then come back to create your shopping list.'}
              </p>

              {/* Add from meal plan button - positioned in bottom third */}
              {totalWeekMeals > 0 && (
                <Button
                  onClick={openDaySelector}
                  disabled={isUpdating}
                  size="lg"
                  className="w-full"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Add this week's meals
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Day Selector Modal */}
        {showDaySelector && (
          <DaySelectorModal
            allDates={allDates}
            selectedDays={selectedDays}
            toggleDaySelection={toggleDaySelection}
            getMealCountForDate={getMealCountForDate}
            getIncludedMealCountForDate={getIncludedMealCountForDate}
            onCancel={() => setShowDaySelector(false)}
            onConfirm={handleConfirmDaySelection}
            isUpdating={isUpdating}
          />
        )}
      </>
    )
  }
  
  const { total, checked } = getTotalCounts()
  const categories = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'other']

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 p-4 md:p-6 pb-2 md:pb-3">
        <div className="flex items-start md:items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Shopping List</h1>
            <p className="text-sm text-muted-foreground">
              {listData.weekLabel} · {checked}/{total} items
            </p>
          </div>

          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handleCopyForReminders} className="shrink-0">
              <Clipboard className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Copy</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="shrink-0">
              <Printer className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} className="shrink-0 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Update from Meal Plan button - three states: in sync, stale, just updated */}
        {totalWeekMeals > 0 && (
          <div className="mt-3 print:hidden">
            {justUpdated ? (
              // Just updated state - green, transient
              <Button
                disabled
                size="sm"
                className="w-full md:w-auto bg-green-600 hover:bg-green-600 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Updated!
              </Button>
            ) : isListStale ? (
              // Out of sync state - amber, prominent
              <>
                <Button
                  onClick={openDaySelector}
                  disabled={isUpdating}
                  size="sm"
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update from meal plan
                </Button>
                <p className="text-xs text-amber-600 mt-1.5">
                  Your meal plan has changed since this list was created.
                </p>
              </>
            ) : (
              // In sync state - muted, subtle
              <Button
                onClick={openDaySelector}
                disabled={isUpdating}
                variant="ghost"
                size="sm"
                className="w-full md:w-auto text-muted-foreground"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                List up to date
              </Button>
            )}
          </div>
        )}

        {/* Committed timestamp */}
        <div className="text-xs text-muted-foreground mt-2 print:hidden">
          Committed: {new Date(listData.committedAt).toLocaleString('en-AU', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Scrollable Shopping List */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 pb-20 md:pb-6">
        <div className="space-y-4 md:space-y-6">
        {categories.map(category => {
          const items = listData.list[category] || []
          if (items.length === 0) return null
          
          const isComplete = isCategoryComplete(items)
          
          return (
            <div key={category} className="bg-card rounded-lg border p-3 md:p-4">
              <h2 className={`font-semibold mb-2 md:mb-3 uppercase text-xs md:text-sm tracking-wide ${isComplete ? 'text-muted-foreground line-through' : ''}`}>
                {CATEGORY_LABELS[category]}
                <span className="text-muted-foreground font-normal ml-2">
                  ({items.filter(i => checkedItems.includes(i.name.toLowerCase())).length}/{items.length})
                </span>
              </h2>
              
              <div className="space-y-1 md:space-y-2">
                {items.map(item => {
                  const itemKey = item.name.toLowerCase()
                  const isChecked = checkedItems.includes(itemKey)
                  const isExpanded = expandedItems.includes(itemKey)
                  const hasSources = item.sources && item.sources.length > 0

                  return (
                    <div key={itemKey}>
                      <div className={`flex items-start gap-3 py-1.5 md:py-1 min-h-[44px] md:min-h-0 ${isChecked ? 'text-muted-foreground' : ''}`}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(itemKey)}
                          className="print:hidden mt-0.5 cursor-pointer"
                        />
                        <div
                          className={`flex-1 print:before:content-['☐_'] print:before:mr-2 ${hasSources ? 'cursor-pointer' : ''}`}
                          onClick={() => hasSources && toggleExpanded(itemKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`${isChecked ? 'line-through' : ''} text-sm md:text-base`}>
                                {item.name}
                              </span>
                              <span className="text-muted-foreground text-xs md:text-sm ml-2">
                                {item.grams}g
                                {item.hint && (
                                  <span className="text-muted-foreground/70 ml-1 md:ml-2">
                                    ({item.hint})
                                  </span>
                                )}
                              </span>
                            </div>
                            {hasSources && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpanded(itemKey); }}
                                className="print:hidden p-1 -mr-1 text-muted-foreground hover:text-foreground"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded meal breakdown */}
                      {isExpanded && hasSources && (
                        <div className="ml-9 mt-1 mb-2 pl-3 border-l-2 border-muted space-y-0.5 print:hidden">
                          {item.sources.map((source, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground flex items-baseline gap-1">
                              <span className="font-medium text-foreground/70">
                                {formatBreakdownDate(source.date)} {formatMealSlot(source.mealType)}:
                              </span>
                              <span className="truncate">{source.recipe}</span>
                              <span className="ml-auto shrink-0">{source.grams}g</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        </div>

        {/* Pantry staples reminder */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg print:bg-white">
          <div className="flex gap-2 md:gap-3">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 text-sm md:text-base">Pantry staples not listed</h3>
              <p className="text-xs md:text-sm text-amber-700 mt-1">
                Check: olive oil, salt, pepper, and basics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector Modal */}
      {showDaySelector && (
        <DaySelectorModal
          allDates={allDates}
          selectedDays={selectedDays}
          toggleDaySelection={toggleDaySelection}
          getMealCountForDate={getMealCountForDate}
          getIncludedMealCountForDate={getIncludedMealCountForDate}
          onCancel={() => setShowDaySelector(false)}
          onConfirm={handleConfirmDaySelection}
          isUpdating={isUpdating}
        />
      )}

      {/* Copied to clipboard toast */}
      {showCopiedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check className="h-4 w-4" />
          Copied to clipboard
        </div>
      )}
    </div>
  )
}

// Day Selector Modal Component
function DaySelectorModal({
  allDates,
  selectedDays,
  toggleDaySelection,
  getMealCountForDate,
  getIncludedMealCountForDate,
  onCancel,
  onConfirm,
  isUpdating
}) {
  // Count non-excluded meals in selected days (for summary)
  const selectedMealCount = selectedDays.reduce((count, dateKey) => {
    return count + (getIncludedMealCountForDate(new Date(dateKey)) || 0)
  }, 0)

  // Format date for display
  const formatDayLabel = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${days[date.getDay()]} ${date.getDate()}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl p-5 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Which days to shop for?</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {allDates.map(date => {
            const dateKey = toISODate(date)
            const mealCount = getMealCountForDate(date)
            const isSelected = selectedDays.includes(dateKey)
            const hasMeals = mealCount > 0

            return (
              <button
                key={dateKey}
                onClick={() => hasMeals && toggleDaySelection(dateKey)}
                disabled={!hasMeals}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : hasMeals
                      ? 'bg-card border-border hover:border-primary/50'
                      : 'bg-muted/30 border-transparent text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <div className="font-medium text-sm">{formatDayLabel(date)}</div>
                <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
                  {hasMeals ? `${mealCount} meal${mealCount !== 1 ? 's' : ''}` : 'No meals'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selection summary */}
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {selectedDays.length === 0 ? (
            'Select at least one day'
          ) : (
            <>
              {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected
              {' · '}
              {selectedMealCount} meal{selectedMealCount !== 1 ? 's' : ''}
            </>
          )}
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={selectedDays.length === 0 || isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShoppingCart className="h-4 w-4 mr-2" />
            )}
            Add Selected
          </Button>
        </div>
      </div>
    </div>
  )
}
