'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import {
  getDatesFromStart,
  formatDateRange,
  formatDayTab,
  formatDayHeader,
  isSameDay,
  toISODate
} from '@/lib/dates'
import { generateDayMeals, getAlternativesForSlot } from '@/lib/mealPlanner'
import {
  generateSmartWeek,
  generateSmartWeekForHousehold,
  calculateMemberPortion,
  calculateMemberDayTotals,
  formatPortion
} from '@/lib/smartPlanner'
import { generateShoppingList, saveShoppingList, loadShoppingList, generateMealPlanHash } from '@/lib/shoppingList'
import { RefreshCw, X, Clock, ShoppingCart, Check, AlertCircle, Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

// Meal slots for the day (16:8 fasting window: 12:00-20:00)
const MEAL_SLOTS = [
  { id: 'lunch', label: 'Lunch', icon: '🥗', time: '12:00' },
  { id: 'snack_afternoon', label: 'Afternoon Snack', icon: '🍎', time: '15:00' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', time: '18:00' },
  { id: 'snack_evening', label: 'Evening Snack', icon: '🫐', time: '19:30' },
]

// Number of days to show in slider
const VISIBLE_DAYS = 7

export default function WeekView() {
  const {
    user,
    targets,
    household,
    members,
    activeMember,
    setActiveMember,
    isHouseholdMode,
    householdDietaryRestrictions
  } = useUser()
  
  // Today is always the starting point
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  
  // Generate dates starting from today
  const allDates = useMemo(() => getDatesFromStart(today, VISIBLE_DAYS), [today])
  
  // LocalStorage key for this user's meals
  const storageKey = user ? `meal-plan-${user.id}` : 'meal-plan-guest'
  
  // Refs for scrolling
  const scrollContainerRef = useRef(null)
  
  // State - initialize with defaults, hydrate in useEffect to avoid SSR mismatch
  const [selectedDate, setSelectedDateState] = useState(today)
  
  // Wrapper to also dispatch event when date changes
  const setSelectedDate = (date) => {
    setSelectedDateState(date)
    // Notify sidebar of date change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('planner-date-changed', { 
        detail: { date: toISODate(date) } 
      }))
    }
  }
  const [meals, setMeals] = useState({})
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedForGeneration, setSelectedForGeneration] = useState([]) // Date keys selected for Smart Generate
  
  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setSelectedDate(today)
    
    // Default: select first 7 days for generation
    const defaultSelected = allDates.slice(0, 7).map(d => toISODate(d))
    setSelectedForGeneration(defaultSelected)
    
    // Load meals from localStorage
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          setMeals(JSON.parse(saved))
        }
      } catch (e) {
        console.error('Failed to load meals from localStorage:', e)
      }
    }
    
    setIsHydrated(true)
  }, [])
  
  const [swappingSlot, setSwappingSlot] = useState(null)
  const [justCommitted, setJustCommitted] = useState(false)
  const [committedHash, setCommittedHash] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  
  // Load committed hash on mount
  useEffect(() => {
    if (user) {
      const saved = loadShoppingList(user.id)
      if (saved?.mealPlanHash) {
        setCommittedHash(saved.mealPlanHash)
      }
    }
  }, [user?.id])
  
  // Save to localStorage whenever meals change
  const saveMeals = (newMeals) => {
    setMeals(newMeals)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMeals))
      } catch (e) {
        console.error('Failed to save meals to localStorage:', e)
      }
    }
  }
  
  // Reload from localStorage when user changes
  useEffect(() => {
    if (isHydrated && user) {
      try {
        const saved = localStorage.getItem(storageKey)
        setMeals(saved ? JSON.parse(saved) : {})
      } catch (e) {
        console.error('Failed to reload meals:', e)
      }
    }
  }, [user?.id, isHydrated, storageKey])
  
  // Get meals for selected day
  const selectedDateKey = toISODate(selectedDate)
  const dayMeals = meals[selectedDateKey] || {}
  
  // Get all used recipe IDs (for variety)
  const usedRecipeIds = useMemo(() => {
    const ids = []
    Object.values(meals).forEach(dayMeals => {
      Object.values(dayMeals).forEach(recipe => {
        if (recipe?.id && !ids.includes(recipe.id)) {
          ids.push(recipe.id)
        }
      })
    })
    return ids
  }, [meals])
  
  // Calculate day totals
  const dayTotals = useMemo(() => {
    if (isHouseholdMode && activeMember) {
      return calculateMemberDayTotals(dayMeals, activeMember)
    }

    const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 }
    Object.values(dayMeals).forEach(recipe => {
      if (recipe?.per_serve) {
        totals.calories += recipe.per_serve.calories || 0
        totals.protein += recipe.per_serve.protein_g || 0
        totals.fat += recipe.per_serve.fat_g || 0
        totals.carbs += recipe.per_serve.carbs_g || 0
      }
    })
    return totals
  }, [dayMeals, isHouseholdMode, activeMember])

  // Toggle a date for generation selection
  const toggleDateSelection = (dateKey, e) => {
    e.stopPropagation() // Don't trigger the view selection
    
    setSelectedForGeneration(prev => {
      if (prev.includes(dateKey)) {
        return prev.filter(d => d !== dateKey)
      } else {
        // Keep sorted by date
        const newSelection = [...prev, dateKey].sort()
        return newSelection
      }
    })
  }
  
  // Select all / clear all
  const selectAllDays = () => {
    setSelectedForGeneration(allDates.map(d => toISODate(d)))
  }
  
  const clearAllDays = () => {
    setSelectedForGeneration([])
  }

  // Generate meals using AI (for selected days)
  const handleSmartGenerateWeek = async () => {
    if (!user || !targets) {
      setGenerationError('Please set up your profile first')
      return
    }
    
    if (selectedForGeneration.length === 0) {
      setGenerationError('Please select at least one day to generate')
      return
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      let result

      if (isHouseholdMode && members.length > 0) {
        result = await generateSmartWeekForHousehold(members, {
          batchFriendly: true,
          ...householdDietaryRestrictions,
        })
      } else {
        result = await generateSmartWeek(user, targets, {
          dairyFree: false,
          glutenFree: false,
          batchFriendly: true,
        })
      }

      // Apply generated meals only to selected days
      const newMeals = { ...meals }
      const planKeys = Object.keys(result.weekPlan)
      selectedForGeneration.forEach((dateKey, index) => {
        // Use modulo in case we have more selected days than generated
        const planIndex = index % planKeys.length
        if (result.weekPlan[planIndex]?.meals) {
          newMeals[dateKey] = result.weekPlan[planIndex].meals
        }
      })

      saveMeals(newMeals)
      setSwappingSlot(null)

      console.log('Smart generation cost:', result.usage?.estimated_cost)

    } catch (error) {
      console.error('Smart generation failed:', error)
      setGenerationError(error.message || 'Failed to generate meals')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Swap a meal in a slot
  const handleSwapMeal = (slotId, newRecipe) => {
    saveMeals({
      ...meals,
      [selectedDateKey]: {
        ...meals[selectedDateKey],
        [slotId]: newRecipe
      }
    })
    setSwappingSlot(null)
  }
  
  // Clear a slot
  const handleClearSlot = (slotId) => {
    const newDayMeals = { ...meals[selectedDateKey] }
    delete newDayMeals[slotId]
    saveMeals({
      ...meals,
      [selectedDateKey]: newDayMeals
    })
    setSwappingSlot(null)
  }
  
  // Get alternatives for current swap
  const alternatives = useMemo(() => {
    if (!swappingSlot) return []
    const currentRecipe = dayMeals[swappingSlot]
    return getAlternativesForSlot(
      swappingSlot, 
      currentRecipe?.id, 
      usedRecipeIds
    )
  }, [swappingSlot, dayMeals, usedRecipeIds])
  
  // Count meals planned in selected days
  const selectedMealCount = useMemo(() => {
    let count = 0
    selectedForGeneration.forEach(dateKey => {
      count += Object.keys(meals[dateKey] || {}).length
    })
    return count
  }, [meals, selectedForGeneration])
  
  // Calculate current meal plan hash (for selected days)
  const currentHash = useMemo(() => {
    return generateMealPlanHash(meals, selectedForGeneration)
  }, [meals, selectedForGeneration])
  
  // Check if shopping list is stale
  const isListStale = committedHash && currentHash !== committedHash
  
  // Get dates for selected generation range (for display)
  const selectedDatesForDisplay = useMemo(() => {
    if (selectedForGeneration.length === 0) return null
    const sorted = [...selectedForGeneration].sort()
    const first = new Date(sorted[0] + 'T00:00:00')
    const last = new Date(sorted[sorted.length - 1] + 'T00:00:00')
    return { first, last }
  }, [selectedForGeneration])
  
  // Commit to shopping list (for selected days)
  const handleCommitToShoppingList = () => {
    if (!user) return
    if (selectedForGeneration.length === 0) return

    const shoppingList = isHouseholdMode && members.length > 0
      ? generateShoppingList(meals, selectedForGeneration, members)
      : generateShoppingList(meals, selectedForGeneration, 1)

    const weekLabel = selectedDatesForDisplay 
      ? formatDateRange(selectedDatesForDisplay.first, selectedDatesForDisplay.last)
      : 'Selected days'
    const hash = generateMealPlanHash(meals, selectedForGeneration)

    saveShoppingList(user.id, shoppingList, weekLabel, hash)
    setCommittedHash(hash)

    setJustCommitted(true)
    setTimeout(() => setJustCommitted(false), 2000)
  }
  
  // Scroll handlers for day strip
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= 200
    }
  }
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += 200
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl md:text-2xl font-bold">Planner</h1>
          <div className="flex gap-2 text-xs">
            <button 
              onClick={selectAllDays}
              className="text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground">·</span>
            <button 
              onClick={clearAllDays}
              className="text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedForGeneration.length > 0 && selectedDatesForDisplay
            ? `${selectedForGeneration.length} days selected · ${formatDateRange(selectedDatesForDisplay.first, selectedDatesForDisplay.last)}`
            : 'Select days to generate'
          }
        </p>
      </div>

      {/* Error message */}
      {generationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {generationError}
          <button
            onClick={() => setGenerationError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Day Strip + Action Buttons */}
      <div className="flex items-stretch gap-2 mb-6 pb-4 border-b">
        {/* Day cards */}
        <div className="flex gap-1.5 flex-1">
          {allDates.map((date) => {
            const dateKey = toISODate(date)
            const isViewing = isSameDay(date, selectedDate)
            const isToday = isSameDay(date, today)
            const isSelectedForGen = selectedForGeneration.includes(dateKey)
            const dayMealCount = Object.keys(meals[dateKey] || {}).length
            const dayOfWeek = date.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            
            return (
              <div
                key={dateKey}
                className={`flex-1 min-w-0 rounded-lg overflow-hidden border transition-all ${
                  isViewing 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : isSelectedForGen
                      ? 'bg-muted border-foreground/30 shadow-inner'
                      : isWeekend
                        ? 'bg-muted/60 border-border hover:border-muted-foreground/50'
                        : 'bg-card border-border hover:border-muted-foreground/50'
                }`}
              >
                {/* Clickable date area */}
                <button
                  onClick={() => {
                    setSelectedDate(date)
                    setSwappingSlot(null)
                  }}
                  className="w-full py-2 px-1 text-center"
                >
                  <div className="text-xs font-medium truncate">{formatDayTab(date)}</div>
                  {dayMealCount > 0 ? (
                    <div className={`text-[10px] mt-0.5 ${isViewing ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {dayMealCount} meals
                    </div>
                  ) : isToday && !isViewing ? (
                    <div className="text-[10px] mt-0.5 text-primary font-medium">Today</div>
                  ) : (
                    <div className="text-[10px] mt-0.5 text-transparent">-</div>
                  )}
                </button>
                
                {/* Select button at bottom */}
                <button
                  onClick={(e) => toggleDateSelection(dateKey, e)}
                  className={`w-full py-1 text-[10px] font-medium transition-colors border-t ${
                    isSelectedForGen
                      ? isViewing
                        ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20'
                        : 'bg-foreground/10 text-foreground border-foreground/10'
                      : isViewing
                        ? 'bg-primary-foreground/10 text-primary-foreground/70 border-primary-foreground/20 hover:bg-primary-foreground/20'
                        : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {isSelectedForGen ? '✓' : 'Select'}
                </button>
              </div>
            )
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button 
            size="sm"
            onClick={handleSmartGenerateWeek}
            disabled={isGenerating || !user || selectedForGeneration.length === 0}
            className="h-auto py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 text-xs"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate
              </>
            )}
          </Button>
          
          <Button 
            size="sm"
            variant={justCommitted ? "default" : isListStale ? "default" : "outline"}
            onClick={handleCommitToShoppingList}
            disabled={selectedMealCount === 0}
            className={`h-auto py-2 px-3 text-xs ${
              justCommitted 
                ? "bg-green-600 hover:bg-green-600" 
                : isListStale 
                  ? "bg-amber-500 hover:bg-amber-600" 
                  : ""
            }`}
          >
            {justCommitted ? (
              <><Check className="h-3.5 w-3.5 mr-1" />Done</>
            ) : isListStale ? (
              <><AlertCircle className="h-3.5 w-3.5 mr-1" />Update</>
            ) : committedHash ? (
              <><Check className="h-3.5 w-3.5 mr-1" />Ready</>
            ) : (
              <><ShoppingCart className="h-3.5 w-3.5 mr-1" />Commit</>
            )}
          </Button>
        </div>
      </div>
      
      {/* Day Detail */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{formatDayHeader(selectedDate)}</h2>
        
        {/* Meal Slots */}
        <div className="space-y-4">
          {MEAL_SLOTS.map(slot => {
            const recipe = dayMeals[slot.id]
            const isSwapping = swappingSlot === slot.id
            
            return (
              <div key={slot.id}>
                <MealSlotCard 
                  slot={slot}
                  recipe={recipe}
                  onSwap={() => setSwappingSlot(isSwapping ? null : slot.id)}
                  onClear={() => handleClearSlot(slot.id)}
                  isSwapping={isSwapping}
                  members={members}
                  isHouseholdMode={isHouseholdMode}
                />
                
                {/* Alternatives Panel */}
                {isSwapping && (
                  <div className="mt-2 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Choose alternative:</h4>
                      <button 
                        onClick={() => setSwappingSlot(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {alternatives.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {alternatives.slice(0, 6).map(alt => (
                          <button
                            key={alt.id}
                            onClick={() => handleSwapMeal(slot.id, alt)}
                            className="text-left p-3 bg-card border rounded-lg hover:border-primary transition-colors"
                          >
                            <div className="font-medium text-sm">{alt.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {alt.per_serve?.calories} cal · {alt.total_time_mins} min
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No alternatives available. Try generating new meals.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Day Totals - Single User (non-household mode) */}
        {Object.keys(dayMeals).length > 0 && !isHouseholdMode && targets && (
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted/30 rounded-lg">
            <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">Day Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <MacroProgress
                label="Calories"
                current={dayTotals.calories}
                target={targets.dailyCalories}
              />
              <MacroProgress
                label="Protein"
                current={dayTotals.protein}
                target={targets.protein}
                unit="g"
              />
              <MacroProgress
                label="Fat"
                current={dayTotals.fat}
                target={targets.fat}
                unit="g"
              />
              <MacroProgress
                label="Carbs"
                current={dayTotals.carbs}
                target={targets.carbs}
                unit="g"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-component: Meal slot card
function MealSlotCard({ slot, recipe, onSwap, onClear, isSwapping, members, isHouseholdMode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Calculate household portions for ingredient scaling
  // Must be before any early returns to satisfy Rules of Hooks
  const householdPortions = useMemo(() => {
    if (!isHouseholdMode || !members || members.length === 0 || !recipe) {
      return { total: 1, breakdown: [] }
    }
    
    const portions = members.map(member => {
      const portion = calculateMemberPortion(member, recipe, slot.id)
      return { name: member.name, portion, isPrimary: member.is_primary }
    })
    
    const total = portions.reduce((sum, p) => sum + p.portion, 0)
    
    // Calculate percentages
    const breakdown = portions.map(p => ({
      ...p,
      percentage: Math.round((p.portion / total) * 100)
    }))
    
    return { total, breakdown }
  }, [isHouseholdMode, members, recipe, slot.id])
  
  if (!recipe) {
    return (
      <div className="border border-dashed rounded-lg p-4 flex items-center justify-between">
        <div className="text-muted-foreground">
          <span className="text-xl mr-2">{slot.icon}</span>
          <span className="text-sm">{slot.label} - Not planned</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onSwap}>
          Add
        </Button>
      </div>
    )
  }
  
  const macros = recipe.per_serve || {}
  
  return (
    <div className={`border rounded-lg overflow-hidden ${isSwapping ? 'border-primary' : ''}`}>
      {/* Header */}
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{slot.icon}</span>
              <span className="uppercase tracking-wide">{slot.label}</span>
              <span>• {slot.time}</span>
              {recipe.total_time_mins && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recipe.total_time_mins} min
                </span>
              )}
            </div>
            <h3 className="font-medium">{recipe.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {recipe.description}
            </p>
          </div>
          <div className="text-right text-sm ml-4">
            <div className="font-medium">{macros.calories} cal</div>
            <div className="text-xs text-muted-foreground">
              {macros.protein_g}P · {macros.fat_g}F · {macros.carbs_g}C
            </div>
          </div>
        </div>
        
        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary hover:underline"
          >
            {isExpanded ? 'Hide recipe ▲' : 'View recipe ▼'}
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button 
            onClick={onSwap}
            className={`text-sm hover:underline ${isSwapping ? 'text-primary font-medium' : 'text-muted-foreground'}`}
          >
            <RefreshCw className="h-3 w-3 inline mr-1" />
            Swap
          </button>
          <button 
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
      
      {/* Expanded Recipe */}
      {isExpanded && (
        <div className="p-4 bg-muted/30 border-t space-y-4">
          {/* Ingredients */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Ingredients
              {isHouseholdMode && householdPortions.breakdown.length > 0 && (
                <span className="font-normal text-muted-foreground ml-2">
                  (serves {householdPortions.breakdown.length})
                </span>
              )}
            </h4>
            <ul className="text-sm space-y-1">
              {recipe.ingredients?.map((ing, i) => {
                const scaledGrams = isHouseholdMode && householdPortions.total > 1
                  ? Math.round(ing.grams * householdPortions.total)
                  : ing.grams
                return (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground w-12">{scaledGrams}g</span>
                    <span>{ing.name}</span>
                    {ing.notes && <span className="text-muted-foreground">({ing.notes})</span>}
                  </li>
                )
              })}
            </ul>
            
            {/* Portion guidance for household */}
            {isHouseholdMode && householdPortions.breakdown.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Portions:</span>{' '}
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
          
          {/* Instructions */}
          <div>
            <h4 className="text-sm font-medium mb-2">Method</h4>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              {recipe.instructions?.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          
          {/* Batch notes */}
          {recipe.batch_notes && (
            <div className="text-sm text-muted-foreground italic">
              💡 {recipe.batch_notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Sub-component: Macro progress bar
function MacroProgress({ label, current, target, unit = '' }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isOver = current > target
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={isOver ? 'text-amber-600 font-medium' : ''}>
          {Math.round(current)}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${isOver ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
